import 'dotenv/config';
import { retryWithBackoff } from './retry-with-backoff.js';
import type { GPAutocompleteResponse, GPPlaceDetails } from './types.js';

const GP_BASE = 'https://places.googleapis.com/v1';

function getGPKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error('Missing GOOGLE_PLACES_API_KEY in environment');
  }
  return key;
}

let apiCallCount = 0;
export function getGPCallCount(): number { return apiCallCount; }
export function resetGPCallCount(): void { apiCallCount = 0; }

// ── Hotel-optimized field mask for Place Details ──
// Enterprise + Atmosphere tier ($25/1000 calls)
// NOTE: Place Details does NOT use "places." prefix (unlike Search endpoints)
const DETAIL_FIELD_MASK = [
  'id',
  'displayName',
  'rating',
  'userRatingCount',
  'primaryType',
  'types',
  'formattedAddress',
  'shortFormattedAddress',
  'addressComponents',
  'location',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'businessStatus',
  'editorialSummary',
  'reviewSummary',
  'reviews',
  'goodForChildren',
  'allowsDogs',
  'accessibilityOptions',
  'photos',
  'addressDescriptor',
  'timeZone',
].join(',');

/**
 * Match a hotel name to a Google Place ID using Autocomplete.
 * $2.83/1000 calls. Returns up to 5 suggestions.
 *
 * Uses locationBias to prefer results near the hotel's known coordinates.
 */
export async function autocompleteHotel(
  hotelName: string,
  lat: number,
  lng: number,
  countryCode?: string,
): Promise<GPAutocompleteResponse> {
  apiCallCount++;

  const body: Record<string, unknown> = {
    input: hotelName,
    includedPrimaryTypes: ['hotel', 'lodging'],
    languageCode: 'en',
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 5000.0,
      },
    },
  };

  if (countryCode) {
    body.includedRegionCodes = [countryCode.toUpperCase()];
  }

  return retryWithBackoff(async () => {
    const res = await fetch(`${GP_BASE}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getGPKey(),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      const err = new Error(`Google Autocomplete ${res.status}: ${errBody}`) as Error & { status: number };
      err.status = res.status;
      throw err;
    }

    return res.json() as Promise<GPAutocompleteResponse>;
  });
}

/**
 * Get full Place Details for a hotel.
 * Enterprise + Atmosphere tier: $25/1000 calls.
 */
export async function getPlaceDetails(placeId: string): Promise<GPPlaceDetails> {
  apiCallCount++;

  return retryWithBackoff(async () => {
    const res = await fetch(`${GP_BASE}/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getGPKey(),
        'X-Goog-FieldMask': DETAIL_FIELD_MASK,
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      const err = new Error(`Google Place Details ${res.status}: ${errBody}`) as Error & { status: number };
      err.status = res.status;
      throw err;
    }

    return res.json() as Promise<GPPlaceDetails>;
  });
}
