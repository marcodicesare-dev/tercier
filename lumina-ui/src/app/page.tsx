import { HotelCard } from '@/components/HotelCard';
import { getPortfolioHotels } from '@/lib/data';
import type { HotelDashboardRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

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
      case 'tos':
        return (right.score_tos ?? -1) - (left.score_tos ?? -1);
      case 'reviews':
        return (right.total_reviews_db ?? 0) - (left.total_reviews_db ?? 0);
      case 'rating':
        return (right.ta_rating ?? 0) - (left.ta_rating ?? 0);
      case 'name':
        return left.name.localeCompare(right.name);
      case 'hqi':
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
  const sort = typeof params.sort === 'string' ? params.sort : 'hqi';

  const hotels = await getPortfolioHotels();
  const filtered = filterHotels(hotels, search, country, brand, sort);

  const countries = [...new Set(hotels.map(hotel => hotel.country).filter(Boolean))].sort();
  const brands = [...new Set(hotels.map(hotel => hotel.ta_brand).filter(Boolean))].sort();

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Portfolio</p>
            <h2 className="mt-2 font-serif text-3xl text-[var(--lumina-ink)]">All enriched hotels, ordered for action</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              This is the sales and product proof layer: every hotel is pre-populated with live intelligence before any onboarding call.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--warm-cream)] px-5 py-4 text-sm text-stone-700">
            <span className="font-semibold text-[var(--lumina-ink)]">{filtered.length}</span> visible hotels
          </div>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm text-stone-600">
            Search
            <input
              type="text"
              name="search"
              defaultValue={search}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none ring-0 placeholder:text-stone-400 focus:border-stone-400"
              placeholder="Kempinski, Budapest, Bali..."
            />
          </label>
          <label className="grid gap-2 text-sm text-stone-600">
            Country
            <select name="country" defaultValue={country} className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
              <option value="">All countries</option>
              {countries.map(item => (
                <option key={item} value={item ?? ''}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-stone-600">
            Brand
            <select name="brand" defaultValue={brand} className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
              <option value="">All brands</option>
              {brands.map(item => (
                <option key={item} value={item ?? ''}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-stone-600">
            Sort
            <select name="sort" defaultValue={sort} className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
              <option value="hqi">HQI</option>
              <option value="tos">Opportunity</option>
              <option value="reviews">Review volume</option>
              <option value="rating">Rating</option>
              <option value="name">Name</option>
            </select>
          </label>
          <div className="md:col-span-2 xl:col-span-4">
            <button type="submit" className="rounded-full bg-[var(--deep-terracotta)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--lumina-ink)]">
              Apply filters
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(hotel => (
          <HotelCard key={hotel.hotel_id} hotel={hotel} />
        ))}
      </section>
    </main>
  );
}
