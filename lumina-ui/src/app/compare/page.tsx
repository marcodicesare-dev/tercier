import Link from 'next/link';
import { ComparisonRadar } from '@/components/ComparisonRadar';
import type { HotelDashboardRow } from '@/lib/types';
import { getHotelsByIds, getPortfolioHotels } from '@/lib/data';
import { formatDecimal, formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function buildCompareHref(ids: string[]): string {
  return `/compare?ids=${ids.join(',')}`;
}

function suggestedPairs(portfolio: HotelDashboardRow[]): Array<[HotelDashboardRow, HotelDashboardRow]> {
  const ranked = [...portfolio].sort((left, right) => (right.score_hqi ?? -1) - (left.score_hqi ?? -1)).slice(0, 6);
  const pairs: Array<[HotelDashboardRow, HotelDashboardRow]> = [];

  for (let index = 0; index + 1 < ranked.length; index += 2) {
    pairs.push([ranked[index], ranked[index + 1]]);
  }

  return pairs;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const idsParam = typeof params.ids === 'string' ? params.ids : '';
  const ids = idsParam
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .slice(0, 3);

  const [hotels, portfolio] = await Promise.all([
    ids.length ? getHotelsByIds(ids) : Promise.resolve([]),
    getPortfolioHotels(),
  ]);

  const compareHotels = ids.length
    ? ids
        .map(id => hotels.find(hotel => hotel.hotel_id === id))
        .filter((hotel): hotel is NonNullable<typeof hotel> => Boolean(hotel))
    : [];
  const selectedHotel = compareHotels[0] ?? null;
  const secondChoiceSuggestions = portfolio
    .filter(hotel => hotel.hotel_id !== selectedHotel?.hotel_id)
    .slice(0, 6);
  const pairSuggestions = suggestedPairs(portfolio);

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Competitive reading</p>
        <h2 className="mt-2 font-serif text-3xl text-[var(--lumina-ink)]">Side-by-side guest lens</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
          Compare quality fingerprints, ratings, and visibility across the selected properties. Use the compare links from any hotel card or manually build a pair below.
        </p>
      </section>

      {compareHotels.length >= 2 ? (
        <>
          <section className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm">
            <ComparisonRadar hotels={compareHotels} />
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {compareHotels.map(hotel => (
              <article key={hotel.hotel_id} className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{hotel.city} · {hotel.country}</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--lumina-ink)]">{hotel.name}</h3>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-stone-500">TA rating</dt>
                    <dd className="font-medium">{formatDecimal(hotel.ta_rating, 1)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Reviews</dt>
                    <dd className="font-medium">{formatNumber(hotel.total_reviews_db)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Quality</dt>
                    <dd className="font-medium">
                      {hotel.score_hqi != null ? `${Math.round(hotel.score_hqi * 100)}/100` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Opportunity</dt>
                    <dd className="font-medium">{formatDecimal(hotel.score_tos, 2)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Service</dt>
                    <dd className="font-medium">{formatDecimal(hotel.ta_subrating_service, 1)}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Value</dt>
                    <dd className="font-medium">{formatDecimal(hotel.ta_subrating_value, 1)}</dd>
                  </div>
                </dl>
                <Link href={`/hotel/${hotel.hotel_id}`} className="mt-5 inline-flex rounded-full bg-[var(--deep-terracotta)] px-4 py-2 text-sm font-medium text-white">
                  Open full card
                </Link>
              </article>
            ))}
          </section>
        </>
      ) : compareHotels.length === 1 ? (
        <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white/70 p-10 text-center shadow-sm">
          <h3 className="font-serif text-2xl text-[var(--lumina-ink)]">Choose one more hotel to compare with {selectedHotel?.name}</h3>
          <p className="mt-2 text-sm text-stone-600">Start with another portfolio hotel below.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {secondChoiceSuggestions.map(hotel => (
              <Link
                key={hotel.hotel_id}
                href={buildCompareHref([selectedHotel!.hotel_id, hotel.hotel_id])}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-stone-300"
              >
                {hotel.name}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white/70 p-10 text-center shadow-sm">
          <h3 className="font-serif text-2xl text-[var(--lumina-ink)]">Pick at least two hotels to compare</h3>
          <p className="mt-2 text-sm text-stone-600">Try one of these quick pairs:</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {pairSuggestions.map(([left, right]) => (
              <Link
                key={`${left.hotel_id}-${right.hotel_id}`}
                href={buildCompareHref([left.hotel_id, right.hotel_id])}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-stone-300"
              >
                {left.name} vs {right.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
