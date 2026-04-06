# CLAUDE.md — Tercier Troy: Deep Context for AI Agents

> This file is the master context for every AI agent working in this repo.
> Load the relevant skill(s) for your task. This file tells you which one.
> Last updated: April 4, 2026

---

## The Thesis

**Tercier AG** is building the AI commercial brain for every hotel on earth. Not a dashboard. Not a report. A system that reads every review in every language, maps every competitor, builds real guest personas, and produces targeted content — so one marketing person at a EUR 25M hotel operates like a multilingual commercial team.

**The moat is the dataset.** 1.5M+ hotels globally, structured intelligence per property: 6-dimension quality fingerprints, guest segment distributions, multilingual review corpora, competitive sets, amenity inventories, brand affiliations, owner response behavior. No competitor has this. The dataset IS the product.

**The founders:** Marco Di Cesare (CEO, operator, builder), Amedeo Guffanti (JAKALA Global MD, capital + hotel pipeline), Marco Corsaro (JAKALA Digital, SEO/analytics). Swiss AG, Zurich.

**The target:** CHF 500M+ valuation at M48 via VC-accelerated path. 1,500-2,000 properties, EUR 62.5M ARR at 8x multiple. Starts luxury, expands to lifestyle/boutique/upscale chains. TAM: 200-300K hotels globally, EUR 3-7B.

Full detail: `.skills/tercier-knowledge/SKILL.md`

---

## What Lives Where

```
troy/                              This repo — research, strategy, data, intelligence
├── CLAUDE.md                      YOU ARE HERE — master agent context
├── .skills/
│   ├── tercier-knowledge/         Company strategy, product, financials, people
│   │   ├── SKILL.md               Canonical knowledge base (load for ANY Tercier question)
│   │   └── references/
│   │       ├── product-layers.md          7-layer platform architecture
│   │       ├── what-hotels-buy.md         Agency replacement thesis — platform capabilities (NOT deliverables)
│   │       ├── competitive-landscape.md   Competitive map from state-of-art research
│   │       ├── synthetic-research-methodology.md  Survey pipeline spec
│   │       └── timeline.md                Chronological record
│   ├── tripadvisor-api/           TripAdvisor Content API — complete reference
│   │   ├── SKILL.md               Endpoints, params, schemas, patterns (load for ANY TA work)
│   │   └── references/
│   │       ├── endpoints.md               Full endpoint specs with verified responses
│   │       ├── response-schemas.md        JSON response schemas from live API calls
│   │       └── pipeline-patterns.md       Rate limiting, caching, resume patterns
│   ├── google-places-api/         Google Places API (New) — complete reference
│   │   └── SKILL.md               5 endpoints, field masks, SKU tiers, hotel intelligence
│   ├── hotels-dataset/            Global hotel dataset strategy
│   │   ├── SKILL.md               Vision, phases, schema, intelligence products
│   │   └── references/
│   │       ├── intelligence-schema.md     297 field definitions per hotel (deployed in Supabase)
│   │       └── city-priority-list.md      Phase-ordered discovery targets
│   ├── ai-discovery/              AI visibility intelligence
│   │   └── SKILL.md               How to audit AI visibility per hotel
│   ├── review-intelligence/       NLP review analysis
│   │   └── SKILL.md               How to extract intelligence from reviews
│   └── sales-intelligence/        Using dataset for sales
│       └── SKILL.md               How to generate per-hotel sales briefs
├── scripts/
│   ├── phase0-enrichment/         Phase 0 pipeline (Swiss CSV → Supabase, TA + Google)
│   │   ├── 00-run-pipeline.ts     Orchestrator (6 steps)
│   │   ├── 01-06-*.ts             Match + enrich + compute + export
│   │   ├── supabase-schema.sql    Base DDL + additive migrations (current hotels table: 297 columns)
│   │   └── lib/                   Shared: retry, cache, supabase, matching, logger
│   ├── enrich-hotel/              Universal pipeline (any hotel, 7 sources, built)
│   │   └── enrich.ts              Takes hotel name+city, fills all 297 columns + child tables
│   ├── nlp-pipeline/              Review NLP + embeddings pipeline (built, OpenAI-key gated)
│   │   ├── extract.ts             Batch orchestrator for GPT-4.1-nano + embeddings
│   │   └── lib/                   OpenAI client, embedding client, NLP aggregators
│   └── hotel-contact-enrichment/  Contact pipeline (Fiber AI + Firecrawl)
├── lumina-ui/                     Internal hotel intelligence UI (Next.js 15, live Supabase read layer)
│   ├── src/app/                   Portfolio, hotel card, compare views
│   ├── src/components/            Charts, tables, content modules
│   └── src/lib/                   Supabase service-role reads + cached data loaders
├── supabase/migrations/           Applied DB migrations
├── research/
│   ├── hotels-dataset-tripadvisor-enrichment-strategy.md  [THE STRATEGY DOC]
│   ├── synthetic-survey/          Monte Carlo simulations, survey runs
│   └── zug-vs-zurich-tax-analysis-2026.md
├── knowledge/                     External knowledge artifacts
├── hotelleriesuisse-members-hotels-switzerland.csv              Raw 2,069 hotels
├── hotelleriesuisse-members-hotels-switzerland.enriched-master.csv  Enriched master
├── business-plan-v4-march-2026.md                               Current business plan
└── tercier-financial-model.xlsx                                  5-year projections
```

