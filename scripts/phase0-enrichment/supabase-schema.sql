-- =============================================================
-- TERCIER PHASE 0 — Supabase Database Schema
-- =============================================================
-- Run this in your Supabase SQL Editor to set up the database.
-- Requires PostGIS extension for spatial index.
-- =============================================================

-- Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================
-- 1. HOTELS — Core hotel identity + all enrichment fields
-- =============================================================
CREATE TABLE IF NOT EXISTS hotels (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Source identity (at least one must be non-null)
  hs_slug                   TEXT UNIQUE,
  ta_location_id            TEXT UNIQUE,
  gp_place_id               TEXT UNIQUE,

  -- Canonical identity
  name                      TEXT NOT NULL,
  city                      TEXT,
  country                   TEXT,
  latitude                  DOUBLE PRECISION,
  longitude                 DOUBLE PRECISION,
  timezone                  TEXT,
  website_url               TEXT,
  phone                     TEXT,

  -- TripAdvisor core
  ta_name                   TEXT,
  ta_description            TEXT,
  ta_web_url                TEXT,
  ta_write_review_url       TEXT,
  ta_see_all_photos_url     TEXT,
  ta_category               TEXT,
  ta_subcategory            TEXT,
  ta_brand                  TEXT,
  ta_parent_brand           TEXT,
  ta_latitude               DOUBLE PRECISION,
  ta_longitude              DOUBLE PRECISION,
  ta_timezone               TEXT,
  ta_price_level            TEXT,
  ta_photo_count            INT,

  -- TripAdvisor address
  ta_street1                TEXT,
  ta_street2                TEXT,
  ta_city                   TEXT,
  ta_state                  TEXT,
  ta_country                TEXT,
  ta_postalcode             TEXT,
  ta_address_string         TEXT,
  ta_neighborhood           TEXT,

  -- TripAdvisor ancestors
  ta_ancestor_municipality      TEXT,
  ta_ancestor_municipality_id   TEXT,
  ta_ancestor_region            TEXT,
  ta_ancestor_region_id         TEXT,
  ta_ancestor_country           TEXT,
  ta_ancestor_country_id        TEXT,

  -- TripAdvisor ratings
  ta_rating                 REAL,
  ta_num_reviews            INT,
  ta_rating_1_count         INT,
  ta_rating_2_count         INT,
  ta_rating_3_count         INT,
  ta_rating_4_count         INT,
  ta_rating_5_count         INT,

  -- TripAdvisor subratings
  ta_subrating_location     REAL,
  ta_subrating_sleep        REAL,
  ta_subrating_rooms        REAL,
  ta_subrating_service      REAL,
  ta_subrating_value        REAL,
  ta_subrating_cleanliness  REAL,

  -- TripAdvisor ranking
  ta_ranking                INT,
  ta_ranking_out_of         INT,
  ta_ranking_geo            TEXT,
  ta_has_travelers_choice   BOOLEAN,
  ta_travelers_choice_year  TEXT,

  -- TripAdvisor trip types (raw counts)
  ta_trip_type_business     INT,
  ta_trip_type_couples      INT,
  ta_trip_type_solo         INT,
  ta_trip_type_family       INT,
  ta_trip_type_friends      INT,

  -- TripAdvisor awards
  ta_awards                 JSONB DEFAULT '[]'::jsonb,

  -- TripAdvisor amenities and inventory
  ta_amenities              TEXT,
  ta_amenity_count          INT,
  ta_has_free_wifi          BOOLEAN,
  ta_has_pool               BOOLEAN,
  ta_has_spa                BOOLEAN,
  ta_has_fitness            BOOLEAN,
  ta_has_restaurant         BOOLEAN,
  ta_has_bar                BOOLEAN,
  ta_has_parking            BOOLEAN,
  ta_has_ev_charging        BOOLEAN,
  ta_has_meeting_rooms      BOOLEAN,
  ta_has_business_center    BOOLEAN,
  ta_has_room_service       BOOLEAN,
  ta_has_concierge          BOOLEAN,
  ta_has_suites             BOOLEAN,
  ta_has_pet_friendly       BOOLEAN,
  ta_has_accessible         BOOLEAN,
  ta_has_butler_service     BOOLEAN,
  ta_has_babysitting        BOOLEAN,
  ta_has_airport_transfer   BOOLEAN,
  ta_has_breakfast          BOOLEAN,
  ta_has_air_conditioning   BOOLEAN,
  ta_has_minibar            BOOLEAN,
  ta_languages_spoken       TEXT,

  -- TripAdvisor competitive set cache (denormalized convenience fields)
  ta_competitor_1_id        TEXT,
  ta_competitor_1_name      TEXT,
  ta_competitor_1_dist_km   REAL,
  ta_competitor_1_bearing   TEXT,
  ta_competitor_2_id        TEXT,
  ta_competitor_2_name      TEXT,
  ta_competitor_2_dist_km   REAL,
  ta_competitor_2_bearing   TEXT,
  ta_competitor_3_id        TEXT,
  ta_competitor_3_name      TEXT,
  ta_competitor_3_dist_km   REAL,
  ta_competitor_3_bearing   TEXT,
  ta_competitor_4_id        TEXT,
  ta_competitor_4_name      TEXT,
  ta_competitor_4_dist_km   REAL,
  ta_competitor_4_bearing   TEXT,
  ta_competitor_5_id        TEXT,
  ta_competitor_5_name      TEXT,
  ta_competitor_5_dist_km   REAL,
  ta_competitor_5_bearing   TEXT,
  ta_competitor_6_id        TEXT,
  ta_competitor_6_name      TEXT,
  ta_competitor_6_dist_km   REAL,
  ta_competitor_6_bearing   TEXT,
  ta_competitor_7_id        TEXT,
  ta_competitor_7_name      TEXT,
  ta_competitor_7_dist_km   REAL,
  ta_competitor_7_bearing   TEXT,
  ta_competitor_8_id        TEXT,
  ta_competitor_8_name      TEXT,
  ta_competitor_8_dist_km   REAL,
  ta_competitor_8_bearing   TEXT,
  ta_competitor_9_id        TEXT,
  ta_competitor_9_name      TEXT,
  ta_competitor_9_dist_km   REAL,
  ta_competitor_9_bearing   TEXT,
  ta_competitor_10_id       TEXT,
  ta_competitor_10_name     TEXT,
  ta_competitor_10_dist_km  REAL,
  ta_competitor_10_bearing  TEXT,
  ta_compset_count          INT,
  ta_compset_avg_rating     REAL,
  ta_compset_avg_reviews    REAL,
  ta_compset_avg_price_level REAL,
  ta_rating_vs_compset      REAL,
  ta_reviews_vs_compset_ratio REAL,

  -- TripAdvisor review intelligence (aggregated)
  ta_review_languages       TEXT,
  ta_review_language_count  INT,
  ta_review_most_recent_date TEXT,
  ta_review_recency_days    INT,
  ta_reviews_last_90d_est   INT,
  ta_owner_response_count   INT,
  ta_owner_response_rate    REAL,
  ta_owner_response_avg_delay_hrs REAL,
  ta_reviewer_top_locations TEXT,
  ta_avg_rating_en          REAL,
  ta_avg_rating_de          REAL,
  ta_avg_rating_fr          REAL,
  ta_avg_rating_it          REAL,
  ta_avg_rating_es          REAL,
  ta_avg_rating_ja          REAL,

  -- Google Places core
  gp_name                   TEXT,
  gp_rating                 REAL,
  gp_user_rating_count      INT,
  gp_primary_type           TEXT,
  gp_business_status        TEXT,
  gp_editorial_summary      TEXT,
  gp_review_summary_gemini  TEXT,
  gp_formatted_address      TEXT,
  gp_short_address          TEXT,
  gp_allows_dogs            BOOLEAN,
  gp_good_for_children      BOOLEAN,
  gp_wheelchair_parking     BOOLEAN,
  gp_wheelchair_entrance    BOOLEAN,
  gp_accessibility_wheelchair_parking BOOLEAN,
  gp_accessibility_wheelchair_entrance BOOLEAN,
  gp_photo_count            INT,
  gp_landmarks              JSONB DEFAULT '[]'::jsonb,
  gp_landmarks_nearby       TEXT,
  gp_areas                  JSONB DEFAULT '[]'::jsonb,
  gp_timezone               TEXT,

  -- HotellerieSuisse source data
  hs_star_rating            INT,
  hs_is_superior            BOOLEAN,
  hs_hotel_type             TEXT,
  hs_rooms_count            INT,
  hs_phone                  TEXT,
  hs_email                  TEXT,
  hs_website_url            TEXT,
  hs_price_nightly_chf      REAL,
  hs_revenue_proxy_chf      REAL,
  hs_market_segment         TEXT,
  hs_booking_flow_type      TEXT,
  hs_positioning_pillars    TEXT,
  hs_audience_signals       TEXT,
  hs_gm_name                TEXT,
  hs_gm_title               TEXT,
  hs_gm_email               TEXT,
  hs_gm_confidence          TEXT,

  -- Contact enrichment
  cx_gm_name                TEXT,
  cx_gm_title               TEXT,
  cx_gm_email               TEXT,
  cx_gm_email_gdpr_verified BOOLEAN,
  cx_gm_phone               TEXT,
  cx_gm_linkedin            TEXT,
  cx_gm_source              TEXT,
  cx_gm_confidence          TEXT,
  cx_company_headcount      INT,
  cx_hiring_signals         BOOLEAN,

  -- SEO and digital presence
  seo_domain_authority      INT,
  seo_monthly_traffic_est   INT,
  seo_organic_keywords      INT,
  seo_has_google_ads        BOOLEAN,
  seo_ad_spend_est          REAL,
  dp_website_tech_cms       TEXT,
  dp_website_tech_booking   TEXT,
  dp_website_tech_analytics TEXT,
  dp_instagram_handle       TEXT,
  dp_instagram_exists       BOOLEAN,
  dp_instagram_followers    INT,
  dp_has_active_social      BOOLEAN,

  -- Price intelligence
  price_booking_com         REAL,
  price_expedia             REAL,
  price_hotels_com          REAL,
  price_direct              REAL,
  price_lowest_ota          REAL,
  price_parity_score        REAL,
  price_ota_count           INT,
  price_check_date          TEXT,

  -- Sustainability and certifications
  cert_gstc                 BOOLEAN,
  cert_gstc_body            TEXT,
  cert_gstc_expiry          TEXT,
  cert_green_key            BOOLEAN,
  cert_swisstainable        TEXT,

  -- Discovery and cross-reference
  osm_id                    TEXT,
  osm_rooms                 INT,
  osm_stars                 INT,
  foursquare_id             TEXT,
  foursquare_popularity     REAL,

  -- Derived / computed fields
  ta_rating_5_pct           REAL,
  ta_rating_negative_pct    REAL,
  ta_subrating_min          REAL,
  ta_subrating_max          REAL,
  ta_subrating_range        REAL,
  ta_subrating_weakest      TEXT,
  ta_subrating_strongest    TEXT,
  ta_price_level_numeric    INT,
  ta_ranking_percentile     REAL,
  ta_trip_type_total        INT,
  ta_segment_pct_business   REAL,
  ta_segment_pct_couples    REAL,
  ta_segment_pct_solo       REAL,
  ta_segment_pct_family     REAL,
  ta_segment_pct_friends    REAL,
  ta_primary_segment        TEXT,
  ta_secondary_segment      TEXT,
  ta_segment_diversity      REAL,
  ta_is_business_heavy      BOOLEAN,
  ta_is_couples_heavy       BOOLEAN,
  ta_is_family_heavy        BOOLEAN,

  -- Cross-platform derived
  rating_divergence_ta_vs_google    REAL,
  review_count_ratio_google_vs_ta   REAL,
  has_dual_platform_presence        BOOLEAN,

  -- Flags
  flag_is_independent       BOOLEAN,
  flag_is_premium           BOOLEAN,
  flag_is_luxury            BOOLEAN,
  flag_has_international_guests     BOOLEAN,
  flag_needs_reputation_mgmt       BOOLEAN,
  flag_active_reputation_mgmt      BOOLEAN,
  flag_tercier_high_priority BOOLEAN,

  -- Scores
  score_hqi                 REAL,
  score_cps_rating          REAL,
  score_cps_visibility      REAL,
  score_cps_amenity_advantage INT,
  score_cps_amenity_gaps    INT,
  score_tos                 REAL,
  score_reputation_risk     REAL,
  score_digital_presence    REAL,

  -- Pipeline metadata
  enrichment_status         TEXT DEFAULT 'pending',
  ta_matched_at             TIMESTAMPTZ,
  ta_enriched_at            TIMESTAMPTZ,
  gp_matched_at             TIMESTAMPTZ,
  gp_enriched_at            TIMESTAMPTZ,
  computed_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hotels_enrichment_status ON hotels(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_hotels_ta_location_id ON hotels(ta_location_id);
CREATE INDEX IF NOT EXISTS idx_hotels_gp_place_id ON hotels(gp_place_id);
CREATE INDEX IF NOT EXISTS idx_hotels_hs_slug ON hotels(hs_slug);
CREATE INDEX IF NOT EXISTS idx_hotels_country ON hotels(country);
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_ta_rating ON hotels(ta_rating);
CREATE INDEX IF NOT EXISTS idx_hotels_score_tos ON hotels(score_tos);

-- Spatial index (requires PostGIS)
CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels USING gist (
  ST_MakePoint(longitude, latitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hotels_updated_at ON hotels;
CREATE TRIGGER hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================
-- 2. HOTEL AMENITIES — Normalized amenity inventory
-- =============================================================
CREATE TABLE IF NOT EXISTS hotel_amenities (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  source      TEXT NOT NULL,
  amenity     TEXT NOT NULL,
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(hotel_id, source, amenity)
);

CREATE INDEX IF NOT EXISTS idx_amenities_hotel ON hotel_amenities(hotel_id);
CREATE INDEX IF NOT EXISTS idx_amenities_category ON hotel_amenities(category);


-- =============================================================
-- 3. HOTEL REVIEWS — Individual reviews from both platforms
-- =============================================================
CREATE TABLE IF NOT EXISTS hotel_reviews (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id              UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  source                TEXT NOT NULL,
  source_review_id      TEXT,

  lang                  TEXT NOT NULL,
  rating                REAL,
  title                 TEXT,
  text                  TEXT,
  trip_type             TEXT,
  travel_date           TEXT,
  published_date        TIMESTAMPTZ,
  helpful_votes         INT DEFAULT 0,

  reviewer_username     TEXT,
  reviewer_location     TEXT,
  reviewer_location_id  TEXT,

  has_owner_response    BOOLEAN DEFAULT FALSE,
  owner_response_text   TEXT,
  owner_response_author TEXT,
  owner_response_date   TIMESTAMPTZ,
  owner_response_lang   TEXT,

  subratings            JSONB,

  created_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(hotel_id, source, source_review_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_hotel ON hotel_reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_lang ON hotel_reviews(lang);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON hotel_reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON hotel_reviews(published_date);


-- =============================================================
-- 4. HOTEL COMPETITORS — Competitive set per hotel
-- =============================================================
CREATE TABLE IF NOT EXISTS hotel_competitors (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  competitor_rank   INT NOT NULL,

  ta_location_id    TEXT,
  name              TEXT NOT NULL,
  distance_km       REAL,
  bearing           TEXT,

  competitor_hotel_id  UUID REFERENCES hotels(id),

  created_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(hotel_id, competitor_rank)
);

CREATE INDEX IF NOT EXISTS idx_competitors_hotel ON hotel_competitors(hotel_id);
CREATE INDEX IF NOT EXISTS idx_competitors_ta_id ON hotel_competitors(ta_location_id);


-- =============================================================
-- 5. HOTEL LANG RATINGS — Per-language rating aggregates
-- =============================================================
CREATE TABLE IF NOT EXISTS hotel_lang_ratings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  lang        TEXT NOT NULL,
  avg_rating  REAL,
  review_count INT DEFAULT 0,

  UNIQUE(hotel_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_lang_ratings_hotel ON hotel_lang_ratings(hotel_id);


-- =============================================================
-- 6. ENRICHMENT SNAPSHOTS — Temporal tracking
-- =============================================================
CREATE TABLE IF NOT EXISTS enrichment_snapshots (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,

  ta_rating       REAL,
  ta_num_reviews  INT,
  gp_rating       REAL,
  gp_user_rating_count INT,
  ta_ranking      INT,
  ta_ranking_out_of INT,

  ta_subrating_location    REAL,
  ta_subrating_sleep       REAL,
  ta_subrating_rooms       REAL,
  ta_subrating_service     REAL,
  ta_subrating_value       REAL,
  ta_subrating_cleanliness REAL,

  ta_trip_type_business    INT,
  ta_trip_type_couples     INT,
  ta_trip_type_solo        INT,
  ta_trip_type_family      INT,
  ta_trip_type_friends     INT,

  score_hqi                REAL,
  score_tos                REAL,

  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(hotel_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_hotel ON enrichment_snapshots(hotel_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON enrichment_snapshots(snapshot_date);


-- =============================================================
-- 7. PIPELINE RUNS — Audit trail
-- =============================================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  step            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'running',
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,

  hotels_total    INT,
  hotels_processed INT DEFAULT 0,
  hotels_matched  INT DEFAULT 0,
  hotels_failed   INT DEFAULT 0,

  error_message   TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb
);


-- =============================================================
-- DONE. 7 tables created.
-- =============================================================
