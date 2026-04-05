#!/usr/bin/env node

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { parse as parseCsv } from 'csv-parse/sync';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import { ConcurrencyLimiter } from './lib/concurrency-limiter';
import { retryWithBackoff } from './lib/retry-with-backoff';

loadEnv({ path: resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });

const FIRECRAWL_API_BASE = 'https://api.firecrawl.dev/v2';
const FIBER_API_BASE = 'https://api.fiber.ai';
const DEFAULT_INPUT = resolve(
  process.cwd(),
  'hotelleriesuisse-members-hotels-switzerland.enriched-master.csv',
);
const DEFAULT_OUTPUT_DIR = resolve(process.cwd(), 'output/hotel-contact-enrichment');
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_SEARCH_LIMIT = 5;
const SWISS_COUNTRY_CODE = 'CHE';
const ROLE_TERMS = [
  'General Manager',
  'Deputy General Manager',
  'Hotel Manager',
  'Managing Director',
  'CEO',
  'Founder',
  'Direktor',
  'Direktorin',
  'Geschäftsführer',
  'Directeur',
  'Directeur général',
  'Direttore',
  'Direttore generale',
  'Owner',
];
const PAGE_ROLE_QUERY =
  '"General Manager" OR "Hotel Manager" OR "Managing Director" OR "Geschäftsführer" OR "Directeur" OR "Direttore" OR Owner';
const TEAM_QUERY =
  'team OR management OR leadership OR about OR contact OR presse OR media OR "ueber uns" OR "uber uns" OR "a propos" OR "chi siamo"';
const DISALLOWED_SEARCH_HOSTS = [
  'booking.com',
  'tripadvisor.',
  'agoda.com',
  'expedia.',
  'hotels.com',
  'kayak.',
  'trivago.',
  'facebook.com',
  'instagram.com',
  'x.com',
  'twitter.com',
  'myswitzerland.com',
  'hotelleriesuisse.ch',
  'google.',
  'yelp.',
  'guestreservations.com',
  'searchhounds.com',
];
const GENERIC_EMAIL_PREFIXES = new Set([
  'info',
  'hello',
  'contact',
  'reservations',
  'reservation',
  'booking',
  'bookings',
  'frontoffice',
  'front-desk',
  'frontdesk',
  'guestservice',
  'guestservices',
  'welcome',
  'sales',
  'events',
  'event',
  'team',
  'office',
  'admin',
  'reception',
  'hotel',
  'stay',
  'service',
]);
const STOPWORDS = new Set([
  'hotel',
  'hotels',
  'the',
  'and',
  'und',
  'et',
  'de',
  'des',
  'der',
  'di',
  'la',
  'le',
  'les',
  'at',
  'by',
  'zurich',
  'zuerich',
  'city',
]);
const CONTACT_FIELDS = [
  'dm_status',
  'dm_name',
  'dm_title',
  'dm_role_category',
  'dm_linkedin_url',
  'dm_work_email',
  'dm_work_email_status',
  'dm_personal_email',
  'dm_personal_email_status',
  'dm_phone',
  'dm_profile_headline',
  'dm_profile_locality',
  'dm_current_company',
  'dm_confidence_score',
  'dm_found_via',
  'dm_source_channels',
  'dm_source_urls',
  'dm_match_notes',
  'dm_insights',
  'dm_updated_at',
  'dm_error',
] as const;

const PERSON_NAME_PREFIX_RE =
  /^(mr|mrs|ms|miss|dr|prof|frau|herr|monsieur|madame|mme|mlle|signor|signora|für|fuer)\.?\s+/i;
const HOSPITALITY_KEYWORD_RE =
  /\b(hotel|hotels|hospitality|resort|resorts|hostel|lodging|collection|apartments|aparthotel|suites|spa)\b/i;
const NON_DECISION_ROLE_RE =
  /\b(assistant|coordinator|co-ordinator|guest relations|revenue|reservations|reservation|restaurant ?manager|food|beverage|chef|sales|marketing|front office|front desk|housekeeping|spa manager|event|events|human resources|hr)\b/i;

type CsvRow = Record<string, string>;

type DecisionMakerStatus = 'resolved' | 'partial' | 'unresolved' | 'error';

interface CliConfig {
  inputPath: string;
  outputDir: string;
  limit: number | null;
  offset: number;
  concurrency: number;
  resume: boolean;
  rerunErrors: boolean;
  onlyMissing: boolean;
  skipFirecrawl: boolean;
  skipFiber: boolean;
}

interface HotelContext {
  slug: string;
  name: string;
  location: string | null;
  address: string | null;
  websiteUrl: string | null;
  websiteDomain: string | null;
  email: string | null;
  gmName: string | null;
  gmTitle: string | null;
  gmSourceUrl: string | null;
}

interface WebsitePersonCandidate {
  name: string | null;
  title: string | null;
  email: string | null;
  linkedinUrl: string | null;
  evidence: string | null;
  sourceUrl: string | null;
  sourceType: 'csv' | 'website_page' | 'linkedin_search' | 'email_lookup_seed';
  seedScore: number;
}

interface FirecrawlSearchResult {
  url?: string;
  title?: string;
  description?: string;
}

interface WebsiteExtraction {
  people: Array<{
    name?: string | null;
    title?: string | null;
    email?: string | null;
    linkedinUrl?: string | null;
    evidence?: string | null;
  }>;
  companyLinkedInUrls: string[];
  pageSummary: string;
}

interface FiberProfile {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  url: string | null;
  primarySlug: string | null;
  locality: string | null;
  currentJobTitle: string | null;
  currentCompany: string | null;
  rawCompanyName: string | null;
  source: string;
}

interface FiberCompany {
  preferredName: string | null;
  domains: string[];
  linkedinPrimarySlug: string | null;
  linkedinUrl: string | null;
  linkedInOrgId: string | null;
  source: string;
}

interface RevealedContact {
  workEmail: string | null;
  workEmailStatus: string | null;
  personalEmail: string | null;
  personalEmailStatus: string | null;
  phone: string | null;
}

interface EnrichmentResult {
  slug: string;
  hotelName: string;
  status: DecisionMakerStatus;
  resolvedPersonName: string | null;
  resolvedTitle: string | null;
  roleCategory: string | null;
  linkedinUrl: string | null;
  workEmail: string | null;
  workEmailStatus: string | null;
  personalEmail: string | null;
  personalEmailStatus: string | null;
  phone: string | null;
  headline: string | null;
  locality: string | null;
  currentCompany: string | null;
  confidenceScore: number;
  foundVia: string | null;
  sourceChannels: string[];
  sourceUrls: string[];
  notes: string;
  insights: string;
  error: string | null;
  updatedAt: string;
}

interface CacheRecord {
  slug: string;
  result: EnrichmentResult;
}

interface RunMetrics {
  firecrawlSearchRequests: number;
  firecrawlScrapeRequests: number;
  fiberCompanyLookupCalls: number;
  fiberPeopleSearchCalls: number;
  fiberKitchenSinkCalls: number;
  fiberLiveFetchCalls: number;
  fiberContactRevealCalls: number;
  fiberEmailLookupCalls: number;
  fiberCreditsCharged: number;
}

const EMPTY_METRICS: RunMetrics = {
  firecrawlSearchRequests: 0,
  firecrawlScrapeRequests: 0,
  fiberCompanyLookupCalls: 0,
  fiberPeopleSearchCalls: 0,
  fiberKitchenSinkCalls: 0,
  fiberLiveFetchCalls: 0,
  fiberContactRevealCalls: 0,
  fiberEmailLookupCalls: 0,
  fiberCreditsCharged: 0,
};