---

## The 5 Non-Negotiables

### 1. The Dataset Is Global, Not Swiss

The hotelleriesuisse dataset (2,069 hotels) is the SEED, not the scope. Every strategy, pipeline, and schema must be designed for 1.5M+ hotels across 200+ countries. Never scope a solution to Switzerland only unless explicitly asked for Phase 0 work.

### 2. API Keys Are Live — Respect Rate Limits

| API | Key | Rate Limit | Cache TTL |
|-----|-----|-----------|-----------|
| TripAdvisor | env: `TRIPADVISOR_API_KEY` | 50/sec | 7 days |
| Google Places | env: `GOOGLE_PLACES_API_KEY` | Per-endpoint quotas | 7 days |
| DataForSEO | env: `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` | 2000/min | 7 days |
| SerpApi | env: `SERPAPI_KEY` | Per-plan | 7 days |
| Firecrawl | env: `FIRECRAWL_API_KEY` (in .env.local) | 1 credit/scrape | 30 days |
| Fiber AI | env: `FIBER_API_KEY` (in .env.local) | Per-plan | 30 days |
| OSM Overpass | No key needed | 1 req/sec fair use | 7 days |
| Supabase | env: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | n/a | n/a |

Cache EVERY response in JSONL. Never re-fetch within TTL. Never make unbounded loops without rate limiting.

### 3. Numbers Come from Models, Not Assumptions

This repo has Monte Carlo simulations with 10K runs each. When citing financials, hotel counts, or probabilities, reference the actual simulation output — not rounded guesses. The canonical models:
- Business plan: `research/synthetic-survey/run-2026-03-22-business-plan-monte-carlo-v2/`
- Exit model: `research/synthetic-survey/run-2026-03-14-exit-monte-carlo-v1/`

### 4. Every Hotel Gets 297 Structured Fields

The dataset schema is defined in `.skills/hotels-dataset/references/intelligence-schema.md` and deployed in Supabase (project `rfxuxkbfpewultpuojpe`, 11 tables total). When building pipelines, ingestion scripts, or enrichment tools, every hotel record must conform to this schema. Don't flatten, don't abbreviate, don't skip fields.

### 5. The Kitchen Sink Rule (Platform Capabilities, NOT Deliverables)

Every data field must serve at least one of the 5 core platform capabilities: live competitive intelligence ("What Changed"), guest persona modeling ("Who Matters Now"), competitive gap analysis ("Where You're Losing"), AI-ranked priority actions ("What to Do About It"), and on-demand content generation ("Here It Is, Done"). If a field doesn't power a platform view or content generation, it's noise — don't add it. Social media = 4 fields max (digital maturity signal for sales). Not a social intelligence layer.

**CRITICAL PRODUCT FRAMING:** Lumina is an always-on AI platform, NOT a monthly deliverable service. The 7-layer intelligence stack runs continuously. Hotels log into a live dashboard with real-time intelligence — not monthly reports. Content is generated on-demand when the hotel marketing person needs it ("generate a wellness landing page in DE/EN/FR"), not batched and delivered. No Lumina employee writes content for customers. The platform does it autonomously. Think Corsaro's vision: "a virtual revenue manager you can talk to — just ask me."

---

## How to Use the Skills System

Load the skill(s) relevant to your task. Skills use **progressive disclosure** — metadata loads first (~50 tokens), full SKILL.md only when relevant, references only during execution.

