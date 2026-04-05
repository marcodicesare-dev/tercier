import { resolve } from 'node:path';
import type { TADetailResponse, TAReview, TAReviewsResponse, TASearchResponse } from '../../phase0-enrichment/lib/types.js';
import { searchHotel, getDetails, getReviews, nearbySearch } from '../../phase0-enrichment/lib/tripadvisor-client.js';
import { nameSimilarity } from '../../phase0-enrichment/lib/matching.js';
import { ConcurrencyLimiter } from '../../phase0-enrichment/lib/concurrency-limiter.js';
import type { AmenityInsert, CompetitorHotelSeed, CompetitorInsert, DiscoveryResult, LangRatingInsert, PipelineContext, ReviewInsert, SourceResult } from '../types.js';
import { cleanString, diffHours, getCachedOrFetch, joinPipe, mean, statusError, statusOk, statusSkipped, sum, toIsoDate, uniqueStrings } from '../utils.js';

const CACHE_SEARCH = resolve(process.cwd(), 'scripts/enrich-hotel/cache/tripadvisor-search.jsonl');
const CACHE_DETAILS = resolve(process.cwd(), 'scripts/enrich-hotel/cache/tripadvisor-details.jsonl');
const CACHE_REVIEWS = resolve(process.cwd(), 'scripts/enrich-hotel/cache/tripadvisor-reviews.jsonl');
const CACHE_NEARBY = resolve(process.cwd(), 'scripts/enrich-hotel/cache/tripadvisor-nearby.jsonl');

const REVIEW_LANGUAGES = ['en', 'de', 'fr', 'it', 'es', 'ja', 'ru', 'zh', 'ko', 'pt', 'nl'];
const DEFAULT_REVIEW_LIMIT = 5;
const MAX_REVIEW_OFFSET = 1000;

const AMENITY_CATEGORIES: Record<string, string[]> = {
  spa: ['Spa', 'Massage', 'Facial Treatments', 'Body Treatments', 'Steam Room', 'Turkish Bath'],
  pool: ['Pool', 'Swimming Pool', 'Indoor Pool', 'Outdoor Pool', 'Infinity Pool', 'Heated pool'],
  restaurant: ['Restaurant', 'Dining area'],
  free_wifi: ['Free Wifi', 'Free Internet'],
  ev_charging: ['Electric vehicle charging station'],
  butler_service: ['Butler Service'],
  concierge: ['Concierge'],
  meeting_rooms: ['Meeting rooms', 'Conference Facilities', 'Banquet Room'],
  business_center: ['Business center'],
  parking: ['Parking', 'Secured Parking', 'Valet Parking', 'Free parking', 'Paid public parking nearby'],
  pet_friendly: ['Pets Allowed'],
  fitness: ['Fitness center', 'Gym'],
  bar: ['Bar/Lounge', 'Bar'],
  room_service: ['Room service'],
  suites: ['Suites', 'Family Rooms'],
  accessible: ['Accessible rooms', 'Facilities for Disabled Guests'],
  airport_transfer: ['Airport transportation'],
  minibar: ['Minibar'],
  air_conditioning: ['Air conditioning'],
  babysitting: ['Babysitting'],
  breakfast: ['Breakfast Available', 'Breakfast Buffet', 'Breakfast in the Room'],
};

const LANGUAGE_WORDS = [
  'English',
  'German',
  'French',
  'Italian',
  'Spanish',
  'Japanese',
  'Dutch',
  'Portuguese',
  'Russian',
  'Arabic',
  'Chinese',
];

