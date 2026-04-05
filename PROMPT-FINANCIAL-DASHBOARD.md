# CLAUDE CODE TASK: Monte Carlo Simulation + Series A/B/C Research + Interactive Dashboard

## Context

You are working on **Lumina (Tercier AG)** — a vertical AI SaaS platform for premium hotels. Swiss AG, Zug/Zurich. The financial model has been fully researched and built. Now we need Monte Carlo simulations with funding scenarios.

**READ THESE FIRST (mandatory):**
- `.skills/tercier-knowledge/SKILL.md` — full company context, product, people, deal terms
- `build_model_v4_chf.py` — the current financial model (Python/openpyxl), every cost researched
- `knowledge/lumina-proposal-2026-03-29/counterproposal-response-2026-04-04.md` — agreed deal terms
- `CLAUDE.md` — master project context, timeline, what's built
- `.skills/hotels-dataset/SKILL.md` — the data moat, 297-field schema, pipeline
- `.skills/tercier-knowledge/references/product-layers.md` — 7-layer platform architecture

**Memory file with all lessons learned (READ THIS):**
- `/Users/marcodicesare/.claude/projects/-Users-marcodicesare-Documents-Projects-tercier/memory/financial_model_lessons.md`

---

## TASK 1: Research AI Vertical B2B SaaS Funding Rounds

Before building anything, deeply research the current (2026) state of funding for **vertical AI B2B SaaS companies**. This is NOT generic SaaS — it's AI-native, vertical (hospitality), B2B.

### Research these EXACTLY:

1. **Series A** for AI vertical SaaS (2025-2026):
   - Median round size
   - Median pre-money valuation
   - Typical ARR at Series A ($1-3M? $3-5M?)
   - Typical ARR multiple for valuation
   - Dilution range (15-25%?)
   - Time from founding to Series A
   - Search: "AI SaaS Series A 2025 2026 median round size valuation"
   - Sources: Carta, PitchBook, Crunchbase, a16z, First Round data

2. **Series B** for AI vertical SaaS:
   - Median round size
   - Median pre-money valuation
   - Typical ARR at Series B ($5-15M?)
   - Typical ARR multiple
   - Dilution range
   - Search: "AI SaaS Series B 2025 2026 benchmark"

3. **Series C** for AI vertical SaaS:
   - Median round size
   - Typical ARR ($15-50M?)
   - Valuation multiples
   - At this stage, is the company profitable or still burning?

4. **Bootstrapped / No-VC path**:
   - What ARR is needed to be fully self-sustaining?
   - Typical growth rates without VC funding
   - Exit multiples for bootstrapped vs VC-backed SaaS

5. **Hospitality tech specifically**:
   - Recent funding rounds in hotel tech (Mews $2.5B, Lighthouse, TrustYou)
   - What multiples do hospitality SaaS companies get?
   - Is there a vertical discount or premium vs horizontal SaaS?

6. **Key 2026 metrics** (from the financial model lessons):
   - Burn multiple: net burn / net new ARR. Target <1.5x at Series A.
   - Rule of 40 → Rule of 60 (Kellblog March 2026)
   - Default alive status (Paul Graham framework)
   - Net Revenue Retention >120% is premium territory

---

## TASK 2: Monte Carlo Simulation (60 months, 4 funding scenarios)

Build a Monte Carlo simulation with **10,000 runs each** for 4 scenarios. Extend the model to **60 months (5 years)**.

### The 4 Scenarios:

**Scenario A: Bootstrapped (No External Funding)**
- CHF 200K initial capital only
- All growth funded from revenue
- No dilution
- Conservative growth assumptions (slower indie acquisition, no new chain partnerships beyond the 10 planned)

**Scenario B: Series A at ~M18-24**
- CHF 200K initial + Series A round
- Research-based round size and valuation (from Task 1)
- Use the funding to accelerate: faster hiring, more marketing, potentially acquire hotels faster
- Model the dilution impact on Marco's equity

**Scenario C: Series A + Series B**
- Series A at ~M18-24
- Series B at ~M36-42
- More aggressive growth: larger team, international expansion
- Model cumulative dilution with anti-dilution floors (10% through Series A, 8% from Series B)

**Scenario D: Full VC Path (A + B + C)**
- Series A → B → C
- Targeting the CHF 500M+ valuation at M48-60
- Maximum growth, maximum dilution
- What does Marco's equity look like after 3 rounds with the kicker?

### Monte Carlo Parameters (vary these with distributions):

