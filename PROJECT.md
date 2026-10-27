# Project: SQL In Depth — Interactive Relational Database & SQL Mastery Platform

**SQL In Depth** (`https://sql-in-depth.vedgupta.in`) is an interactive, first-principles relational database and SQL mastery platform. It takes learners from foundational relational algebra and `SELECT` queries to Window Functions, Recursive CTEs, Normalization (1NF–5NF), Star Schemas, B+Tree Indexing, Cost-Based Query Optimization (`EXPLAIN ANALYZE`), ACID Concurrency & MVCC Internals, 8KB Slotted Pages & WAL Recovery, Columnar OLAP (DuckDB / ClickHouse / Parquet), and Distributed NewSQL.

## 1. Non-Negotiable Architectural Invariants

1. **Zero-Framework, Zero-Runtime-Bundler Static Architecture**:
   - Pure semantic HTML5, CSS custom properties (`css/variables.css`, `css/layout.css`, `css/components.css`, `css/content.css`, `css/landing.css`, `css/simulators.css`), and vanilla ES2022 JavaScript (`window.*` namespaces).
   - Self-hosted `Geist` and `Geist Mono` variable fonts (`fonts/geist-latin.woff2`, `fonts/geist-mono-latin.woff2`).
2. **Browser-Native Dual WebAssembly SQL Execution (`@electric-sql/pglite` PostgreSQL 18 + `sql.js` SQLite 3)**:
   - Vendored PostgreSQL 18 WASM (`js/vendor/pglite/pglite.bundle.js`, `pglite.wasm`, `pglite.data`) and SQLite 3 WASM (`js/vendor/sql-wasm.js` + `js/vendor/sql-wasm.wasm`) managed by `js/sql-engine.js`, with polyglot PostgreSQL/SQLite dialect normalization and real `EXPLAIN QUERY PLAN` / execution plan introspection.
   - Pre-loaded with 5 rich production relational schemas (`ecommerce`, `org_hr`, `fintech_ledger`, `saas_telemetry`, `social_graph`) in `data/datasets.js` (26 disjoint base tables, 182 total seeded rows) plus the 26-table Unified Sandbox (`__unified__`).
3. **Interactive Clause-by-Clause Table-Level Visualizer (`js/table-visualizer.js`)**:
   - Decomposes and animates any SQL query step by step in logical execution order (`FROM/JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `WINDOW` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT/OFFSET`), rendering live intermediate tables, matched/filtered row highlights, Three-Valued Logic (`TRUE`/`FALSE`/`NULL`) badges, sliding window frames, and `EXPLAIN QUERY PLAN` operator trees.
4. **Complete 6-Track, 18-Module, 180-Unit Curriculum + 18 Build Labs**:
   - 6 Tracks, 18 Modules (`m01`–`m18`), 180 Units (10 units per module: 8 progressive technical lessons + 1 real-world production case study `case-*` + 1 hands-on capstone build `build-*`).
   - 18 Capstone Build Projects (`build-*`) with both 3-step Guided SQL Labs (`data/topic_guided_labs.js`) and 4-step JS/Engine Implementation Labs (`data/guided_labs.js`, `data/implementations_code.js`).
5. **Static Pre-Rendering & Strict QA Gates**:
   - `node tools/generate-static.js` pre-renders all 180 `/topic/<slug>/index.html` pages, all 18 `/build/<id>/index.html` pages, `index.html`, and `sitemap.xml`.
   - `node tools/stamp-assets.js` stamps deterministic 8-char SHA-256 hashes (`?v=<hash>`) across all 201 HTML entrypoints and `js/manifest.js`.
   - `node tools/validate.js` and `node tools/check-rendered.js` enforce zero errors before deployment.

---

## Architecture

- **Boot & Routing Layer (`index.html`, `js/init.js`, `js/manifest.js`, `js/bootstrap.js`, `js/lazy.js`, `js/app.js`)**:
  - Supports both SPA navigation (`/`, `/?view=...`, `#...`, `/sandbox`, `/challenges`, `/roadmap`, `/dashboard`, `/projects`) and direct landing on 198 pre-rendered static HTML pages (`/topic/<slug>/index.html` and `/build/<id>/index.html`).
