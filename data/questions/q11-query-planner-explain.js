// SQL In Depth — Question Bank M11: The Query Planner, Cost-Based Optimizer & EXPLAIN
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["life-of-a-sql-query-pipeline"] = [
  {
    "id": "life-of-a-sql-query-pipeline-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor?",
    "options": [
      "Tracing a SQL string from lexical tokenization and AST generation to catalog binding, relational algebra rewrites, cost estimation, and physical execution.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Tracing a SQL string from lexical tokenization and AST generation to catalog binding, relational algebra rewrites, cost estimation, and physical execution. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "life-of-a-sql-query-pipeline-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor (query-pipeline, parser, cost-based-optimizer), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor (query-pipeline, parser, cost-based-optimizer), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "life-of-a-sql-query-pipeline-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "life-of-a-sql-query-pipeline-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["reading-explain-and-explain-analyze"] = [
  {
    "id": "reading-explain-and-explain-analyze-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers?",
    "options": [
      "Decoding bottom-up execution trees: startup cost vs total cost, estimated vs actual row counts, loop multipliers, and shared buffer hits vs reads.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Decoding bottom-up execution trees: startup cost vs total cost, estimated vs actual row counts, loop multipliers, and shared buffer hits vs reads. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "reading-explain-and-explain-analyze-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers (explain-analyze, query-plan, buffers), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers (explain-analyze, query-plan, buffers), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "reading-explain-and-explain-analyze-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "reading-explain-and-explain-analyze-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["table-statistics-histograms-cardinality"] = [
  {
    "id": "table-statistics-histograms-cardinality-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms?",
    "options": [
      "How ANALYZE samples pages to populate pg_statistic / sqlite_stat1 with Most Common Values (MCV) lists and equi-depth histogram bounds.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How ANALYZE samples pages to populate pg_statistic / sqlite_stat1 with Most Common Values (MCV) lists and equi-depth histogram bounds. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "table-statistics-histograms-cardinality-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms (statistics, histograms, cardinality), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms (statistics, histograms, cardinality), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "table-statistics-histograms-cardinality-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "table-statistics-histograms-cardinality-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["selectivity-estimation-correlated-columns"] = [
  {
    "id": "selectivity-estimation-correlated-columns-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Selectivity Math, Independence Assumption Failures & Extended Statistics — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Selectivity Math, Independence Assumption Failures & Extended Statistics?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Selectivity Math, Independence Assumption Failures & Extended Statistics?",
    "options": [
      "Calculating P(A AND B) = P(A)×P(B), why correlated columns (city and zip_code) fool the planner by 100x, and fixing it with CREATE STATISTICS.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Calculating P(A AND B) = P(A)×P(B), why correlated columns (city and zip_code) fool the planner by 100x, and fixing it with CREATE STATISTICS. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "selectivity-estimation-correlated-columns-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Selectivity Math, Independence Assumption Failures & Extended Statistics — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Selectivity Math, Independence Assumption Failures & Extended Statistics (selectivity, correlated-columns, extended-statistics), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Selectivity Math, Independence Assumption Failures & Extended Statistics (selectivity, correlated-columns, extended-statistics), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "selectivity-estimation-correlated-columns-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Selectivity Math, Independence Assumption Failures & Extended Statistics — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Selectivity Math, Independence Assumption Failures & Extended Statistics degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Selectivity Math, Independence Assumption Failures & Extended Statistics degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "selectivity-estimation-correlated-columns-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Selectivity Math, Independence Assumption Failures & Extended Statistics — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Selectivity Math, Independence Assumption Failures & Extended Statistics across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Selectivity Math, Independence Assumption Failures & Extended Statistics across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["scan-operators-seq-index-bitmap"] = [
  {
    "id": "scan-operators-seq-index-bitmap-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan?",
    "options": [
      "How Bitmap Index Scan + Bitmap Heap Scan bridges the gap between single-row Index Scans and full Sequential Scans by sorting page IDs first.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How Bitmap Index Scan + Bitmap Heap Scan bridges the gap between single-row Index Scans and full Sequential Scans by sorting page IDs first. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "scan-operators-seq-index-bitmap-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan (seq-scan, index-scan, bitmap-scan), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan (seq-scan, index-scan, bitmap-scan), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "scan-operators-seq-index-bitmap-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "scan-operators-seq-index-bitmap-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["sargability-functions-on-columns"] = [
  {
    "id": "sargability-functions-on-columns-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes?",
    "options": [
      "Rewriting non-SARGable anti-patterns (WHERE strftime('%Y', created_at) = '2025' or WHERE amount / 100 > 50) into range-seekable predicates.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Rewriting non-SARGable anti-patterns (WHERE strftime('%Y', created_at) = '2025' or WHERE amount / 100 > 50) into range-seekable predicates. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "sargability-functions-on-columns-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes (sargability, query-rewriting, index-seek), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes (sargability, query-rewriting, index-seek), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "sargability-functions-on-columns-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "sargability-functions-on-columns-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["or-conditions-in-lists-union-rewrites"] = [
  {
    "id": "or-conditions-in-lists-union-rewrites-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites?",
    "options": [
      "Why WHERE a = 1 OR b = 2 often forces a full table scan and how optimizers or manual UNION ALL rewrites combine separate index paths.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why WHERE a = 1 OR b = 2 often forces a full table scan and how optimizers or manual UNION ALL rewrites combine separate index paths. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "or-conditions-in-lists-union-rewrites-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites (or-optimization, bitmap-or, union-all), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites (or-optimization, bitmap-or, union-all), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "or-conditions-in-lists-union-rewrites-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "or-conditions-in-lists-union-rewrites-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["sorting-spill-to-disk-top-n-heapsort"] = [
  {
    "id": "sorting-spill-to-disk-top-n-heapsort-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills?",
    "options": [
      "Why ORDER BY ... LIMIT 10 uses an O(N log K) bounded heap in memory while unbounded sorts exceeding work_mem spill to multi-pass external merge files.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why ORDER BY ... LIMIT 10 uses an O(N log K) bounded heap in memory while unbounded sorts exceeding work_mem spill to multi-pass external merge files. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "sorting-spill-to-disk-top-n-heapsort-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills (sorting, top-n-heapsort, external-merge-sort), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills (sorting, top-n-heapsort, external-merge-sort), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "sorting-spill-to-disk-top-n-heapsort-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "sorting-spill-to-disk-top-n-heapsort-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-stale-statistics-plan-flip"] = [
  {
    "id": "case-stale-statistics-plan-flip-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics?",
    "options": [
      "How a bulk ingestion of 5 million rows before autovacuum ANALYZE caused the planner to pick a Nested Loop Join instead of a Hash Join, stalling CPU at 100%.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How a bulk ingestion of 5 million rows before autovacuum ANALYZE caused the planner to pick a Nested Loop Join instead of a Hash Join, stalling CPU at 100%. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-stale-statistics-plan-flip-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics (plan-flip, stale-statistics, analyze), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics (plan-flip, stale-statistics, analyze), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-stale-statistics-plan-flip-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-stale-statistics-plan-flip-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-visual-explain-plan-analyzer"] = [
  {
    "id": "build-visual-explain-plan-analyzer-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter?",
    "options": [
      "Build a diagnostic engine that parses EXPLAIN QUERY PLAN outputs, detects full table scans and temp B-Tree sorts, and verifies SARGable query rewrites.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Build a diagnostic engine that parses EXPLAIN QUERY PLAN outputs, detects full table scans and temp B-Tree sorts, and verifies SARGable query rewrites. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-visual-explain-plan-analyzer-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter (build, explain-plan, query-tuning), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter (build, explain-plan, query-tuning), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-visual-explain-plan-analyzer-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-visual-explain-plan-analyzer-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter across OLTP and OLAP workloads?",
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
