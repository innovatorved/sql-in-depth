# Third-Party Licenses & Asset Provenance (`docs/licenses.md`)

Every library, font, runtime, and media asset shipped or used by `sql-in-depth` uses a permissive open-source license (**MIT**, **Apache-2.0**, **BSD**, **SIL OFL-1.1**, or **CC0**) or is **100% original work** authored for this repository. Zero text, code, illustrations, videos, layouts, or brand assets from any third-party or proprietary source are included.

---

## 1. Client-Side Runtimes & Libraries

| Package / Asset | Version | License | Source / Copyright | Usage in `sql-in-depth` |
| :--- | :--- | :--- | :--- | :--- |
| **`sql.js`** | `^1.14.1` | **MIT** | Copyright (c) `sql.js` contributors & Alon Zakai (SQLite is Public Domain) | Fast default in-browser SQLite 3 WASM engine running inside `js/sql-worker.js` |
| **`@electric-sql/pglite`** | `^0.4.4` | **Apache-2.0** (Postgres: **PostgreSQL License**) | Copyright (c) ElectricDB Limited & PostgreSQL Global Development Group | On-demand in-browser PostgreSQL 18.6 WASM engine inside `js/sql-worker.js` |
| **`@codemirror/state`** | `^6.x` | **MIT** | Copyright (c) Marijn Haverbeke and contributors | Editor document state & transactions in SQL Playground |
| **`@codemirror/view`** | `^6.x` | **MIT** | Copyright (c) Marijn Haverbeke and contributors | Accessible code editor viewport, gutter, keymaps, and themes |
| **`@codemirror/lang-sql`** | `^6.x` | **MIT** | Copyright (c) Marijn Haverbeke and contributors | SQL grammar parser (SQLite & PostgreSQL dialects) and schema-aware autocomplete |
| **`@codemirror/autocomplete`** | `^6.x` | **MIT** | Copyright (c) Marijn Haverbeke and contributors | Table, column, type, and SQL keyword completion popup |
| **`@codemirror/lint`** | `^6.x` | **MIT** | Copyright (c) Marijn Haverbeke and contributors | Inline SQL syntax/execution error underlines and diagnostics |
| **`@codemirror/commands`** | `^6.x` | **MIT** | Copyright (c) Marijn Haverbeke and contributors | Standard editing commands, indentation, comment toggling |
| **`@codemirror/search`** | `^6.x` | **MIT** | Copyright (c) Marijn Haverbeke and contributors | Find/replace inside the SQL editor |
| **`@lezer/highlight`** | `^1.x` | **MIT** | Copyright (c) Marijn Haverbeke and contributors | Syntax highlighting tags for light/dark themes |
| **`KaTeX`** | `0.16.11` | **MIT** | Copyright (c) Khan Academy and contributors | Self-hosted relational algebra & cost-model math typesetting (`css/vendor/katex/`, `js/vendor/katex/`) |
| **`Mermaid`** | `11.x` | **MIT** | Copyright (c) Knut Sveidqvist and contributors | Optional architecture diagram renderer |
| **`@innovatorved/code-lab`** | `0.3.1` | **MIT** | Copyright (c) 2026 Ved Gupta | Browser-native IDE for `/build/*` capstone C++/JS/Python storage engine projects |

---

## 2. Build & Tooling Dependencies (Dev / Build Time Only)

| Package | License | Usage |
| :--- | :--- | :--- |
| **`esbuild`** | **MIT** | Bundles CodeMirror 6 modules into self-hosted `js/vendor/cm6-sql.js` and minifies production CSS/JS |
| **`canvas` / Node SVG-PNG pipeline & `ffmpeg`** | **MIT / LGPL-2.1+ CLI tool** | Build-time generation of original flagship `.mp4`/`.webm` explainer videos and `1200×630` Open Graph PNG images |

---

## 3. Typography & Icons

| Asset | License | Copyright | Location |
| :--- | :--- | :--- | :--- |
| **Geist Sans** | **SIL Open Font License 1.1 (OFL-1.1)** | Copyright (c) 2023 Vercel, Inc. | `fonts/geist-latin.woff2` |
| **Geist Mono** | **SIL Open Font License 1.1 (OFL-1.1)** | Copyright (c) 2023 Vercel, Inc. | `fonts/geist-mono-latin.woff2` |
| **UI & Diagram SVG Icons** | **MIT (Original)** | Copyright (c) 2026 Ved Gupta | Inline 24×24 / 16×16 stroke SVGs authored specifically for `sql-in-depth` |

---

## 4. Original Content, Diagrams, Datasets & Flagship Videos

- **Curriculum Prose, Quizzes, Guided Labs & Challenges (`data/`)**: 100% original engineering content licensed under the repository's **MIT License**.
- **Interactive Simulators & SVG Diagrams (`js/simulators-*.js`, `data/content/*.js`)**: 100% original client-side visualizations licensed under **MIT**.
- **Sample SQL Datasets (`data/datasets.js`)**: Synthetic deterministic schemas (`ecommerce`, `org_hr`, `fintech_ledger`, `saas_telemetry`, `social_graph`) containing zero PII or third-party scraped records (**CC0 / MIT**).
- **Flagship Explainer Videos, Posters & WebVTT Captions (`assets/videos/*`)**: Generated programmatically via `tools/generate-videos.js` from original vector frames, original scripts, and `.vtt` caption tracks (**MIT**).
- **Curated External Lecture Metadata (`data/topic_videos.json`)**: Standard metadata links/titles referencing publicly available computer science lectures (e.g., CMU Intro to Database Systems / Andy Pavlo) rendered only as optional external study references with full creator attribution; no third-party video files are hosted or copied.
