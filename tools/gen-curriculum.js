#!/usr/bin/env node
/**
 * Generates data/curriculum.js for SQL In Depth (6 Tracks, 18 Modules, 180 Units)
 */
const fs = require('fs');
const path = require('path');

const TRACKS = [
  {
    id: 'track-1',
    number: 1,
    title: 'Relational Foundations & Core Querying',
    summary: 'Master the relational model, Codd\'s algebra, SQL data types, Three-Valued NULL logic, DDL constraints, idempotent upserts, and multi-table joins.',
    hours: 28,
    modules: [
      {
        id: 'm01',
        number: '1.1',
        legacyNumber: '01',
        title: 'The Relational Model, Tables & SELECT Foundations',
        summary: 'Why declarative SQL replaced navigational storage, relations vs tables, execution order (FROM before SELECT), predicates, Three-Valued Logic, and NULL semantics.',
        units: [
          ['why-databases-exist', 'Filesystems vs. Relational DBMS, Codd\'s 12 Rules & Declarative SQL', 'lesson', ['relational-model', 'foundations', 'codd'], 'Why ad-hoc CSV/JSON files fail under concurrent mutations and how Edgar Codd\'s relational model separated physical storage from declarative queries.'],
          ['tables-rows-columns-types', 'Relations, Tuples, Attributes, Domains & SQL Data Types', 'lesson', ['data-types', 'schema', 'numeric'], 'Mapping mathematical relations to SQL tables, strict vs dynamic type affinity, exact NUMERIC/DECIMAL vs IEEE-754 FLOAT, and UTF-8 text encoding.'],
          ['select-projection-aliases', 'SELECT Projection, Expressions, Aliases & Logical Execution Order', 'lesson', ['select', 'projection', 'execution-order'], 'How the SQL engine binds FROM before evaluating SELECT projections, why column aliases fail inside WHERE, and expression evaluation pipelines.'],
          ['where-filtering-predicates', 'WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability', 'lesson', ['where', 'predicates', 'sargability'], 'Row-level tuple filtering with comparison operators, range bounds, pattern matching, and an introduction to Search Argument Able (SARGable) predicates.'],
          ['boolean-logic-three-valued-null', 'Boolean Logic, Operator Precedence & Three-Valued Logic (3VL)', 'lesson', ['three-valued-logic', 'null', 'boolean'], 'How SQL extends Boolean algebra with UNKNOWN (NULL), truth tables for AND/OR/NOT, and why NOT (col = 5) drops NULL rows silently.'],
          ['null-semantics-coalesce-nullif', 'NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF', 'lesson', ['null-handling', 'coalesce', 'nullif'], 'Null-safe comparisons with IS NOT DISTINCT FROM, fallback chains via COALESCE, division-by-zero guards with NULLIF, and aggregate NULL rules.'],
          ['order-by-limit-offset-distinct', 'Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT', 'lesson', ['order-by', 'distinct', 'pagination'], 'Deterministic multi-column sorting, NULL sort ordering across dialects, hash vs sort deduplication for DISTINCT, and Top-N heap slicing.'],
          ['case-expressions-type-casting', 'Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning', 'design', ['case-when', 'type-casting', 'data-cleaning'], 'Branching inside projections and predicates with searched CASE WHEN expressions, safe type conversions, and defensive data normalization.'],
          ['case-stripe-ledger-precision', 'Production Case Study: Why Floating-Point Corrupts Financial Ledgers', 'case', ['fintech', 'numeric-precision', 'ledger'], 'How binary IEEE-754 floating-point rounding drift causes penny imbalances at scale and how integer cents + exact NUMERIC enforce ledger invariants.'],
          ['build-sql-query-interpreter', 'Hands-On Build: Mini Relational Tuple Filter & Projection Engine', 'build', ['build', 'relational-engine', 'query-pipeline'], 'Implement a clause-by-clause relational tuple evaluator supporting FROM, WHERE with Three-Valued NULL logic, SELECT projection, and ORDER BY.']
        ]
      },
      {
        id: 'm02',
        number: '1.2',
        legacyNumber: '02',
        title: 'DDL, Schema Constraints & DML Mutations',
        summary: 'Table creation, surrogate vs natural primary keys (UUIDv7 vs B-Tree locality), foreign key referential actions, CHECK constraints, upserts, and views.',
        units: [
          ['create-table-ddl-anatomy', 'CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs', 'lesson', ['ddl', 'create-table', 'system-catalogs'], 'How DDL statements mutate system catalog tables (pg_class, sqlite_master), physical storage allocation, and fast O(1) file truncation vs row-by-row DELETE.'],
          ['primary-keys-surrogate-vs-natural', 'Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality', 'lesson', ['primary-key', 'uuidv7', 'btree-locality'], 'Choosing between natural keys, auto-incrementing 64-bit integers, and time-ordered UUIDv7 to eliminate random B+Tree leaf page splits.'],
          ['foreign-keys-referential-integrity', 'Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT)', 'lesson', ['foreign-key', 'referential-integrity', 'cascade'], 'Enforcing relational graph invariants at the storage engine layer with ON DELETE CASCADE, RESTRICT, SET NULL, and deferred constraint checking.'],
          ['check-unique-not-null-defaults', 'Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns', 'lesson', ['constraints', 'check', 'generated-columns'], 'Encoding business invariants directly into table definitions using CHECK predicates, multi-column UNIQUE indexes with NULLs, and stored/virtual generated columns.'],
          ['insert-bulk-loading-returning', 'Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING', 'lesson', ['insert', 'bulk-load', 'returning'], 'Amortizing network round-trips and WAL fsync overhead with multi-row batched INSERT statements and atomic server-generated ID retrieval via RETURNING.'],
          ['upsert-on-conflict-merge', 'Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE', 'lesson', ['upsert', 'on-conflict', 'idempotency'], 'Resolving concurrent insert races atomically with ON CONFLICT (key) DO UPDATE, EXCLUDED pseudo-tuples, and SQL standard MERGE pipelines.'],
          ['update-delete-safe-mutations', 'Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs', 'design', ['update', 'delete', 'soft-delete'], 'Writing bounded mutations, joining reference tables during UPDATE, and weighing tombstone soft deletes (deleted_at) against partial index bloat.'],
          ['views-temp-tables-ctas', 'Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables', 'lesson', ['views', 'ctas', 'temp-tables'], 'Query tree view expansion, security barrier views, session-scoped temporary tables, and staging pipelines with CREATE TABLE AS SELECT.'],
          ['case-github-zero-downtime-migrations', 'Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract)', 'case', ['schema-migration', 'zero-downtime', 'locks'], 'Why naive ALTER TABLE ADD COLUMN with defaults or NOT NULL locks production traffic and how the Expand-Backfill-Contract pattern ships safely.'],
          ['build-ecommerce-schema-ddl', 'Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline', 'build', ['build', 'ddl', 'upsert'], 'Design and verify a normalized e-commerce relational schema enforcing foreign keys, CHECK constraints, and idempotent inventory upserts.']
        ]
      },
      {
        id: 'm03',
        number: '1.3',
        legacyNumber: '03',
        title: 'Relational Algebra & Multi-Table Joins',
        summary: 'Codd\'s relational algebra operators, INNER/LEFT/RIGHT/FULL OUTER joins, the ON vs WHERE outer-join filter trap, semi/anti-joins, and set operations.',
        units: [
          ['relational-algebra-set-theory', 'Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ)', 'lesson', ['relational-algebra', 'set-theory', 'codd'], 'Translating SQL queries into algebraic operator trees and proving why relational algebra closure enables algebraic query optimization.'],
          ['inner-join-equi-joins', 'INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal', 'lesson', ['inner-join', 'equi-join', 'foreign-key'], 'How INNER JOIN pairs matching tuples across tables, why explicit ANSI JOIN syntax replaced comma joins, and multi-hop table traversal.'],
          ['left-right-full-outer-joins', 'Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension', 'lesson', ['left-join', 'outer-join', 'null-extension'], 'Preserving unmatched rows from the outer relation, understanding the preserved vs null-supplying table sides, and emulating FULL OUTER JOIN.'],
          ['join-where-vs-on-filter-trap', 'The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE', 'lesson', ['outer-join-trap', 'left-join', 'where-vs-on'], 'Why placing a predicate on the right-hand table inside WHERE silently converts a LEFT JOIN into an INNER JOIN by rejecting NULL-extended rows.'],
          ['self-joins-non-equi-joins', 'Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN)', 'lesson', ['self-join', 'non-equi-join', 'range-join'], 'Joining a table to itself with mandatory table aliases for manager-employee lookups, pairwise event comparisons, and temporal range overlaps.'],
          ['cross-join-cartesian-products', 'CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions', 'lesson', ['cross-join', 'cartesian-product', 'combinatorics'], 'Intentional Cartesian products for date-product spine generation vs catastrophic N×M row explosions caused by missing join predicates.'],
          ['semi-joins-anti-joins', 'Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL)', 'design', ['semi-join', 'anti-join', 'exists'], 'Checking existence without duplicating left-hand rows when multiple right-hand matches exist, and finding orphan records with anti-joins.'],
          ['set-operations-union-intersect-except', 'Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT', 'lesson', ['union', 'intersect', 'except'], 'Combining vertical result sets, why UNION ALL avoids an expensive sort/hash deduplication pass, and set difference via EXCEPT.'],
          ['case-missing-null-notin-outage', 'Production Case Study: How a Single NULL in NOT IN Returned Zero Rows', 'case', ['not-in-trap', 'null', 'anti-join'], 'Dissecting a classic production outage where x NOT IN (SELECT nullable_col ...) evaluated to UNKNOWN for every row, and fixing it with NOT EXISTS.'],
          ['build-multi-table-order-reconciler', 'Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine', 'build', ['build', 'joins', 'reconciliation'], 'Build an audit query suite using LEFT JOIN, FULL OUTER reconciliation, and anti-joins to detect unshipped paid orders and settlement mismatches.']
        ]
      }
    ]
  },
  {
    id: 'track-2',
    number: 2,
    title: 'Aggregations, Subqueries, CTEs & Window Functions',
    summary: 'Go beyond basic querying: master multi-dimensional GROUP BY rollups, join fanout prevention, correlated lateral subqueries, recursive CTE graph traversal, and window function framing.',
    hours: 32,
    modules: [
      {
        id: 'm04',
        number: '2.1',
        legacyNumber: '04',
        title: 'Grouping, Aggregations & Multi-Dimensional Rollups',
        summary: 'Aggregate function internals, GROUP BY bucket partitioning, WHERE vs HAVING, FILTER conditional aggregation, GROUPING SETS/ROLLUP/CUBE, and fanout traps.',
        units: [
          ['aggregate-functions-internals', 'Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG', 'lesson', ['aggregates', 'count', 'null-semantics'], 'How state transition functions accumulate values per group, why COUNT(col) skips NULLs while COUNT(*) counts tuples, and AVG(NULL) pitfalls.'],
          ['group-by-execution-mechanics', 'GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency', 'lesson', ['group-by', 'hash-aggregate', 'functional-dependency'], 'How the execution engine partitions rows via hashing or sorting, and why selecting non-grouped columns without functional dependency is invalid.'],
          ['having-vs-where-pipeline', 'Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline', 'lesson', ['having', 'where', 'query-pipeline'], 'Why pushing selective predicates into WHERE prunes rows before hash table allocation, reserving HAVING strictly for group-level aggregates.'],
          ['conditional-aggregation-filter', 'Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...)', 'lesson', ['conditional-aggregation', 'filter-clause', 'pivot'], 'Computing multiple filtered metrics in a single table scan using CASE expressions and the SQL:2003 FILTER (WHERE ...) clause.'],
          ['string-json-array-aggregation', 'List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation', 'lesson', ['string-agg', 'group-concat', 'json-agg'], 'Collapsing one-to-many child rows into ordered delimited strings or nested JSON arrays without N+1 application round-trips.'],
          ['grouping-sets-rollup-cube', 'Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING()', 'lesson', ['grouping-sets', 'rollup', 'cube'], 'Generating subtotals, hierarchical rollups, and full cross-tabulation cubes in a single pass while distinguishing real NULLs via GROUPING().'],
          ['join-fanout-chasm-traps', 'The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts)', 'design', ['fanout-trap', 'chasm-trap', 'double-counting'], 'Visualizing how joining two independent one-to-many child tables multiplies parent rows and inflates SUM/COUNT aggregates unless pre-aggregated.'],
          ['histograms-percentiles-medians', 'Statistical SQL: Equi-Width Histograms, Percentiles & Medians', 'lesson', ['percentiles', 'median', 'histograms'], 'Computing exact and approximate p50/p95/p99 latencies, discrete vs continuous percentiles, and bucketed frequency distributions in SQL.'],
          ['case-analytics-double-counting-bug', 'Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug', 'case', ['fanout-bug', 'analytics', 'pre-aggregation'], 'Tracing an executive dashboard incident where joining orders to both order_items and shipments inflated reported revenue by 310%.'],
          ['build-executive-kpi-aggregation-suite', 'Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite', 'build', ['build', 'aggregations', 'kpi-suite'], 'Construct a fanout-safe executive KPI query suite combining conditional aggregation, pre-aggregated CTEs, and multi-dimensional rollups.']
        ]
      },
      {
        id: 'm05',
        number: '2.2',
        legacyNumber: '05',
        title: 'Subqueries, Correlated Queries, Lateral Joins & CTEs',
        summary: 'Scalar/row/table subqueries, correlated subquery unnesting, EXISTS null safety, LATERAL joins, Common Table Expressions (WITH), and recursive CTE graph queries.',
        units: [
          ['scalar-row-table-subqueries', 'Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries', 'lesson', ['subqueries', 'derived-tables', 'scalar-subquery'], 'Where subqueries can legally appear across SELECT, FROM, and WHERE, runtime cardinality assertions for scalar subqueries, and inline views.'],
          ['correlated-subqueries-mechanics', 'Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting', 'lesson', ['correlated-subquery', 'unnesting', 'optimizer'], 'How correlated subqueries bind outer tuple attributes, why naive execution is O(N×M), and how modern optimizers decorrelate them into hash joins.'],
          ['exists-not-exists-null-safety', 'EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety', 'lesson', ['exists', 'not-exists', 'semi-join'], 'Why EXISTS stops scanning on the first matching tuple and why NOT EXISTS is immune to the Three-Valued Logic NULL catastrophe of NOT IN.'],
          ['lateral-joins-cross-apply', 'LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group', 'lesson', ['lateral-join', 'cross-apply', 'top-n-per-group'], 'Evaluating correlated derived tables that can reference preceding FROM tables and return multiple columns and rows per outer tuple.'],
          ['common-table-expressions-with', 'Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines', 'lesson', ['cte', 'with-clause', 'modular-sql'], 'Refactoring deeply nested subqueries into readable, testable DAGs of named intermediate relations using chained WITH clauses.'],
          ['cte-materialization-optimization-fence', 'CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints', 'design', ['cte-materialization', 'optimization-fence', 'predicate-pushdown'], 'When the planner folds a CTE into the main query for predicate pushdown vs materializing it into a temp table once (PostgreSQL 12+ & SQLite semantics).'],
          ['recursive-ctes-hierarchies', 'Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint', 'lesson', ['recursive-cte', 'hierarchies', 'trees'], 'Executing iterative fixpoint worktable algorithms in pure SQL to traverse organizational charts, category trees, and parent-child hierarchies.'],
          ['graph-traversal-cycle-detection-sql', 'Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL', 'lesson', ['graph-sql', 'cycle-detection', 'bom'], 'Preventing infinite recursion loops on cyclic graphs using path strings or visited arrays, computing shortest paths, and aggregating BOM part costs.'],
          ['case-recursive-org-permission-engine', 'Production Case Study: Hierarchical RBAC Permission Inheritance in SQL', 'case', ['rbac', 'recursive-cte', 'permissions'], 'Designing a sub-5ms hierarchical folder and organization permission evaluator using indexed recursive CTEs and transitive closure tables.'],
          ['build-hierarchical-graph-query-engine', 'Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine', 'build', ['build', 'recursive-cte', 'graph'], 'Build a recursive SQL engine that computes multi-level organizational reporting chains, detects dependency cycles, and rolls up hierarchical budgets.']
        ]
      },
      {
        id: 'm06',
        number: '2.3',
        legacyNumber: '06',
        title: 'Window Functions & Analytical SQL Mastery',
        summary: 'OVER (PARTITION BY ... ORDER BY ...), ranking functions, LAG/LEAD offsets, ROWS vs RANGE vs GROUPS window frames, running totals, and Gaps & Islands sessionization.',
        units: [
          ['window-functions-mental-model', 'The Window Function Mental Model: Preserving Row Identity + Context', 'lesson', ['window-functions', 'over-clause', 'analytical-sql'], 'Why GROUP BY collapses rows while OVER (...) attaches an analytical sliding window to every tuple without losing row-level granularity.'],
          ['partition-by-order-by-mechanics', 'PARTITION BY, ORDER BY & The Default RANGE Frame Trap', 'lesson', ['partition-by', 'window-order', 'default-frame'], 'How window partitioning and sorting work under the hood, and why adding ORDER BY silently changes the default frame to RANGE UNBOUNDED PRECEDING.'],
          ['ranking-functions-row-number-rank', 'Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST', 'lesson', ['row-number', 'rank', 'dense-rank'], 'Exact tie-breaking semantics between ROW_NUMBER (1,2,3,4), RANK (1,2,2,4), and DENSE_RANK (1,2,2,3), plus equidepth bucketing with NTILE.'],
          ['top-n-per-group-deduplication', 'Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY', 'lesson', ['top-n-per-group', 'deduplication', 'qualify'], 'Fetching the latest N events per user or top products per category using ROW_NUMBER() CTEs and DuckDB/Snowflake QUALIFY syntax.'],
          ['offset-functions-lag-lead-first-last', 'Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap', 'lesson', ['lag', 'lead', 'last-value'], 'Peeking at preceding and succeeding rows without self-joins, period-over-period growth deltas, and why LAST_VALUE requires an explicit UNBOUNDED FOLLOWING frame.'],
          ['window-frames-rows-range-groups', 'Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages', 'lesson', ['window-frames', 'rows-vs-range', 'moving-average'], 'Physical row offsets (ROWS) vs logical value intervals (RANGE) vs peer tie groups (GROUPS) for accurate 7-day rolling averages.'],
          ['running-totals-cumulative-shares', 'Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses', 'lesson', ['running-total', 'pareto', 'named-window'], 'Computing monotonic cumulative sums, percentage-of-total shares, and reusing window specifications cleanly with the WINDOW w AS (...) clause.'],
          ['gaps-and-islands-sessionization', 'Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization', 'design', ['gaps-and-islands', 'sessionization', 'streaks'], 'Grouping contiguous sequences and splitting user activity streams into 30-minute sessions using the ROW_NUMBER difference trick and LAG step indicators.'],
          ['case-fintech-velocity-fraud-window', 'Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection', 'case', ['fraud-detection', 'sliding-window', 'fintech'], 'Detecting rapid card-testing bursts and cross-country impossible travel in a single analytical window pass over merchant transaction streams.'],
          ['build-sessionization-retention-engine', 'Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer', 'build', ['build', 'window-functions', 'sessionization'], 'Implement a complete analytical SQL pipeline that sessionizes raw user events, computes consecutive active streaks, and flags anomalous velocity spikes.']
        ]
      }
    ]
  },
  {
    id: 'track-3',
    number: 3,
    title: 'Data Modeling, Normalization & Schema Architecture',
    summary: 'Architect resilient schemas for both OLTP and OLAP: functional dependencies, 1NF through BCNF/5NF, Kimball Star Schemas, SCD Type 2 history, and temporal SQL patterns.',
    hours: 30,
    modules: [
      {
        id: 'm07',
        number: '3.1',
        legacyNumber: '07',
        title: 'Relational Data Modeling & Normalization (1NF to BCNF/5NF)',
        summary: 'Entity-Relationship modeling, Armstrong\'s axioms, candidate keys, 1NF atomicity, 2NF/3NF/BCNF normal forms, update anomalies, and strategic denormalization.',
        units: [
          ['entity-relationship-modeling', 'Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables', 'lesson', ['erd', 'data-modeling', 'junction-table'], 'Translating domain entities into physical tables, resolving many-to-many relationships with associative junction tables, and reading Crow\'s Foot ERDs.'],
          ['functional-dependencies-keys', 'Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure', 'lesson', ['functional-dependency', 'candidate-key', 'armstrong-axioms'], 'Formalizing data invariants with functional dependencies, computing attribute closure X+, and proving whether a decomposition is lossless-join.'],
          ['first-normal-form-atomicity', 'First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns', 'lesson', ['1nf', 'normalization', 'atomicity'], 'Why storing comma-separated IDs or numbered columns (tag1, tag2, tag3) breaks indexing, referential integrity, and relational querying.'],
          ['second-third-normal-form', 'Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies', 'lesson', ['2nf', '3nf', 'normalization'], 'Removing partial dependencies on composite keys (2NF) and transitive non-key dependencies (3NF: "the key, the whole key, and nothing but the key").'],
          ['boyce-codd-fourth-fifth-normal-form', 'Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF)', 'lesson', ['bcnf', '4nf', '5nf'], 'When 3NF is still vulnerable to overlapping candidate key anomalies (BCNF) and how 4NF eliminates independent multi-valued fact cross-products.'],
          ['update-insertion-deletion-anomalies', 'Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas', 'lesson', ['anomalies', 'data-integrity', 'normalization'], 'Tracing concrete SQL mutations that corrupt customer addresses, prevent inserting catalog items without orders, or erase facts on delete.'],
          ['strategic-denormalization-tradeoffs', 'Strategic Denormalization: Read vs Write Amplification & Cached Counters', 'design', ['denormalization', 'tradeoffs', 'materialized-columns'], 'Knowing when to break strict normalization in high-read OLTP systems using trigger-maintained summary columns, snapshot fields, and read models.'],
          ['schema-anti-patterns-eav-god-tables', 'Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables', 'design', ['anti-patterns', 'eav', 'polymorphic-associations'], 'Why EAV tables destroy type safety and require 10-way self-joins, why polymorphic foreign keys cannot enforce integrity, and clean relational alternatives.'],
          ['case-shopify-multi-tenant-schema', 'Production Case Study: Multi-Tenant Schema Architecture at Scale', 'case', ['multi-tenancy', 'sharding', 'row-level-security'], 'Comparing Pool (shared table + tenant_id), Bridge (schema-per-tenant), and Silo (database-per-tenant) isolation models for B2B SaaS platforms.'],
          ['build-normalized-booking-schema', 'Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System', 'build', ['build', 'normalization', 'bcnf'], 'Decompose a denormalized, anomaly-ridden booking table into a lossless 3NF/BCNF relational schema and verify zero data loss via join reconstruction.']
        ]
      },
      {
        id: 'm08',
        number: '3.2',
        legacyNumber: '08',
        title: 'Dimensional Modeling & Analytical Schema Design',
        summary: 'OLTP vs OLAP physics, Kimball Star Schemas (fact grain & dimensions), Snowflake vs One Big Table (OBT), Slowly Changing Dimensions (SCD Type 2), and bitemporal SQL.',
        units: [
          ['oltp-vs-olap-workload-physics', 'OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans', 'lesson', ['oltp', 'olap', 'workload-physics'], 'Contrasting high-concurrency transactional point mutations against wide analytical aggregations and why they demand different schema topologies.'],
          ['star-schema-facts-dimensions', 'Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions', 'lesson', ['star-schema', 'kimball', 'fact-tables'], 'Declaring an unambiguous fact grain, classifying additive, semi-additive (account balances), and non-additive measures, and surrogate dimension keys.'],
          ['snowflake-vs-star-vs-obt', 'Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses', 'design', ['snowflake-schema', 'obt', 'data-warehouse'], 'Benchmarking join cost vs storage compression across normalized Snowflake dimensions, classic Star schemas, and wide columnar One Big Tables.'],
          ['slowly-changing-dimensions-scd', 'Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6', 'lesson', ['scd-type-2', 'dimensional-modeling', 'history-tracking'], 'Preserving point-in-time historical truth when customer tiers or territories change using SCD Type 2 (valid_from, valid_to, is_current) rows.'],
          ['bridge-tables-junk-role-dimensions', 'Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables', 'lesson', ['role-playing-dimension', 'junk-dimension', 'bridge-table'], 'Joining a single date dimension multiple times (Order Date, Ship Date), consolidating low-cardinality flags into Junk Dimensions, and weighting bridge tables.'],
          ['temporal-tables-bitemporal-sql', 'Temporal & Bitemporal SQL: System Time vs Valid Application Time', 'lesson', ['bitemporal', 'temporal-tables', 'sql-2011'], 'Tracking both when a fact was true in reality (valid time) and when it was recorded in the database (transaction time) for audit-grade time travel.'],
          ['json-semi-structured-hybrid-schemas', 'Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution', 'lesson', ['jsonb', 'semi-structured', 'generated-columns'], 'Combining strict relational columns for core entities with flexible JSON attributes and indexing hot JSON paths via virtual/stored generated columns.'],
          ['idempotency-audit-logs-event-tables', 'Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox', 'design', ['audit-log', 'transactional-outbox', 'cdc'], 'Designing tamper-evident append-only event tables and guaranteeing reliable microservice event publishing via the Transactional Outbox pattern.'],
          ['case-airbnb-minerva-metric-layer', 'Production Case Study: Designing a Canonical Metric Store at Petabyte Scale', 'case', ['metric-layer', 'star-schema', 'analytics-engineering'], 'How standardized dimensional star schemas and certified metric definitions eliminate conflicting KPI numbers across hundreds of product teams.'],
          ['build-scd-type2-warehouse-pipeline', 'Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline', 'build', ['build', 'star-schema', 'scd2'], 'Build a Kimball star schema and write the idempotent SCD Type 2 merge pipeline that expires old dimension versions and inserts new historical rows.']
        ]
      },
      {
        id: 'm09',
        number: '3.3',
        legacyNumber: '09',
        title: 'Advanced SQL Patterns, Temporal Queries & Programmability',
        summary: 'Date spines, triangle cohort retention matrices, multi-step conversion funnels, Allen\'s interval overlap algebra, PIVOT/UNPIVOT, triggers, and SQL injection defense.',
        units: [
          ['calendar-tables-date-spines', 'Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets', 'lesson', ['date-spine', 'calendar-table', 'time-series'], 'Using recursive CTEs or generate_series to build continuous date spines so time-series charts never skip days with zero orders.'],
          ['cohort-retention-matrix-sql', 'Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL', 'lesson', ['cohort-analysis', 'retention', 'ndr'], 'Grouping users by signup cohort month, calculating active lifecycle offsets (Month 0, Month 1, Month N), and computing Net Dollar Retention.'],
          ['funnel-conversion-attribution-sql', 'Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution', 'lesson', ['funnel-analysis', 'attribution', 'conversion'], 'Measuring drop-off across strict chronological user funnels (Signup → Connect → Query → Upgrade) and attributing revenue to marketing touches.'],
          ['interval-overlap-allen-algebra', 'Temporal Interval Overlap (Allen\'s Algebra) & Packing Contiguous Intervals', 'lesson', ['interval-overlap', 'allens-algebra', 'temporal-sql'], 'Mastering the canonical two-condition overlap predicate (start_a < end_b AND end_a > start_b) to detect double-bookings and merge overlapping windows.'],
          ['pivoting-unpivoting-cross-tabs', 'Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns', 'lesson', ['pivot', 'unpivot', 'cross-tab'], 'Transforming normalized tall tables into wide report matrices and unpivoting wide spreadsheet imports using UNION ALL or LATERAL values.'],
          ['triggers-stored-procedures-udfs', 'Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead', 'lesson', ['triggers', 'stored-procedures', 'udf'], 'Writing BEFORE/AFTER row triggers for audit logging and invariant enforcement, while understanding why non-inlined scalar UDFs cripple query parallelism.'],
          ['materialized-views-incremental-refresh', 'Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM)', 'design', ['materialized-view', 'ivm', 'precomputation'], 'Precomputing expensive multi-join aggregations on disk, REFRESH MATERIALIZED VIEW CONCURRENTLY, and delta-based incremental maintenance.'],
          ['sql-injection-parameterized-security', 'SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS)', 'lesson', ['sql-injection', 'prepared-statements', 'rls'], 'How string concatenation allows untrusted input to rewrite the SQL AST, why parameterized bind variables prevent injection 100%, and Postgres RLS policies.'],
          ['case-double-booking-hotel-inventory', 'Production Case Study: Preventing Concurrent Calendar Double-Bookings', 'case', ['double-booking', 'exclusion-constraints', 'concurrency'], 'Why application-level SELECT-then-INSERT checks fail under concurrency and how range exclusion constraints and interval locks guarantee zero overlap.'],
          ['build-saas-cohort-funnel-workbench', 'Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)', 'build', ['build', 'cohort-retention', 'saas-analytics'], 'Build an end-to-end SaaS analytics SQL suite calculating MRR expansion/churn movements, cohort retention triangles, and step-by-step funnel conversion.']
        ]
      }
    ]
  },
  {
    id: 'track-4',
    number: 4,
    title: 'Indexing, Query Planner & Execution Engine',
    summary: 'Look inside the database engine: master B+Tree page splits, composite leftmost-prefix rules, covering index-only scans, cost-based query optimization, EXPLAIN ANALYZE, and physical join algorithms.',
    hours: 34,
    modules: [
      {
        id: 'm10',
        number: '4.1',
        legacyNumber: '10',
        title: 'B+Tree Indexes & Access Path Mechanics',
        summary: 'I/O cost models, B+Tree internal routing vs doubly-linked leaf pages, clustered vs heap+ctid tables, composite index prefix rules, covering indexes, and GIN/GiST/BRIN.',
        units: [
          ['why-indexes-work-io-cost-model', 'Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics', 'lesson', ['indexing', 'io-cost', 'page-reads'], 'Quantifying 8KB page reads: why scanning 1,000,000 rows touches 12,500 heap pages while a height-3 B+Tree seek reads just 4 pages.'],
          ['btree-bplustree-internal-anatomy', 'B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links', 'lesson', ['bplustree', 'btree', 'leaf-pages'], 'Why databases use B+Trees instead of binary trees or B-Trees: packing ~500 separator keys per 8KB internal page and linking leaf pages for range scans.'],
          ['clustered-vs-secondary-indexes', 'Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres)', 'lesson', ['clustered-index', 'heap-table', 'ctid'], 'Comparing MySQL InnoDB (where the primary key B+Tree leaf IS the table row) against PostgreSQL heap storage (where secondary indexes point to ctid).'],
          ['composite-indexes-leftmost-prefix', 'Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range', 'lesson', ['composite-index', 'leftmost-prefix', 'range-scan'], 'How lexicographical tuple ordering inside a multi-column B+Tree dictates why equality predicates must precede range predicates for full index utilization.'],
          ['covering-indexes-index-only-scans', 'Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map)', 'lesson', ['covering-index', 'index-only-scan', 'include-clause'], 'Eliminating random heap table fetches completely by including payload columns in the index leaf and consulting PostgreSQL\'s Visibility Map.'],
          ['partial-filtered-expression-indexes', 'Partial (Filtered) Indexes & Functional / Expression Indexes', 'lesson', ['partial-index', 'expression-index', 'index-size'], 'Shrinking index footprint by 90% with WHERE predicates (e.g. WHERE status = \'pending\') and indexing computed expressions like LOWER(email).'],
          ['hash-gin-gist-brin-bloom-indexes', 'Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap', 'lesson', ['gin-index', 'brin-index', 'gist'], 'Choosing the right access method beyond B+Trees: inverted posting lists (GIN) for JSONB/FTS, Tiny block summaries (BRIN) for time-series, and R-Trees (GiST).'],
          ['index-bloat-write-amplification-traps', 'When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds', 'design', ['write-amplification', 'index-bloat', 'selectivity'], 'Why every additional secondary index slows down INSERT/UPDATE/DELETE, how 50/50 leaf page splits fragment space, and when a Seq Scan beats an Index Scan.'],
          ['case-slack-composite-index-incident', 'Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4%', 'case', ['composite-index', 'query-tuning', 'production-incident'], 'Analyzing a production slow-query incident where an index on (created_at, channel_id) scanned 400,000 index entries instead of 15 with (channel_id, created_at).'],
          ['build-btree-index-advisor', 'Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor', 'build', ['build', 'bplustree', 'index-advisor'], 'Build an interactive index advisor that inspects query predicates, ORDER BY clauses, and cardinality to recommend optimal composite covering indexes.']
        ]
      },
      {
        id: 'm11',
        number: '4.2',
        legacyNumber: '11',
        title: 'The Query Planner, Cost-Based Optimizer & EXPLAIN',
        summary: 'Life of a query (Parser → Binder → Optimizer → Executor), reading EXPLAIN ANALYZE, table statistics (MCV, NDV, histograms), SARGability, and external disk sorts.',
        units: [
          ['life-of-a-sql-query-pipeline', 'Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor', 'lesson', ['query-pipeline', 'parser', 'cost-based-optimizer'], 'Tracing a SQL string from lexical tokenization and AST generation to catalog binding, relational algebra rewrites, cost estimation, and physical execution.'],
          ['reading-explain-and-explain-analyze', 'Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers', 'lesson', ['explain-analyze', 'query-plan', 'buffers'], 'Decoding bottom-up execution trees: startup cost vs total cost, estimated vs actual row counts, loop multipliers, and shared buffer hits vs reads.'],
          ['table-statistics-histograms-cardinality', 'Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms', 'lesson', ['statistics', 'histograms', 'cardinality'], 'How ANALYZE samples pages to populate pg_statistic / sqlite_stat1 with Most Common Values (MCV) lists and equi-depth histogram bounds.'],
          ['selectivity-estimation-correlated-columns', 'Selectivity Math, Independence Assumption Failures & Extended Statistics', 'lesson', ['selectivity', 'correlated-columns', 'extended-statistics'], 'Calculating P(A AND B) = P(A)×P(B), why correlated columns (city and zip_code) fool the planner by 100x, and fixing it with CREATE STATISTICS.'],
          ['scan-operators-seq-index-bitmap', 'Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan', 'lesson', ['seq-scan', 'index-scan', 'bitmap-scan'], 'How Bitmap Index Scan + Bitmap Heap Scan bridges the gap between single-row Index Scans and full Sequential Scans by sorting page IDs first.'],
          ['sargability-functions-on-columns', 'SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes', 'design', ['sargability', 'query-rewriting', 'index-seek'], 'Rewriting non-SARGable anti-patterns (WHERE strftime(\'%Y\', created_at) = \'2025\' or WHERE amount / 100 > 50) into range-seekable predicates.'],
          ['or-conditions-in-lists-union-rewrites', 'Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites', 'lesson', ['or-optimization', 'bitmap-or', 'union-all'], 'Why WHERE a = 1 OR b = 2 often forces a full table scan and how optimizers or manual UNION ALL rewrites combine separate index paths.'],
          ['sorting-spill-to-disk-top-n-heapsort', 'Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills', 'lesson', ['sorting', 'top-n-heapsort', 'external-merge-sort'], 'Why ORDER BY ... LIMIT 10 uses an O(N log K) bounded heap in memory while unbounded sorts exceeding work_mem spill to multi-pass external merge files.'],
          ['case-stale-statistics-plan-flip', 'Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics', 'case', ['plan-flip', 'stale-statistics', 'analyze'], 'How a bulk ingestion of 5 million rows before autovacuum ANALYZE caused the planner to pick a Nested Loop Join instead of a Hash Join, stalling CPU at 100%.'],
          ['build-visual-explain-plan-analyzer', 'Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter', 'build', ['build', 'explain-plan', 'query-tuning'], 'Build a diagnostic engine that parses EXPLAIN QUERY PLAN outputs, detects full table scans and temp B-Tree sorts, and verifies SARGable query rewrites.']
        ]
      },
      {
        id: 'm12',
        number: '4.3',
        legacyNumber: '12',
        title: 'Physical Join Algorithms & Execution Pipelines',
        summary: 'Nested Loop Join (Naive vs Indexed), In-Memory & Grace Hash Join, Sort-Merge Join, Selinger dynamic programming join ordering, predicate pushdown, and Volcano vs Vectorized execution.',
        units: [
          ['nested-loop-join-indexed-nlj', 'Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ', 'lesson', ['nested-loop-join', 'inlj', 'join-algorithms'], 'How Nested Loop Join streams outer tuples and why an index on the inner join key turns O(N×M) into fast O(N log B) point lookups for small outer sets.'],
          ['hash-join-build-probe-grace', 'Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills', 'lesson', ['hash-join', 'grace-hash-join', 'work-mem'], 'Building an in-memory hash table on the smaller relation, probing with the larger relation in O(N+M), and partitioning into disk batches when memory overflows.'],
          ['sort-merge-join-zipper-mechanics', 'Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding', 'lesson', ['sort-merge-join', 'merge-join', 'sorted-streams'], 'Advancing two interleaved cursors in O(N+M) when inputs arrive pre-sorted from B+Tree indexes, and handling many-to-many duplicate key runs.'],
          ['join-order-search-dynamic-programming', 'Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees', 'lesson', ['join-ordering', 'selinger', 'dynamic-programming'], 'Why joining 10 tables has 3.6 million plan permutations and how Selinger bottom-up dynamic programming prunes dominated subplans.'],
          ['predicate-pushdown-projection-pruning', 'Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination', 'lesson', ['predicate-pushdown', 'projection-pruning', 'query-rewrites'], 'Pushing WHERE filters below joins and views to shrink intermediate tuple counts as early as possible, and eliminating redundant foreign-key joins.'],
          ['subquery-unnesting-semi-anti-physical', 'Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators', 'lesson', ['subquery-unnesting', 'hash-semi-join', 'anti-join'], 'How the query optimizer transforms declarative EXISTS and NOT EXISTS subqueries into physical Hash Semi-Join and Anti-Join execution nodes.'],
          ['execution-models-volcano-vectorized', 'Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT', 'design', ['volcano-model', 'vectorized-execution', 'jit'], 'Comparing classic pull-based Volcano tuple-at-a-time virtual calls against cache-resident 1024-tuple column vectors and LLVM JIT expression compilation.'],
          ['parallel-query-execution-workers', 'Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes', 'lesson', ['parallel-query', 'parallel-hash-join', 'workers'], 'Coordinating multiple background worker processes to scan shared heap blocks concurrently and build shared-memory hash tables.'],
          ['case-hash-join-oom-work-mem-spill', 'Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills', 'case', ['work-mem', 'hash-join-spill', 'temp-files'], 'Investigating a slow reporting query that spilled 18 GB of temporary hash batch files to disk due to underestimated cardinality and low work_mem.'],
          ['build-physical-join-execution-engine', 'Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join', 'build', ['build', 'join-algorithms', 'hash-join'], 'Implement physical Nested Loop, Hash Join, and Sort-Merge Join operators and verify their tuple comparisons and memory budgets across skewed datasets.']
        ]
      }
    ]
  },
  {
    id: 'track-5',
    number: 5,
    title: 'Transactions, Concurrency Control, MVCC & Storage Internals',
    summary: 'Master transactional correctness and storage physics: ACID guarantees, isolation anomalies (Dirty Read to Write Skew), MVCC tuple visibility, row/gap locking, 8KB slotted pages, WAL, ARIES crash recovery, and LSM-Trees.',
    hours: 34,
    modules: [
      {
        id: 'm13',
        number: '5.1',
        legacyNumber: '13',
        title: 'ACID Transactions, Concurrency Anomalies & Isolation Levels',
        summary: 'ACID properties under the hood, transaction lifecycles, read/write concurrency anomalies (Dirty Read, Non-Repeatable Read, Phantom, Lost Update, Write Skew), and Snapshot vs Serializable isolation.',
        units: [
          ['acid-properties-under-the-hood', 'ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL)', 'lesson', ['acid', 'transactions', 'wal'], 'Moving beyond textbook acronyms: how undo logs/MVCC implement Atomicity, concurrency protocols enforce Isolation, and WAL fsync guarantees Durability.'],
          ['transaction-lifecycle-savepoints', 'Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards', 'lesson', ['begin-commit', 'savepoint', 'rollback'], 'Managing transaction boundaries, partial rollbacks via nested SAVEPOINTs, and why long-running idle-in-transaction sessions poison database health.'],
          ['read-phenomena-dirty-nonrepeatable-phantom', 'Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized', 'lesson', ['dirty-read', 'non-repeatable-read', 'phantom-read'], 'Stepping through dual-session timelines (T1 & T2) to witness uncommitted reads, mid-transaction value changes, and newly appearing phantom tuples.'],
          ['write-anomalies-lost-update-write-skew', 'Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew', 'lesson', ['lost-update', 'write-skew', 'concurrency-anomalies'], 'Why preventing standard SQL-92 read phenomena is not enough: how concurrent read-modify-write cycles lose updates and how Write Skew breaks multi-row invariants.'],
          ['read-uncommitted-read-committed', 'READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice', 'lesson', ['read-committed', 'isolation-levels', 'snapshots'], 'Why PostgreSQL treats READ UNCOMMITTED as READ COMMITTED, and how taking a fresh snapshot per statement allows non-repeatable reads and read skew.'],
          ['repeatable-read-snapshot-isolation', 'REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew', 'lesson', ['repeatable-read', 'snapshot-isolation', 'first-committer-wins'], 'How transaction-start snapshots guarantee repeatable reads and automatically abort concurrent Lost Updates while still permitting Write Skew.'],
          ['serializable-2pl-vs-ssi', 'True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI)', 'design', ['serializable', '2pl', 'ssi'], 'Comparing pessimistic Strict 2PL (shared/exclusive read-write locks) against PostgreSQL\'s lock-free SSI rw-antidependency conflict graph detection.'],
          ['optimistic-vs-pessimistic-concurrency', 'Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE', 'design', ['optimistic-locking', 'pessimistic-locking', 'for-update'], 'Choosing between explicit row locks (SELECT ... FOR UPDATE), atomic SQL increments, and optimistic version columns (WHERE version = expected).'],
          ['case-fintech-double-spend-race-condition', 'Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend', 'case', ['double-spend', 'race-condition', 'fintech'], 'Reproducing a classic wallet withdrawal race condition under READ COMMITTED where two concurrent requests withdraw $100 from a $100 balance.'],
          ['build-transaction-anomaly-simulator', 'Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier', 'build', ['build', 'isolation-levels', 'concurrency'], 'Build a transaction schedule analyzer that simulates interleaved T1/T2 read-write operations and detects Dirty Reads, Lost Updates, and Write Skew.']
        ]
      },
      {
        id: 'm14',
        number: '5.2',
        legacyNumber: '14',
        title: 'Locking, MVCC Internals & Vacuuming',
        summary: 'Multi-Version Concurrency Control (MVCC), PostgreSQL tuple headers (xmin, xmax, ctid) vs InnoDB undo logs, transaction snapshots, row/table/gap locks, deadlocks, and VACUUM / XID wraparound.',
        units: [
          ['multi-version-concurrency-control-mvcc', 'MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers', 'lesson', ['mvcc', 'tuple-versioning', 'concurrency'], 'Comparing append-version heap MVCC (PostgreSQL) against in-place clustered update + rollback segment undo logs (MySQL InnoDB & Oracle).'],
          ['tuple-headers-xmin-xmax-visibility', 'Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits', 'lesson', ['xmin-xmax', 'ctid', 'tuple-header'], 'Inspecting the 23-byte PostgreSQL HeapTupleHeaderData structure: how INSERT sets xmin, DELETE sets xmax, and UPDATE writes a brand-new tuple version.'],
          ['transaction-snapshots-visibility-rules', 'Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution', 'lesson', ['transaction-snapshot', 'visibility-rules', 'mvcc'], 'Evaluating the exact visibility algorithm that decides whether tuple version V is visible to transaction T based on committed status and active XID list.'],
          ['row-level-locks-for-update-skip-locked', 'Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED', 'lesson', ['row-locks', 'for-update', 'skip-locked'], 'Why FOR NO KEY UPDATE avoids blocking child foreign-key inserts, and how FOR UPDATE SKIP LOCKED powers lock-free concurrent worker queues.'],
          ['table-locks-intention-locks-ddl-hazards', 'Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic', 'lesson', ['table-locks', 'ddl-locks', 'lock-queues'], 'How AccessExclusive DDL locks queue behind one long-running SELECT and then block every subsequent incoming read and write across the entire table.'],
          ['gap-locks-next-key-locks-innodb', 'Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks', 'lesson', ['gap-locks', 'next-key-locks', 'innodb'], 'How InnoDB locks the open key intervals between existing B+Tree index records so concurrent transactions cannot insert phantom rows into a range.'],
          ['deadlocks-wait-for-graphs-detection', 'Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection', 'lesson', ['deadlocks', 'wait-for-graph', 'lock-ordering'], 'Tracing how T1 locking row A→B and T2 locking row B→A creates a Wait-For Graph cycle, how the engine aborts a victim, and canonical lock ordering fixes.'],
          ['dead-tuples-bloat-autovacuum-txid-wraparound', 'Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound', 'design', ['autovacuum', 'table-bloat', 'xid-wraparound'], 'Why MVCC leaves dead tuples behind, how VACUUM reclaims space into the Free Space Map without locking reads, and how 32-bit Transaction ID wraparound freezes tables.'],
          ['case-sentry-transaction-id-wraparound', 'Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage', 'case', ['xid-wraparound', 'autovacuum', 'postmortem'], 'Dissecting how unvacuumed 32-bit transaction IDs approach the 2-billion horizon, forcing PostgreSQL into emergency read-only shutdown to prevent data loss.'],
          ['build-mvcc-snapshot-storage-engine', 'Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC', 'build', ['build', 'mvcc', 'garbage-collection'], 'Implement an MVCC storage engine supporting versioned tuple chains (xmin/xmax), point-in-time snapshot visibility reads, and dead-tuple vacuum garbage collection.']
        ]
      },
      {
        id: 'm15',
        number: '5.3',
        legacyNumber: '15',
        title: 'Storage Engine Internals: Pages, Buffer Pool, WAL & LSM-Trees',
        summary: '8KB slotted database pages, Heap-Only Tuple (HOT) updates, Buffer Pool Clock-Sweep/LRU-K, Write-Ahead Logging (WAL & LSN), Fuzzy Checkpoints, ARIES crash recovery, and LSM-Trees.',
        units: [
          ['slotted-page-layout-8kb-anatomy', 'Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST', 'lesson', ['slotted-page', '8kb-page', 'toast'], 'Why databases use slotted pages: line pointer arrays growing downward, tuple payloads growing upward, indirection for compaction, and out-of-line TOAST storage.'],
          ['heap-files-hot-updates-fillfactor', 'Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor', 'lesson', ['hot-updates', 'fillfactor', 'heap-files'], 'How updating a non-indexed column with enough free space on the same 8KB page creates a Heap-Only Tuple (HOT) chain, bypassing all secondary index writes.'],
          ['buffer-pool-clock-sweep-lru-k', 'Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction', 'lesson', ['buffer-pool', 'clock-sweep', 'lru-k'], 'Managing in-memory page frames, why sequential scans pollute naive LRU caches, and how Clock-Sweep / LRU-K + ring buffers protect the hot working set.'],
          ['write-ahead-logging-wal-lsn', 'Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit', 'lesson', ['wal', 'lsn', 'group-commit'], 'The fundamental WAL invariant (log record must reach stable disk before dirty data page), page LSN tracking, and batching concurrent commits into one fsync.'],
          ['checkpoints-dirty-page-flushing', 'Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes)', 'lesson', ['checkpoints', 'full-page-writes', 'dirty-pages'], 'Bounding crash recovery time with spread checkpoints, and why the first modification to an 8KB page after a checkpoint logs a Full Page Image (FPI).'],
          ['aries-crash-recovery-analysis-redo-undo', 'ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes', 'lesson', ['aries', 'crash-recovery', 'redo-undo'], 'Walking step-by-step through the three passes of ARIES recovery: reconstructing active transactions (Analysis), repeating history (Redo), and rolling back losers (Undo).'],
          ['lsm-trees-memtable-sstable-compaction', 'LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction', 'lesson', ['lsm-tree', 'sstable', 'compaction'], 'Turning random writes into sequential appends via an in-memory skip-list MemTable, immutable sorted SSTable runs, Bloom filters, and leveled/tiered compaction.'],
          ['btree-vs-lsm-read-write-space-amplification', 'The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification', 'design', ['rum-conjecture', 'btree-vs-lsm', 'storage-engines'], 'Quantifying the fundamental storage trade-off triangle: optimizing any two of Read Overhead, Update (Write) Overhead, and Memory/Space Overhead penalizes the third.'],
          ['case-uber-postgres-to-mysql-storage', 'Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage', 'case', ['postgres-vs-mysql', 'storage-architecture', 'write-amplification'], 'Comparing secondary index write amplification, replica lag, and buffer pool semantics between heap-referenced ctids and primary-key-referenced clustered trees.'],
          ['build-slotted-page-wal-engine', 'Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator', 'build', ['build', 'slotted-page', 'aries-recovery'], 'Implement an 8KB slotted page allocator and an ARIES-style Write-Ahead Log manager that replays Redo and rolls back uncommitted Undo records after a simulated crash.']
        ]
      }
    ]
  },
  {
    id: 'track-6',
    number: 6,
    title: 'Analytical Engines (OLAP), Distributed SQL & Production Operations',
    summary: 'Scale from single-node engines to petabyte warehouses and globally distributed clusters: columnar Parquet/DuckDB/ClickHouse internals, sharding, NewSQL consensus, and production query tuning.',
    hours: 36,
    modules: [
      {
        id: 'm16',
        number: '6.1',
        legacyNumber: '16',
        title: 'Columnar Storage, Vectorized OLAP & Modern Lakehouses',
        summary: 'Row (NSM) vs Columnar (DSM/PAX) layouts, Apache Parquet, RLE/Dictionary/Delta compression, SIMD late materialization, Zone Maps, DuckDB, ClickHouse MergeTree, and Apache Iceberg.',
        units: [
          ['columnar-storage-layout-parquet', 'Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout', 'lesson', ['columnar-storage', 'parquet', 'olap'], 'Why analytical queries reading 4 of 100 columns waste 96% of I/O bandwidth on row stores, and how Parquet organizes Row Groups, Column Chunks, and Pages.'],
          ['columnar-compression-rle-dictionary-delta', 'Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding', 'lesson', ['compression', 'rle', 'dictionary-encoding'], 'Exploiting homogeneous column data types to achieve 10x–40x compression using Dictionary codes, Run-Length triples, Frame-of-Reference, and Delta encoding.'],
          ['late-materialization-simd-vectorization', 'Late Materialization & SIMD Vectorized Execution on Compressed Columns', 'lesson', ['late-materialization', 'simd', 'vectorized-execution'], 'Evaluating WHERE predicates directly on compressed dictionary IDs and bitmasks using AVX-512 SIMD instructions before reconstructing matching tuples.'],
          ['zone-maps-min-max-pruning-bloom', 'Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering', 'lesson', ['zone-maps', 'data-skipping', 'z-order'], 'Skipping 99% of Parquet row groups or micro-partitions using per-block min/max metadata headers and multi-dimensional Z-Order / Hilbert space-filling curves.'],
          ['embedded-olap-duckdb-architecture', 'Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution', 'lesson', ['duckdb', 'morsel-driven', 'embedded-olap'], 'Why scale-up single-node vectorized execution over local Parquet/Arrow files often beats distributed cluster overhead for datasets under 1 TB.'],
          ['realtime-olap-clickhouse-mergetree', 'Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines', 'lesson', ['clickhouse', 'mergetree', 'sparse-index'], 'How ClickHouse ingests millions of events/sec using immutable sorted data parts, sparse granule primary indexes (1 entry per 8,192 rows), and background merges.'],
          ['cloud-warehouses-snowflake-bigquery', 'Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute', 'design', ['snowflake', 'bigquery', 'cloud-warehouse'], 'Separating immutable object-store micro-partitions (S3/GCS) from stateless elastic compute clusters with local SSD caching and distributed shuffle fabrics.'],
          ['open-table-formats-iceberg-delta', 'Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage', 'lesson', ['apache-iceberg', 'delta-lake', 'lakehouse'], 'Bringing atomic schema evolution, hidden partitioning, snapshot isolation, and time-travel queries to Parquet files on S3 via metadata manifest trees.'],
          ['case-cloudflare-clickhouse-log-analytics', 'Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree', 'case', ['clickhouse', 'observability', 'columnar-compression'], 'How ordenar sorting keys, low-cardinality dictionary encoding, and materialized rollup tables power sub-second analytics over petabytes of network telemetry.'],
          ['build-columnar-compression-query-engine', 'Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown', 'build', ['build', 'columnar', 'zone-maps'], 'Build a columnar storage engine that compresses column chunks with Dictionary and Run-Length Encoding and prunes blocks via Zone Map min/max metadata.']
        ]
      },
      {
        id: 'm17',
        number: '6.2',
        legacyNumber: '17',
        title: 'Replication, Partitioning, Sharding & Distributed NewSQL',
        summary: 'Single-leader physical/logical replication, read replica consistency anomalies, split-brain failover, declarative partitioning, horizontal sharding (Vitess/Citus), 2PC vs Sagas, and Spanner/CockroachDB.',
        units: [
          ['single-leader-replication-sync-async', 'Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async', 'lesson', ['replication', 'wal-streaming', 'logical-replication'], 'Comparing byte-for-byte physical WAL streaming against row-level logical replication, and the latency vs RPO=0 trade-off of synchronous standbys.'],
          ['read-replicas-consistency-models', 'Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies', 'lesson', ['read-replicas', 'replication-lag', 'consistency'], 'Why routing reads to asynchronous replicas causes users to think their just-saved data vanished, and fixing it with LSN causal tracking or primary pinning.'],
          ['failover-split-brain-fencing-tokens', 'Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens', 'lesson', ['failover', 'split-brain', 'fencing-tokens'], 'What happens when a partitioned primary comes back online believing it is still leader, and how consensus leases, STONITH, and monotonic fencing tokens prevent corruption.'],
          ['declarative-table-partitioning', 'Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops', 'lesson', ['table-partitioning', 'partition-pruning', 'time-series'], 'Splitting billion-row tables into monthly child partitions for planner partition pruning and instant O(1) data expiration via DROP/DETACH PARTITION instead of DELETE.'],
          ['horizontal-sharding-routing-keys', 'Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather', 'design', ['sharding', 'shard-key', 'scatter-gather'], 'Choosing a tenant or entity shard key so 99% of queries route to a single shard, avoiding cross-shard scatter-gather tail latency and celebrity hot-shard skew.'],
          ['distributed-transactions-2pc-saga', 'Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern', 'lesson', ['2pc', 'saga-pattern', 'distributed-transactions'], 'Why atomic Two-Phase Commit (Prepare + Commit) amplifies latency and locks resources if the coordinator crashes, and when compensating Sagas win.'],
          ['distributed-sql-spanner-cockroachdb', 'Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC', 'lesson', ['spanner', 'cockroachdb', 'hybrid-logical-clock'], 'How NewSQL engines shard sorted key-value ranges across Raft consensus groups and use atomic/GPS TrueTime or Hybrid Logical Clocks for external consistency.'],
          ['connection-pooling-pgbouncer-proxies', 'Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes', 'lesson', ['connection-pooling', 'pgbouncer', 'transaction-pooling'], 'Why 5,000 idle application connections exhaust PostgreSQL RAM and snapshot scalability, and how transaction-mode multiplexing shares 100 server connections.'],
          ['case-figma-postgres-horizontal-sharding', 'Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters', 'case', ['sharding', 'postgres-scaling', 'vertical-to-horizontal'], 'Tracing the architectural journey from vertical scaling and read replicas to vertical table functional splitting and zero-downtime logical shard splits.'],
          ['build-sharded-query-router', 'Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather', 'build', ['build', 'sharding', 'query-router'], 'Implement a distributed SQL shard router that directs point-key queries to a single virtual node and executes scatter-gather merges for unsharded queries.']
        ]
      },
      {
        id: 'm18',
        number: '6.3',
        legacyNumber: '18',
        title: 'Production Query Tuning, Observability & Database Reliability',
        summary: 'Keyset cursor pagination vs OFFSET, solving ORM N+1 query storms, trigram/inverted full-text search, SKIP LOCKED job queues, bulk ingestion, pg_stat_statements triage, and PITR recovery.',
        units: [
          ['keyset-cursor-pagination-vs-offset', 'Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency', 'lesson', ['keyset-pagination', 'cursor-pagination', 'offset-trap'], 'Why OFFSET 100000 forces the engine to fetch and discard 100,000 rows, and how row-value seek predicates WHERE (created_at, id) < (?, ?) run in O(1) constant time.'],
          ['solving-n-plus-one-orm-queries', 'Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation', 'lesson', ['n-plus-one', 'orm-tuning', 'query-batching'], 'Detecting 1+N chatty query loops in application traces and collapsing 501 round-trips into 1 or 2 indexed queries using IN batching or lateral JSON aggregation.'],
          ['full-text-search-trigrams-inverted-index', 'Full-Text & Fuzzy Search: Why LIKE \'%term%\' Fails vs Trigrams (pg_trgm) & BM25', 'lesson', ['full-text-search', 'trigram-index', 'bm25'], 'Why leading-wildcard LIKE cannot use a B+Tree index, and how 3-character trigram GIN indexes and tokenized tsvector inverted indexes deliver sub-10ms search.'],
          ['queue-processing-skip-locked-patterns', 'High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED', 'design', ['job-queue', 'skip-locked', 'workers'], 'Building a durable, exactly-once background task queue inside SQL without external brokers using partial indexes, SKIP LOCKED, and lease heartbeats.'],
          ['bulk-ingestion-batching-unlogged-tables', 'High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY', 'lesson', ['bulk-ingest', 'copy', 'unlogged-tables'], 'Ingesting 100 million rows 20x faster by streaming binary COPY into staging tables, deferring B+Tree index builds, and tuning synchronous_commit.'],
          ['pg-stat-statements-slow-query-triage', 'Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio', 'lesson', ['pg-stat-statements', 'observability', 'slow-query-log'], 'Triaging database CPU saturation using normalized query digests: ranking by total_exec_time, shared_blks_read I/O pressure, and temp_blks_written spills.'],
          ['lock-contention-zero-downtime-ddl', 'Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID', 'design', ['zero-downtime-ddl', 'lock-timeout', 'concurrent-index'], 'Protecting production OLTP availability with mandatory lock_timeout guards, online index builds, and two-step NOT VALID + VALIDATE CONSTRAINT foreign keys.'],
          ['backup-pitr-wal-archiving-drills', 'Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay', 'lesson', ['pitr', 'backups', 'wal-archiving'], 'Why pg_dump cannot restore a 5 TB database to 14:02:59 right before an accidental DROP TABLE, and how physical base backups + continuous WAL archiving achieve PITR.'],
          ['case-gitlab-database-incident-postmortem', 'Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills', 'case', ['incident-postmortem', 'pitr', 'database-reliability'], 'Analyzing real-world production database emergencies, replication lag cascades, backup verification failures, and automated chaos recovery testing.'],
          ['build-production-sql-tuning-clinic', 'Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup)', 'build', ['build', 'query-tuning', 'performance-clinic'], 'Diagnose and rewrite a suite of pathological production SQL queries (non-SARGable filters, N+1 loops, OFFSET pagination, and missing composite indexes) for 100x speedups.']
        ]
      }
    ]
  }
];