function parseArg(args: string[], name: string, fallback?: string): string | undefined {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) {
    return prefixed.slice(name.length + 1);
  }
  return fallback;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function toNullable(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toInt(value: string | undefined, fallback: number | null): number | null {
  if (value == null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeHostname(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

function normalizeDomain(value: string | null): string | null {
  if (!value) return null;
  return value
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase();
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function cleanPersonName(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(PERSON_NAME_PREFIX_RE, '').replace(/\s+/g, ' ').trim() || null;
}

function tokenise(value: string | null): string[] {
  if (!value) return [];
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }
  return output;
}

function looksLikeLinkedInProfile(url: string | null): boolean {
  if (!url) return false;
  return /linkedin\.com\/in\//i.test(url);
}

function looksLikeNamedEmail(email: string | null): boolean {
  if (!email || !email.includes('@')) return false;
  const local = email.split('@')[0].toLowerCase();
  if (GENERIC_EMAIL_PREFIXES.has(local)) return false;
  if (/^(booking|reservation|event|sales|marketing|office|hotel|frontdesk)/.test(local)) return false;
  return /[._-]/.test(local) || /^[a-z]{4,}[0-9]*$/.test(local);
}

function getContextTokens(context: HotelContext): string[] {
  const brandStem = context.websiteDomain ? context.websiteDomain.split('.')[0].replace(/-/g, ' ') : null;
  return uniqueStrings([
    ...tokenise(context.name),
    ...tokenise(context.location),
    ...tokenise(brandStem),
  ]);
}

function blobMatchesHotelContext(blob: string, context: HotelContext): boolean {
  const normalizedBlob = normalizeText(blob);
  return getContextTokens(context).some((token) => normalizedBlob.includes(token));
}

function blobMatchesKnownPerson(blob: string, name: string | null): boolean {
  const cleanName = cleanPersonName(name);
  if (!cleanName) return false;
  const normalizedBlob = normalizeText(blob);
  const nameParts = normalizeText(cleanName)
    .split(/\s+/)
    .filter((part) => part.length >= 3);
  return nameParts.length > 0 && nameParts.every((part) => normalizedBlob.includes(part));
}

function trimPipeJoined(values: string[]): string {
  return uniqueStrings(values).join(' | ');
}

function buildContext(row: CsvRow): HotelContext {
  const websiteUrl = toNullable(row.websiteUrl);
  return {
    slug: row.slug,
    name: row.name,
    location: toNullable(row.location),
    address: toNullable(row.address),
    websiteUrl,
    websiteDomain: normalizeHostname(websiteUrl),
    email: toNullable(row.email),
    gmName: cleanPersonName(toNullable(row.gmName)),
    gmTitle: toNullable(row.gmTitle),
    gmSourceUrl: toNullable(row.gmSourceUrl),
  };
}

function buildConfig(args: string[]): CliConfig {
  return {
    inputPath: resolve(parseArg(args, '--input', DEFAULT_INPUT)!),
    outputDir: resolve(parseArg(args, '--output-dir', DEFAULT_OUTPUT_DIR)!),
    limit: toInt(parseArg(args, '--limit'), null),
    offset: toInt(parseArg(args, '--offset'), 0) ?? 0,
    concurrency: toInt(parseArg(args, '--concurrency'), DEFAULT_CONCURRENCY) ?? DEFAULT_CONCURRENCY,
    resume: !hasFlag(args, '--no-resume'),
    rerunErrors: hasFlag(args, '--rerun-errors'),
    onlyMissing: hasFlag(args, '--only-missing'),
    skipFirecrawl: hasFlag(args, '--skip-firecrawl'),
    skipFiber: hasFlag(args, '--skip-fiber'),
  };
}

function buildDecisionMakerSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      people: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: ['string', 'null'] },
            title: { type: ['string', 'null'] },
            email: { type: ['string', 'null'] },
            linkedinUrl: { type: ['string', 'null'] },
            evidence: { type: ['string', 'null'] },
          },
          required: ['name', 'title', 'email', 'linkedinUrl', 'evidence'],
        },
      },
      companyLinkedInUrls: {
        type: 'array',
        items: { type: 'string' },
      },
      pageSummary: {
        type: 'string',
      },
    },
    required: ['people', 'companyLinkedInUrls', 'pageSummary'],
  };
}

function loadCsv(path: string): CsvRow[] {
  const content = readFileSync(path, 'utf-8');
  return parseCsv(content, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
  }) as CsvRow[];
}

function loadCache(cachePath: string): Map<string, EnrichmentResult> {
  const map = new Map<string, EnrichmentResult>();
  if (!existsSync(cachePath)) {
    return map;
  }
  const lines = readFileSync(cachePath, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as CacheRecord | EnrichmentResult;
      const result = 'result' in parsed ? parsed.result : parsed;
      map.set(result.slug, result);
    } catch {
      // Ignore malformed cache lines.
    }
  }
  return map;
}

function appendCache(cachePath: string, result: EnrichmentResult): void {
  appendFileSync(cachePath, `${JSON.stringify({ slug: result.slug, result })}\n`, 'utf-8');
}

function shouldProcessRow(row: CsvRow, cached: EnrichmentResult | undefined, config: CliConfig): boolean {
  if (!cached) return true;
  if (config.rerunErrors && (cached.status === 'error' || cached.status === 'unresolved')) {
    return true;
  }
  if (!config.resume) return true;
  return false;
}

function rowNeedsDecisionMaker(row: CsvRow): boolean {
  return !(row.dm_status && row.dm_status.trim() === 'resolved');
}

function buildScopedRows(rows: CsvRow[], config: CliConfig): CsvRow[] {
  const filtered = config.onlyMissing ? rows.filter(rowNeedsDecisionMaker) : rows;
  const sliced = filtered.slice(config.offset);
  return config.limit == null ? sliced : sliced.slice(0, config.limit);
}

function isOfficialHost(url: string, host: string | null): boolean {
  if (!host) return false;
  try {
    const candidateHost = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
    return candidateHost === host || candidateHost.endsWith(`.${host}`);
  } catch {
    return false;
  }
}

function seedCandidatesFromRow(context: HotelContext): WebsitePersonCandidate[] {
  const seeded: WebsitePersonCandidate[] = [];
  if (context.gmName) {
    seeded.push({
      name: context.gmName,
      title: context.gmTitle,
      email: null,
      linkedinUrl: null,
      evidence: context.gmSourceUrl ? `Existing GM field sourced from ${context.gmSourceUrl}` : 'Existing GM field in CSV',
      sourceUrl: context.gmSourceUrl,
      sourceType: 'csv',
      seedScore: 65,
    });
  }
  if (looksLikeNamedEmail(context.email)) {
    seeded.push({
      name: null,
      title: null,
      email: context.email,
      linkedinUrl: null,
      evidence: 'Named email already present in CSV',
      sourceUrl: context.websiteUrl,
      sourceType: 'email_lookup_seed',
      seedScore: 40,
    });
  }
  return seeded;
}

function buildOfficialQueries(context: HotelContext): string[] {
  if (!context.websiteDomain) return [];
  const hotel = `"${context.name}"`;
  const location = context.location ? `"${context.location}"` : '';
  return [
    `site:${context.websiteDomain} ${hotel} (${PAGE_ROLE_QUERY}) ${location}`.trim(),
    `site:${context.websiteDomain} ${hotel} (${TEAM_QUERY}) ${location}`.trim(),
  ];
}

