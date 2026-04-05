---
name: tercier-knowledge
description: "Canonical knowledge base for Tercier, a vertical AI platform for premium hospitality. Use this skill whenever the user asks about Tercier's business plan, product, market research, synthetic survey results, financial model, competitive landscape, pricing, go-to-market, Monte Carlo simulations, or any strategic question about the company. Also use when the user references hotel marketing intelligence, premium hotel commercial execution, or the hotelleriesuisse dataset."
---

# Tercier Knowledge Base

## Company Identity

**Tercier AG** — Zug, Switzerland
**Website:** tercier.ai
**Structure:** Swiss AG incorporation, CHF 120-150K operator-seeded with optional milestone-based follow-on angel capital

### Origin Story

Tercier was born from a call between Amedeo Guffanti, Marco Corsaro, and Marco Di Cesare. Amedeo and Marco Corsaro — serial entrepreneurs with 2 exits (77Agency, GotU) and 22 years building digital businesses together — had already identified the hospitality vertical AI opportunity through their JAKALA hotel chain clients. They built an initial MVP with a small AI-native team (a French full-stack developer, 34yo, hired specifically for AI-first development; and a senior PM near 40). They had a pilot chain already interested. What they needed was a CEO who could own the product, drive the technology, and run the business full-time. Marco Di Cesare — who they'd met through Loamly (his AI recommendation intelligence product, directly relevant to hotel AI discovery) — was that person. The deal: Swiss AG, operator-seeded capital from Amedeo and Marco Corsaro, Marco Di Cesare as CEO/administrator with equity growing through milestone-based vesting, targeting exit in ~5 years.

### People

**Marco Di Cesare — Founder & CEO**
Italian, 33, Zurich. Full-time leader of Tercier.
- 4+ years CRM & RevOps Lead at FELFEL (smart food-tech, 150+ users across Sales/Marketing/CS, 3,000+ monthly tickets automated)
- Prior: Sonova (CRM Marketing, 35 key users + 1,600 users), Nielsen/NielsenIQ (3.5yr, data analyst → Salesforce consultant, Fortune 500 clients)
- Founded Loamly (loamly.ai, Sep 2025) — AI recommendation intelligence. Reverse-engineers how ChatGPT, Perplexity, Claude, Gemini, Grok recommend brands. 5 platforms, 2,000+ citations traced, 180+ primary research sources. Sold via agency white-label at premium pricing. Key finding: 74% of recommended brands change when you alter a single word in a query. **Loamly's methodology is directly relevant to Tercier's Layer 5 (AI Discovery & Visibility Intelligence).**
- Building Basquio — intelligence-first presentation generator (Next.js 15 + Supabase + multi-model: GPT-5.4 for analysis, Claude Opus 4.6 for authoring, cross-model critic). Production-grade monorepo with streaming parsers, agentic pipelines, structured outputs, recovery protocols.
- GitHub: marcodicesare-dev — 11 repositories including: loamly (AI traffic detection, RFC 9421 crypto signatures, Cloudflare Workers), basquio (multi-model orchestration), rabbhole, mappa, costfigure (HTML), ghostedbyai, and 5 more private repos. All TypeScript.
- Key strength: solo founder/operator with unusually high execution speed; built the research, knowledge assets, and planning system in this repo AI-native from day one

**Amedeo Guffanti — Co-Founder & Investor**
Global MD, Activation Business Line at JAKALA (€100M+ net revenue, ~1,000 people across Italy, UK, Spain, Latvia, US, France, Germany).
- Founded 77Agency (digital advertising, 2003) + GotU (media tech automation for SMBs, 2016) — 2 successful exits into JAKALA. Grew both to 190 employees internationally.
- 22yr digital marketing executive. Currently manages ~€500M in media investments delivering 10B+ in direct sales annually across 30+ countries.
- Hospitality vertical: 14yr direct experience (luxury cruising, hotelerie, airlines, retail ecommerce). JAKALA has hotel chain clients — this is the distribution channel.
- Deep platform relationships: Google, Facebook APIs since 2009, 16+ languages. IAB board member (2012-2014).
- Led M&A: acquisition of Roibox (Latvia), integration of H-FARM Digital into JAKALA
- Key strength: brings the hotel chain pipeline, capital, and 22yr proven playbook for scaling B2B2B digital businesses internationally

