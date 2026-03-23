# Prompt: Build Tercier Pitch Deck + BMC + Interactive Simulator

You are building presentation assets for Marco Di Cesare's founding meeting with Amedeo Guffanti and Marco Corsaro (serial entrepreneurs, 2 exits via JAKALA). The meeting is TODAY, 60 minutes, high stakes. Marco is pitching to co-found Tercier, a vertical AI platform for premium hospitality.

## Step 0: Read the skills

Before writing a single line of code, read these skill files:
- `/sessions/practical-tender-maxwell/mnt/.skills/skills/pptx/SKILL.md` (for the deck)

Then proceed.

## Step 1: Read every file below, carefully, line by line

You must deeply understand the full context before producing anything. Do not skim. Do not summarize early. Read, absorb, connect.

### Core documents (read in this order)

1. **Call transcript** (Italian, the voice/tone you must match):
   `/sessions/practical-tender-maxwell/mnt/tercier/Call with Marco Di Cesare.transcript.txt`

2. **Canonical knowledge base** (company identity, people, product layers, survey, Monte Carlo):
   `/sessions/practical-tender-maxwell/mnt/tercier/.skills/tercier-knowledge/SKILL.md`

3. **Business plan v4** (corrected, audited numbers):
   `/sessions/practical-tender-maxwell/mnt/tercier/business-plan-v4-march-2026.md`

4. **Audit report** (what was wrong, what was fixed, what to avoid claiming):
   `/sessions/practical-tender-maxwell/mnt/tercier/AUDIT-REPORT.md`

5. **Meeting flow** (60-min structure, phases, timing, what to show when):
   `/sessions/practical-tender-maxwell/mnt/tercier/meeting-flow-2026-03-22.mermaid`

### Financial model + Monte Carlo

6. **Monte Carlo v2 README** (THE canonical headline numbers, use ONLY these):
   `/sessions/practical-tender-maxwell/mnt/tercier/research/synthetic-survey/run-2026-03-22-business-plan-monte-carlo-v2/README.md`

7. **Monte Carlo v2 results JSON**:
   `/sessions/practical-tender-maxwell/mnt/tercier/research/synthetic-survey/run-2026-03-22-business-plan-monte-carlo-v2/business-plan-monte-carlo-results.json`

8. **Monte Carlo runner** (methodology, assumptions, distributions):
   `/sessions/practical-tender-maxwell/mnt/tercier/research/synthetic-survey/run-2026-03-22-business-plan-monte-carlo-v2/rerun_business_plan_monte_carlo.py`

### Survey research

8. **Survey analysis** (the 1,632 simulation outputs, buy rates, deal killers, willingness to pay):
   `/sessions/practical-tender-maxwell/mnt/tercier/research/synthetic-survey/run-2026-03-22/analysis-survey-results.md`

9. **Survey summary stats**:
   `/sessions/practical-tender-maxwell/mnt/tercier/research/synthetic-survey/run-2026-03-22/summary-stats.json`

10. **Top 10 ICP hotels**:
    `/sessions/practical-tender-maxwell/mnt/tercier/research/synthetic-survey/run-2026-03-22/top-10-icp-hotels.json`

### Market + competitive research

11. **Market research**:
    `/sessions/practical-tender-maxwell/mnt/tercier/research/market-research.md`

12. **Competitive landscape**:
    `/sessions/practical-tender-maxwell/mnt/tercier/research/competitive-landscape.md`

13. **HotellerieSuisse data pipeline**:
    `/sessions/practical-tender-maxwell/mnt/tercier/research/data/README.md`

### Also check for any other .md or .json files in the repo:
```
find /sessions/practical-tender-maxwell/mnt/tercier -name "*.md" -o -name "*.json" | head -60
```

Read anything that looks relevant that isn't in the list above.

## Step 2: What to build

### A. Pitch deck (PPTX, 12 slides)

Use the pptx skill. Follow its instructions precisely.

