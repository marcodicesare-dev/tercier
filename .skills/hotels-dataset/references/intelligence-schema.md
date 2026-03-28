# Hotel Intelligence Schema — Field Definitions

Every hotel in the global dataset conforms to this schema. 200+ fields across 8 categories.

---

## A. TripAdvisor Core Identity

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ta_location_id` | string | search/nearby | TripAdvisor unique ID (PRIMARY KEY) |
| `ta_name` | string | details | Name as registered on TripAdvisor |
| `ta_description` | string | details | Hotel's self-description text |
| `ta_web_url` | string | details | TripAdvisor listing URL |
| `ta_latitude` | float | details | Latitude (decimal degrees) |
| `ta_longitude` | float | details | Longitude (decimal degrees) |
| `ta_timezone` | string | details | IANA timezone (e.g., "Europe/Zurich") |
| `ta_category` | string | details | "hotel", "b_and_b", "inn", etc. |
| `ta_subcategory` | string | details | More specific type |
| `ta_brand` | string | details | Chain brand (null for independents) |
| `ta_parent_brand` | string | details | Parent brand group |
| `ta_write_review_url` | string | details | Link to leave a review |
| `ta_see_all_photos_url` | string | details | Link to photo gallery |

## B. Address & Geography

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ta_street1` | string | details | Street address line 1 |
| `ta_street2` | string | details | Street address line 2 |
| `ta_city` | string | details | City name |
| `ta_state` | string | details | State/province/canton |
| `ta_country` | string | details | Country name |
| `ta_postalcode` | string | details | Postal/zip code |
| `ta_address_string` | string | details | Full formatted address |
| `ta_ancestor_municipality` | string | details | Municipality from ancestors |
| `ta_ancestor_municipality_id` | string | details | Municipality TA location_id |
| `ta_ancestor_region` | string | details | Region/canton/state from ancestors |
| `ta_ancestor_region_id` | string | details | Region TA location_id |
| `ta_ancestor_country` | string | details | Country from ancestors |
| `ta_ancestor_country_id` | string | details | Country TA location_id |
| `ta_neighborhood` | string | details | Neighborhood name (if available) |

## C. Quality & Reputation

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ta_rating` | float | details | Overall rating (1.0-5.0) |
| `ta_num_reviews` | int | details | Total review count |
| `ta_rating_1_count` | int | details | Number of 1-star reviews |
| `ta_rating_2_count` | int | details | Number of 2-star reviews |
| `ta_rating_3_count` | int | details | Number of 3-star reviews |
| `ta_rating_4_count` | int | details | Number of 4-star reviews |
| `ta_rating_5_count` | int | details | Number of 5-star reviews |
| `ta_rating_5_pct` | float | computed | % of reviews that are 5-star |
| `ta_rating_negative_pct` | float | computed | % of 1+2 star reviews |
| `ta_subrating_location` | float | details | Location quality (1.0-5.0) |
| `ta_subrating_sleep` | float | details | Sleep quality (1.0-5.0) |
| `ta_subrating_rooms` | float | details | Room quality (1.0-5.0) |
| `ta_subrating_service` | float | details | Service quality (1.0-5.0) |
| `ta_subrating_value` | float | details | Value perception (1.0-5.0) |
| `ta_subrating_cleanliness` | float | details | Cleanliness (1.0-5.0) |
| `ta_subrating_min` | float | computed | Lowest subrating (weakness signal) |
| `ta_subrating_max` | float | computed | Highest subrating (strength signal) |
| `ta_subrating_range` | float | computed | Max - min (consistency signal) |
| `ta_price_level` | string | details | "$", "$$", "$$$", "$$$$" |
| `ta_price_level_numeric` | int | computed | 1-4 mapping |
| `ta_ranking` | int | details | Rank within city |
| `ta_ranking_out_of` | int | details | Total hotels in city |
| `ta_ranking_geo` | string | details | City name for ranking context |
| `ta_ranking_percentile` | float | computed | rank / out_of (lower = better) |
| `ta_awards` | string | details | Pipe-separated awards with years |
| `ta_has_travelers_choice` | boolean | computed | Has Travelers Choice award |
| `ta_travelers_choice_year` | string | computed | Most recent TC award year |
| `ta_photo_count` | int | details | Total photos on listing |

## D. Guest Segment Distribution

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ta_trip_type_business` | int | details | Business traveler count |
| `ta_trip_type_couples` | int | details | Couples count |
| `ta_trip_type_solo` | int | details | Solo traveler count |
| `ta_trip_type_family` | int | details | Family count |
| `ta_trip_type_friends` | int | details | Friends group count |
| `ta_trip_type_total` | int | computed | Sum of all trip types |
| `ta_segment_pct_business` | float | computed | Business / total |
| `ta_segment_pct_couples` | float | computed | Couples / total |
| `ta_segment_pct_solo` | float | computed | Solo / total |
| `ta_segment_pct_family` | float | computed | Family / total |
| `ta_segment_pct_friends` | float | computed | Friends / total |
| `ta_primary_segment` | string | computed | Dominant trip type |
| `ta_secondary_segment` | string | computed | Second-highest trip type |
| `ta_segment_diversity` | float | computed | Shannon entropy (0=uniform, higher=diverse) |
| `ta_is_business_heavy` | boolean | computed | Business > 40% |
| `ta_is_couples_heavy` | boolean | computed | Couples > 40% |
| `ta_is_family_heavy` | boolean | computed | Family > 30% |