function parseFloatOrNull(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntOrNull(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeReviewTripType(tripType: string | undefined | null): string | null {
  if (!tripType) return null;
  const map: Record<string, string> = {
    business: 'business',
    couples: 'couples',
    'solo travel': 'solo',
    solo: 'solo',
    family: 'family',
    'friends getaway': 'friends',
    friends: 'friends',
  };
  return map[tripType.toLowerCase()] ?? tripType.toLowerCase();
}

function normalizeReviewSubratings(subratings: TAReview['subratings']): Record<string, number> | null {
  if (!subratings) return null;
  const normalized: Record<string, number> = {};
  for (const subrating of Object.values(subratings)) {
    const key = subrating.name.replace(/^RATE_/i, '').toLowerCase();
    normalized[key] = subrating.value;
  }
  return Object.keys(normalized).length ? normalized : null;
}

function extractAwards(raw: TADetailResponse): Array<{ type: string | null; year: string | null; name: string | null }> {
  return raw.awards?.map(award => ({
    type: cleanString(award.award_type),
    year: cleanString(award.year),
    name: cleanString(award.display_name),
  })) ?? [];
}

function amenityMatches(amenities: string[], keywords: string[]): boolean {
  const lowerAmenities = amenities.map(amenity => amenity.toLowerCase());
  return keywords.some(keyword => lowerAmenities.some(amenity => amenity.includes(keyword.toLowerCase())));
}

function amenityFlagPartial(amenities: string[]): Record<string, boolean | null> {
  return {
    ta_has_free_wifi: amenityMatches(amenities, AMENITY_CATEGORIES.free_wifi),
    ta_has_pool: amenityMatches(amenities, AMENITY_CATEGORIES.pool),
    ta_has_spa: amenityMatches(amenities, AMENITY_CATEGORIES.spa),
    ta_has_fitness: amenityMatches(amenities, AMENITY_CATEGORIES.fitness),
    ta_has_restaurant: amenityMatches(amenities, AMENITY_CATEGORIES.restaurant),
    ta_has_bar: amenityMatches(amenities, AMENITY_CATEGORIES.bar),
    ta_has_parking: amenityMatches(amenities, AMENITY_CATEGORIES.parking),
    ta_has_ev_charging: amenityMatches(amenities, AMENITY_CATEGORIES.ev_charging),
    ta_has_meeting_rooms: amenityMatches(amenities, AMENITY_CATEGORIES.meeting_rooms),
    ta_has_business_center: amenityMatches(amenities, AMENITY_CATEGORIES.business_center),
    ta_has_room_service: amenityMatches(amenities, AMENITY_CATEGORIES.room_service),
    ta_has_concierge: amenityMatches(amenities, AMENITY_CATEGORIES.concierge),
    ta_has_suites: amenityMatches(amenities, AMENITY_CATEGORIES.suites),
    ta_has_pet_friendly: amenityMatches(amenities, AMENITY_CATEGORIES.pet_friendly),
    ta_has_accessible: amenityMatches(amenities, AMENITY_CATEGORIES.accessible),
    ta_has_butler_service: amenityMatches(amenities, AMENITY_CATEGORIES.butler_service),
    ta_has_babysitting: amenityMatches(amenities, AMENITY_CATEGORIES.babysitting),
    ta_has_airport_transfer: amenityMatches(amenities, AMENITY_CATEGORIES.airport_transfer),
    ta_has_breakfast: amenityMatches(amenities, AMENITY_CATEGORIES.breakfast),
    ta_has_air_conditioning: amenityMatches(amenities, AMENITY_CATEGORIES.air_conditioning),
    ta_has_minibar: amenityMatches(amenities, AMENITY_CATEGORIES.minibar),
  };
}

function amenityRows(amenities: string[]): AmenityInsert[] {
  return amenities.map(amenity => ({
    source: 'tripadvisor',
    amenity,
    category:
      Object.entries(AMENITY_CATEGORIES).find(([, keywords]) =>
        keywords.some(keyword => amenity.toLowerCase().includes(keyword.toLowerCase())),
      )?.[0] ?? null,
  }));
}

function competitorFieldName(rank: number, suffix: string): string {
  return `ta_competitor_${rank}_${suffix}`;
}

function dedupeReviewPayloads(reviews: TAReview[]): TAReview[] {
  const seen = new Map<string, TAReview>();
  for (const review of reviews) {
    const key = String(review.id);
    if (!seen.has(key)) {
      seen.set(key, review);
    }
  }
  return [...seen.values()];
}

function buildCompetitorHotelSeed(detail: TADetailResponse, fallbackName: string): CompetitorHotelSeed {
  let country: string | null = null;
  for (const ancestor of detail.ancestors ?? []) {
    if (ancestor.level === 'Country') {
      country = ancestor.name;
      break;
    }
  }

  return {
    ta_location_id: detail.location_id,
    name: cleanString(detail.name) ?? fallbackName,
    city: cleanString(detail.address_obj?.city),
    country: country ?? cleanString(detail.address_obj?.country),
    hotel: {
      name: cleanString(detail.name) ?? fallbackName,
      city: cleanString(detail.address_obj?.city),
      country: country ?? cleanString(detail.address_obj?.country),
      ta_location_id: detail.location_id,
      ta_name: cleanString(detail.name),
      ta_description: cleanString(detail.description),
      ta_web_url: cleanString(detail.web_url),
      ta_category: cleanString(detail.category?.name),
      ta_subcategory: cleanString(detail.subcategory?.[0]?.name),
      ta_brand: cleanString(detail.brand),
      ta_parent_brand: cleanString(detail.parent_brand),
      ta_latitude: parseFloatOrNull(detail.latitude),
      ta_longitude: parseFloatOrNull(detail.longitude),
      ta_timezone: cleanString(detail.timezone),
      ta_price_level: cleanString(detail.price_level),
      ta_photo_count: parseIntOrNull(detail.photo_count),
      ta_street1: cleanString(detail.address_obj?.street1),
      ta_street2: cleanString(detail.address_obj?.street2),
      ta_city: cleanString(detail.address_obj?.city),
      ta_state: cleanString(detail.address_obj?.state),
      ta_country: cleanString(detail.address_obj?.country),
      ta_postalcode: cleanString(detail.address_obj?.postalcode),
      ta_address_string: cleanString(detail.address_obj?.address_string),
      ta_neighborhood: cleanString(detail.neighborhood_info?.[0]?.name),
      ta_rating: parseFloatOrNull(detail.rating),
      ta_num_reviews: parseIntOrNull(detail.num_reviews),
      ta_ranking: parseIntOrNull(detail.ranking_data?.ranking),
      ta_ranking_out_of: parseIntOrNull(detail.ranking_data?.ranking_out_of),
      ta_ranking_geo: cleanString(detail.ranking_data?.geo_location_name),
      ta_subrating_location: Object.values(detail.subratings ?? {}).find(item => item.name.toLowerCase() === 'rate_location')?.value ?? null,
      ta_subrating_sleep: Object.values(detail.subratings ?? {}).find(item => item.name.toLowerCase() === 'rate_sleep')?.value ?? null,
      ta_subrating_rooms: Object.values(detail.subratings ?? {}).find(item => item.name.toLowerCase() === 'rate_room')?.value ?? null,
      ta_subrating_service: Object.values(detail.subratings ?? {}).find(item => item.name.toLowerCase() === 'rate_service')?.value ?? null,
      ta_subrating_value: Object.values(detail.subratings ?? {}).find(item => item.name.toLowerCase() === 'rate_value')?.value ?? null,
      ta_subrating_cleanliness: Object.values(detail.subratings ?? {}).find(item => item.name.toLowerCase() === 'rate_cleanliness')?.value ?? null,
      latitude: parseFloatOrNull(detail.latitude),
      longitude: parseFloatOrNull(detail.longitude),
      timezone: cleanString(detail.timezone),
      ta_enriched_at: new Date().toISOString(),
      enrichment_status: 'hotel_enrichment_complete',
      ...amenityFlagPartial(detail.amenities ?? []),
    },
    amenities: amenityRows(detail.amenities ?? []),
  };
}

export async function discoverTripadvisor(input: PipelineContext['input']): Promise<DiscoveryResult> {
  const queries = uniqueStrings([
    [input.name, input.city].filter(Boolean).join(' '),
    input.name,
  ]);

  try {
    let bestMatch: { locationId: string; score: number; latitude: number | null; longitude: number | null; country: string | null } | null = null;

    for (const query of queries) {
      const { data } = await getCachedOrFetch<TASearchResponse>(CACHE_SEARCH, query, async () => await searchHotel(query));
      for (const item of data.data ?? []) {
        const cityMatch = input.city && item.address_obj?.city
          ? item.address_obj.city.toLowerCase().includes(input.city.toLowerCase())
          : false;
        const score = nameSimilarity(input.name, item.name) + (cityMatch ? 0.2 : 0);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            locationId: item.location_id,
            score,
            latitude: null,
            longitude: null,
            country: cleanString(item.address_obj?.country),
          };
        }
      }
      if (bestMatch && bestMatch.score >= 0.75) break;
    }

    if (!bestMatch || bestMatch.score < 0.45) {
      return {
        ok: false,
        message: 'No confident TripAdvisor match found',
      };
    }

    return {
      ok: true,
      taLocationId: bestMatch.locationId,
      country: bestMatch.country,
      message: `TripAdvisor match ${bestMatch.locationId} (score ${bestMatch.score.toFixed(3)})`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchReviewPages(locationId: string): Promise<Array<{ response: TAReviewsResponse; cached: boolean }>> {
  const limiter = new ConcurrencyLimiter(3);
  const languageTasks = REVIEW_LANGUAGES.map(lang =>
    limiter.execute(async () => {
      const pages: Array<{ response: TAReviewsResponse; cached: boolean }> = [];
      for (let offset = 0; offset <= MAX_REVIEW_OFFSET; offset += DEFAULT_REVIEW_LIMIT) {
        try {
          const page = await getCachedOrFetch<TAReviewsResponse>(
            CACHE_REVIEWS,
            `${locationId}:${lang}:${offset}`,
            async () => await getReviews(locationId, lang, DEFAULT_REVIEW_LIMIT, offset),
          );
          const data = page.data.data ?? [];
          if (!data.length) break;
          pages.push({ response: page.data, cached: page.cached });
          if (data.length < DEFAULT_REVIEW_LIMIT) break;
        } catch {
          break;
        }
      }
      return pages;
    }),
  );

  const settled = await Promise.allSettled(languageTasks);
  return settled
    .filter((result): result is PromiseFulfilledResult<Array<{ response: TAReviewsResponse; cached: boolean }>> => result.status === 'fulfilled')
    .flatMap(result => result.value);
}

export async function runTripadvisor(context: PipelineContext): Promise<SourceResult> {
  if (!context.taLocationId) {
    return { statuses: [statusSkipped('tripadvisor', 'No TripAdvisor location id')] };
  }

  try {
    const detailsResult = await getCachedOrFetch<TADetailResponse>(
      CACHE_DETAILS,
      context.taLocationId,
      async () => await getDetails(context.taLocationId as string, 'en', 'USD'),
    );

    const details = detailsResult.data;
    const amenities = details.amenities ?? [];
    const awards = extractAwards(details);
    const tcYears = awards
      .filter(award => (award.type ?? '').toLowerCase().includes('travelers'))
      .map(award => award.year)
      .filter((year): year is string => Boolean(year))
      .sort()
      .reverse();
    const languagesSpoken = LANGUAGE_WORDS.filter(language =>
      amenities.some(amenity => amenity.toLowerCase().includes(language.toLowerCase())),
    );
    const ratings = details.review_rating_count ?? {};
    const subratings = Object.fromEntries(
      Object.values(details.subratings ?? {}).map(subrating => [subrating.name.replace(/^rate_/i, ''), parseFloatOrNull(subrating.value)]),
    );
    const tripTypes = Object.fromEntries(
      (details.trip_types ?? []).map(type => [type.name, parseIntOrNull(type.value)]),
    );

    let municipality: string | null = null;
    let municipalityId: string | null = null;
    let region: string | null = null;
    let regionId: string | null = null;
    let country: string | null = null;
    let countryId: string | null = null;

    for (const ancestor of details.ancestors ?? []) {
      switch (ancestor.level) {
        case 'Municipality':
          municipality = ancestor.name;
          municipalityId = ancestor.location_id;
          break;
        case 'Canton':
        case 'Region':
        case 'Province':
        case 'State':
          region = ancestor.name;
          regionId = ancestor.location_id;
          break;
        case 'Country':
          country = ancestor.name;
          countryId = ancestor.location_id;
          break;
      }
    }

    const reviewPages = await fetchReviewPages(context.taLocationId);
    const reviewData = dedupeReviewPayloads(reviewPages.flatMap(page => page.response.data ?? []));
    const locationCounts = new Map<string, number>();
    const langBuckets = new Map<string, number[]>();
    const ownerResponseDelays: number[] = [];
    let ownerResponseCount = 0;

    const reviews: ReviewInsert[] = reviewData.map(review => {
      const locationName = cleanString(review.user.user_location?.name);
      if (locationName) {
        locationCounts.set(locationName, (locationCounts.get(locationName) ?? 0) + 1);
      }

      const normalizedLang = cleanString(review.lang) ?? 'en';
      const rating = typeof review.rating === 'number' ? review.rating : null;
      if (rating != null) {
        const bucket = langBuckets.get(normalizedLang) ?? [];
        bucket.push(rating);
        langBuckets.set(normalizedLang, bucket);
      }

      if (review.owner_response) {
        ownerResponseCount += 1;
        const delay = diffHours(review.published_date, review.owner_response.published_date);
        if (delay != null && delay >= 0) ownerResponseDelays.push(delay);
      }

      return {
        source: 'tripadvisor',
        source_review_id: String(review.id),
        lang: normalizedLang,
        rating,
        title: cleanString(review.title),
        text: cleanString(review.text),
        trip_type: normalizeReviewTripType(review.trip_type),
        travel_date: cleanString(review.travel_date),
        published_date: cleanString(review.published_date),
        helpful_votes: review.helpful_votes ?? 0,
        reviewer_username: cleanString(review.user.username),
        reviewer_location: locationName,
        reviewer_location_id: review.user.user_location?.id && review.user.user_location.id !== 'null'
          ? review.user.user_location.id
          : null,
        has_owner_response: Boolean(review.owner_response),
        owner_response_text: cleanString(review.owner_response?.text),
        owner_response_author: cleanString(review.owner_response?.author),
        owner_response_date: cleanString(review.owner_response?.published_date),
        owner_response_lang: cleanString(review.owner_response?.lang),
        subratings: normalizeReviewSubratings(review.subratings),
      };
    });

    const reviewLanguages = [...langBuckets.keys()].sort();
    const langRatings: LangRatingInsert[] = REVIEW_LANGUAGES.map(lang => {
      const values = langBuckets.get(lang) ?? [];
      return {
        lang,
        avg_rating: values.length ? values.reduce((total, value) => total + value, 0) / values.length : null,
        review_count: values.length,
      };
    }).filter(row => row.review_count > 0);

    const mostRecentReviewDate = reviewData
      .map(review => review.published_date)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null;

    const last90dCount = reviewData.filter(review => {
      const iso = review.published_date ? new Date(review.published_date).getTime() : NaN;
      return Number.isFinite(iso) && (Date.now() - iso) <= 90 * 86400000;
    }).length;

    const nearbyLatitude = details.latitude ? parseFloat(details.latitude) : NaN;
    const nearbyLongitude = details.longitude ? parseFloat(details.longitude) : NaN;

    const nearbyResult = Number.isFinite(nearbyLatitude) && Number.isFinite(nearbyLongitude)
      ? await getCachedOrFetch<TASearchResponse>(
          CACHE_NEARBY,
          context.taLocationId,
          async () => await nearbySearch(nearbyLatitude, nearbyLongitude, 5),
        )
      : null;

    const nearbyItems = (nearbyResult?.data.data ?? [])
      .filter(item => item.location_id !== context.taLocationId)
      .slice(0, 10);

    const competitorDetailsLimiter = new ConcurrencyLimiter(4);
    const competitorDetails = await Promise.all(
      nearbyItems.map(item =>
        competitorDetailsLimiter.execute(async () => {
          try {
            const result = await getCachedOrFetch<TADetailResponse>(
              CACHE_DETAILS,
              item.location_id,
              async () => await getDetails(item.location_id, 'en', 'USD'),
            );
            return {
              item,
              detail: result.data,
            };
          } catch {
            return { item, detail: null };
          }
        }),
      ),
    );

    const competitors: CompetitorInsert[] = competitorDetails.map((entry, index) => ({
      competitor_rank: index + 1,
      ta_location_id: entry.item.location_id,
      name: entry.item.name,
      distance_km: parseFloatOrNull(entry.item.distance),
      bearing: cleanString(entry.item.bearing),
    }));
    const competitorHotels = competitorDetails
      .filter((entry): entry is { item: typeof entry.item; detail: TADetailResponse } => Boolean(entry.detail))
      .map(entry => buildCompetitorHotelSeed(entry.detail, entry.item.name));

    const competitorHotelPartial: Record<string, string | number | null> = {};
    competitorDetails.forEach((entry, index) => {
      const rank = index + 1;
      competitorHotelPartial[competitorFieldName(rank, 'id')] = entry.item.location_id;
      competitorHotelPartial[competitorFieldName(rank, 'name')] = entry.item.name;
      competitorHotelPartial[competitorFieldName(rank, 'dist_km')] = parseFloatOrNull(entry.item.distance);
      competitorHotelPartial[competitorFieldName(rank, 'bearing')] = cleanString(entry.item.bearing);
    });

    const competitorRatings = competitorDetails.map(entry => parseFloatOrNull(entry.detail?.rating));
    const competitorReviewCounts = competitorDetails.map(entry => parseIntOrNull(entry.detail?.num_reviews));
    const competitorPriceLevels = competitorDetails.map(entry => {
      const numeric = entry.detail?.price_level ? { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 }[entry.detail.price_level] : undefined;
      return typeof numeric === 'number' ? numeric : null;
    });

    return {
      hotel: {
        ta_name: cleanString(details.name),
        ta_description: cleanString(details.description),
        ta_web_url: cleanString(details.web_url),
        ta_write_review_url: cleanString(details.write_review),
        ta_see_all_photos_url: cleanString(details.see_all_photos),
        ta_category: cleanString(details.category?.name),
        ta_subcategory: cleanString(details.subcategory?.[0]?.name),
        ta_brand: cleanString(details.brand),
        ta_parent_brand: cleanString(details.parent_brand),
        ta_latitude: parseFloatOrNull(details.latitude),
        ta_longitude: parseFloatOrNull(details.longitude),
        ta_timezone: cleanString(details.timezone),
        ta_price_level: cleanString(details.price_level),
        ta_photo_count: parseIntOrNull(details.photo_count),
        ta_street1: cleanString(details.address_obj?.street1),
        ta_street2: cleanString(details.address_obj?.street2),
        ta_city: cleanString(details.address_obj?.city),
        ta_state: cleanString(details.address_obj?.state),
        ta_country: cleanString(details.address_obj?.country),
        ta_postalcode: cleanString(details.address_obj?.postalcode),
        ta_address_string: cleanString(details.address_obj?.address_string),
        ta_neighborhood: cleanString(details.neighborhood_info?.[0]?.name),
        ta_ancestor_municipality: municipality,
        ta_ancestor_municipality_id: municipalityId,
        ta_ancestor_region: region,
        ta_ancestor_region_id: regionId,
        ta_ancestor_country: country,
        ta_ancestor_country_id: countryId,
        ta_rating: parseFloatOrNull(details.rating),
        ta_num_reviews: parseIntOrNull(details.num_reviews),
        ta_rating_1_count: parseIntOrNull(ratings['1']),
        ta_rating_2_count: parseIntOrNull(ratings['2']),
        ta_rating_3_count: parseIntOrNull(ratings['3']),
        ta_rating_4_count: parseIntOrNull(ratings['4']),
        ta_rating_5_count: parseIntOrNull(ratings['5']),
        ta_subrating_location: subratings.location ?? null,
        ta_subrating_sleep: subratings.sleep ?? null,
        ta_subrating_rooms: subratings.room ?? null,
        ta_subrating_service: subratings.service ?? null,
        ta_subrating_value: subratings.value ?? null,
        ta_subrating_cleanliness: subratings.cleanliness ?? null,
        ta_ranking: parseIntOrNull(details.ranking_data?.ranking),
        ta_ranking_out_of: parseIntOrNull(details.ranking_data?.ranking_out_of),
        ta_ranking_geo: cleanString(details.ranking_data?.geo_location_name),
        ta_trip_type_business: tripTypes.business ?? null,
        ta_trip_type_couples: tripTypes.couples ?? null,
        ta_trip_type_solo: tripTypes.solo ?? null,
        ta_trip_type_family: tripTypes.family ?? null,
        ta_trip_type_friends: tripTypes.friends ?? null,
        ta_awards: awards,
        ta_has_travelers_choice: tcYears.length > 0,
        ta_travelers_choice_year: tcYears[0] ?? null,
        ta_amenities: joinPipe(amenities),
        ta_amenity_count: amenities.length,
        ta_languages_spoken: joinPipe(languagesSpoken),
        ta_review_languages: joinPipe(reviewLanguages),
        ta_review_language_count: reviewLanguages.length,
        ta_review_most_recent_date: toIsoDate(mostRecentReviewDate),
        ta_reviews_last_90d_est: last90dCount,
        ta_owner_response_count: ownerResponseCount,
        ta_owner_response_rate: reviews.length ? ownerResponseCount / reviews.length : null,
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
        ta_compset_count: competitors.length,
        ta_compset_avg_rating: mean(competitorRatings),
        ta_compset_avg_reviews: mean(competitorReviewCounts),
        ta_compset_avg_price_level: mean(competitorPriceLevels),
        ta_rating_vs_compset:
          parseFloatOrNull(details.rating) != null && mean(competitorRatings) != null
            ? (parseFloatOrNull(details.rating) as number) - (mean(competitorRatings) as number)
            : null,
        ta_reviews_vs_compset_ratio:
          parseIntOrNull(details.num_reviews) != null && mean(competitorReviewCounts)
            ? (parseIntOrNull(details.num_reviews) as number) / (mean(competitorReviewCounts) as number)
            : null,
        latitude: parseFloatOrNull(details.latitude) ?? context.latitude ?? null,
        longitude: parseFloatOrNull(details.longitude) ?? context.longitude ?? null,
        timezone: cleanString(details.timezone) ?? null,
        country: country ?? context.country ?? cleanString(details.address_obj?.country) ?? null,
        ta_enriched_at: new Date().toISOString(),
        ...amenityFlagPartial(amenities),
        ...competitorHotelPartial,
      },
      amenities: amenityRows(amenities),
      reviews,
      competitors,
      competitorHotels,
      langRatings,
      statuses: [
        statusOk(
          'tripadvisor',
          `details=${details.name}; reviews=${reviews.length}; competitors=${competitors.length}`,
          detailsResult.cached && reviewPages.every(page => page.cached) && Boolean(nearbyResult?.cached ?? true),
        ),
      ],
    };
  } catch (error) {
    return {
      statuses: [statusError('tripadvisor', error)],
    };
  }
}
