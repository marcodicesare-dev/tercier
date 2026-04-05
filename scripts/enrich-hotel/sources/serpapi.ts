import { resolve } from 'node:path';
import { retryWithBackoff } from '../../phase0-enrichment/lib/retry-with-backoff.js';
import type { PipelineContext, SourceResult } from '../types.js';
import { cleanString, getCachedOrFetch, mean, statusError, statusOk, statusSkipped, toIsoDate } from '../utils.js';

const CACHE_SEARCH = resolve(process.cwd(), 'scripts/enrich-hotel/cache/serpapi-google-hotels.jsonl');
const SERPAPI_BASE = 'https://serpapi.com/search.json';

function getApiKey(): string {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error('Missing SERPAPI_KEY');
  return key;
}

function tomorrow(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

async function callSerpApi(params: Record<string, string>): Promise<any> {
  return await retryWithBackoff(async () => {
    const url = new URL(SERPAPI_BASE);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set('api_key', getApiKey());
    const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error(`SerpApi ${res.status}: ${text.slice(0, 220)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return await res.json();
  });
}

function extractPrice(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const match = value.replace(/,/g, '').match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function collectRateCandidates(node: any, bucket: Array<{ name: string; price: number }>): void {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    node.forEach(item => collectRateCandidates(item, bucket));
    return;
  }

  const maybeName = cleanString(node.name) ?? cleanString(node.source) ?? cleanString(node.hotel_class) ?? cleanString(node.rate_name);
  const maybePrice =
    extractPrice(node.price) ??
    extractPrice(node.rate_per_night?.lowest) ??
    extractPrice(node.total_rate?.lowest) ??
    extractPrice(node.extracted_price);

  if (maybeName && maybePrice != null) {
    bucket.push({ name: maybeName, price: maybePrice });
  }

  Object.values(node).forEach(value => collectRateCandidates(value, bucket));
}

function pickSourcePrice(candidates: Array<{ name: string; price: number }>, matcher: RegExp): number | null {
  const match = candidates.find(candidate => matcher.test(candidate.name.toLowerCase()));
  return match?.price ?? null;
}

export async function runSerpApi(context: PipelineContext): Promise<SourceResult> {
  try {
    const query = [context.input.name, context.input.city, context.input.country].filter(Boolean).join(' ');
    const checkIn = tomorrow(1);
    const checkOut = tomorrow(2);
    const cacheKey = `${query}:${checkIn}:${checkOut}`;

    const searchResult = await getCachedOrFetch<any>(
      CACHE_SEARCH,
      cacheKey,
      async () =>
        await callSerpApi({
          engine: 'google_hotels',
          q: query,
          check_in_date: checkIn,
          check_out_date: checkOut,
          currency: 'USD',
          adults: '2',
        }),
    );

    let detailPayload = searchResult.data;
    const propertyToken = cleanString(searchResult.data?.properties?.[0]?.property_token);
    let detailCached = true;

    if (propertyToken) {
      try {
        const detailResult = await getCachedOrFetch<any>(
          CACHE_SEARCH,
          `${propertyToken}:${checkIn}:${checkOut}`,
          async () =>
            await callSerpApi({
              engine: 'google_hotels',
              q: query,
              property_token: propertyToken,
              check_in_date: checkIn,
              check_out_date: checkOut,
              currency: 'USD',
              adults: '2',
            }),
        );
        detailPayload = detailResult.data;
        detailCached = detailResult.cached;
      } catch {
        detailPayload = searchResult.data;
        detailCached = searchResult.cached;
      }
    }

    const candidates: Array<{ name: string; price: number }> = [];
    collectRateCandidates(detailPayload, candidates);

    const booking = pickSourcePrice(candidates, /booking/);
    const expedia = pickSourcePrice(candidates, /expedia/);
    const hotelsDotCom = pickSourcePrice(candidates, /hotels\.com|hotels com/);
    const agoda = pickSourcePrice(candidates, /agoda/);
    const direct = pickSourcePrice(candidates, /(official|website|kempinski|direct)/);
    const otaPrices = [booking, expedia, hotelsDotCom, agoda].filter((value): value is number => typeof value === 'number');
    const averageOta = mean(otaPrices);

    if (!candidates.length) {
      return {
        statuses: [statusSkipped('serpapi', 'No pricing candidates returned')],
      };
    }

    return {
      hotel: {
        price_booking_com: booking,
        price_expedia: expedia,
        price_hotels_com: hotelsDotCom,
        price_direct: direct,
        price_lowest_ota: otaPrices.length ? Math.min(...otaPrices) : null,
        price_parity_score: direct != null && averageOta ? direct / averageOta : null,
        price_ota_count: otaPrices.length,
        price_check_date: toIsoDate(new Date()),
      },
      priceSnapshot: {
        check_date: toIsoDate(new Date()) ?? new Date().toISOString().slice(0, 10),
        check_in_date: checkIn,
        nights: 1,
        currency: 'USD',
        price_booking_com: booking,
        price_expedia: expedia,
        price_hotels_com: hotelsDotCom,
        price_agoda: agoda,
        price_direct: direct,
        price_lowest_ota: otaPrices.length ? Math.min(...otaPrices) : null,
        price_parity_score: direct != null && averageOta ? direct / averageOta : null,
        ota_count: otaPrices.length,
        raw_response: detailPayload,
      },
      statuses: [
        statusOk(
          'serpapi',
          `rates=${candidates.length}; direct=${direct ?? 'n/a'}; lowest_ota=${otaPrices.length ? Math.min(...otaPrices) : 'n/a'}`,
          searchResult.cached && detailCached,
        ),
      ],
    };
  } catch (error) {
    return {
      statuses: [statusError('serpapi', error)],
    };
  }
}
