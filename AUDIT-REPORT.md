# Tercier Audit Report

Audit date: 2026-03-23  
Audited workspace: `/Users/marcodicesare/Documents/Projects/tercier`  
Scope: local-file audit plus current web validation for tax, hospitality market, competitor status, and AI-cost assumptions. This report reflects the current workspace after the FX consistency pass.

## Count Reconciliation

The pipeline counts mostly reconcile once the denominators are labeled correctly.

- `hotelleriesuisse-members-hotels-switzerland.csv` contains **2,069** parsed rows.
- `hotelleriesuisse-members-hotels-switzerland.enriched-master.csv` also contains **2,069** rows.
- The enriched master contains **718** rows with `sr_selected=true`; that is the selected dossier subset, not the raw source count.
- Within the selected subset, **716** rows are `sr_enrichment_status=enriched` and **2** are `missing_website`.
- Applying the stated ICP filter to the enriched master:
  `sr_selected=true`,
  `sr_enrichment_status=enriched`,
  `starRating >= 4`,
  `priceNightlyChf >= 250`
  yields **272** hotels.
- `research/synthetic-survey/run-2026-03-13-full-v1/CHECKPOINTS.json` matches the math exactly:
  **272** cohort hotels,
  **1,632** interviews,
  **544** aggregated hotel-role records,
  **544** judged outputs,
  **272** merged hotels.
- `research/synthetic-survey/run-2026-03-13-full-v1/analysis/pricing-curves.json` rolls up to **36.85%** average buy likelihood at CHF 3,000 and **15.06%** at CHF 5,000, which supports the rounded `37%` / `15%` claims.
- `research/synthetic-survey/run-2026-03-13-full-v1/deliverables/ranked-targets-top50.csv` is properly sorted descending by `priority_score`.
- I spot-checked 10 random hotels from `ranked-targets-full.csv` against `deliverables/hotel-merged-detail.csv`; all 10 matched on score, pricing band, buy likelihoods, delay likelihood, wedge, and blocker. I did not find ranking corruption in that sample.

## 1. Critical Errors

- **The knowledge base still contains pre-fix financial numbers that are now wrong.**  
  `.skills/tercier-knowledge/SKILL.md:127-130` still says peak cash deficit is `CHF 64,300`, breakeven is `6-8 hotels`, and the deficit is repaid by `month 17-18`.  
  `.skills/tercier-knowledge/SKILL.md:164-173` still values `10 clients` at `CHF 204K conservative`.  
  `.skills/tercier-knowledge/SKILL.md:148-151` and `:210` still derive the seed logic from the old cash math.  
  Those numbers no longer match the corrected business plan or simulator logic. Leaving the knowledge base stale is a real audit risk because it presents itself as canonical.

