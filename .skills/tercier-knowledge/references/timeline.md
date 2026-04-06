# Tercier Project Timeline

## March 10, 2026 — Foundation Research

**Phase:** Initial market and business model exploration

**Documents:**
- `hospitality-vertical-ai-research-2026-03-10.md`

**Method:**
- Parallel Firecrawl web research
- Social scan (LinkedIn, product communities, investor news)
- Framework synthesis (TAM sizing, business model patterns, token economics)

**Key Outputs:**
- Business model format benchmarking (SaaS vertical AI plays)
- Token economics for hospitality use cases
- Growth trajectory analysis
- Initial pricing hypothesis
- Competitive landscape mapping

---

## March 11, 2026 — Deep Dives + Product Definition

**Phase:** Product articulation, business model refinement, positioning

**Documents:**
- `00-RESEARCH-BRIEF-HOSPITALITY-AI.md` (7-agent multi-vector research)
- `hospitality-vertical-ai-research-v2-2026-03-11.md` (corrected framing, BMC, TAM)
- `vertical-ai-hospitality-research-memo-2026-03-11.md` (business model design)
- `ai-vertical-business-plan-format-research-2026-03-11.md` (plan format and structure)
- `BUSINESS-PLAN-FORMAT-RESEARCH.md` (comprehensive format analysis)

**Product Definition Documents:**
- `TERCIER-PRODUCT-ONE-PAGER.md` (v1 — role-play iterations, early messaging)
- `tercier-product-one-pager-v2-platform-2026-03-11.md` (6-layer platform definition)
- `tercier-product-one-pager-v3-ai-discovery-2026-03-11.md` (7-layer + AI discovery layer)
- `tercier-problem-product-articulation-research-2026-03-11.md` (articulation research, positioning)

**Key Outputs:**
- 7-layer platform architecture finalized
- One-liner and positioning locked
- Business plan section framework defined
- ICP profile refined
- Competitive moat identified

---

## March 12–13, 2026 — Data Collection + Synthetic Research

**Phase:** Dataset construction and buyer behavior simulation

**Method:**
- **Data Source:** Scraped hotelleriesuisse.ch
- **Initial Dataset:** 718 hotels
- **Enrichment:** Geo-coding, star rating, estimated ADR, owner/management info
- **ICP Filtering:** 272 hotels (4–5 stars, ADR ≥ CHF 250)

**Synthetic Research Pipeline:**
- **Phases 0–7:** Data preparation → LLM-powered role play → structured outputs → ranking and analysis
- **Models Used:**
  - `gpt-5-mini` for interview and adversarial simulation
  - `gpt-5` for judge/evaluation layer
- **Simulation Scope:** 3 roles × 2 perspectives per hotel (cooperative + adversarial)
- **Total Runs:** 272 hotels × 3 roles × 2 perspectives = 1,632 simulations
- **Cost:** ~$25.54 for full run
- **Design Choices:** Responses API, structured outputs, prompt caching for efficiency

**Key Outputs:**
- `hotelleriesuisse-members-hotels-switzerland.enriched-master.csv` (master enriched dataset)
- `research/synthetic-survey/run-2026-03-13-full-v1/RUN_REPORT.md` (complete results and analysis)
- `research/synthetic-survey/run-2026-03-13-full-v1/deliverables/` (executive summary, ranked targets, raw data CSVs)
- Ranked target property list by deal probability
- Pricing curves and willingness-to-pay analysis
- Objection clusters and proof-of-value rankings

---

## March 14, 2026 — Business Plan + Financial Model

**Phase:** Strategic planning and financial modeling

**Documents:**
- `business-plan-v3-march-2026.md` (complete 14-section strategic business plan)
- `tercier-financial-model.xlsx` (5-year projections, dual-path scenarios)

**Financial Simulations:**
- `research/synthetic-survey/run-2026-03-14-business-plan-monte-carlo-v1/` (10K operator-seeded sims)
- `research/synthetic-survey/run-2026-03-14-exit-monte-carlo-v1/` (10K exit valuation sims, M60)
- `research/synthetic-survey/run-2026-03-14-dual-path-monte-carlo-v1/` (VC vs operator-seeded comparison)

**Key Outputs:**
- **Operator-seeded P50 (M36):** 84 hotels, EUR 2.58M ARR
- **VC-accelerated P50 (M36):** 112 hotels, EUR 3.88M ARR
- **Exit valuation P50 (M60):** CHF 94.82M (25th–75th: CHF 89.5M–101.1M)
- 14-section business plan with go-to-market, competitive positioning, funding strategy
- Sensitivity analysis on key drivers (CAC, LTV, churn, sales cycle)
- Funding requirements and use of proceeds

---

## Communications Timeline

