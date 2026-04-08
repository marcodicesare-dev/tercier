# Kempinski Worker

This is the non-laptop execution path for the Kempinski enrichment.

## Why this exists

The enrichment chain takes hours and should not depend on a local terminal staying open. The correct runtime is a dedicated worker container on a platform that supports:

- long-running processes
- restart policy `always` or equivalent
- environment secrets
- streaming logs

GitHub Actions is intentionally not the solution here.

## What the worker does

`pnpm run kempinski:supervisor`

The supervisor is Supabase-backed, singleton, and resumable:

- It only enriches Kempinski targets that are not already complete.
- It acquires a lease in Supabase (`worker_leases`), so only one worker instance can act as leader at a time.
- It processes remaining hotels in batches (`KEMPINSKI_BATCH_SIZE`, default `8`).
- After hotel enrichment completes, it runs NLP until no Kempinski reviews remain unprocessed.
- It refreshes `refresh_dashboard_views()` between phases.
- It generates a Kempinski-only contact CSV from Supabase and runs the scoped Fiber contact sweep.
- It writes progress to `output/kempinski-worker/status.json`.
- It stays alive after finishing and idles until new Kempinski work appears, which avoids deploy/restart churn.

Because completion is determined from Supabase state, the worker can be restarted safely on any host at any time.

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `FIBER_API_KEY`
- `FIRECRAWL_API_KEY`
- all other existing enrichment keys already used by `npm run enrich`

## Optional environment variables

- `KEMPINSKI_BATCH_SIZE`
- `KEMPINSKI_MAX_RETRIES`
- `KEMPINSKI_RETRY_DELAY_MS`
- `KEMPINSKI_MONITOR_INTERVAL_MS`
- `KEMPINSKI_IDLE_INTERVAL_MS`
- `KEMPINSKI_SHUTDOWN_GRACE_MS`

## Recommended deployment shape

Run this as a dedicated worker service on Railway, Fly.io, Render, or a small VM/container host.

Requirements:

- single worker instance
- restart on failure
- no autosleep
- persistent logs

`Dockerfile.kempinski-worker` is the container entrypoint for this.

For Railway, the repo ships with `railway.toml` pointing the service at `Dockerfile.kempinski-worker`.

To avoid uploading local workspace clutter, stage a minimal deploy context first:

```bash
npm run kempinski:stage-railway
railway up .deploy/kempinski-worker --path-as-root --service kempinski-worker --detach
```

## Monitoring

- Structured status: `pnpm run kempinski:status`
- Runtime log: `output/kempinski-worker/supervisor.log`
- Final verification: `output/kempinski-worker/final-verification.json`