function buildLinkedInQueries(context: HotelContext): string[] {
  const hotel = `"${context.name}"`;
  const location = context.location ? `"${context.location}"` : '';
  const brandStem = context.websiteDomain ? context.websiteDomain.split('.')[0].replace(/-/g, ' ') : '';
  const brand = brandStem ? `"${brandStem}"` : '';
  const brandShort = brandStem ? `"${brandStem.split(/\s+/)[0]}"` : '';
  const hotelShort = `"${tokenise(context.name)[0] ?? normalizeText(context.name).split(/\s+/)[0] ?? 'hotel'}"`;
  const queries = [
    `site:linkedin.com/in ${hotel} (${PAGE_ROLE_QUERY}) ${location}`.trim(),
    `site:linkedin.com/in (${hotel} OR ${brand}) ${location}`.trim(),
  ];
  if (context.gmName) {
    queries.unshift(`site:linkedin.com/in "${context.gmName}" ${brandShort} ${location}`.trim());
    queries.unshift(`site:linkedin.com/in "${context.gmName}" ${hotelShort} ${location}`.trim());
    queries.unshift(`site:linkedin.com/in "${context.gmName}" ${brand} ${location}`.trim());
    queries.unshift(
      `site:linkedin.com/in "${context.gmName}" (${hotel} OR ${brand} OR ${location} OR "hotel")`.trim(),
    );
  }
  return queries;
}

function buildBroadQueries(context: HotelContext): string[] {
  const hotel = `"${context.name}"`;
  const location = context.location ? `"${context.location}"` : '';
  return [
    `${hotel} ${location} (${PAGE_ROLE_QUERY})`.trim(),
    `${hotel} ${location} ("press release" OR presse OR media OR management OR leadership)`.trim(),
  ];
}

