import Link from 'next/link';
import type { HotelDashboardRow } from '@/lib/types';
import { cx, formatDecimal, formatNumber, formatPercent, titleCase } from '@/lib/utils';

function primarySegmentLabel(hotel: HotelDashboardRow): string {
  if (!hotel.ta_primary_segment) return 'Unknown segment';
  const segment = hotel.ta_primary_segment === 'families' ? 'family' : hotel.ta_primary_segment;
  const field = `ta_segment_pct_${segment}` as keyof HotelDashboardRow;
  const value = typeof hotel[field] === 'number' ? (hotel[field] as number) : null;
  return `${titleCase(hotel.ta_primary_segment)} ${formatPercent(value)}`;
}

export function HotelCard({ hotel }: { hotel: HotelDashboardRow }) {
  return (
    <Link
      href={`/hotel/${hotel.hotel_id}`}
      className="group flex h-full flex-col rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{hotel.city ?? 'Unknown city'}</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--lumina-ink)]">{hotel.name}</h3>
          <p className="mt-1 text-sm text-stone-600">
            {[hotel.country, hotel.ta_brand ?? (hotel.flag_is_independent ? 'Independent' : null)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {hotel.ta_price_level ?? '—'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[var(--warm-cream)] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">HQI</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(hotel.score_hqi, 2)}</p>
        </div>
        <div className="rounded-2xl bg-[var(--warm-cream)] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">TOS</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(hotel.score_tos, 2)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#efe4d8] px-3 py-1 text-xs font-medium text-[var(--deep-terracotta)]">
          {primarySegmentLabel(hotel)}
        </span>
        {hotel.flag_tercier_high_priority ? (
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
            High priority
          </span>
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-stone-700">
        <div>
          <dt className="text-stone-500">TripAdvisor</dt>
          <dd className="font-medium">{formatDecimal(hotel.ta_rating, 1)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Google</dt>
          <dd className="font-medium">{formatDecimal(hotel.gp_rating, 1)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Reviews</dt>
          <dd className="font-medium">{formatNumber(hotel.total_reviews_db)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Topics</dt>
          <dd className="font-medium">{formatNumber(hotel.topic_mentions_total)}</dd>
        </div>
      </dl>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span
          className={cx(
            'rounded-full px-3 py-1 font-medium',
            hotel.enrichment_status?.includes('complete')
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700',
          )}
        >
          {hotel.enrichment_status ?? 'unknown'}
        </span>
        <span className="text-stone-500 transition group-hover:text-[var(--deep-terracotta)]">Open card →</span>
      </div>
    </Link>
  );
}
