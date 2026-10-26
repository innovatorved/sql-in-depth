// SQL In Depth — Question Bank M12: Physical Join Algorithms & Execution Pipelines
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["nested-loop-join-indexed-nlj"] = [
  {
    "id": "nested-loop-join-indexed-nlj-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ?",
    "options": [
      "How Nested Loop Join streams outer tuples and why an index on the inner join key turns O(N×M) into fast O(N log B) point lookups for small outer sets.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How Nested Loop Join streams outer tuples and why an index on the inner join key turns O(N×M) into fast O(N log B) point lookups for small outer sets. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "nested-loop-join-indexed-nlj-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ (nested-loop-join, inlj, join-algorithms), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ (nested-loop-join, inlj, join-algorithms), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "nested-loop-join-indexed-nlj-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "nested-loop-join-indexed-nlj-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["hash-join-build-probe-grace"] = [
  {
    "id": "hash-join-build-probe-grace-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills?",
    "options": [
      "Building an in-memory hash table on the smaller relation, probing with the larger relation in O(N+M), and partitioning into disk batches when memory overflows.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Building an in-memory hash table on the smaller relation, probing with the larger relation in O(N+M), and partitioning into disk batches when memory overflows. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "hash-join-build-probe-grace-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills (hash-join, grace-hash-join, work-mem), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills (hash-join, grace-hash-join, work-mem), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "hash-join-build-probe-grace-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "hash-join-build-probe-grace-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["sort-merge-join-zipper-mechanics"] = [
  {
    "id": "sort-merge-join-zipper-mechanics-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding?",
    "options": [
      "Advancing two interleaved cursors in O(N+M) when inputs arrive pre-sorted from B+Tree indexes, and handling many-to-many duplicate key runs.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Advancing two interleaved cursors in O(N+M) when inputs arrive pre-sorted from B+Tree indexes, and handling many-to-many duplicate key runs. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "sort-merge-join-zipper-mechanics-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding (sort-merge-join, merge-join, sorted-streams), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding (sort-merge-join, merge-join, sorted-streams), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "sort-merge-join-zipper-mechanics-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "sort-merge-join-zipper-mechanics-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["join-order-search-dynamic-programming"] = [
  {
    "id": "join-order-search-dynamic-programming-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees?",
    "options": [
      "Why joining 10 tables has 3.6 million plan permutations and how Selinger bottom-up dynamic programming prunes dominated subplans.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why joining 10 tables has 3.6 million plan permutations and how Selinger bottom-up dynamic programming prunes dominated subplans. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "join-order-search-dynamic-programming-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees (join-ordering, selinger, dynamic-programming), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees (join-ordering, selinger, dynamic-programming), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "join-order-search-dynamic-programming-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "join-order-search-dynamic-programming-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["predicate-pushdown-projection-pruning"] = [
  {
    "id": "predicate-pushdown-projection-pruning-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination?",
    "options": [
      "Pushing WHERE filters below joins and views to shrink intermediate tuple counts as early as possible, and eliminating redundant foreign-key joins.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Pushing WHERE filters below joins and views to shrink intermediate tuple counts as early as possible, and eliminating redundant foreign-key joins. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "predicate-pushdown-projection-pruning-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination (predicate-pushdown, projection-pruning, query-rewrites), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination (predicate-pushdown, projection-pruning, query-rewrites), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "predicate-pushdown-projection-pruning-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "predicate-pushdown-projection-pruning-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["subquery-unnesting-semi-anti-physical"] = [
  {
    "id": "subquery-unnesting-semi-anti-physical-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators?",
    "options": [
      "How the query optimizer transforms declarative EXISTS and NOT EXISTS subqueries into physical Hash Semi-Join and Anti-Join execution nodes.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How the query optimizer transforms declarative EXISTS and NOT EXISTS subqueries into physical Hash Semi-Join and Anti-Join execution nodes. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "subquery-unnesting-semi-anti-physical-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators (subquery-unnesting, hash-semi-join, anti-join), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators (subquery-unnesting, hash-semi-join, anti-join), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "subquery-unnesting-semi-anti-physical-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "subquery-unnesting-semi-anti-physical-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["execution-models-volcano-vectorized"] = [
  {
    "id": "execution-models-volcano-vectorized-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT?",
    "options": [
      "Comparing classic pull-based Volcano tuple-at-a-time virtual calls against cache-resident 1024-tuple column vectors and LLVM JIT expression compilation.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Comparing classic pull-based Volcano tuple-at-a-time virtual calls against cache-resident 1024-tuple column vectors and LLVM JIT expression compilation. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "execution-models-volcano-vectorized-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT (volcano-model, vectorized-execution, jit), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT (volcano-model, vectorized-execution, jit), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "execution-models-volcano-vectorized-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "execution-models-volcano-vectorized-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["parallel-query-execution-workers"] = [
  {
    "id": "parallel-query-execution-workers-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes?",
    "options": [
      "Coordinating multiple background worker processes to scan shared heap blocks concurrently and build shared-memory hash tables.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Coordinating multiple background worker processes to scan shared heap blocks concurrently and build shared-memory hash tables. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "parallel-query-execution-workers-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes (parallel-query, parallel-hash-join, workers), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes (parallel-query, parallel-hash-join, workers), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "parallel-query-execution-workers-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "parallel-query-execution-workers-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-hash-join-oom-work-mem-spill"] = [
  {
    "id": "case-hash-join-oom-work-mem-spill-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills?",
    "options": [
      "Investigating a slow reporting query that spilled 18 GB of temporary hash batch files to disk due to underestimated cardinality and low work_mem.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Investigating a slow reporting query that spilled 18 GB of temporary hash batch files to disk due to underestimated cardinality and low work_mem. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-hash-join-oom-work-mem-spill-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills (work-mem, hash-join-spill, temp-files), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills (work-mem, hash-join-spill, temp-files), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-hash-join-oom-work-mem-spill-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-hash-join-oom-work-mem-spill-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-physical-join-execution-engine"] = [
  {
    "id": "build-physical-join-execution-engine-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join?",
    "options": [
      "Implement physical Nested Loop, Hash Join, and Sort-Merge Join operators and verify their tuple comparisons and memory budgets across skewed datasets.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Implement physical Nested Loop, Hash Join, and Sort-Merge Join operators and verify their tuple comparisons and memory budgets across skewed datasets. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-physical-join-execution-engine-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join (build, join-algorithms, hash-join), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join (build, join-algorithms, hash-join), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-physical-join-execution-engine-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-physical-join-execution-engine-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join across OLTP and OLAP workloads?",
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