## E. Amenity Inventory

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ta_amenities` | string | details | Pipe-separated full list |
| `ta_amenity_count` | int | computed | Total amenities |
| `ta_has_free_wifi` | boolean | computed | "Free Wifi" in amenities |
| `ta_has_pool` | boolean | computed | "Pool" or "Swimming Pool" in amenities |
| `ta_has_spa` | boolean | computed | Spa-related amenity present |
| `ta_has_fitness` | boolean | computed | Fitness center |
| `ta_has_restaurant` | boolean | computed | Restaurant on-site |
| `ta_has_bar` | boolean | computed | Bar/Lounge |
| `ta_has_parking` | boolean | computed | Parking available |
| `ta_has_ev_charging` | boolean | computed | EV charging station |
| `ta_has_meeting_rooms` | boolean | computed | Meeting/conference facilities |
| `ta_has_business_center` | boolean | computed | Business center |
| `ta_has_room_service` | boolean | computed | Room service |
| `ta_has_concierge` | boolean | computed | Concierge service |
| `ta_has_suites` | boolean | computed | Suites available |
| `ta_has_pet_friendly` | boolean | computed | Pets allowed |
| `ta_has_accessible` | boolean | computed | Accessible rooms |
| `ta_has_butler_service` | boolean | computed | Butler service |
| `ta_has_babysitting` | boolean | computed | Babysitting available |
| `ta_has_airport_transfer` | boolean | computed | Airport transportation |
| `ta_has_breakfast` | boolean | computed | Breakfast available |
| `ta_has_air_conditioning` | boolean | computed | Air conditioning |
| `ta_has_minibar` | boolean | computed | Minibar |
| `ta_languages_spoken` | string | computed | Languages extracted from amenity tags |

## F. Competitive Set

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ta_competitor_1_id` | string | nearby | Nearest competitor location_id |
| `ta_competitor_1_name` | string | nearby | Competitor name |
| `ta_competitor_1_dist_km` | float | nearby | Distance in km |
| `ta_competitor_1_bearing` | string | nearby | Compass direction |
| ... | ... | ... | (up to 10 competitors) |
| `ta_competitor_10_id` | string | nearby | 10th nearest |
| `ta_competitor_10_name` | string | nearby | |
| `ta_competitor_10_dist_km` | float | nearby | |
| `ta_competitor_10_bearing` | string | nearby | |
| `ta_compset_count` | int | computed | Number of competitors found (max 10) |
| `ta_compset_avg_rating` | float | computed | Mean rating of competitive set |
| `ta_compset_avg_reviews` | float | computed | Mean review count of compset |
| `ta_compset_avg_price_level` | float | computed | Mean price level of compset |
| `ta_rating_vs_compset` | float | computed | Hotel rating - compset avg (positive = outperforming) |
| `ta_reviews_vs_compset_ratio` | float | computed | Hotel reviews / compset avg (>1 = more visible) |

