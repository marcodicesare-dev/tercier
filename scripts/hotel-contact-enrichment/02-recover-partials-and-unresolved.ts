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
const DEFAULT_BASE_CSV = resolve(
  process.cwd(),
  'hotelleriesuisse-members-hotels-switzerland.enriched-master.csv',
);
const DEFAULT_SOURCE_DIR = resolve(process.cwd(), 'output/hotel-contact-enrichment-full-v6');
const DEFAULT_OUTPUT_DIR = resolve(process.cwd(), 'output/hotel-contact-enrichment-recovery');
const DEFAULT_CONCURRENCY = 2;
const DEFAULT_SEARCH_LIMIT = 4;
const SWISS_COUNTRY_CODE = 'CHE';
const LEADERSHIP_ROLE_TERMS = [
  'General Manager',
  'Deputy General Manager',
  'Hotel Manager',
  'Managing Director',
  'CEO',
  'Founder',
  'Owner',
  'Direktor',
  'Direktorin',
  'Geschäftsführer',
  'Directeur',
  'Directeur général',
  'Direttore',
  'Direttore generale',
  'Resident Manager',
  'Operations Director',
];
const PAGE_ROLE_QUERY =
  '"General Manager" OR "Deputy General Manager" OR "Hotel Manager" OR "Managing Director" OR CEO OR Founder OR Owner OR "Geschäftsführer" OR "Directeur" OR "Direttore"';
const TEAM_QUERY =
  'team OR management OR leadership OR about OR contact OR impressum OR legal OR presse OR media';
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
const NON_DECISION_ROLE_RE =
  /\b(assistant|coordinator|co-ordinator|guest relations|revenue|reservations|reservation|restaurant ?manager|food|beverage|chef|sales|marketing|front office|front desk|housekeeping|spa manager|event|events|human resources|hr|technical|technicien|collector)\b/i;
const HOSPITALITY_KEYWORD_RE =
  /\b(hotel|hotels|hospitality|resort|resorts|hostel|lodging|collection|apartments|aparthotel|suites|spa)\b/i;

type CsvRow = Record<string, string>;
type DecisionMakerStatus = 'resolved' | 'partial' | 'unresolved' | 'error';
type RecoveryBucket =
  | 'partial_property_no_email'
  | 'partial_brand_level'
  | 'partial_wrong_function'
  | 'partial_weak_match'
  | 'unresolved_missing_website'
  | 'unresolved_no_person_found'
  | 'unresolved_parent_brand'
  | 'error_retry';

interface RecoveryConfig {
  baseCsvPath: string;
  sourceDir: string;
  outputDir: string;
  concurrency: number;
  limit: number | null;
  offset: number;
  resume: boolean;
  skipFirecrawl: boolean;
  skipDomainLookup: boolean;
  onlyStatuses: Set<DecisionMakerStatus>;
  onlySlugs: Set<string> | null;
}

