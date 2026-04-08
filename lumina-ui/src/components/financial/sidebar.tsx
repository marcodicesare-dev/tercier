'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  GitBranch,
  BarChart3,
  TrendingUp,
  MapPin,
  Sunset,
} from 'lucide-react';
import { cn } from '@/lib/shadcn-utils';
import { useModel } from '@/components/financial/model-context';
import { fmtChf, fmtEur } from '@/lib/format';
import { DEFAULT_ASSUMPTIONS } from '@/lib/defaults';

const NAV = [
  { href: '/financial', label: 'Key Metrics', icon: LayoutDashboard },
  { href: '/pnl', label: 'P&L', icon: Receipt },
  { href: '/cashflow', label: 'Cash Flow', icon: Wallet },
  { href: '/scenarios', label: 'Scenarios', icon: GitBranch },
  { href: '/montecarlo', label: 'Monte Carlo', icon: BarChart3 },
  { href: '/valuation', label: 'Valuation & Exit', icon: TrendingUp },
  { href: '/zug-vs-zurich', label: 'Zug vs Zurich', icon: MapPin },
  { href: '/post-exit', label: 'Post-Exit Life', icon: Sunset },
];

export function FinancialSidebar() {
  const pathname = usePathname();
  const { model, assumptions } = useModel();
  const isDirty = JSON.stringify(assumptions) !== JSON.stringify(DEFAULT_ASSUMPTIONS);
  const lastMonth = model.monthly[model.monthly.length - 1];

  return (
    <aside className="rounded-[2rem] border border-stone-200 bg-white/75 shadow-sm backdrop-blur">
      <div className="border-b border-stone-200 px-5 py-5">
        <Link href="/" className="text-[10px] uppercase tracking-[0.24em] text-stone-500 hover:text-[var(--deep-terracotta)]">
          ← Hotel Data Moat
        </Link>
        <h1 className="mt-3 text-lg font-semibold tracking-wider text-[var(--color-terracotta)]">LUMINA</h1>
        <p className="mt-0.5 text-[10px] text-stone-500">Financial Dashboard</p>
        {isDirty && (
          <span className="mt-2 inline-block rounded-full bg-[var(--sidebar-accent)] px-2 py-1 text-[9px] font-medium text-[var(--deep-terracotta)]">
            Modified assumptions
          </span>
        )}
      </div>

      <nav className="space-y-1 px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all duration-150',
                active
                  ? 'border border-stone-200 bg-[var(--sidebar-accent)] font-medium text-[var(--color-terracotta)]'
                  : 'border border-transparent text-[var(--lumina-ink)] hover:border-stone-200 hover:bg-stone-50'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Live mini stats */}
      <div className="space-y-1.5 border-t border-stone-200 px-4 py-4">
        <div className="flex justify-between text-[10px]">
          <span className="text-stone-500">M{lastMonth.month} ARR</span>
          <span className="text-[var(--color-terracotta)] font-mono tabular-nums">{fmtEur(lastMonth.arrEur)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-stone-500">Hotels</span>
          <span className="text-[var(--color-gold)] font-mono tabular-nums">{lastMonth.totalPaying}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-stone-500">Cash</span>
          <span className="font-mono tabular-nums text-emerald-600">{fmtChf(lastMonth.closing)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-stone-500">Breakeven</span>
          <span className="font-mono text-[var(--lumina-ink)]">M{model.breakeven || '—'}</span>
        </div>
      </div>

      <div className="border-t border-stone-200 px-4 py-3 text-[9px] text-stone-500">
        Lumina AG &middot; Zurich
      </div>
    </aside>
  );
}
