# SQL In Depth — Architecture

SQL In Depth is a static-first, progressive-enhancement web application that runs relational SQL engines, query plan analyzers, and storage-engine simulators inside the visitor's browser with zero backend servers.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     Pre-Rendered Static HTML (218 Pages)                   │
│   /  ·  /topic/<slug>/  ·  /build/<id>/  ·  /sandbox/  ·  /challenges/     │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼──────────────────────────────────────┐
│                   Progressive Client Shell (js/bootstrap.js)               │
│  ┌─────────────────────┐  ┌───────────────────────┐  ┌──────────────────┐  │
│  │ Curriculum Router   │  │ Clause-by-Clause      │  │ 36 Storage &     │  │
│  │ & Search (js/app.js)│  │ Table Visualizer      │  │ MVCC Simulators  │  │
│  └─────────────────────┘  └───────────┬───────────┘  └──────────────────┘  │
└───────────────────────────────────────┼────────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼────────────────────────────────────┐
│                Dedicated SQL Web Worker (js/sql-worker.js)                 │
│  • SQLite 3 WebAssembly (sql.js) — instant default (<80ms cold boot)       │
│  • PostgreSQL 18 WebAssembly (@electric-sql/pglite) — lazy on-demand boot  │
│  • 5 Deterministic Relational Schemas (26 tables, 172 seeded rows)         │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Directory Structure

| Path | Responsibility |
| :--- | :--- |
| `design-system/` | Shared CSS design tokens (`tokens.css`) and semantic components (`components.css`) used across the In-Depth series |
| `css/` | Product layout, responsive shell, SQL workbench, landing page, and simulator stylesheets |
| `data/curriculum.js` | 6-track, 18-module, 180-unit curriculum DAG and unit metadata |
| `data/content/` | Per-module (`m01`–`m18`) intuition primers, prose lessons, diagrams, takeaways, and primary-source citations |
| `data/questions/` | Per-module concept checks, query output predictors, and engineering trade-off questions |
| `data/datasets.js` | Five synthetic relational schemas (`ecommerce`, `org_hr`, `fintech_ledger`, `saas_telemetry`, `social_graph`) |
| `data/topic_guided_labs.js` | 180 progressive 3-step Guided SQL Labs (540 verified steps across SQLite 3 and PostgreSQL 18) |
| `data/implementations_code.js` | 18 standalone reference storage-engine implementations and walkthrough guides |
| `data/challenges.js` | 12 incident diagnostic challenges with buggy vs reference SQL verification |
| `js/sql-engine.js` & `js/sql-worker.js` | Dual-engine SQL execution coordinator, Web Worker bridge, schema introspection, and SQL error hints |
| `js/table-visualizer.js` | Logical SQL clause parser, 3-valued logic (`TRUE`/`FALSE`/`UNKNOWN`) pipeline, CodeMirror 6 integration, and result verifier |
| `js/simulators*.js` | Lifecycle-managed step simulators for B+Trees, slotted pages, joins, MVCC snapshots, locks, and OLAP execution |
| `tools/` | Static site generator (`generate-static.js`), OG card renderer (`generate-og.js`), asset stamper (`stamp-assets.js`), bundler (`build.js`), and validators (`validate.js`, `check-rendered.js`, `e2e-test.js`) |

---

## 2. Static Pre-Rendering & Progressive Hydration

1. **Build-Time Pre-Rendering (`tools/generate-static.js`)**:
   - Evaluates `Renderer.renderLesson(slug)` and `Renderer.renderBuild(buildId)` inside a deterministic Node VM with KaTeX pre-typesetting.
   - Emits standalone `index.html` directories for all 180 `/topic/<slug>/` units, 18 `/build/<id>/` capstones, 12 `/challenges/<id>/` rooms, and 6 hub routes (`/roadmap/`, `/challenges/`, `/sandbox/`, `/dashboard/`, `/glossary/`, `/projects/`), avoiding SPA rewrite redirect loops on static hosts.
2. **Idle-Scheduled Client Hydration (`js/bootstrap.js`, `js/lazy.js`)**:
   - Initial paint requires only self-hosted stylesheets, Geist `.woff2` fonts, `js/init.js` (theme restoration before paint), and `js/manifest.js`.
   - Route-heavy bundles (SQL WASM engines, CodeMirror 6, simulators, guided lab specs, and `@innovatorved/code-lab`) load lazily via `IntersectionObserver` or route activation using content-addressed `?v=<hash>` URLs.

---

## 3. Dual-Engine SQL Verification Pipeline

- Every Guided SQL Lab step defines a runnable `starterCode` query, a coaching `hint`, and a `solutionCode` reference query.
- `TableVisualizer.verifyQueryAgainstReference` executes both queries in an isolated dataset transaction and checks four invariants: syntax/execution validity, column count and schema parity, tuple row count, and deterministic cell values.
- `tools/e2e-test.js` executes all 540 `starterCode` and 540 `solutionCode` queries across **both** SQLite 3 (`sql.js`) and PostgreSQL 18 (`@electric-sql/pglite`) to guarantee cross-dialect parity.
