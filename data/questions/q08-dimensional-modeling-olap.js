// SQL In Depth — Question Bank M08: Dimensional Modeling & Analytical Schema Design
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["oltp-vs-olap-workload-physics"] = [
  {
    "id": "oltp-vs-olap-workload-physics-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans?",
    "options": [
      "Contrasting high-concurrency transactional point mutations against wide analytical aggregations and why they demand different schema topologies.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Contrasting high-concurrency transactional point mutations against wide analytical aggregations and why they demand different schema topologies. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "oltp-vs-olap-workload-physics-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans (oltp, olap, workload-physics), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans (oltp, olap, workload-physics), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "oltp-vs-olap-workload-physics-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "oltp-vs-olap-workload-physics-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["star-schema-facts-dimensions"] = [
  {
    "id": "star-schema-facts-dimensions-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions?",
    "options": [
      "Declaring an unambiguous fact grain, classifying additive, semi-additive (account balances), and non-additive measures, and surrogate dimension keys.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Declaring an unambiguous fact grain, classifying additive, semi-additive (account balances), and non-additive measures, and surrogate dimension keys. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "star-schema-facts-dimensions-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions (star-schema, kimball, fact-tables), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions (star-schema, kimball, fact-tables), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "star-schema-facts-dimensions-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "star-schema-facts-dimensions-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["snowflake-vs-star-vs-obt"] = [
  {
    "id": "snowflake-vs-star-vs-obt-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses?",
    "options": [
      "Benchmarking join cost vs storage compression across normalized Snowflake dimensions, classic Star schemas, and wide columnar One Big Tables.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Benchmarking join cost vs storage compression across normalized Snowflake dimensions, classic Star schemas, and wide columnar One Big Tables. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "snowflake-vs-star-vs-obt-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses (snowflake-schema, obt, data-warehouse), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses (snowflake-schema, obt, data-warehouse), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "snowflake-vs-star-vs-obt-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "snowflake-vs-star-vs-obt-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["slowly-changing-dimensions-scd"] = [
  {
    "id": "slowly-changing-dimensions-scd-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6?",
    "options": [
      "Preserving point-in-time historical truth when customer tiers or territories change using SCD Type 2 (valid_from, valid_to, is_current) rows.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Preserving point-in-time historical truth when customer tiers or territories change using SCD Type 2 (valid_from, valid_to, is_current) rows. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "slowly-changing-dimensions-scd-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 (scd-type-2, dimensional-modeling, history-tracking), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 (scd-type-2, dimensional-modeling, history-tracking), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "slowly-changing-dimensions-scd-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "slowly-changing-dimensions-scd-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6 across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["bridge-tables-junk-role-dimensions"] = [
  {
    "id": "bridge-tables-junk-role-dimensions-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables?",
    "options": [
      "Joining a single date dimension multiple times (Order Date, Ship Date), consolidating low-cardinality flags into Junk Dimensions, and weighting bridge tables.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Joining a single date dimension multiple times (Order Date, Ship Date), consolidating low-cardinality flags into Junk Dimensions, and weighting bridge tables. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "bridge-tables-junk-role-dimensions-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables (role-playing-dimension, junk-dimension, bridge-table), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables (role-playing-dimension, junk-dimension, bridge-table), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "bridge-tables-junk-role-dimensions-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "bridge-tables-junk-role-dimensions-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["temporal-tables-bitemporal-sql"] = [
  {
    "id": "temporal-tables-bitemporal-sql-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Temporal & Bitemporal SQL: System Time vs Valid Application Time — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Temporal & Bitemporal SQL: System Time vs Valid Application Time?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Temporal & Bitemporal SQL: System Time vs Valid Application Time?",
    "options": [
      "Tracking both when a fact was true in reality (valid time) and when it was recorded in the database (transaction time) for audit-grade time travel.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Tracking both when a fact was true in reality (valid time) and when it was recorded in the database (transaction time) for audit-grade time travel. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "temporal-tables-bitemporal-sql-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Temporal & Bitemporal SQL: System Time vs Valid Application Time — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Temporal & Bitemporal SQL: System Time vs Valid Application Time (bitemporal, temporal-tables, sql-2011), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Temporal & Bitemporal SQL: System Time vs Valid Application Time (bitemporal, temporal-tables, sql-2011), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "temporal-tables-bitemporal-sql-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Temporal & Bitemporal SQL: System Time vs Valid Application Time — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Temporal & Bitemporal SQL: System Time vs Valid Application Time degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Temporal & Bitemporal SQL: System Time vs Valid Application Time degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "temporal-tables-bitemporal-sql-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Temporal & Bitemporal SQL: System Time vs Valid Application Time — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Temporal & Bitemporal SQL: System Time vs Valid Application Time across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Temporal & Bitemporal SQL: System Time vs Valid Application Time across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["json-semi-structured-hybrid-schemas"] = [
  {
    "id": "json-semi-structured-hybrid-schemas-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution?",
    "options": [
      "Combining strict relational columns for core entities with flexible JSON attributes and indexing hot JSON paths via virtual/stored generated columns.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Combining strict relational columns for core entities with flexible JSON attributes and indexing hot JSON paths via virtual/stored generated columns. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "json-semi-structured-hybrid-schemas-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution (jsonb, semi-structured, generated-columns), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution (jsonb, semi-structured, generated-columns), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "json-semi-structured-hybrid-schemas-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "json-semi-structured-hybrid-schemas-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["idempotency-audit-logs-event-tables"] = [
  {
    "id": "idempotency-audit-logs-event-tables-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox?",
    "options": [
      "Designing tamper-evident append-only event tables and guaranteeing reliable microservice event publishing via the Transactional Outbox pattern.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Designing tamper-evident append-only event tables and guaranteeing reliable microservice event publishing via the Transactional Outbox pattern. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "idempotency-audit-logs-event-tables-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox (audit-log, transactional-outbox, cdc), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox (audit-log, transactional-outbox, cdc), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "idempotency-audit-logs-event-tables-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "idempotency-audit-logs-event-tables-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-airbnb-minerva-metric-layer"] = [
  {
    "id": "case-airbnb-minerva-metric-layer-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Designing a Canonical Metric Store at Petabyte Scale — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Designing a Canonical Metric Store at Petabyte Scale?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Designing a Canonical Metric Store at Petabyte Scale?",
    "options": [
      "How standardized dimensional star schemas and certified metric definitions eliminate conflicting KPI numbers across hundreds of product teams.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How standardized dimensional star schemas and certified metric definitions eliminate conflicting KPI numbers across hundreds of product teams. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-airbnb-minerva-metric-layer-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Designing a Canonical Metric Store at Petabyte Scale — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Designing a Canonical Metric Store at Petabyte Scale (metric-layer, star-schema, analytics-engineering), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Designing a Canonical Metric Store at Petabyte Scale (metric-layer, star-schema, analytics-engineering), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-airbnb-minerva-metric-layer-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Designing a Canonical Metric Store at Petabyte Scale — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Designing a Canonical Metric Store at Petabyte Scale degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Designing a Canonical Metric Store at Petabyte Scale degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-airbnb-minerva-metric-layer-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Designing a Canonical Metric Store at Petabyte Scale — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Designing a Canonical Metric Store at Petabyte Scale across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Designing a Canonical Metric Store at Petabyte Scale across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-scd-type2-warehouse-pipeline"] = [
  {
    "id": "build-scd-type2-warehouse-pipeline-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline?",
    "options": [
      "Build a Kimball star schema and write the idempotent SCD Type 2 merge pipeline that expires old dimension versions and inserts new historical rows.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Build a Kimball star schema and write the idempotent SCD Type 2 merge pipeline that expires old dimension versions and inserts new historical rows. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-scd-type2-warehouse-pipeline-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline (build, star-schema, scd2), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline (build, star-schema, scd2), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-scd-type2-warehouse-pipeline-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-scd-type2-warehouse-pipeline-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline across OLTP and OLAP workloads?",
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
