# Codex Agent: Deploy Lumina UI to Vercel

## What This Does

Makes the existing `tercier` Vercel project build the real Next.js app from `lumina-ui/` when `main` changes. The correct deployment model is **Vercel project Root Directory = `lumina-ui`**, not a repo-root `vercel.json` that shells into a subfolder.

---

## Step 1: Fix the Vercel project settings remotely

The project is already linked to GitHub at `marcodicesare-dev/tercier`. Update the existing Vercel project instead of creating a second one.

Required remote settings:

- Root Directory: `lumina-ui`
- Framework Preset: `Next.js`
- Node.js Version: `22.x`
- Build Command: default
- Install Command: default
- Output Directory: default

If the CLI is authenticated, patch the existing project directly through the Vercel API:

```bash
TOKEN=$(python3 - <<'PY'
import json
from pathlib import Path
p = Path.home() / "Library/Application Support/com.vercel.cli/auth.json"
print(json.loads(p.read_text())["token"])
PY
)

cat >/tmp/vercel-project-patch.json <<'JSON'
{
  "framework": "nextjs",
  "rootDirectory": "lumina-ui",
  "nodeVersion": "22.x",
  "buildCommand": null,
  "installCommand": null,
  "outputDirectory": null,
  "devCommand": null
}
JSON

curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data @/tmp/vercel-project-patch.json \
  "https://api.vercel.com/v9/projects/prj_0qNc2QgHaDrekIrBoaZIusYMftFP?teamId=team_KEY469id51asVJaRb9oKJBLJ"
```

Then sync local settings:

```bash
vercel pull --yes
vercel project inspect tercier
```

Expected output:

- `Root Directory    lumina-ui`
- `Node.js Version   22.x`
- `Framework Preset  Next.js`

## Step 2: Keep config inside `lumina-ui/`

Do **not** keep a repo-root `vercel.json` that assumes the project root is `.`.

Use `lumina-ui/vercel.json` for deployment-specific headers:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

Repo root should not contain a deployment `vercel.json` anymore.

## Step 3: Add environment variables to Vercel

Set these on the existing `tercier` Vercel project for `production`, `preview`, and `development`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

These must stay server-side only. Do **not** prefix them with `NEXT_PUBLIC_`.

If the CLI is linked, you can add them with:

```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_URL preview
vercel env add SUPABASE_URL development

vercel env add SUPABASE_SERVICE_ROLE_KEY production --sensitive
vercel env add SUPABASE_SERVICE_ROLE_KEY preview --sensitive
vercel env add SUPABASE_SERVICE_ROLE_KEY development
```

## Step 4: Keep local-only files out of git

Root `.gitignore` must include:

```gitignore
lumina-ui/.env.local
lumina-ui/.next/
lumina-ui/node_modules/
```

## Step 5: Verify the actual Vercel build

First verify the app itself:

```bash
cd lumina-ui && npm install && npm run build
```

Then verify the real Vercel project settings are honored:

```bash
cd /path/to/repo
vercel build
```

This should detect `Next.js` from `lumina-ui/` and build the app without the old `public/` static-site behavior.

## Step 6: Deploy and verify production

Deploy the existing project:

```bash
cd /path/to/repo
vercel deploy --prod --yes
vercel inspect <deployment-url>
```

Expected verification:

1. Deployment status becomes `Ready`
2. Aliases include `https://tercier.vercel.app`
3. Opening `https://tercier.vercel.app` shows the Lumina portfolio UI, not the old simulator
4. `/hotel/<id>` renders the hotel intelligence card
5. `/compare` renders the comparison view

## What NOT to Do

- Do NOT keep a repo-root `vercel.json` that runs `cd lumina-ui && ...`
- Do NOT leave the Vercel project Root Directory at `.`
- Do NOT keep Node.js set to `24.x` on this project
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` as `NEXT_PUBLIC_*`
- Do NOT commit `lumina-ui/.env.local`, `lumina-ui/node_modules/`, or `lumina-ui/.next/`