async function firecrawlSearch(
  query: string,
  firecrawlApiKey: string,
  metrics: RunMetrics,
): Promise<FirecrawlSearchResult[]> {
  metrics.firecrawlSearchRequests += 1;
  const response = await retryWithBackoff(
    async () => {
      const res = await fetch(`${FIRECRAWL_API_BASE}/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: DEFAULT_SEARCH_LIMIT,
          sources: [{ type: 'web', location: 'Switzerland' }],
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const error = new Error(`Firecrawl search failed (${res.status}): ${text.slice(0, 220)}`) as Error & {
          status?: number;
        };
        error.status = res.status;
        throw error;
      }
      return res;
    },
    { maxRetries: 2, initialDelayMs: 1000, maxDelayMs: 10000 },
  );
  const payload = await response.json();
  return (payload.data?.web ?? []) as FirecrawlSearchResult[];
}

async function firecrawlScrapeDecisionMakerPage(
  url: string,
  firecrawlApiKey: string,
  metrics: RunMetrics,
): Promise<WebsiteExtraction> {
  metrics.firecrawlScrapeRequests += 1;
  const response = await retryWithBackoff(
    async () => {
      const res = await fetch(`${FIRECRAWL_API_BASE}/scrape`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          onlyMainContent: true,
          waitFor: 3000,
          timeout: 45000,
          formats: [
            {
              type: 'json',
              schema: buildDecisionMakerSchema(),
              prompt:
                'Extract named hotel decision-makers from this page. Prioritize property-level General Manager, Hotel Manager, Managing Director, Geschäftsführer, Directeur, Direttore, or Owner. Capture direct emails and LinkedIn profile URLs only if explicitly present. Ignore generic departmental listings unless no named people are present.',
            },
          ],
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const error = new Error(`Firecrawl scrape failed (${res.status}): ${text.slice(0, 220)}`) as Error & {
          status?: number;
        };
        error.status = res.status;
        throw error;
      }
      return res;
    },
    { maxRetries: 2, initialDelayMs: 1200, maxDelayMs: 12000 },
  );
  const payload = await response.json();
  const raw = payload.data?.json ?? payload.json ?? {};
  return {
    people: Array.isArray(raw.people) ? raw.people : [],
    companyLinkedInUrls: Array.isArray(raw.companyLinkedInUrls)
      ? raw.companyLinkedInUrls.filter((value: unknown): value is string => typeof value === 'string')
      : [],
    pageSummary: typeof raw.pageSummary === 'string' ? raw.pageSummary : '',
  };
}

function candidateFromLinkedInResult(
  result: FirecrawlSearchResult,
  context: HotelContext,
): WebsitePersonCandidate | null {
  const url = result.url?.trim();
  if (!url || !looksLikeLinkedInProfile(url)) {
    return null;
  }
  const title = result.title?.replace(/\s*\|\s*LinkedIn.*$/i, '').trim() ?? '';
  const description = result.description?.trim() ?? '';
  const evidenceBlob = [title, description, url].filter(Boolean).join(' ');
  const hasContextMatch = blobMatchesHotelContext(evidenceBlob, context);
  const hasKnownPersonMatch = blobMatchesKnownPerson(evidenceBlob, context.gmName);
  const hasHospitalitySignal = HOSPITALITY_KEYWORD_RE.test(evidenceBlob);
  if (!hasKnownPersonMatch && !(hasContextMatch && hasHospitalitySignal)) {
    return null;
  }
  const possibleName = title.split(/\s[-|–]\s/)[0]?.trim() || null;
  return {
    name: possibleName,
    title: description || null,
    email: null,
    linkedinUrl: url,
    evidence: [title, description].filter(Boolean).join(' — ') || 'LinkedIn search result',
    sourceUrl: url,
    sourceType: 'linkedin_search',
    seedScore: 50,
  };
}

function companyLinkedInUrlFromResult(result: FirecrawlSearchResult): string | null {
  const url = result.url?.trim() ?? '';
  return /linkedin\.com\/company\//i.test(url) ? url : null;
}

function websiteCandidatesFromExtraction(
  extraction: WebsiteExtraction,
  pageUrl: string,
): WebsitePersonCandidate[] {
  return extraction.people
    .map((person) => ({
      name: toNullable(person.name ?? undefined),
      title: toNullable(person.title ?? undefined),
      email: toNullable(person.email ?? undefined),
      linkedinUrl: toNullable(person.linkedinUrl ?? undefined),
      evidence:
        toNullable(person.evidence ?? undefined) ??
        extraction.pageSummary ??
        'Website page extraction',
      sourceUrl: pageUrl,
      sourceType: 'website_page' as const,
      seedScore: 55,
    }))
    .filter((person) => person.name || person.linkedinUrl || person.email);
}

function scoreSeedCandidate(candidate: WebsitePersonCandidate, context: HotelContext): number {
  const titleBlob = `${candidate.title || ''} ${candidate.evidence || ''}`;
  let score = candidate.seedScore;
  if (/general manager|hotel manager|geschäftsführer|directeur|direttore/i.test(titleBlob)) score += 20;
  else if (/managing director|owner/i.test(titleBlob)) score += 16;
  else if (/director|manager/i.test(titleBlob)) score += 8;
  if (candidate.linkedinUrl) score += 8;
  if (candidate.email && looksLikeNamedEmail(candidate.email)) score += 6;
  const companyTokens = tokenise(context.name);
  const evidenceBlob = `${candidate.evidence || ''} ${candidate.sourceUrl || ''}`.toLowerCase();
  score += companyTokens.filter((token) => evidenceBlob.includes(token)).length * 3;
  if (context.gmName && candidate.name && normalizeText(context.gmName) === normalizeText(cleanPersonName(candidate.name) ?? candidate.name)) {
    score += 30;
  } else if (context.gmName && evidenceBlob.includes(normalizeText(context.gmName))) {
    score += 18;
  }
  return score;
}

function dedupeCandidates(candidates: WebsitePersonCandidate[], context: HotelContext): WebsitePersonCandidate[] {
  const seen = new Set<string>();
  return candidates
    .map((candidate) => ({ ...candidate, seedScore: scoreSeedCandidate(candidate, context) }))
    .sort((a, b) => b.seedScore - a.seedScore)
    .filter((candidate) => {
      const key = [
        normalizeText(candidate.linkedinUrl || ''),
        normalizeText(candidate.email || ''),
        normalizeText(candidate.name || ''),
        normalizeText(candidate.title || ''),
      ].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function isAllowedDiscoveryUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return !DISALLOWED_SEARCH_HOSTS.some((host) => lower.includes(host));
}

function prioritizeDiscoveryUrls(urls: string[]): string[] {
  const priorityTokens = [
    'contact',
    'team',
    'management',
    'leadership',
    'about',
    'ueber',
    'uber',
    'apropos',
    'chi-siamo',
    'press',
    'presse',
    'media',
    'career',
    'jobs',
    'news',
  ];

  return [...new Set(urls)].sort((left, right) => {
    const leftScore = priorityTokens.reduce(
      (score, token) => score + (left.toLowerCase().includes(token) ? 1 : 0),
      0,
    );
    const rightScore = priorityTokens.reduce(
      (score, token) => score + (right.toLowerCase().includes(token) ? 1 : 0),
      0,
    );
    return rightScore - leftScore;
  });
}

async function discoverCandidates(
  context: HotelContext,
  firecrawlApiKey: string,
  metrics: RunMetrics,
): Promise<{ candidates: WebsitePersonCandidate[]; companyLinkedInUrls: string[]; notes: string[] }> {
  const candidates = seedCandidatesFromRow(context);
  const notes: string[] = [];
  const companyLinkedInUrls: string[] = [];
  const scrapedUrls = new Set<string>();

  if (context.websiteUrl && isAllowedDiscoveryUrl(context.websiteUrl)) {
    scrapedUrls.add(context.websiteUrl);
    try {
      const extraction = await firecrawlScrapeDecisionMakerPage(context.websiteUrl, firecrawlApiKey, metrics);
      candidates.push(...websiteCandidatesFromExtraction(extraction, context.websiteUrl));
      companyLinkedInUrls.push(...extraction.companyLinkedInUrls);
      if (extraction.pageSummary) {
        notes.push(`Website page: ${extraction.pageSummary}`);
      }
    } catch (error) {
      notes.push(`Website scrape skipped for ${context.websiteUrl}: ${formatError(error)}`);
    }
  }

  for (const query of buildOfficialQueries(context)) {
    const results = await firecrawlSearch(query, firecrawlApiKey, metrics);
    const officialUrls = prioritizeDiscoveryUrls(
      results
        .map((result) => result.url?.trim() ?? '')
        .filter((url) => url && isOfficialHost(url, context.websiteDomain)),
    )
      .filter((url) => isAllowedDiscoveryUrl(url))
      .slice(0, 3);

    for (const url of officialUrls) {
      if (scrapedUrls.has(url)) continue;
      scrapedUrls.add(url);
      try {
        const extraction = await firecrawlScrapeDecisionMakerPage(url, firecrawlApiKey, metrics);
        candidates.push(...websiteCandidatesFromExtraction(extraction, url));
        companyLinkedInUrls.push(...extraction.companyLinkedInUrls);
        if (extraction.pageSummary) {
          notes.push(`Website page: ${extraction.pageSummary}`);
        }
      } catch (error) {
        notes.push(`Website scrape skipped for ${url}: ${formatError(error)}`);
      }
    }
  }

  for (const query of buildLinkedInQueries(context)) {
    const results = await firecrawlSearch(query, firecrawlApiKey, metrics);
    for (const result of results) {
      const candidate = candidateFromLinkedInResult(result, context);
      if (candidate) {
        candidates.push(candidate);
      }
      const companyUrl = companyLinkedInUrlFromResult(result);
      if (companyUrl) {
        companyLinkedInUrls.push(companyUrl);
      }
    }
  }

  for (const query of buildBroadQueries(context)) {
    const results = await firecrawlSearch(query, firecrawlApiKey, metrics);
    const externalUrls = prioritizeDiscoveryUrls(
      results
        .map((result) => result.url?.trim() ?? '')
        .filter((url) => url && !looksLikeLinkedInProfile(url)),
    )
      .filter((url) => isAllowedDiscoveryUrl(url))
      .slice(0, 2);

    for (const url of externalUrls) {
      if (scrapedUrls.has(url)) continue;
      scrapedUrls.add(url);
      try {
        const extraction = await firecrawlScrapeDecisionMakerPage(url, firecrawlApiKey, metrics);
        candidates.push(...websiteCandidatesFromExtraction(extraction, url));
        companyLinkedInUrls.push(...extraction.companyLinkedInUrls);
        if (extraction.pageSummary) {
          notes.push(`Discovery page: ${extraction.pageSummary}`);
        }
      } catch (error) {
        notes.push(`Discovery scrape skipped for ${url}: ${formatError(error)}`);
      }
    }
  }

  return {
    candidates: dedupeCandidates(candidates, context).slice(0, 6),
    companyLinkedInUrls: uniqueStrings(companyLinkedInUrls),
    notes,
  };
}

function parseChargeInfo(chargeInfo: unknown): number {
  if (!chargeInfo || typeof chargeInfo !== 'object') return 0;
  const candidate = chargeInfo as { creditsCharged?: number };
  return typeof candidate.creditsCharged === 'number' ? candidate.creditsCharged : 0;
}

async function callFiber(
  path: string,
  body: Record<string, unknown>,
): Promise<{ payload: any; credits: number }> {
  const response = await retryWithBackoff(
    async () => {
      const res = await fetch(`${FIBER_API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const error = new Error(`Fiber request failed (${res.status}) ${path}: ${text.slice(0, 220)}`) as Error & {
          status?: number;
        };
        error.status = res.status;
        throw error;
      }
      return res;
    },
    { maxRetries: 2, initialDelayMs: 1200, maxDelayMs: 15000 },
  );
  const payload = await response.json();
  return { payload, credits: parseChargeInfo(payload.chargeInfo) };
}

function profileFromFiberRecord(record: any, source: string): FiberProfile {
  const experiences = Array.isArray(record?.experiences) ? record.experiences : [];
  const currentExperience =
    experiences.find((experience: any) => experience?.is_current) ??
    experiences.find((experience: any) => typeof experience?.title === 'string') ??
    null;
  const currentJob = record?.current_job ?? record?.currentJob ?? currentExperience ?? null;
  return {
    name: typeof record?.name === 'string' ? record.name : null,
    firstName: typeof record?.first_name === 'string' ? record.first_name : null,
    lastName: typeof record?.last_name === 'string' ? record.last_name : null,
    headline: typeof record?.headline === 'string' ? record.headline : null,
    url: typeof record?.url === 'string' ? record.url : null,
    primarySlug: typeof record?.primary_slug === 'string' ? record.primary_slug : null,
    locality: typeof record?.locality === 'string' ? record.locality : null,
    currentJobTitle: typeof currentJob?.title === 'string' ? currentJob.title : null,
    currentCompany: typeof currentJob?.company_name === 'string' ? currentJob.company_name : null,
    rawCompanyName: typeof currentJob?.company_name === 'string' ? currentJob.company_name : null,
    source,
  };
}

async function fiberEmailLookup(
  email: string,
  apiKey: string,
  metrics: RunMetrics,
): Promise<FiberProfile | null> {
  metrics.fiberEmailLookupCalls += 1;
  const { payload, credits } = await callFiber('/v1/email-to-person/single', {
    apiKey,
    email,
  });
  metrics.fiberCreditsCharged += credits;
  const data = payload?.output?.data;
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  return profileFromFiberRecord(data[0], 'fiber_email_lookup');
}

async function fiberLiveFetchProfile(
  linkedinUrl: string,
  apiKey: string,
  metrics: RunMetrics,
): Promise<FiberProfile | null> {
  metrics.fiberLiveFetchCalls += 1;
  const { payload, credits } = await callFiber('/v1/linkedin-live-fetch/profile/single', {
    apiKey,
    identifier: linkedinUrl,
    getDetailedWorkExperience: false,
    getDetailedEducation: false,
  });
  metrics.fiberCreditsCharged += credits;
  const output = payload?.output;
  const profile = output?.profile ?? (output?.found ? output.profile : null);
  if (!profile) {
    return null;
  }
  return profileFromFiberRecord(profile, 'fiber_live_fetch');
}

async function fiberKitchenSink(
  context: HotelContext,
  candidate: WebsitePersonCandidate,
  apiKey: string,
  metrics: RunMetrics,
): Promise<FiberProfile | null> {
  if (!candidate.name && !candidate.linkedinUrl && !candidate.email) {
    return null;
  }
  metrics.fiberKitchenSinkCalls += 1;
  const body: Record<string, unknown> = {
    apiKey,
    numProfiles: 5,
    fuzzySearch: true,
    getDetailedWorkExperience: false,
    getDetailedEducation: false,
    companyName: { value: context.name },
    companyDomain: context.websiteDomain ? { value: context.websiteDomain } : null,
    profileLocation: {
      countryCode: SWISS_COUNTRY_CODE,
      locality: context.location,
    },
  };
  if (candidate.name) {
    body.personName = { value: candidate.name, looseMatch: true };
  }
  if (candidate.title) {
    body.jobTitle = { value: candidate.title };
  }
  if (candidate.linkedinUrl) {
    body.profileIdentifier = candidate.linkedinUrl;
  }
  if (candidate.email) {
    body.emailAddress = candidate.email;
  }
  const { payload, credits } = await callFiber('/v1/kitchen-sink/person', body);
  metrics.fiberCreditsCharged += credits;
  const data = payload?.output?.data;
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  return profileFromFiberRecord(data[0], 'fiber_kitchen_sink');
}

async function fiberPeopleSearch(
  context: HotelContext,
  companyLinkedInUrls: string[],
  company: FiberCompany | null,
  apiKey: string,
  metrics: RunMetrics,
): Promise<FiberProfile[]> {
  metrics.fiberPeopleSearchCalls += 1;
  const currentCompanies = [
    {
      domain: company?.domains[0] ?? context.websiteDomain,
      linkedinSlugOrURL: company?.linkedinUrl ?? companyLinkedInUrls[0] ?? null,
      name: company?.preferredName ?? context.name,
    },
  ];
  const { payload, credits } = await callFiber('/v1/people-search', {
    apiKey,
    searchParams: {
      country3LetterCode: { anyOf: [SWISS_COUNTRY_CODE] },
      fuzzyName: context.gmName ? { anyOf: [{ name: context.gmName }] } : null,
      jobTitleV2: {
        anyOf: ROLE_TERMS.map((term) => ({ type: 'term', term })),
      },
      companyMatchMode: { mode: 'loose' },
    },
    currentCompanies,
    pageSize: 10,
  });
  metrics.fiberCreditsCharged += credits;
  const data = payload?.output?.data;
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item: any) => profileFromFiberRecord(item, 'fiber_people_search'));
}

