// Post-exit financial calculations

export interface ExitScenario {
  label: string;
  exitProceeds: number;
  totalLiquid: number;
  wealthTaxAnnual: number;
  passive3pct: number;
  passive5pct: number;
  passive7pct: number;
  wifeNetSalary: number;
  totalAnnual3pct: number;
  totalAnnual5pct: number;
}

// Pre-exit savings calculation
export function calcPreExitSavings(): { total: number; breakdown: string[] } {
  // Marco's gross salary over 4 years (Jul 2026 - Jun 2030)
  const marcoGross = [
    { period: 'Jul 2026 – Jun 2027', months: 12, annual: 106080 },
    { period: 'Jul 2027 – Dec 2027', months: 6, annual: 150000 },
    { period: 'Jan 2028 – Dec 2028', months: 12, annual: 180000 },
    { period: 'Jan 2029 – Jun 2030', months: 18, annual: 220000 },
  ];
  const totalMarcoGross = marcoGross.reduce((s, p) => s + (p.annual / 12) * p.months, 0);
  // ~CHF 776K gross over 4 years

  // Wife's gross: 140K, +2.5%/yr
  const wifeYears = [140000, 143500, 147088, 150765, 154534]; // 2026-2030
  // Jul 2026 - Jun 2030 = 4 years
  const totalWifeGross = (wifeYears[0] / 2) + wifeYears[1] + wifeYears[2] + wifeYears[3] + (wifeYears[4] / 2);
  // ~CHF 618K gross over 4 years

  const totalHouseholdGross = totalMarcoGross + totalWifeGross;

  // Tax: married, Zurich, ~30-35% effective on their combined income (progressive)
  // Average effective rate over the period: ~28-32% (lower in early years)
  const avgTaxRate = 0.30;
  const totalNet = totalHouseholdGross * (1 - avgTaxRate);

  // AHV/IV/EO + ALV: ~6.4% employee share on both salaries
  const socialDeductions = totalHouseholdGross * 0.064;
  const netAfterSocial = totalNet - socialDeductions;

  // Housing: CHF 34K/yr × 4 = CHF 136K
  const housing = 34000 * 4;

  // Living expenses: CHF 5K-6K/mo for couple in Zurich (no kids, own apartment)
  // Food, transport, insurance (KVG ~CHF 800/mo total), utilities, clothes, fun
  const livingExpenses = 5500 * 12 * 4; // CHF 264K

  // Discretionary (restaurants, travel, hobbies): CHF 2K/mo
  const discretionary = 2000 * 12 * 4; // CHF 96K

  const totalExpenses = housing + livingExpenses + discretionary;
  const savings = Math.round(netAfterSocial - totalExpenses);

  return {
    total: Math.round(savings / 10000) * 10000, // round to nearest 10K → ~CHF 300K
    breakdown: [
      `Total household gross (4yr): CHF ${Math.round(totalHouseholdGross).toLocaleString()}`,
      `After tax & social (~30% + 6.4%): CHF ${Math.round(netAfterSocial).toLocaleString()}`,
      `Housing (4yr): CHF ${housing.toLocaleString()}`,
      `Living expenses (4yr): CHF ${livingExpenses.toLocaleString()}`,
      `Discretionary (4yr): CHF ${discretionary.toLocaleString()}`,
      `Estimated savings: CHF ${Math.round(savings).toLocaleString()}`,
    ],
  };
}

// Zurich wealth tax rates (married, 2026)
// Source: PwC Tax Summaries 2026, official Zurich cantonal brackets
// Basic cantonal tax × 2.14 multiplier (cantonal 0.95 + municipal 1.19)
function zurichWealthTaxBasic(netAssets: number): number {
  // Zurich brackets (married, basic cantonal tax):
  // 0 – 161K: 0%, 161K–403K: 0.05%, 403K–805K: 0.10%,
  // 805K–1,451K: 0.15%, 1,451K–2,418K: 0.20%, 2,418K–3,385K: 0.25%, 3,385K+: 0.30%
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
    const taxable = Math.min(netAssets, high) - low;
    tax += taxable * rate;
  }
  return tax;
}

