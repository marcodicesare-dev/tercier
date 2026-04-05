'use client';

import { useModel } from '@/components/financial/model-context';
import { CashChart } from '@/components/financial/charts/cash-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/financial/ui/card';
import { MetricCard } from '@/components/financial/metric-card';
import { fmtChf, fmtRunway } from '@/lib/format';
import { ScrollArea, ScrollBar } from '@/components/financial/ui/scroll-area';

function fmtCHF(v: number): string {
  if (v === 0) return '-';
  const neg = v < 0;
  const abs = Math.abs(Math.round(v));
  return neg ? `(${abs.toLocaleString()})` : abs.toLocaleString();
}

export default function CashFlowPage() {
  const { model, assumptions } = useModel();
  const data = model.monthly;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-cream)]">Cash Flow</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Initial Capital" value="CHF 200,000" />
        <MetricCard label="Lowest Cash" value={fmtChf(model.lowestCash.amount)} sublabel={`at M${model.lowestCash.month}`} color="red" />
        <MetricCard label="M48 Cash" value={fmtChf(data[47]?.closing ?? 0)} color="green" />
        <MetricCard label="Breakeven" value={model.breakeven ? `M${model.breakeven}` : 'N/A'} color="gold" />
      </div>

      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Cash Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <CashChart data={data} />
        </CardContent>
      </Card>

      {/* Runway & 6-month clause */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Runway & 6-Month Clause</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-max">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--color-deep-terracotta)]">
                    <th className="sticky left-0 bg-[var(--color-deep-terracotta)] z-10 px-3 py-2 text-left text-[var(--color-cream)] w-48 min-w-48">Item</th>
                    {data.map(d => (
                      <th key={d.month} className="px-2 py-2 text-right text-[var(--color-cream)] min-w-20">M{d.month}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[var(--color-ink-light)]">
                    <td colSpan={data.length + 1} className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 text-[var(--color-gold)] text-[10px] uppercase tracking-wider">Inflows</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">Capital injection</td>
                    {data.map(d => (
                      <td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">
                        {d.month === 1 ? fmtCHF(assumptions.capital) : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">Revenue</td>
                    {data.map(d => (
                      <td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-green-400">{fmtCHF(d.rev)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border)] bg-[var(--color-ink-light)]">
                    <td className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 font-bold text-[var(--color-cream)]">Total Inflows</td>
                    {data.map(d => (
                      <td key={d.month} className="px-2 py-1.5 text-right tabular-nums font-bold text-[var(--color-cream)]">{fmtCHF(d.cashIn)}</td>
                    ))}
                  </tr>

                  <tr className="bg-[var(--color-ink-light)]">
                    <td colSpan={data.length + 1} className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 text-[var(--color-gold)] text-[10px] uppercase tracking-wider">Outflows — People</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">CEO gross salary</td>
                    {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.ceoGross)}</td>))}
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">CEO social contributions</td>
                    {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.ceoSocial)}</td>))}
                  </tr>
                  {assumptions.team.map(t => (
                    <tr key={t.key} className="border-b border-[var(--border)]">
                      <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">{t.label.split('(')[0].trim()}</td>
                      {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.teamCosts[`team_${t.key}`] || 0)}</td>))}
                    </tr>
                  ))}

                  <tr className="bg-[var(--color-ink-light)]">
                    <td colSpan={data.length + 1} className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 text-[var(--color-gold)] text-[10px] uppercase tracking-wider">Outflows — AI & Technology</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">AI COGS (€50/hotel/mo)</td>
                    {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.aiCogs)}</td>))}
                  </tr>
                  {assumptions.devTooling.map(t => (
                    <tr key={t.key} className="border-b border-[var(--border)]">
                      <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">{t.label}</td>
                      {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.devToolingCosts[t.key] || 0)}</td>))}
                    </tr>
                  ))}

                  <tr className="bg-[var(--color-ink-light)]">
                    <td colSpan={data.length + 1} className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 text-[var(--color-gold)] text-[10px] uppercase tracking-wider">Outflows — Infrastructure</td>
                  </tr>
                  {assumptions.infrastructure.map(infra => (
                    <tr key={infra.key} className="border-b border-[var(--border)]">
                      <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">{infra.label}</td>
                      {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.infraCosts[`infra_${infra.key}`] || 0)}</td>))}
                    </tr>
                  ))}

                  <tr className="bg-[var(--color-ink-light)]">
                    <td colSpan={data.length + 1} className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 text-[var(--color-gold)] text-[10px] uppercase tracking-wider">Outflows — Admin & Other</td>
                  </tr>
                  {assumptions.admin.map(adm => (
                    <tr key={adm.key} className="border-b border-[var(--border)]">
                      <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">{adm.label}</td>
                      {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.adminCosts[`admin_${adm.key}`] || 0)}</td>))}
                    </tr>
                  ))}
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">Workspace (internet + coworking)</td>
                    {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.wsInternet + d.wsCoworking)}</td>))}
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">Travel + Marketing</td>
                    {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.smTravel + d.smMarketing)}</td>))}
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">Processing (Stripe 3%)</td>
                    {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.processing)}</td>))}
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">Contingency</td>
                    {data.map(d => (<td key={d.month} className="px-2 py-1.5 text-right tabular-nums text-[var(--color-cream)]">{fmtCHF(d.contingency)}</td>))}
                  </tr>

                  <tr className="border-b border-[var(--border)] bg-[var(--color-ink-light)]">
                    <td className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 font-bold text-[var(--color-cream)]">Total Outflows</td>
                    {data.map(d => (
                      <td key={d.month} className="px-2 py-1.5 text-right tabular-nums font-bold text-red-400">{fmtCHF(d.totalCosts)}</td>
                    ))}
                  </tr>

                  <tr className="bg-[var(--color-ink-light)]">
                    <td colSpan={data.length + 1} className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 text-[var(--color-gold)] text-[10px] uppercase tracking-wider">Cash Position</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">Net cash flow</td>
                    {data.map(d => {
                      const net = d.cashIn - d.totalCosts;
                      return (
                        <td key={d.month} className={`px-2 py-1.5 text-right tabular-nums ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {fmtCHF(net)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-[var(--border)] bg-[var(--color-ink-light)]">
                    <td className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 font-bold text-[var(--color-cream)]">Closing Balance</td>
                    {data.map(d => (
                      <td key={d.month} className={`px-2 py-1.5 text-right tabular-nums font-bold ${d.closing >= 0 ? 'text-[var(--color-gold)]' : 'text-red-400'}`}>
                        {fmtCHF(Math.round(d.closing))}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">Net burn</td>
                    {data.map(d => {
                      const burn = d.totalCosts - d.rev;
                      return (
                        <td key={d.month} className={`px-2 py-1.5 text-right tabular-nums ${burn <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {burn <= 0 ? 'Profitable' : fmtCHF(burn)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">Runway (months)</td>
                    {data.map(d => (
                      <td key={d.month} className={`px-2 py-1.5 text-right tabular-nums ${d.runway >= 999 ? 'text-green-400' : d.runway >= 12 ? 'text-[var(--color-gold)]' : d.runway >= 6 ? 'text-[var(--color-cream)]' : 'text-red-400'}`}>
                        {fmtRunway(d.runway)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="sticky left-0 bg-[var(--card)] z-10 px-3 py-1.5 text-[var(--color-muted-foreground)]">6-month clause met?</td>
                    {data.map(d => (
                      <td key={d.month} className={`px-2 py-1.5 text-right tabular-nums font-medium ${d.clauseMet ? 'text-green-400' : 'text-red-400'}`}>
                        {d.clauseMet ? 'YES' : 'NO'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
