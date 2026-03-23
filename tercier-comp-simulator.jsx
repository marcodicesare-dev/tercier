import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

function generateGrowthCurve(scenario) {
  const hotels = [];
  for (let m = 0; m <= 60; m++) {
    let h;
    if (scenario === "bear") {
      if (m <= 6) h = Math.round((m / 6) * 7);
      else if (m <= 12) h = Math.round(7 + ((m - 6) / 6) * 15);
      else if (m <= 18) h = Math.round(22 + ((m - 12) / 6) * 14);
      else if (m <= 36) h = Math.round(36 + ((m - 18) / 18) * 56);
      else h = Math.round(92 + ((m - 36) / 24) * 86);
    } else if (scenario === "base") {
      if (m <= 6) h = Math.round((m / 6) * 10);
      else if (m <= 12) h = Math.round(10 + ((m - 6) / 6) * 20);
      else if (m <= 18) h = Math.round(30 + ((m - 12) / 6) * 17);
      else if (m <= 36) h = Math.round(47 + ((m - 18) / 18) * 68);
      else h = Math.round(115 + ((m - 36) / 24) * 112);
    } else {
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

function getACV(month) {
  if (month <= 6) return 1500;
  if (month <= 12) return 2200;
  if (month <= 24) return 2600;
  if (month <= 36) return 2900;
  return 3400;
}

function getExitMultiple(scenario, month) {
  const baseMultiple = scenario === "bear" ? 4.0 : scenario === "base" ? 5.0 : 5.15;
  if (month <= 24) return baseMultiple * 0.5;
  if (month <= 36) return baseMultiple * 0.7;
  if (month <= 48) return baseMultiple * 0.85;
  return baseMultiple;
}

function salaryTaxRate(annualGross) {
  if (annualGross <= 22680) return 0.106;
  if (annualGross <= 36000) return 0.14;
  if (annualGross <= 48000) return 0.17;
  if (annualGross <= 72000) return 0.2;
  if (annualGross <= 120000) return 0.24;
  if (annualGross <= 180000) return 0.28;
  return 0.32;
}

const SCENARIOS = [
  { key: "bear", label: "Downside (operator)", color: "#ef4444" },
  { key: "base", label: "Base (operator P50)", color: "#3b82f6" },
  { key: "bull", label: "Upside (follow-on angel P50)", color: "#22c55e" },
];

const EXIT_OPTIONS = [
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
      {sublabel ? <div className="text-xs text-gray-500 mb-1">{sublabel}</div> : null}
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

function ScenarioCard({ title, color, total, exitValuation, hotelsAtExit, opacity }) {
  return (
    <div className="rounded-lg p-4 border" style={{ borderColor: color, backgroundColor: `${color}11`, opacity }}>
      <div className="text-sm font-medium mb-2" style={{ color }}>{title}</div>
      <div className="text-2xl font-bold text-white mb-3">{formatCHF(total)}</div>
      <div className="space-y-1 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>5-year net salary</span>
          <span className="text-gray-300">{formatCHF(total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Company exit value</span>
          <span className="text-gray-300">{formatCHF(exitValuation)}</span>
        </div>
        <div className="flex justify-between">
          <span>Hotels at exit</span>
          <span className="font-bold" style={{ color }}>{hotelsAtExit}</span>
        </div>
      </div>
    </div>
  );
}

export default function CompSimulator() {
  const [startSalary, setStartSalary] = useState(4000);
  const [salaryGrowthHotels, setSalaryGrowthHotels] = useState(10);
  const [grownSalary, setGrownSalary] = useState(8000);
  const [secondGrowthHotels, setSecondGrowthHotels] = useState(50);
  const [secondGrownSalary, setSecondGrownSalary] = useState(15000);
  const [selectedScenario, setSelectedScenario] = useState("base");
  const [exitMonth, setExitMonth] = useState(60);

  const currentSalary = 120000;

  const results = useMemo(() => {
    const allResults = {};

    for (const sc of SCENARIOS) {
      const hotels = generateGrowthCurve(sc.key);
      const timeline = [];
      let cumSalaryNet = 0;
      let cumOpportunityCost = 0;
      let currentMonthlySalary = startSalary;

      for (let m = 0; m <= 60; m++) {
        const h = hotels[m];
        const monthlyMRRCHF = h * getACV(m) * 0.91;

        let monthlySalary = startSalary;
        if (h >= secondGrowthHotels) monthlySalary = secondGrownSalary;
        else if (h >= salaryGrowthHotels) monthlySalary = grownSalary;

        currentMonthlySalary = monthlySalary;
        const netSalary = monthlySalary * (1 - salaryTaxRate(monthlySalary * 12));
        cumSalaryNet += netSalary;
        cumOpportunityCost += (currentSalary / 12) * 0.75;

        timeline.push({
          month: m,
          hotels: h,
          monthlySalary,
          salary: Math.round(cumSalaryNet),
          opportunityCost: Math.round(cumOpportunityCost),
          mrr: Math.round(monthlyMRRCHF),
        });
      }

      const hotelsAtExit = hotels[exitMonth];
      const arrAtExit = hotelsAtExit * getACV(exitMonth) * 12 * 0.91;
      const exitValuation = arrAtExit * getExitMultiple(sc.key, exitMonth);

      allResults[sc.key] = {
        timeline,
        totalSalaryNet: Math.round(cumSalaryNet),
        currentMonthlySalary,
        exitValuation: Math.round(exitValuation),
        hotels,
      };
    }

    return allResults;
  }, [startSalary, salaryGrowthHotels, grownSalary, secondGrowthHotels, secondGrownSalary, exitMonth]);

  const activeResult = results[selectedScenario];
  const companySalaryCost = startSalary * 1.08;
  const baseOpex = 4530;
  const seedCapital = 150000;
  const monthlyBurn = companySalaryCost + baseOpex;
  const runwayMonths = Math.floor(seedCapital / monthlyBurn);
  const opportunityCostNet = Math.round((currentSalary / 12) * 0.75 * 60);
  const comparisonData = SCENARIOS.map((sc) => ({
    name: sc.label.split(" ")[0],
    salary: results[sc.key].totalSalaryNet,
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Tercier Salary Path Simulator</h1>
          <p className="text-gray-400 text-sm">
            Stress-test a lean founder salary path across the downside, base, and upside operating scenarios.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-blue-400 mb-4 uppercase tracking-wider">Salary Plan</h3>
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

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {SCENARIOS.map((sc) => (
                <div key={sc.key} onClick={() => setSelectedScenario(sc.key)} className="cursor-pointer">
                  <ScenarioCard
                    title={sc.label}
                    color={sc.color}
                    total={results[sc.key].totalSalaryNet}
                    exitValuation={results[sc.key].exitValuation}
                    hotelsAtExit={results[sc.key].hotels[exitMonth]}
                    opacity={selectedScenario === sc.key ? 1 : 0.5}
                  />
                </div>
              ))}
            </div>

            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Opportunity cost (staying at FELFEL for 60 months)</div>
                  <div className="text-lg font-bold text-gray-400">{formatCHF(opportunityCostNet)} net</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{selectedScenario} scenario vs FELFEL</div>
                  <div className={`text-lg font-bold ${results[selectedScenario].totalSalaryNet > opportunityCostNet ? "text-green-400" : "text-red-400"}`}>
                    {results[selectedScenario].totalSalaryNet > opportunityCostNet ? "+" : ""}{formatCHF(results[selectedScenario].totalSalaryNet - opportunityCostNet)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Cumulative Net Salary — {SCENARIOS.find((s) => s.key === selectedScenario).label}</h3>
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
                  <ReferenceLine x={exitMonth} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "EXIT", fill: "#f59e0b", fontSize: 11 }} />
                  <Line type="monotone" dataKey="salary" name="Net salary" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="opportunityCost" name="FELFEL alternative" stroke="#6b7280" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Five-Year Net Salary by Scenario</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparisonData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => formatCHFShort(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} width={50} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                    formatter={(v, name) => [formatCHF(v), name]}
                  />
                  <Legend />
                  <Bar dataKey="salary" name="Net salary" radius={[0, 4, 4, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={SCENARIOS[index].color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Key Numbers</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500">Company exit value</div>
                  <div className="text-lg font-bold text-white">{formatCHF(activeResult.exitValuation)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Hotels at exit</div>
                  <div className="text-lg font-bold text-white">{activeResult.hotels[exitMonth]}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">MRR at exit</div>
                  <div className="text-lg font-bold text-white">{formatCHF(activeResult.timeline[exitMonth].mrr)}/mo</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Monthly salary at scale</div>
                  <div className="text-lg font-bold text-white">{formatCHF(activeResult.currentMonthlySalary)}/mo</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                <p className="mb-1"><strong className="text-gray-400">Tax assumptions:</strong> Salary taxed at Zurich progressive rates (10.6%-32% effective including social contributions).</p>
                <p><strong className="text-gray-400">Currency:</strong> All values in CHF. EUR→CHF at 0.91 for revenue and exit-value references.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
