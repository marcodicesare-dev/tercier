import { resolve } from 'node:path';
import type { GPAutocompleteResponse, GPPlaceDetails } from '../../phase0-enrichment/lib/types.js';
import { getPlaceDetails } from '../../phase0-enrichment/lib/google-places-client.js';
import { retryWithBackoff } from '../../phase0-enrichment/lib/retry-with-backoff.js';
import type { DiscoveryResult, PipelineContext, ReviewInsert, SourceResult } from '../types.js';
import { cleanString, getCachedOrFetch, joinPipe, statusError, statusOk, statusSkipped } from '../utils.js';
import { assessIdentityMatch, assertIdentityMatch } from '../identity.js';

const CACHE_AUTOCOMPLETE = resolve(process.cwd(), 'scripts/enrich-hotel/cache/google-autocomplete.jsonl');
const CACHE_DETAILS = resolve(process.cwd(), 'scripts/enrich-hotel/cache/google-details.jsonl');
const GP_BASE = 'https://places.googleapis.com/v1';

interface AutocompleteSuggestion {
  placePrediction?: {
    placeId: string;
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
    text?: { text?: string };
  };
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_PLACES_API_KEY');
  return key;
}

async function autocomplete(query: string, latitude?: number | null, longitude?: number | null): Promise<GPAutocompleteResponse> {
  return await retryWithBackoff(async () => {
    const body: Record<string, unknown> = {
      input: query,
      includedPrimaryTypes: ['hotel', 'lodging'],
      languageCode: 'en',
    };

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      body.locationBias = {
        circle: {
          center: { latitude, longitude },
          radius: 5000,
        },
      };
    }

    const res = await fetch(`${GP_BASE}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getApiKey(),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error(`Google autocomplete ${res.status}: ${text.slice(0, 200)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return (await res.json()) as GPAutocompleteResponse;
  });
}

export async function discoverGooglePlaces(context: PipelineContext): Promise<DiscoveryResult> {
  const queries = [
    [context.input.name, context.input.city].filter(Boolean).join(' '),
    context.input.name,
  ];

  try {
    let bestMatch: { placeId: string; score: number; name: string } | null = null;
    for (const query of queries) {
      const result = await getCachedOrFetch<GPAutocompleteResponse>(
        CACHE_AUTOCOMPLETE,
        `${query}:${context.latitude ?? ''}:${context.longitude ?? ''}`,
        async () => await autocomplete(query, context.latitude, context.longitude),
      );

      const suggestions = (result.data.suggestions ?? []) as AutocompleteSuggestion[];
      for (const suggestion of suggestions) {
        const prediction = suggestion.placePrediction;
        if (!prediction) continue;
        const name = cleanString(prediction.structuredFormat?.mainText?.text) ?? cleanString(prediction.text?.text) ?? '';
        const secondary = cleanString(prediction.structuredFormat?.secondaryText?.text) ?? '';
        const assessment = assessIdentityMatch(context.input, {
          name,
          address: secondary,
          city: secondary,
          country: secondary,
        }, {
          source: 'google_places_discovery',
          currentLatitude: context.latitude,
          currentLongitude: context.longitude,
        });
        if (!assessment.ok) continue;
        const score = assessment.confidence;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            placeId: prediction.placeId,
            score,
            name,
          };
        }
      }
      if (bestMatch && bestMatch.score >= 1.05) break;
    }

    if (!bestMatch || bestMatch.score < 0.9) {
      return {
        ok: false,
        message: 'No confident Google Places match found',
      };
    }

    return {
      ok: true,
      gpPlaceId: bestMatch.placeId,
      message: `Google Places match ${bestMatch.placeId} (${bestMatch.name})`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runGooglePlaces(context: PipelineContext): Promise<SourceResult> {
  if (!context.gpPlaceId) {
    return { statuses: [statusSkipped('google_places', 'No Google Place ID')] };
  }

  try {
    const detailsResult = await getCachedOrFetch<GPPlaceDetails>(
      CACHE_DETAILS,
      context.gpPlaceId,
      async () => await getPlaceDetails(context.gpPlaceId as string),
    );

    const details = detailsResult.data;
    assertIdentityMatch(context.input, {
      name: cleanString(details.displayName?.text),
      city: cleanString(details.shortFormattedAddress),
      country: cleanString(details.formattedAddress),
      address: cleanString(details.formattedAddress),
      latitude: details.location?.latitude ?? null,
      longitude: details.location?.longitude ?? null,
    }, 'google_places_details', {
      gp_place_id: context.gpPlaceId,
    }, {
      currentLatitude: context.latitude,
      currentLongitude: context.longitude,
    });

    const landmarks = details.addressDescriptor?.landmarks?.map(landmark => ({
      name: landmark.displayName.text,
      distance_m: landmark.straightLineDistanceMeters,
    })) ?? [];

    const areas = details.addressDescriptor?.areas?.map(area => ({
      name: area.displayName.text,
      containment: area.containment,
    })) ?? [];

    const reviews: ReviewInsert[] = (details.reviews ?? []).map((review, index) => ({
      source: 'google',
      source_review_id: review.name || `google:${context.gpPlaceId}:${index}`,
      lang: review.originalText?.languageCode ?? review.text?.languageCode ?? 'en',
      rating: review.rating ?? null,
      title: null,
      text: cleanString(review.originalText?.text) ?? cleanString(review.text?.text),
      trip_type: null,
      travel_date: null,
      published_date: cleanString(review.publishTime),
      helpful_votes: 0,
      reviewer_username: cleanString(review.authorAttribution?.displayName),
      reviewer_location: null,
      reviewer_location_id: null,
      has_owner_response: false,
      owner_response_text: null,
      owner_response_author: null,
      owner_response_date: null,
      owner_response_lang: null,
      subratings: null,
    }));

    return {
      hotel: {
        gp_name: cleanString(details.displayName?.text),
        gp_rating: details.rating ?? null,
        gp_user_rating_count: details.userRatingCount ?? null,
        gp_primary_type: cleanString(details.primaryType),
        gp_business_status: cleanString(details.businessStatus),
        gp_editorial_summary: cleanString(details.editorialSummary?.text),
        gp_review_summary_gemini: cleanString(details.reviewSummary?.text),
        gp_formatted_address: cleanString(details.formattedAddress),
        gp_short_address: cleanString(details.shortFormattedAddress),
        gp_allows_dogs: details.allowsDogs ?? null,
        gp_good_for_children: details.goodForChildren ?? null,
        gp_wheelchair_parking: details.accessibilityOptions?.wheelchairAccessibleParking ?? null,
        gp_wheelchair_entrance: details.accessibilityOptions?.wheelchairAccessibleEntrance ?? null,
        gp_accessibility_wheelchair_parking: details.accessibilityOptions?.wheelchairAccessibleParking ?? null,
        gp_accessibility_wheelchair_entrance: details.accessibilityOptions?.wheelchairAccessibleEntrance ?? null,
        gp_photo_count: details.photos?.length ?? null,
        gp_landmarks: landmarks,
        gp_landmarks_nearby: joinPipe(landmarks.map(landmark => `${landmark.name} (${landmark.distance_m}m)`)),
        gp_areas: areas,
        gp_timezone: cleanString(details.timeZone?.id),
        website_url: cleanString(details.websiteUri) ?? context.websiteUrl ?? null,
        phone: cleanString(details.internationalPhoneNumber) ?? context.phone ?? null,
        latitude: details.location?.latitude ?? context.latitude ?? null,
        longitude: details.location?.longitude ?? context.longitude ?? null,
        gp_enriched_at: new Date().toISOString(),
      },
      reviews,
      statuses: [
        statusOk(
          'google_places',
          `details=${details.displayName?.text ?? context.gpPlaceId}; reviews=${reviews.length}`,
          detailsResult.cached,
        ),
      ],
    };
  } catch (error) {
    return {
      statuses: [statusError('google_places', error)],
    };
  }
}
