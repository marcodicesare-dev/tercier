import type { Assumptions, MonteCarloParams, MonteCarloResult, MonthData } from './financial-types';
import type { Scenario } from './financial-types';
import { runModel, getMarcoExitPct } from './model';
import { chfToEur } from './fx';
import { DEFAULT_ASSUMPTIONS } from './defaults';

// Seeded PRNG (xoshiro128** for reproducibility)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Triangular distribution
function triangular(rand: () => number, min: number, mode: number, max: number): number {
  const u = rand();
  const fc = (mode - min) / (max - min);
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

// Normal distribution (Box-Muller)
function normal(rand: () => number, mean: number, stddev: number): number {
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

// Uniform
function uniform(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (idx - low);
}

function computePercentiles(values: number[]): { p10: number; p25: number; p50: number; p75: number; p90: number } {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p10: percentile(sorted, 10),
    p25: percentile(sorted, 25),
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
  };
}

export const DEFAULT_MC_PARAMS: MonteCarloParams = {
  runs: 10000,
  chainRolloutVariance: 0.20,
  chainPipelineMin: 8,
  chainPipelineMax: 12,
  indieRateMin: 1.5,
  indieRateMax: 3,
  indieChurnMin: 0.08,
  indieChurnMax: 0.18,
  arpuVariance: 0.15,
  phase2TimingMin: 20,
  phase2TimingMax: 28,
  phase3TimingMin: 33,
  phase3TimingMax: 42,
  hiringTimingVariance: 3,
  infraVariance: 0.25,
  aiCogsMin: 30,
  aiCogsMax: 80,
  seriesASize: { min: 3_000_000, max: 10_000_000, mode: 6_000_000 },
  seriesATiming: { min: 18, max: 30 },
  seriesAMultiple: { min: 10, max: 25, mode: 15 },
  seriesBSize: { min: 12_000_000, max: 35_000_000, mode: 20_000_000 },
  seriesBTiming: { min: 33, max: 48 },
  seriesCSize: { min: 30_000_000, max: 80_000_000, mode: 50_000_000 },
  seriesCTiming: { min: 45, max: 60 },
};

export function runMonteCarlo(
  scenario: Scenario,
  params: MonteCarloParams = DEFAULT_MC_PARAMS,
  seed: number = 42,
): MonteCarloResult {
  const rand = mulberry32(seed);
  const milestones = ['M12', 'M24', 'M36', 'M48', 'M60'];
  const milestoneMonths = [12, 24, 36, 48, 60];
  const months = 60;

  // Collectors
  const arrByMilestone: Record<string, number[]> = {};
  const cashByMilestone: Record<string, number[]> = {};
  const valByMilestone: Record<string, number[]> = {};
  const equityByMilestone: Record<string, number[]> = {};
  const burnByMilestone: Record<string, number[]> = {};
  const defaultAliveByMilestone: Record<string, number[]> = {};

  for (const m of milestones) {
    arrByMilestone[m] = [];
    cashByMilestone[m] = [];
    valByMilestone[m] = [];
    equityByMilestone[m] = [];
    burnByMilestone[m] = [];
    defaultAliveByMilestone[m] = [];
  }

  let cashRunoutCount = 0;
  let vestingM12Count = 0;
  let vestingM24Count = 0;
  let vestingM36Count = 0;

  const arrM48: number[] = [];
  const arrM60: number[] = [];
  const cashM48: number[] = [];
  const cashM60: number[] = [];
  const valM48: number[] = [];
  const valM60: number[] = [];

  for (let run = 0; run < params.runs; run++) {
    // Vary assumptions
    const a: Assumptions = {
      ...DEFAULT_ASSUMPTIONS,
      months,
      // ARPU variance + scenario multiplier (VC → better product → higher ARPU)
      chainArpu: {
        1: Math.round(1000 * scenario.arpuMultiplier * (1 + uniform(rand, -params.arpuVariance, params.arpuVariance))),
        2: Math.round(1400 * scenario.arpuMultiplier * (1 + uniform(rand, -params.arpuVariance, params.arpuVariance))),
        3: Math.round(1800 * scenario.arpuMultiplier * (1 + uniform(rand, -params.arpuVariance, params.arpuVariance))),
      },
      indieArpu: {
        1: Math.round(1000 * scenario.arpuMultiplier * (1 + uniform(rand, -params.arpuVariance, params.arpuVariance))),
        2: Math.round(1500 * scenario.arpuMultiplier * (1 + uniform(rand, -params.arpuVariance, params.arpuVariance))),
        3: Math.round(2000 * scenario.arpuMultiplier * (1 + uniform(rand, -params.arpuVariance, params.arpuVariance))),
      },
      // Phase timing
      phase2Start: Math.round(uniform(rand, params.phase2TimingMin, params.phase2TimingMax)),
      phase3Start: Math.round(uniform(rand, params.phase3TimingMin, params.phase3TimingMax)),
      // Indie params — VC scenarios have higher growth modifier (marketing, brand, data flywheel)
      indieBaseRate: Math.round(uniform(rand, params.indieRateMin, params.indieRateMax) * scenario.growthModifier),
      indieChurnAnnual: uniform(rand, params.indieChurnMin, params.indieChurnMax),
      // AI COGS
      aiCogsPerHotelEur: Math.round(uniform(rand, params.aiCogsMin, params.aiCogsMax)),
      // Team — VC scenarios hire earlier
      team: DEFAULT_ASSUMPTIONS.team.map(t => ({
        ...t,
        startMonth: Math.max(1, t.startMonth + Math.round(normal(rand, -scenario.teamAccelerator, params.hiringTimingVariance))),
      })),
      // Infrastructure variance
      infrastructure: DEFAULT_ASSUMPTIONS.infrastructure.map(infra => ({
        ...infra,
        tiers: infra.tiers.map(v =>
          Math.round(v * (1 + uniform(rand, -params.infraVariance, params.infraVariance)))
        ) as [number, number, number, number],
      })),
      // Chains: base chains (varied) + additional chains from VC scenarios
      chains: [
        ...DEFAULT_ASSUMPTIONS.chains.slice(0, Math.round(uniform(rand, params.chainPipelineMin, params.chainPipelineMax))).map(c => ({
          ...c,
          totalHotels: Math.round(c.totalHotels * (1 + uniform(rand, -params.chainRolloutVariance, params.chainRolloutVariance))),
        })),
        // Additional chains unlocked by VC money (varied by ±20%)
        ...scenario.additionalChains.map(c => ({
          ...c,
          totalHotels: Math.round(c.totalHotels * (1 + uniform(rand, -0.20, 0.20))),
          startMonth: c.startMonth + Math.round(normal(rand, 0, 2)), // ±2 month timing variance
        })),
      ],
      // Keep vesting checks as functions
      vesting: DEFAULT_ASSUMPTIONS.vesting,
    };

    const result = runModel(a);
    const data = result.monthly;

    // Track funding injections
    let totalCash = 0;
    let marcoVested = 0; // starts at 0, earns through vesting
    let totalDilution = 1.0;

    // Apply vesting — Marco starts at 0%, earns 5%+7%+8% = 20%
    for (const v of result.vestingStatus) {
      if (v.met) marcoVested = v.cumulative;
    }

    // Apply funding rounds — A/C/M relative split stays fixed, all diluted proportionally
    for (const fr of scenario.fundingRounds) {
      if (fr.timingMonth <= months) {
        totalCash += fr.amountChf;
        totalDilution *= (1 - fr.dilution);
      }
    }

    // Apply dilution to Marco's vested equity, respecting anti-dilution floors
    const hasSeriesB = scenario.fundingRounds.filter(fr => fr.timingMonth <= months).length >= 2;
    const floor = hasSeriesB ? 0.08 : scenario.fundingRounds.length >= 1 ? 0.10 : 0;
    let marcoPostDilution = Math.max(marcoVested * totalDilution, floor);

    let hitCashRunout = false;

    for (let mi = 0; mi < milestoneMonths.length; mi++) {
      const mm = milestoneMonths[mi];
      const mKey = milestones[mi];

      if (mm > months) continue;
      const d = data[mm - 1];
      if (!d) continue;

      // Add funding to cash
      let cashWithFunding = d.closing;
      for (const fr of scenario.fundingRounds) {
        if (fr.timingMonth <= mm) cashWithFunding += fr.amountChf;
      }

      const arrEur = d.arrEur;
      const valuation = d.arr * 10; // 10x ARR multiple
      // Marco's exit share: kicker if above threshold, else vested % (pre-dilution)
      const exitPct = getMarcoExitPct(chfToEur(valuation, a.eurChf), marcoVested, a.kicker);
      // Apply dilution to exit pct (kicker is pre-dilution, then diluted with everyone)
      const exitPctPostDilution = Math.max(exitPct * totalDilution, floor);
      const equityValue = valuation * exitPctPostDilution;

      arrByMilestone[mKey].push(arrEur);
      cashByMilestone[mKey].push(cashWithFunding);
      valByMilestone[mKey].push(valuation);
      equityByMilestone[mKey].push(equityValue);

      // Burn multiple
      if (mi > 0) {
        const prevMm = milestoneMonths[mi - 1];
        const prevD = data[prevMm - 1];
        const periodBurn = data.slice(prevMm, mm).reduce((s, d2) => s + (d2.totalCosts - d2.rev), 0);
        const newArr = d.arr - prevD.arr;
        const burnMult = newArr > 0 ? Math.abs(periodBurn) / newArr : 999;
        burnByMilestone[mKey].push(burnMult);
      }

      // Default alive: can reach profitability on current trajectory?
      const netBurn = d.totalCosts - d.rev;
      const defaultAlive = netBurn <= 0 || cashWithFunding / netBurn > 12;
      defaultAliveByMilestone[mKey].push(defaultAlive ? 1 : 0);

      if (cashWithFunding < 0) hitCashRunout = true;
    }

    if (hitCashRunout) cashRunoutCount++;
    if (data.length >= 12 && data[11].totalPaying >= 15) vestingM12Count++;
    if (data.length >= 24 && data[23].arrEur >= 500000) vestingM24Count++;
    if (data.length >= 36 && data[35].arrEur >= 1500000) vestingM36Count++;

    // Distribution collections
    if (data.length >= 48) {
      arrM48.push(data[47].arrEur);
      cashM48.push(data[47].closing);
      valM48.push(data[47].arr * 10);
    }
    if (data.length >= 60) {
      arrM60.push(data[59].arrEur);
      cashM60.push(data[59].closing);
      valM60.push(data[59].arr * 10);
    }
  }

  // Compute percentiles
  const percentileResult: MonteCarloResult['percentiles'] = {
    arr: {},
    cash: {},
    valuation: {},
    marcoEquity: {},
  };

  const burnResult: MonteCarloResult['burnMultiple'] = {};

  for (const m of milestones) {
    if (arrByMilestone[m].length > 0) {
      percentileResult.arr[m] = computePercentiles(arrByMilestone[m]);
      percentileResult.cash[m] = computePercentiles(cashByMilestone[m]);
      percentileResult.valuation[m] = computePercentiles(valByMilestone[m]);
      percentileResult.marcoEquity[m] = computePercentiles(equityByMilestone[m]);
    }
    if (burnByMilestone[m].length > 0) {
      burnResult[m] = {
        p10: percentile([...burnByMilestone[m]].sort((a, b) => a - b), 10),
        p50: percentile([...burnByMilestone[m]].sort((a, b) => a - b), 50),
        p90: percentile([...burnByMilestone[m]].sort((a, b) => a - b), 90),
      };
    }
  }

  const defaultAliveProb: Record<string, number> = {};
  for (const m of ['M12', 'M24', 'M36']) {
    if (defaultAliveByMilestone[m].length > 0) {
      defaultAliveProb[m] = defaultAliveByMilestone[m].reduce((s, v) => s + v, 0) / defaultAliveByMilestone[m].length;
    }
  }

  // Sample distributions for histograms (take every 10th value to keep size manageable)
  const sampleDistribution = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const step = Math.max(1, Math.floor(sorted.length / 200));
    return sorted.filter((_, i) => i % step === 0);
  };

  return {
    scenario: scenario.id,
    percentiles: percentileResult,
    probabilities: {
      cashRunout: cashRunoutCount / params.runs,
      vestingM12: vestingM12Count / params.runs,
      vestingM24: vestingM24Count / params.runs,
      vestingM36: vestingM36Count / params.runs,
      defaultAlive: defaultAliveProb,
    },
    burnMultiple: burnResult,
    distributions: {
      arrM48: sampleDistribution(arrM48),
      arrM60: sampleDistribution(arrM60),
      cashM48: sampleDistribution(cashM48),
      cashM60: sampleDistribution(cashM60),
      valuationM48: sampleDistribution(valM48),
      valuationM60: sampleDistribution(valM60),
    },
  };
}
