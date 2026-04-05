export class ProgressLogger {
  private startTime: number;
  private lastLogTime: number;
  private logIntervalMs: number;

  constructor(
    private label: string,
    private total: number,
    logIntervalSec: number = 10,
  ) {
    this.startTime = Date.now();
    this.lastLogTime = 0;
    this.logIntervalMs = logIntervalSec * 1000;
  }

  log(processed: number, extra?: Record<string, unknown>): void {
    const now = Date.now();
    if (now - this.lastLogTime < this.logIntervalMs && processed < this.total) return;
    this.lastLogTime = now;

    const elapsed = (now - this.startTime) / 1000;
    const rate = processed / elapsed;
    const remaining = this.total - processed;
    const eta = rate > 0 ? remaining / rate : Infinity;
    const pct = ((processed / this.total) * 100).toFixed(1);

    const parts = [
      `[${this.label}]`,
      `${processed}/${this.total} (${pct}%)`,
      `${rate.toFixed(1)}/sec`,
      `ETA: ${formatDuration(eta)}`,
    ];

    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        parts.push(`${k}=${v}`);
      }
    }

    console.log(parts.join(' | '));
  }

  done(extra?: Record<string, unknown>): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const parts = [
      `[${this.label}] DONE`,
      `${this.total} hotels`,
      `${formatDuration(elapsed)}`,
    ];
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        parts.push(`${k}=${v}`);
      }
    }
    console.log(parts.join(' | '));
  }
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '?';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h${m}m`;
  if (m > 0) return `${m}m${s}s`;
  return `${s}s`;
}
