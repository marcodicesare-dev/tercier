import { cx } from '@/lib/utils';

export function InsightSentence({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cx('max-w-4xl text-base leading-7 text-stone-700 sm:text-lg', className)}>
      {children}
    </p>
  );
}
