// SQL In Depth — Question Bank M06: Window Functions & Analytical SQL Mastery
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["window-functions-mental-model"] = [
  {
    "id": "window-functions-mental-model-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "The Window Function Mental Model: Preserving Row Identity + Context — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of The Window Function Mental Model: Preserving Row Identity + Context?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of The Window Function Mental Model: Preserving Row Identity + Context?",
    "options": [
      "Why GROUP BY collapses rows while OVER (...) attaches an analytical sliding window to every tuple without losing row-level granularity.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why GROUP BY collapses rows while OVER (...) attaches an analytical sliding window to every tuple without losing row-level granularity. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "window-functions-mental-model-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "The Window Function Mental Model: Preserving Row Identity + Context — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving The Window Function Mental Model: Preserving Row Identity + Context (window-functions, over-clause, analytical-sql), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving The Window Function Mental Model: Preserving Row Identity + Context (window-functions, over-clause, analytical-sql), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "window-functions-mental-model-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "The Window Function Mental Model: Preserving Row Identity + Context — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from The Window Function Mental Model: Preserving Row Identity + Context degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from The Window Function Mental Model: Preserving Row Identity + Context degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "window-functions-mental-model-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "The Window Function Mental Model: Preserving Row Identity + Context — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting The Window Function Mental Model: Preserving Row Identity + Context across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting The Window Function Mental Model: Preserving Row Identity + Context across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["partition-by-order-by-mechanics"] = [
  {
    "id": "partition-by-order-by-mechanics-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "PARTITION BY, ORDER BY & The Default RANGE Frame Trap — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of PARTITION BY, ORDER BY & The Default RANGE Frame Trap?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of PARTITION BY, ORDER BY & The Default RANGE Frame Trap?",
    "options": [
      "How window partitioning and sorting work under the hood, and why adding ORDER BY silently changes the default frame to RANGE UNBOUNDED PRECEDING.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How window partitioning and sorting work under the hood, and why adding ORDER BY silently changes the default frame to RANGE UNBOUNDED PRECEDING. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "partition-by-order-by-mechanics-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "PARTITION BY, ORDER BY & The Default RANGE Frame Trap — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving PARTITION BY, ORDER BY & The Default RANGE Frame Trap (partition-by, window-order, default-frame), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving PARTITION BY, ORDER BY & The Default RANGE Frame Trap (partition-by, window-order, default-frame), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "partition-by-order-by-mechanics-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "PARTITION BY, ORDER BY & The Default RANGE Frame Trap — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from PARTITION BY, ORDER BY & The Default RANGE Frame Trap degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from PARTITION BY, ORDER BY & The Default RANGE Frame Trap degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "partition-by-order-by-mechanics-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "PARTITION BY, ORDER BY & The Default RANGE Frame Trap — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting PARTITION BY, ORDER BY & The Default RANGE Frame Trap across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting PARTITION BY, ORDER BY & The Default RANGE Frame Trap across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["ranking-functions-row-number-rank"] = [
  {
    "id": "ranking-functions-row-number-rank-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST?",
    "options": [
      "Exact tie-breaking semantics between ROW_NUMBER (1,2,3,4), RANK (1,2,2,4), and DENSE_RANK (1,2,2,3), plus equidepth bucketing with NTILE.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Exact tie-breaking semantics between ROW_NUMBER (1,2,3,4), RANK (1,2,2,4), and DENSE_RANK (1,2,2,3), plus equidepth bucketing with NTILE. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "ranking-functions-row-number-rank-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST (row-number, rank, dense-rank), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST (row-number, rank, dense-rank), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "ranking-functions-row-number-rank-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "ranking-functions-row-number-rank-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["top-n-per-group-deduplication"] = [
  {
    "id": "top-n-per-group-deduplication-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY?",
    "options": [
      "Fetching the latest N events per user or top products per category using ROW_NUMBER() CTEs and DuckDB/Snowflake QUALIFY syntax.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Fetching the latest N events per user or top products per category using ROW_NUMBER() CTEs and DuckDB/Snowflake QUALIFY syntax. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "top-n-per-group-deduplication-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY (top-n-per-group, deduplication, qualify), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY (top-n-per-group, deduplication, qualify), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "top-n-per-group-deduplication-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "top-n-per-group-deduplication-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["offset-functions-lag-lead-first-last"] = [
  {
    "id": "offset-functions-lag-lead-first-last-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap?",
    "options": [
      "Peeking at preceding and succeeding rows without self-joins, period-over-period growth deltas, and why LAST_VALUE requires an explicit UNBOUNDED FOLLOWING frame.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Peeking at preceding and succeeding rows without self-joins, period-over-period growth deltas, and why LAST_VALUE requires an explicit UNBOUNDED FOLLOWING frame. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "offset-functions-lag-lead-first-last-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap (lag, lead, last-value), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap (lag, lead, last-value), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "offset-functions-lag-lead-first-last-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "offset-functions-lag-lead-first-last-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["window-frames-rows-range-groups"] = [
  {
    "id": "window-frames-rows-range-groups-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages?",
    "options": [
      "Physical row offsets (ROWS) vs logical value intervals (RANGE) vs peer tie groups (GROUPS) for accurate 7-day rolling averages.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Physical row offsets (ROWS) vs logical value intervals (RANGE) vs peer tie groups (GROUPS) for accurate 7-day rolling averages. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "window-frames-rows-range-groups-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages (window-frames, rows-vs-range, moving-average), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages (window-frames, rows-vs-range, moving-average), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "window-frames-rows-range-groups-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "window-frames-rows-range-groups-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["running-totals-cumulative-shares"] = [
  {
    "id": "running-totals-cumulative-shares-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses?",
    "options": [
      "Computing monotonic cumulative sums, percentage-of-total shares, and reusing window specifications cleanly with the WINDOW w AS (...) clause.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Computing monotonic cumulative sums, percentage-of-total shares, and reusing window specifications cleanly with the WINDOW w AS (...) clause. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "running-totals-cumulative-shares-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses (running-total, pareto, named-window), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses (running-total, pareto, named-window), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "running-totals-cumulative-shares-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "running-totals-cumulative-shares-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["gaps-and-islands-sessionization"] = [
  {
    "id": "gaps-and-islands-sessionization-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization?",
    "options": [
      "Grouping contiguous sequences and splitting user activity streams into 30-minute sessions using the ROW_NUMBER difference trick and LAG step indicators.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Grouping contiguous sequences and splitting user activity streams into 30-minute sessions using the ROW_NUMBER difference trick and LAG step indicators. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "gaps-and-islands-sessionization-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization (gaps-and-islands, sessionization, streaks), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization (gaps-and-islands, sessionization, streaks), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "gaps-and-islands-sessionization-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "gaps-and-islands-sessionization-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-fintech-velocity-fraud-window"] = [
  {
    "id": "case-fintech-velocity-fraud-window-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection?",
    "options": [
      "Detecting rapid card-testing bursts and cross-country impossible travel in a single analytical window pass over merchant transaction streams.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Detecting rapid card-testing bursts and cross-country impossible travel in a single analytical window pass over merchant transaction streams. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-fintech-velocity-fraud-window-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection (fraud-detection, sliding-window, fintech), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection (fraud-detection, sliding-window, fintech), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-fintech-velocity-fraud-window-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-fintech-velocity-fraud-window-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-sessionization-retention-engine"] = [
  {
    "id": "build-sessionization-retention-engine-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer?",
    "options": [
      "Implement a complete analytical SQL pipeline that sessionizes raw user events, computes consecutive active streaks, and flags anomalous velocity spikes.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Implement a complete analytical SQL pipeline that sessionizes raw user events, computes consecutive active streaks, and flags anomalous velocity spikes. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-sessionization-retention-engine-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer (build, window-functions, sessionization), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer (build, window-functions, sessionization), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-sessionization-retention-engine-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-sessionization-retention-engine-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer across OLTP and OLAP workloads?",
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
