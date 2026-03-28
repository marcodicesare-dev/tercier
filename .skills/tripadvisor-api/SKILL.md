---
name: tripadvisor-api
description: "Provides the complete reference for the TripAdvisor Content API. An agent should load this skill when building data pipelines, writing API calls, designing enrichment scripts, or making decisions about what data TripAdvisor can provide. Covers all 5 endpoints with verified response schemas, rate limits, multilingual capabilities, pagination, and usage patterns. API key is live."
---

# TripAdvisor Content API — Operational Reference

## Quick Facts

| Item | Value |
|------|-------|
| **Base URL** | `https://api.content.tripadvisor.com/api/v1` |
| **API Key** | env: `TRIPADVISOR_API_KEY` |
| **Auth** | Query parameter: `?key={key}` |
| **Rate Limit** | 50 calls/sec |
| **Response Format** | JSON |
| **Hotel Category Filter** | `category=hotels` |
| **Languages** | 45+ (see Language Codes below) |
| **Status** | Verified live — all endpoints tested March 28, 2026 |

---

## The 5 Endpoints

### 1. Location Search — `GET /location/search`

**Purpose:** Find hotels by name, brand, or keyword. Returns up to 10 results.

**When to use:** Matching known hotels to TripAdvisor IDs. Discovering chain properties by brand name.

```bash
curl -s "https://api.content.tripadvisor.com/api/v1/location/search?\
key=$TRIPADVISOR_API_KEY&\
searchQuery=Baur+au+Lac+Zurich&\
category=hotels&\
language=en" \
-H "accept: application/json"
```

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `key` | yes | string | API key |
| `searchQuery` | yes | string | Hotel name, brand, or keyword |
| `category` | no | string | `hotels`, `restaurants`, `attractions`, `geos` |
| `phone` | no | string | Phone filter (any format, NO "+" prefix) |
| `address` | no | string | Address text filter |
| `latLong` | no | string | `"47.3656,8.5378"` — scope to area |
| `radius` | no | number | Distance from latLong (requires radiusUnit) |
| `radiusUnit` | no | string | `km`, `mi`, `m` |
| `language` | no | string | Default `en`. See language codes. |

**Response:** Array of up to 10 locations with `location_id`, `name`, `address_obj`.

**Matching strategy for known hotels:**
1. **Name + phone** — highest confidence (phone is unique)
2. **Name + latLong + small radius** — high confidence with geo constraint
3. **Name + address** — match on address_string substring
4. **Name alone** — lowest confidence, verify with details endpoint

---

### 2. Nearby Location Search — `GET /location/nearby_search`

**Purpose:** Discover hotels near a lat/long point. Returns up to 10 nearest with distance. THE global discovery engine.

**When to use:** Building geo-grid discovery pipelines. Finding competitive sets. Spidering cities for all hotels.

```bash
curl -s "https://api.content.tripadvisor.com/api/v1/location/nearby_search?\
key=$TRIPADVISOR_API_KEY&\
latLong=47.3769,8.5417&\
category=hotels&\
language=en&\
radius=5&\
radiusUnit=km" \
-H "accept: application/json"
```

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `key` | yes | string | API key |
| `latLong` | yes | string | `"lat,lng"` — center point |
| `category` | no | string | `hotels` to filter to hotels only |
| `phone` | no | string | Phone filter |
| `address` | no | string | Address filter |
| `radius` | no | number | Search radius (default varies) |
| `radiusUnit` | no | string | `km`, `mi`, `m` |
| `language` | no | string | Default `en` |

**Response:** Array of up to 10 locations with `location_id`, `name`, `distance` (km), `bearing` (compass), `address_obj`.

**Verified global coverage:**
- Zurich (47.377, 8.542) → 10 hotels
- Paris (48.857, 2.352) → 10 hotels
- Dubai (25.205, 55.271) → 10 hotels

**Grid strategy for city coverage:**
- 0.5km spacing in dense urban centers
- 2km spacing in suburban/resort areas
- Deduplicate by `location_id` across overlapping cells

---

### 3. Location Details — `GET /location/{locationId}/details`

**Purpose:** Get EVERYTHING TripAdvisor knows about a property. The richest endpoint.

**When to use:** Enriching discovered hotels with full intelligence. This is where 80% of dataset value comes from.

```bash
curl -s "https://api.content.tripadvisor.com/api/v1/location/196060/details?\
key=$TRIPADVISOR_API_KEY&\
language=en&\
currency=CHF" \
-H "accept: application/json"
```

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `locationId` | yes (path) | int | TripAdvisor location ID |
| `key` | yes | string | API key |
| `language` | no | string | Default `en` |
| `currency` | no | string | ISO 4217 (e.g., `CHF`, `EUR`, `USD`) |

