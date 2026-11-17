/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 04 (`pg-m04`): Aggregations, Rollups & Window Functions Mastery
 * 8 Hands-On Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m04'] = [
    /* ========================================================================
       LAB 01: pg-m04-t01 — COUNT(*) vs COUNT(col), Core Aggregates & PK GROUP BY
       ======================================================================== */
    {
      id: 'pg-m04-t01',
      slug: 'aggregates-count-null-group-by',
      moduleId: 'pg-m04',
      title: 'COUNT(*) vs COUNT(col), Core Aggregates & Functional Dependency GROUP BY',
      difficulty: 'Beginner',
      estimatedMinutes: 12,
      datasetId: 'ecommerce',
      clauses: ['GROUP BY', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'],
      tags: ['group-by', 'count', 'aggregates', 'functional-dependency'],
      guide: {
        mentalModel: 'PostgreSQL executes `GROUP BY` via either a **HashAggregate** (building an in-memory hash table of transition states sized by `hash_mem_multiplier * work_mem`) or a **GroupAggregate** over pre-sorted tuples (for example, directly off a B-Tree index scan). Every aggregate maintains an internal state value updated by its transition function (`sfunc`) per non-null input, except `COUNT(*)`, which increments on **every input tuple regardless of NULL columns**.\n\nUnder the SQL:1999 functional dependency rule implemented in PostgreSQL, when `GROUP BY` includes a table\'s **PRIMARY KEY** (such as `GROUP BY c.customer_id`), every other column of `customers` (`c.name`, `c.tier`, `c.country`) is mathematically determined by that key—so PostgreSQL lets you project them directly without bloating the hash key with redundant text columns.',
        syntaxAnatomy: [
          'SELECT c.customer_id,',
          '       c.name,                                       -- Legal via PK functional dependency!',
          '       COUNT(o.order_id) AS order_count,             -- Counts non-NULL order_ids (0 on LEFT JOIN miss)',
          '       COALESCE(SUM(o.total_cents), 0) AS sum_cents',
          'FROM customers c',
          'LEFT JOIN orders o ON o.customer_id = c.customer_id',
          'GROUP BY c.customer_id',
          'ORDER BY sum_cents DESC, c.customer_id ASC;'
        ].join('\n'),
        internalsAndGotchas: [
          'After a `LEFT JOIN`, `COUNT(*)` returns `1` for an unmatched parent row because the NULL-padded joined tuple still exists; always count a NOT NULL right-table key (`COUNT(o.order_id)`) to get `0`.',
          '`SUM`, `AVG`, `MIN`, and `MAX` ignore `NULL` inputs, returning `NULL` (not `0`) when all inputs in a group are `NULL`—wrap `SUM(...)` in `COALESCE(..., 0)` on outer joins.',
          'Functional dependency in PostgreSQL requires an actual `PRIMARY KEY` constraint (not merely a `UNIQUE` index on nullable columns) to omit dependent columns from `GROUP BY`.',
          '`COUNT(DISTINCT col)` forces per-group deduplication (sorting or hashing distinct datums) and cannot share the fast single-pass transition state of plain `HashAggregate` in older plans.'
        ],
        whenToUse: 'Use `COUNT(*)` for true row cardinality, `COUNT(col)` when intentionally excluding `NULL` attributes or counting `LEFT JOIN` matches, and `GROUP BY table.pk` whenever grouping normalized parent entities.'
      },
      scenario: {
        role: 'Commerce Analytics Engineer',
        incidentOrGoal: 'Executive KPI cards inflated active customer order counts to at least 1 for zero-order signups because a `LEFT JOIN` report used `COUNT(*)` instead of `COUNT(o.order_id)`, and over-grouped wide text columns.',
        stakeholderNeed: 'Deliver accurate order-status summaries, zero-safe customer lifetime rollups using PK functional dependency, and carrier delivery vs in-transit counts.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Tuple Counting COUNT(*) vs Non-Null Attribute COUNT(col)',
          mission: 'Query `orders` grouped by `status` and project 5 columns in exact order: `status`, `total_orders` (`COUNT(*)`), `discounted_orders` (number of orders with a non-null `discount_code`), `distinct_customers` (number of distinct `customer_id` values), and `avg_order_usd` (average `total_cents` converted to USD and rounded to 2 decimal places). Sort by `total_orders DESC, status ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT status,',
            '       COUNT(*) AS total_orders',
            '       -- TODO: add discounted_orders, distinct_customers, and avg_order_usd',
            'FROM orders',
            'GROUP BY status',
            'ORDER BY total_orders DESC, status ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT status,',
            '       COUNT(*) AS total_orders,',
            '       COUNT(discount_code) AS discounted_orders,',
            '       COUNT(DISTINCT customer_id) AS distinct_customers,',
            '       ROUND(AVG(total_cents)::numeric / 100, 2) AS avg_order_usd',
            'FROM orders',
            'GROUP BY status',
            'ORDER BY total_orders DESC, status ASC;'
          ].join('\n'),
          hints: [
            '`COUNT(*)` counts every row in the group, whereas `COUNT(discount_code)` increments only when `discount_code IS NOT NULL`.',
            'Use `COUNT(DISTINCT customer_id) AS distinct_customers` to count unique buyers per status.',
            'Compute `ROUND(AVG(total_cents)::numeric / 100, 2) AS avg_order_usd` and sort by `total_orders DESC, status ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCOUNT\\s*\\(\\s*discount_code\\s*\\)', flags: 'i', message: 'Use `COUNT(discount_code)` to count non-null discount codes.' },
              { pattern: '\\bCOUNT\\s*\\(\\s*DISTINCT\\s+customer_id\\s*\\)', flags: 'i', message: 'Use `COUNT(DISTINCT customer_id)` for unique buyers.' }
            ]
          },
          solutionExplanation: '`COUNT(*)` counts all heap tuples in each `status` bucket, `COUNT(discount_code)` skips `NULL` promo codes automatically, and `AVG(total_cents)` returns `NUMERIC` which divides cleanly by `100` inside `ROUND(..., 2)`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — LEFT JOIN Zero-Order Safety & PK Functional Dependency GROUP BY',
          mission: 'Left-join `customers c` to `orders o` on `customer_id`, group **only** by `c.customer_id` (relying on PostgreSQL primary-key functional dependency), and project 5 columns in exact order: `customer_id`, `name`, `tier`, `order_count` (`0` for customers without orders), and `gross_cents` (`0` when a customer has no orders). Sort by `gross_cents DESC, c.customer_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       COUNT(*) AS order_count -- BUG: returns 1 for customers with 0 orders!',
            '       -- TODO: fix order_count, add COALESCE gross_cents, and GROUP BY c.customer_id only',
            'FROM customers c',
            'LEFT JOIN orders o ON o.customer_id = c.customer_id',
            'GROUP BY c.customer_id',
            'ORDER BY c.customer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       COUNT(o.order_id) AS order_count,',
            '       COALESCE(SUM(o.total_cents), 0) AS gross_cents',
            'FROM customers c',
            'LEFT JOIN orders o ON o.customer_id = c.customer_id',
            'GROUP BY c.customer_id',
            'ORDER BY gross_cents DESC, c.customer_id ASC;'
          ].join('\n'),
          hints: [
            'Replace `COUNT(*)` with `COUNT(o.order_id)` so unmatched `LEFT JOIN` rows (where `o.order_id IS NULL`) evaluate to `0`.',
            'Wrap `SUM(o.total_cents)` in `COALESCE(SUM(o.total_cents), 0) AS gross_cents`.',
            'Keep `GROUP BY c.customer_id` (do not list `c.name` or `c.tier` in `GROUP BY`) and order by `gross_cents DESC, c.customer_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCOUNT\\s*\\(\\s*o\\.order_id\\s*\\)', flags: 'i', message: 'Count `o.order_id` so unmatched customers get `0` instead of `1`.' },
              { pattern: '\\bGROUP\\s+BY\\s+c\\.customer_id\\s*(?=ORDER\\b|$)', flags: 'i', message: 'Group strictly by `c.customer_id` to leverage PostgreSQL PK functional dependency.' }
            ]
          },
          solutionExplanation: 'Because `customers.customer_id` is declared `PRIMARY KEY`, PostgreSQL recognizes that `c.name` and `c.tier` are functionally dependent on `c.customer_id`, keeping the `HashAggregate` grouping key narrow (a single 4-byte `int4`).'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Carrier Delivery Completion & In-Transit Gap via NULL Counting',
          mission: 'Query `shipments` grouped by `carrier` and project 4 columns in exact order: `carrier`, `shipments_dispatched` (all shipments for that carrier), `shipments_delivered` (shipments with a non-null `delivered_at`), and `in_transit_count` (`shipments_dispatched` minus `shipments_delivered`). Sort by `shipments_dispatched DESC, carrier ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT carrier,',
            '       COUNT(*) AS shipments_dispatched',
            '       -- TODO: add shipments_delivered and in_transit_count',
            'FROM shipments',
            'GROUP BY carrier',
            'ORDER BY shipments_dispatched DESC, carrier ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT carrier,',
            '       COUNT(*) AS shipments_dispatched,',
            '       COUNT(delivered_at) AS shipments_delivered,',
            '       COUNT(*) - COUNT(delivered_at) AS in_transit_count',
            'FROM shipments',
            'GROUP BY carrier',
            'ORDER BY shipments_dispatched DESC, carrier ASC;'
          ].join('\n'),
          hints: [
            '`delivered_at` is `NULL` while a parcel is still in transit, so `COUNT(delivered_at)` counts completed deliveries.',
            'Subtract `COUNT(delivered_at)` from `COUNT(*)` to compute `in_transit_count` without needing a subquery.',
            'Sort by `shipments_dispatched DESC, carrier ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCOUNT\\s*\\(\\s*delivered_at\\s*\\)', flags: 'i', message: 'Use `COUNT(delivered_at)` to count delivered parcels.' }
            ]
          },
          solutionExplanation: 'Subtracting `COUNT(delivered_at)` from `COUNT(*)` cleanly isolates `NULL` rows (`delivered_at IS NULL`, such as DHL shipment `704`) using core SQL aggregate semantics.'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m04-t02 — HAVING Post-Group Predicates vs WHERE Pushdown
       ======================================================================== */
    {
      id: 'pg-m04-t02',
      slug: 'having-post-group-filtering',
      moduleId: 'pg-m04',
      title: 'HAVING Post-Group Predicates vs Pre-Aggregate WHERE Pushdown',
      difficulty: 'Beginner',
      estimatedMinutes: 12,
      datasetId: 'ecommerce',
      clauses: ['GROUP BY', 'HAVING', 'WHERE'],
      tags: ['having', 'group-by', 'predicate-pushdown', 'aggregates'],
      guide: {
        mentalModel: 'Logical SQL evaluation strictly separates **pre-aggregation tuple filtering (`WHERE`)** from **post-aggregation group filtering (`HAVING`)**: `FROM/JOIN` -> `WHERE` -> `GROUP BY` -> aggregate transition functions -> `HAVING` -> `SELECT` -> `ORDER BY`. Every tuple eliminated in `WHERE` never enters the `HashAggregate` hash table or sort run, saving memory, CPU hashing, and potential B-Tree index I/O.\n\nBy contrast, `HAVING` runs **after** groups are finalized and can inspect aggregate results (`HAVING SUM(o.total_cents) >= 80000`). While PostgreSQL\'s optimizer attempts to push non-aggregate `HAVING` clauses down into `WHERE` when safe, relying on implicit pushdown obscures query intent and cannot rescue predicates mixed with aggregates or volatile expressions.',
        syntaxAnatomy: [
          'SELECT c.customer_id, c.name,',
          '       COUNT(*) AS completed_orders,',
          '       ROUND(SUM(o.total_cents)::numeric / 100, 2) AS completed_spend_usd',
          'FROM customers c',
          'JOIN orders o ON o.customer_id = c.customer_id',
          'WHERE o.status = \'completed\'                 -- 1. Row pushdown (indexable before HashAggregate)',
          'GROUP BY c.customer_id',
          'HAVING SUM(o.total_cents) >= 80000           -- 2. Group threshold (repeats expression, not SELECT alias)',
          'ORDER BY completed_spend_usd DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          'PostgreSQL evaluates `HAVING` before `SELECT` projection, so `SELECT` column aliases (`HAVING completed_spend_usd >= 800`) fail with `column "completed_spend_usd" does not exist`—repeat the aggregate expression in `HAVING`.',
          'Putting an aggregate inside `WHERE` (`WHERE COUNT(*) > 1`) immediately raises `aggregate functions are not allowed in WHERE`.',
          '`HAVING` without `GROUP BY` treats the entire filtered table as a single implicit group, returning either 1 summary row or 0 rows depending on whether the predicate holds.',
          'Filtering `WHERE o.status = \'completed\'` can leverage `idx_orders_customer_status` before aggregation; hiding status logic inside post-group filters scans cancelled and refunded rows needlessly.'
        ],
        whenToUse: 'Push every row-level attribute filter (`status`, `is_active`, timestamp bounds) into `WHERE`, and use `HAVING` exclusively to filter aggregated group metrics (`COUNT`, `SUM`, `AVG`, `MIN/MAX`).'
      },
      scenario: {
        role: 'Backend Reporting Engineer',
        incidentOrGoal: 'Merchandising and VIP loyalty endpoints threw syntax errors trying to reference `SELECT` aliases in `HAVING` and mistakenly included cancelled/refunded orders before applying spend thresholds.',
        stakeholderNeed: 'Build active-category depth filters, settled VIP spend cohorts, and high-velocity multi-order SKU screens combining `WHERE` pushdown with `HAVING`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Active Catalog Depth with WHERE Pushdown + HAVING Count',
          mission: 'Filter `products` to active items only (`is_active = 1`), group by `category_id`, retain only categories with at least `2` active products via `HAVING`, and project 4 columns in exact order: `category_id`, `active_sku_count`, `total_stock_units`, and `avg_price_usd` (average `price_cents` in USD rounded to 2 decimal places). Sort by `avg_price_usd DESC, category_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT category_id,',
            '       COUNT(*) AS active_sku_count',
            '       -- TODO: add SUM(stock_qty) AS total_stock_units and avg_price_usd',
            'FROM products',
            '-- TODO: filter active products in WHERE, group by category_id, and filter >= 2 SKUs in HAVING',
            'GROUP BY category_id',
            'ORDER BY category_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT category_id,',
            '       COUNT(*) AS active_sku_count,',
            '       SUM(stock_qty) AS total_stock_units,',
            '       ROUND(AVG(price_cents)::numeric / 100, 2) AS avg_price_usd',
            'FROM products',
            'WHERE is_active = 1',
            'GROUP BY category_id',
            'HAVING COUNT(*) >= 2',
            'ORDER BY avg_price_usd DESC, category_id ASC;'
          ].join('\n'),
          hints: [
            'Filter `WHERE is_active = 1` before `GROUP BY category_id` so inactive archive SKUs (`product_id = 108`) are excluded prior to averaging.',
            'Add `HAVING COUNT(*) >= 2` after `GROUP BY category_id`.',
            'Project `ROUND(AVG(price_cents)::numeric / 100, 2) AS avg_price_usd` and sort by `avg_price_usd DESC, category_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bWHERE\\s+is_active\\s*=\\s*1\\b', flags: 'i', message: 'Push `WHERE is_active = 1` down before `GROUP BY`.' },
              { pattern: '\\bHAVING\\s+COUNT\\s*\\(\\s*\\*\\s*\\)\\s*>=\\s*2\\b', flags: 'i', message: 'Use `HAVING COUNT(*) >= 2` to filter post-group SKU depth.' }
            ]
          },
          solutionExplanation: 'Excluding `TAPE-LTO9-18T` (`is_active = 0`) in `WHERE` ensures category `20` averages only its 2 active NVMe drives (`$315.00`) instead of diluting the mean with discontinued stock.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — VIP Settled Spend Thresholds (WHERE Status + HAVING SUM)',
          mission: 'Join `customers c` and `orders o` on `customer_id`, push `o.status = \'completed\'` into `WHERE`, group by `c.customer_id`, and keep only customers whose completed `total_cents` sum is at least `80000` (`$800.00`). Project 5 columns in exact order: `customer_id`, `name`, `tier`, `completed_orders`, and `completed_spend_usd` (rounded to 2 decimals). Sort by `completed_spend_usd DESC, c.customer_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       COUNT(*) AS completed_orders',
            '       -- TODO: add completed_spend_usd, WHERE status filter, and HAVING >= 80000 cents',
            'FROM customers c',
            'JOIN orders o ON o.customer_id = c.customer_id',
            'GROUP BY c.customer_id',
            'ORDER BY c.customer_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.customer_id,',
            '       c.name,',
            '       c.tier,',
            '       COUNT(*) AS completed_orders,',
            '       ROUND(SUM(o.total_cents)::numeric / 100, 2) AS completed_spend_usd',
            'FROM customers c',
            'JOIN orders o ON o.customer_id = c.customer_id',
            'WHERE o.status = \'completed\'',
            'GROUP BY c.customer_id',
            'HAVING SUM(o.total_cents) >= 80000',
            'ORDER BY completed_spend_usd DESC, c.customer_id ASC;'
          ].join('\n'),
          hints: [
            'Filter `WHERE o.status = \'completed\'` before `GROUP BY c.customer_id` so refunded/pending orders do not inflate spend.',
            'Because `HAVING` cannot reference `completed_spend_usd`, write `HAVING SUM(o.total_cents) >= 80000`.',
            'Order by `completed_spend_usd DESC, c.customer_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bWHERE\\s+o\\.status\\s*=\\s*\'completed\'', flags: 'i', message: 'Filter `WHERE o.status = \'completed\'` prior to grouping.' },
              { pattern: '\\bHAVING\\s+SUM\\s*\\(\\s*o\\.total_cents\\s*\\)\\s*>=\\s*80000\\b', flags: 'i', message: 'Filter groups with `HAVING SUM(o.total_cents) >= 80000`.' }
            ]
          },
          solutionExplanation: 'Pushing `o.status = \'completed\'` into `WHERE` allows PostgreSQL to probe `idx_orders_customer_status` directly, while `HAVING SUM(o.total_cents) >= 80000` retains only high-value buyers (`1`, `3`, and `8`).'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Compound Multi-Aggregate HAVING Guards on SKU Velocity',
          mission: 'Join `products p` and `order_items oi` on `product_id`, group by `p.product_id`, and retain only products appearing in at least `2` distinct orders (`COUNT(DISTINCT oi.order_id) >= 2`) **and** selling at least `2` total units (`SUM(oi.quantity) >= 2`). Project 5 columns in exact order: `product_id`, `sku`, `orders_containing`, `units_sold`, and `gross_item_usd` (`SUM(oi.quantity * oi.unit_price_cents)` in USD rounded to 2 decimals). Sort by `gross_item_usd DESC, p.product_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT p.product_id,',
            '       p.sku,',
            '       COUNT(DISTINCT oi.order_id) AS orders_containing',
            '       -- TODO: add units_sold, gross_item_usd, and compound HAVING filter',
            'FROM products p',
            'JOIN order_items oi ON oi.product_id = p.product_id',
            'GROUP BY p.product_id',
            'ORDER BY p.product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT p.product_id,',
            '       p.sku,',
            '       COUNT(DISTINCT oi.order_id) AS orders_containing,',
            '       SUM(oi.quantity) AS units_sold,',
            '       ROUND(SUM(oi.quantity * oi.unit_price_cents)::numeric / 100, 2) AS gross_item_usd',
            'FROM products p',
            'JOIN order_items oi ON oi.product_id = p.product_id',
            'GROUP BY p.product_id',
            'HAVING COUNT(DISTINCT oi.order_id) >= 2',
            '   AND SUM(oi.quantity) >= 2',
            'ORDER BY gross_item_usd DESC, p.product_id ASC;'
          ].join('\n'),
          hints: [
            'Compute line revenue inside `SUM(oi.quantity * oi.unit_price_cents)` before dividing by `100` in `ROUND(..., 2)`.',
            'Combine both group thresholds in `HAVING COUNT(DISTINCT oi.order_id) >= 2 AND SUM(oi.quantity) >= 2`.',
            'Sort by `gross_item_usd DESC, p.product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bHAVING\\b[\\s\\S]*\\bCOUNT\\s*\\(\\s*DISTINCT\\s+oi\\.order_id\\s*\\)', flags: 'i', message: 'Enforce `COUNT(DISTINCT oi.order_id) >= 2` inside `HAVING`.' }
            ]
          },
          solutionExplanation: 'Compound `HAVING` predicates distinguish broad repeat demand (`COUNT(DISTINCT oi.order_id) >= 2`) from single-order bulk purchases such as `NIC-100G-DP` (2 units inside 1 order).'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m04-t03 — Single-Pass Pivoting & Funnels with FILTER (WHERE ...)
       ======================================================================== */
    {
      id: 'pg-m04-t03',
      slug: 'conditional-aggregation-filter-clause',
      moduleId: 'pg-m04',
      title: 'Single-Pass Pivoting & Funnel Ratios with FILTER (WHERE ...)',
      difficulty: 'Intermediate',
      estimatedMinutes: 14,
      datasetId: 'saas_telemetry',
      clauses: ['FILTER (WHERE ...)', 'COUNT', 'SUM', 'AVG'],
      tags: ['filter-clause', 'pivoting', 'conditional-aggregation', 'funnels'],
      guide: {
        mentalModel: 'SQL:2003\'s `agg(...) FILTER (WHERE predicate)` clause—natively optimized in PostgreSQL\'s `ExecInterpExpr` expression VM—attaches a boolean gate directly in front of an aggregate\'s state transition function (`transfn`). During a **single sequential or index scan**, PostgreSQL routes each tuple to multiple independent aggregate transition slots in the same `HashAggregate` node, advancing only the slots whose `FILTER` evaluates to `TRUE`.\n\nCompared to legacy `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` workarounds, `FILTER (WHERE ...)` works uniformly across **every** aggregate (`COUNT(*)`, `COUNT(DISTINCT ...)`, `AVG(...)`, `ARRAY_AGG(...)`), preserves natural `NULL` behavior when zero rows match an `AVG` or `MIN`, and reads cleanly as declarative intent.',
        syntaxAnatomy: [
          'SELECT u.cohort_month,',
          '       COUNT(DISTINCT u.user_id) AS signed_up_users,',
          '       COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_type = \'query_run\') AS active_users,',
          '       ROUND(',
          '         (COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_type = \'query_run\'))::numeric * 100',
          '         / NULLIF(COUNT(DISTINCT u.user_id), 0), 2',
          '       ) AS activation_pct',
          'FROM saas_users u',
          'LEFT JOIN user_events e ON e.user_id = u.user_id',
          'GROUP BY u.cohort_month;'
        ].join('\n'),
        internalsAndGotchas: [
          '`COUNT(*) FILTER (WHERE cond)` returns `0` when no rows match `cond`, whereas `SUM(...) FILTER (WHERE cond)` and `AVG(...) FILTER (WHERE cond)` return `NULL` when zero rows match—wrap `SUM` in `COALESCE(..., 0)` if zero is required.',
          'Never confuse aggregate `FILTER (WHERE ...)` with a window `OVER (...)` filter: `FILTER` attaches immediately after the aggregate call (`COUNT(*) FILTER (WHERE ...) OVER (...)`), before `OVER`.',
          'Integer division still applies to two `BIGINT` counts returned by `COUNT(...) FILTER (...)`; cast the numerator with `::numeric` before dividing to compute conversion percentages.',
          'Replacing 4 self-joined stage CTEs with one `GROUP BY` + 4 `FILTER (WHERE ...)` aggregates cuts heap scans from 4 passes to 1.'
        ],
        whenToUse: 'Use `FILTER (WHERE ...)` whenever pivoting status/event-type columns into side-by-side metrics, computing multi-step product conversion funnels, or benchmarking conditional latency subsets in one table pass.'
      },
      scenario: {
        role: 'Growth & Product Telemetry Engineer',
        incidentOrGoal: 'Product analytics dashboards ran four separate self-joins over `user_events` to build signup-to-upgrade funnels, quadrupling read I/O and miscomputing `AVG` query latency by mixing `0`s from `CASE ELSE 0`.',
        stakeholderNeed: 'Rewrite plan-tier event pivots, cohort activation conversion rates, and split onboarding-vs-query latency benchmarks using single-pass `FILTER (WHERE ...)`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Plan-Tier Telemetry Pivot with COUNT(*) FILTER (WHERE ...)',
          mission: 'Left-join `saas_users u` to `user_events e` on `user_id`, group by `u.plan_tier`, and project 5 columns in exact order using `FILTER (WHERE ...)`: `plan_tier`, `total_orgs` (`COUNT(DISTINCT u.user_id)`), `signup_events` (`event_type = \'signup\'`), `query_events` (`event_type = \'query_run\'`), and `upgrade_events` (`event_type = \'upgrade_pro\'`). Sort by `total_orgs DESC, u.plan_tier ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT u.plan_tier,',
            '       COUNT(DISTINCT u.user_id) AS total_orgs',
            '       -- TODO: pivot signup_events, query_events, and upgrade_events using COUNT(*) FILTER (WHERE ...)',
            'FROM saas_users u',
            'LEFT JOIN user_events e ON e.user_id = u.user_id',
            'GROUP BY u.plan_tier',
            'ORDER BY total_orgs DESC, u.plan_tier ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT u.plan_tier,',
            '       COUNT(DISTINCT u.user_id) AS total_orgs,',
            '       COUNT(*) FILTER (WHERE e.event_type = \'signup\') AS signup_events,',
            '       COUNT(*) FILTER (WHERE e.event_type = \'query_run\') AS query_events,',
            '       COUNT(*) FILTER (WHERE e.event_type = \'upgrade_pro\') AS upgrade_events',
            'FROM saas_users u',
            'LEFT JOIN user_events e ON e.user_id = u.user_id',
            'GROUP BY u.plan_tier',
            'ORDER BY total_orgs DESC, u.plan_tier ASC;'
          ].join('\n'),
          hints: [
            'Use `COUNT(*) FILTER (WHERE e.event_type = \'signup\') AS signup_events` for the first pivoted column.',
            'Add matching `COUNT(*) FILTER (WHERE ...)` columns for `\'query_run\'` and `\'upgrade_pro\'`.',
            'Keep `ORDER BY total_orgs DESC, u.plan_tier ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bFILTER\\s*\\(\\s*WHERE\\b', flags: 'i', message: 'Use PostgreSQL `FILTER (WHERE ...)` clauses instead of `CASE WHEN`.' }
            ]
          },
          solutionExplanation: 'Each `COUNT(*) FILTER (WHERE ...)` maintains its own 8-byte counter inside the `HashAggregate` state tuple while scanning `user_events` once, returning `0` cleanly for `free` tier query/upgrade columns.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Cohort Funnel Conversion Rate (%) with Filtered COUNT(DISTINCT)',
          mission: 'Left-join `saas_users u` to `user_events e` on `user_id`, group by `u.cohort_month`, and project 5 columns in exact order: `cohort_month`, `signed_up_users` (`COUNT(DISTINCT u.user_id)`), `query_active_users` (distinct `e.user_id` with `event_type = \'query_run\'`), `upgraded_users` (distinct `e.user_id` with `event_type = \'upgrade_pro\'`), and `query_activation_pct` (`query_active_users / signed_up_users * 100` rounded to 2 decimal places). Sort by `u.cohort_month ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT u.cohort_month,',
            '       COUNT(DISTINCT u.user_id) AS signed_up_users',
            '       -- TODO: add query_active_users, upgraded_users, and query_activation_pct',
            'FROM saas_users u',
            'LEFT JOIN user_events e ON e.user_id = u.user_id',
            'GROUP BY u.cohort_month',
            'ORDER BY u.cohort_month ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT u.cohort_month,',
            '       COUNT(DISTINCT u.user_id) AS signed_up_users,',
            '       COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_type = \'query_run\') AS query_active_users,',
            '       COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_type = \'upgrade_pro\') AS upgraded_users,',
            '       ROUND(',
            '         (COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_type = \'query_run\'))::numeric * 100',
            '         / COUNT(DISTINCT u.user_id),',
            '         2',
            '       ) AS query_activation_pct',
            'FROM saas_users u',
            'LEFT JOIN user_events e ON e.user_id = u.user_id',
            'GROUP BY u.cohort_month',
            'ORDER BY u.cohort_month ASC;'
          ].join('\n'),
          hints: [
            'Pair `COUNT(DISTINCT e.user_id)` with `FILTER (WHERE e.event_type = \'query_run\')` so repeat queries by the same org count once.',
            'Cast the numerator to `::numeric` and multiply by `100` before dividing by `COUNT(DISTINCT u.user_id)`.',
            'Wrap the ratio in `ROUND(..., 2) AS query_activation_pct` and order by `u.cohort_month ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCOUNT\\s*\\(\\s*DISTINCT\\s+e\\.user_id\\s*\\)\\s*FILTER\\s*\\(\\s*WHERE\\b', flags: 'i', message: 'Combine `COUNT(DISTINCT e.user_id)` with `FILTER (WHERE ...)`.' },
              { pattern: '::numeric|100\\.0', flags: 'i', message: 'Promote the funnel ratio to `NUMERIC` before dividing.' }
            ]
          },
          solutionExplanation: 'Combining `COUNT(DISTINCT e.user_id)` with `FILTER (WHERE ...)` prevents power users who run dozens of queries from skewing user-level funnel conversion rates (`100.00%` in `2025-01`, `50.00%` in `2025-02`).'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Split Latency Benchmarks with AVG(...) FILTER (WHERE ...)',
          mission: 'Join `saas_users u` and `user_events e` on `user_id`, group by `u.user_id`, and project 5 columns in exact order: `user_id`, `org_name`, `avg_query_ms` (average `latency_ms` rounded to 2 decimals only for `event_type = \'query_run\'`, remaining `NULL` if none), `avg_onboarding_ms` (average `latency_ms` rounded to 2 decimals for `event_type IN (\'signup\', \'schema_connect\')`), and `max_event_ms` (`MAX(e.latency_ms)` across all events). Sort by `u.user_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT u.user_id,',
            '       u.org_name,',
            '       MAX(e.latency_ms) AS max_event_ms',
            '       -- TODO: add avg_query_ms and avg_onboarding_ms before max_event_ms using AVG(...) FILTER (WHERE ...)',
            'FROM saas_users u',
            'JOIN user_events e ON e.user_id = u.user_id',
            'GROUP BY u.user_id',
            'ORDER BY u.user_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT u.user_id,',
            '       u.org_name,',
            '       ROUND(AVG(e.latency_ms) FILTER (WHERE e.event_type = \'query_run\'), 2) AS avg_query_ms,',
            '       ROUND(AVG(e.latency_ms) FILTER (WHERE e.event_type IN (\'signup\', \'schema_connect\')), 2) AS avg_onboarding_ms,',
            '       MAX(e.latency_ms) AS max_event_ms',
            'FROM saas_users u',
            'JOIN user_events e ON e.user_id = u.user_id',
            'GROUP BY u.user_id',
            'ORDER BY u.user_id ASC;'
          ].join('\n'),
          hints: [
            '`AVG(e.latency_ms) FILTER (WHERE e.event_type = \'query_run\')` ignores non-query events and returns `NULL` for org `4` (`KiteAnalytics`, which never ran a query).',
            'Use `FILTER (WHERE e.event_type IN (\'signup\', \'schema_connect\'))` for `avg_onboarding_ms` and wrap both `AVG` calls in `ROUND(..., 2)`.',
            'Place `max_event_ms` 5th and sort by `u.user_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bAVG\\s*\\(\\s*e\\.latency_ms\\s*\\)\\s*FILTER\\s*\\(\\s*WHERE\\b', flags: 'i', message: 'Use `AVG(e.latency_ms) FILTER (WHERE ...)` so unmatched rows are ignored rather than averaged as `0`.' }
            ]
          },
          solutionExplanation: 'Had you written `AVG(CASE WHEN ... THEN latency_ms ELSE 0 END)`, non-matching events would inject zeros and artificially depress latency averages; `FILTER (WHERE ...)` skips non-matching tuples completely.'
        }
      ]
    },

    /* ========================================================================
       LAB 04: pg-m04-t04 — Ordered Collection Builders: STRING_AGG, ARRAY_AGG & JSONB_AGG
       ======================================================================== */
    {
      id: 'pg-m04-t04',
      slug: 'ordered-collection-aggregates',
      moduleId: 'pg-m04',
      title: 'Ordered Collection Builders: STRING_AGG, ARRAY_AGG & JSONB_AGG',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'ecommerce',
      clauses: ['STRING_AGG', 'ARRAY_AGG', 'JSONB_AGG', 'JSONB_OBJECT_AGG'],
      tags: ['string-agg', 'array-agg', 'jsonb-agg', 'aggregates', 'api-payloads'],
      guide: {
        mentalModel: 'Unlike scalar aggregates that collapse N rows into one number, PostgreSQL\'s **collection aggregates** (`STRING_AGG`, `ARRAY_AGG`, `JSONB_AGG`, `JSONB_OBJECT_AGG`) accumulate per-group tuples into structured arrays, delimited text, or binary `JSONB` documents right inside the database engine—eliminating N+1 ORM queries and application-side hydration loops.\n\nBecause heap scans and hash joins emit tuples in arbitrary physical order, collection aggregates accept an **intra-aggregate `ORDER BY` clause** (`ARRAY_AGG(p.sku ORDER BY oi.order_item_id ASC)`). PostgreSQL buffers each group\'s datums into a `tuplesort` state (bounded by `work_mem`) and runs the sort before invoking the finalizer, guaranteeing deterministic arrays and API payloads.',
        syntaxAnatomy: [
          'SELECT o.order_id,',
          '       STRING_AGG(p.sku, \', \' ORDER BY p.sku ASC) AS sku_csv,',
          '       ARRAY_AGG(oi.quantity ORDER BY p.sku ASC) AS quantities_by_sku,',
          '       JSONB_AGG(',
          '         jsonb_build_object(\'sku\', p.sku, \'qty\', oi.quantity)',
          '         ORDER BY oi.order_item_id ASC',
          '       ) AS items_json',
          'FROM orders o',
          'JOIN order_items oi ON oi.order_id = o.order_id',
          'JOIN products p ON p.product_id = oi.product_id',
          'GROUP BY o.order_id;'
        ].join('\n'),
        internalsAndGotchas: [
          'Without an intra-aggregate `ORDER BY` (`STRING_AGG(sku, \', \' ORDER BY sku)`), element order silently changes whenever autovacuum, synchronized sequential scans, or hash joins reorder heap pages.',
          '`ARRAY_AGG(col)` and `JSONB_AGG(col)` **include `NULL` elements** (`[null]` on an unmatched `LEFT JOIN`!), whereas `STRING_AGG(col, sep)` skips `NULL`s; pair `JSONB_AGG` with `FILTER (WHERE child.id IS NOT NULL)` and `COALESCE(..., \'[]\'::jsonb)` on outer joins.',
          '`JSONB_OBJECT_AGG(key, val)` raises `field name must not be null` if any `key` evaluates to `NULL`, and binary `JSONB` canonically deduplicates duplicate keys (last value wins) while sorting keys by length then byte order.',
          'Each distinct intra-aggregate `ORDER BY` signature forces its own per-group sort pass; align identical `ORDER BY` clauses across sibling aggregates so PostgreSQL shares a single sort.'
        ],
        whenToUse: 'Use `STRING_AGG` for human-readable CSV summaries, `ARRAY_AGG` when passing typed PostgreSQL arrays (`INT[]`, `TEXT[]`) downstream, and `JSONB_AGG` / `JSONB_OBJECT_AGG` to return nested REST/GraphQL payloads in a single SQL roundtrip.'
      },
      scenario: {
        role: 'Platform API Engineer',
        incidentOrGoal: 'The order-history microservice executed 1 + N queries per page to fetch line items and intermittently failed snapshot tests because `STRING_AGG` and `JSONB_AGG` lacked deterministic intra-aggregate `ORDER BY`.',
        stakeholderNeed: 'Build deterministically sorted SKU manifests, nested `JSONB` line-item arrays for completed orders, and outer-join-safe category price dictionaries.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Deterministic Manifests with STRING_AGG & ARRAY_AGG',
          mission: 'Join `orders o`, `order_items oi`, and `products p`, group by `o.order_id`, and project 4 columns in exact order: `order_id`, `line_count` (`COUNT(*)`), `sku_csv` (`p.sku` joined with `\', \'` sorted by `p.sku ASC`), and `quantities_by_sku` (`ARRAY_AGG` of `oi.quantity` sorted by `p.sku ASC`). Sort the outer result by `o.order_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT o.order_id,',
            '       COUNT(*) AS line_count',
            '       -- TODO: add sku_csv (STRING_AGG) and quantities_by_sku (ARRAY_AGG), both ordered by p.sku ASC',
            'FROM orders o',
            'JOIN order_items oi ON oi.order_id = o.order_id',
            'JOIN products p ON p.product_id = oi.product_id',
            'GROUP BY o.order_id',
            'ORDER BY o.order_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT o.order_id,',
            '       COUNT(*) AS line_count,',
            '       STRING_AGG(p.sku, \', \' ORDER BY p.sku ASC) AS sku_csv,',
            '       ARRAY_AGG(oi.quantity ORDER BY p.sku ASC) AS quantities_by_sku',
            'FROM orders o',
            'JOIN order_items oi ON oi.order_id = o.order_id',
            'JOIN products p ON p.product_id = oi.product_id',
            'GROUP BY o.order_id',
            'ORDER BY o.order_id ASC;'
          ].join('\n'),
          hints: [
            'Place `ORDER BY p.sku ASC` inside the aggregate parentheses after the separator: `STRING_AGG(p.sku, \', \' ORDER BY p.sku ASC)`.',
            'Use the exact same intra-aggregate sort key in `ARRAY_AGG(oi.quantity ORDER BY p.sku ASC)` so PostgreSQL shares one sort state.',
            'Order the final rows by `o.order_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bSTRING_AGG\\s*\\([^)]*\\bORDER\\s+BY\\b', flags: 'i', message: 'Use `STRING_AGG(... ORDER BY p.sku ASC)` for deterministic string ordering.' },
              { pattern: '\\bARRAY_AGG\\s*\\([^)]*\\bORDER\\s+BY\\b', flags: 'i', message: 'Use `ARRAY_AGG(... ORDER BY p.sku ASC)` for aligned quantity arrays.' }
            ]
          },
          solutionExplanation: 'Sharing identical `ORDER BY p.sku ASC` specifications lets PostgreSQL\'s planner reuse a single per-group sort across both `STRING_AGG` and `ARRAY_AGG`, keeping `sku_csv` and `quantities_by_sku` index-aligned.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Nested REST Line-Item Payloads with JSONB_AGG & jsonb_build_object',
          mission: 'Join `orders o`, `order_items oi`, and `products p`, filter to `o.status = \'completed\'`, group by `o.order_id`, and project 4 columns in exact order: `order_id`, `customer_id`, `total_cents`, and `items_json` — a `JSONB_AGG` ordered by `oi.order_item_id ASC` where each element is `jsonb_build_object(\'sku\', p.sku, \'qty\', oi.quantity, \'line_cents\', oi.quantity * oi.unit_price_cents)`. Sort by `o.order_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT o.order_id,',
            '       o.customer_id,',
            '       o.total_cents',
            '       -- TODO: add JSONB_AGG(jsonb_build_object(...) ORDER BY oi.order_item_id ASC) AS items_json',
            'FROM orders o',
            'JOIN order_items oi ON oi.order_id = o.order_id',
            'JOIN products p ON p.product_id = oi.product_id',
            'WHERE o.status = \'completed\'',
            'GROUP BY o.order_id',
            'ORDER BY o.order_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT o.order_id,',
            '       o.customer_id,',
            '       o.total_cents,',
            '       JSONB_AGG(',
            '         jsonb_build_object(',
            '           \'sku\', p.sku,',
            '           \'qty\', oi.quantity,',
            '           \'line_cents\', oi.quantity * oi.unit_price_cents',
            '         )',
            '         ORDER BY oi.order_item_id ASC',
            '       ) AS items_json',
            'FROM orders o',
            'JOIN order_items oi ON oi.order_id = o.order_id',
            'JOIN products p ON p.product_id = oi.product_id',
            'WHERE o.status = \'completed\'',
            'GROUP BY o.order_id',
            'ORDER BY o.order_id ASC;'
          ].join('\n'),
          hints: [
            'Construct each line object with `jsonb_build_object(\'sku\', p.sku, \'qty\', oi.quantity, \'line_cents\', oi.quantity * oi.unit_price_cents)`.',
            'Wrap that expression in `JSONB_AGG(... ORDER BY oi.order_item_id ASC) AS items_json`.',
            '`o.customer_id` and `o.total_cents` are legal in `SELECT` via `orders.order_id` PK functional dependency.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bJSONB_AGG\\s*\\([\\s\\S]*\\bjsonb_build_object\\s*\\(', flags: 'i', message: 'Compose nested `JSONB` arrays using `JSONB_AGG(jsonb_build_object(...))`.' }
            ]
          },
          solutionExplanation: 'Building the `JSONB` array inside PostgreSQL streams one compact row per order with typed integer `qty` and `line_cents` fields, avoiding 7 follow-up line-item queries in the API tier.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — NULL-Safe Key-Value Maps with JSONB_OBJECT_AGG & FILTER',
          mission: 'Left-join `categories cat` to `products p` on `category_id`, group by `cat.category_id`, and project 4 columns in exact order: `category_id`, `category_name` (`cat.name`), `active_count` (count of products with `p.is_active = 1`), and `sku_price_map` — a `JSONB` object mapping `p.sku` to `p.price_cents` for active products (`p.is_active = 1`), defaulting to `\'\{\}\'::jsonb` when a category has zero active products (such as `Hardware`). Sort by `cat.category_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT cat.category_id,',
            '       cat.name AS category_name,',
            '       COUNT(p.product_id) FILTER (WHERE p.is_active = 1) AS active_count',
            '       -- TODO: add COALESCE(JSONB_OBJECT_AGG(p.sku, p.price_cents) FILTER (WHERE p.is_active = 1), \'{}\'::jsonb) AS sku_price_map',
            'FROM categories cat',
            'LEFT JOIN products p ON p.category_id = cat.category_id',
            'GROUP BY cat.category_id',
            'ORDER BY cat.category_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT cat.category_id,',
            '       cat.name AS category_name,',
            '       COUNT(p.product_id) FILTER (WHERE p.is_active = 1) AS active_count,',
            '       COALESCE(',
            '         JSONB_OBJECT_AGG(p.sku, p.price_cents) FILTER (WHERE p.is_active = 1),',
            '         \'{}\'::jsonb',
            '       ) AS sku_price_map',
            'FROM categories cat',
            'LEFT JOIN products p ON p.category_id = cat.category_id',
            'GROUP BY cat.category_id',
            'ORDER BY cat.category_id ASC;'
          ].join('\n'),
          hints: [
            'Without `FILTER (WHERE p.is_active = 1)`, an unmatched `LEFT JOIN` row passes `p.sku = NULL` into `JSONB_OBJECT_AGG` and throws `field name must not be null`!',
            'Because a filtered aggregate over 0 matching rows returns SQL `NULL`, wrap it in `COALESCE(..., \'{}\'::jsonb) AS sku_price_map`.',
            'Sort by `cat.category_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bJSONB_OBJECT_AGG\\s*\\(\\s*p\\.sku\\s*,\\s*p\\.price_cents\\s*\\)\\s*FILTER\\s*\\(\\s*WHERE\\b', flags: 'i', message: 'Guard `JSONB_OBJECT_AGG(p.sku, p.price_cents)` with `FILTER (WHERE p.is_active = 1)`.' }
            ]
          },
          solutionExplanation: 'Guarding `JSONB_OBJECT_AGG` with `FILTER (WHERE p.is_active = 1)` simultaneously excludes discontinued `TAPE-LTO9-18T` and prevents `Hardware` (`category_id = 10`, where `p.sku IS NULL`) from crashing with a null-key error.'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m04-t05 — Tail-Latency Analytics: PERCENTILE_CONT, PERCENTILE_DISC & MODE
       ======================================================================== */
    {
      id: 'pg-m04-t05',
      slug: 'ordered-set-hypothetical-percentiles',
      moduleId: 'pg-m04',
      title: 'Tail-Latency Analytics: PERCENTILE_CONT, PERCENTILE_DISC & MODE',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'pg_ops_telemetry',
      clauses: ['WITHIN GROUP', 'PERCENTILE_CONT', 'PERCENTILE_DISC', 'MODE'],
      tags: ['percentiles', 'p95', 'p99', 'within-group', 'analytics'],
      guide: {
        mentalModel: 'Arithmetic `AVG()` hides bimodal latency distributions and tail spikes: nine `20 ms` calls plus one `5000 ms` timeout average `518 ms`, representing neither typical users nor worst-case pain. PostgreSQL implements SQL-standard **ordered-set aggregates** (`WITHIN GROUP (ORDER BY sort_expr)`) that sort each group\'s non-null values and probe exact quantile positions.\n\n`PERCENTILE_CONT(f)` treats the distribution as continuous, **linearly interpolating** between adjacent sorted points and returning `DOUBLE PRECISION`, whereas `PERCENTILE_DISC(f)` returns the **first discrete sample** whose cumulative distribution `>= f` in the input\'s exact data type. PostgreSQL also provides `MODE()` for the most frequent value and **hypothetical-set aggregates** (`RANK(x) WITHIN GROUP (...)`) to score where a target threshold `x` would rank without inserting it.',
        syntaxAnatomy: [
          'SELECT endpoint,',
          '       COUNT(*) AS sample_count,',
          '       ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms))::numeric, 2) AS p50_cont_ms,',
          '       PERCENTILE_DISC(0.50) WITHIN GROUP (ORDER BY latency_ms) AS p50_disc_ms,',
          '       MODE() WITHIN GROUP (ORDER BY status_code) AS modal_status',
          'FROM api_audit_events',
          'WHERE env = \'prod\'',
          'GROUP BY endpoint;'
        ].join('\n'),
        internalsAndGotchas: [
          '`PERCENTILE_CONT` always returns `DOUBLE PRECISION` (or `INTERVAL`), so calling two-argument `ROUND(val, 2)` requires an explicit `::numeric` cast around the `PERCENTILE_CONT(...) WITHIN GROUP (...)` expression.',
          'Ordered-set aggregates **cannot** be used directly as window functions with `OVER (...)` in PostgreSQL—compute them per group in a `GROUP BY` or `LATERAL` subquery.',
          '`NULL` values in the `WITHIN GROUP (ORDER BY col)` sort column are ignored completely before computing quantile positions.',
          'Passing an array `PERCENTILE_CONT(ARRAY[0.50, 0.95, 0.99]) WITHIN GROUP (ORDER BY latency_ms)` computes multiple percentiles in a **single sort pass**, returning `FLOAT8[]`.'
        ],
        whenToUse: 'Use `PERCENTILE_CONT` for interpolated SLO dashboards (`p50`, `p95`, `p99`), `PERCENTILE_DISC` when the output must be an actual observed sample/type, `MODE()` for dominant categorical values, and `RANK(x) WITHIN GROUP` for hypothetical SLO grading.'
      },
      scenario: {
        role: 'Site Reliability & Performance Engineer',
        incidentOrGoal: 'Mean endpoint latency looked healthy during an upstream payout brownout while `p95` breached 3.8 seconds, and DBRE needed regional host CPU medians plus hypothetical `100 ms` query-rank scoring.',
        stakeholderNeed: 'Contrast interpolated `PERCENTILE_CONT` vs discrete `PERCENTILE_DISC` on `api_audit_events`, compute regional CPU/memory quantiles + `MODE()` host on `telemetry_partitioned`, and score `cluster_stat_statements`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Continuous vs Discrete Latency Quantiles on api_audit_events',
          mission: 'Filter `api_audit_events` to `env = \'prod\'`, group by `endpoint`, and project 5 columns in exact order: `endpoint`, `sample_count` (`COUNT(*)`), `p50_cont_ms` (interpolated `PERCENTILE_CONT(0.50)` over `latency_ms` cast to `numeric` and rounded to 2 decimals), `p50_disc_ms` (`PERCENTILE_DISC(0.50)` over `latency_ms`), and `p95_cont_ms` (`PERCENTILE_CONT(0.95)` over `latency_ms` cast to `numeric` and rounded to 2 decimals). Sort by `p95_cont_ms DESC, endpoint ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT endpoint,',
            '       COUNT(*) AS sample_count',
            '       -- TODO: add p50_cont_ms, p50_disc_ms, and p95_cont_ms using WITHIN GROUP (ORDER BY latency_ms)',
            'FROM api_audit_events',
            'WHERE env = \'prod\'',
            'GROUP BY endpoint',
            'ORDER BY endpoint ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT endpoint,',
            '       COUNT(*) AS sample_count,',
            '       ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms))::numeric, 2) AS p50_cont_ms,',
            '       PERCENTILE_DISC(0.50) WITHIN GROUP (ORDER BY latency_ms) AS p50_disc_ms,',
            '       ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms))::numeric, 2) AS p95_cont_ms',
            'FROM api_audit_events',
            'WHERE env = \'prod\'',
            'GROUP BY endpoint',
            'ORDER BY p95_cont_ms DESC, endpoint ASC;'
          ].join('\n'),
          hints: [
            'Wrap `PERCENTILE_CONT(...) WITHIN GROUP (ORDER BY latency_ms)` in parentheses before casting `::numeric` inside `ROUND(..., 2)`.',
            '`PERCENTILE_DISC(0.50) WITHIN GROUP (ORDER BY latency_ms)` preserves `INTEGER` directly—no `ROUND` needed.',
            'Sort by `p95_cont_ms DESC, endpoint ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bPERCENTILE_CONT\\s*\\(\\s*0\\.50?\\s*\\)\\s*WITHIN\\s+GROUP', flags: 'i', message: 'Use `PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms)`.' },
              { pattern: '\\bPERCENTILE_DISC\\s*\\(\\s*0\\.50?\\s*\\)\\s*WITHIN\\s+GROUP', flags: 'i', message: 'Use `PERCENTILE_DISC(0.50) WITHIN GROUP (ORDER BY latency_ms)`.' }
            ]
          },
          solutionExplanation: 'On `/v2/payouts` (`[38, 142, 215, 5002]`), `PERCENTILE_CONT(0.50)` interpolates halfway between `142` and `215` (`178.50`), whereas `PERCENTILE_DISC(0.50)` picks the discrete 2nd sample (`142`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Regional Host Telemetry Quantiles & MODE() Dominant Host',
          mission: 'Query `telemetry_partitioned` grouped by `region` and project 5 columns in exact order: `region`, `samples` (`COUNT(*)`), `median_cpu_pct` (`PERCENTILE_CONT(0.50)` over `cpu_pct` cast to `numeric` and rounded to 2 decimals), `p95_mem_mb` (`PERCENTILE_DISC(0.95)` over `mem_used_mb`), and `modal_host` (most frequent `host_name` via `MODE()`). Sort by `median_cpu_pct DESC, region ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT region,',
            '       COUNT(*) AS samples',
            '       -- TODO: add median_cpu_pct, p95_mem_mb, and modal_host (MODE)',
            'FROM telemetry_partitioned',
            'GROUP BY region',
            'ORDER BY region ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT region,',
            '       COUNT(*) AS samples,',
            '       ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY cpu_pct))::numeric, 2) AS median_cpu_pct,',
            '       PERCENTILE_DISC(0.95) WITHIN GROUP (ORDER BY mem_used_mb) AS p95_mem_mb,',
            '       MODE() WITHIN GROUP (ORDER BY host_name) AS modal_host',
            'FROM telemetry_partitioned',
            'GROUP BY region',
            'ORDER BY median_cpu_pct DESC, region ASC;'
          ].join('\n'),
          hints: [
            '`MODE()` takes zero arguments inside `MODE()` and specifies the target column in `WITHIN GROUP (ORDER BY host_name)`.',
            'Use `PERCENTILE_DISC(0.95) WITHIN GROUP (ORDER BY mem_used_mb) AS p95_mem_mb` for exact observed memory MB.',
            'Order by `median_cpu_pct DESC, region ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bMODE\\s*\\(\\s*\\)\\s*WITHIN\\s+GROUP\\s*\\(\\s*ORDER\\s+BY\\s+host_name\\b', flags: 'i', message: 'Use `MODE() WITHIN GROUP (ORDER BY host_name)` to extract the most frequent host.' }
            ]
          },
          solutionExplanation: 'PostgreSQL transparently scans all three monthly child partitions of `telemetry_partitioned`, sorting each region\'s samples to find `us-east-1`\'s dominant emitter (`pg-prim-01`, 4 of 6 samples) and `p95` RAM.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Multi-Quantile Array & Hypothetical RANK() on cluster_stat_statements',
          mission: 'Group `cluster_stat_statements` by `CASE WHEN temp_blks_written > 0 THEN \'disk_spill\' ELSE \'in_memory\' END` aliased as `workload_class`, and project 5 columns in exact order: `workload_class`, `statement_count` (`COUNT(*)`), `p50_mean_ms` (`PERCENTILE_CONT(0.50)` over `mean_exec_time_ms` cast to `numeric` and rounded to 2 decimals), `p95_mean_ms` (`PERCENTILE_CONT(0.95)` over `mean_exec_time_ms` cast to `numeric` and rounded to 2 decimals), and `hypothetical_rank_100ms` — where a hypothetical `100.0` ms query would rank in ascending `mean_exec_time_ms` order using `RANK(100.0) WITHIN GROUP (ORDER BY mean_exec_time_ms ASC)`. Sort by `workload_class ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT CASE WHEN temp_blks_written > 0 THEN \'disk_spill\' ELSE \'in_memory\' END AS workload_class,',
            '       COUNT(*) AS statement_count',
            '       -- TODO: add p50_mean_ms, p95_mean_ms, and RANK(100.0) WITHIN GROUP (...) AS hypothetical_rank_100ms',
            'FROM cluster_stat_statements',
            'GROUP BY workload_class',
            'ORDER BY workload_class ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT CASE WHEN temp_blks_written > 0 THEN \'disk_spill\' ELSE \'in_memory\' END AS workload_class,',
            '       COUNT(*) AS statement_count,',
            '       ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY mean_exec_time_ms))::numeric, 2) AS p50_mean_ms,',
            '       ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY mean_exec_time_ms))::numeric, 2) AS p95_mean_ms,',
            '       RANK(100.0) WITHIN GROUP (ORDER BY mean_exec_time_ms ASC) AS hypothetical_rank_100ms',
            'FROM cluster_stat_statements',
            'GROUP BY workload_class',
            'ORDER BY workload_class ASC;'
          ].join('\n'),
          hints: [
            'PostgreSQL permits `GROUP BY workload_class` referencing a simple `SELECT` alias, or repeating the `CASE` expression.',
            'Use `RANK(100.0) WITHIN GROUP (ORDER BY mean_exec_time_ms ASC) AS hypothetical_rank_100ms` to compute the 1-based hypothetical rank.',
            'Sort by `workload_class ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bRANK\\s*\\(\\s*100(?:\\.0+)?\\s*\\)\\s*WITHIN\\s+GROUP', flags: 'i', message: 'Use hypothetical-set aggregate `RANK(100.0) WITHIN GROUP (ORDER BY mean_exec_time_ms ASC)`.' }
            ]
          },
          solutionExplanation: 'In `disk_spill` (`[2200, 6000, 7200]` ms), a `100.0 ms` query would be fastest (`rank 1`), whereas in `in_memory` (`[0.8, 1.4, 8.5, 15, 15, 185]` ms) it lands at `rank 6`, slower than 5 of the 6 statements.'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m04-t06 — OLAP Subtotals: GROUPING SETS, ROLLUP, CUBE & GROUPING()
       ======================================================================== */
    {
      id: 'pg-m04-t06',
      slug: 'grouping-sets-rollup-cube',
      moduleId: 'pg-m04',
      title: 'OLAP Subtotals in One Scan: GROUPING SETS, ROLLUP, CUBE & GROUPING()',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'ecommerce',
      clauses: ['GROUPING SETS', 'ROLLUP', 'CUBE', 'GROUPING'],
      tags: ['grouping-sets', 'rollup', 'cube', 'olap', 'subtotals'],
      guide: {
        mentalModel: 'Before OLAP grouping extensions, generating detail rows plus tier subtotals plus a grand total forced `N` separate `GROUP BY` queries stitched together with `UNION ALL`, scanning the underlying join `N` times. PostgreSQL\'s **MixedAggregate / GroupAggregate** engine executes `GROUPING SETS`, `ROLLUP`, and `CUBE` in a **single base-query pass**, simultaneously feeding multiple hash tables or multi-phase sort chains.\n\n`ROLLUP(a, b)` expands to hierarchical prefix sets `((a, b), (a), ())`; `CUBE(a, b)` expands to all $2^k$ combinations `((a, b), (a), (b), ())`. Because omitted dimensions are padded with `NULL` in subtotal rows, **never use `COALESCE(col, \'TOTAL\')` on nullable columns**—use `GROUPING(col)` (returns `1` when `col` is aggregated away, `0` when `col` is an actual group key, even if its real data value is `NULL`!).',
        syntaxAnatomy: [
          'SELECT CASE WHEN GROUPING(c.tier) = 1 THEN \'ALL_TIERS\' ELSE c.tier END AS tier_label,',
          '       CASE WHEN GROUPING(o.status) = 1 THEN \'ALL_STATUSES\' ELSE o.status END AS status_label,',
          '       GROUPING(c.tier, o.status) AS grouping_mask, -- Bitmask: 0=detail, 1=tier sub, 3=grand total',
          '       COUNT(*) AS order_count,',
          '       ROUND(SUM(o.total_cents)::numeric / 100, 2) AS gross_usd',
          'FROM customers c',
          'JOIN orders o ON o.customer_id = c.customer_id',
          'GROUP BY ROLLUP (c.tier, o.status);'
        ].join('\n'),
        internalsAndGotchas: [
          'If `orders.discount_code` contains real `NULL` rows, `COALESCE(discount_code, \'SUBTOTAL\')` mislabels real un-discounted orders as subtotals! Always inspect `GROUPING(discount_code) = 1` first.',
          'Multi-argument `GROUPING(a, b)` returns an integer **bitmask** where `a` is bit 1 (`2`) and `b` is bit 0 (`1`): `(a,b)->0`, `(a)->1`, `(b)->2`, `()->3`.',
          '`CUBE(a, b, c, d)` explodes to $2^4 = 16$ grouping sets; prefer explicit `GROUPING SETS (...)` when UI tables only render 2 or 3 specific summary views.',
          'In `ORDER BY`, sort by `GROUPING(col) ASC` so detail rows (`0`) reliably appear above subtotal/grand-total rows (`1`).'
        ],
        whenToUse: 'Use `GROUPING SETS` for independent side-by-side dimensional breakdowns, `ROLLUP` for parent->child drill-down hierarchies with grand totals, and `CUBE` + `GROUPING()` for cross-tab pivot matrices.'
      },
      scenario: {
        role: 'BI & Financial Data Warehouse Engineer',
        incidentOrGoal: 'Finance\'s month-end revenue report unioned three full joins of `customers` and `orders`, and a promo-code audit merged real `NULL` (`no promo`) orders into the subtotal row because someone used `COALESCE` without `GROUPING()`.',
        stakeholderNeed: 'Consolidate tier/country breakdowns via `GROUPING SETS`, build hierarchical `tier -> status` subtotals via `ROLLUP`, and cross-tabulate payment methods vs nullable promo codes safely via `CUBE` + `GROUPING()`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Multi-Axis Summaries in One Scan with GROUPING SETS',
          mission: 'Join `customers c` and `orders o` on `customer_id`, filter `WHERE o.status = \'completed\'`, and aggregate with `GROUP BY GROUPING SETS ((c.tier), (c.country), ())`. Project 5 columns in exact order: `tier_label` (`\'ALL_TIERS\'` when `GROUPING(c.tier) = 1` else `c.tier`), `country_label` (`\'ALL_COUNTRIES\'` when `GROUPING(c.country) = 1` else `c.country`), `grouping_mask` (`GROUPING(c.tier, c.country)`), `completed_orders` (`COUNT(*)`), and `revenue_usd` (`SUM(o.total_cents)` in USD rounded to 2 decimals). Sort by `grouping_mask ASC, revenue_usd DESC, tier_label ASC, country_label ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT c.tier AS tier_label,',
            '       c.country AS country_label,',
            '       COUNT(*) AS completed_orders',
            '       -- TODO: label subtotal NULLs via GROUPING(), add grouping_mask & revenue_usd, and use GROUPING SETS',
            'FROM customers c',
            'JOIN orders o ON o.customer_id = c.customer_id',
            'WHERE o.status = \'completed\'',
            'GROUP BY c.tier, c.country;'
          ].join('\n'),
          solutionCode: [
            'SELECT CASE WHEN GROUPING(c.tier) = 1 THEN \'ALL_TIERS\' ELSE c.tier END AS tier_label,',
            '       CASE WHEN GROUPING(c.country) = 1 THEN \'ALL_COUNTRIES\' ELSE c.country END AS country_label,',
            '       GROUPING(c.tier, c.country) AS grouping_mask,',
            '       COUNT(*) AS completed_orders,',
            '       ROUND(SUM(o.total_cents)::numeric / 100, 2) AS revenue_usd',
            'FROM customers c',
            'JOIN orders o ON o.customer_id = c.customer_id',
            'WHERE o.status = \'completed\'',
            'GROUP BY GROUPING SETS ((c.tier), (c.country), ())',
            'ORDER BY grouping_mask ASC, revenue_usd DESC, tier_label ASC, country_label ASC;'
          ].join('\n'),
          hints: [
            'Write `GROUP BY GROUPING SETS ((c.tier), (c.country), ())`—the empty `()` produces the grand total row.',
            '`GROUPING(c.tier, c.country)` returns bitmask `1` for `(c.tier)` rows, `2` for `(c.country)` rows, and `3` for `()`.',
            'Sort by `grouping_mask ASC, revenue_usd DESC, tier_label ASC, country_label ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bGROUPING\\s+SETS\\s*\\(', flags: 'i', message: 'Use `GROUP BY GROUPING SETS ((c.tier), (c.country), ())`.' },
              { pattern: '\\bGROUPING\\s*\\(\\s*c\\.tier\\s*,\\s*c\\.country\\s*\\)', flags: 'i', message: 'Compute the bitmask with `GROUPING(c.tier, c.country)`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL\'s `MixedAggregate` computes `(c.tier)`, `(c.country)`, and `()` grand-total rows from a single scan of completed orders, tagging each level with bitmasks `1`, `2`, and `3`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Hierarchical Tier -> Status Drilldown with ROLLUP',
          mission: 'Join `customers c` and `orders o` on `customer_id`, group with `GROUP BY ROLLUP (c.tier, o.status)`, and project 5 columns in exact order: `tier_level` (`\'GRAND_TOTAL\'` when `GROUPING(c.tier) = 1` else `c.tier`), `status_level` (`\'ALL_STATUSES\'` when `GROUPING(c.tier) = 1`, `\'TIER_SUBTOTAL\'` when `GROUPING(o.status) = 1`, else `o.status`), `is_subtotal` (`GROUPING(o.status)`), `order_count` (`COUNT(*)`), and `gross_usd` (`SUM(o.total_cents)` in USD rounded to 2 decimals). Sort by `GROUPING(c.tier) ASC, c.tier ASC NULLS LAST, GROUPING(o.status) ASC, o.status ASC NULLS LAST`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT c.tier AS tier_level,',
            '       o.status AS status_level,',
            '       COUNT(*) AS order_count',
            '       -- TODO: add GROUPING() labels, is_subtotal, gross_usd, and GROUP BY ROLLUP (c.tier, o.status)',
            'FROM customers c',
            'JOIN orders o ON o.customer_id = c.customer_id',
            'GROUP BY c.tier, o.status;'
          ].join('\n'),
          solutionCode: [
            'SELECT CASE WHEN GROUPING(c.tier) = 1 THEN \'GRAND_TOTAL\' ELSE c.tier END AS tier_level,',
            '       CASE',
            '         WHEN GROUPING(c.tier) = 1 THEN \'ALL_STATUSES\'',
            '         WHEN GROUPING(o.status) = 1 THEN \'TIER_SUBTOTAL\'',
            '         ELSE o.status',
            '       END AS status_level,',
            '       GROUPING(o.status) AS is_subtotal,',
            '       COUNT(*) AS order_count,',
            '       ROUND(SUM(o.total_cents)::numeric / 100, 2) AS gross_usd',
            'FROM customers c',
            'JOIN orders o ON o.customer_id = c.customer_id',
            'GROUP BY ROLLUP (c.tier, o.status)',
            'ORDER BY GROUPING(c.tier) ASC, c.tier ASC NULLS LAST, GROUPING(o.status) ASC, o.status ASC NULLS LAST;'
          ].join('\n'),
          hints: [
            '`ROLLUP (c.tier, o.status)` generates `(c.tier, o.status)` detail rows, `(c.tier)` tier subtotals, and `()` grand total (never bare `(o.status)`).',
            'In `status_level`, check `WHEN GROUPING(c.tier) = 1` first (`\'ALL_STATUSES\'`), then `WHEN GROUPING(o.status) = 1` (`\'TIER_SUBTOTAL\'`).',
            'Use the exact `ORDER BY GROUPING(c.tier) ASC, c.tier ASC NULLS LAST, GROUPING(o.status) ASC, o.status ASC NULLS LAST` so each tier\'s detail rows precede its subtotal.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bROLLUP\\s*\\(\\s*c\\.tier\\s*,\\s*o\\.status\\s*\\)', flags: 'i', message: 'Use `GROUP BY ROLLUP (c.tier, o.status)`.' }
            ]
          },
          solutionExplanation: 'Ordering by `GROUPING(c.tier) ASC, c.tier ASC, GROUPING(o.status) ASC` keeps every tier\'s status breakdown neatly followed by its `TIER_SUBTOTAL` line and places `GRAND_TOTAL` at the very bottom.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — CUBE Cross-Tab & Disambiguating Real NULLs with GROUPING()',
          mission: 'Join `payments p` and `orders o` on `order_id` where `p.status = \'settled\'`, and cross-tabulate with `GROUP BY CUBE (p.method, o.discount_code)`. Because `o.discount_code` has real `NULL`s, use `GROUPING()` to project 5 columns in exact order: `method_dim` (`\'ALL_METHODS\'` when `GROUPING(p.method) = 1` else `p.method`), `promo_dim` (`\'ALL_PROMOS\'` when `GROUPING(o.discount_code) = 1` else `COALESCE(o.discount_code, \'NO_PROMO\')`), `grouping_id` (`GROUPING(p.method, o.discount_code)`), `payment_count` (`COUNT(*)`), and `settled_usd` (`SUM(p.amount_cents)` in USD rounded to 2 decimals). Sort by `grouping_id ASC, method_dim ASC, promo_dim ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT p.method AS method_dim,',
            '       COALESCE(o.discount_code, \'NO_PROMO\') AS promo_dim, -- BUG on CUBE: hides ALL_PROMOS subtotals!',
            '       COUNT(*) AS payment_count',
            '       -- TODO: disambiguate real NULLs vs CUBE subtotals with GROUPING(), add grouping_id & settled_usd',
            'FROM payments p',
            'JOIN orders o ON o.order_id = p.order_id',
            'WHERE p.status = \'settled\'',
            'GROUP BY p.method, o.discount_code;'
          ].join('\n'),
          solutionCode: [
            'SELECT CASE WHEN GROUPING(p.method) = 1 THEN \'ALL_METHODS\' ELSE p.method END AS method_dim,',
            '       CASE',
            '         WHEN GROUPING(o.discount_code) = 1 THEN \'ALL_PROMOS\'',
            '         ELSE COALESCE(o.discount_code, \'NO_PROMO\')',
            '       END AS promo_dim,',
            '       GROUPING(p.method, o.discount_code) AS grouping_id,',
            '       COUNT(*) AS payment_count,',
            '       ROUND(SUM(p.amount_cents)::numeric / 100, 2) AS settled_usd',
            'FROM payments p',
            'JOIN orders o ON o.order_id = p.order_id',
            'WHERE p.status = \'settled\'',
            'GROUP BY CUBE (p.method, o.discount_code)',
            'ORDER BY grouping_id ASC, method_dim ASC, promo_dim ASC;'
          ].join('\n'),
          hints: [
            'Check `WHEN GROUPING(o.discount_code) = 1 THEN \'ALL_PROMOS\'` BEFORE applying `COALESCE(o.discount_code, \'NO_PROMO\')`.',
            'Aggregate with `GROUP BY CUBE (p.method, o.discount_code)` to emit all 4 dimensional combinations (`0`, `1`, `2`, `3`).',
            'Sort by `grouping_id ASC, method_dim ASC, promo_dim ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bCUBE\\s*\\(\\s*p\\.method\\s*,\\s*o\\.discount_code\\s*\\)', flags: 'i', message: 'Use `GROUP BY CUBE (p.method, o.discount_code)`.' },
              { pattern: '\\bGROUPING\\s*\\(\\s*o\\.discount_code\\s*\\)', flags: 'i', message: 'Inspect `GROUPING(o.discount_code)` to separate super-aggregate `NULL`s from real `NULL` promo codes.' }
            ]
          },
          solutionExplanation: 'Checking `GROUPING(o.discount_code) = 1` first preserves full-price `NO_PROMO` rows (`grouping_id` `0` and `2`) as their own legitimate data slice instead of conflating them with `ALL_PROMOS` rollups (`grouping_id` `1` and `3`).'
        }
      ]
    },

    /* ========================================================================
       LAB 07: pg-m04-t07 — Window Ranking & LAG / LEAD Navigation
       ======================================================================== */
    {
      id: 'pg-m04-t07',
      slug: 'window-ranking-lag-lead-navigation',
      moduleId: 'pg-m04',
      title: 'Window Ranking (ROW_NUMBER, RANK, DENSE_RANK) & LAG / LEAD Deltas',
      difficulty: 'Intermediate',
      estimatedMinutes: 16,
      datasetId: 'org_hr',
      clauses: ['OVER', 'PARTITION BY', 'ROW_NUMBER', 'DENSE_RANK', 'LAG', 'LEAD', 'WINDOW'],
      tags: ['window-functions', 'row-number', 'dense-rank', 'lag', 'lead'],
      guide: {
        mentalModel: 'Unlike `GROUP BY`, which collapses each partition into a single summary tuple, a PostgreSQL **WindowAgg** executor node preserves every input tuple while computing peer-aware rankings, partition totals, or positional neighbor lookups alongside row attributes. Window functions execute **after `WHERE`, `GROUP BY`, and `HAVING`**, right during `SELECT` and `ORDER BY` projection.\n\nUnderstanding tie semantics is essential: on tied sort keys `(100, 100, 80)`, `ROW_NUMBER()` assigns arbitrary sequential integers `(1, 2, 3)` unless you break ties deterministically; `RANK()` assigns Olympiad ranks with gaps `(1, 1, 3)`; and `DENSE_RANK()` assigns contiguous tier ranks without gaps `(1, 1, 2)`. Positional functions `LAG(expr, offset, default)` and `LEAD(expr, offset, default)` read backward or forward inside the current partition buffer in $O(1)$ without self-joins.',
        syntaxAnatomy: [
          'SELECT d.name AS dept_name, e.emp_id, e.name, e.salary_usd,',
          '       DENSE_RANK() OVER dept_w AS salary_tier_rank,',
          '       LAG(e.salary_usd) OVER dept_w AS higher_peer_salary,',
          '       e.salary_usd - LEAD(e.salary_usd, 1, e.salary_usd) OVER dept_w AS lead_over_next_usd',
          'FROM employees e',
          'JOIN departments d ON d.dept_id = e.dept_id',
          'WINDOW dept_w AS (PARTITION BY e.dept_id ORDER BY e.salary_usd DESC, e.emp_id ASC)',
          'ORDER BY d.name ASC, e.salary_usd DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          'Window functions are **illegal in `WHERE` and `HAVING`** because `WindowAgg` runs after both clauses; wrap ranked rows in a CTE or subquery and filter `WHERE dept_rank <= 2` in the outer query.',
          '`ROW_NUMBER()` over non-unique sort columns is non-deterministic across ties—always append a unique tie-breaker key (`ORDER BY allocation_pct DESC, emp_id ASC, project_id ASC`).',
          'Declaring a named `WINDOW w AS (PARTITION BY ... ORDER BY ...)` avoids copy-paste drift across 3+ window calls and helps PostgreSQL share a single `Sort` + `WindowAgg` pass.',
          'Three-argument `LAG(col, 1, fallback)` and `LEAD(col, 1, fallback)` require `fallback` to be type-compatible with `col` (for example, `0` or `e.salary_usd` for `INTEGER`).'
        ],
        whenToUse: 'Use `ROW_NUMBER` for strict 1-row-per-entity deduplication, `DENSE_RANK` for Top-N-with-ties compensation or leaderboard tiers, `LAG`/`LEAD` for sequential deltas without self-joins, and named `WINDOW` specs whenever reusing a partition sort.'
      },
      scenario: {
        role: 'People Analytics & Compensation Engineer',
        incidentOrGoal: 'HR compensation reviews accidentally dropped tied `100%` project leads using `ROW_NUMBER` instead of `DENSE_RANK`, and self-joined `employees` twice to compute within-department pay gaps.',
        stakeholderNeed: 'Contrast `ROW_NUMBER`, `RANK`, and `DENSE_RANK` across tied project allocations, compute peer salary deltas via named `WINDOW` + `LAG`/`LEAD`, and isolate Top-2 department earners with payroll share.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Tie Semantics Showdown: ROW_NUMBER vs RANK vs DENSE_RANK',
          mission: 'Join `employee_projects ep` with `projects p` on `project_id` and project 6 columns in exact order: `emp_id` (`ep.emp_id`), `project_code` (`p.code`), `allocation_pct` (`ep.allocation_pct`), `row_num` (`ROW_NUMBER()` ordered by `ep.allocation_pct DESC, ep.emp_id ASC, ep.project_id ASC`), `gap_rank` (`RANK()` ordered by `ep.allocation_pct DESC`), and `dense_alloc_rank` (`DENSE_RANK()` ordered by `ep.allocation_pct DESC`). Sort the result by `row_num ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT ep.emp_id,',
            '       p.code AS project_code,',
            '       ep.allocation_pct',
            '       -- TODO: add row_num (ROW_NUMBER), gap_rank (RANK), and dense_alloc_rank (DENSE_RANK)',
            'FROM employee_projects ep',
            'JOIN projects p ON p.project_id = ep.project_id',
            'ORDER BY ep.allocation_pct DESC, ep.emp_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT ep.emp_id,',
            '       p.code AS project_code,',
            '       ep.allocation_pct,',
            '       ROW_NUMBER() OVER (ORDER BY ep.allocation_pct DESC, ep.emp_id ASC, ep.project_id ASC) AS row_num,',
            '       RANK() OVER (ORDER BY ep.allocation_pct DESC) AS gap_rank,',
            '       DENSE_RANK() OVER (ORDER BY ep.allocation_pct DESC) AS dense_alloc_rank',
            'FROM employee_projects ep',
            'JOIN projects p ON p.project_id = ep.project_id',
            'ORDER BY row_num ASC;'
          ].join('\n'),
          hints: [
            'Include tie-breakers `ep.emp_id ASC, ep.project_id ASC` inside `ROW_NUMBER() OVER (...)` so tied `100%` rows (`emp_id` `7` and `9`) get deterministic numbers `1` and `2`.',
            'For `RANK()` and `DENSE_RANK()`, order strictly by `ORDER BY ep.allocation_pct DESC` so both `100%` rows tie at rank `1`.',
            'Sort the outer query by `row_num ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bROW_NUMBER\\s*\\(\\s*\\)\\s*OVER', flags: 'i', message: 'Compute `ROW_NUMBER() OVER (...)`.' },
              { pattern: '\\bRANK\\s*\\(\\s*\\)\\s*OVER', flags: 'i', message: 'Compute `RANK() OVER (...)`.' },
              { pattern: '\\bDENSE_RANK\\s*\\(\\s*\\)\\s*OVER', flags: 'i', message: 'Compute `DENSE_RANK() OVER (...)`.' }
            ]
          },
          solutionExplanation: 'On the two tied `100%` allocations (`emp_id` `7` and `9`), `RANK()` emits `1, 1` then jumps to `3` for `80%`, whereas `DENSE_RANK()` emits `1, 1` then `2` without leaving a rank gap.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Department Compensation Gaps with LAG, LEAD & Named WINDOW',
          mission: 'Join `employees e` and `departments d` on `dept_id`, declare a named window `WINDOW dept_sal_w AS (PARTITION BY e.dept_id ORDER BY e.salary_usd DESC, e.emp_id ASC)`, and project 6 columns in exact order: `dept_name` (`d.name`), `emp_id` (`e.emp_id`), `name` (`e.name`), `salary_usd` (`e.salary_usd`), `higher_peer_salary` (`LAG(e.salary_usd) OVER dept_sal_w`), and `lead_over_next_usd` (`e.salary_usd - LEAD(e.salary_usd, 1, e.salary_usd) OVER dept_sal_w`, yielding `0` for the lowest earner in each department). Sort by `d.name ASC, e.salary_usd DESC, e.emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT d.name AS dept_name,',
            '       e.emp_id,',
            '       e.name,',
            '       e.salary_usd',
            '       -- TODO: add higher_peer_salary (LAG) and lead_over_next_usd (salary - LEAD with fallback)',
            'FROM employees e',
            'JOIN departments d ON d.dept_id = e.dept_id',
            '-- TODO: declare WINDOW dept_sal_w AS (PARTITION BY e.dept_id ORDER BY e.salary_usd DESC, e.emp_id ASC)',
            'ORDER BY d.name ASC, e.salary_usd DESC, e.emp_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT d.name AS dept_name,',
            '       e.emp_id,',
            '       e.name,',
            '       e.salary_usd,',
            '       LAG(e.salary_usd) OVER dept_sal_w AS higher_peer_salary,',
            '       e.salary_usd - LEAD(e.salary_usd, 1, e.salary_usd) OVER dept_sal_w AS lead_over_next_usd',
            'FROM employees e',
            'JOIN departments d ON d.dept_id = e.dept_id',
            'WINDOW dept_sal_w AS (PARTITION BY e.dept_id ORDER BY e.salary_usd DESC, e.emp_id ASC)',
            'ORDER BY d.name ASC, e.salary_usd DESC, e.emp_id ASC;'
          ].join('\n'),
          hints: [
            'Place `WINDOW dept_sal_w AS (PARTITION BY e.dept_id ORDER BY e.salary_usd DESC, e.emp_id ASC)` between `JOIN` and `ORDER BY`.',
            '`LAG(e.salary_usd) OVER dept_sal_w` looks one row earlier in descending salary order (the next higher-paid peer, or `NULL` for the department top earner).',
            '`LEAD(e.salary_usd, 1, e.salary_usd) OVER dept_sal_w` returns `e.salary_usd` at the partition boundary so subtracting it yields `0` instead of `NULL`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bWINDOW\\s+dept_sal_w\\s+AS\\s*\\(', flags: 'i', message: 'Define a reusable named `WINDOW dept_sal_w AS (...)` clause.' },
              { pattern: '\\bLAG\\s*\\([\\s\\S]*\\bLEAD\\s*\\(|\\bLEAD\\s*\\([\\s\\S]*\\bLAG\\s*\\(', flags: 'i', message: 'Use both `LAG(...)` and `LEAD(...)` over `dept_sal_w`.' }
            ]
          },
          solutionExplanation: 'Sharing `WINDOW dept_sal_w` evaluates both `LAG` and `LEAD` inside one `WindowAgg` operator over `idx_emp_dept_salary`, eliminating self-joins and boundary `NULL` arithmetic.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Top-2 Department Earners & Payroll Share via CTE Window Filtering',
          mission: 'Because `WHERE` runs before window functions, use a CTE over `employees e JOIN departments d ON d.dept_id = e.dept_id` to compute each employee\'s within-department `DENSE_RANK()` by `salary_usd DESC` and their percentage share of department payroll (`e.salary_usd * 100 / SUM(e.salary_usd) OVER (PARTITION BY e.dept_id)` rounded to 2 decimals). Filter the outer query to the top `2` salary ranks per department and project 5 columns in exact order: `dept_name`, `emp_id`, `name`, `salary_usd`, and `dept_payroll_pct`. Sort by `dept_name ASC, salary_usd DESC, emp_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'WITH ranked_staff AS (',
            '  SELECT d.name AS dept_name,',
            '         e.emp_id,',
            '         e.name,',
            '         e.salary_usd',
            '         -- TODO: add dept_rank (DENSE_RANK) and dept_payroll_pct (partition SUM window)',
            '  FROM employees e',
            '  JOIN departments d ON d.dept_id = e.dept_id',
            ')',
            'SELECT dept_name, emp_id, name, salary_usd',
            'FROM ranked_staff',
            '-- TODO: filter top 2 ranks per department',
            'ORDER BY dept_name ASC, salary_usd DESC, emp_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH ranked_staff AS (',
            '  SELECT d.name AS dept_name,',
            '         e.emp_id,',
            '         e.name,',
            '         e.salary_usd,',
            '         DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary_usd DESC) AS dept_rank,',
            '         ROUND(',
            '           e.salary_usd::numeric * 100 / SUM(e.salary_usd) OVER (PARTITION BY e.dept_id),',
            '           2',
            '         ) AS dept_payroll_pct',
            '  FROM employees e',
            '  JOIN departments d ON d.dept_id = e.dept_id',
            ')',
            'SELECT dept_name, emp_id, name, salary_usd, dept_payroll_pct',
            'FROM ranked_staff',
            'WHERE dept_rank <= 2',
            'ORDER BY dept_name ASC, salary_usd DESC, emp_id ASC;'
          ].join('\n'),
          hints: [
            'Notice `SUM(e.salary_usd) OVER (PARTITION BY e.dept_id)` has **no `ORDER BY`** inside `OVER`, so it sums the entire department\'s full payroll before `WHERE dept_rank <= 2` filters rows!',
            'Compute `DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary_usd DESC) AS dept_rank` inside the CTE.',
            'Filter `WHERE dept_rank <= 2` in the outer `SELECT` and sort by `dept_name ASC, salary_usd DESC, emp_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bSUM\\s*\\(\\s*e\\.salary_usd\\s*\\)\\s*OVER\\s*\\(\\s*PARTITION\\s+BY\\b', flags: 'i', message: 'Use `SUM(e.salary_usd) OVER (PARTITION BY e.dept_id)` for full-department payroll.' },
              { pattern: '\\bWHERE\\s+dept_rank\\s*<=\\s*2\\b|\\bDENSE_RANK\\s*\\(\\s*\\)\\s*OVER', flags: 'i', message: 'Rank with `DENSE_RANK()` inside a CTE/subquery and filter top 2 in outer `WHERE`.' }
            ]
          },
          solutionExplanation: 'Computing `SUM(e.salary_usd) OVER (PARTITION BY e.dept_id)` inside the CTE measures share against 100% of department payroll (including rank-3 engineers) before the outer `WHERE dept_rank <= 2` trims lower ranks—and in PostgreSQL 15+, the planner activates a `WindowAgg` **Run Condition** optimization to stop scanning partitions early when safe!'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m04-t08 — Window Frames, Running Totals & Gaps-and-Islands
       ======================================================================== */
    {
      id: 'pg-m04-t08',
      slug: 'window-frames-running-totals-gaps-islands',
      moduleId: 'pg-m04',
      title: 'Window Frames (ROWS vs RANGE vs GROUPS), Running Totals & Gaps-and-Islands',
      difficulty: 'Advanced',
      estimatedMinutes: 20,
      datasetId: 'saas_telemetry',
      clauses: ['ROWS BETWEEN', 'RANGE BETWEEN', 'EXCLUDE', 'UNBOUNDED PRECEDING'],
      tags: ['window-frames', 'running-totals', 'gaps-and-islands', 'sessionization', 'last-value'],
      guide: {
        mentalModel: 'Every ordered window specification (`OVER (... ORDER BY k)`) silently attaches the SQL-standard default frame **`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`**. In `RANGE` mode, `CURRENT ROW` means **"all peer rows sharing the current `ORDER BY` key value"**—causing two classic production bugs:\n1. **Running-total jumps**: duplicate timestamps or `billing_month` keys merge into identical stepped sums instead of row-by-row accumulation (`ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`).\n2. **Broken `LAST_VALUE()`**: `LAST_VALUE(col) OVER (PARTITION BY p ORDER BY k)` stops at the current peer group and merely echoes the current row unless you widen the frame to `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`!\n\nPostgreSQL 11+ supports all three frame units—`ROWS` (physical tuple offsets), `RANGE` (value/interval offsets such as `RANGE BETWEEN INTERVAL \'5 minutes\' PRECEDING AND CURRENT ROW`), and `GROUPS` (peer-group counts)—plus `EXCLUDE CURRENT ROW | GROUP | TIES`. Combining `LAG()` gap detection with a `ROWS UNBOUNDED PRECEDING` running `SUM()` solves **Gaps-and-Islands** clickstream sessionization in pure linear SQL.',
        syntaxAnatomy: [
          '-- 1. Row-exact running total vs peer-grouped RANGE:',
          'SUM(amount_usd) OVER (ORDER BY billing_month, invoice_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)',
          '-- 2. Safe LAST_VALUE across entire partition:',
          'LAST_VALUE(event_type) OVER (',
          '  PARTITION BY user_id ORDER BY event_ts::timestamptz, event_id',
          '  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING',
          ')',
          '-- 3. Gaps-and-Islands session ID:',
          'SUM(is_new_session) OVER (PARTITION BY user_id ORDER BY event_ts::timestamptz ROWS UNBOUNDED PRECEDING)'
        ].join('\n'),
        internalsAndGotchas: [
          'Omitting a frame clause when `ORDER BY` is present defaults to `RANGE UNBOUNDED PRECEDING`, NOT `ROWS UNBOUNDED PRECEDING`; when `ORDER BY` is omitted, the frame spans the entire partition (`RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`).',
          '`LAST_VALUE(col)` and `NTH_VALUE(col, n)` almost always require `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` so later rows in the partition are visible inside the frame.',
          'When `event_ts` is stored as ISO `TEXT` (as in cross-engine telemetry extracts), cast `event_ts::timestamptz` before computing `INTERVAL` differences (`event_ts::timestamptz - prev_ts > INTERVAL \'10 minutes\'`).',
          'PostgreSQL\'s `RANGE BETWEEN INTERVAL \'10 minutes\' PRECEDING AND CURRENT ROW` requires a single `ORDER BY` column of a numeric or temporal (`DATE`/`TIMESTAMP`/`TIMESTAMPTZ`) type.'
        ],
        whenToUse: 'Specify explicit `ROWS BETWEEN` frames for deterministic row-by-row running totals, moving K-row averages, `LAST_VALUE` lookups, and cumulative `SUM(flag)` island numbering in Gaps-and-Islands sessionization.'
      },
      scenario: {
        role: 'Principal Telemetry & Clickstream Architect',
        incidentOrGoal: 'Finance\'s invoice ledger running total jumped in chunks on same-month invoices due to the implicit `RANGE` frame, `LAST_VALUE` echoed every row\'s own `event_type`, and product analytics needed 10-minute inactivity sessionization over `user_events`.',
        stakeholderNeed: 'Prove `ROWS` vs `RANGE` running-total behavior on `invoices`, build rolling 2-event latency windows + fixed `LAST_VALUE` on `user_events`, and sessionize clickstreams via Gaps-and-Islands.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Exposing the Implicit RANGE Peer Trap on Invoice Running Totals',
          mission: 'Query `invoices` and project 5 columns in exact order to contrast physical `ROWS` framing against peer-grouped `RANGE` framing: `invoice_id`, `billing_month`, `amount_usd`, `row_running_usd` (`SUM(amount_usd)` ordered by `billing_month ASC, invoice_id ASC` with `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`), and `month_peer_range_usd` (`SUM(amount_usd)` ordered by `billing_month ASC` with `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`). Sort by `billing_month ASC, invoice_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT invoice_id,',
            '       billing_month,',
            '       amount_usd',
            '       -- TODO: add row_running_usd (ROWS BETWEEN ...) and month_peer_range_usd (RANGE BETWEEN ...)',
            'FROM invoices',
            'ORDER BY billing_month ASC, invoice_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT invoice_id,',
            '       billing_month,',
            '       amount_usd,',
            '       SUM(amount_usd) OVER (',
            '         ORDER BY billing_month ASC, invoice_id ASC',
            '         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW',
            '       ) AS row_running_usd,',
            '       SUM(amount_usd) OVER (',
            '         ORDER BY billing_month ASC',
            '         RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW',
            '       ) AS month_peer_range_usd',
            'FROM invoices',
            'ORDER BY billing_month ASC, invoice_id ASC;'
          ].join('\n'),
          hints: [
            'For `row_running_usd`, order by `billing_month ASC, invoice_id ASC` and specify `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.',
            'For `month_peer_range_usd`, order only by `billing_month ASC` with `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` so same-month invoices form peer groups.',
            'Sort the final result by `billing_month ASC, invoice_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bROWS\\s+BETWEEN\\s+UNBOUNDED\\s+PRECEDING\\s+AND\\s+CURRENT\\s+ROW\\b', flags: 'i', message: 'Specify explicit `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.' },
              { pattern: '\\bRANGE\\s+BETWEEN\\s+UNBOUNDED\\s+PRECEDING\\s+AND\\s+CURRENT\\s+ROW\\b', flags: 'i', message: 'Specify explicit `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.' }
            ]
          },
          solutionExplanation: 'On `2025-01` (`invoice_id` `101` for `$1200` and `104` for `$350`), `row_running_usd` steps cleanly (`1200`, `1550`), whereas `month_peer_range_usd` lumps all `2025-01` peers together (`1550` on row 1 already!).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Sliding 2-Event Moving Average & Fixing LAST_VALUE Frame Bounds',
          mission: 'Query `user_events` and project 6 columns in exact order: `user_id`, `event_id`, `event_type`, `latency_ms`, `rolling_2evt_ms` (2-event sliding `AVG(latency_ms)` rounded to 2 decimals partitioned by `user_id`, ordered by `event_ts::timestamptz ASC, event_id ASC` over `ROWS BETWEEN 1 PRECEDING AND CURRENT ROW`), and `final_user_event` (`LAST_VALUE(event_type)` over the entire user partition ordered by `event_ts::timestamptz ASC, event_id ASC` using `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`). Sort by `user_id ASC, event_ts::timestamptz ASC, event_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT user_id,',
            '       event_id,',
            '       event_type,',
            '       latency_ms,',
            '       LAST_VALUE(event_type) OVER (PARTITION BY user_id ORDER BY event_ts::timestamptz ASC) AS final_user_event -- BUG: frame ends at CURRENT ROW!',
            '       -- TODO: add rolling_2evt_ms before final_user_event and widen LAST_VALUE frame to UNBOUNDED FOLLOWING',
            'FROM user_events',
            'ORDER BY user_id ASC, event_ts::timestamptz ASC, event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT user_id,',
            '       event_id,',
            '       event_type,',
            '       latency_ms,',
            '       ROUND(',
            '         AVG(latency_ms) OVER (',
            '           PARTITION BY user_id',
            '           ORDER BY event_ts::timestamptz ASC, event_id ASC',
            '           ROWS BETWEEN 1 PRECEDING AND CURRENT ROW',
            '         ),',
            '         2',
            '       ) AS rolling_2evt_ms,',
            '       LAST_VALUE(event_type) OVER (',
            '         PARTITION BY user_id',
            '         ORDER BY event_ts::timestamptz ASC, event_id ASC',
            '         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING',
            '       ) AS final_user_event',
            'FROM user_events',
            'ORDER BY user_id ASC, event_ts::timestamptz ASC, event_id ASC;'
          ].join('\n'),
          hints: [
            'Use `ROWS BETWEEN 1 PRECEDING AND CURRENT ROW` inside `AVG(latency_ms) OVER (...)` and wrap in `ROUND(..., 2) AS rolling_2evt_ms`.',
            'Fix `LAST_VALUE(event_type)` by adding `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` inside its `OVER (...)` specification.',
            'Sort by `user_id ASC, event_ts::timestamptz ASC, event_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bROWS\\s+BETWEEN\\s+1\\s+PRECEDING\\s+AND\\s+CURRENT\\s+ROW\\b', flags: 'i', message: 'Use `ROWS BETWEEN 1 PRECEDING AND CURRENT ROW` for the 2-event sliding window.' },
              { pattern: '\\bUNBOUNDED\\s+PRECEDING\\s+AND\\s+UNBOUNDED\\s+FOLLOWING\\b', flags: 'i', message: 'Extend `LAST_VALUE` frame with `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.' }
            ]
          },
          solutionExplanation: 'Extending `LAST_VALUE`\'s frame to `UNBOUNDED FOLLOWING` lets row 1 of `user_id = 1` (`signup`) see all the way to the user\'s final state (`upgrade_pro`), instead of stopping prematurely at `CURRENT ROW`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Clickstream Sessionization via Gaps-and-Islands (10-Minute Timeout)',
          mission: 'Sessionize `user_events` per `user_id` (ordered by `event_ts::timestamptz ASC, event_id ASC`) where a new session starts whenever `prev_ts IS NULL` or `(event_ts::timestamptz - prev_ts) > INTERVAL \'10 minutes\'`. Accumulate a 1-based `user_session_num` per user via a running `SUM()` of new-session flags, then group by `(user_id, user_session_num)` and project 5 columns in exact order: `user_id`, `user_session_num`, `events_in_session` (`COUNT(*)`), `session_start_ts` (`MIN(event_ts)`), and `session_duration_sec` (`EXTRACT(EPOCH FROM (MAX(event_ts::timestamptz) - MIN(event_ts::timestamptz)))::bigint`). Sort by `user_id ASC, user_session_num ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'WITH lagged AS (',
            '  SELECT user_id,',
            '         event_id,',
            '         event_ts,',
            '         LAG(event_ts::timestamptz) OVER (',
            '           PARTITION BY user_id ORDER BY event_ts::timestamptz ASC, event_id ASC',
            '         ) AS prev_ts',
            '  FROM user_events',
            ')',
            '-- TODO: flag gaps > INTERVAL \'10 minutes\', compute cumulative user_session_num, and aggregate each session island',
            'SELECT user_id, COUNT(*) AS events_in_session',
            'FROM lagged',
            'GROUP BY user_id',
            'ORDER BY user_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH lagged AS (',
            '  SELECT user_id,',
            '         event_id,',
            '         event_ts,',
            '         LAG(event_ts::timestamptz) OVER (',
            '           PARTITION BY user_id ORDER BY event_ts::timestamptz ASC, event_id ASC',
            '         ) AS prev_ts',
            '  FROM user_events',
            '),',
            'sessionized AS (',
            '  SELECT user_id,',
            '         event_id,',
            '         event_ts,',
            '         SUM(',
            '           CASE',
            '             WHEN prev_ts IS NULL OR (event_ts::timestamptz - prev_ts) > INTERVAL \'10 minutes\' THEN 1',
            '             ELSE 0',
            '           END',
            '         ) OVER (',
            '           PARTITION BY user_id',
            '           ORDER BY event_ts::timestamptz ASC, event_id ASC',
            '           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW',
            '         ) AS user_session_num',
            '  FROM lagged',
            ')',
            'SELECT user_id,',
            '       user_session_num,',
            '       COUNT(*) AS events_in_session,',
            '       MIN(event_ts) AS session_start_ts,',
            '       EXTRACT(EPOCH FROM (MAX(event_ts::timestamptz) - MIN(event_ts::timestamptz)))::bigint AS session_duration_sec',
            'FROM sessionized',
            'GROUP BY user_id, user_session_num',
            'ORDER BY user_id ASC, user_session_num ASC;'
          ].join('\n'),
          hints: [
            'Remember PostgreSQL forbids nesting `LAG()` directly inside `SUM(...) OVER (...)`; compute `prev_ts` in CTE `lagged`, then compute the running `SUM(CASE WHEN ... THEN 1 ELSE 0 END) OVER (... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` in CTE `sessionized`.',
            'Cast `event_ts::timestamptz` when subtracting `prev_ts` against `INTERVAL \'10 minutes\'` and when computing `EXTRACT(EPOCH FROM (...))::bigint`.',
            'Group by `user_id, user_session_num` and sort by `user_id ASC, user_session_num ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bLAG\\s*\\(', flags: 'i', message: 'Use `LAG(...)` to inspect the previous event timestamp per user.' },
              { pattern: 'INTERVAL\\s*\'10\\s*minutes\'', flags: 'i', message: 'Detect session boundaries using `INTERVAL \'10 minutes\'`.' },
              { pattern: '\\bSUM\\s*\\([\\s\\S]*?\\)\\s*OVER\\s*\\(', flags: 'i', message: 'Assign island IDs using a cumulative `SUM(...) OVER (...)` window.' }
            ]
          },
          solutionExplanation: 'Two linear `WindowAgg` passes (`LAG` boundary detection -> cumulative `SUM` island numbering) followed by `GROUP BY (user_id, user_session_num)` cleanly splits `user_id = 1` (`16 min` gap before `upgrade_pro`) and `user_id = 3` (`12 min` gap) into 2 sessions each without recursive CTE overhead.'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