The deck structure (follows the 60-min meeting flow):

1. **Title slide**: "Tercier" + tagline "Vertical AI for Premium Hospitality" + tercier.ai + date + "Marco Di Cesare, Founder"
2. **Credibility + context**: 9 days of work, what was built (synthetic survey on 272 ICP hotels, Monte Carlo financial model, full business plan, competitive analysis, product architecture). Show the pipeline: 2,069 raw HotellerieSuisse rows -> 718 selected -> 272 ICP hotels -> 1,632 survey simulations. Mention: tercier.ai secured, tercier.com available ($1,200).
3. **Market opportunity**: Swiss premium hospitality (4-5 star), 272 addressable hotels, EUR 9.8M TAM at EUR 3K/mo ARPU. The gap: no vertical AI platform exists for this segment.
4. **Survey headlines**: 37% buy at CHF 3K, 15% buy at CHF 5K, 79% say no-PMS-integration is a deal killer, 72% rate competitive intelligence as critical. These come from 1,632 synthetic buyer interviews (2 roles x 3 replications x 272 hotels, adversarial + judge pass).
5. **Top 10 ICP hotels**: Table from top-10-icp-hotels.json. These are real named Swiss hotels with scores.
6. **Business Model Canvas**: One-slide BMC. Key partners (HotellerieSuisse, PMS vendors, tourism boards), Key activities (AI platform dev, hotel onboarding, data pipeline), Value prop (7-layer AI stack replacing 4-5 point solutions), Customer segments (Swiss 4-5 star independents + small chains), Revenue (SaaS EUR 2-5K/mo + onboarding EUR 3-5K), Channels (direct + association partnerships), Cost structure (cloud infra, team, sales). Pull from business plan v4.
7. **Product architecture**: The 7 layers: Market Intelligence, Voice-of-Customer, Persona & Intent, Competitive Reading, AI Discovery, Decision Engine, Content Engine. One visual showing the stack.
8. **Unit economics**: ARPU EUR 3,000/mo, onboarding EUR 3-5K, gross margin 82%, CAC EUR 8-12K, LTV/CAC 8-12x, payback 3-4 months. Monthly churn 1.5-2.5%.
9. **Financial projections (Operator-seeded scenario)**: Seed CHF 120-150K from Amedeo+Corsaro. M12: 30 hotels. M18: 47 hotels. M36: 115 hotels, EUR 3.99M ARR. M60: EUR 9.21M ARR, exit EUR 45.86M (P50). Show P10/P50/P90 bands.
10. **Financial projections (Follow-on Angel scenario)**: Same seed + milestone-based angel tranche. M12: 35 hotels. M18: 58 hotels. M36: 154 hotels, EUR 5.33M ARR. M60: EUR 13.22M ARR, exit EUR 67.39M (P50).
11. **Operating principles + The Ask**: Marco's salary: CHF 4K/mo (below market, wife earns CHF 130K). Escalation triggers: 10 hotels = CHF 8K, 25 = CHF 12K, 50 = CHF 15K. 2% MRR revenue share. Contribution-based equity targeting 38%. Swiss AG in Zug (11.8% tax). The ask: (1) CHF 120-150K seed, (2) Strategic access to hotel chains, (3) 60-day pilot commitment with one chain.
12. **Next steps + closing**: Pilot kickoff timeline, SHA negotiation, incorporation. "Tercier, tercier.ai"

### B. Interactive simulator (standalone HTML with React + Recharts)

Build a single self-contained HTML file. No build step, no npm, no Vercel. Opens directly in browser.

CDN imports: React 18, ReactDOM 18, Babel standalone, Recharts.

