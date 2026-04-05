'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import type { HotelDashboardRow } from '@/lib/types';

export function QualityRadar({ hotel }: { hotel: HotelDashboardRow }) {
  const data = [
    { dimension: 'Location', value: hotel.ta_subrating_location ?? 0 },
    { dimension: 'Sleep', value: hotel.ta_subrating_sleep ?? 0 },
    { dimension: 'Rooms', value: hotel.ta_subrating_rooms ?? 0 },
    { dimension: 'Service', value: hotel.ta_subrating_service ?? 0 },
    { dimension: 'Value', value: hotel.ta_subrating_value ?? 0 },
    { dimension: 'Cleanliness', value: hotel.ta_subrating_cleanliness ?? 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data}>
        <PolarGrid stroke="#d9cab9" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#5f5247', fontSize: 12 }} />
        <PolarRadiusAxis domain={[3.5, 5]} tickCount={4} tick={{ fill: '#8b7b6d', fontSize: 11 }} />
        <Radar dataKey="value" stroke="#8B4A2B" fill="#C17F59" fillOpacity={0.28} isAnimationActive={false} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
