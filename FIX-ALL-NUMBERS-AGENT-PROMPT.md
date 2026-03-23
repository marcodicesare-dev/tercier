# Agent Prompt: Fix All Financial Numbers for Consistency

## The Problem

The EUR/CHF exchange rate was wrong across multiple files. The real rate is **1 EUR = 0.91 CHF** (ECB/Reuters, March 23, 2026). Several files used a fabricated rate of 1.08 (the conversion was flipped). This cascaded wrong CHF numbers throughout the business plan, pitch deck, and simulator.

**The xlsx financial model used 0.90 which was nearly correct.** The business plan v4 used an implied 1.08 which was wrong. Everything needs to be aligned to **0.91**.

## Source of Truth

### Exchange rate
- **EUR/CHF = 0.91** (1 EUR buys 0.91 CHF)
- EUR 2,000/mo = **CHF 1,820/mo** (not 2,160)
- EUR 1,500/mo = **CHF 1,365/mo** (not 1,620)

### Costs (all in CHF — these DO NOT change)
- OPEX (no salary): CHF 4,530/mo (CHF 54,360/yr)
- Founder salary: CHF 4,000/mo gross
- Employer social contributions: CHF 320/mo (8%)
- **Total monthly burn: CHF 8,850** (unchanged)
- One-time costs: CHF 7,600

### Correct derived numbers (at EUR 2,000/mo ARPU, FX=0.91)
- Revenue per hotel: **CHF 1,820/mo**
- Breakeven at EUR 2,000/mo: **5 hotels** (8,850/1,820 = 4.86 → 5)
- Breakeven at EUR 1,500/mo (PoV): **7 hotels** (8,850/1,365 = 6.48 → 7) — WAS 6, NOW 7
- Surplus at 10 hotels: **+CHF 9,350/mo** (was 12,750)
- Surplus at 20 hotels: **+CHF 27,550/mo** (was 34,350)

### Correct P&L table (replaces old one everywhere)
| Hotels | Revenue (CHF) | Costs (CHF) | Net P&L (CHF) |
|--------|--------------|-------------|---------------|
| 0 | 0 | -8,850 | -8,850 |
| 2 | 3,640 | -8,850 | -5,210 |
| 4 | 7,280 | -8,850 | -1,570 |
| 5 | 9,100 | -8,850 | +250 |
| 6 | 10,920 | -8,850 | +2,070 |
| 8 | 14,560 | -8,850 | +5,710 |
| 10 | 18,200 | -8,850 | +9,350 |
| 15 | 27,300 | -8,850 | +18,450 |
| 20 | 36,400 | -8,850 | +27,550 |

### Peak cash deficit
With the corrected FX and a realistic hotel ramp (0 hotels M1-3, slow build to 10 by M12):
- **Peak deficit: ~CHF 60,000 at month 9** (was 64,300 — exact number depends on ramp shape, recalculate from the model)
- Deficit repaid by approximately **month 15** (was 17)
- Seed of CHF 120-150K still covers everything comfortably

### What does NOT change
- All Monte Carlo v2 data (hotels, ARR, exit values) — these are in EUR and don't depend on FX
- All pricing tiers (EUR 1,000-1,500 / EUR 1,500-2,500 / EUR 2,500-5,000) — these are in EUR
- All cost line items (already in CHF)
- Total burn (CHF 8,850)
- Market sizing numbers (TAM, SAM — in EUR)
- Competitive landscape data
- Survey data (37% buy likelihood, 79% PMS deal killer, etc.)
- Cap table, equity structure, hiring triggers
- Everything denominated purely in EUR or purely in CHF

## Files to Fix

### 1. `business-plan-v4-march-2026.md`

Find and replace every instance where EUR was converted to CHF using the wrong rate. Key locations:

- **Breakeven section** (around line 290-302):
  - "At EUR 1,500/mo proof-of-value pricing (CHF ~1,620/mo), breakeven = 6 hotels" → **"(CHF ~1,365/mo), breakeven = 7 hotels"**
  - "At EUR 2,000/mo full pricing (CHF ~2,160/mo), breakeven = 5 hotels" → **"(CHF ~1,820/mo), breakeven = 5 hotels"**
  - "After breakeven, every hotel adds ~CHF 2,160/month" → **"~CHF 1,820/month"**
  - "At 10 hotels: +CHF 12,750/mo surplus" → **"+CHF 9,350/mo surplus"**
  - "At 20 hotels: +CHF 34,350/mo" → **"+CHF 27,550/mo"**

