/**
 * Step 5: Compute all derived/calculated fields.
 *
 * For every hotel in Supabase:
 *   - Rating percentages, subrating analysis
 *   - Trip type segments, diversity score
 *   - Cross-platform metrics
 *   - Flags (independent, premium, luxury, international)
 *   - Scores (HQI, TOS, reputation risk, digital presence)
 *   - Review aggregates (from hotel_reviews table)
 *   - Competitive set aggregates (from hotel_competitors)
 *
 * Usage:
 *   tsx scripts/phase0-enrichment/05-compute-derived-fields.ts [--limit N]
 */
import 'dotenv/config';
import { supabase, logPipelineStart, logPipelineEnd } from './lib/supabase.js';
import { ProgressLogger } from './lib/logger.js';
import type { HotelUpsert } from './lib/types.js';

// ── CLI args ──
const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : Infinity;

// ── Compute derived fields for a single hotel ──
function computeDerived(hotel: Record<string, any>, reviewStats: ReviewStats | null): HotelUpsert {
  const derived: HotelUpsert = {};

  // ── Rating percentages ──
  const r1 = hotel.ta_rating_1_count ?? 0;
  const r2 = hotel.ta_rating_2_count ?? 0;
  const r3 = hotel.ta_rating_3_count ?? 0;
  const r4 = hotel.ta_rating_4_count ?? 0;
  const r5 = hotel.ta_rating_5_count ?? 0;
  const totalRatings = r1 + r2 + r3 + r4 + r5;

  if (totalRatings > 0) {
    derived.ta_rating_5_pct = r5 / totalRatings;
    derived.ta_rating_negative_pct = (r1 + r2) / totalRatings;
  }

  // ── Subrating analysis ──
  const subratings: Record<string, number> = {};
  if (hotel.ta_subrating_location != null) subratings['location'] = hotel.ta_subrating_location;
  if (hotel.ta_subrating_sleep != null) subratings['sleep'] = hotel.ta_subrating_sleep;
  if (hotel.ta_subrating_rooms != null) subratings['rooms'] = hotel.ta_subrating_rooms;
  if (hotel.ta_subrating_service != null) subratings['service'] = hotel.ta_subrating_service;
  if (hotel.ta_subrating_value != null) subratings['value'] = hotel.ta_subrating_value;
  if (hotel.ta_subrating_cleanliness != null) subratings['cleanliness'] = hotel.ta_subrating_cleanliness;

  const subValues = Object.values(subratings);
  if (subValues.length > 0) {
    derived.ta_subrating_min = Math.min(...subValues);
    derived.ta_subrating_max = Math.max(...subValues);
    derived.ta_subrating_range = (derived.ta_subrating_max as number) - (derived.ta_subrating_min as number);

    const sorted = Object.entries(subratings).sort((a, b) => a[1] - b[1]);
    derived.ta_subrating_weakest = sorted[0][0];
    derived.ta_subrating_strongest = sorted[sorted.length - 1][0];
  }

  // ── Price level numeric ──
  const plMap: Record<string, number> = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
  if (hotel.ta_price_level) {
    derived.ta_price_level_numeric = plMap[hotel.ta_price_level] ?? null;
  }

  // ── Ranking percentile (lower = better) ──
  if (hotel.ta_ranking != null && hotel.ta_ranking_out_of != null && hotel.ta_ranking_out_of > 0) {
    derived.ta_ranking_percentile = hotel.ta_ranking / hotel.ta_ranking_out_of;
  }

  // ── Trip type analysis ──
  const tripTypes: Record<string, number> = {
    business: hotel.ta_trip_type_business ?? 0,
    couples: hotel.ta_trip_type_couples ?? 0,
    solo: hotel.ta_trip_type_solo ?? 0,
    family: hotel.ta_trip_type_family ?? 0,
    friends: hotel.ta_trip_type_friends ?? 0,
  };
  const ttTotal = Object.values(tripTypes).reduce((a, b) => a + b, 0);
  derived.ta_trip_type_total = ttTotal;

  if (ttTotal > 0) {
    derived.ta_segment_pct_business = tripTypes.business / ttTotal;
    derived.ta_segment_pct_couples = tripTypes.couples / ttTotal;
    derived.ta_segment_pct_solo = tripTypes.solo / ttTotal;
    derived.ta_segment_pct_family = tripTypes.family / ttTotal;
    derived.ta_segment_pct_friends = tripTypes.friends / ttTotal;

    const sortedTT = Object.entries(tripTypes).sort((a, b) => b[1] - a[1]);
    derived.ta_primary_segment = sortedTT[0][0];
    derived.ta_secondary_segment = sortedTT.length > 1 ? sortedTT[1][0] : null;

    // Shannon entropy (diversity measure)
    const pcts = Object.values(tripTypes).map(v => v / ttTotal).filter(v => v > 0);
    derived.ta_segment_diversity = -pcts.reduce((sum, p) => sum + p * Math.log2(p), 0);

    derived.ta_is_business_heavy = (tripTypes.business / ttTotal) > 0.4;
    derived.ta_is_couples_heavy = (tripTypes.couples / ttTotal) > 0.4;
    derived.ta_is_family_heavy = (tripTypes.family / ttTotal) > 0.3;
  }

  // ── Cross-platform ──
  derived.has_dual_platform_presence = hotel.ta_location_id != null && hotel.gp_place_id != null;
  if (hotel.ta_rating != null && hotel.gp_rating != null) {
    derived.rating_divergence_ta_vs_google = Math.round((hotel.ta_rating - hotel.gp_rating) * 10) / 10;
  }
  if (hotel.ta_num_reviews != null && hotel.ta_num_reviews > 0 && hotel.gp_user_rating_count != null) {
    derived.review_count_ratio_google_vs_ta = Math.round((hotel.gp_user_rating_count / hotel.ta_num_reviews) * 100) / 100;
  }

  // ── Flags ──
  derived.flag_is_independent = !hotel.ta_brand && !hotel.ta_parent_brand;
  derived.flag_is_premium = hotel.ta_price_level === '$$$' || hotel.ta_price_level === '$$$$';
  derived.flag_is_luxury = hotel.ta_price_level === '$$$$';

  // International guests: reviews in 3+ languages
  if (reviewStats) {
    derived.flag_has_international_guests = (reviewStats.languageCount ?? 0) >= 3;
    derived.flag_active_reputation_mgmt = (reviewStats.ownerResponseRate ?? 0) > 0.5;
    derived.flag_needs_reputation_mgmt =
      (reviewStats.ownerResponseRate ?? 0) < 0.3 && (derived.ta_rating_negative_pct as number ?? 0) > 0.05;
  }

  // ── Hotel Quality Index (HQI): 0-1 weighted composite ──
  if (hotel.ta_rating != null) {
    const ratingNorm = (hotel.ta_rating - 1) / 4;
    const reviewVolume = Math.min((hotel.ta_num_reviews ?? 0) / 500, 1);
    const consistency = derived.ta_subrating_range != null
      ? 1 - ((derived.ta_subrating_range as number) / 2)
      : 0.5;
    const satisfaction = derived.ta_rating_5_pct as number ?? 0.5;
    const responseRate = reviewStats?.ownerResponseRate ?? 0.5;

    derived.score_hqi = Math.round((
      ratingNorm * 0.35 +
      reviewVolume * 0.20 +
      consistency * 0.20 +
      satisfaction * 0.15 +
      responseRate * 0.10
    ) * 1000) / 1000;
  }

  // ── Tercier Opportunity Score (TOS): how much this hotel needs Tercier ──
  if (hotel.ta_rating != null) {
    const needsHelp = 1 - ((hotel.ta_rating - 1) / 4);
    const hasScale = Math.min((hotel.ta_num_reviews ?? 0) / 200, 1);
    const isIndependent = derived.flag_is_independent ? 0.2 : 0;
    const isPremium = derived.flag_is_premium ? 0.15 : 0;
    const weakValue = derived.ta_subrating_weakest === 'value' ? 0.1 : 0;

    derived.score_tos = Math.round(Math.min(1,
      needsHelp * 0.30 + hasScale * 0.25 + isIndependent + isPremium + weakValue
    ) * 1000) / 1000;
  }

  // ── Reputation Risk Score: 0-1, higher = riskier ──
  derived.score_reputation_risk = Math.round((
    (derived.ta_rating_negative_pct as number ?? 0) * 0.5 +
    (derived.ta_subrating_range != null ? (derived.ta_subrating_range as number) / 2 : 0) * 0.3 +
    (1 - (derived.ta_ranking_percentile as number ?? 0.5)) * 0.2
  ) * 1000) / 1000;

  // ── Digital Presence Score: listing completeness ──
  let filledFields = 0;
  let totalCheckFields = 0;
  const checkFields = [
    'ta_description', 'ta_web_url', 'ta_brand', 'ta_price_level',
    'gp_editorial_summary', 'gp_review_summary_gemini',
    'website_url', 'phone',
  ];
  for (const f of checkFields) {
    totalCheckFields++;
    if (hotel[f]) filledFields++;
  }
  if (hotel.ta_photo_count != null && hotel.ta_photo_count > 0) filledFields++;
  totalCheckFields++;
  if (hotel.ta_num_reviews != null && hotel.ta_num_reviews > 10) filledFields++;
  totalCheckFields++;

  derived.score_digital_presence = Math.round((filledFields / totalCheckFields) * 1000) / 1000;

  // ── Pipeline status ──
  derived.enrichment_status = 'computed';
  derived.computed_at = new Date().toISOString();

  return derived;
}

