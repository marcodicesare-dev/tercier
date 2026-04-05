# Codex Agent: Deep Intelligence — Full Review Corpus + DataForSEO Backbone

## What This Does

Upgrades the existing enrichment pipeline at `scripts/enrich-hotel/` to use DataForSEO as the primary review and pricing engine. The TA Content API currently gives us ~27 reviews per hotel. DataForSEO gives us the **FULL TripAdvisor review corpus** (up to 4,490 reviews per hotel, all languages, all owner responses, 13 years of history) plus Google reviews, Google Hotel pricing, and hotel info — all through one API.

**VERIFIED LIVE on Kempinski Budapest:** DataForSEO returned all 3,333 TripAdvisor reviews across 15 languages (en:2421, it:192, de:157, ru:116, es:103...) with 60% owner response rate, dating back to April 2013. Cost: $0.50.

**Target:** Re-enrich both Kempinski hotels with full review corpora from DataForSEO. Fill the `hotel_reviews` table with thousands of reviews, not dozens.

---

## What Already Exists (DO NOT REBUILD)

- **Pipeline:** `scripts/enrich-hotel/` — 2,371 lines TypeScript, 7 source adapters, compiles clean
- **Database:** Supabase project `rfxuxkbfpewultpuojpe`, 10 tables, 273 columns in `hotels`, deep intelligence tables deployed (`hotel_metric_snapshots`, `hotel_price_snapshots`, `review_topic_index`)
- **Data:** 21 hotels (2 Kempinskis + 18 competitors + 1 test), 46 reviews (from limited TA API), 984 amenities
- **Migrations:** 3 applied (`20260403191000`, `20260404000000`, `20260404100000`)
- **All env vars configured** in `.env` and `.env.local`

---

## API Keys (all in `.env` and `.env.local` — DO NOT overwrite)

```
# .env
TRIPADVISOR_API_KEY     — TA Content API (details, subratings, trip types, amenities)
GOOGLE_PLACES_API_KEY   — Google Places (Gemini summary, landmarks, editorial)
SERPAPI_KEY              — SerpApi (KEEP as fallback for pricing if DataForSEO Hotel pricing fails)
DATAFORSEO_LOGIN        — DataForSEO (TA reviews, Google reviews, Google Hotel info, SEO)
DATAFORSEO_PASSWORD     — DataForSEO password

# .env.local
FIRECRAWL_API_KEY       — Firecrawl (website CMS/booking engine/analytics detection)
FIBER_API_KEY           — Fiber AI (GM contacts — currently out of credits, skip gracefully)
```

Load both files at startup:
```typescript
import { config } from 'dotenv';
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });
```

---

## The New Source Architecture

```
Phase 1: DISCOVERY (sequential)
  ├── TripAdvisor Content API Search → ta_location_id
  ├── Google Places Autocomplete → gp_place_id
  └── OSM Overpass/Nominatim → osm_id

Phase 2: ENRICHMENT (Promise.allSettled — all in parallel)
  ├── TripAdvisor Content API Details → subratings, trip types, amenities, ranking, brand
  ├── TripAdvisor Content API Nearby → competitive set (9 nearest)
  ├── DataForSEO TA Reviews (NEW) → FULL review corpus (up to 4,490 reviews)
  ├── DataForSEO Google Reviews (NEW) → FULL Google review corpus (up to 4,490)
  ├── DataForSEO Google Hotel Info (NEW) → structured amenities, location scores, pricing
  ├── DataForSEO SEO metrics → DA, traffic, keywords, ads, tech stack, social
  ├── Google Places Details → Gemini summary, editorial, landmarks, accessibility
  ├── Firecrawl website scrape → CMS, booking engine, analytics
  ├── Fiber AI contacts → GM name, email, phone (SKIP if credits exhausted)
  └── SerpApi pricing (fallback) → OTA pricing if DataForSEO Hotel doesn't cover it

Phase 3: COMPUTE → all derived fields, scores, flags
Phase 4: SNAPSHOT → metric snapshot + price snapshot
```

