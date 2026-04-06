'use client';

import { useModel } from '@/components/model-context';
import { MonthlyTable } from '@/components/monthly-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_ASSUMPTIONS } from '@/lib/defaults';

function fmtN(v: number): string {
  return v === 0 ? '-' : String(v);
}

export default function PnlPage() {
  const { model, assumptions } = useModel();

  const hotelColumns = [
    ...assumptions.chains.map((c, i) => ({
      key: `chain_${i}`,
      label: `  ${c.name}`,
      getValue: (d: any) => d.chainActive[i],
      format: fmtN,
      section: i === 0 ? 'Hotel Counts' : undefined,
    })),
    { key: 'total_chain_active', label: 'Total chain active', getValue: (d: any) => d.totalChainActive, format: fmtN, bold: true },
    { key: 'indie', label: 'Independent active', getValue: (d: any) => d.indie, format: fmtN },
    { key: 'total_active', label: 'TOTAL ACTIVE', getValue: (d: any) => d.totalActive, format: fmtN, bold: true },
    { key: 'total_chain_pay', label: 'Chain paying (post-trial)', getValue: (d: any) => d.totalChainPaying, format: fmtN },
    { key: 'indie_pay', label: 'Indie paying', getValue: (d: any) => d.indie, format: fmtN },
    { key: 'total_pay', label: 'TOTAL PAYING', getValue: (d: any) => d.totalPaying, format: fmtN, bold: true },
  ];

  const revenueColumns = [
    { key: 'rev_chain', label: 'Chain revenue', getValue: (d: any) => d.revChain, section: 'Revenue (CHF)' },
    { key: 'rev_indie', label: 'Indie revenue', getValue: (d: any) => d.revIndie },
    { key: 'rev', label: 'TOTAL REVENUE', getValue: (d: any) => d.rev, bold: true },
    { key: 'arr', label: 'ARR (CHF)', getValue: (d: any) => d.arr, bold: true },
    { key: 'arr_eur', label: 'ARR (EUR)', getValue: (d: any) => Math.round(d.arrEur) },
  ];

  const costColumns = [
    { key: 'ceo_gross', label: 'CEO gross salary', getValue: (d: any) => d.ceoGross, section: 'People' },
    { key: 'ceo_social', label: 'CEO employer social', getValue: (d: any) => d.ceoSocial },
    ...assumptions.team.map(t => ({
      key: `team_${t.key}`,
      label: `  ${t.label}`,
      getValue: (d: any) => d.teamCosts[`team_${t.key}`] || 0,
    })),
    { key: 'ai_cogs', label: 'AI COGS (€50/hotel/mo)', getValue: (d: any) => d.aiCogs, section: 'AI & Technology' },
    ...assumptions.devTooling.map(t => ({
      key: t.key,
      label: `  ${t.label}`,
      getValue: (d: any) => d.devToolingCosts[t.key] || 0,
    })),
    ...assumptions.infrastructure.map((infra, i) => ({
      key: `infra_${infra.key}`,
      label: `  ${infra.label}`,
      getValue: (d: any) => d.infraCosts[`infra_${infra.key}`] || 0,
      section: i === 0 ? 'Infrastructure (SaaS)' : undefined,
    })),
    ...assumptions.admin.map((adm, i) => ({
      key: `admin_${adm.key}`,
      label: `  ${adm.label}`,
      getValue: (d: any) => d.adminCosts[`admin_${adm.key}`] || 0,
      section: i === 0 ? 'Admin & Professional' : undefined,
    })),
    { key: 'ws_internet', label: 'Internet (Sunrise 1Gbit)', getValue: (d: any) => d.wsInternet, section: 'Workspace' },
    { key: 'ws_coworking', label: 'Coworking (Zurich)', getValue: (d: any) => d.wsCoworking },
    { key: 'sm_travel', label: 'Travel (client visits)', getValue: (d: any) => d.smTravel, section: 'Sales & Marketing' },
    { key: 'sm_marketing', label: 'Marketing & events', getValue: (d: any) => d.smMarketing },
    { key: 'processing', label: 'Payment processing (Stripe 3%)', getValue: (d: any) => d.processing, section: 'Variable & Other' },
    { key: 'contingency', label: 'Contingency buffer', getValue: (d: any) => d.contingency },
    ...assumptions.oneTimeCosts.map((ot, i) => ({
      key: ot.key,
      label: `  ${ot.label}`,
      getValue: (d: any) => d.oneTimeCosts[ot.key] || 0,
      section: i === 0 ? 'One-Time (M1 only)' : undefined,
    })),
    { key: 'total_costs', label: 'TOTAL COSTS', getValue: (d: any) => d.totalCosts, bold: true, section: 'Totals' },
  ];

  const profitColumns = [
    { key: 'ebitda', label: 'EBITDA', getValue: (d: any) => d.ebitda, bold: true, section: 'Profitability' },
    { key: 'ebitda_margin', label: 'EBITDA margin', getValue: (d: any) => d.rev > 0 ? d.ebitda / d.rev : 0, format: (v: number) => v === 0 ? '-' : `${(v * 100).toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-cream)]">P&L — Monthly View (CHF)</h1>

      {/* Annual summary */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Annual Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 text-[var(--color-muted-foreground)]">Year</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">Revenue</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">Costs</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">EBITDA</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">Margin</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">Hotels</th>
                <th className="text-right py-2 text-[var(--color-muted-foreground)]">ARR (EUR)</th>
              </tr>
            </thead>
            <tbody>
              {model.annual.map(a => (
                <tr key={a.year} className="border-b border-[var(--border)]">
                  <td className="py-2 font-medium">Y{a.year}</td>
                  <td className="py-2 text-right text-green-400 tabular-nums">CHF {a.revenue.toLocaleString()}</td>
                  <td className="py-2 text-right text-red-400 tabular-nums">CHF {a.costs.toLocaleString()}</td>
                  <td className={`py-2 text-right font-bold tabular-nums ${a.ebitda >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    CHF {a.ebitda.toLocaleString()}
                  </td>
                  <td className="py-2 text-right tabular-nums">{(a.ebitdaMargin * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right tabular-nums">{a.endPayingHotels}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--color-terracotta)]">€{Math.round(a.endArrEur).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Monthly detail */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Monthly Detail — Every Cost Item</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MonthlyTable data={model.monthly} columns={[...hotelColumns, ...revenueColumns, ...costColumns, ...profitColumns] as any} />
        </CardContent>
      </Card>
    </div>
  );
}
