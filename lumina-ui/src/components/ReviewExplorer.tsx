import Link from 'next/link';
import type {
  HotelDashboardRow,
  HotelReviewRow,
  LanguageBreakdownRow,
  ReviewExplorerData,
  ReviewTopicMentionRow,
  HotelTopicRow,
} from '@/lib/types';
import { formatNumber, titleCase } from '@/lib/utils';
import { ReviewCard } from '@/components/ReviewCard';
import { InsightSentence } from '@/components/InsightSentence';

function buildHref(
  hotelId: string,
  params: Record<string, string | number | undefined | null>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix ? `/hotel/${hotelId}/reviews?${suffix}` : `/hotel/${hotelId}/reviews`;
}

function groupMentions(mentions: ReviewTopicMentionRow[]): Map<string, ReviewTopicMentionRow[]> {
  const grouped = new Map<string, ReviewTopicMentionRow[]>();
  for (const mention of mentions) {
    if (!grouped.has(mention.review_id)) grouped.set(mention.review_id, []);
    grouped.get(mention.review_id)?.push(mention);
  }
  return grouped;
}

export function ReviewExplorer({
  hotel,
  data,
  languages,
  topics,
  activeLang,
  activeAspect,
  activeSentiment,
  intro,
}: {
  hotel: Pick<HotelDashboardRow, 'hotel_id' | 'name' | 'ta_location_id' | 'gp_place_id'>;
  data: ReviewExplorerData;
  languages: LanguageBreakdownRow[];
  topics: HotelTopicRow[];
  activeLang?: string;
  activeAspect?: string;
  activeSentiment?: string;
  intro?: string;
}) {
  const mentionMap = groupMentions(data.topicMentions);
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const listReviews = data.selectedReview
    ? data.reviews.filter(review => review.id !== data.selectedReview?.id)
    : data.reviews;

  return (
    <div className="space-y-6">
      {intro ? <InsightSentence>{intro}</InsightSentence> : null}

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Filter by language</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={buildHref(hotel.hotel_id, { aspect: activeAspect, sentiment: activeSentiment })} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700">
              All languages
            </Link>
            {languages.slice(0, 12).map(language => (
              <Link
                key={language.lang}
                href={buildHref(hotel.hotel_id, { lang: language.lang, aspect: activeAspect, sentiment: activeSentiment })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${activeLang === language.lang ? 'bg-[var(--deep-terracotta)] text-white' : 'bg-stone-100 text-stone-700'}`}
              >
                {language.lang.toUpperCase()} · {formatNumber(language.review_count)}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Filter by topic</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={buildHref(hotel.hotel_id, { lang: activeLang, sentiment: activeSentiment })} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700">
              All topics
            </Link>
            {topics.slice(0, 10).map(topic => (
              <Link
                key={topic.aspect}
                href={buildHref(hotel.hotel_id, { lang: activeLang, aspect: topic.aspect, sentiment: activeSentiment })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${activeAspect === topic.aspect ? 'bg-[var(--deep-terracotta)] text-white' : 'bg-[#efe4d8] text-[var(--deep-terracotta)]'}`}
              >
                {titleCase(topic.aspect)} · {formatNumber(topic.mention_count)}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={buildHref(hotel.hotel_id, { lang: activeLang, aspect: activeAspect })}
              className={`inline-flex min-h-7 items-center justify-center rounded-full border px-3 py-1 text-xs font-medium ${
                !activeSentiment
                  ? 'border-[var(--lumina-ink)] bg-[var(--lumina-ink)] text-white shadow-sm'
                  : 'border-stone-200 bg-stone-100 text-stone-700'
              }`}
              style={!activeSentiment ? { color: '#ffffff' } : undefined}
            >
              All sentiment
            </Link>
            {['positive', 'negative', 'mixed'].map(sentiment => (
              <Link
                key={sentiment}
                href={buildHref(hotel.hotel_id, { lang: activeLang, aspect: activeAspect, sentiment })}
                className={`inline-flex min-h-7 items-center justify-center rounded-full border px-3 py-1 text-xs font-medium ${
                  activeSentiment === sentiment
                    ? 'border-[var(--lumina-ink)] bg-[var(--lumina-ink)] text-white shadow-sm'
                    : 'border-stone-200 bg-stone-100 text-stone-700'
                }`}
                style={activeSentiment === sentiment ? { color: '#ffffff' } : undefined}
              >
                {titleCase(sentiment)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {data.selectedReview ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Selected review</p>
          <ReviewCard
            hotel={hotel}
            review={data.selectedReview}
            mentions={mentionMap.get(data.selectedReview.id) ?? []}
            detailHref={buildHref(hotel.hotel_id, { lang: activeLang, aspect: activeAspect, sentiment: activeSentiment, reviewId: data.selectedReview.id })}
            expanded
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm text-stone-600">
        <p>
          Browsing <span className="font-medium text-[var(--lumina-ink)]">{formatNumber(data.total)}</span> reviews for {hotel.name}
        </p>
        <p>Page {data.page} of {totalPages}</p>
      </div>

      <div className="grid gap-4">
        {listReviews.length ? (
          listReviews.map((review: HotelReviewRow) => (
            <ReviewCard
              key={review.id}
              hotel={hotel}
              review={review}
              mentions={mentionMap.get(review.id) ?? []}
              detailHref={buildHref(hotel.hotel_id, { lang: activeLang, aspect: activeAspect, sentiment: activeSentiment, page: data.page, reviewId: review.id })}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-white p-6 text-sm text-stone-700">
            No reviews match this filter path. Clear the topic, language, or sentiment filter to reopen the full corpus.
            <div className="mt-4">
              <Link
                href={buildHref(hotel.hotel_id, {})}
                className="rounded-full bg-[var(--deep-terracotta)] px-4 py-2 font-medium text-white hover:bg-[var(--lumina-ink)]"
              >
                Show all reviews
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-stone-600">
        {data.page > 1 ? (
          <Link
            href={buildHref(hotel.hotel_id, { lang: activeLang, aspect: activeAspect, sentiment: activeSentiment, page: data.page - 1, reviewId: data.selectedReview?.id })}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-stone-300"
          >
            ← Previous
          </Link>
        ) : (
          <span className="rounded-full border border-stone-100 bg-stone-50 px-4 py-2 text-stone-400">← Previous</span>
        )}
        {data.page < totalPages ? (
          <Link
            href={buildHref(hotel.hotel_id, { lang: activeLang, aspect: activeAspect, sentiment: activeSentiment, page: data.page + 1, reviewId: data.selectedReview?.id })}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 hover:border-stone-300"
          >
            Next →
          </Link>
        ) : (
          <span className="rounded-full border border-stone-100 bg-stone-50 px-4 py-2 text-stone-400">Next →</span>
        )}
      </div>
    </div>
  );
}