- **Dual WASM SQL Engine & Datasets (`js/sql-engine.js`, `data/datasets.js`)**:
  - `window.SQLEngine` manages `postgres` (PGlite WASM) and `sqlite` (`sql.js` WASM) execution, schema introspection, query verification, and compatibility functions.
- **Clause Visualizer & Inline Runner (`js/table-visualizer.js`)**:
  - `window.TableVisualizer` mounts inline `.sql-runner` blocks in lessons, the landing Hero SQL Playground, the 3-step Guided SQL Lab execution workbench, and the Full-Screen SQL Studio Modal workbench.
- **View Controllers & Renderers (`js/renderer.js`, `js/sandbox.js`, `js/challenges.js`, `js/roadmap.js`, `js/dashboard.js`, `js/simulators*.js`)**:
  - Render lessons, builds, cheat sheets, full-page SQL Studio & Architecture Sandbox, Incident War-Room Challenges, Roadmap, and Dashboard.

---

## Feature Inventory

Every feature and issue discovered in the Phase 0 Survey (across `explorer_survey_1`, `explorer_survey_2_gen2`, and `explorer_survey_3`) is inventoried below and assigned to a milestone:

| # | Feature / Requirement Item | Description | Milestone | Source |
|---|----------------------------|-------------|-----------|--------|
| F1 | Async `SQLEngine.setEngineMode` & `init` | Return a Promise from `SQLEngine.setEngineMode(mode)` and await `initPglite()` when switching to or executing on `'postgres'`, fixing the `TypeError: ...setEngineMode(...).then is not a function` in `/sandbox` (`js/sandbox.js:2111`, `js/sql-engine.js:88-99`). | M1 | survey_1, survey_2 |
| F2 | Eliminate PGlite Browser Startup Race | Fix `SQLEngine.execute()` (`js/sql-engine.js:829-836`) so `forceEngine === 'postgres'` awaits `initPglite()` instead of silently falling back to SQLite 3 while `_pgDb` is still loading in browser. | M1 | survey_1, survey_2 |
| F3 | PostgreSQL 18 `instr(text, text)` Compatibility | Add `CREATE OR REPLACE FUNCTION instr(text, text) RETURNS integer AS $$ SELECT pg_catalog.strpos($1, $2); $$ LANGUAGE SQL IMMUTABLE;` in `initPglite()` (`js/sql-engine.js:239-243`) so `chal-05-recursive-cte-cycle-loop` and user queries using `INSTR()` pass in PostgreSQL 18. | M1 | survey_2 |
| F4 | Dataset FK Metadata (`customers.referred_by`) & `introspectSchema` Filter | Add `fks: ['referred_by -> customers.customer_id']` and `"fk": "customers.customer_id"` on `customers.referred_by` in `data/datasets.js:75`; filter `introspectSchema(datasetId)` in `js/sql-engine.js:965-1016` by `SQL_DATASETS[datasetId].tables` when not `__unified__`. | M1 | survey_2 |
| F5 | Clause Visualizer 3VL `WHERE` Verdict, `__unified__` Tables, Scoped PK/FK Badges & Positional `GROUP BY` | In `js/table-visualizer.js`: (a) compute `CASE WHEN NOT (<where>) THEN '✗ FALSE (Pruned)' ELSE '∅ UNKNOWN / NULL (Pruned)' END` in SQL (lines 689-708); (b) return all 26 tables in `getDatasetTableNames('__unified__')` (lines 95-99); (c) scope PK/FK badges in `renderStepTable` to `step.sourceTables` so shared columns don't collide (lines 1018-1027); (d) resolve positional `GROUP BY 1, 2` against `parsed.select` projections (lines 724-730). | M1 | survey_2 |
| F6 | Clause Visualizer Light-Theme Inline Styles | Replace undefined `var(--bg-secondary,#0f172a)`, `var(--bg-primary,#0b0f19)`, `var(--text-primary,#f8fafc)`, `var(--text-secondary,#94a3b8)` and hardcoded `#f8fafc`/`#cbd5e1` in `js/table-visualizer.js:1185-1236` with valid `variables.css` tokens (`var(--bg-elevated)`, `var(--bg-surface)`, `var(--fg)`, `var(--fg-muted)`). | M1 | survey_3 |
| F7 | Lesson Header "Run SQL Studio" CTA & Cheat Sheet SPA Link | In `js/renderer.js:795-802`, add `▶ Run SQL Studio` button (`data-action="open-topic-codelab" data-slug="${slug}" data-mode="modal"`) to `.lesson-header__actions`, and add `data-action="navigate-cheatsheet" data-module="${mod.id}"` to `📄 Cheat Sheet` link (`js/app.js` handler) to prevent full-page reload on static pages. | M2 | survey_1 |
| F8 | Cheat Sheet `▶ Launch SQL Lab` Event Wiring | Wire `[data-open-topic-lab]` in `js/app.js` global click handler so clicking `▶ Launch SQL Lab` on any module Cheat Sheet opens the topic's interactive SQL Studio lab. | M2 | survey_1 |
| F9 | Guided SQL Lab Step Completion Badge Selector Fix | In `js/app.js:2310` (`mountInlineTopicSqlLab`), update `.build-lab-step-card[data-step-idx="${activeStepIdx}"]` to `.build-lab-step-card[data-step="${activeStepIdx}"], .build-lab-step-card[data-step-index="${activeStepIdx}"]` so completed steps show `✓` and `.is-completed`. | M2 | survey_1 |
| F10 | Static `/build/<id>/` Inline SQL Lab Hydration & Build Step Card Routing | In `js/app.js:409-424`, call `mountInlineTopicSqlLab(prerenderedBuildId, reader)` on static build page load; in `js/renderer.js:1132-1161`, wire the 3 SQL lab step cards & SQL Lab buttons to `data-action="open-topic-codelab" data-slug="${buildId}"` while preserving JS Engine Implementation IDE access (`open-code-lab`); fix `openBuildLab` in `js/app.js:910-949`; ensure `implementations_code.js` is available on SPA navigation from static topic pages (`tools/generate-static.js` / `js/renderer.js`). | M2 | survey_1, survey_2 |
| F11 | Schema Explorer `PK`/`FK` Badges & 26-Table Count in Sandbox & Modal | Render `PK` (`Boolean(col.pk) || t.pk === colName`) and `FK` (`Boolean(col.fk)`) badges in both `js/sandbox.js:896-905` and `js/app.js:2565`; update `js/sandbox.js:1140` badge from `27 Tables` to `26 Tables`; sync dataset when clicking table preview in `js/sandbox.js:1791-1802`; update `NODE_TYPE_TO_CODELAB` (`js/sandbox.js:22-56`) and `_evaluateRubricAudit` (`js/sandbox.js:1601-1628`) to match the 18 SQL Build Labs and SQL node types. | M2 | survey_1, survey_2, survey_3 |
| F12 | Fix KaTeX `$` Currency Regex Corruption in Simulator `<select>` Options | In `js/renderer.js:907` (`renderMathInHtml`), prevent `$ ... $` from matching across HTML tags `<` or `>` or matching currency values like `$120 ... $300` across `<option>` tags. | M2 | survey_1 |
| F13 | CSS Light-Theme Overrides & Legacy Copy Cleanup (`roadmap.js`, `dashboard.js`, `app.js`, `challenges.js`) | In `css/components.css:5501`, replace `var(--bg-secondary)` with `var(--bg-elevated)`; in `css/simulators.css`, add `[data-theme="light"]` overrides for `.dsa-sim__visual-canvas`, `.dsa-sim__log`, `.dsa-sim__log-entry`, `.sql-rel-table th`, `.invariant-box`, `.invariant-box__text`, `.hardware-box`, `.hardware-box__text`; update legacy DSA headings/copy in `js/roadmap.js:121`, `js/dashboard.js:343, 457-711`, `js/app.js:145-160, 1397-1405`, and `js/challenges.js:474-487`. | M2 | survey_3 |
| F14 | Static Site Regeneration, Asset Stamping, Browser E2E Verification & Cloudflare Deployment | Regenerate all static HTML pages (`node tools/generate-static.js`), stamp assets (`node tools/stamp-assets.js`), pass `tools/validate.js` + `tools/check-rendered.js` + full headless browser E2E test suite (`TEST_READY.md`), commit, push to `origin/main`, and deploy to Cloudflare Pages (`sql-in-depth`). | M3 | survey_1, survey_2, survey_3 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| M1 | SQL Engine, Datasets & Clause Visualizer Core (`R1/R2`) | F1, F2, F3, F4, F5, F6 — Touching `data/datasets.js`, `js/sql-engine.js`, `js/table-visualizer.js` | none | DONE (`worker_m1_1` verified) |
| M2 | Interactive SQL Studio Entry Points, Static Hydration & UI/UX Polish (`R1/R3/R4`) | F7, F8, F9, F10, F11, F12, F13 — Touching `js/app.js`, `js/renderer.js`, `js/sandbox.js`, `js/roadmap.js`, `js/dashboard.js`, `js/challenges.js`, `css/components.css`, `css/simulators.css`, `tools/generate-static.js` | none (disjoint files from M1) | DONE (`worker_m2_1` verified) |
| E2E | E2E Testing Track (Opaque-Box Programmatic & Real Headless Browser Suite) | Design & implement comprehensive 4-tier E2E test suite (`TEST_INFRA.md`, `tools/e2e-test.js`, `TEST_READY.md`) testing all R1-R4 requirements and acceptance criteria | none (runs in parallel with M1 & M2) | DONE (`test_writer_e2e_1_gen2`: 165/165 passing) |
| M3 | Final Milestone: Static Site Regeneration, 100% E2E Pass, Tier-5 Adversarial Hardening & Cloudflare Deployment | F14 — Run `node tools/generate-static.js && node tools/stamp-assets.js`, pass 100% of E2E tests (Tiers 1-4) + Tier 5 adversarial coverage hardening, commit, push to `origin/main`, and deploy to Cloudflare Pages (`sql-in-depth`) | M1, M2, E2E | IN_PROGRESS (Phase 1 static build done; running Reviewers, Challengers, Auditor & Deploy) |