Features:
- Toggle between Operator-seeded and Follow-on Angel scenarios
- 5 interactive sliders: ARPU (EUR 800-5000), Conversion adjustment (50-150%), Churn pressure (0.7-1.5x), Exit multiple (2-12x), Founder equity (20-50%)
- 4 charts: Hotel growth (P10/P50/P90 area bands), ARR growth (P10/P50/P90), Exit scenario bars, Income trajectory (stacked: salary + rev share)
- 5 real-time KPIs: Hotels@M36, ARR@M36, Monthly income@M36, Exit value@M60, Founder take
- Default values must match Monte Carlo v2 P50 numbers exactly
- Dark, premium color palette (dark navy + warm amber/gold accents, hospitality luxury feel)
- NEVER use localStorage or sessionStorage

Base data to hardcode from Monte Carlo v2 results (README.md is the canonical source, cross-check with JSON):
- Operator-seeded P50: M12=30 hotels. M18=47. M30=90. M36=115 hotels, ARR=3990 (EUR 3.99M). M60 ARR=9210 (EUR 9.21M). Exit=45860 (EUR 45.86M).
- Follow-on angel P50: M12=35. M18=58. M30=118. M36=154 hotels, ARR=5330 (EUR 5.33M). M60 ARR=13220 (EUR 13.22M). Exit=67390 (EUR 67.39M).
- Read P10 and P90 bands from the JSON file directly.
- Also include P10 and P90 bands from the same JSON.

Sliders should scale the base data proportionally (e.g., ARPU slider scales ARR linearly, conversion scales hotel count, churn impacts later periods more).

## Step 3: Tone and writing rules

**Read the transcript first.** Match Marco's voice. He's Italian, direct, passionate, informal but smart. Think: a guy who built 6 side projects, mass-generated 1,632 synthetic surveys, and is now telling two serial entrepreneurs why they should back him.

Rules:
- NO em dashes (--). Use periods or commas.
- NO "leverage", "utilize", "harness", "cutting-edge", "game-changing", "revolutionize", "streamline", "empower", "robust", "scalable solution", "drive value", "unlock potential", "best-in-class", "synergy"
- NO filler phrases like "In today's rapidly evolving..." or "In an era of..."
- Write like a person, not a press release
- Short sentences. Concrete numbers. No fluff.
- Italian friendly energy. Confident but not arrogant.
- When in doubt, look at how Marco writes in the transcript and the business plan, and match that register
- The audience (Amedeo, Corsaro) are operators, not VCs. They built and sold companies. They smell bullshit instantly. Every slide must earn its place with data or a clear point.

## Step 4: Number integrity

USE ONLY the Monte Carlo v2 results JSON for all financial numbers. Do not invent, round creatively, or mix with numbers from older documents. The audit report documents exactly what went wrong before. Do not repeat those mistakes.

Key number cross-checks:
- Hotel pipeline: 2,069 raw -> 718 selected -> 272 ICP (NOT 718 ICP)
- Survey: 1,632 simulations (272 hotels x 2 roles x 3 replications), NOT 1,632 hotels
- Operator-seeded P50: M12=30, M18=47, M36=115 hotels / EUR 3.99M ARR, M60 exit=EUR 45.86M
- Follow-on angel P50: M12=35, M18=58, M36=154 hotels / EUR 5.33M ARR, M60 exit=EUR 67.39M
- Seed ask: CHF 120-150K initial angel/operator seed
- Marco's commits: 2,295 across 6 repos (loamly=1574, basquio=139, rabbhole=178, mappa=177, costfigure=130, ghostedbyai=97)
- Marco is the solo founder and built all the knowledge/research/docs. He did NOT build the prototype alone. There's a French dev (34, AI-native) and a senior PM (~40) already in the picture from Amedeo's side.

## Step 5: Output

Save to:
- Deck: `/sessions/practical-tender-maxwell/mnt/tercier/tercier-deck-march-2026.pptx`
- Simulator: `/sessions/practical-tender-maxwell/mnt/tercier/tercier-simulator.html`

Overwrite existing files.

## Step 6: QA

After building both:
1. Convert the PPTX to images and visually verify every slide
2. Read the simulator HTML and verify all numbers match Monte Carlo v2
3. Fix anything broken before declaring done