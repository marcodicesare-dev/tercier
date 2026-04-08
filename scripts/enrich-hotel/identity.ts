import { haversineKm, nameSimilarity } from '../phase0-enrichment/lib/matching.js';
import type { ExistingHotelRow, HotelInput } from './types.js';

export interface IdentityCandidate {
  name?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface IdentityAssessment {
  ok: boolean;
  confidence: number;
  reasons: string[];
  blockingReason?: string;
}

export class IdentityConflictError extends Error {
  source: string;
  evidence: Record<string, unknown>;

  constructor(source: string, message: string, evidence: Record<string, unknown>) {
    super(message);
    this.name = 'IdentityConflictError';
    this.source = source;
    this.evidence = evidence;
  }
}

function normalizeComparable(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function locationMatches(expected: string | null | undefined, ...candidates: Array<string | null | undefined>): boolean | null {
  const normalizedExpected = normalizeComparable(expected);
  if (!normalizedExpected) return null;

  const normalizedCandidates = candidates.map(candidate => normalizeComparable(candidate)).filter(Boolean);
  if (!normalizedCandidates.length) return null;

  return normalizedCandidates.some(candidate =>
    candidate === normalizedExpected ||
    candidate.includes(normalizedExpected) ||
    normalizedExpected.includes(candidate),
  );
}

function requiredBrandMatches(inputName: string, candidateName: string | null | undefined): boolean {
  const normalizedInput = normalizeComparable(inputName);
  const normalizedCandidate = normalizeComparable(candidateName);
  const requiredBrands = ['kempinski', 'bristoria'];
  for (const brand of requiredBrands) {
    if (normalizedInput.includes(brand) && !normalizedCandidate.includes(brand)) {
      return false;
    }
  }
  return true;
}

export function assessIdentityMatch(
  input: HotelInput,
  candidate: IdentityCandidate,
  options?: {
    source?: string;
    currentLatitude?: number | null;
    currentLongitude?: number | null;
  },
): IdentityAssessment {
  const reasons: string[] = [];
  const source = options?.source ?? 'identity';
  const candidateName = candidate.name ?? '';
  const nameScore = candidateName ? nameSimilarity(input.name, candidateName) : 0;
  const cityMatch = locationMatches(input.city, candidate.city, candidate.address);
  const countryMatch = locationMatches(input.country, candidate.country, candidate.address);

  if (!candidateName) {
    return {
      ok: false,
      confidence: 0,
      reasons,
      blockingReason: `${source}: candidate is missing a name`,
    };
  }

  if (!requiredBrandMatches(input.name, candidate.name)) {
    return {
      ok: false,
      confidence: nameScore,
      reasons,
      blockingReason: `${source}: required brand token mismatch`,
    };
  }

  if (input.city && cityMatch === false) {
    return {
      ok: false,
      confidence: nameScore,
      reasons,
      blockingReason: `${source}: city mismatch`,
    };
  }

  if (input.country && countryMatch === false) {
    return {
      ok: false,
      confidence: nameScore,
      reasons,
      blockingReason: `${source}: country mismatch`,
    };
  }

  if (nameScore < 0.72) {
    return {
      ok: false,
      confidence: nameScore,
      reasons,
      blockingReason: `${source}: name similarity too low (${nameScore.toFixed(3)})`,
    };
  }

  if (
    typeof options?.currentLatitude === 'number' &&
    typeof options?.currentLongitude === 'number' &&
    typeof candidate.latitude === 'number' &&
    typeof candidate.longitude === 'number'
  ) {
    const distanceKm = haversineKm(
      options.currentLatitude,
      options.currentLongitude,
      candidate.latitude,
      candidate.longitude,
    );
    reasons.push(`distance_km=${distanceKm.toFixed(1)}`);
    if (distanceKm > 100) {
      return {
        ok: false,
        confidence: nameScore,
        reasons,
        blockingReason: `${source}: coordinate mismatch (${distanceKm.toFixed(1)}km)`,
      };
    }
  }

  reasons.push(`name_score=${nameScore.toFixed(3)}`);
  if (cityMatch === true) reasons.push('city_match');
  if (countryMatch === true) reasons.push('country_match');

  const confidence =
    nameScore +
    (cityMatch === true ? 0.2 : 0) +
    (countryMatch === true ? 0.15 : 0);

  return {
    ok: confidence >= 0.9 || (nameScore >= 0.82 && cityMatch !== false && countryMatch !== false),
    confidence,
    reasons,
    blockingReason:
      confidence >= 0.9 || (nameScore >= 0.82 && cityMatch !== false && countryMatch !== false)
        ? undefined
        : `${source}: insufficient corroboration`,
  };
}

export function assertIdentityMatch(
  input: HotelInput,
  candidate: IdentityCandidate,
  source: string,
  evidence: Record<string, unknown>,
  options?: {
    currentLatitude?: number | null;
    currentLongitude?: number | null;
  },
): IdentityAssessment {
  const assessment = assessIdentityMatch(input, candidate, {
    source,
    currentLatitude: options?.currentLatitude,
    currentLongitude: options?.currentLongitude,
  });
  if (!assessment.ok) {
    throw new IdentityConflictError(
      source,
      assessment.blockingReason ?? `${source}: identity mismatch`,
      {
        ...evidence,
        candidate,
        assessment,
        input,
      },
    );
  }
  return assessment;
}

export function existingRowCandidate(row: ExistingHotelRow): IdentityCandidate {
  return {
    name: row.name,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}
