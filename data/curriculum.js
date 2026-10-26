// SQL In Depth — Master Curriculum v1.0 (6 Tracks, 18 Modules, 180 Units)
window.CURRICULUM_DATA = {
  "stats": {
    "tracks": 6,
    "units": 180,
    "lessons": 144,
    "systems": 18,
    "builds": 18
  },
  "parts": [
    {
      "id": "track-1",
      "number": 1,
      "title": "Relational Foundations & Core Querying",
      "summary": "Master the relational model, Codd's algebra, SQL data types, Three-Valued NULL logic, DDL constraints, idempotent upserts, and multi-table joins.",
      "hours": 28,
      "modules": [
        {
          "id": "m01",
          "number": "1.1",
          "legacyNumber": "01",
          "title": "The Relational Model, Tables & SELECT Foundations",
          "summary": "Why declarative SQL replaced navigational storage, relations vs tables, execution order (FROM before SELECT), predicates, Three-Valued Logic, and NULL semantics.",
          "units": [
            {
              "slug": "why-databases-exist",
              "title": "Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL",
              "kind": "lesson",
              "archive": {
                "slug": "why-databases-exist",
                "file": "why-databases-exist.md",
                "title": "Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL",
                "displayTitle": "Filesystems vs. Relational DBMS, Codd's 12 Rules & Declarative SQL",
                "type": "lesson",
                "tags": [
                  "relational-model",
                  "foundations",
                  "codd"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1180,
                "excerpt": "Why ad-hoc CSV/JSON files fail under concurrent mutations and how Edgar Codd's relational model separated physical storage from declarative queries.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "tables-rows-columns-types",
              "title": "Relations, Tuples, Attributes, Domains & SQL Data Types",
              "kind": "lesson",
              "archive": {
                "slug": "tables-rows-columns-types",
                "file": "tables-rows-columns-types.md",
                "title": "Relations, Tuples, Attributes, Domains & SQL Data Types",
                "displayTitle": "Relations, Tuples, Attributes, Domains & SQL Data Types",
                "type": "lesson",
                "tags": [
                  "data-types",
                  "schema",
                  "numeric"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1203,
                "excerpt": "Mapping mathematical relations to SQL tables, strict vs dynamic type affinity, exact NUMERIC/DECIMAL vs IEEE-754 FLOAT, and UTF-8 text encoding.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "select-projection-aliases",
              "title": "SELECT Projection, Expressions, Aliases & Logical Execution Order",
              "kind": "lesson",
              "archive": {
                "slug": "select-projection-aliases",
                "file": "select-projection-aliases.md",
                "title": "SELECT Projection, Expressions, Aliases & Logical Execution Order",
                "displayTitle": "SELECT Projection, Expressions, Aliases & Logical Execution Order",
                "type": "lesson",
                "tags": [
                  "select",
                  "projection",
                  "execution-order"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1226,
                "excerpt": "How the SQL engine binds FROM before evaluating SELECT projections, why column aliases fail inside WHERE, and expression evaluation pipelines.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "where-filtering-predicates",
              "title": "WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability",
              "kind": "lesson",
              "archive": {
                "slug": "where-filtering-predicates",
                "file": "where-filtering-predicates.md",
                "title": "WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability",
                "displayTitle": "WHERE Clause, Comparison Operators, BETWEEN, IN, LIKE & SARGability",
                "type": "lesson",
                "tags": [
                  "where",
                  "predicates",
                  "sargability"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1249,
                "excerpt": "Row-level tuple filtering with comparison operators, range bounds, pattern matching, and an introduction to Search Argument Able (SARGable) predicates.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "boolean-logic-three-valued-null",
              "title": "Boolean Logic, Operator Precedence & Three-Valued Logic (3VL)",
              "kind": "lesson",
              "archive": {
                "slug": "boolean-logic-three-valued-null",
                "file": "boolean-logic-three-valued-null.md",
                "title": "Boolean Logic, Operator Precedence & Three-Valued Logic (3VL)",
                "displayTitle": "Boolean Logic, Operator Precedence & Three-Valued Logic (3VL)",
                "type": "lesson",
                "tags": [
                  "three-valued-logic",
                  "null",
                  "boolean"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1272,
                "excerpt": "How SQL extends Boolean algebra with UNKNOWN (NULL), truth tables for AND/OR/NOT, and why NOT (col = 5) drops NULL rows silently.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "null-semantics-coalesce-nullif",
              "title": "NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF",
              "kind": "lesson",
              "archive": {
                "slug": "null-semantics-coalesce-nullif",
                "file": "null-semantics-coalesce-nullif.md",
                "title": "NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF",
                "displayTitle": "NULL Semantics: IS NULL, IS DISTINCT FROM, COALESCE & NULLIF",
                "type": "lesson",
                "tags": [
                  "null-handling",
                  "coalesce",
                  "nullif"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1295,
                "excerpt": "Null-safe comparisons with IS NOT DISTINCT FROM, fallback chains via COALESCE, division-by-zero guards with NULLIF, and aggregate NULL rules.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "order-by-limit-offset-distinct",
              "title": "Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT",
              "kind": "lesson",
              "archive": {
                "slug": "order-by-limit-offset-distinct",
                "file": "order-by-limit-offset-distinct.md",
                "title": "Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT",
                "displayTitle": "Sorting & Deduplication: ORDER BY, NULLS FIRST/LAST, DISTINCT & LIMIT",
                "type": "lesson",
                "tags": [
                  "order-by",
                  "distinct",
                  "pagination"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1318,
                "excerpt": "Deterministic multi-column sorting, NULL sort ordering across dialects, hash vs sort deduplication for DISTINCT, and Top-N heap slicing.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-expressions-type-casting",
              "title": "Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning",
              "kind": "design",
              "archive": {
                "slug": "case-expressions-type-casting",
                "file": "case-expressions-type-casting.md",
                "title": "Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning",
                "displayTitle": "Conditional SQL: CASE Expressions, CAST / :: & Data Cleaning",
                "type": "design",
                "tags": [
                  "case-when",
                  "type-casting",
                  "data-cleaning"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1341,
                "excerpt": "Branching inside projections and predicates with searched CASE WHEN expressions, safe type conversions, and defensive data normalization.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-stripe-ledger-precision",
              "title": "Production Case Study: Why Floating-Point Corrupts Financial Ledgers",
              "kind": "case",
              "archive": {
                "slug": "case-stripe-ledger-precision",
                "file": "case-stripe-ledger-precision.md",
                "title": "Production Case Study: Why Floating-Point Corrupts Financial Ledgers",
                "displayTitle": "Production Case Study: Why Floating-Point Corrupts Financial Ledgers",
                "type": "case",
                "tags": [
                  "fintech",
                  "numeric-precision",
                  "ledger"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1364,
                "excerpt": "How binary IEEE-754 floating-point rounding drift causes penny imbalances at scale and how integer cents + exact NUMERIC enforce ledger invariants.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-sql-query-interpreter",
              "title": "Hands-On Build: Mini Relational Tuple Filter & Projection Engine",
              "kind": "build",
              "archive": {
                "slug": "build-sql-query-interpreter",
                "file": "build-sql-query-interpreter.md",
                "title": "Hands-On Build: Mini Relational Tuple Filter & Projection Engine",
                "displayTitle": "Hands-On Build: Mini Relational Tuple Filter & Projection Engine",
                "type": "build",
                "tags": [
                  "build",
                  "relational-engine",
                  "query-pipeline"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1387,
                "excerpt": "Implement a clause-by-clause relational tuple evaluator supporting FROM, WHERE with Three-Valued NULL logic, SELECT projection, and ORDER BY.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m02",
          "number": "1.2",
          "legacyNumber": "02",
          "title": "DDL, Schema Constraints & DML Mutations",
          "summary": "Table creation, surrogate vs natural primary keys (UUIDv7 vs B-Tree locality), foreign key referential actions, CHECK constraints, upserts, and views.",
          "units": [
            {
              "slug": "create-table-ddl-anatomy",
              "title": "CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs",
              "kind": "lesson",
              "archive": {
                "slug": "create-table-ddl-anatomy",
                "file": "create-table-ddl-anatomy.md",
                "title": "CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs",
                "displayTitle": "CREATE TABLE, ALTER TABLE, DROP, TRUNCATE vs DELETE & Catalogs",
                "type": "lesson",
                "tags": [
                  "ddl",
                  "create-table",
                  "system-catalogs"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1199,
                "excerpt": "How DDL statements mutate system catalog tables (pg_class, sqlite_master), physical storage allocation, and fast O(1) file truncation vs row-by-row DELETE.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "primary-keys-surrogate-vs-natural",
              "title": "Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality",
              "kind": "lesson",
              "archive": {
                "slug": "primary-keys-surrogate-vs-natural",
                "file": "primary-keys-surrogate-vs-natural.md",
                "title": "Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality",
                "displayTitle": "Primary Keys: Composite Keys, IDENTITY & UUIDv4 vs UUIDv7 Locality",
                "type": "lesson",
                "tags": [
                  "primary-key",
                  "uuidv7",
                  "btree-locality"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1222,
                "excerpt": "Choosing between natural keys, auto-incrementing 64-bit integers, and time-ordered UUIDv7 to eliminate random B+Tree leaf page splits.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "foreign-keys-referential-integrity",
              "title": "Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT)",
              "kind": "lesson",
              "archive": {
                "slug": "foreign-keys-referential-integrity",
                "file": "foreign-keys-referential-integrity.md",
                "title": "Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT)",
                "displayTitle": "Foreign Keys, Parent/Child Tables & Referential Actions (CASCADE / RESTRICT)",
                "type": "lesson",
                "tags": [
                  "foreign-key",
                  "referential-integrity",
                  "cascade"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1245,
                "excerpt": "Enforcing relational graph invariants at the storage engine layer with ON DELETE CASCADE, RESTRICT, SET NULL, and deferred constraint checking.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "check-unique-not-null-defaults",
              "title": "Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns",
              "kind": "lesson",
              "archive": {
                "slug": "check-unique-not-null-defaults",
                "file": "check-unique-not-null-defaults.md",
                "title": "Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns",
                "displayTitle": "Domain Integrity: CHECK, UNIQUE, NOT NULL, DEFAULT & Generated Columns",
                "type": "lesson",
                "tags": [
                  "constraints",
                  "check",
                  "generated-columns"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1268,
                "excerpt": "Encoding business invariants directly into table definitions using CHECK predicates, multi-column UNIQUE indexes with NULLs, and stored/virtual generated columns.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "insert-bulk-loading-returning",
              "title": "Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING",
              "kind": "lesson",
              "archive": {
                "slug": "insert-bulk-loading-returning",
                "file": "insert-bulk-loading-returning.md",
                "title": "Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING",
                "displayTitle": "Single & Multi-Row INSERT, INSERT ... SELECT, COPY & RETURNING",
                "type": "lesson",
                "tags": [
                  "insert",
                  "bulk-load",
                  "returning"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1291,
                "excerpt": "Amortizing network round-trips and WAL fsync overhead with multi-row batched INSERT statements and atomic server-generated ID retrieval via RETURNING.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "upsert-on-conflict-merge",
              "title": "Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE",
              "kind": "lesson",
              "archive": {
                "slug": "upsert-on-conflict-merge",
                "file": "upsert-on-conflict-merge.md",
                "title": "Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE",
                "displayTitle": "Idempotent Writes: ON CONFLICT DO UPDATE (Upsert) & MERGE",
                "type": "lesson",
                "tags": [
                  "upsert",
                  "on-conflict",
                  "idempotency"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1314,
                "excerpt": "Resolving concurrent insert races atomically with ON CONFLICT (key) DO UPDATE, EXCLUDED pseudo-tuples, and SQL standard MERGE pipelines.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "update-delete-safe-mutations",
              "title": "Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs",
              "kind": "design",
              "archive": {
                "slug": "update-delete-safe-mutations",
                "file": "update-delete-safe-mutations.md",
                "title": "Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs",
                "displayTitle": "Safe Mutations: UPDATE, UPDATE ... FROM, DELETE & Soft-Delete Tradeoffs",
                "type": "design",
                "tags": [
                  "update",
                  "delete",
                  "soft-delete"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1337,
                "excerpt": "Writing bounded mutations, joining reference tables during UPDATE, and weighing tombstone soft deletes (deleted_at) against partial index bloat.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "views-temp-tables-ctas",
              "title": "Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables",
              "kind": "lesson",
              "archive": {
                "slug": "views-temp-tables-ctas",
                "file": "views-temp-tables-ctas.md",
                "title": "Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables",
                "displayTitle": "Virtual & Ephemeral Relations: Views, Updatable Views, CTAS & Temp Tables",
                "type": "lesson",
                "tags": [
                  "views",
                  "ctas",
                  "temp-tables"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1360,
                "excerpt": "Query tree view expansion, security barrier views, session-scoped temporary tables, and staging pipelines with CREATE TABLE AS SELECT.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-github-zero-downtime-migrations",
              "title": "Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract)",
              "kind": "case",
              "archive": {
                "slug": "case-github-zero-downtime-migrations",
                "file": "case-github-zero-downtime-migrations.md",
                "title": "Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract)",
                "displayTitle": "Production Case Study: Zero-Downtime Schema Migrations (Expand & Contract)",
                "type": "case",
                "tags": [
                  "schema-migration",
                  "zero-downtime",
                  "locks"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1383,
                "excerpt": "Why naive ALTER TABLE ADD COLUMN with defaults or NOT NULL locks production traffic and how the Expand-Backfill-Contract pattern ships safely.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-ecommerce-schema-ddl",
              "title": "Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline",
              "kind": "build",
              "archive": {
                "slug": "build-ecommerce-schema-ddl",
                "file": "build-ecommerce-schema-ddl.md",
                "title": "Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline",
                "displayTitle": "Hands-On Build: E-Commerce Schema with Referential Integrity & Upsert Pipeline",
                "type": "build",
                "tags": [
                  "build",
                  "ddl",
                  "upsert"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1406,
                "excerpt": "Design and verify a normalized e-commerce relational schema enforcing foreign keys, CHECK constraints, and idempotent inventory upserts.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m03",
          "number": "1.3",
          "legacyNumber": "03",
          "title": "Relational Algebra & Multi-Table Joins",
          "summary": "Codd's relational algebra operators, INNER/LEFT/RIGHT/FULL OUTER joins, the ON vs WHERE outer-join filter trap, semi/anti-joins, and set operations.",
          "units": [
            {
              "slug": "relational-algebra-set-theory",
              "title": "Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ)",
              "kind": "lesson",
              "archive": {
                "slug": "relational-algebra-set-theory",
                "file": "relational-algebra-set-theory.md",
                "title": "Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ)",
                "displayTitle": "Relational Algebra: Selection (σ), Projection (π), Product (×) & Rename (ρ)",
                "type": "lesson",
                "tags": [
                  "relational-algebra",
                  "set-theory",
                  "codd"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1218,
                "excerpt": "Translating SQL queries into algebraic operator trees and proving why relational algebra closure enables algebraic query optimization.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "inner-join-equi-joins",
              "title": "INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal",
              "kind": "lesson",
              "archive": {
                "slug": "inner-join-equi-joins",
                "file": "inner-join-equi-joins.md",
                "title": "INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal",
                "displayTitle": "INNER JOIN, Equi-Joins, ON vs USING & Foreign-Key Graph Traversal",
                "type": "lesson",
                "tags": [
                  "inner-join",
                  "equi-join",
                  "foreign-key"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1241,
                "excerpt": "How INNER JOIN pairs matching tuples across tables, why explicit ANSI JOIN syntax replaced comma joins, and multi-hop table traversal.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "left-right-full-outer-joins",
              "title": "Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension",
              "kind": "lesson",
              "archive": {
                "slug": "left-right-full-outer-joins",
                "file": "left-right-full-outer-joins.md",
                "title": "Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension",
                "displayTitle": "Outer Joins: LEFT, RIGHT & FULL OUTER JOIN with NULL Extension",
                "type": "lesson",
                "tags": [
                  "left-join",
                  "outer-join",
                  "null-extension"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1264,
                "excerpt": "Preserving unmatched rows from the outer relation, understanding the preserved vs null-supplying table sides, and emulating FULL OUTER JOIN.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "join-where-vs-on-filter-trap",
              "title": "The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE",
              "kind": "lesson",
              "archive": {
                "slug": "join-where-vs-on-filter-trap",
                "file": "join-where-vs-on-filter-trap.md",
                "title": "The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE",
                "displayTitle": "The Classic Outer Join Trap: Filtering in ON vs Filtering in WHERE",
                "type": "lesson",
                "tags": [
                  "outer-join-trap",
                  "left-join",
                  "where-vs-on"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1287,
                "excerpt": "Why placing a predicate on the right-hand table inside WHERE silently converts a LEFT JOIN into an INNER JOIN by rejecting NULL-extended rows.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "self-joins-non-equi-joins",
              "title": "Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN)",
              "kind": "lesson",
              "archive": {
                "slug": "self-joins-non-equi-joins",
                "file": "self-joins-non-equi-joins.md",
                "title": "Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN)",
                "displayTitle": "Self-Joins, Hierarchical Pairs & Non-Equi Range Joins (<, >, BETWEEN)",
                "type": "lesson",
                "tags": [
                  "self-join",
                  "non-equi-join",
                  "range-join"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1310,
                "excerpt": "Joining a table to itself with mandatory table aliases for manager-employee lookups, pairwise event comparisons, and temporal range overlaps.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "cross-join-cartesian-products",
              "title": "CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions",
              "kind": "lesson",
              "archive": {
                "slug": "cross-join-cartesian-products",
                "file": "cross-join-cartesian-products.md",
                "title": "CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions",
                "displayTitle": "CROSS JOIN, Combinatorial Grids & Accidental Cartesian Explosions",
                "type": "lesson",
                "tags": [
                  "cross-join",
                  "cartesian-product",
                  "combinatorics"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1333,
                "excerpt": "Intentional Cartesian products for date-product spine generation vs catastrophic N×M row explosions caused by missing join predicates.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "semi-joins-anti-joins",
              "title": "Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL)",
              "kind": "design",
              "archive": {
                "slug": "semi-joins-anti-joins",
                "file": "semi-joins-anti-joins.md",
                "title": "Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL)",
                "displayTitle": "Relational Semi-Join (EXISTS / IN) & Anti-Join (NOT EXISTS / LEFT JOIN IS NULL)",
                "type": "design",
                "tags": [
                  "semi-join",
                  "anti-join",
                  "exists"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1356,
                "excerpt": "Checking existence without duplicating left-hand rows when multiple right-hand matches exist, and finding orphan records with anti-joins.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "set-operations-union-intersect-except",
              "title": "Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT",
              "kind": "lesson",
              "archive": {
                "slug": "set-operations-union-intersect-except",
                "file": "set-operations-union-intersect-except.md",
                "title": "Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT",
                "displayTitle": "Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT",
                "type": "lesson",
                "tags": [
                  "union",
                  "intersect",
                  "except"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1379,
                "excerpt": "Combining vertical result sets, why UNION ALL avoids an expensive sort/hash deduplication pass, and set difference via EXCEPT.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-missing-null-notin-outage",
              "title": "Production Case Study: How a Single NULL in NOT IN Returned Zero Rows",
              "kind": "case",
              "archive": {
                "slug": "case-missing-null-notin-outage",
                "file": "case-missing-null-notin-outage.md",
                "title": "Production Case Study: How a Single NULL in NOT IN Returned Zero Rows",
                "displayTitle": "Production Case Study: How a Single NULL in NOT IN Returned Zero Rows",
                "type": "case",
                "tags": [
                  "not-in-trap",
                  "null",
                  "anti-join"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1402,
                "excerpt": "Dissecting a classic production outage where x NOT IN (SELECT nullable_col ...) evaluated to UNKNOWN for every row, and fixing it with NOT EXISTS.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-multi-table-order-reconciler",
              "title": "Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine",
              "kind": "build",
              "archive": {
                "slug": "build-multi-table-order-reconciler",
                "file": "build-multi-table-order-reconciler.md",
                "title": "Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine",
                "displayTitle": "Hands-On Build: Multi-Table Order, Payment & Shipment Reconciliation Engine",
                "type": "build",
                "tags": [
                  "build",
                  "joins",
                  "reconciliation"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1425,
                "excerpt": "Build an audit query suite using LEFT JOIN, FULL OUTER reconciliation, and anti-joins to detect unshipped paid orders and settlement mismatches.",
                "mermaidCount": 1
              }
            }
          ]
        }
      ]
    },
    {
      "id": "track-2",
      "number": 2,
      "title": "Aggregations, Subqueries, CTEs & Window Functions",
      "summary": "Go beyond basic querying: master multi-dimensional GROUP BY rollups, join fanout prevention, correlated lateral subqueries, recursive CTE graph traversal, and window function framing.",
      "hours": 32,
      "modules": [
        {
          "id": "m04",
          "number": "2.1",
          "legacyNumber": "04",
          "title": "Grouping, Aggregations & Multi-Dimensional Rollups",
          "summary": "Aggregate function internals, GROUP BY bucket partitioning, WHERE vs HAVING, FILTER conditional aggregation, GROUPING SETS/ROLLUP/CUBE, and fanout traps.",
          "units": [
            {
              "slug": "aggregate-functions-internals",
              "title": "Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG",
              "kind": "lesson",
              "archive": {
                "slug": "aggregate-functions-internals",
                "file": "aggregate-functions-internals.md",
                "title": "Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG",
                "displayTitle": "Aggregate Internals: COUNT(*) vs COUNT(col), COUNT(DISTINCT), SUM & AVG",
                "type": "lesson",
                "tags": [
                  "aggregates",
                  "count",
                  "null-semantics"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1217,
                "excerpt": "How state transition functions accumulate values per group, why COUNT(col) skips NULLs while COUNT(*) counts tuples, and AVG(NULL) pitfalls.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "group-by-execution-mechanics",
              "title": "GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency",
              "kind": "lesson",
              "archive": {
                "slug": "group-by-execution-mechanics",
                "file": "group-by-execution-mechanics.md",
                "title": "GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency",
                "displayTitle": "GROUP BY Execution Mechanics, HashAggregate vs GroupAggregate & Functional Dependency",
                "type": "lesson",
                "tags": [
                  "group-by",
                  "hash-aggregate",
                  "functional-dependency"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1240,
                "excerpt": "How the execution engine partitions rows via hashing or sorting, and why selecting non-grouped columns without functional dependency is invalid.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "having-vs-where-pipeline",
              "title": "Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline",
              "kind": "lesson",
              "archive": {
                "slug": "having-vs-where-pipeline",
                "file": "having-vs-where-pipeline.md",
                "title": "Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline",
                "displayTitle": "Pre-Filter (WHERE) vs Post-Aggregate Filter (HAVING) Pipeline",
                "type": "lesson",
                "tags": [
                  "having",
                  "where",
                  "query-pipeline"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1263,
                "excerpt": "Why pushing selective predicates into WHERE prunes rows before hash table allocation, reserving HAVING strictly for group-level aggregates.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "conditional-aggregation-filter",
              "title": "Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...)",
              "kind": "lesson",
              "archive": {
                "slug": "conditional-aggregation-filter",
                "file": "conditional-aggregation-filter.md",
                "title": "Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...)",
                "displayTitle": "Pivoting & Conditional Aggregation: SUM(CASE WHEN) & FILTER (WHERE ...)",
                "type": "lesson",
                "tags": [
                  "conditional-aggregation",
                  "filter-clause",
                  "pivot"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1286,
                "excerpt": "Computing multiple filtered metrics in a single table scan using CASE expressions and the SQL:2003 FILTER (WHERE ...) clause.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "string-json-array-aggregation",
              "title": "List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation",
              "kind": "lesson",
              "archive": {
                "slug": "string-json-array-aggregation",
                "file": "string-json-array-aggregation.md",
                "title": "List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation",
                "displayTitle": "List & Document Rollups: GROUP_CONCAT, STRING_AGG & JSON Aggregation",
                "type": "lesson",
                "tags": [
                  "string-agg",
                  "group-concat",
                  "json-agg"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1309,
                "excerpt": "Collapsing one-to-many child rows into ordered delimited strings or nested JSON arrays without N+1 application round-trips.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "grouping-sets-rollup-cube",
              "title": "Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING()",
              "kind": "lesson",
              "archive": {
                "slug": "grouping-sets-rollup-cube",
                "file": "grouping-sets-rollup-cube.md",
                "title": "Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING()",
                "displayTitle": "Multi-Dimensional OLAP: GROUPING SETS, ROLLUP, CUBE & GROUPING()",
                "type": "lesson",
                "tags": [
                  "grouping-sets",
                  "rollup",
                  "cube"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1332,
                "excerpt": "Generating subtotals, hierarchical rollups, and full cross-tabulation cubes in a single pass while distinguishing real NULLs via GROUPING().",
                "mermaidCount": 1
              }
            },
            {
              "slug": "join-fanout-chasm-traps",
              "title": "The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts)",
              "kind": "design",
              "archive": {
                "slug": "join-fanout-chasm-traps",
                "file": "join-fanout-chasm-traps.md",
                "title": "The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts)",
                "displayTitle": "The One-to-Many Join Fanout & Chasm Traps (Why SUM Double-Counts)",
                "type": "design",
                "tags": [
                  "fanout-trap",
                  "chasm-trap",
                  "double-counting"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1355,
                "excerpt": "Visualizing how joining two independent one-to-many child tables multiplies parent rows and inflates SUM/COUNT aggregates unless pre-aggregated.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "histograms-percentiles-medians",
              "title": "Statistical SQL: Equi-Width Histograms, Percentiles & Medians",
              "kind": "lesson",
              "archive": {
                "slug": "histograms-percentiles-medians",
                "file": "histograms-percentiles-medians.md",
                "title": "Statistical SQL: Equi-Width Histograms, Percentiles & Medians",
                "displayTitle": "Statistical SQL: Equi-Width Histograms, Percentiles & Medians",
                "type": "lesson",
                "tags": [
                  "percentiles",
                  "median",
                  "histograms"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1378,
                "excerpt": "Computing exact and approximate p50/p95/p99 latencies, discrete vs continuous percentiles, and bucketed frequency distributions in SQL.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-analytics-double-counting-bug",
              "title": "Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug",
              "kind": "case",
              "archive": {
                "slug": "case-analytics-double-counting-bug",
                "file": "case-analytics-double-counting-bug.md",
                "title": "Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug",
                "displayTitle": "Production Case Study: Diagnosing a 3x Revenue Over-Reporting Fanout Bug",
                "type": "case",
                "tags": [
                  "fanout-bug",
                  "analytics",
                  "pre-aggregation"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1401,
                "excerpt": "Tracing an executive dashboard incident where joining orders to both order_items and shipments inflated reported revenue by 310%.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-executive-kpi-aggregation-suite",
              "title": "Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite",
              "kind": "build",
              "archive": {
                "slug": "build-executive-kpi-aggregation-suite",
                "file": "build-executive-kpi-aggregation-suite.md",
                "title": "Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite",
                "displayTitle": "Hands-On Build: Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite",
                "type": "build",
                "tags": [
                  "build",
                  "aggregations",
                  "kpi-suite"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1424,
                "excerpt": "Construct a fanout-safe executive KPI query suite combining conditional aggregation, pre-aggregated CTEs, and multi-dimensional rollups.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m05",
          "number": "2.2",
          "legacyNumber": "05",
          "title": "Subqueries, Correlated Queries, Lateral Joins & CTEs",
          "summary": "Scalar/row/table subqueries, correlated subquery unnesting, EXISTS null safety, LATERAL joins, Common Table Expressions (WITH), and recursive CTE graph queries.",
          "units": [
            {
              "slug": "scalar-row-table-subqueries",
              "title": "Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries",
              "kind": "lesson",
              "archive": {
                "slug": "scalar-row-table-subqueries",
                "file": "scalar-row-table-subqueries.md",
                "title": "Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries",
                "displayTitle": "Subquery Taxonomy: Scalar, Row, Array & Derived Table Subqueries",
                "type": "lesson",
                "tags": [
                  "subqueries",
                  "derived-tables",
                  "scalar-subquery"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1236,
                "excerpt": "Where subqueries can legally appear across SELECT, FROM, and WHERE, runtime cardinality assertions for scalar subqueries, and inline views.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "correlated-subqueries-mechanics",
              "title": "Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting",
              "kind": "lesson",
              "archive": {
                "slug": "correlated-subqueries-mechanics",
                "file": "correlated-subqueries-mechanics.md",
                "title": "Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting",
                "displayTitle": "Correlated Subqueries: Outer Reference Binding & Optimizer Unnesting",
                "type": "lesson",
                "tags": [
                  "correlated-subquery",
                  "unnesting",
                  "optimizer"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1259,
                "excerpt": "How correlated subqueries bind outer tuple attributes, why naive execution is O(N×M), and how modern optimizers decorrelate them into hash joins.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "exists-not-exists-null-safety",
              "title": "EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety",
              "kind": "lesson",
              "archive": {
                "slug": "exists-not-exists-null-safety",
                "file": "exists-not-exists-null-safety.md",
                "title": "EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety",
                "displayTitle": "EXISTS & NOT EXISTS: Short-Circuit Semi-Joins & Complete NULL Safety",
                "type": "lesson",
                "tags": [
                  "exists",
                  "not-exists",
                  "semi-join"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1282,
                "excerpt": "Why EXISTS stops scanning on the first matching tuple and why NOT EXISTS is immune to the Three-Valued Logic NULL catastrophe of NOT IN.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "lateral-joins-cross-apply",
              "title": "LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group",
              "kind": "lesson",
              "archive": {
                "slug": "lateral-joins-cross-apply",
                "file": "lateral-joins-cross-apply.md",
                "title": "LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group",
                "displayTitle": "LATERAL Subqueries (CROSS APPLY / OUTER APPLY) & Top-N-Per-Group",
                "type": "lesson",
                "tags": [
                  "lateral-join",
                  "cross-apply",
                  "top-n-per-group"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1305,
                "excerpt": "Evaluating correlated derived tables that can reference preceding FROM tables and return multiple columns and rows per outer tuple.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "common-table-expressions-with",
              "title": "Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines",
              "kind": "lesson",
              "archive": {
                "slug": "common-table-expressions-with",
                "file": "common-table-expressions-with.md",
                "title": "Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines",
                "displayTitle": "Common Table Expressions (WITH): Modular Multi-Stage SQL Pipelines",
                "type": "lesson",
                "tags": [
                  "cte",
                  "with-clause",
                  "modular-sql"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1328,
                "excerpt": "Refactoring deeply nested subqueries into readable, testable DAGs of named intermediate relations using chained WITH clauses.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "cte-materialization-optimization-fence",
              "title": "CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints",
              "kind": "design",
              "archive": {
                "slug": "cte-materialization-optimization-fence",
                "file": "cte-materialization-optimization-fence.md",
                "title": "CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints",
                "displayTitle": "CTE Inlining vs Materialization: Optimization Fences & MATERIALIZED Hints",
                "type": "design",
                "tags": [
                  "cte-materialization",
                  "optimization-fence",
                  "predicate-pushdown"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1351,
                "excerpt": "When the planner folds a CTE into the main query for predicate pushdown vs materializing it into a temp table once (PostgreSQL 12+ & SQLite semantics).",
                "mermaidCount": 1
              }
            },
            {
              "slug": "recursive-ctes-hierarchies",
              "title": "Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint",
              "kind": "lesson",
              "archive": {
                "slug": "recursive-ctes-hierarchies",
                "file": "recursive-ctes-hierarchies.md",
                "title": "Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint",
                "displayTitle": "Recursive CTEs (WITH RECURSIVE): Anchor, Recursive Member & Fixpoint",
                "type": "lesson",
                "tags": [
                  "recursive-cte",
                  "hierarchies",
                  "trees"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1374,
                "excerpt": "Executing iterative fixpoint worktable algorithms in pure SQL to traverse organizational charts, category trees, and parent-child hierarchies.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "graph-traversal-cycle-detection-sql",
              "title": "Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL",
              "kind": "lesson",
              "archive": {
                "slug": "graph-traversal-cycle-detection-sql",
                "file": "graph-traversal-cycle-detection-sql.md",
                "title": "Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL",
                "displayTitle": "Graph Traversal, Bill-of-Materials (BOM) & Cycle Detection in SQL",
                "type": "lesson",
                "tags": [
                  "graph-sql",
                  "cycle-detection",
                  "bom"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1397,
                "excerpt": "Preventing infinite recursion loops on cyclic graphs using path strings or visited arrays, computing shortest paths, and aggregating BOM part costs.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-recursive-org-permission-engine",
              "title": "Production Case Study: Hierarchical RBAC Permission Inheritance in SQL",
              "kind": "case",
              "archive": {
                "slug": "case-recursive-org-permission-engine",
                "file": "case-recursive-org-permission-engine.md",
                "title": "Production Case Study: Hierarchical RBAC Permission Inheritance in SQL",
                "displayTitle": "Production Case Study: Hierarchical RBAC Permission Inheritance in SQL",
                "type": "case",
                "tags": [
                  "rbac",
                  "recursive-cte",
                  "permissions"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1420,
                "excerpt": "Designing a sub-5ms hierarchical folder and organization permission evaluator using indexed recursive CTEs and transitive closure tables.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-hierarchical-graph-query-engine",
              "title": "Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine",
              "kind": "build",
              "archive": {
                "slug": "build-hierarchical-graph-query-engine",
                "file": "build-hierarchical-graph-query-engine.md",
                "title": "Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine",
                "displayTitle": "Hands-On Build: Bill-of-Materials & Social Graph Reachability Engine",
                "type": "build",
                "tags": [
                  "build",
                  "recursive-cte",
                  "graph"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1183,
                "excerpt": "Build a recursive SQL engine that computes multi-level organizational reporting chains, detects dependency cycles, and rolls up hierarchical budgets.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m06",
          "number": "2.3",
          "legacyNumber": "06",
          "title": "Window Functions & Analytical SQL Mastery",
          "summary": "OVER (PARTITION BY ... ORDER BY ...), ranking functions, LAG/LEAD offsets, ROWS vs RANGE vs GROUPS window frames, running totals, and Gaps & Islands sessionization.",
          "units": [
            {
              "slug": "window-functions-mental-model",
              "title": "The Window Function Mental Model: Preserving Row Identity + Context",
              "kind": "lesson",
              "archive": {
                "slug": "window-functions-mental-model",
                "file": "window-functions-mental-model.md",
                "title": "The Window Function Mental Model: Preserving Row Identity + Context",
                "displayTitle": "The Window Function Mental Model: Preserving Row Identity + Context",
                "type": "lesson",
                "tags": [
                  "window-functions",
                  "over-clause",
                  "analytical-sql"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1255,
                "excerpt": "Why GROUP BY collapses rows while OVER (...) attaches an analytical sliding window to every tuple without losing row-level granularity.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "partition-by-order-by-mechanics",
              "title": "PARTITION BY, ORDER BY & The Default RANGE Frame Trap",
              "kind": "lesson",
              "archive": {
                "slug": "partition-by-order-by-mechanics",
                "file": "partition-by-order-by-mechanics.md",
                "title": "PARTITION BY, ORDER BY & The Default RANGE Frame Trap",
                "displayTitle": "PARTITION BY, ORDER BY & The Default RANGE Frame Trap",
                "type": "lesson",
                "tags": [
                  "partition-by",
                  "window-order",
                  "default-frame"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1278,
                "excerpt": "How window partitioning and sorting work under the hood, and why adding ORDER BY silently changes the default frame to RANGE UNBOUNDED PRECEDING.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "ranking-functions-row-number-rank",
              "title": "Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST",
              "kind": "lesson",
              "archive": {
                "slug": "ranking-functions-row-number-rank",
                "file": "ranking-functions-row-number-rank.md",
                "title": "Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST",
                "displayTitle": "Ranking Functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE & CUME_DIST",
                "type": "lesson",
                "tags": [
                  "row-number",
                  "rank",
                  "dense-rank"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1301,
                "excerpt": "Exact tie-breaking semantics between ROW_NUMBER (1,2,3,4), RANK (1,2,2,4), and DENSE_RANK (1,2,2,3), plus equidepth bucketing with NTILE.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "top-n-per-group-deduplication",
              "title": "Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY",
              "kind": "lesson",
              "archive": {
                "slug": "top-n-per-group-deduplication",
                "file": "top-n-per-group-deduplication.md",
                "title": "Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY",
                "displayTitle": "Canonical Top-N-Per-Group, Stream Deduplication & QUALIFY",
                "type": "lesson",
                "tags": [
                  "top-n-per-group",
                  "deduplication",
                  "qualify"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1324,
                "excerpt": "Fetching the latest N events per user or top products per category using ROW_NUMBER() CTEs and DuckDB/Snowflake QUALIFY syntax.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "offset-functions-lag-lead-first-last",
              "title": "Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap",
              "kind": "lesson",
              "archive": {
                "slug": "offset-functions-lag-lead-first-last",
                "file": "offset-functions-lag-lead-first-last.md",
                "title": "Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap",
                "displayTitle": "Navigational Offset Functions: LAG, LEAD, FIRST_VALUE & The LAST_VALUE Trap",
                "type": "lesson",
                "tags": [
                  "lag",
                  "lead",
                  "last-value"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1347,
                "excerpt": "Peeking at preceding and succeeding rows without self-joins, period-over-period growth deltas, and why LAST_VALUE requires an explicit UNBOUNDED FOLLOWING frame.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "window-frames-rows-range-groups",
              "title": "Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages",
              "kind": "lesson",
              "archive": {
                "slug": "window-frames-rows-range-groups",
                "file": "window-frames-rows-range-groups.md",
                "title": "Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages",
                "displayTitle": "Window Frames Deep Dive: ROWS vs RANGE vs GROUPS & Moving Averages",
                "type": "lesson",
                "tags": [
                  "window-frames",
                  "rows-vs-range",
                  "moving-average"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1370,
                "excerpt": "Physical row offsets (ROWS) vs logical value intervals (RANGE) vs peer tie groups (GROUPS) for accurate 7-day rolling averages.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "running-totals-cumulative-shares",
              "title": "Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses",
              "kind": "lesson",
              "archive": {
                "slug": "running-totals-cumulative-shares",
                "file": "running-totals-cumulative-shares.md",
                "title": "Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses",
                "displayTitle": "Running Totals, Pareto (80/20) Curves & Named WINDOW Clauses",
                "type": "lesson",
                "tags": [
                  "running-total",
                  "pareto",
                  "named-window"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1393,
                "excerpt": "Computing monotonic cumulative sums, percentage-of-total shares, and reusing window specifications cleanly with the WINDOW w AS (...) clause.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "gaps-and-islands-sessionization",
              "title": "Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization",
              "kind": "design",
              "archive": {
                "slug": "gaps-and-islands-sessionization",
                "file": "gaps-and-islands-sessionization.md",
                "title": "Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization",
                "displayTitle": "Solving Classic Gaps and Islands, Streaks & Clickstream Sessionization",
                "type": "design",
                "tags": [
                  "gaps-and-islands",
                  "sessionization",
                  "streaks"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1416,
                "excerpt": "Grouping contiguous sequences and splitting user activity streams into 30-minute sessions using the ROW_NUMBER difference trick and LAG step indicators.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-fintech-velocity-fraud-window",
              "title": "Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection",
              "kind": "case",
              "archive": {
                "slug": "case-fintech-velocity-fraud-window",
                "file": "case-fintech-velocity-fraud-window.md",
                "title": "Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection",
                "displayTitle": "Production Case Study: Real-Time Sliding-Window Card Velocity Fraud Detection",
                "type": "case",
                "tags": [
                  "fraud-detection",
                  "sliding-window",
                  "fintech"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1439,
                "excerpt": "Detecting rapid card-testing bursts and cross-country impossible travel in a single analytical window pass over merchant transaction streams.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-sessionization-retention-engine",
              "title": "Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer",
              "kind": "build",
              "archive": {
                "slug": "build-sessionization-retention-engine",
                "file": "build-sessionization-retention-engine.md",
                "title": "Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer",
                "displayTitle": "Hands-On Build: Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer",
                "type": "build",
                "tags": [
                  "build",
                  "window-functions",
                  "sessionization"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1202,
                "excerpt": "Implement a complete analytical SQL pipeline that sessionizes raw user events, computes consecutive active streaks, and flags anomalous velocity spikes.",
                "mermaidCount": 1
              }
            }
          ]
        }
      ]
    },
    {
      "id": "track-3",
      "number": 3,
      "title": "Data Modeling, Normalization & Schema Architecture",
      "summary": "Architect resilient schemas for both OLTP and OLAP: functional dependencies, 1NF through BCNF/5NF, Kimball Star Schemas, SCD Type 2 history, and temporal SQL patterns.",
      "hours": 30,
      "modules": [
        {
          "id": "m07",
          "number": "3.1",
          "legacyNumber": "07",
          "title": "Relational Data Modeling & Normalization (1NF to BCNF/5NF)",
          "summary": "Entity-Relationship modeling, Armstrong's axioms, candidate keys, 1NF atomicity, 2NF/3NF/BCNF normal forms, update anomalies, and strategic denormalization.",
          "units": [
            {
              "slug": "entity-relationship-modeling",
              "title": "Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables",
              "kind": "lesson",
              "archive": {
                "slug": "entity-relationship-modeling",
                "file": "entity-relationship-modeling.md",
                "title": "Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables",
                "displayTitle": "Entity-Relationship Modeling: Cardinality (1:1, 1:N, M:N) & Junction Tables",
                "type": "lesson",
                "tags": [
                  "erd",
                  "data-modeling",
                  "junction-table"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1254,
                "excerpt": "Translating domain entities into physical tables, resolving many-to-many relationships with associative junction tables, and reading Crow's Foot ERDs.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "functional-dependencies-keys",
              "title": "Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure",
              "kind": "lesson",
              "archive": {
                "slug": "functional-dependencies-keys",
                "file": "functional-dependencies-keys.md",
                "title": "Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure",
                "displayTitle": "Functional Dependencies (X → Y), Superkeys, Candidate Keys & Closure",
                "type": "lesson",
                "tags": [
                  "functional-dependency",
                  "candidate-key",
                  "armstrong-axioms"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1277,
                "excerpt": "Formalizing data invariants with functional dependencies, computing attribute closure X+, and proving whether a decomposition is lossless-join.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "first-normal-form-atomicity",
              "title": "First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns",
              "kind": "lesson",
              "archive": {
                "slug": "first-normal-form-atomicity",
                "file": "first-normal-form-atomicity.md",
                "title": "First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns",
                "displayTitle": "First Normal Form (1NF): Atomic Domains & Repeating Group Anti-Patterns",
                "type": "lesson",
                "tags": [
                  "1nf",
                  "normalization",
                  "atomicity"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1300,
                "excerpt": "Why storing comma-separated IDs or numbered columns (tag1, tag2, tag3) breaks indexing, referential integrity, and relational querying.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "second-third-normal-form",
              "title": "Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies",
              "kind": "lesson",
              "archive": {
                "slug": "second-third-normal-form",
                "file": "second-third-normal-form.md",
                "title": "Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies",
                "displayTitle": "Second & Third Normal Form (2NF & 3NF): Eliminating Partial & Transitive Dependencies",
                "type": "lesson",
                "tags": [
                  "2nf",
                  "3nf",
                  "normalization"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1323,
                "excerpt": "Removing partial dependencies on composite keys (2NF) and transitive non-key dependencies (3NF: \"the key, the whole key, and nothing but the key\").",
                "mermaidCount": 1
              }
            },
            {
              "slug": "boyce-codd-fourth-fifth-normal-form",
              "title": "Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF)",
              "kind": "lesson",
              "archive": {
                "slug": "boyce-codd-fourth-fifth-normal-form",
                "file": "boyce-codd-fourth-fifth-normal-form.md",
                "title": "Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF)",
                "displayTitle": "Boyce-Codd Normal Form (BCNF), Multi-Valued (4NF) & Join Dependencies (5NF)",
                "type": "lesson",
                "tags": [
                  "bcnf",
                  "4nf",
                  "5nf"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1346,
                "excerpt": "When 3NF is still vulnerable to overlapping candidate key anomalies (BCNF) and how 4NF eliminates independent multi-valued fact cross-products.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "update-insertion-deletion-anomalies",
              "title": "Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas",
              "kind": "lesson",
              "archive": {
                "slug": "update-insertion-deletion-anomalies",
                "file": "update-insertion-deletion-anomalies.md",
                "title": "Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas",
                "displayTitle": "Visualizing Update, Insertion & Deletion Anomalies in Unnormalized Schemas",
                "type": "lesson",
                "tags": [
                  "anomalies",
                  "data-integrity",
                  "normalization"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1369,
                "excerpt": "Tracing concrete SQL mutations that corrupt customer addresses, prevent inserting catalog items without orders, or erase facts on delete.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "strategic-denormalization-tradeoffs",
              "title": "Strategic Denormalization: Read vs Write Amplification & Cached Counters",
              "kind": "design",
              "archive": {
                "slug": "strategic-denormalization-tradeoffs",
                "file": "strategic-denormalization-tradeoffs.md",
                "title": "Strategic Denormalization: Read vs Write Amplification & Cached Counters",
                "displayTitle": "Strategic Denormalization: Read vs Write Amplification & Cached Counters",
                "type": "design",
                "tags": [
                  "denormalization",
                  "tradeoffs",
                  "materialized-columns"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1392,
                "excerpt": "Knowing when to break strict normalization in high-read OLTP systems using trigger-maintained summary columns, snapshot fields, and read models.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "schema-anti-patterns-eav-god-tables",
              "title": "Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables",
              "kind": "design",
              "archive": {
                "slug": "schema-anti-patterns-eav-god-tables",
                "file": "schema-anti-patterns-eav-god-tables.md",
                "title": "Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables",
                "displayTitle": "Schema Anti-Patterns: Entity-Attribute-Value (EAV), Polymorphic FKs & God Tables",
                "type": "design",
                "tags": [
                  "anti-patterns",
                  "eav",
                  "polymorphic-associations"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1415,
                "excerpt": "Why EAV tables destroy type safety and require 10-way self-joins, why polymorphic foreign keys cannot enforce integrity, and clean relational alternatives.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-shopify-multi-tenant-schema",
              "title": "Production Case Study: Multi-Tenant Schema Architecture at Scale",
              "kind": "case",
              "archive": {
                "slug": "case-shopify-multi-tenant-schema",
                "file": "case-shopify-multi-tenant-schema.md",
                "title": "Production Case Study: Multi-Tenant Schema Architecture at Scale",
                "displayTitle": "Production Case Study: Multi-Tenant Schema Architecture at Scale",
                "type": "case",
                "tags": [
                  "multi-tenancy",
                  "sharding",
                  "row-level-security"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1438,
                "excerpt": "Comparing Pool (shared table + tenant_id), Bridge (schema-per-tenant), and Silo (database-per-tenant) isolation models for B2B SaaS platforms.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-normalized-booking-schema",
              "title": "Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System",
              "kind": "build",
              "archive": {
                "slug": "build-normalized-booking-schema",
                "file": "build-normalized-booking-schema.md",
                "title": "Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System",
                "displayTitle": "Hands-On Build: Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System",
                "type": "build",
                "tags": [
                  "build",
                  "normalization",
                  "bcnf"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1201,
                "excerpt": "Decompose a denormalized, anomaly-ridden booking table into a lossless 3NF/BCNF relational schema and verify zero data loss via join reconstruction.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m08",
          "number": "3.2",
          "legacyNumber": "08",
          "title": "Dimensional Modeling & Analytical Schema Design",
          "summary": "OLTP vs OLAP physics, Kimball Star Schemas (fact grain & dimensions), Snowflake vs One Big Table (OBT), Slowly Changing Dimensions (SCD Type 2), and bitemporal SQL.",
          "units": [
            {
              "slug": "oltp-vs-olap-workload-physics",
              "title": "OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans",
              "kind": "lesson",
              "archive": {
                "slug": "oltp-vs-olap-workload-physics",
                "file": "oltp-vs-olap-workload-physics.md",
                "title": "OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans",
                "displayTitle": "OLTP vs OLAP Workload Physics: Point Lookups vs Billion-Row Scans",
                "type": "lesson",
                "tags": [
                  "oltp",
                  "olap",
                  "workload-physics"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1273,
                "excerpt": "Contrasting high-concurrency transactional point mutations against wide analytical aggregations and why they demand different schema topologies.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "star-schema-facts-dimensions",
              "title": "Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions",
              "kind": "lesson",
              "archive": {
                "slug": "star-schema-facts-dimensions",
                "file": "star-schema-facts-dimensions.md",
                "title": "Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions",
                "displayTitle": "Kimball Star Schema: Fact Table Grain, Additive Measures & Conformed Dimensions",
                "type": "lesson",
                "tags": [
                  "star-schema",
                  "kimball",
                  "fact-tables"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1296,
                "excerpt": "Declaring an unambiguous fact grain, classifying additive, semi-additive (account balances), and non-additive measures, and surrogate dimension keys.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "snowflake-vs-star-vs-obt",
              "title": "Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses",
              "kind": "design",
              "archive": {
                "slug": "snowflake-vs-star-vs-obt",
                "file": "snowflake-vs-star-vs-obt.md",
                "title": "Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses",
                "displayTitle": "Snowflake Schema vs Star Schema vs One Big Table (OBT) in Cloud Warehouses",
                "type": "design",
                "tags": [
                  "snowflake-schema",
                  "obt",
                  "data-warehouse"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1319,
                "excerpt": "Benchmarking join cost vs storage compression across normalized Snowflake dimensions, classic Star schemas, and wide columnar One Big Tables.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "slowly-changing-dimensions-scd",
              "title": "Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6",
              "kind": "lesson",
              "archive": {
                "slug": "slowly-changing-dimensions-scd",
                "file": "slowly-changing-dimensions-scd.md",
                "title": "Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6",
                "displayTitle": "Slowly Changing Dimensions: SCD Type 0, 1, 2 (Effective Dates), 3 & 6",
                "type": "lesson",
                "tags": [
                  "scd-type-2",
                  "dimensional-modeling",
                  "history-tracking"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1342,
                "excerpt": "Preserving point-in-time historical truth when customer tiers or territories change using SCD Type 2 (valid_from, valid_to, is_current) rows.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "bridge-tables-junk-role-dimensions",
              "title": "Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables",
              "kind": "lesson",
              "archive": {
                "slug": "bridge-tables-junk-role-dimensions",
                "file": "bridge-tables-junk-role-dimensions.md",
                "title": "Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables",
                "displayTitle": "Role-Playing Dimensions, Junk Dimensions & Many-to-Many Bridge Tables",
                "type": "lesson",
                "tags": [
                  "role-playing-dimension",
                  "junk-dimension",
                  "bridge-table"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1365,
                "excerpt": "Joining a single date dimension multiple times (Order Date, Ship Date), consolidating low-cardinality flags into Junk Dimensions, and weighting bridge tables.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "temporal-tables-bitemporal-sql",
              "title": "Temporal & Bitemporal SQL: System Time vs Valid Application Time",
              "kind": "lesson",
              "archive": {
                "slug": "temporal-tables-bitemporal-sql",
                "file": "temporal-tables-bitemporal-sql.md",
                "title": "Temporal & Bitemporal SQL: System Time vs Valid Application Time",
                "displayTitle": "Temporal & Bitemporal SQL: System Time vs Valid Application Time",
                "type": "lesson",
                "tags": [
                  "bitemporal",
                  "temporal-tables",
                  "sql-2011"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1388,
                "excerpt": "Tracking both when a fact was true in reality (valid time) and when it was recorded in the database (transaction time) for audit-grade time travel.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "json-semi-structured-hybrid-schemas",
              "title": "Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution",
              "kind": "lesson",
              "archive": {
                "slug": "json-semi-structured-hybrid-schemas",
                "file": "json-semi-structured-hybrid-schemas.md",
                "title": "Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution",
                "displayTitle": "Hybrid Relational + JSONB Schemas, Generated Columns & Schema Evolution",
                "type": "lesson",
                "tags": [
                  "jsonb",
                  "semi-structured",
                  "generated-columns"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1411,
                "excerpt": "Combining strict relational columns for core entities with flexible JSON attributes and indexing hot JSON paths via virtual/stored generated columns.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "idempotency-audit-logs-event-tables",
              "title": "Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox",
              "kind": "design",
              "archive": {
                "slug": "idempotency-audit-logs-event-tables",
                "file": "idempotency-audit-logs-event-tables.md",
                "title": "Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox",
                "displayTitle": "Immutable Ledger Tables, Append-Only Audit Logs & Transactional Outbox",
                "type": "design",
                "tags": [
                  "audit-log",
                  "transactional-outbox",
                  "cdc"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1434,
                "excerpt": "Designing tamper-evident append-only event tables and guaranteeing reliable microservice event publishing via the Transactional Outbox pattern.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-airbnb-minerva-metric-layer",
              "title": "Production Case Study: Designing a Canonical Metric Store at Petabyte Scale",
              "kind": "case",
              "archive": {
                "slug": "case-airbnb-minerva-metric-layer",
                "file": "case-airbnb-minerva-metric-layer.md",
                "title": "Production Case Study: Designing a Canonical Metric Store at Petabyte Scale",
                "displayTitle": "Production Case Study: Designing a Canonical Metric Store at Petabyte Scale",
                "type": "case",
                "tags": [
                  "metric-layer",
                  "star-schema",
                  "analytics-engineering"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1197,
                "excerpt": "How standardized dimensional star schemas and certified metric definitions eliminate conflicting KPI numbers across hundreds of product teams.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-scd-type2-warehouse-pipeline",
              "title": "Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline",
              "kind": "build",
              "archive": {
                "slug": "build-scd-type2-warehouse-pipeline",
                "file": "build-scd-type2-warehouse-pipeline.md",
                "title": "Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline",
                "displayTitle": "Hands-On Build: Star Schema with Automated SCD Type 2 Dimension Pipeline",
                "type": "build",
                "tags": [
                  "build",
                  "star-schema",
                  "scd2"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1220,
                "excerpt": "Build a Kimball star schema and write the idempotent SCD Type 2 merge pipeline that expires old dimension versions and inserts new historical rows.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m09",
          "number": "3.3",
          "legacyNumber": "09",
          "title": "Advanced SQL Patterns, Temporal Queries & Programmability",
          "summary": "Date spines, triangle cohort retention matrices, multi-step conversion funnels, Allen's interval overlap algebra, PIVOT/UNPIVOT, triggers, and SQL injection defense.",
          "units": [
            {
              "slug": "calendar-tables-date-spines",
              "title": "Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets",
              "kind": "lesson",
              "archive": {
                "slug": "calendar-tables-date-spines",
                "file": "calendar-tables-date-spines.md",
                "title": "Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets",
                "displayTitle": "Calendar Tables & Date Spines: Filling Missing Zero-Activity Time Buckets",
                "type": "lesson",
                "tags": [
                  "date-spine",
                  "calendar-table",
                  "time-series"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1292,
                "excerpt": "Using recursive CTEs or generate_series to build continuous date spines so time-series charts never skip days with zero orders.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "cohort-retention-matrix-sql",
              "title": "Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL",
              "kind": "lesson",
              "archive": {
                "slug": "cohort-retention-matrix-sql",
                "file": "cohort-retention-matrix-sql.md",
                "title": "Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL",
                "displayTitle": "Triangle Cohort Retention & Net Dollar Retention (NDR) Matrices in SQL",
                "type": "lesson",
                "tags": [
                  "cohort-analysis",
                  "retention",
                  "ndr"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1315,
                "excerpt": "Grouping users by signup cohort month, calculating active lifecycle offsets (Month 0, Month 1, Month N), and computing Net Dollar Retention.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "funnel-conversion-attribution-sql",
              "title": "Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution",
              "kind": "lesson",
              "archive": {
                "slug": "funnel-conversion-attribution-sql",
                "file": "funnel-conversion-attribution-sql.md",
                "title": "Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution",
                "displayTitle": "Multi-Step Ordered Funnel Conversion & First/Last-Touch Attribution",
                "type": "lesson",
                "tags": [
                  "funnel-analysis",
                  "attribution",
                  "conversion"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1338,
                "excerpt": "Measuring drop-off across strict chronological user funnels (Signup → Connect → Query → Upgrade) and attributing revenue to marketing touches.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "interval-overlap-allen-algebra",
              "title": "Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals",
              "kind": "lesson",
              "archive": {
                "slug": "interval-overlap-allen-algebra",
                "file": "interval-overlap-allen-algebra.md",
                "title": "Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals",
                "displayTitle": "Temporal Interval Overlap (Allen's Algebra) & Packing Contiguous Intervals",
                "type": "lesson",
                "tags": [
                  "interval-overlap",
                  "allens-algebra",
                  "temporal-sql"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1361,
                "excerpt": "Mastering the canonical two-condition overlap predicate (start_a < end_b AND end_a > start_b) to detect double-bookings and merge overlapping windows.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "pivoting-unpivoting-cross-tabs",
              "title": "Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns",
              "kind": "lesson",
              "archive": {
                "slug": "pivoting-unpivoting-cross-tabs",
                "file": "pivoting-unpivoting-cross-tabs.md",
                "title": "Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns",
                "displayTitle": "Rows to Columns & Back: Cross-Tab Pivoting and Unpivoting Patterns",
                "type": "lesson",
                "tags": [
                  "pivot",
                  "unpivot",
                  "cross-tab"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1384,
                "excerpt": "Transforming normalized tall tables into wide report matrices and unpivoting wide spreadsheet imports using UNION ALL or LATERAL values.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "triggers-stored-procedures-udfs",
              "title": "Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead",
              "kind": "lesson",
              "archive": {
                "slug": "triggers-stored-procedures-udfs",
                "file": "triggers-stored-procedures-udfs.md",
                "title": "Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead",
                "displayTitle": "Database Programmability: Triggers (OLD/NEW), Stored Procedures & UDF Overhead",
                "type": "lesson",
                "tags": [
                  "triggers",
                  "stored-procedures",
                  "udf"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1407,
                "excerpt": "Writing BEFORE/AFTER row triggers for audit logging and invariant enforcement, while understanding why non-inlined scalar UDFs cripple query parallelism.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "materialized-views-incremental-refresh",
              "title": "Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM)",
              "kind": "design",
              "archive": {
                "slug": "materialized-views-incremental-refresh",
                "file": "materialized-views-incremental-refresh.md",
                "title": "Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM)",
                "displayTitle": "Materialized Views, Refresh Strategies & Incremental View Maintenance (IVM)",
                "type": "design",
                "tags": [
                  "materialized-view",
                  "ivm",
                  "precomputation"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1430,
                "excerpt": "Precomputing expensive multi-join aggregations on disk, REFRESH MATERIALIZED VIEW CONCURRENTLY, and delta-based incremental maintenance.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "sql-injection-parameterized-security",
              "title": "SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS)",
              "kind": "lesson",
              "archive": {
                "slug": "sql-injection-parameterized-security",
                "file": "sql-injection-parameterized-security.md",
                "title": "SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS)",
                "displayTitle": "SQL Injection AST Mechanics, Prepared Statements & Row-Level Security (RLS)",
                "type": "lesson",
                "tags": [
                  "sql-injection",
                  "prepared-statements",
                  "rls"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1193,
                "excerpt": "How string concatenation allows untrusted input to rewrite the SQL AST, why parameterized bind variables prevent injection 100%, and Postgres RLS policies.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-double-booking-hotel-inventory",
              "title": "Production Case Study: Preventing Concurrent Calendar Double-Bookings",
              "kind": "case",
              "archive": {
                "slug": "case-double-booking-hotel-inventory",
                "file": "case-double-booking-hotel-inventory.md",
                "title": "Production Case Study: Preventing Concurrent Calendar Double-Bookings",
                "displayTitle": "Production Case Study: Preventing Concurrent Calendar Double-Bookings",
                "type": "case",
                "tags": [
                  "double-booking",
                  "exclusion-constraints",
                  "concurrency"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1216,
                "excerpt": "Why application-level SELECT-then-INSERT checks fail under concurrency and how range exclusion constraints and interval locks guarantee zero overlap.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-saas-cohort-funnel-workbench",
              "title": "Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)",
              "kind": "build",
              "archive": {
                "slug": "build-saas-cohort-funnel-workbench",
                "file": "build-saas-cohort-funnel-workbench.md",
                "title": "Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)",
                "displayTitle": "Hands-On Build: Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)",
                "type": "build",
                "tags": [
                  "build",
                  "cohort-retention",
                  "saas-analytics"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1239,
                "excerpt": "Build an end-to-end SaaS analytics SQL suite calculating MRR expansion/churn movements, cohort retention triangles, and step-by-step funnel conversion.",
                "mermaidCount": 1
              }
            }
          ]
        }
      ]
    },
    {
      "id": "track-4",
      "number": 4,
      "title": "Indexing, Query Planner & Execution Engine",
      "summary": "Look inside the database engine: master B+Tree page splits, composite leftmost-prefix rules, covering index-only scans, cost-based query optimization, EXPLAIN ANALYZE, and physical join algorithms.",
      "hours": 34,
      "modules": [
        {
          "id": "m10",
          "number": "4.1",
          "legacyNumber": "10",
          "title": "B+Tree Indexes & Access Path Mechanics",
          "summary": "I/O cost models, B+Tree internal routing vs doubly-linked leaf pages, clustered vs heap+ctid tables, composite index prefix rules, covering indexes, and GIN/GiST/BRIN.",
          "units": [
            {
              "slug": "why-indexes-work-io-cost-model",
              "title": "Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics",
              "kind": "lesson",
              "archive": {
                "slug": "why-indexes-work-io-cost-model",
                "file": "why-indexes-work-io-cost-model.md",
                "title": "Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics",
                "displayTitle": "Why Indexes Work: Full Table Scan O(N) vs Index Seek O(log_B N) I/O Physics",
                "type": "lesson",
                "tags": [
                  "indexing",
                  "io-cost",
                  "page-reads"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1291,
                "excerpt": "Quantifying 8KB page reads: why scanning 1,000,000 rows touches 12,500 heap pages while a height-3 B+Tree seek reads just 4 pages.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "btree-bplustree-internal-anatomy",
              "title": "B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links",
              "kind": "lesson",
              "archive": {
                "slug": "btree-bplustree-internal-anatomy",
                "file": "btree-bplustree-internal-anatomy.md",
                "title": "B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links",
                "displayTitle": "B-Tree vs B+Tree Internal Anatomy: High Fanout, Routing Keys & Leaf Links",
                "type": "lesson",
                "tags": [
                  "bplustree",
                  "btree",
                  "leaf-pages"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1314,
                "excerpt": "Why databases use B+Trees instead of binary trees or B-Trees: packing ~500 separator keys per 8KB internal page and linking leaf pages for range scans.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "clustered-vs-secondary-indexes",
              "title": "Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres)",
              "kind": "lesson",
              "archive": {
                "slug": "clustered-vs-secondary-indexes",
                "file": "clustered-vs-secondary-indexes.md",
                "title": "Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres)",
                "displayTitle": "Clustered Indexes (InnoDB / WITHOUT ROWID) vs Heap + Secondary Index (Postgres)",
                "type": "lesson",
                "tags": [
                  "clustered-index",
                  "heap-table",
                  "ctid"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1337,
                "excerpt": "Comparing MySQL InnoDB (where the primary key B+Tree leaf IS the table row) against PostgreSQL heap storage (where secondary indexes point to ctid).",
                "mermaidCount": 1
              }
            },
            {
              "slug": "composite-indexes-leftmost-prefix",
              "title": "Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range",
              "kind": "lesson",
              "archive": {
                "slug": "composite-indexes-leftmost-prefix",
                "file": "composite-indexes-leftmost-prefix.md",
                "title": "Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range",
                "displayTitle": "Composite Indexes (a, b, c): Leftmost Prefix Rule & Equality-Before-Range",
                "type": "lesson",
                "tags": [
                  "composite-index",
                  "leftmost-prefix",
                  "range-scan"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1360,
                "excerpt": "How lexicographical tuple ordering inside a multi-column B+Tree dictates why equality predicates must precede range predicates for full index utilization.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "covering-indexes-index-only-scans",
              "title": "Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map)",
              "kind": "lesson",
              "archive": {
                "slug": "covering-indexes-index-only-scans",
                "file": "covering-indexes-index-only-scans.md",
                "title": "Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map)",
                "displayTitle": "Covering Indexes, INCLUDE Columns & Index-Only Scans (Visibility Map)",
                "type": "lesson",
                "tags": [
                  "covering-index",
                  "index-only-scan",
                  "include-clause"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1383,
                "excerpt": "Eliminating random heap table fetches completely by including payload columns in the index leaf and consulting PostgreSQL's Visibility Map.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "partial-filtered-expression-indexes",
              "title": "Partial (Filtered) Indexes & Functional / Expression Indexes",
              "kind": "lesson",
              "archive": {
                "slug": "partial-filtered-expression-indexes",
                "file": "partial-filtered-expression-indexes.md",
                "title": "Partial (Filtered) Indexes & Functional / Expression Indexes",
                "displayTitle": "Partial (Filtered) Indexes & Functional / Expression Indexes",
                "type": "lesson",
                "tags": [
                  "partial-index",
                  "expression-index",
                  "index-size"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1406,
                "excerpt": "Shrinking index footprint by 90% with WHERE predicates (e.g. WHERE status = 'pending') and indexing computed expressions like LOWER(email).",
                "mermaidCount": 1
              }
            },
            {
              "slug": "hash-gin-gist-brin-bloom-indexes",
              "title": "Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap",
              "kind": "lesson",
              "archive": {
                "slug": "hash-gin-gist-brin-bloom-indexes",
                "file": "hash-gin-gist-brin-bloom-indexes.md",
                "title": "Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap",
                "displayTitle": "Specialized Indexes: Hash, GIN (Inverted), GiST, BRIN (Block Range) & Bitmap",
                "type": "lesson",
                "tags": [
                  "gin-index",
                  "brin-index",
                  "gist"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1429,
                "excerpt": "Choosing the right access method beyond B+Trees: inverted posting lists (GIN) for JSONB/FTS, Tiny block summaries (BRIN) for time-series, and R-Trees (GiST).",
                "mermaidCount": 1
              }
            },
            {
              "slug": "index-bloat-write-amplification-traps",
              "title": "When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds",
              "kind": "design",
              "archive": {
                "slug": "index-bloat-write-amplification-traps",
                "file": "index-bloat-write-amplification-traps.md",
                "title": "When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds",
                "displayTitle": "When Indexes Hurt: Write Amplification, Page Splits & Selectivity Thresholds",
                "type": "design",
                "tags": [
                  "write-amplification",
                  "index-bloat",
                  "selectivity"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1192,
                "excerpt": "Why every additional secondary index slows down INSERT/UPDATE/DELETE, how 50/50 leaf page splits fragment space, and when a Seq Scan beats an Index Scan.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-slack-composite-index-incident",
              "title": "Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4%",
              "kind": "case",
              "archive": {
                "slug": "case-slack-composite-index-incident",
                "file": "case-slack-composite-index-incident.md",
                "title": "Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4%",
                "displayTitle": "Production Case Study: How Reordering Two Index Columns Cut Latency by 99.4%",
                "type": "case",
                "tags": [
                  "composite-index",
                  "query-tuning",
                  "production-incident"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1215,
                "excerpt": "Analyzing a production slow-query incident where an index on (created_at, channel_id) scanned 400,000 index entries instead of 15 with (channel_id, created_at).",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-btree-index-advisor",
              "title": "Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor",
              "kind": "build",
              "archive": {
                "slug": "build-btree-index-advisor",
                "file": "build-btree-index-advisor.md",
                "title": "Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor",
                "displayTitle": "Hands-On Build: B+Tree Page Simulator & Automated Workload Index Advisor",
                "type": "build",
                "tags": [
                  "build",
                  "bplustree",
                  "index-advisor"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1238,
                "excerpt": "Build an interactive index advisor that inspects query predicates, ORDER BY clauses, and cardinality to recommend optimal composite covering indexes.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m11",
          "number": "4.2",
          "legacyNumber": "11",
          "title": "The Query Planner, Cost-Based Optimizer & EXPLAIN",
          "summary": "Life of a query (Parser → Binder → Optimizer → Executor), reading EXPLAIN ANALYZE, table statistics (MCV, NDV, histograms), SARGability, and external disk sorts.",
          "units": [
            {
              "slug": "life-of-a-sql-query-pipeline",
              "title": "Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor",
              "kind": "lesson",
              "archive": {
                "slug": "life-of-a-sql-query-pipeline",
                "file": "life-of-a-sql-query-pipeline.md",
                "title": "Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor",
                "displayTitle": "Life of a SQL Query: Parser, Binder, Logical Plan, Cost Optimizer & Executor",
                "type": "lesson",
                "tags": [
                  "query-pipeline",
                  "parser",
                  "cost-based-optimizer"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1310,
                "excerpt": "Tracing a SQL string from lexical tokenization and AST generation to catalog binding, relational algebra rewrites, cost estimation, and physical execution.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "reading-explain-and-explain-analyze",
              "title": "Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers",
              "kind": "lesson",
              "archive": {
                "slug": "reading-explain-and-explain-analyze",
                "file": "reading-explain-and-explain-analyze.md",
                "title": "Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers",
                "displayTitle": "Mastering EXPLAIN & EXPLAIN ANALYZE: Cost Units, Actual Rows, Loops & Buffers",
                "type": "lesson",
                "tags": [
                  "explain-analyze",
                  "query-plan",
                  "buffers"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1333,
                "excerpt": "Decoding bottom-up execution trees: startup cost vs total cost, estimated vs actual row counts, loop multipliers, and shared buffer hits vs reads.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "table-statistics-histograms-cardinality",
              "title": "Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms",
              "kind": "lesson",
              "archive": {
                "slug": "table-statistics-histograms-cardinality",
                "file": "table-statistics-histograms-cardinality.md",
                "title": "Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms",
                "displayTitle": "Table Statistics (ANALYZE): Null Fraction, NDV, Most Common Values & Histograms",
                "type": "lesson",
                "tags": [
                  "statistics",
                  "histograms",
                  "cardinality"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1356,
                "excerpt": "How ANALYZE samples pages to populate pg_statistic / sqlite_stat1 with Most Common Values (MCV) lists and equi-depth histogram bounds.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "selectivity-estimation-correlated-columns",
              "title": "Selectivity Math, Independence Assumption Failures & Extended Statistics",
              "kind": "lesson",
              "archive": {
                "slug": "selectivity-estimation-correlated-columns",
                "file": "selectivity-estimation-correlated-columns.md",
                "title": "Selectivity Math, Independence Assumption Failures & Extended Statistics",
                "displayTitle": "Selectivity Math, Independence Assumption Failures & Extended Statistics",
                "type": "lesson",
                "tags": [
                  "selectivity",
                  "correlated-columns",
                  "extended-statistics"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1379,
                "excerpt": "Calculating P(A AND B) = P(A)×P(B), why correlated columns (city and zip_code) fool the planner by 100x, and fixing it with CREATE STATISTICS.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "scan-operators-seq-index-bitmap",
              "title": "Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan",
              "kind": "lesson",
              "archive": {
                "slug": "scan-operators-seq-index-bitmap",
                "file": "scan-operators-seq-index-bitmap.md",
                "title": "Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan",
                "displayTitle": "Physical Scan Operators: Seq Scan, Index Scan, Index-Only & Bitmap Heap Scan",
                "type": "lesson",
                "tags": [
                  "seq-scan",
                  "index-scan",
                  "bitmap-scan"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1402,
                "excerpt": "How Bitmap Index Scan + Bitmap Heap Scan bridges the gap between single-row Index Scans and full Sequential Scans by sorting page IDs first.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "sargability-functions-on-columns",
              "title": "SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes",
              "kind": "design",
              "archive": {
                "slug": "sargability-functions-on-columns",
                "file": "sargability-functions-on-columns.md",
                "title": "SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes",
                "displayTitle": "SARGability: Why Functions, Arithmetic & Implicit Casts on Columns Defeat Indexes",
                "type": "design",
                "tags": [
                  "sargability",
                  "query-rewriting",
                  "index-seek"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1425,
                "excerpt": "Rewriting non-SARGable anti-patterns (WHERE strftime('%Y', created_at) = '2025' or WHERE amount / 100 > 50) into range-seekable predicates.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "or-conditions-in-lists-union-rewrites",
              "title": "Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites",
              "kind": "lesson",
              "archive": {
                "slug": "or-conditions-in-lists-union-rewrites",
                "file": "or-conditions-in-lists-union-rewrites.md",
                "title": "Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites",
                "displayTitle": "Optimizing OR Predicates, Large IN Lists, BitmapOr & UNION ALL Rewrites",
                "type": "lesson",
                "tags": [
                  "or-optimization",
                  "bitmap-or",
                  "union-all"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1188,
                "excerpt": "Why WHERE a = 1 OR b = 2 often forces a full table scan and how optimizers or manual UNION ALL rewrites combine separate index paths.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "sorting-spill-to-disk-top-n-heapsort",
              "title": "Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills",
              "kind": "lesson",
              "archive": {
                "slug": "sorting-spill-to-disk-top-n-heapsort",
                "file": "sorting-spill-to-disk-top-n-heapsort.md",
                "title": "Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills",
                "displayTitle": "Physical Sorting: QuickSort, Bounded Top-N Heap Sort, Incremental Sort & Disk Spills",
                "type": "lesson",
                "tags": [
                  "sorting",
                  "top-n-heapsort",
                  "external-merge-sort"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1211,
                "excerpt": "Why ORDER BY ... LIMIT 10 uses an O(N log K) bounded heap in memory while unbounded sorts exceeding work_mem spill to multi-pass external merge files.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-stale-statistics-plan-flip",
              "title": "Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics",
              "kind": "case",
              "archive": {
                "slug": "case-stale-statistics-plan-flip",
                "file": "case-stale-statistics-plan-flip.md",
                "title": "Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics",
                "displayTitle": "Production Case Study: Anatomy of a Query Plan Flip from Stale Statistics",
                "type": "case",
                "tags": [
                  "plan-flip",
                  "stale-statistics",
                  "analyze"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1234,
                "excerpt": "How a bulk ingestion of 5 million rows before autovacuum ANALYZE caused the planner to pick a Nested Loop Join instead of a Hash Join, stalling CPU at 100%.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-visual-explain-plan-analyzer",
              "title": "Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter",
              "kind": "build",
              "archive": {
                "slug": "build-visual-explain-plan-analyzer",
                "file": "build-visual-explain-plan-analyzer.md",
                "title": "Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter",
                "displayTitle": "Hands-On Build: Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter",
                "type": "build",
                "tags": [
                  "build",
                  "explain-plan",
                  "query-tuning"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1257,
                "excerpt": "Build a diagnostic engine that parses EXPLAIN QUERY PLAN outputs, detects full table scans and temp B-Tree sorts, and verifies SARGable query rewrites.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m12",
          "number": "4.3",
          "legacyNumber": "12",
          "title": "Physical Join Algorithms & Execution Pipelines",
          "summary": "Nested Loop Join (Naive vs Indexed), In-Memory & Grace Hash Join, Sort-Merge Join, Selinger dynamic programming join ordering, predicate pushdown, and Volcano vs Vectorized execution.",
          "units": [
            {
              "slug": "nested-loop-join-indexed-nlj",
              "title": "Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ",
              "kind": "lesson",
              "archive": {
                "slug": "nested-loop-join-indexed-nlj",
                "file": "nested-loop-join-indexed-nlj.md",
                "title": "Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ",
                "displayTitle": "Nested Loop Join: Naive O(N×M) vs Block Nested Loop vs Indexed NLJ",
                "type": "lesson",
                "tags": [
                  "nested-loop-join",
                  "inlj",
                  "join-algorithms"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1329,
                "excerpt": "How Nested Loop Join streams outer tuples and why an index on the inner join key turns O(N×M) into fast O(N log B) point lookups for small outer sets.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "hash-join-build-probe-grace",
              "title": "Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills",
              "kind": "lesson",
              "archive": {
                "slug": "hash-join-build-probe-grace",
                "file": "hash-join-build-probe-grace.md",
                "title": "Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills",
                "displayTitle": "Hash Join Internals: In-Memory Build/Probe Phases, Skew & Grace Hash Disk Spills",
                "type": "lesson",
                "tags": [
                  "hash-join",
                  "grace-hash-join",
                  "work-mem"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1352,
                "excerpt": "Building an in-memory hash table on the smaller relation, probing with the larger relation in O(N+M), and partitioning into disk batches when memory overflows.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "sort-merge-join-zipper-mechanics",
              "title": "Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding",
              "kind": "lesson",
              "archive": {
                "slug": "sort-merge-join-zipper-mechanics",
                "file": "sort-merge-join-zipper-mechanics.md",
                "title": "Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding",
                "displayTitle": "Sort-Merge Join: Dual Sorted Streams, Zipper Merge & Duplicate Rewinding",
                "type": "lesson",
                "tags": [
                  "sort-merge-join",
                  "merge-join",
                  "sorted-streams"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1375,
                "excerpt": "Advancing two interleaved cursors in O(N+M) when inputs arrive pre-sorted from B+Tree indexes, and handling many-to-many duplicate key runs.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "join-order-search-dynamic-programming",
              "title": "Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees",
              "kind": "lesson",
              "archive": {
                "slug": "join-order-search-dynamic-programming",
                "file": "join-order-search-dynamic-programming.md",
                "title": "Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees",
                "displayTitle": "Join Ordering Search Space (N!): Selinger Dynamic Programming & Left-Deep vs Bushy Trees",
                "type": "lesson",
                "tags": [
                  "join-ordering",
                  "selinger",
                  "dynamic-programming"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1398,
                "excerpt": "Why joining 10 tables has 3.6 million plan permutations and how Selinger bottom-up dynamic programming prunes dominated subplans.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "predicate-pushdown-projection-pruning",
              "title": "Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination",
              "kind": "lesson",
              "archive": {
                "slug": "predicate-pushdown-projection-pruning",
                "file": "predicate-pushdown-projection-pruning.md",
                "title": "Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination",
                "displayTitle": "Logical Plan Rewrites: Predicate Pushdown, Projection Pruning & Join Elimination",
                "type": "lesson",
                "tags": [
                  "predicate-pushdown",
                  "projection-pruning",
                  "query-rewrites"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1421,
                "excerpt": "Pushing WHERE filters below joins and views to shrink intermediate tuple counts as early as possible, and eliminating redundant foreign-key joins.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "subquery-unnesting-semi-anti-physical",
              "title": "Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators",
              "kind": "lesson",
              "archive": {
                "slug": "subquery-unnesting-semi-anti-physical",
                "file": "subquery-unnesting-semi-anti-physical.md",
                "title": "Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators",
                "displayTitle": "Subquery Unnesting: Physical Hash Semi-Join & Merge Anti-Join Operators",
                "type": "lesson",
                "tags": [
                  "subquery-unnesting",
                  "hash-semi-join",
                  "anti-join"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1184,
                "excerpt": "How the query optimizer transforms declarative EXISTS and NOT EXISTS subqueries into physical Hash Semi-Join and Anti-Join execution nodes.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "execution-models-volcano-vectorized",
              "title": "Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT",
              "kind": "design",
              "archive": {
                "slug": "execution-models-volcano-vectorized",
                "file": "execution-models-volcano-vectorized.md",
                "title": "Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT",
                "displayTitle": "Execution Models: Volcano Iterator (Next) vs Vectorized Batches vs LLVM JIT",
                "type": "design",
                "tags": [
                  "volcano-model",
                  "vectorized-execution",
                  "jit"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1207,
                "excerpt": "Comparing classic pull-based Volcano tuple-at-a-time virtual calls against cache-resident 1024-tuple column vectors and LLVM JIT expression compilation.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "parallel-query-execution-workers",
              "title": "Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes",
              "kind": "lesson",
              "archive": {
                "slug": "parallel-query-execution-workers",
                "file": "parallel-query-execution-workers.md",
                "title": "Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes",
                "displayTitle": "Parallel Query Execution: Parallel Seq Scan, Parallel Hash Join & Gather Nodes",
                "type": "lesson",
                "tags": [
                  "parallel-query",
                  "parallel-hash-join",
                  "workers"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1230,
                "excerpt": "Coordinating multiple background worker processes to scan shared heap blocks concurrently and build shared-memory hash tables.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-hash-join-oom-work-mem-spill",
              "title": "Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills",
              "kind": "case",
              "archive": {
                "slug": "case-hash-join-oom-work-mem-spill",
                "file": "case-hash-join-oom-work-mem-spill.md",
                "title": "Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills",
                "displayTitle": "Production Case Study: Diagnosing Multi-Gigabyte Hash Join Temp File Spills",
                "type": "case",
                "tags": [
                  "work-mem",
                  "hash-join-spill",
                  "temp-files"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1253,
                "excerpt": "Investigating a slow reporting query that spilled 18 GB of temporary hash batch files to disk due to underestimated cardinality and low work_mem.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-physical-join-execution-engine",
              "title": "Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join",
              "kind": "build",
              "archive": {
                "slug": "build-physical-join-execution-engine",
                "file": "build-physical-join-execution-engine.md",
                "title": "Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join",
                "displayTitle": "Hands-On Build: Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join",
                "type": "build",
                "tags": [
                  "build",
                  "join-algorithms",
                  "hash-join"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1276,
                "excerpt": "Implement physical Nested Loop, Hash Join, and Sort-Merge Join operators and verify their tuple comparisons and memory budgets across skewed datasets.",
                "mermaidCount": 1
              }
            }
          ]
        }
      ]
    },
    {
      "id": "track-5",
      "number": 5,
      "title": "Transactions, Concurrency Control, MVCC & Storage Internals",
      "summary": "Master transactional correctness and storage physics: ACID guarantees, isolation anomalies (Dirty Read to Write Skew), MVCC tuple visibility, row/gap locking, 8KB slotted pages, WAL, ARIES crash recovery, and LSM-Trees.",
      "hours": 34,
      "modules": [
        {
          "id": "m13",
          "number": "5.1",
          "legacyNumber": "13",
          "title": "ACID Transactions, Concurrency Anomalies & Isolation Levels",
          "summary": "ACID properties under the hood, transaction lifecycles, read/write concurrency anomalies (Dirty Read, Non-Repeatable Read, Phantom, Lost Update, Write Skew), and Snapshot vs Serializable isolation.",
          "units": [
            {
              "slug": "acid-properties-under-the-hood",
              "title": "ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL)",
              "kind": "lesson",
              "archive": {
                "slug": "acid-properties-under-the-hood",
                "file": "acid-properties-under-the-hood.md",
                "title": "ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL)",
                "displayTitle": "ACID Under the Hood: Atomicity (Undo), Consistency, Isolation & Durability (WAL)",
                "type": "lesson",
                "tags": [
                  "acid",
                  "transactions",
                  "wal"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1328,
                "excerpt": "Moving beyond textbook acronyms: how undo logs/MVCC implement Atomicity, concurrency protocols enforce Isolation, and WAL fsync guarantees Durability.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "transaction-lifecycle-savepoints",
              "title": "Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards",
              "kind": "lesson",
              "archive": {
                "slug": "transaction-lifecycle-savepoints",
                "file": "transaction-lifecycle-savepoints.md",
                "title": "Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards",
                "displayTitle": "Transaction Lifecycle: BEGIN, COMMIT, ROLLBACK, SAVEPOINT & Autocommit Hazards",
                "type": "lesson",
                "tags": [
                  "begin-commit",
                  "savepoint",
                  "rollback"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1351,
                "excerpt": "Managing transaction boundaries, partial rollbacks via nested SAVEPOINTs, and why long-running idle-in-transaction sessions poison database health.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "read-phenomena-dirty-nonrepeatable-phantom",
              "title": "Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized",
              "kind": "lesson",
              "archive": {
                "slug": "read-phenomena-dirty-nonrepeatable-phantom",
                "file": "read-phenomena-dirty-nonrepeatable-phantom.md",
                "title": "Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized",
                "displayTitle": "Read Anomalies: Dirty Reads, Non-Repeatable Reads & Phantom Reads Visualized",
                "type": "lesson",
                "tags": [
                  "dirty-read",
                  "non-repeatable-read",
                  "phantom-read"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1374,
                "excerpt": "Stepping through dual-session timelines (T1 & T2) to witness uncommitted reads, mid-transaction value changes, and newly appearing phantom tuples.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "write-anomalies-lost-update-write-skew",
              "title": "Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew",
              "kind": "lesson",
              "archive": {
                "slug": "write-anomalies-lost-update-write-skew",
                "file": "write-anomalies-lost-update-write-skew.md",
                "title": "Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew",
                "displayTitle": "Write Anomalies: Dirty Writes, Lost Updates, Read Skew & Write Skew",
                "type": "lesson",
                "tags": [
                  "lost-update",
                  "write-skew",
                  "concurrency-anomalies"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1397,
                "excerpt": "Why preventing standard SQL-92 read phenomena is not enough: how concurrent read-modify-write cycles lose updates and how Write Skew breaks multi-row invariants.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "read-uncommitted-read-committed",
              "title": "READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice",
              "kind": "lesson",
              "archive": {
                "slug": "read-uncommitted-read-committed",
                "file": "read-uncommitted-read-committed.md",
                "title": "READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice",
                "displayTitle": "READ UNCOMMITTED & READ COMMITTED: Statement-Level Snapshots in Practice",
                "type": "lesson",
                "tags": [
                  "read-committed",
                  "isolation-levels",
                  "snapshots"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1420,
                "excerpt": "Why PostgreSQL treats READ UNCOMMITTED as READ COMMITTED, and how taking a fresh snapshot per statement allows non-repeatable reads and read skew.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "repeatable-read-snapshot-isolation",
              "title": "REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew",
              "kind": "lesson",
              "archive": {
                "slug": "repeatable-read-snapshot-isolation",
                "file": "repeatable-read-snapshot-isolation.md",
                "title": "REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew",
                "displayTitle": "REPEATABLE READ & Snapshot Isolation (SI): First-Committer-Wins & Write Skew",
                "type": "lesson",
                "tags": [
                  "repeatable-read",
                  "snapshot-isolation",
                  "first-committer-wins"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1183,
                "excerpt": "How transaction-start snapshots guarantee repeatable reads and automatically abort concurrent Lost Updates while still permitting Write Skew.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "serializable-2pl-vs-ssi",
              "title": "True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI)",
              "kind": "design",
              "archive": {
                "slug": "serializable-2pl-vs-ssi",
                "file": "serializable-2pl-vs-ssi.md",
                "title": "True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI)",
                "displayTitle": "True Serializability: Strict Two-Phase Locking (2PL) vs Serializable Snapshot Isolation (SSI)",
                "type": "design",
                "tags": [
                  "serializable",
                  "2pl",
                  "ssi"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1206,
                "excerpt": "Comparing pessimistic Strict 2PL (shared/exclusive read-write locks) against PostgreSQL's lock-free SSI rw-antidependency conflict graph detection.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "optimistic-vs-pessimistic-concurrency",
              "title": "Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE",
              "kind": "design",
              "archive": {
                "slug": "optimistic-vs-pessimistic-concurrency",
                "file": "optimistic-vs-pessimistic-concurrency.md",
                "title": "Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE",
                "displayTitle": "Optimistic Concurrency (Compare-and-Swap Version) vs Pessimistic SELECT FOR UPDATE",
                "type": "design",
                "tags": [
                  "optimistic-locking",
                  "pessimistic-locking",
                  "for-update"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1229,
                "excerpt": "Choosing between explicit row locks (SELECT ... FOR UPDATE), atomic SQL increments, and optimistic version columns (WHERE version = expected).",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-fintech-double-spend-race-condition",
              "title": "Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend",
              "kind": "case",
              "archive": {
                "slug": "case-fintech-double-spend-race-condition",
                "file": "case-fintech-double-spend-race-condition.md",
                "title": "Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend",
                "displayTitle": "Production Case Study: Exploiting & Fixing a Concurrent Balance Double-Spend",
                "type": "case",
                "tags": [
                  "double-spend",
                  "race-condition",
                  "fintech"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1252,
                "excerpt": "Reproducing a classic wallet withdrawal race condition under READ COMMITTED where two concurrent requests withdraw $100 from a $100 balance.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-transaction-anomaly-simulator",
              "title": "Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier",
              "kind": "build",
              "archive": {
                "slug": "build-transaction-anomaly-simulator",
                "file": "build-transaction-anomaly-simulator.md",
                "title": "Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier",
                "displayTitle": "Hands-On Build: Dual-Session Concurrency Anomaly & Isolation Verifier",
                "type": "build",
                "tags": [
                  "build",
                  "isolation-levels",
                  "concurrency"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1275,
                "excerpt": "Build a transaction schedule analyzer that simulates interleaved T1/T2 read-write operations and detects Dirty Reads, Lost Updates, and Write Skew.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m14",
          "number": "5.2",
          "legacyNumber": "14",
          "title": "Locking, MVCC Internals & Vacuuming",
          "summary": "Multi-Version Concurrency Control (MVCC), PostgreSQL tuple headers (xmin, xmax, ctid) vs InnoDB undo logs, transaction snapshots, row/table/gap locks, deadlocks, and VACUUM / XID wraparound.",
          "units": [
            {
              "slug": "multi-version-concurrency-control-mvcc",
              "title": "MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers",
              "kind": "lesson",
              "archive": {
                "slug": "multi-version-concurrency-control-mvcc",
                "file": "multi-version-concurrency-control-mvcc.md",
                "title": "MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers",
                "displayTitle": "MVCC Architecture: Why Readers Never Block Writers and Writers Never Block Readers",
                "type": "lesson",
                "tags": [
                  "mvcc",
                  "tuple-versioning",
                  "concurrency"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1347,
                "excerpt": "Comparing append-version heap MVCC (PostgreSQL) against in-place clustered update + rollback segment undo logs (MySQL InnoDB & Oracle).",
                "mermaidCount": 1
              }
            },
            {
              "slug": "tuple-headers-xmin-xmax-visibility",
              "title": "Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits",
              "kind": "lesson",
              "archive": {
                "slug": "tuple-headers-xmin-xmax-visibility",
                "file": "tuple-headers-xmin-xmax-visibility.md",
                "title": "Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits",
                "displayTitle": "Tuple Headers Under the Microscope: xmin, xmax, ctid & Infomask Hint Bits",
                "type": "lesson",
                "tags": [
                  "xmin-xmax",
                  "ctid",
                  "tuple-header"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1370,
                "excerpt": "Inspecting the 23-byte PostgreSQL HeapTupleHeaderData structure: how INSERT sets xmin, DELETE sets xmax, and UPDATE writes a brand-new tuple version.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "transaction-snapshots-visibility-rules",
              "title": "Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution",
              "kind": "lesson",
              "archive": {
                "slug": "transaction-snapshots-visibility-rules",
                "file": "transaction-snapshots-visibility-rules.md",
                "title": "Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution",
                "displayTitle": "Transaction Snapshots (xmin:xmax:xip_list) & Tuple Visibility Resolution",
                "type": "lesson",
                "tags": [
                  "transaction-snapshot",
                  "visibility-rules",
                  "mvcc"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1393,
                "excerpt": "Evaluating the exact visibility algorithm that decides whether tuple version V is visible to transaction T based on committed status and active XID list.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "row-level-locks-for-update-skip-locked",
              "title": "Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED",
              "kind": "lesson",
              "archive": {
                "slug": "row-level-locks-for-update-skip-locked",
                "file": "row-level-locks-for-update-skip-locked.md",
                "title": "Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED",
                "displayTitle": "Row-Level Locks: FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, NOWAIT & SKIP LOCKED",
                "type": "lesson",
                "tags": [
                  "row-locks",
                  "for-update",
                  "skip-locked"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1416,
                "excerpt": "Why FOR NO KEY UPDATE avoids blocking child foreign-key inserts, and how FOR UPDATE SKIP LOCKED powers lock-free concurrent worker queues.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "table-locks-intention-locks-ddl-hazards",
              "title": "Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic",
              "kind": "lesson",
              "archive": {
                "slug": "table-locks-intention-locks-ddl-hazards",
                "file": "table-locks-intention-locks-ddl-hazards.md",
                "title": "Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic",
                "displayTitle": "Table Lock Hierarchy, Intention Locks & Why ALTER TABLE Stalls Traffic",
                "type": "lesson",
                "tags": [
                  "table-locks",
                  "ddl-locks",
                  "lock-queues"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1439,
                "excerpt": "How AccessExclusive DDL locks queue behind one long-running SELECT and then block every subsequent incoming read and write across the entire table.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "gap-locks-next-key-locks-innodb",
              "title": "Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks",
              "kind": "lesson",
              "archive": {
                "slug": "gap-locks-next-key-locks-innodb",
                "file": "gap-locks-next-key-locks-innodb.md",
                "title": "Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks",
                "displayTitle": "Preventing Phantoms with Locks: Record Locks, Gap Locks & Next-Key Locks",
                "type": "lesson",
                "tags": [
                  "gap-locks",
                  "next-key-locks",
                  "innodb"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1202,
                "excerpt": "How InnoDB locks the open key intervals between existing B+Tree index records so concurrent transactions cannot insert phantom rows into a range.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "deadlocks-wait-for-graphs-detection",
              "title": "Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection",
              "kind": "lesson",
              "archive": {
                "slug": "deadlocks-wait-for-graphs-detection",
                "file": "deadlocks-wait-for-graphs-detection.md",
                "title": "Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection",
                "displayTitle": "Deadlocks: Wait-For Graph Cycles, Lock Ordering & Deadlock Detection",
                "type": "lesson",
                "tags": [
                  "deadlocks",
                  "wait-for-graph",
                  "lock-ordering"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1225,
                "excerpt": "Tracing how T1 locking row A→B and T2 locking row B→A creates a Wait-For Graph cycle, how the engine aborts a victim, and canonical lock ordering fixes.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "dead-tuples-bloat-autovacuum-txid-wraparound",
              "title": "Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound",
              "kind": "design",
              "archive": {
                "slug": "dead-tuples-bloat-autovacuum-txid-wraparound",
                "file": "dead-tuples-bloat-autovacuum-txid-wraparound.md",
                "title": "Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound",
                "displayTitle": "Dead Tuples, Table Bloat, Autovacuum, Free Space Map & XID Wraparound",
                "type": "design",
                "tags": [
                  "autovacuum",
                  "table-bloat",
                  "xid-wraparound"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1248,
                "excerpt": "Why MVCC leaves dead tuples behind, how VACUUM reclaims space into the Free Space Map without locking reads, and how 32-bit Transaction ID wraparound freezes tables.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-sentry-transaction-id-wraparound",
              "title": "Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage",
              "kind": "case",
              "archive": {
                "slug": "case-sentry-transaction-id-wraparound",
                "file": "case-sentry-transaction-id-wraparound.md",
                "title": "Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage",
                "displayTitle": "Production Case Study: Anatomy of a Transaction ID (XID) Wraparound Outage",
                "type": "case",
                "tags": [
                  "xid-wraparound",
                  "autovacuum",
                  "postmortem"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1271,
                "excerpt": "Dissecting how unvacuumed 32-bit transaction IDs approach the 2-billion horizon, forcing PostgreSQL into emergency read-only shutdown to prevent data loss.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-mvcc-snapshot-storage-engine",
              "title": "Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC",
              "kind": "build",
              "archive": {
                "slug": "build-mvcc-snapshot-storage-engine",
                "file": "build-mvcc-snapshot-storage-engine.md",
                "title": "Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC",
                "displayTitle": "Hands-On Build: Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC",
                "type": "build",
                "tags": [
                  "build",
                  "mvcc",
                  "garbage-collection"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1294,
                "excerpt": "Implement an MVCC storage engine supporting versioned tuple chains (xmin/xmax), point-in-time snapshot visibility reads, and dead-tuple vacuum garbage collection.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m15",
          "number": "5.3",
          "legacyNumber": "15",
          "title": "Storage Engine Internals: Pages, Buffer Pool, WAL & LSM-Trees",
          "summary": "8KB slotted database pages, Heap-Only Tuple (HOT) updates, Buffer Pool Clock-Sweep/LRU-K, Write-Ahead Logging (WAL & LSN), Fuzzy Checkpoints, ARIES crash recovery, and LSM-Trees.",
          "units": [
            {
              "slug": "slotted-page-layout-8kb-anatomy",
              "title": "Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST",
              "kind": "lesson",
              "archive": {
                "slug": "slotted-page-layout-8kb-anatomy",
                "file": "slotted-page-layout-8kb-anatomy.md",
                "title": "Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST",
                "displayTitle": "Inside an 8KB Slotted Database Page: Header, Line Pointers, Tuples & TOAST",
                "type": "lesson",
                "tags": [
                  "slotted-page",
                  "8kb-page",
                  "toast"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1366,
                "excerpt": "Why databases use slotted pages: line pointer arrays growing downward, tuple payloads growing upward, indirection for compaction, and out-of-line TOAST storage.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "heap-files-hot-updates-fillfactor",
              "title": "Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor",
              "kind": "lesson",
              "archive": {
                "slug": "heap-files-hot-updates-fillfactor",
                "file": "heap-files-hot-updates-fillfactor.md",
                "title": "Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor",
                "displayTitle": "Heap Files, Index Write Amplification, PostgreSQL HOT Updates & fillfactor",
                "type": "lesson",
                "tags": [
                  "hot-updates",
                  "fillfactor",
                  "heap-files"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1389,
                "excerpt": "How updating a non-indexed column with enough free space on the same 8KB page creates a Heap-Only Tuple (HOT) chain, bypassing all secondary index writes.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "buffer-pool-clock-sweep-lru-k",
              "title": "Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction",
              "kind": "lesson",
              "archive": {
                "slug": "buffer-pool-clock-sweep-lru-k",
                "file": "buffer-pool-clock-sweep-lru-k.md",
                "title": "Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction",
                "displayTitle": "Buffer Pool Manager: Pin Counts, Dirty Pages, Clock-Sweep & LRU-K Eviction",
                "type": "lesson",
                "tags": [
                  "buffer-pool",
                  "clock-sweep",
                  "lru-k"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1412,
                "excerpt": "Managing in-memory page frames, why sequential scans pollute naive LRU caches, and how Clock-Sweep / LRU-K + ring buffers protect the hot working set.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "write-ahead-logging-wal-lsn",
              "title": "Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit",
              "kind": "lesson",
              "archive": {
                "slug": "write-ahead-logging-wal-lsn",
                "file": "write-ahead-logging-wal-lsn.md",
                "title": "Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit",
                "displayTitle": "Write-Ahead Logging (WAL), Log Sequence Numbers (LSN) & Group Commit",
                "type": "lesson",
                "tags": [
                  "wal",
                  "lsn",
                  "group-commit"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1435,
                "excerpt": "The fundamental WAL invariant (log record must reach stable disk before dirty data page), page LSN tracking, and batching concurrent commits into one fsync.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "checkpoints-dirty-page-flushing",
              "title": "Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes)",
              "kind": "lesson",
              "archive": {
                "slug": "checkpoints-dirty-page-flushing",
                "file": "checkpoints-dirty-page-flushing.md",
                "title": "Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes)",
                "displayTitle": "Checkpoints, Dirty Page Flushing & Torn-Page Protection (Full Page Writes)",
                "type": "lesson",
                "tags": [
                  "checkpoints",
                  "full-page-writes",
                  "dirty-pages"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1198,
                "excerpt": "Bounding crash recovery time with spread checkpoints, and why the first modification to an 8KB page after a checkpoint logs a Full Page Image (FPI).",
                "mermaidCount": 1
              }
            },
            {
              "slug": "aries-crash-recovery-analysis-redo-undo",
              "title": "ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes",
              "kind": "lesson",
              "archive": {
                "slug": "aries-crash-recovery-analysis-redo-undo",
                "file": "aries-crash-recovery-analysis-redo-undo.md",
                "title": "ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes",
                "displayTitle": "ARIES Crash Recovery: Steal/No-Force Policy, Analysis, Redo & Undo Passes",
                "type": "lesson",
                "tags": [
                  "aries",
                  "crash-recovery",
                  "redo-undo"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1221,
                "excerpt": "Walking step-by-step through the three passes of ARIES recovery: reconstructing active transactions (Analysis), repeating history (Redo), and rolling back losers (Undo).",
                "mermaidCount": 1
              }
            },
            {
              "slug": "lsm-trees-memtable-sstable-compaction",
              "title": "LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction",
              "kind": "lesson",
              "archive": {
                "slug": "lsm-trees-memtable-sstable-compaction",
                "file": "lsm-trees-memtable-sstable-compaction.md",
                "title": "LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction",
                "displayTitle": "LSM-Trees (RocksDB / Cassandra): MemTable, Immutable SSTables, Bloom Filters & Compaction",
                "type": "lesson",
                "tags": [
                  "lsm-tree",
                  "sstable",
                  "compaction"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1244,
                "excerpt": "Turning random writes into sequential appends via an in-memory skip-list MemTable, immutable sorted SSTable runs, Bloom filters, and leveled/tiered compaction.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "btree-vs-lsm-read-write-space-amplification",
              "title": "The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification",
              "kind": "design",
              "archive": {
                "slug": "btree-vs-lsm-read-write-space-amplification",
                "file": "btree-vs-lsm-read-write-space-amplification.md",
                "title": "The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification",
                "displayTitle": "The RUM Conjecture: B+Tree vs LSM-Tree Read, Write & Space Amplification",
                "type": "design",
                "tags": [
                  "rum-conjecture",
                  "btree-vs-lsm",
                  "storage-engines"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1267,
                "excerpt": "Quantifying the fundamental storage trade-off triangle: optimizing any two of Read Overhead, Update (Write) Overhead, and Memory/Space Overhead penalizes the third.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-uber-postgres-to-mysql-storage",
              "title": "Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage",
              "kind": "case",
              "archive": {
                "slug": "case-uber-postgres-to-mysql-storage",
                "file": "case-uber-postgres-to-mysql-storage.md",
                "title": "Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage",
                "displayTitle": "Production Case Study: PostgreSQL Heap+ctid vs MySQL InnoDB Clustered Storage",
                "type": "case",
                "tags": [
                  "postgres-vs-mysql",
                  "storage-architecture",
                  "write-amplification"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1290,
                "excerpt": "Comparing secondary index write amplification, replica lag, and buffer pool semantics between heap-referenced ctids and primary-key-referenced clustered trees.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-slotted-page-wal-engine",
              "title": "Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator",
              "kind": "build",
              "archive": {
                "slug": "build-slotted-page-wal-engine",
                "file": "build-slotted-page-wal-engine.md",
                "title": "Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator",
                "displayTitle": "Hands-On Build: 8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator",
                "type": "build",
                "tags": [
                  "build",
                  "slotted-page",
                  "aries-recovery"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1313,
                "excerpt": "Implement an 8KB slotted page allocator and an ARIES-style Write-Ahead Log manager that replays Redo and rolls back uncommitted Undo records after a simulated crash.",
                "mermaidCount": 1
              }
            }
          ]
        }
      ]
    },
    {
      "id": "track-6",
      "number": 6,
      "title": "Analytical Engines (OLAP), Distributed SQL & Production Operations",
      "summary": "Scale from single-node engines to petabyte warehouses and globally distributed clusters: columnar Parquet/DuckDB/ClickHouse internals, sharding, NewSQL consensus, and production query tuning.",
      "hours": 36,
      "modules": [
        {
          "id": "m16",
          "number": "6.1",
          "legacyNumber": "16",
          "title": "Columnar Storage, Vectorized OLAP & Modern Lakehouses",
          "summary": "Row (NSM) vs Columnar (DSM/PAX) layouts, Apache Parquet, RLE/Dictionary/Delta compression, SIMD late materialization, Zone Maps, DuckDB, ClickHouse MergeTree, and Apache Iceberg.",
          "units": [
            {
              "slug": "columnar-storage-layout-parquet",
              "title": "Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout",
              "kind": "lesson",
              "archive": {
                "slug": "columnar-storage-layout-parquet",
                "file": "columnar-storage-layout-parquet.md",
                "title": "Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout",
                "displayTitle": "Row-Store (NSM) vs Column-Store (DSM) & Apache Parquet PAX Hybrid Layout",
                "type": "lesson",
                "tags": [
                  "columnar-storage",
                  "parquet",
                  "olap"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1365,
                "excerpt": "Why analytical queries reading 4 of 100 columns waste 96% of I/O bandwidth on row stores, and how Parquet organizes Row Groups, Column Chunks, and Pages.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "columnar-compression-rle-dictionary-delta",
              "title": "Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding",
              "kind": "lesson",
              "archive": {
                "slug": "columnar-compression-rle-dictionary-delta",
                "file": "columnar-compression-rle-dictionary-delta.md",
                "title": "Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding",
                "displayTitle": "Columnar Compression: Run-Length (RLE), Dictionary, Bit-Packing & Delta Encoding",
                "type": "lesson",
                "tags": [
                  "compression",
                  "rle",
                  "dictionary-encoding"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1388,
                "excerpt": "Exploiting homogeneous column data types to achieve 10x–40x compression using Dictionary codes, Run-Length triples, Frame-of-Reference, and Delta encoding.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "late-materialization-simd-vectorization",
              "title": "Late Materialization & SIMD Vectorized Execution on Compressed Columns",
              "kind": "lesson",
              "archive": {
                "slug": "late-materialization-simd-vectorization",
                "file": "late-materialization-simd-vectorization.md",
                "title": "Late Materialization & SIMD Vectorized Execution on Compressed Columns",
                "displayTitle": "Late Materialization & SIMD Vectorized Execution on Compressed Columns",
                "type": "lesson",
                "tags": [
                  "late-materialization",
                  "simd",
                  "vectorized-execution"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1411,
                "excerpt": "Evaluating WHERE predicates directly on compressed dictionary IDs and bitmasks using AVX-512 SIMD instructions before reconstructing matching tuples.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "zone-maps-min-max-pruning-bloom",
              "title": "Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering",
              "kind": "lesson",
              "archive": {
                "slug": "zone-maps-min-max-pruning-bloom",
                "file": "zone-maps-min-max-pruning-bloom.md",
                "title": "Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering",
                "displayTitle": "Zone Maps (Min/Max Skipping Indexes), Partition Pruning & Z-Order Clustering",
                "type": "lesson",
                "tags": [
                  "zone-maps",
                  "data-skipping",
                  "z-order"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1434,
                "excerpt": "Skipping 99% of Parquet row groups or micro-partitions using per-block min/max metadata headers and multi-dimensional Z-Order / Hilbert space-filling curves.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "embedded-olap-duckdb-architecture",
              "title": "Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution",
              "kind": "lesson",
              "archive": {
                "slug": "embedded-olap-duckdb-architecture",
                "file": "embedded-olap-duckdb-architecture.md",
                "title": "Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution",
                "displayTitle": "Embedded Analytical SQL (DuckDB): Morsel-Driven Parallelism & Out-of-Core Execution",
                "type": "lesson",
                "tags": [
                  "duckdb",
                  "morsel-driven",
                  "embedded-olap"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1197,
                "excerpt": "Why scale-up single-node vectorized execution over local Parquet/Arrow files often beats distributed cluster overhead for datasets under 1 TB.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "realtime-olap-clickhouse-mergetree",
              "title": "Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines",
              "kind": "lesson",
              "archive": {
                "slug": "realtime-olap-clickhouse-mergetree",
                "file": "realtime-olap-clickhouse-mergetree.md",
                "title": "Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines",
                "displayTitle": "Real-Time OLAP (ClickHouse): Sparse Primary Indexes & MergeTree Engines",
                "type": "lesson",
                "tags": [
                  "clickhouse",
                  "mergetree",
                  "sparse-index"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1220,
                "excerpt": "How ClickHouse ingests millions of events/sec using immutable sorted data parts, sparse granule primary indexes (1 entry per 8,192 rows), and background merges.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "cloud-warehouses-snowflake-bigquery",
              "title": "Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute",
              "kind": "design",
              "archive": {
                "slug": "cloud-warehouses-snowflake-bigquery",
                "file": "cloud-warehouses-snowflake-bigquery.md",
                "title": "Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute",
                "displayTitle": "Cloud Data Warehouses (Snowflake & BigQuery): Disaggregated Storage & Compute",
                "type": "design",
                "tags": [
                  "snowflake",
                  "bigquery",
                  "cloud-warehouse"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1243,
                "excerpt": "Separating immutable object-store micro-partitions (S3/GCS) from stateless elastic compute clusters with local SSD caching and distributed shuffle fabrics.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "open-table-formats-iceberg-delta",
              "title": "Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage",
              "kind": "lesson",
              "archive": {
                "slug": "open-table-formats-iceberg-delta",
                "file": "open-table-formats-iceberg-delta.md",
                "title": "Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage",
                "displayTitle": "Open Lakehouse Table Formats (Apache Iceberg & Delta Lake): ACID on Object Storage",
                "type": "lesson",
                "tags": [
                  "apache-iceberg",
                  "delta-lake",
                  "lakehouse"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1266,
                "excerpt": "Bringing atomic schema evolution, hidden partitioning, snapshot isolation, and time-travel queries to Parquet files on S3 via metadata manifest trees.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-cloudflare-clickhouse-log-analytics",
              "title": "Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree",
              "kind": "case",
              "archive": {
                "slug": "case-cloudflare-clickhouse-log-analytics",
                "file": "case-cloudflare-clickhouse-log-analytics.md",
                "title": "Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree",
                "displayTitle": "Production Case Study: Querying Millions of HTTP Events/Sec with Columnar MergeTree",
                "type": "case",
                "tags": [
                  "clickhouse",
                  "observability",
                  "columnar-compression"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1289,
                "excerpt": "How ordenar sorting keys, low-cardinality dictionary encoding, and materialized rollup tables power sub-second analytics over petabytes of network telemetry.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-columnar-compression-query-engine",
              "title": "Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown",
              "kind": "build",
              "archive": {
                "slug": "build-columnar-compression-query-engine",
                "file": "build-columnar-compression-query-engine.md",
                "title": "Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown",
                "displayTitle": "Hands-On Build: Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown",
                "type": "build",
                "tags": [
                  "build",
                  "columnar",
                  "zone-maps"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1312,
                "excerpt": "Build a columnar storage engine that compresses column chunks with Dictionary and Run-Length Encoding and prunes blocks via Zone Map min/max metadata.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m17",
          "number": "6.2",
          "legacyNumber": "17",
          "title": "Replication, Partitioning, Sharding & Distributed NewSQL",
          "summary": "Single-leader physical/logical replication, read replica consistency anomalies, split-brain failover, declarative partitioning, horizontal sharding (Vitess/Citus), 2PC vs Sagas, and Spanner/CockroachDB.",
          "units": [
            {
              "slug": "single-leader-replication-sync-async",
              "title": "Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async",
              "kind": "lesson",
              "archive": {
                "slug": "single-leader-replication-sync-async",
                "file": "single-leader-replication-sync-async.md",
                "title": "Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async",
                "displayTitle": "Single-Leader Replication: Physical WAL Streaming vs Logical Replication & Sync/Async",
                "type": "lesson",
                "tags": [
                  "replication",
                  "wal-streaming",
                  "logical-replication"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1384,
                "excerpt": "Comparing byte-for-byte physical WAL streaming against row-level logical replication, and the latency vs RPO=0 trade-off of synchronous standbys.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "read-replicas-consistency-models",
              "title": "Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies",
              "kind": "lesson",
              "archive": {
                "slug": "read-replicas-consistency-models",
                "file": "read-replicas-consistency-models.md",
                "title": "Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies",
                "displayTitle": "Scaling Reads with Replicas: Read-Your-Writes, Monotonic Reads & Lag Anomalies",
                "type": "lesson",
                "tags": [
                  "read-replicas",
                  "replication-lag",
                  "consistency"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1407,
                "excerpt": "Why routing reads to asynchronous replicas causes users to think their just-saved data vanished, and fixing it with LSN causal tracking or primary pinning.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "failover-split-brain-fencing-tokens",
              "title": "Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens",
              "kind": "lesson",
              "archive": {
                "slug": "failover-split-brain-fencing-tokens",
                "file": "failover-split-brain-fencing-tokens.md",
                "title": "Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens",
                "displayTitle": "Automated High-Availability Failover, Split-Brain Hazards & Fencing Tokens",
                "type": "lesson",
                "tags": [
                  "failover",
                  "split-brain",
                  "fencing-tokens"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1430,
                "excerpt": "What happens when a partitioned primary comes back online believing it is still leader, and how consensus leases, STONITH, and monotonic fencing tokens prevent corruption.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "declarative-table-partitioning",
              "title": "Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops",
              "kind": "lesson",
              "archive": {
                "slug": "declarative-table-partitioning",
                "file": "declarative-table-partitioning.md",
                "title": "Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops",
                "displayTitle": "Declarative Table Partitioning (Range, List, Hash) & Instant Retention Drops",
                "type": "lesson",
                "tags": [
                  "table-partitioning",
                  "partition-pruning",
                  "time-series"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1193,
                "excerpt": "Splitting billion-row tables into monthly child partitions for planner partition pruning and instant O(1) data expiration via DROP/DETACH PARTITION instead of DELETE.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "horizontal-sharding-routing-keys",
              "title": "Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather",
              "kind": "design",
              "archive": {
                "slug": "horizontal-sharding-routing-keys",
                "file": "horizontal-sharding-routing-keys.md",
                "title": "Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather",
                "displayTitle": "Horizontal Sharding (Vitess / Citus): Shard Keys, Consistent Hashing & Scatter-Gather",
                "type": "design",
                "tags": [
                  "sharding",
                  "shard-key",
                  "scatter-gather"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1216,
                "excerpt": "Choosing a tenant or entity shard key so 99% of queries route to a single shard, avoiding cross-shard scatter-gather tail latency and celebrity hot-shard skew.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "distributed-transactions-2pc-saga",
              "title": "Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern",
              "kind": "lesson",
              "archive": {
                "slug": "distributed-transactions-2pc-saga",
                "file": "distributed-transactions-2pc-saga.md",
                "title": "Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern",
                "displayTitle": "Distributed Transactions: Two-Phase Commit (2PC) Blocking vs Saga Pattern",
                "type": "lesson",
                "tags": [
                  "2pc",
                  "saga-pattern",
                  "distributed-transactions"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1239,
                "excerpt": "Why atomic Two-Phase Commit (Prepare + Commit) amplifies latency and locks resources if the coordinator crashes, and when compensating Sagas win.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "distributed-sql-spanner-cockroachdb",
              "title": "Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC",
              "kind": "lesson",
              "archive": {
                "slug": "distributed-sql-spanner-cockroachdb",
                "file": "distributed-sql-spanner-cockroachdb.md",
                "title": "Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC",
                "displayTitle": "Distributed NewSQL Internals (Spanner & CockroachDB): Raft Ranges, TrueTime & HLC",
                "type": "lesson",
                "tags": [
                  "spanner",
                  "cockroachdb",
                  "hybrid-logical-clock"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1262,
                "excerpt": "How NewSQL engines shard sorted key-value ranges across Raft consensus groups and use atomic/GPS TrueTime or Hybrid Logical Clocks for external consistency.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "connection-pooling-pgbouncer-proxies",
              "title": "Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes",
              "kind": "lesson",
              "archive": {
                "slug": "connection-pooling-pgbouncer-proxies",
                "file": "connection-pooling-pgbouncer-proxies.md",
                "title": "Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes",
                "displayTitle": "Connection Pooling Architecture: Process-Per-Connection Overhead & PgBouncer Modes",
                "type": "lesson",
                "tags": [
                  "connection-pooling",
                  "pgbouncer",
                  "transaction-pooling"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1285,
                "excerpt": "Why 5,000 idle application connections exhaust PostgreSQL RAM and snapshot scalability, and how transaction-mode multiplexing shares 100 server connections.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-figma-postgres-horizontal-sharding",
              "title": "Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters",
              "kind": "case",
              "archive": {
                "slug": "case-figma-postgres-horizontal-sharding",
                "file": "case-figma-postgres-horizontal-sharding.md",
                "title": "Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters",
                "displayTitle": "Production Case Study: Evolving from a Single Postgres Primary to Sharded Clusters",
                "type": "case",
                "tags": [
                  "sharding",
                  "postgres-scaling",
                  "vertical-to-horizontal"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1308,
                "excerpt": "Tracing the architectural journey from vertical scaling and read replicas to vertical table functional splitting and zero-downtime logical shard splits.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-sharded-query-router",
              "title": "Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather",
              "kind": "build",
              "archive": {
                "slug": "build-sharded-query-router",
                "file": "build-sharded-query-router.md",
                "title": "Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather",
                "displayTitle": "Hands-On Build: Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather",
                "type": "build",
                "tags": [
                  "build",
                  "sharding",
                  "query-router"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1331,
                "excerpt": "Implement a distributed SQL shard router that directs point-key queries to a single virtual node and executes scatter-gather merges for unsharded queries.",
                "mermaidCount": 1
              }
            }
          ]
        },
        {
          "id": "m18",
          "number": "6.3",
          "legacyNumber": "18",
          "title": "Production Query Tuning, Observability & Database Reliability",
          "summary": "Keyset cursor pagination vs OFFSET, solving ORM N+1 query storms, trigram/inverted full-text search, SKIP LOCKED job queues, bulk ingestion, pg_stat_statements triage, and PITR recovery.",
          "units": [
            {
              "slug": "keyset-cursor-pagination-vs-offset",
              "title": "Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency",
              "kind": "lesson",
              "archive": {
                "slug": "keyset-cursor-pagination-vs-offset",
                "file": "keyset-cursor-pagination-vs-offset.md",
                "title": "Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency",
                "displayTitle": "Keyset (Seek) Cursor Pagination vs Why OFFSET 100000 Destroys Latency",
                "type": "lesson",
                "tags": [
                  "keyset-pagination",
                  "cursor-pagination",
                  "offset-trap"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1403,
                "excerpt": "Why OFFSET 100000 forces the engine to fetch and discard 100,000 rows, and how row-value seek predicates WHERE (created_at, id) < (?, ?) run in O(1) constant time.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "solving-n-plus-one-orm-queries",
              "title": "Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation",
              "kind": "lesson",
              "archive": {
                "slug": "solving-n-plus-one-orm-queries",
                "file": "solving-n-plus-one-orm-queries.md",
                "title": "Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation",
                "displayTitle": "Eliminating ORM N+1 Query Storms: Batching, Eager Joins & JSON Aggregation",
                "type": "lesson",
                "tags": [
                  "n-plus-one",
                  "orm-tuning",
                  "query-batching"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1426,
                "excerpt": "Detecting 1+N chatty query loops in application traces and collapsing 501 round-trips into 1 or 2 indexed queries using IN batching or lateral JSON aggregation.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "full-text-search-trigrams-inverted-index",
              "title": "Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25",
              "kind": "lesson",
              "archive": {
                "slug": "full-text-search-trigrams-inverted-index",
                "file": "full-text-search-trigrams-inverted-index.md",
                "title": "Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25",
                "displayTitle": "Full-Text & Fuzzy Search: Why LIKE '%term%' Fails vs Trigrams (pg_trgm) & BM25",
                "type": "lesson",
                "tags": [
                  "full-text-search",
                  "trigram-index",
                  "bm25"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1189,
                "excerpt": "Why leading-wildcard LIKE cannot use a B+Tree index, and how 3-character trigram GIN indexes and tokenized tsvector inverted indexes deliver sub-10ms search.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "queue-processing-skip-locked-patterns",
              "title": "High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED",
              "kind": "design",
              "archive": {
                "slug": "queue-processing-skip-locked-patterns",
                "file": "queue-processing-skip-locked-patterns.md",
                "title": "High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED",
                "displayTitle": "High-Throughput Transactional Job Queues in SQL with FOR UPDATE SKIP LOCKED",
                "type": "design",
                "tags": [
                  "job-queue",
                  "skip-locked",
                  "workers"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1212,
                "excerpt": "Building a durable, exactly-once background task queue inside SQL without external brokers using partial indexes, SKIP LOCKED, and lease heartbeats.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "bulk-ingestion-batching-unlogged-tables",
              "title": "High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY",
              "kind": "lesson",
              "archive": {
                "slug": "bulk-ingestion-batching-unlogged-tables",
                "file": "bulk-ingestion-batching-unlogged-tables.md",
                "title": "High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY",
                "displayTitle": "High-Speed Bulk Ingestion: Multi-Row Batches, Index Drop/Rebuild, UNLOGGED & COPY",
                "type": "lesson",
                "tags": [
                  "bulk-ingest",
                  "copy",
                  "unlogged-tables"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1235,
                "excerpt": "Ingesting 100 million rows 20x faster by streaming binary COPY into staging tables, deferring B+Tree index builds, and tuning synchronous_commit.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "pg-stat-statements-slow-query-triage",
              "title": "Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio",
              "kind": "lesson",
              "archive": {
                "slug": "pg-stat-statements-slow-query-triage",
                "file": "pg-stat-statements-slow-query-triage.md",
                "title": "Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio",
                "displayTitle": "Production Query Telemetry: pg_stat_statements, Total vs Mean Time & Buffer Hit Ratio",
                "type": "lesson",
                "tags": [
                  "pg-stat-statements",
                  "observability",
                  "slow-query-log"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1258,
                "excerpt": "Triaging database CPU saturation using normalized query digests: ranking by total_exec_time, shared_blks_read I/O pressure, and temp_blks_written spills.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "lock-contention-zero-downtime-ddl",
              "title": "Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID",
              "kind": "design",
              "archive": {
                "slug": "lock-contention-zero-downtime-ddl",
                "file": "lock-contention-zero-downtime-ddl.md",
                "title": "Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID",
                "displayTitle": "Zero-Downtime Production DDL: CREATE INDEX CONCURRENTLY, lock_timeout & NOT VALID",
                "type": "design",
                "tags": [
                  "zero-downtime-ddl",
                  "lock-timeout",
                  "concurrent-index"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1281,
                "excerpt": "Protecting production OLTP availability with mandatory lock_timeout guards, online index builds, and two-step NOT VALID + VALIDATE CONSTRAINT foreign keys.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "backup-pitr-wal-archiving-drills",
              "title": "Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay",
              "kind": "lesson",
              "archive": {
                "slug": "backup-pitr-wal-archiving-drills",
                "file": "backup-pitr-wal-archiving-drills.md",
                "title": "Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay",
                "displayTitle": "Backups & Point-in-Time Recovery (PITR): Logical Dumps vs Base Backup + WAL Replay",
                "type": "lesson",
                "tags": [
                  "pitr",
                  "backups",
                  "wal-archiving"
                ],
                "sources": [
                  "https://www.sqlite.org/queryplanner.html",
                  "https://use-the-index-luke.com/",
                  "https://www.postgresql.org/docs/current/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1304,
                "excerpt": "Why pg_dump cannot restore a 5 TB database to 14:02:59 right before an accidental DROP TABLE, and how physical base backups + continuous WAL archiving achieve PITR.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "case-gitlab-database-incident-postmortem",
              "title": "Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills",
              "kind": "case",
              "archive": {
                "slug": "case-gitlab-database-incident-postmortem",
                "file": "case-gitlab-database-incident-postmortem.md",
                "title": "Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills",
                "displayTitle": "Production Case Study: Lessons from High-Severity Database Outages & Recovery Drills",
                "type": "case",
                "tags": [
                  "incident-postmortem",
                  "pitr",
                  "database-reliability"
                ],
                "sources": [
                  "https://www.postgresql.org/docs/current/",
                  "https://www.sqlite.org/docs.html",
                  "https://use-the-index-luke.com/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1327,
                "excerpt": "Analyzing real-world production database emergencies, replication lag cascades, backup verification failures, and automated chaos recovery testing.",
                "mermaidCount": 1
              }
            },
            {
              "slug": "build-production-sql-tuning-clinic",
              "title": "Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup)",
              "kind": "build",
              "archive": {
                "slug": "build-production-sql-tuning-clinic",
                "file": "build-production-sql-tuning-clinic.md",
                "title": "Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup)",
                "displayTitle": "Hands-On Build: End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup)",
                "type": "build",
                "tags": [
                  "build",
                  "query-tuning",
                  "performance-clinic"
                ],
                "sources": [
                  "https://duckdb.org/docs/",
                  "https://www.postgresql.org/docs/current/",
                  "https://15445.courses.cs.cmu.edu/"
                ],
                "created": "2026-06-01",
                "updated": "2026-10-26",
                "wordCount": 1350,
                "excerpt": "Diagnose and rewrite a suite of pathological production SQL queries (non-SARGable filters, N+1 loops, OFFSET pagination, and missing composite indexes) for 100x speedups.",
                "mermaidCount": 1
              }
            }
          ]
        }
      ]
    }
  ]
};
