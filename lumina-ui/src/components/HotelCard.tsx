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

  return (
    <Link
      href={`/hotel/${hotel.hotel_id}`}
      className="group flex h-full flex-col rounded-[2rem] border border-stone-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
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
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {hotel.ta_price_level ?? '—'}
        </span>
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

      <div className="mt-5 grid grid-cols-[132px_1fr] gap-3">
        <div className="rounded-3xl bg-[var(--warm-cream)] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Quality</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--deep-terracotta)]">{qualityScore(hotel)}</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-600">
            Strongest: <span className="font-medium text-[var(--lumina-ink)]">{titleCase(hotel.ta_subrating_strongest)}</span>
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Weakest: <span className="font-medium text-[var(--lumina-ink)]">{titleCase(hotel.ta_subrating_weakest)}</span>
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Primary: <span className="font-medium text-[var(--lumina-ink)]">{primarySegmentLabel(hotel)}</span>
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Competitors: <span className="font-medium text-[var(--lumina-ink)]">{formatNumber(hotel.competitor_count)} mapped</span>
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-stone-50 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Opportunity</p>
        <p className="mt-2 text-sm leading-6 text-[var(--lumina-ink)]">{insight}</p>
      </div>

      <div className="mt-6 flex items-center justify-end text-sm">
        <span className="text-stone-500 transition group-hover:text-[var(--deep-terracotta)]">Open briefing →</span>
      </div>
    </Link>
  );
}
