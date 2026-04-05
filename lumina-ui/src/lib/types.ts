export interface HotelDashboardRow {
  hotel_id: string;
  name: string;
  city: string | null;
  country: string | null;
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
  price_direct: number | null;
  price_lowest_ota: number | null;
  price_parity_score: number | null;
  enrichment_status: string | null;
  flag_is_independent: boolean | null;
  flag_is_luxury: boolean | null;
  flag_is_premium: boolean | null;
  flag_needs_reputation_mgmt: boolean | null;
  flag_tercier_high_priority: boolean | null;
  total_reviews_db: number;
  positive_reviews: number;
  negative_reviews: number;
  competitor_count: number;
  topic_mentions_total: number;
  updated_at: string | null;
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

export interface HotelCardData {
  hotel: HotelDashboardRow | null;
  topics: HotelTopicRow[];
  timeline: ReviewTimelineRow[];
  competitors: CompetitorNetworkRow[];
  languages: LanguageBreakdownRow[];
  personas: GuestPersonaRow[];
  content_seeds: ContentSeedRow[];
  qna: HotelQnaRow[];
}
