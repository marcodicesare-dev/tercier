# Tercier Synthetic Buyer Survey — Run Report

**Run ID:** run-2026-03-13-full-v1
**Date:** 2026-03-13
**Mode:** Full ICP cohort
**Pilot:** run-2026-03-13-pilot-v1 (5 hotels, 20/20 success, QA passed 22/22)

## Verified API Design Choices

### API Pattern: Responses API (`/v1/responses`)
- **Decision:** Use Responses API, not Chat Completions
- **Basis:** OpenAI docs (March 2026) explicitly recommend Responses API for all new projects
- **Key parameters:**
  - `instructions` (system prompt, replaces `messages[0].role=system`)
  - `input` (user prompt)
  - `text.format` (structured output schema, replaces `response_format`)
  - `prompt_cache_key` (routing hint for prefix cache reuse)

### Batch API
- **Endpoint:** `/v1/responses` (confirmed supported by Batch API)
- **Format:** JSONL with `custom_id`, `method: POST`, `url: /v1/responses`, `body: {...}`
- **Completion window:** 24h (only option)
- **Limits:** 50,000 requests per batch, 200MB input file

### Models
- **Interview + Adversarial:** `gpt-5-mini` (historical run-time pricing snapshot; do not treat this file as a current pricing reference)
- **Judge:** `gpt-5` (historical run-time pricing snapshot; do not treat this file as a current pricing reference)
- **GPT-5 family constraints:** No temperature, no top_p, no max_tokens. Use `max_completion_tokens` only if needed.
- **Structured outputs:** `text.format.json_schema` with `strict: true` — 100% schema adherence guaranteed

### Prompt Caching
- `prompt_cache_key` used per role per phase:
  - `tercier-interview-1.0-gm_owner`
  - `tercier-interview-1.0-commercial_marketing`
  - `tercier-adversarial-1.0`
  - `tercier-judge-1.0`
- Automatic caching applies to prompts >1,024 tokens
- `prompt_cache_key` is an additional routing hint (keep <15 RPM per key for best cache hit rate)

### Data Residency
- `eu.api.openai.com` exists for EU data residency but requires Enterprise tier approval
- Not used for this run (standard endpoint)
- If needed for Swiss compliance, switch base URL in `lib/openai.ts`

## Cohort Definition

- **Source:** 2,069 HotellerieSuisse member rows, narrowed to 718 selected enriched dossiers
- **ICP filter:** 4+ stars AND ADR >= CHF 250 AND enrichment_status = 'enriched'
- **Result:** 272 hotels (83 five-star, 189 four-star)
- **Categories:** 219 Premium, 14 Luxury, 39 unclassified

## Pipeline Architecture

```
Phase 0: Build Cohort (01-build-cohort.ts)
  → input/cohort-dossiers.jsonl (272 normalized dossiers)

Phase 1-2: Build Interview Batch (02-build-interview-batch.ts)
  → raw/interview-batch-input.jsonl (1,632 requests: 272 × 2 roles × 3 reps)

Phase 2: Run Interviews (03-run-interviews.ts --mode=direct)
  → raw/interview-results.jsonl

Phase 3: Aggregate Replications (04-aggregate-replications.ts)
  → processed/aggregated-interviews.jsonl (544 hotel-role summaries)

Phase 4: Adversarial Critique (05-run-adversarial.ts)
  → raw/adversarial-results.jsonl (544 critiques)

Phase 5: Judge Pass (06-run-judge.ts) [gpt-5]
  → processed/judge-results.jsonl (544 judge outputs)

Phase 6: Hotel-Level Merge (07-merge-hotel-results.ts)
  → processed/hotel-merged-results.jsonl (272 merged results)

Phase 7: Analysis + Deliverables (08-analyze.ts)
  → analysis/*.json + deliverables/*.csv + executive-summary.md

QA: Validation (09-qa-run.ts)
  → 22 checks, all must pass
```

## Survey Design

### Modules per Interview
- **Module A:** Problem/Value Discovery (7 problems × salience + workarounds, top 3 justifiers, proof metric, buying lane)
- **Module B:** Pricing Acceptance (Gabor-Granger ladder at 6 price points, resistance threshold, realistic band, replacement anchors)
- **Module C:** No-Brainer Threshold (requirements at CHF 3k and 5k, deal killer, proof package ranking)

### Roles
- `gm_owner` — General Manager / Owner (budget authority, operations perspective)
- `commercial_marketing` — Commercial / Marketing Director (marketing spend, channel perspective)

### Replications: 3 per hotel-role (full run)
Aggregation uses median for numeric fields, majority voting for categoricals, frequency-weighted for ranked lists.

## Cost Estimate (Full Run)

| Phase | Requests | Model | Input/req | Output/req | Est. Cost |
|-------|----------|-------|-----------|------------|-----------|
| Interviews | 1,632 | gpt-5-mini | ~2.5K tok | ~2.8K tok | ~$1.30 + $9.14 = $10.44 |
| Adversarial | 544 | gpt-5-mini | ~3K tok | ~1K tok | ~$0.41 + $1.09 = $1.50 |
| Judge | 544 | gpt-5 | ~8K tok | ~1.5K tok | ~$5.44 + $8.16 = $13.60 |
| **Total** | **2,720** | | | | **~$25.54** |

(Batch API would halve this to ~$12.77. Direct mode used for speed.)

## Key Assumptions

1. Synthetic personas simulate plausible buyer behavior but cannot capture actual interpersonal dynamics, internal politics, or real budget negotiations
2. Website-derived enrichment is the primary source of hotel positioning data — hotels with thin websites may produce less grounded responses
3. The adversarial pass and judge pass apply pessimistic corrections, but systematic optimism bias remains possible
4. At run time, market-segment coverage was incomplete enough that some analysis fell back to star rating and price category; the current enriched master is more complete
5. Revenue proxy is derived from ADR × rooms × 365 × occupancy assumption — actual revenue may differ significantly

## Files

```
output/synthetic-survey/run-2026-03-13-full-v1/
├── config/
│   ├── run-config.json
│   ├── cohort-summary.json
│   └── interview-prompts.json
├── input/
│   ├── cohort-dossiers.jsonl
│   └── cohort.csv
├── raw/
│   ├── interview-batch-input.jsonl
│   ├── interview-results.jsonl
│   ├── interview-usage.json
│   ├── adversarial-batch-input.jsonl
│   ├── adversarial-results.jsonl
│   ├── judge-batch-input.jsonl
│   └── judge-results.jsonl (→ processed/)
├── processed/
│   ├── aggregated-interviews.jsonl
│   ├── judge-results.jsonl
│   └── hotel-merged-results.jsonl
├── analysis/
│   ├── segment-analysis.json
│   ├── pricing-curves.json
│   ├── objection-clusters.json
│   └── proof-package-rankings.json
├── deliverables/
│   ├── ranked-targets-full.csv
│   ├── ranked-targets-top50.csv
│   └── executive-summary.md
├── CHECKPOINTS.json
├── RUN_REPORT.md
└── FAILURES.md
```
