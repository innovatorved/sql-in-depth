# Master Canonical Bibliography & Source Registry (`SOURCES.md`)

> [!CAUTION]
> **Strict Primary-Source Policy**: Every unit, relational algebra proof, query planner cost formula, storage engine page layout, isolation anomaly analysis, and production case study in **SQL In Depth** must be grounded exclusively in authoritative primary sources listed below. SEO content farms (GeeksforGeeks, Medium, W3Schools, Baeldung, Tutorialspoint, Programiz, Javatpoint, freeCodeCamp, dev.to) are strictly prohibited and rejected by `node tools/validate.js`.

---

## 1. Canonical Database Textbooks & Reference Manuals

1. **PostgreSQL 17 Official Documentation** — The PostgreSQL Global Development Group — <https://www.postgresql.org/docs/current/>
   - Primary reference for SQL syntax, Window Functions, CTEs, MVCC (`xmin`/`xmax` tuple visibility), Lock Modes, B-Tree/GIN/GiST/BRIN indexes, `EXPLAIN ANALYZE`, `pg_stats`, WAL, and Vacuum.
2. **SQLite Official Architecture & Query Planner Documentation** — D. Richard Hipp / SQLite Consortium — <https://www.sqlite.org/docs.html>
   - Primary reference for B-Tree file format (`sqlite.org/fileformat2.html`), Next-Generation Query Planner (`sqlite.org/optoverview.html`), VDBE bytecode engine (`sqlite.org/opcode.html`), and WAL mode (`sqlite.org/wal.html`).
3. **Use The Index, Luke! (SQL Performance Explained)** — Markus Winand — <https://use-the-index-luke.com/>
   - Primary reference for B+Tree traversal mechanics, composite index leftmost-prefix rules, covering indexes, SARGability, and keyset (seek) pagination.
4. **CMU 15-445 / 645 (Intro to Database Systems) & 15-721 (Advanced Database Systems)** — Andy Pavlo, Carnegie Mellon University — <https://15445.courses.cs.cmu.edu/>
   - Primary academic curriculum reference for buffer pool managers, slotted pages, B+Tree latching, Volcano vs. vectorized execution, Selinger cost-based optimization, two-phase locking (2PL), MVCC, and ARIES recovery.
