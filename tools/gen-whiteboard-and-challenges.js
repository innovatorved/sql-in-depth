#!/usr/bin/env node
'use strict';

/**
 * Generates data/whiteboard-blueprints.js and data/challenges.js for SQL In Depth
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

// ============================================================================
// 1. data/whiteboard-blueprints.js
// ============================================================================
const BUILDING_BLOCKS = [
  {
    id: 'pgbouncer-conn-pool',
    name: 'PgBouncer Transaction Pooler',
    category: 'edge',
    icon: 'globe',
    maxQpsPerInstance: 120000,
    baseLatencyMs: 0.25,
    costPerInstanceMonthly: 35,
    defaultInstances: 2,
    description: 'Multiplexes 10,000+ ephemeral application connections onto a bounded pool of active database backend processes (2–4× CPU cores).'
  },
  {
    id: 'sql-parser-rewriter',
    name: 'SQL Parser, Binder & View Rewriter',
    category: 'edge',
    icon: 'shield',
    maxQpsPerInstance: 95000,
    baseLatencyMs: 0.3,
    costPerInstanceMonthly: 30,
    defaultInstances: 2,
    description: 'Lexes and parses SQL into an AST, binds catalog OIDs, expands views/CTEs, and enforces Row-Level Security (RLS) policy predicates.'
  },
  {
    id: 'buffer-pool-clock-sweep',
    name: 'Shared Buffer Pool (8KB Slotted Pages)',
    category: 'cache',
    icon: 'zap',
    maxQpsPerInstance: 180000,
    baseLatencyMs: 0.15,
    costPerInstanceMonthly: 90,
    defaultInstances: 2,
    description: 'In-RAM 8KB page cache managed via Clock-Sweep / 2Q / LRU-K eviction with pin counts, dirty flags, and Visibility Map bits.'
  },
  {
    id: 'materialized-view-cache',
    name: 'Materialized View & Rollup Tier',
    category: 'cache',
    icon: 'layers',
    maxQpsPerInstance: 140000,
    baseLatencyMs: 0.4,
    costPerInstanceMonthly: 70,
    defaultInstances: 1,
    description: 'Pre-computed aggregate summary tables refreshed incrementally or via REFRESH MATERIALIZED VIEW CONCURRENTLY.'
  },
  {
    id: 'cbo-join-planner',
    name: 'Cost-Based Optimizer (System R / Cascades)',
    category: 'compute',
    icon: 'cpu',
    maxQpsPerInstance: 65000,
    baseLatencyMs: 0.9,
    costPerInstanceMonthly: 60,
    defaultInstances: 2,
    description: 'Uses MCV lists, equi-depth histograms, and NDV sketches to select between Nested Loop, Hash Join, and Sort-Merge Join.'
  },
  {
    id: 'window-hash-agg-engine',
    name: 'HashAggregate & Window Framing Kernel',
    category: 'compute',
    icon: 'activity',
    maxQpsPerInstance: 55000,
    baseLatencyMs: 1.8,
    costPerInstanceMonthly: 65,
    defaultInstances: 2,
    description: 'Executes GROUPING SETS, ROLLUP, recursive CTE fixpoints, and sliding ROWS/RANGE/GROUPS window frames with work_mem spill protection.'
  },
  {
    id: 'vectorized-simd-olap',
    name: 'Vectorized SIMD Columnar Engine (DuckDB/ClickHouse)',
    category: 'compute',
    icon: 'cpu',
    maxQpsPerInstance: 85000,
    baseLatencyMs: 1.4,
    costPerInstanceMonthly: 85,
    defaultInstances: 2,
    description: 'Processes 2048-tuple columnar batches in L1 cache with late materialization and SIMD predicate evaluation over dictionary/RLE codes.'
  },
  {
    id: 'mvcc-ssi-lock-manager',
    name: 'MVCC Snapshot & SSI Lock Manager',
    category: 'compute',
    icon: 'git-branch',
    maxQpsPerInstance: 90000,
    baseLatencyMs: 0.5,
    costPerInstanceMonthly: 55,
    defaultInstances: 2,
    description: 'Evaluates xmin/xmax tuple visibility against active snapshots, tracks SIREAD rw-antidependencies, and detects Wait-For Graph deadlocks.'
  },
  {
    id: 'bplustree-covering-index',
    name: 'B+Tree Composite & Covering Index (INCLUDE)',
    category: 'storage',
    icon: 'database',
    maxQpsPerInstance: 75000,
    baseLatencyMs: 1.1,
    costPerInstanceMonthly: 80,
    defaultInstances: 2,
    description: 'High-fanout (B=400) disk-oriented B+Tree supporting O(log_B N) point lookups, keyset range cursors, and Index-Only Scans.'
  },
  {
    id: 'gin-gist-brin-index',
    name: 'GIN Inverted / GiST Spatial / BRIN Zone Index',
    category: 'storage',
    icon: 'search',
    maxQpsPerInstance: 60000,
    baseLatencyMs: 1.5,
    costPerInstanceMonthly: 75,
    defaultInstances: 2,
    description: 'Specialized indexing tier: GIN posting lists for JSONB/FTS, GiST R-Trees for temporal exclusion constraints, and BRIN min/max summaries.'
  },
  {
    id: 'wal-aries-storage',
    name: 'Append-Only WAL & ARIES Durable Heap',
    category: 'storage',
    icon: 'database',
    maxQpsPerInstance: 50000,
    baseLatencyMs: 1.9,
    costPerInstanceMonthly: 110,
    defaultInstances: 2,
    description: 'Sequential Write-Ahead Log with Group Commit fsync, LSN page stamping, full-page writes, and background Checkpointer/Autovacuum.'
  },
  {
    id: 'outbox-cdc-streamer',
    name: 'Transactional Outbox & Debezium WAL CDC',
    category: 'messaging',
    icon: 'clock',
    maxQpsPerInstance: 100000,
    baseLatencyMs: 0.6,
    costPerInstanceMonthly: 45,
    defaultInstances: 2,
    description: 'Tails logical replication WAL slots to stream committed mutations and SKIP LOCKED job events downstream without dual-write races.'
  }
];

const BLUEPRINTS = [
  {
    id: 'sargable-composite-index-selector',
    title: 'B+Tree Indexing & SARGable Query Pipeline (10⁸ Rows)',
    subtitle: 'Leftmost-Prefix Rule + Equality→Range→Sort Ordering + INCLUDE Covering Scan',
    category: 'Track 4 · Storage Engines & Indexing Internals',
    difficulty: 'Intermediate',
    targetQps: 60000,
    targetLatencyMs: 4,
    constraintN: '10^8 rows (~80 GB heap), target < 4ms p99 point & range queries',
    optimalComplexity: 'O(log_B N + K/B) Index-Only Scan (3–4 page reads)',
    description: 'Interactive architecture blueprint for designing composite B+Tree indexes (Equality, Range, INCLUDE) and rewriting non-SARGable predicates so queries execute via Index-Only Scans with zero random heap fetches.',
    relatedSlugs: [
      'btree-bplustree-internal-anatomy',
      'composite-indexes-leftmost-prefix',
      'covering-indexes-index-only-scans',
      'sargability-functions-on-columns'
    ],
    requirements: [
      'Order composite B+Tree index keys strictly by Equality predicates first, Range/ORDER BY column second, and SELECT-only payload columns in INCLUDE (...).',
      'Rewrite expression-wrapped predicates (e.g., DATE(created_at) = \'2026-05-01\') into SARGable half-open intervals (created_at >= \'2026-05-01\' AND created_at < \'2026-05-02\').',
      'Use Partial Indexes (WHERE status = \'PENDING\') when querying a skewed minority subset (< 5% of rows) to shrink index footprint by 95%.',
      'Ensure Autovacuum maintains the Visibility Map (VM) so Index-Only Scans do not fall back to random heap page checks.'
    ],
    defaultInputs: { dau: 6000000, readsPerUser: 50, writesPerUser: 8, payloadBytes: 512, cacheHitRatio: 92, replicationFactor: 2, retentionDays: 90 },
    frames: [
      { id: 'f-parse', label: '1. SARGable Predicate Rewrite', x: 40, y: 50, width: 250, height: 340, color: '#3b82f6' },
      { id: 'f-index', label: '2. B+Tree & Buffer Pool Lookup', x: 330, y: 50, width: 320, height: 340, color: '#10b981' },
      { id: 'f-heap', label: '3. Visibility Map & Durable Heap', x: 690, y: 50, width: 260, height: 340, color: '#f59e0b' }
    ],
    notes: [
      { id: 'note-1', title: 'Leftmost-Prefix Invariant', text: 'An index on (tenant_id, status, created_at) accelerates tenant_id = ? AND status = ? ORDER BY created_at, avoiding an external sort.', x: 40, y: 410, color: '#10b981' },
      { id: 'note-2', title: 'Random Heap I/O Trap', text: 'Fetching 5,000 unclustered heap rows via an un-covered index triggers 5,000 random 8KB reads (~500ms on disk); INCLUDE eliminates heap access.', x: 420, y: 410, color: '#f59e0b' }
    ],
    nodes: [
      { id: 'n1', blockId: 'sql-parser-rewriter', label: 'SARGable Query Rewriter', x: 80, y: 160, instances: 2 },
      { id: 'n2', blockId: 'bplustree-covering-index', label: 'Composite Covering B+Tree', x: 390, y: 110, instances: 2 },
      { id: 'n3', blockId: 'buffer-pool-clock-sweep', label: 'Shared Buffer Pool + VM', x: 390, y: 245, instances: 2 },
      { id: 'n4', blockId: 'wal-aries-storage', label: '8KB Slotted Heap Pages', x: 730, y: 175, instances: 2 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'Seek [low_key, high_key)' },
      { from: 'n2', to: 'n3', label: 'Check Visibility Map Bit' },
      { from: 'n3', to: 'n4', label: 'Heap Fetch Only on VM Miss' }
    ]
  },
  {
    id: 'join-algorithm-optimizer-matrix',
    title: 'Cost-Based Join Algorithm Selection Matrix (NLJ vs Hash vs Merge)',
    subtitle: 'System R Dynamic Programming + MCV/Histogram Selectivity + Memory Spill Guardrails',
    category: 'Track 4 · Query Optimizer & Execution Plans',
    difficulty: 'Advanced',
    targetQps: 35000,
    targetLatencyMs: 8,
    constraintN: '|R| = 10^5, |S| = 10^7, work_mem = 64MB',
    optimalComplexity: 'O(|R| + |S|) Hash Join or O(|R| log |S|) Indexed NLJ',
    description: 'Decision blueprint illustrating how the Cost-Based Optimizer chooses between Indexed Nested Loop Join, Grace/In-Memory Hash Join, and Sort-Merge Join based on selectivity, sort order, and work_mem.',
    relatedSlugs: [
      'nested-loop-join-indexed-nlj',
      'hash-join-build-probe-grace',
      'sort-merge-join-zipper-mechanics',
      'reading-explain-and-explain-analyze'
    ],
    requirements: [
      'Use Indexed Nested Loop Join when the outer input is tiny (< 1,000 rows after filtering) and the inner table has a selective B+Tree index on the join key.',
      'Use Hash Join for large equi-joins when inputs are unsorted; always hash the smaller relation (build table) in work_mem and stream the larger relation (probe table).',
      'Use Sort-Merge Join when both inputs are already sorted by B+Tree indexes on the join key or when joining on non-equi range conditions with bounded sort cost.',
      'Create extended multivariate statistics (CREATE STATISTICS) on correlated columns so the planner does not underestimate row counts and pick a catastrophic Nested Loop.'
    ],
    defaultInputs: { dau: 3500000, readsPerUser: 40, writesPerUser: 6, payloadBytes: 768, cacheHitRatio: 88, replicationFactor: 2, retentionDays: 60 },
    frames: [
      { id: 'f-stats', label: '1. Catalog Statistics & Selectivity', x: 40, y: 50, width: 260, height: 340, color: '#06b6d4' },
      { id: 'f-plan', label: '2. Physical Join Operator Kernel', x: 340, y: 50, width: 320, height: 340, color: '#8b5cf6' },
      { id: 'f-io', label: '3. Index & Buffer Pool Access', x: 700, y: 50, width: 250, height: 340, color: '#10b981' }
    ],
    notes: [
      { id: 'note-1', title: 'Stale Statistics Trap', text: 'If ANALYZE has not run after a bulk load, est_rows = 1 tricks the optimizer into an O(N·M) Nested Loop Join across millions of rows.', x: 40, y: 410, color: '#ef4444' },
      { id: 'note-2', title: 'Multi-Batch Grace Hash Spill', text: 'When the Hash Join build table exceeds work_mem, it partitions into temp files on disk (Batches > 1 in EXPLAIN ANALYZE).', x: 420, y: 410, color: '#06b6d4' }
    ],
    nodes: [
      { id: 'n1', blockId: 'cbo-join-planner', label: 'System R / Cascades Planner', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'window-hash-agg-engine', label: 'In-Memory Hash / Merge Join', x: 400, y: 115, instances: 2 },
      { id: 'n3', blockId: 'bplustree-covering-index', label: 'Indexed Nested Loop Probe', x: 400, y: 245, instances: 2 },
      { id: 'n4', blockId: 'buffer-pool-clock-sweep', label: 'Buffer Pool & Temp Work_Mem', x: 735, y: 175, instances: 2 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'Large Unsorted Equi-Join' },
      { from: 'n1', to: 'n3', label: 'High Selectivity (< 0.5%)' },
      { from: 'n2', to: 'n4', label: 'Build Hash Table in RAM' },
      { from: 'n3', to: 'n4', label: 'B+Tree Inner Index Probes' }
    ]
  },
  {
    id: 'fanout-free-analytical-aggregation',
    title: 'Fanout-Free Multi-Table Aggregation & Window Pipeline',
    subtitle: 'Pre-Aggregated CTEs + Conditional FILTER + Shared Window Sort Optimization',
    category: 'Track 2 · Aggregations, CTEs & Window Functions',
    difficulty: 'Intermediate',
    targetQps: 25000,
    targetLatencyMs: 12,
    constraintN: '10^7 orders joined with 3×10^7 items and 2×10^7 shipments',
    optimalComplexity: 'O(|Orders| + |Items| + |Shipments|) single-pass pre-aggregation',
    description: 'Eliminates the 1:N:M Chasm/Fanout double-counting bug by pre-aggregating independent child tables in CTEs before joining to the parent grain, and consolidates window sorts.',
    relatedSlugs: [
      'join-fanout-chasm-traps',
      'conditional-aggregation-filter',
      'grouping-sets-rollup-cube',
      'window-frames-rows-range-groups'
    ],
    requirements: [
      'Never join two independent 1:N child tables (e.g., order_items and order_shipments) directly before computing SUM() or COUNT() without DISTINCT.',
      'Pre-aggregate each child table to the parent grain (GROUP BY order_id) inside separate CTEs or LATERAL subqueries prior to joining.',
      'Collapse multi-metric self-joins into a single scan using COUNT(*) FILTER (WHERE ...) and SUM(CASE WHEN ...).',
      'Align PARTITION BY and ORDER BY clauses across window functions so the execution engine performs a single sort pass.'
    ],
    defaultInputs: { dau: 2500000, readsPerUser: 30, writesPerUser: 5, payloadBytes: 640, cacheHitRatio: 85, replicationFactor: 2, retentionDays: 180 },
    frames: [
      { id: 'f-cte', label: '1. Grain-Aligned Pre-Aggregation', x: 40, y: 50, width: 260, height: 340, color: '#3b82f6' },
      { id: 'f-win', label: '2. Rollup & Window Framing', x: 340, y: 50, width: 320, height: 340, color: '#10b981' },
      { id: 'f-mat', label: '3. KPI Serving & Caching', x: 700, y: 50, width: 250, height: 340, color: '#8b5cf6' }
    ],
    notes: [
      { id: 'note-1', title: 'Chasm Trap Multiplication', text: 'An order with 4 line items and 2 shipments produces 4 × 2 = 8 join rows, inflating SUM(item_price) by 2× and SUM(shipping_cost) by 4×.', x: 40, y: 410, color: '#ef4444' },
      { id: 'note-2', title: 'Default Window Frame Rule', text: 'OVER (PARTITION BY dept ORDER BY salary) defaults to RANGE UNBOUNDED PRECEDING, merging peer ties! Use ROWS for physical offsets.', x: 420, y: 410, color: '#3b82f6' }
    ],
    nodes: [
      { id: 'n1', blockId: 'sql-parser-rewriter', label: 'Pre-Aggregated Child CTEs', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'cbo-join-planner', label: '1:1 Grain-Aligned Hash Join', x: 400, y: 115, instances: 2 },
      { id: 'n3', blockId: 'window-hash-agg-engine', label: 'FILTER + Shared WindowSort', x: 400, y: 245, instances: 2 },
      { id: 'n4', blockId: 'materialized-view-cache', label: 'Executive KPI Materialized View', x: 735, y: 175, instances: 1 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: '1 Row per order_id' },
      { from: 'n2', to: 'n3', label: 'Zero Fanout Stream' },
      { from: 'n3', to: 'n4', label: 'Incremental Refresh' }
    ]
  },
  {
    id: 'mvcc-high-concurrency-ledger',
    title: 'High-Concurrency Double-Entry Ledger & Write-Skew Defense',
    subtitle: 'Immutable Journal Entries + Pessimistic Lock Ordering + Serializable Snapshot Isolation',
    category: 'Track 5 · Transactions, MVCC & Concurrency Control',
    difficulty: 'Staff',
    targetQps: 45000,
    targetLatencyMs: 6,
    constraintN: '50,000 TPS ledger transfers, zero negative balances or lost updates',
    optimalComplexity: 'O(log_B N) deterministic row locking + 1 Group-Commit WAL flush',
    description: 'Production financial ledger architecture combining immutable double-entry postings, deterministic account_id lock ordering to prevent deadlocks, and idempotency keys.',
    relatedSlugs: [
      'case-stripe-ledger-precision',
      'serializable-2pl-vs-ssi',
      'deadlocks-wait-for-graphs-detection',
      'optimistic-vs-pessimistic-concurrency'
    ],
    requirements: [
      'Enforce zero-sum double-entry invariants: every transfer inserts two immutable ledger_entries (debit + credit) summing to zero in exact integer cents or NUMERIC.',
      'Prevent Lost Updates and Write Skew on account balance checks using SELECT ... FOR UPDATE or atomic UPDATE accounts SET balance = balance - :amt WHERE id = :id AND balance >= :amt.',
      'Acquire row locks in canonical ascending order (ORDER BY account_id ASC FOR UPDATE) across multi-account transfers to make Wait-For Graph cycles mathematically impossible.',
      'Enforce idempotency via UNIQUE (merchant_id, idempotency_key) with ON CONFLICT DO NOTHING RETURNING.'
    ],
    defaultInputs: { dau: 5000000, readsPerUser: 25, writesPerUser: 15, payloadBytes: 384, cacheHitRatio: 90, replicationFactor: 3, retentionDays: 365 },
    frames: [
      { id: 'f-edge', label: '1. Idempotency & Pool Ingress', x: 40, y: 50, width: 250, height: 340, color: '#3b82f6' },
      { id: 'f-txn', label: '2. MVCC & Ordered Row Locking', x: 330, y: 50, width: 320, height: 340, color: '#8b5cf6' },
      { id: 'f-wal', label: '3. Group Commit WAL & Outbox', x: 690, y: 50, width: 260, height: 340, color: '#10b981' }
    ],
    notes: [
      { id: 'note-1', title: 'Canonical Lock Ordering', text: 'If Txn A transfers 10→20 and Txn B transfers 20→10, locking min(id) then max(id) eliminates AB-BA deadlocks completely.', x: 40, y: 410, color: '#8b5cf6' },
      { id: 'note-2', title: 'Snapshot Isolation Trap', text: 'REPEATABLE READ alone allows two concurrent withdrawals to pass a SELECT balance check and overdraw the account unless FOR UPDATE or SERIALIZABLE is used.', x: 420, y: 410, color: '#ef4444' }
    ],
    nodes: [
      { id: 'n1', blockId: 'pgbouncer-conn-pool', label: 'PgBouncer + Idempotency Gate', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'mvcc-ssi-lock-manager', label: 'Ordered FOR UPDATE / SSI', x: 395, y: 115, instances: 2 },
      { id: 'n3', blockId: 'bplustree-covering-index', label: 'Account PK & Ledger Index', x: 395, y: 245, instances: 2 },
      { id: 'n4', blockId: 'wal-aries-storage', label: 'Group-Commit WAL & Heap', x: 735, y: 115, instances: 2 },
      { id: 'n5', blockId: 'outbox-cdc-streamer', label: 'Transactional Outbox CDC', x: 735, y: 245, instances: 2 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'BEGIN + Lock Sorted IDs' },
      { from: 'n2', to: 'n3', label: 'Verify Balance & Post Entries' },
      { from: 'n3', to: 'n4', label: 'Single Batched WAL fsync' },
      { from: 'n4', to: 'n5', label: 'Stream Committed Ledger Event' }
    ]
  },
  {
    id: 'kimball-star-schema-lakehouse',
    title: 'Kimball Star Schema & Vectorized Columnar Lakehouse',
    subtitle: 'Surrogate Keys + SCD Type 2 As-Of Joins + Parquet Zone-Map Pruning + SIMD Execution',
    category: 'Track 6 · Columnar OLAP & Lakehouse Internals',
    difficulty: 'Advanced',
    targetQps: 40000,
    targetLatencyMs: 15,
    constraintN: '10^10 fact rows in Parquet/Iceberg, sub-second analytical aggregations',
    optimalComplexity: 'O(|RowGroups_matched| × VectorBatch) SIMD scan',
    description: 'End-to-end analytical warehouse architecture combining Kimball conformed dimensions, SCD Type 2 historical tracking, Parquet PAX row-group zone maps, and SIMD vectorized execution.',
    relatedSlugs: [
      'star-schema-facts-dimensions',
      'slowly-changing-dimensions-scd',
      'columnar-storage-layout-parquet',
      'late-materialization-simd-vectorization'
    ],
    requirements: [
      'Model facts at a strict atomic grain using compact integer surrogate keys referencing conformed dimension tables.',
      'Track historical dimension changes with SCD Type 2 ([effective_from, effective_to), is_current) to support point-in-time attribution.',
      'Sort Parquet files by primary filter columns (e.g., event_date, tenant_id) to maximize Min/Max Zone-Map row-group skipping and RLE compression.',
      'Execute filters directly on dictionary-encoded column vectors in 2048-row batches using late materialization.'
    ],
    defaultInputs: { dau: 8000000, readsPerUser: 20, writesPerUser: 5, payloadBytes: 1024, cacheHitRatio: 86, replicationFactor: 2, retentionDays: 365 },
    frames: [
      { id: 'f-ingest', label: '1. CDC & SCD Type 2 Staging', x: 40, y: 50, width: 250, height: 340, color: '#06b6d4' },
      { id: 'f-store', label: '2. Parquet / Iceberg Storage', x: 330, y: 50, width: 320, height: 340, color: '#f59e0b' },
      { id: 'f-simd', label: '3. Vectorized SIMD Query Engine', x: 690, y: 50, width: 260, height: 340, color: '#10b981' }
    ],
    notes: [
      { id: 'note-1', title: 'Zone Map Clustering', text: 'Sorting Parquet row groups by event_date lets the engine skip 99% of row groups on a 7-day query using footer min/max statistics alone.', x: 40, y: 410, color: '#f59e0b' },
      { id: 'note-2', title: 'Late Materialization', text: 'Evaluate WHERE predicates on compressed 1-byte dictionary codes first; reconstruct wide VARCHAR columns only for surviving rows.', x: 420, y: 410, color: '#10b981' }
    ],
    nodes: [
      { id: 'n1', blockId: 'outbox-cdc-streamer', label: 'CDC Stream & SCD2 Upsert', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'gin-gist-brin-index', label: 'Parquet Zone Maps & Bloom', x: 395, y: 115, instances: 2 },
      { id: 'n3', blockId: 'materialized-view-cache', label: 'Conformed Star Dimensions', x: 395, y: 245, instances: 2 },
      { id: 'n4', blockId: 'vectorized-simd-olap', label: 'Vectorized SIMD Scan + Join', x: 735, y: 175, instances: 2 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'Write Sorted 128MB Row Groups' },
      { from: 'n2', to: 'n4', label: 'Pruned Column Chunks' },
      { from: 'n3', to: 'n4', label: 'Broadcast Dimension Hash Table' }
    ]
  },
  {
    id: 'skip-locked-relational-job-queue',
    title: '50,000 Jobs/Sec Relational Task Queue (FOR UPDATE SKIP LOCKED)',
    subtitle: 'Partial Pending Index + Lock-Free Worker Claiming + HOT Update / Partitioned Archive',
    category: 'Track 5 · Locking, Deadlocks & Production Concurrency',
    difficulty: 'Advanced',
    targetQps: 50000,
    targetLatencyMs: 3,
    constraintN: '128 concurrent workers, zero duplicate job execution or lock convoys',
    optimalComplexity: 'O(log_B N + B_batch) non-blocking index scan',
    description: 'High-throughput transactional job queue built in SQL using SELECT ... FOR UPDATE SKIP LOCKED, partial B+Tree indexing on pending jobs, and bounded batch claiming.',
    relatedSlugs: [
      'row-level-locks-for-update-skip-locked',
      'partial-filtered-expression-indexes',
      'dead-tuples-bloat-autovacuum-txid-wraparound',
      'queue-processing-skip-locked-patterns'
    ],
    requirements: [
      'Claim batches atomically via UPDATE jobs SET status = \'RUNNING\' WHERE id IN (SELECT id FROM jobs WHERE status = \'PENDING\' AND run_at <= NOW() ORDER BY priority DESC, run_at ASC LIMIT 32 FOR UPDATE SKIP LOCKED) RETURNING *.',
      'Maintain a razor-thin partial B+Tree index: CREATE INDEX ON jobs (priority DESC, run_at ASC) WHERE status = \'PENDING\'.',
      'Keep claim transactions under 2ms (never hold the row lock while calling external HTTP APIs!).',
      'Delete or partition completed jobs daily so dead MVCC tuples do not bloat the active queue table.'
    ],
    defaultInputs: { dau: 4000000, readsPerUser: 30, writesPerUser: 20, payloadBytes: 512, cacheHitRatio: 94, replicationFactor: 2, retentionDays: 14 },
    frames: [
      { id: 'f-pool', label: '1. Worker Pool & Multiplexer', x: 40, y: 50, width: 250, height: 340, color: '#3b82f6' },
      { id: 'f-queue', label: '2. SKIP LOCKED Partial Index', x: 330, y: 50, width: 320, height: 340, color: '#10b981' },
      { id: 'f-vac', label: '3. MVCC Vacuum & Dead-Letter', x: 690, y: 50, width: 260, height: 340, color: '#8b5cf6' }
    ],
    notes: [
      { id: 'note-1', title: 'Why SKIP LOCKED Wins', text: 'Without SKIP LOCKED, 128 workers serialize behind the same highest-priority row lock. SKIP LOCKED lets each worker grab the next unlocked tuple immediately.', x: 40, y: 410, color: '#10b981' },
      { id: 'note-2', title: 'Aggressive Autovacuum', text: 'High-churn queue tables need autovacuum_vacuum_scale_factor = 0.01 so dead tuples are recycled into the Free Space Map continuously.', x: 420, y: 410, color: '#8b5cf6' }
    ],
    nodes: [
      { id: 'n1', blockId: 'pgbouncer-conn-pool', label: 'PgBouncer Transaction Pool', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'bplustree-covering-index', label: 'Partial Index (status=PENDING)', x: 395, y: 115, instances: 2 },
      { id: 'n3', blockId: 'mvcc-ssi-lock-manager', label: 'FOR UPDATE SKIP LOCKED', x: 395, y: 245, instances: 2 },
      { id: 'n4', blockId: 'wal-aries-storage', label: 'Heap + Aggressive Autovacuum', x: 735, y: 175, instances: 2 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'Scan Pending Priority Head' },
      { from: 'n2', to: 'n3', label: 'Skip Locked Row Tuples' },
      { from: 'n3', to: 'n4', label: 'Atomic UPDATE ... RETURNING' }
    ]
  },
  {
    id: 'multi-tenant-rls-sharding-architecture',
    title: 'Multi-Tenant SaaS Isolation: Row-Level Security (RLS) & Sharding',
    subtitle: 'Composite (tenant_id, ...) Keys + Session Context RLS + Consistent Hash Shard Router',
    category: 'Track 6 · Distributed SQL & Production DBRE',
    difficulty: 'Staff',
    targetQps: 80000,
    targetLatencyMs: 5,
    constraintN: '50,000 tenants, 10^9 rows, strict zero cross-tenant data leakage',
    optimalComplexity: 'O(1) shard route + O(log_B N_tenant) local B+Tree lookup',
    description: 'Defense-in-depth multi-tenant database architecture combining session-scoped Row-Level Security (RLS), tenant-prefixed composite indexes, and horizontal shard routing.',
    relatedSlugs: [
      'case-shopify-multi-tenant-schema',
      'sql-injection-parameterized-security',
      'horizontal-sharding-routing-keys',
      'connection-pooling-pgbouncer-proxies'
    ],
    requirements: [
      'Include tenant_id as the leading column of every primary key, unique constraint, foreign key, and B+Tree index in shared-schema tables.',
      'Enforce database-level tenant isolation via CREATE POLICY tenant_isolation ON tbl USING (tenant_id = current_setting(\'app.tenant_id\')::bigint).',
      'Set session context with SET LOCAL app.tenant_id = ... inside each transaction so PgBouncer transaction pooling never leaks tenant state across connections.',
      'Co-locate all tables for a given tenant_id on the same physical shard to execute multi-table joins and ACID transactions locally without 2PC.'
    ],
    defaultInputs: { dau: 10000000, readsPerUser: 45, writesPerUser: 10, payloadBytes: 512, cacheHitRatio: 91, replicationFactor: 3, retentionDays: 180 },
    frames: [
      { id: 'f-route', label: '1. Tenant Context & Shard Router', x: 40, y: 50, width: 260, height: 340, color: '#3b82f6' },
      { id: 'f-rls', label: '2. RLS Policy & Local B+Tree', x: 340, y: 50, width: 320, height: 340, color: '#10b981' },
      { id: 'f-shard', label: '3. Co-Located Raft Shard Storage', x: 700, y: 50, width: 250, height: 340, color: '#ec4899' }
    ],
    notes: [
      { id: 'note-1', title: 'SET LOCAL + PgBouncer Rule', text: 'Always use SET LOCAL app.tenant_id inside a transaction block; session-level SET leaks across pooled connections in transaction mode!', x: 40, y: 410, color: '#ef4444' },
      { id: 'note-2', title: 'Shard Co-Location', text: 'Sharding orders and order_items by the same tenant_id executes joins inside a single node without cross-network scatter-gather.', x: 420, y: 410, color: '#10b981' }
    ],
    nodes: [
      { id: 'n1', blockId: 'pgbouncer-conn-pool', label: 'Tenant Shard Router & Pool', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'sql-parser-rewriter', label: 'RLS Predicate Injector', x: 400, y: 115, instances: 2 },
      { id: 'n3', blockId: 'bplustree-covering-index', label: 'Index on (tenant_id, id)', x: 400, y: 245, instances: 2 },
      { id: 'n4', blockId: 'wal-aries-storage', label: 'Co-Located Tenant Shard', x: 735, y: 175, instances: 3 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'SET LOCAL app.tenant_id' },
      { from: 'n2', to: 'n3', label: 'Append tenant_id = :tid' },
      { from: 'n3', to: 'n4', label: 'Local Shard Page Read' }
    ]
  },
  {
    id: 'jsonb-fulltext-hybrid-search',
    title: 'Hybrid Relational + JSONB Document + Full-Text Search Engine',
    subtitle: 'Core Relational Columns + JSONB Binary AST + GIN Inverted Posting Lists + BM25/ts_rank',
    category: 'Track 3 · Semi-Structured JSONB & Full-Text Search',
    difficulty: 'Intermediate',
    targetQps: 45000,
    targetLatencyMs: 6,
    constraintN: '2×10^7 product documents with dynamic attributes and full-text search',
    optimalComplexity: 'O(log V + |posting_intersection|) GIN Bitmap Index Scan',
    description: 'Combines strict relational columns for core entities with indexed JSONB for sparse category attributes and tsvector GIN inverted indexes for sub-10ms lexical search.',
    relatedSlugs: [
      'json-semi-structured-hybrid-schemas',
      'full-text-search-trigrams-inverted-index',
      'hash-gin-gist-brin-bloom-indexes',
      'schema-anti-patterns-eav-god-tables'
    ],
    requirements: [
      'Keep stable high-cardinality foreign keys, prices, and timestamps as native typed relational columns; store sparse category-specific attributes in binary JSONB.',
      'Index frequent JSONB containment queries (@>) using GIN with jsonb_path_ops (smaller hashed path+value posting lists).',
      'Promote hot scalar JSONB attributes to stored generated columns with standard B+Tree indexes when range scans or sorting are required.',
      'Maintain a generated tsvector column indexed by GIN for stemmed, weighted full-text search without external sync lag.'
    ],
    defaultInputs: { dau: 4500000, readsPerUser: 35, writesPerUser: 6, payloadBytes: 800, cacheHitRatio: 89, replicationFactor: 2, retentionDays: 120 },
    frames: [
      { id: 'f-query', label: '1. Hybrid SQL + JSONPath Parser', x: 40, y: 50, width: 250, height: 340, color: '#3b82f6' },
      { id: 'f-gin', label: '2. GIN Posting List & B+Tree Intersection', x: 330, y: 50, width: 320, height: 340, color: '#f59e0b' },
      { id: 'f-toast', label: '3. Heap & TOAST Storage', x: 690, y: 50, width: 260, height: 340, color: '#10b981' }
    ],
    notes: [
      { id: 'note-1', title: 'jsonb_ops vs jsonb_path_ops', text: 'jsonb_path_ops hashes each path+value into a single 32-bit GIN key, cutting index size by ~50% and accelerating @> containment queries.', x: 40, y: 410, color: '#f59e0b' },
      { id: 'note-2', title: 'GIN fastupdate Pending List', text: 'GIN buffers new index entries in an unsorted pending list and bulk-merges them on cleanup/autovacuum to avoid random B-Tree write stalls.', x: 420, y: 410, color: '#10b981' }
    ],
    nodes: [
      { id: 'n1', blockId: 'sql-parser-rewriter', label: 'SQL + @> + @@ Query', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'gin-gist-brin-index', label: 'GIN (jsonb_path_ops + FTS)', x: 395, y: 115, instances: 2 },
      { id: 'n3', blockId: 'bplustree-covering-index', label: 'B+Tree on Category & Price', x: 395, y: 245, instances: 2 },
      { id: 'n4', blockId: 'buffer-pool-clock-sweep', label: 'BitmapAnd Heap Page Scan', x: 735, y: 175, instances: 2 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'attrs @> ... AND fts @@ ...' },
      { from: 'n1', to: 'n3', label: 'price BETWEEN ...' },
      { from: 'n2', to: 'n4', label: 'TID Bitmap Stream' },
      { from: 'n3', to: 'n4', label: 'BitmapAnd Intersection' }
    ]
  },
  {
    id: 'hierarchical-graph-closure-rbac',
    title: 'Hierarchical Tree & RBAC Permission Engine (Adjacency vs Closure vs CTE)',
    subtitle: 'Recursive CTE Fixpoint vs Transitive Closure Table vs LTREE Materialized Path',
    category: 'Track 3 · Hierarchical, Temporal & Graph Modeling',
    difficulty: 'Advanced',
    targetQps: 70000,
    targetLatencyMs: 3,
    constraintN: '10^6 folders/nodes, depth ≤ 25, < 3ms permission check SLA',
    optimalComplexity: 'O(1) indexed join on Closure Table or LTREE GiST/B-Tree',
    description: 'Architectural comparison and runtime blueprint for modeling trees and DAGs in SQL across read-heavy RBAC permission checks and subtree rollups.',
    relatedSlugs: [
      'recursive-ctes-hierarchies',
      'graph-traversal-cycle-detection-sql',
      'case-recursive-org-permission-engine',
      'build-hierarchical-graph-query-engine'
    ],
    requirements: [
      'Use Adjacency List (parent_id) + WITH RECURSIVE when subtree moves are frequent and tree depth is shallow (< 10 levels).',
      'Use a Closure Table (ancestor_id, descendant_id, depth) indexed on both directions when O(1) subtree aggregation and permission inheritance checks are required.',
      'Use Materialized Path (LTREE) with GiST/B+Tree prefix indexing when paths are stable and breadcrumb sorting is needed.',
      'Always include a visited-node array or path cycle guard in recursive CTEs over user-defined graphs.'
    ],
    defaultInputs: { dau: 6000000, readsPerUser: 55, writesPerUser: 4, payloadBytes: 256, cacheHitRatio: 95, replicationFactor: 2, retentionDays: 180 },
    frames: [
      { id: 'f-req', label: '1. Access Check & Graph Query', x: 40, y: 50, width: 250, height: 340, color: '#3b82f6' },
      { id: 'f-idx', label: '2. Closure / LTREE / Recursive CTE', x: 330, y: 50, width: 320, height: 340, color: '#10b981' },
      { id: 'f-cache', label: '3. Buffer Pool & ACL Store', x: 690, y: 50, width: 260, height: 340, color: '#8b5cf6' }
    ],
    notes: [
      { id: 'note-1', title: 'Closure Table Speedup', text: 'Checking if user has permission on any ancestor of folder X becomes a single indexed EXISTS join on folder_closure(descendant_id, ancestor_id).', x: 40, y: 410, color: '#10b981' },
      { id: 'note-2', title: 'Cycle Guard Invariant', text: 'In WITH RECURSIVE over DAGs, track path_ids and filter WHERE next_id <> ALL(path_ids) to guarantee termination.', x: 420, y: 410, color: '#3b82f6' }
    ],
    nodes: [
      { id: 'n1', blockId: 'sql-parser-rewriter', label: 'Hierarchy / RBAC Query', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'bplustree-covering-index', label: 'Closure Index (descendant, ancestor)', x: 395, y: 115, instances: 2 },
      { id: 'n3', blockId: 'window-hash-agg-engine', label: 'WITH RECURSIVE Worktable', x: 395, y: 245, instances: 2 },
      { id: 'n4', blockId: 'buffer-pool-clock-sweep', label: 'Pinned Hot Hierarchy Pages', x: 735, y: 175, instances: 2 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'O(1) Ancestor Join' },
      { from: 'n1', to: 'n3', label: 'Dynamic Adjacency BFS/DFS' },
      { from: 'n2', to: 'n4', label: 'Index-Only Visibility Check' },
      { from: 'n3', to: 'n4', label: 'Iterative Fixpoint Scan' }
    ]
  },
  {
    id: 'time-series-declarative-partitioning',
    title: 'High-Ingestion Time-Series Partitioning & Retention Pipeline',
    subtitle: 'Declarative Range Partitions + Local B+Tree + BRIN Block Summaries + Instant DROP PARTITION',
    category: 'Track 6 · Production DBRE, Partitioning & Operations',
    difficulty: 'Advanced',
    targetQps: 90000,
    targetLatencyMs: 4,
    constraintN: '2×10^9 telemetry rows/month, zero-bloat 90-day retention purge',
    optimalComplexity: 'O(1) partition drop + O(blocks_matched) BRIN scan',
    description: 'Scales high-velocity time-series ingestion in relational databases by keeping recent partition B+Trees entirely in RAM, indexing historical partitions with BRIN, and dropping expired partitions in O(1) metadata time.',
    relatedSlugs: [
      'declarative-table-partitioning',
      'hash-gin-gist-brin-bloom-indexes',
      'dead-tuples-bloat-autovacuum-txid-wraparound',
      'backup-pitr-wal-archiving-drills'
    ],
    requirements: [
      'Partition append-only time-series tables by time range (daily/weekly/monthly) so the active hot partition\'s B+Tree fits 100% inside shared_buffers.',
      'Always include the partition key (created_at) in WHERE predicates to enable static and runtime Partition Pruning.',
      'Use BRIN (Block Range Index) on monotonic timestamp columns (~1000× smaller than B+Tree) to prune 1MB physical heap ranges.',
      'Replace massive DELETE FROM events WHERE created_at < ... (which generates millions of dead MVCC tuples and WAL bloat) with ALTER TABLE DETACH / DROP PARTITION.'
    ],
    defaultInputs: { dau: 9000000, readsPerUser: 20, writesPerUser: 30, payloadBytes: 256, cacheHitRatio: 93, replicationFactor: 2, retentionDays: 90 },
    frames: [
      { id: 'f-ingest', label: '1. Batched COPY / Multi-Row Insert', x: 40, y: 50, width: 250, height: 340, color: '#3b82f6' },
      { id: 'f-part', label: '2. Partition Pruning & BRIN/B+Tree', x: 330, y: 50, width: 320, height: 340, color: '#10b981' },
      { id: 'f-ret', label: '3. O(1) Partition Detach & Archive', x: 690, y: 50, width: 260, height: 340, color: '#f59e0b' }
    ],
    notes: [
      { id: 'note-1', title: 'DROP PARTITION vs DELETE', text: 'DELETE on 100M rows writes 100M WAL tombstones and triggers hours of VACUUM I/O. DETACH + DROP PARTITION unlinks the file in 5ms.', x: 40, y: 410, color: '#10b981' },
      { id: 'note-2', title: 'BRIN Size Advantage', text: 'On a 500GB append-only table ordered by created_at, a B+Tree index is ~12 GB while a BRIN index is ~15 MB with 99% block skipping.', x: 420, y: 410, color: '#f59e0b' }
    ],
    nodes: [
      { id: 'n1', blockId: 'pgbouncer-conn-pool', label: 'Batched Ingestion Stream', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'cbo-join-planner', label: 'Partition Pruning Router', x: 395, y: 115, instances: 2 },
      { id: 'n3', blockId: 'gin-gist-brin-index', label: 'BRIN + Hot Partition B+Tree', x: 395, y: 245, instances: 2 },
      { id: 'n4', blockId: 'wal-aries-storage', label: 'Time-Range Child Partitions', x: 735, y: 175, instances: 2 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'Route by created_at' },
      { from: 'n2', to: 'n3', label: 'Prune Inactive Partitions' },
      { from: 'n3', to: 'n4', label: 'Append to Active Partition' }
    ]
  },
  {
    id: 'keyset-cursor-pagination-pipeline',
    title: 'Keyset (Seek) Pagination vs Deep OFFSET Scan Pipeline',
    subtitle: 'Deterministic (created_at, id) Seek Predicate + B+Tree Leaf Sibling Traversal',
    category: 'Track 6 · Production Query Optimization & Pagination',
    difficulty: 'Intermediate',
    targetQps: 65000,
    targetLatencyMs: 2,
    constraintN: '10^8 feed items, page depth 50,000, target < 2ms p99',
    optimalComplexity: 'O(log_B N + K) constant-time B+Tree seek',
    description: 'Replaces O(OFFSET + LIMIT) linear row discarding with deterministic composite keyset seek cursors (WHERE (created_at, id) < (:ts, :id)) backed by a matching descending B+Tree index.',
    relatedSlugs: [
      'keyset-cursor-pagination-vs-offset',
      'order-by-limit-offset-distinct',
      'composite-indexes-leftmost-prefix',
      'sorting-spill-to-disk-top-n-heapsort'
    ],
    requirements: [
      'Always include a unique tie-breaker column (id) alongside non-unique sort columns (created_at) in both ORDER BY and the keyset seek predicate.',
      'Create a composite B+Tree index matching the exact sort direction: CREATE INDEX ON events (created_at DESC, id DESC).',
      'Encode the last row\'s (created_at, id) tuple as an opaque cursor token for the client.'
    ],
    defaultInputs: { dau: 7000000, readsPerUser: 45, writesPerUser: 5, payloadBytes: 384, cacheHitRatio: 94, replicationFactor: 2, retentionDays: 90 },
    frames: [
      { id: 'f-req', label: '1. Cursor Token & Seek Rewriter', x: 40, y: 50, width: 250, height: 340, color: '#3b82f6' },
      { id: 'f-idx', label: '2. B+Tree Descending Leaf Walk', x: 330, y: 50, width: 320, height: 340, color: '#10b981' },
      { id: 'f-buf', label: '3. Pinned Buffer Pool Pages', x: 690, y: 50, width: 260, height: 340, color: '#8b5cf6' }
    ],
    notes: [
      { id: 'note-1', title: 'Why OFFSET 1000000 Dies', text: 'OFFSET 1000000 LIMIT 20 forces the engine to read, visibility-check, and discard 1,000,000 rows before returning 20.', x: 40, y: 410, color: '#ef4444' },
      { id: 'note-2', title: 'Row-Value Seek Equivalence', text: '(a, b) < (:a, :b) expands to a < :a OR (a = :a AND b < :b), seeking directly to the exact B+Tree leaf entry.', x: 420, y: 410, color: '#10b981' }
    ],
    nodes: [
      { id: 'n1', blockId: 'sql-parser-rewriter', label: 'Keyset Cursor Decoder', x: 80, y: 165, instances: 2 },
      { id: 'n2', blockId: 'bplustree-covering-index', label: 'B+Tree (created_at DESC, id DESC)', x: 395, y: 165, instances: 2 },
      { id: 'n3', blockId: 'buffer-pool-clock-sweep', label: 'Buffer Pool Leaf Fetch (20 rows)', x: 735, y: 165, instances: 2 }
    ],
    connections: [
      { from: 'n1', to: 'n2', label: 'Seek (created_at, id) < (:ts, :id)' },
      { from: 'n2', to: 'n3', label: 'Read Next 20 Sibling Entries' }
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

const whiteboardJs = `/**
 * SQL In Depth — Interactive Query & Storage Architecture Decision Matrices & Capacity Blueprints
 * 12 Database Engine Building Blocks + 10 Interactive Workload -> Schema/Index -> Execution Blueprints.
 * Exposes window.WHITEBOARD_DATA and window.WHITEBOARD_BLUEPRINTS.
 */
