/**
 * Step 2: Enrich matched hotels with TripAdvisor Details + Nearby + Reviews.
 *
 * For each hotel with ta_location_id in Supabase:
 *   1. Fetch TA Details (ratings, subratings, amenities, trip types, awards)
 *   2. Fetch TA Nearby (competitive set, up to 10 competitors)
 *   3. Optionally fetch reviews in 6 languages (--include-reviews flag)
 *
 * Usage:
 *   tsx scripts/phase0-enrichment/02-enrich-tripadvisor.ts [--limit N] [--include-reviews]
 */
import 'dotenv/config';
import { resolve } from 'path';
import { supabase, logPipelineStart, logPipelineEnd } from './lib/supabase.js';
import { getDetails, nearbySearch, getReviews, getTACallCount } from './lib/tripadvisor-client.js';
import { readCache, writeCache, isCacheFresh } from './lib/cache.js';
import { ProgressLogger } from './lib/logger.js';
import type { TADetailResponse, TASearchResponse, TAReviewsResponse, TAReview, HotelUpsert } from './lib/types.js';

// ── Config ──
const CACHE_DETAILS = resolve(process.cwd(), 'scripts/phase0-enrichment/cache/ta-details.jsonl');
const CACHE_NEARBY = resolve(process.cwd(), 'scripts/phase0-enrichment/cache/ta-nearby.jsonl');
const REVIEW_LANGUAGES = ['en', 'de', 'fr', 'it', 'es', 'ja'];
const REVIEWS_PER_LANG = 10;  // 2 pages of 5

// ── CLI args ──
const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;
const INCLUDE_REVIEWS = args.includes('--include-reviews');

// ── Amenity category mapping ──
const AMENITY_CATEGORIES: Record<string, string[]> = {
  spa: ['Spa', 'Massage', 'Facial Treatments', 'Body Treatments', 'Steam Room', 'Turkish Bath'],
  pool: ['Pool', 'Swimming Pool', 'Indoor Pool', 'Outdoor Pool', 'Infinity Pool', 'Heated pool'],
  restaurant: ['Restaurant', 'Dining area'],
  free_wifi: ['Free Wifi', 'Free Internet'],
  ev_charging: ['Electric vehicle charging station'],
  butler_service: ['Butler Service'],
  concierge: ['Concierge'],
  meeting_rooms: ['Meeting rooms', 'Conference Facilities', 'Banquet Room'],
  parking: ['Parking', 'Secured Parking', 'Valet Parking', 'Free parking', 'Paid public parking nearby'],
  pet_friendly: ['Pets Allowed'],
  fitness: ['Fitness center', 'Gym'],
  bar: ['Bar/Lounge', 'Bar'],
  room_service: ['Room service'],
  suites: ['Suites', 'Family Rooms'],
  accessible: ['Accessible rooms', 'Facilities for Disabled Guests'],
  airport_shuttle: ['Airport transportation'],
  laundry: ['Laundry Service', 'Dry Cleaning'],
  minibar: ['Minibar'],
  air_conditioning: ['Air conditioning'],
  babysitting: ['Babysitting'],
  tennis: ['Tennis Court'],
  golf: ['Golf Course'],
  sauna: ['Sauna'],
  kids_club: ['Kids Club', "Children's Activities"],
  casino: ['Casino'],
  beach: ['Beach Access', 'Private Beach'],
  ski: ['Ski-in / Ski-out', 'Ski storage', 'Ski School'],
  breakfast: ['Breakfast Available', 'Breakfast Buffet', 'Breakfast in the Room'],
};

function amenityHasCategory(amenities: string[], category: string): boolean {
  const keywords = AMENITY_CATEGORIES[category];
  if (!keywords) return false;
  const amenityLower = amenities.map(a => a.toLowerCase());
  return keywords.some(kw => amenityLower.some(a => a.includes(kw.toLowerCase())));
}

