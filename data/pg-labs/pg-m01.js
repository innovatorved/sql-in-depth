/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 01 (`pg-m01`): SQL Query Foundations, Filtering, Sorting & PG 18 Expressions
 * 8 Hands-On Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m01'] = [
    /* ========================================================================
       LAB 01: pg-m01-t01 — SELECT Projection, Aliases & Exact Numeric Arithmetic
       ======================================================================== */
    {
      id: 'pg-m01-t01',
      slug: 'select-projection-arithmetic',
      moduleId: 'pg-m01',
      title: 'SELECT Projection, Aliases & Exact Numeric Arithmetic',
      difficulty: 'Beginner',
      estimatedMinutes: 10,
      datasetId: 'ecommerce',
      clauses: ['SELECT', 'AS', 'NUMERIC', 'ROUND'],
      tags: ['select', 'aliases', 'arithmetic', 'integer-division', 'fundamentals'],
      guide: {
        mentalModel: 'In PostgreSQL 18, the `SELECT` target list is a **tuple projection operator** evaluated after `FROM` and `WHERE` have produced qualifying heap tuples. Every output expression is bound to a strict static type OID in `pg_type` before execution begins: `INTEGER` (`int4`), `BIGINT` (`int8`), `NUMERIC` (arbitrary-precision base-10000 digits), or IEEE-754 `DOUBLE PRECISION` (`float8`).\n\nWhen both operands of `/` are integer types (`int2`, `int4`, `int8`), PostgreSQL resolves the integer-division operator, **truncating toward zero** (`42000 / 95000` yields `0`, not `0.4421`). Casting at least one operand to `NUMERIC` (via `::numeric` or a decimal literal like `100.0`) promotes the expression to exact base-10 fixed-point arithmetic—essential for financial ledger conversions and `ROUND(numeric, int)` calls, because PostgreSQL purposefully omits a two-argument `ROUND(double precision, integer)` overload to prevent binary floating-point rounding drift.',
        syntaxAnatomy: [
          'SELECT product_id,',
          '       sku AS catalog_sku,                                   -- Clean output column alias',
          '       ROUND(price_cents::numeric / 100, 2) AS price_usd,    -- Explicit ::numeric avoids int truncation',
          '       ROUND((price_cents * stock_qty) / 100.0, 2) AS inv_usd -- Decimal literal 100.0 parses as NUMERIC',
          'FROM products',
          'ORDER BY product_id ASC;'
        ].join('\n'),
        internalsAndGotchas: [
          'Dividing two `INTEGER` or `BIGINT` values (`a / b`) silently truncates toward zero in PostgreSQL; cast the numerator (`a::numeric / b`) BEFORE dividing, not after (`(a / b)::numeric` still casts an already-truncated `0`).',
          'Calling `ROUND(val, 2)` on a `REAL` or `DOUBLE PRECISION` value raises `function round(double precision, integer) does not exist`; cast to `::numeric` first.',
          'Unquoted aliases in `AS MyAlias` fold to lowercase (`myalias`) in PostgreSQL\'s lexer; prefer `snake_case` unquoted identifiers over `"MixedCase"` double-quoted identifiers.',
          'Unlike `FLOAT8`, `NUMERIC` stores exact base-10000 `NumericDigit` arrays on disk—never use `DOUBLE PRECISION` for currency cents, tax rates, or fee calculations.'
        ],
        whenToUse: 'Use `SELECT` projections with `::numeric` casts and `ROUND(..., 2)` whenever converting integer minor units (cents, basis points) or computing exact financial ratios and margins directly inside PostgreSQL.'
      },
      scenario: {
        role: 'Payments & Catalog Data Engineer',
        incidentOrGoal: 'Finance noticed zeroed-out percentage shares and unformatted cent columns in the merchandising dashboard caused by integer division and missing `NUMERIC` casts on `products` and `order_items`.',
        stakeholderNeed: 'Deliver three exact `NUMERIC` projections: taxed unit pricing in USD, relative catalog price share against the flagship license without integer truncation, and per-line gateway fee economics.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Exact Cents-to-USD & Taxed Unit Price Projection',
          mission: 'Query `products` and project 5 columns in exact order: `product_id`, `sku`, `price_cents`, `price_usd` (`price_cents` converted to exact USD rounded to 2 decimal places), and `taxed_price_usd` (`price_cents` multiplied by `1.075` for a 7.5% tax rate, converted to USD and rounded to 2 decimal places). Sort by `product_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Convert integer cents to exact 2-decimal USD and 7.5% tax-inclusive USD',
            'SELECT product_id,',
            '       sku,',
            '       price_cents',
            '       -- TODO: add ROUND(...::numeric / 100, 2) AS price_usd',
            '       -- TODO: add ROUND((price_cents * 1.075)::numeric / 100, 2) AS taxed_price_usd',
            'FROM products',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT product_id,',
            '       sku,',
            '       price_cents,',
            '       ROUND(price_cents::numeric / 100, 2) AS price_usd,',
            '       ROUND((price_cents * 1.075)::numeric / 100, 2) AS taxed_price_usd',
            'FROM products',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          hints: [
            'Divide `price_cents` by `100` using `NUMERIC` arithmetic (`price_cents::numeric / 100` or `price_cents / 100.0`) so fractional cents are preserved.',
            'Wrap both USD expressions in `ROUND(..., 2)` and assign aliases `AS price_usd` and `AS taxed_price_usd`.',
            'For `taxed_price_usd`, compute `ROUND((price_cents * 1.075)::numeric / 100, 2) AS taxed_price_usd` and keep `ORDER BY product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bROUND\\s*\\(', flags: 'i', message: 'Use `ROUND(..., 2)` to format exact `NUMERIC` currency columns.' },
              { pattern: '\\bAS\\s+taxed_price_usd\\b', flags: 'i', message: 'Alias the 5th column as `AS taxed_price_usd`.' }
            ]
          },
          solutionExplanation: 'Casting `price_cents::numeric` (or multiplying by the `NUMERIC` literal `1.075`) keeps evaluation in PostgreSQL\'s exact base-10 `NUMERIC` engine, allowing `ROUND(..., 2)` to round half-away-from-zero cleanly (for example, `4500 * 1.075 / 100 = 48.375` rounds to `48.38`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Defeating Integer-Division Truncation on Catalog Ratios',
          mission: 'Query `products` and project 4 columns in exact order: `product_id`, `sku`, `price_cents`, and `pct_of_flagship` — each product\'s `price_cents` expressed as a percentage (`0`–`100`) of the `95000`-cent flagship license (`price_cents` divided by `95000` times `100`), rounded to 2 decimal places using `NUMERIC` casting so integer division does not truncate values below `95000` to `0`. Sort by `pct_of_flagship DESC, product_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Fix the integer-division bug: price_cents / 95000 truncates to 0 for 7 of 8 rows!',
            'SELECT product_id,',
            '       sku,',
            '       price_cents,',
            '       (price_cents / 95000) * 100 AS pct_of_flagship -- BUG: integer division!',
            'FROM products',
            'ORDER BY pct_of_flagship DESC, product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT product_id,',
            '       sku,',
            '       price_cents,',
            '       ROUND((price_cents::numeric / 95000) * 100, 2) AS pct_of_flagship',
            'FROM products',
            'ORDER BY pct_of_flagship DESC, product_id ASC;'
          ].join('\n'),
          hints: [
            'In PostgreSQL, `42000 / 95000` uses `int4 / int4` and immediately truncates to `0` before `* 100` runs.',
            'Cast `price_cents::numeric` (or `CAST(price_cents AS numeric)`) inside the numerator before dividing by `95000`.',
            'Write `ROUND((price_cents::numeric / 95000) * 100, 2) AS pct_of_flagship` and sort by `pct_of_flagship DESC, product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '(::\\s*numeric|CAST\\s*\\([^)]+AS\\s+numeric\\)|95000\\.0|100\\.0)', flags: 'i', message: 'Promote the division to `NUMERIC` (e.g. `price_cents::numeric / 95000`) before dividing.' },
              { pattern: '\\bROUND\\s*\\(', flags: 'i', message: 'Round the computed percentage to 2 decimal places with `ROUND(..., 2)`.' }
            ]
          },
          solutionExplanation: 'Promoting `price_cents::numeric` prior to `/` dispatches PostgreSQL\'s `numeric_div` operator instead of `int4div`. Without the cast, every product cheaper than `95000` cents evaluates to `0 * 100 = 0`; with `::numeric`, `42000 / 95000 * 100` accurately yields `44.21`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Line-Item Gross Revenue & Payment Gateway Fee Economics',
          mission: 'Query `order_items` and project 5 columns in exact order: `order_item_id`, `order_id`, `line_total_usd` (`(quantity * unit_price_cents)` converted to USD, rounded to 2 decimals), `gateway_fee_usd` (a 2.9% + 30-cent processor fee: `(quantity * unit_price_cents * 0.029 + 30)` converted from cents to USD, rounded to 2 decimals), and `net_revenue_usd` (`(quantity * unit_price_cents) - (quantity * unit_price_cents * 0.029 + 30)` converted from cents to USD, rounded to 2 decimals). Sort by `line_total_usd DESC, order_item_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Compute per-line gross USD, gateway processor fee (2.9% + 30 cents), and net USD',
            'SELECT order_item_id,',
            '       order_id',
            '       -- TODO: line_total_usd, gateway_fee_usd, net_revenue_usd',
            'FROM order_items',
            'ORDER BY order_item_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT order_item_id,',
            '       order_id,',
            '       ROUND((quantity * unit_price_cents)::numeric / 100, 2) AS line_total_usd,',
            '       ROUND(((quantity * unit_price_cents * 0.029) + 30)::numeric / 100, 2) AS gateway_fee_usd,',
            '       ROUND(((quantity * unit_price_cents) - ((quantity * unit_price_cents * 0.029) + 30))::numeric / 100, 2) AS net_revenue_usd',
            'FROM order_items',
            'ORDER BY line_total_usd DESC, order_item_id ASC;'
          ].join('\n'),
          hints: [
            'Note that `SELECT` aliases cannot reference sibling `SELECT` aliases in the same query block—repeat `(quantity * unit_price_cents)` or wrap the base calculation in a CTE.',
            'In cents, gross is `quantity * unit_price_cents` and fee is `(quantity * unit_price_cents * 0.029) + 30`; divide each by `100` in `NUMERIC` and `ROUND(..., 2)`.',
            'Sort deterministically using `ORDER BY line_total_usd DESC, order_item_id ASC` (PostgreSQL permits output column aliases in `ORDER BY`).'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.02,
            requiredPatterns: [
              { pattern: '\\bROUND\\s*\\(', flags: 'i', message: 'Use `ROUND(..., 2)` for exact USD currency outputs.' },
              { pattern: '0\\.029', flags: 'i', message: 'Compute the 2.9% (`0.029`) + 30-cent gateway fee formula.' }
            ]
          },
          solutionExplanation: 'PostgreSQL evaluates all `SELECT` target-list expressions in the same logical phase, so sibling aliases (`line_total_usd`, `gateway_fee_usd`) cannot reference each other directly unless staged in a `WITH` CTE. `ORDER BY`, however, runs after projection and can sort directly on `line_total_usd DESC`.'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m01-t02 — WHERE Row Filtering, Comparison Operators & Execution Order
       ======================================================================== */
    {
      id: 'pg-m01-t02',
      slug: 'where-comparison-predicates',
      moduleId: 'pg-m01',
      title: 'WHERE Row Filtering, Comparison Operators & Execution Order',
      difficulty: 'Beginner',
      estimatedMinutes: 10,
      datasetId: 'ecommerce',
      clauses: ['WHERE', '=', '<>', '>=', '<='],
      tags: ['where', 'filtering', 'predicates', 'execution-order', 'fundamentals'],
      guide: {
        mentalModel: 'PostgreSQL executes SQL according to **logical evaluation order**, not lexical typing order: `FROM` materializes or scans the source relation first, `WHERE` evaluates boolean row predicates (`quals`) on each candidate tuple, `SELECT` projects output columns for surviving tuples, and `ORDER BY` sorts the projected result set.\n\nAt the storage engine layer, pushing selective `=`, `<>`, `>=`, and `<=` predicates into `WHERE` allows the PostgreSQL planner to convert SARGable (*Search ARGument ABLE*) comparisons into B-Tree index scan bounds (`Index Cond`) or discard non-matching tuples immediately inside `Seq Scan` (`Filter`) before allocating memory for projection or sorting. Because `WHERE` runs **before** `SELECT`, referencing a `SELECT` alias inside `WHERE` raises `ERROR: column "..." does not exist`.',
        syntaxAnatomy: [
          'SELECT order_id,',
          '       customer_id,',
          '       quantity * unit_price_cents AS line_cents   -- 3. Projected AFTER filtering',
          'FROM order_items                                   -- 1. Source relation scan',
          'WHERE quantity >= 2                                -- 2. Tuple filter (cannot see line_cents!)',
          '  AND unit_price_cents <> 15000',
          'ORDER BY line_cents DESC, order_item_id ASC;       -- 4. Sort CAN see output alias line_cents'
        ].join('\n'),
        internalsAndGotchas: [
          '`WHERE` executes before `SELECT`: referencing a `SELECT` alias in `WHERE` fails with `column does not exist`—either repeat the expression in `WHERE` or wrap the projection in a CTE (`WITH cte AS (...)`).',
          'Standard SQL `<>` and PostgreSQL\'s alias `!=` are parser-identical (both map to the `<>` operator in `pg_operator`), but neither ever matches `NULL` (`NULL <> \'x\'` yields `UNKNOWN`).',
          'Applying arithmetic or functions to an indexed column on the left side (`WHERE total_cents / 100 >= 500`) prevents standard B-Tree index usage; rewrite constants to the right side (`WHERE total_cents >= 50000`).',
          'Text comparisons (`status = \'completed\'`) are **case-sensitive** under standard UTF-8 deterministic collations (`\'Completed\'` will not match `\'completed\'`).'
        ],
        whenToUse: 'Place every row-level restriction into `WHERE` on bare, unmanipulated table columns so the PostgreSQL planner can push predicates down to B-Tree indexes and prune heap tuples as early as possible.'
      },
      scenario: {
        role: 'Fulfillment Backend Engineer',
        incidentOrGoal: 'Three fulfillment API endpoints are either returning unshipped/small orders, alerting on digital licenses that never run out of physical stock, or crashing because a developer referenced a `SELECT` alias inside `WHERE`.',
        stakeholderNeed: 'Build exact `WHERE` filters for high-value completed orders, low-stock physical SKUs, and multi-unit high-revenue line items respecting PostgreSQL clause execution order.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Filtering Completed High-Value Orders',
          mission: 'Query `orders` and return `order_id`, `customer_id`, `status`, `total_cents`, and `created_at` (in that exact order) for rows where `status` equals `\'completed\'` and `total_cents` is at least `50000` (`>= 50000`). Sort by `total_cents DESC, order_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Return completed orders with total_cents >= 50000',
            'SELECT order_id, customer_id, status, total_cents, created_at',
            'FROM orders',
            '-- TODO: add WHERE filter on status and total_cents',
            'ORDER BY total_cents DESC, order_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT order_id, customer_id, status, total_cents, created_at',
            'FROM orders',
            'WHERE status = \'completed\'',
            '  AND total_cents >= 50000',
            'ORDER BY total_cents DESC, order_id ASC;'
          ].join('\n'),
          hints: [
            'Use `WHERE` immediately after `FROM orders` with exact lowercase string literal `\'completed\'`.',
            'Combine the status equality check and `total_cents >= 50000` with `AND`.',
            'Keep `total_cents >= 50000` in integer cents rather than dividing `total_cents` so B-Tree indexes stay usable.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bWHERE\\b', flags: 'i', message: 'Filter rows using a `WHERE` clause.' },
              { pattern: '>=\\s*50000', flags: 'i', message: 'Compare `total_cents >= 50000` directly in cents.' }
            ]
          },
          solutionExplanation: 'Filtering `status = \'completed\' AND total_cents >= 50000` on bare columns allows PostgreSQL to use `idx_orders_customer_status` or evaluate two cheap scalar `OpExpr` quals directly on the heap tuple header before projection.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Restock Alert Filter with Non-Equality (<>) & Upper Bounds (<=)',
          mission: 'Query `products` to find active physical hardware needing restock: return `product_id`, `sku`, `name`, `category_id`, and `stock_qty` where `is_active = 1`, `category_id <> 40` (excluding Cloud Licenses), and `stock_qty <= 35`. Sort by `stock_qty ASC, product_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Find active physical products (category_id <> 40) with stock_qty <= 35',
            'SELECT product_id, sku, name, category_id, stock_qty',
            'FROM products',
            '-- TODO: filter active physical items at or below 35 units',
            'ORDER BY stock_qty ASC, product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT product_id, sku, name, category_id, stock_qty',
            'FROM products',
            'WHERE is_active = 1',
            '  AND category_id <> 40',
            '  AND stock_qty <= 35',
            'ORDER BY stock_qty ASC, product_id ASC;'
          ].join('\n'),
          hints: [
            'Notice product `108` (`TAPE-LTO9-18T`) has `stock_qty = 0` and `is_active = 0`—filtering `is_active = 1` excludes discontinued items.',
            'Use `category_id <> 40` (standard SQL non-equality) to exclude Cloud Licenses.',
            'Add `AND stock_qty <= 35` and sort by `stock_qty ASC, product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '(<>|!=)\\s*40', flags: 'i', message: 'Exclude category `40` using `category_id <> 40`.' },
              { pattern: '<=\\s*35', flags: 'i', message: 'Filter restock threshold using `stock_qty <= 35`.' }
            ]
          },
          solutionExplanation: 'Combining `is_active = 1`, `category_id <> 40`, and `stock_qty <= 35` eliminates discontinued LTO tape (`product_id = 108`) and virtual licenses (`40`), leaving the exact 3 physical hardware SKUs at or below 35 units.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Navigating Clause Execution Order (WHERE vs SELECT Aliases)',
          mission: 'Query `order_items` and project `order_item_id`, `order_id`, `product_id`, `quantity`, and `quantity * unit_price_cents AS line_cents`. Filter for multi-unit line items where `quantity <> 1` AND the computed line amount (`quantity * unit_price_cents`) is `>= 60000` without triggering PostgreSQL\'s alias-in-`WHERE` error. Sort by `line_cents DESC, order_item_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Also filter for computed line_cents >= 60000.',
            '-- Remember WHERE runs BEFORE SELECT, so repeat quantity * unit_price_cents >= 60000 (or use a CTE)!',
            'SELECT order_item_id,',
            '       order_id,',
            '       product_id,',
            '       quantity,',
            '       quantity * unit_price_cents AS line_cents',
            'FROM order_items',
            'WHERE quantity <> 1',
            'ORDER BY line_cents DESC, order_item_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT order_item_id,',
            '       order_id,',
            '       product_id,',
            '       quantity,',
            '       quantity * unit_price_cents AS line_cents',
            'FROM order_items',
            'WHERE quantity <> 1',
            '  AND quantity * unit_price_cents >= 60000',
            'ORDER BY line_cents DESC, order_item_id ASC;'
          ].join('\n'),
          hints: [
            'PostgreSQL resolves `WHERE` identifiers strictly against `FROM` table columns, because `SELECT` aliases have not been bound yet.',
            'Replace `line_cents >= 60000` in `WHERE` with `quantity * unit_price_cents >= 60000` (or wrap the `SELECT` in a `WITH` CTE and filter in the outer query).',
            'Keep `ORDER BY line_cents DESC, order_item_id ASC`—`ORDER BY` runs after `SELECT` and can reference `line_cents` directly.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bAS\\s+line_cents\\b', flags: 'i', message: 'Project `quantity * unit_price_cents AS line_cents`.' },
              { pattern: '(<>|!=)\\s*1', flags: 'i', message: 'Filter multi-unit items with `quantity <> 1`.' }
            ]
          },
          solutionExplanation: 'Because PostgreSQL\'s analyzer binds `WHERE` against range-table entries from `FROM` before building the `SELECT` target list, `quantity * unit_price_cents >= 60000` must either be written directly in `WHERE` or materialized via a CTE. `ORDER BY` resolves output-column names last, so `ORDER BY line_cents DESC` is valid SQL.'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m01-t03 — AND, OR, NOT Precedence & Three-Valued Logic (3VL)
       ======================================================================== */
    {
      id: 'pg-m01-t03',
      slug: 'boolean-logic-precedence-3vl',
      moduleId: 'pg-m01',
      title: 'AND, OR, NOT Precedence & Three-Valued Logic (3VL)',
      difficulty: 'Beginner',
      estimatedMinutes: 12,
      datasetId: 'ecommerce',
      clauses: ['AND', 'OR', 'NOT', 'IS TRUE', 'IS NOT TRUE'],
      tags: ['boolean-logic', 'precedence', '3vl', 'null', 'where'],
      guide: {
        mentalModel: 'Two subtle rules cause a disproportionate share of production SQL data-leak and missing-row incidents in PostgreSQL: **boolean operator precedence** and **Kleene Three-Valued Logic (`3VL`)**.\n\nFirst, in PostgreSQL\'s grammar, `NOT` binds tightest, `AND` binds tighter than `OR`, and `OR` binds loosest. Writing `WHERE tier = \'enterprise\' OR tier = \'pro\' AND country <> \'US\'` parses as `tier = \'enterprise\' OR (tier = \'pro\' AND country <> \'US\')`, leaking every US `enterprise` row! Second, every SQL predicate evaluates to `TRUE`, `FALSE`, or `UNKNOWN` (`NULL`), and `WHERE` **only emits rows where the top-level predicate is strictly `TRUE`** (`FALSE` and `UNKNOWN` are both discarded). When `discount_code` is `NULL`, `discount_code = \'LAUNCH10\'` is `UNKNOWN`, and `NOT (UNKNOWN)` is **still `UNKNOWN`**! PostgreSQL\'s `IS TRUE`, `IS FALSE`, and `IS NOT TRUE` predicates collapse `3VL` back into strict two-valued logic (`UNKNOWN IS NOT TRUE` evaluates to `TRUE`).',
        syntaxAnatomy: [
          'SELECT order_id, customer_id, status, total_cents, discount_code',
          'FROM orders',
          'WHERE (status = \'completed\' OR status = \'pending\')   -- Parenthesize OR before AND!',
          '  AND (discount_code = \'LAUNCH10\') IS NOT TRUE       -- Maps FALSE and UNKNOWN (NULL) -> TRUE',
          'ORDER BY order_id ASC;'
        ].join('\n'),
        internalsAndGotchas: [
          '`AND` always binds tighter than `OR`: never mix `AND` and `OR` in the same `WHERE` clause without explicit parentheses around the `OR` disjunction.',
          'In 3VL, `NULL <> \'LAUNCH10\'` and `NOT (discount_code = \'LAUNCH10\')` both evaluate to `UNKNOWN` when `discount_code` is `NULL`, silently dropping every row without a discount code.',
          '`FALSE AND NULL` short-circuits to `FALSE` (because neither branch can rescue it), whereas `TRUE OR NULL` evaluates to `TRUE`—truth tables are symmetric around certainty.',
          '`expr IS NOT TRUE` returns `TRUE` for both `FALSE` and `UNKNOWN` (`NULL`), making it the cleanest SQL-standard predicate for "exclude rows matching `expr`, while keeping `NULL`s".'
        ],
        whenToUse: 'Always parenthesize `OR` groups when combined with `AND`, and reach for `IS NOT TRUE` (or `IS DISTINCT FROM`) whenever negating a condition on a nullable column.'
      },
      scenario: {
        role: 'Compliance & Billing Analytics Engineer',
        incidentOrGoal: 'An international VAT export leaked domestic US enterprise accounts due to unparenthesized `OR`, and a revenue audit excluding promo `\'LAUNCH10\'` accidentally dropped 5 full-price orders whose `discount_code` was `NULL`.',
        stakeholderNeed: 'Fix the operator-precedence leak on `customers`, recover the `NULL`-promo completed orders using `IS NOT TRUE`, and build a 3VL-safe fulfillment audit.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Fixing AND / OR Precedence Leaks',
          mission: 'Query `customers` to return `customer_id`, `name`, `tier`, and `country` (in exact order) for international paid customers: `tier` must be either `\'enterprise\'` or `\'pro\'`, AND `country` must NOT be `\'US\'`. Sort by `customer_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Fix precedence bug: without parentheses, US enterprise customer #3 leaks into results!',
            'SELECT customer_id, name, tier, country',
            'FROM customers',
            'WHERE tier = \'enterprise\' OR tier = \'pro\' AND country <> \'US\'',
            'ORDER BY customer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT customer_id, name, tier, country',
            'FROM customers',
            'WHERE (tier = \'enterprise\' OR tier = \'pro\')',
            '  AND country <> \'US\'',
            'ORDER BY customer_id ASC;'
          ].join('\n'),
          hints: [
            'PostgreSQL parses `A OR B AND C` as `A OR (B AND C)`, so `tier = \'enterprise\'` bypasses `country <> \'US\'`.',
            'Wrap `(tier = \'enterprise\' OR tier = \'pro\')` in explicit parentheses before `AND country <> \'US\'`.',
            'Verify customer `3` (`Marcus Vance`, `enterprise`, `US`) is excluded while customers `1, 2, 5, 8` remain.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\(\\s*tier\\s*=\\s*\'(enterprise|pro)\'\\s+OR\\s+tier\\s*=\\s*\'(pro|enterprise)\'\\s*\\)', flags: 'i', message: 'Parenthesize the `OR` condition `(tier = \'enterprise\' OR tier = \'pro\')` before `AND`.' },
              { pattern: '\\bAND\\b', flags: 'i', message: 'Combine the parenthesized tier check with `AND country <> \'US\'`.' }
            ]
          },
          solutionExplanation: 'Wrapping `(tier = \'enterprise\' OR tier = \'pro\')` forces the disjunction to evaluate before `AND country <> \'US\'`, preventing US enterprise customer `Marcus Vance` (`customer_id = 3`) from bypassing the country filter.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Surviving 3VL NULLs with IS NOT TRUE',
          mission: 'Query `orders` to return `order_id`, `customer_id`, `total_cents`, and `discount_code` for all `\'completed\'` orders that did NOT use `discount_code = \'LAUNCH10\'` — **including** orders where `discount_code` is `NULL`. Use PostgreSQL\'s `(discount_code = \'LAUNCH10\') IS NOT TRUE` 3VL predicate. Sort by `order_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Fix the 3VL bug: discount_code <> \'LAUNCH10\' drops 5 completed orders where discount_code IS NULL!',
            'SELECT order_id, customer_id, total_cents, discount_code',
            'FROM orders',
            'WHERE status = \'completed\'',
            '  AND discount_code <> \'LAUNCH10\' -- BUG: NULL <> \'LAUNCH10\' is UNKNOWN!',
            'ORDER BY order_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT order_id, customer_id, total_cents, discount_code',
            'FROM orders',
            'WHERE status = \'completed\'',
            '  AND (discount_code = \'LAUNCH10\') IS NOT TRUE',
            'ORDER BY order_id ASC;'
          ].join('\n'),
          hints: [
            'When `discount_code` is `NULL`, `discount_code = \'LAUNCH10\'` evaluates to `UNKNOWN`, and `WHERE` discards `UNKNOWN`.',
            'Applying `IS NOT TRUE` to `(discount_code = \'LAUNCH10\')` converts both `FALSE` (e.g. `\'VIP20\'`, `\'SPRING\'`) and `UNKNOWN` (`NULL`) into `TRUE`.',
            'Write `WHERE status = \'completed\' AND (discount_code = \'LAUNCH10\') IS NOT TRUE` and sort by `order_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bIS\\s+NOT\\s+TRUE\\b', flags: 'i', message: 'Use `IS NOT TRUE` to map both `FALSE` and `UNKNOWN` (`NULL`) to `TRUE`.' }
            ]
          },
          solutionExplanation: 'In Kleene 3VL, `discount_code <> \'LAUNCH10\'` yields `UNKNOWN` whenever `discount_code IS NULL`, silently hiding 5 full-price completed orders (`1002, 1004, 1006, 1010`). `(discount_code = \'LAUNCH10\') IS NOT TRUE` evaluates to `FALSE` only for order `1001` (`\'LAUNCH10\'`) and `TRUE` for all 6 other completed orders.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Combining NOT, IS TRUE & IS NOT TRUE for Settlement Hold Audits',
          mission: 'Query `orders` and project `order_id`, `customer_id`, `status`, `total_cents`, and `(discount_code IS NOT NULL) AS has_promo`. Return rows where `NOT (status = \'cancelled\')` AND either `((status = \'completed\' AND total_cents >= 80000) IS TRUE)` OR `((status = \'completed\') IS NOT TRUE)`. Sort by `order_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Audit non-cancelled orders that are either high-value completed (>= 80000) or non-completed (pending/refunded)',
            'SELECT order_id,',
            '       customer_id,',
            '       status,',
            '       total_cents,',
            '       (discount_code IS NOT NULL) AS has_promo',
            'FROM orders',
            '-- TODO: combine NOT (status = \'cancelled\') with parenthesized OR using IS TRUE / IS NOT TRUE',
            'ORDER BY order_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT order_id,',
            '       customer_id,',
            '       status,',
            '       total_cents,',
            '       (discount_code IS NOT NULL) AS has_promo',
            'FROM orders',
            'WHERE NOT (status = \'cancelled\')',
            '  AND (',
            '    (status = \'completed\' AND total_cents >= 80000) IS TRUE',
            '    OR (status = \'completed\') IS NOT TRUE',
            '  )',
            'ORDER BY order_id ASC;'
          ].join('\n'),
          hints: [
            'First exclude cancelled orders with `WHERE NOT (status = \'cancelled\')`.',
            'Wrap the `OR` branch in outer parentheses `AND ( ... OR ... )` so `NOT (status = \'cancelled\')` applies to both branches!',
            'Inside the parentheses, combine `(status = \'completed\' AND total_cents >= 80000) IS TRUE` with `OR (status = \'completed\') IS NOT TRUE`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bNOT\\b', flags: 'i', message: 'Use `NOT` to exclude cancelled orders.' },
              { pattern: '\\bIS\\s+TRUE\\b', flags: 'i', message: 'Use `IS TRUE` in the high-value completed branch.' },
              { pattern: '\\bIS\\s+NOT\\s+TRUE\\b', flags: 'i', message: 'Use `IS NOT TRUE` in the non-completed branch.' }
            ]
          },
          solutionExplanation: 'Parenthesizing the `OR` group after `NOT (status = \'cancelled\') AND (...)` ensures order `1005` (`cancelled`) cannot sneak back in via `(status = \'completed\') IS NOT TRUE`, cleanly returning the 4 completed orders `>= 80000` (`1001, 1003, 1004, 1010`) plus `pending` (`1007`) and `refunded` (`1009`).'
        }
      ]
    },

    /* ========================================================================
       LAB 04: pg-m01-t04 — IN, BETWEEN, LIKE, ILIKE & POSIX Regex (~, ~*)
       ======================================================================== */
    {
      id: 'pg-m01-t04',
      slug: 'pattern-range-membership-filters',
      moduleId: 'pg-m01',
      title: 'IN, BETWEEN, LIKE, ILIKE & POSIX Regex (~, ~*)',
      difficulty: 'Beginner',
      estimatedMinutes: 12,
      datasetId: 'ecommerce',
      clauses: ['IN', 'BETWEEN', 'LIKE', 'ILIKE', '~*'],
      tags: ['like', 'ilike', 'regex', 'between', 'in', 'pattern-matching'],
      guide: {
        mentalModel: 'PostgreSQL rewrites membership, range, and pattern predicates into specialized internal nodes with vastly different index characteristics. `col IN (v1, v2, ...)` compiles to a `ScalarArrayOpExpr` (`col = ANY(ARRAY[...])`) that probes B-Tree leaf pages directly. `col BETWEEN low AND high` rewrites to `col >= low AND col <= high` (**inclusive** on both endpoints!).\n\nFor strings, SQL `LIKE` (`%` = zero or more chars, `_` = single char) is case-sensitive, while PostgreSQL\'s `ILIKE` is case-insensitive. When wildcards are insufficient, PostgreSQL embeds a full Henry Spencer **POSIX Extended Regular Expression (`ARE`) engine** directly in SQL via four operators: `~` (case-sensitive match), `~*` (case-insensitive match), `!~` (does not match), and `!~*` (case-insensitive does not match). With the `pg_trgm` extension loaded, PostgreSQL can even accelerate unanchored `%substring%` `ILIKE` and `~*` regex queries using a trigram GIN index!',
        syntaxAnatomy: [
          'SELECT customer_id, name, email, tier',
          'FROM customers',
          'WHERE tier IN (\'enterprise\', \'pro\')               -- ScalarArrayOpExpr (= ANY)',
          '  AND created_at BETWEEN \'2025-01-01\' AND \'2025-02-28\' -- Inclusive [low, high]',
          '  AND email ~* \'\\.(io|dev|uk)$\'                   -- Case-insensitive POSIX regex + $ anchor',
          'ORDER BY customer_id ASC;'
        ].join('\n'),
        internalsAndGotchas: [
          '`BETWEEN a AND b` is **inclusive** on both bounds: for timestamps (`BETWEEN \'2025-02-01\' AND \'2025-02-28\'`), events at `2025-02-28 14:20:00` are EXCLUDED because `\'2025-02-28\'` coerces to midnight `00:00:00`! Prefer half-open `[start, end)` bounds (`>= start AND < next_day`) on timestamps.',
          'Under non-`C` locale collations, a standard B-Tree index cannot accelerate `sku LIKE \'NVME-%\'` unless built with `varchar_pattern_ops` / `text_pattern_ops` (or accelerated via `pg_trgm`).',
          'In `LIKE` and `ILIKE`, `_` is a single-character wildcard (`\'PG_HA\'` matches `\'PG-HA\'`!). Escape literal underscores (`\\_`) or use exact `=` / POSIX regex.',
          'POSIX regex `~` / `~*` searches for a **substring match anywhere** unless explicitly anchored with `^` (start) and `$` (end): `\'\\.de\'` falsely matches `\'elena@vela.dev\'`, whereas `\'\\.de$\'` does not.'
        ],
        whenToUse: 'Use `IN` for discrete constant lists, `BETWEEN` for inclusive integer/date ranges, `LIKE` / `ILIKE` for simple wildcard prefixes or substrings, and POSIX `~` / `~*` with `^`/`$` anchors for structured format validation (TLDs, SKUs, semantic versions).'
      },
      scenario: {
        role: 'Search & Catalog Platform Engineer',
        incidentOrGoal: 'Merchandising needs targeted mid-tier hardware slices, case-insensitive hardware spec search across SKUs and product titles, and an anchored TLD customer filter after an unanchored `LIKE \'%.de%\'` query mistakenly matched `.dev` developer emails.',
        stakeholderNeed: 'Author clean `IN` + `BETWEEN`, `LIKE` + `ILIKE`, and `$`-anchored POSIX `~*` queries across `products` and `customers`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Discrete Set Membership (IN) & Inclusive Bounds (BETWEEN)',
          mission: 'Query `products` and return `product_id`, `sku`, `name`, `category_id`, and `price_cents` for rows where `category_id` is in `(20, 30)` AND `price_cents` is inclusively `BETWEEN 20000 AND 70000`. Sort by `price_cents DESC, product_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Filter Storage (20) and Networking (30) products priced between $200.00 and $700.00',
            'SELECT product_id, sku, name, category_id, price_cents',
            'FROM products',
            '-- TODO: filter category_id IN (20, 30) AND price_cents BETWEEN 20000 AND 70000',
            'ORDER BY price_cents DESC, product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT product_id, sku, name, category_id, price_cents',
            'FROM products',
            'WHERE category_id IN (20, 30)',
            '  AND price_cents BETWEEN 20000 AND 70000',
            'ORDER BY price_cents DESC, product_id ASC;'
          ].join('\n'),
          hints: [
            'Use `category_id IN (20, 30)` to match either Storage & NVMe (`20`) or Networking (`30`).',
            'Combine with `AND price_cents BETWEEN 20000 AND 70000` (note low bound comes first in `BETWEEN low AND high`).',
            'Order by `price_cents DESC, product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bIN\\s*\\(\\s*20\\s*,\\s*30\\s*\\)', flags: 'i', message: 'Use `category_id IN (20, 30)`.' },
              { pattern: '\\bBETWEEN\\s+20000\\s+AND\\s+70000\\b', flags: 'i', message: 'Use `price_cents BETWEEN 20000 AND 70000`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL compiles `category_id IN (20, 30)` to `category_id = ANY (\'{20,30}\'::int[])` and `price_cents BETWEEN 20000 AND 70000` to `price_cents >= 20000 AND price_cents <= 70000`, which aligns directly with the composite B-Tree index `idx_products_category_price (category_id, price_cents DESC)`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Prefix Wildcards (LIKE) & Case-Insensitive Search (ILIKE)',
          mission: 'Query `products` and return `product_id`, `sku`, `name`, and `stock_qty` for products whose `sku` starts with `\'NVME-\'` (using `LIKE \'NVME-%\'`) OR whose `name` contains `\'smartnic\'` or `\'switch\'` case-insensitively (using `ILIKE`). Sort by `product_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Match NVME-* SKUs via LIKE or SmartNIC / Switch product names case-insensitively via ILIKE',
            'SELECT product_id, sku, name, stock_qty',
            'FROM products',
            '-- TODO: WHERE sku LIKE \'NVME-%\' OR name ILIKE ...',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT product_id, sku, name, stock_qty',
            'FROM products',
            'WHERE sku LIKE \'NVME-%\'',
            '   OR name ILIKE \'%smartnic%\'',
            '   OR name ILIKE \'%switch%\'',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          hints: [
            'Use `sku LIKE \'NVME-%\'` for the exact uppercase prefix match on SKU codes (`101` and `102`).',
            'Because `products.name` uses mixed case (`\'Dual-Port 100GbE SmartNIC\'`, `\'24-Port 10GbE L3 Switch\'`), use PostgreSQL\'s `ILIKE \'%smartnic%\'` and `ILIKE \'%switch%\'`.',
            'Connect the three conditions with `OR` and sort by `product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bLIKE\\s+\'NVME-%\'', flags: 'i', message: 'Use `sku LIKE \'NVME-%\'` for the SKU prefix filter.' },
              { pattern: '\\bILIKE\\b', flags: 'i', message: 'Use PostgreSQL\'s case-insensitive `ILIKE` operator on `name`.' }
            ]
          },
          solutionExplanation: 'Case-sensitive prefix `sku LIKE \'NVME-%\'` matches `NVME-4TB-PRO` and `NVME-2TB-STD`, while PostgreSQL-native `ILIKE` performs locale-aware case folding so `\'%smartnic%\'` and `\'%switch%\'` match `Dual-Port 100GbE SmartNIC` and `24-Port 10GbE L3 Switch` without wrapping `LOWER(name)`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Anchored POSIX Regular Expressions (~*) Without False Positives',
          mission: 'Query `customers` and return `customer_id`, `name`, `email`, `tier`, and `country` for customers in `tier IN (\'pro\', \'standard\')` whose `email` ends in `.de`, `.jp`, `.uk`, or `.fr` using PostgreSQL\'s case-insensitive POSIX regex operator `~*` with an end-of-string `$` anchor (`email ~* \'\\.(de|jp|uk|fr)$\'`) so `.dev` (`elena@vela.dev`) is NOT falsely matched. Sort by `customer_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Match pro/standard customers whose email ends in .de, .jp, .uk, or .fr (do NOT match .dev!)',
            'SELECT customer_id, name, email, tier, country',
            'FROM customers',
            '-- TODO: filter tier IN (\'pro\', \'standard\') AND anchored POSIX regex ~*',
            'ORDER BY customer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT customer_id, name, email, tier, country',
            'FROM customers',
            'WHERE tier IN (\'pro\', \'standard\')',
            '  AND email ~* \'\\.(de|jp|uk|fr)$\'',
            'ORDER BY customer_id ASC;'
          ].join('\n'),
          hints: [
            'In POSIX regular expressions, `.` matches any single character unless escaped as `\\.`, and `$` anchors the match to the end of the string.',
            'Without `$`, `\\.de` matches the substring `.de` inside `elena@vela.dev`!',
            'Combine `tier IN (\'pro\', \'standard\')` with `AND email ~* \'\\.(de|jp|uk|fr)$\'`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '~\\*', flags: 'i', message: 'Use PostgreSQL\'s case-insensitive POSIX regex operator `~*`.' },
              { pattern: '\\$', flags: 'i', message: 'Anchor the regex pattern at the end of `email` with `$`.' }
            ]
          },
          solutionExplanation: 'Because POSIX `~*` tests substring containment by default, escaping the literal dot (`\\.`) and anchoring with `$` (`\'\\.(de|jp|uk|fr)$\'`) rejects `elena@vela.dev` while accurately matching `sophia@kairo.jp` (`4`), `liam@briar.uk` (`5`), and `chloe@solaris.fr` (`7`).'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m01-t05 — ORDER BY, NULLS FIRST/LAST, LIMIT/OFFSET & DISTINCT ON
       ======================================================================== */
    {
      id: 'pg-m01-t05',
      slug: 'sorting-pagination-distinct-on',
      moduleId: 'pg-m01',
      title: 'ORDER BY, NULLS FIRST/LAST, LIMIT/OFFSET & DISTINCT ON',
      difficulty: 'Beginner',
      estimatedMinutes: 14,
      datasetId: 'ecommerce',
      clauses: ['ORDER BY', 'NULLS LAST', 'LIMIT', 'OFFSET', 'DISTINCT ON'],
      tags: ['order-by', 'nulls-last', 'limit', 'distinct-on', 'deduplication'],
      guide: {
        mentalModel: 'Relational tables are **unordered heaps** of 8KB pages: without an explicit `ORDER BY`, PostgreSQL makes zero ordering guarantees, and concurrent `VACUUM` or synchronized sequential scans can return rows in different physical orders across back-to-back executions.\n\nIn PostgreSQL\'s sort comparator, `NULL` is treated as **greater than every non-null value** by default: `ORDER BY col ASC` implies `NULLS LAST`, while `ORDER BY col DESC` implies **`NULLS FIRST`**—causing unshipped or undelivered `NULL` timestamps to float above actual recent timestamps unless overridden with `DESC NULLS LAST`! Furthermore, PostgreSQL provides a uniquely expressive extension to standard `DISTINCT`: `SELECT DISTINCT ON (expr1, ...)`, which emits **only the first row of each equivalence group** as determined by the leading `ORDER BY` sort keys, executing via an efficient `Unique` + `Sort` (or `Incremental Sort` on a B-Tree index) without requiring a window-function subquery.',
        syntaxAnatomy: [
          '-- Pick the single latest order per customer using PostgreSQL DISTINCT ON',
          'SELECT DISTINCT ON (customer_id)',
          '       customer_id,',
          '       order_id,',
          '       status,',
          '       total_cents,',
          '       created_at',
          'FROM orders',
          'ORDER BY customer_id ASC,        -- Leading ORDER BY key(s) MUST match DISTINCT ON (...)',
          '         created_at DESC,        -- Secondary key picks WHICH row wins inside each group',
          '         order_id DESC;          -- Unique tie-breaker guarantees determinism'
        ].join('\n'),
        internalsAndGotchas: [
          'In PostgreSQL (unlike SQLite or MySQL), `ORDER BY col DESC` puts `NULL`s **FIRST** (`NULLS FIRST`)! Always write `DESC NULLS LAST` on nullable timestamp or numeric metrics when you want real values at the top—and align any B-Tree index definition (`CREATE INDEX ... (col DESC NULLS LAST)`) to match.',
          'Pagination with `LIMIT k OFFSET n` WITHOUT a unique tie-breaker column in `ORDER BY` (e.g., `ORDER BY total_cents DESC, order_id ASC`) causes duplicate or skipped rows across pages whenever two rows tie on `total_cents`.',
          'Large `OFFSET` values (`OFFSET 100000`) force PostgreSQL to scan, sort, and discard `100,000` tuples before emitting row `1`; in high-scale OLTP APIs, prefer keyset/cursor pagination (`WHERE (created_at, order_id) < ($1, $2)`).',
          '`SELECT DISTINCT ON (a)` **requires** `a` to appear as the leftmost expression(s) in `ORDER BY`; if you need a final display sort by another column (like `total_cents DESC`), wrap `DISTINCT ON` inside a CTE and sort in the outer query.'
        ],
        whenToUse: 'Use `ORDER BY ... NULLS LAST` with a primary-key tie-breaker for deterministic UI sorting and small-offset pages, and use `DISTINCT ON (key)` whenever selecting the single latest, highest, or earliest full row per entity.'
      },
      scenario: {
        role: 'Order Experience Backend Engineer',
        incidentOrGoal: 'In-transit shipments (`delivered_at IS NULL`) are floating above delivered packages in the tracking feed, Page 2 of the order leaderboard flips tied rows randomly, and customer support needs each customer\'s single most recent order.',
        stakeholderNeed: 'Fix NULL sort ordering with `DESC NULLS LAST`, add tie-broken `LIMIT / OFFSET` pagination, and deduplicate latest orders per customer via `DISTINCT ON`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Taming Descending NULL Placement with DESC NULLS LAST',
          mission: 'Query `shipments` and return `shipment_id`, `order_id`, `carrier`, `shipped_at`, and `delivered_at` sorted with the most recently delivered shipments first (`delivered_at DESC NULLS LAST`), breaking ties by `shipment_id ASC` so undelivered (`NULL`) shipments appear at the bottom.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Fix the sort: plain delivered_at DESC floats NULL shipment #704 to row 1!',
            'SELECT shipment_id, order_id, carrier, shipped_at, delivered_at',
            'FROM shipments',
            'ORDER BY delivered_at DESC, shipment_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT shipment_id, order_id, carrier, shipped_at, delivered_at',
            'FROM shipments',
            'ORDER BY delivered_at DESC NULLS LAST, shipment_id ASC;'
          ].join('\n'),
          hints: [
            'In PostgreSQL, `DESC` defaults to `NULLS FIRST`, which places `shipment_id = 704` (`delivered_at IS NULL`) at row 1.',
            'Append `NULLS LAST` immediately after `delivered_at DESC`.',
            'Keep `, shipment_id ASC` as the deterministic tie-breaker.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bDESC\\s+NULLS\\s+LAST\\b', flags: 'i', message: 'Specify `delivered_at DESC NULLS LAST` to push `NULL` timestamps to the bottom.' }
            ]
          },
          solutionExplanation: 'Appending `NULLS LAST` overrides PostgreSQL\'s default `DESC NULLS FIRST` sort rule, placing delivered shipments (`2025-03-29` down to `2025-02-05`) ahead of in-transit shipment `704` (`NULL`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Tie-Broken Deterministic Pagination with LIMIT & OFFSET',
          mission: 'Query `orders` and return Page 2 (`3` rows per page, skipping the first `3` rows via `LIMIT 3 OFFSET 3`) of `order_id`, `customer_id`, `status`, `total_cents`, and `created_at` sorted by `total_cents DESC, order_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Fetch Page 2 (rows 4..6) sorted by total_cents DESC with order_id ASC tie-breaker',
            'SELECT order_id, customer_id, status, total_cents, created_at',
            'FROM orders',
            '-- TODO: add deterministic ORDER BY and LIMIT 3 OFFSET 3'
          ].join('\n'),
          solutionCode: [
            'SELECT order_id, customer_id, status, total_cents, created_at',
            'FROM orders',
            'ORDER BY total_cents DESC, order_id ASC',
            'LIMIT 3 OFFSET 3;'
          ].join('\n'),
          hints: [
            'Always include the primary key (`order_id ASC`) as the final `ORDER BY` key so ties never shift across page boundaries.',
            'Page 1 is `LIMIT 3 OFFSET 0` (rows 1–3); Page 2 skips `3` rows and takes `3` rows (`LIMIT 3 OFFSET 3`).',
            'You can also write SQL-standard `OFFSET 3 ROWS FETCH NEXT 3 ROWS ONLY`, or idiomatic `LIMIT 3 OFFSET 3`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bORDER\\s+BY\\b', flags: 'i', message: 'Include an `ORDER BY` clause before `LIMIT` / `OFFSET`.' },
              { pattern: '\\bOFFSET\\s+3\\b', flags: 'i', message: 'Skip the first 3 rows using `OFFSET 3`.' },
              { pattern: '(\\bLIMIT\\s+3\\b|\\bFETCH\\s+(FIRST|NEXT)\\s+3\\b)', flags: 'i', message: 'Take 3 rows using `LIMIT 3` (or `FETCH NEXT 3 ROWS ONLY`).' }
            ]
          },
          solutionExplanation: 'PostgreSQL executes `LIMIT 3 OFFSET 3` via a bounded top-N heap sort (`top-N heapsort` memory optimization requiring only 6 tuples in `work_mem` instead of sorting the entire table), emitting ranks 4, 5, and 6 (`1010`, `1006`, `1009`).'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Latest Entity Snapshot with PostgreSQL DISTINCT ON',
          mission: 'Use PostgreSQL\'s `SELECT DISTINCT ON (customer_id)` on `orders` to return each customer\'s single most recent order. Project `customer_id`, `order_id`, `status`, `total_cents`, and `created_at` (in exact order), sorted by `customer_id ASC, created_at DESC, order_id DESC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Return only the single latest order per customer_id using DISTINCT ON',
            'SELECT customer_id, order_id, status, total_cents, created_at',
            'FROM orders',
            '-- TODO: add DISTINCT ON (customer_id) and matching ORDER BY customer_id ASC, created_at DESC, order_id DESC'
          ].join('\n'),
          solutionCode: [
            'SELECT DISTINCT ON (customer_id)',
            '       customer_id,',
            '       order_id,',
            '       status,',
            '       total_cents,',
            '       created_at',
            'FROM orders',
            'ORDER BY customer_id ASC, created_at DESC, order_id DESC;'
          ].join('\n'),
          hints: [
            'Place `DISTINCT ON (customer_id)` right after `SELECT` before the first projected column.',
            'PostgreSQL requires the leftmost `ORDER BY` expression to match `DISTINCT ON (customer_id)` -> start with `ORDER BY customer_id ASC`.',
            'Follow with `, created_at DESC, order_id DESC` so the newest order for each customer comes first in its `customer_id` group and wins!'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bDISTINCT\\s+ON\\s*\\(\\s*customer_id\\s*\\)', flags: 'i', message: 'Use PostgreSQL `DISTINCT ON (customer_id)`.' },
              { pattern: '\\bORDER\\s+BY\\s+customer_id\\b', flags: 'i', message: 'Start `ORDER BY` with `customer_id` to match `DISTINCT ON (customer_id)`.' }
            ]
          },
          solutionExplanation: '`DISTINCT ON (customer_id)` groups adjacent sorted tuples by `customer_id` inside a lightweight `Unique` plan node and retains only the first tuple encountered per group—giving customers `1`, `2`, and `3` their latest orders (`1003`, `1007`, and `1009`) without a `ROW_NUMBER()` subquery.'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m01-t06 — IS NULL, COALESCE, NULLIF & Null-Safe IS DISTINCT FROM
       ======================================================================== */
    {
      id: 'pg-m01-t06',
      slug: 'null-semantics-coalesce-distinct-from',
      moduleId: 'pg-m01',
      title: 'IS NULL, COALESCE, NULLIF & Null-Safe IS DISTINCT FROM',
      difficulty: 'Beginner',
      estimatedMinutes: 12,
      datasetId: 'org_hr',
      clauses: ['IS NULL', 'COALESCE', 'NULLIF', 'IS DISTINCT FROM'],
      tags: ['null', 'coalesce', 'nullif', 'is-distinct-from', 'safe-division'],
      guide: {
        mentalModel: 'In PostgreSQL\'s physical tuple header (`HeapTupleHeaderData`), `NULL` is not a magic sentinel value stored inside data bytes—it is a zero bit in the per-tuple **null bitmap (`t_bits`)** indicating the absence of a value. Because `NULL` represents an unknown or inapplicable attribute, `NULL = NULL` and `NULL <> 2` both evaluate to `UNKNOWN` (`NULL`), and arithmetic with `NULL` (`100 / NULL`) propagates `NULL` cleanly instead of crashing.\n\nPostgreSQL gives you four surgical tools to control `NULL` propagation: `IS [NOT] NULL` inspects the null bitmap directly; `COALESCE(a, b, ...)` short-circuits left-to-right to return the first non-null argument; `NULLIF(x, 0)` turns a hazardous denominator `0` into `NULL` so `num / NULLIF(denom, 0)` yields `NULL` instead of aborting the entire transaction with SQLSTATE `22012` (`division by zero`); and `a IS [NOT] DISTINCT FROM b` treats `NULL` as a comparable value (`NULL IS NOT DISTINCT FROM NULL` is `TRUE`, `NULL IS DISTINCT FROM 2` is `TRUE`).',
        syntaxAnatomy: [
          'SELECT project_id,',
          '       code,',
          '       COALESCE(ROUND(120000::numeric / NULLIF(budget_usd, 0) * 100, 2), 0.00) AS grant_pct',
          'FROM projects;',
          '',
          '-- Null-safe inequality: returns rows where manager_id <> 2 AND rows where manager_id IS NULL!',
          'SELECT emp_id, name, manager_id',
          'FROM employees',
          'WHERE manager_id IS DISTINCT FROM 2;'
        ].join('\n'),
        internalsAndGotchas: [
          'Never write `col = NULL` or `col != NULL` in PostgreSQL: both evaluate to `UNKNOWN` for every row in the table (`transform_null_equals` defaults to `off` for strict SQL standard compliance).',
          'All arguments to `COALESCE(a, b)` must resolve to a common PostgreSQL type (`COALESCE(manager_id, \'none\')` fails with `invalid input syntax for type integer` unless `manager_id::text` is cast first).',
          'Unlike regular functions that evaluate all arguments eagerly before invocation, `COALESCE` is a special parser `CoalesceExpr` node that **short-circuits**—expressions to the right of the first non-null value are not evaluated.',
          'Prior to PostgreSQL 14+, `IS NOT DISTINCT FROM` sometimes bypassed B-Tree indexes; modern PostgreSQL 18 supports `Index Cond` directly on `IS NOT DISTINCT FROM`!'
        ],
        whenToUse: 'Use `IS NULL` for existence checks, `COALESCE` for presentation defaults, `COALESCE(x / NULLIF(y, 0), 0)` to make every production division immune to `22012` transaction aborts, and `IS DISTINCT FROM` whenever comparing two potentially nullable values.'
      },
      scenario: {
        role: 'People & Finance Data Platform Engineer',
        incidentOrGoal: 'An org-chart exporter dropped Chief Architect `Dr. Kavita Sen` (`manager_id IS NULL`) when filtering `manager_id <> 2`, and a quarterly R&D budget dashboard crashed with `ERROR: division by zero` as soon as an exploratory `$0`-budget prototype project was added.',
        stakeholderNeed: 'Build null-aware org-root projections, zero-safe `NULLIF` + `COALESCE` R&D grant ratios, and `IS DISTINCT FROM` reporting-line filters on `org_hr`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Root Executive Detection & COALESCE Fallbacks',
          mission: 'Query `employees` and project 5 columns in exact order: `emp_id`, `name`, `title`, `reporting_to_id` (`COALESCE(manager_id, 0)` so top-level executives display `0` instead of `NULL`), and `is_root_exec` (`manager_id IS NULL` boolean). Sort by `emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Project reporting_to_id (fallback 0) and boolean is_root_exec',
            'SELECT emp_id,',
            '       name,',
            '       title',
            '       -- TODO: COALESCE(manager_id, 0) AS reporting_to_id',
            '       -- TODO: (manager_id IS NULL) AS is_root_exec',
            'FROM employees',
            'ORDER BY emp_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT emp_id,',
            '       name,',
            '       title,',
            '       COALESCE(manager_id, 0) AS reporting_to_id,',
            '       (manager_id IS NULL) AS is_root_exec',
            'FROM employees',
            'ORDER BY emp_id ASC;'
          ].join('\n'),
          hints: [
            'Both `manager_id` and `0` are `INTEGER`, so `COALESCE(manager_id, 0)` cleanly returns an `INTEGER` column.',
            'Use `(manager_id IS NULL) AS is_root_exec` (never `manager_id = NULL`!).',
            'Sort by `emp_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCOALESCE\\s*\\(', flags: 'i', message: 'Use `COALESCE(manager_id, 0)` for `reporting_to_id`.' },
              { pattern: '\\bIS\\s+NULL\\b', flags: 'i', message: 'Use `IS NULL` to compute `is_root_exec`.' }
            ]
          },
          solutionExplanation: '`COALESCE(manager_id, 0)` replaces the null bitmap flag on `emp_id = 1` (`Dr. Kavita Sen`) with `0` while preserving integer type compatibility, and `(manager_id IS NULL)` emits a true SQL `BOOLEAN` (`true` for row 1, `false` for rows 2–9).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Crash-Proof Division with NULLIF & COALESCE',
          mission: 'An unbudgeted exploratory project (`project_id = 40`, `budget_usd = 0`) has been inserted into `projects`. Query `projects` and project `project_id`, `code`, `budget_usd`, and `grant_coverage_pct` — what percentage (`0`–`100`) of `budget_usd` a `$120,000` (`120000`) infrastructure grant covers (`(120000::numeric / NULLIF(budget_usd, 0)) * 100`), rounded to 2 decimal places and wrapped in `COALESCE(..., 0.00)` so zero-budget projects return `0.00` instead of crashing with `division by zero`. Sort by `project_id ASC`.',
          setupSql: 'INSERT INTO projects (project_id, code, title, lead_emp_id, budget_usd) VALUES (40, \'PRJ-LAB\', \'Zero-Budget SIMD Spike\', 7, 0);',
          probeSql: '',
          starterCode: [
            '-- TODO: Remove WHERE budget_usd > 0 so project_id = 40 (budget_usd = 0) is included,',
            '-- and guard against division by zero using NULLIF(budget_usd, 0) + COALESCE(..., 0.00)!',
            'SELECT project_id,',
            '       code,',
            '       budget_usd,',
            '       ROUND((120000::numeric / budget_usd) * 100, 2) AS grant_coverage_pct',
            'FROM projects',
            'WHERE budget_usd > 0',
            'ORDER BY project_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT project_id,',
            '       code,',
            '       budget_usd,',
            '       COALESCE(ROUND((120000::numeric / NULLIF(budget_usd, 0)) * 100, 2), 0.00) AS grant_coverage_pct',
            'FROM projects',
            'ORDER BY project_id ASC;'
          ].join('\n'),
          hints: [
            'Replace `budget_usd` in the denominator with `NULLIF(budget_usd, 0)`—when `budget_usd` is `0`, `NULLIF` returns `NULL`, and `120000 / NULL` safely evaluates to `NULL`.',
            'Wrap `ROUND((120000::numeric / NULLIF(budget_usd, 0)) * 100, 2)` inside `COALESCE(..., 0.00)` so `NULL` becomes `0.00`.',
            'Alias the 4th column `AS grant_coverage_pct` and order by `project_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bNULLIF\\s*\\(\\s*budget_usd\\s*,\\s*0\\s*\\)', flags: 'i', message: 'Guard the denominator with `NULLIF(budget_usd, 0)`.' },
              { pattern: '\\bCOALESCE\\s*\\(', flags: 'i', message: 'Fallback `NULL` division results to `0.00` with `COALESCE(..., 0.00)`.' }
            ]
          },
          solutionExplanation: 'In PostgreSQL, dividing by `0` raises SQLSTATE `22012` and aborts the active transaction block. `NULLIF(budget_usd, 0)` converts `0` into `NULL`, letting `NULL` propagate harmlessly through `/`, `* 100`, and `ROUND(...)` until `COALESCE(..., 0.00)` substitutes `0.00`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Null-Safe Inequality with IS DISTINCT FROM',
          mission: 'Query `employees` to return `emp_id`, `name`, `dept_id`, and `manager_id` for every employee who does NOT report directly to `Vikramaditya Joshi` (`emp_id = 2`) — **including** `Dr. Kavita Sen` whose `manager_id` is `NULL`. Use `manager_id IS DISTINCT FROM 2` and sort by `emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Fix the missing CEO bug: manager_id <> 2 drops emp_id = 1 because NULL <> 2 is UNKNOWN!',
            'SELECT emp_id, name, dept_id, manager_id',
            'FROM employees',
            'WHERE manager_id <> 2',
            'ORDER BY emp_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT emp_id, name, dept_id, manager_id',
            'FROM employees',
            'WHERE manager_id IS DISTINCT FROM 2',
            'ORDER BY emp_id ASC;'
          ].join('\n'),
          hints: [
            '`manager_id <> 2` evaluates to `UNKNOWN` when `manager_id` is `NULL`, excluding `Dr. Kavita Sen` (`emp_id = 1`).',
            'Replace `<> 2` with PostgreSQL\'s null-safe comparison predicate `IS DISTINCT FROM 2`.',
            'Sort by `emp_id ASC` so `emp_id = 1` appears at row 1 and direct reports of `2` (`4, 5, 8`) are excluded.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bIS\\s+DISTINCT\\s+FROM\\s+2\\b', flags: 'i', message: 'Use `manager_id IS DISTINCT FROM 2` for null-safe inequality.' }
            ]
          },
          solutionExplanation: '`manager_id IS DISTINCT FROM 2` treats `NULL` as a distinct known state rather than `UNKNOWN`: `NULL IS DISTINCT FROM 2` returns `TRUE` (preserving `Dr. Kavita Sen`), `2 IS DISTINCT FROM 2` returns `FALSE` (filtering out `4, 5, 8`), and `1/3/6/8 IS DISTINCT FROM 2` returns `TRUE`.'
        }
      ]
    },

    /* ========================================================================
       LAB 07: pg-m01-t07 — CASE Expressions, ::type Casts & Core String/Math Functions
       ======================================================================== */
    {
      id: 'pg-m01-t07',
      slug: 'case-casts-string-math-functions',
      moduleId: 'pg-m01',
      title: 'CASE Expressions, ::type Casts & Core String/Math Functions',
      difficulty: 'Intermediate',
      estimatedMinutes: 14,
      datasetId: 'fintech_ledger',
      clauses: ['CASE WHEN', '::', 'CAST', 'SPLIT_PART', 'ABS'],
      tags: ['case', 'cast', 'strings', 'numeric', 'expressions'],
      guide: {
        mentalModel: 'Searched `CASE WHEN cond1 THEN res1 WHEN cond2 THEN res2 ELSE def END` is PostgreSQL\'s foundational conditional expression node (`CaseExpr`). Branches are evaluated **strictly top-to-bottom with short-circuit termination**: the first `WHEN` condition that evaluates to `TRUE` wins, subsequent `WHEN` branches are skipped, and omitting `ELSE` implicitly defaults to `ELSE NULL`—while PostgreSQL\'s type resolver unifies all `THEN`/`ELSE` branches into a single static output type.\n\nAlongside `CASE`, PostgreSQL provides concise `expr::type` casting (equivalent to SQL-standard `CAST(expr AS type)`), zero-allocation string tokenizers like `SPLIT_PART(string, delimiter, n)` (**1-indexed**, supporting negative indices in PG 14+ to count from the right!), `UPPER`/`LOWER`/`TRIM`, and exact `NUMERIC`-preserving math functions (`ABS`, `ROUND`, `CEIL`, `FLOOR`).',
        syntaxAnatomy: [
          'SELECT transfer_id,',
          '       UPPER(SPLIT_PART(idempotency_key, \'-\', 2)) AS channel,   -- 1-based token extraction',
          '       SPLIT_PART(idempotency_key, \'-\', 3)::integer AS seq_num, -- PostgreSQL ::type cast',
          '       CASE',
          '         WHEN amount_cents >= 250000 THEN \'treasury_tier\'',
          '         WHEN amount_cents >= 50000  THEN \'commercial_tier\'',
          '         ELSE \'micro_tier\'',
          '       END AS volume_band',
          'FROM transfers;'
        ].join('\n'),
        internalsAndGotchas: [
          'Because `CASE WHEN` short-circuits top-down, ordering branches from **most restrictive (`>= 80000`) to least restrictive (`>= 30000`)** is critical; reversing them causes `>= 30000` to shadow `>= 80000`!',
          'Omitting `ELSE` in a `CASE` expression silently returns `NULL` for unmatched rows, which will poison downstream `+` or `||` expressions unless handled.',
          'PostgreSQL\'s `::` cast operator binds **very tightly** (tighter than `+`, `-`, `/`, `*`): `amount_cents / 100::numeric` casts `100` to `numeric` (good!), whereas `(a + b)::numeric` requires parentheses if casting the sum.',
          '`SPLIT_PART(str, delim, field)` is **1-based** (field `1` is the first token; in PG 14+, `-1` extracts the last token!). Passing `0` raises `field position must not be zero`.'
        ],
        whenToUse: 'Use searched `CASE WHEN` for multi-tier classification and signed double-entry ledger pivoting (`credit` vs `debit`), `SPLIT_PART` + `::type` for structured identifier parsing, and `ABS` for unsigned magnitude/variance checks.'
      },
      scenario: {
        role: 'Fraud & Double-Entry Ledger Engineer',
        incidentOrGoal: 'Risk operations needs real-time card transaction risk banding on `merchant_txns`, structured channel/sequence extraction from `transfers.idempotency_key` (`idem-<channel>-<seq>`), and signed/unsigned variance checks on `journal_entries`.',
        stakeholderNeed: 'Author searched `CASE WHEN` classifiers, `SPLIT_PART` + `::integer` parsers, and signed double-entry `ABS` variance queries on `fintech_ledger`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Top-Down Risk Banding with Searched CASE WHEN',
          mission: 'Query `merchant_txns` and project 5 columns in exact order: `txn_id`, `card_id`, `merchant`, `amount_usd` (`ROUND(amount_cents::numeric / 100, 2)`), and `risk_tier` using a `CASE WHEN` expression: `\'high_risk\'` when `amount_cents >= 80000`, `\'elevated\'` when `amount_cents >= 30000`, and `\'routine\'` otherwise (`ELSE`). Sort by `txn_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Classify card transactions into high_risk (>= 80000), elevated (>= 30000), or routine',
            'SELECT txn_id,',
            '       card_id,',
            '       merchant,',
            '       ROUND(amount_cents::numeric / 100, 2) AS amount_usd',
            '       -- TODO: add CASE WHEN ... END AS risk_tier',
            'FROM merchant_txns',
            'ORDER BY txn_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT txn_id,',
            '       card_id,',
            '       merchant,',
            '       ROUND(amount_cents::numeric / 100, 2) AS amount_usd,',
            '       CASE',
            '         WHEN amount_cents >= 80000 THEN \'high_risk\'',
            '         WHEN amount_cents >= 30000 THEN \'elevated\'',
            '         ELSE \'routine\'',
            '       END AS risk_tier',
            'FROM merchant_txns',
            'ORDER BY txn_id ASC;'
          ].join('\n'),
          hints: [
            'Place `WHEN amount_cents >= 80000 THEN \'high_risk\'` BEFORE `WHEN amount_cents >= 30000 THEN \'elevated\'` because `CASE` stops at the first matching branch.',
            'Include `ELSE \'routine\'` and close with `END AS risk_tier`.',
            'Keep `ORDER BY txn_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCASE\\b[\\s\\S]+\\bWHEN\\b[\\s\\S]+\\bEND\\b', flags: 'i', message: 'Use a searched `CASE WHEN ... END` expression.' },
              { pattern: '\\bELSE\\s+\'routine\'', flags: 'i', message: 'Provide `ELSE \'routine\'` for transactions below 30,000 cents.' }
            ]
          },
          solutionExplanation: 'Evaluating `amount_cents >= 80000` first ensures Swiss luxury/electronics transactions (`95000` and `88000` cents) hit `\'high_risk\'` before `>= 30000` classifies AWS and Datadog (`32000` and `34000`) as `\'elevated\'`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Parsing Structured Keys with SPLIT_PART, UPPER & ::integer Casts',
          mission: 'Each `transfers.idempotency_key` follows the format `\'idem-<channel>-<seq>\'` (e.g., `\'idem-seed-101\'`, `\'idem-pay-001\'`). Query `transfers` and project 5 columns in exact order: `transfer_id`, `idempotency_key`, `channel` (the 2nd `-`-delimited token converted to uppercase with `UPPER` and `SPLIT_PART`), `seq_num` (the 3rd `-`-delimited token cast to `INTEGER` via `::integer` or `CAST(... AS integer)`), and `amount_cents`. Sort by `seq_num ASC, transfer_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Parse \'idem-seed-101\' -> channel = \'SEED\', seq_num = 101 (integer!)',
            'SELECT transfer_id,',
            '       idempotency_key,',
            '       -- TODO: UPPER(SPLIT_PART(idempotency_key, \'-\', 2)) AS channel',
            '       -- TODO: SPLIT_PART(idempotency_key, \'-\', 3)::integer AS seq_num',
            '       amount_cents',
            'FROM transfers',
            'ORDER BY transfer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT transfer_id,',
            '       idempotency_key,',
            '       UPPER(SPLIT_PART(idempotency_key, \'-\', 2)) AS channel,',
            '       SPLIT_PART(idempotency_key, \'-\', 3)::integer AS seq_num,',
            '       amount_cents',
            'FROM transfers',
            'ORDER BY seq_num ASC, transfer_id ASC;'
          ].join('\n'),
          hints: [
            '`SPLIT_PART(idempotency_key, \'-\', 2)` extracts `\'seed\'` or `\'pay\'`; wrap it in `UPPER(...) AS channel`.',
            '`SPLIT_PART(idempotency_key, \'-\', 3)` returns `TEXT` (`\'001\'`, `\'101\'`); cast to `::integer` (or `CAST(... AS integer)`) so `\'001\'` becomes numeric `1` and sorts numerically rather than lexicographically!',
            'Sort by `seq_num ASC, transfer_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bSPLIT_PART\\s*\\(', flags: 'i', message: 'Use `SPLIT_PART(idempotency_key, \'-\', ...)` to tokenize `idempotency_key`.' },
              { pattern: '(::\\s*int(eger)?|CAST\\s*\\([\\s\\S]+AS\\s+int(eger)?\\s*\\))', flags: 'i', message: 'Cast the sequence token to `INTEGER` using `::integer` or `CAST(... AS integer)`.' }
            ]
          },
          solutionExplanation: 'Casting the 3rd token with `::integer` strips leading zeros (`\'001\'` -> `1`, `\'002\'` -> `2`, `\'101\'` -> `101`) and enables true numeric sorting instead of ASCII string sorting.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Signed Ledger Postings & ABS Variance Calculation',
          mission: 'Query `journal_entries` and project 5 columns in exact order: `entry_id`, `account_id`, `direction`, `signed_cents` (`+amount_cents` when `direction = \'credit\'`, `-amount_cents` when `direction = \'debit\'`), and `abs_diff_from_5k_usd` — the unsigned absolute difference (`ABS(...)`) between `amount_cents` and a `500000`-cent (`$5,000`) benchmark posting, converted to USD (`::numeric / 100`) and rounded to 2 decimal places. Sort by `entry_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Compute signed_cents (+credit / -debit) and unsigned USD distance from 500000 cents',
            'SELECT entry_id,',
            '       account_id,',
            '       direction',
            '       -- TODO: CASE WHEN direction = \'credit\' THEN amount_cents ELSE -amount_cents END AS signed_cents',
            '       -- TODO: ROUND(ABS(amount_cents - 500000)::numeric / 100, 2) AS abs_diff_from_5k_usd',
            'FROM journal_entries',
            'ORDER BY entry_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT entry_id,',
            '       account_id,',
            '       direction,',
            '       CASE WHEN direction = \'credit\' THEN amount_cents ELSE -amount_cents END AS signed_cents,',
            '       ROUND(ABS(amount_cents - 500000)::numeric / 100, 2) AS abs_diff_from_5k_usd',
            'FROM journal_entries',
            'ORDER BY entry_id ASC;'
          ].join('\n'),
          hints: [
            'Use `CASE WHEN direction = \'credit\' THEN amount_cents ELSE -amount_cents END AS signed_cents` to pivot unsigned ledger postings into signed deltas.',
            'Use `ABS(amount_cents - 500000)` to get the non-negative cent distance from `500000`.',
            'Cast `::numeric / 100` and wrap in `ROUND(..., 2) AS abs_diff_from_5k_usd`, ordered by `entry_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCASE\\s+WHEN\\b', flags: 'i', message: 'Use `CASE WHEN` to compute `signed_cents`.' },
              { pattern: '\\bABS\\s*\\(', flags: 'i', message: 'Use `ABS(...)` to compute the unsigned benchmark variance.' }
            ]
          },
          solutionExplanation: 'Double-entry ledgers store strictly positive `amount_cents` (`CHECK (amount_cents > 0)`) paired with a `direction` enum (`\'debit\'` / `\'credit\'`); `CASE WHEN` converts them into signed integers for balance summation while `ABS(amount_cents - 500000)` measures unsigned magnitude deviation.'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m01-t08 — TIMESTAMPTZ, DATE_TRUNC, GENERATE_SERIES, uuidv7() & Virtual Columns
       ======================================================================== */
    {
      id: 'pg-m01-t08',
      slug: 'timestamptz-generate-series-uuidv7-virtual',
      moduleId: 'pg-m01',
      title: 'TIMESTAMPTZ, DATE_TRUNC, GENERATE_SERIES, uuidv7() & Virtual Columns',
      difficulty: 'Intermediate',
      estimatedMinutes: 16,
      datasetId: 'saas_telemetry',
      clauses: ['TIMESTAMPTZ', 'DATE_TRUNC', 'GENERATE_SERIES', 'uuidv7()', 'GENERATED ALWAYS'],
      tags: ['timestamptz', 'generate-series', 'uuidv7', 'pg18', 'virtual-columns', 'time-series'],
      guide: {
        mentalModel: 'PostgreSQL\'s `TIMESTAMPTZ` (`timestamp with time zone`) does **not** store a time-zone string on disk—it stores a compact **8-byte `int64` count of microseconds since `2000-01-01 00:00:00 UTC`**, converting to/from the session\'s `TimeZone` GUC on input and output. Paired with `DATE_TRUNC(\'month\', ts, \'UTC\')` and the set-returning function `GENERATE_SERIES(start_ts, stop_ts, step_interval)`, PostgreSQL can synthesize zero-gap time-series spines directly inside the executor without external calendar tables.\n\n**New in PostgreSQL 18**, two flagship features transform OLTP schema and expression design: first, native **`uuidv7()`** (RFC 9562 Version 7 UUIDs) embeds a 48-bit millisecond Unix timestamp in the most significant bits followed by cryptographic randomness—eliminating the catastrophic random B-Tree page-split churn and `shared_buffers` thrashing of `gen_random_uuid()` (`UUIDv4`)! Second, **`GENERATED ALWAYS AS (expr) VIRTUAL`** is now the **default** generated-column mode in PostgreSQL 18 (`attgenerated = \'v\'` in `pg_attribute`), computing values on-the-fly during tuple projection with **zero heap/TOAST disk bloat** (unlike `STORED` generated columns).',
        syntaxAnatomy: [
          '-- 1. Synthesize UTC hourly buckets + k-sortable PostgreSQL 18 RFC 9562 uuidv7() keys',
          'SELECT gs AS slot_utc,',
          '       uuidv7() AS event_uuid',
          'FROM GENERATE_SERIES(',
          '  TIMESTAMPTZ \'2025-03-01 00:00:00+00\',',
          '  TIMESTAMPTZ \'2025-03-01 05:00:00+00\',',
          '  INTERVAL \'1 hour\'',
          ') AS gs;',
          '',
          '-- 2. PostgreSQL 18 VIRTUAL generated columns (zero disk bytes stored on heap!)',
          'CREATE TABLE saas_mrr_band (',
          '  sub_id  INTEGER PRIMARY KEY,',
          '  mrr_usd NUMERIC(10,2) NOT NULL,',
          '  arr_usd NUMERIC(12,2) GENERATED ALWAYS AS (mrr_usd * 12) VIRTUAL',
          ');'
        ].join('\n'),
        internalsAndGotchas: [
          'Despite its name, `TIMESTAMP` (`without time zone`) ignores UTC offsets completely and breaks across DST transitions; always use `TIMESTAMPTZ` (`8` bytes, microsecond UTC epoch) for event timestamps.',
          'Random `UUIDv4` (`gen_random_uuid()`) scatters inserts uniformly across every leaf page of a large B-Tree index, causing 50%-full fragmented pages and heavy WAL full-page writes (`FPW`). PostgreSQL 18\'s `uuidv7()` appends monotonically to the rightmost B-Tree leaf page like `BIGINT IDENTITY` while staying globally unique!',
          'In PostgreSQL 18, `GENERATED ALWAYS AS (expr)` without `STORED` or `VIRTUAL` defaults to **`VIRTUAL`**, evaluating at read time with zero heap storage; use `STORED` only when you need to build a B-Tree/GIN index directly on the generated column.',
          '`GENERATE_SERIES(start, stop, step)` is **inclusive** of `stop` whenever `(stop - start)` is an exact multiple of `step` (`00:00` to `05:00` step `1 hour` produces **6** rows, not 5!).'
        ],
        whenToUse: 'Standardize on `TIMESTAMPTZ` + `DATE_TRUNC` + `GENERATE_SERIES` for all time-series reporting, adopt PostgreSQL 18 `uuidv7()` whenever distributed UUID primary/idempotency keys are required, and prefer `GENERATED ALWAYS AS (...) VIRTUAL` for derived columns that do not require materialization on disk.'
      },
      scenario: {
        role: 'Staff Telemetry & Storage Architect',
        incidentOrGoal: 'Telemetry charts have missing time buckets, `UUIDv4` event keys are thrashing B-Tree leaf pages in `shared_buffers`, and storing redundant `arr_usd` columns on disk bloated heap pages by 18%.',
        stakeholderNeed: 'Bucket `user_events` timestamps in UTC with `DATE_TRUNC`, generate a continuous hourly timeline with PostgreSQL 18 `uuidv7()` keys via `GENERATE_SERIES`, and define a table using PostgreSQL 18 `GENERATED ALWAYS AS (...) VIRTUAL` columns.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — UTC TIMESTAMPTZ Casting, DATE_TRUNC Bucketing & Interval Offsets',
          mission: 'Session `TimeZone` is pinned to `\'UTC\'`. Query `user_events` for `event_type = \'query_run\'` and project 5 columns in exact order: `event_id`, `user_id`, `occurred_utc` (`event_ts::timestamptz`), `month_bucket_utc` (`DATE_TRUNC(\'month\', event_ts::timestamptz)`), and `sla_deadline_utc` (`event_ts::timestamptz + INTERVAL \'15 minutes\'`). Sort by `occurred_utc ASC, event_id ASC`.',
          setupSql: 'SET TIME ZONE \'UTC\';',
          probeSql: '',
          starterCode: [
            '-- Cast event_ts to TIMESTAMPTZ, truncate to month, and add a 15-minute SLA window',
            'SELECT event_id,',
            '       user_id',
            '       -- TODO: event_ts::timestamptz AS occurred_utc',
            '       -- TODO: DATE_TRUNC(\'month\', event_ts::timestamptz) AS month_bucket_utc',
            '       -- TODO: event_ts::timestamptz + INTERVAL \'15 minutes\' AS sla_deadline_utc',
            'FROM user_events',
            'WHERE event_type = \'query_run\'',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id,',
            '       user_id,',
            '       event_ts::timestamptz AS occurred_utc,',
            '       DATE_TRUNC(\'month\', event_ts::timestamptz) AS month_bucket_utc,',
            '       event_ts::timestamptz + INTERVAL \'15 minutes\' AS sla_deadline_utc',
            'FROM user_events',
            'WHERE event_type = \'query_run\'',
            'ORDER BY occurred_utc ASC, event_id ASC;'
          ].join('\n'),
          hints: [
            'Cast `event_ts` (stored as `TEXT` in the cross-engine seed) using `event_ts::timestamptz`.',
            'Truncate to the first instant of the UTC month with `DATE_TRUNC(\'month\', event_ts::timestamptz) AS month_bucket_utc`.',
            'Add fifteen minutes using `+ INTERVAL \'15 minutes\' AS sla_deadline_utc` and sort by `occurred_utc ASC, event_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: 'timestamptz', flags: 'i', message: 'Cast `event_ts` to `TIMESTAMPTZ`.' },
              { pattern: '\\bDATE_TRUNC\\s*\\(\\s*\'month\'', flags: 'i', message: 'Bucket timestamps using `DATE_TRUNC(\'month\', ...)`.' },
              { pattern: '\\bINTERVAL\\b', flags: 'i', message: 'Add the 15-minute window using an `INTERVAL` literal.' }
            ]
          },
          solutionExplanation: 'Under `TimeZone = \'UTC\'`, `event_ts::timestamptz` converts ISO strings into 8-byte UTC epoch microseconds, `DATE_TRUNC(\'month\', ...)` zeroes day and time fields to `YYYY-MM-01 00:00:00+00`, and `+ INTERVAL \'15 minutes\'` performs calendar-aware `TIMESTAMPTZ` arithmetic.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Zero-Gap Timelines with GENERATE_SERIES & PG 18 uuidv7()',
          mission: 'Use `GENERATE_SERIES` to synthesize 6 hourly UTC timestamps from `TIMESTAMPTZ \'2025-03-01 00:00:00+00\'` through `TIMESTAMPTZ \'2025-03-01 05:00:00+00\'` stepping by `INTERVAL \'1 hour\'`. Project 3 columns in exact order: `slot_utc` (the generated `TIMESTAMPTZ`), `event_uuid` (a fresh k-sortable RFC 9562 Version 7 UUID minted via PostgreSQL 18\'s `uuidv7()`), and `uuid_ver` (`substring(uuidv7()::text, 15, 1)` confirming version `\'7\'`). Sort by `slot_utc ASC`.',
          setupSql: 'SET TIME ZONE \'UTC\';',
          probeSql: '',
          starterCode: [
            '-- Generate 6 hourly UTC slots (00:00..05:00) and mint PostgreSQL 18 uuidv7() keys',
            'SELECT gs AS slot_utc',
            '       -- TODO: uuidv7() AS event_uuid',
            '       -- TODO: substring(uuidv7()::text, 15, 1) AS uuid_ver',
            'FROM GENERATE_SERIES(',
            '  TIMESTAMPTZ \'2025-03-01 00:00:00+00\',',
            '  TIMESTAMPTZ \'2025-03-01 02:00:00+00\', -- TODO: extend stop bound to 05:00:00+00',
            '  INTERVAL \'1 hour\'',
            ') AS gs',
            'ORDER BY slot_utc ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT gs AS slot_utc,',
            '       uuidv7() AS event_uuid,',
            '       substring(uuidv7()::text, 15, 1) AS uuid_ver',
            'FROM GENERATE_SERIES(',
            '  TIMESTAMPTZ \'2025-03-01 00:00:00+00\',',
            '  TIMESTAMPTZ \'2025-03-01 05:00:00+00\',',
            '  INTERVAL \'1 hour\'',
            ') AS gs',
            'ORDER BY slot_utc ASC;'
          ].join('\n'),
          hints: [
            '`GENERATE_SERIES(start, stop, step)` includes `stop`, so `00:00:00+00` through `05:00:00+00` step `INTERVAL \'1 hour\'` produces 6 rows.',
            'Call PostgreSQL 18\'s built-in `uuidv7()` function for `AS event_uuid` (do NOT use `gen_random_uuid()`, which produces Version 4!).',
            'In canonical UUID text `xxxxxxxx-xxxx-7xxx-...`, character position `15` (`substring(uuidv7()::text, 15, 1)`) is the RFC 9562 version nibble `\'7\'`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            ignoreColumns: ['event_uuid'],
            columnChecks: [
              {
                col: 'event_uuid',
                notNull: true,
                regex: '^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
                message: 'Column `event_uuid` must be a valid RFC 9562 Version 7 UUID generated by PostgreSQL 18 `uuidv7()`.'
              }
            ],
            requiredPatterns: [
              { pattern: '\\bGENERATE_SERIES\\s*\\(', flags: 'i', message: 'Use `GENERATE_SERIES(...)` to synthesize the hourly timeline.' },
              { pattern: '\\buuidv7\\s*\\(\\s*\\)', flags: 'i', message: 'Use PostgreSQL 18\'s built-in `uuidv7()` function.' }
            ]
          },
          solutionExplanation: '`GENERATE_SERIES` streams 6 hourly `TIMESTAMPTZ` values directly from a `FunctionScan` node without touching disk, while PostgreSQL 18\'s native `uuidv7()` mints time-ordered RFC 9562 Version 7 UUIDs (verified by version nibble `7` at character 15 and variant `[89ab]` at character 20) that keep B-Tree index appends sequential.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Zero-Bloat Derived Attributes with PG 18 VIRTUAL Generated Columns',
          mission: 'Create table `telemetry_virtual_rollup` using `CREATE TABLE` with 5 columns: `sample_id INTEGER PRIMARY KEY`, `org_name TEXT NOT NULL`, `mrr_usd NUMERIC(10,2) NOT NULL`, `arr_usd NUMERIC(12,2) GENERATED ALWAYS AS (mrr_usd * 12) VIRTUAL`, and `tier_band TEXT GENERATED ALWAYS AS (CASE WHEN mrr_usd >= 1000 THEN \'enterprise\' ELSE \'growth\' END) VIRTUAL`. Both derived columns MUST be PostgreSQL 18 `VIRTUAL` generated columns (`attgenerated = \'v\'`).',
          setupSql: '',
          probeSql: [
            'INSERT INTO telemetry_virtual_rollup (sample_id, org_name, mrr_usd) VALUES',
            '  (1, \'VectorLabs\', 1200.00),',
            '  (2, \'PulseMetrics\', 350.00),',
            '  (3, \'ChronosDB\', 1500.00);',
            'SELECT sample_id,',
            '       org_name,',
            '       mrr_usd,',
            '       arr_usd,',
            '       tier_band,',
            '       (SELECT COUNT(*)::int FROM pg_attribute WHERE attrelid = \'telemetry_virtual_rollup\'::regclass AND attgenerated = \'v\') AS virtual_col_count',
            'FROM telemetry_virtual_rollup',
            'ORDER BY sample_id ASC;'
          ].join('\n'),
          starterCode: [
            '-- Define telemetry_virtual_rollup with two PostgreSQL 18 VIRTUAL generated columns',
            'CREATE TABLE telemetry_virtual_rollup (',
            '  sample_id INTEGER PRIMARY KEY,',
            '  org_name  TEXT NOT NULL,',
            '  mrr_usd   NUMERIC(10,2) NOT NULL',
            '  -- TODO: arr_usd NUMERIC(12,2) GENERATED ALWAYS AS (mrr_usd * 12) VIRTUAL',
            '  -- TODO: tier_band TEXT GENERATED ALWAYS AS (CASE WHEN mrr_usd >= 1000 THEN \'enterprise\' ELSE \'growth\' END) VIRTUAL',
            ');'
          ].join('\n'),
          solutionCode: [
            'CREATE TABLE telemetry_virtual_rollup (',
            '  sample_id INTEGER PRIMARY KEY,',
            '  org_name  TEXT NOT NULL,',
            '  mrr_usd   NUMERIC(10,2) NOT NULL,',
            '  arr_usd   NUMERIC(12,2) GENERATED ALWAYS AS (mrr_usd * 12) VIRTUAL,',
            '  tier_band TEXT GENERATED ALWAYS AS (',
            '    CASE WHEN mrr_usd >= 1000 THEN \'enterprise\' ELSE \'growth\' END',
            '  ) VIRTUAL',
            ');'
          ].join('\n'),
          hints: [
            'Use PostgreSQL 18\'s `GENERATED ALWAYS AS (...) VIRTUAL` syntax (not `STORED`) on both `arr_usd` and `tier_band`.',
            '`arr_usd` has type `NUMERIC(12,2)` with expression `(mrr_usd * 12)`.',
            '`tier_band` has type `TEXT` with expression `(CASE WHEN mrr_usd >= 1000 THEN \'enterprise\' ELSE \'growth\' END)`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bGENERATED\\s+ALWAYS\\s+AS\\b', flags: 'i', message: 'Declare derived columns with `GENERATED ALWAYS AS (...)`.' },
              { pattern: '\\bVIRTUAL\\b', flags: 'i', message: 'Explicitly mark the generated columns as PostgreSQL 18 `VIRTUAL`.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\bSTORED\\b', flags: 'i', message: 'Use PostgreSQL 18 `VIRTUAL` generated columns rather than `STORED` so zero extra bytes are written to heap pages.' }
            ]
          },
          solutionExplanation: 'PostgreSQL 18 records `VIRTUAL` generated columns in `pg_attribute` (`attgenerated = \'v\'`) and `pg_attrdef`, expanding their expressions at query rewrite/projection time rather than materializing bytes inside every heap tuple and WAL record.'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
