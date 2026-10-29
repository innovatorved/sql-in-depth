# Project: SQL In Depth — Production-Readiness Audit, Remediation & Optimization (`sql-in-depth`)

**SQL In Depth** (`https://sql-in-depth.vedgupta.in`) is an interactive, first-principles relational database and SQL mastery platform. It spans 6 tracks, 18 modules (`m01`–`m18`), 180 curriculum units (144 lessons, 18 case studies, 18 capstone builds), 720 assessment questions, 540 guided SQL lab steps, 12 production incident challenges, 36 interactive engine simulators, a clause-by-clause SQL table visualizer, and dual in-browser WebAssembly database runtimes (`@electric-sql/pglite` PostgreSQL 18.6 + `sql.js` SQLite 3).

---

## Architecture

- **Boot, Routing & Shell Layer (`index.html`, `404.html`, `projects/index.html`, `js/init.js`, `js/manifest.js`, `js/bootstrap.js`, `js/lazy.js`, `js/app.js`, `js/404.js`, `js/search.js`, `js/landing.js`)**:
  - Zero-framework vanilla HTML5/CSS/ES2022 static & SPA hybrid architecture supporting 201 static HTML entrypoints (`index.html`, `404.html`, `projects/index.html`, 180 `/topic/<slug>/index.html`, and 18 `/build/<id>/index.html`) plus SPA views (`/roadmap/`, `/challenges/`, `/sandbox/`, `/dashboard/`, `/glossary/`, `/projects/`).
- **Dual WASM SQL Engine & Relational Datasets (`js/sql-engine.js`, `data/datasets.js`)**:
  - `window.SQLEngine` manages `postgres` (`@electric-sql/pglite` WASM) and `sqlite` (`sql.js` WASM) execution, dialect normalization, savepoint `EXPLAIN ANALYZE`, and before/after DML diffing across 5 seeded relational datasets (`ecommerce`, `org_hr`, `fintech_ledger`, `saas_telemetry`, `social_graph` — 26 tables, 182 rows).
- **Interactive Simulators, Clause Visualizer & SQL Workbenches (`js/simulators.js`, `js/simulators-*.js`, `js/table-visualizer.js`, `js/sandbox.js`, `js/challenges.js`, `data/challenges.js`, `data/topic_guided_labs.js`, `data/guided_labs.js`)**:
  - `window.Simulators` (`js/simulators.js` + 6 domain modules: `relational`, `analytical`, `modeling`, `indexing`, `transactions`, `olap-ops`) powers 36 step-by-step interactive database engine simulators across all 180 units.
  - `window.TableVisualizer` (`js/table-visualizer.js`) powers the 8-stage clause-by-clause SQL execution visualizer, practice clause chips, inline `.sql-runner` blocks, and guided SQL lab verification (`verifyQueryAgainstReference`).
  - `window.SandboxController` (`js/sandbox.js`) powers `/sandbox` (Interactive SQL Studio & Architecture Capacity Sandbox).
  - `window.ChallengesController` (`js/challenges.js` + `data/challenges.js`) powers `/challenges` (12 Production Incident War-Room troubleshooting & SQL hotfix challenges).
- **Curriculum Renderer, Static Pre-Renderer & Asset Pipeline (`js/renderer.js`, `tools/generate-static.js`, `tools/stamp-assets.js`, `tools/build.js`, `tools/validate.js`, `tools/check-rendered.js`)**:
  - `window.Renderer` (`js/renderer.js`) renders lessons, builds, cheat sheets, glossary, and KaTeX math (`renderMathInHtml`, `formatInlineCode`).
  - `tools/generate-static.js` pre-renders 199 HTML pages and `sitemap.xml`; `tools/stamp-assets.js` computes SHA-256 hashes and stamps all 201 HTML files and `js/manifest.js`; `tools/build.js` packages `dist/`.

---

## Feature Inventory

