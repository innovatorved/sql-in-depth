/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 02 (`pg-m02`): DDL Schema Design, Constraints & Modern PG 17/18 DML
 * 8 Hands-On Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m02'] = [
    /* ========================================================================
       LAB 01: pg-m02-t01 — CREATE TABLE, GENERATED ALWAYS AS IDENTITY & Native PG Types
       ======================================================================== */
    {
      id: 'pg-m02-t01',
      slug: 'create-table-identity-pg-types',
      moduleId: 'pg-m02',
      title: 'CREATE TABLE, GENERATED ALWAYS AS IDENTITY & Native PG Types',
      difficulty: 'Beginner',
      estimatedMinutes: 12,
      datasetId: 'ecommerce',
      clauses: ['CREATE TABLE', 'GENERATED ALWAYS AS IDENTITY', 'TIMESTAMPTZ', 'NUMERIC'],
      tags: ['ddl', 'create-table', 'identity', 'data-types', 'schema-design'],
      guide: {
        mentalModel: 'Modern PostgreSQL schema design retires three legacy anti-patterns inherited from early SQL dialects: `SERIAL` / `BIGSERIAL` pseudo-types, arbitrary `VARCHAR(255)` length caps, and naive `TIMESTAMP` (`without time zone`). In PostgreSQL, `SERIAL` is merely a parser macro that creates an independent `CREATE SEQUENCE` + `DEFAULT nextval(...)` whose permissions, `DROP` lifecycle, and accidental manual `INSERT` overrides drift out of sync with the owning table.\n\nSQL-standard **`BIGINT GENERATED ALWAYS AS IDENTITY`** (`attidentity = \'a\'` in `pg_attribute`) binds an internal sequence tightly to the column\'s catalog lifecycle and **rejects accidental explicit ID inserts** unless the caller intentionally specifies `OVERRIDING SYSTEM VALUE` (ideal for controlled ETL backfills). Meanwhile, PostgreSQL\'s `varlena` storage representation makes **`TEXT` physically identical on disk and in RAM to `VARCHAR(n)`** without artificial `ALTER TABLE` migration cliffs, `NUMERIC(p,s)` guarantees exact decimal currency storage, and `TIMESTAMPTZ` stores unambiguous 8-byte UTC epoch microseconds.',
        syntaxAnatomy: [
          'CREATE TABLE warehouse_bins (',
          '  bin_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
          '  aisle_code      TEXT NOT NULL UNIQUE,               -- Prefer TEXT over arbitrary VARCHAR(n)',
          '  max_weight_kg   NUMERIC(8,2) NOT NULL DEFAULT 500.00,',
          '  is_refrigerated BOOLEAN NOT NULL DEFAULT false,',
          '  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()',
          ');',
          '',
          '-- Intentional historical backfill into a GENERATED ALWAYS AS IDENTITY column:',
          'INSERT INTO warehouse_bins (bin_id, aisle_code, max_weight_kg)',
          'OVERRIDING SYSTEM VALUE',
          'VALUES (100, \'AISLE-Z9\', 750.00);'
        ].join('\n'),
        internalsAndGotchas: [
          'Legacy `SERIAL` is `32-bit` (`int4`, exhausting at `2,147,483,647` rows) and silently allows callers to `INSERT` explicit IDs without advancing the sequence—causing sudden `duplicate key` crashes months later! Always prefer `BIGINT GENERATED ALWAYS AS IDENTITY`.',
          '`CHAR(n)` (`bpchar`) pads trailing spaces on disk and wastes storage; `VARCHAR(n)` and `TEXT` share the exact same 1-byte/4-byte `varlena` header, so use `TEXT` (paired with a `CHECK (LENGTH(col) <= ...)` constraint if domain validation is required).',
          'PostgreSQL executes **transactional DDL**: `CREATE TABLE`, `ALTER TABLE`, and `DROP TABLE` inside a transaction block write catalog changes that roll back cleanly on `ROLLBACK`.',
          'After an `OVERRIDING SYSTEM VALUE` backfill with explicit IDs, remember in production migrations to advance the underlying identity sequence via `ALTER TABLE ... ALTER COLUMN id RESTART WITH ...` (or `setval(pg_get_serial_sequence(...), MAX(id))`).'
        ],
        whenToUse: 'Use `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `TEXT`, `NUMERIC(p,s)`, `BOOLEAN`, and `TIMESTAMPTZ` as the baseline column toolkit for every new PostgreSQL 18 table.'
      },
      scenario: {
        role: 'Core Fulfillment Schema Architect',
        incidentOrGoal: 'A legacy microservice migration brought over `SERIAL` keys, `VARCHAR(64)` columns, and floating-point vendor costs, and an ETL job failed trying to backfill historical IDs into a strict `GENERATED ALWAYS AS IDENTITY` audit table.',
        stakeholderNeed: 'Author clean PostgreSQL 18 `CREATE TABLE` schemas for `warehouse_bins` and `supplier_invoices`, then execute an explicit-ID historical backfill using `OVERRIDING SYSTEM VALUE`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Authoring a Modern PostgreSQL Table with GENERATED ALWAYS AS IDENTITY',
          mission: 'Create table `warehouse_bins` using `CREATE TABLE` with 5 columns: `bin_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `aisle_code TEXT NOT NULL UNIQUE`, `max_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 500.00`, `is_refrigerated BOOLEAN NOT NULL DEFAULT false`, and `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`. Do NOT use `SERIAL` or `VARCHAR`.',
          setupSql: '',
          probeSql: [
            'INSERT INTO warehouse_bins (aisle_code) VALUES (\'A-01\');',
            'INSERT INTO warehouse_bins (aisle_code, max_weight_kg, is_refrigerated) VALUES (\'B-04\', 1250.50, true);',
            'SELECT bin_id,',
            '       aisle_code,',
            '       max_weight_kg,',
            '       is_refrigerated,',
            '       (created_at IS NOT NULL) AS has_created_ts,',
            '       (SELECT attidentity FROM pg_attribute WHERE attrelid = \'warehouse_bins\'::regclass AND attname = \'bin_id\') AS id_mode',
            'FROM warehouse_bins',
            'ORDER BY bin_id ASC;'
          ].join('\n'),
          starterCode: [
            '-- Create warehouse_bins using BIGINT GENERATED ALWAYS AS IDENTITY, TEXT, NUMERIC(8,2), BOOLEAN, TIMESTAMPTZ',
            'CREATE TABLE warehouse_bins (',
            '  -- TODO: bin_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
            '  -- TODO: aisle_code TEXT NOT NULL UNIQUE',
            '  -- TODO: max_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 500.00',
            '  -- TODO: is_refrigerated BOOLEAN NOT NULL DEFAULT false',
            '  -- TODO: created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
            ');'
          ].join('\n'),
          solutionCode: [
            'CREATE TABLE warehouse_bins (',
            '  bin_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
            '  aisle_code      TEXT NOT NULL UNIQUE,',
            '  max_weight_kg   NUMERIC(8,2) NOT NULL DEFAULT 500.00,',
            '  is_refrigerated BOOLEAN NOT NULL DEFAULT false,',
            '  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()',
            ');'
          ].join('\n'),
          hints: [
            'Declare `bin_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` so `pg_attribute.attidentity` records `\'a\'` (always).',
            'Ensure `max_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 500.00` and `is_refrigerated BOOLEAN NOT NULL DEFAULT false` match the exact defaults.',
            'Finish with `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+TABLE\\s+warehouse_bins\\b', flags: 'i', message: 'Create table `warehouse_bins`.' },
              { pattern: '\\bGENERATED\\s+ALWAYS\\s+AS\\s+IDENTITY\\b', flags: 'i', message: 'Use `GENERATED ALWAYS AS IDENTITY` on `bin_id`.' },
              { pattern: '\\bTIMESTAMPTZ\\b|\\bTIMESTAMP\\s+WITH\\s+TIME\\s+ZONE\\b', flags: 'i', message: 'Use `TIMESTAMPTZ` for `created_at`.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\b(BIG)?SERIAL\\b', flags: 'i', message: 'Avoid legacy `SERIAL` / `BIGSERIAL`; use SQL-standard `GENERATED ALWAYS AS IDENTITY`.' },
              { pattern: '\\bVARCHAR\\b', flags: 'i', message: 'Prefer `TEXT` over `VARCHAR(n)` in PostgreSQL.' }
            ]
          },
          solutionExplanation: 'PostgreSQL creates an implicit owned `BIGINT` sequence (`attidentity = \'a\'`) for `bin_id`, enforces a `UNIQUE` B-Tree index on `aisle_code`, and stores exact `NUMERIC(8,2)` weights alongside 8-byte UTC `TIMESTAMPTZ` creation timestamps.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Foreign Key Referential Types & Exact NUMERIC Procurement Costs',
          mission: 'Create table `supplier_invoices` with 5 columns: `invoice_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `product_id INTEGER NOT NULL REFERENCES products(product_id)`, `vendor_code TEXT NOT NULL`, `unit_cost_usd NUMERIC(10,2) NOT NULL`, and `billed_at TIMESTAMPTZ NOT NULL`. Do NOT use `SERIAL`, `VARCHAR`, or `FLOAT`/`REAL`/`DOUBLE PRECISION`.',
          setupSql: '',
          probeSql: [
            'INSERT INTO supplier_invoices (product_id, vendor_code, unit_cost_usd, billed_at) VALUES',
            '  (101, \'VND-SAMSUNG\', 289.50, \'2025-03-10 08:00:00+00\'),',
            '  (103, \'VND-MELLANOX\', 465.75, \'2025-03-11 09:30:00+00\');',
            'SELECT invoice_id,',
            '       product_id,',
            '       vendor_code,',
            '       unit_cost_usd,',
            '       (SELECT COUNT(*)::int FROM pg_constraint WHERE conrelid = \'supplier_invoices\'::regclass AND contype = \'f\') AS fk_count',
            'FROM supplier_invoices',
            'ORDER BY invoice_id ASC;'
          ].join('\n'),
          starterCode: [
            '-- TODO: Add product_id (FK to products), vendor_code (TEXT NOT NULL), unit_cost_usd (NUMERIC(10,2) NOT NULL), and billed_at (TIMESTAMPTZ NOT NULL)',
            'CREATE TABLE supplier_invoices (',
            '  invoice_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
            ');'
          ].join('\n'),
          solutionCode: [
            'CREATE TABLE supplier_invoices (',
            '  invoice_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
            '  product_id    INTEGER NOT NULL REFERENCES products(product_id),',
            '  vendor_code   TEXT NOT NULL,',
            '  unit_cost_usd NUMERIC(10,2) NOT NULL,',
            '  billed_at     TIMESTAMPTZ NOT NULL',
            ');'
          ].join('\n'),
          hints: [
            'Match `products.product_id`\'s exact type (`INTEGER`) on the foreign key column `product_id INTEGER NOT NULL REFERENCES products(product_id)`.',
            'Use `TEXT NOT NULL` for `vendor_code` and `NUMERIC(10,2) NOT NULL` for `unit_cost_usd`.',
            'Use `TIMESTAMPTZ NOT NULL` for `billed_at`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bREFERENCES\\s+products\\s*\\(\\s*product_id\\s*\\)', flags: 'i', message: 'Declare the foreign key `REFERENCES products(product_id)`.' },
              { pattern: '\\bNUMERIC\\s*\\(\\s*10\\s*,\\s*2\\s*\\)', flags: 'i', message: 'Use `NUMERIC(10,2)` for `unit_cost_usd`.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\b(REAL|FLOAT|DOUBLE)\\b', flags: 'i', message: 'Never use binary floating-point (`REAL`/`FLOAT`/`DOUBLE`) for invoice currency.' }
            ]
          },
          solutionExplanation: 'Matching `INTEGER` on `supplier_invoices.product_id` to `products.product_id` avoids cross-type hash/index friction during foreign-key enforcement triggers, while `NUMERIC(10,2)` stores exact decimal invoice amounts.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Controlled Historical Backfill with OVERRIDING SYSTEM VALUE',
          mission: 'Table `legacy_order_import` (`import_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `customer_id INTEGER NOT NULL`, `imported_usd NUMERIC(10,2) NOT NULL`) has been created. Backfill all `\'completed\'` orders from `orders` preserving `orders.order_id` as the explicit `import_id` (using `OVERRIDING SYSTEM VALUE`), `customer_id`, and `ROUND(total_cents::numeric / 100, 2)` as `imported_usd` sorted by `order_id ASC`, and append `RETURNING import_id, customer_id, imported_usd`.',
          setupSql: [
            'CREATE TABLE legacy_order_import (',
            '  import_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
            '  customer_id  INTEGER NOT NULL,',
            '  imported_usd NUMERIC(10,2) NOT NULL',
            ');'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- TODO: Write INSERT INTO legacy_order_import (import_id, customer_id, imported_usd) OVERRIDING SYSTEM VALUE SELECT ...',
            '-- (GENERATED ALWAYS AS IDENTITY blocks explicit import_id unless OVERRIDING SYSTEM VALUE is specified)',
            'SELECT order_id,',
            '       customer_id,',
            '       ROUND(total_cents::numeric / 100, 2) AS imported_usd',
            'FROM orders',
            'WHERE status = \'completed\'',
            'ORDER BY order_id ASC;'
          ].join('\n'),
          solutionCode: [
            'INSERT INTO legacy_order_import (import_id, customer_id, imported_usd)',
            'OVERRIDING SYSTEM VALUE',
            'SELECT order_id,',
            '       customer_id,',
            '       ROUND(total_cents::numeric / 100, 2)',
            'FROM orders',
            'WHERE status = \'completed\'',
            'ORDER BY order_id ASC',
            'RETURNING import_id, customer_id, imported_usd;'
          ].join('\n'),
          hints: [
            'Without `OVERRIDING SYSTEM VALUE`, PostgreSQL raises `cannot insert a non-DEFAULT value into column "import_id"`.',
            'Place `OVERRIDING SYSTEM VALUE` right after `INSERT INTO legacy_order_import (import_id, customer_id, imported_usd)` and before `SELECT`.',
            'Keep `WHERE status = \'completed\'`, `ORDER BY order_id ASC`, and `RETURNING import_id, customer_id, imported_usd`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bOVERRIDING\\s+SYSTEM\\s+VALUE\\b', flags: 'i', message: 'Include `OVERRIDING SYSTEM VALUE` between the column list and `SELECT`.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Return the inserted rows with `RETURNING import_id, customer_id, imported_usd`.' }
            ]
          },
          solutionExplanation: '`GENERATED ALWAYS AS IDENTITY` protects OLTP code from accidentally hardcoding IDs, while `OVERRIDING SYSTEM VALUE` acts as an explicit, self-documenting escape hatch for migrations and CDC/ETL historical loads.'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m02-t02 — ALTER TABLE Migrations, Non-Blocking Defaults, DROP & TRUNCATE
       ======================================================================== */
    {
      id: 'pg-m02-t02',
      slug: 'alter-table-safe-migrations-drop',
      moduleId: 'pg-m02',
      title: 'ALTER TABLE Migrations, Non-Blocking Defaults, DROP & TRUNCATE',
      difficulty: 'Intermediate',
      estimatedMinutes: 14,
      datasetId: 'ecommerce',
      clauses: ['ALTER TABLE', 'ADD COLUMN', 'ALTER COLUMN', 'DROP', 'TRUNCATE'],
      tags: ['alter-table', 'migrations', 'ddl', 'truncate', 'not-valid'],
      guide: {
        mentalModel: 'In production PostgreSQL clusters serving thousands of QPS, careless `ALTER TABLE` migrations are a leading cause of **AccessExclusiveLock convoys**. Since PostgreSQL 11+, `ALTER TABLE ... ADD COLUMN col TYPE NOT NULL DEFAULT const` with a **non-volatile constant default** is an **instant `O(1)` catalog-only operation**: PostgreSQL stores the missing-default value in `pg_attribute.attmissingval` (`atthasmissing = true`) and synthesizes it on-the-fly when reading pre-existing heap tuples—zero full-table rewrite required!\n\nConversely, adding a `CHECK` or `FOREIGN KEY` constraint normally scans the entire table while holding an `AccessExclusiveLock` (blocking all reads and writes!). Splitting the migration into **`ALTER TABLE ... ADD CONSTRAINT ... CHECK (...) NOT VALID`** (instant catalog write, enforces the rule on all **new** `INSERT`/`UPDATE` rows immediately while skipping historical rows!) followed later by **`ALTER TABLE ... VALIDATE CONSTRAINT ...`** (takes only a `ShareUpdateExclusiveLock`, allowing concurrent `SELECT`/`INSERT`/`UPDATE`/`DELETE`!) enables zero-downtime constraint rollouts. Finally, `TRUNCATE ... RESTART IDENTITY CASCADE` unlinks entire heap relfilenodes in `O(1)` without firing per-row `DELETE` triggers or leaving dead MVCC tuples behind, whereas `DROP TABLE` deletes the catalog relation entirely.',
        syntaxAnatomy: [
          '-- 1. Instant catalog-only ADD COLUMN (attmissingval optimization, zero heap rewrite!)',
          'ALTER TABLE products',
          '  ADD COLUMN weight_grams INTEGER NOT NULL DEFAULT 500,',
          '  ALTER COLUMN stock_qty SET DEFAULT 10;',
          '',
          '-- 2. Non-blocking CHECK constraint rollout (enforces new writes immediately)',
          'ALTER TABLE orders',
          '  ADD CONSTRAINT chk_orders_positive_total CHECK (total_cents > 0) NOT VALID;',
          '-- Later, validate under non-blocking ShareUpdateExclusiveLock:',
          '-- ALTER TABLE orders VALIDATE CONSTRAINT chk_orders_positive_total;',
          '',
          '-- 3. Fast relfilenode reset + sequence reset vs full catalog removal',
          'TRUNCATE TABLE staging_shipments RESTART IDENTITY CASCADE;',
          'DROP TABLE IF EXISTS deprecated_promo_cache;'
        ].join('\n'),
        internalsAndGotchas: [
          '`ADD COLUMN ... DEFAULT expr` is instant ONLY when `expr` is **non-volatile** (`500`, `\'standard\'`, `NOW()` which is `STABLE` evaluated once at DDL time); a `VOLATILE` default like `random()` or `clock_timestamp()` still forces a blocking full-table heap rewrite!',
          '`ALTER COLUMN col TYPE ...` almost always rewrites the entire table and rebuilds every index under `AccessExclusiveLock` (except binary-coercible changes like `VARCHAR(30)` -> `TEXT`).',
          'Even an instant `O(1)` `ALTER TABLE` requires a brief `AccessExclusiveLock`: if it queues behind a 5-minute reporting `SELECT`, every subsequent `SELECT` and `INSERT` queues behind the waiting `ALTER TABLE`! Always guard production DDL with `SET LOCAL lock_timeout = \'2s\';`.',
          '`TRUNCATE` acquires an `AccessExclusiveLock` and replaces the physical `relfilenode` on disk—never run `TRUNCATE` on live shared OLTP tables during traffic, though it is ideal for staging/partition resets.'
        ],
        whenToUse: 'Batch multiple `ALTER TABLE` subcommands into a single statement, use `NOT VALID` when introducing `CHECK` or `FOREIGN KEY` constraints onto live or historically dirty tables, use `TRUNCATE ... RESTART IDENTITY` to wipe staging tables without MVCC bloat, and `DROP TABLE IF EXISTS` to retire dead schemas.'
      },
      scenario: {
        role: 'Production Database Reliability Engineer (DBRE)',
        incidentOrGoal: 'Fulfillment needs two new non-null columns and an updated default on `products` without rewriting heap pages, `orders` contains a legacy `$0` historical row blocking a strict `total_cents > 0` check on new checkouts, and nightly staging tables need sequence-clean truncation alongside removal of an obsolete promo cache table.',
        stakeholderNeed: 'Execute fast catalog-only `ALTER TABLE` column additions, add an unvalidated `CHECK (...) NOT VALID` constraint on `orders`, and run `TRUNCATE ... RESTART IDENTITY CASCADE` + `DROP TABLE IF EXISTS`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Fast Catalog-Only ADD COLUMN & ALTER COLUMN SET DEFAULT',
          mission: 'Use `ALTER TABLE products` to: (1) add column `weight_grams INTEGER NOT NULL DEFAULT 500`, (2) add column `fulfillment_tier TEXT NOT NULL DEFAULT \'standard\'`, and (3) change the default of `stock_qty` to `10` (`ALTER COLUMN stock_qty SET DEFAULT 10`).',
          setupSql: '',
          probeSql: [
            'INSERT INTO products (product_id, sku, name, category_id, price_cents) VALUES',
            '  (109, \'CABLE-OPT-10M\', \'OM4 Fiber Patch 10m\', 30, 3200);',
            'SELECT product_id, sku, stock_qty, weight_grams, fulfillment_tier',
            'FROM products',
            'WHERE product_id IN (101, 109)',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          starterCode: [
            '-- TODO: Evolve products with ALTER TABLE products:',
            '--   ADD COLUMN weight_grams INTEGER NOT NULL DEFAULT 500,',
            '--   ADD COLUMN fulfillment_tier TEXT NOT NULL DEFAULT \'standard\',',
            '--   ALTER COLUMN stock_qty SET DEFAULT 10;',
            'SELECT product_id, sku, stock_qty',
            'FROM products',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'ALTER TABLE products',
            '  ADD COLUMN weight_grams INTEGER NOT NULL DEFAULT 500,',
            '  ADD COLUMN fulfillment_tier TEXT NOT NULL DEFAULT \'standard\',',
            '  ALTER COLUMN stock_qty SET DEFAULT 10;'
          ].join('\n'),
          hints: [
            'You can combine multiple `ADD COLUMN` and `ALTER COLUMN` actions separated by commas in a single `ALTER TABLE products` command.',
            'Include `NOT NULL DEFAULT 500` on `weight_grams` and `NOT NULL DEFAULT \'standard\'` on `fulfillment_tier`.',
            'Use `ALTER COLUMN stock_qty SET DEFAULT 10` so newly inserted products without an explicit `stock_qty` receive `10`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bALTER\\s+TABLE\\s+products\\b', flags: 'i', message: 'Alter the `products` table.' },
              { pattern: '\\bADD\\s+COLUMN\\s+weight_grams\\b', flags: 'i', message: 'Add column `weight_grams`.' },
              { pattern: '\\bALTER\\s+COLUMN\\s+stock_qty\\s+SET\\s+DEFAULT\\s+10\\b', flags: 'i', message: 'Set default on `stock_qty` to `10` using `ALTER COLUMN stock_qty SET DEFAULT 10`.' }
            ]
          },
          solutionExplanation: 'Batching all three catalog updates into a single `ALTER TABLE products` statement acquires the relation lock once and records `500` and `\'standard\'` in `pg_attribute.attmissingval`, so existing product `101` reads `500` and `\'standard\'` without rewriting any 8KB heap pages while newly inserted product `109` picks up `stock_qty = 10`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Protecting New Writes on Dirty Legacy Tables with CHECK ... NOT VALID',
          mission: 'A historical migration left a `$0` legacy order (`order_id = 999`, `total_cents = 0`) in `orders`, so a normal `ADD CONSTRAINT ... CHECK (total_cents > 0)` fails! Use `ALTER TABLE orders` to add constraint `chk_orders_positive_total` checking `CHECK (total_cents > 0)` marked `NOT VALID` so existing row `999` is skipped while all future inserts/updates with `total_cents <= 0` are immediately blocked.',
          setupSql: 'INSERT INTO orders (order_id, customer_id, status, total_cents, discount_code, created_at) VALUES (999, 1, \'refunded\', 0, NULL, \'2024-12-01 00:00:00\');',
          probeSql: [
            'SELECT conname,',
            '       contype,',
            '       convalidated,',
            '       pg_get_constraintdef(oid) AS definition',
            'FROM pg_constraint',
            'WHERE conrelid = \'orders\'::regclass',
            '  AND conname = \'chk_orders_positive_total\';'
          ].join('\n'),
          starterCode: [
            '-- TODO: Add CHECK (total_cents > 0) NOT VALID on orders as chk_orders_positive_total.',
            '-- (Historical order #999 has total_cents = 0, so a validated CHECK fails unless marked NOT VALID!)',
            'SELECT order_id, status, total_cents',
            'FROM orders',
            'WHERE total_cents <= 0;'
          ].join('\n'),
          solutionCode: [
            'ALTER TABLE orders',
            '  ADD CONSTRAINT chk_orders_positive_total CHECK (total_cents > 0) NOT VALID;'
          ].join('\n'),
          hints: [
            'Without `NOT VALID`, PostgreSQL immediately scans all existing rows in `orders` and aborts on `order_id = 999` (`total_cents = 0`).',
            'Append `NOT VALID` right after `CHECK (total_cents > 0)`.',
            'Keep the exact constraint name `chk_orders_positive_total`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bADD\\s+CONSTRAINT\\s+chk_orders_positive_total\\b', flags: 'i', message: 'Name the constraint `chk_orders_positive_total`.' },
              { pattern: '\\bNOT\\s+VALID\\b', flags: 'i', message: 'Mark the constraint `NOT VALID` to skip scanning legacy historical rows.' }
            ]
          },
          solutionExplanation: 'Adding `NOT VALID` sets `pg_constraint.convalidated = false`, skipping the expensive full-table scan (and legacy row `999`) while immediately enforcing `total_cents > 0` on every subsequent `INSERT` or `UPDATE` touching `total_cents`. Once legacy rows are remediated, `ALTER TABLE orders VALIDATE CONSTRAINT chk_orders_positive_total;` flips `convalidated = true` online.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Zero-Bloat Staging Reset (TRUNCATE RESTART IDENTITY CASCADE) & DROP TABLE',
          mission: 'Two staging tables (`staging_shipments` with identity sequence at `42`, referenced by child table `staging_shipment_events`) and an obsolete table `deprecated_promo_cache` exist in the database. Write two DDL statements: (1) `TRUNCATE TABLE staging_shipments RESTART IDENTITY CASCADE;` so both staging tables are emptied and `staging_shipments.stage_id` resets back to `1`, and (2) `DROP TABLE IF EXISTS deprecated_promo_cache;`.',
          setupSql: [
            'CREATE TABLE staging_shipments (',
            '  stage_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 42) PRIMARY KEY,',
            '  tracking_code TEXT NOT NULL',
            ');',
            'CREATE TABLE staging_shipment_events (',
            '  event_id INTEGER PRIMARY KEY,',
            '  stage_id BIGINT NOT NULL REFERENCES staging_shipments(stage_id),',
            '  note TEXT NOT NULL',
            ');',
            'INSERT INTO staging_shipments (tracking_code) VALUES (\'OLD-TRK-1\'), (\'OLD-TRK-2\');',
            'ALTER TABLE staging_shipments ALTER COLUMN stage_id SET START WITH 1;',
            'INSERT INTO staging_shipment_events VALUES (1, 42, \'arrived\');',
            'CREATE TABLE deprecated_promo_cache (promo_code TEXT PRIMARY KEY);',
            'INSERT INTO deprecated_promo_cache VALUES (\'OLD2023\');'
          ].join('\n'),
          probeSql: [
            'INSERT INTO staging_shipments (tracking_code) VALUES (\'FRESH-BATCH-01\');',
            'SELECT s.stage_id,',
            '       s.tracking_code,',
            '       (SELECT COUNT(*)::int FROM staging_shipment_events) AS child_rows_left,',
            '       (to_regclass(\'deprecated_promo_cache\') IS NULL) AS cache_dropped',
            'FROM staging_shipments s;'
          ].join('\n'),
          starterCode: [
            '-- 1. Empty staging_shipments (and dependent child rows) and reset its identity sequence to 1',
            '-- TODO: TRUNCATE TABLE staging_shipments RESTART IDENTITY CASCADE;',
            '',
            '-- 2. Permanently drop deprecated_promo_cache',
            '-- TODO: DROP TABLE IF EXISTS deprecated_promo_cache;'
          ].join('\n'),
          solutionCode: [
            'TRUNCATE TABLE staging_shipments RESTART IDENTITY CASCADE;',
            'DROP TABLE IF EXISTS deprecated_promo_cache;'
          ].join('\n'),
          hints: [
            'Because `staging_shipment_events` holds a foreign key to `staging_shipments`, plain `TRUNCATE staging_shipments` fails unless `CASCADE` is included.',
            'Include `RESTART IDENTITY` in `TRUNCATE TABLE staging_shipments RESTART IDENTITY CASCADE;` so the next inserted row receives `stage_id = 1` instead of `44`.',
            'Follow with `DROP TABLE IF EXISTS deprecated_promo_cache;`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bTRUNCATE\\b[\\s\\S]+\\bRESTART\\s+IDENTITY\\b[\\s\\S]+\\bCASCADE\\b', flags: 'i', message: 'Use `TRUNCATE TABLE staging_shipments RESTART IDENTITY CASCADE`.' },
              { pattern: '\\bDROP\\s+TABLE\\b[\\s\\S]+\\bdeprecated_promo_cache\\b', flags: 'i', message: 'Drop `deprecated_promo_cache` using `DROP TABLE`.' }
            ]
          },
          solutionExplanation: '`TRUNCATE ... RESTART IDENTITY CASCADE` atomically allocates fresh empty `relfilenode` files for both `staging_shipments` and `staging_shipment_events` while rewinding the owned sequence to its start value (`1`), and `DROP TABLE IF EXISTS deprecated_promo_cache` removes both the storage file and `pg_class` catalog entry.'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m02-t03 — PK, FK Cascade Rules, CHECK, UNIQUE NULLS NOT DISTINCT & DEFERRABLE
       ======================================================================== */
    {
      id: 'pg-m02-t03',
      slug: 'constraints-nulls-not-distinct-deferrable',
      moduleId: 'pg-m02',
      title: 'PK, FK Cascade Rules, CHECK, UNIQUE NULLS NOT DISTINCT & DEFERRABLE',
      difficulty: 'Intermediate',
      estimatedMinutes: 16,
      datasetId: 'fintech_ledger',
      clauses: ['PRIMARY KEY', 'REFERENCES', 'CHECK', 'NULLS NOT DISTINCT', 'DEFERRABLE'],
      tags: ['constraints', 'foreign-keys', 'nulls-not-distinct', 'deferrable', 'integrity'],
      guide: {
        mentalModel: 'Application-level validation inside concurrent API workers is fundamentally vulnerable to **Read Committed write skew**: two transactions can both observe zero conflicting rows under their independent snapshots and commit inconsistent state unless the storage engine itself enforces invariants via `pg_constraint`.\n\nPostgreSQL provides five surgical integrity layers: `PRIMARY KEY` (`NOT NULL` + `UNIQUE` B-Tree), `FOREIGN KEY ... ON DELETE CASCADE / RESTRICT / SET NULL` (implemented via internal system RI triggers acquiring lightweight `FOR KEY SHARE` tuple locks), `CHECK (bool_expr)` (succeeds when `TRUE` or **`UNKNOWN`/`NULL`**, fails only when `FALSE`!), PostgreSQL 15+ **`UNIQUE NULLS NOT DISTINCT`** (`indnullsnotdistinct = true` in `pg_index`, treating two `NULL`s as equal so at most one global/`NULL`-scoped row can exist per parent key!), and **`DEFERRABLE INITIALLY DEFERRED`** unique/FK constraints that postpone uniqueness checks from statement-end until `COMMIT` (or `SET CONSTRAINTS ... IMMEDIATE`), enabling clean in-place key and rank swaps without temporary dummy values.',
        syntaxAnatomy: [
          '-- 1. PG 15+ UNIQUE NULLS NOT DISTINCT: prevents duplicate (account_id, NULL) rows!',
          'CREATE TABLE account_fee_overrides (',
          '  override_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
          '  account_id  INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,',
          '  region_code TEXT,',
          '  fee_bps     INTEGER NOT NULL CHECK (fee_bps BETWEEN 0 AND 1000),',
          '  UNIQUE NULLS NOT DISTINCT (account_id, region_code)',
          ');',
          '',
          '-- 2. DEFERRABLE INITIALLY DEFERRED unique rank swap without collisions:',
          'ALTER TABLE settlement_priority_slots',
          '  ADD CONSTRAINT uq_priority_slot_rank UNIQUE (slot_rank) DEFERRABLE INITIALLY DEFERRED;'
        ].join('\n'),
        internalsAndGotchas: [
          'Unlike `WHERE` (which requires `TRUE`), a `CHECK` constraint **passes** when its expression evaluates to `UNKNOWN` (`NULL`)! Always pair `CHECK` with `NOT NULL` when `NULL` should be forbidden.',
          'Standard SQL `UNIQUE (account_id, region_code)` (`NULLS DISTINCT`) allows **infinite** duplicate `(101, NULL)` rows because `NULL <> NULL`; PostgreSQL 15+ `UNIQUE NULLS NOT DISTINCT (account_id, region_code)` enforces at most one `(101, NULL)` row directly in the B-Tree!',
          '`INSERT ... ON CONFLICT` **cannot** use a `DEFERRABLE` unique index as its conflict arbiter—only declare constraints `DEFERRABLE` when multi-statement or multi-row intermediate collisions genuinely occur.',
          'PostgreSQL automatically creates an index for `PRIMARY KEY` and `UNIQUE`, but **does NOT automatically index `FOREIGN KEY` referencing columns**—always index child FK columns in production so parent `DELETE`/`UPDATE` checks do not trigger sequential scans!'
        ],
        whenToUse: 'Push financial, range, and uniqueness invariants into `CHECK`, `REFERENCES`, and `UNIQUE NULLS NOT DISTINCT` constraints in storage, and reserve `DEFERRABLE INITIALLY DEFERRED` for ordered slot/rank swaps and cyclic foreign-key inserts.'
      },
      scenario: {
        role: 'Principal Ledger Integrity Engineer',
        incidentOrGoal: 'Three ledger bugs hit staging: invalid 5-digit routing codes and >100% beneficiary splits slipped past API checks, duplicate `(account_id, NULL)` global fee overrides accumulated because standard `UNIQUE` ignores `NULL`s, and swapping two settlement priority ranks threw an immediate unique-key collision.',
        stakeholderNeed: 'Create `account_beneficiaries` with `ON DELETE CASCADE` and domain `CHECK`s, enforce single-`NULL` uniqueness with `UNIQUE NULLS NOT DISTINCT`, and execute an atomic rank swap using `DEFERRABLE INITIALLY DEFERRED`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Foreign Key Cascade Rules & Domain CHECK Invariants',
          mission: 'Create table `account_beneficiaries` with 4 columns: `beneficiary_id INTEGER PRIMARY KEY`, `account_id INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE`, `allocation_bps INTEGER NOT NULL CHECK (allocation_bps BETWEEN 1 AND 10000)`, and `routing_number TEXT NOT NULL CHECK (LENGTH(routing_number) = 9)`.',
          setupSql: '',
          probeSql: [
            'INSERT INTO account_beneficiaries VALUES',
            '  (1, 101, 6000, \'021000021\'),',
            '  (2, 101, 4000, \'121000358\');',
            'SELECT b.beneficiary_id,',
            '       b.account_id,',
            '       b.allocation_bps,',
            '       b.routing_number,',
            '       (SELECT confdeltype FROM pg_constraint WHERE conrelid = \'account_beneficiaries\'::regclass AND contype = \'f\') AS fk_del_rule,',
            '       (SELECT COUNT(*)::int FROM pg_constraint WHERE conrelid = \'account_beneficiaries\'::regclass AND contype = \'c\') AS check_count',
            'FROM account_beneficiaries b',
            'ORDER BY b.beneficiary_id ASC;'
          ].join('\n'),
          starterCode: [
            '-- TODO: Add account_id (FK ON DELETE CASCADE), allocation_bps (CHECK 1..10000), and routing_number (LENGTH = 9)',
            'CREATE TABLE account_beneficiaries (',
            '  beneficiary_id INTEGER PRIMARY KEY',
            ');'
          ].join('\n'),
          solutionCode: [
            'CREATE TABLE account_beneficiaries (',
            '  beneficiary_id INTEGER PRIMARY KEY,',
            '  account_id     INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,',
            '  allocation_bps INTEGER NOT NULL CHECK (allocation_bps BETWEEN 1 AND 10000),',
            '  routing_number TEXT NOT NULL CHECK (LENGTH(routing_number) = 9)',
            ');'
          ].join('\n'),
          hints: [
            'Include `ON DELETE CASCADE` on the `account_id` foreign key so `pg_constraint.confdeltype` records `\'c\'` (cascade).',
            'Add `CHECK (allocation_bps BETWEEN 1 AND 10000)` (or `>= 1 AND <= 10000`) on `allocation_bps`.',
            'Add `CHECK (LENGTH(routing_number) = 9)` (or `CHAR_LENGTH`) on `routing_number`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bON\\s+DELETE\\s+CASCADE\\b', flags: 'i', message: 'Configure `REFERENCES accounts(account_id) ON DELETE CASCADE`.' },
              { pattern: '\\bCHECK\\s*\\(', flags: 'i', message: 'Define `CHECK (...)` constraints on `allocation_bps` and `routing_number`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL records `confdeltype = \'c\'` for `ON DELETE CASCADE` and stores two compiled `CHECK` expressions in `pg_constraint`, guaranteeing no client or microservice can ever commit negative basis points or malformed ABA routing numbers.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Closing the Duplicate-NULL Loophole with UNIQUE NULLS NOT DISTINCT',
          mission: 'Create table `account_fee_overrides` with 4 columns: `override_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `account_id INTEGER NOT NULL REFERENCES accounts(account_id)`, `region_code TEXT` (nullable — `NULL` means global default override), and `fee_bps INTEGER NOT NULL CHECK (fee_bps >= 0)`. Add a table-level `UNIQUE NULLS NOT DISTINCT (account_id, region_code)` constraint so an account can have at most ONE `(account_id, NULL)` global override.',
          setupSql: '',
          probeSql: [
            'INSERT INTO account_fee_overrides (account_id, region_code, fee_bps) VALUES',
            '  (101, NULL, 15),',
            '  (101, \'EU\', 10),',
            '  (102, NULL, 20);',
            'SELECT f.override_id,',
            '       f.account_id,',
            '       f.region_code,',
            '       f.fee_bps,',
            '       (SELECT i.indnullsnotdistinct FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE i.indrelid = \'account_fee_overrides\'::regclass AND NOT i.indisprimary) AS nulls_not_distinct',
            'FROM account_fee_overrides f',
            'ORDER BY f.override_id ASC;'
          ].join('\n'),
          starterCode: [
            '-- Prevent duplicate (account_id, NULL) global overrides using UNIQUE NULLS NOT DISTINCT',
            'CREATE TABLE account_fee_overrides (',
            '  override_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
            '  account_id  INTEGER NOT NULL REFERENCES accounts(account_id),',
            '  region_code TEXT,',
            '  fee_bps     INTEGER NOT NULL CHECK (fee_bps >= 0)',
            '  -- TODO: add UNIQUE NULLS NOT DISTINCT (account_id, region_code)',
            ');'
          ].join('\n'),
          solutionCode: [
            'CREATE TABLE account_fee_overrides (',
            '  override_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
            '  account_id  INTEGER NOT NULL REFERENCES accounts(account_id),',
            '  region_code TEXT,',
            '  fee_bps     INTEGER NOT NULL CHECK (fee_bps >= 0),',
            '  UNIQUE NULLS NOT DISTINCT (account_id, region_code)',
            ');'
          ].join('\n'),
          hints: [
            'Standard `UNIQUE (account_id, region_code)` sets `indnullsnotdistinct = false`, allowing unlimited `(101, NULL)` rows.',
            'Write `UNIQUE NULLS NOT DISTINCT (account_id, region_code)` as a table constraint inside `CREATE TABLE`.',
            'Don\'t forget the comma after `fee_bps INTEGER NOT NULL CHECK (fee_bps >= 0)`!'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUNIQUE\\s+NULLS\\s+NOT\\s+DISTINCT\\s*\\(\\s*account_id\\s*,\\s*region_code\\s*\\)', flags: 'i', message: 'Declare `UNIQUE NULLS NOT DISTINCT (account_id, region_code)`.' }
            ]
          },
          solutionExplanation: 'Before PostgreSQL 15, enforcing single-`NULL` uniqueness required awkward partial unique indexes (`CREATE UNIQUE INDEX ... ON t(account_id) WHERE region_code IS NULL`). `UNIQUE NULLS NOT DISTINCT` sets `pg_index.indnullsnotdistinct = true` on a single unified B-Tree index.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Collision-Free Slot Swaps with DEFERRABLE INITIALLY DEFERRED',
          mission: 'Table `settlement_priority_slots` (`account_id INTEGER PRIMARY KEY REFERENCES accounts(account_id)`, `slot_rank INTEGER NOT NULL`) currently holds `(100, 1)` and `(101, 2)`. Do two things in your SQL script: (1) `ALTER TABLE settlement_priority_slots` to `ADD CONSTRAINT uq_priority_slot_rank UNIQUE (slot_rank) DEFERRABLE INITIALLY DEFERRED;`, and (2) swap the two accounts\' ranks across two `UPDATE` statements so `account_id = 100` gets `slot_rank = 2` and `account_id = 101` gets `slot_rank = 1`.',
          setupSql: [
            'CREATE TABLE settlement_priority_slots (',
            '  account_id INTEGER PRIMARY KEY REFERENCES accounts(account_id),',
            '  slot_rank  INTEGER NOT NULL',
            ');',
            'INSERT INTO settlement_priority_slots VALUES (100, 1), (101, 2);'
          ].join('\n'),
          probeSql: [
            'SET CONSTRAINTS uq_priority_slot_rank IMMEDIATE;',
            'SELECT s.account_id,',
            '       s.slot_rank,',
            '       (SELECT c.condeferrable AND c.condeferred FROM pg_constraint c WHERE c.conrelid = \'settlement_priority_slots\'::regclass AND c.conname = \'uq_priority_slot_rank\') AS is_deferred_unique',
            'FROM settlement_priority_slots s',
            'ORDER BY s.slot_rank ASC;'
          ].join('\n'),
          starterCode: [
            '-- TODO: Add DEFERRABLE INITIALLY DEFERRED unique constraint uq_priority_slot_rank on (slot_rank),',
            '-- then swap account 100 -> rank 2 and account 101 -> rank 1 across two UPDATEs!',
            'SELECT account_id, slot_rank',
            'FROM settlement_priority_slots',
            'ORDER BY slot_rank ASC;'
          ].join('\n'),
          solutionCode: [
            'ALTER TABLE settlement_priority_slots',
            '  ADD CONSTRAINT uq_priority_slot_rank UNIQUE (slot_rank) DEFERRABLE INITIALLY DEFERRED;',
            '',
            'UPDATE settlement_priority_slots SET slot_rank = 2 WHERE account_id = 100;',
            'UPDATE settlement_priority_slots SET slot_rank = 1 WHERE account_id = 101;'
          ].join('\n'),
          hints: [
            'With a normal `NOT DEFERRABLE` unique constraint, `SET slot_rank = 2 WHERE account_id = 100` immediately collides with `(101, 2)` and aborts the transaction.',
            'Append `DEFERRABLE INITIALLY DEFERRED` to `ADD CONSTRAINT uq_priority_slot_rank UNIQUE (slot_rank)`.',
            'Keep the two `UPDATE` statements setting `account_id = 100` to `slot_rank = 2` and `account_id = 101` to `slot_rank = 1`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bDEFERRABLE\\s+INITIALLY\\s+DEFERRED\\b', flags: 'i', message: 'Declare `uq_priority_slot_rank` as `DEFERRABLE INITIALLY DEFERRED`.' },
              { pattern: '\\bUPDATE\\s+settlement_priority_slots\\b', flags: 'i', message: 'Update `settlement_priority_slots` to swap ranks `1` and `2`.' }
            ]
          },
          solutionExplanation: 'Marking `uq_priority_slot_rank` as `DEFERRABLE INITIALLY DEFERRED` (`condeferrable = true, condeferred = true`) queues a deferred uniqueness recheck trigger on the momentary duplicate `(slot_rank = 2)` during statement 1, verifying cleanly once statement 2 restores global uniqueness (`(101, 1)` and `(100, 2)`).'
        }
      ]
    },

    /* ========================================================================
       LAB 04: pg-m02-t04 — INSERT Multi-Row Batches, INSERT ... SELECT & RETURNING
       ======================================================================== */
    {
      id: 'pg-m02-t04',
      slug: 'insert-multi-row-select-returning',
      moduleId: 'pg-m02',
      title: 'INSERT Multi-Row Batches, INSERT ... SELECT & RETURNING',
      difficulty: 'Beginner',
      estimatedMinutes: 12,
      datasetId: 'ecommerce',
      clauses: ['INSERT INTO', 'VALUES', 'INSERT ... SELECT', 'RETURNING'],
      tags: ['insert', 'dml', 'returning', 'batching'],
      guide: {
        mentalModel: 'Every standalone `INSERT` statement sent over TCP incurs network round-trip latency, parser/planner overhead, transaction XID assignment, and a synchronous WAL flush (`XLogFlush`) at commit. Batching rows into a **multi-row `INSERT INTO ... VALUES (...), (...), (...)`** amortizes planning, index maintenance, and WAL `fsync` overhead across hundreds or thousands of tuples in a single statement.\n\nEven better, PostgreSQL\'s **`RETURNING`** clause projects arbitrary expressions (`id`, `created_at`, or computed columns like `ROUND(price_cents::numeric / 100, 2)`) directly out of the `ModifyTable` executor node as tuples are inserted—eliminating racy follow-up `SELECT MAX(id)` or second-roundtrip read-backs! For set-based backfills and archival pipelines, **`INSERT INTO target (...) SELECT ... FROM source`** streams tuples directly inside PostgreSQL\'s C executor without ever serializing intermediate rows back to the application.',
        syntaxAnatomy: [
          '-- 1. Single-roundtrip multi-row batch + RETURNING computed columns',
          'INSERT INTO products (product_id, sku, name, category_id, price_cents, stock_qty)',
          'VALUES',
          '  (109, \'NVME-8TB-ENT\', \'Enterprise Gen5 NVMe 8TB\', 20, 79000, 18),',
          '  (110, \'NIC-200G-QSFP\', \'Single-Port 200GbE NIC\',   30, 84000, 12)',
          'RETURNING product_id, sku, ROUND(price_cents::numeric / 100, 2) AS price_usd;',
          '',
          '-- 2. In-engine set backfill via INSERT ... SELECT ... RETURNING',
          'INSERT INTO vip_order_audit (order_id, customer_id, order_usd)',
          'SELECT order_id, customer_id, ROUND(total_cents::numeric / 100, 2)',
          'FROM orders',
          'WHERE status = \'completed\' AND total_cents >= 80000',
          'RETURNING audit_id, order_id, order_usd;'
        ].join('\n'),
        internalsAndGotchas: [
          'Always list target columns explicitly (`INSERT INTO tbl (c1, c2) ...`): relying on positional `INSERT INTO tbl VALUES (...)` breaks silently or crashes the moment an `ALTER TABLE ADD COLUMN` appends a column!',
          'In PostgreSQL\'s wire protocol, prepared statements support at most `65,535` bind parameters (`$1..$65535`); for `10`-column rows, batch `500–2,000` rows per multi-row `INSERT` (or use `UNNEST($1::int[], $2::text[])` / `COPY` for larger loads).',
          '`INSERT ... RETURNING` streams rows in insertion order, and can even be wrapped inside a data-modifying CTE (`WITH ins AS (INSERT ... RETURNING id) INSERT INTO child ...`) to populate parent + child tables in a single SQL round-trip!',
          'If any single row in a `1,000`-row `INSERT` batch violates a `NOT NULL`, `CHECK`, or `UNIQUE` constraint, PostgreSQL atomically aborts the entire statement (all `1,000` rows roll back to the statement\'s internal sub-state).'
        ],
        whenToUse: 'Always list explicit target columns, batch multi-row writes into `VALUES (...), (...)` chunks, use `INSERT ... SELECT` for in-database backfills, and attach `RETURNING` whenever callers need generated IDs, defaults, or timestamps.'
      },
      scenario: {
        role: 'Order & Inventory Services Engineer',
        incidentOrGoal: 'Warehouse ingestion was issuing 3 separate round-trips per SKU batch and running `SELECT * FROM products WHERE sku = ...` afterward, VIP audit backfills were pulling rows into Node.js just to re-insert them, and two completed orders (`1003`, `1008`) are missing dispatch rows in `shipments`.',
        stakeholderNeed: 'Write a single-roundtrip multi-row `INSERT ... RETURNING` on `products`, an `INSERT ... SELECT ... RETURNING` audit backfill, and an anti-join shipment dispatch `INSERT ... SELECT`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Multi-Row Batch INSERT with Computed RETURNING Projection',
          mission: 'Insert 3 new active products into `products` (`product_id, sku, name, category_id, price_cents, stock_qty, is_active`) in a single multi-row `VALUES` statement: `(109, \'NVME-8TB-ENT\', \'Enterprise Gen5 NVMe 8TB\', 20, 79000, 18, 1)`, `(110, \'NIC-200G-SP\', \'Single-Port 200GbE NIC\', 30, 84000, 12, 1)`, and `(111, \'PG-DIAG-LIC\', \'Postgres Diagnostics Pack\', 40, 29000, 999, 1)`. Use `RETURNING` to return `product_id`, `sku`, `stock_qty`, and `ROUND(price_cents::numeric / 100, 2) AS price_usd`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Insert all 3 products in one multi-row VALUES batch and stream back computed price_usd',
            'INSERT INTO products (product_id, sku, name, category_id, price_cents, stock_qty, is_active)',
            'VALUES',
            '  (109, \'NVME-8TB-ENT\', \'Enterprise Gen5 NVMe 8TB\', 20, 79000, 18, 1)',
            '  -- TODO: add rows 110 and 111',
            '-- TODO: RETURNING product_id, sku, stock_qty, ROUND(price_cents::numeric / 100, 2) AS price_usd;'
          ].join('\n'),
          solutionCode: [
            'INSERT INTO products (product_id, sku, name, category_id, price_cents, stock_qty, is_active)',
            'VALUES',
            '  (109, \'NVME-8TB-ENT\', \'Enterprise Gen5 NVMe 8TB\', 20, 79000, 18, 1),',
            '  (110, \'NIC-200G-SP\', \'Single-Port 200GbE NIC\', 30, 84000, 12, 1),',
            '  (111, \'PG-DIAG-LIC\', \'Postgres Diagnostics Pack\', 40, 29000, 999, 1)',
            'RETURNING product_id,',
            '          sku,',
            '          stock_qty,',
            '          ROUND(price_cents::numeric / 100, 2) AS price_usd;'
          ].join('\n'),
          hints: [
            'Separate the 3 row tuples inside `VALUES` with commas.',
            'Double-check exact SKU strings, `category_id` (`20`, `30`, `40`), `price_cents` (`79000`, `84000`, `29000`), and `stock_qty` (`18`, `12`, `999`).',
            'Attach `RETURNING product_id, sku, stock_qty, ROUND(price_cents::numeric / 100, 2) AS price_usd` at the end.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bINSERT\\s+INTO\\s+products\\b', flags: 'i', message: 'Insert into `products`.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Use `RETURNING` to stream inserted keys and `price_usd` in one roundtrip.' }
            ]
          },
          solutionExplanation: 'A single `ModifyTable` node inserts all three tuples into `products`, updates `products_pkey`, `products_sku_key`, and `idx_products_category_price` in one pass, and evaluates `ROUND(price_cents::numeric / 100, 2)` directly in `RETURNING`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Set-Based Audit Backfill with INSERT ... SELECT ... RETURNING',
          mission: 'Table `vip_order_audit` (`audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `order_id INTEGER NOT NULL`, `customer_id INTEGER NOT NULL`, `order_usd NUMERIC(10,2) NOT NULL`) has been created. Populate it using `INSERT INTO vip_order_audit (order_id, customer_id, order_usd) SELECT ...` for all `orders` with `status = \'completed\'` AND `total_cents >= 80000`, ordered by `order_id ASC`, and return `audit_id, order_id, customer_id, order_usd` via `RETURNING`.',
          setupSql: [
            'CREATE TABLE vip_order_audit (',
            '  audit_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
            '  order_id    INTEGER NOT NULL,',
            '  customer_id INTEGER NOT NULL,',
            '  order_usd   NUMERIC(10,2) NOT NULL',
            ');'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- TODO: Stream qualifying VIP orders into vip_order_audit and return generated audit_id values:',
            '-- INSERT INTO vip_order_audit (order_id, customer_id, order_usd)',
            '-- SELECT ... RETURNING audit_id, order_id, customer_id, order_usd;',
            'SELECT o.order_id, o.customer_id, ROUND(o.total_cents::numeric / 100, 2) AS order_usd',
            'FROM orders o',
            'JOIN customers c ON c.customer_id = o.customer_id',
            'WHERE o.status = \'completed\' AND o.total_cents >= 100000 AND c.tier = \'enterprise\'',
            'ORDER BY o.order_id ASC;'
          ].join('\n'),
          solutionCode: [
            'INSERT INTO vip_order_audit (order_id, customer_id, order_usd)',
            'SELECT order_id,',
            '       customer_id,',
            '       ROUND(total_cents::numeric / 100, 2)',
            'FROM orders',
            'WHERE status = \'completed\'',
            '  AND total_cents >= 80000',
            'ORDER BY order_id ASC',
            'RETURNING audit_id, order_id, customer_id, order_usd;'
          ].join('\n'),
          hints: [
            'Omit `audit_id` from the `INSERT` target column list so `GENERATED ALWAYS AS IDENTITY` assigns `1, 2, 3, 4` automatically.',
            'Filter `FROM orders WHERE status = \'completed\' AND total_cents >= 80000 ORDER BY order_id ASC`.',
            'End with `RETURNING audit_id, order_id, customer_id, order_usd`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bINSERT\\s+INTO\\s+vip_order_audit\\b[\\s\\S]+\\bSELECT\\b', flags: 'i', message: 'Use `INSERT INTO vip_order_audit (...) SELECT ...`.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Return generated `audit_id` rows via `RETURNING`.' }
            ]
          },
          solutionExplanation: 'Piping `SELECT ... FROM orders` directly into `INSERT INTO vip_order_audit` keeps tuple flow entirely inside PostgreSQL\'s C executor while `RETURNING` streams back the freshly minted identity keys (`1..4`) for orders `1001, 1003, 1004, 1010`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Dispatching Unshipped Completed Orders via INSERT ... SELECT',
          mission: 'Insert missing `shipments` rows (`shipment_id, order_id, carrier, tracking_no, shipped_at, delivered_at`) for every `\'completed\'` order in `orders` that does NOT yet exist in `shipments` (`NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.order_id)`). Compute `shipment_id` as `o.order_id - 290`, `carrier` as `\'DHL\'`, `tracking_no` as `\'DHL-AUTO-\' || o.order_id`, `shipped_at` as `\'2025-03-30\'`, and `delivered_at` as `NULL`, sorted by `o.order_id ASC`. Return `shipment_id, order_id, carrier, tracking_no` via `RETURNING`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Auto-dispatch completed orders that do not yet have a row in shipments',
            'INSERT INTO shipments (shipment_id, order_id, carrier, tracking_no, shipped_at, delivered_at)',
            'SELECT o.order_id - 290,',
            '       o.order_id,',
            '       \'DHL\',',
            '       \'DHL-AUTO-\' || o.order_id,',
            '       \'2025-03-30\',',
            '       NULL',
            'FROM orders o',
            '-- TODO: filter completed orders missing from shipments, ORDER BY o.order_id ASC, and RETURNING ...'
          ].join('\n'),
          solutionCode: [
            'INSERT INTO shipments (shipment_id, order_id, carrier, tracking_no, shipped_at, delivered_at)',
            'SELECT o.order_id - 290,',
            '       o.order_id,',
            '       \'DHL\',',
            '       \'DHL-AUTO-\' || o.order_id,',
            '       \'2025-03-30\',',
            '       NULL',
            'FROM orders o',
            'WHERE o.status = \'completed\'',
            '  AND NOT EXISTS (',
            '    SELECT 1 FROM shipments s WHERE s.order_id = o.order_id',
            '  )',
            'ORDER BY o.order_id ASC',
            'RETURNING shipment_id, order_id, carrier, tracking_no;'
          ].join('\n'),
          hints: [
            'Filter `WHERE o.status = \'completed\'` first.',
            'Add `AND NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.order_id)` (or `LEFT JOIN shipments s ... WHERE s.shipment_id IS NULL`) to find unshipped completed orders (`1003` and `1008`).',
            'Keep `ORDER BY o.order_id ASC` and `RETURNING shipment_id, order_id, carrier, tracking_no`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bINSERT\\s+INTO\\s+shipments\\b[\\s\\S]+\\bSELECT\\b', flags: 'i', message: 'Use `INSERT INTO shipments (...) SELECT ...`.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Stream newly created shipments with `RETURNING`.' }
            ]
          },
          solutionExplanation: 'Completed orders `1003` (Cloud License) and `1008` had no `shipments` record; the `NOT EXISTS` anti-join identifies them cleanly and inserts `shipment_id` `713` and `718` in a single atomic statement.'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m02-t05 — Conditional UPDATE Mutations & Multi-Table UPDATE ... FROM
       ======================================================================== */
    {
      id: 'pg-m02-t05',
      slug: 'update-expressions-update-from',
      moduleId: 'pg-m02',
      title: 'Conditional UPDATE Mutations & Multi-Table UPDATE ... FROM',
      difficulty: 'Intermediate',
      estimatedMinutes: 14,
      datasetId: 'ecommerce',
      clauses: ['UPDATE', 'SET', 'FROM', 'RETURNING'],
      tags: ['update', 'update-from', 'dml', 'returning'],
      guide: {
        mentalModel: 'Under PostgreSQL\'s Multi-Version Concurrency Control (`MVCC`) architecture, **an `UPDATE` never overwrites bytes in place**: it marks the existing tuple\'s `t_xmax` with the updating transaction\'s XID and appends a **brand-new tuple version** (`t_xmin = current_xid`) onto an 8KB heap page (triggering a fast **HOT — Heap-Only Tuple** update only if no indexed column changed and free space exists on the same 8KB page!).\n\nAll right-hand expressions in `SET col1 = expr1, col2 = expr2` are evaluated **simultaneously against the pre-update tuple snapshot** (`SET a = b, b = a` cleanly swaps `a` and `b` in SQL!). When an update depends on another table, PostgreSQL uses **`UPDATE target SET ... FROM other_table WHERE target.fk = other_table.pk`** (do **not** repeat the target table inside `FROM`, which creates an unintended self-join!). Crucially, if the `FROM` join matches a single target row **more than once** (a `1-to-N` fan-out), PostgreSQL updates that target tuple only once using an arbitrary matching source row—so always pre-aggregate `1-to-N` child tables inside `FROM (SELECT ... GROUP BY ...)`!',
        syntaxAnatomy: [
          '-- Pre-aggregate 1-to-N child rows before joining in UPDATE ... FROM',
          'UPDATE products p',
          'SET stock_qty = p.stock_qty - s.sold_qty',
          'FROM (',
          '  SELECT oi.product_id, SUM(oi.quantity)::integer AS sold_qty',
          '  FROM order_items oi',
          '  JOIN orders o ON oi.order_id = o.order_id',
          '  WHERE o.status = \'completed\'',
          '  GROUP BY oi.product_id',
          ') s',
          'WHERE p.product_id = s.product_id',
          'RETURNING p.product_id, p.sku, s.sold_qty, p.stock_qty AS remaining_stock;'
        ].join('\n'),
        internalsAndGotchas: [
          'Never repeat the target table inside `FROM` (`UPDATE orders o SET ... FROM orders o2 JOIN customers c ...` unless intentionally self-joining)—in PostgreSQL, the target table after `UPDATE` is already in scope!',
          'Joining `UPDATE products p SET stock_qty = p.stock_qty - oi.quantity FROM order_items oi WHERE p.product_id = oi.product_id` directly against a `1-to-many` table **silently loses updates**: when product `101` appears in 3 `order_items`, PostgreSQL deducts **only 1** of the 3 quantities! Always `GROUP BY` inside a derived subquery in `FROM`.',
          'Every `UPDATE` acquires a `FOR NO KEY UPDATE` (or `FOR UPDATE` if a key column changes) row lock; updating thousands of rows in random primary-key order across concurrent workers risks deadlocks (`40P01`).',
          '`UPDATE ... RETURNING` cannot contain a top-level `ORDER BY`; if sorted output is needed by the caller, wrap `WITH upd AS (UPDATE ... RETURNING *) SELECT * FROM upd ORDER BY ...`.'
        ],
        whenToUse: 'Use single-statement atomic `SET col = col + delta` expressions to prevent lost-update race conditions under `Read Committed`, and use `UPDATE ... FROM` (with pre-grouped subqueries for `1-to-N` relations) for cross-table mutations.'
      },
      scenario: {
        role: 'Inventory & Pricing Engine Developer',
        incidentOrGoal: 'Scarce active hardware SKUs (`stock_qty < 20`) need an atomic 10% scarcity reprice + emergency 5-unit reserve release, enterprise completed orders without a promo code were promised a retroactive `$50` rebate, and a buggy ungrouped `UPDATE ... FROM order_items` under-deducted inventory for multi-order SKUs.',
        stakeholderNeed: 'Author atomic in-place `UPDATE ... RETURNING`, multi-table `UPDATE ... FROM customers`, and pre-aggregated `UPDATE ... FROM (SELECT ... GROUP BY ...)` statements.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Atomic In-Place Scarcity Repricing & Stock Release',
          mission: 'Update `products` where `is_active = 1` AND `stock_qty < 20`: atomically set `price_cents = ROUND(price_cents * 1.10)::integer` and `stock_qty = stock_qty + 5`. Use `RETURNING` to return `product_id`, `sku`, `price_cents`, and `stock_qty` (in exact order).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Update scarce active hardware (< 20 units) with +10% price_cents and +5 stock_qty using UPDATE products ... RETURNING',
            'SELECT product_id, sku, price_cents, stock_qty',
            'FROM products',
            'WHERE is_active = 1 AND stock_qty < 20',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'UPDATE products',
            'SET price_cents = ROUND(price_cents * 1.10)::integer,',
            '    stock_qty = stock_qty + 5',
            'WHERE is_active = 1',
            '  AND stock_qty < 20',
            'RETURNING product_id, sku, price_cents, stock_qty;'
          ].join('\n'),
          hints: [
            'Filter `WHERE is_active = 1 AND stock_qty < 20` so discontinued `product_id = 108` (`is_active = 0`) is untouched while `103` (`14` units) and `104` (`9` units) match.',
            'Remember PostgreSQL evaluates `SET` against pre-update values and `RETURNING` projects the **post-update** values!',
            'Append `RETURNING product_id, sku, price_cents, stock_qty;`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUPDATE\\s+products\\b', flags: 'i', message: 'Update `products`.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Return mutated rows with `RETURNING`.' }
            ]
          },
          solutionExplanation: 'Under `Read Committed`, `SET stock_qty = stock_qty + 5` re-fetches and locks the latest committed tuple if another session concurrently modified the row, preventing lost-update anomalies while `RETURNING` emits the post-mutation values (`103` -> `74800, 19` and `104` -> `59400, 14`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Cross-Table Rebate Application with UPDATE ... FROM',
          mission: 'Apply a retroactive `$50.00` (`5000` cents) enterprise loyalty rebate to `orders` (`o`) joined with `customers` (`c`) via PostgreSQL\'s `UPDATE ... FROM` syntax: for rows where `o.customer_id = c.customer_id`, `c.tier = \'enterprise\'`, `o.status = \'completed\'`, and `o.discount_code IS NULL`, set `total_cents = o.total_cents - 5000` and `discount_code = \'VIP-RETRO\'`. Return `o.order_id`, `c.name AS customer_name`, `o.total_cents`, and `o.discount_code` via `RETURNING`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Apply 5000-cent rebate and \'VIP-RETRO\' code to un-discounted completed enterprise orders',
            'UPDATE orders o',
            'SET total_cents = o.total_cents - 5000,',
            '    discount_code = \'VIP-RETRO\'',
            '-- TODO: FROM customers c',
            '-- TODO: WHERE o.customer_id = c.customer_id AND c.tier = \'enterprise\' AND o.status = \'completed\' AND o.discount_code IS NULL',
            '-- TODO: RETURNING o.order_id, c.name AS customer_name, o.total_cents, o.discount_code;'
          ].join('\n'),
          solutionCode: [
            'UPDATE orders o',
            'SET total_cents = o.total_cents - 5000,',
            '    discount_code = \'VIP-RETRO\'',
            'FROM customers c',
            'WHERE o.customer_id = c.customer_id',
            '  AND c.tier = \'enterprise\'',
            '  AND o.status = \'completed\'',
            '  AND o.discount_code IS NULL',
            'RETURNING o.order_id,',
            '          c.name AS customer_name,',
            '          o.total_cents,',
            '          o.discount_code;'
          ].join('\n'),
          hints: [
            'In PostgreSQL `UPDATE orders o SET ... FROM customers c`, do NOT write `JOIN` between `o` and `c`—put the join predicate `o.customer_id = c.customer_id` in `WHERE`!',
            'Check `o.discount_code IS NULL` (not `= NULL`) alongside `c.tier = \'enterprise\'` and `o.status = \'completed\'`.',
            'Notice `RETURNING` can project columns from BOTH the updated target `o` AND the joined `FROM` table `c` (`c.name AS customer_name`)!'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUPDATE\\s+orders\\b[\\s\\S]+\\bFROM\\s+customers\\b', flags: 'i', message: 'Use PostgreSQL `UPDATE orders ... FROM customers` syntax.' },
              { pattern: '\\bIS\\s+NULL\\b', flags: 'i', message: 'Filter un-discounted orders with `discount_code IS NULL`.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Project `order_id, customer_name, total_cents, discount_code` via `RETURNING`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL joins `orders o` to `customers c` (`1-to-1` on `customer_id`), matching enterprise customer `Marcus Vance`\'s full-price completed order `1004` (`136000` -> `131000`), and projects `c.name` right out of the join state inside `RETURNING`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Preventing 1-to-N Lost Updates with Pre-Aggregated UPDATE ... FROM',
          mission: 'Deduct total sold units across all `\'completed\'` orders from `products.stock_qty` in one atomic `UPDATE`: join `products p` via `FROM (...) s` where `s` aggregates `oi.product_id` and `SUM(oi.quantity)::integer AS sold_qty` from `order_items oi JOIN orders o ON oi.order_id = o.order_id WHERE o.status = \'completed\' GROUP BY oi.product_id`. Set `stock_qty = p.stock_qty - s.sold_qty` where `p.product_id = s.product_id`, and return `p.product_id, p.sku, s.sold_qty, p.stock_qty AS remaining_stock` via `RETURNING`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Deduct aggregated completed sold_qty from products.stock_qty via UPDATE products p SET stock_qty = p.stock_qty - s.sold_qty FROM (...)',
            'SELECT oi.product_id, SUM(oi.quantity)::integer AS sold_qty',
            'FROM order_items oi',
            'JOIN orders o ON oi.order_id = o.order_id',
            'WHERE o.status = \'completed\'',
            'GROUP BY oi.product_id',
            'ORDER BY oi.product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'UPDATE products p',
            'SET stock_qty = p.stock_qty - s.sold_qty',
            'FROM (',
            '  SELECT oi.product_id,',
            '         SUM(oi.quantity)::integer AS sold_qty',
            '  FROM order_items oi',
            '  JOIN orders o ON oi.order_id = o.order_id',
            '  WHERE o.status = \'completed\'',
            '  GROUP BY oi.product_id',
            ') s',
            'WHERE p.product_id = s.product_id',
            'RETURNING p.product_id,',
            '          p.sku,',
            '          s.sold_qty,',
            '          p.stock_qty AS remaining_stock;'
          ].join('\n'),
          hints: [
            'Product `101` (`NVME-4TB-PRO`) appears in three completed orders (`1001` qty 2, `1002` qty 1, `1010` qty 2 = `5` total units)—joining `order_items` without `GROUP BY` would only deduct `2` or `1`!',
            'Inside `FROM (...) s`, `JOIN orders o ON oi.order_id = o.order_id WHERE o.status = \'completed\'` and `GROUP BY oi.product_id`.',
            'Join `WHERE p.product_id = s.product_id` and return `p.product_id, p.sku, s.sold_qty, p.stock_qty AS remaining_stock`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUPDATE\\s+products\\b[\\s\\S]+\\bFROM\\s*\\(', flags: 'i', message: 'Use a pre-aggregated subquery `FROM (SELECT ... GROUP BY ...)` inside `UPDATE products`.' },
              { pattern: '\\bGROUP\\s+BY\\b', flags: 'i', message: 'Aggregate `SUM(oi.quantity)` with `GROUP BY` so each `product_id` matches at most once.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Return `product_id, sku, sold_qty, remaining_stock` via `RETURNING`.' }
            ]
          },
          solutionExplanation: 'Grouping by `oi.product_id` inside `s` guarantees a strict `1-to-1` match with `products p`, accurately deducting all `5` sold units of `NVME-4TB-PRO` (`35 -> 30`) instead of silently dropping multiple `order_items` matches.'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m02-t06 — Targeted DELETE ... USING & PG 18 RETURNING OLD.*, NEW.*
       ======================================================================== */
    {
      id: 'pg-m02-t06',
      slug: 'delete-using-pg18-returning-old-new',
      moduleId: 'pg-m02',
      title: 'Targeted DELETE ... USING & PG 18 RETURNING OLD.*, NEW.*',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'fintech_ledger',
      clauses: ['DELETE FROM', 'USING', 'RETURNING OLD.*', 'RETURNING NEW.*'],
      tags: ['delete', 'delete-using', 'returning-old-new', 'pg18', 'dml'],
      guide: {
        mentalModel: 'Like `UPDATE`, `DELETE` in PostgreSQL does not immediately erase bytes from 8KB pages: it stamps the tuple\'s `t_xmax` header with the deleting XID so concurrent MVCC snapshots that began earlier still read a consistent view until `VACUUM` later reclaims the dead tuple slot. When purging rows based on attributes of a related parent table, PostgreSQL uses **`DELETE FROM target USING joined_table WHERE target.fk = joined_table.pk AND ...`** (mirroring `UPDATE ... FROM`).\n\n**New in PostgreSQL 18**, `RETURNING` unlocks **simultaneous access to both pre-mutation (`OLD`) and post-mutation (`NEW`) tuple images** across `INSERT`, `UPDATE`, `DELETE`, and `MERGE`! Prior to PG 18, `UPDATE ... RETURNING` could only see the **new** post-update values—forcing engineers to write awkward self-join CTEs (`WITH prev AS (SELECT ... FOR UPDATE)`) or `PL/pgSQL` triggers just to record `"changed balance from X to Y"` in an audit log. In PostgreSQL 18, `UPDATE ... RETURNING OLD.posted_balance_cents, NEW.posted_balance_cents` (and `RETURNING WITH (OLD AS before_row, NEW AS after_row) ...`) streams exact before/after transition deltas directly from the `ModifyTable` executor!',
        syntaxAnatomy: [
          '-- 1. Multi-table DELETE ... USING with joined columns in RETURNING',
          'DELETE FROM merchant_txns mt',
          'USING cards c',
          'WHERE mt.card_id = c.card_id',
          '  AND c.account_id = 101',
          '  AND mt.country = \'CH\'',
          'RETURNING mt.txn_id, mt.merchant, mt.amount_cents, c.last4;',
          '',
          '-- 2. PostgreSQL 18 RETURNING OLD.*, NEW.* before/after audit delta!',
          'UPDATE accounts',
          'SET posted_balance_cents = posted_balance_cents + 35000,',
          '    version = version + 1',
          'WHERE account_type = \'checking\'',
          'RETURNING account_id,',
          '          OLD.posted_balance_cents AS old_balance_cents,',
          '          NEW.posted_balance_cents AS new_balance_cents;'
        ].join('\n'),
        internalsAndGotchas: [
          'In PostgreSQL, multi-table `DELETE` uses keyword **`USING`** (`DELETE FROM a USING b WHERE a.id = b.id`), NOT `DELETE a FROM a JOIN b` (MySQL/T-SQL syntax).',
          'Inside PostgreSQL 18 `RETURNING`, `OLD.col` is `NULL` for `INSERT` rows (no prior tuple existed), `NEW.col` is `NULL` for `DELETE` rows (no surviving tuple exists), and **both `OLD.col` and `NEW.col` are populated for `UPDATE` rows**!',
          'If a table actually has a user column literally named `"old"` or `"new"`, PostgreSQL 18 provides `RETURNING WITH (OLD AS prev_tup, NEW AS curr_tup) prev_tup.col, curr_tup.col` to avoid identifier collisions.',
          'Always verify `WHERE` join predicates on `DELETE ... USING`: omitting `mt.card_id = c.card_id` creates a Cartesian cross-product that deletes **every** row in `merchant_txns` whenever at least one `cards` row matches!'
        ],
        whenToUse: 'Use `DELETE FROM ... USING` whenever purging child rows matched against parent/lookup attributes while projecting joined columns in `RETURNING`, and use PostgreSQL 18 `RETURNING OLD.*, NEW.*` whenever capturing atomic before-and-after state transitions for financial ledgers or audit trails.'
      },
      scenario: {
        role: 'Staff Financial Fraud & Audit Engineer',
        incidentOrGoal: 'Card fraud operations flagged anomalous Swiss (`\'CH\'`) duty-free charges on `account_id = 101`\'s card for immediate reversal, treasury settlement needs before-and-after balance & optimistic-lock `version` proof when crediting interest to `checking` accounts, and frozen card `402` requires an audited `OLD.*` transaction purge.',
        stakeholderNeed: 'Execute a `DELETE ... USING` purge on `merchant_txns`, an atomic PG 18 `UPDATE ... RETURNING OLD.*, NEW.*` interest credit on `accounts`, and a frozen-card `DELETE ... USING ... RETURNING OLD.*` audit sweep.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Cross-Table Fraud Reversal with DELETE ... USING',
          mission: 'Delete rows from `merchant_txns` (`mt`) joined with `cards` (`c`) via `USING cards c` where `mt.card_id = c.card_id`, `c.account_id = 101`, and `mt.country = \'CH\'`. Use `RETURNING` to return `mt.txn_id`, `mt.merchant`, `mt.amount_cents`, and `c.last4` (in exact order).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Purge Swiss (\'CH\') card transactions belonging to account_id = 101 via DELETE ... USING',
            'DELETE FROM merchant_txns mt',
            '-- TODO: USING cards c',
            '-- TODO: WHERE mt.card_id = c.card_id AND c.account_id = 101 AND mt.country = \'CH\'',
            '-- TODO: RETURNING mt.txn_id, mt.merchant, mt.amount_cents, c.last4;'
          ].join('\n'),
          solutionCode: [
            'DELETE FROM merchant_txns mt',
            'USING cards c',
            'WHERE mt.card_id = c.card_id',
            '  AND c.account_id = 101',
            '  AND mt.country = \'CH\'',
            'RETURNING mt.txn_id, mt.merchant, mt.amount_cents, c.last4;'
          ].join('\n'),
          hints: [
            'Use `DELETE FROM merchant_txns mt USING cards c`.',
            'Be sure to join `mt.card_id = c.card_id` inside `WHERE` alongside `c.account_id = 101 AND mt.country = \'CH\'`!',
            'Project `mt.txn_id, mt.merchant, mt.amount_cents, c.last4` in `RETURNING` (`USING` brings `c.last4` into `RETURNING` scope!).'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bDELETE\\s+FROM\\s+merchant_txns\\b[\\s\\S]+\\bUSING\\s+cards\\b', flags: 'i', message: 'Use `DELETE FROM merchant_txns ... USING cards`.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Return purged rows and `c.last4` with `RETURNING`.' }
            ]
          },
          solutionExplanation: '`DELETE ... USING cards c` performs a hash/nested-loop join against `cards`, deleting only the two Swiss fraud transactions (`txn_id = 3` and `4` on card `8821`) while exposing `c.last4` directly to `RETURNING`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Atomic Before/After Ledger Proof with PG 18 RETURNING OLD.*, NEW.*',
          mission: 'Credit `35000` cents (`$350.00`) of quarterly interest to all `\'checking\'` accounts in `accounts` (`WHERE account_type = \'checking\'`): set `posted_balance_cents = posted_balance_cents + 35000` and `version = version + 1`. Use **PostgreSQL 18\'s `OLD` and `NEW` `RETURNING` aliases** to return 6 columns in exact order: `account_id`, `owner_name`, `OLD.posted_balance_cents AS old_balance_cents`, `NEW.posted_balance_cents AS new_balance_cents`, `OLD.version AS old_version`, and `NEW.version AS new_version`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Credit +35000 cents & bump version on checking accounts, streaming PG 18 OLD and NEW values!',
            'UPDATE accounts',
            'SET posted_balance_cents = posted_balance_cents + 35000,',
            '    version = version + 1',
            'WHERE account_type = \'checking\'',
            '-- TODO: RETURNING account_id, owner_name,',
            '--       OLD.posted_balance_cents AS old_balance_cents, NEW.posted_balance_cents AS new_balance_cents,',
            '--       OLD.version AS old_version, NEW.version AS new_version;'
          ].join('\n'),
          solutionCode: [
            'UPDATE accounts',
            'SET posted_balance_cents = posted_balance_cents + 35000,',
            '    version = version + 1',
            'WHERE account_type = \'checking\'',
            'RETURNING account_id,',
            '          owner_name,',
            '          OLD.posted_balance_cents AS old_balance_cents,',
            '          NEW.posted_balance_cents AS new_balance_cents,',
            '          OLD.version AS old_version,',
            '          NEW.version AS new_version;'
          ].join('\n'),
          hints: [
            'PostgreSQL 18 natively exposes `OLD.<column>` (the pre-update tuple slot) and `NEW.<column>` (the post-update tuple slot) inside `RETURNING`.',
            'Unqualified `account_id` and `owner_name` remain valid (or qualify them), followed by `OLD.posted_balance_cents AS old_balance_cents` and `NEW.posted_balance_cents AS new_balance_cents`.',
            'Finish with `OLD.version AS old_version, NEW.version AS new_version`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bOLD\\.posted_balance_cents\\b', flags: 'i', message: 'Reference `OLD.posted_balance_cents` using PostgreSQL 18 `RETURNING OLD`.' },
              { pattern: '\\bNEW\\.posted_balance_cents\\b', flags: 'i', message: 'Reference `NEW.posted_balance_cents` using PostgreSQL 18 `RETURNING NEW`.' },
              { pattern: '\\bOLD\\.version\\b[\\s\\S]+\\bNEW\\.version\\b', flags: 'i', message: 'Project both `OLD.version` and `NEW.version`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL 18 retains both the old `TupleTableSlot` (`OLD`) and newly constructed tuple (`NEW`) inside `ExecProcessReturning`, emitting exact pre/post balance and optimistic-concurrency version transitions (`3 -> 4`, `2 -> 3`) without extra CTE round-trips or triggers.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Auditing Purged Compromised-Card Rows with PG 18 RETURNING OLD.*',
          mission: 'Card `402` has just been marked `status = \'frozen\'` in `cards`. Delete all `merchant_txns` (`mt`) belonging to frozen cards (`c.status = \'frozen\'`) via `DELETE FROM merchant_txns mt USING cards c`, and use PostgreSQL 18\'s explicit `OLD` record syntax in `RETURNING` to return `OLD.txn_id`, `OLD.card_id`, `OLD.merchant`, `OLD.amount_cents`, and `OLD.country` (in exact order).',
          setupSql: 'UPDATE cards SET status = \'frozen\' WHERE card_id = 402;',
          probeSql: '',
          starterCode: [
            '-- Purge merchant_txns on frozen cards and emit explicit PG 18 OLD.* columns',
            'DELETE FROM merchant_txns mt',
            'USING cards c',
            'WHERE mt.card_id = c.card_id',
            '  AND c.status = \'frozen\'',
            '-- TODO: RETURNING OLD.txn_id, OLD.card_id, OLD.merchant, OLD.amount_cents, OLD.country;'
          ].join('\n'),
          solutionCode: [
            'DELETE FROM merchant_txns mt',
            'USING cards c',
            'WHERE mt.card_id = c.card_id',
            '  AND c.status = \'frozen\'',
            'RETURNING OLD.txn_id,',
            '          OLD.card_id,',
            '          OLD.merchant,',
            '          OLD.amount_cents,',
            '          OLD.country;'
          ].join('\n'),
          hints: [
            'Join `mt.card_id = c.card_id AND c.status = \'frozen\'` using `USING cards c`.',
            'In PostgreSQL 18, `OLD` explicitly binds to the pre-delete tuple of the target table (`merchant_txns`).',
            'Project `OLD.txn_id, OLD.card_id, OLD.merchant, OLD.amount_cents, OLD.country` in `RETURNING`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUSING\\s+cards\\b', flags: 'i', message: 'Join `cards` using `DELETE FROM merchant_txns ... USING cards`.' },
              { pattern: '\\bRETURNING\\s+OLD\\.', flags: 'i', message: 'Use PostgreSQL 18 explicit `OLD.<col>` references in `RETURNING`.' }
            ]
          },
          solutionExplanation: 'Explicitly qualifying `OLD.txn_id, OLD.card_id, ...` in PostgreSQL 18 makes multi-table `DELETE ... USING` audit projections unambiguous even when target and `USING` tables share column names like `card_id` or `status`.'
        }
      ]
    },

    /* ========================================================================
       LAB 07: pg-m02-t07 — Idempotent Upserts: INSERT ... ON CONFLICT & EXCLUDED
       ======================================================================== */
    {
      id: 'pg-m02-t07',
      slug: 'upsert-on-conflict-excluded',
      moduleId: 'pg-m02',
      title: 'Idempotent Upserts: INSERT ... ON CONFLICT & EXCLUDED',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'ecommerce',
      clauses: ['ON CONFLICT', 'DO NOTHING', 'DO UPDATE', 'EXCLUDED'],
      tags: ['upsert', 'on-conflict', 'excluded', 'idempotency', 'dml'],
      guide: {
        mentalModel: 'Naive application-level `"SELECT first; if missing, INSERT; else UPDATE"` logic fails in production under concurrent traffic due to **Time-of-Check to Time-of-Use (`TOCTOU`) race conditions**: two workers both see `0` rows, both `INSERT`, and one crashes with `23505 unique_violation`. PostgreSQL solves this atomically inside the B-Tree index insertion path (`ExecInsertIndexTuples`) via **`INSERT ... ON CONFLICT (arbiter_cols) DO NOTHING | DO UPDATE`** using speculative insertion tokens.\n\nInside `DO UPDATE SET ...`, PostgreSQL exposes a special pseudo-table named **`EXCLUDED`** holding the **proposed tuple values that failed to insert**, alongside the target table\'s existing committed row (`products.stock_qty + EXCLUDED.stock_qty`). Crucially, an unguarded `DO UPDATE SET price_cents = EXCLUDED.price_cents` **always writes a dead MVCC tuple, bloats indexes, and emits WAL** even when `products.price_cents` already equals `EXCLUDED.price_cents`! Attaching a **`WHERE products.col IS DISTINCT FROM EXCLUDED.col`** guard skips no-op updates completely at zero heap/WAL cost.',
        syntaxAnatomy: [
          'INSERT INTO products (product_id, sku, name, category_id, price_cents, stock_qty, is_active)',
          'VALUES',
          '  (102, \'NVME-2TB-STD\', \'Datacenter NVMe 2TB\',     20, 21000, 80, 1), -- Unchanged!',
          '  (104, \'SW-24P-10G\',   \'24-Port 10GbE L3 Switch\', 30, 51000,  9, 1)  -- Price dropped!',
          'ON CONFLICT (sku) DO UPDATE',
          '  SET price_cents = EXCLUDED.price_cents,',
          '      stock_qty   = EXCLUDED.stock_qty',
          '  WHERE products.price_cents IS DISTINCT FROM EXCLUDED.price_cents   -- Suppresses no-op MVCC bloat!',
          '     OR products.stock_qty   IS DISTINCT FROM EXCLUDED.stock_qty',
          'RETURNING product_id, sku, price_cents, stock_qty;'
        ].join('\n'),
        internalsAndGotchas: [
          '`ON CONFLICT (col)` **requires** a non-deferrable `PRIMARY KEY` or `UNIQUE` index matching `(col)` (the *conflict arbiter*); without a unique index, PostgreSQL raises `there is no unique or exclusion constraint matching the ON CONFLICT specification`.',
          'A single `INSERT ... ON CONFLICT DO UPDATE` statement **cannot update the same target key twice** in the same batch (`ON CONFLICT DO UPDATE command cannot affect row a second time`)—deduplicate input batches (e.g., with `DISTINCT ON (sku)`) before upserting!',
          'Even when `ON CONFLICT DO NOTHING` skips a duplicate row, any `GENERATED ... AS IDENTITY` or `SERIAL` sequence evaluated before conflict detection **still advances**, leaving normal sequence gaps.',
          'Always add a `WHERE target.col IS DISTINCT FROM EXCLUDED.col` predicate on high-frequency idempotent `DO UPDATE` syncs so unchanged rows do not churn dead MVCC tuples and trigger constant `autovacuum` work!'
        ],
        whenToUse: 'Use `ON CONFLICT (...) DO NOTHING` for idempotent event/webhook deduplication, `ON CONFLICT (...) DO UPDATE` with `EXCLUDED` for atomic counters and catalog upserts, and always guard `DO UPDATE` with `WHERE ... IS DISTINCT FROM ...` to eliminate no-op MVCC bloat.'
      },
      scenario: {
        role: 'Distributed Webhook & Catalog Sync Engineer',
        incidentOrGoal: 'At-least-once Stripe/Auth webhook replays are crashing with `23505` duplicate-email errors on `customers`, supplier restock feeds need atomic stock accumulation (`stock_qty + EXCLUDED.stock_qty`) on `products`, and hourly full-catalog syncs are rewriting unchanged `products` rows and bloating heap pages.',
        stakeholderNeed: 'Build an idempotent `ON CONFLICT (email) DO NOTHING` customer ingest, an accumulating `ON CONFLICT (sku) DO UPDATE` supplier upsert, and a bloat-free `IS DISTINCT FROM` guarded upsert.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Idempotent Webhook Deduplication with ON CONFLICT DO NOTHING',
          mission: 'Replay a 3-row signup batch into `customers` (`customer_id, email, name, tier, country, referred_by, created_at`): `(91, \'aravind@acme.io\', \'Aravind Rao\', \'enterprise\', \'IN\', NULL, \'2025-03-28\')`, `(92, \'elena@vela.dev\', \'Elena Rostova\', \'pro\', \'DE\', 1, \'2025-03-28\')`, and `(9, \'priya@lattice.ai\', \'Priya Nair\', \'enterprise\', \'IN\', 1, \'2025-03-28\')`. Use `ON CONFLICT (email) DO NOTHING` so duplicate emails are silently skipped and only newly inserted row(s) stream back via `RETURNING customer_id, email, name, tier`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Add ON CONFLICT (email) DO NOTHING RETURNING customer_id, email, name, tier;',
            '-- Preview incoming emails vs existing customers first:',
            'SELECT v.customer_id, v.email, (c.customer_id IS NOT NULL) AS already_exists',
            'FROM (VALUES',
            '  (91, \'aravind@acme.io\'),',
            '  (92, \'elena@vela.dev\'),',
            '  (9, \'priya@lattice.ai\')',
            ') AS v(customer_id, email)',
            'LEFT JOIN customers c ON c.email = v.email',
            'ORDER BY v.customer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'INSERT INTO customers (customer_id, email, name, tier, country, referred_by, created_at)',
            'VALUES',
            '  (91, \'aravind@acme.io\', \'Aravind Rao\', \'enterprise\', \'IN\', NULL, \'2025-03-28\'),',
            '  (92, \'elena@vela.dev\', \'Elena Rostova\', \'pro\', \'DE\', 1, \'2025-03-28\'),',
            '  (9, \'priya@lattice.ai\', \'Priya Nair\', \'enterprise\', \'IN\', 1, \'2025-03-28\')',
            'ON CONFLICT (email) DO NOTHING',
            'RETURNING customer_id, email, name, tier;'
          ].join('\n'),
          hints: [
            '`customers.email` has a `UNIQUE` B-Tree constraint, so `(email)` is a valid conflict arbiter.',
            'With `DO NOTHING`, rows that collide on `email` (`aravind@acme.io` and `elena@vela.dev`) are skipped without aborting the batch, and `RETURNING` emits **only** actually inserted rows (`priya@lattice.ai`).',
            'End with `ON CONFLICT (email) DO NOTHING RETURNING customer_id, email, name, tier;`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bON\\s+CONFLICT\\s*\\(\\s*email\\s*\\)\\s*DO\\s+NOTHING\\b', flags: 'i', message: 'Use `ON CONFLICT (email) DO NOTHING`.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Return newly inserted customer rows with `RETURNING`.' }
            ]
          },
          solutionExplanation: 'Probing `customers_email_key` via speculative insertion skips existing emails `aravind@acme.io` and `elena@vela.dev` without raising `23505` or aborting the surrounding transaction, returning only net-new `customer_id = 9` (`priya@lattice.ai`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Atomic Stock Accumulation & Repricing with EXCLUDED',
          mission: 'Upsert 3 supplier shipment rows into `products` (`product_id, sku, name, category_id, price_cents, stock_qty, is_active`): `(101, \'NVME-4TB-PRO\', \'Enterprise Gen5 NVMe 4TB\', 20, 39900, 15, 1)`, `(107, \'CABLE-DAC-3M\', \'QSFP28 3m Twinax Cable\', 30, 4200, 30, 1)`, and `(109, \'NIC-400G-OSFP\', \'Single-Port 400GbE OSFP NIC\', 30, 118000, 8, 1)`. On conflict over `(sku)`, update `price_cents = EXCLUDED.price_cents`, **add** incoming stock `stock_qty = products.stock_qty + EXCLUDED.stock_qty`, and set `is_active = EXCLUDED.is_active`. Return `product_id, sku, price_cents, stock_qty` via `RETURNING`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Write INSERT INTO products (...) VALUES (...) ON CONFLICT (sku) DO UPDATE SET ... RETURNING product_id, sku, price_cents, stock_qty;',
            'SELECT product_id, sku, price_cents, stock_qty, is_active',
            'FROM products',
            'WHERE product_id IN (101, 107)',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'INSERT INTO products (product_id, sku, name, category_id, price_cents, stock_qty, is_active)',
            'VALUES',
            '  (101, \'NVME-4TB-PRO\', \'Enterprise Gen5 NVMe 4TB\', 20, 39900, 15, 1),',
            '  (107, \'CABLE-DAC-3M\', \'QSFP28 3m Twinax Cable\', 30, 4200, 30, 1),',
            '  (109, \'NIC-400G-OSFP\', \'Single-Port 400GbE OSFP NIC\', 30, 118000, 8, 1)',
            'ON CONFLICT (sku) DO UPDATE',
            '  SET price_cents = EXCLUDED.price_cents,',
            '      stock_qty   = products.stock_qty + EXCLUDED.stock_qty,',
            '      is_active   = EXCLUDED.is_active',
            'RETURNING product_id, sku, price_cents, stock_qty;'
          ].join('\n'),
          hints: [
            'Inside `DO UPDATE SET`, qualify `products.stock_qty` on the right side (`products.stock_qty + EXCLUDED.stock_qty`)—unqualified `stock_qty` on the right side would be ambiguous!',
            'Overwrite `price_cents = EXCLUDED.price_cents` and `is_active = EXCLUDED.is_active`.',
            'Net-new `NIC-400G-OSFP` inserts with `stock_qty = 8`, while existing `101` (`35 + 15 = 50`) and `107` (`220 + 30 = 250`) accumulate atomically.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bON\\s+CONFLICT\\s*\\(\\s*sku\\s*\\)\\s*DO\\s+UPDATE\\b', flags: 'i', message: 'Use `ON CONFLICT (sku) DO UPDATE`.' },
              { pattern: '\\bEXCLUDED\\.stock_qty\\b', flags: 'i', message: 'Reference `EXCLUDED.stock_qty` to accumulate incoming stock.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Return upserted rows with `RETURNING`.' }
            ]
          },
          solutionExplanation: '`EXCLUDED` holds the proposed `VALUES` tuple while `products` references the locked existing heap tuple, allowing `NVME-4TB-PRO` (`35 + 15 = 50`) and `CABLE-DAC-3M` (`220 + 30 = 250`) to accumulate stock while `NIC-400G-OSFP` inserts cleanly in the same atomic command.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Suppressing No-Op Dead-Tuple Bloat with DO UPDATE ... WHERE',
          mission: 'Sync a 3-row catalog snapshot into `products` (`product_id, sku, name, category_id, price_cents, stock_qty, is_active`): `(102, \'NVME-2TB-STD\', \'Datacenter NVMe 2TB\', 20, 21000, 80, 1)` (identical to existing DB values!), `(104, \'SW-24P-10G\', \'24-Port 10GbE L3 Switch\', 30, 51000, 9, 1)` (price changed from `54000` to `51000`!), and `(109, \'NVME-8TB-PRO\', \'Enterprise Gen5 NVMe 8TB\', 20, 76000, 12, 1)` (net-new!). Use `ON CONFLICT (sku) DO UPDATE SET price_cents = EXCLUDED.price_cents, stock_qty = EXCLUDED.stock_qty` guarded by `WHERE products.price_cents IS DISTINCT FROM EXCLUDED.price_cents OR products.stock_qty IS DISTINCT FROM EXCLUDED.stock_qty` so unchanged row `102` is NOT rewritten, and return `product_id, sku, price_cents, stock_qty` via `RETURNING`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Skip no-op MVCC rewrites when neither price_cents nor stock_qty actually changed!',
            'INSERT INTO products (product_id, sku, name, category_id, price_cents, stock_qty, is_active)',
            'VALUES',
            '  (102, \'NVME-2TB-STD\', \'Datacenter NVMe 2TB\', 20, 21000, 80, 1),',
            '  (104, \'SW-24P-10G\', \'24-Port 10GbE L3 Switch\', 30, 51000, 9, 1),',
            '  (109, \'NVME-8TB-PRO\', \'Enterprise Gen5 NVMe 8TB\', 20, 76000, 12, 1)',
            'ON CONFLICT (sku) DO UPDATE',
            '  SET price_cents = EXCLUDED.price_cents,',
            '      stock_qty   = EXCLUDED.stock_qty',
            '  -- TODO: add WHERE ... IS DISTINCT FROM ... guard so unchanged SKU 102 is skipped!',
            'RETURNING product_id, sku, price_cents, stock_qty;'
          ].join('\n'),
          solutionCode: [
            'INSERT INTO products (product_id, sku, name, category_id, price_cents, stock_qty, is_active)',
            'VALUES',
            '  (102, \'NVME-2TB-STD\', \'Datacenter NVMe 2TB\', 20, 21000, 80, 1),',
            '  (104, \'SW-24P-10G\', \'24-Port 10GbE L3 Switch\', 30, 51000, 9, 1),',
            '  (109, \'NVME-8TB-PRO\', \'Enterprise Gen5 NVMe 8TB\', 20, 76000, 12, 1)',
            'ON CONFLICT (sku) DO UPDATE',
            '  SET price_cents = EXCLUDED.price_cents,',
            '      stock_qty   = EXCLUDED.stock_qty',
            '  WHERE products.price_cents IS DISTINCT FROM EXCLUDED.price_cents',
            '     OR products.stock_qty IS DISTINCT FROM EXCLUDED.stock_qty',
            'RETURNING product_id, sku, price_cents, stock_qty;'
          ].join('\n'),
          hints: [
            'Without a `WHERE` clause on `DO UPDATE`, `RETURNING` returns `3` rows because `102` (`NVME-2TB-STD`) gets needlessly rewritten with identical `(21000, 80)` values!',
            'Add `WHERE products.price_cents IS DISTINCT FROM EXCLUDED.price_cents OR products.stock_qty IS DISTINCT FROM EXCLUDED.stock_qty` right after `SET ...`.',
            'Now `RETURNING` emits only the `2` genuinely mutated/inserted rows (`104` and `109`), leaving `102`\'s heap page completely untouched!'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bDO\\s+UPDATE[\\s\\S]+\\bWHERE\\b', flags: 'i', message: 'Guard `DO UPDATE` with a `WHERE` clause to skip unchanged rows.' },
              { pattern: '\\bIS\\s+DISTINCT\\s+FROM\\b', flags: 'i', message: 'Use null-safe `IS DISTINCT FROM` when comparing `products` vs `EXCLUDED`.' }
            ]
          },
          solutionExplanation: 'Guarding `DO UPDATE` with `IS DISTINCT FROM` prevents PostgreSQL from dirtying 8KB shared buffers, generating WAL records, and leaving dead MVCC tuples on `NVME-2TB-STD` (`102`), so `RETURNING` reports only the 2 genuine state changes (`104` repriced, `109` inserted).'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m02-t08 — SQL MERGE INTO (BY SOURCE / merge_action) & MATERIALIZED VIEW
       ======================================================================== */
    {
      id: 'pg-m02-t08',
      slug: 'merge-into-views-materialized-views',
      moduleId: 'pg-m02',
      title: 'SQL MERGE INTO (BY SOURCE / merge_action) & MATERIALIZED VIEW',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['MERGE INTO', 'WHEN MATCHED', 'WHEN NOT MATCHED BY SOURCE', 'merge_action()', 'MATERIALIZED VIEW'],
      tags: ['merge', 'merge-action', 'materialized-view', 'pg17', 'pg18', 'etl'],
      guide: {
        mentalModel: 'Introduced in PostgreSQL 15 and **massively upgraded in PostgreSQL 17 and 18**, SQL-standard **`MERGE INTO target USING source ON join_cond`** reconciles entire staging feeds (`INSERT` + `UPDATE` + `DELETE` in a single pass!) via outer-join execution plans. PostgreSQL 17 added **`WHEN NOT MATCHED BY SOURCE`** (acting on target rows **missing** from the incoming source snapshot—impossible with `INSERT ... ON CONFLICT`!) alongside **`RETURNING merge_action()`** (`\'INSERT\'`, `\'UPDATE\'`, or `\'DELETE\'`), and **PostgreSQL 18 adds `OLD.*` and `NEW.*` support directly inside `MERGE ... RETURNING`**!\n\nUnderstand the **concurrency boundary** between `ON CONFLICT` and `MERGE`: `ON CONFLICT` uses index-level speculative insertion locks to guarantee zero `unique_violation` races under high-concurrency single-row OLTP writes, whereas `MERGE` is a **set-oriented reconciliation operator** designed for batch ETL, CDC staging syncs, and full-snapshot table synchronization. Once base tables are synchronized, **`CREATE MATERIALIZED VIEW`** (`relkind = \'m\'` in `pg_class`) persists pre-aggregated reporting snapshots onto physical 8KB heap pages—and adding a **`UNIQUE INDEX`** on the materialized view unlocks **`REFRESH MATERIALIZED VIEW CONCURRENTLY`**, refreshing stale aggregates in the background without blocking live dashboard `SELECT` readers!',
        syntaxAnatomy: [
          '-- 1. Full-table reconciliation in ONE pass (PG 17/18 MERGE + BY SOURCE + OLD/NEW RETURNING)',
          'MERGE INTO ledger_accounts la',
          'USING ledger_sync_staging s ON la.account_id = s.account_id',
          'WHEN MATCHED THEN',
          '  UPDATE SET balance_cents = la.balance_cents + s.delta_cents,',
          '             status        = s.new_status,',
          '             updated_at    = s.synced_at',
          'WHEN NOT MATCHED THEN',
          '  INSERT (account_id, account_code, owner_tenant, balance_cents, status, updated_at)',
          '  VALUES (s.account_id, s.account_code, s.owner_tenant, s.delta_cents, s.new_status, s.synced_at)',
          'WHEN NOT MATCHED BY SOURCE AND la.status = \'closed\' THEN',
          '  DELETE',
          'RETURNING merge_action() AS action,',
          '          COALESCE(NEW.account_id, OLD.account_id) AS account_id,',
          '          OLD.balance_cents AS old_balance_cents,',
          '          NEW.balance_cents AS new_balance_cents;',
          '',
          '-- 2. Precomputed reporting snapshot + unique index for CONCURRENT refresh',
          'CREATE MATERIALIZED VIEW mv_tenant_invoice_summary AS',
          'SELECT tenant_id, COUNT(*)::integer AS invoice_count, SUM(amount_cents)::bigint AS total_billed_cents',
          'FROM tenant_invoices GROUP BY tenant_id;',
          'CREATE UNIQUE INDEX idx_mv_tenant_invoice_pk ON mv_tenant_invoice_summary (tenant_id);'
        ].join('\n'),
        internalsAndGotchas: [
          'If multiple source rows in `USING` match the **same** target row in `MERGE`, PostgreSQL immediately raises `MERGE command cannot affect row a second time` (`21000`)—ensure `USING` is unique on the join key!',
          'Unlike `INSERT ... ON CONFLICT`, `MERGE` under `Read Committed` does **not** prevent two concurrent `WHEN NOT MATCHED THEN INSERT` sessions from hitting a `23505` unique violation on the same new key; prefer `ON CONFLICT` for concurrent point upserts and `MERGE` for batch staging feeds.',
          '`WHEN` clauses inside `MERGE` evaluate **in written order** for each category (`MATCHED`, `NOT MATCHED [BY TARGET]`, `NOT MATCHED BY SOURCE`), stopping at the first matching `AND` guard.',
          '`REFRESH MATERIALIZED VIEW` (without `CONCURRENTLY`) acquires an **`AccessExclusiveLock`**, blocking all `SELECT` queries until recomputation finishes; `REFRESH MATERIALIZED VIEW CONCURRENTLY` avoids blocking readers (`ExclusiveLock` only) **but requires at least one `UNIQUE` index without a `WHERE` clause** on the materialized view!'
        ],
        whenToUse: 'Choose `MERGE INTO ... WHEN NOT MATCHED BY SOURCE` with `merge_action()` and PG 18 `OLD`/`NEW` `RETURNING` to synchronize staging/CDC snapshots in one atomic pass, and materialize heavy multi-tenant aggregations into a uniquely indexed `MATERIALIZED VIEW`.'
      },
      scenario: {
        role: 'Staff Data Platform & Ledger ETL Architect',
        incidentOrGoal: 'Nightly settlement synchronization between `pg_ops.ledger_sync_staging` and `pg_ops.ledger_accounts` currently runs 4 separate `UPDATE`/`INSERT`/`DELETE` scripts with drift windows between them, and executive billing dashboards are repeatedly scanning raw `tenant_invoices`.',
        stakeholderNeed: 'Synchronize `ledger_accounts` via `MERGE INTO ... RETURNING merge_action()`, upgrade to full `WHEN NOT MATCHED BY SOURCE` reconciliation with PG 18 `OLD`/`NEW` `RETURNING`, and build an indexed `MATERIALIZED VIEW` over `tenant_invoices`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Staging Feed Upsert with MERGE INTO & merge_action()',
          mission: 'Synchronize `ledger_accounts` (`la`) from `ledger_sync_staging` (`s`) on `la.account_id = s.account_id` using `MERGE INTO`: (1) `WHEN MATCHED THEN UPDATE SET balance_cents = la.balance_cents + s.delta_cents, status = s.new_status, updated_at = s.synced_at`, and (2) `WHEN NOT MATCHED THEN INSERT (account_id, account_code, owner_tenant, balance_cents, status, updated_at) VALUES (s.account_id, s.account_code, s.owner_tenant, s.delta_cents, s.new_status, s.synced_at)`. Use `RETURNING` to return `merge_action() AS action`, `la.account_id`, `la.account_code`, `la.balance_cents`, and `la.status` (in exact order).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Reconcile ledger_sync_staging into ledger_accounts with MERGE INTO ... WHEN MATCHED ... WHEN NOT MATCHED ... RETURNING merge_action()',
            'SELECT s.account_id, s.account_code, s.delta_cents, s.new_status, (la.account_id IS NOT NULL) AS exists_in_ledger',
            'FROM ledger_sync_staging s',
            'LEFT JOIN ledger_accounts la ON la.account_id = s.account_id',
            'ORDER BY s.account_id ASC;'
          ].join('\n'),
          solutionCode: [
            'MERGE INTO ledger_accounts la',
            'USING ledger_sync_staging s ON la.account_id = s.account_id',
            'WHEN MATCHED THEN',
            '  UPDATE SET balance_cents = la.balance_cents + s.delta_cents,',
            '             status        = s.new_status,',
            '             updated_at    = s.synced_at',
            'WHEN NOT MATCHED THEN',
            '  INSERT (account_id, account_code, owner_tenant, balance_cents, status, updated_at)',
            '  VALUES (s.account_id, s.account_code, s.owner_tenant, s.delta_cents, s.new_status, s.synced_at)',
            'RETURNING merge_action() AS action,',
            '          la.account_id,',
            '          la.account_code,',
            '          la.balance_cents,',
            '          la.status;'
          ].join('\n'),
          hints: [
            'Note that inside `MERGE`' + 's `INSERT (...)` column list, do NOT prefix column names with table alias `la.` (write `INSERT (account_id, ...)`).',
            'For `WHEN NOT MATCHED`, initialize `balance_cents` from `s.delta_cents` and `updated_at` from `s.synced_at`.',
            'Call `merge_action() AS action` as the first expression in `RETURNING`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bMERGE\\s+INTO\\s+ledger_accounts\\b', flags: 'i', message: 'Use `MERGE INTO ledger_accounts`.' },
              { pattern: '\\bWHEN\\s+MATCHED\\b[\\s\\S]+\\bWHEN\\s+NOT\\s+MATCHED\\b', flags: 'i', message: 'Include both `WHEN MATCHED` and `WHEN NOT MATCHED` clauses.' },
              { pattern: '\\bmerge_action\\s*\\(\\s*\\)', flags: 'i', message: 'Project `merge_action() AS action` in `RETURNING`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL executes a right/outer join between `ledger_accounts` and `ledger_sync_staging`, applying `UPDATE` to matched accounts `501, 502, 503, 505` and `INSERT` to new account `507` (`ACC-WAYSTAR-USD`), while `merge_action()` labels each row\'s exact mutation verb.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Full Reconciliation: WHEN NOT MATCHED BY SOURCE & PG 18 OLD/NEW RETURNING',
          mission: 'Extend your `MERGE INTO ledger_accounts la USING ledger_sync_staging s ON la.account_id = s.account_id` to reconcile accounts **absent** from `ledger_sync_staging` using PG 17/18 `WHEN NOT MATCHED BY SOURCE`: keep the same `WHEN MATCHED` `UPDATE` and `WHEN NOT MATCHED` `INSERT` rules from Step 1, then add: (3) `WHEN NOT MATCHED BY SOURCE AND la.status = \'closed\' THEN DELETE`, and (4) `WHEN NOT MATCHED BY SOURCE AND la.status = \'dormant\' THEN UPDATE SET status = \'archived\'`. Return 6 columns via PG 18 `RETURNING`: `merge_action() AS action`, `COALESCE(NEW.account_id, OLD.account_id) AS account_id`, `OLD.balance_cents AS old_balance_cents`, `NEW.balance_cents AS new_balance_cents`, `OLD.status AS old_status`, and `NEW.status AS new_status`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Full 4-way reconciliation in ONE pass: UPDATE matched, INSERT new, DELETE closed, archive dormant!',
            'MERGE INTO ledger_accounts la',
            'USING ledger_sync_staging s ON la.account_id = s.account_id',
            'WHEN MATCHED THEN',
            '  UPDATE SET balance_cents = la.balance_cents + s.delta_cents,',
            '             status        = s.new_status,',
            '             updated_at    = s.synced_at',
            'WHEN NOT MATCHED THEN',
            '  INSERT (account_id, account_code, owner_tenant, balance_cents, status, updated_at)',
            '  VALUES (s.account_id, s.account_code, s.owner_tenant, s.delta_cents, s.new_status, s.synced_at)',
            '-- TODO: WHEN NOT MATCHED BY SOURCE AND la.status = \'closed\' THEN DELETE',
            '-- TODO: WHEN NOT MATCHED BY SOURCE AND la.status = \'dormant\' THEN UPDATE SET status = \'archived\'',
            '-- TODO: RETURNING merge_action() AS action, COALESCE(NEW.account_id, OLD.account_id) AS account_id,',
            '--       OLD.balance_cents AS old_balance_cents, NEW.balance_cents AS new_balance_cents,',
            '--       OLD.status AS old_status, NEW.status AS new_status;'
          ].join('\n'),
          solutionCode: [
            'MERGE INTO ledger_accounts la',
            'USING ledger_sync_staging s ON la.account_id = s.account_id',
            'WHEN MATCHED THEN',
            '  UPDATE SET balance_cents = la.balance_cents + s.delta_cents,',
            '             status        = s.new_status,',
            '             updated_at    = s.synced_at',
            'WHEN NOT MATCHED THEN',
            '  INSERT (account_id, account_code, owner_tenant, balance_cents, status, updated_at)',
            '  VALUES (s.account_id, s.account_code, s.owner_tenant, s.delta_cents, s.new_status, s.synced_at)',
            'WHEN NOT MATCHED BY SOURCE AND la.status = \'closed\' THEN',
            '  DELETE',
            'WHEN NOT MATCHED BY SOURCE AND la.status = \'dormant\' THEN',
            '  UPDATE SET status = \'archived\'',
            'RETURNING merge_action() AS action,',
            '          COALESCE(NEW.account_id, OLD.account_id) AS account_id,',
            '          OLD.balance_cents AS old_balance_cents,',
            '          NEW.balance_cents AS new_balance_cents,',
            '          OLD.status AS old_status,',
            '          NEW.status AS new_status;'
          ].join('\n'),
          hints: [
            'Because `WHEN NOT MATCHED BY SOURCE` fires on target rows missing from `s`, PostgreSQL upgrades the internal join to a `FULL Join` so unmatched `la` rows (`504` dormant and `506` closed) are visited!',
            'For `DELETE` rows (`506`), `NEW.account_id` is `NULL`, and for `INSERT` rows (`507`), `OLD.account_id` is `NULL`—which is why `COALESCE(NEW.account_id, OLD.account_id) AS account_id` cleanly preserves every row\'s ID!',
            'Project all 6 columns in the exact order specified.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bWHEN\\s+NOT\\s+MATCHED\\s+BY\\s+SOURCE\\b', flags: 'i', message: 'Use `WHEN NOT MATCHED BY SOURCE` to handle target accounts missing from staging.' },
              { pattern: '\\bmerge_action\\s*\\(\\s*\\)', flags: 'i', message: 'Include `merge_action() AS action` in `RETURNING`.' },
              { pattern: '\\bOLD\\.balance_cents\\b[\\s\\S]+\\bNEW\\.balance_cents\\b', flags: 'i', message: 'Project PostgreSQL 18 `OLD` and `NEW` columns inside `MERGE ... RETURNING`.' }
            ]
          },
          solutionExplanation: 'In a single `Merge` + `Hash Full Join` pass, PostgreSQL 18 updates 4 matched accounts, inserts `507` (`OLD.* = NULL`), deletes stale closed account `506` (`NEW.* = NULL`), transitions dormant account `504` to `\'archived\'`, and emits a complete 7-row before/after audit ledger!'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Precomputed Reporting Snapshots with MATERIALIZED VIEW & Unique Index',
          mission: 'Create materialized view `mv_tenant_invoice_summary` over `tenant_invoices` with 4 columns: `tenant_id`, `COUNT(*)::integer AS invoice_count`, `SUM(amount_cents)::bigint AS total_billed_cents`, and `COALESCE(SUM(amount_cents) FILTER (WHERE status IN (\'open\', \'overdue\')), 0)::bigint AS unpaid_cents`, grouped by `tenant_id`. Also create a unique B-Tree index `idx_mv_tenant_invoice_pk` on `mv_tenant_invoice_summary (tenant_id)` so the view is ready for `REFRESH MATERIALIZED VIEW CONCURRENTLY`.',
          setupSql: '',
          probeSql: [
            'INSERT INTO tenant_invoices VALUES (710, \'umbraco\', \'INV-UM-02\', 190000, \'overdue\', \'2025-03-16\');',
            'REFRESH MATERIALIZED VIEW mv_tenant_invoice_summary;',
            'SELECT m.tenant_id,',
            '       m.invoice_count,',
            '       m.total_billed_cents,',
            '       m.unpaid_cents,',
            '       (SELECT c.relkind FROM pg_class c WHERE c.oid = \'mv_tenant_invoice_summary\'::regclass) AS relkind,',
            '       (SELECT i.indisunique FROM pg_index i WHERE i.indexrelid = \'idx_mv_tenant_invoice_pk\'::regclass) AS has_unique_idx',
            'FROM mv_tenant_invoice_summary m',
            'ORDER BY m.tenant_id ASC;'
          ].join('\n'),
          starterCode: [
            '-- 1. Create materialized view mv_tenant_invoice_summary over tenant_invoices',
            '-- TODO: CREATE MATERIALIZED VIEW mv_tenant_invoice_summary AS ...',
            '',
            '-- 2. Create unique index idx_mv_tenant_invoice_pk on (tenant_id) for CONCURRENT refresh readiness',
            '-- TODO: CREATE UNIQUE INDEX idx_mv_tenant_invoice_pk ON mv_tenant_invoice_summary (tenant_id);'
          ].join('\n'),
          solutionCode: [
            'CREATE MATERIALIZED VIEW mv_tenant_invoice_summary AS',
            'SELECT tenant_id,',
            '       COUNT(*)::integer AS invoice_count,',
            '       SUM(amount_cents)::bigint AS total_billed_cents,',
            '       COALESCE(SUM(amount_cents) FILTER (WHERE status IN (\'open\', \'overdue\')), 0)::bigint AS unpaid_cents',
            'FROM tenant_invoices',
            'GROUP BY tenant_id;',
            '',
            'CREATE UNIQUE INDEX idx_mv_tenant_invoice_pk',
            '  ON mv_tenant_invoice_summary (tenant_id);'
          ].join('\n'),
          hints: [
            'Unlike a virtual `VIEW` (`relkind = \'v\'`), `CREATE MATERIALIZED VIEW` (`relkind = \'m\'`) executes the query immediately and persists the result onto heap pages.',
            'Notice tenant `umbraco` initially has `0` open/overdue invoices (`NULL` from `SUM(...) FILTER (...)`), so wrap `COALESCE(..., 0)::bigint AS unpaid_cents` (or `SUM(CASE WHEN status IN (\'open\', \'overdue\') THEN amount_cents ELSE 0 END)::bigint`).',
            'Follow with `CREATE UNIQUE INDEX idx_mv_tenant_invoice_pk ON mv_tenant_invoice_summary (tenant_id);`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+MATERIALIZED\\s+VIEW\\s+mv_tenant_invoice_summary\\b', flags: 'i', message: 'Create materialized view `mv_tenant_invoice_summary`.' },
              { pattern: '\\bCREATE\\s+UNIQUE\\s+INDEX\\s+idx_mv_tenant_invoice_pk\\b', flags: 'i', message: 'Create unique index `idx_mv_tenant_invoice_pk` on `mv_tenant_invoice_summary (tenant_id)`.' }
            ]
          },
          solutionExplanation: 'Creating `mv_tenant_invoice_summary` (`relkind = \'m\'`) materializes pre-aggregated per-tenant totals on disk so dashboard queries read 4 heap tuples instead of scanning `tenant_invoices`, and `CREATE UNIQUE INDEX idx_mv_tenant_invoice_pk` satisfies PostgreSQL\'s uniqueness requirement for non-blocking `REFRESH MATERIALIZED VIEW CONCURRENTLY`.'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