**Response fields (verified on Baur au Lac, id=196060):**

| Field | Type | Example | Intelligence Value |
|-------|------|---------|-------------------|
| `location_id` | string | `"196060"` | Primary key |
| `name` | string | `"Baur Au Lac"` | Display name |
| `description` | string | `"Since 1844..."` | Self-positioning text |
| `web_url` | string | Full TA listing URL | Reference link |
| `address_obj` | object | street1, city, country, postalcode | Full address |
| `latitude` | string | `"47.367363"` | Geolocation |
| `longitude` | string | `"8.539124"` | Geolocation |
| `timezone` | string | `"Europe/Zurich"` | Operational TZ |
| `rating` | string | `"4.7"` | Overall score (1.0-5.0) |
| `num_reviews` | string | `"1179"` | Total reviews |
| `review_rating_count` | object | `{"1":"22","2":"25","3":"42","4":"113","5":"977"}` | Rating distribution |
| `subratings` | object | 6 dimensions (see below) | Quality fingerprint |
| `price_level` | string | `"$$$$"` | Price positioning |
| `ranking_data` | object | rank, out_of, geo_name | City position |
| `trip_types` | array | 5 types with counts | Guest segments |
| `amenities` | array | 100+ string tags | Feature inventory |
| `awards` | array | type, year, images | Quality signals |
| `brand` | string | `"The Leading Hotels of the World"` | Chain affiliation |
| `parent_brand` | string | `"The Leading Hotels of the World, Ltd"` | Parent group |
| `category` | object | `{"name":"hotel"}` | Property type |
| `subcategory` | array | More specific types | Subclassification |
| `ancestors` | array | Municipality → Canton → Country | Geo hierarchy |
| `photo_count` | string | `"959"` | Visual content depth |
| `styles` | array | Style tags | Property character |
| `neighborhood_info` | array | Neighborhood data | Micro-location |

**Subratings (6 dimensions):**
1. `rate_location` — Location quality
2. `rate_sleep` — Sleep quality
3. `rate_room` — Room quality
4. `rate_service` — Service quality
5. `rate_value` — Value perception
6. `rate_cleanliness` — Cleanliness

Each has `name`, `localized_name`, `value` (string, e.g., "4.9").

**Trip types (5 segments with REAL counts):**
- `business` — Business travelers
- `couples` — Couples
- `solo` — Solo travelers
- `family` — Family travelers
- `friends` — Friends groups

Each has `name`, `localized_name`, `value` (string count, e.g., "267").

**Ranking data:**
```json
{
  "geo_location_id": "188113",
  "ranking_string": "#9 of 152 hotels in Zurich",
  "geo_location_name": "Zurich",
  "ranking_out_of": "152",
  "ranking": "9"
}
```

---

### 4. Location Reviews — `GET /location/{locationId}/reviews`

**Purpose:** Get recent reviews in a SPECIFIC language. Pagination works.

**When to use:** Building multilingual review corpus. Voice-of-customer intelligence. Sentiment analysis.

```bash
curl -s "https://api.content.tripadvisor.com/api/v1/location/196060/reviews?\
key=$TRIPADVISOR_API_KEY&\
language=en&\
limit=5&\
offset=0" \
-H "accept: application/json"
```

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `locationId` | yes (path) | int | TripAdvisor location ID |
| `key` | yes | string | API key |
| `language` | no | string | Returns reviews ONLY in this language |
| `limit` | no | number | Results per page (up to 5) |
| `offset` | no | number | Pagination offset |

**CRITICAL: Pagination works beyond 5.** Verified: offset=5 on Baur au Lac returned 8 additional English reviews. The "up to 5" is per request, not per hotel.

**Response fields per review:**

| Field | Type | Example |
|-------|------|---------|
| `id` | number | `1050138220` |
| `lang` | string | `"en"` |
| `location_id` | number | `196060` |
| `published_date` | string (ISO) | `"2026-02-18T07:44:56Z"` |
| `rating` | number | `5` |
| `text` | string | Full review text |
| `title` | string | Review headline |
| `trip_type` | string | `"Couples"`, `"Business"`, `"Family"`, `"Solo travel"`, `"Friends getaway"` |
| `travel_date` | string | `"2026-02-28"` |
| `helpful_votes` | number | `0` |
| `user.username` | string | `"tcitterio"` |
| `user.user_location` | object | `{"id":"187309","name":"Munich, Upper Bavaria, Bavaria"}` |
| `subratings` | object | Per-review: RATE_VALUE, RATE_ROOM, RATE_LOCATION, RATE_CLEANLINESS, RATE_SERVICE, RATE_SLEEP |
| `owner_response` | object or absent | `.text`, `.author`, `.published_date`, `.lang` |

