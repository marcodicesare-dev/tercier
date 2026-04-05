'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HotelTopicRow } from '@/lib/types';

export function SentimentByTopic({ topics }: { topics: HotelTopicRow[] }) {
  const data = topics.slice(0, 10).map(topic => ({
    topic: topic.aspect.replace(/_/g, ' '),
    positive: topic.positive_count,
    negative: topic.negative_count,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#efe4d8" />
        <XAxis type="number" tick={{ fill: '#6b5b4e', fontSize: 12 }} />
        <YAxis type="category" dataKey="topic" width={120} tick={{ fill: '#6b5b4e', fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="positive" fill="#6b8f71" radius={[0, 6, 6, 0]} isAnimationActive={false} />
        <Bar dataKey="negative" fill="#b85c5c" radius={[0, 6, 6, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
