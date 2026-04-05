'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthData } from '@/lib/financial-types';

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
            <stop offset="5%" stopColor="#C17F59" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#C17F59" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="indieGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#3A3028" />
        <XAxis dataKey="month" tick={{ fill: '#A89A8C', fontSize: 11 }} tickLine={false} interval={5} />
        <YAxis tick={{ fill: '#A89A8C', fontSize: 11 }} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#2A2018', border: '1px solid #3A3028', borderRadius: 8 }}
          labelStyle={{ color: '#F5EFE6' }}
        />
        <Area type="monotone" dataKey="chain" stackId="1" stroke="#C17F59" fill="url(#chainGrad)" name="Chain" />
        <Area type="monotone" dataKey="indie" stackId="1" stroke="#C9A96E" fill="url(#indieGrad)" name="Indie" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