// ── Review aggregation ──
interface ReviewStats {
  languageCount: number;
  totalCollected: number;
  ownerResponseRate: number;
  ownerResponseCount: number;
  mostRecentDate: string | null;
  topReviewerSource: string | null;
  uniqueSources: number;
}

async function getReviewStats(hotelId: string): Promise<ReviewStats | null> {
  const { data: reviews, error } = await supabase
    .from('hotel_reviews')
    .select('lang, has_owner_response, published_date, reviewer_location')
    .eq('hotel_id', hotelId);

  if (error || !reviews || reviews.length === 0) return null;

  const languages = new Set(reviews.map(r => r.lang));
  const withResponse = reviews.filter(r => r.has_owner_response);
  const dates = reviews
    .map(r => r.published_date)
    .filter(Boolean)
    .sort()
    .reverse();

  // Reviewer source locations
  const locations = reviews
    .map(r => r.reviewer_location)
    .filter(Boolean) as string[];
  const locationCounts = new Map<string, number>();
  for (const loc of locations) {
    locationCounts.set(loc, (locationCounts.get(loc) ?? 0) + 1);
  }
  const topSource = [...locationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    languageCount: languages.size,
    totalCollected: reviews.length,
    ownerResponseRate: reviews.length > 0 ? withResponse.length / reviews.length : 0,
    ownerResponseCount: withResponse.length,
    mostRecentDate: dates[0] ?? null,
    topReviewerSource: topSource,
    uniqueSources: locationCounts.size,
  };
}

