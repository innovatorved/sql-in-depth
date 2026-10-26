// Auto-generated SQL In Depth From-Scratch Projects & Build Showcase Catalog (18 Projects)
(function() {
  const data = [
  {
    "id": "build-sql-query-interpreter",
    "slug": "build-sql-query-interpreter",
    "name": "build-sql-query-interpreter",
    "title": "Mini Relational Tuple Filter & Projection Engine",
    "category": "Relational Foundations",
    "difficulty": "Beginner",
    "estimatedMinutes": 30,
    "summary": "A relational tuple-at-a-time volcano iterator engine implementing Kleene three-valued logic (TRUE/FALSE/UNKNOWN), WHERE filtering, SELECT projection with expressions, ORDER BY NULLS LAST, and LIMIT/OFFSET slicing.",
    "description": "A relational tuple-at-a-time volcano iterator engine implementing Kleene three-valued logic (TRUE/FALSE/UNKNOWN), WHERE filtering, SELECT projection with expressions, ORDER BY NULLS LAST, and LIMIT/OFFSET slicing.",
    "highlights": [
      "Kleene 3-valued truth table evaluation (TRUE, FALSE, UNKNOWN) for NULL-safe predicates",
      "Logical execution order pipeline: FROM -> WHERE -> SELECT -> DISTINCT -> ORDER BY -> LIMIT/OFFSET",
      "Deterministic multi-key sorting with configurable NULLS FIRST / NULLS LAST ordering"
    ],
    "tags": [
      "Relational Algebra",
      "Three-Valued Logic",
      "Tuple Iterator",
      "Query Pipeline",
      "Projection"
    ],
    "relatedLessons": [
      "build-sql-query-interpreter",
      "why-databases-exist",
      "tables-rows-columns-types",
      "select-projection-aliases",
      "where-filtering-predicates",
      "boolean-logic-three-valued-null"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-sql-query-interpreter/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-sql-query-interpreter/",
    "pinned": true,
    "featuredBadge": "Relational Foundations · ~30m"
  },
  {
    "id": "build-ecommerce-schema-ddl",
    "slug": "build-ecommerce-schema-ddl",
    "name": "build-ecommerce-schema-ddl",
    "title": "E-Commerce Schema with Referential Integrity & Upsert Pipeline",
    "category": "DDL & Schema Constraints",
    "difficulty": "Intermediate",
    "estimatedMinutes": 35,
    "summary": "An in-memory DDL constraint validator and idempotent UPSERT engine enforcing PRIMARY KEY, UNIQUE, NOT NULL, CHECK predicates, and cascading FOREIGN KEY referential integrity actions.",
    "description": "An in-memory DDL constraint validator and idempotent UPSERT engine enforcing PRIMARY KEY, UNIQUE, NOT NULL, CHECK predicates, and cascading FOREIGN KEY referential integrity actions.",
    "highlights": [
      "Strict NOT NULL, UNIQUE, and custom CHECK constraint validation prior to tuple commit",
      "Referential integrity enforcement supporting ON DELETE RESTRICT, CASCADE, and SET NULL",
      "Idempotent INSERT ... ON CONFLICT (key) DO UPDATE SET atomic upsert resolution"
    ],
    "tags": [
      "DDL Constraints",
      "Foreign Keys",
      "Cascading Deletes",
      "Upsert Pipeline",
      "Referential Integrity"
    ],
    "relatedLessons": [
      "build-ecommerce-schema-ddl",
      "create-table-ddl-anatomy",
      "primary-keys-surrogate-vs-natural",
      "foreign-keys-referential-integrity",
      "check-unique-not-null-defaults",
      "insert-bulk-loading-returning"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-ecommerce-schema-ddl/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-ecommerce-schema-ddl/",
    "pinned": true,
    "featuredBadge": "DDL & Schema Constraints · ~35m"
  },
  {
    "id": "build-multi-table-order-reconciler",
    "slug": "build-multi-table-order-reconciler",
    "name": "build-multi-table-order-reconciler",
    "title": "Multi-Table Order, Payment & Shipment Reconciliation Engine",
    "category": "Relational Joins & Set Algebra",
    "difficulty": "Intermediate",
    "estimatedMinutes": 35,
    "summary": "A relational join and anti-join reconciliation engine that pre-aggregates 1-to-many child tables before joining to eliminate fan-out traps and detects orphan orders, unshipped captures, and settlement discrepancies.",
    "description": "A relational join and anti-join reconciliation engine that pre-aggregates 1-to-many child tables before joining to eliminate fan-out traps and detects orphan orders, unshipped captures, and settlement discrepancies.",
    "highlights": [
      "Fan-out-safe pre-aggregation of payments and shipments prior to parent order join",
      "LEFT JOIN / IS NULL anti-join detection of unpaid and unshipped orders",
      "FULL OUTER JOIN discrepancy audit reconciling internal orders against gateway ledger events"
    ],
    "tags": [
      "Multi-Table Joins",
      "Chasm Trap",
      "Anti-Join",
      "FULL OUTER JOIN",
      "Order Reconciliation"
    ],
    "relatedLessons": [
      "build-multi-table-order-reconciler",
      "relational-algebra-set-theory",
      "inner-join-equi-joins",
      "left-right-full-outer-joins",
      "join-where-vs-on-filter-trap",
      "self-joins-non-equi-joins"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-multi-table-order-reconciler/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-multi-table-order-reconciler/",
    "pinned": false,
    "featuredBadge": "Relational Joins & Set Algebra · ~35m"
  },
  {
    "id": "build-executive-kpi-aggregation-suite",
    "slug": "build-executive-kpi-aggregation-suite",
    "name": "build-executive-kpi-aggregation-suite",
    "title": "Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite",
    "category": "Aggregation & Grouping Sets",
    "difficulty": "Intermediate",
    "estimatedMinutes": 35,
    "summary": "A single-pass multi-dimensional OLAP aggregation engine implementing conditional FILTER (WHERE ...), GROUPING SETS / ROLLUP subtotals with bitmask GROUPING() flags, and exact/interpolated percentiles.",
    "description": "A single-pass multi-dimensional OLAP aggregation engine implementing conditional FILTER (WHERE ...), GROUPING SETS / ROLLUP subtotals with bitmask GROUPING() flags, and exact/interpolated percentiles.",
    "highlights": [
      "Single-pass conditional aggregation equivalent to COUNT/SUM(...) FILTER (WHERE ...)",
      "Hierarchical ROLLUP and GROUPING SETS generator with bitmask GROUPING(col) metadata",
      "Exact discrete (PERCENTILE_DISC) and continuous interpolated (PERCENTILE_CONT) quantiles"
    ],
    "tags": [
      "GROUPING SETS",
      "ROLLUP",
      "Conditional Aggregation",
      "FILTER Clause",
      "Percentiles"
    ],
    "relatedLessons": [
      "build-executive-kpi-aggregation-suite",
      "aggregate-functions-internals",
      "group-by-execution-mechanics",
      "having-vs-where-pipeline",
      "conditional-aggregation-filter",
      "string-json-array-aggregation"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-executive-kpi-aggregation-suite/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-executive-kpi-aggregation-suite/",
    "pinned": false,
    "featuredBadge": "Aggregation & Grouping Sets · ~35m"
  },
  {
    "id": "build-hierarchical-graph-query-engine",
    "slug": "build-hierarchical-graph-query-engine",
    "name": "build-hierarchical-graph-query-engine",
    "title": "Bill-of-Materials & Social Graph Reachability Engine",
    "category": "Subqueries, CTEs & Recursion",
    "difficulty": "Advanced",
    "estimatedMinutes": 40,
    "summary": "A fixed-point recursive CTE execution engine supporting working-table iteration, UNION vs UNION ALL deduplication, path-array cycle detection, Bill-of-Materials cost rollup, and NULL-safe NOT EXISTS anti-joins.",
    "description": "A fixed-point recursive CTE execution engine supporting working-table iteration, UNION vs UNION ALL deduplication, path-array cycle detection, Bill-of-Materials cost rollup, and NULL-safe NOT EXISTS anti-joins.",
    "highlights": [
      "Fixed-point iterative working-table evaluation matching SQL WITH RECURSIVE semantics",
      "Path-vector cycle detection preventing infinite loops on cyclic dependency graphs",
      "Bill-of-Materials component multiplication and NULL-safe NOT EXISTS anti-join evaluation"
    ],
    "tags": [
      "Recursive CTE",
      "Graph Traversal",
      "Cycle Detection",
      "Bill of Materials",
      "NOT EXISTS"
    ],
    "relatedLessons": [
      "build-hierarchical-graph-query-engine",
      "scalar-row-table-subqueries",
      "correlated-subqueries-mechanics",
      "exists-not-exists-null-safety",
      "lateral-joins-cross-apply",
      "common-table-expressions-with"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-hierarchical-graph-query-engine/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-hierarchical-graph-query-engine/",
    "pinned": true,
    "featuredBadge": "Subqueries, CTEs & Recursion · ~40m"
  },
  {
    "id": "build-sessionization-retention-engine",
    "slug": "build-sessionization-retention-engine",
    "name": "build-sessionization-retention-engine",
    "title": "Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer",
    "category": "Window Functions & Analytics",
    "difficulty": "Advanced",
    "estimatedMinutes": 40,
    "summary": "An analytical window function engine implementing LAG()-based clickstream sessionization, ROW_NUMBER() date-difference islands for consecutive activity streaks, and ROWS vs RANGE sliding window frames.",
    "description": "An analytical window function engine implementing LAG()-based clickstream sessionization, ROW_NUMBER() date-difference islands for consecutive activity streaks, and ROWS vs RANGE sliding window frames.",
    "highlights": [
      "Clickstream sessionization via LAG(ts) inactivity threshold detection and cumulative SUM() session IDs",
      "Gaps-and-Islands streak length calculation using the date - ROW_NUMBER() constant-difference invariant",
      "Exact physical ROWS vs logical value-based RANGE window frame evaluation with peer grouping"
    ],
    "tags": [
      "Window Functions",
      "Sessionization",
      "Gaps and Islands",
      "ROWS vs RANGE",
      "Sliding Windows"
    ],
    "relatedLessons": [
      "build-sessionization-retention-engine",
      "window-functions-mental-model",
      "partition-by-order-by-mechanics",
      "ranking-functions-row-number-rank",
      "top-n-per-group-deduplication",
      "offset-functions-lag-lead-first-last"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-sessionization-retention-engine/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-sessionization-retention-engine/",
    "pinned": true,
    "featuredBadge": "Window Functions & Analytics · ~40m"
  },
  {
    "id": "build-normalized-booking-schema",
    "slug": "build-normalized-booking-schema",
    "name": "build-normalized-booking-schema",
    "title": "Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System",
    "category": "Relational Schema Design & Normalization",
    "difficulty": "Advanced",
    "estimatedMinutes": 40,
    "summary": "An algorithmic functional dependency analyzer implementing Armstrong’s Axiom attribute closure X+, candidate key discovery, BCNF violation detection, and lossless-join decomposition.",
    "description": "An algorithmic functional dependency analyzer implementing Armstrong’s Axiom attribute closure X+, candidate key discovery, BCNF violation detection, and lossless-join decomposition.",
    "highlights": [
      "Attribute closure X+ fixed-point computation via Armstrong’s Axioms",
      "Minimal superkey / candidate key synthesis over arbitrary functional dependency sets",
      "Automated BCNF violation detector and lossless-join relation decomposition"
    ],
    "tags": [
      "Functional Dependencies",
      "Attribute Closure",
      "3NF & BCNF",
      "Lossless Decomposition",
      "Normalization"
    ],
    "relatedLessons": [
      "build-normalized-booking-schema",
      "entity-relationship-modeling",
      "functional-dependencies-keys",
      "first-normal-form-atomicity",
      "second-third-normal-form",
      "boyce-codd-fourth-fifth-normal-form"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-normalized-booking-schema/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-normalized-booking-schema/",
    "pinned": false,
    "featuredBadge": "Relational Schema Design & Normalization · ~40m"
  },
  {
    "id": "build-scd-type2-warehouse-pipeline",
    "slug": "build-scd-type2-warehouse-pipeline",
    "name": "build-scd-type2-warehouse-pipeline",
    "title": "Star Schema with Automated SCD Type 2 Dimension Pipeline",
    "category": "Dimensional Modeling & Kimball OLAP",
    "difficulty": "Advanced",
    "estimatedMinutes": 40,
    "summary": "A Kimball dimensional warehouse pipeline implementing automated Slowly Changing Dimension (SCD Type 2) effective date range versioning, surrogate key assignment, and point-in-time historical fact-to-dimension joins.",
    "description": "A Kimball dimensional warehouse pipeline implementing automated Slowly Changing Dimension (SCD Type 2) effective date range versioning, surrogate key assignment, and point-in-time historical fact-to-dimension joins.",
    "highlights": [
      "Automated SCD Type 2 change detection expiring prior version rows and inserting new surrogate keys",
      "Half-open [valid_from, valid_to) temporal interval invariants with is_current boolean flags",
      "As-was point-in-time historical fact table enrichment resolving surrogate keys by event timestamp"
    ],
    "tags": [
      "Star Schema",
      "SCD Type 2",
      "Surrogate Keys",
      "Point-in-Time Join",
      "Kimball OLAP"
    ],
    "relatedLessons": [
      "build-scd-type2-warehouse-pipeline",
      "oltp-vs-olap-workload-physics",
      "star-schema-facts-dimensions",
      "snowflake-vs-star-vs-obt",
      "slowly-changing-dimensions-scd",
      "bridge-tables-junk-role-dimensions"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-scd-type2-warehouse-pipeline/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-scd-type2-warehouse-pipeline/",
    "pinned": false,
    "featuredBadge": "Dimensional Modeling & Kimball OLAP · ~40m"
  },
  {
    "id": "build-saas-cohort-funnel-workbench",
    "slug": "build-saas-cohort-funnel-workbench",
    "name": "build-saas-cohort-funnel-workbench",
    "title": "Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)",
    "category": "Temporal, Cohort & Product Analytics",
    "difficulty": "Advanced",
    "estimatedMinutes": 40,
    "summary": "A SaaS product analytics engine implementing gapless date spines, triangular cohort retention matrices, strict chronological funnel conversion attribution, and Allen interval overlap detection.",
    "description": "A SaaS product analytics engine implementing gapless date spines, triangular cohort retention matrices, strict chronological funnel conversion attribution, and Allen interval overlap detection.",
    "highlights": [
      "Triangular Month-0..Month-N cohort retention matrix with percentage normalization",
      "Strict temporal ordering funnel attribution (Signup -> Activated -> Subscribed)",
      "Allen interval algebra overlap predicate (startA < endB AND endA > startB) for concurrency and booking checks"
    ],
    "tags": [
      "Cohort Retention",
      "Funnel Attribution",
      "Date Spine",
      "Allen Interval Algebra",
      "SaaS Metrics"
    ],
    "relatedLessons": [
      "build-saas-cohort-funnel-workbench",
      "calendar-tables-date-spines",
      "cohort-retention-matrix-sql",
      "funnel-conversion-attribution-sql",
      "interval-overlap-allen-algebra",
      "pivoting-unpivoting-cross-tabs"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-saas-cohort-funnel-workbench/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-saas-cohort-funnel-workbench/",
    "pinned": false,
    "featuredBadge": "Temporal, Cohort & Product Analytics · ~40m"
  },
  {
    "id": "build-btree-index-advisor",
    "slug": "build-btree-index-advisor",
    "name": "build-btree-index-advisor",
    "title": "B+Tree Page Simulator & Automated Workload Index Advisor",
    "category": "B+Trees & Indexing Architecture",
    "difficulty": "Advanced",
    "estimatedMinutes": 45,
    "summary": "An in-memory B+Tree index simulator with doubly linked leaf sibling pointers for range scans and an automated workload index advisor applying the Equality -> Sort -> Range + INCLUDE covering rule.",
    "description": "An in-memory B+Tree index simulator with doubly linked leaf sibling pointers for range scans and an automated workload index advisor applying the Equality -> Sort -> Range + INCLUDE covering rule.",
    "highlights": [
      "B+Tree leaf node splits with upward separator key promotion and sibling leaf pointer linking",
      "O(log_B N + K) range scan traversal walking leaf next pointers without re-descending internal nodes",
      "Automated composite index synthesis ordering Equality -> ORDER BY -> Range columns with INCLUDE payload"
    ],
    "tags": [
      "B+Tree",
      "Composite Index",
      "ESR Rule",
      "Covering Index",
      "Range Scan"
    ],
    "relatedLessons": [
      "build-btree-index-advisor",
      "why-indexes-work-io-cost-model",
      "btree-bplustree-internal-anatomy",
      "clustered-vs-secondary-indexes",
      "composite-indexes-leftmost-prefix",
      "covering-indexes-index-only-scans"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-btree-index-advisor/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-btree-index-advisor/",
    "pinned": true,
    "featuredBadge": "B+Trees & Indexing Architecture · ~45m"
  },
  {
    "id": "build-visual-explain-plan-analyzer",
    "slug": "build-visual-explain-plan-analyzer",
    "name": "build-visual-explain-plan-analyzer",
    "title": "Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter",
    "category": "Query Optimizer & Execution Plans",
    "difficulty": "Advanced",
    "estimatedMinutes": 40,
    "summary": "A cost-based EXPLAIN ANALYZE plan tree analyzer that computes cardinality estimation Q-Error, flags external disk sorts and high-filter sequential scans, and rewrites non-sargable SQL predicates.",
    "description": "A cost-based EXPLAIN ANALYZE plan tree analyzer that computes cardinality estimation Q-Error, flags external disk sorts and high-filter sequential scans, and rewrites non-sargable SQL predicates.",
    "highlights": [
      "Cardinality estimation Q-Error = max(est/act, act/est) calculation across plan tree nodes",
      "Automated bottleneck flagging for Seq Scans with high Rows Removed by Filter and external disk Sorts",
      "Sargable SQL predicate rewriter transforming YEAR(col) = Y and arithmetic wrappers into indexable ranges"
    ],
    "tags": [
      "EXPLAIN ANALYZE",
      "Cardinality Estimation",
      "Q-Error",
      "Sargability",
      "Cost Model"
    ],
    "relatedLessons": [
      "build-visual-explain-plan-analyzer",
      "life-of-a-sql-query-pipeline",
      "reading-explain-and-explain-analyze",
      "table-statistics-histograms-cardinality",
      "selectivity-estimation-correlated-columns",
      "scan-operators-seq-index-bitmap"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-visual-explain-plan-analyzer/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-visual-explain-plan-analyzer/",
    "pinned": false,
    "featuredBadge": "Query Optimizer & Execution Plans · ~40m"
  },
  {
    "id": "build-physical-join-execution-engine",
    "slug": "build-physical-join-execution-engine",
    "name": "build-physical-join-execution-engine",
    "title": "Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join",
    "category": "Physical Join & Execution Operators",
    "difficulty": "Advanced",
    "estimatedMinutes": 45,
    "summary": "A physical relational join engine implementing Block Nested Loop Join, in-memory Build-and-Probe Hash Join, Zipper Sort-Merge Join with duplicate peer rewind, and NULL-safe Hash Anti-Join.",
    "description": "A physical relational join engine implementing Block Nested Loop Join, in-memory Build-and-Probe Hash Join, Zipper Sort-Merge Join with duplicate peer rewind, and NULL-safe Hash Anti-Join.",
    "highlights": [
      "Block Nested Loop Join minimizing inner-relation scans via chunked outer buffering",
      "Build-on-smaller-input Hash Join achieving O(N + M) linear execution cost",
      "Sort-Merge Join with peer group mark-and-rewind for duplicate join keys"
    ],
    "tags": [
      "Hash Join",
      "Sort-Merge Join",
      "Nested Loop Join",
      "Volcano Model",
      "Physical Operators"
    ],
    "relatedLessons": [
      "build-physical-join-execution-engine",
      "nested-loop-join-indexed-nlj",
      "hash-join-build-probe-grace",
      "sort-merge-join-zipper-mechanics",
      "join-order-search-dynamic-programming",
      "predicate-pushdown-projection-pruning"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-physical-join-execution-engine/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-physical-join-execution-engine/",
    "pinned": true,
    "featuredBadge": "Physical Join & Execution Operators · ~45m"
  },
  {
    "id": "build-transaction-anomaly-simulator",
    "slug": "build-transaction-anomaly-simulator",
    "name": "build-transaction-anomaly-simulator",
    "title": "Dual-Session Concurrency Anomaly & Isolation Verifier",
    "category": "Transactions, Isolation & Concurrency",
    "difficulty": "Advanced",
    "estimatedMinutes": 40,
    "summary": "A multi-session transaction schedule analyzer implementing Adya dependency serialization graphs (WW, WR, RW anti-dependencies), cycle detection for Dirty Read / Lost Update / Write Skew, and Wait-For Graph deadlock victim selection.",
    "description": "A multi-session transaction schedule analyzer implementing Adya dependency serialization graphs (WW, WR, RW anti-dependencies), cycle detection for Dirty Read / Lost Update / Write Skew, and Wait-For Graph deadlock victim selection.",
    "highlights": [
      "Adya Serialization Graph builder extracting WW, WR, and RW (anti-dependency) edges from interleaved schedules",
      "Automated classification of Lost Update (P4) vs Write Skew (A5B) under Snapshot Isolation",
      "Wait-For Graph cycle detection and minimum-cost deadlock victim abort selection"
    ],
    "tags": [
      "Isolation Levels",
      "Write Skew",
      "Lost Update",
      "Serialization Graph",
      "Deadlock Detection"
    ],
    "relatedLessons": [
      "build-transaction-anomaly-simulator",
      "acid-properties-under-the-hood",
      "transaction-lifecycle-savepoints",
      "read-phenomena-dirty-nonrepeatable-phantom",
      "write-anomalies-lost-update-write-skew",
      "read-uncommitted-read-committed"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-transaction-anomaly-simulator/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-transaction-anomaly-simulator/",
    "pinned": false,
    "featuredBadge": "Transactions, Isolation & Concurrency · ~40m"
  },
  {
    "id": "build-mvcc-snapshot-storage-engine",
    "slug": "build-mvcc-snapshot-storage-engine",
    "name": "build-mvcc-snapshot-storage-engine",
    "title": "Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC",
    "category": "MVCC, Locking & Deadlocks",
    "difficulty": "Advanced",
    "estimatedMinutes": 45,
    "summary": "A PostgreSQL-style Multi-Version Concurrency Control (MVCC) storage engine implementing (xmin, xmax) tuple headers, Snapshot Isolation (xmin, xmax, xip_list) visibility rules, First-Committer-Wins write conflict detection, and VACUUM dead-tuple garbage collection.",
    "description": "A PostgreSQL-style Multi-Version Concurrency Control (MVCC) storage engine implementing (xmin, xmax) tuple headers, Snapshot Isolation (xmin, xmax, xip_list) visibility rules, First-Committer-Wins write conflict detection, and VACUUM dead-tuple garbage collection.",
    "highlights": [
      "PostgreSQL tuple header versioning (xmin, xmax) where UPDATE expires the old version and appends a new version",
      "Snapshot Isolation visibility evaluator over (xmin, xmax, xip_list) active transaction sets",
      "First-Committer-Wins write-write conflict detection and VACUUM dead-tuple reclamation below globalOldestXmin"
    ],
    "tags": [
      "MVCC",
      "Tuple Visibility",
      "Snapshot Isolation",
      "First-Committer-Wins",
      "VACUUM GC"
    ],
    "relatedLessons": [
      "build-mvcc-snapshot-storage-engine",
      "multi-version-concurrency-control-mvcc",
      "tuple-headers-xmin-xmax-visibility",
      "transaction-snapshots-visibility-rules",
      "row-level-locks-for-update-skip-locked",
      "table-locks-intention-locks-ddl-hazards"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-mvcc-snapshot-storage-engine/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-mvcc-snapshot-storage-engine/",
    "pinned": true,
    "featuredBadge": "MVCC, Locking & Deadlocks · ~45m"
  },
  {
    "id": "build-slotted-page-wal-engine",
    "slug": "build-slotted-page-wal-engine",
    "name": "build-slotted-page-wal-engine",
    "title": "8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator",
    "category": "Storage Engines, Buffer Pool & WAL",
    "difficulty": "Advanced",
    "estimatedMinutes": 45,
    "summary": "A disk-page storage engine implementing an 8KB slotted page with downward line-pointer array growth and upward tuple growth, PageLSN tracking, and 3-phase ARIES crash recovery (Analysis, Redo, Undo).",
    "description": "A disk-page storage engine implementing an 8KB slotted page with downward line-pointer array growth and upward tuple growth, PageLSN tracking, and 3-phase ARIES crash recovery (Analysis, Redo, Undo).",
    "highlights": [
      "8KB Slotted Page memory layout growing line pointers downward and variable-length tuples upward",
      "In-place line-pointer compaction reclaiming fragmented tuple space without changing external TIDs",
      "Three-phase ARIES WAL recovery (Analysis, Redo from minRecLSN, and reverse Undo with CLR logging)"
    ],
    "tags": [
      "Slotted Page",
      "Write-Ahead Logging",
      "ARIES Recovery",
      "PageLSN",
      "Buffer Pool"
    ],
    "relatedLessons": [
      "build-slotted-page-wal-engine",
      "slotted-page-layout-8kb-anatomy",
      "heap-files-hot-updates-fillfactor",
      "buffer-pool-clock-sweep-lru-k",
      "write-ahead-logging-wal-lsn",
      "checkpoints-dirty-page-flushing"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-slotted-page-wal-engine/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-slotted-page-wal-engine/",
    "pinned": false,
    "featuredBadge": "Storage Engines, Buffer Pool & WAL · ~45m"
  },
  {
    "id": "build-columnar-compression-query-engine",
    "slug": "build-columnar-compression-query-engine",
    "name": "build-columnar-compression-query-engine",
    "title": "Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown",
    "category": "Columnar OLAP & Modern Engines",
    "difficulty": "Advanced",
    "estimatedMinutes": 40,
    "summary": "A Parquet/DuckDB-style columnar execution engine implementing Dictionary + Run-Length Encoding (RLE), Row-Group Zone-Map (min/max) pruning, and late-materialization direct compressed predicate evaluation.",
    "description": "A Parquet/DuckDB-style columnar execution engine implementing Dictionary + Run-Length Encoding (RLE), Row-Group Zone-Map (min/max) pruning, and late-materialization direct compressed predicate evaluation.",
    "highlights": [
      "Dictionary + Run-Length Encoding (RLE) compressing sorted low-cardinality columns by 10x–50x",
      "Row-Group Zone-Map (min, max) metadata pruning skipping irrelevant row groups without decompression",
      "Direct predicate evaluation over RLE runs and late materialization of projected attributes"
    ],
    "tags": [
      "Columnar Storage",
      "Run-Length Encoding",
      "Dictionary Encoding",
      "Zone Maps",
      "Late Materialization"
    ],
    "relatedLessons": [
      "build-columnar-compression-query-engine",
      "columnar-storage-layout-parquet",
      "columnar-compression-rle-dictionary-delta",
      "late-materialization-simd-vectorization",
      "zone-maps-min-max-pruning-bloom",
      "embedded-olap-duckdb-architecture"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-columnar-compression-query-engine/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-columnar-compression-query-engine/",
    "pinned": true,
    "featuredBadge": "Columnar OLAP & Modern Engines · ~40m"
  },
  {
    "id": "build-sharded-query-router",
    "slug": "build-sharded-query-router",
    "name": "build-sharded-query-router",
    "title": "Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather",
    "category": "Distributed SQL, Partitioning & Sharding",
    "difficulty": "Advanced",
    "estimatedMinutes": 45,
    "summary": "A distributed SQL proxy router implementing FNV-1a consistent hash ring routing, single-shard vs scatter-gather query planning, LSN-fenced read-your-writes replica selection, and distributed Top-K merge.",
    "description": "A distributed SQL proxy router implementing FNV-1a consistent hash ring routing, single-shard vs scatter-gather query planning, LSN-fenced read-your-writes replica selection, and distributed Top-K merge.",
    "highlights": [
      "Deterministic FNV-1a virtual-node consistent hash ring routing tenant keys with minimal rebalancing movement",
      "Single-shard pruning when tenant_id is constrained vs parallel Scatter-Gather merge across shards",
      "Read-Your-Writes causal consistency router selecting replicas with replayLsn >= clientWriteLsn"
    ],
    "tags": [
      "Consistent Hashing",
      "Shard Router",
      "Scatter-Gather",
      "Read-Your-Writes",
      "Partition Pruning"
    ],
    "relatedLessons": [
      "build-sharded-query-router",
      "single-leader-replication-sync-async",
      "read-replicas-consistency-models",
      "failover-split-brain-fencing-tokens",
      "declarative-table-partitioning",
      "horizontal-sharding-routing-keys"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-sharded-query-router/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-sharded-query-router/",
    "pinned": false,
    "featuredBadge": "Distributed SQL, Partitioning & Sharding · ~45m"
  },
  {
    "id": "build-production-sql-tuning-clinic",
    "slug": "build-production-sql-tuning-clinic",
    "name": "build-production-sql-tuning-clinic",
    "title": "End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup)",
    "category": "Production SQL Patterns & Tuning",
    "difficulty": "Advanced",
    "estimatedMinutes": 45,
    "summary": "A production SQL performance engineering toolkit implementing O(1) keyset seek pagination, N+1 query batching coalescer, lock-free FOR UPDATE SKIP LOCKED worker queues, and chunked primary-key backfills.",
    "description": "A production SQL performance engineering toolkit implementing O(1) keyset seek pagination, N+1 query batching coalescer, lock-free FOR UPDATE SKIP LOCKED worker queues, and chunked primary-key backfills.",
    "highlights": [
      "Keyset seek cursor pagination (created_at, id) < (cursor_ts, cursor_id) running in constant O(log N) time",
      "DataLoader-style N+1 query batching coalescer collapsing K loop queries into 1 bulk ANY($1) lookup",
      "Lock-free concurrent worker queue claiming via FOR UPDATE SKIP LOCKED with visibility timeout recovery"
    ],
    "tags": [
      "Keyset Pagination",
      "N+1 Query Elimination",
      "SKIP LOCKED Queue",
      "Chunked Backfill",
      "Query Tuning"
    ],
    "relatedLessons": [
      "build-production-sql-tuning-clinic",
      "keyset-cursor-pagination-vs-offset",
      "solving-n-plus-one-orm-queries",
      "full-text-search-trigrams-inverted-index",
      "queue-processing-skip-locked-patterns",
      "bulk-ingestion-batching-unlogged-tables"
    ],
    "language": "JavaScript (ES2022+) / SQL Engine",
    "languageColor": "#f1e05a",
    "githubUrl": "https://sql-in-depth.vedgupta.in/build/build-production-sql-tuning-clinic/",
    "githubRepo": "innovatorved/sql-in-depth",
    "liveUrl": "/build/build-production-sql-tuning-clinic/",
    "pinned": true,
    "featuredBadge": "Production SQL Patterns & Tuning · ~45m"
  }
];
  if (typeof window !== 'undefined') {
    window.PROJECTS_DATA = data;
    window.PROJECTS = data;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  }
})();
