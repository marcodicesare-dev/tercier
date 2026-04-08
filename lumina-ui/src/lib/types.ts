export interface HotelDashboardRow {
  hotel_id: string;
  name: string;
  city: string | null;
  country: string | null;
  ta_location_id?: string | null;
  gp_place_id?: string | null;
  ta_rating: number | null;
  gp_rating: number | null;
  ta_num_reviews: number | null;
  gp_user_rating_count: number | null;
  ta_ranking: number | null;
  ta_ranking_out_of: number | null;
  ta_ranking_geo: string | null;
  ta_brand: string | null;
  ta_parent_brand: string | null;
  ta_price_level: string | null;
  ta_category: string | null;
  score_hqi: number | null;
  score_tos: number | null;
  score_reputation_risk: number | null;
  score_digital_presence: number | null;
  ta_primary_segment: string | null;
  ta_segment_pct_business: number | null;
  ta_segment_pct_couples: number | null;
  ta_segment_pct_solo: number | null;
  ta_segment_pct_family: number | null;
  ta_segment_pct_friends: number | null;
  ta_segment_diversity: number | null;
  ta_subrating_location: number | null;
  ta_subrating_sleep: number | null;
  ta_subrating_rooms: number | null;
  ta_subrating_service: number | null;
  ta_subrating_value: number | null;
  ta_subrating_cleanliness: number | null;
  ta_subrating_weakest: string | null;
  ta_subrating_strongest: string | null;
  ta_subrating_range: number | null;
  ta_owner_response_rate: number | null;
  ta_review_language_count: number | null;
  ta_reviews_last_90d_est: number | null;
  ta_amenity_count: number | null;
  gp_editorial_summary: string | null;
  gp_review_summary_gemini: string | null;
  website_url: string | null;
  qna_count: number | null;
  qna_unanswered_count: number | null;
  gmb_is_claimed: boolean | null;
  gmb_hotel_star_rating: number | null;
  seo_domain_authority: number | null;
  dp_website_tech_cms: string | null;
  dp_website_tech_booking: string | null;
  dp_website_tech_analytics: string | null;
  dp_website_primary_language?: string | null;
  dp_website_content_languages?: string | null;
  dp_website_language_count?: number | null;
  price_direct: number | null;
  price_lowest_ota: number | null;
  price_parity_score: number | null;
  enrichment_status: string | null;
  flag_is_independent: boolean | null;
  flag_is_luxury: boolean | null;
  flag_is_premium: boolean | null;
  flag_needs_reputation_mgmt: boolean | null;
  flag_tercier_high_priority: boolean | null;
  computed_opportunity_score?: number | null;
  computed_opportunity_primary?: string | null;
  computed_opportunity_narrative?: string | null;
  computed_language_gap?: number | null;
  computed_value_gap?: number | null;
  computed_effective_website_langs?: number | null;
  total_reviews_db: number;
  positive_reviews: number;
  negative_reviews: number;
  competitor_count: number;
  topic_mentions_total: number;
  updated_at: string | null;
  ta_has_free_wifi?: boolean | null;
  ta_has_pool?: boolean | null;
  ta_has_spa?: boolean | null;
  ta_has_fitness?: boolean | null;
  ta_has_restaurant?: boolean | null;
  ta_has_bar?: boolean | null;
  ta_has_parking?: boolean | null;
  ta_has_ev_charging?: boolean | null;
  ta_has_meeting_rooms?: boolean | null;
  ta_has_business_center?: boolean | null;
  ta_has_room_service?: boolean | null;
  ta_has_concierge?: boolean | null;
  ta_has_suites?: boolean | null;
  ta_has_pet_friendly?: boolean | null;
  ta_has_accessible?: boolean | null;
  ta_has_butler_service?: boolean | null;
  ta_has_babysitting?: boolean | null;
  ta_has_airport_transfer?: boolean | null;
  ta_has_breakfast?: boolean | null;
  ta_has_air_conditioning?: boolean | null;
  ta_has_minibar?: boolean | null;
  ta_languages_spoken?: string | null;
  ta_compset_avg_rating?: number | null;
  ta_compset_avg_reviews?: number | null;
  ta_reviews_vs_compset_ratio?: number | null;
  qna_response_rate?: number | null;
  gmb_popular_times?: unknown;
  gmb_place_topics?: unknown;
  gmb_book_online_url?: string | null;
  gov_star_rating?: number | null;
  gov_star_source?: string | null;
  ai_visibility_score?: number | null;
  ai_chatgpt_mentioned?: boolean | null;
  ai_perplexity_mentioned?: boolean | null;
  dp_has_schema_hotel?: boolean | null;
  dp_schema_completeness?: number | null;
  seo_monthly_traffic_est?: number | null;
  seo_organic_keywords?: number | null;
  seo_has_google_ads?: boolean | null;
  dp_instagram_handle?: string | null;
  dp_instagram_exists?: boolean | null;
  dp_has_active_social?: boolean | null;
  price_booking_com?: number | null;
  price_expedia?: number | null;
  price_hotels_com?: number | null;
  price_ota_count?: number | null;
  price_check_date?: string | null;
  cx_gm_name?: string | null;
  cx_gm_title?: string | null;
  cx_gm_email?: string | null;
  cx_gm_phone?: string | null;
  cx_gm_linkedin?: string | null;
  cx_gm_source?: string | null;
  cx_gm_confidence?: string | null;
  cx_active_job_count?: number | null;
  cx_hiring_departments?: string | null;
  cx_hiring_signals?: boolean | null;
  cert_gstc?: boolean | null;
  cert_gstc_body?: string | null;
  cert_gstc_expiry?: string | null;
  cert_green_key?: boolean | null;
  cert_swisstainable?: string | null;
  cert_earthcheck?: boolean | null;
  cert_earthcheck_level?: string | null;
}

