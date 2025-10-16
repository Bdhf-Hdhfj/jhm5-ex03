HKDSE Analyser
================

This project provides a small HKDSE analyser web app (frontend in `public/HKDSE`) and a Cloudflare Worker API that serves statistics from a D1 database. For local development we provide a script to import the provided CSV into a local SQLite file that mimics the D1 schema.

What is included
- `public/HKDSE/` - frontend HTML/JS/CSS. The JS fetches `/api/stats`.
- `src/index.ts` - Cloudflare Worker entry. Exposes `/api/stats` and `/api/raw`. If a D1 binding `HKDSE_DB` is present, it will query the D1 table `hkdsedata`; otherwise it falls back to mock data.
- `migrations/initial.sql` - Create table SQL for `hkdsedata`.
- `migrations/import_data.sql` - Generated INSERT statements after running the import script.
- `scripts/import-csv.js` - Node script to import `public/Data/2024_HKDSE_results_statistics_table3f_tc.csv` into a local SQLite (written to `data/hkdsedata.sqlite`) and to generate `migrations/import_data.sql`.

Quick local setup
-----------------
1. Install dependencies:

```bash
npm install
```

2. Import CSV into a local SQLite (this creates `data/hkdsedata.sqlite` and `migrations/import_data.sql`):

```bash
npm run import:csv
```

3. Run the worker locally (requires Wrangler). Note: to have D1 bindings available to `wrangler dev`, you must be logged in and have created the D1 database in the Cloudflare dashboard. If you don't have a D1 in Cloudflare yet, `wrangler dev` will still run but Worker will fall back to mock data.

```bash
npm run dev
```

Deploy to Cloudflare D1
----------------------
1. Create a D1 database in Cloudflare Dashboard (Workers > D1). Note the database name.

2. Upload migrations to D1 (you can use Wrangler or Cloudflare dashboard). Example using Wrangler (replace `<DB_NAME>`):

```bash
# create a migration (local file) - we've generated migrations/import_data.sql
# then use wrangler d1 commands OR upload via Cloudflare dashboard
wrangler d1 migrations apply --database-name=<DB_NAME> migrations/initial.sql
wrangler d1 migrations apply --database-name=<DB_NAME> migrations/import_data.sql
```

3. Update `wrangler.jsonc` (or `wrangler.toml`) to add a d1 binding. Example in this repo uses `HKDSE_DB` as binding name and `hkdsedata` as database_name. Ensure names match the D1 you created.

4. Deploy the Worker:

```bash
npm run deploy
```

Notes on switching between local sqlite and Cloudflare D1
- This repo ships a small import script that creates `data/hkdsedata.sqlite`. That is only for local development/testing. The Cloudflare Worker uses `env.HKDSE_DB` (D1) when present. No code changes are required to switch environments — just provide the D1 binding when running under Wrangler/Cloudflare.

Testing the API endpoints
- `/api/stats` — returns JSON { data: [...] }
- `/api/raw` — returns JSON { rows: [...] }

If you want me to:
- Add an express-based local mock server that serves the same endpoints using the local sqlite file for faster development without Wrangler.
- Or update Worker to use local sqlite when running `wrangler dev` (less recommended because Wrangler's sandbox differs from production D1 behaviour).

Next steps I can take for you
- Add deployment checklist (Cloudflare Dashboard steps with screenshots)
- Implement an express mock server for local dev
- Harden the Worker endpoints with query parameters (range, category) and add caching headers

If you'd like one of those, tell me which and I'll implement it next.