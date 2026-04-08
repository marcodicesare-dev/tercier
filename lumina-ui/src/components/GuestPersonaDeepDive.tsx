import { getPersonaLabel } from '@/lib/insights';
import type { GuestPersonaDeepDiveData, GuestPersonaRow } from '@/lib/types';
import { formatNumber, titleCase } from '@/lib/utils';

function DistributionColumn({
  title,
  rows,
}: {
  title: string;
  rows: GuestPersonaDeepDiveData['spendingLevels'];
}) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-4">
        <p className="text-sm font-semibold text-[var(--lumina-ink)]">{title}</p>
        <p className="mt-3 text-sm text-stone-500">No signal yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4">
      <p className="text-sm font-semibold text-[var(--lumina-ink)]">{title}</p>
      <div className="mt-3 space-y-3">
        {rows.slice(0, 5).map(row => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-stone-600">{titleCase(row.label)}</span>
              <span className="font-medium text-[var(--lumina-ink)]">{formatNumber(row.count)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-[var(--terracotta)]" style={{ width: `${Math.round(row.pct * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GuestPersonaDeepDive({
  personas,
  deepDive,
}: {
  personas: GuestPersonaRow[];
  deepDive: GuestPersonaDeepDiveData;
}) {
  const archetypes = personas
    .map(persona => ({ ...persona, label: getPersonaLabel(persona) }))
    .filter((persona): persona is GuestPersonaRow & { label: string } => Boolean(persona.label))
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Archetypes</p>
          <div className="mt-4 space-y-3">
            {archetypes.length ? archetypes.map(persona => (
              <div key={`${persona.occasion}-${persona.spending_level}-${persona.group_detail}`} className="rounded-2xl bg-[var(--warm-cream)] p-4">
                <p className="text-sm font-semibold text-[var(--lumina-ink)]">{persona.label}</p>
                <p className="mt-1 text-sm text-stone-600">
                  {formatNumber(persona.review_count)} reviews · average rating {persona.avg_rating ?? '—'}
                </p>
              </div>
            )) : <p className="text-sm text-stone-500">Detailed persona breakdown requires NLP processing.</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Repeat guest signal</p>
          <p className="mt-4 text-4xl font-semibold text-[var(--deep-terracotta)]">
            {deepDive.repeatGuestPct != null ? `${Math.round(deepDive.repeatGuestPct * 100)}%` : '—'}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {formatNumber(deepDive.repeatGuestReviews)} repeat-guest reviews from {formatNumber(deepDive.totalSignalReviews)} NLP persona signals.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionColumn title="Spending level" rows={deepDive.spendingLevels} />
        <DistributionColumn title="Occasion" rows={deepDive.occasions} />
        <DistributionColumn title="Group detail" rows={deepDive.groupDetails} />
        <DistributionColumn title="Length of stay" rows={deepDive.lengthsOfStay} />
      </div>
    </div>
  );
}
