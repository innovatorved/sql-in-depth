/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 03 (`pg-m03`): All Joins, Set Operations, Subqueries, LATERAL & CTEs
 * 8 Hands-On Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m03'] = [
    /* ========================================================================
       LAB 01: pg-m03-t01 — INNER JOIN, Multi-Table Chains & Preventing Join Fan-Out
       ======================================================================== */
    {
      id: 'pg-m03-t01',
      slug: 'inner-join-multi-table-fanout',
      moduleId: 'pg-m03',
      title: 'INNER JOIN, Multi-Table Chains & Preventing Join Fan-Out',
      difficulty: 'Beginner',
      estimatedMinutes: 14,
      datasetId: 'ecommerce',
      clauses: ['INNER JOIN', 'ON', 'USING', 'WITH', 'GROUP BY'],
      tags: ['inner-join', 'using', 'fan-out', 'chasm-trap', 'multi-table-join'],
      guide: {
        mentalModel: 'In PostgreSQL 18, an `INNER JOIN` compiles to one of three physical join operators chosen by the dynamic-programming cost optimizer (`join_collapse_limit`, default `8`): **Nested Loop** (ideal for small outer inputs probing an indexed inner relation), **Hash Join** (builds an in-memory or batched hash table in `work_mem` on the smaller relation), or **Merge Join** (zips two pre-sorted streams in linear time). Because `INNER JOIN` is both commutative and associative, PostgreSQL freely reorders multi-table inner joins to minimize intermediate tuple cardinality.\n\nHowever, relational algebra multiplies cardinalities across independent 1-to-N child branches—a classic **chasm trap (join fan-out)**. Joining `orders` (1 row) to `order_items` (`M` rows) and `payments` (`K` rows) produces `M × K` intermediate tuples per order, silently inflating `SUM(o.total_cents)` or `SUM(p.amount_cents)`. Pre-aggregating child tables to the parent grain (`GROUP BY order_id`) inside a CTE before joining restores strict 1-to-1 cardinality.',
        syntaxAnatomy: [
          'WITH item_rollup AS (',
          '  SELECT order_id, COUNT(*) AS item_lines, SUM(quantity * unit_price_cents) AS items_cents',
          '  FROM order_items',
          '  GROUP BY order_id',
          ')',
          'SELECT o.order_id, c.name, r.item_lines, r.items_cents, p.amount_cents',
          'FROM orders o',
          'INNER JOIN customers c USING (customer_id)',
          'INNER JOIN item_rollup r USING (order_id)',
          'INNER JOIN payments p ON p.order_id = o.order_id AND p.status = \'settled\';'
        ].join('\n'),
        internalsAndGotchas: [
          'Joining two independent 1-to-N child tables (`order_items` and `payments`) directly to `orders` creates an `M × K` Cartesian explosion per `order_id`; pre-aggregate `1-to-N` children before joining.',
          '`JOIN ... USING (order_id)` merges both join key columns into a single unqualified output column `order_id`, whereas `JOIN ... ON a.order_id = b.order_id` retains both `a.order_id` and `b.order_id` in scope.',
          'Never use `NATURAL JOIN` in production PostgreSQL schemas—adding an audit column like `status` or `created_at` to a second table silently alters the join predicate (`orders.status = payments.status`) and drops valid rows.',
          'When chaining more than `join_collapse_limit` (default `8`) tables, PostgreSQL switches to heuristic/GEQO planning unless join order is structured deliberately.'
        ],
        whenToUse: 'Use `INNER JOIN` with `ON` or `USING` when every entity must match across tables, and wrap `1-to-N` detail tables in pre-aggregated CTEs before joining sibling facts to prevent double counting.'
      },
      scenario: {
        role: 'Commerce Analytics Staff Engineer',
        incidentOrGoal: 'A multi-table revenue report joined `orders`, `order_items`, and `payments` directly, causing multi-line orders (`1001` and `1006`) to double-count settled payment totals.',
        stakeholderNeed: 'Build clean multi-table `INNER JOIN` pipelines using `ON`, `USING`, and grain-aligned CTE pre-aggregation so line-item subtotals reconcile 1-to-1 against settled payments.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Three-Table INNER JOIN Across Orders, Items & Catalog',
          mission: 'Join `order_items oi`, `orders o`, and `products p` using `INNER JOIN ... ON` for completed orders only (`o.status = \'completed\'`). Project 5 columns in exact order: `order_item_id`, `order_id`, `sku`, `quantity`, and `line_total_usd` (`oi.quantity * oi.unit_price_cents` converted to USD and rounded to 2 decimal places). Sort by `order_item_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Join order_items, orders, and products for completed orders',
            'SELECT oi.order_item_id,',
            '       oi.order_id,',
            '       oi.quantity',
            '       -- TODO: join orders o and products p, project p.sku and line_total_usd',
            'FROM order_items oi',
            'ORDER BY oi.order_item_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT oi.order_item_id,',
            '       oi.order_id,',
            '       p.sku,',
            '       oi.quantity,',
            '       ROUND((oi.quantity * oi.unit_price_cents)::numeric / 100, 2) AS line_total_usd',
            'FROM order_items oi',
            'INNER JOIN orders o ON o.order_id = oi.order_id',
            'INNER JOIN products p ON p.product_id = oi.product_id',
            'WHERE o.status = \'completed\'',
            'ORDER BY oi.order_item_id ASC;'
          ].join('\n'),
          hints: [
            'Chain two `INNER JOIN` clauses: `INNER JOIN orders o ON o.order_id = oi.order_id` and `INNER JOIN products p ON p.product_id = oi.product_id`.',
            'Filter `WHERE o.status = \'completed\'` so cancelled, pending, and refunded order items are excluded.',
            'Compute `ROUND((oi.quantity * oi.unit_price_cents)::numeric / 100, 2) AS line_total_usd` and sort by `oi.order_item_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bJOIN\\s+orders\\b', flags: 'i', message: 'Join `order_items` to `orders`.' },
              { pattern: '\\bJOIN\\s+products\\b', flags: 'i', message: 'Join `order_items` to `products`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL pushes `o.status = \'completed\'` into the `orders` scan first, then joins qualifying `order_items` and `products` keys while projecting exact `NUMERIC` USD line totals.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Clean Equi-Join Chains with USING (...) Without Column Ambiguity',
          mission: 'Chain `customers`, `orders`, and `payments` with `INNER JOIN ... USING (customer_id)` and `INNER JOIN ... USING (order_id)` for settled payments (`payments.status = \'settled\'`). Note that both `orders` and `payments` have a `status` column! Project 6 columns in exact order: `payment_id`, `order_id`, `customer_id`, `customer_name` (`customers.name`), `method`, and `settled_usd` (`payments.amount_cents` in USD rounded to 2 decimal places). Sort by `payment_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Chain customers -> orders -> payments with USING (...) for settled payments',
            'SELECT p.payment_id,',
            '       p.method',
            '       -- TODO: use INNER JOIN ... USING (customer_id) and USING (order_id)',
            'FROM payments p',
            'ORDER BY p.payment_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT p.payment_id,',
            '       order_id,',
            '       customer_id,',
            '       c.name AS customer_name,',
            '       p.method,',
            '       ROUND(p.amount_cents::numeric / 100, 2) AS settled_usd',
            'FROM customers c',
            'INNER JOIN orders o USING (customer_id)',
            'INNER JOIN payments p USING (order_id)',
            'WHERE p.status = \'settled\'',
            'ORDER BY p.payment_id ASC;'
          ].join('\n'),
          hints: [
            'Join `customers c INNER JOIN orders o USING (customer_id) INNER JOIN payments p USING (order_id)`.',
            'Because both `orders` and `payments` contain a `status` column, qualify `WHERE p.status = \'settled\'` explicitly (this is also why `NATURAL JOIN` would have dangerously joined on `status` too!).',
            'Reference merged `USING` keys (`order_id`, `customer_id`) and compute `ROUND(p.amount_cents::numeric / 100, 2) AS settled_usd`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUSING\\s*\\(\\s*customer_id\\s*\\)', flags: 'i', message: 'Use `USING (customer_id)` to join `customers` and `orders`.' },
              { pattern: '\\bUSING\\s*\\(\\s*order_id\\s*\\)', flags: 'i', message: 'Use `USING (order_id)` to join `orders` and `payments`.' }
            ]
          },
          solutionExplanation: '`USING (customer_id)` and `USING (order_id)` deduplicate shared foreign-key names cleanly without colliding on identically named non-key columns like `orders.status` and `payments.status`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Eliminating 1-to-N Join Fan-Out via Pre-Aggregated CTEs',
          mission: 'Prevent double-counting settled payments on multi-item orders (`1001`, `1006`): write a `WITH` CTE that pre-aggregates `order_items` per `order_id` into `item_lines` (`COUNT(*)`), `units_sold` (`SUM(quantity)`), and `items_subtotal_cents` (`SUM(quantity * unit_price_cents)`), then `INNER JOIN` `orders o`, your CTE, and `payments p` (`p.status = \'settled\'`). Project 5 columns in exact order: `order_id`, `item_lines`, `units_sold`, `items_subtotal_cents`, and `settled_cents` (`p.amount_cents`). Sort by `order_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Pre-aggregate order_items per order_id in a CTE before joining orders and settled payments',
            'SELECT o.order_id,',
            '       o.total_cents',
            'FROM orders o',
            '-- TODO: wrap order_items rollup in WITH ... AS (...) and INNER JOIN payments p (settled)',
            'ORDER BY o.order_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH item_rollup AS (',
            '  SELECT order_id,',
            '         COUNT(*) AS item_lines,',
            '         SUM(quantity) AS units_sold,',
            '         SUM(quantity * unit_price_cents) AS items_subtotal_cents',
            '  FROM order_items',
            '  GROUP BY order_id',
            ')',
            'SELECT o.order_id,',
            '       r.item_lines,',
            '       r.units_sold,',
            '       r.items_subtotal_cents,',
            '       p.amount_cents AS settled_cents',
            'FROM orders o',
            'INNER JOIN item_rollup r ON r.order_id = o.order_id',
            'INNER JOIN payments p ON p.order_id = o.order_id',
            'WHERE p.status = \'settled\'',
            'ORDER BY o.order_id ASC;'
          ].join('\n'),
          hints: [
            'In your `WITH` CTE, `GROUP BY order_id` on `order_items` to compute `COUNT(*) AS item_lines`, `SUM(quantity) AS units_sold`, and `SUM(quantity * unit_price_cents) AS items_subtotal_cents`.',
            'Because `item_rollup` has exactly 1 row per `order_id`, joining `orders o`, `item_rollup r`, and `payments p` preserves 1-to-1 order cardinality.',
            'Filter `WHERE p.status = \'settled\'`, alias `p.amount_cents AS settled_cents`, and sort by `o.order_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bWITH\\b', flags: 'i', message: 'Use a `WITH` CTE to pre-aggregate `order_items` to the `order_id` grain.' },
              { pattern: '\\bJOIN\\s+payments\\b', flags: 'i', message: 'Join `payments` to reconcile `items_subtotal_cents` against `settled_cents`.' }
            ]
          },
          solutionExplanation: 'Aggregating `order_items` to one row per `order_id` before joining `payments` eliminates the `1-to-N` fan-out on orders `1001` and `1006`, ensuring `items_subtotal_cents` matches `settled_cents` (`550500` total cents across 7 settled orders instead of inflated duplicates).'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m03-t02 — LEFT / RIGHT OUTER JOIN, Anti-Joins & ON vs WHERE Placement
       ======================================================================== */
    {
      id: 'pg-m03-t02',
      slug: 'left-right-outer-join-on-vs-where',
      moduleId: 'pg-m03',
      title: 'LEFT / RIGHT OUTER JOIN, Anti-Joins & ON vs WHERE Placement',
      difficulty: 'Beginner',
      estimatedMinutes: 14,
      datasetId: 'ecommerce',
      clauses: ['LEFT JOIN', 'RIGHT JOIN', 'ON', 'WHERE', 'IS NULL', 'COALESCE'],
      tags: ['left-join', 'right-join', 'anti-join', 'on-vs-where', 'outer-join'],
      guide: {
        mentalModel: 'In PostgreSQL 18, `A LEFT OUTER JOIN B ON P` executes in two logical phases: first, match tuples `(a, b)` where predicate `P` evaluates to `TRUE`; second, for every left tuple `a` that matched zero rows in `B`, emit `(a, NULL, NULL, ...)` with all `B` columns padded with `NULL`. Critically, outer joins are **neither commutative nor freely associative with inner predicates**.\n\nIf you place a strict filter on the nullable right table inside `WHERE` (for example, `WHERE o.status = \'completed\'`), `NULL = \'completed\'` evaluates to `UNKNOWN` for every `NULL`-padded customer row, **silently reducing the `LEFT JOIN` to an `INNER JOIN`**—PostgreSQL\'s planner (`reduce_outer_joins` in `prepjointree.c`) literally rewrites it into an `INNER JOIN`! Moving `AND o.status = \'completed\'` into the `ON` clause filters `orders` *before* `NULL`-padding, preserving every customer. Conversely, `LEFT JOIN ... WHERE b.pk IS NULL` tests for `NULL`-padded rows deliberately, which PostgreSQL recognizes when `b.pk` cannot otherwise be null and compiles into a fast **Hash Anti Join** or **Nested Loop Anti Join** that short-circuits on the first match.',
        syntaxAnatomy: [
          '-- Filter right-side column in ON to preserve unmatched left rows:',
          'SELECT c.customer_id, c.name, COUNT(o.order_id) AS completed_orders',
          'FROM customers c',
          'LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = \'completed\'',
          'GROUP BY c.customer_id, c.name;',
          '',
          '-- Anti-join: find left rows with zero matches on the right:',
          'SELECT p.product_id, p.sku FROM products p',
          'LEFT JOIN order_items oi ON oi.product_id = p.product_id',
          'WHERE oi.order_item_id IS NULL;'
        ].join('\n'),
        internalsAndGotchas: [
          'Putting `WHERE right_tbl.col = \'x\'` after `LEFT JOIN right_tbl` rejects `NULL`-padded rows (`NULL = \'x\'` is `UNKNOWN`), silently converting your `LEFT JOIN` into an `INNER JOIN`.',
          'Always use `COUNT(right_tbl.pk)` rather than `COUNT(*)` after a `LEFT JOIN`—`COUNT(*)` counts the `NULL`-padded row as `1` instead of `0`!',
          'In anti-joins (`LEFT JOIN b ON ... WHERE b.col IS NULL`), always test a `NOT NULL` column (such as `b`\'s primary key or the join key), otherwise genuine `NULL` data values in `b.col` look like non-matches.',
          '`A RIGHT OUTER JOIN B` is algebraically identical to `B LEFT OUTER JOIN A`; PostgreSQL normalizes right joins internally, though `RIGHT JOIN` remains useful when extending an existing pipeline without rewriting the `FROM` anchor.'
        ],
        whenToUse: 'Use `LEFT JOIN` with right-table filters inside `ON` whenever every parent entity must appear in reports (even with `0` activity), and `LEFT JOIN ... WHERE right_pk IS NULL` (or `NOT EXISTS`) for anti-join orphan/gap detection.'
      },
      scenario: {
        role: 'Growth & Fulfillment Analytics Engineer',
        incidentOrGoal: 'Customer retention dashboards dropped inactive signups (`Chloe Moreau` and `Sophia Takahashi`) because `o.status = \'completed\'` was placed in `WHERE` instead of `ON` and `COUNT(*)` reported `1` order for zero-order customers.',
        stakeholderNeed: 'Fix the full-cohort customer `LEFT JOIN` scorecard, detect unordered dead-stock SKUs via an anti-join, and audit unshipped completed orders using `RIGHT OUTER JOIN`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — LEFT JOIN ON vs WHERE: Full Customer Cohort Spend Scorecard',
          mission: 'Preserve ALL 8 rows from `customers c` while joining `orders o` for completed orders only (`o.status = \'completed\'` placed inside `ON`, NOT `WHERE`). Project 5 columns in exact order: `customer_id`, `name`, `tier`, `completed_orders` (`COUNT(o.order_id)`), and `completed_spend_usd` (`COALESCE(SUM(o.total_cents), 0)` converted to USD rounded to 2 decimal places). Sort by `completed_spend_usd DESC, customer_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Fix the ON vs WHERE trap so all 8 customers remain in the result',
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       COUNT(*) AS completed_orders',
            'FROM customers c',
            'LEFT JOIN orders o ON o.customer_id = c.customer_id',
            'WHERE o.status = \'completed\'',
            'GROUP BY c.customer_id, c.name, c.tier',
            'ORDER BY c.customer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       COUNT(o.order_id) AS completed_orders,',
            '       ROUND(COALESCE(SUM(o.total_cents), 0)::numeric / 100, 2) AS completed_spend_usd',
            'FROM customers c',
            'LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = \'completed\'',
            'GROUP BY c.customer_id, c.name, c.tier',
            'ORDER BY completed_spend_usd DESC, c.customer_id ASC;'
          ].join('\n'),
          hints: [
            'Move `AND o.status = \'completed\'` from `WHERE` directly into the `LEFT JOIN orders o ON ...` predicate so customers without completed orders are `NULL`-padded rather than filtered out.',
            'Use `COUNT(o.order_id)` instead of `COUNT(*)` so `NULL`-padded customers (`Sophia Takahashi` and `Chloe Moreau`) report `0` orders.',
            'Wrap `SUM(o.total_cents)` in `COALESCE(..., 0)` before dividing `::numeric / 100` and rounding to 2 decimals, then sort by `completed_spend_usd DESC, c.customer_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bLEFT\\s+(?:OUTER\\s+)?JOIN\\b', flags: 'i', message: 'Use `LEFT JOIN` to retain all 8 customers.' },
              { pattern: '\\bCOUNT\\s*\\(\\s*o\\.order_id\\s*\\)', flags: 'i', message: 'Use `COUNT(o.order_id)` so unmatched customers count as `0`.' }
            ]
          },
          solutionExplanation: 'Keeping `AND o.status = \'completed\'` inside `ON` lets PostgreSQL filter `orders` prior to outer `NULL`-padding, preserving customers `4` (`Sophia`, cancelled only) and `7` (`Chloe`, zero orders) with `0` completed orders and `0.00` USD.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — LEFT JOIN ... IS NULL Anti-Join: Unordered Dead-Stock Catalog Audit',
          mission: 'Use a `LEFT JOIN ... WHERE ... IS NULL` anti-join between `products p` and `order_items oi` to find products that have never appeared on any order line. Project 5 columns in exact order: `product_id`, `sku`, `name`, `price_cents`, and `is_active`. Sort by `product_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Find products with zero rows in order_items using a LEFT JOIN anti-join',
            'SELECT p.product_id,',
            '       p.sku,',
            '       p.name,',
            '       p.price_cents,',
            '       p.is_active',
            'FROM products p',
            '-- TODO: LEFT JOIN order_items oi and filter for NULL match',
            'ORDER BY p.product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT p.product_id,',
            '       p.sku,',
            '       p.name,',
            '       p.price_cents,',
            '       p.is_active',
            'FROM products p',
            'LEFT JOIN order_items oi ON oi.product_id = p.product_id',
            'WHERE oi.order_item_id IS NULL',
            'ORDER BY p.product_id ASC;'
          ].join('\n'),
          hints: [
            'Join `LEFT JOIN order_items oi ON oi.product_id = p.product_id` so unordered products have `NULL` across all `oi.*` columns.',
            'Filter `WHERE oi.order_item_id IS NULL` (or `oi.product_id IS NULL`) to isolate only the `NULL`-padded anti-join rows.',
            'Keep `ORDER BY p.product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bLEFT\\s+(?:OUTER\\s+)?JOIN\\b', flags: 'i', message: 'Use `LEFT JOIN` against `order_items`.' },
              { pattern: '\\bIS\\s+NULL\\b', flags: 'i', message: 'Filter `WHERE oi.order_item_id IS NULL` (or `oi.product_id IS NULL`) to complete the anti-join.' }
            ]
          },
          solutionExplanation: 'Because `oi.order_item_id` (and `oi.product_id`) are constrained `NOT NULL`, PostgreSQL\'s planner proves `IS NULL` can hold only on outer-join non-matches and executes an Anti Join returning SKU `TAPE-LTO9-18T` (`product_id = 108`).'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — RIGHT OUTER JOIN: Auditing Unshipped & In-Transit Completed Orders',
          mission: 'Start `FROM shipments s` and use `RIGHT OUTER JOIN orders o ON s.order_id = o.order_id` filtered to `WHERE o.status = \'completed\'` so every completed order appears even if no shipment record exists yet. Project 5 columns in exact order: `order_id` (`o.order_id`), `customer_id` (`o.customer_id`), `total_cents` (`o.total_cents`), `carrier` (`COALESCE(s.carrier, \'UNSHIPPED\')`), and `delivery_state` (`\'UNSHIPPED\'` when `s.shipment_id IS NULL`, `\'IN_TRANSIT\'` when `s.delivered_at IS NULL`, else `\'DELIVERED\'`). Sort by `o.order_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Audit all completed orders starting FROM shipments s with RIGHT OUTER JOIN orders o',
            'SELECT o.order_id,',
            '       o.customer_id,',
            '       o.total_cents',
            '       -- TODO: project carrier and delivery_state using RIGHT OUTER JOIN',
            'FROM shipments s',
            'JOIN orders o ON s.order_id = o.order_id',
            'WHERE o.status = \'completed\'',
            'ORDER BY o.order_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT o.order_id,',
            '       o.customer_id,',
            '       o.total_cents,',
            '       COALESCE(s.carrier, \'UNSHIPPED\') AS carrier,',
            '       CASE',
            '         WHEN s.shipment_id IS NULL THEN \'UNSHIPPED\'',
            '         WHEN s.delivered_at IS NULL THEN \'IN_TRANSIT\'',
            '         ELSE \'DELIVERED\'',
            '       END AS delivery_state',
            'FROM shipments s',
            'RIGHT OUTER JOIN orders o ON s.order_id = o.order_id',
            'WHERE o.status = \'completed\'',
            'ORDER BY o.order_id ASC;'
          ].join('\n'),
          hints: [
            'Replace `JOIN` with `RIGHT OUTER JOIN orders o ON s.order_id = o.order_id`; filtering `WHERE o.status = \'completed\'` is safe because `orders o` is the preserved side of the `RIGHT OUTER JOIN`!',
            'Use `COALESCE(s.carrier, \'UNSHIPPED\') AS carrier` to label digital/unshipped completed orders (`1003` and `1008`).',
            'Use a `CASE` expression checking `s.shipment_id IS NULL` first (`\'UNSHIPPED\'`), then `s.delivered_at IS NULL` (`\'IN_TRANSIT\'` for order `1006`), else `\'DELIVERED\'`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bRIGHT\\s+(?:OUTER\\s+)?JOIN\\b', flags: 'i', message: 'Use `RIGHT OUTER JOIN` (or `RIGHT JOIN`) with `orders o` as the preserved right relation.' },
              { pattern: '\\bCOALESCE\\s*\\(', flags: 'i', message: 'Use `COALESCE(s.carrier, \'UNSHIPPED\')` to default missing carriers.' }
            ]
          },
          solutionExplanation: 'In `shipments s RIGHT OUTER JOIN orders o`, `orders` is the preserved side, so `WHERE o.status = \'completed\'` keeps all 7 completed orders while `NULL`-padding `s.*` for unshipped license orders `1003` and `1008`.'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m03-t03 — FULL OUTER JOIN Reconciliation & CROSS JOIN Grids
       ======================================================================== */
    {
      id: 'pg-m03-t03',
      slug: 'full-outer-reconciliation-cross-join',
      moduleId: 'pg-m03',
      title: 'FULL OUTER JOIN Reconciliation & CROSS JOIN Grids',
      difficulty: 'Intermediate',
      estimatedMinutes: 14,
      datasetId: 'fintech_ledger',
      clauses: ['FULL OUTER JOIN', 'CROSS JOIN', 'COALESCE', 'VALUES', 'LEFT JOIN'],
      tags: ['full-outer-join', 'cross-join', 'reconciliation', 'cartesian-grid', 'ledger'],
      guide: {
        mentalModel: 'In PostgreSQL 18, `A FULL OUTER JOIN B ON P` preserves unmatched tuples from **both** inputs—emitting `(a, b)` for matches, `(a, NULL)` for left-only rows, and `(NULL, b)` for right-only rows. Physically, PostgreSQL can execute an equi-condition `FULL OUTER JOIN` only via **Hash Full Join** or **Merge Full Join** (a standard Nested Loop cannot easily track unprobed inner tuples without extra bookkeeping; non-equi `FULL JOIN` conditions force a Merge/Hash fallback error or expensive materialization).\n\nBecause either side\'s join key can be `NULL` in the output, you must project `COALESCE(a.key, b.key)` (or use `FULL OUTER JOIN ... USING (key)`) when identifying or sorting rows. Complementarily, `A CROSS JOIN B` computes the unconditional Cartesian product (`|A| × |B|` rows via Nested Loop). Paired with a subsequent `LEFT JOIN` to sparse fact tables, `CROSS JOIN` generates **dense reporting matrices** (every account × every direction or calendar bucket) with zero-filled cells instead of missing rows.',
        syntaxAnatomy: [
          '-- Two-sided reconciliation with FULL OUTER JOIN:',
          'SELECT COALESCE(o.account_id, i.account_id) AS account_id,',
          '       COALESCE(o.sent_cents, 0) AS sent_cents,',
          '       COALESCE(i.received_cents, 0) AS received_cents',
          'FROM outbound o',
          'FULL OUTER JOIN inbound i ON o.account_id = i.account_id;',
          '',
          '-- Dense zero-filled matrix with CROSS JOIN + LEFT JOIN:',
          'SELECT a.account_id, d.direction, COALESCE(SUM(j.amount_cents), 0) AS total_cents',
          'FROM accounts a',
          'CROSS JOIN (VALUES (\'debit\'), (\'credit\')) AS d(direction)',
          'LEFT JOIN journal_entries j ON j.account_id = a.account_id AND j.direction = d.direction',
          'GROUP BY a.account_id, d.direction;'
        ].join('\n'),
        internalsAndGotchas: [
          'In `a FULL OUTER JOIN b ON a.id = b.id`, selecting `a.id` alone yields `NULL` for right-only rows! Always wrap shared keys in `COALESCE(a.id, b.id)` or join with `USING (id)`.',
          'PostgreSQL requires mergeable or hashable equality predicates for `FULL OUTER JOIN`; non-equi `FULL JOIN ON a.ts < b.ts` raises `FULL JOIN is only supported with merge-joinable or hash-joinable join conditions`.',
          'Accidental `CROSS JOIN` (or comma-join `FROM t1, t2` missing a `WHERE` clause) multiplies row counts (`10^5 × 10^5 = 10^{10}` rows); reserve `CROSS JOIN` for small bounded dimensions (`accounts × directions/months`) or single-row summary CTEs.'
        ],
        whenToUse: 'Use `FULL OUTER JOIN` to reconcile two independent ledgers or activity streams where either side may contain unmatched keys, and `CROSS JOIN` + `LEFT JOIN` to build dense zero-filled reporting grids.'
      },
      scenario: {
        role: 'Core Banking Ledger Reconciliation Engineer',
        incidentOrGoal: 'Treasury settlement account `100` only initiates outbound transfers (`received_cents` missing), while merchant checking accounts `102` and `103` only receive transfers (`sent_cents` missing) and have zero `debit` rows in `journal_entries`.',
        stakeholderNeed: 'Reconcile two-sided transfer flows and wire-vs-card channel usage with `FULL OUTER JOIN`, then generate a complete 8-row `account × direction` ledger grid with `CROSS JOIN`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — FULL OUTER JOIN: Outbound vs Inbound Transfer Flow Reconciliation',
          mission: 'Build two CTEs from `transfers`: `outbound` (`from_account_id AS account_id, SUM(amount_cents) AS sent_cents GROUP BY from_account_id`) and `inbound` (`to_account_id AS account_id, SUM(amount_cents) AS received_cents GROUP BY to_account_id`). Reconcile them with `FULL OUTER JOIN` and project 4 columns in exact order: `account_id` (`COALESCE` of both keys), `sent_cents` (`0` if missing), `received_cents` (`0` if missing), and `net_transfer_cents` (`received_cents - sent_cents` after zero-filling). Sort by `account_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Reconcile outbound vs inbound transfer sums across all participating accounts',
            'WITH outbound AS (',
            '  SELECT from_account_id AS account_id, SUM(amount_cents) AS sent_cents',
            '  FROM transfers',
            '  GROUP BY from_account_id',
            ')',
            '-- TODO: add inbound CTE and FULL OUTER JOIN both sides with COALESCE',
            'SELECT account_id, sent_cents FROM outbound ORDER BY account_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH outbound AS (',
            '  SELECT from_account_id AS account_id, SUM(amount_cents) AS sent_cents',
            '  FROM transfers',
            '  GROUP BY from_account_id',
            '),',
            'inbound AS (',
            '  SELECT to_account_id AS account_id, SUM(amount_cents) AS received_cents',
            '  FROM transfers',
            '  GROUP BY to_account_id',
            ')',
            'SELECT COALESCE(o.account_id, i.account_id) AS account_id,',
            '       COALESCE(o.sent_cents, 0) AS sent_cents,',
            '       COALESCE(i.received_cents, 0) AS received_cents,',
            '       COALESCE(i.received_cents, 0) - COALESCE(o.sent_cents, 0) AS net_transfer_cents',
            'FROM outbound o',
            'FULL OUTER JOIN inbound i ON o.account_id = i.account_id',
            'ORDER BY account_id ASC;'
          ].join('\n'),
          hints: [
            'Define `inbound` grouping `transfers` by `to_account_id AS account_id` with `SUM(amount_cents) AS received_cents`.',
            'Join `outbound o FULL OUTER JOIN inbound i ON o.account_id = i.account_id` so account `100` (outbound-only) and accounts `102, 103` (inbound-only) are both preserved.',
            'Use `COALESCE(o.account_id, i.account_id) AS account_id` and `COALESCE(..., 0)` on both sums before computing `net_transfer_cents`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bFULL\\s+(?:OUTER\\s+)?JOIN\\b', flags: 'i', message: 'Use `FULL OUTER JOIN` to retain both outbound-only and inbound-only accounts.' },
              { pattern: '\\bCOALESCE\\s*\\(', flags: 'i', message: 'Use `COALESCE` to unify `account_id` and zero-fill missing side totals.' }
            ]
          },
          solutionExplanation: 'Hash Full Join combines `{100, 101}` from `outbound` with `{101, 102, 103}` from `inbound`; `COALESCE` merges the nullable keys and reveals zero-sum conservation (`-825000 + 415000 + 260000 + 150000 = 0`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — FULL OUTER JOIN Channel Classification: Wire Outflows vs Card Spend',
          mission: 'Build two CTEs: `wire_out` (`from_account_id AS account_id, SUM(amount_cents) AS wire_cents` from `transfers GROUP BY from_account_id`) and `card_out` (`c.account_id, SUM(m.amount_cents) AS card_cents` from `cards c INNER JOIN merchant_txns m ON m.card_id = c.card_id GROUP BY c.account_id`). Combine them with `FULL OUTER JOIN` and project 4 columns in exact order: `account_id`, `wire_cents` (`0` if null), `card_cents` (`0` if null), and `channel_profile` (`\'WIRE_ONLY\'` when `card_out` is null, `\'CARD_ONLY\'` when `wire_out` is null, else `\'WIRE_AND_CARD\'`). Sort by `account_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Classify accounts across outbound wire transfers and corporate card spend',
            'WITH wire_out AS (',
            '  SELECT from_account_id AS account_id, SUM(amount_cents) AS wire_cents',
            '  FROM transfers',
            '  GROUP BY from_account_id',
            ')',
            '-- TODO: add card_out CTE and FULL OUTER JOIN with channel_profile CASE',
            'SELECT account_id, wire_cents FROM wire_out ORDER BY account_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH wire_out AS (',
            '  SELECT from_account_id AS account_id, SUM(amount_cents) AS wire_cents',
            '  FROM transfers',
            '  GROUP BY from_account_id',
            '),',
            'card_out AS (',
            '  SELECT c.account_id, SUM(m.amount_cents) AS card_cents',
            '  FROM cards c',
            '  INNER JOIN merchant_txns m ON m.card_id = c.card_id',
            '  GROUP BY c.account_id',
            ')',
            'SELECT COALESCE(w.account_id, cd.account_id) AS account_id,',
            '       COALESCE(w.wire_cents, 0) AS wire_cents,',
            '       COALESCE(cd.card_cents, 0) AS card_cents,',
            '       CASE',
            '         WHEN cd.account_id IS NULL THEN \'WIRE_ONLY\'',
            '         WHEN w.account_id IS NULL THEN \'CARD_ONLY\'',
            '         ELSE \'WIRE_AND_CARD\'',
            '       END AS channel_profile',
            'FROM wire_out w',
            'FULL OUTER JOIN card_out cd ON w.account_id = cd.account_id',
            'ORDER BY account_id ASC;'
          ].join('\n'),
          hints: [
            'In `card_out`, join `cards c INNER JOIN merchant_txns m ON m.card_id = c.card_id` and `GROUP BY c.account_id` (returns accounts `101` and `102`).',
            'Join `wire_out w FULL OUTER JOIN card_out cd ON w.account_id = cd.account_id` so `100` (wire-only), `101` (both), and `102` (card-only) all appear.',
            'Test `cd.account_id IS NULL` (`\'WIRE_ONLY\'`) and `w.account_id IS NULL` (`\'CARD_ONLY\'`) in a `CASE` expression.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bFULL\\s+(?:OUTER\\s+)?JOIN\\b', flags: 'i', message: 'Use `FULL OUTER JOIN` between `wire_out` and `card_out`.' },
              { pattern: '\\bCASE\\b', flags: 'i', message: 'Use a `CASE` expression to classify `channel_profile`.' }
            ]
          },
          solutionExplanation: '`FULL OUTER JOIN` exercises all three reconciliation buckets simultaneously: account `100` (`WIRE_ONLY`), account `101` (`WIRE_AND_CARD`), and account `102` (`CARD_ONLY`).'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — CROSS JOIN + LEFT JOIN: Dense Zero-Filled Account × Direction Grid',
          mission: 'Generate all 8 `(account_id, direction)` combinations by `CROSS JOIN`-ing `accounts a` with `(VALUES (\'credit\'), (\'debit\')) AS d(direction)`, then `LEFT JOIN journal_entries j` matching both `account_id` and `direction`. Project 5 columns in exact order: `account_id`, `owner_name`, `direction`, `entry_count` (`COUNT(j.entry_id)`), and `total_cents` (`COALESCE(SUM(j.amount_cents), 0)`). Sort by `a.account_id ASC, d.direction ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Build a complete 4 accounts x 2 directions = 8-row zero-filled matrix',
            'SELECT a.account_id,',
            '       a.owner_name,',
            '       j.direction,',
            '       COUNT(j.entry_id) AS entry_count',
            'FROM accounts a',
            'LEFT JOIN journal_entries j ON j.account_id = a.account_id',
            'GROUP BY a.account_id, a.owner_name, j.direction',
            'ORDER BY a.account_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT a.account_id,',
            '       a.owner_name,',
            '       d.direction,',
            '       COUNT(j.entry_id) AS entry_count,',
            '       COALESCE(SUM(j.amount_cents), 0) AS total_cents',
            'FROM accounts a',
            'CROSS JOIN (VALUES (\'credit\'), (\'debit\')) AS d(direction)',
            'LEFT JOIN journal_entries j',
            '  ON j.account_id = a.account_id',
            ' AND j.direction = d.direction',
            'GROUP BY a.account_id, a.owner_name, d.direction',
            'ORDER BY a.account_id ASC, d.direction ASC;'
          ].join('\n'),
          hints: [
            'Use `FROM accounts a CROSS JOIN (VALUES (\'credit\'), (\'debit\')) AS d(direction)` to materialize all 8 `(account_id, direction)` cells first.',
            '`LEFT JOIN journal_entries j ON j.account_id = a.account_id AND j.direction = d.direction` so missing cells (`102 debit` and `103 debit`) stay present with `NULL` journal columns.',
            'Group by `a.account_id, a.owner_name, d.direction`, project `COUNT(j.entry_id) AS entry_count` and `COALESCE(SUM(j.amount_cents), 0) AS total_cents`, and sort by `a.account_id ASC, d.direction ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCROSS\\s+JOIN\\b', flags: 'i', message: 'Use `CROSS JOIN` to generate the full `accounts × directions` Cartesian grid.' },
              { pattern: '\\bLEFT\\s+(?:OUTER\\s+)?JOIN\\b', flags: 'i', message: 'Use `LEFT JOIN journal_entries` to preserve zero-entry cells.' }
            ]
          },
          solutionExplanation: '`CROSS JOIN` produces the exact 8-row domain (`4 accounts × 2 directions`), and the subsequent `LEFT JOIN` fills `0` entries / `0` cents for accounts `102` and `103` on the `debit` side instead of omitting those rows.'
        }
      ]
    },

    /* ========================================================================
       LAB 04: pg-m03-t04 — SELF JOIN Hierarchies & Non-Equi / Temporal Range Joins
       ======================================================================== */
    {
      id: 'pg-m03-t04',
      slug: 'self-join-non-equi-asof-joins',
      moduleId: 'pg-m03',
      title: 'SELF JOIN Hierarchies & Non-Equi / Temporal Range Joins',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'org_hr',
      clauses: ['LEFT JOIN', 'INNER JOIN', 'ON', 'COALESCE', 'ABS'],
      tags: ['self-join', 'non-equi-join', 'temporal-join', 'hierarchy', 'pair-dedup'],
      guide: {
        mentalModel: 'A **self-join** is not a distinct SQL keyword—it simply scans the same physical heap (`employees`) twice under two mandatory correlation aliases (`employees e` and `employees m`), giving each range-table entry (`RangeTblEntry`) its own independent tuple slot in PostgreSQL\'s executor. For adjacency-list hierarchies (`e.manager_id = m.emp_id`), using `LEFT JOIN` ensures root nodes (`manager_id IS NULL`) are preserved rather than silently dropped.\n\nWhen pairing peers within the same group (`e1.dept_id = e2.dept_id`), an unrestricted equality join matches every row with itself `(a, a)` and emits symmetric mirror pairs `(a, b)` plus `(b, a)`; adding the strict inequality `AND e1.emp_id < e2.emp_id` yields the exact `N(N - 1)/2` unordered combinations. More generally, **non-equi joins** (`ON h.hired_at::date > sh.effective_date::date AND h.hired_at::date <= sh.effective_date::date + 180`) cannot use Hash Join (which hashes equality keys only), so PostgreSQL executes them via **Nested Loop** (with an index range scan on the inner B-Tree when indexed) or **Merge Join** boundaries.',
        syntaxAnatomy: [
          '-- 1. Adjacency hierarchy self-join (LEFT JOIN keeps root CEO):',
          'SELECT e.emp_id, e.name, COALESCE(m.name, \'BOARD_ROOT\') AS manager_name',
          'FROM employees e',
          'LEFT JOIN employees m ON e.manager_id = m.emp_id;',
          '',
          '-- 2. Unordered peer pairs + non-equi range join:',
          'SELECT e1.name AS emp_a, e2.name AS emp_b',
          'FROM employees e1',
          'INNER JOIN employees e2 ON e1.dept_id = e2.dept_id AND e1.emp_id < e2.emp_id;'
        ].join('\n'),
        internalsAndGotchas: [
          'Omitting table aliases on `FROM employees JOIN employees` raises `table name "employees" specified more than once`; every self-join instance requires a distinct alias (`e`, `m`).',
          'Using `e1.emp_id <> e2.emp_id` for peer comparison still emits every pair **twice** (`(A, B)` and `(B, A)`); use `e1.emp_id < e2.emp_id` to emit each unordered pair once.',
          'Hash Join in PostgreSQL ONLY supports equality (`=`) join clauses; purely non-equi predicates (`<`, `<=`, `BETWEEN`) execute as Nested Loop (potentially `O(N × M)` without a supporting B-Tree/GiST index).',
          'When date columns are stored as ISO `TEXT` strings, cast explicitly (`hired_at::date`) before applying date-integer offsets (`+ 180`) or interval arithmetic.'
        ],
        whenToUse: 'Use aliased self-joins for 1-hop manager lookups and `emp_a < emp_b` peer comparisons, and non-equi range joins for temporal window correlation (events occurring within `K` days after an effective date).'
      },
      scenario: {
        role: 'People Analytics & Compensation Engineer',
        incidentOrGoal: 'Compensation review scripts dropped Chief Architect `Dr. Kavita Sen` due to an inner self-join, emitted duplicate `(A, B)` / `(B, A)` peer band rows, and lacked temporal window joins linking salary band adjustments to subsequent hires.',
        stakeholderNeed: 'Deliver a root-safe manager compensation gap table, deduplicated intra-department peer salary deltas, and a 180-day post-raise hiring window audit.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Root-Safe Manager Hierarchy Self-Join',
          mission: 'Left-join `employees e` to `employees m` (`e.manager_id = m.emp_id`) so all 9 employees—including root `Dr. Kavita Sen`—appear. Project 5 columns in exact order: `emp_id` (`e.emp_id`), `employee_name` (`e.name`), `manager_name` (`COALESCE(m.name, \'BOARD_ROOT\')`), `employee_salary` (`e.salary_usd`), and `manager_gap_usd` (`COALESCE(m.salary_usd - e.salary_usd, 0)`). Sort by `e.emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Self-join employees e to employees m without losing the CEO root row',
            'SELECT e.emp_id,',
            '       e.name AS employee_name,',
            '       e.salary_usd AS employee_salary',
            '       -- TODO: LEFT JOIN employees m and project manager_name + manager_gap_usd',
            'FROM employees e',
            'ORDER BY e.emp_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT e.emp_id,',
            '       e.name AS employee_name,',
            '       COALESCE(m.name, \'BOARD_ROOT\') AS manager_name,',
            '       e.salary_usd AS employee_salary,',
            '       COALESCE(m.salary_usd - e.salary_usd, 0) AS manager_gap_usd',
            'FROM employees e',
            'LEFT JOIN employees m ON e.manager_id = m.emp_id',
            'ORDER BY e.emp_id ASC;'
          ].join('\n'),
          hints: [
            'Alias `employees e` as the direct report and `LEFT JOIN employees m ON e.manager_id = m.emp_id` as the manager.',
            'Use `COALESCE(m.name, \'BOARD_ROOT\') AS manager_name` for `emp_id = 1` whose `manager_id` is `NULL`.',
            'Compute `COALESCE(m.salary_usd - e.salary_usd, 0) AS manager_gap_usd` and sort by `e.emp_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bLEFT\\s+(?:OUTER\\s+)?JOIN\\s+employees\\b', flags: 'i', message: 'Use `LEFT JOIN employees` with an alias to preserve the root employee.' },
              { pattern: '\\bCOALESCE\\s*\\(', flags: 'i', message: 'Use `COALESCE` to handle `NULL` manager columns on the root row.' }
            ]
          },
          solutionExplanation: 'Two distinct aliases (`e` and `m`) bind two independent scans over `employees`, while `LEFT JOIN` keeps `Dr. Kavita Sen` with `BOARD_ROOT` and a `0` manager gap.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Deduplicated Intra-Department Peer Salary Comparison (e1.emp_id < e2.emp_id)',
          mission: 'Self-join `employees e1` and `employees e2` within the same `dept_id` using `e1.emp_id < e2.emp_id` so self-pairs and mirror duplicates are eliminated. Project 4 columns in exact order: `dept_id` (`e1.dept_id`), `emp_a` (`e1.name`), `emp_b` (`e2.name`), and `salary_diff_usd` (`ABS(e1.salary_usd - e2.salary_usd)`). Sort by `salary_diff_usd ASC, e1.emp_id ASC, e2.emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Compare unique unordered employee pairs in the same department',
            'SELECT e1.dept_id,',
            '       e1.name AS emp_a',
            '       -- TODO: INNER JOIN employees e2 on same dept_id with e1.emp_id < e2.emp_id',
            'FROM employees e1',
            'ORDER BY e1.emp_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT e1.dept_id,',
            '       e1.name AS emp_a,',
            '       e2.name AS emp_b,',
            '       ABS(e1.salary_usd - e2.salary_usd) AS salary_diff_usd',
            'FROM employees e1',
            'INNER JOIN employees e2',
            '  ON e1.dept_id = e2.dept_id',
            ' AND e1.emp_id < e2.emp_id',
            'ORDER BY salary_diff_usd ASC, e1.emp_id ASC, e2.emp_id ASC;'
          ].join('\n'),
          hints: [
            'Join `employees e1 INNER JOIN employees e2 ON e1.dept_id = e2.dept_id AND e1.emp_id < e2.emp_id`.',
            'Compute `ABS(e1.salary_usd - e2.salary_usd) AS salary_diff_usd` for the absolute pay spread.',
            'Sort by `salary_diff_usd ASC, e1.emp_id ASC, e2.emp_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bJOIN\\s+employees\\b', flags: 'i', message: 'Self-join `employees` to a second alias `e2`.' },
              { pattern: '<', flags: '', message: 'Use `<` (`e1.emp_id < e2.emp_id`) to eliminate self-matches and mirror pairs.' }
            ]
          },
          solutionExplanation: 'PostgreSQL hashes `e1.dept_id = e2.dept_id` and applies the residual join filter `e1.emp_id < e2.emp_id`, emitting exactly 7 unordered peer pairs across departments `2`, `3`, and `4`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Non-Equi Temporal Range Join: Hires Within 180 Days After a Raise',
          mission: 'Use a non-equi temporal join between `salary_history sh` and `employees h` matching hires whose `h.hired_at::date` occurred strictly AFTER `sh.effective_date::date` and on or before `sh.effective_date::date + 180` (`180` days later). Project 5 columns in exact order: `history_id` (`sh.history_id`), `effective_date` (`sh.effective_date`), `new_hire_id` (`h.emp_id`), `new_hire_name` (`h.name`), and `days_after_raise` (`(h.hired_at::date - sh.effective_date::date)`). Sort by `sh.history_id ASC, h.emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Non-equi temporal window join: employees hired in (effective_date, effective_date + 180 days]',
            'SELECT sh.history_id,',
            '       sh.effective_date',
            '       -- TODO: INNER JOIN employees h using a non-equi ::date range condition',
            'FROM salary_history sh',
            'ORDER BY sh.history_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT sh.history_id,',
            '       sh.effective_date,',
            '       h.emp_id AS new_hire_id,',
            '       h.name AS new_hire_name,',
            '       (h.hired_at::date - sh.effective_date::date) AS days_after_raise',
            'FROM salary_history sh',
            'INNER JOIN employees h',
            '  ON h.hired_at::date > sh.effective_date::date',
            ' AND h.hired_at::date <= sh.effective_date::date + 180',
            'ORDER BY sh.history_id ASC, h.emp_id ASC;'
          ].join('\n'),
          hints: [
            'Cast both `TEXT` ISO dates with `::date`: `ON h.hired_at::date > sh.effective_date::date AND h.hired_at::date <= sh.effective_date::date + 180`.',
            'In PostgreSQL, subtracting two `DATE` values (`date_b - date_a`) returns an exact `INTEGER` day count.',
            'Alias `h.emp_id AS new_hire_id`, `h.name AS new_hire_name`, and sort by `sh.history_id ASC, h.emp_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '::date', flags: 'i', message: 'Cast `hired_at::date` and `effective_date::date` for exact PostgreSQL `DATE` range math.' },
              { pattern: '<=', flags: '', message: 'Bound the upper temporal window with `<= sh.effective_date::date + 180`.' }
            ]
          },
          solutionExplanation: 'Because the join predicate contains only range inequalities (`>` and `<=`), PostgreSQL executes a Nested Loop evaluating `(h.hired_at::date - sh.effective_date::date)` as an exact integer day delta.'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m03-t05 — Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT
       ======================================================================== */
    {
      id: 'pg-m03-t05',
      slug: 'set-operations-union-intersect-except',
      moduleId: 'pg-m03',
      title: 'Set Operations: UNION vs UNION ALL, INTERSECT & EXCEPT',
      difficulty: 'Intermediate',
      estimatedMinutes: 12,
      datasetId: 'social_graph',
      clauses: ['UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT'],
      tags: ['union-all', 'intersect', 'except', 'set-operations', 'graph-edges'],
      guide: {
        mentalModel: 'PostgreSQL 18 implements relational algebra\'s vertical set operators (`UNION`, `INTERSECT`, `EXCEPT`) over compatible row schemas—matching **column count and compatible data types by position**, taking output column names from the **first** query branch. Crucially, `UNION ALL` compiles to a zero-overhead **`Append`** node that streams tuples directly from each child plan without buffering.\n\nBy contrast, `UNION`, `INTERSECT`, and `EXCEPT` enforce set uniqueness (treating two `NULL` values in corresponding columns as **not distinct**, i.e., equal for set membership!), forcing PostgreSQL to inject **`HashSetOp` / `HashAggregate`** or **`Sort` + `Unique` / `SetOp`** across the entire result stream. PostgreSQL also supports `INTERSECT ALL` and `EXCEPT ALL` multiset (bag) semantics, and binds `INTERSECT` with **higher operator precedence** than `UNION` and `EXCEPT`—always parenthesize mixed set expressions explicitly.',
        syntaxAnatomy: [
          '-- Zero-sort streaming concatenation with UNION ALL:',
          'SELECT author_id AS user_id, \'post\' AS kind, published_at AS ts FROM posts',
          'UNION ALL',
          'SELECT follower_id AS user_id, \'follow\' AS kind, followed_at AS ts FROM follows',
          'ORDER BY ts ASC;  -- Single trailing ORDER BY sorts the combined output',
          '',
          '-- Set difference with EXCEPT:',
          'SELECT user_id FROM post_likes',
          'EXCEPT',
          'SELECT author_id FROM posts;'
        ].join('\n'),
        internalsAndGotchas: [
          'Defaulting to `UNION` instead of `UNION ALL` when branches are already disjoint (for example, tagged with `\'post_published\'` vs `\'followed_user\'`) wastes CPU and `work_mem` hashing/sorting every tuple.',
          '`INTERSECT` binds tighter than `UNION` and `EXCEPT` in standard SQL and PostgreSQL (`A UNION B INTERSECT C` parses as `A UNION (B INTERSECT C)`).',
          'Individual `SELECT` branches inside a set operation cannot have bare `ORDER BY` or `LIMIT` clauses unless wrapped in parentheses `(SELECT ... ORDER BY ... LIMIT 5) UNION ALL (...)`; an unparenthesized trailing `ORDER BY` applies to the final combined set.',
          'Unlike `WHERE a = b`, set operations treat `NULL` and `NULL` as **duplicates/matches** (`IS NOT DISTINCT FROM` semantics).'
        ],
        whenToUse: 'Use `UNION ALL` to stack heterogeneous event tables into unified timelines without deduplication overhead, `INTERSECT` to find shared tuples/reciprocal graph edges, and `EXCEPT` to compute set differences cleanly.'
      },
      scenario: {
        role: 'Social Feed & Graph Infrastructure Engineer',
        incidentOrGoal: 'Timeline fan-in queries paid unnecessary `Sort + Unique` latency from `UNION` instead of `UNION ALL`, while graph discovery needed clean set-algebra queries for reciprocal follows and lurker cohorts.',
        stakeholderNeed: 'Build a streaming `UNION ALL` activity timeline, extract mutual follow edges with `INTERSECT`, and isolate engaged readers who have never authored a post with `EXCEPT`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Zero-Overhead Unified Activity Feed with UNION ALL',
          mission: 'Stack two activity streams for users `1` and `3` (`user_id IN (1, 3)`) using `UNION ALL`: from `posts` emit `(author_id AS user_id, \'post_published\' AS activity_type, published_at AS activity_date)` and from `follows` emit `(follower_id AS user_id, \'followed_user\' AS activity_type, followed_at AS activity_date)`. Project those exact 3 columns (`user_id`, `activity_type`, `activity_date`) and sort the combined output by `activity_date ASC, user_id ASC, activity_type ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Combine post publications and outbound follow events for users 1 and 3 with UNION ALL',
            'SELECT author_id AS user_id,',
            '       \'post_published\' AS activity_type,',
            '       published_at AS activity_date',
            'FROM posts',
            'WHERE author_id IN (1, 3)',
            '-- TODO: UNION ALL outbound follows for follower_id IN (1, 3) and sort combined output',
            'ORDER BY activity_date ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT author_id AS user_id,',
            '       \'post_published\' AS activity_type,',
            '       published_at AS activity_date',
            'FROM posts',
            'WHERE author_id IN (1, 3)',
            'UNION ALL',
            'SELECT follower_id AS user_id,',
            '       \'followed_user\' AS activity_type,',
            '       followed_at AS activity_date',
            'FROM follows',
            'WHERE follower_id IN (1, 3)',
            'ORDER BY activity_date ASC, user_id ASC, activity_type ASC;'
          ].join('\n'),
          hints: [
            'Use `UNION ALL` (not `UNION`) because the literal discriminator `\'post_published\'` vs `\'followed_user\'` already guarantees the two branches are disjoint.',
            'Filter the second branch with `WHERE follower_id IN (1, 3)` so predicates push down into each `Append` child scan.',
            'Place a single `ORDER BY activity_date ASC, user_id ASC, activity_type ASC` at the very end.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUNION\\s+ALL\\b', flags: 'i', message: 'Use `UNION ALL` to stream both branches via an `Append` node without deduplication.' }
            ]
          },
          solutionExplanation: '`UNION ALL` compiles directly to an `Append` plan over `posts` and `follows`, taking output column names (`user_id`, `activity_type`, `activity_date`) from the first branch.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Reciprocal Graph Edges via INTERSECT',
          mission: 'Use `INTERSECT` on `follows` to find all directed edges `(user_a, user_b)` where `user_a` follows `user_b` AND `user_b` also follows `user_a` back (intersect `(follower_id AS user_a, followee_id AS user_b)` with the reversed projection `(followee_id AS user_a, follower_id AS user_b)`). Project 2 columns in exact order: `user_a`, `user_b`. Sort by `user_a ASC, user_b ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Find reciprocal follow edges using INTERSECT between forward and reversed edges',
            'SELECT follower_id AS user_a,',
            '       followee_id AS user_b',
            'FROM follows',
            '-- TODO: INTERSECT with reversed (followee_id, follower_id) projection',
            'ORDER BY user_a ASC, user_b ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT follower_id AS user_a,',
            '       followee_id AS user_b',
            'FROM follows',
            'INTERSECT',
            'SELECT followee_id AS user_a,',
            '       follower_id AS user_b',
            'FROM follows',
            'ORDER BY user_a ASC, user_b ASC;'
          ].join('\n'),
          hints: [
            'Project `follower_id AS user_a, followee_id AS user_b FROM follows` in the top branch.',
            'Write `INTERSECT` followed by `SELECT followee_id AS user_a, follower_id AS user_b FROM follows` so one-way follows `(1, 5)` and `(3, 5)` are eliminated.',
            'Sort the final result by `user_a ASC, user_b ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bINTERSECT\\b', flags: 'i', message: 'Use `INTERSECT` to keep only bidirectional `(user_a, user_b)` edges.' }
            ]
          },
          solutionExplanation: 'Intersecting `(follower_id, followee_id)` with `(followee_id, follower_id)` retains only pairs where both `(u, v)` and `(v, u)` exist in `follows`, cleanly dropping asymmetric edges `(1, 5)` and `(3, 5)`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Engaged Lurkers via EXCEPT Set Difference',
          mission: 'Define a CTE `lurker_ids` using `EXCEPT` that finds `user_id` values present in `post_likes` (`SELECT user_id FROM post_likes`) minus `author_id` values present in `posts` (`SELECT author_id FROM posts`). Join `lurker_ids` to `profiles p` and project 3 columns in exact order: `user_id`, `handle`, and `reputation`. Sort by `p.user_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Isolate users who liked posts but never authored a post using EXCEPT',
            'SELECT p.user_id,',
            '       p.handle,',
            '       p.reputation',
            'FROM profiles p',
            '-- TODO: wrap (SELECT user_id FROM post_likes EXCEPT SELECT author_id FROM posts) in a CTE and join',
            'ORDER BY p.user_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH lurker_ids AS (',
            '  SELECT user_id FROM post_likes',
            '  EXCEPT',
            '  SELECT author_id FROM posts',
            ')',
            'SELECT p.user_id,',
            '       p.handle,',
            '       p.reputation',
            'FROM profiles p',
            'INNER JOIN lurker_ids l ON l.user_id = p.user_id',
            'ORDER BY p.user_id ASC;'
          ].join('\n'),
          hints: [
            'Inside `WITH lurker_ids AS (...)`, write `SELECT user_id FROM post_likes EXCEPT SELECT author_id FROM posts`.',
            '`EXCEPT` automatically deduplicates multiple likes per user while subtracting every author.',
            'Join `profiles p INNER JOIN lurker_ids l ON l.user_id = p.user_id` and sort by `p.user_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bEXCEPT\\b', flags: 'i', message: 'Use `EXCEPT` to subtract post authors from post likers.' }
            ]
          },
          solutionExplanation: '`EXCEPT` executes a `HashSetOp` subtracting `{1, 2, 3, 5}` (`posts.author_id`) from `{1, 2, 3, 4, 5}` (`post_likes.user_id`), isolating `@lamport_paxos` (`user_id = 4`).'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m03-t06 — Scalar & Correlated Subqueries, EXISTS & The NOT IN (NULL) Trap
       ======================================================================== */
    {
      id: 'pg-m03-t06',
      slug: 'subqueries-exists-not-in-null-trap',
      moduleId: 'pg-m03',
      title: 'Scalar & Correlated Subqueries, EXISTS & The NOT IN (NULL) Trap',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'ecommerce',
      clauses: ['EXISTS', 'NOT EXISTS', 'ALL', 'ANY', 'SELECT'],
      tags: ['subqueries', 'exists', 'not-exists', 'not-in-null-trap', 'semi-join'],
      guide: {
        mentalModel: 'PostgreSQL\'s planner (`subselect.c` and `prepjointree.c`) distinguishes **uncorrelated sublinks** (evaluated once as an `InitPlan` or pulled up into a hash/semi-join) from **correlated `SubPlan`s** (parameterized by outer tuple columns). Whenever `EXISTS (SELECT 1 FROM ...)` appears in `WHERE`, PostgreSQL pulls it up into a physical **Semi Join** (`Hash Semi Join` or `Nested Loop Semi Join`) that **never duplicates outer rows** even when multiple inner rows match, and short-circuits on the first qualifying inner tuple.\n\nBy contrast, `x NOT IN (SELECT y FROM t)` harbors SQL\'s most infamous production outage bug: it expands to `x <> y1 AND x <> y2 AND ...`. If **even a single `y` in the subquery is `NULL`** (like `customers.referred_by` for unreferred signups!), `x <> NULL` evaluates to `UNKNOWN`, and `TRUE AND UNKNOWN` collapses to `UNKNOWN`—returning **0 rows across the entire query**! Furthermore, PostgreSQL cannot convert `NOT IN (subquery)` into a hashed anti-join unless nulls are handled (`Hashed SubPlan` still scans and tracks `NULL` flags). **`NOT EXISTS`** tests boolean row existence (`TRUE`/`FALSE`, never `UNKNOWN`), cleanly ignores `NULL` keys, and always compiles to a fast **Anti Join**.',
        syntaxAnatomy: [
          '-- Semi-join via EXISTS (zero outer row duplication):',
          'SELECT c.customer_id, c.name FROM customers c',
          'WHERE EXISTS (',
          '  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id AND o.status = \'completed\'',
          ');',
          '',
          '-- NULL-safe Anti-join via NOT EXISTS (NEVER use NOT IN on nullable columns!):',
          'SELECT c.customer_id, c.name FROM customers c',
          'WHERE NOT EXISTS (',
          '  SELECT 1 FROM customers r WHERE r.referred_by = c.customer_id',
          ');'
        ].join('\n'),
        internalsAndGotchas: [
          'If a subquery column can ever be `NULL`, `WHERE id NOT IN (SELECT nullable_col FROM ...)` returns **zero rows**! Always prefer `WHERE NOT EXISTS (...)`.',
          'A scalar subquery in `SELECT` (`(SELECT x FROM ...)`) raises `more than one row returned by a subquery used as an expression` at runtime if cardinality exceeds 1 row, and returns `NULL` when 0 rows match.',
          'Inside `EXISTS (SELECT 1 ...)`, PostgreSQL ignores the subquery\'s target list completely (`SELECT 1`, `SELECT *`, and `SELECT 1/0` are identical because only tuple existence is tested).',
          '`val > ALL (subquery)` requires `val` to exceed every returned value (and returns `TRUE` on an empty subquery, or `UNKNOWN` if no row falsifies `>` and a `NULL` is present); `val = ANY (subquery)` is equivalent to `val IN (subquery)`.'
        ],
        whenToUse: 'Use `EXISTS` for duplicate-free semi-joins against `1-to-N` child tables, `NOT EXISTS` for `NULL`-safe anti-joins, and `> ALL` / `= ANY` for quantified threshold comparisons.'
      },
      scenario: {
        role: 'Backend Query Reliability Engineer',
        incidentOrGoal: 'A referral campaign query `WHERE customer_id NOT IN (SELECT referred_by FROM customers)` returned `0` rows in production because root customers have `referred_by IS NULL`, while an `INNER JOIN` wire-customer check emitted duplicate rows for repeat buyers.',
        stakeholderNeed: 'Implement a duplicate-free `EXISTS` semi-join, fix the `NOT IN (NULL)` bug using `NOT EXISTS`, and benchmark flagship SKUs with `> ALL` and correlated scalar subqueries.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Duplicate-Free Semi-Join with EXISTS',
          mission: 'Find all `customers c` who have at least one settled wire payment (`payments.method = \'wire\'` AND `payments.status = \'settled\'` linked through `orders`) using `WHERE EXISTS (...)` so repeat wire buyer `Aravind Rao` (`customer_id = 1`, two wire orders) is emitted once without needing `DISTINCT`. Project 4 columns in exact order: `customer_id`, `name`, `tier`, and `country`. Sort by `c.customer_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Use WHERE EXISTS (...) so repeat wire customers are never duplicated',
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       c.country',
            'FROM customers c',
            '-- TODO: filter with WHERE EXISTS (...) across orders o and payments p',
            'ORDER BY c.customer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       c.country',
            'FROM customers c',
            'WHERE EXISTS (',
            '  SELECT 1',
            '  FROM orders o',
            '  INNER JOIN payments p ON p.order_id = o.order_id',
            '  WHERE o.customer_id = c.customer_id',
            '    AND p.method = \'wire\'',
            '    AND p.status = \'settled\'',
            ')',
            'ORDER BY c.customer_id ASC;'
          ].join('\n'),
          hints: [
            'Inside `WHERE EXISTS (...)`, join `orders o INNER JOIN payments p ON p.order_id = o.order_id`.',
            'Correlate the subquery to the outer table with `WHERE o.customer_id = c.customer_id AND p.method = \'wire\' AND p.status = \'settled\'`.',
            'Sort by `c.customer_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bEXISTS\\s*\\(', flags: 'i', message: 'Use `WHERE EXISTS (...)` for a true semi-join.' }
            ]
          },
          solutionExplanation: 'PostgreSQL pulls `EXISTS` up into a Semi Join over `(orders ⋈ payments)`, short-circuiting on the first settled wire payment for `customer_id = 1` (`Aravind Rao`) and `customer_id = 8` (`Diego Morales`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Fixing the NOT IN (NULL) Trap with NOT EXISTS',
          mission: 'Run the starter query mentally or live: `c.customer_id NOT IN (SELECT referred_by FROM customers)` returns **0 rows** because `customers.referred_by` contains `NULL`! Rewrite the filter using `WHERE NOT EXISTS (...)` to find every customer who has never referred another customer (`r.referred_by = c.customer_id`). Project 4 columns in exact order: `customer_id`, `name`, `tier`, and `referred_by`. Sort by `c.customer_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- BUG: returns 0 rows because customers.referred_by contains NULL!',
            '-- Rewrite using WHERE NOT EXISTS (...) to find non-referring customers',
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       c.referred_by',
            'FROM customers c',
            'WHERE c.customer_id NOT IN (SELECT referred_by FROM customers)',
            'ORDER BY c.customer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       c.referred_by',
            'FROM customers c',
            'WHERE NOT EXISTS (',
            '  SELECT 1',
            '  FROM customers r',
            '  WHERE r.referred_by = c.customer_id',
            ')',
            'ORDER BY c.customer_id ASC;'
          ].join('\n'),
          hints: [
            'Remove `NOT IN (SELECT referred_by FROM customers)`—any `NULL` in `referred_by` makes `id <> NULL` evaluate to `UNKNOWN` for every row.',
            'Replace it with `WHERE NOT EXISTS (SELECT 1 FROM customers r WHERE r.referred_by = c.customer_id)`.',
            'Keep the 4 output columns and `ORDER BY c.customer_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bNOT\\s+EXISTS\\s*\\(', flags: 'i', message: 'Use `NOT EXISTS (...)` for a `NULL`-safe anti-join.' }
            ]
          },
          solutionExplanation: 'In `NOT EXISTS`, rows where `r.referred_by IS NULL` simply fail `r.referred_by = c.customer_id` (`UNKNOWN` inside `WHERE` emits 0 inner rows), so `NOT EXISTS` evaluates cleanly to `TRUE` for customers `4`, `6`, `7`, and `8`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Quantified > ALL Comparison & Correlated Scalar Subquery',
          mission: 'Find all `products p` priced strictly higher than EVERY product in Storage category `20` using `p.price_cents > ALL (SELECT p2.price_cents FROM products p2 WHERE p2.category_id = 20)`. Project 5 columns in exact order: `product_id`, `sku`, `category_id`, `price_cents`, and `category_avg_cents` — a correlated scalar subquery computing `ROUND(AVG(p3.price_cents), 2)` across all products in `p.category_id`. Sort by `p.price_cents DESC, p.product_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Filter products priced > ALL category 20 products and project correlated category_avg_cents',
            'SELECT p.product_id,',
            '       p.sku,',
            '       p.category_id,',
            '       p.price_cents',
            '       -- TODO: add correlated scalar subquery AS category_avg_cents and WHERE ... > ALL (...)',
            'FROM products p',
            'ORDER BY p.price_cents DESC, p.product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT p.product_id,',
            '       p.sku,',
            '       p.category_id,',
            '       p.price_cents,',
            '       (SELECT ROUND(AVG(p3.price_cents), 2)',
            '        FROM products p3',
            '        WHERE p3.category_id = p.category_id) AS category_avg_cents',
            'FROM products p',
            'WHERE p.price_cents > ALL (',
            '  SELECT p2.price_cents',
            '  FROM products p2',
            '  WHERE p2.category_id = 20',
            ')',
            'ORDER BY p.price_cents DESC, p.product_id ASC;'
          ].join('\n'),
          hints: [
            'Filter `WHERE p.price_cents > ALL (SELECT p2.price_cents FROM products p2 WHERE p2.category_id = 20)` (category `20` max is `42000`, leaving SKUs `105`, `103`, and `104`).',
            'In PostgreSQL, `AVG(integer)` returns `NUMERIC`, so `ROUND(AVG(p3.price_cents), 2)` works directly inside the correlated scalar subquery `(SELECT ... FROM products p3 WHERE p3.category_id = p.category_id) AS category_avg_cents`.',
            'Sort by `p.price_cents DESC, p.product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '>\\s*ALL\\s*\\(', flags: 'i', message: 'Use `> ALL (...)` to compare against all prices in `category_id = 20`.' },
              { pattern: '\\bAS\\s+category_avg_cents\\b', flags: 'i', message: 'Project the correlated scalar subquery aliased `AS category_avg_cents`.' }
            ]
          },
          solutionExplanation: 'Because `products.price_cents` is `NOT NULL`, `> ALL (...)` safely requires `price_cents > 42000`, while the correlated `SubPlan` computes the exact `NUMERIC` category mean (`55000.00` for category `40` and `42166.67` for category `30`).'
        }
      ]
    },

    /* ========================================================================
       LAB 07: pg-m03-t07 — LATERAL Joins: Correlated Per-Parent Top-N & Unnesting
       ======================================================================== */
    {
      id: 'pg-m03-t07',
      slug: 'lateral-joins-per-group-top-n',
      moduleId: 'pg-m03',
      title: 'LATERAL Joins: Correlated Per-Parent Top-N & Unnesting',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'ecommerce',
      clauses: ['CROSS JOIN LATERAL', 'LEFT JOIN LATERAL', 'LIMIT', 'WITH ORDINALITY', 'unnest'],
      tags: ['lateral', 'top-n-per-group', 'unnest', 'with-ordinality', 'nested-loop'],
      guide: {
        mentalModel: 'Standard SQL forbids a `FROM` subquery from referencing columns of sibling tables to its left. PostgreSQL\'s **`LATERAL`** keyword lifts that scope barrier, turning the right-hand subquery or set-returning function (SRF) into a **parameterized function of each left tuple** executed via a **Nested Loop**.\n\nFor **per-parent Top-N** queries (`categories` → top `2` products by `price_cents DESC`), `ROW_NUMBER() OVER (PARTITION BY category_id ...)` must scan and sort the *entire* `products` table when outer categories are selective, whereas `CROSS JOIN LATERAL (SELECT ... WHERE p.category_id = c.category_id ORDER BY p.price_cents DESC LIMIT 2)` probes the composite B-Tree index `(category_id, price_cents DESC)` and **stops after reading 2 index entries per category**! Remember: `CROSS JOIN LATERAL` drops left rows whose lateral subquery returns `0` rows; use **`LEFT JOIN LATERAL (...) alias ON true`** whenever zero-match parent rows must be preserved with `NULL`s.',
        syntaxAnatomy: [
          '-- Per-parent Top-N preserving empty parents:',
          'SELECT c.customer_id, c.name, r.order_id, r.total_cents',
          'FROM customers c',
          'LEFT JOIN LATERAL (',
          '  SELECT o.order_id, o.total_cents FROM orders o',
          '  WHERE o.customer_id = c.customer_id',
          '  ORDER BY o.created_at DESC, o.order_id DESC LIMIT 2',
          ') r ON true;',
          '',
          '-- Correlated SRF array expansion with 1-based position:',
          'SELECT p.sku, tok.pos, tok.part',
          'FROM products p',
          'CROSS JOIN LATERAL unnest(string_to_array(p.sku, \'-\')) WITH ORDINALITY AS tok(part, pos);'
        ].join('\n'),
        internalsAndGotchas: [
          '`CROSS JOIN LATERAL` (or `, LATERAL`) acts like an `INNER JOIN`—any parent row whose lateral subquery returns `0` rows (such as `category_id = 10` `Hardware` or `customer_id = 7` `Chloe Moreau`) disappears! Use `LEFT JOIN LATERAL (...) alias ON true` to keep unmatched parents.',
          '`LEFT JOIN LATERAL (...) alias` syntactically **requires** an `ON` clause in PostgreSQL; always write `ON true` at the end because correlation predicates already live inside the lateral `WHERE`.',
          '`LATERAL` forces a **Nested Loop** plan (`O(|Left|)` index probes); when `|Left|` is millions of rows and no inner index exists on `(foreign_key, sort_col)`, `ROW_NUMBER() OVER (...)` over a single sequential scan + sort will beat `LATERAL`.',
          'Always attach `WITH ORDINALITY` when unnesting arrays via `LATERAL unnest(...)` if element order matters—PostgreSQL does not guarantee row order across downstream joins/aggregates without an explicit ordinal column.'
        ],
        whenToUse: 'Use `CROSS JOIN LATERAL` / `LEFT JOIN LATERAL (...) ON true` for index-backed Top-N-per-parent lookups, multi-column correlated calculations, and `unnest(...) WITH ORDINALITY` array/JSONB expansion.'
      },
      scenario: {
        role: 'Principal Catalog & Merchandising Performance Engineer',
        incidentOrGoal: 'Storefront category carousels and customer recent-order widgets scanned full tables using window functions, and dropped zero-order customer `Chloe Moreau` when switched naively to `CROSS JOIN LATERAL`.',
        stakeholderNeed: 'Build an index-aligned `CROSS JOIN LATERAL` Top-2-per-category query, a zero-order-safe `LEFT JOIN LATERAL ... ON true` customer widget query, and an ordinality-preserving SKU tokenizer.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — CROSS JOIN LATERAL: Top-2 Highest-Priced Products per Populated Category',
          mission: 'Use `CROSS JOIN LATERAL` from `categories cat` into `products p` correlated on `p.category_id = cat.category_id` (`ORDER BY p.price_cents DESC, p.product_id ASC LIMIT 2`) so empty parent category `10` (`Hardware`) is naturally skipped while populated categories emit up to 2 top SKUs. Project 5 columns in exact order: `category_id` (`cat.category_id`), `category_name` (`cat.name`), `product_id` (`top_p.product_id`), `sku` (`top_p.sku`), and `price_cents` (`top_p.price_cents`). Sort outer results by `cat.category_id ASC, top_p.price_cents DESC, top_p.product_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Fetch up to 2 highest-priced products per populated category via CROSS JOIN LATERAL',
            'SELECT cat.category_id,',
            '       cat.name AS category_name',
            '       -- TODO: CROSS JOIN LATERAL (... ORDER BY p.price_cents DESC, p.product_id ASC LIMIT 2) top_p',
            'FROM categories cat',
            'ORDER BY cat.category_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT cat.category_id,',
            '       cat.name AS category_name,',
            '       top_p.product_id,',
            '       top_p.sku,',
            '       top_p.price_cents',
            'FROM categories cat',
            'CROSS JOIN LATERAL (',
            '  SELECT p.product_id, p.sku, p.price_cents',
            '  FROM products p',
            '  WHERE p.category_id = cat.category_id',
            '  ORDER BY p.price_cents DESC, p.product_id ASC',
            '  LIMIT 2',
            ') top_p',
            'ORDER BY cat.category_id ASC, top_p.price_cents DESC, top_p.product_id ASC;'
          ].join('\n'),
          hints: [
            'Write `CROSS JOIN LATERAL (SELECT p.product_id, p.sku, p.price_cents FROM products p WHERE p.category_id = cat.category_id ORDER BY p.price_cents DESC, p.product_id ASC LIMIT 2) top_p`.',
            'Because `category_id = 10` has `0` direct rows in `products`, `CROSS JOIN LATERAL` omits it and returns 6 rows across categories `20`, `30`, and `40`.',
            'Sort outer rows by `cat.category_id ASC, top_p.price_cents DESC, top_p.product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCROSS\\s+JOIN\\s+LATERAL\\b', flags: 'i', message: 'Use `CROSS JOIN LATERAL` to correlate the Top-2 subquery per category.' },
              { pattern: '\\bLIMIT\\s+2\\b', flags: 'i', message: 'Bound each category probe with `LIMIT 2`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL executes a Nested Loop over `categories`, probing `idx_products_category_price (category_id, price_cents DESC)` with `LIMIT 2` per category and skipping empty root category `10`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — LEFT JOIN LATERAL ... ON true: Preserving Zero-Order Customers',
          mission: 'For ALL 8 `customers c`, fetch up to 2 most recent orders (`ORDER BY o.created_at DESC, o.order_id DESC LIMIT 2`) using `LEFT JOIN LATERAL (...) recent ON true` so zero-order customer `Chloe Moreau` (`customer_id = 7`) stays in the output. Project 5 columns in exact order: `customer_id` (`c.customer_id`), `name` (`c.name`), `order_id` (`recent.order_id`), `latest_status` (`COALESCE(recent.status, \'NO_ORDERS\')`), and `order_cents` (`COALESCE(recent.total_cents, 0)`). Sort by `c.customer_id ASC, recent.order_id DESC NULLS LAST`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Preserve all 8 customers while fetching up to 2 most recent orders each',
            'SELECT c.customer_id,',
            '       c.name',
            '       -- TODO: LEFT JOIN LATERAL (... LIMIT 2) recent ON true',
            'FROM customers c',
            'ORDER BY c.customer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.customer_id,',
            '       c.name,',
            '       recent.order_id,',
            '       COALESCE(recent.status, \'NO_ORDERS\') AS latest_status,',
            '       COALESCE(recent.total_cents, 0) AS order_cents',
            'FROM customers c',
            'LEFT JOIN LATERAL (',
            '  SELECT o.order_id, o.status, o.total_cents, o.created_at',
            '  FROM orders o',
            '  WHERE o.customer_id = c.customer_id',
            '  ORDER BY o.created_at DESC, o.order_id DESC',
            '  LIMIT 2',
            ') recent ON true',
            'ORDER BY c.customer_id ASC, recent.order_id DESC NULLS LAST;'
          ].join('\n'),
          hints: [
            'Use `LEFT JOIN LATERAL (...) recent ON true` — do not forget the trailing `ON true` required by PostgreSQL\'s parser!',
            'Inside the lateral subquery, filter `WHERE o.customer_id = c.customer_id` and sort `ORDER BY o.created_at DESC, o.order_id DESC LIMIT 2`.',
            'Default `NULL` columns for `Chloe Moreau` with `COALESCE(recent.status, \'NO_ORDERS\')` and `COALESCE(recent.total_cents, 0)`, then sort `ORDER BY c.customer_id ASC, recent.order_id DESC NULLS LAST`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bLEFT\\s+(?:OUTER\\s+)?JOIN\\s+LATERAL\\b', flags: 'i', message: 'Use `LEFT JOIN LATERAL` to preserve zero-order customers.' },
              { pattern: '\\bON\\s+true\\b', flags: 'i', message: 'Terminate the lateral outer join with `ON true`.' }
            ]
          },
          solutionExplanation: '`LEFT JOIN LATERAL (...) ON true` executes a Nested Loop Left Join: customers with 1–2 orders emit their latest rows, while `customer_id = 7` (`Chloe Moreau`) is `NULL`-padded into `(\'NO_ORDERS\', 0)`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — LATERAL unnest(...) WITH ORDINALITY: Structured SKU Tokenization',
          mission: 'For Networking products (`p.category_id = 30`), split `p.sku` on `\'-\'` (`string_to_array(p.sku, \'-\')`) and expand each array via `CROSS JOIN LATERAL unnest(...) WITH ORDINALITY AS tok(segment, token_pos)`. Project 4 columns in exact order: `product_id` (`p.product_id`), `sku` (`p.sku`), `token_pos` (`tok.token_pos`), and `segment` (`tok.segment`). Sort by `p.product_id ASC, tok.token_pos ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Unnest hyphen-delimited SKU segments with 1-based ordinality for category_id = 30',
            'SELECT p.product_id,',
            '       p.sku',
            '       -- TODO: CROSS JOIN LATERAL unnest(string_to_array(p.sku, \'-\')) WITH ORDINALITY AS tok(segment, token_pos)',
            'FROM products p',
            'WHERE p.category_id = 30',
            'ORDER BY p.product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT p.product_id,',
            '       p.sku,',
            '       tok.token_pos,',
            '       tok.segment',
            'FROM products p',
            'CROSS JOIN LATERAL unnest(string_to_array(p.sku, \'-\')) WITH ORDINALITY AS tok(segment, token_pos)',
            'WHERE p.category_id = 30',
            'ORDER BY p.product_id ASC, tok.token_pos ASC;'
          ].join('\n'),
          hints: [
            'Pass `string_to_array(p.sku, \'-\')` into `unnest(...)` inside `CROSS JOIN LATERAL`.',
            'Attach `WITH ORDINALITY AS tok(segment, token_pos)`—note that PostgreSQL appends the `BIGINT` ordinality column *after* the function\'s value column!',
            'Filter `WHERE p.category_id = 30` and sort by `p.product_id ASC, tok.token_pos ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bunnest\\s*\\(', flags: 'i', message: 'Use `unnest(...)` to expand the `TEXT[]` SKU token array.' },
              { pattern: '\\bWITH\\s+ORDINALITY\\b', flags: 'i', message: 'Attach `WITH ORDINALITY` to capture 1-based token positions.' }
            ]
          },
          solutionExplanation: 'In `FROM`, set-returning functions carry implicit `LATERAL` correlation in PostgreSQL; writing `CROSS JOIN LATERAL unnest(...) WITH ORDINALITY` explicitly documents the correlated `FunctionScan` and preserves 1-based array indices (`1, 2, 3`).'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m03-t08 — WITH CTEs, Writable Data-Modifying CTEs & WITH RECURSIVE
       ======================================================================== */
    {
      id: 'pg-m03-t08',
      slug: 'ctes-materialized-writable-recursive',
      moduleId: 'pg-m03',
      title: 'WITH CTEs, Writable Data-Modifying CTEs & WITH RECURSIVE',
      difficulty: 'Advanced',
      estimatedMinutes: 20,
      datasetId: 'org_hr',
      clauses: ['WITH', 'AS MATERIALIZED', 'UPDATE ... RETURNING', 'WITH RECURSIVE', 'CYCLE'],
      tags: ['cte', 'materialized', 'writable-cte', 'with-recursive', 'cycle-detection'],
      guide: {
        mentalModel: 'Since PostgreSQL 12 (and refined through PostgreSQL 18), non-recursive read-only CTEs referenced **once** are **inlined by default** so outer `WHERE` predicates push down into B-Tree indexes, whereas CTEs referenced **2+ times** (or marked **`AS MATERIALIZED`**) execute once into a `Tuplestore` (`CTE Scan`)—acting as an explicit optimization fence (`AS NOT MATERIALIZED` forces inlining even across multiple references).\n\nPostgreSQL also supports **writable (data-modifying) CTEs** (`WITH updated AS (UPDATE ... RETURNING *) SELECT ...`): critically, every sub-statement in a `WITH` query executes against the **exact same MVCC command snapshot**, so an outer `SELECT` scanning the target table still sees *pre-modification* tuples while reading post-modification tuples exclusively via `RETURNING`! Finally, **`WITH RECURSIVE`** evaluates an anchor term plus a `UNION ALL` recursive term against a swapping **`WorkTable`** until 0 new tuples are produced, with SQL-standard **`CYCLE col SET is_cycle USING path`** (PostgreSQL 14+) preventing infinite loops on cyclic graphs.',
        syntaxAnatomy: [
          '-- 1. Optimization fence: WITH stats AS MATERIALIZED (...)',
          '-- 2. Writable CTE sharing the same MVCC snapshot:',
          'WITH bumped AS (',
          '  UPDATE employees SET salary_usd = salary_usd + 15000',
          '  WHERE dept_id = 4 RETURNING emp_id, name, salary_usd AS new_salary_usd',
          ')',
          'SELECT b.emp_id, e.salary_usd AS old_salary_usd, b.new_salary_usd',
          'FROM bumped b INNER JOIN employees e ON e.emp_id = b.emp_id;',
          '',
          '-- 3. Recursive hierarchy traversal with PG 14-18 CYCLE clause:',
          'WITH RECURSIVE tree AS (',
          '  SELECT emp_id, name, manager_id, 0 AS depth FROM employees WHERE manager_id IS NULL',
          '  UNION ALL',
          '  SELECT e.emp_id, e.name, e.manager_id, t.depth + 1 FROM employees e JOIN tree t ON e.manager_id = t.emp_id',
          ') CYCLE emp_id SET is_cycle USING cycle_path',
          'SELECT * FROM tree WHERE NOT is_cycle;'
        ].join('\n'),
        internalsAndGotchas: [
          '`AS MATERIALIZED` creates a planner optimization fence—predicates in the outer `WHERE` will NOT push into the CTE\'s scan, which is great for isolating expensive aggregations/functions from re-evaluation, but harmful on huge unindexed tables.',
          'All data-modifying CTEs (`INSERT`/`UPDATE`/`DELETE` in `WITH`) run to completion even if the outer `SELECT` has a `LIMIT 1` or never references the CTE, and they share one MVCC snapshot (sibling CTEs cannot see each other\'s table mutations directly—chain via `RETURNING`!).',
          'In `WITH RECURSIVE`, the recursive self-reference may appear **at most once** in `FROM` and never inside an aggregate, `DISTINCT`, or the nullable side of an outer join causing infinite growth; always prefer `UNION ALL` + `CYCLE` (or depth cap `WHERE t.depth < 20`) over `UNION` unless state-space deduplication is required.'
        ],
        whenToUse: 'Use `AS MATERIALIZED` to compute shared rollups once, writable `UPDATE/DELETE ... RETURNING` CTEs to mutate and audit/archive in a single atomic statement, and `WITH RECURSIVE ... CYCLE` to traverse hierarchies and graphs.'
      },
      scenario: {
        role: 'Staff Database Architect — HR Core Platform',
        incidentOrGoal: 'Compensation workflows needed single-pass materialized department benchmarks, atomic Site Reliability (`dept_id = 4`) retention adjustments returning before/after deltas in one round-trip, and cycle-safe org-chart breadcrumb paths.',
        stakeholderNeed: 'Author a `WITH ... AS MATERIALIZED` benchmark query, an atomic writable `UPDATE ... RETURNING` CTE demonstrating PostgreSQL\'s shared MVCC snapshot, and a `WITH RECURSIVE` hierarchy tree.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — WITH ... AS MATERIALIZED: Department Salary Benchmark Fence',
          mission: 'Define `WITH dept_bench AS MATERIALIZED (...)` grouping `employees` by `dept_id` to compute `dept_headcount` (`COUNT(*)`) and `dept_avg_usd` (`ROUND(AVG(salary_usd), 2)`). Join `employees e`, `departments d`, and `dept_bench db` for employees earning at or above their department average (`e.salary_usd >= db.dept_avg_usd`). Project 5 columns in exact order: `emp_id`, `name`, `dept_name` (`d.name`), `salary_usd`, and `dept_avg_usd` (`db.dept_avg_usd`). Sort by `e.salary_usd DESC, e.emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Materialize department benchmarks once with AS MATERIALIZED, then filter >= dept_avg_usd',
            'WITH dept_bench AS (',
            '  SELECT dept_id, COUNT(*) AS dept_headcount',
            '  FROM employees',
            '  GROUP BY dept_id',
            ')',
            '-- TODO: add AS MATERIALIZED, dept_avg_usd, join departments d, and filter >= dept_avg_usd',
            'SELECT emp_id, name, salary_usd FROM employees ORDER BY salary_usd DESC;'
          ].join('\n'),
          solutionCode: [
            'WITH dept_bench AS MATERIALIZED (',
            '  SELECT dept_id,',
            '         COUNT(*) AS dept_headcount,',
            '         ROUND(AVG(salary_usd), 2) AS dept_avg_usd',
            '  FROM employees',
            '  GROUP BY dept_id',
            ')',
            'SELECT e.emp_id,',
            '       e.name,',
            '       d.name AS dept_name,',
            '       e.salary_usd,',
            '       db.dept_avg_usd',
            'FROM employees e',
            'INNER JOIN departments d ON d.dept_id = e.dept_id',
            'INNER JOIN dept_bench db ON db.dept_id = e.dept_id',
            'WHERE e.salary_usd >= db.dept_avg_usd',
            'ORDER BY e.salary_usd DESC, e.emp_id ASC;'
          ].join('\n'),
          hints: [
            'Write `WITH dept_bench AS MATERIALIZED (...)` computing `COUNT(*) AS dept_headcount` and `ROUND(AVG(salary_usd), 2) AS dept_avg_usd` grouped by `dept_id`.',
            'Join `employees e`, `departments d`, and `dept_bench db` on `dept_id`, then filter `WHERE e.salary_usd >= db.dept_avg_usd`.',
            'Sort by `e.salary_usd DESC, e.emp_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bAS\\s+MATERIALIZED\\b', flags: 'i', message: 'Use `AS MATERIALIZED` to materialize the `dept_bench` CTE into a single-pass `Tuplestore`.' }
            ]
          },
          solutionExplanation: '`AS MATERIALIZED` instructs PostgreSQL\'s planner to evaluate `dept_bench` once into an in-memory `Tuplestore` (`CTE Scan`) before probing qualifying above-average earners across all 4 departments.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Writable CTE & Shared MVCC Snapshot: Atomic Raise with Before/After Audit',
          mission: 'Write a data-modifying CTE `WITH raised AS (UPDATE employees SET salary_usd = salary_usd + 15000 WHERE dept_id = 4 RETURNING emp_id, name, dept_id, salary_usd AS new_salary_usd)` and join `raised r` to `employees e` (`e.emp_id = r.emp_id` — which still reads the **pre-update MVCC snapshot**!) and `departments d` (`d.dept_id = r.dept_id`). Project 5 columns in exact order: `emp_id` (`r.emp_id`), `name` (`r.name`), `dept_name` (`d.name`), `old_salary_usd` (`e.salary_usd`), and `new_salary_usd` (`r.new_salary_usd`). Sort by `r.emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Use a writable UPDATE ... RETURNING CTE and join employees e to observe the pre-update snapshot',
            'SELECT e.emp_id,',
            '       e.name,',
            '       e.salary_usd AS old_salary_usd',
            'FROM employees e',
            'WHERE e.dept_id = 4',
            'ORDER BY e.emp_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH raised AS (',
            '  UPDATE employees',
            '  SET salary_usd = salary_usd + 15000',
            '  WHERE dept_id = 4',
            '  RETURNING emp_id, name, dept_id, salary_usd AS new_salary_usd',
            ')',
            'SELECT r.emp_id,',
            '       r.name,',
            '       d.name AS dept_name,',
            '       e.salary_usd AS old_salary_usd,',
            '       r.new_salary_usd',
            'FROM raised r',
            'INNER JOIN employees e ON e.emp_id = r.emp_id',
            'INNER JOIN departments d ON d.dept_id = r.dept_id',
            'ORDER BY r.emp_id ASC;'
          ].join('\n'),
          hints: [
            'Inside `WITH raised AS (...)`, execute `UPDATE employees SET salary_usd = salary_usd + 15000 WHERE dept_id = 4 RETURNING emp_id, name, dept_id, salary_usd AS new_salary_usd`.',
            'Because outer `SELECT` scans share the exact same MVCC snapshot as `raised`, joining `INNER JOIN employees e ON e.emp_id = r.emp_id` reads the pre-update `e.salary_usd` (`192000` and `162000`)!',
            'Join `departments d ON d.dept_id = r.dept_id` for `d.name AS dept_name` and sort by `r.emp_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUPDATE\\s+employees\\b', flags: 'i', message: 'Use a writable `UPDATE employees` CTE.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Pipe updated post-raise rows out of the CTE with `RETURNING`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL executes `raised` and the outer `SELECT` under a single shared MVCC snapshot without advancing `CommandId` visibility between them, allowing `e.salary_usd` (`192000`, `162000`) and `r.new_salary_usd` (`207000`, `177000`) to be audited side-by-side in one atomic round-trip.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — WITH RECURSIVE & CYCLE: Full Org Tree Depth & Reporting Breadcrumbs',
          mission: 'Write a `WITH RECURSIVE org_tree` query starting from root `WHERE manager_id IS NULL` (`0 AS depth`, `name AS reporting_path`) and recursively joining direct reports (`e.manager_id = t.emp_id`, incrementing `t.depth + 1` and concatenating `t.reporting_path || \' -> \' || e.name`), optionally guarded with PostgreSQL\'s `CYCLE emp_id SET is_cycle USING cycle_path` (`WHERE NOT is_cycle`). Project 5 columns in exact order: `emp_id`, `name`, `depth`, `salary_usd`, and `reporting_path`. Sort by `depth ASC, emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Traverse the full 9-employee reporting hierarchy from manager_id IS NULL with WITH RECURSIVE',
            'WITH RECURSIVE org_tree AS (',
            '  SELECT emp_id,',
            '         name,',
            '         manager_id,',
            '         salary_usd,',
            '         0 AS depth',
            '  FROM employees',
            '  WHERE manager_id IS NULL',
            '  -- TODO: add reporting_path and UNION ALL recursive step (+ optional CYCLE guard)',
            ')',
            'SELECT emp_id, name, depth, salary_usd FROM org_tree ORDER BY depth ASC, emp_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH RECURSIVE org_tree AS (',
            '  SELECT emp_id,',
            '         name,',
            '         manager_id,',
            '         salary_usd,',
            '         0 AS depth,',
            '         name AS reporting_path',
            '  FROM employees',
            '  WHERE manager_id IS NULL',
            '  UNION ALL',
            '  SELECT e.emp_id,',
            '         e.name,',
            '         e.manager_id,',
            '         e.salary_usd,',
            '         t.depth + 1 AS depth,',
            '         t.reporting_path || \' -> \' || e.name AS reporting_path',
            '  FROM employees e',
            '  INNER JOIN org_tree t ON e.manager_id = t.emp_id',
            ') CYCLE emp_id SET is_cycle USING cycle_path',
            'SELECT emp_id,',
            '       name,',
            '       depth,',
            '       salary_usd,',
            '       reporting_path',
            'FROM org_tree',
            'WHERE NOT is_cycle',
            'ORDER BY depth ASC, emp_id ASC;'
          ].join('\n'),
          hints: [
            'In the anchor `SELECT` (`WHERE manager_id IS NULL`), emit `0 AS depth` and `name AS reporting_path`.',
            'After `UNION ALL`, join `employees e INNER JOIN org_tree t ON e.manager_id = t.emp_id` emitting `t.depth + 1` and `t.reporting_path || \' -> \' || e.name`.',
            'Guard cycles cleanly with `) CYCLE emp_id SET is_cycle USING cycle_path` + `WHERE NOT is_cycle` (or traverse the clean DAG directly) and sort by `depth ASC, emp_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bWITH\\s+RECURSIVE\\b', flags: 'i', message: 'Use `WITH RECURSIVE` to traverse the multi-level `employees` hierarchy.' },
              { pattern: '\\bUNION\\s+ALL\\b', flags: 'i', message: 'Connect the anchor and recursive terms with `UNION ALL`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL\'s `RecursiveUnion` seeds the `WorkTable` with root `Dr. Kavita Sen` (`depth = 0`) and iterates breadth-by-step down to `depth = 3` (`Clara Novak` and `Zara Al-Farsi`), while `CYCLE emp_id SET is_cycle USING cycle_path` tracks visited `ROW(emp_id)` arrays to guarantee termination even if a cyclic `manager_id` edge were introduced.'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
