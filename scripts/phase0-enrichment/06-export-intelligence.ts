/**
 * Step 6: Export hotel intelligence from Supabase to CSV.
 *
 * Produces a CSV with 114 columns matching the sample-10-hotels-core.csv format.
 * Also generates summary statistics.
 *
 * Usage:
 *   tsx scripts/phase0-enrichment/06-export-intelligence.ts [--limit N] [--output path]
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { stringify } from 'csv-stringify/sync';
import { supabase, logPipelineStart, logPipelineEnd } from './lib/supabase.js';

// ── CLI args ──
const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;
const outputArg = args.indexOf('--output');
const today = new Date().toISOString().split('T')[0];
const OUTPUT_PATH = outputArg !== -1
  ? resolve(args[outputArg + 1])
  : resolve(process.cwd(), `output/phase0-intelligence-${today}.csv`);

// ── CSV Column Definitions ──
// Must match sample-10-hotels-core.csv format exactly
const CSV_COLUMNS = [
  'hotel_name', 'city', 'country', 'latitude', 'longitude',
  'ta_location_id', 'gp_place_id', 'ta_timezone', 'website_url', 'phone',
  'ta_street', 'ta_city', 'ta_country', 'ta_postalcode', 'ta_address_string',
  'gp_formatted_address', 'gp_short_address',
  'ta_brand', 'ta_parent_brand', 'is_independent', 'is_luxury',
  'ta_category', 'ta_price_level',
  'ta_rating', 'ta_num_reviews', 'ta_photo_count',
  'ta_rating_1_count', 'ta_rating_2_count', 'ta_rating_3_count', 'ta_rating_4_count', 'ta_rating_5_count',
  'ta_rating_5_pct', 'ta_rating_negative_pct',
  'gp_rating', 'gp_user_rating_count', 'gp_business_status',
  'gp_editorial_summary', 'gp_review_summary_gemini',
  'ta_subrating_location', 'ta_subrating_sleep', 'ta_subrating_room', 'ta_subrating_service',
  'ta_subrating_value', 'ta_subrating_cleanliness',
  'ta_subrating_min', 'ta_subrating_max', 'ta_subrating_range',
  'ta_subrating_weakest', 'ta_subrating_strongest',
  'ta_ranking', 'ta_ranking_out_of', 'ta_ranking_geo', 'ta_ranking_string', 'ta_ranking_percentile',
  'ta_trip_type_business', 'ta_trip_type_couples', 'ta_trip_type_solo', 'ta_trip_type_family', 'ta_trip_type_friends',
  'ta_segment_pct_business', 'ta_segment_pct_couples', 'ta_segment_pct_solo', 'ta_segment_pct_family', 'ta_segment_pct_friends',
  'ta_primary_segment', 'ta_segment_diversity',
  'ta_amenity_count',
  'ta_has_spa', 'ta_has_pool', 'ta_has_restaurant', 'ta_has_free_wifi', 'ta_has_ev_charging',
  'ta_has_butler_service', 'ta_has_concierge', 'ta_has_meeting_rooms', 'ta_has_parking', 'ta_has_pet_friendly',
  'ta_has_fitness', 'ta_has_bar', 'ta_has_room_service', 'ta_has_suites', 'ta_has_accessible_rooms',
  'ta_has_airport_shuttle', 'ta_has_laundry', 'ta_has_minibar', 'ta_has_air_conditioning', 'ta_has_babysitting',
  'ta_has_tennis', 'ta_has_golf', 'ta_has_sauna', 'ta_has_kids_club', 'ta_has_casino', 'ta_has_beach', 'ta_has_ski',
  'gp_allows_dogs', 'gp_good_for_children', 'gp_wheelchair_parking', 'gp_wheelchair_entrance',
  'gp_landmarks', 'gp_landmark_count', 'gp_areas',
  'review_language_count', 'review_total_collected', 'reviewer_top_source', 'reviewer_unique_sources',
  'owner_response_rate', 'owner_response_count',
  'ta_most_recent_review', 'flag_active_reputation_mgmt',
  'rating_divergence_ta_vs_google', 'review_count_ratio_google_vs_ta', 'has_dual_platform',
  'ta_awards', 'ta_award_count',
];

// ── Format landmarks JSONB to pipe-separated string ──
function formatLandmarks(landmarks: any): string {
  if (!landmarks || !Array.isArray(landmarks)) return '';
  return landmarks
    .map((l: any) => `${l.name} (${l.distance_m ? Math.round(l.distance_m) + 'm' : '?'})`)
    .join(' | ');
}

function formatAreas(areas: any): string {
  if (!areas || !Array.isArray(areas)) return '';
  return areas.map((a: any) => a.name).join(' | ');
}

function formatAwards(awards: any): string {
  if (!awards || !Array.isArray(awards)) return '';
  return awards.map((a: any) => `${a.name ?? a.type} ${a.year}`).join(' | ');
}

// ── Main ──
export default async function exportIntelligence(): Promise<void> {
  console.log('\n--- Step 6: Export Intelligence to CSV ---\n');

  // Fetch all computed hotels
  const { data: hotels, error: fetchError } = await supabase
    .from('hotels')
    .select('*')
    .eq('enrichment_status', 'computed')
    .order('score_tos', { ascending: false, nullsFirst: false })
    .limit(LIMIT);

  if (fetchError) {
    throw new Error(`Failed to fetch hotels: ${fetchError.message}`);
  }

  if (!hotels || hotels.length === 0) {
    console.log('No computed hotels to export. Run step 5 first.');
    return;
  }

  console.log(`Exporting ${hotels.length} hotels to CSV`);

  const runId = await logPipelineStart('export_csv', hotels.length);

  // Fetch amenity counts per hotel
  const { data: amenityCounts } = await supabase
    .from('hotel_amenities')
    .select('hotel_id, amenity, category')
    .in('hotel_id', hotels.map(h => h.id));

  const amenityMap = new Map<string, { count: number; categories: Set<string> }>();
  if (amenityCounts) {
    for (const a of amenityCounts) {
      const entry = amenityMap.get(a.hotel_id) ?? { count: 0, categories: new Set() };
      entry.count++;
      if (a.category) entry.categories.add(a.category);
      amenityMap.set(a.hotel_id, entry);
    }
  }

  // Fetch review stats per hotel
  const { data: reviewData } = await supabase
    .from('hotel_reviews')
    .select('hotel_id, lang, has_owner_response, published_date, reviewer_location')
    .in('hotel_id', hotels.map(h => h.id));

  const reviewMap = new Map<string, {
    langCount: number;
    total: number;
    ownerResponseRate: number;
    ownerResponseCount: number;
    mostRecent: string | null;
    topSource: string | null;
    uniqueSources: number;
  }>();

  if (reviewData) {
    const byHotel = new Map<string, typeof reviewData>();
    for (const r of reviewData) {
      const arr = byHotel.get(r.hotel_id) ?? [];
      arr.push(r);
      byHotel.set(r.hotel_id, arr);
    }

    for (const [hotelId, reviews] of byHotel.entries()) {
      const langs = new Set(reviews.map(r => r.lang));
      const responses = reviews.filter(r => r.has_owner_response);
      const dates = reviews.map(r => r.published_date).filter(Boolean).sort().reverse();
      const locations = reviews.map(r => r.reviewer_location).filter(Boolean) as string[];
      const locCounts = new Map<string, number>();
      for (const loc of locations) locCounts.set(loc, (locCounts.get(loc) ?? 0) + 1);
      const topLoc = [...locCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      reviewMap.set(hotelId, {
        langCount: langs.size,
        total: reviews.length,
        ownerResponseRate: reviews.length > 0 ? Math.round((responses.length / reviews.length) * 1000) / 1000 : 0,
        ownerResponseCount: responses.length,
        mostRecent: dates[0] ?? null,
        topSource: topLoc,
        uniqueSources: locCounts.size,
      });
    }
  }

  // Build CSV rows
  const rows: Record<string, unknown>[] = [];

  for (const h of hotels) {
    const amenities = amenityMap.get(h.id);
    const reviews = reviewMap.get(h.id);
    const categories = amenities?.categories ?? new Set();

    const rankingString = h.ta_ranking && h.ta_ranking_out_of && h.ta_ranking_geo
      ? `#${h.ta_ranking} of ${h.ta_ranking_out_of} hotels in ${h.ta_ranking_geo}`
      : '';

    const awards = h.ta_awards ?? [];

    const row: Record<string, unknown> = {
      hotel_name: h.name,
      city: h.city,
      country: h.country,
      latitude: h.latitude,
      longitude: h.longitude,
      ta_location_id: h.ta_location_id,
      gp_place_id: h.gp_place_id,
      ta_timezone: h.timezone,
      website_url: h.website_url,
      phone: h.phone,
      ta_street: h.ta_street1,
      ta_city: h.ta_city,
      ta_country: h.ta_country,
      ta_postalcode: h.ta_postalcode,
      ta_address_string: h.ta_address_string,
      gp_formatted_address: h.gp_formatted_address,
      gp_short_address: h.gp_short_address,
      ta_brand: h.ta_brand,
      ta_parent_brand: h.ta_parent_brand,
      is_independent: h.flag_is_independent,
      is_luxury: h.flag_is_luxury,
      ta_category: h.ta_category,
      ta_price_level: h.ta_price_level,
      ta_rating: h.ta_rating,
      ta_num_reviews: h.ta_num_reviews,
      ta_photo_count: h.ta_photo_count,
      ta_rating_1_count: h.ta_rating_1_count,
      ta_rating_2_count: h.ta_rating_2_count,
      ta_rating_3_count: h.ta_rating_3_count,
      ta_rating_4_count: h.ta_rating_4_count,
      ta_rating_5_count: h.ta_rating_5_count,
      ta_rating_5_pct: h.ta_rating_5_pct != null ? Math.round(h.ta_rating_5_pct * 10000) / 10000 : '',
      ta_rating_negative_pct: h.ta_rating_negative_pct != null ? Math.round(h.ta_rating_negative_pct * 10000) / 10000 : '',
      gp_rating: h.gp_rating,
      gp_user_rating_count: h.gp_user_rating_count,
      gp_business_status: h.gp_business_status,
      gp_editorial_summary: h.gp_editorial_summary,
      gp_review_summary_gemini: h.gp_review_summary_gemini,
      ta_subrating_location: h.ta_subrating_location,
      ta_subrating_sleep: h.ta_subrating_sleep,
      ta_subrating_room: h.ta_subrating_rooms,
      ta_subrating_service: h.ta_subrating_service,
      ta_subrating_value: h.ta_subrating_value,
      ta_subrating_cleanliness: h.ta_subrating_cleanliness,
      ta_subrating_min: h.ta_subrating_min,
      ta_subrating_max: h.ta_subrating_max,
      ta_subrating_range: h.ta_subrating_range,
      ta_subrating_weakest: h.ta_subrating_weakest,
      ta_subrating_strongest: h.ta_subrating_strongest,
      ta_ranking: h.ta_ranking,
      ta_ranking_out_of: h.ta_ranking_out_of,
      ta_ranking_geo: h.ta_ranking_geo,
      ta_ranking_string: rankingString,
      ta_ranking_percentile: h.ta_ranking_percentile != null ? Math.round(h.ta_ranking_percentile * 10000) / 10000 : '',
      ta_trip_type_business: h.ta_trip_type_business,
      ta_trip_type_couples: h.ta_trip_type_couples,
      ta_trip_type_solo: h.ta_trip_type_solo,
      ta_trip_type_family: h.ta_trip_type_family,
      ta_trip_type_friends: h.ta_trip_type_friends,
      ta_segment_pct_business: h.ta_segment_pct_business != null ? Math.round(h.ta_segment_pct_business * 10000) / 10000 : '',
      ta_segment_pct_couples: h.ta_segment_pct_couples != null ? Math.round(h.ta_segment_pct_couples * 10000) / 10000 : '',
      ta_segment_pct_solo: h.ta_segment_pct_solo != null ? Math.round(h.ta_segment_pct_solo * 10000) / 10000 : '',
      ta_segment_pct_family: h.ta_segment_pct_family != null ? Math.round(h.ta_segment_pct_family * 10000) / 10000 : '',
      ta_segment_pct_friends: h.ta_segment_pct_friends != null ? Math.round(h.ta_segment_pct_friends * 10000) / 10000 : '',
      ta_primary_segment: h.ta_primary_segment,
      ta_segment_diversity: h.ta_segment_diversity != null ? Math.round(h.ta_segment_diversity * 1000) / 1000 : '',
      ta_amenity_count: amenities?.count ?? 0,
      ta_has_spa: categories.has('spa'),
      ta_has_pool: categories.has('pool'),
      ta_has_restaurant: categories.has('restaurant'),
      ta_has_free_wifi: categories.has('free_wifi'),
      ta_has_ev_charging: categories.has('ev_charging'),
      ta_has_butler_service: categories.has('butler_service'),
      ta_has_concierge: categories.has('concierge'),
      ta_has_meeting_rooms: categories.has('meeting_rooms'),
      ta_has_parking: categories.has('parking'),
      ta_has_pet_friendly: categories.has('pet_friendly'),
      ta_has_fitness: categories.has('fitness'),
      ta_has_bar: categories.has('bar'),
      ta_has_room_service: categories.has('room_service'),
      ta_has_suites: categories.has('suites'),
      ta_has_accessible_rooms: categories.has('accessible'),
      ta_has_airport_shuttle: categories.has('airport_shuttle'),
      ta_has_laundry: categories.has('laundry'),
      ta_has_minibar: categories.has('minibar'),
      ta_has_air_conditioning: categories.has('air_conditioning'),
      ta_has_babysitting: categories.has('babysitting'),
      ta_has_tennis: categories.has('tennis'),
      ta_has_golf: categories.has('golf'),
      ta_has_sauna: categories.has('sauna'),
      ta_has_kids_club: categories.has('kids_club'),
      ta_has_casino: categories.has('casino'),
      ta_has_beach: categories.has('beach'),
      ta_has_ski: categories.has('ski'),
      gp_allows_dogs: h.gp_allows_dogs,
      gp_good_for_children: h.gp_good_for_children,
      gp_wheelchair_parking: h.gp_wheelchair_parking,
      gp_wheelchair_entrance: h.gp_wheelchair_entrance,
      gp_landmarks: formatLandmarks(h.gp_landmarks),
      gp_landmark_count: Array.isArray(h.gp_landmarks) ? h.gp_landmarks.length : 0,
      gp_areas: formatAreas(h.gp_areas),
      review_language_count: reviews?.langCount ?? 0,
      review_total_collected: reviews?.total ?? 0,
      reviewer_top_source: reviews?.topSource ?? '',
      reviewer_unique_sources: reviews?.uniqueSources ?? 0,
      owner_response_rate: reviews?.ownerResponseRate ?? '',
      owner_response_count: reviews?.ownerResponseCount ?? 0,
      ta_most_recent_review: reviews?.mostRecent ?? '',
      flag_active_reputation_mgmt: h.flag_active_reputation_mgmt ?? false,
      rating_divergence_ta_vs_google: h.rating_divergence_ta_vs_google,
      review_count_ratio_google_vs_ta: h.review_count_ratio_google_vs_ta,
      has_dual_platform: h.has_dual_platform_presence ?? false,
      ta_awards: formatAwards(awards),
      ta_award_count: Array.isArray(awards) ? awards.length : 0,
    };

    rows.push(row);
  }

  // Write CSV
  const outputDir = dirname(OUTPUT_PATH);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const csvContent = stringify(rows, {
    header: true,
    columns: CSV_COLUMNS,
    bom: true,
  });

  writeFileSync(OUTPUT_PATH, csvContent);
  console.log(`\nExported ${rows.length} hotels to ${OUTPUT_PATH}`);

  // ── Summary Statistics ──
  const withTA = rows.filter(r => r.ta_location_id).length;
  const withGP = rows.filter(r => r.gp_place_id).length;
  const withBoth = rows.filter(r => r.ta_location_id && r.gp_place_id).length;
  const withRating = rows.filter(r => typeof r.ta_rating === 'number').length;
  const avgRating = rows.reduce((sum, r) => sum + (typeof r.ta_rating === 'number' ? r.ta_rating : 0), 0) / (withRating || 1);
  const luxury = rows.filter(r => r.is_luxury).length;
  const independent = rows.filter(r => r.is_independent).length;

  console.log(`\n${'='.repeat(50)}`);
  console.log('  EXPORT SUMMARY');
  console.log(`${'='.repeat(50)}`);
  console.log(`  Total hotels:           ${rows.length}`);
  console.log(`  With TripAdvisor:       ${withTA} (${((withTA / rows.length) * 100).toFixed(1)}%)`);
  console.log(`  With Google Places:     ${withGP} (${((withGP / rows.length) * 100).toFixed(1)}%)`);
  console.log(`  Dual-platform:          ${withBoth} (${((withBoth / rows.length) * 100).toFixed(1)}%)`);
  console.log(`  With TA rating:         ${withRating}`);
  console.log(`  Average TA rating:      ${avgRating.toFixed(2)}`);
  console.log(`  Luxury ($$$$):          ${luxury}`);
  console.log(`  Independent:            ${independent}`);
  console.log(`${'='.repeat(50)}\n`);

  await logPipelineEnd(runId, 'completed', {
    processed: rows.length,
    matched: rows.length,
    failed: 0,
  });
}

// Allow running standalone
if (process.argv[1]?.includes('06-export-intelligence')) {
  exportIntelligence().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}
