# Tercier Platform Architecture: 7-Layer Product Definition

## Overview

Tercier's platform is composed of seven interconnected layers that work together to transform raw market and customer signals into actionable, property-specific commercial intelligence and automated execution assets. Each layer builds on the output of prior layers, culminating in monthly content decisions that drive direct bookings.

---

## Layer 1: Market Intelligence

### Purpose
Provide real-time visibility into the competitive set's pricing, promotions, positioning, and commercial activity.

### What It Does
- **Price Monitoring:** Daily/weekly tracking of ADR, room rates by tier (deluxe, suite, etc.), package pricing across competitive set
- **Promotional Calendar:** Capture competitive promotions, seasonal packages, channel-specific offers
- **Positioning Statements:** Scrape and analyze competitor website positioning, messaging hierarchy, value propositions
- **Occupancy & Demand Signals:** Infer demand patterns from booking engine behavior, inventory velocity, rate change frequency

### Data Sources
- Competitor website scraping (rate pages, promotions, descriptions)
- OTA price comparison (Booking.com, Expedia, HotelWorld APIs)
- Social media and email newsletter monitoring
- Reservation engine telemetry (if available via integrations)

### Output
- Weekly competitive intelligence report (price deltas, promotion landscape, positioning shifts)
- Anomaly detection (competitor rate drops, new seasonal packages, repositioning)
- Trend analysis (month-over-month, seasonal baselines)

### Use in Downstream Layers
Feeds into Persona & Intent Modeling (what are competitors saying to which guests?) and AI Discovery Intelligence (how are competitors appearing in search?).

---

## Layer 2: Voice-of-Customer Intelligence

### Purpose
Aggregate and synthesize guest feedback, sentiment, and unmet needs at property and competitive-set level.

