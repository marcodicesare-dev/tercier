'use client';

import { useModel } from '@/components/financial/model-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/financial/ui/card';
import { Badge } from '@/components/financial/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line } from 'recharts';
import { getMarcoEquityValue, getVestedEquity } from '@/lib/model';
import { fmtChf, fmtEur, fmtPct } from '@/lib/format';
import { chfToEur } from '@/lib/fx';
import mcData from '@/data/montecarlo-results.json';

const MC = mcData as Record<string, any>;
const MULTIPLES = [6, 8, 10, 12, 15];
const MILESTONES = [12, 24, 36, 48];
const SCENARIOS = ['bootstrapped', 'series_a', 'series_ab', 'full_vc'];
const SCENARIO_NAMES: Record<string, string> = {
  bootstrapped: 'Bootstrapped',
  series_a: 'Series A',
  series_ab: 'A + B',
  full_vc: 'Full VC',
};
const COLORS = ['#C17F59', '#C9A96E', '#8B4A2B', '#5B7FB5'];

export default function ValuationPage() {
  const { model, assumptions } = useModel();

  const milestoneData = MILESTONES.map(mm => {
    const d = model.monthly[mm - 1];
    return { month: mm, arr: d.arr, arrEur: d.arrEur, paying: d.totalPaying, ebitda: d.ebitda, cash: d.closing };
  });

  const valuationMatrix = MILESTONES.map(mm => {
    const d = model.monthly[mm - 1];
    return {
      month: mm,
      valuations: MULTIPLES.map(x => ({ multiple: x, value: Math.round(d.arr * x), valueEur: Math.round(d.arrEur * x) })),
    };
  });

  const vestedPct = getVestedEquity(model);

  const equityData = MILESTONES.map(mm => {
    const d = model.monthly[mm - 1];
    const val10x = d.arr * 10;
    const vestedAtMilestone = model.vestingStatus
      .filter(v => v.month <= mm && v.met)
      .reduce((_, v) => v.cumulative, 0);
    const { percentage, value } = getMarcoEquityValue(val10x, assumptions.eurChf, assumptions.kicker, vestedAtMilestone);
    return { month: `M${mm}`, vestedPct: vestedAtMilestone, kickerPct: percentage, equityValue: value, companyValuation: val10x };
  });

  const totalSalary = model.monthly.reduce((s, d) => s + d.ceoTotal, 0);
  const totalMarketCost = assumptions.months * 19945;
  const sacrifice = totalMarketCost - totalSalary;

  const capTableStages = [
    { stage: 'Day 1 (allocated, unvested)', marco: 20, amedeo: 40, corsaro: 40, investors: 0 },
    { stage: 'M12 cliff (5% vested)', marco: 5, amedeo: 40, corsaro: 40, investors: 0 },
    { stage: 'M24 vest (12% vested)', marco: 12, amedeo: 40, corsaro: 40, investors: 0 },
    { stage: 'M36 fully vested (20%)', marco: 20, amedeo: 40, corsaro: 40, investors: 0 },
    { stage: 'Post Series A (20% dilution)', marco: 16, amedeo: 32, corsaro: 32, investors: 20 },
    { stage: 'Post A+B (+18% dilution)', marco: 13.1, amedeo: 26.2, corsaro: 26.2, investors: 34.4 },
    { stage: 'Exit >€30M (pre-dilution kicker 23%)', marco: 23, amedeo: 38.5, corsaro: 38.5, investors: 0 },
    { stage: 'Exit >€50M (pre-dilution kicker 25%)', marco: 25, amedeo: 37.5, corsaro: 37.5, investors: 0 },
    { stage: 'Exit >€100M (pre-dilution kicker 30%)', marco: 30, amedeo: 35, corsaro: 35, investors: 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-cream)]">Valuation & Exit</h1>

      {/* ARR milestones */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">ARR Milestones (Base Model)</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]"></th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">ARR (CHF)</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">ARR (EUR)</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">Paying</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">EBITDA/mo</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">Cash</th>
              </tr>
            </thead>
            <tbody>
              {milestoneData.map(d => (
                <tr key={d.month} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium">M{d.month}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--color-gold)]">{fmtChf(d.arr)}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--color-terracotta)]">{fmtEur(d.arrEur)}</td>
                  <td className="py-2 text-right tabular-nums">{d.paying}</td>
                  <td className={`py-2 text-right tabular-nums ${d.ebitda >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtChf(d.ebitda)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtChf(d.cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Monte Carlo ARR by scenario — P10/P50/P90 */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">ARR by Scenario (Monte Carlo P10 / P50 / P90, EUR)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-1.5 text-[var(--color-muted-foreground)]">Scenario</th>
                <th className="text-left py-1.5 text-[var(--color-muted-foreground)]">Pctl</th>
                {['M12', 'M24', 'M36', 'M48', 'M60'].map(m => (
                  <th key={m} className="text-right py-1.5 text-[var(--color-muted-foreground)]">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((id, si) => (
                ['p10', 'p50', 'p90'].map((pctl, pi) => (
                  <tr key={`${id}-${pctl}`} className={`border-b border-[var(--border)] ${pi === 0 ? 'border-t-2 border-t-[var(--color-deep-terracotta)]' : ''}`}>
                    {pi === 0 && <td rowSpan={3} className="py-1 font-medium" style={{ color: COLORS[si] }}>{SCENARIO_NAMES[id]}</td>}
                    <td className="py-1 text-[var(--color-muted-foreground)] uppercase text-[9px]">{pctl}</td>
                    {['M12', 'M24', 'M36', 'M48', 'M60'].map(m => (
                      <td key={m} className={`py-1 text-right tabular-nums ${pctl === 'p50' ? 'font-medium text-[var(--color-cream)]' : 'text-[var(--color-muted-foreground)]'}`}>
                        {fmtEur(MC[id]?.percentiles?.arr?.[m]?.[pctl] ?? 0)}
                      </td>
                    ))}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Valuation matrix — base model */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Valuation Matrix (Base Model, CHF)</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]"></th>
                {MULTIPLES.map(x => (
                  <th key={x} className="text-right py-2 text-[var(--color-cream)]">{x}x ARR</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {valuationMatrix.map(row => (
                <tr key={row.month} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium">M{row.month}</td>
                  {row.valuations.map(v => (
                    <td key={v.multiple} className={`py-2 text-right tabular-nums ${v.multiple === 10 ? 'text-[var(--color-gold)] font-medium' : 'text-[var(--color-cream)]'}`}>
                      {fmtChf(v.value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Company valuation by scenario — MC P10/P50/P90 */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Company Valuation by Scenario (10x ARR, Monte Carlo, CHF)</CardTitle>
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
              {SCENARIOS.map((id, si) => (
                <tr key={id} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium" style={{ color: COLORS[si] }}>{SCENARIO_NAMES[id]}</td>
                  {['M48', 'M60'].map(m =>
                    ['p10', 'p50', 'p90'].map(p => (
                      <td key={`${m}-${p}`} className={`py-2 text-right tabular-nums ${p === 'p50' ? 'text-[var(--color-gold)] font-medium' : 'text-[var(--color-muted-foreground)]'}`}>
                        {fmtChf(MC[id]?.percentiles?.valuation?.[m]?.[p] ?? 0)}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Marco's equity value by scenario — MC */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Marco's Equity Value by Scenario (Monte Carlo, CHF)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={SCENARIOS.map((id, i) => ({
              name: SCENARIO_NAMES[id],
              'M48 P10': MC[id]?.percentiles?.marcoEquity?.M48?.p10 ?? 0,
              'M48 P50': MC[id]?.percentiles?.marcoEquity?.M48?.p50 ?? 0,
              'M48 P90': MC[id]?.percentiles?.marcoEquity?.M48?.p90 ?? 0,
              'M60 P50': MC[id]?.percentiles?.marcoEquity?.M60?.p50 ?? 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#504038" />
              <XAxis dataKey="name" tick={{ fill: '#A89A8C', fontSize: 11 }} />
              <YAxis tick={{ fill: '#A89A8C', fontSize: 11 }} tickFormatter={v => fmtChf(v)} />
              <Tooltip contentStyle={{ background: '#302520', border: '1px solid #4A3A30', borderRadius: 8, color: '#F5EFE6' }} labelStyle={{ color: '#F5EFE6' }} itemStyle={{ color: '#F5EFE6' }} formatter={(v: any) => fmtChf(Number(v))} />
              <Legend />
              <Bar dataKey="M48 P10" fill="#8B4A2B" name="M48 P10 (pessimistic)" />
              <Bar dataKey="M48 P50" fill="#C17F59" name="M48 P50 (median)" />
              <Bar dataKey="M48 P90" fill="#C9A96E" name="M48 P90 (optimistic)" />
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-sm mt-4">
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
              {SCENARIOS.map((id, si) => (
                <tr key={id} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium" style={{ color: COLORS[si] }}>{SCENARIO_NAMES[id]}</td>
                  {['M48', 'M60'].map(m =>
                    ['p10', 'p50', 'p90'].map(p => (
                      <td key={`${m}-${p}`} className={`py-2 text-right tabular-nums ${p === 'p50' ? 'text-[var(--color-terracotta)] font-medium' : 'text-[var(--color-muted-foreground)]'}`}>
                        {fmtChf(MC[id]?.percentiles?.marcoEquity?.[m]?.[p] ?? 0)}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Marco's equity — base model breakdown */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Marco's Equity (Base Model, 10x ARR exit)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#504038" />
              <XAxis dataKey="month" tick={{ fill: '#A89A8C', fontSize: 12 }} />
              <YAxis tick={{ fill: '#A89A8C', fontSize: 11 }} tickFormatter={v => fmtChf(v)} />
              <Tooltip contentStyle={{ background: '#302520', border: '1px solid #4A3A30', borderRadius: 8, color: '#F5EFE6' }} labelStyle={{ color: '#F5EFE6' }} itemStyle={{ color: '#F5EFE6' }} formatter={(v: any) => fmtChf(Number(v))} />
              <Bar dataKey="equityValue" name="Equity Value">
                {equityData.map((_, i) => (
                  <Cell key={i} fill={i < 2 ? '#C17F59' : '#C9A96E'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {equityData.map(d => (
              <div key={d.month} className="flex justify-between text-sm">
                <span className="text-[var(--color-muted-foreground)]">
                  {d.month}: vested {fmtPct(d.vestedPct)} → exit share {fmtPct(d.kickerPct)}{d.kickerPct > d.vestedPct ? ' (kicker)' : ''}
                </span>
                <span className="text-[var(--color-gold)] font-medium">{fmtChf(d.equityValue)} on {fmtChf(d.companyValuation)} valuation</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cap table */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Cap Table Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Stage</th>
                <th className="text-right py-2 text-[var(--color-terracotta)]">Marco</th>
                <th className="text-right py-2">Amedeo</th>
                <th className="text-right py-2">Corsaro</th>
                <th className="text-right py-2 text-[var(--color-gold)]">Investors</th>
              </tr>
            </thead>
            <tbody>
              {capTableStages.map(s => (
                <tr key={s.stage} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium">{s.stage}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--color-terracotta)]">{s.marco}%</td>
                  <td className="py-2 text-right tabular-nums">{s.amedeo}%</td>
                  <td className="py-2 text-right tabular-nums">{s.corsaro}%</td>
                  <td className="py-2 text-right tabular-nums text-[var(--color-gold)]">{s.investors}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Salary sacrifice */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Salary Sacrifice Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[var(--color-muted-foreground)]">Total CEO cost ({assumptions.months}mo)</p>
              <p className="text-lg font-bold">{fmtChf(totalSalary)}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Market rate (CHF 220K, {assumptions.months}mo)</p>
              <p className="text-lg font-bold">{fmtChf(totalMarketCost)}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Equity-for-salary sacrifice</p>
              <p className="text-lg font-bold text-[var(--color-terracotta)]">{fmtChf(Math.abs(sacrifice))}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