**Marco Corsaro — Co-Founder & Investor**
Co-Managing Director at JAKALA Digital & Media. Co-founded 77Agency with Amedeo in 2003 (22yr partnership). Was on the founding call pitching Marco Di Cesare to lead Tercier.
- Oversees: Media, SEO, Web Analytics, Creativity, CRO, Content, UX/UI, Data Science, DEM, CDN, Hosting
- Created companies in UK, Italy, Latvia, US. GotU co-founder.
- JAKALA Digital & Media recently hosted "Leading the AI Search Transition" event — directly relevant to GEO/AI discovery positioning
- Key strength: deep performance/analytics/SEO expertise that complements Amedeo's advertising and relationship side. His SEO/GEO knowledge directly feeds Tercier's AI Discovery layer.

### AI-Native Team Thesis
The founding team explicitly chose AI-native development: the initial developer was hired for "highest propensity for AI usage" because they "don't believe in traditional development architectures." This is validated by industry data: small AI-augmented teams (2-3 people with Claude/GPT) now achieve output parity with teams of 10-40 traditional engineers. Claude specifically scores 77.2% on SWE-bench vs GPT-5's 74.9%, with 200K token context windows enabling full codebase uploads. Marco Di Cesare's own output (114 commits in 48hrs on Basquio, entire synthetic research pipeline built in 2 days) demonstrates this thesis in practice.

### Communications Status (as of April 4, 2026)