### March 10, 2026 — Founding Call
- Call between Amedeo Guffanti, Marco Corsaro, and Marco Di Cesare
- Amedeo and Marco Corsaro pitch the opportunity: vertical AI for premium hospitality
- They have an MVP, a small AI-native team (French dev + senior PM), and a pilot chain interested
- They want Marco Di Cesare as CEO/operator
- Marco Di Cesare confirms strong interest
- CC: Sara (JAKALA assistant)

### March 11, 2026 — Email: Confirmation + Next Steps
- **12:09 — Marco Di Cesare → Amedeo, Marco, Sara:** Confirms interest, proposes delivering a business plan, asks for info on the hotel chain contact
- **14:34 — Amedeo → Marco:** "Non mi aspetto un pensiero definitivo sul BP. La domanda più importante è capire se questo tipo di venture te la senti addosso." Sets expectations: logic and commitment matter more than a polished plan
- **15:20 — Marco Di Cesare → Amedeo, Marco:** Clear yes — "non ho dubbi, è il tipo di progetto che voglio fare." Frames it as entrepreneurial opportunity, not a job. Highlights analytics/martech/CRM/AI background + hospitality contacts from FELFEL (EHL network). Asks again about the hotel chain details

### March 12, 2026 — Email: Milan Meetup Proposal
- **19:24 — Marco Di Cesare → Amedeo, Marco, Sara:** Proposes meeting in person in Milan, Thu or Fri of the following week (Mar 19-20). No reply received.

### March 16, 2026 — Email: Follow-Up with Business Plan Update
- **22:59 — Marco Di Cesare → Amedeo, Marco, Sara:** Updates on work done: FELFEL hotel dataset + scraper, market/competitor research, business plan with financial model and scenarios. Proposes in-person walkthrough Thu/Fri in Milan or a call. No reply yet from Amedeo or Marco since March 11.

**Note:** Marco Corsaro has not replied to any email in the thread. Only Amedeo responded (once, March 11). Sara is CC'd throughout (JAKALA assistant).

---

## March 22, 2026 — Monte Carlo V2

**Documents:**
- `research/synthetic-survey/run-2026-03-22-business-plan-monte-carlo-v2/` — Canonical 10K-sim model

**Key Outputs:**
- **Operator-seeded P50 (M36):** 115 hotels, EUR 3.99M ARR
- **Operator + follow-on angel P50 (M36):** 154 hotels, EUR 5.33M ARR
- Supersedes v1 model

---

## March 27, 2026 — State of the Art Research

**Documents:**
- `research/STATE-OF-THE-ART-RESEARCH-2026-03-27.md` — 900 lines, 100+ sources

**Key Outputs:**
- Competitive landscape: $2B+ VC mapped, every player with gaps
- "What Hotels Actually Buy" — agency replacement thesis, 5 platform capabilities (reframed Apr 2026 from "monthly deliverables")
- Corsaro & Guffanti thesis distilled from call transcripts
- Equity & deal benchmarks (Carta 2026 data)

---

## March 28, 2026 — Hotels Dataset Deep Research

**Phase:** Global dataset architecture, API verification, 10-hotel sample

**Documents:**
- `research/hotels-dataset-deep-research-2026-03-28.md`
- `research/google-places-api-deep-research-2026-03-28.md`
- `research/global-data-source-architecture-deep-research-2026-03-28.md`
- `research/ai-native-context-engineering-state-of-art-march-2026.md`
- `research/sample-10-hotels-core.csv` (114 cols × 10 hotels)
- `research/sample-10-hotels-reviews.csv` (80 reviews)
- `research/sample-10-hotels-competitors.csv`
- `research/sample-10-hotels-amenities.csv` (854 amenity pairs)
- `research/sample-10-hotels-lang-ratings.csv`

**Key Outputs:**
- 7 agent skills built (tercier-knowledge, hotels-dataset, tripadvisor-api, google-places-api, review-intelligence, sales-intelligence, ai-discovery)
- CLAUDE.md master context with 5 non-negotiables
- 8 parallel verification agents fact-checked 72 data sources
- Debunked: Amadeus (150K not 1.5M), Semrush (replaced by SpyFu $89/mo), Wappalyzer (OSS dead)
- Discovered: SpyFu, GSTC (3,522 certified hotels), Apollo free tier, Germany Knowledge Graph with MCP Server
- Verified 12-source architecture at ~$820/mo total
- 240-field intelligence schema per hotel, normalized into 5 tables

---

## March 29, 2026 — Lumina Proposal Received

**Phase:** Formal offer from Amedeo Guffanti

**Event:** 55-minute video call (Marco Di Cesare + Amedeo Guffanti). Corsaro absent — daughter broke her leg skiing. Both founders aligned on proposal.

**Documents:**
- `knowledge/lumina-proposal-2026-03-29/` — Full package:
  - `lumina-proposal-deck.pptx` (19 slides)
  - `amedeo-email-screenshot.png` + `amedeo-email-transcript.md`
  - `call-transcript-summary.md` (Gemini auto-transcript summary)