function zurichWealthTax(netAssets: number): number {
  return Math.round(zurichWealthTaxBasic(netAssets) * 2.14); // cantonal + municipal multiplier
}

export function calcScenarios(): ExitScenario[] {
  const savings = calcPreExitSavings().total;
  const wifeNetSalary = 105000; // CHF ~155K gross → ~105K net (married, Zurich)

  const exits = [5_000_000, 10_000_000, 20_000_000, 30_000_000, 40_000_000];
  const labels = ['A', 'B', 'C', 'D', 'E'];

  return exits.map((exit, i) => {
    const total = exit + savings;
    const wealthTax = zurichWealthTax(total);
    const investable = total - wealthTax; // first year
    const p3 = Math.round(total * 0.03);
    const p5 = Math.round(total * 0.05);
    const p7 = Math.round(total * 0.07);

    return {
      label: labels[i],
      exitProceeds: exit,
      totalLiquid: total,
      wealthTaxAnnual: wealthTax,
      passive3pct: p3,
      passive5pct: p5,
      passive7pct: p7,
      wifeNetSalary,
      totalAnnual3pct: p3 + wifeNetSalary,
      totalAnnual5pct: p5 + wifeNetSalary,
    };
  });
}

// Lifestyle budgets by tier
export interface LifestyleBudget {
  travel: number;
  dining: number;
  car: string;
  carCost: number;
  realEstate: string;
  realEstateBudget: number;
  spontaneity: string;
  giving: string;
  feel: string;
  angelBudget: number;
  recommendation: string;
}