// ── Main ──
export default async function computeDerivedFields(): Promise<void> {
  console.log('\n--- Step 5: Compute Derived Fields ---\n');

  // Fetch all hotels that have been enriched
  const { data: hotels, error: fetchError } = await supabase
    .from('hotels')
    .select('*')
    .in('enrichment_status', ['ta_enriched', 'gp_enriched', 'ta_match_failed'])
    .order('hs_slug')
    .limit(LIMIT);

  if (fetchError) {
    throw new Error(`Failed to fetch hotels: ${fetchError.message}`);
  }

  if (!hotels || hotels.length === 0) {
    console.log('No hotels need computation. Run enrichment steps first.');
    return;
  }

  console.log(`Computing derived fields for ${hotels.length} hotels`);

  const logger = new ProgressLogger('Compute', hotels.length, 15);
  const runId = await logPipelineStart('compute_derived', hotels.length);
  let computed = 0;
  let errors = 0;

  for (let i = 0; i < hotels.length; i++) {
    const hotel = hotels[i];

    try {
      // Get review stats for this hotel
      const reviewStats = await getReviewStats(hotel.id);

      // Compute all derived fields
      const derived = computeDerived(hotel, reviewStats);

      // Update hotel
      const { error: updateError } = await supabase
        .from('hotels')
        .update(derived)
        .eq('id', hotel.id);

      if (updateError) {
        console.error(`[ERROR] Update failed for ${hotel.hs_slug}: ${updateError.message}`);
        errors++;
        continue;
      }

      // Also update hotel_lang_ratings aggregates
      if (reviewStats && reviewStats.totalCollected > 0) {
        // Fetch per-language averages
        const { data: langData } = await supabase
          .from('hotel_reviews')
          .select('lang, rating')
          .eq('hotel_id', hotel.id)
          .not('rating', 'is', null);

        if (langData && langData.length > 0) {
          const langGroups = new Map<string, number[]>();
          for (const r of langData) {
            const group = langGroups.get(r.lang) ?? [];
            group.push(r.rating);
            langGroups.set(r.lang, group);
          }

          const langRatingRows = [...langGroups.entries()].map(([lang, ratings]) => ({
            hotel_id: hotel.id,
            lang,
            avg_rating: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100,
            review_count: ratings.length,
          }));

          await supabase
            .from('hotel_lang_ratings')
            .upsert(langRatingRows, { onConflict: 'hotel_id,lang' });
        }
      }

      // Create enrichment snapshot (for temporal tracking)
      await supabase
        .from('enrichment_snapshots')
        .upsert({
          hotel_id: hotel.id,
          snapshot_date: new Date().toISOString().split('T')[0],
          ta_rating: hotel.ta_rating,
          ta_num_reviews: hotel.ta_num_reviews,
          gp_rating: hotel.gp_rating,
          gp_user_rating_count: hotel.gp_user_rating_count,
          ta_ranking: hotel.ta_ranking,
          ta_ranking_out_of: hotel.ta_ranking_out_of,
          ta_subrating_location: hotel.ta_subrating_location,
          ta_subrating_sleep: hotel.ta_subrating_sleep,
          ta_subrating_rooms: hotel.ta_subrating_rooms,
          ta_subrating_service: hotel.ta_subrating_service,
          ta_subrating_value: hotel.ta_subrating_value,
          ta_subrating_cleanliness: hotel.ta_subrating_cleanliness,
          ta_trip_type_business: hotel.ta_trip_type_business,
          ta_trip_type_couples: hotel.ta_trip_type_couples,
          ta_trip_type_solo: hotel.ta_trip_type_solo,
          ta_trip_type_family: hotel.ta_trip_type_family,
          ta_trip_type_friends: hotel.ta_trip_type_friends,
          score_hqi: derived.score_hqi as number ?? null,
          score_tos: derived.score_tos as number ?? null,
        }, { onConflict: 'hotel_id,snapshot_date' });

      computed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] ${hotel.hs_slug}: ${msg}`);
      errors++;
    }

    logger.log(i + 1, { computed, errors });
  }

  logger.done({ computed, errors });

  await logPipelineEnd(runId, errors > hotels.length / 2 ? 'failed' : 'completed', {
    processed: hotels.length,
    matched: computed,
    failed: errors,
  });
}

// Allow running standalone
if (process.argv[1]?.includes('05-compute-derived')) {
  computeDerivedFields().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}
