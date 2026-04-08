import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelDashboardRow } from '@/lib/types';
import { formatDecimal, titleCase } from '@/lib/utils';

function topicSignals(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'title' in item && typeof item.title === 'string') return item.title;
        return null;
      })
      .filter((item): item is string => Boolean(item))
      .slice(0, 4);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).slice(0, 4);
  }
  return [];
}

function MentionBadge({ label, active }: { label: string; active: boolean | null | undefined }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
      }`}
    >
      {active ? 'Mentioned' : 'Not surfaced'} · {label}
    </span>
  );
}

export function AIVisibility({
  hotel,
  competitorAverage,
  insight,
}: {
  hotel: HotelDashboardRow;
  competitorAverage: number | null;
  insight?: string;
}) {
  const hasSignal =
    hotel.ai_visibility_score != null ||
    hotel.ai_chatgpt_mentioned != null ||
    hotel.ai_perplexity_mentioned != null ||
    Boolean(hotel.gp_review_summary_gemini) ||
    Boolean(hotel.gp_editorial_summary);

  if (!hasSignal) {
    return (
      <EmptyInsight
        title="AI discovery signal not scored yet"
        body="This property does not yet have enough cached model-facing signal to show an AI visibility view."
      />
    );
  }

  const score = hotel.ai_visibility_score ?? 0;
  const pct = Math.max(0, Math.min(100, Math.round(score * 100)));
  const summary = hotel.gp_review_summary_gemini ?? hotel.gp_editorial_summary ?? 'No cached AI-facing narrative yet.';
  const evidence = [
    hotel.gp_editorial_summary ? { label: 'Editorial summary', body: hotel.gp_editorial_summary } : null,
    hotel.gp_review_summary_gemini ? { label: 'Gemini review summary', body: hotel.gp_review_summary_gemini } : null,
    topicSignals(hotel.gmb_place_topics).length
      ? { label: 'Place topics', body: topicSignals(hotel.gmb_place_topics).map(titleCase).join(' · ') }
      : null,
  ].filter((item): item is { label: string; body: string } => Boolean(item));
  const delta = competitorAverage != null && hotel.ai_visibility_score != null
    ? hotel.ai_visibility_score - competitorAverage
    : null;

  return (
    <div className="space-y-4">
      {insight ? (
        <p className="text-sm leading-6 text-stone-700">{insight}</p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Visibility Score</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-[var(--terracotta)]" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-4xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(hotel.ai_visibility_score, 2)}</p>
            <p className="text-sm text-stone-500">{pct}% of discovery surface</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <MentionBadge label="ChatGPT" active={hotel.ai_chatgpt_mentioned} />
            <MentionBadge label="Perplexity" active={hotel.ai_perplexity_mentioned} />
          </div>
          <p className="mt-4 text-sm text-stone-600">
            {delta == null
              ? 'Competitive AI benchmark unavailable.'
              : `${delta >= 0 ? 'Ahead of' : 'Behind'} mapped competitors by ${Math.abs(delta).toFixed(2)} points on cached AI visibility.`}
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">How the model currently sees this hotel</p>
          <p className="mt-4 text-base leading-7 text-stone-700">{summary}</p>
          {evidence.length ? (
            <div className="mt-5 grid gap-3">
              {evidence.map(item => (
                <div key={item.label} className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--lumina-ink)]">{item.body}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--warm-cream)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Discovery prompt</p>
              <p className="mt-2 text-sm text-[var(--lumina-ink)]">
                “Best {titleCase(hotel.ta_category)} in {hotel.city ?? 'market'} for {titleCase(hotel.ta_primary_segment)} guests”
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--warm-cream)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Commercial signal</p>
              <p className="mt-2 text-sm text-[var(--lumina-ink)]">
                Hotels visible in AI search tend to convert more direct demand from discovery-led trips.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