export function getLifestyle(exitChf: number): LifestyleBudget {
  if (exitChf <= 5_000_000) {
    return {
      travel: 25000,
      dining: 12000,
      car: 'Keep current car. Maybe a Tesla Model 3 Long Range AWD (CHF 49K) as a treat.',
      carCost: 49000,
      realEstate: 'Stay in Wiedikon. Do not upgrade. Your low housing costs are your superpower. A 120m2 in Wiedikon is CHF 2.1-3M now — you already own it.',
      realEstateBudget: 0,
      spontaneity: 'You can do "let\'s go to Lisbon this weekend" — but you notice it in the budget. Maybe 2-3 spontaneous trips a year.',
      giving: 'You pick up dinner for friends without thinking. You fly your parents in economy for visits. Philanthropy is small donations, not a strategy.',
      feel: 'You\'re comfortable but not "rich rich." You still budget big purchases. The CHF 5M is freedom FROM worry, not freedom TO do whatever. A CHF 500 jacket — you buy it but you register the spend. You\'re aware of the burn rate if you\'re not earning.',
      angelBudget: 500000,
      recommendation: 'BUILD AGAIN or JOIN SOMETHING. At CHF 5M in Zurich with no income, you\'re burning ~CHF 80-100K/yr just existing. The passive income at 5% (CHF 265K) covers living but doesn\'t feel abundant. You need to generate income within 12-18 months. Best play: take 3-6 months off, then either build company #2 (self-fund seed with CHF 200-300K) or take a VP/CPO role at CHF 300K+.',
    };
  }
  if (exitChf <= 10_000_000) {
    return {
      travel: 50000,
      dining: 20000,
      car: 'BMW 530i M Sport (CHF 90K) or Porsche Taycan GTS (CHF 160K). You can afford it without blinking.',
      carCost: 130000,
      realEstate: 'Stay in Wiedikon for now. Could upgrade to Enge (CHF 2.2-3.1M for 120m2) or Seefeld (CHF 2.3-3.2M). No rush — your current setup is already solid.',
      realEstateBudget: 2700000,
      spontaneity: '"Let\'s fly to Lisbon" is a yes without hesitation. You book business class for any flight over 4 hours. You stop checking restaurant prices.',
      giving: 'You casually pick up dinner for 8 at CHF 2K without thinking. You fly parents business class to Zurich. You give CHF 5-10K/yr to causes you care about.',
      feel: 'You\'re wealthy. Not "fuck you" money, but "I don\'t need to work" money. A CHF 500 jacket — zero thought. A CHF 5K watch — sure, why not. A CHF 50K car upgrade — a decision but not a stressful one. You fly business class without a second thought.',
      angelBudget: 1000000,
      recommendation: 'THE BARBELL. This is the sweet spot. You have ~CHF 530K/yr passive at 5% + wife\'s CHF 105K = CHF 635K/yr. That\'s abundant living in Zurich. Spend 80% of time on low-burn activities (2-3 advisory boards at CHF 50K each, angel investing CHF 50-100K per deal). Keep 20% for a high-conviction project that could become company #2. No pressure to raise — you can self-fund to product-market fit.',
    };
  }
  if (exitChf <= 20_000_000) {
    return {
      travel: 100000,
      dining: 35000,
      car: 'Porsche 911 Carrera S (CHF 176K) or Taycan Turbo GT (CHF 250K). Or both.',
      carCost: 210000,
      realEstate: 'Upgrade to Seefeld (CHF 2.5-3.2M for 120m2) or Zürichberg 150m2 (CHF 3-5M). Buy a vacation place in Engadin — Pontresina (CHF 1.7-2.4M) or St. Moritz (CHF 2.4-3.2M). Or Ascona (CHF 1.1-1.6M).',
      realEstateBudget: 6000000,
      spontaneity: 'Completely unrestricted. "Let\'s do two weeks in Japan, Aman Tokyo and ryokans, business class" — yes, that\'s CHF 25K and you don\'t feel it. You rent villas, not hotel rooms.',
      giving: 'You gift experiences freely — fly the whole family somewhere nice, rent a villa for 12 people in Sardinia. Philanthropy becomes meaningful: CHF 50-100K/yr to things you care about.',
      feel: 'You\'re wealthy, full stop. A CHF 3M apartment upgrade is a decision, not a dream. Money is a tool. You never think about restaurant prices, flight classes, or whether you "should" buy something under CHF 10K. The psychological shift is real: you\'re making choices based on what you WANT, not what you can afford.',
      angelBudget: 2000000,
      recommendation: 'FULL FREEDOM. At CHF 20M, building again is a CHOICE, not a necessity. That changes everything psychologically. Best play: Take a real year off — not "working on stuff" but actual decompression. Travel slowly. Then either: (a) angel invest seriously (20+ deals, CHF 100K each), or (b) incubate your next company with zero time pressure. You can afford to spend 2 years finding the right idea.',
    };
  }
  if (exitChf <= 30_000_000) {
    return {
      travel: 150000,
      dining: 50000,
      car: 'Whatever you want. Porsche 911 Turbo S (CHF 310K), keep a daily driver. It\'s noise.',
      carCost: 310000,
      realEstate: 'Premium Zürichberg 150m2 (CHF 3-5M) or Seefeld penthouse. Plus vacation: Engadin chalet (CHF 2-3M in St. Moritz) AND Como waterfront (EUR 600K-1.2M). Total real estate portfolio: CHF 7-9M.',
      realEstateBudget: 8000000,
      spontaneity: 'Everything is a yes. First class to Tokyo? Sure. Private chef for a dinner party? Why not. You\'re not checking prices on anything under CHF 50K.',
      giving: 'You can buy a small building. You set up a small foundation or donor-advised fund. Philanthropy is strategic, not performative. You gift generously to family without any thought.',
      feel: 'Money is a tool, not a constraint. Your problems are about meaning, legacy, and what to do with your time — not money. You could buy a small apartment building as an investment. You\'re in the top 1% of wealth in Switzerland.',
      angelBudget: 3000000,
      recommendation: 'INVESTOR + BUILDER. You\'re a serious angel now. Allocate CHF 3M to 30 deals (CHF 100K each). Join 2-3 boards. This gives you deal flow, pattern recognition, and a network for when you find the next big thing. When you do build again — and you will, because you\'re wired for it — you can write yourself a CHF 1-2M seed check and move fast.',
    };
  }
  // 40M+
  return {
    travel: 200000,
    dining: 60000,
    car: 'Irrelevant. Porsche 911 Carrera GTS (CHF 210K) or Turbo S (CHF 310K). Keep a Tesla M3 (CHF 49K) for daily. Cars are rounding errors.',
    carCost: 360000,
    realEstate: 'Premium Zürichberg villa or Seefeld penthouse (CHF 5-8M). Vacation home in St. Moritz (CHF 2.5-3.5M) AND Italian coast — Liguria (EUR 500K-1M) or Como waterfront (EUR 800K-1.5M). Total real estate: CHF 9-13M.',
    realEstateBudget: 11000000,
    spontaneity: 'First class everywhere. Private jet for special occasions (CHF 15-25K one-way Europe). You literally cannot spend faster than your passive income generates.',
    giving: 'You\'re in the top 0.1% in Switzerland. Set up a proper foundation. Gift freely — fly 20 people to your birthday in Sardinia, fund a scholarship, back causes with CHF 100K+ checks.',
    feel: 'Your problems are about meaning, not money. The existential question hits harder here: "I can do literally anything, so what do I actually want?" This is where most founders discover that money was never the goal — the building was. CHF 40M in Zurich means you never need to think about money again, for generations.',
    angelBudget: 4000000,
    recommendation: 'YOU\'RE A FUND. At CHF 40M, you could run a small venture fund (CHF 5-10M fund I). You have the operator credibility, the network from Tercier, and the capital. This is the highest-impact version of "what\'s next" — you\'re building an ecosystem, not just a company. Alternative: build something massive. Self-fund to Series A, then raise from a position of absolute strength. You\'re 38 — you have 2-3 more big chapters ahead.',
  };
}

