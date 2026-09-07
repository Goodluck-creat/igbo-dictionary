# Ọkọwa Okwu — Igbo Dictionary

A simple web app for searching Igbo words. Type a word and see its headword,
part of speech, English definitions, example sentences, and dialect variants,
pulled live from [IgboAPI](https://igboapi.com).

Built with Next.js (App Router) so it deploys straight to Vercel. The IgboAPI
key stays server-side in an API route — it's never exposed to the browser.

## 1. Get an IgboAPI key

1. Go to https://igboapi.com and create a free account.
2. Generate an API token from your dashboard.
3. Keep it handy for step 3 below.

## 2. Run it locally (optional)

```bash
npm install
cp .env.local.example .env.local
# then paste your key into .env.local:
#   IGBO_API_KEY=your_key_here
npm run dev
```

Open http://localhost:3000 and search a word (e.g. `mma`, `biko`, `water`).

## 3. Deploy to Vercel

**Easiest path — Vercel CLI:**

```bash
npm install -g vercel
vercel login
vercel        # first deploy, follow the prompts
vercel env add IGBO_API_KEY production   # paste your key when prompted
vercel --prod
```

**Or via GitHub + the Vercel dashboard:**

1. Push this folder to a new GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Igbo dictionary app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new and import that repo. Vercel auto-detects
   Next.js, so you don't need to change any build settings.
3. Before the first deploy finishes (or right after, then redeploy), go to
   **Project Settings → Environment Variables** and add:
   - `IGBO_API_KEY` = your IgboAPI token
4. Deploy. Your dictionary is now live at the `*.vercel.app` URL Vercel gives you.

## How it's built

- `app/page.js` — the search UI (client component).
- `app/api/search/route.js` — a server route that calls
  `GET https://igboapi.com/api/v2/words?keyword=...&dialects=true&examples=true`
  with the `X-API-Key` header, so the key never reaches the browser.
- `app/globals.css` / `app/page.module.css` — styling.

## Extending it later

The IgboAPI also returns related-word IDs, Nsịbịdị script, and has separate
endpoints for examples, speech-to-text, and machine translation, if you want
to grow this beyond a basic dictionary. See https://docs.igboapi.com.
