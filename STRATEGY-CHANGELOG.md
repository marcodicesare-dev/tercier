# Strategy Changelog

Tracks major decisions that change the architecture, source stack, or pipeline design.

---

## 2026-04-04 — Hotel Intelligence UI Implemented

### What Changed

- Added migration `20260404190000_dashboard_views.sql`
- New dashboard performance layer in Supabase:
  - `mv_hotel_dashboard`
  - `mv_hotel_topics`
  - `mv_review_timeline`
  - `mv_guest_personas`
  - `mv_lang_breakdown`
  - `mv_content_seeds`
  - `get_hotel_card(uuid)`
  - `refresh_dashboard_views()`
- Built `lumina-ui/` as a standalone Next.js 15 internal read layer
  - portfolio grid
  - hotel intelligence card
  - competitive comparison view
- Enrichment and NLP pipelines now refresh dashboard materialized views after writes
- Re-pointed the existing Vercel project to `lumina-ui` as the project root
  - Framework preset: `Next.js`
  - Node.js version: `22.x`
  - Root `vercel.json` removed
  - Deployment config now lives in `lumina-ui/vercel.json`
  - Production alias now serves the hotel intelligence UI instead of the old static simulator

### Why It Matters

- The moat is now readable by humans, not just queryable in Supabase
- Sales can demo the Kempinski pilots as actual product surfaces, not raw tables
- The UI stays fast because it reads pre-computed aggregates instead of raw review/topic tables
- Pushes to `main` now deploy the actual read layer the team needs, not an unrelated static artifact

### Verified Live

- `get_hotel_card()` returns one-call payloads for Kempinski Budapest
- `mv_hotel_dashboard` returns the portfolio cards from live data
- `lumina-ui` builds successfully with Next.js 15
- Local renders verified at `/` and `/hotel/40c8f0d3-defc-41bf-813b-975e3348ea89`
- Vercel project settings now show:
  - `Root Directory = lumina-ui`
  - `Framework Preset = Next.js`
  - `Node.js Version = 22.x`
- Production deployment verified at `https://tercier.vercel.app`

---

## 2026-04-04 — Q&A + GMB Layer Implemented, NLP Pipeline Shipped in Code

### What Changed

- Added migration `20260405000000_nlp_and_new_sources.sql`
- `hotels` table expanded from **273 → 297 columns**
- New table live: `hotel_qna`
- `hotel_reviews` extended with:
  - `guest_persona`
  - `content_seeds`
  - `competitor_mentions`
- Universal enrichment pipeline now runs:
  - `dataforseo-qna.ts`
  - `dataforseo-gmb.ts`
- OpenAI NLP pipeline implemented under `scripts/nlp-pipeline/`
  - batch extraction via `gpt-4.1-nano`
  - embeddings via `text-embedding-3-small`
  - result cache + resume metadata under `scripts/nlp-pipeline/cache/nlp-batches/`

### Verified Live

- Supabase now verifies **11 tables**
- `hotel_qna`: **21 rows**
- `hotels` sample width: **297 columns**
- Budapest:
  - `qna_count = 21`
  - `qna_unanswered_count = 0`
  - `qna_response_rate = 1.0`
  - `gmb_is_claimed = true`
  - GMB topics present
- Bali:
  - Google Q&A returns no results and now degrades to **SKIPPED**, not **ERROR**
  - `gmb_is_claimed = true`
  - `gmb_hotel_star_rating = 5`
  - GMB topics present

### Important Constraint

The NLP pipeline is now **executed and live** in this workspace. As of April 4, 2026:

- `hotel_reviews.sentiment`
- `hotel_reviews.topics`
- `hotel_reviews.guest_persona`
- `hotel_reviews.content_seeds`
- `hotel_reviews.competitor_mentions`
- `review_topic_index`
- `hotel_reviews.embedding`

Verified live counts after completion:

