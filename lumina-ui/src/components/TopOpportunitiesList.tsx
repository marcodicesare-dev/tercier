import Link from 'next/link';
import type { HotelDashboardRow } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

export function TopOpportunitiesList({
  rows,
}: {
  rows: Array<{
    hotel: HotelDashboardRow;
    reason: string;
  }>;
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Ranked list</p>
      <h2 className="mt-2 font-serif text-3xl text-[var(--lumina-ink)]">Top opportunities</h2>
      <div className="mt-5 grid gap-3">
        {rows.map(({ hotel, reason }, index) => (
          <Link
            key={hotel.hotel_id}
            href={`/hotel/${hotel.hotel_id}`}
            className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--warm-cream)] text-sm font-semibold text-[var(--deep-terracotta)]">
                #{index + 1}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                  {[hotel.city, hotel.country, hotel.ta_brand].filter(Boolean).join(' · ')}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--lumina-ink)]">{hotel.name}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">{reason}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-stone-600">
              <div className="rounded-2xl bg-stone-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-stone-500">Opportunity</p>
                <p className="mt-1 font-medium text-[var(--lumina-ink)]">
                  {hotel.score_tos != null ? `${Math.round(hotel.score_tos * 100)}/100` : '—'}
                </p>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-stone-500">Reviews</p>
                <p className="mt-1 font-medium text-[var(--lumina-ink)]">{formatNumber(hotel.total_reviews_db)}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-stone-500">Languages</p>
                <p className="mt-1 font-medium text-[var(--lumina-ink)]">{formatNumber(hotel.ta_review_language_count)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
