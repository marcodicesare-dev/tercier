import Link from 'next/link';
import { EmptyInsight } from '@/components/EmptyInsight';
import type { CompetitorNetworkRow, HotelDashboardRow } from '@/lib/types';
import { formatDecimal, formatNumber } from '@/lib/utils';

export function CompetitorTable({
  competitors,
  targetHotelId,
  hotel,
  insight,
}: {
  competitors: CompetitorNetworkRow[];
  targetHotelId: string;
  hotel?: HotelDashboardRow;
  insight?: string;
}) {
  const summaryRating = hotel?.ta_compset_avg_rating ?? null;
  const summaryReviews = hotel?.ta_compset_avg_reviews ?? null;
  const informativeCompetitors = competitors
    .filter(competitor =>
      competitor.competitor_rating != null ||
      competitor.competitor_reviews != null ||
      competitor.competitor_service_score != null ||
      competitor.competitor_value_score != null,
    )
    .slice(0, 8);

  if (!hotel && !informativeCompetitors.length) {
    return (
      <EmptyInsight
        title="No comparable neighbors yet"
        body="Nearby competitors were mapped, but there is not enough scored competitor data to show a useful comparison table."
      />
    );
  }

  return (
    <div className="space-y-4">
      {insight ? (
        <p className="text-sm leading-6 text-stone-700">{insight}</p>
      ) : null}
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
            {hotel ? (
              <tr className="bg-[var(--warm-cream)]">
                <td className="px-4 py-3 font-medium text-[var(--lumina-ink)]">You vs avg</td>
                <td className="px-4 py-3 font-medium text-[var(--lumina-ink)]">{hotel.name}</td>
                <td className="px-4 py-3 text-stone-500">Compset benchmark</td>
                <td className="px-4 py-3">{formatDecimal(hotel.ta_rating, 1)} vs {formatDecimal(summaryRating, 1)}</td>
                <td className="px-4 py-3">{formatNumber(hotel.ta_num_reviews)} vs {formatNumber(summaryReviews)}</td>
                <td className="px-4 py-3">{formatDecimal(hotel.ta_subrating_service, 1)}</td>
                <td className="px-4 py-3">{formatDecimal(hotel.ta_subrating_value, 1)}</td>
              </tr>
            ) : null}
            {informativeCompetitors.map(competitor => (
              <tr key={`${competitor.hotel_id}-${competitor.competitor_rank}`}>
                <td className="px-4 py-3 text-stone-500">#{competitor.competitor_rank}</td>
                <td className="px-4 py-3 font-medium text-[var(--lumina-ink)]">
                  {competitor.competitor_id ? (
                    <Link href={`/hotel/${competitor.competitor_id}`} className="hover:text-[var(--deep-terracotta)]">
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
        {informativeCompetitors.length < competitors.length ? (
          <div className="border-t border-stone-200 bg-stone-50 px-4 py-3 text-xs uppercase tracking-[0.16em] text-stone-500">
            Showing {informativeCompetitors.length} scored competitors out of {competitors.length} mapped nearby properties.
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {informativeCompetitors
          .filter(competitor => competitor.competitor_id)
          .slice(0, 4)
          .map(competitor => (
            <Link
              key={`${competitor.hotel_id}-${competitor.competitor_rank}-compare`}
              href={`/compare?ids=${targetHotelId},${competitor.competitor_id}`}
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 hover:border-stone-300"
            >
              Compare vs {competitor.competitor_name}
            </Link>
          ))}
      </div>
    </div>
  );
}
