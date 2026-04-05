-- =============================================================
-- Add missing hotel intelligence fields from the architecture spec
-- =============================================================

-- A. TripAdvisor Core Identity
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS ta_write_review_url TEXT,
  ADD COLUMN IF NOT EXISTS ta_see_all_photos_url TEXT,
  ADD COLUMN IF NOT EXISTS ta_subcategory TEXT,
  ADD COLUMN IF NOT EXISTS ta_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ta_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ta_timezone TEXT;

-- B. Address & Geography
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS ta_neighborhood TEXT;

-- C. Quality & Reputation
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS ta_has_travelers_choice BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_travelers_choice_year TEXT;

-- E. Amenity Inventory
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS ta_amenities TEXT,
  ADD COLUMN IF NOT EXISTS ta_amenity_count INT,
  ADD COLUMN IF NOT EXISTS ta_has_free_wifi BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_pool BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_spa BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_fitness BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_restaurant BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_bar BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_parking BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_ev_charging BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_meeting_rooms BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_business_center BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_room_service BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_concierge BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_suites BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_pet_friendly BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_accessible BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_butler_service BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_babysitting BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_airport_transfer BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_breakfast BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_air_conditioning BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_has_minibar BOOLEAN,
  ADD COLUMN IF NOT EXISTS ta_languages_spoken TEXT;

-- F. Competitive Set
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS ta_competitor_1_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_1_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_1_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_1_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_2_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_2_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_2_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_2_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_3_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_3_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_3_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_3_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_4_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_4_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_4_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_4_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_5_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_5_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_5_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_5_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_6_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_6_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_6_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_6_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_7_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_7_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_7_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_7_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_8_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_8_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_8_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_8_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_9_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_9_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_9_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_9_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_10_id TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_10_name TEXT,
  ADD COLUMN IF NOT EXISTS ta_competitor_10_dist_km REAL,
  ADD COLUMN IF NOT EXISTS ta_competitor_10_bearing TEXT,
  ADD COLUMN IF NOT EXISTS ta_compset_count INT,
  ADD COLUMN IF NOT EXISTS ta_compset_avg_rating REAL,
  ADD COLUMN IF NOT EXISTS ta_compset_avg_reviews REAL,
  ADD COLUMN IF NOT EXISTS ta_compset_avg_price_level REAL,
  ADD COLUMN IF NOT EXISTS ta_rating_vs_compset REAL,
  ADD COLUMN IF NOT EXISTS ta_reviews_vs_compset_ratio REAL;

-- G. Review Intelligence
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS ta_review_languages TEXT,
  ADD COLUMN IF NOT EXISTS ta_review_language_count INT,
  ADD COLUMN IF NOT EXISTS ta_review_most_recent_date TEXT,
  ADD COLUMN IF NOT EXISTS ta_review_recency_days INT,
  ADD COLUMN IF NOT EXISTS ta_reviews_last_90d_est INT,
  ADD COLUMN IF NOT EXISTS ta_owner_response_count INT,
  ADD COLUMN IF NOT EXISTS ta_owner_response_rate REAL,
  ADD COLUMN IF NOT EXISTS ta_owner_response_avg_delay_hrs REAL,
  ADD COLUMN IF NOT EXISTS ta_reviewer_top_locations TEXT,
  ADD COLUMN IF NOT EXISTS ta_avg_rating_en REAL,
  ADD COLUMN IF NOT EXISTS ta_avg_rating_de REAL,
  ADD COLUMN IF NOT EXISTS ta_avg_rating_fr REAL,
  ADD COLUMN IF NOT EXISTS ta_avg_rating_it REAL,
  ADD COLUMN IF NOT EXISTS ta_avg_rating_es REAL,
  ADD COLUMN IF NOT EXISTS ta_avg_rating_ja REAL;

