import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelDashboardRow } from '@/lib/types';
import { formatDecimal, formatNumber, formatPercent, titleCase } from '@/lib/utils';

function TechBadge({ value }: { value: string | null | undefined }) {
  return <span className="rounded-full bg-[#efe4d8] px-3 py-1 text-xs font-medium text-[var(--deep-terracotta)]">{titleCase(value)}</span>;
}

export function DigitalPresence({ hotel }: { hotel: HotelDashboardRow }) {
  const techBadges = [
    hotel.dp_website_tech_cms,
    hotel.dp_website_tech_booking,
    hotel.dp_website_tech_analytics,
    hotel.dp_website_primary_language ? `Primary language ${hotel.dp_website_primary_language}` : null,
    hotel.dp_instagram_exists ? `Instagram @${hotel.dp_instagram_handle ?? 'detected'}` : null,
  ].filter(Boolean) as string[];
  const hasSignal =
    techBadges.length > 0 ||
    hotel.dp_has_schema_hotel != null ||
    hotel.dp_schema_completeness != null ||
    hotel.dp_website_content_languages != null ||
    hotel.seo_domain_authority != null ||
    hotel.seo_monthly_traffic_est != null ||
    hotel.seo_organic_keywords != null ||
    hotel.seo_has_google_ads != null ||
    hotel.score_digital_presence != null;

  if (!hasSignal) {
    return (
      <EmptyInsight
        title="Digital presence not captured yet"
        body="The website stack and SEO footprint for this property have not been extracted yet."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Stack & distribution</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {techBadges.length ? techBadges.map(value => <TechBadge key={value} value={value} />) : (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">No stack tags captured</span>
          )}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[var(--warm-cream)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Schema.org</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">{formatPercent(hotel.dp_schema_completeness, 0)}</p>
            <p className="mt-2 text-sm text-stone-600">
              {hotel.dp_has_schema_hotel ? 'Hotel schema detected.' : 'Hotel schema not detected.'}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--warm-cream)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Google Ads</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--deep-terracotta)]">{hotel.seo_has_google_ads ? 'Active' : 'Off'}</p>
            <p className="mt-2 text-sm text-stone-600">
              {hotel.dp_has_active_social ? 'Active social presence captured.' : 'Social activity signal not captured.'}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--warm-cream)] p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Website languages</p>
            <p className="mt-2 text-lg font-semibold text-[var(--deep-terracotta)]">
              {hotel.dp_website_content_languages ?? 'No website language signals'}
            </p>
            <p className="mt-2 text-sm text-stone-600">
              {hotel.dp_website_language_count != null
                ? `${formatNumber(hotel.dp_website_language_count)} language / locale signals detected on the property site.`
                : 'No website language count captured yet.'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">SEO signal</p>
        <dl className="mt-4 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-stone-500">Domain authority</dt>
            <dd className="font-semibold text-[var(--lumina-ink)]">{formatNumber(hotel.seo_domain_authority)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-stone-500">Monthly traffic</dt>
            <dd className="font-semibold text-[var(--lumina-ink)]">{formatNumber(hotel.seo_monthly_traffic_est)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-stone-500">Organic keywords</dt>
            <dd className="font-semibold text-[var(--lumina-ink)]">{formatNumber(hotel.seo_organic_keywords)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-stone-500">Digital score</dt>
            <dd className="font-semibold text-[var(--lumina-ink)]">{formatDecimal(hotel.score_digital_presence, 2)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
