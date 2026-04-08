'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthData } from '@/lib/financial-types';
import { CHART_THEME } from '@/lib/chart-theme';

interface HotelsChartProps {
  data: MonthData[];
}

export function HotelsChart({ data }: HotelsChartProps) {
  const chartData = data.map(d => ({
    month: `M${d.month}`,
    chain: d.totalChainPaying,
    indie: d.indie,
    total: d.totalPaying,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="chainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_THEME.terracotta} stopOpacity={0.4} />
            <stop offset="95%" stopColor={CHART_THEME.terracotta} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="indieGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_THEME.gold} stopOpacity={0.4} />
            <stop offset="95%" stopColor={CHART_THEME.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
        <XAxis dataKey="month" tick={{ fill: CHART_THEME.tick, fontSize: 11 }} tickLine={false} interval={5} />
        <YAxis tick={{ fill: CHART_THEME.tick, fontSize: 11 }} tickLine={false} />
        <Tooltip
          contentStyle={{ background: CHART_THEME.tooltip.bg, border: `1px solid ${CHART_THEME.tooltip.border}`, borderRadius: 12, color: CHART_THEME.tooltip.text }}
          labelStyle={{ color: CHART_THEME.tooltip.text }}
          itemStyle={{ color: CHART_THEME.tooltip.text }}
        />
        <Area type="monotone" dataKey="chain" stackId="1" stroke={CHART_THEME.terracotta} fill="url(#chainGrad)" name="Chain" />
        <Area type="monotone" dataKey="indie" stackId="1" stroke={CHART_THEME.gold} fill="url(#indieGrad)" name="Indie" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
