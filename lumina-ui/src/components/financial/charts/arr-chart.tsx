'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthData } from '@/lib/financial-types';
import { CHART_THEME } from '@/lib/chart-theme';

interface ArrChartProps {
  data: MonthData[];
}

export function ArrChart({ data }: ArrChartProps) {
  const chartData = data.map(d => ({
    month: `M${d.month}`,
    arr: Math.round(d.arrEur),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="arrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_THEME.terracotta} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_THEME.terracotta} stopOpacity={0} />
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
          tickFormatter={v => `€${(v / 1_000_000).toFixed(1)}M`}
        />
        <Tooltip
          contentStyle={{ background: CHART_THEME.tooltip.bg, border: `1px solid ${CHART_THEME.tooltip.border}`, borderRadius: 12, color: CHART_THEME.tooltip.text }}
          labelStyle={{ color: CHART_THEME.tooltip.text }}
          itemStyle={{ color: CHART_THEME.tooltip.text }}
          formatter={(v: any) => [`€${Number(v).toLocaleString('en-CH')}`, 'ARR']}
        />
        <Area
          type="monotone"
          dataKey="arr"
          stroke={CHART_THEME.terracotta}
          strokeWidth={2}
          fill="url(#arrGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
