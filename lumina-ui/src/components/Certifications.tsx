import type { HotelDashboardRow } from '@/lib/types';

const CERTS = [
  { key: 'cert_gstc', label: 'GSTC', detailKey: 'cert_gstc_body' },
  { key: 'cert_green_key', label: 'Green Key' },
  { key: 'cert_earthcheck', label: 'EarthCheck', detailKey: 'cert_earthcheck_level' },
  { key: 'cert_swisstainable', label: 'Swisstainable', detailKey: 'cert_swisstainable' },
] as const;

export function Certifications({ hotel }: { hotel: HotelDashboardRow }) {
  const certifications = CERTS
    .map(config => {
      const active = Boolean(hotel[config.key]);
      const detail = 'detailKey' in config ? hotel[config.detailKey] : null;
      if (!active && !detail) return null;
      return {
        label: config.label,
        detail: typeof detail === 'string' ? detail : null,
      };
    })
    .filter(Boolean) as Array<{ label: string; detail: string | null }>;

  if (!certifications.length) {
    return <p className="text-sm text-stone-500">No sustainability certifications captured yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {certifications.map(certification => (
        <div key={certification.label} className="rounded-3xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-sm font-semibold text-[var(--lumina-ink)]">{certification.label}</p>
          {certification.detail ? <p className="mt-1 text-xs text-stone-500">{certification.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}
