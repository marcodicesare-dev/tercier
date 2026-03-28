# Google Places API (New) — Deep Research for Hotel Intelligence

> **Date:** March 28, 2026
> **Purpose:** Exhaustive analysis of every data point Google Places API (New) provides for hotels, tested with live API calls across Zurich, Tokyo, Paris, London, and Milan.
> **Verdict:** Google Places is a CRITICAL complement to TripAdvisor. Different data, different strengths. Together they form the most complete hotel intelligence dataset possible.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [API Architecture](#api-architecture)
3. [Endpoints — Complete Reference](#endpoints)
4. [Field Mask System — Every Available Field](#field-mask-system)
5. [Live API Test Results](#live-api-test-results)
6. [Reviews Capability — Deep Dive](#reviews-capability)
7. [Pricing & Cost Modeling](#pricing)
8. [Google vs TripAdvisor — Comparison Matrix](#google-vs-tripadvisor)
9. [Hotel-Specific Intelligence Value](#hotel-intelligence-value)
10. [Pipeline Design Recommendations](#pipeline-design)

---

## 1. Executive Summary {#executive-summary}

### What Google Places API (New) Provides for Hotels

| Capability | Status | Notes |
|-----------|--------|-------|
| **Hotel discovery by geo** | Excellent | Nearby Search: 20 results/request, 50km radius |
| **Hotel discovery by text** | Excellent | Text Search: 20 results/page, 60 max with pagination |
| **Structured place data** | Excellent | 80+ fields per hotel via field masks |
| **Reviews with full text** | Good | 5 reviews per request (most relevant), with author + timestamp |
| **AI-generated review summary** | Unique to Google | Gemini-powered `reviewSummary` field |
| **Editorial summary** | Unique to Google | Google-written 1-line description |
| **Rating + review count** | Excellent | Google's own rating system |
| **Photos** | Excellent | Up to 10 per place, with attribution, up to 4800px |
| **Price level** | Partial | Available for some hotels (PRICE_LEVEL_VERY_EXPENSIVE etc.) |
| **Accessibility data** | Good | Wheelchair parking, entrance |
| **Payment options** | Good | Debit cards, NFC, cash-only |
| **Address components** | Excellent | Structured: street, city, state, country, postal code |
| **Nearby landmarks** | Unique to Google | `addressDescriptor.landmarks` with distances |
| **Area/neighborhood info** | Unique to Google | `addressDescriptor.areas` with containment |
| **Place types** | Excellent | 18 lodging types: hotel, resort_hotel, boutique_hotel, etc. |
| **Business status** | Useful | OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY |
| **Opening hours** | Useful | Regular + current (with date-specific overrides) |
| **Google Maps links** | Useful | Direct links to place, reviews, photos, directions |
| **Global coverage** | Excellent | Every country, every city |

### The Headline Numbers

- **5 reviews per hotel** (no pagination for more)
- **10 photos per hotel** (up to 4800px resolution)
- **$40/1000 requests** for full data (Enterprise + Atmosphere tier)
- **$200/month free credit** available
- **60 results max** per text search query (3 pages of 20)
- **20 results max** per nearby search
- **50,000m max radius** for nearby search

---

## 2. API Architecture {#api-architecture}

### Authentication
```
Header: X-Goog-Api-Key: {API_KEY}
```
No query parameter auth. Header-only for the New API.

### Base URL
```
https://places.googleapis.com/v1/
```

### Field Mask System
Every request MUST include a field mask specifying which fields to return. No default fields. Field mask controls both the response content AND the billing tier.

```
Header: X-Goog-FieldMask: places.displayName,places.rating,places.reviews
```

Use `*` wildcard in development only — it triggers the highest-cost SKU.

### Response Format
JSON only. No XML option.

---

## 3. Endpoints — Complete Reference {#endpoints}

### 3.1 Text Search (New)

| Property | Value |
|----------|-------|
| **URL** | `POST https://places.googleapis.com/v1/places:searchText` |
| **Method** | POST |
| **Max results per page** | 20 |
| **Max total results** | 60 (3 pages via pagination) |
| **Pagination** | `nextPageToken` in response, `pageToken` in request |

**Request Body:**

```json
{
  "textQuery": "luxury hotels in Zurich",        // REQUIRED
  "languageCode": "en",                           // Optional, default "en"
  "includedType": "hotel",                        // Optional, Table A types only
  "locationBias": {                               // Optional, bias toward area
    "circle": {
      "center": {"latitude": 47.37, "longitude": 8.54},
      "radius": 5000.0
    }
  },
  "locationRestriction": {                        // Optional, restrict to area (rectangle only)
    "rectangle": {
      "low": {"latitude": 47.3, "longitude": 8.4},
      "high": {"latitude": 47.5, "longitude": 8.6}
    }
  },
  "minRating": 4.5,                              // Optional, 0.0-5.0, increments of 0.5
  "priceLevels": ["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"],  // Optional
  "openNow": false,                               // Optional
  "pageSize": 20,                                 // Optional, 1-20
  "pageToken": "...",                             // Optional, for pagination
  "rankPreference": "RELEVANCE",                  // Optional: RELEVANCE or DISTANCE
  "regionCode": "CH",                             // Optional, 2-char CLDR
  "strictTypeFiltering": false,                   // Optional
  "includeFutureOpeningBusinesses": false,         // Optional
  "includePureServiceAreaBusinesses": false,       // Optional
  "evOptions": {                                   // Optional
    "connectorTypes": ["EV_CONNECTOR_TYPE_CCS_COMBO_1"],
    "minimumChargingRateKw": 50
  }
}
```

**Key for hotel discovery:** Use `"includedType": "hotel"` + `locationBias` with city center coordinates to discover all hotels in a city. Paginate through 60 results per query.

---

### 3.2 Nearby Search (New)

| Property | Value |
|----------|-------|
| **URL** | `POST https://places.googleapis.com/v1/places:searchNearby` |
| **Method** | POST |
| **Max results** | 20 per request |
| **No pagination** | Single page only |
| **Max radius** | 50,000 meters |

**Request Body:**

```json
{
  "locationRestriction": {                        // REQUIRED
    "circle": {
      "center": {"latitude": 47.367, "longitude": 8.539},
      "radius": 2000.0
    }
  },
  "includedTypes": ["hotel", "lodging"],          // Optional, up to 50 from Table A
  "excludedTypes": ["motel"],                     // Optional, up to 50
  "includedPrimaryTypes": ["hotel"],              // Optional, up to 50
  "excludedPrimaryTypes": [],                     // Optional, up to 50
  "maxResultCount": 20,                           // Optional, 1-20
  "languageCode": "en",                           // Optional
  "rankPreference": "POPULARITY",                 // Optional: POPULARITY or DISTANCE
  "regionCode": "CH",                             // Optional
  "includeFutureOpeningBusinesses": false          // Optional
}
```

**Key for hotel discovery:** Use geo-grid pattern with overlapping circles. 20 results per circle, rank by DISTANCE to avoid missing hotels. Cover cities systematically.

---

### 3.3 Place Details (New)

| Property | Value |
|----------|-------|
| **URL** | `GET https://places.googleapis.com/v1/places/{PLACE_ID}` |
| **Method** | GET |
| **Max reviews returned** | 5 |
| **Max photos returned** | 10 |

**Headers:**
```
X-Goog-Api-Key: {API_KEY}
X-Goog-FieldMask: {comma-separated fields}
X-Goog-Api-Language-Code: en  (optional, controls review translation)
```

**No request body** — all parameters via URL path and headers.

**Optional parameters:**
- `languageCode` — controls language of returned text and review translation
- `regionCode` — affects address formatting
- `sessionToken` — for Autocomplete session billing

---

### 3.4 Place Photos (New)

| Property | Value |
|----------|-------|
| **URL** | `GET https://places.googleapis.com/v1/{PHOTO_NAME}/media` |
| **Method** | GET |
| **Max dimension** | 4800px |
| **Photos per place** | Up to 10 |

**Parameters:**

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `maxHeightPx` | one of these | int | 1-4800 |
| `maxWidthPx` | one of these | int | 1-4800 |
| `skipHttpRedirect` | no | bool | true returns JSON with photoUri instead of redirect |

**Response:** HTTP 302 redirect to image URL (e.g., `https://lh3.googleusercontent.com/places/...`), or JSON with `photoUri` if skipHttpRedirect=true.

**Photo object in Place response:**
```json
{
  "name": "places/{PLACE_ID}/photos/{PHOTO_REF}",
  "widthPx": 4800,
  "heightPx": 3200,
  "authorAttributions": [{
    "displayName": "Baur au Lac",
    "uri": "https://maps.google.com/maps/contrib/102018969039400373097",
    "photoUri": "https://lh3.googleusercontent.com/..."
  }],
  "flagContentUri": "...",
  "googleMapsUri": "..."
}
```

---

### 3.5 Autocomplete (New)

| Property | Value |
|----------|-------|
| **URL** | `POST https://places.googleapis.com/v1/places:autocomplete` |
| **Method** | POST |
| **Max results** | 5 suggestions |

**Request Body:**

```json
{
  "input": "Mandarin Oriental",                   // REQUIRED
  "includedPrimaryTypes": ["hotel"],              // Optional, up to 5 types
  "locationBias": {...},                          // Optional
  "locationRestriction": {...},                   // Optional
  "includedRegionCodes": ["CH", "DE", "AT"],     // Optional, up to 15
  "languageCode": "en",                           // Optional
  "regionCode": "CH",                             // Optional
  "origin": {"latitude": 47.37, "longitude": 8.54},  // Optional, for distanceMeters
  "includeQueryPredictions": false,               // Optional
  "sessionToken": "...",                          // Optional, for billing
  "inputOffset": 0                                // Optional
}
```

**Response:**
```json
{
  "suggestions": [{
    "placePrediction": {
      "place": "places/ChIJdYdk4EZCXz4RtFGDMnXefMM",
      "placeId": "ChIJdYdk4EZCXz4RtFGDMnXefMM",
      "text": {"text": "Mandarin Oriental Jumeira, Dubai - ..."},
      "structuredFormat": {
        "mainText": {"text": "Mandarin Oriental Jumeira, Dubai"},
        "secondaryText": {"text": "Jumeirah Beach Road - Dubai - UAE"}
      },
      "types": ["hotel", "lodging", "establishment", "point_of_interest"]
    }
  }]
}
```

**Key for hotel matching:** Use `includedPrimaryTypes: ["hotel"]` to match hotel names to Google Place IDs. Useful for matching our hotelleriesuisse dataset.

---

## 4. Field Mask System — Every Available Field {#field-mask-system}

### Fields by SKU Tier (Cost Tier)

#### Essentials ID Only (Cheapest — $5/1000 for Place Details)
```
id, name, attributions, photos, movedPlace, movedPlaceId
```

#### Essentials ($5/1000 for Place Details)
```
addressComponents, addressDescriptor, adrFormatAddress, formattedAddress,
location, plusCode, postalAddress, shortFormattedAddress, types, viewport
```

#### Pro ($17/1000 for Place Details, $32/1000 for Text/Nearby Search)
```
accessibilityOptions, businessStatus, containingPlaces, displayName,
googleMapsLinks, googleMapsUri, iconBackgroundColor, iconMaskBaseUri,
openingDate, primaryType, primaryTypeDisplayName, pureServiceAreaBusiness,
subDestinations, timeZone, utcOffsetMinutes
```

#### Enterprise ($20/1000 for Place Details, $35/1000 for Text/Nearby Search)
```
currentOpeningHours, currentSecondaryOpeningHours, internationalPhoneNumber,
nationalPhoneNumber, priceLevel, priceRange, rating, regularOpeningHours,
regularSecondaryOpeningHours, userRatingCount, websiteUri
```

#### Enterprise + Atmosphere ($25/1000 for Place Details, $40/1000 for Text/Nearby Search)
```
allowsDogs, curbsidePickup, delivery, dineIn, editorialSummary,
evChargeAmenitySummary, evChargeOptions, fuelOptions, generativeSummary,
goodForChildren, goodForGroups, goodForWatchingSports, liveMusic,
menuForChildren, neighborhoodSummary, parkingOptions, paymentOptions,
outdoorSeating, reservable, restroom, reviews, reviewSummary,
routingSummaries, servesBeer, servesBreakfast, servesBrunch, servesCocktails,
servesCoffee, servesDessert, servesDinner, servesLunch,
servesVegetarianFood, servesWine, takeout
```

### Hotel-Relevant Fields — Verified from Live Responses

| Field | Type | Example (Baur au Lac) | Hotel Intelligence Value |
|-------|------|----------------------|-------------------------|
| `id` | string | `ChIJZcrzZBcLkEcROaEB21geaZk` | Primary key for Google |
| `displayName.text` | string | `Baur au Lac` | Hotel name |
| `displayName.languageCode` | string | `en` | Name language |
| `primaryType` | string | `hotel` | Place category |
| `types` | string[] | `[hotel, lodging, restaurant, food, ...]` | Multi-type classification |
| `formattedAddress` | string | `Talstrasse 1, 8001 Zurich, Switzerland` | Full address |
| `shortFormattedAddress` | string | `Talstrasse 1, Zurich` | Short address |
| `addressComponents` | object[] | Street, city, state, country, postal code | Structured address parts |
| `postalAddress` | object | `{regionCode: "CH", postalCode: "8001", ...}` | Structured postal |
| `location.latitude` | number | `47.367301` | Precise lat |
| `location.longitude` | number | `8.539371` | Precise lng |
| `plusCode` | object | `8FVC9G8Q+WP` | Plus Code (global) |
| `internationalPhoneNumber` | string | `+41 44 220 50 20` | International phone |
| `nationalPhoneNumber` | string | `044 220 50 20` | Local phone |
| `websiteUri` | string | `https://www.bauraulac.ch/` | Official website |
| `googleMapsUri` | string | `https://maps.google.com/?cid=...` | Google Maps link |
| `rating` | float | `4.6` | Google rating (1-5) |
| `userRatingCount` | int | `1835` | Total Google reviews |
| `priceLevel` | enum | `PRICE_LEVEL_VERY_EXPENSIVE` | Price tier (see note) |
| `businessStatus` | enum | `OPERATIONAL` | Open/closed status |
| `editorialSummary.text` | string | `"Swanky rooms & suites in a grand, luxe 1844 hotel offering 4 posh restaurants & canal views."` | Google-written description |
| `reviewSummary.text` | string | `"People say this hotel offers spacious rooms..."` | **Gemini AI summary** |
| `reviewSummary.disclosureText` | string | `"Summarized with Gemini"` | Attribution |
| `regularOpeningHours` | object | 24 hours, 7 days | Opening schedule |
| `currentOpeningHours` | object | Date-specific hours with truncation | Live hours |
| `timeZone.id` | string | `Europe/Zurich` | Timezone |
| `utcOffsetMinutes` | int | `60` | UTC offset |
| `goodForChildren` | bool | `true` | Family-friendly |
| `allowsDogs` | bool | `true` | Pet-friendly |
| `accessibilityOptions` | object | `{wheelchairAccessibleParking: true, ...}` | Accessibility |
| `paymentOptions` | object | `{acceptsDebitCards: true, acceptsNfc: true}` | Payment methods |
| `parkingOptions` | object | (when available) | Parking info |
| `photos` | array[10] | 10 photos with dimensions and attribution | Property images |
| `reviews` | array[5] | 5 most relevant reviews | Full review text |
| `addressDescriptor.landmarks` | array | 5 nearby landmarks with distances | Neighborhood context |
| `addressDescriptor.areas` | array | 3 containing areas | District/neighborhood |
| `containingPlaces` | array | Parent location references | Hierarchy |
| `googleMapsLinks` | object | Direct URLs to reviews, photos, directions | Deep links |
| `openingDate` | string | (when available) | Opening date |
| `pureServiceAreaBusiness` | bool | `false` | Has physical location |

### priceLevel Values
```
PRICE_LEVEL_FREE
PRICE_LEVEL_INEXPENSIVE
PRICE_LEVEL_MODERATE
PRICE_LEVEL_EXPENSIVE
PRICE_LEVEL_VERY_EXPENSIVE
```

**IMPORTANT:** `priceLevel` is NOT available for most hotels. In our Zurich test of 20 luxury hotels, ZERO had priceLevel populated. It appeared for Four Seasons George V Paris and Bulgari Milan, but not for Baur au Lac, Dolder Grand, or Park Hyatt Zurich. This field is unreliable for hotel intelligence.

---

## 5. Live API Test Results {#live-api-test-results}

### Test 1: Text Search — "luxury hotels in Zurich"

**Request:** POST to searchText with full field mask
**Results:** 20 hotels returned

| Hotel | Rating | Reviews | Price Level | Has Editorial |
|-------|--------|---------|-------------|---------------|
| The Dolder Grand | 4.7 | 3,914 | N/A | Yes |
| Baur au Lac | 4.6 | 1,835 | N/A | Yes |
| Mandarin Oriental Savoy, Zurich | 4.6 | 499 | N/A | No |
| Park Hyatt Zurich | 4.5 | 2,175 | N/A | Yes |
| La Reserve Eden au Lac Zurich | 4.7 | 1,109 | N/A | Yes |
| Storchen Zurich | 4.6 | 2,979 | N/A | Yes |
| B2 Hotel Zurich | 4.7 | 1,603 | N/A | Yes |
| Hotel Schweizerhof Zurich | 4.5 | 1,278 | N/A | Yes |
| Widder Hotel | 4.7 | 981 | N/A | Yes |
| FIVE Zurich Hotel | 4.6 | 665 | N/A | No |
| Zurich Marriott Hotel | 4.3 | 3,123 | N/A | Yes |
| Alden Splugenschloss | 4.7 | 352 | N/A | Yes |
| The Home Hotel Zurich | 4.4 | 342 | N/A | No |
| Ambassador Zurich Hotel | 4.5 | 1,047 | N/A | Yes |
| Sheraton Zurich Hotel | 4.2 | 3,080 | N/A | Yes |
| Alex Lake Zurich | 4.8 | 445 | N/A | Yes |
| Kameha Grand Zurich | 4.3 | 1,479 | N/A | Yes |
| AMERON Bellerive au Lac | 4.4 | 2,121 | N/A | Yes |
| Marktgasse Hotel | 4.6 | 710 | N/A | Yes |
| Neues Schloss Privat Hotel | 4.6 | 413 | N/A | No |

**Key findings:**
- All 20 results are legitimate luxury/upscale hotels
- 5 reviews + 10 photos returned per hotel
- priceLevel NOT populated for any Zurich hotel
- editorialSummary available for ~80% of hotels
- accessibilityOptions available for ~95% of hotels

---

### Test 2: Nearby Search — Hotels near Baur au Lac (47.367, 8.539, r=2000m)

**Results:** 20 hotels returned within 2km

Includes: Motel One, Park Hyatt, Marriott, Ruby Mimi, ibis Styles, citizenM, 25hours, Baur au Lac, Mandarin Oriental Savoy, Central Plaza, The Home Hotel, Hotel Bristol, Hotel Montana, Storchen, Widder, B2 Hotel, Hotel St. Gotthard, Glockenhof, Schweizerhof, Hotel Adler

**Key findings:**
- Mix of luxury, midscale, and budget properties — true competitive set discovery
- 20 results in 2km radius is dense coverage
- primaryType consistently "hotel" for all

---

### Test 3: Place Details — Baur au Lac (full * field mask)

**Complete field inventory (all 39 top-level fields returned):**

```
accessibilityOptions     addressComponents        addressDescriptor
adrFormatAddress         allowsDogs               businessStatus
currentOpeningHours      displayName              editorialSummary
formattedAddress         goodForChildren          googleMapsLinks
googleMapsTypeLabel      googleMapsUri            iconBackgroundColor
iconMaskBaseUri          id                       internationalPhoneNumber
location                 name                     nationalPhoneNumber
paymentOptions           photos[10]               plusCode
postalAddress            primaryType              primaryTypeDisplayName
pureServiceAreaBusiness  rating                   regularOpeningHours
reviews[5]               shortFormattedAddress    timeZone
types                    userRatingCount          utcOffsetMinutes
viewport                 websiteUri
```

**Notable Baur au Lac data:**
- `editorialSummary`: "Swanky rooms & suites in a grand, luxe 1844 hotel offering 4 posh restaurants & canal views."
- `allowsDogs`: true
- `goodForChildren`: true
- `addressDescriptor.landmarks`: UBP (28m), Swiss National Bank (108m), Burkliplatz (141m), Goldman Sachs (46m)
- `addressDescriptor.areas`: City (outskirts), Bahnhofstrasse (outskirts)

---

### Test 4: Place Details — Aman Tokyo

**reviewSummary (Gemini-generated):**
> "People say this hotel offers spacious rooms with breathtaking city views, and a luxurious spa and restaurants. They highlight the serene and elegant atmosphere, and the exceptional service with personalized touches. They also like the attentive and friendly staff."

**Attribution:** "Summarized with Gemini"

---

### Test 5: Text Search — "5 star hotels in Paris" with Pagination

**Page 1 (5 results):** Four Seasons George V (4.8), InterContinental Le Grand (4.5), San Regis (4.8), Shangri-La Paris (4.7), Grand Hotel du Palais Royal (4.7)

**Page 2 (5 results):** Le Meurice (4.5), Paris Marriott Champs Elysees (4.3), Mandarin Oriental Lutetia (4.6), Chateau des Fleurs (4.7), Hotel Madame Reve (4.6)

**Pagination confirmed working.** `nextPageToken` returned, usable in subsequent request.

---

### Test 6: priceLevel Filter — "hotels in Milan" filtered to EXPENSIVE + VERY_EXPENSIVE

**Result:** Only 1 hotel returned: Bulgari Hotel Milano (4.6, PRICE_LEVEL_VERY_EXPENSIVE)

**Critical finding:** priceLevel is too sparsely populated for hotels to be useful as a filter. Most hotels lack this field entirely.

---

### Test 7: Autocomplete — "Mandarin Oriental" filtered to hotels

**Results (5 suggestions):**
1. Mandarin Oriental Jumeira, Dubai
2. Mandarin Oriental, Kuala Lumpur
3. Mandarin Oriental, Jakarta
4. Mandarin Oriental, Singapore
5. Mandarin Oriental Bosphorus, Istanbul

**Key finding:** Autocomplete with `includedPrimaryTypes: ["hotel"]` is excellent for matching known hotel names to Google Place IDs. Max 5 results.

---

### Test 8: Photo Endpoint — Baur au Lac

**Request:** GET with maxHeightPx=400&maxWidthPx=400
**Response:** HTTP 302 redirect to `https://lh3.googleusercontent.com/places/...`
**Photo available up to:** 4800x3200px (original dimensions)

---

## 6. Reviews Capability — Deep Dive {#reviews-capability}

### What Google Reviews Provide

| Feature | Detail |
|---------|--------|
| **Reviews per request** | 5 (most relevant, not most recent) |
| **Review pagination** | NOT available — always 5 |
| **Full text** | Yes, complete review text |
| **Original language** | Yes, in `originalText.text` with `languageCode` |
| **Translated text** | Yes, in `text.text` — auto-translated to request language |
| **Author name** | Yes, `authorAttribution.displayName` |
| **Author photo** | Yes, `authorAttribution.photoUri` |
| **Author profile** | Yes, `authorAttribution.uri` (Google Maps contributor) |
| **Rating** | Yes, 1-5 stars per review |
| **Publish timestamp** | Yes, ISO 8601 (`publishTime`) |
| **Relative time** | Yes, `relativePublishTimeDescription` ("a month ago") |
| **Visit date** | Sometimes, `visitDate: {year, month}` (seen on Four Seasons George V) |
| **Google Maps URI** | Yes, deep link to the specific review |

### Review Object Structure (Complete)
```json
{
  "name": "places/{PLACE_ID}/reviews/{REVIEW_ID}",
  "relativePublishTimeDescription": "a month ago",
  "rating": 5,
  "text": {
    "text": "Full review text (translated if needed)...",
    "languageCode": "en"
  },
  "originalText": {
    "text": "Original review text in original language...",
    "languageCode": "en"
  },
  "authorAttribution": {
    "displayName": "Guy Estoppey",
    "uri": "https://www.google.com/maps/contrib/114289923833005561848/reviews",
    "photoUri": "https://lh3.googleusercontent.com/..."
  },
  "publishTime": "2026-02-19T07:37:28.379755859Z",
  "visitDate": {                    // NOT always present
    "year": 2026,
    "month": 2
  },
  "flagContentUri": "...",
  "googleMapsUri": "..."
}
```

### Multilingual Behavior

When requesting Place Details with `X-Goog-Api-Language-Code: de`:
- Reviews STILL come back as originally written (mostly English for international hotels)
- The `text` field would contain German translation IF the original was in another language
- The `originalText` field always preserves the original language

**Limitation:** Only 5 reviews returned. No way to get more. No pagination. No filtering by language. Google selects the "most relevant" 5.

### AI Review Summary (`reviewSummary`)

This is a **Gemini-generated summary** of ALL reviews (not just the 5 returned). Available via `reviewSummary` field mask.

**Example (Aman Tokyo):**
> "People say this hotel offers spacious rooms with breathtaking city views, and a luxurious spa and restaurants. They highlight the serene and elegant atmosphere, and the exceptional service with personalized touches. They also like the attentive and friendly staff."

**Structure:**
```json
{
  "reviewSummary": {
    "text": {
      "text": "People say this hotel...",
      "languageCode": "en-US"
    },
    "disclosureText": {
      "text": "Summarized with Gemini",
      "languageCode": "en-US"
    },
    "reviewsUri": "https://www.google.com/maps/place//data=..."
  }
}
```

**Intelligence value:** HIGH. This is a free AI-generated summary of the full review corpus, capturing themes Google sees across ALL reviews — not just the 5 they return.

---

## 7. Pricing & Cost Modeling {#pricing}

### Per-Request Pricing (per 1,000 requests)

| Endpoint | Essentials | Pro | Enterprise | Enterprise + Atmosphere |
|----------|-----------|-----|-----------|------------------------|
| **Text Search** | - | $32.00 | $35.00 | $40.00 |
| **Nearby Search** | - | $32.00 | $35.00 | $40.00 |
| **Place Details** | $5.00 | $17.00 | $20.00 | $25.00 |
| **Autocomplete** | $2.83 | - | - | - |
| **Photos** | - | - | $7.00 | - |

### Free Tier (Monthly Credit)

| SKU | Free requests/month |
|-----|-------------------|
| Text Search (Pro) | 5,000 |
| Nearby Search (Pro) | 5,000 |
| Place Details (Essentials) | 10,000 |
| Place Details (Pro) | 5,000 |
| Place Details (Enterprise) | 1,000 |
| Place Details (Ent+Atmos) | 1,000 |
| Autocomplete | 10,000 |
| Photos | 1,000 |

Plus **$200/month general credit** that applies across all Google Maps Platform APIs.

### Cost to Index 1.5M Hotels — Scenarios

#### Scenario A: Discovery Only (find all hotels, get basic data)
- **Discovery via Text Search:** 1.5M / 20 per page = 75,000 pages. At $32/1000 = **$2,400**
- **But:** Max 60 results per query. Need ~25,000 unique queries. Actually ~75,000 paginated requests.
- **Discovery via Nearby Search:** Need geo-grid. ~200,000 cells globally. At $32/1000 = **$6,400**

#### Scenario B: Full Enrichment (Place Details for every hotel)
- **1.5M Place Details at Enterprise+Atmosphere:** 1.5M × $25/1000 = **$37,500**
- **With photos (1 per hotel):** 1.5M × $7/1000 = **$10,500**
- **Total:** ~$48,000

#### Scenario C: Phased Approach (Tercier's recommended path)
- **Phase 0 (2,069 Swiss hotels):** ~$52 for Place Details Ent+Atmos + ~$15 for photos = **~$67**
- **Phase 1 (50,000 European premium):** ~$1,250 for Details + ~$350 photos = **~$1,600**
- **Phase 2 (500,000 global upscale):** ~$12,500 + $3,500 = **~$16,000**
- **Phase 3 (1.5M global):** ~$37,500 + $10,500 = **~$48,000**

#### Compared to TripAdvisor
TripAdvisor API is metered at 50 calls/sec but no per-call cost visible in our current agreement. Google is pay-per-call. For Tercier's dataset, the Google costs are manageable and predictable.

---

## 8. Google vs TripAdvisor — Comparison Matrix {#google-vs-tripadvisor}

### What Google Gives That TripAdvisor Doesn't

| Data Point | Google Places | TripAdvisor | Advantage |
|-----------|--------------|-------------|-----------|
| **AI Review Summary** (Gemini) | reviewSummary | N/A | **Google unique** — free NLP of full corpus |
| **Editorial Summary** | editorialSummary | N/A | **Google unique** — curated 1-liner |
| **Nearby Landmarks** | addressDescriptor.landmarks | N/A | **Google unique** — "28m from UBP, 108m from Swiss National Bank" |
| **Neighborhood/Area** | addressDescriptor.areas | N/A | **Google unique** — "City, Bahnhofstrasse" |
| **Plus Code** | plusCode | N/A | **Google unique** — universal geo reference |
| **Google Maps Deep Links** | googleMapsLinks | N/A | **Google unique** — direct review/photo/directions URLs |
| **Accessibility Data** | accessibilityOptions | N/A | **Google unique** — wheelchair parking, entrance |
| **Payment Methods** | paymentOptions | N/A | **Google unique** — NFC, debit, cash-only |
| **Pet-Friendly** | allowsDogs | N/A | **Google unique** — boolean |
| **Family-Friendly** | goodForChildren | N/A | **Google unique** — boolean |
| **Business Status** | OPERATIONAL/CLOSED | N/A | **Google unique** — detect closures |
| **Timezone** | timeZone.id | N/A | **Google unique** — "Europe/Zurich" |
| **Opening Date** | openingDate | N/A | **Google unique** — when hotel opened |
| **Parking Options** | parkingOptions | N/A | **Google unique** — valet, garage, etc. |
| **Visit Date on Reviews** | visitDate | N/A | **Google unique** — when reviewer actually visited |
| **Author Photos** | authorAttribution.photoUri | N/A | **Google** — reviewer profile photos |
| **Structured Address Components** | addressComponents | address_obj | Both — Google more granular |
| **Place Type Taxonomy** | 18 lodging types | category=hotels | **Google richer** — hotel, resort_hotel, boutique, hostel, inn, etc. |
| **Discovery Volume** | 20/request, 60 max with pagination | 10/request | **Google** — 2x-6x per query |
| **Review Auto-Translation** | Built-in (text vs originalText) | N/A | **Google** — auto-translates to requested language |

### What TripAdvisor Gives That Google Doesn't

| Data Point | TripAdvisor | Google Places | Advantage |
|-----------|-------------|--------------|-----------|
| **Review Volume** | Hundreds per hotel, paginated | 5 per hotel, no pagination | **TA massive advantage** |
| **Review Languages** | 45+ languages, can request specific | 5 reviews in "most relevant" | **TA** — multilingual corpus |
| **Subcategories** | hotel, inn, B&B, specialty_lodging | types array | **TA** — finer hotel categorization |
| **Subratings** | Location, Cleanliness, Service, Value, Sleep Quality, Rooms | Single overall rating | **TA massive advantage** — 6-dimension quality fingerprint |
| **Trip Type** | Business, Couples, Solo, Family, Friends | N/A | **TA unique** — guest segment distribution |
| **Rating Distribution** | 5/4/3/2/1 star breakdown | Single average | **TA** — review histogram |
| **Ranking** | "#3 of 142 hotels in Zurich" | N/A | **TA unique** — competitive positioning |
| **Award Badges** | Travelers' Choice, Best of Best | N/A | **TA unique** — quality signals |
| **Price Range** | "$$$" with numeric range | priceLevel (sparse) | **TA more reliable** |
| **Number of Rooms** | Sometimes available | N/A | **TA** — property size indicator |
| **Amenities List** | Pool, Spa, Restaurant, etc. | Inferred from types only | **TA richer** — specific amenity inventory |
| **Owner Responses** | Full response text with timestamp | N/A | **TA unique** — management engagement signal |
| **Write-a-review Link** | Direct link | googleMapsLinks.writeAReviewUri | Both |
| **Photo Captions** | User-provided captions | No captions | **TA** |
| **Brand/Chain Affiliation** | Sometimes in name/subcategory | Sometimes in name | Neither reliable |

### Complementary Data — Together They're Unstoppable

| Intelligence Layer | Google Provides | TripAdvisor Provides | Combined Value |
|-------------------|----------------|---------------------|---------------|
| **Discovery** | Geo-search, text search | Nearby search, keyword search | 100% hotel coverage |
| **Identity** | Place ID, Maps URI, phone, website | Location ID, name, address | Cross-referenced identity |
| **Location** | Lat/lng, plus code, landmarks, neighborhoods | Lat/lng, distance, bearing | Hyper-local context |
| **Quality** | Google rating, Gemini summary | TA rating, 6 subratings, ranking | Multi-platform quality index |
| **Reviews** | 5 most relevant + AI summary | Full corpus, multilingual | Breadth (TA) + AI insight (Google) |
| **Guest Intelligence** | Family/pet-friendly booleans | Trip type distribution, traveler segments | Behavioral segmentation |
| **Operational** | Business status, hours, accessibility, parking | Amenities, room count | Operational completeness |
| **Visual** | 10 photos with attribution | Multiple photos with captions | Full visual library |
| **Competitive** | Nearby hotels by distance | Ranking among peers | Competitive set + positioning |

---

## 9. Hotel-Specific Intelligence Value {#hotel-intelligence-value}

### Fields With Highest Intelligence Value for Tercier

#### Tier 1 — Must Have (core intelligence)
1. **`id`** — Google Place ID (permanent cross-reference key)
2. **`displayName`** — Official hotel name
3. **`rating` + `userRatingCount`** — Google's quality signal (second rating platform)
4. **`location`** — Precise lat/lng
5. **`formattedAddress` + `addressComponents`** — Structured address
6. **`websiteUri`** — Official website
7. **`internationalPhoneNumber`** — Contact
8. **`businessStatus`** — Is the hotel still operating?
9. **`primaryType` + `types`** — Hotel subcategorization
10. **`reviews[5]`** — Sample of Google reviews with full text

#### Tier 2 — High Value (differentiated intelligence)
11. **`reviewSummary`** — Gemini AI summary of ALL reviews (free NLP!)
12. **`editorialSummary`** — Google-curated description
13. **`addressDescriptor.landmarks`** — Nearby landmarks with distances
14. **`addressDescriptor.areas`** — Neighborhood/district context
15. **`allowsDogs`** — Pet policy
16. **`goodForChildren`** — Family suitability
17. **`accessibilityOptions`** — Wheelchair access
18. **`paymentOptions`** — Payment methods accepted
19. **`photos[10]`** — Property images with dimensions

#### Tier 3 — Nice to Have
20. **`priceLevel`** — Price tier (when available — sparse for hotels)
21. **`regularOpeningHours`** — Useful for seasonal hotels
22. **`timeZone`** — Timezone context
23. **`googleMapsLinks`** — Deep links
24. **`plusCode`** — Universal geo reference
25. **`containingPlaces`** — Place hierarchy
26. **`openingDate`** — When hotel opened

### The Gemini Review Summary — A Unique Asset

The `reviewSummary` field is possibly the most valuable single field in the entire API for hotel intelligence. It provides:

1. **Automated NLP** — Google/Gemini processes the ENTIRE review corpus (not just 5) and generates a thematic summary
2. **Guest perception capture** — "People say this hotel offers spacious rooms with breathtaking city views" captures what guests actually care about
3. **Consistent format** — Always structured as "People say... They highlight... They also..."
4. **Free intelligence** — No NLP pipeline needed on our side
5. **Complementary to TA** — TA gives us the raw reviews; Google gives us the AI synthesis

---

## 10. Pipeline Design Recommendations {#pipeline-design}

### Optimal Field Mask for Hotel Enrichment

Use this field mask for Place Details to get maximum hotel intelligence at the Enterprise + Atmosphere tier ($25/1000):

```
displayName,id,rating,userRatingCount,priceLevel,primaryType,types,
formattedAddress,shortFormattedAddress,addressComponents,postalAddress,
location,plusCode,internationalPhoneNumber,nationalPhoneNumber,
websiteUri,googleMapsUri,googleMapsLinks,businessStatus,
editorialSummary,reviewSummary,reviews,
regularOpeningHours,timeZone,utcOffsetMinutes,
goodForChildren,allowsDogs,accessibilityOptions,parkingOptions,
paymentOptions,photos,addressDescriptor,containingPlaces,
openingDate,pureServiceAreaBusiness
```

### Optimal Field Mask for Discovery (Text Search / Nearby Search)

Use this at the Pro tier ($32/1000) for discovery, then upgrade to full details:

```
places.displayName,places.id,places.rating,places.userRatingCount,
places.primaryType,places.types,places.formattedAddress,places.location,
places.businessStatus,places.websiteUri,places.googleMapsUri
```

### Matching Strategy — Google to TripAdvisor

For each hotel in our dataset:
1. **Autocomplete match** — Use hotel name + `includedPrimaryTypes: ["hotel"]` to find Google Place ID ($2.83/1000)
2. **Fallback: Text Search** — `"Hotel Name City Country"` as textQuery ($32/1000)
3. **Validation** — Compare lat/lng (within 200m), phone number, or website URL
4. **Store** — Add `google_place_id` to hotel record alongside `ta_location_id`

### Recommended Pipeline Architecture

```
Phase 0: Swiss Hotels (2,069)
├── Step 1: Autocomplete match each hotel → get google_place_id
├── Step 2: Place Details (Ent+Atmos) for each → full intelligence
├── Step 3: Cache all responses as JSONL
└── Cost: ~$67 + $15 photos = ~$82

Phase 1: European Premium (50,000)
├── Step 1: Nearby Search geo-grid for 50 cities → discover hotels
├── Step 2: Deduplicate against existing dataset
├── Step 3: Place Details for new hotels
└── Cost: ~$2,000 discovery + $1,250 details = ~$3,250

Phase 2: Global Upscale (500,000)
├── Step 1: Text Search "hotels in {city}" for 2,000 cities
├── Step 2: Nearby Search geo-grid for dense cities
├── Step 3: Place Details for all discovered hotels
└── Cost: ~$8,000 discovery + $12,500 details = ~$20,500

Phase 3: Global Complete (1.5M)
├── Step 1: Systematic geo-grid, every inhabited area
├── Step 2: Full enrichment
└── Cost: ~$15,000 discovery + $37,500 details = ~$52,500
```

### Lodging Types Available for Discovery

Use these in `includedTypes` / `includedPrimaryTypes` for comprehensive hotel discovery:

```
hotel                  # Standard hotels
resort_hotel           # Resort properties
extended_stay_hotel    # Extended stay (e.g., Residence Inn)
bed_and_breakfast      # B&Bs
guest_house            # Guest houses
hostel                 # Hostels
inn                    # Inns
motel                  # Motels
lodging                # General lodging (catch-all)
cottage                # Holiday cottages
farmstay               # Farm stays
camping_cabin          # Glamping/cabins
budget_japanese_inn    # Budget ryokan
japanese_inn           # Ryokan
private_guest_room     # Airbnb-style
campground             # Campgrounds
mobile_home_park       # Mobile homes
rv_park                # RV parks
```

For Tercier's target market, use: `["hotel", "resort_hotel", "extended_stay_hotel", "bed_and_breakfast", "inn", "lodging"]`

---

## Appendix A: Complete Baur au Lac Response (Place Details with *)

```
Place ID: ChIJZcrzZBcLkEcROaEB21geaZk
Fields returned: 39 top-level fields
Rating: 4.6 (1,835 reviews)
Phone: +41 44 220 50 20
Website: https://www.bauraulac.ch/
Business Status: OPERATIONAL
Editorial: "Swanky rooms & suites in a grand, luxe 1844 hotel offering 4 posh restaurants & canal views."
Types: hotel, lodging, restaurant, food, point_of_interest, establishment
Good for Children: true
Allows Dogs: true
Payment: acceptsDebitCards, acceptsNfc
Accessibility: wheelchairAccessibleParking, wheelchairAccessibleEntrance
Photos: 10 (max 4800x3294)
Reviews: 5 (all 5-star in this sample, all English)
Landmarks: UBP (28m), Swiss National Bank (108m), Burkliplatz (141m), Maerki Baumann (138m), Goldman Sachs (46m)
Areas: City, City, Bahnhofstrasse
Timezone: Europe/Zurich
Plus Code: 8FVC9G8Q+WP
```

## Appendix B: Complete Dolder Grand Response (Place Details with *)

```
Place ID: ChIJXeB5Fc-gmkcRAUEVByhxN5o
Fields returned: 39 top-level fields
Rating: 4.7 (3,914 reviews)
Phone: +41 44 456 60 00
Website: https://www.thedoldergrand.com/
Business Status: OPERATIONAL
Editorial: "High-end, 19th-century hotel offering 2 chic restaurants, plus a spa with an indoor pool & a gym."
Types: hotel, historical_landmark, lodging, bar, spa, historical_place, restaurant, food, point_of_interest, establishment
Good for Children: true
Allows Dogs: true
Payment: acceptsCashOnly=false
Accessibility: wheelchairAccessibleParking, wheelchairAccessibleEntrance
Photos: 10
Reviews: 5 (4x 5-star, 1x 1-star, all English)
Landmarks: Dolder Golf Club, Adlisberg Tram Stop, Waldhaus Dolder, Zoo Zurich
```

## Appendix C: Four Seasons George V Paris — priceLevel Example

```
Place ID: ChIJAcNYmcJv5kcR7EQ_IeMZp8c
Rating: 4.8 (7,233 reviews)
priceLevel: PRICE_LEVEL_VERY_EXPENSIVE
Editorial: "Ornate, high-end hotel offering elegant rooms & suites, plus renown dining, a chic bar & luxe spa."
Good for Children: true
Reviews: 5 (include visitDate field: {year: 2026, month: 2})
```

## Appendix D: Raw API Response Files

All raw API responses cached at:
- Zurich luxury hotels (Text Search): `bu1i3ceau.txt` (1.1MB)
- Tokyo hotels (Text Search): `btcnn7gcv.txt` (594KB)
- Baur au Lac (Place Details *): `bjpnsp114.txt` (34KB)
- Dolder Grand (Place Details *): `b1cp83iyz.txt` (36KB)

---

*Research conducted March 28, 2026. API key: $GOOGLE_PLACES_API_KEY*