- **Monthly P&L chart data** (around line 298-300): Replace the entire data series with the corrected P&L table above

- **Cash position chart** (around line 260-265): Recalculate the month-by-month cash position using CHF 1,820/hotel revenue. The ramp assumptions stay the same — just the per-hotel revenue changes.

- **"What this means" section** (around line 269-274): Peak deficit changes from 64,300 to approximately 60,000. Recalculate the formula:
  > X = Share capital (CHF 100K) + Peak deficit (~CHF 60K) + Buffer
  > X = CHF 120-150K (conclusion unchanged — still enough)

- **Salary table** (around line 284-287): Runway column changes. With 0 revenue: 150,000 / 8,850 = ~17 months (was 22 — wait, check this: the old BP also said 22 months which was wrong even then. 150,000/8,850 = 16.9 ≈ 17 months.)

- **"10 paying clients" math** (around line 378-401): "10 clients at EUR 2,000/mo = EUR 20K MRR = the company is already profitable" — this is in EUR and stays correct. But "CHF 204K Year 1 gross profit" in the equity table needs rechecking: 10 hotels × CHF 1,820 × 12 = CHF 218,400 gross revenue. Minus costs: 218,400 - 106,200 = CHF 112,200 operating profit. The old 204K was wrong.
  Actually trace the exact formula used and fix it.

- **Hiring trigger MRR ranges** (around line 471-483): These are in EUR and correct. But double-check that the CHF equivalents mentioned anywhere match.

- Search the entire file for "2,160" and "12,750" and "34,350" and "64,300" — replace all with corrected values.

### 2. `build-deck.js` (the pitch deck generator)

This file generates the PPTX. After editing, **re-run it** with `node build-deck.js` to regenerate the deck.

- **Slide 10 (Unit economics), around line 598-634:**
  - ARPU card: "EUR 2,000/month" stays. Sub text "Conservative. Blended ACV grows to ~EUR 34K" stays.
  - Monthly burn: "CHF 8,850" stays ✓
  - Breakeven: "5-6 hotels" → **"5-7 hotels"** (5 at full pricing, 7 at PoV)
  - Sub text: "5 at full pricing, 6 at PoV" → **"5 at full pricing, 7 at PoV"**
  - Peak deficit: "CHF 64K" → **"CHF ~60K"**
  - Sub text: "Month 9. Repaid by month 17." → **"Month 9. Repaid by ~month 15."**
  - Bottom text line 631-633: "At 10 hotels: CHF 12,750/mo surplus. At 20 hotels: CHF 34,350/mo." → **"At 10 hotels: CHF 9,350/mo surplus. At 20 hotels: CHF 27,550/mo."**

