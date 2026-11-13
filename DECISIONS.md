# Architectural & Product Decisions (`DECISIONS.md`)

All product, UX, engineering, and infrastructure ambiguities encountered during the autonomous overhaul are resolved and recorded below with rationale and rejected alternatives.

---

## ADR-001: Portable Shared Design System & Product Family Accents
- **Decision**: Author a portable, framework-free CSS design system under `design-system/tokens.css` and `design-system/components.css` (imported directly by `sql-in-depth` and copy-ready for `system-design-in-depth` and `dsa-in-depth`). Set per-product brand accent via `data-product`:
  - `sql` (`sql-in-depth`): **Precision Cobalt** (`#0F62FE` light / `#58A6FF` dark)
  - `system-design` (`system-design-in-depth`): **Distributed Teal** (`#0D9488` light / `#2DD4BF` dark)
  - `dsa` (`dsa-in-depth`): **Algorithmic Violet** (`#6D28D9` light / `#A78BFA` dark)
- **Why**: All three repositories use static-first vanilla HTML/CSS/JS architectures without React/Tailwind build lock-in. Pure CSS custom properties + semantic component classes guarantee zero runtime overhead, instant dark/light switching (`color-scheme: light dark`), WCAG AA contrast (`>= 4.5:1`), and effortless portability across all three repos.
- **Alternatives Rejected**:
  - *Tailwind CSS / React component library*: Introduces unnecessary framework migration risk across 200+ pre-rendered HTML pages and breaks vanilla script contracts tested by `tools/e2e-test.js`.
  - *Pure `#000000` dark mode canvas*: Causes severe text halation and ghosting on OLED panels; replaced with deep slate ink (`#0B0E14` ground, `#11161F` elevated surface).

---

## ADR-002: Typography Pairing (`Geist` + `Geist Mono`, Self-Hosted OFL)
- **Decision**: Standardize on self-hosted **Geist** (`fonts/geist-latin.woff2`) for prose and UI headings (`16px` / `1rem` body, `68ch` reading measure, `1.68` line-height) and **Geist Mono** (`fonts/geist-mono-latin.woff2`) with `font-variant-numeric: tabular-nums` for SQL code, execution plans, byte offsets, and result tables.
- **Why**: Already self-hosted under SIL Open Font License 1.1 with `font-display: swap`, zero third-party Google Fonts network requests, crisp legibility at dense table sizes, and clean monospace alignment.
- **Alternatives Rejected**:
  - *External Google Fonts (`Inter` / `JetBrains Mono` CDN)*: Adds DNS/TLS round-trips on mobile 4G and hurts Lighthouse FCP/LCP.

---

## ADR-003: Client-Side SQL Engine — Dual WASM (`sql.js` Default + On-Demand `PGlite`) Inside a Dedicated Web Worker
- **Decision**: Run client-side SQL execution inside a **dedicated Web Worker (`js/sql-worker.js`)** backed by two real WASM engines:
  1. **SQLite 3 via `sql.js` (`~1 MB` WASM, MIT)** as the **instant default engine** (`<80ms` cold boot, zero main-thread blocking, deterministic `EXPLAIN QUERY PLAN` tree output, works offline immediately).
  2. **PostgreSQL 18.6 via `@electric-sql/pglite` (Apache-2.0)** loaded **lazily inside the Worker** only when the learner switches the engine selector to `PostgreSQL 18` or runs a Postgres-specific dialect query (`EXPLAIN (FORMAT JSON)`, `RETURNING`, `LATERAL`, system catalogs).
  - Preserve synchronous/Node-compatible execution in `js/sql-engine.js` when running under Node (`typeof window === 'undefined'`) so all existing CLI validators (`tools/validate.js`, `tools/e2e-test.js`) continue executing seamlessly.