**What changed:** DataForSEO TA Reviews replaces the TA Content API's review endpoint. TA Content API is still used for Details (subratings, trip types, amenities, ranking) because DataForSEO doesn't expose those structured TA fields. DataForSEO Google Hotel Info supplements Google Places for amenity structure, location scoring, and pricing.

---

## What to Build

### 1. New Source Adapter: `sources/dataforseo-reviews.ts`

This is the **critical new file**. It calls two DataForSEO endpoints:
- **TripAdvisor Reviews** — full review corpus
- **Google Reviews** — full Google review corpus

Both use the same async task pattern: POST to create task → poll GET for results.

#### DataForSEO Auth

```typescript
const DFSE_LOGIN = process.env.DATAFORSEO_LOGIN;
const DFSE_PASSWORD = process.env.DATAFORSEO_PASSWORD;

function getDfseAuth(): string {
  if (!DFSE_LOGIN || !DFSE_PASSWORD) throw new Error('Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD');
  return Buffer.from(`${DFSE_LOGIN}:${DFSE_PASSWORD}`).toString('base64');
}

const DFSE_HEADERS = () => ({
  'Authorization': `Basic ${getDfseAuth()}`,
  'Content-Type': 'application/json',
});
```

#### 1a. DataForSEO TripAdvisor Reviews

**Endpoint:** `POST https://api.dataforseo.com/v3/business_data/tripadvisor/reviews/task_post`
**Retrieval:** `GET https://api.dataforseo.com/v3/business_data/tripadvisor/reviews/task_get/{task_id}`

**Request:**
```json
[{
  "url_path": "/Hotel_Review-g274887-d276384-Reviews-Kempinski_Hotel_Corvinus_Budapest-Budapest_Central_Hungary.html",
  "depth": 4490,
  "sort_by": "most_recent",
  "priority": 2
}]
```

**How to get `url_path`:** The TA Content API Details response includes `web_url` which looks like:
```
https://www.tripadvisor.com/Hotel_Review-g274887-d276384-Reviews-Kempinski_Hotel_Corvinus_Budapest-Budapest_Central_Hungary.html?m=66827
```
Strip the domain and query params to get the `url_path`:
```typescript
function extractTaUrlPath(taWebUrl: string): string {
  const url = new URL(taWebUrl);
  return url.pathname; // "/Hotel_Review-g274887-d276384-Reviews-..."
}
```

**IMPORTANT:** The TA Content API Details must run BEFORE this source, because we need `web_url` to construct the `url_path`. In the current pipeline architecture, TA Details runs in Phase 2 bootstrap. DataForSEO Reviews should run as a DEPENDENT source (after TA Details completes and provides `web_url`).

**Request parameters:**
- `url_path` (required) — TripAdvisor URL path
- `depth` — Number of reviews to fetch. Set to `min(ta_num_reviews, 4490)` where `ta_num_reviews` comes from TA Details
- `sort_by` — `"most_recent"` to get temporal coverage
- `priority` — `2` (high priority, results in ~1 min instead of ~45 min)

**Polling:** After task_post returns a task_id, poll task_get every 10 seconds until status_code is 20000 (success) or an error code. Timeout after 10 minutes.

