---
name: hotels-dataset
description: "Provides the strategy and architecture for building the world's most comprehensive hotel intelligence dataset. An agent should load this skill when designing data pipelines, planning discovery phases, defining data schemas, computing derived intelligence scores, or making any decision about the global hotels dataset. Covers the full vision (1.5M+ hotels), multi-source strategy (TripAdvisor + Google Places + DataForSEO + supporting sources), 4-phase execution plan, 297-field schema, deep relational model, derived intelligence products, and how the dataset powers Lumina's 5 core platform capabilities."
---

# Global Hotels Dataset — Strategy & Architecture

## The Vision in One Paragraph

Build a structured intelligence dataset covering every hotel across TripAdvisor, Google Places, DataForSEO, and a small set of supporting sources — 1.5M+ properties globally. Each hotel gets a 297-field summary card plus deep relational data: quality fingerprint (6 TA subratings + Google rating), guest segment distribution, multilingual full-review corpus, pre-booking Q&A, GMB signals, amenity inventory, competitive set, pricing history, snapshots, and future AI-visibility / Booking.com / government-star enrichments. Reviews and intent signals are stored separately as corpora the AI layer can reason over. This dataset IS Tercier's moat. It pre-populates the product from day one, arms the sales team with per-property intelligence before first contact, and creates a data asset no competitor can replicate. Validated on live multi-source Kempinski pilots on April 4, 2026.

---

## Why This Dataset Matters

### For the Product (7-Layer Platform)
| Tercier Layer | What the Dataset Provides |
|---------------|--------------------------|
| L1: Market Intelligence | City ranking, price level, review volume as demand proxy, brand/chain mapping |
| L2: Voice-of-Customer | 6-dim subratings, multilingual review corpus, sentiment by language, owner response patterns |
| L3: Persona & Intent | Trip type distribution with REAL counts (business/couples/solo/family/friends), reviewer home locations |
| L4: Competitive Reading | Auto-computed competitive sets, amenity comparison, rating benchmarking, award differentiation |
| L5: AI Discovery | Listing completeness, photo inventory, review volume as visibility signal |
| L6: Decision Engine | All scoring inputs from real data, not estimates |
| L7: Content Engine | Guest voice library (real quotes), multilingual vocabulary per segment |

### For Sales
Walk into any meeting pre-armed: "We already know your TripAdvisor ranking is #47 of 312. Your service score is 4.3 but your nearest competitor scores 4.7. 38% of your guests are couples but your website doesn't speak to couples."

### For Scale
New hotel signs up → platform is pre-populated. No per-hotel onboarding delay. Tercier's product works from minute one because the data is already there.

---

## The 4 Phases

### Phase 0: Switzerland (1 day)
**Scope:** 2,069 hotelleriesuisse hotels → dual-source enrichment from TripAdvisor + Google Places

**Step 1 — Match to TripAdvisor (est. 4,138 calls, ~1.5 min)**
- Search by hotel name + phone (highest confidence)
- Fallback: name + latLong from enriched master
- Store location_id mapping in `ta_match_cache.jsonl`

**Step 2 — Fetch TA Details (est. 2,069 calls, ~40 sec)**
- Details endpoint for all matched hotels
- Extract: subratings, trip types, amenities, ranking, brand, awards, price_level

**Step 3 — Fetch TA Reviews (est. 12,414 calls, ~4 min)**
- 6 languages per hotel: en, de, fr, it, es, ru
- 1 page per language (5 reviews each, 30 reviews/hotel max)
- Extract per review: rating, trip_type, user_location, text, owner_response

**Step 4 — Match to Google Places (est. 2,069 calls, ~$6)**
- Autocomplete with hotel name + lat/lng bias ($2.83/1000)
- Store place_id mapping in `gp_match_cache.jsonl`

**Step 5 — Fetch Google Details (est. 2,069 calls, ~$52)**
- Enterprise+Atmosphere tier for editorial summary, reviews, accessibility, landmarks
- Extract: editorial_summary, review_summary_gemini, landmarks, allows_dogs, good_for_children

**Step 6 — Fetch TA Competitive Sets (est. 2,069 calls, ~40 sec)**
- nearby_search from each hotel's lat/lng → 10 nearest competitors
- Store as competitive_set array per hotel

**Step 7 — Compute Intelligence (local, ~30 sec)**
- All derived fields: HQI, CPS, TOS, subrating analysis, segment analysis
- Source market aggregation from reviewer locations
- Per-language average ratings
- Owner response rate
- Cross-platform rating divergence

**Total API calls:** ~22,800 TA + ~4,138 Google = ~27,000 calls
**Total cost:** TA = free (within limits) + Google = ~$58
**Total wall time:** ~15 minutes at 50 calls/sec
**Output:** 2,069 hotels × 100+ columns + multilingual review corpus (62,000+ reviews)

