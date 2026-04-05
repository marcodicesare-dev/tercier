'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/financial/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/financial/ui/tabs';
import { Badge } from '@/components/financial/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';
import { runModel } from '@/lib/model';
import { DEFAULT_ASSUMPTIONS } from '@/lib/defaults';
import { SCENARIOS } from '@/lib/scenarios';
import { chfToEur } from '@/lib/fx';
import { fmtChf, fmtEur, fmtPct } from '@/lib/format';
import type { Assumptions } from '@/lib/financial-types';

const COLORS = ['#C17F59', '#C9A96E', '#8B4A2B', '#5B7FB5'];

function buildScenarioModel(scenarioId: string) {
  const scenario = SCENARIOS.find(s => s.id === scenarioId)!;

  // Merge additional chains from VC scenario into the base chain schedule
  const allChains = [...DEFAULT_ASSUMPTIONS.chains, ...scenario.additionalChains];

  // Apply ARPU multiplier (better product from more eng investment)
  const arpuMult = scenario.arpuMultiplier;

  const a: Assumptions = {
    ...DEFAULT_ASSUMPTIONS,
    months: 60,
    chains: allChains,
    indieBaseRate: Math.round(DEFAULT_ASSUMPTIONS.indieBaseRate * scenario.growthModifier),
    chainArpu: {
      1: Math.round(DEFAULT_ASSUMPTIONS.chainArpu[1] * arpuMult),
      2: Math.round(DEFAULT_ASSUMPTIONS.chainArpu[2] * arpuMult),
      3: Math.round(DEFAULT_ASSUMPTIONS.chainArpu[3] * arpuMult),
    },
    indieArpu: {
      1: Math.round(DEFAULT_ASSUMPTIONS.indieArpu[1] * arpuMult),
      2: Math.round(DEFAULT_ASSUMPTIONS.indieArpu[2] * arpuMult),
      3: Math.round(DEFAULT_ASSUMPTIONS.indieArpu[3] * arpuMult),
    },
    team: DEFAULT_ASSUMPTIONS.team.map(t => ({
      ...t,
      startMonth: Math.max(1, t.startMonth - scenario.teamAccelerator),
    })),
  };
  const result = runModel(a);

  // Add funding to cash
  const monthly = result.monthly.map(d => {
    let cash = d.closing;
    for (const fr of scenario.fundingRounds) {
      if (d.month === fr.timingMonth) cash += fr.amountChf;
      // Carry forward funding from previous months
    }
    return { ...d, closingWithFunding: cash };
  });

  // Cumulative funding
  let cumFunding = 0;
  for (let i = 0; i < monthly.length; i++) {
    for (const fr of scenario.fundingRounds) {
      if (monthly[i].month === fr.timingMonth) cumFunding += fr.amountChf;
    }
    monthly[i].closingWithFunding = monthly[i].closing + cumFunding;
  }

  return { ...result, monthly, scenario };
}