- `10,714` processed reviews with non-empty text
- `38,579` topic rows in `review_topic_index`
- `10,714` embeddings written
- `4,006` remaining unprocessed rows are blank/null-text provider rows and are intentionally skipped

## 2026-04-04 — Deep Source Audit: 5 New Sources Discovered + NLP Pipeline Designed

### New Sources Discovered

| Source | What It Gives Us | Cost | Status |
|--------|-----------------|------|--------|
| **TrustYou S3 Meta-Review Dump** | Aggregated review scores from 200+ platforms for every hotel globally. Weekly flat file. | Free (contact for AWS keys) | TO INVESTIGATE |
| **DataForSEO Google Q&A** | Guest questions from Google Maps — pre-booking intent signals, content seeds | $0.00075/20 questions | READY (have credentials) |
| **DataForSEO Google My Business Info** | `popular_times` (foot traffic), `is_claimed` (digital maturity), `place_topics` (free NLP) | $0.0015/hotel | READY (have credentials) |
| **HotelGrade API** | Official government star ratings for 10+ European countries | Free (100 req/day) | READY |
| **Apify Booking.com Scraper** | Booking.com reviews + ratings + 7 sub-ratings | $1/1K reviews | READY |

### DataForSEO Endpoints We Weren't Using

| Endpoint | Value | Why |
|----------|-------|-----|
| Google Hotel Info | Replaces SerpApi for pricing — structured amenities, location scores, price calendar | $0.0008/hotel |
| Google Hotel Searches | Hotel discovery for Phase 1 — 140 results per city search | $0.00075/hotel |
| Google Q&A | Guest questions = pre-booking intent | $0.00075/20 questions |
| Google My Business Info | popular_times, is_claimed, place_topics | $0.0015/hotel |
| Google My Business Updates | Hotel posting activity = digital maturity | $0.002/hotel |

### NLP Pipeline Designed

- **Architecture:** Single-pass LLM extraction per review — aspects, persona, competitor mentions, content seeds in one call
- **Model:** GPT-4.1-nano via Batch API ($1.45 for ALL 14,720 reviews)
- **Embeddings:** text-embedding-3-small at 512 dims ($0.08 for all reviews)
- **Guest persona extraction:** occasion, length of stay, spending level, repeat guest, group composition — this IS the Lumina persona intelligence layer
- **Schema additions:** 18 new fields (273 → ~291), 1 new table (hotel_qna)

### Sources Explicitly Evaluated and Rejected

| Source | Reason |
|--------|--------|
| Expedia Rapid API | Requires affiliate commitment, marginal over TA + Google + Booking.com |
| STR/CoStar | Enterprise-only $10K+, designed for hotel operators |
| AirDNA | $50K/year, focused on STR competition |
| HERE Maps / TomTom | Redundant with Google + OSM |
| Social media deep monitoring | Violates 4-field Kitchen Sink Rule |
| Medallia / ReviewPro | Enterprise tools for hotels, not data sources |

---

## 2026-04-04 — DataForSEO as Review Backbone (Full Corpus Access)

### What Changed

**DataForSEO TripAdvisor Reviews endpoint gives us the FULL review corpus** — up to 4,490 reviews per hotel, all languages, all owner responses, 13 years of history. Verified live against Kempinski Budapest: 3,333 reviews returned, 15 languages, 60% owner response rate, dating back to April 2013. Cost: $0.50.

This replaces:
- **TA Content API reviews** (hard-capped at ~27 reviews per hotel on free tier) → DEAD for review harvesting
- **Firecrawl scraping of TA pages** (10 reviews per page, 334 credits per hotel) → unnecessary
- Potentially **SerpApi** for pricing → DataForSEO Google Hotel Searches/Info can cover this

**New review strategy:**
- TA Content API: used ONLY for hotel Details (subratings, trip types, amenities, ranking, brand)
- DataForSEO TA Reviews: used for FULL review corpus — the entire history
- DataForSEO Google Reviews: used for FULL Google review corpus
- Reviews stored in `hotel_reviews` table with deduplication via `(hotel_id, source, source_review_id)`
- Aggregates recomputed from full corpus (owner response rate, per-language ratings, recency, top locations)

