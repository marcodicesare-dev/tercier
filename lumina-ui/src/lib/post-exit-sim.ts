// Post-Exit Life Simulator — interactive, real numbers

export interface LifeInputs {
  exitProceeds: number; // CHF in pocket, tax-free
  preExitSavings: number;

  // Wife
  wifeGross2030: number; // CHF gross at exit year
  wifeKeepsWorking: boolean;
  wifeGrowthRate: number; // annual raise %

  // Housing
  mortgageMonthly: number; // CHF/mo (interest + Nebenkosten + garage)
  amortizationYearly: number; // CHF/yr principal
  payOffMortgage: boolean;
  mortgageBalance: number; // outstanding balance if paying off

  // Living (monthly, excluding housing & travel)
  groceries: number;
  healthInsurance: number; // KVG both
  transport: number; // GA, fuel, parking
  utilities: number; // phone, internet, streaming
  clothing: number;
  personal: number; // haircuts, wellness, gym
  diningOut: number; // restaurants & bars
  subscriptions: number; // apps, newspapers, etc.
  miscMonthly: number;

  // Car
  currentCarPayment: number; // leasing CHF/mo
  upgradeCarCost: number; // one-time purchase CHF
  upgradeCar: boolean;
  newCarMonthly: number; // insurance + maintenance if owned

  // Travel
  travelBudget: number; // CHF/yr
  trips: TripPlan[];

  // Property purchase
  buyVacationProperty: boolean;
  propertyPrice: number; // CHF
  propertyMortgagePct: number; // % financed
  propertyMonthlyCosts: number; // maintenance, taxes, utilities

  // Investment
  investmentReturn: number; // annual % (e.g., 0.05 for 5%)
  inflation: number; // annual % (e.g., 0.02)

  // Wealth tax
  wealthTaxEnabled: boolean;

  // Angel investing
  angelBudgetYearly: number;
  angelYears: number; // how many years to deploy

  // Philanthropy
  philanthropyYearly: number;

  // Simulation
  yearsToSimulate: number; // default 20
}

export interface TripPlan {
  id: string;
  name: string;
  weeks: number; // 0.5 = weekend
  costPerTrip: number;
  perYear: number; // how many times per year
}

export interface YearProjection {
  year: number;
  age: number;
  // Income
  wifeIncome: number;
  passiveIncome: number;
  totalIncome: number;
  // Expenses
  housing: number;
  living: number;
  car: number;
  travel: number;
  property: number;
  angel: number;
  philanthropy: number;
  wealthTax: number;
  totalExpenses: number;
  // Net
  netCashflow: number;
  // Wealth
  investedAssets: number;
  realEstateEquity: number;
  totalNetWorth: number;
  // Metrics
  yearsOfRunway: number; // at current burn, how many years left (999 = infinite)
  monthlyBurn: number;
  passiveIncomeCoversExpenses: boolean;
}

// Zurich wealth tax (married, PwC 2026 brackets × 2.14 multiplier)
function zurichWealthTax(netAssets: number): number {
  if (netAssets <= 0) return 0;
  const brackets: [number, number, number][] = [
    [0, 161000, 0],
    [161000, 403000, 0.0005],
    [403000, 805000, 0.0010],
    [805000, 1451000, 0.0015],
    [1451000, 2418000, 0.0020],
    [2418000, 3385000, 0.0025],
    [3385000, Infinity, 0.0030],
  ];
  let tax = 0;
  for (const [low, high, rate] of brackets) {
    if (netAssets <= low) break;
    tax += (Math.min(netAssets, high) - low) * rate;
  }
  return Math.round(tax * 2.14);
}

// Wife net income from gross (Zurich married)
function wifeNetFromGross(gross: number): number {
  const ahv = gross * 0.053;
  const alv = Math.min(gross, 148200) * 0.011;
  const bvg = 4500;
  const taxable = gross - ahv - alv - bvg - 5000; // deductions
  const effectiveTaxRate = 0.17; // ~17% effective on her portion, married
  const tax = taxable * effectiveTaxRate;
  return Math.round(gross - ahv - alv - bvg - tax);
}

