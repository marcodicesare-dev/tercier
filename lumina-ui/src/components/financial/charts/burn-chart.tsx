'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { MonthData } from '@/lib/financial-types';

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
        <CartesianGrid strokeDasharray="3 3" stroke="#504038" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#A89A8C', fontSize: 11 }}
          tickLine={false}
          interval={5}
        />
        <YAxis
          tick={{ fill: '#A89A8C', fontSize: 11 }}
          tickLine={false}
          tickFormatter={v => `CHF ${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={{ background: '#302520', border: '1px solid #4A3A30', borderRadius: 8, color: '#F5EFE6' }} labelStyle={{ color: '#F5EFE6' }} itemStyle={{ color: '#F5EFE6' }}
          formatter={(v: any) => [`CHF ${Number(v).toLocaleString()}`, 'EBITDA']}
        />
        <Bar dataKey="ebitda">
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profitable ? '#6B8E5A' : '#DC2626'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
