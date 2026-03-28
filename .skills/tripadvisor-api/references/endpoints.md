# TripAdvisor API Endpoints — Deep Reference

## URL Construction

All endpoints follow the pattern:
```
https://api.content.tripadvisor.com/api/v1/location/{action}?key={API_KEY}&{params}
```

### Endpoint URLs

| Endpoint | Method | URL Pattern |
|----------|--------|-------------|
| Location Search | GET | `/location/search?key={k}&searchQuery={q}&category=hotels` |
| Nearby Search | GET | `/location/nearby_search?key={k}&latLong={lat},{lng}&category=hotels` |
| Location Details | GET | `/location/{id}/details?key={k}&language={l}&currency={c}` |
| Location Reviews | GET | `/location/{id}/reviews?key={k}&language={l}&limit={n}&offset={o}` |
| Location Photos | GET | `/location/{id}/photos?key={k}&language={l}&limit={n}&offset={o}&source={s}` |

---

## Pagination Behavior

### Search / Nearby Search
- **No pagination.** Returns up to 10 results per call. No offset/limit params on these endpoints.
- To get more hotels in an area: make multiple nearby_search calls on a tighter grid.

### Reviews
- **Paginated.** `limit` (max 5 per page) + `offset` (0-indexed).
- **Verified:** offset=5 on hotel with 1,179 reviews returned 8 more results.
- To get N reviews: make ceil(N/5) calls with offset 0, 5, 10, ...
- Reviews are ordered by recency (most recent first).
- Each language is a separate query — no way to get "all languages" in one call.

### Photos
- **Paginated.** `limit` (max 5 per page) + `offset`.
- `source` param filters: `"Expert"`, `"Management"`, `"Traveler"` (comma-separated for multiple).

---

## Error Handling

### Common HTTP Status Codes
| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad request | Check params (missing required field, invalid format) |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Key may be suspended or over quota |
| 404 | Not found | Location ID doesn't exist |
| 429 | Rate limited | Back off, retry after delay |
| 500 | Server error | Retry with exponential backoff |

### Empty Responses
- Search with no matches: `{"data": []}`
- Reviews in a language with none: `{"data": []}`
- Photos with no matches: `{"data": []}`
- Details for valid hotel with sparse data: all fields present but some empty/null

### Field Presence Variability
Not all hotels have all fields. Handle gracefully:
- `subratings` may be empty `{}`
- `trip_types` may be empty `[]`
- `brand` / `parent_brand` may be absent (independent hotels)
- `price_level` may be absent
- `ranking_data` may be absent for very new or inactive listings
- `owner_response` on reviews is optional (most reviews lack it)
- `user.user_location` may have `"id": "null"` (string "null", not null)

---

## TypeScript Client Pattern

```typescript
const TA_BASE = 'https://api.content.tripadvisor.com/api/v1';
const TA_KEY = process.env.TRIPADVISOR_API_KEY;

interface TASearchResult {
  location_id: string;
  name: string;
  distance?: string;
  bearing?: string;
  address_obj: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
    address_string?: string;
  };
}

interface TADetailResult {
  location_id: string;
  name: string;
  description?: string;
  rating?: string;
  num_reviews?: string;
  review_rating_count?: Record<string, string>;
  subratings?: Record<string, { name: string; value: string }>;
  price_level?: string;
  ranking_data?: {
    ranking: string;
    ranking_out_of: string;
    geo_location_name: string;
  };
  trip_types?: Array<{ name: string; value: string }>;
  amenities?: string[];
  awards?: Array<{ award_type: string; year: string }>;
  brand?: string;
  parent_brand?: string;
  latitude?: string;
  longitude?: string;
  // ... more fields
}

interface TAReview {
  id: number;
  lang: string;
  rating: number;
  text: string;
  title: string;
  trip_type?: string;
  travel_date?: string;
  published_date: string;
  user: {
    username: string;
    user_location?: { id: string; name?: string };
  };
  subratings?: Record<string, { name: string; value: number }>;
  owner_response?: {
    text: string;
    author: string;
    published_date: string;
    lang: string;
  };
  helpful_votes: number;
}

async function taFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${TA_BASE}${path}`);
  url.searchParams.set('key', TA_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`TA API ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}
```

---

## Rate Limiting Implementation

```typescript
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number = 50,
    private refillRate: number = 50, // per second
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
```

---

## Caching Pattern

```typescript
import { appendFileSync, readFileSync, existsSync } from 'fs';

interface CacheEntry<T> {
  key: string;
  timestamp: string;
  data: T;
}

function readCache<T>(cachePath: string): Map<string, CacheEntry<T>> {
  if (!existsSync(cachePath)) return new Map();
  const lines = readFileSync(cachePath, 'utf-8').trim().split('\n');
  const map = new Map<string, CacheEntry<T>>();
  for (const line of lines) {
    if (!line) continue;
    const entry = JSON.parse(line) as CacheEntry<T>;
    map.set(entry.key, entry);
  }
  return map;
}

function writeCache<T>(cachePath: string, key: string, data: T): void {
  const entry: CacheEntry<T> = {
    key,
    timestamp: new Date().toISOString(),
    data,
  };
  appendFileSync(cachePath, JSON.stringify(entry) + '\n');
}

function isCacheFresh(entry: CacheEntry<unknown>, maxAgeDays: number = 7): boolean {
  const age = Date.now() - new Date(entry.timestamp).getTime();
  return age < maxAgeDays * 24 * 60 * 60 * 1000;
}
```
