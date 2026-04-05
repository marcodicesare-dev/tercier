import 'dotenv/config';
import { retryWithBackoff } from './retry-with-backoff.js';
import type {
  TASearchResponse,
  TADetailResponse,
  TAReviewsResponse,
} from './types.js';

const TA_BASE = 'https://api.content.tripadvisor.com/api/v1';

function getTAKey(): string {
  const key = process.env.TRIPADVISOR_API_KEY;
  if (!key) {
    throw new Error('Missing TRIPADVISOR_API_KEY in environment');
  }
  return key;
}

// ── Token Bucket Rate Limiter ──
// TA allows 50 req/sec. We use 40 to stay safe.
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number = 40,
    private refillRate: number = 40,
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens < 1) {
      const waitMs = ((1 - this.tokens) / this.refillRate) * 1000;
      await new Promise(r => setTimeout(r, waitMs));
      this.tokens = 0;
    } else {
      this.tokens -= 1;
    }
  }
}

const rateLimiter = new TokenBucket();

// ── API Call Counter ──
let apiCallCount = 0;
export function getTACallCount(): number { return apiCallCount; }
export function resetTACallCount(): void { apiCallCount = 0; }

// ── Core fetch function ──
async function taFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  await rateLimiter.acquire();
  apiCallCount++;

  const url = new URL(`${TA_BASE}${path}`);
  url.searchParams.set('key', getTAKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  return retryWithBackoff(async () => {
    const res = await fetch(url.toString(), {
      headers: { accept: 'application/json' },
    });

    if (res.status === 429) {
      const err = new Error('TA rate limited') as Error & { status: number };
      err.status = 429;
      throw err;
    }

    if (!res.ok) {
      const body = await res.text();
      const err = new Error(`TA API ${res.status}: ${body}`) as Error & { status: number };
      err.status = res.status;
      throw err;
    }

    return res.json() as Promise<T>;
  });
}

// ── Public API Methods ──

/**
 * Search for a hotel by name. Returns up to 10 results.
 * Used to match hotelleriesuisse names -> TA location_ids.
 */
export async function searchHotel(query: string): Promise<TASearchResponse> {
  return taFetch<TASearchResponse>('/location/search', {
    searchQuery: query,
    category: 'hotels',
    language: 'en',
  });
}

/**
 * Find nearby hotels. Returns up to 10 results.
 * Used to build competitive sets.
 */
export async function nearbySearch(lat: number, lng: number, radiusKm: number = 5): Promise<TASearchResponse> {
  return taFetch<TASearchResponse>('/location/nearby_search', {
    latLong: `${lat},${lng}`,
    category: 'hotels',
    radius: String(radiusKm),
    radiusUnit: 'km',
    language: 'en',
  });
}

/**
 * Get full details for a hotel.
 * Returns ratings, subratings, amenities, awards, trip types, etc.
 * ALL values are STRINGS — parse before using.
 */
export async function getDetails(locationId: string, lang: string = 'en', currency: string = 'CHF'): Promise<TADetailResponse> {
  return taFetch<TADetailResponse>(`/location/${locationId}/details`, {
    language: lang,
    currency,
  });
}

/**
 * Get reviews for a hotel in a specific language.
 * Returns up to 5 per call. Paginate with offset.
 *
 * GOTCHA: Trip type values differ from Details endpoint:
 *   Details:  "business", "couples", "solo",        "family", "friends"
 *   Reviews:  "Business", "Couples", "Solo travel",  "Family", "Friends getaway"
 */
export async function getReviews(
  locationId: string,
  lang: string,
  limit: number = 5,
  offset: number = 0,
): Promise<TAReviewsResponse> {
  return taFetch<TAReviewsResponse>(`/location/${locationId}/reviews`, {
    language: lang,
    limit: String(limit),
    offset: String(offset),
  });
}
