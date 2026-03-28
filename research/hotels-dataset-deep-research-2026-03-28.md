# Tercier Hotels Dataset — Deep Research & Context Engineering Redesign
## March 28, 2026

**Purpose:** Challenge the current intelligence schema against the product that hotels actually buy, redesign the context engineering system to Jarvis-level, and map what the most comprehensive hotel dataset on earth actually looks like.

---

## TABLE OF CONTENTS

1. [The Critical Challenge: Schema vs. Product](#1-the-critical-challenge)
2. [What's Wrong with the Current Schema](#2-whats-wrong)
3. [The Redesigned Intelligence Schema](#3-redesigned-schema)
4. [Context Engineering Redesign — Jarvis-Level](#4-context-engineering-redesign)
5. [TripAdvisor API: What We Can Actually Build](#5-tripadvisor-capabilities)
6. [Beyond TripAdvisor: Multi-Source Intelligence](#6-beyond-tripadvisor)
7. [The Dataset That Changes Everything](#7-the-dataset)
8. [Implementation Roadmap](#8-roadmap)

---

## 1. THE CRITICAL CHALLENGE: SCHEMA VS. PRODUCT

### What Hotels Actually Buy (from master research + call transcripts)

The product that sells is NOT a dataset, NOT a dashboard, NOT a platform. It's a **virtual commercial team member** — Corsaro's exact words: "un revenue manager virtuale col quale poi dialogare."

Hotels buy 5 monthly deliverables:
1. **"What changed"** — demand shifts, events, competitor moves, review patterns
2. **"Who matters now"** — which segments to target this month
3. **"Where you're losing"** — hotel through guest eyes vs. competitors
4. **"What to do about it"** — 5 ranked priorities
5. **"Here it is, done"** — ready-to-publish multilingual content

### What the Current Schema Produces

The current 200-field schema (intelligence-schema.md) is **TripAdvisor-first**. It's excellent at capturing:
- Static property identity (name, address, brand, category)
- Point-in-time quality snapshot (rating, subratings, ranking)
- Guest segment distribution (trip types with counts)
- Amenity inventory (100+ boolean flags)
- Competitive proximity (10 nearest hotels by distance)

### The Gap

The current schema captures a **photograph**. The product needs a **movie**.

| Product Need | Current Schema | Gap |
|---|---|---|
| "What changed" — demand shifts | ❌ No temporal data | Need review velocity, rating trends, seasonal patterns |
| "What changed" — events approaching | ❌ No event data | Need city event calendar, conference schedule |
| "What changed" — competitor moves | ⚠️ Static compset | Need competitor review trends, new amenities, messaging changes |
| "Who matters now" — segment targeting | ✅ Trip type counts | But no temporal segmentation — which segments are growing? |
| "Where you're losing" — guest eyes | ⚠️ Subratings only | Need per-language sentiment, specific complaint topics, competitor comparison AT DIMENSION LEVEL |
| "What to do" — ranked priorities | ⚠️ Derived scores | Current TOS is sales scoring, not operational priority ranking |
| "Here it is, done" — content | ⚠️ Guest voice library | Need structured content seeds, not just raw quotes |
| AI Discovery hook | ❌ Nothing | Need AI visibility data — how ChatGPT/Perplexity see the hotel |
| PMS/booking signals | ❌ Nothing | Phase 2 — MCP integration path |

### The Killer Insight

The dataset serves TWO distinct purposes that the current design conflates:

**Purpose 1: SALES INTELLIGENCE** — Walk into any meeting pre-armed with property-level data. "Your TripAdvisor ranking dropped from #9 to #14 in 90 days. Your German guests rate you 4.2 but your competitor gets 4.7 from Germans. 84% of hotels are invisible in AI search — let me show you how ChatGPT sees yours."

**Purpose 2: PRODUCT FUEL** — Pre-populate every layer of the platform from day one. No per-hotel onboarding delay. The dataset IS layers 1-5.

The current schema is designed for Purpose 1 (sales scoring via TOS). It's weak at Purpose 2 (product fuel) because it lacks temporal data, content seeds, and AI discovery signals.

---

## 2. WHAT'S WRONG WITH THE CURRENT SCHEMA

### Problem 1: No Temporal Dimension

The schema captures one point in time. But the product's #1 deliverable is "what changed." Without temporal data, the platform can't detect:
- Rating trends (improving/declining over 30/90/180 days)
- Review velocity changes (demand proxy — more reviews = more guests)
- Seasonal patterns (which months bring which segments)
- Competitor movement (did their ranking improve? Did they get new amenities?)

**Fix:** Every hotel needs multiple snapshots over time. The schema should define both the CURRENT STATE and the CHANGE SIGNALS.

### Problem 2: Competitive Sets by Distance ≠ Competitive Sets by Market

The current compset (10 nearest by distance) is geographic proximity, not market competition. A 5-star luxury hotel's real competitor isn't the 2-star hostel next door — it's the other 5-star property 3km away.

**Fix:** Competitive sets should be computed by SEGMENT MATCH:
- Same price level ($$$$)
- Similar rating (within 0.5 points)
- Similar trip type distribution
- Similar amenity class
- Within the same city/destination

### Problem 3: Review Intelligence Is Aggregated to Death

The schema stores `ta_avg_rating_de` (average German review rating) but loses everything that makes reviews valuable:
- What do German guests specifically complain about?
- What words do couples use vs. business travelers?
- Which amenities get praised vs. ignored?
- What competitor advantages do reviewers mention?

The raw review corpus is the most valuable data asset. The schema should define how to EXTRACT intelligence from reviews, not just average the ratings.

**Fix:** Add a review intelligence layer with:
- Top positive/negative topics by language (NLP-extracted)
- Guest expectation signals by segment
- Competitor mention frequency in reviews
- Specific complaint categories (noise, check-in, food, WiFi, etc.)
- Specific praise categories
- Emotional tone distribution

### Problem 4: No AI Discovery Layer

The master research shows AI discovery is the HOOK that gets the meeting (84% invisible, 12-18 month window). But the schema has zero fields for:
- How ChatGPT/Perplexity/Gemini describe the hotel
- Whether the hotel appears in AI recommendations for relevant queries
- What source data AI models use (TripAdvisor citations dominate)
- Schema.org markup presence on hotel website
- Structured data readiness for AI retrieval

**Fix:** Add AI discovery fields that can be populated via programmatic LLM queries and website analysis.

### Problem 5: No Website/Content Intelligence

The product's #5 deliverable is content. To know what content to produce, we need to know what content EXISTS:
- Hotel website languages vs. guest languages (mismatch = opportunity)
- Landing pages per segment (or lack thereof)
- Direct booking capability
- OTA listing quality
- Social media presence and activity

The Swiss dataset has some of this (sr_* fields from website scraping), but it's not in the global schema.

**Fix:** Extend Section H (Cross-Source Enrichment) to be source-agnostic and global.

### Problem 6: The Opportunity Score Is Sales-Only

The current TOS (Tercier Opportunity Score) helps the sales team prioritize leads. But the product needs an OPERATIONAL score:
- Content gap score (how much content work does this hotel need?)
- AI readiness score (how close is this hotel to being AI-visible?)
- Segment mismatch score (how big is the gap between guest mix and content mix?)
- Reputation risk score (trending negative?)
- Revenue opportunity score (what's the direct booking uplift potential?)

---

## 3. THE REDESIGNED INTELLIGENCE SCHEMA

### Design Principles

1. **Source-agnostic at the top, source-specific underneath.** The schema should work whether we get data from TripAdvisor, Google, Booking.com, or web scraping.
2. **Temporal by default.** Every quantitative field has a current value AND a trend.
3. **Two-tier structure.** Tier 1 = property-level master record (one row per hotel). Tier 2 = detail tables (reviews, photos, events, content audits).
4. **Product-driven.** Every field maps to at least one of the 5 monthly deliverables.
5. **Computable.** Derived fields have explicit formulas, not vague descriptions.

### NEW Schema Categories (10 vs. current 9)

**A. Core Identity** — Who is this hotel? (Unchanged from current, well-designed)
**B. Address & Geography** — Where is it? (Unchanged)
**C. Quality & Reputation** — How good is it? (ENHANCED with temporal)
**D. Guest Segments** — Who stays here? (ENHANCED with temporal + source market)
**E. Amenity Inventory** — What does it offer? (ENHANCED with competitive tags)
**F. Competitive Intelligence** — Who competes with it? (REDESIGNED — market-based, not distance-based)
**G. Review Intelligence** — What do guests say? (REDESIGNED — topic-level, not just ratings)
**H. AI Discovery & Digital Presence** — NEW CATEGORY
**I. Content & Messaging Intelligence** — NEW CATEGORY
**J. Derived Scores & Flags** — (REDESIGNED — operational + sales)

### C. Quality & Reputation — Enhanced with Temporal

NEW fields beyond current schema:

| Field | Type | Source | Deliverable |
|-------|------|--------|-------------|
| `ta_rating_30d_trend` | float | computed | "What changed" — rating direction |
| `ta_rating_90d_trend` | float | computed | "What changed" — medium-term trend |
| `ta_reviews_30d_count` | int | reviews | "What changed" — review velocity |
| `ta_reviews_90d_count` | int | reviews | "What changed" — demand proxy |
| `ta_reviews_velocity_trend` | string | computed | "increasing" / "stable" / "declining" |
| `ta_ranking_30d_delta` | int | computed | "What changed" — ranking movement |
| `ta_ranking_90d_delta` | int | computed | "What changed" — ranking trajectory |
| `ta_rating_1yr_seasonal` | json | computed | Monthly avg rating pattern |
| `ta_reviews_1yr_seasonal` | json | computed | Monthly review count pattern |
| `ta_negative_review_30d_rate` | float | computed | "What changed" — reputation risk signal |

### D. Guest Segments — Enhanced

NEW fields:

| Field | Type | Source | Deliverable |
|-------|------|--------|-------------|
| `ta_segment_trend_business` | string | computed | "Who matters" — is business growing? |
| `ta_segment_trend_couples` | string | computed | Growing/stable/declining |
| `ta_segment_trend_family` | string | computed | Growing/stable/declining |
| `ta_top_reviewer_countries` | string | reviews | "Who matters" — source markets |
| `ta_top_reviewer_countries_pct` | string | reviews | Country distribution |
| `ta_language_segment_matrix` | json | reviews | Which languages map to which segments |
| `ta_emerging_segment` | string | computed | Fastest-growing trip type |
| `ta_underserved_segment` | string | computed | Segment with worst ratings |

### F. Competitive Intelligence — Redesigned

Replace pure distance-based compset with MARKET-BASED competitive sets:

| Field | Type | Source | Deliverable |
|-------|------|--------|-------------|
| `compset_market_ids` | string | computed | Up to 10 market-matched competitors |
| `compset_market_criteria` | string | computed | "price_level+rating+city" match criteria |
| `compset_avg_rating` | float | computed | "Where you're losing" — benchmark |
| `compset_avg_rating_trend` | float | computed | Are competitors improving faster? |
| `compset_rating_delta` | float | computed | Hotel vs compset (positive = ahead) |
| `compset_subrating_gaps` | json | computed | Per-dimension: where hotel loses |
| `compset_amenity_advantages` | string | computed | Amenities hotel has that compset lacks |
| `compset_amenity_gaps` | string | computed | Amenities compset has that hotel lacks |
| `compset_segment_diff` | json | computed | Segment mix comparison |
| `compset_review_volume_ratio` | float | computed | Hotel visibility vs compset |
| `compset_response_rate_delta` | float | computed | Owner response comparison |

### G. Review Intelligence — Redesigned

The raw review corpus stays in separate JSONL files. But the per-hotel intelligence extracted from reviews is dramatically richer:

| Field | Type | Source | Deliverable |
|-------|------|--------|-------------|
| `review_top_positive_topics` | json | NLP | "Where you're winning" (e.g., "service", "location", "breakfast") |
| `review_top_negative_topics` | json | NLP | "Where you're losing" (e.g., "noise", "value", "wifi") |
| `review_positive_by_language` | json | NLP | Per-language positive themes |
| `review_negative_by_language` | json | NLP | Per-language negative themes — "German guests complain about X" |
| `review_positive_by_segment` | json | NLP | Per-segment: what couples love vs business travelers |
| `review_negative_by_segment` | json | NLP | Per-segment: what each segment dislikes |
| `review_competitor_mentions` | json | NLP | Hotels mentioned in reviews ("better than Park Hyatt because...") |
| `review_expectation_signals` | json | NLP | What guests expected vs experienced |
| `review_content_seeds_positive` | json | NLP | Best quotes for marketing (by language) |
| `review_content_seeds_negative` | json | NLP | Pain points to address in content |
| `review_emotional_tone` | json | NLP | Joy/frustration/surprise/disappointment distribution |
| `review_owner_response_quality` | string | NLP | "professional" / "templated" / "defensive" / "absent" |
| `review_owner_response_language_match` | float | computed | % of responses in same language as review |

### H. AI Discovery & Digital Presence — NEW

This is the HOOK that gets the sales meeting. "84% of hotels are invisible in AI search."

| Field | Type | Source | Deliverable |
|-------|------|--------|-------------|
| `ai_chatgpt_mentioned` | boolean | LLM query | Does ChatGPT recommend this hotel? |
| `ai_chatgpt_description` | string | LLM query | How ChatGPT describes it (actual text) |
| `ai_chatgpt_rank_city` | int | LLM query | Position in ChatGPT's city recommendations |
| `ai_perplexity_mentioned` | boolean | LLM query | Perplexity mentions |
| `ai_gemini_mentioned` | boolean | LLM query | Gemini mentions |
| `ai_visibility_score` | float | computed | Composite across platforms (0-1) |
| `ai_source_citations` | json | LLM query | What sources AI cites about this hotel |
| `web_schema_org_present` | boolean | scrape | Schema.org markup on website |
| `web_schema_org_types` | string | scrape | Which schema types (Hotel, Review, etc.) |
| `web_languages` | string | scrape | Languages on hotel website |
| `web_language_gap` | string | computed | Guest languages NOT on website |
| `web_direct_booking` | boolean | scrape | Direct booking capability |
| `web_mobile_optimized` | boolean | scrape | Mobile-friendly |
| `web_last_updated_est` | string | scrape | Estimated last content update |
| `social_instagram_handle` | string | scrape | Instagram presence |
| `social_instagram_followers` | int | scrape | Follower count |
| `social_linkedin_present` | boolean | scrape | LinkedIn page exists |
| `google_rating` | float | scrape | Google Maps rating |
| `google_num_reviews` | int | scrape | Google review count |
| `google_rating_delta_vs_ta` | float | computed | Rating divergence (signal) |
| `booking_com_rating` | float | scrape | Booking.com score |
| `booking_com_num_reviews` | int | scrape | Booking.com review volume |

### I. Content & Messaging Intelligence — NEW

This directly feeds deliverable #5 ("here it is, done"):

| Field | Type | Source | Deliverable |
|-------|------|--------|-------------|
| `content_positioning_statement` | string | details/scrape | Hotel's self-description |
| `content_positioning_keywords` | string | NLP | Key positioning themes |
| `content_segment_pages` | json | scrape | Which segments have dedicated landing pages |
| `content_segment_gaps` | json | computed | Segments WITHOUT dedicated content |
| `content_language_coverage` | json | scrape | Content available per language |
| `content_language_gaps` | json | computed | Guest languages without content |
| `content_freshness` | string | scrape | "current" / "stale" / "outdated" |
| `content_ota_listing_quality` | json | scrape | OTA description completeness |
| `content_photo_recency` | string | photos | Average photo age |
| `content_photo_coverage` | json | photos | Photo albums present (rooms, dining, grounds, etc.) |
| `content_event_calendar` | json | external | Upcoming events in the city |
| `content_seasonal_opportunities` | json | computed | Which content to produce per month |

### J. Derived Scores — Redesigned for Operations + Sales

**SALES scores (for lead prioritization):**

| Field | Formula | Use |
|-------|---------|-----|
| `score_tos` | Tercier Opportunity Score (current formula, refined) | Sales priority |
| `score_contract_value` | Price level × rooms × estimated ADR | Revenue potential |
| `score_conversion_likelihood` | Independent + low response rate + multi-language guests | How likely to buy |

**OPERATIONAL scores (for product delivery):**

| Field | Formula | Use |
|-------|---------|-----|
| `score_content_gap` | Language gaps + segment gaps + stale content | How much work needed |
| `score_ai_readiness` | Schema.org + visibility + structured data | AI discovery potential |
| `score_segment_mismatch` | Guest languages vs content languages | Untapped audience |
| `score_reputation_risk` | Negative trend + low response rate + recent 1-2 star reviews | Urgent attention needed |
| `score_competitive_threat` | Competitor improving + hotel declining | Losing ground |
| `score_revenue_opportunity` | Direct booking potential × OTA commission savings | ROI argument |

---

## 4. CONTEXT ENGINEERING REDESIGN — JARVIS-LEVEL

### Current State

The repo has 3 skills:
1. `tercier-knowledge` — strategy, product, financials, people
2. `hotels-dataset` — dataset vision, phases, schema
3. `tripadvisor-api` — API endpoint reference

This is a good start but it's **flat and static**. For Jarvis-level AI-native operation, we need:

### Design Principles (from Anthropic's Context Engineering Paper)

1. **Progressive disclosure** — Load metadata first (~50 tokens/skill), full SKILL.md only when relevant, references only during execution
2. **Context as finite resource** — Every token must justify its existence. Don't dump 20K tokens when 2K suffices.
3. **Just-in-time retrieval** — Agents navigate to find what they need, not pre-load everything
4. **Structured note-taking** — Agents maintain working memory outside context window
5. **Sub-agent architecture** — Specialized agents with clean context windows for focused tasks

### The Redesigned Skill Graph

```
.skills/
├── tercier-knowledge/           ROOT — strategy, product, financials, people
│   ├── SKILL.md                 (load for ANY Tercier question)
│   └── references/
│       ├── product-layers.md    7-layer platform deep dive
│       ├── synthetic-research-methodology.md
│       ├── timeline.md
│       ├── competitive-landscape.md      NEW — competitive map from master research
│       └── what-hotels-buy.md            NEW — the agency replacement thesis
│
├── hotels-dataset/              DATA MOAT — global dataset strategy
│   ├── SKILL.md                 Vision, phases, NEW schema, pipeline architecture
│   └── references/
│       ├── intelligence-schema.md        REDESIGNED per this document
│       ├── city-priority-list.md         Phase-ordered discovery targets
│       ├── derived-scores.md             NEW — all score formulas
│       └── review-intelligence-spec.md   NEW — NLP extraction pipeline spec
│
├── tripadvisor-api/             PRIMARY DATA SOURCE
│   ├── SKILL.md                 Endpoints, params, schemas, patterns
│   └── references/
│       ├── endpoints.md          Full endpoint specs
│       ├── response-schemas.md   Verified JSON responses
│       └── pipeline-patterns.md  NEW — rate limiting, caching, resume patterns
│
├── ai-discovery/                NEW SKILL — AI visibility intelligence
│   ├── SKILL.md                 How to audit AI visibility per hotel
│   └── references/
│       ├── llm-query-methodology.md    How to systematically query AI models
│       ├── schema-org-hotel.md         Schema.org Hotel markup spec
│       └── geo-aeo-benchmarks.md       Industry benchmarks from master research
│
├── review-intelligence/         NEW SKILL — NLP review analysis
│   ├── SKILL.md                 How to extract intelligence from reviews
│   └── references/
│       ├── topic-extraction.md         NLP pipeline for topic clustering
│       ├── sentiment-by-segment.md     Per-segment sentiment analysis
│       └── content-seed-extraction.md  How to extract marketing-ready quotes
│
└── sales-intelligence/          NEW SKILL — using dataset for sales
    ├── SKILL.md                 How to generate per-hotel sales briefs
    └── references/
        ├── scoring-formulas.md         TOS, CPS, all derived scores
        ├── objection-handling.md       From synthetic survey
        └── sales-brief-template.md     Template for property-level pitch
```

### Skill Dependency Graph (Updated)

```
tercier-knowledge (root — strategy, product, market, financials)
  ├── hotels-dataset (the data moat strategy + schema)
  │     ├── tripadvisor-api (primary data source — endpoints, schemas)
  │     ├── ai-discovery (AI visibility — NEW)
  │     └── review-intelligence (NLP pipeline — NEW)
  └── sales-intelligence (using data for sales — NEW)
        └── hotels-dataset (consumes dataset)
```

### When Each Skill Loads

| Trigger | Load |
|---------|------|
| "tercier", "business", "product", "pricing" | tercier-knowledge |
| "dataset", "schema", "pipeline", "hotel data" | hotels-dataset |
| "tripadvisor", "TA API", "location search" | tripadvisor-api |
| "AI visibility", "ChatGPT", "GEO", "AEO", "discovery" | ai-discovery |
| "reviews", "sentiment", "NLP", "guest feedback" | review-intelligence |
| "sales brief", "lead scoring", "pitch", "opportunity" | sales-intelligence |
| Building pipelines | tripadvisor-api + hotels-dataset |
| Strategic decisions | tercier-knowledge + hotels-dataset |
| Full product work | ALL |

### CLAUDE.md Updates

The CLAUDE.md should be the lightweight index — it's always loaded, so it must be <2K tokens of actionable pointers. Current CLAUDE.md is good but should add:
- Pointer to new skills
- Updated dependency graph
- Clearer "load all three → load all six" guidance

---

## 5. TRIPADVISOR API: WHAT WE CAN ACTUALLY BUILD

### The Core Value Extraction

From 5 endpoints, we extract per hotel:

| Endpoint | Calls | Data Extracted | Product Layer |
|----------|-------|----------------|--------------|
| **Nearby Search** | 1 per grid point | Discovery + competitive proximity | L1, L4 |
| **Location Details** | 1 per hotel | Identity + quality fingerprint + segments + amenities + ranking | L1, L2, L3, L4 |
| **Reviews (6 languages)** | 6 per hotel | Multilingual sentiment + topics + content seeds + source markets | L2, L3, L7 |
| **Reviews (paginated)** | 2-10 per hotel/lang | Deep review corpus for NLP | L2, L3, L7 |
| **Photos** | 1-3 per hotel | Visual content inventory + recency | L5, L7 |

### What TripAdvisor Gives That Nobody Else Has

1. **Trip type distribution with REAL counts** — No other platform gives actual business/couples/solo/family/friends counts. Google doesn't. Booking.com doesn't. This is unique to TripAdvisor.

2. **6-dimensional quality fingerprint** — Location, Sleep, Rooms, Service, Value, Cleanliness. Each scored independently. This is the most granular quality signal available at scale.

3. **Per-review subratings** — Individual reviews include per-dimension scores. This means we can compute subratings BY SEGMENT, BY LANGUAGE, BY TIME PERIOD. Nobody else has this.

4. **Reviewer home location** — Where the guest is from. This maps to source markets. We can say "38% of your German guests rate you 4.2 on value but 4.8 on service" — that's a marketing insight.

5. **Owner response data** — Response text, language, delay, author. This signals hotel operational maturity.

6. **Ranking within city** — "#9 of 152 hotels in Zurich" — relative position with context.

7. **100+ amenity tags** — Including very specific ones (butler service, EV charging, allergy-free rooms). Perfect for competitive comparison.

8. **Brand + parent brand** — Chain affiliation at two levels. Independent hotels have null brand — instant segmentation.

### What TripAdvisor DOESN'T Give (and how we fill it)

| Missing | How to Fill | Priority |
|---------|------------|----------|
| Room count | HotellerieSuisse (Swiss), web scraping (global), Fiber API | High |
| ADR / pricing | Kayak/Booking scraping, or TA price_level as proxy | Medium |
| Official website URL | Web search + TA listing link extraction | High |
| AI visibility | Programmatic LLM queries | High |
| Google rating | Google Places API or scraping | Medium |
| Booking.com rating | Scraping | Medium |
| Social media | Instagram API / scraping | Low |
| Event calendar | City tourism APIs, event databases | Medium |
| Schema.org markup | Website scraping | High |

### The API Budget Reality

At 50 calls/sec:

| Scope | Hotels | Calls | Time | Cost |
|-------|--------|-------|------|------|
| Phase 0 (Swiss) | 2,069 | ~21K | 7 min | Free (within API tier) |
| Phase 1 (EU cities) | ~150K | ~1.2M | 7 hrs | Free (within API tier) |
| Phase 2 (Global) | ~500K | ~4.1M | 23 hrs | Free (within API tier) |
| Phase 3 (Full planet) | ~1.5M | ~12M | 67 hrs | Free (within API tier) |

The TripAdvisor Content API is free-tier for content partners. The rate limit is 50/sec. **We can index the entire planet in under 3 days of continuous API calls.**

### The Review Depth Question

Reviews are the most valuable data but also the most API-intensive:
- 5 reviews per page × 6 languages = 30 reviews per hotel minimum
- 6 API calls per hotel for reviews alone
- For 1.5M hotels: 9M review calls → 50 hours at 50/sec

**Smart strategy:** Tiered review depth based on hotel value:
- **Premium ($$$$/$$$$)**: 11 languages, 5 pages deep each = 55 calls/hotel
- **Upscale ($$$)**: 6 languages, 2 pages each = 12 calls/hotel
- **Others**: English only, 1 page = 1 call/hotel

This prioritizes depth where it matters most for Tercier's ICP.

---

## 6. BEYOND TRIPADVISOR: MULTI-SOURCE INTELLIGENCE

### The Multi-Source Stack

TripAdvisor is the PRIMARY source because it has the richest structured data per hotel. But the world-class dataset cross-references multiple sources:

| Source | What It Adds | Access Method | Priority |
|--------|-------------|---------------|----------|
| **TripAdvisor API** | Quality fingerprint, segments, reviews, compset, amenities | API (live) | Phase 0 |
| **Hotel website scraping** | Positioning, languages, direct booking, Schema.org | Firecrawl | Phase 0 |
| **Google Places/Maps** | Google rating, review count, place_id, opening hours | API or scrape | Phase 1 |
| **Booking.com** | Booking rating, room types, pricing, availability | Scraping | Phase 1 |
| **AI model queries** | AI visibility, how models describe the hotel | Programmatic LLM | Phase 1 |
| **Social media** | Instagram presence, LinkedIn, engagement | APIs/scraping | Phase 2 |
| **Fiber/Clearbit** | Decision-maker contacts, company data | API | Phase 0 (Swiss) |
| **Event databases** | City events, conferences, seasonal demand | APIs/scraping | Phase 1 |
| **HotellerieSuisse** | Swiss star ratings, room counts, member data | Existing CSV | Phase 0 |

### Cross-Source Intelligence Products

When you combine sources, new intelligence emerges:

1. **Rating divergence signal:** If TripAdvisor rating is 4.7 but Google is 4.2, something's different about the audience or expectations. This is actionable.

2. **Language gap detection:** If 15% of TripAdvisor reviews are in Japanese but the hotel website has no Japanese content, that's a direct content opportunity worth EUR X in direct bookings.

3. **AI visibility vs. review strength:** If the hotel has 1,000+ TripAdvisor reviews (strong) but ChatGPT doesn't mention it (invisible), the AI content gap is the priority.

4. **Competitive advantage mapping:** Hotel has butler service + EV charging + allergy-free rooms. Nearest competitor has none of these. Content should highlight differentiation.

5. **Decision-maker readiness:** We have the GM's name and email (from Fiber enrichment) + we know their hotel has a 4.1 on "value" (from TripAdvisor) + competitors score 4.5 (from compset analysis) + the hotel has no German content (from website scrape) + 30% of reviews are German (from TA). That's a personalized sales brief that writes itself.

---

## 7. THE DATASET THAT CHANGES EVERYTHING

### What Makes This Unprecedented

**Full competitive landscape research (14 competitors analyzed):**

| Capability | STR/CoStar (90K) | Lighthouse (65K) | TrustYou | Amadeus (41K) | Revinate (12.5K) | Data Appeal | Tercier (1.5M+) |
|-----------|-----------|-----------|---------|-----------|----------|------------|---------|
| Financial benchmarking | ✅ | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Rate intelligence | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 6-dim quality fingerprint | ❌ | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | **✅** |
| Real trip type distribution | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Multilingual review corpus | ❌ | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | **✅** |
| Auto-computed competitive sets | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Amenity-level benchmarking | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| AI discovery visibility | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Per-segment sentiment | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Content gap analysis | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Content generation from data | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Owner response intelligence | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | **✅** |
| Works WITHOUT hotel participation | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | **✅** |
| Cost to hotel | $5-15K/yr | $200-600/mo | $100-300/mo | $500-2K/mo | $300-800/mo | Enterprise | **Included** |

### Competitor Deep Dive (Key Findings)

**STR/CoStar** — 90K hotels, 190+ countries. Industry standard for financial benchmarking (occ/ADR/RevPAR). ZERO review intelligence, ZERO guest sentiment, ZERO multilingual data. Requires hotels to voluntarily submit data (only ~6% of global hotels). $35B+ market cap company. Pricing: $5-15K/yr per property.

**Lighthouse** — 65K hotels, 185 countries. Rate intelligence + recently ChatGPT booking app. Their reputation module is surface-level aggregated scores, not the 6-dimension subrating fingerprint. Serves revenue managers; Tercier serves commercial/marketing — different buyer entirely.

**TrustYou** — Aggregates 200+ review sources. Sentiment is category-level, NOT the per-dimension numerical scores TripAdvisor provides. No trip-type segmentation. Acquired by Recruit Holdings, pivoted multiple times (reputation → surveys → CDP → AI) — strategic uncertainty.

**Amadeus Demand360** — 41K hotels. Forward-looking demand data (on-the-books reservations). ZERO review intelligence. Only sees demand through GDS — independent boutique hotels (Tercier's sweet spot) are invisible to Amadeus.

**Revinate** — 12.5K hotels, 950M guest profiles. Rich first-party data but ONLY for its customers. Cannot tell a hotel anything about a competitor. Fundamentally different model.

**Data Appeal** — Destination-level analytics. Acquired by Almawave for EUR 16.5M (suggesting limited scale). Focuses on tourism boards, not individual hotel intelligence.

**Google Hotels** — Likely 5-10M+ properties. Massive data but NOT sold as B2B intelligence. No public API for hotel intelligence. Cannot be accessed programmatically for competitive analysis.

**Booking.com** — 28M+ listings, 300M+ reviews. Proprietary, not accessible. Hotels only see their own data via Extranet.

**GIATA** — 1.3M properties with 180M supplier codes. Hotel mapping/content infrastructure. ZERO intelligence layer.

**Key finding: There is NO comprehensive open hotel dataset. The closest thing is TripAdvisor's Content API, which is exactly Tercier's primary data source.**

### The 5 Unique Differentiators No Competitor Has

1. **Trip-type guest segmentation at scale** — TripAdvisor's trip_types (business/couples/solo/family/friends with actual counts) — NO other intelligence platform surfaces this.

2. **Multilingual review corpus with original-language text** — Not translated, not aggregated. The actual words in the guest's native language. "What do Japanese guests say that German guests don't."

3. **Auto-computed competitive sets from proximity + quality** — STR compsets are self-selected by the hotelier (bias). Tercier's are algorithmic.

4. **Coverage without participation** — STR, Amadeus, Lighthouse, Revinate all require the hotel to be a customer. Tercier knows about every hotel whether they participate or not.

5. **Commercial intelligence, not financial intelligence** — Everyone answers "how is my hotel performing financially?" Tercier answers "who are my guests, what do they think, what should I say to them, in which language, to win against my neighbors?" Nobody answers this.

### The Moat Is Real

STR/CoStar has financial performance data (RevPAR, occupancy, ADR) from participating hotels. That's their moat — hotels voluntarily share financial data.

Tercier's moat is DIFFERENT — it's intelligence derived from publicly available data + AI analysis that no hotel shares and no competitor assembles:
- Every review in every language, topic-clustered and segment-mapped
- AI visibility audits across 5+ LLM platforms
- Competitive reading through the eyes of specific guest personas
- Content gap analysis that translates directly into action

### The "Holy Grail" Data Points Hotels Desperately Want

From Revinate/Hapi "Future of Hotel Data" report (Aug 2025) + industry research:

1. **Guest intent BEFORE booking** — Who is searching, what do they want? Trip type + source market + booking channel. Tercier's TripAdvisor trip_types data enables this at scale.

2. **True competitive position beyond rates** — "Your competitor is rated higher on service quality by German business travelers" — nobody provides this. Tercier does.

3. **Multilingual reputation intelligence** — What do Japanese guests say vs. German guests? Hotels with international clientele have no systematic way to track this. Tercier's core Layer 2.

4. **Content-to-revenue attribution** — Connecting content to bookings. AI recommendations make this more urgent. 15% of hotels named it as deal killer.

5. **Forward-looking demand by segment** — "Business travel demand to your city is up 15% in Q3, but your property is capturing 10% less" — nobody provides segment-level demand signals.

6. **Real-time personalization data** — 19.4% say personalization most impacted by data quality. 18.2% say data issues → ineffective marketing.

**Tercier addresses #1, #2, #3 directly from the dataset. #4 comes with the product. #5 and #6 come with PMS integration (Phase 2).**

**The key insight from Corsaro: "Più siamo ermetici rispetto a che ci sta dietro... vinceremo sempre."** (The more hermetic we are about what's behind it... we will always win.)

The hotel sees: "Here's your monthly commercial brief. Here's what changed. Here's what to fix. Here's the content."
Behind the curtain: 200+ fields per hotel × 1.5M hotels × multilingual NLP × AI visibility audits × competitive algorithms. Nobody can replicate this because nobody knows what's behind it.

---

## 8. IMPLEMENTATION ROADMAP

### Phase 0: Swiss Foundation (1-2 days)

**Goal:** Match 2,069 hotelleriesuisse hotels to TripAdvisor. Full enrichment.

1. `01-match-swiss-hotels.ts` — Search by name + phone/address → location_ids
2. `02-fetch-details.ts` — Full details for all matched hotels
3. `03-fetch-reviews.ts` — Reviews in 6 languages per hotel (en, de, fr, it, es, ru)
4. `04-compute-compsets.ts` — Nearby search from each hotel → market-based compset
5. `05-cross-reference.ts` — Merge with enriched master CSV
6. `06-compute-scores.ts` — All derived intelligence scores

**Output:** World's most detailed hotel intelligence dataset for Switzerland. 2,069 hotels × 250+ fields.

### Phase 0.5: Review Intelligence + AI Discovery (1 week)

**Goal:** Extract deep review intelligence and AI visibility for Swiss hotels.

7. `07-extract-review-intelligence.ts` — NLP topic extraction from review corpus
8. `08-audit-ai-visibility.ts` — Query ChatGPT/Perplexity/Gemini for Swiss premium hotels
9. `09-audit-hotel-websites.ts` — Schema.org, languages, direct booking for Swiss hotels
10. `10-generate-sales-briefs.ts` — Per-hotel sales intelligence brief

**Output:** Complete intelligence product for first 10 pilot hotels.

### Phase 1: European Premium Cities (3 weeks)

**Goal:** Discover and enrich ~150,000 hotels across 50 European cities.

11. `11-geo-grid-discovery.ts` — Systematic lat/long grid discovery
12. Repeat steps 2-9 at scale

### Phase 2-3: Global expansion (months)

Extend to 500K → 1.5M hotels.

---

## APPENDIX: SOURCES

### Context Engineering
- [Anthropic — Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Marcel Castro — Skills: the art of progressive disclosure](https://marcelcastrobr.github.io/posts/2026-01-29-Skills-Context-Engineering.html)
- [Agent Skills Specification](https://agentskills.io/home)
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Harness — The Agent-Native Repo](https://www.harness.io/blog/the-agent-native-repo-why-agents-md-is-the-new-standard)
- [GitHub — How Squad Runs Coordinated AI Agents](https://github.blog/ai-and-ml/github-copilot/how-squad-runs-coordinated-ai-agents-inside-your-repository/)

### Hotel Industry Intelligence
- [BCG/NYU "AI-First Hotels" March 2026](https://www.bcg.com/publications/2026/ai-first-hotels-leaner-faster-smarter)
- [Hotelrank.ai — AI Hotel Landscape 2026](https://hotelrank.ai/research/ai-hotel-landscape-2026)
- [Conductor — AEO/GEO Benchmarks 2026](https://www.conductor.com/academy/aeo-geo-benchmarks-report/)
- [Bright Data — Best Hotel Data Providers 2026](https://brightdata.com/blog/web-data/best-hotel-data-providers)
- [CoStar STR Benchmark](https://www.costar.com/products/str-benchmark)

### Tercier Internal
- `research/STATE-OF-THE-ART-RESEARCH-2026-03-27.md` — Master research corpus (900 lines)
- `.skills/tercier-knowledge/SKILL.md` — Company knowledge base
- `.skills/hotels-dataset/SKILL.md` — Dataset strategy
- `.skills/tripadvisor-api/SKILL.md` — API reference

---

*Research and analysis compiled March 28, 2026. Challenges the existing intelligence schema based on product-market fit evidence from 100+ sources, Anthropic context engineering principles, and Corsaro/Guffanti call transcript insights.*