**Multilingual coverage (verified):**
- English reviews → Baur au Lac: 13+ reviews (paginated)
- German reviews → Baur au Lac: 5+ reviews (includes complaints not in English)
- Japanese reviews → Park Hyatt Tokyo: 5+ reviews (native: 改装後も素敵なホテル)
- French reviews → Baur au Lac: 0 (data-dependent, not API limitation)

**Language selection strategy per market:**

| Hotel Country | Priority Languages |
|---------------|-------------------|
| Switzerland | en, de, fr, it, es, ru, ja, zh, ko, ar, pt |
| France | en, fr, de, es, it, ja, zh, ko, ar, ru |
| UAE/Gulf | en, ar, de, fr, ru, zh, ja, ko, es, it |
| Japan | ja, en, zh, ko, de, fr, es, it, ru |
| USA | en, es, fr, de, ja, zh, ko, it, ru, pt |

---

### 5. Location Photos — `GET /location/{locationId}/photos`

**Purpose:** Get photo metadata with URLs at multiple sizes.

```bash
curl -s "https://api.content.tripadvisor.com/api/v1/location/196060/photos?\
key=$TRIPADVISOR_API_KEY&\
language=en&\
source=Management" \
-H "accept: application/json"
```

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `locationId` | yes (path) | int | Location ID |
| `key` | yes | string | API key |
| `language` | no | string | Default `en` |
| `limit` | no | number | Results per page (up to 5) |
| `offset` | no | number | Pagination offset |
| `source` | no | string | `"Expert"`, `"Management"`, `"Traveler"` (comma-separated) |

**Response per photo:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Unique photo ID |
| `caption` | string | Photo description |
| `published_date` | string (ISO) | Upload date |
| `images` | object | 5 sizes: thumbnail (50x50), small (150x150), medium (250w), large (550w), original (full) |
| `album` | string | `"Hotel & Grounds"`, `"Dining"`, `"Room/Suite"` |
| `source.name` | string | `"Management"`, `"Expert"`, `"Traveler"` |

---

## Language Codes (45+)

```
ar, zh, zh_TW, da, nl,
en, en_AU, en_CA, en_HK, en_IN, en_IE, en_MY, en_NZ, en_PH, en_SG, en_ZA, en_UK,
fr, fr_BE, fr_CA, fr_CH,
de, de_AT,
el, iw, it, it_CH,
ja, ko, no,
pt, pt_PT,
ru,
es, es_AR, es_CO, es_MX, es_PE, es_VE, es_CL,
sv, th, tr, vi
```

**Core 11 for global coverage:** en, de, fr, it, es, ru, ja, zh, ko, ar, pt

---

## API Call Budget Planning

| Action | Calls | Notes |
|--------|-------|-------|
| Search (text) | 1 per query | Max 10 results |
| Nearby search | 1 per lat/long | Max 10 results |
| Details | 1 per hotel | All data in one call |
| Reviews (1 language) | 1 per page | 5 reviews per page, paginate with offset |
| Reviews (6 languages, 1 page each) | 6 per hotel | Standard coverage |
| Reviews (11 languages, 1 page each) | 11 per hotel | Premium coverage |
| Photos | 1 per page | 5 photos per page |

**At 50 calls/sec:**
- 1,000 detail calls = 20 seconds
- 10,000 detail calls = 3.3 minutes
- 100,000 detail calls = 33 minutes

---

## Patterns & Anti-Patterns

### DO
- Cache every raw API response in JSONL with timestamp
- Use `category=hotels` on all search/nearby calls
- Request details with `currency=CHF` for consistent pricing
- Paginate reviews with offset to get full coverage
- Query reviews in multiple languages per hotel
- Use phone number in search for high-confidence matching
- Deduplicate by `location_id` (it's globally unique)

### DON'T
- Don't make unbounded API loops without rate limiting
- Don't re-fetch cached data within 7 days
- Don't assume review language = guest nationality
- Don't trust `num_reviews` as exact (it's aggregate, not per-language)
- Don't flatten reviews into the hotel master (separate corpus)
- Don't hardcode the API key in committed code (use env/config)
- Don't expect all subratings to be present (some hotels lack them)
- Don't assume nearby_search returns hotels sorted by distance (verify)

---

## Using This Skill

Load `tripadvisor-api` whenever:
- Building or modifying TripAdvisor data pipelines
- Writing API client code
- Planning API call budgets
- Designing hotel matching/discovery strategies
- Working with review data or multilingual content
- Any task that involves TripAdvisor endpoints

Pair with `hotels-dataset` for pipeline architecture and data schema context.
Full endpoint response examples: `references/response-schemas.md`