```typescript
async function pollTaskResult(taskId: string, maxWaitMs: number = 600000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`https://api.dataforseo.com/v3/business_data/tripadvisor/reviews/task_get/${taskId}`, {
      headers: { 'Authorization': `Basic ${getDfseAuth()}` },
    });
    const json = await res.json();
    const task = json.tasks?.[0];
    if (task?.status_code === 20000 && task?.result?.[0]?.items) {
      return task.result[0];
    }
    if (task?.status_code !== 40602) { // 40602 = still in queue
      throw new Error(`DataForSEO task failed: ${task?.status_code} ${task?.status_message}`);
    }
    await new Promise(r => setTimeout(r, 10000)); // poll every 10s
  }
  throw new Error('DataForSEO task timed out after 10 minutes');
}
```

**Response fields per review** (map to `ReviewInsert`):
```typescript
// DataForSEO review item → our ReviewInsert format
function mapDfseReviewToInsert(item: any): ReviewInsert {
  return {
    source: 'tripadvisor',  // the data originates from TA
    source_review_id: String(item.review_id),
    lang: item.original_language ?? 'en',
    rating: item.rating?.value ?? null,
    title: item.title ?? null,
    text: item.review_text ?? null,
    trip_type: null,  // DataForSEO doesn't return trip_type per review
    travel_date: item.date_of_visit ?? null,
    published_date: item.timestamp ?? null,
    helpful_votes: 0,
    reviewer_username: item.name ?? null,
    reviewer_location: item.location ?? null,
    reviewer_location_id: null,
    has_owner_response: Boolean(item.responses?.length),
    owner_response_text: item.responses?.[0]?.text ?? null,
    owner_response_author: item.responses?.[0]?.title ?? null,  // "Response from Manager" etc.
    owner_response_date: item.responses?.[0]?.timestamp ?? null,
    owner_response_lang: item.responses?.[0]?.language ?? null,
    subratings: null,  // DataForSEO doesn't return per-review subratings
  };
}
```

**Cost:** $0.00075 per 10 reviews. A hotel with 3,333 reviews costs ~$0.50. A hotel with 500 reviews costs ~$0.04.

#### 1b. DataForSEO Google Reviews

**Endpoint:** `POST https://api.dataforseo.com/v3/business_data/google/reviews/task_post`
**Retrieval:** `GET https://api.dataforseo.com/v3/business_data/google/reviews/task_get/{task_id}`

**Request:**
```json
[{
  "keyword": "Kempinski Hotel Corvinus Budapest",
  "location_name": "Budapest,Hungary",
  "language_name": "English",
  "depth": 4490,
  "sort_by": "newest",
  "priority": 2
}]
```

Can also use `place_id` instead of `keyword` if we have the Google Place ID:
```json
[{
  "place_id": "ChIJS3lyakDcQUcRhHOxez3aqUA",
  "depth": 4490,
  "sort_by": "newest",
  "priority": 2
}]
```

**Response fields per review** (map to `ReviewInsert`):
```typescript
function mapDfseGoogleReviewToInsert(item: any): ReviewInsert {
  return {
    source: 'google',
    source_review_id: item.review_id ?? null,
    lang: 'en',  // Google reviews are returned in the requested language
    rating: item.rating?.value ?? null,
    title: null,  // Google reviews don't have titles
    text: item.review_text ?? null,
    trip_type: null,
    travel_date: null,
    published_date: item.timestamp ?? null,
    helpful_votes: item.rating?.votes_count ?? 0,
    reviewer_username: item.profile_name ?? null,
    reviewer_location: null,
    reviewer_location_id: null,
    has_owner_response: Boolean(item.owner_answer),
    owner_response_text: item.owner_answer ?? null,
    owner_response_author: null,
    owner_response_date: item.owner_timestamp ?? null,
    owner_response_lang: null,
    subratings: null,
  };
}
```

**Cost:** Same as TA Reviews — $0.00075 per 10 reviews.

#### 1c. DataForSEO Google Hotel Info (OPTIONAL — only if hotel_identifier is available)

**Endpoint:** `POST https://api.dataforseo.com/v3/business_data/google/hotel_info/task_post`

**Request:** Requires `hotel_identifier` from Google Hotel Searches. This is a 2-step process:
1. First call Google Hotel Searches to find the hotel and get `hotel_identifier`
2. Then call Hotel Info with that identifier

**For this iteration: SKIP Google Hotel Info.** The value-add (structured amenities, location scores, check-in/out times) is nice-to-have but not critical. We already get amenities from TA Details and pricing from SerpApi. Add this in a future iteration.

### 2. Modify the Pipeline Orchestrator

