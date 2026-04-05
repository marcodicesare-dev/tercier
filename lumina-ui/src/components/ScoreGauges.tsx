import { formatDecimal } from '@/lib/utils';

function Gauge({ label, value }: { label: string; value: number | null }) {
  const percent = Math.max(0, Math.min(100, Math.round((value ?? 0) * 100)));
  const background = `conic-gradient(#8B4A2B ${percent}%, #efe4d8 ${percent}% 100%)`;

  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid h-28 w-28 place-items-center rounded-full" style={{ background }}>
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--warm-cream)] text-center">
          <div>
            <div className="text-xl font-semibold text-[var(--lumina-ink)]">{formatDecimal(value, 2)}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">score</div>
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-stone-700">{label}</p>
    </div>
  );
}

export function ScoreGauges({
  hqi,
  tos,
  risk,
  digital,
}: {
  hqi: number | null;
  tos: number | null;
  risk: number | null;
  digital: number | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Gauge label="HQI" value={hqi} />
      <Gauge label="Opportunity" value={tos} />
      <Gauge label="Reputation risk" value={risk} />
      <Gauge label="Digital presence" value={digital} />
    </div>
  );
}
