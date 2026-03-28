# Global Hotel Intelligence Platform: Exhaustive Data Source Research

> **Date:** March 28, 2026
> **Author:** AI Research Agent (Claude Opus 4.6)
> **Purpose:** Map every viable data source for Tercier AG's global hotel intelligence dataset
> **Scope:** 1.5M+ hotels, 200+ countries, targeting CHF 500M+ valuation at M48
> **Baseline:** TripAdvisor Content API (live) + Google Places API New (live)

---

## Executive Summary

This research identifies **65+ data sources** across 12 categories that could feed Tercier's global hotel intelligence platform. After exhaustive evaluation, the sources fall into 4 tiers:

### Tier 1 — Integrate Now (High value, public API, affordable)
1. **OpenStreetMap / Overpass API** — Free global hotel POI data
2. **Amadeus Hotel API** — Hotel metadata, pricing, 1.5M+ properties
3. **Fiber AI** — Contact enrichment (people + company), 4x cheaper than alternatives
4. **Apollo.io** — People/company enrichment at scale
5. **Hunter.io** — Email finding/verification
6. **GeoNames** — Geographic reference data (free)
7. **Firecrawl** — Website intelligence scraping (already in use)
8. **YouTube Data API** — Hotel video content intelligence (free)
9. **UK Food Hygiene Rating API** — Safety/quality signal (free, UK only)

### Tier 2 — Integrate in Phase 1 (High value, moderate cost/complexity)
10. **Booking.com Demand API** — Reviews, scores, 28M+ listings
11. **Expedia Rapid API** — Reviews, 700K+ properties, room-level data
12. **Foursquare Places API** — Tips, photos, check-in data
13. **SerpApi (Google Hotels)** — Real-time pricing across OTAs
14. **BuiltWith / Wappalyzer** — Hotel website tech stack detection
15. **Semrush API** — SEO/traffic intelligence per hotel domain
16. **Instagram Graph API** — Visual content, engagement metrics
17. **Switzerland Tourism API** — Swiss hotel open data
18. **Germany Open Data Tourism** — 180K+ tourism objects

### Tier 3 — Integrate in Phase 2+ (High value, enterprise pricing or partner-only)
19. **GIATA Multicodes** — Hotel mapping across 600+ suppliers
20. **TrustYou** — Meta-review scores for 500K hotels
21. **Lighthouse (OTA Insight)** — Rate intelligence, 16.4M properties
22. **STR (CoStar)** — Occupancy, ADR, RevPAR benchmarks
23. **ReviewPro (Shiji)** — 140+ review site aggregation
24. **RateGain** — Competitor pricing from 500+ demand sources
25. **AllTopHotels** — 2.3M hotel database with contacts
26. **DELTA CHECK** — 2.3M hotel database (since 1986)
27. **Hotelbeds Content API** — 300K+ hotels, rich content
28. **Crunchbase API** — Funding/ownership for hotel companies
29. **ZoomInfo** — Enterprise contact data
30. **SimilarWeb** — Website traffic analytics

### Tier 4 — Monitor / Niche Use (Limited value or access barriers)
- LinkedIn Sales Navigator, PitchBook, Orbis/BvD, D&B, Trustpilot, Pinterest, TikTok, X/Twitter, What3Words, Trivago, Kayak, Google Trends, Perplexity, UNWTO, hotel association databases

---

## A. Review & Reputation Platforms

### A1. Booking.com

**What it is:** World's largest OTA with 28M+ accommodation listings. Reviews use a 1-10 scale with category breakdowns (Staff, Facilities, Cleanliness, Comfort, Value, Location, Free WiFi).

**API availability:**
- **Demand API** (Affiliate Partners): Public application process. Provides hotel search, content, availability, reviews, and review scores. RESTful, JSON. Reviews filterable by country, language, score range, reviewer type.
- **Connectivity API** (Connectivity Partners): For property managers/channel managers. Currently paused for new registrations (terms update in progress).
- **Cost:** Free (commission-based on bookings, not data access).

