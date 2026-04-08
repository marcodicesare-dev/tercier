import type { HotelDashboardRow, HotelReviewRow } from '@/lib/types';

function trimProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

export function getTripadvisorHotelUrl(hotel: Pick<HotelDashboardRow, 'ta_location_id'>): string | null {
  if (!hotel.ta_location_id) return null;
  return `https://www.tripadvisor.com/Hotel_Review-d${hotel.ta_location_id}`;
}

export function getTripadvisorReviewUrl(
  hotel: Pick<HotelDashboardRow, 'ta_location_id'>,
  review: Pick<HotelReviewRow, 'source_review_id'>,
): string | null {
  if (!hotel.ta_location_id || !review.source_review_id) return null;
  return `https://www.tripadvisor.com/Hotel_Review-d${hotel.ta_location_id}-r${review.source_review_id}`;
}

export function getGoogleMapsPlaceUrl(hotel: Pick<HotelDashboardRow, 'gp_place_id'>): string | null {
  if (!hotel.gp_place_id) return null;
  return `https://www.google.com/maps/place/?q=place_id:${hotel.gp_place_id}`;
}

export function getInstagramUrl(handle: string | null | undefined): string | null {
  if (!handle) return null;
  return `https://instagram.com/${handle.replace(/^@/, '')}`;
}

export function getReviewSourceUrl(
  hotel: Pick<HotelDashboardRow, 'ta_location_id' | 'gp_place_id'>,
  review: Pick<HotelReviewRow, 'source' | 'source_review_id'>,
): { href: string; label: string } | null {
  if (review.source === 'tripadvisor') {
    const href = getTripadvisorReviewUrl(hotel, review);
    return href ? { href, label: 'View on TripAdvisor' } : null;
  }

  if (review.source === 'google') {
    const href = getGoogleMapsPlaceUrl(hotel);
    return href ? { href, label: 'View on Google Maps' } : null;
  }

  return null;
}

export function getHotelExternalLinks(hotel: Pick<HotelDashboardRow, 'website_url' | 'ta_location_id' | 'gp_place_id' | 'dp_instagram_handle'> & {
  dp_instagram_handle?: string | null;
}) {
  const website = hotel.website_url
    ? { href: hotel.website_url, label: trimProtocol(hotel.website_url) }
    : null;
  const tripadvisor = getTripadvisorHotelUrl(hotel);
  const googleMaps = getGoogleMapsPlaceUrl(hotel);
  const instagram = getInstagramUrl(hotel.dp_instagram_handle);

  return {
    website,
    tripadvisor: tripadvisor ? { href: tripadvisor, label: 'TripAdvisor' } : null,
    googleMaps: googleMaps ? { href: googleMaps, label: 'Google Maps' } : null,
    instagram: instagram ? { href: instagram, label: 'Instagram' } : null,
  };
}
