import Link from 'next/link';
import { HotelCard } from '@/components/HotelCard';
import { PortfolioFilters } from '@/components/PortfolioFilters';
import { getPortfolioHotels } from '@/lib/data';
import type { HotelDashboardRow } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;

function isComplete(hotel: HotelDashboardRow): boolean {
  return hotel.enrichment_status === 'computed' || hotel.enrichment_status?.includes('complete') === true;
}

function filterHotels(
  hotels: HotelDashboardRow[],
  search: string,
  country: string,
  brand: string,
  sort: string,
): HotelDashboardRow[] {
  let rows = hotels.filter(hotel => {
    const matchesSearch =
      !search ||
      [hotel.name, hotel.city, hotel.country, hotel.ta_brand]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(search.toLowerCase()));
    const matchesCountry = !country || hotel.country === country;
    const matchesBrand = !brand || hotel.ta_brand === brand;

    return matchesSearch && matchesCountry && matchesBrand;
  });

  rows = [...rows].sort((left, right) => {
    switch (sort) {
      case 'opportunity':
        return (right.score_tos ?? -1) - (left.score_tos ?? -1);
      case 'reviews':
        return (right.total_reviews_db ?? 0) - (left.total_reviews_db ?? 0);
      case 'rating':
        return (right.ta_rating ?? 0) - (left.ta_rating ?? 0);
      case 'name':
        return left.name.localeCompare(right.name);
      case 'quality':
      default:
        return (right.score_hqi ?? -1) - (left.score_hqi ?? -1);
    }
  });

  return rows;
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = typeof params.search === 'string' ? params.search : '';
  const country = typeof params.country === 'string' ? params.country : '';
  const brand = typeof params.brand === 'string' ? params.brand : '';
  const sort = typeof params.sort === 'string' ? params.sort : 'quality';
  const requestedPage = typeof params.page === 'string' ? Number.parseInt(params.page, 10) : 1;

  const hotels = await getPortfolioHotels();
  const enrichedHotels = hotels.filter(isComplete);
  const filtered = filterHotels(enrichedHotels, search, country, brand, sort);

  const countries = [...new Set(enrichedHotels.map(hotel => hotel.country).filter(Boolean))].sort();
  const brands = [...new Set(enrichedHotels.map(hotel => hotel.ta_brand).filter(Boolean))].sort();
  const reviewCount = enrichedHotels.reduce((sum, hotel) => sum + (hotel.total_reviews_db ?? 0), 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const buildHref = (page: number) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (country) query.set('country', country);
    if (brand) query.set('brand', brand);
    if (sort && sort !== 'quality') query.set('sort', sort);
    if (page > 1) query.set('page', String(page));
    const queryString = query.toString();
    return queryString ? `/?${queryString}` : '/';
  };

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Hotel Intelligence</p>
              <h2 className="mt-2 font-serif text-3xl text-[var(--lumina-ink)]">Portfolio</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {formatNumber(enrichedHotels.length)} hotels · {formatNumber(countries.length)} countries · {formatNumber(reviewCount)} reviews
              </p>
            </div>
            <p className="max-w-xl text-sm leading-6 text-stone-600">
              Scan the portfolio for quality, guest mix, and the biggest commercial gap without seeing pipeline state.
            </p>
          </div>

          <PortfolioFilters
            initialSearch={search}
            initialCountry={country}
            initialBrand={brand}
            initialSort={sort}
            countries={countries.map(item => ({ label: item ?? '', value: item ?? '' }))}
            brands={brands.map(item => ({ label: item ?? '', value: item ?? '' }))}
          />
        </div>
      </section>

      {filtered.length ? (
        <>
          <div className="flex items-center justify-between text-sm text-stone-600">
            <p>
              Showing <span className="font-medium text-[var(--lumina-ink)]">{formatNumber(pageStart + 1)}</span>-
              <span className="font-medium text-[var(--lumina-ink)]">{formatNumber(Math.min(pageStart + PAGE_SIZE, filtered.length))}</span> of{' '}
              <span className="font-medium text-[var(--lumina-ink)]">{formatNumber(filtered.length)}</span> hotels
            </p>
            <p>{search || country || brand ? 'Live filters applied' : 'All enriched hotels'}</p>
          </div>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map(hotel => (
              <HotelCard key={hotel.hotel_id} hotel={hotel} />
            ))}
          </section>

          <section className="flex items-center justify-center gap-4 text-sm text-stone-600">
            {currentPage > 1 ? (
              <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-stone-300" href={buildHref(currentPage - 1)}>
                ← Previous
              </Link>
            ) : (
              <span className="rounded-full border border-stone-100 bg-stone-50 px-4 py-2 text-stone-400">← Previous</span>
            )}
            <span>
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-stone-300" href={buildHref(currentPage + 1)}>
                Next →
              </Link>
            ) : (
              <span className="rounded-full border border-stone-100 bg-stone-50 px-4 py-2 text-stone-400">Next →</span>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-[2rem] border border-dashed border-stone-300 bg-stone-50/70 p-8 text-center shadow-sm">
          <h3 className="font-serif text-2xl text-[var(--lumina-ink)]">No hotels match this view</h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Try widening the search, country, or brand filters.
          </p>
        </section>
      )}
    </main>
  );
}
