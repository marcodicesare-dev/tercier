import Link from 'next/link';
import type { HotelDashboardRow } from '@/lib/types';
import { getCardOpportunityInsight } from '@/lib/insights';
import { formatDecimal, formatNumber, formatPercent, titleCase } from '@/lib/utils';

function primarySegmentLabel(hotel: HotelDashboardRow): string {
  if (!hotel.ta_primary_segment) return 'Unknown segment';
  const segment = hotel.ta_primary_segment === 'families' ? 'family' : hotel.ta_primary_segment;
  const field = `ta_segment_pct_${segment}` as keyof HotelDashboardRow;
  const value = typeof hotel[field] === 'number' ? (hotel[field] as number) : null;
  return `${titleCase(hotel.ta_primary_segment)} ${formatPercent(value)}`;
}

function qualityScore(hotel: HotelDashboardRow): string {
  if (hotel.score_hqi == null) return '—';
  return `${Math.round(hotel.score_hqi * 100)}/100`;
}

export function HotelCard({ hotel }: { hotel: HotelDashboardRow }) {
  const insight = getCardOpportunityInsight(hotel);
  const metricFacts = [
    hotel.ta_subrating_strongest ? `Strongest: ${titleCase(hotel.ta_subrating_strongest)}` : null,
    hotel.ta_subrating_weakest ? `Weakest: ${titleCase(hotel.ta_subrating_weakest)}` : null,
    hotel.ta_primary_segment ? `Primary: ${primarySegmentLabel(hotel)}` : null,
    hotel.competitor_count ? `Competitors: ${formatNumber(hotel.competitor_count)} mapped` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <Link
      href={`/hotel/${hotel.hotel_id}`}
      className="group flex h-full flex-col rounded-[2rem] border border-stone-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-600">
            {[hotel.ta_brand ?? (hotel.flag_is_independent ? 'Independent' : null), hotel.city]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--lumina-ink)]">{hotel.name}</h3>
          {hotel.gp_editorial_summary ? (
            <p className="mt-2 max-h-12 overflow-hidden text-sm leading-6 text-stone-600">
              {hotel.gp_editorial_summary}
            </p>
          ) : null}
        </div>
        {hotel.ta_price_level ? (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {hotel.ta_price_level}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-700">
        <span>TA {formatDecimal(hotel.ta_rating, 1)}</span>
        <span className="text-stone-300">·</span>
        <span>Google {formatDecimal(hotel.gp_rating, 1)}</span>
        <span className="text-stone-300">·</span>
        <span>{formatNumber(hotel.total_reviews_db)} reviews</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-600">
        {hotel.ta_ranking != null && hotel.ta_ranking_out_of != null ? (
          <span>
            #{formatNumber(hotel.ta_ranking)} of {formatNumber(hotel.ta_ranking_out_of)} in {hotel.ta_ranking_geo ?? hotel.city ?? 'market'}
          </span>
        ) : null}
        {hotel.ta_ranking != null && hotel.ta_review_language_count != null ? <span className="text-stone-300">·</span> : null}
        {hotel.ta_review_language_count != null ? <span>{formatNumber(hotel.ta_review_language_count)} languages</span> : null}
      </div>

      <div className="mt-5 rounded-3xl border border-[#e0d2bf] bg-[var(--warm-cream)] px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Top opportunity</p>
          {hotel.score_tos != null ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--deep-terracotta)]">
              Opportunity {Math.round(hotel.score_tos * 100)}/100
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-base leading-7 text-[var(--lumina-ink)]">{insight}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[132px_1fr]">
        <div className="rounded-3xl bg-white p-4 ring-1 ring-stone-200">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Quality</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--deep-terracotta)]">{qualityScore(hotel)}</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {metricFacts.map(item => (
              <span key={item} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-stone-600">
            TA {formatDecimal(hotel.ta_rating, 1)} · Google {formatDecimal(hotel.gp_rating, 1)} · {formatNumber(hotel.total_reviews_db)} reviews
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end text-sm">
        <span className="text-stone-500 transition group-hover:text-[var(--deep-terracotta)]">Open briefing →</span>
      </div>
    </Link>
  );
}