## G. Review Intelligence (Aggregated)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ta_review_languages` | string | reviews | Pipe-separated languages with reviews present |
| `ta_review_language_count` | int | computed | Number of languages with reviews |
| `ta_review_most_recent_date` | string | reviews | ISO date of newest review |
| `ta_review_recency_days` | int | computed | Days since most recent review |
| `ta_reviews_last_90d_est` | int | computed | Estimated reviews in last 90 days |
| `ta_owner_response_count` | int | reviews | Reviews with owner responses |
| `ta_owner_response_rate` | float | computed | Response count / total sampled |
| `ta_owner_response_avg_delay_hrs` | float | computed | Average hours between review and response |
| `ta_reviewer_top_locations` | string | reviews | Top 5 reviewer home locations (pipe-separated) |
| `ta_avg_rating_en` | float | computed | Average rating of English reviews |
| `ta_avg_rating_de` | float | computed | Average rating of German reviews |
| `ta_avg_rating_fr` | float | computed | Average rating of French reviews |
| `ta_avg_rating_it` | float | computed | Average rating of Italian reviews |
| `ta_avg_rating_es` | float | computed | Average rating of Spanish reviews |
| `ta_avg_rating_ja` | float | computed | Average rating of Japanese reviews |

## H. Cross-Source Enrichment (Swiss Hotels Only)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `hs_slug` | string | hotelleriesuisse | HotellerieSuisse member slug |
| `hs_star_rating` | int | hotelleriesuisse | Official Swiss star rating |
| `hs_is_superior` | boolean | hotelleriesuisse | Superior classification |
| `hs_hotel_type` | string | hotelleriesuisse | Hotel, Serviced Apartments, etc. |
| `hs_rooms_count` | int | hotelleriesuisse | Room count |
| `hs_phone` | string | hotelleriesuisse | Phone number |
| `hs_email` | string | hotelleriesuisse | Email address |
| `hs_website_url` | string | hotelleriesuisse | Official website |
| `hs_price_nightly_chf` | float | enriched | Nightly rate in CHF |
| `hs_revenue_proxy_chf` | float | enriched | Annual room revenue estimate |
| `hs_gm_name` | string | contact enrichment | General Manager name |
| `hs_gm_title` | string | contact enrichment | GM title |
| `hs_gm_email` | string | contact enrichment | GM direct email |
| `hs_gm_confidence` | string | contact enrichment | gold/silver/bronze/hold/unresolved |
| `hs_positioning_pillars` | string | website scrape | Key positioning themes |
| `hs_market_segment` | string | website scrape | Segment classification |
| `hs_booking_flow_type` | string | website scrape | native_direct, embedded_engine, etc. |
| `hs_audience_signals` | string | website scrape | Target audience indicators |

## I. Google Places Intelligence

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `gp_place_id` | string | Google Places | Google Place ID (PRIMARY KEY for Google) |
| `gp_rating` | float | Google Places | Google rating (1-5) |
| `gp_user_rating_count` | int | Google Places | Total Google reviews |
| `gp_primary_type` | string | Google Places | hotel, resort_hotel, boutique_hotel, etc. |
| `gp_editorial_summary` | string | Google Places | Google-curated 1-line description (~90% available) |
| `gp_review_summary_gemini` | string | Google Places | Gemini AI summary of full corpus (~20% available) |
| `gp_business_status` | string | Google Places | OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY |
| `gp_allows_dogs` | boolean | Google Places | Pet-friendly flag |
| `gp_good_for_children` | boolean | Google Places | Family-friendly flag |
| `gp_accessibility_wheelchair_parking` | boolean | Google Places | Wheelchair parking |
| `gp_accessibility_wheelchair_entrance` | boolean | Google Places | Wheelchair entrance |
| `gp_landmarks_nearby` | string | Google Places | Nearby landmarks with distances |
| `gp_areas` | string | Google Places | Neighborhood/district containment |
| `gp_timezone` | string | Google Places | IANA timezone |
| `gp_photo_count` | int | Google Places | Photos available (max 10) |

