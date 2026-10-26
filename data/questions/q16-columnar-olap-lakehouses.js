// SQL In Depth — Question Bank M16: Columnar Storage, Vectorized OLAP & Modern Lakehouses
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK["columnar-storage-layout-parquet"] = [
  {
    "id": "columnar-storage-layout-parquet-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout?",
    "options": [
      "Why analytical queries reading 4 of 100 columns waste 96% of I/O bandwidth on row stores, and how Parquet organizes Row Groups, Column Chunks, and Pages.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why analytical queries reading 4 of 100 columns waste 96% of I/O bandwidth on row stores, and how Parquet organizes Row Groups, Column Chunks, and Pages. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "columnar-storage-layout-parquet-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout (columnar-storage, parquet, olap), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout (columnar-storage, parquet, olap), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "columnar-storage-layout-parquet-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "columnar-storage-layout-parquet-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["columnar-compression-rle-dictionary-delta"] = [
  {
    "id": "columnar-compression-rle-dictionary-delta-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding?",
    "options": [
      "Exploiting homogeneous column data types to achieve 10x–40x compression using Dictionary codes, Run-Length triples, Frame-of-Reference, and Delta encoding.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Exploiting homogeneous column data types to achieve 10x–40x compression using Dictionary codes, Run-Length triples, Frame-of-Reference, and Delta encoding. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "columnar-compression-rle-dictionary-delta-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding (compression, rle, dictionary-encoding), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding (compression, rle, dictionary-encoding), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "columnar-compression-rle-dictionary-delta-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "columnar-compression-rle-dictionary-delta-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["late-materialization-simd-vectorization"] = [
  {
    "id": "late-materialization-simd-vectorization-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Late Materialization & SIMD Vectorized Execution on Compressed Columns — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Late Materialization & SIMD Vectorized Execution on Compressed Columns?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Late Materialization & SIMD Vectorized Execution on Compressed Columns?",
    "options": [
      "Evaluating WHERE predicates directly on compressed dictionary IDs and bitmasks using AVX-512 SIMD instructions before reconstructing matching tuples.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Evaluating WHERE predicates directly on compressed dictionary IDs and bitmasks using AVX-512 SIMD instructions before reconstructing matching tuples. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "late-materialization-simd-vectorization-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Late Materialization & SIMD Vectorized Execution on Compressed Columns — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Late Materialization & SIMD Vectorized Execution on Compressed Columns (late-materialization, simd, vectorized-execution), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Late Materialization & SIMD Vectorized Execution on Compressed Columns (late-materialization, simd, vectorized-execution), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "late-materialization-simd-vectorization-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Late Materialization & SIMD Vectorized Execution on Compressed Columns — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Late Materialization & SIMD Vectorized Execution on Compressed Columns degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Late Materialization & SIMD Vectorized Execution on Compressed Columns degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "late-materialization-simd-vectorization-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Late Materialization & SIMD Vectorized Execution on Compressed Columns — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Late Materialization & SIMD Vectorized Execution on Compressed Columns across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Late Materialization & SIMD Vectorized Execution on Compressed Columns across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["zone-maps-min-max-pruning-bloom"] = [
  {
    "id": "zone-maps-min-max-pruning-bloom-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering?",
    "options": [
      "Skipping 99% of Parquet row groups or micro-partitions using per-block min/max metadata headers and multi-dimensional Z-Order / Hilbert space-filling curves.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Skipping 99% of Parquet row groups or micro-partitions using per-block min/max metadata headers and multi-dimensional Z-Order / Hilbert space-filling curves. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "zone-maps-min-max-pruning-bloom-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering (zone-maps, data-skipping, z-order), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering (zone-maps, data-skipping, z-order), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "zone-maps-min-max-pruning-bloom-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "zone-maps-min-max-pruning-bloom-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["embedded-olap-duckdb-architecture"] = [
  {
    "id": "embedded-olap-duckdb-architecture-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution?",
    "options": [
      "Why scale-up single-node vectorized execution over local Parquet/Arrow files often beats distributed cluster overhead for datasets under 1 TB.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Why scale-up single-node vectorized execution over local Parquet/Arrow files often beats distributed cluster overhead for datasets under 1 TB. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "embedded-olap-duckdb-architecture-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution (duckdb, morsel-driven, embedded-olap), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution (duckdb, morsel-driven, embedded-olap), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "embedded-olap-duckdb-architecture-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "embedded-olap-duckdb-architecture-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["realtime-olap-clickhouse-mergetree"] = [
  {
    "id": "realtime-olap-clickhouse-mergetree-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines?",
    "options": [
      "How ClickHouse ingests millions of events/sec using immutable sorted data parts, sparse granule primary indexes (1 entry per 8,192 rows), and background merges.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How ClickHouse ingests millions of events/sec using immutable sorted data parts, sparse granule primary indexes (1 entry per 8,192 rows), and background merges. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "realtime-olap-clickhouse-mergetree-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines (clickhouse, mergetree, sparse-index), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines (clickhouse, mergetree, sparse-index), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "realtime-olap-clickhouse-mergetree-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "realtime-olap-clickhouse-mergetree-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["cloud-warehouses-snowflake-bigquery"] = [
  {
    "id": "cloud-warehouses-snowflake-bigquery-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute?",
    "options": [
      "Separating immutable object-store micro-partitions (S3/GCS) from stateless elastic compute clusters with local SSD caching and distributed shuffle fabrics.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Separating immutable object-store micro-partitions (S3/GCS) from stateless elastic compute clusters with local SSD caching and distributed shuffle fabrics. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "cloud-warehouses-snowflake-bigquery-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute (snowflake, bigquery, cloud-warehouse), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute (snowflake, bigquery, cloud-warehouse), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "cloud-warehouses-snowflake-bigquery-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "cloud-warehouses-snowflake-bigquery-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["open-table-formats-iceberg-delta"] = [
  {
    "id": "open-table-formats-iceberg-delta-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage?",
    "options": [
      "Bringing atomic schema evolution, hidden partitioning, snapshot isolation, and time-travel queries to Parquet files on S3 via metadata manifest trees.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Bringing atomic schema evolution, hidden partitioning, snapshot isolation, and time-travel queries to Parquet files on S3 via metadata manifest trees. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "open-table-formats-iceberg-delta-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage (apache-iceberg, delta-lake, lakehouse), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage (apache-iceberg, delta-lake, lakehouse), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "open-table-formats-iceberg-delta-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "open-table-formats-iceberg-delta-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["case-cloudflare-clickhouse-log-analytics"] = [
  {
    "id": "case-cloudflare-clickhouse-log-analytics-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree?",
    "options": [
      "How ordenar sorting keys, low-cardinality dictionary encoding, and materialized rollup tables power sub-second analytics over petabytes of network telemetry.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. How ordenar sorting keys, low-cardinality dictionary encoding, and materialized rollup tables power sub-second analytics over petabytes of network telemetry. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "case-cloudflare-clickhouse-log-analytics-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree (clickhouse, observability, columnar-compression), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree (clickhouse, observability, columnar-compression), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "case-cloudflare-clickhouse-log-analytics-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "case-cloudflare-clickhouse-log-analytics-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree across OLTP and OLAP workloads?",
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
window.QUESTION_BANK["build-columnar-compression-query-engine"] = [
  {
    "id": "build-columnar-compression-query-engine-q1",
    "type": "mcq",
    "difficulty": "recall",
    "title": "Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown — Core Relational Invariant",
    "prompt": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown?",
    "question": "Which statement accurately characterizes the primary mechanism and guarantee of Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown?",
    "options": [
      "Build a columnar storage engine that compresses column chunks with Dictionary and Run-Length Encoding and prunes blocks via Zone Map min/max metadata.",
      "It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.",
      "It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.",
      "It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates."
    ],
    "answer": 0,
    "explanation": "Correct. Build a columnar storage engine that compresses column chunks with Dictionary and Run-Length Encoding and prunes blocks via Zone Map min/max metadata. The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection."
  },
  {
    "id": "build-columnar-compression-query-engine-q2",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown — Execution Order & NULL Semantics",
    "prompt": "When writing or reviewing a production SQL query involving Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown (build, columnar, zone-maps), how does the engine handle NULL values and logical evaluation order?",
    "question": "When writing or reviewing a production SQL query involving Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown (build, columnar, zone-maps), how does the engine handle NULL values and logical evaluation order?",
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
    "id": "build-columnar-compression-query-engine-q3",
    "type": "mcq",
    "difficulty": "apply",
    "title": "Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown — Physical Plan & SARGability Analysis",
    "prompt": "An engineer notices that a query using concepts from Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
    "question": "An engineer notices that a query using concepts from Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?",
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
    "id": "build-columnar-compression-query-engine-q4",
    "type": "mcq",
    "difficulty": "staff",
    "title": "Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown — Staff Database Architecture Trade-Off",
    "prompt": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown across OLTP and OLAP workloads?",
    "question": "At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown across OLTP and OLAP workloads?",
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
