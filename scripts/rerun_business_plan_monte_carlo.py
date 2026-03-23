#!/usr/bin/env python3

import json
import math
import random
from collections import deque
from dataclasses import dataclass
from pathlib import Path


ROOT = Path("/Users/marcodicesare/Documents/Projects/tercier")
OUTPUT_DIR = ROOT / "research" / "synthetic-survey" / "run-2026-03-22-business-plan-monte-carlo-v2"
RESULTS_PATH = OUTPUT_DIR / "business-plan-monte-carlo-results.json"
README_PATH = OUTPUT_DIR / "README.md"

SIMULATION_COUNT = 10_000
SEED = 22
CHECKPOINT_MONTHS = [12, 18, 30, 36, 60]
EXIT_THRESHOLD_EUR = 100_000_000


@dataclass(frozen=True)
class ScenarioConfig:
    key: str
    label: str
    description: str
    initial_seed_chf: tuple[float, float, float]
    follow_on_chf: tuple[float, float, float] | None
    follow_on_trigger: str
    warm_intro_range: tuple[float, float, float]
    early_demo_to_pov: tuple[float, float, float]
    late_demo_to_pov: tuple[float, float, float]
    early_pov_to_full: tuple[float, float, float]
    late_pov_to_full: tuple[float, float, float]
    non_network_demo_ramp: tuple[float, float, float]
    monthly_group_rollout_prob: tuple[float, float, float]
    group_rollout_size: tuple[float, float, float]
    annual_churn: tuple[float, float, float]
    content_upgrade_prob: tuple[float, float, float]
    expansion_mrr_growth: tuple[float, float, float]
    exit_multiple: tuple[float, float, float]
    referral_factor: tuple[float, float, float]
    follow_on_month: int | None
    post_raise_demo_mult: float
    post_raise_group_mult: float
    later_geo_boost: float


SCENARIOS = [
    ScenarioConfig(
        key="operator_seeded_ai_native",
        label="Operator-Seeded AI-Native",
        description=(
            "No institutional VC. Assumes CHF 120-150K initial angel/operator seed, Marco + "
            "Amedeo network distribution, founder-led product velocity, and disciplined reinvestment "
            "after early breakeven."
        ),
        initial_seed_chf=(120_000, 135_000, 150_000),
        follow_on_chf=None,
        follow_on_trigger="None. Growth is financed from the initial seed plus operating cash flow.",
        warm_intro_range=(3.5, 4.2, 5.0),
        early_demo_to_pov=(0.60, 0.72, 0.83),
        late_demo_to_pov=(0.55, 0.67, 0.78),
        early_pov_to_full=(0.44, 0.53, 0.61),
        late_pov_to_full=(0.49, 0.59, 0.68),
        non_network_demo_ramp=(0.75, 1.50, 2.40),
        monthly_group_rollout_prob=(0.0070, 0.0130, 0.0220),
        group_rollout_size=(2.4, 3.5, 5.2),
        annual_churn=(0.038, 0.058, 0.092),
        content_upgrade_prob=(0.0090, 0.0180, 0.0280),
        expansion_mrr_growth=(1.0023, 1.0052, 1.0090),
        exit_multiple=(4.0, 5.0, 6.0),
        referral_factor=(0.020, 0.029, 0.040),
        follow_on_month=None,
        post_raise_demo_mult=1.0,
        post_raise_group_mult=1.0,
        later_geo_boost=1.08,
    ),
    ScenarioConfig(
        key="operator_plus_follow_on_angel",
        label="Operator + Follow-On Angel",
        description=(
            "Still no institutional VC. Assumes the initial CHF 120-150K seed is followed by a "
            "CHF 150-300K milestone-based angel tranche used for integrations, implementation "
            "capacity, references, and selective GTM acceleration once the first hotels are live."
        ),
        initial_seed_chf=(120_000, 135_000, 150_000),
        follow_on_chf=(150_000, 200_000, 300_000),
        follow_on_trigger="Modeled from month 12 onward after early proof and initial traction.",
        warm_intro_range=(3.7, 4.5, 5.3),
        early_demo_to_pov=(0.62, 0.74, 0.85),
        late_demo_to_pov=(0.57, 0.69, 0.80),
        early_pov_to_full=(0.45, 0.55, 0.63),
        late_pov_to_full=(0.50, 0.61, 0.70),
        non_network_demo_ramp=(0.95, 1.80, 2.80),
        monthly_group_rollout_prob=(0.0080, 0.0155, 0.0250),
        group_rollout_size=(2.6, 3.8, 5.6),
        annual_churn=(0.034, 0.052, 0.088),
        content_upgrade_prob=(0.0100, 0.0200, 0.0310),
        expansion_mrr_growth=(1.0025, 1.0055, 1.0092),
        exit_multiple=(4.05, 5.15, 6.1),
        referral_factor=(0.022, 0.031, 0.043),
        follow_on_month=12,
        post_raise_demo_mult=1.10,
        post_raise_group_mult=1.18,
        later_geo_boost=1.12,
    ),
]


