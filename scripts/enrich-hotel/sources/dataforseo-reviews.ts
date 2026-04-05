import { resolve } from 'node:path';
import type { LangRatingInsert, PipelineContext, ReviewInsert, SourceResult } from '../types.js';
import {
  buildDataForSeoLocationParams,
  createDataForSeoTaskAndPoll,
  getDataForSeoNumber,
  getDataForSeoString,
} from './dataforseo-common.js';
import { cleanString, diffHours, getCachedOrFetch, joinPipe, mean, statusError, statusOk, statusSkipped, toIsoDate } from '../utils.js';

const CACHE_TA_REVIEWS = resolve(process.cwd(), 'scripts/enrich-hotel/cache/dataforseo-ta-reviews.jsonl');
const CACHE_GOOGLE_REVIEWS = resolve(process.cwd(), 'scripts/enrich-hotel/cache/dataforseo-google-reviews.jsonl');
const MAX_DEPTH = 4490;

const LANG_FIELDS = ['en', 'de', 'fr', 'it', 'es', 'ja'] as const;

function extractTaUrlPath(taWebUrl: string): string {
  const url = new URL(taWebUrl);
  return url.pathname;
}


function mapDfseTripadvisorReview(item: any): ReviewInsert | null {
  const reviewId = getDataForSeoString(item?.review_id) ?? getDataForSeoString(item?.id);
  if (!reviewId) return null;

  return {
    source: 'tripadvisor',
    source_review_id: reviewId,
    lang: getDataForSeoString(item?.original_language) ?? getDataForSeoString(item?.language) ?? 'en',
    rating: getDataForSeoNumber(item?.rating),
    title: getDataForSeoString(item?.title),
    text: getDataForSeoString(item?.review_text) ?? getDataForSeoString(item?.text),
    trip_type: null,
    travel_date: getDataForSeoString(item?.date_of_visit),
    published_date: getDataForSeoString(item?.timestamp) ?? getDataForSeoString(item?.time_ago),
    helpful_votes: Math.round(getDataForSeoNumber(item?.helpful_votes) ?? 0),
    reviewer_username: getDataForSeoString(item?.name) ?? getDataForSeoString(item?.user_name),
    reviewer_location: getDataForSeoString(item?.location),
    reviewer_location_id: null,
    has_owner_response: Array.isArray(item?.responses) && item.responses.length > 0,
    owner_response_text: getDataForSeoString(item?.responses?.[0]?.text),
    owner_response_author: getDataForSeoString(item?.responses?.[0]?.title),
    owner_response_date: getDataForSeoString(item?.responses?.[0]?.timestamp),
    owner_response_lang: getDataForSeoString(item?.responses?.[0]?.language),
    subratings: null,
  };
}

function mapDfseGoogleReview(item: any): ReviewInsert | null {
  const reviewId = getDataForSeoString(item?.review_id) ?? getDataForSeoString(item?.review_identifier) ?? getDataForSeoString(item?.cid);
  if (!reviewId) return null;

  return {
    source: 'google',
    source_review_id: reviewId,
    lang: getDataForSeoString(item?.original_language) ?? getDataForSeoString(item?.language_code) ?? getDataForSeoString(item?.language) ?? 'en',
    rating: getDataForSeoNumber(item?.rating),
    title: null,
    text: getDataForSeoString(item?.review_text) ?? getDataForSeoString(item?.text),
    trip_type: null,
    travel_date: null,
    published_date: getDataForSeoString(item?.timestamp),
    helpful_votes: Math.round(getDataForSeoNumber(item?.rating?.votes_count) ?? getDataForSeoNumber(item?.likes_count) ?? 0),
    reviewer_username: getDataForSeoString(item?.profile_name) ?? getDataForSeoString(item?.author_name),
    reviewer_location: null,
    reviewer_location_id: null,
    has_owner_response: Boolean(item?.owner_answer),
    owner_response_text: getDataForSeoString(item?.owner_answer),
    owner_response_author: null,
    owner_response_date: getDataForSeoString(item?.owner_timestamp),
    owner_response_lang: null,
    subratings: null,
  };
}

function dedupeReviews(reviews: ReviewInsert[]): ReviewInsert[] {
  const seen = new Map<string, ReviewInsert>();
  for (const review of reviews) {
    seen.set(`${review.source}:${review.source_review_id}`, review);
  }
  return [...seen.values()];
}