### Phase 1: European Premium Cities (3 weeks)
- 50 cities, ~150,000 hotels
- Geo-grid discovery + brand searches
- Details + reviews (6 languages per hotel)
- **Output:** Full European hotel intelligence covering the SAM

### Phase 2: Global Premium Cities (3 months)
- 200 cities, ~500,000 hotels
- Extend grid to all major hospitality markets
- **Output:** Global dataset covering the TAM + context

### Phase 3: Full Planet (6 months)
- All tourism regions worldwide
- ~1,500,000+ hotels
- **Output:** The most comprehensive hotel dataset ever assembled

---

## Discovery Strategy

### Geo-Grid Discovery (Primary)
Divide the planet into cells. At each cell center, call `nearby_search?category=hotels`. Each call returns up to 10 hotels. Deduplicate by `location_id`.

**Grid resolution:**
- Urban centers: 0.5km spacing (~4 points/km²)
- Suburban/resort: 2km spacing (~0.25 points/km²)
- Rural tourism: 5km spacing
- Non-tourism areas: skip

### Brand-Name Search (Parallel)
Search for every known hotel brand + city to capture chain properties:

**Luxury:** Four Seasons, Ritz-Carlton, St. Regis, Park Hyatt, Mandarin Oriental, Aman, Rosewood, Peninsula, Bulgari, Raffles, Belmond, Six Senses, One&Only

**Upper upscale:** Marriott, Hilton, Hyatt, IHG, Accor, Radisson, Kempinski, Fairmont, Sofitel, JW Marriott, Conrad, Waldorf Astoria, W Hotels, Le Méridien, Sheraton, Westin

**Lifestyle/boutique:** citizenM, 25hours, Hoxton, Ace Hotel, 1 Hotels, Nobu, Edition, Kimpton, Autograph Collection, Design Hotels, Mama Shelter, Moxy, Aloft

### Deduplication
`location_id` is globally unique. Same hotel discovered from multiple grid points = one record. Keep the discovery source with highest confidence.

---

## Data Schema Overview (Validated on 10-Hotel Global Sample)

Every hotel gets ~100 fields organized into 11 categories. Schema validated with live API data from Baur au Lac, Dolder Grand, Four Seasons George V, Aman Tokyo, Mandarin Oriental Bangkok, Burj Al Arab, Claridge's, citizenM, Ritz-Carlton NYC, and Singita Kruger.

**A. Core Identity** — location_id, name, description, lat/long, timezone, category, brand, parent_brand
**B. Address & Geography** — street, city, state, country, postal, ancestors, neighborhood
**C. Quality & Reputation** — TA rating, Google rating, num_reviews, rating distribution, 6 subratings, price_level, ranking, awards, photo_count
**D. Guest Segments** — 5 trip types with counts, computed percentages, primary segment, diversity score (Shannon entropy)
**E. Amenity Inventory** — count + boolean flags: spa, pool, restaurant, wifi, EV charging, butler, concierge, meeting rooms, parking, pets
**F. Competitive Set** — 10 nearest competitors with distance/bearing
**G. Review Intelligence** — languages collected, per-language avg ratings, reviewer source markets, owner response rate
**H. Google Places Intelligence** — editorial summary, Gemini review summary, landmarks, areas, allows_dogs, good_for_children, accessibility, business_status
**I. Cross-Platform Derived** — rating divergence TA vs Google, review count ratio, dual platform presence
**J. Computed Intelligence** — rating_5_pct, negative_pct, subrating_range/weakest/strongest, segment_diversity, is_independent, is_luxury, flag_active_reputation_mgmt
**K. Cross-Source Enrichment** — hotelleriesuisse fields (Swiss only), contact enrichment, website intelligence

**Sample data:** `research/sample-10-hotels-global-intelligence.json` (100 columns × 10 hotels)
Full field definitions: `references/intelligence-schema.md`
City priority list: `references/city-priority-list.md`

### The Kitchen Sink Rule

Every field must serve at least one of the 5 core platform capabilities (live intelligence, personas, competitive gaps, AI-ranked priorities, on-demand content). If it doesn't power a platform view or content generation, it's noise.

| Deliverable | Core Data Sources |
|---|---|
| "What Changed" | TA rating trends, SerpApi pricing, review velocity |
| "Who Matters Now" | TA trip types, reviewer source markets, per-language ratings |
| "Where You're Losing" | TA subratings vs. compset, amenity gaps, Google editorial |
| "What to Do About It" | DataForSEO (DA, traffic, keywords), Firecrawl website gaps |
| "Here It Is, Done" | Google editorial + landmarks, TA review quotes, multilingual corpus |