**Cost model:**
- Kempinski Budapest (3,333 TA + 4,024 Google reviews): ~$0.80
- Kempinski Bali (2,863 TA + 4,495 Google reviews): ~$0.80
- Average hotel (500 TA + 300 Google reviews): ~$0.08
- 2,069 Swiss hotels: ~$165 total for full corpora
- DataForSEO balance after pilot: $217.92

### Implementation Verified (Apr 4, 2026)
- New file: `scripts/enrich-hotel/sources/dataforseo-reviews.ts` (371 lines)
- Pipeline total: 3,189 lines TypeScript across 12 files
- Both Kempinskis re-enriched with full corpora (698s Budapest, 691s Bali)
- **14,720 reviews now in `hotel_reviews` table** (was 46 before DataForSEO backbone)
- 21 hotels total in DB (2 Kempinskis + 18 enriched competitors + 1 test)
- 38 language-rating rows in `hotel_lang_ratings`
- 984 amenities, 27 competitors (all linked), 4 metric snapshots, 4 price snapshots
- TypeScript compiles clean, all 10 tables verified
- Owner response rates computed from full corpus: Budapest 93.6%, Bali 99.8%

### Fixes Applied During Implementation
- DataForSEO task validation errors caused infinite polling → now fail-fast on non-40602 status codes
- Google Reviews request for non-standard locations (Bali) → falls back to `location_coordinate` from lat/lng
- Polling timeout extended from 10min to 45min for full-corpus jobs (3,333 reviews = ~10min DataForSEO processing)

---

## 2026-04-03 — Deep Intelligence Architecture (Phase 2)

### What Changed

**Architecture upgraded from "wide row" to "deep intelligence database."** The `hotels` table remains the summary card (273 columns). But the real product value is in relational depth:

| Layer | What | Why |
|-------|------|-----|
| Review corpus | Full review text + NLP topics + sentiment + embeddings | "Who Matters Now" + "Here It Is, Done" need voice-of-customer language |
| Competitor cascade | Competitor hotels enriched as first-class rows | "Where You're Losing" needs competitor ratings/subratings to compute CPS |
| Price time series | Daily OTA price snapshots | "What Changed" needs rate trends, not just today's price |
| Metric snapshots | Monthly enrichment snapshots | "What Changed" needs temporal deltas |
| Semantic embeddings | halfvec(512) via text-embedding-3-small + HNSW index | AI layer needs similarity search over review corpus |

### New Tables
- `hotel_metric_snapshots` — replaces `enrichment_snapshots` with full metric coverage
- `hotel_price_snapshots` — OTA price time series with raw response storage
- `review_topic_index` — denormalized NLP aspect/sentiment index

### New Columns on `hotel_reviews`
- `sentiment`, `sentiment_score` — review-level sentiment (populated by future AI pipeline)
- `topics` JSONB — aspect-based sentiment array
- `guest_segment` — inferred segment
- `embedding` halfvec(512) — semantic search vector

### New SQL Functions
- `ai_schema_catalog()` — schema overview for AI agents
- `match_reviews()` — semantic search over review embeddings
- `hotel_changes()` — temporal delta computation

### New Views
- `competitive_network` — joins hotels with enriched competitors for CPS analysis

### Pipeline Changes
- Review harvest expanded: paginate until empty (not fixed 2 pages) across 11 languages
- Competitor cascade: enrich each competitor with TA Details, link via competitor_hotel_id
- Price data stored in time-series table (not just hotels table snapshot columns)
- Metric snapshot written on every enrichment run

### Implementation Status
- Implemented and deployed on April 3, 2026
- Migration applied to Supabase:
  - `hotel_metric_snapshots`
  - `hotel_price_snapshots`
  - `review_topic_index`
  - NLP/embedding columns added to `hotel_reviews`
  - `ai_schema_catalog()`, `match_reviews()`, `hotel_changes()`, `competitive_network`
