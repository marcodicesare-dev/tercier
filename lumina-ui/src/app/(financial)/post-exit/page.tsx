'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/financial/ui/card';
import { Badge } from '@/components/financial/ui/badge';
import { Separator } from '@/components/financial/ui/separator';
import { Switch } from '@/components/financial/ui/switch';
import { AssumptionSlider } from '@/components/financial/assumption-slider';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine,
} from 'recharts';
import { runLifeSimulation, getDefaultInputs, type LifeInputs, type TripPlan } from '@/lib/post-exit-sim';
import { fmtChf } from '@/lib/format';
import { Trash2, Plus } from 'lucide-react';
import { CHART_THEME } from '@/lib/chart-theme';

const EXIT_LEVELS = [5_000_000, 10_000_000, 20_000_000, 30_000_000, 40_000_000];
const EXIT_LABELS = ['CHF 5M', 'CHF 10M', 'CHF 20M', 'CHF 30M', 'CHF 40M'];
const COLORS = [CHART_THEME.deepTerracotta, CHART_THEME.terracotta, CHART_THEME.gold, CHART_THEME.positive, CHART_THEME.blue];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2 text-[11px] uppercase tracking-widest text-[var(--color-gold)] font-medium">
        {title}
        <span className="text-[var(--color-muted-foreground)]">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-3 pb-4">{children}</div>}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[var(--color-muted-foreground)]">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export default function PostExitPage() {
  const [activeExit, setActiveExit] = useState(2); // default CHF 20M
  const [inputs, setInputs] = useState<LifeInputs>(() => getDefaultInputs(EXIT_LEVELS[2]));

  const update = useCallback(<K extends keyof LifeInputs>(key: K, value: LifeInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const switchExit = useCallback((idx: number) => {
    setActiveExit(idx);
    setInputs(prev => ({
      ...prev,
      exitProceeds: EXIT_LEVELS[idx],
      angelBudgetYearly: Math.round(EXIT_LEVELS[idx] * 0.02),
      philanthropyYearly: Math.round(EXIT_LEVELS[idx] * 0.005),
    }));
  }, []);

  const projection = useMemo(() => runLifeSimulation(inputs), [inputs]);

  const addTrip = useCallback(() => {
    const newTrip: TripPlan = { id: String(Date.now()), name: 'New trip', weeks: 1, costPerTrip: 5000, perYear: 1 };
    update('trips', [...inputs.trips, newTrip]);
  }, [inputs.trips, update]);

  const removeTrip = useCallback((id: string) => {
    update('trips', inputs.trips.filter(t => t.id !== id));
  }, [inputs.trips, update]);

  const updateTrip = useCallback((id: string, field: keyof TripPlan, value: any) => {
    update('trips', inputs.trips.map(t => t.id === id ? { ...t, [field]: value } : t));
  }, [inputs.trips, update]);

  // Derived
  const travelFromTrips = inputs.trips.reduce((s, t) => s + t.costPerTrip * t.perYear, 0);
  const totalWeeks = inputs.trips.reduce((s, t) => s + t.weeks * t.perYear, 0);
  const yr0 = projection[0];
  const yr5 = projection[4];
  const yr10 = projection[9];
  const yr20 = projection[19];
  const monthlyLiving = inputs.groceries + inputs.healthInsurance + inputs.transport +
    inputs.utilities + inputs.clothing + inputs.personal + inputs.diningOut +
    inputs.subscriptions + inputs.miscMonthly;

  // All-scenario comparison
  const allScenarios = useMemo(() => {
    return EXIT_LEVELS.map((exit, i) => {
      const inp = { ...inputs, exitProceeds: exit, angelBudgetYearly: Math.round(exit * 0.02), philanthropyYearly: Math.round(exit * 0.005) };
      const proj = runLifeSimulation(inp);
      return { exit, label: EXIT_LABELS[i], projection: proj };
    });
  }, [inputs]);

  return (
    <div className="flex gap-6">
      {/* Left: Controls */}
      <div className="w-80 shrink-0 space-y-2 overflow-auto max-h-[calc(100vh-3rem)] pb-20 pr-2">
        <h2 className="text-lg font-bold text-[var(--color-cream)]">Life Simulator</h2>
        <p className="text-[10px] text-[var(--color-muted-foreground)] mb-3">Your actual numbers. Every slider recalculates instantly.</p>

        {/* Exit selector */}
        <div className="grid grid-cols-5 gap-1">
          {EXIT_LEVELS.map((exit, i) => (
            <button key={i} onClick={() => switchExit(i)} className={`py-1.5 rounded text-[10px] font-bold transition-all ${activeExit === i ? 'bg-[var(--color-terracotta)] text-[var(--color-ink)]' : 'bg-[var(--color-ink-light)] text-[var(--color-muted-foreground)] hover:text-[var(--lumina-ink)]'}`}>
              {EXIT_LABELS[i]}
            </button>
          ))}
        </div>

        <Separator className="bg-[var(--border)]" />

        <Section title="Housing">
          <AssumptionSlider label="Mortgage + Nebenkosten (CHF/mo)" value={inputs.mortgageMonthly} onChange={v => update('mortgageMonthly', v)} min={0} max={5000} step={100} prefix="CHF " />
          <AssumptionSlider label="Amortization (CHF/yr)" value={inputs.amortizationYearly} onChange={v => update('amortizationYearly', v)} min={0} max={50000} step={1000} prefix="CHF " />
          <Toggle label="Pay off mortgage at exit" value={inputs.payOffMortgage} onChange={v => update('payOffMortgage', v)} />
          {inputs.payOffMortgage && (
            <AssumptionSlider label="Outstanding balance" value={inputs.mortgageBalance} onChange={v => update('mortgageBalance', v)} min={100000} max={1000000} step={25000} prefix="CHF " />
          )}
        </Section>

        <Section title="Monthly Living (excl. housing & travel)">
          <AssumptionSlider label="Groceries & household" value={inputs.groceries} onChange={v => update('groceries', v)} min={500} max={3000} step={50} prefix="CHF " />
          <AssumptionSlider label="Health insurance (both)" value={inputs.healthInsurance} onChange={v => update('healthInsurance', v)} min={400} max={1500} step={50} prefix="CHF " />
          <AssumptionSlider label="Transport (GA, fuel, parking)" value={inputs.transport} onChange={v => update('transport', v)} min={0} max={800} step={50} prefix="CHF " />
          <AssumptionSlider label="Utilities (phone, internet, streaming)" value={inputs.utilities} onChange={v => update('utilities', v)} min={100} max={500} step={25} prefix="CHF " />
          <AssumptionSlider label="Clothing & shopping" value={inputs.clothing} onChange={v => update('clothing', v)} min={100} max={2000} step={50} prefix="CHF " />
          <AssumptionSlider label="Personal (gym, wellness, haircut)" value={inputs.personal} onChange={v => update('personal', v)} min={100} max={2000} step={50} prefix="CHF " />
          <AssumptionSlider label="Dining out & bars" value={inputs.diningOut} onChange={v => update('diningOut', v)} min={500} max={5000} step={100} prefix="CHF " />
          <AssumptionSlider label="Subscriptions & misc" value={inputs.subscriptions} onChange={v => update('subscriptions', v)} min={50} max={500} step={25} prefix="CHF " />
          <AssumptionSlider label="Buffer / unexpected" value={inputs.miscMonthly} onChange={v => update('miscMonthly', v)} min={0} max={2000} step={100} prefix="CHF " />
          <div className="text-[11px] text-[var(--color-terracotta)] font-mono pt-1">Total: CHF {monthlyLiving.toLocaleString('en-CH')}/mo = CHF {(monthlyLiving * 12).toLocaleString('en-CH')}/yr</div>
        </Section>

        <Section title="Car">
          <div className="text-[10px] text-[var(--color-muted-foreground)] mb-1">Current: Audi RSQ3 leasing CHF {inputs.currentCarPayment}/mo</div>
          <AssumptionSlider label="Current car payment (CHF/mo)" value={inputs.currentCarPayment} onChange={v => update('currentCarPayment', v)} min={0} max={3000} step={50} prefix="CHF " />
          <Toggle label="Upgrade car at exit" value={inputs.upgradeCar} onChange={v => update('upgradeCar', v)} />
          {inputs.upgradeCar && (
            <>
              <AssumptionSlider label="New car purchase price" value={inputs.upgradeCarCost} onChange={v => update('upgradeCarCost', v)} min={40000} max={400000} step={5000} prefix="CHF " />
              <AssumptionSlider label="Insurance + maintenance (CHF/mo)" value={inputs.newCarMonthly} onChange={v => update('newCarMonthly', v)} min={200} max={1500} step={50} prefix="CHF " />
            </>
          )}
        </Section>

        <Section title="Travel">
          <div className="text-[10px] text-[var(--color-muted-foreground)] mb-2">{totalWeeks.toFixed(1)} weeks/yr across {inputs.trips.length} trip types</div>
          {inputs.trips.map(trip => (
            <div key={trip.id} className="bg-[var(--color-ink-light)] rounded p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <input value={trip.name} onChange={e => updateTrip(trip.id, 'name', e.target.value)} className="text-[11px] font-medium bg-transparent text-[var(--color-cream)] border-none outline-none flex-1" />
                <button onClick={() => removeTrip(trip.id)} className="text-[var(--color-muted-foreground)] hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <span className="text-[8px] text-[var(--color-muted-foreground)] block">Weeks</span>
                  <input type="number" value={trip.weeks} onChange={e => updateTrip(trip.id, 'weeks', Number(e.target.value))} step={0.5} className="h-5 w-full rounded border border-[var(--border)] bg-white text-center text-[10px] text-[var(--lumina-ink)]" />
                </div>
                <div>
                  <span className="text-[8px] text-[var(--color-muted-foreground)] block">CHF/trip</span>
                  <input type="number" value={trip.costPerTrip} onChange={e => updateTrip(trip.id, 'costPerTrip', Number(e.target.value))} step={500} className="h-5 w-full rounded border border-[var(--border)] bg-white text-center text-[10px] text-[var(--lumina-ink)]" />
                </div>
                <div>
                  <span className="text-[8px] text-[var(--color-muted-foreground)] block">×/yr</span>
                  <input type="number" value={trip.perYear} onChange={e => updateTrip(trip.id, 'perYear', Number(e.target.value))} className="h-5 w-full rounded border border-[var(--border)] bg-white text-center text-[10px] text-[var(--lumina-ink)]" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addTrip} className="w-full py-1.5 text-[10px] text-[var(--color-terracotta)] border border-dashed border-[var(--color-deep-terracotta)] rounded hover:bg-[var(--color-ink-light)] flex items-center justify-center gap-1">
            <Plus className="h-3 w-3" /> Add trip
          </button>
          <div className="text-[11px] text-[var(--color-terracotta)] font-mono pt-1">Total from trips: CHF {travelFromTrips.toLocaleString('en-CH')}/yr</div>
          <AssumptionSlider label="Override annual travel budget" value={inputs.travelBudget} onChange={v => update('travelBudget', v)} min={20000} max={300000} step={5000} prefix="CHF " />
        </Section>

        <Section title="Sardinia Property">
          <Toggle label="Buy vacation property" value={inputs.buyVacationProperty} onChange={v => update('buyVacationProperty', v)} />
          {inputs.buyVacationProperty && (
            <>
              <AssumptionSlider label="Purchase price (CHF)" value={inputs.propertyPrice} onChange={v => update('propertyPrice', v)} min={300000} max={3000000} step={50000} prefix="CHF " />
              <AssumptionSlider label="Mortgage %" value={inputs.propertyMortgagePct} onChange={v => update('propertyMortgagePct', v)} min={0} max={80} step={5} suffix="%" />
              <AssumptionSlider label="Monthly costs (maintenance, tax)" value={inputs.propertyMonthlyCosts} onChange={v => update('propertyMonthlyCosts', v)} min={500} max={5000} step={100} prefix="CHF " />
            </>
          )}
        </Section>

        <Section title="Wife & Income">
          <Toggle label="Wife keeps working" value={inputs.wifeKeepsWorking} onChange={v => update('wifeKeepsWorking', v)} />
          <AssumptionSlider label="Wife gross salary (2030)" value={inputs.wifeGross2030} onChange={v => update('wifeGross2030', v)} min={100000} max={250000} step={5000} prefix="CHF " />
          <AssumptionSlider label="Annual raise" value={inputs.wifeGrowthRate} onChange={v => update('wifeGrowthRate', v)} min={0} max={0.05} step={0.005} format={v => `${(v * 100).toFixed(1)}%`} />
        </Section>

        <Section title="Investment & Wealth">
          <AssumptionSlider label="Annual return" value={inputs.investmentReturn} onChange={v => update('investmentReturn', v)} min={0.01} max={0.10} step={0.005} format={v => `${(v * 100).toFixed(1)}%`} />
          <AssumptionSlider label="Inflation" value={inputs.inflation} onChange={v => update('inflation', v)} min={0} max={0.05} step={0.005} format={v => `${(v * 100).toFixed(1)}%`} />
          <AssumptionSlider label="Angel investing (CHF/yr)" value={inputs.angelBudgetYearly} onChange={v => update('angelBudgetYearly', v)} min={0} max={500000} step={10000} prefix="CHF " />
          <AssumptionSlider label="Angel investing years" value={inputs.angelYears} onChange={v => update('angelYears', v)} min={0} max={10} suffix=" yrs" />
          <AssumptionSlider label="Philanthropy (CHF/yr)" value={inputs.philanthropyYearly} onChange={v => update('philanthropyYearly', v)} min={0} max={200000} step={5000} prefix="CHF " />
        </Section>
      </div>

      {/* Right: Results */}
      <div className="flex-1 space-y-5 overflow-auto max-h-[calc(100vh-3rem)] pb-20">
        <h1 className="text-2xl font-bold text-[var(--color-cream)]">Post-Exit Life — {EXIT_LABELS[activeExit]}</h1>

        {/* Year 1 snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Total Net Worth</p>
            <p className="text-xl font-bold text-[var(--color-gold)]">{fmtChf(yr0.totalNetWorth)}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Annual Income</p>
            <p className="text-xl font-bold text-emerald-600">{fmtChf(yr0.totalIncome)}/yr</p>
            <p className="text-[9px] text-[var(--color-muted-foreground)]">Passive {fmtChf(yr0.passiveIncome)} + Wife {fmtChf(yr0.wifeIncome)}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Annual Expenses</p>
            <p className="text-xl font-bold text-red-600">{fmtChf(yr0.totalExpenses)}/yr</p>
            <p className="text-[9px] text-[var(--color-muted-foreground)]">{fmtChf(Math.round(yr0.totalExpenses / 12))}/mo</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3">
            <p className="text-[10px] text-[var(--color-muted-foreground)] uppercase">Net Cashflow</p>
            <p className={`text-xl font-bold ${yr0.netCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtChf(yr0.netCashflow)}/yr</p>
            <p className="text-[9px] text-[var(--color-muted-foreground)]">{yr0.passiveIncomeCoversExpenses ? 'Passive income covers everything' : 'Needs wife income or drawdown'}</p>
          </div>
        </div>

        {/* Expense breakdown */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Year 1 Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Housing', value: yr0.housing, fill: CHART_THEME.terracotta },
                { name: 'Living', value: yr0.living, fill: CHART_THEME.gold },
                { name: 'Car', value: yr0.car, fill: CHART_THEME.deepTerracotta },
                { name: 'Travel', value: yr0.travel, fill: CHART_THEME.positive },
                ...(yr0.property > 0 ? [{ name: 'Sardinia', value: yr0.property, fill: CHART_THEME.blue }] : []),
                ...(yr0.angel > 0 ? [{ name: 'Angel', value: yr0.angel, fill: CHART_THEME.tick }] : []),
                { name: 'Tax', value: yr0.wealthTax, fill: CHART_THEME.negative },
              ]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis type="number" tick={{ fill: CHART_THEME.tick, fontSize: 11 }} tickFormatter={v => fmtChf(v)} />
                <YAxis type="category" dataKey="name" tick={{ fill: CHART_THEME.tooltip.text, fontSize: 11 }} width={70} />
                <Tooltip contentStyle={{ background: CHART_THEME.tooltip.bg, border: `1px solid ${CHART_THEME.tooltip.border}`, borderRadius: 8, color: CHART_THEME.tooltip.text }} labelStyle={{ color: CHART_THEME.tooltip.text }} itemStyle={{ color: CHART_THEME.tooltip.text }} formatter={(v: any) => fmtChf(Number(v))} />
                <Bar dataKey="value">
                  {[yr0.housing, yr0.living, yr0.car, yr0.travel, yr0.property, yr0.angel, yr0.wealthTax].map((_, i) => (
                    <Cell key={i} fill={[CHART_THEME.terracotta, CHART_THEME.gold, CHART_THEME.deepTerracotta, CHART_THEME.positive, CHART_THEME.blue, CHART_THEME.tick, CHART_THEME.negative][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Net worth projection */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Net Worth Over 20 Years</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={projection.map(p => ({ year: p.year, age: p.age, netWorth: p.totalNetWorth, invested: p.investedAssets, realEstate: p.realEstateEquity }))}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_THEME.gold} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_THEME.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="year" tick={{ fill: CHART_THEME.tick, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_THEME.tick, fontSize: 11 }} tickFormatter={v => fmtChf(v)} />
                <Tooltip contentStyle={{ background: CHART_THEME.tooltip.bg, border: `1px solid ${CHART_THEME.tooltip.border}`, borderRadius: 8, color: CHART_THEME.tooltip.text }} labelStyle={{ color: CHART_THEME.tooltip.text }} itemStyle={{ color: CHART_THEME.tooltip.text }} formatter={(v: any) => fmtChf(Number(v))} />
                <ReferenceLine y={0} stroke={CHART_THEME.negative} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="netWorth" stroke={CHART_THEME.gold} strokeWidth={2} fill="url(#nwGrad)" name="Total Net Worth" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-3 mt-3 text-center">
              {[{ label: 'Year 1', d: yr0 }, { label: 'Year 5', d: yr5 }, { label: 'Year 10', d: yr10 }, { label: 'Year 20', d: yr20 }].map(({ label, d }) => (
                <div key={label}>
                  <p className="text-[9px] text-[var(--color-muted-foreground)]">{label} (age {d?.age})</p>
                  <p className="text-sm font-bold text-[var(--color-gold)]">{fmtChf(d?.totalNetWorth ?? 0)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All scenarios comparison */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">All 5 Scenarios — Net Worth Over 20 Years</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Array.from({ length: 20 }, (_, i) => {
                const point: any = { year: 2030 + i };
                allScenarios.forEach((s, si) => { point[s.label] = s.projection[i]?.totalNetWorth ?? 0; });
                return point;
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="year" tick={{ fill: CHART_THEME.tick, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_THEME.tick, fontSize: 11 }} tickFormatter={v => fmtChf(v)} />
                <Tooltip contentStyle={{ background: CHART_THEME.tooltip.bg, border: `1px solid ${CHART_THEME.tooltip.border}`, borderRadius: 8, color: CHART_THEME.tooltip.text }} labelStyle={{ color: CHART_THEME.tooltip.text }} itemStyle={{ color: CHART_THEME.tooltip.text }} formatter={(v: any) => fmtChf(Number(v))} />
                <Legend />
                {allScenarios.map((s, i) => (
                  <Line key={i} type="monotone" dataKey={s.label} stroke={COLORS[i]} strokeWidth={i === activeExit ? 3 : 1.5} dot={false} opacity={i === activeExit ? 1 : 0.5} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income vs Expenses over time */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Income vs Expenses Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={projection.map(p => ({ year: p.year, income: p.totalIncome, expenses: p.totalExpenses }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="year" tick={{ fill: CHART_THEME.tick, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_THEME.tick, fontSize: 11 }} tickFormatter={v => fmtChf(v)} />
                <Tooltip contentStyle={{ background: CHART_THEME.tooltip.bg, border: `1px solid ${CHART_THEME.tooltip.border}`, borderRadius: 8, color: CHART_THEME.tooltip.text }} labelStyle={{ color: CHART_THEME.tooltip.text }} itemStyle={{ color: CHART_THEME.tooltip.text }} formatter={(v: any) => fmtChf(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke={CHART_THEME.positive} strokeWidth={2} dot={false} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke={CHART_THEME.negative} strokeWidth={2} dot={false} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed year-by-year table */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Year-by-Year Projection</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Year', 'Age', 'Income', 'Expenses', 'Net', 'Net Worth', 'Passive covers?'].map(h => (
                    <th key={h} className="py-1.5 px-2 text-right text-[var(--color-muted-foreground)] first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projection.map(p => (
                  <tr key={p.year} className="border-b border-[var(--border)] hover:bg-[var(--color-ink-light)]">
                    <td className="py-1 px-2 text-[var(--color-cream)]">{p.year}</td>
                    <td className="py-1 px-2 text-right">{p.age}</td>
                    <td className="py-1 px-2 text-right text-emerald-600 tabular-nums">{fmtChf(p.totalIncome)}</td>
                    <td className="py-1 px-2 text-right text-red-600 tabular-nums">{fmtChf(p.totalExpenses)}</td>
                    <td className={`py-1 px-2 text-right font-medium tabular-nums ${p.netCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtChf(p.netCashflow)}</td>
                    <td className="py-1 px-2 text-right text-[var(--color-gold)] font-medium tabular-nums">{fmtChf(p.totalNetWorth)}</td>
                    <td className="py-1 px-2 text-right">
                      <Badge className={`text-[8px] ${p.passiveIncomeCoversExpenses ? 'bg-emerald-600/10 text-emerald-700' : 'bg-red-600/10 text-red-700'}`}>
                        {p.passiveIncomeCoversExpenses ? 'YES' : 'NO'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Monthly cost summary */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Monthly Cost of Living (Year 1)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                ['Housing (mortgage + amort.)', Math.round(yr0.housing / 12)],
                ['Groceries', inputs.groceries],
                ['Health insurance', inputs.healthInsurance],
                ['Transport', inputs.transport],
                ['Utilities', inputs.utilities],
                ['Clothing', inputs.clothing],
                ['Personal & wellness', inputs.personal],
                ['Dining out', inputs.diningOut],
                ['Subscriptions', inputs.subscriptions],
                ['Car', Math.round(yr0.car / 12)],
                ['Travel (amortized)', Math.round(yr0.travel / 12)],
                ['Misc buffer', inputs.miscMonthly],
                ...(yr0.property > 0 ? [['Sardinia property', Math.round(yr0.property / 12)]] : []),
                ...(yr0.angel > 0 ? [['Angel investing', Math.round(yr0.angel / 12)]] : []),
                ['Wealth tax', Math.round(yr0.wealthTax / 12)],
              ].map(([label, val], i) => (
                <div key={i} className="flex justify-between text-[11px] py-0.5">
                  <span className="text-[var(--color-muted-foreground)]">{label}</span>
                  <span className="text-[var(--color-cream)] font-mono tabular-nums">CHF {Number(val).toLocaleString('en-CH')}</span>
                </div>
              ))}
              <div className="col-span-2 flex justify-between text-sm font-bold pt-2 border-t border-[var(--color-terracotta)]">
                <span className="text-[var(--color-cream)]">TOTAL MONTHLY</span>
                <span className="text-[var(--color-terracotta)] font-mono">{fmtChf(Math.round(yr0.totalExpenses / 12))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
