// SQL In Depth — Question Bank M09: Advanced SQL Patterns, Temporal Queries & Programmability
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["calendar-tables-date-spines"] = [
  {
    "id": "calendar-tables-date-spines-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets?",
    "options": [
      "Using recursive CTEs or generate_series to build continuous date spines so time-series charts never skip days with zero orders.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Using recursive CTEs or generate_series to build continuous date spines so time-series charts never skip days with zero orders. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "calendar-tables-date-spines-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets (date-spine, calendar-table, time-series), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets (date-spine, calendar-table, time-series), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "calendar-tables-date-spines-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "calendar-tables-date-spines-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["cohort-retention-matrix-sql"] = [
  {
    "id": "cohort-retention-matrix-sql-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL?",
    "options": [
      "Grouping users by signup cohort month, calculating active lifecycle offsets (Month 0, Month 1, Month N), and computing Net Dollar Retention.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Grouping users by signup cohort month, calculating active lifecycle offsets (Month 0, Month 1, Month N), and computing Net Dollar Retention. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "cohort-retention-matrix-sql-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL (cohort-analysis, retention, ndr), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL (cohort-analysis, retention, ndr), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "cohort-retention-matrix-sql-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "cohort-retention-matrix-sql-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["funnel-conversion-attribution-sql"] = [
  {
    "id": "funnel-conversion-attribution-sql-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution?",
    "options": [
      "Measuring drop-off across strict chronological user funnels (Signup → Connect → Query → Upgrade) and attributing revenue to marketing touches.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Measuring drop-off across strict chronological user funnels (Signup → Connect → Query → Upgrade) and attributing revenue to marketing touches. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "funnel-conversion-attribution-sql-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution (funnel-analysis, attribution, conversion), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution (funnel-analysis, attribution, conversion), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "funnel-conversion-attribution-sql-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "funnel-conversion-attribution-sql-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["interval-overlap-allen-algebra"] = [
  {
    "id": "interval-overlap-allen-algebra-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals?",
    "options": [
      "Mastering the canonical two-condition overlap predicate (start_a < end_b AND end_a > start_b) to detect double-bookings and merge overlapping windows.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Mastering the canonical two-condition overlap predicate (start_a < end_b AND end_a > start_b) to detect double-bookings and merge overlapping windows. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "interval-overlap-allen-algebra-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals (interval-overlap, allens-algebra, temporal-sql), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals (interval-overlap, allens-algebra, temporal-sql), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "interval-overlap-allen-algebra-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "interval-overlap-allen-algebra-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["pivoting-unpivoting-cross-tabs"] = [
  {
    "id": "pivoting-unpivoting-cross-tabs-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns?",
    "options": [
      "Transforming normalized tall tables into wide report matrices and unpivoting wide spreadsheet imports using UNION ALL or LATERAL values.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Transforming normalized tall tables into wide report matrices and unpivoting wide spreadsheet imports using UNION ALL or LATERAL values. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "pivoting-unpivoting-cross-tabs-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns (pivot, unpivot, cross-tab), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns (pivot, unpivot, cross-tab), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "pivoting-unpivoting-cross-tabs-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "pivoting-unpivoting-cross-tabs-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["triggers-stored-procedures-udfs"] = [
  {
    "id": "triggers-stored-procedures-udfs-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead?",
    "options": [
      "Writing BEFORE/AFTER row triggers for audit logging and invariant enforcement, while understanding why non-inlined scalar UDFs cripple query parallelism.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Writing BEFORE/AFTER row triggers for audit logging and invariant enforcement, while understanding why non-inlined scalar UDFs cripple query parallelism. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "triggers-stored-procedures-udfs-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead (triggers, stored-procedures, udf), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead (triggers, stored-procedures, udf), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "triggers-stored-procedures-udfs-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "triggers-stored-procedures-udfs-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["materialized-views-incremental-refresh"] = [
  {
    "id": "materialized-views-incremental-refresh-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM)?",
    "options": [
      "Precomputing expensive multi-join aggregations on disk, REFRESH MATERIALIZED VIEW CONCURRENTLY, and delta-based incremental maintenance.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Precomputing expensive multi-join aggregations on disk, REFRESH MATERIALIZED VIEW CONCURRENTLY, and delta-based incremental maintenance. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "materialized-views-incremental-refresh-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) (materialized-view, ivm, precomputation), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) (materialized-view, ivm, precomputation), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "materialized-views-incremental-refresh-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "materialized-views-incremental-refresh-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["sql-injection-parameterized-security"] = [
  {
    "id": "sql-injection-parameterized-security-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS)?",
    "options": [
      "How string concatenation allows untrusted input to rewrite the SQL AST, why parameterized bind variables prevent injection 100%, and Postgres RLS policies.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How string concatenation allows untrusted input to rewrite the SQL AST, why parameterized bind variables prevent injection 100%, and Postgres RLS policies. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "sql-injection-parameterized-security-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) (sql-injection, prepared-statements, rls), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) (sql-injection, prepared-statements, rls), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "sql-injection-parameterized-security-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "sql-injection-parameterized-security-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-double-booking-hotel-inventory"] = [
  {
    "id": "case-double-booking-hotel-inventory-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Preventing Concurrent Calendar Double-Bookings — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Preventing Concurrent Calendar Double-Bookings?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Preventing Concurrent Calendar Double-Bookings?",
    "options": [
      "Why application-level SELECT-then-INSERT checks fail under concurrency and how range exclusion constraints and interval locks guarantee zero overlap.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why application-level SELECT-then-INSERT checks fail under concurrency and how range exclusion constraints and interval locks guarantee zero overlap. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-double-booking-hotel-inventory-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Preventing Concurrent Calendar Double-Bookings — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Preventing Concurrent Calendar Double-Bookings (double-booking, exclusion-constraints, concurrency), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Preventing Concurrent Calendar Double-Bookings (double-booking, exclusion-constraints, concurrency), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-double-booking-hotel-inventory-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Preventing Concurrent Calendar Double-Bookings — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Preventing Concurrent Calendar Double-Bookings degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Preventing Concurrent Calendar Double-Bookings degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-double-booking-hotel-inventory-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Preventing Concurrent Calendar Double-Bookings — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Preventing Concurrent Calendar Double-Bookings across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Preventing Concurrent Calendar Double-Bookings across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-saas-cohort-funnel-workbench"] = [
  {
    "id": "build-saas-cohort-funnel-workbench-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)?",
    "options": [
      "Build an end-to-end SaaS analytics SQL suite calculating MRR expansion/churn movements, cohort retention triangles, and step-by-step funnel conversion.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Build an end-to-end SaaS analytics SQL suite calculating MRR expansion/churn movements, cohort retention triangles, and step-by-step funnel conversion. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-saas-cohort-funnel-workbench-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) (build, cohort-retention, saas-analytics), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) (build, cohort-retention, saas-analytics), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-saas-cohort-funnel-workbench-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-saas-cohort-funnel-workbench-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels) across OLTP and OLAP workloads?",
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
