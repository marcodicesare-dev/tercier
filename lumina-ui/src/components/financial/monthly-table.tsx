'use client';

import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/financial/ui/scroll-area';
import type { MonthData } from '@/lib/financial-types';

interface Column {
  key: string;
  label: string;
  getValue: (d: MonthData) => number;
  format?: (v: number) => string;
  bold?: boolean;
  section?: string;
}

interface MonthlyTableProps {
  data: MonthData[];
  columns: Column[];
  yearSummary?: boolean;
}

function fmtCHF(v: number): string {
  if (v === 0) return '-';
  const neg = v < 0;
  const abs = Math.abs(Math.round(v));
  const formatted = abs.toLocaleString('en-CH');
  return neg ? `(${formatted})` : formatted;
}

export function MonthlyTable({ data, columns }: MonthlyTableProps) {
  let currentSection = '';

  return (
    <ScrollArea className="w-full">
      <div className="min-w-max">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--color-deep-terracotta)]">
              <th className="sticky left-0 z-10 w-56 min-w-56 bg-[var(--color-deep-terracotta)] px-3 py-2 text-left font-medium text-white">
                Item
              </th>
              {data.map(d => (
                <th key={d.month} className="min-w-20 px-2 py-2 text-right font-medium text-white">
                  M{d.month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((col, ci) => {
              const showSection = col.section && col.section !== currentSection;
              if (col.section) currentSection = col.section;
              const fmt = col.format || fmtCHF;

              return (
                <React.Fragment key={col.key}>
                  {showSection && (
                    <tr className="bg-[var(--color-ink-light)]">
                      <td
                        colSpan={data.length + 1}
                        className="sticky left-0 bg-[var(--color-ink-light)] z-10 px-3 py-1.5 text-[var(--color-gold)] text-[10px] uppercase tracking-wider font-medium"
                      >
                        {col.section}
                      </td>
                    </tr>
                  )}
                  <tr
                    key={col.key}
                    className={`border-b border-[var(--border)] hover:bg-[var(--color-ink-light)] ${col.bold ? 'bg-[var(--color-ink-light)]' : ''}`}
                  >
                    <td className={`sticky left-0 z-10 bg-[var(--card)] px-3 py-1.5 ${col.bold ? 'bg-[var(--color-ink-light)] font-bold text-[var(--lumina-ink)]' : 'text-[var(--color-muted-foreground)]'}`}>
                      {col.label}
                    </td>
                    {data.map(d => {
                      const v = col.getValue(d);
                      return (
                        <td
                          key={d.month}
                          className={`px-2 py-1.5 text-right tabular-nums ${col.bold ? 'font-bold' : ''} ${v < 0 ? 'text-red-600' : v > 0 ? 'text-[var(--lumina-ink)]' : 'text-[var(--color-muted-foreground)]'}`}
                        >
                          {fmt(v)}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
