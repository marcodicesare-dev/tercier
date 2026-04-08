export function EmptyInsight({
  title,
  body,
  detail,
}: {
  title: string;
  body: string;
  detail?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50/80 p-5">
      <p className="text-sm font-semibold text-[var(--lumina-ink)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
      {detail ? <p className="mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">{detail}</p> : null}
    </div>
  );
}