In `scripts/enrich-hotel/enrich.ts`, the DataForSEO reviews source needs to run AFTER TA Details (because it needs `web_url` for the `url_path`).

The current pipeline has two stages:
- **Bootstrap:** tripadvisor, google_places, osm (sequential)
- **Dependent:** dataforseo, firecrawl, fiber, serpapi (parallel)

DataForSEO TA Reviews needs to be a **third stage** or folded into the dependent stage with access to `web_url` from the bootstrap TA result.

**Recommended approach:** Add DataForSEO reviews as a new source in the dependent stage. The `PipelineContext` already has `taLocationId` and the TA Details result will have populated `ta_web_url` in the hotel upsert. Pass `web_url` through the context.

Add to `PipelineContext`:
```typescript
taWebUrl?: string | null;  // TripAdvisor web URL (needed for DataForSEO url_path)
```

After TA Details completes in bootstrap, extract `web_url` and set it on the context:
```typescript
context.taWebUrl = taResult.hotel?.ta_web_url as string | null;
```

Then the dependent stage includes the new DataForSEO reviews source which reads `context.taWebUrl`.

### 3. Update the Existing `sources/dataforseo.ts`

The current `dataforseo.ts` handles SEO metrics (DA, traffic, keywords, ads, tech stack). Keep that as-is. The new reviews functionality goes in a NEW file `sources/dataforseo-reviews.ts` to keep concerns separate.

### 4. Handle Review Deduplication

The current pipeline already stored ~27 TA reviews and ~5 Google reviews per hotel from the old sources. The DataForSEO reviews will include those same reviews (plus thousands more). The `hotel_reviews` table has a UNIQUE constraint on `(hotel_id, source, source_review_id)`.

**Strategy:** Use upsert with `onConflict: 'hotel_id,source,source_review_id'` and `ignoreDuplicates: true`. This way:
- Existing reviews from the old TA API calls are kept
- New reviews from DataForSEO are added
- Duplicates are silently skipped
- No data loss

### 5. Batch Insert Reviews

3,333 reviews is a lot to insert in one Supabase call. Batch them:

```typescript
const BATCH_SIZE = 100;
for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
  const batch = reviews.slice(i, i + BATCH_SIZE);
  const { error } = await supabase
    .from('hotel_reviews')
    .upsert(
      batch.map(r => ({ hotel_id: hotelId, ...r })),
      { onConflict: 'hotel_id,source,source_review_id', ignoreDuplicates: true }
    );
  if (error) {
    console.error(`[WARN] Review batch ${i}-${i + batch.length} failed: ${error.message}`);
  }
}
```

### 6. Update Review Aggregates After Full Corpus

After inserting the full corpus, recompute the review aggregate fields on the hotels table:

```typescript
// Query all reviews for this hotel from DB (not just the ones we just inserted)
const { data: allReviews } = await supabase
  .from('hotel_reviews')
  .select('lang, rating, has_owner_response, published_date, reviewer_location, owner_response_date')
  .eq('hotel_id', hotelId);

// Recompute:
// ta_review_languages, ta_review_language_count
// ta_owner_response_count, ta_owner_response_rate
// ta_owner_response_avg_delay_hrs
// ta_review_most_recent_date, ta_review_recency_days
// ta_reviews_last_90d_est
// ta_reviewer_top_locations
// ta_avg_rating_en through ta_avg_rating_ja
// Also update hotel_lang_ratings table
```

### 7. Cache Strategy for DataForSEO Tasks

DataForSEO tasks are async — they return a task_id, then you poll for results. Cache the FINAL result (the full review array) in JSONL, NOT the task_id.

```
scripts/enrich-hotel/cache/dataforseo-ta-reviews.jsonl
scripts/enrich-hotel/cache/dataforseo-google-reviews.jsonl
```

Cache key: `{ta_location_id}` for TA reviews, `{gp_place_id}` for Google reviews.
Cache TTL: 7 days (same as other sources).

