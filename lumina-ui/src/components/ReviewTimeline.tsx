'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ReviewTimelineRow } from '@/lib/types';

export function ReviewTimeline({ data }: { data: ReviewTimelineRow[] }) {
  const timeline = data.slice(-24).map(row => ({
    month: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    reviews: row.review_count,
    rating: row.avg_rating,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={timeline}>
        <CartesianGrid strokeDasharray="3 3" stroke="#efe4d8" />
        <XAxis dataKey="month" tick={{ fill: '#6b5b4e', fontSize: 12 }} />
        <YAxis yAxisId="left" tick={{ fill: '#6b5b4e', fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" domain={[3.5, 5]} tick={{ fill: '#6b5b4e', fontSize: 12 }} />
        <Tooltip />
        <Area yAxisId="left" type="monotone" dataKey="reviews" stroke="#C17F59" fill="#C17F59" fillOpacity={0.18} isAnimationActive={false} />
        <Area yAxisId="right" type="monotone" dataKey="rating" stroke="#8B4A2B" fill="#8B4A2B" fillOpacity={0.08} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
