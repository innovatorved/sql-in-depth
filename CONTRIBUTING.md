# Contributing to SQL In Depth

Thank you for contributing to SQL In Depth! Whether you are fixing a query edge case, clarifying a storage-engine explanation, improving accessibility, or adding a simulator preset, contributions are welcome.

## Prerequisites

- **Node.js** `>= 20`
- **Python 3** (optional, used only by `npm run serve` for local static preview)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start a local static server at http://localhost:8000
npm run serve

# 3. After editing content, templates, CSS, or JS, regenerate static pages and asset hashes
npm run prerender
npm run stamp

# 4. Run validation and end-to-end test gates
npm test
npm run e2e
npm run build
```

## Contribution Guidelines

1. **Dual-Engine SQL Compatibility (SQLite 3 + PostgreSQL 18)**:
   - Interactive SQL examples, Incident Challenges (`data/challenges.js`), and Guided SQL Labs (`data/topic_guided_labs.js`) run against both `sql.js` (SQLite 3) and `@electric-sql/pglite` (PostgreSQL 18).
   - Ensure `starterCode` is runnable SQL that differs meaningfully from `solutionCode`, and write `hint` text that coaches the learner on *which clause or invariant to apply* rather than pasting the completed query.
2. **Primary-Source Citations**:
   - `furtherReading` links in `data/content/m*.js` must point to primary documentation and peer-reviewed database literature (PostgreSQL docs, SQLite docs, CMU 15-445 notes, VLDB/SIGMOD papers, RFCs). `tools/validate.js` rejects content-farm domains.
3. **Design System & Accessibility**:
   - Use semantic CSS custom properties from `design-system/tokens.css` and `css/variables.css` so every component adapts cleanly between Warm Neutral Paper (`[data-theme="light"]`) and Neutral Charcoal (`[data-theme="dark"]`) with WCAG AA contrast (`>= 4.5:1`).
   - Keep interactive controls keyboard accessible (`<button type="button">`, `:focus-visible`, valid ARIA roles) and respect `prefers-reduced-motion: reduce`.
4. **Static Pre-Render & Asset Stamps**:
   - Whenever you change `index.html`, `js/renderer.js`, `data/*`, or any CSS/JS asset, run `npm run prerender && npm run stamp` before committing so pre-rendered HTML and `?v=` cache-busting hashes stay synchronized.

## Pull Request Checklist

- [ ] `npm run prerender` and `npm run stamp` have been run if HTML, CSS, JS, or curriculum data changed.
- [ ] `npm test` (`tools/validate.js` and `tools/check-rendered.js`) passes with 0 errors.
- [ ] `npm run stamp:check` passes.
- [ ] `npm run e2e` passes all 4 tiers across SQLite 3 and PostgreSQL 18.
- [ ] `npm run build` succeeds cleanly.
