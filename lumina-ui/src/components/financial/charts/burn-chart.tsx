'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { MonthData } from '@/lib/financial-types';
import { CHART_THEME } from '@/lib/chart-theme';

interface BurnChartProps {
  data: MonthData[];
}

export function BurnChart({ data }: BurnChartProps) {
  const chartData = data.map(d => {
    const netBurn = d.totalCosts - d.rev;
    return {
      month: `M${d.month}`,
      ebitda: d.ebitda,
      profitable: d.ebitda >= 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
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
          tickFormatter={v => `CHF ${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={{ background: CHART_THEME.tooltip.bg, border: `1px solid ${CHART_THEME.tooltip.border}`, borderRadius: 12, color: CHART_THEME.tooltip.text }}
          labelStyle={{ color: CHART_THEME.tooltip.text }}
          itemStyle={{ color: CHART_THEME.tooltip.text }}
          formatter={(v: any) => [`CHF ${Number(v).toLocaleString('en-CH')}`, 'EBITDA']}
        />
        <Bar dataKey="ebitda">
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profitable ? CHART_THEME.positive : CHART_THEME.negative} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
