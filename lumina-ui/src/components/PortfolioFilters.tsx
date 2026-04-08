'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Option = {
  label: string;
  value: string;
};

export function PortfolioFilters({
  initialSearch,
  initialCountry,
  initialBrand,
  initialSort,
  countries,
  brands,
}: {
  initialSearch: string;
  initialCountry: string;
  initialBrand: string;
  initialSort: string;
  countries: Option[];
  brands: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [country, setCountry] = useState(initialCountry);
  const [brand, setBrand] = useState(initialBrand);
  const [sort, setSort] = useState(initialSort);
  const committedSearch = initialSearch;

  const navigate = (next: { search?: string; country?: string; brand?: string; sort?: string; page?: string }) => {
    const query = new URLSearchParams();
    const values = {
      search: committedSearch,
      country,
      brand,
      sort,
      page: '1',
      ...next,
    };

    for (const [key, value] of Object.entries(values)) {
      if (!value) continue;
      if (key === 'sort' && value === 'quality') continue;
      query.set(key, value);
    }

    const url = query.toString() ? `${pathname}?${query.toString()}` : pathname;
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  };

  return (
    <form
      className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,0.8fr))]"
      onSubmit={event => {
        event.preventDefault();
        navigate({ search, page: '1' });
      }}
    >
      <label className="grid gap-2 text-sm text-stone-600">
        Search hotels, brands, or cities
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-[var(--lumina-ink)] outline-none placeholder:text-stone-400 focus:border-stone-400"
          placeholder="Kempinski, Dubai, family resort..."
        />
      </label>

      <label className="grid gap-2 text-sm text-stone-600">
        Country
        <select
          value={country}
          onChange={event => {
            const value = event.target.value;
            setCountry(value);
            navigate({ country: value, page: '1' });
          }}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-[var(--lumina-ink)]"
        >
          <option value="">All countries</option>
          {countries.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm text-stone-600">
        Brand
        <select
          value={brand}
          onChange={event => {
            const value = event.target.value;
            setBrand(value);
            navigate({ brand: value, page: '1' });
          }}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-[var(--lumina-ink)]"
        >
          <option value="">All brands</option>
          {brands.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm text-stone-600">
        Sort by
        <select
          value={sort}
          onChange={event => {
            const value = event.target.value;
            setSort(value);
            navigate({ sort: value, page: '1' });
          }}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-[var(--lumina-ink)]"
        >
          <option value="quality">Quality</option>
          <option value="opportunity">Opportunity</option>
          <option value="reviews">Review volume</option>
          <option value="rating">Rating</option>
          <option value="name">Name</option>
        </select>
      </label>

      <div className="flex items-end justify-end md:col-span-4">
        <span className="text-xs text-stone-500">
          {isPending ? 'Updating view…' : 'Dropdowns filter instantly. Press Enter to search by name.'}
        </span>
      </div>
    </form>
  );
}
