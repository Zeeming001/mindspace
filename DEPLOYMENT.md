# Mindspace — Deployment Guide

This guide walks you through taking the codebase from your computer to a live
public URL. Estimated time: 30–45 minutes.

You'll need to create accounts on three services — all free at the scale needed
for a prototype. No credit card is required for any of them.

---

## Step 1: GitHub — push the code

You already have a GitHub account. Create a new repository:

1. Go to https://github.com/new
2. Repository name: `mindspace`
3. Visibility: **Private** (you can make it public later)
4. Do NOT initialize with README, .gitignore, or license (we have these already)
5. Click **Create repository**

GitHub will show you a page with commands. Copy your repository URL — it will
look like: `https://github.com/YOUR_USERNAME/mindspace.git`

Then, open a terminal in the `mindspace` folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mindspace.git
git push -u origin main
```

If prompted for a password, use a **Personal Access Token** (not your GitHub
password). Create one at: https://github.com/settings/tokens/new
- Expiration: 90 days
- Scope: check **repo**

---

## Step 2: Supabase — set up the database

1. Go to https://supabase.com and click **Start your project**
2. Sign up with GitHub (easiest — uses your existing account)
3. Click **New project**
   - Organization: your personal org
   - Name: `mindspace`
   - Database password: generate a strong one and save it somewhere safe
   - Region: choose the one closest to you (e.g. US East for East Coast)
4. Click **Create new project** — takes about 2 minutes to provision

### Run the database schema

5. In the Supabase sidebar, go to **SQL Editor**
6. Click **New query**
7. Open the file `supabase/schema.sql` from this project
8. Paste the entire contents into the SQL editor
9. Click **Run** (or Ctrl+Enter)

You should see a success message. Verify it worked:
```sql
SELECT get_next_session_index();   -- should return 0
SELECT * FROM settings;            -- should show one row: session_counter = 1
```

### Copy your API credentials

10. Go to **Project Settings** (gear icon, bottom of sidebar) → **API**
11. Copy two values:
    - **Project URL** (looks like `https://abcdefgh.supabase.co`)
    - **anon public key** (a long JWT string)

---

## Step 3: Add environment variables to the project

In the `mindspace` folder, create a file called `.env.local` (note: this is
gitignored and will NOT be pushed to GitHub):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the placeholder values with your actual Supabase credentials from Step 2.

---

## Step 4: Deploy the Edge Function

The Edge Function computes the MDS maps on a schedule. To deploy it:

1. Install the Supabase CLI: https://supabase.com/docs/guides/cli/getting-started
   ```bash
   npm install -g supabase
   ```
2. Log in:
   ```bash
   supabase login
   ```
3. Link to your project (get your project ref from Supabase Dashboard → Settings → General):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
4. Deploy the function:
   ```bash
   supabase functions deploy compute-mds
   ```

### Schedule the function to run hourly

In the Supabase Dashboard:
1. Go to **Database** → **Extensions**
2. Enable **pg_cron**
3. Go to **SQL Editor** and run:

```sql
SELECT cron.schedule(
  'compute-mds-hourly',
  '0 * * * *',   -- every hour on the hour
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/compute-mds',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
```

Alternatively, trigger the function manually anytime from:
Supabase Dashboard → Edge Functions → compute-mds → **Invoke**

---

## Step 5: Vercel — deploy the frontend

1. Go to https://vercel.com and click **Sign Up**
2. Sign up with GitHub
3. Click **Add New → Project**
4. Find your `mindspace` repository and click **Import**
5. Framework preset: Vite (should auto-detect)
6. Add environment variables:
   - Click **Environment Variables**
   - Add `VITE_SUPABASE_URL` → your Supabase project URL
   - Add `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
7. Click **Deploy**

Vercel will build and deploy the app. After 1–2 minutes you'll get a live URL
like `https://mindspace-abc123.vercel.app`.

From now on, every `git push` to the `main` branch will automatically redeploy.

---

## Step 6: Verify everything works

1. Visit your Vercel URL
2. Click **Survey** and complete a few questions (you don't have to finish)
3. In Supabase SQL Editor, run:
   ```sql
   SELECT COUNT(*) FROM responses;  -- should be > 0
   SELECT * FROM sessions;          -- should show your session
   ```
4. Trigger the Edge Function manually (Supabase → Edge Functions → compute-mds → Invoke)
5. Visit **Explore** — if you completed the survey and triggered the function, you
   should see the "All respondents" map (you need 15 responses minimum)

---

## Optional: Custom domain

In Vercel → your project → **Settings** → **Domains**, you can add a custom
domain (e.g. `mindspace.yourdomain.com`) if you own one.

---

## Summary of accounts needed

| Service    | URL                   | Cost       | What it does              |
|------------|-----------------------|------------|---------------------------|
| GitHub     | github.com            | Free       | Stores the code           |
| Supabase   | supabase.com          | Free tier  | Database + Edge Functions |
| Vercel     | vercel.com            | Free tier  | Hosts the frontend        |

The free tiers of all three services are sufficient for a prototype with
thousands of respondents.

---

*Questions? Open a new Cowork session and share this file.*
