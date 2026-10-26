// SQL In Depth — Question Bank M18: Production Query Tuning, Observability & Database Reliability
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["keyset-cursor-pagination-vs-offset"] = [
  {
    "id": "keyset-cursor-pagination-vs-offset-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency?",
    "options": [
      "Why OFFSET 100000 forces the engine to fetch and discard 100,000 rows, and how row-value seek predicates WHERE (created_at, id) < (?, ?) run in O(1) constant time.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why OFFSET 100000 forces the engine to fetch and discard 100,000 rows, and how row-value seek predicates WHERE (created_at, id) < (?, ?) run in O(1) constant time. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "keyset-cursor-pagination-vs-offset-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency (keyset-pagination, cursor-pagination, offset-trap), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency (keyset-pagination, cursor-pagination, offset-trap), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "keyset-cursor-pagination-vs-offset-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "keyset-cursor-pagination-vs-offset-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["solving-n-plus-one-orm-queries"] = [
  {
    "id": "solving-n-plus-one-orm-queries-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation?",
    "options": [
      "Detecting 1+N chatty query loops in application traces and collapsing 501 round-trips into 1 or 2 indexed queries using IN batching or lateral JSON aggregation.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Detecting 1+N chatty query loops in application traces and collapsing 501 round-trips into 1 or 2 indexed queries using IN batching or lateral JSON aggregation. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "solving-n-plus-one-orm-queries-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation (n-plus-one, orm-tuning, query-batching), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation (n-plus-one, orm-tuning, query-batching), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "solving-n-plus-one-orm-queries-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "solving-n-plus-one-orm-queries-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["full-text-search-trigrams-inverted-index"] = [
  {
    "id": "full-text-search-trigrams-inverted-index-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25?",
    "options": [
      "Why leading-wildcard LIKE cannot use a B+Tree index, and how 3-character trigram GIN indexes and tokenized tsvector inverted indexes deliver sub-10ms search.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why leading-wildcard LIKE cannot use a B+Tree index, and how 3-character trigram GIN indexes and tokenized tsvector inverted indexes deliver sub-10ms search. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "full-text-search-trigrams-inverted-index-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 (full-text-search, trigram-index, bm25), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 (full-text-search, trigram-index, bm25), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "full-text-search-trigrams-inverted-index-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "full-text-search-trigrams-inverted-index-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25 across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["queue-processing-skip-locked-patterns"] = [
  {
    "id": "queue-processing-skip-locked-patterns-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED?",
    "options": [
      "Building a durable, exactly-once background task queue inside SQL without external brokers using partial indexes, SKIP LOCKED, and lease heartbeats.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Building a durable, exactly-once background task queue inside SQL without external brokers using partial indexes, SKIP LOCKED, and lease heartbeats. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "queue-processing-skip-locked-patterns-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED (job-queue, skip-locked, workers), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED (job-queue, skip-locked, workers), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "queue-processing-skip-locked-patterns-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "queue-processing-skip-locked-patterns-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["bulk-ingestion-batching-unlogged-tables"] = [
  {
    "id": "bulk-ingestion-batching-unlogged-tables-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY?",
    "options": [
      "Ingesting 100 million rows 20x faster by streaming binary COPY into staging tables, deferring B+Tree index builds, and tuning synchronous_commit.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Ingesting 100 million rows 20x faster by streaming binary COPY into staging tables, deferring B+Tree index builds, and tuning synchronous_commit. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "bulk-ingestion-batching-unlogged-tables-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY (bulk-ingest, copy, unlogged-tables), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY (bulk-ingest, copy, unlogged-tables), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "bulk-ingestion-batching-unlogged-tables-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "bulk-ingestion-batching-unlogged-tables-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["pg-stat-statements-slow-query-triage"] = [
  {
    "id": "pg-stat-statements-slow-query-triage-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio?",
    "options": [
      "Triaging database CPU saturation using normalized query digests: ranking by total_exec_time, shared_blks_read I/O pressure, and temp_blks_written spills.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Triaging database CPU saturation using normalized query digests: ranking by total_exec_time, shared_blks_read I/O pressure, and temp_blks_written spills. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "pg-stat-statements-slow-query-triage-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio (pg-stat-statements, observability, slow-query-log), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio (pg-stat-statements, observability, slow-query-log), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "pg-stat-statements-slow-query-triage-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "pg-stat-statements-slow-query-triage-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["lock-contention-zero-downtime-ddl"] = [
  {
    "id": "lock-contention-zero-downtime-ddl-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID?",
    "options": [
      "Protecting production OLTP availability with mandatory lock_timeout guards, online index builds, and two-step NOT VALID + VALIDATE CONSTRAINT foreign keys.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Protecting production OLTP availability with mandatory lock_timeout guards, online index builds, and two-step NOT VALID + VALIDATE CONSTRAINT foreign keys. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "lock-contention-zero-downtime-ddl-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID (zero-downtime-ddl, lock-timeout, concurrent-index), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID (zero-downtime-ddl, lock-timeout, concurrent-index), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "lock-contention-zero-downtime-ddl-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "lock-contention-zero-downtime-ddl-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["backup-pitr-wal-archiving-drills"] = [
  {
    "id": "backup-pitr-wal-archiving-drills-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay?",
    "options": [
      "Why pg_dump cannot restore a 5 TB database to 14:02:59 right before an accidental DROP TABLE, and how physical base backups + continuous WAL archiving achieve PITR.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why pg_dump cannot restore a 5 TB database to 14:02:59 right before an accidental DROP TABLE, and how physical base backups + continuous WAL archiving achieve PITR. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "backup-pitr-wal-archiving-drills-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay (pitr, backups, wal-archiving), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay (pitr, backups, wal-archiving), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "backup-pitr-wal-archiving-drills-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "backup-pitr-wal-archiving-drills-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-gitlab-database-incident-postmortem"] = [
  {
    "id": "case-gitlab-database-incident-postmortem-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills?",
    "options": [
      "Analyzing real-world production database emergencies, replication lag cascades, backup verification failures, and automated chaos recovery testing.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Analyzing real-world production database emergencies, replication lag cascades, backup verification failures, and automated chaos recovery testing. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-gitlab-database-incident-postmortem-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills (incident-postmortem, pitr, database-reliability), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills (incident-postmortem, pitr, database-reliability), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-gitlab-database-incident-postmortem-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-gitlab-database-incident-postmortem-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-production-sql-tuning-clinic"] = [
  {
    "id": "build-production-sql-tuning-clinic-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup)?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup)?",
    "options": [
      "Diagnose and rewrite a suite of pathological production SQL queries (non-SARGable filters, N+1 loops, OFFSET pagination, and missing composite indexes) for 100x speedups.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Diagnose and rewrite a suite of pathological production SQL queries (non-SARGable filters, N+1 loops, OFFSET pagination, and missing composite indexes) for 100x speedups. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-production-sql-tuning-clinic-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) (build, query-tuning, performance-clinic), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) (build, query-tuning, performance-clinic), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-production-sql-tuning-clinic-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-production-sql-tuning-clinic-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup) across OLTP and OLAP workloads?",
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
