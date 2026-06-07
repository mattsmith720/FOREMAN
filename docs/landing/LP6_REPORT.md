# LP6 — Quality gate report

**URL:** https://landing-lac-mu.vercel.app  
**Deploy:** Vercel project `openland17s-projects/landing`  
**SHA:** pending merge to `main`

## Lighthouse (measured on live URL)

| Category | Score |
|----------|------:|
| Performance | 97 |
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 100 |

## VQ matrix (bootstrapped)

| Surface | Viewports | Geometry | axe serious/critical |
|---------|-----------|----------|----------------------|
| Landing home | 360, 390, 1280 | overflow ✓ | 0 (local spec) |

Full text-zoom 160% sweep: **queued** — add in landing `e2e/landing-quality.spec.ts` Phase 2.

## Truth audit

See `docs/landing/TRUTH_AUDIT.md` — **PASS** (zero fabricated claims).

## CTA path

| Path | Status |
|------|--------|
| `NEXT_PUBLIC_BOOKING_URL` set | Operator — opens external calendar |
| Fallback lead form | `/api/leads` → backend `POST /leads` (needs `BACKEND_URL` + `FOREMAN_API_KEY` on landing Vercel + migration 5) |

## Product proof (LP3)

| Asset | Source |
|-------|--------|
| `hero-demo.webm` | Playwright record of prod `/demo` |
| `feature-*.png` | Screenshots from prod `/demo` + `/dashboard` |

## Blake one-liner

Open **https://landing-lac-mu.vercel.app** on your phone → tap **Watch it run a job**.
