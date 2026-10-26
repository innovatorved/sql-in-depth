/**
 * SQL In Depth — Prerequisite DAG, 18-Module Progression & 4 Curated Study Tracks
 * Exposes window.ROADMAP_DATA with stages, nodes, edges, paths, careerPaths, and modules.
 */
(function(root) {
  'use strict';

  var ROADMAP_DATA = {
  "stages": [
    {
      "id": "stage-1",
      "number": 1,
      "trackId": "track-1",
      "title": "Relational Foundations & Core Querying",
      "summary": "Master the relational model, Codd's algebra, SQL data types, Three-Valued NULL logic, DDL constraints, idempotent upserts, and multi-table joins.",
      "hours": "28 hrs",
      "color": "#3b82f6",
      "unitCount": 30
    },
    {
      "id": "stage-2",
      "number": 2,
      "trackId": "track-2",
      "title": "Aggregations, Subqueries, CTEs & Window Functions",
      "summary": "Go beyond basic querying: master multi-dimensional GROUP BY rollups, join fanout prevention, correlated lateral subqueries, recursive CTE graph traversal, and window function framing.",
      "hours": "32 hrs",
      "color": "#06b6d4",
      "unitCount": 30
    },
    {
      "id": "stage-3",
      "number": 3,
      "trackId": "track-3",
      "title": "Data Modeling, Normalization & Schema Architecture",
      "summary": "Architect resilient schemas for both OLTP and OLAP: functional dependencies, 1NF through BCNF/5NF, Kimball Star Schemas, SCD Type 2 history, and temporal SQL patterns.",
      "hours": "30 hrs",
      "color": "#10b981",
      "unitCount": 30
    },
    {
      "id": "stage-4",
      "number": 4,
      "trackId": "track-4",
      "title": "Indexing, Query Planner & Execution Engine",
      "summary": "Look inside the database engine: master B+Tree page splits, composite leftmost-prefix rules, covering index-only scans, cost-based query optimization, EXPLAIN ANALYZE, and physical join algorithms.",
      "hours": "34 hrs",
      "color": "#f59e0b",
      "unitCount": 30
    },
    {
      "id": "stage-5",
      "number": 5,
      "trackId": "track-5",
      "title": "Transactions, Concurrency Control, MVCC & Storage Internals",
      "summary": "Master transactional correctness and storage physics: ACID guarantees, isolation anomalies (Dirty Read to Write Skew), MVCC tuple visibility, row/gap locking, 8KB slotted pages, WAL, ARIES crash recovery, and LSM-Trees.",
      "hours": "34 hrs",
      "color": "#8b5cf6",
      "unitCount": 30
    },
    {
      "id": "stage-6",
      "number": 6,
      "trackId": "track-6",
      "title": "Analytical Engines (OLAP), Distributed SQL & Production Operations",
      "summary": "Scale from single-node engines to petabyte warehouses and globally distributed clusters: columnar Parquet/DuckDB/ClickHouse internals, sharding, NewSQL consensus, and production query tuning.",
      "hours": "36 hrs",
      "color": "#ec4899",
      "unitCount": 30
    }
  ],
  "nodes": [
    {
      "id": "n-rel-model",
      "label": "Relational Model & SELECT",
      "slug": "select-projection-aliases",
      "stage": 1,
      "trackId": "track-1",
      "moduleId": "m01",
      "type": "simulator",
      "difficulty": "Beginner",
      "x": 160,
      "y": 80,
      "prerequisites": [],
      "description": "Relations, tuples, SQL execution order (FROM before SELECT), and SARGable WHERE predicates."
    },
    {
      "id": "n-null-3vl",
      "label": "Three-Valued NULL Logic",
      "slug": "boolean-logic-three-valued-null",
      "stage": 1,
      "trackId": "track-1",
      "moduleId": "m01",
      "type": "simulator",
      "difficulty": "Beginner",
      "x": 520,
      "y": 80,
      "prerequisites": [
        "n-rel-model"
      ],
      "description": "TRUE/FALSE/UNKNOWN truth tables, COALESCE, IS DISTINCT FROM, and why NOT IN fails on NULLs."
    },
    {
      "id": "n-ddl-keys",
      "label": "DDL, PKs (UUIDv7) & FKs",
      "slug": "primary-keys-surrogate-vs-natural",
      "stage": 1,
      "trackId": "track-1",
      "moduleId": "m02",
      "type": "lesson",
      "difficulty": "Beginner",
      "x": 160,
      "y": 200,
      "prerequisites": [
        "n-rel-model"
      ],
      "description": "CREATE TABLE, B-Tree locality of UUIDv7 vs UUIDv4, foreign key CASCADE/RESTRICT, and CHECK constraints."
    },
    {
      "id": "n-dml-upsert",
      "label": "Idempotent Upserts & MERGE",
      "slug": "upsert-on-conflict-merge",
      "stage": 1,
      "trackId": "track-1",
      "moduleId": "m02",
      "type": "build",
      "difficulty": "Intermediate",
      "x": 520,
      "y": 200,
      "prerequisites": [
        "n-ddl-keys",
        "n-null-3vl"
      ],
      "description": "Multi-row INSERT ... RETURNING, ON CONFLICT DO UPDATE, MERGE, and zero-downtime schema migrations."
    },
    {
      "id": "n-joins-outer",
      "label": "INNER / LEFT / FULL Joins",
      "slug": "left-right-full-outer-joins",
      "stage": 1,
      "trackId": "track-1",
      "moduleId": "m03",
      "type": "simulator",
      "difficulty": "Intermediate",
      "x": 160,
      "y": 320,
      "prerequisites": [
        "n-ddl-keys",
        "n-null-3vl"
      ],
      "description": "Relational algebra joins, NULL extension on outer joins, and the ON vs WHERE filter trap."
    },
    {
      "id": "n-semi-anti",
      "label": "Semi-Joins, Anti-Joins & Sets",
      "slug": "semi-joins-anti-joins",
      "stage": 1,
      "trackId": "track-1",
      "moduleId": "m03",
      "type": "build",
      "difficulty": "Intermediate",
      "x": 520,
      "y": 320,
      "prerequisites": [
        "n-joins-outer"
      ],
      "description": "EXISTS / NOT EXISTS, self-joins, UNION ALL vs UNION, and multi-table order reconciliation."
    },
    {
      "id": "n-group-agg",
      "label": "GROUP BY & Conditional FILTER",
      "slug": "group-by-execution-mechanics",
      "stage": 2,
      "trackId": "track-2",
      "moduleId": "m04",
      "type": "simulator",
      "difficulty": "Intermediate",
      "x": 160,
      "y": 460,
      "prerequisites": [
        "n-joins-outer"
      ],
      "description": "HashAggregate vs GroupAggregate, WHERE vs HAVING, FILTER (WHERE ...), and ROLLUP/CUBE."
    },
    {
      "id": "n-fanout-trap",
      "label": "Join Fanout & Chasm Traps",
      "slug": "join-fanout-chasm-traps",
      "stage": 2,
      "trackId": "track-2",
      "moduleId": "m04",
      "type": "build",
      "difficulty": "Intermediate",
      "x": 520,
      "y": 460,
      "prerequisites": [
        "n-group-agg",
        "n-semi-anti"
      ],
      "description": "Why joining two 1:N child tables inflates SUM/COUNT and how pre-aggregated CTEs prevent double-counting."
    },
    {
      "id": "n-subquery-lateral",
      "label": "Correlated & LATERAL Joins",
      "slug": "lateral-joins-cross-apply",
      "stage": 2,
      "trackId": "track-2",
      "moduleId": "m05",
      "type": "lesson",
      "difficulty": "Intermediate",
      "x": 160,
      "y": 580,
      "prerequisites": [
        "n-semi-anti",
        "n-group-agg"
      ],
      "description": "Subquery unnesting, LATERAL Top-N-per-group, and CTE inlining vs MATERIALIZED fences."
    },
    {
      "id": "n-recursive-cte",
      "label": "Recursive CTEs & Graph SQL",
      "slug": "recursive-ctes-hierarchies",
      "stage": 2,
      "trackId": "track-2",
      "moduleId": "m05",
      "type": "simulator",
      "difficulty": "Advanced",
      "x": 520,
      "y": 580,
      "prerequisites": [
        "n-subquery-lateral"
      ],
      "description": "WITH RECURSIVE fixpoint worktables, hierarchical RBAC, Bill-of-Materials, and cycle detection."
    },
    {
      "id": "n-window-frames",
      "label": "Window Functions & Framing",
      "slug": "window-frames-rows-range-groups",
      "stage": 2,
      "trackId": "track-2",
      "moduleId": "m06",
      "type": "simulator",
      "difficulty": "Intermediate",
      "x": 160,
      "y": 700,
      "prerequisites": [
        "n-group-agg"
      ],
      "description": "OVER (PARTITION BY ... ORDER BY ...), ROW_NUMBER/RANK, LAG/LEAD, and ROWS vs RANGE vs GROUPS frames."
    },
    {
      "id": "n-gaps-islands",
      "label": "Gaps & Islands Sessionization",
      "slug": "gaps-and-islands-sessionization",
      "stage": 2,
      "trackId": "track-2",
      "moduleId": "m06",
      "type": "build",
      "difficulty": "Advanced",
      "x": 520,
      "y": 700,
      "prerequisites": [
        "n-window-frames",
        "n-subquery-lateral"
      ],
      "description": "Clickstream sessionization, consecutive streak grouping, and real-time sliding-window velocity detection."
    },
    {
      "id": "n-norm-bcnf",
      "label": "Functional Dependencies & BCNF",
      "slug": "boyce-codd-fourth-fifth-normal-form",
      "stage": 3,
      "trackId": "track-3",
      "moduleId": "m07",
      "type": "simulator",
      "difficulty": "Intermediate",
      "x": 160,
      "y": 840,
      "prerequisites": [
        "n-ddl-keys"
      ],
      "description": "Armstrong axioms, 1NF → 2NF → 3NF → BCNF → 4NF/5NF, and lossless-join decomposition."
    },
    {
      "id": "n-star-scd2",
      "label": "Star Schema & SCD Type 2",
      "slug": "slowly-changing-dimensions-scd",
      "stage": 3,
      "trackId": "track-3",
      "moduleId": "m08",
      "type": "simulator",
      "difficulty": "Intermediate",
      "x": 520,
      "y": 840,
      "prerequisites": [
        "n-norm-bcnf",
        "n-fanout-trap"
      ],
      "description": "Kimball dimensional modeling, fact grain, SCD Type 2 history intervals, and temporal tables."
    },
    {
      "id": "n-jsonb-gin",
      "label": "JSONB, Arrays & GIN Indexes",
      "slug": "json-semi-structured-hybrid-schemas",
      "stage": 3,
      "trackId": "track-3",
      "moduleId": "m08",
      "type": "simulator",
      "difficulty": "Advanced",
      "x": 160,
      "y": 960,
      "prerequisites": [
        "n-norm-bcnf"
      ],
      "description": "Binary JSONB AST storage, SQL/JSON path queries, Full-Text Search tsvector, and GIN inverted indexes."
    },
    {
      "id": "n-temporal-hier",
      "label": "Cohorts, Funnels & Temporal SQL",
      "slug": "cohort-retention-matrix-sql",
      "stage": 3,
      "trackId": "track-3",
      "moduleId": "m09",
      "type": "build",
      "difficulty": "Advanced",
      "x": 520,
      "y": 960,
      "prerequisites": [
        "n-jsonb-gin",
        "n-recursive-cte"
      ],
      "description": "Date spines, cohort retention matrices, Allen interval algebra, GiST exclusion constraints, and materialized views."
    },
    {
      "id": "n-slotted-page",
      "label": "8KB Slotted Pages & Buffer Pool",
      "slug": "slotted-page-layout-8kb-anatomy",
      "stage": 4,
      "trackId": "track-5",
      "moduleId": "m15",
      "type": "simulator",
      "difficulty": "Advanced",
      "x": 160,
      "y": 1100,
      "prerequisites": [
        "n-ddl-keys"
      ],
      "description": "8KB slotted page headers, line pointers, MVCC tuple headers, TOAST, Clock-Sweep buffer pool, and OS fsync."
    },
    {
      "id": "n-bplustree",
      "label": "B+Tree Internals & Splits",
      "slug": "btree-bplustree-internal-anatomy",
      "stage": 4,
      "trackId": "track-4",
      "moduleId": "m10",
      "type": "simulator",
      "difficulty": "Advanced",
      "x": 520,
      "y": 1100,
      "prerequisites": [
        "n-slotted-page"
      ],
      "description": "B+Tree branching factor, leaf sibling pointers, leftmost-prefix rule, covering INCLUDE indexes, and BRIN/GIN."
    },
    {
      "id": "n-cost-planner",
      "label": "Cost Planner & Join Algorithms",
      "slug": "hash-join-build-probe-grace",
      "stage": 4,
      "trackId": "track-4",
      "moduleId": "m12",
      "type": "simulator",
      "difficulty": "Advanced",
      "x": 160,
      "y": 1220,
      "prerequisites": [
        "n-bplustree",
        "n-joins-outer"
      ],
      "description": "EXPLAIN ANALYZE BUFFERS, MCV/histogram selectivity, and Nested Loop vs Hash Join vs Sort-Merge Join."
    },
    {
      "id": "n-keyset-tuning",
      "label": "Keyset Pagination & Plan Tuning",
      "slug": "keyset-cursor-pagination-vs-offset",
      "stage": 4,
      "trackId": "track-6",
      "moduleId": "m18",
      "type": "build",
      "difficulty": "Staff",
      "x": 520,
      "y": 1220,
      "prerequisites": [
        "n-cost-planner"
      ],
      "description": "Replacing O(N) OFFSET scans with O(log N) seek cursors, extended multivariate statistics, and plan diagnosis."
    },
    {
      "id": "n-wal-aries",
      "label": "WAL & ARIES Crash Recovery",
      "slug": "aries-crash-recovery-analysis-redo-undo",
      "stage": 5,
      "trackId": "track-5",
      "moduleId": "m15",
      "type": "simulator",
      "difficulty": "Advanced",
      "x": 160,
      "y": 1360,
      "prerequisites": [
        "n-slotted-page"
      ],
      "description": "STEAL/NO-FORCE policy, LSN chaining, ARIES Analysis/Redo/Undo passes, Group Commit, and Doublewrite."
    },
    {
      "id": "n-mvcc-ssi",
      "label": "MVCC Snapshots, Write Skew & SSI",
      "slug": "serializable-2pl-vs-ssi",
      "stage": 5,
      "trackId": "track-5",
      "moduleId": "m13",
      "type": "simulator",
      "difficulty": "Staff",
      "x": 520,
      "y": 1360,
      "prerequisites": [
        "n-wal-aries"
      ],
      "description": "PostgreSQL xmin/xmax vs InnoDB undo logs, Snapshot Isolation, Write Skew, and Serializable Snapshot Isolation."
    },
    {
      "id": "n-locks-deadlock",
      "label": "Lock Hierarchy, Deadlocks & Queues",
      "slug": "row-level-locks-for-update-skip-locked",
      "stage": 5,
      "trackId": "track-5",
      "moduleId": "m14",
      "type": "build",
      "difficulty": "Staff",
      "x": 340,
      "y": 1480,
      "prerequisites": [
        "n-mvcc-ssi",
        "n-bplustree"
      ],
      "description": "Intention locks (IS/IX/SIX), Next-Key gap locks, wait-for graph deadlock detection, and SKIP LOCKED queues."
    },
    {
      "id": "n-columnar-simd",
      "label": "Columnar PAX, Parquet & SIMD",
      "slug": "late-materialization-simd-vectorization",
      "stage": 6,
      "trackId": "track-6",
      "moduleId": "m16",
      "type": "simulator",
      "difficulty": "Advanced",
      "x": 160,
      "y": 1620,
      "prerequisites": [
        "n-cost-planner",
        "n-star-scd2"
      ],
      "description": "NSM vs DSM vs PAX, Parquet row groups, RLE/Dictionary/Bit-Packing, Zone Maps, and DuckDB vectorized execution."
    },
    {
      "id": "n-sharding-newsql",
      "label": "Replication, Sharding & NewSQL",
      "slug": "distributed-sql-spanner-cockroachdb",
      "stage": 6,
      "trackId": "track-6",
      "moduleId": "m17",
      "type": "simulator",
      "difficulty": "Staff",
      "x": 520,
      "y": 1620,
      "prerequisites": [
        "n-wal-aries",
        "n-locks-deadlock"
      ],
      "description": "Raft/Paxos replication, Consistent Hashing, 2PC vs Saga/Outbox CDC, LSM-Trees, and Spanner/CockroachDB."
    },
    {
      "id": "n-prod-dbre",
      "label": "Pooling, Partitioning & RLS Security",
      "slug": "connection-pooling-pgbouncer-proxies",
      "stage": 6,
      "trackId": "track-6",
      "moduleId": "m17",
      "type": "milestone",
      "difficulty": "Staff",
      "x": 340,
      "y": 1740,
      "prerequisites": [
        "n-columnar-simd",
        "n-sharding-newsql",
        "n-keyset-tuning"
      ],
      "description": "PgBouncer transaction pooling, declarative partitioning, Row-Level Security (RLS), PITR backups, and SEV-1 runbooks."
    }
  ],
  "edges": [
    {
      "id": "e-n-rel-model-n-null-3vl",
      "source": "n-rel-model",
      "target": "n-null-3vl",
      "label": "requires"
    },
    {
      "id": "e-n-rel-model-n-ddl-keys",
      "source": "n-rel-model",
      "target": "n-ddl-keys",
      "label": "requires"
    },
    {
      "id": "e-n-ddl-keys-n-dml-upsert",
      "source": "n-ddl-keys",
      "target": "n-dml-upsert",
      "label": "requires"
    },
    {
      "id": "e-n-null-3vl-n-dml-upsert",
      "source": "n-null-3vl",
      "target": "n-dml-upsert",
      "label": "requires"
    },
    {
      "id": "e-n-ddl-keys-n-joins-outer",
      "source": "n-ddl-keys",
      "target": "n-joins-outer",
      "label": "requires"
    },
    {
      "id": "e-n-null-3vl-n-joins-outer",
      "source": "n-null-3vl",
      "target": "n-joins-outer",
      "label": "requires"
    },
    {
      "id": "e-n-joins-outer-n-semi-anti",
      "source": "n-joins-outer",
      "target": "n-semi-anti",
      "label": "requires"
    },
    {
      "id": "e-n-joins-outer-n-group-agg",
      "source": "n-joins-outer",
      "target": "n-group-agg",
      "label": "requires"
    },
    {
      "id": "e-n-group-agg-n-fanout-trap",
      "source": "n-group-agg",
      "target": "n-fanout-trap",
      "label": "requires"
    },
    {
      "id": "e-n-semi-anti-n-fanout-trap",
      "source": "n-semi-anti",
      "target": "n-fanout-trap",
      "label": "requires"
    },
    {
      "id": "e-n-semi-anti-n-subquery-lateral",
      "source": "n-semi-anti",
      "target": "n-subquery-lateral",
      "label": "requires"
    },
    {
      "id": "e-n-group-agg-n-subquery-lateral",
      "source": "n-group-agg",
      "target": "n-subquery-lateral",
      "label": "requires"
    },
    {
      "id": "e-n-subquery-lateral-n-recursive-cte",
      "source": "n-subquery-lateral",
      "target": "n-recursive-cte",
      "label": "requires"
    },
    {
      "id": "e-n-group-agg-n-window-frames",
      "source": "n-group-agg",
      "target": "n-window-frames",
      "label": "requires"
    },
    {
      "id": "e-n-window-frames-n-gaps-islands",
      "source": "n-window-frames",
      "target": "n-gaps-islands",
      "label": "requires"
    },
    {
      "id": "e-n-subquery-lateral-n-gaps-islands",
      "source": "n-subquery-lateral",
      "target": "n-gaps-islands",
      "label": "requires"
    },
    {
      "id": "e-n-ddl-keys-n-norm-bcnf",
      "source": "n-ddl-keys",
      "target": "n-norm-bcnf",
      "label": "requires"
    },
    {
      "id": "e-n-norm-bcnf-n-star-scd2",
      "source": "n-norm-bcnf",
      "target": "n-star-scd2",
      "label": "requires"
    },
    {
      "id": "e-n-fanout-trap-n-star-scd2",
      "source": "n-fanout-trap",
      "target": "n-star-scd2",
      "label": "requires"
    },
    {
      "id": "e-n-norm-bcnf-n-jsonb-gin",
      "source": "n-norm-bcnf",
      "target": "n-jsonb-gin",
      "label": "requires"
    },
    {
      "id": "e-n-jsonb-gin-n-temporal-hier",
      "source": "n-jsonb-gin",
      "target": "n-temporal-hier",
      "label": "requires"
    },
    {
      "id": "e-n-recursive-cte-n-temporal-hier",
      "source": "n-recursive-cte",
      "target": "n-temporal-hier",
      "label": "requires"
    },
    {
      "id": "e-n-ddl-keys-n-slotted-page",
      "source": "n-ddl-keys",
      "target": "n-slotted-page",
      "label": "requires"
    },
    {
      "id": "e-n-slotted-page-n-bplustree",
      "source": "n-slotted-page",
      "target": "n-bplustree",
      "label": "requires"
    },
    {
      "id": "e-n-bplustree-n-cost-planner",
      "source": "n-bplustree",
      "target": "n-cost-planner",
      "label": "requires"
    },
    {
      "id": "e-n-joins-outer-n-cost-planner",
      "source": "n-joins-outer",
      "target": "n-cost-planner",
      "label": "requires"
    },
    {
      "id": "e-n-cost-planner-n-keyset-tuning",
      "source": "n-cost-planner",
      "target": "n-keyset-tuning",
      "label": "requires"
    },
    {
      "id": "e-n-slotted-page-n-wal-aries",
      "source": "n-slotted-page",
      "target": "n-wal-aries",
      "label": "requires"
    },
    {
      "id": "e-n-wal-aries-n-mvcc-ssi",
      "source": "n-wal-aries",
      "target": "n-mvcc-ssi",
      "label": "requires"
    },
    {
      "id": "e-n-mvcc-ssi-n-locks-deadlock",
      "source": "n-mvcc-ssi",
      "target": "n-locks-deadlock",
      "label": "requires"
    },
    {
      "id": "e-n-bplustree-n-locks-deadlock",
      "source": "n-bplustree",
      "target": "n-locks-deadlock",
      "label": "requires"
    },
    {
      "id": "e-n-cost-planner-n-columnar-simd",
      "source": "n-cost-planner",
      "target": "n-columnar-simd",
      "label": "requires"
    },
    {
      "id": "e-n-star-scd2-n-columnar-simd",
      "source": "n-star-scd2",
      "target": "n-columnar-simd",
      "label": "requires"
    },
    {
      "id": "e-n-wal-aries-n-sharding-newsql",
      "source": "n-wal-aries",
      "target": "n-sharding-newsql",
      "label": "requires"
    },
    {
      "id": "e-n-locks-deadlock-n-sharding-newsql",
      "source": "n-locks-deadlock",
      "target": "n-sharding-newsql",
      "label": "requires"
    },
    {
      "id": "e-n-columnar-simd-n-prod-dbre",
      "source": "n-columnar-simd",
      "target": "n-prod-dbre",
      "label": "requires"
    },
    {
      "id": "e-n-sharding-newsql-n-prod-dbre",
      "source": "n-sharding-newsql",
      "target": "n-prod-dbre",
      "label": "requires"
    },
    {
      "id": "e-n-keyset-tuning-n-prod-dbre",
      "source": "n-keyset-tuning",
      "target": "n-prod-dbre",
      "label": "requires"
    }
  ],
  "paths": [
    {
      "id": "sql-analytics-48",
      "title": "Analytical SQL, Joins, CTEs & Window Mastery (48 Units)",
      "role": "Data Analyst / Analytics Engineer / BI Architect",
      "targetRole": "Senior Analytics Engineer (L4/L5)",
      "estimatedWeeks": 5,
      "estimatedHours": "42 hrs",
      "difficulty": "Beginner → Advanced",
      "xpReward": 2400,
      "icon": "bar-chart-2",
      "tagline": "Master relational joins, Three-Valued NULL logic, fanout-free aggregations, recursive CTEs, window frames, and Kimball Star Schemas.",
      "description": "A focused 48-unit track engineered for analysts, data scientists, and analytics engineers who want complete mastery of multi-table joins, GROUPING SETS, recursive CTEs, window framing, sessionization, and dimensional warehouse modeling.",
      "unitCount": 48,
      "unitSlugs": [
        "why-databases-exist",
        "tables-rows-columns-types",
        "select-projection-aliases",
        "where-filtering-predicates",
        "boolean-logic-three-valued-null",
        "null-semantics-coalesce-nullif",
        "order-by-limit-offset-distinct",
        "case-expressions-type-casting",
        "case-stripe-ledger-precision",
        "build-sql-query-interpreter",
        "relational-algebra-set-theory",
        "inner-join-equi-joins",
        "left-right-full-outer-joins",
        "join-where-vs-on-filter-trap",
        "self-joins-non-equi-joins",
        "cross-join-cartesian-products",
        "semi-joins-anti-joins",
        "set-operations-union-intersect-except",
        "case-missing-null-notin-outage",
        "build-multi-table-order-reconciler",
        "aggregate-functions-internals",
        "group-by-execution-mechanics",
        "having-vs-where-pipeline",
        "conditional-aggregation-filter",
        "string-json-array-aggregation",
        "grouping-sets-rollup-cube",
        "join-fanout-chasm-traps",
        "histograms-percentiles-medians",
        "case-analytics-double-counting-bug",
        "build-executive-kpi-aggregation-suite",
        "scalar-row-table-subqueries",
        "correlated-subqueries-mechanics",
        "exists-not-exists-null-safety",
        "lateral-joins-cross-apply",
        "common-table-expressions-with",
        "cte-materialization-optimization-fence",
        "recursive-ctes-hierarchies",
        "graph-traversal-cycle-detection-sql",
        "case-recursive-org-permission-engine",
        "build-hierarchical-graph-query-engine",
        "window-functions-mental-model",
        "partition-by-order-by-mechanics",
        "ranking-functions-row-number-rank",
        "top-n-per-group-deduplication",
        "offset-functions-lag-lead-first-last",
        "window-frames-rows-range-groups",
        "running-totals-cumulative-shares",
        "gaps-and-islands-sessionization"
      ],
      "steps": [
        {
          "type": "topic",
          "slug": "why-databases-exist",
          "id": "why-databases-exist",
          "title": "1.1: Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL"
        },
        {
          "type": "topic",
          "slug": "tables-rows-columns-types",
          "id": "tables-rows-columns-types",
          "title": "1.1: Relations, Tuples, Attributes, Domains & SQL Data Types"
        },
        {
          "type": "topic",
          "slug": "select-projection-aliases",
          "id": "select-projection-aliases",
          "title": "1.1: SELECT Projection, Expressions, Aliases & Logical Execution Order"
        },
        {
          "type": "topic",
          "slug": "where-filtering-predicates",
          "id": "where-filtering-predicates",
          "title": "1.1: WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability"
        },
        {
          "type": "topic",
          "slug": "boolean-logic-three-valued-null",
          "id": "boolean-logic-three-valued-null",
          "title": "1.1: Boolean Logic, Operator Precedence & Three-Valued Logic (3VL)"
        },
        {
          "type": "topic",
          "slug": "null-semantics-coalesce-nullif",
          "id": "null-semantics-coalesce-nullif",
          "title": "1.1: NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF"
        },
        {
          "type": "topic",
          "slug": "order-by-limit-offset-distinct",
          "id": "order-by-limit-offset-distinct",
          "title": "1.1: Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT"
        },
        {
          "type": "topic",
          "slug": "case-expressions-type-casting",
          "id": "case-expressions-type-casting",
          "title": "1.1: Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning"
        },
        {
          "type": "topic",
          "slug": "case-stripe-ledger-precision",
          "id": "case-stripe-ledger-precision",
          "title": "1.1: Production Case Study: Why Floating-Point Corrupts Financial Ledgers"
        },
        {
          "type": "build",
          "slug": "build-sql-query-interpreter",
          "id": "build-sql-query-interpreter",
          "title": "1.1: Hands-On Build: Mini Relational Tuple Filter & Projection Engine"
        },
        {
          "type": "topic",
          "slug": "relational-algebra-set-theory",
          "id": "relational-algebra-set-theory",
          "title": "1.3: Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ)"
        },
        {
          "type": "topic",
          "slug": "inner-join-equi-joins",
          "id": "inner-join-equi-joins",
          "title": "1.3: INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal"
        },
        {
          "type": "topic",
          "slug": "left-right-full-outer-joins",
          "id": "left-right-full-outer-joins",
          "title": "1.3: Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension"
        },
        {
          "type": "topic",
          "slug": "join-where-vs-on-filter-trap",
          "id": "join-where-vs-on-filter-trap",
          "title": "1.3: The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE"
        },
        {
          "type": "topic",
          "slug": "self-joins-non-equi-joins",
          "id": "self-joins-non-equi-joins",
          "title": "1.3: Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN)"
        },
        {
          "type": "topic",
          "slug": "cross-join-cartesian-products",
          "id": "cross-join-cartesian-products",
          "title": "1.3: CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions"
        },
        {
          "type": "topic",
          "slug": "semi-joins-anti-joins",
          "id": "semi-joins-anti-joins",
          "title": "1.3: Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL)"
        },
        {
          "type": "topic",
          "slug": "set-operations-union-intersect-except",
          "id": "set-operations-union-intersect-except",
          "title": "1.3: Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT"
        },
        {
          "type": "topic",
          "slug": "case-missing-null-notin-outage",
          "id": "case-missing-null-notin-outage",
          "title": "1.3: Production Case Study: How a Single NULL in NOT IN Returned Zero Rows"
        },
        {
          "type": "build",
          "slug": "build-multi-table-order-reconciler",
          "id": "build-multi-table-order-reconciler",
          "title": "1.3: Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine"
        },
        {
          "type": "topic",
          "slug": "aggregate-functions-internals",
          "id": "aggregate-functions-internals",
          "title": "2.1: Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG"
        },
        {
          "type": "topic",
          "slug": "group-by-execution-mechanics",
          "id": "group-by-execution-mechanics",
          "title": "2.1: GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency"
        },
        {
          "type": "topic",
          "slug": "having-vs-where-pipeline",
          "id": "having-vs-where-pipeline",
          "title": "2.1: Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline"
        },
        {
          "type": "topic",
          "slug": "conditional-aggregation-filter",
          "id": "conditional-aggregation-filter",
          "title": "2.1: Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...)"
        },
        {
          "type": "topic",
          "slug": "string-json-array-aggregation",
          "id": "string-json-array-aggregation",
          "title": "2.1: List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation"
        },
        {
          "type": "topic",
          "slug": "grouping-sets-rollup-cube",
          "id": "grouping-sets-rollup-cube",
          "title": "2.1: Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING()"
        },
        {
          "type": "topic",
          "slug": "join-fanout-chasm-traps",
          "id": "join-fanout-chasm-traps",
          "title": "2.1: The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts)"
        },
        {
          "type": "topic",
          "slug": "histograms-percentiles-medians",
          "id": "histograms-percentiles-medians",
          "title": "2.1: Statistical SQL: Equi-Width Histograms, Percentiles & Medians"
        },
        {
          "type": "topic",
          "slug": "case-analytics-double-counting-bug",
          "id": "case-analytics-double-counting-bug",
          "title": "2.1: Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug"
        },
        {
          "type": "build",
          "slug": "build-executive-kpi-aggregation-suite",
          "id": "build-executive-kpi-aggregation-suite",
          "title": "2.1: Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite"
        },
        {
          "type": "topic",
          "slug": "scalar-row-table-subqueries",
          "id": "scalar-row-table-subqueries",
          "title": "2.2: Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries"
        },
        {
          "type": "topic",
          "slug": "correlated-subqueries-mechanics",
          "id": "correlated-subqueries-mechanics",
          "title": "2.2: Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting"
        },
        {
          "type": "topic",
          "slug": "exists-not-exists-null-safety",
          "id": "exists-not-exists-null-safety",
          "title": "2.2: EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety"
        },
        {
          "type": "topic",
          "slug": "lateral-joins-cross-apply",
          "id": "lateral-joins-cross-apply",
          "title": "2.2: LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group"
        },
        {
          "type": "topic",
          "slug": "common-table-expressions-with",
          "id": "common-table-expressions-with",
          "title": "2.2: Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines"
        },
        {
          "type": "topic",
          "slug": "cte-materialization-optimization-fence",
          "id": "cte-materialization-optimization-fence",
          "title": "2.2: CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints"
        },
        {
          "type": "topic",
          "slug": "recursive-ctes-hierarchies",
          "id": "recursive-ctes-hierarchies",
          "title": "2.2: Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint"
        },
        {
          "type": "topic",
          "slug": "graph-traversal-cycle-detection-sql",
          "id": "graph-traversal-cycle-detection-sql",
          "title": "2.2: Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL"
        },
        {
          "type": "topic",
          "slug": "case-recursive-org-permission-engine",
          "id": "case-recursive-org-permission-engine",
          "title": "2.2: Production Case Study: Hierarchical RBAC Permission Inheritance in SQL"
        },
        {
          "type": "build",
          "slug": "build-hierarchical-graph-query-engine",
          "id": "build-hierarchical-graph-query-engine",
          "title": "2.2: Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine"
        },
        {
          "type": "topic",
          "slug": "window-functions-mental-model",
          "id": "window-functions-mental-model",
          "title": "2.3: The Window Function Mental Model: Preserving Row Identity + Context"
        },
        {
          "type": "topic",
          "slug": "partition-by-order-by-mechanics",
          "id": "partition-by-order-by-mechanics",
          "title": "2.3: PARTITION BY, ORDER BY & The Default RANGE Frame Trap"
        },
        {
          "type": "topic",
          "slug": "ranking-functions-row-number-rank",
          "id": "ranking-functions-row-number-rank",
          "title": "2.3: Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST"
        },
        {
          "type": "topic",
          "slug": "top-n-per-group-deduplication",
          "id": "top-n-per-group-deduplication",
          "title": "2.3: Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY"
        },
        {
          "type": "topic",
          "slug": "offset-functions-lag-lead-first-last",
          "id": "offset-functions-lag-lead-first-last",
          "title": "2.3: Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap"
        },
        {
          "type": "topic",
          "slug": "window-frames-rows-range-groups",
          "id": "window-frames-rows-range-groups",
          "title": "2.3: Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages"
        },
        {
          "type": "topic",
          "slug": "running-totals-cumulative-shares",
          "id": "running-totals-cumulative-shares",
          "title": "2.3: Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses"
        },
        {
          "type": "topic",
          "slug": "gaps-and-islands-sessionization",
          "id": "gaps-and-islands-sessionization",
          "title": "2.3: Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization"
        }
      ]
    },
    {
      "id": "backend-oltp-60",
      "title": "Backend Engineer & High-Concurrency OLTP Track (60 Units)",
      "role": "Backend & Full-Stack Software Engineer",
      "targetRole": "Senior Backend Engineer (L5/L6)",
      "estimatedWeeks": 7,
      "estimatedHours": "55 hrs",
      "difficulty": "Intermediate → Staff",
      "xpReward": 3000,
      "icon": "cpu",
      "tagline": "Design normalized schemas, eliminate N+1 and non-SARGable queries, master B+Tree composite indexing, MVCC isolation, and SKIP LOCKED queues.",
      "description": "Everything a production backend engineer needs to build rock-solid transactional systems: UUIDv7 primary keys, idempotent upserts, BCNF normalization, JSONB GIN indexing, B+Tree composite design, EXPLAIN ANALYZE tuning, MVCC write-skew prevention, and PgBouncer pooling.",
      "unitCount": 60,
      "unitSlugs": [
        "why-databases-exist",
        "tables-rows-columns-types",
        "select-projection-aliases",
        "where-filtering-predicates",
        "boolean-logic-three-valued-null",
        "null-semantics-coalesce-nullif",
        "order-by-limit-offset-distinct",
        "case-expressions-type-casting",
        "case-stripe-ledger-precision",
        "build-sql-query-interpreter",
        "create-table-ddl-anatomy",
        "primary-keys-surrogate-vs-natural",
        "foreign-keys-referential-integrity",
        "check-unique-not-null-defaults",
        "insert-bulk-loading-returning",
        "upsert-on-conflict-merge",
        "update-delete-safe-mutations",
        "views-temp-tables-ctas",
        "case-github-zero-downtime-migrations",
        "build-ecommerce-schema-ddl",
        "relational-algebra-set-theory",
        "inner-join-equi-joins",
        "left-right-full-outer-joins",
        "join-where-vs-on-filter-trap",
        "self-joins-non-equi-joins",
        "cross-join-cartesian-products",
        "semi-joins-anti-joins",
        "set-operations-union-intersect-except",
        "case-missing-null-notin-outage",
        "build-multi-table-order-reconciler",
        "entity-relationship-modeling",
        "functional-dependencies-keys",
        "first-normal-form-atomicity",
        "second-third-normal-form",
        "boyce-codd-fourth-fifth-normal-form",
        "update-insertion-deletion-anomalies",
        "strategic-denormalization-tradeoffs",
        "schema-anti-patterns-eav-god-tables",
        "case-shopify-multi-tenant-schema",
        "build-normalized-booking-schema",
        "calendar-tables-date-spines",
        "cohort-retention-matrix-sql",
        "funnel-conversion-attribution-sql",
        "interval-overlap-allen-algebra",
        "pivoting-unpivoting-cross-tabs",
        "triggers-stored-procedures-udfs",
        "materialized-views-incremental-refresh",
        "sql-injection-parameterized-security",
        "case-double-booking-hotel-inventory",
        "build-saas-cohort-funnel-workbench",
        "life-of-a-sql-query-pipeline",
        "reading-explain-and-explain-analyze",
        "table-statistics-histograms-cardinality",
        "selectivity-estimation-correlated-columns",
        "scan-operators-seq-index-bitmap",
        "sargability-functions-on-columns",
        "or-conditions-in-lists-union-rewrites",
        "sorting-spill-to-disk-top-n-heapsort",
        "case-stale-statistics-plan-flip",
        "build-visual-explain-plan-analyzer"
      ],
      "steps": [
        {
          "type": "topic",
          "slug": "why-databases-exist",
          "id": "why-databases-exist",
          "title": "1.1: Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL"
        },
        {
          "type": "topic",
          "slug": "tables-rows-columns-types",
          "id": "tables-rows-columns-types",
          "title": "1.1: Relations, Tuples, Attributes, Domains & SQL Data Types"
        },
        {
          "type": "topic",
          "slug": "select-projection-aliases",
          "id": "select-projection-aliases",
          "title": "1.1: SELECT Projection, Expressions, Aliases & Logical Execution Order"
        },
        {
          "type": "topic",
          "slug": "where-filtering-predicates",
          "id": "where-filtering-predicates",
          "title": "1.1: WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability"
        },
        {
          "type": "topic",
          "slug": "boolean-logic-three-valued-null",
          "id": "boolean-logic-three-valued-null",
          "title": "1.1: Boolean Logic, Operator Precedence & Three-Valued Logic (3VL)"
        },
        {
          "type": "topic",
          "slug": "null-semantics-coalesce-nullif",
          "id": "null-semantics-coalesce-nullif",
          "title": "1.1: NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF"
        },
        {
          "type": "topic",
          "slug": "order-by-limit-offset-distinct",
          "id": "order-by-limit-offset-distinct",
          "title": "1.1: Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT"
        },
        {
          "type": "topic",
          "slug": "case-expressions-type-casting",
          "id": "case-expressions-type-casting",
          "title": "1.1: Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning"
        },
        {
          "type": "topic",
          "slug": "case-stripe-ledger-precision",
          "id": "case-stripe-ledger-precision",
          "title": "1.1: Production Case Study: Why Floating-Point Corrupts Financial Ledgers"
        },
        {
          "type": "build",
          "slug": "build-sql-query-interpreter",
          "id": "build-sql-query-interpreter",
          "title": "1.1: Hands-On Build: Mini Relational Tuple Filter & Projection Engine"
        },
        {
          "type": "topic",
          "slug": "create-table-ddl-anatomy",
          "id": "create-table-ddl-anatomy",
          "title": "1.2: CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs"
        },
        {
          "type": "topic",
          "slug": "primary-keys-surrogate-vs-natural",
          "id": "primary-keys-surrogate-vs-natural",
          "title": "1.2: Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality"
        },
        {
          "type": "topic",
          "slug": "foreign-keys-referential-integrity",
          "id": "foreign-keys-referential-integrity",
          "title": "1.2: Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT)"
        },
        {
          "type": "topic",
          "slug": "check-unique-not-null-defaults",
          "id": "check-unique-not-null-defaults",
          "title": "1.2: Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns"
        },
        {
          "type": "topic",
          "slug": "insert-bulk-loading-returning",
          "id": "insert-bulk-loading-returning",
          "title": "1.2: Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING"
        },
        {
          "type": "topic",
          "slug": "upsert-on-conflict-merge",
          "id": "upsert-on-conflict-merge",
          "title": "1.2: Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE"
        },
        {
          "type": "topic",
          "slug": "update-delete-safe-mutations",
          "id": "update-delete-safe-mutations",
          "title": "1.2: Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs"
        },
        {
          "type": "topic",
          "slug": "views-temp-tables-ctas",
          "id": "views-temp-tables-ctas",
          "title": "1.2: Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables"
        },
        {
          "type": "topic",
          "slug": "case-github-zero-downtime-migrations",
          "id": "case-github-zero-downtime-migrations",
          "title": "1.2: Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract)"
        },
        {
          "type": "build",
          "slug": "build-ecommerce-schema-ddl",
          "id": "build-ecommerce-schema-ddl",
          "title": "1.2: Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline"
        },
        {
          "type": "topic",
          "slug": "relational-algebra-set-theory",
          "id": "relational-algebra-set-theory",
          "title": "1.3: Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ)"
        },
        {
          "type": "topic",
          "slug": "inner-join-equi-joins",
          "id": "inner-join-equi-joins",
          "title": "1.3: INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal"
        },
        {
          "type": "topic",
          "slug": "left-right-full-outer-joins",
          "id": "left-right-full-outer-joins",
          "title": "1.3: Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension"
        },
        {
          "type": "topic",
          "slug": "join-where-vs-on-filter-trap",
          "id": "join-where-vs-on-filter-trap",
          "title": "1.3: The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE"
        },
        {
          "type": "topic",
          "slug": "self-joins-non-equi-joins",
          "id": "self-joins-non-equi-joins",
          "title": "1.3: Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN)"
        },
        {
          "type": "topic",
          "slug": "cross-join-cartesian-products",
          "id": "cross-join-cartesian-products",
          "title": "1.3: CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions"
        },
        {
          "type": "topic",
          "slug": "semi-joins-anti-joins",
          "id": "semi-joins-anti-joins",
          "title": "1.3: Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL)"
        },
        {
          "type": "topic",
          "slug": "set-operations-union-intersect-except",
          "id": "set-operations-union-intersect-except",
          "title": "1.3: Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT"
        },
        {
          "type": "topic",
          "slug": "case-missing-null-notin-outage",
          "id": "case-missing-null-notin-outage",
          "title": "1.3: Production Case Study: How a Single NULL in NOT IN Returned Zero Rows"
        },
        {
          "type": "build",
          "slug": "build-multi-table-order-reconciler",
          "id": "build-multi-table-order-reconciler",
          "title": "1.3: Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine"
        },
        {
          "type": "topic",
          "slug": "entity-relationship-modeling",
          "id": "entity-relationship-modeling",
          "title": "3.1: Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables"
        },
        {
          "type": "topic",
          "slug": "functional-dependencies-keys",
          "id": "functional-dependencies-keys",
          "title": "3.1: Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure"
        },
        {
          "type": "topic",
          "slug": "first-normal-form-atomicity",
          "id": "first-normal-form-atomicity",
          "title": "3.1: First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns"
        },
        {
          "type": "topic",
          "slug": "second-third-normal-form",
          "id": "second-third-normal-form",
          "title": "3.1: Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies"
        },
        {
          "type": "topic",
          "slug": "boyce-codd-fourth-fifth-normal-form",
          "id": "boyce-codd-fourth-fifth-normal-form",
          "title": "3.1: Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF)"
        },
        {
          "type": "topic",
          "slug": "update-insertion-deletion-anomalies",
          "id": "update-insertion-deletion-anomalies",
          "title": "3.1: Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas"
        },
        {
          "type": "topic",
          "slug": "strategic-denormalization-tradeoffs",
          "id": "strategic-denormalization-tradeoffs",
          "title": "3.1: Strategic Denormalization: Read vs Write Amplification & Cached Counters"
        },
        {
          "type": "topic",
          "slug": "schema-anti-patterns-eav-god-tables",
          "id": "schema-anti-patterns-eav-god-tables",
          "title": "3.1: Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables"
        },
        {
          "type": "topic",
          "slug": "case-shopify-multi-tenant-schema",
          "id": "case-shopify-multi-tenant-schema",
          "title": "3.1: Production Case Study: Multi-Tenant Schema Architecture at Scale"
        },
        {
          "type": "build",
          "slug": "build-normalized-booking-schema",
          "id": "build-normalized-booking-schema",
          "title": "3.1: Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System"
        },
        {
          "type": "topic",
          "slug": "calendar-tables-date-spines",
          "id": "calendar-tables-date-spines",
          "title": "3.3: Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets"
        },
        {
          "type": "topic",
          "slug": "cohort-retention-matrix-sql",
          "id": "cohort-retention-matrix-sql",
          "title": "3.3: Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL"
        },
        {
          "type": "topic",
          "slug": "funnel-conversion-attribution-sql",
          "id": "funnel-conversion-attribution-sql",
          "title": "3.3: Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution"
        },
        {
          "type": "topic",
          "slug": "interval-overlap-allen-algebra",
          "id": "interval-overlap-allen-algebra",
          "title": "3.3: Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals"
        },
        {
          "type": "topic",
          "slug": "pivoting-unpivoting-cross-tabs",
          "id": "pivoting-unpivoting-cross-tabs",
          "title": "3.3: Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns"
        },
        {
          "type": "topic",
          "slug": "triggers-stored-procedures-udfs",
          "id": "triggers-stored-procedures-udfs",
          "title": "3.3: Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead"
        },
        {
          "type": "topic",
          "slug": "materialized-views-incremental-refresh",
          "id": "materialized-views-incremental-refresh",
          "title": "3.3: Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM)"
        },
        {
          "type": "topic",
          "slug": "sql-injection-parameterized-security",
          "id": "sql-injection-parameterized-security",
          "title": "3.3: SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS)"
        },
        {
          "type": "topic",
          "slug": "case-double-booking-hotel-inventory",
          "id": "case-double-booking-hotel-inventory",
          "title": "3.3: Production Case Study: Preventing Concurrent Calendar Double-Bookings"
        },
        {
          "type": "build",
          "slug": "build-saas-cohort-funnel-workbench",
          "id": "build-saas-cohort-funnel-workbench",
          "title": "3.3: Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)"
        },
        {
          "type": "topic",
          "slug": "life-of-a-sql-query-pipeline",
          "id": "life-of-a-sql-query-pipeline",
          "title": "4.2: Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor"
        },
        {
          "type": "topic",
          "slug": "reading-explain-and-explain-analyze",
          "id": "reading-explain-and-explain-analyze",
          "title": "4.2: Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers"
        },
        {
          "type": "topic",
          "slug": "table-statistics-histograms-cardinality",
          "id": "table-statistics-histograms-cardinality",
          "title": "4.2: Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms"
        },
        {
          "type": "topic",
          "slug": "selectivity-estimation-correlated-columns",
          "id": "selectivity-estimation-correlated-columns",
          "title": "4.2: Selectivity Math, Independence Assumption Failures & Extended Statistics"
        },
        {
          "type": "topic",
          "slug": "scan-operators-seq-index-bitmap",
          "id": "scan-operators-seq-index-bitmap",
          "title": "4.2: Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan"
        },
        {
          "type": "topic",
          "slug": "sargability-functions-on-columns",
          "id": "sargability-functions-on-columns",
          "title": "4.2: SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes"
        },
        {
          "type": "topic",
          "slug": "or-conditions-in-lists-union-rewrites",
          "id": "or-conditions-in-lists-union-rewrites",
          "title": "4.2: Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites"
        },
        {
          "type": "topic",
          "slug": "sorting-spill-to-disk-top-n-heapsort",
          "id": "sorting-spill-to-disk-top-n-heapsort",
          "title": "4.2: Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills"
        },
        {
          "type": "topic",
          "slug": "case-stale-statistics-plan-flip",
          "id": "case-stale-statistics-plan-flip",
          "title": "4.2: Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics"
        },
        {
          "type": "build",
          "slug": "build-visual-explain-plan-analyzer",
          "id": "build-visual-explain-plan-analyzer",
          "title": "4.2: Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter"
        }
      ]
    },
    {
      "id": "data-platform-65",
      "title": "Data Platform, Lakehouse & Columnar Internals (65 Units)",
      "role": "Data Engineer / Analytics Platform Engineer",
      "targetRole": "Staff Data Engineer (L6)",
      "estimatedWeeks": 8,
      "estimatedHours": "62 hrs",
      "difficulty": "Intermediate → Staff",
      "xpReward": 3250,
      "icon": "layers",
      "tagline": "Go from analytical SQL and Kimball Star Schemas down to 8KB pages, Parquet PAX storage, SIMD vectorized execution, and Outbox CDC.",
      "description": "Bridges advanced analytical SQL with physical storage internals: window functions, SCD Type 2, slotted pages, B+Tree/BRIN indexes, cost-based join planning, Parquet/Iceberg lakehouses, DuckDB/ClickHouse vectorized execution, and distributed sharding.",
      "unitCount": 65,
      "unitSlugs": [
        "aggregate-functions-internals",
        "group-by-execution-mechanics",
        "having-vs-where-pipeline",
        "conditional-aggregation-filter",
        "string-json-array-aggregation",
        "grouping-sets-rollup-cube",
        "join-fanout-chasm-traps",
        "histograms-percentiles-medians",
        "case-analytics-double-counting-bug",
        "build-executive-kpi-aggregation-suite",
        "scalar-row-table-subqueries",
        "correlated-subqueries-mechanics",
        "exists-not-exists-null-safety",
        "lateral-joins-cross-apply",
        "common-table-expressions-with",
        "cte-materialization-optimization-fence",
        "recursive-ctes-hierarchies",
        "graph-traversal-cycle-detection-sql",
        "case-recursive-org-permission-engine",
        "build-hierarchical-graph-query-engine",
        "window-functions-mental-model",
        "partition-by-order-by-mechanics",
        "ranking-functions-row-number-rank",
        "top-n-per-group-deduplication",
        "offset-functions-lag-lead-first-last",
        "window-frames-rows-range-groups",
        "running-totals-cumulative-shares",
        "gaps-and-islands-sessionization",
        "case-fintech-velocity-fraud-window",
        "build-sessionization-retention-engine",
        "oltp-vs-olap-workload-physics",
        "star-schema-facts-dimensions",
        "snowflake-vs-star-vs-obt",
        "slowly-changing-dimensions-scd",
        "bridge-tables-junk-role-dimensions",
        "temporal-tables-bitemporal-sql",
        "json-semi-structured-hybrid-schemas",
        "idempotency-audit-logs-event-tables",
        "case-airbnb-minerva-metric-layer",
        "build-scd-type2-warehouse-pipeline",
        "why-indexes-work-io-cost-model",
        "btree-bplustree-internal-anatomy",
        "clustered-vs-secondary-indexes",
        "composite-indexes-leftmost-prefix",
        "covering-indexes-index-only-scans",
        "partial-filtered-expression-indexes",
        "hash-gin-gist-brin-bloom-indexes",
        "index-bloat-write-amplification-traps",
        "case-slack-composite-index-incident",
        "build-btree-index-advisor",
        "life-of-a-sql-query-pipeline",
        "reading-explain-and-explain-analyze",
        "table-statistics-histograms-cardinality",
        "selectivity-estimation-correlated-columns",
        "scan-operators-seq-index-bitmap",
        "sargability-functions-on-columns",
        "or-conditions-in-lists-union-rewrites",
        "sorting-spill-to-disk-top-n-heapsort",
        "case-stale-statistics-plan-flip",
        "build-visual-explain-plan-analyzer",
        "nested-loop-join-indexed-nlj",
        "hash-join-build-probe-grace",
        "sort-merge-join-zipper-mechanics",
        "join-order-search-dynamic-programming",
        "predicate-pushdown-projection-pruning"
      ],
      "steps": [
        {
          "type": "topic",
          "slug": "aggregate-functions-internals",
          "id": "aggregate-functions-internals",
          "title": "2.1: Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG"
        },
        {
          "type": "topic",
          "slug": "group-by-execution-mechanics",
          "id": "group-by-execution-mechanics",
          "title": "2.1: GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency"
        },
        {
          "type": "topic",
          "slug": "having-vs-where-pipeline",
          "id": "having-vs-where-pipeline",
          "title": "2.1: Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline"
        },
        {
          "type": "topic",
          "slug": "conditional-aggregation-filter",
          "id": "conditional-aggregation-filter",
          "title": "2.1: Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...)"
        },
        {
          "type": "topic",
          "slug": "string-json-array-aggregation",
          "id": "string-json-array-aggregation",
          "title": "2.1: List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation"
        },
        {
          "type": "topic",
          "slug": "grouping-sets-rollup-cube",
          "id": "grouping-sets-rollup-cube",
          "title": "2.1: Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING()"
        },
        {
          "type": "topic",
          "slug": "join-fanout-chasm-traps",
          "id": "join-fanout-chasm-traps",
          "title": "2.1: The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts)"
        },
        {
          "type": "topic",
          "slug": "histograms-percentiles-medians",
          "id": "histograms-percentiles-medians",
          "title": "2.1: Statistical SQL: Equi-Width Histograms, Percentiles & Medians"
        },
        {
          "type": "topic",
          "slug": "case-analytics-double-counting-bug",
          "id": "case-analytics-double-counting-bug",
          "title": "2.1: Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug"
        },
        {
          "type": "build",
          "slug": "build-executive-kpi-aggregation-suite",
          "id": "build-executive-kpi-aggregation-suite",
          "title": "2.1: Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite"
        },
        {
          "type": "topic",
          "slug": "scalar-row-table-subqueries",
          "id": "scalar-row-table-subqueries",
          "title": "2.2: Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries"
        },
        {
          "type": "topic",
          "slug": "correlated-subqueries-mechanics",
          "id": "correlated-subqueries-mechanics",
          "title": "2.2: Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting"
        },
        {
          "type": "topic",
          "slug": "exists-not-exists-null-safety",
          "id": "exists-not-exists-null-safety",
          "title": "2.2: EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety"
        },
        {
          "type": "topic",
          "slug": "lateral-joins-cross-apply",
          "id": "lateral-joins-cross-apply",
          "title": "2.2: LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group"
        },
        {
          "type": "topic",
          "slug": "common-table-expressions-with",
          "id": "common-table-expressions-with",
          "title": "2.2: Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines"
        },
        {
          "type": "topic",
          "slug": "cte-materialization-optimization-fence",
          "id": "cte-materialization-optimization-fence",
          "title": "2.2: CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints"
        },
        {
          "type": "topic",
          "slug": "recursive-ctes-hierarchies",
          "id": "recursive-ctes-hierarchies",
          "title": "2.2: Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint"
        },
        {
          "type": "topic",
          "slug": "graph-traversal-cycle-detection-sql",
          "id": "graph-traversal-cycle-detection-sql",
          "title": "2.2: Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL"
        },
        {
          "type": "topic",
          "slug": "case-recursive-org-permission-engine",
          "id": "case-recursive-org-permission-engine",
          "title": "2.2: Production Case Study: Hierarchical RBAC Permission Inheritance in SQL"
        },
        {
          "type": "build",
          "slug": "build-hierarchical-graph-query-engine",
          "id": "build-hierarchical-graph-query-engine",
          "title": "2.2: Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine"
        },
        {
          "type": "topic",
          "slug": "window-functions-mental-model",
          "id": "window-functions-mental-model",
          "title": "2.3: The Window Function Mental Model: Preserving Row Identity + Context"
        },
        {
          "type": "topic",
          "slug": "partition-by-order-by-mechanics",
          "id": "partition-by-order-by-mechanics",
          "title": "2.3: PARTITION BY, ORDER BY & The Default RANGE Frame Trap"
        },
        {
          "type": "topic",
          "slug": "ranking-functions-row-number-rank",
          "id": "ranking-functions-row-number-rank",
          "title": "2.3: Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST"
        },
        {
          "type": "topic",
          "slug": "top-n-per-group-deduplication",
          "id": "top-n-per-group-deduplication",
          "title": "2.3: Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY"
        },
        {
          "type": "topic",
          "slug": "offset-functions-lag-lead-first-last",
          "id": "offset-functions-lag-lead-first-last",
          "title": "2.3: Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap"
        },
        {
          "type": "topic",
          "slug": "window-frames-rows-range-groups",
          "id": "window-frames-rows-range-groups",
          "title": "2.3: Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages"
        },
        {
          "type": "topic",
          "slug": "running-totals-cumulative-shares",
          "id": "running-totals-cumulative-shares",
          "title": "2.3: Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses"
        },
        {
          "type": "topic",
          "slug": "gaps-and-islands-sessionization",
          "id": "gaps-and-islands-sessionization",
          "title": "2.3: Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization"
        },
        {
          "type": "topic",
          "slug": "case-fintech-velocity-fraud-window",
          "id": "case-fintech-velocity-fraud-window",
          "title": "2.3: Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection"
        },
        {
          "type": "build",
          "slug": "build-sessionization-retention-engine",
          "id": "build-sessionization-retention-engine",
          "title": "2.3: Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer"
        },
        {
          "type": "topic",
          "slug": "oltp-vs-olap-workload-physics",
          "id": "oltp-vs-olap-workload-physics",
          "title": "3.2: OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans"
        },
        {
          "type": "topic",
          "slug": "star-schema-facts-dimensions",
          "id": "star-schema-facts-dimensions",
          "title": "3.2: Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions"
        },
        {
          "type": "topic",
          "slug": "snowflake-vs-star-vs-obt",
          "id": "snowflake-vs-star-vs-obt",
          "title": "3.2: Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses"
        },
        {
          "type": "topic",
          "slug": "slowly-changing-dimensions-scd",
          "id": "slowly-changing-dimensions-scd",
          "title": "3.2: Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6"
        },
        {
          "type": "topic",
          "slug": "bridge-tables-junk-role-dimensions",
          "id": "bridge-tables-junk-role-dimensions",
          "title": "3.2: Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables"
        },
        {
          "type": "topic",
          "slug": "temporal-tables-bitemporal-sql",
          "id": "temporal-tables-bitemporal-sql",
          "title": "3.2: Temporal & Bitemporal SQL: System Time vs Valid Application Time"
        },
        {
          "type": "topic",
          "slug": "json-semi-structured-hybrid-schemas",
          "id": "json-semi-structured-hybrid-schemas",
          "title": "3.2: Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution"
        },
        {
          "type": "topic",
          "slug": "idempotency-audit-logs-event-tables",
          "id": "idempotency-audit-logs-event-tables",
          "title": "3.2: Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox"
        },
        {
          "type": "topic",
          "slug": "case-airbnb-minerva-metric-layer",
          "id": "case-airbnb-minerva-metric-layer",
          "title": "3.2: Production Case Study: Designing a Canonical Metric Store at Petabyte Scale"
        },
        {
          "type": "build",
          "slug": "build-scd-type2-warehouse-pipeline",
          "id": "build-scd-type2-warehouse-pipeline",
          "title": "3.2: Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline"
        },
        {
          "type": "topic",
          "slug": "why-indexes-work-io-cost-model",
          "id": "why-indexes-work-io-cost-model",
          "title": "4.1: Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics"
        },
        {
          "type": "topic",
          "slug": "btree-bplustree-internal-anatomy",
          "id": "btree-bplustree-internal-anatomy",
          "title": "4.1: B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links"
        },
        {
          "type": "topic",
          "slug": "clustered-vs-secondary-indexes",
          "id": "clustered-vs-secondary-indexes",
          "title": "4.1: Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres)"
        },
        {
          "type": "topic",
          "slug": "composite-indexes-leftmost-prefix",
          "id": "composite-indexes-leftmost-prefix",
          "title": "4.1: Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range"
        },
        {
          "type": "topic",
          "slug": "covering-indexes-index-only-scans",
          "id": "covering-indexes-index-only-scans",
          "title": "4.1: Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map)"
        },
        {
          "type": "topic",
          "slug": "partial-filtered-expression-indexes",
          "id": "partial-filtered-expression-indexes",
          "title": "4.1: Partial (Filtered) Indexes & Functional / Expression Indexes"
        },
        {
          "type": "topic",
          "slug": "hash-gin-gist-brin-bloom-indexes",
          "id": "hash-gin-gist-brin-bloom-indexes",
          "title": "4.1: Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap"
        },
        {
          "type": "topic",
          "slug": "index-bloat-write-amplification-traps",
          "id": "index-bloat-write-amplification-traps",
          "title": "4.1: When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds"
        },
        {
          "type": "topic",
          "slug": "case-slack-composite-index-incident",
          "id": "case-slack-composite-index-incident",
          "title": "4.1: Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4%"
        },
        {
          "type": "build",
          "slug": "build-btree-index-advisor",
          "id": "build-btree-index-advisor",
          "title": "4.1: Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor"
        },
        {
          "type": "topic",
          "slug": "life-of-a-sql-query-pipeline",
          "id": "life-of-a-sql-query-pipeline",
          "title": "4.2: Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor"
        },
        {
          "type": "topic",
          "slug": "reading-explain-and-explain-analyze",
          "id": "reading-explain-and-explain-analyze",
          "title": "4.2: Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers"
        },
        {
          "type": "topic",
          "slug": "table-statistics-histograms-cardinality",
          "id": "table-statistics-histograms-cardinality",
          "title": "4.2: Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms"
        },
        {
          "type": "topic",
          "slug": "selectivity-estimation-correlated-columns",
          "id": "selectivity-estimation-correlated-columns",
          "title": "4.2: Selectivity Math, Independence Assumption Failures & Extended Statistics"
        },
        {
          "type": "topic",
          "slug": "scan-operators-seq-index-bitmap",
          "id": "scan-operators-seq-index-bitmap",
          "title": "4.2: Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan"
        },
        {
          "type": "topic",
          "slug": "sargability-functions-on-columns",
          "id": "sargability-functions-on-columns",
          "title": "4.2: SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes"
        },
        {
          "type": "topic",
          "slug": "or-conditions-in-lists-union-rewrites",
          "id": "or-conditions-in-lists-union-rewrites",
          "title": "4.2: Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites"
        },
        {
          "type": "topic",
          "slug": "sorting-spill-to-disk-top-n-heapsort",
          "id": "sorting-spill-to-disk-top-n-heapsort",
          "title": "4.2: Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills"
        },
        {
          "type": "topic",
          "slug": "case-stale-statistics-plan-flip",
          "id": "case-stale-statistics-plan-flip",
          "title": "4.2: Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics"
        },
        {
          "type": "build",
          "slug": "build-visual-explain-plan-analyzer",
          "id": "build-visual-explain-plan-analyzer",
          "title": "4.2: Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter"
        },
        {
          "type": "topic",
          "slug": "nested-loop-join-indexed-nlj",
          "id": "nested-loop-join-indexed-nlj",
          "title": "4.3: Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ"
        },
        {
          "type": "topic",
          "slug": "hash-join-build-probe-grace",
          "id": "hash-join-build-probe-grace",
          "title": "4.3: Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills"
        },
        {
          "type": "topic",
          "slug": "sort-merge-join-zipper-mechanics",
          "id": "sort-merge-join-zipper-mechanics",
          "title": "4.3: Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding"
        },
        {
          "type": "topic",
          "slug": "join-order-search-dynamic-programming",
          "id": "join-order-search-dynamic-programming",
          "title": "4.3: Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees"
        },
        {
          "type": "topic",
          "slug": "predicate-pushdown-projection-pruning",
          "id": "predicate-pushdown-projection-pruning",
          "title": "4.3: Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination"
        }
      ]
    },
    {
      "id": "staff-db-architect-180",
      "title": "Complete SQL & Database Internals Mastery (All 180 Units)",
      "role": "Database Architect / Principal Systems Engineer / DBRE",
      "targetRole": "Staff / Principal Architect (L6/L7+)",
      "estimatedWeeks": 16,
      "estimatedHours": "180 hrs",
      "difficulty": "Beginner → Principal",
      "xpReward": 9000,
      "icon": "award",
      "tagline": "The complete 18-module journey from Codd's relational algebra and window functions to B+Trees, ARIES WAL recovery, SSI, and Spanner.",
      "description": "Complete all 180 curriculum units, 18 from-scratch storage & query engine builds, 180 interactive WASM SQL labs, and 12 production incident challenges across all 6 tracks.",
      "unitCount": 180,
      "unitSlugs": [
        "why-databases-exist",
        "tables-rows-columns-types",
        "select-projection-aliases",
        "where-filtering-predicates",
        "boolean-logic-three-valued-null",
        "null-semantics-coalesce-nullif",
        "order-by-limit-offset-distinct",
        "case-expressions-type-casting",
        "case-stripe-ledger-precision",
        "build-sql-query-interpreter",
        "create-table-ddl-anatomy",
        "primary-keys-surrogate-vs-natural",
        "foreign-keys-referential-integrity",
        "check-unique-not-null-defaults",
        "insert-bulk-loading-returning",
        "upsert-on-conflict-merge",
        "update-delete-safe-mutations",
        "views-temp-tables-ctas",
        "case-github-zero-downtime-migrations",
        "build-ecommerce-schema-ddl",
        "relational-algebra-set-theory",
        "inner-join-equi-joins",
        "left-right-full-outer-joins",
        "join-where-vs-on-filter-trap",
        "self-joins-non-equi-joins",
        "cross-join-cartesian-products",
        "semi-joins-anti-joins",
        "set-operations-union-intersect-except",
        "case-missing-null-notin-outage",
        "build-multi-table-order-reconciler",
        "aggregate-functions-internals",
        "group-by-execution-mechanics",
        "having-vs-where-pipeline",
        "conditional-aggregation-filter",
        "string-json-array-aggregation",
        "grouping-sets-rollup-cube",
        "join-fanout-chasm-traps",
        "histograms-percentiles-medians",
        "case-analytics-double-counting-bug",
        "build-executive-kpi-aggregation-suite",
        "scalar-row-table-subqueries",
        "correlated-subqueries-mechanics",
        "exists-not-exists-null-safety",
        "lateral-joins-cross-apply",
        "common-table-expressions-with",
        "cte-materialization-optimization-fence",
        "recursive-ctes-hierarchies",
        "graph-traversal-cycle-detection-sql",
        "case-recursive-org-permission-engine",
        "build-hierarchical-graph-query-engine",
        "window-functions-mental-model",
        "partition-by-order-by-mechanics",
        "ranking-functions-row-number-rank",
        "top-n-per-group-deduplication",
        "offset-functions-lag-lead-first-last",
        "window-frames-rows-range-groups",
        "running-totals-cumulative-shares",
        "gaps-and-islands-sessionization",
        "case-fintech-velocity-fraud-window",
        "build-sessionization-retention-engine",
        "entity-relationship-modeling",
        "functional-dependencies-keys",
        "first-normal-form-atomicity",
        "second-third-normal-form",
        "boyce-codd-fourth-fifth-normal-form",
        "update-insertion-deletion-anomalies",
        "strategic-denormalization-tradeoffs",
        "schema-anti-patterns-eav-god-tables",
        "case-shopify-multi-tenant-schema",
        "build-normalized-booking-schema",
        "oltp-vs-olap-workload-physics",
        "star-schema-facts-dimensions",
        "snowflake-vs-star-vs-obt",
        "slowly-changing-dimensions-scd",
        "bridge-tables-junk-role-dimensions",
        "temporal-tables-bitemporal-sql",
        "json-semi-structured-hybrid-schemas",
        "idempotency-audit-logs-event-tables",
        "case-airbnb-minerva-metric-layer",
        "build-scd-type2-warehouse-pipeline",
        "calendar-tables-date-spines",
        "cohort-retention-matrix-sql",
        "funnel-conversion-attribution-sql",
        "interval-overlap-allen-algebra",
        "pivoting-unpivoting-cross-tabs",
        "triggers-stored-procedures-udfs",
        "materialized-views-incremental-refresh",
        "sql-injection-parameterized-security",
        "case-double-booking-hotel-inventory",
        "build-saas-cohort-funnel-workbench",
        "why-indexes-work-io-cost-model",
        "btree-bplustree-internal-anatomy",
        "clustered-vs-secondary-indexes",
        "composite-indexes-leftmost-prefix",
        "covering-indexes-index-only-scans",
        "partial-filtered-expression-indexes",
        "hash-gin-gist-brin-bloom-indexes",
        "index-bloat-write-amplification-traps",
        "case-slack-composite-index-incident",
        "build-btree-index-advisor",
        "life-of-a-sql-query-pipeline",
        "reading-explain-and-explain-analyze",
        "table-statistics-histograms-cardinality",
        "selectivity-estimation-correlated-columns",
        "scan-operators-seq-index-bitmap",
        "sargability-functions-on-columns",
        "or-conditions-in-lists-union-rewrites",
        "sorting-spill-to-disk-top-n-heapsort",
        "case-stale-statistics-plan-flip",
        "build-visual-explain-plan-analyzer",
        "nested-loop-join-indexed-nlj",
        "hash-join-build-probe-grace",
        "sort-merge-join-zipper-mechanics",
        "join-order-search-dynamic-programming",
        "predicate-pushdown-projection-pruning",
        "subquery-unnesting-semi-anti-physical",
        "execution-models-volcano-vectorized",
        "parallel-query-execution-workers",
        "case-hash-join-oom-work-mem-spill",
        "build-physical-join-execution-engine",
        "acid-properties-under-the-hood",
        "transaction-lifecycle-savepoints",
        "read-phenomena-dirty-nonrepeatable-phantom",
        "write-anomalies-lost-update-write-skew",
        "read-uncommitted-read-committed",
        "repeatable-read-snapshot-isolation",
        "serializable-2pl-vs-ssi",
        "optimistic-vs-pessimistic-concurrency",
        "case-fintech-double-spend-race-condition",
        "build-transaction-anomaly-simulator",
        "multi-version-concurrency-control-mvcc",
        "tuple-headers-xmin-xmax-visibility",
        "transaction-snapshots-visibility-rules",
        "row-level-locks-for-update-skip-locked",
        "table-locks-intention-locks-ddl-hazards",
        "gap-locks-next-key-locks-innodb",
        "deadlocks-wait-for-graphs-detection",
        "dead-tuples-bloat-autovacuum-txid-wraparound",
        "case-sentry-transaction-id-wraparound",
        "build-mvcc-snapshot-storage-engine",
        "slotted-page-layout-8kb-anatomy",
        "heap-files-hot-updates-fillfactor",
        "buffer-pool-clock-sweep-lru-k",
        "write-ahead-logging-wal-lsn",
        "checkpoints-dirty-page-flushing",
        "aries-crash-recovery-analysis-redo-undo",
        "lsm-trees-memtable-sstable-compaction",
        "btree-vs-lsm-read-write-space-amplification",
        "case-uber-postgres-to-mysql-storage",
        "build-slotted-page-wal-engine",
        "columnar-storage-layout-parquet",
        "columnar-compression-rle-dictionary-delta",
        "late-materialization-simd-vectorization",
        "zone-maps-min-max-pruning-bloom",
        "embedded-olap-duckdb-architecture",
        "realtime-olap-clickhouse-mergetree",
        "cloud-warehouses-snowflake-bigquery",
        "open-table-formats-iceberg-delta",
        "case-cloudflare-clickhouse-log-analytics",
        "build-columnar-compression-query-engine",
        "single-leader-replication-sync-async",
        "read-replicas-consistency-models",
        "failover-split-brain-fencing-tokens",
        "declarative-table-partitioning",
        "horizontal-sharding-routing-keys",
        "distributed-transactions-2pc-saga",
        "distributed-sql-spanner-cockroachdb",
        "connection-pooling-pgbouncer-proxies",
        "case-figma-postgres-horizontal-sharding",
        "build-sharded-query-router",
        "keyset-cursor-pagination-vs-offset",
        "solving-n-plus-one-orm-queries",
        "full-text-search-trigrams-inverted-index",
        "queue-processing-skip-locked-patterns",
        "bulk-ingestion-batching-unlogged-tables",
        "pg-stat-statements-slow-query-triage",
        "lock-contention-zero-downtime-ddl",
        "backup-pitr-wal-archiving-drills",
        "case-gitlab-database-incident-postmortem",
        "build-production-sql-tuning-clinic"
      ],
      "steps": [
        {
          "type": "topic",
          "slug": "why-databases-exist",
          "id": "why-databases-exist",
          "title": "1.1: Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL"
        },
        {
          "type": "topic",
          "slug": "tables-rows-columns-types",
          "id": "tables-rows-columns-types",
          "title": "1.1: Relations, Tuples, Attributes, Domains & SQL Data Types"
        },
        {
          "type": "topic",
          "slug": "select-projection-aliases",
          "id": "select-projection-aliases",
          "title": "1.1: SELECT Projection, Expressions, Aliases & Logical Execution Order"
        },
        {
          "type": "topic",
          "slug": "where-filtering-predicates",
          "id": "where-filtering-predicates",
          "title": "1.1: WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability"
        },
        {
          "type": "topic",
          "slug": "boolean-logic-three-valued-null",
          "id": "boolean-logic-three-valued-null",
          "title": "1.1: Boolean Logic, Operator Precedence & Three-Valued Logic (3VL)"
        },
        {
          "type": "topic",
          "slug": "null-semantics-coalesce-nullif",
          "id": "null-semantics-coalesce-nullif",
          "title": "1.1: NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF"
        },
        {
          "type": "topic",
          "slug": "order-by-limit-offset-distinct",
          "id": "order-by-limit-offset-distinct",
          "title": "1.1: Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT"
        },
        {
          "type": "topic",
          "slug": "case-expressions-type-casting",
          "id": "case-expressions-type-casting",
          "title": "1.1: Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning"
        },
        {
          "type": "topic",
          "slug": "case-stripe-ledger-precision",
          "id": "case-stripe-ledger-precision",
          "title": "1.1: Production Case Study: Why Floating-Point Corrupts Financial Ledgers"
        },
        {
          "type": "build",
          "slug": "build-sql-query-interpreter",
          "id": "build-sql-query-interpreter",
          "title": "1.1: Hands-On Build: Mini Relational Tuple Filter & Projection Engine"
        },
        {
          "type": "topic",
          "slug": "create-table-ddl-anatomy",
          "id": "create-table-ddl-anatomy",
          "title": "1.2: CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs"
        },
        {
          "type": "topic",
          "slug": "primary-keys-surrogate-vs-natural",
          "id": "primary-keys-surrogate-vs-natural",
          "title": "1.2: Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality"
        },
        {
          "type": "topic",
          "slug": "foreign-keys-referential-integrity",
          "id": "foreign-keys-referential-integrity",
          "title": "1.2: Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT)"
        },
        {
          "type": "topic",
          "slug": "check-unique-not-null-defaults",
          "id": "check-unique-not-null-defaults",
          "title": "1.2: Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns"
        },
        {
          "type": "topic",
          "slug": "insert-bulk-loading-returning",
          "id": "insert-bulk-loading-returning",
          "title": "1.2: Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING"
        },
        {
          "type": "topic",
          "slug": "upsert-on-conflict-merge",
          "id": "upsert-on-conflict-merge",
          "title": "1.2: Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE"
        },
        {
          "type": "topic",
          "slug": "update-delete-safe-mutations",
          "id": "update-delete-safe-mutations",
          "title": "1.2: Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs"
        },
        {
          "type": "topic",
          "slug": "views-temp-tables-ctas",
          "id": "views-temp-tables-ctas",
          "title": "1.2: Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables"
        },
        {
          "type": "topic",
          "slug": "case-github-zero-downtime-migrations",
          "id": "case-github-zero-downtime-migrations",
          "title": "1.2: Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract)"
        },
        {
          "type": "build",
          "slug": "build-ecommerce-schema-ddl",
          "id": "build-ecommerce-schema-ddl",
          "title": "1.2: Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline"
        },
        {
          "type": "topic",
          "slug": "relational-algebra-set-theory",
          "id": "relational-algebra-set-theory",
          "title": "1.3: Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ)"
        },
        {
          "type": "topic",
          "slug": "inner-join-equi-joins",
          "id": "inner-join-equi-joins",
          "title": "1.3: INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal"
        },
        {
          "type": "topic",
          "slug": "left-right-full-outer-joins",
          "id": "left-right-full-outer-joins",
          "title": "1.3: Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension"
        },
        {
          "type": "topic",
          "slug": "join-where-vs-on-filter-trap",
          "id": "join-where-vs-on-filter-trap",
          "title": "1.3: The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE"
        },
        {
          "type": "topic",
          "slug": "self-joins-non-equi-joins",
          "id": "self-joins-non-equi-joins",
          "title": "1.3: Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN)"
        },
        {
          "type": "topic",
          "slug": "cross-join-cartesian-products",
          "id": "cross-join-cartesian-products",
          "title": "1.3: CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions"
        },
        {
          "type": "topic",
          "slug": "semi-joins-anti-joins",
          "id": "semi-joins-anti-joins",
          "title": "1.3: Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL)"
        },
        {
          "type": "topic",
          "slug": "set-operations-union-intersect-except",
          "id": "set-operations-union-intersect-except",
          "title": "1.3: Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT"
        },
        {
          "type": "topic",
          "slug": "case-missing-null-notin-outage",
          "id": "case-missing-null-notin-outage",
          "title": "1.3: Production Case Study: How a Single NULL in NOT IN Returned Zero Rows"
        },
        {
          "type": "build",
          "slug": "build-multi-table-order-reconciler",
          "id": "build-multi-table-order-reconciler",
          "title": "1.3: Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine"
        },
        {
          "type": "topic",
          "slug": "aggregate-functions-internals",
          "id": "aggregate-functions-internals",
          "title": "2.1: Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG"
        },
        {
          "type": "topic",
          "slug": "group-by-execution-mechanics",
          "id": "group-by-execution-mechanics",
          "title": "2.1: GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency"
        },
        {
          "type": "topic",
          "slug": "having-vs-where-pipeline",
          "id": "having-vs-where-pipeline",
          "title": "2.1: Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline"
        },
        {
          "type": "topic",
          "slug": "conditional-aggregation-filter",
          "id": "conditional-aggregation-filter",
          "title": "2.1: Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...)"
        },
        {
          "type": "topic",
          "slug": "string-json-array-aggregation",
          "id": "string-json-array-aggregation",
          "title": "2.1: List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation"
        },
        {
          "type": "topic",
          "slug": "grouping-sets-rollup-cube",
          "id": "grouping-sets-rollup-cube",
          "title": "2.1: Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING()"
        },
        {
          "type": "topic",
          "slug": "join-fanout-chasm-traps",
          "id": "join-fanout-chasm-traps",
          "title": "2.1: The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts)"
        },
        {
          "type": "topic",
          "slug": "histograms-percentiles-medians",
          "id": "histograms-percentiles-medians",
          "title": "2.1: Statistical SQL: Equi-Width Histograms, Percentiles & Medians"
        },
        {
          "type": "topic",
          "slug": "case-analytics-double-counting-bug",
          "id": "case-analytics-double-counting-bug",
          "title": "2.1: Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug"
        },
        {
          "type": "build",
          "slug": "build-executive-kpi-aggregation-suite",
          "id": "build-executive-kpi-aggregation-suite",
          "title": "2.1: Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite"
        },
        {
          "type": "topic",
          "slug": "scalar-row-table-subqueries",
          "id": "scalar-row-table-subqueries",
          "title": "2.2: Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries"
        },
        {
          "type": "topic",
          "slug": "correlated-subqueries-mechanics",
          "id": "correlated-subqueries-mechanics",
          "title": "2.2: Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting"
        },
        {
          "type": "topic",
          "slug": "exists-not-exists-null-safety",
          "id": "exists-not-exists-null-safety",
          "title": "2.2: EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety"
        },
        {
          "type": "topic",
          "slug": "lateral-joins-cross-apply",
          "id": "lateral-joins-cross-apply",
          "title": "2.2: LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group"
        },
        {
          "type": "topic",
          "slug": "common-table-expressions-with",
          "id": "common-table-expressions-with",
          "title": "2.2: Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines"
        },
        {
          "type": "topic",
          "slug": "cte-materialization-optimization-fence",
          "id": "cte-materialization-optimization-fence",
          "title": "2.2: CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints"
        },
        {
          "type": "topic",
          "slug": "recursive-ctes-hierarchies",
          "id": "recursive-ctes-hierarchies",
          "title": "2.2: Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint"
        },
        {
          "type": "topic",
          "slug": "graph-traversal-cycle-detection-sql",
          "id": "graph-traversal-cycle-detection-sql",
          "title": "2.2: Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL"
        },
        {
          "type": "topic",
          "slug": "case-recursive-org-permission-engine",
          "id": "case-recursive-org-permission-engine",
          "title": "2.2: Production Case Study: Hierarchical RBAC Permission Inheritance in SQL"
        },
        {
          "type": "build",
          "slug": "build-hierarchical-graph-query-engine",
          "id": "build-hierarchical-graph-query-engine",
          "title": "2.2: Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine"
        },
        {
          "type": "topic",
          "slug": "window-functions-mental-model",
          "id": "window-functions-mental-model",
          "title": "2.3: The Window Function Mental Model: Preserving Row Identity + Context"
        },
        {
          "type": "topic",
          "slug": "partition-by-order-by-mechanics",
          "id": "partition-by-order-by-mechanics",
          "title": "2.3: PARTITION BY, ORDER BY & The Default RANGE Frame Trap"
        },
        {
          "type": "topic",
          "slug": "ranking-functions-row-number-rank",
          "id": "ranking-functions-row-number-rank",
          "title": "2.3: Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST"
        },
        {
          "type": "topic",
          "slug": "top-n-per-group-deduplication",
          "id": "top-n-per-group-deduplication",
          "title": "2.3: Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY"
        },
        {
          "type": "topic",
          "slug": "offset-functions-lag-lead-first-last",
          "id": "offset-functions-lag-lead-first-last",
          "title": "2.3: Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap"
        },
        {
          "type": "topic",
          "slug": "window-frames-rows-range-groups",
          "id": "window-frames-rows-range-groups",
          "title": "2.3: Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages"
        },
        {
          "type": "topic",
          "slug": "running-totals-cumulative-shares",
          "id": "running-totals-cumulative-shares",
          "title": "2.3: Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses"
        },
        {
          "type": "topic",
          "slug": "gaps-and-islands-sessionization",
          "id": "gaps-and-islands-sessionization",
          "title": "2.3: Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization"
        },
        {
          "type": "topic",
          "slug": "case-fintech-velocity-fraud-window",
          "id": "case-fintech-velocity-fraud-window",
          "title": "2.3: Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection"
        },
        {
          "type": "build",
          "slug": "build-sessionization-retention-engine",
          "id": "build-sessionization-retention-engine",
          "title": "2.3: Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer"
        },
        {
          "type": "topic",
          "slug": "entity-relationship-modeling",
          "id": "entity-relationship-modeling",
          "title": "3.1: Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables"
        },
        {
          "type": "topic",
          "slug": "functional-dependencies-keys",
          "id": "functional-dependencies-keys",
          "title": "3.1: Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure"
        },
        {
          "type": "topic",
          "slug": "first-normal-form-atomicity",
          "id": "first-normal-form-atomicity",
          "title": "3.1: First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns"
        },
        {
          "type": "topic",
          "slug": "second-third-normal-form",
          "id": "second-third-normal-form",
          "title": "3.1: Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies"
        },
        {
          "type": "topic",
          "slug": "boyce-codd-fourth-fifth-normal-form",
          "id": "boyce-codd-fourth-fifth-normal-form",
          "title": "3.1: Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF)"
        },
        {
          "type": "topic",
          "slug": "update-insertion-deletion-anomalies",
          "id": "update-insertion-deletion-anomalies",
          "title": "3.1: Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas"
        },
        {
          "type": "topic",
          "slug": "strategic-denormalization-tradeoffs",
          "id": "strategic-denormalization-tradeoffs",
          "title": "3.1: Strategic Denormalization: Read vs Write Amplification & Cached Counters"
        },
        {
          "type": "topic",
          "slug": "schema-anti-patterns-eav-god-tables",
          "id": "schema-anti-patterns-eav-god-tables",
          "title": "3.1: Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables"
        },
        {
          "type": "topic",
          "slug": "case-shopify-multi-tenant-schema",
          "id": "case-shopify-multi-tenant-schema",
          "title": "3.1: Production Case Study: Multi-Tenant Schema Architecture at Scale"
        },
        {
          "type": "build",
          "slug": "build-normalized-booking-schema",
          "id": "build-normalized-booking-schema",
          "title": "3.1: Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System"
        },
        {
          "type": "topic",
          "slug": "oltp-vs-olap-workload-physics",
          "id": "oltp-vs-olap-workload-physics",
          "title": "3.2: OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans"
        },
        {
          "type": "topic",
          "slug": "star-schema-facts-dimensions",
          "id": "star-schema-facts-dimensions",
          "title": "3.2: Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions"
        },
        {
          "type": "topic",
          "slug": "snowflake-vs-star-vs-obt",
          "id": "snowflake-vs-star-vs-obt",
          "title": "3.2: Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses"
        },
        {
          "type": "topic",
          "slug": "slowly-changing-dimensions-scd",
          "id": "slowly-changing-dimensions-scd",
          "title": "3.2: Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6"
        },
        {
          "type": "topic",
          "slug": "bridge-tables-junk-role-dimensions",
          "id": "bridge-tables-junk-role-dimensions",
          "title": "3.2: Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables"
        },
        {
          "type": "topic",
          "slug": "temporal-tables-bitemporal-sql",
          "id": "temporal-tables-bitemporal-sql",
          "title": "3.2: Temporal & Bitemporal SQL: System Time vs Valid Application Time"
        },
        {
          "type": "topic",
          "slug": "json-semi-structured-hybrid-schemas",
          "id": "json-semi-structured-hybrid-schemas",
          "title": "3.2: Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution"
        },
        {
          "type": "topic",
          "slug": "idempotency-audit-logs-event-tables",
          "id": "idempotency-audit-logs-event-tables",
          "title": "3.2: Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox"
        },
        {
          "type": "topic",
          "slug": "case-airbnb-minerva-metric-layer",
          "id": "case-airbnb-minerva-metric-layer",
          "title": "3.2: Production Case Study: Designing a Canonical Metric Store at Petabyte Scale"
        },
        {
          "type": "build",
          "slug": "build-scd-type2-warehouse-pipeline",
          "id": "build-scd-type2-warehouse-pipeline",
          "title": "3.2: Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline"
        },
        {
          "type": "topic",
          "slug": "calendar-tables-date-spines",
          "id": "calendar-tables-date-spines",
          "title": "3.3: Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets"
        },
        {
          "type": "topic",
          "slug": "cohort-retention-matrix-sql",
          "id": "cohort-retention-matrix-sql",
          "title": "3.3: Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL"
        },
        {
          "type": "topic",
          "slug": "funnel-conversion-attribution-sql",
          "id": "funnel-conversion-attribution-sql",
          "title": "3.3: Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution"
        },
        {
          "type": "topic",
          "slug": "interval-overlap-allen-algebra",
          "id": "interval-overlap-allen-algebra",
          "title": "3.3: Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals"
        },
        {
          "type": "topic",
          "slug": "pivoting-unpivoting-cross-tabs",
          "id": "pivoting-unpivoting-cross-tabs",
          "title": "3.3: Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns"
        },
        {
          "type": "topic",
          "slug": "triggers-stored-procedures-udfs",
          "id": "triggers-stored-procedures-udfs",
          "title": "3.3: Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead"
        },
        {
          "type": "topic",
          "slug": "materialized-views-incremental-refresh",
          "id": "materialized-views-incremental-refresh",
          "title": "3.3: Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM)"
        },
        {
          "type": "topic",
          "slug": "sql-injection-parameterized-security",
          "id": "sql-injection-parameterized-security",
          "title": "3.3: SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS)"
        },
        {
          "type": "topic",
          "slug": "case-double-booking-hotel-inventory",
          "id": "case-double-booking-hotel-inventory",
          "title": "3.3: Production Case Study: Preventing Concurrent Calendar Double-Bookings"
        },
        {
          "type": "build",
          "slug": "build-saas-cohort-funnel-workbench",
          "id": "build-saas-cohort-funnel-workbench",
          "title": "3.3: Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)"
        },
        {
          "type": "topic",
          "slug": "why-indexes-work-io-cost-model",
          "id": "why-indexes-work-io-cost-model",
          "title": "4.1: Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics"
        },
        {
          "type": "topic",
          "slug": "btree-bplustree-internal-anatomy",
          "id": "btree-bplustree-internal-anatomy",
          "title": "4.1: B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links"
        },
        {
          "type": "topic",
          "slug": "clustered-vs-secondary-indexes",
          "id": "clustered-vs-secondary-indexes",
          "title": "4.1: Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres)"
        },
        {
          "type": "topic",
          "slug": "composite-indexes-leftmost-prefix",
          "id": "composite-indexes-leftmost-prefix",
          "title": "4.1: Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range"
        },
        {
          "type": "topic",
          "slug": "covering-indexes-index-only-scans",
          "id": "covering-indexes-index-only-scans",
          "title": "4.1: Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map)"
        },
        {
          "type": "topic",
          "slug": "partial-filtered-expression-indexes",
          "id": "partial-filtered-expression-indexes",
          "title": "4.1: Partial (Filtered) Indexes & Functional / Expression Indexes"
        },
        {
          "type": "topic",
          "slug": "hash-gin-gist-brin-bloom-indexes",
          "id": "hash-gin-gist-brin-bloom-indexes",
          "title": "4.1: Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap"
        },
        {
          "type": "topic",
          "slug": "index-bloat-write-amplification-traps",
          "id": "index-bloat-write-amplification-traps",
          "title": "4.1: When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds"
        },
        {
          "type": "topic",
          "slug": "case-slack-composite-index-incident",
          "id": "case-slack-composite-index-incident",
          "title": "4.1: Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4%"
        },
        {
          "type": "build",
          "slug": "build-btree-index-advisor",
          "id": "build-btree-index-advisor",
          "title": "4.1: Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor"
        },
        {
          "type": "topic",
          "slug": "life-of-a-sql-query-pipeline",
          "id": "life-of-a-sql-query-pipeline",
          "title": "4.2: Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor"
        },
        {
          "type": "topic",
          "slug": "reading-explain-and-explain-analyze",
          "id": "reading-explain-and-explain-analyze",
          "title": "4.2: Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers"
        },
        {
          "type": "topic",
          "slug": "table-statistics-histograms-cardinality",
          "id": "table-statistics-histograms-cardinality",
          "title": "4.2: Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms"
        },
        {
          "type": "topic",
          "slug": "selectivity-estimation-correlated-columns",
          "id": "selectivity-estimation-correlated-columns",
          "title": "4.2: Selectivity Math, Independence Assumption Failures & Extended Statistics"
        },
        {
          "type": "topic",
          "slug": "scan-operators-seq-index-bitmap",
          "id": "scan-operators-seq-index-bitmap",
          "title": "4.2: Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan"
        },
        {
          "type": "topic",
          "slug": "sargability-functions-on-columns",
          "id": "sargability-functions-on-columns",
          "title": "4.2: SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes"
        },
        {
          "type": "topic",
          "slug": "or-conditions-in-lists-union-rewrites",
          "id": "or-conditions-in-lists-union-rewrites",
          "title": "4.2: Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites"
        },
        {
          "type": "topic",
          "slug": "sorting-spill-to-disk-top-n-heapsort",
          "id": "sorting-spill-to-disk-top-n-heapsort",
          "title": "4.2: Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills"
        },
        {
          "type": "topic",
          "slug": "case-stale-statistics-plan-flip",
          "id": "case-stale-statistics-plan-flip",
          "title": "4.2: Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics"
        },
        {
          "type": "build",
          "slug": "build-visual-explain-plan-analyzer",
          "id": "build-visual-explain-plan-analyzer",
          "title": "4.2: Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter"
        },
        {
          "type": "topic",
          "slug": "nested-loop-join-indexed-nlj",
          "id": "nested-loop-join-indexed-nlj",
          "title": "4.3: Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ"
        },
        {
          "type": "topic",
          "slug": "hash-join-build-probe-grace",
          "id": "hash-join-build-probe-grace",
          "title": "4.3: Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills"
        },
        {
          "type": "topic",
          "slug": "sort-merge-join-zipper-mechanics",
          "id": "sort-merge-join-zipper-mechanics",
          "title": "4.3: Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding"
        },
        {
          "type": "topic",
          "slug": "join-order-search-dynamic-programming",
          "id": "join-order-search-dynamic-programming",
          "title": "4.3: Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees"
        },
        {
          "type": "topic",
          "slug": "predicate-pushdown-projection-pruning",
          "id": "predicate-pushdown-projection-pruning",
          "title": "4.3: Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination"
        },
        {
          "type": "topic",
          "slug": "subquery-unnesting-semi-anti-physical",
          "id": "subquery-unnesting-semi-anti-physical",
          "title": "4.3: Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators"
        },
        {
          "type": "topic",
          "slug": "execution-models-volcano-vectorized",
          "id": "execution-models-volcano-vectorized",
          "title": "4.3: Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT"
        },
        {
          "type": "topic",
          "slug": "parallel-query-execution-workers",
          "id": "parallel-query-execution-workers",
          "title": "4.3: Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes"
        },
        {
          "type": "topic",
          "slug": "case-hash-join-oom-work-mem-spill",
          "id": "case-hash-join-oom-work-mem-spill",
          "title": "4.3: Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills"
        },
        {
          "type": "build",
          "slug": "build-physical-join-execution-engine",
          "id": "build-physical-join-execution-engine",
          "title": "4.3: Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join"
        },
        {
          "type": "topic",
          "slug": "acid-properties-under-the-hood",
          "id": "acid-properties-under-the-hood",
          "title": "5.1: ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL)"
        },
        {
          "type": "topic",
          "slug": "transaction-lifecycle-savepoints",
          "id": "transaction-lifecycle-savepoints",
          "title": "5.1: Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards"
        },
        {
          "type": "topic",
          "slug": "read-phenomena-dirty-nonrepeatable-phantom",
          "id": "read-phenomena-dirty-nonrepeatable-phantom",
          "title": "5.1: Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized"
        },
        {
          "type": "topic",
          "slug": "write-anomalies-lost-update-write-skew",
          "id": "write-anomalies-lost-update-write-skew",
          "title": "5.1: Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew"
        },
        {
          "type": "topic",
          "slug": "read-uncommitted-read-committed",
          "id": "read-uncommitted-read-committed",
          "title": "5.1: READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice"
        },
        {
          "type": "topic",
          "slug": "repeatable-read-snapshot-isolation",
          "id": "repeatable-read-snapshot-isolation",
          "title": "5.1: REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew"
        },
        {
          "type": "topic",
          "slug": "serializable-2pl-vs-ssi",
          "id": "serializable-2pl-vs-ssi",
          "title": "5.1: True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI)"
        },
        {
          "type": "topic",
          "slug": "optimistic-vs-pessimistic-concurrency",
          "id": "optimistic-vs-pessimistic-concurrency",
          "title": "5.1: Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE"
        },
        {
          "type": "topic",
          "slug": "case-fintech-double-spend-race-condition",
          "id": "case-fintech-double-spend-race-condition",
          "title": "5.1: Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend"
        },
        {
          "type": "build",
          "slug": "build-transaction-anomaly-simulator",
          "id": "build-transaction-anomaly-simulator",
          "title": "5.1: Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier"
        },
        {
          "type": "topic",
          "slug": "multi-version-concurrency-control-mvcc",
          "id": "multi-version-concurrency-control-mvcc",
          "title": "5.2: MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers"
        },
        {
          "type": "topic",
          "slug": "tuple-headers-xmin-xmax-visibility",
          "id": "tuple-headers-xmin-xmax-visibility",
          "title": "5.2: Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits"
        },
        {
          "type": "topic",
          "slug": "transaction-snapshots-visibility-rules",
          "id": "transaction-snapshots-visibility-rules",
          "title": "5.2: Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution"
        },
        {
          "type": "topic",
          "slug": "row-level-locks-for-update-skip-locked",
          "id": "row-level-locks-for-update-skip-locked",
          "title": "5.2: Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED"
        },
        {
          "type": "topic",
          "slug": "table-locks-intention-locks-ddl-hazards",
          "id": "table-locks-intention-locks-ddl-hazards",
          "title": "5.2: Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic"
        },
        {
          "type": "topic",
          "slug": "gap-locks-next-key-locks-innodb",
          "id": "gap-locks-next-key-locks-innodb",
          "title": "5.2: Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks"
        },
        {
          "type": "topic",
          "slug": "deadlocks-wait-for-graphs-detection",
          "id": "deadlocks-wait-for-graphs-detection",
          "title": "5.2: Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection"
        },
        {
          "type": "topic",
          "slug": "dead-tuples-bloat-autovacuum-txid-wraparound",
          "id": "dead-tuples-bloat-autovacuum-txid-wraparound",
          "title": "5.2: Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound"
        },
        {
          "type": "topic",
          "slug": "case-sentry-transaction-id-wraparound",
          "id": "case-sentry-transaction-id-wraparound",
          "title": "5.2: Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage"
        },
        {
          "type": "build",
          "slug": "build-mvcc-snapshot-storage-engine",
          "id": "build-mvcc-snapshot-storage-engine",
          "title": "5.2: Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC"
        },
        {
          "type": "topic",
          "slug": "slotted-page-layout-8kb-anatomy",
          "id": "slotted-page-layout-8kb-anatomy",
          "title": "5.3: Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST"
        },
        {
          "type": "topic",
          "slug": "heap-files-hot-updates-fillfactor",
          "id": "heap-files-hot-updates-fillfactor",
          "title": "5.3: Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor"
        },
        {
          "type": "topic",
          "slug": "buffer-pool-clock-sweep-lru-k",
          "id": "buffer-pool-clock-sweep-lru-k",
          "title": "5.3: Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction"
        },
        {
          "type": "topic",
          "slug": "write-ahead-logging-wal-lsn",
          "id": "write-ahead-logging-wal-lsn",
          "title": "5.3: Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit"
        },
        {
          "type": "topic",
          "slug": "checkpoints-dirty-page-flushing",
          "id": "checkpoints-dirty-page-flushing",
          "title": "5.3: Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes)"
        },
        {
          "type": "topic",
          "slug": "aries-crash-recovery-analysis-redo-undo",
          "id": "aries-crash-recovery-analysis-redo-undo",
          "title": "5.3: ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes"
        },
        {
          "type": "topic",
          "slug": "lsm-trees-memtable-sstable-compaction",
          "id": "lsm-trees-memtable-sstable-compaction",
          "title": "5.3: LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction"
        },
        {
          "type": "topic",
          "slug": "btree-vs-lsm-read-write-space-amplification",
          "id": "btree-vs-lsm-read-write-space-amplification",
          "title": "5.3: The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification"
        },
        {
          "type": "topic",
          "slug": "case-uber-postgres-to-mysql-storage",
          "id": "case-uber-postgres-to-mysql-storage",
          "title": "5.3: Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage"
        },
        {
          "type": "build",
          "slug": "build-slotted-page-wal-engine",
          "id": "build-slotted-page-wal-engine",
          "title": "5.3: Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator"
        },
        {
          "type": "topic",
          "slug": "columnar-storage-layout-parquet",
          "id": "columnar-storage-layout-parquet",
          "title": "6.1: Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout"
        },
        {
          "type": "topic",
          "slug": "columnar-compression-rle-dictionary-delta",
          "id": "columnar-compression-rle-dictionary-delta",
          "title": "6.1: Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding"
        },
        {
          "type": "topic",
          "slug": "late-materialization-simd-vectorization",
          "id": "late-materialization-simd-vectorization",
          "title": "6.1: Late Materialization & SIMD Vectorized Execution on Compressed Columns"
        },
        {
          "type": "topic",
          "slug": "zone-maps-min-max-pruning-bloom",
          "id": "zone-maps-min-max-pruning-bloom",
          "title": "6.1: Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering"
        },
        {
          "type": "topic",
          "slug": "embedded-olap-duckdb-architecture",
          "id": "embedded-olap-duckdb-architecture",
          "title": "6.1: Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution"
        },
        {
          "type": "topic",
          "slug": "realtime-olap-clickhouse-mergetree",
          "id": "realtime-olap-clickhouse-mergetree",
          "title": "6.1: Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines"
        },
        {
          "type": "topic",
          "slug": "cloud-warehouses-snowflake-bigquery",
          "id": "cloud-warehouses-snowflake-bigquery",
          "title": "6.1: Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute"
        },
        {
          "type": "topic",
          "slug": "open-table-formats-iceberg-delta",
          "id": "open-table-formats-iceberg-delta",
          "title": "6.1: Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage"
        },
        {
          "type": "topic",
          "slug": "case-cloudflare-clickhouse-log-analytics",
          "id": "case-cloudflare-clickhouse-log-analytics",
          "title": "6.1: Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree"
        },
        {
          "type": "build",
          "slug": "build-columnar-compression-query-engine",
          "id": "build-columnar-compression-query-engine",
          "title": "6.1: Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown"
        },
        {
          "type": "topic",
          "slug": "single-leader-replication-sync-async",
          "id": "single-leader-replication-sync-async",
          "title": "6.2: Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async"
        },
        {
          "type": "topic",
          "slug": "read-replicas-consistency-models",
          "id": "read-replicas-consistency-models",
          "title": "6.2: Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies"
        },
        {
          "type": "topic",
          "slug": "failover-split-brain-fencing-tokens",
          "id": "failover-split-brain-fencing-tokens",
          "title": "6.2: Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens"
        },
        {
          "type": "topic",
          "slug": "declarative-table-partitioning",
          "id": "declarative-table-partitioning",
          "title": "6.2: Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops"
        },
        {
          "type": "topic",
          "slug": "horizontal-sharding-routing-keys",
          "id": "horizontal-sharding-routing-keys",
          "title": "6.2: Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather"
        },
        {
          "type": "topic",
          "slug": "distributed-transactions-2pc-saga",
          "id": "distributed-transactions-2pc-saga",
          "title": "6.2: Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern"
        },
        {
          "type": "topic",
          "slug": "distributed-sql-spanner-cockroachdb",
          "id": "distributed-sql-spanner-cockroachdb",
          "title": "6.2: Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC"
        },
        {
          "type": "topic",
          "slug": "connection-pooling-pgbouncer-proxies",
          "id": "connection-pooling-pgbouncer-proxies",
          "title": "6.2: Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes"
        },
        {
          "type": "topic",
          "slug": "case-figma-postgres-horizontal-sharding",
          "id": "case-figma-postgres-horizontal-sharding",
          "title": "6.2: Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters"
        },
        {
          "type": "build",
          "slug": "build-sharded-query-router",
          "id": "build-sharded-query-router",
          "title": "6.2: Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather"
        },
        {
          "type": "topic",
          "slug": "keyset-cursor-pagination-vs-offset",
          "id": "keyset-cursor-pagination-vs-offset",
          "title": "6.3: Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency"
        },
        {
          "type": "topic",
          "slug": "solving-n-plus-one-orm-queries",
          "id": "solving-n-plus-one-orm-queries",
          "title": "6.3: Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation"
        },
        {
          "type": "topic",
          "slug": "full-text-search-trigrams-inverted-index",
          "id": "full-text-search-trigrams-inverted-index",
          "title": "6.3: Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25"
        },
        {
          "type": "topic",
          "slug": "queue-processing-skip-locked-patterns",
          "id": "queue-processing-skip-locked-patterns",
          "title": "6.3: High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED"
        },
        {
          "type": "topic",
          "slug": "bulk-ingestion-batching-unlogged-tables",
          "id": "bulk-ingestion-batching-unlogged-tables",
          "title": "6.3: High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY"
        },
        {
          "type": "topic",
          "slug": "pg-stat-statements-slow-query-triage",
          "id": "pg-stat-statements-slow-query-triage",
          "title": "6.3: Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio"
        },
        {
          "type": "topic",
          "slug": "lock-contention-zero-downtime-ddl",
          "id": "lock-contention-zero-downtime-ddl",
          "title": "6.3: Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID"
        },
        {
          "type": "topic",
          "slug": "backup-pitr-wal-archiving-drills",
          "id": "backup-pitr-wal-archiving-drills",
          "title": "6.3: Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay"
        },
        {
          "type": "topic",
          "slug": "case-gitlab-database-incident-postmortem",
          "id": "case-gitlab-database-incident-postmortem",
          "title": "6.3: Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills"
        },
        {
          "type": "build",
          "slug": "build-production-sql-tuning-clinic",
          "id": "build-production-sql-tuning-clinic",
          "title": "6.3: Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup)"
        }
      ]
    }
  ],
  "modules": [
    {
      "id": "m01",
      "number": "1.1",
      "trackId": "track-1",
      "trackTitle": "Relational Foundations & Core Querying",
      "title": "The Relational Model, Tables & SELECT Foundations",
      "difficulty": "Beginner → Intermediate",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "why-databases-exist",
        "tables-rows-columns-types",
        "select-projection-aliases"
      ],
      "summary": "Why declarative SQL replaced navigational storage, relations vs tables, execution order (FROM before SELECT), predicates, Three-Valued Logic, and NULL semantics.",
      "icon": "table",
      "prerequisites": []
    },
    {
      "id": "m02",
      "number": "1.2",
      "trackId": "track-1",
      "trackTitle": "Relational Foundations & Core Querying",
      "title": "DDL, Schema Constraints & DML Mutations",
      "difficulty": "Beginner → Intermediate",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "create-table-ddl-anatomy",
        "primary-keys-surrogate-vs-natural",
        "foreign-keys-referential-integrity"
      ],
      "summary": "Table creation, surrogate vs natural primary keys (UUIDv7 vs B-Tree locality), foreign key referential actions, CHECK constraints, upserts, and views.",
      "icon": "shield",
      "prerequisites": [
        "m01"
      ]
    },
    {
      "id": "m03",
      "number": "1.3",
      "trackId": "track-1",
      "trackTitle": "Relational Foundations & Core Querying",
      "title": "Relational Algebra & Multi-Table Joins",
      "difficulty": "Beginner → Intermediate",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "relational-algebra-set-theory",
        "inner-join-equi-joins",
        "left-right-full-outer-joins"
      ],
      "summary": "Codd's relational algebra operators, INNER/LEFT/RIGHT/FULL OUTER joins, the ON vs WHERE outer-join filter trap, semi/anti-joins, and set operations.",
      "icon": "git-merge",
      "prerequisites": [
        "m01",
        "m02"
      ]
    },
    {
      "id": "m04",
      "number": "2.1",
      "trackId": "track-2",
      "trackTitle": "Aggregations, Subqueries, CTEs & Window Functions",
      "title": "Grouping, Aggregations & Multi-Dimensional Rollups",
      "difficulty": "Intermediate → Advanced",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "aggregate-functions-internals",
        "group-by-execution-mechanics",
        "having-vs-where-pipeline"
      ],
      "summary": "Aggregate function internals, GROUP BY bucket partitioning, WHERE vs HAVING, FILTER conditional aggregation, GROUPING SETS/ROLLUP/CUBE, and fanout traps.",
      "icon": "bar-chart-2",
      "prerequisites": [
        "m03"
      ]
    },
    {
      "id": "m05",
      "number": "2.2",
      "trackId": "track-2",
      "trackTitle": "Aggregations, Subqueries, CTEs & Window Functions",
      "title": "Subqueries, Correlated Queries, Lateral Joins & CTEs",
      "difficulty": "Intermediate → Advanced",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "scalar-row-table-subqueries",
        "correlated-subqueries-mechanics",
        "exists-not-exists-null-safety"
      ],
      "summary": "Scalar/row/table subqueries, correlated subquery unnesting, EXISTS null safety, LATERAL joins, Common Table Expressions (WITH), and recursive CTE graph queries.",
      "icon": "git-branch",
      "prerequisites": [
        "m03",
        "m04"
      ]
    },
    {
      "id": "m06",
      "number": "2.3",
      "trackId": "track-2",
      "trackTitle": "Aggregations, Subqueries, CTEs & Window Functions",
      "title": "Window Functions & Analytical SQL Mastery",
      "difficulty": "Intermediate → Advanced",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "window-functions-mental-model",
        "partition-by-order-by-mechanics",
        "ranking-functions-row-number-rank"
      ],
      "summary": "OVER (PARTITION BY ... ORDER BY ...), ranking functions, LAG/LEAD offsets, ROWS vs RANGE vs GROUPS window frames, running totals, and Gaps & Islands sessionization.",
      "icon": "activity",
      "prerequisites": [
        "m04",
        "m05"
      ]
    },
    {
      "id": "m07",
      "number": "3.1",
      "trackId": "track-3",
      "trackTitle": "Data Modeling, Normalization & Schema Architecture",
      "title": "Relational Data Modeling & Normalization (1NF to BCNF/5NF)",
      "difficulty": "Intermediate → Advanced",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "entity-relationship-modeling",
        "functional-dependencies-keys",
        "first-normal-form-atomicity"
      ],
      "summary": "Entity-Relationship modeling, Armstrong's axioms, candidate keys, 1NF atomicity, 2NF/3NF/BCNF normal forms, update anomalies, and strategic denormalization.",
      "icon": "check-circle",
      "prerequisites": [
        "m02",
        "m03"
      ]
    },
    {
      "id": "m08",
      "number": "3.2",
      "trackId": "track-3",
      "trackTitle": "Data Modeling, Normalization & Schema Architecture",
      "title": "Dimensional Modeling & Analytical Schema Design",
      "difficulty": "Intermediate → Advanced",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "oltp-vs-olap-workload-physics",
        "star-schema-facts-dimensions",
        "snowflake-vs-star-vs-obt"
      ],
      "summary": "OLTP vs OLAP physics, Kimball Star Schemas (fact grain & dimensions), Snowflake vs One Big Table (OBT), Slowly Changing Dimensions (SCD Type 2), and bitemporal SQL.",
      "icon": "layers",
      "prerequisites": [
        "m04",
        "m07"
      ]
    },
    {
      "id": "m09",
      "number": "3.3",
      "trackId": "track-3",
      "trackTitle": "Data Modeling, Normalization & Schema Architecture",
      "title": "Advanced SQL Patterns, Temporal Queries & Programmability",
      "difficulty": "Intermediate → Advanced",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "calendar-tables-date-spines",
        "cohort-retention-matrix-sql",
        "funnel-conversion-attribution-sql"
      ],
      "summary": "Date spines, triangle cohort retention matrices, multi-step conversion funnels, Allen's interval overlap algebra, PIVOT/UNPIVOT, triggers, and SQL injection defense.",
      "icon": "file-text",
      "prerequisites": [
        "m05",
        "m07"
      ]
    },
    {
      "id": "m10",
      "number": "4.1",
      "trackId": "track-4",
      "trackTitle": "Indexing, Query Planner & Execution Engine",
      "title": "B+Tree Indexes & Access Path Mechanics",
      "difficulty": "Advanced → Staff",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "why-indexes-work-io-cost-model",
        "btree-bplustree-internal-anatomy",
        "clustered-vs-secondary-indexes"
      ],
      "summary": "I/O cost models, B+Tree internal routing vs doubly-linked leaf pages, clustered vs heap+ctid tables, composite index prefix rules, covering indexes, and GIN/GiST/BRIN.",
      "icon": "hard-drive",
      "prerequisites": [
        "m02"
      ]
    },
    {
      "id": "m11",
      "number": "4.2",
      "trackId": "track-4",
      "trackTitle": "Indexing, Query Planner & Execution Engine",
      "title": "The Query Planner, Cost-Based Optimizer & EXPLAIN",
      "difficulty": "Advanced → Staff",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "life-of-a-sql-query-pipeline",
        "reading-explain-and-explain-analyze",
        "table-statistics-histograms-cardinality"
      ],
      "summary": "Life of a query (Parser → Binder → Optimizer → Executor), reading EXPLAIN ANALYZE, table statistics (MCV, NDV, histograms), SARGability, and external disk sorts.",
      "icon": "search",
      "prerequisites": [
        "m03",
        "m10"
      ]
    },
    {
      "id": "m12",
      "number": "4.3",
      "trackId": "track-4",
      "trackTitle": "Indexing, Query Planner & Execution Engine",
      "title": "Physical Join Algorithms & Execution Pipelines",
      "difficulty": "Advanced → Staff",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "nested-loop-join-indexed-nlj",
        "hash-join-build-probe-grace",
        "sort-merge-join-zipper-mechanics"
      ],
      "summary": "Nested Loop Join (Naive vs Indexed), In-Memory & Grace Hash Join, Sort-Merge Join, Selinger dynamic programming join ordering, predicate pushdown, and Volcano vs Vectorized execution.",
      "icon": "cpu",
      "prerequisites": [
        "m04",
        "m11"
      ]
    },
    {
      "id": "m13",
      "number": "5.1",
      "trackId": "track-5",
      "trackTitle": "Transactions, Concurrency Control, MVCC & Storage Internals",
      "title": "ACID Transactions, Concurrency Anomalies & Isolation Levels",
      "difficulty": "Advanced → Staff",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "acid-properties-under-the-hood",
        "transaction-lifecycle-savepoints",
        "read-phenomena-dirty-nonrepeatable-phantom"
      ],
      "summary": "ACID properties under the hood, transaction lifecycles, read/write concurrency anomalies (Dirty Read, Non-Repeatable Read, Phantom, Lost Update, Write Skew), and Snapshot vs Serializable isolation.",
      "icon": "refresh-cw",
      "prerequisites": [
        "m10"
      ]
    },
    {
      "id": "m14",
      "number": "5.2",
      "trackId": "track-5",
      "trackTitle": "Transactions, Concurrency Control, MVCC & Storage Internals",
      "title": "Locking, MVCC Internals & Vacuuming",
      "difficulty": "Advanced → Staff",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "multi-version-concurrency-control-mvcc",
        "tuple-headers-xmin-xmax-visibility",
        "transaction-snapshots-visibility-rules"
      ],
      "summary": "Multi-Version Concurrency Control (MVCC), PostgreSQL tuple headers (xmin, xmax, ctid) vs InnoDB undo logs, transaction snapshots, row/table/gap locks, deadlocks, and VACUUM / XID wraparound.",
      "icon": "eye",
      "prerequisites": [
        "m10",
        "m13"
      ]
    },
    {
      "id": "m15",
      "number": "5.3",
      "trackId": "track-5",
      "trackTitle": "Transactions, Concurrency Control, MVCC & Storage Internals",
      "title": "Storage Engine Internals: Pages, Buffer Pool, WAL & LSM-Trees",
      "difficulty": "Advanced → Staff",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "slotted-page-layout-8kb-anatomy",
        "heap-files-hot-updates-fillfactor",
        "buffer-pool-clock-sweep-lru-k"
      ],
      "summary": "8KB slotted database pages, Heap-Only Tuple (HOT) updates, Buffer Pool Clock-Sweep/LRU-K, Write-Ahead Logging (WAL & LSN), Fuzzy Checkpoints, ARIES crash recovery, and LSM-Trees.",
      "icon": "lock",
      "prerequisites": [
        "m11",
        "m14"
      ]
    },
    {
      "id": "m16",
      "number": "6.1",
      "trackId": "track-6",
      "trackTitle": "Analytical Engines (OLAP), Distributed SQL & Production Operations",
      "title": "Columnar Storage, Vectorized OLAP & Modern Lakehouses",
      "difficulty": "Advanced → Staff",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "columnar-storage-layout-parquet",
        "columnar-compression-rle-dictionary-delta",
        "late-materialization-simd-vectorization"
      ],
      "summary": "Row (NSM) vs Columnar (DSM/PAX) layouts, Apache Parquet, RLE/Dictionary/Delta compression, SIMD late materialization, Zone Maps, DuckDB, ClickHouse MergeTree, and Apache Iceberg.",
      "icon": "zap",
      "prerequisites": [
        "m08",
        "m12"
      ]
    },
    {
      "id": "m17",
      "number": "6.2",
      "trackId": "track-6",
      "trackTitle": "Analytical Engines (OLAP), Distributed SQL & Production Operations",
      "title": "Replication, Partitioning, Sharding & Distributed NewSQL",
      "difficulty": "Advanced → Staff",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "single-leader-replication-sync-async",
        "read-replicas-consistency-models",
        "failover-split-brain-fencing-tokens"
      ],
      "summary": "Single-leader physical/logical replication, read replica consistency anomalies, split-brain failover, declarative partitioning, horizontal sharding (Vitess/Citus), 2PC vs Sagas, and Spanner/CockroachDB.",
      "icon": "globe",
      "prerequisites": [
        "m13",
        "m15"
      ]
    },
    {
      "id": "m18",
      "number": "6.3",
      "trackId": "track-6",
      "trackTitle": "Analytical Engines (OLAP), Distributed SQL & Production Operations",
      "title": "Production Query Tuning, Observability & Database Reliability",
      "difficulty": "Advanced → Staff",
      "unitCount": 10,
      "builds": [],
      "simulators": [
        "keyset-cursor-pagination-vs-offset",
        "solving-n-plus-one-orm-queries",
        "full-text-search-trigrams-inverted-index"
      ],
      "summary": "Keyset cursor pagination vs OFFSET, solving ORM N+1 query storms, trigram/inverted full-text search, SKIP LOCKED job queues, bulk ingestion, pg_stat_statements triage, and PITR recovery.",
      "icon": "server",
      "prerequisites": [
        "m12",
        "m15",
        "m17"
      ]
    }
  ]
};

  ROADMAP_DATA.careerPaths = ROADMAP_DATA.paths;
  root.ROADMAP_DATA = ROADMAP_DATA;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ROADMAP_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
