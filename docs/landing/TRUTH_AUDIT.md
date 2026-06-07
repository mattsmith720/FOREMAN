# Landing page — truth-in-marketing audit

**Page:** separate marketing site (`landing/`)  
**Live URL:** https://landing-lac-mu.vercel.app  
**Audited:** 2026-06-07 (LP31 pass)  
**Sources:** `landing/app/page.tsx`, section components, `lib/pricing.ts`, `lib/faq-content.ts`

---

## Live page structure

| # | Section | Source | IDs / anchors |
|---|---------|--------|---------------|
| 1 | Primary nav | `components/site-nav.tsx` + `mobile-nav.tsx` | `#pipeline`, `#capabilities`, `/pricing`, `#faq` |
| 2 | Hero | `components/hero-section.tsx` | `#book` |
| 3 | Pipeline | `components/pipeline-section.tsx` | `#pipeline` |
| 4 | Capabilities | `components/capabilities-section.tsx` | `#capabilities` |
| 5 | Pricing teaser | `components/pricing-teaser.tsx` | `/pricing` |
| 6 | FAQ | `components/faq.tsx` | `#faq` |
| 7 | Final CTA | `app/page.tsx` | — |
| 8 | Footer | `components/landing-footer.tsx` | `/privacy`, `/terms` |
| 9 | Pricing page | `app/pricing/page.tsx` | hybrid model, calculator, tiers |
| — | SEO / OG | `app/layout.tsx`, `json-ld.tsx`, `lib/site.ts` | — |

**Dormant (not on live home — do not cite as shipped):**  
`pain-section.tsx`, `solution-section.tsx`, `how-it-works.tsx`, `cer-band.tsx`, `trust-strip.tsx`, `site-footer.tsx`, install-era CER copy in old e2e remnants.

---

## Verdict

**CONDITIONAL PASS** — no fabricated logos, testimonials, investor badges, or invented metrics. Pricing on `/pricing` is **illustrative** until pilot contracts are signed (`PRICING_DISCLAIMER`). Legal pages are pilot summaries pending counsel review.

---

## Claim audit (live copy)

### Hero + meta

| Claim | Status | Notes |
|-------|--------|-------|
| "AI coaching for solar maintenance crews" | **OK** | Positioning |
| "Coaching and training from maintenance jobs" | **OK** | Describes product scope |
| Live coaching example cue | **OK** | Illustrative, not a guarantee of specific output |
| Phone during visit, summary + module | **VERIFIED** | Web client prod flow |
| Meta description in `site.ts` | **OK** | Matches hero lede |

### Pipeline

| Claim | Status | Notes |
|-------|--------|-------|
| Record visit with consent | **VERIFIED** | Consent gate in web client |
| Coach on site / technique gaps | **PARTIAL** | Vision coaching verified; depth varies by job type |
| Build dataset / export | **PARTIAL** | Export on Field tier; Pilot has limits |
| Auto-generated onboarding steps | **PARTIAL** | Training module API exists; quality varies by footage |

### Capabilities

| Claim | Status | Notes |
|-------|--------|-------|
| Spoken cues one at a time | **VERIFIED** | `pickSpokenCue` / coaching schema |
| Private job library + export | **VERIFIED** | Supabase storage; export on Field+ |
| Maintenance job types listed | **VERIFIED** | Shared job phases in prod |
| Training module from visit | **PARTIAL** | Generated at job end; operator should review before crew use |

### Pricing (`/pricing`)

| Claim | Status | Notes |
|-------|--------|-------|
| Seat fees ($99 / $149 / $127) | **PARTIAL** | Illustrative — not billing-backed yet |
| Hybrid usage rates (jobs, frames, min, modules) | **PARTIAL** | Published model; no live metered billing in prod |
| Meta Gen 2 ~AU$599 / US$379 reference | **OK** | Sourced from Meta retail; AU figure approximate |
| Glasses lease $29 / $42 per seat per month | **PARTIAL** | Fleet quote model; not automated checkout |
| Hands-free bundles ($178 / $156) | **PARTIAL** | Arithmetic from published seat + lease rates |
| Calculator estimates | **OK** | Marked illustrative; adjusts on demo call |

### FAQ

| Claim | Status | Notes |
|-------|--------|-------|
| Phone sufficient for Pilot | **VERIFIED** | Phone-first prod path |
| Glasses optional / BYOD / lease | **OK** | Roadmap-aligned |
| Hybrid billing description | **PARTIAL** | Matches pricing page; not live invoicing |
| Consent-first recording | **VERIFIED** | Web client |
| Encrypted in transit, access-controlled storage | **PARTIAL** | HTTPS + Supabase; legal review before paid pilots |
| Pilot: 2–3 techs, no long-term contract | **OK** | Sales framing; confirm per agreement |

### Footer + legal

| Claim | Status | Notes |
|-------|--------|-------|
| Privacy / terms pilot summaries | **PARTIAL** | Operator note on pages — counsel review required |
| No regulator / CER endorsement | **OK** | Not claimed on maintenance landing |

### Correctly absent (do not add without evidence)

- YC / investor badges  
- Customer logos or "trusted by" strips  
- Testimonials or named quotes  
- Accuracy %, latency ms, fleet counts, or pass-rate guarantees  
- "CER approved" / government endorsement  
- Live payment / self-serve checkout

---

## Risk register

| Priority | Location | Claim | Risk | Recommended copy |
|----------|----------|-------|------|------------------|
| **P1** | Pricing tiers | Dollar amounts | Illustrative until contracts | Keep `PRICING_DISCLAIMER` visible |
| **P2** | Pipeline / capabilities | "Auto-generated" modules | Quality varies | Terms already require operator review |
| **P2** | FAQ security | Encryption wording | Legal review pending | Keep operator note on privacy page |
| **P3** | Hero coach example | Specific cue text | Example only | Already framed as example |

---

## LP31 swarm checklist

### Copy & truth

- [x] Headlines match maintenance pivot (not install/CER)
- [x] No "hands-free" without glasses qualification on home
- [x] Pricing marked illustrative in disclaimer
- [x] FAQ synced with `lib/faq-content.ts` and JSON-LD

### Structure & integration

- [x] `page.tsx` uses section components (hero, pipeline, capabilities, FAQ)
- [x] Nav anchors resolve: `#pipeline`, `#capabilities`, `#faq`, `/pricing`
- [x] Mobile nav mounted in `site-nav.tsx`
- [x] Shared `LandingFooter` on home, pricing, privacy, terms

### QA gate

- [x] `cd landing && npm run build` passes
- [ ] `npx playwright test` — run at integrator gate
- [ ] Re-run Lighthouse on live URL after deploy
- [x] Verdict date updated

---

## Evidence pointers (product)

| Capability | Code / doc |
|------------|------------|
| Consent + job capture | `web/components/camera-coach.tsx` |
| Maintenance job types | `shared/src/job-phases.ts` |
| Coaching cues | `shared/src/coaching.ts` |
| Training module API | `backend/src/training-module.ts` |
| Dataset export | `backend/scripts/export-training-data.ts` |
| Pricing model (marketing) | `landing/lib/pricing.ts` |

---

## History

| Date | Result | Notes |
|------|--------|-------|
| 2026-06-07 (LP30) | CONDITIONAL PASS | Install/CER landing — superseded |
| 2026-06-07 (LP31) | **CONDITIONAL PASS** | Maintenance landing + hybrid pricing audit |