- **Slide 11 (The money), around line 640-729:**
  - Top description: "Peak cash deficit before revenue catches up: CHF 64,300 at month 9" → **"CHF ~60,000 at month 9"**
  - Cost table row: `["Founder compensation (salary + social)", "4,320", "51,840"]` stays ✓ (CHF costs don't change)
  - All other cost rows stay ✓

- **Slide 12 (Runway & P/L), around line 734-869:**
  - Header text: "Fixed costs: CHF 8,850/mo | At full pricing (EUR 2K/mo = ~CHF 2,160)" → **"= ~CHF 1,820)"**
  - **Replace the entire plData array** (around line 749-758) with:
    ```javascript
    const plData = [
      { hotels: "0", rev: "0", costs: "-8,850", net: "-8,850", clr: C.red },
      { hotels: "2", rev: "3,640", costs: "-8,850", net: "-5,210", clr: C.red },
      { hotels: "4", rev: "7,280", costs: "-8,850", net: "-1,570", clr: C.red },
      { hotels: "5", rev: "9,100", costs: "-8,850", net: "+250", clr: C.green },
      { hotels: "6", rev: "10,920", costs: "-8,850", net: "+2,070", clr: C.green },
      { hotels: "10", rev: "18,200", costs: "-8,850", net: "+9,350", clr: C.green },
      { hotels: "15", rev: "27,300", costs: "-8,850", net: "+18,450", clr: C.green },
      { hotels: "20", rev: "36,400", costs: "-8,850", net: "+27,550", clr: C.green },
    ];
    ```
  - Bottom text: "Breakeven: 5 hotels at full pricing, 6 at PoV" → **"5 at full pricing, 7 at PoV"**
  - **Recalculate the cashData array** (around line 803-813) using FX=0.91 and the BP's ramp assumptions. The values should be recalculated — don't just copy old values.
  - Breakeven month text: "Timeline: M6-9" stays (still reasonable)

- **After all edits, run:** `node build-deck.js` to regenerate `mnt/tercier/tercier-deck-march-2026.pptx`

### 3. `tercier-simulator.html`

- **Already fixed:** FX is now 0.91 ✓
- **But verify** the initial HTML KPI values match what the JS will compute at defaults:
  - k-burn: CHF 8,850 ✓
  - k-be: should show "5 hotels" ✓ (8850/1820 = 4.86 → 5)
  - k-runway: 150000/8850 = 16.9 → "16 months" (the HTML currently says "17 months" — check if Math.floor gives 16)
  - k-peak: The simulator computes its own from linear ramp — this is fine, it's a simulator
  - k-surplus: should compute 10*1820-8850 = 9350 ✓
- The initial HTML text values (before JS overwrites them) should be updated to avoid a flash of wrong numbers. Update these in the HTML:
  - `CHF 12,750/mo` → `CHF 9,350/mo`
  - `17 months` → `16 months` (if that's what JS computes)
  - Any other KPI initial values that changed

### 4. `tercier-financial-model.xlsx`

This is the 12-sheet Excel model. Key changes:

- **Assumptions sheet:**
  - EUR/CHF rate: change from 0.90 to **0.91**
  - Founder salary: The xlsx has CHF 5,000/mo (EUR 5,556). The BP v4 says **CHF 4,000/mo**. Update to CHF 4,000/mo = **EUR 4,396/mo** (at 0.91 FX). Actually — founder salary is a CHF cost, so keep it in CHF as 4,000. The EUR equivalent is 4,000/0.91 = EUR 4,396.
  - Verify the note says "Source: ECB/Reuters, March 2026" and update the rate

- **3-Stage P&L sheet:**
  - Founder salary row (currently 5,556 EUR): update to match CHF 4,000 → EUR 4,396
  - If formulas reference the FX assumption cell, they should auto-cascade. If hardcoded, update manually.
  - Verify breakeven rows recalculate correctly

- **Investment & Capital sheet:**
  - Founder salary line: "CHF 60K/yr" → **"CHF 48K/yr"** (4,000 × 12). The 18-month figure: CHF 48K × 1.5 = CHF 72K → EUR 79,121 (at 0.91). Was EUR 100,000.
  - All lines using FX: recalculate with 0.91 instead of 0.90
  - Peak deficit reference: update if hardcoded

- **All other sheets:** If they reference the Assumptions sheet FX cell, they should auto-update. If any values are hardcoded, find and fix them.

- **After editing, recalculate formulas** using: `python3 scripts/recalc.py tercier-financial-model.xlsx`

## Summary of Number Changes

| Number | Old (wrong) | New (correct) | Where it appears |
|--------|------------|---------------|-----------------|
| EUR/CHF | 1.08 (BP) / 0.90 (xlsx) | **0.91** | BP, deck, simulator, xlsx |
| CHF per hotel at EUR 2K | 2,160 | **1,820** | BP, deck |
| CHF per hotel at EUR 1.5K | 1,620 | **1,365** | BP, deck |
| Breakeven at PoV | 6 hotels | **7 hotels** | BP, deck |
| Breakeven at full | 5 hotels | **5 hotels** (unchanged) | — |
| Surplus at 10 | +12,750 | **+9,350** | BP, deck, simulator initial HTML |
| Surplus at 20 | +34,350 | **+27,550** | BP, deck |
| Peak deficit | 64,300 | **~60,000** (recalculate exactly) | BP, deck |
| Deficit repaid | Month 17 | **~Month 15** (recalculate) | BP, deck |
| Founder salary (xlsx) | CHF 5,000/mo | **CHF 4,000/mo** | xlsx only |
| Runway (0 revenue) | 22 months | **16 months** (150K/8850) | BP |

## Verification

After all fixes:
1. Run `node build-deck.js` → check slide 10, 11, 12 numbers
2. Open `tercier-simulator.html` in browser → verify default KPIs match
3. Run `python3 scripts/recalc.py tercier-financial-model.xlsx` → verify 0 formula errors
4. Search all 4 files for "2,160" — should find zero matches
5. Search all 4 files for "12,750" — should find zero matches
6. Search all 4 files for "64,300" — should find zero matches (replaced with ~60K or recalculated)
7. Cross-check: breakeven at full pricing = 5 in all files, breakeven at PoV = 7 in all files
