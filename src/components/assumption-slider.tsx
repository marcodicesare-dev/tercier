'use client';

import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface AssumptionSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  suffix?: string;
  prefix?: string;
}

export function AssumptionSlider({
  label, value, onChange, min, max, step = 1,
  format, suffix, prefix
}: AssumptionSliderProps) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(value));

  const displayValue = format ? format(value) : `${prefix || ''}${value.toLocaleString()}${suffix || ''}`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[var(--color-muted-foreground)] leading-tight">{label}</span>
        {editing ? (
          <Input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={() => {
              const n = Number(inputVal);
              if (!isNaN(n) && n >= min && n <= max) onChange(n);
              setEditing(false);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-20 h-5 text-[11px] bg-[var(--color-ink)] border-[var(--color-terracotta)] text-right px-1"
            autoFocus
          />
        ) : (
          <button
            onClick={() => { setInputVal(String(value)); setEditing(true); }}
            className="text-[11px] font-mono text-[var(--color-terracotta)] hover:text-[var(--color-gold)] cursor-pointer tabular-nums"
          >
            {displayValue}
          </button>
        )}
      </div>
      <Slider
        value={[value]}
        onValueChange={v => onChange(Array.isArray(v) ? v[0] : v)}
        min={min}
        max={max}
        step={step}
        className="h-4"
      />
    </div>
  );
}