(function(root) {
  'use strict';

  var BUILDING_BLOCKS = ${JSON.stringify(BUILDING_BLOCKS, null, 2)};

  var BLUEPRINTS = ${JSON.stringify(BLUEPRINTS, null, 2)};

  ${calculateCapacity.toString()}

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
`;
fs.writeFileSync(path.join(DATA_DIR, 'whiteboard-blueprints.js'), whiteboardJs, 'utf8');
console.log(`Wrote data/whiteboard-blueprints.js (${BLUEPRINTS.length} blueprints)`);

// ============================================================================
// 2. data/challenges.js (12 SEV-1 Production SQL & Storage Engine Incidents)
// ============================================================================
const CHALLENGES_RAW = [
  {
    id: 'chal-01-not-in-null-outage',
    title: 'Three-Valued Logic Blackout: NOT IN (Subquery) Returning 0 Rows on NULL',
    subtitle: 'A single un-assigned row with parent_id = NULL inside a NOT IN anti-join subquery silently wipes out the entire orphan-reconciliation batch.',
    summary: 'Replace NULL-fragile NOT IN (SELECT ...) with NULL-safe NOT EXISTS or explicit IS NOT NULL filtering under Three-Valued Logic.',
    severity: 'SEV-1',
    difficulty: 'easy',
    category: 'Three-Valued Logic & Anti-Joins',
    trackId: 'track-1',
    xp: 150,
    estimatedMinutes: 15,
    relatedSlugs: ['boolean-logic-three-valued-null', 'exists-not-exists-null-safety', 'case-missing-null-notin-outage'],
    symptoms: [
      'Nightly payout reconciliation query suddenly returns 0 un-invoiced orders after a single draft credit memo was inserted with order_id = NULL.',
      'No SQL syntax or runtime error is raised; the query completes in 12ms with an empty result set.',
      'Replacing NOT IN with LEFT JOIN ... WHERE r.order_id IS NULL immediately surfaces 14,820 pending orders.'
    ],
    metrics: { errorRate: '100.0%', latencyP99: '14ms', downstreamCpu: '12.0%', effectiveRps: 0, baselineRps: 14820 },
    slaImpact: 'Zero merchant payouts settled during the 02:00 UTC clearing window ($4.2M delayed).',
    wrongCauses: [
      ['Transaction isolation level READ COMMITTED hid the newly inserted order rows.', 'Incorrect. All 14,820 orders were committed hours earlier; the empty set is caused by Three-Valued Logic evaluation of x <> NULL.'],
      ['B+Tree index corruption on invoices(order_id) skipped matching leaf entries.', 'Incorrect. Even a sequential scan returns 0 rows when NOT IN encounters a single NULL element.'],
      ['Query optimizer rewrote NOT IN into an INNER JOIN due to stale table statistics.', 'Incorrect. Optimizer transformations preserve relational semantics; NOT IN is defined as x <> ALL(...).']
    ],
    correctCause: ['In SQL Three-Valued Logic, x NOT IN (1, 2, NULL) expands to (x <> 1) AND (x <> 2) AND (x <> NULL), which simplifies to TRUE AND UNKNOWN = UNKNOWN, filtering out every row in WHERE.', 'Spot on! A single NULL in a NOT IN list turns every non-matching row comparison into UNKNOWN, which WHERE rejects.'],
    invariants: [
      'In SQL 3VL, x = NULL and x <> NULL both evaluate to UNKNOWN; TRUE AND UNKNOWN evaluates to UNKNOWN.',
      'WHERE only admits tuples whose predicate evaluates to TRUE (rejecting both FALSE and UNKNOWN).',
      'NOT EXISTS (SELECT 1 FROM R WHERE R.k = L.k) returns TRUE when zero matching rows exist, making it completely immune to NULLs in R.k.'
    ],
    knobs: [
      { id: 'antiJoinPattern', label: 'Anti-Join SQL Pattern', type: 'select', options: ['not-in-unfiltered', 'not-exists-correlated', 'left-join-is-null'], defaultValue: 'not-in-unfiltered', description: 'Select the relational anti-join formulation.' },
      { id: 'nullGuardConstraint', label: 'Subquery / Schema NULL Guard', type: 'select', options: ['allow-nulls', 'where-is-not-null', 'not-null-column-constraint'], defaultValue: 'allow-nulls', description: 'Defense-in-depth handling for nullable foreign keys.' }
    ],
    optimal: { antiJoinPattern: 'not-exists-correlated', nullGuardConstraint: 'not-null-column-constraint' },
    verifyExpr: `(knobs.antiJoinPattern === 'not-exists-correlated' || knobs.antiJoinPattern === 'left-join-is-null') && knobs.nullGuardConstraint !== 'allow-nulls'`,
    okMsg: 'Anti-join hardened! NOT EXISTS + schema NOT NULL guard restored all 14,820 reconcilable rows with O(N+M) Hash Anti-Join execution.',
    failMsg: 'Query is still vulnerable to Three-Valued Logic NULL poisoning. Switch to not-exists-correlated and add a NULL guard.',
    codeFix: {
      title: 'Fix NULL-Poisoned NOT IN Anti-Join Evaluator',
      summary: 'Implement findUninvoicedOrders(orders, invoices) using NULL-safe anti-join semantics so invoices with order_id = null never zero out results.',
      buggyCode: `function findUninvoicedOrders(orders, invoices) {
  // Simulates buggy SQL: WHERE o.id NOT IN (SELECT i.order_id FROM invoices i)
  return orders.filter(o => {
    for (const inv of invoices) {
      if (inv.order_id === null || inv.order_id === undefined) return false; // 3VL UNKNOWN trap!
      if (inv.order_id === o.id) return false;
    }
    return true;
  });
}`,
      solutionCode: `function findUninvoicedOrders(orders, invoices) {
  // Simulates NULL-safe SQL: WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.order_id = o.id)
  const invoicedIds = new Set();
  for (const inv of invoices) {
    if (inv && inv.order_id !== null && inv.order_id !== undefined) {
      invoicedIds.add(inv.order_id);
    }
  }
  return orders.filter(o => !invoicedIds.has(o.id));
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const orders = [{ id: 101 }, { id: 102 }, { id: 103 }];
const invoices = [{ id: 1, order_id: 101 }, { id: 2, order_id: null }];
const res = findUninvoicedOrders(orders, invoices);
assert(res.length === 2 && res[0].id === 102 && res[1].id === 103, 'Expected orders 102 and 103 to survive despite null invoice');`
    }
  },
  {
    id: 'chal-02-left-join-where-trap',
    title: 'Silent Outer-Join Collapse: Filtering Right-Table Columns in WHERE',
    subtitle: 'Adding WHERE p.status = \'COMPLETED\' to a Customer LEFT JOIN Payments report silently drops all customers with zero payments.',
    summary: 'Move right-table predicates into the LEFT JOIN ... ON clause (or make them NULL-tolerant) to preserve outer-join row semantics.',
    severity: 'SEV-2',
    difficulty: 'easy',
    category: 'Outer Joins & Clause Execution Order',
    trackId: 'track-1',
    xp: 150,
    estimatedMinutes: 15,
    relatedSlugs: ['left-right-full-outer-joins', 'join-where-vs-on-filter-trap', 'where-filtering-predicates'],
    symptoms: [
      'Executive churn report claiming to show "All Active Customers and Their Completed Payments" excludes 42% of free-tier customers.',
      'EXPLAIN plan shows the planner simplified the LEFT JOIN into an ordinary INNER JOIN.',
      'Customers with zero payments disappear whenever the status filter is applied.'
    ],
    metrics: { errorRate: '42.0%', latencyP99: '22ms', downstreamCpu: '18.5%', effectiveRps: 5800, baselineRps: 10000 },
    slaImpact: '42% of active accounts omitted from monthly retention cohort denominator.',
    wrongCauses: [
      ['GROUP BY c.id collapsed multiple customers with NULL payment amounts into a single bucket.', 'Incorrect. c.id is unique per customer; the rows were filtered out before GROUP BY executed.'],
      ['COUNT(p.id) returns NULL instead of 0 when no matching payment exists.', 'Incorrect. COUNT(col) always returns 0 on an all-NULL group; the customer rows themselves were eliminated in WHERE.'],
      ['Hash Join spilled to disk and dropped unmatched outer probe tuples.', 'Incorrect. Disk spill preserves exact join semantics.']
    ],
    correctCause: ['Logical execution runs FROM/JOIN before WHERE: unmatched customers receive p.status = NULL from the LEFT JOIN, and WHERE p.status = \'COMPLETED\' evaluates NULL = \'COMPLETED\' → UNKNOWN, eliminating them.', 'Exact match! Strict predicates on the preserved side\'s partner in WHERE convert a LEFT JOIN into an INNER JOIN.'],
    invariants: [
      'In A LEFT JOIN B ON P_on WHERE P_where, P_on determines which B rows attach to A (extending unmatched A rows with NULLs), whereas P_where filters the post-join rows.',
      'Any null-rejecting predicate on B in WHERE (such as B.col = v) rejects NULL-extended outer rows, collapsing A LEFT JOIN B into A INNER JOIN B.',
      'COUNT(B.id) counts only non-NULL matched rows while COUNT(*) counts the NULL-extended outer row as 1.'
    ],
    knobs: [
      { id: 'predicatePlacement', label: 'Right-Table Filter Placement', type: 'select', options: ['where-clause', 'join-on-clause'], defaultValue: 'where-clause', description: 'Where p.status = COMPLETED is evaluated in the query pipeline.' },
      { id: 'countExpression', label: 'Aggregation Expression', type: 'select', options: ['count-star', 'count-right-pk'], defaultValue: 'count-star', description: 'Aggregate used to count matched payments per customer.' }
    ],
    optimal: { predicatePlacement: 'join-on-clause', countExpression: 'count-right-pk' },
    verifyExpr: `knobs.predicatePlacement === 'join-on-clause' && knobs.countExpression === 'count-right-pk'`,
    okMsg: 'Outer join preserved! Filtering inside ON and aggregating with COUNT(p.id) retains 100% of customers and reports 0 for unpaid accounts.',
    failMsg: 'Unpaid customers are still dropped or miscounted. Place the right-table filter in join-on-clause and use count-right-pk.',
    codeFix: {
      title: 'Preserve Unmatched Left Rows in Filtered Outer Join + Aggregation',
      summary: 'Evaluate the right-table status filter during the ON match condition and count right-table primary keys so customers with 0 completed payments return count = 0.',
      buggyCode: `function customerCompletedPaymentCounts(customers, payments) {
  // Buggy: filters p.status === 'COMPLETED' after join and uses row length
  const rows = [];
  for (const c of customers) {
    const matched = payments.filter(p => p.customer_id === c.id);
    if (matched.length === 0) rows.push({ c, p: null });
    else for (const p of matched) rows.push({ c, p });
  }
  const filtered = rows.filter(r => r.p && r.p.status === 'COMPLETED');
  return filtered.map(r => ({ customer_id: r.c.id, completed_count: 1 }));
}`,
      solutionCode: `function customerCompletedPaymentCounts(customers, payments) {
  return customers.map(c => {
    let count = 0;
    for (const p of payments) {
      if (p.customer_id === c.id && p.status === 'COMPLETED') count++;
    }
    return { customer_id: c.id, completed_count: count };
  });
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const customers = [{ id: 1 }, { id: 2 }];
const payments = [{ id: 10, customer_id: 1, status: 'COMPLETED' }, { id: 11, customer_id: 2, status: 'FAILED' }];
const out = customerCompletedPaymentCounts(customers, payments);
assert(out.length === 2 && out[0].completed_count === 1 && out[1].completed_count === 0, 'Customer 2 must remain with completed_count = 0');`
    }
  },
  {
    id: 'chal-03-chasm-trap-fanout',
    title: 'The $12M Chasm Trap: Multi-Child 1:N:M Join Fanout Double-Counting',
    subtitle: 'Joining orders to both order_items (1:N) and order_shipments (1:M) in a single SELECT inflates gross merchandise value by 3.4×.',
    summary: 'Pre-aggregate independent 1:N child tables to the parent grain in separate CTEs before joining so SUM() never multiplies across sibling fanout.',
    severity: 'SEV-1',
    difficulty: 'medium',
    category: 'Aggregations & Join Fanout Traps',
    trackId: 'track-2',
    xp: 200,
    estimatedMinutes: 20,
    relatedSlugs: ['join-fanout-chasm-traps', 'common-table-expressions-with', 'case-analytics-double-counting-bug'],
    symptoms: [
      'CFO dashboard reports $18.4M daily GMV while Stripe settlement ledger shows $5.4M.',
      'Orders shipped in 3 split packages have their line-item revenue multiplied by 3×.',
      'Orders with 5 line items have their shipping cost multiplied by 5×.'
    ],
    metrics: { errorRate: '240.7%', latencyP99: '680ms', downstreamCpu: '74.0%', effectiveRps: 120, baselineRps: 950 },
    slaImpact: 'Financial revenue reporting overstated by 240% across all multi-package orders.',
    wrongCauses: [
      ['Floating-point IEEE-754 rounding error accumulated across SUM(item_price).', 'Incorrect. Rounding errors are sub-cent; a 3× multiplication on 3-shipment orders is a relational Cartesian fanout within each order_id.'],
      ['Missing DISTINCT keyword inside SELECT order_id, SUM(price).', 'Incorrect. SELECT DISTINCT deduplicates final output rows after aggregation, not the intermediate join rows fed into SUM().'],
      ['Parallel HashAggregate workers merged partial states twice.', 'Incorrect. FinalizeAggregate combines disjoint worker partitions accurately; the input join stream itself had N×M duplicated rows.']
    ],
    correctCause: ['Joining parent row P to N child rows in Table A and M child rows in Table B produces N × M cross-product rows per parent P, multiplying SUM(A.val) by M and SUM(B.val) by N.', 'Spot on! Independent 1:N relationships form a Chasm Trap when joined directly at the detail grain.'],
    invariants: [
      'If |Items(o)| = N and |Shipments(o)| = M, then Orders ⋈ Items ⋈ Shipments produces N × M tuples for order o.',
      'Pre-aggregating Items by order_id (1 row per order) and Shipments by order_id (1 row per order) before joining guarantees a 1:1:1 join grain.',
      'COUNT(DISTINCT id) can deduplicate entity counts, but SUM(amount) cannot use DISTINCT when legitimate line items share identical prices.'
    ],
    knobs: [
      { id: 'joinArchitecture', label: 'Multi-Table Aggregation Architecture', type: 'select', options: ['raw-detail-multi-join', 'sum-distinct-hack', 'pre-aggregated-ctes'], defaultValue: 'raw-detail-multi-join', description: 'How independent 1:N child tables are combined with the parent grain.' },
      { id: 'unmatchedChildHandling', label: 'Missing Child Row Handling', type: 'select', options: ['inner-join-drop', 'left-join-coalesce-zero'], defaultValue: 'inner-join-drop', description: 'Preserve orders that have items but zero shipments yet.' }
    ],
    optimal: { joinArchitecture: 'pre-aggregated-ctes', unmatchedChildHandling: 'left-join-coalesce-zero' },
    verifyExpr: `knobs.joinArchitecture === 'pre-aggregated-ctes' && knobs.unmatchedChildHandling === 'left-join-coalesce-zero'`,
    okMsg: 'Chasm trap eliminated! Grain-aligned CTE pre-aggregation with LEFT JOIN + COALESCE matches the exact ledger total down to the cent.',
    failMsg: 'Revenue or shipping totals are still distorted. Select pre-aggregated-ctes and left-join-coalesce-zero.',
    codeFix: {
      title: 'Pre-Aggregate Child CTEs to Eliminate 1:N:M Join Fanout',
      summary: 'Aggregate order_items and order_shipments independently by order_id before joining to orders.',
      buggyCode: `function computeOrderTotals(orders, items, shipments) {
  // Buggy: joins items and shipments directly, causing N * M fanout!
  return orders.map(o => {
    let itemTotal = 0, shipTotal = 0;
    const oItems = items.filter(i => i.order_id === o.id);
    const oShips = shipments.filter(s => s.order_id === o.id);
    for (const i of oItems) {
      for (const s of oShips) {
        itemTotal += i.amount;
        shipTotal += s.fee;
      }
    }
    return { order_id: o.id, itemTotal, shipTotal };
  });
}`,
      solutionCode: `function computeOrderTotals(orders, items, shipments) {
  const itemByOrder = new Map();
  for (const i of items) {
    itemByOrder.set(i.order_id, (itemByOrder.get(i.order_id) || 0) + i.amount);
  }
  const shipByOrder = new Map();
  for (const s of shipments) {
    shipByOrder.set(s.order_id, (shipByOrder.get(s.order_id) || 0) + s.fee);
  }
  return orders.map(o => ({
    order_id: o.id,
    itemTotal: itemByOrder.get(o.id) || 0,
    shipTotal: shipByOrder.get(o.id) || 0
  }));
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const orders = [{ id: 1 }, { id: 2 }];
const items = [{ order_id: 1, amount: 100 }, { order_id: 1, amount: 50 }, { order_id: 2, amount: 80 }];
const shipments = [{ order_id: 1, fee: 10 }, { order_id: 1, fee: 15 }];
const res = computeOrderTotals(orders, items, shipments);
assert(res[0].itemTotal === 150 && res[0].shipTotal === 25, 'Order 1 must not fan out (got ' + JSON.stringify(res[0]) + ')');
assert(res[1].itemTotal === 80 && res[1].shipTotal === 0, 'Order 2 with 0 shipments must preserve itemTotal=80');`
    }
  },
  {
    id: 'chal-04-window-range-vs-rows-bug',
    title: 'Window Frame Anomaly: Default RANGE UNBOUNDED PRECEDING Merging Duplicate Timestamps',
    subtitle: 'Running balance column jumps in lumpy steps and LAST_VALUE() returns the current row instead of the partition final value.',
    summary: 'Specify explicit ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW for deterministic row-by-row running totals and UNBOUNDED FOLLOWING for LAST_VALUE.',
    severity: 'SEV-2',
    difficulty: 'medium',
    category: 'Window Functions & Framing',
    trackId: 'track-2',
    xp: 200,
    estimatedMinutes: 20,
    relatedSlugs: ['window-frames-rows-range-groups', 'offset-functions-lag-lead-first-last', 'running-totals-cumulative-shares'],
    symptoms: [
      'Two ledger transactions recorded in the same millisecond show identical cumulative running balances instead of sequential increments.',
      'LAST_VALUE(balance) OVER (PARTITION BY account_id ORDER BY created_at) always equals the current row\'s balance.',
      'Adding a unique tie-breaker or switching from RANGE to ROWS immediately fixes the running balance progression.'
    ],
    metrics: { errorRate: '18.6%', latencyP99: '45ms', downstreamCpu: '32.0%', effectiveRps: 4200, baselineRps: 5000 },
    slaImpact: 'Account statement exports fail audit reconciliation whenever batch postings share a timestamp.',
    wrongCauses: [
      ['SUM() OVER (...) ignores duplicate values unless ALL is specified.', 'Incorrect. SUM() includes all duplicates by default; the issue is that RANGE groups all ORDER BY peers into the current frame simultaneously.'],
      ['PARTITION BY account_id hashed two different accounts into the same bucket.', 'Incorrect. Window partitioning is exact, not probabilistic.'],
      ['Window functions execute before WHERE, including cancelled transactions.', 'Incorrect. Window functions execute after FROM, WHERE, GROUP BY, and HAVING.']
    ],
    correctCause: ['When ORDER BY is present without an explicit frame clause, SQL defaults to RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, which includes all peer rows tied on ORDER BY and stops at CURRENT ROW (breaking LAST_VALUE).', 'Exact hit! RANGE treats all ORDER BY ties as a single peer group, and stopping at CURRENT ROW means LAST_VALUE only sees up to the current peer group.'],
    invariants: [
      'Default window frame with ORDER BY is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW.',
      'ROWS counts physical row offsets before/after the current row regardless of ORDER BY value ties.',
      'LAST_VALUE(x) requires ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING (or FIRST_VALUE with DESC) to inspect the true end of the partition.'
    ],
    knobs: [
      { id: 'runningTotalFrame', label: 'Running Total Window Frame', type: 'select', options: ['default-range-current-row', 'rows-unbounded-preceding-current-row'], defaultValue: 'default-range-current-row', description: 'Frame specification for cumulative SUM().' },
      { id: 'lastValueFrame', label: 'LAST_VALUE Frame Upper Bound', type: 'select', options: ['current-row-default', 'unbounded-following'], defaultValue: 'current-row-default', description: 'Frame upper bound for partition-wide closing balance.' }
    ],
    optimal: { runningTotalFrame: 'rows-unbounded-preceding-current-row', lastValueFrame: 'unbounded-following' },
    verifyExpr: `knobs.runningTotalFrame === 'rows-unbounded-preceding-current-row' && knobs.lastValueFrame === 'unbounded-following'`,
    okMsg: 'Window frames locked! ROWS framing gives strict row-by-row running totals across timestamp ties and UNBOUNDED FOLLOWING captures the true closing balance.',
    failMsg: 'Tied timestamps are still merged or LAST_VALUE stops at the current row. Choose rows-unbounded-preceding-current-row and unbounded-following.',
    codeFix: {
      title: 'Implement Physical ROWS Window Framing & Partition-Wide Closing Value',
      summary: 'Compute row-by-row runningTotal and partition closingBalance even when multiple events share the same timestamp.',
      buggyCode: `function annotateLedgerWindow(entries) {
  // Buggy: simulates default RANGE frame merging ties and LAST_VALUE stopping at current row
  const sorted = [...entries].sort((a, b) => a.ts - b.ts || a.id - b.id);
  return sorted.map((row, idx) => {
    const rangePeers = sorted.filter(r => r.ts <= row.ts);
    const runningTotal = rangePeers.reduce((s, r) => s + r.delta, 0);
    return { ...row, runningTotal, closingBalance: runningTotal };
  });
}`,
      solutionCode: `function annotateLedgerWindow(entries) {
  const sorted = [...entries].sort((a, b) => a.ts - b.ts || a.id - b.id);
  const finalBalance = sorted.reduce((s, r) => s + r.delta, 0);
  let running = 0;
  return sorted.map(row => {
    running += row.delta;
    return { ...row, runningTotal: running, closingBalance: finalBalance };
  });
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const entries = [{ id: 1, ts: 1000, delta: 50 }, { id: 2, ts: 1000, delta: 30 }, { id: 3, ts: 2000, delta: -20 }];
const res = annotateLedgerWindow(entries);
assert(res[0].runningTotal === 50 && res[1].runningTotal === 80 && res[2].runningTotal === 60, 'Expected physical row running totals 50, 80, 60');
assert(res[0].closingBalance === 60 && res[1].closingBalance === 60, 'Expected partition closingBalance = 60 on all rows');`
    }
  },
  {
    id: 'chal-05-recursive-cte-cycle-loop',
    title: 'Infinite Graph Traversal: Recursive CTE Cycle Exhausting Temp Disk',
    subtitle: 'A circular folder symlink (Folder A → Folder B → Folder A) causes WITH RECURSIVE permission lookup to loop until temp_file_limit kills the backend.',
    summary: 'Add cycle detection (CYCLE clause or visited-path array check) and a max-depth guard to every recursive CTE over mutable graphs.',
    severity: 'SEV-1',
    difficulty: 'medium',
    category: 'Recursive CTEs & Hierarchical Graphs',
    trackId: 'track-2',
    xp: 200,
    estimatedMinutes: 20,
    relatedSlugs: ['recursive-ctes-hierarchies', 'graph-traversal-cycle-detection-sql', 'case-recursive-org-permission-engine'],
    symptoms: [
      'Workspace permission queries hang for 30s and fail with ERROR: temporary file size exceeds temp_file_limit (10GB).',
      'PostgreSQL worktable grows exponentially for a single tenant who imported a cyclic group hierarchy.',
      'CPU and NVMe write IOPS spike to 100% whenever that tenant loads their dashboard.'
    ],
    metrics: { errorRate: '14.2%', latencyP99: '30,000ms', downstreamCpu: '98.4%', effectiveRps: 310, baselineRps: 8500 },
    slaImpact: 'Shared database cluster temp disk exhausted, failing analytical sorts across all co-located tenants.',
    wrongCauses: [
      ['Using UNION instead of UNION ALL in the recursive CTE caused an infinite loop.', 'Incorrect. UNION deduplicates rows and actually terminates on finite node sets (though slowly), whereas UNION ALL without a visited guard loops forever on cycles.'],
      ['Missing B+Tree index on edges(parent_id) caused the recursive step to never terminate.', 'Incorrect. Missing indexes slow down each iteration but do not cause infinite iterations on a DAG.'],
      ['CTE materialization fence cached stale rows across transactions.', 'Incorrect. CTE worktables exist only for the duration of a single query execution.']
    ],
    correctCause: ['WITH RECURSIVE ... UNION ALL repeatedly joins the working table against the edge table; when the graph contains a directed cycle, the working table never becomes empty.', 'Spot on! Recursive CTEs terminate only when the recursive member returns 0 rows.'],
    invariants: [
      'A recursive CTE evaluates the anchor member once, then repeatedly evaluates the recursive member against the latest working table until the working table is empty.',
      'Tracking visited node IDs per path (or global visited set for reachability) and filtering next_id NOT IN visited guarantees termination in at most |V| steps.',
      'SQL:2023 / PostgreSQL 14+ provides native CYCLE node_id SET is_cycle USING path syntax for declarative cycle detection.'
    ],
    knobs: [
      { id: 'cycleProtection', label: 'Cycle Detection Strategy', type: 'select', options: ['none-union-all', 'visited-path-guard', 'closure-table-materialized'], defaultValue: 'none-union-all', description: 'Mechanism to prevent infinite traversal on cyclic edges.' },
      { id: 'maxDepthLimit', label: 'Hard Recursion Depth Guard', type: 'range', min: 8, max: 128, step: 8, defaultValue: 128, unit: 'hops', description: 'Safety cap on hierarchy depth (WHERE depth < max_depth).' }
    ],
    optimal: { cycleProtection: 'visited-path-guard', maxDepthLimit: 32 },
    verifyExpr: `knobs.cycleProtection !== 'none-union-all' && Number(knobs.maxDepthLimit) <= 64`,
    okMsg: 'Cycle guard verified! Visited-set tracking + depth <= 32 cap terminates cyclic traversals in 0.8ms with zero temp disk spill.',
    failMsg: 'Recursive CTE can still loop or traverse unbounded depth. Enable visited-path-guard and set maxDepthLimit <= 64.',
    codeFix: {
      title: 'Add Visited-Node & Depth Guards to Recursive Graph Reachability',
      summary: 'Implement findReachableNodes(edges, startId, maxDepth) that safely traverses cyclic graphs without infinite loops.',
      buggyCode: `function findReachableNodes(edges, startId) {
  // Buggy: UNION ALL worktable without visited tracking loops forever on cycles!
  let working = [startId];
  const result = [];
  while (working.length > 0) {
    result.push(...working);
    const next = [];
    for (const u of working) {
      for (const e of edges) {
        if (e.from === u) next.push(e.to);
      }
    }
    working = next;
  }
  return result;
}`,
      solutionCode: `function findReachableNodes(edges, startId, maxDepth = 32) {
  const visited = new Set([startId]);
  let working = [startId];
  let depth = 0;
  while (working.length > 0 && depth < maxDepth) {
    const next = [];
    for (const u of working) {
      for (const e of edges) {
        if (e.from === u && !visited.has(e.to)) {
          visited.add(e.to);
          next.push(e.to);
        }
      }
    }
    working = next;
    depth++;
  }
  return Array.from(visited);
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const cyclicEdges = [{ from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 1 }, { from: 3, to: 4 }];
const reached = findReachableNodes(cyclicEdges, 1, 10);
assert(reached.length === 4 && reached.includes(4), 'Should terminate on cycle 1->2->3->1 and return [1,2,3,4]');`
    }
  },
  {
    id: 'chal-06-non-sargable-composite-index',
    title: 'Index Bypass Outage: Non-SARGable DATE(created_at) & Wrong Composite Prefix',
    subtitle: 'A 120M-row orders table pegs 64 vCPUs at 100% because WHERE DATE(created_at) = CURRENT_DATE and an inverted (created_at, tenant_id) index force sequential scans.',
    summary: 'Rewrite function-wrapped predicates into half-open range intervals and order composite B+Tree keys by Equality first, Range second, and INCLUDE payload columns.',
    severity: 'SEV-1',
    difficulty: 'medium',
    category: 'B+Tree Indexing & SARGability',
    trackId: 'track-4',
    xp: 250,
    estimatedMinutes: 20,
    relatedSlugs: ['composite-indexes-leftmost-prefix', 'covering-indexes-index-only-scans', 'sargability-functions-on-columns', 'case-slack-composite-index-incident'],
    symptoms: [
      'Merchant order list endpoint latency jumps from 3ms to 4,800ms as the orders table crosses 120M rows.',
      'EXPLAIN ANALYZE shows Parallel Seq Scan reading 1,420,000 8KB heap pages despite an existing index on created_at.',
      'Buffer pool hit ratio drops from 99.2% to 41% due to continuous sequential scan cache thrashing.'
    ],
    metrics: { errorRate: '29.5%', latencyP99: '4,820ms', downstreamCpu: '99.5%', effectiveRps: 680, baselineRps: 18000 },
    slaImpact: 'Merchant dashboard API times out during peak flash-sale traffic.',
    wrongCauses: [
      ['B+Tree indexes cannot index TIMESTAMP or TIMESTAMPTZ columns.', 'Incorrect. Timestamps are 8-byte integers under the hood and are ideal B+Tree keys when queried with SARGable range operators.'],
      ['PostgreSQL ignores indexes whenever a query returns more than 10 rows.', 'Incorrect. The planner uses index scans whenever the estimated page cost is lower than a sequential scan; here the function call DATE(col) made the index unusable.'],
      ['Increasing shared_buffers from 16GB to 32GB is required before B+Tree lookups work.', 'Incorrect. A B+Tree lookup touches only 3–4 pages (~32KB) regardless of total table size.']
    ],
    correctCause: ['Wrapping an indexed column in DATE(created_at) destroys SARGability, and putting range column created_at before equality column tenant_id violates the B+Tree Equality → Range leftmost-prefix rule.', 'Spot on! SARGable range bounds plus a composite index on (tenant_id, status, created_at) INCLUDE (total_cents) reduces 1.4M page reads to 4 page reads.'],
    invariants: [
      'A predicate f(col) = const is non-SARGable on a standard B+Tree index on (col) because f is not order-preserving Lookup keys.',
      'In a composite B+Tree on (A, B, C), equality predicates on A and B narrow the search to a single contiguous leaf range sorted by C.',
      'Adding INCLUDE (payload_cols) enables an Index-Only Scan with zero random heap fetches when Visibility Map bits are set.'
    ],
    knobs: [
      { id: 'predicateForm', label: 'Timestamp Predicate Formulation', type: 'select', options: ['func-date-wrapped', 'sargable-half-open-range'], defaultValue: 'func-date-wrapped', description: 'How the date filter is written in SQL WHERE.' },
      { id: 'compositeKeyOrder', label: 'Composite B+Tree Key Order', type: 'select', options: ['created_at-tenant_id', 'tenant_id-status-created_at-include'], defaultValue: 'created_at-tenant_id', description: 'Column ordering and covering payload of the B+Tree index.' }
    ],
    optimal: { predicateForm: 'sargable-half-open-range', compositeKeyOrder: 'tenant_id-status-created_at-include' },
    verifyExpr: `knobs.predicateForm === 'sargable-half-open-range' && knobs.compositeKeyOrder === 'tenant_id-status-created_at-include'`,
    okMsg: 'Index-Only Scan unlocked! SARGable range + (tenant_id, status, created_at) INCLUDE (total_cents) cut p99 latency from 4,820ms to 1.8ms (0 heap fetches).',
    failMsg: 'Query still scans unnecessary index or heap pages. Select sargable-half-open-range and tenant_id-status-created_at-include.',
    codeFix: {
      title: 'Recommend Optimal Composite B+Tree Index & SARGable Range Rewrite',
      summary: 'Order equality columns first (sorted by selectivity), range/sort column next, and remaining SELECT columns in INCLUDE.',
      buggyCode: `function designCompositeIndex(querySpec) {
  // Buggy: puts range columns before equality columns and omits INCLUDE
  return {
    keyColumns: [...querySpec.rangeCols, ...querySpec.equalityCols],
    includeColumns: [],
    sargableRewrite: false
  };
}`,
      solutionCode: `function designCompositeIndex(querySpec) {
  const eqCols = [...(querySpec.equalityCols || [])];
  const rangeCols = [...(querySpec.rangeCols || [])];
  const keySet = new Set([...eqCols, ...rangeCols]);
  const includeColumns = (querySpec.selectCols || []).filter(c => !keySet.has(c));
  return {
    keyColumns: [...eqCols, ...rangeCols],
    includeColumns,
    sargableRewrite: true
  };
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const plan = designCompositeIndex({
  equalityCols: ['tenant_id', 'status'],
  rangeCols: ['created_at'],
  selectCols: ['tenant_id', 'created_at', 'total_cents']
});
assert(plan.keyColumns.join(',') === 'tenant_id,status,created_at', 'Equality cols must precede range col');
assert(plan.includeColumns.join(',') === 'total_cents' && plan.sargableRewrite === true, 'total_cents should be in INCLUDE');`
    }
  },
  {
    id: 'chal-07-stale-stats-nested-loop',
    title: 'Planner Catastrophe: Stale Statistics & Correlated Columns Triggering O(N·M) Nested Loop',
    subtitle: 'After bulk-loading 5M promotion events, the optimizer estimates rows=1 and picks an unindexed Nested Loop Join taking 42 seconds per query.',
    summary: 'Run ANALYZE immediately after bulk loads and create extended multivariate statistics (CREATE STATISTICS) on correlated columns.',
    severity: 'SEV-1',
    difficulty: 'hard',
    category: 'Cost-Based Optimizer & Join Planning',
    trackId: 'track-4',
    xp: 250,
    estimatedMinutes: 25,
    relatedSlugs: ['table-statistics-histograms-cardinality', 'selectivity-estimation-correlated-columns', 'reading-explain-and-explain-analyze', 'case-stale-statistics-plan-flip'],
    symptoms: [
      'EXPLAIN (ANALYZE, BUFFERS) shows Nested Loop (cost=0.43..18.20 rows=1) (actual time=0.12..42180.50 rows=485000 loops=1).',
      'The planner multiplied P(country = \'US\') × P(currency = \'USD\') as independent probabilities, underestimating cardinality by 80×.',
      'Running SET enable_nestloop = off locally drops query time from 42,180ms to 95ms via Hash Join.'
    ],
    metrics: { errorRate: '45.0%', latencyP99: '42,180ms', downstreamCpu: '99.9%', effectiveRps: 45, baselineRps: 3200 },
    slaImpact: 'Checkout promotion eligibility service brownout across all North American traffic.',
    wrongCauses: [
      ['Hash Join is disabled by default in PostgreSQL unless enable_hashjoin = on is set per session.', 'Incorrect. enable_hashjoin is ON by default; the planner chose Nested Loop because stale/uncorrelated stats made est_rows=1 look cheaper than building a hash table.'],
      ['B+Tree index corruption caused the planner to misread pg_class.relpages.', 'Incorrect. Bulk loads without ANALYZE leave pg_statistic empty or outdated until autovacuum or manual ANALYZE runs.'],
      ['work_mem was too large, forcing the optimizer to avoid Hash Join.', 'Incorrect. Larger work_mem actually makes in-memory Hash Join cheaper and more attractive to the planner.']
    ],
    correctCause: ['Without post-load ANALYZE and multivariate dependency statistics on correlated columns, the optimizer severely underestimated outer cardinality (est=1 vs actual=485,000) and chose Nested Loop over Hash Join.', 'Spot on! Nested Loop cost scales linearly with outer row count; a 485,000× row underestimate turns a 1ms plan into a 42-second outage.'],
    invariants: [
      'Under the Attribute Value Independence (AVI) assumption, the planner estimates P(A ∧ B) = P(A)·P(B), which severely underestimates positively correlated predicates.',
      'Nested Loop Join costs O(|Outer| · log_B |Inner|), whereas Hash Join costs O(|Outer| + |Inner|) once the hash table build overhead is paid.',
      'CREATE STATISTICS (dependencies, ndistinct, mcv) + ANALYZE teaches the planner the true joint selectivity of correlated columns.'
    ],
    knobs: [
      { id: 'statsMaintenance', label: 'Catalog Statistics State', type: 'select', options: ['stale-pre-load', 'analyze-plus-multivariate-stats'], defaultValue: 'stale-pre-load', description: 'Whether ANALYZE and CREATE STATISTICS have been executed on correlated columns.' },
      { id: 'workMemMb', label: 'Session work_mem Allocation', type: 'range', min: 4, max: 128, step: 4, defaultValue: 4, unit: 'MB', description: 'Memory budget for in-memory Hash Join build table without multi-batch disk spill.' }
    ],
    optimal: { statsMaintenance: 'analyze-plus-multivariate-stats', workMemMb: 64 },
    verifyExpr: `knobs.statsMaintenance === 'analyze-plus-multivariate-stats' && Number(knobs.workMemMb) >= 32`,
    okMsg: 'Plan flip resolved! Multivariate stats corrected est_rows to 480,000 and switched the plan to an single-batch in-memory Hash Join (88ms p99).',
    failMsg: 'Planner still underestimates cardinality or spills Hash Join batches to disk. Enable analyze-plus-multivariate-stats and workMemMb >= 32.',
    codeFix: {
      title: 'Cost-Based Join Selector with Correlated Selectivity Correction',
      summary: 'Compute true outer cardinality using joint selectivity when columns are correlated and pick HashJoin when outer rows exceed the NLJ threshold.',
      buggyCode: `function selectPhysicalJoin(outerTotalRows, selA, selB, innerRows) {
  // Buggy: assumes independence selA * selB even for correlated columns and picks NLJ
  const estOuter = Math.max(1, Math.round(outerTotalRows * selA * selB));
  const nljCost = estOuter * Math.log2(Math.max(2, innerRows));
  const hashCost = estOuter + innerRows;
  return { estOuter, algorithm: nljCost < hashCost ? 'NestedLoopJoin' : 'HashJoin' };
}`,
      solutionCode: `function selectPhysicalJoin(outerTotalRows, selA, selB, innerRows, correlationFactor = 1.0) {
  const jointSel = Math.min(Math.min(selA, selB), selA * selB * correlationFactor);
  const estOuter = Math.max(1, Math.round(outerTotalRows * jointSel));
  const nljCost = estOuter * Math.log2(Math.max(2, innerRows)) * 4;
  const hashCost = estOuter + innerRows * 1.2;
  return { estOuter, algorithm: nljCost < hashCost ? 'NestedLoopJoin' : 'HashJoin' };
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const res = selectPhysicalJoin(5000000, 0.1, 0.1, 200000, 10.0);
assert(res.estOuter === 500000 && res.algorithm === 'HashJoin', 'Correlated selectivity should estimate 500,000 rows and choose HashJoin');`
    }
  },
  {
    id: 'chal-08-deep-offset-pagination-cliff',
    title: 'The Deep Pagination Cliff: OFFSET 500000 Scanning & Discarding Half a Million Tuples',
    subtitle: 'Scraper bots paging through ?page=25000&limit=20 saturate disk IOPS by forcing PostgreSQL to read and discard 500,000 rows per request.',
    summary: 'Replace O(OFFSET) linear pagination with O(log N) keyset cursor pagination on (created_at DESC, id DESC).',
    severity: 'SEV-2',
    difficulty: 'medium',
    category: 'Query Optimization & Keyset Pagination',
    trackId: 'track-6',
    xp: 200,
    estimatedMinutes: 15,
    relatedSlugs: ['keyset-cursor-pagination-vs-offset', 'order-by-limit-offset-distinct', 'sorting-spill-to-disk-top-n-heapsort'],
    symptoms: [
      'Page 1 loads in 1.2ms, Page 100 loads in 18ms, and Page 25,000 takes 3,400ms.',
      'Rows disappeared or appeared twice across page boundaries whenever new items were inserted concurrently.',
      'EXPLAIN ANALYZE shows Limit (actual rows=20) atop Index Scan reading 500,020 tuples.'
    ],
    metrics: { errorRate: '19.4%', latencyP99: '3,410ms', downstreamCpu: '88.0%', effectiveRps: 920, baselineRps: 15000 },
    slaImpact: 'Public catalog API p99 latency breaches 500ms SLA whenever deep pages are crawled.',
    wrongCauses: [
      ['B+Tree leaf nodes store exact subtree row counts, so OFFSET should jump in O(log N).', 'Incorrect. Standard DBMS B+Trees do NOT store subtree row counts in internal nodes because maintaining counts under concurrent MVCC visibility would serialize every insert!'],
      ['LIMIT 20 failed to push down into the Sort operator.', 'Incorrect. Even with an index avoiding a sort, OFFSET N must still walk N visible tuples to count them.'],
      ['The primary key id column was INT4 instead of INT8.', 'Incorrect. Key width does not change the O(OFFSET) linear scan complexity.']
    ],
    correctCause: ['Because MVCC tuple visibility depends on each transaction\'s snapshot, the database cannot jump to numeric row offset N; it must walk and visibility-check all N preceding tuples before emitting the LIMIT slice.', 'Spot on! Keyset pagination replaces numeric row counting with a B+Tree search key (created_at, id) < (:last_ts, :last_id).'],
    invariants: [
      'OFFSET K LIMIT M requires O(K + M) tuple evaluations, degrading linearly with page depth K.',
      'Keyset pagination WHERE (created_at, id) < (:cursor_ts, :cursor_id) ORDER BY created_at DESC, id DESC LIMIT M executes in O(log_B N + M) constant time at any depth.',
      'Including the unique primary key id as the tie-breaker guarantees zero skipped or duplicated rows across identical timestamps.'
    ],
    knobs: [
      { id: 'paginationMode', label: 'Pagination Access Pattern', type: 'select', options: ['offset-limit', 'keyset-seek-cursor'], defaultValue: 'offset-limit', description: 'Method used to fetch subsequent pages of ordered results.' },
      { id: 'tieBreakerKey', label: 'Deterministic Tie-Breaker Column', type: 'select', options: ['timestamp-only', 'timestamp-plus-unique-id'], defaultValue: 'timestamp-only', description: 'Columns included in ORDER BY and the cursor seek tuple.' }
    ],
    optimal: { paginationMode: 'keyset-seek-cursor', tieBreakerKey: 'timestamp-plus-unique-id' },
    verifyExpr: `knobs.paginationMode === 'keyset-seek-cursor' && knobs.tieBreakerKey === 'timestamp-plus-unique-id'`,
    okMsg: 'Constant-time pagination achieved! Keyset seek on (created_at DESC, id DESC) serves page 25,000 in 1.3ms with zero drift.',
    failMsg: 'Deep pages still scan linearly or skip tied timestamps. Select keyset-seek-cursor and timestamp-plus-unique-id.',
    codeFix: {
      title: 'Implement Composite Keyset (created_at DESC, id DESC) Cursor Paginator',
      summary: 'Filter and slice ordered rows using the composite (created_at, id) seek invariant so ties on created_at are never lost.',
      buggyCode: `function paginateKeysetDesc(rows, cursor, limit) {
  // Buggy: compares only created_at < cursor.created_at, dropping rows with identical timestamps!
  const sorted = [...rows].sort((a, b) => b.created_at - a.created_at || b.id - a.id);
  const filtered = cursor ? sorted.filter(r => r.created_at < cursor.created_at) : sorted;
  return filtered.slice(0, limit);
}`,
      solutionCode: `function paginateKeysetDesc(rows, cursor, limit) {
  const sorted = [...rows].sort((a, b) => b.created_at - a.created_at || b.id - a.id);
  const filtered = cursor
    ? sorted.filter(r => r.created_at < cursor.created_at || (r.created_at === cursor.created_at && r.id < cursor.id))
    : sorted;
  return filtered.slice(0, limit);
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const data = [
  { id: 10, created_at: 500 },
  { id: 9, created_at: 500 },
  { id: 8, created_at: 500 },
  { id: 7, created_at: 400 }
];
const p1 = paginateKeysetDesc(data, null, 2);
const p2 = paginateKeysetDesc(data, p1[p1.length - 1], 2);
assert(p1.map(r => r.id).join(',') === '10,9', 'Page 1 should be 10,9');
assert(p2.map(r => r.id).join(',') === '8,7', 'Page 2 should preserve tied timestamp id=8 and return 8,7');`
    }
  },
  {
    id: 'chal-09-write-skew-double-spend',
    title: 'Write Skew & Double-Spend: Concurrent Check-Then-Act Under REPEATABLE READ',
    subtitle: 'Two parallel withdrawal requests read the same $100 wallet balance under Snapshot Isolation and both succeed, leaving the wallet at -$60.',
    summary: 'Prevent Lost Updates and Write Skew using atomic conditional UPDATE ... RETURNING, SELECT ... FOR UPDATE, or SERIALIZABLE (SSI).',
    severity: 'SEV-1',
    difficulty: 'hard',
    category: 'MVCC Isolation & Concurrency Anomalies',
    trackId: 'track-5',
    xp: 300,
    estimatedMinutes: 25,
    relatedSlugs: ['write-anomalies-lost-update-write-skew', 'repeatable-read-snapshot-isolation', 'serializable-2pl-vs-ssi', 'case-fintech-double-spend-race-condition'],
    symptoms: [
      'Fraud team detects 340 wallets with negative balances after a concurrent withdrawal burst.',
      'Application logs show both transactions read balance = $100.00 before inserting $80.00 debit entries into ledger_entries.',
      'PostgreSQL REPEATABLE READ did NOT raise a serialization error because both transactions inserted into ledger_entries without updating the same row.'
    ],
    metrics: { errorRate: '6.8%', latencyP99: '11ms', downstreamCpu: '42.0%', effectiveRps: 8400, baselineRps: 9000 },
    slaImpact: 'Direct financial loss from concurrent double-spend exploit on wallet withdrawals.',
    wrongCauses: [
      ['PostgreSQL REPEATABLE READ permits Dirty Reads from uncommitted transactions.', 'Incorrect. Dirty reads are impossible at all isolation levels in PostgreSQL; the bug is that both transactions read the same committed snapshot without locking or conflicting.'],
      ['WAL fsync was disabled via synchronous_commit = off.', 'Incorrect. synchronous_commit affects durability on power loss, not concurrent transaction isolation.'],
      ['B+Tree index on ledger_entries(wallet_id) was missing UNIQUE.', 'Incorrect. A wallet legitimately has many ledger entries over time; uniqueness applies only to idempotency_key.']
    ],
    correctCause: ['Under Snapshot Isolation (REPEATABLE READ), first-committer-wins only catches concurrent writes to the SAME row; reading SUM(entries) and inserting two new rows is a classic Write Skew anomaly.', 'Spot on! Without locking the parent wallet row (SELECT ... FOR UPDATE) or using SERIALIZABLE (SSI rw-antidependency detection), disjoint inserts bypass write-conflict checks.'],
    invariants: [
      'Snapshot Isolation preventsLost Updates on the same row via first-committer-wins, but allows Write Skew across disjoint rows.',
      'Materializing the invariant onto the parent row via SELECT ... FROM wallets WHERE id = :id FOR UPDATE (or atomic UPDATE wallets SET balance = balance - :amt WHERE id = :id AND balance >= :amt) serializes concurrent withdrawals.',
      'Serializable Snapshot Isolation (SSI) tracks SIREAD predicate locks and aborts dangerous structures of two consecutive rw-antidependency edges.'
    ],
    knobs: [
      { id: 'concurrencyControl', label: 'Withdrawal Concurrency Guard', type: 'select', options: ['app-select-then-insert', 'pessimistic-for-update-parent', 'serializable-ssi-with-retry'], defaultValue: 'app-select-then-insert', description: 'Isolation and locking protocol protecting the balance invariant.' },
      { id: 'idempotencyEnforcement', label: 'Idempotency Key Constraint', type: 'select', options: ['none', 'unique-idempotency-key'], defaultValue: 'none', description: 'Prevent duplicate network retries from double-debiting.' }
    ],
    optimal: { concurrencyControl: 'pessimistic-for-update-parent', idempotencyEnforcement: 'unique-idempotency-key' },
    verifyExpr: `knobs.concurrencyControl !== 'app-select-then-insert' && knobs.idempotencyEnforcement === 'unique-idempotency-key'`,
    okMsg: 'Double-spend vulnerability closed! Parent wallet row locking (FOR UPDATE) + unique idempotency keys guarantee zero negative balances under 128-thread contention.',
    failMsg: 'Concurrent withdrawals can still race or retry twice. Choose pessimistic-for-update-parent (or serializable-ssi-with-retry) and unique-idempotency-key.',
    codeFix: {
      title: 'Atomic Pessimistic Row-Locked + Idempotent Wallet Withdrawal',
      summary: 'Serialize withdrawals per wallet and enforce idempotency keys so concurrent or retried requests never overdraw.',
      buggyCode: `function processWithdrawal(state, req) {
  // Buggy: does not check idempotency key and allows overdraft when snapshot balance is stale
  const wallet = state.wallets.get(req.walletId);
  if (req.snapshotBalance >= req.amount) {
    wallet.balance -= req.amount;
    return { status: 'COMMITTED', balance: wallet.balance };
  }
  return { status: 'INSUFFICIENT_FUNDS', balance: wallet.balance };
}`,
      solutionCode: `function processWithdrawal(state, req) {
  if (!state.idempotency) state.idempotency = new Map();
  if (state.idempotency.has(req.idempotencyKey)) {
    return state.idempotency.get(req.idempotencyKey);
  }
  const wallet = state.wallets.get(req.walletId);
  // Atomic current-read check (UPDATE wallets SET balance = balance - :amt WHERE id = :id AND balance >= :amt)
  let result;
  if (wallet.balance >= req.amount) {
    wallet.balance -= req.amount;
    result = { status: 'COMMITTED', balance: wallet.balance };
  } else {
    result = { status: 'INSUFFICIENT_FUNDS', balance: wallet.balance };
  }
  state.idempotency.set(req.idempotencyKey, result);
  return result;
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const state = { wallets: new Map([[1, { id: 1, balance: 100 }]]) };
const r1 = processWithdrawal(state, { walletId: 1, amount: 80, snapshotBalance: 100, idempotencyKey: 'k1' });
const r1Retry = processWithdrawal(state, { walletId: 1, amount: 80, snapshotBalance: 100, idempotencyKey: 'k1' });
const r2 = processWithdrawal(state, { walletId: 1, amount: 80, snapshotBalance: 100, idempotencyKey: 'k2' });
assert(r1.status === 'COMMITTED' && r1.balance === 20, 'First withdrawal succeeds');
assert(r1Retry.balance === 20 && state.wallets.get(1).balance === 20, 'Retry must be idempotent');
assert(r2.status === 'INSUFFICIENT_FUNDS' && state.wallets.get(1).balance === 20, 'Second concurrent withdrawal must be rejected');`
    }
  },
  {
    id: 'chal-10-ab-ba-deadlock-storm',
    title: 'Wait-For Graph Gridlock: Unordered Multi-Row Updates Triggering AB-BA Deadlocks',
    subtitle: 'Batch inventory reservation locking cart items in user-click order triggers 420 deadlocks/minute during flash sales.',
    summary: 'Acquire row-level locks in deterministic ascending primary-key order (ORDER BY id ASC FOR UPDATE) to make Wait-For Graph cycles impossible.',
    severity: 'SEV-1',
    difficulty: 'medium',
    category: 'Locking, Deadlocks & Wait-For Graphs',
    trackId: 'track-5',
    xp: 200,
    estimatedMinutes: 15,
    relatedSlugs: ['deadlocks-wait-for-graphs-detection', 'row-level-locks-for-update-skip-locked', 'lock-contention-zero-downtime-ddl'],
    symptoms: [
      'PostgreSQL logs flood with ERROR: deadlock detected — Process 18421 waits for ShareLock on transaction 994120; blocked by process 18455.',
      'Checkout API p99 latency spikes to 1,000ms (the exact deadlock_timeout value) before failing with SQLSTATE 40P01.',
      'Two users checking out the same two SKUs in opposite order (SKU 10 then 20 vs SKU 20 then 10) deadlock every time.'
    ],
    metrics: { errorRate: '16.5%', latencyP99: '1,040ms', downstreamCpu: '61.0%', effectiveRps: 2100, baselineRps: 12000 },
    slaImpact: '16.5% of multi-item flash-sale checkouts abort with unhandled 40P01 deadlock errors.',
    wrongCauses: [
      ['PostgreSQL escalated row locks into a full Table Lock once more than 5 rows were updated.', 'Incorrect. PostgreSQL never performs row-to-table lock escalation (unlike SQL Server); row locks are stored directly in tuple headers (xmax/infomask).'],
      ['deadlock_timeout = 1s is too high; setting it to 1ms prevents deadlocks from happening.', 'Incorrect. deadlock_timeout only controls how long PostgreSQL waits before running the Wait-For Graph cycle detector; it does not prevent the cycle.'],
      ['READ COMMITTED isolation level automatically orders row locks.', 'Incorrect. Statements lock rows in the order they are visited or looped over by the application.']
    ],
    correctCause: ['When Transaction T1 locks row A then requests row B while Transaction T2 locks row B then requests row A, they form a cycle T1 → T2 → T1 in the Wait-For Graph.', 'Spot on! Imposing a strict total order on lock acquisition (always lock min(id) before max(id)) makes Wait-For Graph cycles mathematically impossible.'],
    invariants: [
      'Coffman\'s Circular Wait condition states that a deadlock cycle can exist only if transactions acquire resources out of global topological order.',
      'Sorting target primary keys ascending (`SELECT ... WHERE id = ANY(:sorted_ids) ORDER BY id ASC FOR no KEY UPDATE`) eliminates AB-BA deadlocks.',
      'Using FOR NO KEY UPDATE instead of FOR UPDATE when primary/unique keys are unchanged avoids blocking concurrent foreign-key checks.'
    ],
    knobs: [
      { id: 'lockAcquisitionOrder', label: 'Row Lock Acquisition Order', type: 'select', options: ['arrival-cart-order', 'canonical-pk-ascending'], defaultValue: 'arrival-cart-order', description: 'Order in which SKU inventory rows are locked within a transaction.' },
      { id: 'rowLockStrength', label: 'Row Lock Mode', type: 'select', options: ['for-update-heavy', 'for-no-key-update'], defaultValue: 'for-update-heavy', description: 'PostgreSQL row lock strength when updating non-key quantity columns.' }
    ],
    optimal: { lockAcquisitionOrder: 'canonical-pk-ascending', rowLockStrength: 'for-no-key-update' },
    verifyExpr: `knobs.lockAcquisitionOrder === 'canonical-pk-ascending' && knobs.rowLockStrength === 'for-no-key-update'`,
    okMsg: 'Deadlocks eliminated! Canonical ascending PK lock ordering + FOR NO KEY UPDATE reduced 40P01 deadlock rate to 0.00%.',
    failMsg: 'Transactions can still form Wait-For Graph cycles or block child FK inserts. Choose canonical-pk-ascending and for-no-key-update.',
    codeFix: {
      title: 'Canonical Lock Ordering & Wait-For Graph Cycle Detector',
      summary: 'Sort lock requests in ascending resource ID order to prevent deadlocks, and detect directed cycles in a Wait-For Graph.',
      buggyCode: `function canonicalizeLockPlan(skuIds) {
  // Buggy: preserves arbitrary user cart order, allowing [20, 10] vs [10, 20] deadlocks
  return skuIds.slice();
}`,
      solutionCode: `function canonicalizeLockPlan(skuIds) {
  return Array.from(new Set(skuIds)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const cartA = canonicalizeLockPlan([205, 101, 309, 101]);
const cartB = canonicalizeLockPlan([309, 205, 101]);
assert(cartA.join(',') === '101,205,309' && cartB.join(',') === '101,205,309', 'Both transactions must lock SKUs in identical ascending order 101,205,309');`
    }
  },
  {
    id: 'chal-11-mvcc-bloat-xid-wraparound',
    title: 'MVCC Table Bloat & Transaction ID Wraparound Emergency Shutdown',
    subtitle: 'An abandoned idle-in-transaction analytics session pins OldestXmin for 19 hours, bloating a 4GB queue table to 180GB and triggering XID wraparound warnings.',
    summary: 'Enforce idle_in_transaction_session_timeout, tune per-table autovacuum scale factors on high-churn tables, and use FOR UPDATE SKIP LOCKED.',
    severity: 'SEV-1',
    difficulty: 'hard',
    category: 'MVCC Garbage Collection, Bloat & Vacuum',
    trackId: 'track-5',
    xp: 300,
    estimatedMinutes: 25,
    relatedSlugs: ['dead-tuples-bloat-autovacuum-txid-wraparound', 'tuple-headers-xmin-xmax-visibility', 'case-sentry-transaction-id-wraparound'],
    symptoms: [
      'A table holding only 12,000 live rows consumes 180GB on disk and takes 9 seconds for a sequential scan.',
      'PostgreSQL logs emit WARNING: database "prod" must be vacuumed within 8,400,000 transactions to avoid transaction ID wraparound.',
      'Autovacuum runs continuously on the table but logs "0 dead row versions removed, 142,000,000 dead row versions cannot be removed yet, oldest xmin: 81049201".'
    ],
    metrics: { errorRate: '34.0%', latencyP99: '9,100ms', downstreamCpu: '97.0%', effectiveRps: 540, baselineRps: 22000 },
    slaImpact: 'Imminent cluster-wide single-user-mode read-only shutdown when un-frozen XID age reaches 2 billion.',
    wrongCauses: [
      ['VACUUM FULL must be scheduled every 5 minutes via cron in production.', 'Incorrect. VACUUM FULL acquires an AccessExclusiveLock that blocks all reads and writes on the table; standard Autovacuum reclaims space online once OldestXmin advances.'],
      ['PostgreSQL 64-bit servers use 64-bit transaction IDs in tuple headers, so wraparound cannot happen.', 'Incorrect. Tuple headers store 32-bit xmin and xmax (4 bytes each) to save 8 bytes per row, using modular arithmetic with a 2^31 horizon.'],
      ['Deleting rows frees OS filesystem space immediately without VACUUM.', 'Incorrect. DELETE only stamps xmax on the tuple header; space is reclaimed into the Free Space Map only after VACUUM sweeps dead tuples older than OldestXmin.']
    ],
    correctCause: ['An open transaction in state idle in transaction (or a stale replication slot) held OldestXmin back, preventing VACUUM from reclaiming any dead tuple versions created after that XID or advancing relfrozenxid.', 'Spot on! VACUUM cannot remove any tuple version whose xmax >= global OldestXmin because that open snapshot might still inspect it.'],
    invariants: [
      'A dead tuple version (xmax committed) is removable by VACUUM iff xmax < GlobalOldestXmin across all backends, prepared transactions, and replication slots.',
      '32-bit Transaction IDs compare via modular arithmetic (2^31 past, 2^31 future); tuples must be frozen (HEAP_XMIN_FROZEN) before their age reaches 2^31 (~2 billion XIDs).',
      'Setting idle_in_transaction_session_timeout and aggressive per-table autovacuum_vacuum_scale_factor (e.g., 0.01) keeps high-churn tables compact.'
    ],
    knobs: [
      { id: 'idleTxTimeoutSec', label: 'idle_in_transaction_session_timeout', type: 'range', min: 0, max: 300, step: 15, defaultValue: 0, unit: 'sec', description: 'Automatically terminate sessions stuck idle inside an open transaction (0 = disabled).' },
      { id: 'autovacuumScaleFactor', label: 'Table autovacuum_vacuum_scale_factor', type: 'select', options: ['default-0.20', 'tuned-0.01'], defaultValue: 'default-0.20', description: 'Fraction of table size modified before autovacuum triggers.' }
    ],
    optimal: { idleTxTimeoutSec: 60, autovacuumScaleFactor: 'tuned-0.01' },
    verifyExpr: `Number(knobs.idleTxTimeoutSec) > 0 && Number(knobs.idleTxTimeoutSec) <= 120 && knobs.autovacuumScaleFactor === 'tuned-0.01'`,
    okMsg: 'OldestXmin unpinned and Vacuum unblocked! Reclaimed 142M dead tuples into the Free Space Map and advanced relfrozenxid safely.',
    failMsg: 'Zombie transactions or high scale factors still allow bloat buildup. Set idleTxTimeoutSec between 15–120s and autovacuumScaleFactor to tuned-0.01.',
    codeFix: {
      title: 'MVCC Vacuum Horizon & Dead Tuple Reclaimability Calculator',
      summary: 'Determine which dead tuple versions can be reclaimed by VACUUM given active backend snapshots and replication slot horizons.',
      buggyCode: `function filterReclaimableTuples(tuples, currentXid) {
  // Buggy: reclaims any tuple with committed xmax without checking active snapshot OldestXmin!
  return tuples.filter(t => t.xmax !== null && t.xmaxCommitted && t.xmax < currentXid);
}`,
      solutionCode: `function filterReclaimableTuples(tuples, currentXid, activeBackendXmins = [], slotXmins = []) {
  const horizons = [currentXid, ...activeBackendXmins, ...slotXmins].filter(x => typeof x === 'number');
  const oldestXmin = Math.min(...horizons);
  return tuples.filter(t => t.xmax !== null && t.xmaxCommitted && t.xmax < oldestXmin);
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const tuples = [
  { id: 1, xmin: 100, xmax: 150, xmaxCommitted: true },
  { id: 2, xmin: 150, xmax: 250, xmaxCommitted: true },
  { id: 3, xmin: 250, xmax: null, xmaxCommitted: false }
];
const reclaimed = filterReclaimableTuples(tuples, 500, [200], []);
assert(reclaimed.length === 1 && reclaimed[0].id === 1, 'Only tuple 1 (xmax=150 < oldestXmin=200) is safe to vacuum');`
    }
  },
  {
    id: 'chal-12-zero-downtime-ddl-lock-queue',
    title: 'The 2-Second Migration That Took Down Production: AccessExclusive DDL Lock Queue',
    subtitle: 'Running ALTER TABLE users ADD COLUMN ... and CREATE INDEX without CONCURRENTLY queues behind a 40-second reporting query and freezes all 15,000 QPS.',
    summary: 'Use CREATE INDEX CONCURRENTLY, set lock_timeout with retry loops on DDL, and split constraint validation into NOT VALID + VALIDATE CONSTRAINT.',
    severity: 'SEV-1',
    difficulty: 'hard',
    category: 'Production DBRE, Zero-Downtime Migrations & Pooling',
    trackId: 'track-6',
    xp: 300,
    estimatedMinutes: 20,
    relatedSlugs: ['table-locks-intention-locks-ddl-hazards', 'lock-contention-zero-downtime-ddl', 'case-github-zero-downtime-migrations', 'case-gitlab-database-incident-postmortem'],
    symptoms: [
      'A metadata-only ALTER TABLE statement hangs for 38 seconds instead of completing in 2ms.',
      'Within 3 seconds of the migration starting, all 5,000 application SELECT and INSERT connections on users block and exhaust the connection pool.',
      'pg_locks shows ALTER TABLE waiting for AccessExclusiveLock blocked by a single AccessShareLock from an analytics SELECT.'
    ],
    metrics: { errorRate: '98.2%', latencyP99: '38,400ms', downstreamCpu: '15.0%', effectiveRps: 180, baselineRps: 15000 },
    slaImpact: 'Complete site-wide authentication and API outage for the duration of the blocked migration.',
    wrongCauses: [
      ['Adding a nullable column with no default rewrites every 8KB heap page in PostgreSQL 11+.', 'Incorrect. Adding a nullable column (or a non-volatile default in PG 11+) is an O(1) catalog update; the outage happened because waiting for AccessExclusiveLock queued all subsequent queries behind it.'],
      ['AccessShareLock (SELECT) only conflicts with other SELECT statements.', 'Incorrect. AccessShareLock conflicts ONLY with AccessExclusiveLock (DDL), which is why a long SELECT blocks DDL, and the waiting DDL then blocks all new SELECTs!'],
      ['Increasing max_connections to 10,000 allows SELECT queries to bypass the DDL lock queue.', 'Incorrect. More connections just pile onto the same FIFO lock wait queue and exhaust RAM.']
    ],
    correctCause: ['PostgreSQL\'s fair FIFO lock queue means a waiting AccessExclusiveLock (which blocks behind an active long-running SELECT\'s AccessShareLock) forces all newly arriving SELECT and DML queries to queue behind the waiting DDL.', 'Spot on! Always guard DDL with a strict lock_timeout (e.g. SET lock_timeout = \'2s\'), build indexes via CREATE INDEX CONCURRENTLY, and validate constraints with NOT VALID + VALIDATE CONSTRAINT.'],
    invariants: [
      'AccessExclusiveLock conflicts with every lock mode, including AccessShareLock acquired by plain SELECT queries.',
      'A waiting AccessExclusiveLock in the lock queue blocks all subsequent AccessShareLock and RowExclusiveLock requests to prevent lock starvation.',
      'CREATE INDEX CONCURRENTLY and ALTER TABLE ... VALIDATE CONSTRAINT acquire only ShareUpdateExclusiveLock, allowing concurrent reads and writes.'
    ],
    knobs: [
      { id: 'ddlLockTimeoutMs', label: 'Migration Session lock_timeout', type: 'select', options: ['unlimited-0ms', 'bounded-1500ms-with-retry'], defaultValue: 'unlimited-0ms', description: 'Maximum time DDL waits in the lock queue before aborting and retrying.' },
      { id: 'indexAndConstraintMode', label: 'Index & Constraint Rollout Pattern', type: 'select', options: ['blocking-create-index', 'concurrently-plus-not-valid'], defaultValue: 'blocking-create-index', description: 'How new indexes and foreign/check constraints are added online.' }
    ],
    optimal: { ddlLockTimeoutMs: 'bounded-1500ms-with-retry', indexAndConstraintMode: 'concurrently-plus-not-valid' },
    verifyExpr: `knobs.ddlLockTimeoutMs === 'bounded-1500ms-with-retry' && knobs.indexAndConstraintMode === 'concurrently-plus-not-valid'`,
    okMsg: 'Zero-downtime migration verified! Bounded lock_timeout + CREATE INDEX CONCURRENTLY + NOT VALID/VALIDATE deployed with 0 blocked queries.',
    failMsg: 'Migration can still form a catastrophic AccessExclusive lock convoy. Enable bounded-1500ms-with-retry and concurrently-plus-not-valid.',
    codeFix: {
      title: 'Zero-Downtime DDL Lock-Queue & Safe Migration Planner',
      summary: 'Generate non-blocking SQL migration steps using lock_timeout, CREATE INDEX CONCURRENTLY, and ADD CONSTRAINT ... NOT VALID + VALIDATE.',
      buggyCode: `function buildSafeMigrationPlan(spec) {
  // Buggy: emits blocking CREATE INDEX and unguarded ALTER TABLE
  return [
    \`CREATE INDEX \${spec.indexName} ON \${spec.table} (\${spec.column});\`,
    \`ALTER TABLE \${spec.table} ADD CONSTRAINT \${spec.constraintName} CHECK (\${spec.checkExpr});\`
  ];
}`,
      solutionCode: `function buildSafeMigrationPlan(spec) {
  return [
    \`SET lock_timeout = '1500ms';\`,
    \`CREATE INDEX CONCURRENTLY IF NOT EXISTS \${spec.indexName} ON \${spec.table} (\${spec.column});\`,
    \`ALTER TABLE \${spec.table} ADD CONSTRAINT \${spec.constraintName} CHECK (\${spec.checkExpr}) NOT VALID;\`,
    \`ALTER TABLE \${spec.table} VALIDATE CONSTRAINT \${spec.constraintName};\`
  ];
}`,
      testCode: `const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
const steps = buildSafeMigrationPlan({ table: 'orders', column: 'tenant_id', indexName: 'idx_orders_tenant', constraintName: 'chk_pos', checkExpr: 'total >= 0' });
assert(steps[0].includes('lock_timeout'), 'Must set lock_timeout');
assert(steps[1].includes('CREATE INDEX CONCURRENTLY'), 'Must use CREATE INDEX CONCURRENTLY');
assert(steps[2].includes('NOT VALID') && steps[3].includes('VALIDATE CONSTRAINT'), 'Must split ADD CONSTRAINT NOT VALID and VALIDATE CONSTRAINT');`
    }
  }
];

function serializeChallenges(rawList) {
  const parts = rawList.map(c => {
    const rootCauses = [
      ...c.wrongCauses.map((wc, idx) => ({
        id: `rc-wrong-${idx + 1}`,
        description: wc[0],
        correct: false,
        feedback: wc[1]
      })),
      {
        id: 'rc-correct',
        description: c.correctCause[0],
        correct: true,
        feedback: c.correctCause[1]
      }
    ];
    const metricsAndLogs = {
      errorRate: c.metrics.errorRate,
      latencyP99: c.metrics.latencyP99,
      downstreamCpu: c.metrics.downstreamCpu,
      effectiveRps: c.metrics.effectiveRps,
      baselineRps: c.metrics.baselineRps,
      timeseries: [
        { time: '10:00:00', cpu: 18, latencyP99: 6, errorRate: 0.0, rps: c.metrics.baselineRps },
        { time: '10:01:00', cpu: 55, latencyP99: 280, errorRate: 4.5, rps: Math.round(c.metrics.baselineRps * 0.6) },
        { time: '10:02:00', cpu: 89, latencyP99: 1450, errorRate: 18.2, rps: Math.round(c.metrics.baselineRps * 0.25) },
        { time: '10:03:00', cpu: parseFloat(c.metrics.downstreamCpu), latencyP99: parseInt(String(c.metrics.latencyP99).replace(/,/g, ''), 10) || 1000, errorRate: parseFloat(c.metrics.errorRate), rps: c.metrics.effectiveRps }
      ],
      logs: c.symptoms.map((sym, i) => ({
        timestamp: `10:0${i + 1}:12.104`,
        level: i === 2 ? 'FATAL' : (i === 1 ? 'ERROR' : 'WARN'),
        service: 'postgres-primary',
        message: sym
      }))
    };

    return `    {
      id: ${JSON.stringify(c.id)},
      title: ${JSON.stringify(c.title)},
      subtitle: ${JSON.stringify(c.subtitle)},
      summary: ${JSON.stringify(c.summary)},
      severity: ${JSON.stringify(c.severity)},
      difficulty: ${JSON.stringify(c.difficulty)},
      category: ${JSON.stringify(c.category)},
      trackId: ${JSON.stringify(c.trackId)},
      xp: ${c.xp},
      estimatedMinutes: ${c.estimatedMinutes},
      relatedSlugs: ${JSON.stringify(c.relatedSlugs)},
      symptoms: ${JSON.stringify(c.symptoms, null, 8)},
      metricsAndLogs: ${JSON.stringify(metricsAndLogs, null, 8)},
      slaImpact: ${JSON.stringify(c.slaImpact)},
      rootCauses: ${JSON.stringify(rootCauses, null, 8)},
      invariants: ${JSON.stringify(c.invariants, null, 8)},
      interactiveTuning: ${JSON.stringify(c.knobs, null, 8)},
      optimalPreset: ${JSON.stringify(c.optimal, null, 8)},
      verify: function(knobs) {
        var ok = Boolean(${c.verifyExpr});
        return {
          success: ok,
          message: ok ? ${JSON.stringify(c.okMsg)} : ${JSON.stringify(c.failMsg)},
          metrics: {
            latencyP99: ok ? '2.4ms' : ${JSON.stringify(c.metrics.latencyP99)},
            errorRate: ok ? '0.00%' : ${JSON.stringify(c.metrics.errorRate)},
            downstreamCpu: ok ? '14.0%' : ${JSON.stringify(c.metrics.downstreamCpu)},
            effectiveRps: ok ? ${c.metrics.baselineRps} : ${c.metrics.effectiveRps}
          }
        };
      },
      codeFix: ${JSON.stringify(c.codeFix, null, 8)}
    }`;
  });

  return `/**
 * SQL In Depth — Production SQL, Query Optimizer, MVCC & Storage Incident Challenges
 * 12 interactive debugging, execution-plan regression, and concurrency-anomaly labs.
 * Exposes window.CHALLENGES_DATA as an Array (with .challenges alias for backwards compatibility).
 */
(function(root) {
  'use strict';

  var CHALLENGES_DATA = [
${parts.join(',\n')}
  ];

  CHALLENGES_DATA.challenges = CHALLENGES_DATA;
  root.CHALLENGES_DATA = CHALLENGES_DATA;
  root.ChallengesData = CHALLENGES_DATA;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CHALLENGES_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
`;
}

const challengesJs = serializeChallenges(CHALLENGES_RAW);
fs.writeFileSync(path.join(DATA_DIR, 'challenges.js'), challengesJs, 'utf8');
console.log(`Wrote data/challenges.js (${CHALLENGES_RAW.length} challenges)`);