- **The tax memo is internally inconsistent on the core corporate-tax calculation.**  
  `research/zug-vs-zurich-tax-analysis-2026.md:11-20` states the **total effective corporate tax rates** are `11.8%` in Zug/Baar and `19.6%` in Zurich.  
  The same memo later adds federal tax on top again and derives higher effective burdens around `20.4%` and `28.3%` at `research/zug-vs-zurich-tax-analysis-2026.md:201-227`.  
  Those sections cannot both be true.  
  Current external benchmarks support the lower totals, not the double-counted totals:
  [KPMG Switzerland, Clarity on Swiss Taxes 2025](https://assets.kpmg.com/content/dam/kpmgsites/ch/pdf/kpmg-ch-swiss-taxes-2025-clarity.pdf) shows **Zug 11.85%** and **Zurich 19.61%** on the 2025 corporate-tax table.

- **The workbook is still not one coherent model; it mixes incompatible Monte Carlo families.**  
  `tercier-financial-model.xlsx`, sheet `Scenario A — Base Case`, uses the conservative business-plan outputs (`19 / 29 / 84 hotels`, `EUR 2.58M ARR at M36`, `EUR 8.77M ARR at M60`).  
  But `Sensitivity Analysis!A2` / `Sensitivity Analysis!C15` references a different base model with `Base ARR at M60 = EUR 31.54M`.  
  `Scenario C — VC-Accelerated` then uses yet another trajectory (`EUR 34.06M ARR at M60`).  
  These are not sensitivity cases around one base case. They are different narratives stitched into one workbook.

- **The workbook sensitivity table still has the churn labels reversed.**  
  In `tercier-financial-model.xlsx`, sheet `Sensitivity Analysis`:
  row 5 labels churn as `pessimistic` and shows ARR falling to `25,413,329`,
  row 6 labels churn as `optimistic` and shows ARR rising to `35,676,380`.  
  The direction is correct, but the labels remain easy to misread and invite the exact opposite interpretation during a live discussion.

- **The “canonical” market/intelligence artifacts still blur corrected and uncorrected versions of the company.**  
  `meeting-flow-2026-03-22.mermaid:31` and `:56` still say `breakeven ~5-6 hotels`.  
  `.skills/tercier-knowledge/SKILL.md:195` still says `Swiss private capital gains = 0% tax` as an absolute statement and uses the stale exit framing.  
  `tercier-knowledge-graph.html:547` still embeds the old survey-cost and market-story summary.  
  These files are presentation-layer sources, so stale numbers here are not harmless.

## 2. Inconsistencies

- **Legal domicile still drifts between core documents.**  
  `business-plan-v4-march-2026.md:5` says `Tercier AG | Zug, Switzerland`.  
  `business-plan-v3-march-2026.md:8` still says `Tercier AG | Zurich, Switzerland`.  
  If v3 is retained only as history, it needs a cleaner header warning than a casual note at `business-plan-v3-march-2026.md:5`.

- **The seed ask still varies materially across artifacts.**  
  `business-plan-v4-march-2026.md:269-274`, `:384`, `:412` now centers on `CHF 120-150K`.  
  `meeting-flow-2026-03-22.mermaid:56` uses the same range.  
  But `.skills/tercier-knowledge/SKILL.md:171` still includes `CHF 200K` and `CHF 500K` contribution tables built on stale inputs, and `business-plan-v3-march-2026.md:803` still frames `CHF 200K` as the hard seed cap.  
  That is too much spread for something that should be a settled financing story.

- **Breakeven is still described as both `5-7 hotels` and `~15 hotels` depending on the artifact.**  
  `business-plan-v4-march-2026.md:291-303` now supports `5 hotels` at full pricing and `7 hotels` at PoV pricing.  
  `meeting-flow-2026-03-22.mermaid:31` and `:56` still say `~5-6 hotels`.  
  Other planning artifacts elsewhere in the repo use `~15 hotels` language. The investor story is still not fully harmonized.

- **The market denominators are real, but the docs still switch between them too loosely.**  
  The repo uses:
  `2,069` raw rows,
  `718` selected dossiers,
  `649` four/five-star rows,
  `329` ADR-qualified Swiss premium rows,
  `272` survey cohort rows.  
  `business-plan-v4-march-2026.md:15`, `:98`, `:509`, `:518` moves across these denominators without always signaling the switch.  
  That creates avoidable TAM/SAM confusion.

- **One sentence in the beachhead section mixes two different denominators.**  
  `business-plan-v4-march-2026.md:98` says `329 premium hotels` and then `148 have named GMs`.  
  In the actual enriched data, `148 named GMs` belongs to the broader **649 four/five-star** set, not the **329 premium** set.  
  The 329 premium set has only **77** rows with `gmName` populated. That line is not numerically clean as written.

- **Pricing architecture is still inconsistent between the plan and the older one-pager.**  
  `business-plan-v4-march-2026.md:161-163` prices:
  `Proof of Value = EUR 1,000-1,500`,
  `Intelligence = EUR 1,500-2,500`,
  `Intelligence + Content = EUR 2,500-5,000`.  
  `TERCIER-PRODUCT-ONE-PAGER.md:159-160` still prices:
  `Intelligence = EUR 1,000-1,500`,
  `Intelligence + Content = EUR 2,000-5,000`.  
  Those are not the same commercial architecture.

## 3. Unsupported Claims

- **The warm-intro funnel is still an assertion, not validated evidence.**  
  `business-plan-v4-march-2026.md:361-383` assumes `3-4 warm intros per month` can be converted into `10 paying clients in Year 1`.  
  I found no CRM history, benchmark dataset, or prior funnel evidence in the repo that validates this.  
  This is a planning assumption, not a sourced fact.

- **The per-hotel COGS claim is plausible but not source-backed enough for board-level confidence.**  
  `business-plan-v4-march-2026.md:174` says `EUR 15-50/hotel/month` and `1-2.5% of revenue`, with model-cost deflation of `30-50% per year`.  
  I did not find a model-volume worksheet that ties this to actual token counts, calls per hotel, or provider routing assumptions.  
  External pricing pages do confirm low-end model costs are still cheap enough for this to be plausible, but the exact range remains modeled rather than evidenced:
  [OpenAI pricing](https://openai.com/api/pricing/),
  [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing),
  [Google Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing).

- **“Swiss private capital gains = 0% tax” is stated too absolutely.**  
  `.skills/tercier-knowledge/SKILL.md:186` and `:195` present this as unconditional.  
  Official Swiss federal guidance is narrower: capital gains on movable private assets are generally tax-free, but the treatment depends on the gains actually qualifying as private-asset gains rather than taxable business/professional trading income.  
  Source: [Swiss Federal Tax Administration, The Swiss Tax System](https://www.estv.admin.ch/dam/estv/en/dokumente/allgemein/Dokumentation/Publikationen/schweizer_steuersystem/Das%20schweizerische%20Steuersystem.pdf.download.pdf/Das%20schweizerische%20Steuersystem.pdf) section `9.1.8`.  
  As written, the repo turns a conditional tax position into a universal certainty.

- **Several competitor funding/status lines remain only partially verified.**  
  `business-plan-v4-march-2026.md:145-148` cites compact competitor snapshots.  
  I could validate:
  `Mews` current scale/valuation direction from company materials,
  `Canary` `20,000+ hotels` and recent financing from company materials,
  the new `Lighthouse / The Hotels Network` ChatGPT channel move from an official announcement.  
  I could not fully verify current ownership/funding status from primary sources for every player named in the repo, especially `TrustYou` and `Revinate`, from the materials present here. Those should be treated as **UNVERIFIED** unless replaced with primary citations.

## 4. Stale Data

- **The knowledge base is the biggest stale-data hotspot in the repo.**  
  `.skills/tercier-knowledge/SKILL.md:127-130`, `:148-151`, `:164-175`, `:195`, `:319` still preserve pre-fix numbers and older framing.  
  `.skills/tercier-knowledge/references/synthetic-research-methodology.md:14` still foregrounds `718` as the selected dossier count without enough denominator context.

- **The tax memo uses some numbers that are still directionally right, but the memo itself is stale because its mechanics are wrong.**  
  `research/zug-vs-zurich-tax-analysis-2026.md` needs a rebuild from current primary sources instead of incremental editing.  
  Current external references support the headline rates:
  [KPMG Switzerland tax table](https://assets.kpmg.com/content/dam/kpmgsites/ch/pdf/kpmg-ch-swiss-taxes-2025-clarity.pdf),
  [HotellerieSuisse facts and figures](https://www.hotelleriesuisse.ch/de/branche-und-politik/kennzahlen/wirtschaftskennzahlen),
  [FTA withholding tax page](https://www.estv.admin.ch/estv/en/home/verrechnungssteuer.html).

- **The market-size story needs an official denominator disclaimer.**  
  `business-plan-v4-march-2026.md:509` says `649 four-five star hotels within driving distance`.  
  The internal member-directory data does in fact produce **649** four/five-star rows and **329** ADR-qualified premium rows.  
  But current HotellerieSuisse official classification statistics show **515 four-star** and **111 five-star** hotels at end-2024, or **626** total classified 4-5 star properties, and explicitly note differences between BFS counts and official classification counts.  
  Source: [HotellerieSuisse facts and figures](https://www.hotelleriesuisse.ch/de/branche-und-politik/kennzahlen/wirtschaftskennzahlen) lines 31-60.  
  The internal numbers are not necessarily wrong; they are insufficiently labeled against the official benchmark.

- **The competitor landscape needs a dated refresh, especially on AI-distribution moves.**  
  `business-plan-v4-march-2026.md:121-151` still says “nobody orchestrates.”  
  That overstates the whitespace. Current official channel moves include:
  [The Hotels Network app inside ChatGPT](https://blog.thehotelsnetwork.com/connect-chat-gpt-app-launch),
  plus the repo’s own research memos already acknowledge that Lighthouse / THN and others are moving into AI-mediated distribution.

## 5. Methodology Concerns

- **The synthetic survey is useful for directional insight, not for precise willingness-to-pay inference.**  
  `research/synthetic-survey/run-2026-03-13-full-v1/config/interview-prompts.json` presents a rich Tercier concept and then asks structured buying questions.  
  That is fine for hypothesis generation, but it is still a leading setup with no serious neutral alternative and no live budget owner under real procurement pressure.

- **The survey outputs are more credible than some of the downstream rhetoric.**  
  The exported data cleanly supports:
  `37% buy at CHF 3K`,
  `15% buy at CHF 5K`,
  `79% no-PMS/CRM deal breaker`,
  and the proof-package rank order.  
  The problem is not the exported summary. The problem is how later artifacts over-interpret it.

- **Revenue proxy math is still simplistic.**  
  `research/synthetic-survey/run-2026-03-13-full-v1/RUN_REPORT.md:113-114` states the revenue proxy uses `ADR × rooms × 365 × occupancy assumption`.  
  In the enriched master, `sr_occupancy_assumption` is fixed at **0.68** across the selected sample.  
  That is a reasonable heuristic, but it is not hotel-specific forecasting.

- **The broader financial stack still mixes models too freely.**  
  Conservative operator case, operator-plus-follow-on case, separate global expansion case, and aggressive dual-path case all exist in the repo.  
  Those are scenario families, not one clean model tree.  
  Investor-facing materials should not slide between them without saying so explicitly.

## 6. Missing Risks

- **Integration risk is still underweighted relative to the survey evidence.**  
  The survey’s top deal killer is lack of PMS/CRM integration, yet several GTM materials still pitch the product as if the main barrier is just message clarity and reference proof.  
  That is not what the survey says.

- **AI-distribution competition is a bigger strategic threat than the current plan admits.**  
  The repo often frames the main risk as “a PMS vendor adds this.”  
  The more immediate risk is that distribution and booking-layer incumbents keep expanding into the same AI-discovery surface first.  
  The Hotels Network / Lighthouse move is the clearest example.

- **Key-person risk is still under-modeled.**  
  Even after the wording improvements in `business-plan-v4-march-2026.md:22` and `:184`, the operating plan is still extremely founder-concentrated.  
  The hiring trigger logic is there, but the transition risk from single operator to repeatable customer delivery is still lightly treated.

- **Shareholder-tax mechanics are not fully risk-managed.**  
  The corporate-rate choice is one piece. The economically decisive pieces for founders and investors are also dividend treatment, withholding/refund mechanics, and whether any eventual gain clearly qualifies as private-asset capital gain.  
  The repo does not yet work those through carefully enough.

## 7. Improvements

- **Designate one canonical source for finance.**  
  Right now it is not obvious whether the canonical truth is:
  `business-plan-v4`,
  the workbook,
  the simulator,
  or `.skills/tercier-knowledge/SKILL.md`.  
  Pick one and downgrade the others to derived artifacts.

- **Clean the knowledge artifacts immediately.**  
  `.skills/tercier-knowledge/SKILL.md`,
  `.skills/tercier-knowledge/references/synthetic-research-methodology.md`,
  `meeting-flow-2026-03-22.mermaid`,
  and `tercier-knowledge-graph.html`
  should be treated as mandatory cleanup items, not optional polish.

- **Rebuild the tax memo from primary/current sources only.**  
  Use:
  [KPMG Switzerland tax table](https://assets.kpmg.com/content/dam/kpmgsites/ch/pdf/kpmg-ch-swiss-taxes-2025-clarity.pdf),
  [FTA Swiss Tax System PDF](https://www.estv.admin.ch/dam/estv/en/dokumente/allgemein/Dokumentation/Publikationen/schweizer_steuersystem/Das%20schweizerische%20Steuersystem.pdf.download.pdf/Das%20schweizerische%20Steuersystem.pdf),
  [FTA withholding tax page](https://www.estv.admin.ch/estv/en/home/verrechnungssteuer.html),
  and a current canton/city source for Zurich if you want municipal precision.

- **Version-stamp the market denominator.**  
  State explicitly whether a number comes from:
  internal HotellerieSuisse member-directory extraction,
  official HotellerieSuisse classification stats,
  or BFS / HESTA counts.

- **Show the COGS stack, not just the headline.**  
  A one-page schedule with token volumes, model routing, API calls, and storage assumptions would make the `EUR 15-50/hotel/month` number much more defensible.

- **Label the Monte Carlo families as separate narratives.**  
  Conservative operator case,
  follow-on angel case,
  global-expansion upside case,
  aggressive dual-path case.  
  Do not present them as one continuous model unless you actually unify them.

## 8. Overall Assessment

The work is materially stronger than most zero-to-one founder decks, but it is **not yet clean enough for a sophisticated investor or operator diligence pass**. The raw data pipeline, survey counts, pricing-curve rollups, and the corrected unit economics now look much more coherent. The biggest remaining weakness is that the repo still has **multiple “truth layers”**: the business plan, workbook, deck-support artifacts, and knowledge base do not fully agree on what the company is, what the seed ask is, or which model is canonical. The single highest-priority fix is to collapse that into one source of truth and demote everything else to clearly labeled derived artifacts.
