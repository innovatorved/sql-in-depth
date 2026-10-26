// SQL In Depth — Question Bank M04: Grouping, Aggregations & Multi-Dimensional Rollups
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["aggregate-functions-internals"] = [
  {
    "id": "aggregate-functions-internals-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG?",
    "options": [
      "How state transition functions accumulate values per group, why COUNT(col) skips NULLs while COUNT(*) counts tuples, and AVG(NULL) pitfalls.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How state transition functions accumulate values per group, why COUNT(col) skips NULLs while COUNT(*) counts tuples, and AVG(NULL) pitfalls. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "aggregate-functions-internals-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG (aggregates, count, null-semantics), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG (aggregates, count, null-semantics), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "aggregate-functions-internals-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "aggregate-functions-internals-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["group-by-execution-mechanics"] = [
  {
    "id": "group-by-execution-mechanics-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency?",
    "options": [
      "How the execution engine partitions rows via hashing or sorting, and why selecting non-grouped columns without functional dependency is invalid.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How the execution engine partitions rows via hashing or sorting, and why selecting non-grouped columns without functional dependency is invalid. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "group-by-execution-mechanics-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency (group-by, hash-aggregate, functional-dependency), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency (group-by, hash-aggregate, functional-dependency), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "group-by-execution-mechanics-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "group-by-execution-mechanics-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["having-vs-where-pipeline"] = [
  {
    "id": "having-vs-where-pipeline-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline?",
    "options": [
      "Why pushing selective predicates into WHERE prunes rows before hash table allocation, reserving HAVING strictly for group-level aggregates.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why pushing selective predicates into WHERE prunes rows before hash table allocation, reserving HAVING strictly for group-level aggregates. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "having-vs-where-pipeline-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline (having, where, query-pipeline), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline (having, where, query-pipeline), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "having-vs-where-pipeline-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "having-vs-where-pipeline-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["conditional-aggregation-filter"] = [
  {
    "id": "conditional-aggregation-filter-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...)?",
    "options": [
      "Computing multiple filtered metrics in a single table scan using CASE expressions and the SQL:2003 FILTER (WHERE ...) clause.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Computing multiple filtered metrics in a single table scan using CASE expressions and the SQL:2003 FILTER (WHERE ...) clause. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "conditional-aggregation-filter-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) (conditional-aggregation, filter-clause, pivot), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) (conditional-aggregation, filter-clause, pivot), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "conditional-aggregation-filter-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "conditional-aggregation-filter-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["string-json-array-aggregation"] = [
  {
    "id": "string-json-array-aggregation-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation?",
    "options": [
      "Collapsing one-to-many child rows into ordered delimited strings or nested JSON arrays without N+1 application round-trips.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Collapsing one-to-many child rows into ordered delimited strings or nested JSON arrays without N+1 application round-trips. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "string-json-array-aggregation-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation (string-agg, group-concat, json-agg), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation (string-agg, group-concat, json-agg), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "string-json-array-aggregation-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "string-json-array-aggregation-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["grouping-sets-rollup-cube"] = [
  {
    "id": "grouping-sets-rollup-cube-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING()?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING()?",
    "options": [
      "Generating subtotals, hierarchical rollups, and full cross-tabulation cubes in a single pass while distinguishing real NULLs via GROUPING().",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Generating subtotals, hierarchical rollups, and full cross-tabulation cubes in a single pass while distinguishing real NULLs via GROUPING(). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "grouping-sets-rollup-cube-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() (grouping-sets, rollup, cube), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() (grouping-sets, rollup, cube), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "grouping-sets-rollup-cube-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "grouping-sets-rollup-cube-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING() across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["join-fanout-chasm-traps"] = [
  {
    "id": "join-fanout-chasm-traps-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts)?",
    "options": [
      "Visualizing how joining two independent one-to-many child tables multiplies parent rows and inflates SUM/COUNT aggregates unless pre-aggregated.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Visualizing how joining two independent one-to-many child tables multiplies parent rows and inflates SUM/COUNT aggregates unless pre-aggregated. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "join-fanout-chasm-traps-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) (fanout-trap, chasm-trap, double-counting), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) (fanout-trap, chasm-trap, double-counting), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "join-fanout-chasm-traps-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "join-fanout-chasm-traps-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["histograms-percentiles-medians"] = [
  {
    "id": "histograms-percentiles-medians-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Statistical SQL: Equi-Width Histograms, Percentiles & Medians — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Statistical SQL: Equi-Width Histograms, Percentiles & Medians?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Statistical SQL: Equi-Width Histograms, Percentiles & Medians?",
    "options": [
      "Computing exact and approximate p50/p95/p99 latencies, discrete vs continuous percentiles, and bucketed frequency distributions in SQL.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Computing exact and approximate p50/p95/p99 latencies, discrete vs continuous percentiles, and bucketed frequency distributions in SQL. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "histograms-percentiles-medians-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Statistical SQL: Equi-Width Histograms, Percentiles & Medians — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Statistical SQL: Equi-Width Histograms, Percentiles & Medians (percentiles, median, histograms), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Statistical SQL: Equi-Width Histograms, Percentiles & Medians (percentiles, median, histograms), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "histograms-percentiles-medians-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Statistical SQL: Equi-Width Histograms, Percentiles & Medians — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Statistical SQL: Equi-Width Histograms, Percentiles & Medians degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Statistical SQL: Equi-Width Histograms, Percentiles & Medians degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "histograms-percentiles-medians-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Statistical SQL: Equi-Width Histograms, Percentiles & Medians — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Statistical SQL: Equi-Width Histograms, Percentiles & Medians across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Statistical SQL: Equi-Width Histograms, Percentiles & Medians across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-analytics-double-counting-bug"] = [
  {
    "id": "case-analytics-double-counting-bug-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug?",
    "options": [
      "Tracing an executive dashboard incident where joining orders to both order_items and shipments inflated reported revenue by 310%.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Tracing an executive dashboard incident where joining orders to both order_items and shipments inflated reported revenue by 310%. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-analytics-double-counting-bug-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug (fanout-bug, analytics, pre-aggregation), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug (fanout-bug, analytics, pre-aggregation), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-analytics-double-counting-bug-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-analytics-double-counting-bug-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-executive-kpi-aggregation-suite"] = [
  {
    "id": "build-executive-kpi-aggregation-suite-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite?",
    "options": [
      "Construct a fanout-safe executive KPI query suite combining conditional aggregation, pre-aggregated CTEs, and multi-dimensional rollups.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Construct a fanout-safe executive KPI query suite combining conditional aggregation, pre-aggregated CTEs, and multi-dimensional rollups. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-executive-kpi-aggregation-suite-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite (build, aggregations, kpi-suite), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite (build, aggregations, kpi-suite), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-executive-kpi-aggregation-suite-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-executive-kpi-aggregation-suite-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite across OLTP and OLAP workloads?",
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