export interface HotelTopicRow {
  hotel_id: string;
  aspect: string;
  mention_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  mixed_count: number;
  positive_pct: number | null;
  negative_pct: number | null;
  avg_sentiment_score: number | null;
}

export interface ReviewTimelineRow {
  hotel_id: string;
  month: string;
  review_count: number;
  avg_rating: number | null;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

export interface CompetitorNetworkRow {
  hotel_id: string;
  hotel_name: string;
  city: string | null;
  hotel_rating: number | null;
  hotel_reviews: number | null;
  competitor_rank: number;
  distance_km: number | null;
  competitor_id: string | null;
  competitor_name: string | null;
  competitor_rating: number | null;
  competitor_reviews: number | null;
  competitor_service_score: number | null;
  competitor_rooms_score: number | null;
  competitor_value_score: number | null;
  competitor_price_level: string | null;
  competitor_hqi: number | null;
}

export interface LanguageBreakdownRow {
  hotel_id: string;
  lang: string;
  review_count: number;
  avg_rating: number | null;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

export interface GuestPersonaRow {
  hotel_id: string;
  occasion: string | null;
  spending_level: string | null;
  group_detail: string | null;
  review_count: number;
  avg_rating: number | null;
}

export interface ContentSeedRow {
  hotel_id: string;
  quote: string | null;
  emotion: string | null;
  segment: string | null;
  marketing_use: string | null;
  lang: string | null;
  rating: number | null;
  published_date: string | null;
  review_id: string;
}

export interface HotelQnaRow {
  id: string;
  question: string;
  question_author: string | null;
  question_date: string | null;
  answer_count: number | null;
  has_answer: boolean | null;
  has_official_answer: boolean | null;
  latest_answer: string | null;
  latest_answered_by: string | null;
  latest_answer_date: string | null;
}

export interface HotelAmenityRow {
  hotel_id: string;
  source: string;
  amenity: string;
  category: string | null;
}

export interface HotelPriceSnapshotRow {
  id: string;
  hotel_id: string;
  check_date: string;
  check_in_date: string | null;
  nights: number | null;
  currency: string | null;
  price_booking_com: number | null;
  price_expedia: number | null;
  price_hotels_com: number | null;
  price_agoda: number | null;
  price_direct: number | null;
  price_lowest_ota: number | null;
  price_parity_score: number | null;
  ota_count: number | null;
}

export interface HotelMetricSnapshotRow {
  id: string;
  hotel_id: string;
  snapshot_date: string;
  ta_rating: number | null;
  ta_num_reviews: number | null;
  gp_rating: number | null;
  gp_user_rating_count: number | null;
  score_hqi: number | null;
  score_tos: number | null;
  ta_owner_response_rate: number | null;
  seo_domain_authority: number | null;
  seo_monthly_traffic_est: number | null;
  ta_rating_vs_compset: number | null;
  ta_reviews_vs_compset_ratio: number | null;
}

export interface HotelChangeRow {
  metric: string;
  previous: number | null;
  current: number | null;
  delta: number | null;
  prev_date: string | null;
  curr_date: string | null;
}

export interface PersonaDistributionRow {
  label: string;
  count: number;
  pct: number;
}

export interface GuestPersonaDeepDiveData {
  totalSignalReviews: number;
  repeatGuestReviews: number;
  repeatGuestPct: number | null;
  spendingLevels: PersonaDistributionRow[];
  occasions: PersonaDistributionRow[];
  groupDetails: PersonaDistributionRow[];
  lengthsOfStay: PersonaDistributionRow[];
}

export interface SemanticReviewMatchRow {
  id: string;
  hotel_id: string;
  text: string | null;
  lang: string;
  rating: number | null;
  sentiment: string | null;
  topics: unknown;
  published_date: string | null;
  similarity: number;
}

export interface SemanticReviewQueryResult {
  label: string;
  query: string;
  matches: SemanticReviewMatchRow[];
}

export interface ReviewTopicMention {
  aspect: string;
  mention: string | null;
  sentiment: string | null;
  score: number | null;
}

export interface HotelReviewRow {
  id: string;
  hotel_id: string;
  source: string;
  source_review_id: string | null;
  lang: string | null;
  rating: number | null;
  title: string | null;
  text: string | null;
  trip_type: string | null;
  travel_date: string | null;
  published_date: string | null;
  helpful_votes: number | null;
  reviewer_username: string | null;
  reviewer_location: string | null;
  reviewer_location_id: string | null;
  has_owner_response: boolean | null;
  owner_response_text: string | null;
  owner_response_author: string | null;
  owner_response_date: string | null;
  owner_response_lang: string | null;
  created_at: string;
  sentiment: string | null;
  sentiment_score: number | null;
  topics: ReviewTopicMention[] | null;
  guest_segment: string | null;
  nlp_processed_at: string | null;
  guest_persona: Record<string, unknown> | null;
  content_seeds: Array<Record<string, unknown>> | null;
  competitor_mentions: Array<Record<string, unknown>> | null;
}

export interface ReviewTopicMentionRow {
  id: string;
  hotel_id: string;
  review_id: string;
  aspect: string;
  sentiment: string | null;
  sentiment_score: number | null;
  mention_text: string | null;
  lang: string | null;
  published_date: string | null;
  created_at: string;
}

export interface ReviewExplorerFilters {
  lang?: string;
  aspect?: string;
  sentiment?: string;
  source?: string;
  page?: number;
  pageSize?: number;
  reviewId?: string;
}

export interface ReviewExplorerData {
  reviews: HotelReviewRow[];
  total: number;
  page: number;
  pageSize: number;
  selectedReview: HotelReviewRow | null;
  topicMentions: ReviewTopicMentionRow[];
}

export interface HotelOpportunityData {
  opportunity: {
    score: number;
    narrative: string;
    primary_reason: string;
  };
  review_velocity?: {
    last_3_months: number;
  } | null;
  topic_strengths?: Array<{
    aspect: string;
    mentions: number;
    positive_pct: number;
  }>;
  topic_weaknesses?: Array<{
    aspect: string;
    mentions: number;
    negative_pct: number;
  }>;
  language_markets?: Array<{
    lang: string;
    avg_rating: number | null;
    review_count: number;
  }>;
  content_seed_count?: number;
}

export interface ChainIntelligenceRow {
  brand: string;
  hotel_count: number;
  rated_hotels: number;
  avg_rating: number | null;
  min_rating: number | null;
  max_rating: number | null;
  avg_hqi: number | null;
  total_ta_reviews: number | null;
  total_gp_reviews: number | null;
  avg_response_rate: number | null;
  avg_value_gap: number | null;
  avg_language_gap: number | null;
  avg_opportunity_score: number | null;
  avg_segment_couples: number | null;
  avg_segment_family: number | null;
  avg_segment_business: number | null;
  avg_segment_solo: number | null;
  avg_segment_friends: number | null;
  hotels_weak_value: number;
  hotels_weak_location: number;
  hotels_weak_rooms: number;
  country_count: number;
  city_count: number;
}

export interface HotelCardData {
  hotel: HotelDashboardRow | null;
  topics: HotelTopicRow[];
  timeline: ReviewTimelineRow[];
  competitors: CompetitorNetworkRow[];
  languages: LanguageBreakdownRow[];
  personas: GuestPersonaRow[];
  content_seeds: ContentSeedRow[];
  qna: HotelQnaRow[];
  amenities: HotelAmenityRow[];
  priceSnapshots: HotelPriceSnapshotRow[];
  metricSnapshots: HotelMetricSnapshotRow[];
  changes: HotelChangeRow[];
  personaDeepDive: GuestPersonaDeepDiveData;
  aiCompetitorAverage: number | null;
  semanticReviewQueries: SemanticReviewQueryResult[];
}