---

## Interface Contracts

### `window.SQLEngine` (`js/sql-engine.js`) ↔ View Controllers (`js/app.js`, `js/sandbox.js`, `js/table-visualizer.js`, `js/challenges.js`)
- `SQLEngine.setEngineMode(mode: 'postgres' | 'sqlite'): Promise<'postgres' | 'sqlite'>`:
  - Sets `_engineMode`, persists to `localStorage`, and returns a `Promise` that resolves to `_engineMode` once the selected engine (`initPglite()` for `'postgres'`, `initSqlite()` for `'sqlite'`) is initialized (falling back gracefully to SQLite if PGlite fails).
  - Synchronous callers that ignore the return value continue to work; async callers using `.then(...)` or `await` receive a valid Promise.
- `SQLEngine.execute(sql: string, datasetId?: string, options?: { engine?: 'postgres' | 'sqlite' }): Promise<ExecutionResult>`:
  - When `forceEngine === 'postgres'`, awaits `executePostgres(sql, dsId)` (which internally awaits `initPglite()`) regardless of whether `_pgDb` was already initialized before the call. Only falls back to `executeSqlite(sql, dsId)` if `executePostgres` returns `null` (i.e. PGlite failed to initialize).
- `SQLEngine.introspectSchema(datasetId?: string): Promise<TableSchema[]>`:
  - When `datasetId` is a specific dataset in `window.SQL_DATASETS` (and not `'__unified__'`), filters returned tables to those defined in `window.SQL_DATASETS[datasetId].tables`.

