# Baseline Audit: `sql-in-depth` (`sql-in-depth.vedgupta.in`)

**Audit Date**: 2026-11-13  
**Branch Audited**: `main` (`8694701`) -> `feat/ui-overhaul`  
**Method**: Automated Playwright inspection across 8 key routes × 2 viewports (`1440×900` desktop, `390×844` mobile) × 2 color schemes (`light`, `dark`) = 32 captures + mobile Lighthouse 12 runs on `/` and `/topic/why-databases-exist/`.

---

## 1. Baseline Screenshots (`docs/assets/audit/before/`)

- **Landing (`1440×900` Light / Dark & `390×844` Mobile)**:
  - [landing-desktop-light.webp](../../assets/audit/before/landing-desktop-light.webp)
  - [landing-desktop-dark.webp](../../assets/audit/before/landing-desktop-dark.webp)
  - [landing-mobile-light.webp](../../assets/audit/before/landing-mobile-light.webp)
- **Lesson Page (`/topic/why-databases-exist/` Light / Dark / Mobile)**:
  - [lesson-foundations-desktop-light.webp](../../assets/audit/before/lesson-foundations-desktop-light.webp)
  - [lesson-foundations-desktop-dark.webp](../../assets/audit/before/lesson-foundations-desktop-dark.webp)
  - [lesson-foundations-mobile-light.webp](../../assets/audit/before/lesson-foundations-mobile-light.webp)
- **SQL Playground (`/sandbox` Light / Dark / Mobile)**:
  - [sandbox-desktop-light.webp](../../assets/audit/before/sandbox-desktop-light.webp)
  - [sandbox-desktop-dark.webp](../../assets/audit/before/sandbox-desktop-dark.webp)
  - [sandbox-mobile-light.webp](../../assets/audit/before/sandbox-mobile-light.webp)

---

## 2. Baseline Mobile Lighthouse Metrics

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Total Payload |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/` (Landing) | **49** ❌ | **91** ❌ | 96 | 100 | 3.3 s | 3.3 s | **3,730 ms** ❌ | 0 | **22,747 KiB** ❌ |
| `/topic/why-databases-exist/` | **46** ❌ | **84** ❌ | 96 | 100 | 3.5 s | 3.5 s | **3,480 ms** ❌ | 0 | **22,747 KiB** ❌ |
| **Definition of Done Target** | **≥ 90** | **≥ 95** | **≥ 95** | **≥ 95** | < 1.5 s | < 2.2 s | < 150 ms | 0 | < 1,500 KiB initial |

---

## 3. Root-Cause Findings by Category

### A. Critical Performance Bottlenecks (Why Mobile Performance Is 46–49)
1. **Eager Synchronous Injection of 38 Deferred Scripts (`js/bootstrap.js`)**:
   - `startDeferredScripts()` runs at `0ms` immediately after first paint and appends **all 38 `<script data-defer>` files with `s.async = false`** on *every* page — even when the user is simply reading the landing page or a static lesson.
   - Heavy payloads parsed on the main thread on every route: `topic_guided_labs.js` (**1.57 MB**), `srs-cards.js` (**863 KB**), `glossary.js` (**424 KB**), `implementations_code.js` (**303 KB**), `guided_labs.js` (**279 KB**), plus all 6 simulator bundles and KaTeX.
2. **Main-Thread Boot of 18 MB `@electric-sql/pglite` WASM (`js/sql-engine.js`)**:
   - `sql-engine.js` defaults `_activeEngine = 'postgres'` and eagerly fetches + compiles `~18 MB` of PostgreSQL WASM on the main thread during initial load, inflating initial payload to **22.7 MB** and freezing the main thread (`TBT = 3,730 ms`, `TTI = 126.9 s`).
3. **Render-Blocking External KaTeX Stylesheet & Unminified CSS**:
   - `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">` blocks first paint; raw CSS files have ~48 KiB of minification savings.
4. **Console Error from Unconditional GA4 Script**:
   - `bootstrap.js` sets `consentGranted = true` by default and injects `googletagmanager.com/gtag/js`, causing console network errors offline/locally (`errors-in-console` score `0`).

### B. Accessibility Violations (Why Accessibility Is 84–91)
1. **Invalid ARIA Tablist Children (`aria-required-children`, score 0)**:
   - `<nav class="sidebar__tabs" role="tablist">` contains `<button id="sidebar-collapse-modules-btn">` and `<button id="sidebar-collapse-btn">` without `role="tab"`.
2. **Skipped Heading Hierarchy (`heading-order`, score 0)**:
   - Lesson pages jump from `<h1 class="content__title">` directly to `<h3 class="intuition__title">` before any `<h2>` appears.