```
Trigger                                    Load this skill
────────────────────────────────────────   ──────────────────────────────────────
"tercier", "business plan", "product",  →  .skills/tercier-knowledge/SKILL.md
"pricing", "competitive", "financial",
"survey", "monte carlo", "equity"

"tripadvisor", "TA API", "location",    →  .skills/tripadvisor-api/SKILL.md
"reviews endpoint", "nearby search",
"API call", "enrichment pipeline"

"google places", "Google API",          →  .skills/google-places-api/SKILL.md
"Place Details", "field mask",
"reviewSummary", "Gemini summary",
"Google rating", "place ID"

"dataset", "hotels dataset", "global",  →  .skills/hotels-dataset/SKILL.md
"discovery", "geo-grid", "intelligence
schema", "quality index", "competitive
set mapping", "phase 0/1/2/3"

"AI visibility", "ChatGPT sees",        →  .skills/ai-discovery/SKILL.md
"GEO", "AEO", "Schema.org",
"AI search", "discovery audit"

"reviews", "sentiment", "NLP",          →  .skills/review-intelligence/SKILL.md
"guest feedback", "topic extraction",
"content seeds", "voice of customer"

"sales brief", "lead scoring",          →  .skills/sales-intelligence/SKILL.md
"pitch", "opportunity score",
"prospect", "hotel outreach"

ANY strategic question about Tercier    →  .skills/tercier-knowledge/SKILL.md
ANY work touching TripAdvisor API       →  .skills/tripadvisor-api/SKILL.md
ANY work touching Google Places API    →  .skills/google-places-api/SKILL.md
ANY dataset design or pipeline work     →  .skills/hotels-dataset/SKILL.md
FULL PRODUCT WORK                       →  Load all seven
```

### Skill Dependency Graph

```
tercier-knowledge (root — strategy, product, market, financials)
  ├── hotels-dataset (the data moat — schema, phases, pipeline)
  │     ├── tripadvisor-api (primary data source — endpoints, schemas)
  │     ├── google-places-api (complementary data source — reviews, AI summaries, landmarks)
  │     ├── ai-discovery (AI visibility intelligence)
  │     └── review-intelligence (NLP review analysis)
  └── sales-intelligence (dataset → sales briefs)
        └── hotels-dataset
```

**Common combinations:**
- Building pipelines → `tripadvisor-api` + `google-places-api` + `hotels-dataset`
- Strategic decisions → `tercier-knowledge` + `hotels-dataset`
- Product development → `hotels-dataset` + `review-intelligence` + `ai-discovery`
- Sales preparation → `sales-intelligence` + `hotels-dataset`
- "What is Tercier?" → `tercier-knowledge` alone
- Hotel data enrichment → `tripadvisor-api` + `google-places-api` + `hotels-dataset`

---

## Current Status (as of April 4, 2026)

### Infrastructure
- **Supabase database:** Live, project `rfxuxkbfpewultpuojpe`
  - `hotels`: 297 columns
  - 11 live tables including `hotel_qna`
  - deep-intelligence layer live: `hotel_metric_snapshots`, `hotel_price_snapshots`, `review_topic_index`, `hotel_qna`, NLP/embedding columns on `hotel_reviews`
- **All 7 API sources verified live:** TripAdvisor, Google Places, DataForSEO, Firecrawl, Fiber AI, SerpApi, OSM Overpass
- **TypeScript pipeline:** `scripts/phase0-enrichment/` — 16 files, 3,012 lines, compiles clean, tested on 1 hotel

### Data Assets
- **hotelleriesuisse enriched master:** 2,069 hotels, 65 columns, website intelligence scraped
- **Contact enrichment v6:** 420 resolved (GM + email), 583 partial, 1,066 unresolved (via Fiber AI)
- **Kempinski pilot data:** both pilot hotels fully enriched in Supabase with DataForSEO full-review backfill
  - `Kempinski Hotel Corvinus Budapest`: 7,357 reviews total (3,333 TA + 4,024 Google), 21 TA language buckets
  - `The Apurva Kempinski Bali`: 7,358 reviews total (2,863 TA + 4,495 Google), 16 TA language buckets
  - Q&A / GMB layer live:
    - Budapest: 21 Google Q&A threads, claimed GMB, topic graph present
    - Bali: no Google Q&A found, claimed GMB, hotel star rating surfaced

