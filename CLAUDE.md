# CLAUDE.md — Tercier Troy: Deep Context for AI Agents

> This file is the master context for every AI agent working in this repo.
> Load the relevant skill(s) for your task. This file tells you which one.
> Last updated: March 28, 2026

---

## The Thesis

**Tercier AG** is building the AI commercial brain for every hotel on earth. Not a dashboard. Not a report. A system that reads every review in every language, maps every competitor, builds real guest personas, and produces targeted content — so one marketing person at a EUR 25M hotel operates like a multilingual commercial team.

**The moat is the dataset.** 1.5M+ hotels globally, structured intelligence per property: 6-dimension quality fingerprints, guest segment distributions, multilingual review corpora, competitive sets, amenity inventories, brand affiliations, owner response behavior. No competitor has this. The dataset IS the product.

**The founders:** Marco Di Cesare (CEO, operator, builder), Amedeo Guffanti (JAKALA Global MD, capital + hotel pipeline), Marco Corsaro (JAKALA Digital, SEO/analytics). Swiss AG, Zug.

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
│   │       ├── what-hotels-buy.md         Agency replacement thesis + monthly deliverables
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
│   │       ├── intelligence-schema.md     250+ field definitions per hotel (REDESIGNED)
│   │       ├── city-priority-list.md      Phase-ordered discovery targets
│   │       ├── derived-scores.md          All score formulas (sales + operational)
│   │       └── review-intelligence-spec.md  NLP extraction pipeline spec
│   ├── ai-discovery/              AI visibility intelligence (NEW)
│   │   ├── SKILL.md               How to audit AI visibility per hotel
│   │   └── references/
│   │       ├── llm-query-methodology.md   Systematic AI model querying
│   │       ├── schema-org-hotel.md        Schema.org Hotel markup spec
│   │       └── geo-aeo-benchmarks.md      Industry benchmarks
│   ├── review-intelligence/       NLP review analysis (NEW)
│   │   ├── SKILL.md               How to extract intelligence from reviews
│   │   └── references/
│   │       ├── topic-extraction.md        NLP pipeline for topic clustering
│   │       ├── sentiment-by-segment.md    Per-segment sentiment analysis
│   │       └── content-seed-extraction.md Marketing-ready quote extraction
│   └── sales-intelligence/        Using dataset for sales (NEW)
│       ├── SKILL.md               How to generate per-hotel sales briefs
│       └── references/
│           ├── scoring-formulas.md        TOS, CPS, all derived scores
│           ├── objection-handling.md      From synthetic survey
│           └── sales-brief-template.md    Per-property pitch template
├── .context/
│   ├── notes.md                   Working notes (session-persistent)
│   ├── todos.md                   Task tracking
│   └── attachments/               Pasted text, images from conversations
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

Cache EVERY response in JSONL. Never re-fetch within TTL. Never make unbounded loops without rate limiting.

### 3. Numbers Come from Models, Not Assumptions

This repo has Monte Carlo simulations with 10K runs each. When citing financials, hotel counts, or probabilities, reference the actual simulation output — not rounded guesses. The canonical models:
- Business plan: `research/synthetic-survey/run-2026-03-22-business-plan-monte-carlo-v2/`
- Exit model: `research/synthetic-survey/run-2026-03-14-exit-monte-carlo-v1/`

### 4. Every Hotel Gets 200+ Structured Fields

The dataset schema is defined in `.skills/hotels-dataset/references/intelligence-schema.md`. When building pipelines, ingestion scripts, or enrichment tools, every hotel record must conform to this schema. Don't flatten, don't abbreviate, don't skip fields.

### 5. The Kitchen Sink Rule

Every data field must serve at least one of the 5 monthly deliverables ("What Changed", "Who Matters Now", "Where You're Losing", "What to Do About It", "Here It Is, Done"). If a field doesn't map to a deliverable, it's noise — don't add it. Social media = 4 fields max (digital maturity signal for sales). Not a social intelligence layer.

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
- Hotel data enrichment → `tripadvisor-api` + `google-places-api`

---

## Current Status (as of March 28, 2026)

### Data Assets
- **hotelleriesuisse enriched master:** 2,069 hotels, 50+ columns, website intelligence scraped
- **Contact enrichment v6:** 420 resolved (GM + email), 583 partial, 1,066 unresolved
- **Contact recovery v1:** Running (410/1,649 processed, 11 upgraded)
- **TripAdvisor API:** Verified live, all 5 endpoints tested, pagination confirmed working

### What's Built
- Synthetic survey pipeline (272 ICP hotels, 1,632 simulations)
- Monte Carlo business plan model (10K runs, operator + follow-on angel paths)
- Monte Carlo exit model (10K runs, global expansion lens)
- Financial model (5-year, dual scenarios)
- TripAdvisor API strategy doc (global, 1.5M+ hotels, 4 phases)

### Research
- **State of the art corpus (Mar 27):** `research/STATE-OF-THE-ART-RESEARCH-2026-03-27.md` — 900 lines, 100+ sources
- **Dataset deep research (Mar 28):** `research/hotels-dataset-deep-research-2026-03-28.md` — Schema redesign, context engineering, product-schema alignment

### What's Next
- **Phase 0:** Match 2,069 Swiss hotels to TripAdvisor + full enrichment (1 day)
- **Phase 0.5:** Review intelligence NLP + AI discovery audits (1 week)
- **Phase 1:** European premium city discovery (50 cities, 3 weeks)
- **Build scripts:** TypeScript pipeline in `scripts/tripadvisor-global/`
- **New skills:** ai-discovery, review-intelligence, sales-intelligence

---

## Development Conventions

### File Naming
- Skills: kebab-case directories (`.skills/tripadvisor-api/`)
- Scripts: kebab-case (`.ts` extension, TypeScript)
- Data: descriptive names with version indicators (`enriched-master.csv`)
- Research: date-stamped (`run-2026-03-22-business-plan-monte-carlo-v2/`)

### Data Storage
- Raw API responses: JSONL with timestamp (cacheable, replayable)
- Master datasets: CSV (flat, queryable, diffable)
- Review corpora: JSONL organized by country/city
- Derived intelligence: CSV (one row per hotel, all scores)

### Pipeline Design
- Always cache raw API responses before processing
- Always support resume from interruption
- Always deduplicate by primary key (ta_location_id for TripAdvisor)
- Always rate-limit API calls (token bucket, 50/sec for TA)
- Always log progress (processed/total, upgrades, errors)

---

## What NOT to Do

- Do not scope datasets to Switzerland only (unless Phase 0)
- Do not make TripAdvisor API calls without caching the response
- Do not hardcode the API key in scripts (use env var or config)
- Do not create new data schemas without referencing the intelligence schema
- Do not cite financial numbers without referencing the Monte Carlo model
- Do not assume hotel counts — use the actual enriched master or simulation output
- Do not flatten review data into the hotel master CSV (reviews are a separate corpus)
- Do not skip multilingual review harvesting (it's the core of Layer 2)