### `window.TableVisualizer` (`js/table-visualizer.js`) ↔ `window.SQL_DATASETS` (`data/datasets.js`)
- `getDatasetTableNames(datasetId)`:
  - When `datasetId === '__unified__'` or not a specific single dataset, returns all 26 table names across all 5 datasets in `window.SQL_DATASETS`.
- `buildStepPipeline(sql, datasetId, options)`:
  - Step 3 (`WHERE` filter) computes pruned row 3VL verdicts via SQL `CASE WHEN NOT (<where>) THEN '✗ FALSE (Pruned)' ELSE '∅ UNKNOWN / NULL (Pruned)' END`.
  - Step 4 (`GROUP BY`) resolves positional ordinals (`GROUP BY 1, 2`) against `parsed.select` columns.
- `renderStepTable(step, datasetId)`:
  - Scopes `pkSet` and `fkMap` to `step.sourceTables` (when present) so PK columns in parent tables do not simultaneously display FK badges from child tables.

### Lesson, Build & Cheat Sheet DOM Contracts (`js/renderer.js` ↔ `js/app.js`)
- Lesson header (`.lesson-header__actions`):
  - Includes `<button type="button" class="btn btn--secondary btn--sm" data-action="open-topic-codelab" data-slug="${slug}" data-mode="modal">▶ Run SQL Studio</button>`.
  - Cheat sheet link uses `data-action="navigate-cheatsheet" data-module="${mod.id}"` handled in `js/app.js` without full-page reload.
