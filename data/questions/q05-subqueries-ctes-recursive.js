// SQL In Depth — Question Bank M05: Subqueries, Correlated Queries, Lateral Joins & CTEs
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["scalar-row-table-subqueries"] = [
  {
    "id": "scalar-row-table-subqueries-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries?",
    "options": [
      "Where subqueries can legally appear across SELECT, FROM, and WHERE, runtime cardinality assertions for scalar subqueries, and inline views.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Where subqueries can legally appear across SELECT, FROM, and WHERE, runtime cardinality assertions for scalar subqueries, and inline views. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "scalar-row-table-subqueries-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries (subqueries, derived-tables, scalar-subquery), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries (subqueries, derived-tables, scalar-subquery), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "scalar-row-table-subqueries-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "scalar-row-table-subqueries-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["correlated-subqueries-mechanics"] = [
  {
    "id": "correlated-subqueries-mechanics-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting?",
    "options": [
      "How correlated subqueries bind outer tuple attributes, why naive execution is O(N×M), and how modern optimizers decorrelate them into hash joins.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How correlated subqueries bind outer tuple attributes, why naive execution is O(N×M), and how modern optimizers decorrelate them into hash joins. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "correlated-subqueries-mechanics-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting (correlated-subquery, unnesting, optimizer), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting (correlated-subquery, unnesting, optimizer), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "correlated-subqueries-mechanics-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "correlated-subqueries-mechanics-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["exists-not-exists-null-safety"] = [
  {
    "id": "exists-not-exists-null-safety-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety?",
    "options": [
      "Why EXISTS stops scanning on the first matching tuple and why NOT EXISTS is immune to the Three-Valued Logic NULL catastrophe of NOT IN.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why EXISTS stops scanning on the first matching tuple and why NOT EXISTS is immune to the Three-Valued Logic NULL catastrophe of NOT IN. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "exists-not-exists-null-safety-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety (exists, not-exists, semi-join), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety (exists, not-exists, semi-join), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "exists-not-exists-null-safety-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "exists-not-exists-null-safety-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["lateral-joins-cross-apply"] = [
  {
    "id": "lateral-joins-cross-apply-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group?",
    "options": [
      "Evaluating correlated derived tables that can reference preceding FROM tables and return multiple columns and rows per outer tuple.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Evaluating correlated derived tables that can reference preceding FROM tables and return multiple columns and rows per outer tuple. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "lateral-joins-cross-apply-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group (lateral-join, cross-apply, top-n-per-group), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group (lateral-join, cross-apply, top-n-per-group), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "lateral-joins-cross-apply-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "lateral-joins-cross-apply-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["common-table-expressions-with"] = [
  {
    "id": "common-table-expressions-with-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines?",
    "options": [
      "Refactoring deeply nested subqueries into readable, testable DAGs of named intermediate relations using chained WITH clauses.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Refactoring deeply nested subqueries into readable, testable DAGs of named intermediate relations using chained WITH clauses. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "common-table-expressions-with-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines (cte, with-clause, modular-sql), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines (cte, with-clause, modular-sql), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "common-table-expressions-with-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "common-table-expressions-with-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["cte-materialization-optimization-fence"] = [
  {
    "id": "cte-materialization-optimization-fence-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints?",
    "options": [
      "When the planner folds a CTE into the main query for predicate pushdown vs materializing it into a temp table once (PostgreSQL 12+ & SQLite semantics).",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. When the planner folds a CTE into the main query for predicate pushdown vs materializing it into a temp table once (PostgreSQL 12+ & SQLite semantics). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "cte-materialization-optimization-fence-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints (cte-materialization, optimization-fence, predicate-pushdown), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints (cte-materialization, optimization-fence, predicate-pushdown), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "cte-materialization-optimization-fence-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "cte-materialization-optimization-fence-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["recursive-ctes-hierarchies"] = [
  {
    "id": "recursive-ctes-hierarchies-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint?",
    "options": [
      "Executing iterative fixpoint worktable algorithms in pure SQL to traverse organizational charts, category trees, and parent-child hierarchies.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Executing iterative fixpoint worktable algorithms in pure SQL to traverse organizational charts, category trees, and parent-child hierarchies. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "recursive-ctes-hierarchies-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint (recursive-cte, hierarchies, trees), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint (recursive-cte, hierarchies, trees), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "recursive-ctes-hierarchies-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "recursive-ctes-hierarchies-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["graph-traversal-cycle-detection-sql"] = [
  {
    "id": "graph-traversal-cycle-detection-sql-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL?",
    "options": [
      "Preventing infinite recursion loops on cyclic graphs using path strings or visited arrays, computing shortest paths, and aggregating BOM part costs.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Preventing infinite recursion loops on cyclic graphs using path strings or visited arrays, computing shortest paths, and aggregating BOM part costs. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "graph-traversal-cycle-detection-sql-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL (graph-sql, cycle-detection, bom), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL (graph-sql, cycle-detection, bom), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "graph-traversal-cycle-detection-sql-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "graph-traversal-cycle-detection-sql-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-recursive-org-permission-engine"] = [
  {
    "id": "case-recursive-org-permission-engine-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Hierarchical RBAC Permission Inheritance in SQL — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Hierarchical RBAC Permission Inheritance in SQL?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Hierarchical RBAC Permission Inheritance in SQL?",
    "options": [
      "Designing a sub-5ms hierarchical folder and organization permission evaluator using indexed recursive CTEs and transitive closure tables.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Designing a sub-5ms hierarchical folder and organization permission evaluator using indexed recursive CTEs and transitive closure tables. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-recursive-org-permission-engine-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Hierarchical RBAC Permission Inheritance in SQL — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Hierarchical RBAC Permission Inheritance in SQL (rbac, recursive-cte, permissions), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Hierarchical RBAC Permission Inheritance in SQL (rbac, recursive-cte, permissions), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-recursive-org-permission-engine-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Hierarchical RBAC Permission Inheritance in SQL — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Hierarchical RBAC Permission Inheritance in SQL degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Hierarchical RBAC Permission Inheritance in SQL degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-recursive-org-permission-engine-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Hierarchical RBAC Permission Inheritance in SQL — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Hierarchical RBAC Permission Inheritance in SQL across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Hierarchical RBAC Permission Inheritance in SQL across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-hierarchical-graph-query-engine"] = [
  {
    "id": "build-hierarchical-graph-query-engine-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine?",
    "options": [
      "Build a recursive SQL engine that computes multi-level organizational reporting chains, detects dependency cycles, and rolls up hierarchical budgets.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Build a recursive SQL engine that computes multi-level organizational reporting chains, detects dependency cycles, and rolls up hierarchical budgets. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-hierarchical-graph-query-engine-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine (build, recursive-cte, graph), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine (build, recursive-cte, graph), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-hierarchical-graph-query-engine-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-hierarchical-graph-query-engine-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine across OLTP and OLAP workloads?",
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
