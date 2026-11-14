'use strict';

/**
 * Capstones 10–18 (Storage, Optimizer, Concurrency, Columnar, Sharding & Tuning),
 * Module 1 single-table foundational SQL labs, and blueprint coaching hints.
 */

function buildCapstoneBlueprintsPart2(mod, unit) {
  const slug = unit.slug;
  const title = unit.title;
  const capstones = {
    'build-btree-index-advisor': {
      datasetId: 'ecommerce',
      complexity: { time: 'O(log_B N + K) composite index range seek', space: 'O(1) index cursor', pattern: 'Selectivity Profiling & Composite (Equality, Range) Seek' },
      step1: {
        phase: 'Phase 1 · Column Cardinality & Selectivity Profiling',
        title: `Step 1: Measure Column NDV & Selectivity on Orders (${slug})`,
        concept: 'High-NDV columns (`customer_id`, `created_at`) narrow B+Tree seeks faster than low-cardinality `status`, unless paired in a composite index.',
        instructions: 'Compute `total_rows`, `distinct_customers`, `distinct_statuses`, and `distinct_promo_codes` across `orders` in a single summary row.',
        hint: 'Project `COUNT(*) AS total_rows`, `COUNT(DISTINCT customer_id) AS distinct_customers`, `COUNT(DISTINCT status) AS distinct_statuses`, and `COUNT(DISTINCT discount_code) AS distinct_promo_codes`.',
        starter: `-- Step 1 Starter (${slug}): Basic order row count\nSELECT\n  COUNT(*) AS total_rows\nFROM orders;`,
        solution: `-- Step 1 Solution (${slug}): NDV cardinality profile for index key ordering\nSELECT\n  COUNT(*) AS total_rows,\n  COUNT(DISTINCT customer_id) AS distinct_customers,\n  COUNT(DISTINCT status) AS distinct_statuses,\n  COUNT(DISTINCT discount_code) AS distinct_promo_codes\nFROM orders;`
      },
      step2: {
        phase: 'Phase 2 · Equality-Before-Range Composite Index Seek',
        title: `Step 2: Query Composite Key (customer_id, status) + Range (${slug})`,
        concept: 'Place exact equality predicates (`status = \'completed\'`) before range predicates (`created_at >= \'2025-03-01\'`) to preserve contiguous B+Tree leaf scans.',
        instructions: 'Filter `orders` where `status = \'completed\' AND created_at >= \'2025-03-01\'`, projecting `order_id`, `customer_id`, `total_cents`, and `created_at` ordered by `created_at ASC, order_id ASC`.',
        hint: 'Use `WHERE status = \'completed\' AND created_at >= \'2025-03-01\'` and `ORDER BY created_at ASC, order_id ASC`.',
        starter: `-- Step 2 Starter (${slug}): Unfiltered orders scan\nSELECT\n  order_id,\n  customer_id,\n  status,\n  total_cents,\n  created_at\nFROM orders\nORDER BY order_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Equality + range predicate aligned with B+Tree leaf order\nSELECT\n  order_id,\n  customer_id,\n  total_cents,\n  created_at\nFROM orders\nWHERE status = 'completed'\n  AND created_at >= '2025-03-01'\nORDER BY created_at ASC, order_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · Covering Index-Only Projection on Catalog Index',
        title: `Step 3: Execute Covering Scan on (category_id, price_cents DESC) (${slug})`,
        concept: 'Projecting narrow key/included columns ordered along `idx_products_category_price (category_id, price_cents DESC)` eliminates extra sort passes.',
        instructions: 'Filter `products` to `category_id IN (20, 30) AND is_active = 1`, projecting `category_id`, `sku`, `ROUND(price_cents / 100.0, 2) AS price_usd`, and `stock_qty` ordered by `category_id ASC, price_cents DESC`.',
        hint: 'Add `WHERE category_id IN (20, 30) AND is_active = 1` and align `ORDER BY category_id ASC, price_cents DESC` with the composite index order.',
        starter: `-- Step 3 Starter (${slug}): Unindexed sort order across all categories\nSELECT\n  category_id,\n  sku,\n  price_cents\nFROM products\nORDER BY sku ASC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug})\nSELECT\n  category_id,\n  sku,\n  ROUND(price_cents / 100.0, 2) AS price_usd,\n  stock_qty\nFROM products\nWHERE category_id IN (20, 30)\n  AND is_active = 1\nORDER BY category_id ASC, price_cents DESC;`
      }
    },

    'build-visual-explain-plan-analyzer': {
      datasetId: 'ecommerce',
      complexity: { time: 'O(log_B N + M) SARGable range + pre-aggregated hash join', space: 'O(C) grouped customer hash', pattern: 'SARGability Rewrite & Subquery Unnesting' },
      step1: {
        phase: 'Phase 1 · Rewriting Non-SARGable Function Wrappers',
        title: `Step 1: Rewrite SUBSTR(created_at) into Index Range Seek (${slug})`,
        concept: 'Wrapping `created_at` in `SUBSTR(created_at, 1, 7)` forces a full table scan; rewriting to half-open bounds `created_at >= ... AND created_at < ...` unlocks `idx_orders_created_at`.',
        instructions: 'Replace `SUBSTR(created_at, 1, 7) = \'2025-03\'` in `query.sql` with SARGable range bounds `created_at >= \'2025-03-01\' AND created_at < \'2025-04-01\'` ordered by `created_at ASC, order_id ASC`.',
        hint: 'Remove `SUBSTR(created_at, 1, 7)` and write `WHERE created_at >= \'2025-03-01\' AND created_at < \'2025-04-01\'`.',
        starter: `-- Step 1 Starter (${slug}): Non-SARGable function wrapper defeating idx_orders_created_at\nSELECT\n  order_id,\n  customer_id,\n  status,\n  total_cents,\n  created_at\nFROM orders\nWHERE SUBSTR(created_at, 1, 7) = '2025-03'\nORDER BY created_at ASC, order_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): SARGable half-open timestamp range seek\nSELECT\n  order_id,\n  customer_id,\n  status,\n  total_cents,\n  created_at\nFROM orders\nWHERE created_at >= '2025-03-01'\n  AND created_at < '2025-04-01'\nORDER BY created_at ASC, order_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Unnesting Correlated Subqueries into HashAggregate Join',
        title: `Step 2: Replace Per-Row Subquery with Grouped Join (${slug})`,
        concept: 'Replacing repeated correlated subqueries in `SELECT` with a single `GROUP BY customer_id` derived table turns `O(C * O)` loops into one hash pass.',
        instructions: 'Rewrite the correlated subquery into a `LEFT JOIN` against `(SELECT customer_id, COUNT(*) AS completed_cnt, SUM(total_cents) AS spend_cents FROM orders WHERE status = \'completed\' GROUP BY customer_id) AS agg` ordered by `spend_cents DESC, c.customer_id ASC`.',
        hint: 'Pre-aggregate completed orders with `GROUP BY customer_id` in a derived table or CTE, left join to `customers`, and use `COALESCE` for zero-order customers.',
        starter: `-- Step 2 Starter (${slug}): Correlated per-customer subquery anti-pattern\nSELECT\n  c.customer_id,\n  c.name AS customer_name,\n  (SELECT COUNT(*) FROM orders AS o WHERE o.customer_id = c.customer_id AND o.status = 'completed') AS completed_cnt,\n  (SELECT COALESCE(SUM(o.total_cents), 0) FROM orders AS o WHERE o.customer_id = c.customer_id AND o.status = 'completed') AS spend_cents\nFROM customers AS c\nORDER BY spend_cents DESC, c.customer_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Single-pass grouped join eliminating per-row subplans\nSELECT\n  c.customer_id,\n  c.name AS customer_name,\n  COALESCE(agg.completed_cnt, 0) AS completed_cnt,\n  COALESCE(agg.spend_cents, 0) AS spend_cents\nFROM customers AS c\nLEFT JOIN (\n  SELECT\n    customer_id,\n    COUNT(*) AS completed_cnt,\n    SUM(total_cents) AS spend_cents\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY customer_id\n) AS agg\n  ON agg.customer_id = c.customer_id\nORDER BY spend_cents DESC, c.customer_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · Bounded Top-N Heap Sort & Projection Pruning',
        title: `Step 3: Prune Columns & Bound Sort with Top-N LIMIT (${slug})`,
        concept: 'Adding `LIMIT 5` converts an `O(N log N)` full quicksort/spill into an `O(N log K)` bounded in-memory top-N heap.',
        instructions: 'Project `o.order_id`, `c.name AS customer_name`, `c.tier`, and `ROUND(o.total_cents / 100.0, 2) AS order_usd` for completed orders ordered by `o.total_cents DESC, o.order_id ASC LIMIT 5`.',
        hint: 'Filter `WHERE o.status = \'completed\'`, project the 4 narrow columns, and add `ORDER BY o.total_cents DESC, o.order_id ASC LIMIT 5`.',
        starter: `-- Step 3 Starter (${slug}): Unbounded sort over wide join\nSELECT\n  o.order_id,\n  c.name AS customer_name,\n  c.email,\n  c.tier,\n  o.total_cents\nFROM orders AS o\nINNER JOIN customers AS c\n  ON c.customer_id = o.customer_id\nORDER BY o.total_cents DESC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug})\nSELECT\n  o.order_id,\n  c.name AS customer_name,\n  c.tier,\n  ROUND(o.total_cents / 100.0, 2) AS order_usd\nFROM orders AS o\nINNER JOIN customers AS c\n  ON c.customer_id = o.customer_id\nWHERE o.status = 'completed'\nORDER BY o.total_cents DESC, o.order_id ASC\nLIMIT 5;`
      }
    },

    'build-physical-join-execution-engine': {
      datasetId: 'fintech_ledger',
      complexity: { time: 'O(|R| + |S|) in-memory build/probe hash join', space: 'O(min(|R|, |S|)) build hash table', pattern: 'Predicate Pushdown -> Hash Build/Probe -> Sorted Merge' },
      step1: {
        phase: 'Phase 1 · Selective Build-Side Filtering (Predicate Pushdown)',
        title: `Step 1: Filter Checking Accounts for Hash Build Input (${slug})`,
        concept: 'Pushing `account_type = \'checking\'` down before building the in-memory hash table shrinks build memory footprint.',
        instructions: 'Select `account_id`, `owner_name`, `ROUND(posted_balance_cents / 100.0, 2) AS balance_usd`, and `version` from `accounts` where `account_type = \'checking\'` ordered by `account_id ASC`.',
        hint: 'Filter `WHERE account_type = \'checking\'` and convert `posted_balance_cents` via `ROUND(posted_balance_cents / 100.0, 2) AS balance_usd`.',
        starter: `-- Step 1 Starter (${slug}): Unfiltered build relation\nSELECT\n  account_id,\n  owner_name,\n  account_type,\n  posted_balance_cents\nFROM accounts\nORDER BY account_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Pruned checking accounts build side\nSELECT\n  account_id,\n  owner_name,\n  ROUND(posted_balance_cents / 100.0, 2) AS balance_usd,\n  version\nFROM accounts\nWHERE account_type = 'checking'\nORDER BY account_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Equi-Join Probe Across Transfers & Accounts',
        title: `Step 2: Probe Checking Account Outbound Transfers (${slug})`,
        concept: 'Equi-join predicates (`t.from_account_id = a.account_id`) enable `O(1)` average hash-table probes per outer tuple.',
        instructions: 'Inner join `transfers AS t` with `accounts AS a` (`a.account_id = t.from_account_id`) where `a.account_type = \'checking\'`, projecting `t.transfer_id`, `a.owner_name AS sender_name`, `t.to_account_id`, and `ROUND(t.amount_cents / 100.0, 2) AS amount_usd` ordered by `t.transfer_id ASC`.',
        hint: 'Join `accounts AS a ON a.account_id = t.from_account_id`, filter `a.account_type = \'checking\'`, and project `ROUND(t.amount_cents / 100.0, 2) AS amount_usd`.',
        starter: `-- Step 2 Starter (${slug}): Unjoined transfers probe stream\nSELECT\n  transfer_id,\n  from_account_id,\n  to_account_id,\n  amount_cents\nFROM transfers\nORDER BY transfer_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Selective equi-join hash probe\nSELECT\n  t.transfer_id,\n  a.owner_name AS sender_name,\n  t.to_account_id,\n  ROUND(t.amount_cents / 100.0, 2) AS amount_usd\nFROM transfers AS t\nINNER JOIN accounts AS a\n  ON a.account_id = t.from_account_id\nWHERE a.account_type = 'checking'\nORDER BY t.transfer_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · Sort-Merge Ordered Journal Reconciliation',
        title: `Step 3: Merge-Join Accounts & Ordered Journal Postings (${slug})`,
        concept: 'Joining `accounts` (`PK account_id`) with `journal_entries` (`idx_journal_account (account_id, created_at)`) streams pre-sorted runs directly into group aggregation.',
        instructions: 'Join `accounts AS a` with `journal_entries AS j` on `account_id`, grouping by `a.account_id, a.owner_name, a.posted_balance_cents` to verify `entry_count` and `ledger_net_cents` ordered by `a.account_id ASC`.',
        hint: 'Compute `COUNT(j.entry_id) AS entry_count` and `SUM(CASE WHEN j.direction = \'credit\' THEN j.amount_cents ELSE -j.amount_cents END) AS ledger_net_cents` grouped by account.',
        starter: `-- Step 3 Starter (${slug}): Unaggregated account journal join\nSELECT\n  a.account_id,\n  a.owner_name,\n  j.direction,\n  j.amount_cents\nFROM accounts AS a\nINNER JOIN journal_entries AS j\n  ON j.account_id = a.account_id\nORDER BY a.account_id ASC, j.entry_id ASC;`,
        solution: `-- Dataset: fintech_ledger | ${title} (${slug})\nSELECT\n  a.account_id,\n  a.owner_name,\n  COUNT(j.entry_id) AS entry_count,\n  SUM(CASE WHEN j.direction = 'credit' THEN j.amount_cents ELSE -j.amount_cents END) AS ledger_net_cents,\n  a.posted_balance_cents\nFROM accounts AS a\nINNER JOIN journal_entries AS j\n  ON j.account_id = a.account_id\nGROUP BY a.account_id, a.owner_name, a.posted_balance_cents\nORDER BY a.account_id ASC;`
      }
    },

    'build-transaction-anomaly-simulator': {
      datasetId: 'fintech_ledger',
      complexity: { time: 'O(J + A) ACID invariant verification', space: 'O(A) account balance state', pattern: 'ACID Consistency, Idempotency Keys & Write-Skew Guards' },
      step1: {
        phase: 'Phase 1 · Idempotency Key Uniqueness & Settlement Audit',
        title: `Step 1: Verify Idempotent Transfer Records (${slug})`,
        concept: 'Unique `idempotency_key` constraints prevent duplicate network retries from causing lost updates or double-debits under concurrent sessions.',
        instructions: 'Project `transfer_id`, `idempotency_key`, `from_account_id`, `to_account_id`, `ROUND(amount_cents / 100.0, 2) AS amount_usd`, and `status` from `transfers` ordered by `created_at ASC, transfer_id ASC`.',
        hint: 'Include `idempotency_key`, `ROUND(amount_cents / 100.0, 2) AS amount_usd`, and `status`, sorted by `created_at ASC, transfer_id ASC`.',
        starter: `-- Step 1 Starter (${slug}): Transfers without idempotency or USD columns\nSELECT\n  transfer_id,\n  from_account_id,\n  to_account_id,\n  amount_cents\nFROM transfers\nORDER BY transfer_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Idempotency key & status verification\nSELECT\n  transfer_id,\n  idempotency_key,\n  from_account_id,\n  to_account_id,\n  ROUND(amount_cents / 100.0, 2) AS amount_usd,\n  status\nFROM transfers\nORDER BY created_at ASC, transfer_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Detecting Daily Card Limit Write-Skew Exposure',
        title: `Step 2: Audit Card Spend Against Daily Velocity Limits (${slug})`,
        concept: 'Under Snapshot Isolation without row locks or serializable conflict detection, concurrent card authorizations can exceed `daily_limit_cents` (write skew).',
        instructions: 'Join `cards AS c` and `merchant_txns AS mt`, grouping by `c.card_id, c.last4, c.daily_limit_cents` to compute `txn_count`, `posted_spend_cents`, and `limit_breach_flag` (`OVER_DAILY_LIMIT` vs `WITHIN_LIMIT`) ordered by `c.card_id ASC`.',
        hint: 'Compare `SUM(mt.amount_cents)` against `c.daily_limit_cents` in `CASE WHEN SUM(mt.amount_cents) > c.daily_limit_cents THEN \'OVER_DAILY_LIMIT\' ELSE \'WITHIN_LIMIT\' END AS limit_breach_flag`.',
        starter: `-- Step 2 Starter (${slug}): Card limits without aggregated spend check\nSELECT\n  c.card_id,\n  c.last4,\n  c.daily_limit_cents,\n  mt.amount_cents\nFROM cards AS c\nINNER JOIN merchant_txns AS mt\n  ON mt.card_id = c.card_id\nORDER BY c.card_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Detecting write-skew limit breaches across concurrent authorizations\nSELECT\n  c.card_id,\n  c.last4,\n  COUNT(mt.txn_id) AS txn_count,\n  SUM(mt.amount_cents) AS posted_spend_cents,\n  c.daily_limit_cents,\n  CASE\n    WHEN SUM(mt.amount_cents) > c.daily_limit_cents THEN 'OVER_DAILY_LIMIT'\n    ELSE 'WITHIN_LIMIT'\n  END AS limit_breach_flag\nFROM cards AS c\nINNER JOIN merchant_txns AS mt\n  ON mt.card_id = c.card_id\nGROUP BY c.card_id, c.last4, c.daily_limit_cents\nORDER BY c.card_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · End-to-End Account vs Journal Consistency Proof',
        title: `Step 3: Prove Zero Drift Between Accounts & Journal (${slug})`,
        concept: 'Verify ACID consistency across all accounts: materialized `posted_balance_cents` must equal the signed sum of immutable `journal_entries`.',
        instructions: 'Group `accounts INNER JOIN journal_entries` by account to return `account_id`, `owner_name`, `posted_balance_cents`, `journal_balance_cents`, and `drift_cents` (`posted_balance_cents - journal_balance_cents`) ordered by `account_id ASC`.',
        hint: 'Compute `SUM(CASE WHEN j.direction = \'credit\' THEN j.amount_cents ELSE -j.amount_cents END) AS journal_balance_cents` and subtract it from `a.posted_balance_cents` as `drift_cents`.',
        starter: `-- Step 3 Starter (${slug}): Account posted balances only\nSELECT\n  account_id,\n  owner_name,\n  posted_balance_cents,\n  version\nFROM accounts\nORDER BY account_id ASC;`,
        solution: `-- Dataset: fintech_ledger | ${title} (${slug})\nSELECT\n  a.account_id,\n  a.owner_name,\n  a.posted_balance_cents,\n  SUM(CASE WHEN j.direction = 'credit' THEN j.amount_cents ELSE -j.amount_cents END) AS journal_balance_cents,\n  a.posted_balance_cents - SUM(CASE WHEN j.direction = 'credit' THEN j.amount_cents ELSE -j.amount_cents END) AS drift_cents\nFROM accounts AS a\nINNER JOIN journal_entries AS j\n  ON j.account_id = a.account_id\nGROUP BY a.account_id, a.owner_name, a.posted_balance_cents\nORDER BY a.account_id ASC;`
      }
    },

    'build-mvcc-snapshot-storage-engine': {
      datasetId: 'fintech_ledger',
      complexity: { time: 'O(J log J) temporal version chain reconstruction', space: 'O(J) tuple version window', pattern: 'MVCC Tuple Versions, Running Snapshot Balance & CAS' },
      step1: {
        phase: 'Phase 1 · Optimistic Concurrency Tuple Version Inspection',
        title: `Step 1: Inspect Tuple Versions & Next CAS Token (${slug})`,
        concept: 'Each mutation increments `accounts.version` (`version = expected_version`), providing conflict detection equivalent to first-committer-wins.',
        instructions: 'Project `account_id`, `owner_name`, `posted_balance_cents`, `version AS current_xmin_ver`, and `(version + 1) AS next_cas_ver` from `accounts` ordered by `version DESC, account_id ASC`.',
        hint: 'Alias `version AS current_xmin_ver`, compute `(version + 1) AS next_cas_ver`, and sort by `version DESC, account_id ASC`.',
        starter: `-- Step 1 Starter (${slug}): Raw accounts version column\nSELECT\n  account_id,\n  owner_name,\n  posted_balance_cents,\n  version\nFROM accounts\nORDER BY account_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): MVCC / CAS version metadata projection\nSELECT\n  account_id,\n  owner_name,\n  posted_balance_cents,\n  version AS current_xmin_ver,\n  (version + 1) AS next_cas_ver\nFROM accounts\nORDER BY version DESC, account_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Reconstructing Historical Snapshot Balances',
        title: `Step 2: Reconstruct Running Account Balance Timeline (${slug})`,
        concept: 'Each row in `journal_entries` acts as an immutable tuple version; a running window sum reconstructs the visible balance as of every commit timestamp.',
        instructions: 'Project `entry_id`, `account_id`, `direction`, `amount_cents`, `created_at`, and `snapshot_balance_cents` (`SUM(...) OVER (PARTITION BY account_id ORDER BY created_at ASC, entry_id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`) ordered by `account_id ASC, entry_id ASC`.',
        hint: 'Sum `CASE WHEN direction = \'credit\' THEN amount_cents ELSE -amount_cents END` over `(PARTITION BY account_id ORDER BY created_at ASC, entry_id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`.',
        starter: `-- Step 2 Starter (${slug}): Raw journal entries without running snapshot\nSELECT\n  entry_id,\n  account_id,\n  direction,\n  amount_cents,\n  created_at\nFROM journal_entries\nORDER BY account_id ASC, entry_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Point-in-time snapshot balance reconstruction\nSELECT\n  entry_id,\n  account_id,\n  direction,\n  amount_cents,\n  created_at,\n  SUM(CASE WHEN direction = 'credit' THEN amount_cents ELSE -amount_cents END) OVER (\n    PARTITION BY account_id\n    ORDER BY created_at ASC, entry_id ASC\n    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n  ) AS snapshot_balance_cents\nFROM journal_entries\nORDER BY account_id ASC, entry_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · Point-in-Time Snapshot Read As-Of Timestamp',
        title: `Step 3: Evaluate Account Balances As-Of '2025-03-03 23:59:59' (${slug})`,
        concept: 'Filtering immutable ledger entries by `created_at <= snapshot_ts` reproduces an exact historical MVCC read without blocking concurrent writers.',
        instructions: 'Join `accounts AS a` with `journal_entries AS j` (`j.created_at <= \'2025-03-03 23:59:59\'`), grouping by account to compare `as_of_balance_cents` against current `a.posted_balance_cents` ordered by `a.account_id ASC`.',
        hint: 'Use `LEFT JOIN journal_entries AS j ON j.account_id = a.account_id AND j.created_at <= \'2025-03-03 23:59:59\'` and wrap the signed `SUM` in `COALESCE(..., 0) AS as_of_balance_cents`.',
        starter: `-- Step 3 Starter (${slug}): Latest balances without historical snapshot filter\nSELECT\n  a.account_id,\n  a.owner_name,\n  a.posted_balance_cents\nFROM accounts AS a\nORDER BY a.account_id ASC;`,
        solution: `-- Dataset: fintech_ledger | ${title} (${slug})\nSELECT\n  a.account_id,\n  a.owner_name,\n  COALESCE(\n    SUM(CASE WHEN j.direction = 'credit' THEN j.amount_cents ELSE -j.amount_cents END),\n    0\n  ) AS as_of_balance_cents,\n  a.posted_balance_cents AS latest_balance_cents\nFROM accounts AS a\nLEFT JOIN journal_entries AS j\n  ON j.account_id = a.account_id\n  AND j.created_at <= '2025-03-03 23:59:59'\nGROUP BY a.account_id, a.owner_name, a.posted_balance_cents\nORDER BY a.account_id ASC;`
      }
    },

    'build-slotted-page-wal-engine': {
      datasetId: 'fintech_ledger',
      complexity: { time: 'O(J) sequential WAL log replay', space: 'O(A) dirty page state table', pattern: 'Tuple Byte Footprint & Sequential WAL Redo Replay' },
      step1: {
        phase: 'Phase 1 · Estimating Variable-Length Slotted Tuple Widths',
        title: `Step 1: Measure Tuple Header + Variable String Payload Bytes (${slug})`,
        concept: 'In an 8KB slotted page, variable-width `TEXT` fields (`owner_name`, `account_type`, `currency`) plus fixed integer columns determine how many tuples fit per page.',
        instructions: 'Project `account_id`, `owner_name`, `LENGTH(owner_name) AS name_bytes`, and `(24 + LENGTH(owner_name) + LENGTH(account_type) + LENGTH(currency) + 16) AS est_tuple_bytes` from `accounts` ordered by `est_tuple_bytes DESC, account_id ASC`.',
        hint: 'Compute `(24 + LENGTH(owner_name) + LENGTH(account_type) + LENGTH(currency) + 16) AS est_tuple_bytes` and order by `est_tuple_bytes DESC, account_id ASC`.',
        starter: `-- Step 1 Starter (${slug}): Account strings without byte-width estimation\nSELECT\n  account_id,\n  owner_name,\n  account_type,\n  currency\nFROM accounts\nORDER BY account_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Slotted-page tuple width estimation\nSELECT\n  account_id,\n  owner_name,\n  LENGTH(owner_name) AS name_bytes,\n  (24 + LENGTH(owner_name) + LENGTH(account_type) + LENGTH(currency) + 16) AS est_tuple_bytes\nFROM accounts\nORDER BY est_tuple_bytes DESC, account_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Assigning Monotonic WAL LSN Offsets to Log Records',
        title: `Step 2: Sequence Append-Only Journal Records by LSN Order (${slug})`,
        concept: 'Write-Ahead Log records are ordered monotonically by Log Sequence Number (`LSN`) so crash recovery replays mutations deterministically.',
        instructions: 'Project `entry_id`, `transfer_id`, `account_id`, `direction`, `amount_cents`, and `(ROW_NUMBER() OVER (ORDER BY created_at ASC, entry_id ASC) * 64) AS simulated_lsn_offset` from `journal_entries` ordered by `simulated_lsn_offset ASC`.',
        hint: 'Multiply `ROW_NUMBER() OVER (ORDER BY created_at ASC, entry_id ASC)` by `64` and alias it as `simulated_lsn_offset`.',
        starter: `-- Step 2 Starter (${slug}): Unsequenced journal records\nSELECT\n  entry_id,\n  transfer_id,\n  account_id,\n  direction,\n  amount_cents\nFROM journal_entries\nORDER BY entry_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Monotonic WAL LSN offset assignment\nSELECT\n  entry_id,\n  transfer_id,\n  account_id,\n  direction,\n  amount_cents,\n  (ROW_NUMBER() OVER (ORDER BY created_at ASC, entry_id ASC) * 64) AS simulated_lsn_offset\nFROM journal_entries\nORDER BY simulated_lsn_offset ASC;`
      },
      step3: {
        phase: 'Phase 3 · ARIES Redo Pass Verification Against Committed Transfers',
        title: `Step 3: Replay Committed WAL Records & Verify Page State (${slug})`,
        concept: 'During ARIES Redo, committed transaction log records (`t.status = \'posted\'`) are replayed to reconstruct exact post-crash account balances.',
        instructions: 'Join `journal_entries AS j`, `transfers AS t` (`t.status = \'posted\'`), and `accounts AS a`, grouping by `a.account_id, a.owner_name, a.posted_balance_cents` to verify `replayed_wal_records` and `redo_balance_cents` ordered by `a.account_id ASC`.',
        hint: 'Join `transfers AS t ON t.transfer_id = j.transfer_id` with `WHERE t.status = \'posted\'`, and compute `COUNT(j.entry_id) AS replayed_wal_records` and signed `redo_balance_cents`.',
        starter: `-- Step 3 Starter (${slug}): Join journal entries with transfers\nSELECT\n  j.entry_id,\n  j.account_id,\n  t.status,\n  j.direction,\n  j.amount_cents\nFROM journal_entries AS j\nINNER JOIN transfers AS t\n  ON t.transfer_id = j.transfer_id\nORDER BY j.entry_id ASC;`,
        solution: `-- Dataset: fintech_ledger | ${title} (${slug})\nSELECT\n  a.account_id,\n  a.owner_name,\n  COUNT(j.entry_id) AS replayed_wal_records,\n  SUM(CASE WHEN j.direction = 'credit' THEN j.amount_cents ELSE -j.amount_cents END) AS redo_balance_cents,\n  a.posted_balance_cents\nFROM journal_entries AS j\nINNER JOIN transfers AS t\n  ON t.transfer_id = j.transfer_id\nINNER JOIN accounts AS a\n  ON a.account_id = j.account_id\nWHERE t.status = 'posted'\nGROUP BY a.account_id, a.owner_name, a.posted_balance_cents\nORDER BY a.account_id ASC;`
      }
    },

    'build-columnar-compression-query-engine': {
      datasetId: 'saas_telemetry',
      complexity: { time: 'O(N / B) vectorized column scan + zone-map skip', space: 'O(D) dictionary symbol table', pattern: 'Dictionary NDV Profiling, Zone-Map Min/Max & Columnar Rollup' },
      step1: {
        phase: 'Phase 1 · Dictionary vs RLE Cardinality Profiling',
        title: `Step 1: Profile Column Cardinality for Compression Codec Choice (${slug})`,
        concept: 'Low-cardinality string columns (`event_type` with 4 distinct values across 13 rows) compress tightly with dictionary + RLE encoding.',
        instructions: 'Query `user_events` to return `total_rows`, `distinct_event_types`, `distinct_users`, and `ROUND((COUNT(*) * 1.0) / COUNT(DISTINCT event_type), 2) AS avg_rows_per_symbol`.',
        hint: 'Project `COUNT(*) AS total_rows`, `COUNT(DISTINCT event_type) AS distinct_event_types`, `COUNT(DISTINCT user_id) AS distinct_users`, and `ROUND((COUNT(*) * 1.0) / COUNT(DISTINCT event_type), 2) AS avg_rows_per_symbol`.',
        starter: `-- Step 1 Starter (${slug}): Event row count\nSELECT\n  COUNT(*) AS total_rows,\n  COUNT(DISTINCT event_type) AS distinct_event_types\nFROM user_events;`,
        solution: `-- Step 1 Solution (${slug}): Columnar dictionary compression ratio profile\nSELECT\n  COUNT(*) AS total_rows,\n  COUNT(DISTINCT event_type) AS distinct_event_types,\n  COUNT(DISTINCT user_id) AS distinct_users,\n  ROUND((COUNT(*) * 1.0) / COUNT(DISTINCT event_type), 2) AS avg_rows_per_symbol\nFROM user_events;`
      },
      step2: {
        phase: 'Phase 2 · Zone-Map (Min/Max) Row-Group Metadata Construction',
        title: `Step 2: Build Per-Month Zone-Map Min/Max Headers (${slug})`,
        concept: 'Columnar engines store `(min, max)` headers per row group/stripe so predicates outside `[min_latency, max_latency]` skip entire blocks without decompression.',
        instructions: 'Group `user_events` by `SUBSTR(event_ts, 1, 7) AS stripe_month` to compute `row_count`, `min_latency_ms`, `max_latency_ms`, `min_ts`, and `max_ts` ordered by `stripe_month ASC`.',
        hint: 'Group by `SUBSTR(event_ts, 1, 7)` and compute `COUNT(*) AS row_count`, `MIN(latency_ms) AS min_latency_ms`, `MAX(latency_ms) AS max_latency_ms`, `MIN(event_ts) AS min_ts`, and `MAX(event_ts) AS max_ts`.',
        starter: `-- Step 2 Starter (${slug}): Raw event timestamps and latencies\nSELECT\n  SUBSTR(event_ts, 1, 7) AS stripe_month,\n  latency_ms,\n  event_ts\nFROM user_events\nORDER BY event_ts ASC;`,
        solution: `-- Step 2 Solution (${slug}): Row-group Zone-Map min/max synopsis\nSELECT\n  SUBSTR(event_ts, 1, 7) AS stripe_month,\n  COUNT(*) AS row_count,\n  MIN(latency_ms) AS min_latency_ms,\n  MAX(latency_ms) AS max_latency_ms,\n  MIN(event_ts) AS min_ts,\n  MAX(event_ts) AS max_ts\nFROM user_events\nGROUP BY SUBSTR(event_ts, 1, 7)\nORDER BY stripe_month ASC;`
      },
      step3: {
        phase: 'Phase 3 · Late-Materialized Columnar Scan Over Narrow Columns',
        title: `Step 3: Aggregate Compressed Columns by Dictionary Symbol (${slug})`,
        concept: 'Reading only `(event_type, latency_ms)` touches 2 column stripes instead of full wide tuples, maximizing CPU cache locality.',
        instructions: 'Aggregate `user_events` by `event_type` to return `event_count`, `ROUND(AVG(latency_ms), 2) AS avg_latency_ms`, and `MAX(latency_ms) AS peak_latency_ms` ordered by `event_count DESC, avg_latency_ms ASC`.',
        hint: 'Group `user_events` by `event_type`, compute `COUNT(*)`, `ROUND(AVG(latency_ms), 2)`, and `MAX(latency_ms)`, and sort by `event_count DESC, avg_latency_ms ASC`.',
        starter: `-- Step 3 Starter (${slug}): Narrow two-column projection\nSELECT\n  event_type,\n  latency_ms\nFROM user_events\nORDER BY event_type ASC;`,
        solution: `-- Dataset: saas_telemetry | ${title} (${slug})\nSELECT\n  event_type,\n  COUNT(*) AS event_count,\n  ROUND(AVG(latency_ms), 2) AS avg_latency_ms,\n  MAX(latency_ms) AS peak_latency_ms\nFROM user_events\nGROUP BY event_type\nORDER BY event_count DESC, avg_latency_ms ASC;`
      }
    },

    'build-sharded-query-router': {
      datasetId: 'social_graph',
      complexity: { time: 'O(E) shard-key co-location check', space: 'O(S) shard partition buckets', pattern: 'Shard Key Routing, Co-Location vs Cross-Shard Scatter-Gather' },
      step1: {
        phase: 'Phase 1 · Deterministic Shard Key Assignment',
        title: `Step 1: Route User Profiles Across 3 Virtual Shards (${slug})`,
        concept: 'Routing `profiles` by `user_id % 3` deterministically maps point lookups `WHERE user_id = ?` to a single shard node.',
        instructions: 'Project `user_id`, `handle`, `reputation`, and `(user_id % 3) AS shard_id` from `profiles` ordered by `shard_id ASC, user_id ASC`.',
        hint: 'Compute `(user_id % 3) AS shard_id` and order by `shard_id ASC, user_id ASC`.',
        starter: `-- Step 1 Starter (${slug}): Unrouted profiles table\nSELECT\n  user_id,\n  handle,\n  reputation\nFROM profiles\nORDER BY user_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Deterministic modulo shard routing\nSELECT\n  user_id,\n  handle,\n  reputation,\n  (user_id % 3) AS shard_id\nFROM profiles\nORDER BY shard_id ASC, user_id ASC;`
      },
      step2: {
        phase: 'Phase 2 · Detecting Co-Located vs Cross-Shard Graph Edges',
        title: `Step 2: Classify Local vs Cross-Shard Follow Joins (${slug})`,
        concept: 'When `(follower_id % 3) <> (followee_id % 3)`, traversing an edge requires a distributed network hop or dual-written edge table.',
        instructions: 'Project `follower_id`, `followee_id`, `(follower_id % 3) AS src_shard`, `(followee_id % 3) AS dst_shard`, and `CASE WHEN (follower_id % 3) = (followee_id % 3) THEN \'CO_LOCATED\' ELSE \'CROSS_SHARD\' END AS routing_mode` from `follows` ordered by `follower_id ASC, followee_id ASC`.',
        hint: 'Compare `(follower_id % 3) = (followee_id % 3)` inside `CASE WHEN ... THEN \'CO_LOCATED\' ELSE \'CROSS_SHARD\' END AS routing_mode`.',
        starter: `-- Step 2 Starter (${slug}): Raw follows edge list\nSELECT\n  follower_id,\n  followee_id,\n  followed_at\nFROM follows\nORDER BY follower_id ASC, followee_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Local vs distributed edge classification\nSELECT\n  follower_id,\n  followee_id,\n  (follower_id % 3) AS src_shard,\n  (followee_id % 3) AS dst_shard,\n  CASE\n    WHEN (follower_id % 3) = (followee_id % 3) THEN 'CO_LOCATED'\n    ELSE 'CROSS_SHARD'\n  END AS routing_mode\nFROM follows\nORDER BY follower_id ASC, followee_id ASC;`
      },
      step3: {
        phase: 'Phase 3 · Scatter-Gather Shard Load & Engagement Balance',
        title: `Step 3: Aggregate Scatter-Gather Post & Like Skew per Shard (${slug})`,
        concept: 'Co-locating `posts` by `author_id % 3` keeps author timelines single-shard, while global shard-balance telemetry uses scatter-gather `GROUP BY shard_id`.',
        instructions: 'Group `profiles AS p LEFT JOIN posts AS po ON po.author_id = p.user_id LEFT JOIN post_likes AS pl ON pl.post_id = po.post_id` by `(p.user_id % 3)` to report `shard_id`, `tenant_users`, `authored_posts`, and `likes_received` ordered by `shard_id ASC`.',
        hint: 'Use `(p.user_id % 3) AS shard_id`, `COUNT(DISTINCT p.user_id) AS tenant_users`, `COUNT(DISTINCT po.post_id) AS authored_posts`, and `COUNT(pl.user_id) AS likes_received`.',
        starter: `-- Step 3 Starter (${slug}): Author-to-post join before shard rollup\nSELECT\n  (p.user_id % 3) AS shard_id,\n  p.user_id,\n  po.post_id\nFROM profiles AS p\nLEFT JOIN posts AS po\n  ON po.author_id = p.user_id\nORDER BY shard_id ASC;`,
        solution: `-- Dataset: social_graph | ${title} (${slug})\nSELECT\n  (p.user_id % 3) AS shard_id,\n  COUNT(DISTINCT p.user_id) AS tenant_users,\n  COUNT(DISTINCT po.post_id) AS authored_posts,\n  COUNT(pl.user_id) AS likes_received\nFROM profiles AS p\nLEFT JOIN posts AS po\n  ON po.author_id = p.user_id\nLEFT JOIN post_likes AS pl\n  ON pl.post_id = po.post_id\nGROUP BY (p.user_id % 3)\nORDER BY shard_id ASC;`
      }
    },

    'build-production-sql-tuning-clinic': {
      datasetId: 'ecommerce',
      complexity: { time: 'O(log_B N + K) keyset cursor seek + eager batch join', space: 'O(K) page tuple buffer', pattern: 'Keyset (Seek) Pagination & N+1 Eager Join Elimination' },
      step1: {
        phase: 'Phase 1 · Deterministic Keyset Cursor Page 1',
        title: `Step 1: Fetch Page 1 with Deterministic Tie-Breaker (${slug})`,
        concept: 'Keyset pagination requires a unique deterministic sort suffix (`ORDER BY created_at DESC, order_id DESC`) so no rows are skipped or duplicated across pages.',
        instructions: 'Fetch the newest 5 orders (`order_id`, `customer_id`, `status`, `ROUND(total_cents / 100.0, 2) AS total_usd`, `created_at`) ordered by `created_at DESC, order_id DESC LIMIT 5`.',
        hint: 'Project `ROUND(total_cents / 100.0, 2) AS total_usd` and sort with `ORDER BY created_at DESC, order_id DESC LIMIT 5` (whose last row is cursor `(\'2025-03-05 13:10:00\', 1006)`).',
        starter: `-- Step 1 Starter (${slug}): Non-deterministic sort without tie-breaker or LIMIT\nSELECT\n  order_id,\n  customer_id,\n  status,\n  total_cents,\n  created_at\nFROM orders\nORDER BY created_at DESC;`,
        solution: `-- Step 1 Solution (${slug}): Page 1 keyset anchor query\nSELECT\n  order_id,\n  customer_id,\n  status,\n  ROUND(total_cents / 100.0, 2) AS total_usd,\n  created_at\nFROM orders\nORDER BY created_at DESC, order_id DESC\nLIMIT 5;`
      },
      step2: {
        phase: 'Phase 2 · O(log N) Seek Cursor Page 2 (Replacing OFFSET)',
        title: `Step 2: Seek Page 2 Directly from Cursor ('2025-03-05 13:10:00', 1006) (${slug})`,
        concept: 'Instead of `OFFSET 5` (which scans and discards prior rows), seek directly below the last seen cursor tuple `(created_at, order_id)`.',
        instructions: 'Replace `OFFSET 5` with the keyset predicate `WHERE created_at < \'2025-03-05 13:10:00\' OR (created_at = \'2025-03-05 13:10:00\' AND order_id < 1006)` ordered by `created_at DESC, order_id DESC LIMIT 5`.',
        hint: 'Remove `OFFSET 5` and add `WHERE created_at < \'2025-03-05 13:10:00\' OR (created_at = \'2025-03-05 13:10:00\' AND order_id < 1006)` before `ORDER BY created_at DESC, order_id DESC LIMIT 5`.',
        starter: `-- Step 2 Starter (${slug}): Slow OFFSET pagination scanning and discarding rows\nSELECT\n  order_id,\n  customer_id,\n  status,\n  total_cents,\n  created_at\nFROM orders\nORDER BY created_at DESC, order_id DESC\nLIMIT 5 OFFSET 5;`,
        solution: `-- Step 2 Solution (${slug}): O(log_B N) keyset seek cursor pagination\nSELECT\n  order_id,\n  customer_id,\n  status,\n  ROUND(total_cents / 100.0, 2) AS total_usd,\n  created_at\nFROM orders\nWHERE created_at < '2025-03-05 13:10:00'\n   OR (created_at = '2025-03-05 13:10:00' AND order_id < 1006)\nORDER BY created_at DESC, order_id DESC\nLIMIT 5;`
      },
      step3: {
        phase: 'Phase 3 · Eliminating ORM N+1 Queries via Batched Eager Join',
        title: `Step 3: Collapse N+1 Customer, Item & Payment Queries (${slug})`,
        concept: 'Instead of firing 3 extra queries per order row in application code (`1 + 3N` round-trips), batch-aggregate `order_items` and `LEFT JOIN` customer + payment state in one query.',
        instructions: 'For Page 1 orders (`ORDER BY o.created_at DESC, o.order_id DESC LIMIT 5`), eagerly join `customers`, `payments`, and pre-aggregated `item_counts` (`SUM(quantity) AS total_units`) in a single query.',
        hint: 'Pre-aggregate `SELECT order_id, SUM(quantity) AS total_units FROM order_items GROUP BY order_id` in `WITH item_counts`, join `customers` and `LEFT JOIN payments`, and apply `ORDER BY o.created_at DESC, o.order_id DESC LIMIT 5`.',
        starter: `-- Step 3 Starter (${slug}): Bare Page 1 orders triggering N+1 lookups in app code\nSELECT\n  o.order_id,\n  o.customer_id,\n  o.status,\n  ROUND(o.total_cents / 100.0, 2) AS total_usd,\n  o.created_at\nFROM orders AS o\nORDER BY o.created_at DESC, o.order_id DESC\nLIMIT 5;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug})\nWITH item_counts AS (\n  SELECT\n    order_id,\n    SUM(quantity) AS total_units\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT\n  o.order_id,\n  c.name AS customer_name,\n  c.tier,\n  COALESCE(ic.total_units, 0) AS total_units,\n  ROUND(o.total_cents / 100.0, 2) AS total_usd,\n  COALESCE(pay.status, 'unpaid') AS payment_status,\n  o.created_at\nFROM orders AS o\nINNER JOIN customers AS c\n  ON c.customer_id = o.customer_id\nLEFT JOIN item_counts AS ic\n  ON ic.order_id = o.order_id\nLEFT JOIN payments AS pay\n  ON pay.order_id = o.order_id\nORDER BY o.created_at DESC, o.order_id DESC\nLIMIT 5;`
      }
    }
  };

  return capstones[slug] || null;
}

/**
 * Module 1 (m01: The Relational Model, Tables & SELECT Foundations)
 * Pure single-table foundational SQL labs — zero premature JOINs, GROUP BY, or OVER() windows!
 */
function buildModule01Blueprint(mod, unit, uIdx) {
  const slug = unit.slug;
  const title = unit.title;
  const limitN = 5 + (uIdx % 4);

  if (slug === 'case-stripe-ledger-precision') {
    return {
      datasetId: 'fintech_ledger',
      complexity: { time: 'O(N) exact integer-cents scan', space: 'O(1) tuple projection', pattern: 'Exact Integer Cents vs IEEE-754 Float Drift' },
      step1: {
        phase: `Phase 1 · ${title}: Integer-Cents Ledger Inspection`,
        title: `Step 1: Inspect Integer-Cents Account Balances (${slug})`,
        concept: 'Financial ledgers store integer `posted_balance_cents` (`BIGINT`/`INTEGER`) rather than binary floating-point to prevent `0.1 + 0.2 != 0.3` rounding drift.',
        instructions: 'Project `account_id`, `owner_name`, `account_type`, `currency`, and `posted_balance_cents` from `accounts` ordered by `posted_balance_cents DESC`.',
        hint: 'Add `currency` to the `SELECT` list and change `ORDER BY` to `posted_balance_cents DESC`.',
        starter: `-- Step 1 Starter (${slug}): Unordered account scan\nSELECT\n  account_id,\n  owner_name,\n  account_type,\n  posted_balance_cents\nFROM accounts\nORDER BY account_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Integer-cents balances ordered high-to-low\nSELECT\n  account_id,\n  owner_name,\n  account_type,\n  currency,\n  posted_balance_cents\nFROM accounts\nORDER BY posted_balance_cents DESC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Exact Decimal Presentation`,
        title: `Step 2: Format Cents into Exact 2-Decimal USD (${slug})`,
        concept: 'Keep storage and arithmetic in integer cents, dividing by exact decimal `100.0` with `ROUND(..., 2)` only at presentation time.',
        instructions: 'Project `transfer_id`, `idempotency_key`, `amount_cents`, and `ROUND(amount_cents / 100.0, 2) AS amount_usd` from `transfers` where `amount_cents >= 50000` ordered by `amount_cents DESC, transfer_id ASC`.',
        hint: 'Filter `WHERE amount_cents >= 50000`, add `ROUND(amount_cents / 100.0, 2) AS amount_usd`, and order by `amount_cents DESC, transfer_id ASC`.',
        starter: `-- Step 2 Starter (${slug}): Raw transfers in cents\nSELECT\n  transfer_id,\n  idempotency_key,\n  amount_cents\nFROM transfers\nORDER BY transfer_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Exact decimal USD projection over high-value transfers\nSELECT\n  transfer_id,\n  idempotency_key,\n  amount_cents,\n  ROUND(amount_cents / 100.0, 2) AS amount_usd\nFROM transfers\nWHERE amount_cents >= 50000\nORDER BY amount_cents DESC, transfer_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Signed Cents Direction Expressions`,
        title: `Step 3: Compute Signed Debit/Credit Cents Without Floats (${slug})`,
        concept: 'Use a `CASE` expression over integer `amount_cents` (`+amount_cents` for credits, `-amount_cents` for debits) to preserve exact cent precision.',
        instructions: 'Project `entry_id`, `transfer_id`, `account_id`, `direction`, `amount_cents`, and `CASE WHEN direction = \'credit\' THEN amount_cents ELSE -amount_cents END AS signed_cents` from `journal_entries` ordered by `entry_id ASC`.',
        hint: 'Append `CASE WHEN direction = \'credit\' THEN amount_cents ELSE -amount_cents END AS signed_cents` to the `SELECT` list.',
        starter: `-- Step 3 Starter (${slug}): Unsigned journal legs\nSELECT\n  entry_id,\n  transfer_id,\n  account_id,\n  direction,\n  amount_cents\nFROM journal_entries\nORDER BY entry_id ASC;`,
        solution: `-- Dataset: fintech_ledger | ${title} (${slug})\nSELECT\n  entry_id,\n  transfer_id,\n  account_id,\n  direction,\n  amount_cents,\n  CASE\n    WHEN direction = 'credit' THEN amount_cents\n    ELSE -amount_cents\n  END AS signed_cents\nFROM journal_entries\nORDER BY entry_id ASC;`
      }
    };
  }

  const m01Variants = [
    // Variant A: customers — Declarative SELECT, WHERE, COALESCE & Deterministic ORDER BY
    {
      datasetId: 'ecommerce',
      complexity: { time: 'O(N log K) single-table filter + sort', space: 'O(K) output tuples', pattern: 'FROM -> WHERE -> SELECT -> ORDER BY -> LIMIT' },
      step1: {
        phase: `Phase 1 · ${title}: Relation Projection & Column Aliases`,
        title: `Step 1: Project Customer Attributes & Aliases (${slug})`,
        concept: 'Select explicit attributes rather than `SELECT *` so physical column additions never break downstream consumers.',
        instructions: `Project \`customer_id\`, \`name AS customer_name\`, \`email\`, \`tier\`, and \`country\` from \`customers\` ordered by \`customer_id ASC LIMIT ${limitN}\`.`,
        hint: `Add \`email\` between \`name AS customer_name\` and \`tier\`, keeping \`ORDER BY customer_id ASC LIMIT ${limitN}\`.`,
        starter: `-- Step 1 Starter (${slug}): Minimal customer scan\nSELECT\n  customer_id,\n  name AS customer_name,\n  tier\nFROM customers\nORDER BY customer_id ASC\nLIMIT ${limitN};`,
        solution: `-- Step 1 Solution (${slug}): Explicit attribute projection and aliasing\nSELECT\n  customer_id,\n  name AS customer_name,\n  email,\n  tier,\n  country\nFROM customers\nORDER BY customer_id ASC\nLIMIT ${limitN};`
      },
      step2: {
        phase: `Phase 2 · ${title}: WHERE Predicates & NULL-Safe COALESCE`,
        title: `Step 2: Filter Paid Tiers & Normalize NULL Referrals (${slug})`,
        concept: 'Logical execution evaluates `FROM` -> `WHERE` before `SELECT`; `COALESCE(referred_by, 0)` turns missing referral FKs into explicit sentinel integers.',
        instructions: 'Filter `customers` to `tier IN (\'enterprise\', \'pro\')` and project `customer_id`, `name AS customer_name`, `tier`, `country`, and `COALESCE(referred_by, 0) AS referrer_id` ordered by `customer_id ASC`.',
        hint: 'Add `WHERE tier IN (\'enterprise\', \'pro\')` and include `COALESCE(referred_by, 0) AS referrer_id`.',
        starter: `-- Step 2 Starter (${slug}): Unfiltered customers with raw nullable referred_by\nSELECT\n  customer_id,\n  name AS customer_name,\n  tier,\n  country,\n  referred_by\nFROM customers\nORDER BY customer_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): Paid-tier predicate and NULL-safe referral projection\nSELECT\n  customer_id,\n  name AS customer_name,\n  tier,\n  country,\n  COALESCE(referred_by, 0) AS referrer_id\nFROM customers\nWHERE tier IN ('enterprise', 'pro')\nORDER BY customer_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: CASE Classification & Multi-Key Sorting`,
        title: `Step 3: Classify Acquisition Channel & Sort Cohort (${slug})`,
        concept: 'Combine `IS NULL` Three-Valued Logic checks inside `CASE WHEN` with deterministic multi-column `ORDER BY`.',
        instructions: `Project \`customer_id\`, \`name AS customer_name\`, \`tier\`, \`country\`, and \`CASE WHEN referred_by IS NULL THEN 'DIRECT_SIGNUP' ELSE 'PARTNER_REFERRAL' END AS acquisition_source\` from \`customers\` ordered by \`tier ASC, customer_id ASC LIMIT ${limitN}\`.`,
        hint: `Use \`CASE WHEN referred_by IS NULL THEN 'DIRECT_SIGNUP' ELSE 'PARTNER_REFERRAL' END AS acquisition_source\` (never \`= NULL\`) and end with \`ORDER BY tier ASC, customer_id ASC LIMIT ${limitN}\`.`,
        starter: `-- Step 3 Starter (${slug}): Customers before 3VL acquisition CASE\nSELECT\n  customer_id,\n  name AS customer_name,\n  tier,\n  country,\n  referred_by\nFROM customers\nORDER BY customer_id ASC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug})\nSELECT\n  customer_id,\n  name AS customer_name,\n  tier,\n  country,\n  CASE\n    WHEN referred_by IS NULL THEN 'DIRECT_SIGNUP'\n    ELSE 'PARTNER_REFERRAL'\n  END AS acquisition_source\nFROM customers\nORDER BY tier ASC, customer_id ASC\nLIMIT ${limitN};`
      }
    },
    // Variant B: orders — Predicates, Three-Valued NULL Logic & Promo Classification
    {
      datasetId: 'ecommerce',
      complexity: { time: 'O(N log N) predicate scan + sort', space: 'O(1) tuple state', pattern: 'Three-Valued Logic (TRUE / FALSE / UNKNOWN) & SARGable Predicates' },
      step1: {
        phase: `Phase 1 · ${title}: Range & Set Membership Predicates`,
        title: `Step 1: Filter High-Value Completed & Pending Orders (${slug})`,
        concept: 'Combine `status IN (...)` and numeric comparison `total_cents >= 30000` in `WHERE` before formatting currency.',
        instructions: 'Filter `orders` where `status IN (\'completed\', \'pending\') AND total_cents >= 30000`, projecting `order_id`, `customer_id`, `status`, and `ROUND(total_cents / 100.0, 2) AS total_usd` ordered by `total_cents DESC, order_id ASC`.',
        hint: 'Add `WHERE status IN (\'completed\', \'pending\') AND total_cents >= 30000` and project `ROUND(total_cents / 100.0, 2) AS total_usd`.',
        starter: `-- Step 1 Starter (${slug}): Unfiltered orders scan\nSELECT\n  order_id,\n  customer_id,\n  status,\n  total_cents\nFROM orders\nORDER BY order_id ASC;`,
        solution: `-- Step 1 Solution (${slug}): Compound WHERE filter and USD projection\nSELECT\n  order_id,\n  customer_id,\n  status,\n  ROUND(total_cents / 100.0, 2) AS total_usd\nFROM orders\nWHERE status IN ('completed', 'pending')\n  AND total_cents >= 30000\nORDER BY total_cents DESC, order_id ASC;`
      },
      step2: {
        phase: `Phase 2 · ${title}: Three-Valued NULL Trap in Predicates`,
        title: `Step 2: Preserve NULL Promo Rows When Excluding 'WELCOME5' (${slug})`,
        concept: 'In SQL 3VL, `discount_code <> \'WELCOME5\'` evaluates to `UNKNOWN` when `discount_code IS NULL`, silently dropping un-discounted orders unless guarded with `IS NULL`.',
        instructions: 'Filter `orders` where `discount_code IS NULL OR discount_code <> \'WELCOME5\'`, projecting `order_id`, `status`, `COALESCE(discount_code, \'NONE\') AS promo_code`, and `total_cents` ordered by `order_id ASC`.',
        hint: 'Guard the inequality with `WHERE discount_code IS NULL OR discount_code <> \'WELCOME5\'` and normalize `discount_code` via `COALESCE(discount_code, \'NONE\') AS promo_code`.',
        starter: `-- Step 2 Starter (${slug}): Naive <> filter that accidentally drops NULL discount_code rows!\nSELECT\n  order_id,\n  status,\n  discount_code AS promo_code,\n  total_cents\nFROM orders\nWHERE discount_code <> 'WELCOME5'\nORDER BY order_id ASC;`,
        solution: `-- Step 2 Solution (${slug}): 3VL-safe predicate preserving NULL promo rows\nSELECT\n  order_id,\n  status,\n  COALESCE(discount_code, 'NONE') AS promo_code,\n  total_cents\nFROM orders\nWHERE discount_code IS NULL\n   OR discount_code <> 'WELCOME5'\nORDER BY order_id ASC;`
      },
      step3: {
        phase: `Phase 3 · ${title}: Conditional Deal-Size Banding & Top-K`,
        title: `Step 3: Classify Order Deal Tiers & Return Top ${limitN} (${slug})`,
        concept: 'Evaluate ordered `CASE WHEN` branches top-down and enforce deterministic sorting with `ORDER BY total_cents DESC, order_id ASC`.',
        instructions: `For completed orders (\`status = 'completed'\`), project \`order_id\`, \`customer_id\`, \`ROUND(total_cents / 100.0, 2) AS total_usd\`, \`COALESCE(discount_code, 'NO_CODE') AS promo_code\`, and \`CASE WHEN total_cents >= 90000 THEN 'ENTERPRISE_DEAL' ELSE 'STANDARD_DEAL' END AS deal_band\` ordered by \`total_cents DESC, order_id ASC LIMIT ${limitN}\`.`,
        hint: `Filter \`WHERE status = 'completed'\`, add the \`deal_band\` \`CASE\` expression, and finish with \`ORDER BY total_cents DESC, order_id ASC LIMIT ${limitN}\`.`,
        starter: `-- Step 3 Starter (${slug}): Completed orders without deal band or LIMIT\nSELECT\n  order_id,\n  customer_id,\n  ROUND(total_cents / 100.0, 2) AS total_usd,\n  discount_code\nFROM orders\nWHERE status = 'completed'\nORDER BY total_cents DESC;`,
        solution: `-- Dataset: ecommerce | ${title} (${slug})\nSELECT\n  order_id,\n  customer_id,\n  ROUND(total_cents / 100.0, 2) AS total_usd,\n  COALESCE(discount_code, 'NO_CODE') AS promo_code,\n  CASE\n    WHEN total_cents >= 90000 THEN 'ENTERPRISE_DEAL'\n    ELSE 'STANDARD_DEAL'\n  END AS deal_band\nFROM orders\nWHERE status = 'completed'\nORDER BY total_cents DESC, order_id ASC\nLIMIT ${limitN};`
      }
    }
  ];

  return m01Variants[uIdx % m01Variants.length];
}

/**
 * Coaching hint resolver for generic module blueprints (0..10) so ZERO steps
 * ever have hint === solutionCode.
 */
const BLUEPRINT_HINTS = {
  0: [
    'Filter `WHERE country IN (\'US\', \'IN\', \'GB\', \'DE\')`, project `COALESCE(referred_by, 0) AS referrer_id` and `created_at`, and keep `ORDER BY customer_id ASC LIMIT ...`.',
    'Group `customers LEFT JOIN orders` (`AND o.status = \'completed\'`) by `c.customer_id, c.name, c.tier, c.country`, projecting `COUNT(o.order_id) AS completed_orders` and `ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS settled_spend_usd`.',
    'Add `ROUND(AVG(COALESCE(SUM(o.total_cents), 0)) OVER (PARTITION BY c.tier) / 100.0, 2) AS tier_avg_usd` and sort by `lifetime_value_usd DESC, c.customer_id ASC` with the required `LIMIT`.'
  ],
  1: [
    'Filter `WHERE is_active = 1`, include `category_id`, and compute `ROUND(price_cents / 100.0, 2) AS price_usd` and `ROUND((price_cents * stock_qty) / 100.0, 2) AS stock_value_usd` ordered by `stock_value_usd DESC`.',
    'Add `LEFT JOIN order_items AS oi ON oi.product_id = p.product_id`, group by product and category columns, and project `COALESCE(SUM(oi.quantity), 0) AS units_sold` ordered by `units_sold DESC, price_usd DESC`.',
    'Join `categories` and `LEFT JOIN order_items`, group by product/category attributes, and project `inventory_valuation_usd`, `total_units_sold`, and `realized_revenue_usd` ordered by `inventory_valuation_usd DESC, p.product_id ASC`.'
  ],
  2: [
    'Use `COALESCE(discount_code, \'NO_PROMO\') AS promo_code`, a `CASE WHEN discount_code IS NULL` `promo_state` column, and `ROUND(total_cents / 100.0, 2) AS order_usd` ordered by `total_cents DESC, order_id ASC`.',
    'Add `LEFT JOIN shipments AS s ON s.order_id = o.order_id` and wrap nullable `pay.method`, `pay.status`, and `s.carrier` columns in `COALESCE` (`\'UNPAID\'`, `\'PENDING\'`, `\'NOT_SHIPPED\'`).',
    'Left join both `payments` (`\'UNPAID\'`, `\'AWAITING_SETTLEMENT\'`) and `shipments` (`\'UNFULFILLED\'`), include `c.tier`, and order by `o.total_cents DESC, o.order_id ASC`.'
  ],
  3: [
    'Add a 3-way `CASE` (`>= 4` -> `\'POSITIVE\'`, `= 3` -> `\'NEUTRAL\'`, else `\'CRITICAL\'`) as `sentiment_band`, `COALESCE(comment, \'No written comment\') AS review_text`, and `created_at` ordered by `rating DESC, review_id ASC`.',
    'Group `orders INNER JOIN order_items` by `o.order_id, o.customer_id, o.total_cents` and compute `COUNT(oi.order_item_id)`, `SUM(oi.quantity * oi.unit_price_cents)`, and `(o.total_cents - SUM(oi.quantity * oi.unit_price_cents)) AS adjustment_delta_cents`.',
    'Left join both `order_items` and `product_reviews` onto `products`, using `COUNT(DISTINCT oi.order_item_id)` and `COUNT(DISTINCT r.review_id)` plus `ROUND(COALESCE(AVG(r.rating), 0), 2) AS avg_rating`.'
  ],
  4: [
    'Filter `WHERE salary_usd >= 150000`, wrap `manager_id` in `COALESCE(manager_id, 0) AS reports_to_id`, include `hired_at`, and sort by `salary_usd DESC, emp_id ASC`.',
    'Include `e.title AS employee_role`, `COALESCE(m.name, \'BOARD_OF_DIRECTORS\') AS manager_name`, `COALESCE(m.salary_usd, e.salary_usd) AS manager_salary`, and their difference as `gap_to_manager_usd`.',
    'Project `COALESCE(SUM(e.salary_usd), 0) AS active_payroll_usd` and `ROUND((COALESCE(SUM(e.salary_usd), 0) * 100.0) / d.annual_budget_usd, 1) AS budget_used_pct` with `HAVING COUNT(e.emp_id) >= 1`.'
  ],
  5: [
    'Inner join `employees AS e ON e.emp_id = p.lead_emp_id` to project `e.name AS lead_engineer` and `e.title AS lead_role` ordered by `p.budget_usd DESC, p.project_id ASC`.',
    'Wrap the anchor query (`WHERE manager_id IS NULL`) in `WITH RECURSIVE org_tree AS (... UNION ALL ...)` joining `employees AS e ON e.manager_id = t.emp_id` while `t.hierarchy_level < 5`.',
    'Add `DENSE_RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary_usd DESC)`, `LAG(e.salary_usd, 1, e.salary_usd) OVER (...) - e.salary_usd`, and `SUM(e.salary_usd) OVER (... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`.'
  ],
  6: [
    'Compute `(new_salary_usd - old_salary_usd) AS raise_delta_usd` and `ROUND(((new_salary_usd - old_salary_usd) * 100.0) / old_salary_usd, 1) AS raise_pct` ordered by `effective_date ASC, raise_delta_usd DESC`.',
    'Left join `employee_projects AS ep` onto `employees AS e`, group by `e.emp_id, e.name, e.title`, and project `COUNT(ep.project_id) AS assigned_projects` and `COALESCE(SUM(ep.allocation_pct), 0) AS total_allocation_pct`.',
    'Join `departments AS d ON d.dept_id = e.dept_id`, include `d.name AS department_name`, `raise_delta_usd`, and `raise_pct`, and sort by `sh.effective_date ASC, raise_delta_usd DESC`.'
  ],
  7: [
    'Include `currency`, `ROUND(posted_balance_cents / 100.0, 2) AS posted_balance_usd`, and `version AS optimistic_lock_version` ordered by `posted_balance_cents DESC, account_id ASC`.',
    'Join `accounts AS ta ON ta.account_id = t.to_account_id` for `receiver_account`, format `ROUND(t.amount_cents / 100.0, 2) AS transfer_usd`, and include `t.created_at`.',
    'Group `transfers INNER JOIN journal_entries` by `t.transfer_id, t.idempotency_key, t.status` and compute `COUNT(je.entry_id)`, conditional debit/credit sums, and signed `net_balance_cents`.'
  ],
  8: [
    'Inner join `accounts AS a ON a.account_id = c.account_id`, project `a.owner_name`, `ROUND(c.daily_limit_cents / 100.0, 2) AS daily_limit_usd`, and `c.status AS card_status` ordered by `c.daily_limit_cents DESC, c.card_id ASC`.',
    'Group `cards INNER JOIN merchant_txns` by `c.card_id, c.last4, c.status, c.daily_limit_cents` to project `COUNT(mt.txn_id) AS txn_count`, `total_spend_usd`, and `daily_limit_usd` ordered by `total_spend_usd DESC`.',
    'Add two sliding-window functions over `(PARTITION BY card_id ORDER BY txn_ts ASC ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)`: `COUNT(*) AS window_txn_count` and `ROUND(SUM(amount_cents) OVER (...) / 100.0, 2) AS rolling_3txn_usd`.'
  ],
  9: [
    'Add `WHERE latency_ms IS NOT NULL` and sort with `ORDER BY latency_ms DESC, event_id ASC`.',
    'Left join `invoices AS i ON i.sub_id = s.sub_id`, group by `u.user_id, u.org_name, u.plan_tier, s.mrr_usd`, and compute conditional sums for `i.paid = 1` (`collected_usd`) and `i.paid = 0` (`overdue_usd`).',
    'Remove the single-row projection, group `user_events INNER JOIN saas_users` by `u.plan_tier, e.event_type`, and compute `COUNT(*)`, `ROUND(AVG(e.latency_ms), 2)`, `MAX(e.latency_ms)`, and `MIN(e.latency_ms)`.'
  ],
  10: [
    'Add `CASE WHEN reputation >= 500 THEN \'CORE_MAINTAINER\' ELSE \'COMMUNITY_AUTHOR\' END AS contributor_tier` and sort by `reputation DESC, user_id ASC`.',
    'Group `profiles LEFT JOIN follows` by `p.user_id, p.handle, p.reputation` and project `COUNT(f.follower_id) AS follower_count` ordered by `follower_count DESC, p.reputation DESC`.',
    'Add `LEFT JOIN post_likes AS pl ON pl.post_id = po.post_id`, include `pr.reputation AS author_reputation`, and group to compute `COUNT(pl.user_id) AS like_count` ordered by `like_count DESC, pr.reputation DESC, po.post_id ASC`.'
  ]
};

module.exports = {
  buildCapstoneBlueprintsPart2,
  buildModule01Blueprint,
  BLUEPRINT_HINTS
};