- Universal pipeline updated:
  - review harvest paginates until empty across 11 languages
  - single-hop competitor cascade enriches direct competitors as first-class hotel rows
  - metric snapshots are written on every run
  - price snapshots are written when pricing is available

### Verified Live
- Both Kempinski hotels re-run after the upgrade
- `hotel_metric_snapshots` populated for both targets
- `hotel_price_snapshots` populated for Budapest
- both Kempinski rows now have all 9 competitors linked via `competitor_hotel_id`
- hotel graph depth after cascade: 21 hotels with TripAdvisor IDs in Supabase

### Current Known Limits
- `review_topic_index` is empty until the NLP pipeline is built
- `embedding` column exists, but embeddings are not populated yet
- HNSW halfvec index is conditionally deferred on this project until the pgvector opclass is available in the current environment
- Fiber credits are still exhausted, so contact enrichment skips cleanly

---

## 2026-04-03 — Source Stack Consolidation + Supabase + Universal Pipeline

### What Changed

**Data source stack reduced from 12 to 7.** All 7 sources verified live against Kempinski Hotel Corvinus Budapest.

| Decision | Old | New | Why |
|----------|-----|-----|-----|
| SEO metrics | Moz ($20/mo) + SpyFu ($89/mo) | DataForSEO (~$0.04/hotel) | Single source covers DA, traffic, keywords, ads, tech stack, social. Tested live: DA=63, 16.7K keywords, $18K ad spend for kempinski.com. Balance: $129.58. |
| Contact enrichment | Fiber + Apollo + Hunter + Dropcontact ($434/mo) | Fiber AI only ($300/mo) | Fiber kitchen-sink + contact-details covers person search, email, phone, LinkedIn in 2 API calls. Apollo/Hunter/Dropcontact were redundant layers. |
| Primary database | CSV files | Supabase PostgreSQL | 7 tables, 273 columns, PostGIS spatial index, temporal snapshots. Project `rfxuxkbfpewultpuojpe`. |
| Pipeline input | Swiss hotelleriesuisse CSV only | Any hotel by name + city | Universal pipeline at `scripts/enrich-hotel/` accepts CLI args, not bound to CSV. |
| Price intelligence | Not implemented | SerpApi (live, 100 free/month) | Returns 8 OTAs with prices for Kempinski Budapest. Key verified. |
| Tech stack detection | Firecrawl only | Firecrawl (primary) + DataForSEO (fallback) | Firecrawl better for CMS/booking engine (renders page). DataForSEO better for social profiles. Complementary. |

### Sources Killed
- **Moz** — DataForSEO `backlinks/bulk_ranks` gives rank 0-100 (DA equivalent) at $0.02/call vs $250+/mo
- **SpyFu** — DataForSEO `labs/domain_rank_overview` gives traffic + keywords + ads at $0.01/call vs $89/mo
- **Hunter.io** — Fiber AI `contact-details/single` handles email finding + verification
- **Dropcontact** — Fiber AI handles contact enrichment; GDPR verification can be layered later
- **Apollo.io** — demoted from primary to optional fallback; Fiber AI is the single contact source

### Files Updated
- `CLAUDE.md` — date, directory tree, API keys table, field count, current status, pipeline architecture, data storage
- `.skills/hotels-dataset/SKILL.md` — pipeline architecture, source stack table, killed sources, Kitchen Sink Rule
- `.skills/hotels-dataset/references/intelligence-schema.md` — field count, Section L sources (Fiber only), Section M sources (DataForSEO + Firecrawl)
- `CODEX-FULL-ENRICHMENT.md` — rewritten with correct 7-source stack, all verified endpoints, stripped hardcoded keys