3. **Insufficient Color Contrast (`color-contrast`, score 0)**:
   - `--fg-faint` (`#71717A` / `#787882`) on secondary surfaces (`#F4F4F5` / `#18181B`) and muted badges drop below WCAG AA `4.5:1`.
4. **Unlabeled Form Controls (`label`, score 0)**:
   - Dataset/engine `<select>` elements and simulator inputs lack explicit `<label>` or `aria-label` associations.
5. **Undersized Touch Targets (`target-size`, score 0)**:
   - `#sidebar-collapse-btn` (`16×32px`), clause step chips (`height: 22px`), breadcrumb links (`height: 16px`), and timeline range scrubbers (`height: 6px`) fail the 24px WCAG 2.2 AA minimum.

### C. Layout, Typography, Color & Design-Craft Issues
1. **Horizontal Document Overflow on Desktop Lesson Pages**:
   - `/topic/why-databases-exist/` overflows horizontally (`scrollWidth = 1566px` on a `1440px` viewport; `btree-bplustree-internal-anatomy` reaches `1613px`) due to `--reading-max: 1140px` combined with unconstrained wide SVGs/code blocks alongside the `280px` sidebar.
2. **Unreadable `1098px` (`~145ch`) Prose Line Length & Missing Right-Rail TOC**:
   - Lesson paragraphs stretch across `1098px` with `15px` font size — nearly double the optimal `65–75ch` reading width — and lack a sticky right-rail "On This Page" table of contents.
3. **Harsh Pure-Black Dark Mode (`#000000`) & Craft Anti-Patterns**:
   - Dark mode uses pure `#000000` canvas causing high-contrast halation; callouts use thick `3px–4px` `border-left` stripes; uppercase eyebrow kickers stack above headings; intrusive `#consent-banner` modal covers the bottom-right viewport on every first visit.
4. **Above-the-Fold Landing Page Lacks Interactive SQL Demo**:
   - `/` shows marketing text and static metrics above the fold instead of an immediately runnable SQL playground + execution plan preview, and lacks a "Continue where you left off" action for returning learners.

### D. Content Experience & Video Quality Issues
1. **Noisy YouTube Thumbnails Dominating the First Viewport**:
   - On `/topic/why-databases-exist/`, a giant clickbait YouTube card (`"SQL vs NoSQL..."`) consumes 80% of the first viewport, followed immediately by a *second* YouTube card before a single paragraph of lesson text appears.
2. **Weak / Non-English / Untrimmed Entries in `data/topic_videos.json`**:
   - Contains non-English videos (e.g., `"Sql Data Types in Telugu"` under `sql-data-types-storage`), untrimmed channel names (`"     The Learning Stack"`), and multiple stacked external embeds per topic.
3. **Missing Original Flagship Explainer Videos**:
   - Zero first-party diagrammatic videos with captions/transcripts exist yet.
4. **Templated Prose Splices & Repetitive Diagrams in Lesson Content**:
   - `data/content/m01..m18.js` contains automated sentence-splice artifacts such as `"In Filesystems vs. Relational DBMS & Codd's 12 Rules (why-databases-exist), Why ad-hoc CSV/JSON files fail..."` (capitalized clause spliced after comma) and repeats identical generic SVGs across multiple distinct M01 topics.
   - Lessons lack explicit **One-line promise**, **Why it matters**, and **Common mistakes** sections required by the new pedagogical template.

### E. SQL Playground (`/sandbox`) & Embedded Runner Gaps
1. **Broken Editor Gutter & Plain `<textarea>`**:
   - Line numbers in `/sandbox` render squished horizontally as `1234` on a single line instead of aligned vertical rows.
   - Uses a plain `<textarea>` instead of **CodeMirror 6**: no SQL syntax highlighting in the live input layer, no schema-aware autocomplete for tables/columns/keywords, no inline error underlines, and no SQL formatter button.
2. **Web Worker Isolation Missing**:
   - Queries run on the UI main thread rather than inside a dedicated Web Worker.
3. **Clause Visualizer Parser Bug (`js/table-visualizer.js`)**:
   - Splitting SQL clauses naively misparses `ROUND(..., 2)` inside `SELECT`, corrupting the `ORDER BY` step display (`100.0, 2) AS gross_revenue_usd...`).
4. **Mobile Playground Usability Failure (`390×844`)**:
   - All 26 schema tables render expanded above the editor on mobile, forcing users to scroll past two full screens before seeing the SQL editor.
5. **Missing Playground Features**:
   - No **Shareable Query URL** (`?q=<compressed>`), no visual **`EXPLAIN` Query Plan Tree** diagram, no accessible sortable result column buttons (`aria-sort`), and no integrated **Challenges Mode** tab inside `/sandbox`.

### F. Shareability & Per-Page SEO Gaps
1. **Single Generic OG Image Across All 201 Pages**:
   - Every topic, module, and hub page points to the same static `/assets/og-image.png` instead of per-page generated `1200×630` Open Graph / Twitter cards with topic title, module badge, and SQL brand accent.
