export function fmtChf(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `CHF ${(n / 1_000_000).toFixed(1)}M`;
  }
  return `CHF ${Math.round(n).toLocaleString('en-CH')}`;
}

export function fmtChfFull(n: number): string {
  return `CHF ${Math.round(n).toLocaleString('en-CH')}`;
}

export function fmtEur(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `€${(n / 1_000_000).toFixed(1)}M`;
  }
  return `€${Math.round(n).toLocaleString('en-CH')}`;
}

export function fmtEurFull(n: number): string {
  return `€${Math.round(n).toLocaleString('en-CH')}`;
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('en-CH');
}

export function fmtRunway(months: number): string {
  if (months >= 999) return '∞';
  if (months < 0) return '∞'; // profitable
  return `${months.toFixed(1)}mo`;
}
