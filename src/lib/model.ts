import type { Assumptions, MonthData, AnnualData, ModelOutput } from './types';
import { eurToChf, usdToChf, chfToEur } from './fx';

// Python-compatible rounding (banker's rounding: round half to even)
function pyRound(n: number): number {
  const floor = Math.floor(n);
  const decimal = n - floor;
  if (Math.abs(decimal - 0.5) < 1e-9) {
    // Exactly .5 — round to even
    return floor % 2 === 0 ? floor : floor + 1;
  }
  return Math.round(n);
}

function getPhase(month: number, a: Assumptions): number {
  if (month >= a.phase3Start) return 3;
  if (month >= a.phase2Start) return 2;
  return 1;
}

function getTier(month: number): number {
  if (month >= 37) return 3;
  if (month >= 25) return 2;
  if (month >= 13) return 1;
  return 0;
}

function getChainActive(chainIndex: number, month: number, a: Assumptions): number {
  const chain = a.chains[chainIndex];
  if (month < chain.startMonth) return 0;
  const elapsed = month - chain.startMonth;
  if (elapsed >= 23) return pyRound(chain.totalHotels * 0.55);
  if (elapsed >= 17) return pyRound(chain.totalHotels * 0.50);
  if (elapsed >= 11) return pyRound(chain.totalHotels * 0.40);
  if (elapsed >= 5) return pyRound(chain.totalHotels * 0.15);
  return 3;
}

function getChainPaying(chainIndex: number, month: number, a: Assumptions): number {
  const chain = a.chains[chainIndex];
  if (month < chain.startMonth + a.trialMonths) return 0;
  return getChainActive(chainIndex, month, a);
}

function buildIndieSchedule(a: Assumptions): number[] {
  const months = a.months + 1; // 0-indexed, month 0 unused
  const c = new Array(months).fill(0);
  for (let m = 1; m < months; m++) {
    if (m < a.indieStartMonth) {
      c[m] = 0;
    } else if (m === a.indieStartMonth) {
      c[m] = a.indieBaseRate;
    } else {
      const prev = c[m - 1];
      const yr = Math.floor((m - a.indieStartMonth) / 12);
      const newHotels = pyRound(a.indieBaseRate * Math.pow(1 + a.indieGrowthYoY, yr));
      const churn = pyRound(prev * a.indieChurnAnnual / 12);
      c[m] = Math.max(0, prev + newHotels - churn);
    }
  }
  return c;
}