2. **Missing Pre-Rendered Hub Entrypoints & Share Buttons**:
   - `/sandbox`, `/roadmap`, `/challenges`, `/glossary`, and `/dashboard` rely on SPA fallback rather than dedicated pre-rendered `index.html` metadata; lessons, playground queries, and completed challenges lack a unified Share button (Copy Link + Web Share API).

---

## 4. Prioritized Remediation Backlog (P0 / P1 / P2)

### P0 — Architecture, Performance, Accessibility & Playground Core (Must Fix First)
- **[P0-1] Portable Shared Design System (`design-system/` + `css/` + `DESIGN.md`)**: Establish tokens (light/dark surfaces, SQL cobalt accent + sibling product presets, `Geist` + `Geist Mono`, spacing, radius, motion), accessible shell, `68ch` reading column + sticky right TOC, clean callouts, code blocks, quiz cards, share button, and footer.
- **[P0-2] Route-Split Lazy Loading & Self-Hosted KaTeX (`js/bootstrap.js`, `index.html`, `tools/generate-static.js`)**: Stop loading all 38 deferred scripts + 18 MB PGlite on initial paint; self-host KaTeX CSS/fonts; silence localhost/offline GA4 errors; remove intrusive `#consent-banner` modal. Target mobile Lighthouse Perf ≥ 90.
- **[P0-3] WCAG AA Accessibility Fixes**: Fix `role="tablist"` children, heading hierarchy (`h1 -> h2 -> h3`), contrast ratios (`>= 4.5:1`), form control labels, and touch targets (`>= 32px–36px`). Target mobile Lighthouse A11y ≥ 95.
- **[P0-4] Web Worker Dual SQL Engine + CodeMirror 6 Playground (`/sandbox` & Embedded Runners)**:
  - Run `sql.js` (fast SQLite 3 default) + on-demand `@electric-sql/pglite` (PostgreSQL 18.6) inside `js/sql-worker.js` with Node fallback for `validate.js` / `e2e-test.js`.
  - Bundle **CodeMirror 6** (`@codemirror/lang-sql`, schema autocomplete, error lint underlines, `Cmd/Ctrl+Enter`, SQL formatter, light/dark themes).
  - Add accessible sortable result tables (`aria-sort`), CSV export, collapsible mobile schema browser, visual **`EXPLAIN` plan tree**, integrated **Challenges mode**, and compressed **Shareable Query URLs** (`?q=...`). Fix `table-visualizer.js` clause parser bug.

### P1 — Content Experience, Visual Learning, Flagship Videos & Curation
- **[P1-1] Editorial Lesson Template & Prose Cleanup (`js/renderer.js` + `data/content/m01..m18.js`)**:
  - Restructure every lesson into: *Header & One-Line Promise -> Why It Matters & Core Idea -> Visual Explanation -> Worked Runnable Example -> Common Mistakes -> Guided Practice -> Self-Check Quiz -> Recap & Next Step*.
  - Fix all grammatical splice defects across `m01..m18.js`, eliminate desktop/mobile horizontal overflow, and upgrade duplicated M01 diagrams into topic-specific interactive visuals.
- **[P1-2] Video Quality Review (`data/topic_videos.json`)**:
  - Remove non-English/weak videos, trim channel names, keep at most one high-signal verified English reference video per topic in a secondary collapsible lecture card below the core visual explanation.
- **[P1-3] 5 Original Flagship Explainer Videos (`tools/generate-videos.js` -> `assets/videos/`)**:
  - Generate 5 original diagrammatic videos (`why-databases-exist`, `select-projection-aliases`, `inner-join-equi-joins`, `btree-bplustree-internal-anatomy`, `multi-version-concurrency-control-mvcc`) with open-license narration, synchronized `.vtt` captions, `.webp` posters, `< 800 KB` payloads, `preload="none"`, and transcripts.

### P2 — Landing Page, Shareability, Per-Page OG Cards & Final Polish
- **[P2-1] High-Converting Interactive Landing Page (`/`)**:
  - Above-the-fold live interactive SQL Playground + Execution Plan preview, clear "Start learning" + "Continue where you left off" CTAs, 18-module progress roadmap, and sibling product family footer.
- **[P2-2] Automated Per-Page OG Images & Static Hub SEO (`tools/generate-og.js`, `tools/generate-static.js`)**:
  - Generate `1200×630` OG/Twitter images per page, pre-render static `index.html` for hub routes (`/sandbox/`, `/roadmap/`, `/challenges/`, `/glossary/`, `/dashboard/`), verify `sitemap.xml`, `robots.txt`, and JSON-LD, and wire Share buttons across lessons, playground queries, and completed challenges.
