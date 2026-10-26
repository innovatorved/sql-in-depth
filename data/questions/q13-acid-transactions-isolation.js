// SQL In Depth — Question Bank M13: ACID Transactions, Concurrency Anomalies & Isolation Levels
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["acid-properties-under-the-hood"] = [
  {
    "id": "acid-properties-under-the-hood-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL)?",
    "options": [
      "Moving beyond textbook acronyms: how undo logs/MVCC implement Atomicity, concurrency protocols enforce Isolation, and WAL fsync guarantees Durability.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Moving beyond textbook acronyms: how undo logs/MVCC implement Atomicity, concurrency protocols enforce Isolation, and WAL fsync guarantees Durability. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "acid-properties-under-the-hood-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) (acid, transactions, wal), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) (acid, transactions, wal), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "acid-properties-under-the-hood-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "acid-properties-under-the-hood-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["transaction-lifecycle-savepoints"] = [
  {
    "id": "transaction-lifecycle-savepoints-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards?",
    "options": [
      "Managing transaction boundaries, partial rollbacks via nested SAVEPOINTs, and why long-running idle-in-transaction sessions poison database health.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Managing transaction boundaries, partial rollbacks via nested SAVEPOINTs, and why long-running idle-in-transaction sessions poison database health. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "transaction-lifecycle-savepoints-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards (begin-commit, savepoint, rollback), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards (begin-commit, savepoint, rollback), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "transaction-lifecycle-savepoints-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "transaction-lifecycle-savepoints-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["read-phenomena-dirty-nonrepeatable-phantom"] = [
  {
    "id": "read-phenomena-dirty-nonrepeatable-phantom-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized?",
    "options": [
      "Stepping through dual-session timelines (T1 & T2) to witness uncommitted reads, mid-transaction value changes, and newly appearing phantom tuples.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Stepping through dual-session timelines (T1 & T2) to witness uncommitted reads, mid-transaction value changes, and newly appearing phantom tuples. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "read-phenomena-dirty-nonrepeatable-phantom-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized (dirty-read, non-repeatable-read, phantom-read), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized (dirty-read, non-repeatable-read, phantom-read), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "read-phenomena-dirty-nonrepeatable-phantom-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "read-phenomena-dirty-nonrepeatable-phantom-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["write-anomalies-lost-update-write-skew"] = [
  {
    "id": "write-anomalies-lost-update-write-skew-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew?",
    "options": [
      "Why preventing standard SQL-92 read phenomena is not enough: how concurrent read-modify-write cycles lose updates and how Write Skew breaks multi-row invariants.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why preventing standard SQL-92 read phenomena is not enough: how concurrent read-modify-write cycles lose updates and how Write Skew breaks multi-row invariants. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "write-anomalies-lost-update-write-skew-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew (lost-update, write-skew, concurrency-anomalies), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew (lost-update, write-skew, concurrency-anomalies), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "write-anomalies-lost-update-write-skew-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "write-anomalies-lost-update-write-skew-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["read-uncommitted-read-committed"] = [
  {
    "id": "read-uncommitted-read-committed-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice?",
    "options": [
      "Why PostgreSQL treats READ UNCOMMITTED as READ COMMITTED, and how taking a fresh snapshot per statement allows non-repeatable reads and read skew.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why PostgreSQL treats READ UNCOMMITTED as READ COMMITTED, and how taking a fresh snapshot per statement allows non-repeatable reads and read skew. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "read-uncommitted-read-committed-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice (read-committed, isolation-levels, snapshots), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice (read-committed, isolation-levels, snapshots), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "read-uncommitted-read-committed-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "read-uncommitted-read-committed-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["repeatable-read-snapshot-isolation"] = [
  {
    "id": "repeatable-read-snapshot-isolation-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew?",
    "options": [
      "How transaction-start snapshots guarantee repeatable reads and automatically abort concurrent Lost Updates while still permitting Write Skew.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How transaction-start snapshots guarantee repeatable reads and automatically abort concurrent Lost Updates while still permitting Write Skew. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "repeatable-read-snapshot-isolation-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew (repeatable-read, snapshot-isolation, first-committer-wins), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew (repeatable-read, snapshot-isolation, first-committer-wins), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "repeatable-read-snapshot-isolation-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "repeatable-read-snapshot-isolation-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["serializable-2pl-vs-ssi"] = [
  {
    "id": "serializable-2pl-vs-ssi-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI)?",
    "options": [
      "Comparing pessimistic Strict 2PL (shared/exclusive read-write locks) against PostgreSQL's lock-free SSI rw-antidependency conflict graph detection.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Comparing pessimistic Strict 2PL (shared/exclusive read-write locks) against PostgreSQL's lock-free SSI rw-antidependency conflict graph detection. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "serializable-2pl-vs-ssi-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) (serializable, 2pl, ssi), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) (serializable, 2pl, ssi), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "serializable-2pl-vs-ssi-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "serializable-2pl-vs-ssi-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["optimistic-vs-pessimistic-concurrency"] = [
  {
    "id": "optimistic-vs-pessimistic-concurrency-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE?",
    "options": [
      "Choosing between explicit row locks (SELECT ... FOR UPDATE), atomic SQL increments, and optimistic version columns (WHERE version = expected).",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Choosing between explicit row locks (SELECT ... FOR UPDATE), atomic SQL increments, and optimistic version columns (WHERE version = expected). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "optimistic-vs-pessimistic-concurrency-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE (optimistic-locking, pessimistic-locking, for-update), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE (optimistic-locking, pessimistic-locking, for-update), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "optimistic-vs-pessimistic-concurrency-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "optimistic-vs-pessimistic-concurrency-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-fintech-double-spend-race-condition"] = [
  {
    "id": "case-fintech-double-spend-race-condition-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend?",
    "options": [
      "Reproducing a classic wallet withdrawal race condition under READ COMMITTED where two concurrent requests withdraw $100 from a $100 balance.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Reproducing a classic wallet withdrawal race condition under READ COMMITTED where two concurrent requests withdraw $100 from a $100 balance. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-fintech-double-spend-race-condition-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend (double-spend, race-condition, fintech), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend (double-spend, race-condition, fintech), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-fintech-double-spend-race-condition-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-fintech-double-spend-race-condition-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-transaction-anomaly-simulator"] = [
  {
    "id": "build-transaction-anomaly-simulator-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier?",
    "options": [
      "Build a transaction schedule analyzer that simulates interleaved T1/T2 read-write operations and detects Dirty Reads, Lost Updates, and Write Skew.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Build a transaction schedule analyzer that simulates interleaved T1/T2 read-write operations and detects Dirty Reads, Lost Updates, and Write Skew. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-transaction-anomaly-simulator-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier (build, isolation-levels, concurrency), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier (build, isolation-levels, concurrency), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-transaction-anomaly-simulator-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-transaction-anomaly-simulator-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier across OLTP and OLAP workloads?",
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