On re-run: if cached result exists and is fresh, skip the DataForSEO call entirely.

### 8. Update `SourceResult` Type

The new source returns reviews but no hotel upsert fields (the review data goes to `hotel_reviews` table, not the `hotels` table). The existing `SourceResult` type already supports this — `reviews` is an optional array.

### 9. Run It

After implementing:

```bash
# Type check
npx tsc --noEmit

# Re-enrich both Kempinskis (will use cache for TA Details, fresh calls for DataForSEO reviews)
npm run enrich -- --json '[{"name":"Kempinski Hotel Corvinus Budapest","city":"Budapest","country":"Hungary"},{"name":"The Apurva Kempinski Bali","city":"Nusa Dua","country":"Indonesia"}]'
```

### 10. Verify

```bash
# Check review counts — should now be 3000+ per hotel instead of 30-50
node --input-type=module <<'EOF'
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: hotels } = await supabase.from('hotels').select('id,name').in('name', ['Kempinski Hotel Corvinus Budapest','The Apurva Kempinski Bali']);
for (const h of hotels) {
  const { data: reviews } = await supabase.from('hotel_reviews').select('source,lang').eq('hotel_id', h.id);
  const taSrc = reviews.filter(r => r.source === 'tripadvisor');
  const gpSrc = reviews.filter(r => r.source === 'google');
  const langs = new Set(reviews.map(r => r.lang));
  console.log(`${h.name}: ${reviews.length} total (${taSrc.length} TA, ${gpSrc.length} Google), ${langs.size} languages`);
}
EOF
```

Expected output:
```
Kempinski Hotel Corvinus Budapest: ~3500+ total (3333 TA, 100+ Google), 15+ languages
The Apurva Kempinski Bali: ~3000+ total (2862 TA, 200+ Google), 10+ languages
```

---

## Cost Estimate

| Hotel | TA Reviews (DataForSEO) | Google Reviews (DataForSEO) | Total |
|-------|------------------------|----------------------------|-------|
| Kempinski Budapest (3,333 TA reviews) | $0.50 | ~$0.15 | $0.65 |
| Apurva Bali (2,862 TA reviews) | $0.43 | ~$0.10 | $0.53 |
| **Total** | **$0.93** | **~$0.25** | **~$1.18** |

Balance remaining: $127.99. This uses less than 1% of the balance.

---

## What NOT to Do

- Do NOT remove or modify the existing `sources/tripadvisor.ts` — it handles TA Details/subratings/trip types/amenities which DataForSEO doesn't provide
- Do NOT remove `sources/serpapi.ts` — keep as pricing fallback
- Do NOT remove `sources/dataforseo.ts` — it handles SEO metrics (DA, traffic, keywords, ads)
- Do NOT change the database schema — all tables and columns are already deployed
- Do NOT drop existing review data — use upsert with ignoreDuplicates
- Do NOT call DataForSEO reviews synchronously in the main flow — use the async task pattern (POST task, poll for results)
- Do NOT set depth higher than `ta_num_reviews` — that wastes credits polling for non-existent reviews
- Do NOT forget to batch insert reviews (3,333 in one call will timeout Supabase)

---

## Expected Outcome

After this task:
1. New file `sources/dataforseo-reviews.ts` with TA Reviews + Google Reviews adapters
2. Pipeline orchestrator updated to pass `taWebUrl` to the new source
3. Both Kempinskis re-enriched with full review corpora
4. `hotel_reviews` table goes from 46 rows to ~6,500+ rows
5. Review aggregates recomputed on the hotels table from the full corpus
6. `hotel_lang_ratings` table updated with accurate per-language averages from thousands of reviews
7. All existing data preserved (amenities, competitors, snapshots, SEO metrics)
8. TypeScript compiles clean
9. Total cost: ~$1.20

The database will then have the deepest hotel review intelligence dataset we've ever built — every review, every language, every owner response, going back 13 years, for 2 pilot hotels. That's the foundation the AI product layer needs.
