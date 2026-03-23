# Tercier Exit Monte Carlo v1

Date: 2026-03-14
Simulation count: 10000
Seed: 2

## Framing

This model estimates a 5-year ARR and exit-value distribution for Tercier as a
global software company, starting from the Swiss premium/luxury wedge but expanding into
broader premium and upper-upscale hotel segments and portfolio/group accounts.

It is intentionally **not** a Swiss-only founder-cap model and **not** a naive
survey-intent-to-TAM-penetration model.

## Survey Anchors

- Surveyed Swiss ICP hotels: 272
- Price bands from the synthetic buyer survey:
  - under_1000: 2
  - 1000_2000: 243
  - 2000_3000: 27
  - 3000_5000: 0

## Results

### ARR (CHF)

| Horizon | P10 | P50 | P90 | Mean |
|---|---:|---:|---:|---:|
| 12 months | 0.38M | 0.62M | 0.94M | 0.65M |
| 24 months | 1.32M | 1.87M | 2.59M | 1.92M |
| 36 months | 3.38M | 4.67M | 6.35M | 4.79M |
| 60 months | 13.43M | 18.42M | 25.06M | 18.94M |

### Exit Value (CHF)

| Horizon | P10 | P50 | P90 | Mean |
|---|---:|---:|---:|---:|
| 60 months | 66.23M | 94.82M | 133.98M | 97.94M |

Probability of >= CHF 100M exit value by month 60: 42.2%

### Installed Base at 60 Months

| Metric | P10 | P50 | P90 | Mean |
|---|---:|---:|---:|---:|
| Direct properties | 308 | 413 | 554 | 424 |
| Group accounts | 15 | 23 | 33 | 24 |
| Total properties equivalent | 491 | 672 | 905 | 688 |

## Interpretation

- The central case implies a company that is meaningful but not absurd: a few hundred direct properties, a few dozen portfolio/group accounts, and a high-teens CHF ARR outcome at 5 years.
- This is much more aggressive than a Swiss-only founder-cap model, but still bounded by integration friction, proof requirements, and realistic expansion timing.
- The model suggests that a CHF 100M+ exit is plausible but not automatic. The portfolio/group layer is a major contributor to that probability.
