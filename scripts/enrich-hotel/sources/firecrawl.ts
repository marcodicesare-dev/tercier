import { resolve } from 'node:path';
import { retryWithBackoff } from '../../phase0-enrichment/lib/retry-with-backoff.js';
import type { PipelineContext, SourceResult } from '../types.js';
import { cleanString, getCachedOrFetch, statusError, statusOk, statusSkipped } from '../utils.js';

const CACHE_SCRAPE = resolve(process.cwd(), 'scripts/enrich-hotel/cache/firecrawl-scrape.jsonl');
const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v2';

interface FirecrawlScrapeResponse {
  data?: {
    html?: string;
    rawHtml?: string;
    markdown?: string;
    links?: string[];
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      ogLocale?: string | string[];
      'og:locale'?: string | string[];
    };
  };
}

function getApiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error('Missing FIRECRAWL_API_KEY');
  return key;
}

async function scrape(url: string): Promise<FirecrawlScrapeResponse> {
  return await retryWithBackoff(async () => {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000,
        timeout: 30000,
        storeInCache: true,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error(`Firecrawl ${res.status}: ${text.slice(0, 220)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return (await res.json()) as FirecrawlScrapeResponse;
  });
}

function detectCms(blob: string): string | null {
  if (!blob) return null;
  const lower = blob.toLowerCase();
  if (lower.includes('wp-content') || lower.includes('wordpress')) return 'wordpress';
  if (lower.includes('wix.com') || lower.includes('wixstatic.com')) return 'wix';
  if (lower.includes('squarespace')) return 'squarespace';
  if (lower.includes('drupal')) return 'drupal';
  if (lower.includes('kleecks')) return 'kleecks';
  return 'custom';
}

function detectBookingEngine(blob: string): string | null {
  if (!blob) return null;
  const lower = blob.toLowerCase();
  if (lower.includes('thebookingbutton') || lower.includes('siteminder')) return 'siteminder';
  if (lower.includes('cloudbeds')) return 'cloudbeds';
  if (lower.includes('mews')) return 'mews';
  if (lower.includes('synxis') || lower.includes('sabre')) return 'synxis';
  if (lower.includes('d-edge') || lower.includes('availpro')) return 'd-edge';
  if (lower.includes('bookassist')) return 'bookassist';
  return 'none';
}

function detectAnalytics(blob: string): string | null {
  if (!blob) return null;
  const lower = blob.toLowerCase();
  if (lower.includes('googletagmanager') || lower.includes('gtag(') || /g-[a-z0-9]+/i.test(lower)) return 'ga4';
  if (lower.includes('matomo') || lower.includes('piwik')) return 'matomo';
  if (lower.includes('adobe') || lower.includes('omniture')) return 'adobe';
  return 'none';
}

function findInstagramHandle(blob: string, links: string[] = []): string | null {
  const combined = `${blob}\n${links.join('\n')}`;
  const match = combined.match(/instagram\.com\/([a-zA-Z0-9._-]+)/i);
  return match?.[1] ? match[1].replace(/\/$/, '') : null;
}

function normalizeLanguageCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/_/g, '-');
  return normalized || null;
}

function extractHtmlLanguage(blob: string): string | null {
  const match = blob.match(/<html[^>]+lang=["']?([a-zA-Z_-]+)/i);
  return normalizeLanguageCode(match?.[1] ?? null);
}

function listLocaleValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => normalizeLanguageCode(item))
      .filter((item): item is string => Boolean(item));
  }
  const single = normalizeLanguageCode(value);
  return single ? [single] : [];
}

function extractWebsiteLanguages(blob: string, metadata: FirecrawlScrapeResponse['data']['metadata']): {
  primaryLanguage: string | null;
  contentLanguages: string | null;
  languageCount: number | null;
} {
  const languages = new Set<string>();
  const primaryLanguage =
    normalizeLanguageCode(metadata?.language) ??
    listLocaleValues(metadata?.ogLocale)[0] ??
    listLocaleValues(metadata?.['og:locale'])[0] ??
    extractHtmlLanguage(blob);

  if (primaryLanguage) languages.add(primaryLanguage);
  for (const locale of listLocaleValues(metadata?.ogLocale)) languages.add(locale);
  for (const locale of listLocaleValues(metadata?.['og:locale'])) languages.add(locale);
  const htmlLanguage = extractHtmlLanguage(blob);
  if (htmlLanguage) languages.add(htmlLanguage);

  const contentLanguages = [...languages];
  return {
    primaryLanguage,
    contentLanguages: contentLanguages.length ? contentLanguages.join(' | ') : null,
    languageCount: contentLanguages.length || null,
  };
}

export async function runFirecrawl(context: PipelineContext): Promise<SourceResult> {
  if (!context.websiteUrl) {
    return { statuses: [statusSkipped('firecrawl', 'No website URL')] };
  }

  try {
    const scrapeResult = await getCachedOrFetch<FirecrawlScrapeResponse>(
      CACHE_SCRAPE,
      context.websiteUrl,
      async () => await scrape(context.websiteUrl as string),
    );
    const data = scrapeResult.data.data ?? {};
    const htmlBlob = `${data.rawHtml ?? ''}\n${data.html ?? ''}\n${data.markdown ?? ''}`;
    const instagramHandle = findInstagramHandle(htmlBlob, data.links ?? []);
    const languageSignals = extractWebsiteLanguages(htmlBlob, data.metadata);

    return {
      hotel: {
        dp_website_tech_cms: detectCms(htmlBlob),
        dp_website_tech_booking: detectBookingEngine(htmlBlob),
        dp_website_tech_analytics: detectAnalytics(htmlBlob),
        dp_website_primary_language: languageSignals.primaryLanguage,
        dp_website_content_languages: languageSignals.contentLanguages,
        dp_website_language_count: languageSignals.languageCount,
        dp_instagram_handle: instagramHandle,
        dp_instagram_exists: instagramHandle ? true : null,
      },
      statuses: [
        statusOk(
          'firecrawl',
          `cms=${detectCms(htmlBlob) ?? 'unknown'}; booking=${detectBookingEngine(htmlBlob) ?? 'unknown'}`,
          scrapeResult.cached,
        ),
      ],
    };
  } catch (error) {
    return {
      statuses: [statusError('firecrawl', error)],
    };
  }
}
