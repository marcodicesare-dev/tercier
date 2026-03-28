---
name: hotels-dataset
description: "Provides the strategy and architecture for building the world's most comprehensive hotel intelligence dataset. An agent should load this skill when designing data pipelines, planning discovery phases, defining data schemas, computing derived intelligence scores, or making any decision about the global hotels dataset. Covers the full vision (1.5M+ hotels), dual-source strategy (TripAdvisor + Google Places), 4-phase execution plan, 100-field schema (validated on 10-hotel global sample), derived intelligence products, and how the dataset maps to Tercier's 5 monthly deliverables."
---

# Global Hotels Dataset — Strategy & Architecture

## The Vision in One Paragraph

Build a structured intelligence dataset covering every hotel across TripAdvisor AND Google Places — 1.5M+ properties globally. Each hotel gets ~100 validated fields from dual sources: identity, address, quality fingerprint (6 TA subratings + Google rating), guest segment distribution (real trip type counts), amenity inventory, competitive set (10 nearest hotels), multilingual review corpus with per-language ratings and reviewer source markets, brand affiliation, city ranking, owner response behavior, Google editorial summaries, nearby landmarks, family/pet/accessibility signals, and computed intelligence scores (HQI, CPS, TOS). Reviews stored separately as a multilingual corpus. This dataset IS Tercier's moat. It pre-populates the product from day one, arms the sales team with per-property intelligence before first contact, and creates a data asset no competitor can replicate. Validated on a live 10-hotel global sample on March 28, 2026.

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

Every field must serve at least one of the 5 monthly deliverables. If it doesn't, it's noise.

| Deliverable | Core Data Sources |
|---|---|
| "What Changed" | TA rating trends, SerpApi pricing, review velocity |
| "Who Matters Now" | TA trip types, reviewer source markets, per-language ratings |
| "Where You're Losing" | TA subratings vs. compset, amenity gaps, Google editorial |
| "What to Do About It" | SpyFu SEO, Firecrawl website gaps, Moz DA |
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

## Pipeline Architecture

```
scripts/tripadvisor-global/
├── 00-geo-grid-generator.ts          Generate lat/long grid per city
├── 01-discover-hotels.ts             Nearby + text search discovery
├── 02-fetch-details.ts               Details for all discovered hotels
├── 03-fetch-reviews.ts               Multilingual review harvesting
├── 04-map-competitive-sets.ts        Nearby search from each hotel
├── 05-fetch-photos.ts                Photo metadata
├── 06-match-hotelleriesuisse.ts      Cross-reference Swiss dataset
├── 07-compute-intelligence.ts        Derived scores and indices
├── lib/
│   ├── tripadvisor-client.ts         Rate-limited API client with caching
│   ├── cache.ts                      JSONL cache with dedup and TTL
│   ├── geo-grid.ts                   Grid generation + priority ordering
│   └── scoring.ts                    Intelligence score computation
└── config/
    ├── city-grids.json               City coordinates + grid params
    ├── brand-list.json               Hotel brand names for search
    └── language-matrix.json          Languages per country
```

### Data Storage
```
output/tripadvisor-global/
├── discovery/
│   ├── discovery-cache.jsonl         Raw search/nearby responses
│   └── location-ids.csv              Deduplicated hotel IDs
├── details/
│   ├── details-cache.jsonl           Raw detail responses
│   └── hotels-master.csv             Flattened master dataset
├── reviews/
│   ├── reviews-cache/{country}/{city}/ Reviews by geography
│   └── review-stats.csv              Aggregated per hotel
├── competitive-sets/
│   └── competitive-sets.csv          Hotel → 10 competitors
├── photos/
│   └── photos-cache.jsonl            Photo metadata
└── intelligence/
    ├── hotel-quality-index.csv       HQI scores
    ├── competitive-position.csv      CPS scores
    └── tercier-opportunity-scores.csv TOS lead scores
```

### Technical Requirements
- **Rate limiter:** Token bucket at 50 calls/sec
- **Cache:** JSONL, 7-day TTL, never re-fetch within window
- **Resume:** Pipeline resumes from any interruption point
- **Dedup:** location_id primary key, earliest discovery wins
- **Concurrency:** 10-20 parallel requests
- **Error handling:** Exponential backoff on 429/500, skip+log on 404

---

## Data Source Architecture (Verified March 28, 2026)

### Verified Stack — 12 Sources, $820/mo

| # | Source | What It Uniquely Adds | Monthly Cost |
|---|---|---|---|
| 1 | TripAdvisor Content API | Subratings, trip types, reviews, ranking, amenities | $0 |
| 2 | Google Places API (New) | Editorial summary, landmarks, family/pet flags, Gemini AI | $58 one-time |
| 3 | Fiber AI | Hotel GM contacts (kitchen-sink partial search) | $300 |
| 4 | Apollo.io | Backup contacts + intent data | $0 (free tier) |
| 5 | Hunter.io | Domain email search + verification | $49 |
| 6 | Dropcontact | GDPR-compliant email verification | ~$85 |
| 7 | SpyFu | Traffic estimates + Google Ads detection | $89 |
| 8 | Moz | Domain Authority | $20 |
| 9 | Firecrawl | Website scraping + DIY tech detection | $83 |
| 10 | SerpApi | Multi-OTA price comparison via Google Hotels | $150 |
| 11 | OSM/Overpass | 445K hotel POIs globally (discovery seed) | $0 |
| 12 | GSTC | 3,522 sustainability-certified hotels | $0 |

### Phase 2+ Targets (Gated Access)
- **Booking.com Demand API** — per-segment review scores (couples: 9.2). Use JAKALA relationship.
- **Expedia Rapid API** — 100 reviews/hotel, richer segmentation than TA. Apply as AI company.
- **GIATA Multicodes** — cross-platform hotel ID deduplication at scale.
- **Foursquare** — foot-traffic popularity score, social handles, chain IDs (first 10K free).

### Killed Sources (Claims Debunked)
- Amadeus (150K not 1.5M, skeletal data), Semrush (SpyFu is 5x cheaper), Wappalyzer (OSS dead, DIY is free), MySwitzerland.io (not a hotel DB), GeoNames (zero hotel data)

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
