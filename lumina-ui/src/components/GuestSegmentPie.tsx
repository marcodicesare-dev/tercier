'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelDashboardRow } from '@/lib/types';
import { CHART_THEME } from '@/lib/chart-theme';

const COLORS = CHART_THEME.palette;

export function GuestSegmentPie({ hotel }: { hotel: HotelDashboardRow }) {
  const data = [
    { name: 'Couples', value: hotel.ta_segment_pct_couples ?? 0 },
    { name: 'Business', value: hotel.ta_segment_pct_business ?? 0 },
    { name: 'Family', value: hotel.ta_segment_pct_family ?? 0 },
    { name: 'Friends', value: hotel.ta_segment_pct_friends ?? 0 },
    { name: 'Solo', value: hotel.ta_segment_pct_solo ?? 0 },
  ].filter(item => item.value > 0);

  if (!data.length) {
    return (
      <EmptyInsight
        title="Guest segments not inferred yet"
        body="This property does not yet have enough review coverage to show a meaningful segment mix."
      />
    );
  }

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
