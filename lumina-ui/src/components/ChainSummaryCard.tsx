import type { ChainIntelligenceRow, HotelDashboardRow } from '@/lib/types';
import type { ChainSummary } from '@/lib/insights';
import { formatDecimal, formatNumber } from '@/lib/utils';
import { InsightSentence } from '@/components/InsightSentence';

export function ChainSummaryCard({
  hotels,
  summary,
  summaryRow,
}: {
  hotels: HotelDashboardRow[];
  summary: ChainSummary;
  summaryRow: ChainIntelligenceRow | null;
}) {
  const ratedHotels = hotels.filter(hotel => typeof hotel.ta_rating === 'number');
  const avgRating = summaryRow?.avg_rating ?? (
    ratedHotels.length
      ? ratedHotels.reduce((sum, hotel) => sum + (hotel.ta_rating ?? 0), 0) / ratedHotels.length
      : null
  );
  const scoredHotels = hotels.filter(hotel =>
    typeof hotel.computed_opportunity_score === 'number' || typeof hotel.score_tos === 'number',
  );
  const avgOpportunity = summaryRow?.avg_opportunity_score ?? (
    scoredHotels.length
      ? scoredHotels.reduce((sum, hotel) => sum + (hotel.computed_opportunity_score ?? hotel.score_tos ?? 0), 0) / scoredHotels.length
      : null
  );
  const countryCount = summaryRow?.country_count ?? new Set(hotels.map(hotel => hotel.country).filter(Boolean)).size;
  const evidenceReviews = summaryRow?.total_reviews_db ?? hotels.reduce((sum, hotel) => sum + (hotel.total_reviews_db ?? 0), 0);
  const processedCoverage = summaryRow?.avg_processed_review_coverage ?? null;
  const largeLanguageGapHotels = summaryRow?.hotels_with_large_language_gap ?? hotels.filter(hotel => (hotel.computed_language_gap ?? 0) >= 3).length;
  const directAdvantageHotels = summaryRow?.direct_rate_advantage_hotels ?? hotels.filter(hotel =>
    typeof hotel.price_direct === 'number' &&
    typeof hotel.price_lowest_ota === 'number' &&
    hotel.price_direct < hotel.price_lowest_ota,
  ).length;

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-stone-600">Chain view</p>
      <h2 className="mt-2 font-serif text-3xl text-[var(--lumina-ink)]">Portfolio intelligence</h2>
      <InsightSentence className="mt-4">{summary.headline}</InsightSentence>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-[var(--warm-cream)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Evidence reviews</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--deep-terracotta)]">{formatNumber(evidenceReviews)}</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Avg rating</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(avgRating, 2)}</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Proof coverage</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--deep-terracotta)]">
            {processedCoverage != null ? `${Math.round(processedCoverage * 100)}%` : '—'}
          </p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Avg opportunity</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--deep-terracotta)]">
            {avgOpportunity != null ? `${Math.round(avgOpportunity * 100)}/100` : '—'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-[var(--warm-cream)] px-3 py-1 text-[var(--deep-terracotta)]">
          {formatNumber(countryCount)} countries
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
          {formatNumber(largeLanguageGapHotels)} hotels with material language gaps
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
          {formatNumber(directAdvantageHotels)} hotels already cheaper direct than OTA
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Strengths</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
            {summary.strengths.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Weaknesses</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
            {summary.weaknesses.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Patterns</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
            {summary.patterns.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
