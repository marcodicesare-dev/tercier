'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { HotelDashboardRow } from '@/lib/types';

const COLORS = ['#8B4A2B', '#C17F59', '#C9A96E', '#A9B388', '#6F8A91'];

export function GuestSegmentPie({ hotel }: { hotel: HotelDashboardRow }) {
  const data = [
    { name: 'Couples', value: hotel.ta_segment_pct_couples ?? 0 },
    { name: 'Business', value: hotel.ta_segment_pct_business ?? 0 },
    { name: 'Family', value: hotel.ta_segment_pct_family ?? 0 },
    { name: 'Friends', value: hotel.ta_segment_pct_friends ?? 0 },
    { name: 'Solo', value: hotel.ta_segment_pct_solo ?? 0 },
  ].filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={98} isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `${(value * 100).toFixed(0)}%`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