**Unique data vs. TA + Google:**
- **1-10 rating scale** with 7 sub-categories (vs. TA's 1-5 with 6)
- **Reviewer type segmentation** (solo, couple, group, family — with filtering)
- **Review scores broken down by reviewer type** — "couples give 9.2, solo travelers give 7.8"
- **Booking volume proxy** — presence and review count indicate OTA market share
- **Different reviewer population** — Booking.com guests skew differently from TA users

**Integration difficulty:** Medium. Requires affiliate approval. Application not always open.

**Verdict for Tercier:** **CRITICAL — Tier 2.** Booking.com reviews represent a fundamentally different guest population than TripAdvisor. The 1-10 scale with per-segment scores is intelligence gold. The ability to see how "couples rate this 9.2 but families rate it 7.1" directly feeds Tercier's persona intelligence. Apply for affiliate access immediately.

---

### A2. Expedia Group / Rapid API

**What it is:** Second-largest OTA group (Expedia, Hotels.com, Vrbo, Orbitz). 700K+ properties. Rapid API is the unified access point.

**API availability:**
- **Rapid Lodging API**: Partner-only. Provides property content, availability, pricing, and guest reviews. Up to 100 reviews per property.
- **Guest Reviews API**: Part of Rapid API. Written reviews with ratings.
- **Cost:** Commercial terms. Commission-based. Requires partnership certification.

**Unique data vs. TA + Google:**
- **100 reviews per property** (vs. Google's 5)
- **Room-level content** — specific room types, amenities per room
- **Exclusive rates** — opaque pricing, package rates
- **Hotels.com review population** — yet another distinct guest cohort

**Integration difficulty:** Medium-High. Requires formal partnership, certification process.

**Verdict for Tercier:** **Tier 2.** Valuable as a third review source and for room-level intelligence. The certification process adds friction but the data is worth it. Pursue after Booking.com.

---

### A3. Yelp Fusion API

**What it is:** US-dominant review platform. Millions of business listings.

**API availability:**
- **Yelp Places API**: Public. Search, business details, reviews.
- **Pricing:** $7.99-$14.99 per 1,000 API calls. 30-day trial with 5,000 free calls. 30,000 calls/month included.
- **Hotel coverage:** Weak. Yelp is restaurant/retail-focused. Hotel coverage is sparse outside the US.

**Unique data vs. TA + Google:**
- Photos with captions
- "Tips" (short-form reviews)
- US-centric local business data

**Integration difficulty:** Low.

**Verdict for Tercier:** **Skip.** Hotel coverage is too thin globally. TA + Google + Booking.com cover the review space comprehensively. Only consider for US-specific enrichment in Phase 3.

---

### A4. Trustpilot

**What it is:** B2B/B2C review platform. Popular in Europe for service companies.

**API availability:**
- **Official API:** Only access your own reviews. No competitor data.
- **Enterprise ("Data Solutions"):** Gated, custom pricing, requires sales pipeline.
- **Rate limit:** 833 calls/5 min, 10,000/hr.

**Unique data vs. TA + Google:**
- Service/booking experience reviews (not stay experience)
- Chain-level reputation data (e.g., "Marriott" as a brand)

**Integration difficulty:** High (enterprise-only for useful data).

**Verdict for Tercier:** **Skip.** Trustpilot reviews are about booking platforms, not individual hotels. Not relevant for per-property intelligence.

---

### A5. TrustYou

**What it is:** Hotel-specific meta-review platform. Aggregates reviews from 100+ sources into a single score. Data displayed on Google, Kayak, Hotels.com, Skyscanner.

**API availability:**
- **Meta-Review API:** Available. Flat file download from S3 or API access.
- **Coverage:** 500,000 hotels worldwide.
- **CXP Platform:** Full reputation management with APIs to PMS, CRM, BI systems.

**Unique data vs. TA + Google:**
- **Aggregated meta-score** across ALL review platforms (not just one)
- **Semantic analysis** — topic-level sentiment (e.g., "breakfast: 87% positive")
- **GRI (Global Review Index)** — industry-standard reputation score
- **Competitive Quality Index (CQI)** — benchmarking vs. compset

**Integration difficulty:** Medium. Requires commercial agreement.

**Verdict for Tercier:** **Tier 3.** The meta-review aggregation is genuinely valuable — it saves Tercier from having to aggregate across platforms. The GRI and CQI are industry-recognized metrics. Explore partnership once the dataset is at scale. Could be a data partner rather than competitor.

---

### A6. ReviewPro (Shiji Group)

**What it is:** Enterprise hotel reputation management. Aggregates from 140+ review sites.

**API availability:**
- **ReviewPro API:** Available to hotel clients. Provides GRI, department indexes, demographic data.
- **Developer Network:** developer.reviewpro.com
- **Access:** Enterprise SaaS. Hotels subscribe, then can API their own data.

**Unique data vs. TA + Google:**
- **140+ review source aggregation** (broadest coverage)
- **Department-level indexes** (rooms, F&B, spa, front desk)
- **AI-powered response generation**
- **Multilingual sentiment analysis**
- **Post-stay survey data** (first-party)

**Integration difficulty:** High. This is a B2B SaaS product, not a data API.

**Verdict for Tercier:** **Tier 3 / Partnership.** ReviewPro is a potential competitor AND potential data partner. Their 140-source aggregation is unmatched. Consider: could Tercier license ReviewPro's aggregated scores? Or is it better to build this capability internally with TA + Google + Booking.com?

---

## B. OTA & Distribution APIs

### B1. Amadeus Hotel APIs

**What it is:** Global Distribution System (GDS) with 1.5M+ hotel properties. Self-service API platform for developers.

**API availability:**
- **Hotel List API:** Search by city code, geocode, or hotel ID. **FREE in test environment.**
- **Hotel Search API:** Real-time availability and pricing.
- **Hotel Booking API:** Full booking flow.
- **Content API:** Hotel metadata, amenities, images.
- **Pricing:** Free test sandbox. Pay-per-use in production. Subscription option for high volume.

**Unique data vs. TA + Google:**
- **Real-time room pricing** — actual rates, not estimates
- **Room-level details** — room types, bed configurations, policies
- **Cancellation policies** — flexibility intelligence
- **GDS chain codes** — standardized chain/brand identification
- **1.5M+ properties** — massive coverage

**Integration difficulty:** Low-Medium. Self-service sign-up, good documentation.

**Verdict for Tercier:** **Tier 1 — HIGH PRIORITY.** Amadeus provides real-time pricing data that neither TA nor Google offers reliably. The Hotel List API can validate/augment Tercier's hotel inventory. Room-level intelligence (types, configurations, policies) feeds directly into Tercier's product layers. The free test environment allows immediate prototyping.

---

### B2. Sabre Hospitality

**What it is:** Major GDS. Hotel content, availability, booking APIs.

**API availability:**
- **Hotel Content API, Hotel List, Hotel Avail V2:** Developer portal at developer.sabre.com.
- **Access:** Developer registration required. Production requires commercial agreement.

**Unique data vs. TA + Google:**
- Alternative hotel inventory to cross-reference
- Chain property data
- Real-time rates and availability

**Integration difficulty:** Medium-High.

**Verdict for Tercier:** **Tier 3.** Redundant with Amadeus for most use cases. Consider only if Amadeus coverage gaps emerge.

---

### B3. Travelport

**What it is:** Third major GDS. 650,000 hotel properties.

**API availability:**
- **Universal API:** Hotel search, availability, booking.
- **JSON Hotel APIs:** Modern REST interface.
- **Cost:** Setup $4,000-$5,000 + annual fees + per-transaction costs.

**Unique data:** Similar to Amadeus/Sabre. Smaller coverage.

**Verdict for Tercier:** **Skip for now.** Amadeus alone covers the GDS need.

---

### B4. Hotelbeds Content API

**What it is:** B2B hotel wholesaler. 300,000+ hotels in 170+ countries.

**API availability:**
- **Content API:** Hotel metadata, images, descriptions, facilities, services. Static content.
- **Booking API:** Dynamic pricing, availability.
- **Access:** Partner registration at developer.hotelbeds.com.

**Unique data vs. TA + Google:**
- **Hotel tags** — "best for beach," "luxury," "sightseeing"
- **Detailed facility/service inventory**
- **300K hotel content profiles**

**Integration difficulty:** Medium. Partner registration required.

**Verdict for Tercier:** **Tier 3.** Useful for enrichment but overlaps significantly with TA + Google + Amadeus.

---

### B5. Agoda

**What it is:** Booking Holdings subsidiary. Strong in Asia-Pacific.

**API availability:**
- **Search API, Content API, Book API:** Partner portal at partners.agoda.com.
- **Access:** Affiliate/partner program. Application required.

**Unique data:** APAC hotel inventory and reviews. Useful for Phase 2+ when expanding to Asia.

**Verdict for Tercier:** **Tier 3.** Asia-specific enrichment. Not needed until Phase 2.

---

## C. People & Contact Intelligence

### C1. Fiber AI

**What it is:** YC-backed (batch W24) data API platform. 40M+ companies, 850M+ people, 30M+ jobs. Claims 4x cheaper than Clay, better search than LinkedIn.

**API availability:**
- **Public API:** api.fiber.ai/docs/
- **Endpoints:** Company enrichment (firmographics, headcount, funding, revenue, technographics), People data (contact discovery, enrichment), Email/phone finding and verification, Reverse email lookup, Real-time LinkedIn data, Jobs data, Bulk search.
- **Partial/incomplete search:** Can find people even with noisy/fragmented inputs — ideal for hotel GM discovery.

**Unique data vs. TA + Google:**
- **Hotel GM/decision-maker contacts** — name, email, phone, LinkedIn
- **Company firmographics** — headcount, revenue estimates, funding
- **Job postings** — hiring signals (hotel expanding = buying signal)
- **Technographics** — what software the hotel uses

**Integration difficulty:** Low. REST API, well-documented.

**Verdict for Tercier:** **Tier 1 — HIGH PRIORITY.** This solves Tercier's contact enrichment problem at scale. Currently at 420/2,069 resolved for Swiss hotels. Fiber AI's partial search capability (name + company = contact) could dramatically improve resolution rates. The firmographic data (headcount, revenue) enriches the hotel profile. Job postings = buying signals for sales. **Test immediately against the 1,649 unresolved Swiss hotels.**

---

### C2. Apollo.io

**What it is:** Sales intelligence platform. 275M+ contacts, 73M+ companies.

**API availability:**
- **Public API:** Included with all plans. People enrichment, company enrichment, contact search.
- **Pricing:** Free plan available. Professional at ~$49/user/month. 1 email = 1 credit. 1 phone = 5 credits. Additional credits $0.20 each.
- **Rate limits:** Vary by plan.

**Unique data vs. TA + Google:**
- **GM/decision-maker contacts** with verified emails
- **Company data** — industry, revenue, employee count
- **Intent data** — companies actively researching solutions

**Integration difficulty:** Low. Well-documented REST API.

**Verdict for Tercier:** **Tier 1.** Complementary to Fiber AI. Use as a fallback/waterfall enrichment source. The free tier allows testing. Intent data could identify hotels actively shopping for marketing solutions.

---

### C3. Hunter.io

**What it is:** Email finding and verification service.

**API availability:**
- **Public API:** Email Finder, Domain Search, Email Verifier.
- **Pricing:** Starter $34/mo (2,000 credits). Scale plans from $104/mo.
- **Bulk operations:** Domain Search returns all emails for a domain.

**Unique data vs. TA + Google:**
- **All email addresses at a hotel domain** — not just GM
- **Email pattern detection** — "firstname@hotel.com" vs "f.lastname@hotel.com"
- **Verification** — deliverability confirmation

**Integration difficulty:** Very Low. Simple REST API.

**Verdict for Tercier:** **Tier 1.** Perfect complement to Fiber/Apollo. Use Hunter's Domain Search to find ALL contacts at a hotel domain, then use Fiber/Apollo to identify which is the GM/decision-maker. Email verification before outreach prevents bounce damage.

---

### C4. Clearbit / Breeze Intelligence (HubSpot)

**What it is:** Company and contact enrichment. Now part of HubSpot.

**API availability:**
- **Requires HubSpot subscription.** Minimum $75/month. 100 credits = $45/mo.
- **1 enrichment = 10 HubSpot Credits** (since June 2025).
- **No free trial.** Credits don't roll over.

**Unique data:** Company enrichment (industry, tech stack, revenue, employee count).

**Verdict for Tercier:** **Skip.** Too expensive for scale. Fiber AI and Apollo provide the same data at lower cost without requiring HubSpot lock-in.

---

### C5. ZoomInfo

**What it is:** Enterprise B2B data platform. Largest contact database.

**API availability:**
- **Enterprise pricing:** Starts at $14,995/year. Most teams pay $30K-$60K.
- **API access:** Starts at $5,000-$50,000/year depending on tier.

**Unique data:** Most comprehensive contact database. Intent data. Org charts.

**Verdict for Tercier:** **Tier 3.** Too expensive for a startup. Revisit when Tercier has revenue and needs enterprise-grade sales intelligence.

---

### C6. Lusha

**What it is:** B2B contact enrichment. Pro starts at $29.90/mo.

**API availability:** Scale plan (custom pricing) for API access. Credit-based (1 email = 1 credit, 1 phone = 5 credits).

**Verdict for Tercier:** **Skip.** Redundant with Fiber/Apollo/Hunter waterfall. No unique advantage.

---

### C7. RocketReach

**What it is:** 700M+ professional profiles. Email and phone lookup.

**API availability:** Ultimate plan ($207/mo) includes API. 10,000 lookups/year. Enterprise from $3,000.

**Verdict for Tercier:** **Skip for now.** Fiber AI is cheaper and has comparable coverage.

---

### C8. Snov.io

**What it is:** Email finder + outreach automation.

**API availability:** Plus plan $149/mo. Email Finder and Verifier APIs. Bulk search up to 10 per request.

**Verdict for Tercier:** **Skip.** Overlaps with Hunter.io. Not worth adding a fourth enrichment source initially.

---

### C9. Dropcontact

**What it is:** B2B email finder. 100% GDPR compliant (EU servers, proprietary algorithms, no third-party data).

**API availability:**
- **Public API:** developer.dropcontact.com
- **Pricing:** From EUR 24/mo for 1,000 credits. Free plan: 25 credits/mo.
- **GDPR:** Full compliance — no personal data stored or resold.

**Unique data:** **GDPR compliance is the differentiator.** For a Swiss AG selling to European hotels, GDPR-compliant contact sourcing is not optional.

**Verdict for Tercier:** **Tier 2.** Add to the enrichment waterfall specifically for European contacts. Swiss/EU regulatory compliance matters for Tercier's sales process. Use Dropcontact as the GDPR-compliant layer, Fiber/Apollo for broader coverage.

---

### C10. LinkedIn Sales Navigator

**What it is:** The gold standard for B2B prospecting.

**API availability:**
- **SNAP (Sales Navigator Application Platform):** Paused for new partner applications indefinitely (as of Aug 2025).
- **No self-serve API.** Only available to large CRM vendors (Salesforce, HubSpot, Dynamics).
- **Manual use:** Sales Navigator is available as a subscription ($80-$150/mo per user).

**Verdict for Tercier:** **Tier 4 / Manual.** No API access possible. Use manually for high-value prospect research. Fiber AI provides "real-time LinkedIn data" as an alternative.

---

## D. Company & Business Intelligence

### D1. Crunchbase API

**What it is:** Private company data. Funding rounds, acquisitions, investors, executives.

**API availability:**
- **Enterprise:** $50,000+/year for API access. 200 calls/min.
- **Pro:** $99/user/month (no API).
- **Starter:** $29/user/month (basic data).

**Unique data vs. TA + Google:**
- **Hotel company ownership** — who owns this independent hotel? Is it PE-backed?
- **Funding signals** — recently funded hotel groups = expansion = buying signal
- **Executive profiles** — decision-maker identification
- **Acquisition history** — brand changes, ownership transitions

**Verdict for Tercier:** **Tier 3.** Valuable for identifying PE-backed hotel groups and recently funded hospitality companies. Too expensive for API at startup stage. Use manual Crunchbase Pro access for high-value prospects.

---

### D2. OpenCorporates

**What it is:** Largest open database of company data. 170+ jurisdictions.

**API availability:**
- **Free for public benefit.** (Journalists, NGOs, academics.)
- **Commercial:** From GBP 2,250/year (Essentials) to GBP 12,000/year (Basic).

**Unique data:**
- **Legal entity verification** — is this hotel company actually registered?
- **Ownership chains** — parent companies, subsidiaries
- **Registration status** — active, dissolved, in liquidation

**Verdict for Tercier:** **Tier 3.** Useful for verifying hotel company legal status and ownership, especially for enterprise sales. Consider for Phase 2 when selling to larger groups.

---

### D3. PitchBook

**What it is:** Comprehensive private market data. 3M+ companies, 660K+ private.

**API availability:** Enterprise pricing only. RESTful API with JSON.

**Verdict for Tercier:** **Tier 4.** Overkill for hotel intelligence. Only relevant if Tercier needs to track PE/VC activity in hospitality sector.

---

### D4. Orbis / Bureau van Dijk (Moody's)

**What it is:** 600M+ companies globally. Financial data, ownership, risk ratings.

**API availability:** Enterprise only. Custom pricing. Pull via web interface, API, bulk feed, or cloud.

**Verdict for Tercier:** **Tier 4.** Enterprise-grade company intelligence. Not needed until Tercier is selling to hotel groups with complex corporate structures.

---

### D5. Dun & Bradstreet

**What it is:** 600M+ business records. Credit ratings, risk scores, DUNS numbers.

**API availability:** Custom enterprise pricing. D&B Direct API.

**Verdict for Tercier:** **Tier 4.** Only relevant for credit risk assessment of hotel clients. Not a priority for intelligence dataset.

---

## E. Website Intelligence & Scraping

### E1. Firecrawl

**What it is:** Web data API for AI. Scrapes, crawls, extracts structured data. Already in Tercier's toolchain.

**API availability:**
- **Public API:** firecrawl.dev
- **Pricing:** Free 500 pages. $16/mo for 3,000. $83/mo for 100,000. JS rendering, proxy rotation, CAPTCHA solving included.
- **Capabilities:** Scrape (single page), Crawl (entire domain), Search (web search + scrape), Interact (click/type/extract), Extract (AI-powered structured extraction).

**Unique data vs. TA + Google:**
- **Full website content** — positioning, messaging, target audience
- **Booking flow analysis** — native vs. embedded vs. OTA redirect
- **Tech stack signals** — CMS, booking engine, analytics
- **Price extraction** — rack rates from hotel websites
- **Content freshness** — when was the site last updated?

**Verdict for Tercier:** **Tier 1 — Already in use.** Expand usage. Use Firecrawl's /extract endpoint for structured data extraction from hotel websites: positioning pillars, market segment, audience signals, booking flow type. At $0.00083/page on the Standard plan, crawling 2,069 Swiss hotel websites = ~$2.

---

### E2. BuiltWith

**What it is:** Website technology profiler. Tracks 5,000+ technologies.

**API availability:**
- **Domain API:** JSON/XML access to technology data per website.
- **Lists API:** Find websites using specific technologies.
- **Free API:** 1 request/second, limited data.
- **Pro plan:** $495/month.

**Unique data vs. TA + Google:**
- **Booking engine identification** — Booking.com widget? SiteMinder? Cloudbeds? Direct?
- **CMS platform** — WordPress, custom, Wix
- **Analytics tools** — Google Analytics, Hotjar, etc.
- **Marketing stack** — email platform, CRM, chat widgets
- **Payment processors** — Stripe, PayPal, etc.

**Verdict for Tercier:** **Tier 2.** Hotel tech stack = actionable intelligence. A hotel using SiteMinder has different needs than one on a custom CMS. The Lists API can identify all hotels using a specific booking engine. Consider the cheaper alternative Wappalyzer first.

---

### E3. Wappalyzer

**What it is:** Website technology detection. Lighter/cheaper than BuiltWith.

**API availability:**
- **Public API:** Technology lookup, company details, emails, social profiles.
- **Pricing:** Free 50 lookups/month. Pro $250/mo. Business $450/mo.
- **1 credit = 1 website lookup.**

**Unique data:** Same as BuiltWith but also includes verified email addresses, phone numbers, social profiles, locale info, keywords, and metadata.

**Verdict for Tercier:** **Tier 2.** Better value than BuiltWith for Tercier's needs. The additional company data (emails, social, metadata) enriches the hotel profile. At $250/mo for Pro, it's half the cost of BuiltWith.

---

### E4. SimilarWeb

**What it is:** Website traffic analytics. Estimated visits, sources, engagement.

**API availability:**
- **API:** Standalone or within Business plan. Custom pricing via sales team.
- **Plans:** From $15,000-$150,000+/year depending on modules and usage.

**Unique data vs. TA + Google:**
- **Website traffic estimates** — monthly visits, bounce rate, time on site
- **Traffic sources** — organic, paid, social, direct, referral
- **Geographic distribution** — where visitors come from
- **Competitive benchmarking** — vs. competitor hotel websites

**Verdict for Tercier:** **Tier 3.** Expensive for a startup, but website traffic is a powerful intelligence signal. A hotel getting 50K monthly visits vs. 500 tells you about their digital maturity. Consider in Phase 2 or explore cheaper alternatives (Semrush includes some traffic data).

---

### E5. Archive.org Wayback Machine

**What it is:** Historical snapshots of websites. Free APIs.

**API availability:**
- **Availability API:** Check if a URL is archived. Free.
- **CDX API:** Complex querying of capture data. Free.
- **SavePageNow:** Archive a page. Free.

**Unique data vs. TA + Google:**
- **Website evolution** — how the hotel's positioning has changed over time
- **Historical pricing** — archived rate pages
- **Brand changes** — name/brand evolution
- **Content freshness baseline** — when was the site last significantly updated?

**Verdict for Tercier:** **Tier 4 / Niche.** Interesting for competitive analysis and detecting "stale" hotel websites (hasn't changed in 3 years = opportunity signal). Low priority but free and easy to query.

---

## F. Social Media & Content

### F1. Instagram Graph API

**What it is:** Official Instagram API for business/creator accounts.

**API availability:**
- **Free.** Requires Meta Developer account + Facebook Page connection.
- **Data:** Posts, stories, engagement (likes, comments, saves, impressions, reach), hashtags, mentions.
- **Limitation:** Only for Business/Creator accounts connected to a Facebook Page. Cannot access competitors' data without their permission.

**Unique data vs. TA + Google:**
- **Visual content quality** — professional vs. amateur photography
- **Engagement metrics** — likes, comments per post
- **Guest-generated content** — tagged photos, mentions
- **Posting frequency** — content marketing activity level
- **Hashtag strategy** — what the hotel promotes

**Verdict for Tercier:** **Tier 2 / Scrape approach.** The official API only lets you access accounts you own/manage. For competitive intelligence, use Firecrawl or a social scraping service to assess Instagram presence (follower count, post frequency, engagement rates) without API access.

---

### F2. Facebook Pages API

**What it is:** Access to Facebook Page data, reviews, and engagement.

**API availability:**
- **Marketing API:** Manage ads, catalogs (including hotel catalogs).
- **Pages API:** Page metrics, reviews, posts.
- **Limitation:** Same as Instagram — only your own pages.

**Unique data:** Facebook reviews (separate from TA/Google), page engagement, check-ins.

**Verdict for Tercier:** **Tier 4.** Facebook reviews are declining in importance for hotels. Focus on TA + Google + Booking.com for review intelligence.

---

### F3. YouTube Data API

**What it is:** Access to YouTube channel and video data. Free with quota limits.

**API availability:**
- **Free.** 10,000 quota units/day. 1 unit per read, 100 per search.
- **Data:** Channel statistics (subscribers, views, video count), video metadata, comments.

**Unique data vs. TA + Google:**
- **Hotel video content** — property tours, room walkthroughs
- **View counts** — content reach indicator
- **Comment sentiment** — guest reactions to video content
- **Content marketing maturity** — does the hotel invest in video?

**Verdict for Tercier:** **Tier 1 (free).** Quick win. Search "hotel name + city" on YouTube, check if the hotel has an official channel, count videos and views. This is a digital presence indicator. Hotels with active YouTube channels are more digitally mature (different sales approach than those without).

---

### F4. X/Twitter API

**What it is:** Social listening platform. Hotel mentions, brand monitoring.

**API availability:**
- **Free:** Write-only.
- **Basic:** $200/mo, 15,000 tweets/month read.
- **Pro:** $5,000/mo.
- **Enterprise:** $42,000+/mo.

**Verdict for Tercier:** **Skip.** Too expensive for limited hotel intelligence. Hotels don't generate meaningful X engagement compared to TA/Google/Instagram.

---

### F5. TikTok API

**What it is:** Short-form video platform. Travel content is massive on TikTok.

**API availability:**
- **Business API:** For advertisers. Hotel catalog support with Travel Ads.
- **Commercial Content API:** Public, for researchers.
- **Limitation:** No public API for competitor analysis.

**Verdict for Tercier:** **Tier 4 / Monitor.** TikTok is increasingly important for hotel discovery (especially luxury/lifestyle), but there's no way to programmatically assess a hotel's TikTok presence via API. Use Firecrawl to scrape TikTok profile data if needed.

---

### F6. Pinterest API

**What it is:** Visual discovery platform. Hotel content (room design, destinations).

**API availability:** v5 API. Developer application required. Supports hotel catalog items with guest_ratings.

**Verdict for Tercier:** **Tier 4.** Niche. Pinterest matters for some boutique/design hotels but not enough for systematic intelligence.

---

## G. SEO & Search Intelligence

### G1. Semrush API

**What it is:** SEO toolkit. Domain analytics, keyword research, backlinks, competitive analysis, traffic estimates.

**API availability:**
- **Business plan required:** $499.95/month minimum.
- **API units:** ~$50 per million. Historical data burns units 5-10x faster.
- **Trends API:** Traffic summaries, visitor behavior, demographics.

**Unique data vs. TA + Google:**
- **Organic search visibility** — how well does the hotel rank on Google?
- **Keyword rankings** — what hotel-related queries does the domain rank for?
- **Backlink profile** — domain authority, referring domains
- **Traffic estimates** — monthly organic + paid traffic
- **Competitor analysis** — which hotels compete for the same keywords?
- **Advertising spend** — is the hotel running Google Ads?

**Verdict for Tercier:** **Tier 2.** SEO intelligence directly feeds Tercier's "AI Discovery" layer. Knowing that a hotel ranks #1 for "luxury hotel Zurich" vs. not appearing at all is critical intelligence for both the product (SEO optimization deliverable) and sales ("you're invisible on Google — we can fix that"). The $500/mo cost is justified once Tercier has revenue.

---

### G2. Ahrefs API

**What it is:** SEO/backlink analysis. Best backlink database in the industry.

**API availability:**
- **Enterprise only:** $1,499/month minimum with annual commitment.
- **Backlink data:** Largest index, 15-30 minute refresh.
- **Overage:** $0.35-$1.00 per 1,000 rows.

**Unique data:** Best-in-class backlink intelligence. Domain Rating metric.

**Verdict for Tercier:** **Tier 3.** More expensive than Semrush with overlapping capabilities. Semrush alone is sufficient for hotel SEO intelligence. Consider Ahrefs only if backlink analysis becomes a core product feature.

---

### G3. Moz API

**What it is:** Domain Authority (DA) and Page Authority (PA) metrics. Industry-standard.

**API availability:**
- **Free tier:** 1 req/10 sec, 50 rows/month.
- **Paid:** From $20/month (limited) to $250+/month.
- **Metrics:** Domain Authority, Page Authority, Brand Authority, Spam Score.

**Unique data:** The DA score is universally understood in SEO. Simple, lightweight.

**Verdict for Tercier:** **Tier 2.** Add Domain Authority as a single field per hotel website. It's cheap ($20/mo for light usage), the free tier covers testing, and DA is a widely understood metric. Use Moz for DA + Semrush for deeper SEO analysis.

---

### G4. Sistrix API

**What it is:** SEO visibility tool. Very strong in European markets (Germany, UK, France, Spain, Italy).

**API availability:**
- **Professional plan:** EUR 419/month includes API access.
- **Weekly credit allocation.** Additional credits: 10,000 for EUR 75.

**Unique data:** **Visibility Index** — Sistrix's proprietary metric is the standard in European SEO. Hotels selling to European guests need European search visibility.

**Verdict for Tercier:** **Tier 3.** Consider as a Semrush alternative for European-focused SEO intelligence. The Visibility Index is more relevant for European markets than Semrush's global metrics. But at EUR 419/mo on top of Semrush, it's likely redundant.

---

### G5. Google Search Console API

**What it is:** First-party Google search performance data.

**API availability:**
- **Free.** Requires verified site ownership.
- **Data:** Search queries, impressions, clicks, CTR, position, by page, country, device.
- **Limitation:** Only for sites you own/manage.

**Unique data:** The ONLY source of actual Google search performance data.

**Verdict for Tercier:** **Tier 2 — Product feature.** Once a hotel becomes a Tercier client, connect their GSC to provide actual search performance data. This transforms Tercier from "we estimate your SEO" to "we MEASURE your SEO." Not useful for the dataset (requires site ownership), but critical for the product.

---

### G6. Google Trends

**What it is:** Search interest trends over time and by geography.

**API availability:**
- **Official API:** Alpha stage, very limited access (apply to be tester).
- **Unofficial:** PyTrends (Python), SerpApi, SearchAPI.io.

**Unique data:**
- **Demand seasonality** — when do people search for "hotels in Zurich"?
- **Destination trends** — rising/falling destinations
- **Brand interest** — search volume for specific hotel brands
- **Competitive interest** — which hotels are searched more?

**Verdict for Tercier:** **Tier 2.** Demand intelligence. Knowing that "luxury hotels Maldives" peaks in November while "hotels Zurich" peaks in June-August = seasonal intelligence for hotel clients. Use PyTrends for now, apply for official alpha.

---

## H. Hotel-Specific Data Sources

### H1. STR (Smith Travel Research / CoStar)

**What it is:** THE industry standard for hotel performance benchmarking. Owned by CoStar Group ($450M acquisition).

**Data available:**
- **94,000 hotels, 12M rooms** in sample
- **KPIs:** Occupancy rate, ADR (Average Daily Rate), RevPAR (Revenue Per Available Room)
- **Benchmarking:** Performance vs. competitive set, market, submarket
- **Access:** Web dashboard + reports. No public API found.
- **Pricing:** Subscription. Per-property. Hotels subscribe and submit their data.

**Unique data vs. TA + Google:**
- **Occupancy rates** — the #1 metric hotels care about
- **ADR / RevPAR** — actual revenue performance, not estimates
- **Market-level performance** — how is the Zurich market doing?
- **Competitive benchmarking** — am I outperforming my comp set?

**Verdict for Tercier:** **Tier 3 — Strategic.** STR data is the holy grail of hotel intelligence. But it's not available via API, it's expensive, and it requires hotels to opt in. Tercier's approach should be: (1) build demand proxies from public data (review volume trends, price tracking from Amadeus/SerpApi), and (2) eventually partner with STR or license data. STR could also be a **competitor** if they expand into the marketing intelligence space.

---

### H2. GIATA Multicodes

**What it is:** Global hotel mapping standard. 600+ supplier integrations. Maps hotel IDs across all OTAs and GDS systems.

**Data available:**
- **Hotel mapping:** "Baur au Lac" on Booking.com = ID 123, on Expedia = ID 456, on TA = 196060
- **Hotel content:** Descriptions in 25 languages, images, amenities
- **Coverage:** Claims 99.998% mapping accuracy
- **Access:** Commercial agreement required. API/XML access.

**Unique data vs. TA + Google:**
- **Cross-platform ID mapping** — link a hotel across ALL platforms with a single GIATA code
- **Multilingual descriptions** — 25 languages
- **Deduplication** — resolve the same hotel across different sources

**Verdict for Tercier:** **Tier 3 — Strategic.** GIATA's cross-platform mapping is exactly what Tercier needs at scale. When matching TA location_id to Google place_id to Booking.com hotel_id, GIATA has already solved this problem for 600+ suppliers. The question is cost. Explore partnership — Tercier's dataset could be valuable TO GIATA as well.

---

### H3. Lighthouse (formerly OTA Insight)

**What it is:** Rate intelligence platform. 70,000+ hotels in 185 countries.

**Data available:**
- **1.7 billion data points/day** from 16.4 million hotels and short-term rentals
- **Competitor rates** — what nearby hotels charge on every OTA
- **Rate parity** — is the hotel's direct rate competitive?
- **Demand forecasting** — market demand indicators
- **Reputation data** — review scores across platforms
- **Access:** SaaS subscription. API available. Custom pricing.

**Unique data vs. TA + Google:**
- **Real-time competitive pricing** across ALL OTAs
- **Rate parity analysis** — is the hotel losing margin to OTA undercutting?
- **Occupancy and demand forecasts**
- **Event impact** — how local events affect demand

**Verdict for Tercier:** **Tier 3.** Lighthouse's rate intelligence is the best in the industry. Too expensive for Tercier to license at startup stage. Build basic price intelligence using Amadeus + SerpApi first. Consider Lighthouse partnership/integration once Tercier has paying hotel clients who already subscribe to Lighthouse.

---

### H4. RateGain

**What it is:** Competitor price intelligence. 500+ demand sources tracked.

**Data available:**
- **Rate shopping** from OTAs, CUG rates, promotional rates
- **Review/reputation data** (separate product)
- **Event data** and demand signals
- **Pricing:** Starts at $85/month.

**Verdict for Tercier:** **Tier 3.** More affordable than Lighthouse. Could be useful for Phase 1 price intelligence, but $85/property/month doesn't scale. Build own price tracking first.

---

### H5. AllTopHotels (ATH)

**What it is:** Global hotel database with daily-updated data from 100+ sources.

**Data available:**
- **Hotel profiles:** Rooms, stars, ADR, chains, independent status, contacts
- **Daily updates:** 100,000+ hotels checked daily using AI + deep web tech
- **CRM integration:** API for search, update, sync, enrich
- **Unique hotel IDs** with PrimaryKey mapping
- **Coverage:** Global (Europe, Americas, APAC, Oceania, LATAM)
- **Pricing:** Monthly/yearly. Varies by region and license tier.

**Unique data vs. TA + Google:**
- **Hotel contacts** — GM names, emails (pre-verified)
- **ADR estimates** — average daily rate intelligence
- **Chain/independent classification** — standardized
- **Room counts** — actual room inventory
- **Star ratings** — official local classification

**Verdict for Tercier:** **Tier 3 — EVALUATE IMMEDIATELY.** ATH could be a shortcut for Tercier's contact enrichment problem AND provide room counts and ADR estimates that neither TA nor Google offers. The daily update frequency is impressive. The question is: how does ATH's data quality compare to what Tercier builds from TA + Google + enrichment? Request a sample and compare.

---

### H6. DELTA CHECK (GARD Database)

**What it is:** 2.3M hotels worldwide. Since 1986. Scientific approach to hotel enumeration.

**Data available:**
- **2.3 million hotels** — possibly the most comprehensive count
- **5,200 hotel chains, cooperations & brands**
- **Started 1986** — 40 years of data collection
- **Access:** Commercial licensing.

**Verdict for Tercier:** **Tier 3 — Cross-reference.** Useful for validating Tercier's hotel count against an independent source. 2.3M hotels confirms the TAM. Could license for Phase 3 to ensure no gaps.

---

### H7. Vervotech

**What it is:** AI hotel mapping. 99.999% accuracy across 400+ suppliers.

**Data available:**
- **Hotel mapping** across 400+ pre-integrated suppliers
- **Room mapping** — match room types across platforms
- **Master data** — unified hotel content
- **Part of Constellation Software (CSI)**

**Verdict for Tercier:** **Tier 3.** Alternative to GIATA for cross-platform mapping. Evaluate if GIATA relationship doesn't work out.

---

### H8. Hotel Association Databases

**Already have:** hotelleriesuisse (2,069 hotels, Switzerland)

**Other associations:**
- **DEHOGA** (Germany): 65,000 members, 222,000 companies. No public API. Contact directly for member data.
- **HOTREC** (European umbrella): 47 associations from 36 countries. Policy body, not a data provider.
- **AHLA** (USA): 32,000 members. Allied Member Directory searchable. No API.
- **Hotelstars Union** (Europe): Created under HOTREC patronage. Standardized star classification criteria.

**Verdict:** **Tier 3.** Each national association is a potential data source (official star ratings, room counts, member lists). Approach individually for Phase 1 (European expansion). hotelleriesuisse is the model — replicate for DEHOGA (Germany), Federalberghi (Italy), UMIH (France), etc.

---

### H9. Sustainability Certifications

**Key programs:**
- **Green Key:** Leading eco-certification for tourism. Global.
- **EarthCheck:** Science-based benchmarking. 70,000+ buildings. Since 1987.
- **LEED:** Building certification (some hotels).
- **Green Globe:** Travel & tourism specific.
- **EU Ecolabel:** European standard.

**API availability:** None of these have public APIs. Data must be scraped from their websites or obtained via partnership.

**Unique data:** Sustainability certification = increasingly important guest filter AND hotel differentiator.

**Verdict for Tercier:** **Tier 2.** Scrape certification directories (Green Key's member list, EarthCheck's certified properties) using Firecrawl. Add `sustainability_certifications` field to the schema. This is a growing intelligence dimension — hotels want to market their certifications, and guests filter by them.

---

## I. Geographic & Location Data

### I1. OpenStreetMap / Overpass API

**What it is:** Free, open geographic database. Crowd-sourced. Global.

**API availability:**
- **Overpass API:** Free. No API key needed. Query using Overpass QL.
- **Query for hotels:** `[out:json]; nwr["tourism"="hotel"](bbox); out geom;`
- **Rate limit:** Moderate. 10,000 credits/day free.
- **Data format:** JSON, XML.

**Unique data vs. TA + Google:**
- **Free hotel POI data** — name, lat/lng, address, website, phone
- **Additional tags:** rooms, stars, internet_access, wheelchair, smoking, cuisine (for hotel restaurants)
- **Building footprints** — actual hotel building shape
- **Nearby POI context** — restaurants, attractions, transport within radius
- **Community edits** — often updated by hotel staff or local contributors

**Verdict for Tercier:** **Tier 1 — FREE.** Use OSM as a third cross-reference for hotel discovery. Query all hotels within city bounding boxes, match against TA + Google inventory. OSM often has hotels that are missing from TA or Google. The building footprint data is unique. Additional tags (rooms, stars, wheelchair) supplement other sources at zero cost.

---

### I2. Foursquare Places API

**What it is:** POI data platform. 170M+ POIs. Formerly the social check-in app.

**API availability:**
- **Public API:** Pro and Premium endpoints.
- **Free tier:** 10,000 Pro calls/month.
- **Pricing:** $0.015/call (Pro), $0.01875/call (Premium for tips, photos, hours, ratings).
- **Data:** Place search, details, tips, photos, hours, ratings, categories.

**Unique data vs. TA + Google:**
- **Tips** — short user comments (different from reviews)
- **Check-in data** — popularity by time of day/week
- **Category taxonomy** — detailed hospitality sub-types
- **Popularity scores** — footfall-based, not just reviews

**Verdict for Tercier:** **Tier 2.** The free 10,000 calls/month is enough for Phase 0 testing. Foursquare's popularity scores (based on actual check-in/location data) provide a footfall-based demand signal that reviews don't capture. Tips are a lighter-weight content source than full reviews.

---

### I3. HERE Places API

**What it is:** Nokia's mapping platform. Enterprise geocoding and POI data.

**API availability:**
- **Free tier available.** Transaction-based pricing.
- **New pricing:** 6% increase from April 1, 2026.

**Unique data:** Alternative geocoding source. Good for address normalization.

**Verdict for Tercier:** **Tier 4.** Google + OSM already cover geocoding and POI needs. HERE adds no unique hotel intelligence.

---

### I4. GeoNames

**What it is:** 11M+ placenames. Free. Global geographic reference.

**API availability:**
- **Free.** 10,000 credits/day, 1,000/hour. CC-BY license.
- **40 web services.** Cities, populated places, elevation, timezone, weather.

**Unique data vs. TA + Google:**
- **Administrative hierarchy** — standardized country > region > city > district
- **Population data** — city population (useful for market sizing)
- **Timezone lookups**
- **Elevation data**
- **Alternate names** in multiple languages

**Verdict for Tercier:** **Tier 1 — FREE.** Use GeoNames as the geographic reference backbone. Standardize all city/country/region names to GeoNames IDs. Population data helps prioritize cities for discovery. Already have this data pattern from TA ancestors, but GeoNames provides the canonical reference.

---

### I5. Mapbox

**What it is:** Map platform with POI search.

**API availability:**
- **Free:** 100,000 geocoding requests/month.
- **POI search:** Via Search Box API (separate from Geocoding).
- **Pricing:** $0.75/1,000 temporary, $5/1,000 permanent geocoding.

**Verdict for Tercier:** **Skip.** Google + OSM cover geocoding. Mapbox adds no unique hotel data.

---

### I6. What3Words

**What it is:** Precision location system (3-word addresses).

**API availability:** Free for small businesses. Less than GBP 0.005 per lookup.

**Verdict for Tercier:** **Skip.** No hotel intelligence value. Lat/lng from TA + Google is sufficient.

---

## J. Pricing & Revenue Intelligence

### J1. SerpApi (Google Hotels)

**What it is:** Structured API for Google Hotels search results. Real-time hotel pricing from Google's metasearch.

**API availability:**
- **Public API:** serpapi.com. 250 free searches/month.
- **Pricing:** From $50/month (5,000 searches) to $250/month (30,000).
- **Data:** Hotel prices from multiple OTAs, ratings, reviews, amenities, availability.
- **Sorting:** By price, rating, reviews.

**Unique data vs. TA + Google:**
- **Real-time prices from 10+ OTAs in one call** — Booking.com, Expedia, Hotels.com, Agoda, etc.
- **Price comparison** — see all OTA prices side by side
- **Rate parity detection** — is the hotel's direct rate competitive?
- **Availability intelligence** — is the hotel fully booked?

**Verdict for Tercier:** **Tier 2 — HIGH VALUE.** This is the most cost-effective way to get competitive pricing intelligence. A single SerpApi call returns what Lighthouse charges enterprise prices for: the hotel's price on every OTA. At $50/mo for 5,000 searches, Tercier can track pricing for 2,500 hotels (2 searches each — check-in variations) for $50/month. This directly feeds the pricing intelligence product layer.

---

### J2. Makcorps Hotel Price API

**What it is:** Hotel price comparison from 200+ OTAs in a single GET request.

**API availability:**
- **Public API:** makcorps.com. 30-day free trial.
- **Data:** Prices from Booking.com, Expedia, Hotels.com, and 200+ more. Plus reviews, amenities, budget filters.

**Verdict for Tercier:** **Tier 2.** Alternative to SerpApi for price comparison. Evaluate both and pick the better coverage/price ratio.

---

### J3. Xotelo

**What it is:** Free hotel prices API.

**API availability:** Free. Limited coverage.

**Verdict for Tercier:** **Tier 4.** Too limited for scale. Use SerpApi or Makcorps instead.

---

### J4. Google Hotel Ads API

**What it is:** Official API for managing hotel ads on Google. Not for data extraction.

**API availability:** Partner integration only. For hotels/connectivity partners advertising on Google.

**Unique data:** Free Booking Links data (click-through rates, booking conversions).

**Verdict for Tercier:** **Tier 3 — Product feature.** Not useful for the dataset but valuable as a product feature. Once a hotel is a Tercier client, manage their Google Hotel Ads + Free Booking Links to prove direct booking ROI.

---

### J5. Trivago

**What it is:** Hotel metasearch engine.

**API availability:**
- **FastConnect:** For hotel advertisers to push rates to Trivago.
- **No data extraction API.** Trivago receives data, doesn't provide it.

**Verdict for Tercier:** **Skip for intelligence.** Use SerpApi to get Trivago prices indirectly.

---

### J6. Kayak / Momondo

**What it is:** Booking Holdings metasearch brands.

**API availability:**
- **Affiliate API:** 50% commission on clicks/bookings.
- **Hotel Search API:** Available to registered developers.
- **Not a data extraction API** — designed for embedding search results.

**Verdict for Tercier:** **Skip for intelligence.** Use SerpApi for price intelligence.

---

## K. AI & Emerging Sources

### K1. ChatGPT / OpenAI

**What it is:** The dominant AI assistant. Hotel recommendations are a top use case.

**Intelligence approach for Tercier:**
- Query ChatGPT: "What are the best luxury hotels in Zurich?" and record which hotels are mentioned
- Track AI visibility: Is the hotel appearing in AI recommendations?
- Schema.org markup audit: Does the hotel have proper structured data for AI consumption?

**API:** OpenAI API available ($0.50-$15 per 1M tokens depending on model).

**Verdict for Tercier:** **Tier 2 — Product feature.** AI Discovery audits are already planned (see .skills/ai-discovery/). Use OpenAI API to systematically query hotel recommendations per city and track which hotels appear. This feeds the "AI Visibility" product layer.

---

### K2. Perplexity API

**What it is:** AI search engine with citations. Real-time web search + synthesis.

**API availability:**
- **Sonar API:** RESTful. Built-in citations and conversation context.
- **Features:** Evaluates sources by relevance, authority, freshness.

**Unique value for Tercier:**
- **Citation tracking** — which hotels does Perplexity cite when asked about destinations?
- **Source authority signals** — Perplexity's source evaluation could inform content strategy
- **Real-time web intelligence** — programmatic access to web research

**Verdict for Tercier:** **Tier 2.** Use Perplexity's API alongside OpenAI for AI visibility audits. Track whether a hotel appears in Perplexity's citations for destination queries.

---

### K3. Google Gemini (Knowledge Graph)

**What it is:** Google's AI already provides hotel data via the `reviewSummary` and `generativeSummary` fields in the Places API.

**Already integrated:** The `gp_review_summary_gemini` field exists in Tercier's schema.

**Verdict:** **Already done.** Continue monitoring for expanded Gemini hotel intelligence in future API updates.

---

## L. Government & Regulatory Data

### L1. Tourism Board Databases

**Switzerland:**
- **MySwitzerland.io** — Open data API. Structured tourism data in 16 languages. Hotels, destinations, activities, events. **FREE.**
- **discover.swiss** — Developer portal. Touristic content and offers API. **FREE.**
- **opendata.swiss** — National open data portal with tourism datasets.

**Germany:**
- **Open Data Destination Germany** (open-data-germany.org) — Knowledge Graph with ~180,000 tourist objects including hotels. Part of ODTA (Open Data Tourism Alliance) with Austria and Switzerland. **FREE.**

**Other countries:** France (data.gouv.fr), Italy (dati.gov.it), Spain (datos.gob.es) — each has open data portals but hotel data quality/availability varies.

**Unique data vs. TA + Google:**
- **Official star ratings** — government-certified, not self-reported
- **Room counts** — official capacity data
- **Accessibility compliance** — government-mandated disclosures
- **Operating licenses** — active/suspended/revoked

**Verdict for Tercier:** **Tier 2 for Switzerland + Germany.** The MySwitzerland.io and Germany Open Data Tourism APIs provide official hotel data for free. Use for Phase 0 (Swiss) and Phase 1 (German cities). Systematically research each country's tourism board API as you enter that market.

---

### L2. Business Registries

- **OpenCorporates** (see D2 above): 170+ jurisdictions. Verify hotel company legal status.
- **Swiss Commercial Register** (zefix.ch): Free search. Swiss company data.
- **UK Companies House API:** Free. UK company data.
- **Each country has its own registry** — must be approached individually.

**Verdict:** **Tier 3.** Useful for verifying company status and ownership, especially for independent hotels where ownership is opaque.

---

### L3. Health/Safety Inspection Databases

**UK Food Hygiene Rating API:**
- **FREE.** No API key required. Covers hotels with F&B.
- **Data:** Hygiene rating (0-5), inspection date, confidence in management, structural compliance.
- **Coverage:** England, Scotland, Wales, Northern Ireland. 810,000+ establishments.

**Other countries:** Denmark (Fødevarestyrelsen), US (NYC Health — per city, not national). No pan-European equivalent.

**Verdict for Tercier:** **Tier 1 for UK.** Free, easy API, and health/safety ratings are unique intelligence. A hotel with a 5/5 hygiene rating vs. 2/5 is meaningful. Use for UK Phase 1 expansion. Research country-by-country for other markets.

---

### L4. Sustainability Certifications (See H9)

Green Key, EarthCheck, LEED, Green Globe, EU Ecolabel. No APIs. Scrape with Firecrawl.

---

## Integration Priority Matrix

### Immediate (Week 1-2) — Zero/Low Cost

| Source | Cost | Calls Needed | What It Gives |
|--------|------|-------------|---------------|
| OpenStreetMap | Free | City bounding boxes | Hotel POI cross-reference, room counts, building footprints |
| GeoNames | Free | 10K/day | Geographic reference backbone, city populations |
| YouTube Data API | Free | 10K units/day | Hotel video presence, digital maturity signal |
| UK Food Hygiene API | Free | Unlimited | Safety/quality ratings (UK hotels) |
| Wayback Machine | Free | Unlimited | Website age/freshness signal |
| Switzerland Tourism API | Free | Varies | Official Swiss hotel data in 16 languages |

### Phase 0 (Month 1) — Under $500/month

| Source | Cost | What It Gives |
|--------|------|---------------|
| Fiber AI | ~$200/mo est. | Contact enrichment for 1,649 unresolved Swiss hotels |
| Hunter.io | $34/mo | Email finding/verification per hotel domain |
| Apollo.io | Free-$49/mo | Fallback contact enrichment + intent data |
| Firecrawl (expand) | $83/mo | Hotel website intelligence at scale |
| SerpApi | $50/mo | Real-time hotel pricing from 10+ OTAs |
| Wappalyzer | $250/mo | Hotel website tech stack detection |
| Dropcontact | EUR 24/mo | GDPR-compliant contact enrichment (EU) |

### Phase 1 (Month 2-3) — Under $2,000/month

| Source | Cost | What It Gives |
|--------|------|---------------|
| Amadeus Hotel API | Pay-per-use | Hotel metadata, real-time pricing, 1.5M properties |
| Booking.com Demand API | Free (affiliate) | Reviews with 1-10 scale, per-segment scores |
| Semrush API | $500/mo | SEO/traffic intelligence per hotel domain |
| Moz API | $20/mo | Domain Authority scores |
| Foursquare Places | $0.015/call | Tips, popularity, check-in intelligence |
| Germany Open Data | Free | 180K tourism objects including hotels |
| Instagram (via scraping) | Firecrawl budget | Social presence assessment |
| Google Trends (PyTrends) | Free | Demand seasonality intelligence |

### Phase 2+ (Month 4+) — Enterprise/Partnership

| Source | Est. Cost | What It Gives |
|--------|-----------|---------------|
| GIATA Multicodes | Custom | Cross-platform hotel ID mapping |
| TrustYou | Custom | Meta-review scores for 500K hotels |
| Lighthouse | Custom | Rate intelligence (1.7B data points/day) |
| STR (CoStar) | Custom | Occupancy, ADR, RevPAR benchmarks |
| AllTopHotels | Custom | 2.3M hotel database with contacts/ADR |
| Expedia Rapid API | Commission | Reviews, room-level data, 700K properties |
| SimilarWeb | $15K+/yr | Website traffic analytics |
| National association data | Per-country | Official star ratings, room counts |

---

## Schema Impact: New Fields from Additional Sources

Based on this research, the following fields should be added to the intelligence schema:

### From Booking.com (Phase 1)
```
bk_hotel_id             string    Booking.com hotel ID
bk_rating               float     Booking.com score (1-10)
bk_num_reviews           int       Total Booking.com reviews
bk_score_staff           float     Staff score (1-10)
bk_score_facilities      float     Facilities score (1-10)
bk_score_cleanliness     float     Cleanliness score (1-10)
bk_score_comfort         float     Comfort score (1-10)
bk_score_value           float     Value score (1-10)
bk_score_location        float     Location score (1-10)
bk_score_wifi            float     Free WiFi score (1-10)
bk_score_by_couples      float     Couples average score
bk_score_by_solo         float     Solo travelers average score
bk_score_by_family       float     Family average score
bk_score_by_business     float     Business average score
```

### From Amadeus (Phase 1)
```
am_hotel_id             string    Amadeus hotel ID
am_chain_code           string    GDS chain code
am_rate_min_usd         float     Lowest available rate (USD)
am_rate_max_usd         float     Highest available rate (USD)
am_room_type_count      int       Number of distinct room types
am_has_suites           boolean   Suite room types available
```

### From Contact Enrichment (Phase 0)
```
cx_gm_name              string    General Manager name (Fiber/Apollo/Hunter)
cx_gm_email             string    GM email (verified)
cx_gm_phone             string    GM phone
cx_gm_linkedin          string    GM LinkedIn URL
cx_gm_source            string    Source: fiber|apollo|hunter|dropcontact
cx_company_headcount    int       Estimated headcount
cx_company_revenue_est  float     Estimated annual revenue (USD)
cx_hiring_signals       boolean   Active job postings detected
cx_tech_stack           string    Pipe-separated technologies (Wappalyzer)
```

### From SEO Intelligence (Phase 1)
```
seo_domain_authority     int       Moz DA (0-100)
seo_monthly_traffic_est  int       Estimated monthly organic traffic (Semrush)
seo_organic_keywords     int       Number of ranking keywords (Semrush)
seo_backlink_count       int       Total backlinks
seo_has_google_ads       boolean   Running Google Ads
```

### From Price Intelligence (Phase 1)
```
price_booking_com        float     Current rate on Booking.com (USD)
price_expedia            float     Current rate on Expedia (USD)
price_hotels_com         float     Current rate on Hotels.com (USD)
price_direct             float     Current rate on hotel website (USD)
price_parity_score       float     Direct rate / avg OTA rate (>1 = overpriced direct)
price_ota_count          int       Number of OTAs listing the hotel
```

### From Digital Presence (Phase 0-1)
```
dp_youtube_channel       boolean   Has YouTube channel
dp_youtube_videos        int       Number of videos
dp_youtube_views_total   int       Total video views
dp_instagram_followers   int       Instagram follower count
dp_instagram_posts       int       Total posts
dp_website_tech_cms      string    CMS platform (WordPress, custom, etc.)
dp_website_tech_booking  string    Booking engine (SiteMinder, Cloudbeds, etc.)
dp_website_tech_analytics string   Analytics tools
dp_sustainability_certs  string    Pipe-separated certifications
```

### From Geographic/Government (Phase 0-1)
```
osm_id                  string    OpenStreetMap node/way ID
osm_rooms               int       Room count from OSM (if tagged)
osm_stars               int       Star rating from OSM (if tagged)
geo_city_population     int       City population (GeoNames)
geo_tourism_arrivals    int       Annual tourist arrivals (UNWTO/government)
gov_star_rating         int       Official government star classification
gov_hygiene_rating      string    Food hygiene rating (UK: 0-5)
gov_inspection_date     string    Last inspection date
```

---

## Cost Summary: Full Data Architecture

### Phase 0 (2,069 Swiss hotels) — One-time + Monthly

| Category | One-time | Monthly | Notes |
|----------|----------|---------|-------|
| TripAdvisor | $0 | $0 | Within rate limits |
| Google Places | ~$58 | $0 | One-time enrichment |
| Contact enrichment (Fiber + Hunter + Apollo) | ~$300 | ~$280 | 1,649 unresolved contacts |
| Website intelligence (Firecrawl + Wappalyzer) | ~$100 | ~$330 | 2,069 hotel websites |
| Price intelligence (SerpApi) | $0 | $50 | 2,500 searches/mo |
| SEO (Moz) | $0 | $20 | DA scores for 2,069 domains |
| Geographic (OSM + GeoNames) | $0 | $0 | Free |
| **Total Phase 0** | **~$458** | **~$680/mo** | |

### Phase 1 (50K European hotels) — Monthly run rate

| Category | Monthly | Notes |
|----------|---------|-------|
| TripAdvisor | $0 | Within rate limits |
| Google Places | ~$270 | Amortized over 3 weeks |
| Amadeus | ~$200 | Pay-per-use |
| Booking.com | $0 | Affiliate model |
| Contact enrichment | ~$500 | Scaled enrichment |
| Website + SEO | ~$1,000 | Semrush + Wappalyzer + Firecrawl |
| Price intelligence | ~$250 | SerpApi scaled |
| **Total Phase 1** | **~$2,220/mo** | |

### Phase 3 (1.5M hotels) — Monthly run rate

| Category | Monthly | Notes |
|----------|---------|-------|
| All sources combined | ~$8,000-$15,000/mo | Depends on refresh frequency |
| Enterprise partnerships (GIATA, TrustYou, STR) | Custom | Negotiate at scale |

---

## Strategic Recommendations

### 1. Build the Enrichment Waterfall NOW
```
Contact discovery order:
1. Fiber AI (cheapest, partial search capability)
2. Apollo.io (fallback, intent data bonus)
3. Hunter.io (domain email search + verification)
4. Dropcontact (GDPR-compliant EU layer)
```

### 2. Add Booking.com as Third Review Platform
Apply for Demand API affiliate access immediately. The per-segment review scores (couples: 9.2, families: 7.1) are intelligence gold that directly feeds Tercier's persona engine.

### 3. Build Price Intelligence from Day 1
SerpApi at $50/month gives real-time OTA pricing for 2,500 hotels. This is the cheapest path to competitive pricing intelligence and immediately demonstrates value to hotel prospects: "Your direct rate is 15% higher than Booking.com — you're losing margin."

### 4. Use OpenStreetMap as the Third Discovery Source
Free, global, and often has hotels missing from TA + Google. The `tourism=hotel` tag with room counts and star ratings supplements the dataset at zero cost.

### 5. Amadeus for Real-Time Pricing + Hotel Metadata
Self-service API with free testing. The Hotel List API validates Tercier's inventory. The Search API provides actual room rates. GDS chain codes standardize brand identification.

### 6. Website Intelligence = Sales Intelligence
Firecrawl + Wappalyzer reveals: Does this hotel have a real website? What booking engine? Any SEO presence? This is directly actionable: "Your website runs on Wix with no booking engine — you're sending 100% of bookings to OTAs."

### 7. Approach GIATA and TrustYou for Partnership
Both companies have data assets that complement Tercier's. GIATA's cross-platform mapping and TrustYou's meta-review scores. Tercier's unique dataset (contextual intelligence, not just aggregation) makes it an interesting partner FOR them as well.

### 8. Government Open Data is Underexploited
MySwitzerland.io, Germany Open Data Tourism, and UK Food Hygiene API all provide free, official hotel data. Systematically harvest these for Phase 0 and Phase 1.

---

## Appendix: Complete Source Registry

| # | Source | Category | API? | Cost | Priority | Unique Value |
|---|--------|----------|------|------|----------|-------------|
| 1 | TripAdvisor | Reviews | Yes (live) | Free | ACTIVE | Subratings, trip types, reviews, ranking |
| 2 | Google Places | Reviews/Content | Yes (live) | $5-40/1K | ACTIVE | Editorial summary, Gemini summary, landmarks |
| 3 | Booking.com Demand API | Reviews/OTA | Yes (apply) | Free | Tier 2 | 1-10 scale, per-segment scores, 28M listings |
| 4 | Expedia Rapid API | Reviews/OTA | Yes (partner) | Commission | Tier 2 | 100 reviews/property, room-level data |
| 5 | Amadeus Hotel API | OTA/Pricing | Yes (self-svc) | Pay-per-use | Tier 1 | Real-time pricing, 1.5M properties, GDS codes |
| 6 | Fiber AI | Contacts | Yes | ~$200/mo | Tier 1 | Contact enrichment, firmographics, hiring |
| 7 | Apollo.io | Contacts | Yes | Free-$49/mo | Tier 1 | Contacts, intent data |
| 8 | Hunter.io | Email | Yes | $34/mo | Tier 1 | Domain email search, verification |
| 9 | Dropcontact | Contacts | Yes | EUR 24/mo | Tier 2 | GDPR-compliant EU enrichment |
| 10 | OpenStreetMap | Geography | Yes (free) | Free | Tier 1 | Hotel POIs, room counts, building footprints |
| 11 | GeoNames | Geography | Yes (free) | Free | Tier 1 | Geographic reference, city populations |
| 12 | Firecrawl | Website Intel | Yes | $83/mo | Tier 1 | Website scraping, content extraction |
| 13 | YouTube Data API | Social | Yes (free) | Free | Tier 1 | Video presence, digital maturity |
| 14 | UK Food Hygiene API | Government | Yes (free) | Free | Tier 1 | Hygiene ratings (UK) |
| 15 | Foursquare Places | Location | Yes | $0.015/call | Tier 2 | Tips, popularity, check-ins |
| 16 | SerpApi (Google Hotels) | Pricing | Yes | $50/mo | Tier 2 | Real-time OTA price comparison |
| 17 | Makcorps | Pricing | Yes | Trial free | Tier 2 | 200+ OTA price comparison |
| 18 | Semrush API | SEO | Yes | $500/mo | Tier 2 | Organic visibility, traffic, keywords |
| 19 | Moz API | SEO | Yes | $20/mo | Tier 2 | Domain Authority score |
| 20 | Wappalyzer | Website Intel | Yes | $250/mo | Tier 2 | Tech stack detection |
| 21 | BuiltWith | Website Intel | Yes | $495/mo | Tier 3 | Tech stack (alternative to Wappalyzer) |
| 22 | Instagram Graph API | Social | Yes (own only) | Free | Tier 2 | Visual content, engagement (own accounts) |
| 23 | MySwitzerland.io | Government | Yes (free) | Free | Tier 2 | Swiss hotel open data, 16 languages |
| 24 | Germany Open Data Tourism | Government | Yes (free) | Free | Tier 2 | 180K tourism objects |
| 25 | Google Trends (PyTrends) | Search Intel | Unofficial | Free | Tier 2 | Demand seasonality |
| 26 | Google Search Console | SEO | Yes (own sites) | Free | Tier 2 | Actual search performance (product feature) |
| 27 | Sustainability certs | Certifications | Scrape | Firecrawl | Tier 2 | Green Key, EarthCheck, etc. |
| 28 | OpenAI API | AI Visibility | Yes | ~$0.50/1M tok | Tier 2 | AI recommendation tracking |
| 29 | Perplexity API | AI Visibility | Yes | Pay-per-use | Tier 2 | AI citation tracking |
| 30 | Wayback Machine | Website Intel | Yes (free) | Free | Tier 4 | Website history/freshness |
| 31 | GIATA Multicodes | Hotel Mapping | Yes (partner) | Custom | Tier 3 | Cross-platform ID mapping |
| 32 | TrustYou | Meta-Reviews | Yes (partner) | Custom | Tier 3 | Aggregated score across 100+ sources |
| 33 | ReviewPro (Shiji) | Reviews | Yes (SaaS) | Enterprise | Tier 3 | 140 review sources |
| 34 | Lighthouse (OTA Insight) | Rate Intel | Yes (SaaS) | Enterprise | Tier 3 | 1.7B data points/day |
| 35 | STR (CoStar) | Performance | No API | Enterprise | Tier 3 | Occupancy, ADR, RevPAR |
| 36 | RateGain | Rate Intel | Yes (SaaS) | $85/mo+ | Tier 3 | 500+ demand sources |
| 37 | AllTopHotels | Hotel DB | Yes | Custom | Tier 3 | 2.3M hotels, contacts, ADR |
| 38 | DELTA CHECK | Hotel DB | Commercial | Custom | Tier 3 | 2.3M hotels since 1986 |
| 39 | Vervotech | Hotel Mapping | Yes (partner) | Custom | Tier 3 | AI mapping across 400+ suppliers |
| 40 | Hotelbeds | Content/OTA | Yes (partner) | Commission | Tier 3 | 300K hotels, tags, content |
| 41 | Crunchbase | Company Intel | Yes (enterprise) | $50K/yr | Tier 3 | Funding, ownership, executives |
| 42 | ZoomInfo | Contacts | Yes (enterprise) | $15K+/yr | Tier 3 | Enterprise contact data |
| 43 | SimilarWeb | Web Traffic | Yes (enterprise) | $15K+/yr | Tier 3 | Website traffic analytics |
| 44 | Ahrefs | SEO | Yes (enterprise) | $1.5K/mo | Tier 3 | Backlink analysis |
| 45 | Sistrix | SEO | Yes | EUR 419/mo | Tier 3 | EU Visibility Index |
| 46 | OpenCorporates | Company | Yes | GBP 2.3K/yr | Tier 3 | Legal entity verification |
| 47 | Sabre | GDS | Yes (partner) | Custom | Tier 3 | Alternative GDS |
| 48 | Agoda | OTA | Yes (partner) | Commission | Tier 3 | APAC hotel data |
| 49 | Hotel Associations | Member DB | No API | Per-assoc | Tier 3 | Official star ratings, members |
| 50 | National Registries | Government | Varies | Varies | Tier 3 | Legal company verification |
| 51 | Yelp Fusion | Reviews | Yes | $8-15/1K | Skip | Weak hotel coverage globally |
| 52 | Trustpilot | Reviews | Own only | Enterprise | Skip | Service reviews, not stays |
| 53 | Clearbit/Breeze | Enrichment | Yes (HubSpot) | $75/mo+ | Skip | Locked to HubSpot |
| 54 | Lusha | Contacts | Yes (scale plan) | $30/mo+ | Skip | Redundant with Fiber |
| 55 | RocketReach | Contacts | Yes ($207/mo) | $207/mo | Skip | Redundant with Fiber |
| 56 | Snov.io | Email | Yes | $149/mo | Skip | Redundant with Hunter |
| 57 | LinkedIn Sales Nav | Contacts | No (SNAP paused) | $80-150/mo | Skip | No API access |
| 58 | PitchBook | Company | Enterprise | Enterprise | Tier 4 | PE/VC tracking |
| 59 | Orbis (Moody's) | Company | Enterprise | Enterprise | Tier 4 | 600M companies |
| 60 | D&B | Company | Enterprise | Custom | Tier 4 | Credit/risk ratings |
| 61 | HERE Places | Location | Yes | Transaction | Tier 4 | Redundant with Google |
| 62 | Mapbox | Location | Yes | $0.75/1K | Skip | Redundant with Google |
| 63 | What3Words | Location | Yes | <$0.005/call | Skip | No hotel intelligence value |
| 64 | X/Twitter | Social | Yes | $200/mo+ | Skip | Low hotel signal, expensive |
| 65 | TikTok | Social | Business API | N/A | Tier 4 | No competitor analysis API |
| 66 | Pinterest | Social | Yes | N/A | Tier 4 | Niche for design hotels |
| 67 | Facebook Pages | Social | Yes (own only) | Free | Tier 4 | Declining relevance |
| 68 | Travelport | GDS | Yes (partner) | $4K setup | Skip | Redundant with Amadeus |
| 69 | Trivago | Metasearch | Advertiser only | CPC | Skip | No data extraction |
| 70 | Kayak/Momondo | Metasearch | Affiliate | Commission | Skip | Use SerpApi instead |
| 71 | Phocuswright | Research | Subscription | Custom | Tier 4 | Industry research reports |
| 72 | UNWTO | Statistics | Excel/Web | Custom | Tier 4 | Macro tourism stats |

---

*Research conducted March 28, 2026. Prices and availability subject to change.*
