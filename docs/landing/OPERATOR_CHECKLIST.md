# Landing site — operator checklist

## Deployed URL

**Live:** https://landing-lac-mu.vercel.app

Set `NEXT_PUBLIC_MARKETING_URL=https://landing-lac-mu.vercel.app` on the **main web** Vercel project (`foreman-phi`) to enable `/welcome` → 301.

## Required env (landing Vercel project)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for OG/sitemap |
| `NEXT_PUBLIC_DEMO_URL` | `https://foreman-phi.vercel.app/demo` |
| `NEXT_PUBLIC_APP_URL` | Main product URL |
| `NEXT_PUBLIC_BOOKING_URL` | Calendly (or similar) — when set, replaces lead form |
| `BACKEND_URL` | Render API for lead proxy |
| `FOREMAN_API_KEY` | Server-side only — lead proxy |
| `NEXT_PUBLIC_PILOT_BADGE` | Optional — company name in badge after approval |
| `NEXT_PUBLIC_ANALYTICS_ID` | Optional — empty slot until operator chooses |

## Backend

1. Apply `backend/supabase/leads.sql` (migration 5)
2. Add landing origin to Render `CORS_ORIGINS` if calling API directly later
3. Redeploy API after leads route merge

## DNS

- Attach custom domain in Vercel landing project (e.g. `foreman.tech`)
- Point `NEXT_PUBLIC_MARKETING_URL` + web project redirect env

## Legal

- Review `/privacy` and `/terms` on landing before paid pilots
- Confirm AU privacy wording with counsel

## Analytics

- No account created — operator picks Plausible/PostHog/etc.

## Blake demo note

Open the live marketing URL on your phone → tap **Watch it run a job** for the scripted demo.
