'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/financial/ui/card';
import { Badge } from '@/components/financial/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtChf, fmtEur, fmtPct } from '@/lib/format';
import mcData from '@/data/montecarlo-results.json';
import { CHART_THEME } from '@/lib/chart-theme';

type MCResults = Record<string, any>;
const results = mcData as MCResults;
const scenarioNames: Record<string, string> = {
  bootstrapped: 'Bootstrapped',
  series_a: 'Series A',
  series_ab: 'Series A + B',
  full_vc: 'Full VC (A+B+C)',
};
const milestones = ['M12', 'M24', 'M36', 'M48', 'M60'];

function FanChart({ scenarioId, metric, label, formatter }: { scenarioId: string; metric: 'arr' | 'cash' | 'valuation'; label: string; formatter: (v: number) => string }) {
  const r = results[scenarioId];
  if (!r) return null;

  const data = milestones.map(m => {
    const p = r.percentiles[metric]?.[m];
    if (!p) return { month: m, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
    return { month: m, ...p };
  }).filter(d => d.p50 > 0);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
        <XAxis dataKey="month" tick={{ fill: CHART_THEME.tick, fontSize: 11 }} />
        <YAxis tick={{ fill: CHART_THEME.tick, fontSize: 11 }} tickFormatter={v => formatter(v)} />
        <Tooltip
          contentStyle={{ background: CHART_THEME.tooltip.bg, border: `1px solid ${CHART_THEME.tooltip.border}`, borderRadius: 8, color: CHART_THEME.tooltip.text }} labelStyle={{ color: CHART_THEME.tooltip.text }} itemStyle={{ color: CHART_THEME.tooltip.text }}
          formatter={(v: any, name: any) => [formatter(Number(v)), String(name)]}
        />
        <Area type="monotone" dataKey="p90" stroke="none" fill={CHART_THEME.terracotta} fillOpacity={0.1} name="P90" />
        <Area type="monotone" dataKey="p75" stroke="none" fill={CHART_THEME.terracotta} fillOpacity={0.15} name="P75" />
        <Area type="monotone" dataKey="p50" stroke={CHART_THEME.terracotta} strokeWidth={2} fill={CHART_THEME.terracotta} fillOpacity={0.2} name="P50" />
        <Area type="monotone" dataKey="p25" stroke="none" fill={CHART_THEME.inkWash} fillOpacity={0.9} name="P25" />
        <Area type="monotone" dataKey="p10" stroke="none" fill={CHART_THEME.inkWash} fillOpacity={0.65} name="P10" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function MonteCarloPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-cream)]">Monte Carlo Simulation Results</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">10,000 runs per scenario &middot; 60-month horizon &middot; Triangular distributions</p>

      {/* Probability tables */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Key Probabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Metric</th>
                {Object.entries(scenarioNames).map(([id, name]) => (
                  <th key={id} className="text-right py-2 text-[var(--color-cream)]">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 text-[var(--color-muted-foreground)]">Cash runout risk</td>
                {Object.keys(scenarioNames).map(id => (
                  <td key={id} className="py-2 text-right">
                    <Badge className={results[id]?.probabilities.cashRunout < 0.05 ? 'bg-green-600 text-white' : results[id]?.probabilities.cashRunout < 0.15 ? 'bg-yellow-600 text-white' : 'bg-red-600 text-white'}>
                      {fmtPct(results[id]?.probabilities.cashRunout ?? 0)}
                    </Badge>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 text-[var(--color-muted-foreground)]">Vesting M12 (15+ paying)</td>
                {Object.keys(scenarioNames).map(id => (
                  <td key={id} className="py-2 text-right text-emerald-600">{fmtPct(results[id]?.probabilities.vestingM12 ?? 0)}</td>
                ))}
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 text-[var(--color-muted-foreground)]">Vesting M24 (ARR &ge; &euro;500K)</td>
                {Object.keys(scenarioNames).map(id => (
                  <td key={id} className="py-2 text-right text-emerald-600">{fmtPct(results[id]?.probabilities.vestingM24 ?? 0)}</td>
                ))}
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-2 text-[var(--color-muted-foreground)]">Vesting M36 (ARR &ge; &euro;1.5M)</td>
                {Object.keys(scenarioNames).map(id => (
                  <td key={id} className="py-2 text-right text-emerald-600">{fmtPct(results[id]?.probabilities.vestingM36 ?? 0)}</td>
                ))}
              </tr>
              {['M12', 'M24', 'M36'].map(m => (
                <tr key={m} className="border-b border-[var(--border)]">
                  <td className="py-2 text-[var(--color-muted-foreground)]">Default alive {m}</td>
                  {Object.keys(scenarioNames).map(id => (
                    <td key={id} className="py-2 text-right">{fmtPct(results[id]?.probabilities.defaultAlive?.[m] ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* P10/P50/P90 ARR table */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">ARR Percentiles (EUR) — All Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Scenario</th>
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Pctl</th>
                {milestones.map(m => (
                  <th key={m} className="text-right py-2 text-[var(--color-muted-foreground)]">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(scenarioNames).map(([id, name]) => (
                ['p10', 'p50', 'p90'].map((pctl, pi) => (
                  <tr key={`${id}-${pctl}`} className={`border-b border-[var(--border)] ${pi === 0 ? 'border-t-2 border-t-[var(--color-deep-terracotta)]' : ''}`}>
                    {pi === 0 && <td rowSpan={3} className="py-1.5 text-[var(--color-cream)] font-medium">{name}</td>}
                    <td className="py-1.5 text-[var(--color-muted-foreground)] uppercase text-[10px]">{pctl}</td>
                    {milestones.map(m => (
                      <td key={m} className={`py-1.5 text-right tabular-nums ${pctl === 'p50' ? 'text-[var(--color-terracotta)] font-medium' : 'text-[var(--color-muted-foreground)]'}`}>
                        {fmtEur(results[id]?.percentiles.arr?.[m]?.[pctl] ?? 0)}
                      </td>
                    ))}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Fan charts — one per scenario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(scenarioNames).map(([id, name]) => (
          <Card key={id} className="bg-[var(--card)] border-[var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[var(--color-muted-foreground)]">{name} — ARR Fan (EUR)</CardTitle>
            </CardHeader>
            <CardContent>
              <FanChart scenarioId={id} metric="arr" label="ARR" formatter={v => fmtEur(v)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Valuation percentiles */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Company Valuation at M48/M60 (10x ARR, CHF)</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Scenario</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">M48 P10</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">M48 P50</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">M48 P90</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">M60 P10</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">M60 P50</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">M60 P90</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scenarioNames).map(([id, name]) => (
                <tr key={id} className="border-b border-[var(--border)]">
                  <td className="py-2 text-[var(--color-cream)]">{name}</td>
                  {['M48', 'M60'].map(m =>
                    ['p10', 'p50', 'p90'].map(p => (
                      <td key={`${m}-${p}`} className={`py-2 text-right tabular-nums ${p === 'p50' ? 'text-[var(--color-gold)] font-medium' : 'text-[var(--color-muted-foreground)]'}`}>
                        {fmtChf(results[id]?.percentiles.valuation?.[m]?.[p] ?? 0)}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
