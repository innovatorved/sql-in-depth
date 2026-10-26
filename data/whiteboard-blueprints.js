/**
 * SQL In Depth — Interactive Query & Storage Architecture Decision Matrices & Capacity Blueprints
 * 12 Database Engine Building Blocks + 10 Interactive Workload -> Schema/Index -> Execution Blueprints.
 * Exposes window.WHITEBOARD_DATA and window.WHITEBOARD_BLUEPRINTS.
 */
(function(root) {
  'use strict';

  var BUILDING_BLOCKS = [
  {
    "id": "pgbouncer-conn-pool",
    "name": "PgBouncer Transaction Pooler",
    "category": "edge",
    "icon": "globe",
    "maxQpsPerInstance": 120000,
    "baseLatencyMs": 0.25,
    "costPerInstanceMonthly": 35,
    "defaultInstances": 2,
    "description": "Multiplexes 10,000+ ephemeral application connections onto a bounded pool of active database backend processes (2–4× CPU cores)."
  },
  {
    "id": "sql-parser-rewriter",
    "name": "SQL Parser, Binder & View Rewriter",
    "category": "edge",
    "icon": "shield",
    "maxQpsPerInstance": 95000,
    "baseLatencyMs": 0.3,
    "costPerInstanceMonthly": 30,
    "defaultInstances": 2,
    "description": "Lexes and parses SQL into an AST, binds catalog OIDs, expands views/CTEs, and enforces Row-Level Security (RLS) policy predicates."
  },
  {
    "id": "buffer-pool-clock-sweep",
    "name": "Shared Buffer Pool (8KB Slotted Pages)",
    "category": "cache",
    "icon": "zap",
    "maxQpsPerInstance": 180000,
    "baseLatencyMs": 0.15,
    "costPerInstanceMonthly": 90,
    "defaultInstances": 2,
    "description": "In-RAM 8KB page cache managed via Clock-Sweep / 2Q / LRU-K eviction with pin counts, dirty flags, and Visibility Map bits."
  },
  {
    "id": "materialized-view-cache",
    "name": "Materialized View & Rollup Tier",
    "category": "cache",
    "icon": "layers",
    "maxQpsPerInstance": 140000,
    "baseLatencyMs": 0.4,
    "costPerInstanceMonthly": 70,
    "defaultInstances": 1,
    "description": "Pre-computed aggregate summary tables refreshed incrementally or via REFRESH MATERIALIZED VIEW CONCURRENTLY."
  },
  {
    "id": "cbo-join-planner",
    "name": "Cost-Based Optimizer (System R / Cascades)",
    "category": "compute",
    "icon": "cpu",
    "maxQpsPerInstance": 65000,
    "baseLatencyMs": 0.9,
    "costPerInstanceMonthly": 60,
    "defaultInstances": 2,
    "description": "Uses MCV lists, equi-depth histograms, and NDV sketches to select between Nested Loop, Hash Join, and Sort-Merge Join."
  },
  {
    "id": "window-hash-agg-engine",
    "name": "HashAggregate & Window Framing Kernel",
    "category": "compute",
    "icon": "activity",
    "maxQpsPerInstance": 55000,
    "baseLatencyMs": 1.8,
    "costPerInstanceMonthly": 65,
    "defaultInstances": 2,
    "description": "Executes GROUPING SETS, ROLLUP, recursive CTE fixpoints, and sliding ROWS/RANGE/GROUPS window frames with work_mem spill protection."
  },
  {
    "id": "vectorized-simd-olap",
    "name": "Vectorized SIMD Columnar Engine (DuckDB/ClickHouse)",
    "category": "compute",
    "icon": "cpu",
    "maxQpsPerInstance": 85000,
    "baseLatencyMs": 1.4,
    "costPerInstanceMonthly": 85,
    "defaultInstances": 2,
    "description": "Processes 2048-tuple columnar batches in L1 cache with late materialization and SIMD predicate evaluation over dictionary/RLE codes."
  },
  {
    "id": "mvcc-ssi-lock-manager",
    "name": "MVCC Snapshot & SSI Lock Manager",
    "category": "compute",
    "icon": "git-branch",
    "maxQpsPerInstance": 90000,
    "baseLatencyMs": 0.5,
    "costPerInstanceMonthly": 55,
    "defaultInstances": 2,
    "description": "Evaluates xmin/xmax tuple visibility against active snapshots, tracks SIREAD rw-antidependencies, and detects Wait-For Graph deadlocks."
  },
  {
    "id": "bplustree-covering-index",
    "name": "B+Tree Composite & Covering Index (INCLUDE)",
    "category": "storage",
    "icon": "database",
    "maxQpsPerInstance": 75000,
    "baseLatencyMs": 1.1,
    "costPerInstanceMonthly": 80,
    "defaultInstances": 2,
    "description": "High-fanout (B=400) disk-oriented B+Tree supporting O(log_B N) point lookups, keyset range cursors, and Index-Only Scans."
  },
  {
    "id": "gin-gist-brin-index",
    "name": "GIN Inverted / GiST Spatial / BRIN Zone Index",
    "category": "storage",
    "icon": "search",
    "maxQpsPerInstance": 60000,
    "baseLatencyMs": 1.5,
    "costPerInstanceMonthly": 75,
    "defaultInstances": 2,
    "description": "Specialized indexing tier: GIN posting lists for JSONB/FTS, GiST R-Trees for temporal exclusion constraints, and BRIN min/max summaries."
  },
  {
    "id": "wal-aries-storage",
    "name": "Append-Only WAL & ARIES Durable Heap",
    "category": "storage",
    "icon": "database",
    "maxQpsPerInstance": 50000,
    "baseLatencyMs": 1.9,
    "costPerInstanceMonthly": 110,
    "defaultInstances": 2,
    "description": "Sequential Write-Ahead Log with Group Commit fsync, LSN page stamping, full-page writes, and background Checkpointer/Autovacuum."
  },
  {
    "id": "outbox-cdc-streamer",
    "name": "Transactional Outbox & Debezium WAL CDC",
    "category": "messaging",
    "icon": "clock",
    "maxQpsPerInstance": 100000,
    "baseLatencyMs": 0.6,
    "costPerInstanceMonthly": 45,
    "defaultInstances": 2,
    "description": "Tails logical replication WAL slots to stream committed mutations and SKIP LOCKED job events downstream without dual-write races."
  }
];

  var BLUEPRINTS = [
  {
    "id": "sargable-composite-index-selector",
    "title": "B+Tree Indexing & SARGable Query Pipeline (10⁸ Rows)",
    "subtitle": "Leftmost-Prefix Rule + Equality→Range→Sort Ordering + INCLUDE Covering Scan",
    "category": "Track 4 · Storage Engines & Indexing Internals",
    "difficulty": "Intermediate",
    "targetQps": 60000,
    "targetLatencyMs": 4,
    "constraintN": "10^8 rows (~80 GB heap), target < 4ms p99 point & range queries",
    "optimalComplexity": "O(log_B N + K/B) Index-Only Scan (3–4 page reads)",
    "description": "Interactive architecture blueprint for designing composite B+Tree indexes (Equality, Range, INCLUDE) and rewriting non-SARGable predicates so queries execute via Index-Only Scans with zero random heap fetches.",
    "relatedSlugs": [
      "btree-bplustree-internal-anatomy",
      "composite-indexes-leftmost-prefix",
      "covering-indexes-index-only-scans",
      "sargability-functions-on-columns"
    ],
    "requirements": [
      "Order composite B+Tree index keys strictly by Equality predicates first, Range/ORDER BY column second, and SELECT-only payload columns in INCLUDE (...).",
      "Rewrite expression-wrapped predicates (e.g., DATE(created_at) = '2026-05-01') into SARGable half-open intervals (created_at >= '2026-05-01' AND created_at < '2026-05-02').",
      "Use Partial Indexes (WHERE status = 'PENDING') when querying a skewed minority subset (< 5% of rows) to shrink index footprint by 95%.",
      "Ensure Autovacuum maintains the Visibility Map (VM) so Index-Only Scans do not fall back to random heap page checks."
    ],
    "defaultInputs": {
      "dau": 6000000,
      "readsPerUser": 50,
      "writesPerUser": 8,
      "payloadBytes": 512,
      "cacheHitRatio": 92,
      "replicationFactor": 2,
      "retentionDays": 90
    },
    "frames": [
      {
        "id": "f-parse",
        "label": "1. SARGable Predicate Rewrite",
        "x": 40,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#3b82f6"
      },
      {
        "id": "f-index",
        "label": "2. B+Tree & Buffer Pool Lookup",
        "x": 330,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#10b981"
      },
      {
        "id": "f-heap",
        "label": "3. Visibility Map & Durable Heap",
        "x": 690,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#f59e0b"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "Leftmost-Prefix Invariant",
        "text": "An index on (tenant_id, status, created_at) accelerates tenant_id = ? AND status = ? ORDER BY created_at, avoiding an external sort.",
        "x": 40,
        "y": 410,
        "color": "#10b981"
      },
      {
        "id": "note-2",
        "title": "Random Heap I/O Trap",
        "text": "Fetching 5,000 unclustered heap rows via an un-covered index triggers 5,000 random 8KB reads (~500ms on disk); INCLUDE eliminates heap access.",
        "x": 420,
        "y": 410,
        "color": "#f59e0b"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "sql-parser-rewriter",
        "label": "SARGable Query Rewriter",
        "x": 80,
        "y": 160,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "bplustree-covering-index",
        "label": "Composite Covering B+Tree",
        "x": 390,
        "y": 110,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "buffer-pool-clock-sweep",
        "label": "Shared Buffer Pool + VM",
        "x": 390,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "wal-aries-storage",
        "label": "8KB Slotted Heap Pages",
        "x": 730,
        "y": 175,
        "instances": 2
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "Seek [low_key, high_key)"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "Check Visibility Map Bit"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "Heap Fetch Only on VM Miss"
      }
    ]
  },
  {
    "id": "join-algorithm-optimizer-matrix",
    "title": "Cost-Based Join Algorithm Selection Matrix (NLJ vs Hash vs Merge)",
    "subtitle": "System R Dynamic Programming + MCV/Histogram Selectivity + Memory Spill Guardrails",
    "category": "Track 4 · Query Optimizer & Execution Plans",
    "difficulty": "Advanced",
    "targetQps": 35000,
    "targetLatencyMs": 8,
    "constraintN": "|R| = 10^5, |S| = 10^7, work_mem = 64MB",
    "optimalComplexity": "O(|R| + |S|) Hash Join or O(|R| log |S|) Indexed NLJ",
    "description": "Decision blueprint illustrating how the Cost-Based Optimizer chooses between Indexed Nested Loop Join, Grace/In-Memory Hash Join, and Sort-Merge Join based on selectivity, sort order, and work_mem.",
    "relatedSlugs": [
      "nested-loop-join-indexed-nlj",
      "hash-join-build-probe-grace",
      "sort-merge-join-zipper-mechanics",
      "reading-explain-and-explain-analyze"
    ],
    "requirements": [
      "Use Indexed Nested Loop Join when the outer input is tiny (< 1,000 rows after filtering) and the inner table has a selective B+Tree index on the join key.",
      "Use Hash Join for large equi-joins when inputs are unsorted; always hash the smaller relation (build table) in work_mem and stream the larger relation (probe table).",
      "Use Sort-Merge Join when both inputs are already sorted by B+Tree indexes on the join key or when joining on non-equi range conditions with bounded sort cost.",
      "Create extended multivariate statistics (CREATE STATISTICS) on correlated columns so the planner does not underestimate row counts and pick a catastrophic Nested Loop."
    ],
    "defaultInputs": {
      "dau": 3500000,
      "readsPerUser": 40,
      "writesPerUser": 6,
      "payloadBytes": 768,
      "cacheHitRatio": 88,
      "replicationFactor": 2,
      "retentionDays": 60
    },
    "frames": [
      {
        "id": "f-stats",
        "label": "1. Catalog Statistics & Selectivity",
        "x": 40,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#06b6d4"
      },
      {
        "id": "f-plan",
        "label": "2. Physical Join Operator Kernel",
        "x": 340,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#8b5cf6"
      },
      {
        "id": "f-io",
        "label": "3. Index & Buffer Pool Access",
        "x": 700,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#10b981"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "Stale Statistics Trap",
        "text": "If ANALYZE has not run after a bulk load, est_rows = 1 tricks the optimizer into an O(N·M) Nested Loop Join across millions of rows.",
        "x": 40,
        "y": 410,
        "color": "#ef4444"
      },
      {
        "id": "note-2",
        "title": "Multi-Batch Grace Hash Spill",
        "text": "When the Hash Join build table exceeds work_mem, it partitions into temp files on disk (Batches > 1 in EXPLAIN ANALYZE).",
        "x": 420,
        "y": 410,
        "color": "#06b6d4"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "cbo-join-planner",
        "label": "System R / Cascades Planner",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "window-hash-agg-engine",
        "label": "In-Memory Hash / Merge Join",
        "x": 400,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "bplustree-covering-index",
        "label": "Indexed Nested Loop Probe",
        "x": 400,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "buffer-pool-clock-sweep",
        "label": "Buffer Pool & Temp Work_Mem",
        "x": 735,
        "y": 175,
        "instances": 2
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "Large Unsorted Equi-Join"
      },
      {
        "from": "n1",
        "to": "n3",
        "label": "High Selectivity (< 0.5%)"
      },
      {
        "from": "n2",
        "to": "n4",
        "label": "Build Hash Table in RAM"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "B+Tree Inner Index Probes"
      }
    ]
  },
  {
    "id": "fanout-free-analytical-aggregation",
    "title": "Fanout-Free Multi-Table Aggregation & Window Pipeline",
    "subtitle": "Pre-Aggregated CTEs + Conditional FILTER + Shared Window Sort Optimization",
    "category": "Track 2 · Aggregations, CTEs & Window Functions",
    "difficulty": "Intermediate",
    "targetQps": 25000,
    "targetLatencyMs": 12,
    "constraintN": "10^7 orders joined with 3×10^7 items and 2×10^7 shipments",
    "optimalComplexity": "O(|Orders| + |Items| + |Shipments|) single-pass pre-aggregation",
    "description": "Eliminates the 1:N:M Chasm/Fanout double-counting bug by pre-aggregating independent child tables in CTEs before joining to the parent grain, and consolidates window sorts.",
    "relatedSlugs": [
      "join-fanout-chasm-traps",
      "conditional-aggregation-filter",
      "grouping-sets-rollup-cube",
      "window-frames-rows-range-groups"
    ],
    "requirements": [
      "Never join two independent 1:N child tables (e.g., order_items and order_shipments) directly before computing SUM() or COUNT() without DISTINCT.",
      "Pre-aggregate each child table to the parent grain (GROUP BY order_id) inside separate CTEs or LATERAL subqueries prior to joining.",
      "Collapse multi-metric self-joins into a single scan using COUNT(*) FILTER (WHERE ...) and SUM(CASE WHEN ...).",
      "Align PARTITION BY and ORDER BY clauses across window functions so the execution engine performs a single sort pass."
    ],
    "defaultInputs": {
      "dau": 2500000,
      "readsPerUser": 30,
      "writesPerUser": 5,
      "payloadBytes": 640,
      "cacheHitRatio": 85,
      "replicationFactor": 2,
      "retentionDays": 180
    },
    "frames": [
      {
        "id": "f-cte",
        "label": "1. Grain-Aligned Pre-Aggregation",
        "x": 40,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#3b82f6"
      },
      {
        "id": "f-win",
        "label": "2. Rollup & Window Framing",
        "x": 340,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#10b981"
      },
      {
        "id": "f-mat",
        "label": "3. KPI Serving & Caching",
        "x": 700,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#8b5cf6"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "Chasm Trap Multiplication",
        "text": "An order with 4 line items and 2 shipments produces 4 × 2 = 8 join rows, inflating SUM(item_price) by 2× and SUM(shipping_cost) by 4×.",
        "x": 40,
        "y": 410,
        "color": "#ef4444"
      },
      {
        "id": "note-2",
        "title": "Default Window Frame Rule",
        "text": "OVER (PARTITION BY dept ORDER BY salary) defaults to RANGE UNBOUNDED PRECEDING, merging peer ties! Use ROWS for physical offsets.",
        "x": 420,
        "y": 410,
        "color": "#3b82f6"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "sql-parser-rewriter",
        "label": "Pre-Aggregated Child CTEs",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "cbo-join-planner",
        "label": "1:1 Grain-Aligned Hash Join",
        "x": 400,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "window-hash-agg-engine",
        "label": "FILTER + Shared WindowSort",
        "x": 400,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "materialized-view-cache",
        "label": "Executive KPI Materialized View",
        "x": 735,
        "y": 175,
        "instances": 1
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "1 Row per order_id"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "Zero Fanout Stream"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "Incremental Refresh"
      }
    ]
  },
  {
    "id": "mvcc-high-concurrency-ledger",
    "title": "High-Concurrency Double-Entry Ledger & Write-Skew Defense",
    "subtitle": "Immutable Journal Entries + Pessimistic Lock Ordering + Serializable Snapshot Isolation",
    "category": "Track 5 · Transactions, MVCC & Concurrency Control",
    "difficulty": "Staff",
    "targetQps": 45000,
    "targetLatencyMs": 6,
    "constraintN": "50,000 TPS ledger transfers, zero negative balances or lost updates",
    "optimalComplexity": "O(log_B N) deterministic row locking + 1 Group-Commit WAL flush",
    "description": "Production financial ledger architecture combining immutable double-entry postings, deterministic account_id lock ordering to prevent deadlocks, and idempotency keys.",
    "relatedSlugs": [
      "case-stripe-ledger-precision",
      "serializable-2pl-vs-ssi",
      "deadlocks-wait-for-graphs-detection",
      "optimistic-vs-pessimistic-concurrency"
    ],
    "requirements": [
      "Enforce zero-sum double-entry invariants: every transfer inserts two immutable ledger_entries (debit + credit) summing to zero in exact integer cents or NUMERIC.",
      "Prevent Lost Updates and Write Skew on account balance checks using SELECT ... FOR UPDATE or atomic UPDATE accounts SET balance = balance - :amt WHERE id = :id AND balance >= :amt.",
      "Acquire row locks in canonical ascending order (ORDER BY account_id ASC FOR UPDATE) across multi-account transfers to make Wait-For Graph cycles mathematically impossible.",
      "Enforce idempotency via UNIQUE (merchant_id, idempotency_key) with ON CONFLICT DO NOTHING RETURNING."
    ],
    "defaultInputs": {
      "dau": 5000000,
      "readsPerUser": 25,
      "writesPerUser": 15,
      "payloadBytes": 384,
      "cacheHitRatio": 90,
      "replicationFactor": 3,
      "retentionDays": 365
    },
    "frames": [
      {
        "id": "f-edge",
        "label": "1. Idempotency & Pool Ingress",
        "x": 40,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#3b82f6"
      },
      {
        "id": "f-txn",
        "label": "2. MVCC & Ordered Row Locking",
        "x": 330,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#8b5cf6"
      },
      {
        "id": "f-wal",
        "label": "3. Group Commit WAL & Outbox",
        "x": 690,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#10b981"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "Canonical Lock Ordering",
        "text": "If Txn A transfers 10→20 and Txn B transfers 20→10, locking min(id) then max(id) eliminates AB-BA deadlocks completely.",
        "x": 40,
        "y": 410,
        "color": "#8b5cf6"
      },
      {
        "id": "note-2",
        "title": "Snapshot Isolation Trap",
        "text": "REPEATABLE READ alone allows two concurrent withdrawals to pass a SELECT balance check and overdraw the account unless FOR UPDATE or SERIALIZABLE is used.",
        "x": 420,
        "y": 410,
        "color": "#ef4444"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "pgbouncer-conn-pool",
        "label": "PgBouncer + Idempotency Gate",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "mvcc-ssi-lock-manager",
        "label": "Ordered FOR UPDATE / SSI",
        "x": 395,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "bplustree-covering-index",
        "label": "Account PK & Ledger Index",
        "x": 395,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "wal-aries-storage",
        "label": "Group-Commit WAL & Heap",
        "x": 735,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n5",
        "blockId": "outbox-cdc-streamer",
        "label": "Transactional Outbox CDC",
        "x": 735,
        "y": 245,
        "instances": 2
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "BEGIN + Lock Sorted IDs"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "Verify Balance & Post Entries"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "Single Batched WAL fsync"
      },
      {
        "from": "n4",
        "to": "n5",
        "label": "Stream Committed Ledger Event"
      }
    ]
  },
  {
    "id": "kimball-star-schema-lakehouse",
    "title": "Kimball Star Schema & Vectorized Columnar Lakehouse",
    "subtitle": "Surrogate Keys + SCD Type 2 As-Of Joins + Parquet Zone-Map Pruning + SIMD Execution",
    "category": "Track 6 · Columnar OLAP & Lakehouse Internals",
    "difficulty": "Advanced",
    "targetQps": 40000,
    "targetLatencyMs": 15,
    "constraintN": "10^10 fact rows in Parquet/Iceberg, sub-second analytical aggregations",
    "optimalComplexity": "O(|RowGroups_matched| × VectorBatch) SIMD scan",
    "description": "End-to-end analytical warehouse architecture combining Kimball conformed dimensions, SCD Type 2 historical tracking, Parquet PAX row-group zone maps, and SIMD vectorized execution.",
    "relatedSlugs": [
      "star-schema-facts-dimensions",
      "slowly-changing-dimensions-scd",
      "columnar-storage-layout-parquet",
      "late-materialization-simd-vectorization"
    ],
    "requirements": [
      "Model facts at a strict atomic grain using compact integer surrogate keys referencing conformed dimension tables.",
      "Track historical dimension changes with SCD Type 2 ([effective_from, effective_to), is_current) to support point-in-time attribution.",
      "Sort Parquet files by primary filter columns (e.g., event_date, tenant_id) to maximize Min/Max Zone-Map row-group skipping and RLE compression.",
      "Execute filters directly on dictionary-encoded column vectors in 2048-row batches using late materialization."
    ],
    "defaultInputs": {
      "dau": 8000000,
      "readsPerUser": 20,
      "writesPerUser": 5,
      "payloadBytes": 1024,
      "cacheHitRatio": 86,
      "replicationFactor": 2,
      "retentionDays": 365
    },
    "frames": [
      {
        "id": "f-ingest",
        "label": "1. CDC & SCD Type 2 Staging",
        "x": 40,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#06b6d4"
      },
      {
        "id": "f-store",
        "label": "2. Parquet / Iceberg Storage",
        "x": 330,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#f59e0b"
      },
      {
        "id": "f-simd",
        "label": "3. Vectorized SIMD Query Engine",
        "x": 690,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#10b981"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "Zone Map Clustering",
        "text": "Sorting Parquet row groups by event_date lets the engine skip 99% of row groups on a 7-day query using footer min/max statistics alone.",
        "x": 40,
        "y": 410,
        "color": "#f59e0b"
      },
      {
        "id": "note-2",
        "title": "Late Materialization",
        "text": "Evaluate WHERE predicates on compressed 1-byte dictionary codes first; reconstruct wide VARCHAR columns only for surviving rows.",
        "x": 420,
        "y": 410,
        "color": "#10b981"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "outbox-cdc-streamer",
        "label": "CDC Stream & SCD2 Upsert",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "gin-gist-brin-index",
        "label": "Parquet Zone Maps & Bloom",
        "x": 395,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "materialized-view-cache",
        "label": "Conformed Star Dimensions",
        "x": 395,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "vectorized-simd-olap",
        "label": "Vectorized SIMD Scan + Join",
        "x": 735,
        "y": 175,
        "instances": 2
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "Write Sorted 128MB Row Groups"
      },
      {
        "from": "n2",
        "to": "n4",
        "label": "Pruned Column Chunks"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "Broadcast Dimension Hash Table"
      }
    ]
  },
  {
    "id": "skip-locked-relational-job-queue",
    "title": "50,000 Jobs/Sec Relational Task Queue (FOR UPDATE SKIP LOCKED)",
    "subtitle": "Partial Pending Index + Lock-Free Worker Claiming + HOT Update / Partitioned Archive",
    "category": "Track 5 · Locking, Deadlocks & Production Concurrency",
    "difficulty": "Advanced",
    "targetQps": 50000,
    "targetLatencyMs": 3,
    "constraintN": "128 concurrent workers, zero duplicate job execution or lock convoys",
    "optimalComplexity": "O(log_B N + B_batch) non-blocking index scan",
    "description": "High-throughput transactional job queue built in SQL using SELECT ... FOR UPDATE SKIP LOCKED, partial B+Tree indexing on pending jobs, and bounded batch claiming.",
    "relatedSlugs": [
      "row-level-locks-for-update-skip-locked",
      "partial-filtered-expression-indexes",
      "dead-tuples-bloat-autovacuum-txid-wraparound",
      "queue-processing-skip-locked-patterns"
    ],
    "requirements": [
      "Claim batches atomically via UPDATE jobs SET status = 'RUNNING' WHERE id IN (SELECT id FROM jobs WHERE status = 'PENDING' AND run_at <= NOW() ORDER BY priority DESC, run_at ASC LIMIT 32 FOR UPDATE SKIP LOCKED) RETURNING *.",
      "Maintain a razor-thin partial B+Tree index: CREATE INDEX ON jobs (priority DESC, run_at ASC) WHERE status = 'PENDING'.",
      "Keep claim transactions under 2ms (never hold the row lock while calling external HTTP APIs!).",
      "Delete or partition completed jobs daily so dead MVCC tuples do not bloat the active queue table."
    ],
    "defaultInputs": {
      "dau": 4000000,
      "readsPerUser": 30,
      "writesPerUser": 20,
      "payloadBytes": 512,
      "cacheHitRatio": 94,
      "replicationFactor": 2,
      "retentionDays": 14
    },
    "frames": [
      {
        "id": "f-pool",
        "label": "1. Worker Pool & Multiplexer",
        "x": 40,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#3b82f6"
      },
      {
        "id": "f-queue",
        "label": "2. SKIP LOCKED Partial Index",
        "x": 330,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#10b981"
      },
      {
        "id": "f-vac",
        "label": "3. MVCC Vacuum & Dead-Letter",
        "x": 690,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#8b5cf6"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "Why SKIP LOCKED Wins",
        "text": "Without SKIP LOCKED, 128 workers serialize behind the same highest-priority row lock. SKIP LOCKED lets each worker grab the next unlocked tuple immediately.",
        "x": 40,
        "y": 410,
        "color": "#10b981"
      },
      {
        "id": "note-2",
        "title": "Aggressive Autovacuum",
        "text": "High-churn queue tables need autovacuum_vacuum_scale_factor = 0.01 so dead tuples are recycled into the Free Space Map continuously.",
        "x": 420,
        "y": 410,
        "color": "#8b5cf6"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "pgbouncer-conn-pool",
        "label": "PgBouncer Transaction Pool",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "bplustree-covering-index",
        "label": "Partial Index (status=PENDING)",
        "x": 395,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "mvcc-ssi-lock-manager",
        "label": "FOR UPDATE SKIP LOCKED",
        "x": 395,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "wal-aries-storage",
        "label": "Heap + Aggressive Autovacuum",
        "x": 735,
        "y": 175,
        "instances": 2
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "Scan Pending Priority Head"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "Skip Locked Row Tuples"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "Atomic UPDATE ... RETURNING"
      }
    ]
  },
  {
    "id": "multi-tenant-rls-sharding-architecture",
    "title": "Multi-Tenant SaaS Isolation: Row-Level Security (RLS) & Sharding",
    "subtitle": "Composite (tenant_id, ...) Keys + Session Context RLS + Consistent Hash Shard Router",
    "category": "Track 6 · Distributed SQL & Production DBRE",
    "difficulty": "Staff",
    "targetQps": 80000,
    "targetLatencyMs": 5,
    "constraintN": "50,000 tenants, 10^9 rows, strict zero cross-tenant data leakage",
    "optimalComplexity": "O(1) shard route + O(log_B N_tenant) local B+Tree lookup",
    "description": "Defense-in-depth multi-tenant database architecture combining session-scoped Row-Level Security (RLS), tenant-prefixed composite indexes, and horizontal shard routing.",
    "relatedSlugs": [
      "case-shopify-multi-tenant-schema",
      "sql-injection-parameterized-security",
      "horizontal-sharding-routing-keys",
      "connection-pooling-pgbouncer-proxies"
    ],
    "requirements": [
      "Include tenant_id as the leading column of every primary key, unique constraint, foreign key, and B+Tree index in shared-schema tables.",
      "Enforce database-level tenant isolation via CREATE POLICY tenant_isolation ON tbl USING (tenant_id = current_setting('app.tenant_id')::bigint).",
      "Set session context with SET LOCAL app.tenant_id = ... inside each transaction so PgBouncer transaction pooling never leaks tenant state across connections.",
      "Co-locate all tables for a given tenant_id on the same physical shard to execute multi-table joins and ACID transactions locally without 2PC."
    ],
    "defaultInputs": {
      "dau": 10000000,
      "readsPerUser": 45,
      "writesPerUser": 10,
      "payloadBytes": 512,
      "cacheHitRatio": 91,
      "replicationFactor": 3,
      "retentionDays": 180
    },
    "frames": [
      {
        "id": "f-route",
        "label": "1. Tenant Context & Shard Router",
        "x": 40,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#3b82f6"
      },
      {
        "id": "f-rls",
        "label": "2. RLS Policy & Local B+Tree",
        "x": 340,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#10b981"
      },
      {
        "id": "f-shard",
        "label": "3. Co-Located Raft Shard Storage",
        "x": 700,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#ec4899"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "SET LOCAL + PgBouncer Rule",
        "text": "Always use SET LOCAL app.tenant_id inside a transaction block; session-level SET leaks across pooled connections in transaction mode!",
        "x": 40,
        "y": 410,
        "color": "#ef4444"
      },
      {
        "id": "note-2",
        "title": "Shard Co-Location",
        "text": "Sharding orders and order_items by the same tenant_id executes joins inside a single node without cross-network scatter-gather.",
        "x": 420,
        "y": 410,
        "color": "#10b981"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "pgbouncer-conn-pool",
        "label": "Tenant Shard Router & Pool",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "sql-parser-rewriter",
        "label": "RLS Predicate Injector",
        "x": 400,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "bplustree-covering-index",
        "label": "Index on (tenant_id, id)",
        "x": 400,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "wal-aries-storage",
        "label": "Co-Located Tenant Shard",
        "x": 735,
        "y": 175,
        "instances": 3
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "SET LOCAL app.tenant_id"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "Append tenant_id = :tid"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "Local Shard Page Read"
      }
    ]
  },
  {
    "id": "jsonb-fulltext-hybrid-search",
    "title": "Hybrid Relational + JSONB Document + Full-Text Search Engine",
    "subtitle": "Core Relational Columns + JSONB Binary AST + GIN Inverted Posting Lists + BM25/ts_rank",
    "category": "Track 3 · Semi-Structured JSONB & Full-Text Search",
    "difficulty": "Intermediate",
    "targetQps": 45000,
    "targetLatencyMs": 6,
    "constraintN": "2×10^7 product documents with dynamic attributes and full-text search",
    "optimalComplexity": "O(log V + |posting_intersection|) GIN Bitmap Index Scan",
    "description": "Combines strict relational columns for core entities with indexed JSONB for sparse category attributes and tsvector GIN inverted indexes for sub-10ms lexical search.",
    "relatedSlugs": [
      "json-semi-structured-hybrid-schemas",
      "full-text-search-trigrams-inverted-index",
      "hash-gin-gist-brin-bloom-indexes",
      "schema-anti-patterns-eav-god-tables"
    ],
    "requirements": [
      "Keep stable high-cardinality foreign keys, prices, and timestamps as native typed relational columns; store sparse category-specific attributes in binary JSONB.",
      "Index frequent JSONB containment queries (@>) using GIN with jsonb_path_ops (smaller hashed path+value posting lists).",
      "Promote hot scalar JSONB attributes to stored generated columns with standard B+Tree indexes when range scans or sorting are required.",
      "Maintain a generated tsvector column indexed by GIN for stemmed, weighted full-text search without external sync lag."
    ],
    "defaultInputs": {
      "dau": 4500000,
      "readsPerUser": 35,
      "writesPerUser": 6,
      "payloadBytes": 800,
      "cacheHitRatio": 89,
      "replicationFactor": 2,
      "retentionDays": 120
    },
    "frames": [
      {
        "id": "f-query",
        "label": "1. Hybrid SQL + JSONPath Parser",
        "x": 40,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#3b82f6"
      },
      {
        "id": "f-gin",
        "label": "2. GIN Posting List & B+Tree Intersection",
        "x": 330,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#f59e0b"
      },
      {
        "id": "f-toast",
        "label": "3. Heap & TOAST Storage",
        "x": 690,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#10b981"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "jsonb_ops vs jsonb_path_ops",
        "text": "jsonb_path_ops hashes each path+value into a single 32-bit GIN key, cutting index size by ~50% and accelerating @> containment queries.",
        "x": 40,
        "y": 410,
        "color": "#f59e0b"
      },
      {
        "id": "note-2",
        "title": "GIN fastupdate Pending List",
        "text": "GIN buffers new index entries in an unsorted pending list and bulk-merges them on cleanup/autovacuum to avoid random B-Tree write stalls.",
        "x": 420,
        "y": 410,
        "color": "#10b981"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "sql-parser-rewriter",
        "label": "SQL + @> + @@ Query",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "gin-gist-brin-index",
        "label": "GIN (jsonb_path_ops + FTS)",
        "x": 395,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "bplustree-covering-index",
        "label": "B+Tree on Category & Price",
        "x": 395,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "buffer-pool-clock-sweep",
        "label": "BitmapAnd Heap Page Scan",
        "x": 735,
        "y": 175,
        "instances": 2
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "attrs @> ... AND fts @@ ..."
      },
      {
        "from": "n1",
        "to": "n3",
        "label": "price BETWEEN ..."
      },
      {
        "from": "n2",
        "to": "n4",
        "label": "TID Bitmap Stream"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "BitmapAnd Intersection"
      }
    ]
  },
  {
    "id": "hierarchical-graph-closure-rbac",
    "title": "Hierarchical Tree & RBAC Permission Engine (Adjacency vs Closure vs CTE)",
    "subtitle": "Recursive CTE Fixpoint vs Transitive Closure Table vs LTREE Materialized Path",
    "category": "Track 3 · Hierarchical, Temporal & Graph Modeling",
    "difficulty": "Advanced",
    "targetQps": 70000,
    "targetLatencyMs": 3,
    "constraintN": "10^6 folders/nodes, depth ≤ 25, < 3ms permission check SLA",
    "optimalComplexity": "O(1) indexed join on Closure Table or LTREE GiST/B-Tree",
    "description": "Architectural comparison and runtime blueprint for modeling trees and DAGs in SQL across read-heavy RBAC permission checks and subtree rollups.",
    "relatedSlugs": [
      "recursive-ctes-hierarchies",
      "graph-traversal-cycle-detection-sql",
      "case-recursive-org-permission-engine",
      "build-hierarchical-graph-query-engine"
    ],
    "requirements": [
      "Use Adjacency List (parent_id) + WITH RECURSIVE when subtree moves are frequent and tree depth is shallow (< 10 levels).",
      "Use a Closure Table (ancestor_id, descendant_id, depth) indexed on both directions when O(1) subtree aggregation and permission inheritance checks are required.",
      "Use Materialized Path (LTREE) with GiST/B+Tree prefix indexing when paths are stable and breadcrumb sorting is needed.",
      "Always include a visited-node array or path cycle guard in recursive CTEs over user-defined graphs."
    ],
    "defaultInputs": {
      "dau": 6000000,
      "readsPerUser": 55,
      "writesPerUser": 4,
      "payloadBytes": 256,
      "cacheHitRatio": 95,
      "replicationFactor": 2,
      "retentionDays": 180
    },
    "frames": [
      {
        "id": "f-req",
        "label": "1. Access Check & Graph Query",
        "x": 40,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#3b82f6"
      },
      {
        "id": "f-idx",
        "label": "2. Closure / LTREE / Recursive CTE",
        "x": 330,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#10b981"
      },
      {
        "id": "f-cache",
        "label": "3. Buffer Pool & ACL Store",
        "x": 690,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#8b5cf6"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "Closure Table Speedup",
        "text": "Checking if user has permission on any ancestor of folder X becomes a single indexed EXISTS join on folder_closure(descendant_id, ancestor_id).",
        "x": 40,
        "y": 410,
        "color": "#10b981"
      },
      {
        "id": "note-2",
        "title": "Cycle Guard Invariant",
        "text": "In WITH RECURSIVE over DAGs, track path_ids and filter WHERE next_id <> ALL(path_ids) to guarantee termination.",
        "x": 420,
        "y": 410,
        "color": "#3b82f6"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "sql-parser-rewriter",
        "label": "Hierarchy / RBAC Query",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "bplustree-covering-index",
        "label": "Closure Index (descendant, ancestor)",
        "x": 395,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "window-hash-agg-engine",
        "label": "WITH RECURSIVE Worktable",
        "x": 395,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "buffer-pool-clock-sweep",
        "label": "Pinned Hot Hierarchy Pages",
        "x": 735,
        "y": 175,
        "instances": 2
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "O(1) Ancestor Join"
      },
      {
        "from": "n1",
        "to": "n3",
        "label": "Dynamic Adjacency BFS/DFS"
      },
      {
        "from": "n2",
        "to": "n4",
        "label": "Index-Only Visibility Check"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "Iterative Fixpoint Scan"
      }
    ]
  },
  {
    "id": "time-series-declarative-partitioning",
    "title": "High-Ingestion Time-Series Partitioning & Retention Pipeline",
    "subtitle": "Declarative Range Partitions + Local B+Tree + BRIN Block Summaries + Instant DROP PARTITION",
    "category": "Track 6 · Production DBRE, Partitioning & Operations",
    "difficulty": "Advanced",
    "targetQps": 90000,
    "targetLatencyMs": 4,
    "constraintN": "2×10^9 telemetry rows/month, zero-bloat 90-day retention purge",
    "optimalComplexity": "O(1) partition drop + O(blocks_matched) BRIN scan",
    "description": "Scales high-velocity time-series ingestion in relational databases by keeping recent partition B+Trees entirely in RAM, indexing historical partitions with BRIN, and dropping expired partitions in O(1) metadata time.",
    "relatedSlugs": [
      "declarative-table-partitioning",
      "hash-gin-gist-brin-bloom-indexes",
      "dead-tuples-bloat-autovacuum-txid-wraparound",
      "backup-pitr-wal-archiving-drills"
    ],
    "requirements": [
      "Partition append-only time-series tables by time range (daily/weekly/monthly) so the active hot partition's B+Tree fits 100% inside shared_buffers.",
      "Always include the partition key (created_at) in WHERE predicates to enable static and runtime Partition Pruning.",
      "Use BRIN (Block Range Index) on monotonic timestamp columns (~1000× smaller than B+Tree) to prune 1MB physical heap ranges.",
      "Replace massive DELETE FROM events WHERE created_at < ... (which generates millions of dead MVCC tuples and WAL bloat) with ALTER TABLE DETACH / DROP PARTITION."
    ],
    "defaultInputs": {
      "dau": 9000000,
      "readsPerUser": 20,
      "writesPerUser": 30,
      "payloadBytes": 256,
      "cacheHitRatio": 93,
      "replicationFactor": 2,
      "retentionDays": 90
    },
    "frames": [
      {
        "id": "f-ingest",
        "label": "1. Batched COPY / Multi-Row Insert",
        "x": 40,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#3b82f6"
      },
      {
        "id": "f-part",
        "label": "2. Partition Pruning & BRIN/B+Tree",
        "x": 330,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#10b981"
      },
      {
        "id": "f-ret",
        "label": "3. O(1) Partition Detach & Archive",
        "x": 690,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#f59e0b"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "DROP PARTITION vs DELETE",
        "text": "DELETE on 100M rows writes 100M WAL tombstones and triggers hours of VACUUM I/O. DETACH + DROP PARTITION unlinks the file in 5ms.",
        "x": 40,
        "y": 410,
        "color": "#10b981"
      },
      {
        "id": "note-2",
        "title": "BRIN Size Advantage",
        "text": "On a 500GB append-only table ordered by created_at, a B+Tree index is ~12 GB while a BRIN index is ~15 MB with 99% block skipping.",
        "x": 420,
        "y": 410,
        "color": "#f59e0b"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "pgbouncer-conn-pool",
        "label": "Batched Ingestion Stream",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "cbo-join-planner",
        "label": "Partition Pruning Router",
        "x": 395,
        "y": 115,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "gin-gist-brin-index",
        "label": "BRIN + Hot Partition B+Tree",
        "x": 395,
        "y": 245,
        "instances": 2
      },
      {
        "id": "n4",
        "blockId": "wal-aries-storage",
        "label": "Time-Range Child Partitions",
        "x": 735,
        "y": 175,
        "instances": 2
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "Route by created_at"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "Prune Inactive Partitions"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "Append to Active Partition"
      }
    ]
  },
  {
    "id": "keyset-cursor-pagination-pipeline",
    "title": "Keyset (Seek) Pagination vs Deep OFFSET Scan Pipeline",
    "subtitle": "Deterministic (created_at, id) Seek Predicate + B+Tree Leaf Sibling Traversal",
    "category": "Track 6 · Production Query Optimization & Pagination",
    "difficulty": "Intermediate",
    "targetQps": 65000,
    "targetLatencyMs": 2,
    "constraintN": "10^8 feed items, page depth 50,000, target < 2ms p99",
    "optimalComplexity": "O(log_B N + K) constant-time B+Tree seek",
    "description": "Replaces O(OFFSET + LIMIT) linear row discarding with deterministic composite keyset seek cursors (WHERE (created_at, id) < (:ts, :id)) backed by a matching descending B+Tree index.",
    "relatedSlugs": [
      "keyset-cursor-pagination-vs-offset",
      "order-by-limit-offset-distinct",
      "composite-indexes-leftmost-prefix",
      "sorting-spill-to-disk-top-n-heapsort"
    ],
    "requirements": [
      "Always include a unique tie-breaker column (id) alongside non-unique sort columns (created_at) in both ORDER BY and the keyset seek predicate.",
      "Create a composite B+Tree index matching the exact sort direction: CREATE INDEX ON events (created_at DESC, id DESC).",
      "Encode the last row's (created_at, id) tuple as an opaque cursor token for the client."
    ],
    "defaultInputs": {
      "dau": 7000000,
      "readsPerUser": 45,
      "writesPerUser": 5,
      "payloadBytes": 384,
      "cacheHitRatio": 94,
      "replicationFactor": 2,
      "retentionDays": 90
    },
    "frames": [
      {
        "id": "f-req",
        "label": "1. Cursor Token & Seek Rewriter",
        "x": 40,
        "y": 50,
        "width": 250,
        "height": 340,
        "color": "#3b82f6"
      },
      {
        "id": "f-idx",
        "label": "2. B+Tree Descending Leaf Walk",
        "x": 330,
        "y": 50,
        "width": 320,
        "height": 340,
        "color": "#10b981"
      },
      {
        "id": "f-buf",
        "label": "3. Pinned Buffer Pool Pages",
        "x": 690,
        "y": 50,
        "width": 260,
        "height": 340,
        "color": "#8b5cf6"
      }
    ],
    "notes": [
      {
        "id": "note-1",
        "title": "Why OFFSET 1000000 Dies",
        "text": "OFFSET 1000000 LIMIT 20 forces the engine to read, visibility-check, and discard 1,000,000 rows before returning 20.",
        "x": 40,
        "y": 410,
        "color": "#ef4444"
      },
      {
        "id": "note-2",
        "title": "Row-Value Seek Equivalence",
        "text": "(a, b) < (:a, :b) expands to a < :a OR (a = :a AND b < :b), seeking directly to the exact B+Tree leaf entry.",
        "x": 420,
        "y": 410,
        "color": "#10b981"
      }
    ],
    "nodes": [
      {
        "id": "n1",
        "blockId": "sql-parser-rewriter",
        "label": "Keyset Cursor Decoder",
        "x": 80,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n2",
        "blockId": "bplustree-covering-index",
        "label": "B+Tree (created_at DESC, id DESC)",
        "x": 395,
        "y": 165,
        "instances": 2
      },
      {
        "id": "n3",
        "blockId": "buffer-pool-clock-sweep",
        "label": "Buffer Pool Leaf Fetch (20 rows)",
        "x": 735,
        "y": 165,
        "instances": 2
      }
    ],
    "connections": [
      {
        "from": "n1",
        "to": "n2",
        "label": "Seek (created_at, id) < (:ts, :id)"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "Read Next 20 Sibling Entries"
      }
    ]
  }
];

  function calculateCapacity(inputs, nodes) {
  var inp = inputs || {};
  var dau = Math.max(1000, Number(inp.dau) || 2000000);
  var readsPerUser = Math.max(1, Number(inp.readsPerUser) || 30);
  var writesPerUser = Math.max(1, Number(inp.writesPerUser) || 6);
  var payloadBytes = Math.max(64, Number(inp.payloadBytes) || 512);
  var cacheHitRatio = Math.min(99, Math.max(0, Number(inp.cacheHitRatio) || 88));
  var replicationFactor = Math.max(1, Number(inp.replicationFactor) || 2);
  var retentionDays = Math.max(1, Number(inp.retentionDays) || 90);

  var readQps = Math.round((dau * readsPerUser) / 86400);
  var writeQps = Math.round((dau * writesPerUser) / 86400);
  var totalQps = readQps + writeQps;
  var peakQps = Math.round(totalQps * 2.5);
  var cacheHitQps = Math.round(readQps * (cacheHitRatio / 100));
  var originReadQps = Math.max(1, readQps - cacheHitQps);
  var dbTotalQps = originReadQps + writeQps * replicationFactor;

  var ingressMbps = Number(((writeQps * payloadBytes * 8) / 1e6).toFixed(2));
  var egressMbps = Number(((readQps * payloadBytes * 8) / 1e6).toFixed(2));
  var dailyStorageGb = Number(((writeQps * 86400 * payloadBytes * replicationFactor) / 1e9).toFixed(2));
  var totalStorageTb = Number(((dailyStorageGb * retentionDays) / 1000).toFixed(2));
  var hotRamGb = Number(Math.max(1, (dailyStorageGb * 0.25)).toFixed(2));
  var computeCores = Math.max(2, Math.ceil(peakQps / 12000));

  var blockMap = {};
  for (var i = 0; i < BUILDING_BLOCKS.length; i++) {
    blockMap[BUILDING_BLOCKS[i].id] = BUILDING_BLOCKS[i];
    blockMap[BUILDING_BLOCKS[i].type] = BUILDING_BLOCKS[i];
  }

  var nodeList = Array.isArray(nodes) ? nodes : [];
  var totalLatency = 0.35;
  var totalMonthlyCost = 0;
  var bottlenecks = [];
  var nodeMetrics = {};

  for (var j = 0; j < nodeList.length; j++) {
    var n = nodeList[j];
    var block = blockMap[n.blockId || n.type] || BUILDING_BLOCKS[0];
    var inst = Math.max(1, Number(n.instances || n.replicas) || block.defaultInstances || 1);
    var cap = inst * (block.maxQpsPerInstance || 50000);
    var effectiveLoad = block.category === 'storage' ? dbTotalQps : totalQps;
    var util = Math.min(999, Math.round((effectiveLoad / Math.max(1, cap)) * 100));

    var nodeLat = block.baseLatencyMs * (util > 85 ? 1 + (util - 85) * 0.08 : 1);
    totalLatency += nodeLat;
    totalMonthlyCost += inst * (block.costPerInstanceMonthly || 40);

    nodeMetrics[n.id] = {
      capacityQps: cap,
      utilizationPct: util,
      latencyMs: Number(nodeLat.toFixed(2)),
      status: util > 95 ? 'overloaded' : (util > 75 ? 'warning' : 'healthy')
    };

    if (util > 85) {
      var compName = n.name || n.label || block.name;
      bottlenecks.push({
        nodeId: n.id,
        label: compName,
        component: compName,
        severity: util > 100 ? 'critical' : 'warning',
        title: util + '% Capacity Utilization (' + effectiveLoad.toLocaleString() + ' / ' + cap.toLocaleString() + ' QPS)',
        utilizationPct: util,
        message: 'Scale ' + compName + ' instances/shards or add a covering index / materialized view tier.',
        recommendation: 'Scale ' + compName + ' instances/shards or add a covering index / materialized view tier.'
      });
    }
  }

  var avgLatencyMs = Number(totalLatency.toFixed(2));
  return {
    readQps: readQps,
    writeQps: writeQps,
    totalQps: totalQps,
    peakQps: peakQps,
    dbTotalQps: dbTotalQps,
    cacheHitQps: cacheHitQps,
    ingressMbps: ingressMbps,
    egressMbps: egressMbps,
    cacheHitRatio: cacheHitRatio,
    originReadQps: originReadQps,
    dailyStorageGb: dailyStorageGb,
    yearlyStorageTb: totalStorageTb,
    totalStorageTb: totalStorageTb,
    hotRamGb: hotRamGb,
    computeCores: computeCores,
    avgLatencyMs: avgLatencyMs,
    estimatedP99Ms: avgLatencyMs,
    estimatedMonthlyCostUsd: Math.round(totalMonthlyCost),
    bottlenecks: bottlenecks,
    nodeMetrics: nodeMetrics
  };
}

  var WHITEBOARD_DATA = {
    version: '2.0.0',
    buildingBlocks: BUILDING_BLOCKS,
    blueprints: BLUEPRINTS,
    calculateCapacity: calculateCapacity
  };

  root.WHITEBOARD_DATA = WHITEBOARD_DATA;
  root.WHITEBOARD_BLUEPRINTS = BLUEPRINTS;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WHITEBOARD_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
