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
            fillOpacity={0.15}
            isAnimationActive={false}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
