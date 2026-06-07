# Landing page — truth-in-marketing audit

**Page:** separate marketing site (`landing/`)  
**Live URL:** https://landing-lac-mu.vercel.app  
**Audited:** 2026-06-07 (LP30 swarm pass)  
**Sources:** `landing/app/page.tsx`, wired components, `lib/config.ts`, `lib/site.ts`, `lib/media.ts`

---

## Live page structure (what ships today)

| # | Section | Source | IDs / anchors |
|---|---------|--------|---------------|
| 0 | Pilot announcement strip | `page.tsx` + `ANNOUNCEMENT` env | — |
| 1 | Primary nav | `components/site-nav.tsx` | `#pain`, `#solution`, `#faq` |
| 2 | Hero | `page.tsx` + `HeroReveal`, `LandingVisual`, `BookDemo` | `#book` |
| 3 | Pain grid | `page.tsx` inline `PAIN[]` | `#pain` |
| 4 | Solution / features | `page.tsx` inline `FEATURES[]` + `FeatureShowcase` | `#solution` |
| 5 | FAQ | `components/faq.tsx` | `#faq` |
| 6 | Final CTA | `page.tsx` + `BookDemo` | — |
| 7 | Footer | `page.tsx` | `/privacy`, `/terms`, app link |
| — | SEO / OG | `app/layout.tsx` + `lib/site.ts` | — |

**Not wired on live `page.tsx` (swarm components — copy may diverge):**  
`pain-section.tsx`, `hero-section.tsx`, `solution-section.tsx`, `how-it-works.tsx`, `cer-band.tsx`, `trust-strip.tsx`, `final-cta.tsx`, `site-footer.tsx`, `mobile-nav.tsx`, `scroll-progress.tsx`, `json-ld.tsx`

> Integrator rule: **one source of truth per section.** If A20 wires a section component, delete the inline duplicate in `page.tsx`.

---

## Verdict

**CONDITIONAL PASS** — no fabricated logos, testimonials, investor badges, or invented metrics. Footer CER disclaimer is present. Three copy lines overstate product or third-party process; see **Risk register** below.

---

## Claim audit (live copy only)

### Hero + meta

| Claim | Status | Notes |
|-------|--------|-------|
| "Compliance execution for solar install crews" | **OK** | Positioning, not a capability claim |
| "Voice-guided evidence, live defect coaching, and submission packs" | **VERIFIED** | Demo + install phase in prod |
| Pilot badge (`PILOT_BADGE` env, default: "Built on the roof with real install crews") | **OK** | Generic until operator sets partner name |
| Announcement strip ("Now piloting with Brisbane solar crews") | **PARTIAL** | Configurable via `NEXT_PUBLIC_ANNOUNCEMENT`; operator must confirm before naming city/crews |
| Meta: "Voice-guided CER evidence capture…" | **OK** | Paired with footer non-endorsement |

### Pain section

| Claim | Status | Notes |
|-------|--------|-------|
| "$3,000 rebate" example | **FRAMED** | Typical STC value illustration — not a guarantee |
| "Evidence lives across five phones and a WhatsApp thread" | **OK** | Industry pain framing |
| **"The CER reviews every photo with AI. Unclear shots get rejected."** | **RISK — VERIFY** | Third-party process claim. Soften to "regulators are tightening photo scrutiny" unless operator has a citable CER source |
| "Defects surface weeks later — back on the roof" | **OK** | Outcome framing |

### Solution / features

| Claim | Status | Notes |
|-------|--------|-------|
| "Foreman automates the high-friction parts of every install" | **RISK — SOFTEN** | "Automates" overstates MVP; prefer "handles" or "streamlines" |
| "Every CER-required shot" / six-shot guided capture | **VERIFIED** | `COMPLIANCE_SHOTS` (6) in `web/lib/compliance-pack.ts` |
| "Auto-captures when it's sharp, legible, geotagged and timestamped" | **VERIFIED** | Compliance handler + `stamp-frame.ts` + geo in prod |
| **"No shutter taps, no missed photos"** | **RISK — SOFTEN** | Auto-capture on quality gate ≠ zero misses; worker still aims phone. FAQ says fully hands-free is glasses-future |
| **"hands-free"** (feature headline) | **RISK — SOFTEN** | Phone-first today = voice-guided with phone in hand; reserve "hands-free" for glasses path or qualify as "voice-guided" |
| Real-time defect coaching (labels, serial mismatches, DC runs) | **PARTIAL** | Spoken cues for visible defects verified; "serial mismatches" implies cross-check — model prompts legible serials, **no automated REC registry match** |
| **"branded evidence pack"** | **RISK — FIX** | Pack = stamped JPEGs + manifest ZIP; no operator logo/branding in `evidence-pack.ts`. Use "submission-ready" or "Foreman evidence pack" |
| "serial checks" in pack copy | **RISK — SOFTEN** | Legibility prompts yes; automated serial validation no. Prefer "serial plate capture" |
| "One-tap" / forward manifest | **VERIFIED** | ZIP download on End job; manifest JSON fallback |
| Crew dashboard — jobs, packs, defects per installer | **VERIFIED** | `/dashboard` behind ops auth |

### FAQ

