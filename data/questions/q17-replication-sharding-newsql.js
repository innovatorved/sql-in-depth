// SQL In Depth — Question Bank M17: Replication, Partitioning, Sharding & Distributed NewSQL
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["single-leader-replication-sync-async"] = [
  {
    "id": "single-leader-replication-sync-async-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async?",
    "options": [
      "Comparing byte-for-byte physical WAL streaming against row-level logical replication, and the latency vs RPO=0 trade-off of synchronous standbys.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Comparing byte-for-byte physical WAL streaming against row-level logical replication, and the latency vs RPO=0 trade-off of synchronous standbys. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "single-leader-replication-sync-async-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async (replication, wal-streaming, logical-replication), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async (replication, wal-streaming, logical-replication), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "single-leader-replication-sync-async-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "single-leader-replication-sync-async-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["read-replicas-consistency-models"] = [
  {
    "id": "read-replicas-consistency-models-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies?",
    "options": [
      "Why routing reads to asynchronous replicas causes users to think their just-saved data vanished, and fixing it with LSN causal tracking or primary pinning.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why routing reads to asynchronous replicas causes users to think their just-saved data vanished, and fixing it with LSN causal tracking or primary pinning. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "read-replicas-consistency-models-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies (read-replicas, replication-lag, consistency), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies (read-replicas, replication-lag, consistency), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "read-replicas-consistency-models-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "read-replicas-consistency-models-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["failover-split-brain-fencing-tokens"] = [
  {
    "id": "failover-split-brain-fencing-tokens-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens?",
    "options": [
      "What happens when a partitioned primary comes back online believing it is still leader, and how consensus leases, STONITH, and monotonic fencing tokens prevent corruption.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. What happens when a partitioned primary comes back online believing it is still leader, and how consensus leases, STONITH, and monotonic fencing tokens prevent corruption. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "failover-split-brain-fencing-tokens-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens (failover, split-brain, fencing-tokens), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens (failover, split-brain, fencing-tokens), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "failover-split-brain-fencing-tokens-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "failover-split-brain-fencing-tokens-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["declarative-table-partitioning"] = [
  {
    "id": "declarative-table-partitioning-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops?",
    "options": [
      "Splitting billion-row tables into monthly child partitions for planner partition pruning and instant O(1) data expiration via DROP/DETACH PARTITION instead of DELETE.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Splitting billion-row tables into monthly child partitions for planner partition pruning and instant O(1) data expiration via DROP/DETACH PARTITION instead of DELETE. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "declarative-table-partitioning-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops (table-partitioning, partition-pruning, time-series), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops (table-partitioning, partition-pruning, time-series), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "declarative-table-partitioning-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "declarative-table-partitioning-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["horizontal-sharding-routing-keys"] = [
  {
    "id": "horizontal-sharding-routing-keys-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather?",
    "options": [
      "Choosing a tenant or entity shard key so 99% of queries route to a single shard, avoiding cross-shard scatter-gather tail latency and celebrity hot-shard skew.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Choosing a tenant or entity shard key so 99% of queries route to a single shard, avoiding cross-shard scatter-gather tail latency and celebrity hot-shard skew. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "horizontal-sharding-routing-keys-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather (sharding, shard-key, scatter-gather), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather (sharding, shard-key, scatter-gather), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "horizontal-sharding-routing-keys-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "horizontal-sharding-routing-keys-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["distributed-transactions-2pc-saga"] = [
  {
    "id": "distributed-transactions-2pc-saga-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern?",
    "options": [
      "Why atomic Two-Phase Commit (Prepare + Commit) amplifies latency and locks resources if the coordinator crashes, and when compensating Sagas win.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why atomic Two-Phase Commit (Prepare + Commit) amplifies latency and locks resources if the coordinator crashes, and when compensating Sagas win. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "distributed-transactions-2pc-saga-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern (2pc, saga-pattern, distributed-transactions), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern (2pc, saga-pattern, distributed-transactions), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "distributed-transactions-2pc-saga-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "distributed-transactions-2pc-saga-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["distributed-sql-spanner-cockroachdb"] = [
  {
    "id": "distributed-sql-spanner-cockroachdb-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC?",
    "options": [
      "How NewSQL engines shard sorted key-value ranges across Raft consensus groups and use atomic/GPS TrueTime or Hybrid Logical Clocks for external consistency.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How NewSQL engines shard sorted key-value ranges across Raft consensus groups and use atomic/GPS TrueTime or Hybrid Logical Clocks for external consistency. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "distributed-sql-spanner-cockroachdb-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC (spanner, cockroachdb, hybrid-logical-clock), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC (spanner, cockroachdb, hybrid-logical-clock), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "distributed-sql-spanner-cockroachdb-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "distributed-sql-spanner-cockroachdb-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["connection-pooling-pgbouncer-proxies"] = [
  {
    "id": "connection-pooling-pgbouncer-proxies-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes?",
    "options": [
      "Why 5,000 idle application connections exhaust PostgreSQL RAM and snapshot scalability, and how transaction-mode multiplexing shares 100 server connections.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why 5,000 idle application connections exhaust PostgreSQL RAM and snapshot scalability, and how transaction-mode multiplexing shares 100 server connections. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "connection-pooling-pgbouncer-proxies-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes (connection-pooling, pgbouncer, transaction-pooling), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes (connection-pooling, pgbouncer, transaction-pooling), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "connection-pooling-pgbouncer-proxies-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "connection-pooling-pgbouncer-proxies-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-figma-postgres-horizontal-sharding"] = [
  {
    "id": "case-figma-postgres-horizontal-sharding-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters?",
    "options": [
      "Tracing the architectural journey from vertical scaling and read replicas to vertical table functional splitting and zero-downtime logical shard splits.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Tracing the architectural journey from vertical scaling and read replicas to vertical table functional splitting and zero-downtime logical shard splits. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-figma-postgres-horizontal-sharding-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters (sharding, postgres-scaling, vertical-to-horizontal), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters (sharding, postgres-scaling, vertical-to-horizontal), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-figma-postgres-horizontal-sharding-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-figma-postgres-horizontal-sharding-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-sharded-query-router"] = [
  {
    "id": "build-sharded-query-router-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather?",
    "options": [
      "Implement a distributed SQL shard router that directs point-key queries to a single virtual node and executes scatter-gather merges for unsharded queries.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Implement a distributed SQL shard router that directs point-key queries to a single virtual node and executes scatter-gather merges for unsharded queries. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-sharded-query-router-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather (build, sharding, query-router), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather (build, sharding, query-router), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-sharded-query-router-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-sharded-query-router-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather across OLTP and OLAP workloads?",
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
