// ── Input CSV row from enriched-master.csv ──
export interface HotelleriesuisseRow {
  slug: string;
  name: string;
  location: string;
  starRating: string;
  isSuperior: string;
  starLabel: string;
  hotelType: string;
  classificationText: string;
  address: string;
  roomsCount: string;
  roomsLabel: string;
  phone: string;
  email: string;
  emailUrl: string;
  specializationTags: string;
  certificationTags: string;
  accessibilityTags: string;
  amenityTags: string;
  priceCategory: string;
  priceSourceType: string;
  priceNightly: string;
  priceNightlyChf: string;
  sourceCurrency: string;
  matchedText: string;
  gmName: string;
  gmTitle: string;
  gmSourceUrl: string;
  websiteUrl: string;
  mySwitzerlandUrl: string;
  detailUrl: string;
  externalPriceUrl: string;
  sr_selected: string;
  sr_selection_reason_codes: string;
  sr_selection_reason_labels: string;
  sr_selection_buckets: string;
  sr_enrichment_status: string;
  sr_source_url: string;
  sr_page_title: string;
  sr_page_description: string;
  sr_website_summary: string;
  sr_offered_languages: string;
  sr_positioning_pillars: string;
  sr_positioning_tone: string;
  sr_direct_booking_presence: string;
  sr_booking_engine_signals: string;
  sr_ota_signals: string;
  sr_booking_flow_type: string;
  sr_amenity_signals: string;
  sr_audience_signals: string;
  sr_brand_style_signals: string;
  sr_market_segment: string;
  sr_annual_room_revenue_proxy_chf: string;
  sr_occupancy_assumption: string;
  sr_scrape_error: string;
  [key: string]: string | undefined;
}

// ── TripAdvisor API Response Types ──
// CRITICAL: All TA values are STRINGS. Parse before using.

export interface TASearchResponse {
  data: TASearchResult[];
}

export interface TASearchResult {
  location_id: string;
  name: string;
  distance?: string;
  bearing?: string;
  address_obj: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
    address_string?: string;
  };
}

export interface TADetailResponse {
  location_id: string;
  name: string;
  description?: string;
  web_url?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  category?: { name: string; localized_name: string };
  subcategory?: Array<{ name: string; localized_name: string }>;
  brand?: string;
  parent_brand?: string;
  address_obj?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
    address_string?: string;
  };
  ancestors?: Array<{
    level: string;
    name: string;
    location_id: string;
  }>;
  rating?: string;
  num_reviews?: string;
  review_rating_count?: Record<string, string>;
  subratings?: Record<string, {
    name: string;
    localized_name: string;
    value: string;
  }>;
  price_level?: string;
  ranking_data?: {
    ranking: string;
    ranking_out_of: string;
    geo_location_id: string;
    geo_location_name: string;
    ranking_string: string;
  };
  trip_types?: Array<{
    name: string;
    localized_name: string;
    value: string;
  }>;
  amenities?: string[];
  awards?: Array<{
    award_type: string;
    year: string;
    display_name: string;
    images?: Record<string, string>;
    categories?: string[];
  }>;
  photo_count?: string;
  see_all_photos?: string;
  write_review?: string;
  neighborhood_info?: Array<{ name: string; location_id: string }>;
  styles?: string[];
}

export interface TAReviewsResponse {
  data: TAReview[];
}

export interface TAReview {
  id: number;
  lang: string;
  location_id: number;
  rating: number;
  text: string;
  title: string;
  trip_type?: string;
  travel_date?: string;
  published_date: string;
  helpful_votes: number;
  url: string;
  user: {
    username: string;
    user_location?: {
      id: string;
      name?: string;
    };
    avatar?: Record<string, string>;
  };
  subratings?: Record<string, {
    name: string;
    value: number;
    localized_name: string;
  }>;
  owner_response?: {
    id: number;
    title: string;
    text: string;
    lang: string;
    author: string;
    published_date: string;
  };
}

// ── Google Places API Response Types ──

export interface GPAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      structuredFormat: {
        mainText: { text: string };
        secondaryText?: { text: string };
      };
      text: { text: string };
      types?: string[];
    };
  }>;
}