### What's Built
- Supabase schema (11 tables, 297 hotel columns, indexes, triggers, PostGIS spatial index)
- Phase 0 enrichment pipeline (`scripts/phase0-enrichment/`) — TA + Google, Swiss CSV input, 6 steps
- Universal hotel enrichment pipeline (`scripts/enrich-hotel/`) — 7 sources, staged bootstrap/dependent execution, live-run on 2 Kempinski hotels
- Deep intelligence layer:
  - metric snapshots
  - price time series
  - competitor cascade linking
  - Google Q&A storage + rollups
  - Google My Business signals
  - AI-facing SQL functions
  - review NLP/embedding columns prepared
  - DataForSEO review backbone live for full TA + Google corpora
  - OpenAI batch NLP pipeline implemented under `scripts/nlp-pipeline/`
- Synthetic survey pipeline (272 ICP hotels, 1,632 simulations)
- Monte Carlo business plan + exit models (10K runs each)
- Financial model (5-year, dual scenarios)
- Full enrichment strategy doc + intelligence schema (16 categories A-P)

### Research
- **State of the art corpus (Mar 27):** `research/STATE-OF-THE-ART-RESEARCH-2026-03-27.md`
- **Dataset deep research (Mar 28):** `research/hotels-dataset-deep-research-2026-03-28.md`
- **Source stack audit (Apr 3):** DataForSEO replaces Moz+SpyFu, all endpoints tested live
- **Review backbone validation (Apr 4):** DataForSEO full-corpus TA + Google reviews written to Supabase for both Kempinski pilots
- **NLP execution (Apr 4):** 10,714 text-bearing reviews processed into sentiment, topics, persona, content seeds, competitor mentions, and embeddings
- **Hotel intelligence UI (Apr 4):** Next.js read layer live on top of materialized views + `get_hotel_card()` RPC for instant hotel cards

### What's Next
- **Persona rollups:** review-level persona extraction is live, but hotel-level persona summary fields remain a future aggregation layer
- **Topic/product layer:** turn `review_topic_index`, `guest_persona`, and `content_seeds` into first-class product queries and outputs
- **UI productization:** extend `lumina-ui/` from internal demo into the sales-facing and operator-facing read layer
- **Phase 0:** Bulk-enrich 2,069 Swiss hotels via `scripts/phase0-enrichment/`
- **Phase 1:** European premium city discovery (50 cities, geo-grid + brand search)

---

## Development Conventions

### File Naming
- Skills: kebab-case directories (`.skills/tripadvisor-api/`)
- Scripts: kebab-case (`.ts` extension, TypeScript)
- Data: descriptive names with version indicators (`enriched-master.csv`)
- Research: date-stamped (`run-2026-03-22-business-plan-monte-carlo-v2/`)

### Data Storage
- **Primary:** Supabase PostgreSQL
  - Current live layer: core normalized tables, 297-column `hotels` table, spatial index
  - Deep layer live: `hotel_metric_snapshots`, `hotel_price_snapshots`, `review_topic_index`, `hotel_qna`, NLP/embedding columns on `hotel_reviews`
- Raw API responses: JSONL with timestamp (cacheable, replayable)
- CSV exports: generated from Supabase for analysis/sharing
- Review corpora: `hotel_reviews` table (not flattened into hotels)

### Pipeline Design
- Always cache raw API responses in JSONL before processing
- Always support resume from interruption (cache = safety net)
- Always deduplicate by primary key (UUID in Supabase, `ta_location_id` for TA, `gp_place_id` for Google)
- Always rate-limit API calls (token bucket per source)
- Always log progress (processed/total, upgrades, errors)
- Run enrichment in stages when sources depend on upstream identity data
  - Bootstrap first: TripAdvisor, Google Places, OSM
  - Dependent second: DataForSEO SEO/reviews/Q&A/GMB, Firecrawl, Fiber, SerpApi
  - Use `Promise.allSettled()` inside each stage
- Never let one source failure block others

---

## What NOT to Do

- Do not scope datasets to Switzerland only (unless Phase 0)
- Do not make TripAdvisor API calls without caching the response
- Do not hardcode the API key in scripts (use env var or config)
- Do not create new data schemas without referencing the intelligence schema
- Do not cite financial numbers without referencing the Monte Carlo model
- Do not assume hotel counts — use the actual enriched master or simulation output
- Do not flatten review data into the hotel master CSV (reviews are a separate corpus)
- Do not skip multilingual review harvesting (it is the core of Layer 2)
- Do not claim "all reviews" unless the source actually exposes them; for the Kempinski pilot the full TA + Google corpora are now sourced through DataForSEO, while other hotels may still depend on source availability and configured backfill depth
