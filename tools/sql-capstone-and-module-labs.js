'use strict';

/**
 * Curated SQL Capstone Labs (all 18 build-* projects), Module 1 foundational
 * single-table labs, and coaching hints for all 180 SQL In Depth units.
 */

function buildCapstoneBlueprints(mod, unit) {
  const slug = unit.slug;
  const title = unit.title;
  const capstones = {
    'build-sql-query-interpreter': {
      datasetId: 'ecommerce',
      complexity: { time: 'O(N log K) filter + bounded top-K sort', space: 'O(K) heap buffer', pattern: 'Selection (σ) -> Projection (π) -> Top-K Sort' },
      step1: {
        phase: 'Phase 1 · Tuple Selection Predicate (WHERE)',
        title: `Step 1: Filter Active Catalog Tuples (${slug})`,
        concept: 'Apply a SARGable selection predicate (`is_active = 1 AND stock_qty > 0`) before projecting columns.',
        instructions: 'Update `query.sql` to filter `products` where `is_active = 1 AND stock_qty > 0`, projecting `product_id`, `sku`, `name`, `price_cents`, and `stock_qty` ordered by `product_id ASC`.',
        hint: 'Add `WHERE is_active = 1 AND stock_qty > 0` and include `stock_qty` in the `SELECT` list before `ORDER BY product_id ASC`.',
        starter: `-- Step 1 Starter (${slug}): Unfiltered product scan\nSELECT\n  product_id,\n  sku,\n  name,\n  price_cents\nFROM products\nORDER BY product_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Selection predicate over active in-stock tuples\nSELECT\n  product_id,\n  sku,\n  name,\n  price_cents,\n  stock_qty\nFROM products\nWHERE is_active = 1\n  AND stock_qty > 0\nORDER BY product_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Scalar Expressions & Alias Projection (SELECT)',
        title: `Step 2: Compute Exact USD Price & Inventory Value (${slug})`,
        concept: 'Evaluate arithmetic expressions (`ROUND(price_cents / 100.0, 2)`) during projection without mutating stored integer cents.',
        instructions: 'Project `sku`, `name AS product_name`, `ROUND(price_cents / 100.0, 2) AS unit_usd`, `stock_qty`, and `ROUND((price_cents * stock_qty) / 100.0, 2) AS inventory_usd` for active in-stock products ordered by `inventory_usd DESC, product_id ASC`.',
        hint: 'Divide `price_cents` and `price_cents * stock_qty` by `100.0` inside `ROUND(..., 2)`, alias them as `unit_usd` and `inventory_usd`, and sort by `inventory_usd DESC, product_id ASC`.',
        starter: `-- Step 2 Starter (${slug}): Active products before USD arithmetic\nSELECT\n  sku,\n  name AS product_name,\n  price_cents,\n  stock_qty\nFROM products\nWHERE is_active = 1\n  AND stock_qty > 0\nORDER BY product_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Scalar expression evaluation and aliasing\nSELECT\n  sku,\n  name AS product_name,\n  ROUND(price_cents / 100.0, 2) AS unit_usd,\n  stock_qty,\n  ROUND((price_cents * stock_qty) / 100.0, 2) AS inventory_usd\nFROM products\nWHERE is_active = 1\n  AND stock_qty > 0\nORDER BY inventory_usd DESC, product_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · CASE Classification & Deterministic Top-K Sort',
        title: `Step 3: Classify Restock Priority & Top-5 Valuation (${slug})`,
        concept: 'Combine `WHERE`, `CASE` expression projection, deterministic tie-breaker `ORDER BY`, and `LIMIT` in logical execution order.',
        instructions: 'Add a `CASE WHEN stock_qty < 20 THEN \'LOW_STOCK\' ELSE \'HEALTHY\' END AS stock_band` column and return the top 5 active in-stock products by `inventory_usd DESC, product_id ASC`.',
        hint: 'Append the `CASE WHEN stock_qty < 20 THEN \'LOW_STOCK\' ELSE \'HEALTHY\' END AS stock_band` expression and cap output with `LIMIT 5`.',
        starter: `-- Step 3 Starter (${slug}): Valuation query without stock band or LIMIT\nSELECT\n  product_id,\n  sku,\n  name AS product_name,\n  stock_qty,\n  ROUND((price_cents * stock_qty) / 100.0, 2) AS inventory_usd\nFROM products\nWHERE is_active = 1\n  AND stock_qty > 0\nORDER BY inventory_usd DESC, product_id ASC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug})\nSELECT\n  product_id,\n  sku,\n  name AS product_name,\n  stock_qty,\n  ROUND((price_cents * stock_qty) / 100.0, 2) AS inventory_usd,\n  CASE\n    WHEN stock_qty < 20 THEN 'LOW_STOCK'\n    ELSE 'HEALTHY'\n  END AS stock_band\nFROM products\nWHERE is_active = 1\n  AND stock_qty > 0\nORDER BY inventory_usd DESC, product_id ASC\nLIMIT 5;`
      }
    },

    'build-ecommerce-schema-ddl': {
      datasetId: 'ecommerce',
      complexity: { time: 'O(P + C) FK index lookup', space: 'O(C) parent key map', pattern: 'Domain Constraints & Referential Integrity Audit' },
      step1: {
        phase: 'Phase 1 · Domain Constraint Verification',
        title: `Step 1: Audit SKU Domain Invariants (${slug})`,
        concept: 'Verify `CHECK (price_cents >= 0)` and `is_active` lifecycle flags across `products`, including archived zero-stock SKUs.',
        instructions: 'Project `product_id`, `sku`, `price_cents`, `stock_qty`, and `CASE WHEN is_active = 1 THEN \'ACTIVE\' ELSE \'ARCHIVED\' END AS catalog_state` from `products` ordered by `is_active DESC, product_id ASC`.',
        hint: 'Add `CASE WHEN is_active = 1 THEN \'ACTIVE\' ELSE \'ARCHIVED\' END AS catalog_state` and sort by `is_active DESC, product_id ASC`.',
        starter: `-- Step 1 Starter (${slug}): Raw products constraint columns\nSELECT\n  product_id,\n  sku,\n  price_cents,\n  stock_qty,\n  is_active\nFROM products\nORDER BY product_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Domain invariant classification\nSELECT\n  product_id,\n  sku,\n  price_cents,\n  stock_qty,\n  CASE\n    WHEN is_active = 1 THEN 'ACTIVE'\n    ELSE 'ARCHIVED'\n  END AS catalog_state\nFROM products\nORDER BY is_active DESC, product_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Self-Referencing Parent/Child Category FK',
        title: `Step 2: Resolve Parent-Child Category Foreign Keys (${slug})`,
        concept: 'Verify self-referencing foreign keys (`categories.parent_category_id -> categories.category_id`) using `LEFT JOIN`.',
        instructions: 'Left join `categories AS child` to `categories AS parent` on `parent.category_id = child.parent_category_id`, projecting `child.category_id`, `child.name AS category_name`, and `COALESCE(parent.name, \'ROOT_CATEGORY\') AS parent_name` ordered by `child.category_id ASC`.',
        hint: 'Use `LEFT JOIN categories AS parent ON parent.category_id = child.parent_category_id` and wrap `parent.name` in `COALESCE(..., \'ROOT_CATEGORY\')`.',
        starter: `-- Step 2 Starter (${slug}): Unjoined categories relation\nSELECT\n  category_id,\n  name AS category_name,\n  parent_category_id\nFROM categories\nORDER BY category_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Parent/child FK resolution\nSELECT\n  child.category_id,\n  child.name AS category_name,\n  COALESCE(parent.name, 'ROOT_CATEGORY') AS parent_name\nFROM categories AS child\nLEFT JOIN categories AS parent\n  ON parent.category_id = child.parent_category_id\nORDER BY child.category_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · Referential Integrity Rollup Across Catalog & Orders',
        title: `Step 3: Reconcile Category SKU Counts & Ordered Units (${slug})`,
        concept: 'Verify parent-child referential integrity across `categories -> products -> order_items` without losing zero-order SKUs.',
        instructions: 'Aggregate `COUNT(DISTINCT p.product_id) AS sku_count`, `SUM(p.stock_qty) AS total_stock_units`, and `COALESCE(SUM(oi.quantity), 0) AS ordered_units` per category ordered by `ordered_units DESC, c.category_id ASC`.',
        hint: 'Left join `products AS p` and `order_items AS oi`, group by `c.category_id, c.name`, and compute `COUNT(DISTINCT p.product_id)`, `SUM(p.stock_qty)`, and `COALESCE(SUM(oi.quantity), 0)`.',
        starter: `-- Step 3 Starter (${slug}): Category to product join\nSELECT\n  c.category_id,\n  c.name AS category_name,\n  p.product_id,\n  p.stock_qty\nFROM categories AS c\nINNER JOIN products AS p\n  ON p.category_id = c.category_id\nORDER BY c.category_id ASC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug})\nSELECT\n  c.category_id,\n  c.name AS category_name,\n  COUNT(DISTINCT p.product_id) AS sku_count,\n  SUM(p.stock_qty) AS total_stock_units,\n  COALESCE(SUM(oi.quantity), 0) AS ordered_units\nFROM categories AS c\nINNER JOIN products AS p\n  ON p.category_id = c.category_id\nLEFT JOIN order_items AS oi\n  ON oi.product_id = p.product_id\nGROUP BY c.category_id, c.name\nORDER BY ordered_units DESC, c.category_id ASC;`
      }
    },

    'build-multi-table-order-reconciler': {
      datasetId: 'ecommerce',
      complexity: { time: 'O(O + P + S) hash outer joins', space: 'O(O) order hash table', pattern: 'Outer Join Preservation & Anti-Join Exception Detection' },
      step1: {
        phase: 'Phase 1 · Outer Join ON vs WHERE Preservation',
        title: `Step 1: Preserve Unpaid Orders via LEFT JOIN (${slug})`,
        concept: 'Filter `pay.status = \'settled\'` inside the `LEFT JOIN ... ON` clause so pending or cancelled orders are not silently dropped.',
        instructions: 'Left join `orders AS o` with settled `payments AS pay` (`ON pay.order_id = o.order_id AND pay.status = \'settled\'`), projecting `o.order_id`, `o.status AS order_status`, `o.total_cents`, and `COALESCE(pay.amount_cents, 0) AS settled_cents` ordered by `o.order_id ASC`.',
        hint: 'Keep `AND pay.status = \'settled\'` inside `LEFT JOIN payments AS pay ON ...` and project `COALESCE(pay.amount_cents, 0) AS settled_cents`.',
        starter: `-- Step 1 Starter (${slug}): Orders without settled payment join\nSELECT\n  o.order_id,\n  o.status AS order_status,\n  o.total_cents\nFROM orders AS o\nORDER BY o.order_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): NULL-safe settled payment outer join\nSELECT\n  o.order_id,\n  o.status AS order_status,\n  o.total_cents,\n  COALESCE(pay.amount_cents, 0) AS settled_cents\nFROM orders AS o\nLEFT JOIN payments AS pay\n  ON pay.order_id = o.order_id\n  AND pay.status = 'settled'\nORDER BY o.order_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Anti-Join Unshipped Paid Order Detection',
        title: `Step 2: Find Completed Orders Missing Shipments (${slug})`,
        concept: 'Use `NOT EXISTS` (or `LEFT JOIN ... WHERE s.shipment_id IS NULL`) to isolate completed orders that have not yet shipped.',
        instructions: 'Return `o.order_id`, `c.name AS customer_name`, `ROUND(o.total_cents / 100.0, 2) AS billed_usd`, and `o.created_at` for completed orders (`o.status = \'completed\'`) where `NOT EXISTS` a row in `shipments` for `o.order_id`, ordered by `o.order_id ASC`.',
        hint: 'Join `customers AS c`, filter `o.status = \'completed\'`, and add `AND NOT EXISTS (SELECT 1 FROM shipments AS s WHERE s.order_id = o.order_id)`.',
        starter: `-- Step 2 Starter (${slug}): All completed customer orders\nSELECT\n  o.order_id,\n  c.name AS customer_name,\n  ROUND(o.total_cents / 100.0, 2) AS billed_usd,\n  o.created_at\nFROM orders AS o\nINNER JOIN customers AS c\n  ON c.customer_id = o.customer_id\nWHERE o.status = 'completed'\nORDER BY o.order_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Anti-join isolating unshipped completed orders\nSELECT\n  o.order_id,\n  c.name AS customer_name,\n  ROUND(o.total_cents / 100.0, 2) AS billed_usd,\n  o.created_at\nFROM orders AS o\nINNER JOIN customers AS c\n  ON c.customer_id = o.customer_id\nWHERE o.status = 'completed'\n  AND NOT EXISTS (\n    SELECT 1\n    FROM shipments AS s\n    WHERE s.order_id = o.order_id\n  )\nORDER BY o.order_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · 4-Table Order, Payment & Fulfillment Matrix',
        title: `Step 3: Full Order Settlement & Fulfillment Reconciler (${slug})`,
        concept: 'Reconcile `orders`, `customers`, `payments`, and `shipments` into an end-to-end operational state classification.',
        instructions: 'Join `orders`, `customers`, `LEFT JOIN payments`, and `LEFT JOIN shipments` to project `order_id`, `customer_name`, `billed_usd`, `payment_state`, and `fulfillment_state` (`DELIVERED`, `IN_TRANSIT`, or `UNSHIPPED`) ordered by `o.order_id ASC`.',
        hint: 'Use `CASE WHEN s.delivered_at IS NOT NULL THEN \'DELIVERED\' WHEN s.shipped_at IS NOT NULL THEN \'IN_TRANSIT\' ELSE \'UNSHIPPED\' END AS fulfillment_state`.',
        starter: `-- Step 3 Starter (${slug}): Partial order payment join\nSELECT\n  o.order_id,\n  c.name AS customer_name,\n  ROUND(o.total_cents / 100.0, 2) AS billed_usd,\n  COALESCE(pay.status, 'unpaid') AS payment_state\nFROM orders AS o\nINNER JOIN customers AS c\n  ON c.customer_id = o.customer_id\nLEFT JOIN payments AS pay\n  ON pay.order_id = o.order_id\nORDER BY o.order_id ASC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug})\nSELECT\n  o.order_id,\n  c.name AS customer_name,\n  ROUND(o.total_cents / 100.0, 2) AS billed_usd,\n  COALESCE(pay.status, 'unpaid') AS payment_state,\n  CASE\n    WHEN s.delivered_at IS NOT NULL THEN 'DELIVERED'\n    WHEN s.shipped_at IS NOT NULL THEN 'IN_TRANSIT'\n    ELSE 'UNSHIPPED'\n  END AS fulfillment_state\nFROM orders AS o\nINNER JOIN customers AS c\n  ON c.customer_id = o.customer_id\nLEFT JOIN payments AS pay\n  ON pay.order_id = o.order_id\nLEFT JOIN shipments AS s\n  ON s.order_id = o.order_id\nORDER BY o.order_id ASC;`
      }
    },

    'build-executive-kpi-aggregation-suite': {
      datasetId: 'ecommerce',
      complexity: { time: 'O(O + I) pre-aggregated hash joins', space: 'O(C + O) CTE aggregate tables', pattern: 'Fanout-Free Pre-Aggregation & Conditional KPI Rollup' },
      step1: {
        phase: 'Phase 1 · Conditional Order Status Pivoting',
        title: `Step 1: Pivot Order Counts & GMV by Tier (${slug})`,
        concept: 'Use `SUM(CASE WHEN ...)` conditional aggregation to compute completed vs non-completed metrics in a single scan.',
        instructions: 'Group `customers LEFT JOIN orders` by `c.tier` to compute `customer_count` (`COUNT(DISTINCT c.customer_id)`), `completed_orders`, and `completed_gmv_usd` ordered by `completed_gmv_usd DESC`.',
        hint: 'Use `COUNT(DISTINCT c.customer_id)`, `SUM(CASE WHEN o.status = \'completed\' THEN 1 ELSE 0 END)`, and `ROUND(SUM(CASE WHEN o.status = \'completed\' THEN o.total_cents ELSE 0 END) / 100.0, 2)`.',
        starter: `-- Step 1 Starter (${slug}): Raw customer-order rows by tier\nSELECT\n  c.tier,\n  c.customer_id,\n  o.order_id,\n  o.status,\n  o.total_cents\nFROM customers AS c\nLEFT JOIN orders AS o\n  ON o.customer_id = c.customer_id\nORDER BY c.tier ASC;`,
        solution: `-- Step 1 Solution (${slug}): Conditional tier KPI pivot\nSELECT\n  c.tier,\n  COUNT(DISTINCT c.customer_id) AS customer_count,\n  SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,\n  ROUND(SUM(CASE WHEN o.status = 'completed' THEN o.total_cents ELSE 0 END) / 100.0, 2) AS completed_gmv_usd\nFROM customers AS c\nLEFT JOIN orders AS o\n  ON o.customer_id = c.customer_id\nGROUP BY c.tier\nORDER BY completed_gmv_usd DESC;`
      },
      step2: {
        phase: 'Phase 2 · Pre-Aggregating Line Items to Prevent Fanout',
        title: `Step 2: Pre-Aggregate Order Units Without Header Fanout (${slug})`,
        concept: 'Joining `orders` directly to `order_items` multiplies `orders.total_cents` by line count; pre-aggregating `order_items` by `order_id` eliminates the fanout trap.',
        instructions: 'Aggregate `order_items` per `order_id` in a `WITH item_totals AS (...)` CTE (`SUM(quantity) AS total_units`), then join to completed `orders` ordered by `o.order_id ASC`.',
        hint: 'Create `WITH item_totals AS (SELECT order_id, SUM(quantity) AS total_units, COUNT(*) AS sku_lines FROM order_items GROUP BY order_id)` and join to `orders` where `o.status = \'completed\'`.',
        starter: `-- Step 2 Starter (${slug}): Completed orders without pre-aggregated units\nSELECT\n  o.order_id,\n  o.customer_id,\n  ROUND(o.total_cents / 100.0, 2) AS order_usd\nFROM orders AS o\nWHERE o.status = 'completed'\nORDER BY o.order_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Fanout-safe CTE pre-aggregation\nWITH item_totals AS (\n  SELECT\n    order_id,\n    COUNT(*) AS sku_lines,\n    SUM(quantity) AS total_units\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT\n  o.order_id,\n  o.customer_id,\n  it.sku_lines,\n  it.total_units,\n  ROUND(o.total_cents / 100.0, 2) AS order_usd\nFROM orders AS o\nINNER JOIN item_totals AS it\n  ON it.order_id = o.order_id\nWHERE o.status = 'completed'\nORDER BY o.order_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · Chasm-Trap-Free Executive Customer KPI Suite',
        title: `Step 3: Executive Customer Revenue & Unit KPI Suite (${slug})`,
        concept: 'Combine pre-aggregated order units with `orders` and `customers` so neither multi-item orders nor zero-order customers distort executive KPIs.',
        instructions: 'Using `WITH item_totals`, aggregate per customer: `completed_orders`, `units_purchased`, and `net_revenue_usd` across all `customers`, ordered by `net_revenue_usd DESC, c.customer_id ASC`.',
        hint: 'Left join `orders AS o` (`AND o.status = \'completed\'`) and `LEFT JOIN item_totals AS it ON it.order_id = o.order_id`, then group by `c.customer_id, c.name, c.tier`.',
        starter: `-- Step 3 Starter (${slug}): Customer order rollup without unit totals\nSELECT\n  c.customer_id,\n  c.name AS customer_name,\n  c.tier,\n  COUNT(o.order_id) AS completed_orders,\n  ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS net_revenue_usd\nFROM customers AS c\nLEFT JOIN orders AS o\n  ON o.customer_id = c.customer_id\n  AND o.status = 'completed'\nGROUP BY c.customer_id, c.name, c.tier\nORDER BY net_revenue_usd DESC, c.customer_id ASC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug})\nWITH item_totals AS (\n  SELECT\n    order_id,\n    SUM(quantity) AS order_units\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT\n  c.customer_id,\n  c.name AS customer_name,\n  c.tier,\n  COUNT(o.order_id) AS completed_orders,\n  COALESCE(SUM(it.order_units), 0) AS units_purchased,\n  ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS net_revenue_usd\nFROM customers AS c\nLEFT JOIN orders AS o\n  ON o.customer_id = c.customer_id\n  AND o.status = 'completed'\nLEFT JOIN item_totals AS it\n  ON it.order_id = o.order_id\nGROUP BY c.customer_id, c.name, c.tier\nORDER BY net_revenue_usd DESC, c.customer_id ASC;`
      }
    },

    'build-hierarchical-graph-query-engine': {
      datasetId: 'social_graph',
      complexity: { time: 'O(V + E) cycle-safe BFS fixpoint', space: 'O(V * D) visited path frontier', pattern: 'WITH RECURSIVE Reachability & Cycle Guard' },
      step1: {
        phase: 'Phase 1 · Anchor Hop Edges from Seed Node',
        title: `Step 1: Anchor Direct Follows from @codd_rel (${slug})`,
        concept: 'Establish the anchor member (`hop_depth = 1`) for `follower_id = 1` with a bracketed path string `\'[1]->[\' || f.followee_id || \']\'` for cycle detection.',
        instructions: 'Select `f.follower_id AS origin_id`, `f.followee_id AS reached_id`, `1 AS hop_depth`, and `\'[1]->[\' || f.followee_id || \']\' AS visit_path` from `follows AS f` where `f.follower_id = 1` ordered by `reached_id ASC`.',
        hint: 'Filter `WHERE f.follower_id = 1` and concatenate `\'[1]->[\' || f.followee_id || \']\' AS visit_path`.',
        starter: `-- Step 1 Starter (${slug}): Raw follows edges\nSELECT\n  follower_id,\n  followee_id,\n  followed_at\nFROM follows\nORDER BY follower_id ASC, followee_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Anchor hop edges with cycle-guard path\nSELECT\n  f.follower_id AS origin_id,\n  f.followee_id AS reached_id,\n  1 AS hop_depth,\n  '[1]->[' || f.followee_id || ']' AS visit_path\nFROM follows AS f\nWHERE f.follower_id = 1\nORDER BY reached_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Cycle-Safe Recursive Graph Fixpoint',
        title: `Step 2: Traverse Multi-Hop Reachability Without Cycles (${slug})`,
        concept: 'Because `social_graph.follows` contains reciprocal cycles (`1 <-> 2`), guard the recursive step with `g.visit_path NOT LIKE \'%[\' || f.followee_id || \']%\'`.',
        instructions: 'Complete `WITH RECURSIVE reach_graph` from `follower_id = 1` up to `hop_depth < 3` with cycle exclusion, returning `reached_id`, `hop_depth`, and `visit_path` ordered by `hop_depth ASC, reached_id ASC`.',
        hint: 'Join `follows AS f ON f.follower_id = g.reached_id` where `g.hop_depth < 3 AND g.visit_path NOT LIKE \'%[\' || f.followee_id || \']%\'`.',
        starter: `-- Step 2 Starter (${slug}): Anchor-only reachability query\nSELECT\n  f.followee_id AS reached_id,\n  1 AS hop_depth,\n  '[1]->[' || f.followee_id || ']' AS visit_path\nFROM follows AS f\nWHERE f.follower_id = 1\nORDER BY reached_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Cycle-safe WITH RECURSIVE graph traversal\nWITH RECURSIVE reach_graph AS (\n  SELECT\n    f.followee_id AS reached_id,\n    1 AS hop_depth,\n    '[1]->[' || f.followee_id || ']' AS visit_path\n  FROM follows AS f\n  WHERE f.follower_id = 1\n  UNION ALL\n  SELECT\n    f.followee_id AS reached_id,\n    g.hop_depth + 1 AS hop_depth,\n    g.visit_path || '->[' || f.followee_id || ']' AS visit_path\n  FROM reach_graph AS g\n  INNER JOIN follows AS f\n    ON f.follower_id = g.reached_id\n  WHERE g.hop_depth < 3\n    AND g.visit_path NOT LIKE '%[' || f.followee_id || ']%'\n)\nSELECT\n  reached_id,\n  hop_depth,\n  visit_path\nFROM reach_graph\nORDER BY hop_depth ASC, reached_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · Shortest-Hop Deduplication & Profile Enrichment',
        title: `Step 3: Compute Shortest-Hop Reachable Network (${slug})`,
        concept: 'Multiple paths can reach the same node (`1 -> 5` in 1 hop vs `1 -> 2 -> 3 -> 5` in 3 hops); group by `reached_id` and take `MIN(hop_depth)` to extract shortest paths.',
        instructions: 'Join `reach_graph` with `profiles AS p` (`p.user_id = g.reached_id`), grouping by `p.user_id, p.handle, p.reputation` to return `MIN(g.hop_depth) AS shortest_hops` and `COUNT(*) AS distinct_paths` ordered by `shortest_hops ASC, p.reputation DESC`.',
        hint: 'Group the `reach_graph` CTE joined to `profiles` by `p.user_id, p.handle, p.reputation`, projecting `MIN(g.hop_depth) AS shortest_hops` and `COUNT(*) AS distinct_paths`.',
        starter: `-- Step 3 Starter (${slug}): Uncollapsed reachability paths\nWITH RECURSIVE reach_graph AS (\n  SELECT\n    f.followee_id AS reached_id,\n    1 AS hop_depth,\n    '[1]->[' || f.followee_id || ']' AS visit_path\n  FROM follows AS f\n  WHERE f.follower_id = 1\n  UNION ALL\n  SELECT\n    f.followee_id AS reached_id,\n    g.hop_depth + 1 AS hop_depth,\n    g.visit_path || '->[' || f.followee_id || ']' AS visit_path\n  FROM reach_graph AS g\n  INNER JOIN follows AS f\n    ON f.follower_id = g.reached_id\n  WHERE g.hop_depth < 3\n    AND g.visit_path NOT LIKE '%[' || f.followee_id || ']%'\n)\nSELECT\n  reached_id,\n  hop_depth\nFROM reach_graph\nORDER BY hop_depth ASC;`,
        solution: `-- Dataset: social_graph | ${title} (${slug})\nWITH RECURSIVE reach_graph AS (\n  SELECT\n    f.followee_id AS reached_id,\n    1 AS hop_depth,\n    '[1]->[' || f.followee_id || ']' AS visit_path\n  FROM follows AS f\n  WHERE f.follower_id = 1\n  UNION ALL\n  SELECT\n    f.followee_id AS reached_id,\n    g.hop_depth + 1 AS hop_depth,\n    g.visit_path || '->[' || f.followee_id || ']' AS visit_path\n  FROM reach_graph AS g\n  INNER JOIN follows AS f\n    ON f.follower_id = g.reached_id\n  WHERE g.hop_depth < 3\n    AND g.visit_path NOT LIKE '%[' || f.followee_id || ']%'\n)\nSELECT\n  p.user_id,\n  p.handle,\n  p.reputation,\n  MIN(g.hop_depth) AS shortest_hops,\n  COUNT(*) AS distinct_paths\nFROM reach_graph AS g\nINNER JOIN profiles AS p\n  ON p.user_id = g.reached_id\nGROUP BY p.user_id, p.handle, p.reputation\nORDER BY shortest_hops ASC, p.reputation DESC;`
      }
    },

    'build-sessionization-retention-engine': {
      datasetId: 'saas_telemetry',
      complexity: { time: 'O(E log E) partitioned window sort', space: 'O(E) stream buffer', pattern: 'LAG() Boundary Flag -> Cumulative SUM() Island ID' },
      step1: {
        phase: 'Phase 1 · Navigational LAG() Over User Event Stream',
        title: `Step 1: Attach Previous Event Type & Timestamp via LAG (${slug})`,
        concept: 'Use `LAG(event_ts) OVER (PARTITION BY user_id ORDER BY event_ts ASC, event_id ASC)` to inspect adjacent events per user without a self-join.',
        instructions: 'Project `event_id`, `user_id`, `event_type`, `event_ts`, and `COALESCE(LAG(event_type) OVER (PARTITION BY user_id ORDER BY event_ts ASC, event_id ASC), \'SESSION_START\') AS prev_event` from `user_events` ordered by `user_id ASC, event_ts ASC`.',
        hint: 'Wrap `LAG(event_type) OVER (PARTITION BY user_id ORDER BY event_ts ASC, event_id ASC)` in `COALESCE(..., \'SESSION_START\') AS prev_event`.',
        starter: `-- Step 1 Starter (${slug}): Ordered clickstream without LAG\nSELECT\n  event_id,\n  user_id,\n  event_type,\n  event_ts\nFROM user_events\nORDER BY user_id ASC, event_ts ASC;`,
        solution: `-- Step 1 Solution (${slug}): Partitioned LAG navigation across user events\nSELECT\n  event_id,\n  user_id,\n  event_type,\n  event_ts,\n  COALESCE(\n    LAG(event_type) OVER (PARTITION BY user_id ORDER BY event_ts ASC, event_id ASC),\n    'SESSION_START'\n  ) AS prev_event\nFROM user_events\nORDER BY user_id ASC, event_ts ASC;`
      },
      step2: {
        phase: 'Phase 2 · Session Boundary Island Flagging',
        title: `Step 2: Flag Session Starts & Cumulative Step Numbers (${slug})`,
        concept: 'Mark session boundaries (`1` when `prev_ts IS NULL` or `event_type = \'signup\'`, else `0`) and number events within each user stream via `ROW_NUMBER()`.',
        instructions: 'In `query.sql`, project `event_id`, `user_id`, `event_type`, `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_ts ASC, event_id ASC) AS user_step_no`, and `latency_ms` ordered by `user_id ASC, user_step_no ASC`.',
        hint: 'Add `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_ts ASC, event_id ASC) AS user_step_no` and include `latency_ms` after it.',
        starter: `-- Step 2 Starter (${slug}): Stream without per-user step numbering\nSELECT\n  event_id,\n  user_id,\n  event_type,\n  latency_ms\nFROM user_events\nORDER BY user_id ASC, event_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Per-user ordered step sequence\nSELECT\n  event_id,\n  user_id,\n  event_type,\n  ROW_NUMBER() OVER (\n    PARTITION BY user_id\n    ORDER BY event_ts ASC, event_id ASC\n  ) AS user_step_no,\n  latency_ms\nFROM user_events\nORDER BY user_id ASC, user_step_no ASC;`
      },
      step3: {
        phase: 'Phase 3 · Rolling Latency Window & Cumulative Session Telemetry',
        title: `Step 3: Compute Running Latency & Tenant Journey Depth (${slug})`,
        concept: 'Combine `ROW_NUMBER()` and explicit `SUM(latency_ms) OVER (... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` to track cumulative session cost per user.',
        instructions: 'Join `user_events AS e` with `saas_users AS u`, projecting `u.org_name`, `e.event_type`, `step_seq`, `e.latency_ms`, and `cumulative_latency_ms` ordered by `u.user_id ASC, step_seq ASC`.',
        hint: 'Use `ROW_NUMBER() OVER (PARTITION BY e.user_id ORDER BY e.event_ts ASC, e.event_id ASC) AS step_seq` and `SUM(e.latency_ms) OVER (PARTITION BY e.user_id ORDER BY e.event_ts ASC, e.event_id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_latency_ms`.',
        starter: `-- Step 3 Starter (${slug}): Joined user events before window accumulation\nSELECT\n  u.org_name,\n  e.event_type,\n  e.latency_ms,\n  e.event_ts\nFROM user_events AS e\nINNER JOIN saas_users AS u\n  ON u.user_id = e.user_id\nORDER BY u.user_id ASC, e.event_ts ASC;`,
        solution: `-- Dataset: saas_telemetry | ${title} (${slug})\nSELECT\n  u.org_name,\n  e.event_type,\n  ROW_NUMBER() OVER (\n    PARTITION BY e.user_id\n    ORDER BY e.event_ts ASC, e.event_id ASC\n  ) AS step_seq,\n  e.latency_ms,\n  SUM(e.latency_ms) OVER (\n    PARTITION BY e.user_id\n    ORDER BY e.event_ts ASC, e.event_id ASC\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n  ) AS cumulative_latency_ms\nFROM user_events AS e\nINNER JOIN saas_users AS u\n  ON u.user_id = e.user_id\nORDER BY u.user_id ASC, step_seq ASC;`
      }
    },

    'build-normalized-booking-schema': {
      datasetId: 'org_hr',
      complexity: { time: 'O(E + P + A) normalized 3NF join', space: 'O(E) engineer rollup map', pattern: '1NF/2NF/3NF Junction Table & Functional Dependency Audit' },
      step1: {
        phase: 'Phase 1 · Verifying 3NF Transitive Dependency Separation',
        title: `Step 1: Verify Department Attributes Factored out of Employees (${slug})`,
        concept: 'In 3NF, `cost_center` and `annual_budget_usd` depend on `dept_id` (not `emp_id`), preventing update anomalies when a cost center changes.',
        instructions: 'Join `employees AS e` with `departments AS d` to project `e.emp_id`, `e.name AS employee_name`, `d.name AS dept_name`, and `d.cost_center` ordered by `e.emp_id ASC`.',
        hint: 'Inner join `departments AS d ON d.dept_id = e.dept_id` and select `e.emp_id`, `e.name AS employee_name`, `d.name AS dept_name`, `d.cost_center`.',
        starter: `-- Step 1 Starter (${slug}): Employees with foreign key dept_id only\nSELECT\n  emp_id,\n  name AS employee_name,\n  dept_id,\n  salary_usd\nFROM employees\nORDER BY emp_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): 3NF join resolving department functional dependency\nSELECT\n  e.emp_id,\n  e.name AS employee_name,\n  d.name AS dept_name,\n  d.cost_center\nFROM employees AS e\nINNER JOIN departments AS d\n  ON d.dept_id = e.dept_id\nORDER BY e.emp_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Composite-Key M:N Junction Table Inspection',
        title: `Step 2: Resolve M:N Project Assignments via Junction Table (${slug})`,
        concept: 'The composite key `(emp_id, project_id)` in `employee_projects` models many-to-many allocations with `allocation_pct` fully dependent on the whole key (2NF/BCNF).',
        instructions: 'Join `employee_projects AS ep`, `employees AS e`, and `projects AS p` to project `e.name AS employee_name`, `p.code AS project_code`, `ep.allocation_pct`, and `ROUND((e.salary_usd * ep.allocation_pct) / 100.0, 2) AS allocated_cost_usd` ordered by `allocated_cost_usd DESC`.',
        hint: 'Join `employees` and `projects` onto `employee_projects`, compute `ROUND((e.salary_usd * ep.allocation_pct) / 100.0, 2) AS allocated_cost_usd`, and order by `allocated_cost_usd DESC`.',
        starter: `-- Step 2 Starter (${slug}): Raw junction table rows\nSELECT\n  emp_id,\n  project_id,\n  allocation_pct\nFROM employee_projects\nORDER BY emp_id ASC, project_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): 2NF/BCNF composite-key allocation valuation\nSELECT\n  e.name AS employee_name,\n  p.code AS project_code,\n  ep.allocation_pct,\n  ROUND((e.salary_usd * ep.allocation_pct) / 100.0, 2) AS allocated_cost_usd\nFROM employee_projects AS ep\nINNER JOIN employees AS e\n  ON e.emp_id = ep.emp_id\nINNER JOIN projects AS p\n  ON p.project_id = ep.project_id\nORDER BY allocated_cost_usd DESC;`
      },
      step3: {
        phase: 'Phase 3 · Capacity Invariant Audit Across Normalized Relations',
        title: `Step 3: Audit Engineer Allocation Capacity <= 100% (${slug})`,
        concept: 'Aggregate across the normalized junction table to verify whether each engineer is unallocated, partially allocated, or at 100% capacity.',
        instructions: 'Left join `employees` to `employee_projects`, grouping by `e.emp_id, e.name, d.name` (with `departments`) to project `project_count`, `total_allocation_pct`, and `capacity_state` (`FULL_CAPACITY`, `PARTIAL`, `UNASSIGNED`) ordered by `total_allocation_pct DESC, e.emp_id ASC`.',
        hint: 'Use `COALESCE(SUM(ep.allocation_pct), 0) AS total_allocation_pct` and a 3-branch `CASE WHEN COALESCE(SUM(ep.allocation_pct), 0) >= 100 THEN \'FULL_CAPACITY\' WHEN COALESCE(SUM(ep.allocation_pct), 0) > 0 THEN \'PARTIAL\' ELSE \'UNASSIGNED\' END`.',
        starter: `-- Step 3 Starter (${slug}): Engineer project count scaffold\nSELECT\n  e.emp_id,\n  e.name AS employee_name,\n  COUNT(ep.project_id) AS project_count\nFROM employees AS e\nLEFT JOIN employee_projects AS ep\n  ON ep.emp_id = e.emp_id\nGROUP BY e.emp_id, e.name\nORDER BY e.emp_id ASC;`,
        solution: `-- Dataset: org_hr | ${title} (${slug})\nSELECT\n  e.emp_id,\n  e.name AS employee_name,\n  d.name AS dept_name,\n  COUNT(ep.project_id) AS project_count,\n  COALESCE(SUM(ep.allocation_pct), 0) AS total_allocation_pct,\n  CASE\n    WHEN COALESCE(SUM(ep.allocation_pct), 0) >= 100 THEN 'FULL_CAPACITY'\n    WHEN COALESCE(SUM(ep.allocation_pct), 0) > 0 THEN 'PARTIAL'\n    ELSE 'UNASSIGNED'\n  END AS capacity_state\nFROM employees AS e\nINNER JOIN departments AS d\n  ON d.dept_id = e.dept_id\nLEFT JOIN employee_projects AS ep\n  ON ep.emp_id = e.emp_id\nGROUP BY e.emp_id, e.name, d.name\nORDER BY total_allocation_pct DESC, e.emp_id ASC;`
      }
    },

    'build-scd-type2-warehouse-pipeline': {
      datasetId: 'org_hr',
      complexity: { time: 'O(H log H) window LEAD interval build', space: 'O(H) version chain', pattern: 'SCD Type 2 (valid_from, valid_to, is_current) via LEAD()' },
      step1: {
        phase: 'Phase 1 · Change Event Delta Extraction',
        title: `Step 1: Compute Historical Compensation Deltas (${slug})`,
        concept: 'Extract immutable compensation change events from `salary_history` with net raise amounts before constructing SCD Type 2 validity intervals.',
        instructions: 'Project `history_id`, `emp_id`, `old_salary_usd`, `new_salary_usd`, `(new_salary_usd - old_salary_usd) AS raise_usd`, and `effective_date` ordered by `emp_id ASC, effective_date ASC`.',
        hint: 'Add `(new_salary_usd - old_salary_usd) AS raise_usd` and order by `emp_id ASC, effective_date ASC`.',
        starter: `-- Step 1 Starter (${slug}): Raw salary_history rows\nSELECT\n  history_id,\n  emp_id,\n  old_salary_usd,\n  new_salary_usd,\n  effective_date\nFROM salary_history\nORDER BY history_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Ordered compensation change events\nSELECT\n  history_id,\n  emp_id,\n  old_salary_usd,\n  new_salary_usd,\n  (new_salary_usd - old_salary_usd) AS raise_usd,\n  effective_date\nFROM salary_history\nORDER BY emp_id ASC, effective_date ASC;`
      },
      step2: {
        phase: 'Phase 2 · Constructing [valid_from, valid_to) Intervals with LEAD()',
        title: `Step 2: Derive SCD Type 2 Validity Windows (${slug})`,
        concept: 'Use `LEAD(effective_date) OVER (PARTITION BY emp_id ORDER BY effective_date ASC)` to close superseded dimension rows and mark open rows with `\'9999-12-31\'`.',
        instructions: 'Project `emp_id`, `new_salary_usd AS band_salary_usd`, `effective_date AS valid_from`, `COALESCE(LEAD(effective_date) OVER (PARTITION BY emp_id ORDER BY effective_date ASC), \'9999-12-31\') AS valid_to`, and `is_current` (`1` when `LEAD(...) IS NULL` else `0`) ordered by `emp_id ASC, valid_from ASC`.',
        hint: 'Use `LEAD(effective_date) OVER (PARTITION BY emp_id ORDER BY effective_date ASC)` inside both `COALESCE(..., \'9999-12-31\')` and `CASE WHEN LEAD(...) IS NULL THEN 1 ELSE 0 END AS is_current`.',
        starter: `-- Step 2 Starter (${slug}): Unbounded effective_date rows\nSELECT\n  emp_id,\n  new_salary_usd AS band_salary_usd,\n  effective_date AS valid_from\nFROM salary_history\nORDER BY emp_id ASC, effective_date ASC;`,
        solution: `-- Step 2 Solution (${slug}): SCD Type 2 validity intervals and current flag\nSELECT\n  emp_id,\n  new_salary_usd AS band_salary_usd,\n  effective_date AS valid_from,\n  COALESCE(\n    LEAD(effective_date) OVER (PARTITION BY emp_id ORDER BY effective_date ASC),\n    '9999-12-31'\n  ) AS valid_to,\n  CASE\n    WHEN LEAD(effective_date) OVER (PARTITION BY emp_id ORDER BY effective_date ASC) IS NULL THEN 1\n    ELSE 0\n  END AS is_current\nFROM salary_history\nORDER BY emp_id ASC, valid_from ASC;`
      },
      step3: {
        phase: 'Phase 3 · Enriched SCD Type 2 Dimension Mart',
        title: `Step 3: Build Enriched SCD2 Employee Dimension View (${slug})`,
        concept: 'Join the SCD Type 2 versioned intervals with conformed `employees` and `departments` attributes and assign surrogate version numbers (`ROW_NUMBER()`).',
        instructions: 'Wrap the SCD2 query or join directly with `employees` and `departments` to project `e.name AS employee_name`, `d.name AS dept_name`, `version_num`, `band_salary_usd`, `valid_from`, `valid_to`, and `is_current` ordered by `e.emp_id ASC, version_num ASC`.',
        hint: 'Add `ROW_NUMBER() OVER (PARTITION BY sh.emp_id ORDER BY sh.effective_date ASC) AS version_num`, join `employees` and `departments`, and keep the `valid_from`, `valid_to`, and `is_current` window columns.',
        starter: `-- Step 3 Starter (${slug}): Employee join without SCD2 version intervals\nSELECT\n  e.name AS employee_name,\n  d.name AS dept_name,\n  sh.new_salary_usd AS band_salary_usd,\n  sh.effective_date AS valid_from\nFROM salary_history AS sh\nINNER JOIN employees AS e\n  ON e.emp_id = sh.emp_id\nINNER JOIN departments AS d\n  ON d.dept_id = e.dept_id\nORDER BY e.emp_id ASC, sh.effective_date ASC;`,
        solution: `-- Dataset: org_hr | ${title} (${slug})\nSELECT\n  e.name AS employee_name,\n  d.name AS dept_name,\n  ROW_NUMBER() OVER (\n    PARTITION BY sh.emp_id\n    ORDER BY sh.effective_date ASC\n  ) AS version_num,\n  sh.new_salary_usd AS band_salary_usd,\n  sh.effective_date AS valid_from,\n  COALESCE(\n    LEAD(sh.effective_date) OVER (PARTITION BY sh.emp_id ORDER BY sh.effective_date ASC),\n    '9999-12-31'\n  ) AS valid_to,\n  CASE\n    WHEN LEAD(sh.effective_date) OVER (PARTITION BY sh.emp_id ORDER BY sh.effective_date ASC) IS NULL THEN 1\n    ELSE 0\n  END AS is_current\nFROM salary_history AS sh\nINNER JOIN employees AS e\n  ON e.emp_id = sh.emp_id\nINNER JOIN departments AS d\n  ON d.dept_id = e.dept_id\nORDER BY e.emp_id ASC, version_num ASC;`
      }
    },

    'build-saas-cohort-funnel-workbench': {
      datasetId: 'saas_telemetry',
      complexity: { time: 'O(U + E + I) cohort & funnel rollup', space: 'O(U) per-tenant funnel flags', pattern: 'Cohort MRR Retention + Multi-Stage Conversion Funnel' },
      step1: {
        phase: 'Phase 1 · Monthly Signup Cohort & Active MRR Baseline',
        title: `Step 1: Aggregate Cohort Signups & Active MRR (${slug})`,
        concept: 'Join `saas_users` and `subscriptions` grouped by `cohort_month` to measure initial tenant volume vs active contracted MRR.',
        instructions: 'Group `saas_users AS u INNER JOIN subscriptions AS s` by `u.cohort_month` to return `cohort_tenants`, `active_subs`, and `active_mrr_usd` ordered by `u.cohort_month ASC`.',
        hint: 'Use `COUNT(u.user_id) AS cohort_tenants`, `SUM(CASE WHEN s.status = \'active\' THEN 1 ELSE 0 END) AS active_subs`, and `SUM(CASE WHEN s.status = \'active\' THEN s.mrr_usd ELSE 0 END) AS active_mrr_usd`.',
        starter: `-- Step 1 Starter (${slug}): Unaggregated cohort subscription rows\nSELECT\n  u.cohort_month,\n  u.org_name,\n  s.status,\n  s.mrr_usd\nFROM saas_users AS u\nINNER JOIN subscriptions AS s\n  ON s.user_id = u.user_id\nORDER BY u.cohort_month ASC;`,
        solution: `-- Step 1 Solution (${slug}): Monthly cohort MRR rollup\nSELECT\n  u.cohort_month,\n  COUNT(u.user_id) AS cohort_tenants,\n  SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS active_subs,\n  SUM(CASE WHEN s.status = 'active' THEN s.mrr_usd ELSE 0 END) AS active_mrr_usd\nFROM saas_users AS u\nINNER JOIN subscriptions AS s\n  ON s.user_id = u.user_id\nGROUP BY u.cohort_month\nORDER BY u.cohort_month ASC;`
      },
      step2: {
        phase: 'Phase 2 · Per-Tenant Multi-Step Funnel Flagging',
        title: `Step 2: Flag 4-Stage Product Activation Funnel per Org (${slug})`,
        concept: 'Use `MAX(CASE WHEN e.event_type = ... THEN 1 ELSE 0 END)` per user so multiple `query_run` events do not double-count funnel progression.',
        instructions: 'Group `saas_users LEFT JOIN user_events` by `u.user_id, u.org_name, u.cohort_month` to compute binary flags `did_signup`, `did_connect`, `did_query`, and `did_upgrade` ordered by `u.user_id ASC`.',
        hint: 'Apply `MAX(CASE WHEN e.event_type = \'...\' THEN 1 ELSE 0 END)` for `\'signup\'`, `\'schema_connect\'`, `\'query_run\'`, and `\'upgrade_pro\'`.',
        starter: `-- Step 2 Starter (${slug}): Raw user event rows\nSELECT\n  u.user_id,\n  u.org_name,\n  u.cohort_month,\n  e.event_type\nFROM saas_users AS u\nLEFT JOIN user_events AS e\n  ON e.user_id = u.user_id\nORDER BY u.user_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Deduplicated binary funnel stage flags per org\nSELECT\n  u.user_id,\n  u.org_name,\n  u.cohort_month,\n  MAX(CASE WHEN e.event_type = 'signup' THEN 1 ELSE 0 END) AS did_signup,\n  MAX(CASE WHEN e.event_type = 'schema_connect' THEN 1 ELSE 0 END) AS did_connect,\n  MAX(CASE WHEN e.event_type = 'query_run' THEN 1 ELSE 0 END) AS did_query,\n  MAX(CASE WHEN e.event_type = 'upgrade_pro' THEN 1 ELSE 0 END) AS did_upgrade\nFROM saas_users AS u\nLEFT JOIN user_events AS e\n  ON e.user_id = u.user_id\nGROUP BY u.user_id, u.org_name, u.cohort_month\nORDER BY u.user_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · Cohort Funnel Conversion & Collected Revenue Matrix',
        title: `Step 3: Build Cohort Conversion & Paid Revenue Workbench (${slug})`,
        concept: 'Roll up the per-tenant funnel CTE by `cohort_month` alongside collected invoice revenue without event-to-invoice fanout.',
        instructions: 'Combine `tenant_funnel` and `tenant_billing` CTEs grouped by `cohort_month` to project `tenants`, `activated_query_orgs`, `upgraded_orgs`, and `collected_revenue_usd` ordered by `cohort_month ASC`.',
        hint: 'Pre-aggregate funnel flags per user in `tenant_funnel` and paid invoice sums per user in `tenant_billing`, join them on `user_id`, and group by `cohort_month`.',
        starter: `-- Step 3 Starter (${slug}): Per-tenant funnel CTE before cohort rollup\nWITH tenant_funnel AS (\n  SELECT\n    u.user_id,\n    u.cohort_month,\n    MAX(CASE WHEN e.event_type = 'query_run' THEN 1 ELSE 0 END) AS did_query,\n    MAX(CASE WHEN e.event_type = 'upgrade_pro' THEN 1 ELSE 0 END) AS did_upgrade\n  FROM saas_users AS u\n  LEFT JOIN user_events AS e\n    ON e.user_id = u.user_id\n  GROUP BY u.user_id, u.cohort_month\n)\nSELECT\n  cohort_month,\n  SUM(did_query) AS activated_query_orgs,\n  SUM(did_upgrade) AS upgraded_orgs\nFROM tenant_funnel\nGROUP BY cohort_month\nORDER BY cohort_month ASC;`,
        solution: `-- Dataset: saas_telemetry | ${title} (${slug})\nWITH tenant_funnel AS (\n  SELECT\n    u.user_id,\n    u.cohort_month,\n    MAX(CASE WHEN e.event_type = 'query_run' THEN 1 ELSE 0 END) AS did_query,\n    MAX(CASE WHEN e.event_type = 'upgrade_pro' THEN 1 ELSE 0 END) AS did_upgrade\n  FROM saas_users AS u\n  LEFT JOIN user_events AS e\n    ON e.user_id = u.user_id\n  GROUP BY u.user_id, u.cohort_month\n),\ntenant_billing AS (\n  SELECT\n    s.user_id,\n    COALESCE(SUM(CASE WHEN i.paid = 1 THEN i.amount_usd ELSE 0 END), 0) AS paid_usd\n  FROM subscriptions AS s\n  LEFT JOIN invoices AS i\n    ON i.sub_id = s.sub_id\n  GROUP BY s.user_id\n)\nSELECT\n  tf.cohort_month,\n  COUNT(tf.user_id) AS tenants,\n  SUM(tf.did_query) AS activated_query_orgs,\n  SUM(tf.did_upgrade) AS upgraded_orgs,\n  COALESCE(SUM(tb.paid_usd), 0) AS collected_revenue_usd\nFROM tenant_funnel AS tf\nLEFT JOIN tenant_billing AS tb\n  ON tb.user_id = tf.user_id\nGROUP BY tf.cohort_month\nORDER BY tf.cohort_month ASC;`
      }
    }
  };

  return capstones[slug] || null;
}

module.exports = { buildCapstoneBlueprints };
