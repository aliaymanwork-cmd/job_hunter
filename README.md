# SOCHUNT — Dubai SOC Job Command Center

A mobile-responsive personal job tracker for SOC Analyst, Incident Response, SIEM, threat detection and cyber defense roles in Dubai/UAE. Built with Next.js, GroqCloud API and Supabase Auth/Postgres; deployable to Vercel.

## Supabase setup (use an existing project)

This project intentionally uses two uniquely named tables, `public.soc_hunt_jobs` and `public.soc_hunt_interviews`. It does not alter the existing health tracker tables `food_logs`, `activity_logs`, `workouts`, `wellness_logs`, or `user_goals`.

1. Open your existing Supabase project.
2. Go to **SQL Editor → New query**.
3. Copy and run the complete `supabase/schema.sql` file in this repository.
4. In **Authentication → URL Configuration**, set your production Site URL to your Vercel domain. Add your local development URL and any preview URLs you use to Redirect URLs as needed.
5. In **Project Settings → API** (or API Keys), copy the Project URL and the publishable/anon key. Do not use a `service_role` or secret key in the browser.

The schema creates only `soc_hunt_jobs` and `soc_hunt_interviews`, indexes and RLS policies. Policies restrict each signed-in user to their own rows. It does not create or modify any of your listed health tables. Run it once; the policy statements are safe to rerun for these SOCHUNT tables.

## Features
- Email/password sign-up and sign-in using Supabase Auth.
- Job pipeline: company, role, source, URL, salary, recruiter/contact, notes, next action, status and date; search/filter/edit/delete.
- Interview tracker with date, stage, format, notes and role-specific AI preparation.
- Groq AI career copilot for mock interviews, incident-response drills, CV/ATS analysis, cover letters, recruiter messages and study plans.
- Cloud persistence across devices after signing in with the same account.
- Responsive desktop/mobile UI.
- Human-reviewed applications; no silent form submission or CAPTCHA bypass.

## Environment variables

Set these locally in `.env.local` and in Vercel → Project → Settings → Environment Variables:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Keep `GROQ_API_KEY` server-side; never expose it in browser code or a `NEXT_PUBLIC_` variable. Create a Groq API key in the GroqCloud console and add it to Vercel Environment Variables. `GROQ_MODEL` defaults to `llama-3.3-70b-versatile`; choose a model currently available to your Groq account if needed. The Supabase publishable/anon key is designed for client use with correctly configured Row Level Security. Never put a Supabase `service_role`/secret key in `NEXT_PUBLIC_` variables.

## Run locally

Requires Node.js 18.17+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel as a Next.js project.
3. Add all four environment variables above for Production (and Preview if needed).
4. Run the SQL migration in the target Supabase project.
5. Deploy/redeploy, open the site, create your account, and start adding jobs/interviews.

## Notes
- This is a personal tracker, not a job-board scraping service or autonomous auto-submitter. Add vacancies manually; Groq AI helps tailor your application materials.
- Confirm email settings in Supabase Auth. If email confirmation is enabled, verify the sign-up email before signing in.
- Do not paste confidential employer/client incident data into the AI copilot.
- Career profile used by Groq AI: around 2 years SOC experience; Rapid7 InsightIDR, Wazuh, Sekoia SIEM; alert triage; phishing/malware investigation; threat hunting; IOC/CVE intelligence; MITRE ATT&CK; detection rules and false-positive tuning; log-source/agent integration; incident reporting; client communication; CEH V12; BSc Computer Science.


## Added features
- Structured Groq AI responses rendered as headings and lists.
- Editable resume builder with print-to-PDF (choose **Save as PDF** in your browser print dialog).
- New Openings page with refresh, source links, and one-click save into the existing `soc_hunt_jobs` pipeline.

### Job openings feed
The refresh endpoint uses Adzuna when `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are configured in Vercel. Without those credentials it falls back to a public job-board feed and filters for relevant roles and UAE/Dubai/remote locations; the fallback may return few or no matching roles. Never treats generated AI suggestions as verified vacancies.

### Deploy
Set `GROQ_API_KEY`, `GROQ_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as before. Optional Adzuna variables broaden the live job search. Redeploy after changing environment variables.
