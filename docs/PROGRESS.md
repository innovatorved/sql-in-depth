# Autonomous Overhaul Progress (`docs/PROGRESS.md`)

**Repository**: `sql-in-depth` (`https://sql-in-depth.vedgupta.in`)  
**Working Branch**: `feat/ui-overhaul`

---

## Done
- [x] **Phase 0.1 — `fanout.sh` Product Teardown**: Live desktop + mobile inspection of `fanout.sh` home, course overviews, lesson anatomy, video explainers, and interactive labs documented in [fanout-teardown.md](research/fanout-teardown.md).
- [x] **Phase 0.2 — Modern Web & Craft Research**: Applied Impeccable (`init`, `craft-floor`, `new-work`) and Modern Web Guidance (`dark-mode`, `sortable-table`, `tabs`, `defer-rendering-heavy-content`, `performance`, `accessibility`, `color`) plus Web-Perf guidelines. Created [PRODUCT.md](../PRODUCT.md).
- [x] **Phase 0.3 — License & Provenance Inventory**: Verified permissive licenses (`MIT`, `Apache-2.0`, `OFL-1.1`) and strict copyright boundaries in [licenses.md](licenses.md).
- [x] **Phase 0.4 — Baseline Audit & Screenshots**: Captured 32 desktop/mobile light/dark screenshots + mobile Lighthouse baseline (`Perf 49/46`, `A11y 91/84`, `TBT 3,730ms`, `22.7 MB` payload) with P0/P1/P2 remediation plan in [audit.md](research/audit.md) and architectural choices in [DECISIONS.md](../DECISIONS.md).
- [x] **Phase 1 — Portable Shared Design System (`design-system/` + `css/` + `DESIGN.md`)**: Implemented portable design tokens (`light`/`dark` surfaces, Precision Cobalt `#0F62FE` SQL accent + sibling presets, `Geist` + `Geist Mono`, spacing, radius, motion), `68ch` reading measure, WCAG AA contrast (`>= 5.3:1`), accessible shell, sticky right TOC, callouts, code blocks, share button, and 3-product family footer.
- [x] **P0 Performance & Shell Accessibility Unblocking**: Self-hosted KaTeX CSS + 20 `.woff2` fonts (`0` CDN round-trips), partitioned scripts into 11 lightweight shell scripts + 28 route-scoped `data-lazy` bundles, eliminated eager 18 MB PGlite boot on initial paint, fixed `role="tablist"` ARIA children, added form `aria-label`s, and silenced localhost/offline GA4 errors.
- [x] **Phase 3 — SQL Playground Overhaul (`/sandbox` + Embedded Runners)**:
  - Dedicated Web Worker SQL engine (`js/sql-worker.js` + `js/sql-engine.js`) with `<60ms` SQLite WASM default + on-demand PostgreSQL 18.6 PGlite WASM and pedagogical SQL error hints.
  - Bundled CodeMirror 6 (`js/vendor/cm6-sql.js`) with SQL syntax highlighting, schema-aware table/column/PK/FK autocomplete, error squiggle diagnostics, `Cmd/Ctrl+Enter` execution, and SQL formatter.
  - Fixed comment-offset parser bug in `TableVisualizer.parseSelectClauses`, added accessible sortable result columns (`aria-sort` + `NULLS LAST`), hierarchical visual `EXPLAIN` plan tree + SARGability advisor, collapsible mobile schema browser with `+ Insert`, integrated 12-challenge auto-grader tab, and base64url shareable query links (`?q=...`).

## In Progress
- [ ] **Phase 2 & Phase 4 — Content Experience Upgrade, Video Curation & 5 Flagship Original Explainer Videos**: Curating `data/topic_videos.json` & `m01..m18.js`, generating 5 original diagrammatic `.mp4` videos + `.vtt` captions + `.webp` posters, fixing prose splices, and upgrading `Renderer.renderLesson` to the new structured template.

## Remaining
- [ ] **Phase 5 — Landing Page, Shareability & Per-Page OG Cards**: Above-the-fold live interactive SQL Playground on `/`, "Continue where you left off", automated `1200×630` OG/Twitter images per page, pre-rendered hub `index.html` routes (`generate-static.js` shell sync), Share buttons across lessons/playground/challenges.
- [ ] **Final Verification & Merge**: `npm run build`, `npm test`, `npm run stamp:check`, `node tools/e2e-test.js`, `impeccable detect`, Playwright light/dark desktop/mobile audit (with `after` screenshots), mobile Lighthouse (`Perf ≥ 90`, `A11y ≥ 95`, `SEO ≥ 95`), merge `feat/ui-overhaul` -> `main`, push.