- **Why**: Baseline Lighthouse audit proved that booting `@electric-sql/pglite` (`~18 MB` WASM) eagerly on the main thread caused `22.7 MB` initial transfer size and `3,730 ms` Total Blocking Time (`Perf = 46`). Running `sql.js` by default inside a Worker cuts initial SQL boot cost by >94% and reduces UI blocking to `0ms`, while retaining full PostgreSQL 18 fidelity one click away.
- **Alternatives Rejected**:
  - *PGlite-only eager boot*: Fails mobile Lighthouse Performance (`< 50`) due to 18 MB WASM compilation on simulated mobile CPUs.
  - *DuckDB-WASM*: Excellent OLAP engine (`~32 MB` bundle), but heavier than `sql.js` and differs from OLTP B+Tree / MVCC internals taught in Modules 8–12.

---

## ADR-004: SQL Editor — CodeMirror 6 Custom Bundle (`js/vendor/cm6-sql.js`)
- **Decision**: Bundle **CodeMirror 6** (`@codemirror/state`, `@codemirror/view`, `@codemirror/lang-sql`, `@codemirror/autocomplete`, `@codemirror/lint`, `@codemirror/commands`, `@codemirror/search`, all MIT) via `esbuild` into a single self-hosted module (`js/vendor/cm6-sql.js`, `~115 KB` gzipped) loaded lazily when `/sandbox` or an embedded lesson SQL workbench initializes.
- **Why**: Replaces the broken `<textarea>` + horizontal-squished line-number gutter with real SQL syntax highlighting, schema-aware autocomplete (tables, columns, types, SQL keywords), inline error squiggles with actionable SQL hints, `Cmd/Ctrl+Enter` execution, SQL query formatting, keyboard accessibility, and mobile touch support.
- **Alternatives Rejected**:
  - *Monaco Editor*: `~2.5 MB–4 MB` payload, poor mobile touch support, and heavy layout thrashing inside multi-instance lesson pages.
  - *Custom `<textarea>` overlay*: Fragile scroll/line-number synchronization, zero real autocomplete, and poor accessibility.

---

## ADR-005: Route-Aware Lazy Loading & Self-Hosted KaTeX
- **Decision**: Refactor `js/bootstrap.js` and `tools/generate-static.js` to load **only core navigation/progress/search scripts** (`~80 KB` gzipped) after initial paint, and load route-heavy assets strictly on demand (`IntersectionObserver` or route match):
  - Self-host KaTeX CSS + Latin `.woff2` fonts locally under `css/vendor/katex/` and load KaTeX only when math delimiters exist on the page.
  - Lazy-load individual simulator bundles, `topic_guided_labs.js`, `srs-cards.js`, `glossary.js`, and `implementations_code.js` only when their route or viewport section activates.
  - Disable Google Analytics network requests on `localhost`/`127.0.0.1` or offline, and remove the intrusive auto-opening `#consent-banner` dialog in favor of a quiet privacy-respecting footer preference toggle (defaulting to zero third-party tracking unless opted in).
- **Why**: Directly eliminates the `3,730 ms` TBT, `22.7 MB` payload, render-blocking CDN stylesheet, and console errors uncovered in the baseline audit.
- **Alternatives Rejected**:
  - *Keeping 38 synchronous `data-defer` scripts on every page*: Impossible to hit Lighthouse Mobile Performance ≥ 90 on 4× CPU throttling.

---

