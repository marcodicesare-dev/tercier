import { EmptyInsight } from '@/components/EmptyInsight';
import type { ContentSeedRow } from '@/lib/types';

const EMOTION_PRIORITY: Record<string, number> = {
  delight: 0,
  impressed: 1,
  grateful: 2,
};

function emojiCount(value: string): number {
  const matches = value.match(/\p{Extended_Pictographic}/gu);
  return matches ? matches.length : 0;
}

function isAllCaps(value: string): boolean {
  const letters = value.replace(/[^a-zA-Z]/g, '');
  return letters.length >= 4 && letters === letters.toUpperCase();
}

export function ContentSeedsList({ seeds }: { seeds: ContentSeedRow[] }) {
  const filteredSeeds = [...seeds]
    .filter(seed => {
      const quote = (seed.quote ?? '').trim();
      if (quote.length < 25) return false;
      if (emojiCount(quote) > 3) return false;
      if (isAllCaps(quote)) return false;
      return true;
    })
    .sort((left, right) => {
      const lengthDelta = (right.quote?.length ?? 0) - (left.quote?.length ?? 0);
      if (lengthDelta !== 0) return lengthDelta;
      return (EMOTION_PRIORITY[left.emotion?.toLowerCase() ?? ''] ?? 99) - (EMOTION_PRIORITY[right.emotion?.toLowerCase() ?? ''] ?? 99);
    });

  if (!filteredSeeds.length) {
    return (
      <EmptyInsight
        title="No campaign-ready quote seeds yet"
        body="The review corpus exists, but none of the current snippets clear the quality bar for reuse."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredSeeds.slice(0, 6).map(seed => (
        <article key={seed.review_id + seed.quote} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-sm leading-6 text-stone-700">“{seed.quote}”</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[#efe4d8] px-3 py-1 text-[var(--deep-terracotta)]">{seed.emotion ?? 'emotion'}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{seed.segment ?? 'segment'}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{seed.marketing_use ?? 'use'}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">{seed.lang ?? '—'}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
