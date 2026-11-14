# Third-Party Licenses & Asset Provenance

Every library, font, runtime, and media asset shipped by SQL In Depth uses a permissive open-source license (MIT, Apache-2.0, BSD, SIL OFL-1.1, or CC BY 4.0) or is original work authored for this repository.

---

## 1. Client-Side Runtimes & Libraries

| Package / Asset | Version | License | Source / Copyright | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **sql.js** | `^1.15.2` | MIT | Copyright (c) sql.js contributors & Alon Zakai (SQLite is Public Domain) | Default in-browser SQLite 3 WebAssembly engine running in a Web Worker |
| **@electric-sql/pglite** | `^0.5.12` | Apache-2.0 (PostgreSQL License) | Copyright (c) ElectricDB Limited & PostgreSQL Global Development Group | On-demand in-browser PostgreSQL 18 WebAssembly engine |
| **@codemirror/*** | `^6.x` | MIT | Copyright (c) Marijn Haverbeke and contributors | Accessible SQL editor, schema-aware autocomplete, and inline diagnostics |
| **@lezer/highlight** | `^1.x` | MIT | Copyright (c) Marijn Haverbeke and contributors | Syntax highlighting tags for light and dark themes |
| **KaTeX** | `0.16.11` | MIT | Copyright (c) Khan Academy and contributors | Self-hosted relational algebra and cost-model math typesetting |
| **Mermaid** | `10.9.8` | MIT | Copyright (c) Knut Sveidqvist and contributors | On-demand architecture diagram renderer |
| **@innovatorved/code-lab** | `0.4.0` | MIT | Copyright (c) 2026 Ved Gupta | Browser-native IDE for reference storage-engine implementations |

---

## 2. Build & Tooling Dependencies (Build Time Only)

| Package | License | Usage |
| :--- | :--- | :--- |
| **esbuild** | MIT | Bundles CodeMirror 6 modules and minifies production CSS and JS |
| **ffmpeg & Node PNG pipeline** | MIT / LGPL-2.1+ CLI tool | Build-time generation of explainer videos and 1200x630 Open Graph PNG social cards |

---

## 3. Typography & Icons

| Asset | License | Copyright | Location |
| :--- | :--- | :--- | :--- |
| **Geist Sans** | SIL Open Font License 1.1 (OFL-1.1) | Copyright (c) 2023 Vercel, Inc. | `fonts/geist-latin.woff2` |
| **Geist Mono** | SIL Open Font License 1.1 (OFL-1.1) | Copyright (c) 2023 Vercel, Inc. | `fonts/geist-mono-latin.woff2` |
| **UI & Diagram SVG Icons** | MIT (Original) | Copyright (c) 2026 Ved Gupta | Inline 24x24 and 16x16 stroke SVGs |

---

## 4. Original Content, Diagrams, Datasets & Media

- **Curriculum Prose, Quizzes, Guided Labs & Challenges**: Original educational content licensed under **CC BY 4.0** (prose) and **MIT** (SQL/JS code).
- **Interactive Simulators & SVG Diagrams**: Original client-side visualizations licensed under **MIT**.
- **Sample SQL Datasets**: Synthetic deterministic schemas (`ecommerce`, `org_hr`, `fintech_ledger`, `saas_telemetry`, `social_graph`) containing zero personal data (**MIT**).
- **Explainer Videos, Posters & WebVTT Captions**: Programmatically generated vector animations and caption tracks (**MIT**).
- **External Lecture Links**: Metadata links referencing publicly available computer science lectures (such as CMU Intro to Database Systems) with creator attribution; no third-party video files are hosted.
