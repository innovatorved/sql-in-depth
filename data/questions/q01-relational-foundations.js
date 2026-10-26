// SQL In Depth — Question Bank M01: The Relational Model, Tables & SELECT Foundations
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["why-databases-exist"] = [
  {
    "id": "why-databases-exist-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL?",
    "options": [
      "Why ad-hoc CSV/JSON files fail under concurrent mutations and how Edgar Codd's relational model separated physical storage from declarative queries.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why ad-hoc CSV/JSON files fail under concurrent mutations and how Edgar Codd's relational model separated physical storage from declarative queries. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "why-databases-exist-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL (relational-model, foundations, codd), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL (relational-model, foundations, codd), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "why-databases-exist-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "why-databases-exist-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["tables-rows-columns-types"] = [
  {
    "id": "tables-rows-columns-types-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Relations, Tuples, Attributes, Domains & SQL Data Types — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Relations, Tuples, Attributes, Domains & SQL Data Types?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Relations, Tuples, Attributes, Domains & SQL Data Types?",
    "options": [
      "Mapping mathematical relations to SQL tables, strict vs dynamic type affinity, exact NUMERIC/DECIMAL vs IEEE-754 FLOAT, and UTF-8 text encoding.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Mapping mathematical relations to SQL tables, strict vs dynamic type affinity, exact NUMERIC/DECIMAL vs IEEE-754 FLOAT, and UTF-8 text encoding. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "tables-rows-columns-types-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Relations, Tuples, Attributes, Domains & SQL Data Types — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Relations, Tuples, Attributes, Domains & SQL Data Types (data-types, schema, numeric), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Relations, Tuples, Attributes, Domains & SQL Data Types (data-types, schema, numeric), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "tables-rows-columns-types-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Relations, Tuples, Attributes, Domains & SQL Data Types — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Relations, Tuples, Attributes, Domains & SQL Data Types degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Relations, Tuples, Attributes, Domains & SQL Data Types degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "tables-rows-columns-types-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Relations, Tuples, Attributes, Domains & SQL Data Types — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Relations, Tuples, Attributes, Domains & SQL Data Types across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Relations, Tuples, Attributes, Domains & SQL Data Types across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["select-projection-aliases"] = [
  {
    "id": "select-projection-aliases-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "SELECT Projection, Expressions, Aliases & Logical Execution Order — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of SELECT Projection, Expressions, Aliases & Logical Execution Order?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of SELECT Projection, Expressions, Aliases & Logical Execution Order?",
    "options": [
      "How the SQL engine binds FROM before evaluating SELECT projections, why column aliases fail inside WHERE, and expression evaluation pipelines.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How the SQL engine binds FROM before evaluating SELECT projections, why column aliases fail inside WHERE, and expression evaluation pipelines. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "select-projection-aliases-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "SELECT Projection, Expressions, Aliases & Logical Execution Order — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving SELECT Projection, Expressions, Aliases & Logical Execution Order (select, projection, execution-order), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving SELECT Projection, Expressions, Aliases & Logical Execution Order (select, projection, execution-order), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "select-projection-aliases-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "SELECT Projection, Expressions, Aliases & Logical Execution Order — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from SELECT Projection, Expressions, Aliases & Logical Execution Order degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from SELECT Projection, Expressions, Aliases & Logical Execution Order degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "select-projection-aliases-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "SELECT Projection, Expressions, Aliases & Logical Execution Order — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting SELECT Projection, Expressions, Aliases & Logical Execution Order across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting SELECT Projection, Expressions, Aliases & Logical Execution Order across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["where-filtering-predicates"] = [
  {
    "id": "where-filtering-predicates-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability?",
    "options": [
      "Row-level tuple filtering with comparison operators, range bounds, pattern matching, and an introduction to Search Argument Able (SARGable) predicates.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Row-level tuple filtering with comparison operators, range bounds, pattern matching, and an introduction to Search Argument Able (SARGable) predicates. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "where-filtering-predicates-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability (where, predicates, sargability), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability (where, predicates, sargability), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "where-filtering-predicates-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "where-filtering-predicates-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["boolean-logic-three-valued-null"] = [
  {
    "id": "boolean-logic-three-valued-null-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Boolean Logic, Operator Precedence & Three-Valued Logic (3VL)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Boolean Logic, Operator Precedence & Three-Valued Logic (3VL)?",
    "options": [
      "How SQL extends Boolean algebra with UNKNOWN (NULL), truth tables for AND/OR/NOT, and why NOT (col = 5) drops NULL rows silently.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How SQL extends Boolean algebra with UNKNOWN (NULL), truth tables for AND/OR/NOT, and why NOT (col = 5) drops NULL rows silently. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "boolean-logic-three-valued-null-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) (three-valued-logic, null, boolean), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) (three-valued-logic, null, boolean), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "boolean-logic-three-valued-null-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "boolean-logic-three-valued-null-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Boolean Logic, Operator Precedence & Three-Valued Logic (3VL) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["null-semantics-coalesce-nullif"] = [
  {
    "id": "null-semantics-coalesce-nullif-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF?",
    "options": [
      "Null-safe comparisons with IS NOT DISTINCT FROM, fallback chains via COALESCE, division-by-zero guards with NULLIF, and aggregate NULL rules.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Null-safe comparisons with IS NOT DISTINCT FROM, fallback chains via COALESCE, division-by-zero guards with NULLIF, and aggregate NULL rules. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "null-semantics-coalesce-nullif-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF (null-handling, coalesce, nullif), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF (null-handling, coalesce, nullif), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "null-semantics-coalesce-nullif-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "null-semantics-coalesce-nullif-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["order-by-limit-offset-distinct"] = [
  {
    "id": "order-by-limit-offset-distinct-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT?",
    "options": [
      "Deterministic multi-column sorting, NULL sort ordering across dialects, hash vs sort deduplication for DISTINCT, and Top-N heap slicing.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Deterministic multi-column sorting, NULL sort ordering across dialects, hash vs sort deduplication for DISTINCT, and Top-N heap slicing. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "order-by-limit-offset-distinct-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT (order-by, distinct, pagination), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT (order-by, distinct, pagination), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "order-by-limit-offset-distinct-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "order-by-limit-offset-distinct-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-expressions-type-casting"] = [
  {
    "id": "case-expressions-type-casting-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning?",
    "options": [
      "Branching inside projections and predicates with searched CASE WHEN expressions, safe type conversions, and defensive data normalization.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Branching inside projections and predicates with searched CASE WHEN expressions, safe type conversions, and defensive data normalization. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-expressions-type-casting-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning (case-when, type-casting, data-cleaning), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning (case-when, type-casting, data-cleaning), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-expressions-type-casting-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-expressions-type-casting-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-stripe-ledger-precision"] = [
  {
    "id": "case-stripe-ledger-precision-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Why Floating-Point Corrupts Financial Ledgers — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Why Floating-Point Corrupts Financial Ledgers?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Why Floating-Point Corrupts Financial Ledgers?",
    "options": [
      "How binary IEEE-754 floating-point rounding drift causes penny imbalances at scale and how integer cents + exact NUMERIC enforce ledger invariants.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How binary IEEE-754 floating-point rounding drift causes penny imbalances at scale and how integer cents + exact NUMERIC enforce ledger invariants. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-stripe-ledger-precision-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Why Floating-Point Corrupts Financial Ledgers — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Why Floating-Point Corrupts Financial Ledgers (fintech, numeric-precision, ledger), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Why Floating-Point Corrupts Financial Ledgers (fintech, numeric-precision, ledger), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-stripe-ledger-precision-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Why Floating-Point Corrupts Financial Ledgers — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Why Floating-Point Corrupts Financial Ledgers degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Why Floating-Point Corrupts Financial Ledgers degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-stripe-ledger-precision-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Why Floating-Point Corrupts Financial Ledgers — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Why Floating-Point Corrupts Financial Ledgers across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Why Floating-Point Corrupts Financial Ledgers across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-sql-query-interpreter"] = [
  {
    "id": "build-sql-query-interpreter-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Mini Relational Tuple Filter & Projection Engine — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Mini Relational Tuple Filter & Projection Engine?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Mini Relational Tuple Filter & Projection Engine?",
    "options": [
      "Implement a clause-by-clause relational tuple evaluator supporting FROM, WHERE with Three-Valued NULL logic, SELECT projection, and ORDER BY.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Implement a clause-by-clause relational tuple evaluator supporting FROM, WHERE with Three-Valued NULL logic, SELECT projection, and ORDER BY. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-sql-query-interpreter-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Mini Relational Tuple Filter & Projection Engine — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Mini Relational Tuple Filter & Projection Engine (build, relational-engine, query-pipeline), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Mini Relational Tuple Filter & Projection Engine (build, relational-engine, query-pipeline), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-sql-query-interpreter-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Mini Relational Tuple Filter & Projection Engine — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Mini Relational Tuple Filter & Projection Engine degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Mini Relational Tuple Filter & Projection Engine degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-sql-query-interpreter-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Mini Relational Tuple Filter & Projection Engine — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Mini Relational Tuple Filter & Projection Engine across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Mini Relational Tuple Filter & Projection Engine across OLTP and OLAP workloads?",
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
