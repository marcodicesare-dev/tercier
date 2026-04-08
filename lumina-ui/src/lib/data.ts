import 'server-only';

import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type {
  ContentSeedRow,
  GuestPersonaDeepDiveData,
  GuestPersonaRow,
  HotelCardData,
  HotelChangeRow,
  HotelDashboardRow,
  HotelAmenityRow,
  HotelMetricSnapshotRow,
  HotelPriceSnapshotRow,
  HotelQnaRow,
  HotelTopicRow,
  LanguageBreakdownRow,
  ReviewTimelineRow,
  CompetitorNetworkRow,
  SemanticReviewMatchRow,
  SemanticReviewQueryResult,
} from '@/lib/types';

const SEMANTIC_REVIEW_QUERIES: Array<{ label: string; query: string }> = [
  {
    label: 'Why guests choose it',
    query: 'luxury stay memorable service beautiful property reasons guests recommend this hotel',
  },
  {
    label: 'Where it leaks',
    query: 'complaints service failures room issues noise cleanliness frustration review',
  },
  {
    label: 'Who it fits best',
    query: 'business trip family vacation romantic couples leisure stay convenience',
  },
];

function toHalfvecLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}

async function embedSemanticQueries(queries: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !queries.length) return [];

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      dimensions: 512,
      input: queries,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`OpenAI embeddings failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  return (payload.data ?? []).map(row => row.embedding ?? []);
}

async function getSemanticReviewQueries(hotelId: string): Promise<SemanticReviewQueryResult[]> {
  if (!process.env.OPENAI_API_KEY) return [];

  try {
    const embeddings = await embedSemanticQueries(SEMANTIC_REVIEW_QUERIES.map(entry => entry.query));
    if (!embeddings.length) return [];

    const results = await Promise.all(
      SEMANTIC_REVIEW_QUERIES.map(async (entry, index) => {
        const embedding = embeddings[index];
        if (!embedding?.length) return { ...entry, matches: [] };

        const { data, error } = await supabase.rpc('match_reviews', {
          query_embedding: toHalfvecLiteral(embedding),
          target_hotel_id: hotelId,
          match_threshold: 0.35,
          match_count: 3,
        });

        if (error) throw error;

        return {
          ...entry,
          matches: (data ?? []) as SemanticReviewMatchRow[],
        };
      }),
    );

    return results.filter(result => result.matches.length > 0);
  } catch {
    return [];
  }
}

function normalizeHotelCardData(payload: unknown): HotelCardData {
  const value = (payload ?? {}) as Partial<HotelCardData>;
  return {
    hotel: (value.hotel ?? null) as HotelDashboardRow | null,
    topics: (value.topics ?? []) as HotelTopicRow[],
    timeline: (value.timeline ?? []) as ReviewTimelineRow[],
    competitors: (value.competitors ?? []) as CompetitorNetworkRow[],
    languages: (value.languages ?? []) as LanguageBreakdownRow[],
    personas: (value.personas ?? []) as GuestPersonaRow[],
    content_seeds: (value.content_seeds ?? []) as ContentSeedRow[],
    qna: (value.qna ?? []) as HotelQnaRow[],
    amenities: [],
    priceSnapshots: [],
    metricSnapshots: [],
    changes: [],
    personaDeepDive: {
      totalSignalReviews: 0,
      repeatGuestReviews: 0,
      repeatGuestPct: null,
      spendingLevels: [],
      occasions: [],
      groupDetails: [],
      lengthsOfStay: [],
    },
    aiCompetitorAverage: null,
    semanticReviewQueries: [],
  };
}

const HOTEL_DETAIL_FIELDS = `
  ta_has_free_wifi,
  ta_has_pool,
  ta_has_spa,
  ta_has_fitness,
  ta_has_restaurant,
  ta_has_bar,
  ta_has_parking,
  ta_has_ev_charging,
  ta_has_meeting_rooms,
  ta_has_business_center,
  ta_has_room_service,
  ta_has_concierge,
  ta_has_suites,
  ta_has_pet_friendly,
  ta_has_accessible,
  ta_has_butler_service,
  ta_has_babysitting,
  ta_has_airport_transfer,
  ta_has_breakfast,
  ta_has_air_conditioning,
  ta_has_minibar,
  ta_languages_spoken,
  ta_compset_avg_rating,
  ta_compset_avg_reviews,
  ta_reviews_vs_compset_ratio,
  qna_response_rate,
  gmb_popular_times,
  gmb_place_topics,
  gmb_book_online_url,
  gov_star_rating,
  gov_star_source,
  ai_visibility_score,
  ai_chatgpt_mentioned,
  ai_perplexity_mentioned,
  dp_website_primary_language,
  dp_website_content_languages,
  dp_website_language_count,
  dp_has_schema_hotel,
  dp_schema_completeness,
  seo_monthly_traffic_est,
  seo_organic_keywords,
  seo_has_google_ads,
  dp_instagram_handle,
  dp_instagram_exists,
  dp_has_active_social,
  price_booking_com,
  price_expedia,
  price_hotels_com,
  price_ota_count,
  price_check_date,
  cx_gm_name,
  cx_gm_title,
  cx_gm_email,
  cx_gm_phone,
  cx_gm_linkedin,
  cx_gm_source,
  cx_gm_confidence,
  cx_active_job_count,
  cx_hiring_departments,
  cx_hiring_signals,
  cert_gstc,
  cert_gstc_body,
  cert_gstc_expiry,
  cert_green_key,
  cert_swisstainable,
  cert_earthcheck,
  cert_earthcheck_level
