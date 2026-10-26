// SQL In Depth — Question Bank M02: DDL, Schema Constraints & DML Mutations
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["create-table-ddl-anatomy"] = [
  {
    "id": "create-table-ddl-anatomy-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs?",
    "options": [
      "How DDL statements mutate system catalog tables (pg_class, sqlite_master), physical storage allocation, and fast O(1) file truncation vs row-by-row DELETE.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How DDL statements mutate system catalog tables (pg_class, sqlite_master), physical storage allocation, and fast O(1) file truncation vs row-by-row DELETE. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "create-table-ddl-anatomy-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs (ddl, create-table, system-catalogs), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs (ddl, create-table, system-catalogs), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "create-table-ddl-anatomy-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "create-table-ddl-anatomy-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["primary-keys-surrogate-vs-natural"] = [
  {
    "id": "primary-keys-surrogate-vs-natural-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality?",
    "options": [
      "Choosing between natural keys, auto-incrementing 64-bit integers, and time-ordered UUIDv7 to eliminate random B+Tree leaf page splits.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Choosing between natural keys, auto-incrementing 64-bit integers, and time-ordered UUIDv7 to eliminate random B+Tree leaf page splits. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "primary-keys-surrogate-vs-natural-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality (primary-key, uuidv7, btree-locality), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality (primary-key, uuidv7, btree-locality), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "primary-keys-surrogate-vs-natural-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "primary-keys-surrogate-vs-natural-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["foreign-keys-referential-integrity"] = [
  {
    "id": "foreign-keys-referential-integrity-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT)?",
    "options": [
      "Enforcing relational graph invariants at the storage engine layer with ON DELETE CASCADE, RESTRICT, SET NULL, and deferred constraint checking.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Enforcing relational graph invariants at the storage engine layer with ON DELETE CASCADE, RESTRICT, SET NULL, and deferred constraint checking. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "foreign-keys-referential-integrity-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) (foreign-key, referential-integrity, cascade), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) (foreign-key, referential-integrity, cascade), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "foreign-keys-referential-integrity-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "foreign-keys-referential-integrity-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["check-unique-not-null-defaults"] = [
  {
    "id": "check-unique-not-null-defaults-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns?",
    "options": [
      "Encoding business invariants directly into table definitions using CHECK predicates, multi-column UNIQUE indexes with NULLs, and stored/virtual generated columns.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Encoding business invariants directly into table definitions using CHECK predicates, multi-column UNIQUE indexes with NULLs, and stored/virtual generated columns. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "check-unique-not-null-defaults-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns (constraints, check, generated-columns), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns (constraints, check, generated-columns), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "check-unique-not-null-defaults-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "check-unique-not-null-defaults-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["insert-bulk-loading-returning"] = [
  {
    "id": "insert-bulk-loading-returning-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING?",
    "options": [
      "Amortizing network round-trips and WAL fsync overhead with multi-row batched INSERT statements and atomic server-generated ID retrieval via RETURNING.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Amortizing network round-trips and WAL fsync overhead with multi-row batched INSERT statements and atomic server-generated ID retrieval via RETURNING. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "insert-bulk-loading-returning-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING (insert, bulk-load, returning), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING (insert, bulk-load, returning), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "insert-bulk-loading-returning-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "insert-bulk-loading-returning-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["upsert-on-conflict-merge"] = [
  {
    "id": "upsert-on-conflict-merge-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE?",
    "options": [
      "Resolving concurrent insert races atomically with ON CONFLICT (key) DO UPDATE, EXCLUDED pseudo-tuples, and SQL standard MERGE pipelines.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Resolving concurrent insert races atomically with ON CONFLICT (key) DO UPDATE, EXCLUDED pseudo-tuples, and SQL standard MERGE pipelines. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "upsert-on-conflict-merge-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE (upsert, on-conflict, idempotency), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE (upsert, on-conflict, idempotency), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "upsert-on-conflict-merge-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "upsert-on-conflict-merge-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["update-delete-safe-mutations"] = [
  {
    "id": "update-delete-safe-mutations-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs?",
    "options": [
      "Writing bounded mutations, joining reference tables during UPDATE, and weighing tombstone soft deletes (deleted_at) against partial index bloat.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Writing bounded mutations, joining reference tables during UPDATE, and weighing tombstone soft deletes (deleted_at) against partial index bloat. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "update-delete-safe-mutations-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs (update, delete, soft-delete), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs (update, delete, soft-delete), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "update-delete-safe-mutations-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "update-delete-safe-mutations-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["views-temp-tables-ctas"] = [
  {
    "id": "views-temp-tables-ctas-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables?",
    "options": [
      "Query tree view expansion, security barrier views, session-scoped temporary tables, and staging pipelines with CREATE TABLE AS SELECT.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Query tree view expansion, security barrier views, session-scoped temporary tables, and staging pipelines with CREATE TABLE AS SELECT. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "views-temp-tables-ctas-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables (views, ctas, temp-tables), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables (views, ctas, temp-tables), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "views-temp-tables-ctas-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "views-temp-tables-ctas-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-github-zero-downtime-migrations"] = [
  {
    "id": "case-github-zero-downtime-migrations-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract)?",
    "options": [
      "Why naive ALTER TABLE ADD COLUMN with defaults or NOT NULL locks production traffic and how the Expand-Backfill-Contract pattern ships safely.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why naive ALTER TABLE ADD COLUMN with defaults or NOT NULL locks production traffic and how the Expand-Backfill-Contract pattern ships safely. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-github-zero-downtime-migrations-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) (schema-migration, zero-downtime, locks), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) (schema-migration, zero-downtime, locks), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-github-zero-downtime-migrations-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-github-zero-downtime-migrations-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-ecommerce-schema-ddl"] = [
  {
    "id": "build-ecommerce-schema-ddl-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline?",
    "options": [
      "Design and verify a normalized e-commerce relational schema enforcing foreign keys, CHECK constraints, and idempotent inventory upserts.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Design and verify a normalized e-commerce relational schema enforcing foreign keys, CHECK constraints, and idempotent inventory upserts. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-ecommerce-schema-ddl-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline (build, ddl, upsert), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline (build, ddl, upsert), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-ecommerce-schema-ddl-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-ecommerce-schema-ddl-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline across OLTP and OLAP workloads?",
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