**Key Terms:**
- Company renamed to LUMINA, Swiss GmbH in Zug
- Capital: €200K (€100K each from Amedeo + Corsaro)
- Salary: CHF 8,840/month (CHF 106K/year, market value CHF 190K)
- Equity: up to 15% (25% pool × 60% weight), real equity confirmed (not phantom)
- Vesting: 12-month cliff, 3 annual tranches tied to performance score
- BP Y1: 41 hotels, €123K revenue. BP Y4: 341 hotels, €3.3M revenue, €3.8M ARR
- Exit scenario: 10x ARR at Y4 = €38M valuation
- Team: Elise (dev), Luisa (PM), Barbara Biffi (ex-Kempinski VP), Barbara Muckermann (MSC Cruises angel)
- Kempinski pilot: Budapest + Bali, starting in days

**Handshake Agreements (verbal, not yet in writing):**
1. Real equity, not phantom shares
2. Overperformance mechanism beyond 15%
3. Anti-dilution protection
4. Acceleration on liquidity event

**Open Issues (for counter-proposal):**
- 15% equity cap is below market for a CEO role — target 20%+
- Performance score undefined — needs objective KPIs (ARR, hotel count, NRR)
- No board seat or governance structure mentioned
- No salary progression triggers
- No PSOP/ESOP for future hires mentioned
- Dataset and research IP (this repo) is contributed value not accounted for

**Status:** Counter-proposal being prepared.

---

## Communications Timeline (Updated)

### March 10, 2026 — Founding Call
- Call between Amedeo Guffanti, Marco Corsaro, and Marco Di Cesare
- Amedeo and Marco Corsaro pitch the opportunity
- Marco Di Cesare confirms strong interest

### March 11, 2026 — Email: Confirmation + Next Steps
- Marco confirms: "non ho dubbi, è il tipo di progetto che voglio fare"
- Amedeo: "la domanda più importante è capire se te la senti addosso"

### March 12, 2026 — Email: Milan Meetup Proposal
- Marco proposes in-person meeting. No reply.

### March 16, 2026 — Email: Follow-Up with Business Plan Update
- Marco shares FELFEL dataset, market research, financial model. No reply.

### March 23, 2026 — Corsaro Email Request
- Context in `knowledge/2026-03-23-corsaro-email-request.md`

### March 29, 2026 — Video Call + Formal Proposal
- 55-minute call, Amedeo only (Corsaro's daughter emergency)
- 19-slide deck + recap email with full terms
- Company now called LUMINA
- Kempinski pilot imminent (Budapest + Bali)
- Counter-proposal in preparation

---

## Ongoing Reference

All documents and datasets are stored in the repo root and subdirectories. Refer to this timeline to understand the research sequence and how each phase builds on prior work.

**Current Status (as of March 29, 2026):**
- Product definition: LOCKED
- Business plan: COMPLETE (v4)
- Financial model: COMPLETE (Monte Carlo v2)
- Synthetic research: COMPLETE (272 hotels, 1,632 sims)
- State of the art research: COMPLETE (900 lines, 100+ sources)
- Global dataset architecture: COMPLETE (12 verified sources, 240-field schema)
- 10-hotel global sample: COMPLETE (8 countries, normalized tables)
- 7 agent skills: BUILT
- Lumina proposal: RECEIVED — counter-proposal in preparation
- Contact enrichment: v6 complete (420 resolved), recovery v1 running


### April 6, 2026
- **DEAL ACCEPTED.** Marco sent acceptance email to Amedeo & Corsaro. All 4 adjustments accepted (kicker 30% cap, vesting 5/7/8, salary runway clause, anti-dilution 10%/8%). Meeting set for Friday April 11 after 16:00.
- Two SHA clarifications requested: (1) monthly pro-rata vesting after cliff, (2) runway = cash / net burn (profitable = infinite runway, clause auto-satisfied)
- Marco confirmed available from tomorrow, 50% from May, 100% from June. Already resigned from FELFEL.
- Decision: incorporate in Zurich (not Zug). Domiciliation at Nexova, Bahnhofstrasse 71, CHF 150/mo.
- Financial model updated: Zurich tax 19.59%, indie churn 15%, Zurich hires from M12, domiciliation added. Breakeven still M12, lowest cash CHF 54,649 at M11.
- Monte Carlo regenerated: bootstrapped P50 ARR M48 €7.6M, Full VC P50 €22.3M.
- Product framing corrected across all repo files: "monthly deliverables" → "platform capabilities". Lumina is an autonomous AI platform, not a deliverable service.
- Financial dashboard deployed to tercier.vercel.app with 8 pages: Key Metrics, P&L, Cash Flow, Scenarios, Monte Carlo, Valuation & Exit, Zug vs Zurich, Post-Exit Life Simulator.
- CEO Brief written: PMF analysis (EvolutionIQ precedent), team structure recommendation, AI-native operating model, competitive risk map (Lighthouse, Kempinski ReviewPro).
