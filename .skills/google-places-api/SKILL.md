---
name: google-places-api
description: "Provides the complete reference for the Google Places API (New). An agent should load this skill when building data pipelines, enrichment scripts, or making decisions about hotel data from Google. Covers all 5 endpoints with verified response schemas, field masks by SKU tier, pricing, and known limitations for hotels. API key is live. Complements the TripAdvisor API skill — Google provides editorial summaries, landmarks, family/pet flags, and Gemini AI review summaries that TA lacks."
---

# Google Places API (New) — Operational Reference

## Quick Facts

| Item | Value |
|------|-------|
| **Base URL** | `https://places.googleapis.com/v1` |
| **API Key** | env: `GOOGLE_PLACES_API_KEY` |
| **Auth** | Header: `X-Goog-Api-Key: {key}` |
| **Field Mask** | Header: `X-Goog-FieldMask: {fields}` (REQUIRED on every request) |
| **Language** | Header: `X-Goog-Api-Language-Code: {lang}` (optional) |
| **Response Format** | JSON only |
| **Hotel Types** | `hotel`, `resort_hotel`, `extended_stay_hotel`, `lodging`, `inn`, `bed_and_breakfast`, + 12 more |
| **Free Tier** | $200/month credit + SKU-specific free quotas |
| **Status** | Verified live — all endpoints tested March 28, 2026 |

---

## The 5 Endpoints

### 1. Text Search — `POST /places:searchText`

**Purpose:** Find hotels by name, description, or category within a geographic area. Returns up to 20 results per page, 60 max with pagination.

**When to use:** Discovering hotels in a city. Searching by hotel name. Filtering by rating or price level.

```bash
curl -X POST -d '{
  "textQuery": "luxury hotels in Zurich",
  "includedType": "hotel",
  "languageCode": "en",
  "pageSize": 20
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
-H 'X-Goog-FieldMask: places.displayName,places.id,places.rating,places.userRatingCount,places.formattedAddress,places.location,places.primaryType,places.websiteUri,places.businessStatus' \
'https://places.googleapis.com/v1/places:searchText'
```

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `textQuery` | yes | string | Search text (hotel name, "hotels in Paris", etc.) |
| `includedType` | no | string | Table A type filter (use `hotel` for hotels) |
| `languageCode` | no | string | Default `en` |
| `locationBias` | no | object | Circle or rectangle to bias results toward |
| `locationRestriction` | no | object | Rectangle to restrict results (categorical queries only) |
| `minRating` | no | float | 0.0-5.0, increments of 0.5 |
| `priceLevels` | no | string[] | Filter by price level |
| `openNow` | no | bool | Currently open only |
| `pageSize` | no | int | 1-20, default 20 |
| `pageToken` | no | string | For pagination (from `nextPageToken` in response) |
| `rankPreference` | no | string | `RELEVANCE` or `DISTANCE` |
| `regionCode` | no | string | 2-char CLDR code |
| `strictTypeFiltering` | no | bool | Only return specified type |

**Response:** `{ "places": [...], "nextPageToken": "..." }`

**Pagination:** Up to 3 pages (60 results). Use `nextPageToken` from response as `pageToken` in next request. All other params must stay identical.

**Pricing:** $32/1000 (Pro), $35/1000 (Enterprise), $40/1000 (Enterprise + Atmosphere)

---

### 2. Nearby Search — `POST /places:searchNearby`

**Purpose:** Discover hotels near a geographic point. Returns up to 20 results. No pagination.

**When to use:** Geo-grid discovery. Building competitive sets. Spidering cities.

