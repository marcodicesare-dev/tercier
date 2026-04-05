import type { HotelUpsert } from '../phase0-enrichment/lib/types.js';
import { diffDaysFromToday, maxValue, mean, minValue, priceLevelToNumeric, shannonEntropy, sum } from './utils.js';

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function computeDerivedFields(hotel: HotelUpsert): HotelUpsert {
  const ratingCounts = [
    toNumber(hotel.ta_rating_1_count),
    toNumber(hotel.ta_rating_2_count),
    toNumber(hotel.ta_rating_3_count),
    toNumber(hotel.ta_rating_4_count),
    toNumber(hotel.ta_rating_5_count),
  ];
  const totalRatings = sum(ratingCounts);
  const subratings = {
    location: toNumber(hotel.ta_subrating_location),
    sleep: toNumber(hotel.ta_subrating_sleep),
    rooms: toNumber(hotel.ta_subrating_rooms),
    service: toNumber(hotel.ta_subrating_service),
    value: toNumber(hotel.ta_subrating_value),
    cleanliness: toNumber(hotel.ta_subrating_cleanliness),
  };
  const subratingEntries = Object.entries(subratings).filter(([, value]) => typeof value === 'number') as Array<[string, number]>;
  const tripCounts = {
    business: toNumber(hotel.ta_trip_type_business) ?? 0,
    couples: toNumber(hotel.ta_trip_type_couples) ?? 0,
    solo: toNumber(hotel.ta_trip_type_solo) ?? 0,
    family: toNumber(hotel.ta_trip_type_family) ?? 0,
    friends: toNumber(hotel.ta_trip_type_friends) ?? 0,
  };
  const tripTotal = Object.values(tripCounts).reduce((total, value) => total + value, 0);
  const tripPercentages = {
    business: tripTotal ? tripCounts.business / tripTotal : null,
    couples: tripTotal ? tripCounts.couples / tripTotal : null,
    solo: tripTotal ? tripCounts.solo / tripTotal : null,
    family: tripTotal ? tripCounts.family / tripTotal : null,
    friends: tripTotal ? tripCounts.friends / tripTotal : null,
  };
  const sortedSegments = Object.entries(tripCounts).sort((left, right) => right[1] - left[1]);
  const weakest = subratingEntries.length ? [...subratingEntries].sort((left, right) => left[1] - right[1])[0] : null;
  const strongest = subratingEntries.length ? [...subratingEntries].sort((left, right) => right[1] - left[1])[0] : null;
  const reviewLanguageCount = toNumber(hotel.ta_review_language_count);
  const responseRate = toNumber(hotel.ta_owner_response_rate);
  const negativePct =
    totalRatings > 0
      ? ((toNumber(hotel.ta_rating_1_count) ?? 0) + (toNumber(hotel.ta_rating_2_count) ?? 0)) / totalRatings
      : null;
  const rating5Pct = totalRatings > 0 ? (toNumber(hotel.ta_rating_5_count) ?? 0) / totalRatings : null;
  const range =
    weakest && strongest
      ? strongest[1] - weakest[1]
      : null;
  const taRating = toNumber(hotel.ta_rating);
  const gpRating = toNumber(hotel.gp_rating);
  const bkRating = toNumber(hotel.bk_rating);
  const taReviews = toNumber(hotel.ta_num_reviews);
  const gpReviews = toNumber(hotel.gp_user_rating_count);
  const ranking = toNumber(hotel.ta_ranking);
  const rankingOutOf = toNumber(hotel.ta_ranking_out_of);
  const priceNumeric = priceLevelToNumeric(hotel.ta_price_level as string | null | undefined);
  const digitalFields = [
    hotel.website_url,
    hotel.phone,
    hotel.ta_photo_count,
    hotel.gp_photo_count,
    hotel.dp_website_tech_cms,
    hotel.dp_website_tech_booking,
    hotel.dp_website_tech_analytics,
    hotel.dp_instagram_handle,
    hotel.seo_domain_authority,
    hotel.seo_monthly_traffic_est,
    hotel.price_direct,
    hotel.price_booking_com,
  ];
  const digitalFilled = digitalFields.filter(value => value != null && value !== '').length;
  const digitalPresence = digitalFields.length ? digitalFilled / digitalFields.length : null;

  const scoreHqi =
    taRating != null
      ? Math.min(
          1,
          0.35 * ((taRating - 1) / 4) +
            0.2 * Math.min((taReviews ?? 0) / 500, 1) +
            0.2 * (range != null ? Math.max(0, 1 - range / 2) : 0.5) +
            0.15 * (rating5Pct ?? 0) +
            0.1 * (responseRate ?? 0),
        )
      : null;

  const scoreTos =
    taRating != null
      ? Math.min(
          1,
          0.3 * (1 - (taRating - 1) / 4) +
            0.25 * Math.min((taReviews ?? 0) / 200, 1) +
            ((!(hotel.ta_brand as string | null | undefined) && !(hotel.ta_parent_brand as string | null | undefined)) ? 0.2 : 0) +
            ((priceNumeric != null && priceNumeric >= 3) ? 0.15 : 0) +
            (weakest?.[0] === 'value' ? 0.1 : 0),
        )
      : null;

  return {
    ta_rating_5_pct: rating5Pct,
    ta_rating_negative_pct: negativePct,
    ta_subrating_min: minValue(Object.values(subratings)),
    ta_subrating_max: maxValue(Object.values(subratings)),
    ta_subrating_range: range,
    ta_subrating_weakest: weakest?.[0] ?? null,
    ta_subrating_strongest: strongest?.[0] ?? null,
    ta_price_level_numeric: priceNumeric,
    ta_ranking_percentile: ranking != null && rankingOutOf ? ranking / rankingOutOf : null,
    ta_trip_type_total: tripTotal || null,
    ta_segment_pct_business: tripPercentages.business,
    ta_segment_pct_couples: tripPercentages.couples,
    ta_segment_pct_solo: tripPercentages.solo,
    ta_segment_pct_family: tripPercentages.family,
    ta_segment_pct_friends: tripPercentages.friends,
    ta_primary_segment: sortedSegments[0]?.[1] ? sortedSegments[0][0] : null,
    ta_secondary_segment: sortedSegments[1]?.[1] ? sortedSegments[1][0] : null,
    ta_segment_diversity: shannonEntropy(Object.values(tripPercentages).filter((value): value is number => typeof value === 'number')),
    ta_is_business_heavy: tripPercentages.business != null ? tripPercentages.business > 0.4 : null,
    ta_is_couples_heavy: tripPercentages.couples != null ? tripPercentages.couples > 0.4 : null,
    ta_is_family_heavy: tripPercentages.family != null ? tripPercentages.family > 0.3 : null,
    ta_review_recency_days: diffDaysFromToday(hotel.ta_review_most_recent_date as string | null | undefined),
    rating_divergence_ta_vs_google: taRating != null && gpRating != null ? taRating - gpRating : null,
    rating_divergence_ta_vs_bk: taRating != null && bkRating != null ? taRating - bkRating : null,
    review_count_ratio_google_vs_ta: taReviews && gpReviews != null ? gpReviews / taReviews : null,
    has_dual_platform_presence: Boolean(hotel.ta_location_id && hotel.gp_place_id),
    flag_is_independent: !(hotel.ta_brand as string | null | undefined) && !(hotel.ta_parent_brand as string | null | undefined),
    flag_is_premium: priceNumeric != null ? priceNumeric >= 3 : null,
    flag_is_luxury: priceNumeric != null ? priceNumeric === 4 : null,
    flag_has_international_guests: reviewLanguageCount != null ? reviewLanguageCount >= 3 : null,
    flag_needs_reputation_mgmt: responseRate != null && negativePct != null ? responseRate < 0.3 && negativePct > 0.05 : null,
    flag_active_reputation_mgmt: responseRate != null ? responseRate > 0.5 : null,
    score_hqi: scoreHqi,
    score_tos: scoreTos,
    score_reputation_risk:
      negativePct != null
        ? 0.5 * negativePct + 0.3 * ((range ?? 0) / 2) + 0.2 * (ranking != null && rankingOutOf ? 1 - ranking / rankingOutOf : 0)
        : null,
    score_digital_presence: digitalPresence,
    score_cps_rating:
      taRating != null && toNumber(hotel.ta_compset_avg_rating) != null
        ? taRating - (toNumber(hotel.ta_compset_avg_rating) as number)
        : null,
    score_cps_visibility:
      taReviews != null && toNumber(hotel.ta_compset_avg_reviews) != null && (toNumber(hotel.ta_compset_avg_reviews) as number) > 0
        ? taReviews / (toNumber(hotel.ta_compset_avg_reviews) as number)
        : null,
    score_cps_amenity_advantage: null,
    score_cps_amenity_gaps: null,
    flag_tercier_high_priority: scoreTos != null ? scoreTos > 0.7 : null,
    cert_gstc: toBoolean(hotel.cert_gstc) ?? false,
    cert_gstc_body: hotel.cert_gstc ? hotel.cert_gstc_body ?? null : null,
    cert_gstc_expiry: hotel.cert_gstc ? hotel.cert_gstc_expiry ?? null : null,
    cert_green_key: toBoolean(hotel.cert_green_key) ?? false,
    cert_swisstainable: hotel.cert_swisstainable ?? null,
    computed_at: new Date().toISOString(),
  };
}