export function runLifeSimulation(inputs: LifeInputs): YearProjection[] {
  const projections: YearProjection[] = [];

  let investedAssets = inputs.exitProceeds + inputs.preExitSavings;
  let realEstateEquity = 0;

  // Pay off mortgage in year 0 if chosen
  if (inputs.payOffMortgage) {
    investedAssets -= inputs.mortgageBalance;
  }

  // Buy vacation property in year 0 if chosen
  if (inputs.buyVacationProperty) {
    const downPayment = inputs.propertyPrice * (1 - inputs.propertyMortgagePct / 100);
    investedAssets -= downPayment;
    realEstateEquity = downPayment;
  }

  // Car upgrade in year 0
  if (inputs.upgradeCar) {
    investedAssets -= inputs.upgradeCarCost;
  }

  let wifeGross = inputs.wifeGross2030;

  for (let y = 0; y < inputs.yearsToSimulate; y++) {
    const age = 38 + y;

    // Income
    const wifeIncome = inputs.wifeKeepsWorking ? wifeNetFromGross(wifeGross) : 0;
    const passiveIncome = Math.round(investedAssets * inputs.investmentReturn);
    const totalIncome = wifeIncome + passiveIncome;

    // Expenses
    const housing = inputs.payOffMortgage
      ? (inputs.mortgageMonthly - 800) * 12 // just Nebenkosten + garage, rough
      : inputs.mortgageMonthly * 12 + inputs.amortizationYearly;

    const livingMonthly = inputs.groceries + inputs.healthInsurance + inputs.transport +
      inputs.utilities + inputs.clothing + inputs.personal + inputs.diningOut +
      inputs.subscriptions + inputs.miscMonthly;
    const living = livingMonthly * 12;

    const car = inputs.upgradeCar
      ? inputs.newCarMonthly * 12
      : inputs.currentCarPayment * 12;

    const travel = Math.round(inputs.travelBudget * Math.pow(1 + inputs.inflation, y));

    const property = inputs.buyVacationProperty ? inputs.propertyMonthlyCosts * 12 : 0;

    const angel = y < inputs.angelYears ? inputs.angelBudgetYearly : 0;
    const philanthropy = inputs.philanthropyYearly;

    const wealthTax = inputs.wealthTaxEnabled ? zurichWealthTax(investedAssets + realEstateEquity) : 0;

    const totalExpenses = housing + living + car + travel + property + angel + philanthropy + wealthTax;

    // Net cashflow
    const netCashflow = totalIncome - totalExpenses;

    // Update invested assets
    investedAssets = investedAssets + netCashflow;

    // Real estate appreciates ~1.5%/yr in Zurich
    if (inputs.buyVacationProperty) {
      realEstateEquity = Math.round(realEstateEquity * 1.015);
    }

    const totalNetWorth = investedAssets + realEstateEquity;
    const monthlyBurn = totalExpenses > totalIncome ? (totalExpenses - totalIncome) / 12 : 0;
    const yearsOfRunway = netCashflow >= 0 ? 999 : Math.round(investedAssets / (totalExpenses - totalIncome));

    projections.push({
      year: 2030 + y,
      age,
      wifeIncome,
      passiveIncome,
      totalIncome,
      housing,
      living,
      car,
      travel,
      property,
      angel,
      philanthropy,
      wealthTax,
      totalExpenses,
      netCashflow,
      investedAssets: Math.round(investedAssets),
      realEstateEquity: Math.round(realEstateEquity),
      totalNetWorth: Math.round(totalNetWorth),
      yearsOfRunway,
      monthlyBurn: Math.round(monthlyBurn),
      passiveIncomeCoversExpenses: passiveIncome >= totalExpenses,
    });

    // Wife salary grows
    wifeGross = Math.round(wifeGross * (1 + inputs.wifeGrowthRate));
  }

  return projections;
}

export const DEFAULT_TRIPS: TripPlan[] = [
  { id: '1', name: 'Sardinia (2 weeks, summer)', weeks: 2, costPerTrip: 15000, perYear: 1 },
  { id: '2', name: 'Japan / SE Asia (3 weeks)', weeks: 3, costPerTrip: 30000, perYear: 1 },
  { id: '3', name: 'European city (long weekend)', weeks: 0.5, costPerTrip: 2500, perYear: 6 },
  { id: '4', name: 'Italy family visit', weeks: 1, costPerTrip: 3000, perYear: 2 },
  { id: '5', name: 'Christmas/NYE trip', weeks: 1.5, costPerTrip: 20000, perYear: 1 },
];

export function getDefaultInputs(exitProceeds: number): LifeInputs {
  const travelFromTrips = DEFAULT_TRIPS.reduce((s, t) => s + t.costPerTrip * t.perYear, 0);

  return {
    exitProceeds,
    preExitSavings: 300000,

    wifeGross2030: 154500, // CHF 140K (2026) + 2.5%/yr for 4 years
    wifeKeepsWorking: true,
    wifeGrowthRate: 0.025,

    mortgageMonthly: 1500,
    amortizationYearly: 16000,
    payOffMortgage: false,
    mortgageBalance: 400000, // rough estimate

    groceries: 1200,
    healthInsurance: 800,
    transport: 200,
    utilities: 250,
    clothing: 400,
    personal: 500, // gym, wellness, haircuts
    diningOut: 1500,
    subscriptions: 150,
    miscMonthly: 500,

    currentCarPayment: 1217,
    upgradeCarCost: 160000, // Porsche Taycan GTS
    upgradeCar: false,
    newCarMonthly: 600, // insurance + maintenance if owned

    travelBudget: Math.max(100000, travelFromTrips),
    trips: [...DEFAULT_TRIPS],

    buyVacationProperty: false,
    propertyPrice: 800000, // Sardinia nice villa
    propertyMortgagePct: 50,
    propertyMonthlyCosts: 1500, // maintenance, taxes, property management

    investmentReturn: 0.05,
    inflation: 0.02,

    wealthTaxEnabled: true,

    angelBudgetYearly: Math.round(exitProceeds * 0.02),
    angelYears: 5,

    philanthropyYearly: Math.round(exitProceeds * 0.005),

    yearsToSimulate: 20,
  };
}
