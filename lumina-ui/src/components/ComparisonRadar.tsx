'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import type { HotelDashboardRow } from '@/lib/types';

const COLORS = ['#8B4A2B', '#C17F59', '#6F8A91'];

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
        <PolarGrid stroke="#d9cab9" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#5f5247', fontSize: 12 }} />
        <PolarRadiusAxis domain={[3.5, 5]} tick={{ fill: '#8b7b6d', fontSize: 11 }} />
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
