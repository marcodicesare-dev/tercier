'use client';

import { useModel } from '@/components/financial/model-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/financial/ui/card';
import { Badge } from '@/components/financial/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getMarcoEquityValue, getVestedEquity } from '@/lib/model';
import { fmtChf, fmtEur, fmtPct } from '@/lib/format';
import { chfToEur } from '@/lib/fx';

const MULTIPLES = [6, 8, 10, 12];
const MILESTONES = [12, 24, 36, 48];

export default function ValuationPage() {
  const { model, assumptions } = useModel();

  // ARR milestones table
  const milestoneData = MILESTONES.map(mm => {
    const d = model.monthly[mm - 1];
    return {
      month: mm,
      arr: d.arr,
      arrEur: d.arrEur,
      paying: d.totalPaying,
      ebitda: d.ebitda,
      cash: d.closing,
    };
  });

  // Valuation matrix
  const valuationMatrix = MILESTONES.map(mm => {
    const d = model.monthly[mm - 1];
    return {
      month: mm,
      valuations: MULTIPLES.map(x => ({
        multiple: x,
        value: Math.round(d.arr * x),
      })),
    };
  });

  // Marco's vested equity at M36 (max before kicker)
  const vestedPct = getVestedEquity(model);

  // Marco's equity at each milestone with kicker
  const equityData = MILESTONES.map(mm => {
    const d = model.monthly[mm - 1];
    const val10x = d.arr * 10;
    // Vested % at this milestone
    const vestedAtMilestone = model.vestingStatus
      .filter(v => v.month <= mm && v.met)
      .reduce((_, v) => v.cumulative, 0);
    const { percentage, value } = getMarcoEquityValue(val10x, assumptions.eurChf, assumptions.kicker, vestedAtMilestone);
    return {
      month: `M${mm}`,
      vestedPct: vestedAtMilestone,
      kickerPct: percentage,
      equityValue: value,
      companyValuation: val10x,
    };
  });

  // Salary sacrifice analysis
  const totalSalary = model.monthly.reduce((s, d) => s + d.ceoTotal, 0);
  const marketSalary = assumptions.months * (220000 / 12 + 19945 - 220000 / 12); // market rate CHF 220K total cost
  const totalMarketCost = assumptions.months * 19945;
  const sacrifice = totalMarketCost - totalSalary;

  // Cap table evolution — CORRECT per counterproposal response Apr 4, 2026
  // Marco starts at 0%, earns through vesting. A/C/M relative split stays fixed through dilution.
  // Anti-dilution floors: 10% through Series A, 8% from Series B. PSOP 5% off cap table (phantom).
  const capTableStages = [
    { stage: 'Day 1 (unvested)', marco: 0, amedeo: 50, corsaro: 50, investors: 0 },
    { stage: 'M12 cliff (+5%)', marco: 5, amedeo: 47.5, corsaro: 47.5, investors: 0 },
    { stage: 'M24 vest (+7%)', marco: 12, amedeo: 44, corsaro: 44, investors: 0 },
    { stage: 'M36 vest (+8%)', marco: 20, amedeo: 40, corsaro: 40, investors: 0 },
    { stage: 'Post Series A (20% dilution)', marco: 16, amedeo: 32, corsaro: 32, investors: 20 },
    { stage: 'Post A+B (18% additional)', marco: 13.1, amedeo: 26.2, corsaro: 26.2, investors: 34.4 },
    { stage: 'Exit >€30M (kicker → 23%)', marco: 23, amedeo: 38.5, corsaro: 38.5, investors: 0 },
    { stage: 'Exit >€100M (kicker → 30%)', marco: 30, amedeo: 35, corsaro: 35, investors: 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-cream)]">Valuation & Exit</h1>

      {/* ARR milestones */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">ARR Milestones</CardTitle>
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

      {/* Valuation matrix */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Valuation Matrix (CHF)</CardTitle>
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

      {/* Marco's equity */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Marco's Equity Value (10x exit)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3028" />
              <XAxis dataKey="month" tick={{ fill: '#A89A8C', fontSize: 12 }} />
              <YAxis tick={{ fill: '#A89A8C', fontSize: 11 }} tickFormatter={v => fmtChf(v)} />
              <Tooltip
                contentStyle={{ background: '#2A2018', border: '1px solid #4A3A30', borderRadius: 8, color: '#F5EFE6' }} labelStyle={{ color: '#F5EFE6' }} itemStyle={{ color: '#F5EFE6' }}
                formatter={(v: any) => fmtChf(Number(v))}
              />
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
              <p className="text-[var(--color-muted-foreground)]">Total CEO cost (48mo)</p>
              <p className="text-lg font-bold">{fmtChf(totalSalary)}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Market rate (CHF 220K, 48mo)</p>
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
