import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelDashboardRow } from '@/lib/types';
import { formatDecimal, titleCase } from '@/lib/utils';

function toTopicTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'title' in item && typeof item.title === 'string') return item.title;
      return null;
    }).filter((item): item is string => Boolean(item));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).slice(0, 10);
  }
  return [];
}

function toPopularTimes(value: unknown): Array<{ label: string; score: number }> {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return [];
  return Object.entries(value)
    .flatMap(([key, raw]) => {
      if (Array.isArray(raw)) {
        return raw.slice(0, 1).map(first => ({
          label: titleCase(key),
          score: typeof first === 'number' ? first : typeof first === 'object' && first && 'value' in first && typeof first.value === 'number' ? first.value : 0,
        }));
      }
      if (typeof raw === 'number') return [{ label: titleCase(key), score: raw }];
      return [];
    })
    .filter(entry => entry.score > 0)
    .slice(0, 7);
}

export function GMBSignals({ hotel }: { hotel: HotelDashboardRow }) {
  const topics = toTopicTags(hotel.gmb_place_topics);
  const popularTimes = toPopularTimes(hotel.gmb_popular_times);
  const hasSignal =
    hotel.gmb_is_claimed != null ||
    hotel.gmb_book_online_url != null ||
    hotel.gmb_hotel_star_rating != null ||
    hotel.gov_star_rating != null ||
    hotel.qna_response_rate != null ||
    topics.length > 0 ||
    popularTimes.length > 0;

  if (!hasSignal) {
    return (
      <EmptyInsight
        title="Google Business profile signal not ready"
        body="The Google listing exists, but claimed status, topics, and popular-times data have not been captured cleanly yet."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            hotel.gmb_is_claimed == null
              ? 'bg-stone-100 text-stone-600'
              : hotel.gmb_is_claimed
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
          }`}>
            {hotel.gmb_is_claimed == null ? 'Claim status unknown' : hotel.gmb_is_claimed ? 'Claimed' : 'Unclaimed opportunity'}
          </span>
          {hotel.gmb_book_online_url ? (
            <a className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 hover:border-stone-300" href={hotel.gmb_book_online_url} target="_blank" rel="noreferrer">
              Book online URL
            </a>
          ) : null}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[var(--warm-cream)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Star rating</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">{formatDecimal(hotel.gmb_hotel_star_rating ?? hotel.gov_star_rating, 1)}</p>
            <p className="mt-2 text-sm text-stone-600">{hotel.gov_star_source ? `Official source: ${hotel.gov_star_source}` : 'Google / profile star classification.'}</p>
          </div>
          <div className="rounded-2xl bg-[var(--warm-cream)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Q&A response rate</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">{hotel.qna_response_rate != null ? `${Math.round(hotel.qna_response_rate * 100)}%` : '—'}</p>
            <p className="mt-2 text-sm text-stone-600">Combines GMB demand signals with question handling discipline.</p>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Popular times & place topics</p>
        {popularTimes.length ? (
          <div className="mt-4 space-y-3">
            {popularTimes.map(entry => (
              <div key={entry.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-stone-600">{entry.label}</span>
                  <span className="font-medium text-[var(--lumina-ink)]">{entry.score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-[var(--terracotta)]" style={{ width: `${Math.min(100, entry.score)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">Popular-times heatmap not captured yet.</p>
        )}
        {topics.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {topics.map(topic => (
              <span key={topic} className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">{titleCase(topic)}</span>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-stone-500">No place-topic tags captured yet.</p>
        )}
      </div>
    </div>
  );
}