def triangular(rng: random.Random, values: tuple[float, float, float]) -> float:
    return rng.triangular(values[0], values[2], values[1])


def poisson(rng: random.Random, lam: float) -> int:
    if lam <= 0:
        return 0
    if lam > 60:
        return max(0, int(round(rng.gauss(lam, math.sqrt(lam)))))
    limit = math.exp(-lam)
    k = 0
    p = 1.0
    while p > limit:
        k += 1
        p *= rng.random()
    return k - 1


def binomial(rng: random.Random, trials: int, p: float) -> int:
    return sum(1 for _ in range(max(0, trials)) if rng.random() < p)


def percentile(values: list[float], q: float) -> float:
    ordered = sorted(values)
    idx = (len(ordered) - 1) * q
    lo = math.floor(idx)
    hi = math.ceil(idx)
    if lo == hi:
        return ordered[lo]
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (idx - lo)


def summarize(values: list[float], digits: int = 4) -> dict[str, float]:
    return {
        "p10": round(percentile(values, 0.10), digits),
        "p50": round(percentile(values, 0.50), digits),
        "p90": round(percentile(values, 0.90), digits),
        "mean": round(sum(values) / len(values), digits),
    }


def full_mrr(month: int, base_full_mrr: float, growth: float) -> float:
    return base_full_mrr * (growth ** (month - 1))


def warm_intro_flow(month: int, base_rate: float) -> float:
    if month <= 6:
        return base_rate * 1.12
    if month <= 18:
        return base_rate * 1.02
    if month <= 36:
        return base_rate * 0.98
    return base_rate * 0.90


def non_network_flow(month: int, ramp: float, later_geo_boost: float) -> float:
    flow = 0.0
    if month > 2:
        flow += ramp * min(1.0, (month - 2) / 8)
    if month > 9:
        flow += ramp * 1.0 * min(1.0, (month - 9) / 12)
    if month > 18:
        flow += ramp * 0.85 * min(1.0, (month - 18) / 12) * later_geo_boost
    if month > 30:
        flow += ramp * 0.65 * min(1.0, (month - 30) / 18) * later_geo_boost
    return flow


def build_meta() -> dict:
    return {
        "date": "2026-03-22",
        "simulation_count": SIMULATION_COUNT,
        "seed": SEED,
        "purpose": (
            "Rebuild the business-plan Monte Carlo with non-VC financing paths only: "
            "operator-seeded and operator + follow-on angel."
        ),
        "model_notes": [
            "Founder execution advantage is modeled as higher throughput, faster non-network ramp, and delayed hiring pressure. It is not used to inflate TAM or erase procurement friction.",
            "Pricing remains anchored to the March 2026 synthetic survey: broad willingness in CHF 2K-3.5K/month, with a wedge designed to close quickly and expand through visible property-level results.",
            "Both paths keep integration friction, proof requirements, and churn in the model. The angel path buys implementation capacity and GTM compression, not VC-style category capture.",
            "The product is modeled as a fast-closing commercial wedge rather than a heavy enterprise platform sale. The separate global-expansion exit model remains a distinct upside lens and should not be merged into this business-plan Monte Carlo.",
        ],
        "survey_anchors": {
            "survey_hotels": 272,
            "roles": 2,
            "replications": 3,
            "avg_buy_likelihood_3k": 37,
            "top_deal_killer": "No PMS/CRM integration",
            "sweet_spot_pricing_chf_per_month": "2,000-3,500",
        },
        "founder_execution_evidence": {
            "source": "Local git history inspection across active repos between 2026-01-01 and 2026-03-22",
            "repos": {
                "loamly": 1574,
                "basquio": 139,
                "rabbhole": 178,
                "mappa": 177,
                "costfigure": 130,
                "ghostedbyai": 97,
            },
            "total_authored_commits": 2295,
            "interpretation": (
                "Used only to justify stronger execution speed, faster non-network ramp, and leaner early staffing. "
                "Not used to assume magic sales cycles or zero integration drag."
            ),
        },
    }