export interface GPPlaceDetails {
  id: string;
  displayName?: { text: string; languageCode: string };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  types?: string[];
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
    languageCode: string;
  }>;
  location?: { latitude: number; longitude: number };
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  editorialSummary?: { text: string; languageCode: string };
  reviewSummary?: { text: string };
  reviews?: Array<{
    name: string;
    rating: number;
    text: { text: string; languageCode: string };
    originalText?: { text: string; languageCode: string };
    authorAttribution: { displayName: string; photoUri?: string };
    publishTime: string;
    relativePublishTimeDescription: string;
  }>;
  goodForChildren?: boolean;
  allowsDogs?: boolean;
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleEntrance?: boolean;
    wheelchairAccessibleRestroom?: boolean;
    wheelchairAccessibleSeating?: boolean;
  };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
    authorAttributions: Array<{ displayName: string }>;
  }>;
  addressDescriptor?: {
    landmarks?: Array<{
      name: string;
      placeId: string;
      displayName: { text: string };
      straightLineDistanceMeters: number;
      travelDistanceMeters?: number;
      spatialRelationship: string;
      types: string[];
    }>;
    areas?: Array<{
      name: string;
      placeId: string;
      displayName: { text: string };
      containment: string;
    }>;
  };
  timeZone?: { id: string };
  regularOpeningHours?: {
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }>;
  };
}

// ── JSONL Cache Entry ──

export interface CacheEntry<T> {
  key: string;
  timestamp: string;
  data: T;
}

// ── DB row (partial, used for upserts) ──