export default function ScenariosPage() {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['bootstrapped', 'series_a']);

  const models = useMemo(() => {
    return SCENARIOS.map(s => ({
      id: s.id,
      name: s.name,
      ...buildScenarioModel(s.id),
    }));
  }, []);

  const selected = models.filter(m => selectedScenarios.includes(m.id));

  // Build comparison chart data
  const milestones = [12, 24, 36, 48, 60];
  const arrChartData = Array.from({ length: 60 }, (_, i) => {
    const m = i + 1;
    const point: any = { month: `M${m}` };
    for (const s of models) {
      if (s.monthly[i]) {
        point[s.id] = Math.round(s.monthly[i].arrEur);
      }
    }
    return point;
  });

  const cashChartData = Array.from({ length: 60 }, (_, i) => {
    const m = i + 1;
    const point: any = { month: `M${m}` };
    for (const s of models) {
      if (s.monthly[i]) {
        point[s.id] = Math.round((s.monthly[i] as any).closingWithFunding);
      }
    }
    return point;
  });

  // Dilution waterfall — CORRECT equity structure
  // Marco starts at 0%, vests to 20% at M36. A/C/M split stays fixed through dilution.
  // Anti-dilution floors: 10% through Series A, 8% from Series B.
  const dilutionData = SCENARIOS.map(s => {
    let marcoVested = 0.20; // assume fully vested at M36
    for (const fr of s.fundingRounds) {
      marcoVested *= (1 - fr.dilution);
    }
    // Apply anti-dilution floors
    const hasSeriesB = s.fundingRounds.length >= 2;
    const floor = hasSeriesB ? 0.08 : s.fundingRounds.length >= 1 ? 0.10 : 1;
    marcoVested = Math.max(marcoVested, floor);
    return { name: s.name, ownership: marcoVested * 100, id: s.id };
  });

  const toggle = (id: string) => {
    setSelectedScenarios(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-cream)]">Scenario Comparison</h1>

      <div className="flex gap-2">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors border ${
              selectedScenarios.includes(s.id)
                ? 'border-[var(--color-terracotta)] text-[var(--color-cream)] bg-[var(--card)]'
                : 'border-[var(--border)] text-[var(--color-muted-foreground)] hover:bg-[var(--card)]'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[i] }} />
            {s.name}
          </button>
        ))}
      </div>

      {/* Key metrics comparison */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Key Metrics at Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Metric</th>
                {selected.map(s => (
                  <th key={s.id} className="text-right py-2 text-[var(--color-cream)]">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {milestones.map(mm => (
                <React.Fragment key={mm}>
                  <tr className="bg-[var(--color-ink-light)]">
                    <td colSpan={selected.length + 1} className="py-1 px-2 text-xs text-[var(--color-gold)] uppercase">Month {mm}</td>
                  </tr>
                  <tr key={`arr-${mm}`} className="border-b border-[var(--border)]">
                    <td className="py-1.5 text-[var(--color-muted-foreground)]">ARR (EUR)</td>
                    {selected.map(s => (
                      <td key={s.id} className="py-1.5 text-right tabular-nums text-[var(--color-terracotta)]">
                        {s.monthly[mm - 1] ? fmtEur(s.monthly[mm - 1].arrEur) : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr key={`cash-${mm}`} className="border-b border-[var(--border)]">
                    <td className="py-1.5 text-[var(--color-muted-foreground)]">Cash (CHF)</td>
                    {selected.map(s => (
                      <td key={s.id} className="py-1.5 text-right tabular-nums text-[var(--color-gold)]">
                        {s.monthly[mm - 1] ? fmtChf((s.monthly[mm - 1] as any).closingWithFunding) : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr key={`hotels-${mm}`} className="border-b border-[var(--border)]">
                    <td className="py-1.5 text-[var(--color-muted-foreground)]">Paying Hotels</td>
                    {selected.map(s => (
                      <td key={s.id} className="py-1.5 text-right tabular-nums">
                        {s.monthly[mm - 1]?.totalPaying ?? '-'}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ARR overlay chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">ARR Trajectories (EUR)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={arrChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3A3028" />
                <XAxis dataKey="month" tick={{ fill: '#A89A8C', fontSize: 11 }} interval={11} />
                <YAxis tick={{ fill: '#A89A8C', fontSize: 11 }} tickFormatter={v => `€${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={{ background: '#2A2018', border: '1px solid #4A3A30', borderRadius: 8, color: '#F5EFE6' }} labelStyle={{ color: '#F5EFE6' }} itemStyle={{ color: '#F5EFE6' }} />
                <Legend />
                {models.filter(m => selectedScenarios.includes(m.id)).map((m, i) => (
                  <Line key={m.id} type="monotone" dataKey={m.id} name={m.name} stroke={COLORS[SCENARIOS.findIndex(s => s.id === m.id)]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Cash Balance (CHF, with funding)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3A3028" />
                <XAxis dataKey="month" tick={{ fill: '#A89A8C', fontSize: 11 }} interval={11} />
                <YAxis tick={{ fill: '#A89A8C', fontSize: 11 }} tickFormatter={v => `CHF ${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={{ background: '#2A2018', border: '1px solid #4A3A30', borderRadius: 8, color: '#F5EFE6' }} labelStyle={{ color: '#F5EFE6' }} itemStyle={{ color: '#F5EFE6' }} />
                <Legend />
                {models.filter(m => selectedScenarios.includes(m.id)).map((m, i) => (
                  <Line key={m.id} type="monotone" dataKey={m.id} name={m.name} stroke={COLORS[SCENARIOS.findIndex(s => s.id === m.id)]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Dilution waterfall */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Marco Ownership After Dilution (with anti-dilution floors)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dilutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3028" />
              <XAxis dataKey="name" tick={{ fill: '#A89A8C', fontSize: 11 }} />
              <YAxis tick={{ fill: '#A89A8C', fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: '#2A2018', border: '1px solid #4A3A30', borderRadius: 8, color: '#F5EFE6' }} labelStyle={{ color: '#F5EFE6' }} itemStyle={{ color: '#F5EFE6' }} formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
              <Bar dataKey="ownership" name="Ownership %">
                {dilutionData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