## ADR-006: Flagship Explainer Videos — Programmatic Canvas + `ffmpeg` + Open TTS + WebVTT Captions
- **Decision**: Build a deterministic, repeatable Node video pipeline (`tools/generate-videos.js`) that renders high-DPI original animated technical frames (using our exact Geist/Geist Mono design tokens, B+Tree/page/join/MVCC vector state machines), synthesizes clear narration audio (`macOS/system TTS -> AAC/Opus` with deterministic timing + fallback silent/tone track support in headless CI), muxes via `ffmpeg` into ultra-compact `.mp4` (H.264 `yuv420p`, `-movflags +faststart`) + `.webm` (`< 800 KB` per video), generates `.webp` poster frames, and outputs synchronized `.vtt` WebVTT captions + inline HTML transcripts for **5 flagship topics**:
  1. `why-databases-exist` (*Why Databases Exist: 8KB Slotted Pages, ACID & Codd's Contract*)
  2. `select-projection-aliases` (*SQL Logical Execution Order: How Queries Actually Run*)
  3. `inner-join-equi-joins` (*Physical Join Algorithms: Nested Loop, Hash & Sort-Merge*)
  4. `btree-bplustree-internal-anatomy` (*Inside a B+Tree Index Lookup: O(log_B N) Page Hops*)
  5. `multi-version-concurrency-control-mvcc` (*MVCC Snapshot Isolation: Readers Never Block Writers*)
- **Why**: Produces 100% original, cohesive, dark-slate diagrammatic videos that match the site's own visual language without third-party YouTube ad clutter, clickbait thumbnails, or heavy React/Remotion runtime bloat. Keeping each video `45s–70s` at crisp vector bitrates keeps git repository size lean (`< 4 MB` total across all 5 videos) while loading zero bytes until the learner clicks Play (`preload="none"`).
- **Alternatives Rejected**:
  - *Remotion full dependency tree*: Adds Chromium/React heavyweight dependencies (`~300 MB` `node_modules`) for deterministic 2D technical animations that pure Canvas/SVG + `ffmpeg` renders faster and cleaner.
  - *Animations-only with no video/narration*: Misses the multi-modal spoken walkthrough experience highlighted in Phase 4 (captioned video explainers).
  - *External YouTube embeds as primary hero media*: Hurts visual trust, injects clickbait thumbnails above the fold, and breaks offline/privacy guarantees. Curated English YouTube lectures are retained strictly as optional secondary reference links below the core lesson.

---

## ADR-007: Shareable Query URLs via Raw Deflate + Base64url (`?q=...`)
- **Decision**: Encode playground state (`{ sql, ds, eng }`) using browser-native `CompressionStream('deflate-raw')` (with lightweight JS fallback) + URL-safe Base64 (`?q=...`) in `/sandbox/`.
- **Why**: Requires zero backend database, keeps 30-line SQL queries compact (`~140–220` URL characters), works deterministically across Slack/X/GitHub/Markdown links, and restores dataset + engine + query automatically on load.
- **Alternatives Rejected**:
  - *Uncompressed ` encodeURIComponent(sql)` only*: Produces unwieldy 1,000+ character URLs for multi-CTE analytical queries (still supported as a `?sql=` plain-text fallback for human-crafted links).
  - *External pastebin/KV backend*: Violates the "no backend required" mandate and introduces link-rot risk.

---

## ADR-008: Per-Page Open Graph Cards (`1200×630` PNG) Generated Deterministically at Build Time
- **Decision**: Create `tools/generate-og.js` to generate crisp `1200×630` PNG social cards (`assets/og/*.png`, palette-indexed PNG8 `~14–22 KB` each) for the landing page, hub routes (`/sandbox/`, `/roadmap/`, `/challenges/`, `/glossary/`, `/projects/`), all 18 module tracks, and topic pages — wired automatically into `<meta property="og:image">` and `<meta name="twitter:image">` by `tools/generate-static.js`.
- **Why**: Social crawlers (X/Twitter, Slack, LinkedIn, iMessage, Discord) universally support PNG `summary_large_image` (`1200×630`) while frequently rejecting SVG OG images. Indexed 8-bit PNG keeps file sizes tiny while rendering razor-sharp typography.
- **Alternatives Rejected**:
  - *Single generic `og-image.png` for all 201 URLs*: Fails Phase 5 requirement for per-page generated OG/Twitter cards with title, product name, and accent color.
  - *Runtime edge OG generation (Vercel `@vercel/og`)*: Incompatible with pure static hosting (`GitHub Pages` / Cloudflare static assets).