export interface TravelExample {
  trip: string;
  details: string;
  cost: number;
}

export function getTravelExamples(exitChf: number): TravelExample[] {
  const base: TravelExample[] = [
    { trip: '3 weeks Japan', details: `Business class ZRH-TYO (CHF 7K×2), ryokans in Kyoto CHF 800/night (Tawaraya), Aman Tokyo CHF 4,500/night × 3`, cost: exitChf >= 20_000_000 ? 35000 : 20000 },
    { trip: '2 weeks Sardinia (summer)', details: exitChf >= 20_000_000 ? 'Villa rental (CHF 5-8K/week), boat charter 2 days (CHF 3K)' : 'Nice villa (CHF 3.5-5K/week), day boat rental (CHF 1.5K)', cost: exitChf >= 20_000_000 ? 22000 : 12000 },
    { trip: 'Ski week Verbier', details: 'Chalet 4-bed (CHF 10-12K/week), 4 Vallées lift passes (CHF 1,300/2 adults), ski rental, dining', cost: exitChf >= 20_000_000 ? 18000 : 16000 },
    { trip: 'Long weekends (×4)', details: 'Paris, Lisbon (easyJet CHF 130 RT), Barcelona, London — flights + 2 nights nice hotel', cost: exitChf >= 10_000_000 ? 12000 : 6000 },
  ];

  if (exitChf >= 20_000_000) {
    base.push({ trip: 'St. Barths (1 week)', details: 'Cheval Blanc St-Barths (CHF 7,500/night × 7) + business class flights', cost: 60000 });
  }
  if (exitChf >= 30_000_000) {
    base.push({ trip: 'Patagonia / New Zealand', details: '3 weeks, luxury lodges, private guides, business class ZRH-SCL (CHF 6K×2)', cost: 45000 });
  }

  return base;
}
