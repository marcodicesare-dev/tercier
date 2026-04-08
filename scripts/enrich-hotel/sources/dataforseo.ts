import { resolve } from 'node:path';
import { retryWithBackoff } from '../../phase0-enrichment/lib/retry-with-backoff.js';
import type { PipelineContext, SourceResult } from '../types.js';
import { cleanString, getCachedOrFetch, normalizeDomain, statusError, statusOk, statusSkipped } from '../utils.js';

const CACHE_OVERVIEW = resolve(process.cwd(), 'scripts/enrich-hotel/cache/dataforseo-domain-overview.jsonl');
const CACHE_RANK = resolve(process.cwd(), 'scripts/enrich-hotel/cache/dataforseo-bulk-ranks.jsonl');
const CACHE_TECH = resolve(process.cwd(), 'scripts/enrich-hotel/cache/dataforseo-technologies.jsonl');
const DFSE_BASE = 'https://api.dataforseo.com/v3';

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error('Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD');
  }
  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

async function callDataForSeo<T>(path: string, body: unknown): Promise<T> {
  return await retryWithBackoff(async () => {
    const res = await fetch(`${DFSE_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error(`DataForSEO ${res.status}: ${text.slice(0, 220)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return (await res.json()) as T;
  });
}

function detectTech(technologies: Record<string, unknown> | null | undefined): { cms: string | null; analytics: string | null } {
  if (!technologies) return { cms: null, analytics: null };
  const blob = JSON.stringify(technologies).toLowerCase();

  const cms =
    blob.includes('wordpress') ? 'wordpress'
      : blob.includes('wix') ? 'wix'
        : blob.includes('squarespace') ? 'squarespace'
          : blob.includes('drupal') ? 'drupal'
            : blob.includes('kleecks') ? 'kleecks'
              : Object.keys(technologies).length ? 'custom' : null;

  const analytics =
    blob.includes('google analytics') || blob.includes('ga4') || blob.includes('googletagmanager') ? 'ga4'
      : blob.includes('matomo') || blob.includes('piwik') ? 'matomo'
        : blob.includes('adobe analytics') || blob.includes('omniture') ? 'adobe'
          : null;

  return { cms, analytics };
}

function parseInstagramHandle(urls: unknown): string | null {
  if (!Array.isArray(urls)) return null;
  for (const value of urls) {
    if (typeof value !== 'string') continue;
    const match = value.match(/instagram\.com\/([a-zA-Z0-9._-]+)/i);
    if (match?.[1]) return match[1].replace(/\/$/, '');
  }
  return null;
}

function normalizeLanguageCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/_/g, '-');
  return normalized || null;
}

function toWebsiteLanguageSignals(techItem: Record<string, unknown> | null | undefined): {
  primaryLanguage: string | null;
  contentLanguages: string | null;
  languageCount: number | null;
} {
  const languages = new Set<string>();
  const primaryLanguage = normalizeLanguageCode(techItem?.content_language_code) ?? normalizeLanguageCode(techItem?.language_code);
  if (primaryLanguage) languages.add(primaryLanguage);

  const contentLanguages = [...languages];
  return {
    primaryLanguage,
    contentLanguages: contentLanguages.length ? contentLanguages.join(' | ') : null,
    languageCount: contentLanguages.length || null,
  };
}

export async function runDataForSeo(context: PipelineContext): Promise<SourceResult> {
  const domain = normalizeDomain(context.websiteUrl);
  if (!domain) {
    return { statuses: [statusSkipped('dataforseo', 'No website domain')] };
  }

  try {
    const [overviewResult, rankResult, techResult] = await Promise.all([
      getCachedOrFetch<any>(
        CACHE_OVERVIEW,
        domain,
        async () =>
          await callDataForSeo('/dataforseo_labs/google/domain_rank_overview/live', [
            {
              target: domain,
              location_code: 2840,
              language_name: 'English',
            },
          ]),
      ),
      getCachedOrFetch<any>(
        CACHE_RANK,
        domain,
        async () =>
          await callDataForSeo('/backlinks/bulk_ranks/live', [
            {
              targets: [domain],
              rank_scale: 'one_hundred',
            },
          ]),
      ),
      getCachedOrFetch<any>(
        CACHE_TECH,
        domain,
        async () =>
          await callDataForSeo('/domain_analytics/technologies/domain_technologies/live', [
            { target: domain },
          ]),
      ),
    ]);

    const overviewItem = overviewResult.data?.tasks?.[0]?.result?.[0]?.items?.[0] ?? null;
    const rankItem = rankResult.data?.tasks?.[0]?.result?.[0]?.items?.[0] ?? null;
    const techItem = techResult.data?.tasks?.[0]?.result?.[0] ?? null;
    const metrics = overviewItem?.metrics ?? {};
    const organic = metrics.organic ?? {};
    const paid = metrics.paid ?? {};
    const { cms, analytics } = detectTech(techItem?.technologies ?? null);
    const instagramHandle = parseInstagramHandle(techItem?.social_graph_urls);
    const languageSignals = toWebsiteLanguageSignals(techItem);

    return {
      hotel: {
        seo_monthly_traffic_est: typeof organic.etv === 'number' ? Math.round(organic.etv) : null,
        seo_organic_keywords: typeof organic.count === 'number' ? Math.round(organic.count) : null,
        seo_has_google_ads: typeof paid.count === 'number' ? paid.count > 0 : null,
        seo_ad_spend_est: typeof paid.estimated_paid_traffic_cost === 'number' ? paid.estimated_paid_traffic_cost : null,
        seo_domain_authority: typeof rankItem?.rank === 'number' ? Math.round(rankItem.rank) : null,
        dp_website_tech_cms: cms,
        dp_website_tech_analytics: analytics,
        dp_website_primary_language: languageSignals.primaryLanguage,
        dp_website_content_languages: languageSignals.contentLanguages,
        dp_website_language_count: languageSignals.languageCount,
        dp_instagram_handle: instagramHandle,
        dp_instagram_exists: instagramHandle ? true : null,
        phone: cleanString(Array.isArray(techItem?.phone_numbers) ? techItem.phone_numbers[0] : null) ?? context.phone ?? null,
      },
      statuses: [
        statusOk(
          'dataforseo',
          `domain=${domain}; organic_keywords=${typeof organic.count === 'number' ? Math.round(organic.count) : 'n/a'}`,
          overviewResult.cached && rankResult.cached && techResult.cached,
        ),
      ],
    };
  } catch (error) {
    return {
      statuses: [statusError('dataforseo', error)],
    };
  }
}