-- H. Cross-source enrichment aliases
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS hs_gm_name TEXT,
  ADD COLUMN IF NOT EXISTS hs_gm_title TEXT,
  ADD COLUMN IF NOT EXISTS hs_gm_email TEXT,
  ADD COLUMN IF NOT EXISTS hs_gm_confidence TEXT;

-- I. Google Places Intelligence
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS gp_accessibility_wheelchair_parking BOOLEAN,
  ADD COLUMN IF NOT EXISTS gp_accessibility_wheelchair_entrance BOOLEAN,
  ADD COLUMN IF NOT EXISTS gp_landmarks_nearby TEXT,
  ADD COLUMN IF NOT EXISTS gp_timezone TEXT;

-- K. Derived Intelligence Scores and flags
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS score_cps_rating REAL,
  ADD COLUMN IF NOT EXISTS score_cps_visibility REAL,
  ADD COLUMN IF NOT EXISTS score_cps_amenity_advantage INT,
  ADD COLUMN IF NOT EXISTS score_cps_amenity_gaps INT,
  ADD COLUMN IF NOT EXISTS flag_tercier_high_priority BOOLEAN;

-- L. Contact Enrichment
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS cx_gm_email_gdpr_verified BOOLEAN,
  ADD COLUMN IF NOT EXISTS cx_gm_phone TEXT,
  ADD COLUMN IF NOT EXISTS cx_gm_linkedin TEXT,
  ADD COLUMN IF NOT EXISTS cx_gm_source TEXT,
  ADD COLUMN IF NOT EXISTS cx_company_headcount INT,
  ADD COLUMN IF NOT EXISTS cx_hiring_signals BOOLEAN;

-- M. SEO & Digital Presence
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS seo_domain_authority INT,
  ADD COLUMN IF NOT EXISTS seo_monthly_traffic_est INT,
  ADD COLUMN IF NOT EXISTS seo_organic_keywords INT,
  ADD COLUMN IF NOT EXISTS seo_has_google_ads BOOLEAN,
  ADD COLUMN IF NOT EXISTS seo_ad_spend_est REAL,
  ADD COLUMN IF NOT EXISTS dp_website_tech_cms TEXT,
  ADD COLUMN IF NOT EXISTS dp_website_tech_booking TEXT,
  ADD COLUMN IF NOT EXISTS dp_website_tech_analytics TEXT,
  ADD COLUMN IF NOT EXISTS dp_instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS dp_instagram_exists BOOLEAN,
  ADD COLUMN IF NOT EXISTS dp_instagram_followers INT,
  ADD COLUMN IF NOT EXISTS dp_has_active_social BOOLEAN;

-- N. Price Intelligence
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS price_booking_com REAL,
  ADD COLUMN IF NOT EXISTS price_expedia REAL,
  ADD COLUMN IF NOT EXISTS price_hotels_com REAL,
  ADD COLUMN IF NOT EXISTS price_direct REAL,
  ADD COLUMN IF NOT EXISTS price_lowest_ota REAL,
  ADD COLUMN IF NOT EXISTS price_parity_score REAL,
  ADD COLUMN IF NOT EXISTS price_ota_count INT,
  ADD COLUMN IF NOT EXISTS price_check_date TEXT;

-- O. Sustainability & Certifications
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS cert_gstc BOOLEAN,
  ADD COLUMN IF NOT EXISTS cert_gstc_body TEXT,
  ADD COLUMN IF NOT EXISTS cert_gstc_expiry TEXT,
  ADD COLUMN IF NOT EXISTS cert_green_key BOOLEAN,
  ADD COLUMN IF NOT EXISTS cert_swisstainable TEXT;

-- P. Discovery & Cross-Reference
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS osm_id TEXT,
  ADD COLUMN IF NOT EXISTS osm_rooms INT,
  ADD COLUMN IF NOT EXISTS osm_stars INT,
  ADD COLUMN IF NOT EXISTS foursquare_id TEXT,
  ADD COLUMN IF NOT EXISTS foursquare_popularity REAL;