export interface HotelUpsert {
  ta_write_review_url?: string | null;
  ta_see_all_photos_url?: string | null;
  ta_subcategory?: string | null;
  ta_latitude?: number | null;
  ta_longitude?: number | null;
  ta_timezone?: string | null;
  ta_neighborhood?: string | null;
  ta_has_travelers_choice?: boolean | null;
  ta_travelers_choice_year?: string | null;
  ta_amenities?: string | null;
  ta_amenity_count?: number | null;
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
  ta_competitor_1_id?: string | null;
  ta_competitor_1_name?: string | null;
  ta_competitor_1_dist_km?: number | null;
  ta_competitor_1_bearing?: string | null;
  ta_competitor_2_id?: string | null;
  ta_competitor_2_name?: string | null;
  ta_competitor_2_dist_km?: number | null;
  ta_competitor_2_bearing?: string | null;
  ta_competitor_3_id?: string | null;
  ta_competitor_3_name?: string | null;
  ta_competitor_3_dist_km?: number | null;
  ta_competitor_3_bearing?: string | null;
  ta_competitor_4_id?: string | null;
  ta_competitor_4_name?: string | null;
  ta_competitor_4_dist_km?: number | null;
  ta_competitor_4_bearing?: string | null;
  ta_competitor_5_id?: string | null;
  ta_competitor_5_name?: string | null;
  ta_competitor_5_dist_km?: number | null;
  ta_competitor_5_bearing?: string | null;
  ta_competitor_6_id?: string | null;
  ta_competitor_6_name?: string | null;
  ta_competitor_6_dist_km?: number | null;
  ta_competitor_6_bearing?: string | null;
  ta_competitor_7_id?: string | null;
  ta_competitor_7_name?: string | null;
  ta_competitor_7_dist_km?: number | null;
  ta_competitor_7_bearing?: string | null;
  ta_competitor_8_id?: string | null;
  ta_competitor_8_name?: string | null;
  ta_competitor_8_dist_km?: number | null;
  ta_competitor_8_bearing?: string | null;
  ta_competitor_9_id?: string | null;
  ta_competitor_9_name?: string | null;
  ta_competitor_9_dist_km?: number | null;
  ta_competitor_9_bearing?: string | null;
  ta_competitor_10_id?: string | null;
  ta_competitor_10_name?: string | null;
  ta_competitor_10_dist_km?: number | null;
  ta_competitor_10_bearing?: string | null;
  ta_compset_count?: number | null;
  ta_compset_avg_rating?: number | null;
  ta_compset_avg_reviews?: number | null;
  ta_compset_avg_price_level?: number | null;
  ta_rating_vs_compset?: number | null;
  ta_reviews_vs_compset_ratio?: number | null;
  ta_review_languages?: string | null;
  ta_review_language_count?: number | null;
  ta_review_most_recent_date?: string | null;
  ta_review_recency_days?: number | null;
  ta_reviews_last_90d_est?: number | null;
  ta_owner_response_count?: number | null;
  ta_owner_response_rate?: number | null;
  ta_owner_response_avg_delay_hrs?: number | null;
  ta_reviewer_top_locations?: string | null;
  ta_avg_rating_en?: number | null;
  ta_avg_rating_de?: number | null;
  ta_avg_rating_fr?: number | null;
  ta_avg_rating_it?: number | null;
  ta_avg_rating_es?: number | null;
  ta_avg_rating_ja?: number | null;
  hs_gm_name?: string | null;
  hs_gm_title?: string | null;
  hs_gm_email?: string | null;
  hs_gm_confidence?: string | null;
  gp_accessibility_wheelchair_parking?: boolean | null;
  gp_accessibility_wheelchair_entrance?: boolean | null;
  gp_landmarks_nearby?: string | null;
  gp_timezone?: string | null;
  qna_count?: number | null;
  qna_unanswered_count?: number | null;
  qna_response_rate?: number | null;
  gmb_is_claimed?: boolean | null;
  gmb_popular_times?: Record<string, unknown> | null;
  gmb_place_topics?: Record<string, unknown> | Array<unknown> | null;
  gmb_hotel_star_rating?: number | null;
  gmb_book_online_url?: string | null;
  gmb_people_also_search?: Array<unknown> | null;
  gov_star_rating?: number | null;
  gov_star_source?: string | null;
  ai_visibility_score?: number | null;
  ai_chatgpt_mentioned?: boolean | null;
  ai_perplexity_mentioned?: boolean | null;
  dp_has_schema_hotel?: boolean | null;
  dp_schema_completeness?: number | null;
  cert_earthcheck?: boolean | null;
  cert_earthcheck_level?: string | null;
  bk_rating?: number | null;
  bk_num_reviews?: number | null;
  bk_star_rating?: number | null;
  rating_divergence_ta_vs_bk?: number | null;
  cx_active_job_count?: number | null;
  cx_hiring_departments?: string | null;
  score_cps_rating?: number | null;
  score_cps_visibility?: number | null;
  score_cps_amenity_advantage?: number | null;
  score_cps_amenity_gaps?: number | null;
  flag_tercier_high_priority?: boolean | null;
  cx_gm_email_gdpr_verified?: boolean | null;
  cx_gm_phone?: string | null;
  cx_gm_linkedin?: string | null;
  cx_gm_source?: string | null;
  cx_company_headcount?: number | null;
  cx_hiring_signals?: boolean | null;
  seo_domain_authority?: number | null;
  seo_monthly_traffic_est?: number | null;
  seo_organic_keywords?: number | null;
  seo_has_google_ads?: boolean | null;
  seo_ad_spend_est?: number | null;
  dp_website_tech_cms?: string | null;
  dp_website_tech_booking?: string | null;
  dp_website_tech_analytics?: string | null;
  dp_instagram_handle?: string | null;
  dp_instagram_exists?: boolean | null;
  dp_instagram_followers?: number | null;
  dp_has_active_social?: boolean | null;
  price_booking_com?: number | null;
  price_expedia?: number | null;
  price_hotels_com?: number | null;
  price_direct?: number | null;
  price_lowest_ota?: number | null;
  price_parity_score?: number | null;
  price_ota_count?: number | null;
  price_check_date?: string | null;
  cert_gstc?: boolean | null;
  cert_gstc_body?: string | null;
  cert_gstc_expiry?: string | null;
  cert_green_key?: boolean | null;
  cert_swisstainable?: string | null;
  osm_id?: string | null;
  osm_rooms?: number | null;
  osm_stars?: number | null;
  foursquare_id?: string | null;
  foursquare_popularity?: number | null;
  [key: string]: unknown;
}
