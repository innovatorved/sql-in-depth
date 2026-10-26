// SQL In Depth — Question Bank M14: Locking, MVCC Internals & Vacuuming
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["multi-version-concurrency-control-mvcc"] = [
  {
    "id": "multi-version-concurrency-control-mvcc-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers?",
    "options": [
      "Comparing append-version heap MVCC (PostgreSQL) against in-place clustered update + rollback segment undo logs (MySQL InnoDB & Oracle).",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Comparing append-version heap MVCC (PostgreSQL) against in-place clustered update + rollback segment undo logs (MySQL InnoDB & Oracle). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "multi-version-concurrency-control-mvcc-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers (mvcc, tuple-versioning, concurrency), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers (mvcc, tuple-versioning, concurrency), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "multi-version-concurrency-control-mvcc-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "multi-version-concurrency-control-mvcc-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["tuple-headers-xmin-xmax-visibility"] = [
  {
    "id": "tuple-headers-xmin-xmax-visibility-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits?",
    "options": [
      "Inspecting the 23-byte PostgreSQL HeapTupleHeaderData structure: how INSERT sets xmin, DELETE sets xmax, and UPDATE writes a brand-new tuple version.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Inspecting the 23-byte PostgreSQL HeapTupleHeaderData structure: how INSERT sets xmin, DELETE sets xmax, and UPDATE writes a brand-new tuple version. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "tuple-headers-xmin-xmax-visibility-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits (xmin-xmax, ctid, tuple-header), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits (xmin-xmax, ctid, tuple-header), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "tuple-headers-xmin-xmax-visibility-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "tuple-headers-xmin-xmax-visibility-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["transaction-snapshots-visibility-rules"] = [
  {
    "id": "transaction-snapshots-visibility-rules-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution?",
    "options": [
      "Evaluating the exact visibility algorithm that decides whether tuple version V is visible to transaction T based on committed status and active XID list.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Evaluating the exact visibility algorithm that decides whether tuple version V is visible to transaction T based on committed status and active XID list. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "transaction-snapshots-visibility-rules-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution (transaction-snapshot, visibility-rules, mvcc), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution (transaction-snapshot, visibility-rules, mvcc), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "transaction-snapshots-visibility-rules-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "transaction-snapshots-visibility-rules-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["row-level-locks-for-update-skip-locked"] = [
  {
    "id": "row-level-locks-for-update-skip-locked-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED?",
    "options": [
      "Why FOR NO KEY UPDATE avoids blocking child foreign-key inserts, and how FOR UPDATE SKIP LOCKED powers lock-free concurrent worker queues.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why FOR NO KEY UPDATE avoids blocking child foreign-key inserts, and how FOR UPDATE SKIP LOCKED powers lock-free concurrent worker queues. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "row-level-locks-for-update-skip-locked-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED (row-locks, for-update, skip-locked), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED (row-locks, for-update, skip-locked), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "row-level-locks-for-update-skip-locked-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "row-level-locks-for-update-skip-locked-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["table-locks-intention-locks-ddl-hazards"] = [
  {
    "id": "table-locks-intention-locks-ddl-hazards-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic?",
    "options": [
      "How AccessExclusive DDL locks queue behind one long-running SELECT and then block every subsequent incoming read and write across the entire table.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How AccessExclusive DDL locks queue behind one long-running SELECT and then block every subsequent incoming read and write across the entire table. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "table-locks-intention-locks-ddl-hazards-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic (table-locks, ddl-locks, lock-queues), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic (table-locks, ddl-locks, lock-queues), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "table-locks-intention-locks-ddl-hazards-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "table-locks-intention-locks-ddl-hazards-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["gap-locks-next-key-locks-innodb"] = [
  {
    "id": "gap-locks-next-key-locks-innodb-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks?",
    "options": [
      "How InnoDB locks the open key intervals between existing B+Tree index records so concurrent transactions cannot insert phantom rows into a range.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How InnoDB locks the open key intervals between existing B+Tree index records so concurrent transactions cannot insert phantom rows into a range. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "gap-locks-next-key-locks-innodb-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks (gap-locks, next-key-locks, innodb), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks (gap-locks, next-key-locks, innodb), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "gap-locks-next-key-locks-innodb-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "gap-locks-next-key-locks-innodb-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["deadlocks-wait-for-graphs-detection"] = [
  {
    "id": "deadlocks-wait-for-graphs-detection-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection?",
    "options": [
      "Tracing how T1 locking row A→B and T2 locking row B→A creates a Wait-For Graph cycle, how the engine aborts a victim, and canonical lock ordering fixes.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Tracing how T1 locking row A→B and T2 locking row B→A creates a Wait-For Graph cycle, how the engine aborts a victim, and canonical lock ordering fixes. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "deadlocks-wait-for-graphs-detection-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection (deadlocks, wait-for-graph, lock-ordering), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection (deadlocks, wait-for-graph, lock-ordering), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "deadlocks-wait-for-graphs-detection-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "deadlocks-wait-for-graphs-detection-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["dead-tuples-bloat-autovacuum-txid-wraparound"] = [
  {
    "id": "dead-tuples-bloat-autovacuum-txid-wraparound-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound?",
    "options": [
      "Why MVCC leaves dead tuples behind, how VACUUM reclaims space into the Free Space Map without locking reads, and how 32-bit Transaction ID wraparound freezes tables.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why MVCC leaves dead tuples behind, how VACUUM reclaims space into the Free Space Map without locking reads, and how 32-bit Transaction ID wraparound freezes tables. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "dead-tuples-bloat-autovacuum-txid-wraparound-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound (autovacuum, table-bloat, xid-wraparound), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound (autovacuum, table-bloat, xid-wraparound), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "dead-tuples-bloat-autovacuum-txid-wraparound-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "dead-tuples-bloat-autovacuum-txid-wraparound-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-sentry-transaction-id-wraparound"] = [
  {
    "id": "case-sentry-transaction-id-wraparound-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage?",
    "options": [
      "Dissecting how unvacuumed 32-bit transaction IDs approach the 2-billion horizon, forcing PostgreSQL into emergency read-only shutdown to prevent data loss.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Dissecting how unvacuumed 32-bit transaction IDs approach the 2-billion horizon, forcing PostgreSQL into emergency read-only shutdown to prevent data loss. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-sentry-transaction-id-wraparound-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage (xid-wraparound, autovacuum, postmortem), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage (xid-wraparound, autovacuum, postmortem), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-sentry-transaction-id-wraparound-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-sentry-transaction-id-wraparound-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-mvcc-snapshot-storage-engine"] = [
  {
    "id": "build-mvcc-snapshot-storage-engine-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC?",
    "options": [
      "Implement an MVCC storage engine supporting versioned tuple chains (xmin/xmax), point-in-time snapshot visibility reads, and dead-tuple vacuum garbage collection.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Implement an MVCC storage engine supporting versioned tuple chains (xmin/xmax), point-in-time snapshot visibility reads, and dead-tuple vacuum garbage collection. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-mvcc-snapshot-storage-engine-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC (build, mvcc, garbage-collection), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC (build, mvcc, garbage-collection), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-mvcc-snapshot-storage-engine-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-mvcc-snapshot-storage-engine-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC across OLTP and OLAP workloads?",
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