interface HotelContext {
  slug: string;
  name: string;
  location: string | null;
  address: string | null;
  websiteUrl: string | null;
  websiteDomain: string | null;
  gmName: string | null;
  gmTitle: string | null;
  gmSourceUrl: string | null;
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

interface WebsitePersonCandidate {
  name: string | null;
  title: string | null;
  email: string | null;
  linkedinUrl: string | null;
  evidence: string | null;
  sourceUrl: string | null;
  sourceType: 'existing_result' | 'website_page' | 'linkedin_search' | 'firecrawl_recovery';
  seedScore: number;
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

interface RecoveryRecord {
  slug: string;
  bucket: RecoveryBucket;
  action: 'kept_existing' | 'upgraded';
  beforeQuality: number;
  afterQuality: number;
  baseline: EnrichmentResult;
  final: EnrichmentResult;
}

interface RunMetrics {
  firecrawlSearchRequests: number;
  firecrawlScrapeRequests: number;
  fiberCompanyLookupCalls: number;
  fiberCompanySearchCalls: number;
  fiberPeopleSearchCalls: number;
  fiberKitchenSinkCalls: number;
  fiberLiveFetchCalls: number;
  fiberContactRevealCalls: number;
  fiberDomainLookupCalls: number;
  fiberCreditsCharged: number;
}

const EMPTY_METRICS: RunMetrics = {
  firecrawlSearchRequests: 0,
  firecrawlScrapeRequests: 0,
  fiberCompanyLookupCalls: 0,
  fiberCompanySearchCalls: 0,
  fiberPeopleSearchCalls: 0,
  fiberKitchenSinkCalls: 0,
  fiberLiveFetchCalls: 0,
  fiberContactRevealCalls: 0,
  fiberDomainLookupCalls: 0,
  fiberCreditsCharged: 0,
};

function parseArg(args: string[], name: string, fallback?: string): string | undefined {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  return fallback;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function toInt(value: string | undefined, fallback: number | null): number | null {
  if (value == null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullable(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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

function normalizeHostname(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
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

function tokenise(value: string | null): string[] {
  if (!value) return [];
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function isAllowedDiscoveryUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return !DISALLOWED_SEARCH_HOSTS.some((host) => lower.includes(host));
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

function looksLikeLinkedInProfile(url: string | null): boolean {
  return Boolean(url && /linkedin\.com\/in\//i.test(url));
}

function isHighValueRole(roleCategory: string | null): boolean {
  return roleCategory === 'gm' || roleCategory === 'decision_maker';
}

function roleCategoryFromTitle(title: string | null): string | null {
  if (!title) return null;
  if (NON_DECISION_ROLE_RE.test(title)) return 'other';
  if (
    /general manager|deputy general manager|hotel manager|geschäftsführer|directeur|directeur general|direttore|direktor/i.test(
      title,
    )
  ) {
    return 'gm';
  }
  if (/managing director|owner|founder|ceo|chief executive/i.test(title)) {
    return 'decision_maker';
  }
  if (/director|manager|direktor/i.test(title)) {
    return 'manager';
  }
  return 'other';
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
  if (!existsSync(cachePath)) return map;
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

function appendJsonl(path: string, payload: unknown): void {
  appendFileSync(path, `${JSON.stringify(payload)}\n`, 'utf-8');
}

function buildConfig(args: string[]): RecoveryConfig {
  const statuses = parseArg(args, '--only-statuses', 'partial,unresolved,error')!
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean) as DecisionMakerStatus[];
  const onlySlugsRaw = parseArg(args, '--only-slugs');
  return {
    baseCsvPath: resolve(parseArg(args, '--base-csv', DEFAULT_BASE_CSV)!),
    sourceDir: resolve(parseArg(args, '--source-dir', DEFAULT_SOURCE_DIR)!),
    outputDir: resolve(parseArg(args, '--output-dir', DEFAULT_OUTPUT_DIR)!),
    concurrency: toInt(parseArg(args, '--concurrency'), DEFAULT_CONCURRENCY) ?? DEFAULT_CONCURRENCY,
    limit: toInt(parseArg(args, '--limit'), null),
    offset: toInt(parseArg(args, '--offset'), 0) ?? 0,
    resume: !hasFlag(args, '--no-resume'),
    skipFirecrawl: hasFlag(args, '--skip-firecrawl'),
    skipDomainLookup: hasFlag(args, '--skip-domain-lookup'),
    onlyStatuses: new Set(statuses),
    onlySlugs: onlySlugsRaw
      ? new Set(
          onlySlugsRaw
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        )
      : null,
  };
}

function buildContext(row: CsvRow, existing: EnrichmentResult | undefined): HotelContext {
  const websiteUrl = toNullable(row.websiteUrl);
  return {
    slug: row.slug,
    name: row.name,
    location: toNullable(row.location),
    address: toNullable(row.address),
    websiteUrl,
    websiteDomain: normalizeHostname(websiteUrl),
    gmName: cleanPersonName(existing?.resolvedPersonName ?? toNullable(row.gmName)),
    gmTitle: existing?.resolvedTitle ?? toNullable(row.gmTitle),
    gmSourceUrl: existing?.sourceUrls?.[0] ?? toNullable(row.gmSourceUrl),
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
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Firecrawl search failed (${res.status}): ${text.slice(0, 220)}`);
      }
      return res;
    },
    { maxRetries: 2, initialDelayMs: 1200, maxDelayMs: 12000 },
  );
  const payload = await response.json();
  return Array.isArray(payload?.data) ? (payload.data as FirecrawlSearchResult[]) : [];
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
          waitFor: 3500,
          formats: [
            {
              type: 'json',
              prompt:
                'Extract only named property-level hotel decision-makers or close leadership figures from this page. Prioritize General Manager, Hotel Manager, Managing Director, Deputy General Manager, Directeur, Direttore, Geschäftsführer, Owner, Founder, Resident Manager, and Operations Director. Ignore assistants, reservations, technical, restaurant, sales, and marketing contacts unless no better named person exists.',
              schema: buildDecisionMakerSchema(),
            },
          ],
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Firecrawl scrape failed (${res.status}): ${text.slice(0, 220)}`);
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

function websiteCandidatesFromExtraction(
  extraction: WebsiteExtraction,
  pageUrl: string,
): WebsitePersonCandidate[] {
  return extraction.people
    .map((person) => ({
      name: cleanPersonName(toNullable(person.name ?? undefined)),
      title: toNullable(person.title ?? undefined),
      email: toNullable(person.email ?? undefined),
      linkedinUrl: toNullable(person.linkedinUrl ?? undefined),
      evidence:
        toNullable(person.evidence ?? undefined) ?? extraction.pageSummary ?? 'Website page extraction',
      sourceUrl: pageUrl,
      sourceType: 'website_page' as const,
      seedScore: 50,
    }))
    .filter((person) => person.name || person.linkedinUrl || person.email);
}

function candidateFromLinkedInResult(result: FirecrawlSearchResult): WebsitePersonCandidate | null {
  const url = result.url?.trim();
  if (!looksLikeLinkedInProfile(url ?? null)) return null;
  const title = result.title?.replace(/\s*\|\s*LinkedIn.*$/i, '').trim() ?? '';
  const description = result.description?.trim() ?? '';
  const possibleName = cleanPersonName(title.split(/\s[-|–]\s/)[0]?.trim() || null);
  return {
    name: possibleName,
    title: description || null,
    email: null,
    linkedinUrl: url ?? null,
    evidence: [title, description].filter(Boolean).join(' — ') || 'LinkedIn search result',
    sourceUrl: url ?? null,
    sourceType: 'linkedin_search',
    seedScore: 42,
  };
}

function companyLinkedInUrlFromResult(result: FirecrawlSearchResult): string | null {
  const url = result.url?.trim() ?? '';
  return /linkedin\.com\/company\//i.test(url) ? url : null;
}

function scoreSeedCandidate(candidate: WebsitePersonCandidate, context: HotelContext): number {
  const titleBlob = `${candidate.title || ''} ${candidate.evidence || ''}`;
  let score = candidate.seedScore;
  if (NON_DECISION_ROLE_RE.test(titleBlob)) score -= 20;
  if (/general manager|deputy general manager|hotel manager|geschäftsführer|directeur|direttore|direktor/i.test(titleBlob)) score += 24;
  else if (/managing director|owner|founder|ceo/i.test(titleBlob)) score += 22;
  else if (/director|manager/i.test(titleBlob)) score += 10;
  if (candidate.linkedinUrl) score += 8;
  if (candidate.email) score += 6;
  const evidenceBlob = `${candidate.evidence || ''} ${candidate.sourceUrl || ''}`.toLowerCase();
  const companyTokens = tokenise(context.name);
  score += companyTokens.filter((token) => evidenceBlob.includes(token)).length * 4;
  if (context.gmName && candidate.name && normalizeText(context.gmName) === normalizeText(candidate.name)) {
    score += 30;
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

function prioritizeDiscoveryUrls(urls: string[]): string[] {
  const priorityTokens = ['contact', 'team', 'management', 'leadership', 'about', 'impressum', 'legal', 'press', 'media'];
  return [...new Set(urls)].sort((left, right) => {
    const leftScore = priorityTokens.reduce((score, token) => score + (left.toLowerCase().includes(token) ? 1 : 0), 0);
    const rightScore = priorityTokens.reduce((score, token) => score + (right.toLowerCase().includes(token) ? 1 : 0), 0);
    return rightScore - leftScore;
  });
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
  return [
    `site:linkedin.com/in ${hotel} (${PAGE_ROLE_QUERY}) ${location}`.trim(),
    `site:linkedin.com/in (${hotel} OR ${brand}) ${location}`.trim(),
    context.gmName
      ? `site:linkedin.com/in "${context.gmName}" (${hotel} OR ${brand} OR ${location} OR "hotel")`
      : '',
  ].filter(Boolean);
}

function buildBroadQueries(context: HotelContext): string[] {
  const hotel = `"${context.name}"`;
  const location = context.location ? `"${context.location}"` : '';
  return [
    `${hotel} ${location} (${PAGE_ROLE_QUERY})`.trim(),
    `${hotel} ${location} ("press release" OR presse OR media OR management OR leadership OR impressum)`.trim(),
  ];
}

function profileFromFiberRecord(record: any, source: string): FiberProfile {
  const experiences = Array.isArray(record?.experiences) ? record.experiences : [];
  const currentExperience =
    experiences.find((experience: any) => experience?.is_current) ??
    experiences.find((experience: any) => typeof experience?.title === 'string') ??
    null;
  const currentJob = record?.current_job ?? record?.currentJob ?? currentExperience ?? null;
  return {
    name: cleanPersonName(typeof record?.name === 'string' ? record.name : null),
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
  if (!Array.isArray(data) || data.length === 0) return null;
  return companyFromFiberRecord(data[0], 'fiber_company_lookup');
}

async function fiberCompanySearchByDomain(
  domain: string,
  apiKey: string,
  metrics: RunMetrics,
): Promise<FiberCompany | null> {
  metrics.fiberCompanySearchCalls += 1;
  const { payload, credits } = await callFiber('/v1/company-search', {
    apiKey,
    searchParams: {
      exactCompanyV2: {
        anyOf: [{ identifier: 'domain', domain }],
      },
    },
    pageSize: 1,
  });
  metrics.fiberCreditsCharged += credits;
  const data = payload?.output?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  return companyFromFiberRecord(data[0], 'fiber_company_search');
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
  if (!profile) return null;
  return profileFromFiberRecord(profile, 'fiber_live_fetch');
}

async function fiberKitchenSink(
  context: HotelContext,
  candidate: WebsitePersonCandidate,
  company: FiberCompany | null,
  apiKey: string,
  metrics: RunMetrics,
): Promise<FiberProfile | null> {
  metrics.fiberKitchenSinkCalls += 1;
  const body: Record<string, unknown> = {
    apiKey,
    numProfiles: 5,
    fuzzySearch: true,
    getDetailedWorkExperience: false,
    getDetailedEducation: false,
    companyName: { value: company?.preferredName ?? context.name },
    companyDomain: (company?.domains[0] ?? context.websiteDomain)
      ? { value: company?.domains[0] ?? context.websiteDomain }
      : null,
    profileLocation: {
      countryCode: SWISS_COUNTRY_CODE,
      locality: context.location,
    },
  };
  if (candidate.name) body.personName = { value: candidate.name, looseMatch: true };
  if (candidate.title) body.jobTitle = { value: candidate.title };
  if (candidate.linkedinUrl) body.profileIdentifier = candidate.linkedinUrl;
  if (candidate.email) body.emailAddress = candidate.email;
  const { payload, credits } = await callFiber('/v1/kitchen-sink/person', body);
  metrics.fiberCreditsCharged += credits;
  const data = payload?.output?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  return profileFromFiberRecord(data[0], 'fiber_kitchen_sink');
}

async function fiberPeopleSearch(
  context: HotelContext,
  company: FiberCompany | null,
  companyLinkedInUrls: string[],
  existingName: string | null,
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
      fuzzyName: existingName ? { anyOf: [{ name: existingName }] } : null,
      jobTitleV2: {
        anyOf: LEADERSHIP_ROLE_TERMS.map((term) => ({ type: 'term', term })),
      },
      companyMatchMode: { mode: 'loose' },
    },
    currentCompanies,
    pageSize: 10,
  });
  metrics.fiberCreditsCharged += credits;
  const data = payload?.output?.data;
  if (!Array.isArray(data)) return [];
  return data.map((item: any) => profileFromFiberRecord(item, existingName ? 'fiber_people_search_named' : 'fiber_people_search'));
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

async function fiberDomainLookup(
  context: HotelContext,
  apiKey: string,
  metrics: RunMetrics,
): Promise<string | null> {
  metrics.fiberDomainLookupCalls += 1;
  const { payload, credits } = await callFiber('/v1/domain-lookup/trigger', {
    apiKey,
    overAllContext: 'Swiss hotels and hospitality businesses',
    companyInfo: [
      {
        name: context.name,
        domain: context.websiteDomain,
        country: 'Switzerland',
        city: context.location,
        address: context.address,
        findEmailDomains: true,
        otherContext: 'hotel hospitality property',
        description: context.name,
      },
    ],
  });
  metrics.fiberCreditsCharged += credits;
  const runId = payload?.output?.domainAgentRunId;
  if (typeof runId !== 'string' || !runId) return null;

  const startedAt = Date.now();
  while (Date.now() - startedAt < 25000) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000));
    const poll = await callFiber('/v1/domain-lookup/polling', {
      apiKey,
      domainAgentRunId: runId,
      pageSize: 10,
    });
    const output = poll.payload?.output ?? {};
    if (output.status === 'DONE') {
      const first = Array.isArray(output.data) ? output.data[0] : null;
      if (typeof first?.bestDomain === 'string' && first.bestDomain) {
        return first.bestDomain;
      }
      return null;
    }
    if (output.status === 'FAILED') {
      return null;
    }
  }

  return null;
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

  if (ranked.length === 0) return null;
  return { email: ranked[0].email, status: ranked[0].status };
}

function scoreProfile(
  profile: FiberProfile,
  context: HotelContext,
  seed?: WebsitePersonCandidate,
): { score: number; notes: string[] } {
  let score = 0;
  const notes: string[] = [];
  const titleBlob = `${profile.currentJobTitle || ''} ${profile.headline || ''}`;
  if (NON_DECISION_ROLE_RE.test(titleBlob)) {
    score -= 30;
    notes.push('penalized non-decision function');
  }
  if (/general manager|deputy general manager|hotel manager|geschäftsführer|directeur|directeur general|direttore|direktor/i.test(titleBlob)) {
    score += 46;
    notes.push('strong title match');
  } else if (/managing director|owner|founder|ceo|chief executive/i.test(titleBlob)) {
    score += 40;
    notes.push('decision-maker title match');
  } else if (/director|manager|direktor/i.test(titleBlob)) {
    score += 16;
    notes.push('partial title match');
  }

  const companyBlob = `${profile.currentCompany || ''} ${profile.headline || ''}`.toLowerCase();
  const hotelTokens = tokenise(context.name);
  const companyMatches = hotelTokens.filter((token) => companyBlob.includes(token)).length;
  if (companyMatches >= Math.min(2, hotelTokens.length)) {
    score += 24;
    notes.push('company name matches hotel');
  } else if (companyMatches >= 1) {
    score += 12;
    notes.push('company partially matches hotel');
  }

  if (context.location) {
    const locationNeedle = normalizeText(context.location);
    const localityBlob = `${profile.locality || ''} ${profile.headline || ''}`.toLowerCase();
    if (localityBlob.includes(locationNeedle)) {
      score += 14;
      notes.push('location matches hotel');
    }
  }

  if (
    context.gmName &&
    profile.name &&
    normalizeText(context.gmName) === normalizeText(cleanPersonName(profile.name) ?? profile.name)
  ) {
    score += 24;
    notes.push('exact match to existing person');
  }

  if (seed?.name && profile.name && normalizeText(seed.name) === normalizeText(profile.name)) {
    score += 10;
    notes.push('exact name match to seed');
  }

  if (seed?.linkedinUrl && profile.url && normalizeText(seed.linkedinUrl) === normalizeText(profile.url)) {
    score += 10;
    notes.push('exact LinkedIn match to seed');
  }

  if (profile.url) score += 6;
  if (HOSPITALITY_KEYWORD_RE.test(titleBlob)) score += 4;

  return { score, notes };
}

function pickBestProfile(
  profiles: Array<{ profile: FiberProfile; notes: string[]; score: number; sourceCandidate?: WebsitePersonCandidate }>,
): { profile: FiberProfile; notes: string[]; score: number; sourceCandidate?: WebsitePersonCandidate } | null {
  const sorted = [...profiles].sort((a, b) => b.score - a.score);
  return sorted[0] ?? null;
}

function classifyRecoveryBucket(row: CsvRow, result: EnrichmentResult): RecoveryBucket {
  const hasWebsite = Boolean(toNullable(row.websiteUrl));
  if (result.status === 'error') return 'error_retry';
  if (result.status === 'partial') {
    if (isHighValueRole(result.roleCategory) && !result.workEmail && !result.personalEmail) {
      if (result.currentCompany && !normalizeText(result.currentCompany).includes(tokenise(row.name)[0] ?? '')) {
        return 'partial_brand_level';
      }
      return 'partial_property_no_email';
    }
    if (!isHighValueRole(result.roleCategory)) return 'partial_wrong_function';
    return 'partial_weak_match';
  }
  if (!hasWebsite) return 'unresolved_missing_website';
  if (/group|collection|minor|fairmont|marriott|radisson|hyatt|ihg|accor/i.test(result.notes || '')) {
    return 'unresolved_parent_brand';
  }
  return 'unresolved_no_person_found';
}

function resultQuality(result: EnrichmentResult): number {
  let score = 0;
  if (result.status === 'resolved') score += 100;
  else if (result.status === 'partial') score += 50;
  else if (result.status === 'error') score -= 50;

  if (result.roleCategory === 'decision_maker') score += 45;
  else if (result.roleCategory === 'gm') score += 40;
  else if (result.roleCategory === 'manager') score += 8;
  else if (result.roleCategory === 'other') score -= 12;

  if (result.workEmail) score += 35;
  if (result.personalEmail) score += 12;
  if (result.linkedinUrl) score += 10;
  if (result.phone) score += 4;
  score += Math.max(-20, Math.min(30, Math.round(result.confidenceScore / 3)));
  if (NON_DECISION_ROLE_RE.test(`${result.resolvedTitle || ''} ${result.headline || ''}`)) score -= 30;
  return score;
}

function samePerson(left: EnrichmentResult, right: EnrichmentResult): boolean {
  if (left.linkedinUrl && right.linkedinUrl) {
    return normalizeText(left.linkedinUrl) === normalizeText(right.linkedinUrl);
  }
  if (left.resolvedPersonName && right.resolvedPersonName) {
    return normalizeText(left.resolvedPersonName) === normalizeText(right.resolvedPersonName);
  }
  return false;
}

function shouldUpgrade(baseline: EnrichmentResult, candidate: EnrichmentResult): boolean {
  if (candidate.status === 'unresolved' || candidate.status === 'error') return false;
  const baselineQuality = resultQuality(baseline);
  const candidateQuality = resultQuality(candidate);
  if (samePerson(baseline, candidate)) {
    const addsDirectContact =
      Boolean(candidate.workEmail || candidate.personalEmail || candidate.phone) &&
      !Boolean(baseline.workEmail || baseline.personalEmail || baseline.phone);
    const roleUpgrade =
      isHighValueRole(candidate.roleCategory) && !isHighValueRole(baseline.roleCategory);
    const betterRoleCategory = candidate.roleCategory !== baseline.roleCategory && candidate.roleCategory !== 'other';
    return addsDirectContact || roleUpgrade || (betterRoleCategory && candidateQuality >= baselineQuality + 10);
  }
  if (isHighValueRole(candidate.roleCategory) && !isHighValueRole(baseline.roleCategory)) {
    return candidateQuality >= baselineQuality + 8;
  }
  if ((candidate.workEmail || candidate.personalEmail) && !(baseline.workEmail || baseline.personalEmail)) {
    return candidateQuality >= baselineQuality + 5;
  }
  return candidateQuality >= baselineQuality + 15;
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
  const roleCategory = roleCategoryFromTitle(profile?.currentJobTitle ?? resolved.sourceCandidate?.title ?? null);
  const hasDirectEmail = Boolean(resolved.contact?.workEmail || resolved.contact?.personalEmail);
  const status: DecisionMakerStatus =
    profile && hasDirectEmail && isHighValueRole(roleCategory)
      ? 'resolved'
      : profile
        ? 'partial'
        : 'unresolved';

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
    foundVia: uniqueStrings([
      resolved.sourceCandidate?.sourceType ?? null,
      profile?.source ?? null,
      resolved.contact ? 'fiber_contact_reveal' : null,
    ])[0] ?? null,
    sourceChannels: uniqueStrings([
      resolved.sourceCandidate?.sourceType ?? null,
      profile?.source ?? null,
      resolved.contact ? 'fiber_contact_reveal' : null,
    ]),
    sourceUrls: uniqueStrings([
      context.gmSourceUrl,
      resolved.sourceCandidate?.sourceUrl ?? null,
      resolved.sourceCandidate?.linkedinUrl ?? null,
      profile?.url,
    ]),
    notes: uniqueStrings([
      ...resolved.notes,
      ...resolved.discoveryNotes,
      resolved.sourceCandidate?.evidence ?? null,
    ]).join('; '),
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

function mergeRowWithResult(row: CsvRow, result: EnrichmentResult): CsvRow {
  const next = { ...row };
  for (const field of CONTACT_FIELDS) {
    if (!(field in next)) next[field] = '';
  }
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
  next.dm_source_channels = uniqueStrings(result.sourceChannels).join(' | ');
  next.dm_source_urls = uniqueStrings(result.sourceUrls).join(' | ');
  next.dm_match_notes = result.notes;
  next.dm_insights = result.insights;
  next.dm_updated_at = result.updatedAt;
  next.dm_error = result.error ?? '';
  return next;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function discoverRecoveryCandidates(
  context: HotelContext,
  existing: EnrichmentResult,
  firecrawlApiKey: string,
  metrics: RunMetrics,
): Promise<{ candidates: WebsitePersonCandidate[]; companyLinkedInUrls: string[]; notes: string[] }> {
  const candidates: WebsitePersonCandidate[] = [];
  const notes: string[] = [];
  const companyLinkedInUrls: string[] = [];
  const scrapedUrls = new Set<string>();

  if (existing.resolvedPersonName || existing.linkedinUrl) {
    candidates.push({
      name: cleanPersonName(existing.resolvedPersonName),
      title: existing.resolvedTitle,
      email: existing.workEmail ?? existing.personalEmail,
      linkedinUrl: existing.linkedinUrl,
      evidence: existing.notes || 'Existing recovered candidate',
      sourceUrl: existing.sourceUrls[0] ?? context.websiteUrl,
      sourceType: 'existing_result',
      seedScore: 55,
    });
  }

  if (context.websiteUrl && isAllowedDiscoveryUrl(context.websiteUrl)) {
    scrapedUrls.add(context.websiteUrl);
    try {
      const extraction = await firecrawlScrapeDecisionMakerPage(context.websiteUrl, firecrawlApiKey, metrics);
      candidates.push(...websiteCandidatesFromExtraction(extraction, context.websiteUrl));
      companyLinkedInUrls.push(...extraction.companyLinkedInUrls);
      if (extraction.pageSummary) notes.push(`Website page: ${extraction.pageSummary}`);
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
        if (extraction.pageSummary) notes.push(`Website page: ${extraction.pageSummary}`);
      } catch (error) {
        notes.push(`Website scrape skipped for ${url}: ${formatError(error)}`);
      }
    }
  }

  for (const query of buildLinkedInQueries(context)) {
    const results = await firecrawlSearch(query, firecrawlApiKey, metrics);
    for (const result of results) {
      const candidate = candidateFromLinkedInResult(result);
      if (candidate) candidates.push(candidate);
      const companyUrl = companyLinkedInUrlFromResult(result);
      if (companyUrl) companyLinkedInUrls.push(companyUrl);
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
        if (extraction.pageSummary) notes.push(`Discovery page: ${extraction.pageSummary}`);
      } catch (error) {
        notes.push(`Discovery scrape skipped for ${url}: ${formatError(error)}`);
      }
    }
  }

  return {
    candidates: dedupeCandidates(candidates, context).slice(0, 8),
    companyLinkedInUrls: uniqueStrings(companyLinkedInUrls),
    notes,
  };
}

async function recoverHotel(
  row: CsvRow,
  baseline: EnrichmentResult,
  bucket: RecoveryBucket,
  config: RecoveryConfig,
  firecrawlApiKey: string | null,
  fiberApiKey: string,
  metrics: RunMetrics,
): Promise<EnrichmentResult> {
  const context = buildContext(row, baseline);
  const discoveryNotes: string[] = [`Recovery bucket: ${bucket}`];
  let currentContext = { ...context };
  let resolvedCompany: FiberCompany | null = null;
  let companyLinkedInUrls: string[] = baseline.sourceUrls.filter((value) => /linkedin\.com\/company\//i.test(value));

  try {
    if (bucket === 'partial_property_no_email' && baseline.linkedinUrl) {
      const contact = await fiberRevealContact(baseline.linkedinUrl, fiberApiKey, metrics);
      if (contact.workEmail || contact.personalEmail || contact.phone) {
        return {
          ...baseline,
          status:
            (contact.workEmail || contact.personalEmail) && isHighValueRole(baseline.roleCategory)
              ? 'resolved'
              : 'partial',
          workEmail: contact.workEmail ?? baseline.workEmail,
          workEmailStatus: contact.workEmailStatus ?? baseline.workEmailStatus,
          personalEmail: contact.personalEmail ?? baseline.personalEmail,
          personalEmailStatus: contact.personalEmailStatus ?? baseline.personalEmailStatus,
          phone: contact.phone ?? baseline.phone,
          sourceChannels: uniqueStrings([...baseline.sourceChannels, 'fiber_contact_reveal']),
          notes: uniqueStrings([baseline.notes, 'Recovered direct contact from existing LinkedIn URL']).join('; '),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    resolvedCompany = await fiberCompanyLookup(currentContext, fiberApiKey, metrics);

    if (!resolvedCompany && !currentContext.websiteDomain && !config.skipDomainLookup) {
      const bestDomain = await fiberDomainLookup(currentContext, fiberApiKey, metrics);
      if (bestDomain) {
        currentContext = {
          ...currentContext,
          websiteDomain: bestDomain,
          websiteUrl: currentContext.websiteUrl ?? `https://${bestDomain}`,
        };
        discoveryNotes.push(`Fiber domain lookup recovered domain: ${bestDomain}`);
      }
    }

    if (!resolvedCompany && currentContext.websiteDomain) {
      resolvedCompany = await fiberCompanySearchByDomain(currentContext.websiteDomain, fiberApiKey, metrics);
    }

    if (resolvedCompany?.linkedinUrl) {
      companyLinkedInUrls.push(resolvedCompany.linkedinUrl);
    }

    let candidates: WebsitePersonCandidate[] = [];
    if (baseline.resolvedPersonName || baseline.linkedinUrl) {
      candidates.push({
        name: cleanPersonName(baseline.resolvedPersonName),
        title: baseline.resolvedTitle,
        email: baseline.workEmail ?? baseline.personalEmail,
        linkedinUrl: baseline.linkedinUrl,
        evidence: baseline.notes || 'Existing recovery seed',
        sourceUrl: baseline.sourceUrls[0] ?? currentContext.websiteUrl,
        sourceType: 'existing_result',
        seedScore: 60,
      });
    }

    let resolvedProfiles: Array<{
      profile: FiberProfile;
      notes: string[];
      score: number;
      sourceCandidate?: WebsitePersonCandidate;
    }> = [];

    for (const candidate of dedupeCandidates(candidates, currentContext).slice(0, 3)) {
      let profile: FiberProfile | null = null;
      try {
        if (candidate.linkedinUrl) {
          profile = await fiberLiveFetchProfile(candidate.linkedinUrl, fiberApiKey, metrics);
        }
        if (!profile && (candidate.name || candidate.linkedinUrl || candidate.email)) {
          profile = await fiberKitchenSink(currentContext, candidate, resolvedCompany, fiberApiKey, metrics);
        }
      } catch (error) {
        discoveryNotes.push(`Fiber seed lookup skipped: ${formatError(error)}`);
      }
      if (!profile) continue;
      const scored = scoreProfile(profile, currentContext, candidate);
      resolvedProfiles.push({
        profile,
        notes: scored.notes,
        score: scored.score,
        sourceCandidate: candidate,
      });
    }

    if (
      resolvedProfiles.length === 0 ||
      !pickBestProfile(resolvedProfiles) ||
      !isHighValueRole(roleCategoryFromTitle(pickBestProfile(resolvedProfiles)?.profile.currentJobTitle ?? null))
    ) {
      try {
        const byNameProfiles = await fiberPeopleSearch(
          currentContext,
          resolvedCompany,
          companyLinkedInUrls,
          cleanPersonName(baseline.resolvedPersonName),
          fiberApiKey,
          metrics,
        );
        for (const profile of byNameProfiles) {
          const scored = scoreProfile(profile, currentContext);
          resolvedProfiles.push({ profile, notes: scored.notes, score: scored.score });
        }
      } catch (error) {
        discoveryNotes.push(`Fiber named people search skipped: ${formatError(error)}`);
      }
    }

    try {
      const leadershipProfiles = await fiberPeopleSearch(
        currentContext,
        resolvedCompany,
        companyLinkedInUrls,
        null,
        fiberApiKey,
        metrics,
      );
      for (const profile of leadershipProfiles) {
        const scored = scoreProfile(profile, currentContext);
        resolvedProfiles.push({ profile, notes: scored.notes, score: scored.score });
      }
    } catch (error) {
      discoveryNotes.push(`Fiber people search skipped: ${formatError(error)}`);
    }

    if (!config.skipFirecrawl && firecrawlApiKey) {
      const discovered = await discoverRecoveryCandidates(currentContext, baseline, firecrawlApiKey, metrics);
      candidates.push(...discovered.candidates);
      companyLinkedInUrls.push(...discovered.companyLinkedInUrls);
      discoveryNotes.push(...discovered.notes);

      for (const candidate of dedupeCandidates(candidates, currentContext).slice(0, 4)) {
        let profile: FiberProfile | null = null;
        try {
          if (candidate.linkedinUrl) {
            profile = await fiberLiveFetchProfile(candidate.linkedinUrl, fiberApiKey, metrics);
          }
          if (!profile) {
            profile = await fiberKitchenSink(currentContext, candidate, resolvedCompany, fiberApiKey, metrics);
          }
        } catch (error) {
          discoveryNotes.push(`Recovery candidate lookup skipped: ${formatError(error)}`);
        }
        if (!profile) continue;
        const scored = scoreProfile(profile, currentContext, candidate);
        resolvedProfiles.push({
          profile,
          notes: scored.notes,
          score: scored.score,
          sourceCandidate: candidate,
        });
      }
    }

    const best = pickBestProfile(resolvedProfiles);
    if (!best || best.score < 42) {
      return {
        ...baseline,
        notes: uniqueStrings([baseline.notes, ...discoveryNotes, 'Recovery did not find a materially stronger match']).join('; '),
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

    return toResult(currentContext, {
      bestProfile: best.profile,
      contact,
      score: best.score,
      notes: best.notes,
      sourceCandidate: best.sourceCandidate,
      discoveryNotes,
    });
  } catch (error) {
    return {
      ...baseline,
      notes: uniqueStrings([baseline.notes, ...discoveryNotes]).join('; '),
      error: formatError(error),
      updatedAt: new Date().toISOString(),
    };
  }
}

function buildTargets(
  rows: CsvRow[],
  sourceCache: Map<string, EnrichmentResult>,
  config: RecoveryConfig,
): Array<{ row: CsvRow; baseline: EnrichmentResult; bucket: RecoveryBucket }> {
  const scopedRows = rows.slice(config.offset);
  const limitedRows = config.limit == null ? scopedRows : scopedRows.slice(0, config.limit);
  const targets: Array<{ row: CsvRow; baseline: EnrichmentResult; bucket: RecoveryBucket }> = [];

  for (const row of limitedRows) {
    if (config.onlySlugs && !config.onlySlugs.has(row.slug)) continue;
    const baseline = sourceCache.get(row.slug);
    if (!baseline) continue;
    if (!config.onlyStatuses.has(baseline.status)) continue;
    const bucket = classifyRecoveryBucket(row, baseline);
    targets.push({ row, baseline, bucket });
  }

  return targets;
}

function buildSummary(
  config: RecoveryConfig,
  totalRows: number,
  targets: Array<{ row: CsvRow; baseline: EnrichmentResult; bucket: RecoveryBucket }>,
  records: RecoveryRecord[],
  mergedResults: EnrichmentResult[],
  metrics: RunMetrics,
  outputFiles: Record<string, string>,
): Record<string, unknown> {
  const bucketCounts = targets.reduce<Record<string, number>>((acc, target) => {
    acc[target.bucket] = (acc[target.bucket] ?? 0) + 1;
    return acc;
  }, {});

  const before = targets.reduce<Record<string, number>>((acc, target) => {
    acc[target.baseline.status] = (acc[target.baseline.status] ?? 0) + 1;
    return acc;
  }, {});

  const after = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.final.status] = (acc[record.final.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    baseCsvPath: config.baseCsvPath,
    sourceDir: config.sourceDir,
    outputDir: config.outputDir,
    runConfig: {
      concurrency: config.concurrency,
      limit: config.limit,
      offset: config.offset,
      resume: config.resume,
      skipFirecrawl: config.skipFirecrawl,
      skipDomainLookup: config.skipDomainLookup,
      onlyStatuses: [...config.onlyStatuses],
      onlySlugs: config.onlySlugs ? [...config.onlySlugs] : null,
    },
    totals: {
      rowsRead: totalRows,
      targetedRows: targets.length,
      upgradedRows: records.filter((record) => record.action === 'upgraded').length,
      keptRows: records.filter((record) => record.action === 'kept_existing').length,
      bucketCounts,
      targetedStatusBefore: before,
      targetedStatusAfter: after,
      mergedResultStatuses: mergedResults.reduce<Record<string, number>>((acc, result) => {
        acc[result.status] = (acc[result.status] ?? 0) + 1;
        return acc;
      }, {}),
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
  if (!fiberApiKey) {
    throw new Error('FIBER_API_KEY or FIBERAI_API_KEY is required');
  }

  mkdirSync(config.outputDir, { recursive: true });
  const sourceCachePath = resolve(config.sourceDir, 'decision-maker-cache.jsonl');
  if (!existsSync(sourceCachePath)) {
    throw new Error(`Source cache not found: ${sourceCachePath}`);
  }

  const recoveryCachePath = resolve(config.outputDir, 'recovery-cache.jsonl');
  const recoveryJsonlPath = resolve(config.outputDir, 'recovery-results.jsonl');
  const mergedCsvPath = resolve(config.outputDir, 'hotelleriesuisse-members-hotels-switzerland.recovered-decision-makers.csv');
  const mergedCachePath = resolve(config.outputDir, 'decision-maker-cache.merged.jsonl');
  const summaryOutputPath = resolve(config.outputDir, 'recovery-summary.json');

  const rows = loadCsv(config.baseCsvPath);
  const sourceCache = loadCache(sourceCachePath);
  const recoveryCache = config.resume ? loadCache(recoveryCachePath) : new Map<string, EnrichmentResult>();
  const targets = buildTargets(rows, sourceCache, config);
  const limiter = new ConcurrencyLimiter(config.concurrency);
  const metrics: RunMetrics = { ...EMPTY_METRICS };
  const recoveryRecords = new Map<string, RecoveryRecord>();

  console.log(
    `[recovery] rows=${rows.length} targets=${targets.length} sourceDir=${config.sourceDir} resume=${config.resume}`,
  );

  const pendingTargets = targets.filter((target) => !config.resume || !recoveryCache.has(target.row.slug));
  console.log(`[recovery] processing ${pendingTargets.length} rows`);

  const processed = await Promise.all(
    pendingTargets.map((target, index) =>
      limiter.execute(async () => {
        console.log(`[recovery] ${index + 1}/${pendingTargets.length} ${target.row.slug} bucket=${target.bucket}`);
        const recovered = await recoverHotel(
          target.row,
          target.baseline,
          target.bucket,
          config,
          firecrawlApiKey,
          fiberApiKey,
          metrics,
        );
        const final = shouldUpgrade(target.baseline, recovered) ? recovered : target.baseline;
        const record: RecoveryRecord = {
          slug: target.row.slug,
          bucket: target.bucket,
          action: final === recovered ? 'upgraded' : 'kept_existing',
          beforeQuality: resultQuality(target.baseline),
          afterQuality: resultQuality(final),
          baseline: target.baseline,
          final,
        };
        appendJsonl(recoveryCachePath, { slug: target.row.slug, result: final });
        appendJsonl(recoveryJsonlPath, record);
        recoveryRecords.set(target.row.slug, record);
      }),
    ),
  );

  void processed;

  const effectiveRecovery = config.resume ? loadCache(recoveryCachePath) : new Map<string, EnrichmentResult>();
  const mergedResultsMap = new Map<string, EnrichmentResult>();
  for (const [slug, result] of sourceCache.entries()) mergedResultsMap.set(slug, result);
  for (const [slug, result] of effectiveRecovery.entries()) mergedResultsMap.set(slug, result);

  const mergedRows = rows.map((row) => {
    const result = mergedResultsMap.get(row.slug);
    return result ? mergeRowWithResult(row, result) : row;
  });

  writeFileSync(
    mergedCsvPath,
    stringifyCsv(mergedRows, {
      header: true,
      columns: Object.keys(mergedRows[0] ?? {}),
    }),
    'utf-8',
  );

  const mergedResults = rows
    .map((row) => mergedResultsMap.get(row.slug))
    .filter((result): result is EnrichmentResult => Boolean(result));

  const mergedCacheLines = rows
    .map((row) => mergedResultsMap.get(row.slug))
    .filter((result): result is EnrichmentResult => Boolean(result))
    .map((result) => JSON.stringify({ slug: result.slug, result }))
    .join('\n');
  writeFileSync(mergedCachePath, mergedCacheLines ? `${mergedCacheLines}\n` : '', 'utf-8');

  const effectiveRecords: RecoveryRecord[] = [];
  if (existsSync(recoveryJsonlPath)) {
    const lines = readFileSync(recoveryJsonlPath, 'utf-8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    for (const line of lines) {
      try {
        effectiveRecords.push(JSON.parse(line) as RecoveryRecord);
      } catch {
        // Ignore malformed lines.
      }
    }
  }

  const summary = buildSummary(config, rows.length, targets, effectiveRecords, mergedResults, metrics, {
    recoveryCache: recoveryCachePath,
    recoveryJsonl: recoveryJsonlPath,
    mergedCsv: mergedCsvPath,
    mergedCache: mergedCachePath,
    summary: summaryOutputPath,
  });
  writeFileSync(summaryOutputPath, JSON.stringify(summary, null, 2), 'utf-8');

  console.log(
    `[recovery] done upgraded=${effectiveRecords.filter((record) => record.action === 'upgraded').length} kept=${effectiveRecords.filter((record) => record.action === 'kept_existing').length}`,
  );
  console.log(`[recovery] csv=${mergedCsvPath}`);
  console.log(`[recovery] summary=${summaryOutputPath}`);
}

main().catch((error) => {
  console.error('[recovery] failed', error);
  process.exitCode = 1;
});
