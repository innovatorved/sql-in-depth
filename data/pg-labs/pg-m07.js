/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 07 (`pg-m07`): Programmability (PL/pgSQL), Triggers, Partitioning & RLS
 * 8 Hands-On Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m07'] = [
    /* ========================================================================
       LAB 01: pg-m07-t01 — SQL Functions, Volatility Categories & Inlining
       ======================================================================== */
    {
      id: 'pg-m07-t01',
      slug: 'sql-functions-volatility-inlining',
      moduleId: 'pg-m07',
      title: 'SQL Functions, Volatility Categories (IMMUTABLE/STABLE/VOLATILE) & Inlining',
      difficulty: 'Intermediate',
      estimatedMinutes: 14,
      datasetId: 'ecommerce',
      clauses: ['CREATE FUNCTION', 'LANGUAGE sql', 'IMMUTABLE', 'STABLE', 'RETURNS TABLE'],
      tags: ['functions', 'volatility', 'inlining', 'immutable', 'planner'],
      guide: {
        mentalModel: 'Every PostgreSQL function carries a volatility contract stored in `pg_proc.provolatile` (`i` = `IMMUTABLE`, `s` = `STABLE`, `v` = `VOLATILE`, the default when omitted). Unlike opaque stored routines in legacy RDBMSs, simple `LANGUAGE sql` functions can be **inlined directly into the outer query tree** by the planner—turning function calls into native relational expressions eligible for constant folding and index scans.\n\nGetting volatility wrong hurts both correctness and speed: leaving a pure helper as default `VOLATILE` blocks constant folding, disables Index Scan pushdowns (`WHERE col = my_fn(x)` re-evaluates per row), and forbids `CREATE INDEX` expression indexes. Conversely, mislabeling a table-reading query as `IMMUTABLE` breaks MVCC snapshot semantics and corrupts B-Tree indexes when underlying rows change.',
        syntaxAnatomy: [
          'CREATE OR REPLACE FUNCTION cents_to_usd(cents BIGINT)',
          'RETURNS NUMERIC',
          'LANGUAGE sql',
          'IMMUTABLE PARALLEL SAFE',
          'AS $$',
          '  SELECT ROUND(cents::numeric / 100, 2);',
          '$$;'
        ].join('\n'),
        internalsAndGotchas: [
          'Omitting a volatility keyword defaults every function to `VOLATILE` (`provolatile = \'v\'`), preventing PostgreSQL from using the function inside an index predicate or expression index.',
          '`IMMUTABLE` promises output depends strictly on input arguments forever (pure math/string normalization); `STABLE` permits reading tables within a single statement snapshot (`now()`, catalog/table lookups); `VOLATILE` allows side effects or intra-scan drift (`random()`, `clock_timestamp()`, DML).',
          'Planner inlining of scalar `LANGUAGE sql` functions is suppressed if you attach `STRICT` (`RETURNS NULL ON NULL INPUT`) when the body wouldn\'t naturally propagate `NULL`, or if you wrap the logic in `LANGUAGE plpgsql`.'
        ],
        whenToUse: 'Use `LANGUAGE sql` with `IMMUTABLE` for pure deterministic conversions and expression-index normalizers, and `LANGUAGE sql` with `STABLE` + `RETURNS TABLE` for reusable parameterized views that inline cleanly into caller plans.'
      },
      scenario: {
        role: 'Core Commerce Database Engineer',
        incidentOrGoal: 'Application services duplicated cents-to-USD rounding and coupon normalization logic, while a pure helper left as default `VOLATILE` blocked an expression index on `orders(discount_code)`.',
        stakeholderNeed: 'Author an `IMMUTABLE` currency scalar function, a `STABLE` set-returning `RETURNS TABLE` customer order function, and an `IMMUTABLE` coupon normalizer backed by a live expression index.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Author an IMMUTABLE Scalar SQL Currency Function',
          mission: 'Create or replace a `LANGUAGE sql` function `cents_to_usd(cents BIGINT) RETURNS NUMERIC` marked `IMMUTABLE` that converts integer `cents` to exact USD rounded to 2 decimal places (`ROUND(cents::numeric / 100, 2)`). Our verification probe will test `cents_to_usd()` across `products` and verify `pg_proc.provolatile = \'i\'`.',
          setupSql: 'DROP FUNCTION IF EXISTS cents_to_usd(bigint); DROP FUNCTION IF EXISTS cents_to_usd(integer);',
          probeSql: 'SELECT p.product_id, p.sku, cents_to_usd(p.price_cents) AS price_usd, (SELECT provolatile::text FROM pg_proc WHERE proname = \'cents_to_usd\' ORDER BY oid DESC LIMIT 1) AS volatility_flag FROM products p ORDER BY p.product_id ASC;',
          starterCode: [
            '-- Define cents_to_usd(cents BIGINT) RETURNS NUMERIC as LANGUAGE sql IMMUTABLE',
            'CREATE OR REPLACE FUNCTION cents_to_usd(cents BIGINT)',
            'RETURNS NUMERIC',
            'LANGUAGE sql',
            '-- TODO: mark IMMUTABLE so the planner can constant-fold and inline it',
            'AS $$',
            '  SELECT 0::numeric; -- TODO: compute ROUND(cents::numeric / 100, 2)',
            '$$;'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION cents_to_usd(cents BIGINT)',
            'RETURNS NUMERIC',
            'LANGUAGE sql',
            'IMMUTABLE',
            'AS $$',
            '  SELECT ROUND(cents::numeric / 100, 2);',
            '$$;'
          ].join('\n'),
          hints: [
            'Add the `IMMUTABLE` volatility modifier so PostgreSQL records `provolatile = \'i\'` in `pg_proc`.',
            'Cast `cents::numeric` before dividing by `100` so integer division does not truncate cents.',
            'Return `SELECT ROUND(cents::numeric / 100, 2);` inside the `$$ ... $$` SQL body.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+cents_to_usd\\b', flags: 'i', message: 'Define the function `cents_to_usd`.' },
              { pattern: '\\bIMMUTABLE\\b', flags: 'i', message: 'Declare `cents_to_usd` as `IMMUTABLE`.' },
              { pattern: '\\bLANGUAGE\\s+sql\\b', flags: 'i', message: 'Use `LANGUAGE sql` so the planner can inline the scalar expression.' }
            ]
          },
          solutionExplanation: 'Declaring `cents_to_usd(BIGINT)` as `LANGUAGE sql IMMUTABLE` lets PostgreSQL inline `ROUND(cents::numeric / 100, 2)` directly into outer projections and fold constant arguments at plan time.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Parameterized Set-Returning SQL Function (STABLE + RETURNS TABLE)',
          mission: 'Create or replace a `LANGUAGE sql` function `customer_completed_orders(p_customer_id INTEGER)` declared `STABLE` with `RETURNS TABLE (order_id INTEGER, total_usd NUMERIC, created_at TEXT)` that returns all `completed` orders (`status = \'completed\'`) for `p_customer_id`, projecting `order_id`, `ROUND(total_cents::numeric / 100, 2)`, and `created_at` ordered by `order_id ASC`.',
          setupSql: 'DROP FUNCTION IF EXISTS customer_completed_orders(integer);',
          probeSql: 'SELECT o.order_id, o.total_usd, o.created_at, (SELECT provolatile::text FROM pg_proc WHERE proname = \'customer_completed_orders\' ORDER BY oid DESC LIMIT 1) AS volatility_flag FROM customer_completed_orders(1) o ORDER BY o.order_id ASC;',
          starterCode: [
            '-- Create a STABLE table function returning completed orders for one customer',
            'CREATE OR REPLACE FUNCTION customer_completed_orders(p_customer_id INTEGER)',
            'RETURNS TABLE (order_id INTEGER, total_usd NUMERIC, created_at TEXT)',
            'LANGUAGE sql',
            '-- TODO: mark STABLE (reads table state within a statement snapshot)',
            'AS $$',
            '  -- TODO: query orders for p_customer_id AND status = \'completed\' ordered by order_id ASC',
            '  SELECT NULL::integer, NULL::numeric, NULL::text WHERE false;',
            '$$;'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION customer_completed_orders(p_customer_id INTEGER)',
            'RETURNS TABLE (order_id INTEGER, total_usd NUMERIC, created_at TEXT)',
            'LANGUAGE sql',
            'STABLE',
            'AS $$',
            '  SELECT o.order_id,',
            '         ROUND(o.total_cents::numeric / 100, 2) AS total_usd,',
            '         o.created_at',
            '  FROM orders o',
            '  WHERE o.customer_id = p_customer_id',
            '    AND o.status = \'completed\'',
            '  ORDER BY o.order_id ASC;',
            '$$;'
          ].join('\n'),
          hints: [
            'Mark the function `STABLE` (`provolatile = \'s\'`) because it reads the `orders` heap rather than computing solely from arguments.',
            'Filter `FROM orders o WHERE o.customer_id = p_customer_id AND o.status = \'completed\'` so parameter name `order_id` from `RETURNS TABLE` never collides ambiguously.',
            'Project `o.order_id, ROUND(o.total_cents::numeric / 100, 2), o.created_at` and sort by `o.order_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bRETURNS\\s+TABLE\\b', flags: 'i', message: 'Use `RETURNS TABLE (...)` to define the typed output row.' },
              { pattern: '\\bSTABLE\\b', flags: 'i', message: 'Mark the table-reading function `STABLE`.' }
            ]
          },
          solutionExplanation: 'Because `RETURNS TABLE (order_id ...)` introduces `order_id` into function scope, qualifying table columns (`o.order_id`) avoids ambiguity while `LANGUAGE sql STABLE` allows the planner to inline the parameterized scan.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Unlocking Expression Indexes with IMMUTABLE Functions',
          mission: 'Create or replace an `IMMUTABLE` `LANGUAGE sql` function `normalize_coupon(code TEXT) RETURNS TEXT` that returns `UPPER(BTRIM(code))`, and create a B-Tree expression index named `idx_orders_norm_coupon` on `orders (normalize_coupon(discount_code))`.',
          setupSql: 'DROP INDEX IF EXISTS idx_orders_norm_coupon; DROP FUNCTION IF EXISTS normalize_coupon(text);',
          probeSql: 'SELECT p.proname AS fn_name, p.provolatile::text AS volatility, i.indexname, normalize_coupon(\'  spring  \') AS sample_norm FROM pg_proc p JOIN pg_indexes i ON i.indexname = \'idx_orders_norm_coupon\' WHERE p.proname = \'normalize_coupon\';',
          starterCode: [
            '-- 1. Define normalize_coupon(code TEXT) as LANGUAGE sql IMMUTABLE',
            '-- 2. Build expression index idx_orders_norm_coupon on orders (normalize_coupon(discount_code))',
            'CREATE OR REPLACE FUNCTION normalize_coupon(code TEXT)',
            'RETURNS TEXT',
            'LANGUAGE sql',
            'AS $$',
            '  SELECT code; -- TODO: UPPER(BTRIM(code)) and add IMMUTABLE + CREATE INDEX',
            '$$;'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION normalize_coupon(code TEXT)',
            'RETURNS TEXT',
            'LANGUAGE sql',
            'IMMUTABLE',
            'AS $$',
            '  SELECT UPPER(BTRIM(code));',
            '$$;',
            'CREATE INDEX idx_orders_norm_coupon ON orders (normalize_coupon(discount_code));'
          ].join('\n'),
          hints: [
            'PostgreSQL rejects `CREATE INDEX` on any function that is not marked `IMMUTABLE` with error `functions in index expression must be marked IMMUTABLE`.',
            'Return `SELECT UPPER(BTRIM(code));` inside `normalize_coupon(code TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE`.',
            'Follow the function DDL with `CREATE INDEX idx_orders_norm_coupon ON orders (normalize_coupon(discount_code));`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bIMMUTABLE\\b', flags: 'i', message: 'Mark `normalize_coupon` as `IMMUTABLE` so PostgreSQL permits indexing it.' },
              { pattern: '\\bCREATE\\s+INDEX\\s+idx_orders_norm_coupon\\b', flags: 'i', message: 'Create the expression index `idx_orders_norm_coupon`.' }
            ]
          },
          solutionExplanation: 'B-Tree keys stored on disk must never silently change value over time; marking `normalize_coupon` as `IMMUTABLE` certifies determinism so PostgreSQL permits `idx_orders_norm_coupon` and matches `WHERE normalize_coupon(discount_code) = \'SPRING\'` via Index Scan.'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m07-t02 — PL/pgSQL Control Flow, Diagnostics & Exceptions
       ======================================================================== */
    {
      id: 'pg-m07-t02',
      slug: 'plpgsql-control-flow-exceptions',
      moduleId: 'pg-m07',
      title: 'PL/pgSQL Functions: DECLARE, RETURN QUERY & EXCEPTION Subtransactions',
      difficulty: 'Intermediate',
      estimatedMinutes: 16,
      datasetId: 'fintech_ledger',
      clauses: ['LANGUAGE plpgsql', 'DECLARE', 'RETURN QUERY', 'GET DIAGNOSTICS', 'EXCEPTION WHEN'],
      tags: ['plpgsql', 'functions', 'exceptions', 'stored-logic'],
      guide: {
        mentalModel: 'PL/pgSQL (`LANGUAGE plpgsql`) compiles procedural control flow around PostgreSQL\'s Server Programming Interface (`SPI`), caching prepared execution plans across calls in the session backend. Unlike `LANGUAGE sql`, PL/pgSQL functions are **never inlined** by the outer planner, making them ideal for imperative multi-step invariants, `SELECT ... INTO` branching, `GET DIAGNOSTICS` row-count inspection, and structured error recovery—not trivial one-line scalar wrappers.\n\nCrucially, entering a `BEGIN ... EXCEPTION WHEN ... END` block allocates an **internal subtransaction** (`SubTransactionId`). Under high concurrency, nested `EXCEPTION` blocks inside tight per-row loops consume XIDs and can contend on the `SubtransSLRU` shared-memory cache; reserve `EXCEPTION` blocks for genuine conflict/constraint recovery rather than routine flow control.',
        syntaxAnatomy: [
          'CREATE OR REPLACE FUNCTION safe_credit(p_acct INT, p_cents INT)',
          'RETURNS TEXT LANGUAGE plpgsql AS $$',
          'DECLARE',
          '  v_rows INT;',
          'BEGIN',
          '  UPDATE accounts SET posted_balance_cents = posted_balance_cents + p_cents',
          '  WHERE account_id = p_acct;',
          '  GET DIAGNOSTICS v_rows = ROW_COUNT;',
          '  IF v_rows = 0 THEN RETURN \'NOT_FOUND\'; END IF;',
          '  RETURN \'OK\';',
          'EXCEPTION WHEN check_violation THEN',
          '  RETURN \'INVALID_AMOUNT\';',
          'END;',
          '$$;'
        ].join('\n'),
        internalsAndGotchas: [
          '`SELECT col INTO v_x FROM ...` silently assigns `NULL` if zero rows match unless you check the special boolean `IF NOT FOUND THEN ...` or use `SELECT ... INTO STRICT v_x` (which raises `NO_DATA_FOUND` / `TOO_MANY_ROWS`).',
          '`RETURN QUERY SELECT ...` appends rows to the function\'s tuplestore without exiting the function; follow it with `RETURN;` (or reach `END;`) to finish execution.',
          'Every `BEGIN ... EXCEPTION WHEN ... END` block opens a subtransaction savepoint; catching `unique_violation` rolls back only writes performed inside that `BEGIN` block while keeping earlier outer-transaction work intact.'
        ],
        whenToUse: 'Use `LANGUAGE plpgsql` when enforcing multi-statement financial invariants, inspecting affected row counts via `GET DIAGNOSTICS`, or gracefully translating constraint violations into domain status codes.'
      },
      scenario: {
        role: 'Ledger Core Backend Engineer',
        incidentOrGoal: 'Payment workers suffer extra network round-trips checking account tiers, applying batch maintenance fees, and crashing whole batches on retried idempotency keys.',
        stakeholderNeed: 'Build three PL/pgSQL functions: an `IF / NOT FOUND` liquidity classifier, a `GET DIAGNOSTICS` + `RETURN QUERY` fee processor, and an `EXCEPTION WHEN` idempotent transfer registrar.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — DECLARE, SELECT INTO & NOT FOUND Branching',
          mission: 'Create or replace `classify_account_liquidity(p_account_id INTEGER) RETURNS TEXT LANGUAGE plpgsql STABLE`. Fetch `account_type` and `posted_balance_cents` from `accounts` for `p_account_id`: return `\'MISSING\'` if no row exists (`NOT FOUND`), `\'SYSTEM_VAULT\'` if `account_type = \'system\'`, `\'HIGH_LIQUIDITY\'` if `posted_balance_cents >= 300000`, and `\'STANDARD_LIQUIDITY\'` otherwise.',
          setupSql: 'DROP FUNCTION IF EXISTS classify_account_liquidity(integer);',
          probeSql: 'SELECT v.account_id, classify_account_liquidity(v.account_id) AS liquidity_tier FROM (VALUES (100), (101), (102), (999)) AS v(account_id) ORDER BY v.account_id ASC;',
          starterCode: [
            'CREATE OR REPLACE FUNCTION classify_account_liquidity(p_account_id INTEGER)',
            'RETURNS TEXT',
            'LANGUAGE plpgsql',
            'STABLE',
            'AS $$',
            'DECLARE',
            '  v_type TEXT;',
            '  v_balance BIGINT;',
            'BEGIN',
            '  -- TODO: SELECT account_type, posted_balance_cents INTO v_type, v_balance ...',
            '  -- TODO: handle NOT FOUND, \'system\', >= 300000, and fallback',
            '  RETURN \'TODO\';',
            'END;',
            '$$;'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION classify_account_liquidity(p_account_id INTEGER)',
            'RETURNS TEXT',
            'LANGUAGE plpgsql',
            'STABLE',
            'AS $$',
            'DECLARE',
            '  v_type TEXT;',
            '  v_balance BIGINT;',
            'BEGIN',
            '  SELECT a.account_type, a.posted_balance_cents',
            '    INTO v_type, v_balance',
            '  FROM accounts a',
            '  WHERE a.account_id = p_account_id;',
            '',
            '  IF NOT FOUND THEN',
            '    RETURN \'MISSING\';',
            '  ELSIF v_type = \'system\' THEN',
            '    RETURN \'SYSTEM_VAULT\';',
            '  ELSIF v_balance >= 300000 THEN',
            '    RETURN \'HIGH_LIQUIDITY\';',
            '  ELSE',
            '    RETURN \'STANDARD_LIQUIDITY\';',
            '  END IF;',
            'END;',
            '$$;'
          ].join('\n'),
          hints: [
            'Run `SELECT account_type, posted_balance_cents INTO v_type, v_balance FROM accounts WHERE account_id = p_account_id;`.',
            'Immediately inspect `IF NOT FOUND THEN RETURN \'MISSING\';` before checking `v_type` or `v_balance`.',
            'Chain `ELSIF v_type = \'system\'`, `ELSIF v_balance >= 300000`, and `ELSE RETURN \'STANDARD_LIQUIDITY\'; END IF;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bLANGUAGE\\s+plpgsql\\b', flags: 'i', message: 'Implement the function in `LANGUAGE plpgsql`.' },
              { pattern: '\\bINTO\\b', flags: 'i', message: 'Use `SELECT ... INTO` to populate PL/pgSQL variables.' },
              { pattern: '\\bIF\\b', flags: 'i', message: 'Use PL/pgSQL `IF ... THEN` branching.' }
            ]
          },
          solutionExplanation: 'PL/pgSQL automatically sets the `FOUND` boolean after every `SELECT ... INTO` or DML statement, letting `IF NOT FOUND` distinguish missing primary keys (`999`) cleanly before evaluating tier thresholds.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — GET DIAGNOSTICS ROW_COUNT & RETURN QUERY Summary',
          mission: 'Create or replace `apply_account_fee(p_min_balance BIGINT, p_fee_cents INTEGER) RETURNS TABLE (updated_count INTEGER, remaining_total_cents BIGINT) LANGUAGE plpgsql`. Deduct `p_fee_cents` from `posted_balance_cents` and increment `version = version + 1` on `accounts` where `account_type <> \'system\'` AND `posted_balance_cents >= p_min_balance`. Capture the affected row count via `GET DIAGNOSTICS ... = ROW_COUNT`, then `RETURN QUERY` one summary row with that count and `SUM(posted_balance_cents)::bigint` across all non-system accounts.',
          setupSql: 'DROP FUNCTION IF EXISTS apply_account_fee(bigint, integer);',
          probeSql: 'SELECT updated_count, remaining_total_cents FROM apply_account_fee(250000, 1500);',
          starterCode: [
            'CREATE OR REPLACE FUNCTION apply_account_fee(p_min_balance BIGINT, p_fee_cents INTEGER)',
            'RETURNS TABLE (updated_count INTEGER, remaining_total_cents BIGINT)',
            'LANGUAGE plpgsql',
            'AS $$',
            'DECLARE',
            '  v_updated INTEGER := 0;',
            'BEGIN',
            '  -- TODO: UPDATE non-system accounts with posted_balance_cents >= p_min_balance',
            '  -- TODO: GET DIAGNOSTICS v_updated = ROW_COUNT;',
            '  -- TODO: RETURN QUERY SELECT v_updated, SUM(...)::bigint FROM accounts WHERE account_type <> \'system\';',
            'END;',
            '$$;'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION apply_account_fee(p_min_balance BIGINT, p_fee_cents INTEGER)',
            'RETURNS TABLE (updated_count INTEGER, remaining_total_cents BIGINT)',
            'LANGUAGE plpgsql',
            'AS $$',
            'DECLARE',
            '  v_updated INTEGER := 0;',
            'BEGIN',
            '  UPDATE accounts',
            '     SET posted_balance_cents = posted_balance_cents - p_fee_cents,',
            '         version = version + 1',
            '   WHERE account_type <> \'system\'',
            '     AND posted_balance_cents >= p_min_balance;',
            '',
            '  GET DIAGNOSTICS v_updated = ROW_COUNT;',
            '',
            '  RETURN QUERY',
            '  SELECT v_updated, SUM(a.posted_balance_cents)::bigint',
            '  FROM accounts a',
            '  WHERE a.account_type <> \'system\';',
            'END;',
            '$$;'
          ].join('\n'),
          hints: [
            'Filter the `UPDATE accounts` with `WHERE account_type <> \'system\' AND posted_balance_cents >= p_min_balance` (accounts `101` at `415000` and `102` at `260000` qualify).',
            'Immediately run `GET DIAGNOSTICS v_updated = ROW_COUNT;` before running any subsequent SQL statement.',
            'Emit the result row with `RETURN QUERY SELECT v_updated, SUM(a.posted_balance_cents)::bigint FROM accounts a WHERE a.account_type <> \'system\';`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bGET\\s+DIAGNOSTICS\\b', flags: 'i', message: 'Use `GET DIAGNOSTICS ... = ROW_COUNT` to read affected rows.' },
              { pattern: '\\bRETURN\\s+QUERY\\b', flags: 'i', message: 'Use `RETURN QUERY` to emit the typed table row.' }
            ]
          },
          solutionExplanation: '`GET DIAGNOSTICS v_updated = ROW_COUNT` reads the SPI tuple counter from the immediately preceding `UPDATE` (`2` checking accounts), and `RETURN QUERY` streams `(2, 822000)` directly to the caller.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Subtransaction Recovery with EXCEPTION WHEN',
          mission: 'Create or replace `safe_register_transfer(p_transfer_id INTEGER, p_idem_key TEXT, p_from INTEGER, p_to INTEGER, p_amount INTEGER) RETURNS TEXT LANGUAGE plpgsql`. Insert `(p_transfer_id, p_idem_key, p_from, p_to, p_amount, \'posted\', \'2025-03-15 10:00:00\')` into `transfers` and return `\'CREATED\'`. Catch `unique_violation` to return `\'DUPLICATE_KEY\'` and catch `check_violation` to return `\'INVALID_AMOUNT\'`.',
          setupSql: 'DROP FUNCTION IF EXISTS safe_register_transfer(integer, text, integer, integer, integer);',
          probeSql: 'SELECT safe_register_transfer(9010, \'idem-new-9010\', 101, 102, 15000) AS fresh_call, safe_register_transfer(9011, \'idem-pay-001\', 101, 102, 15000) AS dup_call, safe_register_transfer(9012, \'idem-neg-9012\', 101, 102, -500) AS bad_amt_call, (SELECT COUNT(*)::int FROM transfers) AS transfers_after;',
          starterCode: [
            'CREATE OR REPLACE FUNCTION safe_register_transfer(',
            '  p_transfer_id INTEGER, p_idem_key TEXT, p_from INTEGER, p_to INTEGER, p_amount INTEGER',
            ') RETURNS TEXT LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  -- TODO: INSERT INTO transfers VALUES (...) and RETURN \'CREATED\'',
            '  -- TODO: EXCEPTION WHEN unique_violation ... WHEN check_violation ...',
            '  RETURN \'TODO\';',
            'END;',
            '$$;'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION safe_register_transfer(',
            '  p_transfer_id INTEGER, p_idem_key TEXT, p_from INTEGER, p_to INTEGER, p_amount INTEGER',
            ') RETURNS TEXT LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  INSERT INTO transfers (transfer_id, idempotency_key, from_account_id, to_account_id, amount_cents, status, created_at)',
            '  VALUES (p_transfer_id, p_idem_key, p_from, p_to, p_amount, \'posted\', \'2025-03-15 10:00:00\');',
            '  RETURN \'CREATED\';',
            'EXCEPTION',
            '  WHEN unique_violation THEN',
            '    RETURN \'DUPLICATE_KEY\';',
            '  WHEN check_violation THEN',
            '    RETURN \'INVALID_AMOUNT\';',
            'END;',
            '$$;'
          ].join('\n'),
          hints: [
            'Insert all 7 columns into `transfers` with `status = \'posted\'` and `created_at = \'2025-03-15 10:00:00\'`, followed by `RETURN \'CREATED\';`.',
            'Add an `EXCEPTION` section at the bottom of the `BEGIN ... END` block.',
            'Handle `WHEN unique_violation THEN RETURN \'DUPLICATE_KEY\';` and `WHEN check_violation THEN RETURN \'INVALID_AMOUNT\';`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bEXCEPTION\\b', flags: 'i', message: 'Use a PL/pgSQL `EXCEPTION` block to trap constraint violations.' },
              { pattern: '\\bunique_violation\\b', flags: 'i', message: 'Trap `WHEN unique_violation` for duplicate idempotency keys.' },
              { pattern: '\\bcheck_violation\\b', flags: 'i', message: 'Trap `WHEN check_violation` for non-positive transfer amounts.' }
            ]
          },
          solutionExplanation: 'PL/pgSQL wraps the `BEGIN ... EXCEPTION` block in an internal savepoint: when `idem-pay-001` triggers `23505` (`unique_violation`) or `-500` triggers `23514` (`check_violation`), only that failed `INSERT` rolls back while `9010` stays committed in the outer transaction (`transfers_after = 6`).'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m07-t03 — Procedures, CALL & Injection-Proof Dynamic SQL
       ======================================================================== */
    {
      id: 'pg-m07-t03',
      slug: 'procedures-dynamic-sql-format',
      moduleId: 'pg-m07',
      title: 'CREATE PROCEDURE, CALL & Safe Dynamic SQL with format(%I, %L)',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['CREATE PROCEDURE', 'CALL', 'EXECUTE format(...)', 'USING'],
      tags: ['procedures', 'dynamic-sql', 'format', 'sql-injection-defense'],
      guide: {
        mentalModel: 'Introduced in PostgreSQL 11, `CREATE PROCEDURE` differs from `CREATE FUNCTION` in two architectural ways: procedures are invoked standalone via `CALL proc(...)` rather than inside `SELECT`, and top-level procedures can execute transaction control (`COMMIT` / `ROLLBACK`) between maintenance batches (so long as the caller is not already inside an explicit savepoint or `SELECT` query).\n\nWhen administrative routines must parameterize **identifiers** (table or column names), regular `$1` bind parameters cannot be used because planner binding requires fixed catalog OIDs. Never concatenate raw strings (`\'SELECT * FROM \' || tbl`); instead combine `format(\'... %I ...\', ident)`—which double-quotes identifiers only when needed and escapes embedded quotes—with `EXECUTE ... USING val` so runtime data values travel strictly out-of-band as typed `$1` parameters.',
        syntaxAnatomy: [
          'CREATE OR REPLACE PROCEDURE purge_zero_balance(p_table TEXT, p_status TEXT)',
          'LANGUAGE plpgsql AS $$',
          'BEGIN',
          '  EXECUTE format(\'DELETE FROM %I WHERE status = $1 AND balance_cents = 0\', p_table)',
          '    USING p_status;',
          'END;',
          '$$;',
          'CALL purge_zero_balance(\'ledger_accounts\', \'closed\');'
        ].join('\n'),
        internalsAndGotchas: [
          'In `format()`, `%I` safely formats SQL identifiers (tables/columns), `%L` formats SQL literal constants (`NULL`-aware), and `%s` performs raw unescaped substitution—never pass untrusted input into `%s`.',
          'Prefer `$1, $2` placeholders paired with `EXECUTE ... USING val1, val2` over `%L` for runtime data values: `USING` preserves exact PostgreSQL data types without text serialization/parsing overhead.',
          'Procedures with `INOUT` parameters return a single-row result tuple to the `CALL` invoker; calling `COMMIT` inside a procedure fails with `invalid transaction termination` if invoked inside a function, trigger, or active `SAVEPOINT`.'
        ],
        whenToUse: 'Use `CREATE PROCEDURE` + `CALL` for administrative maintenance jobs and queue operations, and pair `format(\'%I\', ...)` with `EXECUTE ... USING` whenever table or column names must be chosen dynamically at runtime.'
      },
      scenario: {
        role: 'Platform DBRE Automation Lead',
        incidentOrGoal: 'An ad-hoc ops script concatenated raw table names into dynamic `EXECUTE` strings, creating a SQL-injection vector while queue recovery lacked a standardized `CALL` procedure.',
        stakeholderNeed: 'Author a `CALL`-invoked dead-letter queue recovery procedure with `INOUT` count reporting, a dynamic `format(\'%I\')` + `USING` row counter, and a safe dynamic ledger purge procedure.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — CREATE PROCEDURE with INOUT Reporting & CALL',
          mission: 'Create or replace procedure `requeue_failed_jobs(p_queue TEXT, INOUT p_requeued INTEGER DEFAULT 0) LANGUAGE plpgsql` that updates `job_queue` setting `status = \'pending\'`, `attempts = 0`, and `locked_by = NULL` where `queue_name = p_queue AND status = \'failed\'`, assigning the affected row count to `p_requeued` via `GET DIAGNOSTICS`. Then invoke `CALL requeue_failed_jobs(\'webhooks\');`.',
          setupSql: 'DROP PROCEDURE IF EXISTS requeue_failed_jobs(text, integer);',
          probeSql: 'SELECT job_id, queue_name, status, attempts FROM job_queue WHERE queue_name = \'webhooks\' ORDER BY job_id ASC;',
          starterCode: [
            '-- 1. Create procedure requeue_failed_jobs(p_queue TEXT, INOUT p_requeued INTEGER DEFAULT 0)',
            '-- 2. Invoke CALL requeue_failed_jobs(\'webhooks\');',
            'CREATE OR REPLACE PROCEDURE requeue_failed_jobs(p_queue TEXT, INOUT p_requeued INTEGER DEFAULT 0)',
            'LANGUAGE plpgsql',
            'AS $$',
            'BEGIN',
            '  -- TODO: UPDATE job_queue ... WHERE queue_name = p_queue AND status = \'failed\'',
            '  -- TODO: GET DIAGNOSTICS p_requeued = ROW_COUNT;',
            'END;',
            '$$;'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE PROCEDURE requeue_failed_jobs(p_queue TEXT, INOUT p_requeued INTEGER DEFAULT 0)',
            'LANGUAGE plpgsql',
            'AS $$',
            'BEGIN',
            '  UPDATE job_queue',
            '     SET status = \'pending\',',
            '         attempts = 0,',
            '         locked_by = NULL',
            '   WHERE queue_name = p_queue',
            '     AND status = \'failed\';',
            '  GET DIAGNOSTICS p_requeued = ROW_COUNT;',
            'END;',
            '$$;',
            'CALL requeue_failed_jobs(\'webhooks\');'
          ].join('\n'),
          hints: [
            'Inside the procedure body, update `job_queue` setting `status = \'pending\', attempts = 0, locked_by = NULL` filtered by `queue_name = p_queue AND status = \'failed\'`.',
            'Capture `GET DIAGNOSTICS p_requeued = ROW_COUNT;` into the `INOUT` parameter.',
            'Execute `CALL requeue_failed_jobs(\'webhooks\');` as the second statement so dead-letter job `7` moves back to `pending`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+requeue_failed_jobs\\b', flags: 'i', message: 'Define `CREATE OR REPLACE PROCEDURE requeue_failed_jobs`.' },
              { pattern: '\\bCALL\\s+requeue_failed_jobs\\s*\\(', flags: 'i', message: 'Invoke the procedure with `CALL requeue_failed_jobs(...)`.' }
            ]
          },
          solutionExplanation: '`CREATE PROCEDURE` encapsulates administrative queue mutations with `INOUT` feedback, and `CALL requeue_failed_jobs(\'webhooks\')` resets dead-letter `job_id = 7` (`attempts: 5 -> 0`, `status: \'pending\'`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — SQL-Injection-Proof Dynamic Lookups with format(%I) & USING',
          mission: 'Create or replace `count_matching_rows(p_table TEXT, p_column TEXT, p_value TEXT) RETURNS BIGINT LANGUAGE plpgsql STABLE` that dynamically counts rows in identifier `p_table` where column identifier `p_column` (cast to `::text`) equals `p_value`. You MUST format table and column identifiers with `format(\'... %I ... %I ...\', ...)` and pass `p_value` via `EXECUTE ... INTO ... USING p_value`.',
          setupSql: 'DROP FUNCTION IF EXISTS count_matching_rows(text, text, text);',
          probeSql: 'SELECT count_matching_rows(\'api_audit_events\', \'tenant_id\', \'acme\') AS acme_events, count_matching_rows(\'tenant_invoices\', \'status\', \'overdue\') AS overdue_invoices;',
          starterCode: [
            'CREATE OR REPLACE FUNCTION count_matching_rows(p_table TEXT, p_column TEXT, p_value TEXT)',
            'RETURNS BIGINT',
            'LANGUAGE plpgsql',
            'STABLE',
            'AS $$',
            'DECLARE',
            '  v_cnt BIGINT;',
            'BEGIN',
            '  -- TODO: EXECUTE format(\'SELECT COUNT(*)::bigint FROM %I WHERE %I::text = $1\', p_table, p_column)',
            '  --       INTO v_cnt USING p_value;',
            '  RETURN 0;',
            'END;',
            '$$;'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION count_matching_rows(p_table TEXT, p_column TEXT, p_value TEXT)',
            'RETURNS BIGINT',
            'LANGUAGE plpgsql',
            'STABLE',
            'AS $$',
            'DECLARE',
            '  v_cnt BIGINT;',
            'BEGIN',
            '  EXECUTE format(\'SELECT COUNT(*)::bigint FROM %I WHERE %I::text = $1\', p_table, p_column)',
            '    INTO v_cnt',
            '    USING p_value;',
            '  RETURN v_cnt;',
            'END;',
            '$$;'
          ].join('\n'),
          hints: [
            'Use `%I` (never `%s`) for both `p_table` and `p_column` inside `format(\'SELECT COUNT(*)::bigint FROM %I WHERE %I::text = $1\', p_table, p_column)`.',
            'Place `INTO v_cnt` and `USING p_value` on the `EXECUTE` statement (not inside the dynamic SQL string!).',
            'Return `v_cnt` at the end of the PL/pgSQL block.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bEXECUTE\\s+format\\s*\\(', flags: 'i', message: 'Build the dynamic query using `EXECUTE format(...)`.' },
              { pattern: '%I', flags: '', message: 'Quote dynamic table and column identifiers safely with `%I`.' },
              { pattern: '\\bUSING\\b', flags: 'i', message: 'Bind the runtime filter value out-of-band with `USING`.' }
            ]
          },
          solutionExplanation: '`format(\'... %I ...\', ...)` neutralizes identifier injection by quoting malicious table/column names as literal identifiers, while `USING p_value` binds `$1` at the protocol/SPI parameter level without string interpolation.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Dynamic Table Purge Procedure with format(%I) & USING',
          mission: 'Create or replace procedure `purge_zero_balance_dynamic(p_table TEXT, p_status TEXT) LANGUAGE plpgsql` that dynamically deletes rows from identifier `p_table` where `status = $1 AND balance_cents = 0` using `EXECUTE format(...) USING p_status`. Then invoke `CALL purge_zero_balance_dynamic(\'ledger_accounts\', \'closed\');` to retire closed zero-balance accounts while preserving dormant ones.',
          setupSql: 'DROP PROCEDURE IF EXISTS purge_zero_balance_dynamic(text, text);',
          probeSql: 'SELECT account_id, account_code, status, balance_cents FROM ledger_accounts ORDER BY account_id ASC;',
          starterCode: [
            '-- Create procedure purge_zero_balance_dynamic(p_table TEXT, p_status TEXT) and CALL it for (\'ledger_accounts\', \'closed\')',
            'CREATE OR REPLACE PROCEDURE purge_zero_balance_dynamic(p_table TEXT, p_status TEXT)',
            'LANGUAGE plpgsql',
            'AS $$',
            'BEGIN',
            '  -- TODO: EXECUTE format(\'DELETE FROM %I WHERE status = $1 AND balance_cents = 0\', p_table) USING p_status;',
            '  NULL;',
            'END;',
            '$$;'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE PROCEDURE purge_zero_balance_dynamic(p_table TEXT, p_status TEXT)',
            'LANGUAGE plpgsql',
            'AS $$',
            'BEGIN',
            '  EXECUTE format(\'DELETE FROM %I WHERE status = $1 AND balance_cents = 0\', p_table)',
            '    USING p_status;',
            'END;',
            '$$;',
            'CALL purge_zero_balance_dynamic(\'ledger_accounts\', \'closed\');'
          ].join('\n'),
          hints: [
            'Format the target table safely with `format(\'DELETE FROM %I WHERE status = $1 AND balance_cents = 0\', p_table)`.',
            'Pass `p_status` via `USING p_status` on the `EXECUTE` command.',
            'Call `CALL purge_zero_balance_dynamic(\'ledger_accounts\', \'closed\');` after the `CREATE OR REPLACE PROCEDURE` statement.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+purge_zero_balance_dynamic\\b', flags: 'i', message: 'Define `purge_zero_balance_dynamic`.' },
              { pattern: '\\bEXECUTE\\s+format\\s*\\(', flags: 'i', message: 'Use `EXECUTE format(...)` with `%I`.' },
              { pattern: '\\bCALL\\s+purge_zero_balance_dynamic\\s*\\(', flags: 'i', message: 'Invoke `CALL purge_zero_balance_dynamic(\'ledger_accounts\', \'closed\')`.' }
            ]
          },
          solutionExplanation: 'Combining `CREATE PROCEDURE`, `format(\'%I\', p_table)`, and `USING p_status` deletes `account_id = 506` (`closed`, `0` cents) cleanly while keeping `504` (`dormant`, `0` cents) and all funded active accounts.'
        }
      ]
    },

    /* ========================================================================
       LAB 04: pg-m07-t04 — Row-Level Validation & JSONB Audit Trail Triggers
       ======================================================================== */
    {
      id: 'pg-m07-t04',
      slug: 'row-triggers-audit-invariants',
      moduleId: 'pg-m07',
      title: 'BEFORE Validation Triggers & AFTER JSONB Audit Trail Triggers',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'fintech_ledger',
      clauses: ['CREATE TRIGGER', 'BEFORE UPDATE', 'AFTER INSERT OR UPDATE', 'to_jsonb(OLD)'],
      tags: ['triggers', 'audit-log', 'plpgsql', 'data-governance'],
      guide: {
        mentalModel: 'PostgreSQL row-level triggers fire at two distinct lifecycle points around heap tuple writes: `BEFORE FOR EACH ROW` executes *prior* to writing the tuple to the 8 KB heap page, letting you normalize fields (`NEW.currency := UPPER(...)`), bump optimistic lock versions, reject invalid writes via `RAISE EXCEPTION`, or silently skip a row write by returning `NULL`. `AFTER FOR EACH ROW` queues trigger events until the statement\'s heap modifications complete, guaranteeing `NEW` reflects the final persisted tuple image—ideal for immutable `JSONB` audit logging.\n\nBecause invoking PL/pgSQL per row incurs SPI context-switch overhead on every touched tuple, attach a declarative `WHEN (OLD.col IS DISTINCT FROM NEW.col)` guard on `CREATE TRIGGER` so unchanged updates bypass trigger function execution inside the C executor before PL/pgSQL ever starts.',
        syntaxAnatomy: [
          'CREATE OR REPLACE FUNCTION trg_audit_row() RETURNS TRIGGER LANGUAGE plpgsql AS $$',
          'BEGIN',
          '  INSERT INTO account_audit_log (op, account_id, old_row, new_row)',
          '  VALUES (TG_OP, NEW.account_id, to_jsonb(OLD), to_jsonb(NEW));',
          '  RETURN NEW;',
          'END;',
          '$$;',
          'CREATE TRIGGER after_accounts_audit',
          'AFTER INSERT OR UPDATE ON accounts',
          'FOR EACH ROW EXECUTE FUNCTION trg_audit_row();'
        ].join('\n'),
        internalsAndGotchas: [
          'Returning `NULL` from a `BEFORE FOR EACH ROW` trigger silently cancels the `INSERT` / `UPDATE` / `DELETE` for that row without raising an error! Always `RETURN NEW;` on `INSERT`/`UPDATE` (and `RETURN OLD;` on `DELETE`).',
          'In `INSERT` triggers, `OLD` is unassigned (`NULL`), whereas in `DELETE` triggers `NEW` is unassigned; `to_jsonb(OLD)` safely evaluates to SQL `NULL` during an `INSERT`.',
          'Use PostgreSQL 11+ standard syntax `EXECUTE FUNCTION fn_name()` (preferred over legacy `EXECUTE PROCEDURE`, which misleadingly still calls a `RETURNS TRIGGER` function).'
        ],
        whenToUse: 'Use `BEFORE FOR EACH ROW` triggers to enforce cross-column normalization and optimistic version bumps directly on incoming tuples, and `AFTER FOR EACH ROW` (paired with `WHEN (...)`) to append tamper-evident `to_jsonb(OLD)` / `to_jsonb(NEW)` audit rows.'
      },
      scenario: {
        role: 'Financial Compliance & Ledger Architect',
        incidentOrGoal: 'Downstream services wrote lowercase whitespace-padded currency codes, skipped `version` increments on `accounts`, and lacked a schema-resilient `JSONB` audit log for regulator review.',
        stakeholderNeed: 'Build a `BEFORE` normalization/invariant trigger, an `AFTER INSERT OR UPDATE` `to_jsonb()` audit trigger, and a `WHEN (IS DISTINCT FROM)` delta-only balance trigger.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — BEFORE Row Trigger: Normalization, Guard & Version Bump',
          mission: 'Create or replace `trg_guard_accounts() RETURNS TRIGGER LANGUAGE plpgsql` and attach it as `CREATE TRIGGER before_accounts_guard BEFORE INSERT OR UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION trg_guard_accounts();`. Normalize `NEW.currency := UPPER(BTRIM(NEW.currency))`, raise an exception if `NEW.posted_balance_cents < 0`, and whenever `TG_OP = \'UPDATE\'`, set `NEW.version := OLD.version + 1` before returning `NEW`.',
          setupSql: 'DROP TRIGGER IF EXISTS before_accounts_guard ON accounts; DROP FUNCTION IF EXISTS trg_guard_accounts();',
          probeSql: 'DO $$ BEGIN UPDATE accounts SET posted_balance_cents = -10 WHERE account_id = 103; RAISE EXCEPTION \'expected_negative_guard\'; EXCEPTION WHEN OTHERS THEN IF SQLERRM = \'expected_negative_guard\' THEN RAISE; END IF; END $$; UPDATE accounts SET currency = \' eur \', posted_balance_cents = 420000 WHERE account_id = 101; SELECT account_id, currency, posted_balance_cents, version FROM accounts WHERE account_id IN (101, 103) ORDER BY account_id ASC;',
          starterCode: [
            'CREATE OR REPLACE FUNCTION trg_guard_accounts()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  -- TODO: normalize NEW.currency := UPPER(BTRIM(NEW.currency))',
            '  -- TODO: IF NEW.posted_balance_cents < 0 THEN RAISE EXCEPTION ...',
            '  -- TODO: IF TG_OP = \'UPDATE\' THEN NEW.version := OLD.version + 1; END IF;',
            '  RETURN NEW;',
            'END;',
            '$$;',
            '-- TODO: CREATE TRIGGER before_accounts_guard BEFORE INSERT OR UPDATE ON accounts ...'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION trg_guard_accounts()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  NEW.currency := UPPER(BTRIM(NEW.currency));',
            '  IF NEW.posted_balance_cents < 0 THEN',
            '    RAISE EXCEPTION \'negative balance disallowed: %\', NEW.posted_balance_cents;',
            '  END IF;',
            '  IF TG_OP = \'UPDATE\' THEN',
            '    NEW.version := OLD.version + 1;',
            '  END IF;',
            '  RETURN NEW;',
            'END;',
            '$$;',
            'CREATE TRIGGER before_accounts_guard',
            'BEFORE INSERT OR UPDATE ON accounts',
            'FOR EACH ROW EXECUTE FUNCTION trg_guard_accounts();'
          ].join('\n'),
          hints: [
            'Mutate `NEW.currency := UPPER(BTRIM(NEW.currency));` directly inside the `BEFORE` trigger body.',
            'Guard negative balances with `IF NEW.posted_balance_cents < 0 THEN RAISE EXCEPTION \'...\'; END IF;` and bump `NEW.version := OLD.version + 1;` when `TG_OP = \'UPDATE\'`.',
            'Attach with `CREATE TRIGGER before_accounts_guard BEFORE INSERT OR UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION trg_guard_accounts();`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bRETURNS\\s+TRIGGER\\b', flags: 'i', message: 'Declare the function with `RETURNS TRIGGER`.' },
              { pattern: '\\bBEFORE\\s+INSERT\\s+OR\\s+UPDATE\\b', flags: 'i', message: 'Attach a `BEFORE INSERT OR UPDATE` trigger.' },
              { pattern: '\\bFOR\\s+EACH\\s+ROW\\b', flags: 'i', message: 'Specify `FOR EACH ROW` so `NEW` and `OLD` tuples are accessible.' }
            ]
          },
          solutionExplanation: 'Modifying `NEW` inside a `BEFORE FOR EACH ROW` trigger mutates the in-memory tuple prior to heap insertion, normalizing `\' eur \'` to `\'EUR\'`, bumping `version` (`3 -> 4`), and aborting negative balances.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — AFTER Row Trigger: Schema-Resilient JSONB Audit Log',
          mission: 'Table `account_audit_log(audit_id SERIAL, op TEXT, account_id INTEGER, old_row JSONB, new_row JSONB)` is pre-created in setup. Create `trg_audit_accounts() RETURNS TRIGGER LANGUAGE plpgsql` and attach `CREATE TRIGGER after_accounts_audit AFTER INSERT OR UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION trg_audit_accounts();` to insert `(TG_OP, NEW.account_id, to_jsonb(OLD), to_jsonb(NEW))` into `account_audit_log`.',
          setupSql: 'DROP TRIGGER IF EXISTS after_accounts_audit ON accounts; DROP FUNCTION IF EXISTS trg_audit_accounts(); DROP TABLE IF EXISTS account_audit_log; CREATE TABLE account_audit_log (audit_id SERIAL PRIMARY KEY, op TEXT NOT NULL, account_id INTEGER NOT NULL, old_row JSONB, new_row JSONB);',
          probeSql: 'INSERT INTO accounts VALUES (109, \'Nova Treasury\', \'checking\', \'USD\', 90000, 1); UPDATE accounts SET posted_balance_cents = 95000 WHERE account_id = 109; SELECT audit_id, op, account_id, (old_row->>\'posted_balance_cents\')::bigint AS old_bal, (new_row->>\'posted_balance_cents\')::bigint AS new_bal FROM account_audit_log ORDER BY audit_id ASC;',
          starterCode: [
            'CREATE OR REPLACE FUNCTION trg_audit_accounts()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  -- TODO: INSERT INTO account_audit_log (op, account_id, old_row, new_row)',
            '  --       VALUES (TG_OP, NEW.account_id, to_jsonb(OLD), to_jsonb(NEW));',
            '  RETURN NEW;',
            'END;',
            '$$;',
            '-- TODO: CREATE TRIGGER after_accounts_audit AFTER INSERT OR UPDATE ON accounts ...'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION trg_audit_accounts()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  INSERT INTO account_audit_log (op, account_id, old_row, new_row)',
            '  VALUES (TG_OP, NEW.account_id, to_jsonb(OLD), to_jsonb(NEW));',
            '  RETURN NEW;',
            'END;',
            '$$;',
            'CREATE TRIGGER after_accounts_audit',
            'AFTER INSERT OR UPDATE ON accounts',
            'FOR EACH ROW EXECUTE FUNCTION trg_audit_accounts();'
          ].join('\n'),
          hints: [
            'Serialize whole composite records with `to_jsonb(OLD)` and `to_jsonb(NEW)`—on `INSERT`, `OLD` is `NULL` so `to_jsonb(OLD)` cleanly yields `NULL`.',
            'Insert `(TG_OP, NEW.account_id, to_jsonb(OLD), to_jsonb(NEW))` into `account_audit_log (op, account_id, old_row, new_row)`.',
            'Attach the trigger `AFTER INSERT OR UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION trg_audit_accounts();`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bto_jsonb\\s*\\(', flags: 'i', message: 'Serialize row images with `to_jsonb(OLD)` and `to_jsonb(NEW)`.' },
              { pattern: '\\bAFTER\\s+INSERT\\s+OR\\s+UPDATE\\b', flags: 'i', message: 'Use an `AFTER INSERT OR UPDATE` trigger so final persisted tuples are logged.' }
            ]
          },
          solutionExplanation: '`to_jsonb(OLD)` and `to_jsonb(NEW)` decouple your audit table from future `ALTER TABLE ADD COLUMN` migrations on `accounts`, capturing `NULL -> 90000` on `INSERT` and `90000 -> 95000` on `UPDATE`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Skipping No-Op Trigger Calls with Declarative WHEN (IS DISTINCT FROM)',
          mission: 'Table `balance_delta_log(log_id SERIAL, account_id INTEGER, delta_cents BIGINT)` is pre-created in setup. Create `trg_log_balance_delta() RETURNS TRIGGER LANGUAGE plpgsql` that inserts `(NEW.account_id, NEW.posted_balance_cents - OLD.posted_balance_cents)` into `balance_delta_log`, and attach `after_balance_change_audit` as `AFTER UPDATE ON accounts FOR EACH ROW` gated by `WHEN (OLD.posted_balance_cents IS DISTINCT FROM NEW.posted_balance_cents)` so name-only edits never invoke PL/pgSQL.',
          setupSql: 'DROP TRIGGER IF EXISTS after_balance_change_audit ON accounts; DROP FUNCTION IF EXISTS trg_log_balance_delta(); DROP TABLE IF EXISTS balance_delta_log; CREATE TABLE balance_delta_log (log_id SERIAL PRIMARY KEY, account_id INTEGER NOT NULL, delta_cents BIGINT NOT NULL);',
          probeSql: 'UPDATE accounts SET owner_name = \'Apex Global Corp\' WHERE account_id = 101; UPDATE accounts SET posted_balance_cents = posted_balance_cents + 35000 WHERE account_id = 102; SELECT account_id, delta_cents FROM balance_delta_log ORDER BY log_id ASC;',
          starterCode: [
            'CREATE OR REPLACE FUNCTION trg_log_balance_delta()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  -- TODO: INSERT (NEW.account_id, NEW.posted_balance_cents - OLD.posted_balance_cents) INTO balance_delta_log',
            '  RETURN NEW;',
            'END;',
            '$$;',
            '-- TODO: CREATE TRIGGER after_balance_change_audit AFTER UPDATE ON accounts FOR EACH ROW',
            '--       WHEN (OLD.posted_balance_cents IS DISTINCT FROM NEW.posted_balance_cents) ...'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION trg_log_balance_delta()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  INSERT INTO balance_delta_log (account_id, delta_cents)',
            '  VALUES (NEW.account_id, NEW.posted_balance_cents - OLD.posted_balance_cents);',
            '  RETURN NEW;',
            'END;',
            '$$;',
            'CREATE TRIGGER after_balance_change_audit',
            'AFTER UPDATE ON accounts',
            'FOR EACH ROW',
            'WHEN (OLD.posted_balance_cents IS DISTINCT FROM NEW.posted_balance_cents)',
            'EXECUTE FUNCTION trg_log_balance_delta();'
          ].join('\n'),
          hints: [
            'Inside `trg_log_balance_delta()`, insert `(NEW.account_id, NEW.posted_balance_cents - OLD.posted_balance_cents)` into `balance_delta_log (account_id, delta_cents)`.',
            'Place the `WHEN (OLD.posted_balance_cents IS DISTINCT FROM NEW.posted_balance_cents)` clause directly between `FOR EACH ROW` and `EXECUTE FUNCTION` in `CREATE TRIGGER`.',
            'Using `IS DISTINCT FROM` rather than `<>` remains `NULL`-safe on nullable columns.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bWHEN\\s*\\(', flags: 'i', message: 'Add a declarative `WHEN (...)` filter on `CREATE TRIGGER`.' },
              { pattern: '\\bIS\\s+DISTINCT\\s+FROM\\b', flags: 'i', message: 'Use `IS DISTINCT FROM` inside the trigger `WHEN` condition.' }
            ]
          },
          solutionExplanation: 'Evaluating `WHEN (OLD.posted_balance_cents IS DISTINCT FROM NEW.posted_balance_cents)` inside the C trigger manager skips queueing an `AFTER` trigger event for `account_id = 101`\'s name update, firing solely on `account_id = 102` (`+35000`).'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m07-t05 — Statement Triggers & Transition Tables
       ======================================================================== */
    {
      id: 'pg-m07-t05',
      slug: 'statement-triggers-transition-tables',
      moduleId: 'pg-m07',
      title: 'Statement-Level Triggers with Transition Tables (REFERENCING NEW TABLE)',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'fintech_ledger',
      clauses: ['FOR EACH STATEMENT', 'REFERENCING NEW TABLE AS', 'OLD TABLE AS'],
      tags: ['transition-tables', 'statement-triggers', 'bulk-dml', 'performance'],
      guide: {
        mentalModel: 'When a bulk `UPDATE` or `INSERT` touches 50,000 rows, a `FOR EACH ROW` trigger executes 50,000 individual PL/pgSQL invocations and 50,000 single-row audit `INSERT`s. PostgreSQL 10+ **transition tables** (`REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows` on `AFTER ... FOR EACH STATEMENT`) capture the modified before/after tuples into an in-memory `Tuplestore` (spilling to temp files only if `work_mem` is exceeded) and expose them as ephemeral relations to **one** set-based SQL query.\n\nTransition tables also solve **multi-row conservation invariants** that row-level triggers cannot: during a single `UPDATE` transferring funds from account `101` (`-50000`) to `102` (`+50000`), a row-level check sees half the transfer mid-statement, whereas an `AFTER STATEMENT` trigger sees the complete net delta across `old_rows` and `new_rows`.',
        syntaxAnatomy: [
          'CREATE TRIGGER stmt_accounts_audit',
          'AFTER UPDATE ON accounts',
          'REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows',
          'FOR EACH STATEMENT',
          'EXECUTE FUNCTION trg_bulk_audit();'
        ].join('\n'),
        internalsAndGotchas: [
          'Transition tables (`REFERENCING ... TABLE AS ...`) are supported ONLY on `AFTER` triggers with `FOR EACH STATEMENT`, and you must specify a single event (`AFTER INSERT`, `AFTER UPDATE`, or `AFTER DELETE`—not `AFTER INSERT OR UPDATE` combined in one `CREATE TRIGGER`).',
          'A `FOR EACH STATEMENT` trigger still fires once even when a DML statement affects `0` rows! Guard summary inserts with `HAVING COUNT(*) > 0` or `IF EXISTS (SELECT 1 FROM new_rows)` if empty batches shouldn\'t emit rows.',
          'Statement-level trigger functions always `RETURN NULL;` (their return value is ignored by the executor).'
        ],
        whenToUse: 'Use `AFTER ... REFERENCING NEW TABLE / OLD TABLE ... FOR EACH STATEMENT` for high-throughput bulk audit logging, incrementally maintaining summary rollups, and enforcing cross-row set invariants.'
      },
      scenario: {
        role: 'High-Throughput Payments Engine Staff Engineer',
        incidentOrGoal: 'Per-row audit triggers added 4x latency to batch settlement writes, and finance needs a statement-level zero-sum conservation guard when rebalancing checking pools.',
        stakeholderNeed: 'Replace row-by-row loops with three `FOR EACH STATEMENT` transition-table triggers: batch ingest rollup, set-based bulk update diffing, and multi-row zero-sum pool conservation.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Batch Ingest Rollup via REFERENCING NEW TABLE',
          mission: 'Table `batch_ingest_metrics(batch_id SERIAL, rows_inserted INTEGER, total_cents BIGINT)` is pre-created in setup. Create `trg_rollup_mtxn_batch() RETURNS TRIGGER LANGUAGE plpgsql` and attach `stmt_mtxn_batch_rollup` as `AFTER INSERT ON merchant_txns REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT` to insert `(COUNT(*)::int, SUM(amount_cents)::bigint)` from `new_rows` (`HAVING COUNT(*) > 0`) in one query.',
          setupSql: 'DROP TRIGGER IF EXISTS stmt_mtxn_batch_rollup ON merchant_txns; DROP FUNCTION IF EXISTS trg_rollup_mtxn_batch(); DROP TABLE IF EXISTS batch_ingest_metrics; CREATE TABLE batch_ingest_metrics (batch_id SERIAL PRIMARY KEY, rows_inserted INTEGER NOT NULL, total_cents BIGINT NOT NULL);',
          probeSql: 'INSERT INTO merchant_txns VALUES (10, 401, \'Stripe\', \'7372\', 12000, \'US\', \'2025-03-12 10:00:00\'), (11, 402, \'Fly.io\', \'7372\', 18000, \'US\', \'2025-03-12 10:01:00\'), (12, 401, \'Linear\', \'7372\', 9000, \'US\', \'2025-03-12 10:02:00\'); INSERT INTO merchant_txns SELECT * FROM merchant_txns WHERE false; SELECT batch_id, rows_inserted, total_cents FROM batch_ingest_metrics ORDER BY batch_id ASC;',
          starterCode: [
            'CREATE OR REPLACE FUNCTION trg_rollup_mtxn_batch()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  -- TODO: INSERT INTO batch_ingest_metrics (rows_inserted, total_cents)',
            '  --       SELECT COUNT(*)::int, SUM(amount_cents)::bigint FROM new_rows HAVING COUNT(*) > 0;',
            '  RETURN NULL;',
            'END;',
            '$$;',
            '-- TODO: CREATE TRIGGER stmt_mtxn_batch_rollup AFTER INSERT ON merchant_txns',
            '--       REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT ...'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION trg_rollup_mtxn_batch()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  INSERT INTO batch_ingest_metrics (rows_inserted, total_cents)',
            '  SELECT COUNT(*)::int, SUM(amount_cents)::bigint',
            '  FROM new_rows',
            '  HAVING COUNT(*) > 0;',
            '  RETURN NULL;',
            'END;',
            '$$;',
            'CREATE TRIGGER stmt_mtxn_batch_rollup',
            'AFTER INSERT ON merchant_txns',
            'REFERENCING NEW TABLE AS new_rows',
            'FOR EACH STATEMENT',
            'EXECUTE FUNCTION trg_rollup_mtxn_batch();'
          ].join('\n'),
          hints: [
            'Query the ephemeral transition relation `FROM new_rows` directly inside `INSERT INTO batch_ingest_metrics (rows_inserted, total_cents) SELECT ...`.',
            'Include `HAVING COUNT(*) > 0` so zero-row `INSERT ... SELECT WHERE false` statements do not insert empty metric rows.',
            'Attach with `AFTER INSERT ON merchant_txns REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION trg_rollup_mtxn_batch();`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bREFERENCING\\s+NEW\\s+TABLE\\s+AS\\s+new_rows\\b', flags: 'i', message: 'Expose inserted rows with `REFERENCING NEW TABLE AS new_rows`.' },
              { pattern: '\\bFOR\\s+EACH\\s+STATEMENT\\b', flags: 'i', message: 'Use `FOR EACH STATEMENT` so the trigger runs once per batch.' }
            ]
          },
          solutionExplanation: 'One PL/pgSQL invocation aggregates all 3 inserted card transactions (`39000` cents) from the `new_rows` tuplestore, while `HAVING COUNT(*) > 0` ignores the subsequent 0-row insert.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Set-Based Bulk Diffing Joining OLD TABLE and NEW TABLE',
          mission: 'Table `bulk_balance_audit(account_id INTEGER, old_balance BIGINT, new_balance BIGINT, delta_cents BIGINT)` is pre-created in setup. Create `trg_bulk_audit_accounts() RETURNS TRIGGER LANGUAGE plpgsql` and attach `stmt_accounts_bulk_audit` as `AFTER UPDATE ON accounts REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT`. Join `old_rows o` and `new_rows n` on `account_id` where `o.posted_balance_cents <> n.posted_balance_cents` and insert `(n.account_id, o.posted_balance_cents, n.posted_balance_cents, n.posted_balance_cents - o.posted_balance_cents)` in one `INSERT ... SELECT`.',
          setupSql: 'DROP TRIGGER IF EXISTS stmt_accounts_bulk_audit ON accounts; DROP FUNCTION IF EXISTS trg_bulk_audit_accounts(); DROP TABLE IF EXISTS bulk_balance_audit; CREATE TABLE bulk_balance_audit (account_id INTEGER NOT NULL, old_balance BIGINT NOT NULL, new_balance BIGINT NOT NULL, delta_cents BIGINT NOT NULL);',
          probeSql: 'UPDATE accounts SET posted_balance_cents = posted_balance_cents + 10000 WHERE account_type = \'checking\'; SELECT account_id, old_balance, new_balance, delta_cents FROM bulk_balance_audit ORDER BY account_id ASC;',
          starterCode: [
            'CREATE OR REPLACE FUNCTION trg_bulk_audit_accounts()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  -- TODO: single set-based INSERT INTO bulk_balance_audit SELECT ... FROM old_rows o JOIN new_rows n ...',
            '  RETURN NULL;',
            'END;',
            '$$;',
            '-- TODO: CREATE TRIGGER stmt_accounts_bulk_audit AFTER UPDATE ON accounts',
            '--       REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT ...'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION trg_bulk_audit_accounts()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'BEGIN',
            '  INSERT INTO bulk_balance_audit (account_id, old_balance, new_balance, delta_cents)',
            '  SELECT n.account_id,',
            '         o.posted_balance_cents,',
            '         n.posted_balance_cents,',
            '         n.posted_balance_cents - o.posted_balance_cents',
            '  FROM old_rows o',
            '  JOIN new_rows n ON n.account_id = o.account_id',
            '  WHERE o.posted_balance_cents <> n.posted_balance_cents',
            '  ORDER BY n.account_id ASC;',
            '  RETURN NULL;',
            'END;',
            '$$;',
            'CREATE TRIGGER stmt_accounts_bulk_audit',
            'AFTER UPDATE ON accounts',
            'REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows',
            'FOR EACH STATEMENT',
            'EXECUTE FUNCTION trg_bulk_audit_accounts();'
          ].join('\n'),
          hints: [
            'Declare both transition tables in `REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows` (no comma between them!).',
            'Join `old_rows o JOIN new_rows n ON n.account_id = o.account_id` and filter `WHERE o.posted_balance_cents <> n.posted_balance_cents`.',
            'Insert `(n.account_id, o.posted_balance_cents, n.posted_balance_cents, n.posted_balance_cents - o.posted_balance_cents)` and `RETURN NULL;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bOLD\\s+TABLE\\s+AS\\s+old_rows\\b', flags: 'i', message: 'Reference `OLD TABLE AS old_rows`.' },
              { pattern: '\\bNEW\\s+TABLE\\s+AS\\s+new_rows\\b', flags: 'i', message: 'Reference `NEW TABLE AS new_rows`.' },
              { pattern: '\\bJOIN\\b', flags: 'i', message: 'Join `old_rows` and `new_rows` in a single set-based query.' }
            ]
          },
          solutionExplanation: 'Instead of firing 3 separate row triggers, PostgreSQL materializes the before and after images in memory and executes a single Hash/Merge Join `INSERT ... SELECT` across all modified checking accounts.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Enforcing Cross-Row Zero-Sum Conservation Across Bulk Updates',
          mission: 'Create `trg_conserve_pool() RETURNS TRIGGER LANGUAGE plpgsql` and attach `stmt_conserve_pool` as `AFTER UPDATE ON accounts REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT`. Compute the net balance delta `COALESCE(SUM(new_rows.posted_balance_cents), 0) - COALESCE(SUM(old_rows.posted_balance_cents), 0)`; if it does not equal `0`, `RAISE EXCEPTION` to abort any non-zero-sum multi-account rebalance.',
          setupSql: 'DROP TRIGGER IF EXISTS stmt_conserve_pool ON accounts; DROP FUNCTION IF EXISTS trg_conserve_pool();',
          probeSql: 'DO $$ BEGIN UPDATE accounts SET posted_balance_cents = posted_balance_cents + 5000 WHERE account_id = 101; RAISE EXCEPTION \'expected_conservation_error\'; EXCEPTION WHEN OTHERS THEN IF SQLERRM = \'expected_conservation_error\' THEN RAISE; END IF; END $$; UPDATE accounts SET posted_balance_cents = CASE account_id WHEN 101 THEN posted_balance_cents - 50000 WHEN 102 THEN posted_balance_cents + 50000 END WHERE account_id IN (101, 102); SELECT account_id, posted_balance_cents FROM accounts WHERE account_id IN (101, 102) ORDER BY account_id ASC;',
          starterCode: [
            'CREATE OR REPLACE FUNCTION trg_conserve_pool()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'DECLARE',
            '  v_net_delta BIGINT;',
            'BEGIN',
            '  -- TODO: compute net sum difference between new_rows and old_rows',
            '  -- TODO: IF v_net_delta <> 0 THEN RAISE EXCEPTION ...',
            '  RETURN NULL;',
            'END;',
            '$$;',
            '-- TODO: CREATE TRIGGER stmt_conserve_pool AFTER UPDATE ON accounts ...'
          ].join('\n'),
          solutionCode: [
            'CREATE OR REPLACE FUNCTION trg_conserve_pool()',
            'RETURNS TRIGGER LANGUAGE plpgsql AS $$',
            'DECLARE',
            '  v_net_delta BIGINT;',
            'BEGIN',
            '  SELECT COALESCE((SELECT SUM(posted_balance_cents) FROM new_rows), 0)',
            '       - COALESCE((SELECT SUM(posted_balance_cents) FROM old_rows), 0)',
            '    INTO v_net_delta;',
            '',
            '  IF v_net_delta <> 0 THEN',
            '    RAISE EXCEPTION \'zero-sum conservation violated: net delta %\', v_net_delta;',
            '  END IF;',
            '  RETURN NULL;',
            'END;',
            '$$;',
            'CREATE TRIGGER stmt_conserve_pool',
            'AFTER UPDATE ON accounts',
            'REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows',
            'FOR EACH STATEMENT',
            'EXECUTE FUNCTION trg_conserve_pool();'
          ].join('\n'),
          hints: [
            'Compute `COALESCE((SELECT SUM(posted_balance_cents) FROM new_rows), 0) - COALESCE((SELECT SUM(posted_balance_cents) FROM old_rows), 0)` into `v_net_delta`.',
            'Raise an exception (`IF v_net_delta <> 0 THEN RAISE EXCEPTION ...; END IF;`) whenever money is created or destroyed.',
            'Attach with `REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bRAISE\\s+EXCEPTION\\b', flags: 'i', message: 'Abort unbalanced updates with `RAISE EXCEPTION`.' },
              { pattern: '\\bFOR\\s+EACH\\s+STATEMENT\\b', flags: 'i', message: 'Enforce the cross-row invariant in a `FOR EACH STATEMENT` trigger.' }
            ]
          },
          solutionExplanation: 'Statement-level transition tables evaluate the invariant *after* both `101` (`-50000`) and `102` (`+50000`) have updated (`v_net_delta = 0`), whereas the uncompensated `+5000` single-account write raises an exception and rolls back.'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m07-t06 — Declarative Partitioning & Partition Pruning
       ======================================================================== */
    {
      id: 'pg-m07-t06',
      slug: 'declarative-partitioning-pruning',
      moduleId: 'pg-m07',
      title: 'Declarative Partitioning (RANGE / LIST / HASH) & Partition Pruning',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['PARTITION BY RANGE', 'PARTITION BY LIST', 'PARTITION OF', 'tableoid::regclass'],
      tags: ['partitioning', 'partition-pruning', 'time-series', 'explain'],
      guide: {
        mentalModel: 'In PostgreSQL\'s declarative partitioning architecture, the parent table (`relkind = \'p\'` in `pg_class`) holds **zero physical 8 KB heap pages**—every tuple lives inside a leaf child partition (`relkind = \'r\'`), discoverable at query time via the hidden system column `tableoid::regclass`. PostgreSQL supports three routing strategies: `RANGE` (half-open `[FROM, TO)` time/ID windows), `LIST` (discrete tenant/region sets), and `HASH` (modular even bucketing).\n\nPartitioning improves performance only when queries trigger **compile-time or run-time partition pruning** (`enable_partition_pruning = on`), eliminating irrelevant child scans from the `Append` plan. Wrapping the partition key in a non-sargable expression (`EXTRACT(MONTH FROM recorded_at) = 2`) defeats pruning and forces PostgreSQL to scan every historical child partition.',
        syntaxAnatomy: [
          'CREATE TABLE telemetry_partitioned (',
          '  sample_id BIGINT NOT NULL,',
          '  recorded_at TIMESTAMPTZ NOT NULL,',
          '  PRIMARY KEY (sample_id, recorded_at) -- Partition key MUST be in every UNIQUE/PK!',
          ') PARTITION BY RANGE (recorded_at);',
          '',
          'CREATE TABLE telemetry_2025_04 PARTITION OF telemetry_partitioned',
          '  FOR VALUES FROM (\'2025-04-01 00:00:00+00\') TO (\'2025-05-01 00:00:00+00\');'
        ].join('\n'),
        internalsAndGotchas: [
          'Every `PRIMARY KEY` or `UNIQUE` index on a partitioned table **must include all partition key columns** (`PRIMARY KEY (sample_id, recorded_at)`), because PostgreSQL enforces uniqueness locally per leaf B-Tree rather than via a single global cross-partition index.',
          '`FOR VALUES FROM (a) TO (b)` bounds in `PARTITION BY RANGE` are strictly **inclusive at the lower bound `[a` and exclusive at the upper bound `b)`**.',
          'Inserting a row whose key matches no child partition raises an error unless a catch-all `PARTITION OF parent DEFAULT` exists.'
        ],
        whenToUse: 'Use `PARTITION BY RANGE` on append-heavy time-series logs to keep working-set B-Trees inside `shared_buffers` and unlock instant retention drops, and `PARTITION BY LIST` to isolate regional or large-tenant workloads.'
      },
      scenario: {
        role: 'Observability Storage Architect',
        incidentOrGoal: 'Dashboard queries on `telemetry_partitioned` scanned all three monthly partitions due to `EXTRACT()` filters, and SRE needs regional list-partitioned alert storage.',
        stakeholderNeed: 'Audit physical child distribution via `tableoid::regclass`, rewrite a dashboard scan to trigger February-only partition pruning, and build a `PARTITION BY LIST (region)` table with a `DEFAULT` partition.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Inspect Physical Leaf Partition Routing via tableoid::regclass',
          mission: 'Query the partitioned parent `telemetry_partitioned` and group by `tableoid::regclass::text AS child_partition`. Project 4 columns in exact order: `child_partition`, `sample_count` (`COUNT(*)::int`), `avg_cpu_pct` (`ROUND(AVG(cpu_pct), 2)`), and `max_mem_mb` (`MAX(mem_used_mb)`). Sort by `child_partition ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Reveal which physical leaf partition stores each group of telemetry samples',
            'SELECT \'todo\' AS child_partition, -- TODO: use tableoid::regclass::text',
            '       COUNT(*)::int AS sample_count',
            '       -- TODO: add ROUND(AVG(cpu_pct), 2) AS avg_cpu_pct and MAX(mem_used_mb) AS max_mem_mb',
            'FROM telemetry_partitioned',
            'GROUP BY 1',
            'ORDER BY child_partition ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT tableoid::regclass::text AS child_partition,',
            '       COUNT(*)::int AS sample_count,',
            '       ROUND(AVG(cpu_pct), 2) AS avg_cpu_pct,',
            '       MAX(mem_used_mb) AS max_mem_mb',
            'FROM telemetry_partitioned',
            'GROUP BY tableoid::regclass::text',
            'ORDER BY child_partition ASC;'
          ].join('\n'),
          hints: [
            'Every PostgreSQL heap tuple exposes `tableoid` (the `pg_class.oid` of the physical leaf relation storing it); casting `tableoid::regclass::text` formats its table name.',
            'Compute `COUNT(*)::int AS sample_count`, `ROUND(AVG(cpu_pct), 2) AS avg_cpu_pct`, and `MAX(mem_used_mb) AS max_mem_mb`.',
            'Group by `tableoid::regclass::text` and sort by `child_partition ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\btableoid\\s*::\\s*regclass\\b', flags: 'i', message: 'Use `tableoid::regclass` to inspect the physical leaf partition.' },
              { pattern: '\\bFROM\\s+telemetry_partitioned\\b', flags: 'i', message: 'Query the partitioned parent `telemetry_partitioned`.' }
            ]
          },
          solutionExplanation: 'Even though the query targets `telemetry_partitioned`, `tableoid::regclass::text` proves rows physically reside inside `telemetry_2025_01` (3 rows), `telemetry_2025_02` (4 rows), and `telemetry_2025_03` (5 rows).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Sargable Half-Open Range Filter for EXPLAIN Partition Pruning',
          mission: 'The starter query uses `EXTRACT(...)` on `recorded_at`, forcing PostgreSQL to scan all 3 partitions. Rewrite it against `telemetry_partitioned` using a half-open `[2025-02-01 00:00:00+00, 2025-03-01 00:00:00+00)` `TIMESTAMPTZ` range predicate and `cpu_pct >= 60` so the planner prunes `telemetry_2025_01` and `telemetry_2025_03`. Project `sample_id, host_name, region, cpu_pct, recorded_at` ordered by `sample_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Fix the non-prunable EXTRACT() filter so EXPLAIN scans ONLY telemetry_2025_02',
            'SELECT sample_id, host_name, region, cpu_pct, recorded_at',
            'FROM telemetry_partitioned',
            'WHERE EXTRACT(YEAR FROM recorded_at AT TIME ZONE \'UTC\') = 2025',
            '  AND EXTRACT(MONTH FROM recorded_at AT TIME ZONE \'UTC\') = 2',
            '  AND cpu_pct >= 999 -- TODO: replace EXTRACT with >= / < bounds and cpu_pct >= 60',
            'ORDER BY sample_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT sample_id, host_name, region, cpu_pct, recorded_at',
            'FROM telemetry_partitioned',
            'WHERE recorded_at >= TIMESTAMPTZ \'2025-02-01 00:00:00+00\'',
            '  AND recorded_at < TIMESTAMPTZ \'2025-03-01 00:00:00+00\'',
            '  AND cpu_pct >= 60',
            'ORDER BY sample_id ASC;'
          ].join('\n'),
          hints: [
            'Remove `EXTRACT(...)` completely; PostgreSQL\'s partition pruner compares bare `recorded_at` operators (`>=`, `<`) directly against partition bounds.',
            'Filter `recorded_at >= \'2025-02-01 00:00:00+00\' AND recorded_at < \'2025-03-01 00:00:00+00\'` along with `AND cpu_pct >= 60`.',
            'Keep `FROM telemetry_partitioned` (do not hardcode the child partition name) and `ORDER BY sample_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'telemetry_2025_02',
            requiredPatterns: [
              { pattern: '\\bFROM\\s+telemetry_partitioned\\b', flags: 'i', message: 'Query the parent `telemetry_partitioned` so the planner performs partition pruning.' },
              { pattern: 'recorded_at\\s*>=', flags: 'i', message: 'Use a sargable `recorded_at >= ...` lower bound.' },
              { pattern: 'recorded_at\\s*<', flags: 'i', message: 'Use a half-open `recorded_at < ...` upper bound.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\b(?:EXTRACT|DATE_PART)\\s*\\(', flags: 'i', message: 'Remove `EXTRACT()` / `DATE_PART()` on `recorded_at` so compile-time partition pruning fires.' },
              { pattern: '\\btelemetry_2025_01\\b|\\btelemetry_2025_02\\b|\\btelemetry_2025_03\\b', flags: 'i', message: 'Query `telemetry_partitioned` rather than referencing child partitions directly.' }
            ]
          },
          solutionExplanation: 'Comparing bare `recorded_at` against `[2025-02-01, 2025-03-01)` matches the range constraint of `telemetry_2025_02` at plan time, pruning January and March leaf relations from the `EXPLAIN` plan entirely.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Declarative PARTITION BY LIST with Composite PK & DEFAULT Catch-All',
          mission: 'Create a list-partitioned table `regional_alerts (alert_id BIGINT NOT NULL, host_name TEXT NOT NULL, region TEXT NOT NULL, cpu_pct NUMERIC(5,2) NOT NULL, PRIMARY KEY (alert_id, region)) PARTITION BY LIST (region)`. Create 3 partitions: `regional_alerts_amer FOR VALUES IN (\'us-east-1\', \'us-west-2\')`, `regional_alerts_emea FOR VALUES IN (\'eu-west-1\')`, and `regional_alerts_default DEFAULT`. Then insert all rows from `telemetry_partitioned WHERE cpu_pct >= 75` (`sample_id, host_name, region, cpu_pct`) plus one synthetic APAC row `(99, \'pg-edge-sg\', \'ap-southeast-1\', 91.20)`.',
          setupSql: 'DROP TABLE IF EXISTS regional_alerts CASCADE;',
          probeSql: 'SELECT alert_id, host_name, region, cpu_pct, tableoid::regclass::text AS leaf_partition FROM regional_alerts ORDER BY alert_id ASC;',
          starterCode: [
            '-- 1. CREATE TABLE regional_alerts (...) PARTITION BY LIST (region);',
            '-- 2. Create partitions regional_alerts_amer, regional_alerts_emea, and regional_alerts_default DEFAULT',
            '-- 3. INSERT high-CPU rows (cpu_pct >= 75) from telemetry_partitioned + (99, \'pg-edge-sg\', \'ap-southeast-1\', 91.20)',
            'CREATE TABLE regional_alerts (',
            '  alert_id BIGINT NOT NULL,',
            '  host_name TEXT NOT NULL,',
            '  region TEXT NOT NULL,',
            '  cpu_pct NUMERIC(5,2) NOT NULL,',
            '  PRIMARY KEY (alert_id, region)',
            ') PARTITION BY LIST (region);'
          ].join('\n'),
          solutionCode: [
            'CREATE TABLE regional_alerts (',
            '  alert_id BIGINT NOT NULL,',
            '  host_name TEXT NOT NULL,',
            '  region TEXT NOT NULL,',
            '  cpu_pct NUMERIC(5,2) NOT NULL,',
            '  PRIMARY KEY (alert_id, region)',
            ') PARTITION BY LIST (region);',
            '',
            'CREATE TABLE regional_alerts_amer PARTITION OF regional_alerts',
            '  FOR VALUES IN (\'us-east-1\', \'us-west-2\');',
            'CREATE TABLE regional_alerts_emea PARTITION OF regional_alerts',
            '  FOR VALUES IN (\'eu-west-1\');',
            'CREATE TABLE regional_alerts_default PARTITION OF regional_alerts',
            '  DEFAULT;',
            '',
            'INSERT INTO regional_alerts (alert_id, host_name, region, cpu_pct)',
            'SELECT sample_id, host_name, region, cpu_pct',
            'FROM telemetry_partitioned',
            'WHERE cpu_pct >= 75;',
            '',
            'INSERT INTO regional_alerts VALUES (99, \'pg-edge-sg\', \'ap-southeast-1\', 91.20);'
          ].join('\n'),
          hints: [
            'Notice `PRIMARY KEY (alert_id, region)` includes the list partition key `region`, satisfying PostgreSQL\'s cross-partition uniqueness rule.',
            'Define the three child tables using `PARTITION OF regional_alerts FOR VALUES IN (...)` and `PARTITION OF regional_alerts DEFAULT;`.',
            'Run `INSERT INTO regional_alerts SELECT sample_id, host_name, region, cpu_pct FROM telemetry_partitioned WHERE cpu_pct >= 75;` followed by `INSERT INTO regional_alerts VALUES (99, \'pg-edge-sg\', \'ap-southeast-1\', 91.20);`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bPARTITION\\s+BY\\s+LIST\\s*\\(\\s*region\\s*\\)', flags: 'i', message: 'Declare `PARTITION BY LIST (region)`.' },
              { pattern: '\\bFOR\\s+VALUES\\s+IN\\b', flags: 'i', message: 'Define list bounds with `FOR VALUES IN (...)`.' },
              { pattern: '\\bDEFAULT\\b', flags: 'i', message: 'Include a `DEFAULT` partition to catch unmapped regions.' }
            ]
          },
          solutionExplanation: 'PostgreSQL routes US alerts into `regional_alerts_amer`, EU alerts into `regional_alerts_emea`, and unmapped `\'ap-southeast-1\'` safely into `regional_alerts_default` instead of failing the batch.'
        }
      ]
    },

    /* ========================================================================
       LAB 07: pg-m07-t07 — Zero-Bloat Partition Lifecycle: ATTACH & DETACH
       ======================================================================== */
    {
      id: 'pg-m07-t07',
      slug: 'partition-lifecycle-attach-detach',
      moduleId: 'pg-m07',
      title: 'Zero-Bloat Retention: ALTER TABLE ATTACH & DETACH PARTITION',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['ATTACH PARTITION', 'DETACH PARTITION', 'LIKE ... INCLUDING ALL', 'pg_inherits'],
      tags: ['partitioning', 'retention', 'attach-partition', 'detach-partition', 'bloat-prevention'],
      guide: {
        mentalModel: 'Running `DELETE FROM telemetry WHERE recorded_at < now() - interval \'90 days\'` on a 500M-row heap is an anti-pattern in PostgreSQL: it writes gigabytes of WAL, dirties millions of 8 KB buffers, leaves dead tuple pointers bloating heap and B-Tree pages, and triggers hours of aggressive autovacuum I/O. Declarative partition lifecycle management replaces row-by-row deletion with metadata catalog surgery: `ALTER TABLE parent DETACH PARTITION old_child` (optionally `CONCURRENTLY` in production outside a transaction block) unlinks the child from `pg_inherits` in milliseconds, allowing cold export or instant `DROP TABLE` file unlinking with **zero dead tuples**.\n\nIn the reverse direction, `ALTER TABLE parent ATTACH PARTITION staging_tbl FOR VALUES ...` onboards pre-populated, pre-indexed tables under a lightweight `ShareUpdateExclusiveLock` on the parent—avoiding `AccessExclusiveLock` outages entirely when you pre-create a matching `CHECK` constraint on the staging table first.',
        syntaxAnatomy: [
          '-- Pre-add matching CHECK so ATTACH skips full-heap validation scan',
          'ALTER TABLE telemetry_archive_2024_12',
          '  ADD CONSTRAINT chk_2024_12 CHECK (',
          '    recorded_at >= \'2024-12-01 00:00:00+00\' AND recorded_at < \'2025-01-01 00:00:00+00\'',
          '  );',
          'ALTER TABLE telemetry_partitioned',
          '  ATTACH PARTITION telemetry_archive_2024_12',
          '  FOR VALUES FROM (\'2024-12-01 00:00:00+00\') TO (\'2025-01-01 00:00:00+00\');',
          '',
          '-- Instant zero-bloat retention retirement',
          'ALTER TABLE telemetry_partitioned DETACH PARTITION telemetry_2025_01;'
        ].join('\n'),
        internalsAndGotchas: [
          'Without a pre-existing validated `CHECK` constraint proving every row in the table satisfies `[FROM, TO)`, `ATTACH PARTITION` must sequentially scan the entire standalone table to verify partition bounds.',
          '`CREATE TABLE child_staging (LIKE parent INCLUDING DEFAULTS INCLUDING CONSTRAINTS)` clones exact column definitions, `NOT NULL` rules, and composite primary keys so `ATTACH PARTITION` never fails on schema mismatch.',
          '`DETACH PARTITION CONCURRENTLY` avoids `AccessExclusiveLock` on the parent in live clusters using a two-transaction catalog wait, though like `CREATE INDEX CONCURRENTLY` it cannot execute inside an explicit `BEGIN ... COMMIT` block.'
        ],
        whenToUse: 'Use `ATTACH PARTITION` to bulk-load and index new time windows offline before exposing them to readers, and use `DETACH PARTITION` + archive/`DROP TABLE` instead of bulk `DELETE` for time-series retention.'
      },
      scenario: {
        role: 'Principal Time-Series DBRE',
        incidentOrGoal: 'Monthly `DELETE` retention jobs saturated WAL disks and bloated B-Trees on `telemetry_partitioned`, while Ops also needs to onboard `telemetry_archive_2024_12` and stage April 2025.',
        stakeholderNeed: 'Pre-constrain and `ATTACH` the December 2024 archive table, bulk-stage and `ATTACH` April 2025 via `LIKE ... INCLUDING ALL`, and retire `telemetry_2025_01` cleanly with `DETACH PARTITION`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Pre-Validating CHECK Bounds & Onboarding via ATTACH PARTITION',
          mission: 'Standalone table `telemetry_archive_2024_12` already holds 2 December 2024 rows in `pg_ops`. Add a `CHECK` constraint (`recorded_at >= TIMESTAMPTZ \'2024-12-01 00:00:00+00\' AND recorded_at < TIMESTAMPTZ \'2025-01-01 00:00:00+00\'`) to `telemetry_archive_2024_12`, then attach it to `telemetry_partitioned` for `[2024-12-01 00:00:00+00, 2025-01-01 00:00:00+00)` using `ALTER TABLE ... ATTACH PARTITION`.',
          setupSql: '',
          probeSql: 'SELECT tableoid::regclass::text AS child_partition, COUNT(*)::int AS sample_count, MIN(recorded_at) AS min_ts FROM telemetry_partitioned GROUP BY tableoid::regclass::text ORDER BY min_ts ASC;',
          starterCode: [
            '-- 1. Add matching CHECK constraint on standalone telemetry_archive_2024_12',
            '-- 2. ALTER TABLE telemetry_partitioned ATTACH PARTITION telemetry_archive_2024_12 FOR VALUES FROM ... TO ...',
            'ALTER TABLE telemetry_archive_2024_12',
            '  ADD CONSTRAINT chk_dec_2024_bounds CHECK (',
            '    recorded_at >= TIMESTAMPTZ \'2024-12-01 00:00:00+00\'',
            '    AND recorded_at < TIMESTAMPTZ \'2025-01-01 00:00:00+00\'',
            '  );',
            '-- TODO: ATTACH PARTITION telemetry_archive_2024_12 to telemetry_partitioned'
          ].join('\n'),
          solutionCode: [
            'ALTER TABLE telemetry_archive_2024_12',
            '  ADD CONSTRAINT chk_dec_2024_bounds CHECK (',
            '    recorded_at >= TIMESTAMPTZ \'2024-12-01 00:00:00+00\'',
            '    AND recorded_at < TIMESTAMPTZ \'2025-01-01 00:00:00+00\'',
            '  );',
            'ALTER TABLE telemetry_partitioned',
            '  ATTACH PARTITION telemetry_archive_2024_12',
            '  FOR VALUES FROM (\'2024-12-01 00:00:00+00\') TO (\'2025-01-01 00:00:00+00\');'
          ].join('\n'),
          hints: [
            'Keep the `ALTER TABLE telemetry_archive_2024_12 ADD CONSTRAINT ... CHECK (...)` statement so PostgreSQL knows its bounds already match `[2024-12-01, 2025-01-01)`.',
            'Follow it with `ALTER TABLE telemetry_partitioned ATTACH PARTITION telemetry_archive_2024_12 FOR VALUES FROM (\'2024-12-01 00:00:00+00\') TO (\'2025-01-01 00:00:00+00\');`.',
            'Once attached, queries on `telemetry_partitioned` automatically include `sample_id` `901` and `902`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bADD\\s+CONSTRAINT\\b[\\s\\S]*\\bCHECK\\s*\\(', flags: 'i', message: 'Pre-create a `CHECK` constraint on `telemetry_archive_2024_12` before attaching.' },
              { pattern: '\\bATTACH\\s+PARTITION\\s+telemetry_archive_2024_12\\b', flags: 'i', message: 'Attach `telemetry_archive_2024_12` with `ALTER TABLE telemetry_partitioned ATTACH PARTITION`.' }
            ]
          },
          solutionExplanation: 'Because `chk_dec_2024_bounds` already proves every tuple falls inside `[2024-12-01, 2025-01-01)`, `ATTACH PARTITION` skips an expensive heap verification scan while taking only `ShareUpdateExclusiveLock` on `telemetry_partitioned`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Offline Staging with LIKE ... INCLUDING ALL & ATTACH PARTITION',
          mission: 'Create a standalone table `telemetry_2025_04 (LIKE telemetry_partitioned INCLUDING ALL)`, bulk-insert two rows `(13, \'pg-prim-01\', \'us-east-1\', 52.40, 27100, \'2025-04-05 12:00:00+00\')` and `(14, \'pg-anl-01\', \'us-west-2\', 74.10, 58900, \'2025-04-19 06:30:00+00\')` directly into `telemetry_2025_04`, and then attach `telemetry_2025_04` to `telemetry_partitioned` for `[\'2025-04-01 00:00:00+00\', \'2025-05-01 00:00:00+00\')`.',
          setupSql: 'DROP TABLE IF EXISTS telemetry_2025_04 CASCADE;',
          probeSql: 'SELECT sample_id, host_name, region, cpu_pct, tableoid::regclass::text AS leaf_partition FROM telemetry_partitioned WHERE recorded_at >= \'2025-04-01 00:00:00+00\' ORDER BY sample_id ASC;',
          starterCode: [
            '-- 1. Clone schema & PK index offline with CREATE TABLE telemetry_2025_04 (LIKE telemetry_partitioned INCLUDING ALL);',
            '-- 2. INSERT the two April 2025 rows into telemetry_2025_04',
            '-- 3. ATTACH PARTITION telemetry_2025_04 to telemetry_partitioned',
            'CREATE TABLE telemetry_2025_04 (LIKE telemetry_partitioned INCLUDING ALL);'
          ].join('\n'),
          solutionCode: [
            'CREATE TABLE telemetry_2025_04 (LIKE telemetry_partitioned INCLUDING ALL);',
            '',
            'INSERT INTO telemetry_2025_04 VALUES',
            '  (13, \'pg-prim-01\', \'us-east-1\', 52.40, 27100, \'2025-04-05 12:00:00+00\'),',
            '  (14, \'pg-anl-01\', \'us-west-2\', 74.10, 58900, \'2025-04-19 06:30:00+00\');',
            '',
            'ALTER TABLE telemetry_partitioned',
            '  ATTACH PARTITION telemetry_2025_04',
            '  FOR VALUES FROM (\'2025-04-01 00:00:00+00\') TO (\'2025-05-01 00:00:00+00\');'
          ].join('\n'),
          hints: [
            '`LIKE telemetry_partitioned INCLUDING ALL` copies columns, `NOT NULL` constraints, defaults, and the `(sample_id, recorded_at)` primary key index automatically.',
            'Insert rows `13` and `14` directly into `telemetry_2025_04` while it is still an unattached standalone table.',
            'Attach it via `ALTER TABLE telemetry_partitioned ATTACH PARTITION telemetry_2025_04 FOR VALUES FROM (\'2025-04-01 00:00:00+00\') TO (\'2025-05-01 00:00:00+00\');`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bLIKE\\s+telemetry_partitioned\\s+INCLUDING\\b', flags: 'i', message: 'Clone the parent layout using `LIKE telemetry_partitioned INCLUDING ALL`.' },
              { pattern: '\\bATTACH\\s+PARTITION\\s+telemetry_2025_04\\b', flags: 'i', message: 'Attach `telemetry_2025_04` onto `telemetry_partitioned`.' }
            ]
          },
          solutionExplanation: 'Staging rows and building indexes inside a standalone `LIKE ... INCLUDING ALL` table avoids touching the live partitioned parent during ingestion, exposing all April rows atomically upon `ATTACH PARTITION`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Zero-Bloat Window Retirement via DETACH PARTITION',
          mission: 'Retire the oldest active monthly window `telemetry_2025_01` from `telemetry_partitioned` without deleting its rows by executing `ALTER TABLE telemetry_partitioned DETACH PARTITION telemetry_2025_01;`, then query `pg_inherits` joined to `pg_class` (`i.inhrelid = c.oid` where `i.inhparent = \'telemetry_partitioned\'::regclass`) to project `c.relname AS remaining_partition` and `(SELECT COUNT(*)::int FROM telemetry_2025_01) AS archived_jan_rows`, ordered by `remaining_partition ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- 1. Detach telemetry_2025_01 from telemetry_partitioned (zero dead tuples!)',
            '-- 2. List remaining attached partitions from pg_inherits + pg_class alongside archived_jan_rows',
            'SELECT c.relname AS remaining_partition,',
            '       (SELECT COUNT(*)::int FROM telemetry_2025_01) AS archived_jan_rows',
            'FROM pg_inherits i',
            'JOIN pg_class c ON c.oid = i.inhrelid',
            'WHERE i.inhparent = \'telemetry_partitioned\'::regclass',
            'ORDER BY remaining_partition ASC;'
          ].join('\n'),
          solutionCode: [
            'ALTER TABLE telemetry_partitioned DETACH PARTITION telemetry_2025_01;',
            '',
            'SELECT c.relname AS remaining_partition,',
            '       (SELECT COUNT(*)::int FROM telemetry_2025_01) AS archived_jan_rows',
            'FROM pg_inherits i',
            'JOIN pg_class c ON c.oid = i.inhrelid',
            'WHERE i.inhparent = \'telemetry_partitioned\'::regclass',
            'ORDER BY remaining_partition ASC;'
          ].join('\n'),
          hints: [
            'Prepend `ALTER TABLE telemetry_partitioned DETACH PARTITION telemetry_2025_01;` before the catalog inspection `SELECT`.',
            'Do NOT `DROP` or `DELETE FROM telemetry_2025_01`—detaching unlinks it from `pg_inherits` while keeping its 3 rows intact as a standalone archive table.',
            'Keep the `pg_inherits` + `pg_class` query sorted by `remaining_partition ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bDETACH\\s+PARTITION\\s+telemetry_2025_01\\b', flags: 'i', message: 'Unlink `telemetry_2025_01` using `ALTER TABLE telemetry_partitioned DETACH PARTITION telemetry_2025_01`.' },
              { pattern: '\\bpg_inherits\\b', flags: 'i', message: 'Verify remaining child partitions via `pg_inherits`.' }
            ]
          },
          solutionExplanation: '`DETACH PARTITION` removes the inheritance catalog link in `pg_inherits` (`telemetry_2025_02` and `telemetry_2025_03` remain attached) while preserving all 3 January rows in standalone `telemetry_2025_01` with zero MVCC dead-tuple bloat.'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m07-t08 — Least-Privilege Roles & Row-Level Security (RLS)
       ======================================================================== */
    {
      id: 'pg-m07-t08',
      slug: 'roles-grants-row-level-security',
      moduleId: 'pg-m07',
      title: 'Least-Privilege Roles & Multi-Tenant Row-Level Security (RLS)',
      difficulty: 'Staff',
      estimatedMinutes: 20,
      datasetId: 'pg_ops_telemetry',
      clauses: ['ENABLE ROW LEVEL SECURITY', 'FORCE ROW LEVEL SECURITY', 'CREATE POLICY', 'current_setting'],
      tags: ['rls', 'row-level-security', 'multi-tenant', 'security', 'roles'],
      guide: {
        mentalModel: 'Relying solely on application ORMs to append `WHERE tenant_id = $1` leaves one missed join or raw reporting query away from a cross-tenant data breach. PostgreSQL **Row-Level Security (`RLS`)** enforces row isolation inside the query rewriter itself, injecting policy predicates onto every scan (`USING (...)` filters visible existing tuples for `SELECT`/`UPDATE`/`DELETE`) and every mutation (`WITH CHECK (...)` validates newly written `INSERT`/`UPDATE` tuples).\n\nThree production sharp edges separate Staff engineers from incidents: (1) enabling RLS without policies is **default-deny** (`0` rows visible); (2) **superusers and roles with `BYPASSRLS` always bypass RLS**, and **table owners bypass RLS unless `FORCE ROW LEVEL SECURITY` is enabled**; (3) always read session context via the two-argument `current_setting(\'app.tenant_id\', true)` (`missing_ok = true`) paired with transaction-scoped `SET LOCAL app.tenant_id = \'acme\'` so PgBouncer transaction pooling never leaks tenant state across connections.',
        syntaxAnatomy: [
          'ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;',
          'ALTER TABLE tenant_invoices FORCE ROW LEVEL SECURITY;',
          '',
          'CREATE POLICY tenant_isolation ON tenant_invoices',
          '  FOR ALL',
          '  TO app_tenant_user',
          '  USING (tenant_id = current_setting(\'app.tenant_id\', true))',
          '  WITH CHECK (tenant_id = current_setting(\'app.tenant_id\', true));'
        ].join('\n'),
        internalsAndGotchas: [
          'Two-argument `current_setting(\'app.tenant_id\', true)` returns `NULL` instead of throwing `unrecognized configuration parameter` when unset; because `tenant_id = NULL` evaluates to `UNKNOWN`, unset connections fail closed (`0` rows returned).',
          'Multiple `PERMISSIVE` policies (the default) combine via `OR`, whereas `AS RESTRICTIVE` policies combine via `AND` across every permissive policy—use `AS RESTRICTIVE` for non-negotiable compliance guards (e.g. immutable paid invoices).',
          '`SECURITY DEFINER` views and functions execute with the privileges/RLS posture of their *owner*, unless the view uses PostgreSQL 15+ `WITH (security_invoker = true)`.'
        ],
        whenToUse: 'Use `ENABLE` + `FORCE ROW LEVEL SECURITY` with `SET LOCAL` custom GUC policies (`app.tenant_id`) on shared-schema multi-tenant SaaS tables to guarantee defense-in-depth tenant isolation at the storage engine layer.'
      },
      scenario: {
        role: 'Staff Security & Multi-Tenant Database Architect',
        incidentOrGoal: 'A reporting endpoint omitted `WHERE tenant_id = ...` on `tenant_invoices`, exposing cross-tenant billing records across `acme`, `globex`, `initech`, and `umbraco`.',
        stakeholderNeed: 'Lock down `tenant_invoices` for `app_tenant_user` with fail-closed `SELECT` RLS, add `WITH CHECK` anti-spoofing write isolation, and layer an `AS RESTRICTIVE` immutability guard alongside `app_billing_auditor` read access.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Fail-Closed Multi-Tenant Read Isolation (ENABLE + FORCE RLS)',
          mission: 'Role `app_tenant_user` is pre-created with `SELECT` access on `tenant_invoices`. Enable Row-Level Security on `tenant_invoices`, apply `FORCE ROW LEVEL SECURITY`, and create policy `tenant_select_policy ON tenant_invoices FOR SELECT` with `USING (tenant_id = current_setting(\'app.tenant_id\', true))` so unset sessions see `0` rows and `SET LOCAL app.tenant_id = \'acme\'` sees only `acme`\'s 3 invoices.',
          setupSql: 'DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = \'app_tenant_user\') THEN CREATE ROLE app_tenant_user NOLOGIN; END IF; END $$; GRANT USAGE ON SCHEMA pg_ops TO app_tenant_user; GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_invoices TO app_tenant_user;',
          probeSql: 'RESET app.tenant_id; SET LOCAL ROLE app_tenant_user; DO $$ BEGIN IF (SELECT COUNT(*) FROM tenant_invoices) <> 0 THEN RAISE EXCEPTION \'RLS leaked rows when app.tenant_id was unset\'; END IF; END $$; SET LOCAL app.tenant_id = \'acme\'; SELECT invoice_id, tenant_id, customer_ref, amount_cents, status FROM tenant_invoices ORDER BY invoice_id ASC; RESET ROLE;',
          starterCode: [
            '-- 1. Enable and FORCE Row-Level Security on tenant_invoices',
            '-- 2. CREATE POLICY tenant_select_policy ON tenant_invoices FOR SELECT',
            '--    USING (tenant_id = current_setting(\'app.tenant_id\', true));',
            'ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;'
          ].join('\n'),
          solutionCode: [
            'ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;',
            'ALTER TABLE tenant_invoices FORCE ROW LEVEL SECURITY;',
            '',
            'CREATE POLICY tenant_select_policy ON tenant_invoices',
            '  FOR SELECT',
            '  USING (tenant_id = current_setting(\'app.tenant_id\', true));'
          ].join('\n'),
          hints: [
            'Run both `ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;` and `ALTER TABLE tenant_invoices FORCE ROW LEVEL SECURITY;`.',
            'Define `CREATE POLICY tenant_select_policy ON tenant_invoices FOR SELECT USING (tenant_id = current_setting(\'app.tenant_id\', true));`.',
            'Always pass `true` as the second argument to `current_setting(\'app.tenant_id\', true)` so unset sessions evaluate `tenant_id = NULL` (`0` rows) without crashing.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bENABLE\\s+ROW\\s+LEVEL\\s+SECURITY\\b', flags: 'i', message: 'Enable RLS with `ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY`.' },
              { pattern: '\\bFORCE\\s+ROW\\s+LEVEL\\s+SECURITY\\b', flags: 'i', message: 'Enforce owner compliance with `ALTER TABLE tenant_invoices FORCE ROW LEVEL SECURITY`.' },
              { pattern: '\\bcurrent_setting\\s*\\(\\s*\'app\\.tenant_id\'\\s*,\\s*true\\s*\\)', flags: 'i', message: 'Use fail-safe `current_setting(\'app.tenant_id\', true)` inside `USING (...)`.' }
            ]
          },
          solutionExplanation: 'With RLS enabled and forced, an unauthenticated pooled connection (`app.tenant_id` unset) sees `0` rows, while `SET LOCAL app.tenant_id = \'acme\'` transparently restricts `SELECT * FROM tenant_invoices` to invoices `701`, `702`, and `703`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Blocking Cross-Tenant Write Spoofing with USING + WITH CHECK',
          mission: 'Enable and force RLS on `tenant_invoices`, then create a unified policy `tenant_all_isolation ON tenant_invoices FOR ALL` that enforces `tenant_id = current_setting(\'app.tenant_id\', true)` in **both** `USING (...)` and `WITH CHECK (...)` so tenants can neither read/modify foreign rows nor `INSERT` spoofed invoices stamped with another tenant\'s `tenant_id`.',
          setupSql: 'DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = \'app_tenant_user\') THEN CREATE ROLE app_tenant_user NOLOGIN; END IF; END $$; GRANT USAGE ON SCHEMA pg_ops TO app_tenant_user; GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_invoices TO app_tenant_user;',
          probeSql: 'SET LOCAL ROLE app_tenant_user; SET LOCAL app.tenant_id = \'globex\'; DO $$ BEGIN INSERT INTO tenant_invoices VALUES (799, \'acme\', \'INV-SPOOF\', 1000, \'open\', \'2025-03-16\'); RAISE EXCEPTION \'expected_rls_with_check_rejection\'; EXCEPTION WHEN insufficient_privilege THEN NULL; END $$; INSERT INTO tenant_invoices VALUES (710, \'globex\', \'INV-GL-04\', 330000, \'open\', \'2025-03-16\'); UPDATE tenant_invoices SET status = \'paid\' WHERE status = \'overdue\'; SELECT invoice_id, tenant_id, customer_ref, amount_cents, status FROM tenant_invoices ORDER BY invoice_id ASC; RESET ROLE;',
          starterCode: [
            '-- Enforce both read/target visibility (USING) and new-tuple validation (WITH CHECK)',
            'ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;',
            'ALTER TABLE tenant_invoices FORCE ROW LEVEL SECURITY;',
            '-- TODO: CREATE POLICY tenant_all_isolation ON tenant_invoices FOR ALL USING (...) WITH CHECK (...);'
          ].join('\n'),
          solutionCode: [
            'ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;',
            'ALTER TABLE tenant_invoices FORCE ROW LEVEL SECURITY;',
            '',
            'CREATE POLICY tenant_all_isolation ON tenant_invoices',
            '  FOR ALL',
            '  USING (tenant_id = current_setting(\'app.tenant_id\', true))',
            '  WITH CHECK (tenant_id = current_setting(\'app.tenant_id\', true));'
          ].join('\n'),
          hints: [
            '`USING (...)` filters existing rows visible to `SELECT`, `UPDATE`, and `DELETE`, while `WITH CHECK (...)` validates new tuple images created by `INSERT` and `UPDATE`.',
            'Use `tenant_id = current_setting(\'app.tenant_id\', true)` in both `USING (...)` and `WITH CHECK (...)`.',
            'Scope the policy with `FOR ALL` on `tenant_invoices`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bFOR\\s+ALL\\b', flags: 'i', message: 'Create a `FOR ALL` policy covering reads and writes.' },
              { pattern: '\\bUSING\\s*\\(', flags: 'i', message: 'Provide a `USING (...)` visibility predicate.' },
              { pattern: '\\bWITH\\s+CHECK\\s*\\(', flags: 'i', message: 'Provide a `WITH CHECK (...)` write-validation predicate.' }
            ]
          },
          solutionExplanation: '`WITH CHECK` aborts `globex`\'s spoofed `INSERT` for `\'acme\'` with SQLSTATE `42501` (`insufficient_privilege`), permits `globex`\'s legitimate `710` insert, and scopes an unqualified `UPDATE ... WHERE status = \'overdue\'` strictly to `globex`\'s own `706` invoice (leaving `initech`\'s `708` untouched).'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Multi-Role Permissive Policies + AS RESTRICTIVE Immutability Guard',
          mission: 'Roles `app_tenant_user` and `app_billing_auditor` are pre-created in setup. Enable and force RLS on `tenant_invoices`, then create three policies: (1) permissive `tenant_rw_policy` `FOR ALL TO app_tenant_user` with `USING` and `WITH CHECK` matching `tenant_id = current_setting(\'app.tenant_id\', true)`; (2) permissive `auditor_ro_policy` `FOR SELECT TO app_billing_auditor USING (true)`; and (3) `AS RESTRICTIVE` policy `immutable_paid_guard ON tenant_invoices AS RESTRICTIVE FOR UPDATE USING (status <> \'paid\')` so even owning tenants cannot alter already-`paid` invoices.',
          setupSql: 'DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = \'app_tenant_user\') THEN CREATE ROLE app_tenant_user NOLOGIN; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = \'app_billing_auditor\') THEN CREATE ROLE app_billing_auditor NOLOGIN; END IF; END $$; GRANT USAGE ON SCHEMA pg_ops TO app_tenant_user, app_billing_auditor; GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_invoices TO app_tenant_user; GRANT SELECT ON tenant_invoices TO app_billing_auditor;',
          probeSql: 'SET LOCAL ROLE app_tenant_user; SET LOCAL app.tenant_id = \'acme\'; UPDATE tenant_invoices SET amount_cents = amount_cents + 5000; RESET ROLE; SET LOCAL ROLE app_billing_auditor; SELECT invoice_id, tenant_id, amount_cents, status FROM tenant_invoices WHERE tenant_id IN (\'acme\', \'umbraco\') ORDER BY invoice_id ASC; RESET ROLE;',
          starterCode: [
            'ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;',
            'ALTER TABLE tenant_invoices FORCE ROW LEVEL SECURITY;',
            '',
            '-- TODO 1: CREATE POLICY tenant_rw_policy ON tenant_invoices FOR ALL TO app_tenant_user USING (...) WITH CHECK (...);',
            '-- TODO 2: CREATE POLICY auditor_ro_policy ON tenant_invoices FOR SELECT TO app_billing_auditor USING (true);',
            '-- TODO 3: CREATE POLICY immutable_paid_guard ON tenant_invoices AS RESTRICTIVE FOR UPDATE USING (status <> \'paid\');'
          ].join('\n'),
          solutionCode: [
            'ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;',
            'ALTER TABLE tenant_invoices FORCE ROW LEVEL SECURITY;',
            '',
            'CREATE POLICY tenant_rw_policy ON tenant_invoices',
            '  FOR ALL',
            '  TO app_tenant_user',
            '  USING (tenant_id = current_setting(\'app.tenant_id\', true))',
            '  WITH CHECK (tenant_id = current_setting(\'app.tenant_id\', true));',
            '',
            'CREATE POLICY auditor_ro_policy ON tenant_invoices',
            '  FOR SELECT',
            '  TO app_billing_auditor',
            '  USING (true);',
            '',
            'CREATE POLICY immutable_paid_guard ON tenant_invoices',
            '  AS RESTRICTIVE',
            '  FOR UPDATE',
            '  USING (status <> \'paid\');'
          ].join('\n'),
          hints: [
            'Scope `tenant_rw_policy` `TO app_tenant_user` with both `USING` and `WITH CHECK` set to `(tenant_id = current_setting(\'app.tenant_id\', true))`.',
            'Grant cross-tenant read visibility to auditors via `CREATE POLICY auditor_ro_policy ON tenant_invoices FOR SELECT TO app_billing_auditor USING (true);`.',
            'Declare the compliance guardrail `AS RESTRICTIVE FOR UPDATE USING (status <> \'paid\')` so PostgreSQL `AND`-combines it with `tenant_rw_policy` during updates.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bTO\\s+app_tenant_user\\b', flags: 'i', message: 'Target `app_tenant_user` on the tenant policy.' },
              { pattern: '\\bTO\\s+app_billing_auditor\\b', flags: 'i', message: 'Target `app_billing_auditor` on the auditor read policy.' },
              { pattern: '\\bAS\\s+RESTRICTIVE\\b', flags: 'i', message: 'Use `AS RESTRICTIVE` so the paid-invoice guard `AND`-combines with permissive policies.' }
            ]
          },
          solutionExplanation: 'PostgreSQL evaluates `(permissive_policies) AND (restrictive_policies)`: when `acme` runs an unfiltered `UPDATE`, `tenant_rw_policy AND immutable_paid_guard` updates only open invoice `703` (`610000 -> 615000`) while protecting paid invoices `701` and `702`, and `app_billing_auditor` reads across tenants via `auditor_ro_policy`.'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