**Revenue parameters (use triangular distributions):**
- Chain rollout speed: ±20% variance on rollout percentages
- Chain pipeline: 8-12 chains (base 10) over 48 months
- Indie acquisition rate: 1.5-3 hotels/month (base 2)
- Indie churn: 8-18% annual (base 12%)
- ARPU: ±15% variance by phase
- Time to Phase 2 ARPU: M20-M28 (base M24)
- Time to Phase 3 ARPU: M33-M42 (base M37)

**Cost parameters:**
- Team hiring timing: ±3 months on each hire
- Infrastructure costs: ±25% variance
- AI COGS per hotel: €30-€80 (base €50)
- CEO salary step-ups: as modeled (deterministic, tied to ARR)

**Funding parameters (for scenarios B/C/D):**
- Series A size: use researched distribution from Task 1
- Series A timing: M18-M30
- Valuation multiple: use researched distribution
- Same for B and C

### Output for each scenario:
- P10 / P50 / P90 for: ARR at M12/M24/M36/M48/M60
- P10 / P50 / P90 for: cash balance at each milestone
- P10 / P50 / P90 for: company valuation at M48 and M60
- P10 / P50 / P90 for: Marco's equity value (with kicker + dilution)
- Probability of running out of cash (Scenario A especially)
- Probability of hitting each vesting milestone
- Burn multiple distribution at each milestone
- Default alive probability at M6/M12/M18

---

## TASK 3: Build the Interactive Dashboard

Build a **Next.js 15 + React** dashboard (can be a standalone app or added to the existing `lumina-ui/` project). Use **Tailwind CSS + shadcn/ui + Recharts** for the UI.

### Architecture:
- All calculations in TypeScript (not Python) — the model runs client-side
- JSON config file for all assumptions (editable)
- Real-time recalculation when any input changes
- No backend needed — everything computed in the browser

### Pages/Sections:

#### 1. ASSUMPTIONS PANEL (sidebar or top section)
Every single input editable with sliders/inputs:
- FX rates (EUR/CHF, USD/CHF) with live lookup option
- Initial capital (CHF)
- ARPU by phase (EUR, chain + indie, 3 phases)
- Phase transition months (when Phase 2/3 kick in)
- Chain schedule (10 chains, each with start month + total hotels)
- Add/remove chains dynamically
- Indie parameters (start month, base rate, growth %, churn %)
- CEO salary + social % + step-up thresholds
- Team roster (add/remove members, EUR cost, start month)
- Every SaaS tool individually (USD cost, start month)
- Every admin cost (CHF, 4 tiers)
- Workspace costs by tier
- S&M by tier
- One-time costs (each item)
- AI COGS per hotel (EUR)
- Processing % (Stripe)
- Contingency

#### 2. P&L VIEW
- Monthly view (48-60 columns, scrollable)
- Annual summary (Y1-Y5)
- Every cost item on its own row (matching the xlsx)
- Color coding: green for revenue, red for costs, bold for totals
- Sparkline charts inline
- Hotel count section at top
- Revenue section
- Cost section (grouped: People, AI & Tech, Infrastructure, Admin, Workspace, S&M, Variable, One-time)
- Profitability section (EBITDA, margin, cumulative)

#### 3. CASH FLOW VIEW
- Mirrors P&L with same detail
- Inflows: capital + revenue
- Outflows: every item from P&L
- Net cash flow
- Closing balance with area chart
- Runway (net burn) with color coding (red <6mo, yellow 6-12, green >12)
- 6-month clause status

#### 4. SCENARIO COMPARISON
- Side-by-side comparison of 2-4 scenarios
- Toggle between: Bootstrapped, Series A, A+B, A+B+C
- Key metrics comparison table
- Overlay charts (ARR trajectories, cash balances, team size)
- Dilution waterfall chart (cap table evolution across rounds)

#### 5. MONTE CARLO RESULTS
- Load pre-computed Monte Carlo results (from Task 2, stored as JSON)
- Fan charts showing P10/P25/P50/P75/P90 bands for:
  - ARR trajectory
  - Cash balance
  - Company valuation
  - Marco's equity value
- Histogram of M48/M60 outcomes
- Probability tables (% chance of hitting specific milestones)
- Default alive probability over time

#### 6. VALUATION & EXIT
- ARR milestones (M12/24/36/48/60)
- Valuation matrix (6x/8x/10x/12x ARR)
- Marco's equity with kicker tiers
- Salary sacrifice analysis
- Cap table evolution across funding rounds
- Dilution waterfall

#### 7. ZUG vs ZURICH
- Tax comparison (already computed)
- After-tax profit by year
- Cumulative savings
- Break-even on when Zug savings justify the hassle

#### 8. KEY METRICS DASHBOARD (landing page)
- Big number cards: Current ARR, MRR, Paying Hotels, Cash, Runway, Burn Multiple
- These update based on which month you're viewing
- Month slider to scrub through time
- Traffic light indicators for vesting milestones
- CEO salary step-up timeline

