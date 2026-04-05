'use client';

import { ModelProvider } from '@/components/financial/model-context';
import { FinancialSidebar } from '@/components/financial/sidebar';
import { AssumptionsPanel } from '@/components/financial/assumptions-panel';

// All CSS variables set inline so they DEFINITELY override the light theme from the data moat
const DARK_THEME: React.CSSProperties & Record<string, string> = {
  '--background': '#1A120B',
  '--foreground': '#F5EFE6',
  '--card': '#302520',
  '--card-foreground': '#F5EFE6',
  '--popover': '#302520',
  '--popover-foreground': '#F5EFE6',
  '--primary': '#C17F59',
  '--primary-foreground': '#1A120B',
  '--secondary': '#8B4A2B',
  '--secondary-foreground': '#F5EFE6',
  '--muted': '#504038',
  '--muted-foreground': '#BEB0A2',
  '--accent': '#C9A96E',
  '--accent-foreground': '#1A120B',
  '--destructive': '#DC2626',
  '--border': '#5A4A40',
  '--input': '#504038',
  '--ring': '#C17F59',
  '--radius': '0.625rem',
  '--sidebar': '#140E08',
  '--sidebar-foreground': '#F5EFE6',
  '--sidebar-primary': '#C17F59',
  '--sidebar-primary-foreground': '#1A120B',
  '--sidebar-accent': '#302520',
  '--sidebar-accent-foreground': '#F5EFE6',
  '--sidebar-border': '#5A4A40',
  '--sidebar-ring': '#C17F59',
  '--color-terracotta': '#C17F59',
  '--color-deep-terracotta': '#8B4A2B',
  '--color-gold': '#C9A96E',
  '--color-ink': '#1A120B',
  '--color-cream': '#F5EFE6',
  '--color-ink-light': '#302520',
  '--color-ink-lighter': '#504038',
  '--color-muted-foreground': '#BEB0A2',
  // Explicit overrides
  background: '#1A120B',
  color: '#F5EFE6',
};

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModelProvider>
      <div className="financial-theme fixed inset-0 flex" style={DARK_THEME as React.CSSProperties}>
        <FinancialSidebar />
        <main className="flex-1 overflow-auto p-6 ml-60">
          {children}
        </main>
        <AssumptionsPanel />
      </div>
    </ModelProvider>
  );
}
