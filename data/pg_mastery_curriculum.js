/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery Curriculum Index (`window.PG_MASTERY_CURRICULUM`)
 * 10 Progressive Tracks × 8 Hands-On Practice Topics = 80 Query-Driven Topics (240 Verified SQL Steps).
 * Covers every SQL & PostgreSQL 18 topic from foundational clauses to MVCC internals, `pg_catalog`
 * system introspection, and FAANG-grade DBRE production troubleshooting clinics.
 */
(function (root) {
  'use strict';

  var MODULES = [
    {
      id: 'pg-m01',
      num: '01',
      slug: 'sql-foundations-expressions',
      title: 'SQL Query Foundations, Filtering, Sorting & PG 18 Expressions',
      shortTitle: 'Query Foundations & Expressions',
      difficulty: 'Beginner',
      badge: 'Track 01 · 8 Labs',
      dataFile: 'data/pg-labs/pg-m01.js',
      summary: 'Master relational projection, logical clause evaluation order, three-valued logic, pattern matching, PostgreSQL DISTINCT ON, null-safe predicates, type casting, TIMESTAMPTZ arithmetic, GENERATE_SERIES, uuidv7(), and virtual generated columns.',
      topics: [
        {
          id: 'pg-m01-t01',
          slug: 'select-projection-arithmetic',
          title: 'SELECT Projection, Aliases & Exact Numeric Arithmetic',
          difficulty: 'Beginner',
          estimatedMinutes: 10,
          datasetId: 'ecommerce',
          clauses: ['SELECT', 'AS', 'NUMERIC', 'ROUND'],
          tags: ['select', 'aliases', 'arithmetic', 'integer-division', 'fundamentals'],
          summary: 'Project computed columns, assign clean identifier aliases, and avoid silent integer-division truncation using PostgreSQL NUMERIC casts.'
        },
        {
          id: 'pg-m01-t02',
          slug: 'where-comparison-predicates',
          title: 'WHERE Row Filtering, Comparison Operators & Execution Order',
          difficulty: 'Beginner',
          estimatedMinutes: 10,
          datasetId: 'ecommerce',
          clauses: ['WHERE', '=', '<>', '>=', '<='],
          tags: ['where', 'filtering', 'predicates', 'execution-order', 'fundamentals'],
          summary: 'Filter heap tuples before projection using exact relational predicates and navigate why WHERE cannot reference SELECT aliases directly.'
        },
        {
          id: 'pg-m01-t03',
          slug: 'boolean-logic-precedence-3vl',
          title: 'AND, OR, NOT Precedence & Three-Valued Logic (3VL)',
          difficulty: 'Beginner',
          estimatedMinutes: 12,
          datasetId: 'ecommerce',
          clauses: ['AND', 'OR', 'NOT', 'IS TRUE', 'IS NOT TRUE'],
          tags: ['boolean-logic', 'precedence', '3vl', 'null', 'where'],
          summary: 'Prevent operator-precedence bugs where AND binds tighter than OR, and master TRUE / FALSE / UNKNOWN truth tables with IS NOT TRUE.'
        },
        {
          id: 'pg-m01-t04',
          slug: 'pattern-range-membership-filters',
          title: 'IN, BETWEEN, LIKE, ILIKE & POSIX Regex (~, ~*)',
          difficulty: 'Beginner',
          estimatedMinutes: 12,
          datasetId: 'ecommerce',
          clauses: ['IN', 'BETWEEN', 'LIKE', 'ILIKE', '~*'],
          tags: ['like', 'ilike', 'regex', 'between', 'in', 'pattern-matching'],
          summary: 'Express set membership, inclusive range bounds, case-insensitive ILIKE wildcards, and PostgreSQL POSIX regular expression predicates.'
        },
        {
          id: 'pg-m01-t05',
          slug: 'sorting-pagination-distinct-on',
          title: 'ORDER BY, NULLS FIRST/LAST, LIMIT/OFFSET & DISTINCT ON',
          difficulty: 'Beginner',
          estimatedMinutes: 14,
          datasetId: 'ecommerce',
          clauses: ['ORDER BY', 'NULLS LAST', 'LIMIT', 'OFFSET', 'DISTINCT ON'],
          tags: ['order-by', 'nulls-last', 'limit', 'distinct-on', 'deduplication'],
          summary: 'Guarantee deterministic multi-key sorting, control NULL sort placement, slice pages with FETCH/LIMIT, and pick the latest row per entity via DISTINCT ON.'
        },
        {
          id: 'pg-m01-t06',
          slug: 'null-semantics-coalesce-distinct-from',
          title: 'IS NULL, COALESCE, NULLIF & Null-Safe IS DISTINCT FROM',
          difficulty: 'Beginner',
          estimatedMinutes: 12,
          datasetId: 'org_hr',
          clauses: ['IS NULL', 'COALESCE', 'NULLIF', 'IS DISTINCT FROM'],
          tags: ['null', 'coalesce', 'nullif', 'is-distinct-from', 'safe-division'],
          summary: 'Replace missing attributes with COALESCE fallbacks, guard division-by-zero with NULLIF, and compare nullable columns safely with IS DISTINCT FROM.'
        },
        {
          id: 'pg-m01-t07',
          slug: 'case-casts-string-math-functions',
          title: 'CASE Expressions, ::type Casts & Core String/Math Functions',
          difficulty: 'Intermediate',
          estimatedMinutes: 14,
          datasetId: 'fintech_ledger',
          clauses: ['CASE WHEN', '::', 'CAST', 'SPLIT_PART', 'ABS'],
          tags: ['case', 'cast', 'strings', 'numeric', 'expressions'],
          summary: 'Classify ledger tiers with searched CASE WHEN expressions, apply PostgreSQL ::type casts, and parse structured codes with SPLIT_PART and TRIM.'
        },
        {
          id: 'pg-m01-t08',
          slug: 'timestamptz-generate-series-uuidv7-virtual',
          title: 'TIMESTAMPTZ, DATE_TRUNC, GENERATE_SERIES, uuidv7() & Virtual Columns',
          difficulty: 'Intermediate',
          estimatedMinutes: 16,
          datasetId: 'saas_telemetry',
          clauses: ['TIMESTAMPTZ', 'DATE_TRUNC', 'GENERATE_SERIES', 'uuidv7()', 'GENERATED ALWAYS'],
          tags: ['timestamptz', 'generate-series', 'uuidv7', 'pg18', 'virtual-columns', 'time-series'],
          summary: 'Bucket UTC timestamps with DATE_TRUNC, synthesize zero-gap timelines with GENERATE_SERIES, mint k-sortable PostgreSQL 18 uuidv7() keys, and define VIRTUAL generated columns.'
        }
      ]
    },
    {
      id: 'pg-m02',
      num: '02',
      slug: 'ddl-constraints-dml-merge',
      title: 'DDL Schema Design, Constraints & Modern PG 17/18 DML',
      shortTitle: 'Schema DDL, Constraints & DML',
      difficulty: 'Intermediate',
      badge: 'Track 02 · 8 Labs',
      dataFile: 'data/pg-labs/pg-m02.js',
      summary: 'Design production PostgreSQL tables with IDENTITY keys, zero-downtime ALTER TABLE evolutions, NULLS NOT DISTINCT & DEFERRABLE constraints, single-roundtrip RETURNING mutations, ON CONFLICT upserts, and PostgreSQL 18 MERGE.',
      topics: [
        {
          id: 'pg-m02-t01',
          slug: 'create-table-identity-pg-types',
          title: 'CREATE TABLE, GENERATED ALWAYS AS IDENTITY & Native PG Types',
          difficulty: 'Beginner',
          estimatedMinutes: 12,
          datasetId: 'ecommerce',
          clauses: ['CREATE TABLE', 'GENERATED ALWAYS AS IDENTITY', 'TIMESTAMPTZ', 'NUMERIC'],
          tags: ['ddl', 'create-table', 'identity', 'data-types', 'schema-design'],
          summary: 'Author clean PostgreSQL schemas using SQL-standard IDENTITY columns instead of legacy SERIAL, TEXT over arbitrary VARCHAR(n), and exact NUMERIC currency.'
        },
        {
          id: 'pg-m02-t02',
          slug: 'alter-table-safe-migrations-drop',
          title: 'ALTER TABLE Migrations, Non-Blocking Defaults, DROP & TRUNCATE',
          difficulty: 'Intermediate',
          estimatedMinutes: 14,
          datasetId: 'ecommerce',
          clauses: ['ALTER TABLE', 'ADD COLUMN', 'ALTER COLUMN', 'DROP', 'TRUNCATE'],
          tags: ['alter-table', 'migrations', 'ddl', 'truncate', 'not-valid'],
          summary: 'Evolve live tables with fast catalog-only column defaults, two-phase CHECK ... NOT VALID constraints, and understand DROP CASCADE vs TRUNCATE.'
        },
        {
          id: 'pg-m02-t03',
          slug: 'constraints-nulls-not-distinct-deferrable',
          title: 'PK, FK Cascade Rules, CHECK, UNIQUE NULLS NOT DISTINCT & DEFERRABLE',
          difficulty: 'Intermediate',
          estimatedMinutes: 16,
          datasetId: 'fintech_ledger',
          clauses: ['PRIMARY KEY', 'REFERENCES', 'CHECK', 'NULLS NOT DISTINCT', 'DEFERRABLE'],
          tags: ['constraints', 'foreign-keys', 'nulls-not-distinct', 'deferrable', 'integrity'],
          summary: 'Enforce relational invariants in storage using foreign key actions, domain CHECKs, PG 15+ UNIQUE NULLS NOT DISTINCT, and DEFERRABLE INITIALLY DEFERRED swaps.'
        },
        {
          id: 'pg-m02-t04',
          slug: 'insert-multi-row-select-returning',
          title: 'INSERT Multi-Row Batches, INSERT ... SELECT & RETURNING',
          difficulty: 'Beginner',
          estimatedMinutes: 12,
          datasetId: 'ecommerce',
          clauses: ['INSERT INTO', 'VALUES', 'INSERT ... SELECT', 'RETURNING'],
          tags: ['insert', 'dml', 'returning', 'batching'],
          summary: 'Insert multi-row batches, backfill summary tables via INSERT ... SELECT, and stream server-generated keys back in one roundtrip with RETURNING.'
        },
        {
          id: 'pg-m02-t05',
          slug: 'update-expressions-update-from',
          title: 'Conditional UPDATE Mutations & Multi-Table UPDATE ... FROM',
          difficulty: 'Intermediate',
          estimatedMinutes: 14,
          datasetId: 'ecommerce',
          clauses: ['UPDATE', 'SET', 'FROM', 'RETURNING'],
          tags: ['update', 'update-from', 'dml', 'returning'],
          summary: 'Perform atomic in-place price/inventory updates and join reference tables cleanly using PostgreSQL UPDATE ... SET ... FROM syntax.'
        },
        {
          id: 'pg-m02-t06',
          slug: 'delete-using-pg18-returning-old-new',
          title: 'Targeted DELETE ... USING & PG 18 RETURNING OLD.*, NEW.*',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'fintech_ledger',
          clauses: ['DELETE FROM', 'USING', 'RETURNING OLD.*', 'RETURNING NEW.*'],
          tags: ['delete', 'delete-using', 'returning-old-new', 'pg18', 'dml'],
          summary: 'Purge rows matched against joined tables with DELETE ... USING, and capture before/after mutation images directly with PostgreSQL 18 RETURNING OLD.*, NEW.*.'
        },
        {
          id: 'pg-m02-t07',
          slug: 'upsert-on-conflict-excluded',
          title: 'Idempotent Upserts: INSERT ... ON CONFLICT & EXCLUDED',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'ecommerce',
          clauses: ['ON CONFLICT', 'DO NOTHING', 'DO UPDATE', 'EXCLUDED'],
          tags: ['upsert', 'on-conflict', 'excluded', 'idempotency', 'dml'],
          summary: 'Eliminate check-then-insert race conditions using atomic ON CONFLICT DO UPDATE with conditional WHERE guards against EXCLUDED.'
        },
        {
          id: 'pg-m02-t08',
          slug: 'merge-into-views-materialized-views',
          title: 'SQL MERGE INTO (BY SOURCE / merge_action) & MATERIALIZED VIEW',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['MERGE INTO', 'WHEN MATCHED', 'WHEN NOT MATCHED BY SOURCE', 'merge_action()', 'MATERIALIZED VIEW'],
          tags: ['merge', 'merge-action', 'materialized-view', 'pg17', 'pg18', 'etl'],
          summary: 'Synchronize ledger staging feeds in a single pass with MERGE INTO ... RETURNING merge_action(), OLD.*, NEW.*, and precompute fast reporting snapshots with MATERIALIZED VIEW.'
        }
      ]
    },
    {
      id: 'pg-m03',
      num: '03',
      slug: 'joins-subqueries-lateral-ctes',
      title: 'All Joins, Set Operations, Subqueries, LATERAL & CTEs',
      shortTitle: 'Joins, LATERAL & Recursive CTEs',
      difficulty: 'Intermediate',
      badge: 'Track 03 · 8 Labs',
      dataFile: 'data/pg-labs/pg-m03.js',
      summary: 'Master every relational join operator, prevent 1-to-N fan-out inflation, avoid the LEFT JOIN WHERE and NOT IN (NULL) traps, unlock correlated per-group Top-N with LATERAL, and traverse graphs with WITH RECURSIVE.',
      topics: [
        {
          id: 'pg-m03-t01',
          slug: 'inner-join-multi-table-fanout',
          title: 'INNER JOIN, Multi-Table Chains & Preventing Join Fan-Out',
          difficulty: 'Beginner',
          estimatedMinutes: 14,
          datasetId: 'ecommerce',
          clauses: ['INNER JOIN', 'ON', 'USING'],
          tags: ['inner-join', 'fan-out', 'joins', 'relational-algebra'],
          summary: 'Join normalized entities across foreign keys and fix subtle revenue double-counting caused by joining two independent 1-to-many child tables.'
        },
        {
          id: 'pg-m03-t02',
          slug: 'left-right-outer-join-on-vs-where',
          title: 'LEFT / RIGHT OUTER JOIN, Anti-Joins & ON vs WHERE Placement',
          difficulty: 'Beginner',
          estimatedMinutes: 14,
          datasetId: 'ecommerce',
          clauses: ['LEFT JOIN', 'RIGHT JOIN', 'ON', 'WHERE ... IS NULL'],
          tags: ['left-join', 'outer-join', 'anti-join', 'on-vs-where'],
          summary: 'Preserve unmatched parent rows, find zero-activity entities with LEFT JOIN ... WHERE child.id IS NULL, and keep right-side filters inside ON so LEFT JOIN does not silently collapse into INNER JOIN.'
        },
        {
          id: 'pg-m03-t03',
          slug: 'full-outer-reconciliation-cross-join',
          title: 'FULL OUTER JOIN Reconciliation & CROSS JOIN Grids',
          difficulty: 'Intermediate',
          estimatedMinutes: 14,
          datasetId: 'fintech_ledger',
          clauses: ['FULL OUTER JOIN', 'CROSS JOIN', 'COALESCE'],
          tags: ['full-outer-join', 'cross-join', 'reconciliation', 'joins'],
          summary: 'Reconcile two independent data sources to surface orphans on both sides with FULL OUTER JOIN, and generate dense reporting matrices with CROSS JOIN.'
        },
        {
          id: 'pg-m03-t04',
          slug: 'self-join-non-equi-asof-joins',
          title: 'SELF JOIN Hierarchies & Non-Equi / Temporal Range Joins',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'org_hr',
          clauses: ['JOIN ... ON a.manager_id = b.id', 'BETWEEN', '<='],
          tags: ['self-join', 'non-equi-join', 'hierarchies', 'temporal-join'],
          summary: 'Compare employees against their own managers and peer cohorts via aliased SELF JOINs, and match compensation bands using non-equi range predicates.'
        },
        {
          id: 'pg-m03-t05',
          slug: 'set-operations-union-intersect-except',
          title: 'Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT',
          difficulty: 'Intermediate',
          estimatedMinutes: 12,
          datasetId: 'social_graph',
          clauses: ['UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT'],
          tags: ['union', 'union-all', 'intersect', 'except', 'set-operations'],
          summary: 'Combine result sets without unnecessary sort/hash deduplication via UNION ALL, and compute mutual intersections and set differences with INTERSECT and EXCEPT.'
        },
        {
          id: 'pg-m03-t06',
          slug: 'subqueries-exists-not-in-null-trap',
          title: 'Scalar & Correlated Subqueries, EXISTS & The NOT IN (NULL) Trap',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'ecommerce',
          clauses: ['EXISTS', 'NOT EXISTS', 'IN', 'ANY', 'ALL'],
          tags: ['subqueries', 'exists', 'not-exists', 'not-in-null-trap', 'semi-join'],
          summary: 'Write short-circuiting semi-joins and anti-joins with EXISTS / NOT EXISTS, and witness why a single NULL inside NOT IN (...) causes zero rows to return.'
        },
        {
          id: 'pg-m03-t07',
          slug: 'lateral-joins-per-group-top-n',
          title: 'LATERAL Joins: Correlated Per-Parent Top-N & Unnesting',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'ecommerce',
          clauses: ['CROSS JOIN LATERAL', 'LEFT JOIN LATERAL', 'LIMIT'],
          tags: ['lateral', 'top-n-per-group', 'joins', 'postgres-idioms'],
          summary: 'Execute parameterized inner subqueries per outer row with LEFT JOIN LATERAL to fetch each customer’s top-N orders using tight index probes.'
        },
        {
          id: 'pg-m03-t08',
          slug: 'ctes-materialized-writable-recursive',
          title: 'WITH CTEs, Writable Data-Modifying CTEs & WITH RECURSIVE',
          difficulty: 'Advanced',
          estimatedMinutes: 20,
          datasetId: 'org_hr',
          clauses: ['WITH', 'MATERIALIZED', 'WITH RECURSIVE', 'SEARCH', 'CYCLE'],
          tags: ['cte', 'recursive-cte', 'writable-cte', 'materialized', 'graphs'],
          summary: 'Control PostgreSQL 12+ CTE inlining with MATERIALIZED, chain atomic DELETE ... RETURNING into archive INSERTs via writable CTEs, and walk org trees with WITH RECURSIVE + CYCLE.'
        }
      ]
    },
    {
      id: 'pg-m04',
      num: '04',
      slug: 'aggregations-rollups-window-functions',
      title: 'Aggregations, Rollups & Window Functions Mastery',
      shortTitle: 'Aggregations & Window Functions',
      difficulty: 'Intermediate',
      badge: 'Track 04 · 8 Labs',
      dataFile: 'data/pg-labs/pg-m04.js',
      summary: 'Go from core GROUP BY & HAVING semantics to PostgreSQL FILTER conditional aggregates, JSONB/ARRAY collection builders, continuous percentiles, OLAP ROLLUP/CUBE subtotals, and surgical window framing.',
      topics: [
        {
          id: 'pg-m04-t01',
          slug: 'aggregates-count-null-group-by',
          title: 'COUNT(*) vs COUNT(col), Core Aggregates & Functional Dependency GROUP BY',
          difficulty: 'Beginner',
          estimatedMinutes: 12,
          datasetId: 'ecommerce',
          clauses: ['GROUP BY', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'],
          tags: ['group-by', 'count', 'aggregates', 'functional-dependency'],
          summary: 'Distinguish tuple counting COUNT(*) from non-null attribute counting COUNT(col), and leverage PostgreSQL primary-key functional dependency in GROUP BY.'
        },
        {
          id: 'pg-m04-t02',
          slug: 'having-post-group-filtering',
          title: 'HAVING Post-Group Predicates vs Pre-Aggregate WHERE Pushdown',
          difficulty: 'Beginner',
          estimatedMinutes: 12,
          datasetId: 'ecommerce',
          clauses: ['GROUP BY', 'HAVING', 'WHERE'],
          tags: ['having', 'group-by', 'predicate-pushdown', 'aggregates'],
          summary: 'Push row-level filters into WHERE to shrink hash-aggregate input while reserving HAVING strictly for post-group aggregate thresholds.'
        },
        {
          id: 'pg-m04-t03',
          slug: 'conditional-aggregation-filter-clause',
          title: 'Single-Pass Pivoting & Funnel Ratios with FILTER (WHERE ...)',
          difficulty: 'Intermediate',
          estimatedMinutes: 14,
          datasetId: 'saas_telemetry',
          clauses: ['FILTER (WHERE ...)', 'COUNT', 'SUM', 'AVG'],
          tags: ['filter-clause', 'pivoting', 'conditional-aggregation', 'funnels'],
          summary: 'Compute multi-stage conversion funnels and status breakdowns in a single table scan using clean SQL:2003 / PostgreSQL FILTER (WHERE ...) clauses.'
        },
        {
          id: 'pg-m04-t04',
          slug: 'ordered-collection-aggregates',
          title: 'Ordered Collection Builders: STRING_AGG, ARRAY_AGG & JSONB_AGG',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'ecommerce',
          clauses: ['STRING_AGG', 'ARRAY_AGG', 'JSONB_AGG', 'JSONB_OBJECT_AGG'],
          tags: ['string-agg', 'array-agg', 'jsonb-agg', 'aggregates', 'api-payloads'],
          summary: 'Shape denormalized lists and ready-to-serve nested JSON API payloads directly inside PostgreSQL with deterministic intra-aggregate ORDER BY.'
        },
        {
          id: 'pg-m04-t05',
          slug: 'ordered-set-hypothetical-percentiles',
          title: 'Tail-Latency Analytics: PERCENTILE_CONT, PERCENTILE_DISC & MODE',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'pg_ops_telemetry',
          clauses: ['WITHIN GROUP', 'PERCENTILE_CONT', 'PERCENTILE_DISC', 'MODE'],
          tags: ['percentiles', 'p95', 'p99', 'within-group', 'analytics'],
          summary: 'Measure p50, p95, and p99 endpoint latency SLOs accurately using interpolated PERCENTILE_CONT vs discrete PERCENTILE_DISC ordered-set aggregates.'
        },
        {
          id: 'pg-m04-t06',
          slug: 'grouping-sets-rollup-cube',
          title: 'OLAP Subtotals in One Scan: GROUPING SETS, ROLLUP, CUBE & GROUPING()',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'ecommerce',
          clauses: ['GROUPING SETS', 'ROLLUP', 'CUBE', 'GROUPING'],
          tags: ['grouping-sets', 'rollup', 'cube', 'olap', 'subtotals'],
          summary: 'Replace brittle multi-query UNION ALL subtotal trees with single-pass GROUPING SETS / ROLLUP / CUBE and disambiguate real NULLs using GROUPING().'
        },
        {
          id: 'pg-m04-t07',
          slug: 'window-ranking-lag-lead-navigation',
          title: 'Window Ranking (ROW_NUMBER, RANK, DENSE_RANK) & LAG / LEAD Deltas',
          difficulty: 'Intermediate',
          estimatedMinutes: 16,
          datasetId: 'org_hr',
          clauses: ['OVER', 'PARTITION BY', 'ROW_NUMBER', 'DENSE_RANK', 'LAG', 'LEAD', 'WINDOW'],
          tags: ['window-functions', 'row-number', 'dense-rank', 'lag', 'lead'],
          summary: 'Rank peers within departments without collapsing rows, compute period-over-period deltas with LAG/LEAD, and deduplicate window specs via NAMED WINDOW.'
        },
        {
          id: 'pg-m04-t08',
          slug: 'window-frames-running-totals-gaps-islands',
          title: 'Window Frames (ROWS vs RANGE vs GROUPS), Running Totals & Gaps-and-Islands',
          difficulty: 'Advanced',
          estimatedMinutes: 20,
          datasetId: 'saas_telemetry',
          clauses: ['ROWS BETWEEN', 'RANGE BETWEEN', 'EXCLUDE', 'UNBOUNDED PRECEDING'],
          tags: ['window-frames', 'running-totals', 'gaps-and-islands', 'sessionization', 'last-value'],
          summary: 'Avoid the default RANGE UNBOUNDED PRECEDING peer-tie trap, fix LAST_VALUE frame bounds, compute rolling windows, and solve sessionization via Gaps-and-Islands.'
        }
      ]
    },
    {
      id: 'pg-m05',
      num: '05',
      slug: 'postgres-rich-types-search',
      title: 'PostgreSQL Rich Native Data Types & Search',
      shortTitle: 'JSONB, Arrays, Ranges & FTS',
      difficulty: 'Advanced',
      badge: 'Track 05 · 8 Labs',
      dataFile: 'data/pg-labs/pg-m05.js',
      summary: 'Exploit PostgreSQL’s unfair advantage: binary JSONB + GIN containment, SQL/JSON JSON_TABLE(), native arrays, temporal TSTZRANGE + GiST exclusion constraints, weighted Full-Text Search, pg_trgm typo tolerance, and ltree hierarchies.',
      topics: [
        {
          id: 'pg-m05-t01',
          slug: 'jsonb-operators-containment-gin',
          title: 'JSONB Extraction (->, ->>, #>>) & GIN Containment (@>, ?, ?|, ?&)',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'pg_ops_telemetry',
          clauses: ['JSONB', '->', '->>', '@>', '?', '?|', '?&'],
          tags: ['jsonb', 'gin', 'containment', 'semi-structured'],
          summary: 'Query nested audit event documents using binary JSONB paths and write GIN-indexable @> containment predicates instead of full-scan ->> text comparisons.'
        },
        {
          id: 'pg-m05-t02',
          slug: 'jsonb-mutations-aggregation-builders',
          title: 'In-Place JSONB Surgery: jsonb_set, Key Removal (-, #-) & jsonb_strip_nulls',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'pg_ops_telemetry',
          clauses: ['jsonb_set', 'jsonb_strip_nulls', '#-', '||'],
          tags: ['jsonb', 'jsonb-set', 'mutations', 'jsonb-build-object'],
          summary: 'Patch deeply nested JSONB attributes atomically with jsonb_set, redact sensitive keys with #- path deletion, and merge objects with ||.'
        },
        {
          id: 'pg-m05-t03',
          slug: 'sql-json-path-json-table',
          title: 'SQL/JSON Path Queries (@?, jsonb_path_query) & PG 17/18 JSON_TABLE()',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['JSON_TABLE', 'jsonb_path_query', '@?', 'COLUMNS'],
          tags: ['json-table', 'jsonpath', 'pg17', 'pg18', 'jsonb'],
          summary: 'Filter nested arrays with SQL/JSON path predicates ($ ? (@.fee_cents > 1000)) and project nested JSON arrays into typed relational rows using JSON_TABLE().'
        },
        {
          id: 'pg-m05-t04',
          slug: 'native-arrays-unnest-ordinality',
          title: 'Native PostgreSQL ARRAYs (@>, &&, ANY) & UNNEST WITH ORDINALITY',
          difficulty: 'Intermediate',
          estimatedMinutes: 14,
          datasetId: 'pg_ops_telemetry',
          clauses: ['TEXT[]', '@>', '&&', '= ANY', 'UNNEST', 'WITH ORDINALITY'],
          tags: ['arrays', 'unnest', 'ordinality', 'gin'],
          summary: 'Check OAuth permission scopes with GIN-backed @> and && array operators, and expand arrays while preserving 1-based element order via WITH ORDINALITY.'
        },
        {
          id: 'pg-m05-t05',
          slug: 'range-multirange-temporal-algebra',
          title: 'Temporal Algebra with tstzrange, Overlap (&&) & Multirange range_agg()',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['TSTZRANGE', '&&', '@>', '*', '-', 'range_agg'],
          tags: ['ranges', 'tstzrange', 'multirange', 'range-agg', 'temporal'],
          summary: 'Model half-open [start, end) intervals without off-by-one boundary bugs, detect schedule collisions with &&, and compute free availability gaps via range_agg().'
        },
        {
          id: 'pg-m05-t06',
          slug: 'btree-gist-exclusion-constraints',
          title: 'Zero-Race Scheduling with btree_gist & EXCLUDE USING gist',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['EXCLUDE USING gist', 'btree_gist', 'WITH =', 'WITH &&'],
          tags: ['exclude-constraint', 'gist', 'btree-gist', 'concurrency', 'ranges'],
          summary: 'Combine scalar equality (=) and range overlap (&&) in a single GiST exclusion constraint so double-bookings are impossible even under concurrent transactions.'
        },
        {
          id: 'pg-m05-t07',
          slug: 'full-text-search-tsvector-ranking',
          title: 'Native Full-Text Search: Weighted tsvector, websearch_to_tsquery & ts_rank_cd',
          difficulty: 'Intermediate',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['TSVECTOR', '@@', 'websearch_to_tsquery', 'ts_rank_cd', 'ts_headline'],
          tags: ['full-text-search', 'tsvector', 'tsquery', 'gin', 'search'],
          summary: 'Search engineering runbooks at sub-millisecond speed with GIN-indexed weighted tsvectors, user-safe websearch_to_tsquery syntax, cover-density ranking, and highlighted snippets.'
        },
        {
          id: 'pg-m05-t08',
          slug: 'pg-trgm-fuzzy-search-ltree',
          title: 'Typo-Tolerant Search with pg_trgm (%, <->) & Hierarchical ltree (<@)',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['similarity', '%', '<->', 'LTREE', '<@', 'nlevel'],
          tags: ['pg-trgm', 'fuzzy-search', 'trigrams', 'ltree', 'hierarchies'],
          summary: 'Recover misspelled user search queries with pg_trgm trigram distance (<->), and roll up subtree budgets instantaneously using GiST-indexed ltree paths (<@).'
        }
      ]
    },
    {
      id: 'pg-m06',
      num: '06',
      slug: 'indexing-optimizer-explain-analyze',
      title: 'Indexing Architecture, Optimizer & EXPLAIN (ANALYZE, BUFFERS)',
      shortTitle: 'Indexing & EXPLAIN ANALYZE',
      difficulty: 'Advanced',
      badge: 'Track 06 · 8 Labs',
      dataFile: 'data/pg-labs/pg-m06.js',
      summary: 'Think like the PostgreSQL query planner: write SARGable predicates, order composite B-Tree columns, eliminate heap fetches with covering INCLUDE indexes, choose GIN/GiST/BRIN, read EXPLAIN (ANALYZE, BUFFERS), and fix correlated skew with CREATE STATISTICS.',
      topics: [
        {
          id: 'pg-m06-t01',
          slug: 'btree-internals-sargable-predicates',
          title: 'B-Tree Internals & Rewriting Non-SARGable Predicates',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'ecommerce',
          clauses: ['CREATE INDEX', 'EXPLAIN', 'B-Tree'],
          tags: ['btree', 'sargable', 'indexing', 'query-tuning'],
          summary: 'Understand why wrapping indexed columns in EXTRACT(), LOWER(), or arithmetic blinds B-Tree probes, and rewrite filters into SARGable range predicates.'
        },
        {
          id: 'pg-m06-t02',
          slug: 'composite-indexes-equality-sort-range',
          title: 'Composite B-Tree Column Order: Equality → Sort → Range',
          difficulty: 'Intermediate',
          estimatedMinutes: 16,
          datasetId: 'ecommerce',
          clauses: ['CREATE INDEX (a, b, c)', 'ORDER BY ... DESC'],
          tags: ['composite-index', 'btree', 'sort-elimination', 'skip-scan', 'pg18'],
          summary: 'Design multi-column B-Tree indexes that satisfy equality predicates and ORDER BY LIMIT in a single ordered scan with zero external Sort nodes.'
        },
        {
          id: 'pg-m06-t03',
          slug: 'covering-indexes-include-visibility',
          title: 'Covering Indexes (INCLUDE), Index-Only Scans & Heap Fetches',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'ecommerce',
          clauses: ['CREATE INDEX ... INCLUDE (...)', 'VACUUM', 'Index Only Scan'],
          tags: ['covering-index', 'include', 'index-only-scan', 'visibility-map'],
          summary: 'Attach non-key payload columns to B-Tree leaf pages via INCLUDE without bloating upper internal pages, and verify Heap Fetches: 0 after VACUUM.'
        },
        {
          id: 'pg-m06-t04',
          slug: 'partial-and-expression-indexes',
          title: 'Partial Indexes (WHERE ...) & Functional Expression Indexes',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['CREATE INDEX ... WHERE', 'CREATE INDEX ON tbl ((expr))'],
          tags: ['partial-index', 'expression-index', 'hot-queues', 'indexing'],
          summary: 'Shrink hot queue and tenant lookup indexes by 95% with Partial WHERE clauses, and accelerate case-insensitive or JSONB scalar lookups via Expression Indexes.'
        },
        {
          id: 'pg-m06-t05',
          slug: 'gin-gist-brin-hash-access-methods',
          title: 'Access Methods Beyond B-Tree: GIN, GiST, BRIN & Hash',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['USING gin', 'USING gist', 'USING brin', 'USING hash'],
          tags: ['gin', 'gist', 'brin', 'hash-index', 'access-methods'],
          summary: 'Match workload geometry to PostgreSQL’s pluggable index access methods—including tiny append-only BRIN min/max block summaries for time-series tables.'
        },
        {
          id: 'pg-m06-t06',
          slug: 'reading-explain-analyze-buffers',
          title: 'Decoding EXPLAIN (ANALYZE, BUFFERS): Costs, Loops & Buffer Hits',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)'],
          tags: ['explain-analyze', 'buffers', 'cardinality', 'loops', 'planner'],
          summary: 'Read execution plans from innermost leaves outward, multiply per-loop timings by loops, spot cardinality misestimates, and prioritize shared buffer reads/hits over wall-clock jitter.'
        },
        {
          id: 'pg-m06-t07',
          slug: 'physical-joins-nested-hash-merge',
          title: 'Physical Join Operators: Nested Loop (Memoize), Hash Join & Merge Join',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'ecommerce',
          clauses: ['SET LOCAL enable_hashjoin', 'Nested Loop', 'Hash Join', 'Merge Join'],
          tags: ['nested-loop', 'hash-join', 'merge-join', 'memoize', 'optimizer'],
          summary: 'Inspect how the cost-based optimizer chooses between indexed Nested Loops, in-memory Hash Joins, and pre-sorted Merge Joins—and when cardinality errors pick the wrong one.'
        },
        {
          id: 'pg-m06-t08',
          slug: 'pg-stats-extended-statistics-keyset',
          title: 'pg_stats Histograms, Multivariate CREATE STATISTICS & Keyset Pagination',
          difficulty: 'Staff',
          estimatedMinutes: 20,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_stats', 'CREATE STATISTICS', 'ANALYZE', '(a, b) < (x, y)'],
          tags: ['pg-stats', 'extended-statistics', 'keyset-pagination', 'cursor', 'performance'],
          summary: 'Inspect planner MCVs and histograms in pg_stats, cure correlated-column row underestimates with CREATE STATISTICS (dependencies, ndistinct), and replace O(N) OFFSET scans with O(log N) row-value keyset pagination.'
        }
      ]
    },
    {
      id: 'pg-m07',
      num: '07',
      slug: 'plpgsql-triggers-partitioning-rls',
      title: 'Programmability (PL/pgSQL), Triggers, Partitioning & RLS',
      shortTitle: 'PL/pgSQL, Partitioning & RLS',
      difficulty: 'Advanced',
      badge: 'Track 07 · 8 Labs',
      dataFile: 'data/pg-labs/pg-m07.js',
      summary: 'Build server-side guarantees cleanly inside PostgreSQL: planner-inlined SQL functions, exception-safe PL/pgSQL, injection-proof dynamic SQL, transition-table triggers, declarative partitioning, and multi-tenant Row-Level Security.',
      topics: [
        {
          id: 'pg-m07-t01',
          slug: 'sql-functions-volatility-inlining',
          title: 'SQL Functions, Volatility Categories (IMMUTABLE/STABLE/VOLATILE) & Inlining',
          difficulty: 'Intermediate',
          estimatedMinutes: 14,
          datasetId: 'ecommerce',
          clauses: ['CREATE FUNCTION', 'LANGUAGE sql', 'IMMUTABLE', 'STABLE'],
          tags: ['functions', 'volatility', 'inlining', 'immutable', 'planner'],
          summary: 'Write reusable SQL scalar and table functions, label volatility accurately so expression indexes and planner inlining work, and avoid black-box VOLATILE slowdowns.'
        },
        {
          id: 'pg-m07-t02',
          slug: 'plpgsql-control-flow-exceptions',
          title: 'PL/pgSQL Functions: DECLARE, RETURN QUERY & EXCEPTION Subtransactions',
          difficulty: 'Intermediate',
          estimatedMinutes: 16,
          datasetId: 'fintech_ledger',
          clauses: ['LANGUAGE plpgsql', 'DECLARE', 'RETURN QUERY', 'RAISE EXCEPTION', 'EXCEPTION WHEN'],
          tags: ['plpgsql', 'functions', 'exceptions', 'stored-logic'],
          summary: 'Author transactional ledger transfer functions in PL/pgSQL with strict balance guards, structured diagnostics, and awareness of EXCEPTION block subtransaction overhead.'
        },
        {
          id: 'pg-m07-t03',
          slug: 'procedures-dynamic-sql-format',
          title: 'CREATE PROCEDURE, CALL & Safe Dynamic SQL with format(%I, %L)',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['CREATE PROCEDURE', 'CALL', 'EXECUTE format(...)', 'USING'],
          tags: ['procedures', 'dynamic-sql', 'format', 'sql-injection-defense'],
          summary: 'Build administrative maintenance procedures using CALL and construct SQL-injection-proof dynamic statements via format(\'%I\', ident) and EXECUTE ... USING.'
        },
        {
          id: 'pg-m07-t04',
          slug: 'row-triggers-audit-invariants',
          title: 'BEFORE Validation Triggers & AFTER JSONB Audit Trail Triggers',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'fintech_ledger',
          clauses: ['CREATE TRIGGER', 'BEFORE UPDATE', 'AFTER INSERT OR UPDATE', 'to_jsonb(OLD)'],
          tags: ['triggers', 'audit-log', 'plpgsql', 'data-governance'],
          summary: 'Normalize and guard incoming writes in BEFORE FOR EACH ROW triggers, and record tamper-evident OLD/NEW JSONB diffs in AFTER audit triggers.'
        },
        {
          id: 'pg-m07-t05',
          slug: 'statement-triggers-transition-tables',
          title: 'Statement-Level Triggers with Transition Tables (REFERENCING NEW TABLE)',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'fintech_ledger',
          clauses: ['FOR EACH STATEMENT', 'REFERENCING NEW TABLE AS', 'OLD TABLE AS'],
          tags: ['transition-tables', 'statement-triggers', 'bulk-dml', 'performance'],
          summary: 'Replace 10,000 per-row trigger invocations on bulk updates with a single set-based AFTER STATEMENT trigger querying NEW TABLE / OLD TABLE transition relations.'
        },
        {
          id: 'pg-m07-t06',
          slug: 'declarative-partitioning-pruning',
          title: 'Declarative Partitioning (RANGE / LIST / HASH) & Partition Pruning',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['PARTITION BY RANGE', 'PARTITION OF', 'FOR VALUES FROM ... TO'],
          tags: ['partitioning', 'partition-pruning', 'time-series', 'explain'],
          summary: 'Design monthly range-partitioned telemetry tables, understand composite partition-key constraints, and prove compile-time and run-time partition pruning in EXPLAIN.'
        },
        {
          id: 'pg-m07-t07',
          slug: 'partition-lifecycle-attach-detach',
          title: 'Zero-Bloat Retention: ALTER TABLE ATTACH & DETACH PARTITION',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['ATTACH PARTITION', 'DETACH PARTITION', 'DROP TABLE'],
          tags: ['partitioning', 'retention', 'attach-partition', 'detach-partition', 'bloat-prevention'],
          summary: 'Onboard historical archive tables with ATTACH PARTITION and retire expired time windows instantaneously via DETACH/DROP instead of generating millions of dead tuples with DELETE.'
        },
        {
          id: 'pg-m07-t08',
          slug: 'roles-grants-row-level-security',
          title: 'Least-Privilege Roles & Multi-Tenant Row-Level Security (RLS)',
          difficulty: 'Staff',
          estimatedMinutes: 20,
          datasetId: 'pg_ops_telemetry',
          clauses: ['ENABLE ROW LEVEL SECURITY', 'FORCE ROW LEVEL SECURITY', 'CREATE POLICY', 'current_setting'],
          tags: ['rls', 'row-level-security', 'multi-tenant', 'security', 'roles'],
          summary: 'Isolate SaaS tenant data at the storage engine layer using ENABLE/FORCE ROW LEVEL SECURITY policies bound to session context current_setting(\'app.tenant_id\', true).'
        }
      ]
    },
    {
      id: 'pg-m08',
      num: '08',
      slug: 'transactions-locks-mvcc-internals',
      title: 'Transactions, Locks, MVCC & Storage Internals',
      shortTitle: 'MVCC, Locks & Storage Internals',
      difficulty: 'Staff',
      badge: 'Track 08 · 8 Labs',
      dataFile: 'data/pg-labs/pg-m08.js',
      summary: 'Open up the PostgreSQL storage engine: savepoints, snapshot isolation anomalies, SKIP LOCKED queues, advisory locks, live ctid/xmin/xmax tuple headers, 8 KB slotted pages via pageinspect, VACUUM/HOT/visibility maps, and pg_buffercache.',
      topics: [
        {
          id: 'pg-m08-t01',
          slug: 'transactions-savepoints-atomicity',
          title: 'ACID Transactions, SAVEPOINT Partial Rollbacks & pg_current_xact_id()',
          difficulty: 'Intermediate',
          estimatedMinutes: 14,
          datasetId: 'fintech_ledger',
          clauses: ['BEGIN', 'SAVEPOINT', 'ROLLBACK TO SAVEPOINT', 'COMMIT', 'pg_current_xact_id'],
          tags: ['transactions', 'savepoint', 'acid', 'xid'],
          summary: 'Recover gracefully from constraint errors mid-batch using SAVEPOINT / ROLLBACK TO SAVEPOINT and observe lazy virtual-to-real XID assignment via pg_current_xact_id_if_assigned().'
        },
        {
          id: 'pg-m08-t02',
          slug: 'isolation-levels-snapshot-anomalies',
          title: 'Isolation Levels: READ COMMITTED vs REPEATABLE READ vs SERIALIZABLE',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'fintech_ledger',
          clauses: ['SET TRANSACTION ISOLATION LEVEL', 'REPEATABLE READ', 'SERIALIZABLE'],
          tags: ['isolation-levels', 'mvcc', 'write-skew', 'serializable', 'ssi'],
          summary: 'Understand per-statement vs per-transaction MVCC snapshots, prevent lost updates under REPEATABLE READ, and guard cross-row invariants against write skew with SERIALIZABLE.'
        },
        {
          id: 'pg-m08-t03',
          slug: 'row-locking-for-update-skip-locked',
          title: 'Row-Level Locks (FOR NO KEY UPDATE) & Queue Workers with SKIP LOCKED',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['FOR UPDATE', 'FOR NO KEY UPDATE', 'SKIP LOCKED', 'NOWAIT'],
          tags: ['row-locks', 'skip-locked', 'for-update', 'job-queue', 'concurrency'],
          summary: 'Choose FOR NO KEY UPDATE to avoid blocking child foreign-key inserts, and build a non-blocking worker dequeue query using UPDATE ... WHERE job_id = (SELECT ... FOR UPDATE SKIP LOCKED).'
        },
        {
          id: 'pg-m08-t04',
          slug: 'advisory-locks-distributed-coordination',
          title: 'Application Fencing & Leader Election with PostgreSQL Advisory Locks',
          difficulty: 'Advanced',
          estimatedMinutes: 15,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_try_advisory_xact_lock', 'pg_advisory_xact_lock', 'hashtext', 'pg_locks'],
          tags: ['advisory-locks', 'distributed-locks', 'pg-locks', 'concurrency'],
          summary: 'Coordinate per-tenant cron jobs and webhook deduplication in shared memory without row bloat using transaction-scoped pg_try_advisory_xact_lock(hashtext(...)) and verify in pg_locks.'
        },
        {
          id: 'pg-m08-t05',
          slug: 'mvcc-tuple-headers-ctid-xmin-xmax',
          title: 'Live MVCC Tuple Inspection: ctid Physical Pointers, xmin & xmax',
          difficulty: 'Staff',
          estimatedMinutes: 18,
          datasetId: 'ecommerce',
          clauses: ['ctid', 'xmin', 'xmax', 'cmin', 'tableoid'],
          tags: ['mvcc', 'ctid', 'xmin', 'xmax', 'storage-internals'],
          summary: 'Observe PostgreSQL’s append-only UPDATE model firsthand by watching physical (block, offset) ctid jumps and xmin/xmax transaction stamps across mutations.'
        },
        {
          id: 'pg-m08-t06',
          slug: 'slotted-pages-pageinspect-internals',
          title: 'Inside 8 KB Slotted Pages & B-Tree Leaves with pageinspect',
          difficulty: 'Staff',
          estimatedMinutes: 20,
          datasetId: 'ecommerce',
          clauses: ['page_header', 'heap_page_items', 'get_raw_page', 'bt_metap', 'bt_page_items'],
          tags: ['pageinspect', 'slotted-page', 'infomask', 'btree-internals', 'storage'],
          summary: 'Crack open live 8192-byte heap pages and B-Tree index pages with pageinspect to inspect lp_off line pointers, pd_lower/pd_upper free space, t_infomask bits, and B-Tree root height.'
        },
        {
          id: 'pg-m08-t07',
          slug: 'vacuum-hot-updates-visibility-fsm',
          title: 'VACUUM, Heap-Only Tuples (HOT), pg_visibility & pg_freespacemap',
          difficulty: 'Staff',
          estimatedMinutes: 20,
          datasetId: 'ecommerce',
          clauses: ['VACUUM', 'fillfactor', 'pg_visibility_map_summary', 'pg_freespace'],
          tags: ['vacuum', 'hot-updates', 'pg-visibility', 'pg-freespacemap', 'bloat'],
          summary: 'Measure per-block reusable bytes in pg_freespacemap, inspect all-visible / all-frozen bits via pg_visibility, and tune fillfactor to unlock zero-index-churn HOT updates.'
        },
        {
          id: 'pg-m08-t08',
          slug: 'shared-buffers-pg-buffercache-wal-lsn',
          title: 'Shared Buffer Pool Inspection (pg_buffercache) & WAL LSN Diffs',
          difficulty: 'Staff',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_buffercache', 'usagecount', 'isdirty', 'pg_current_wal_lsn', 'pg_wal_lsn_diff'],
          tags: ['pg-buffercache', 'shared-buffers', 'wal', 'lsn', 'clock-sweep'],
          summary: 'Query live RAM buffer pool residency, dirty block counts, and clock-sweep usagecount via pg_buffercache, and quantify exact WAL bytes emitted by DML via pg_wal_lsn_diff().'
        }
      ]
    },
    {
      id: 'pg-m09',
      num: '09',
      slug: 'system-catalogs-db-introspection',
      title: 'PostgreSQL System Catalogs & Live DB Introspection',
      shortTitle: 'System Catalogs & Telemetry',
      difficulty: 'Advanced',
      badge: 'Track 09 · 8 Labs',
      dataFile: 'data/pg-labs/pg-m09.js',
      summary: 'Query the database’s own brain: master pg_class, pg_namespace, pg_attribute, pg_type, TOAST & relation sizing functions, pg_constraint unindexed FK audits, pg_index internals, pg_stat_activity, pg_settings, pg_stat_user_tables, and PG 18 pg_stat_io.',
      topics: [
        {
          id: 'pg-m09-t01',
          slug: 'pg-class-pg-namespace-relkind',
          title: 'information_schema vs pg_catalog: Navigating pg_class & relkind',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_catalog.pg_class', 'pg_namespace', 'relkind', 'reltuples', 'relpages'],
          tags: ['pg-catalog', 'pg-class', 'pg-namespace', 'relkind', 'introspection'],
          summary: 'Join pg_class and pg_namespace to inventory tables, partitions, indexes, materialized views, and TOAST relations by relkind alongside planner reltuples/relpages.'
        },
        {
          id: 'pg-m09-t02',
          slug: 'pg-attribute-pg-type-column-layout',
          title: 'Physical Column & Type Introspection: pg_attribute, pg_type & Alignment',
          difficulty: 'Intermediate',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_attribute', 'pg_type', 'format_type', 'attnum', 'attalign'],
          tags: ['pg-attribute', 'pg-type', 'column-padding', 'alignment', 'pg-catalog'],
          summary: 'Inspect physical column order (attnum > 0), dropped-column ghosts (attisdropped), exact SQL types via format_type(), and CPU struct alignment padding (attlen, attalign).'
        },
        {
          id: 'pg-m09-t03',
          slug: 'relation-sizing-toast-storage',
          title: 'Disk & TOAST Footprint Auditing: pg_total_relation_size & Forks',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_total_relation_size', 'pg_relation_size', 'pg_indexes_size', 'pg_size_pretty', 'reltoastrelid'],
          tags: ['disk-usage', 'toast', 'pg-size-pretty', 'storage', 'pg-catalog'],
          summary: 'Decompose every table’s storage footprint across main heap, FSM/VM forks, secondary indexes, and out-of-line TOAST compression tables.'
        },
        {
          id: 'pg-m09-t04',
          slug: 'pg-constraint-unindexed-fk-audit',
          title: 'pg_constraint Introspection & Automated Unindexed Foreign Key Audit',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_constraint', 'contype', 'conkey', 'pg_index.indkey', 'pg_get_constraintdef'],
          tags: ['pg-constraint', 'unindexed-foreign-keys', 'audit', 'locks', 'pg-catalog'],
          summary: 'Write the canonical DBRE catalog query joining pg_constraint (contype = \'f\') against pg_index.indkey prefixes to catch unindexed foreign keys before ON DELETE CASCADE locks stall production.'
        },
        {
          id: 'pg-m09-t05',
          slug: 'pg-index-indisvalid-properties',
          title: 'Deep Index Catalog Audit: pg_index, indisvalid, Expressions & Predicates',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_index', 'pg_indexes', 'pg_am', 'indisvalid', 'pg_get_indexdef'],
          tags: ['pg-index', 'pg-am', 'indisvalid', 'partial-index', 'pg-catalog'],
          summary: 'Audit live index access methods (pg_am), partial predicates (indpred), expression trees (indexprs), included payload columns (indnkeyatts), and broken indisvalid = false indexes.'
        },
        {
          id: 'pg-m09-t06',
          slug: 'pg-stat-activity-pg-settings-audit',
          title: 'Live Sessions & GUC Configuration Audit: pg_stat_activity & pg_settings',
          difficulty: 'Intermediate',
          estimatedMinutes: 15,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_stat_activity', 'pg_backend_pid()', 'pg_settings', 'source', 'pending_restart'],
          tags: ['pg-stat-activity', 'pg-settings', 'configuration', 'observability'],
          summary: 'Inspect your live backend session in pg_stat_activity and audit memory, WAL, autovacuum, and timeout GUCs in pg_settings by unit, context, and non-default overrides.'
        },
        {
          id: 'pg-m09-t07',
          slug: 'pg-stat-user-tables-indexes-telemetry',
          title: 'Workload Telemetry: pg_stat_user_tables & pg_stat_user_indexes',
          difficulty: 'Advanced',
          estimatedMinutes: 16,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_stat_user_tables', 'pg_stat_user_indexes', 'seq_scan', 'idx_scan', 'n_tup_hot_upd'],
          tags: ['pg-stat-user-tables', 'pg-stat-user-indexes', 'hot-updates', 'telemetry'],
          summary: 'Analyze live sequential-vs-index scan ratios, HOT update efficiency (n_tup_hot_upd / n_tup_upd), dead tuple accumulation, and index scan utilization.'
        },
        {
          id: 'pg-m09-t08',
          slug: 'buffer-hit-ratio-pg-stat-io-wal',
          title: 'Buffer Cache Hit Ratios (pg_statio_*) & PG 18 Unified pg_stat_io / pg_stat_wal',
          difficulty: 'Staff',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['pg_statio_user_tables', 'pg_statio_user_indexes', 'pg_stat_io', 'pg_stat_wal'],
          tags: ['pg-statio', 'cache-hit-ratio', 'pg-stat-io', 'pg-stat-wal', 'pg18'],
          summary: 'Compute per-table heap and index buffer cache hit ratios safely without zero-division errors, and inspect PostgreSQL 18 unified backend I/O and WAL counters.'
        }
      ]
    },
    {
      id: 'pg-m10',
      num: '10',
      slug: 'production-postgres-troubleshooting-clinics',
      title: 'Real-Life Production PostgreSQL Troubleshooting Clinics',
      shortTitle: 'Production DBRE Troubleshooting',
      difficulty: 'Staff',
      badge: 'Track 10 · 8 Incident Clinics',
      dataFile: 'data/pg-labs/pg-m10.js',
      summary: 'Step into PagerDuty SEV-1 war rooms modeled on real FAANG database incidents: diagnose lock convoys, zombie transactions, 99% CPU queries, temp-disk sort spills, autovacuum starvation, XID wraparound emergencies, redundant indexes, and orphaned replication slots.',
      topics: [
        {
          id: 'pg-m10-t01',
          slug: 'clinic-lock-convoy-blocker-tree',
          title: 'Clinic 01 — Checkout Outage: Root-Blocker Lock Convoy Triage',
          difficulty: 'Staff',
          estimatedMinutes: 20,
          datasetId: 'pg_ops_telemetry',
          clauses: ['WITH RECURSIVE', 'cluster_locks', 'cluster_stat_activity', 'AccessExclusiveLock'],
          tags: ['troubleshooting', 'locks', 'lock-convoy', 'ddl', 'incident-response'],
          summary: 'Checkout latency just spiked to timeouts after a migration started. Build a blocker-chain query to separate victim readers, the queued AccessExclusiveLock DDL waiter, and the true root blocker.'
        },
        {
          id: 'pg-m10-t02',
          slug: 'clinic-idle-in-transaction-pool-exhaustion',
          title: 'Clinic 02 — Connection Pool Exhausted: Zombie idle in transaction Hunt',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['cluster_stat_activity', 'idle in transaction', 'backend_xmin', 'EXTRACT(EPOCH ...)'],
          tags: ['troubleshooting', 'idle-in-transaction', 'pgbouncer', 'xmin', 'incident-response'],
          summary: 'Application pods are failing with remaining connection slots reserved. Pinpoint leaked idle in transaction sessions holding row locks and pinning the cluster xmin horizon.'
        },
        {
          id: 'pg-m10-t03',
          slug: 'clinic-cpu-saturation-stat-statements',
          title: 'Clinic 03 — 99% Primary CPU: Query Workload Triage in stat_statements',
          difficulty: 'Staff',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['cluster_stat_statements', 'total_exec_time_ms', 'shared_blks_read', 'SUM() OVER ()'],
          tags: ['troubleshooting', 'pg-stat-statements', 'cpu-saturation', 'slow-queries', 'incident-response'],
          summary: 'Primary CPU is pinned at 99%. Rank normalized query fingerprints by % of total cluster execution time, buffer read amplification, and call-frequency death-by-a-thousand-cuts.'
        },
        {
          id: 'pg-m10-t04',
          slug: 'clinic-temp-disk-sort-hash-spills',
          title: 'Clinic 04 — NVMe Temp I/O Spike: Diagnosing work_mem Disk Spills',
          difficulty: 'Advanced',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['temp_blks_written', 'pg_size_pretty', 'SET LOCAL work_mem'],
          tags: ['troubleshooting', 'work-mem', 'temp-files', 'external-sort', 'incident-response'],
          summary: 'Scratch NVMe IOPS tripled at 14:00 UTC. Convert 8 KB temp_blks_written counters into spilled megabytes per call and size safe transaction-scoped SET LOCAL work_mem budgets.'
        },
        {
          id: 'pg-m10-t05',
          slug: 'clinic-autovacuum-starvation-table-bloat',
          title: 'Clinic 05 — Autovacuum Starvation & Dead-Tuple Bloat Remediation',
          difficulty: 'Staff',
          estimatedMinutes: 20,
          datasetId: 'pg_ops_telemetry',
          clauses: ['cluster_table_health', 'dead_tup', 'vacuum_scale_factor', 'n_mod_since_analyze'],
          tags: ['troubleshooting', 'autovacuum', 'bloat', 'dead-tuples', 'incident-response'],
          summary: 'Find hot tables whose dead tuples haven’t crossed PostgreSQL’s default 20% autovacuum_vacuum_scale_factor threshold, compute exact trigger thresholds, and identify stale planner stats.'
        },
        {
          id: 'pg-m10-t06',
          slug: 'clinic-xid-wraparound-emergency',
          title: 'Clinic 06 — Transaction ID Wraparound Countdown (age_relfrozenxid > 1.8B)',
          difficulty: 'Staff',
          estimatedMinutes: 20,
          datasetId: 'pg_ops_telemetry',
          clauses: ['age_relfrozenxid', 'cluster_table_health', 'cluster_replication_slots', 'cluster_stat_activity'],
          tags: ['troubleshooting', 'xid-wraparound', 'relfrozenxid', 'vacuum-freeze', 'incident-response'],
          summary: 'PagerDuty fired: cluster XID age passed 1.89 billion (94% to emergency read-only shutdown). Triage tables closest to the 2B cliff and correlate every xmin blocker preventing VACUUM FREEZE.'
        },
        {
          id: 'pg-m10-t07',
          slug: 'clinic-unused-duplicate-invalid-indexes',
          title: 'Clinic 07 — Write Amplification: Unused, INVALID & Prefix-Redundant Indexes',
          difficulty: 'Staff',
          estimatedMinutes: 20,
          datasetId: 'pg_ops_telemetry',
          clauses: ['cluster_index_health', 'is_valid', 'idx_scan', 'key_columns'],
          tags: ['troubleshooting', 'redundant-indexes', 'unused-indexes', 'write-amplification', 'incident-response'],
          summary: 'Audit production indexes to reclaim gigabytes of RAM and cut UPDATE write amplification: catch failed INVALID CONCURRENTLY indexes, non-unique 0-scan indexes, and exact leftmost-prefix duplicates.'
        },
        {
          id: 'pg-m10-t08',
          slug: 'clinic-orphaned-slots-wal-disk-full',
          title: 'Clinic 08 — pg_wal Disk 96% Full: Orphaned Replication Slot Triage',
          difficulty: 'Staff',
          estimatedMinutes: 18,
          datasetId: 'pg_ops_telemetry',
          clauses: ['cluster_replication_slots', 'pg_wal_lsn_diff', 'restart_lsn', 'confirmed_flush_lsn'],
          tags: ['troubleshooting', 'replication-slots', 'wal', 'cdc', 'disk-full', 'incident-response'],
          summary: 'Primary pg_wal volume will hit ENOSPC PANIC in 28 minutes. Compute retained WAL bytes per slot using pg_wal_lsn_diff(current_wal_lsn, restart_lsn) and isolate the abandoned CDC slot.'
        }
      ]
    }
  ];

  var ALL_TOPICS = [];
  var BY_ID = {};
  var BY_SLUG = {};
  var MODULE_BY_ID = {};

  MODULES.forEach(function (mod, modIdx) {
    MODULE_BY_ID[mod.id] = mod;
    mod.topics.forEach(function (topic, topicIdx) {
      topic.moduleId = mod.id;
      topic.moduleNum = mod.num;
      topic.moduleTitle = mod.title;
      topic.moduleShortTitle = mod.shortTitle;
      topic.dataFile = mod.dataFile;
      topic.moduleOrder = modIdx + 1;
      topic.topicOrder = topicIdx + 1;
      topic.globalOrder = ALL_TOPICS.length + 1;
      ALL_TOPICS.push(topic);
      BY_ID[topic.id] = topic;
      BY_SLUG[topic.slug] = topic;
    });
  });

  /**
   * Maps any of the 180 theoretical curriculum topics (`/topic/<slug>/`) to the most
   * relevant hands-on PostgreSQL 18 practice lab in `PG_MASTERY_CURRICULUM`.
   */
  var KEYWORD_RULES = [
    { re: /wraparound|relfrozenxid|freeze/i, id: 'pg-m10-t06' },
    { re: /replication[\s_-]*slot|wal[\s_-]*keep|cdc|logical[\s_-]*replication/i, id: 'pg-m10-t08' },
    { re: /lock[\s_-]*convoy|blocking|deadlock|lock[\s_-]*queue/i, id: 'pg-m10-t01' },
    { re: /idle[\s_-]*in[\s_-]*transaction|connection[\s_-]*pool|pgbouncer/i, id: 'pg-m10-t02' },
    { re: /stat[\s_-]*statements|slow[\s_-]*quer/i, id: 'pg-m10-t03' },
    { re: /work[\s_-]*mem|temp[\s_-]*file|external[\s_-]*sort|disk[\s_-]*spill/i, id: 'pg-m10-t04' },
    { re: /autovacuum|bloat|dead[\s_-]*tuple/i, id: 'pg-m10-t05' },
    { re: /unused[\s_-]*index|redundant[\s_-]*index|duplicate[\s_-]*index/i, id: 'pg-m10-t07' },
    { re: /buffercache|shared[\s_-]*buffer|clock[\s_-]*sweep/i, id: 'pg-m08-t08' },
    { re: /pageinspect|slotted[\s_-]*page|line[\s_-]*pointer|heap[\s_-]*page/i, id: 'pg-m08-t06' },
    { re: /vacuum|hot[\s_-]*update|visibility[\s_-]*map|freespace/i, id: 'pg-m08-t07' },
    { re: /mvcc|xmin|xmax|ctid|tuple[\s_-]*header/i, id: 'pg-m08-t05' },
    { re: /advisory[\s_-]*lock/i, id: 'pg-m08-t04' },
    { re: /skip[\s_-]*locked|for[\s_-]*update|row[\s_-]*lock/i, id: 'pg-m08-t03' },
    { re: /isolation|serializable|repeatable[\s_-]*read|write[\s_-]*skew|phantom/i, id: 'pg-m08-t02' },
    { re: /savepoint|acid|atomicity|commit|rollback/i, id: 'pg-m08-t01' },
    { re: /pg_stat_io|pg_statio|hit[\s_-]*ratio/i, id: 'pg-m09-t08' },
    { re: /pg_stat_user|pg_stat_activity|pg_settings/i, id: 'pg-m09-t06' },
    { re: /unindexed[\s_-]*foreign|pg_constraint/i, id: 'pg-m09-t04' },
    { re: /toast|relation[\s_-]*size/i, id: 'pg-m09-t03' },
    { re: /catalog|pg_class|information_schema/i, id: 'pg-m09-t01' },
    { re: /row[\s_-]*level[\s_-]*security|\brls\b|multi[\s_-]*tenant|grant|role/i, id: 'pg-m07-t08' },
    { re: /attach[\s_-]*partition|detach[\s_-]*partition|retention/i, id: 'pg-m07-t07' },
    { re: /partition/i, id: 'pg-m07-t06' },
    { re: /transition[\s_-]*table|statement[\s_-]*trigger/i, id: 'pg-m07-t05' },
    { re: /trigger/i, id: 'pg-m07-t04' },
    { re: /procedure|dynamic[\s_-]*sql/i, id: 'pg-m07-t03' },
    { re: /pl\/?pgsql|stored[\s_-]*function/i, id: 'pg-m07-t02' },
    { re: /volatility|immutable|inlining/i, id: 'pg-m07-t01' },
    { re: /keyset|cursor[\s_-]*pagination|extended[\s_-]*stat|create[\s_-]*statistics/i, id: 'pg-m06-t08' },
    { re: /nested[\s_-]*loop|hash[\s_-]*join|merge[\s_-]*join/i, id: 'pg-m06-t07' },
    { re: /explain|query[\s_-]*plan|cost[\s_-]*model|cardinality/i, id: 'pg-m06-t06' },
    { re: /\bgin\b|\bgist\b|\bbrin\b|hash[\s_-]*index/i, id: 'pg-m06-t05' },
    { re: /partial[\s_-]*index|expression[\s_-]*index|functional[\s_-]*index/i, id: 'pg-m06-t04' },
    { re: /covering[\s_-]*index|index[\s_-]*only|\binclude\b/i, id: 'pg-m06-t03' },
    { re: /composite[\s_-]*index|multi[\s_-]*column[\s_-]*index/i, id: 'pg-m06-t02' },
    { re: /b-?tree|sargable|\bindex/i, id: 'pg-m06-t01' },
    { re: /trigram|pg_trgm|fuzzy|ltree/i, id: 'pg-m05-t08' },
    { re: /full[\s_-]*text|tsvector|tsquery/i, id: 'pg-m05-t07' },
    { re: /exclusion[\s_-]*constraint|btree_gist|double[\s_-]*book/i, id: 'pg-m05-t06' },
    { re: /tstzrange|daterange|multirange|range[\s_-]*type/i, id: 'pg-m05-t05' },
    { re: /\barray\b|unnest/i, id: 'pg-m05-t04' },
    { re: /json_table|jsonpath/i, id: 'pg-m05-t03' },
    { re: /jsonb|json|semi[\s_-]*structured/i, id: 'pg-m05-t01' },
    { re: /window[\s_-]*frame|running[\s_-]*total|gaps[\s_-]*and[\s_-]*islands|sessionization/i, id: 'pg-m04-t08' },
    { re: /row_number|dense_rank|\blag\b|\blead\b|window/i, id: 'pg-m04-t07' },
    { re: /grouping[\s_-]*sets|rollup|\bcube\b/i, id: 'pg-m04-t06' },
    { re: /percentile|median|within[\s_-]*group/i, id: 'pg-m04-t05' },
    { re: /string_agg|array_agg|jsonb_agg/i, id: 'pg-m04-t04' },
    { re: /filter[\s_-]*clause|conditional[\s_-]*aggregat|pivot/i, id: 'pg-m04-t03' },
    { re: /\bhaving\b/i, id: 'pg-m04-t02' },
    { re: /group[\s_-]*by|aggregat|\bcount\b/i, id: 'pg-m04-t01' },
    { re: /recursive|cte|\bwith\b/i, id: 'pg-m03-t08' },
    { re: /\blateral\b/i, id: 'pg-m03-t07' },
    { re: /subquer|\bexists\b|not[\s_-]*in/i, id: 'pg-m03-t06' },
    { re: /\bunion\b|\bintersect\b|\bexcept\b|set[\s_-]*operat/i, id: 'pg-m03-t05' },
    { re: /self[\s_-]*join|non[\s_-]*equi/i, id: 'pg-m03-t04' },
    { re: /full[\s_-]*outer|cross[\s_-]*join/i, id: 'pg-m03-t03' },
    { re: /left[\s_-]*join|outer[\s_-]*join|anti[\s_-]*join/i, id: 'pg-m03-t02' },
    { re: /\bjoin\b|fan[\s_-]*out/i, id: 'pg-m03-t01' },
    { re: /\bmerge\b|materialized[\s_-]*view/i, id: 'pg-m02-t08' },
    { re: /upsert|on[\s_-]*conflict/i, id: 'pg-m02-t07' },
    { re: /\bdelete\b|truncate/i, id: 'pg-m02-t06' },
    { re: /\bupdate\b/i, id: 'pg-m02-t05' },
    { re: /\binsert\b|\breturning\b/i, id: 'pg-m02-t04' },
    { re: /foreign[\s_-]*key|primary[\s_-]*key|constraint|check/i, id: 'pg-m02-t03' },
    { re: /alter[\s_-]*table|migration/i, id: 'pg-m02-t02' },
    { re: /create[\s_-]*table|normaliz|ddl|data[\s_-]*type/i, id: 'pg-m02-t01' },
    { re: /timestamp|date|time|interval|uuid|generate_series/i, id: 'pg-m01-t08' },
    { re: /\bcase\b|\bcast\b|string/i, id: 'pg-m01-t07' },
    { re: /coalesce|nullif|\bnull\b/i, id: 'pg-m01-t06' },
    { re: /order[\s_-]*by|distinct|limit|offset/i, id: 'pg-m01-t05' },
    { re: /\blike\b|\bilike\b|\bbetween\b|regex/i, id: 'pg-m01-t04' },
    { re: /three[\s_-]*valued|boolean|\band\b|\bor\b/i, id: 'pg-m01-t03' },
    { re: /\bwhere\b|filter/i, id: 'pg-m01-t02' }
  ];

  function findRelatedPostgresLab(curriculumTopic) {
    if (!curriculumTopic) return ALL_TOPICS[0];
    var hay = [
      curriculumTopic.slug || '',
      curriculumTopic.title || '',
      curriculumTopic.summary || ''
    ].join(' ');
    for (var i = 0; i < KEYWORD_RULES.length; i++) {
      if (KEYWORD_RULES[i].re.test(hay) && BY_ID[KEYWORD_RULES[i].id]) {
        return BY_ID[KEYWORD_RULES[i].id];
      }
    }
    return ALL_TOPICS[0];
  }

  root.PG_MASTERY_CURRICULUM = {
    version: '1.0.0',
    totalModules: MODULES.length,
    totalTopics: ALL_TOPICS.length,
    totalSteps: ALL_TOPICS.length * 3,
    modules: MODULES,
    topics: ALL_TOPICS,
    byId: BY_ID,
    bySlug: BY_SLUG,
    moduleById: MODULE_BY_ID,
    getTopic: function (idOrSlug) {
      return BY_ID[idOrSlug] || BY_SLUG[idOrSlug] || null;
    },
    getNextTopic: function (idOrSlug) {
      var curr = BY_ID[idOrSlug] || BY_SLUG[idOrSlug];
      if (!curr) return null;
      return ALL_TOPICS[curr.globalOrder] || null;
    },
    getPrevTopic: function (idOrSlug) {
      var curr = BY_ID[idOrSlug] || BY_SLUG[idOrSlug];
      if (!curr || curr.globalOrder <= 1) return null;
      return ALL_TOPICS[curr.globalOrder - 2] || null;
    },
    findRelatedPostgresLab: findRelatedPostgresLab
  };
  if (typeof globalThis !== 'undefined' && globalThis !== root) {
    globalThis.PG_MASTERY_CURRICULUM = root.PG_MASTERY_CURRICULUM;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