def run_scenario(rng: random.Random, cfg: ScenarioConfig) -> dict:
    metrics = {
        month: {
            "active_full_hotels": [],
            "active_pov_hotels": [],
            "active_total_hotels": [],
            "property_equivalent": [],
            "mrr": [],
            "arr": [],
        }
        for month in CHECKPOINT_MONTHS
    }
    exit_values = []

    for _ in range(SIMULATION_COUNT):
        warm_intro = triangular(rng, cfg.warm_intro_range)
        early_demo_to_pov = triangular(rng, cfg.early_demo_to_pov)
        late_demo_to_pov = triangular(rng, cfg.late_demo_to_pov)
        early_pov_to_full = triangular(rng, cfg.early_pov_to_full)
        late_pov_to_full = triangular(rng, cfg.late_pov_to_full)
        non_network_demo_ramp = triangular(rng, cfg.non_network_demo_ramp)
        monthly_group_rollout_prob = triangular(rng, cfg.monthly_group_rollout_prob)
        annual_churn = triangular(rng, cfg.annual_churn)
        content_upgrade_prob = triangular(rng, cfg.content_upgrade_prob)
        expansion_mrr_growth = triangular(rng, cfg.expansion_mrr_growth)
        exit_multiple = triangular(rng, cfg.exit_multiple)
        referral_factor = triangular(rng, cfg.referral_factor)

        monthly_churn = 1 - (1 - annual_churn) ** (1 / 12)
        base_full_mrr = rng.triangular(2150, 2850, 2425)
        pov_mrr = rng.triangular(1350, 1750, 1525)
        upgrade_mrr = rng.triangular(220, 500, 315)

        full_hotels = 0
        cumulative_upgrades = 0
        pov_queue = deque([0, 0], maxlen=2)

        for month in range(1, 61):
            post_raise = cfg.follow_on_month is not None and month >= cfg.follow_on_month
            demo_multiplier = cfg.post_raise_demo_mult if post_raise else 1.0
            group_multiplier = cfg.post_raise_group_mult if post_raise else 1.0

            expected_demos = (
                warm_intro_flow(month, warm_intro)
                + non_network_flow(month, non_network_demo_ramp, cfg.later_geo_boost)
                + (full_hotels * referral_factor)
            ) * demo_multiplier

            demos = poisson(rng, expected_demos)
            new_pov = binomial(rng, demos, early_demo_to_pov if month <= 18 else late_demo_to_pov)
            matured_pov = pov_queue.popleft()
            pov_queue.append(new_pov)

            new_full = binomial(
                rng,
                matured_pov,
                early_pov_to_full if month <= 18 else late_pov_to_full,
            )

            if rng.random() < monthly_group_rollout_prob * group_multiplier:
                new_full += max(1, round(triangular(rng, cfg.group_rollout_size)))

            churned = binomial(rng, full_hotels, monthly_churn)
            full_hotels = max(0, full_hotels + new_full - churned)
            cumulative_upgrades += binomial(rng, full_hotels, content_upgrade_prob)
            active_pov = sum(pov_queue)

            month_mrr = (
                full_hotels * full_mrr(month, base_full_mrr, expansion_mrr_growth)
                + active_pov * pov_mrr
                + cumulative_upgrades * upgrade_mrr
            )

            if month in metrics:
                metrics[month]["active_full_hotels"].append(full_hotels)
                metrics[month]["active_pov_hotels"].append(active_pov)
                metrics[month]["active_total_hotels"].append(full_hotels + active_pov)
                metrics[month]["property_equivalent"].append(full_hotels + active_pov + cumulative_upgrades * 0.15)
                metrics[month]["mrr"].append(month_mrr)
                metrics[month]["arr"].append(month_mrr * 12)

        exit_values.append(metrics[60]["arr"][-1] * exit_multiple)

    scenario_payload = {
        "scenario": {
            "key": cfg.key,
            "label": cfg.label,
            "description": cfg.description,
            "initial_seed_chf": cfg.initial_seed_chf,
            "follow_on_chf": cfg.follow_on_chf,
            "follow_on_trigger": cfg.follow_on_trigger,
            "warm_intro_range": cfg.warm_intro_range,
            "early_demo_to_pov": cfg.early_demo_to_pov,
            "late_demo_to_pov": cfg.late_demo_to_pov,
            "early_pov_to_full": cfg.early_pov_to_full,
            "late_pov_to_full": cfg.late_pov_to_full,
            "non_network_demo_ramp": cfg.non_network_demo_ramp,
            "monthly_group_rollout_prob": cfg.monthly_group_rollout_prob,
            "group_rollout_size": cfg.group_rollout_size,
            "annual_churn": cfg.annual_churn,
            "content_upgrade_prob": cfg.content_upgrade_prob,
            "expansion_mrr_growth": cfg.expansion_mrr_growth,
            "referral_factor": cfg.referral_factor,
            "later_geo_boost": cfg.later_geo_boost,
            "exit_multiple": cfg.exit_multiple,
        }
    }

    for month in CHECKPOINT_MONTHS:
        scenario_payload[f"month_{month}"] = {
            name: summarize(values, 4 if name in {"mrr", "arr"} else 2)
            for name, values in metrics[month].items()
        }

    scenario_payload["exit_value_60m"] = summarize(exit_values, 4)
    scenario_payload["probability_exit_gte_100m"] = round(
        sum(1 for value in exit_values if value >= EXIT_THRESHOLD_EUR) / SIMULATION_COUNT,
        4,
    )

    return scenario_payload