`;

function buildDistribution(rows: unknown[]): GuestPersonaDeepDiveData {
  const counts = {
    spendingLevels: new Map<string, number>(),
    occasions: new Map<string, number>(),
    groupDetails: new Map<string, number>(),
    lengthsOfStay: new Map<string, number>(),
  };
  let totalSignalReviews = 0;
  let repeatGuestReviews = 0;

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const persona = (row as { guest_persona?: Record<string, unknown> | null }).guest_persona;
    if (!persona || typeof persona !== 'object') continue;
    totalSignalReviews += 1;
    const spendingLevel = typeof persona.spending_level === 'string' ? persona.spending_level : null;
    const occasion = typeof persona.occasion === 'string' ? persona.occasion : null;
    const groupDetail = typeof persona.group_detail === 'string' ? persona.group_detail : null;
    const lengthOfStay = typeof persona.length_of_stay === 'string' ? persona.length_of_stay : null;
    const isRepeatGuest = typeof persona.is_repeat_guest === 'boolean' ? persona.is_repeat_guest : false;

    if (spendingLevel && spendingLevel !== 'null') counts.spendingLevels.set(spendingLevel, (counts.spendingLevels.get(spendingLevel) ?? 0) + 1);
    if (occasion && occasion !== 'null') counts.occasions.set(occasion, (counts.occasions.get(occasion) ?? 0) + 1);
    if (groupDetail && groupDetail !== 'null') counts.groupDetails.set(groupDetail, (counts.groupDetails.get(groupDetail) ?? 0) + 1);
    if (lengthOfStay && lengthOfStay !== 'null') counts.lengthsOfStay.set(lengthOfStay, (counts.lengthsOfStay.get(lengthOfStay) ?? 0) + 1);
    if (isRepeatGuest) repeatGuestReviews += 1;
  }

  const toRows = (source: Map<string, number>) =>
    [...source.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label,
        count,
        pct: totalSignalReviews ? count / totalSignalReviews : 0,
      }));

  return {
    totalSignalReviews,
    repeatGuestReviews,
    repeatGuestPct: totalSignalReviews ? repeatGuestReviews / totalSignalReviews : null,
    spendingLevels: toRows(counts.spendingLevels),
    occasions: toRows(counts.occasions),
    groupDetails: toRows(counts.groupDetails),
    lengthsOfStay: toRows(counts.lengthsOfStay),
  };
}

export const getPortfolioHotels = unstable_cache(
  async (): Promise<HotelDashboardRow[]> => {
    const { data, error } = await supabase
      .from('mv_hotel_dashboard')
      .select('*')
      .order('score_hqi', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return (data ?? []) as HotelDashboardRow[];
  },
  ['lumina-ui-portfolio-hotels'],
  { revalidate: 60 },
);

export const getHotelCard = unstable_cache(
  async (hotelId: string): Promise<HotelCardData> => {
    const [
      rpcResult,
      hotelDetailResult,
      amenitiesResult,
      priceSnapshotsResult,
      metricSnapshotsResult,
      changesResult,
      personaSignalsResult,
    ] = await Promise.all([
      supabase.rpc('get_hotel_card', {
        target_hotel_id: hotelId,
      }),
      supabase.from('hotels').select(HOTEL_DETAIL_FIELDS).eq('id', hotelId).maybeSingle(),
      supabase.from('hotel_amenities').select('hotel_id, source, amenity, category').eq('hotel_id', hotelId).order('category').order('amenity'),
      supabase.from('hotel_price_snapshots').select('id, hotel_id, check_date, check_in_date, nights, currency, price_booking_com, price_expedia, price_hotels_com, price_agoda, price_direct, price_lowest_ota, price_parity_score, ota_count').eq('hotel_id', hotelId).order('check_date', { ascending: true }).limit(18),
      supabase.from('hotel_metric_snapshots').select('id, hotel_id, snapshot_date, ta_rating, ta_num_reviews, gp_rating, gp_user_rating_count, score_hqi, score_tos, ta_owner_response_rate, seo_domain_authority, seo_monthly_traffic_est, ta_rating_vs_compset, ta_reviews_vs_compset_ratio').eq('hotel_id', hotelId).order('snapshot_date', { ascending: true }).limit(24),
      supabase.rpc('hotel_changes', { target_hotel_id: hotelId, days_back: 30 }),
      supabase.from('hotel_reviews').select('guest_persona').eq('hotel_id', hotelId).not('guest_persona', 'is', null),
    ]);

    if (rpcResult.error) throw rpcResult.error;
    if (hotelDetailResult.error) throw hotelDetailResult.error;
    if (amenitiesResult.error) throw amenitiesResult.error;
    if (priceSnapshotsResult.error) throw priceSnapshotsResult.error;
    if (metricSnapshotsResult.error) throw metricSnapshotsResult.error;
    if (changesResult.error) throw changesResult.error;
    if (personaSignalsResult.error) throw personaSignalsResult.error;

    const base = normalizeHotelCardData(rpcResult.data);
    const hotel = base.hotel ? { ...base.hotel, ...(hotelDetailResult.data ?? {}) } as HotelDashboardRow : null;

    let aiCompetitorAverage: number | null = null;
    const competitorIds = base.competitors.flatMap(competitor => competitor.competitor_id ? [competitor.competitor_id] : []);
    if (competitorIds.length) {
      const { data: competitorAiRows, error: competitorAiError } = await supabase
        .from('hotels')
        .select('id, ai_visibility_score')
        .in('id', competitorIds);
      if (competitorAiError) throw competitorAiError;
      const scores = (competitorAiRows ?? [])
        .map(row => row.ai_visibility_score)
        .filter((score): score is number => typeof score === 'number');
      aiCompetitorAverage = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
    }

    const semanticReviewQueries = await getSemanticReviewQueries(hotelId);

    return {
      ...base,
      hotel,
      amenities: (amenitiesResult.data ?? []) as HotelAmenityRow[],
      priceSnapshots: (priceSnapshotsResult.data ?? []) as HotelPriceSnapshotRow[],
      metricSnapshots: (metricSnapshotsResult.data ?? []) as HotelMetricSnapshotRow[],
      changes: (changesResult.data ?? []) as HotelChangeRow[],
      personaDeepDive: buildDistribution(personaSignalsResult.data ?? []),
      aiCompetitorAverage,
      semanticReviewQueries,
    };
  },
  ['lumina-ui-hotel-card'],
  { revalidate: 60 },
);

export const getHotelsByIds = unstable_cache(
  async (hotelIds: string[]): Promise<HotelDashboardRow[]> => {
    if (!hotelIds.length) return [];
    const { data, error } = await supabase
      .from('mv_hotel_dashboard')
      .select('*')
      .in('hotel_id', hotelIds);

    if (error) throw error;
    return (data ?? []) as HotelDashboardRow[];
  },
  ['lumina-ui-compare-hotels'],
  { revalidate: 60 },
);
