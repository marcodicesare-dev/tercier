# Codex Agent Prompt: Initialize GitHub Repo + Vercel-Ready Static Site

## Context

The repo `marcodicesare-dev/tercier` exists on GitHub and is currently empty. The goal is to initialize it with a static HTML financial simulator and make it deployable on Vercel as a static site.

## Task

1. **Initialize the repo with this structure:**

```
tercier/
├── public/
│   └── index.html      ← copy from tercier-simulator.html
├── package.json
├── .gitignore
└── vercel.json
```

2. **Create `public/index.html`** — copy the entire contents of `tercier-simulator.html` (the file is in this same directory). This is a self-contained HTML file with inline CSS, inline JS, and one external CDN script (Chart.js). No build step needed.

3. **Create `package.json`:**

```json
{
  "name": "tercier-simulator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "npx serve public"
  }
}
```

4. **Create `vercel.json`:**

```json
{
  "buildCommand": null,
  "outputDirectory": "public",
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

5. **Create `.gitignore`:**

```
node_modules/
.vercel
.DS_Store
```

6. **Initialize git, commit, and push:**

```bash
git init
git remote add origin https://github.com/marcodicesare-dev/tercier.git
git add -A
git commit -m "Initial commit: Tercier financial simulator (static HTML)"
git branch -M main
git push -u origin main
```

## Important notes

- The HTML file is completely self-contained — no build step, no npm install, no bundler. It's a static site.
- The only external dependency is Chart.js loaded from CDN (`https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js`).
- Vercel will serve `public/index.html` as the root page automatically with the `outputDirectory` setting.
- Do NOT include any other files from the tercier directory (no business plans, no CSVs, no deck files). Only the simulator HTML goes into the repo.
