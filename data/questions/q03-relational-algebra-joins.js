// SQL In Depth — Question Bank M03: Relational Algebra & Multi-Table Joins
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["relational-algebra-set-theory"] = [
  {
    "id": "relational-algebra-set-theory-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ)?",
    "options": [
      "Translating SQL queries into algebraic operator trees and proving why relational algebra closure enables algebraic query optimization.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Translating SQL queries into algebraic operator trees and proving why relational algebra closure enables algebraic query optimization. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "relational-algebra-set-theory-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) (relational-algebra, set-theory, codd), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) (relational-algebra, set-theory, codd), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "relational-algebra-set-theory-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "relational-algebra-set-theory-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["inner-join-equi-joins"] = [
  {
    "id": "inner-join-equi-joins-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal?",
    "options": [
      "How INNER JOIN pairs matching tuples across tables, why explicit ANSI JOIN syntax replaced comma joins, and multi-hop table traversal.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How INNER JOIN pairs matching tuples across tables, why explicit ANSI JOIN syntax replaced comma joins, and multi-hop table traversal. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "inner-join-equi-joins-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal (inner-join, equi-join, foreign-key), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal (inner-join, equi-join, foreign-key), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "inner-join-equi-joins-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "inner-join-equi-joins-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["left-right-full-outer-joins"] = [
  {
    "id": "left-right-full-outer-joins-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension?",
    "options": [
      "Preserving unmatched rows from the outer relation, understanding the preserved vs null-supplying table sides, and emulating FULL OUTER JOIN.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Preserving unmatched rows from the outer relation, understanding the preserved vs null-supplying table sides, and emulating FULL OUTER JOIN. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "left-right-full-outer-joins-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension (left-join, outer-join, null-extension), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension (left-join, outer-join, null-extension), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "left-right-full-outer-joins-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "left-right-full-outer-joins-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["join-where-vs-on-filter-trap"] = [
  {
    "id": "join-where-vs-on-filter-trap-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE?",
    "options": [
      "Why placing a predicate on the right-hand table inside WHERE silently converts a LEFT JOIN into an INNER JOIN by rejecting NULL-extended rows.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why placing a predicate on the right-hand table inside WHERE silently converts a LEFT JOIN into an INNER JOIN by rejecting NULL-extended rows. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "join-where-vs-on-filter-trap-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE (outer-join-trap, left-join, where-vs-on), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE (outer-join-trap, left-join, where-vs-on), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "join-where-vs-on-filter-trap-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "join-where-vs-on-filter-trap-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["self-joins-non-equi-joins"] = [
  {
    "id": "self-joins-non-equi-joins-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN)?",
    "options": [
      "Joining a table to itself with mandatory table aliases for manager-employee lookups, pairwise event comparisons, and temporal range overlaps.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Joining a table to itself with mandatory table aliases for manager-employee lookups, pairwise event comparisons, and temporal range overlaps. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "self-joins-non-equi-joins-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) (self-join, non-equi-join, range-join), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) (self-join, non-equi-join, range-join), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "self-joins-non-equi-joins-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "self-joins-non-equi-joins-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["cross-join-cartesian-products"] = [
  {
    "id": "cross-join-cartesian-products-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions?",
    "options": [
      "Intentional Cartesian products for date-product spine generation vs catastrophic N×M row explosions caused by missing join predicates.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Intentional Cartesian products for date-product spine generation vs catastrophic N×M row explosions caused by missing join predicates. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "cross-join-cartesian-products-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions (cross-join, cartesian-product, combinatorics), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions (cross-join, cartesian-product, combinatorics), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "cross-join-cartesian-products-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "cross-join-cartesian-products-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["semi-joins-anti-joins"] = [
  {
    "id": "semi-joins-anti-joins-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL)?",
    "options": [
      "Checking existence without duplicating left-hand rows when multiple right-hand matches exist, and finding orphan records with anti-joins.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Checking existence without duplicating left-hand rows when multiple right-hand matches exist, and finding orphan records with anti-joins. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "semi-joins-anti-joins-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) (semi-join, anti-join, exists), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) (semi-join, anti-join, exists), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "semi-joins-anti-joins-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "semi-joins-anti-joins-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL) across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["set-operations-union-intersect-except"] = [
  {
    "id": "set-operations-union-intersect-except-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT?",
    "options": [
      "Combining vertical result sets, why UNION ALL avoids an expensive sort/hash deduplication pass, and set difference via EXCEPT.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Combining vertical result sets, why UNION ALL avoids an expensive sort/hash deduplication pass, and set difference via EXCEPT. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "set-operations-union-intersect-except-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT (union, intersect, except), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT (union, intersect, except), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "set-operations-union-intersect-except-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "set-operations-union-intersect-except-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-missing-null-notin-outage"] = [
  {
    "id": "case-missing-null-notin-outage-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: How a Single NULL in NOT IN Returned Zero Rows — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: How a Single NULL in NOT IN Returned Zero Rows?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: How a Single NULL in NOT IN Returned Zero Rows?",
    "options": [
      "Dissecting a classic production outage where x NOT IN (SELECT nullable_col ...) evaluated to UNKNOWN for every row, and fixing it with NOT EXISTS.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Dissecting a classic production outage where x NOT IN (SELECT nullable_col ...) evaluated to UNKNOWN for every row, and fixing it with NOT EXISTS. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-missing-null-notin-outage-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: How a Single NULL in NOT IN Returned Zero Rows — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: How a Single NULL in NOT IN Returned Zero Rows (not-in-trap, null, anti-join), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: How a Single NULL in NOT IN Returned Zero Rows (not-in-trap, null, anti-join), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-missing-null-notin-outage-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: How a Single NULL in NOT IN Returned Zero Rows — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: How a Single NULL in NOT IN Returned Zero Rows degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: How a Single NULL in NOT IN Returned Zero Rows degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-missing-null-notin-outage-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: How a Single NULL in NOT IN Returned Zero Rows — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: How a Single NULL in NOT IN Returned Zero Rows across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: How a Single NULL in NOT IN Returned Zero Rows across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-multi-table-order-reconciler"] = [
  {
    "id": "build-multi-table-order-reconciler-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine?",
    "options": [
      "Build an audit query suite using LEFT JOIN, FULL OUTER reconciliation, and anti-joins to detect unshipped paid orders and settlement mismatches.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Build an audit query suite using LEFT JOIN, FULL OUTER reconciliation, and anti-joins to detect unshipped paid orders and settlement mismatches. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-multi-table-order-reconciler-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine (build, joins, reconciliation), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine (build, joins, reconciliation), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-multi-table-order-reconciler-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-multi-table-order-reconciler-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine across OLTP and OLAP workloads?",
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
