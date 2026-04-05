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
import { cn } from '@/lib/utils';
import { useModel } from './model-context';
import { fmtChf, fmtEur } from '@/lib/format';
import { DEFAULT_ASSUMPTIONS } from '@/lib/defaults';

const NAV = [
  { href: '/', label: 'Key Metrics', icon: LayoutDashboard },
  { href: '/pnl', label: 'P&L', icon: Receipt },
  { href: '/cashflow', label: 'Cash Flow', icon: Wallet },
  { href: '/scenarios', label: 'Scenarios', icon: GitBranch },
  { href: '/montecarlo', label: 'Monte Carlo', icon: BarChart3 },
  { href: '/valuation', label: 'Valuation & Exit', icon: TrendingUp },
  { href: '/zug-vs-zurich', label: 'Zug vs Zurich', icon: MapPin },
  { href: '/post-exit', label: 'Post-Exit Life', icon: Sunset },
];

export function Sidebar() {
  const pathname = usePathname();
  const { model, assumptions } = useModel();
  const isDirty = JSON.stringify(assumptions) !== JSON.stringify(DEFAULT_ASSUMPTIONS);
  const lastMonth = model.monthly[model.monthly.length - 1];

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col z-50">
      <div className="p-5 border-b border-[var(--sidebar-border)]">
        <h1 className="text-lg font-bold text-[var(--color-terracotta)] tracking-wider">LUMINA</h1>
        <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">Financial Dashboard</p>
        {isDirty && (
          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-deep-terracotta)] text-[var(--color-gold)]">
            Modified assumptions
          </span>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150',
                active
                  ? 'bg-[var(--sidebar-accent)] text-[var(--color-terracotta)] font-medium border-l-2 border-[var(--color-terracotta)]'
                  : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--color-cream)] border-l-2 border-transparent'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Live mini stats */}
      <div className="px-4 py-3 border-t border-[var(--sidebar-border)] space-y-1.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--color-muted-foreground)]">M{lastMonth.month} ARR</span>
          <span className="text-[var(--color-terracotta)] font-mono tabular-nums">{fmtEur(lastMonth.arrEur)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--color-muted-foreground)]">Hotels</span>
          <span className="text-[var(--color-gold)] font-mono tabular-nums">{lastMonth.totalPaying}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--color-muted-foreground)]">Cash</span>
          <span className="text-green-400 font-mono tabular-nums">{fmtChf(lastMonth.closing)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--color-muted-foreground)]">Breakeven</span>
          <span className="text-[var(--color-cream)] font-mono">M{model.breakeven || '—'}</span>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-[var(--sidebar-border)] text-[9px] text-[var(--color-muted-foreground)]">
        Lumina AG &middot; Baar/Zug
      </div>
    </aside>
  );
}