async function fiberRevealContact(
  linkedinUrl: string,
  apiKey: string,
  metrics: RunMetrics,
): Promise<RevealedContact> {
  metrics.fiberContactRevealCalls += 1;
  const { payload, credits } = await callFiber('/v1/contact-details/single', {
    apiKey,
    linkedinUrl,
    enrichmentType: {
      getWorkEmails: true,
      getPersonalEmails: true,
      getPhoneNumbers: true,
    },
    validateEmails: true,
  });
  metrics.fiberCreditsCharged += credits;
  const profile = payload?.output?.profile ?? {};
  const emails = Array.isArray(profile.emails) ? profile.emails : [];
  const phones = Array.isArray(profile.phoneNumbers) ? profile.phoneNumbers : [];
  const bestWork = chooseBestEmail(emails, ['work', 'generic', 'unknown']);
  const bestPersonal = chooseBestEmail(emails, ['personal', 'other']);
  const bestPhone = phones.find((entry: any) => typeof entry?.number === 'string') ?? null;
  return {
    workEmail: bestWork?.email ?? null,
    workEmailStatus: bestWork?.status ?? null,
    personalEmail: bestPersonal?.email === bestWork?.email ? null : (bestPersonal?.email ?? null),
    personalEmailStatus:
      bestPersonal?.email === bestWork?.email ? null : (bestPersonal?.status ?? null),
    phone: bestPhone?.number ?? null,
  };
}

function chooseBestEmail(
  emails: any[],
  preferredTypes: string[],
): { email: string; status: string | null } | null {
  const statusWeight = new Map([
    ['valid', 4],
    ['risky', 3],
    ['unknown', 2],
    ['invalid', 0],
  ]);
  const typeWeight = new Map(preferredTypes.map((type, index) => [type, preferredTypes.length - index]));

  const ranked = emails
    .filter((entry) => typeof entry?.email === 'string')
    .map((entry) => ({
      email: entry.email as string,
      type: typeof entry.type === 'string' ? entry.type : 'unknown',
      status: typeof entry.status === 'string' ? entry.status : null,
    }))
    .sort((a, b) => {
      const aType = typeWeight.get(a.type) ?? 0;
      const bType = typeWeight.get(b.type) ?? 0;
      if (bType !== aType) return bType - aType;
      return (statusWeight.get(b.status ?? 'unknown') ?? 0) - (statusWeight.get(a.status ?? 'unknown') ?? 0);
    });

  if (ranked.length === 0) {
    return null;
  }
  return {
    email: ranked[0].email,
    status: ranked[0].status,
  };
}

function companyFromFiberRecord(record: any, source: string): FiberCompany {
  const primarySlug =
    typeof record?.linkedin_primary_slug === 'string' ? record.linkedin_primary_slug : null;
  const linkedinUrl = primarySlug
    ? `https://www.linkedin.com/company/${primarySlug}`
    : typeof record?.linkedin_url === 'string'
      ? record.linkedin_url
      : null;

  return {
    preferredName:
      typeof record?.preferred_name === 'string'
        ? record.preferred_name
        : Array.isArray(record?.names) && typeof record.names[0] === 'string'
          ? record.names[0]
          : null,
    domains: Array.isArray(record?.domains)
      ? record.domains.filter((value: unknown): value is string => typeof value === 'string')
      : [],
    linkedinPrimarySlug: primarySlug,
    linkedinUrl,
    linkedInOrgId: typeof record?.li_org_id === 'string' ? record.li_org_id : null,
    source,
  };
}

async function fiberCompanyLookup(
  context: HotelContext,
  apiKey: string,
  metrics: RunMetrics,
): Promise<FiberCompany | null> {
  metrics.fiberCompanyLookupCalls += 1;
  const { payload, credits } = await callFiber('/v1/kitchen-sink/company', {
    apiKey,
    companyName: { value: context.name },
    companyDomain: context.websiteDomain ? { value: context.websiteDomain } : null,
    numCompanies: 1,
  });
  metrics.fiberCreditsCharged += credits;
  const data = payload?.output?.data;
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  return companyFromFiberRecord(data[0], 'fiber_company_lookup');
}

