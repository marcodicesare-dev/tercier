#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { HotelUpsert } from '../phase0-enrichment/lib/types.js';
import { logPipelineEnd, logPipelineStart, refreshDashboardViews, supabase } from '../phase0-enrichment/lib/supabase.js';
import { computeDerivedFields } from './compute.js';
import { runDataForSeo } from './sources/dataforseo.js';
import { runDataForSeoGmb } from './sources/dataforseo-gmb.js';
import { runDataForSeoQna } from './sources/dataforseo-qna.js';
import { runDataForSeoReviews } from './sources/dataforseo-reviews.js';
import { runFiber } from './sources/fiber.js';
import { runFirecrawl } from './sources/firecrawl.js';
import { discoverGooglePlaces, runGooglePlaces } from './sources/google-places.js';
import { discoverOsm, runOsm } from './sources/osm.js';
import { runSerpApi } from './sources/serpapi.js';
import { discoverTripadvisor, runTripadvisor } from './sources/tripadvisor.js';
import type {
  CompetitorHotelSeed,
  ExistingHotelRow,
  LangRatingInsert,
  MetricSnapshotInsert,
  PriceSnapshotSeed,
  PipelineContext,
  QnaInsert,
  ReviewInsert,
  SourceResult,
  SourceStatus,
} from './types.js';
import { loadEnvFiles, mergeHotelPartials, parseCliTargets, slugify } from './utils.js';

loadEnvFiles();

interface HotelProcessSummary {
  hotel: string;
  hotelId: string;
  sourceStatuses: SourceStatus[];
  filledColumns: number;
}

const BOOTSTRAP_SOURCE_NAMES = ['tripadvisor', 'google_places', 'osm'] as const;
const DEPENDENT_SOURCE_NAMES = ['dataforseo', 'dataforseo_reviews', 'dataforseo_qna', 'dataforseo_gmb', 'firecrawl', 'fiber', 'serpapi'] as const;

