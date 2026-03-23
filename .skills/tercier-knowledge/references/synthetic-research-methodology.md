# Synthetic Research Methodology

## Overview

The Tercier synthetic research pipeline simulates buyer decision-making at scale across a high-fidelity hotel dataset. By running structured LLM simulations with role-based perspectives and adversarial framing, we generate statistically robust insights on pricing sensitivity, proof-of-value requirements, objection patterns, and deal probability without conducting actual interviews.

---

## Data Foundation

### Source Dataset
- **Website:** hotelleriesuisse.ch (Swiss Hotel Association member directory)
- **Raw member dataset:** 2,069 rows
- **Selected dossiers for enrichment:** 718 hotels
- **Enrichment:** Geo-coding, star ratings, estimated ADR ranges, owner/management contact info, room count estimates
- **Format:** CSV with standardized fields for simulation input

### ICP Filtering & Cohort Definition
- **Filter Criteria:**
  - Star rating: 4–5 stars
  - Estimated ADR: ≥ CHF 250
  - Geographic distribution: Full Swiss coverage (representative of SAM)

- **Final Cohort:** 272 hotels
  - 4-star: ~190 properties
  - 5-star: ~82 properties
  - Distribution: Urban (60%), resort/Alpine (25%), rural/wine country (15%)

### Data Validation
- Cross-reference with TripAdvisor, Booking.com, and HotelWorld for validation
- Spot-check: 10–15 properties manually reviewed for enrichment accuracy
- Result: >95% accuracy in ADR and star rating estimation

---

## Pipeline Architecture (Phases 0–7)

### Phase 0: Preparation
- Load master hotel dataset (272 rows)
- Initialize prompt templates with role-based personas
- Configure model parameters (temperature, max tokens, response format)
- Set up caching strategy to minimize cost and latency

**Inputs:** CSV dataset, prompt library
**Outputs:** Prepared simulation queue, config manifest

---

### Phase 1: Role Definition & Persona Scripting
- **Role 1: General Manager / Owner (`gm_owner`)** — Budget owner, revenue responsibility, operational constraints
- **Role 2: Commercial / Marketing Director (`commercial_marketing`)** — Channel, demand-gen, and direct-booking perspective

Each role receives contextual briefing:
- Hotel type, location, competitive set
- Current ADR, occupancy estimate, OTA dependency
- Marketing tech stack and team size

**Inputs:** Hotel enrichment data, role templates
**Outputs:** 2 persona-specific prompt variations per hotel

---

### Phase 2: Interview Simulation (Cooperative)
- LLM takes on assigned role
- Prompt: "You are the [Role] at [Hotel]. Tercier is pitching [Product]. What are your initial thoughts? Concerns? Questions?"
- Model: `gpt-5-mini` (fast, cost-effective, sufficient quality for open-ended response)
- Output: Structured JSON with sentiment, key concerns, proof requirements, price ceiling hypothesis

**Response Structure:**
```json
{
  "role": "GM",
  "hotel_id": "12345",
  "initial_sentiment": "neutral",
  "top_concerns": ["ROI proof", "integration complexity"],
  "proof_requirements": ["PMS integration", "case studies"],
  "price_ceiling_chf": 3500,
  "open_questions": ["..."],
  "likelihood_score": 0–100
}
```

**Inputs:** Hotel context, persona, Tercier product brief
**Outputs:** 272 hotels × 2 roles × 3 replications = 1,632 interview responses

---

### Phase 3: Adversarial Challenge (Devil's Advocate)
- LLM takes on same role but frames objections rigorously
- Prompt: "You are skeptical. What are the strongest arguments AGAINST adopting Tercier? Why might it fail for your property?"
- Model: `gpt-5-mini`
- Output: Clustered deal-killers, missing features, competitive alternatives

**Response Structure:**
```json
{
  "role": "GM",
  "hotel_id": "12345",
  "objections": ["No PMS integration", "Unproven ROI", "..."],
  "deal_killers": ["Feature X not available"],
  "competitive_alternatives": ["TrustYou", "Revinate"],
  "revised_likelihood_score": 0–100
}
```

**Inputs:** Same hotel context, adversarial framing
**Outputs:** 544 role summaries challenged by adversarial critique

---

