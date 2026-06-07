# Landing page — 30-agent parallel swarm

**Target:** `landing/` · **Live:** https://landing-lac-mu.vercel.app  
**Launched:** 2026-06-06 · **Integrator:** LP-A20 (`page.tsx` compose)

## Rules (all agents)

- Brand: paper `#f5f1eb`, ink `#1a1a1e`, orange `#ff6b00` on primary CTAs only
- Not a Pollinate clone · No fake metrics, YC badges, or CER endorsement
- Build must pass · No commit · No deploy

## Agent roster

| ID | Lane | Scope |
|----|------|--------|
| A01 | Mobile nav | `mobile-nav.tsx` + `site-nav.tsx` |
| A02 | How it works | `how-it-works.tsx` |
| A03 | CER band | `cer-band.tsx` + `.lp-cer-*` CSS |
| A04 | Trust strip | `trust-strip.tsx` + `.lp-trust-*` CSS |
| A05 | Scroll progress | `scroll-progress.tsx` |
| A06 | Hero section | `hero-section.tsx` |
| A07 | Pain section | `pain-section.tsx` |
| A08 | Solution section | `solution-section.tsx` |
| A09 | Final CTA | `final-cta.tsx` |
| A10 | Site footer | `site-footer.tsx` |
| A11 | FAQ | `faq.tsx` |
| A12 | Book demo | `book-demo.tsx` |
| A13 | Landing visual | `landing-visual.tsx` |
| A14 | Feature showcase | `feature-showcase.tsx` |
| A15 | Site nav | `site-nav.tsx` (a11y, skip link) |
| A16 | Hero reveal | `hero-reveal.tsx` |
| A17 | Scroll reveal | `scroll-reveal.tsx` |
| A18 | Globals CSS | typography, mobile, focus |
| A19 | SEO | `layout.tsx` + `json-ld.tsx` |
| A20 | **Integrator** | `page.tsx` — wire all section components |
| A21 | Privacy | `privacy/page.tsx` |
| A22 | Terms | `terms/page.tsx` |
| A23 | OG image | `public/og.svg` |
| A24 | Favicon | `public/favicon.svg` |
| A25 | E2E quality | `landing-quality.spec.ts` |
| A26 | E2E a11y | `landing-a11y.spec.ts` (new) |
| A27 | Perf | `next.config.mjs` |
| A28 | Copy variants | `docs/landing/swarm/COPY_VARIANTS.md` |
| A29 | Image brief | `NOTEBOOKLM_IMAGE_BRIEF.md` |
| A30 | Truth audit | `TRUTH_AUDIT.md` |

## Post-swarm (operator)

1. `cd landing && npm run build`
2. `npx playwright test` (if dev server available)
3. Resolve any `globals.css` merge conflicts (A03, A04, A05, A14, A18)
4. `npx vercel --prod` from `landing/`
5. Lighthouse pass on production URL

## Conflict hotspots

- `globals.css` — multiple agents append prefixed blocks; merge manually if needed
- `site-nav.tsx` — A01 and A15 may both touch; prefer A15 integration after A01
- `page.tsx` — A20 runs last conceptually; re-run integrator if section components land late
