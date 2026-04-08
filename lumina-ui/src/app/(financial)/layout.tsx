'use client';

import { useEffect, useState } from 'react';
import { FinancialShell } from '@/components/financial/financial-shell';

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-[2rem] border border-stone-200 bg-white/80 p-8 text-sm text-stone-600 shadow-sm">
        Loading financial workspace…
      </div>
    );
  }

  return <FinancialShell>{children}</FinancialShell>;
}
