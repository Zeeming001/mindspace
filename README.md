# The Empathy Project

**empathyproject.net** — a psychometric tool that maps conceptual distances between abstract values and ideas across demographic groups.

The core premise: people from different identity groups organize the same abstract concepts into meaningfully different mental clusters. Making those differences visible — without judgment — functions as an empathy-building tool. People you disagree with aren't necessarily thinking wrongly; they're organizing the same concepts differently.

---

## How it works

1. **Survey** — Users rate the similarity of concept pairs on a 1–5 scale (20 pairs per batch). Demographics are collected *after* the first batch to prevent identity priming from biasing associative responses.
2. **Personal map** — After 20+ pairs, a force-directed graph shows the user's concept network. After 40+ pairs, this upgrades to a full 2D MDS map.
3. **Aggregate maps** — Responses are aggregated per demographic group into a distance matrix. Classical MDS extracts 2D coordinates that best preserve inter-concept distances. Maps update hourly via a Supabase Edge Function.
4. **Explore** — Users can compare concept maps across groups (liberal/conservative, religious/secular, etc.).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Routing | react-router-dom v7 |
| Backend / DB | Supabase (PostgreSQL + RLS) |
| Server-side compute | Supabase Edge Functions (Deno) |
| Deployment | Vercel |
| Domain | empathyproject.net (Squarespace DNS) |

---

## Local development

### 1. Clone and install

```bash
git clone <repo-url>
cd mindspace
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase project credentials:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Set up the database

In the Supabase Dashboard → SQL Editor, run:

```
supabase/schema.sql
supabase/add_responses_select_policy.sql
supabase/admin_export.sql
supabase/consolidate_groups_add_clustering.sql
```

### 4. Run the dev server

```bash
npm run dev
```

---

## Deploying the Edge Function

The `compute-mds` Edge Function recomputes MDS positions for all groups hourly.

```bash
supabase functions deploy compute-mds
```

**Required secrets** (set in Supabase Dashboard → Edge Functions → Secrets):

| Secret | Description |
|---|---|
| `SUPABASE_URL` | Your project URL (auto-set by Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (auto-set by Supabase) |
| `COMPUTE_MDS_CRON_SECRET` | Random string you choose — pass as `Authorization: Bearer <secret>` from your cron scheduler |

**Triggering the function** — set up a cron job (pg_cron, GitHub Actions, or any scheduler) to POST to:

```
https://<project>.supabase.co/functions/v1/compute-mds
Authorization: Bearer <COMPUTE_MDS_CRON_SECRET>
```

---

## Architecture notes

### Pair rotation

With 1,953 total pairs and 20 pairs per session, a seeded Fisher-Yates shuffle (using the session index as seed) ensures each session gets a unique ordering. This guarantees approximately uniform pair coverage across respondents without coordination between sessions.

### MDS algorithm

Classical MDS via double-centering + power iteration for top 2 eigenvectors. Stress (Kruskal's stress-1) is computed and displayed on the UI as a layout quality indicator. Stress < 0.10 is good; > 0.20 means the 2D layout is a significant distortion of the underlying distances.

### Minimum respondent threshold

Groups are not shown until they have ≥ 50 completed sessions. At 15 respondents × 20 pairs each, only ~15% of the 1,953-pair matrix is covered; the rest is neutral-imputed (0.5), making the layout mostly noise. 50 respondents yields ~1,000 real ratings — the practical minimum for a meaningful layout.

### Privacy

- No IP addresses or identifying information stored
- Sessions identified only by randomly-generated UUID4 (128-bit random, unguessable)
- Demographic data is voluntary and stored only in aggregate
- Row Level Security enabled on all Supabase tables

---

## Admin

The `/admin` route (not linked from nav) provides CSV data exports for the project owner. Requires an admin token set in the Supabase `settings` table. See `supabase/admin_export.sql` for setup.

---

## Roadmap

- **Comparison view** — side-by-side or overlay of two groups on the Explore page
- **Concept spotlight** — click a concept to highlight its neighborhood and show cross-group position differences
- **Adaptive pair selection** — use per-individual partial matrix to select the next most informative pair rather than random sampling (active matrix completion)
- **Public data release** — anonymized aggregate data publication pending sufficient sample size
