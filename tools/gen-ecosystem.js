#!/usr/bin/env node
'use strict';

/**
 * Generates all 8 ecosystem data files for SQL In Depth:
 *   1. data/glossary.js
 *   2. data/roadmap.js
 *   3. data/srs-cards.js
 *   4. data/challenges.js
 *   5. data/whiteboard-blueprints.js
 *   6. data/projects.js
 *   7. data/implementations_code.js
 *   8. data/guided_labs.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');

// Load curriculum.js
const currSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(DATA_DIR, 'curriculum.js'), 'utf8'), currSandbox);
const CURRICULUM = currSandbox.window.CURRICULUM_DATA;
const TRACKS = CURRICULUM.parts || CURRICULUM.tracks;

const allUnits = [];
const unitBySlug = {};
const moduleById = {};
const trackById = {};

for (const track of TRACKS) {
  trackById[track.id] = track;
  for (const mod of track.modules) {
    moduleById[mod.id] = { ...mod, trackId: track.id, trackTitle: track.title };
    for (const u of mod.units) {
      const full = {
        ...u,
        type: u.type || u.kind || 'lesson',
        overview: u.overview || (u.archive && u.archive.excerpt) || u.title,
        moduleId: mod.id,
        moduleNumber: mod.number,
        moduleTitle: mod.title,
        trackId: track.id,
        trackNumber: track.number,
        trackTitle: track.title
      };
      allUnits.push(full);
      unitBySlug[u.slug] = full;
    }
  }
}

console.log(`Loaded ${allUnits.length} units across ${Object.keys(moduleById).length} modules.`);

// ============================================================================
// Domain Metadata Helper per Unit (Complexity, Core Invariant, Storage/Hardware Note)
// ============================================================================
function getUnitDomainSpecs(u) {
  const s = u.slug;
  const t = u.title;
  const ov = u.overview;
  // Determine tailored complexity, invariant, and storage engine notes based on module & slug
  const m = u.moduleId;
  const complexityMap = {
    m01: 'Full Scan: O(N) tuples (~N/B pages); Top-K ORDER BY LIMIT K: O(N log K) heap',
    m02: 'B+Tree PK/UNIQUE Lookup: O(log_B N) page reads; TRUNCATE: O(1) extent deallocation',
    m03: 'Hash Join: O(N + M) time, O(min(N,M)) RAM; Merge Join: O(N log N + M log M); Nested Loop: O(N · M)',
    m04: 'HashAggregate: O(N) time, O(G) groups RAM; GroupAggregate (Sorted): O(N log N) time, O(1) RAM',
    m05: 'Semi-Join (Hash EXISTS): O(N + M); Recursive CTE Fixpoint: O(V + E) iterations',
    m06: 'Window Partition + Sort: O(N log N) per distinct PARTITION BY + ORDER BY signature; Frame Slide: O(1) amortized',
    m07: '3NF/BCNF Decomposition: O(1) point update (zero update anomalies) vs O(k) join reconstruction',
    m08: 'Star Schema Fact Scan + Broadcast Dimension Hash Join: O(|Fact| + ∑|Dim_i|)',
    m09: 'GIN Inverted Index Lookup: O(log V + |posting_list|); Recursive Closure Table: O(1) hop lookup',
    m10: 'Slotted Page Tuple Fetch: O(1) via 2-byte line pointer (PageID, SlotID); Buffer Pool Hit: ~50ns vs NVMe Miss: ~100μs',
    m11: 'B+Tree Point/Range Scan: O(log_B N + K/B) page I/Os; Hash Index Equality: O(1) bucket read',
    m12: 'System R Dynamic Programming Join Planner: O(2^n) subsets (or O(3^n) bushy trees) for n relations',
    m13: 'WAL Commit: 1 sequential fsync (~100μs–1ms); ARIES Recovery: O(|Analysis| + |Redo| + |Undo|)',
    m14: 'MVCC Visibility Check: O(1) xmin/xmax vs Snapshot [xmin, xmax, xip[]); SSI Conflict Tracking: O(active_txns)',
    m15: 'Lock Table Hash Lookup: O(1); Wait-For Graph Deadlock Cycle Detection: O(V + E) DFS',
    m16: 'Columnar Vectorized Scan (SIMD Batch = 1024..2048): O(N / (B · C_ratio)) I/O with Zone-Map Pruning',
    m17: '2PC Atomic Commit: 2 RTTs + 2 forced WAL flushes; Raft/Paxos Quorum Write: 1 RTT to majority ⌊N/2⌋ + 1',
    m18: 'PgBouncer Transaction Pooling: O(1) backend handoff; Partition Pruning: O(log P) metadata routing'
  };

  const invariantMap = {
    m01: 'SQL logical evaluation strictly follows FROM → WHERE → GROUP BY → HAVING → WINDOW → SELECT → DISTINCT → ORDER BY → LIMIT; in Three-Valued Logic (3VL), WHERE only admits TRUE tuples and rejects both FALSE and UNKNOWN (NULL).',
    m02: 'Primary keys enforce (UNIQUE ∧ NOT NULL); Foreign keys enforce ∀ child.fk ≠ NULL ⇒ ∃ parent.pk = child.fk; time-ordered keys (BIGSERIAL/UUIDv7) append monotonically to the rightmost B+Tree leaf page.',
    m03: 'An INNER JOIN filters unmatched rows, whereas a LEFT OUTER JOIN preserves every left tuple by extending unmatched right attributes with NULL; placing a non-null-tolerant predicate on the right table in WHERE collapses a LEFT JOIN into an INNER JOIN.',
    m04: 'Every non-aggregated expression in SELECT or ORDER BY must be either listed in GROUP BY or functionally determined by the grouping keys (PK → col); joining two independent 1:N child tables before aggregating multiplies sums by the opposing fanout factor.',
    m05: 'NOT EXISTS(subquery) is strictly NULL-safe under Three-Valued Logic, whereas x NOT IN (SELECT y ...) returns 0 rows whenever the subquery emits even a single NULL because x <> NULL evaluates to UNKNOWN.',
    m06: 'Window functions evaluate after HAVING and before SELECT DISTINCT, attaching analytical aggregates over a partition/frame without collapsing tuple granularity; specifying ORDER BY in OVER(...) defaults the frame to RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW.',
    m07: 'A relation is in Boyce-Codd Normal Form (BCNF) iff for every non-trivial functional dependency X → Y, X is a superkey; preserving dependency closure F+ and lossless-join decomposition (R1 ∩ R2 → R1 or R2) prevents spurious tuples.',
    m08: 'Every fact table row must strictly adhere to a single declared grain; Type 2 Slowly Changing Dimensions (SCD2) preserve historical truth via non-overlapping [effective_from, effective_to) intervals and an is_current flag.',
    m09: 'GIN (Generalized Inverted Index) decomposes composite JSONB/Array/FTS documents into atomic element keys pointing to sorted TID posting lists, turning containment (@>) into multi-list bitmap intersection.',
    m10: 'Slotted 8KB pages grow the 2-byte line-pointer array downward from the header and variable-length tuple payloads upward from the page tail, isolating external index TIDs (PageNumber, SlotIndex) from intra-page compaction moves.',
    m11: 'A composite B+Tree index on (A, B, C) defines a lexicographic total order (A, then B, then C): prefixes (A), (A, B), and (A, B, C) are SARGable range intervals, while an equality predicate on A and range predicate on B stops index ordering for C.',
    m12: 'A Cost-Based Optimizer estimates Cost = (N_pages × seq_page_cost) + (N_rand × random_page_cost) + (N_tuples × cpu_tuple_cost) using MCV lists, equi-depth histograms, and HyperLogLog NDV sketches.',
    m13: 'The Write-Ahead Logging (WAL) protocol enforces Two Golden Rules: (1) Force-Log-at-Commit (REDO records flushed before returning COMMIT) and (2) Write-Ahead Before Dirty Page Flush (PageLSN ≤ FlushedLSN for STEAL/NO-FORCE buffer management).',
    m14: 'Under Snapshot Isolation (MVCC), readers never block writers and writers never block readers; a tuple version V is visible to snapshot S iff V.xmin is committed before S and V.xmax is either invalid or uncommitted/after S.',
    m15: 'Strict Two-Phase Locking (SS2PL) holds all exclusive/shared locks until transaction termination to prevent cascading aborts; Key-Range (Next-Key) locks or Serializable Snapshot Isolation (rw-antidependency cycles) eliminate phantom reads and write skew.',
    m16: 'PAX/Parquet hybrid columnar files group 100K–1M rows into Row Groups and store each column contiguously in compressed Column Chunks with min/max Zone Maps, allowing the vectorized engine to skip entire row groups and process 1024 values per L1 cache residency.',
    m17: 'Consistent hash / range sharding routes queries by shard_key in O(log S) when the predicate includes shard_key, whereas cross-shard scatter-gather fanout bounded by tail latency p99_cluster = 1 - (1 - p99_node)^S.',
    m18: 'Connection pooling multiplexes thousands of stateless app connections onto a bounded pool of ~2–4× CPU_cores active database backends, preventing OS context-switch thrashing and PostgreSQL ProcArray lock contention.'
  };

  const hardwareMap = {
    m01: 'In-memory tuple filtering evaluates predicates across 8KB pages; avoiding function calls on indexed columns preserves SARGability so the storage engine can seek B+Tree pages instead of scanning every heap page.',
    m02: 'Random UUIDv4 primary keys scatter inserts uniformly across all B+Tree leaf pages, dropping page fill-factor to ~50% and causing dirty-page write amplification; monotonic UUIDv7 (48-bit Unix ms prefix) keeps the active working set in L3/Buffer Pool.',
    m03: 'Hash Join builds an in-memory open-addressed hash table over the smaller build relation (falling back to Grace Hash Join disk partitions if work_mem is exceeded), whereas Merge Join streams pre-sorted B+Tree inputs in O(1) memory.',
    m04: 'When group cardinality G exceeds work_mem, HashAggregate spills partition batches to temporary disk files; pre-filtering rows in WHERE before grouping drastically reduces CPU hashing and spill I/O.',
    m05: 'PostgreSQL 12+ and SQLite 3.35+ inline non-recursive CTEs referenced once so predicates push down into B+Tree indexes; adding MATERIALIZED forces once-only evaluation into a tuple store.',
    m06: 'Multiple window functions sharing identical PARTITION BY and ORDER BY clauses reuse a single WindowAgg sort pass; divergent ORDER BY clauses trigger back-to-back external merge sorts.',
    m07: 'Heavy OLTP update paths require 3NF/BCNF so updating an attribute touches a single 8KB heap page; read-heavy paths selectively denormalize with triggers or materialized views when join latency breaches SLA.',
    m08: 'Surrogate 4-byte/8-byte integer keys in fact tables shrink fact row width by 40–70% compared to wide natural strings, packing 2–3× more tuples per 8KB page and accelerating vectorized SIMD joins.',
    m09: 'PostgreSQL TOAST compresses attributes > 2KB and slices them into out-of-line 2KB chunks; extracting a single JSONB field still decompresses the entire TOAST value unless promoted to a generated column or GIN index.',
    m10: 'PostgreSQL Heap-Only Tuples (HOT) place updated tuple versions on the same 8KB page and chain them from the original root line pointer whenever no indexed column is modified, completely avoiding secondary index write amplification.',
    m11: 'An Index-Only Scan skips random heap fetches entirely when all queried columns exist in the B+Tree leaf payload (INCLUDE) and the Visibility Map (VM) bit confirms every tuple on the target 8KB heap page is visible to all transactions.',
    m12: 'Correlated columns (e.g., city and state_code) violate the optimizer independence assumption P(A ∧ B) = P(A)·P(B), causing severe cardinality underestimates that trick the planner into catastrophic Nested Loop joins.',
    m13: 'Group Commit batches concurrent transaction commits waiting on the WAL flush mutex into a single NVMe fsync() syscall, scaling write throughput from ~1,000 TPS to 50,000+ TPS on a single disk.',
    m14: 'Long-running uncommitted transactions pin OldestXmin backward, preventing VACUUM / purge threads from reclaiming dead MVCC tuple versions and causing severe table/index bloat and transaction ID wraparound risk.',
    m15: 'SELECT ... FOR UPDATE SKIP LOCKED scans the B+Tree index and immediately skips rows locked by concurrent workers without blocking on the lock wait queue, enabling lock-free 50,000+ jobs/sec relational task queues.',
    m16: 'Late materialization evaluates selective filter predicates directly on Dictionary-Encoded / Run-Length-Encoded integer codes using AVX-512/NEON SIMD instructions before reconstructing full row tuples.',
    m17: 'Outbox pattern writes domain state and the CDC event into the same local ACID shard transaction, and Debezium tails the replication WAL slot to publish to Kafka without fragile two-phase commits.',
    m18: 'Without an index on child(parent_id), every DELETE FROM parent triggers a full sequential table scan of the child table to enforce referential integrity, causing catastrophic lock convoys in production.'
  };

  return {
    complexity: complexityMap[m] || 'O(log_B N) index seek vs O(N/B) sequential scan',
    invariant: `${ov} Core Invariant: ${invariantMap[m]}`,
    hardware: `${hardwareMap[m]} (${t})`
  };
}

// ============================================================================
// 1. Generate data/glossary.js
// ============================================================================
const extraGlossaryTerms = [
  {
    term: 'ACID (Atomicity, Consistency, Isolation, Durability)',
    def: 'The four foundational transactional guarantees: Atomicity (all-or-nothing via Undo WAL), Consistency (valid state transitions preserving constraints), Isolation (concurrent serializability/snapshot visibility via MVCC/locks), and Durability (committed changes survive power loss via Redo WAL fsync).',
    cat: 'Transactions · Module 5.1',
    complexity: 'WAL Commit: 1 sequential fsync; MVCC Check: O(1)',
    trackId: 'track-5',
    moduleId: 'm13',
    relatedSlug: 'acid-properties-under-the-hood'
  },
  {
    term: 'ARIES (Algorithms for Recovery and Isolation Exploiting Semantics)',
    def: 'C. Mohan\'s physiological crash recovery protocol used by PostgreSQL, InnoDB, DB2, and SQL Server. Uses STEAL/NO-FORCE buffer management, Write-Ahead Logging with LSNs, Compensation Log Records (CLRs), and three recovery passes: Analysis, Redo (repeating history), and Undo.',
    cat: 'Transactions · Module 5.3',
    complexity: 'Recovery: O(|Analysis| + |Redo| + |Undo|)',
    trackId: 'track-5',
    moduleId: 'm15',
    relatedSlug: 'aries-crash-recovery-analysis-redo-undo'
  },
  {
    term: 'B+Tree Index (Balanced Disk-Oriented Search Tree)',
    def: 'High-fanout (B = 200..500) balanced tree where internal nodes store only routing separator keys and child page IDs, while leaf pages hold all index entries and are linked in a doubly-linked sibling ring for fast sequential range scans.',
    cat: 'Storage & Indexing · Module 4.1',
    complexity: 'Point Lookup: O(log_B N) (~3–4 page reads for 10^9 rows); Range Scan: O(log_B N + K/B)',
    trackId: 'track-4',
    moduleId: 'm10',
    relatedSlug: 'btree-bplustree-internal-anatomy'
  },
  {
    term: 'Boyce-Codd Normal Form (BCNF)',
    def: 'Strict relational normal form requiring that for every non-trivial functional dependency X → Y in relation R, the determinant X must be a superkey of R. Eliminates all redundancy caused by functional dependencies.',
    cat: 'Data Modeling · Module 3.1',
    complexity: 'Update Cost: O(1) tuple write (zero update anomalies)',
    trackId: 'track-3',
    moduleId: 'm07',
    relatedSlug: 'boyce-codd-fourth-fifth-normal-form'
  },
  {
    term: 'Covering Index (Index-Only Scan with INCLUDE)',
    def: 'A B+Tree index whose key columns plus non-key payload columns (INCLUDE) satisfy every column referenced in a query\'s SELECT, WHERE, and ORDER BY clauses, eliminating random heap table fetches when the Visibility Map bit is set.',
    cat: 'Storage & Indexing · Module 4.1',
    complexity: 'O(log_B N + K/B) sequential leaf reads with 0 random heap I/Os',
    trackId: 'track-4',
    moduleId: 'm10',
    relatedSlug: 'covering-indexes-index-only-scans'
  },
  {
    term: 'CTID / RowID / Tuple Identifier (TID)',
    def: 'Physical pointer locating a tuple version inside a heap file, structured as a 6-byte pair (PageNumber [4B], SlotNumber [2B]). Secondary indexes in PostgreSQL point to the physical CTID, while InnoDB secondary indexes store the logical clustered Primary Key.',
    cat: 'Transactions & Storage · Module 5.3',
    complexity: 'Direct Slotted Page Lookup: O(1) page offset dereference',
    trackId: 'track-5',
    moduleId: 'm15',
    relatedSlug: 'slotted-page-layout-8kb-anatomy'
  },
  {
    term: 'Exclusion Constraint (GiST Generalized Search Tree)',
    def: 'PostgreSQL declarative constraint (`EXCLUDE USING gist (room_id WITH =, booking_period WITH &&)`) that prevents any two rows from satisfying a symmetric operator tuple (such as overlapping temporal or spatial ranges) concurrently.',
    cat: 'Data Modeling · Module 3.3',
    complexity: 'Insertion/Overlap Check: O(log N) via GiST R-Tree bounding intervals',
    trackId: 'track-3',
    moduleId: 'm09',
    relatedSlug: 'interval-overlap-allen-algebra'
  },
  {
    term: 'Gaps and Islands (Contiguous Sequence Grouping)',
    def: 'Analytical SQL design pattern for grouping contiguous runs of events or dates into islands. Solved in O(N log N) by subtracting `ROW_NUMBER() OVER (PARTITION BY entity ORDER BY seq)` from `seq`, which remains constant across contiguous steps.',
    cat: 'Analytical SQL · Module 2.3',
    complexity: 'O(N log N) window sort + O(N) single-pass grouping',
    trackId: 'track-2',
    moduleId: 'm06',
    relatedSlug: 'gaps-and-islands-sessionization'
  },
  {
    term: 'HOT Update (Heap-Only Tuple Optimization)',
    def: 'PostgreSQL storage optimization where an UPDATE that modifies zero indexed columns and fits on the same 8KB heap page creates a page-local redirect chain from the root line pointer, avoiding all secondary B+Tree index insertions.',
    cat: 'Transactions & Storage · Module 5.3',
    complexity: '1 heap page write, 0 secondary B+Tree index writes',
    trackId: 'track-5',
    moduleId: 'm15',
    relatedSlug: 'heap-files-hot-updates-fillfactor'
  },
  {
    term: 'Keyset (Cursor / Seek) Pagination',
    def: 'Pagination technique using a deterministic composite seek predicate (`WHERE (created_at, id) < (:last_ts, :last_id) ORDER BY created_at DESC, id DESC LIMIT 20`) to jump directly to the target B+Tree leaf entry in O(log_B N) regardless of page depth, replacing O(OFFSET) linear scans.',
    cat: 'Distributed & Production · Module 6.3',
    complexity: 'O(log_B N + K) constant time at page 1 or page 1,000,000',
    trackId: 'track-6',
    moduleId: 'm18',
    relatedSlug: 'keyset-cursor-pagination-vs-offset'
  },
  {
    term: 'LSM-Tree (Log-Structured Merge-Tree)',
    def: 'Write-optimized storage structure (RocksDB, Cassandra, Pebble) that buffers mutations in an in-memory skip-list MemTable (+ sequential WAL) and flushes sorted immutable SSTables to disk, merging levels via background compaction.',
    cat: 'Transactions & Storage · Module 5.3',
    complexity: 'Write: O(1) sequential append; Point Read: O(L) with per-SSTable Bloom filters',
    trackId: 'track-5',
    moduleId: 'm15',
    relatedSlug: 'lsm-trees-memtable-sstable-compaction'
  },
  {
    term: 'MVCC (Multi-Version Concurrency Control)',
    def: 'Concurrency control architecture where updates create new timestamped/XID-tagged tuple versions instead of overwriting data in place, allowing read queries to inspect a consistent point-in-time snapshot without acquiring read locks.',
    cat: 'Transactions · Module 5.2',
    complexity: 'Snapshot Visibility Check: O(1) per tuple version',
    trackId: 'track-5',
    moduleId: 'm14',
    relatedSlug: 'multi-version-concurrency-control-mvcc'
  },
  {
    term: 'Phantom Read & Next-Key Locking',
    def: 'Concurrency anomaly where a transaction re-executes a range query and observes newly inserted "phantom" rows satisfying the predicate. Prevented in InnoDB via Next-Key Locks (record lock + gap lock on the B+Tree interval) or in PostgreSQL via Serializable Snapshot Isolation (SIREAD predicate locks).',
    cat: 'Transactions · Module 5.1',
    complexity: 'Gap/Predicate Lock Check: O(log_B N) on B+Tree range',
    trackId: 'track-5',
    moduleId: 'm13',
    relatedSlug: 'read-phenomena-dirty-nonrepeatable-phantom'
  },
  {
    term: 'Relational Algebra (σ, π, ⋈, ×, ∪, −, ÷)',
    def: 'Edgar Codd\'s procedural algebraic foundation for SQL consisting of Selection (σ), Projection (π), Rename (ρ), Cartesian Product (×), Theta/Equi/Natural Join (⋈), Union (∪), Set Difference (−), and Relational Division (÷).',
    cat: 'Relational Foundations · Module 1.3',
    complexity: 'Algebraic Equivalence Rewrites: Predicate Pushdown σ_p(R ⋈ S) ≡ (σ_p(R)) ⋈ S',
    trackId: 'track-1',
    moduleId: 'm03',
    relatedSlug: 'relational-algebra-set-theory'
  },
  {
    term: 'SARGable Predicate (Search Argument Able)',
    def: 'A WHERE predicate structured so the query optimizer can convert it directly into B+Tree start/stop search keys (e.g., `created_at >= \'2026-01-01\'`), as opposed to wrapping the indexed column in an expression (`YEAR(created_at) = 2026`) which forces a full scan.',
    cat: 'Storage & Indexing · Module 4.2',
    complexity: 'SARGable: O(log_B N + K/B) index range scan vs Non-SARGable: O(N) full scan',
    trackId: 'track-4',
    moduleId: 'm11',
    relatedSlug: 'sargability-functions-on-columns'
  },
  {
    term: 'Slowly Changing Dimension Type 2 (SCD Type 2)',
    def: 'Dimensional data warehouse pattern that tracks full historical attribute changes by inserting a new dimension row with a fresh surrogate key, setting `[effective_from, effective_to)` validity timestamps, and flipping `is_current` flags.',
    cat: 'Data Modeling · Module 3.2',
    complexity: 'Point-in-Time As-Of Join: Fact.ts BETWEEN Dim.effective_from AND Dim.effective_to',
    trackId: 'track-3',
    moduleId: 'm08',
    relatedSlug: 'slowly-changing-dimensions-scd'
  },
  {
    term: 'Three-Valued Logic (3VL: TRUE, FALSE, UNKNOWN)',
    def: 'SQL\'s truth system where comparisons with NULL yield UNKNOWN. Under 3VL: `TRUE OR UNKNOWN = TRUE`, `FALSE AND UNKNOWN = FALSE`, and `NOT UNKNOWN = UNKNOWN`. Crucially, `WHERE` keeps only `TRUE` while `CHECK` constraints pass on both `TRUE` and `UNKNOWN`.',
    cat: 'Relational Foundations · Module 1.1',
    complexity: 'Bitwise Null-Bitmap + 2-bit Truth Evaluation: O(1) per predicate',
    trackId: 'track-1',
    moduleId: 'm01',
    relatedSlug: 'boolean-logic-three-valued-null'
  },
  {
    term: 'Vectorized Execution Engine (Data-Centric vs Volcano Iterator)',
    def: 'Modern query execution architecture (DuckDB, ClickHouse, Velox) where `Next()` returns a cache-resident columnar batch of 1024–2048 values rather than a single tuple, amortizing virtual function call overhead and enabling tight SIMD loops.',
    cat: 'Distributed & OLAP · Module 6.1',
    complexity: '1 virtual call per 2048 values; 10–50× lower CPU instruction count than tuple-at-a-time Volcano',
    trackId: 'track-6',
    moduleId: 'm16',
    relatedSlug: 'late-materialization-simd-vectorization'
  },
  {
    term: 'Write Skew Anomaly (Snapshot Isolation Breakdown)',
    def: 'Classic anomaly under Snapshot Isolation (REPEATABLE READ in PostgreSQL) where two concurrent transactions read overlapping sets of rows, check an invariant (e.g., at least 1 doctor on call), and update disjoint rows, violating the global invariant without triggering a first-committer-wins write conflict.',
    cat: 'Transactions · Module 5.1',
    complexity: 'Prevented via SELECT ... FOR UPDATE or SERIALIZABLE (SSI rw-antidependency detection)',
    trackId: 'track-5',
    moduleId: 'm13',
    relatedSlug: 'write-anomalies-lost-update-write-skew'
  },
  {
    term: 'Zone Maps (Min/Max Block Pruning / BRIN)',
    def: 'Lightweight per-block or per-Row-Group metadata storing `{min_value, max_value, null_count}` for each column. Allows the scan engine to skip entire 1MB–128MB physical blocks whenever the query predicate falls outside `[min_value, max_value]`.',
    cat: 'Distributed & OLAP · Module 6.1',
    complexity: 'Metadata Size: ~16–32 bytes per 64K–1M rows (~0.01% overhead)',
    trackId: 'track-6',
    moduleId: 'm16',
    relatedSlug: 'zone-maps-min-max-pruning-bloom'
  }
];

const glossaryItems = [];
for (const u of allUnits) {
  const specs = getUnitDomainSpecs(u);
  const shortTrack = u.trackTitle.split('&')[0].trim();
  const cat = `${shortTrack} · Module ${u.moduleNumber}`;
  const fullDef = `${u.overview} Core Invariant & Mechanics: ${specs.invariant} Storage & Production Reality: ${specs.hardware}`;
  glossaryItems.push({
    term: u.title,
    def: fullDef,
    definition: fullDef,
    cat,
    category: cat,
    complexity: specs.complexity,
    trackId: u.trackId,
    moduleId: u.moduleId,
    relatedSlug: u.slug
  });
}
for (const ex of extraGlossaryTerms) {
  glossaryItems.push({
    term: ex.term,
    def: ex.def,
    definition: ex.def,
    cat: ex.cat,
    category: ex.cat,
    complexity: ex.complexity,
    trackId: ex.trackId,
    moduleId: ex.moduleId,
    relatedSlug: ex.relatedSlug
  });
}
glossaryItems.sort((a, b) => a.term.localeCompare(b.term));

const glossaryJs = `/**
 * SQL In Depth — Rigorous Relational, Analytical, Storage Engine & Distributed DBMS Glossary
 * Contains ${glossaryItems.length} alphabetically sorted definitions across all 6 tracks and 18 modules.
 * Exposes window.GLOSSARY_DATA and window.GLOSSARY.
 */
