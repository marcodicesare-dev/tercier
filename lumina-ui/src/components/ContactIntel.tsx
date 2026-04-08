import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelDashboardRow } from '@/lib/types';
import { formatNumber, titleCase } from '@/lib/utils';

export function ContactIntel({ hotel }: { hotel: HotelDashboardRow }) {
  const departments = (hotel.cx_hiring_departments ?? '')
    .split('|')
    .map(value => value.trim())
    .filter(Boolean);
  const activeJobs = hotel.cx_active_job_count ?? 0;
  const hasSignal = Boolean(
    hotel.cx_gm_name ||
    hotel.cx_gm_email ||
    hotel.cx_gm_phone ||
    hotel.cx_gm_linkedin ||
    hotel.cx_gm_source ||
    activeJobs > 0 ||
    departments.length > 0,
  );

  if (!hasSignal) {
    return (
      <EmptyInsight
        title="No contact intelligence yet"
        body="The Fiber sweep has not found a useful GM or hiring trail for this property yet."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Decision-maker record</p>
        {hotel.cx_gm_name ? (
          <div className="mt-4 space-y-3">
            <div>
              <h4 className="text-2xl font-semibold text-[var(--lumina-ink)]">{hotel.cx_gm_name}</h4>
              <p className="text-sm text-stone-600">{hotel.cx_gm_title ?? 'General Manager'}</p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-stone-500">Email</dt>
                <dd className="mt-1 font-medium text-[var(--lumina-ink)]">{hotel.cx_gm_email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Phone</dt>
                <dd className="mt-1 font-medium text-[var(--lumina-ink)]">{hotel.cx_gm_phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Confidence</dt>
                <dd className="mt-1 font-medium text-[var(--lumina-ink)]">{titleCase(hotel.cx_gm_confidence)}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Source</dt>
                <dd className="mt-1 font-medium text-[var(--lumina-ink)]">{titleCase(hotel.cx_gm_source)}</dd>
              </div>
            </dl>
            {hotel.cx_gm_linkedin ? (
              <a className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-stone-300" href={hotel.cx_gm_linkedin} target="_blank" rel="noreferrer">
                Open LinkedIn
              </a>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">No contact intelligence captured yet.</p>
        )}
      </div>
      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Hiring signal</p>
        <p className="mt-4 text-3xl font-semibold text-[var(--deep-terracotta)]">{formatNumber(activeJobs)}</p>
        <p className="mt-2 text-sm text-stone-600">
          {activeJobs > 0
            ? 'Active hiring openings suggest budget movement or operating change.'
            : 'No active hiring signal captured yet.'}
        </p>
        {departments.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {departments.map(department => (
              <span key={department} className="rounded-full bg-[#efe4d8] px-3 py-1 text-xs font-medium text-[var(--deep-terracotta)]">
                {titleCase(department)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
