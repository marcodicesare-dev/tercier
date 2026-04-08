'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelDashboardRow } from '@/lib/types';
import { CHART_THEME } from '@/lib/chart-theme';
import { formatDecimal } from '@/lib/utils';

export function QualityRadar({
  hotel,
  insight,
}: {
  hotel: HotelDashboardRow;
  insight?: string;
}) {
  const data = [
    { dimension: 'Location', value: hotel.ta_subrating_location ?? 0 },
    { dimension: 'Sleep', value: hotel.ta_subrating_sleep ?? 0 },
    { dimension: 'Rooms', value: hotel.ta_subrating_rooms ?? 0 },
    { dimension: 'Service', value: hotel.ta_subrating_service ?? 0 },
    { dimension: 'Value', value: hotel.ta_subrating_value ?? 0 },
    { dimension: 'Cleanliness', value: hotel.ta_subrating_cleanliness ?? 0 },
  ];

  if (!data.some(item => item.value > 0)) {
    return (
      <EmptyInsight
        title="Subratings not available"
        body="TripAdvisor sub-dimension scores have not been captured cleanly for this property yet."
      />
    );
  }

  return (
    <div className="space-y-5">
      {insight ? (
        <p className="text-sm leading-6 text-stone-700">{insight}</p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-[320px] rounded-3xl border border-stone-200 bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke={CHART_THEME.grid} />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
              <PolarRadiusAxis domain={[3.5, 5]} tickCount={4} tick={{ fill: CHART_THEME.tick, fontSize: 11 }} />
              <Radar dataKey="value" stroke={CHART_THEME.deepTerracotta} fill={CHART_THEME.terracotta} fillOpacity={0.28} isAnimationActive={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <div className="space-y-4">
            {data
              .filter(item => item.value > 0)
              .sort((left, right) => right.value - left.value)
              .map(item => (
                <div key={item.dimension}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-stone-600">{item.dimension}</span>
                    <span className="font-medium text-[var(--lumina-ink)]">{formatDecimal(item.value, 1)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-[var(--terracotta)]"
                      style={{ width: `${Math.max(0, Math.min(100, ((item.value - 3.5) / 1.5) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