export function runModel(a: Assumptions): ModelOutput {
  const indie = buildIndieSchedule(a);
  const monthly: MonthData[] = [];
  let cash = a.capital;
  let prevOut = 0;

  for (let m = 1; m <= a.months; m++) {
    const phase = getPhase(m, a);
    const tier = getTier(m);

    // Hotels
    const chainActive = a.chains.map((_, i) => getChainActive(i, m, a));
    const totalChainActive = chainActive.reduce((s, v) => s + v, 0);
    const chainPaying = a.chains.map((_, i) => getChainPaying(i, m, a));
    const totalChainPaying = chainPaying.reduce((s, v) => s + v, 0);
    const indieCount = indie[m];
    const totalActive = totalChainActive + indieCount;
    const totalPaying = totalChainPaying + indieCount;

    // Revenue
    const chainArpu = a.chainArpu[phase as 1 | 2 | 3];
    const indieArpu = a.indieArpu[phase as 1 | 2 | 3];
    const revChain = eurToChf(totalChainPaying * chainArpu, a.eurChf);
    const revIndie = eurToChf(indieCount * indieArpu, a.eurChf);
    const rev = revChain + revIndie;
    const arr = rev * 12;
    const arrEur = chfToEur(arr, a.eurChf);

    // CEO salary with runway clause
    let ceoSalary = a.ceoBaseSalary;
    const prevRev = monthly.length > 0 ? monthly[monthly.length - 1].rev : 0;
    const prevNetBurn = prevOut - prevRev;

    for (const stepUp of a.ceoStepUps) {
      const clauseMet = m === 1 || prevNetBurn <= 0 || cash >= prevNetBurn * 6;
      if (arrEur >= stepUp.arrThresholdEur && clauseMet) {
        ceoSalary = stepUp.salary;
      } else {
        break;
      }
    }

    const ceoMonthlyTotal = a.ceoSocialRates[ceoSalary];
    const ceoGross = Math.round(ceoSalary / 12);
    const ceoSocial = ceoMonthlyTotal - ceoGross;

    // Team
    const teamCosts: Record<string, number> = {};
    let teamTotal = 0;
    for (const member of a.team) {
      const cost = m >= member.startMonth ? eurToChf(member.eurCost, a.eurChf) : 0;
      teamCosts[`team_${member.key}`] = cost;
      teamTotal += cost;
    }

    // AI COGS
    const aiCogs = eurToChf(totalPaying * a.aiCogsPerHotelEur, a.eurChf);

    // Dev tooling
    const devToolingCosts: Record<string, number> = {};
    for (const tool of a.devTooling) {
      devToolingCosts[tool.key] = usdToChf(tool.usdCost, a.usdChf);
    }

    // Infrastructure
    const infraCosts: Record<string, number> = {};
    for (const infra of a.infrastructure) {
      infraCosts[`infra_${infra.key}`] = usdToChf(infra.tiers[tier], a.usdChf);
    }

    // Admin
    const adminCosts: Record<string, number> = {};
    for (const admin of a.admin) {
      adminCosts[`admin_${admin.key}`] = admin.tiers[tier];
    }

    // Workspace
    const wsInternet = a.wsInternet;
    const wsCoworking = a.wsCoworking[tier];

    // S&M
    const smTravel = a.smTravel[tier];
    const smMarketing = a.smMarketing[tier];

    // Processing
    const processing = Math.round(rev * a.processingRate);

    // Contingency
    const contingency = a.contingency;

    // One-time
    const oneTimeCostsMap: Record<string, number> = {};
    for (const ot of a.oneTimeCosts) {
      oneTimeCostsMap[ot.key] = m === 1 ? ot.amount : 0;
    }

    // Total costs
    let totalCosts = ceoGross + ceoSocial + teamTotal + aiCogs;
    for (const v of Object.values(devToolingCosts)) totalCosts += v;
    for (const v of Object.values(infraCosts)) totalCosts += v;
    for (const v of Object.values(adminCosts)) totalCosts += v;
    totalCosts += wsInternet + wsCoworking + smTravel + smMarketing + processing + contingency;
    for (const v of Object.values(oneTimeCostsMap)) totalCosts += v;

    const ebitda = rev - totalCosts;

    // Cash
    const cashIn = (m === 1 ? a.capital : 0) + rev;
    const closing = m === 1
      ? a.capital + rev - totalCosts
      : cash + rev - totalCosts;

    // Runway
    let runway: number;
    let clauseMet: boolean;
    if (prevNetBurn <= 0) {
      runway = 999; // profitable = infinite
      clauseMet = true;
    } else {
      runway = cash / prevNetBurn;
      clauseMet = m === 1 || cash >= prevNetBurn * 6;
    }

    prevOut = totalCosts;
    cash = closing;

    monthly.push({
      month: m,
      phase,
      tier,
      chainActive,
      totalChainActive,
      chainPaying,
      totalChainPaying,
      indie: indieCount,
      totalActive,
      totalPaying,
      revChain,
      revIndie,
      rev,
      arr,
      arrEur,
      ceoSalary,
      ceoGross,
      ceoSocial,
      ceoTotal: ceoMonthlyTotal,
      teamCosts,
      teamTotal,
      aiCogs,
      devToolingCosts,
      infraCosts,
      adminCosts,
      wsInternet,
      wsCoworking,
      smTravel,
      smMarketing,
      processing,
      contingency,
      oneTimeCosts: oneTimeCostsMap,
      totalCosts,
      ebitda,
      cashIn,
      closing,
      runway,
      clauseMet,
    });
  }

  // Annual summaries
  const annual: AnnualData[] = [];
  const years = Math.ceil(a.months / 12);
  for (let y = 0; y < years; y++) {
    const start = y * 12;
    const end = Math.min((y + 1) * 12, a.months);
    const yearMonths = monthly.slice(start, end);
    const revenue = yearMonths.reduce((s, d) => s + d.rev, 0);
    const costs = yearMonths.reduce((s, d) => s + d.totalCosts, 0);
    const ebitda = revenue - costs;
    const lastMonth = yearMonths[yearMonths.length - 1];
    annual.push({
      year: y + 1,
      revenue,
      costs,
      ebitda,
      ebitdaMargin: revenue > 0 ? ebitda / revenue : 0,
      endPayingHotels: lastMonth.totalPaying,
      endArr: lastMonth.arr,
      endArrEur: lastMonth.arrEur,
      endCash: lastMonth.closing,
    });
  }

  // Breakeven
  const breakeven = monthly.findIndex(d => d.ebitda > 0);
  const breakevenMonth = breakeven >= 0 ? breakeven + 1 : null;

  // Lowest cash
  let lowestCashIdx = 0;
  for (let i = 1; i < monthly.length; i++) {
    if (monthly[i].closing < monthly[lowestCashIdx].closing) {
      lowestCashIdx = i;
    }
  }

  // CEO step-up timeline
  const ceoStepUpTimeline: Array<{ month: number; salary: number; total: number }> = [];
  const seenSalaries = new Set<number>();
  for (const d of monthly) {
    if (!seenSalaries.has(d.ceoSalary)) {
      seenSalaries.add(d.ceoSalary);
      ceoStepUpTimeline.push({
        month: d.month,
        salary: d.ceoSalary,
        total: d.ceoTotal,
      });
    }
  }

  // Vesting
  let cumPct = a.equity.marcoBase;
  const vestingStatus = a.vesting.map(v => {
    const d = monthly[v.month - 1];
    const met = d ? v.check(d) : false;
    if (met) cumPct += v.additionalPct;
    return { month: v.month, met, cumulative: cumPct };
  });

  return {
    monthly,
    annual,
    breakeven: breakevenMonth,
    lowestCash: {
      amount: monthly[lowestCashIdx].closing,
      month: lowestCashIdx + 1,
    },
    maxDrawdown: a.capital - monthly[lowestCashIdx].closing,
    ceoStepUpTimeline,
    vestingStatus,
  };
}

// Get kicker percentage for a given valuation in EUR
export function getKickerPct(valuationEur: number, a: Assumptions): number {
  let pct = 0.20;
  for (const k of a.kicker) {
    if (valuationEur >= k.thresholdEur) pct = k.percentage;
  }
  return pct;
}

// Valuation at ARR multiple
export function getValuation(arrChf: number, multiple: number): number {
  return Math.round(arrChf * multiple);
}

// Marco's equity value at exit
export function getMarcoEquityValue(
  valuationChf: number,
  eurChf: number,
  kicker: Assumptions['kicker'],
): { percentage: number; value: number } {
  const valuationEur = chfToEur(valuationChf, eurChf);
  let pct = 0.20;
  for (const k of kicker) {
    if (valuationEur >= k.thresholdEur) pct = k.percentage;
  }
  return { percentage: pct, value: Math.round(valuationChf * pct) };
}
