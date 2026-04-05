import { resolve } from 'node:path';
import type { SourceResult } from '../types.js';
import type { PipelineContext } from '../types.js';
import {
  buildDataForSeoLocationParams,
  createDataForSeoTaskAndPoll,
  getDataForSeoNumber,
  getDataForSeoString,
} from './dataforseo-common.js';
import { cleanString, getCachedOrFetch, statusError, statusOk, statusSkipped } from '../utils.js';

const CACHE_GMB = resolve(process.cwd(), 'scripts/enrich-hotel/cache/dataforseo-google-my-business.jsonl');

function normalizePlaceTopics(value: any): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function normalizePeopleAlsoSearch(value: any): Array<Record<string, unknown>> | null {
  if (!Array.isArray(value)) return null;
  const rows = value
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      return {
        title: getDataForSeoString(item.title),
        category: getDataForSeoString(item.category),
        rating: getDataForSeoNumber(item.rating?.value ?? item.rating),
        reviews: getDataForSeoNumber(item.rating?.votes_count ?? item.reviews_count),
        place_id: getDataForSeoString(item.place_id),
      };
    })
    .filter(item => Boolean(item && item.title)) as Array<Record<string, unknown>>;
  return rows.length ? rows : null;
}

function normalizePopularTimes(value: any): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export async function runDataForSeoGmb(context: PipelineContext): Promise<SourceResult> {
  if (!context.input.name) {
    return {
      statuses: [statusSkipped('dataforseo_gmb', 'Missing hotel name')],
    };
  }

  const locationParams = buildDataForSeoLocationParams(context);
  const cacheKey = `${context.input.name}:${JSON.stringify(locationParams)}`;

  try {
    const result = await getCachedOrFetch<any[]>(
      CACHE_GMB,
      cacheKey,
      async () => await createDataForSeoTaskAndPoll(
        '/business_data/google/my_business_info/task_post',
        '/business_data/google/my_business_info/task_get',
        [{
          keyword: context.input.name,
          ...locationParams,
          language_name: 'English',
          priority: 2,
        }],
      ),
    );

    const item = result.data[0] ?? null;
    if (!item) {
      return {
        statuses: [statusSkipped('dataforseo_gmb', 'No Google My Business profile found')],
      };
    }

    return {
      hotel: {
        gmb_is_claimed: typeof item?.is_claimed === 'boolean' ? item.is_claimed : null,
        gmb_popular_times: normalizePopularTimes(item?.popular_times),
        gmb_place_topics: normalizePlaceTopics(item?.place_topics),
        gmb_hotel_star_rating: getDataForSeoNumber(item?.hotel_rating),
        gmb_book_online_url: getDataForSeoString(item?.book_online_url),
        gmb_people_also_search: normalizePeopleAlsoSearch(item?.people_also_search),
        phone: cleanString(getDataForSeoString(item?.phone)) ?? context.phone ?? null,
      },
      statuses: [
        statusOk(
          'dataforseo_gmb',
          `claimed=${typeof item?.is_claimed === 'boolean' ? String(item.is_claimed) : 'n/a'}; topics=${item?.place_topics ? 'yes' : 'no'}`,
          result.cached,
        ),
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('40102') || message.toLowerCase().includes('no search results')) {
      return {
        statuses: [statusSkipped('dataforseo_gmb', 'No Google My Business profile found')],
      };
    }
    return {
      statuses: [statusError('dataforseo_gmb', error)],
    };
  }
}