function scoreProfile(profile: FiberProfile, context: HotelContext, seed?: WebsitePersonCandidate): { score: number; notes: string[] } {
  let score = 0;
  const notes: string[] = [];
  const titleBlob = `${profile.currentJobTitle || ''} ${profile.headline || ''}`;
  if (NON_DECISION_ROLE_RE.test(titleBlob)) {
    score -= 28;
    notes.push('penalized non-decision function');
  }
  if (/general manager|hotel manager|geschäftsführer|directeur|directeur general|direttore|direktor/i.test(titleBlob)) {
    score += 40;
    notes.push('strong title match');
  } else if (/managing director|owner|founder|ceo|chief executive/i.test(titleBlob)) {
    score += 32;
    notes.push('decision-maker title match');
  } else if (/director|manager|direktor/i.test(titleBlob)) {
    score += 18;
    notes.push('partial title match');
  }

  const hotelTokens = tokenise(context.name);
  const companyBlob = `${profile.currentCompany || ''} ${profile.headline || ''}`.toLowerCase();
  const companyMatches = hotelTokens.filter((token) => companyBlob.includes(token)).length;
  let hasCompanyOrLocationMatch = false;
  if (companyMatches >= Math.min(2, hotelTokens.length)) {
    score += 28;
    notes.push('company name matches hotel');
    hasCompanyOrLocationMatch = true;
  } else if (companyMatches >= 1) {
    score += 14;
    notes.push('company partially matches hotel');
    hasCompanyOrLocationMatch = true;
  }

  if (context.location) {
    const locationNeedle = normalizeText(context.location);
    const localityBlob = `${profile.locality || ''} ${profile.headline || ''}`.toLowerCase();
    if (localityBlob.includes(locationNeedle)) {
      score += 18;
      notes.push('location matches hotel');
      hasCompanyOrLocationMatch = true;
    }
  }

  if (context.gmName && profile.name && normalizeText(context.gmName) === normalizeText(cleanPersonName(profile.name) ?? profile.name)) {
    score += 42;
    notes.push('exact match to CSV GM name');
  }

  if (seed?.name && profile.name && normalizeText(seed.name) === normalizeText(profile.name)) {
    score += 10;
    notes.push('exact name match to seed');
  }

  if (seed?.linkedinUrl && profile.url && normalizeText(seed.linkedinUrl) === normalizeText(profile.url)) {
    score += 10;
    notes.push('exact LinkedIn match to seed');
  }

  if (profile.url) {
    score += 6;
  }

  if (seed?.sourceType === 'linkedin_search' && !hasCompanyOrLocationMatch && !blobMatchesKnownPerson(profile.name || '', context.gmName)) {
    score -= 40;
    notes.push('penalized weak LinkedIn-only alignment');
  }

  return { score, notes };
}

function pickBestProfile(
  profiles: Array<{ profile: FiberProfile; notes: string[]; score: number; sourceCandidate?: WebsitePersonCandidate }>,
): { profile: FiberProfile; notes: string[]; score: number; sourceCandidate?: WebsitePersonCandidate } | null {
  const sorted = [...profiles].sort((a, b) => b.score - a.score);
  return sorted[0] ?? null;
}

function deriveRoleCategory(title: string | null): string | null {
  if (!title) return null;
  if (NON_DECISION_ROLE_RE.test(title)) return 'other';
  if (/general manager|deputy general manager|hotel manager|geschäftsführer|directeur|directeur general|direttore|direktor/i.test(title)) return 'gm';
  if (/managing director|owner|founder|ceo|chief executive/i.test(title)) return 'decision_maker';
  if (/director|manager|direktor/i.test(title)) return 'manager';
  return 'other';
}

function isHighValueRole(roleCategory: string | null): boolean {
  return roleCategory === 'gm' || roleCategory === 'decision_maker';
}

