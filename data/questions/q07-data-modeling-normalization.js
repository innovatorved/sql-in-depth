// SQL In Depth — Question Bank M07: Relational Data Modeling & Normalization (1NF to BCNF/5NF)
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["entity-relationship-modeling"] = [
  {
    "id": "entity-relationship-modeling-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables?",
    "options": [
      "Translating domain entities into physical tables, resolving many-to-many relationships with associative junction tables, and reading Crow's Foot ERDs.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Translating domain entities into physical tables, resolving many-to-many relationships with associative junction tables, and reading Crow's Foot ERDs. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "entity-relationship-modeling-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables (erd, data-modeling, junction-table), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables (erd, data-modeling, junction-table), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "entity-relationship-modeling-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "entity-relationship-modeling-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["functional-dependencies-keys"] = [
  {
    "id": "functional-dependencies-keys-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure?",
    "options": [
      "Formalizing data invariants with functional dependencies, computing attribute closure X+, and proving whether a decomposition is lossless-join.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Formalizing data invariants with functional dependencies, computing attribute closure X+, and proving whether a decomposition is lossless-join. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "functional-dependencies-keys-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure (functional-dependency, candidate-key, armstrong-axioms), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure (functional-dependency, candidate-key, armstrong-axioms), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "functional-dependencies-keys-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "functional-dependencies-keys-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["first-normal-form-atomicity"] = [
  {
    "id": "first-normal-form-atomicity-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns?",
    "options": [
      "Why storing comma-separated IDs or numbered columns (tag1, tag2, tag3) breaks indexing, referential integrity, and relational querying.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why storing comma-separated IDs or numbered columns (tag1, tag2, tag3) breaks indexing, referential integrity, and relational querying. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "first-normal-form-atomicity-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns (1nf, normalization, atomicity), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns (1nf, normalization, atomicity), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "first-normal-form-atomicity-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "first-normal-form-atomicity-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["second-third-normal-form"] = [
  {
    "id": "second-third-normal-form-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies?",
    "options": [
      "Removing partial dependencies on composite keys (2NF) and transitive non-key dependencies (3NF: \"the key, the whole key, and nothing but the key\").",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Removing partial dependencies on composite keys (2NF) and transitive non-key dependencies (3NF: \"the key, the whole key, and nothing but the key\"). The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "second-third-normal-form-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies (2nf, 3nf, normalization), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies (2nf, 3nf, normalization), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "second-third-normal-form-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "second-third-normal-form-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["boyce-codd-fourth-fifth-normal-form"] = [
  {
    "id": "boyce-codd-fourth-fifth-normal-form-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF)?",
    "options": [
      "When 3NF is still vulnerable to overlapping candidate key anomalies (BCNF) and how 4NF eliminates independent multi-valued fact cross-products.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. When 3NF is still vulnerable to overlapping candidate key anomalies (BCNF) and how 4NF eliminates independent multi-valued fact cross-products. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "boyce-codd-fourth-fifth-normal-form-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) (bcnf, 4nf, 5nf), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) (bcnf, 4nf, 5nf), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "boyce-codd-fourth-fifth-normal-form-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "boyce-codd-fourth-fifth-normal-form-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["update-insertion-deletion-anomalies"] = [
  {
    "id": "update-insertion-deletion-anomalies-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas?",
    "options": [
      "Tracing concrete SQL mutations that corrupt customer addresses, prevent inserting catalog items without orders, or erase facts on delete.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Tracing concrete SQL mutations that corrupt customer addresses, prevent inserting catalog items without orders, or erase facts on delete. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "update-insertion-deletion-anomalies-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas (anomalies, data-integrity, normalization), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas (anomalies, data-integrity, normalization), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "update-insertion-deletion-anomalies-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "update-insertion-deletion-anomalies-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["strategic-denormalization-tradeoffs"] = [
  {
    "id": "strategic-denormalization-tradeoffs-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Strategic Denormalization: Read vs Write Amplification & Cached Counters — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Strategic Denormalization: Read vs Write Amplification & Cached Counters?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Strategic Denormalization: Read vs Write Amplification & Cached Counters?",
    "options": [
      "Knowing when to break strict normalization in high-read OLTP systems using trigger-maintained summary columns, snapshot fields, and read models.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Knowing when to break strict normalization in high-read OLTP systems using trigger-maintained summary columns, snapshot fields, and read models. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "strategic-denormalization-tradeoffs-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Strategic Denormalization: Read vs Write Amplification & Cached Counters — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Strategic Denormalization: Read vs Write Amplification & Cached Counters (denormalization, tradeoffs, materialized-columns), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Strategic Denormalization: Read vs Write Amplification & Cached Counters (denormalization, tradeoffs, materialized-columns), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "strategic-denormalization-tradeoffs-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Strategic Denormalization: Read vs Write Amplification & Cached Counters — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Strategic Denormalization: Read vs Write Amplification & Cached Counters degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Strategic Denormalization: Read vs Write Amplification & Cached Counters degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "strategic-denormalization-tradeoffs-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Strategic Denormalization: Read vs Write Amplification & Cached Counters — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Strategic Denormalization: Read vs Write Amplification & Cached Counters across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Strategic Denormalization: Read vs Write Amplification & Cached Counters across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["schema-anti-patterns-eav-god-tables"] = [
  {
    "id": "schema-anti-patterns-eav-god-tables-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables?",
    "options": [
      "Why EAV tables destroy type safety and require 10-way self-joins, why polymorphic foreign keys cannot enforce integrity, and clean relational alternatives.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why EAV tables destroy type safety and require 10-way self-joins, why polymorphic foreign keys cannot enforce integrity, and clean relational alternatives. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "schema-anti-patterns-eav-god-tables-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables (anti-patterns, eav, polymorphic-associations), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables (anti-patterns, eav, polymorphic-associations), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "schema-anti-patterns-eav-god-tables-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "schema-anti-patterns-eav-god-tables-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-shopify-multi-tenant-schema"] = [
  {
    "id": "case-shopify-multi-tenant-schema-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Multi-Tenant Schema Architecture at Scale — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Multi-Tenant Schema Architecture at Scale?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Multi-Tenant Schema Architecture at Scale?",
    "options": [
      "Comparing Pool (shared table + tenant_id), Bridge (schema-per-tenant), and Silo (database-per-tenant) isolation models for B2B SaaS platforms.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Comparing Pool (shared table + tenant_id), Bridge (schema-per-tenant), and Silo (database-per-tenant) isolation models for B2B SaaS platforms. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-shopify-multi-tenant-schema-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Multi-Tenant Schema Architecture at Scale — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Multi-Tenant Schema Architecture at Scale (multi-tenancy, sharding, row-level-security), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Multi-Tenant Schema Architecture at Scale (multi-tenancy, sharding, row-level-security), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-shopify-multi-tenant-schema-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Multi-Tenant Schema Architecture at Scale — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Multi-Tenant Schema Architecture at Scale degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Multi-Tenant Schema Architecture at Scale degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-shopify-multi-tenant-schema-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Multi-Tenant Schema Architecture at Scale — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Multi-Tenant Schema Architecture at Scale across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Multi-Tenant Schema Architecture at Scale across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-normalized-booking-schema"] = [
  {
    "id": "build-normalized-booking-schema-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System?",
    "options": [
      "Decompose a denormalized, anomaly-ridden booking table into a lossless 3NF/BCNF relational schema and verify zero data loss via join reconstruction.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Decompose a denormalized, anomaly-ridden booking table into a lossless 3NF/BCNF relational schema and verify zero data loss via join reconstruction. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-normalized-booking-schema-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System (build, normalization, bcnf), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System (build, normalization, bcnf), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-normalized-booking-schema-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-normalized-booking-schema-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System across OLTP and OLAP workloads?",
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