5. **Database Internals** — Alex Petrov (O'Reilly Media, 2019) — <https://www.databass.dev/>
   - Primary reference for on-disk B-Tree and LSM-Tree storage formats, slotted pages, Write-Ahead Logs, and distributed consensus.
6. **Designing Data-Intensive Applications (DDIA)** — Martin Kleppmann (O'Reilly Media, 2017) — <https://dataintensive.net/>
   - Primary reference for OLTP vs. OLAP, B-Trees vs. LSM-Trees, replication lag anomalies, partitioning/sharding, weak isolation levels, Write Skew, and Serializable Snapshot Isolation (SSI).
7. **Database System Concepts (7th Edition)** — Abraham Silberschatz, Henry F. Korth, S. Sudarshan (McGraw-Hill, 2019) — <https://www.db-book.com/>
   - Primary textbook for relational algebra, tuple relational calculus, functional dependencies, Armstrong's axioms, 1NF–BCNF/4NF/5NF normalization, and join algorithms.
8. **The Data Warehouse Toolkit (3rd Edition)** — Ralph Kimball & Margy Ross (Wiley, 2013) — <https://www.kimballgroup.com/>
   - Primary reference for dimensional modeling, Star vs. Snowflake schemas, fact table grain, conformal dimensions, and Slowly Changing Dimensions (SCD Types 0–6).
9. **The Internals of PostgreSQL** — Hironobu Suzuki — <https://www.interdb.jp/pg/>
   - Primary reference for PostgreSQL heap page layout, `ctid` line pointers, HOT (Heap-Only Tuple) updates, Transaction Snapshots, Autovacuum, and Buffer Manager internals.
10. **DuckDB Official Documentation & Research** — Mark Raasveldt & Hannes Mühleisen — <https://duckdb.org/docs/>
    - Primary reference for vectorized push-based execution, morsel-driven parallelism, friendly SQL extensions (`QUALIFY`, `GROUP BY ALL`, `ASOF JOIN`), and Parquet/Arrow zero-copy scanning.
11. **ClickHouse Official Documentation** — ClickHouse Inc. — <https://clickhouse.com/docs>
    - Primary reference for sparse primary indexes, `MergeTree` engines, columnar compression codecs (LZ4, ZSTD, Delta, DoubleDelta), and real-time OLAP aggregation.
12. **MySQL 8.4 / InnoDB Internals Documentation** — Oracle Corporation — <https://dev.mysql.com/doc/refman/8.4/en/innodb-storage-engine.html>
    - Primary reference for clustered primary key organization, secondary index PK pointers, undo logs, change buffering, and Next-Key / Gap locking.

---

## 2. Seminal Peer-Reviewed Database Papers

- **Codd (1970)** — E. F. Codd, *"A Relational Model of Data for Large Shared Data Banks"*, Communications of the ACM — <https://doi.org/10.1145/362384.362685>
- **Selinger et al. (1979)** — Patricia G. Selinger et al., *"Access Path Selection in a Relational Database Management System"* (System R Optimizer), ACM SIGMOD — <https://doi.org/10.1145/582095.582099>
- **Bayer & McCreight (1972)** — Rudolf Bayer & Edward M. McCreight, *"Organization and Maintenance of Large Ordered Indexes"*, Acta Informatica — <https://doi.org/10.1007/BF00288683>
- **Comer (1979)** — Douglas Comer, *"The Ubiquitous B-Tree"*, ACM Computing Surveys — <https://doi.org/10.1145/356770.356776>
- **Graefe (1994)** — Goetz Graefe, *"Volcano — An Extensible and Parallel Query Evaluation System"*, IEEE TKDE — <https://doi.org/10.1109/69.273032>
- **Boncz, Zukowski, Nes (2005)** — Peter Boncz, Marcin Zukowski, Niels Nes, *"MonetDB/X100: Hyper-Pipelining Query Execution"*, CIDR — <https://www.cidrdb.org/cidr2005/papers/P19.pdf>
- **Leis et al. (2014)** — Viktor Leis, Peter Boncz, Alfons Kemper, Thomas Neumann, *"Morsel-Driven Parallelism: A NUMA-Aware Query Evaluation Framework for the Many-Core Age"*, ACM SIGMOD — <https://doi.org/10.1145/2588555.2610507>
- **Neumann (2011)** — Thomas Neumann, *"Efficiently Compiling Efficient Query Plans for Modern Hardware"*, PVLDB — <https://doi.org/10.14778/2002938.2002940>
- **Berenson et al. (1995)** — Hal Berenson, Phil Bernstein, Jim Gray, Jim Melton, Elizabeth O'Neil, Patrick O'Neil, *"A Critique of ANSI SQL Isolation Levels"*, ACM SIGMOD — <https://doi.org/10.1145/223784.223785>
- **Cahill, Röhm, Fekete (2008)** — Michael J. Cahill, Uwe Röhm, Alan D. Fekete, *"Serializable Isolation for Snapshot Databases"* (SSI), ACM SIGMOD — <https://doi.org/10.1145/1376616.1376690>
- **Mohan et al. (1992)** — C. Mohan, Don Haderle, Bruce Lindsay, Hamid Pirahesh, Peter Schwarz, *"ARIES: A Transaction Recovery Method Supporting Fine-Granularity Locking and Partial Rollbacks Using Write-Ahead Logging"*, ACM TODS — <https://doi.org/10.1145/128765.128770>
- **O'Neil, Cheng, Gawlick, O'Neil (1996)** — *"The Log-Structured Merge-Tree (LSM-Tree)"*, Acta Informatica — <https://doi.org/10.1007/s002360050048>
- **Abadi, Madden, Ferreira (2006)** — Daniel J. Abadi, Samuel R. Madden, Miguel Ferreira, *"Integrating Compression and Execution in Column-Oriented Database Systems"*, ACM SIGMOD — <https://doi.org/10.1145/1142473.1142548>
- **Corbett et al. (2012)** — James C. Corbett et al., *"Spanner: Google's Globally-Distributed Database"*, USENIX OSDI — <https://www.usenix.org/conference/osdi12/technical-sessions/presentation/corbett>
- **Taft et al. (2020)** — Rebecca Taft et al., *"CockroachDB: The Resilient Geo-Distributed SQL Database"*, ACM SIGMOD — <https://doi.org/10.1145/3318464.3386134>
- **Armbrust et al. (2020)** — Michael Armbrust et al., *"Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores"*, PVLDB — <https://doi.org/10.14778/3415478.3415560>