### Technical Requirements:
- **Framework:** Next.js 15 App Router
- **UI:** Tailwind CSS + shadcn/ui components
- **Charts:** Recharts (or Nivo for more complex visualizations)
- **State:** React state + URL params for shareable views
- **Data:** All model parameters in a single TypeScript config object
- **Calculation engine:** Pure TypeScript functions that mirror `build_model_v4_chf.py` exactly
- **Export:** Button to export current scenario to xlsx (using SheetJS)
- **Responsive:** Works on desktop (primary) and tablet
- **Dark mode:** Use Lumina brand palette (Ink #1A120B, Cream #F5EFE6, Terracotta #C17F59, Deep Terracotta #8B4A2B, Gold #C9A96E)

### FX Rules (CRITICAL — memorize these):
- EUR → CHF: **MULTIPLY** by EUR_CHF rate (0.9224). Number gets smaller.
- USD → CHF: **MULTIPLY** by USD_CHF rate (0.80). Number gets smaller.
- CHF → EUR: **DIVIDE** by EUR_CHF rate. Number gets bigger.
- A profitable company has INFINITE runway (net burn ≤ 0).
- Runway = cash / net_burn. NOT cash / gross_outflow.

### Model Parameters (from the verified build script):
```
Capital: CHF 200,000
EUR/CHF: 0.9224
USD/CHF: 0.80
CEO base: CHF 106,080/yr, social 10.14%
Step-ups: €300K ARR → CHF 150K, €1.5M → CHF 185K, €3M → CHF 220K
Trial: 3 months pilot only, rollout pays immediately
ARPU: Phase 1 €1K, Phase 2 €1.4K/€1.5K, Phase 3 €1.8K/€2K
Indie: start M7, 2/mo, +20% YoY, 12% annual churn
AI COGS: €50/hotel/month
Dev tooling: $600/mo (Claude $200 + Codex $200 + Perplexity $200)
Infrastructure: $662/mo M1-12 (18 individual SaaS tools, realistic usage)
Processing: 3% (Stripe)
```

### File Structure:
```
lumina-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              (dashboard landing — key metrics)
│   │   ├── pnl/page.tsx          (P&L view)
│   │   ├── cashflow/page.tsx     (Cash flow view)
│   │   ├── scenarios/page.tsx    (Scenario comparison)
│   │   ├── montecarlo/page.tsx   (Monte Carlo results)
│   │   ├── valuation/page.tsx    (Valuation & exit)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── assumptions-panel.tsx  (sidebar with all inputs)
│   │   ├── monthly-table.tsx      (scrollable 48-60 column table)
│   │   ├── charts/
│   │   │   ├── arr-chart.tsx
│   │   │   ├── cash-chart.tsx
│   │   │   ├── fan-chart.tsx      (Monte Carlo bands)
│   │   │   ├── waterfall.tsx      (dilution waterfall)
│   │   │   └── burn-chart.tsx
│   │   └── ui/                    (shadcn components)
│   ├── lib/
│   │   ├── model.ts              (THE calculation engine — mirrors build_model_v4_chf.py)
│   │   ├── montecarlo.ts         (Monte Carlo simulation runner)
│   │   ├── scenarios.ts          (funding scenario definitions)
│   │   ├── fx.ts                 (currency conversion helpers)
│   │   ├── types.ts              (TypeScript interfaces for all data)
│   │   └── defaults.ts           (default assumptions — matches the xlsx)
│   └── data/
│       ├── montecarlo-results.json  (pre-computed 10K run results)
│       └── funding-research.json    (Series A/B/C benchmarks)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## Execution Order

1. **First:** Research funding rounds (Task 1) — save to `data/funding-research.json`
2. **Second:** Build the calculation engine (`lib/model.ts`) — must exactly match `build_model_v4_chf.py` outputs
3. **Third:** Run Monte Carlo simulations (Task 2) — save results to `data/montecarlo-results.json`
4. **Fourth:** Build the dashboard UI (Task 3)
5. **Fifth:** Verify every number matches the xlsx

---

## Validation

After building, verify these numbers match the xlsx exactly:
- M12: 45 paying, ARR €540,000, EBITDA CHF 9,376
- M24: 132 paying, ARR €2,260,811
- M36: 232 paying, ARR €3,970,811
- M48: 333 paying, ARR €7,396,795
- CEO steps up at M12 (CHF 150K), M23 (CHF 185K), M29 (CHF 220K)
- Lowest cash: CHF 56,799 at M11
- Y1 EBITDA: CHF -133,825
- Y4 EBITDA: CHF 4,814,350

If ANY number doesn't match, fix it before moving on.
