'use client';

import { Area, Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelChangeRow, HotelMetricSnapshotRow, ReviewTimelineRow } from '@/lib/types';
import { formatDecimal, titleCase } from '@/lib/utils';
import { CHART_THEME } from '@/lib/chart-theme';

export function ReviewTimeline({
  data,
  metricSnapshots = [],
  changes = [],
}: {
  data: ReviewTimelineRow[];
  metricSnapshots?: HotelMetricSnapshotRow[];
  changes?: HotelChangeRow[];
}) {
  const merged = new Map<string, { month: string; reviews?: number; rating?: number | null; hqi?: number | null; tos?: number | null }>();

  for (const row of data.slice(-24)) {
    const key = row.month.slice(0, 7);
    merged.set(key, {
      month: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      reviews: row.review_count,
      rating: row.avg_rating,
      hqi: merged.get(key)?.hqi ?? null,
      tos: merged.get(key)?.tos ?? null,
    });
  }

  for (const snapshot of metricSnapshots.slice(-24)) {
    const key = snapshot.snapshot_date.slice(0, 7);
    const existing = merged.get(key) ?? {
      month: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    };
    merged.set(key, {
      ...existing,
      hqi: snapshot.score_hqi,
      tos: snapshot.score_tos,
    });
  }

  const timeline = [...merged.values()];

  if (!timeline.length) {
    return (
      <EmptyInsight
        title="No timeline yet"
        body="There are no monthly review or metric snapshots available for this property yet."
        detail="Once review history or snapshot deltas are present, this section will show momentum instead of an empty chart."
      />
    );
  }

  return (
    <div className="space-y-5">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={timeline}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
          <XAxis dataKey="month" tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
          <YAxis yAxisId="volume" tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
          <YAxis yAxisId="rating" orientation="right" domain={[0, 5]} tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
          <Tooltip />
          <Bar yAxisId="volume" dataKey="reviews" fill={CHART_THEME.terracotta} radius={[8, 8, 0, 0]} isAnimationActive={false} />
          <Area yAxisId="rating" type="monotone" dataKey="rating" stroke={CHART_THEME.deepTerracotta} fill={CHART_THEME.deepTerracotta} fillOpacity={0.08} isAnimationActive={false} />
          <Line yAxisId="rating" type="monotone" dataKey="hqi" stroke={CHART_THEME.gold} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line yAxisId="rating" type="monotone" dataKey="tos" stroke={CHART_THEME.blue} strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      {changes.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {changes.slice(0, 6).map(change => (
            <div key={change.metric} className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{titleCase(change.metric)}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--lumina-ink)]">
                {formatDecimal(change.current, change.metric.includes('reviews') ? 0 : 2)}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {change.delta != null ? `${change.delta >= 0 ? '+' : ''}${formatDecimal(change.delta, 2)} vs ${formatDecimal(change.previous, 2)}` : 'No delta'}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {change.prev_date ?? '—'} → {change.curr_date ?? '—'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500">No metric snapshot deltas captured yet.</p>
      )}
    </div>
  );
}
