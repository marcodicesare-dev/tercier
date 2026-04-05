'use client';

import { Card, CardContent } from '@/components/financial/ui/card';

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  color?: 'default' | 'green' | 'red' | 'gold' | 'terracotta';
}

const colorClasses = {
  default: 'text-[var(--color-cream)]',
  green: 'text-green-400',
  red: 'text-red-400',
  gold: 'text-[var(--color-gold)]',
  terracotta: 'text-[var(--color-terracotta)]',
};

export function MetricCard({ label, value, sublabel, color = 'default' }: MetricCardProps) {
  return (
    <Card className="bg-[var(--card)] border-[var(--border)]">
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
        {sublabel && <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}
