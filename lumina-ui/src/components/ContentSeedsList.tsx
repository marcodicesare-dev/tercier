import type { ContentSeedRow } from '@/lib/types';

export function ContentSeedsList({ seeds }: { seeds: ContentSeedRow[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {seeds.map(seed => (
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