// ── Parse TA Details into DB fields ──
function parseDetails(raw: TADetailResponse): HotelUpsert {
  const rating = raw.rating ? parseFloat(raw.rating) : null;
  const numReviews = raw.num_reviews ? parseInt(raw.num_reviews, 10) : null;
  const photoCount = raw.photo_count ? parseInt(raw.photo_count, 10) : null;
  const lat = raw.latitude ? parseFloat(raw.latitude) : null;
  const lng = raw.longitude ? parseFloat(raw.longitude) : null;

  // Subratings — indexed by "0", "1", etc.
  const subratings: Record<string, number> = {};
  if (raw.subratings) {
    for (const sub of Object.values(raw.subratings)) {
      const key = sub.name.replace('rate_', '');
      subratings[key] = parseFloat(sub.value);
    }
  }

  // Rating distribution
  const ratingCounts: Record<string, number> = {};
  if (raw.review_rating_count) {
    for (const [star, count] of Object.entries(raw.review_rating_count)) {
      ratingCounts[star] = parseInt(count, 10);
    }
  }

  // Trip types
  const tripTypes: Record<string, number> = {};
  if (raw.trip_types) {
    for (const tt of raw.trip_types) {
      tripTypes[tt.name] = parseInt(tt.value, 10);
    }
  }

  // Ranking
  const ranking = raw.ranking_data?.ranking ? parseInt(raw.ranking_data.ranking, 10) : null;
  const rankingOutOf = raw.ranking_data?.ranking_out_of ? parseInt(raw.ranking_data.ranking_out_of, 10) : null;

  // Ancestors
  let ancestorMunicipality: string | null = null;
  let ancestorMunicipalityId: string | null = null;
  let ancestorRegion: string | null = null;
  let ancestorRegionId: string | null = null;
  let ancestorCountry: string | null = null;
  let ancestorCountryId: string | null = null;

  if (raw.ancestors) {
    for (const anc of raw.ancestors) {
      switch (anc.level) {
        case 'Municipality':
          ancestorMunicipality = anc.name;
          ancestorMunicipalityId = anc.location_id;
          break;
        case 'Canton': case 'Region': case 'Province': case 'State':
          ancestorRegion = anc.name;
          ancestorRegionId = anc.location_id;
          break;
        case 'Country':
          ancestorCountry = anc.name;
          ancestorCountryId = anc.location_id;
          break;
      }
    }
  }

  // Awards
  const awards = raw.awards?.map(a => ({
    type: a.award_type,
    year: a.year,
    name: a.display_name,
  })) ?? [];

  const amenities = raw.amenities ?? [];

  return {
    ta_name: raw.name,
    ta_description: raw.description ?? null,
    ta_web_url: raw.web_url ?? null,
    ta_category: raw.category?.name ?? null,
    ta_brand: raw.brand ?? null,
    ta_parent_brand: raw.parent_brand ?? null,
    ta_price_level: raw.price_level ?? null,
    ta_photo_count: photoCount,
    latitude: lat,
    longitude: lng,
    timezone: raw.timezone ?? null,

    ta_street1: raw.address_obj?.street1 ?? null,
    ta_street2: raw.address_obj?.street2 ?? null,
    ta_city: raw.address_obj?.city ?? null,
    ta_state: raw.address_obj?.state ?? null,
    ta_country: raw.address_obj?.country ?? null,
    ta_postalcode: raw.address_obj?.postalcode ?? null,
    ta_address_string: raw.address_obj?.address_string ?? null,

    ta_ancestor_municipality: ancestorMunicipality,
    ta_ancestor_municipality_id: ancestorMunicipalityId,
    ta_ancestor_region: ancestorRegion,
    ta_ancestor_region_id: ancestorRegionId,
    ta_ancestor_country: ancestorCountry,
    ta_ancestor_country_id: ancestorCountryId,

    ta_rating: rating,
    ta_num_reviews: numReviews,
    ta_rating_1_count: ratingCounts['1'] ?? null,
    ta_rating_2_count: ratingCounts['2'] ?? null,
    ta_rating_3_count: ratingCounts['3'] ?? null,
    ta_rating_4_count: ratingCounts['4'] ?? null,
    ta_rating_5_count: ratingCounts['5'] ?? null,

    ta_subrating_location: subratings['location'] ?? null,
    ta_subrating_sleep: subratings['sleep'] ?? null,
    ta_subrating_rooms: subratings['room'] ?? null,
    ta_subrating_service: subratings['service'] ?? null,
    ta_subrating_value: subratings['value'] ?? null,
    ta_subrating_cleanliness: subratings['cleanliness'] ?? null,

    ta_ranking: ranking,
    ta_ranking_out_of: rankingOutOf,
    ta_ranking_geo: raw.ranking_data?.geo_location_name ?? null,

    ta_trip_type_business: tripTypes['business'] ?? null,
    ta_trip_type_couples: tripTypes['couples'] ?? null,
    ta_trip_type_solo: tripTypes['solo'] ?? null,
    ta_trip_type_family: tripTypes['family'] ?? null,
    ta_trip_type_friends: tripTypes['friends'] ?? null,

    ta_awards: awards,

    enrichment_status: 'ta_enriched',
    ta_enriched_at: new Date().toISOString(),
  };
}

