import type { LanguageBreakdownRow } from '@/lib/types';
import { formatDecimal, formatNumber } from '@/lib/utils';

export function LanguageBreakdown({ languages }: { languages: LanguageBreakdownRow[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-50 text-left text-stone-600">
          <tr>
            <th className="px-4 py-3 font-medium">Language</th>
            <th className="px-4 py-3 font-medium">Reviews</th>
            <th className="px-4 py-3 font-medium">Avg rating</th>
            <th className="px-4 py-3 font-medium">Positive</th>
            <th className="px-4 py-3 font-medium">Negative</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {languages.map(language => (
            <tr key={language.lang}>
              <td className="px-4 py-3 font-medium text-[var(--lumina-ink)]">{language.lang}</td>
              <td className="px-4 py-3">{formatNumber(language.review_count)}</td>
              <td className="px-4 py-3">{formatDecimal(language.avg_rating, 2)}</td>
              <td className="px-4 py-3">{formatNumber(language.positive)}</td>
              <td className="px-4 py-3">{formatNumber(language.negative)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