```bash
curl -X POST -d '{
  "includedTypes": ["hotel", "lodging"],
  "maxResultCount": 20,
  "rankPreference": "DISTANCE",
  "locationRestriction": {
    "circle": {
      "center": {"latitude": 47.367, "longitude": 8.539},
      "radius": 2000.0
    }
  }
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
-H 'X-Goog-FieldMask: places.displayName,places.id,places.rating,places.userRatingCount,places.formattedAddress,places.location,places.primaryType' \
'https://places.googleapis.com/v1/places:searchNearby'
```

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `locationRestriction` | yes | object | Circle with center (lat/lng) and radius (0-50,000m) |
| `includedTypes` | no | string[] | Up to 50 Table A types |
| `excludedTypes` | no | string[] | Up to 50 types to exclude |
| `includedPrimaryTypes` | no | string[] | Filter by primary type |
| `maxResultCount` | no | int | 1-20, default 20 |
| `rankPreference` | no | string | `POPULARITY` (default) or `DISTANCE` |
| `languageCode` | no | string | Default `en` |

**Response:** `{ "places": [...] }` — NO pagination. Single page only.

**Pricing:** $32/1000 (Pro), $35/1000 (Enterprise), $40/1000 (Enterprise + Atmosphere)

---

### 3. Place Details — `GET /places/{PLACE_ID}`

**Purpose:** Get full intelligence on a single hotel. Up to 80+ fields. The primary enrichment endpoint.

**When to use:** Enriching known hotels. Getting reviews, photos, AI summaries.

```bash
curl -H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
-H 'X-Goog-FieldMask: displayName,id,rating,userRatingCount,primaryType,types,formattedAddress,addressComponents,location,internationalPhoneNumber,websiteUri,googleMapsUri,businessStatus,editorialSummary,reviewSummary,reviews,regularOpeningHours,goodForChildren,allowsDogs,accessibilityOptions,paymentOptions,photos,addressDescriptor,timeZone' \
'https://places.googleapis.com/v1/places/ChIJZcrzZBcLkEcROaEB21geaZk'
```

**Note:** Field mask for Place Details does NOT use `places.` prefix (unlike Search endpoints).

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| PLACE_ID | yes | path | Google Place ID (e.g., `ChIJZcrzZBcLkEcROaEB21geaZk`) |
| FieldMask | yes | header | Comma-separated field names |
| languageCode | no | header | Via `X-Goog-Api-Language-Code` |
| regionCode | no | query | 2-char CLDR |
| sessionToken | no | query | For Autocomplete session billing |

**Returns:** Single Place object with requested fields. 5 reviews max, 10 photos max.

**Pricing:** $5/1000 (Essentials), $17/1000 (Pro), $20/1000 (Enterprise), $25/1000 (Enterprise + Atmosphere)

---

### 4. Place Photos — `GET /places/{PLACE_ID}/photos/{PHOTO_REF}/media`

**Purpose:** Get actual photo images for a hotel. Up to 4800px resolution.

```bash
curl -H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
'https://places.googleapis.com/v1/places/ChIJZcrzZBcLkEcROaEB21geaZk/photos/{PHOTO_NAME}/media?maxHeightPx=1200&maxWidthPx=1200'
```

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| PHOTO_NAME | yes | path | From `photos[].name` in Place Details response |
| `maxHeightPx` | one required | int | 1-4800 |
| `maxWidthPx` | one required | int | 1-4800 |
| `skipHttpRedirect` | no | bool | true = return JSON with URL; false = 302 redirect to image |

**Response:** HTTP 302 redirect to `https://lh3.googleusercontent.com/places/...` or JSON with `photoUri`.

**Limits:** 10 photos per place. Photo names expire — always fetch fresh from Place Details.

**Pricing:** $7/1000

---

### 5. Autocomplete — `POST /places:autocomplete`

**Purpose:** Match hotel names to Google Place IDs. Returns up to 5 suggestions.

**When to use:** Matching known hotels from our dataset to Google. Finding Place IDs by name.

