'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthData } from '@/lib/financial-types';

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
            <stop offset="5%" stopColor="#C17F59" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C17F59" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={v => `€${(v / 1_000_000).toFixed(1)}M`}
        />
        <Tooltip
          contentStyle={{ background: '#302520', border: '1px solid #4A3A30', borderRadius: 8, color: '#F5EFE6' }} labelStyle={{ color: '#F5EFE6' }} itemStyle={{ color: '#F5EFE6' }}
          formatter={(v: any) => [`€${Number(v).toLocaleString()}`, 'ARR']}
        />
        <Area
          type="monotone"
          dataKey="arr"
          stroke="#C17F59"
          strokeWidth={2}
          fill="url(#arrGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