### Files Deleted
- `CODEX-PHASE0-AGENT.md` — superseded by `CODEX-FULL-ENRICHMENT.md`
- `CODEX-SCHEMA-UPGRADE.md` — superseded (schema upgrade was completed by Codex)

---

## 2026-04-03 — Supabase Schema Deployed (273 columns)

### What Changed
- Supabase project `rfxuxkbfpewultpuojpe` created and linked via CLI
- Full intelligence schema deployed: 7 tables, 273 columns in `hotels` table
- Categories A-P all have columns in the database
- PostGIS spatial index enabled for lat/lng queries
- `enrichment_snapshots` table ready for temporal "What Changed" tracking
- Migration file: `supabase/migrations/20260403191000_phase0_schema.sql` + upgrade migration

---

## 2026-04-03 — Phase 0 Pipeline Built and Tested

### What Changed
- `scripts/phase0-enrichment/` — 16 TypeScript files, 3,012 lines
- Reads `hotelleriesuisse-members-hotels-switzerland.enriched-master.csv` (2,069 Swiss hotels)
- 6 steps: TA match → TA enrich → Google match → Google enrich → compute → export
- Tested end-to-end on 1 hotel (Codex ran it, verified green)
- Shared libs: retry-with-backoff, concurrency-limiter, JSONL cache, Supabase client, name matching

---

## 2026-04-03 — Universal Hotel Enrichment Implemented (Live Kempinski Run)

### What Changed
- `scripts/enrich-hotel/` implemented as a real pipeline, not just a prompt spec
- New CLI entrypoint wired in `package.json` as `npm run enrich`
- Pipeline now supports any hotel by `name + city + country` JSON input
- Source execution split into two stages:
  - Bootstrap: TripAdvisor, Google Places, OSM
  - Dependent: DataForSEO, Firecrawl, Fiber, SerpApi
- Context handoff added between stages so website-dependent sources wait for canonical website/phone/lat-lng first
- Raw response caching enabled per source under `scripts/enrich-hotel/cache/`
- All enrichment calls wrapped so one failed source does not block the hotel write

### Verified Live
- `Kempinski Hotel Corvinus Budapest` saved to Supabase with:
  - 220 non-null columns
  - 7,357 reviews total
  - 3,333 TripAdvisor reviews via DataForSEO
  - 4,024 Google reviews via DataForSEO
  - 9 competitors
  - 95 amenities
  - 21 language-rating rows
- `The Apurva Kempinski Bali` saved to Supabase with:
  - 217 non-null columns
  - 7,358 reviews total
  - 2,863 TripAdvisor reviews via DataForSEO
  - 4,495 Google reviews via DataForSEO
  - 9 competitors
  - 147 amenities
  - 16 language-rating rows

### Hardening Fixes Added
- Fixed staged dependency bug where DataForSEO and Firecrawl started before `website_url` existed
- Fixed OSM fallback so Overpass failures degrade to Nominatim instead of failing the source
- Fixed TripAdvisor country normalization so canonical `country` prefers ancestor-country (`Indonesia`) over marketing geographies (`Bali`)
- Fixed SerpApi property-token fallback so a bad detail lookup does not fail price enrichment
- Fixed Fiber env handling so missing creds skip cleanly
- Fixed Fiber 402 behavior so exhausted credits are reported as skipped instead of hard errors

### Current Known Limits
- Fiber is currently out of credits, so contact fields skip cleanly until credits are restored
- SerpApi returned valid OTA pricing for both Budapest and Apurva Bali on the latest live run
- DataForSEO runs at domain level (`kempinski.com`), so SEO metrics are group-domain metrics unless a hotel-specific domain exists

---

## 2026-03-28 — Intelligence Schema Designed (Original)

### What Changed
- 10-hotel global sample validated against live TA + Google APIs
- Schema designed: ~200 fields across categories A-K
- Key findings: value is always weakest subrating, trip types genuinely discriminate, Google editorial summaries have 90% coverage
- API gotchas documented: TA returns all values as strings, Google field mask prefix differs between Search and Details
