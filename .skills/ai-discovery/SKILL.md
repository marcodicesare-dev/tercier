---
name: ai-discovery
description: "AI Discovery & Visibility Intelligence for hotels. Use this skill when auditing how AI models (ChatGPT, Perplexity, Gemini, Grok) see a hotel, building AI visibility scoring pipelines, analyzing Schema.org markup, or working on GEO/AEO optimization. Covers the methodology for systematic LLM querying, AI visibility scoring, digital presence auditing, and the 84%-invisible insight that drives Tercier's sales hook."
---

# AI Discovery & Visibility Intelligence

## Why This Matters

**84% of hotels worldwide are invisible in AI search** (Hotelrank.ai, Jan 2026). This is Tercier's sales HOOK — the insight that gets the first meeting. The AI discovery layer provides the urgency: "Let me show you how ChatGPT sees your hotel right now."

But AI discovery is the HOOK, not the product. The product is the full commercial intelligence system. AI discovery creates the meeting. The monthly deliverables close the deal.

Key proof points:
- 37% of travelers use AI LLMs for trip planning (BCG/NYU, Mar 2026)
- 78% of AI users have booked based on AI recommendations (TakeUp)
- AI-referred visitors convert at 2x the rate in 1/3 the sessions (Conductor)
- 5 hotels captured 57% of AI recommendations in London luxury (HFTP/LuxDirect)
- 75-91% of AI hotel links go directly to hotel websites, NOT OTAs (Hotelrank.ai)
- Estimated window for early action: 12-18 months (Lighthouse, HFTP)

---

## AI Visibility Audit Methodology

### Step 1: LLM Query Battery

For each hotel, query multiple AI models with structured prompts:

**Discovery queries (does the hotel appear?):**
```
"Best luxury hotels in {city}"
"Best hotels in {city} for {segment}" (business, couples, families)
"Where to stay in {city} with {amenity}" (spa, pool, view)
"Best {price_level} hotels near {landmark}"
"{hotel_name} review" / "Is {hotel_name} good?"
```

**Description queries (how is the hotel described?):**
```
"Tell me about {hotel_name}"
"What's special about {hotel_name}?"
"Compare {hotel_name} and {competitor_name}"
```

**Models to query:** ChatGPT (dominant — 87.4% of AI referral traffic), Perplexity, Gemini, Grok

### Step 2: Source Citation Analysis

Track which sources AI models cite when recommending hotels:

| Source | Grok | Perplexity | GPT | Gemini |
|--------|------|-----------|-----|--------|
| TripAdvisor | 99.9% | 95.5% | 20.5% | -- |
| Booking.com | 76.4% | 33.3% | 53.9% | 63% |
| Wikipedia | 5.1% | -- | 30% | 1% |
| Reddit | 54.5% | -- | 2.3% | -- |

**Implication:** TripAdvisor is THE dominant source for AI hotel recommendations. This validates the dataset strategy — TripAdvisor data quality directly impacts AI visibility.

### Step 3: Website AI-Readiness Audit

For each hotel website, check:
- **Schema.org markup:** Hotel, Review, LocalBusiness, Offer types
- **Structured data completeness:** Name, address, rating, amenities, photos
- **Content freshness:** Last updated date signals
- **Self-contained answer blocks:** Can AI extract a coherent hotel description?
- **Language coverage:** Does the site serve content in guest languages?
- **Mobile optimization:** AI models consider mobile-first signals

### Step 4: Scoring

**AI Visibility Score (0-1):**
- Mentioned by ChatGPT in top-10 for city: 0.3
- Mentioned by 2+ models: +0.2
- Accurate description (not OTA summary): +0.2
- Schema.org markup present: +0.1
- Website serves 3+ languages: +0.1
- Direct booking visible in AI response: +0.1

---

## AI Discovery Fields in Dataset

See `hotels-dataset/references/intelligence-schema.md` Section H for complete field definitions.

Key fields:
- `ai_chatgpt_mentioned`, `ai_perplexity_mentioned`, `ai_gemini_mentioned`
- `ai_chatgpt_description` — actual text ChatGPT uses
- `ai_chatgpt_rank_city` — position in city recommendations
- `ai_visibility_score` — composite 0-1
- `ai_source_citations` — what sources AI cites
- `web_schema_org_present`, `web_schema_org_types`
- `web_languages`, `web_language_gap`

---

## GEO/AEO Benchmarks

**Conductor (Jan 2026):** 3.3B sessions, 35.7M AI traffic sessions:
- AI referral = 1.08% of total, growing ~1%/month
- ChatGPT = 87.4% of AI referral traffic
- fourseasons.com ranked #4 in AI citation market share

**Ahrefs (Dec 2025):** 75K brand study:
- YouTube mentions = strongest AI visibility correlation (~0.737)
- Content volume has almost NO relationship with AI visibility
- ChatGPT most accessible for smaller brands (weakest authority correlations)

**MCP (Model Context Protocol) — emerging standard:**
- Lighthouse Connect AI: first booking app inside ChatGPT (Mar 2026)
- Cendyn AI Connect: pushes hotel rates into AI via MCP (Dec 2025)
- Apaleo: first PMS with MCP server (Sep 2025)

---

## Using This Skill

Load `ai-discovery` whenever:
- Auditing how AI sees a specific hotel or destination
- Building AI visibility scoring pipelines
- Working on Schema.org or structured data
- Analyzing GEO/AEO strategies
- Preparing the "AI visibility hook" for sales conversations
- Building the AI discovery layer of the product

Pair with `hotels-dataset` for schema context.
Pair with `tercier-knowledge` for strategic framing.
