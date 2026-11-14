# SQL In Depth

Open-source interactive curriculum for relational databases, SQL query execution, B+Tree storage engines, and MVCC concurrency — running entirely in the browser with WebAssembly SQLite 3 and PostgreSQL 18, zero backend servers, and zero sign-ups.

**Live site:** [https://sql-in-depth.vedgupta.in](https://sql-in-depth.vedgupta.in)

---

## Highlights

- **Clause-by-Clause Relational Table Visualizer**: Step through logical SQL evaluation order (FROM, JOIN, WHERE three-valued logic, GROUP BY, HAVING, WINDOW, SELECT, DISTINCT, ORDER BY, LIMIT) and inspect intermediate tuples at every stage.
- **Dual WebAssembly SQL Engines**: Execute queries against 5 pre-seeded relational schemas (26 tables) inside a Web Worker backed by SQLite 3 (`sql.js`) for sub-100ms cold boot and on-demand PostgreSQL 18 (`@electric-sql/pglite`).
- **36 Interactive Storage & Concurrency Simulators**: Explore 8 KB slotted pages, B+Tree splits, System R join cost estimation, MVCC `xmin`/`xmax` tuple visibility, two-phase locking deadlocks, and ARIES write-ahead log recovery.
- **180 Guided SQL Labs & 18 Capstone Builds**: Progressive 3-step SQL exercises with coaching hints and automated result-set verification on every topic, paired with optional reference storage-engine implementations powered by [`@innovatorved/code-lab`](https://github.com/innovatorved/code-lab).
- **12 Incident Diagnostics**: Practice fixing production query regressions — NULL anti-join traps, join fan-out double counting, recursive CTE cycles, non-SARGable filters, and lock-ordering deadlocks.

---

## Curriculum Overview

| Track | Modules | Focus |
| :--- | :--- | :--- |
| **1. Relational Foundations & Core Querying** | 1.1 – 1.3 | Codd's relational model, three-valued NULL logic, DDL constraints, idempotent upserts, and multi-table joins |
| **2. Aggregations, Subqueries, CTEs & Windows** | 2.1 – 2.3 | Hash vs group aggregation, fan-out traps, correlated/LATERAL subqueries, recursive CTEs, and window frames |
| **3. Data Modeling & Schema Architecture** | 3.1 – 3.3 | Normalization (1NF to BCNF/5NF), Kimball star schemas, SCD Type 2 history, cohort funnels, and JSONB |
| **4. Indexing, Query Planning & Execution** | 4.1 – 4.3 | B+Tree anatomy, covering/partial/GIN/BRIN indexes, cardinality histograms, EXPLAIN plans, and physical joins |
| **5. Transactions, Concurrency, MVCC & Storage** | 5.1 – 5.3 | ACID anomalies, snapshot isolation, SSI, vacuuming, buffer pools, slotted pages, and ARIES WAL recovery |
| **6. Columnar OLAP, Sharding & Production Tuning** | 6.1 – 6.3 | Vectorized columnar execution, LSM-trees, partitioning, consistent hashing, connection pooling, and query tuning |

---

## Local Development

```bash
npm install
npm run serve              # Serve locally at http://localhost:8000
```

### Verification & Static Build Commands

```bash
npm run prerender          # Regenerate 218 static HTML pages and sitemap.xml
npm run og                 # Generate 1200x630 Open Graph PNG social cards
npm run stamp              # Update content-addressed ?v= asset hashes and js/manifest.js
npm test                   # Validate curriculum schema, citations, links, and rendered HTML
npm run e2e                # Run the 4-tier end-to-end verification suite (SQLite 3 + PostgreSQL 18)
npm run build              # Minify and assemble production output into dist/
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details and [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

---

## Related Projects

- **[System Design In Depth](https://system-design-in-depth.vedgupta.in)** — Interactive distributed systems curriculum, architecture canvas, and failure simulations ([repo](https://github.com/innovatorved/system-design-in-depth))
- **[DSA In Depth](https://dsa-in-depth.vedgupta.in)** — Data structures, algorithmic complexity, and step-by-step pattern visualizers ([repo](https://github.com/innovatorved/dsa-in-depth))
- **[@innovatorved/code-lab](https://code-lab.vedgupta.in)** — Browser-native IDE workbench, Web Worker runtime, POSIX shell, and SQL editor ([repo](https://github.com/innovatorved/code-lab))

---

## License

- **Code, Simulators, Datasets & Tooling**: [MIT License](./LICENSE)
- **Written Curriculum & Guides**: [Creative Commons Attribution 4.0 International (CC BY 4.0)](./LICENSE)

© [Ved Gupta](https://vedgupta.in)