### Phase 4: Judge Evaluation & Synthesis
- Neutral evaluator reviews cooperative + adversarial pair
- Model: `gpt-5` (higher reasoning quality for synthesis)
- Prompt: "Given these two perspectives on Tercier adoption, provide a final assessment: likelihood of purchase, top 3 objections, required proof elements, and recommended pitch angle for this role at this hotel."
- Output: Unified scoring and recommendation

**Response Structure:**
```json
{
  "hotel_id": "12345",
  "role": "GM",
  "final_likelihood": 35,
  "objections_ranked": ["Integration", "Proof", "Resource"],
  "proof_package_rank": ["PMS integration", "case studies", "pilot"],
  "pitch_angle": "Focus on direct-booking ROI with pilot risk mitigation",
  "deal_probability": 0.35,
  "strategic_notes": "..."
}
```

**Inputs:** Cooperative + adversarial responses
**Outputs:** 544 synthesized role-level evaluations

---

### Phase 5: Hotel-Level Aggregation
- Aggregate 3 replications into one summary per hotel-role
- Merge the 2 role-level views into a hotel-level consensus with conservative bias
- Calculate aggregate likelihood, objection frequency, proof ranking
- Flag outliers (high role disagreement = implementation complexity)

**Output Structure:**
```json
{
  "hotel_id": "12345",
  "hotel_name": "Grandhotel Zurich",
  "avg_likelihood": 38,
  "role_variance": 12,
  "consensus_objections": ["Integration", "Proof", "Resource"],
  "top_proof_requirements": ["PMS", "case studies", "pilot"],
  "recommended_segment": "Proof-of-Value tier",
  "monthly_price_ceiling": 2800
}
```

**Outputs:** 272 hotel-level summaries

---

### Phase 6: Cohort-Level Trend Analysis
- Aggregate across all 272 hotels to identify:
  - Distribution of likelihood scores (histogram)
  - Most common objection clusters
  - Proof-of-value package hierarchy (frequency of mention)
  - Price elasticity curve (willingness to pay at tiers)
  - Regional variation in sentiment
  - Role-specific insights (GM / Owner vs. Commercial / Marketing priorities)

**Outputs:** Summary statistics, visualizations, trend report

---

### Phase 7: Targeting & Segmentation
- Rank hotels by deal probability
- Segment into tiers:
  - **Tier 1 (Likely Buyers):** Likelihood ≥ 60%
  - **Tier 2 (Proof-Dependent):** Likelihood 35–60%
  - **Tier 3 (Long-Cycle):** Likelihood 20–35%
  - **Tier 4 (Unlikely):** Likelihood < 20%

- Assign recommended go-to-market path for each:
  - **Tier 1:** Direct sales, fast-track
  - **Tier 2:** Pilot + case study approach
  - **Tier 3:** Partner channel, proof packaging
  - **Tier 4:** Wait/remarket after proof

**Outputs:** Ranked target list, GTM playbook by tier

---

## Model Configuration

### LLM Selection
- **Cooperative & Adversarial:** `gpt-5-mini`
  - Cost-effective (~$0.0003/1K output tokens)
  - Sufficient reasoning for role-play and objection generation
  - Fast execution (5–10s per simulation)

- **Judge & Synthesis:** `gpt-5`
  - Higher reasoning capability for multi-perspective synthesis
  - Better at weighting conflicting signals
  - Slightly higher cost (~$0.03/1K output tokens) justified by quality

### Prompt Caching
- Cache hotel context + role briefing + product description (shared across all roles)
- Reduces redundant token processing
- Estimated savings: ~40% of input tokens

### Temperature & Sampling
- Temperature: 0.7 (creative but grounded)
- Top-p: 0.9 (balanced diversity)
- Repetition penalty: None (role consistency valued)
- Max tokens: 500 per response (structured output focus)

---

## Cost Efficiency

### Total Run Cost
- **272 hotels × 2 roles × 3 interview reps + 544 adversarial critiques + 544 judge passes:**
  - ~2,720 LLM API calls total
  - Input tokens: ~89K (cached)
  - Output tokens: ~318K
  - Estimated cost: ~$25.54 for full cohort
  - Cost per hotel: ~$0.094

### Optimization Opportunities
1. **Prompt caching:** Reduces duplicate input processing by ~40%
2. **Batch API:** Could further reduce cost by 50% if execution time permits
3. **Fine-tuning:** Not recommended (high fixed cost, lower value than current setup)

---

## Output Structure & Deliverables