function shouldRunPeopleSearch(
  best: { profile: FiberProfile; notes: string[]; score: number; sourceCandidate?: WebsitePersonCandidate } | null,
  context: HotelContext,
): boolean {
  if (!best) return true;
  const roleCategory = deriveRoleCategory(best.profile.currentJobTitle ?? null);
  if (!isHighValueRole(roleCategory)) return true;
  if (best.score < 85) return true;
  if (
    context.gmName &&
    best.profile.name &&
    normalizeText(context.gmName) !==
      normalizeText(cleanPersonName(best.profile.name) ?? best.profile.name)
  ) {
    return true;
  }
  return false;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function resolveProfilesFromCandidates(
  context: HotelContext,
  candidates: WebsitePersonCandidate[],
  fiberApiKey: string,
  metrics: RunMetrics,
  discoveryNotes: string[],
): Promise<
  Array<{
    profile: FiberProfile;
    notes: string[];
    score: number;
    sourceCandidate?: WebsitePersonCandidate;
  }>
> {
  const rankedSeeds = dedupeCandidates(candidates, context).slice(0, 4);
  const resolvedProfiles: Array<{
    profile: FiberProfile;
    notes: string[];
    score: number;
    sourceCandidate?: WebsitePersonCandidate;
  }> = [];

  for (const candidate of rankedSeeds) {
    let profile: FiberProfile | null = null;
    try {
      if (candidate.email && looksLikeNamedEmail(candidate.email)) {
        profile = await fiberEmailLookup(candidate.email, fiberApiKey, metrics);
      }
      if (!profile && candidate.linkedinUrl) {
        profile = await fiberLiveFetchProfile(candidate.linkedinUrl, fiberApiKey, metrics);
      }
      if (!profile && (candidate.name || candidate.linkedinUrl || candidate.email)) {
        profile = await fiberKitchenSink(context, candidate, fiberApiKey, metrics);
      }
    } catch (error) {
      discoveryNotes.push(`Fiber seed lookup skipped: ${formatError(error)}`);
      continue;
    }
    if (!profile) continue;
    const scored = scoreProfile(profile, context, candidate);
    resolvedProfiles.push({
      profile,
      notes: scored.notes,
      score: scored.score,
      sourceCandidate: candidate,
    });
    if (scored.score >= 70) {
      break;
    }
  }

  return resolvedProfiles;
}

function toResult(
  context: HotelContext,
  resolved: {
    bestProfile: FiberProfile | null;
    contact: RevealedContact | null;
    score: number;
    notes: string[];
    sourceCandidate?: WebsitePersonCandidate;
    discoveryNotes: string[];
  },
): EnrichmentResult {
  const updatedAt = new Date().toISOString();
  const profile = resolved.bestProfile;
  const roleCategory = deriveRoleCategory(profile?.currentJobTitle ?? resolved.sourceCandidate?.title ?? null);
  const hasDirectEmail = Boolean(resolved.contact?.workEmail || resolved.contact?.personalEmail);
  const status: DecisionMakerStatus =
    profile && hasDirectEmail && isHighValueRole(roleCategory)
      ? 'resolved'
      : profile
        ? 'partial'
        : 'unresolved';

  const mergedNotes = uniqueStrings([
    ...resolved.notes,
    ...resolved.discoveryNotes,
    resolved.sourceCandidate?.evidence ?? null,
  ]);

  const sourceChannels = uniqueStrings([
    resolved.sourceCandidate?.sourceType ?? null,
    profile?.source ?? null,
    resolved.contact ? 'fiber_contact_reveal' : null,
  ]);

  const sourceUrls = uniqueStrings([
    context.gmSourceUrl,
    resolved.sourceCandidate?.sourceUrl ?? null,
    resolved.sourceCandidate?.linkedinUrl ?? null,
    profile?.url,
  ]);

  return {
    slug: context.slug,
    hotelName: context.name,
    status,
    resolvedPersonName: profile?.name ?? resolved.sourceCandidate?.name ?? null,
    resolvedTitle: profile?.currentJobTitle ?? resolved.sourceCandidate?.title ?? null,
    roleCategory,
    linkedinUrl: profile?.url ?? resolved.sourceCandidate?.linkedinUrl ?? null,
    workEmail: resolved.contact?.workEmail ?? null,
    workEmailStatus: resolved.contact?.workEmailStatus ?? null,
    personalEmail: resolved.contact?.personalEmail ?? null,
    personalEmailStatus: resolved.contact?.personalEmailStatus ?? null,
    phone: resolved.contact?.phone ?? null,
    headline: profile?.headline ?? null,
    locality: profile?.locality ?? context.location,
    currentCompany: profile?.currentCompany ?? null,
    confidenceScore: resolved.score,
    foundVia: sourceChannels[0] ?? null,
    sourceChannels,
    sourceUrls,
    notes: mergedNotes.join('; '),
    insights: uniqueStrings([
      profile?.headline,
      profile?.currentJobTitle && profile?.currentCompany
        ? `${profile.currentJobTitle} at ${profile.currentCompany}`
        : null,
    ]).join(' | '),
    error: null,
    updatedAt,
  };
}

async function enrichHotel(
  row: CsvRow,
  config: CliConfig,
  firecrawlApiKey: string | null,
  fiberApiKey: string | null,
  metrics: RunMetrics,
): Promise<EnrichmentResult> {
  const context = buildContext(row);
  const discoveryNotes: string[] = [];
  const sourceCandidates = seedCandidatesFromRow(context);
  let companyLinkedInUrls: string[] = [];
  let resolvedCompany: FiberCompany | null = null;

  try {
    if (config.skipFiber || !fiberApiKey) {
      const seeded = dedupeCandidates(sourceCandidates, context)[0] ?? null;
      return {
        slug: context.slug,
        hotelName: context.name,
        status: seeded ? 'partial' : 'unresolved',
        resolvedPersonName: seeded?.name ?? null,
        resolvedTitle: seeded?.title ?? null,
        roleCategory: deriveRoleCategory(seeded?.title ?? null),
        linkedinUrl: seeded?.linkedinUrl ?? null,
        workEmail: null,
        workEmailStatus: null,
        personalEmail: null,
        personalEmailStatus: null,
        phone: null,
        headline: null,
        locality: context.location,
        currentCompany: null,
        confidenceScore: seeded?.seedScore ?? 0,
        foundVia: seeded?.sourceType ?? null,
        sourceChannels: seeded ? [seeded.sourceType] : [],
        sourceUrls: uniqueStrings([seeded?.sourceUrl, context.gmSourceUrl]),
        notes: trimPipeJoined([
          seeded?.evidence ?? '',
          ...discoveryNotes,
          'Fiber skipped for this run',
        ]),
        insights: '',
        error: null,
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      resolvedCompany = await fiberCompanyLookup(context, fiberApiKey, metrics);
      if (resolvedCompany?.linkedinUrl) {
        companyLinkedInUrls.push(resolvedCompany.linkedinUrl);
      }
    } catch (error) {
      discoveryNotes.push(`Fiber company lookup skipped: ${formatError(error)}`);
    }

    let resolvedProfiles = await resolveProfilesFromCandidates(
      context,
      sourceCandidates,
      fiberApiKey,
      metrics,
      discoveryNotes,
    );

    if (resolvedProfiles.length === 0 && !config.skipFirecrawl && firecrawlApiKey) {
      const discovered = await discoverCandidates(context, firecrawlApiKey, metrics);
      sourceCandidates.push(...discovered.candidates);
      companyLinkedInUrls = discovered.companyLinkedInUrls;
      discoveryNotes.push(...discovered.notes);
      resolvedProfiles = await resolveProfilesFromCandidates(
        context,
        sourceCandidates,
        fiberApiKey,
        metrics,
        discoveryNotes,
      );
    }

    const fallbackCandidates = dedupeCandidates(sourceCandidates, context).slice(0, 4);
    let best = pickBestProfile(resolvedProfiles);
    if (shouldRunPeopleSearch(best, context)) {
      try {
        const peopleSearchProfiles = await fiberPeopleSearch(
          context,
          companyLinkedInUrls,
          resolvedCompany,
          fiberApiKey,
          metrics,
        );
        for (const profile of peopleSearchProfiles) {
          const scored = scoreProfile(profile, context);
          resolvedProfiles.push({
            profile,
            notes: scored.notes,
            score: scored.score,
          });
        }
        best = pickBestProfile(resolvedProfiles);
      } catch (error) {
        discoveryNotes.push(`Fiber people search skipped: ${formatError(error)}`);
      }
    }

    best = pickBestProfile(resolvedProfiles);
    if (!best || best.score < 35) {
      return {
        slug: context.slug,
        hotelName: context.name,
        status: 'unresolved',
        resolvedPersonName: null,
        resolvedTitle: null,
        roleCategory: null,
        linkedinUrl: null,
        workEmail: null,
        workEmailStatus: null,
        personalEmail: null,
        personalEmailStatus: null,
        phone: null,
        headline: null,
        locality: context.location,
        currentCompany: null,
        confidenceScore: best?.score ?? 0,
        foundVia: null,
        sourceChannels: fallbackCandidates.map((candidate) => candidate.sourceType),
        sourceUrls: uniqueStrings([
          context.gmSourceUrl,
          ...fallbackCandidates.map((candidate) => candidate.sourceUrl),
          ...fallbackCandidates.map((candidate) => candidate.linkedinUrl),
        ]),
        notes: trimPipeJoined([
          ...discoveryNotes,
          'No Fiber profile cleared the confidence threshold',
        ]),
        insights: '',
        error: null,
        updatedAt: new Date().toISOString(),
      };
    }

    let contact: RevealedContact | null = null;
    if (best.profile.url) {
      try {
        contact = await fiberRevealContact(best.profile.url, fiberApiKey, metrics);
      } catch (error) {
        discoveryNotes.push(`Fiber contact reveal skipped: ${formatError(error)}`);
      }
    }
    return toResult(context, {
      bestProfile: best.profile,
      contact,
      score: best.score,
      notes: best.notes,
      sourceCandidate: best.sourceCandidate,
      discoveryNotes,
    });
  } catch (error) {
    return {
      slug: context.slug,
      hotelName: context.name,
      status: 'error',
      resolvedPersonName: null,
      resolvedTitle: null,
      roleCategory: null,
      linkedinUrl: null,
      workEmail: null,
      workEmailStatus: null,
      personalEmail: null,
      personalEmailStatus: null,
      phone: null,
      headline: null,
      locality: context.location,
      currentCompany: null,
      confidenceScore: 0,
      foundVia: null,
      sourceChannels: [],
      sourceUrls: uniqueStrings([context.gmSourceUrl, context.websiteUrl]),
      notes: trimPipeJoined(discoveryNotes),
      insights: '',
      error: formatError(error),
      updatedAt: new Date().toISOString(),
    };
  }
}

function mergeRowWithResult(row: CsvRow, result: EnrichmentResult): CsvRow {
  const next = { ...row };
  if (!next.gmName && result.resolvedPersonName) next.gmName = result.resolvedPersonName;
  if (!next.gmTitle && result.resolvedTitle) next.gmTitle = result.resolvedTitle;
  if (!next.gmSourceUrl && result.sourceUrls[0]) next.gmSourceUrl = result.sourceUrls[0];

  next.dm_status = result.status;
  next.dm_name = result.resolvedPersonName ?? '';
  next.dm_title = result.resolvedTitle ?? '';
  next.dm_role_category = result.roleCategory ?? '';
  next.dm_linkedin_url = result.linkedinUrl ?? '';
  next.dm_work_email = result.workEmail ?? '';
  next.dm_work_email_status = result.workEmailStatus ?? '';
  next.dm_personal_email = result.personalEmail ?? '';
  next.dm_personal_email_status = result.personalEmailStatus ?? '';
  next.dm_phone = result.phone ?? '';
  next.dm_profile_headline = result.headline ?? '';
  next.dm_profile_locality = result.locality ?? '';
  next.dm_current_company = result.currentCompany ?? '';
  next.dm_confidence_score = result.confidenceScore ? String(result.confidenceScore) : '';
  next.dm_found_via = result.foundVia ?? '';
  next.dm_source_channels = trimPipeJoined(result.sourceChannels);
  next.dm_source_urls = trimPipeJoined(result.sourceUrls);
  next.dm_match_notes = result.notes;
  next.dm_insights = result.insights;
  next.dm_updated_at = result.updatedAt;
  next.dm_error = result.error ?? '';
  return next;
}

function buildSummary(
  config: CliConfig,
  rowsRead: number,
  processedRows: CsvRow[],
  results: EnrichmentResult[],
  metrics: RunMetrics,
  outputFiles: Record<string, string>,
): Record<string, unknown> {
  const counts = {
    resolved: results.filter((result) => result.status === 'resolved').length,
    partial: results.filter((result) => result.status === 'partial').length,
    unresolved: results.filter((result) => result.status === 'unresolved').length,
    error: results.filter((result) => result.status === 'error').length,
  };

  return {
    generatedAt: new Date().toISOString(),
    inputPath: config.inputPath,
    outputDir: config.outputDir,
    runConfig: {
      limit: config.limit,
      offset: config.offset,
      concurrency: config.concurrency,
      resume: config.resume,
      rerunErrors: config.rerunErrors,
      onlyMissing: config.onlyMissing,
      skipFirecrawl: config.skipFirecrawl,
      skipFiber: config.skipFiber,
    },
    totals: {
      rowsRead,
      processedRows: results.length,
      resultStatuses: counts,
      rowsWithDecisionMakerName: processedRows.filter((row) => Boolean(row.dm_name)).length,
      rowsWithLinkedIn: processedRows.filter((row) => Boolean(row.dm_linkedin_url)).length,
      rowsWithWorkEmail: processedRows.filter((row) => Boolean(row.dm_work_email)).length,
      rowsWithPersonalEmail: processedRows.filter((row) => Boolean(row.dm_personal_email)).length,
    },
    apiUsage: metrics,
    files: outputFiles,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const config = buildConfig(args);
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY ?? null;
  const fiberApiKey = process.env.FIBER_API_KEY ?? process.env.FIBERAI_API_KEY ?? null;

  if (!config.skipFirecrawl && !firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY is required unless --skip-firecrawl is set');
  }
  if (!config.skipFiber && !fiberApiKey) {
    throw new Error('FIBER_API_KEY or FIBERAI_API_KEY is required unless --skip-fiber is set');
  }

  mkdirSync(config.outputDir, { recursive: true });
  const cachePath = resolve(config.outputDir, 'decision-maker-cache.jsonl');
  const csvOutputPath = resolve(config.outputDir, 'hotelleriesuisse-members-hotels-switzerland.decision-makers.csv');
  const jsonlOutputPath = resolve(config.outputDir, 'decision-maker-results.jsonl');
  const summaryOutputPath = resolve(config.outputDir, 'decision-maker-summary.json');

  const rows = loadCsv(config.inputPath);
  const scopedRows = buildScopedRows(rows, config);
  const cache = loadCache(cachePath);
  const limiter = new ConcurrencyLimiter(config.concurrency);
  const metrics: RunMetrics = { ...EMPTY_METRICS };
  const freshResults = new Map<string, EnrichmentResult>();

  console.log(
    `[decision-makers] rows=${rows.length} scoped=${scopedRows.length} resume=${config.resume} onlyMissing=${config.onlyMissing}`,
  );

  const pendingRows = scopedRows.filter((row) => shouldProcessRow(row, cache.get(row.slug), config));
  console.log(`[decision-makers] processing ${pendingRows.length} rows`);

  const processed = await Promise.all(
    pendingRows.map((row, index) =>
      limiter.execute(async () => {
        console.log(`[decision-makers] ${index + 1}/${pendingRows.length} ${row.slug}`);
        const result = await enrichHotel(row, config, firecrawlApiKey, fiberApiKey, metrics);
        freshResults.set(result.slug, result);
        appendCache(cachePath, result);
        return result;
      }),
    ),
  );

  const mergedRows = rows.map((row) => {
    const result = freshResults.get(row.slug) ?? cache.get(row.slug);
    return result ? mergeRowWithResult(row, result) : row;
  });

  const mergedResults = mergedRows
    .filter((row) => row.dm_status)
    .map((row) => ({
      slug: row.slug,
      hotelName: row.name,
      status: row.dm_status as DecisionMakerStatus,
      resolvedPersonName: row.dm_name || null,
      resolvedTitle: row.dm_title || null,
      roleCategory: row.dm_role_category || null,
      linkedinUrl: row.dm_linkedin_url || null,
      workEmail: row.dm_work_email || null,
      workEmailStatus: row.dm_work_email_status || null,
      personalEmail: row.dm_personal_email || null,
      personalEmailStatus: row.dm_personal_email_status || null,
      phone: row.dm_phone || null,
      headline: row.dm_profile_headline || null,
      locality: row.dm_profile_locality || null,
      currentCompany: row.dm_current_company || null,
      confidenceScore: Number(row.dm_confidence_score || 0),
      foundVia: row.dm_found_via || null,
      sourceChannels: row.dm_source_channels ? row.dm_source_channels.split(' | ') : [],
      sourceUrls: row.dm_source_urls ? row.dm_source_urls.split(' | ') : [],
      notes: row.dm_match_notes || '',
      insights: row.dm_insights || '',
      error: row.dm_error || null,
      updatedAt: row.dm_updated_at || '',
    })) satisfies EnrichmentResult[];

  const fieldnames = uniqueStrings([
    ...Object.keys(rows[0] ?? {}),
    ...CONTACT_FIELDS,
  ]);

  writeFileSync(
    csvOutputPath,
    stringifyCsv(mergedRows, {
      header: true,
      columns: fieldnames,
    }),
    'utf-8',
  );
  writeFileSync(
    jsonlOutputPath,
    `${mergedResults.map((result) => JSON.stringify(result)).join('\n')}\n`,
    'utf-8',
  );
  writeFileSync(
    summaryOutputPath,
    `${JSON.stringify(
      buildSummary(config, rows.length, mergedRows, mergedResults, metrics, {
        csv: csvOutputPath,
        jsonl: jsonlOutputPath,
        cache: cachePath,
        summary: summaryOutputPath,
      }),
      null,
      2,
    )}\n`,
    'utf-8',
  );

  const counts = mergedResults.reduce<Record<string, number>>((accumulator, result) => {
    accumulator[result.status] = (accumulator[result.status] ?? 0) + 1;
    return accumulator;
  }, {});

  console.log(`[decision-makers] done`, counts);
  console.log(`[decision-makers] csv=${csvOutputPath}`);
  console.log(`[decision-makers] summary=${summaryOutputPath}`);
  console.log(
    `[decision-makers] fresh resolved=${processed.filter((result) => result.status === 'resolved').length} fresh partial=${processed.filter((result) => result.status === 'partial').length}`,
  );
}

void main().catch((error) => {
  console.error(`[decision-makers] fatal: ${formatError(error)}`);
  process.exit(1);
});