```bash
curl -X POST -d '{
  "input": "Mandarin Oriental",
  "includedPrimaryTypes": ["hotel"],
  "languageCode": "en"
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: $GOOGLE_PLACES_API_KEY" \
'https://places.googleapis.com/v1/places:autocomplete'
```

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `input` | yes | string | Search text (hotel name, partial name) |
| `includedPrimaryTypes` | no | string[] | Up to 5 types (use `["hotel"]`) |
| `locationBias` | no | object | Bias toward area |
| `locationRestriction` | no | object | Restrict to area |
| `includedRegionCodes` | no | string[] | Up to 15 country codes |
| `origin` | no | object | Lat/lng for distance calculation |
| `languageCode` | no | string | Default `en` |
| `sessionToken` | no | string | For billing optimization |

**Response:** `{ "suggestions": [{ "placePrediction": { "placeId": "...", ... } }] }`

**Max results:** 5 suggestions.

**Pricing:** $2.83/1000 (Essentials)

---

## Field Mask System — By SKU Tier

### Essentials ID Only ($5/1000 for Details)
```
id, name, attributions, photos, movedPlace, movedPlaceId
```

### Essentials ($5/1000 for Details)
```
addressComponents, addressDescriptor, adrFormatAddress, formattedAddress,
location, plusCode, postalAddress, shortFormattedAddress, types, viewport
```

### Pro ($17/1000 Details, $32/1000 Search)
```
accessibilityOptions, businessStatus, containingPlaces, displayName,
googleMapsLinks, googleMapsUri, iconBackgroundColor, iconMaskBaseUri,
openingDate, primaryType, primaryTypeDisplayName, pureServiceAreaBusiness,
subDestinations, timeZone, utcOffsetMinutes
```

### Enterprise ($20/1000 Details, $35/1000 Search)
```
currentOpeningHours, currentSecondaryOpeningHours, internationalPhoneNumber,
nationalPhoneNumber, priceLevel, priceRange, rating, regularOpeningHours,
regularSecondaryOpeningHours, userRatingCount, websiteUri
```

### Enterprise + Atmosphere ($25/1000 Details, $40/1000 Search)
```
allowsDogs, curbsidePickup, delivery, dineIn, editorialSummary,
evChargeOptions, fuelOptions, generativeSummary, goodForChildren,
goodForGroups, goodForWatchingSports, liveMusic, menuForChildren,
neighborhoodSummary, parkingOptions, paymentOptions, outdoorSeating,
reservable, restroom, reviews, reviewSummary, routingSummaries,
servesBeer, servesBreakfast, servesBrunch, servesCocktails, servesCoffee,
servesDessert, servesDinner, servesLunch, servesVegetarianFood,
servesWine, takeout
```

---

## Hotel-Relevant Lodging Types (Table A)

For discovery, use these types in `includedTypes` / `includedPrimaryTypes`:

| Type | Description | Tercier Target? |
|------|-------------|----------------|
| `hotel` | Standard hotels | Yes |
| `resort_hotel` | Resort properties | Yes |
| `extended_stay_hotel` | Extended stay | Yes |
| `bed_and_breakfast` | B&Bs | Yes |
| `inn` | Inns | Yes |
| `lodging` | General lodging (catch-all) | Yes |
| `guest_house` | Guest houses | Phase 2+ |
| `hostel` | Hostels | No |
| `motel` | Motels | No |
| `cottage` | Holiday cottages | No |
| `farmstay` | Farm stays | Phase 2+ |
| `japanese_inn` | Ryokan | Phase 2+ |
| `budget_japanese_inn` | Budget ryokan | No |
| `camping_cabin` | Glamping/cabins | No |
| `private_guest_room` | Airbnb-style | No |
| `campground` | Campgrounds | No |
| `mobile_home_park` | Mobile homes | No |
| `rv_park` | RV parks | No |

---

## Reviews — What's Available