async function findExistingHotel(context: PipelineContext): Promise<ExistingHotelRow | null> {
  if (context.taLocationId) {
    const { data, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, ta_location_id, gp_place_id, website_url, phone, latitude, longitude')
      .eq('ta_location_id', context.taLocationId)
      .limit(1);
    if (error) throw error;
    if (data?.[0]) return data[0] as ExistingHotelRow;
  }

  if (context.gpPlaceId) {
    const { data, error } = await supabase
      .from('hotels')
      .select('id, name, city, country, ta_location_id, gp_place_id, website_url, phone, latitude, longitude')
      .eq('gp_place_id', context.gpPlaceId)
      .limit(1);
    if (error) throw error;
    if (data?.[0]) return data[0] as ExistingHotelRow;
  }

  const { data, error } = await supabase
    .from('hotels')
    .select('id, name, city, country, ta_location_id, gp_place_id, website_url, phone, latitude, longitude')
    .ilike('name', context.input.name)
    .limit(5);
  if (error) throw error;

  const match = (data ?? []).find(row =>
    !context.input.city || (row.city ?? '').toLowerCase() === context.input.city.toLowerCase(),
  );
  return (match as ExistingHotelRow | undefined) ?? null;
}

async function upsertBaseHotel(context: PipelineContext): Promise<string> {
  const existing = await findExistingHotel(context);
  const payload: HotelUpsert = {
    name: context.input.name,
    city: context.input.city ?? existing?.city ?? null,
    country: context.country ?? context.input.country ?? existing?.country ?? null,
    ta_location_id: context.taLocationId ?? existing?.ta_location_id ?? null,
    gp_place_id: context.gpPlaceId ?? existing?.gp_place_id ?? null,
    osm_id: context.osmId ?? null,
    latitude: context.latitude ?? existing?.latitude ?? null,
    longitude: context.longitude ?? existing?.longitude ?? null,
    website_url: context.websiteUrl ?? existing?.website_url ?? null,
    phone: context.phone ?? existing?.phone ?? null,
    enrichment_status: 'hotel_enrichment_running',
    ta_matched_at: context.taLocationId ? new Date().toISOString() : null,
    gp_matched_at: context.gpPlaceId ? new Date().toISOString() : null,
  };

  if (existing) {
    const { error } = await supabase.from('hotels').update(payload).eq('id', existing.id);
    if (error) throw error;
    context.existingHotel = existing;
    return existing.id;
  }

  const { data, error } = await supabase
    .from('hotels')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function replaceAmenities(hotelId: string, amenities: SourceResult['amenities']): Promise<void> {
  await supabase.from('hotel_amenities').delete().eq('hotel_id', hotelId).eq('source', 'tripadvisor');
  if (!amenities?.length) return;

  const rows = amenities.map(amenity => ({
    hotel_id: hotelId,
    source: amenity.source,
    amenity: amenity.amenity,
    category: amenity.category,
  }));
  const { error } = await supabase.from('hotel_amenities').upsert(rows, {
    onConflict: 'hotel_id,source,amenity',
    ignoreDuplicates: false,
  });
  if (error) throw error;
}

async function replaceReviews(hotelId: string, reviews: ReviewInsert[]): Promise<void> {
  if (!reviews.length) return;

  const deduped = new Map<string, ReviewInsert>();
  for (const review of reviews) {
    deduped.set(`${review.source}:${review.source_review_id}`, review);
  }

  const rows = [...deduped.values()].map(review => ({
    hotel_id: hotelId,
    ...review,
  }));

  const BATCH_SIZE = 100;
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const { error } = await supabase.from('hotel_reviews').upsert(batch, {
      onConflict: 'hotel_id,source,source_review_id',
      ignoreDuplicates: false,
    });
    if (error) throw error;
  }
}

async function replaceQna(hotelId: string, qna: QnaInsert[]): Promise<void> {
  await supabase.from('hotel_qna').delete().eq('hotel_id', hotelId).eq('source', 'google');
  if (!qna.length) return;

  const rows = qna.map(row => ({
    hotel_id: hotelId,
    source: row.source,
    source_question_id: row.source_question_id,
    question: row.question,
    question_author: row.question_author,
    question_author_url: row.question_author_url,
    question_date: row.question_date,
    answers: row.answers,
    answer_count: row.answer_count,
    has_answer: row.has_answer,
    has_official_answer: row.has_official_answer,
    latest_answer: row.latest_answer,
    latest_answered_by: row.latest_answered_by,
    latest_answer_date: row.latest_answer_date,
    raw_payload: row.raw_payload,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('hotel_qna').upsert(rows, {
    onConflict: 'hotel_id,source,source_question_id',
    ignoreDuplicates: false,
  });
  if (error) throw error;
}

async function replaceCompetitors(hotelId: string, competitors: SourceResult['competitors']): Promise<void> {
  await supabase.from('hotel_competitors').delete().eq('hotel_id', hotelId);
  if (!competitors?.length) return;

  const rows = competitors.map(competitor => ({
    hotel_id: hotelId,
    competitor_rank: competitor.competitor_rank,
    ta_location_id: competitor.ta_location_id,
    name: competitor.name,
    distance_km: competitor.distance_km,
    bearing: competitor.bearing,
  }));
  const { error } = await supabase.from('hotel_competitors').upsert(rows, {
    onConflict: 'hotel_id,competitor_rank',
    ignoreDuplicates: false,
  });
  if (error) throw error;
}

async function linkCompetitorHotels(
  hotelId: string,
  competitorIdByTaLocationId: Map<string, string>,
): Promise<void> {
  for (const [taLocationId, competitorHotelId] of competitorIdByTaLocationId.entries()) {
    const { error } = await supabase
      .from('hotel_competitors')
      .update({ competitor_hotel_id: competitorHotelId })
      .eq('hotel_id', hotelId)
      .eq('ta_location_id', taLocationId);
    if (error) throw error;
  }
}

async function replaceLangRatings(hotelId: string, langRatings: SourceResult['langRatings']): Promise<void> {
  await supabase.from('hotel_lang_ratings').delete().eq('hotel_id', hotelId);
  if (!langRatings?.length) return;

  const rows = langRatings.map(row => ({
    hotel_id: hotelId,
    lang: row.lang,
    avg_rating: row.avg_rating,
    review_count: row.review_count,
  }));
  const { error } = await supabase.from('hotel_lang_ratings').upsert(rows, {
    onConflict: 'hotel_id,lang',
    ignoreDuplicates: false,
  });
  if (error) throw error;
}

async function upsertLegacySnapshot(hotelId: string, hotel: HotelUpsert): Promise<void> {
  const { error } = await supabase.from('enrichment_snapshots').upsert({
    hotel_id: hotelId,
    snapshot_date: new Date().toISOString().slice(0, 10),
    ta_rating: hotel.ta_rating ?? null,
    ta_num_reviews: hotel.ta_num_reviews ?? null,
    gp_rating: hotel.gp_rating ?? null,
    gp_user_rating_count: hotel.gp_user_rating_count ?? null,
    ta_ranking: hotel.ta_ranking ?? null,
    ta_ranking_out_of: hotel.ta_ranking_out_of ?? null,
    ta_subrating_location: hotel.ta_subrating_location ?? null,
    ta_subrating_sleep: hotel.ta_subrating_sleep ?? null,
    ta_subrating_rooms: hotel.ta_subrating_rooms ?? null,
    ta_subrating_service: hotel.ta_subrating_service ?? null,
    ta_subrating_value: hotel.ta_subrating_value ?? null,
    ta_subrating_cleanliness: hotel.ta_subrating_cleanliness ?? null,
    ta_trip_type_business: hotel.ta_trip_type_business ?? null,
    ta_trip_type_couples: hotel.ta_trip_type_couples ?? null,
    ta_trip_type_solo: hotel.ta_trip_type_solo ?? null,
    ta_trip_type_family: hotel.ta_trip_type_family ?? null,
    ta_trip_type_friends: hotel.ta_trip_type_friends ?? null,
    score_hqi: hotel.score_hqi ?? null,
    score_tos: hotel.score_tos ?? null,
  }, {
    onConflict: 'hotel_id,snapshot_date',
    ignoreDuplicates: false,
  });
  if (error) throw error;
}

function buildMetricSnapshot(hotelId: string, hotel: HotelUpsert): MetricSnapshotInsert {
  return {
    hotel_id: hotelId,
    snapshot_date: new Date().toISOString().slice(0, 10),
    snapshot_source: 'pipeline',
    ta_rating: numberOrNull(hotel.ta_rating),
    ta_num_reviews: numberOrNull(hotel.ta_num_reviews),
    gp_rating: numberOrNull(hotel.gp_rating),
    gp_user_rating_count: numberOrNull(hotel.gp_user_rating_count),
    ta_ranking: numberOrNull(hotel.ta_ranking),
    ta_ranking_out_of: numberOrNull(hotel.ta_ranking_out_of),
    ta_subrating_location: numberOrNull(hotel.ta_subrating_location),
    ta_subrating_sleep: numberOrNull(hotel.ta_subrating_sleep),
    ta_subrating_rooms: numberOrNull(hotel.ta_subrating_rooms),
    ta_subrating_service: numberOrNull(hotel.ta_subrating_service),
    ta_subrating_value: numberOrNull(hotel.ta_subrating_value),
    ta_subrating_cleanliness: numberOrNull(hotel.ta_subrating_cleanliness),
    ta_trip_type_business: numberOrNull(hotel.ta_trip_type_business),
    ta_trip_type_couples: numberOrNull(hotel.ta_trip_type_couples),
    ta_trip_type_solo: numberOrNull(hotel.ta_trip_type_solo),
    ta_trip_type_family: numberOrNull(hotel.ta_trip_type_family),
    ta_trip_type_friends: numberOrNull(hotel.ta_trip_type_friends),
    score_hqi: numberOrNull(hotel.score_hqi),
    score_tos: numberOrNull(hotel.score_tos),
    score_reputation_risk: numberOrNull(hotel.score_reputation_risk),
    ta_owner_response_rate: numberOrNull(hotel.ta_owner_response_rate),
    ta_owner_response_count: numberOrNull(hotel.ta_owner_response_count),
    seo_domain_authority: numberOrNull(hotel.seo_domain_authority),
    seo_monthly_traffic_est: numberOrNull(hotel.seo_monthly_traffic_est),
    ta_rating_vs_compset: numberOrNull(hotel.ta_rating_vs_compset),
    ta_reviews_vs_compset_ratio: numberOrNull(hotel.ta_reviews_vs_compset_ratio),
  };
}

async function upsertMetricSnapshot(hotelId: string, hotel: HotelUpsert): Promise<void> {
  const { error } = await supabase.from('hotel_metric_snapshots').upsert(buildMetricSnapshot(hotelId, hotel), {
    onConflict: 'hotel_id,snapshot_date',
    ignoreDuplicates: false,
  });
  if (error) throw error;
}

async function insertPriceSnapshot(hotelId: string, snapshot: PriceSnapshotSeed | undefined): Promise<void> {
  if (!snapshot) return;
  const { error } = await supabase.from('hotel_price_snapshots').insert({
    hotel_id: hotelId,
    ...snapshot,
  });
  if (error) throw error;
}

function flattenStatuses(results: SourceResult[]): SourceStatus[] {
  return results.flatMap(result => result.statuses);
}

function countFilledColumns(hotel: HotelUpsert): number {
  return Object.values(hotel).filter(value => value !== null && value !== undefined && value !== '').length;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function sourceResultsFromSettled(
  settled: PromiseSettledResult<SourceResult>[],
  sourceNames: readonly string[],
): SourceResult[] {
  return settled.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    const source = sourceNames[index] ?? `source_${index + 1}`;
    return {
      statuses: [{ source, state: 'error', message: result.reason instanceof Error ? result.reason.message : String(result.reason) }],
    };
  });
}

function applyHotelFieldsToContext(context: PipelineContext, hotel: HotelUpsert): void {
  if (typeof hotel.website_url === 'string') context.websiteUrl = hotel.website_url;
  if (typeof hotel.ta_web_url === 'string') context.taWebUrl = hotel.ta_web_url;
  if (typeof hotel.phone === 'string') context.phone = hotel.phone;
  if (typeof hotel.latitude === 'number') context.latitude = hotel.latitude;
  if (typeof hotel.longitude === 'number') context.longitude = hotel.longitude;
  if (typeof hotel.country === 'string') context.country = hotel.country;
  if (typeof hotel.ta_location_id === 'string') context.taLocationId = hotel.ta_location_id;
  if (typeof hotel.ta_num_reviews === 'number') context.taNumReviews = hotel.ta_num_reviews;
  if (typeof hotel.gp_place_id === 'string') context.gpPlaceId = hotel.gp_place_id;
  if (typeof hotel.gp_user_rating_count === 'number') context.gpUserRatingCount = hotel.gp_user_rating_count;
  if (typeof hotel.osm_id === 'string') context.osmId = hotel.osm_id;
}

async function recomputeReviewAggregatesFromDb(hotelId: string): Promise<{
  hotelPartial: HotelUpsert;
  langRatings: LangRatingInsert[];
}> {
  const { data, error } = await supabase
    .from('hotel_reviews')
    .select('source,lang,rating,published_date,has_owner_response,reviewer_location,owner_response_date')
    .eq('hotel_id', hotelId);
  if (error) throw error;

  const reviews = (data ?? []).filter(row => row.source === 'tripadvisor');
  const languageBuckets = new Map<string, number[]>();
  const locationCounts = new Map<string, number>();
  const ownerResponseDelays: number[] = [];

  for (const review of reviews) {
    if (typeof review.rating === 'number') {
      const values = languageBuckets.get(review.lang) ?? [];
      values.push(review.rating);
      languageBuckets.set(review.lang, values);
    }

    if (typeof review.reviewer_location === 'string' && review.reviewer_location.trim()) {
      locationCounts.set(review.reviewer_location, (locationCounts.get(review.reviewer_location) ?? 0) + 1);
    }
  }

  for (const review of reviews) {
    if (review.has_owner_response) {
      const published = typeof review.published_date === 'string' ? review.published_date : review.published_date?.toString?.();
      const ownerDate = typeof review.owner_response_date === 'string' ? review.owner_response_date : review.owner_response_date?.toString?.();
      const hours = published && ownerDate
        ? (new Date(ownerDate).getTime() - new Date(published).getTime()) / 3600000
        : null;
      if (hours != null && Number.isFinite(hours) && hours >= 0) ownerResponseDelays.push(hours);
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

  const mostRecentDate = reviews
    .map(review => {
      const value = review.published_date;
      if (typeof value === 'string') return value;
      if (value instanceof Date) return value.toISOString();
      return null;
    })
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0] ?? null;

  const last90d = reviews.filter(review => {
    const value = review.published_date;
    const date = typeof value === 'string'
      ? new Date(value).getTime()
      : value instanceof Date
        ? value.getTime()
        : NaN;
    return Number.isFinite(date) && (Date.now() - date) <= 90 * 86400000;
  }).length;

  const ownerResponseCount = reviews.filter(review => review.has_owner_response).length;

  return {
    hotelPartial: {
      ta_review_languages: reviewLanguages.length ? reviewLanguages.join(' | ') : null,
      ta_review_language_count: reviewLanguages.length,
      ta_review_most_recent_date: mostRecentDate ? new Date(mostRecentDate).toISOString().slice(0, 10) : null,
      ta_reviews_last_90d_est: last90d,
      ta_owner_response_count: ownerResponseCount,
      ta_owner_response_rate: reviews.length ? ownerResponseCount / reviews.length : null,
      ta_owner_response_avg_delay_hrs: ownerResponseDelays.length
        ? ownerResponseDelays.reduce((sum, value) => sum + value, 0) / ownerResponseDelays.length
        : null,
      ta_reviewer_top_locations: [...locationCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([location]) => location)
        .join(' | ') || null,
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

async function recomputeQnaAggregatesFromDb(hotelId: string): Promise<HotelUpsert> {
  const { data, error } = await supabase
    .from('hotel_qna')
    .select('has_answer')
    .eq('hotel_id', hotelId);
  if (error) throw error;

  const rows = data ?? [];
  const answered = rows.filter(row => row.has_answer).length;
  return {
    qna_count: rows.length,
    qna_unanswered_count: rows.length - answered,
    qna_response_rate: rows.length ? answered / rows.length : null,
  };
}

async function upsertCompetitorHotels(
  parentHotelId: string,
  competitorHotels: CompetitorHotelSeed[],
  dryRun: boolean,
): Promise<void> {
  if (dryRun || !competitorHotels.length) return;

  const competitorIdByTaLocationId = new Map<string, string>();

  for (const competitor of competitorHotels) {
    const { data, error } = await supabase
      .from('hotels')
      .select('id, ta_enriched_at')
      .eq('ta_location_id', competitor.ta_location_id)
      .limit(1);
    if (error) throw error;

    const existing = data?.[0] ?? null;
    if (existing?.id && existing.ta_enriched_at) {
      competitorIdByTaLocationId.set(competitor.ta_location_id, existing.id as string);
      continue;
    }

    const competitorHotel = mergeHotelPartials([
      competitor.hotel,
      computeDerivedFields(competitor.hotel),
    ]);

    let competitorHotelId: string;
    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('hotels')
        .update(competitorHotel)
        .eq('id', existing.id);
      if (updateError) throw updateError;
      competitorHotelId = existing.id as string;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('hotels')
        .insert(competitorHotel)
        .select('id')
        .single();
      if (insertError) throw insertError;
      competitorHotelId = inserted.id as string;
    }

    if (competitor.amenities?.length) {
      await replaceAmenities(competitorHotelId, competitor.amenities);
    }

    competitorIdByTaLocationId.set(competitor.ta_location_id, competitorHotelId);
  }

  await linkCompetitorHotels(parentHotelId, competitorIdByTaLocationId);
}

async function processHotel(context: PipelineContext, dryRun: boolean): Promise<HotelProcessSummary> {
  console.log(`\n=== ${context.input.name}${context.input.city ? ` (${context.input.city})` : ''} ===`);
  console.log('Phase 1: discovery');

  const tripadvisorDiscovery = await discoverTripadvisor(context.input);
  if (tripadvisorDiscovery.ok) {
    context.taLocationId = tripadvisorDiscovery.taLocationId ?? null;
    context.country = context.country ?? context.input.country ?? tripadvisorDiscovery.country ?? null;
  }
  console.log(`  [${tripadvisorDiscovery.ok ? 'OK' : 'SKIP'}] TripAdvisor: ${tripadvisorDiscovery.message}`);

  const googleDiscovery = await discoverGooglePlaces(context);
  if (googleDiscovery.ok) {
    context.gpPlaceId = googleDiscovery.gpPlaceId ?? null;
  }
  console.log(`  [${googleDiscovery.ok ? 'OK' : 'SKIP'}] Google Places: ${googleDiscovery.message}`);

  const osmDiscovery = await discoverOsm(context);
  if (osmDiscovery.ok) {
    context.osmId = osmDiscovery.osmId ?? null;
    context.latitude = osmDiscovery.latitude ?? context.latitude ?? null;
    context.longitude = osmDiscovery.longitude ?? context.longitude ?? null;
  }
  console.log(`  [${osmDiscovery.ok ? 'OK' : 'SKIP'}] OSM: ${osmDiscovery.message}`);

  const hotelId = dryRun ? `dry-run-${slugify(context.input.name)}` : await upsertBaseHotel(context);
  context.hotelId = hotelId;

  console.log('Phase 2: bootstrap enrichment');
  const bootstrapTasks = [
    runTripadvisor(context),
    runGooglePlaces(context),
    runOsm(context),
  ];
  const bootstrapSettled = await Promise.allSettled(bootstrapTasks);
  const bootstrapResults = sourceResultsFromSettled(bootstrapSettled, BOOTSTRAP_SOURCE_NAMES);
  const bootstrapStatuses = flattenStatuses(bootstrapResults);
  for (const status of bootstrapStatuses) {
    console.log(`  [${status.state.toUpperCase()}] ${status.source}: ${status.message}`);
  }

  const bootstrapHotel = mergeHotelPartials(bootstrapResults.map(result => result.hotel));
  applyHotelFieldsToContext(context, bootstrapHotel);

  console.log('Phase 3: dependent enrichment');
  const dependentTasks = [
    runDataForSeo(context),
    runDataForSeoReviews(context),
    runDataForSeoQna(context),
    runDataForSeoGmb(context),
    runFirecrawl(context),
    runFiber(context),
    runSerpApi(context),
  ];
  const dependentSettled = await Promise.allSettled(dependentTasks);
  const dependentResults = sourceResultsFromSettled(dependentSettled, DEPENDENT_SOURCE_NAMES);
  const dependentStatuses = flattenStatuses(dependentResults);
  for (const status of dependentStatuses) {
    console.log(`  [${status.state.toUpperCase()}] ${status.source}: ${status.message}`);
  }

  const sourceResults = [...bootstrapResults, ...dependentResults];
  const statuses = [...bootstrapStatuses, ...dependentStatuses];

  const mergedHotel = mergeHotelPartials(sourceResults.map(result => result.hotel));
  const computed = computeDerivedFields(mergedHotel);
  const finalHotel = mergeHotelPartials([
    {
      name: context.input.name,
      city: context.input.city ?? null,
      country: context.country ?? context.input.country ?? null,
      ta_location_id: context.taLocationId ?? null,
      gp_place_id: context.gpPlaceId ?? null,
      osm_id: context.osmId ?? null,
      website_url: context.websiteUrl ?? null,
      phone: context.phone ?? null,
      latitude: context.latitude ?? null,
      longitude: context.longitude ?? null,
      enrichment_status: 'hotel_enrichment_complete',
    },
    mergedHotel,
    computed,
  ]);

  const amenities = sourceResults.flatMap(result => result.amenities ?? []);
  const reviews = sourceResults.flatMap(result => result.reviews ?? []);
  const qna = sourceResults.flatMap(result => result.qna ?? []);
  const competitors = sourceResults.flatMap(result => result.competitors ?? []);
  const competitorHotels = sourceResults.flatMap(result => result.competitorHotels ?? []);
  const langRatings = sourceResults.flatMap(result => result.langRatings ?? []);
  const priceSnapshot = sourceResults.find(result => result.priceSnapshot)?.priceSnapshot;

  if (!dryRun) {
    const { error } = await supabase.from('hotels').update(finalHotel).eq('id', hotelId);
    if (error) throw error;
    await replaceAmenities(hotelId, amenities);
    await replaceReviews(hotelId, reviews);
    await replaceQna(hotelId, qna);
    await replaceCompetitors(hotelId, competitors);
    const reviewRollups = await recomputeReviewAggregatesFromDb(hotelId);
    const qnaRollups = await recomputeQnaAggregatesFromDb(hotelId);
    await replaceLangRatings(hotelId, reviewRollups.langRatings.length ? reviewRollups.langRatings : langRatings ?? []);
    const rollupHotel = mergeHotelPartials([
      finalHotel,
      reviewRollups.hotelPartial,
      qnaRollups,
      computeDerivedFields(mergeHotelPartials([finalHotel, reviewRollups.hotelPartial, qnaRollups])),
    ]);
    const { error: rollupError } = await supabase.from('hotels').update(rollupHotel).eq('id', hotelId);
    if (rollupError) throw rollupError;
    await upsertCompetitorHotels(hotelId, competitorHotels, dryRun);
    await upsertLegacySnapshot(hotelId, rollupHotel);
    await upsertMetricSnapshot(hotelId, rollupHotel);
    await insertPriceSnapshot(hotelId, priceSnapshot);
  }

  const filledColumns = countFilledColumns(finalHotel);
  console.log(`Phase 4: computed ${filledColumns} non-null hotel columns`);
  console.log(`Phase 5: ${dryRun ? 'dry run complete' : 'saved to Supabase'} (${hotelId})`);

  return {
    hotel: context.input.name,
    hotelId,
    sourceStatuses: statuses,
    filledColumns,
  };
}

async function main(): Promise<void> {
  const { targets, dryRun } = parseCliTargets(process.argv.slice(2));
  const runId = dryRun ? 'dry-run' : await logPipelineStart('enrich_hotel', targets.length);
  const startedAt = Date.now();
  const summaries: HotelProcessSummary[] = [];
  let failures = 0;

  console.log('\n============================================================');
  console.log('  HOTEL INTELLIGENCE ENRICHMENT');
  console.log(`  ${new Date().toISOString()}`);
  console.log(`  ${targets.length} hotels to process${dryRun ? ' (dry run)' : ''}`);
  console.log('============================================================');

  for (const target of targets) {
    try {
      summaries.push(await processHotel({ input: target }, dryRun));
    } catch (error) {
      failures += 1;
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : String(error);
      console.error(`\n[ERROR] ${target.name}: ${message}`);
    }
  }

  const outputDir = resolve(process.cwd(), 'output');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = resolve(outputDir, `hotel-enrichment-summary-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    dryRun,
    hotels: summaries,
  }, null, 2));

  if (!dryRun) {
    await logPipelineEnd(runId, failures > 0 ? 'failed' : 'completed', {
      processed: targets.length,
      matched: targets.length - failures,
      failed: failures,
      error: failures ? `${failures} hotel(s) failed` : undefined,
    });
    await refreshDashboardViews();
  }

  console.log('\n============================================================');
  console.log(`  COMPLETE: ${summaries.length}/${targets.length} hotels processed`);
  console.log(`  Summary: ${outputPath}`);
  console.log(`  Duration: ${Math.round((Date.now() - startedAt) / 1000)}s`);
  console.log('============================================================\n');
}

main().catch(error => {
  console.error('FATAL:', error);
  process.exit(1);
});