// ── Normalize review trip type to lowercase ──
function normalizeReviewTripType(tripType: string | undefined | null): string | null {
  if (!tripType) return null;
  const map: Record<string, string> = {
    'business': 'business',
    'couples': 'couples',
    'solo travel': 'solo',
    'solo': 'solo',
    'family': 'family',
    'friends getaway': 'friends',
    'friends': 'friends',
  };
  return map[tripType.toLowerCase()] ?? tripType.toLowerCase();
}

// ── Normalize review subratings ──
function normalizeReviewSubratings(subratings: TAReview['subratings']): Record<string, number> | null {
  if (!subratings) return null;
  const result: Record<string, number> = {};
  for (const sub of Object.values(subratings)) {
    const key = sub.name.replace(/^RATE_/i, '').toLowerCase();
    result[key] = sub.value;
  }
  return result;
}

// ── Main ──
export default async function enrichTripadvisor(): Promise<void> {
  console.log('\n--- Step 2: Enrich Hotels with TripAdvisor Data ---\n');
  if (INCLUDE_REVIEWS) {
    console.log('REVIEWS ENABLED — fetching 6 languages, 2 pages each per hotel');
    console.log('WARNING: This will use ~24,828 additional API calls. Ensure you have launch approval.\n');
  }

  // Fetch hotels that need enrichment
  const { data: hotels, error: fetchError } = await supabase
    .from('hotels')
    .select('id, hs_slug, ta_location_id, name, city')
    .eq('enrichment_status', 'ta_matched')
    .not('ta_location_id', 'is', null)
    .order('hs_slug')
    .limit(LIMIT);

  if (fetchError) {
    throw new Error(`Failed to fetch hotels: ${fetchError.message}`);
  }

  if (!hotels || hotels.length === 0) {
    console.log('No hotels need TA enrichment. All done or run step 1 first.');
    return;
  }

  console.log(`Found ${hotels.length} hotels to enrich`);

  // Load caches
  const detailsCache = readCache<TADetailResponse>(CACHE_DETAILS);
  const nearbyCache = readCache<TASearchResponse>(CACHE_NEARBY);
  console.log(`Details cache: ${detailsCache.size} entries | Nearby cache: ${nearbyCache.size} entries`);

  const logger = new ProgressLogger('TA Enrich', hotels.length, 15);
  const runId = await logPipelineStart('enrich_ta', hotels.length);
  let processed = 0;
  let enriched = 0;
  let errors = 0;

  for (const hotel of hotels) {
    const { id, hs_slug, ta_location_id, name } = hotel;
    try {
      // ── 1. Fetch Details ──
      let details: TADetailResponse;
      const detailCacheEntry = detailsCache.get(ta_location_id);
      if (detailCacheEntry && isCacheFresh(detailCacheEntry)) {
        details = detailCacheEntry.data;
      } else {
        details = await getDetails(ta_location_id);
        writeCache(CACHE_DETAILS, ta_location_id, details);
      }

      const parsedDetails = parseDetails(details);

      // ── 2. Update hotel row ──
      const { error: updateError } = await supabase
        .from('hotels')
        .update(parsedDetails)
        .eq('id', id);

      if (updateError) {
        console.error(`[ERROR] Update failed for ${hs_slug}: ${updateError.message}`);
        errors++;
        continue;
      }

      // ── 3. Store amenities ──
      if (details.amenities && details.amenities.length > 0) {
        const amenityRows = details.amenities.map(amenity => {
          // Find category
          let category: string | null = null;
          for (const [cat, keywords] of Object.entries(AMENITY_CATEGORIES)) {
            if (keywords.some(kw => amenity.toLowerCase().includes(kw.toLowerCase()))) {
              category = cat;
              break;
            }
          }
          return {
            hotel_id: id,
            source: 'tripadvisor',
            amenity,
            category,
          };
        });

        // Upsert amenities (ignore conflicts)
        const { error: amenityError } = await supabase
          .from('hotel_amenities')
          .upsert(amenityRows, { onConflict: 'hotel_id,source,amenity', ignoreDuplicates: true });

        if (amenityError) {
          console.error(`[WARN] Amenity insert for ${hs_slug}: ${amenityError.message}`);
        }
      }

      // ── 4. Fetch Nearby (competitive set) ──
      const lat = parsedDetails.latitude as number | null;
      const lng = parsedDetails.longitude as number | null;

      if (lat && lng) {
        const nearbyKey = `nearby_${ta_location_id}`;
        const nearbyCacheEntry = nearbyCache.get(nearbyKey);
        let nearbyResults;

        if (nearbyCacheEntry && isCacheFresh(nearbyCacheEntry)) {
          nearbyResults = nearbyCacheEntry.data;
        } else {
          nearbyResults = await nearbySearch(lat, lng, 5);
          writeCache(resolve(process.cwd(), 'scripts/phase0-enrichment/cache/ta-nearby.jsonl'), nearbyKey, nearbyResults);
        }

        // Store competitors (exclude self)
        const competitors = (nearbyResults as any).data
          ?.filter((r: any) => r.location_id !== ta_location_id)
          ?.slice(0, 10) ?? [];

        if (competitors.length > 0) {
          const competitorRows = competitors.map((comp: any, idx: number) => ({
            hotel_id: id,
            competitor_rank: idx + 1,
            ta_location_id: comp.location_id,
            name: comp.name,
            distance_km: comp.distance ? parseFloat(comp.distance) : null,
            bearing: comp.bearing ?? null,
          }));

          const { error: compError } = await supabase
            .from('hotel_competitors')
            .upsert(competitorRows, { onConflict: 'hotel_id,competitor_rank' });

          if (compError) {
            console.error(`[WARN] Competitor insert for ${hs_slug}: ${compError.message}`);
          }
        }
      }

      // ── 5. Optionally fetch reviews ──
      if (INCLUDE_REVIEWS) {
        for (const lang of REVIEW_LANGUAGES) {
          const cachePath = resolve(process.cwd(), `scripts/phase0-enrichment/cache/ta-reviews-${lang}.jsonl`);
          const reviewCache = readCache<TAReviewsResponse>(cachePath);

          for (let page = 0; page < 2; page++) {
            const offset = page * 5;
            const cacheKey = `${ta_location_id}_${lang}_${offset}`;
            const cached = reviewCache.get(cacheKey);

            let reviewResponse: TAReviewsResponse;
            if (cached && isCacheFresh(cached)) {
              reviewResponse = cached.data;
            } else {
              reviewResponse = await getReviews(ta_location_id, lang, 5, offset);
              writeCache(cachePath, cacheKey, reviewResponse);
            }

            // Store reviews
            if (reviewResponse.data && reviewResponse.data.length > 0) {
              const reviewRows = reviewResponse.data.map(review => ({
                hotel_id: id,
                source: 'tripadvisor',
                source_review_id: String(review.id),
                lang: review.lang,
                rating: review.rating,
                title: review.title ?? null,
                text: review.text ?? null,
                trip_type: normalizeReviewTripType(review.trip_type),
                travel_date: review.travel_date ?? null,
                published_date: review.published_date,
                helpful_votes: review.helpful_votes ?? 0,
                reviewer_username: review.user?.username ?? null,
                reviewer_location: review.user?.user_location?.name ?? null,
                reviewer_location_id: (review.user?.user_location?.id && review.user.user_location.id !== 'null')
                  ? review.user.user_location.id : null,
                has_owner_response: !!review.owner_response,
                owner_response_text: review.owner_response?.text ?? null,
                owner_response_author: review.owner_response?.author ?? null,
                owner_response_date: review.owner_response?.published_date ?? null,
                owner_response_lang: review.owner_response?.lang ?? null,
                subratings: normalizeReviewSubratings(review.subratings),
              }));

              const { error: reviewError } = await supabase
                .from('hotel_reviews')
                .upsert(reviewRows, { onConflict: 'hotel_id,source,source_review_id', ignoreDuplicates: true });

              if (reviewError) {
                console.error(`[WARN] Review insert for ${hs_slug} (${lang}): ${reviewError.message}`);
              }
            }
          }
        }
      }

      enriched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] ${hs_slug} (${name}): ${msg}`);
      errors++;
    }

    processed++;
    logger.log(processed, { enriched, errors, apiCalls: getTACallCount() });
  }

  logger.done({ enriched, errors, apiCalls: getTACallCount() });

  await logPipelineEnd(runId, errors > hotels.length / 2 ? 'failed' : 'completed', {
    processed,
    matched: enriched,
    failed: errors,
  });
}

// Allow running standalone
if (process.argv[1]?.includes('02-enrich-tripadvisor')) {
  enrichTripadvisor().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}
