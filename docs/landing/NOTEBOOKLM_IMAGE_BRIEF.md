# Foreman landing — Notebook LM infographic brief

Give Notebook LM this whole file as source context, then run **one prompt per image** below. Export each asset as **PNG** (or GIF for hero only). Drop finished files into `landing/public/assets/infographics/` using the **exact filenames** listed. The site hot-swaps when files land — no code change needed.

**Before you start:** read [Global negative prompts](#global-negative-prompts-do-not-include) and complete the [Aspect ratio export checklist](#aspect-ratio-export-checklist) for every file.

---

## Product context (for Notebook LM)

**Foreman** is an AI compliance and coaching layer for **Australian solar install crews**. It runs on the **phone already in the installer’s pocket** (smart glasses later). It is **not** CER-approved or regulator-endorsed — it helps crews meet the **CER’s photo-evidence requirements** for STC claims.

**What it actually does today (only illustrate these):**

1. **Voice-guided evidence capture** — prompts six CER-required shots per install (meter box, switchboard, serial plate, battery label, etc.), auto-captures when sharp, geotagged, timestamped.
2. **Real-time defect coaching** — one spoken line when something would fail inspection (e.g. missing shutdown label, exposed DC, illegible serial).
3. **Evidence pack at job end** — ZIP with stamped photos + manifest; optional PDF report.
4. **Crew dashboard** — jobs today, packs ready, defects caught (buyer/lead view, password-gated).

**Pilot:** Brisbane solar crews. **Company:** Unicity product. **Audience:** install crew leads, solar retailers, compliance-minded owners.

**Truth rules for all visuals:**

- Do **not** show “YC backed”, fake customer logos, star ratings, or invented metrics.
- Do **not** imply CER certification or government endorsement.
- Diagrams and infographics are fine; **do not** fake a polished SaaS dashboard we haven’t built.
- Australian English spelling (colour, metre, organisation).
- Workers on roofs should look like real tradies (hi-vis, gloves), not stock-office people.

---

## Brand palette (use on every image)

| Role | Hex | Use |
|------|-----|-----|
| Background | `#f5f1eb` | Warm paper — primary canvas |
| Ink | `#1a1a1e` | Headlines, icons, structure |
| Muted | `#5c5c66` | Supporting labels |
| Accent | `#ff6b00` | **Sparingly** — one CTA arrow, one highlight, Foreman wordmark dot |
| Pain / reject | `#b91c1c` | ❌ marks in pain section only |

**Style:** Editorial infographic — flat vectors, thin line icons, generous whitespace. **Not** purple gradients, not glassmorphism, not generic “AI brain” clipart. Think **solar industry report** meets **modern startup deck**, not a clone of another SaaS landing page.

**Typography in images:** Use clean sans labels (similar to Source Sans 3). If you add “Foreman” wordmark, set in bold caps or title case once per hero asset only.

---

## Global negative prompts (do not include)

Paste this block into **every** Notebook LM session (or append to each prompt). These are hard rejects — if any appear, regenerate.

```
NEGATIVE — do not include any of the following:

COLOUR / STYLE
- Purple, violet, indigo, or magenta gradients (especially Pollinate Energy / Pollinate-style purple #6B46C1, #7C3AED, lavender UI chrome)
- Blue-to-purple “AI SaaS” gradient backgrounds
- Glassmorphism, frosted panels, neon glow, dark mode UI
- Generic “AI brain”, robot head, sparkles, or ChatGPT-style logos
- Stock-photo realism, 3D renders, or glossy app mockups

FAKE PRODUCT UI
- Pixel-perfect mobile app screenshots, browser chrome, status bars, notch, or address bars
- Figma-style dashboard clones with sidebar nav, avatar menus, notification bells, or settings gear
- Dense analytics dashboards: line charts with fake revenue, pie charts, world maps, KPI tiles with ↑12%
- Login screens, onboarding wizards, or “Welcome back, Sarah” headers
- For feature-dashboard.png: no datatable grids, no real-looking product UI — schematic blocks only

TRUST / LEGAL
- CER, Clean Energy Regulator, Australian Government, or coat-of-arms logos
- “Official”, “Certified”, “Approved by CER”, or government endorsement badges
- YC, Techstars, or investor logos; fake customer logos; star ratings; “10,000+ installs”

CONTENT
- Non-Australian contexts (US-style houses, Fahrenheit, USD)
- Office workers in suits on roofs; models without PPE
- Drama faces, crying, or exaggerated emoji reactions
- Watermarks, stock photo credits, or Notebook LM branding
```

---

## Aspect ratio export checklist

The landing layout crops to fixed ratios via CSS. **Wrong ratios get letterboxed or clipped.** Export at these exact dimensions (or same ratio at 2× for retina).

| # | Filename | Slot | Aspect ratio | Export size (min) | Retina (optional) | Format |
|---|----------|------|--------------|-------------------|-------------------|--------|
| 1 | `hero-job-flow.png` | Hero, right column | **16∶10** | **1600 × 1000** | 2400 × 1500 | PNG or GIF |
| 2 | `pain-failed-claims.png` | Pain card 1 | **1∶1** | **800 × 800** | 1200 × 1200 | PNG |
| 3 | `pain-camera-chaos.png` | Pain card 2 | **1∶1** | **800 × 800** | 1200 × 1200 | PNG |
| 4 | `pain-regulator-ai.png` | Pain card 3 | **1∶1** | **800 × 800** | 1200 × 1200 | PNG |
| 5 | `pain-callback.png` | Pain card 4 | **1∶1** | **800 × 800** | 1200 × 1200 | PNG |
| 6 | `feature-evidence.png` | Solution block 1 | **3∶2** | **1200 × 800** | 1800 × 1200 | PNG |
| 7 | `feature-coaching.png` | Solution block 2 | **3∶2** | **1200 × 800** | 1800 × 1200 | PNG |
| 8 | `feature-pack.png` | Solution block 3 | **3∶2** | **1200 × 800** | 1800 × 1200 | PNG |
| 9 | `feature-dashboard.png` | Solution block 4 | **3∶2** | **1200 × 800** | 1800 × 1200 | PNG |
| — | `og-social.png` | Social / OG (optional) | **1.91∶1** | **1200 × 630** | — | PNG |

### Pre-upload checklist (tick each file)

- [ ] **Aspect ratio** matches table — no extra padding bars baked into the image
- [ ] **Background** is `#f5f1eb` cream (or transparent PNG with cream fill behind content)
- [ ] **Width** meets minimum export size for that row
- [ ] **Filename** matches exactly (lowercase, hyphens, `.png` extension)
- [ ] **No purple** anywhere — scan edges and icon fills
- [ ] **No fake app UI** — icons and diagrams only unless prompt says otherwise
- [ ] **Accent orange** `#ff6b00` used once per image max (pain cards: red `#b91c1c` for ❌ only)
- [ ] **Text legible** at 50% zoom on a phone screen
- [ ] **Australian English** in all labels

---

## Asset inventory

| # | Filename | Where it appears | Format |
|---|----------|------------------|--------|
| 1 | `hero-job-flow.png` | Hero, right column | PNG (or `hero-job-flow.gif` if animated) |
| 2 | `pain-failed-claims.png` | Pain card 1 | PNG |
| 3 | `pain-camera-chaos.png` | Pain card 2 | PNG |
| 4 | `pain-regulator-ai.png` | Pain card 3 | PNG |
| 5 | `pain-callback.png` | Pain card 4 | PNG |
| 6 | `feature-evidence.png` | Solution block 1 | PNG |
| 7 | `feature-coaching.png` | Solution block 2 | PNG |
| 8 | `feature-pack.png` | Solution block 3 | PNG |
| 9 | `feature-dashboard.png` | Solution block 4 | PNG |

Optional: `og-social.png` (1200×630) for social sharing — charcoal band top, cream body, one-line value prop.

---

## Prompts (copy-paste one at a time into Notebook LM)

Each prompt below is **positive only**. Always append the [Global negative prompts](#global-negative-prompts-do-not-include) block.

### 1 — `hero-job-flow.png` (hero)

**Export:** 1600 × 1000 px (16∶10)

```
Create a wide editorial infographic titled "Foreman on a solar install — one job, start to finish".

Composition: single horizontal flow, left → right, 4 numbered steps connected by one thin arrow line. No phone screen UI — icons and labels only.

Steps:
1. Pocket phone icon + site pin → label "Consent · start job"
2. Roof silhouette + tradie in hi-vis + earbud → label "Voice prompts · 6 CER shots" with tiny sub-list: meter box, switchboard, serial plate, battery label, testing
3. Switchboard line icon + speech bubble → exact text: "Missing shutdown label — fix before you leave"
4. ZIP folder + green tick → label "Evidence pack · ready for claim"

Palette: background #f5f1eb, ink #1a1a1e, muted #5c5c66 labels. Orange #ff6b00 on exactly ONE element (final arrow or tick). Red only if needed for a small ❌ on step 3 — optional.

Flat vector, thin strokes, generous margins. Australian suburban roof pitch optional in step 2. No statistics, no regulator logos, no app screenshots.
```

**Image-specific negatives:** no animated glow, no step carousel UI, no before/after split screen.

---

### 2 — `pain-failed-claims.png`

**Export:** 800 × 800 px (1∶1)

```
Square editorial card: headline "Failed Claims" top-centre.

Centre visual: one photo frame icon — inside, a blurred/missing image with a bold red ❌ stamp (#b91c1c). Below, a simple arrow to a label "$3,000 rebate on hold" with smaller subtext "typical STC rebate at stake" (not a guarantee).

Flat vector only. Cream #f5f1eb fill edge-to-edge. No faces, no dollar signs raining, no panic imagery. Australian context implied through copy only.

Red restricted to ❌ stamp. No orange on this card.
```

**Image-specific negatives:** no purple warning triangles, no stock photo of worried person, no bank logos.

---

### 3 — `pain-camera-chaos.png`

**Export:** 800 × 800 px (1∶1)

```
Square editorial card: headline "Camera-Roll Chaos".

Show 5 minimal phone outlines (no screen UI inside — blank or tiny grey thumbnails only). Scattered photo icons float between phones. One tangled thread line (WhatsApp-style, abstract) links them — evidence spread across crew devices.

Bottom label: "No single source of truth" in muted #5c5c66.

Ink #1a1a1e outlines, cream #f5f1eb background. No app icons (no green WhatsApp logo). No readable chat text.
```

**Image-specific negatives:** no notification badges with numbers, no iMessage blue bubbles, no purple chat UI.

---

### 4 — `pain-regulator-ai.png`

**Export:** 800 × 800 px (1∶1)

```
Square editorial card: headline "The Regulator Checks With AI".

Flow: photo frame (left) → simple rectangular "review" box (centre) with magnifier icon + 2-row checklist — one row green tick "complete", one row red ✗ "unclear shot". No AI brain icon.

Sub-label: "Evidence photos reviewed against requirements".

Do NOT use CER, government, or coat-of-arms logos. Cream #f5f1eb background. Red #b91c1c for ✗ only; green for single tick only.
```

**Image-specific negatives:** no robot reviewing photos, no "Powered by AI" badge, no purple neural-network background.

---

### 5 — `pain-callback.png`

**Export:** 800 × 800 px (1∶1)

```
Square editorial card: headline "Found Out at Claim Time".

Horizontal mini-timeline, 3 nodes:
1. Install day — roof icon + green tick
2. Weeks later — simple calendar page (no month name readable)
3. Return trip — van + ladder icon; orange #ff6b00 on van body ONLY

Connecting line between nodes. Label below: "Defect surfaces after the crew left".

Cream background. No red on this card. No sad tradie illustration.
```

**Image-specific negatives:** no GPS map, no invoice/receipt UI, no purple timeline dots.

---

### 6 — `feature-evidence.png`

**Export:** 1200 × 800 px (3∶2)

```
Wide editorial infographic: title "Voice-Guided Evidence Capture".

Split layout (~45% / 55%):
LEFT — tradie on roof line art, phone in pocket or chest mount, earbud icon with sound-wave arcs (voice, not music).
RIGHT — vertical checklist of exactly 6 items: Meter box · Switchboard · Serial plate · Battery label · Testing · (one more CER-relevant shot). One item has orange #ff6b00 checkmark; others empty circles. One small example frame shows geo pin + timestamp stamp overlay (schematic, not a real photo).

Emphasise hands-free — no finger tapping shutter icon. Cream #f5f1eb background. No phone status bar, no camera app UI.
```

**Image-specific negatives:** no AR overlay, no viewfinder crosshairs, no purple highlight on checklist.

---

### 7 — `feature-coaching.png`

**Export:** 1200 × 800 px (3∶2)

```
Wide editorial infographic: title "Real-Time Defect Coaching".

Centre: simple switchboard line diagram (top-down schematic, not a photo). One zone outlined in red #b91c1c with label "Shutdown label not visible".

Speech bubble (one line only): "Fix this before you leave — claim will fail without it."

Orange #ff6b00 on speech bubble pointer only. Message is spoken coaching, not a text notification UI. Cream background.

No severity badges, no toast notifications, no mobile alert banner.
```

**Image-specific negatives:** no chatbot avatar, no Slack/Teams message UI, no purple alert banner.

---

### 8 — `feature-pack.png`

**Export:** 1200 × 800 px (3∶2)

```
Wide editorial infographic: title "One-Tap Submission Pack".

Centre: ZIP/folder icon (orange #ff6b00 on ZIP only) opening upward to reveal:
- 6 small rectangular photo placeholders (grey fill + icon, not real images)
- One manifest document list with filenames only: meter_box.jpg, switchboard.jpg, serial_plate.jpg, battery_label.jpg, testing.jpg, geo_manifest.csv

Footer label: "Geo-stamped · manifest included".

Flat vector. Cream background. No retailer logos, no email attachment UI, no cloud upload progress bar.
```

**Image-specific negatives:** no Dropbox/Google Drive icons, no "Send to CER" button, no purple file icons.

---

### 9 — `feature-dashboard.png`

**Export:** 1200 × 800 px (3∶2)

```
Wide editorial infographic: title "Crew Dashboard".

IMPORTANT: This is a SCHEMATIC CONCEPT DIAGRAM — not an app screenshot. Draw like a whiteboard wireframe or annual-report figure.

Three equal stat blocks in a row, each a simple rounded rectangle with label + number:
- "Jobs today" → 12
- "Packs ready" → 8
- "Defects caught" → 3
Add tiny "example data" in muted #5c5c66 under the title.

Below: three horizontal bar silhouettes labelled "Installer A", "Installer B", "Installer C" — bars are grey fills, no axis numbers, no gridlines.

Orange #ff6b00 highlight on ONE stat block border only. No sidebar, no header nav, no user avatar, no charts beyond the three bars. Cream #f5f1eb background.
```

**Image-specific negatives:** no Figma-quality UI, no dark sidebar, no line graphs, no world map, no "Export CSV", no purple accent buttons, no Pollinate-style dashboard clone.

---

### Optional — `og-social.png`

**Export:** 1200 × 630 px (1.91∶1)

```
Social preview card 1200×630.

Top 25%: charcoal band #1a1a1e with "Foreman" wordmark in white (bold sans).
Remaining 75%: cream #f5f1eb body.
Headline: "Compliance execution for solar install crews"
Small orange #ff6b00 underline beneath headline.

No photos, no badges, no icons, no purple.
```

---

## After export

1. Complete the [Pre-upload checklist](#pre-upload-checklist-tick-each-file) for every file.
2. Save files to `landing/public/assets/infographics/` with exact **PNG** names above.
3. In `landing/lib/media.ts`, change each path from `.svg` → `.png` (same basename).
4. Run `cd landing && npm run build && vercel --prod` (or push to main if auto-deploy wired).
5. For an animated hero only: save as `hero-job-flow.gif` (1600×1000, 16∶10) and point `media.hero.src` at that file.

**Interim:** The live site uses branded SVG placeholders until your PNGs land — the layout and slots are already wired.

---

## What we’re replacing

The site currently uses **phone demo screenshots and screen recording** captured from `/demo`. Those read as raw product captures, not marketing-grade visuals. Infographics should explain the **job story** clearly for Blake/investor first scroll.
