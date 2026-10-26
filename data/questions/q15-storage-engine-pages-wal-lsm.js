// SQL In Depth — Question Bank M15: Storage Engine Internals: Pages, Buffer Pool, WAL & LSM-Trees
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["slotted-page-layout-8kb-anatomy"] = [
  {
    "id": "slotted-page-layout-8kb-anatomy-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST?",
    "options": [
      "Why databases use slotted pages: line pointer arrays growing downward, tuple payloads growing upward, indirection for compaction, and out-of-line TOAST storage.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why databases use slotted pages: line pointer arrays growing downward, tuple payloads growing upward, indirection for compaction, and out-of-line TOAST storage. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "slotted-page-layout-8kb-anatomy-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST (slotted-page, 8kb-page, toast), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST (slotted-page, 8kb-page, toast), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "slotted-page-layout-8kb-anatomy-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "slotted-page-layout-8kb-anatomy-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
window.QUESTION_BANK["heap-files-hot-updates-fillfactor"] = [
  {
    "id": "heap-files-hot-updates-fillfactor-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor?",
    "options": [
      "How updating a non-indexed column with enough free space on the same 8KB page creates a Heap-Only Tuple (HOT) chain, bypassing all secondary index writes.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How updating a non-indexed column with enough free space on the same 8KB page creates a Heap-Only Tuple (HOT) chain, bypassing all secondary index writes. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "heap-files-hot-updates-fillfactor-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor (hot-updates, fillfactor, heap-files), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor (hot-updates, fillfactor, heap-files), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "heap-files-hot-updates-fillfactor-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "heap-files-hot-updates-fillfactor-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
window.QUESTION_BANK["buffer-pool-clock-sweep-lru-k"] = [
  {
    "id": "buffer-pool-clock-sweep-lru-k-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction?",
    "options": [
      "Managing in-memory page frames, why sequential scans pollute naive LRU caches, and how Clock-Sweep / LRU-K + ring buffers protect the hot working set.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Managing in-memory page frames, why sequential scans pollute naive LRU caches, and how Clock-Sweep / LRU-K + ring buffers protect the hot working set. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "buffer-pool-clock-sweep-lru-k-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction (buffer-pool, clock-sweep, lru-k), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction (buffer-pool, clock-sweep, lru-k), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "buffer-pool-clock-sweep-lru-k-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "buffer-pool-clock-sweep-lru-k-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
window.QUESTION_BANK["write-ahead-logging-wal-lsn"] = [
  {
    "id": "write-ahead-logging-wal-lsn-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit?",
    "options": [
      "The fundamental WAL invariant (log record must reach stable disk before dirty data page), page LSN tracking, and batching concurrent commits into one fsync.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. The fundamental WAL invariant (log record must reach stable disk before dirty data page), page LSN tracking, and batching concurrent commits into one fsync. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "write-ahead-logging-wal-lsn-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit (wal, lsn, group-commit), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit (wal, lsn, group-commit), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "write-ahead-logging-wal-lsn-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "write-ahead-logging-wal-lsn-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
window.QUESTION_BANK["checkpoints-dirty-page-flushing"] = [
  {
    "id": "checkpoints-dirty-page-flushing-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes)?",
    "options": [
      "Bounding crash recovery time with spread checkpoints, and why the first modification to an 8KB page after a checkpoint logs a Full Page Image (FPI).",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Bounding crash recovery time with spread checkpoints, and why the first modification to an 8KB page after a checkpoint logs a Full Page Image (FPI). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "checkpoints-dirty-page-flushing-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) (checkpoints, full-page-writes, dirty-pages), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) (checkpoints, full-page-writes, dirty-pages), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "checkpoints-dirty-page-flushing-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "checkpoints-dirty-page-flushing-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes) across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
window.QUESTION_BANK["aries-crash-recovery-analysis-redo-undo"] = [
  {
    "id": "aries-crash-recovery-analysis-redo-undo-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes?",
    "options": [
      "Walking step-by-step through the three passes of ARIES recovery: reconstructing active transactions (Analysis), repeating history (Redo), and rolling back losers (Undo).",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Walking step-by-step through the three passes of ARIES recovery: reconstructing active transactions (Analysis), repeating history (Redo), and rolling back losers (Undo). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "aries-crash-recovery-analysis-redo-undo-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes (aries, crash-recovery, redo-undo), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes (aries, crash-recovery, redo-undo), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "aries-crash-recovery-analysis-redo-undo-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "aries-crash-recovery-analysis-redo-undo-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
window.QUESTION_BANK["lsm-trees-memtable-sstable-compaction"] = [
  {
    "id": "lsm-trees-memtable-sstable-compaction-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction?",
    "options": [
      "Turning random writes into sequential appends via an in-memory skip-list MemTable, immutable sorted SSTable runs, Bloom filters, and leveled/tiered compaction.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Turning random writes into sequential appends via an in-memory skip-list MemTable, immutable sorted SSTable runs, Bloom filters, and leveled/tiered compaction. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "lsm-trees-memtable-sstable-compaction-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction (lsm-tree, sstable, compaction), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction (lsm-tree, sstable, compaction), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "lsm-trees-memtable-sstable-compaction-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "lsm-trees-memtable-sstable-compaction-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
window.QUESTION_BANK["btree-vs-lsm-read-write-space-amplification"] = [
  {
    "id": "btree-vs-lsm-read-write-space-amplification-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification?",
    "options": [
      "Quantifying the fundamental storage trade-off triangle: optimizing any two of Read Overhead, Update (Write) Overhead, and Memory/Space Overhead penalizes the third.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Quantifying the fundamental storage trade-off triangle: optimizing any two of Read Overhead, Update (Write) Overhead, and Memory/Space Overhead penalizes the third. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "btree-vs-lsm-read-write-space-amplification-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification (rum-conjecture, btree-vs-lsm, storage-engines), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification (rum-conjecture, btree-vs-lsm, storage-engines), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "btree-vs-lsm-read-write-space-amplification-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "btree-vs-lsm-read-write-space-amplification-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
window.QUESTION_BANK["case-uber-postgres-to-mysql-storage"] = [
  {
    "id": "case-uber-postgres-to-mysql-storage-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage?",
    "options": [
      "Comparing secondary index write amplification, replica lag, and buffer pool semantics between heap-referenced ctids and primary-key-referenced clustered trees.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Comparing secondary index write amplification, replica lag, and buffer pool semantics between heap-referenced ctids and primary-key-referenced clustered trees. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-uber-postgres-to-mysql-storage-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage (postgres-vs-mysql, storage-architecture, write-amplification), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage (postgres-vs-mysql, storage-architecture, write-amplification), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "case-uber-postgres-to-mysql-storage-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "case-uber-postgres-to-mysql-storage-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
window.QUESTION_BANK["build-slotted-page-wal-engine"] = [
  {
    "id": "build-slotted-page-wal-engine-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator?",
    "options": [
      "Implement an 8KB slotted page allocator and an ARIES-style Write-Ahead Log manager that replays Redo and rolls back uncommitted Undo records after a simulated crash.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Implement an 8KB slotted page allocator and an ARIES-style Write-Ahead Log manager that replays Redo and rolls back uncommitted Undo records after a simulated crash. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-slotted-page-wal-engine-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator (build, slotted-page, aries-recovery), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator (build, slotted-page, aries-recovery), how does the engine handle NULL values and logical evaluation order?",
    "options": [
      "Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.",
      "SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.",
      "NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.",
      "The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index."
    ],
    "answer": 0,
    "explanation": "Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections."
  },
  {
    "id": "build-slotted-page-wal-engine-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "options": [
      "Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.",
      "Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.",
      "Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.",
      "Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read."
    ],
    "answer": 0,
    "explanation": "Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency."
  },
  {
    "id": "build-slotted-page-wal-engine-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator across OLTP and OLAP workloads?",
    "options": [
      "Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.",
      "Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.",
      "Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.",
      "Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance."
    ],
    "answer": 0,
    "explanation": "Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint."
  }
];
