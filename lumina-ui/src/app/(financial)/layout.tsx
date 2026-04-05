'use client';

import { ModelProvider } from '@/components/financial/model-context';
import { FinancialSidebar } from '@/components/financial/sidebar';
import { AssumptionsPanel } from '@/components/financial/assumptions-panel';

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModelProvider>
      <div className="financial-theme fixed inset-0 flex" style={{
        background: '#1A120B',
        color: '#F5EFE6',
      }}>
        <FinancialSidebar />
        <main className="flex-1 overflow-auto p-6 ml-60">
          {children}
        </main>
        <AssumptionsPanel />
      </div>
    </ModelProvider>
  );
}
