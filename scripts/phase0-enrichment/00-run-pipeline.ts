/**
 * Phase 0 Pipeline Orchestrator
 *
 * Runs all 6 enrichment steps sequentially.
 * Supports resuming from a specific step.
 *
 * Usage:
 *   tsx scripts/phase0-enrichment/00-run-pipeline.ts [startStep] [--limit N]
 *
 * Examples:
 *   tsx scripts/phase0-enrichment/00-run-pipeline.ts           # Run all steps
 *   tsx scripts/phase0-enrichment/00-run-pipeline.ts 3          # Resume from step 3
 *   tsx scripts/phase0-enrichment/00-run-pipeline.ts --limit 10 # Test with 10 hotels
 */
import 'dotenv/config';

interface PipelineStep {
  name: string;
  module: string;
}

const STEPS: PipelineStep[] = [
  { name: 'Match TripAdvisor',       module: './01-match-tripadvisor.js' },
  { name: 'Enrich TripAdvisor',      module: './02-enrich-tripadvisor.js' },
  { name: 'Match Google Places',     module: './03-match-google-places.js' },
  { name: 'Enrich Google Places',    module: './04-enrich-google-places.js' },
  { name: 'Compute Derived Fields',  module: './05-compute-derived-fields.js' },
  { name: 'Export Intelligence CSV',  module: './06-export-intelligence.js' },
];

async function main(): Promise<void> {
  // Parse start step from args (positional, first non-flag arg)
  const args = process.argv.slice(2);
  let startFrom = 1;
  for (const arg of args) {
    const num = parseInt(arg, 10);
    if (!isNaN(num) && num >= 1 && num <= 6) {
      startFrom = num;
      break;
    }
  }

  const now = new Date().toISOString();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  TERCIER PHASE 0 — Swiss Hotel Intelligence Pipeline`);
  console.log(`  ${now}`);
  console.log(`  Starting from step ${startFrom} of ${STEPS.length}`);
  console.log(`${'='.repeat(60)}`);

  const pipelineStart = Date.now();

  for (let i = startFrom - 1; i < STEPS.length; i++) {
    const step = STEPS[i];
    const stepNum = i + 1;

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`>>> Step ${stepNum}/${STEPS.length}: ${step.name}`);
    console.log(`${'─'.repeat(50)}`);

    const stepStart = Date.now();

    try {
      const mod = await import(step.module);
      await mod.default();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n!!! Step ${stepNum} FAILED: ${msg}`);
      console.error(`!!! To resume, run: npm run phase0 -- ${stepNum}`);
      process.exit(1);
    }

    const stepDuration = ((Date.now() - stepStart) / 1000).toFixed(0);
    console.log(`\n<<< Step ${stepNum}: ${step.name} — COMPLETE (${stepDuration}s)`);
  }

  const totalDuration = ((Date.now() - pipelineStart) / 1000).toFixed(0);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  PIPELINE COMPLETE — ${totalDuration}s total`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(err => {
  console.error('PIPELINE FATAL ERROR:', err);
  process.exit(1);
});
