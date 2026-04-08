'use client';

import type { CSSProperties } from 'react';
import { ModelProvider } from '@/components/financial/model-context';
import { FinancialSidebar } from '@/components/financial/sidebar';
import { AssumptionsPanel } from '@/components/financial/assumptions-panel';

export function FinancialShell({ children }: { children: React.ReactNode }) {
  return (
    <ModelProvider>
      <div
        className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]"
        style={
          {
            '--color-cream': 'var(--lumina-ink)',
            '--color-muted-foreground': 'var(--muted-foreground)',
          } as CSSProperties
        }
      >
        <div className="xl:sticky xl:top-6 xl:self-start">
          <FinancialSidebar />
        </div>
        <main className="min-w-0 pb-24">{children}</main>
        <AssumptionsPanel />
      </div>
    </ModelProvider>
  );
}