| Claim | Status | Notes |
|-------|--------|-------|
| Phone-first, glasses coming | **VERIFIED** | Aligns with roadmap |
| Consent-first recording | **VERIFIED** | Consent gate in web client |
| "Encrypted in transit and stored in access-controlled systems" | **PARTIAL** | HTTPS + Supabase access control; legal review before paid pilots (see `OPERATOR_CHECKLIST.md`) |
| Per-installer seats, pilot pricing on call | **VERIFIED** | No list price on page |
| **"Most pilots start… expand once packs are passing first time"** | **RISK — SOFTEN** | Anecdotal outcome; no published data — qualify as "typical pilot path" or remove |

### Footer + legal

| Claim | Status | Notes |
|-------|--------|-------|
| "Built around the CER's photo-evidence requirements — not a regulator endorsement" | **VERIFIED** | Required disclaimer — keep on every layout variant |
| Privacy / terms encryption & crew responsibility | **PARTIAL** | Consistent with FAQ; counsel review queued |

### Correctly absent (do not add without evidence)

- YC / investor badges  
- Customer logos or "trusted by" strips  
- Testimonials or named quotes  
- Accuracy %, latency ms, fleet counts, or "100% pass rate"  
- "CER approved" / government endorsement  

---

## Risk register (priority fixes)

| Priority | Location | Claim | Risk | Recommended copy |
|----------|----------|-------|------|------------------|
| **P1** | Pain card 3 | CER reviews every photo with AI | Unverified third-party fact; regulatory misrepresentation if wrong | "Regulators are rejecting more photos for clarity and completeness." |
| **P1** | Feature: packs | "branded evidence pack" | Product does not apply customer branding | "submission-ready evidence pack" |
| **P2** | Feature: evidence | "No shutter taps, no missed photos" | Absolute guarantee | "Voice prompts and auto-capture when the shot is ready" |
| **P2** | Feature: evidence headline | "hands-free" | Phone still held; FAQ contradicts | "voice-guided" or "guided while you work" |
| **P2** | Feature: packs | "serial checks" | Implies automated REC validation | "serial plate capture" or "serial legibility checks" |
| **P3** | Solution lede | "automates" | Overstates automation | "handles" / "streamlines" |
| **P3** | FAQ: get started | "packs passing first time" | Unmeasured outcome | "once the crew is comfortable with the workflow" |
| **P3** | Announcement | "Brisbane solar crews" | Operator-gated naming | Set `NEXT_PUBLIC_ANNOUNCEMENT` only after partner approval |

---

## Swarm change checklist (LP30)

Use before merge / deploy. Agent **A30** owns this file; **A20** (integrator) signs off.

### Copy & truth

- [ ] Every new headline/body in section components matches a row in **Claim audit** above (add row if new)
- [ ] No P1–P2 risks introduced; run **Risk register** grep on diff
- [ ] Pain card 3 does not assert CER AI review unless operator adds footnote + source
- [ ] "hands-free", "automates", "branded", "serial checks", "no missed photos" — banned or qualified per register
- [ ] Footer fine print retained: `not a regulator endorsement`
- [ ] `PILOT_BADGE` / `ANNOUNCEMENT` env strings reviewed by operator before prod

### Structure & integration

- [ ] `page.tsx` uses section components **or** inline arrays — not both for the same section
- [ ] If wiring `pain-section.tsx`, delete inline `PAIN` in `page.tsx` (copy currently differs slightly)
- [ ] Nav anchors (`#pain`, `#solution`, `#faq`, `#book`) still resolve after section moves
- [ ] `media.ts` alt text stays descriptive, not promotional (no "CER approved" in alts)
- [ ] Dormant components (`cer-band`, `trust-strip`, `how-it-works`) — if enabled, audit their copy in this doc first

### Assets & proof

- [ ] Hero / feature visuals are infographics or prod screenshots — not mock UI with fake data
- [ ] `hero-demo.webm` and PNGs trace to prod `/demo` or `/dashboard` (see `LP6_REPORT.md`)
- [ ] Notebook LM swaps (`NOTEBOOKLM_IMAGE_BRIEF.md`) — no CER/gov logos in exports

### Legal & CTAs

- [ ] FAQ security/consent language unchanged without privacy page sync
- [ ] `BOOKING_URL` vs lead form behavior unchanged (`book-demo.tsx`)
- [ ] `/privacy` and `/terms` linked from footer on all page variants

### QA gate

- [ ] `cd landing && npm run build` passes
- [ ] `npx playwright test` — section headings + axe (see `landing-quality.spec.ts`)
- [ ] Re-run Lighthouse on live URL after deploy
- [ ] Update **Verdict** date and any changed rows in this file

---

## Evidence pointers (product)

| Capability | Code / doc |
|------------|------------|
| 6-shot CER guided capture | `web/lib/compliance-pack.ts` |
| Auto-capture + geo stamp | `web/lib/compliance-evidence-handler.ts`, `web/lib/stamp-frame.ts` |
| Evidence ZIP + manifest | `backend/src/evidence-pack.ts`, `PILOT_HANDOFF.md` |
| Spoken defect cues | Demo + live install phase, `shared/src/coaching.ts` |
| Crew dashboard | `web/app/dashboard` (ops auth) |
| Trust baseline (no fake eval claims) | `docs/swarm/TRUST_AUDIT.md` |

---

## History

| Date | Result | Notes |
|------|--------|-------|
| 2026-06-07 (early) | PASS | Initial table — zero fabricated social proof |
| 2026-06-07 (LP30) | **CONDITIONAL PASS** | Full structure map, risk register, swarm checklist; 3 P1/P2 copy fixes recommended |