Every feature and defect discovered in the Phase 0 Survey across `teamwork_preview_explorer_survey_1` (R1 & R4), `teamwork_preview_explorer_survey_2` (R2), and `teamwork_preview_explorer_survey_3` (R3) is inventoried below with its assigned milestone. Zero features are left unassigned.

| # | Feature / Audit Item | Description | Milestone | Source |
|---|----------------------|-------------|-----------|--------|
| F1 | Step Simulator Auto-Play Timer Lifecycle (`R2 Bug 1`) | Add `after(ms, fn)` (tracked in a `timeouts` Set and cleared in `stop(id)` and `dispose()`) to `lifecycle()` in `js/simulators.js:284-309` so `waitMs(ms)` at `js/simulators.js:1498` resolves cleanly and clicking `⏵ Play` across all 36 interactive simulators animates without throwing `TypeError: lc.after is not a function`. | M1 | survey_2 |
| F2 | Domain Simulator Preset Parameter Transformation & Custom Input Cleanup (`R2 Bug 2`) | In all 6 domain simulator files (`js/simulators-relational.js`, `js/simulators-analytical.js`, `js/simulators-modeling.js`, `js/simulators-indexing.js`, `js/simulators-transactions.js`, `js/simulators-olap-ops.js`), update `buildInteractiveFrames(spec, preset)` so switching presets (`preset.minTotal`, `preset.mode`, or secondary preset ID) meaningfully transforms/filters the relational rows, step frames, and metrics; disable the leftover DSA numeric array input (`customInput: false` in `buildInteractiveConfig` / `js/simulators.js:1359`) so no misleading DSA array input appears on SQL relational simulators. | M1 | survey_2 |
| F3 | SQL Practice Clause Chips Wiring & Valid Schema Columns (`R2 Bug 3`) | (a) In `js/table-visualizer.js:669` (`buildPracticeChipsHtml`), emit `data-sql-chip="${escapeHtml(chip.id)}"` so click handlers at `lines 2580, 2834` match `c.id`; (b) in `js/sandbox.js:1955-1957`, look up `data-wb-sql-chip` by `c.id === chipAttr` (with index fallback); (c) in `SQL_PRACTICE_CHIPS` (`js/table-visualizer.js:650-663`), fix nonexistent column names (`full_name` → `name` in `'select'`, `total_amount` → `total_cents` in `'where'`, `'with_cte'`, `'case_when'`, and `salary` → `salary_usd` in `'window_over'`) so all 12 practice chips execute with 0 SQL errors. | M1 | survey_2 |
| F4 | `/sandbox` SQL Studio Toolbar Actions & History Dropdown Wiring (`R2 Bug 4`) | In `js/sandbox.js`: (a) match `ideAct === 'format' || ideAct === 'format-sql'` and `ideAct === 'copy' || ideAct === 'copy-sql'` (`lines 1908-1915`); (b) read `#wb-sql-save-title-input` value first in `save-query` (`line 1920`) before falling back to `window.prompt`, and implement the `delete-saved` action handler (`line 1248, 1930`) calling `TableVisualizer.deleteSavedQuery`; (c) in `#wb-sql-saved-history-select` change handler (`line 2320`), support `history:<id>` option values (`line 961`) by looking up `hist.find(h => String(h.id) === selVal.slice(8))`. | M1 | survey_2 |
| F5 | Production Incident Challenges SQL Verification & Hotfix Callback (`R2 Bug 5` + `R3-3`) | (a) In `data/challenges.js:239-256` (`chal-06-non-sargable-composite-index`), update date range from `'2025-01'` to `'2025-02'` (`'2025-02-01'..'2025-03-01'`) to match seeded `orders` rows; (b) in `data/challenges.js:407-424` (`chal-10-ab-ba-deadlock-storm`), update `product_id IN (5, 2, 8, 1)` to `IN (105, 102, 108, 101)` (and sorted `(101, 102, 105, 108)` in `solutionCode`) to match seeded `products` rows, and uppercase `FOR NO KEY UPDATE` in `invariants[1]`; (c) in `js/table-visualizer.js:2942-2985` (`verifyQueryAgainstReference`) and/or `js/app.js` / `js/challenges.js`, pass `buggyCode` / `forbiddenSql` or structural check so unedited `buggyCode` in `chal-04`, `chal-05`, and `chal-07` is rejected (`bugPasses: false`); (d) in `js/challenges.js:604`, call `e.stopPropagation()` on `[data-action="open-challenge-codelab"]` and export `markCodeHotfixPassed` on `ChallengesController` (`js/challenges.js:682`); (e) in `js/challenges.js:313`, format inline backtick code spans in `ch.invariants` as `<code>...</code>`. | M1 | survey_2, survey_3 |
| F6 | Theme Tokens (`--bg-tertiary`), Dead `css/tokens.css` Cleanup & Theme Toggle Icon Parity (`R1 D2, D3, D6b`) | (a) Define `--bg-tertiary` in `css/variables.css` under both `:root, [data-theme="dark"]` (`rgba(39, 39, 42, 0.6)`) and `[data-theme="light"]` (`#f1f5f9`) so simulator explanation boxes and `404.html` `<kbd>` badges have proper light-mode contrast; (b) remove or sync unused `css/tokens.css`; (c) unify `.icon-sun` / `.icon-moon` display logic between `App.initTheme()` (`js/app.js:1656-1662`), `App.toggleTheme()` (`js/app.js:1221-1231`), and `js/404.js:5-12` so clicking `#theme-toggle` immediately switches the icon on the first click. | M2 | survey_1 |
| F7 | Guided Builds (`/build/<id>`) `primarySlug` Resolution & Engine Workbench Assertion Runner (`R2 Bug 6`) | (a) In `getTopicLabSpec(slug)` (`js/app.js:2388`) and `Renderer.renderBuild(buildId)` (`js/renderer.js:1059`), resolve `window.IMPLEMENTATIONS_DATA?.[slug]?.primarySlug` when `slug` is a `build-*` ID so `/build/<buildId>` pages load the real 3-step Guided SQL Lab for their `primarySlug` instead of the generic `SELECT * FROM customers LIMIT 10;` fallback; (b) in `renderBuildView` (`js/app.js:931, 967-979`), ensure SQL studio mode uses the SQL lab step (`getTopicLabSpec`) rather than passing JS engine code into `openSqlStudioModal`; (c) in `mountEngineCodeLabWorkbench` (`js/app.js:2367-2382`), execute `guidedEntry.testHarness` against the user's code on `[data-cl-action="test"]` (or delegate to `window.CodeLab.mount`) so unedited starter code does not falsely report pass. | M2 | survey_2 |
| F8 | Live DOM Inline Code Formatting (`R3-1`, `R3-2`) & Graceful Lesson Audio Fallback (`R3-4`) | (a) In `js/app.js:2320` (`mountEngineCodeLabWorkbench`) and `js/app.js:2523` (`mountInlineTopicSqlLab`), convert Markdown backticks `` `...` `` to `<code>...</code>` after HTML-escaping so no raw backticks leak in `.sql-guided-step-bar` across all 180 topic pages and 18 build pages; (b) in `js/renderer.js:1892` (`renderGlossary`), render `${renderMathInHtml(formatInlineCode(defText))}` so all 8 glossary definitions with backticks render `<code>` tags; (c) in `js/renderer.js:1618-1648` (`window.toggleAudio`), implement a clean Web Speech API (`window.speechSynthesis`) narration fallback (reading the lesson's overview & intuition text with play/pause state) when `audio/<slug>.mp3` is absent or errors, eliminating broken 404 audio playback. | M2 | survey_3 |
| F9 | `404.html` CSS Tokens, `/?q=` Search Redirect Handling & Clean Pre-rendered Links (`R1 D5, D7` + `R3-5a`) | (a) In `404.html:33-132, 183`, replace undefined `--topbar-height` and `--radius-*` with `--topbar-h` and `--r-*`, and change `href="/#/glossary"` to `href="/glossary/"`; (b) in `js/app.js` (or `js/search.js`), inspect `new URLSearchParams(window.location.search).get('q')` on init and automatically open the search modal pre-populated with the query; (c) in `js/renderer.js:301`, change `href="#/glossary"` to `href="/glossary/"`; (d) in `js/landing.js:95`, render `href="/topic/${esc(demos[0].lesson)}/"` instead of `#topic/...`. | M2 | survey_1, survey_3 |
| F10 | Build Pipeline Determinism, Local KaTeX JS Vendoring, `projects/index.html` Parity & `/glossary/` Sitemap/Validator Coverage (`R1 D4` + `R4 D1, D6a` + `R3-5b`) | (a) Vendor `node_modules/katex/dist/katex.min.js` and `node_modules/katex/dist/contrib/auto-render.min.js` into `js/vendor/katex/` and update `index.html:1254-1255` and `tools/generate-static.js:275-276` to load them locally instead of from `cdn.jsdelivr.net`; (b) in `tools/generate-static.js:331-337`, compute unique `youtubeId` count (`36`) for `SITE_COUNTS.videos` to match `tools/stamp-assets.js:71-87`, include `https://sql.mountainlab.com.au/glossary/` in `sitemap.xml` generation, and run `stamp-assets.js` at the end of `generate-static.js` so `npm run prerender` is self-contained and deterministic; (c) sync `projects/index.html` topbar (`SQL Studio`, `Glossary`), sidebar header (`Collapse` button), and deferred script bundle (`js/bootstrap.js` + simulator/ecosystem controllers) with `index.html`; (d) add `'/glossary/'` to `hubPaths` in `tools/validate.js:635`. | M3 | survey_1, survey_3 |
| F11 | E2E Testing Track (4-Tier Opaque-Box Requirement-Driven Test Suite) | Design and implement `TEST_INFRA.md`, `tools/e2e-test.js` (and/or modular verification scripts), and `TEST_READY.md` covering Tiers 1–4 across all inventoried features F1–F10 and requirements R1–R4. | E2E | survey_1, survey_2, survey_3 |
| F12 | Final Milestone: Full Static Regeneration, 100% E2E Pass (Tiers 1–4), Tier-5 Adversarial Hardening & `AUDIT_REPORT.md` | Regenerate all 201 static HTML pages (`npm run prerender`, `npm run stamp`, `npm run build`), pass `npm test` + `npm run stamp:check` + 100% of E2E tests (Tiers 1–4), execute Phase 2 Tier-5 white-box adversarial coverage hardening, and produce comprehensive `AUDIT_REPORT.md` in project root. | M4 | ORIGINAL_REQUEST |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| M1 | Interactive Simulators, Clause Visualizer, Sandbox & Challenges (`R2` + `R3-3`) | F1, F2, F3, F4, F5 — Touching `js/simulators.js`, `js/simulators-*.js` (6 files), `js/table-visualizer.js`, `js/sandbox.js`, `js/challenges.js`, `data/challenges.js` | none | DONE (`0d37bbee-60e9-4a22-8ae7-0abe4dbfd49d`) |
| M2 | UI/UX, Theme Parity, Guided Lab Formatting, Audio Fallback & Routing (`R1` + `R2 Bug 6` + `R3-1, R3-2, R3-4, R3-5a`) | F6, F7, F8, F9 — Touching `css/variables.css`, `css/tokens.css`, `js/app.js`, `js/renderer.js`, `js/404.js`, `js/search.js`, `js/landing.js`, `js/topic-codelab.js`, `404.html` | none (disjoint files from M1) | DONE (`14872693-98dd-4db3-a9c3-ff05cd8bdcf1`) |
| M3 | Build Pipeline Determinism, Local KaTeX Vendoring, `projects/index.html` Parity & Pre-rendering (`R4` + `R1 D4` + `R3-5b`) | F10 — Touching `js/vendor/katex/*`, `index.html`, `projects/index.html`, `tools/generate-static.js`, `tools/stamp-assets.js`, `tools/build.js`, `tools/validate.js`, `tools/check-rendered.js`, plus regenerating `topic/**`, `build/**`, `sitemap.xml`, `js/manifest.js`, `dist/**`, `AUDIT_REPORT.md` | M1, M2 (runs static generation after M1 & M2 JS/CSS changes) | DONE (`33b45179-5876-460b-a32e-8732038f5d6b`) |
| E2E | E2E Testing Track (4-Tier Requirement-Driven Suite) | F11 — Create `TEST_INFRA.md`, expand/build comprehensive 4-tier verification suite in `tools/e2e-test.js`, publish `TEST_READY.md` | none (runs in parallel with M1 & M2) | DONE (`7874dde5-dbb2-40d7-8cd9-4d5734722cbd`, 345/345 PASS) |
| M4 | Final Milestone: Phase 1 (100% E2E Tiers 1–4 Pass), Phase 2 (Tier 5 Adversarial Hardening) & `AUDIT_REPORT.md` | F12 — Pass 100% of E2E tests (Tiers 1–4), run Tier 5 white-box Challenger → Worker → Reviewer hardening loop, and write `AUDIT_REPORT.md` | M1, M2, M3, E2E | DONE (Gate PASS: `auditor_m4_1` CLEAN, `reviewer_m4_1` APPROVE, `reviewer_m4_2_r2` APPROVE, `challenger_m4_1` APPROVE, `challenger_m4_2` APPROVE; `AUDIT_REPORT.md` published) |

---

## Interface Contracts

### 1. Step Simulator Lifecycle & Preset Frames (`js/simulators.js` ↔ `js/simulators-*.js`)
- `lifecycle()` in `js/simulators.js:284-309`:
  - Exposes `after(ms, fn)`: schedules a `setTimeout`, tracks its ID in a `timeouts` Set, removes it when fired, and clears it in both `stop(id)` (via `clearTimeout(id); clearInterval(id);`) and `dispose()`.
- `buildInteractiveFrames(spec, preset)` across `js/simulators-{relational,analytical,modeling,indexing,transactions,olap-ops}.js`:
  - Reads `preset` parameters (`preset.minTotal`, `preset.mode`, or `preset.id !== spec.presets[0].id`) to deterministically adjust row filtering/statuses/metrics across the generated frames so selecting the second preset visibly alters the relational step frames and output table.
  - `buildInteractiveConfig(slug, spec)` sets `customInput: false` so the DSA array text box (`Custom array: e.g. 4, 2, 7, 1, 9, 3`) is not rendered on relational SQL simulators.

### 2. SQL Practice Chips & `/sandbox` Toolbar (`js/table-visualizer.js` ↔ `js/sandbox.js`)
- `TableVisualizer.SQL_PRACTICE_CHIPS` (`js/table-visualizer.js:650-663`):
  - Every chip snippet uses valid column names from `data/datasets.js` (`customers.name`, `orders.total_cents`, `employees.salary_usd`) and executes with `res.ok === true` on both SQLite 3 and PostgreSQL 18.
  - `buildPracticeChipsHtml()` sets `data-sql-chip="${escapeHtml(chip.id)}"`.
  - `js/sandbox.js:1955-1957` resolves `data-wb-sql-chip` via `chips.find(c => c.id === chipAttr) || chips[parseInt(chipAttr, 10)]`.
- `/sandbox` Toolbar (`js/sandbox.js`):
  - `[data-wb-ide-action]` handles both `'format'`/`'format-sql'`, `'copy'`/`'copy-sql'`, `'save-query'` (reading `#wb-sql-save-title-input` value first), and `'delete-saved'` (deleting the selected `saved:<id>` item in `#wb-sql-saved-history-select`).
  - `#wb-sql-saved-history-select` handles both `history:<id>` (matching `item.id`) and `hist:<idx>`.

### 3. Challenges Verification & Hotfix Callback (`data/challenges.js` ↔ `js/challenges.js` ↔ `js/table-visualizer.js` ↔ `js/app.js`)
- `TableVisualizer.verifyQueryAgainstReference(userSql, referenceSql, options)`:
  - When `options.buggyCode` (or `options.forbiddenSql`) is provided, adds a verification check that rejects `userSql` if its normalized SQL (trimmed, whitespace/case/semicolon-normalized) is identical to `options.buggyCode`, or if `options.requiredPattern` is not satisfied.
- `window.ChallengesController` (`js/challenges.js`):
  - Exposes `markCodeHotfixPassed(challengeId)` on its public return object (`js/challenges.js:682-687`) and calls `e.stopPropagation()` on `[data-action="open-challenge-codelab"]` (`js/challenges.js:604`).

### 4. Guided Builds, Inline Code Formatting & Audio Fallback (`js/app.js` ↔ `js/renderer.js`)
- `getTopicLabSpec(slug)` (`js/app.js:2388`) and `Renderer.renderBuild(buildId)` (`js/renderer.js:1059`):
  - Resolve `const topicSlug = window.TOPIC_GUIDED_LABS?.[slug] ? slug : (window.IMPLEMENTATIONS_DATA?.[slug]?.primarySlug || slug)` so `/build/<buildId>` pages load the real 3-step SQL lab for their `primarySlug`.
- Inline Code Formatting:
  - `js/app.js:2320, 2523`, `js/renderer.js:1892`, and `js/challenges.js:313` convert Markdown `` `code` `` spans into `<code>code</code>` after HTML escaping.
- Lesson Audio Narration (`window.toggleAudio(slug)` in `js/renderer.js:1618-1648`):
  - If `<audio>` fails to load `/audio/${slug}.mp3` (or when `speechSynthesis` fallback is triggered), falls back gracefully to `window.speechSynthesis` (or cleanly notifies/narrates without unhandled promise rejections or console errors).

---

## Code Layout

| File / Directory | Exclusive Write Owner Milestone | Purpose |
|---|---|---|
| `js/simulators.js`, `js/simulators-relational.js`, `js/simulators-analytical.js`, `js/simulators-modeling.js`, `js/simulators-indexing.js`, `js/simulators-transactions.js`, `js/simulators-olap-ops.js` | M1 | Interactive step simulator engine & 36 domain simulators |
| `js/table-visualizer.js` | M1 | Clause-by-clause SQL visualizer, practice chips, and query verification |
| `js/sandbox.js` | M1 | `/sandbox` SQL Studio & Architecture Capacity Sandbox |
| `js/challenges.js`, `data/challenges.js` | M1 | `/challenges` Incident War-Room controller and challenge scenarios |
| `css/variables.css`, `css/tokens.css` | M2 | Theme custom properties (`--bg-tertiary` in dark/light) & dead token file cleanup |
| `js/app.js`, `js/renderer.js`, `js/404.js`, `js/search.js`, `js/landing.js`, `404.html` | M2 | SPA router, theme toggle, build lab resolution, inline backtick formatting, audio fallback, 404 page & `?q=` search |
| `js/vendor/katex/*`, `index.html`, `projects/index.html`, `tools/generate-static.js`, `tools/stamp-assets.js`, `tools/build.js`, `tools/validate.js`, `tools/check-rendered.js`, `topic/**`, `build/**`, `sitemap.xml`, `js/manifest.js`, `dist/**` | M3 | Local KaTeX JS vendoring, `projects/index.html` parity, build/prerender/stamp pipeline, and regenerated static HTML |
| `TEST_INFRA.md`, `tools/e2e-test.js`, `TEST_READY.md` | E2E | 4-Tier requirement-driven E2E verification suite |
| `AUDIT_REPORT.md` | M4 | Comprehensive production-readiness audit and verification report |
