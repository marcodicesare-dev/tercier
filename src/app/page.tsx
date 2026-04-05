'use client';

import { useModel } from '@/components/model-context';
import { MetricCard } from '@/components/metric-card';
import { ArrChart } from '@/components/charts/arr-chart';
import { CashChart } from '@/components/charts/cash-chart';
import { BurnChart } from '@/components/charts/burn-chart';
import { HotelsChart } from '@/components/charts/hotels-chart';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { fmtChf, fmtEur, fmtPct, fmtRunway, fmtNum } from '@/lib/format';
import { useState, useRef, useCallback } from 'react';
import { DEFAULT_ASSUMPTIONS } from '@/lib/defaults';
import { runModel } from '@/lib/model';
import type { ModelOutput } from '@/lib/types';
import { Camera, X } from 'lucide-react';

export default function DashboardPage() {
  const { model, assumptions } = useModel();
  const [viewMonth, setViewMonth] = useState(12);
  const [snapshot, setSnapshot] = useState<ModelOutput | null>(null);
  const d = model.monthly[viewMonth - 1];
  const sd = snapshot ? snapshot.monthly[Math.min(viewMonth - 1, snapshot.monthly.length - 1)] : null;

  const takeSnapshot = useCallback(() => {
    setSnapshot(JSON.parse(JSON.stringify(model)));
  }, [model]);

  const clearSnapshot = useCallback(() => setSnapshot(null), []);

  // Delta display
  const delta = (current: number, prev: number | undefined) => {
    if (prev === undefined) return null;
    const diff = current - prev;
    if (Math.abs(diff) < 1) return null;
    const pct = prev !== 0 ? ((diff / Math.abs(prev)) * 100).toFixed(0) : '∞';
    return (
      <span className={`text-[10px] ml-1 ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {diff > 0 ? '+' : ''}{pct}%
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-cream)]">Key Metrics</h1>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            Adjust assumptions with the <span className="text-[var(--color-terracotta)]">gear button</span> — everything recalculates instantly
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Snapshot toggle */}
          <div className="flex gap-2">
            {snapshot ? (
              <button onClick={clearSnapshot} className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-deep-terracotta)] text-[var(--color-cream)] text-xs hover:bg-[var(--color-terracotta)] transition-colors">
                <X className="h-3 w-3" /> Clear comparison
              </button>
            ) : (
              <button onClick={takeSnapshot} className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--color-muted-foreground)] text-xs hover:border-[var(--color-terracotta)] hover:text-[var(--color-cream)] transition-colors">
                <Camera className="h-3 w-3" /> Snapshot for comparison
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-[var(--color-terracotta)] min-w-[40px] text-right">M{viewMonth}</span>
            <Slider
              value={[viewMonth]}
              onValueChange={v => setViewMonth(Array.isArray(v) ? v[0] : v)}
              min={1}
              max={assumptions.months}
              step={1}
              className="w-52"
            />
          </div>
        </div>
      </div>

      {snapshot && (
        <div className="bg-[var(--color-deep-terracotta)]/20 border border-[var(--color-deep-terracotta)] rounded-md px-3 py-1.5 text-[11px] text-[var(--color-gold)]">
          Comparing current assumptions vs snapshot. Percentages show change from snapshot.
        </div>
      )}

      {/* Big number cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="ARR (EUR)"
          value={fmtEur(d.arrEur)}
          sublabel={sd ? `was ${fmtEur(sd.arrEur)}` : undefined}
          color="terracotta"
        />
        <MetricCard label="MRR (CHF)" value={fmtChf(d.rev)} sublabel={sd ? `was ${fmtChf(sd.rev)}` : undefined} />
        <MetricCard label="Paying Hotels" value={fmtNum(d.totalPaying)} sublabel={`${d.totalChainPaying} chain + ${d.indie} indie`} color="gold" />
        <MetricCard
          label="Cash"
          value={fmtChf(d.closing)}
          sublabel={sd ? `was ${fmtChf(sd.closing)}` : undefined}
          color={d.closing < 100000 ? 'red' : 'green'}
        />
        <MetricCard
          label="Runway"
          value={fmtRunway(d.runway)}
          sublabel={d.clauseMet ? '6-mo clause: MET' : '6-mo clause: NOT MET'}
          color={d.runway >= 999 ? 'green' : d.runway >= 12 ? 'gold' : d.runway >= 6 ? 'default' : 'red'}
        />
        <MetricCard
          label="EBITDA"
          value={fmtChf(d.ebitda)}
          sublabel={d.rev > 0 ? `margin ${fmtPct(d.ebitda / d.rev)}` : undefined}
          color={d.ebitda >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Additional metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="CEO Salary" value={`CHF ${(d.ceoSalary / 1000).toFixed(0)}K/yr`} sublabel={`Total cost: CHF ${d.ceoTotal.toLocaleString()}/mo`} />
        <MetricCard label="Team Cost" value={fmtChf(d.teamTotal)} sublabel={`${assumptions.team.filter(t => d.month >= t.startMonth).length} of ${assumptions.team.length} hired`} />
        <MetricCard label="AI COGS" value={fmtChf(d.aiCogs)} sublabel={`€${assumptions.aiCogsPerHotelEur}/hotel × ${d.totalPaying}`} />
        <MetricCard label="Total Costs" value={fmtChf(d.totalCosts)} sublabel={sd ? `was ${fmtChf(sd.totalCosts)}` : undefined} color="red" />
      </div>

      {/* Charts - 2x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">ARR Trajectory (EUR)</CardTitle>
          </CardHeader>
          <CardContent>
            <ArrChart data={model.monthly} />
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Cash Balance (CHF)</CardTitle>
          </CardHeader>
          <CardContent>
            <CashChart data={model.monthly} />
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Paying Hotels (stacked)</CardTitle>
          </CardHeader>
          <CardContent>
            <HotelsChart data={model.monthly} />
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Monthly EBITDA (CHF)</CardTitle>
          </CardHeader>
          <CardContent>
            <BurnChart data={model.monthly} />
          </CardContent>
        </Card>
      </div>

      {/* CEO & Vesting side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">CEO Salary Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {model.ceoStepUpTimeline.map(s => (
                <div key={s.month} className="flex justify-between items-center">
                  <span className={`text-sm ${s.month <= viewMonth ? 'text-[var(--color-cream)]' : 'text-[var(--color-muted-foreground)]'}`}>
                    M{s.month}: CHF {s.salary.toLocaleString()}/yr
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">CHF {s.total.toLocaleString()}/mo</span>
                    <Badge variant={s.month <= viewMonth ? 'default' : 'secondary'} className={s.month <= viewMonth ? 'bg-[var(--color-terracotta)] text-[var(--color-ink)]' : ''}>
                      {s.month <= viewMonth ? 'Active' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--color-muted-foreground)]">Vesting Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {model.vestingStatus.map((v, i) => (
                <div key={v.month} className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-cream)]">
                    M{v.month}: +{(assumptions.vesting[i].additionalPct * 100).toFixed(0)}% ({assumptions.vesting[i].condition})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-muted-foreground)]">{fmtPct(v.cumulative)}</span>
                    <Badge className={v.met ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                      {v.met ? 'MET' : 'NOT MET'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Breakeven" value={model.breakeven ? `M${model.breakeven}` : 'N/A'} color="green" />
        <MetricCard label="Lowest Cash" value={fmtChf(model.lowestCash.amount)} sublabel={`at M${model.lowestCash.month}`} color="red" />
        <MetricCard label="Max Drawdown" value={fmtChf(model.maxDrawdown)} />
        <MetricCard label="Y1 EBITDA" value={fmtChf(model.annual[0]?.ebitda ?? 0)} color={model.annual[0]?.ebitda >= 0 ? 'green' : 'red'} />
        <MetricCard label="Y4 EBITDA" value={fmtChf(model.annual[3]?.ebitda ?? 0)} color="gold" />
      </div>
    </div>
  );
}
