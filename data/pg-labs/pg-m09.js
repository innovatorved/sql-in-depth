/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 09 (`pg-m09`): PostgreSQL System Catalogs & Live DB Introspection
 * 8 Hands-On Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m09'] = [
    /* ========================================================================
       LAB 01: pg-m09-t01 — information_schema vs pg_catalog: Navigating pg_class & relkind
       ======================================================================== */
    {
      id: 'pg-m09-t01',
      slug: 'pg-class-pg-namespace-relkind',
      moduleId: 'pg-m09',
      title: 'information_schema vs pg_catalog: Navigating pg_class & relkind',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_catalog.pg_class', 'pg_namespace', 'relkind', 'reltuples', 'relpages'],
      tags: ['pg-catalog', 'pg-class', 'pg-namespace', 'relkind', 'introspection'],
      guide: {
        mentalModel: 'Every relation-like object in PostgreSQL 18—ordinary heap tables (`\'r\'`), declarative partitioned parent tables (`\'p\'`), B-Tree/GIN/GiST indexes (`\'i\'`), partitioned indexes (`\'I\'`), sequences (`\'S\'`), views (`\'v\'`), materialized views (`\'m\'`), and out-of-line TOAST tables (`\'t\'`)—lives as a single row in `pg_catalog.pg_class`, scoped to a schema OID in `pg_catalog.pg_namespace`.\n\nWhile ANSI `information_schema` views are portable across engines, they intentionally omit PostgreSQL-specific objects (`MATERIALIZED VIEW`, indexes, sequences\' physical metadata, TOAST tables, and partition hierarchy flags) and wrap deep catalog joins with privilege checks that can slow down large-schema introspection. Production DBRE tooling queries `pg_class` and `pg_namespace` directly, reading `relpages` (8 KB blocks cached from the last `VACUUM`/`ANALYZE`) and `reltuples` (`float4` planner cardinality estimate; `-1` if never analyzed).',
        syntaxAnatomy: [
          'SELECT n.nspname AS schema_name,',
          '       c.relname AS relation_name,',
          '       c.relkind,',
          '       c.relpages,',
          '       c.reltuples::bigint AS est_rows',
          'FROM pg_catalog.pg_class c',
          'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
          'WHERE n.nspname = \'pg_ops\'',
          '  AND c.relkind IN (\'r\', \'p\', \'v\', \'m\')',
          'ORDER BY c.relname ASC;'
        ].join('\n'),
        internalsAndGotchas: [
          '`pg_class.relkind` is stored as PostgreSQL\'s single-byte internal `"char"` type: `\'r\'` = ordinary heap table (including leaf partitions!), `\'p\'` = partitioned parent table (`0` physical heap pages), `\'i\'` = index, `\'I\'` = partitioned index, `\'S\'` = sequence, `\'v\'` = view, `\'m\'` = materialized view, and `\'t\'` = TOAST table.',
          '`information_schema.tables` completely hides materialized views (`relkind = \'m\'`), indexes, and TOAST relations because the SQL standard has no concept of them.',
          '`c.reltuples` is an approximate `real` (`float4`) updated by `VACUUM`, `ANALYZE`, and `CREATE INDEX`—never mistake it for an exact transactional `COUNT(*)`, and watch out for `-1` on freshly created unanalyzed tables.',
          'Leaf partitions have `relkind = \'r\'` and `relispartition = true`, whereas declarative parent tables have `relkind = \'p\'` and `relhassubclass = true`.'
        ],
        whenToUse: 'Query `pg_catalog.pg_class` joined with `pg_catalog.pg_namespace` whenever building schema inventories, partition health checks, fast approximate row counts, or audit scripts that must see materialized views, indexes, and TOAST objects.'
      },
      scenario: {
        role: 'Platform Database Reliability Engineer (DBRE)',
        incidentOrGoal: 'An automated compliance crawler built on `information_schema.tables` missed partitioned indexes, sequences, and newly deployed materialized views in the `pg_ops` schema.',
        stakeholderNeed: 'Build three direct `pg_catalog` introspection queries: a `relkind` breakdown of `pg_ops`, a table/partition planner metadata report (`relpages`, `reltuples`, `relispartition`), and a proof query exposing objects hidden from `information_schema.tables`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Inventory Schema Objects by relkind in pg_class',
          mission: 'Join `pg_catalog.pg_class c` and `pg_catalog.pg_namespace n` for schema `\'pg_ops\'`. Group by `c.relkind` and project 3 columns in exact order: `relkind`, `object_category` (mapped via `CASE c.relkind`: `\'r\'` -> `\'ordinary_table\'`, `\'p\'` -> `\'partitioned_table\'`, `\'i\'` -> `\'index\'`, `\'I\'` -> `\'partitioned_index\'`, `\'S\'` -> `\'sequence\'`, `\'v\'` -> `\'view\'`, `\'m\'` -> `\'matview\'`, `\'t\'` -> `\'toast_table\'`, `ELSE \'other\'`), and `object_count` (`COUNT(*)`). Sort by `object_count DESC, c.relkind ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Inventory every object in pg_ops by pg_class.relkind',
            'SELECT c.relkind',
            '       -- TODO: add CASE c.relkind ... END AS object_category',
            '       -- TODO: add COUNT(*) AS object_count',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            'GROUP BY c.relkind',
            'ORDER BY c.relkind ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.relkind,',
            '       CASE c.relkind',
            '         WHEN \'r\' THEN \'ordinary_table\'',
            '         WHEN \'p\' THEN \'partitioned_table\'',
            '         WHEN \'i\' THEN \'index\'',
            '         WHEN \'I\' THEN \'partitioned_index\'',
            '         WHEN \'S\' THEN \'sequence\'',
            '         WHEN \'v\' THEN \'view\'',
            '         WHEN \'m\' THEN \'matview\'',
            '         WHEN \'t\' THEN \'toast_table\'',
            '         ELSE \'other\'',
            '       END AS object_category,',
            '       COUNT(*) AS object_count',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            'GROUP BY c.relkind',
            'ORDER BY object_count DESC, c.relkind ASC;'
          ].join('\n'),
          hints: [
            'Join `pg_catalog.pg_class c` to `pg_catalog.pg_namespace n` on `n.oid = c.relnamespace` and filter `WHERE n.nspname = \'pg_ops\'`.',
            'Note that `relkind` is case-sensitive: `\'i\'` is a physical index whereas uppercase `\'I\'` is a partitioned index, and `\'S\'` is a sequence.',
            'Project `c.relkind`, the `CASE c.relkind ... END AS object_category`, and `COUNT(*) AS object_count`, then `ORDER BY object_count DESC, c.relkind ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_class\\b', flags: 'i', message: 'Query `pg_catalog.pg_class`.' },
              { pattern: '\\bpg_namespace\\b', flags: 'i', message: 'Join `pg_catalog.pg_namespace` to filter by schema name.' },
              { pattern: '\\brelkind\\b', flags: 'i', message: 'Group and classify by `relkind`.' }
            ]
          },
          solutionExplanation: 'Joining `pg_class` to `pg_namespace` on `relnamespace = n.oid` surfaces all 56 catalog entries in `pg_ops`: 32 physical indexes (`\'i\'`), 21 ordinary/leaf heap tables (`\'r\'`), 1 partitioned table (`\'p\'`), 1 partitioned index (`\'I\'`), and 1 sequence (`\'S\'`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Partition Hierarchy Flags & Planner Cardinality in pg_class',
          mission: 'Inspect the declarative partition tree and archive table in `\'pg_ops\'` (`c.relname LIKE \'telemetry_%\'` and `c.relkind IN (\'r\', \'p\')`). Project 6 columns in exact order: `relname`, `relkind`, `has_child_partitions` (`c.relhassubclass`), `is_leaf_partition` (`c.relispartition`), `relpages`, and `est_tuples` (`c.reltuples::bigint`). Sort by `c.relkind DESC, c.relname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Compare parent partitioned table vs leaf partitions vs standalone archive table',
            'SELECT c.relname,',
            '       c.relkind',
            '       -- TODO: add c.relhassubclass AS has_child_partitions, c.relispartition AS is_leaf_partition',
            '       -- TODO: add c.relpages, c.reltuples::bigint AS est_tuples',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname LIKE \'telemetry_%\'',
            'ORDER BY c.relname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.relname,',
            '       c.relkind,',
            '       c.relhassubclass AS has_child_partitions,',
            '       c.relispartition AS is_leaf_partition,',
            '       c.relpages,',
            '       c.reltuples::bigint AS est_tuples',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname LIKE \'telemetry_%\'',
            '  AND c.relkind IN (\'r\', \'p\')',
            'ORDER BY c.relkind DESC, c.relname ASC;'
          ].join('\n'),
          hints: [
            'Filter `WHERE n.nspname = \'pg_ops\' AND c.relname LIKE \'telemetry_%\' AND c.relkind IN (\'r\', \'p\')` so indexes on those tables are excluded.',
            'Alias `c.relhassubclass AS has_child_partitions`, `c.relispartition AS is_leaf_partition`, and `c.reltuples::bigint AS est_tuples`.',
            'Sort with `ORDER BY c.relkind DESC, c.relname ASC` so the partitioned parent (`\'p\'`) appears first, followed by leaf partitions and the standalone archive table.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\brelhassubclass\\b', flags: 'i', message: 'Inspect `c.relhassubclass` to detect parent partitioned relations.' },
              { pattern: '\\brelispartition\\b', flags: 'i', message: 'Inspect `c.relispartition` to distinguish attached leaf partitions from standalone tables.' },
              { pattern: '\\breltuples\\b', flags: 'i', message: 'Project `c.reltuples::bigint AS est_tuples`.' }
            ]
          },
          solutionExplanation: '`telemetry_partitioned` (`relkind = \'p\'`) is purely a logical routing shell with `relpages = 0` and `relhassubclass = true`. Its three monthly children (`telemetry_2025_01..03`) are physical heaps (`relkind = \'r\'`, `relispartition = true`), while detached `telemetry_archive_2024_12` has `relispartition = false`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Exposing Materialized Views Hidden from information_schema.tables',
          mission: 'In this step\'s environment, both a view (`pg_ops.v_active_ledger`) and a materialized view (`pg_ops.mv_region_cpu`) exist alongside `pg_ops.telemetry_partitioned`. Query `pg_catalog.pg_class c` joined to `pg_catalog.pg_namespace n` (`n.nspname = \'pg_ops\'` and `c.relkind IN (\'p\', \'v\', \'m\')`), and `LEFT JOIN information_schema.tables ist` on `ist.table_schema = n.nspname AND ist.table_name = c.relname`. Project 4 columns in exact order: `relname`, `relkind`, `info_schema_type` (`COALESCE(ist.table_type, \'HIDDEN\')`), and `in_info_schema` (`ist.table_name IS NOT NULL`). Sort by `c.relname ASC`.',
          setupSql: [
            'CREATE VIEW pg_ops.v_active_ledger AS',
            '  SELECT account_id, account_code, balance_cents FROM pg_ops.ledger_accounts WHERE status = \'active\';',
            'CREATE MATERIALIZED VIEW pg_ops.mv_region_cpu AS',
            '  SELECT region, ROUND(AVG(cpu_pct), 2) AS avg_cpu FROM pg_ops.telemetry_partitioned GROUP BY region;'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- Compare pg_catalog.pg_class against information_schema.tables for (\'p\', \'v\', \'m\')',
            'SELECT c.relname,',
            '       c.relkind',
            '       -- TODO: LEFT JOIN information_schema.tables ist and project info_schema_type, in_info_schema',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relkind IN (\'p\', \'v\', \'m\')',
            'ORDER BY c.relname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.relname,',
            '       c.relkind,',
            '       COALESCE(ist.table_type, \'HIDDEN\') AS info_schema_type,',
            '       (ist.table_name IS NOT NULL) AS in_info_schema',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'LEFT JOIN information_schema.tables ist',
            '  ON ist.table_schema = n.nspname',
            ' AND ist.table_name = c.relname',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relkind IN (\'p\', \'v\', \'m\')',
            'ORDER BY c.relname ASC;'
          ].join('\n'),
          hints: [
            'Use `LEFT JOIN information_schema.tables ist ON ist.table_schema = n.nspname AND ist.table_name = c.relname` so catalog objects absent from `information_schema` still appear.',
            'Wrap `ist.table_type` with `COALESCE(ist.table_type, \'HIDDEN\') AS info_schema_type`.',
            'Compute `(ist.table_name IS NOT NULL) AS in_info_schema` and sort by `c.relname ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\binformation_schema\\.tables\\b', flags: 'i', message: 'LEFT JOIN `information_schema.tables` to compare ANSI visibility against `pg_class`.' },
              { pattern: '\\bLEFT\\s+(?:OUTER\\s+)?JOIN\\b', flags: 'i', message: 'Use `LEFT JOIN` so `mv_region_cpu` is preserved when `information_schema.tables` omits it.' }
            ]
          },
          solutionExplanation: '`v_active_ledger` (`\'v\'`) appears in `information_schema.tables` as `VIEW` and `telemetry_partitioned` (`\'p\'`) appears as `BASE TABLE`, whereas `mv_region_cpu` (`\'m\'`) returns `HIDDEN` / `false` because SQL-standard `information_schema` omits PostgreSQL materialized views.'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m09-t02 — Physical Column & Type Introspection: pg_attribute, pg_type & Alignment
       ======================================================================== */
    {
      id: 'pg-m09-t02',
      slug: 'pg-attribute-pg-type-column-layout',
      moduleId: 'pg-m09',
      title: 'Physical Column & Type Introspection: pg_attribute, pg_type & Alignment',
      difficulty: 'Intermediate',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_attribute', 'pg_type', 'format_type', 'attnum', 'attalign'],
      tags: ['pg-attribute', 'pg-type', 'column-padding', 'alignment', 'pg-catalog'],
      guide: {
        mentalModel: 'Every column of every relation in PostgreSQL is stored in `pg_catalog.pg_attribute` keyed by `(attrelid, attnum)`. System columns (`ctid`, `xmin`, `xmax`, `cmin`, `cmax`, `tableoid`) have **negative** `attnum` values (`-1` down to `-6`), while user-defined columns have `attnum >= 1` in exact physical on-disk tuple order.\n\nTwo catalog subtleties trip up engineers daily: first, `ALTER TABLE ... DROP COLUMN` does **not** rewrite the heap—it sets `attisdropped = true` and renames the slot to `........pg.dropped.N........`, leaving a permanent `attnum` gap until `VACUUM FULL`. Second, PostgreSQL aligns every fixed-width datum inside a heap tuple according to CPU struct alignment rules recorded in `attalign` (`\'d\'` = 8-byte double/int8/timestamptz, `\'i\'` = 4-byte int4/date, `\'s\'` = 2-byte int2, `\'c\'` = 1-byte bool/char; `attlen = -1` denotes variable-length `varlena` types like `TEXT`, `JSONB`, `NUMERIC`), meaning alternating `INTEGER` (`4B`) and `BIGINT` (`8B`) columns wastes 4 bytes of alignment padding per pair!',
        syntaxAnatomy: [
          'SELECT a.attnum,',
          '       a.attname,',
          '       pg_catalog.format_type(a.atttypid, a.atttypmod) AS sql_type,',
          '       a.attlen,',
          '       a.attalign,',
          '       a.attnotnull',
          'FROM pg_catalog.pg_attribute a',
          'JOIN pg_catalog.pg_class c ON c.oid = a.attrelid',
          'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
          'WHERE n.nspname = \'pg_ops\' AND c.relname = \'api_audit_events\'',
          '  AND a.attnum > 0 AND NOT a.attisdropped',
          'ORDER BY a.attnum ASC;'
        ].join('\n'),
        internalsAndGotchas: [
          'Always filter `a.attnum > 0 AND NOT a.attisdropped` when enumerating live user columns; omitting `attnum > 0` leaks hidden MVCC header attributes (`xmin`, `xmax`, `ctid`), and omitting `NOT a.attisdropped` leaks dropped-column tombstones.',
          'Prefer `pg_catalog.format_type(a.atttypid, a.atttypmod)` over raw `pg_type.typname`: `typname` shows `_text` or `numeric`, whereas `format_type` renders exact SQL modifiers like `text[]` and `numeric(12,2)`.',
          'Ordering fixed-width columns from largest alignment to smallest (`8-byte \'d\'` -> `4-byte \'i\'` -> `2-byte \'s\'` -> `1-byte \'c\'`, followed by nullable/varlena columns) eliminates CPU struct padding—a technique known as **Column Tetris**.',
          'In PostgreSQL 12+, `a.attgenerated = \'s\'` identifies `GENERATED ALWAYS AS (...) STORED` columns (and in PostgreSQL 18, `\'v\'` identifies virtual generated columns!).'
        ],
        whenToUse: 'Use `pg_attribute` + `pg_type` + `format_type()` when building schema diff tools, ORM code generators, struct-padding ("Column Tetris") optimizers, or auditing tables for accumulated dropped-column slots.'
      },
      scenario: {
        role: 'Storage & Schema Performance Engineer',
        incidentOrGoal: 'High-volume ingestion tables are being audited before a 10-billion-row migration to verify exact SQL types, eliminate 4-byte/8-byte alignment padding waste, and check for dropped-column ghosts.',
        stakeholderNeed: 'Deliver three `pg_attribute` introspection queries: full SQL/internal type mapping on `api_audit_events`, CPU alignment byte layout on `org_units`, and dropped + generated column slot inspection on `search_documents`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Exact SQL Type Formatting vs Internal pg_type Names',
          mission: 'Inspect the live user columns of `pg_ops.api_audit_events` (`a.attnum > 0 AND NOT a.attisdropped`) by joining `pg_catalog.pg_attribute a`, `pg_catalog.pg_class c`, `pg_catalog.pg_namespace n`, and `pg_catalog.pg_type t` (`t.oid = a.atttypid`). Project 5 columns in exact order: `attnum`, `attname`, `sql_type` (`pg_catalog.format_type(a.atttypid, a.atttypmod)`), `internal_typname` (`t.typname`), and `attnotnull`. Sort by `a.attnum ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Introspect live user columns of pg_ops.api_audit_events',
            'SELECT a.attnum,',
            '       a.attname',
            '       -- TODO: add format_type(a.atttypid, a.atttypmod) AS sql_type, t.typname AS internal_typname, a.attnotnull',
            'FROM pg_catalog.pg_attribute a',
            'JOIN pg_catalog.pg_class c ON c.oid = a.attrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname = \'api_audit_events\'',
            'ORDER BY a.attnum ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT a.attnum,',
            '       a.attname,',
            '       pg_catalog.format_type(a.atttypid, a.atttypmod) AS sql_type,',
            '       t.typname AS internal_typname,',
            '       a.attnotnull',
            'FROM pg_catalog.pg_attribute a',
            'JOIN pg_catalog.pg_class c ON c.oid = a.attrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'JOIN pg_catalog.pg_type t ON t.oid = a.atttypid',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname = \'api_audit_events\'',
            '  AND a.attnum > 0',
            '  AND NOT a.attisdropped',
            'ORDER BY a.attnum ASC;'
          ].join('\n'),
          hints: [
            'Join `pg_catalog.pg_type t ON t.oid = a.atttypid` so you can compare `format_type(a.atttypid, a.atttypmod)` against `t.typname`.',
            'Remember to filter `AND a.attnum > 0 AND NOT a.attisdropped` so negative system columns (`ctid`, `xmin`, `xmax`) are excluded.',
            'Alias `format_type(...) AS sql_type` and `t.typname AS internal_typname`, sorted by `a.attnum ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_attribute\\b', flags: 'i', message: 'Query `pg_catalog.pg_attribute`.' },
              { pattern: '\\bformat_type\\s*\\(', flags: 'i', message: 'Use `format_type(a.atttypid, a.atttypmod)` to render human-readable SQL types.' },
              { pattern: '\\battnum\\s*>\\s*0\\b', flags: 'i', message: 'Filter `a.attnum > 0` to exclude negative system columns.' }
            ]
          },
          solutionExplanation: 'Notice how `scopes` has `internal_typname = \'_text\'` (PostgreSQL prefixes internal array types with an underscore) while `format_type(a.atttypid, a.atttypmod)` cleanly renders `text[]`, and `created_at` (`timestamptz`) renders `timestamp with time zone`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — CPU Alignment Boundaries & Varlena Storage Widths (Column Tetris)',
          mission: 'Audit the physical column layout of `pg_ops.org_units` (`a.attnum > 0 AND NOT a.attisdropped`). Project 6 columns in exact order: `attnum`, `attname`, `sql_type` (`pg_catalog.format_type(a.atttypid, a.atttypmod)`), `attlen` (`-1` means variable-length `varlena`), `attalign`, and `align_bytes` (mapped via `CASE a.attalign`: `\'d\'` -> `8`, `\'i\'` -> `4`, `\'s\'` -> `2`, `\'c\'` -> `1`). Sort by `a.attnum ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Audit fixed width (attlen) and CPU alignment (attalign) on pg_ops.org_units',
            'SELECT a.attnum,',
            '       a.attname,',
            '       pg_catalog.format_type(a.atttypid, a.atttypmod) AS sql_type',
            '       -- TODO: add a.attlen, a.attalign, and CASE a.attalign ... END AS align_bytes',
            'FROM pg_catalog.pg_attribute a',
            'JOIN pg_catalog.pg_class c ON c.oid = a.attrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\' AND c.relname = \'org_units\'',
            '  AND a.attnum > 0 AND NOT a.attisdropped',
            'ORDER BY a.attnum ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT a.attnum,',
            '       a.attname,',
            '       pg_catalog.format_type(a.atttypid, a.atttypmod) AS sql_type,',
            '       a.attlen,',
            '       a.attalign,',
            '       CASE a.attalign',
            '         WHEN \'d\' THEN 8',
            '         WHEN \'i\' THEN 4',
            '         WHEN \'s\' THEN 2',
            '         WHEN \'c\' THEN 1',
            '       END AS align_bytes',
            'FROM pg_catalog.pg_attribute a',
            'JOIN pg_catalog.pg_class c ON c.oid = a.attrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname = \'org_units\'',
            '  AND a.attnum > 0',
            '  AND NOT a.attisdropped',
            'ORDER BY a.attnum ASC;'
          ].join('\n'),
          hints: [
            'Select `a.attlen` and `a.attalign` directly from `pg_catalog.pg_attribute a`.',
            'Decode `a.attalign` into integer byte boundaries: `WHEN \'d\' THEN 8 WHEN \'i\' THEN 4 WHEN \'s\' THEN 2 WHEN \'c\' THEN 1 END AS align_bytes`.',
            'Keep `a.attnum > 0 AND NOT a.attisdropped` and `ORDER BY a.attnum ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\battlen\\b', flags: 'i', message: 'Project `a.attlen` to distinguish fixed-size types from `-1` varlena types.' },
              { pattern: '\\battalign\\b', flags: 'i', message: 'Decode `a.attalign` into CPU byte alignment boundaries.' }
            ]
          },
          solutionExplanation: '`unit_id` and `headcount` are fixed 4-byte integers (`attlen = 4`, `attalign = \'i\'`), while `unit_code`, `org_path` (`ltree`), and `annual_budget_usd` (`numeric(12,2)`) are `varlena` structures (`attlen = -1`, `attalign = \'i\'` with 1-byte short varlena header support when uncompressed <= 126 bytes).'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Auditing Dropped-Column Tombstones & Stored Generated Columns',
          mission: 'In this step, `pg_ops.search_documents` had a legacy column added and dropped via `ALTER TABLE ... DROP COLUMN`. Query **all** positive `attnum > 0` slots on `pg_ops.search_documents` (including dropped columns!) and project 5 columns in exact order: `attnum`, `slot_label` (`CASE WHEN a.attisdropped THEN \'[DROPPED_SLOT]\' ELSE a.attname END`), `attisdropped`, `is_stored_generated` (`a.attgenerated = \'s\'`), and `sql_type` (`CASE WHEN a.attisdropped THEN NULL ELSE pg_catalog.format_type(a.atttypid, a.atttypmod) END`). Sort by `a.attnum ASC`.',
          setupSql: [
            'ALTER TABLE pg_ops.search_documents ADD COLUMN legacy_rank_cache INTEGER;',
            'ALTER TABLE pg_ops.search_documents DROP COLUMN legacy_rank_cache;'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- Inspect EVERY attnum > 0 slot on pg_ops.search_documents, including dropped tombstones',
            'SELECT a.attnum,',
            '       a.attname AS slot_label',
            '       -- TODO: mask dropped attname as \'[DROPPED_SLOT]\', add attisdropped, is_stored_generated, sql_type',
            'FROM pg_catalog.pg_attribute a',
            'JOIN pg_catalog.pg_class c ON c.oid = a.attrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\' AND c.relname = \'search_documents\'',
            '  AND a.attnum > 0',
            'ORDER BY a.attnum ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT a.attnum,',
            '       CASE WHEN a.attisdropped THEN \'[DROPPED_SLOT]\' ELSE a.attname END AS slot_label,',
            '       a.attisdropped,',
            '       (a.attgenerated = \'s\') AS is_stored_generated,',
            '       CASE WHEN a.attisdropped THEN NULL ELSE pg_catalog.format_type(a.atttypid, a.atttypmod) END AS sql_type',
            'FROM pg_catalog.pg_attribute a',
            'JOIN pg_catalog.pg_class c ON c.oid = a.attrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname = \'search_documents\'',
            '  AND a.attnum > 0',
            'ORDER BY a.attnum ASC;'
          ].join('\n'),
          hints: [
            'Do NOT filter `NOT a.attisdropped` here—we explicitly want to expose slot #8 left behind by `ALTER TABLE ... DROP COLUMN`.',
            'Mask internal dropped names (`........pg.dropped.8........`) using `CASE WHEN a.attisdropped THEN \'[DROPPED_SLOT]\' ELSE a.attname END AS slot_label`.',
            'Check `(a.attgenerated = \'s\') AS is_stored_generated` and return `NULL` for `sql_type` when `a.attisdropped` is true (since dropped slots zero `atttypid = 0`).'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\battisdropped\\b', flags: 'i', message: 'Inspect `a.attisdropped` to surface dropped-column tombstones.' },
              { pattern: '\\battgenerated\\b', flags: 'i', message: 'Check `a.attgenerated = \'s\'` to detect stored generated columns.' }
            ]
          },
          solutionExplanation: 'Slot 7 (`search_tsv`) shows `is_stored_generated = true` (`attgenerated = \'s\'`), while slot 8 remains permanently allocated in `pg_attribute` with `attisdropped = true` and `atttypid = 0` (`format_type(0, -1)` would return `\'-\'`), counting toward PostgreSQL\'s 1,600-column `MaxHeapAttributeNumber` limit until a table rewrite.'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m09-t03 — Disk & TOAST Footprint Auditing: pg_total_relation_size & Forks
       ======================================================================== */
    {
      id: 'pg-m09-t03',
      slug: 'relation-sizing-toast-storage',
      moduleId: 'pg-m09',
      title: 'Disk & TOAST Footprint Auditing: pg_total_relation_size & Forks',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_total_relation_size', 'pg_relation_size', 'pg_indexes_size', 'pg_size_pretty', 'reltoastrelid'],
      tags: ['disk-usage', 'toast', 'pg-size-pretty', 'storage', 'pg-catalog'],
      guide: {
        mentalModel: 'Every physical heap table in PostgreSQL is backed on disk by multiple **relation forks** plus optional companion relations: the `\'main\'` fork (8 KB heap data pages), the `\'fsm\'` Free Space Map fork (tracking available bytes per page for `INSERT`s and HOT updates), the `\'vm\'` Visibility Map fork (2 bits per page: all-visible for Index-Only Scans and all-frozen for wraparound skips), secondary indexes, and an out-of-line **TOAST** table (`c.reltoastrelid` in schema `pg_toast`) for oversized `varlena` values (`JSONB`, `TEXT`, `TSVECTOR` exceeding ~2 KB).\n\nPostgreSQL provides surgical C sizing functions that read exact OS file sizes in bytes: `pg_relation_size(oid, \'main\')` (just the main heap fork), `pg_table_size(oid)` (main + FSM + VM + initialization fork + TOAST table & TOAST index), `pg_indexes_size(oid)` (all secondary/PK indexes on the table), and `pg_total_relation_size(oid)` (`pg_table_size + pg_indexes_size`). Always sort and aggregate raw `BIGINT` byte counts first, applying `pg_size_pretty(...)` only for final human presentation!',
        syntaxAnatomy: [
          'SELECT c.relname,',
          '       pg_total_relation_size(c.oid) AS total_bytes,',
          '       pg_size_pretty(pg_total_relation_size(c.oid)) AS total_pretty,',
          '       pg_relation_size(c.oid, \'main\') AS main_heap_bytes,',
          '       pg_indexes_size(c.oid) AS indexes_bytes,',
          '       (c.reltoastrelid <> 0) AS has_toast_table',
          'FROM pg_catalog.pg_class c',
          'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
          'WHERE n.nspname = \'pg_ops\' AND c.relkind = \'r\'',
          'ORDER BY total_bytes DESC, c.relname ASC;'
        ].join('\n'),
        internalsAndGotchas: [
          'Never `ORDER BY pg_size_pretty(...) DESC`—that sorts alphabetically (`\'8192 bytes\'` > `\'64 kB\'` > `\'100 MB\'`)! Always sort by the raw `BIGINT` output of `pg_total_relation_size(c.oid)`.',
          'Calling `pg_total_relation_size` on a declarative partitioned parent (`relkind = \'p\'`) returns **`0` bytes** because physical storage lives on its child leaf partitions (`pg_partition_tree()`).',
          'A table acquires a `pg_toast` companion (`c.reltoastrelid <> 0`) at `CREATE TABLE` time whenever any column has a TOAST-capable `typstorage` (`\'x\'` extended or `\'e\'` external, such as `TEXT`, `JSONB`, `NUMERIC`), even before any row exceeds the ~2 KB `TOAST_TUPLE_THRESHOLD`.',
          'Verify the identity `pg_total_relation_size(oid) = pg_table_size(oid) + pg_indexes_size(oid)`; `pg_relation_size(oid)` alone excludes FSM, VM, TOAST, and indexes.'
        ],
        whenToUse: 'Use `pg_total_relation_size`, `pg_table_size`, `pg_relation_size(oid, fork)`, `pg_indexes_size`, and `reltoastrelid` during disk-capacity planning, index-vs-heap bloat attribution, and TOAST storage audits.'
      },
      scenario: {
        role: 'Cloud Storage & Capacity DBRE',
        incidentOrGoal: 'Finance requested an exact breakdown of `pg_ops` storage into heap forks, secondary indexes, and out-of-line TOAST chunks after noticing `api_audit_events` and `search_documents` consume 2.5× more disk than single-index tables.',
        stakeholderNeed: 'Deliver three storage attribution queries: top-5 tables ranked by raw total footprint, fork-level decomposition (`main`, `fsm`, `vm`, TOAST, indexes), and an out-of-line large payload TOAST trigger verification.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Ranking Ordinary Heap Tables by Total Footprint (Heap + TOAST + Indexes)',
          mission: 'Rank the top 5 ordinary heap tables (`c.relkind = \'r\'` and `NOT c.relispartition`) in schema `\'pg_ops\'` by total disk footprint. Project 6 columns in exact order: `relname`, `total_bytes` (`pg_total_relation_size(c.oid)`), `total_pretty` (`pg_size_pretty(pg_total_relation_size(c.oid))`), `table_bytes` (`pg_table_size(c.oid)`), `indexes_bytes` (`pg_indexes_size(c.oid)`), and `index_share_pct` (`ROUND(pg_indexes_size(c.oid)::numeric * 100 / NULLIF(pg_total_relation_size(c.oid), 0), 2)`). Sort by `total_bytes DESC, c.relname ASC` and `LIMIT 5`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Rank top 5 non-partition heap tables in pg_ops by pg_total_relation_size',
            'SELECT c.relname,',
            '       pg_total_relation_size(c.oid) AS total_bytes',
            '       -- TODO: add total_pretty, table_bytes, indexes_bytes, index_share_pct',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relkind = \'r\'',
            '  AND NOT c.relispartition',
            'ORDER BY total_bytes DESC, c.relname ASC',
            'LIMIT 5;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.relname,',
            '       pg_total_relation_size(c.oid) AS total_bytes,',
            '       pg_size_pretty(pg_total_relation_size(c.oid)) AS total_pretty,',
            '       pg_table_size(c.oid) AS table_bytes,',
            '       pg_indexes_size(c.oid) AS indexes_bytes,',
            '       ROUND(pg_indexes_size(c.oid)::numeric * 100 / NULLIF(pg_total_relation_size(c.oid), 0), 2) AS index_share_pct',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relkind = \'r\'',
            '  AND NOT c.relispartition',
            'ORDER BY total_bytes DESC, c.relname ASC',
            'LIMIT 5;'
          ].join('\n'),
          hints: [
            'Use `pg_total_relation_size(c.oid)`, `pg_size_pretty(pg_total_relation_size(c.oid))`, `pg_table_size(c.oid)`, and `pg_indexes_size(c.oid)`.',
            'Compute `ROUND(pg_indexes_size(c.oid)::numeric * 100 / NULLIF(pg_total_relation_size(c.oid), 0), 2) AS index_share_pct`.',
            'Sort by numeric `total_bytes DESC, c.relname ASC` (never by `total_pretty`) and apply `LIMIT 5`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bpg_total_relation_size\\s*\\(', flags: 'i', message: 'Use `pg_total_relation_size(c.oid)`.' },
              { pattern: '\\bpg_indexes_size\\s*\\(', flags: 'i', message: 'Use `pg_indexes_size(c.oid)` to isolate index footprint.' },
              { pattern: '\\bpg_size_pretty\\s*\\(', flags: 'i', message: 'Format human-readable bytes with `pg_size_pretty(...)`.' }
            ]
          },
          solutionExplanation: '`api_audit_events` and `search_documents` lead at 80 kB (`81920` bytes) each because their multiple GIN + PK indexes (`65536` bytes, or `80.00%` of total footprint) outweigh their single 8 KB heap page plus TOAST index.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Fork-by-Fork Decomposition (main, fsm, vm & reltoastrelid)',
          mission: 'Decompose the exact byte forks for 4 representative `pg_ops` tables (`c.relname IN (\'api_audit_events\', \'job_queue\', \'booking_requests\', \'telemetry_partitioned\')`). Project 7 columns in exact order: `relname`, `relkind`, `main_bytes` (`pg_relation_size(c.oid, \'main\')`), `fsm_bytes` (`pg_relation_size(c.oid, \'fsm\')`), `vm_bytes` (`pg_relation_size(c.oid, \'vm\')`), `has_toast` (`c.reltoastrelid <> 0`), and `toast_total_bytes` (`CASE WHEN c.reltoastrelid = 0 THEN 0 ELSE pg_total_relation_size(c.reltoastrelid) END`). Sort by `c.relname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Inspect main, fsm, vm forks and TOAST companion size for 4 pg_ops relations',
            'SELECT c.relname,',
            '       c.relkind,',
            '       pg_relation_size(c.oid, \'main\') AS main_bytes',
            '       -- TODO: add fsm_bytes, vm_bytes, has_toast, toast_total_bytes',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname IN (\'api_audit_events\', \'job_queue\', \'booking_requests\', \'telemetry_partitioned\')',
            'ORDER BY c.relname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.relname,',
            '       c.relkind,',
            '       pg_relation_size(c.oid, \'main\') AS main_bytes,',
            '       pg_relation_size(c.oid, \'fsm\') AS fsm_bytes,',
            '       pg_relation_size(c.oid, \'vm\') AS vm_bytes,',
            '       (c.reltoastrelid <> 0) AS has_toast,',
            '       CASE WHEN c.reltoastrelid = 0 THEN 0 ELSE pg_total_relation_size(c.reltoastrelid) END AS toast_total_bytes',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname IN (\'api_audit_events\', \'job_queue\', \'booking_requests\', \'telemetry_partitioned\')',
            'ORDER BY c.relname ASC;'
          ].join('\n'),
          hints: [
            'Call two-argument `pg_relation_size(c.oid, \'main\')`, `pg_relation_size(c.oid, \'fsm\')`, and `pg_relation_size(c.oid, \'vm\')`.',
            'Check `(c.reltoastrelid <> 0) AS has_toast`—`telemetry_partitioned` (`relkind = \'p\'`) has `reltoastrelid = 0`.',
            'Guard `pg_total_relation_size(c.reltoastrelid)` inside `CASE WHEN c.reltoastrelid = 0 THEN 0 ELSE ... END AS toast_total_bytes`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_relation_size\\s*\\([^)]*\'fsm\'', flags: 'i', message: 'Inspect the Free Space Map fork via `pg_relation_size(c.oid, \'fsm\')`.' },
              { pattern: '\\breltoastrelid\\b', flags: 'i', message: 'Use `c.reltoastrelid` to detect and measure companion `pg_toast` tables.' }
            ]
          },
          solutionExplanation: 'Even when a table\'s TOAST heap has 0 rows, `pg_total_relation_size(c.reltoastrelid)` reports `8192` bytes because every `pg_toast` table initializes an empty 1-page B-Tree index on `(chunk_id, chunk_seq)` at creation, while partitioned parent `telemetry_partitioned` (`\'p\'`) has `0` across all forks.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Observing Out-of-Line TOAST Storage (`STORAGE EXTERNAL` > 2 KB)',
          mission: 'In this step\'s setup, `pg_ops.incident_dump_audit` is created with an uncompressed `STORAGE EXTERNAL` column populated with a 12.5 KB stacktrace dump, forcing PostgreSQL to slice it into ~2 KB chunks inside `pg_toast`. Join `pg_catalog.pg_class c` (`n.nspname = \'pg_ops\' AND c.relname = \'incident_dump_audit\'`) to its TOAST table `pg_catalog.pg_class tc ON tc.oid = c.reltoastrelid` and TOAST namespace `pg_catalog.pg_namespace tn ON tn.oid = tc.relnamespace`. Project 5 columns in exact order: `table_name` (`c.relname`), `toast_schema` (`tn.nspname`), `main_heap_bytes` (`pg_relation_size(c.oid, \'main\')`), `toast_heap_bytes` (`pg_relation_size(tc.oid, \'main\')`), and `toast_index_bytes` (`pg_indexes_size(tc.oid)`).',
          setupSql: [
            'CREATE TABLE pg_ops.incident_dump_audit (',
            '  dump_id INTEGER PRIMARY KEY,',
            '  service_name TEXT NOT NULL,',
            '  raw_dump TEXT STORAGE EXTERNAL NOT NULL',
            ');',
            'INSERT INTO pg_ops.incident_dump_audit VALUES',
            '  (1, \'postgres-core\', REPEAT(\'STACKTRACE_FRAME_0x7FFF_\', 520));'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- Join incident_dump_audit (c) to its companion TOAST relation (tc) via c.reltoastrelid',
            'SELECT c.relname AS table_name',
            '       -- TODO: join tc and tn; project toast_schema, main_heap_bytes, toast_heap_bytes, toast_index_bytes',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\' AND c.relname = \'incident_dump_audit\';'
          ].join('\n'),
          solutionCode: [
            'SELECT c.relname AS table_name,',
            '       tn.nspname AS toast_schema,',
            '       pg_relation_size(c.oid, \'main\') AS main_heap_bytes,',
            '       pg_relation_size(tc.oid, \'main\') AS toast_heap_bytes,',
            '       pg_indexes_size(tc.oid) AS toast_index_bytes',
            'FROM pg_catalog.pg_class c',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'JOIN pg_catalog.pg_class tc ON tc.oid = c.reltoastrelid',
            'JOIN pg_catalog.pg_namespace tn ON tn.oid = tc.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname = \'incident_dump_audit\';'
          ].join('\n'),
          hints: [
            'Join `pg_catalog.pg_class tc ON tc.oid = c.reltoastrelid` and `pg_catalog.pg_namespace tn ON tn.oid = tc.relnamespace`.',
            'Measure the TOAST heap data fork with `pg_relation_size(tc.oid, \'main\') AS toast_heap_bytes` (`16384` bytes = two 8 KB TOAST pages!).',
            'Measure the TOAST chunk B-Tree index with `pg_indexes_size(tc.oid) AS toast_index_bytes`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\breltoastrelid\\b', flags: 'i', message: 'Join the companion TOAST table via `c.reltoastrelid`.' },
              { pattern: '\\bpg_indexes_size\\s*\\(\\s*tc\\.oid\\s*\\)', flags: 'i', message: 'Measure the TOAST B-Tree index via `pg_indexes_size(tc.oid)`.' }
            ]
          },
          solutionExplanation: 'Because `STORAGE EXTERNAL` disables pglz/lz4 inline compression and forces out-of-line storage once the tuple exceeds ~2 KB, the 12.5 KB string is split into ~2 KB chunks stored across two 8 KB pages in `pg_toast` (`toast_heap_bytes = 16384`, `toast_index_bytes = 16384`) while `incident_dump_audit`\'s main heap stays compact at `8192` bytes holding an 18-byte TOAST pointer.'
        }
      ]
    },

    /* ========================================================================
       LAB 04: pg-m09-t04 — pg_constraint Introspection & Automated Unindexed Foreign Key Audit
       ======================================================================== */
    {
      id: 'pg-m09-t04',
      slug: 'pg-constraint-unindexed-fk-audit',
      moduleId: 'pg-m09',
      title: 'pg_constraint Introspection & Automated Unindexed Foreign Key Audit',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_constraint', 'contype', 'conkey', 'pg_index.indkey', 'pg_get_constraintdef'],
      tags: ['pg-constraint', 'unindexed-foreign-keys', 'audit', 'locks', 'pg-catalog'],
      guide: {
        mentalModel: 'PostgreSQL automatically creates a B-Tree index for every `PRIMARY KEY` (`contype = \'p\'`) and `UNIQUE` constraint (`contype = \'u\'`)—and a GiST/SP-GiST index for every `EXCLUDE` constraint (`contype = \'x\'`)—but **never** automatically creates an index on the referencing child columns of a `FOREIGN KEY` (`contype = \'f\'`).\n\nWhen a parent row in `incident_warehouses` is `DELETE`d (or its PK is `UPDATE`d), PostgreSQL\'s referential-integrity trigger must verify or `ON DELETE CASCADE` child rows in `incident_shipments`. Without an index whose leftmost key prefix matches `pg_constraint.conkey`, every parent `DELETE` executes a full **Sequential Scan** on the child table—turning batch parent cleanups into quadratic CPU storms and prolonged row-lock contention. Auditing `pg_constraint.conkey` (`int2[]`, 1-based) against `(pg_index.indkey::int[])[1:cardinality(con.conkey)]` (casting `int2vector` from 0-based to 1-based `int[]`) is a mandatory DBRE CI gate.',
        syntaxAnatomy: [
          'SELECT n.nspname AS schema_name,',
          '       c.relname AS child_table,',
          '       con.conname AS fk_name,',
          '       pg_catalog.pg_get_constraintdef(con.oid) AS fk_def',
          'FROM pg_catalog.pg_constraint con',
          'JOIN pg_catalog.pg_class c ON c.oid = con.conrelid',
          'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
          'WHERE con.contype = \'f\'',
          '  AND NOT EXISTS (',
          '    SELECT 1 FROM pg_catalog.pg_index i',
          '    WHERE i.indrelid = con.conrelid AND i.indisvalid AND i.indpred IS NULL',
          '      AND (i.indkey::int[])[1:cardinality(con.conkey)] = con.conkey::int[]',
          '  );'
        ].join('\n'),
        internalsAndGotchas: [
          '`pg_index.indkey` is an internal **`int2vector`** with **0-based** subscripts (`indkey[0]`), whereas `pg_constraint.conkey` is a standard **`smallint[]`** (`int2[]`) with **1-based** subscripts (`conkey[1]`). Always cast `i.indkey::int[]` and `con.conkey::int[]` before slicing `[1:cardinality(con.conkey)]`!',
          'A composite index on `(account_id, created_at)` **does** cover a single-column FK on `(account_id)` because `account_id` is its leftmost prefix, whereas an index on `(created_at, account_id)` does **not** cleanly support `WHERE account_id = $1` trigger probes.',
          'Exclude partial indexes (`i.indpred IS NULL`) and invalid indexes (`i.indisvalid = true`) from FK coverage checks—a partial index cannot guarantee coverage for arbitrary parent key deletions.',
          '`con.confdeltype` encodes `ON DELETE` behavior: `\'a\'` = `NO ACTION`, `\'r\'` = `RESTRICT`, `\'c\'` = `CASCADE`, `\'n\'` = `SET NULL`, `\'d\'` = `SET DEFAULT`.'
        ],
        whenToUse: 'Run `pg_constraint` + `pg_index` leftmost-prefix audits in CI migration pipelines and production health checks to catch unindexed foreign keys before parent `DELETE` or `ON DELETE CASCADE` jobs stall OLTP traffic.'
      },
      scenario: {
        role: 'Principal Database Reliability Engineer',
        incidentOrGoal: 'Deleting retired warehouse records triggered unexpected sequential scans on child tables, prompting an immediate catalog audit of constraints, `ON DELETE` rules, and unindexed foreign keys across `pg_ops` and `public`.',
        stakeholderNeed: 'Deliver three `pg_constraint` queries: full constraint classification with `pg_get_constraintdef`, FK parent-child `confdeltype` wiring, and an automated leftmost-prefix unindexed FK detector.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Classifying Constraints & Reconstructing DDL via pg_get_constraintdef',
          mission: 'Inspect all table constraints on `pg_ops` tables `\'room_bookings\'`, `\'incident_warehouses\'`, and `\'incident_shipments\'`. Join `pg_catalog.pg_constraint con`, `pg_catalog.pg_class c` (`c.oid = con.conrelid`), and `pg_catalog.pg_namespace n` (`n.nspname = \'pg_ops\'`). Project 5 columns in exact order: `table_name` (`c.relname`), `conname`, `contype`, `constraint_kind` (`CASE con.contype`: `\'p\'` -> `\'PRIMARY_KEY\'`, `\'u\'` -> `\'UNIQUE\'`, `\'f\'` -> `\'FOREIGN_KEY\'`, `\'x\'` -> `\'EXCLUDE\'`, `\'c\'` -> `\'CHECK\'`, `ELSE \'OTHER\'`), and `constraint_def` (`pg_catalog.pg_get_constraintdef(con.oid)`). Sort by `c.relname ASC, con.contype ASC, con.conname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Audit all constraints on room_bookings, incident_warehouses, and incident_shipments',
            'SELECT c.relname AS table_name,',
            '       con.conname,',
            '       con.contype',
            '       -- TODO: add constraint_kind CASE and pg_get_constraintdef(con.oid) AS constraint_def',
            'FROM pg_catalog.pg_constraint con',
            'JOIN pg_catalog.pg_class c ON c.oid = con.conrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname IN (\'room_bookings\', \'incident_warehouses\', \'incident_shipments\')',
            'ORDER BY c.relname ASC, con.contype ASC, con.conname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.relname AS table_name,',
            '       con.conname,',
            '       con.contype,',
            '       CASE con.contype',
            '         WHEN \'p\' THEN \'PRIMARY_KEY\'',
            '         WHEN \'u\' THEN \'UNIQUE\'',
            '         WHEN \'f\' THEN \'FOREIGN_KEY\'',
            '         WHEN \'x\' THEN \'EXCLUDE\'',
            '         WHEN \'c\' THEN \'CHECK\'',
            '         ELSE \'OTHER\'',
            '       END AS constraint_kind,',
            '       pg_catalog.pg_get_constraintdef(con.oid) AS constraint_def',
            'FROM pg_catalog.pg_constraint con',
            'JOIN pg_catalog.pg_class c ON c.oid = con.conrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND c.relname IN (\'room_bookings\', \'incident_warehouses\', \'incident_shipments\')',
            'ORDER BY c.relname ASC, con.contype ASC, con.conname ASC;'
          ].join('\n'),
          hints: [
            'Join `pg_catalog.pg_constraint con` to `pg_catalog.pg_class c ON c.oid = con.conrelid` and `pg_catalog.pg_namespace n ON n.oid = c.relnamespace`.',
            'Decode `con.contype` (`\'p\'`, `\'u\'`, `\'f\'`, `\'x\'`, `\'c\'`) into `AS constraint_kind`.',
            'Call `pg_catalog.pg_get_constraintdef(con.oid) AS constraint_def` to reconstruct exact canonical SQL DDL.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_constraint\\b', flags: 'i', message: 'Query `pg_catalog.pg_constraint`.' },
              { pattern: '\\bpg_get_constraintdef\\s*\\(', flags: 'i', message: 'Use `pg_get_constraintdef(con.oid)` to decompile constraint definitions.' }
            ]
          },
          solutionExplanation: '`pg_get_constraintdef(con.oid)` decompiles PostgreSQL\'s internal catalog representation back into canonical SQL—including `EXCLUDE USING gist (room_name WITH =, during WITH &&)` (`contype = \'x\'`) on `room_bookings` and `ON DELETE CASCADE` (`contype = \'f\'`) on `incident_shipments`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Tracing Foreign Key Parent-Child Graphs & ON DELETE Rules',
          mission: 'Inspect foreign key constraints (`con.contype = \'f\'`) on child tables `c.relname IN (\'incident_shipments\', \'journal_entries\', \'merchant_txns\', \'follows\')` across schemas `n.nspname IN (\'pg_ops\', \'public\')`. Join both the child table (`c.oid = con.conrelid`) and the referenced parent table (`pc.oid = con.confrelid`). Project 6 columns in exact order: `schema_name` (`n.nspname`), `child_table` (`c.relname`), `conname`, `parent_table` (`pc.relname`), `on_delete_action` (`CASE con.confdeltype WHEN \'c\' THEN \'CASCADE\' WHEN \'r\' THEN \'RESTRICT\' WHEN \'n\' THEN \'SET_NULL\' ELSE \'NO_ACTION\' END`), and `fk_attnums` (`con.conkey::int[]`). Sort by `n.nspname ASC, c.relname ASC, con.conname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Trace child -> parent FK edges, ON DELETE rules, and conkey column numbers',
            'SELECT n.nspname AS schema_name,',
            '       c.relname AS child_table,',
            '       con.conname',
            '       -- TODO: join parent pg_class pc ON pc.oid = con.confrelid; add parent_table, on_delete_action, fk_attnums',
            'FROM pg_catalog.pg_constraint con',
            'JOIN pg_catalog.pg_class c ON c.oid = con.conrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE con.contype = \'f\'',
            '  AND n.nspname IN (\'pg_ops\', \'public\')',
            '  AND c.relname IN (\'incident_shipments\', \'journal_entries\', \'merchant_txns\', \'follows\')',
            'ORDER BY n.nspname ASC, c.relname ASC, con.conname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT n.nspname AS schema_name,',
            '       c.relname AS child_table,',
            '       con.conname,',
            '       pc.relname AS parent_table,',
            '       CASE con.confdeltype',
            '         WHEN \'c\' THEN \'CASCADE\'',
            '         WHEN \'r\' THEN \'RESTRICT\'',
            '         WHEN \'n\' THEN \'SET_NULL\'',
            '         ELSE \'NO_ACTION\'',
            '       END AS on_delete_action,',
            '       con.conkey::int[] AS fk_attnums',
            'FROM pg_catalog.pg_constraint con',
            'JOIN pg_catalog.pg_class c ON c.oid = con.conrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'JOIN pg_catalog.pg_class pc ON pc.oid = con.confrelid',
            'WHERE con.contype = \'f\'',
            '  AND n.nspname IN (\'pg_ops\', \'public\')',
            '  AND c.relname IN (\'incident_shipments\', \'journal_entries\', \'merchant_txns\', \'follows\')',
            'ORDER BY n.nspname ASC, c.relname ASC, con.conname ASC;'
          ].join('\n'),
          hints: [
            'Join a second `pg_catalog.pg_class pc ON pc.oid = con.confrelid` to get the referenced `parent_table`.',
            'Decode `con.confdeltype` (`\'c\'` -> `\'CASCADE\'`, `\'r\'` -> `\'RESTRICT\'`, `\'n\'` -> `\'SET_NULL\'`, `ELSE \'NO_ACTION\'`).',
            'Cast `con.conkey::int[] AS fk_attnums` so `smallint[]` normalizes cleanly to standard `int[]`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bconfrelid\\b', flags: 'i', message: 'Join the referenced parent table via `con.confrelid`.' },
              { pattern: '\\bconfdeltype\\b', flags: 'i', message: 'Decode `con.confdeltype` to inspect `ON DELETE` trigger behavior.' },
              { pattern: '\\bconkey\\b', flags: 'i', message: 'Project `con.conkey::int[]` to inspect referencing `attnum` positions.' }
            ]
          },
          solutionExplanation: '`con.conrelid` points to the referencing child table while `con.confrelid` points to the referenced parent table, and `con.conkey` records the exact `pg_attribute.attnum` array on the child table that must be covered by an index prefix.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Automated Unindexed Foreign Key Detector (conkey vs indkey Prefix)',
          mission: 'Write the canonical DBRE unindexed-FK detector across `n.nspname IN (\'pg_ops\', \'public\')` for child tables `c.relname IN (\'incident_shipments\', \'journal_entries\', \'merchant_txns\', \'follows\', \'cards\')`. Return **only** foreign keys (`con.contype = \'f\'`) that have **no** valid (`i.indisvalid`), non-partial (`i.indpred IS NULL`) index on `con.conrelid` whose leftmost key slice `(i.indkey::int[])[1:cardinality(con.conkey)]` equals `con.conkey::int[]`. Project 4 columns in exact order: `schema_name` (`n.nspname`), `child_table` (`c.relname`), `conname`, and `constraint_def` (`pg_catalog.pg_get_constraintdef(con.oid)`). Sort by `n.nspname ASC, c.relname ASC, con.conname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Return ONLY foreign keys lacking a valid, non-partial leftmost-prefix index',
            'SELECT n.nspname AS schema_name,',
            '       c.relname AS child_table,',
            '       con.conname,',
            '       pg_catalog.pg_get_constraintdef(con.oid) AS constraint_def',
            'FROM pg_catalog.pg_constraint con',
            'JOIN pg_catalog.pg_class c ON c.oid = con.conrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE con.contype = \'f\'',
            '  AND n.nspname IN (\'pg_ops\', \'public\')',
            '  AND c.relname IN (\'incident_shipments\', \'journal_entries\', \'merchant_txns\', \'follows\', \'cards\')',
            '  -- TODO: add AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_index i WHERE ...)',
            'ORDER BY n.nspname ASC, c.relname ASC, con.conname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT n.nspname AS schema_name,',
            '       c.relname AS child_table,',
            '       con.conname,',
            '       pg_catalog.pg_get_constraintdef(con.oid) AS constraint_def',
            'FROM pg_catalog.pg_constraint con',
            'JOIN pg_catalog.pg_class c ON c.oid = con.conrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
            'WHERE con.contype = \'f\'',
            '  AND n.nspname IN (\'pg_ops\', \'public\')',
            '  AND c.relname IN (\'incident_shipments\', \'journal_entries\', \'merchant_txns\', \'follows\', \'cards\')',
            '  AND NOT EXISTS (',
            '    SELECT 1',
            '    FROM pg_catalog.pg_index i',
            '    WHERE i.indrelid = con.conrelid',
            '      AND i.indisvalid',
            '      AND i.indpred IS NULL',
            '      AND (i.indkey::int[])[1:cardinality(con.conkey)] = con.conkey::int[]',
            '  )',
            'ORDER BY n.nspname ASC, c.relname ASC, con.conname ASC;'
          ].join('\n'),
          hints: [
            'Filter with `AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_index i WHERE i.indrelid = con.conrelid ...)`.',
            'Inside `NOT EXISTS`, require `i.indisvalid` and `i.indpred IS NULL` so broken or partial indexes do not mask missing FK indexes.',
            'Cast `int2vector` to `int[]` before 1-based slicing: `(i.indkey::int[])[1:cardinality(con.conkey)] = con.conkey::int[]`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bNOT\\s+EXISTS\\b', flags: 'i', message: 'Use `NOT EXISTS` against `pg_catalog.pg_index` to isolate unindexed FKs.' },
              { pattern: '\\bindkey\\b', flags: 'i', message: 'Compare `pg_index.indkey` leftmost prefix against `con.conkey`.' }
            ]
          },
          solutionExplanation: 'Out of 7 foreign keys across those 5 tables, 3 are safely covered by leftmost prefixes (`idx_journal_account` on `(account_id, created_at)`, `idx_mtxn_card_ts` on `(card_id, txn_ts)`, and `follows_pkey` on `(follower_id, followee_id)`), while the remaining 4—including `incident_shipments_warehouse_id_fkey` (`ON DELETE CASCADE`) and `follows_followee_id_fkey` (2nd column of composite PK)—are caught as unindexed!'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m09-t05 — Deep Index Catalog Audit: pg_index, indisvalid, Expressions & Predicates
       ======================================================================== */
    {
      id: 'pg-m09-t05',
      slug: 'pg-index-indisvalid-properties',
      moduleId: 'pg-m09',
      title: 'Deep Index Catalog Audit: pg_index, indisvalid, Expressions & Predicates',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_index', 'pg_indexes', 'pg_am', 'indisvalid', 'pg_get_indexdef'],
      tags: ['pg-index', 'pg-am', 'indisvalid', 'partial-index', 'pg-catalog'],
      guide: {
        mentalModel: 'Every index in PostgreSQL has **two** catalog rows: a relation entry in `pg_catalog.pg_class` (`relkind IN (\'i\', \'I\')`, whose `relam` points to `pg_catalog.pg_am`: `btree`, `gin`, `gist`, `brin`, `hash`, `spgist`) and a structural metadata row in `pg_catalog.pg_index` (`indexrelid` = index OID, `indrelid` = parent table OID).\n\n`pg_index` exposes critical internals that high-level `pg_indexes` text views hide: `indisvalid` (`false` when a `CREATE INDEX CONCURRENTLY` or `REINDEX CONCURRENTLY` failed mid-build—still maintained or holding catalog weight while ignored by the query planner!), `indnkeyatts` vs `indnatts` (separating searchable key columns from `INCLUDE (...)` non-key payload columns introduced for Index-Only Scans), `indpred` (serialized `WHERE` parse tree for partial indexes), and `indexprs` (serialized expression parse tree for functional indexes).',
        syntaxAnatomy: [
          'SELECT tc.relname AS table_name,',
          '       ic.relname AS index_name,',
          '       am.amname AS access_method,',
          '       i.indisvalid,',
          '       i.indnkeyatts AS key_cols,',
          '       (i.indnatts - i.indnkeyatts) AS included_cols,',
          '       (i.indpred IS NOT NULL) AS is_partial,',
          '       (i.indexprs IS NOT NULL) AS is_expression',
          'FROM pg_catalog.pg_index i',
          'JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid',
          'JOIN pg_catalog.pg_class tc ON tc.oid = i.indrelid',
          'JOIN pg_catalog.pg_am am ON am.oid = ic.relam;'
        ].join('\n'),
        internalsAndGotchas: [
          'An index with `indisvalid = false` is **never** chosen by the query planner for `SELECT` queries, yet if `indisready = true` it can still incur write overhead on `INSERT`/`UPDATE`! Always drop or `REINDEX CONCURRENTLY` invalid indexes promptly.',
          'In PostgreSQL 11+, `i.indnatts` is total columns (`key + INCLUDE`), while `i.indnkeyatts` is strictly the searchable key columns; therefore `(i.indnatts - i.indnkeyatts)` gives the exact number of `INCLUDE` payload columns.',
          'For functional expression columns (e.g. `LOWER(email)`), the corresponding entry in `i.indkey` is `0`, and the expression AST is stored in `i.indexprs` (`pg_get_expr(i.indexprs, i.indrelid)` renders it cleanly!).',
          'Partitioned parent indexes have `ic.relkind = \'I\'` and `ic.relpages = 0`; filter `ic.relkind = \'i\'` when auditing physical leaf/table index files.'
        ],
        whenToUse: 'Query `pg_index` joined with `pg_class` and `pg_am` when auditing index access methods, verifying partial/expression/covering `INCLUDE` designs, or hunting leftover `indisvalid = false` failed concurrent builds.'
      },
      scenario: {
        role: 'Query Optimizer & Indexing Specialist',
        incidentOrGoal: 'Platform engineering wants a structural audit of every GIN, GiST, partial, expression, and covering `INCLUDE` index in `pg_ops` without parsing regexes over `CREATE INDEX` text.',
        stakeholderNeed: 'Write three `pg_index` + `pg_am` queries: an access-method distribution summary, a non-PK index capability matrix (`is_partial`, `is_expression`, `pg_get_indexdef`), and a covering `INCLUDE` vs key-column audit.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Auditing Index Access Methods (pg_am: btree, gin, gist)',
          mission: 'Join `pg_catalog.pg_index i`, index `pg_catalog.pg_class ic` (`ic.oid = i.indexrelid`), parent table `pg_catalog.pg_class tc` (`tc.oid = i.indrelid`), `pg_catalog.pg_namespace n` (`n.oid = tc.relnamespace`), and `pg_catalog.pg_am am` (`am.oid = ic.relam`). Filter to physical indexes (`ic.relkind = \'i\'`) on non-partition tables (`NOT tc.relispartition`) in schema `\'pg_ops\'`. Group by `am.amname` and project 4 columns in exact order: `access_method` (`am.amname`), `index_count` (`COUNT(*)`), `unique_count` (`COUNT(*) FILTER (WHERE i.indisunique)`), and `partial_count` (`COUNT(*) FILTER (WHERE i.indpred IS NOT NULL)`). Sort by `index_count DESC, am.amname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Summarize physical indexes in pg_ops (excluding leaf partitions) by pg_am.amname',
            'SELECT am.amname AS access_method,',
            '       COUNT(*) AS index_count',
            '       -- TODO: add unique_count and partial_count using FILTER (WHERE ...)',
            'FROM pg_catalog.pg_index i',
            'JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid',
            'JOIN pg_catalog.pg_class tc ON tc.oid = i.indrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = tc.relnamespace',
            'JOIN pg_catalog.pg_am am ON am.oid = ic.relam',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND ic.relkind = \'i\'',
            '  AND NOT tc.relispartition',
            'GROUP BY am.amname',
            'ORDER BY index_count DESC, am.amname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT am.amname AS access_method,',
            '       COUNT(*) AS index_count,',
            '       COUNT(*) FILTER (WHERE i.indisunique) AS unique_count,',
            '       COUNT(*) FILTER (WHERE i.indpred IS NOT NULL) AS partial_count',
            'FROM pg_catalog.pg_index i',
            'JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid',
            'JOIN pg_catalog.pg_class tc ON tc.oid = i.indrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = tc.relnamespace',
            'JOIN pg_catalog.pg_am am ON am.oid = ic.relam',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND ic.relkind = \'i\'',
            '  AND NOT tc.relispartition',
            'GROUP BY am.amname',
            'ORDER BY index_count DESC, am.amname ASC;'
          ].join('\n'),
          hints: [
            'Notice `ic.relam` (on the index\'s `pg_class` row, not the table\'s!) joins to `pg_catalog.pg_am am ON am.oid = ic.relam`.',
            'Use `COUNT(*) FILTER (WHERE i.indisunique) AS unique_count` to count unique/PK indexes per access method.',
            'Use `COUNT(*) FILTER (WHERE i.indpred IS NOT NULL) AS partial_count` to count partial indexes with `WHERE` predicates.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_index\\b', flags: 'i', message: 'Query `pg_catalog.pg_index`.' },
              { pattern: '\\bpg_am\\b', flags: 'i', message: 'Join `pg_catalog.pg_am` to inspect access method names (`btree`, `gin`, `gist`).' },
              { pattern: '\\bindpred\\b', flags: 'i', message: 'Check `i.indpred IS NOT NULL` to count partial indexes.' }
            ]
          },
          solutionExplanation: '`pg_ops` contains 21 B-Tree indexes (20 unique PK/UNIQUE constraints + 1 partial queue index `idx_job_queue_pending` + `idx_incident_shipments_carrier`), 4 GIN inverted indexes (`JSONB`, `TEXT[]`, `TSVECTOR`, `pg_trgm`), and 2 GiST indexes (`LTREE` hierarchy + `TSTZRANGE` exclusion constraint).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Inspecting Non-Primary Indexes, Partial Predicates & Operator Classes',
          mission: 'List every **non-primary** physical index (`NOT i.indisprimary`, `ic.relkind = \'i\'`, `NOT tc.relispartition`) in schema `\'pg_ops\'`. Project 6 columns in exact order: `table_name` (`tc.relname`), `index_name` (`ic.relname`), `access_method` (`am.amname`), `indisunique`, `is_partial` (`i.indpred IS NOT NULL`), and `predicate_sql` (`pg_catalog.pg_get_expr(i.indpred, i.indrelid)`). Sort by `tc.relname ASC, ic.relname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Audit all non-primary indexes in pg_ops and decompile partial WHERE predicates',
            'SELECT tc.relname AS table_name,',
            '       ic.relname AS index_name,',
            '       am.amname AS access_method',
            '       -- TODO: add i.indisunique, (i.indpred IS NOT NULL) AS is_partial, pg_get_expr(i.indpred, i.indrelid) AS predicate_sql',
            'FROM pg_catalog.pg_index i',
            'JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid',
            'JOIN pg_catalog.pg_class tc ON tc.oid = i.indrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = tc.relnamespace',
            'JOIN pg_catalog.pg_am am ON am.oid = ic.relam',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND ic.relkind = \'i\'',
            '  AND NOT tc.relispartition',
            '  AND NOT i.indisprimary',
            'ORDER BY tc.relname ASC, ic.relname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT tc.relname AS table_name,',
            '       ic.relname AS index_name,',
            '       am.amname AS access_method,',
            '       i.indisunique,',
            '       (i.indpred IS NOT NULL) AS is_partial,',
            '       pg_catalog.pg_get_expr(i.indpred, i.indrelid) AS predicate_sql',
            'FROM pg_catalog.pg_index i',
            'JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid',
            'JOIN pg_catalog.pg_class tc ON tc.oid = i.indrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = tc.relnamespace',
            'JOIN pg_catalog.pg_am am ON am.oid = ic.relam',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND ic.relkind = \'i\'',
            '  AND NOT tc.relispartition',
            '  AND NOT i.indisprimary',
            'ORDER BY tc.relname ASC, ic.relname ASC;'
          ].join('\n'),
          hints: [
            'Filter `AND NOT i.indisprimary` to isolate secondary, unique, exclusion, GIN, and GiST indexes.',
            'Project `(i.indpred IS NOT NULL) AS is_partial` as a boolean flag.',
            'Call `pg_catalog.pg_get_expr(i.indpred, i.indrelid) AS predicate_sql`—it safely returns `NULL` when `i.indpred` is `NULL` and renders `(status = \'pending\'::text)` on `idx_job_queue_pending`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bindisprimary\\b', flags: 'i', message: 'Filter out primary key indexes with `NOT i.indisprimary`.' },
              { pattern: '\\bpg_get_expr\\s*\\(', flags: 'i', message: 'Decompile `i.indpred` with `pg_get_expr(i.indpred, i.indrelid)`.' }
            ]
          },
          solutionExplanation: '`pg_get_expr(i.indpred, i.indrelid)` decompiles PostgreSQL\'s internal node tree directly against `indrelid`\'s attribute numbers, revealing `(status = \'pending\'::text)` on `idx_job_queue_pending` without fragile string parsing.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Separating Key Columns vs INCLUDE Payloads & Expression ASTs',
          mission: 'In this step\'s setup, two specialized indexes are added to `pg_ops.ledger_accounts`: a covering index `idx_ledger_code_incl_bal` (`(account_code) INCLUDE (balance_cents, status)`) and a functional index `idx_ledger_lower_tenant` (`(LOWER(owner_tenant))`). Audit all indexes on `pg_ops.ledger_accounts` and project 7 columns in exact order: `index_name` (`ic.relname`), `indisvalid`, `key_col_count` (`i.indnkeyatts`), `included_col_count` (`i.indnatts - i.indnkeyatts`), `has_expression` (`i.indexprs IS NOT NULL`), `expr_sql` (`pg_catalog.pg_get_expr(i.indexprs, i.indrelid)`), and `index_def` (`pg_catalog.pg_get_indexdef(i.indexrelid)`). Sort by `ic.relname ASC`.',
          setupSql: [
            'CREATE INDEX idx_ledger_code_incl_bal ON pg_ops.ledger_accounts (account_code) INCLUDE (balance_cents, status);',
            'CREATE INDEX idx_ledger_lower_tenant ON pg_ops.ledger_accounts (LOWER(owner_tenant));'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- Compare key columns, INCLUDE payload columns, and expression ASTs on pg_ops.ledger_accounts',
            'SELECT ic.relname AS index_name,',
            '       i.indisvalid',
            '       -- TODO: add key_col_count, included_col_count, has_expression, expr_sql, index_def',
            'FROM pg_catalog.pg_index i',
            'JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid',
            'JOIN pg_catalog.pg_class tc ON tc.oid = i.indrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = tc.relnamespace',
            'WHERE n.nspname = \'pg_ops\' AND tc.relname = \'ledger_accounts\'',
            'ORDER BY ic.relname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT ic.relname AS index_name,',
            '       i.indisvalid,',
            '       i.indnkeyatts AS key_col_count,',
            '       (i.indnatts - i.indnkeyatts) AS included_col_count,',
            '       (i.indexprs IS NOT NULL) AS has_expression,',
            '       pg_catalog.pg_get_expr(i.indexprs, i.indrelid) AS expr_sql,',
            '       pg_catalog.pg_get_indexdef(i.indexrelid) AS index_def',
            'FROM pg_catalog.pg_index i',
            'JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid',
            'JOIN pg_catalog.pg_class tc ON tc.oid = i.indrelid',
            'JOIN pg_catalog.pg_namespace n ON n.oid = tc.relnamespace',
            'WHERE n.nspname = \'pg_ops\'',
            '  AND tc.relname = \'ledger_accounts\'',
            'ORDER BY ic.relname ASC;'
          ].join('\n'),
          hints: [
            'Use `i.indnkeyatts AS key_col_count` and `(i.indnatts - i.indnkeyatts) AS included_col_count`.',
            'Check `(i.indexprs IS NOT NULL) AS has_expression` and decompile with `pg_catalog.pg_get_expr(i.indexprs, i.indrelid) AS expr_sql`.',
            'Reconstruct full DDL with `pg_catalog.pg_get_indexdef(i.indexrelid) AS index_def` and sort by `ic.relname ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bindnkeyatts\\b', flags: 'i', message: 'Use `i.indnkeyatts` and `i.indnatts` to separate key columns from `INCLUDE` payload columns.' },
              { pattern: '\\bindexprs\\b', flags: 'i', message: 'Inspect `i.indexprs` to detect functional expression indexes.' },
              { pattern: '\\bpg_get_indexdef\\s*\\(', flags: 'i', message: 'Call `pg_get_indexdef(i.indexrelid)`.' }
            ]
          },
          solutionExplanation: '`idx_ledger_code_incl_bal` shows `key_col_count = 1` and `included_col_count = 2` (storing `balance_cents` and `status` in leaf tuples for Index-Only Scans without bloating B-Tree branch keys), while `idx_ledger_lower_tenant` decompiles `indexprs` to `lower(owner_tenant)`.'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m09-t06 — Live Sessions & GUC Configuration Audit: pg_stat_activity & pg_settings
       ======================================================================== */
    {
      id: 'pg-m09-t06',
      slug: 'pg-stat-activity-pg-settings-audit',
      moduleId: 'pg-m09',
      title: 'Live Sessions & GUC Configuration Audit: pg_stat_activity & pg_settings',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_stat_activity', 'pg_backend_pid()', 'pg_settings', 'source', 'pending_restart'],
      tags: ['pg-stat-activity', 'pg-settings', 'configuration', 'observability'],
      guide: {
        mentalModel: 'Two live views anchor every PostgreSQL 18 session & configuration check: `pg_catalog.pg_stat_activity` (exposing shared-memory `PgBackendStatus` slots for every client backend, autovacuum worker, checkpointer, and WAL writer, matched to your own connection via `pid = pg_backend_pid()`) and `pg_catalog.pg_settings` (exposing the Grand Unified Configuration—GUC—table of ~400 runtime parameters).\n\n`pg_settings` is far richer than `SHOW param`: it exposes raw numeric `setting` alongside `unit` (`\'8kB\'` for `shared_buffers` and `temp_buffers`!, `\'kB\'` for `work_mem`, `\'MB\'` for `max_wal_size`, `\'ms\'` for timeouts), `context` (`\'postmaster\'` = requires full DB restart, `\'sighup\'` = reloadable online via `SELECT pg_reload_conf()`, `\'user\'` = changeable per session/transaction via `SET LOCAL`), `source` (`\'default\'`, `\'configuration file\'`, `\'session\'`), and `pending_restart` (`true` when `postgresql.conf` changed a `postmaster` GUC that has not yet been restarted).',
        syntaxAnatomy: [
          'SELECT name,',
          '       setting,',
          '       unit,',
          '       context,',
          '       source,',
          '       pending_restart',
          'FROM pg_catalog.pg_settings',
          'WHERE name IN (\'shared_buffers\', \'work_mem\', \'maintenance_work_mem\', \'max_wal_size\')',
          'ORDER BY name ASC;'
        ].join('\n'),
        internalsAndGotchas: [
          'CRITICAL GUC UNIT TRAP: In `pg_settings`, `shared_buffers` is reported in **`\'8kB\'` pages** (`16384` × `8192` = `128 MB`), whereas `work_mem` is reported in **`\'kB\'`** (`4096` × `1024` = `4 MB`) and `max_wal_size` in **`\'MB\'`**. Never multiply `pg_settings.setting` without branching on `pg_settings.unit` (or calling `pg_size_bytes(current_setting(name))`)!',
          'In `pg_stat_activity`, `pid = pg_backend_pid()` isolates your own backend process—essential when filtering out your own diagnostic query during incident triage.',
          'Parameters with `context = \'postmaster\'` (`shared_buffers`, `max_connections`, `wal_level`) cannot take effect on `pg_reload_conf()`; `pending_restart = true` warns you a restart is still required.',
          '`SET LOCAL work_mem = \'32MB\'` changes `pg_settings.source` to `\'session\'` only until `COMMIT`/`ROLLBACK`, making it safe for connection-pooled OLTP apps.'
        ],
        whenToUse: 'Use `pg_stat_activity` + `pg_backend_pid()` for live session introspection, and `pg_settings` to audit memory/WAL/autovacuum configuration drift, restart requirements, and byte-normalized memory budgets.'
      },
      scenario: {
        role: 'Site Reliability & Database Platform Engineer',
        incidentOrGoal: 'A capacity dashboard misreported `shared_buffers` by 8× because an engineer assumed every `pg_settings` memory value was stored in `kB` rather than checking `unit = \'8kB\'`.',
        stakeholderNeed: 'Build three live runtime queries: current backend session verification via `pg_stat_activity`, GUC reload-context classification (`postmaster` vs `sighup` vs `user`), and unit-safe byte normalization with `SET LOCAL` override detection.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Introspecting Your Own Live Backend Session in pg_stat_activity',
          mission: 'Query `pg_catalog.pg_stat_activity` filtered to your own active backend (`WHERE pid = pg_backend_pid()`). Project 5 deterministic session columns in exact order: `is_self` (`pid = pg_backend_pid()`), `datname`, `backend_type`, `state`, and `has_open_xact` (`xact_start IS NOT NULL`). (Do not project raw `pid`, `query`, or timestamps since `query` changes per statement.)',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Inspect your own live session slot in pg_catalog.pg_stat_activity',
            'SELECT (pid = pg_backend_pid()) AS is_self,',
            '       datname',
            '       -- TODO: add backend_type, state, and (xact_start IS NOT NULL) AS has_open_xact',
            'FROM pg_catalog.pg_stat_activity',
            'WHERE pid = pg_backend_pid();'
          ].join('\n'),
          solutionCode: [
            'SELECT (pid = pg_backend_pid()) AS is_self,',
            '       datname,',
            '       backend_type,',
            '       state,',
            '       (xact_start IS NOT NULL) AS has_open_xact',
            'FROM pg_catalog.pg_stat_activity',
            'WHERE pid = pg_backend_pid();'
          ].join('\n'),
          hints: [
            'Filter `WHERE pid = pg_backend_pid()` on `pg_catalog.pg_stat_activity`.',
            'Project `(pid = pg_backend_pid()) AS is_self`, `datname`, `backend_type`, and `state`.',
            'Add `(xact_start IS NOT NULL) AS has_open_xact` as the 5th column.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_stat_activity\\b', flags: 'i', message: 'Query `pg_catalog.pg_stat_activity`.' },
              { pattern: '\\bpg_backend_pid\\s*\\(\\s*\\)', flags: 'i', message: 'Filter to your own backend using `pg_backend_pid()`.' }
            ]
          },
          solutionExplanation: 'Inside `pg_stat_activity`, your own connection always shows `state = \'active\'` and `has_open_xact = true` at the exact instant PostgreSQL executes the `SELECT` statement.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Auditing GUC Contexts (postmaster vs sighup vs user) in pg_settings',
          mission: 'Query `pg_catalog.pg_settings` for the 6 core operational parameters `name IN (\'shared_buffers\', \'work_mem\', \'maintenance_work_mem\', \'max_wal_size\', \'autovacuum_vacuum_scale_factor\', \'block_size\')`. Project 6 columns in exact order: `name`, `setting`, `unit_label` (`COALESCE(unit, \'dimensionless\')`), `context`, `requires_restart` (`context = \'postmaster\'`), and `pending_restart`. Sort by `name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Audit GUC units and reload/restart contexts in pg_catalog.pg_settings',
            'SELECT name,',
            '       setting',
            '       -- TODO: add COALESCE(unit, \'dimensionless\') AS unit_label, context, requires_restart, pending_restart',
            'FROM pg_catalog.pg_settings',
            'WHERE name IN (',
            '  \'shared_buffers\', \'work_mem\', \'maintenance_work_mem\',',
            '  \'max_wal_size\', \'autovacuum_vacuum_scale_factor\', \'block_size\'',
            ')',
            'ORDER BY name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT name,',
            '       setting,',
            '       COALESCE(unit, \'dimensionless\') AS unit_label,',
            '       context,',
            '       (context = \'postmaster\') AS requires_restart,',
            '       pending_restart',
            'FROM pg_catalog.pg_settings',
            'WHERE name IN (',
            '  \'shared_buffers\', \'work_mem\', \'maintenance_work_mem\',',
            '  \'max_wal_size\', \'autovacuum_vacuum_scale_factor\', \'block_size\'',
            ')',
            'ORDER BY name ASC;'
          ].join('\n'),
          hints: [
            'Use `COALESCE(unit, \'dimensionless\') AS unit_label` since ratios like `autovacuum_vacuum_scale_factor` have `unit IS NULL`.',
            'Compute `(context = \'postmaster\') AS requires_restart` to flag parameters that cannot be changed via `pg_reload_conf()`.',
            'Include `pending_restart` and keep `ORDER BY name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_settings\\b', flags: 'i', message: 'Query `pg_catalog.pg_settings`.' },
              { pattern: '\\bpending_restart\\b', flags: 'i', message: 'Project `pending_restart` from `pg_settings`.' }
            ]
          },
          solutionExplanation: '`shared_buffers` has `context = \'postmaster\'` (`requires_restart = true`) and `unit = \'8kB\'`, `max_wal_size` and `autovacuum_vacuum_scale_factor` have `context = \'sighup\'` (online reloadable), `work_mem` has `context = \'user\'` (per-session/transaction tunable), and `block_size` is compile-time `\'internal\'`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Normalizing 8kB/kB/MB Memory Units & Detecting SET LOCAL Overrides',
          mission: 'In this step\'s transaction setup, `SET LOCAL work_mem = \'16MB\'` has been executed. Query `pg_catalog.pg_settings` for `name IN (\'shared_buffers\', \'maintenance_work_mem\', \'work_mem\', \'temp_buffers\')` and project 6 columns in exact order: `name`, `setting`, `unit`, `bytes_exact` (normalized via `CASE unit`: `\'8kB\'` -> `setting::bigint * 8192`, `\'kB\'` -> `setting::bigint * 1024`, `\'MB\'` -> `setting::bigint * 1048576`), `pretty_size` (`pg_size_pretty(...)` of that exact byte expression), and `is_session_override` (`source = \'session\'`). Sort by `bytes_exact DESC, name ASC`.',
          setupSql: 'SET LOCAL work_mem = \'16MB\';',
          probeSql: '',
          starterCode: [
            '-- Normalize mixed pg_settings memory units (\'8kB\', \'kB\', \'MB\') to exact bytes',
            'SELECT name,',
            '       setting,',
            '       unit',
            '       -- TODO: add bytes_exact, pretty_size, and (source = \'session\') AS is_session_override',
            'FROM pg_catalog.pg_settings',
            'WHERE name IN (\'shared_buffers\', \'maintenance_work_mem\', \'work_mem\', \'temp_buffers\')',
            'ORDER BY name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT name,',
            '       setting,',
            '       unit,',
            '       CASE unit',
            '         WHEN \'8kB\' THEN setting::bigint * 8192',
            '         WHEN \'kB\' THEN setting::bigint * 1024',
            '         WHEN \'MB\' THEN setting::bigint * 1048576',
            '       END AS bytes_exact,',
            '       pg_size_pretty(',
            '         CASE unit',
            '           WHEN \'8kB\' THEN setting::bigint * 8192',
            '           WHEN \'kB\' THEN setting::bigint * 1024',
            '           WHEN \'MB\' THEN setting::bigint * 1048576',
            '         END',
            '       ) AS pretty_size,',
            '       (source = \'session\') AS is_session_override',
            'FROM pg_catalog.pg_settings',
            'WHERE name IN (\'shared_buffers\', \'maintenance_work_mem\', \'work_mem\', \'temp_buffers\')',
            'ORDER BY bytes_exact DESC, name ASC;'
          ].join('\n'),
          hints: [
            'Convert `setting::bigint` based on `unit`: `WHEN \'8kB\' THEN setting::bigint * 8192 WHEN \'kB\' THEN setting::bigint * 1024 WHEN \'MB\' THEN setting::bigint * 1048576`.',
            'Pass that same byte calculation (or wrap in a CTE) to `pg_size_pretty(...) AS pretty_size`.',
            'Project `(source = \'session\') AS is_session_override` and sort by `bytes_exact DESC, name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\b8192\\b|\\bpg_size_bytes\\b', flags: 'i', message: 'Convert `\'8kB\'` page units accurately (`* 8192` or `pg_size_bytes`).' },
              { pattern: '\\bsource\\b', flags: 'i', message: 'Check `source = \'session\'` to detect `SET LOCAL` overrides.' }
            ]
          },
          solutionExplanation: 'Multiplying `shared_buffers` (`16384` × `8192`) yields `134217728` bytes (`128 MB`) and `temp_buffers` (`1024` × `8192`) yields `8 MB`, while `work_mem` (`16384` × `1024` = `16 MB`) clearly flags `is_session_override = true` (`source = \'session\'`) from the transaction-local `SET LOCAL`.'
        }
      ]
    },

    /* ========================================================================
       LAB 07: pg-m09-t07 — Workload Telemetry: pg_stat_user_tables & pg_stat_user_indexes
       ======================================================================== */
    {
      id: 'pg-m09-t07',
      slug: 'pg-stat-user-tables-indexes-telemetry',
      moduleId: 'pg-m09',
      title: 'Workload Telemetry: pg_stat_user_tables & pg_stat_user_indexes',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_stat_user_tables', 'pg_stat_user_indexes', 'seq_scan', 'idx_scan', 'n_tup_hot_upd'],
      tags: ['pg-stat-user-tables', 'pg-stat-user-indexes', 'hot-updates', 'telemetry'],
      guide: {
        mentalModel: 'PostgreSQL\'s shared-memory Cumulative Statistics System (`pgstat`, rewritten in shared memory without UDP collector sockets in PostgreSQL 15+) tracks workload access patterns per table in `pg_catalog.pg_stat_user_tables` and per index in `pg_catalog.pg_stat_user_indexes`.\n\nThree ratios govern day-to-day OLTP tuning in `pg_stat_user_tables`: **Index Scan Ratio** (`idx_scan / (seq_scan + idx_scan)`—spotting large tables suffering repeated sequential scans), **HOT Update Ratio** (`n_tup_hot_upd / n_tup_upd`—measuring **Heap-Only Tuple** updates that stayed on the same 8 KB page without touching any index because no indexed column was modified and sufficient `fillfactor` free space existed), and **Dead Tuple Bloat** (`n_dead_tup` vs `n_live_tup` + `last_autovacuum`). Meanwhile, `pg_stat_user_indexes` exposes `idx_scan = 0` write-only deadweight indexes that slow down every non-HOT `UPDATE` and `INSERT`.',
        syntaxAnatomy: [
          'SELECT schemaname,',
          '       relname,',
          '       seq_scan,',
          '       COALESCE(idx_scan, 0) AS idx_scan,',
          '       COALESCE(ROUND(n_tup_hot_upd::numeric * 100 / NULLIF(n_tup_upd, 0), 2), 0.00) AS hot_upd_pct,',
          '       n_live_tup,',
          '       n_dead_tup',
          'FROM pg_catalog.pg_stat_user_tables',
          'WHERE schemaname = \'pg_ops\'',
          'ORDER BY relname ASC;'
        ].join('\n'),
        internalsAndGotchas: [
          'On tables with **zero** indexes, `pg_stat_user_tables.idx_scan` can be `NULL` rather than `0`! Always wrap `COALESCE(idx_scan, 0)` before adding `seq_scan + COALESCE(idx_scan, 0)`, and guard denominators with `NULLIF(..., 0)`.',
          'Never blindly drop a `0`-scan index from `pg_stat_user_indexes` without first joining `pg_index` to exclude `indisprimary` and `indisunique`—unique indexes enforce data integrity even if `SELECT` queries never scan them, and replicas maintain separate `idx_scan` counters from the primary!',
          'Modifying **any** column referenced by **any** index on a table disqualifies the `UPDATE` from being a `n_tup_hot_upd` Heap-Only Tuple update, forcing new index entries across **every** index on that table.',
          'By default (`stats_fetch_consistency = \'cache\'`), PostgreSQL caches fetched relation stats for the duration of a transaction and flushes new backend counters at transaction end (or after `pg_stat_force_next_flush()`).'
        ],
        whenToUse: 'Query `pg_stat_user_tables` and `pg_stat_user_indexes` continuously in observability dashboards to catch missing indexes (`seq_scan` spikes), low HOT update efficiency (`fillfactor` / over-indexing), dead-tuple accumulation, and unused secondary indexes.'
      },
      scenario: {
        role: 'Staff Performance & Observability DBRE',
        incidentOrGoal: 'Engineering is rolling out standard Prometheus/SQL scrapers over `pg_stat_user_tables` and `pg_stat_user_indexes` that must safely handle zero-scan tables (`NULLIF`), track HOT update efficiency, and flag non-unique unused indexes.',
        stakeholderNeed: 'Author three zero-division-safe telemetry queries: per-table index-vs-sequential scan ratios, HOT update percentage & dead-tuple tracking, and index utilization joined with `pg_index` uniqueness guards.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Zero-Safe Sequential vs Index Scan Ratio in pg_stat_user_tables',
          mission: 'Query `pg_catalog.pg_stat_user_tables` for `schemaname = \'pg_ops\'` and `relname IN (\'api_audit_events\', \'incident_shipments\', \'job_queue\', \'ledger_accounts\', \'search_documents\')`. Project 6 columns in exact order: `schemaname`, `relname`, `seq_scan`, `idx_scan` (`COALESCE(idx_scan, 0)`), `idx_scan_pct` (`COALESCE(ROUND(COALESCE(idx_scan, 0)::numeric * 100 / NULLIF(seq_scan + COALESCE(idx_scan, 0), 0), 2), 0.00)`), and `n_dead_tup`. Sort by `relname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Build a zero-safe seq_scan vs idx_scan telemetry view over pg_stat_user_tables',
            'SELECT schemaname,',
            '       relname',
            '       -- TODO: add seq_scan, COALESCE(idx_scan, 0) AS idx_scan, idx_scan_pct (using NULLIF), n_dead_tup',
            'FROM pg_catalog.pg_stat_user_tables',
            'WHERE schemaname = \'pg_ops\'',
            '  AND relname IN (\'api_audit_events\', \'incident_shipments\', \'job_queue\', \'ledger_accounts\', \'search_documents\')',
            'ORDER BY relname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT schemaname,',
            '       relname,',
            '       seq_scan,',
            '       COALESCE(idx_scan, 0) AS idx_scan,',
            '       COALESCE(',
            '         ROUND(COALESCE(idx_scan, 0)::numeric * 100 / NULLIF(seq_scan + COALESCE(idx_scan, 0), 0), 2),',
            '         0.00',
            '       ) AS idx_scan_pct,',
            '       n_dead_tup',
            'FROM pg_catalog.pg_stat_user_tables',
            'WHERE schemaname = \'pg_ops\'',
            '  AND relname IN (\'api_audit_events\', \'incident_shipments\', \'job_queue\', \'ledger_accounts\', \'search_documents\')',
            'ORDER BY relname ASC;'
          ].join('\n'),
          hints: [
            'Normalize nullable `idx_scan` via `COALESCE(idx_scan, 0) AS idx_scan`.',
            'Guard the denominator `seq_scan + COALESCE(idx_scan, 0)` with `NULLIF(..., 0)` so freshly reset tables with `0` scans do not raise `division by zero`.',
            'Wrap `ROUND(..., 2)` in `COALESCE(..., 0.00) AS idx_scan_pct`, append `n_dead_tup`, and `ORDER BY relname ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            ignoreColumns: ['seq_scan', 'idx_scan', 'idx_scan_pct', 'n_dead_tup'],
            columnChecks: [
              { col: 'seq_scan', minNumeric: 0 },
              { col: 'idx_scan', minNumeric: 0 },
              { col: 'idx_scan_pct', minNumeric: 0 }
            ],
            requiredPatterns: [
              { pattern: '\\bpg_stat_user_tables\\b', flags: 'i', message: 'Query `pg_catalog.pg_stat_user_tables`.' },
              { pattern: '\\bNULLIF\\s*\\(', flags: 'i', message: 'Use `NULLIF(..., 0)` to prevent division-by-zero on idle tables.' },
              { pattern: '\\bidx_scan\\b', flags: 'i', message: 'Compute `idx_scan` and `idx_scan_pct`.' }
            ]
          },
          solutionExplanation: 'Combining `COALESCE(idx_scan, 0)` with `NULLIF(seq_scan + COALESCE(idx_scan, 0), 0)` ensures the scraper never crashes on indexless tables (`idx_scan IS NULL`) or freshly reset tables (`0` total scans).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Tracking HOT Update Efficiency (`n_tup_hot_upd`) & Dead Tuple Ratios',
          mission: 'Query `pg_catalog.pg_stat_user_tables` for `schemaname = \'pg_ops\'` and `relname IN (\'api_audit_events\', \'job_queue\', \'ledger_accounts\', \'org_units\', \'tenant_invoices\')`. Project 6 columns in exact order: `relname`, `n_tup_upd`, `n_tup_hot_upd`, `hot_update_pct` (`COALESCE(ROUND(n_tup_hot_upd::numeric * 100 / NULLIF(n_tup_upd, 0), 2), 0.00)`), `n_live_tup`, and `dead_tup_pct` (`COALESCE(ROUND(n_dead_tup::numeric * 100 / NULLIF(n_live_tup + n_dead_tup, 0), 2), 0.00)`). Sort by `relname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Compute HOT update efficiency and dead-tuple bloat percentage on 5 pg_ops tables',
            'SELECT relname,',
            '       n_tup_upd,',
            '       n_tup_hot_upd',
            '       -- TODO: add hot_update_pct, n_live_tup, and dead_tup_pct using NULLIF + COALESCE',
            'FROM pg_catalog.pg_stat_user_tables',
            'WHERE schemaname = \'pg_ops\'',
            '  AND relname IN (\'api_audit_events\', \'job_queue\', \'ledger_accounts\', \'org_units\', \'tenant_invoices\')',
            'ORDER BY relname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT relname,',
            '       n_tup_upd,',
            '       n_tup_hot_upd,',
            '       COALESCE(ROUND(n_tup_hot_upd::numeric * 100 / NULLIF(n_tup_upd, 0), 2), 0.00) AS hot_update_pct,',
            '       n_live_tup,',
            '       COALESCE(ROUND(n_dead_tup::numeric * 100 / NULLIF(n_live_tup + n_dead_tup, 0), 2), 0.00) AS dead_tup_pct',
            'FROM pg_catalog.pg_stat_user_tables',
            'WHERE schemaname = \'pg_ops\'',
            '  AND relname IN (\'api_audit_events\', \'job_queue\', \'ledger_accounts\', \'org_units\', \'tenant_invoices\')',
            'ORDER BY relname ASC;'
          ].join('\n'),
          hints: [
            'Compute `hot_update_pct` as `COALESCE(ROUND(n_tup_hot_upd::numeric * 100 / NULLIF(n_tup_upd, 0), 2), 0.00)`.',
            'Compute `dead_tup_pct` as `COALESCE(ROUND(n_dead_tup::numeric * 100 / NULLIF(n_live_tup + n_dead_tup, 0), 2), 0.00)`.',
            'Keep `n_live_tup` as the 5th column and sort by `relname ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            ignoreColumns: ['n_tup_upd', 'n_tup_hot_upd', 'hot_update_pct', 'n_live_tup', 'dead_tup_pct'],
            columnChecks: [
              { col: 'hot_update_pct', minNumeric: 0 },
              { col: 'dead_tup_pct', minNumeric: 0 }
            ],
            requiredPatterns: [
              { pattern: '\\bn_tup_hot_upd\\b', flags: 'i', message: 'Use `n_tup_hot_upd` to measure Heap-Only Tuple update efficiency.' },
              { pattern: '\\bn_dead_tup\\b', flags: 'i', message: 'Use `n_dead_tup` to compute dead-tuple ratio.' },
              { pattern: '\\bNULLIF\\s*\\(', flags: 'i', message: 'Guard zero denominators with `NULLIF(..., 0)`.' }
            ]
          },
          solutionExplanation: 'When high-churn tables like `job_queue` or `ledger_accounts` show low `hot_update_pct`, DBREs either drop redundant indexes on frequently mutated status columns or lower table `fillfactor` (`80`–`90`) so `UPDATE`s find intra-page headroom for HOT chains.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Auditing Index Utilization Safely (`pg_stat_user_indexes` + `pg_index`)',
          mission: 'Join `pg_catalog.pg_stat_user_indexes sui` with `pg_catalog.pg_index i` (`i.indexrelid = sui.indexrelid`) for `sui.schemaname = \'pg_ops\'` and `sui.relname IN (\'api_audit_events\', \'job_queue\', \'search_documents\')`. Project 7 columns in exact order: `table_name` (`sui.relname`), `index_name` (`sui.indexrelname`), `indisprimary`, `indisunique`, `drop_candidate_eligible` (`NOT i.indisprimary AND NOT i.indisunique AND i.indisexclusion IS FALSE`), `idx_scan` (`sui.idx_scan`), and `index_bytes` (`pg_relation_size(sui.indexrelid)`). Sort by `sui.relname ASC, sui.indexrelname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Combine pg_stat_user_indexes scan telemetry with pg_index constraint safety flags',
            'SELECT sui.relname AS table_name,',
            '       sui.indexrelname AS index_name',
            '       -- TODO: join pg_index i; add indisprimary, indisunique, drop_candidate_eligible, idx_scan, index_bytes',
            'FROM pg_catalog.pg_stat_user_indexes sui',
            'WHERE sui.schemaname = \'pg_ops\'',
            '  AND sui.relname IN (\'api_audit_events\', \'job_queue\', \'search_documents\')',
            'ORDER BY sui.relname ASC, sui.indexrelname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT sui.relname AS table_name,',
            '       sui.indexrelname AS index_name,',
            '       i.indisprimary,',
            '       i.indisunique,',
            '       (NOT i.indisprimary AND NOT i.indisunique AND NOT i.indisexclusion) AS drop_candidate_eligible,',
            '       sui.idx_scan,',
            '       pg_relation_size(sui.indexrelid) AS index_bytes',
            'FROM pg_catalog.pg_stat_user_indexes sui',
            'JOIN pg_catalog.pg_index i ON i.indexrelid = sui.indexrelid',
            'WHERE sui.schemaname = \'pg_ops\'',
            '  AND sui.relname IN (\'api_audit_events\', \'job_queue\', \'search_documents\')',
            'ORDER BY sui.relname ASC, sui.indexrelname ASC;'
          ].join('\n'),
          hints: [
            'Join `pg_catalog.pg_index i ON i.indexrelid = sui.indexrelid`.',
            'An index is only eligible as an unused-index drop candidate when `NOT i.indisprimary AND NOT i.indisunique AND NOT i.indisexclusion`.',
            'Project `sui.idx_scan` and `pg_relation_size(sui.indexrelid) AS index_bytes`, ordered by `sui.relname ASC, sui.indexrelname ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            ignoreColumns: ['idx_scan'],
            columnChecks: [
              { col: 'idx_scan', minNumeric: 0 },
              { col: 'index_bytes', minNumeric: 8192 }
            ],
            requiredPatterns: [
              { pattern: '\\bpg_stat_user_indexes\\b', flags: 'i', message: 'Query `pg_catalog.pg_stat_user_indexes`.' },
              { pattern: '\\bindisexclusion\\b', flags: 'i', message: 'Exclude exclusion-constraint indexes (`NOT i.indisexclusion`) alongside PK and unique indexes.' }
            ]
          },
          solutionExplanation: 'Joining `pg_stat_user_indexes` with `pg_index` (`indisprimary`, `indisunique`, `indisexclusion`) prevents the classic rookie outage of dropping a `0`-scan `UNIQUE` or `EXCLUDE USING gist` constraint index that silently guards business invariants.'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m09-t08 — Buffer Cache Hit Ratios (pg_statio_*) & PG 18 Unified pg_stat_io / pg_stat_wal
       ======================================================================== */
    {
      id: 'pg-m09-t08',
      slug: 'buffer-hit-ratio-pg-stat-io-wal',
      moduleId: 'pg-m09',
      title: 'Buffer Cache Hit Ratios (pg_statio_*) & PG 18 Unified pg_stat_io / pg_stat_wal',
      difficulty: 'Staff',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_statio_user_tables', 'pg_statio_user_indexes', 'pg_stat_io', 'pg_stat_wal'],
      tags: ['pg-statio', 'cache-hit-ratio', 'pg-stat-io', 'pg-stat-wal', 'pg18'],
      guide: {
        mentalModel: 'PostgreSQL separates **block-level buffer I/O telemetry** across two complementary layers: per-relation shared-buffer counters in `pg_catalog.pg_statio_user_tables` / `pg_statio_user_indexes` (`heap_blks_hit`, `heap_blks_read`, `idx_blks_hit`, `idx_blks_read`, `toast_blks_hit`, `tidx_blks_hit`) and cluster-wide backend I/O matrices in `pg_catalog.pg_stat_io` + `pg_catalog.pg_stat_wal`.\n\nPostgreSQL 18 introduced major observability upgrades to `pg_stat_io`: exact byte counters (`read_bytes`, `write_bytes`, `extend_bytes`—replacing the old `op_bytes` multiplier because asynchronous/vectored I/O can coalesce multi-block operations!) and **unified WAL I/O tracking** (`object = \'wal\'`, moving `wal_write` and `wal_sync` out of `pg_stat_wal` into `pg_stat_io` broken down by `backend_type` and `context`: `normal`, `init`, `vacuum`, `bulkread`, `bulkwrite`). Meanwhile, `pg_stat_wal` focuses cleanly on WAL volume generation (`wal_records`, `wal_fpi` full-page images, `wal_bytes`, `wal_buffers_full`).',
        syntaxAnatomy: [
          '-- 1. Per-table shared_buffers cache hit ratio:',
          'SELECT relname,',
          '       COALESCE(ROUND(heap_blks_hit::numeric * 100 / NULLIF(heap_blks_hit + heap_blks_read, 0), 2), 100.00) AS heap_hit_pct',
          'FROM pg_catalog.pg_statio_user_tables WHERE schemaname = \'pg_ops\';',
          '',
          '-- 2. PostgreSQL 18 pg_stat_io byte-accurate backend I/O matrix:',
          'SELECT backend_type, object, context, reads, hits, read_bytes, write_bytes',
          'FROM pg_catalog.pg_stat_io',
          'WHERE object IN (\'relation\', \'wal\');'
        ].join('\n'),
        internalsAndGotchas: [
          'A `heap_blks_read` in `pg_statio_*` means a **PostgreSQL `shared_buffers` miss**, NOT necessarily a physical NVMe disk read—the 8 KB block may still be served in microseconds from the Linux kernel page cache! Pair `pg_statio_*` with `track_io_timing = on` (`read_time` in `pg_stat_io`) to separate OS page-cache hits from real storage latency.',
          'PostgreSQL 18 BREAKING TELEMETRY CHANGE: `pg_stat_io` replaced `op_bytes` with explicit `read_bytes`, `write_bytes`, and `extend_bytes`, and absorbed WAL write/fsync counters (`object = \'wal\'`) previously housed in `pg_stat_wal`.',
          'In `pg_stat_io`, `context = \'bulkread\'` and `context = \'vacuum\'` use small **ring buffers** (256 KB–16 MB) so giant sequential scans and `VACUUM` runs do not evict hot OLTP pages (`context = \'normal\'`)—seeing `reuses > 0` on `vacuum`/`bulkread` is healthy ring-buffer recycling!',
          'High `wal_fpi` (Full-Page Images) in `pg_stat_wal` right after checkpoints indicates aggressive checkpoint frequency; widening `checkpoint_timeout` and `max_wal_size` dramatically reduces WAL write amplification.'
        ],
        whenToUse: 'Use `pg_statio_user_tables` and `pg_statio_user_indexes` to pinpoint specific cold tables/indexes thrashing `shared_buffers`, and use PostgreSQL 18\'s `pg_stat_io` + `pg_stat_wal` to attribute exact read/write bytes, ring-buffer evictions, and WAL FPI amplification across backend types.'
      },
      scenario: {
        role: 'Distinguished Storage & Engine DBRE',
        incidentOrGoal: 'During the upgrade from PostgreSQL 16 to PostgreSQL 18, legacy monitoring queries referencing `pg_stat_io.op_bytes` and `pg_stat_wal.wal_write` broke and must be modernized alongside per-table/per-index buffer hit-ratio panels.',
        stakeholderNeed: 'Write three PostgreSQL 18 telemetry queries: per-table heap & index buffer hit ratios (`pg_statio_user_tables`), per-index buffer hit ratios (`pg_statio_user_indexes`), and unified PostgreSQL 18 `pg_stat_io` (`read_bytes`, `object IN (\'relation\', \'wal\')`) + `pg_stat_wal`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Heap & Index Shared-Buffer Hit Ratios in pg_statio_user_tables',
          mission: 'Query `pg_catalog.pg_statio_user_tables` for `schemaname = \'pg_ops\'` and `relname IN (\'api_audit_events\', \'job_queue\', \'ledger_accounts\', \'room_bookings\', \'search_documents\')`. Project 6 columns in exact order: `schemaname`, `relname`, `heap_blks_read`, `heap_blks_hit`, `heap_hit_pct` (`COALESCE(ROUND(heap_blks_hit::numeric * 100 / NULLIF(heap_blks_hit + heap_blks_read, 0), 2), 100.00)`), and `idx_hit_pct` (`COALESCE(ROUND(idx_blks_hit::numeric * 100 / NULLIF(idx_blks_hit + idx_blks_read, 0), 2), 100.00)`). Sort by `relname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Compute zero-safe heap & index buffer cache hit ratios from pg_statio_user_tables',
            'SELECT schemaname,',
            '       relname,',
            '       heap_blks_read,',
            '       heap_blks_hit',
            '       -- TODO: add heap_hit_pct and idx_hit_pct (defaulting 0-block tables to 100.00 via COALESCE + NULLIF)',
            'FROM pg_catalog.pg_statio_user_tables',
            'WHERE schemaname = \'pg_ops\'',
            '  AND relname IN (\'api_audit_events\', \'job_queue\', \'ledger_accounts\', \'room_bookings\', \'search_documents\')',
            'ORDER BY relname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT schemaname,',
            '       relname,',
            '       heap_blks_read,',
            '       heap_blks_hit,',
            '       COALESCE(',
            '         ROUND(heap_blks_hit::numeric * 100 / NULLIF(heap_blks_hit + heap_blks_read, 0), 2),',
            '         100.00',
            '       ) AS heap_hit_pct,',
            '       COALESCE(',
            '         ROUND(idx_blks_hit::numeric * 100 / NULLIF(idx_blks_hit + idx_blks_read, 0), 2),',
            '         100.00',
            '       ) AS idx_hit_pct',
            'FROM pg_catalog.pg_statio_user_tables',
            'WHERE schemaname = \'pg_ops\'',
            '  AND relname IN (\'api_audit_events\', \'job_queue\', \'ledger_accounts\', \'room_bookings\', \'search_documents\')',
            'ORDER BY relname ASC;'
          ].join('\n'),
          hints: [
            'Divide `heap_blks_hit::numeric * 100` by `NULLIF(heap_blks_hit + heap_blks_read, 0)` inside `ROUND(..., 2)`.',
            'Wrap in `COALESCE(..., 100.00) AS heap_hit_pct` so untouched tables do not trigger false-positive cache-miss alerts.',
            'Repeat with `idx_blks_hit` and `idx_blks_read` for `AS idx_hit_pct`, sorted by `relname ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            ignoreColumns: ['heap_blks_read', 'heap_blks_hit', 'heap_hit_pct', 'idx_hit_pct'],
            columnChecks: [
              { col: 'heap_hit_pct', minNumeric: 0 },
              { col: 'idx_hit_pct', minNumeric: 0 }
            ],
            requiredPatterns: [
              { pattern: '\\bpg_statio_user_tables\\b', flags: 'i', message: 'Query `pg_catalog.pg_statio_user_tables`.' },
              { pattern: '\\bheap_blks_hit\\b', flags: 'i', message: 'Use `heap_blks_hit` and `heap_blks_read`.' },
              { pattern: '\\bidx_blks_hit\\b', flags: 'i', message: 'Use `idx_blks_hit` and `idx_blks_read`.' },
              { pattern: '\\bNULLIF\\s*\\(', flags: 'i', message: 'Guard denominators with `NULLIF(..., 0)`.' }
            ]
          },
          solutionExplanation: 'Healthy OLTP working sets maintain `99%+` `idx_hit_pct` (keeping B-Tree internal/leaf pages pinned in `shared_buffers`) even when cold historical heap pages occasionally miss RAM.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Per-Index Buffer Cache Residency in pg_statio_user_indexes',
          mission: 'Drill down to individual index buffer performance in `pg_catalog.pg_statio_user_indexes` for `schemaname = \'pg_ops\'` and `relname IN (\'api_audit_events\', \'search_documents\')`. Project 5 columns in exact order: `table_name` (`relname`), `index_name` (`indexrelname`), `idx_blks_read`, `idx_blks_hit`, and `idx_cache_hit_pct` (`COALESCE(ROUND(idx_blks_hit::numeric * 100 / NULLIF(idx_blks_hit + idx_blks_read, 0), 2), 100.00)`). Sort by `relname ASC, indexrelname ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Drill into per-index shared_buffers hit ratios for api_audit_events and search_documents',
            'SELECT relname AS table_name,',
            '       indexrelname AS index_name',
            '       -- TODO: add idx_blks_read, idx_blks_hit, and idx_cache_hit_pct',
            'FROM pg_catalog.pg_statio_user_indexes',
            'WHERE schemaname = \'pg_ops\'',
            '  AND relname IN (\'api_audit_events\', \'search_documents\')',
            'ORDER BY relname ASC, indexrelname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT relname AS table_name,',
            '       indexrelname AS index_name,',
            '       idx_blks_read,',
            '       idx_blks_hit,',
            '       COALESCE(',
            '         ROUND(idx_blks_hit::numeric * 100 / NULLIF(idx_blks_hit + idx_blks_read, 0), 2),',
            '         100.00',
            '       ) AS idx_cache_hit_pct',
            'FROM pg_catalog.pg_statio_user_indexes',
            'WHERE schemaname = \'pg_ops\'',
            '  AND relname IN (\'api_audit_events\', \'search_documents\')',
            'ORDER BY relname ASC, indexrelname ASC;'
          ].join('\n'),
          hints: [
            'Query `pg_catalog.pg_statio_user_indexes` aliasing `relname AS table_name` and `indexrelname AS index_name`.',
            'Project `idx_blks_read`, `idx_blks_hit`, and `COALESCE(ROUND(idx_blks_hit::numeric * 100 / NULLIF(idx_blks_hit + idx_blks_read, 0), 2), 100.00) AS idx_cache_hit_pct`.',
            'Sort deterministically by `relname ASC, indexrelname ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            ignoreColumns: ['idx_blks_read', 'idx_blks_hit', 'idx_cache_hit_pct'],
            columnChecks: [
              { col: 'idx_cache_hit_pct', minNumeric: 0 }
            ],
            requiredPatterns: [
              { pattern: '\\bpg_statio_user_indexes\\b', flags: 'i', message: 'Query `pg_catalog.pg_statio_user_indexes`.' },
              { pattern: '\\bNULLIF\\s*\\(', flags: 'i', message: 'Use `NULLIF(idx_blks_hit + idx_blks_read, 0)`.' }
            ]
          },
          solutionExplanation: 'Whereas `pg_statio_user_tables` rolls all indexes on a table into a single `idx_blks_hit` sum, `pg_statio_user_indexes` isolates whether a specific bloated GIN or trigram index is causing 95% of index buffer misses while the PK B-Tree stays 100% resident.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — PostgreSQL 18 Unified pg_stat_io (`read_bytes` & `wal`) + pg_stat_wal',
          mission: 'Query PostgreSQL 18\'s unified `pg_catalog.pg_stat_io io` `CROSS JOIN pg_catalog.pg_stat_wal w`, filtered to your own session\'s backend type (`io.backend_type = (SELECT backend_type FROM pg_catalog.pg_stat_activity WHERE pid = pg_backend_pid())`) and `io.object IN (\'relation\', \'wal\')`. Project 7 columns in exact order: `backend_type` (`io.backend_type`), `object` (`io.object`), `context` (`io.context`), `reads` (`COALESCE(io.reads, 0)`), `hits` (`COALESCE(io.hits, 0)`), `read_bytes` (`COALESCE(io.read_bytes, 0)`), and `cluster_wal_bytes` (`w.wal_bytes`). Sort by `io.object ASC, io.context ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Query PG 18 unified pg_stat_io (including read_bytes & object = \'wal\') alongside pg_stat_wal',
            'SELECT io.backend_type,',
            '       io.object,',
            '       io.context',
            '       -- TODO: CROSS JOIN pg_stat_wal w; add reads, hits, read_bytes (COALESCE to 0), and cluster_wal_bytes',
            'FROM pg_catalog.pg_stat_io io',
            'WHERE io.backend_type = (SELECT backend_type FROM pg_catalog.pg_stat_activity WHERE pid = pg_backend_pid())',
            '  AND io.object IN (\'relation\', \'wal\')',
            'ORDER BY io.object ASC, io.context ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT io.backend_type,',
            '       io.object,',
            '       io.context,',
            '       COALESCE(io.reads, 0) AS reads,',
            '       COALESCE(io.hits, 0) AS hits,',
            '       COALESCE(io.read_bytes, 0) AS read_bytes,',
            '       w.wal_bytes AS cluster_wal_bytes',
            'FROM pg_catalog.pg_stat_io io',
            'CROSS JOIN pg_catalog.pg_stat_wal w',
            'WHERE io.backend_type = (',
            '  SELECT backend_type FROM pg_catalog.pg_stat_activity WHERE pid = pg_backend_pid()',
            ')',
            '  AND io.object IN (\'relation\', \'wal\')',
            'ORDER BY io.object ASC, io.context ASC;'
          ].join('\n'),
          hints: [
            '`CROSS JOIN pg_catalog.pg_stat_wal w` (which is always a single-row cluster-wide view).',
            'Wrap `COALESCE(io.reads, 0) AS reads`, `COALESCE(io.hits, 0) AS hits`, and PostgreSQL 18\'s `COALESCE(io.read_bytes, 0) AS read_bytes` because inapplicable `(object, context)` combinations (such as `hits` on `object = \'wal\'`) report `NULL`.',
            'Project `w.wal_bytes AS cluster_wal_bytes` and sort by `io.object ASC, io.context ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            ignoreColumns: ['reads', 'hits', 'read_bytes', 'cluster_wal_bytes'],
            columnChecks: [
              { col: 'reads', minNumeric: 0 },
              { col: 'hits', minNumeric: 0 },
              { col: 'read_bytes', minNumeric: 0 },
              { col: 'cluster_wal_bytes', minNumeric: 1 }
            ],
            requiredPatterns: [
              { pattern: '\\bpg_stat_io\\b', flags: 'i', message: 'Query `pg_catalog.pg_stat_io`.' },
              { pattern: '\\bread_bytes\\b', flags: 'i', message: 'Use PostgreSQL 18\'s native `io.read_bytes` column.' },
              { pattern: '\\bpg_stat_wal\\b', flags: 'i', message: 'Cross-join `pg_catalog.pg_stat_wal` for `wal_bytes`.' }
            ]
          },
          solutionExplanation: 'In PostgreSQL 18, `pg_stat_io` exposes native byte-level `read_bytes` / `write_bytes` (supporting multi-block vectored/async I/O) and tracks `object = \'wal\'` (`init` and `normal` contexts) alongside `object = \'relation\'` (`bulkread`, `bulkwrite`, `init`, `normal`, `vacuum`), while `pg_stat_wal` reports cumulative `wal_bytes`, `wal_records`, and `wal_fpi`.'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
