import type { HotelUpsert } from '../phase0-enrichment/lib/types.js';

export interface HotelInput {
  name: string;
  city?: string;
  country?: string;
}

export interface ExistingHotelRow {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  ta_location_id: string | null;
  gp_place_id: string | null;
  website_url: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PipelineContext {
  input: HotelInput;
  existingHotel?: ExistingHotelRow | null;
  hotelId?: string;
  taLocationId?: string | null;
  taWebUrl?: string | null;
  taNumReviews?: number | null;
  gpPlaceId?: string | null;
  gpUserRatingCount?: number | null;
  osmId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  websiteUrl?: string | null;
  phone?: string | null;
  country?: string | null;
}

export type TerminalReviewStatus = 'identity_review_required';

export interface DiscoveryResult {
  taLocationId?: string | null;
  gpPlaceId?: string | null;
  osmId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  websiteUrl?: string | null;
  phone?: string | null;
  country?: string | null;
  hotel?: HotelUpsert;
  message: string;
  ok: boolean;
}

export interface AmenityInsert {
  source: string;
  amenity: string;
  category: string | null;
}

export interface ReviewInsert {
  source: string;
  source_review_id: string;
  lang: string;
  rating: number | null;
  title: string | null;
  text: string | null;
  trip_type: string | null;
  travel_date: string | null;
  published_date: string | null;
  helpful_votes: number;
  reviewer_username: string | null;
  reviewer_location: string | null;
  reviewer_location_id: string | null;
  has_owner_response: boolean;
  owner_response_text: string | null;
  owner_response_author: string | null;
  owner_response_date: string | null;
  owner_response_lang: string | null;
  subratings: Record<string, number> | null;
}

export interface ReviewTopicExtraction {
  aspect: string;
  sentiment: string;
  score: number;
  mention: string;
}

export interface GuestPersonaExtraction {
  occasion: string | null;
  length_of_stay: string | null;
  spending_level: string | null;
  is_repeat_guest: boolean | null;
  repeat_visit_count: number | null;
  group_detail: string | null;
}

export interface CompetitorMentionExtraction {
  name: string;
  comparison: string;
  quote: string;
}

export interface ContentSeedExtraction {
  quote: string;
  emotion: string;
  segment: string;
  use: string;
}

export interface ReviewNlpExtraction {
  overall_sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  overall_sentiment_score: number;
  aspects: ReviewTopicExtraction[];
  guest_persona: GuestPersonaExtraction | null;
  competitor_mentions: CompetitorMentionExtraction[];
  content_seeds: ContentSeedExtraction[];
}

export interface QnaAnswerInsert {
  answer_id: string | null;
  author: string | null;
  author_url: string | null;
  text: string | null;
  answered_at: string | null;
  is_official: boolean;
}

export interface QnaInsert {
  source: string;
  source_question_id: string;
  question: string;
  question_author: string | null;
  question_author_url: string | null;
  question_date: string | null;
  answers: QnaAnswerInsert[];
  answer_count: number;
  has_answer: boolean;
  has_official_answer: boolean;
  latest_answer: string | null;
  latest_answered_by: string | null;
  latest_answer_date: string | null;
  raw_payload: unknown;
}

export interface CompetitorInsert {
  competitor_rank: number;
  ta_location_id: string | null;
  name: string;
  distance_km: number | null;
  bearing: string | null;
}

export interface CompetitorHotelSeed {
  ta_location_id: string;
  name: string;
  city: string | null;
  country: string | null;
  hotel: HotelUpsert;
  amenities?: AmenityInsert[];
}

export interface LangRatingInsert {
  lang: string;
  avg_rating: number | null;
  review_count: number;
}

export interface PriceSnapshotSeed {
  check_date: string;
  check_in_date: string | null;
  nights: number;
  currency: string;
  price_booking_com: number | null;
  price_expedia: number | null;
  price_hotels_com: number | null;
  price_agoda: number | null;
  price_direct: number | null;
  price_lowest_ota: number | null;
  price_parity_score: number | null;
  ota_count: number;
  raw_response: unknown;
}

export interface MetricSnapshotInsert {
  hotel_id: string;
  snapshot_date: string;
  snapshot_source: string;
  ta_rating: number | null;
  ta_num_reviews: number | null;
  gp_rating: number | null;
  gp_user_rating_count: number | null;
  ta_ranking: number | null;
  ta_ranking_out_of: number | null;
  ta_subrating_location: number | null;
  ta_subrating_sleep: number | null;
  ta_subrating_rooms: number | null;
  ta_subrating_service: number | null;
  ta_subrating_value: number | null;
  ta_subrating_cleanliness: number | null;
  ta_trip_type_business: number | null;
  ta_trip_type_couples: number | null;
  ta_trip_type_solo: number | null;
  ta_trip_type_family: number | null;
  ta_trip_type_friends: number | null;
  score_hqi: number | null;
  score_tos: number | null;
  score_reputation_risk: number | null;
  ta_owner_response_rate: number | null;
  ta_owner_response_count: number | null;
  seo_domain_authority: number | null;
  seo_monthly_traffic_est: number | null;
  ta_rating_vs_compset: number | null;
  ta_reviews_vs_compset_ratio: number | null;
}

export type SourceState = 'ok' | 'skipped' | 'error';

export interface SourceStatus {
  source: string;
  state: SourceState;
  message: string;
  cached?: boolean;
  error?: string;
}

export interface SourceResult {
  hotel?: HotelUpsert;
  amenities?: AmenityInsert[];
  reviews?: ReviewInsert[];
  qna?: QnaInsert[];
  competitors?: CompetitorInsert[];
  competitorHotels?: CompetitorHotelSeed[];
  langRatings?: LangRatingInsert[];
  priceSnapshot?: PriceSnapshotSeed;
  statuses: SourceStatus[];
}
