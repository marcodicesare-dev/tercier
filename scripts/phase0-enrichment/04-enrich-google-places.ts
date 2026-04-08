/**
 * Step 4: Enrich matched hotels with Google Place Details.
 *
 * For each hotel with gp_place_id in Supabase:
 *   - Fetch Place Details (Enterprise+Atmosphere field mask)
 *   - Parse editorial summary, landmarks, areas, accessibility, pet/family flags
 *   - Store Google reviews (max 5) in hotel_reviews table
 *
 * Usage:
 *   tsx scripts/phase0-enrichment/04-enrich-google-places.ts [--limit N]
 */
import 'dotenv/config';
import { resolve } from 'path';
import { fetchAllRows, supabase, logPipelineStart, logPipelineEnd } from './lib/supabase.js';
import { getPlaceDetails, getGPCallCount } from './lib/google-places-client.js';
import { readCache, writeCache, isCacheFresh } from './lib/cache.js';
import { ProgressLogger } from './lib/logger.js';
import type { GPPlaceDetails, HotelUpsert } from './lib/types.js';

// ── Config ──
const CACHE_PATH = resolve(process.cwd(), 'scripts/phase0-enrichment/cache/gp-details.jsonl');

// ── CLI args ──
const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

// ── Parse Google Place Details ──
function parseGoogleDetails(raw: GPPlaceDetails): HotelUpsert {
  const landmarks = raw.addressDescriptor?.landmarks?.map(l => ({
    name: l.displayName.text,
    distance_m: l.straightLineDistanceMeters,
  })) ?? [];

  const areas = raw.addressDescriptor?.areas?.map(a => ({
    name: a.displayName.text,
    containment: a.containment,
  })) ?? [];

  return {
    gp_name: raw.displayName?.text ?? null,
    gp_rating: raw.rating ?? null,
    gp_user_rating_count: raw.userRatingCount ?? null,
    gp_primary_type: raw.primaryType ?? null,
    gp_business_status: raw.businessStatus ?? null,
    gp_editorial_summary: raw.editorialSummary?.text ?? null,
    gp_review_summary_gemini: raw.reviewSummary?.text ?? null,
    gp_formatted_address: raw.formattedAddress ?? null,
    gp_short_address: raw.shortFormattedAddress ?? null,
    gp_allows_dogs: raw.allowsDogs ?? null,
    gp_good_for_children: raw.goodForChildren ?? null,
    gp_wheelchair_parking: raw.accessibilityOptions?.wheelchairAccessibleParking ?? null,
    gp_wheelchair_entrance: raw.accessibilityOptions?.wheelchairAccessibleEntrance ?? null,
    gp_photo_count: raw.photos?.length ?? null,
    gp_landmarks: landmarks,
    gp_areas: areas,
    gp_enriched_at: new Date().toISOString(),
  };
}

// ── Main ──
export default async function enrichGooglePlaces(): Promise<void> {
  console.log('\n--- Step 4: Enrich Hotels with Google Place Details ---\n');

  // Fetch hotels with gp_place_id that haven't been enriched yet
  const hotels = await fetchAllRows((from, to) =>
    supabase
      .from('hotels')
      .select('id, hs_slug, name, gp_place_id, enrichment_status')
      .not('gp_place_id', 'is', null)
      .is('gp_enriched_at', null)
      .order('hs_slug')
      .range(from, to),
  LIMIT);

  if (!hotels || hotels.length === 0) {
    console.log('No hotels need Google enrichment. All done or run step 3 first.');
    return;
  }

  console.log(`Found ${hotels.length} hotels to enrich with Google Places`);
  console.log(`Estimated cost: $${((hotels.length / 1000) * 25).toFixed(2)} (Enterprise+Atmosphere tier)`);

  // Load cache
  const cache = readCache<GPPlaceDetails>(CACHE_PATH);
  console.log(`Cache: ${cache.size} entries loaded`);

  const logger = new ProgressLogger('GP Enrich', hotels.length, 15);
  const runId = await logPipelineStart('enrich_gp', hotels.length);
  let enriched = 0;
  let errors = 0;
  let cached = 0;
  let processed = 0;

  for (const hotel of hotels) {
    const { id, hs_slug, name, gp_place_id } = hotel;

    try {
      // Check cache
      const cacheEntry = cache.get(gp_place_id);
      let details: GPPlaceDetails;

      if (cacheEntry && isCacheFresh(cacheEntry)) {
        details = cacheEntry.data;
        cached++;
      } else {
        details = await getPlaceDetails(gp_place_id);
        writeCache(CACHE_PATH, gp_place_id, details);
      }

      // Parse and update hotel
      const parsed = parseGoogleDetails(details);

      // Update enrichment status
      const currentStatus = hotel.enrichment_status;
      if (currentStatus === 'ta_enriched') {
        parsed.enrichment_status = 'gp_enriched';
      }
      // If TA match failed but Google enriched, status stays as is for now

      const { error: updateError } = await supabase
        .from('hotels')
        .update(parsed)
        .eq('id', id);

      if (updateError) {
        console.error(`[ERROR] Update failed for ${hs_slug}: ${updateError.message}`);
        errors++;
        continue;
      }

      // Store Google reviews (max 5)
      if (details.reviews && details.reviews.length > 0) {
        const reviewRows = details.reviews.map((review, idx) => ({
          hotel_id: id,
          source: 'google',
          source_review_id: review.name || `gp_${gp_place_id}_${idx}`,
          lang: review.originalText?.languageCode ?? review.text?.languageCode ?? 'en',
          rating: review.rating,
          title: null,
          text: review.originalText?.text ?? review.text?.text ?? null,
          trip_type: null,   // Google doesn't have trip types
          travel_date: null,
          published_date: review.publishTime ?? null,
          helpful_votes: 0,
          reviewer_username: review.authorAttribution?.displayName ?? null,
          reviewer_location: null,
          reviewer_location_id: null,
          has_owner_response: false,
          owner_response_text: null,
          owner_response_author: null,
          owner_response_date: null,
          owner_response_lang: null,
          subratings: null,
        }));

        const { error: reviewError } = await supabase
          .from('hotel_reviews')
          .upsert(reviewRows, { onConflict: 'hotel_id,source,source_review_id', ignoreDuplicates: true });

        if (reviewError) {
          console.error(`[WARN] Review insert for ${hs_slug}: ${reviewError.message}`);
        }
      }

      enriched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] ${hs_slug} (${name}): ${msg}`);
      errors++;
    }

    processed++;
    logger.log(processed, { enriched, errors, cached, apiCalls: getGPCallCount() });
  }

  logger.done({ enriched, errors, cached, apiCalls: getGPCallCount() });

  await logPipelineEnd(runId, errors > hotels.length / 2 ? 'failed' : 'completed', {
    processed,
    matched: enriched,
    failed: errors,
  });

  console.log(`\nActual API cost: $${((getGPCallCount() / 1000) * 25).toFixed(2)}`);
}

// Allow running standalone
if (process.argv[1]?.includes('04-enrich-google-places')) {
  enrichGooglePlaces().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}