(function(root) {
  'use strict';

  var GLOSSARY_DATA = ${JSON.stringify(glossaryItems, null, 2)};

  root.GLOSSARY_DATA = GLOSSARY_DATA;
  root.GLOSSARY = GLOSSARY_DATA;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GLOSSARY_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(DATA_DIR, 'glossary.js'), glossaryJs, 'utf8');
console.log(`Wrote data/glossary.js (${glossaryItems.length} terms)`);

// ============================================================================
// 2. Generate data/srs-cards.js (540 Cards: 3 per unit)
// ============================================================================
const srsCards = [];
allUnits.forEach((u, idx) => {
  const numStr = String(idx + 1).padStart(3, '0');
  const specs = getUnitDomainSpecs(u);
  const shortTrack = `Track ${u.trackNumber} · ${u.trackTitle.split('&')[0].trim()}`;

  srsCards.push({
    id: `srs-${numStr}-1-complexity`,
    type: 'complexity',
    prompt: `[${u.moduleNumber}] What are the exact execution/I/O cost bounds and primary optimizer trade-offs for "${u.title}"?`,
    front: `[${u.moduleNumber}] What are the exact execution/I/O cost bounds and primary optimizer trade-offs for "${u.title}"?`,
    answer: `Cost & I/O Bound: ${specs.complexity}. Overview: ${u.overview}`,
    back: `Cost & I/O Bound: ${specs.complexity}. Overview: ${u.overview}`,
    category: shortTrack,
    track: u.trackId,
    trackId: u.trackId,
    moduleId: u.moduleId,
    topicSlug: u.slug,
    slug: u.slug,
    unitSlug: u.slug,
    unitTitle: u.title,
    difficulty: u.difficulty || 'Intermediate'
  });

  srsCards.push({
    id: `srs-${numStr}-2-invariant`,
    type: 'invariant',
    prompt: `[${u.moduleNumber}] State the core relational, algebraic, or transactional invariant that guarantees correctness in "${u.title}".`,
    front: `[${u.moduleNumber}] State the core relational, algebraic, or transactional invariant that guarantees correctness in "${u.title}".`,
    answer: `${specs.invariant} (Cost Bound: ${specs.complexity})`,
    back: `${specs.invariant} (Cost Bound: ${specs.complexity})`,
    category: shortTrack,
    track: u.trackId,
    trackId: u.trackId,
    moduleId: u.moduleId,
    topicSlug: u.slug,
    slug: u.slug,
    unitSlug: u.slug,
    unitTitle: u.title,
    difficulty: u.difficulty || 'Intermediate'
  });

  srsCards.push({
    id: `srs-${numStr}-3-hardware`,
    type: 'hardware',
    prompt: `[${u.moduleNumber}] What is the key 8KB page layout, B+Tree/WAL reality, or production pitfall for "${u.title}"?`,
    front: `[${u.moduleNumber}] What is the key 8KB page layout, B+Tree/WAL reality, or production pitfall for "${u.title}"?`,
    answer: `${specs.hardware}`,
    back: `${specs.hardware}`,
    category: shortTrack,
    track: u.trackId,
    trackId: u.trackId,
    moduleId: u.moduleId,
    topicSlug: u.slug,
    slug: u.slug,
    unitSlug: u.slug,
    unitTitle: u.title,
    difficulty: u.difficulty || 'Intermediate'
  });
});

const srsJs = `/**
 * SQL In Depth — SuperMemo SM-2 Spaced Repetition Flashcard Deck (${srsCards.length} Cards)
 * 3 cards per unit across all 180 curriculum units:
 *   1. Execution & I/O Cost Bounds ('complexity')
 *   2. Relational, Algebraic & Transactional Invariants ('invariant')
 *   3. 8KB Page Layout, B+Tree/WAL Mechanics & Production Pitfalls ('hardware')
 * Exposes window.SRS_CARDS_DATA and window.SRS_CARDS.
 */
(function(root) {
  'use strict';

  var SRS_CARDS_DATA = ${JSON.stringify(srsCards, null, 2)};

  root.SRS_CARDS_DATA = SRS_CARDS_DATA;
  root.SRS_CARDS = SRS_CARDS_DATA;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SRS_CARDS_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(DATA_DIR, 'srs-cards.js'), srsJs, 'utf8');
console.log(`Wrote data/srs-cards.js (${srsCards.length} cards)`);

// ============================================================================
// 3. Generate data/roadmap.js
// ============================================================================
const trackColors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const roadmapStages = TRACKS.map((t, idx) => ({
  id: `stage-${t.number}`,
  number: t.number,
  trackId: t.id,
  title: t.title,
  summary: t.summary,
  hours: `${t.hours} hrs`,
  color: trackColors[idx] || '#3b82f6',
  unitCount: t.modules.reduce((acc, m) => acc + m.units.length, 0)
}));

const roadmapNodes = [
  // Stage 1
  { id: 'n-rel-model', label: 'Relational Model & SELECT', slug: 'select-projection-aliases', stage: 1, trackId: 'track-1', moduleId: 'm01', type: 'simulator', difficulty: 'Beginner', x: 160, y: 80, prerequisites: [], description: 'Relations, tuples, SQL execution order (FROM before SELECT), and SARGable WHERE predicates.' },
  { id: 'n-null-3vl', label: 'Three-Valued NULL Logic', slug: 'boolean-logic-three-valued-null', stage: 1, trackId: 'track-1', moduleId: 'm01', type: 'simulator', difficulty: 'Beginner', x: 520, y: 80, prerequisites: ['n-rel-model'], description: 'TRUE/FALSE/UNKNOWN truth tables, COALESCE, IS DISTINCT FROM, and why NOT IN fails on NULLs.' },
  { id: 'n-ddl-keys', label: 'DDL, PKs (UUIDv7) & FKs', slug: 'primary-keys-surrogate-vs-natural', stage: 1, trackId: 'track-1', moduleId: 'm02', type: 'lesson', difficulty: 'Beginner', x: 160, y: 200, prerequisites: ['n-rel-model'], description: 'CREATE TABLE, B-Tree locality of UUIDv7 vs UUIDv4, foreign key CASCADE/RESTRICT, and CHECK constraints.' },
  { id: 'n-dml-upsert', label: 'Idempotent Upserts & MERGE', slug: 'upsert-on-conflict-merge', stage: 1, trackId: 'track-1', moduleId: 'm02', type: 'build', difficulty: 'Intermediate', x: 520, y: 200, prerequisites: ['n-ddl-keys', 'n-null-3vl'], description: 'Multi-row INSERT ... RETURNING, ON CONFLICT DO UPDATE, MERGE, and zero-downtime schema migrations.' },
  { id: 'n-joins-outer', label: 'INNER / LEFT / FULL Joins', slug: 'left-right-full-outer-joins', stage: 1, trackId: 'track-1', moduleId: 'm03', type: 'simulator', difficulty: 'Intermediate', x: 160, y: 320, prerequisites: ['n-ddl-keys', 'n-null-3vl'], description: 'Relational algebra joins, NULL extension on outer joins, and the ON vs WHERE filter trap.' },
  { id: 'n-semi-anti', label: 'Semi-Joins, Anti-Joins & Sets', slug: 'semi-joins-anti-joins', stage: 1, trackId: 'track-1', moduleId: 'm03', type: 'build', difficulty: 'Intermediate', x: 520, y: 320, prerequisites: ['n-joins-outer'], description: 'EXISTS / NOT EXISTS, self-joins, UNION ALL vs UNION, and multi-table order reconciliation.' },

  // Stage 2
  { id: 'n-group-agg', label: 'GROUP BY & Conditional FILTER', slug: 'group-by-execution-mechanics', stage: 2, trackId: 'track-2', moduleId: 'm04', type: 'simulator', difficulty: 'Intermediate', x: 160, y: 460, prerequisites: ['n-joins-outer'], description: 'HashAggregate vs GroupAggregate, WHERE vs HAVING, FILTER (WHERE ...), and ROLLUP/CUBE.' },
  { id: 'n-fanout-trap', label: 'Join Fanout & Chasm Traps', slug: 'join-fanout-chasm-traps', stage: 2, trackId: 'track-2', moduleId: 'm04', type: 'build', difficulty: 'Intermediate', x: 520, y: 460, prerequisites: ['n-group-agg', 'n-semi-anti'], description: 'Why joining two 1:N child tables inflates SUM/COUNT and how pre-aggregated CTEs prevent double-counting.' },
  { id: 'n-subquery-lateral', label: 'Correlated & LATERAL Joins', slug: 'lateral-joins-cross-apply', stage: 2, trackId: 'track-2', moduleId: 'm05', type: 'lesson', difficulty: 'Intermediate', x: 160, y: 580, prerequisites: ['n-semi-anti', 'n-group-agg'], description: 'Subquery unnesting, LATERAL Top-N-per-group, and CTE inlining vs MATERIALIZED fences.' },
  { id: 'n-recursive-cte', label: 'Recursive CTEs & Graph SQL', slug: 'recursive-ctes-hierarchies', stage: 2, trackId: 'track-2', moduleId: 'm05', type: 'simulator', difficulty: 'Advanced', x: 520, y: 580, prerequisites: ['n-subquery-lateral'], description: 'WITH RECURSIVE fixpoint worktables, hierarchical RBAC, Bill-of-Materials, and cycle detection.' },
  { id: 'n-window-frames', label: 'Window Functions & Framing', slug: 'window-frames-rows-range-groups', stage: 2, trackId: 'track-2', moduleId: 'm06', type: 'simulator', difficulty: 'Intermediate', x: 160, y: 700, prerequisites: ['n-group-agg'], description: 'OVER (PARTITION BY ... ORDER BY ...), ROW_NUMBER/RANK, LAG/LEAD, and ROWS vs RANGE vs GROUPS frames.' },
  { id: 'n-gaps-islands', label: 'Gaps & Islands Sessionization', slug: 'gaps-and-islands-sessionization', stage: 2, trackId: 'track-2', moduleId: 'm06', type: 'build', difficulty: 'Advanced', x: 520, y: 700, prerequisites: ['n-window-frames', 'n-subquery-lateral'], description: 'Clickstream sessionization, consecutive streak grouping, and real-time sliding-window velocity detection.' },

  // Stage 3
  { id: 'n-norm-bcnf', label: 'Functional Dependencies & BCNF', slug: 'boyce-codd-fourth-fifth-normal-form', stage: 3, trackId: 'track-3', moduleId: 'm07', type: 'simulator', difficulty: 'Intermediate', x: 160, y: 840, prerequisites: ['n-ddl-keys'], description: 'Armstrong axioms, 1NF → 2NF → 3NF → BCNF → 4NF/5NF, and lossless-join decomposition.' },
  { id: 'n-star-scd2', label: 'Star Schema & SCD Type 2', slug: 'slowly-changing-dimensions-scd', stage: 3, trackId: 'track-3', moduleId: 'm08', type: 'simulator', difficulty: 'Intermediate', x: 520, y: 840, prerequisites: ['n-norm-bcnf', 'n-fanout-trap'], description: 'Kimball dimensional modeling, fact grain, SCD Type 2 history intervals, and temporal tables.' },
  { id: 'n-jsonb-gin', label: 'JSONB, Arrays & GIN Indexes', slug: 'json-semi-structured-hybrid-schemas', stage: 3, trackId: 'track-3', moduleId: 'm08', type: 'simulator', difficulty: 'Advanced', x: 160, y: 960, prerequisites: ['n-norm-bcnf'], description: 'Binary JSONB AST storage, SQL/JSON path queries, Full-Text Search tsvector, and GIN inverted indexes.' },
  { id: 'n-temporal-hier', label: 'Cohorts, Funnels & Temporal SQL', slug: 'cohort-retention-matrix-sql', stage: 3, trackId: 'track-3', moduleId: 'm09', type: 'build', difficulty: 'Advanced', x: 520, y: 960, prerequisites: ['n-jsonb-gin', 'n-recursive-cte'], description: 'Date spines, cohort retention matrices, Allen interval algebra, GiST exclusion constraints, and materialized views.' },

  // Stage 4
  { id: 'n-slotted-page', label: '8KB Slotted Pages & Buffer Pool', slug: 'slotted-page-layout-8kb-anatomy', stage: 4, trackId: 'track-5', moduleId: 'm15', type: 'simulator', difficulty: 'Advanced', x: 160, y: 1100, prerequisites: ['n-ddl-keys'], description: '8KB slotted page headers, line pointers, MVCC tuple headers, TOAST, Clock-Sweep buffer pool, and OS fsync.' },
  { id: 'n-bplustree', label: 'B+Tree Internals & Splits', slug: 'btree-bplustree-internal-anatomy', stage: 4, trackId: 'track-4', moduleId: 'm10', type: 'simulator', difficulty: 'Advanced', x: 520, y: 1100, prerequisites: ['n-slotted-page'], description: 'B+Tree branching factor, leaf sibling pointers, leftmost-prefix rule, covering INCLUDE indexes, and BRIN/GIN.' },
  { id: 'n-cost-planner', label: 'Cost Planner & Join Algorithms', slug: 'hash-join-build-probe-grace', stage: 4, trackId: 'track-4', moduleId: 'm12', type: 'simulator', difficulty: 'Advanced', x: 160, y: 1220, prerequisites: ['n-bplustree', 'n-joins-outer'], description: 'EXPLAIN ANALYZE BUFFERS, MCV/histogram selectivity, and Nested Loop vs Hash Join vs Sort-Merge Join.' },
  { id: 'n-keyset-tuning', label: 'Keyset Pagination & Plan Tuning', slug: 'keyset-cursor-pagination-vs-offset', stage: 4, trackId: 'track-6', moduleId: 'm18', type: 'build', difficulty: 'Staff', x: 520, y: 1220, prerequisites: ['n-cost-planner'], description: 'Replacing O(N) OFFSET scans with O(log N) seek cursors, extended multivariate statistics, and plan diagnosis.' },

  // Stage 5
  { id: 'n-wal-aries', label: 'WAL & ARIES Crash Recovery', slug: 'aries-crash-recovery-analysis-redo-undo', stage: 5, trackId: 'track-5', moduleId: 'm15', type: 'simulator', difficulty: 'Advanced', x: 160, y: 1360, prerequisites: ['n-slotted-page'], description: 'STEAL/NO-FORCE policy, LSN chaining, ARIES Analysis/Redo/Undo passes, Group Commit, and Doublewrite.' },
  { id: 'n-mvcc-ssi', label: 'MVCC Snapshots, Write Skew & SSI', slug: 'serializable-2pl-vs-ssi', stage: 5, trackId: 'track-5', moduleId: 'm13', type: 'simulator', difficulty: 'Staff', x: 520, y: 1360, prerequisites: ['n-wal-aries'], description: 'PostgreSQL xmin/xmax vs InnoDB undo logs, Snapshot Isolation, Write Skew, and Serializable Snapshot Isolation.' },
  { id: 'n-locks-deadlock', label: 'Lock Hierarchy, Deadlocks & Queues', slug: 'row-level-locks-for-update-skip-locked', stage: 5, trackId: 'track-5', moduleId: 'm14', type: 'build', difficulty: 'Staff', x: 340, y: 1480, prerequisites: ['n-mvcc-ssi', 'n-bplustree'], description: 'Intention locks (IS/IX/SIX), Next-Key gap locks, wait-for graph deadlock detection, and SKIP LOCKED queues.' },

  // Stage 6
  { id: 'n-columnar-simd', label: 'Columnar PAX, Parquet & SIMD', slug: 'late-materialization-simd-vectorization', stage: 6, trackId: 'track-6', moduleId: 'm16', type: 'simulator', difficulty: 'Advanced', x: 160, y: 1620, prerequisites: ['n-cost-planner', 'n-star-scd2'], description: 'NSM vs DSM vs PAX, Parquet row groups, RLE/Dictionary/Bit-Packing, Zone Maps, and DuckDB vectorized execution.' },
  { id: 'n-sharding-newsql', label: 'Replication, Sharding & NewSQL', slug: 'distributed-sql-spanner-cockroachdb', stage: 6, trackId: 'track-6', moduleId: 'm17', type: 'simulator', difficulty: 'Staff', x: 520, y: 1620, prerequisites: ['n-wal-aries', 'n-locks-deadlock'], description: 'Raft/Paxos replication, Consistent Hashing, 2PC vs Saga/Outbox CDC, LSM-Trees, and Spanner/CockroachDB.' },
  { id: 'n-prod-dbre', label: 'Pooling, Partitioning & RLS Security', slug: 'connection-pooling-pgbouncer-proxies', stage: 6, trackId: 'track-6', moduleId: 'm17', type: 'milestone', difficulty: 'Staff', x: 340, y: 1740, prerequisites: ['n-columnar-simd', 'n-sharding-newsql', 'n-keyset-tuning'], description: 'PgBouncer transaction pooling, declarative partitioning, Row-Level Security (RLS), PITR backups, and SEV-1 runbooks.' }
];

const roadmapEdges = [];
for (const n of roadmapNodes) {
  for (const p of n.prerequisites) {
    roadmapEdges.push({
      id: `e-${p}-${n.id}`,
      source: p,
      target: n.id,
      label: 'requires'
    });
  }
}

function makeStepsFromSlugs(slugs) {
  return slugs.map(slug => {
    const u = unitBySlug[slug];
    return {
      type: u && u.type === 'build' ? 'build' : 'topic',
      slug,
      id: slug,
      title: u ? `${u.moduleNumber}: ${u.title}` : slug
    };
  });
}

const analyticsSlugs = [
  ...allUnits.filter(u => ['m01', 'm03', 'm04', 'm05', 'm06', 'm08'].includes(u.moduleId)).map(u => u.slug)
].slice(0, 48);

const backendOltpSlugs = [
  ...allUnits.filter(u => ['m01', 'm02', 'm03', 'm07', 'm09', 'm11', 'm12', 'm14', 'm15', 'm18'].includes(u.moduleId)).map(u => u.slug)
].slice(0, 60);

const dataEngSlugs = [
  ...allUnits.filter(u => ['m04', 'm05', 'm06', 'm08', 'm10', 'm11', 'm12', 'm16', 'm17'].includes(u.moduleId)).map(u => u.slug)
].slice(0, 65);

const fullSlugs = allUnits.map(u => u.slug);

const roadmapPaths = [
  {
    id: 'sql-analytics-48',
    title: 'Analytical SQL, Joins, CTEs & Window Mastery (48 Units)',
    role: 'Data Analyst / Analytics Engineer / BI Architect',
    targetRole: 'Senior Analytics Engineer (L4/L5)',
    estimatedWeeks: 5,
    estimatedHours: '42 hrs',
    difficulty: 'Beginner → Advanced',
    xpReward: 2400,
    icon: 'bar-chart-2',
    tagline: 'Master relational joins, Three-Valued NULL logic, fanout-free aggregations, recursive CTEs, window frames, and Kimball Star Schemas.',
    description: 'A focused 48-unit track engineered for analysts, data scientists, and analytics engineers who want complete mastery of multi-table joins, GROUPING SETS, recursive CTEs, window framing, sessionization, and dimensional warehouse modeling.',
    unitCount: analyticsSlugs.length,
    unitSlugs: analyticsSlugs,
    steps: makeStepsFromSlugs(analyticsSlugs)
  },
  {
    id: 'backend-oltp-60',
    title: 'Backend Engineer & High-Concurrency OLTP Track (60 Units)',
    role: 'Backend & Full-Stack Software Engineer',
    targetRole: 'Senior Backend Engineer (L5/L6)',
    estimatedWeeks: 7,
    estimatedHours: '55 hrs',
    difficulty: 'Intermediate → Staff',
    xpReward: 3000,
    icon: 'cpu',
    tagline: 'Design normalized schemas, eliminate N+1 and non-SARGable queries, master B+Tree composite indexing, MVCC isolation, and SKIP LOCKED queues.',
    description: 'Everything a production backend engineer needs to build rock-solid transactional systems: UUIDv7 primary keys, idempotent upserts, BCNF normalization, JSONB GIN indexing, B+Tree composite design, EXPLAIN ANALYZE tuning, MVCC write-skew prevention, and PgBouncer pooling.',
    unitCount: backendOltpSlugs.length,
    unitSlugs: backendOltpSlugs,
    steps: makeStepsFromSlugs(backendOltpSlugs)
  },
  {
    id: 'data-platform-65',
    title: 'Data Platform, Lakehouse & Columnar Internals (65 Units)',
    role: 'Data Engineer / Analytics Platform Engineer',
    targetRole: 'Staff Data Engineer (L6)',
    estimatedWeeks: 8,
    estimatedHours: '62 hrs',
    difficulty: 'Intermediate → Staff',
    xpReward: 3250,
    icon: 'layers',
    tagline: 'Go from analytical SQL and Kimball Star Schemas down to 8KB pages, Parquet PAX storage, SIMD vectorized execution, and Outbox CDC.',
    description: 'Bridges advanced analytical SQL with physical storage internals: window functions, SCD Type 2, slotted pages, B+Tree/BRIN indexes, cost-based join planning, Parquet/Iceberg lakehouses, DuckDB/ClickHouse vectorized execution, and distributed sharding.',
    unitCount: dataEngSlugs.length,
    unitSlugs: dataEngSlugs,
    steps: makeStepsFromSlugs(dataEngSlugs)
  },
  {
    id: 'staff-db-architect-180',
    title: 'Complete SQL & Database Internals Mastery (All 180 Units)',
    role: 'Database Architect / Principal Systems Engineer / DBRE',
    targetRole: 'Staff / Principal Architect (L6/L7+)',
    estimatedWeeks: 16,
    estimatedHours: '180 hrs',
    difficulty: 'Beginner → Principal',
    xpReward: 9000,
    icon: 'award',
    tagline: 'The complete 18-module journey from Codd\'s relational algebra and window functions to B+Trees, ARIES WAL recovery, SSI, and Spanner.',
    description: 'Complete all 180 curriculum units, 18 from-scratch storage & query engine builds, 180 interactive WASM SQL labs, and 12 production incident challenges across all 6 tracks.',
    unitCount: fullSlugs.length,
    unitSlugs: fullSlugs,
    steps: makeStepsFromSlugs(fullSlugs)
  }
];

const moduleIcons = ['table', 'shield', 'git-merge', 'bar-chart-2', 'git-branch', 'activity', 'check-circle', 'layers', 'file-text', 'hard-drive', 'search', 'cpu', 'refresh-cw', 'eye', 'lock', 'zap', 'globe', 'server'];
const modulePrereqs = {
  m01: [], m02: ['m01'], m03: ['m01', 'm02'],
  m04: ['m03'], m05: ['m03', 'm04'], m06: ['m04', 'm05'],
  m07: ['m02', 'm03'], m08: ['m04', 'm07'], m09: ['m05', 'm07'],
  m10: ['m02'], m11: ['m03', 'm10'], m12: ['m04', 'm11'],
  m13: ['m10'], m14: ['m10', 'm13'], m15: ['m11', 'm14'],
  m16: ['m08', 'm12'], m17: ['m13', 'm15'], m18: ['m12', 'm15', 'm17']
};

const roadmapModules = Object.values(moduleById).map((m, idx) => ({
  id: m.id,
  number: m.number,
  trackId: m.trackId,
  trackTitle: m.trackTitle,
  title: m.title,
  difficulty: idx < 3 ? 'Beginner → Intermediate' : (idx < 9 ? 'Intermediate → Advanced' : 'Advanced → Staff'),
  unitCount: m.units.length,
  builds: m.units.filter(u => u.type === 'build').map(u => u.slug),
  simulators: m.units.slice(0, 3).map(u => u.slug),
  summary: m.summary,
  icon: moduleIcons[idx] || 'database',
  prerequisites: modulePrereqs[m.id] || []
}));

const roadmapData = {
  stages: roadmapStages,
  nodes: roadmapNodes,
  edges: roadmapEdges,
  paths: roadmapPaths,
  modules: roadmapModules
};

const roadmapJs = `/**
 * SQL In Depth — Prerequisite DAG, 18-Module Progression & 4 Curated Study Tracks
 * Exposes window.ROADMAP_DATA with stages, nodes, edges, paths, careerPaths, and modules.
 */
(function(root) {
  'use strict';

  var ROADMAP_DATA = ${JSON.stringify(roadmapData, null, 2)};

  ROADMAP_DATA.careerPaths = ROADMAP_DATA.paths;
  root.ROADMAP_DATA = ROADMAP_DATA;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ROADMAP_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(DATA_DIR, 'roadmap.js'), roadmapJs, 'utf8');
console.log(`Wrote data/roadmap.js (${roadmapNodes.length} nodes, ${roadmapPaths.length} paths)`);
