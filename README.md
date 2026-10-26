# SQL In Depth

**SQL In Depth** (`https://sql-in-depth.vedgupta.in`) is a free, open-source, interactive textbook, browser-native WebAssembly SQL playground, clause-by-clause table-level visualizer, and database engineering lab platform.

## Highlights

- **6 Tracks, 18 Modules, 180 Deep Technical Units**: From first-principles Relational Algebra, `SELECT`, Three-Valued `NULL` Logic, and Multi-Table Joins to Window Functions, Recursive CTEs, Normalization (1NF–5NF), Star Schemas, B+Tree Indexing, Cost-Based Query Optimization (`EXPLAIN ANALYZE`), ACID/MVCC/Locking, 8KB Slotted Pages & WAL Recovery, Columnar OLAP (DuckDB/ClickHouse), and Distributed NewSQL.
- **Browser-Native WASM SQLite Engine (`sql.js` + `@innovatorved/code-lab`)**: Run real SQL queries, inspect `EXPLAIN QUERY PLAN` operator trees, and verify guided SQL exercises 100% in the browser with zero server dependency.
- **Interactive Table-Level Relational Visualizer**: Step through any SQL query clause by clause (`FROM/JOIN` → `WHERE` → `GROUP BY` → `HAVING` → `WINDOW` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`) and watch how intermediate tables, row pairings, `NULL` paddings, group buckets, and window frames transform at every step.
- **180 Guided SQL Labs & 22 From-Scratch Database Builds**: Powered by `@innovatorved/code-lab` with automated verification tests.
- **Multi-Modal Learning**: Curated YouTube lectures, synthesized audio narrations (`audio/<slug>.mp3`), 720+ tiered MCQs (`recall`/`apply`/`staff`), SM-2 spaced repetition flashcards, production database incident challenges, and an interactive SQL & Schema Workbench.

## Quick Start

```bash
# Validate curriculum, content, simulators, questions, and static pages
npm test

# Pre-render all static HTML pages and stamp SHA-1 asset hashes
npm run prerender
npm run stamp

# Build clean dist/ directory for deployment
npm run build

# Serve locally on http://localhost:8000
npm run serve
```

## License

MIT © [Ved Gupta](https://vedgupta.in)