- **March 10:** Founding call. Amedeo & Marco Corsaro pitch the opportunity, Marco Di Cesare confirms strong interest.
- **March 11:** Email exchange. Marco confirms he's all in ("non ho dubbi"). Amedeo: "la domanda più importante è capire se te la senti addosso."
- **March 12:** Marco proposes Milan meetup. No reply.
- **March 16:** Follow-up with BP work. No reply.
- **March 23:** Corsaro email request.
- **March 29:** **FORMAL PROPOSAL RECEIVED.** 55-min video call with Amedeo (Corsaro absent — daughter's skiing accident, both aligned). 19-slide deck: company renamed LUMINA, Swiss GmbH Zug, €200K capital, CHF 106K salary, up to 15% equity with performance vesting. Team: Elise (dev), Luisa (PM), Barbara Biffi (ex-Kempinski VP). **Kempinski pilot starting in days (Budapest + Bali).**
- **March 30:** Marco sends counterproposal: AG structure, 80/20 cap table, 5% PSOP, kicker 25/30/35%, vesting 7/7/6 on hotel/ARR KPIs, salary step-ups, 15% anti-dilution floor, governance board of 3.
- **April 4 (Easter Saturday, 18:00):** **COUNTERPROPOSAL RESPONSE RECEIVED.** Amedeo & Corsaro respond same week. **5 of 9 points approved as-is. 4 calibrated (zero rejections).** Key changes: kicker capped at 30% (was 35%), vesting rebalanced 5/7/8 (was 7/7/6), salary step-ups approved with 6-month runway clause, anti-dilution floor 10%/8% decrescente (was 15% flat). Cap table 80/20, PSOP 5%, AG structure, governance, non-compete all approved. **"Vogliamo chiudere e partire."** Meeting requested to finalize.
- **Full proposal details:** `knowledge/lumina-proposal-2026-03-29/`
- **Response document:** `knowledge/lumina-proposal-2026-03-29/counterproposal-response-2026-04-04.md`

#### Current Agreed Terms (near-final, pending in-person meeting)
- **Cap table:** 40% Amedeo / 40% Corsaro / 20% Marco + 5% PSOP off cap table
- **Exit kicker:** 20% base → 23% at €30M → 25% at €50M → 30% cap at €100M+
- **Vesting:** 5% at M12 (15+ paying hotels) → 7% at M24 (ARR ≥ €500K) → 8% at M36 (ARR ≥ €1.5M)
- **Salary:** CHF 106K → 150K at €300K ARR → 185K at €1.5M → 220K at €3M/Series A (with 6-month runway clause)
- **Anti-dilution:** Pro-rata in every round. Floor: 10% through Series A, 8% from Series B
- **Governance:** Board of 3, decisions 2/3, drag-along, tag-along, non-compete 12mo hotel AI SaaS
- **Capital:** €200K (€100K each), Swiss AG Zug
- **Timeline:** Sign → repo access → May 50% → July 100% (M1)

---

## Founder Strategy & Principles

### Understanding Amedeo & Marco's Goals
They initiated this. They see the AI revolution as a timing opportunity in hospitality. They found Marco Di Cesare through Loamly — a guy who ships like crazy (114 commits in 48hrs, entire research pipeline in 2 days). Their goal: profit from the wave, build something real, exit big. They bring capital, hotel chain pipeline, and 22yr playbook. They need an operator who can execute at AI-native speed.

### Investor Psychology (Advisor Input, March 2026)
- Investors giving you money want to know **daily** what you're doing with it. Structured updates, transparency.
- They want to see **break-even / profitability path first** — knowing that if something goes wrong, the company is still alive.
- **Don't start the pitch with a fixed investment number.** Start with X (a factor), explain the reasoning behind it. The number should emerge from the logic, not the other way around.
- **"I'd rather have 10 clients from you than CHF 100K in investment."** 10 paying clients = product-market fit proof, feedback loops, reference clients. Going from 0→10 is the hardest part. 10→100 is growth. 100→1000 is scaling.

### Marco's Core Principles
1. **AI-Native = Iron Man Suit.** The suit alone does nothing. Tony Stark is a genius — the suit makes him a superhero. Marco + AI tools = 10x output of a normal employee. Not because AI is magic, but because he knows how to use it extremely well.
2. **Only Hire Enablers.** Don't hire until revenue justifies it. Bleed first. Lose the first client because you have too much work before you hire. No random people — only people who multiply output, not add to it. Start with 2 max.
3. **Execution Speed > Perfection.** If you can iterate from mistakes at 20x speed, the cost of a mistake drops to near zero. Ship, learn, fix, ship again. Meetings and planning are secondary to doing.
4. **Clients > Capital.** 10 paying clients from Amedeo/Marco's network are worth more than CHF 100K investment. Clients = validation + revenue + feedback + references. Capital without clients is just a slower death.

### Founder Salary Strategy (Zurich Tax-Optimized)

**Incorporate in Zug/Baar, not Zurich** (corp tax 11.8% vs 19.6%)

**The math says: lowest total tax = lowest salary.** Here's why:
- Every CHF of salary costs 12.8% in social contributions (AHV+ALV, employer+employee sides) PLUS Zurich income tax
- Every CHF kept as company profit costs only 11.8% in Zug corporate tax
- So at low income tax brackets, salary is MORE expensive than corporate tax
- The optimal strategy: pay yourself the MINIMUM that won't trigger a tax audit

**Key thresholds:**
- Below CHF 2,500/yr: NO social contributions at all (but CHF 0 for a full-time CEO = instant audit)
- CHF 2,500–22,680/yr: AHV applies (10.6%) but NO BVG pension (saves ~14% in pension contributions)
- Above CHF 22,680/yr: BVG mandatory pension kicks in
- Federal tax starts at ~CHF 24,500 gross (after ~CHF 6K standard deductions)

**Tax-optimized salary options (assuming CHF 200K company budget):**

| Salary | Company Cost | Personal Tax | Corp Tax | TOTAL TAX | Audit Risk |
|--------|-------------|-------------|----------|-----------|------------|
| CHF 0 | CHF 0 | CHF 0 | CHF 23,600 | **CHF 23,600** | HIGH — will be challenged |
| CHF 22,680 | CHF 24,132 | CHF 259 | CHF 20,752 | **CHF 23,915** | MEDIUM — startup argument |
| CHF 36,000 | CHF 38,972 | CHF 1,078 | CHF 19,001 | **CHF 26,023** | LOW-MEDIUM |
| CHF 48,000 | CHF 52,580 | CHF 1,994 | CHF 17,396 | **CHF 28,549** | LOW |
| CHF 60,000 | CHF 66,188 | CHF 3,305 | CHF 15,790 | **CHF 31,471** | MINIMAL |
| CHF 72,000 | CHF 79,796 | CHF 4,828 | CHF 14,184 | **CHF 34,603** | ZERO |

**Deemed salary risk (verdeckte Gewinnausschüttung):**
Swiss tax authorities apply the "Drittvergleich" (arm's length test). If a full-time CEO's salary is far below market rate, they impute a deemed salary and tax you on that. There's no published CHF threshold — it's case by case. Pre-revenue startup context helps justify a low number.

**Recommended approach for the meeting:**
- AGGRESSIVE: CHF 36,000/yr (CHF 3,000/mo) — below BVG, near-zero income tax, arguable for pre-revenue startup. Company cost: CHF 3,248/mo.
- SAFE: CHF 48,000/yr (CHF 4,000/mo) — still below BVG, defensible, minimal tax. Company cost: CHF 4,382/mo.
- CONSERVATIVE: CHF 60,000/yr (CHF 5,000/mo) — BVG kicks in but zero audit risk. Company cost: CHF 5,516/mo.

**What to present:** "I take CHF 3,000-4,000/month. The company cost is CHF 3,200-4,400/month. That's survival money — less than a third of my current salary. Every other franc goes into the business. When we have 10 paying hotels, we revisit compensation. I'd rather have equity upside than salary."

**Full analysis:** `research/zug-vs-zurich-tax-analysis-2026.md`

### Hardened Financial Model (Conservative, March 2026)

**Monthly OPEX (no salary, no second person):** CHF 4,530/mo
- Admin & legal (Treuhand, legal, insurance, governance): CHF 1,625/mo
- Office (coworking + internet): CHF 625/mo
- Tech infrastructure (hosting, DB, cache, monitoring): CHF 390/mo
- AI dev tooling (Claude Code, Codex, Perplexity, Cursor): CHF 540/mo
- Marketing (LinkedIn, travel, content, events, CRM): CHF 1,350/mo

**One-time costs:** CHF 7,600 (incorporation CHF 3K + MacBook CHF 3.4K + .com domain CHF 1.2K)

**Total monthly burn at CHF 4K salary:** CHF 8,850/mo (solo) or CHF 13,170/mo (with junior dev at CHF 4,320/mo)

**Peak cash deficit (solo, conservative 12mo to 10 hotels):** ~CHF 60,000 at month 9
- Breakeven lands at 5 hotels on full pricing or 7 hotels on PoV pricing
- By roughly month 15, the operating deficit is repaid from revenue
- The company never needs materially more than ~CHF 60K in operating support beyond share capital

### Customer Lifetime Value

| Timeframe | Revenue/customer | Gross profit (97%) |
|-----------|-----------------|-------------------|
| Year 1 (PoV → Intelligence) | CHF 21,060 | CHF 20,428 |
| Years 1-3 | CHF 76,140 | CHF 73,856 |
| Years 1-5 | CHF 140,940 | CHF 136,712 |

**Enterprise value per customer at exit:** use the current business-plan exit lens, not the old 15-25x ARR framing
**10 clients:** enough to create proof, references, and a profitable base business before the company needs external scale capital

### Investment Strategy: Small Number + Tranches

**Decision: present the SMALL realistic number, not a big round.**

Rationale (advisor input + financial model):
1. **The math says CHF 120-150K is enough.** Peak deficit is about CHF 60K, not 64K, and the corrected ramp still fits the same seed range.
2. **Clients > Capital.** 10 clients from Amedeo/Marco's network matter more than extra seed because they create revenue, proof, feedback loops, and reference accounts.
3. **Asking for less is the power move.** "I need CHF 150K and your 10 clients" shifts the conversation from money to network. You're not begging for capital — you're telling them the bottleneck is their pipeline, not cash.
4. **Equity protection.** At CHF 150K: you get 36-38%. At CHF 500K: you get 26%. Difference = CHF 10M at exit.
5. **If they want to put in more: tranches.** CHF 150K now, more at 10 hotels at higher valuation. Total commitment can be CHF 500K+ but deployed when the company can use it. Each tranche prices higher = less dilution for Marco.
6. **Let THEM push you up.** Starting small and being pushed higher = negotiating from strength. Starting big and being pushed lower = negotiating from weakness.

**Tranched structure:**
- **Tranche 1 (Day 0):** CHF 100-150K. Covers share capital + 12-18mo runway. Marco gets 35-38% equity.
- **Tranche 2 (at 10 hotels, ~M9-12):** CHF 100-200K at CHF 1.5-2.5M pre-money. Buys 8-13% additional. Marco dilutes to ~33-35%.
- **Tranche 3 (at 25+ hotels, ~M18-24):** CHF 200-500K at CHF 5-10M pre-money. Or external Series A. Marco still at ~30-33%.

**If they insist on big upfront:** Negotiate pre-money valuation. CHF 500K at CHF 500K pre-money = they get 50%, you keep 38% after ESOP. The larger the X, the more critical the valuation discussion.

### Contribution-Based Equity Formula

**Their contributions:** Cash (X) + client access + pilot access
**Your contributions:** Salary sacrifice (CHF 152K/yr × 3yr × 0.7 discount = CHF 319K) + pre-incorporation IP (CHF 40K) = CHF 359K

At CHF 150K cash from them, their modeled total is CHF 262K if you use the business-plan network value lens of CHF 112K Year 1 operating profit from 10 clients.

The negotiation point is not a fake-precision spreadsheet. It is:
- your side contributes CHF 359K of discounted operator value plus the operating system already built
- their side contributes cash, pilot access, and the distribution network that can unlock the first 10 clients
- the distributable pool after the 12% ESOP should reflect that ratio, without pretending the network value is more precise than it is

**Key assumptions:** Market salary CHF 200K/yr (conservative — Marco worth CHF 200-250K). Sweat equity discounted to 70% (cash-now vs labor-over-time). IP valued at CHF 40K (name, .ai domain, .com option, 718-hotel dataset, business plan, financial models, Monte Carlo sims, synthetic survey).

### Vesting Structure

**Reverse vesting over 36 months (shares issued day 1, repurchase right lapses over time):**
- Vesting start date: March 10, 2026 (founding call, not incorporation)
- 6-month cliff: 5% of 30% vests (~September 2026)
- Months 7-36: remaining 25% vests monthly (0.83%/mo)
- Milestone accelerators: +3% at 25 hotels, +3% at 50 hotels
- Full acceleration on change of control (exit)
- Good leaver: unvested equity continues vesting 12 months post-departure
- Reverse vesting (not options) = shares held from day 1 = Swiss capital gains tax exemption (0%)

**Salary sacrifice = equity purchase:**
At any point, Marco's vested equity should be worth at least his cumulative salary sacrifice. If gap is CHF 152K/yr and he vests 10%/yr, each 1% = CHF 15.2K at grant valuation. At implied company value of CHF 1.5M, 1% = CHF 15K. Math checks out.

### Three Income Streams

1. **Salary:** CHF 4K/mo starting → CHF 8K at 10 hotels → CHF 12-15K at 25-50 hotels (automatic triggers in shareholder agreement, NOT discretionary)
2. **Revenue share:** 2% of MRR from month 1. At 20 hotels = ~CHF 860/mo. At 115 hotels = ~CHF 5,000/mo. Taxed as income (~25%).
3. **Equity:** 35-38% at exit. Swiss private capital gains = 0% tax. This is where the real money is. At the separate global-expansion exit-model P50 (CHF 94.82M), 35% = CHF 33.2M tax-free.

**Protection clauses (non-negotiable in shareholder agreement):**
- Accelerated vesting on change of control
- Good leaver / bad leaver (keep vested + 12mo continued vesting)
- Tag-along rights (if they sell, you sell on same terms)
- Drag-along floor (minimum valuation for forced sale)
- Anti-dilution / pro-rata on future rounds
- Board seat (3-person board, your consent required for: selling company, new capital raises, changing employment terms, issuing shares)
- Information rights + no related-party transactions without consent
- Deadlock resolution (shotgun clause)

### Presentation Strategy (for the Meeting)
- Don't open with investment amount. Open with the problem, the product, the data.
- Present the burn math: "The company costs CHF 4,500/mo to run plus my salary. Show month-by-month ramp."
- Let the number emerge: "Peak cash need is about CHF 60K. Add share capital and buffer = CHF 120-150K."
- Frame your contribution: "I'm taking CHF 4K/mo — a CHF 150K/yr sacrifice. Over 3 years, I'm investing CHF 450K in sweat equity."
- Ask for clients first: "I'd rather have 10 clients from you than CHF 100K in investment."
- If they push bigger: "Let's do CHF 150K now, more at 10 hotels at a higher valuation. Your total commitment can be whatever you want — deployed when the company can use it."
- Close: "Your network is worth more than your check."

---

## Product Definition (Final, Canonical)

### One-Liner
*"Tercier helps premium hotels win more direct bookings and higher-value guests by deciding what each property should say, promote, and publish each month from live market, review, competitor, and AI-discovery signals."*

### The 7-Layer Platform

1. **Market Intelligence** — Real-time competitive set pricing, positioning, and promotional activity
2. **Voice-of-Customer Intelligence** — Aggregated guest review sentiment, intent signals, and unmet needs
3. **Persona & Intent Modeling** — Segmentation of demand profiles, booking psychology, and value drivers
4. **Competitive Reading** — Comparative feature analysis, messaging gaps, and differentiation opportunities
5. **AI Discovery & Visibility Intelligence** — Search demand visibility, LLM-native positioning, and discoverability
6. **Decision & Prioritization Engine** — Monthly priority ranking of which messages, assets, and promotions will drive the most direct revenue
7. **Content & Asset Engine** — Automated generation and publishing of property-specific marketing narratives

### What Tercier Is NOT
- A dashboard, a report, or a data warehouse
- Generic AI-generated content
- A reputation or review management tool
- A broad-market hospitality SaaS

### Go-to-Market Wedge
Property-specific, direct-demand execution tied to monthly commercial outcomes.

---

## Market

### Sizing
- **TAM:** EUR 240M–1.5B
  (10,000–25,000 premium hotels globally, EUR 24K–60K ACV)

- **SAM:** EUR 48M–300M
  (2,000–5,000 European premium properties)

- **SOM (3-year):** EUR 1.2M–9M ARR
  (50–150 properties)

### Ideal Customer Profile (ICP)
- Premium and luxury hotel properties
- Average Daily Rate (ADR) ≥ EUR 250
- Lean local/regional marketing teams
- Facing direct-booking pressure from large OTAs
- Ownership/management willing to invest in data-driven commercial execution

---

## Pricing Model

| Tier | Price (Monthly) | Use Case |
|------|-----------------|----------|
| **Proof-of-Value** | EUR 1,000–1,500 | Pilot, single property |
| **Intelligence Tier** | EUR 2,000–3,000 | Full platform, limited scope |
| **Full Platform** | EUR 3,000–5,000 | Complete competitive + content execution |
| **Group Rollout** | EUR 2,000–4,000/property/mo | Annual contract, portfolio play |

---

## Competitive Landscape (Updated March 2026)

### Well-Funded Incumbents (Operations/Infrastructure)
- **Mews** — Cloud PMS, $2.5B valuation (Jan 2026, $300M Series D led by EQT Growth). 15K customers, 85 countries, $19.7B transaction volume. Focus: replacing legacy PMS, payments, AI automation at property operations level.
- **Canary Technologies** — AI Guest Management, $600M valuation ($80M Series D, Jun 2025). 20K+ hotels, Marriott/Wyndham/Best Western. Acquired OpenKey (Jan 2026). Focus: check-in, AI voice/webchat, upsells.
- **Lighthouse** (formerly OTA Insight) — Revenue intelligence, 65K+ hotels, 185 countries. Launched Connect AI, Revenue Agent, Review Agent (Q1 2026). Focus: dynamic pricing, rate intelligence, OTA ranking optimization.

### Point Solutions (Marketing/Content Adjacent)
- **TrustYou** — Review aggregation & sentiment. AI agents from $115/property/month. CDP from $350/month.
- **Revinate** — CRM, guest engagement, email marketing
- **Milestone Inc.** — Hotel digital marketing + GEO. Reports +4,302% traffic from AI platforms (Jan-Oct 2025).

### What They All Miss (Tercier's Gap)
None of these platforms provide **property-level commercial intelligence + content execution in a unified system**. Mews, Canary, and Lighthouse own operations infrastructure. TrustYou and Revinate handle single data streams. Milestone does agency-style GEO. Nobody gives a commercial director at a single property: "here's what you should push this month, here's why, and here's the ready-to-ship content." That's Tercier's wedge.

### Loamly → Tercier Strategic Link
Marco Di Cesare's Loamly (AI recommendation intelligence) is directly relevant to Tercier's Layer 5. The methodology for reverse-engineering how ChatGPT/Perplexity recommend brands — citation chain tracing, source influence scoring, query sensitivity analysis — transfers directly to hotel AI discovery optimization. This is a genuine technical moat that no hotel-focused competitor has.

---

## Key Financial Projections

### Operator-Seeded Path (P50)
- **M36 Hotels:** 115
- **M36 ARR:** EUR 3.99M
- **Unit economics:** EUR 34.7K ACV

### Operator + Follow-On Angel Path (P50)
- **M36 Hotels:** 154
- **M36 ARR:** EUR 5.33M
- **Unit economics:** EUR 34.6K ACV

### Exit Valuation Lenses (M60, P50)
- **Conservative business-plan Monte Carlo v2:** EUR 45.86M operator-seeded / EUR 67.39M operator + follow-on angel
- **Separate global-expansion exit model:** CHF 94.82M (CHF 89.5M–101.1M, 25th–75th percentile), roughly 5.1x ARR in that model

---

## Synthetic Research Summary

### Dataset
- **Source:** hotelleriesuisse.ch
- **Raw member dataset:** 2,069 rows
- **Selected dossiers for enrichment/survey prep:** 718 hotels
- **ICP-qualified cohort:** 272 hotels (4-5★, ADR ≥ CHF 250)
- **Simulation scope:** 2 roles × 3 replications per hotel, then adversarial critique and judge normalization

### Key Findings
- **Buy likelihood at CHF 3,000/mo:** 37% average across cohort
- **Buy likelihood at CHF 5,000/mo:** 15% average across cohort
- **Top proof-package items (ranked, not canonical percentages):**
  - PMS/CRM integration
  - Swiss references or case studies
  - 60-day pilot option
  - Swiss/GDPR-compliant hosting
- **Deal killer:** No PMS/CRM integration (79% stated deal-breaker)
- **Price sensitivity:** Willingness to pay peaks at CHF 2,000–3,500 for full platform tier

### Objection Clusters
1. **Integration complexity** — Most cited friction point
2. **Proof of ROI** — Requires pilot data or comparable case studies
3. **Resource requirements** — Concern about internal bandwidth for execution
4. **Feature gap vs. existing tools** — Some prefer consolidated growth within current martech stack

---

## Repository File Map

### Research Documents (Mar 10–11)
- `hospitality-vertical-ai-research-2026-03-10.md` — Foundation research; parallel Firecrawl + social scan
- `00-RESEARCH-BRIEF-HOSPITALITY-AI.md` — 7-agent multi-vector research
- `hospitality-vertical-ai-research-v2-2026-03-11.md` — Corrected framing, BMC, TAM refinement
- `vertical-ai-hospitality-research-memo-2026-03-11.md` — Business model design deep-dive

### Product Definition (Mar 11)
- `ai-vertical-business-plan-format-research-2026-03-11.md` — Plan structure and components
- `BUSINESS-PLAN-FORMAT-RESEARCH.md` — Comprehensive format analysis
- `TERCIER-PRODUCT-ONE-PAGER.md` (v1) — Initial product role-play iterations
- `tercier-product-one-pager-v2-platform-2026-03-11.md` — 6-layer platform articulation
- `tercier-product-one-pager-v3-ai-discovery-2026-03-11.md` — Final 7-layer + AI discovery layer
- `tercier-problem-product-articulation-research-2026-03-11.md` — Articulation research and positioning

### Data & Synthetic Research (Mar 12–14)
- `hotelleriesuisse-members-hotels-switzerland.csv` — Raw HotellerieSuisse member dataset (2,069 rows)
- `hotelleriesuisse-members-hotels-switzerland.enriched-master.csv` — Enriched master dataset
- `research/synthetic-survey/run-2026-03-13-full-v1/` — Full survey run (272 hotels, 1,632 simulations)
  - `RUN_REPORT.md` — Pipeline results and methodology
  - `deliverables/executive-summary.md` — Key findings
  - `deliverables/ranked-targets-top50.csv` — Top 50 acquisition targets
  - `analysis/` — pricing curves, objection clusters, segment analysis, proof rankings
- `research/synthetic-survey/run-2026-03-13-pilot-v1/` — Pilot run (5 hotels, validation)

### Business Plan & Financial Model (Mar 14)
- `business-plan-v3-march-2026.md` — Complete 14-section strategic business plan
- `tercier-financial-model.xlsx` — 5-year projections, dual-path scenarios
- `research/synthetic-survey/run-2026-03-22-business-plan-monte-carlo-v2/` — Canonical 10K-sim business-plan model, P50: 115 hotels / €3.99M ARR at M36 operator-seeded, 154 hotels / €5.33M ARR with follow-on angel
- `research/synthetic-survey/run-2026-03-14-exit-monte-carlo-v1/` — Separate 10K-sim global-expansion exit lens, P50: CHF 94.82M at M60
- `research/synthetic-survey/run-2026-03-14-business-plan-monte-carlo-v1/` — Historical operator-vs-VC business-plan model, superseded
- `research/synthetic-survey/run-2026-03-14-dual-path-monte-carlo-v1/` — Exploratory aggressive comparison, not canonical plan math

---

## Related Skills

This skill is the **root of the knowledge graph**. It provides strategic context. For operational/technical depth, load the specialized skills:

```
tercier-knowledge (THIS SKILL — strategy, product, financials, people)
  └── hotels-dataset (the data moat — global dataset strategy, schema, phases)
        └── tripadvisor-api (the primary data source — endpoints, schemas, patterns)
```

- **TripAdvisor API work:** Load `.skills/tripadvisor-api/SKILL.md`
- **Dataset pipeline work:** Load `.skills/hotels-dataset/SKILL.md`
- **Strategic decisions:** This skill alone is sufficient
- **Full picture:** Load all three

---

## Using This Skill

Invoke **tercier-knowledge** whenever:
- A user asks about Tercier's strategy, product, positioning, or financial projections
- A user references the hotelleriesuisse dataset or synthetic research
- Strategic decisions, competitive positioning, or market analysis are in question
- Tercier context is needed for go-to-market planning, pitch refinement, or product roadmap decisions
- Understanding WHY the dataset or API work matters to the business

This skill provides the authoritative reference layer for all Tercier work. Pair with `tripadvisor-api` and `hotels-dataset` for operational depth.