Social media: 4 fields maximum (instagram_handle, exists, followers, has_active_social). Digital maturity signal for sales, not product intelligence.

---

## Derived Intelligence Products

### Hotel Quality Index (HQI)
Composite score from:
- Overall rating (25%)
- Review freshness (15%)
- Subrating consistency (15%)
- Owner response rate (10%)
- Amenity completeness vs. compset (10%)
- Review volume (10%)
- City ranking percentile (10%)
- Photo freshness (5%)

### Competitive Position Score (CPS)
Per-hotel relative to its competitive set:
- Rating delta vs. compset average
- Review volume ratio
- Amenity advantage count
- Amenity gap count
- Price position
- Segment specialization degree

### Tercier Opportunity Score (TOS)
Lead scoring for sales:
- Independent/small chain (no corporate marketing team) — 20%
- Low owner response rate (needs reputation help) — 15%
- High review volume (has demand but doesn't optimize) — 10%
- Underranked vs. amenity potential — 15%
- Multi-segment guest mix (complex = needs Tercier) — 10%
- Multilingual reviews present (international guests = content challenge) — 10%
- Premium price level (can afford Tercier) — 10%
- Competitive dense market (needs differentiation) — 10%

---

## Pipeline Architecture (Built)

### Universal Enrichment Pipeline (`scripts/enrich-hotel/`)
Takes ANY hotel by name + city. Enriches from all 7 sources in parallel. Fills all 297 Supabase columns.
```
scripts/enrich-hotel/
├── enrich.ts                       CLI entry: takes hotel names, orchestrates everything
├── sources/
│   ├── tripadvisor.ts              Search + Details + Reviews + Nearby
│   ├── google-places.ts            Autocomplete + Place Details
│   ├── dataforseo.ts               DA + traffic + keywords + ads + tech + social
│   ├── dataforseo-reviews.ts       Full TA + Google review corpora
│   ├── dataforseo-qna.ts           Google Q&A (pre-booking intent)
│   ├── dataforseo-gmb.ts           Google My Business profile signals
│   ├── firecrawl.ts                Website CMS, booking engine, analytics
│   ├── fiber.ts                    GM contact enrichment
│   ├── serpapi.ts                  OTA pricing comparison
│   └── osm.ts                     OpenStreetMap cross-reference
├── compute.ts                      All derived fields, scores, flags
└── cache/                          JSONL cache (gitignored)
```

### Review NLP Pipeline (`scripts/nlp-pipeline/`)
Live in this workspace. As of April 4, 2026 it has processed 10,714 text-bearing reviews into sentiment, topics, guest persona, content seeds, competitor mentions, and embeddings. The remaining 4,006 unprocessed review rows are provider rows with blank/null text and are intentionally skipped.
```
scripts/nlp-pipeline/
├── extract.ts                      OpenAI Batch API orchestrator
└── lib/
    ├── openai-client.ts            Batch upload/create/poll helpers
    ├── embedding-client.ts         text-embedding-3-small helper
    └── aggregator.ts               Persona/topic normalization + guest segment inference
```

### Phase 0 Bulk Pipeline (`scripts/phase0-enrichment/`)
Reads Swiss CSV, enriches via TA + Google, writes to Supabase. 16 files, 3,012 lines, tested.
```
scripts/phase0-enrichment/
├── 00-run-pipeline.ts through 06-export-intelligence.ts
├── supabase-schema.sql             Base DDL (current schema extended via migrations to 297 columns)
├── lib/                            retry, cache, supabase, matching, logger, API clients
└── cache/                          JSONL cache (gitignored)
```

### Data Storage
- **Primary:** Supabase PostgreSQL (project `rfxuxkbfpewultpuojpe`)
  - `hotels` — 297 columns, core hotel data + all enrichment + derived scores
  - `hotel_amenities` — normalized amenity inventory per hotel
  - `hotel_reviews` — individual reviews from TA + Google, plus NLP + embeddings columns
  - `hotel_qna` — Google guest questions and answers

### Read Layer (`lumina-ui/`)
Internal Next.js 15 intelligence UI for proving the moat and demoing the product:
- portfolio grid at `/`
- hotel card at `/hotel/[id]`
- comparison view at `/compare`
- reads only from dashboard materialized views + `get_hotel_card()` RPC
- never hits raw `hotel_reviews` or `review_topic_index` during page render
  - `hotel_competitors` — competitive sets (10 per hotel), with competitors linked as first-class hotels
  - `hotel_lang_ratings` — per-language rating averages
  - `enrichment_snapshots` — legacy point-in-time snapshots for temporal tracking
  - `pipeline_runs` — audit trail
  - Deep layer live: `hotel_metric_snapshots`, `hotel_price_snapshots`, `review_topic_index`
- **Cache:** JSONL files per source, 7-day TTL
- **Export:** CSV generated from Supabase on demand

### Technical Requirements
- **Rate limiting:** Token bucket per source (40/sec TA, 2000/min DataForSEO, 1/sec OSM)
- **Cache:** JSONL, 7-day TTL, never re-fetch within window
- **Resume:** Cache is the safety net — re-run skips cached calls
- **Parallelism:** bootstrap sources run first, dependent sources run second; independent work inside a stage uses `Promise.allSettled()`
- **Resilience:** Each source catches its own errors, returns `{}` on failure
- **Error handling:** Exponential backoff on 429/5xx, skip+log on 404
- **Depth rule:** `hotels` is the summary card; durable product value lives in child tables, snapshots, and future embeddings/topic indexes

---

## Data Source Architecture (Verified April 3, 2026)

### Active Stack — 7 Sources, all keys live, all tested against Kempinski Budapest

| # | Source | What It Uniquely Adds | Cost/Hotel |
|---|---|---|---|
| 1 | TripAdvisor Content API | Subratings, trip types, amenities, ranking, compsets (NOT reviews — see DataForSEO) | Free |
| 2 | Google Places API (New) | Editorial summary, Gemini AI, landmarks, family/pet/accessibility | ~$0.03 |
| 3 | DataForSEO | FULL TA review corpus (up to 4,490), FULL Google reviews, DA, traffic, keywords, ads, tech, social, Google Q&A, Google My Business signals | ~$0.04 (SEO) + ~$0.50 (reviews) + ~$0.01 (Q&A/GMB) |
| 4 | Firecrawl | Website CMS, booking engine, analytics detection | 1 credit |
| 5 | Fiber AI | Hotel GM contacts (name, email, phone, LinkedIn, headcount) | credits |
| 6 | SerpApi | Multi-OTA price comparison (Booking.com, Expedia, Hotels.com, direct) | ~$0.01 |
| 7 | OSM/Overpass | 445K hotel POIs globally, rooms, stars, cross-reference IDs | Free |

### Review Corpus Reality
- Current API-first architecture stores **all currently accessible reviews** from the live source stack
- Pre-booking intent now has its own first-class table via `hotel_qna`
- Persona intelligence is designed as a review-level NLP layer first, then a hotel-level aggregation layer second
- TripAdvisor free-tier API exposes only a limited recent corpus per language, even when paginated
- Google Places exposes up to 5 reviews per place
- The schema is intentionally designed so a later scraper or paid-source backfill can deepen the corpus without changing downstream AI consumers

### Phase 2+ Targets (Gated Access)
- **Booking.com Demand API** — per-segment review scores (couples: 9.2). Use JAKALA relationship.
- **Expedia Rapid API** — 100 reviews/hotel, richer segmentation than TA. Apply as AI company.
- **GIATA Multicodes** — cross-platform hotel ID deduplication at scale.
- **Foursquare** — foot-traffic popularity score, chain IDs (first 10K free).
- **GSTC** — sustainability certification directory (~3,500 hotels, scrape-based).

### Killed Sources (Replaced or Debunked)
- **Moz** — replaced by DataForSEO (backlinks/bulk_ranks gives DA equivalent at fraction of cost)
- **SpyFu** — replaced by DataForSEO (domain_rank_overview gives traffic, keywords, ads, ad spend)
- **Hunter.io** — replaced by Fiber AI (kitchen-sink person search + contact-details/single)
- **Dropcontact** — replaced by Fiber AI (GDPR verification can be added as a future enrichment step)
- **Apollo.io** — replaced by Fiber AI as primary contact source (Apollo free tier kept as optional fallback)
- **Amadeus** — 150K not 1.5M, skeletal data
- **Semrush** — DataForSEO is 50x cheaper
- **Wappalyzer** — OSS dead, DataForSEO + Firecrawl cover tech detection
- **MySwitzerland.io** — not a hotel DB
- **GeoNames** — zero hotel data

---

## Using This Skill

Load `hotels-dataset` whenever:
- Designing or modifying data pipeline scripts
- Planning which cities/regions to target next
- Defining or extending the hotel data schema
- Computing derived intelligence scores
- Making strategic decisions about the dataset scope or phasing
- Building features that consume the dataset

Always pair with `tripadvisor-api` for endpoint-level details.
Pair with `tercier-knowledge` for product/business context.
Deep-intelligence architecture is now implemented. `CODEX-DEEP-INTELLIGENCE-DB.md` remains the canonical build spec / reference for the Phase 2 shape.
