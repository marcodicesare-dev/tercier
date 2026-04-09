import Link from 'next/link';
import type { HotelDashboardRow, HotelOpportunityData } from '@/lib/types';
import { formatNumber, titleCase } from '@/lib/utils';
import { InsightSentence } from '@/components/InsightSentence';

function buildReviewsHref(hotelId: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const suffix = query.toString();
  return suffix ? `/hotel/${hotelId}/reviews?${suffix}` : `/hotel/${hotelId}/reviews`;
}

export function OpportunityHero({
  hotel,
  opportunity,
}: {
  hotel: HotelDashboardRow;
  opportunity: HotelOpportunityData | null;
}) {
  const score = opportunity?.opportunity?.score ?? hotel.score_tos ?? 0;
  const reason = opportunity?.opportunity?.primary_reason ?? hotel.computed_opportunity_primary ?? null;
  const action = opportunity?.opportunity?.action ?? null;
  const salesHook = opportunity?.opportunity?.sales_hook ?? null;
  const proofPathState = opportunity?.opportunity?.proof_path_state ?? opportunity?.evidence_summary?.proof_path_state ?? null;
  const languageMarkets = opportunity?.language_markets?.slice(0, 5) ?? [];
  const topicWeaknesses = opportunity?.topic_weaknesses?.slice(0, 4) ?? [];
  const unservedLanguages = languageMarkets.filter(language => language.served === false);
  const evidenceSummary = opportunity?.evidence_summary ?? null;
  const processedCoverage = evidenceSummary?.processed_review_coverage != null
    ? `${Math.round(evidenceSummary.processed_review_coverage * 100)}%`
    : null;
  const verificationPrompt = reason
    ? `${titleCase(reason)} is driving the ranking. Use the drill-downs below to verify it against guest reviews and source pages.`
    : 'Use the drill-downs below to prove the opening brief against guest reviews and source pages.';

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-6 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-stone-600">Evidence briefing</p>
          <div className="flex items-end gap-4">
            <p className="text-5xl font-semibold text-[var(--deep-terracotta)]">{Math.round(score * 100)}</p>
            <p className="pb-1 text-sm uppercase tracking-[0.18em] text-stone-600">Opportunity score / 100</p>
          </div>
          <InsightSentence>{verificationPrompt}</InsightSentence>
          {reason ? (
            <p className="text-sm text-stone-600">
              Primary driver: <span className="font-medium text-[var(--lumina-ink)]">{titleCase(reason)}</span>
            </p>
          ) : null}
          {salesHook ? (
            <p className="text-sm leading-6 text-stone-700">{salesHook}</p>
          ) : null}
          {action ? (
            <div className="rounded-3xl border border-stone-200 bg-[var(--warm-cream)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-600">What to do now</p>
              <p className="mt-2 text-sm leading-6 text-[var(--lumina-ink)]">{action}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Link href={`/hotel/${hotel.hotel_id}/reviews`} className="rounded-full bg-[var(--deep-terracotta)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--lumina-ink)]">
              Open review explorer
            </Link>
            {unservedLanguages[0] ? (
              <Link
                href={buildReviewsHref(hotel.hotel_id, { lang: unservedLanguages[0].lang })}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-stone-300"
              >
                Read {unservedLanguages[0].lang_name ?? titleCase(unservedLanguages[0].lang)} reviews
              </Link>
            ) : null}
            {topicWeaknesses[0] ? (
              <Link
                href={buildReviewsHref(hotel.hotel_id, { aspect: topicWeaknesses[0].aspect })}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:border-stone-300"
              >
                See {titleCase(topicWeaknesses[0].aspect)} evidence
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-[var(--warm-cream)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Review velocity</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--deep-terracotta)]">
              {formatNumber(opportunity?.review_velocity?.last_3_months ?? hotel.ta_reviews_last_90d_est ?? null)}
            </p>
            <p className="mt-2 text-sm text-stone-600">Reviews in the last 90 days feeding this brief.</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Proof depth</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--deep-terracotta)]">
              {processedCoverage ?? '—'}
            </p>
            <p className="mt-2 text-sm text-stone-600">
              {evidenceSummary
                ? `${formatNumber(evidenceSummary.processed_reviews)} processed reviews out of ${formatNumber(evidenceSummary.total_reviews)} total · ${proofPathState ?? 'unknown'} proof path`
                : 'Evidence depth has not been summarized yet.'}
            </p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-5 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Language evidence</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(unservedLanguages.length ? unservedLanguages : languageMarkets).slice(0, 4).map(language => (
                <Link
                  key={language.lang}
                  href={buildReviewsHref(hotel.hotel_id, { lang: language.lang })}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200"
                >
                  {(language.lang_name ?? titleCase(language.lang))} · {formatNumber(language.review_count)}
                </Link>
              ))}
              {!languageMarkets.length ? (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">No language drill-down yet</span>
              ) : null}
            </div>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-5 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-600">Weaknesses worth proving</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topicWeaknesses.map(topic => (
                <Link
                  key={topic.aspect}
                  href={buildReviewsHref(hotel.hotel_id, { aspect: topic.aspect })}
                  className="rounded-full bg-[#efe4d8] px-3 py-1 text-xs font-medium text-[var(--deep-terracotta)] hover:opacity-80"
                >
                  {titleCase(topic.aspect)} · {Math.round(topic.negative_pct)}% negative
                </Link>
              ))}
              {!topicWeaknesses.length ? (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">No topic weakness drill-down yet</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