- Cheat Sheet topic cards (`renderCheatSheet`):
  - `[data-open-topic-lab]` click is handled in `js/app.js` to open the topic's interactive SQL Studio lab (`openTopicCodeLab(slug, { mode: 'modal' })`).
- Guided SQL Lab step cards (`.build-lab-step-card`):
  - Uses `data-step="${idx}" data-step-index="${idx}"` and is matched in `js/app.js` via `.build-lab-step-card[data-step="${activeStepIdx}"], .build-lab-step-card[data-step-index="${activeStepIdx}"]`.

---

## Code Layout

| File / Directory | Exclusive Write Owner Milestone | Purpose |
|---|---|---|
| `data/datasets.js` | M1 | 5 production relational datasets (26 tables, DDL, seed rows, PK/FK metadata, sample queries) |
| `js/sql-engine.js` | M1 | Dual WASM SQL engine (`@electric-sql/pglite` PG18 + `sql.js` SQLite 3) |
| `js/table-visualizer.js` | M1 | Interactive 8-stage SQL clause visualizer, inline `.sql-runner` enhancer, and hero playground |
| `js/app.js` | M2 | SPA router, static hydration (`topic` & `build`), inline 3-step Guided SQL Lab, Full-Screen SQL Studio Modal |
| `js/renderer.js` | M2 | HTML renderer for lessons, builds, module overviews, cheat sheets, and KaTeX math |
| `js/sandbox.js` | M2 | Full-page Interactive SQL Studio (`/sandbox`) and Architecture Capacity Sandbox |
| `js/roadmap.js`, `js/dashboard.js`, `js/challenges.js` | M2 | Roadmap view, Dashboard & Capacity Toolkit view, Incident War-Room Challenges view |
| `css/components.css`, `css/simulators.css` | M2 | Component & simulator stylesheets including `[data-theme="light"]` overrides |
| `tools/generate-static.js` | M2 | Static site generator for 180 topic pages + 18 build pages |
| `tools/e2e-test.js`, `TEST_INFRA.md`, `TEST_READY.md` | E2E | Automated E2E verification suite (programmatic SQL + headless browser DOM verification) |
| `topic/**`, `build/**`, `index.html`, `js/manifest.js`, `dist/**` | M3 | Generated static HTML artifacts, stamped asset hashes, and production build bundle |
