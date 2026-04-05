import { formatDecimal, formatNumber, formatPercent, titleCase } from '@/lib/utils';

export function KeyMetrics({
  metrics,
}: {
  metrics: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(metric => (
        <div key={metric.label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--lumina-ink)]">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

export function buildKeyMetrics(input: {
  responseRate: number | null;
  reviews90d: number | null;
  amenityCount: number | null;
  qnaCount: number | null;
  domainAuthority: number | null;
  priceLevel: string | null;
  cms: string | null;
  bookingTech: string | null;
}) {
  return [
    { label: 'Owner response', value: formatPercent(input.responseRate, 1) },
    { label: 'Reviews 90d', value: formatNumber(input.reviews90d) },
    { label: 'Amenity count', value: formatNumber(input.amenityCount) },
    { label: 'Q&A threads', value: formatNumber(input.qnaCount) },
    { label: 'Domain authority', value: formatNumber(input.domainAuthority) },
    { label: 'Price level', value: input.priceLevel ?? '—' },
    { label: 'CMS', value: titleCase(input.cms) },
    { label: 'Booking tech', value: titleCase(input.bookingTech) },
  ];
}
