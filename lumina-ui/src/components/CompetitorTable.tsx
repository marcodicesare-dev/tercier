import Link from 'next/link';
import type { CompetitorNetworkRow } from '@/lib/types';
import { formatDecimal, formatNumber } from '@/lib/utils';

export function CompetitorTable({
  competitors,
  targetHotelId,
}: {
  competitors: CompetitorNetworkRow[];
  targetHotelId: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-50 text-left text-stone-600">
          <tr>
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Competitor</th>
            <th className="px-4 py-3 font-medium">Distance</th>
            <th className="px-4 py-3 font-medium">Rating</th>
            <th className="px-4 py-3 font-medium">Reviews</th>
            <th className="px-4 py-3 font-medium">Service</th>
            <th className="px-4 py-3 font-medium">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 bg-white">
          {competitors.map(competitor => (
            <tr key={`${competitor.hotel_id}-${competitor.competitor_rank}`}>
              <td className="px-4 py-3 text-stone-500">#{competitor.competitor_rank}</td>
              <td className="px-4 py-3 font-medium text-[var(--lumina-ink)]">
                {competitor.competitor_id ? (
                  <Link href={`/compare?ids=${targetHotelId},${competitor.competitor_id}`} className="hover:text-[var(--deep-terracotta)]">
                    {competitor.competitor_name ?? 'Unknown competitor'}
                  </Link>
                ) : (
                  competitor.competitor_name ?? 'Unknown competitor'
                )}
              </td>
              <td className="px-4 py-3">{formatDecimal(competitor.distance_km, 2)} km</td>
              <td className="px-4 py-3">{formatDecimal(competitor.competitor_rating, 1)}</td>
              <td className="px-4 py-3">{formatNumber(competitor.competitor_reviews)}</td>
              <td className="px-4 py-3">{formatDecimal(competitor.competitor_service_score, 1)}</td>
              <td className="px-4 py-3">{formatDecimal(competitor.competitor_value_score, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
