// Lumina Financial Model — TypeScript Types

export interface ChainDef {
  name: string;
  startMonth: number;
  totalHotels: number;
}

export interface TeamMemberDef {
  key: string;
  label: string;
  eurCost: number;
  startMonth: number;
}

export interface InfraCostDef {
  key: string;
  label: string;
  tiers: [number, number, number, number]; // USD per tier (M1-12, M13-24, M25-36, M37-48/60)
}

export interface AdminCostDef {
  key: string;
  label: string;
  tiers: [number, number, number, number]; // CHF per tier
}

export interface OneTimeCostDef {
  key: string;
  label: string;
  amount: number; // CHF
}

export interface Assumptions {
  months: number;
  eurChf: number;
  usdChf: number;
  capital: number;

  // ARPU (EUR/hotel/month)
  chainArpu: { 1: number; 2: number; 3: number };
  indieArpu: { 1: number; 2: number; 3: number };

  // Phase boundaries (month when phase starts)
  phase2Start: number; // default 24
  phase3Start: number; // default 37

  // Chains
  chains: ChainDef[];
  trialMonths: number; // 3

  // Indies
  indieStartMonth: number; // 7
  indieBaseRate: number; // 2 per month
  indieGrowthYoY: number; // 0.20
  indieChurnAnnual: number; // 0.12

  // CEO
  ceoBaseSalary: number; // 106080
  ceoSocialRates: Record<number, number>; // salary -> monthly total company cost
  ceoStepUps: Array<{ arrThresholdEur: number; salary: number }>;

  // Team
  team: TeamMemberDef[];

  // AI COGS
  aiCogsPerHotelEur: number; // 50

  // Dev tooling (USD)
  devTooling: Array<{ key: string; label: string; usdCost: number }>;

  // Infrastructure (USD, tiered)
  infrastructure: InfraCostDef[];

  // Admin (CHF, tiered)
  admin: AdminCostDef[];

  // Workspace (CHF)
  wsInternet: number;
  wsCoworking: [number, number, number, number]; // per tier

  // S&M (CHF, tiered)
  smTravel: [number, number, number, number];
  smMarketing: [number, number, number, number];

  // Processing
  processingRate: number; // 0.03

  // Contingency
  contingency: number; // 300

  // One-time costs
  oneTimeCosts: OneTimeCostDef[];

  // Equity
  equity: {
    amedeo: number;
    corsaro: number;
    marcoBase: number;
    psopCap: number;
  };

  // Kicker
  kicker: Array<{ thresholdEur: number; percentage: number }>;

  // Vesting
  vesting: Array<{
    month: number;
    additionalPct: number;
    condition: string;
    check: (data: MonthData) => boolean;
  }>;

  // Tax
  zugTaxRate: number; // 0.1182
  zurichTaxRate: number; // 0.1959
}

export interface MonthData {
  month: number;
  phase: number;
  tier: number;

  // Hotels
  chainActive: number[];
  totalChainActive: number;
  chainPaying: number[];
  totalChainPaying: number;
  indie: number;
  totalActive: number;
  totalPaying: number;

  // Revenue (CHF)
  revChain: number;
  revIndie: number;
  rev: number;
  arr: number;
  arrEur: number;

  // CEO
  ceoSalary: number;
  ceoGross: number;
  ceoSocial: number;
  ceoTotal: number;

  // Team (CHF per member)
  teamCosts: Record<string, number>;
  teamTotal: number;

  // AI COGS
  aiCogs: number;

  // Dev tooling
  devToolingCosts: Record<string, number>;

  // Infrastructure
  infraCosts: Record<string, number>;

  // Admin
  adminCosts: Record<string, number>;

  // Workspace
  wsInternet: number;
  wsCoworking: number;

  // S&M
  smTravel: number;
  smMarketing: number;

  // Variable
  processing: number;
  contingency: number;

  // One-time
  oneTimeCosts: Record<string, number>;

  // Totals
  totalCosts: number;
  ebitda: number;

  // Cash
  cashIn: number;
  closing: number;
  runway: number;
  clauseMet: boolean;
}

export interface AnnualData {
  year: number;
  revenue: number;
  costs: number;
  ebitda: number;
  ebitdaMargin: number;
  endPayingHotels: number;
  endArr: number;
  endArrEur: number;
  endCash: number;
}

export interface ModelOutput {
  monthly: MonthData[];
  annual: AnnualData[];
  breakeven: number | null;
  lowestCash: { amount: number; month: number };
  maxDrawdown: number;
  ceoStepUpTimeline: Array<{ month: number; salary: number; total: number }>;
  vestingStatus: Array<{ month: number; met: boolean; cumulative: number }>;
}

// Funding scenarios
export interface FundingRound {
  name: string;
  timingMonth: number;
  amountChf: number;
  preMoneyMultiple: number;
  dilution: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  fundingRounds: FundingRound[];
  growthModifier: number; // multiplier on indie acquisition rate
  teamAccelerator: number; // months earlier to hire
  additionalChains: ChainDef[]; // chains unlocked by VC money (sales team, network, brand)
  rolloutSpeedMultiplier: number; // 1.0 = base, 1.3 = 30% faster rollout within each chain
  arpuMultiplier: number; // 1.0 = base, platform improvements → higher ARPU
}

// Monte Carlo
export interface MonteCarloParams {
  runs: number;
  chainRolloutVariance: number;
  chainPipelineMin: number;
  chainPipelineMax: number;
  indieRateMin: number;
  indieRateMax: number;
  indieChurnMin: number;
  indieChurnMax: number;
  arpuVariance: number;
  phase2TimingMin: number;
  phase2TimingMax: number;
  phase3TimingMin: number;
  phase3TimingMax: number;
  hiringTimingVariance: number;
  infraVariance: number;
  aiCogsMin: number;
  aiCogsMax: number;
  seriesASize: { min: number; max: number; mode: number };
  seriesATiming: { min: number; max: number };
  seriesAMultiple: { min: number; max: number; mode: number };
  seriesBSize: { min: number; max: number; mode: number };
  seriesBTiming: { min: number; max: number };
  seriesCSize: { min: number; max: number; mode: number };
  seriesCTiming: { min: number; max: number };
}

export interface MonteCarloResult {
  scenario: string;
  percentiles: {
    arr: Record<string, { p10: number; p25: number; p50: number; p75: number; p90: number }>;
    cash: Record<string, { p10: number; p25: number; p50: number; p75: number; p90: number }>;
    valuation: Record<string, { p10: number; p25: number; p50: number; p75: number; p90: number }>;
    marcoEquity: Record<string, { p10: number; p25: number; p50: number; p75: number; p90: number }>;
  };
  probabilities: {
    cashRunout: number;
    vestingM12: number;
    vestingM24: number;
    vestingM36: number;
    defaultAlive: Record<string, number>;
  };
  burnMultiple: Record<string, { p10: number; p50: number; p90: number }>;
  distributions: {
    arrM48: number[];
    arrM60: number[];
    cashM48: number[];
    cashM60: number[];
    valuationM48: number[];
    valuationM60: number[];
  };
}
