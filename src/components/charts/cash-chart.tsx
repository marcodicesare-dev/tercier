'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { MonthData } from '@/lib/types';

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
            <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#3A3028" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#A89A8C', fontSize: 11 }}
          tickLine={false}
          interval={5}
        />
        <YAxis
          tick={{ fill: '#A89A8C', fontSize: 11 }}
          tickLine={false}
          tickFormatter={v => `CHF ${(v / 1_000_000).toFixed(1)}M`}
        />
        <Tooltip
          contentStyle={{ background: '#2A2018', border: '1px solid #3A3028', borderRadius: 8 }}
          labelStyle={{ color: '#F5EFE6' }}
          formatter={(v: any) => [`CHF ${Number(v).toLocaleString()}`, 'Cash']}
        />
        <ReferenceLine y={0} stroke="#DC2626" strokeDasharray="5 5" />
        <Area
          type="monotone"
          dataKey="cash"
          stroke="#C9A96E"
          strokeWidth={2}
          fill="url(#cashGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
