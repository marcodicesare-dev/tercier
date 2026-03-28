# Tercier Global Hotels Dataset: The World's Most Comprehensive Hotel Intelligence System

> **The canonical blueprint.** Every agent building dataset pipelines, designing schemas, or making strategic decisions about the global hotels dataset should read this document.
>
> **Last updated:** March 28, 2026
> **Supersedes:** All prior versions. Incorporates: state-of-art research (100+ sources), competitive landscape analysis (14 platforms), context engineering research, 900-line industry corpus, Corsaro/Guffanti call transcript insights, live TripAdvisor API verification across 6 countries, live Google Places API verification across 5 cities with 12 API calls, and a 10-hotel sample dataset with every possible data point from both APIs.

---

## TABLE OF CONTENTS

1. [The Vision](#the-vision)
2. [Why Nobody Else Has This](#why-nobody-else-has-this)
3. [What Hotels Actually Buy (and How the Dataset Fuels It)](#what-hotels-actually-buy)
4. [TripAdvisor API: Complete Capability Map](#tripadvisor-api)
5. [Beyond TripAdvisor: Multi-Source Intelligence](#beyond-tripadvisor)
6. [The Intelligence Schema (250+ Fields)](#the-intelligence-schema)
7. [Review Intelligence: The NLP Layer](#review-intelligence)
8. [AI Discovery: The Sales Hook](#ai-discovery)
9. [Derived Intelligence Scores](#derived-intelligence-scores)
10. [The Global Discovery Strategy](#the-global-discovery-strategy)
11. [Implementation Architecture](#implementation-architecture)
12. [API Budget & Timeline](#api-budget--timeline)
13. [Why This Is Tercier's Moat](#why-this-is-tercieros-moat)

---

## 1. THE VISION

This is not an enrichment project for 2,069 Swiss hotels. This is the blueprint for building the most comprehensive hotel intelligence dataset ever assembled on earth.

The dataset IS Tercier's moat — every hotel on TripAdvisor, every review in every language, every competitive set, every guest segment distribution, every quality signal, every AI visibility audit, structured and queryable from day one.

TripAdvisor has data on **1.5M+ hotels globally**. We have an API key, 50 calls/sec, and the intelligence to extract structured commercial value from every single property. The hotelleriesuisse dataset (2,069 hotels) is not the scope — it's the first 0.1%.

**The dataset serves two purposes:**

1. **PRODUCT FUEL** — Pre-populates every layer of Tercier's 7-layer platform from day one. No per-hotel onboarding delay. New hotel signs up → intelligence is already there.

2. **SALES WEAPON** — Walk into any meeting pre-armed: "We already know your ranking dropped from #9 to #14. Your German guests rate you 4.2 on value but 4.8 on service. 84% of hotels are invisible in AI search — let me show you how ChatGPT sees yours."

---

## 2. WHY NOBODY ELSE HAS THIS

### Competitive Landscape (14 Platforms Analyzed)

| Capability | STR/CoStar | Lighthouse | TrustYou | Amadeus | Revinate | Data Appeal | **Tercier** |
|---|---|---|---|---|---|---|---|
| Hotels covered | 90K | 65K | ~350K | 41K | 12.5K | ~100K | **1.5M+** |
| Financial benchmarking | ✅ | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Rate intelligence | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 6-dim quality fingerprint | ❌ | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | **✅** |
| Guest trip-type segmentation | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Multilingual review corpus | ❌ | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | **✅** |
| Auto-computed competitive sets | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Amenity-level benchmarking | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| AI discovery visibility | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Per-segment sentiment (NLP) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Content gap analysis | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Content generation from data | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Owner response intelligence | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | **✅** |
| Works WITHOUT hotel participation | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | **✅** |
| Cost to hotel | $5-15K/yr | $200-600/mo | $100-300/mo | $500-2K/mo | $300-800/mo | Enterprise | **Included** |

### The 5 Unique Differentiators

1. **Trip-type guest segmentation at scale** — TripAdvisor's trip_types field (business/couples/solo/family/friends with ACTUAL COUNTS) is available through the API. NO other intelligence platform surfaces this as structured data. This is gold.

2. **Multilingual review corpus with original-language text** — Not translated, not aggregated into a single score. The actual words guests used in their native language. "What do Japanese guests say about you that German guests don't?"

3. **Auto-computed competitive sets** — STR compsets are self-selected by the hotelier (bias). Tercier's are algorithmically determined from proximity + quality + segment match.

4. **Coverage without participation** — STR, Amadeus, Lighthouse, Revinate all require the hotel to be a customer or data submitter. Tercier knows about every hotel whether they participate or not.

5. **Commercial intelligence, not financial intelligence** — Everyone answers "how is my hotel performing financially?" Tercier answers "who are my guests, what do they think, what should I say to them, in which language, to win against my neighbors?" Nobody answers this.

### Key Finding

**There is NO comprehensive open hotel dataset anywhere.** The closest thing is TripAdvisor's Content API — which is exactly Tercier's primary data source. The opportunity is wide open.

---

## 3. WHAT HOTELS ACTUALLY BUY (AND HOW THE DATASET FUELS IT)

### The Agency Replacement Thesis

The product that sells is NOT a dataset, NOT a dashboard. It's a **virtual commercial team member** — Corsaro's exact words: "un revenue manager virtuale col quale poi dialogare."

Hotels buy 5 monthly deliverables. The dataset fuels every one:

| Monthly Deliverable | What the Hotel Gets | Dataset Fields That Power It |
|---|---|---|
| **"What Changed"** | Demand shifts, events, competitor moves, review patterns | Rating trends, review velocity, ranking delta, competitor movement |
| **"Who Matters Now"** | Which guest segments to target this month | Trip type distribution, segment trends, source market data, language analysis |
| **"Where You're Losing"** | Hotel through guest eyes vs. competitors | Per-dimension subratings by language, competitor comparison, amenity gaps |
| **"What to Do About It"** | 5 ranked priorities | Content gap scores, reputation risk, competitive threat, AI readiness |
| **"Here It Is, Done"** | Ready-to-publish multilingual content | Content seeds from reviews, positioning analysis, language gaps, persona insights |

### The Sales Hook

> "84% of hotels are invisible to AI search. Let me show you how ChatGPT sees your property right now."

AI discovery creates the meeting. The monthly deliverables close the deal. The ROI math: shifting 5% of bookings from OTA to direct at a EUR 25M hotel saves EUR 112K/year. Tercier costs EUR 30-60K/year.

### Corsaro's Insight: Opacity as Moat

> "The more hermetic we become about what's behind it, while ensuring constant investment in the final intelligence... we will always win."

The hotel sees a virtual commercial team member. Behind the curtain: 250+ fields × 1.5M hotels × multilingual NLP × AI visibility audits × competitive algorithms. Nobody can replicate this because nobody knows what's behind it.

---

## 4. TRIPADVISOR API: COMPLETE CAPABILITY MAP

**API Key:** `CD2A4F8492AB4DFF8DCD851AE9DA6430`
**Base URL:** `https://api.content.tripadvisor.com/api/v1`
**Rate Limits:** 50 calls/sec
**Status:** Verified live — all 5 endpoints tested March 28, 2026, across Zurich, Paris, Dubai, Tokyo, Maldives, Cape Town

### Endpoint 1: Location Search
```
GET /location/search?key={key}&searchQuery={query}&category=hotels&language=en
```
Text-based hotel discovery. Returns up to 10 results per query. Use brand names + city to discover chain properties globally.

**Parameters:** searchQuery (required), category, phone, address, latLong, radius/radiusUnit, language (45+)

### Endpoint 2: Nearby Location Search
```
GET /location/nearby_search?key={key}&latLong={lat,lng}&category=hotels&radius=5&radiusUnit=km
```
**THE global discovery engine.** Returns up to 10 nearest hotels with distance and bearing. A systematic lat/long grid discovers every hotel TripAdvisor knows about.

**Verified global coverage:**
- Zurich (47.377, 8.542) → Baur au Lac, Park Hyatt, Widder, etc.
- Paris (48.857, 2.352) → Hotel Sansonnet, Le Grand Mazarin, etc.
- Dubai (25.205, 55.271) → Kempinski, Address Sky View, Mandarin Oriental, etc.
- Tokyo (35.682, 139.769) → Shangri-La, Bvlgari, Aman Tokyo, etc.
- Maldives (4.175, 73.509) → Hotels returned despite remote location
- Cape Town (-33.925, 18.424) → Labotessa, Southern Sun, etc.

### Endpoint 3: Location Details
```
GET /location/{locationId}/details?key={key}&language=en&currency=CHF
```
Returns EVERYTHING TripAdvisor knows about a property. This is where 80% of dataset value comes from.

**Full response fields (verified on Baur au Lac, id=196060):**

| Field | Example | Intelligence Value |
|-------|---------|-------------------|
| `description` | "Since 1844..." | Self-positioning narrative |
| `rating` | "4.7" | Overall satisfaction (1.0-5.0) |
| `num_reviews` | "1179" | Market visibility / demand proxy |
| `review_rating_count` | {"1":"22","2":"25","3":"42","4":"113","5":"977"} | Satisfaction distribution |
| `subratings` (6 dimensions) | Location: 4.9, Sleep: 4.8, Rooms: 4.8, Service: 4.7, Value: 4.2, Cleanliness: 4.9 | **6-dimension quality fingerprint** |
| `trip_types` (5 segments) | Business: 267, Couples: 398, Solo: 88, Family: 208, Friends: 89 | **REAL guest segment distribution** |
| `amenities` (100+) | Free Wifi, Suites, Butler Service, EV Charging, etc. | Feature inventory for competitive comparison |
| `price_level` | "$$$$" | Market positioning |
| `ranking_data` | #9 of 152 in Zurich | Competitive position |
| `brand` / `parent_brand` | "The Leading Hotels of the World" | Chain affiliation (null = independent) |
| `awards` | Travelers Choice 2025 | Quality signal |
| `photo_count` | "959" | Visual content depth |
| `latitude` / `longitude` | 47.367 / 8.539 | Precise geolocation |
| `ancestors` | Municipality → Canton → Country | Geographic hierarchy |

### Endpoint 4: Location Reviews
```
GET /location/{locationId}/reviews?key={key}&language={lang}&limit=5&offset=0
```
Returns recent reviews in a SPECIFIC language. **Pagination confirmed working** — offset=5 returns additional reviews beyond the first 5.

**Per-review fields:**

| Field | Value |
|-------|-------|
| `text` + `title` | Full review in original language |
| `rating` | 1-5 stars |
| `trip_type` | Business / Couples / Solo / Family / Friends |
| `travel_date` | When they stayed |
| `published_date` | When they wrote |
| `lang` | Language code |
| `subratings` | Per-review: Value, Rooms, Location, Cleanliness, Service, Sleep |
| `user.user_location` | Where the reviewer is from |
| `owner_response` | Hotel's reply text, author, date, language |
| `helpful_votes` | Community vote count |

**Key insight:** Reviews in their ORIGINAL language. Not translations. This is exactly what the product needs — actual guest voices revealing what each nationality cares about.

### Endpoint 5: Location Photos
```
GET /location/{locationId}/photos?key={key}&source=Management&limit=5&offset=0
```
Photo metadata with URLs at 5 sizes. Sources: Expert, Management, Traveler. Albums: Hotel & Grounds, Dining, Room/Suite.

### Supported Languages (45+)
`ar, zh, zh_TW, da, nl, en, en_AU, en_CA, en_HK, en_IN, en_IE, en_MY, en_NZ, en_PH, en_SG, en_ZA, en_UK, fr, fr_BE, fr_CA, fr_CH, de, de_AT, el, iw, it, it_CH, ja, ko, no, pt, pt_PT, ru, es, es_AR, es_CO, es_MX, es_PE, es_VE, es_CL, sv, th, tr, vi`

**Core 11 for global coverage:** en, de, fr, it, es, ru, ja, zh, ko, ar, pt

---

## 5. THE DUAL-API STRATEGY: TRIPADVISOR + GOOGLE PLACES

### Why Two APIs, Not One

TripAdvisor and Google Places are **complementary, not competing.** Each provides data the other simply doesn't have. Together they form the most complete hotel intelligence possible through public APIs.

**TripAdvisor wins on:** Review depth (hundreds vs. 5), 6-dimension subratings, trip type segmentation, city ranking, amenity inventory, owner responses, awards/badges
**Google wins on:** AI review summaries (Gemini), editorial descriptions, landmark/neighborhood context, accessibility/pet/family data, business status, structured address, lodging type taxonomy, discovery volume (20/request vs 10)

### The Two Data Sources

| | TripAdvisor Content API | Google Places API (New) |
|---|---|---|
| **Base URL** | `api.content.tripadvisor.com/api/v1` | `places.googleapis.com/v1` |
| **Auth** | Query param: `?key={key}` | Header: `X-Goog-Api-Key: {key}` |
| **Rate limit** | 50 calls/sec | No hard limit (pay-per-call) |
| **Cost** | Free tier (metered) | $200/mo credit + $5-40/1000 calls |
| **Reviews per hotel** | Hundreds (paginated, 5/page) | 5 (no pagination) |
| **Review languages** | 45+ (request specific language) | Best 5 (auto-selected) |
| **Subratings** | 6 dimensions | None (single rating) |
| **Trip types** | Business/Couples/Solo/Family/Friends with counts | None |
| **Ranking** | "#9 of 152 in Zurich" | None |
| **Amenities** | 100+ tags | None (inferred from types) |
| **Discovery volume** | 10 per search | 20 per search, 60 with pagination |
| **AI summary** | None | Gemini-generated `reviewSummary` |
| **Editorial** | None | Google-curated `editorialSummary` |
| **Landmarks** | None | `addressDescriptor.landmarks` with distances |
| **Pet/family** | None | `allowsDogs`, `goodForChildren` booleans |
| **Accessibility** | None | `accessibilityOptions` (wheelchair) |
| **Business status** | None | OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY |
| **Lodging types** | hotel, B&B, inn | 18 types: hotel, resort_hotel, boutique_hotel, hostel, etc. |

### Google-Exclusive Fields (Verified from Live API Calls)

| Field | Example (Baur au Lac) | Intelligence Value |
|-------|----------------------|-------------------|
| `reviewSummary` | "People say this hotel offers spacious rooms with breathtaking city views..." | **Free Gemini NLP of ENTIRE review corpus** — not just the 5 returned |
| `editorialSummary` | "Swanky rooms & suites in a grand, luxe 1844 hotel offering 4 posh restaurants & canal views." | Google-curated 1-liner (~80% of hotels) |
| `addressDescriptor.landmarks` | "UBP (28m), Swiss National Bank (108m), Bürkliplatz (141m)" | Hyper-local context for content |
| `addressDescriptor.areas` | "City, Bahnhofstrasse" | Neighborhood/district |
| `allowsDogs` | `true` | Pet policy — instant segment match |
| `goodForChildren` | `true` | Family suitability |
| `accessibilityOptions` | `{wheelchairAccessibleParking: true}` | Accessibility data |
| `paymentOptions` | `{acceptsDebitCards: true, acceptsNfc: true}` | Payment methods |
| `businessStatus` | `OPERATIONAL` | Detect closures |
| `primaryType` | `hotel` (18 lodging subtypes) | Richer categorization |
| `priceLevel` | `PRICE_LEVEL_VERY_EXPENSIVE` | Price tier (sparse — unreliable for hotels) |

**NOTE:** `priceLevel` is sparsely populated for hotels. In our Zurich test, 0 of 20 luxury hotels had it. Use TripAdvisor's `price_level` as primary.

### The Multi-Source Stack (Full)

| Source | What It Adds | Access | Phase | Cost |
|--------|-------------|--------|-------|------|
| **TripAdvisor API** | Quality fingerprint, segments, reviews, compset, amenities | API (live) | 0 | Free tier |
| **Google Places API** | Google rating, Gemini summary, editorial, landmarks, pet/family, accessibility | API (live) | 0 | $82 (Swiss) → $52K (global) |
| **Hotel website scraping** | Positioning, languages, direct booking, Schema.org | Firecrawl | 0 | Firecrawl credits |
| **AI model queries** | AI visibility, how ChatGPT/Perplexity/Gemini describe the hotel | Programmatic LLM | 0.5 | LLM API costs |
| **Booking.com** | Booking rating, room types, pricing | Scraping | 1 | Scraping costs |
| **Fiber/Clearbit** | Decision-maker contacts, company data | API | 0 (Swiss) | Fiber credits |
| **Event databases** | City events, conferences, seasonal demand | APIs/scraping | 1 | Varies |
| **Social media** | Instagram presence, LinkedIn, engagement | APIs/scraping | 2 | Varies |
| **HotellerieSuisse** | Swiss star ratings, room counts, member data | Existing CSV | 0 | Free (existing) |

### Cross-Source Intelligence Products

When you combine TA + Google + website + AI audits, intelligence emerges that NO single source provides:

1. **Rating divergence** — TA rating 4.7 but Google 4.2 = different audience expectations. Actionable signal.
2. **Dual-AI perspective** — Google's Gemini summary + Tercier's NLP on TA reviews = two independent AI readings of guest sentiment. Where they agree = high confidence. Where they diverge = investigation needed.
3. **Language gap detection** — 15% of TA reviews are Japanese but hotel website has no Japanese content = direct content opportunity.
4. **AI visibility vs. review strength** — 1,000+ TA reviews (strong) but ChatGPT doesn't mention the hotel (invisible) = AI content gap is the priority.
5. **Competitive advantage mapping** — TA amenities show butler service + EV charging + allergy-free rooms; Google shows `allowsDogs: true` + `goodForChildren: true`; competitor has none = content should highlight differentiation.
6. **Decision-maker readiness** — GM name + email (Fiber) + hotel has 4.1 on "value" (TA) + competitors score 4.5 + no German content (website scrape) + 30% TA reviews are German + Google's Gemini summary highlights "staff" but not "value" = personalized sales brief that writes itself.
7. **Business status filtering** — Google's `CLOSED_TEMPORARILY` / `CLOSED_PERMANENTLY` removes dead hotels from the pipeline. TA doesn't have this.
8. **Hyper-local content** — Google landmarks ("28m from Swiss National Bank") enable location-specific marketing copy that no competitor generates.

---

## 6. THE INTELLIGENCE SCHEMA (250+ FIELDS)

Every hotel gets up to 250+ fields across 10 categories. Full field definitions in `.skills/hotels-dataset/references/intelligence-schema.md`.

### A. Core Identity
`ta_location_id` (PRIMARY KEY), `ta_name`, `ta_description`, `ta_web_url`, `ta_latitude`, `ta_longitude`, `ta_timezone`, `ta_category`, `ta_subcategory`, `ta_brand`, `ta_parent_brand`

### B. Address & Geography
`ta_street1/2`, `ta_city`, `ta_state`, `ta_country`, `ta_postalcode`, `ta_address_string`, `ta_ancestors` (municipality → region → country), `ta_neighborhood`

### C. Quality & Reputation (WITH TEMPORAL)

**Point-in-time:**
`ta_rating`, `ta_num_reviews`, `ta_rating_{1-5}_count`, `ta_subrating_{location,sleep,rooms,service,value,cleanliness}`, `ta_price_level`, `ta_ranking`, `ta_ranking_out_of`, `ta_ranking_percentile`, `ta_awards`, `ta_photo_count`

**Computed signals:**
`ta_rating_5_pct`, `ta_rating_negative_pct`, `ta_subrating_min/max/range`

**NEW — Temporal (the "What Changed" engine):**
`ta_rating_30d_trend`, `ta_rating_90d_trend`, `ta_reviews_30d_count`, `ta_reviews_90d_count`, `ta_reviews_velocity_trend`, `ta_ranking_30d_delta`, `ta_ranking_90d_delta`, `ta_negative_review_30d_rate`

### D. Guest Segment Distribution (GOLD — nobody else has this)

**Raw counts:** `ta_trip_type_{business,couples,solo,family,friends}`
**Computed:** `ta_segment_pct_{business,couples,solo,family,friends}`, `ta_primary_segment`, `ta_secondary_segment`, `ta_segment_diversity` (Shannon entropy)
**Flags:** `ta_is_business_heavy` (>40%), `ta_is_couples_heavy` (>40%), `ta_is_family_heavy` (>30%)

**NEW — Temporal:**
`ta_segment_trend_{business,couples,family}`, `ta_emerging_segment`, `ta_underserved_segment`

**NEW — Source markets:**
`ta_top_reviewer_countries`, `ta_top_reviewer_countries_pct`, `ta_language_segment_matrix`

### E. Amenity Inventory (100+ standardized tags)
`ta_amenities` (full list), `ta_amenity_count`, plus 20+ boolean flags: `ta_has_{free_wifi,pool,spa,fitness,restaurant,bar,parking,ev_charging,meeting_rooms,business_center,room_service,concierge,suites,pet_friendly,accessible,butler_service,babysitting,airport_transfer,breakfast,air_conditioning,minibar}`, `ta_languages_spoken`

### F. Competitive Intelligence (REDESIGNED — market-based, not just distance)

**Market-matched compset:**
`compset_market_ids` (up to 10 hotels matched by price + rating + segment + city), `compset_market_criteria`

**Competitive signals:**
`compset_avg_rating`, `compset_avg_rating_trend`, `compset_rating_delta`, `compset_subrating_gaps` (per-dimension), `compset_amenity_advantages`, `compset_amenity_gaps`, `compset_segment_diff`, `compset_review_volume_ratio`, `compset_response_rate_delta`

**Also retain geographic proximity (10 nearest by distance) for discovery.**

### G. Review Intelligence (NLP-extracted — see Section 7)
`review_top_positive_topics`, `review_top_negative_topics`, `review_positive_by_language`, `review_negative_by_language`, `review_positive_by_segment`, `review_negative_by_segment`, `review_competitor_mentions`, `review_expectation_signals`, `review_content_seeds_positive`, `review_content_seeds_negative`, `review_emotional_tone`, `review_owner_response_quality`, `review_owner_response_language_match`

Plus aggregated stats: `ta_review_languages_present`, `ta_review_language_count`, `ta_review_recency_days`, `ta_owner_response_rate`, `ta_owner_response_avg_delay_hrs`, `ta_reviewer_top_locations`, `ta_avg_rating_{en,de,fr,it,es,ja}`

### H. Google Places Intelligence (NEW — from Google Places API)
`gp_place_id` (PRIMARY KEY for Google), `gp_rating`, `gp_user_rating_count`, `gp_price_level`, `gp_primary_type`, `gp_types`, `gp_editorial_summary`, `gp_review_summary_gemini` (AI-generated from full corpus), `gp_business_status` (OPERATIONAL/CLOSED), `gp_allows_dogs`, `gp_good_for_children`, `gp_accessibility_wheelchair_parking`, `gp_accessibility_wheelchair_entrance`, `gp_payment_accepts_debit`, `gp_payment_accepts_nfc`, `gp_landmarks_nearby` (with distances), `gp_areas` (neighborhood/district), `gp_google_maps_uri`, `gp_reviews` (5 most relevant with full text + original language), `gp_photos` (10 with dimensions), `gp_opening_hours`, `gp_timezone`

**Derived cross-source fields:**
`rating_divergence_ta_vs_google` (TA rating - Google rating), `review_count_ratio_ta_vs_google`, `has_dual_platform_presence`

### I. AI Discovery & Digital Presence (the sales hook)
`ai_chatgpt_mentioned`, `ai_chatgpt_description`, `ai_chatgpt_rank_city`, `ai_perplexity_mentioned`, `ai_gemini_mentioned`, `ai_visibility_score`, `ai_source_citations`, `web_schema_org_present`, `web_schema_org_types`, `web_languages`, `web_language_gap`, `web_direct_booking`, `web_mobile_optimized`, `social_instagram_handle`, `social_instagram_followers`

### I. Content & Messaging Intelligence (NEW — feeds deliverable #5)
`content_positioning_statement`, `content_positioning_keywords`, `content_segment_pages`, `content_segment_gaps`, `content_language_coverage`, `content_language_gaps`, `content_freshness`, `content_ota_listing_quality`, `content_photo_recency`, `content_photo_coverage`, `content_seasonal_opportunities`

### J. Derived Scores & Flags (see Section 9)
**Sales:** `score_tos`, `score_contract_value`, `score_conversion_likelihood`
**Operational:** `score_content_gap`, `score_ai_readiness`, `score_segment_mismatch`, `score_reputation_risk`, `score_competitive_threat`, `score_revenue_opportunity`
**Flags:** `flag_is_independent`, `flag_is_premium`, `flag_is_luxury`, `flag_has_international_guests`, `flag_needs_reputation_mgmt`, `flag_tercier_high_priority`

### K. Cross-Source Enrichment (Swiss hotels + expandable globally)
`hs_slug`, `hs_star_rating`, `hs_is_superior`, `hs_hotel_type`, `hs_rooms_count`, `hs_phone`, `hs_email`, `hs_website_url`, `hs_price_nightly_chf`, `hs_revenue_proxy_chf`, `hs_gm_name`, `hs_gm_title`, `hs_gm_email`, `hs_gm_confidence`, `hs_positioning_pillars`, `hs_market_segment`, `hs_booking_flow_type`, `hs_audience_signals`

---

## 7. REVIEW INTELLIGENCE: THE NLP LAYER

The raw review corpus is the most valuable data asset. It's stored separately from the hotel master in JSONL files organized by country/city.

### What NLP Extracts from Reviews

**Stage 1: Topic extraction** — Positive topics (service, location, breakfast, spa) and negative topics (noise, WiFi, check-in, hidden fees) with frequency and example quotes.

**Stage 2: Per-language sentiment** — What do German guests praise vs. complain about? Japanese? Each language reveals different expectations.

**Stage 3: Per-segment analysis** — What couples love vs. what business travelers need. Rating trends by segment.

**Stage 4: Competitive mentions** — "Better than Park Hyatt because..." — competitor mentions extracted from review text.

**Stage 5: Content seed extraction** — Best marketing quotes by language. Authentic guest voice for content production.

**Stage 6: Owner response analysis** — Response rate, delay, language match, quality (professional vs. templated vs. defensive).

### Technical Approach

LLM-based extraction (Claude/GPT) on batches of 20-50 reviews per hotel. Cost: ~$0.01-0.03 per hotel. At 150K EU hotels: $1,500-4,500 total.

### Review Languages Per Market

| Hotel Market | Languages to Query |
|-------------|-------------------|
| Switzerland | en, de, fr, it, es, ru, ja, zh, ko, ar, pt |
| France | en, fr, de, es, it, ja, zh, ko, ar, ru, pt |
| UAE/Gulf | en, ar, de, fr, ru, zh, ja, ko, es, it |
| Japan | ja, en, zh, ko, de, fr, es, it, ru |
| USA | en, es, fr, de, ja, zh, ko, it, ru, pt |

**Premium hotels ($$$/$$$$$):** All 11 core languages, 5 pages deep each.
**Upscale ($$$):** 6 languages, 2 pages each.
**Others:** English only, 1 page.

---

## 8. AI DISCOVERY: THE SALES HOOK

**84% of hotels worldwide are invisible in AI search** (Hotelrank.ai, Jan 2026). This gets the meeting.

### Key Stats
- 37% of travelers use AI LLMs for trip planning (BCG/NYU, Mar 2026)
- 78% of AI users have BOOKED based on AI recommendations (TakeUp)
- AI-referred visitors convert at 2x the rate (Conductor)
- 5 hotels captured 57% of AI recommendations in London luxury (HFTP/LuxDirect)
- TripAdvisor cited by 95-99% of Grok/Perplexity responses (Hotelrank.ai)
- 75-91% of AI hotel links go directly to hotel websites, NOT OTAs
- Window for early action: 12-18 months

### AI Visibility Audit Per Hotel

Query ChatGPT, Perplexity, Gemini with structured prompts:
- "Best luxury hotels in {city}"
- "Best hotels in {city} for {segment}"
- "Tell me about {hotel_name}"

Track: mentioned (yes/no), description accuracy, rank in city recommendations, source citations.

Check hotel website: Schema.org markup, structured data, language coverage, content freshness.

Score: `ai_visibility_score` (0-1) composite across platforms + web readiness.

---

## 9. DERIVED INTELLIGENCE SCORES

### Sales Scores (Lead Prioritization)

**Tercier Opportunity Score (TOS): 0-1**
- Independent/small chain: 20%
- Low owner response rate (<30%): 15%
- Underranked vs. amenity potential: 15%
- High review volume (>200): 10%
- Multi-segment guest mix (entropy > 1.5): 10%
- Multilingual reviews (3+ languages): 10%
- Premium price level ($$$+): 10%
- Competitive dense market (>50 hotels): 10%

### Operational Scores (Product Delivery)

| Score | What It Measures | Feeds Deliverable |
|-------|-----------------|-------------------|
| `score_content_gap` | Language gaps + segment gaps + stale content | "Here it is, done" |
| `score_ai_readiness` | Schema.org + visibility + structured data | AI discovery hook |
| `score_segment_mismatch` | Guest languages vs. content languages | "Who matters now" |
| `score_reputation_risk` | Negative trend + low response + recent 1-2 stars | "What changed" |
| `score_competitive_threat` | Competitor improving while hotel declining | "Where you're losing" |
| `score_revenue_opportunity` | Direct booking potential × OTA commission savings | ROI argument |

---

## 10. THE GLOBAL DISCOVERY STRATEGY

### How to Find Every Hotel on Earth

TripAdvisor has no "list all hotels" endpoint. Discovery happens through:
1. **Known hotel matching** — hotelleriesuisse → search by name/phone/address
2. **Brand discovery** — Search each brand name per city (200+ brands × 200+ cities)
3. **Geo-grid discovery** — Systematic lat/long grid with nearby_search at each point

### Geo-Grid Design

| Area Type | Grid Spacing | Points/km² | Search Radius |
|-----------|-------------|-----------|--------------|
| Urban core (city center, 3km) | 0.5km | ~4 | 1km |
| Extended urban (3-8km) | 1.0km | ~1 | 2km |
| Resort/coastal (linear) | 2.0km | ~0.5 | 5km |
| Mountain/valley | 5.0km | ~0.04 | 10km |

### Priority Markets

**Phase 0 — Switzerland:** Match 2,069 hotelleriesuisse hotels. No grid needed — name/phone/address search.

**Phase 1 — European Premium Cities (50 cities):**
Tier 1: Paris, London, Rome, Barcelona, Milan, Amsterdam, Vienna, Munich, Berlin, Madrid, Lisbon, Prague, Florence, Venice + Swiss cities
Tier 2: Côte d'Azur, Italian Lakes, Amalfi Coast, Greek Islands, Spanish Coast, Algarve, Croatia, Scandinavia
Tier 3: Frankfurt, Hamburg, Brussels, Dublin, Edinburgh, Budapest, Warsaw, Istanbul

**Phase 2 — Global Premium Cities:**
Middle East: Dubai, Abu Dhabi, Doha, Riyadh, Marrakech
Asia-Pacific: Tokyo, Kyoto, Singapore, Hong Kong, Bangkok, Bali, Sydney, Seoul, Shanghai, Mumbai, Maldives
Americas: New York, Los Angeles, Miami, Cancún, Mexico City, São Paulo, San Francisco, Las Vegas
Africa: Cape Town, Nairobi, Zanzibar

**Phase 3 — Full Planet:** All tourism regions worldwide.

### Brand-Name Discovery (Parallel)

Search every known hotel brand to capture chain properties:

**Luxury:** Four Seasons, Ritz-Carlton, St. Regis, Park Hyatt, Mandarin Oriental, Aman, Rosewood, Peninsula, Bulgari, Raffles, Belmond, Six Senses, One&Only, Cheval Blanc

**Upper upscale:** Marriott, Hilton, Hyatt, IHG, Accor, Radisson, Kempinski, Fairmont, Sofitel, JW Marriott, Conrad, Waldorf Astoria, W Hotels, Le Méridien, Sheraton, Westin

**Lifestyle/boutique:** citizenM, 25hours, Hoxton, Ace Hotel, 1 Hotels, Nobu, Edition, Kimpton, Autograph Collection, Design Hotels

**Regional premium:** Oberoi (India), Banyan Tree (Asia), Constance (Indian Ocean), Sun International (Africa), Rixos (Turkey/ME)

---

## 11. IMPLEMENTATION ARCHITECTURE

### Pipeline Scripts
```
scripts/hotel-intelligence-pipeline/
├── 00-geo-grid-generator.ts          Generate lat/long grid per city
├── 01-discover-hotels-ta.ts          TripAdvisor nearby + text search discovery
├── 02-discover-hotels-google.ts      Google Places nearby + text search discovery
├── 03-deduplicate-merge.ts           Merge TA + Google discoveries, assign dual IDs
├── 04-fetch-ta-details.ts            TripAdvisor details for all hotels
├── 05-fetch-google-details.ts        Google Place Details (Ent+Atmosphere tier)
├── 06-fetch-ta-reviews.ts            Multilingual review harvesting from TA
├── 07-map-competitive-sets.ts        Market-based competitive set computation
├── 08-match-hotelleriesuisse.ts      Cross-reference Swiss dataset
├── 09-extract-review-intelligence.ts NLP topic extraction (TA reviews + Google Gemini summaries)
├── 10-audit-ai-visibility.ts         ChatGPT/Perplexity/Gemini queries per hotel
├── 11-audit-hotel-websites.ts        Schema.org, languages, direct booking
├── 12-compute-scores.ts              All derived intelligence scores
├── 13-generate-sales-briefs.ts       Per-hotel sales intelligence brief
├── lib/
│   ├── tripadvisor-client.ts         Rate-limited TA API client with caching
│   ├── google-places-client.ts       Google Places API client with field masks
│   ├── cache.ts                      JSONL cache with dedup and TTL
│   ├── geo-grid.ts                   Grid generation + priority ordering
│   ├── hotel-matcher.ts              Cross-platform hotel matching (name + lat/lng + phone)
│   └── scoring.ts                    Intelligence score computation
└── config/
    ├── city-grids.json               City coordinates + grid params
    ├── brand-list.json               Hotel brand names for search
    ├── language-matrix.json          Languages per country
    └── google-field-masks.json       Field masks by enrichment tier
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
│   └── review-intelligence.csv       NLP-extracted topics per hotel
├── competitive-sets/
│   └── competitive-sets.csv          Hotel → 10 market-matched competitors
├── ai-discovery/
│   └── ai-visibility-audits.csv      AI mention data per hotel
├── photos/
│   └── photos-cache.jsonl            Photo metadata
└── intelligence/
    ├── hotel-quality-index.csv       HQI scores
    ├── competitive-position.csv      CPS scores
    ├── tercier-opportunity-scores.csv TOS lead scores
    ├── content-gap-analysis.csv      Content gaps per hotel
    └── sales-briefs/                 Per-hotel sales intelligence PDFs
```

### Technical Requirements
- **Rate limiter:** Token bucket at 50 calls/sec
- **Cache:** JSONL, 7-day TTL, never re-fetch within window
- **Resume:** Pipeline resumes from any interruption point
- **Dedup:** `ta_location_id` primary key, earliest discovery wins
- **Concurrency:** 10-20 parallel requests
- **Error handling:** Exponential backoff on 429/500, skip+log on 404
- **Environment:** API key via env var `TRIPADVISOR_API_KEY`, never hardcoded

---

## 12. API BUDGET & TIMELINE

### Calls Per Hotel

| Action | Standard | Premium ($$$+) |
|--------|----------|---------------|
| Discovery (amortized) | 0.01 | 0.01 |
| Details | 1 | 1 |
| Reviews (6 languages × 1 page) | 6 | — |
| Reviews (11 languages × 5 pages) | — | 55 |
| Competitive set (nearby_search) | 1 | 1 |
| Photos | 1 | 1 |
| **Total** | **~10** | **~58** |

### Phase Timeline (Both APIs Combined)

| Phase | Hotels | TA Calls | Google Calls | Google Cost | Calendar |
|-------|--------|----------|-------------|------------|----------|
| **Phase 0: Swiss** | 2,069 | ~21K | ~2.1K | **$82** | **1 day** |
| **Phase 0.5: NLP + AI audit** | 272 ICP | ~15K | included | LLM costs | **1 week** |
| **Phase 1: EU Discovery** | ~150K | ~350K | ~55K | **$3,250** | **1 week** |
| **Phase 1: EU Reviews** | ~150K | ~1.2M | — | — | **2 weeks** |
| **Phase 2: Global** | ~500K | ~4.1M | ~520K | **$20,500** | **3 months** |
| **Phase 3: Full Planet** | ~1.5M | ~12M | ~1.5M | **$52,500** | **6 months** |

**TripAdvisor:** Free tier, rate-limited at 50/sec. Entire planet in ~67 hours of continuous calls.
**Google Places:** Pay-per-call. $200/mo free credit. Full global enrichment ~$52K.
**Combined:** Under $55K to build the most comprehensive hotel intelligence dataset on earth.

---

## 13. WHY THIS IS TERCIER'S MOAT

### 1. Nobody has this data assembled this way.
STR has financial data. Lighthouse has rates. TrustYou has aggregate scores. Nobody has structured, multilingual, per-property commercial intelligence with trip-type segmentation, 6-dimension fingerprints, NLP-extracted review topics, AI visibility audits, and market-based competitive sets — at global scale.

### 2. It compounds.
Every month, new reviews come in. Historical data enables trend analysis. "Your service rating dropped 0.3 points over 6 months while your competitor improved" — that's an alert, a story, a content opportunity, a sales conversation.

### 3. It's the sales weapon.
Walk into any meeting with intelligence the hotel has never seen about itself. Not a pitch — a demonstration. The hotel's own data, structured better than they've ever seen it.

### 4. It scales the product without onboarding.
New hotel signs up → platform is pre-populated. No per-hotel setup delay. The intelligence is already there from the dataset.

### 5. It enables the network effect.
The more hotels Tercier serves, the more comparative intelligence it generates. Cross-property benchmarking, cross-market insights, industry-wide trends — all derived from the dataset.

### 6. It's the asset Amedeo and Marco Corsaro can sell from.
"We have intelligence on 500,000 hotels in Europe. Your chain has 47 properties. Here's what we know about each one." That's the opener that gets the meeting.

### 7. Coverage without participation.
Unlike STR, Amadeus, Lighthouse, or Revinate — Tercier doesn't need the hotel to be a customer to have intelligence about them. The dataset exists independently. That's how you walk into a first meeting already knowing more about their hotel than they do.

---

## WHAT WE BUILD VS. WHAT EXISTS TODAY

| Capability | Before (hotelleriesuisse) | After (Global Dataset) |
|-----------|--------------------------|----------------------|
| Hotels covered | 2,069 (Switzerland) | 1,500,000+ (global) |
| Quality data | Star rating from HS | 6-dimension subratings + temporal trends |
| Guest segments | None (survey estimates) | Real trip type counts + segment trends |
| Competitive sets | None (manual) | Market-based, auto-computed, with dimension comparison |
| Review intelligence | None | NLP-extracted topics per language, per segment, per competitor |
| AI visibility | None | Systematic audits across ChatGPT, Perplexity, Gemini |
| Content intelligence | None | Language gaps, segment gaps, Schema.org, freshness |
| Amenity inventory | Website scrape (partial) | 100+ standardized tags from TA |
| Brand affiliation | HS classification | TA brand + parent brand |
| Market position | None | City ranking + percentile + trend |
| Owner response | None | Response rate + delay + quality + language match |
| Decision-maker contacts | 420 resolved (Swiss) | Expandable globally via Fiber |
| Derived scores | Revenue proxy only | HQI + CPS + TOS + 6 operational scores |

**This is not an incremental improvement. This is a category change.**

From a regional hotel list to the most comprehensive commercial intelligence dataset the hospitality industry has ever seen.

---

*Document compiled March 28, 2026. Incorporates live API verification across 6 countries, competitive analysis of 14 platforms, 100+ industry sources, Corsaro/Guffanti call transcript insights, state-of-art context engineering research, and the complete intelligence schema redesign.*
