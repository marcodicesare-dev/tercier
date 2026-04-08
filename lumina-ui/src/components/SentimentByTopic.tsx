'use client';

import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelTopicRow } from '@/lib/types';
import { CHART_THEME } from '@/lib/chart-theme';
import { titleCase } from '@/lib/utils';

export function SentimentByTopic({
  hotelId,
  topics,
  insight,
}: {
  hotelId: string;
  topics: HotelTopicRow[];
  insight?: string;
}) {
  const data = topics.slice(0, 10).map(topic => ({
    topic: topic.aspect.replace(/_/g, ' '),
    positive: topic.positive_count,
    negative: topic.negative_count,
  }));

  if (!data.length || data.every(topic => (topic.positive ?? 0) === 0 && (topic.negative ?? 0) === 0)) {
    return (
      <EmptyInsight
        title="Topic sentiment not ready"
        body="The topic index is still empty for this hotel, so there is nothing reliable to chart yet."
        detail="Run or finish NLP topic extraction before expecting aspect-level sentiment."
      />
    );
  }

  return (
    <div className="space-y-4">
      {insight ? (
        <p className="text-sm leading-6 text-stone-700">{insight}</p>
      ) : null}
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
          <XAxis type="number" tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
          <YAxis type="category" dataKey="topic" width={120} tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="positive" fill={CHART_THEME.positive} radius={[0, 6, 6, 0]} isAnimationActive={false} />
          <Bar dataKey="negative" fill={CHART_THEME.negative} radius={[0, 6, 6, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2">
        {topics.slice(0, 8).map(topic => (
          <Link
            key={topic.aspect}
            href={`/hotel/${hotelId}/reviews?aspect=${topic.aspect}`}
            className="rounded-full bg-[#efe4d8] px-3 py-1 text-xs font-medium text-[var(--deep-terracotta)] hover:opacity-80"
          >
            {titleCase(topic.aspect)} · {topic.mention_count}
          </Link>
        ))}
      </div>
    </div>
  );
}