function computeTripadvisorReviewAggregates(reviews: ReviewInsert[]): {
  hotelPartial: SourceResult['hotel'];
  langRatings: LangRatingInsert[];
} {
  const taReviews = reviews.filter(review => review.source === 'tripadvisor');
  const languageBuckets = new Map<string, number[]>();
  const locationCounts = new Map<string, number>();
  const ownerResponseDelays: number[] = [];

  for (const review of taReviews) {
    if (typeof review.rating === 'number') {
      const values = languageBuckets.get(review.lang) ?? [];
      values.push(review.rating);
      languageBuckets.set(review.lang, values);
    }

    if (review.reviewer_location) {
      locationCounts.set(review.reviewer_location, (locationCounts.get(review.reviewer_location) ?? 0) + 1);
    }

    if (review.has_owner_response) {
      const delay = diffHours(review.published_date, review.owner_response_date);
      if (delay != null && delay >= 0) ownerResponseDelays.push(delay);
    }
  }

  const reviewLanguages = [...languageBuckets.keys()].sort();
  const langRatings = reviewLanguages.map(lang => {
    const values = languageBuckets.get(lang) ?? [];
    return {
      lang,
      avg_rating: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
      review_count: values.length,
    };
  });

  const mostRecentDate = taReviews
    .map(review => review.published_date)
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0] ?? null;

  const last90d = taReviews.filter(review => {
    const date = review.published_date ? new Date(review.published_date).getTime() : NaN;
    return Number.isFinite(date) && (Date.now() - date) <= 90 * 86400000;
  }).length;

  const ownerResponseCount = taReviews.filter(review => review.has_owner_response).length;

  return {
    hotelPartial: {
      ta_review_languages: joinPipe(reviewLanguages),
      ta_review_language_count: reviewLanguages.length,
      ta_review_most_recent_date: toIsoDate(mostRecentDate),
      ta_reviews_last_90d_est: last90d,
      ta_owner_response_count: ownerResponseCount,
      ta_owner_response_rate: taReviews.length ? ownerResponseCount / taReviews.length : null,
      ta_owner_response_avg_delay_hrs: ownerResponseDelays.length ? mean(ownerResponseDelays) : null,
      ta_reviewer_top_locations: joinPipe(
        [...locationCounts.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([location]) => location),
      ),
      ta_avg_rating_en: langRatings.find(row => row.lang === 'en')?.avg_rating ?? null,
      ta_avg_rating_de: langRatings.find(row => row.lang === 'de')?.avg_rating ?? null,
      ta_avg_rating_fr: langRatings.find(row => row.lang === 'fr')?.avg_rating ?? null,
      ta_avg_rating_it: langRatings.find(row => row.lang === 'it')?.avg_rating ?? null,
      ta_avg_rating_es: langRatings.find(row => row.lang === 'es')?.avg_rating ?? null,
      ta_avg_rating_ja: langRatings.find(row => row.lang === 'ja')?.avg_rating ?? null,
    },
    langRatings,
  };
}

async function fetchTripadvisorReviews(context: PipelineContext): Promise<{ reviews: ReviewInsert[]; cached: boolean }> {
  if (!context.taWebUrl) {
    return { reviews: [], cached: true };
  }

  const urlPath = extractTaUrlPath(context.taWebUrl);
  const depth = Math.min(context.taNumReviews ?? MAX_DEPTH, MAX_DEPTH);
  const cacheKey = `${context.taLocationId ?? urlPath}:${depth}`;

  const result = await getCachedOrFetch<any[]>(
    CACHE_TA_REVIEWS,
    cacheKey,
    async () => await createDataForSeoTaskAndPoll(
      '/business_data/tripadvisor/reviews/task_post',
      '/business_data/tripadvisor/reviews/task_get',
      [{
        url_path: urlPath,
        depth,
        sort_by: 'most_recent',
        priority: 2,
      }],
    ),
  );

  const reviews = result.data
    .map(mapDfseTripadvisorReview)
    .filter((review): review is ReviewInsert => Boolean(review));

  return { reviews, cached: result.cached };
}

async function fetchGoogleReviews(context: PipelineContext): Promise<{ reviews: ReviewInsert[]; cached: boolean }> {
  if (!context.gpPlaceId) {
    return { reviews: [], cached: true };
  }

  const depth = Math.min(context.gpUserRatingCount ?? MAX_DEPTH, MAX_DEPTH);
  const cacheKey = `${context.gpPlaceId}:${depth}`;
  const locationParams = buildDataForSeoLocationParams(context);

  const result = await getCachedOrFetch<any[]>(
    CACHE_GOOGLE_REVIEWS,
    cacheKey,
    async () => {
      try {
        return await createDataForSeoTaskAndPoll(
          '/business_data/google/reviews/task_post',
          '/business_data/google/reviews/task_get',
          [{
            place_id: context.gpPlaceId,
            ...locationParams,
            language_name: 'English',
            depth,
            sort_by: 'newest',
            priority: 2,
          }],
        );
      } catch {
        return await createDataForSeoTaskAndPoll(
          '/business_data/google/reviews/task_post',
          '/business_data/google/reviews/task_get',
          [{
            keyword: context.input.name,
            ...locationParams,
            language_name: 'English',
            depth,
            sort_by: 'newest',
            priority: 2,
          }],
        );
      }
    },
  );

  const reviews = result.data
    .map(mapDfseGoogleReview)
    .filter((review): review is ReviewInsert => Boolean(review));

  return { reviews, cached: result.cached };
}

export async function runDataForSeoReviews(context: PipelineContext): Promise<SourceResult> {
  if (!context.taWebUrl && !context.gpPlaceId) {
    return {
      statuses: [statusSkipped('dataforseo_reviews', 'No TripAdvisor web URL or Google Place ID')],
    };
  }

  try {
    const [taResult, googleResult] = await Promise.all([
      fetchTripadvisorReviews(context),
      fetchGoogleReviews(context),
    ]);

    const reviews = dedupeReviews([...taResult.reviews, ...googleResult.reviews]);
    const taAggregate = computeTripadvisorReviewAggregates(reviews);

    return {
      hotel: taAggregate.hotelPartial,
      reviews,
      langRatings: taAggregate.langRatings,
      statuses: [
        statusOk(
          'dataforseo_reviews',
          `tripadvisor=${taResult.reviews.length}; google=${googleResult.reviews.length}`,
          taResult.cached && googleResult.cached,
        ),
      ],
    };
  } catch (error) {
    return {
      statuses: [statusError('dataforseo_reviews', error)],
    };
  }
}