**NOTE:** Google `priceLevel` is null for ~90% of hotels. Dropped from schema. Use TA `price_level`.
**NOTE:** Google `paymentOptions` adds no hotel intelligence. Dropped from schema.

## J. Cross-Platform Derived

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `rating_divergence_ta_vs_google` | float | computed | TA rating minus Google rating (signal of different reviewer populations) |
| `review_count_ratio_google_vs_ta` | float | computed | Google reviews / TA reviews |
| `has_dual_platform_presence` | boolean | computed | Hotel found on both platforms |

## K. Derived Intelligence Scores

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ta_rating_5_pct` | float | computed | % of reviews that are 5-star (satisfaction proxy) |
| `ta_rating_negative_pct` | float | computed | % of 1+2 star reviews (risk signal) |
| `ta_subrating_min` | float | computed | Lowest subrating (weakness signal) |
| `ta_subrating_max` | float | computed | Highest subrating (strength signal) |
| `ta_subrating_range` | float | computed | Max - min (consistency signal: 0.3=consistent, 1.0=inconsistent) |
| `ta_subrating_weakest` | string | computed | Dimension name of lowest subrating |
| `ta_subrating_strongest` | string | computed | Dimension name of highest subrating |
| `ta_segment_diversity` | float | computed | Shannon entropy of trip type distribution |
| `score_hqi` | float | computed | Hotel Quality Index (0-1) |
| `score_cps_rating` | float | computed | Rating delta vs. compset |
| `score_cps_visibility` | float | computed | Review volume vs. compset |
| `score_cps_amenity_advantage` | int | computed | Unique amenities vs. compset |
| `score_cps_amenity_gaps` | int | computed | Missing amenities vs. compset |
| `score_tos` | float | computed | Tercier Opportunity Score (0-1) |
| `score_reputation_risk` | float | computed | Risk index (0-1, higher = riskier) |
| `score_digital_presence` | float | computed | Listing completeness index |
| `flag_is_independent` | boolean | computed | No brand/parent_brand |
| `flag_is_premium` | boolean | computed | Price level $$$ or $$$$ |
| `flag_is_luxury` | boolean | computed | Price level $$$$ |
| `flag_has_international_guests` | boolean | computed | Reviews in 3+ languages |
| `flag_needs_reputation_mgmt` | boolean | computed | Low response rate + negative reviews |
| `flag_tercier_high_priority` | boolean | computed | TOS > 0.7 |

## Key Patterns Discovered (from 10-hotel global sample, March 28 2026)

1. **Value is universally the weakest subrating** — ALL 10 hotels scored lowest on "value" (3.9-4.7). Structural for luxury. The product needs a value-perception content module.
2. **Subrating range = consistency signal** — Singita (0.3) = extremely consistent. Aman Tokyo (1.0) = big gap between rooms and value. Higher range = tension between experience quality and pricing.
3. **Trip types genuinely discriminate** — citizenM was business-primary (48%), all luxury hotels were couples-primary. This validates the data as real market intelligence.
4. **Google editorial summaries (~90% coverage)** are excellent content seeds — better than any TA description.
5. **Google Gemini summaries are unreliable** — only ~20% of hotels. Bonus when present, can't depend on it.
6. **Temporal data requires 2+ cycles** — Month 1 product delivery is limited to snapshot intelligence. Month 2+ unlocks "What Changed."

## L. Contact Enrichment (Fiber AI + Apollo + Hunter + Dropcontact)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `cx_gm_name` | string | Fiber/Apollo | General Manager / Hotel Director name |
| `cx_gm_email` | string | Hunter/Dropcontact | Verified email address |
| `cx_gm_email_gdpr_verified` | boolean | Dropcontact | GDPR-compliant verification passed |
| `cx_gm_phone` | string | Fiber/Apollo | Phone number |
| `cx_gm_linkedin` | string | Fiber | LinkedIn profile URL |
| `cx_gm_source` | string | computed | Primary source: fiber/apollo/hunter/dropcontact |
| `cx_gm_confidence` | string | computed | gold/silver/bronze/hold/unresolved |
| `cx_company_headcount` | int | Fiber | Estimated employee count |
| `cx_hiring_signals` | boolean | Fiber/Apollo | Active job postings detected |

## M. SEO & Digital Presence (SpyFu + Moz + Firecrawl)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `seo_domain_authority` | int | Moz | Domain Authority (0-100) |
| `seo_monthly_traffic_est` | int | SpyFu | Estimated monthly organic visits |
| `seo_organic_keywords` | int | SpyFu | Number of ranking organic keywords |
| `seo_has_google_ads` | boolean | SpyFu | Currently running Google Ads |
| `seo_ad_spend_est` | float | SpyFu | Estimated monthly ad spend (USD) |
| `dp_website_tech_cms` | string | Firecrawl DIY | CMS: wordpress/wix/squarespace/drupal/custom |
| `dp_website_tech_booking` | string | Firecrawl DIY | Booking engine: siteminder/cloudbeds/mews/synxis/d-edge/none |
| `dp_website_tech_analytics` | string | Firecrawl DIY | Analytics: ga4/matomo/none |
| `dp_instagram_handle` | string | Foursquare/Google | Instagram handle |
| `dp_instagram_exists` | boolean | Firecrawl | Handle found and active |
| `dp_instagram_followers` | int | Firecrawl | Follower count (scraped once) |
| `dp_has_active_social` | boolean | computed | Posted in last 90 days on any platform |

**NOTE:** Social media = 4 fields for digital maturity scoring. Not a social intelligence layer.

## N. Price Intelligence (SerpApi Google Hotels)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `price_booking_com` | float | SerpApi | Current nightly rate on Booking.com (USD) |
| `price_expedia` | float | SerpApi | Current nightly rate on Expedia (USD) |
| `price_hotels_com` | float | SerpApi | Current nightly rate on Hotels.com (USD) |
| `price_direct` | float | SerpApi | Current nightly rate on hotel website (USD) |
| `price_lowest_ota` | float | computed | Lowest OTA rate found |
| `price_parity_score` | float | computed | direct_rate / avg_ota_rate (>1 = overpriced direct) |
| `price_ota_count` | int | SerpApi | Number of OTAs listing the hotel |
| `price_check_date` | string | SerpApi | Date of price snapshot (ISO 8601) |

## O. Sustainability & Certifications

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `cert_gstc` | boolean | GSTC scrape | GSTC sustainability certified |
| `cert_gstc_body` | string | GSTC | Certification body name |
| `cert_gstc_expiry` | string | GSTC | Certification expiration date |
| `cert_green_key` | boolean | Green Key | Green Key eco-label |
| `cert_swisstainable` | string | hotelleriesuisse | Swisstainable level (Swiss only) |

## P. Discovery & Cross-Reference

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `osm_id` | string | OSM/Overpass | OpenStreetMap node/way ID |
| `osm_rooms` | int | OSM | Room count from OSM (if tagged) |
| `osm_stars` | int | OSM | Star rating from OSM (if tagged) |
| `foursquare_id` | string | Foursquare | Foursquare venue ID (Phase 2) |
| `foursquare_popularity` | float | Foursquare | Foot traffic score 0-1 (Phase 2) |
