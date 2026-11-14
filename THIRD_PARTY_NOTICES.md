# Third-Party Notices & Licensing Disclosures

This project incorporates, links to, or interfaces with the following permissively licensed open-source libraries and fonts. See [docs/licenses.md](docs/licenses.md) for the complete provenance table.

---

## 1. Client-Side Runtimes & UI Dependencies

### sql.js (SQLite 3 WebAssembly)
- **License:** MIT License (SQLite engine is Public Domain)
- **Copyright:** (c) sql.js contributors & Alon Zakai
- **Usage:** In-browser SQLite 3 WebAssembly query execution inside the Web Worker runtime.

### @electric-sql/pglite (PostgreSQL 18 WebAssembly)
- **License:** Apache License 2.0 (PostgreSQL is licensed under the PostgreSQL License)
- **Copyright:** (c) ElectricDB Limited & PostgreSQL Global Development Group
- **Usage:** On-demand in-browser PostgreSQL 18 WebAssembly engine.

### CodeMirror 6 (@codemirror/* & @lezer/highlight)
- **License:** MIT License
- **Copyright:** (c) 2018–2026 Marijn Haverbeke and contributors
- **Usage:** Accessible SQL editor, schema-aware autocomplete, syntax highlighting, and error diagnostics.

### KaTeX (v0.16.11)
- **License:** MIT License
- **Copyright:** (c) 2013–2026 Khan Academy and contributors
- **Usage:** Self-hosted relational algebra and query-cost math rendering.

### Geist & Geist Mono Fonts
- **License:** SIL Open Font License 1.1
- **Copyright:** (c) 2023 Vercel, Inc.
- **Usage:** Self-hosted webfonts for reading prose and tabular data grids.

### Mermaid.js & @innovatorved/code-lab (v0.4.0)
- **License:** MIT License
- **Usage:** On-demand architecture diagrams and reference storage-engine IDE workbench.

---

## 2. Public Papers & Database Standards Attribution

The relational algebra formalisms, storage architectures, and concurrency mechanisms taught across the curriculum (Codd's Relational Model, System R cost estimation, B+Trees, ARIES write-ahead logging, and PostgreSQL/SQLite MVCC) reference published database systems literature. All code, visualizers, synthetic SQL datasets, and explainer media are licensed under the MIT License, and written curriculum prose is licensed under CC BY 4.0.
