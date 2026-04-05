'use client';

import { useModel } from '@/components/financial/model-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/financial/ui/card';
import { MetricCard } from '@/components/financial/metric-card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { fmtChf } from '@/lib/format';

const TAX_RATES = {
  zug: 0.1182,
  zurich: 0.1959,
};

export default function ZugVsZurichPage() {
  const { model } = useModel();

  const yearData = model.annual.map(a => {
    const taxable = Math.max(0, a.ebitda);
    const zugTax = Math.round(taxable * TAX_RATES.zug);
    const zurichTax = Math.round(taxable * TAX_RATES.zurich);
    return {
      year: `Y${a.year}`,
      ebitda: a.ebitda,
      zugTax,
      zurichTax,
      zugAfterTax: Math.round(a.ebitda - zugTax),
      zurichAfterTax: Math.round(a.ebitda - zurichTax),
      savings: zurichTax - zugTax,
    };
  });

  const cumulativeSavings = yearData.reduce((s, d) => s + d.savings, 0);

  const chartData = yearData.map(d => ({
    year: d.year,
    'Zug/Baar': d.zugTax,
    'Zurich': d.zurichTax,
  }));

  const savingsChart = yearData.map((d, i) => ({
    year: d.year,
    annual: d.savings,
    cumulative: yearData.slice(0, i + 1).reduce((s, x) => s + x.savings, 0),
  }));

  const otherDiffs = [
    { item: 'Incorporation notary fee', zug: 'CHF 1,000', zurich: 'CHF 1,500', note: 'CHF 500 more' },
    { item: 'FAK employer rate', zug: '1.35%', zurich: '0.98%', note: '~CHF 400/yr cheaper in ZH per employee' },
    { item: 'Capital tax rate', zug: '0.07%', zurich: '0.17%', note: 'CHF 200 more/yr at CHF 200K equity' },
    { item: 'Treuhand costs', zug: 'Similar', zurich: 'Similar', note: '10-20% higher in ZH on average' },
    { item: 'Domiciliation', zug: 'CHF 29/mo basic', zurich: 'CHF 50/mo basic', note: 'Minimal difference' },
    { item: 'Insurance', zug: 'Same', zurich: 'Same', note: 'Not canton-dependent' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-cream)]">Zug vs Zurich</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Baar/Zug Rate" value="11.82%" color="green" />
        <MetricCard label="Zurich City Rate" value="19.59%" color="red" />
        <MetricCard label="Difference" value="-7.77pp" color="gold" />
        <MetricCard label="4-Year Savings" value={fmtChf(cumulativeSavings)} color="terracotta" />
      </div>

      {/* Tax comparison chart */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Annual Corporate Tax (CHF)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3028" />
              <XAxis dataKey="year" tick={{ fill: '#A89A8C', fontSize: 12 }} />
              <YAxis tick={{ fill: '#A89A8C', fontSize: 11 }} tickFormatter={v => fmtChf(v)} />
              <Tooltip contentStyle={{ background: '#2A2018', border: '1px solid #4A3A30', borderRadius: 8, color: '#F5EFE6' }} labelStyle={{ color: '#F5EFE6' }} itemStyle={{ color: '#F5EFE6' }} formatter={(v: any) => fmtChf(Number(v))} />
              <Legend />
              <Bar dataKey="Zug/Baar" fill="#6B8E5A" />
              <Bar dataKey="Zurich" fill="#DC2626" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* After-tax comparison table */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">After-Tax Profit by Year</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Year</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">EBITDA</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">Tax (Zug)</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">After-tax (Zug)</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">Tax (Zurich)</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">After-tax (ZH)</th>
                <th className="text-right py-2 text-[var(--color-gold)]">Zug Saves</th>
              </tr>
            </thead>
            <tbody>
              {yearData.map(d => (
                <tr key={d.year} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium">{d.year}</td>
                  <td className={`py-2 text-right tabular-nums ${d.ebitda >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtChf(d.ebitda)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtChf(d.zugTax)}</td>
                  <td className="py-2 text-right tabular-nums text-green-400">{fmtChf(d.zugAfterTax)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtChf(d.zurichTax)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtChf(d.zurichAfterTax)}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--color-gold)] font-bold">{fmtChf(d.savings)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-t-[var(--color-deep-terracotta)]">
                <td className="py-2 font-bold">TOTAL</td>
                <td colSpan={5}></td>
                <td className="py-2 text-right tabular-nums text-[var(--color-terracotta)] font-bold text-lg">{fmtChf(cumulativeSavings)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Other differences */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Other Differences</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Item</th>
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Baar/Zug</th>
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Zurich City</th>
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Note</th>
              </tr>
            </thead>
            <tbody>
              {otherDiffs.map(d => (
                <tr key={d.item} className="border-b border-[var(--border)]">
                  <td className="py-2">{d.item}</td>
                  <td className="py-2 text-[var(--color-cream)]">{d.zug}</td>
                  <td className="py-2 text-[var(--color-cream)]">{d.zurich}</td>
                  <td className="py-2 text-[var(--color-muted-foreground)] text-xs">{d.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="p-4 rounded-md bg-[var(--color-ink-light)] border border-[var(--color-deep-terracotta)]">
        <p className="text-sm font-bold text-[var(--color-terracotta)]">
          VERDICT: Zug/Baar saves {fmtChf(cumulativeSavings)} in corporate tax over 4 years.
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
          Incorporation cost difference is negligible. Choose Zug.
        </p>
      </div>
    </div>
  );
}
