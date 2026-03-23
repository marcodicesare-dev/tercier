import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from "recharts";

const formatCHF = (n) => {
  if (Math.abs(n) >= 1_000_000) return `CHF ${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `CHF ${(n / 1_000).toFixed(0)}K`;
  return `CHF ${n.toFixed(0)}`;
};

const formatCHFShort = (n) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n.toFixed(0)}`;
};

// Growth models: hotels per month (cumulative) for 60 months
function generateGrowthCurve(scenario) {
  const hotels = [];
  for (let m = 0; m <= 60; m++) {
    let h;
    if (scenario === "bear") {
      // Conservative downside, aligned to the operator-seeded scenario shape.
      if (m <= 6) h = Math.round((m / 6) * 7);
      else if (m <= 12) h = Math.round(7 + ((m - 6) / 6) * 15);
      else if (m <= 18) h = Math.round(22 + ((m - 12) / 6) * 14);
      else if (m <= 36) h = Math.round(36 + ((m - 18) / 18) * 56);
      else h = Math.round(92 + ((m - 36) / 24) * 86);
    } else if (scenario === "base") {
      // Operator-seeded P50 from the business-plan Monte Carlo.
      if (m <= 6) h = Math.round((m / 6) * 10);
      else if (m <= 12) h = Math.round(10 + ((m - 6) / 6) * 20);
      else if (m <= 18) h = Math.round(30 + ((m - 12) / 6) * 17);
      else if (m <= 36) h = Math.round(47 + ((m - 18) / 18) * 68);
      else h = Math.round(115 + ((m - 36) / 24) * 112);
    } else {
      // Follow-on angel P50 from the rebuilt business-plan Monte Carlo.
      if (m <= 6) h = Math.round((m / 6) * 12);
      else if (m <= 12) h = Math.round(12 + ((m - 6) / 6) * 23);
      else if (m <= 18) h = Math.round(35 + ((m - 12) / 6) * 23);
      else if (m <= 36) h = Math.round(58 + ((m - 18) / 18) * 96);
      else h = Math.round(154 + ((m - 36) / 24) * 167);
    }
    hotels.push(h);
  }
  return hotels;
}

// ACV ramp: starts at PoV pricing, then climbs toward full-platform / expansion pricing.
function getACV(month) {
  if (month <= 6) return 1500; // proof of value
  if (month <= 12) return 2200;
  if (month <= 24) return 2600;
  if (month <= 36) return 2900;
  return 3400;
}

// Exit multiples
function getExitMultiple(scenario, month) {
  // Early exits get lower multiples
  const baseMultiple = scenario === "bear" ? 4.0 : scenario === "base" ? 5.0 : 5.15;
  if (month <= 24) return baseMultiple * 0.5;
  if (month <= 36) return baseMultiple * 0.7;
  if (month <= 48) return baseMultiple * 0.85;
  return baseMultiple;
}

// Swiss tax on salary (Zurich, simplified)
function salaryTaxRate(annualGross) {
  if (annualGross <= 22680) return 0.106; // just social contributions
  if (annualGross <= 36000) return 0.14;
  if (annualGross <= 48000) return 0.17;
  if (annualGross <= 72000) return 0.20;
  if (annualGross <= 120000) return 0.24;
  if (annualGross <= 180000) return 0.28;
  return 0.32;
}

// Revenue share is taxed as income (bonus)
function revShareTaxRate() {
  return 0.25; // approximate marginal rate on bonus income
}

// Capital gains on private shares: TAX FREE in Switzerland for individuals
function exitTaxRate() {
  return 0; // This is real — Swiss private capital gains = 0%
}

const SCENARIOS = [
  { key: "bear", label: "Downside (operator)", color: "#ef4444" },
  { key: "base", label: "Base (operator P50)", color: "#3b82f6" },
  { key: "bull", label: "Upside (follow-on angel P50)", color: "#22c55e" },
];

const EXIT_OPTIONS = [
  { month: 0, label: "No exit" },
  { month: 24, label: "Early exit (M24)" },
  { month: 36, label: "Exit at M36" },
  { month: 48, label: "Exit at M48" },
  { month: 60, label: "Full 5-year (M60)" },
];