### What It Does
- **Review Aggregation:** Pull reviews from TripAdvisor, Google, Booking.com, property website
- **Sentiment Analysis:** NLP-driven extraction of positive/negative themes, emotional tone, satisfaction drivers
- **Intent Signal Extraction:** Identify what matters most to arriving guests (family-friendly, wellness, business amenities, food/beverage quality, location, value perception)
- **Gap Analysis:** Identify service gaps, unmet expectations, repeat pain points
- **Competitive Comparison:** Benchmark property sentiment against competitive set (what are guests saying about competitors that they don't say about you?)

### Data Sources
- TrustYou API (if available; otherwise manual scraping from review platforms)
- Booking.com, Google Reviews, TripAdvisor feeds
- Property-level guest feedback systems (surveys, post-stay emails)
- Email and social media sentiment monitoring

### Output
- Monthly Voice-of-Customer summary (top positive/negative themes, sentiment trend)
- Intent hierarchy (ranked list of what guest cohorts care about most)
- Competitive sentiment benchmarking (gaps relative to competitive set)
- Emerging themes (new concerns or opportunities signaled by recent reviews)

### Use in Downstream Layers
Feeds into Persona & Intent Modeling (which guest profiles does voice reveal?) and Content & Asset Engine (what proof points and messages resonate most?).

---

## Layer 3: Persona & Intent Modeling

### Purpose
Build a dynamic segmentation of guest demand profiles and booking decision logic specific to the property.

### What It Does
- **Demand Cohort Segmentation:** Cluster arriving guests into archetypical personas (business traveler, romantic weekend, family vacation, group event, extended stay, etc.)
- **Booking Psychology Mapping:** For each persona, model decision drivers: price sensitivity, lead time, channel preference, amenity prioritization
- **Value Driver Hierarchy:** Rank what each persona is willing to pay for (location, view quality, dining, wellness, events, loyalty status, bundled services)
- **Seasonal Variation:** Capture how personas shift by season (summer family travel vs. winter conference season)
- **Micro-Segmentation:** Identify sub-segments within personas (e.g., "eco-conscious couples" vs. "budget-conscious families")

### Data Sources
- Booking.com, Expedia, direct booking form data (if available via CRM/PMS integration)
- Reservation system behavioral data (lead time, channel, booking pace)
- In-stay behavior signals (F&B spend, facility usage, loyalty/repeat booking rate)
- Voice-of-Customer themes (guest comments reveal personas and values)
- Competitive set demographics and messaging (who are competitors targeting?)

### Output
- Property-specific persona profiles (2–5 primary personas with secondary detail)
- Booking decision matrix for each persona (price, positioning, proof points that matter)
- Seasonal demand forecast by persona
- Micro-segment opportunity analysis (which sub-segments are underserved?)

### Use in Downstream Layers
Feeds into Competitive Reading (what messaging is each competitor using to target each persona?) and AI Discovery Intelligence (which search keywords align with each persona?).

---

## Layer 4: Competitive Reading

### Purpose
Analyze how competitors are talking to identified personas and identify positioning gaps.

### What It Does
- **Message Mapping:** For each competitor, extract primary messages by channel and persona context (homepage vs. family landing page vs. business travel page)
- **Feature Communication:** Identify which features each competitor highlights for each persona (e.g., conference space + WiFi for business vs. kids' club + family suites for families)
- **Value Articulation:** Extract competitor language around unique value (luxury positioning, eco-credentials, food/wine excellence, wellness focus, etc.)
- **Proof Point Inventory:** Capture how competitors prove their claims (awards, accolades, guest testimonials, third-party certifications, celebrity endorsements)
- **Gap Analysis:** Identify what this property CAN claim that competitors are NOT claiming (service quality, sustainability, specific amenity, cuisine type, event capability, etc.)

### Data Sources
- Competitor website messaging and information architecture
- Marketing collateral (email campaigns, ads, social media posts)
- OTA listings and description text
- Influencer/media partnerships and endorsement patterns
- Third-party ratings and accreditations (Michelin, Relais & Châteaux, sustainability certs, etc.)

### Output
- Competitive messaging matrix (what is each competitor saying to each persona?)
- Feature and proof point inventory (benchmarking property capabilities against competitive set)
- Positioning gap map (identified white spaces and differentiation opportunities)
- Recommended proof points for this property (specific awards, capabilities, or testimonials to emphasize)

### Use in Downstream Layers
Feeds directly into Decision & Prioritization Engine (which gaps are most valuable to address?) and Content & Asset Engine (what proof points and messaging should this month's assets highlight?).

---

## Layer 5: AI Discovery & Visibility Intelligence

### Purpose
Understand how the property appears (or doesn't appear) in AI-native search, LLM recommendations, and algorithmic discovery channels.

### What It Does
- **LLM Visibility Scan:** Query major LLMs (Claude, ChatGPT, Gemini, etc.) for the property name, location, and category queries to assess how often/how it's mentioned
- **Search Keyword Coverage:** Analyze which keywords the property appears in (branded, category, intent-based) and rank by search volume and conversion potential
- **Semantic Positioning:** Assess how the property is described in uncontrolled mentions (news, blogs, third-party reviews, LLM training data) vs. owned positioning
- **Discovery Algorithm Performance:** Monitor how the property ranks in recommendation algorithms on OTAs and Google Hotels (if data available)
- **Content Gap for AI:** Identify missing content that would improve AI-native discovery (specific amenity descriptions, cuisine type, event capacity, accessibility features, sustainability credentials, etc.)

### Data Sources
- LLM query sampling (structured queries to multiple models)
- Google Search Console (for property-controlled keywords)
- TripAdvisor, Booking.com search ranking data
- Web scraping of property mentions in news, blogs, travel guides
- HotelWorld AI or similar competitive intelligence tools
- Google Trends, search volume data for category and intent keywords

### Output
- AI visibility audit (which LLMs mention this property? How often? In what context?)
- Search keyword opportunity map (high-volume, low-competition keywords to target)
- Semantic positioning report (how is the property described in AI context vs. owned positioning?)
- Content optimization roadmap (specific descriptions, features, proof points to improve AI discovery)

### Use in Downstream Layers
Feeds into Decision & Prioritization Engine (which AI visibility gaps are most valuable to close?) and Content & Asset Engine (content must be optimized for AI indexing and LLM mention likelihood).

---

## Layer 6: Decision & Prioritization Engine

### Purpose
Synthesize all signals from Layers 1–5 and recommend the top 3–5 commercial priorities for the upcoming month.

### What It Does
- **Opportunity Scoring:** For each identified gap/opportunity (from Competitive Reading and AI Discovery), calculate potential impact:
  - Market size of the gap (how many guests is this relevant to?)
  - Addressability (can the property actually address this? Do they have the amenity, proof point, or capability?)
  - Effort/cost (how much work to communicate this?)
  - Competitive advantage (is this defensible or easily copied?)

- **ROI Estimation:** Score each opportunity by estimated direct-booking impact:
  - Expected incremental ADR or occupancy lift
  - Addressable demand (how many of identified personas would book because of this?)
  - Cannibalization risk (does this pull demand that would book anyway?)

- **Scheduling & Sequencing:** Recommend the optimal sequence of messaging over 3–12 months (e.g., "emphasize eco-credentials in spring, event/conference positioning in fall")

- **Monthly Priority Rollout:** Select top 3–5 priorities for the upcoming month based on:
  - Seasonal demand patterns (which personas are arriving next month?)
  - Competitive activity (are competitors launching similar messaging?)
  - Asset readiness (do we have the content/proof points ready to deploy?)
  - Technology constraints (can our CMS/martech stack execute this?)

### Data Sources
- Aggregated output from Layers 1–5
- Historical performance data (which past messaging drove bookings?)
- PMS/CRM integration (which guests booked; at what rate; who influenced the booking?)
- Seasonal demand forecast
- Content asset inventory (what can we deploy in the next 30 days?)

### Output
- Monthly priority scorecard (top 3–5 initiatives ranked by ROI potential)
- Recommended messaging angle for each priority
- Proof point package (which specific awards, testimonials, capabilities to highlight)
- Audience and channel recommendations (which guest personas? Direct website? Email? Paid search?)
- 3–12 month strategic messaging roadmap

### Use in Downstream Layers
Feeds directly into Content & Asset Engine (what content to create/publish) and execution (which channels, which audiences, which proof points).

---

## Layer 7: Content & Asset Engine

### Purpose
Automatically generate and publish property-specific marketing narratives, proof point packages, and promotional assets aligned with monthly priorities.

### What It Does
- **Narrative Generation:** Based on priority decisions from Layer 6, generate:
  - Updated homepage messaging hierarchy (lead with top priority)
  - Updated landing page copy (SEO-optimized for priority keywords)
  - Email campaign templates (for different guest personas)
  - Social media content (LinkedIn for B2B/events, Instagram for lifestyle)
  - PPC ad copy and landing pages (Google Ads, Facebook Ads)

- **Proof Point Assembly:** Compile and format proof elements:
  - Award badges and accolades
  - Guest testimonials (pulled from reviews and curated for authenticity)
  - Specification sheets (room counts, event capacity, dietary options, accessibility features)
  - Third-party credentials (sustainability, accessibility, food/beverage certifications)

- **Visual Asset Adaptation:** Suggest which existing images to repurpose or which new photography to commission to support the priority narrative

- **Channel Optimization:** Adapt content for each distribution channel:
  - Direct website (SEO-optimized, conversion-focused)
  - OTA listings (Booking.com descriptions, photos, tags)
  - Email marketing (persona-specific, mobile-optimized)
  - Social media (short-form, visual, engagement-driven)
  - Paid search and display (ad copy, landing pages, bid strategy)

- **Publishing & Scheduling:** Coordinate multi-channel publication with proper lead times:
  - Website updates (immediate)
  - Email sends (frequency based on list preference)
  - Social posting schedule (daily/weekly cadence)
  - OTA updates (weekly to catch algorithm resets)
  - Paid search campaign launches (tied to seasonal demand)

### Data Sources
- Layer 6 priority and messaging recommendations
- Brand guidelines and visual asset library
- Historical performance data (which messaging/creative performs best?)
- Guest persona insights (tone and format for each audience)
- PMS/CRM data (timing for email sends, guest lifecycle stage)
- Content management system (CMS) integration

### Output
- Monthly content production brief (one-pager for property team or agency partner)
- Ready-to-use website copy and landing page templates
- Email campaign templates (with variant testing recommendations)
- Social media content calendar (30 posts, pre-written)
- PPC ad copy and creative brief (for media buyer or in-house team)
- OTA update checklist (descriptions, photos, tags to refresh)
- Publishing checklist and timeline (what goes live when?)

### Integration Recommendations
- **PMS/CRM Integration:** Link booking data to measure which assets/messaging drove conversions
- **Email Platform Integration:** Auto-send campaign templates to hotel's email system
- **CMS Integration:** Push website copy directly to property's CMS (if tech-enabled)
- **Social Media Scheduler:** Integration with Buffer, Hootsuite, or Meta Business Suite for auto-posting
- **Google Ads Integration:** Sync ad copy and landing page recommendations to Google Ads account
- **OTA Channel Manager:** Coordinate property updates across Booking.com, Expedia, etc.

---

## Layer Interdependencies

```
Layer 1 (Market Intelligence)
    ↓
Layer 2 (Voice-of-Customer)
    ↓ ↓
Layer 3 (Persona & Intent)  ← Layer 1, 2
    ↓ ↓
Layer 4 (Competitive Reading) ← Layer 1, 3
    ↓
Layer 5 (AI Discovery)  ← Layer 4
    ↓ ↓ ↓ ↓
Layer 6 (Decision Engine) ← Layer 4, 5, (2, 3)
    ↓
Layer 7 (Content & Assets) ← Layer 6
    ↓
Execution (Website, Email, Ads, Social, OTAs)
```

---

## Data Flow & Refresh Cadence

| Layer | Data Freshness | Update Frequency | Action Trigger |
|-------|---|---|---|
| **Layer 1 (Market)** | Real-time/daily | Weekly | Competitor price change, new promotion |
| **Layer 2 (Voice)** | 1–7 days | Weekly–Monthly | New reviews, sentiment shift |
| **Layer 3 (Persona)** | 30–90 days | Monthly–Quarterly | Seasonal shift, booking pattern change |
| **Layer 4 (Competitive)** | 7–30 days | Monthly | Competitor messaging refresh |
| **Layer 5 (AI Discovery)** | 7–30 days | Monthly–Quarterly | Algorithm change, content gap identified |
| **Layer 6 (Priorities)** | 30 days | Monthly | New month, new priority reset |
| **Layer 7 (Content)** | Real-time | Monthly–Weekly | Priority reset, campaign launch, seasonal event |

---

## Success Metrics by Layer

- **Layer 1–5:** Completeness and accuracy of signals captured, recency of data
- **Layer 6:** ROI scoring accuracy, correlation between priorities and actual booking uplift
- **Layer 7:** Time-to-execution, quality of generated assets, conversion lift of priority-aligned content

---

## Typical Monthly Workflow

1. **Weeks 1–2:** Refresh Layers 1–5 data and analysis
2. **Week 2:** Decision Engine (Layer 6) synthesizes signals, produces priority scorecard
3. **Week 3:** Content Engine (Layer 7) generates assets based on priorities
4. **Week 4:** Property team reviews, approves, and publishes across all channels
5. **Month 2+:** Monitor performance, refine personas and priorities based on results, repeat

