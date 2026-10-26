# SQL In Depth — Project Specification & Architectural Invariants

**SQL In Depth** (`https://sql-in-depth.vedgupta.in`) is an interactive, first-principles relational database and SQL mastery platform. It takes learners from foundational relational algebra and `SELECT` queries to Window Functions, Recursive CTEs, Normalization (1NF–5NF), Star Schemas, B+Tree Indexing, Cost-Based Query Optimization (`EXPLAIN ANALYZE`), ACID Concurrency & MVCC Internals, 8KB Slotted Pages & WAL Recovery, Columnar OLAP (DuckDB / ClickHouse / Parquet), and Distributed NewSQL.

## 1. Non-Negotiable Architectural Invariants

1. **Zero-Framework, Zero-Runtime-Bundler Static Architecture**:
   - Pure semantic HTML5, CSS custom properties (`css/variables.css`, `css/layout.css`, `css/components.css`, `css/content.css`, `css/landing.css`, `css/simulators.css`), and vanilla ES2022 JavaScript (`window.*` namespaces).
   - Self-hosted `Geist` and `Geist Mono` variable fonts (`fonts/geist-latin.woff2`, `fonts/geist-mono-latin.woff2`).
2. **Browser-Native WebAssembly SQL Execution (`sql.js` + `@innovatorved/code-lab`)**:
   - Vendored official SQLite 3 compiled to WebAssembly (`js/vendor/sql-wasm.js` + `js/vendor/sql-wasm.wasm`) managed by `js/sql-engine.js`, with polyglot PostgreSQL/DuckDB dialect normalization and real `EXPLAIN QUERY PLAN` / VDBE bytecode introspection.
   - Pre-loaded with 5 rich production relational schemas (`ecommerce`, `org_hr`, `fintech_ledger`, `saas_telemetry`, `social_graph`) in `data/datasets.js`.
   - Every unit's Guided SQL Lab and all 18 Capstone Build Projects integrate with `@innovatorved/code-lab`.
3. **Interactive Clause-by-Clause Table-Level Visualizer (`js/table-visualizer.js`)**:
   - Decomposes and animates any SQL query step by step in logical execution order (`FROM/JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `WINDOW` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT/OFFSET`), rendering live intermediate tables, matched/filtered row highlights, Three-Valued Logic (`TRUE`/`FALSE`/`NULL`) badges, sliding window frames, and `EXPLAIN QUERY PLAN` operator trees.
4. **Complete 6-Track, 18-Module, 180-Unit Curriculum**:
   - 6 Tracks, 18 Modules (`m01`–`m18`), 180 Units (10 units per module: 8 progressive technical lessons + 1 real-world production case study `case-*` + 1 hands-on capstone build `build-*`).
   - Every unit ships with:
     - Curated YouTube video lecture (`video`) + synthesized audio narration (`audio/<slug>.mp3`)
     - Intuition-first primer (`intuition`)
     - Deep technical content (`>= 300` words) with SQL Dialect Comparison Matrix, `.invariant-box`, inline `<svg>` diagrams, and runnable `<pre><code class="language-sql">` blocks
     - Mapped interactive visual simulator (`data-sim="sim-..."`)
     - Guided SQL Lab (`data/topic_guided_labs.js`)
     - 4 tiered MCQ quiz questions (`recall`, `apply`, `staff`) in `data/questions/q01..q18.js`
5. **Static Pre-Rendering & Strict QA Gates**:
   - `node tools/generate-static.js` pre-renders all 180 `/topic/<slug>/index.html` pages, all 22 `/build/<id>/index.html` pages, `index.html`, and `sitemap.xml`.
   - `node tools/stamp-assets.js` stamps deterministic 10-char SHA-1 hashes (`?v=<hash>`) across all HTML entrypoints and `js/manifest.js`.
   - `node tools/validate.js` and `node tools/check-rendered.js` enforce zero errors before deployment.
