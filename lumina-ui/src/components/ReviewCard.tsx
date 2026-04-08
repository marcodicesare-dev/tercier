import Link from 'next/link';
import type { HotelDashboardRow, HotelReviewRow, ReviewTopicMentionRow } from '@/lib/types';
import { getReviewSourceUrl } from '@/lib/source-links';
import { formatDecimal, titleCase } from '@/lib/utils';

function sentimentTone(sentiment: string | null | undefined): string {
  if (sentiment === 'positive') return 'bg-emerald-50 text-emerald-700';
  if (sentiment === 'negative') return 'bg-rose-50 text-rose-700';
  if (sentiment === 'mixed') return 'bg-amber-50 text-amber-700';
  return 'bg-stone-100 text-stone-700';
}

export function ReviewCard({
  hotel,
  review,
  mentions,
  detailHref,
  expanded = false,
}: {
  hotel: Pick<HotelDashboardRow, 'hotel_id' | 'ta_location_id' | 'gp_place_id'>;
  review: HotelReviewRow;
  mentions: ReviewTopicMentionRow[];
  detailHref: string;
  expanded?: boolean;
}) {
  const sourceLink = getReviewSourceUrl(hotel, review);
  const excerpt = expanded ? review.text : review.text?.slice(0, 420);
  const visibleMentions = mentions.slice(0, expanded ? 8 : 3);

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 font-medium ${sentimentTone(review.sentiment)}`}>
              {titleCase(review.sentiment)}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{(review.lang ?? '—').toUpperCase()}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{titleCase(review.source)}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">Rating {formatDecimal(review.rating, 1)}</span>
          </div>
          {review.title ? <h3 className="text-lg font-semibold text-[var(--lumina-ink)]">{review.title}</h3> : null}
          <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
            {[review.reviewer_username, review.reviewer_location, review.published_date?.slice(0, 10)].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={detailHref} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 hover:border-stone-300">
            {expanded ? 'Permalink' : 'Open review'}
          </Link>
          {sourceLink ? (
            <a href={sourceLink.href} target="_blank" rel="noreferrer" className="rounded-full bg-[var(--deep-terracotta)] px-4 py-2 font-medium text-white hover:bg-[var(--lumina-ink)]">
              {sourceLink.label}
            </a>
          ) : null}
        </div>
      </div>

      {excerpt ? (
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-stone-700">
          {excerpt}
          {!expanded && review.text && review.text.length > 420 ? '…' : ''}
        </p>
      ) : null}

      {visibleMentions.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Evidence</p>
          {visibleMentions.map(mention => (
            <div key={mention.id} className="rounded-2xl bg-[var(--warm-cream)] px-4 py-3 text-sm text-stone-700">
              <span className="font-medium text-[var(--lumina-ink)]">{titleCase(mention.aspect)}</span>
              {mention.mention_text ? `: ${mention.mention_text}` : null}
            </div>
          ))}
        </div>
      ) : null}

      {expanded && review.owner_response_text ? (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Owner response</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-700">{review.owner_response_text}</p>
        </div>
      ) : null}
    </article>
  );
}