| Feature | Value |
|---------|-------|
| Reviews per request | **5** (most relevant, not configurable) |
| Pagination | **None** — always 5 |
| Full text | Yes |
| Original language preserved | Yes (`originalText.languageCode`) |
| Auto-translation | Yes (`text` field translated to request language) |
| Author name | Yes |
| Author photo URL | Yes |
| Rating per review | Yes (1-5) |
| Publish timestamp | Yes (ISO 8601) |
| Visit date | Sometimes (`visitDate: {year, month}`) |
| AI summary of ALL reviews | Yes (`reviewSummary` — "Summarized with Gemini") |

**Key insight:** The `reviewSummary` field summarizes the ENTIRE review corpus (not just the 5 returned), using Gemini. This is unique to Google and extremely valuable for hotel intelligence.

---

## Pricing Quick Reference

| Endpoint | Tier | Per 1,000 | Free/month |
|----------|------|-----------|------------|
| Text Search | Pro | $32 | 5,000 |
| Text Search | Enterprise + Atmos | $40 | 1,000 |
| Nearby Search | Pro | $32 | 5,000 |
| Nearby Search | Enterprise + Atmos | $40 | 1,000 |
| Place Details | Essentials | $5 | 10,000 |
| Place Details | Pro | $17 | 5,000 |
| Place Details | Enterprise + Atmos | $25 | 1,000 |
| Autocomplete | Essentials | $2.83 | 10,000 |
| Photos | Enterprise | $7 | 1,000 |

**Cost for Tercier phases:**
- Phase 0 (2,069 Swiss hotels): ~$82
- Phase 1 (50K European): ~$3,250
- Phase 2 (500K global): ~$20,500
- Phase 3 (1.5M global): ~$52,500

---

## Recommended Field Masks

### For Discovery (Text/Nearby Search — Pro tier, $32/1000)
```
places.displayName,places.id,places.rating,places.userRatingCount,
places.primaryType,places.types,places.formattedAddress,places.location,
places.businessStatus,places.websiteUri
```

### For Full Enrichment (Place Details — Enterprise+Atmosphere tier, $25/1000)
```
displayName,id,rating,userRatingCount,priceLevel,primaryType,types,
formattedAddress,shortFormattedAddress,addressComponents,postalAddress,
location,plusCode,internationalPhoneNumber,nationalPhoneNumber,
websiteUri,googleMapsUri,googleMapsLinks,businessStatus,
editorialSummary,reviewSummary,reviews,
regularOpeningHours,timeZone,utcOffsetMinutes,
goodForChildren,allowsDogs,accessibilityOptions,parkingOptions,
paymentOptions,photos,addressDescriptor,containingPlaces,openingDate
```

---

## Known Limitations

1. **Reviews limited to 5** — no pagination, no way to get more
2. **priceLevel sparse for hotels** — most hotels lack this field entirely
3. **No subratings** — single overall rating only (TripAdvisor has 6 dimensions)
4. **No trip type data** — no business/couples/solo/family breakdown (TripAdvisor has this)
5. **No ranking data** — no "#3 of 142 hotels in Zurich" equivalent
6. **No amenity list** — inferred from types only, not explicit amenity inventory
7. **No owner responses** — reviews are guest-only
8. **60 results max per text search** — need geo-grid for comprehensive discovery
9. **20 results max per nearby search** — need overlapping circles for dense areas
10. **Photo names expire** — must always fetch fresh from Place Details

---

## Integration with TripAdvisor

Google Places and TripAdvisor are complementary, not competing:

| Use Google For | Use TripAdvisor For |
|---------------|-------------------|
| Google Place ID (cross-reference) | TripAdvisor Location ID |
| Gemini review summary | Full review corpus (hundreds) |
| Editorial summary | Subratings (6 dimensions) |
| Nearby landmarks + neighborhoods | Trip type distribution |
| Accessibility, pet, family data | Ranking among peers |
| Business status (open/closed) | Amenity inventory |
| Structured address components | Owner response behavior |
| 18 lodging type taxonomy | Rating distribution histogram |

**Both provide:** Lat/lng, rating, review count, phone, website, photos, address.

**Together they form** the most complete hotel intelligence dataset available through public APIs.
