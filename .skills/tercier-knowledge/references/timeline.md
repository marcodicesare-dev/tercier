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

## Ongoing Reference

All documents and datasets are stored in the repo root and subdirectories. Refer to this timeline to understand the research sequence and how each phase builds on prior work.

**Current Status (as of March 16, 2026):**
- Product definition: LOCKED
- Business plan: COMPLETE
- Financial model: COMPLETE
- Synthetic research: COMPLETE
- Go-to-market strategy: DEFINED
- Comms: Follow-up sent, awaiting reply from Amedeo & Marco. Proposed Milan meeting Thu/Fri Mar 19-20.