function Slider({ label, value, onChange, min, max, step, format, sublabel }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-bold text-white">{format ? format(value) : value}</span>
      </div>
      {sublabel && <div className="text-xs text-gray-500 mb-1">{sublabel}</div>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

function ScenarioCard({ title, color, total, salary, revShare, exit, opacity }) {
  return (
    <div className="rounded-lg p-4 border" style={{ borderColor: color, backgroundColor: `${color}11`, opacity }}>
      <div className="text-sm font-medium mb-2" style={{ color }}>{title}</div>
      <div className="text-2xl font-bold text-white mb-3">{formatCHF(total)}</div>
      <div className="space-y-1 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Salary (net)</span>
          <span className="text-gray-300">{formatCHF(salary)}</span>
        </div>
        <div className="flex justify-between">
          <span>Rev share (net)</span>
          <span className="text-gray-300">{formatCHF(revShare)}</span>
        </div>
        <div className="flex justify-between">
          <span>Exit (tax-free!)</span>
          <span className="font-bold" style={{ color }}>{formatCHF(exit)}</span>
        </div>
      </div>
    </div>
  );
}

export default function CompSimulator() {
  // Comp inputs
  const [startSalary, setStartSalary] = useState(4000);
  const [salaryGrowthHotels, setSalaryGrowthHotels] = useState(10);
  const [grownSalary, setGrownSalary] = useState(8000);
  const [secondGrowthHotels, setSecondGrowthHotels] = useState(50);
  const [secondGrownSalary, setSecondGrownSalary] = useState(15000);
  const [revSharePct, setRevSharePct] = useState(2);
  const [equityPct, setEquityPct] = useState(25);
  const [exitMonth, setExitMonth] = useState(60);
  const [selectedScenario, setSelectedScenario] = useState("base");

  // Opportunity cost reference
  const currentSalary = 120000;

  const results = useMemo(() => {
    const allResults = {};

    for (const sc of SCENARIOS) {
      const hotels = generateGrowthCurve(sc.key);
      const timeline = [];
      let cumSalaryGross = 0;
      let cumSalaryNet = 0;
      let cumRevShareGross = 0;
      let cumRevShareNet = 0;
      let cumTotal = 0;
      let cumOpportunityCost = 0;

      for (let m = 0; m <= 60; m++) {
        const h = hotels[m];
        const acv = getACV(m);
        const monthlyMRR = h * acv; // EUR
        const monthlyMRR_CHF = monthlyMRR * 0.91; // EUR to CHF

        // Salary for this month
        let monthlySalary = startSalary;
        if (h >= secondGrowthHotels) monthlySalary = secondGrownSalary;
        else if (h >= salaryGrowthHotels) monthlySalary = grownSalary;

        const annualSalaryEstimate = monthlySalary * 12;
        const taxRate = salaryTaxRate(annualSalaryEstimate);
        const netSalary = monthlySalary * (1 - taxRate);

        cumSalaryGross += monthlySalary;
        cumSalaryNet += netSalary;

        // Revenue share
        const monthlyRevShare = monthlyMRR_CHF * (revSharePct / 100);
        const netRevShare = monthlyRevShare * (1 - revShareTaxRate());
        cumRevShareGross += monthlyRevShare;
        cumRevShareNet += netRevShare;

        // Opportunity cost
        cumOpportunityCost += currentSalary / 12;

        // Exit value at this month (if exit happens here)
        const annualizedARR = monthlyMRR * 12;
        const annualizedARR_CHF = annualizedARR * 0.91;
        const multiple = getExitMultiple(sc.key, m);
        const companyValuation = annualizedARR_CHF * multiple;
        const exitPayout = companyValuation * (equityPct / 100);
        const netExitPayout = exitPayout * (1 - exitTaxRate());

        // Total if exit happens at exitMonth
        let totalAtThisMonth = cumSalaryNet + cumRevShareNet;
        if (m === exitMonth) {
          totalAtThisMonth += netExitPayout;
        }
        cumTotal = cumSalaryNet + cumRevShareNet + (m >= exitMonth ? (exitMonth === 0 ? 0 : (() => {
          const hExit = hotels[exitMonth];
          const acvExit = getACV(exitMonth);
          const mrrExit = hExit * acvExit * 12 * 0.91;
          const multExit = getExitMultiple(sc.key, exitMonth);
          return mrrExit * multExit * (equityPct / 100) * (1 - exitTaxRate());
        })()) : 0);

        timeline.push({
          month: m,
          hotels: h,
          mrr: monthlyMRR,
          salary: Math.round(cumSalaryNet),
          revShare: Math.round(cumRevShareNet),
          total: Math.round(cumTotal),
          opportunityCost: Math.round(cumOpportunityCost * 0.75), // net of tax
        });
      }

      // Calculate exit payout
      const hExit = exitMonth > 0 ? hotels[exitMonth] : 0;
      const acvExit = exitMonth > 0 ? getACV(exitMonth) : 0;
      const arrExit = hExit * acvExit * 12 * 0.91;
      const multExit = exitMonth > 0 ? getExitMultiple(sc.key, exitMonth) : 0;
      const exitVal = arrExit * multExit;
      const exitPayout = exitVal * (equityPct / 100);

      // Sum salary and rev share up to exit (or 60 months)
      const endMonth = exitMonth > 0 ? exitMonth : 60;
      let totalSalaryNet = 0;
      let totalRevShareNet = 0;
      for (let m = 0; m <= endMonth; m++) {
        const h = hotels[m];
        let ms = startSalary;
        if (h >= secondGrowthHotels) ms = secondGrownSalary;
        else if (h >= salaryGrowthHotels) ms = grownSalary;
        totalSalaryNet += ms * (1 - salaryTaxRate(ms * 12));

        const acv = getACV(m);
        const mrr = h * acv * 0.91;
        totalRevShareNet += mrr * (revSharePct / 100) * (1 - revShareTaxRate());
      }

      allResults[sc.key] = {
        timeline,
        totalSalaryNet: Math.round(totalSalaryNet),
        totalRevShareNet: Math.round(totalRevShareNet),
        exitPayout: Math.round(exitPayout),
        exitValuation: Math.round(exitVal),
        grandTotal: Math.round(totalSalaryNet + totalRevShareNet + exitPayout),
        hotels: hotels,
      };
    }
    return allResults;
  }, [startSalary, salaryGrowthHotels, grownSalary, secondGrowthHotels, secondGrownSalary, revSharePct, equityPct, exitMonth]);

  const activeResult = results[selectedScenario];

  // Company burn impact
  const companySalaryCost = startSalary * 1.08; // salary + employer social
  const baseOpex = 4530;
  const seedCapital = 150000;
  const monthlyBurn = companySalaryCost + baseOpex;
  const runwayMonths = Math.floor(seedCapital / monthlyBurn);

  // Comparison data for bar chart
  const comparisonData = SCENARIOS.map((sc) => ({
    name: sc.label.split(" ")[0],
    salary: results[sc.key].totalSalaryNet,
    revShare: results[sc.key].totalRevShareNet,
    exit: results[sc.key].exitPayout,
    total: results[sc.key].grandTotal,
  }));

  // Opportunity cost over the period
  const endMonth = exitMonth > 0 ? exitMonth : 60;
  const opportunityCostNet = Math.round((currentSalary / 12) * 0.75 * endMonth); // net after ~25% tax

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Tercier Compensation Simulator</h1>
          <p className="text-gray-400 text-sm">
            Play with salary, revenue share, and equity to find your sweet spot across scenarios.
            <span className="text-green-400 ml-2">Swiss capital gains on private shares = 0% tax.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Salary controls */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-blue-400 mb-4 uppercase tracking-wider">Salary</h3>
              <Slider
                label="Starting salary"
                value={startSalary}
                onChange={setStartSalary}
                min={2000}
                max={8000}
                step={500}
                format={(v) => `CHF ${v.toLocaleString()}/mo`}
                sublabel="Pre-revenue phase"
              />
              <div className="border-t border-gray-800 my-3 pt-3">
                <div className="text-xs text-gray-500 mb-2">First bump</div>
                <Slider
                  label={`At ${salaryGrowthHotels} hotels →`}
                  value={grownSalary}
                  onChange={setGrownSalary}
                  min={4000}
                  max={15000}
                  step={500}
                  format={(v) => `CHF ${v.toLocaleString()}/mo`}
                />
                <Slider
                  label="Trigger (hotels)"
                  value={salaryGrowthHotels}
                  onChange={setSalaryGrowthHotels}
                  min={5}
                  max={25}
                  step={1}
                  format={(v) => `${v} hotels`}
                />
              </div>
              <div className="border-t border-gray-800 my-3 pt-3">
                <div className="text-xs text-gray-500 mb-2">Second bump</div>
                <Slider
                  label={`At ${secondGrowthHotels} hotels →`}
                  value={secondGrownSalary}
                  onChange={setSecondGrownSalary}
                  min={8000}
                  max={25000}
                  step={1000}
                  format={(v) => `CHF ${v.toLocaleString()}/mo`}
                />
                <Slider
                  label="Trigger (hotels)"
                  value={secondGrowthHotels}
                  onChange={setSecondGrowthHotels}
                  min={20}
                  max={100}
                  step={5}
                  format={(v) => `${v} hotels`}
                />
              </div>
              <div className="mt-3 p-3 bg-gray-800 rounded-lg text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Company cost (start)</span>
                  <span className="text-white">CHF {Math.round(companySalaryCost).toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between text-gray-400 mt-1">
                  <span>Runway (zero revenue)</span>
                  <span className="text-white font-bold">{runwayMonths} months</span>
                </div>
              </div>
            </div>

            {/* Revenue share */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-purple-400 mb-4 uppercase tracking-wider">Revenue Share</h3>
              <Slider
                label="% of MRR"
                value={revSharePct}
                onChange={setRevSharePct}
                min={0}
                max={5}
                step={0.5}
                format={(v) => `${v}%`}
                sublabel="Kicks in from month 1 (on whatever revenue exists)"
              />
            </div>

            {/* Equity */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-green-400 mb-4 uppercase tracking-wider">Equity</h3>
              <Slider
                label="Your equity stake"
                value={equityPct}
                onChange={setEquityPct}
                min={10}
                max={50}
                step={1}
                format={(v) => `${v}%`}
                sublabel="Amedeo + Marco C split the rest (minus ESOP)"
              />
              <div className="mt-2 p-3 bg-gray-800 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>You</span>
                  <span className="text-green-400 font-bold">{equityPct}%</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>ESOP (reserved)</span>
                  <span className="text-white">12%</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Amedeo + Marco C</span>
                  <span className="text-white">{88 - equityPct}% (split TBD)</span>
                </div>
              </div>
            </div>

            {/* Exit timing */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-amber-400 mb-4 uppercase tracking-wider">Exit Timing</h3>
              <div className="space-y-2">
                {EXIT_OPTIONS.map((opt) => (
                  <button
                    key={opt.month}
                    onClick={() => setExitMonth(opt.month)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      exitMonth === opt.month
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                        : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scenario cards */}
            <div className="grid grid-cols-3 gap-3">
              {SCENARIOS.map((sc) => (
                <div key={sc.key} onClick={() => setSelectedScenario(sc.key)} className="cursor-pointer">
                  <ScenarioCard
                    title={sc.label}
                    color={sc.color}
                    total={results[sc.key].grandTotal}
                    salary={results[sc.key].totalSalaryNet}
                    revShare={results[sc.key].totalRevShareNet}
                    exit={results[sc.key].exitPayout}
                    opacity={selectedScenario === sc.key ? 1 : 0.5}
                  />
                </div>
              ))}
            </div>

            {/* Opportunity cost banner */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Opportunity cost (staying at FELFEL {endMonth} months)</div>
                  <div className="text-lg font-bold text-gray-400">{formatCHF(opportunityCostNet)} net</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{selectedScenario} scenario vs FELFEL</div>
                  <div className={`text-lg font-bold ${results[selectedScenario].grandTotal > opportunityCostNet ? "text-green-400" : "text-red-400"}`}>
                    {results[selectedScenario].grandTotal > opportunityCostNet ? "+" : ""}{formatCHF(results[selectedScenario].grandTotal - opportunityCostNet)}
                  </div>
                </div>
              </div>
            </div>

            {/* Cumulative earnings chart */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Cumulative Earnings Over Time — {SCENARIOS.find(s => s.key === selectedScenario).label}</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={activeResult.timeline}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickFormatter={(v) => `M${v}`}
                    interval={11}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickFormatter={(v) => formatCHFShort(v)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                    labelFormatter={(v) => `Month ${v}`}
                    formatter={(v, name) => [formatCHF(v), name]}
                  />
                  <Legend />
                  {exitMonth > 0 && (
                    <ReferenceLine x={exitMonth} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "EXIT", fill: "#f59e0b", fontSize: 11 }} />
                  )}
                  <Line type="monotone" dataKey="salary" name="Salary (net)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="revShare" name="Rev Share (net)" stroke="#a855f7" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="total" name="Total (incl exit)" stroke="#22c55e" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="opportunityCost" name="FELFEL alternative" stroke="#6b7280" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison bar chart */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Total Earnings by Scenario (Stacked)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparisonData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => formatCHFShort(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} width={50} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                    formatter={(v, name) => [formatCHF(v), name]}
                  />
                  <Legend />
                  <Bar dataKey="salary" name="Salary" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="revShare" name="Rev Share" stackId="a" fill="#a855f7" />
                  <Bar dataKey="exit" name="Exit" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Key insights */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Key Numbers</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500">Exit valuation ({selectedScenario})</div>
                  <div className="text-lg font-bold text-white">{formatCHF(activeResult.exitValuation)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Your exit payout</div>
                  <div className="text-lg font-bold text-green-400">{formatCHF(activeResult.exitPayout)}</div>
                  <div className="text-xs text-green-600">0% tax (Swiss CGT)</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Hotels at exit</div>
                  <div className="text-lg font-bold text-white">{exitMonth > 0 ? activeResult.hotels[exitMonth] : "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Monthly MRR at exit</div>
                  <div className="text-lg font-bold text-white">
                    {exitMonth > 0 ? formatCHF(activeResult.hotels[exitMonth] * getACV(exitMonth) * 0.91) : "N/A"}/mo
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                <p className="mb-1"><strong className="text-gray-400">Tax assumptions:</strong> Salary taxed at Zurich progressive rates (10.6%-32% effective incl. social). Revenue share taxed as bonus income (~25%). Exit payout = 0% tax (Swiss private capital gains exemption).</p>
                <p><strong className="text-gray-400">Currency:</strong> All values in CHF. EUR→CHF at 0.91. Exit multiples: downside 4.0x, base 5.0x, upside 5.15x ARR (adjusted for timing).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
