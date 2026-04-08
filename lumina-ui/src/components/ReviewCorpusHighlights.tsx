import { EmptyInsight } from '@/components/EmptyInsight';
import type { SemanticReviewQueryResult } from '@/lib/types';
import { formatDecimal, titleCase } from '@/lib/utils';

function trimQuote(value: string | null, limit = 220): string {
  if (!value) return 'No quote available.';
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trimEnd()}...`;
}

export function ReviewCorpusHighlights({
  queries,
}: {
  queries: SemanticReviewQueryResult[];
}) {
  if (!queries.length) {
    return (
      <EmptyInsight
        title="Semantic review search not available yet"
        body="Embeddings exist for the corpus, but this property does not yet have enough vector matches to show useful proof points."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Semantic prompts hitting the review corpus</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {queries.map(query => (
            <span key={query.label} className="rounded-full bg-[#efe4d8] px-3 py-1 text-xs font-medium text-[var(--deep-terracotta)]">
              {query.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {queries.map(query => (
          <article key={query.label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">{query.label}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">{query.query}</p>
            <div className="mt-4 space-y-3">
              {query.matches.slice(0, 2).map(match => (
                <div key={match.id} className="rounded-2xl bg-[var(--warm-cream)] p-4">
                  <p className="text-sm leading-6 text-[var(--lumina-ink)]">“{trimQuote(match.text)}”</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white px-3 py-1 text-stone-700">{titleCase(match.lang)}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-stone-700">rating {formatDecimal(match.rating, 1)}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-stone-700">
                      similarity {formatDecimal(match.similarity, 2)}
                    </span>
                    {match.sentiment ? (
                      <span className="rounded-full bg-white px-3 py-1 text-stone-700">{titleCase(match.sentiment)}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
