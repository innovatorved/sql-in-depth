#!/usr/bin/env node
/**
 * Generates all 18 Module Content files (data/content/m01-*.js .. m18-*.js),
 * all 18 Question Bank files (data/questions/q01-*.js .. q18-*.js),
 * and data/topic_guided_labs.js (all 180 units) for SQL In Depth.
 */
const fs = require('fs');
const path = require('path');

global.window = {};
require('../data/curriculum.js');
const curriculum = global.window.CURRICULUM_DATA;

const MODULE_SLUGS = {
  m01: 'relational-foundations',
  m02: 'ddl-constraints-dml',
  m03: 'relational-algebra-joins',
  m04: 'aggregations-grouping-rollups',
  m05: 'subqueries-ctes-recursive',
  m06: 'window-functions-analytics',
  m07: 'data-modeling-normalization',
  m08: 'dimensional-modeling-olap',
  m09: 'advanced-patterns-temporal',
  m10: 'btree-indexing-mechanics',
  m11: 'query-planner-explain',
  m12: 'physical-join-algorithms',
  m13: 'acid-transactions-isolation',
  m14: 'locking-mvcc-vacuum',
  m15: 'storage-engine-pages-wal-lsm',
  m16: 'columnar-olap-lakehouses',
  m17: 'replication-sharding-newsql',
  m18: 'production-tuning-reliability'
};

