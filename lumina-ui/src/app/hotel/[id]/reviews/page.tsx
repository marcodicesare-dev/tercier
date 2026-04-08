import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReviewExplorer } from '@/components/ReviewExplorer';
import { getHotelCard, getHotelReviews } from '@/lib/data';
import { getHotelExternalLinks } from '@/lib/source-links';
import { formatNumber, titleCase } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function parsePositiveInteger(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function buildIntro({
  total,
  lang,
  aspect,
  sentiment,
}: {
  total: number;
  lang?: string;
  aspect?: string;
  sentiment?: string;
}) {
  const filters = [
    lang ? `${titleCase(lang)} language` : null,
    aspect ? `${titleCase(aspect)} mentions` : null,
    sentiment ? `${titleCase(sentiment)} sentiment` : null,
  ].filter(Boolean);

  if (!filters.length) {
    return `Every review in this corpus should be explorable and traceable. You are browsing ${formatNumber(total)} source-backed guest reviews.`;
  }

  return `Showing ${formatNumber(total)} reviews filtered to ${filters.join(' · ')}. Open any review to inspect the quote evidence, then jump to the original source.`;
}

export default async function HotelReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    lang?: string;
    aspect?: string;
    sentiment?: string;
    source?: string;
    page?: string;
    reviewId?: string;
  }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const filters = {
    lang: resolvedSearchParams.lang,
    aspect: resolvedSearchParams.aspect,
    sentiment: resolvedSearchParams.sentiment,
    source: resolvedSearchParams.source,
    page: parsePositiveInteger(resolvedSearchParams.page),
    reviewId: resolvedSearchParams.reviewId,
  };

  const [data, reviewData] = await Promise.all([
    getHotelCard(id),
    getHotelReviews(id, filters),
  ]);
  const hotel = data.hotel;

  if (!hotel) notFound();

  const externalLinks = getHotelExternalLinks(hotel);
  const intro = buildIntro({
    total: reviewData.total,
    lang: filters.lang,
    aspect: filters.aspect,
    sentiment: filters.sentiment,
  });

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              {[hotel.city, hotel.country, hotel.ta_brand].filter(Boolean).join(' · ')}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--lumina-ink)]">{hotel.name}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-700">{intro}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={`/hotel/${hotel.hotel_id}`}
              className="rounded-full bg-[var(--deep-terracotta)] px-4 py-2 font-medium text-white hover:bg-[var(--lumina-ink)]"
            >
              Back to hotel brief
            </Link>
            <Link
              href={`/hotel/${hotel.hotel_id}/reviews`}
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 hover:border-stone-300"
            >
              Clear filters
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {externalLinks.website ? (
            <a
              href={externalLinks.website.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 hover:border-stone-300"
            >
              Website
            </a>
          ) : null}
          {externalLinks.tripadvisor ? (
            <a
              href={externalLinks.tripadvisor.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 hover:border-stone-300"
            >
              TripAdvisor
            </a>
          ) : null}
          {externalLinks.googleMaps ? (
            <a
              href={externalLinks.googleMaps.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 hover:border-stone-300"
            >
              Google Maps
            </a>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <ReviewExplorer
          hotel={hotel}
          data={reviewData}
          languages={data.languages}
          topics={data.topics}
          activeLang={filters.lang}
          activeAspect={filters.aspect}
          activeSentiment={filters.sentiment}
        />
      </section>
    </main>
  );
}
