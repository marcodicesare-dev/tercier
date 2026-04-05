import { resolve } from 'node:path';
import { retryWithBackoff } from '../../phase0-enrichment/lib/retry-with-backoff.js';
import type { PipelineContext, SourceResult } from '../types.js';
import { cleanString, getCachedOrFetch, normalizeDomain, statusError, statusOk, statusSkipped } from '../utils.js';

const CACHE_PERSON = resolve(process.cwd(), 'scripts/enrich-hotel/cache/fiber-person.jsonl');
const CACHE_CONTACT = resolve(process.cwd(), 'scripts/enrich-hotel/cache/fiber-contact.jsonl');
const CACHE_COMPANY = resolve(process.cwd(), 'scripts/enrich-hotel/cache/fiber-company.jsonl');
const FIBER_BASE = 'https://api.fiber.ai';

function getApiKey(): string {
  const key = process.env.FIBER_API_KEY;
  if (!key) throw new Error('Missing FIBER_API_KEY');
  return key;
}

async function callFiber<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return await retryWithBackoff(async () => {
    const res = await fetch(`${FIBER_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const error = new Error(`Fiber ${res.status}: ${text.slice(0, 220)}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return (await res.json()) as T;
  });
}

function chooseBestEmail(emails: any[]): { email: string | null; status: string | null } {
  const ranked = (Array.isArray(emails) ? emails : [])
    .filter(entry => typeof entry?.email === 'string')
    .map(entry => ({
      email: entry.email as string,
      status: typeof entry.status === 'string' ? entry.status : null,
      score:
        (entry.type === 'work' ? 4 : entry.type === 'generic' ? 2 : 1) +
        (entry.status === 'valid' ? 4 : entry.status === 'risky' ? 2 : 1),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0] ?? { email: null, status: null };
}

function confidenceFromTitleAndEmail(title: string | null, emailStatus: string | null): string | null {
  const strongTitle = /general manager|hotel manager|managing director|directeur|direttore|direktor/i.test(title ?? '');
  if (strongTitle && emailStatus === 'valid') return 'gold';
  if (strongTitle && emailStatus) return 'silver';
  if (title || emailStatus) return 'bronze';
  return null;
}

export async function runFiber(context: PipelineContext): Promise<SourceResult> {
  const websiteDomain = normalizeDomain(context.websiteUrl);
  const hotelName = context.input.name;
  const apiKey = process.env.FIBER_API_KEY;
  if (!apiKey) {
    return { statuses: [statusSkipped('fiber', 'No Fiber API key')] };
  }

  try {
    const companyResult = await getCachedOrFetch<any>(
      CACHE_COMPANY,
      hotelName,
      async () =>
        await callFiber('/v1/kitchen-sink/company', {
          apiKey,
          companyName: { value: hotelName },
          companyDomain: websiteDomain ? { value: websiteDomain } : null,
          numCompanies: 1,
        }),
    );

    const personResult = await getCachedOrFetch<any>(
      CACHE_PERSON,
      hotelName,
      async () =>
        await callFiber('/v1/kitchen-sink/person', {
          apiKey,
          numProfiles: 3,
          fuzzySearch: true,
          getDetailedWorkExperience: false,
          getDetailedEducation: false,
          companyName: { value: hotelName },
          companyDomain: websiteDomain ? { value: websiteDomain } : null,
          jobTitle: { value: 'General Manager' },
        }),
    );

    const companyData = companyResult.data?.output?.data?.[0] ?? null;
    const person = personResult.data?.output?.data?.[0] ?? null;

    let linkedinUrl = cleanString(person?.url) ?? null;
    let contactData: any = null;
    if (linkedinUrl) {
      const contactResult = await getCachedOrFetch<any>(
        CACHE_CONTACT,
        linkedinUrl,
        async () =>
          await callFiber('/v1/contact-details/single', {
            apiKey,
            linkedinUrl,
            enrichmentType: {
              getWorkEmails: true,
              getPersonalEmails: true,
              getPhoneNumbers: true,
            },
            validateEmails: true,
          }),
      );
      contactData = contactResult.data?.output?.profile ?? null;
    }

    const bestEmail = chooseBestEmail(contactData?.emails ?? []);
    const phone = Array.isArray(contactData?.phoneNumbers)
      ? cleanString(contactData.phoneNumbers.find((entry: any) => typeof entry?.number === 'string')?.number)
      : null;

    return {
      hotel: {
        cx_gm_name: cleanString(person?.name),
        cx_gm_title: cleanString(person?.current_job?.title ?? person?.headline),
        cx_gm_linkedin: linkedinUrl,
        cx_gm_email: cleanString(bestEmail.email),
        cx_gm_phone: phone,
        cx_gm_source: person ? 'fiber' : null,
        cx_company_headcount:
          typeof companyData?.employee_count === 'number'
            ? companyData.employee_count
            : typeof companyData?.headcount === 'number'
              ? companyData.headcount
              : null,
        cx_hiring_signals:
          typeof companyData?.is_hiring === 'boolean'
            ? companyData.is_hiring
            : Array.isArray(companyData?.job_openings)
              ? companyData.job_openings.length > 0
              : null,
        cx_gm_confidence: confidenceFromTitleAndEmail(
          cleanString(person?.current_job?.title ?? person?.headline),
          bestEmail.status,
        ),
      },
      statuses: [
        statusOk(
          'fiber',
          `person=${cleanString(person?.name) ?? 'none'}; email=${cleanString(bestEmail.email) ?? 'none'}`,
          companyResult.cached && personResult.cached,
        ),
      ],
    };
  } catch (error) {
    const candidate = error as { status?: number; message?: string };
    if (candidate?.status === 402 || /out of credits/i.test(candidate?.message ?? '')) {
      return {
        statuses: [statusSkipped('fiber', 'Fiber credits exhausted')],
      };
    }

    return {
      statuses: [statusError('fiber', error)],
    };
  }
}
