import 'server-only';

import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import type {
  ChainIntelligenceRow,
  ContentSeedRow,
  GuestPersonaDeepDiveData,
  GuestPersonaRow,
  HotelCardData,
  HotelChangeRow,
  HotelDashboardRow,
  HotelAmenityRow,
  HotelOpportunityData,
  HotelReviewRow,
  HotelMetricSnapshotRow,
  HotelPriceSnapshotRow,
  HotelQnaRow,
  HotelTopicRow,
  LanguageBreakdownRow,
  MarketIntelligenceRow,
  ReviewExplorerData,
  ReviewExplorerFilters,
  ReviewTopicMentionRow,
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
  ta_location_id,
  gp_place_id,
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

const REVIEW_SELECT = `
  id,
  hotel_id,
  source,
  source_review_id,
  lang,
  rating,
  title,
  text,
  trip_type,
  travel_date,
  published_date,
  helpful_votes,
  reviewer_username,
  reviewer_location,
  reviewer_location_id,
  has_owner_response,
  owner_response_text,
  owner_response_author,
  owner_response_date,
  owner_response_lang,
  created_at,
  sentiment,
  sentiment_score,
  topics,
  guest_segment,
  nlp_processed_at,
  guest_persona,
  content_seeds,
  competitor_mentions
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

export const getHotelOpportunity = unstable_cache(
  async (hotelId: string): Promise<HotelOpportunityData | null> => {
    const { data, error } = await supabase.rpc('get_hotel_intelligence', {
      target_hotel_id: hotelId,
    });

    if (error) throw error;
    return (data ?? null) as HotelOpportunityData | null;
  },
  ['lumina-ui-hotel-opportunity'],
  { revalidate: 60 },
);

export const getChainData = unstable_cache(
  async (brand?: string): Promise<{
    hotels: HotelDashboardRow[];
    summaryRow: ChainIntelligenceRow | null;
    marketRows: MarketIntelligenceRow[];
    opportunityRows: Array<{
      hotel_id: string;
      name: string;
      city: string | null;
      country: string | null;
      computed_opportunity_score: number | null;
      computed_opportunity_primary: string | null;
      computed_opportunity_narrative: string | null;
      opportunity_action?: string | null;
      sales_hook?: string | null;
    }>;
  }> => {
    const hotels = await getPortfolioHotels();
    const scopedHotels = brand
      ? hotels.filter(hotel =>
          [hotel.ta_brand, hotel.ta_parent_brand]
            .filter(Boolean)
            .some(value => value!.toLowerCase().includes(brand.toLowerCase())),
        )
      : hotels;

    let summaryRow: ChainIntelligenceRow | null = null;
    if (brand) {
      const { data, error } = await supabase
        .from('v_chain_intelligence')
        .select('*')
        .ilike('brand', `%${brand}%`)
        .order('hotel_count', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      summaryRow = (data ?? null) as ChainIntelligenceRow | null;
    }

    const opportunityQuery = supabase
      .from('v_hotel_opportunities')
      .select('hotel_id,name,city,country,computed_opportunity_score,computed_opportunity_primary,computed_opportunity_narrative,opportunity_action,sales_hook')
      .order('computed_opportunity_score', { ascending: false, nullsFirst: false })
      .limit(10);

    const { data: opportunityRows, error: opportunityError } = brand
      ? await opportunityQuery.or(`ta_brand.ilike.%${brand}%,ta_parent_brand.ilike.%${brand}%`)
      : await opportunityQuery;

    if (opportunityError) throw opportunityError;

    const { data: marketRows, error: marketError } = await supabase
      .from('v_market_intelligence')
      .select('*')
      .order('avg_opportunity_score', { ascending: false, nullsFirst: false })
      .limit(12);

    if (marketError) throw marketError;

    return {
      hotels: scopedHotels,
      summaryRow,
      marketRows: (marketRows ?? []) as MarketIntelligenceRow[],
      opportunityRows: (opportunityRows ?? []) as Array<{
        hotel_id: string;
        name: string;
        city: string | null;
        country: string | null;
        computed_opportunity_score: number | null;
        computed_opportunity_primary: string | null;
        computed_opportunity_narrative: string | null;
        opportunity_action?: string | null;
        sales_hook?: string | null;
      }>,
    };
  },
  ['lumina-ui-chain-data'],
  { revalidate: 60 },
);

export const getMarketIntelligence = unstable_cache(
  async (country?: string): Promise<MarketIntelligenceRow[]> => {
    let query = supabase
      .from('v_market_intelligence')
      .select('*')
      .order('avg_opportunity_score', { ascending: false, nullsFirst: false });

    if (country) {
      query = query.eq('country', country);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MarketIntelligenceRow[];
  },
  ['lumina-ui-market-intelligence'],
  { revalidate: 60 },
);

async function getReviewIdsForAspect(hotelId: string, aspect: string): Promise<string[]> {
  const reviewIds = new Set<string>();
  const batchSize = 1000;

  for (let offset = 0; offset < 10000; offset += batchSize) {
    const { data, error } = await supabase
      .from('review_topic_index')
      .select('review_id')
      .eq('hotel_id', hotelId)
      .eq('aspect', aspect)
      .range(offset, offset + batchSize - 1);

    if (error) throw error;

    const rows = data ?? [];
    rows.forEach(row => {
      if (row.review_id) reviewIds.add(row.review_id);
    });

    if (rows.length < batchSize) break;
  }

  return [...reviewIds];
}

function applyReviewFilters(
  query: any,
  filters: ReviewExplorerFilters,
  reviewIds: string[] | null,
) {
  let next = query;

  if (reviewIds) {
    if (!reviewIds.length) {
      next = next.in('id', ['00000000-0000-0000-0000-000000000000']);
    } else {
      next = next.in('id', reviewIds);
    }
  }

  if (filters.lang) next = next.eq('lang', filters.lang);
  if (filters.sentiment) next = next.eq('sentiment', filters.sentiment);
  if (filters.source) next = next.eq('source', filters.source);

  return next;
}

export async function getHotelReviews(
  hotelId: string,
  filters: ReviewExplorerFilters = {},
): Promise<ReviewExplorerData> {
  const page = Number.isFinite(filters.page) ? Math.max(Math.floor(filters.page ?? 1), 1) : 1;
  const pageSize = Number.isFinite(filters.pageSize) ? Math.min(Math.max(Math.floor(filters.pageSize ?? 20), 1), 50) : 20;
  const reviewIds = filters.aspect ? await getReviewIdsForAspect(hotelId, filters.aspect) : null;

  const countQuery = applyReviewFilters(
    supabase
      .from('hotel_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .not('text', 'is', null),
    filters,
    reviewIds,
  );
  const { count, error: countError } = await countQuery;
  if (countError) throw countError;

  const dataQuery = applyReviewFilters(
    supabase
      .from('hotel_reviews')
      .select(REVIEW_SELECT)
      .eq('hotel_id', hotelId)
      .not('text', 'is', null)
      .order('published_date', { ascending: false, nullsFirst: false })
      .range((page - 1) * pageSize, page * pageSize - 1),
    filters,
    reviewIds,
  );
  const { data: reviews, error: reviewsError } = await dataQuery;
  if (reviewsError) throw reviewsError;

  const reviewPageIds = ((reviews ?? []) as HotelReviewRow[]).map((review: HotelReviewRow) => review.id).slice(0, 50);
  let topicMentions: ReviewTopicMentionRow[] = [];
  if (reviewPageIds.length) {
    const topicMentionsQuery = supabase
      .from('review_topic_index')
      .select('*')
      .eq('hotel_id', hotelId)
      .in('review_id', reviewPageIds);

    const narrowedTopicMentionsQuery = filters.aspect
      ? topicMentionsQuery.eq('aspect', filters.aspect)
      : topicMentionsQuery;
    const { data, error: topicMentionsError } = await narrowedTopicMentionsQuery;
    if (topicMentionsError) throw topicMentionsError;
    topicMentions = (data ?? []) as ReviewTopicMentionRow[];
  }

  let selectedReview: HotelReviewRow | null = null;
  if (filters.reviewId) {
    const selectedQuery = applyReviewFilters(
      supabase
        .from('hotel_reviews')
        .select(REVIEW_SELECT)
        .eq('hotel_id', hotelId)
        .eq('id', filters.reviewId)
        .maybeSingle(),
      filters,
      reviewIds,
    );
    const { data, error } = await selectedQuery;
    if (error) throw error;
    selectedReview = (data ?? null) as HotelReviewRow | null;
  }

  const topicMentionReviewIds = new Set(((reviews ?? []) as HotelReviewRow[]).map((review: HotelReviewRow) => review.id));
  if (selectedReview?.id) topicMentionReviewIds.add(selectedReview.id);

  const mentionIds = [...topicMentionReviewIds].slice(0, 60);
  let mergedTopicMentions = topicMentions;
  if (selectedReview?.id && !mergedTopicMentions.some(mention => mention.review_id === selectedReview?.id) && mentionIds.length) {
    const selectedMentionQuery = supabase
      .from('review_topic_index')
      .select('*')
      .eq('hotel_id', hotelId)
      .in('review_id', mentionIds);
    const narrowedSelectedMentionQuery = filters.aspect
      ? selectedMentionQuery.eq('aspect', filters.aspect)
      : selectedMentionQuery;
    const { data: selectedMentions, error: selectedMentionsError } = await narrowedSelectedMentionQuery;
    if (selectedMentionsError) throw selectedMentionsError;
    mergedTopicMentions = (selectedMentions ?? []) as ReviewTopicMentionRow[];
  }

  return {
    reviews: (reviews ?? []) as HotelReviewRow[],
    total: count ?? 0,
    page,
    pageSize,
    selectedReview,
    topicMentions: mergedTopicMentions,
  };
}

export async function getReviewsByTopic(hotelId: string, aspect: string, filters: Omit<ReviewExplorerFilters, 'aspect'> = {}) {
  return getHotelReviews(hotelId, { ...filters, aspect });
}

export async function getReviewsByLanguage(hotelId: string, lang: string, filters: Omit<ReviewExplorerFilters, 'lang'> = {}) {
  return getHotelReviews(hotelId, { ...filters, lang });
}