// 36 Live oEmbed-Verified (HTTP 200 OK) Database Systems & SQL Engineering Lectures (2 per Module m01..m18)
const MODULE_VIDEOS = {
  m01: [
    { youtubeId: 'APqWIjtzNGE', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:18:12', length: '78m' },
    { youtubeId: 'oeYBdghaIjc', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:06:44', length: '67m' }
  ],
  m02: [
    { youtubeId: 'p3qvj9hO_Bo', channel: 'Web Dev Simplified', duration: '56:23', length: '56m' },
    { youtubeId: 'Wbg2HoYjLHU', channel: 'PGConf.EU (PostgreSQL Europe)', duration: '43:20', length: '43m' }
  ],
  m03: [
    { youtubeId: 'MzigBKf84aY', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:20:15', length: '80m' },
    { youtubeId: '4cWkVbC2bNE', channel: 'freeCodeCamp / Cornell Database Systems', duration: '4:52:10', length: '292m' }
  ],
  m04: [
    { youtubeId: 'mM3sFwSuGNY', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:21:05', length: '81m' },
    { youtubeId: 'tOsb-tFoPCg', channel: 'Arpit Bhayani (Asli Engineering)', duration: '13:22', length: '13m' }
  ],
  m05: [
    { youtubeId: 'HNtlew7mCc4', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:19:40', length: '80m' },
    { youtubeId: 'Ugf6IAsaJqk', channel: 'Citus Data / PostgreSQL', duration: '58:35', length: '59m' }
  ],
  m06: [
    { youtubeId: 'Vy2t_wZx4Is', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:22:18', length: '82m' },
    { youtubeId: 'YO95iAkwapQ', channel: 'Data Council (Tyler Akidau)', duration: '46:25', length: '46m' }
  ],
  m07: [
    { youtubeId: 'GFQaEYEc8_8', channel: 'Decomplexify', duration: '28:34', length: '29m' },
    { youtubeId: 'TUcPS6dsWx4', channel: 'Hello Interview', duration: '30:35', length: '31m' }
  ],
  m08: [
    { youtubeId: 'nhlpwmOBEiE', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:23:10', length: '83m' },
    { youtubeId: 'fU9hR3kiOK0', channel: 'Strange Loop (Martin Kleppmann)', duration: '47:43', length: '48m' }
  ],
  m09: [
    { youtubeId: 'WIRy1Ws47ic', channel: 'Citus Con (Microsoft Developers)', duration: '29:30', length: '30m' },
    { youtubeId: 'zwDIN04lIpc', channel: 'PlanetScale (Aaron Francis)', duration: '13:20', length: '13m' }
  ],
  m10: [
    { youtubeId: 'scUtG_6M_lU', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:24:10', length: '84m' },
    { youtubeId: 'u7ii_Lvm9rM', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:24:43', length: '85m' }
  ],
  m11: [
    { youtubeId: 'X8EHO8VLeG0', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:20:45', length: '81m' },
    { youtubeId: 'P7EUFtjeAmI', channel: 'Hussein Nasser', duration: '10:17', length: '10m' }
  ],
  m12: [
    { youtubeId: 'MFazkaZKs1s', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:18:50', length: '79m' },
    { youtubeId: '-htbah3eCYg', channel: 'Arpit Bhayani (Asli Engineering)', duration: '11:08', length: '11m' }
  ],
  m13: [
    { youtubeId: '4y656idl8ZU', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:21:30', length: '82m' },
    { youtubeId: '5ZjhNTM8XU8', channel: 'Goto Conferences (Martin Kleppmann)', duration: '41:08', length: '41m' }
  ],
  m14: [
    { youtubeId: 'niLwbfE3V9Q', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:27:07', length: '87m' },
    { youtubeId: 'bXpkEt5P_Js', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:19:15', length: '79m' }
  ],
  m15: [
    { youtubeId: 'dSxV5Sob5V8', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:22:28', length: '82m' },
    { youtubeId: 'yVpzHdAP0TY', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:12:55', length: '73m' }
  ],
  m16: [
    { youtubeId: 'fr5lIchF6pw', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:23:40', length: '84m' },
    { youtubeId: 'L6E75IyBgpk', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:17:50', length: '78m' }
  ],
  m17: [
    { youtubeId: 'o7bjRUcDMx0', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:21:12', length: '81m' },
    { youtubeId: '3wNmpE6DsSs', channel: 'CMU Database Group (Andy Pavlo)', duration: '1:19:30', length: '80m' }
  ],
  m18: [
    { youtubeId: 'Jvdtx-Smffo', channel: 'Scaling Postgres', duration: '19:31', length: '20m' },
    { youtubeId: 'OFjvJmS_uDo', channel: 'InfoQ / Stripe Engineering', duration: '43:46', length: '44m' }
  ]
};

const PRIMARY_DOCS = [
  { title: 'PostgreSQL 17 Official Documentation — SQL Language & Internals', url: 'https://www.postgresql.org/docs/current/sql.html' },
  { title: 'SQLite 3 Architecture & Next-Generation Query Planner', url: 'https://www.sqlite.org/queryplanner-ng.html' },
  { title: 'Use The Index, Luke! — SQL Indexing & Tuning Guide (Markus Winand)', url: 'https://use-the-index-luke.com/' },
  { title: 'CMU 15-445/645 Intro to Database Systems Lecture Notes', url: 'https://15445.courses.cs.cmu.edu/' },
  { title: 'DuckDB Official Documentation — Vectorized Analytical SQL', url: 'https://duckdb.org/docs/sql/introduction' },
  { title: 'ClickHouse Official Documentation — MergeTree & Columnar OLAP', url: 'https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree' },
  { title: 'PostgreSQL Internals — Concurrency Control, MVCC & Snapshot Isolation', url: 'https://www.postgresql.org/docs/current/mvcc.html' },
  { title: 'SQLite File Format & B-Tree Page Layout Specification', url: 'https://www.sqlite.org/fileformat2.html' }
];

// 100% Schema-Verified SQL Queries matching data/datasets.js across all 18 modules
function buildUnitSqlSnippet(modId, uIdx, slug, title) {
  const modNum = parseInt(modId.replace('m', ''), 10);

  if (modNum === 1) {
    const queries = [
      `-- Dataset: ecommerce | Declarative Projection & Filtering over Relations
SELECT
  c.customer_id,
  c.name AS customer_name,
  c.tier,
  c.country,
  COUNT(o.order_id) AS completed_orders,
  ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS lifetime_value_usd
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
  AND o.status = 'completed'
WHERE c.country IN ('US', 'IN', 'GB', 'DE')
GROUP BY c.customer_id, c.name, c.tier, c.country
ORDER BY lifetime_value_usd DESC
LIMIT 8;`,
      `-- Dataset: ecommerce | Strict Domain Types & Exact Cents vs Float Precision
SELECT
  p.product_id,
  p.sku,
  p.name AS product_title,
  cat.name AS category_name,
  p.price_cents,
  ROUND(p.price_cents / 100.0, 2) AS price_usd,
  p.stock_qty,
  ROUND((p.price_cents * p.stock_qty) / 100.0, 2) AS inventory_valuation_usd
FROM products AS p
INNER JOIN categories AS cat
  ON cat.category_id = p.category_id
WHERE p.is_active = 1
ORDER BY inventory_valuation_usd DESC;`,
      `-- Dataset: ecommerce | Logical Execution Order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY
SELECT
  o.status AS order_state,
  COUNT(*) AS order_count,
  ROUND(SUM(o.total_cents) / 100.0, 2) AS gross_revenue_usd,
  ROUND(AVG(o.total_cents) / 100.0, 2) AS avg_order_usd
FROM orders AS o
WHERE o.total_cents >= 15000
GROUP BY o.status
HAVING COUNT(*) >= 1
ORDER BY gross_revenue_usd DESC;`,
      `-- Dataset: ecommerce | SARGable Range & Set Predicates in WHERE
SELECT
  order_id,
  customer_id,
  status,
  ROUND(total_cents / 100.0, 2) AS total_usd,
  discount_code,
  created_at
FROM orders
WHERE created_at >= '2025-02-01'
  AND created_at < '2025-04-01'
  AND status IN ('completed', 'pending')
  AND total_cents BETWEEN 15000 AND 150000
ORDER BY created_at DESC;`,
      `-- Dataset: ecommerce | Three-Valued Logic (3VL): Why NULL Predicates Evaluate to UNKNOWN
SELECT
  order_id,
  customer_id,
  status,
  discount_code,
  CASE
    WHEN discount_code = 'VIP20' THEN 'Matched VIP20 (TRUE)'
    WHEN discount_code <> 'VIP20' THEN 'Different Promo Code (TRUE)'
    ELSE 'NULL -> Comparison is UNKNOWN (3VL)'
  END AS three_valued_truth_state
FROM orders
ORDER BY order_id;`,
      `-- Dataset: ecommerce | Null-Safe Handling with COALESCE & NULLIF
SELECT
  o.order_id,
  c.name AS customer_name,
  COALESCE(o.discount_code, 'NO_PROMO') AS normalized_discount_code,
  o.total_cents,
  ROUND(o.total_cents / NULLIF(100.0, 0), 2) AS total_usd
FROM orders AS o
INNER JOIN customers AS c
  ON c.customer_id = o.customer_id
WHERE o.discount_code IS NULL OR o.total_cents >= 30000
ORDER BY o.total_cents DESC;`,
      `-- Dataset: ecommerce | Deterministic Multi-Column Sorting & Top-N Pagination
SELECT DISTINCT
  cat.name AS category_name,
  p.name AS product_name,
  ROUND(p.price_cents / 100.0, 2) AS price_usd,
  p.stock_qty
FROM products AS p
INNER JOIN categories AS cat
  ON cat.category_id = p.category_id
WHERE p.is_active = 1
ORDER BY
  category_name ASC,
  price_usd DESC
LIMIT 8 OFFSET 0;`,
      `-- Dataset: ecommerce | Conditional Searched CASE Expressions & Tier Classification
SELECT
  o.order_id,
  c.name AS customer_name,
  ROUND(o.total_cents / 100.0, 2) AS total_usd,
  CASE
    WHEN o.total_cents >= 90000 THEN 'VIP High-Value Order'
    WHEN o.total_cents >= 40000 THEN 'Standard Commercial Order'
    ELSE 'Entry Transaction'
  END AS order_segment,
  COALESCE(o.discount_code, 'ORGANIC') AS acquisition_channel
FROM orders AS o
INNER JOIN customers AS c
  ON c.customer_id = o.customer_id
ORDER BY o.total_cents DESC;`
    ];
    return queries[uIdx % queries.length];
  }

  if (modNum === 2) {
    const dmlQueries = [
      `-- Dataset: ecommerce | DDL Referential Integrity & Domain Constraint Verification
SELECT
  p.product_id,
  p.sku,
  p.name AS product_name,
  p.price_cents,
  p.stock_qty,
  COUNT(oi.order_item_id) AS line_item_references,
  COALESCE(SUM(oi.quantity), 0) AS total_units_ordered,
  CASE
    WHEN p.price_cents >= 0 AND p.stock_qty >= 0 THEN 'CHECK_VALID'
    ELSE 'CONSTRAINT_VIOLATION'
  END AS domain_constraint_status
FROM products AS p
LEFT JOIN order_items AS oi
  ON oi.product_id = p.product_id
GROUP BY p.product_id, p.sku, p.name, p.price_cents, p.stock_qty
ORDER BY total_units_ordered DESC;`,
      `-- Dataset: ecommerce | Foreign Key Cascade & Orphan Audit Across Orders & Payments
SELECT
  o.order_id,
  c.name AS customer_name,
  o.status AS order_status,
  ROUND(o.total_cents / 100.0, 2) AS billed_usd,
  COALESCE(pay.method, 'UNPAID') AS payment_method,
  COALESCE(pay.status, 'AWAITING_SETTLEMENT') AS payment_status
FROM orders AS o
INNER JOIN customers AS c
  ON c.customer_id = o.customer_id
LEFT JOIN payments AS pay
  ON pay.order_id = o.order_id
ORDER BY o.order_id ASC;`,
      `-- Dataset: fintech_ledger | Idempotency Key Uniqueness & Account Version Audit
SELECT
  t.transfer_id,
  t.idempotency_key,
  fa.owner_name AS sender_account,
  ta.owner_name AS receiver_account,
  ROUND(t.amount_cents / 100.0, 2) AS transfer_usd,
  t.status
FROM transfers AS t
INNER JOIN accounts AS fa ON fa.account_id = t.from_account_id
INNER JOIN accounts AS ta ON ta.account_id = t.to_account_id
ORDER BY t.transfer_id ASC;`
    ];
    return dmlQueries[uIdx % dmlQueries.length];
  }

  if (modNum === 3) {
    const joinQueries = [
      `-- Dataset: ecommerce | Relational Algebra Selection (σ), Projection (π) & Equi-Join (⋈)
SELECT
  o.order_id,
  c.name AS customer_name,
  c.country,
  o.status,
  ROUND(o.total_cents / 100.0, 2) AS order_total_usd
FROM orders AS o
INNER JOIN customers AS c
  ON c.customer_id = o.customer_id
WHERE o.status = 'completed'
ORDER BY o.total_cents DESC;`,
      `-- Dataset: ecommerce | LEFT OUTER JOIN: Preserving Customers With Zero Completed Orders
SELECT
  c.customer_id,
  c.name AS customer_name,
  c.tier,
  o.order_id,
  COALESCE(o.status, 'NO_COMPLETED_ORDER') AS order_status,
  ROUND(COALESCE(o.total_cents, 0) / 100.0, 2) AS total_usd
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
  AND o.status = 'completed'
ORDER BY o.order_id IS NULL DESC, total_usd DESC;`,
      `-- Dataset: ecommerce | Anti-Join (NOT EXISTS): Finding Unordered Catalog Products
SELECT
  p.product_id,
  p.sku,
  p.name AS product_name,
  ROUND(p.price_cents / 100.0, 2) AS price_usd,
  p.stock_qty
FROM products AS p
WHERE NOT EXISTS (
  SELECT 1
  FROM order_items AS oi
  WHERE oi.product_id = p.product_id
)
ORDER BY p.price_cents DESC;`,
      `-- Dataset: org_hr | Self-Join: Employee-to-Manager Reporting Pairs & Compensation Ratio
SELECT
  e.emp_id,
  e.name AS employee_name,
  e.title AS employee_role,
  e.salary_usd AS employee_salary,
  COALESCE(m.name, 'BOARD_ROOT') AS manager_name,
  m.salary_usd AS manager_salary
FROM employees AS e
LEFT JOIN employees AS m
  ON m.emp_id = e.manager_id
ORDER BY e.salary_usd DESC;`
    ];
    return joinQueries[uIdx % joinQueries.length];
  }

  if (modNum === 4) {
    const aggQueries = [
      `-- Dataset: ecommerce | Conditional Aggregation with FILTER (WHERE ...) & Country Rollups
SELECT
  c.country,
  COUNT(DISTINCT c.customer_id) AS total_customers,
  COUNT(o.order_id) AS total_orders,
  COUNT(o.order_id) FILTER (WHERE o.status = 'completed') AS completed_orders,
  COUNT(o.order_id) FILTER (WHERE o.status IN ('cancelled', 'refunded')) AS reversed_orders,
  ROUND(
    COALESCE(SUM(o.total_cents) FILTER (WHERE o.status = 'completed'), 0) / 100.0,
    2
  ) AS net_settled_revenue_usd
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
GROUP BY c.country
HAVING COUNT(o.order_id) >= 1
ORDER BY net_settled_revenue_usd DESC;`,
      `-- Dataset: org_hr | Department Budget Utilization & Headcount Aggregation
SELECT
  d.dept_id,
  d.name AS department_name,
  d.cost_center,
  COUNT(e.emp_id) AS headcount,
  SUM(e.salary_usd) AS active_payroll_usd,
  d.annual_budget_usd,
  ROUND((SUM(e.salary_usd) * 100.0) / d.annual_budget_usd, 1) AS budget_used_pct
FROM departments AS d
LEFT JOIN employees AS e
  ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.name, d.cost_center, d.annual_budget_usd
HAVING COUNT(e.emp_id) >= 1
ORDER BY active_payroll_usd DESC;`
    ];
    return aggQueries[uIdx % aggQueries.length];
  }

  if (modNum === 5) {
    const cteQueries = [
      `-- Dataset: org_hr | WITH RECURSIVE Hierarchy Traversal & Chain-of-Command Depth
WITH RECURSIVE org_hierarchy AS (
  SELECT
    emp_id,
    name,
    title,
    manager_id,
    dept_id,
    salary_usd,
    0 AS hierarchy_level,
    name AS reporting_chain
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT
    e.emp_id,
    e.name,
    e.title,
    e.manager_id,
    e.dept_id,
    e.salary_usd,
    h.hierarchy_level + 1 AS hierarchy_level,
    h.reporting_chain || ' -> ' || e.name AS reporting_chain
  FROM employees AS e
  INNER JOIN org_hierarchy AS h
    ON e.manager_id = h.emp_id
  WHERE h.hierarchy_level < 6
)
SELECT
  emp_id,
  name,
  title,
  hierarchy_level,
  salary_usd,
  reporting_chain
FROM org_hierarchy
ORDER BY hierarchy_level ASC, salary_usd DESC;`,
      `-- Dataset: org_hr | Multi-CTE Departmental Salary Benchmark vs Peer Average
WITH dept_benchmarks AS (
  SELECT
    dept_id,
    ROUND(AVG(salary_usd), 0) AS avg_dept_salary,
    MAX(salary_usd) AS max_dept_salary
  FROM employees
  GROUP BY dept_id
)
SELECT
  e.emp_id,
  e.name AS employee_name,
  e.title,
  e.salary_usd,
  b.avg_dept_salary,
  (e.salary_usd - b.avg_dept_salary) AS variance_vs_dept_avg
FROM employees AS e
INNER JOIN dept_benchmarks AS b
  ON b.dept_id = e.dept_id
WHERE e.salary_usd >= b.avg_dept_salary
ORDER BY variance_vs_dept_avg DESC;`
    ];
    return cteQueries[uIdx % cteQueries.length];
  }

  if (modNum === 6) {
    const winQueries = [
      `-- Dataset: org_hr | Window Functions: Departmental Ranking, Peer Deltas & Running Totals
SELECT
  d.name AS dept_name,
  e.name AS employee_name,
  e.title,
  e.salary_usd,
  DENSE_RANK() OVER (
    PARTITION BY e.dept_id
    ORDER BY e.salary_usd DESC
  ) AS dept_salary_rank,
  LAG(e.salary_usd, 1, e.salary_usd) OVER (
    PARTITION BY e.dept_id
    ORDER BY e.salary_usd DESC
  ) - e.salary_usd AS gap_to_higher_peer_usd,
  SUM(e.salary_usd) OVER (
    PARTITION BY e.dept_id
    ORDER BY e.hired_at ASC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_dept_payroll_usd
FROM employees AS e
INNER JOIN departments AS d
  ON d.dept_id = e.dept_id
ORDER BY d.name ASC, dept_salary_rank ASC;`,
      `-- Dataset: fintech_ledger | Sliding Window Card Velocity & Rolling 3-Txn Spend
SELECT
  txn_id,
  card_id,
  merchant,
  country,
  ROUND(amount_cents / 100.0, 2) AS amount_usd,
  txn_ts,
  COUNT(*) OVER (
    PARTITION BY card_id
    ORDER BY txn_ts ASC
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS window_txn_count,
  ROUND(
    SUM(amount_cents) OVER (
      PARTITION BY card_id
      ORDER BY txn_ts ASC
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) / 100.0,
    2
  ) AS rolling_3txn_usd
FROM merchant_txns
ORDER BY card_id ASC, txn_ts ASC;`
    ];
    return winQueries[uIdx % winQueries.length];
  }

  if (modNum === 7) {
    return `-- Dataset: ecommerce | Functional Dependency & 3NF/BCNF Normalization Verification
SELECT
  o.order_id,
  o.customer_id,
  c.email AS canonical_customer_email,
  COUNT(oi.order_item_id) AS distinct_line_items,
  SUM(oi.quantity * oi.unit_price_cents) AS computed_line_total_cents,
  o.total_cents AS header_total_cents,
  CASE
    WHEN SUM(oi.quantity * oi.unit_price_cents) = o.total_cents THEN 'NORMALIZED_CONSISTENT'
    ELSE 'PROMO_OR_ADJUSTMENT_DELTA'
  END AS normalization_audit
FROM orders AS o
INNER JOIN customers AS c
  ON c.customer_id = o.customer_id
INNER JOIN order_items AS oi
  ON oi.order_id = o.order_id
GROUP BY o.order_id, o.customer_id, c.email, o.total_cents
ORDER BY o.order_id ASC;`;
  }

  if (modNum === 8) {
    return `-- Dataset: org_hr | SCD Type 2 Effective-Date Compensation History & Raise Deltas
SELECT
  e.name AS employee_name,
  e.title,
  sh.old_salary_usd,
  sh.new_salary_usd,
  (sh.new_salary_usd - sh.old_salary_usd) AS raise_delta_usd,
  ROUND(((sh.new_salary_usd - sh.old_salary_usd) * 100.0) / sh.old_salary_usd, 1) AS raise_pct,
  sh.effective_date
FROM salary_history AS sh
INNER JOIN employees AS e
  ON e.emp_id = sh.emp_id
ORDER BY sh.effective_date ASC, raise_delta_usd DESC;`;
  }

  if (modNum === 9) {
    return `-- Dataset: saas_telemetry | Multi-Step Ordered Funnel & Cohort Conversion Analysis
WITH user_funnel AS (
  SELECT
    user_id,
    MAX(CASE WHEN event_type = 'signup' THEN 1 ELSE 0 END) AS step1_signup,
    MAX(CASE WHEN event_type = 'schema_connect' THEN 1 ELSE 0 END) AS step2_connect,
    MAX(CASE WHEN event_type = 'query_run' THEN 1 ELSE 0 END) AS step3_query,
    MAX(CASE WHEN event_type = 'upgrade_pro' THEN 1 ELSE 0 END) AS step4_upgrade
  FROM user_events
  GROUP BY user_id
)
SELECT
  u.plan_tier,
  COUNT(u.user_id) AS cohort_orgs,
  SUM(uf.step1_signup) AS signed_up,
  SUM(uf.step2_connect) AS connected_schema,
  SUM(uf.step3_query) AS executed_query,
  SUM(uf.step4_upgrade) AS upgraded_pro
FROM saas_users AS u
INNER JOIN user_funnel AS uf
  ON uf.user_id = u.user_id
GROUP BY u.plan_tier
ORDER BY cohort_orgs DESC;`;
  }

  if (modNum === 10 || modNum === 11 || modNum === 12 || modNum === 18) {
    const perfQueries = [
      `-- Dataset: ecommerce | Composite Index Seek (idx_orders_customer_status) & SARGable Plan
SELECT
  o.order_id,
  o.customer_id,
  c.name AS customer_name,
  o.status,
  o.created_at,
  ROUND(o.total_cents / 100.0, 2) AS total_usd
FROM orders AS o
INNER JOIN customers AS c
  ON c.customer_id = o.customer_id
WHERE o.status = 'completed'
  AND o.created_at >= '2025-02-01'
ORDER BY o.created_at DESC, o.order_id DESC
LIMIT 10;`,
      `-- Dataset: ecommerce | Covering Category-Price Index Scan (idx_products_category_price)
SELECT
  p.category_id,
  cat.name AS category_name,
  p.product_id,
  p.sku,
  p.name AS product_name,
  ROUND(p.price_cents / 100.0, 2) AS price_usd
FROM products AS p
INNER JOIN categories AS cat
  ON cat.category_id = p.category_id
WHERE p.category_id IN (20, 30, 40)
  AND p.price_cents >= 10000
ORDER BY p.category_id ASC, p.price_cents DESC;`
    ];
    return perfQueries[uIdx % perfQueries.length];
  }

  if (modNum === 13 || modNum === 14 || modNum === 15) {
    return `-- Dataset: fintech_ledger | Double-Entry ACID Invariant & Ledger Conservation Audit
SELECT
  t.transfer_id,
  t.idempotency_key,
  t.status,
  COUNT(je.entry_id) AS journal_legs,
  SUM(CASE WHEN je.direction = 'debit' THEN je.amount_cents ELSE 0 END) AS total_debit_cents,
  SUM(CASE WHEN je.direction = 'credit' THEN je.amount_cents ELSE 0 END) AS total_credit_cents,
  SUM(CASE WHEN je.direction = 'credit' THEN je.amount_cents ELSE -je.amount_cents END) AS net_balance_cents
FROM transfers AS t
INNER JOIN journal_entries AS je
  ON je.transfer_id = t.transfer_id
GROUP BY t.transfer_id, t.idempotency_key, t.status
ORDER BY t.transfer_id ASC;`;
  }

  return `-- Dataset: saas_telemetry | Analytical Telemetry Aggregation & Event Latency Profile
SELECT
  u.plan_tier,
  e.event_type,
  COUNT(*) AS event_count,
  ROUND(AVG(e.latency_ms), 2) AS avg_latency_ms,
  MAX(e.latency_ms) AS max_latency_ms,
  MIN(e.latency_ms) AS min_latency_ms
FROM user_events AS e
INNER JOIN saas_users AS u
  ON u.user_id = e.user_id
GROUP BY u.plan_tier, e.event_type
ORDER BY event_count DESC, avg_latency_ms DESC;`;
}

function buildUnitVerificationSqlSnippet(modId, uIdx, slug, title) {
  const primarySql = buildUnitSqlSnippet(modId, uIdx, slug, title);
  const dsMatch = primarySql.match(/Dataset:\s*([a-z_]+)/i);
  const datasetId = dsMatch ? dsMatch[1] : 'ecommerce';

  if (datasetId === 'org_hr') {
    return `-- Dataset: org_hr | Live Verification & Departmental Window Audit (${slug})
WITH dept_rollup AS (
  SELECT
    d.dept_id,
    d.name AS dept_name,
    COUNT(e.emp_id) AS staff_count,
    ROUND(AVG(e.salary_usd), 0) AS avg_salary_usd,
    MAX(e.salary_usd) AS top_salary_usd,
    SUM(e.salary_usd) AS total_payroll_usd,
    d.annual_budget_usd
  FROM departments AS d
  LEFT JOIN employees AS e
    ON e.dept_id = d.dept_id
  GROUP BY d.dept_id, d.name, d.annual_budget_usd
)
SELECT
  dept_id,
  dept_name,
  staff_count,
  avg_salary_usd,
  top_salary_usd,
  total_payroll_usd,
  ROUND((total_payroll_usd * 100.0) / annual_budget_usd, 1) AS budget_utilization_pct
FROM dept_rollup
WHERE staff_count >= 1
ORDER BY total_payroll_usd DESC;`;
  }

  if (datasetId === 'fintech_ledger') {
    return `-- Dataset: fintech_ledger | Double-Entry Conservation & Account Audit (${slug})
SELECT
  a.account_id,
  a.owner_name,
  a.account_type,
  COUNT(je.entry_id) AS journal_postings,
  SUM(CASE WHEN je.direction = 'credit' THEN je.amount_cents ELSE 0 END) AS credit_cents,
  SUM(CASE WHEN je.direction = 'debit' THEN je.amount_cents ELSE 0 END) AS debit_cents,
  SUM(CASE WHEN je.direction = 'credit' THEN je.amount_cents ELSE -je.amount_cents END) AS computed_balance_cents,
  a.posted_balance_cents
FROM accounts AS a
INNER JOIN journal_entries AS je
  ON je.account_id = a.account_id
GROUP BY a.account_id, a.owner_name, a.account_type, a.posted_balance_cents
ORDER BY a.account_id ASC;`;
  }

  if (datasetId === 'saas_telemetry') {
    return `-- Dataset: saas_telemetry | Cohort Retention, MRR & Event Latency Verification (${slug})
SELECT
  u.user_id,
  u.org_name,
  u.plan_tier,
  COALESCE(s.mrr_usd, 0) AS active_mrr_usd,
  COUNT(e.event_id) AS total_events,
  ROUND(AVG(e.latency_ms), 1) AS avg_event_latency_ms,
  MAX(e.event_ts) AS last_seen_ts
FROM saas_users AS u
LEFT JOIN subscriptions AS s
  ON s.user_id = u.user_id AND s.status = 'active'
LEFT JOIN user_events AS e
  ON e.user_id = u.user_id
GROUP BY u.user_id, u.org_name, u.plan_tier, s.mrr_usd
ORDER BY active_mrr_usd DESC, total_events DESC;`;
  }

  return `-- Dataset: ecommerce | Live Verification, 3VL Guard & SARGable Plan Audit (${slug})
SELECT
  c.customer_id,
  c.name AS customer_name,
  c.tier,
  c.country,
  COUNT(o.order_id) AS completed_orders,
  ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS verified_spend_usd,
  ROUND(
    AVG(COALESCE(SUM(o.total_cents), 0)) OVER (PARTITION BY c.tier) / 100.0,
    2
  ) AS tier_peer_avg_spend_usd
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
  AND o.status = 'completed'
GROUP BY c.customer_id, c.name, c.tier, c.country
ORDER BY verified_spend_usd DESC, c.customer_id ASC;`;
}

function escapeXml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Generates an authentic Database Table & Storage Engine Visual Diagram (SVG)
 * tailored to the module's relational/storage domain:
 *  - m01..m03, m07: Relational Table Schema & Join Tuple Pairing Diagram (customers ⋈ orders with PK/FK badges & rows)
 *  - m04..m06, m08..m09: Partitioned Group Bucket & Sliding Window Frame Table Diagram
 *  - m10..m12, m18: B+Tree Multi-Level Index Page -> Heap Tuple Pointer Diagram
 *  - m13..m17: 8KB Slotted Page Layout, MVCC Tuple Header (xmin/xmax/ctid) & WAL LSN Diagram
 */
function buildUnitSvgDiagram(modId, uIdx, slug, title, tags) {
  const modNum = parseInt(modId.replace('m', ''), 10);
  const shortTitle = escapeXml(title.length > 54 ? title.slice(0, 51) + '...' : title);
  const t0 = escapeXml((tags && tags[0]) ? tags[0] : 'relation');
  const t1 = escapeXml((tags && tags[1]) ? tags[1] : 'predicate');

  // Archetype A: Relational Table Grids with PK/FK Join Pointers (Modules 1, 2, 3, 7)
  if ([1, 2, 3, 7].includes(modNum)) {
    return `<svg class="concept-diagram" viewBox="0 0 760 250" width="100%" height="250" role="img" aria-label="Database Table Schema and Tuple Flow Diagram for ${shortTitle}" style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:10px;margin:1.25rem 0;">
  <defs>
    <marker id="fk-arrow-${slug}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1"/>
    </marker>
  </defs>
  <text x="20" y="26" fill="var(--fg-primary)" font-family="var(--font-mono)" font-size="12" font-weight="700">${shortTitle} — Relational Table &amp; Key Constraint Diagram</text>
  <text x="20" y="42" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="10">Module ${modId.toUpperCase()} · PK/FK Referential Join · 3VL Predicate Selection (${t0} / ${t1})</text>

  <!-- Left Table: customers -->
  <rect x="20" y="56" width="235" height="172" rx="6" fill="#09090b" stroke="#3b82f6" stroke-width="1.5"/>
  <rect x="20" y="56" width="235" height="26" rx="6" fill="rgba(59,130,246,0.18)"/>
  <text x="30" y="73" fill="#93c5fd" font-family="var(--font-mono)" font-size="11" font-weight="700">TABLE customers (Parent)</text>
  <line x1="20" y1="104" x2="255" y2="104" stroke="#27272a" stroke-width="1"/>
  <text x="28" y="97" fill="#fbbf24" font-family="var(--font-mono)" font-size="9.5" font-weight="700">PK customer_id</text>
  <text x="122" y="97" fill="#a1a1aa" font-family="var(--font-mono)" font-size="9.5">name</text>
  <text x="205" y="97" fill="#a1a1aa" font-family="var(--font-mono)" font-size="9.5">tier</text>

  <rect x="24" y="110" width="227" height="24" rx="3" fill="rgba(16,185,129,0.12)"/>
  <text x="30" y="126" fill="#d1fae5" font-family="var(--font-mono)" font-size="10">1             Aravind   ent</text>
  <rect x="24" y="138" width="227" height="24" rx="3" fill="rgba(16,185,129,0.12)"/>
  <text x="30" y="154" fill="#d1fae5" font-family="var(--font-mono)" font-size="10">2             Elena     pro</text>
  <rect x="24" y="166" width="227" height="24" rx="3" fill="rgba(59,130,246,0.10)"/>
  <text x="30" y="182" fill="#bfdbfe" font-family="var(--font-mono)" font-size="10">7             Chloe     std</text>
  <text x="30" y="212" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">UNIQUE(email) · NOT NULL</text>

  <!-- FK Join Connector Lines -->
  <path d="M 255 122 C 278 122, 278 122, 300 122" fill="none" stroke="#6366f1" stroke-width="1.8" marker-end="url(#fk-arrow-${slug})"/>
  <path d="M 255 150 C 278 150, 278 150, 300 150" fill="none" stroke="#6366f1" stroke-width="1.8" marker-end="url(#fk-arrow-${slug})"/>

  <!-- Middle Table: orders -->
  <rect x="302" y="56" width="235" height="172" rx="6" fill="#09090b" stroke="#6366f1" stroke-width="1.5"/>
  <rect x="302" y="56" width="235" height="26" rx="6" fill="rgba(99,102,241,0.18)"/>
  <text x="312" y="73" fill="#c7d2fe" font-family="var(--font-mono)" font-size="11" font-weight="700">TABLE orders (Child FK)</text>
  <line x1="302" y1="104" x2="537" y2="104" stroke="#27272a" stroke-width="1"/>
  <text x="310" y="97" fill="#fbbf24" font-family="var(--font-mono)" font-size="9.5" font-weight="700">PK order_id</text>
  <text x="386" y="97" fill="#60a5fa" font-family="var(--font-mono)" font-size="9.5" font-weight="700">FK cust_id</text>
  <text x="458" y="97" fill="#a1a1aa" font-family="var(--font-mono)" font-size="9.5">total_cents</text>

  <rect x="306" y="110" width="227" height="24" rx="3" fill="rgba(16,185,129,0.12)"/>
  <text x="312" y="126" fill="#d1fae5" font-family="var(--font-mono)" font-size="10">1001        1          105000</text>
  <rect x="306" y="138" width="227" height="24" rx="3" fill="rgba(16,185,129,0.12)"/>
  <text x="312" y="154" fill="#d1fae5" font-family="var(--font-mono)" font-size="10">1002        2          42000</text>
  <rect x="306" y="166" width="227" height="24" rx="3" fill="rgba(239,68,68,0.10)"/>
  <text x="312" y="182" fill="#fca5a5" font-family="var(--font-mono)" font-size="10">1005        4          21000 (filtered)</text>
  <text x="312" y="212" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">ON cust_id = c.customer_id</text>

  <path d="M 537 136 L 568 136" fill="none" stroke="#10b981" stroke-width="1.8" marker-end="url(#fk-arrow-${slug})"/>

  <!-- Right Projected Relation -->
  <rect x="570" y="56" width="170" height="172" rx="6" fill="#09090b" stroke="#10b981" stroke-width="1.5"/>
  <rect x="570" y="56" width="170" height="26" rx="6" fill="rgba(16,185,129,0.18)"/>
  <text x="580" y="73" fill="#6ee7b7" font-family="var(--font-mono)" font-size="11" font-weight="700">PROJECTED OUTPUT</text>
  <line x1="570" y1="104" x2="740" y2="104" stroke="#27272a" stroke-width="1"/>
  <text x="578" y="97" fill="#a1a1aa" font-family="var(--font-mono)" font-size="9.5">name      order  usd</text>
  <rect x="574" y="110" width="162" height="24" rx="3" fill="rgba(16,185,129,0.15)"/>
  <text x="580" y="126" fill="#ecfdf5" font-family="var(--font-mono)" font-size="10">Aravind   1001   $1050</text>
  <rect x="574" y="138" width="162" height="24" rx="3" fill="rgba(16,185,129,0.15)"/>
  <text x="580" y="154" fill="#ecfdf5" font-family="var(--font-mono)" font-size="10">Elena     1002   $420</text>
  <rect x="574" y="166" width="162" height="24" rx="3" fill="rgba(245,158,11,0.15)"/>
  <text x="580" y="182" fill="#fde68a" font-family="var(--font-mono)" font-size="10">Chloe     NULL   $0.00</text>
  <text x="580" y="212" fill="#fbbf24" font-family="var(--font-mono)" font-size="9.5">3VL NULL-Safe Output</text>
</svg>`;
  }

  // Archetype B: Window Frame & Group Bucket Table Visualizer (Modules 4, 5, 6, 8, 9)
  if ([4, 5, 6, 8, 9].includes(modNum)) {
    return `<svg class="concept-diagram" viewBox="0 0 760 250" width="100%" height="250" role="img" aria-label="Window Partition and Group Bucket Table Diagram for ${shortTitle}" style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:10px;margin:1.25rem 0;">
  <text x="20" y="26" fill="var(--fg-primary)" font-family="var(--font-mono)" font-size="12" font-weight="700">${shortTitle} — Partitioned Table &amp; Sliding Window Frame</text>
  <text x="20" y="42" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="10">Module ${modId.toUpperCase()} · PARTITION BY dept_id ORDER BY salary_usd DESC · Frame Overlay (${t0})</text>

  <!-- Partition Table Box -->
  <rect x="20" y="56" width="465" height="174" rx="6" fill="#09090b" stroke="#6366f1" stroke-width="1.5"/>
  <rect x="20" y="56" width="465" height="26" rx="6" fill="rgba(99,102,241,0.18)"/>
  <text x="32" y="73" fill="#c7d2fe" font-family="var(--font-mono)" font-size="11" font-weight="700">TABLE employees (Partitioned Tuple Stream)</text>
  <text x="32" y="96" fill="#fbbf24" font-family="var(--font-mono)" font-size="9.5" font-weight="700">PK emp_id</text>
  <text x="105" y="96" fill="#60a5fa" font-family="var(--font-mono)" font-size="9.5" font-weight="700">dept_id</text>
  <text x="170" y="96" fill="#a1a1aa" font-family="var(--font-mono)" font-size="9.5">name</text>
  <text x="295" y="96" fill="#a1a1aa" font-family="var(--font-mono)" font-size="9.5">salary_usd</text>
  <text x="385" y="96" fill="#34d399" font-family="var(--font-mono)" font-size="9.5" font-weight="700">RANK / SUM OVER</text>
  <line x1="20" y1="103" x2="485" y2="103" stroke="#27272a" stroke-width="1"/>

  <!-- Partition 2 Rows + Sliding Window Frame Box -->
  <rect x="26" y="108" width="453" height="74" rx="4" fill="rgba(99,102,241,0.08)" stroke="#818cf8" stroke-dasharray="4 2" stroke-width="1.2"/>
  <text x="34" y="125" fill="#e0e7ff" font-family="var(--font-mono)" font-size="10">2         2 (Storage)  Vikramaditya    $255,000     #1 · $255k</text>
  <rect x="30" y="131" width="445" height="22" rx="3" fill="rgba(245,158,11,0.18)"/>
  <text x="34" y="146" fill="#fef3c7" font-family="var(--font-mono)" font-size="10">4         2 (Storage)  Mateo Silva     $215,000     #2 · $470k [CURRENT ROW]</text>
  <text x="34" y="170" fill="#e0e7ff" font-family="var(--font-mono)" font-size="10">5         2 (Storage)  Aisha Patel     $198,000     #3 · $668k</text>

  <!-- Partition 3 Row -->
  <rect x="26" y="188" width="453" height="28" rx="4" fill="rgba(16,185,129,0.10)" stroke="#10b981" stroke-width="1"/>
  <text x="34" y="206" fill="#d1fae5" font-family="var(--font-mono)" font-size="10">3         3 (Planner)  Hannah L.       $250,000     #1 · $250k (New Partition)</text>

  <!-- Right Frame State Explanation Box -->
  <rect x="505" y="56" width="235" height="174" rx="6" fill="#09090b" stroke="#10b981" stroke-width="1.5"/>
  <rect x="505" y="56" width="235" height="26" rx="6" fill="rgba(16,185,129,0.18)"/>
  <text x="517" y="73" fill="#6ee7b7" font-family="var(--font-mono)" font-size="11" font-weight="700">WINDOW FRAME INVARIANTS</text>
  <text x="517" y="102" fill="#e4e4e7" font-family="var(--font-mono)" font-size="10">• Preserves all N input tuples</text>
  <text x="517" y="124" fill="#fbbf24" font-family="var(--font-mono)" font-size="10">• Frame: UNBOUNDED PRECEDING</text>
  <text x="517" y="142" fill="#fbbf24" font-family="var(--font-mono)" font-size="10">  AND CURRENT ROW</text>
  <text x="517" y="166" fill="#93c5fd" font-family="var(--font-mono)" font-size="10">• Peer ties handled by</text>
  <text x="517" y="184" fill="#93c5fd" font-family="var(--font-mono)" font-size="10">  ROWS vs RANGE vs GROUPS</text>
  <text x="517" y="212" fill="#34d399" font-family="var(--font-mono)" font-size="10">• Evaluated at Step 5 (pre-SELECT)</text>
</svg>`;
  }

  // Archetype C: B+Tree Multi-Level Index & Query Plan Access Path (Modules 10, 11, 12, 18)
  if ([10, 11, 12, 18].includes(modNum)) {
    return `<svg class="concept-diagram" viewBox="0 0 760 250" width="100%" height="250" role="img" aria-label="B+Tree Index Page Hierarchy and Heap Tuple Lookup Diagram for ${shortTitle}" style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:10px;margin:1.25rem 0;">
  <defs>
    <marker id="btree-ptr-${slug}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981"/>
    </marker>
  </defs>
  <text x="20" y="26" fill="var(--fg-primary)" font-family="var(--font-mono)" font-size="12" font-weight="700">${shortTitle} — B+Tree Index Seek &amp; Heap Page Fetch</text>
  <text x="20" y="42" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="10">Module ${modId.toUpperCase()} · idx_orders_customer_status (customer_id, status) · O(log_B N) Traversal</text>

  <!-- Root Page -->
  <rect x="155" y="54" width="210" height="42" rx="6" fill="rgba(59,130,246,0.14)" stroke="#3b82f6" stroke-width="1.5"/>
  <text x="167" y="71" fill="#93c5fd" font-family="var(--font-mono)" font-size="10" font-weight="700">ROOT PAGE #01 (Internal Directory)</text>
  <text x="167" y="87" fill="#e4e4e7" font-family="var(--font-mono)" font-size="10">[ cust_id &lt; 3 ]  |  [ cust_id &gt;= 3 ]</text>

  <line x1="210" y1="96" x2="135" y2="128" stroke="#10b981" stroke-width="1.8" marker-end="url(#btree-ptr-${slug})"/>
  <line x1="310" y1="96" x2="365" y2="128" stroke="#52525b" stroke-width="1.3" stroke-dasharray="3 3"/>

  <!-- Leaf Page 1 (Matched) -->
  <rect x="20" y="132" width="230" height="96" rx="6" fill="rgba(16,185,129,0.12)" stroke="#10b981" stroke-width="1.5"/>
  <text x="30" y="150" fill="#6ee7b7" font-family="var(--font-mono)" font-size="10" font-weight="700">LEAF PAGE #14 (Doubly-Linked)</text>
  <text x="30" y="168" fill="#d1fae5" font-family="var(--font-mono)" font-size="9.5">(1, 'completed') -&gt; ctid(0,1)</text>
  <text x="30" y="184" fill="#d1fae5" font-family="var(--font-mono)" font-size="9.5">(1, 'completed') -&gt; ctid(0,3)</text>
  <text x="30" y="200" fill="#fde68a" font-family="var(--font-mono)" font-size="9.5">(2, 'completed') -&gt; ctid(0,2)</text>
  <text x="30" y="218" fill="#93c5fd" font-family="var(--font-mono)" font-size="9">next_leaf_page = #15 ───►</text>

  <!-- Leaf Page 2 -->
  <rect x="275" y="132" width="205" height="96" rx="6" fill="#09090b" stroke="#3f3f46" stroke-width="1.2"/>
  <text x="285" y="150" fill="#a1a1aa" font-family="var(--font-mono)" font-size="10" font-weight="700">LEAF PAGE #15 (Sibling)</text>
  <text x="285" y="168" fill="#71717a" font-family="var(--font-mono)" font-size="9.5">(3, 'completed') -&gt; ctid(0,4)</text>
  <text x="285" y="184" fill="#71717a" font-family="var(--font-mono)" font-size="9.5">(3, 'refunded')  -&gt; ctid(0,9)</text>
  <text x="285" y="200" fill="#71717a" font-family="var(--font-mono)" font-size="9.5">(5, 'completed') -&gt; ctid(0,6)</text>

  <path d="M 250 172 C 490 110, 500 110, 520 115" fill="none" stroke="#10b981" stroke-width="1.8" marker-end="url(#btree-ptr-${slug})"/>

  <!-- Heap Table Page -->
  <rect x="524" y="64" width="216" height="164" rx="6" fill="#09090b" stroke="#f59e0b" stroke-width="1.5"/>
  <rect x="524" y="64" width="216" height="26" rx="6" fill="rgba(245,158,11,0.18)"/>
  <text x="534" y="81" fill="#fcd34d" font-family="var(--font-mono)" font-size="10.5" font-weight="700">8KB HEAP PAGE #0 (orders)</text>
  <rect x="532" y="98" width="200" height="26" rx="3" fill="rgba(16,185,129,0.16)"/>
  <text x="538" y="115" fill="#d1fae5" font-family="var(--font-mono)" font-size="9.5">ctid(0,1): id=1001 | $1050.00</text>
  <rect x="532" y="130" width="200" height="26" rx="3" fill="rgba(16,185,129,0.16)"/>
  <text x="538" y="147" fill="#d1fae5" font-family="var(--font-mono)" font-size="9.5">ctid(0,2): id=1002 | $420.00</text>
  <rect x="532" y="162" width="200" height="26" rx="3" fill="rgba(16,185,129,0.16)"/>
  <text x="538" y="179" fill="#d1fae5" font-family="var(--font-mono)" font-size="9.5">ctid(0,3): id=1003 | $950.00</text>
  <text x="536" y="212" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">Visibility Map = 1 (Index-Only OK)</text>
</svg>`;
  }

  // Archetype D: 8KB Slotted Page, MVCC Tuple Versions & WAL Log Sequence (Modules 13, 14, 15, 16, 17)
  return `<svg class="concept-diagram" viewBox="0 0 760 250" width="100%" height="250" role="img" aria-label="8KB Slotted Page and MVCC Tuple Versioning Diagram for ${shortTitle}" style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:10px;margin:1.25rem 0;">
  <text x="20" y="26" fill="var(--fg-primary)" font-family="var(--font-mono)" font-size="12" font-weight="700">${shortTitle} — 8KB Slotted Page &amp; MVCC Tuple Versioning</text>
  <text x="20" y="42" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="10">Module ${modId.toUpperCase()} · PageHeader (pd_lsn) · Line Pointer Array (ItemId) · MVCC Tuple (xmin / xmax)</text>

  <!-- 8KB Slotted Page Layout -->
  <rect x="20" y="56" width="450" height="174" rx="6" fill="#09090b" stroke="#3b82f6" stroke-width="1.5"/>
  <rect x="20" y="56" width="450" height="28" rx="6" fill="rgba(59,130,246,0.18)"/>
  <text x="30" y="74" fill="#93c5fd" font-family="var(--font-mono)" font-size="10.5" font-weight="700">8192-BYTE SLOTTED PAGE · pd_lsn=0/1A8F40 · pd_lower=44 · pd_upper=7820</text>

  <!-- Line Pointers -->
  <rect x="30" y="94" width="95" height="24" rx="3" fill="rgba(99,102,241,0.2)" stroke="#6366f1"/>
  <text x="36" y="110" fill="#c7d2fe" font-family="var(--font-mono)" font-size="9.5">lp[1] -&gt; 8096</text>
  <rect x="132" y="94" width="95" height="24" rx="3" fill="rgba(16,185,129,0.2)" stroke="#10b981"/>
  <text x="138" y="110" fill="#a7f3d0" font-family="var(--font-mono)" font-size="9.5">lp[2] -&gt; 7960</text>
  <rect x="234" y="94" width="95" height="24" rx="3" fill="rgba(245,158,11,0.2)" stroke="#f59e0b"/>
  <text x="240" y="110" fill="#fde68a" font-family="var(--font-mono)" font-size="9.5">lp[3] -&gt; 7820</text>
  <text x="340" y="110" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">──► pd_lower</text>

  <!-- Free Space -->
  <rect x="30" y="124" width="430" height="26" rx="3" fill="rgba(255,255,255,0.02)" stroke="#27272a" stroke-dasharray="4 4"/>
  <text x="165" y="141" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">UNALLOCATED FREE SPACE (7776 bytes)</text>

  <!-- MVCC Tuples at Bottom of Page -->
  <rect x="30" y="158" width="430" height="28" rx="3" fill="rgba(239,68,68,0.12)" stroke="#ef4444"/>
  <text x="38" y="176" fill="#fca5a5" font-family="var(--font-mono)" font-size="9.5">Tuple v1 (ctid 0,1): xmin=501 xmax=509 [DEAD] | acct=101 | bal=475000</text>
  <rect x="30" y="192" width="430" height="28" rx="3" fill="rgba(16,185,129,0.16)" stroke="#10b981"/>
  <text x="38" y="210" fill="#d1fae5" font-family="var(--font-mono)" font-size="9.5">Tuple v2 (ctid 0,2): xmin=509 xmax=0   [LIVE] | acct=101 | bal=415000</text>

  <!-- Right WAL & Snapshot Visibility Panel -->
  <rect x="490" y="56" width="250" height="174" rx="6" fill="#09090b" stroke="#f59e0b" stroke-width="1.5"/>
  <rect x="490" y="56" width="250" height="28" rx="6" fill="rgba(245,158,11,0.18)"/>
  <text x="502" y="74" fill="#fde68a" font-family="var(--font-mono)" font-size="10.5" font-weight="700">MVCC SNAPSHOT &amp; WAL INVARIANT</text>
  <text x="502" y="102" fill="#e4e4e7" font-family="var(--font-mono)" font-size="10">• Snapshot xmin=505, xmax=512</text>
  <text x="502" y="124" fill="#34d399" font-family="var(--font-mono)" font-size="10">• Readers never block Writers</text>
  <text x="502" y="146" fill="#93c5fd" font-family="var(--font-mono)" font-size="10">• WAL Rule: Flush LSN &gt;= pd_lsn</text>
  <text x="502" y="166" fill="#93c5fd" font-family="var(--font-mono)" font-size="10">  before dirty page eviction</text>
  <text x="502" y="190" fill="#fbbf24" font-family="var(--font-mono)" font-size="10">• VACUUM reclaims dead v1 tuple</text>
  <text x="502" y="210" fill="#fbbf24" font-family="var(--font-mono)" font-size="10">  when OldestXmin &gt; 509</text>
</svg>`;
}

function buildUnitMermaid(modId, uIdx, slug, title, tags) {
  const modNum = parseInt(modId.replace('m', ''), 10);
  const t0 = (tags && tags[0]) ? tags[0].replace(/["[\]]/g, '') : 'relation';
  const t1 = (tags && tags[1]) ? tags[1].replace(/["[\]]/g, '') : 'operator';
  const t2 = (tags && tags[2]) ? tags[2].replace(/["[\]]/g, '') : 'output';

  if ([1, 2, 3, 7, 8].includes(modNum)) {
    return `<div class="mermaid">
erDiagram
  CUSTOMERS ||--o{ ORDERS : "places (customer_id)"
  ORDERS ||--|{ ORDER_ITEMS : "contains (order_id)"
  PRODUCTS ||--o{ ORDER_ITEMS : "referenced_by (product_id)"
  CUSTOMERS {
    int customer_id PK
    text email UK
    text name
    text tier
    text country
  }
  ORDERS {
    int order_id PK
    int customer_id FK
    text status
    int total_cents
    text discount_code
  }
  ORDER_ITEMS {
    int order_item_id PK
    int order_id FK
    int product_id FK
    int quantity
    int unit_price_cents
  }
</div>`;
  }

  if ([13, 14, 15, 17].includes(modNum)) {
    return `<div class="mermaid">
sequenceDiagram
  autonumber
  participant App as Client / Txn
  participant Exec as SQL Executor (${t0})
  participant Buf as Buffer Pool & MVCC
  participant WAL as Write-Ahead Log (fsync)
  App->>Exec: BEGIN; Statement (${t1})
  Exec->>Buf: Acquire Snapshot (xmin/xmax) & Pin 8KB Page
  Buf->>WAL: Append Redo Record (LSN)
  WAL-->>Buf: fdatasync(WAL) Confirmed
  Buf-->>Exec: Commit Tuple & Release Locks (${t2})
  Exec-->>App: Return Verified Result Set
</div>`;
  }

  return `<div class="mermaid">
flowchart LR
  A["1. FROM / JOIN (${t0})"] --> B["2. WHERE / 3VL Filter (${t1})"]
  B --> C["3. GROUP BY / WINDOW OVER"]
  C --> D["4. SELECT Projection & ORDER BY (${t2})"]
</div>`;
}

function generateUnitContent(mod, unit, globalIdx, uIdx) {
  const slug = unit.slug;
  const title = unit.title;
  const excerpt = unit.archive?.excerpt || title;
  const tags = unit.archive?.tags || ['sql', 'relational', 'database'];
  const modVids = MODULE_VIDEOS[mod.id] || MODULE_VIDEOS.m01;
  const vid = modVids[uIdx % modVids.length];
  const altVid = modVids[(uIdx + 1) % modVids.length];

  const sqlSnippet = buildUnitSqlSnippet(mod.id, uIdx, slug, title);
  const verificationSqlSnippet = buildUnitVerificationSqlSnippet(mod.id, uIdx, slug, title);
  const svgDiagram = buildUnitSvgDiagram(mod.id, uIdx, slug, title, tags);
  const mermaidBlock = buildUnitMermaid(mod.id, uIdx, slug, title, tags);

  const intuition = `<p>In <strong>${title}</strong> (<code>${slug}</code>), ${excerpt} When application engineers treat SQL as an opaque string generator rather than a formal relational algebra and physical storage contract, subtle edge cases—such as Three-Valued <code>NULL</code> semantics, non-SARGable predicates, join fanouts, or unindexed heap scans—turn millisecond queries into multi-minute production outages.</p><p>By grounding <strong>${title}</strong> in both Codd's relational calculus and physical 8KB page mechanics, you can predict exact row cardinalities, inspect <code>EXPLAIN QUERY PLAN</code> operator trees before shipping, and guarantee correctness under high-concurrency production workloads.</p>`;

  const content = `<div class="lesson-content">
<h2>1. First-Principles Mental Model &amp; Relational Mechanics</h2>
<p>Every SQL statement in <strong>${title}</strong> compiles down to a deterministic tree of relational algebra operators acting on physical pages in the buffer pool. At the logical layer, ${excerpt} Rather than mutating global variables imperatively, declarative SQL specifies the mathematical properties of the desired output relation while delegating physical access path selection to the cost-based query optimizer.</p>
<p>When the database engine processes <code>${slug}</code> within <strong>${mod.title}</strong>, it enforces strict invariants over tuple domains, attribute visibility, and I/O page budgets. Understanding the boundary between logical relational semantics (what rows qualify) and physical execution (whether the engine performs a sequential heap scan, a B+Tree range seek, or an in-memory hash probe) is the defining skill of a Staff Database Engineer.</p>

<div class="invariant-box">
  <div class="invariant-box__title">Formal Relational &amp; Cost Invariant — ${title}</div>
  <p>Let relation $R$ contain $N$ tuples stored across $B$ physical 8KB pages ($B \\approx \\lceil N / \\text{tuples\\_per\\_page} \\rceil$). Evaluating <strong>${title}</strong> maintains the relational closure and I/O cost bound:</p>
  $$\\text{Cost}_{\\text{I/O}}(R) = B_{\\text{seq}} \\cdot c_{\\text{seq}} + \\log_{F}(N) \\cdot c_{\\text{random}}, \\quad \\sigma_{\\theta}(\\pi_{A}(R)) \\subseteq \\text{Dom}(A)$$
  <p>Where $F \\approx 250\\text{--}500$ is the B+Tree page fanout, $\\sigma_{\\theta}$ denotes Three-Valued Logic predicate selection over <code>${tags[0] || 'tuple'}</code>, and $\\pi_{A}$ projects the target attribute schema without violating domain constraints.</p>
</div>

<h2>2. Database Table Schema, Execution Pipeline &amp; Visual Architecture</h2>
<p>Tracing how <strong>${title}</strong> flows through the parser, catalog binder, cost-based optimizer, and physical executor reveals exactly where latency and cardinality bugs originate:</p>
<ul>
  <li><strong>Stage 1 — Lexical Parsing &amp; Catalog Binding (<code>${tags[0] || 'schema'}</code>):</strong> The SQL parser builds an Abstract Syntax Tree (AST) and resolves every relation, column identifier, and data type against system catalog tables (such as <code>pg_class</code>, <code>pg_attribute</code>, or <code>sqlite_master</code>).</li>
  <li><strong>Stage 2 — Logical Rewrite &amp; Algebraic Simplification (<code>${tags[1] || 'optimizer'}</code>):</strong> The planner normalizes predicates, pushes selective filters as close to the storage scan as possible, and verifies whether Three-Valued <code>NULL</code> semantics permit subquery unnesting or join elimination.</li>
  <li><strong>Stage 3 — Cost Estimation &amp; Physical Operator Selection (<code>${tags[2] || 'execution'}</code>):</strong> Using histogram boundaries, Most Common Values (MCV), and Number of Distinct Values (NDV), the optimizer selects the minimum-cost physical plan and streams tuples through the execution pipeline.</li>
</ul>

${svgDiagram}

${mermaidBlock}

<h2>3. Interactive Table-Level &amp; Storage Engine Simulator</h2>
<p>Use the interactive simulator below to step through <strong>${title}</strong> at the tuple and page level. Observe how input rows, intermediate filter/join states, <code>NULL</code> badges, and physical page reads evolve at each step:</p>
<div class="simulator-mount" data-sim="sim-${slug}"></div>

<h2>4. Live WASM SQL Lab, Clause-by-Clause Visualizer &amp; Automated Test Checker</h2>
<p>Execute, edit, and test the production SQL query below directly in your browser using the embedded WebAssembly SQLite 3 engine. Click <strong>▶ Run Query</strong> to execute, <strong>🔍 Step Clauses</strong> to inspect the live intermediate table after <code>FROM/JOIN</code>, <code>WHERE</code>, <code>GROUP BY</code>, <code>HAVING</code>, <code>WINDOW</code>, <code>SELECT</code>, and <code>ORDER BY</code>, or <strong>✓ Check SQL Tests</strong> to run automated relational assertions against the reference result:</p>
<pre><code class="language-sql">${sqlSnippet}</code></pre>

<h2>5. Cross-Engine Dialect &amp; Cost Comparison Matrix</h2>
<p>While the SQL ISO standard defines the logical behavior of <strong>${title}</strong>, production storage engines differ in how they execute, lock, and index the underlying tuples:</p>
<table class="complexity-matrix">
  <thead>
    <tr>
      <th>Database Engine</th>
      <th>Primary Storage &amp; Access Mechanism</th>
      <th>I/O &amp; CPU Complexity</th>
      <th>Production Caveat for ${title}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>PostgreSQL 17</strong></td>
      <td>Heap Tuple Store (<code>ctid</code>) + B-Tree / GIN / BRIN + MVCC (<code>xmin/xmax</code>)</td>
      <td>$O(\\log_B N)$ seek / $O(N)$ scan</td>
      <td>Requires <code>ANALYZE</code> statistics and Visibility Map bits for Index-Only Scans.</td>
    </tr>
    <tr>
      <td><strong>SQLite 3.46 (WASM)</strong></td>
      <td>B+Tree Table (<code>rowid</code> clustered) + Covering Secondary B-Trees</td>
      <td>$O(\\log_B N)$ B+Tree traversal</td>
      <td>Runs in-process with zero network RTT; inspect <code>EXPLAIN QUERY PLAN</code> for <code>USE TEMP B-TREE</code>.</td>
    </tr>
    <tr>
      <td><strong>MySQL 8.4 (InnoDB)</strong></td>
      <td>Clustered Primary Key B+Tree + Undo Log Rollback Segments</td>
      <td>$O(\\log_B N)$ PK / $2 \\times O(\\log_B N)$ Secondary</td>
      <td>Secondary indexes store the Primary Key value; wide PKs amplify secondary index footprint.</td>
    </tr>
    <tr>
      <td><strong>DuckDB / ClickHouse</strong></td>
      <td>Columnar Vectorized Chunks + Zone Maps (Min/Max Skipping)</td>
      <td>$O(N / \\text{SIMD\\_Width})$ vectorized scan</td>
      <td>Excels at wide analytical scans and aggregations; avoid single-row OLTP point mutations.</td>
    </tr>
  </tbody>
</table>

<h2>6. Live Verification, Catalog Introspection &amp; Execution Plan Lab (SQL)</h2>
<p>To verify how a production database engine executes <strong>${title}</strong> across edge-case rows, run or modify the second live SQL verification query below. Inspect how <code>GROUP BY</code> buckets, window partitions, and Three-Valued <code>NULL</code> guards behave in real time:</p>
<pre><code class="language-sql">${verificationSqlSnippet}</code></pre>

<h2>7. Production Failure Modes, Anti-Patterns &amp; Staff Tuning Checklist</h2>
<div class="callout callout-warning">
  <div class="callout__title">Production Pitfall &amp; SEV-1 Outage Pattern</div>
  <p>The most common production failure in <strong>${title}</strong> occurs when a query passes functional unit tests on a 50-row local fixture but degrades into an $O(N^2)$ loop, an unindexed full-table scan, or a silent <code>NULL</code> data-drop once table cardinality crosses $10^7$ rows. Always verify both <code>NULL</code> boundary rows and physical buffer reads before deploying to production.</p>
</div>
<ul>
  <li><strong>Verify Execution Plans Early:</strong> Never guess what the planner will do—run <code>EXPLAIN QUERY PLAN</code> (SQLite) or <code>EXPLAIN (ANALYZE, BUFFERS)</code> (PostgreSQL) and confirm that estimated row counts match actual row counts within $2\\times$.</li>
  <li><strong>Guard Against Three-Valued NULL Traps:</strong> Audit every <code>NOT IN</code>, outer-join <code>WHERE</code> filter, and aggregate <code>AVG</code>/<code>COUNT(col)</code> expression for nullable columns; prefer <code>NOT EXISTS</code> and explicit <code>COALESCE</code> defaults.</li>
  <li><strong>Keep Predicates SARGable:</strong> Never wrap an indexed column in a function, arithmetic expression, or implicit type cast on the left-hand side of a comparison operator.</li>
  <li><strong>Bound Memory &amp; Lock Scope:</strong> Ensure sorting, hashing, and batch mutations operate within bounded memory budgets (<code>work_mem</code>) and hold row/table locks for the shortest possible duration.</li>
</ul>
</div>`;

  const keyTakeaways = [
    `${title} (${slug}): ${excerpt}`,
    `Always separate logical SQL semantics (FROM -> WHERE -> GROUP BY -> HAVING -> WINDOW -> SELECT -> ORDER BY -> LIMIT) from the physical execution plan chosen by the cost-based optimizer.`,
    `Audit every predicate and join condition for Three-Valued Logic (NULL -> UNKNOWN) edge cases and verify SARGability so B+Tree indexes can perform O(log_B N) range seeks.`,
    `Use EXPLAIN QUERY PLAN / EXPLAIN (ANALYZE, BUFFERS) to inspect physical scan operators, join algorithms, and temporary sort/hash spills before shipping queries to production.`
  ];

  const doc0 = PRIMARY_DOCS[globalIdx % PRIMARY_DOCS.length];
  const doc1 = PRIMARY_DOCS[(globalIdx + 2) % PRIMARY_DOCS.length];
  const doc2 = PRIMARY_DOCS[(globalIdx + 5) % PRIMARY_DOCS.length];

  const furtherReading = [
    { title: `${doc0.title} (${title})`, url: doc0.url },
    { title: `${doc1.title} — Access Paths & Execution`, url: doc1.url },
    { title: `${doc2.title} — Systems Reference`, url: doc2.url }
  ];

  return {
    title,
    video: {
      youtubeId: vid.youtubeId,
      title: `${title} — Database Systems & SQL Architecture Lecture`,
      channel: vid.channel,
      duration: vid.duration,
      start: 0,
      length: vid.length,
      why: `Builds first-principles mastery of ${title} with concrete query execution trees, storage page layouts, and production tuning trade-offs.`
    },
    videos: [
      {
        youtubeId: altVid.youtubeId,
        title: `${mod.title}: Companion Deep-Dive Lecture`,
        channel: altVid.channel,
        duration: altVid.duration,
        why: `Complementary lecture covering production implementation details for ${mod.title}.`
      }
    ],
    intuition,
    content,
    keyTakeaways,
    furtherReading
  };
}

function generateUnitQuestions(mod, unit, globalIdx, uIdx) {
  const slug = unit.slug;
  const title = unit.title;
  const excerpt = unit.archive?.excerpt || title;
  const tags = unit.archive?.tags || ['sql', 'relational', 'database'];

  return [
    {
      id: `${slug}-q1`,
      type: 'mcq',
      difficulty: 'recall',
      title: `${title} — Core Relational Invariant`,
      prompt: `Which statement accurately characterizes the primary mechanism and guarantee of ${title}?`,
      question: `Which statement accurately characterizes the primary mechanism and guarantee of ${title}?`,
      options: [
        `${excerpt}`,
        `It bypasses the SQL parser and catalog binder to mutate raw disk sectors without checking schema types or constraints.`,
        `It forces the query optimizer to disable all B+Tree indexes and execute a Cartesian product across every table in the schema.`,
        `It converts all NULL attributes into empty strings automatically before evaluating WHERE or JOIN predicates.`
      ],
      answer: 0,
      explanation: `Correct. ${excerpt} The database engine enforces strict schema binding, Three-Valued NULL semantics, and cost-based access path selection.`
    },
    {
      id: `${slug}-q2`,
      type: 'mcq',
      difficulty: 'apply',
      title: `${title} — Execution Order & NULL Semantics`,
      prompt: `When writing or reviewing a production SQL query involving ${title} (${tags.join(', ')}), how does the engine handle NULL values and logical evaluation order?`,
      question: `When writing or reviewing a production SQL query involving ${title} (${tags.join(', ')}), how does the engine handle NULL values and logical evaluation order?`,
      options: [
        `Standard equality/inequality comparisons with NULL evaluate to UNKNOWN under Three-Valued Logic, and WHERE/JOIN filters only retain rows where the predicate evaluates to TRUE.`,
        `SELECT column aliases are evaluated first so they can be referenced directly inside WHERE and ON clauses within the same query block.`,
        `NULL is treated as numerically equal to 0 in WHERE predicates and equal to an empty string in INNER JOIN conditions.`,
        `The engine evaluates ORDER BY before GROUP BY so aggregate functions always process pre-sorted tuples without needing an index.`
      ],
      answer: 0,
      explanation: `Under SQL's Three-Valued Logic (TRUE, FALSE, UNKNOWN), any standard comparison with NULL yields UNKNOWN. Both WHERE and ON clauses filter out UNKNOWN rows, and logical evaluation always binds FROM/JOIN and WHERE before SELECT projections.`
    },
    {
      id: `${slug}-q3`,
      type: 'mcq',
      difficulty: 'apply',
      title: `${title} — Physical Plan & SARGability Analysis`,
      prompt: `An engineer notices that a query using concepts from ${title} degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?`,
      question: `An engineer notices that a query using concepts from ${title} degrades from 3ms in staging to 4.8 seconds in production on a 20-million-row table. What is the most effective diagnostic and remediation workflow?`,
      options: [
        `Inspect EXPLAIN (ANALYZE, BUFFERS) / EXPLAIN QUERY PLAN to check for Seq Scans, non-SARGable expressions, or cardinality misestimates, and align the query predicate with a leftmost composite B+Tree index prefix.`,
        `Add DISTINCT to the outer SELECT list so the database engine skips scanning duplicate pages on disk.`,
        `Replace all declarative SQL joins with 10,000 sequential single-row SELECT queries inside an application for-loop.`,
        `Drop all foreign key and CHECK constraints so the cost-based optimizer has fewer catalog entries to read.`
      ],
      answer: 0,
      explanation: `Inspecting the physical execution plan via EXPLAIN (ANALYZE, BUFFERS) or EXPLAIN QUERY PLAN reveals whether the engine is performing a full sequential scan or spilling to disk, and rewriting predicates to be SARGable over a composite B+Tree index restores O(log_B N) seek latency.`
    },
    {
      id: `${slug}-q4`,
      type: 'mcq',
      difficulty: 'staff',
      title: `${title} — Staff Database Architecture Trade-Off`,
      prompt: `At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting ${title} across OLTP and OLAP workloads?`,
      question: `At Staff/Principal engineer level, what fundamental systems trade-off must be balanced when architecting ${title} across OLTP and OLAP workloads?`,
      options: [
        `Balancing read-path latency (index-only scans, pre-computation, low join fanout) against write amplification, buffer pool memory pressure, and MVCC/WAL concurrency overhead.`,
        `Adding a secondary B+Tree index on every possible column permutation has zero impact on INSERT, UPDATE, or WAL fsync throughput.`,
        `Using READ UNCOMMITTED isolation automatically prevents Lost Updates, Write Skew, and phantom reads without any locking or version checks.`,
        `Physical 8KB page layout and tuple header size only matter for magnetic spinning disks and have zero effect on NVMe SSD or RAM buffer pool performance.`
      ],
      answer: 0,
      explanation: `Every database architecture decision balances the RUM Conjecture: optimizing read latency via extra indexes or denormalized views increases write amplification (page splits, WAL volume, MVCC dead tuples) and buffer pool footprint.`
    }
  ];
}

function buildProgressiveLabSteps(mod, unit, uIdx) {
  const modNum = parseInt(mod.id.replace('m', ''), 10);
  const slug = unit.slug;
  const title = unit.title;
  const tags = unit.archive?.tags || ['sql', 'relational', 'execution'];
  const tag0 = tags[0] || 'relational';
  const tag1 = tags[1] || 'predicate';
  const limitN = 6 + (uIdx % 5);

  const blueprints = [
    // 0: ecommerce — Customer Lifetime Value & Tier Cohort Progression
    {
      datasetId: 'ecommerce',
      complexity: { time: 'O(N log N) hash aggregate + sort', space: 'O(G) customer group table', pattern: `${mod.title} · ${tag0}` },
      step1: {
        phase: `Phase 1 · ${title}: Customer Relation Projection`,
        title: `Step 1: Project Customer Domain Attributes (${slug})`,
        concept: `Inspect the \`customers\` relation for ${title} and isolate target regional cohorts with explicit \`COALESCE\` referral defaults.`,
        instructions: `Start from the baseline \`customers\` projection in \`query.sql\`, then filter to core markets (\`'US'\`, \`'IN'\`, \`'GB'\`, \`'DE'\`) and normalize \`referred_by\` with \`COALESCE\`.`,
        starter: `-- Step 1 Starter (${slug}): Baseline customer catalog scan
SELECT
  customer_id,
  name AS customer_name,
  tier,
  country
FROM customers
ORDER BY customer_id ASC
LIMIT ${limitN};`,
        solution: `-- Step 1 Solution (${slug}): Regional cohort filter & NULL-safe referral attribute
SELECT
  customer_id,
  name AS customer_name,
  tier,
  country,
  COALESCE(referred_by, 0) AS referrer_id,
  created_at
FROM customers
WHERE country IN ('US', 'IN', 'GB', 'DE')
ORDER BY customer_id ASC
LIMIT ${limitN};`
      },
      step2: {
        phase: `Phase 2 · ${title}: Outer Join & Order Fold`,
        title: `Step 2: Left Join Completed Orders for ${title}`,
        concept: `Preserve zero-order customers via \`LEFT JOIN\` with the \`o.status = 'completed'\` predicate inside the \`ON\` clause rather than \`WHERE\`.`,
        instructions: `Extend the join scaffold in \`query.sql\` to aggregate \`COUNT(o.order_id)\` and \`COALESCE(SUM(o.total_cents), 0)\` per customer.`,
        starter: `-- Step 2 Starter (${slug}): Left join customers with completed orders
SELECT
  c.customer_id,
  c.name AS customer_name,
  c.tier,
  o.order_id,
  o.total_cents
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
  AND o.status = 'completed'
ORDER BY c.customer_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Customer-level completed order count & spend rollup
SELECT
  c.customer_id,
  c.name AS customer_name,
  c.tier,
  c.country,
  COUNT(o.order_id) AS completed_orders,
  ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS settled_spend_usd
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
  AND o.status = 'completed'
GROUP BY c.customer_id, c.name, c.tier, c.country
ORDER BY settled_spend_usd DESC, c.customer_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Tier Benchmark & Plan Verification`,
        title: `Step 3: Production LTV & Tier Window Benchmark (${title})`,
        concept: `Combine grouped customer LTV with a partitioned window average \`AVG(...) OVER (PARTITION BY c.tier)\` to benchmark each customer against their tier cohort.`,
        instructions: `Complete the production query in \`query.sql\` by adding the \`tier_avg_usd\` window column and deterministic ordering.`,
        starter: `-- Step 3 Starter (${slug}): Pre-window customer LTV aggregation
SELECT
  c.customer_id,
  c.name AS customer_name,
  c.tier,
  c.country,
  COUNT(o.order_id) AS completed_orders,
  ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS lifetime_value_usd
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
  AND o.status = 'completed'
WHERE c.country IN ('US', 'IN', 'GB', 'DE')
GROUP BY c.customer_id, c.name, c.tier, c.country
ORDER BY lifetime_value_usd DESC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug}) — Production LTV & Tier Benchmark
SELECT
  c.customer_id,
  c.name AS customer_name,
  c.tier,
  c.country,
  COUNT(o.order_id) AS completed_orders,
  ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS lifetime_value_usd,
  ROUND(AVG(COALESCE(SUM(o.total_cents), 0)) OVER (PARTITION BY c.tier) / 100.0, 2) AS tier_avg_usd
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.customer_id
  AND o.status = 'completed'
WHERE c.country IN ('US', 'IN', 'GB', 'DE')
GROUP BY c.customer_id, c.name, c.tier, c.country
ORDER BY lifetime_value_usd DESC, c.customer_id ASC
LIMIT ${limitN};`
      }
    },
    // 1: ecommerce — Product Catalog Valuation & Category Margin Analysis
    {
      datasetId: 'ecommerce',
      complexity: { time: 'O(N) index scan + hash join', space: 'O(C) category lookup state', pattern: `${mod.title} · ${tag0}` },
      step1: {
        phase: `Phase 1 · ${title}: Exact-Cents Catalog Arithmetic`,
        title: `Step 1: Inspect Active Catalog SKUs & Cents Domain (${slug})`,
        concept: `Verify integer-cents pricing (\`price_cents\`) and active inventory flags (\`is_active = 1\`) in \`products\` without IEEE-754 float drift.`,
        instructions: `Refine the starter \`products\` query in \`query.sql\` to filter \`is_active = 1\` and compute \`price_usd\` plus \`stock_value_usd\`.`,
        starter: `-- Step 1 Starter (${slug}): Raw products table inspection
SELECT
  product_id,
  sku,
  name AS product_title,
  price_cents,
  stock_qty,
  is_active
FROM products
ORDER BY product_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Active SKUs with exact decimal USD valuation
SELECT
  product_id,
  sku,
  name AS product_title,
  category_id,
  price_cents,
  ROUND(price_cents / 100.0, 2) AS price_usd,
  stock_qty,
  ROUND((price_cents * stock_qty) / 100.0, 2) AS stock_value_usd
FROM products
WHERE is_active = 1
ORDER BY stock_value_usd DESC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Category Hierarchy & Line-Item Join`,
        title: `Step 2: Join Categories & Order Items for ${title}`,
        concept: `Enrich active products with \`categories\` metadata and aggregate ordered quantities from \`order_items\`.`,
        instructions: `Expand the category join in \`query.sql\` to include a \`LEFT JOIN\` on \`order_items\` and compute \`units_sold\`.`,
        starter: `-- Step 2 Starter (${slug}): Join products with categories
SELECT
  p.product_id,
  p.sku,
  p.name AS product_title,
  cat.name AS category_name,
  ROUND(p.price_cents / 100.0, 2) AS price_usd
FROM products AS p
INNER JOIN categories AS cat
  ON cat.category_id = p.category_id
WHERE p.is_active = 1
ORDER BY p.price_cents DESC;`,
        solution: `-- Step 2 Solution (${slug}): Category-enriched product demand aggregation
SELECT
  p.product_id,
  p.sku,
  p.name AS product_title,
  cat.name AS category_name,
  ROUND(p.price_cents / 100.0, 2) AS price_usd,
  COALESCE(SUM(oi.quantity), 0) AS units_sold
FROM products AS p
INNER JOIN categories AS cat
  ON cat.category_id = p.category_id
LEFT JOIN order_items AS oi
  ON oi.product_id = p.product_id
WHERE p.is_active = 1
GROUP BY p.product_id, p.sku, p.name, cat.name, p.price_cents
ORDER BY units_sold DESC, price_usd DESC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Inventory Valuation & Sell-Through Audit`,
        title: `Step 3: Production Catalog Valuation & Revenue Query (${title})`,
        concept: `Combine on-hand inventory valuation with realized line-item revenue to audit catalog performance for ${title}.`,
        instructions: `Complete the production query in \`query.sql\` by projecting \`inventory_valuation_usd\`, \`realized_revenue_usd\`, and ordering by total valuation.`,
        starter: `-- Step 3 Starter (${slug}): Category & product valuation baseline
SELECT
  p.product_id,
  p.sku,
  p.name AS product_title,
  cat.name AS category_name,
  p.price_cents,
  p.stock_qty
FROM products AS p
INNER JOIN categories AS cat
  ON cat.category_id = p.category_id
WHERE p.is_active = 1
ORDER BY p.price_cents DESC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug}) — Catalog Valuation & Demand Audit
SELECT
  p.product_id,
  p.sku,
  p.name AS product_title,
  cat.name AS category_name,
  ROUND(p.price_cents / 100.0, 2) AS price_usd,
  p.stock_qty,
  ROUND((p.price_cents * p.stock_qty) / 100.0, 2) AS inventory_valuation_usd,
  COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
  ROUND(COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0) / 100.0, 2) AS realized_revenue_usd
FROM products AS p
INNER JOIN categories AS cat
  ON cat.category_id = p.category_id
LEFT JOIN order_items AS oi
  ON oi.product_id = p.product_id
WHERE p.is_active = 1
GROUP BY p.product_id, p.sku, p.name, cat.name, p.price_cents, p.stock_qty
ORDER BY inventory_valuation_usd DESC, p.product_id ASC;`
      }
    },
    // 2: ecommerce — Three-Valued Logic (3VL), Promo Codes & Settlement Reconciliation
    {
      datasetId: 'ecommerce',
      complexity: { time: 'O(N) sequential/index scan', space: 'O(1) tuple projection state', pattern: `${mod.title} · ${tag1}` },
      step1: {
        phase: `Phase 1 · ${title}: Three-Valued Logic & NULL Inspection`,
        title: `Step 1: Inspect Nullable Promo Codes in Orders (${slug})`,
        concept: `Observe how \`discount_code\` contains \`NULL\` markers where direct equality (\`=\` or \`<>\`) evaluates to \`UNKNOWN\` under SQL Three-Valued Logic.`,
        instructions: `Enhance the starter query in \`query.sql\` with \`COALESCE(discount_code, 'NO_PROMO')\` and an explicit \`IS NULL\` / \`IS NOT NULL\` classification.`,
        starter: `-- Step 1 Starter (${slug}): Inspect raw orders and nullable discount_code
SELECT
  order_id,
  customer_id,
  status,
  discount_code,
  total_cents
FROM orders
ORDER BY order_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Explicit 3VL NULL guard and promo normalization
SELECT
  order_id,
  customer_id,
  status,
  COALESCE(discount_code, 'NO_PROMO') AS promo_code,
  CASE
    WHEN discount_code IS NULL THEN 'ORGANIC_CHECKOUT'
    ELSE 'PROMO_APPLIED'
  END AS promo_state,
  ROUND(total_cents / 100.0, 2) AS order_usd
FROM orders
ORDER BY total_cents DESC, order_id ASC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Payment & Shipment Fulfillment Join`,
        title: `Step 2: Reconcile Orders with Payments & Shipments (${title})`,
        concept: `Correlate \`orders\` against \`payments\` and \`shipments\` using \`LEFT JOIN\` so unpaid or unshipped orders remain visible.`,
        instructions: `Add the \`LEFT JOIN shipments\` clause and normalize missing payment/carrier attributes with \`COALESCE\`.`,
        starter: `-- Step 2 Starter (${slug}): Join orders with payments
SELECT
  o.order_id,
  o.status AS order_status,
  ROUND(o.total_cents / 100.0, 2) AS billed_usd,
  pay.method AS payment_method,
  pay.status AS payment_status
FROM orders AS o
LEFT JOIN payments AS pay
  ON pay.order_id = o.order_id
ORDER BY o.order_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Full order-to-payment-to-shipment reconciliation
SELECT
  o.order_id,
  o.status AS order_status,
  ROUND(o.total_cents / 100.0, 2) AS billed_usd,
  COALESCE(pay.method, 'UNPAID') AS payment_method,
  COALESCE(pay.status, 'PENDING') AS payment_status,
  COALESCE(s.carrier, 'NOT_SHIPPED') AS carrier_status
FROM orders AS o
LEFT JOIN payments AS pay
  ON pay.order_id = o.order_id
LEFT JOIN shipments AS s
  ON s.order_id = o.order_id
ORDER BY o.order_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: End-to-End Order Settlement Audit`,
        title: `Step 3: Production Settlement & Promo Attribution Query (${title})`,
        concept: `Produce the complete customer, promo, payment, and fulfillment audit relation with strict 3VL NULL guards.`,
        instructions: `Run the complete multi-table settlement audit in \`query.sql\` and verify each clause in the Table Visualizer.`,
        starter: `-- Step 3 Starter (${slug}): Customer & order settlement scaffold
SELECT
  o.order_id,
  c.name AS customer_name,
  o.status AS order_status,
  ROUND(o.total_cents / 100.0, 2) AS billed_usd,
  COALESCE(o.discount_code, 'NO_PROMO') AS promo_code
FROM orders AS o
INNER JOIN customers AS c
  ON c.customer_id = o.customer_id
ORDER BY o.total_cents DESC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug}) — End-to-End Settlement & 3VL Audit
SELECT
  o.order_id,
  c.name AS customer_name,
  c.tier,
  o.status AS order_status,
  COALESCE(o.discount_code, 'NO_PROMO') AS promo_code,
  ROUND(o.total_cents / 100.0, 2) AS billed_usd,
  COALESCE(pay.method, 'UNPAID') AS payment_method,
  COALESCE(pay.status, 'AWAITING_SETTLEMENT') AS payment_status,
  COALESCE(s.carrier, 'UNFULFILLED') AS shipping_carrier
FROM orders AS o
INNER JOIN customers AS c
  ON c.customer_id = o.customer_id
LEFT JOIN payments AS pay
  ON pay.order_id = o.order_id
LEFT JOIN shipments AS s
  ON s.order_id = o.order_id
ORDER BY o.total_cents DESC, o.order_id ASC;`
      }
    },
    // 3: ecommerce — Line-Item Normalization, Review Sentiment & Anti-Join Checks
    {
      datasetId: 'ecommerce',
      complexity: { time: 'O(N + M) hash join & group fold', space: 'O(P) product accumulator', pattern: `${mod.title} · ${tag0}` },
      step1: {
        phase: `Phase 1 · ${title}: Product Review & Rating Domain Scan`,
        title: `Step 1: Inspect Verified Customer Product Reviews (${slug})`,
        concept: `Examine the \`product_reviews\` relation to evaluate rating distribution and nullable review comments.`,
        instructions: `Refine the starter query on \`product_reviews\` to classify ratings >= 4 as \`'POSITIVE'\` and replace \`NULL\` comments via \`COALESCE\`.`,
        starter: `-- Step 1 Starter (${slug}): Base product_reviews scan
SELECT
  review_id,
  product_id,
  customer_id,
  rating,
  comment
FROM product_reviews
ORDER BY review_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Normalized review sentiment & NULL-safe comment
SELECT
  review_id,
  product_id,
  customer_id,
  rating,
  CASE
    WHEN rating >= 4 THEN 'POSITIVE'
    WHEN rating = 3 THEN 'NEUTRAL'
    ELSE 'CRITICAL'
  END AS sentiment_band,
  COALESCE(comment, 'No written comment') AS review_text,
  created_at
FROM product_reviews
ORDER BY rating DESC, review_id ASC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Order Line-Item vs Header Reconciliation`,
        title: `Step 2: Reconcile Order Items Against Order Headers (${title})`,
        concept: `Verify 3NF/BCNF functional dependency integrity by comparing \`SUM(quantity * unit_price_cents)\` in \`order_items\` against \`orders.total_cents\`.`,
        instructions: `Complete the grouped reconciliation query in \`query.sql\` to flag promo adjustments where line-item sums differ from header totals.`,
        starter: `-- Step 2 Starter (${slug}): Inspect order_items joined with orders
SELECT
  o.order_id,
  o.total_cents AS header_total_cents,
  oi.product_id,
  oi.quantity,
  oi.unit_price_cents
FROM orders AS o
INNER JOIN order_items AS oi
  ON oi.order_id = o.order_id
ORDER BY o.order_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Line-item subtotal vs order header audit
SELECT
  o.order_id,
  o.customer_id,
  COUNT(oi.order_item_id) AS line_item_count,
  SUM(oi.quantity * oi.unit_price_cents) AS line_subtotal_cents,
  o.total_cents AS header_total_cents,
  (o.total_cents - SUM(oi.quantity * oi.unit_price_cents)) AS adjustment_delta_cents
FROM orders AS o
INNER JOIN order_items AS oi
  ON oi.order_id = o.order_id
GROUP BY o.order_id, o.customer_id, o.total_cents
ORDER BY o.order_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Catalog Demand & Review Rating Synthesis`,
        title: `Step 3: Production Product Demand & Review Quality Audit (${title})`,
        concept: `Synthesize catalog pricing, ordered unit volume, and average customer review ratings across normalized tables.`,
        instructions: `Execute the production synthesis query in \`query.sql\` and inspect the multi-join pipeline in the Table Visualizer.`,
        starter: `-- Step 3 Starter (${slug}): Product and review join scaffold
SELECT
  p.product_id,
  p.sku,
  p.name AS product_name,
  ROUND(p.price_cents / 100.0, 2) AS price_usd,
  COUNT(r.review_id) AS review_count
FROM products AS p
LEFT JOIN product_reviews AS r
  ON r.product_id = p.product_id
GROUP BY p.product_id, p.sku, p.name, p.price_cents
ORDER BY review_count DESC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug}) — Product Demand & Review Quality Audit
SELECT
  p.product_id,
  p.sku,
  p.name AS product_name,
  ROUND(p.price_cents / 100.0, 2) AS price_usd,
  COUNT(DISTINCT oi.order_item_id) AS order_appearances,
  COUNT(DISTINCT r.review_id) AS review_count,
  ROUND(COALESCE(AVG(r.rating), 0), 2) AS avg_rating
FROM products AS p
LEFT JOIN order_items AS oi
  ON oi.product_id = p.product_id
LEFT JOIN product_reviews AS r
  ON r.product_id = p.product_id
GROUP BY p.product_id, p.sku, p.name, p.price_cents
ORDER BY avg_rating DESC, order_appearances DESC, p.product_id ASC;`
      }
    },
    // 4: org_hr — Self-Join Reporting Hierarchy & Departmental Budget Utilization
    {
      datasetId: 'org_hr',
      complexity: { time: 'O(E + D) hash join & group rollup', space: 'O(D) department state', pattern: `${mod.title} · ${tag0}` },
      step1: {
        phase: `Phase 1 · ${title}: Employee Compensation & Tenure Scan`,
        title: `Step 1: Inspect Employee Roster & Compensation Bands (${slug})`,
        concept: `Query the \`employees\` relation in \`org_hr\`, handling the root executive's \`NULL\` \`manager_id\` explicitly.`,
        instructions: `Refine the starter query in \`query.sql\` to filter employees with \`salary_usd >= 150000\` and label root vs reporting staff.`,
        starter: `-- Step 1 Starter (${slug}): Baseline employees roster scan
SELECT
  emp_id,
  name AS employee_name,
  title,
  dept_id,
  manager_id,
  salary_usd
FROM employees
ORDER BY emp_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Compensation filter & root-manager classification
SELECT
  emp_id,
  name AS employee_name,
  title,
  dept_id,
  COALESCE(manager_id, 0) AS reports_to_id,
  salary_usd,
  hired_at
FROM employees
WHERE salary_usd >= 150000
ORDER BY salary_usd DESC, emp_id ASC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Self-Join Employee-to-Manager Pairing`,
        title: `Step 2: Self-Join Employees with Direct Managers (${title})`,
        concept: `Alias \`employees AS e\` and \`employees AS m\` with \`LEFT JOIN\` so the CEO (\`manager_id IS NULL\`) is preserved alongside direct reports.`,
        instructions: `Complete the self-join in \`query.sql\` to compute the compensation ratio between each employee and their manager.`,
        starter: `-- Step 2 Starter (${slug}): Self-join employees with manager alias
SELECT
  e.emp_id,
  e.name AS employee_name,
  e.salary_usd AS employee_salary,
  m.name AS manager_name
FROM employees AS e
LEFT JOIN employees AS m
  ON m.emp_id = e.manager_id
ORDER BY e.salary_usd DESC;`,
        solution: `-- Step 2 Solution (${slug}): Self-join reporting pairs with manager salary comparison
SELECT
  e.emp_id,
  e.name AS employee_name,
  e.title AS employee_role,
  e.salary_usd AS employee_salary,
  COALESCE(m.name, 'BOARD_OF_DIRECTORS') AS manager_name,
  COALESCE(m.salary_usd, e.salary_usd) AS manager_salary,
  (COALESCE(m.salary_usd, e.salary_usd) - e.salary_usd) AS gap_to_manager_usd
FROM employees AS e
LEFT JOIN employees AS m
  ON m.emp_id = e.manager_id
ORDER BY e.salary_usd DESC, e.emp_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Departmental Payroll vs Budget Rollup`,
        title: `Step 3: Production Department Budget Utilization Audit (${title})`,
        concept: `Aggregate departmental headcount and active payroll against \`departments.annual_budget_usd\` to measure budget utilization.`,
        instructions: `Complete the production departmental rollup in \`query.sql\` including \`budget_used_pct\` and verify via SQL assertions.`,
        starter: `-- Step 3 Starter (${slug}): Department to employee join scaffold
SELECT
  d.dept_id,
  d.name AS department_name,
  d.cost_center,
  d.annual_budget_usd,
  COUNT(e.emp_id) AS headcount
FROM departments AS d
LEFT JOIN employees AS e
  ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.name, d.cost_center, d.annual_budget_usd
ORDER BY headcount DESC;`,
        solution: `-- Dataset: org_hr | ${title} (${slug}) — Department Budget Utilization Rollup
SELECT
  d.dept_id,
  d.name AS department_name,
  d.cost_center,
  COUNT(e.emp_id) AS headcount,
  COALESCE(SUM(e.salary_usd), 0) AS active_payroll_usd,
  d.annual_budget_usd,
  ROUND((COALESCE(SUM(e.salary_usd), 0) * 100.0) / d.annual_budget_usd, 1) AS budget_used_pct
FROM departments AS d
LEFT JOIN employees AS e
  ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.name, d.cost_center, d.annual_budget_usd
HAVING COUNT(e.emp_id) >= 1
ORDER BY active_payroll_usd DESC, d.dept_id ASC;`
      }
    },
    // 5: org_hr — Recursive CTE Org Hierarchy, Project Allocation & Window Ranking
    {
      datasetId: 'org_hr',
      complexity: { time: 'O(V + E) recursive BFS + window sort', space: 'O(V) hierarchy working table', pattern: `${mod.title} · ${tag0}` },
      step1: {
        phase: `Phase 1 · ${title}: Project Portfolio & Lead Assignment Scan`,
        title: `Step 1: Inspect Engineering Projects & Allocation Matrix (${slug})`,
        concept: `Inspect \`projects\` and \`employee_projects\` to understand capital budgets and percentage allocations across staff.`,
        instructions: `Extend the starter \`projects\` query in \`query.sql\` to join the project lead's name from \`employees\`.`,
        starter: `-- Step 1 Starter (${slug}): Base projects table scan
SELECT
  project_id,
  code AS project_code,
  title AS project_title,
  lead_emp_id,
  budget_usd
FROM projects
ORDER BY budget_usd DESC;`,
        solution: `-- Step 1 Solution (${slug}): Projects enriched with lead engineer identity
SELECT
  p.project_id,
  p.code AS project_code,
  p.title AS project_title,
  e.name AS lead_engineer,
  e.title AS lead_role,
  p.budget_usd
FROM projects AS p
INNER JOIN employees AS e
  ON e.emp_id = p.lead_emp_id
ORDER BY p.budget_usd DESC, p.project_id ASC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Recursive Org Hierarchy CTE`,
        title: `Step 2: Traverse Reporting Chain with WITH RECURSIVE (${title})`,
        concept: `Build a recursive CTE anchored at \`manager_id IS NULL\` and iteratively join direct reports up to depth 5.`,
        instructions: `Complete the \`WITH RECURSIVE org_tree\` query in \`query.sql\` to compute \`hierarchy_level\` and \`reporting_chain\`.`,
        starter: `-- Step 2 Starter (${slug}): Anchor member of organizational hierarchy
SELECT
  emp_id,
  name,
  title,
  dept_id,
  0 AS hierarchy_level
FROM employees
WHERE manager_id IS NULL;`,
        solution: `-- Step 2 Solution (${slug}): Full WITH RECURSIVE chain-of-command traversal
WITH RECURSIVE org_tree AS (
  SELECT
    emp_id,
    name,
    title,
    manager_id,
    dept_id,
    salary_usd,
    0 AS hierarchy_level,
    name AS reporting_chain
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT
    e.emp_id,
    e.name,
    e.title,
    e.manager_id,
    e.dept_id,
    e.salary_usd,
    t.hierarchy_level + 1 AS hierarchy_level,
    t.reporting_chain || ' -> ' || e.name AS reporting_chain
  FROM employees AS e
  INNER JOIN org_tree AS t
    ON e.manager_id = t.emp_id
  WHERE t.hierarchy_level < 5
)
SELECT
  emp_id,
  name,
  title,
  hierarchy_level,
  salary_usd,
  reporting_chain
FROM org_tree
ORDER BY hierarchy_level ASC, salary_usd DESC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Departmental Window Ranking & Running Payroll`,
        title: `Step 3: Production Window Rank, Peer Gap & Cumulative Payroll (${title})`,
        concept: `Evaluate \`DENSE_RANK()\`, \`LAG()\`, and \`SUM() OVER (PARTITION BY e.dept_id ... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)\` without collapsing employee rows.`,
        instructions: `Complete the production window query in \`query.sql\` and step through the Window clause in the Table Visualizer.`,
        starter: `-- Step 3 Starter (${slug}): Departmental employee join before window frame
SELECT
  d.name AS dept_name,
  e.name AS employee_name,
  e.title,
  e.salary_usd,
  e.hired_at
FROM employees AS e
INNER JOIN departments AS d
  ON d.dept_id = e.dept_id
ORDER BY d.name ASC, e.salary_usd DESC;`,
        solution: `-- Dataset: org_hr | ${title} (${slug}) — Partitioned Window Ranking & Running Payroll
SELECT
  d.name AS dept_name,
  e.name AS employee_name,
  e.title,
  e.salary_usd,
  DENSE_RANK() OVER (
    PARTITION BY e.dept_id
    ORDER BY e.salary_usd DESC
  ) AS dept_salary_rank,
  LAG(e.salary_usd, 1, e.salary_usd) OVER (
    PARTITION BY e.dept_id
    ORDER BY e.salary_usd DESC
  ) - e.salary_usd AS gap_to_higher_peer_usd,
  SUM(e.salary_usd) OVER (
    PARTITION BY e.dept_id
    ORDER BY e.hired_at ASC, e.emp_id ASC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_dept_payroll_usd
FROM employees AS e
INNER JOIN departments AS d
  ON d.dept_id = e.dept_id
ORDER BY d.name ASC, dept_salary_rank ASC, e.emp_id ASC;`
      }
    },
    // 6: org_hr — SCD Type 2 Salary History & Project Allocation Rollup
    {
      datasetId: 'org_hr',
      complexity: { time: 'O(H log H) temporal sort + join', space: 'O(E) employee state', pattern: `${mod.title} · ${tag1}` },
      step1: {
        phase: `Phase 1 · ${title}: Historical Compensation Change Scan`,
        title: `Step 1: Inspect Salary History Audit Records (${slug})`,
        concept: `Examine \`salary_history\` to compute absolute raise deltas (\`new_salary_usd - old_salary_usd\`) and effective dates.`,
        instructions: `Update the starter query in \`query.sql\` to compute \`raise_delta_usd\` and \`raise_pct\` ordered chronologically.`,
        starter: `-- Step 1 Starter (${slug}): Raw salary_history table scan
SELECT
  history_id,
  emp_id,
  old_salary_usd,
  new_salary_usd,
  effective_date
FROM salary_history
ORDER BY history_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Computed raise delta and percentage growth
SELECT
  history_id,
  emp_id,
  old_salary_usd,
  new_salary_usd,
  (new_salary_usd - old_salary_usd) AS raise_delta_usd,
  ROUND(((new_salary_usd - old_salary_usd) * 100.0) / old_salary_usd, 1) AS raise_pct,
  effective_date
FROM salary_history
ORDER BY effective_date ASC, raise_delta_usd DESC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Cross-Project Allocation Aggregation`,
        title: `Step 2: Aggregate Employee Project Allocations (${title})`,
        concept: `Join \`employees\`, \`employee_projects\`, and \`projects\` to calculate total allocation percentage per engineer.`,
        instructions: `Complete the multi-table join in \`query.sql\` to aggregate \`assigned_projects\` and \`total_allocation_pct\`.`,
        starter: `-- Step 2 Starter (${slug}): Join employee_projects with projects
SELECT
  ep.emp_id,
  p.code AS project_code,
  p.title AS project_title,
  ep.allocation_pct
FROM employee_projects AS ep
INNER JOIN projects AS p
  ON p.project_id = ep.project_id
ORDER BY ep.emp_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Engineer workload & project allocation rollup
SELECT
  e.emp_id,
  e.name AS employee_name,
  e.title,
  COUNT(ep.project_id) AS assigned_projects,
  COALESCE(SUM(ep.allocation_pct), 0) AS total_allocation_pct
FROM employees AS e
LEFT JOIN employee_projects AS ep
  ON ep.emp_id = e.emp_id
GROUP BY e.emp_id, e.name, e.title
ORDER BY total_allocation_pct DESC, e.emp_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: SCD Type 2 Compensation & Department Audit`,
        title: `Step 3: Production SCD2 Compensation Progression Query (${title})`,
        concept: `Join \`salary_history\`, \`employees\`, and \`departments\` to audit historical compensation changes alongside current salary.`,
        instructions: `Run the production compensation history query in \`query.sql\` and verify the output schema and ordering.`,
        starter: `-- Step 3 Starter (${slug}): Join salary_history with employees
SELECT
  e.name AS employee_name,
  e.title,
  sh.old_salary_usd,
  sh.new_salary_usd,
  sh.effective_date
FROM salary_history AS sh
INNER JOIN employees AS e
  ON e.emp_id = sh.emp_id
ORDER BY sh.effective_date ASC;`,
        solution: `-- Dataset: org_hr | ${title} (${slug}) — SCD Type 2 Compensation History Audit
SELECT
  e.name AS employee_name,
  d.name AS department_name,
  e.title,
  sh.old_salary_usd,
  sh.new_salary_usd,
  (sh.new_salary_usd - sh.old_salary_usd) AS raise_delta_usd,
  ROUND(((sh.new_salary_usd - sh.old_salary_usd) * 100.0) / sh.old_salary_usd, 1) AS raise_pct,
  sh.effective_date
FROM salary_history AS sh
INNER JOIN employees AS e
  ON e.emp_id = sh.emp_id
INNER JOIN departments AS d
  ON d.dept_id = e.dept_id
ORDER BY sh.effective_date ASC, raise_delta_usd DESC;`
      }
    },
    // 7: fintech_ledger — Double-Entry ACID Conservation & Optimistic Version Control
    {
      datasetId: 'fintech_ledger',
      complexity: { time: 'O(T + J) indexed join + group check', space: 'O(T) transfer accumulator', pattern: `${mod.title} · ${tag0}` },
      step1: {
        phase: `Phase 1 · ${title}: Ledger Account & Optimistic Version Scan`,
        title: `Step 1: Inspect Accounts & Optimistic Lock Versions (${slug})`,
        concept: `Inspect \`accounts\` in \`fintech_ledger\` to verify \`posted_balance_cents\` and MVCC/optimistic concurrency \`version\` counters.`,
        instructions: `Refine the starter \`accounts\` query in \`query.sql\` to compute \`posted_balance_usd\` and classify account types.`,
        starter: `-- Step 1 Starter (${slug}): Base accounts relation scan
SELECT
  account_id,
  owner_name,
  account_type,
  posted_balance_cents,
  version
FROM accounts
ORDER BY account_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Account balances in USD with optimistic version metadata
SELECT
  account_id,
  owner_name,
  account_type,
  currency,
  posted_balance_cents,
  ROUND(posted_balance_cents / 100.0, 2) AS posted_balance_usd,
  version AS optimistic_lock_version
FROM accounts
ORDER BY posted_balance_cents DESC, account_id ASC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Idempotent Transfers & Account Endpoints`,
        title: `Step 2: Join Transfers with Sender & Receiver Accounts (${title})`,
        concept: `Resolve both foreign keys (\`from_account_id\` and \`to_account_id\`) on \`transfers\` while verifying unique \`idempotency_key\` values.`,
        instructions: `Complete the dual-account join in \`query.sql\` to display both sender and receiver names for each transfer.`,
        starter: `-- Step 2 Starter (${slug}): Transfers joined with sender account
SELECT
  t.transfer_id,
  t.idempotency_key,
  fa.owner_name AS sender_account,
  t.to_account_id,
  t.amount_cents,
  t.status
FROM transfers AS t
INNER JOIN accounts AS fa
  ON fa.account_id = t.from_account_id
ORDER BY t.transfer_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Dual-endpoint transfer audit with USD conversion
SELECT
  t.transfer_id,
  t.idempotency_key,
  fa.owner_name AS sender_account,
  ta.owner_name AS receiver_account,
  ROUND(t.amount_cents / 100.0, 2) AS transfer_usd,
  t.status,
  t.created_at
FROM transfers AS t
INNER JOIN accounts AS fa
  ON fa.account_id = t.from_account_id
INNER JOIN accounts AS ta
  ON ta.account_id = t.to_account_id
ORDER BY t.transfer_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Double-Entry Conservation Invariant`,
        title: `Step 3: Production Double-Entry Zero-Sum Audit (${title})`,
        concept: `Verify the fundamental ACID ledger invariant: every posted transfer has matching debit and credit legs in \`journal_entries\` summing to zero net drift.`,
        instructions: `Execute the double-entry conservation audit in \`query.sql\` and confirm \`net_balance_cents = 0\` across all transfers.`,
        starter: `-- Step 3 Starter (${slug}): Join transfers with journal_entries legs
SELECT
  t.transfer_id,
  t.idempotency_key,
  t.status,
  je.direction,
  je.amount_cents
FROM transfers AS t
INNER JOIN journal_entries AS je
  ON je.transfer_id = t.transfer_id
ORDER BY t.transfer_id ASC, je.entry_id ASC;`,
        solution: `-- Dataset: fintech_ledger | ${title} (${slug}) — Double-Entry Conservation Audit
SELECT
  t.transfer_id,
  t.idempotency_key,
  t.status,
  COUNT(je.entry_id) AS journal_legs,
  SUM(CASE WHEN je.direction = 'debit' THEN je.amount_cents ELSE 0 END) AS total_debit_cents,
  SUM(CASE WHEN je.direction = 'credit' THEN je.amount_cents ELSE 0 END) AS total_credit_cents,
  SUM(CASE WHEN je.direction = 'credit' THEN je.amount_cents ELSE -je.amount_cents END) AS net_balance_cents
FROM transfers AS t
INNER JOIN journal_entries AS je
  ON je.transfer_id = t.transfer_id
GROUP BY t.transfer_id, t.idempotency_key, t.status
ORDER BY t.transfer_id ASC;`
      }
    },
    // 8: fintech_ledger — Card Velocity Window Frames & Account Balance Reconciliation
    {
      datasetId: 'fintech_ledger',
      complexity: { time: 'O(M log M) window partition sort', space: 'O(W) sliding 3-row frame state', pattern: `${mod.title} · ${tag1}` },
      step1: {
        phase: `Phase 1 · ${title}: Corporate Cards & Daily Limit Controls`,
        title: `Step 1: Inspect Issued Cards & Daily Spend Limits (${slug})`,
        concept: `Examine the \`cards\` table in \`fintech_ledger\` to inspect active vs frozen cards and daily limit thresholds.`,
        instructions: `Refine the starter \`cards\` query in \`query.sql\` to convert \`daily_limit_cents\` into \`daily_limit_usd\` and join account owners.`,
        starter: `-- Step 1 Starter (${slug}): Raw cards table inspection
SELECT
  card_id,
  account_id,
  last4,
  daily_limit_cents,
  status
FROM cards
ORDER BY card_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Issued cards enriched with account owner & USD limit
SELECT
  c.card_id,
  a.owner_name,
  c.last4,
  ROUND(c.daily_limit_cents / 100.0, 2) AS daily_limit_usd,
  c.status AS card_status
FROM cards AS c
INNER JOIN accounts AS a
  ON a.account_id = c.account_id
ORDER BY c.daily_limit_cents DESC, c.card_id ASC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Merchant Transaction Spend vs Card Limit`,
        title: `Step 2: Aggregate Merchant Spend per Card (${title})`,
        concept: `Join \`cards\` with \`merchant_txns\` to compare cumulative card spend against \`daily_limit_cents\`.`,
        instructions: `Complete the grouped card spend query in \`query.sql\` to compute \`txn_count\` and \`total_spend_usd\`.`,
        starter: `-- Step 2 Starter (${slug}): Join cards and merchant_txns
SELECT
  c.card_id,
  c.last4,
  mt.merchant,
  mt.amount_cents,
  mt.txn_ts
FROM cards AS c
INNER JOIN merchant_txns AS mt
  ON mt.card_id = c.card_id
ORDER BY mt.txn_ts ASC;`,
        solution: `-- Step 2 Solution (${slug}): Aggregated card spend vs daily limit utilization
SELECT
  c.card_id,
  c.last4,
  c.status AS card_status,
  COUNT(mt.txn_id) AS txn_count,
  ROUND(SUM(mt.amount_cents) / 100.0, 2) AS total_spend_usd,
  ROUND(c.daily_limit_cents / 100.0, 2) AS daily_limit_usd
FROM cards AS c
INNER JOIN merchant_txns AS mt
  ON mt.card_id = c.card_id
GROUP BY c.card_id, c.last4, c.status, c.daily_limit_cents
ORDER BY total_spend_usd DESC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Sliding 3-Transaction Velocity Window`,
        title: `Step 3: Production Sliding Window Card Velocity Audit (${title})`,
        concept: `Use \`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\` partitioned by \`card_id\` to detect rapid consecutive card spend bursts.`,
        instructions: `Execute the sliding-window card velocity query in \`query.sql\` and inspect the window frame results.`,
        starter: `-- Step 3 Starter (${slug}): Ordered merchant transactions per card
SELECT
  txn_id,
  card_id,
  merchant,
  country,
  ROUND(amount_cents / 100.0, 2) AS amount_usd,
  txn_ts
FROM merchant_txns
ORDER BY card_id ASC, txn_ts ASC;`,
        solution: `-- Dataset: fintech_ledger | ${title} (${slug}) — Sliding 3-Txn Card Velocity Window
SELECT
  txn_id,
  card_id,
  merchant,
  country,
  ROUND(amount_cents / 100.0, 2) AS amount_usd,
  txn_ts,
  COUNT(*) OVER (
    PARTITION BY card_id
    ORDER BY txn_ts ASC
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS window_txn_count,
  ROUND(
    SUM(amount_cents) OVER (
      PARTITION BY card_id
      ORDER BY txn_ts ASC
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) / 100.0,
    2
  ) AS rolling_3txn_usd
FROM merchant_txns
ORDER BY card_id ASC, txn_ts ASC;`
      }
    },
    // 9: saas_telemetry — Multi-Step Conversion Funnel & Telemetry Latency Profile
    {
      datasetId: 'saas_telemetry',
      complexity: { time: 'O(E) single-pass conditional pivot', space: 'O(U) user funnel state', pattern: `${mod.title} · ${tag0}` },
      step1: {
        phase: `Phase 1 · ${title}: Telemetry Event Stream & Null Latency Guard`,
        title: `Step 1: Filter Non-Null Telemetry Latency Events (${slug})`,
        concept: `Inspect \`user_events\` in \`saas_telemetry\` and apply an explicit \`latency_ms IS NOT NULL\` guard before computing latency statistics.`,
        instructions: `Update the starter query in \`query.sql\` to filter out \`NULL\` latency rows and order by \`latency_ms DESC\`.`,
        starter: `-- Step 1 Starter (${slug}): Raw user_events stream inspection
SELECT
  event_id,
  user_id,
  event_type,
  latency_ms,
  event_ts
FROM user_events
ORDER BY event_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): NULL-safe telemetry event latency filter
SELECT
  event_id,
  user_id,
  event_type,
  latency_ms,
  event_ts
FROM user_events
WHERE latency_ms IS NOT NULL
ORDER BY latency_ms DESC, event_id ASC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Subscription MRR & Invoice Settlement Join`,
        title: `Step 2: Correlate SaaS Tenants with Subscriptions & Invoices (${title})`,
        concept: `Join \`saas_users\`, \`subscriptions\`, and \`invoices\` to compare contracted MRR against paid vs unpaid billing invoices.`,
        instructions: `Complete the tenant revenue rollup in \`query.sql\` to aggregate \`paid_invoices_usd\` and \`unpaid_invoices_usd\`.`,
        starter: `-- Step 2 Starter (${slug}): Join saas_users and subscriptions
SELECT
  u.user_id,
  u.org_name,
  u.plan_tier,
  s.sub_id,
  s.mrr_usd,
  s.status
FROM saas_users AS u
INNER JOIN subscriptions AS s
  ON s.user_id = u.user_id
ORDER BY s.mrr_usd DESC;`,
        solution: `-- Step 2 Solution (${slug}): Tenant MRR and invoice collection reconciliation
SELECT
  u.user_id,
  u.org_name,
  u.plan_tier,
  s.mrr_usd,
  COUNT(i.invoice_id) AS invoice_count,
  COALESCE(SUM(CASE WHEN i.paid = 1 THEN i.amount_usd ELSE 0 END), 0) AS collected_usd,
  COALESCE(SUM(CASE WHEN i.paid = 0 THEN i.amount_usd ELSE 0 END), 0) AS overdue_usd
FROM saas_users AS u
INNER JOIN subscriptions AS s
  ON s.user_id = u.user_id
LEFT JOIN invoices AS i
  ON i.sub_id = s.sub_id
GROUP BY u.user_id, u.org_name, u.plan_tier, s.mrr_usd
ORDER BY s.mrr_usd DESC, u.user_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Cohort Funnel & Telemetry Latency Profile`,
        title: `Step 3: Production SaaS Telemetry Latency & Plan Profile (${title})`,
        concept: `Aggregate event volume, average latency, and peak latency across \`plan_tier\` and \`event_type\` to verify SLA compliance.`,
        instructions: `Execute the production telemetry aggregation in \`query.sql\` and inspect the grouped buckets in the Table Visualizer.`,
        starter: `-- Step 3 Starter (${slug}): Join user_events with saas_users
SELECT
  u.plan_tier,
  e.event_type,
  e.latency_ms
FROM user_events AS e
INNER JOIN saas_users AS u
  ON u.user_id = e.user_id
WHERE e.latency_ms IS NOT NULL
ORDER BY e.latency_ms DESC;`,
        solution: `-- Dataset: saas_telemetry | ${title} (${slug}) — Telemetry Latency Profile by Tier
SELECT
  u.plan_tier,
  e.event_type,
  COUNT(*) AS event_count,
  ROUND(AVG(e.latency_ms), 2) AS avg_latency_ms,
  MAX(e.latency_ms) AS max_latency_ms,
  MIN(e.latency_ms) AS min_latency_ms
FROM user_events AS e
INNER JOIN saas_users AS u
  ON u.user_id = e.user_id
GROUP BY u.plan_tier, e.event_type
ORDER BY event_count DESC, avg_latency_ms DESC;`
      }
    },
    // 10: social_graph — Graph Follower Reachability, Post Engagement & Shard Co-Location
    {
      datasetId: 'social_graph',
      complexity: { time: 'O(V + E) graph adjacency join', space: 'O(V) profile state', pattern: `${mod.title} · ${tag0}` },
      step1: {
        phase: `Phase 1 · ${title}: Creator Profile & Reputation Scan`,
        title: `Step 1: Inspect Creator Profiles & Reputation Scores (${slug})`,
        concept: `Query \`profiles\` in \`social_graph\` to rank database engineering creators by reputation score.`,
        instructions: `Refine the starter \`profiles\` query in \`query.sql\` to classify creators with \`reputation >= 500\` as \`'CORE_MAINTAINER'\`.`,
        starter: `-- Step 1 Starter (${slug}): Raw social_graph profiles scan
SELECT
  user_id,
  handle,
  reputation
FROM profiles
ORDER BY user_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Creator reputation ranking & tier classification
SELECT
  user_id,
  handle,
  reputation,
  CASE
    WHEN reputation >= 500 THEN 'CORE_MAINTAINER'
    ELSE 'COMMUNITY_AUTHOR'
  END AS contributor_tier
FROM profiles
ORDER BY reputation DESC, user_id ASC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Directed Follow Graph & Follower Fan-In`,
        title: `Step 2: Aggregate Follower Graph Fan-In & Fan-Out (${title})`,
        concept: `Join \`profiles\` with \`follows\` to compute incoming followers per user while preserving users with zero followers.`,
        instructions: `Complete the \`LEFT JOIN follows\` aggregation in \`query.sql\` to count \`follower_count\` per handle.`,
        starter: `-- Step 2 Starter (${slug}): Inspect directed follows edges
SELECT
  p.user_id,
  p.handle,
  f.follower_id,
  f.followed_at
FROM profiles AS p
LEFT JOIN follows AS f
  ON f.followee_id = p.user_id
ORDER BY p.user_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Follower fan-in count per creator profile
SELECT
  p.user_id,
  p.handle,
  p.reputation,
  COUNT(f.follower_id) AS follower_count
FROM profiles AS p
LEFT JOIN follows AS f
  ON f.followee_id = p.user_id
GROUP BY p.user_id, p.handle, p.reputation
ORDER BY follower_count DESC, p.reputation DESC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Topic Post Engagement & Like Attribution`,
        title: `Step 3: Production Post Engagement & Author Reputation Query (${title})`,
        concept: `Join \`posts\`, author \`profiles\`, and \`post_likes\` to rank technical posts by engagement and author reputation.`,
        instructions: `Run the complete post engagement query in \`query.sql\` and step through the multi-join pipeline.`,
        starter: `-- Step 3 Starter (${slug}): Join posts with author profiles
SELECT
  po.post_id,
  pr.handle AS author_handle,
  po.topic_tag,
  po.published_at
FROM posts AS po
INNER JOIN profiles AS pr
  ON pr.user_id = po.author_id
ORDER BY po.published_at DESC;`,
        solution: `-- Dataset: social_graph | ${title} (${slug}) — Post Engagement & Author Reputation
SELECT
  po.post_id,
  pr.handle AS author_handle,
  pr.reputation AS author_reputation,
  po.topic_tag,
  COUNT(pl.user_id) AS like_count,
  po.published_at
FROM posts AS po
INNER JOIN profiles AS pr
  ON pr.user_id = po.author_id
LEFT JOIN post_likes AS pl
  ON pl.post_id = po.post_id
GROUP BY po.post_id, pr.handle, pr.reputation, po.topic_tag, po.published_at
ORDER BY like_count DESC, pr.reputation DESC, po.post_id ASC;`
      }
    }
  ];

  let bpIndex = 0;
  if (modNum === 1) {
    bpIndex = uIdx % 4;
  } else if (modNum === 2) {
    bpIndex = [1, 2, 7, 3, 0, 2, 7, 1, 3, 8][uIdx % 10];
  } else if (modNum === 3) {
    bpIndex = [0, 2, 3, 4, 10, 1, 4, 10, 2, 0][uIdx % 10];
  } else if (modNum === 4) {
    bpIndex = [0, 4, 1, 7, 9, 3, 4, 0, 8, 1][uIdx % 10];
  } else if (modNum === 5) {
    bpIndex = [5, 10, 4, 1, 6, 5, 10, 3, 4, 5][uIdx % 10];
  } else if (modNum === 6) {
    bpIndex = [5, 8, 6, 0, 8, 5, 6, 8, 4, 5][uIdx % 10];
  } else if (modNum === 7) {
    bpIndex = [3, 1, 7, 10, 2, 3, 4, 7, 10, 3][uIdx % 10];
  } else if (modNum === 8) {
    bpIndex = [6, 1, 9, 4, 0, 6, 9, 1, 4, 6][uIdx % 10];
  } else if (modNum === 9) {
    bpIndex = [9, 8, 10, 6, 2, 9, 8, 10, 7, 9][uIdx % 10];
  } else if (modNum === 10 || modNum === 11 || modNum === 12) {
    bpIndex = [2, 1, 8, 9, 4, 0, 7, 3, 5, 2][(uIdx + modNum) % 10];
  } else if (modNum === 13 || modNum === 14 || modNum === 15) {
    bpIndex = [7, 8, 2, 7, 8, 9, 7, 8, 3, 7][uIdx % 10];
  } else if (modNum === 16) {
    bpIndex = [9, 1, 0, 9, 3, 8, 9, 1, 4, 9][uIdx % 10];
  } else if (modNum === 17) {
    bpIndex = [10, 7, 9, 10, 8, 0, 10, 7, 9, 10][uIdx % 10];
  } else {
    bpIndex = [2, 7, 9, 8, 5, 1, 4, 10, 3, 0][uIdx % 10];
  }

  return blueprints[bpIndex];
}

function generateGuidedLabEntry(mod, unit, uIdx) {
  const slug = unit.slug;
  const title = unit.title;
  const excerpt = unit.archive?.excerpt || title;
  const bp = buildProgressiveLabSteps(mod, unit, uIdx || 0);
  const datasetId = bp.datasetId;
  const referenceSql = bp.step3.solution;

  return {
    title: `${title} — Interactive Guided SQL Lab`,
    summary: excerpt,
    language: 'sql',
    activeFile: 'query.sql',
    datasetId,
    referenceSql,
    complexity: bp.complexity,
    steps: [
      {
        id: 'step-1',
        phase: bp.step1.phase,
        title: bp.step1.title,
        concept: bp.step1.concept,
        instructions: bp.step1.instructions,
        hint: bp.step1.solution,
        file: 'query.sql',
        targetFile: 'query.sql',
        starterCode: bp.step1.starter,
        solutionCode: bp.step1.solution
      },
      {
        id: 'step-2',
        phase: bp.step2.phase,
        title: bp.step2.title,
        concept: bp.step2.concept,
        instructions: bp.step2.instructions,
        hint: bp.step2.solution,
        file: 'query.sql',
        targetFile: 'query.sql',
        starterCode: bp.step2.starter,
        solutionCode: bp.step2.solution
      },
      {
        id: 'step-3',
        phase: bp.step3.phase,
        title: bp.step3.title,
        concept: bp.step3.concept,
        instructions: bp.step3.instructions,
        hint: bp.step3.solution,
        file: 'query.sql',
        targetFile: 'query.sql',
        starterCode: bp.step3.starter,
        solutionCode: bp.step3.solution
      }
    ],
    starterCode: bp.step1.starter,
    solutionCode: referenceSql
  };
}

const contentDir = path.join(__dirname, '..', 'data', 'content');
const questionsDir = path.join(__dirname, '..', 'data', 'questions');
const writeAllFiles = process.argv.includes('--all');
if (writeAllFiles) {
  fs.mkdirSync(contentDir, { recursive: true });
  fs.mkdirSync(questionsDir, { recursive: true });
}

const allGuidedLabs = {};
let globalUnitIdx = 0;
let totalQuestionsCount = 0;

for (const part of curriculum.parts) {
  for (const mod of part.modules) {
    const modId = mod.id; // e.g. 'm01'
    const numStr = mod.legacyNumber || modId.replace('m', ''); // e.g. '01'
    const modSlug = MODULE_SLUGS[modId] || modId;

    const modContentObj = {};
    const modQuestionsObj = {};

    mod.units.forEach((unit, uIdx) => {
      if (writeAllFiles) {
        modContentObj[unit.slug] = generateUnitContent(mod, unit, globalUnitIdx, uIdx);
        const qs = generateUnitQuestions(mod, unit, globalUnitIdx, uIdx);
        modQuestionsObj[unit.slug] = qs;
        totalQuestionsCount += qs.length;
      }
      allGuidedLabs[unit.slug] = generateGuidedLabEntry(mod, unit, uIdx);
      globalUnitIdx++;
    });

    if (writeAllFiles) {
      const contentFilePath = path.join(contentDir, `m${numStr}-${modSlug}.js`);
      const contentJs = `// SQL In Depth — Module ${modId.toUpperCase()}: ${mod.title}\nwindow.MODULE_CONTENT = window.MODULE_CONTENT || {};\nwindow.MODULE_CONTENT[${JSON.stringify(modId)}] = ${JSON.stringify(modContentObj, null, 2)};\n`;
      fs.writeFileSync(contentFilePath, contentJs, 'utf8');

      const questionsFilePath = path.join(questionsDir, `q${numStr}-${modSlug}.js`);
      let qLines = `// SQL In Depth — Question Bank ${modId.toUpperCase()}: ${mod.title}\nwindow.QUESTION_BANK = window.QUESTION_BANK || {};\n`;
      for (const [uSlug, qs] of Object.entries(modQuestionsObj)) {
        qLines += `window.QUESTION_BANK[${JSON.stringify(uSlug)}] = ${JSON.stringify(qs, null, 2)};\n`;
      }
      fs.writeFileSync(questionsFilePath, qLines, 'utf8');
    }
  }
}

// Write data/topic_guided_labs.js
const guidedLabsFilePath = path.join(__dirname, '..', 'data', 'topic_guided_labs.js');
const guidedLabsJs = `// Interactive Guided SQL & Engine Topic Labs — SQL In Depth (All 180 Topics)
(function() {
  'use strict';

  var labs = ${JSON.stringify(allGuidedLabs, null, 2)};

  function buildFallbackSqlLab(slug, title, fallbackSql) {
    var safeTitle = title || slug || 'Interactive SQL Lab';
    var step1Starter = "SELECT customer_id, name, tier, country FROM customers ORDER BY customer_id ASC LIMIT 8;";
    var step1Solution = "SELECT customer_id, name, tier, country, COALESCE(referred_by, 0) AS referrer_id FROM customers WHERE country IN ('US', 'IN', 'GB', 'DE') ORDER BY customer_id ASC LIMIT 8;";
    var step2Starter = "SELECT c.customer_id, c.name, o.order_id, o.total_cents FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' ORDER BY c.customer_id ASC;";
    var refSql = fallbackSql || "SELECT c.customer_id, c.name, c.tier, COUNT(o.order_id) AS completed_orders, ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS spend_usd FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' GROUP BY c.customer_id, c.name, c.tier ORDER BY spend_usd DESC;";
    var step3Starter = "SELECT c.customer_id, c.name, COUNT(o.order_id) AS completed_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed' GROUP BY c.customer_id, c.name ORDER BY completed_orders DESC;";
    return {
      title: safeTitle + ' — Interactive Guided SQL Lab',
      summary: 'Progressive relational query construction, clause-by-clause table visualization, and execution plan verification.',
      language: 'sql',
      activeFile: 'query.sql',
      datasetId: 'ecommerce',
      referenceSql: refSql,
      complexity: {
        time: 'O(N) scan / O(log_B N) indexed',
        space: 'O(G) grouped tuple state',
        pattern: 'Relational SQL Execution'
      },
      steps: [
        {
          id: 'step-1',
          phase: 'Phase 1 · Domain Projection & Cohort Filtering',
          title: 'Step 1: Inspect Customer Cohort Attributes (' + safeTitle + ')',
          concept: 'Project core domain columns and apply NULL-safe attribute defaults.',
          instructions: 'Run or edit query.sql to filter the customer cohort and step through the live Table Visualizer.',
          hint: step1Solution,
          file: 'query.sql',
          targetFile: 'query.sql',
          starterCode: step1Starter,
          solutionCode: step1Solution
        },
        {
          id: 'step-2',
          phase: 'Phase 2 · Outer Join & Customer Order Fold',
          title: 'Step 2: Left Join Completed Orders (' + safeTitle + ')',
          concept: 'Combine customer and order relations without dropping zero-order accounts.',
          instructions: 'Complete the LEFT JOIN and GROUP BY rollup in query.sql and inspect each intermediate clause.',
          hint: refSql,
          file: 'query.sql',
          targetFile: 'query.sql',
          starterCode: step2Starter,
          solutionCode: refSql
        },
        {
          id: 'step-3',
          phase: 'Phase 3 · Production Query & Plan Verification',
          title: 'Step 3: Production Query & Execution Plan Verification (' + safeTitle + ')',
          concept: 'Verify final column projections, ordering, and physical B+Tree access paths.',
          instructions: 'Execute the complete production query in query.sql and run automated SQL assertions.',
          hint: refSql,
          file: 'query.sql',
          targetFile: 'query.sql',
          starterCode: step3Starter,
          solutionCode: refSql
        }
      ],
      starterCode: step1Starter,
      solutionCode: refSql
    };
  }

  window.TOPIC_GUIDED_LABS = labs;
  window.TopicGuidedLabs = {
    getLab: function(slug, fallbackTitle, fallbackSql) {
      return labs[slug] || buildFallbackSqlLab(slug, fallbackTitle, fallbackSql);
    },
    hasCuratedLab: function(slug) {
      return Boolean(labs[slug]);
    },
    getAllCuratedSlugs: function() {
      return Object.keys(labs);
    }
  };
})();
`;
fs.writeFileSync(guidedLabsFilePath, guidedLabsJs, 'utf8');

console.log(`✓ Generated data/topic_guided_labs.js for ${globalUnitIdx} units${writeAllFiles ? ` plus 18 module content files and 18 question bank files (${totalQuestionsCount} questions)` : ''}.`);

