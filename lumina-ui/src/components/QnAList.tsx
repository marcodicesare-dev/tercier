import { EmptyInsight } from '@/components/EmptyInsight';
import type { HotelQnaRow } from '@/lib/types';

export function QnAList({ questions }: { questions: HotelQnaRow[] }) {
  if (!questions.length) {
    return (
      <EmptyInsight
        title="No Google Q&A captured"
        body="This property does not have useful pre-booking question threads yet, or the extraction has not finished."
      />
    );
  }

  return (
    <div className="space-y-4">
      {questions.slice(0, 8).map(question => (
        <article key={question.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-500">
            <span>{question.question_date ? new Date(question.question_date).toLocaleDateString() : 'Unknown date'}</span>
            {question.has_official_answer ? (
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">Official answer</span>
            ) : null}
            {!question.has_answer ? (
              <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-700">Unanswered</span>
            ) : null}
          </div>
          <h4 className="mt-3 text-base font-semibold text-[var(--lumina-ink)]">{question.question}</h4>
          {question.latest_answer ? (
            <p className="mt-3 text-sm leading-6 text-stone-700">{question.latest_answer}</p>
          ) : (
            <p className="mt-3 text-sm text-stone-500">No answer captured yet.</p>
          )}
        </article>
      ))}
    </div>
  );
}