def format_int(number: float) -> str:
    return f"{round(number):,}"


def format_money(number: float) -> str:
    if abs(number) >= 1_000_000:
        return f"EUR {number / 1_000_000:.2f}M"
    if abs(number) >= 1_000:
        return f"EUR {number / 1_000:.0f}K"
    return f"EUR {number:.0f}"


def build_readme(results: dict) -> str:
    operator = results["scenarios"]["operator_seeded_ai_native"]
    angel = results["scenarios"]["operator_plus_follow_on_angel"]
    return f"""# Tercier Business-Plan Monte Carlo v2

Date: 2026-03-22
Simulation count: {SIMULATION_COUNT}
Seed: {SEED}

## Framing

This rerun replaces the old operator-vs-VC framing with two paths that are actually coherent with the current cap table logic:
- **Operator-seeded AI-native** = CHF 120-150K initial angel/operator seed, no institutional VC
- **Operator + follow-on angel** = same initial path, plus a milestone-based angel tranche used to compress integrations, onboarding, proof packages, and selective GTM

The founder execution uplift is explicit, but bounded.
It is justified by the observed local git throughput across Loamly, Basquio, Rabbhole, Mappa, Costfigure, and GhostedByAI between 2026-01-01 and 2026-03-22: **2,295 authored commits**.

That uplift is only used for:
- faster product / proof-package iteration
- stronger non-network demo ramp
- later hiring pressure

It is **not** used to pretend procurement friction, integration drag, or churn disappear.

## Headline Comparison

| Metric | Operator-seeded P50 | Operator + follow-on angel P50 |
|---|---:|---:|
| Hotels at month 12 | {format_int(operator["month_12"]["active_total_hotels"]["p50"])} | {format_int(angel["month_12"]["active_total_hotels"]["p50"])} |
| Hotels at month 18 | {format_int(operator["month_18"]["active_total_hotels"]["p50"])} | {format_int(angel["month_18"]["active_total_hotels"]["p50"])} |
| Hotels at month 30 | {format_int(operator["month_30"]["active_total_hotels"]["p50"])} | {format_int(angel["month_30"]["active_total_hotels"]["p50"])} |
| Hotels at month 36 | {format_int(operator["month_36"]["active_total_hotels"]["p50"])} | {format_int(angel["month_36"]["active_total_hotels"]["p50"])} |
| ARR at month 36 | {format_money(operator["month_36"]["arr"]["p50"])} | {format_money(angel["month_36"]["arr"]["p50"])} |
| ARR at month 60 | {format_money(operator["month_60"]["arr"]["p50"])} | {format_money(angel["month_60"]["arr"]["p50"])} |
| Exit value at month 60 | {format_money(operator["exit_value_60m"]["p50"])} | {format_money(angel["exit_value_60m"]["p50"])} |

## Month 36 Read

Business-plan target range should now be read as a range across funding discipline, not a fake operator-vs-VC split:

- Operator-seeded P50:
  - hotels: {format_int(operator["month_36"]["active_total_hotels"]["p50"])}
  - property-equivalent footprint: {format_int(operator["month_36"]["property_equivalent"]["p50"])}
  - ARR: {format_money(operator["month_36"]["arr"]["p50"])}
- Operator + follow-on angel P50:
  - hotels: {format_int(angel["month_36"]["active_total_hotels"]["p50"])}
  - property-equivalent footprint: {format_int(angel["month_36"]["property_equivalent"]["p50"])}
  - ARR: {format_money(angel["month_36"]["arr"]["p50"])}

## Exit Probability

- Operator-seeded probability of EUR 100M+ exit value at month 60: {operator["probability_exit_gte_100m"] * 100:.1f}%
- Operator + follow-on angel probability of EUR 100M+ exit value at month 60: {angel["probability_exit_gte_100m"] * 100:.1f}%

## Read

- This model is more conservative on exit value than the previous VC-framed business-plan Monte Carlo.
- The follow-on angel path is meaningfully better than pure operator-seeded, but it is still not a disguised Series A story.
- The separate global-expansion exit model remains the aggressive upside lens; do not merge it into this business-plan Monte Carlo.
"""


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(SEED)

    results = {
        "meta": build_meta(),
        "scenarios": {
            scenario.key: run_scenario(rng, scenario)
            for scenario in SCENARIOS
        },
    }

    RESULTS_PATH.write_text(json.dumps(results, indent=2) + "\n")
    README_PATH.write_text(build_readme(results))


if __name__ == "__main__":
    main()
