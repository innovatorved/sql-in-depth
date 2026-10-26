// SQL In Depth — Question Bank M10: B+Tree Indexes & Access Path Mechanics
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["why-indexes-work-io-cost-model"] = [
  {
    "id": "why-indexes-work-io-cost-model-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics?",
    "options": [
      "Quantifying 8KB page reads: why scanning 1,000,000 rows touches 12,500 heap pages while a height-3 B+Tree seek reads just 4 pages.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Quantifying 8KB page reads: why scanning 1,000,000 rows touches 12,500 heap pages while a height-3 B+Tree seek reads just 4 pages. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "why-indexes-work-io-cost-model-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics (indexing, io-cost, page-reads), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics (indexing, io-cost, page-reads), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "why-indexes-work-io-cost-model-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "why-indexes-work-io-cost-model-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["btree-bplustree-internal-anatomy"] = [
  {
    "id": "btree-bplustree-internal-anatomy-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links?",
    "options": [
      "Why databases use B+Trees instead of binary trees or B-Trees: packing ~500 separator keys per 8KB internal page and linking leaf pages for range scans.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why databases use B+Trees instead of binary trees or B-Trees: packing ~500 separator keys per 8KB internal page and linking leaf pages for range scans. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "btree-bplustree-internal-anatomy-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links (bplustree, btree, leaf-pages), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links (bplustree, btree, leaf-pages), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "btree-bplustree-internal-anatomy-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "btree-bplustree-internal-anatomy-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["clustered-vs-secondary-indexes"] = [
  {
    "id": "clustered-vs-secondary-indexes-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres)?",
    "options": [
      "Comparing MySQL InnoDB (where the primary key B+Tree leaf IS the table row) against PostgreSQL heap storage (where secondary indexes point to ctid).",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Comparing MySQL InnoDB (where the primary key B+Tree leaf IS the table row) against PostgreSQL heap storage (where secondary indexes point to ctid). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "clustered-vs-secondary-indexes-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) (clustered-index, heap-table, ctid), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) (clustered-index, heap-table, ctid), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "clustered-vs-secondary-indexes-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "clustered-vs-secondary-indexes-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["composite-indexes-leftmost-prefix"] = [
  {
    "id": "composite-indexes-leftmost-prefix-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range?",
    "options": [
      "How lexicographical tuple ordering inside a multi-column B+Tree dictates why equality predicates must precede range predicates for full index utilization.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How lexicographical tuple ordering inside a multi-column B+Tree dictates why equality predicates must precede range predicates for full index utilization. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "composite-indexes-leftmost-prefix-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range (composite-index, leftmost-prefix, range-scan), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range (composite-index, leftmost-prefix, range-scan), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "composite-indexes-leftmost-prefix-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "composite-indexes-leftmost-prefix-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["covering-indexes-index-only-scans"] = [
  {
    "id": "covering-indexes-index-only-scans-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map)?",
    "options": [
      "Eliminating random heap table fetches completely by including payload columns in the index leaf and consulting PostgreSQL's Visibility Map.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Eliminating random heap table fetches completely by including payload columns in the index leaf and consulting PostgreSQL's Visibility Map. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "covering-indexes-index-only-scans-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) (covering-index, index-only-scan, include-clause), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) (covering-index, index-only-scan, include-clause), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "covering-indexes-index-only-scans-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "covering-indexes-index-only-scans-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["partial-filtered-expression-indexes"] = [
  {
    "id": "partial-filtered-expression-indexes-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Partial (Filtered) Indexes & Functional / Expression Indexes — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Partial (Filtered) Indexes & Functional / Expression Indexes?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Partial (Filtered) Indexes & Functional / Expression Indexes?",
    "options": [
      "Shrinking index footprint by 90% with WHERE predicates (e.g. WHERE status = 'pending') and indexing computed expressions like LOWER(email).",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Shrinking index footprint by 90% with WHERE predicates (e.g. WHERE status = 'pending') and indexing computed expressions like LOWER(email). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "partial-filtered-expression-indexes-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Partial (Filtered) Indexes & Functional / Expression Indexes — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Partial (Filtered) Indexes & Functional / Expression Indexes (partial-index, expression-index, index-size), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Partial (Filtered) Indexes & Functional / Expression Indexes (partial-index, expression-index, index-size), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "partial-filtered-expression-indexes-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Partial (Filtered) Indexes & Functional / Expression Indexes — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Partial (Filtered) Indexes & Functional / Expression Indexes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Partial (Filtered) Indexes & Functional / Expression Indexes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "partial-filtered-expression-indexes-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Partial (Filtered) Indexes & Functional / Expression Indexes — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Partial (Filtered) Indexes & Functional / Expression Indexes across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Partial (Filtered) Indexes & Functional / Expression Indexes across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["hash-gin-gist-brin-bloom-indexes"] = [
  {
    "id": "hash-gin-gist-brin-bloom-indexes-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap?",
    "options": [
      "Choosing the right access method beyond B+Trees: inverted posting lists (GIN) for JSONB/FTS, Tiny block summaries (BRIN) for time-series, and R-Trees (GiST).",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Choosing the right access method beyond B+Trees: inverted posting lists (GIN) for JSONB/FTS, Tiny block summaries (BRIN) for time-series, and R-Trees (GiST). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "hash-gin-gist-brin-bloom-indexes-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap (gin-index, brin-index, gist), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap (gin-index, brin-index, gist), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "hash-gin-gist-brin-bloom-indexes-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "hash-gin-gist-brin-bloom-indexes-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["index-bloat-write-amplification-traps"] = [
  {
    "id": "index-bloat-write-amplification-traps-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds?",
    "options": [
      "Why every additional secondary index slows down INSERT/UPDATE/DELETE, how 50/50 leaf page splits fragment space, and when a Seq Scan beats an Index Scan.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why every additional secondary index slows down INSERT/UPDATE/DELETE, how 50/50 leaf page splits fragment space, and when a Seq Scan beats an Index Scan. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "index-bloat-write-amplification-traps-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds (write-amplification, index-bloat, selectivity), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds (write-amplification, index-bloat, selectivity), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "index-bloat-write-amplification-traps-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "index-bloat-write-amplification-traps-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-slack-composite-index-incident"] = [
  {
    "id": "case-slack-composite-index-incident-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4%?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4%?",
    "options": [
      "Analyzing a production slow-query incident where an index on (created_at, channel_id) scanned 400,000 index entries instead of 15 with (channel_id, created_at).",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Analyzing a production slow-query incident where an index on (created_at, channel_id) scanned 400,000 index entries instead of 15 with (channel_id, created_at). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-slack-composite-index-incident-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% (composite-index, query-tuning, production-incident), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% (composite-index, query-tuning, production-incident), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-slack-composite-index-incident-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-slack-composite-index-incident-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4% across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-btree-index-advisor"] = [
  {
    "id": "build-btree-index-advisor-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor?",
    "options": [
      "Build an interactive index advisor that inspects query predicates, ORDER BY clauses, and cardinality to recommend optimal composite covering indexes.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Build an interactive index advisor that inspects query predicates, ORDER BY clauses, and cardinality to recommend optimal composite covering indexes. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-btree-index-advisor-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor (build, bplustree, index-advisor), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor (build, bplustree, index-advisor), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-btree-index-advisor-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-btree-index-advisor-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor across OLTP and OLAP workloads?",
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
