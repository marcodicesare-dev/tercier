import { getPortfolioHotels } from '@/lib/data';
import type { HotelDashboardRow } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function statusKey(status: string | null | undefined): string {
  if (!status) return 'unknown';
  if (status === 'computed' || status.includes('complete')) return 'complete';
  if (status.includes('running')) return 'running';
  if (status.includes('matched')) return 'matched';
  return status;
}

function moduleFlags(hotel: HotelDashboardRow) {
  return {
    aiDiscovery: hotel.ai_visibility_score != null || hotel.ai_chatgpt_mentioned != null || hotel.ai_perplexity_mentioned != null,
    quality: [
      hotel.ta_subrating_location,
      hotel.ta_subrating_sleep,
      hotel.ta_subrating_rooms,
      hotel.ta_subrating_service,
      hotel.ta_subrating_value,
      hotel.ta_subrating_cleanliness,
    ].some(value => value != null),
    personas: hotel.ta_primary_segment != null || hotel.topic_mentions_total > 0,
    competition: hotel.competitor_count > 0,
    languages: (hotel.ta_review_language_count ?? 0) > 0,
    pricing: hotel.price_direct != null || hotel.price_lowest_ota != null || hotel.price_parity_score != null,
    digital: hotel.dp_website_tech_cms != null || hotel.seo_domain_authority != null || hotel.dp_schema_completeness != null,
    gmb: hotel.gmb_is_claimed != null || hotel.qna_count != null,
    contactIntel: hotel.cx_gm_name != null || hotel.cx_gm_email != null || (hotel.cx_active_job_count ?? 0) > 0,
  };
}

export default async function AdminPage() {
  const hotels = await getPortfolioHotels();
  const statusCounts = hotels.reduce<Record<string, number>>((acc, hotel) => {
    const key = statusKey(hotel.enrichment_status);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const readiness = hotels.reduce<Record<string, number>>((acc, hotel) => {
    const flags = moduleFlags(hotel);
    for (const [key, ready] of Object.entries(flags)) {
      acc[key] = (acc[key] ?? 0) + (ready ? 1 : 0);
    }
    return acc;
  }, {});

  const activePipelineRows = hotels
    .filter(hotel => statusKey(hotel.enrichment_status) !== 'complete')
    .slice(0, 20);

  return (
    <main className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Admin</p>
        <h2 className="mt-2 font-serif text-3xl text-[var(--lumina-ink)]">Pipeline state</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
          This route holds enrichment and readiness state that should not appear in the investor or prospect-facing product UI.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{status.replace(/_/g, ' ')}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">{formatNumber(count)}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
        <h3 className="font-serif text-2xl text-[var(--lumina-ink)]">Module readiness</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(readiness).map(([module, count]) => (
            <div key={module} className="rounded-3xl border border-stone-200 bg-[var(--warm-cream)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{module.replace(/([A-Z])/g, ' $1')}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--deep-terracotta)]">{formatNumber(count)}</p>
              <p className="mt-2 text-sm text-stone-600">Hotels with at least one live signal in this layer.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
        <h3 className="font-serif text-2xl text-[var(--lumina-ink)]">Active pipeline rows</h3>
        <div className="mt-5 overflow-hidden rounded-3xl border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-stone-600">
              <tr>
                <th className="px-4 py-3 font-medium">Hotel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reviews</th>
                <th className="px-4 py-3 font-medium">Topics</th>
                <th className="px-4 py-3 font-medium">Competitors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {activePipelineRows.map(hotel => (
                <tr key={hotel.hotel_id}>
                  <td className="px-4 py-3 font-medium text-[var(--lumina-ink)]">{hotel.name}</td>
                  <td className="px-4 py-3 text-stone-600">{statusKey(hotel.enrichment_status)}</td>
                  <td className="px-4 py-3">{formatNumber(hotel.total_reviews_db)}</td>
                  <td className="px-4 py-3">{formatNumber(hotel.topic_mentions_total)}</td>
                  <td className="px-4 py-3">{formatNumber(hotel.competitor_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
