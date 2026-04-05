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
  // Wife: CHF 140K (2026) + 2.5%/yr → CHF 154.5K gross by mid-2030
  // Zurich married: AHV 5.3% + ALV 1.1% + BVG ~4.5K + income tax ~16-18% effective on her portion
  // Net: ~CHF 117K at exit year
  const wifeNetSalary = 117000;

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
  // Calibration: Marco already spends ~CHF 30-40K/yr on travel + dining at CHF 250K gross.
  // With CHF 5M+ in the bank, these numbers must START above current spending.
  if (exitChf <= 5_000_000) {
    return {
      travel: 60000,
      dining: 25000,
      car: 'Porsche Taycan base (CHF 100K) or BMW 530i M Sport (CHF 90K). You can swing it — it\'s 2% of your net worth.',
      carCost: 95000,
      realEstate: 'Stay in Wiedikon. Do not upgrade. Your CHF 34K/yr housing cost is a cheat code. A 120m2 in Wiedikon is CHF 2.1-3M now — you already own it. That\'s CHF 2M+ of equity not even counting the exit.',
      realEstateBudget: 0,
      spontaneity: '"Let\'s go to Lisbon this weekend" — yes, every time (easyJet CHF 130 RT + hotel CHF 400). You were already doing this. Now you just don\'t check the bank account after. 4-5 spontaneous trips a year, easy.',
      giving: 'You pick up dinner for 8 (CHF 2K at Kronenhalle) without thinking. You fly your parents business class to visit (CHF 3K RT from Rome). Philanthropy: CHF 5-10K/yr targeted donations.',
      feel: 'You\'re rich by any normal standard — but not "Zurich rich." CHF 5M generates CHF 265K/yr passive at 5%. Add wife\'s CHF 117K and you have CHF 382K/yr without working. That\'s more than most Swiss households earn. A CHF 500 jacket — zero thought. A CHF 5K weekend trip — sure. A CHF 50K splurge — you pause and think. You\'re free from financial anxiety, but you\'re not lavish.',
      angelBudget: 500000,
      recommendation: 'BUILD AGAIN or THE BARBELL. CHF 382K/yr passive + wife is comfortable but not set-for-generations. You have 2-3 years of runway to figure out what\'s next without panic. Best play: take 6 months off (travel, decompress), then build company #2 with CHF 200-300K self-funded seed. Your credibility is 10x higher now. Or: 2-3 advisory boards (CHF 50-80K each) + angel investing + keep one day/week for a side project.',
    };
  }
  if (exitChf <= 10_000_000) {
    return {
      travel: 80000,
      dining: 35000,
      car: 'Porsche Taycan GTS (CHF 160K) or 911 Carrera (CHF 153K). Both are "nice but not flashy" — which is the Zurich sweet spot.',
      carCost: 155000,
      realEstate: 'Stay in Wiedikon for now — your housing costs are absurdly efficient. But you could upgrade to Enge (CHF 2.2-3.1M for 120m2) or Seefeld (CHF 2.3-3.2M) and still have CHF 7M+ invested. No rush — but you can afford it whenever you want.',
      realEstateBudget: 2700000,
      spontaneity: 'Completely unrestricted for anything under CHF 5K. Business class on every flight over 3 hours. "Let\'s do 10 days in Japan" — yes, booked by tomorrow. You stop looking at restaurant prices entirely.',
      giving: 'Dinner for 10 at a nice restaurant (CHF 3K)? Just sign the check. Parents in business class? Obviously. You start giving CHF 10-20K/yr to causes, and it doesn\'t register as a sacrifice.',
      feel: 'This is "I don\'t need to work, ever" money. CHF 530K/yr passive + wife\'s CHF 117K = CHF 647K/yr. In Zurich, that puts you in the top 5% of household income WITHOUT working. A CHF 500 jacket is irrelevant. A CHF 5K watch — sure. A CHF 50K car upgrade — yes. CHF 100K on a renovation — a project, not a stress. You fly business everywhere without a thought. The psychology shifts: money is a resource, not a constraint.',
      angelBudget: 1000000,
      recommendation: 'THE BARBELL. This is the sweet spot where you have fuck-you money AND enough to take risks. CHF 647K/yr passive means zero pressure. Best play: take a real year off, then 80% of time on low-burn activities (2-3 advisory boards at CHF 50-80K each, 10 angel bets at CHF 100K). Keep 20% for a high-conviction project. When the right idea hits, you can self-fund to PMF without raising a cent.',
    };
  }
  if (exitChf <= 20_000_000) {
    return {
      travel: 150000,
      dining: 60000,
      car: 'Porsche 911 Carrera S (CHF 176K) AND a Taycan for daily (CHF 100K). Two cars, why not — it\'s 1.4% of your net worth.',
      carCost: 280000,
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
  // Baseline: Marco already travels 3-4x/year at CHF 250K gross. These must exceed that.
  const base: TravelExample[] = [
    {
      trip: '3 weeks Japan (spring)',
      details: exitChf >= 10_000_000
        ? 'Business class ZRH-TYO (CHF 7K×2), Aman Tokyo 3 nights (CHF 4,500/n), 5 nights ryokans in Kyoto (CHF 800/n Tawaraya), Naoshima + Hakone'
        : 'Business class ZRH-TYO (CHF 7K×2), boutique hotels (CHF 300-500/n), 2-3 ryokans (CHF 500-800/n)',
      cost: exitChf >= 10_000_000 ? 35000 : 22000,
    },
    {
      trip: '2 weeks Sardinia / Puglia (summer)',
      details: exitChf >= 20_000_000
        ? 'Private villa with pool (CHF 8-12K/week), boat charter 3 days (CHF 5K), restaurants nightly'
        : 'Nice villa (CHF 4-6K/week), day boat rental, eating out every night (CHF 150/couple)',
      cost: exitChf >= 20_000_000 ? 28000 : 15000,
    },
    {
      trip: 'Ski week Verbier / Zermatt',
      details: 'Chalet 4-bed (CHF 10-12K/week), lift passes (CHF 1,300/2 adults), ski rental, dining out nightly, spa day at W Verbier',
      cost: 18000,
    },
    {
      trip: 'Long weekends (×6)',
      details: 'Paris, Lisbon, Barcelona, London, Rome, Copenhagen — easyJet/SWISS + 2-3 nights boutique hotel (CHF 300-500/n)',
      cost: exitChf >= 10_000_000 ? 15000 : 10000,
    },
    {
      trip: 'Christmas / NYE trip',
      details: exitChf >= 10_000_000
        ? '10 days Maldives or Thailand — business class, 5-star resort (CHF 600-1,500/n)'
        : '1 week Canaries or Morocco — nice resort (CHF 300-500/n)',
      cost: exitChf >= 10_000_000 ? 20000 : 8000,
    },
  ];

  if (exitChf >= 10_000_000) {
    base.push({
      trip: 'Parents visit / family trips (×2)',
      details: 'Fly parents business class from Italy (CHF 3K RT), week together in Ticino or at your place',
      cost: 8000,
    });
  }
  if (exitChf >= 20_000_000) {
    base.push({
      trip: 'St. Barths or Maldives (1 week)',
      details: 'Cheval Blanc St-Barths (CHF 7,500/night × 7) or Soneva Fushi (CHF 3,000/n × 7) + business class',
      cost: 55000,
    });
  }
  if (exitChf >= 30_000_000) {
    base.push({
      trip: 'Patagonia / New Zealand (3 weeks)',
      details: 'Luxury lodges (Explora, Blanket Bay), private guides, internal flights, business class ZRH-SCL (CHF 6K×2)',
      cost: 45000,
    });
  }

  return base;
}