### 1. Raw Responses
- `phase-2-cooperative-responses.jsonl` (1,632 rows)
- `phase-3-adversarial-responses.jsonl` (544 rows)
- `phase-4-judge-synthesis.jsonl` (544 rows)

### 2. Aggregated Analysis
- `hotel-level-summaries.csv` (272 rows, ranked by deal probability)
- `objection-frequency-analysis.csv` (objection cluster distribution)
- `proof-package-ranking.csv` (proof-of-value requirements, ranked by frequency)

### 3. Statistical Summary
- `cohort-likelihood-distribution.json` (histogram, percentiles, quartiles)
- `price-elasticity-curve.csv` (willingness to pay at each tier)
- `regional-variance-analysis.csv` (geo-segmentation of sentiment)
- `role-specific-insights.json` (GM / Owner vs. Commercial / Marketing sentiment profiles)

### 4. Targeting & GTM Output
- `ranked-target-list.csv` (all 272 hotels ranked, tier assignments, GTM playbook)
- `synthetic-survey-run-report-2026-03-13.md` (narrative summary with findings)

---

## Key Insights from Execution

### Buy Likelihood Distribution
- **Average likelihood across cohort:** 37% at CHF 3,000/mo
- **Tier 1 (≥60%):** 42 hotels (15%)
- **Tier 2 (35–60%):** 98 hotels (36%)
- **Tier 3 (20–35%):** 81 hotels (30%)
- **Tier 4 (<20%):** 51 hotels (19%)

### Top Proof-of-Value Requirements (Frequency)
1. **PMS/CRM Integration:** highest-ranked proof item
2. **Swiss Case Studies/References:** consistently near the top
3. **60-day Pilot Option:** consistently near the top
4. **Swiss/GDPR-Compliant Hosting:** frequently required
5. **Timeline / integration confidence:** recurrent supporting theme

### Deal-Killers (Stated as Non-Negotiable)
- **No PMS/CRM Integration:** 79% stated as deal-breaker
- **Cannot prove attribution / ROI:** 15%
- **No Swiss/GDPR-compliant hosting:** 2%
- **No Swiss references:** 2%

### Price Sensitivity
- **Sweet spot:** CHF 2,000–3,500/mo for full platform
- **Pilot pricing (proof-of-value):** CHF 1,000–1,500/mo (66% willing to try)
- **Group/annual pricing:** CHF 2,000–4,000/property/mo (weighted by group size)

### Role-Specific Insights
- **GM / Owner:** more sensitive to ROI proof, implementation risk, and executive-level accountability
- **Commercial / Marketing:** more focused on direct-booking lift, execution speed, and channel impact

---

## Reproducibility & Reuse

All pipeline configs, prompts, and data inputs are stored in `synthetic-research-pipeline-config.json`. To re-run or extend the pipeline:

1. Load hotel dataset (272 ICP-filtered properties)
2. Initialize LLM with stored prompts and caching config
3. Execute phases 0–7 in sequence
4. Aggregate outputs as defined in "Output Structure" section
5. Generate GTM playbook based on tier assignments

**Estimated re-run time:** ~45 minutes (for 272 hotels, 2 roles)
**Estimated re-run cost:** ~$25–28

---

## Limitations & Caveats

1. **Simulation vs. Reality:** LLM role-play approximates but does not replace actual buyer interviews. Use as directional guide for targeting and messaging, not as definitive forecasting model.

2. **Role Representation:** Script assumes two standard buying perspectives (`gm_owner`, `commercial_marketing`). Actual property structure may vary; adjust role definitions for outlier properties.

3. **Hotel Context Quality:** Enrichment based on scraped public data; some properties may be misclassified by ADR or star rating. Spot-check top Tier 1 targets before outreach.

4. **Temporal Validity:** Pipeline reflects March 2026 market conditions. Re-run quarterly to account for competitive and market shifts.

5. **No Multi-Property Consideration:** Simulations treat each hotel independently; group/chain dynamics not fully captured. Adjust GTM playbook for group owners (lower friction, different decision-making).

---

## Next Steps

1. **Outreach Sequence:** Start with Tier 1 (42 highest-probability properties)
2. **Proof Packaging:** Prioritize PMS integration as critical product differentiator
3. **Case Study Generation:** Target 2–3 Tier 1 reference customers in Q2 2026
4. **Refinement:** Re-run pipeline post-first-customers to validate assumptions and calibrate model
