# Autonomous Overhaul Progress (`docs/PROGRESS.md`)

**Repository**: `sql-in-depth` (`https://sql-in-depth.vedgupta.in`)  
**Working Branch**: `feat/ui-overhaul`

---

## Done
- [x] **Phase 0.1 — `fanout.sh` Product Teardown**: Live desktop + mobile inspection of `fanout.sh` home, course overviews, lesson anatomy, video explainers, and interactive labs documented in [fanout-teardown.md](research/fanout-teardown.md).
- [x] **Phase 0.2 — Modern Web & Craft Research**: Applied Impeccable (`init`, `craft-floor`, `new-work`) and Modern Web Guidance (`dark-mode`, `sortable-table`, `tabs`, `defer-rendering-heavy-content`, `performance`, `accessibility`, `color`) plus Web-Perf guidelines. Created [PRODUCT.md](../PRODUCT.md).
- [x] **Phase 0.3 — License & Provenance Inventory**: Verified permissive licenses (`MIT`, `Apache-2.0`, `OFL-1.1`) and strict copyright boundaries in [licenses.md](licenses.md).
- [x] **Phase 0.4 — Baseline Audit & Screenshots**: Captured 32 desktop/mobile light/dark screenshots + mobile Lighthouse baseline (`Perf 49/46`, `A11y 91/84`, `TBT 3,730ms`, `22.7 MB` payload) with P0/P1/P2 remediation plan in [audit.md](research/audit.md) and architectural choices in [DECISIONS.md](../DECISIONS.md).

## In Progress
- [ ] **Phase 1 — Portable Shared Design System (`design-system/` + `css/` + `DESIGN.md`)**: Tokens, typography, WCAG AA contrast, accessible shell, sticky right TOC, callouts, code blocks, quiz cards, share button, and footer.

## Remaining
- [ ] **P0 Performance & Accessibility Unblocking**: Route-split lazy script loading, self-hosted KaTeX, ARIA/heading/contrast/label/target-size fixes, zero console errors.
- [ ] **Phase 3 — SQL Playground Overhaul**: Web Worker dual SQL engine (`sql.js` default + on-demand `PGlite`), CodeMirror 6 bundle (SQL syntax, schema autocomplete, error underlines, `Cmd/Ctrl+Enter`, formatter), accessible sortable results table + CSV export, collapsible mobile schema panel, visual `EXPLAIN` plan tree, Challenges mode, and compressed shareable query URLs (`?q=...`).
- [ ] **Phase 2 — Content Experience Upgrade**: Fanout-caliber lesson structure across all 180 lessons, prose splice cleanup, distinct interactive visuals for M01 topics, zero horizontal overflow, curated English external video references.
- [ ] **Phase 4 — Flagship Original Explainer Videos**: 5 programmatic original videos (`assets/videos/*`) with narration, `.vtt` WebVTT captions, `.webp` posters, `< 800 KB` payloads, transcripts, and `tools/generate-videos.js`.
- [ ] **Phase 5 — Landing Page, Shareability & Per-Page OG Cards**: Above-the-fold live interactive SQL Playground on `/`, "Continue where you left off", automated `1200×630` OG/Twitter images per page, pre-rendered hub `index.html` routes, Share buttons across lessons/playground/challenges.
- [ ] **Final Verification & Merge**: `npm run build`, `npm test`, `npm run stamp:check`, `node tools/e2e-test.js`, `impeccable detect`, Playwright light/dark desktop/mobile audit (with `after` screenshots), mobile Lighthouse (`Perf ≥ 90`, `A11y ≥ 95`, `SEO ≥ 95`), merge `feat/ui-overhaul` -> `main`, push.
