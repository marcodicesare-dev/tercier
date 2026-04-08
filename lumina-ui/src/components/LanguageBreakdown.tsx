import Link from 'next/link';
import { EmptyInsight } from '@/components/EmptyInsight';
import type { LanguageBreakdownRow } from '@/lib/types';
import { formatDecimal, formatNumber } from '@/lib/utils';

export function LanguageBreakdown({
  hotelId,
  languages,
  websiteContentLanguages,
  insight,
}: {
  hotelId: string;
  languages: LanguageBreakdownRow[];
  websiteContentLanguages?: string | null;
  insight?: string;
}) {
  const supported = new Set(
    (websiteContentLanguages ?? '')
      .split(/[,|/]/)
      .map(value => value.trim().toLowerCase())
      .filter(Boolean),
  );
  const gap = languages
    .filter(language => {
      const reviewLanguage = language.lang.toLowerCase();
      return !supported.has(reviewLanguage) && ![...supported].some(item => item.startsWith(reviewLanguage));
    })
    .sort((a, b) => b.review_count - a.review_count)[0];
  const hasSentimentCounts = languages.some(language => language.positive > 0 || language.negative > 0);

  if (!languages.length) {
    return (
      <EmptyInsight
        title="No language breakdown yet"
        body="This hotel has not generated a usable language breakdown yet, so there is nothing meaningful to compare by market."
      />
    );
  }

  return (
    <div className="space-y-4">
      {insight ? (
        <p className="text-sm leading-6 text-stone-700">{insight}</p>
      ) : null}
      <div className="rounded-3xl border border-stone-200 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Website content coverage</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[...supported].length ? [...supported].map(code => (
            <span key={code} className="rounded-full bg-[#efe4d8] px-3 py-1 text-xs font-medium text-[var(--deep-terracotta)]">
              {code}
            </span>
          )) : (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">Website language coverage not yet analyzed</span>
          )}
        </div>
      </div>
      {gap && supported.size > 0 ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Opportunity: {formatNumber(gap.review_count)} {gap.lang} reviews but no matching website content language signal. This is a direct localization gap, not a spoken-language guess.
        </div>
      ) : null}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50 text-left text-stone-600">
            <tr>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Reviews</th>
              <th className="px-4 py-3 font-medium">Avg rating</th>
              {hasSentimentCounts ? <th className="px-4 py-3 font-medium">Positive</th> : null}
              {hasSentimentCounts ? <th className="px-4 py-3 font-medium">Negative</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {languages.map(language => (
              <tr key={language.lang}>
                <td className="px-4 py-3 font-medium text-[var(--lumina-ink)]">
                  <Link href={`/hotel/${hotelId}/reviews?lang=${encodeURIComponent(language.lang)}`} className="hover:text-[var(--deep-terracotta)]">
                    {language.lang}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatNumber(language.review_count)}</td>
                <td className="px-4 py-3">{formatDecimal(language.avg_rating, 2)}</td>
                {hasSentimentCounts ? <td className="px-4 py-3">{formatNumber(language.positive)}</td> : null}
                {hasSentimentCounts ? <td className="px-4 py-3">{formatNumber(language.negative)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hasSentimentCounts ? (
        <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Per-language sentiment counts are still thin.</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {languages.slice(0, 8).map(language => (
          <Link
            key={`${language.lang}-reviews`}
            href={`/hotel/${hotelId}/reviews?lang=${encodeURIComponent(language.lang)}`}
            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 hover:border-stone-300"
          >
            Read {language.lang} reviews
          </Link>
        ))}
      </div>
    </div>
  );
}
