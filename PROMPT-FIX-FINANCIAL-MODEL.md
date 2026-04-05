# Prompt: Fix the Lumina Financial Model

> Copy-paste this entire prompt into a fresh Claude Code session that has access to the `tercier` folder (this repo). It contains everything needed to rebuild the model correctly.

---

## Your Task

You are fixing and rebuilding a 48-month SaaS financial model for **Lumina** (working name for Tercier AG), a vertical AI platform for premium hotels. The model is a Python-generated `.xlsx` file using `openpyxl`. The current build script is at `build_model_v4_chf.py` in the repo root — it generates `lumina-financial-model-v2.xlsx`.

The model has been rebuilt 5-6 times and still has fundamental errors. **Read every word of this prompt before writing a single line of code.** Do not rush. Do not guess. Validate every formula against the source documents.

---

## Source Documents (READ THESE FIRST)

1. **Lumina Proposal deck (Amedeo's):** `mnt/uploads/Lumina Proposal (3)-c5521e8e.pptx`
   - Slide 10: Business model — €1K ARPU, 3mo chain trial (pilot only), 2 indie/mo from M7
   - Slide 12: Growth model — 10 chains in 48 months, rollout percentages (15%→40%→50%→55%)
   - Slide 13: Financial projections — Y1: 41 active/32 paying/€0.4M ARR, Y2: 139/106/€1.3M, Y3: 253/227/€2.7M, Y4: 341/317/€3.8M (all at flat €1K ARPU)
   - Slide 14: Cost structure — breakeven at M12, max drawdown ~€210K

2. **Counterproposal response (agreed terms):** `mnt/uploads/Lumina Risposta Controproposta-d22231b8.docx`
   - Also parsed at: `knowledge/lumina-proposal-2026-03-29/counterproposal-response-2026-04-04.md`

3. **Tercier knowledge base:** `.skills/tercier-knowledge/SKILL.md` — full context on product, pricing tiers, competitive landscape, data moat

---

## Currency: CHF Throughout, But Revenue Inputs Are EUR

The model reports in **CHF**. The company is a Swiss AG in Zug.

### CRITICAL FIX NEEDED: Initial Capital

The proposal says "€200K (€100K each from Amedeo + Corsaro)." The current script converts this to CHF: `=B11/B6` which gives ~CHF 216K. **This is WRONG.** The capital contribution is **CHF 200,000** — it's a Swiss AG, share capital is denominated in CHF. Model it as:

```
Initial capital (CHF): 200,000  ← HARD INPUT, not a formula
```

Do NOT convert EUR→CHF for the capital. The €200K in the proposal is an approximation. The legal share capital will be CHF 200K.

### FX Rate

`EUR/CHF = 0.9224` (1 CHF = 0.9224 EUR, i.e., EUR is worth less than CHF). This means:
- To convert EUR revenue to CHF: `EUR_amount / 0.9224` (dividing makes it bigger — correct, CHF > EUR)
- To convert CHF amounts to EUR (for threshold checks): `CHF_amount * 0.9224`

### What Uses EUR (converted to CHF in formulas)

- Hotel ARPU (hotels pay in EUR)
- Team salaries (EUR-denominated employees outside Switzerland)
- Operating expenses (mostly EUR-denominated vendors)
- One-time costs (EUR)

### What Is Native CHF (NO conversion)

- Initial capital: CHF 200,000
- CEO salary: CHF 106,080/yr (CHF 8,840/mo gross)
- CEO salary step-ups: CHF 150K / CHF 185K / CHF 220K
- All P&L output lines (everything displays in CHF)

---

## Agreed Terms (Counterproposal Response, April 4, 2026)

### Cap Table
- Amedeo Guffanti: 40%
- Marco Corsaro: 40%
- Marco Di Cesare: 20% (base)
- PSOP: 5% (off cap table, phantom shares)

### Exit Kicker (on Marco's effective % at exit)
- Under €30M valuation: 20%
- €30M+: 23%
- €50M+: 25%
- €100M+ (cap): 30%

### Vesting (Marco earns additional equity)
- M12 cliff: 5% if 15+ paying hotels
- M24: 7% if ARR ≥ €500K
- M36: 8% if ARR ≥ €1.5M
- Total possible: 20% base + 20% vested = 40% (but this is the kicker %, not additive equity)

### CEO Salary (CHF, gross)
- Base: CHF 106,080/yr (CHF 8,840/mo)
- Employer social contributions: 13.5% ON TOP (AHV 5.3% + ALV 0.55% + BVG ~7.65%)
- Total company cost at base: CHF 8,840 × 1.135 = CHF 10,033.40/mo
- Step-up 1: CHF 150,000/yr when ARR ≥ €300K AND 6-month runway clause met
- Step-up 2: CHF 185,000/yr when ARR ≥ €1.5M AND 6-month runway clause met
- Step-up 3: CHF 220,000/yr when ARR ≥ €3M (or Series A) AND 6-month runway clause met

**Runway clause:** Step-up only activates if previous month's closing cash balance ≥ previous month's total cash outflow × 6.

### Anti-Dilution
- Floor: 10% through Series A
- Floor: 8% from Series B onward

---

## Revenue Model

### ARPU

Hotels pay in EUR. The Lumina Proposal (Slide 10) uses flat €1,000/hotel/month. The model should include **ARPU growth from M24 onward**, justified by product maturation and data moat:

| Phase | Months | Chain ARPU (EUR) | Indie ARPU (EUR) | Rationale |
|-------|--------|-----------------|-----------------|-----------|
| Proof-of-Value | M1-23 | 1,000 | 1,000 | Matches proposal. Getting in the door, proving product. |
| Intelligence | M24-36 | 1,400 | 1,500 | 24mo of data depth (297 fields/hotel). Agency replacement thesis provable. Chains get volume discount. |
| Full Platform | M37-48 | 1,800 | 2,000 | All 7 layers mature, content engine producing. Still far below €3-5K agency spend replaced. |

**Revenue formula (CHF):** `paying_hotels × EUR_ARPU_for_phase / EUR_CHF_rate`

The phase breakpoints in revenue formulas should be: `IF(month >= 37, phase3_arpu, IF(month >= 24, phase2_arpu, phase1_arpu))`

**Important:** The ARPU growth does NOT affect M1-M23, so breakeven at M12 is unaffected. The proposal's Y1-Y2 numbers were based on flat €1K. Y3-Y4 will be higher than the proposal because of ARPU growth — this is intentional and the whole point.

### Chain Hotel Schedule (from Proposal Slide 12)

10 chains over 48 months. Each chain has: start month, total hotels, 3-hotel pilot, then rollout at 15%→40%→50%→55% of total at +5/+11/+17/+23 months after start.

| Chain | Start Month | Total Hotels |
|-------|-------------|-------------|
| Kempinski | M1 | 82 |
| Radisson | M12 | 95 |
| Barceló | M16 | 70 |
| Mandarin Oriental | M20 | 36 |
| Hyatt Luxury | M24 | 45 |
| Jumeirah | M28 | 26 |
| Meliá | M32 | 80 |
| Rosewood | M36 | 30 |
| Minor Hotels | M40 | 55 |
| Rotana | M44 | 42 |

**Rollout formula per chain:**
```
IF month >= start+23 → ROUND(total × 55%)
ELIF month >= start+17 → ROUND(total × 50%)
ELIF month >= start+11 → ROUND(total × 40%)
ELIF month >= start+5 → ROUND(total × 15%)
ELIF month >= start → 3 (pilot)
ELSE → 0
```

**CRITICAL — Trial mechanics:** The 3-month free trial applies ONLY to the pilot (3 hotels). Once the chain commits to rollout, all rollout hotels pay immediately. The paying formula per chain is:

```
IF month >= chain_start + 3 → chain_active_count (the whole active count pays)
ELSE → 0
```

This is what makes breakeven at M12 possible. If you apply a 3-month trial to ALL hotels (not just pilot), cash flow goes deeply negative and breakeven moves to M26+. The proposal explicitly models pilot-only trial.

### Independent Hotels
- Start acquiring at M7
- Base rate: 2 new per month
- Annual growth on acquisition rate: 20% YoY (compounded)
- Annual churn: 12%
- Indies pay from day 1 (no trial period)

Formula: `prev_month + ROUND(base × (1 + growth_rate)^FLOOR((month - start_month)/12)) - ROUND(prev_month × churn_rate/12)`

---

## Cost Structure

### CEO (CHF native — NO conversion)
```
Monthly company cost = (annual_salary / 12) × (1 + 0.135)
```
With step-ups checking ARR thresholds in EUR: `CHF_ARR × EUR_CHF_rate >= EUR_threshold`
And runway clause: `prev_month_cash >= prev_month_total_outflow × 6`

### Team (EUR, converted to CHF)
| Role | EUR/month | Start Month |
|------|-----------|-------------|
| Developer (full-time) | 4,000 | M1 |
| PM (part-time) | 4,000 | M1 |
| CS / Implementation | 5,000 | M12 |
| Senior Engineer | 7,000 | M18 |
| Sales/BD | 6,000 | M18 |
| Engineer | 6,000 | M30 |
| Marketing | 5,000 | M36 |

Convert each: `IF(month >= start, EUR_cost / EUR_CHF_rate, 0)`

### Operating Expenses (EUR, 4 tiers by period)

| Category | M1-12 | M13-24 | M25-36 | M37-48 |
|----------|-------|--------|--------|--------|
| Infrastructure | 150 | 400 | 800 | 1,200 |
| AI dev tooling | 500 | 600 | 600 | 600 |
| Admin & legal | 1,500 | 1,800 | 2,000 | 2,200 |
| Office / coworking | 500 | 700 | 1,000 | 1,200 |
| Marketing & events | 1,500 | 3,000 | 4,000 | 5,000 |
| Travel | 500 | 1,000 | 1,500 | 2,000 |
| SaaS tools | 100 | 300 | 500 | 700 |
| Insurance (D&O) | 300 | 400 | 500 | 500 |
| Contingency | 500 | 500 | 500 | 500 |

Each: `IF(month >= 37, tier4, IF(month >= 25, tier3, IF(month >= 13, tier2, tier1))) / EUR_CHF_rate`

### AI Tokens
- 20% of CHF revenue (variable) + EUR 200/mo fixed base (converted to CHF)
- Formula: `revenue_CHF × 0.20 + 200 / EUR_CHF_rate`

### Payment Processing
- Stripe 3% of revenue: `revenue_CHF × 0.03`

### One-Time Costs (EUR, Month 1 only)
- Incorporation: 3,500
- Bank setup: 300
- Domain: 1,200
- Hardware: 3,400
- Legal: 5,000
- **Total: 13,400 EUR** → convert to CHF in cash flow

---

## Sheet Structure (6 sheets)

### Sheet 1: Assumptions
All inputs in one place. Blue = editable input, Black = formula, Green = cross-sheet reference.
- FX rate, model dates
- Capital (CHF 200,000 — hard input, NOT converted from EUR)
- ARPU phases (6 rows: chain phase 1/2/3, indie phase 1/2/3)
- Chain schedules (10 chains × 8 columns)
- Independent hotel parameters
- CEO salary + social % + step-ups
- Team roster
- Opex tiers
- One-time costs
- Equity, kicker, vesting, anti-dilution

### Sheet 2: Monthly P&L (48 columns + 4 annual summary columns)
- Rows 5-14: Per-chain active hotels (formula referencing Assumptions)
- Row 15: Total chain active
- Row 16: Independent active
- Row 17: Total active
- Row 18: Chain paying (post-trial)
- Row 19: Total paying
- Row 21: Chain revenue (CHF)
- Row 22: Indie revenue (CHF)
- Row 23: Total revenue (CHF)
- Row 24: ARR (CHF) = revenue × 12
- Rows 27+: Costs (CEO, team, AI, opex, processing)
- Row 48: Total costs
- Row 51: EBITDA
- Annual summaries in columns 51-54 (Y1-Y4)

### Sheet 3: Cash Flow
- Cash inflows: initial capital (M1 only) + revenue
- Cash outflows: one-time (M1) + people + tech + G&A + S&M + processing + contingency
- Net cash flow, closing balance, runway months
- Salary runway clause check row

### Sheet 4: Valuation & Exit
- ARR at M12/M24/M36/M48
- Valuation matrix (6x/8x/10x/12x ARR)
- Marco's equity value with kicker tiers
- Salary sacrifice analysis

### Sheet 5: Sensitivity
- ARPU sensitivity on Y4 ARR
- Breakeven drivers

### Sheet 6: Vesting & Equity
- Vesting tranches with projected values
- Exit kicker table
- PSOP example
- Anti-dilution floors

---

## Formatting Requirements

- **Font:** Calibri 10pt throughout, 14pt for sheet titles
- **Color palette (Lumina brand):**
  - Ink: #1A120B (headers, titles)
  - Cream: #F5EFE6 (section backgrounds)
  - Terracotta: #C17F59 (accents)
  - Deep Terracotta: #8B4A2B (totals borders)
  - Gold: #C9A96E (subtle borders)
- **Column widths:** A=42-44px (labels), B-AW=13px (months)
- **Number formats:**
  - CHF: `"CHF "#,##0` with red negatives in parentheses
  - EUR: `#,##0`
  - Percentages: `0.0%`
  - Counts: `#,##0`
- **Freeze panes:** B4 on P&L and Cash Flow (freeze labels + header)
- **Negative numbers in red**

---

## Known Bugs in Current Script (MUST FIX)

1. **Capital: EUR 200K converted to CHF 216K** — Should be CHF 200,000 flat. Remove the conversion formula. Hard-code CHF 200,000 in Assumptions and reference that directly in Cash Flow.

2. **FX conversion direction** — Double-check EVERY formula that converts EUR↔CHF. The rate is 0.9224 (EUR per CHF). To convert EUR→CHF: divide by rate. To convert CHF→EUR: multiply by rate. Verify this is consistent everywhere.

3. **Cash Flow initial capital references Assumptions!B12** which is currently `=B11/B6` (EUR→CHF conversion). Once you fix #1, B12 should just be 200000 (hard CHF input). Delete B11 (EUR capital) entirely or keep it as a note.

4. **Verify one-time costs conversion** — `Assumptions!B83/Assumptions!B6` converts EUR one-time costs to CHF. This IS correct (one-time costs are truly EUR-denominated). Just make sure it doesn't accidentally also include the capital.

5. **Verify the ARPU phase breakpoints** — Revenue formulas must use `IF(m>=37, phase3, IF(m>=24, phase2, phase1))`. NOT m>=25 or m>=13.

---

## Validation Checklist (RUN AFTER BUILDING)

After generating the xlsx, run the LibreOffice recalc script at `mnt/.claude/skills/xlsx/scripts/recalc.py` to populate formula cached values, then verify:

1. **Zero formula errors** (recalc reports total_errors = 0)
2. **Breakeven at M12** (EBITDA row first goes positive at M12)
3. **Cash never goes negative** (minimum closing balance > 0)
4. **Lowest cash ~M11** around CHF 15-20K
5. **M12 metrics close to proposal:** ~45 paying hotels, ~48 active (proposal says 32 paying / 41 active — our model is slightly higher because proposal's numbers are approximate)
6. **Y1-Y2 revenue matches flat €1K ARPU** (growth only from M24)
7. **Y3-Y4 ARR higher than proposal** due to ARPU growth (this is expected)
8. **CEO salary at M1 = ~CHF 10,033/mo** (8,840 × 1.135)
9. **Initial capital in Cash Flow M1 = CHF 200,000** (not 216K)
10. **ARR at M12 in EUR** ≈ €540K (45 paying × €1K × 12)
11. **Annual column sums** (Y1-Y4) match sum of their 12 monthly values

Print a verification table with all these checks. If ANY check fails, fix it before saving.

---

## How to Run

```bash
# Generate the xlsx
python build_model_v4_chf.py

# Recalc formulas via LibreOffice
python mnt/.claude/skills/xlsx/scripts/recalc.py mnt/tercier/lumina-financial-model-v2.xlsx

# Verify (write a verification script that checks all items above)
python verify_model.py
```

---

## What Success Looks Like

A clean, professional, correctly-formulated 48-month financial model that:
- Is entirely in CHF with proper EUR→CHF conversion where needed
- Has CHF 200K initial capital (not 216K)
- Breaks even at M12
- Shows ARPU growth from M24 (justified by product maturation)
- Matches the Lumina Proposal's hotel count trajectory
- Includes all counterproposal terms (kicker, vesting, salary step-ups with runway clause, anti-dilution)
- Is well-formatted with the Lumina brand palette
- Has 3,700+ formulas and zero errors
- Can be opened in Excel and every number traces back to Assumptions

**Do not cut corners. Read the source documents. Validate every formula.**
