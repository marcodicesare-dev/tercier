'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import type { HotelDashboardRow } from '@/lib/types';
import { CHART_THEME } from '@/lib/chart-theme';

const COLORS = [CHART_THEME.deepTerracotta, CHART_THEME.terracotta, CHART_THEME.teal];

export function ComparisonRadar({ hotels }: { hotels: HotelDashboardRow[] }) {
  const dimensions = [
    ['Location', 'ta_subrating_location'],
    ['Sleep', 'ta_subrating_sleep'],
    ['Rooms', 'ta_subrating_rooms'],
    ['Service', 'ta_subrating_service'],
    ['Value', 'ta_subrating_value'],
    ['Cleanliness', 'ta_subrating_cleanliness'],
  ] as const;

  const data = dimensions.map(([label, key]) => {
    const row: Record<string, string | number> = { dimension: label };
    for (const hotel of hotels) {
      row[hotel.name] = (hotel[key] as number | null) ?? 0;
    }
    return row;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {hotels.map((hotel, index) => (
          <div key={hotel.hotel_id} className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="font-medium text-[var(--lumina-ink)]">{hotel.name}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <RadarChart data={data}>
          <PolarGrid stroke={CHART_THEME.grid} />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: CHART_THEME.tick, fontSize: 12 }} />
          <PolarRadiusAxis domain={[3.5, 5]} tick={{ fill: CHART_THEME.tick, fontSize: 11 }} />
          {hotels.map((hotel, index) => (
            <Radar
              key={hotel.hotel_id}
              name={hotel.name}
              dataKey={hotel.name}
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              strokeWidth={2}
              fillOpacity={0.18}
              isAnimationActive={false}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