const SOURCE_TRIPLETS = [
  ['https://www.postgresql.org/docs/current/', 'https://www.sqlite.org/docs.html', 'https://use-the-index-luke.com/'],
  ['https://duckdb.org/docs/', 'https://www.postgresql.org/docs/current/', 'https://15445.courses.cs.cmu.edu/'],
  ['https://www.sqlite.org/queryplanner.html', 'https://use-the-index-luke.com/', 'https://www.postgresql.org/docs/current/']
];

let lessonCount = 0;
let designCount = 0;
let caseCount = 0;
let buildCount = 0;

const parts = TRACKS.map((track, tIdx) => ({
  id: track.id,
  number: track.number,
  title: track.title,
  summary: track.summary,
  hours: track.hours,
  modules: track.modules.map((mod, mIdx) => ({
    id: mod.id,
    number: mod.number,
    legacyNumber: mod.legacyNumber,
    title: mod.title,
    summary: mod.summary,
    units: mod.units.map(([slug, title, kind, tags, excerpt], uIdx) => {
      if (kind === 'lesson') lessonCount++;
      else if (kind === 'design') designCount++;
      else if (kind === 'case') caseCount++;
      else if (kind === 'build') buildCount++;

      const sources = SOURCE_TRIPLETS[(tIdx + mIdx + uIdx) % SOURCE_TRIPLETS.length];
      return {
        slug,
        title,
        kind,
        archive: {
          slug,
          file: `${slug}.md`,
          title,
          displayTitle: title,
          type: kind,
          tags,
          sources,
          created: '2026-06-01',
          updated: '2026-10-26',
          wordCount: 1180 + ((tIdx * 37 + mIdx * 19 + uIdx * 23) % 260),
          excerpt,
          mermaidCount: 1
        }
      };
    })
  }))
}));

const curriculumData = {
  stats: {
    tracks: 6,
    units: lessonCount + designCount + caseCount + buildCount,
    lessons: lessonCount + designCount,
    systems: caseCount,
    builds: buildCount
  },
  parts
};

const outPath = path.join(__dirname, '..', 'data', 'curriculum.js');
const content = `// SQL In Depth — Master Curriculum v1.0 (6 Tracks, 18 Modules, 180 Units)\nwindow.CURRICULUM_DATA = ${JSON.stringify(curriculumData, null, 2)};\n`;
fs.writeFileSync(outPath, content, 'utf8');
console.log(`Generated ${outPath} with ${curriculumData.stats.units} units (${lessonCount} lessons, ${designCount} design, ${caseCount} cases, ${buildCount} builds).`);
