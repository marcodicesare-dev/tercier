/**
 * Database Setup — creates or updates the remote Supabase schema via CLI migrations.
 *
 * This keeps the SQL source of truth in `scripts/phase0-enrichment/supabase-schema.sql`
 * and mirrors it into `supabase/migrations/` so `supabase db push` can apply it.
 *
 * Usage:
 *   tsx scripts/phase0-enrichment/setup-database.ts
 */
import 'dotenv/config';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve } from 'path';

const PROJECT_REF = 'rfxuxkbfpewultpuojpe';
const MIGRATION_NAME = '20260403191000_phase0_schema.sql';

function runSupabase(args: string[]): void {
  execFileSync('npx', ['supabase', ...args], {
    stdio: 'inherit',
    env: { ...process.env, PATH: process.env.PATH },
  });
}

function ensureMigrationFile(schemaPath: string, migrationPath: string): void {
  const migrationDir = resolve(process.cwd(), 'supabase/migrations');

  mkdirSync(migrationDir, { recursive: true });

  if (existsSync(migrationPath)) {
    console.log(`Base migration already present: ${migrationPath}`);
    console.log('Schema updates should be applied through newer migration files in supabase/migrations/.');
    return;
  }

  copyFileSync(schemaPath, migrationPath);
  console.log(`Created migration: ${migrationPath}`);
}

async function main(): Promise<void> {
  const schemaPath = resolve(process.cwd(), 'scripts/phase0-enrichment/supabase-schema.sql');
  const migrationPath = resolve(process.cwd(), 'supabase/migrations', MIGRATION_NAME);

  console.log('Setting up Tercier database in Supabase...\n');

  ensureMigrationFile(schemaPath, migrationPath);

  console.log('\nLinking Supabase project...');
  runSupabase(['link', '--project-ref', PROJECT_REF]);

  console.log('\nPushing remote schema...');
  runSupabase(['db', 'push', '--linked', '--include-all', '--yes']);

  console.log('\nDatabase setup complete.');
  console.log('Next: npx tsx scripts/phase0-enrichment/verify-database.ts');
}

main().catch(err => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Setup failed: ${msg}`);
  process.exit(1);
});
