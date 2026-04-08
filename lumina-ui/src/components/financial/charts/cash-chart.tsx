'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { MonthData } from '@/lib/financial-types';
import { CHART_THEME } from '@/lib/chart-theme';

interface CashChartProps {
  data: MonthData[];
}

export function CashChart({ data }: CashChartProps) {
  const chartData = data.map(d => ({
    month: `M${d.month}`,
    cash: Math.round(d.closing),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_THEME.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_THEME.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
        <XAxis
          dataKey="month"
          tick={{ fill: CHART_THEME.tick, fontSize: 11 }}
          tickLine={false}
          interval={5}
        />
        <YAxis
          tick={{ fill: CHART_THEME.tick, fontSize: 11 }}
          tickLine={false}
          tickFormatter={v => `CHF ${(v / 1_000_000).toFixed(1)}M`}
        />
        <Tooltip
          contentStyle={{ background: CHART_THEME.tooltip.bg, border: `1px solid ${CHART_THEME.tooltip.border}`, borderRadius: 12, color: CHART_THEME.tooltip.text }}
          labelStyle={{ color: CHART_THEME.tooltip.text }}
          itemStyle={{ color: CHART_THEME.tooltip.text }}
          formatter={(v: any) => [`CHF ${Number(v).toLocaleString('en-CH')}`, 'Cash']}
        />
        <ReferenceLine y={0} stroke={CHART_THEME.negative} strokeDasharray="5 5" />
        <Area
          type="monotone"
          dataKey="cash"
          stroke={CHART_THEME.gold}
          strokeWidth={2}
          fill="url(#cashGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
