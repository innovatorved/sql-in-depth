/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 06 (`pg-m06`): Indexing Architecture, Optimizer & EXPLAIN (ANALYZE, BUFFERS)
 * 8 Hands-On Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m06'] = [
    /* ========================================================================
       LAB 01: pg-m06-t01 — B-Tree Internals & Rewriting Non-SARGable Predicates
       ======================================================================== */
    {
      id: 'pg-m06-t01',
      slug: 'btree-internals-sargable-predicates',
      moduleId: 'pg-m06',
      title: 'B-Tree Internals & Rewriting Non-SARGable Predicates',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'ecommerce',
      clauses: ['CREATE INDEX', 'EXPLAIN', 'B-Tree'],
      tags: ['btree', 'sargable', 'indexing', 'query-tuning'],
      guide: {
        mentalModel: 'PostgreSQL\'s default Lehman-Yao **B-Tree** (`nbtree`) stores sorted keys in 8 KiB pages: internal branch pages hold separator keys guiding `O(log_B N)` root-to-leaf descent, while doubly-linked leaf pages hold `(key, ctid)` index tuples (deduplicated via posting lists in PG 13+).\n\nA predicate is **SARGable** (*Search ARGument ABLE*) only when the planner can translate it into a contiguous `[low, high]` range on the raw indexed column (`Index Cond`). Wrapping an indexed column in a function or arithmetic expression—such as `SUBSTRING(created_at, 1, 7) = \'2025-02\'`, `EXTRACT(YEAR FROM ts) = 2025`, or `total_cents + 5000 >= 100000`—destroys monotonic key alignment relative to the column\'s B-Tree sort order, forcing PostgreSQL to evaluate a post-scan `Filter` across every row.',
        syntaxAnatomy: [
          '-- Non-SARGable (forces Seq Scan + per-row Filter):',
          '-- WHERE SUBSTRING(created_at, 1, 7) = \'2025-02\' AND total_cents / 100 >= 950',
          '',
          '-- SARGable half-open range + isolated column (uses B-Tree Index Cond):',
          'SELECT order_id, customer_id, total_cents, created_at',
          'FROM orders',
          'WHERE created_at >= \'2025-02-01\'',
          '  AND created_at <  \'2025-03-01\'',
          '  AND total_cents >= 95000;',
          '',
          '-- Locale-safe prefix LIKE index in non-C collations:',
          'CREATE INDEX idx_products_sku_pattern ON products (sku text_pattern_ops);'
        ].join('\n'),
        internalsAndGotchas: [
          'Prefer half-open intervals (`col >= start AND col < next_period_start`) over `BETWEEN` on timestamps so end-of-day microsecond values (`23:59:59.999999`) are never accidentally excluded or carried into the next day.',
          'Under non-`C` collations (such as `en_US.UTF-8`), a standard `B-Tree` index cannot satisfy `col LIKE \'PREFIX%\'` because linguistic collation rules can reorder multi-character sequences; add `text_pattern_ops` (`varchar_pattern_ops`) or `COLLATE "C"`.',
          'Implicit cross-type casts on the indexed column (for example comparing a `TEXT` identifier column to an integer literal) wrap the column in a cast function and disable B-Tree probes.',
          'Leading-wildcard patterns (`LIKE \'%NVME%\'`) cannot use a B-Tree even with `text_pattern_ops`; use `pg_trgm` with `GIN` or `GiST` instead.'
        ],
        whenToUse: 'Apply SARGable predicate rewrites as your zero-DDL first response whenever `EXPLAIN` shows `Seq Scan` with `Filter:` on a column that already owns a B-Tree index.'
      },
      scenario: {
        role: 'Staff Performance Engineer',
        incidentOrGoal: 'Checkout order history and SKU autocomplete endpoints are burning CPU in full-table `Seq Scan` loops despite existing B-Tree indexes because ORM helpers wrapped indexed columns in `SUBSTRING()`, `LOWER(LEFT())`, and arithmetic.',
        stakeholderNeed: 'Rewrite the non-SARGable date/arithmetic filter on `orders`, provision a `text_pattern_ops` B-Tree index on `products(sku)`, and convert SKU prefix search into an `Index Scan`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Rewrite Non-SARGable Date & Arithmetic Filters into B-Tree Bounds',
          mission: 'Rewrite the slow query on `orders` so PostgreSQL uses `idx_orders_created_at` via an `Index Scan`: select `order_id`, `customer_id`, `status`, `total_cents`, and `created_at` for all February 2025 orders (`created_at >= \'2025-02-01\' AND created_at < \'2025-03-01\'`) whose `total_cents` after a `5000`-cent credit is at least `100000` (rewrite algebraically on `total_cents` without arithmetic on the column). Sort by `created_at ASC`.',
          setupSql: 'SET LOCAL enable_seqscan = off;',
          probeSql: '',
          starterCode: [
            '-- Rewrite BOTH non-SARGable predicates so idx_orders_created_at can drive an Index Scan',
            'SELECT order_id, customer_id, status, total_cents, created_at',
            'FROM orders',
            'WHERE SUBSTRING(created_at, 1, 7) = \'2025-02\'',
            '  AND total_cents + 5000 >= 100000',
            'ORDER BY created_at ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT order_id, customer_id, status, total_cents, created_at',
            'FROM orders',
            'WHERE created_at >= \'2025-02-01\'',
            '  AND created_at < \'2025-03-01\'',
            '  AND total_cents >= 95000',
            'ORDER BY created_at ASC;'
          ].join('\n'),
          hints: [
            'Replace `SUBSTRING(created_at, 1, 7) = \'2025-02\'` with a half-open range directly on `created_at`: `created_at >= \'2025-02-01\' AND created_at < \'2025-03-01\'`.',
            'Move `+ 5000` to the constant side of the inequality: `total_cents + 5000 >= 100000` simplifies to `total_cents >= 95000`.',
            'Keep `ORDER BY created_at ASC` so PostgreSQL walks `idx_orders_created_at` in forward leaf-page order without sorting.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'Index Scan',
            requiredPatterns: [
              { pattern: '\\bcreated_at\\s*>=', flags: 'i', message: 'Use a SARGable lower bound `created_at >= ...` directly on the column.' },
              { pattern: '\\bcreated_at\\s*<', flags: 'i', message: 'Use a SARGable upper bound `created_at < ...` directly on the column.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\b(SUBSTRING|SUBSTR|LEFT|EXTRACT)\\s*\\(', flags: 'i', message: 'Do not wrap `created_at` in string or date extraction functions.' },
              { pattern: '\\btotal_cents\\s*[+\\-*/]', flags: 'i', message: 'Isolate `total_cents` on one side of the comparison without column arithmetic.' }
            ]
          },
          solutionExplanation: 'Isolating `created_at` in `[2025-02-01, 2025-03-01)` turns a per-row function call into a B-Tree `Index Cond` range probe on `idx_orders_created_at`, while `total_cents >= 95000` avoids per-tuple arithmetic overhead and preserves exact planner histogram selectivity.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Create a Locale-Safe text_pattern_ops B-Tree Index',
          mission: 'Create a B-Tree index named `idx_products_sku_pattern` on `products (sku text_pattern_ops)` so byte-wise prefix predicates (`sku LIKE \'NVME-%\'`) remain SARGable regardless of the database\'s ICU/libc locale collation.',
          setupSql: 'DROP INDEX IF EXISTS idx_products_sku_pattern;',
          probeSql: [
            'SELECT c.relname AS index_name,',
            '       am.amname AS access_method,',
            '       opc.opcname AS operator_class',
            'FROM pg_index i',
            'JOIN pg_class c ON c.oid = i.indexrelid',
            'JOIN pg_class t ON t.oid = i.indrelid',
            'JOIN pg_am am ON am.oid = c.relam',
            'JOIN pg_opclass opc ON opc.oid = i.indclass[0]',
            'WHERE t.relname = \'products\' AND c.relname = \'idx_products_sku_pattern\';'
          ].join('\n'),
          starterCode: [
            '-- Create idx_products_sku_pattern on products(sku) using the text_pattern_ops operator class',
            '-- CREATE INDEX ...'
          ].join('\n'),
          solutionCode: 'CREATE INDEX idx_products_sku_pattern ON products (sku text_pattern_ops);',
          hints: [
            'Use standard `CREATE INDEX idx_products_sku_pattern ON products (...)` syntax.',
            'Inside the column list, specify the operator class immediately after the column name: `(sku text_pattern_ops)`.',
            'Complete statement: `CREATE INDEX idx_products_sku_pattern ON products (sku text_pattern_ops);`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+INDEX\\s+idx_products_sku_pattern\\b', flags: 'i', message: 'Create the index named `idx_products_sku_pattern`.' },
              { pattern: '\\btext_pattern_ops\\b', flags: 'i', message: 'Specify the `text_pattern_ops` B-Tree operator class on `sku`.' }
            ]
          },
          solutionExplanation: '`text_pattern_ops` instructs `nbtree` to compare `TEXT` keys character-by-character rather than via locale-sensitive linguistic weights, allowing PostgreSQL to convert `sku LIKE \'NVME-%\'` into `(sku ~>=~ \'NVME-\' AND sku ~<~ \'NVME.\')` index bounds under any UTF-8 collation.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Rewrite Prefix SKU Autocomplete to Trigger an Indexed Scan',
          mission: 'With `idx_products_sku_pattern` active, rewrite the catalog autocomplete query on `products` to select `product_id`, `sku`, `name`, and `price_cents` for all uppercase `NVME-` SKUs using a SARGable prefix `LIKE \'NVME-%\'` predicate (eliminating `LOWER(LEFT(...))`), sorted by `sku ASC`.',
          setupSql: 'CREATE INDEX IF NOT EXISTS idx_products_sku_pattern ON products (sku text_pattern_ops); SET LOCAL enable_seqscan = off;',
          probeSql: '',
          starterCode: [
            '-- Replace LOWER(LEFT(sku, 5)) with a SARGable LIKE prefix predicate on sku',
            'SELECT product_id, sku, name, price_cents',
            'FROM products',
            'WHERE LOWER(LEFT(sku, 5)) = \'nvme-\'',
            'ORDER BY sku ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT product_id, sku, name, price_cents',
            'FROM products',
            'WHERE sku LIKE \'NVME-%\'',
            'ORDER BY sku ASC;'
          ].join('\n'),
          hints: [
            'Catalog SKUs in `products` are stored in normalized uppercase (`\'NVME-4TB-PRO\'`, `\'NVME-2TB-STD\'`).',
            'Remove `LOWER(LEFT(sku, 5))` and filter directly with `WHERE sku LIKE \'NVME-%\'`.',
            'Keep `ORDER BY sku ASC` and project `product_id, sku, name, price_cents`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'Index.*Scan',
            requiredPatterns: [
              { pattern: '\\bsku\\s+LIKE\\s+\'NVME-%\'', flags: 'i', message: 'Use a SARGable `sku LIKE \'NVME-%\'` prefix predicate.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\b(LOWER|LEFT|SUBSTRING|SUBSTR)\\s*\\(', flags: 'i', message: 'Do not wrap `sku` in `LOWER()` or `LEFT()`.' }
            ]
          },
          solutionExplanation: 'Anchored right-wildcard `sku LIKE \'NVME-%\'` pairs with `idx_products_sku_pattern` so the planner bounds the scan between `\'NVME-\'` and `\'NVME.\'` in the B-Tree instead of evaluating two string functions per heap tuple.'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m06-t02 — Composite B-Tree Column Order: Equality → Sort → Range
       ======================================================================== */
    {
      id: 'pg-m06-t02',
      slug: 'composite-indexes-equality-sort-range',
      moduleId: 'pg-m06',
      title: 'Composite B-Tree Column Order: Equality → Sort → Range',
      difficulty: 'Intermediate',
      estimatedMinutes: 16,
      datasetId: 'ecommerce',
      clauses: ['CREATE INDEX (a, b, c)', 'ORDER BY ... DESC'],
      tags: ['composite-index', 'btree', 'sort-elimination', 'skip-scan', 'pg18'],
      guide: {
        mentalModel: 'A composite B-Tree index on `(a, b, c)` sorts tuples **lexicographically**—just like a phonebook sorted by `(state, city, last_name)`. Within any single equality value of `a`, `b` is strictly ordered; within `(a, b)`, `c` is strictly ordered. The moment a query applies an inequality/range on a key column (`b > 100`), values of trailing key `c` are scattered across every matching `b` bucket.\n\nThis physical geometry dictates the **ESR Rule (Equality → Sort → Range)**:\n1. **Equality (`=`) columns first** narrow the scan to a contiguous slice of leaf pages.\n2. **Sort (`ORDER BY`) or Range (`>`, `<`, `BETWEEN`) column next** delivers tuples pre-sorted for `ORDER BY ... LIMIT N` (eliminating an `O(M log K)` `Sort` node) or bounds a tight range scan.\n\nIn **PostgreSQL 18**, `nbtree` also introduces native **B-Tree Skip Scan**, enabling the executor to jump across distinct leading values of a low-cardinality column `a` (such as `status`) when a query filters only on `b`—though placing exact `=` columns first remains optimal for hot OLTP paths.',
        syntaxAnatomy: [
          '-- ESR Design for: WHERE status = \'completed\' ORDER BY created_at DESC LIMIT 3',
          'CREATE INDEX idx_orders_status_created_desc',
          '  ON orders (status, created_at DESC);',
          '',
          '-- Multi-equality + range/sort:',
          'CREATE INDEX idx_payments_status_method_amt',
          '  ON payments (status, method, amount_cents DESC);'
        ].join('\n'),
        internalsAndGotchas: [
          'A single-column B-Tree can be scanned backward (`Index Scan Backward`) to satisfy `ORDER BY col DESC`, but a multi-column `ORDER BY a ASC, b DESC` requires matching mixed sort directions `(a ASC, b DESC)` in `CREATE INDEX` (or PG 13+ `Incremental Sort`).',
          'In PostgreSQL, `DESC` defaults to `NULLS FIRST` while `ASC` defaults to `NULLS LAST`! If an index is `(col DESC)` (`NULLS FIRST`) and your query asks for `ORDER BY col DESC NULLS LAST` on a nullable column, PostgreSQL cannot use the index order without sorting.',
          'Putting a range column (`created_at >= ...`) BEFORE an equality column (`status = \'completed\'`) forces the index scan to read every row in the date window and discard wrong-status rows in index recheck.',
          'PostgreSQL 18 B-Tree Skip Scan helps ad-hoc queries that omit a low-cardinality leading column, but each skip still incurs an internal tree descent per distinct prefix value.'
        ],
        whenToUse: 'Design composite B-Tree indexes using Equality → Sort → Range whenever hot pagination feeds, timelines, or leaderboards combine `WHERE col = $1` with `ORDER BY ts DESC LIMIT k`.'
      },
      scenario: {
        role: 'Core Commerce Database Architect',
        incidentOrGoal: 'Merchant timeline queries (`WHERE status = \'completed\' ORDER BY created_at DESC LIMIT 3`) and settlement audits are scanning all matching rows and running explicit `Sort` nodes on every API request.',
        stakeholderNeed: 'Build ESR-ordered composite B-Tree indexes on `orders` and `payments` and prove PostgreSQL satisfies both filtering and `ORDER BY` directly from leaf-page order with sorting disabled.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Create an Equality → Sort Composite Index on orders',
          mission: 'Create a composite B-Tree index named `idx_orders_status_created_desc` on `orders (status, created_at DESC)` so queries filtering on exact `status` can stream the newest orders first with zero `Sort` step.',
          setupSql: 'DROP INDEX IF EXISTS idx_orders_status_created_desc;',
          probeSql: [
            'SELECT c.relname AS index_name,',
            '       i.indnatts AS col_count,',
            '       a1.attname AS key_1,',
            '       a2.attname AS key_2,',
            '       ((i.indoption[1] & 1) = 1) AS key_2_is_desc',
            'FROM pg_index i',
            'JOIN pg_class c ON c.oid = i.indexrelid',
            'JOIN pg_attribute a1 ON a1.attrelid = i.indrelid AND a1.attnum = i.indkey[0]',
            'JOIN pg_attribute a2 ON a2.attrelid = i.indrelid AND a2.attnum = i.indkey[1]',
            'WHERE c.relname = \'idx_orders_status_created_desc\';'
          ].join('\n'),
          starterCode: [
            '-- Create composite index idx_orders_status_created_desc following Equality -> Sort order',
            '-- CREATE INDEX ...'
          ].join('\n'),
          solutionCode: 'CREATE INDEX idx_orders_status_created_desc ON orders (status, created_at DESC);',
          hints: [
            'Place the equality column `status` first, followed by the sort column `created_at DESC`.',
            'Verify the exact index name `idx_orders_status_created_desc` on table `orders`.',
            'Write `CREATE INDEX idx_orders_status_created_desc ON orders (status, created_at DESC);`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+INDEX\\s+idx_orders_status_created_desc\\b', flags: 'i', message: 'Name the index `idx_orders_status_created_desc`.' },
              { pattern: '\\(\\s*status\\s*,\\s*created_at\\s+DESC\\s*\\)', flags: 'i', message: 'Order columns as `(status, created_at DESC)`.' }
            ]
          },
          solutionExplanation: 'Catalog bit `(indoption[1] & 1) = 1` confirms `created_at` is stored in descending order inside each `status` partition of `idx_orders_status_created_desc`, enabling early-stopping `LIMIT` scans.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Top-N Timeline Query Without a Sort Node',
          mission: 'With `idx_orders_status_created_desc` created and planner `Sort` nodes disabled, query `orders` to return `order_id`, `customer_id`, `total_cents`, and `created_at` for the `3` most recent `\'completed\'` orders (`ORDER BY created_at DESC LIMIT 3`).',
          setupSql: 'CREATE INDEX IF NOT EXISTS idx_orders_status_created_desc ON orders (status, created_at DESC); SET LOCAL enable_seqscan = off; SET LOCAL enable_sort = off;',
          probeSql: '',
          starterCode: [
            '-- Fetch the 3 newest completed orders using an ordered Index Scan (zero Sort nodes)',
            'SELECT order_id, customer_id, total_cents, created_at',
            'FROM orders',
            '-- TODO: filter status = \'completed\', order by created_at DESC, limit to 3;'
          ].join('\n'),
          solutionCode: [
            'SELECT order_id, customer_id, total_cents, created_at',
            'FROM orders',
            'WHERE status = \'completed\'',
            'ORDER BY created_at DESC',
            'LIMIT 3;'
          ].join('\n'),
          hints: [
            'Add `WHERE status = \'completed\'` to bind the leading equality column of `idx_orders_status_created_desc`.',
            'Add `ORDER BY created_at DESC` matching the trailing index key\'s sort direction.',
            'Cap the scan at 3 tuples with `LIMIT 3;` so the `Limit` node halts immediately after reading 3 index entries.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'Index Scan',
            requiredPatterns: [
              { pattern: '\\bWHERE\\s+status\\s*=\\s*\'completed\'', flags: 'i', message: 'Filter `WHERE status = \'completed\'`.' },
              { pattern: '\\bORDER\\s+BY\\s+created_at\\s+DESC\\b', flags: 'i', message: 'Order by `created_at DESC`.' },
              { pattern: '\\bLIMIT\\s+3\\b', flags: 'i', message: 'Include `LIMIT 3`.' }
            ]
          },
          solutionExplanation: 'Because `(status, created_at DESC)` supplies tuples in the exact requested order, PostgreSQL executes `Limit -> Index Scan using idx_orders_status_created_desc`, stopping after 3 tuples instead of scanning and quicksorting every completed order.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — 3-Column ESR Index Design on payments',
          mission: 'Design and create a 3-column composite index `idx_payments_esr` on `payments` that satisfies `WHERE status = \'settled\' AND method = \'card\' AND amount_cents >= 40000 ORDER BY amount_cents DESC` via a pure `Index Scan` with `Sort` disabled (place `status` before `method`, and the range/sort key `amount_cents DESC` last).',
          setupSql: 'DROP INDEX IF EXISTS idx_payments_esr; SET LOCAL enable_seqscan = off; SET LOCAL enable_sort = off;',
          probeSql: [
            'SELECT payment_id, order_id, amount_cents, processed_at',
            'FROM payments',
            'WHERE status = \'settled\'',
            '  AND method = \'card\'',
            '  AND amount_cents >= 40000',
            'ORDER BY amount_cents DESC;'
          ].join('\n'),
          starterCode: [
            '-- Wrong ESR order (range column placed first forces a Sort!). Fix the column order & direction:',
            'CREATE INDEX idx_payments_esr ON payments (amount_cents, status, method);'
          ].join('\n'),
          solutionCode: 'CREATE INDEX idx_payments_esr ON payments (status, method, amount_cents DESC);',
          hints: [
            'Identify the two equality columns (`status = \'settled\'` and `method = \'card\'`) and place them before the range/sort column (`amount_cents`).',
            'Append `DESC` to `amount_cents` so the index matches `ORDER BY amount_cents DESC` in forward scan order.',
            'Write `CREATE INDEX idx_payments_esr ON payments (status, method, amount_cents DESC);`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'Index Scan',
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+INDEX\\s+idx_payments_esr\\b', flags: 'i', message: 'Create `idx_payments_esr` on `payments`.' },
              { pattern: '\\(\\s*status\\s*,\\s*method\\s*,\\s*amount_cents(\\s+DESC)?\\s*\\)', flags: 'i', message: 'Place equality columns `(status, method)` before `amount_cents`.' }
            ]
          },
          solutionExplanation: 'Placing equality keys `(status, method)` ahead of `amount_cents DESC` isolates the `(\'settled\', \'card\')` slice in the B-Tree where `amount_cents` is monotonically ordered, satisfying both `amount_cents >= 40000` and `ORDER BY amount_cents DESC` in one pass.'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m06-t03 — Covering Indexes (INCLUDE), Index-Only Scans & Heap Fetches
       ======================================================================== */
    {
      id: 'pg-m06-t03',
      slug: 'covering-indexes-include-visibility',
      moduleId: 'pg-m06',
      title: 'Covering Indexes (INCLUDE), Index-Only Scans & Heap Fetches',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'ecommerce',
      clauses: ['CREATE INDEX ... INCLUDE (...)', 'VACUUM', 'Index Only Scan'],
      tags: ['covering-index', 'include', 'index-only-scan', 'visibility-map'],
      guide: {
        mentalModel: 'Unlike clustered storage engines (MySQL InnoDB), PostgreSQL heap tables are **unclustered**—every index leaf entry points to a physical heap `(block, offset)` `ctid`, and **MVCC visibility metadata** (`xmin`, `xmax` transaction IDs) lives ONLY in heap tuple headers, never inside index pages!\n\nTo avoid random heap I/O, PostgreSQL combines two mechanisms for an **Index-Only Scan**:\n1. **Covering Indexes (`INCLUDE (col1, col2)`)**: Introduced in PG 11, `INCLUDE` appends non-searchable payload columns exclusively to **leaf pages**, omitting them from upper internal separator keys (`indnkeyatts < indnatts`) so B-Tree fan-out stays tall and lean (and `UNIQUE (email) INCLUDE (tier)` enforces uniqueness solely on `email`).\n2. **The Visibility Map (`_vm` fork)**: A 2-bit-per-heap-page bitmap maintained by `VACUUM`. When a heap page\'s `all-visible` bit is `1`, every tuple on that 8 KiB page is visible to all active snapshots, so `Index Only Scan` skips the heap completely (`Heap Fetches: 0`). If the bit is `0` (after recent `INSERT`/`UPDATE`), PostgreSQL MUST still fetch the heap page to check MVCC visibility!',
        syntaxAnatomy: [
          '-- Key columns in (...), leaf-only payload columns in INCLUDE (...):',
          'CREATE INDEX idx_orders_cust_created_inc',
          '  ON orders (customer_id, created_at DESC)',
          '  INCLUDE (status, total_cents);',
          '',
          '-- Mark clean heap pages all-visible in the _vm fork & refresh planner stats:',
          'VACUUM ANALYZE orders;',
          '',
          '-- Project ONLY indexed + included columns to get Index Only Scan:',
          'SELECT customer_id, created_at, status, total_cents',
          'FROM orders',
          'WHERE customer_id = 1',
          'ORDER BY created_at DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          'An `EXPLAIN (ANALYZE)` showing `Index Only Scan` can STILL perform thousands of random disk reads if `Heap Fetches:` is high! High `Heap Fetches` means autovacuum lags behind write churn—lower per-table `autovacuum_vacuum_scale_factor` (for example `0.02`).',
          'Adding a column to `INCLUDE (...)` instead of the key list keeps upper internal B-Tree pages narrow and allows types lacking B-Tree operator classes (such as `JSONB` or `BOX`) to ride along on leaf pages, provided the total index tuple fits within ~2704 bytes (`BTMaxItemSize`).',
          '`SELECT *` almost always disqualifies an `Index Only Scan` as soon as even one unindexed column (like `discount_code`) must be retrieved from the heap.',
          '`VACUUM` cannot run inside an explicit `BEGIN ... COMMIT` transaction block in PostgreSQL.'
        ],
        whenToUse: 'Use `CREATE INDEX ... INCLUDE (...)` paired with tuned autovacuum on high-QPS lookup endpoints that filter on 1–2 keys and project a fixed handful of small summary attributes.'
      },
      scenario: {
        role: 'Principal Database Reliability Engineer',
        incidentOrGoal: 'Customer order-summary widgets hammer random heap pages on `orders` because `(customer_id, created_at)` indexes lack `status` and `total_cents`, and freshly updated benchmark pages have cleared Visibility Map bits.',
        stakeholderNeed: 'Create a covering `INCLUDE` index, inspect `indnatts` vs `indnkeyatts` in `pg_index`, run `VACUUM ANALYZE` to set Visibility Map bits, and reshape a query into a pure `Index Only Scan`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Create a Covering B-Tree Index with INCLUDE Payload Columns',
          mission: 'Create a covering index named `idx_orders_cust_created_inc` on `orders` with key columns `(customer_id, created_at DESC)` and non-key leaf payload columns `INCLUDE (status, total_cents)`.',
          setupSql: 'DROP INDEX IF EXISTS idx_orders_cust_created_inc;',
          probeSql: [
            'SELECT c.relname AS index_name,',
            '       i.indnatts AS total_attrs,',
            '       i.indnkeyatts AS key_attrs,',
            '       (i.indnatts - i.indnkeyatts) AS included_attrs,',
            '       pg_get_indexdef(i.indexrelid) AS index_def',
            'FROM pg_index i',
            'JOIN pg_class c ON c.oid = i.indexrelid',
            'WHERE c.relname = \'idx_orders_cust_created_inc\';'
          ].join('\n'),
          starterCode: [
            '-- Create covering index idx_orders_cust_created_inc with 2 search keys and 2 INCLUDE payload columns',
            '-- CREATE INDEX ...'
          ].join('\n'),
          solutionCode: 'CREATE INDEX idx_orders_cust_created_inc ON orders (customer_id, created_at DESC) INCLUDE (status, total_cents);',
          hints: [
            'Specify searchable/sortable columns `(customer_id, created_at DESC)` first.',
            'Follow immediately with `INCLUDE (status, total_cents)` so those two columns are stored only on leaf pages.',
            'Full DDL: `CREATE INDEX idx_orders_cust_created_inc ON orders (customer_id, created_at DESC) INCLUDE (status, total_cents);`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+INDEX\\s+idx_orders_cust_created_inc\\b', flags: 'i', message: 'Create `idx_orders_cust_created_inc`.' },
              { pattern: '\\bINCLUDE\\s*\\(\\s*status\\s*,\\s*total_cents\\s*\\)', flags: 'i', message: 'Attach `(status, total_cents)` via `INCLUDE (...)`.' }
            ]
          },
          solutionExplanation: 'In `pg_index`, `indnatts = 4` while `indnkeyatts = 2`, proving PostgreSQL truncates `status` and `total_cents` out of upper internal B-Tree pivot tuples while preserving them on leaf pages.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Populate the Visibility Map with VACUUM ANALYZE',
          mission: 'A 600-row benchmark table `orders_cov_bench` just absorbed updates that cleared its Visibility Map (`relallvisible < relpages`), forcing heap fetches during index-only scans. Run `VACUUM ANALYZE orders_cov_bench;` to reclaim dead tuples, set all heap pages all-visible in `_vm`, and refresh planner statistics.',
          setupSql: [
            'DROP TABLE IF EXISTS orders_cov_bench;',
            'CREATE TABLE orders_cov_bench AS',
            'SELECT g AS order_id,',
            '       (g % 25) + 1 AS customer_id,',
            '       CASE WHEN g % 4 = 0 THEN \'pending\' ELSE \'completed\' END AS status,',
            '       (g * 100) AS total_cents,',
            '       \'PROMO\' AS discount_code,',
            '       (TIMESTAMPTZ \'2025-03-01 00:00:00+00\' + (g || \' minutes\')::interval) AS created_at',
            'FROM generate_series(1, 600) AS g;',
            'CREATE INDEX idx_cov_bench_cust ON orders_cov_bench (customer_id, created_at DESC) INCLUDE (status, total_cents);',
            'UPDATE orders_cov_bench SET total_cents = total_cents + 50 WHERE order_id <= 60;'
          ].join('\n'),
          probeSql: [
            'SELECT relname,',
            '       (relpages > 0) AS has_pages,',
            '       (relallvisible = relpages) AS all_pages_visible',
            'FROM pg_class',
            'WHERE relname = \'orders_cov_bench\';'
          ].join('\n'),
          starterCode: [
            '-- Refresh only planner stats (does NOT update the Visibility Map! Replace with VACUUM ANALYZE):',
            'ANALYZE orders_cov_bench;'
          ].join('\n'),
          solutionCode: 'VACUUM ANALYZE orders_cov_bench;',
          hints: [
            '`ANALYZE` samples rows for `pg_statistic` but never cleans dead tuples or sets Visibility Map bits.',
            'Combine vacuuming and statistics collection in a single top-level maintenance command: `VACUUM ANALYZE orders_cov_bench;`.',
            'Do not wrap `VACUUM` inside `BEGIN ... COMMIT`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bVACUUM\\s+(\\([^)]*\\)\\s*)?(ANALYZE\\s+)?orders_cov_bench\\b', flags: 'i', message: 'Run `VACUUM ANALYZE orders_cov_bench;`.' }
            ]
          },
          solutionExplanation: 'After `UPDATE` dirtied heap pages, `relallvisible` dropped below `relpages`. Running `VACUUM ANALYZE orders_cov_bench` prunes dead heap tuples and flips every clean page\'s Visibility Map bit (`relallvisible = relpages`), unlocking `Heap Fetches: 0`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Reshape Projection to Trigger a Pure Index Only Scan',
          mission: 'On `orders_cov_bench` (covered by `(customer_id, created_at DESC) INCLUDE (status, total_cents)` and freshly vacuumed), fix the query for `customer_id = 5` so it projects ONLY the 4 covered columns in exact order `customer_id`, `created_at`, `status`, `total_cents` (removing uncovered `order_id` and `discount_code`), sorted by `created_at DESC LIMIT 5`, achieving an `Index Only Scan`.',
          setupSql: [
            'DROP TABLE IF EXISTS orders_cov_bench;',
            'CREATE TABLE orders_cov_bench AS',
            'SELECT g AS order_id,',
            '       (g % 25) + 1 AS customer_id,',
            '       CASE WHEN g % 4 = 0 THEN \'pending\' ELSE \'completed\' END AS status,',
            '       (g * 100) AS total_cents,',
            '       \'PROMO\' AS discount_code,',
            '       (TIMESTAMPTZ \'2025-03-01 00:00:00+00\' + (g || \' minutes\')::interval) AS created_at',
            'FROM generate_series(1, 600) AS g;',
            'CREATE INDEX idx_cov_bench_cust ON orders_cov_bench (customer_id, created_at DESC) INCLUDE (status, total_cents);',
            'ANALYZE orders_cov_bench;',
            'SET LOCAL enable_seqscan = off;'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- Uncovered columns order_id and discount_code force heap fetches! Project ONLY covered columns:',
            'SELECT order_id, customer_id, created_at, status, total_cents, discount_code',
            'FROM orders_cov_bench',
            'WHERE customer_id = 5',
            'ORDER BY created_at DESC',
            'LIMIT 5;'
          ].join('\n'),
          solutionCode: [
            'SELECT customer_id, created_at, status, total_cents',
            'FROM orders_cov_bench',
            'WHERE customer_id = 5',
            'ORDER BY created_at DESC',
            'LIMIT 5;'
          ].join('\n'),
          hints: [
            '`idx_cov_bench_cust` covers only `customer_id`, `created_at`, `status`, and `total_cents`.',
            'Remove `order_id` and `discount_code` from the `SELECT` target list.',
            'Keep `WHERE customer_id = 5`, `ORDER BY created_at DESC`, and `LIMIT 5;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'Index Only Scan',
            requiredPatterns: [
              { pattern: '\\bSELECT\\s+customer_id\\s*,\\s*created_at\\s*,\\s*status\\s*,\\s*total_cents\\b', flags: 'i', message: 'Project `customer_id, created_at, status, total_cents`.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\b(discount_code|order_id)\\b', flags: 'i', message: 'Omit uncovered columns (`order_id`, `discount_code`) so PostgreSQL avoids visiting the heap.' }
            ]
          },
          solutionExplanation: 'With every projected and filtered column present in `idx_cov_bench_cust` and all heap pages marked visible in `_vm` by `VACUUM ANALYZE`, PostgreSQL\'s planner naturally chooses `Index Only Scan` with zero heap page reads.'
        }
      ]
    },

    /* ========================================================================
       LAB 04: pg-m06-t04 — Partial Indexes (WHERE ...) & Functional Expression Indexes
       ======================================================================== */
    {
      id: 'pg-m06-t04',
      slug: 'partial-and-expression-indexes',
      moduleId: 'pg-m06',
      title: 'Partial Indexes (WHERE ...) & Functional Expression Indexes',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['CREATE INDEX ... WHERE', 'CREATE INDEX ON tbl ((expr))'],
      tags: ['partial-index', 'expression-index', 'hot-queues', 'indexing'],
      guide: {
        mentalModel: 'Standard B-Tree indexes index **every row** of a raw column, which wastes gigabytes of `shared_buffers` and write-amplifies WAL when 98% of rows are terminal states (`status = \'paid\'` or `status = \'done\'`) that hot workers never query.\n\nPostgreSQL provides two surgical B-Tree specializations:\n1. **Partial Indexes (`CREATE INDEX ... WHERE predicate`)**: Stores index entries ONLY for heap tuples satisfying an immutable `indpred` filter. The planner uses a partial index whenever the query\'s `WHERE` clause mathematically **implies** the index predicate—shrinking queue/dunning indexes by 95%+ and avoiding `HOT` (Heap-Only Tuple) update penalties on excluded rows.\n2. **Expression Indexes (`CREATE INDEX ON tbl ((expr))`)**: Indexes the precomputed output of an `IMMUTABLE` function or `JSONB` extraction (such as `(LOWER(email))` or `(payload->\'user\'->>\'role\')`), and triggers `ANALYZE` to collect dedicated MCV/histogram statistics on the expression itself!',
        syntaxAnatomy: [
          '-- 1. Partial Index: index only unsettled invoices',
          'CREATE INDEX idx_invoices_unsettled',
          '  ON tenant_invoices (tenant_id, issued_at ASC)',
          '  WHERE status IN (\'open\', \'overdue\');',
          '',
          '-- 2. Expression Index: extra parentheses around non-trivial expressions are mandatory',
          'CREATE INDEX idx_audit_actor_role',
          '  ON api_audit_events ((payload->\'user\'->>\'role\'), latency_ms DESC);',
          '',
          '-- 3. Partial Unique Index (conditional business uniqueness):',
          'CREATE UNIQUE INDEX uq_one_running_job_per_queue',
          '  ON job_queue (queue_name) WHERE status = \'running\';'
        ].join('\n'),
        internalsAndGotchas: [
          'PostgreSQL\'s parser requires **double parentheses** `ON tbl ((expr))` whenever the indexed item is an operator or expression other than a bare `func(col)` call—for example `((payload->\'user\'->>\'role\'))`.',
          'Every function referenced in an expression index or partial `WHERE` clause MUST be marked `IMMUTABLE` (never `STABLE` like `NOW()` or timezone-dependent `TIMESTAMPTZ::date`, which would corrupt index sort invariants as time or `TimeZone` changes).',
          'Parameterized prepared statements (`WHERE status = $1`) cannot prove at generic-plan time that `$1` implies `WHERE status = \'open\'`; pass literal constants for partial-index discriminator columns on hot queue queries.',
          'PostgreSQL table `UNIQUE` constraints do not accept `WHERE`, so conditional uniqueness rules are always implemented via `CREATE UNIQUE INDEX ... WHERE ...`.'
        ],
        whenToUse: 'Use Partial Indexes for skewed status queues, soft-delete tables (`WHERE deleted_at IS NULL`), and sparse flags; use Expression Indexes for case-insensitive `LOWER(col)` lookups and hot `JSONB` scalar keys.'
      },
      scenario: {
        role: 'Multi-Tenant Platform DBRE',
        incidentOrGoal: 'Billing dunning workers scan historical `paid` invoices unnecessarily, while security audit queries extracting `payload->\'user\'->>\'role\'` cannot leverage the broad `GIN` index for sorted top-latency lookups.',
        stakeholderNeed: 'Create a partial B-Tree index for unsettled invoices, build a functional expression index on `api_audit_events` JSONB actor roles, and align a triage query\'s `WHERE` predicates to match a combined partial expression index.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Create a Partial Index for Unsettled Tenant Invoices',
          mission: 'Create a partial B-Tree index named `idx_invoices_unsettled` on `tenant_invoices (tenant_id, issued_at ASC)` filtered strictly to `WHERE status IN (\'open\', \'overdue\')` so paid historical invoices are excluded from the index.',
          setupSql: 'DROP INDEX IF EXISTS pg_ops.idx_invoices_unsettled; SET LOCAL enable_seqscan = off;',
          probeSql: [
            'SELECT invoice_id, tenant_id, customer_ref, amount_cents, status, issued_at',
            'FROM tenant_invoices',
            'WHERE tenant_id = \'globex\'',
            '  AND status IN (\'open\', \'overdue\')',
            'ORDER BY issued_at ASC;'
          ].join('\n'),
          starterCode: [
            '-- Create partial index idx_invoices_unsettled on tenant_invoices (tenant_id, issued_at ASC)',
            '-- indexing ONLY rows where status IN (\'open\', \'overdue\')',
            '-- CREATE INDEX ...'
          ].join('\n'),
          solutionCode: [
            'CREATE INDEX idx_invoices_unsettled',
            '  ON tenant_invoices (tenant_id, issued_at ASC)',
            '  WHERE status IN (\'open\', \'overdue\');'
          ].join('\n'),
          hints: [
            'Start with `CREATE INDEX idx_invoices_unsettled ON tenant_invoices (tenant_id, issued_at ASC)`.',
            'Append `WHERE status IN (\'open\', \'overdue\');` at the end of the `CREATE INDEX` statement.',
            'Because the probe query filters on `status IN (\'open\', \'overdue\')`, PostgreSQL proves predicate implication and scans `idx_invoices_unsettled`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'using idx_invoices_unsettled',
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+INDEX\\s+idx_invoices_unsettled\\b', flags: 'i', message: 'Create index `idx_invoices_unsettled`.' },
              { pattern: '\\bWHERE\\s+status\\s+IN\\s*\\(', flags: 'i', message: 'Include the partial index clause `WHERE status IN (\'open\', \'overdue\')`.' }
            ]
          },
          solutionExplanation: 'Storing `indpred` (`status = ANY (ARRAY[\'open\', \'overdue\'])`) in `pg_index` keeps settled `' + 'paid' + '` rows out of the B-Tree completely while letting dunning queries probe `(tenant_id, issued_at)` in index order.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Create a Functional Expression Index on a JSONB Path',
          mission: 'Create a composite expression B-Tree index named `idx_audit_actor_role` on `api_audit_events` indexing the extracted JSONB scalar `((payload->\'user\'->>\'role\'), latency_ms DESC)` so role-filtered latency queries avoid full scans and sorts.',
          setupSql: 'DROP INDEX IF EXISTS pg_ops.idx_audit_actor_role; SET LOCAL enable_seqscan = off; SET LOCAL enable_bitmapscan = off;',
          probeSql: [
            'SELECT event_id, tenant_id, endpoint, latency_ms',
            'FROM api_audit_events',
            'WHERE (payload->\'user\'->>\'role\') = \'service\'',
            'ORDER BY latency_ms DESC;'
          ].join('\n'),
          starterCode: [
            '-- Create expression index idx_audit_actor_role on ((payload->\'user\'->>\'role\'), latency_ms DESC)',
            '-- Remember: PostgreSQL requires extra parentheses around operator expressions in CREATE INDEX!',
            '-- CREATE INDEX ...'
          ].join('\n'),
          solutionCode: [
            'CREATE INDEX idx_audit_actor_role',
            '  ON api_audit_events ((payload->\'user\'->>\'role\'), latency_ms DESC);'
          ].join('\n'),
          hints: [
            'Wrap `payload->\'user\'->>\'role\'` in its own pair of parentheses inside the index key list: `((payload->\'user\'->>\'role\'), latency_ms DESC)`.',
            'Without the inner parentheses, PostgreSQL\'s parser rejects the `->` / `->>` operators inside `CREATE INDEX`.',
            'Complete DDL: `CREATE INDEX idx_audit_actor_role ON api_audit_events ((payload->\'user\'->>\'role\'), latency_ms DESC);`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'using idx_audit_actor_role',
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+INDEX\\s+idx_audit_actor_role\\b', flags: 'i', message: 'Create index `idx_audit_actor_role`.' },
              { pattern: '\\(\\s*\\(\\s*payload\\s*->\\s*\'user\'\\s*->>\\s*\'role\'\\s*\\)\\s*,\\s*latency_ms\\s+DESC\\s*\\)', flags: 'i', message: 'Index `((payload->\'user\'->>\'role\'), latency_ms DESC)` with inner parentheses around the JSONB expression.' }
            ]
          },
          solutionExplanation: 'Unlike a `GIN` index (which cannot maintain `latency_ms DESC` sort order), a B-Tree expression index on `((payload->\'user\'->>\'role\'), latency_ms DESC)` jumps straight to `\'service\'` events in descending latency order.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Match Both Expression & Partial Predicate in Triage SQL',
          mission: 'An index `idx_audit_failed_role` is defined as `ON api_audit_events ((LOWER(payload->\'user\'->>\'role\')), latency_ms DESC) WHERE status_code >= 400`. Fix the query so PostgreSQL uses `idx_audit_failed_role` to return `event_id`, `tenant_id`, `status_code`, and `latency_ms` for failing (`status_code >= 400`) requests by actor role `\'service\'`, ordered by `latency_ms DESC`.',
          setupSql: [
            'DROP INDEX IF EXISTS pg_ops.idx_audit_failed_role;',
            'CREATE INDEX idx_audit_failed_role',
            '  ON pg_ops.api_audit_events ((LOWER(payload->\'user\'->>\'role\')), latency_ms DESC)',
            '  WHERE status_code >= 400;',
            'SET LOCAL enable_seqscan = off;',
            'SET LOCAL enable_bitmapscan = off;'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- Mismatched expression (missing LOWER) and missing status_code >= 400 partial filter prevent index usage!',
            'SELECT event_id, tenant_id, status_code, latency_ms',
            'FROM api_audit_events',
            'WHERE (payload->\'user\'->>\'role\') = \'service\'',
            'ORDER BY latency_ms DESC;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id, tenant_id, status_code, latency_ms',
            'FROM api_audit_events',
            'WHERE LOWER(payload->\'user\'->>\'role\') = \'service\'',
            '  AND status_code >= 400',
            'ORDER BY latency_ms DESC;'
          ].join('\n'),
          hints: [
            'To match an expression index, your `WHERE` clause must spell the exact same expression AST: `LOWER(payload->\'user\'->>\'role\') = \'service\'`.',
            'To qualify for a partial index with `WHERE status_code >= 400`, your query must also include `AND status_code >= 400` (or a stricter bound such as `status_code >= 500`).',
            'Keep `ORDER BY latency_ms DESC` and project `event_id, tenant_id, status_code, latency_ms`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'using idx_audit_failed_role',
            requiredPatterns: [
              { pattern: '\\bLOWER\\s*\\(\\s*payload\\s*->\\s*\'user\'\\s*->>\\s*\'role\'\\s*\\)\\s*=\\s*\'service\'', flags: 'i', message: 'Match the indexed expression `LOWER(payload->\'user\'->>\'role\') = \'service\'`.' },
              { pattern: '\\bstatus_code\\s*>=\\s*400\\b', flags: 'i', message: 'Include `status_code >= 400` so the planner proves the partial index predicate holds.' }
            ]
          },
          solutionExplanation: 'PostgreSQL\'s optimizer matches expression indexes structurally on the parsed expression tree and verifies theorem implication against `indpred`; supplying both `LOWER(payload->\'user\'->>\'role\') = \'service\'` and `status_code >= 400` unlocks `idx_audit_failed_role`.'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m06-t05 — Access Methods Beyond B-Tree: GIN, GiST, BRIN & Hash
       ======================================================================== */
    {
      id: 'pg-m06-t05',
      slug: 'gin-gist-brin-hash-access-methods',
      moduleId: 'pg-m06',
      title: 'Access Methods Beyond B-Tree: GIN, GiST, BRIN & Hash',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['USING gin', 'USING gist', 'USING brin', 'USING hash'],
      tags: ['gin', 'gist', 'brin', 'hash-index', 'access-methods'],
      guide: {
        mentalModel: 'B-Tree requires a strict 1-D total ordering (`<`, `=`, `>`), which fails for multi-element sets, 2-D/temporal overlap ranges, or petabyte append-only logs. PostgreSQL\'s pluggable **Index Access Method (`pg_am`)** architecture provides four core alternatives:\n\n- **`GIN` (Generalized Inverted Index)**: Maps each element inside a composite value (`JSONB`, `ARRAY`, `TSVECTOR`, `pg_trgm` trigrams) to a compressed posting list/tree of `ctid`s. With `jsonb_path_ops`, it hashes full root-to-leaf JSON paths into compact 32-bit entries for `@>` containment.\n- **`GiST` (Generalized Search Tree)**: Balanced R-Tree-style hierarchy of bounding predicates supporting overlap (`&&`), containment (`@>`), `LTREE` ancestors, `EXCLUDE` constraints, and nearest-neighbor (`<->`) K-NN distance scans.\n- **`BRIN` (Block Range Index)**: Stores tiny min/max summaries per `pages_per_range` contiguous 8 KiB heap blocks—often **1,000× smaller than B-Tree** on append-only time-series tables correlated with physical insertion order.\n- **`Hash` (`USING hash`)**: Stores 32-bit hash codes in bucket pages (fully WAL-logged and crash-safe since PG 10), excelling at pure `=` lookups on wide strings/URLs where key values would bloat B-Tree pages.',
        syntaxAnatomy: [
          '-- Compact path-hashed GIN index for JSONB @> containment:',
          'CREATE INDEX idx_job_payload_gin ON job_queue USING gin (payload jsonb_path_ops);',
          '',
          '-- GiST index for TSTZRANGE && overlap and @> containment:',
          'CREATE INDEX idx_req_during_gist ON booking_requests USING gist (requested_during);',
          '',
          '-- Crash-safe Hash index for exact = equality:',
          'CREATE INDEX idx_inv_ref_hash ON tenant_invoices USING hash (customer_ref);',
          '',
          '-- Tiny Block-Range summary index for append-only time-series:',
          'CREATE INDEX idx_tel_brin ON telemetry_partitioned USING brin (recorded_at) WITH (pages_per_range = 8);'
        ].join('\n'),
        internalsAndGotchas: [
          '`GIN` buffers new index entries in a `fastupdate` pending list flushed in batches (or by `VACUUM`), which can cause latency spikes when `gin_pending_list_limit` fills up on write-heavy tables.',
          '`jsonb_path_ops` is 40–60% smaller and faster than default `jsonb_ops` for `@>`, but does NOT support bare key-existence operators (`?`, `?|`, `?&`).',
          '`BRIN` is lossy: it skips non-matching block ranges and returns candidate blocks to a `Bitmap Heap Scan` recheck. If rows are updated/inserted out of timestamp order (`pg_stats.correlation` near `0`), `BRIN` degrades toward scanning every block!',
          '`Hash` indexes support ONLY equality (`=`)—never `<`, `>`, `ORDER BY`, `IS NULL`, multi-column composites, or `UNIQUE` constraints.'
        ],
        whenToUse: 'Choose `GIN` for `JSONB`/`ARRAY`/`TSVECTOR` element membership, `GiST` for ranges/geometries/`ltree`/K-NN, `BRIN` for chronologically appended telemetry tables, and `Hash` for single-column `=` lookups on wide text tokens.'
      },
      scenario: {
        role: 'Storage & Indexing Engine Specialist',
        incidentOrGoal: 'Ops tables in `pg_ops` need workload-matched secondary indexes: compact JSONB `@>` containment on `job_queue`, range-overlap `&&` lookups on `booking_requests`, exact token lookups on `tenant_invoices`, and ultra-low-footprint time-range pruning across `telemetry_partitioned`.',
        stakeholderNeed: 'Provision `GIN (jsonb_path_ops)`, `GiST`, `Hash`, and partitioned `BRIN (pages_per_range = 8)` indexes and verify their `pg_am` / `pg_opclass` catalog bindings.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Provision a GIN jsonb_path_ops Index on job_queue',
          mission: 'Create a `GIN` index named `idx_job_queue_payload_path_gin` on `job_queue` indexing `payload` with the compact `jsonb_path_ops` operator class for fast `@>` containment filtering.',
          setupSql: 'DROP INDEX IF EXISTS pg_ops.idx_job_queue_payload_path_gin;',
          probeSql: [
            'SELECT c.relname AS index_name,',
            '       am.amname AS access_method,',
            '       opc.opcname AS operator_class',
            'FROM pg_index i',
            'JOIN pg_class c ON c.oid = i.indexrelid',
            'JOIN pg_am am ON am.oid = c.relam',
            'JOIN pg_opclass opc ON opc.oid = i.indclass[0]',
            'WHERE c.relname = \'idx_job_queue_payload_path_gin\';'
          ].join('\n'),
          starterCode: [
            '-- Create GIN index idx_job_queue_payload_path_gin on job_queue(payload) using jsonb_path_ops',
            '-- CREATE INDEX ...'
          ].join('\n'),
          solutionCode: 'CREATE INDEX idx_job_queue_payload_path_gin ON job_queue USING gin (payload jsonb_path_ops);',
          hints: [
            'Specify the access method before the column list: `USING gin (...)`.',
            'Inside the parentheses, attach the operator class right after `payload`: `(payload jsonb_path_ops)`.',
            'Complete DDL: `CREATE INDEX idx_job_queue_payload_path_gin ON job_queue USING gin (payload jsonb_path_ops);`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bUSING\\s+gin\\b', flags: 'i', message: 'Specify `USING gin`.' },
              { pattern: '\\bjsonb_path_ops\\b', flags: 'i', message: 'Specify the `jsonb_path_ops` operator class.' }
            ]
          },
          solutionExplanation: 'Instead of creating separate inverted keys for every nested property name in `payload`, `jsonb_path_ops` hashes each complete key-path + scalar value into a single 4-byte integer entry, shrinking GIN footprint and speeding up multi-key `@>` intersections.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Create GiST Range & Hash Equality Indexes',
          mission: 'Execute two `CREATE INDEX` statements in a single migration: (1) `idx_booking_req_during_gist` on `booking_requests USING gist (requested_during)` for temporal overlap queries, and (2) `idx_invoices_cust_ref_hash` on `tenant_invoices USING hash (customer_ref)` for exact reference equality.',
          setupSql: 'DROP INDEX IF EXISTS pg_ops.idx_booking_req_during_gist; DROP INDEX IF EXISTS pg_ops.idx_invoices_cust_ref_hash;',
          probeSql: [
            'SELECT c.relname AS index_name,',
            '       t.relname AS table_name,',
            '       am.amname AS access_method',
            'FROM pg_index i',
            'JOIN pg_class c ON c.oid = i.indexrelid',
            'JOIN pg_class t ON t.oid = i.indrelid',
            'JOIN pg_am am ON am.oid = c.relam',
            'WHERE c.relname IN (\'idx_booking_req_during_gist\', \'idx_invoices_cust_ref_hash\')',
            'ORDER BY c.relname ASC;'
          ].join('\n'),
          starterCode: [
            '-- 1. Create GiST index idx_booking_req_during_gist on booking_requests(requested_during)',
            '',
            '-- 2. Create Hash index idx_invoices_cust_ref_hash on tenant_invoices(customer_ref)'
          ].join('\n'),
          solutionCode: [
            'CREATE INDEX idx_booking_req_during_gist ON booking_requests USING gist (requested_during);',
            'CREATE INDEX idx_invoices_cust_ref_hash ON tenant_invoices USING hash (customer_ref);'
          ].join('\n'),
          hints: [
            'For `TSTZRANGE` overlap (`&&`), write `CREATE INDEX idx_booking_req_during_gist ON booking_requests USING gist (requested_during);`.',
            'For exact string equality (`=`), write `CREATE INDEX idx_invoices_cust_ref_hash ON tenant_invoices USING hash (customer_ref);`.',
            'Include semicolons after both `CREATE INDEX` statements so both catalog entries exist when verified.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bUSING\\s+gist\\s*\\(\\s*requested_during\\s*\\)', flags: 'i', message: 'Create the GiST index `USING gist (requested_during)`.' },
              { pattern: '\\bUSING\\s+hash\\s*\\(\\s*customer_ref\\s*\\)', flags: 'i', message: 'Create the Hash index `USING hash (customer_ref)`.' }
            ]
          },
          solutionExplanation: '`GiST` organizes `TSTZRANGE` bounding intervals so `&&` conflict checks prune non-overlapping subtrees, while `Hash` maps `customer_ref` strings to compact 32-bit hash codes for constant-size equality bucket probes.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Create a Partitioned BRIN Index with Custom pages_per_range',
          mission: 'Create a `BRIN` block-range index named `idx_telemetry_recorded_brin` on the partitioned table `telemetry_partitioned` over `(recorded_at)` tuned with storage parameter `WITH (pages_per_range = 8)` so PostgreSQL automatically attaches fine-grained BRIN summaries to every monthly partition.',
          setupSql: 'DROP INDEX IF EXISTS pg_ops.idx_telemetry_recorded_brin;',
          probeSql: [
            'SELECT c.relname AS index_name,',
            '       am.amname AS access_method,',
            '       array_to_string(c.reloptions, \',\') AS storage_options,',
            '       (SELECT COUNT(*)::int FROM pg_inherits inh WHERE inh.inhparent = c.oid) AS partition_index_count',
            'FROM pg_class c',
            'JOIN pg_am am ON am.oid = c.relam',
            'WHERE c.relname = \'idx_telemetry_recorded_brin\';'
          ].join('\n'),
          starterCode: [
            '-- Create BRIN index idx_telemetry_recorded_brin on telemetry_partitioned(recorded_at)',
            '-- with storage option pages_per_range = 8',
            '-- CREATE INDEX ...'
          ].join('\n'),
          solutionCode: [
            'CREATE INDEX idx_telemetry_recorded_brin',
            '  ON telemetry_partitioned USING brin (recorded_at)',
            '  WITH (pages_per_range = 8);'
          ].join('\n'),
          hints: [
            'Use `USING brin (recorded_at)` on parent table `telemetry_partitioned`.',
            'Lower BRIN\'s default 128-page summary granularity to 8 pages by appending `WITH (pages_per_range = 8);`.',
            'PostgreSQL cascades partitioned index creation across all 3 existing child partitions (`telemetry_2025_01`..`03`).'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bUSING\\s+brin\\s*\\(\\s*recorded_at\\s*\\)', flags: 'i', message: 'Specify `USING brin (recorded_at)`.' },
              { pattern: '\\bWITH\\s*\\(\\s*pages_per_range\\s*=\\s*8\\s*\\)', flags: 'i', message: 'Configure `WITH (pages_per_range = 8)`.' }
            ]
          },
          solutionExplanation: 'Lowering `pages_per_range` from the default `128` (1 MiB) to `8` (64 KiB) gives BRIN tighter min/max timestamp bounds per block range while keeping index size negligible across all 3 child partitions.'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m06-t06 — Decoding EXPLAIN (ANALYZE, BUFFERS): Costs, Loops & Buffer Hits
       ======================================================================== */
    {
      id: 'pg-m06-t06',
      slug: 'reading-explain-analyze-buffers',
      moduleId: 'pg-m06',
      title: 'Decoding EXPLAIN (ANALYZE, BUFFERS): Costs, Loops & Buffer Hits',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)'],
      tags: ['explain-analyze', 'buffers', 'cardinality', 'loops', 'planner'],
      guide: {
        mentalModel: '`EXPLAIN` alone shows the optimizer\'s **cost model guesses** (measured in abstract `seq_page_cost = 1.0` units). `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` **actually executes** the query and instruments every physical operator with ground-truth counters:\n\n1. **Multiply by `Actual Loops`!** PostgreSQL reports `Actual Total Time` and `Actual Rows` as **per-invocation averages**. An inner `Index Scan` showing `actual time=0.08..0.12 rows=3 loops=2500` actually consumed `0.12 × 2500 = 300 ms` and produced `7,500` rows!\n2. **Cardinality Q-Error (`Actual Rows / Plan Rows`)**: Orders-of-magnitude drift between estimated `Plan Rows` and `Actual Rows` is the #1 root cause of catastrophic join flips (`Nested Loop` chosen when `Hash Join` was needed).\n3. **Prioritize `BUFFERS` over wall-clock jitter**: Wall-clock milliseconds fluctuate with OS cache and CPU load, whereas `Shared Hit Blocks` (8 KiB pages served from PostgreSQL `shared_buffers`), `Shared Read Blocks` (OS/disk fetches), and `Temp Written Blocks` (work_mem disk spills) are deterministic physical work metrics.',
        syntaxAnatomy: [
          '-- Always include BUFFERS alongside ANALYZE (safe inside BEGIN ... ROLLBACK for DML!):',
          'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)',
          'SELECT s.shipment_id, w.warehouse_code, s.weight_kg',
          'FROM incident_shipments s',
          'JOIN incident_warehouses w ON w.warehouse_id = s.warehouse_id',
          'WHERE s.carrier_code = \'DHL\';',
          '',
          '-- Converting 8 KiB buffer counters to cache-hit % and MiB spilled:',
          '-- hit_pct  = 100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0)',
          '-- spill_mb = (temp_blks_written * 8.0) / 1024.0'
        ].join('\n'),
        internalsAndGotchas: [
          '`EXPLAIN ANALYZE` genuinely executes `INSERT`, `UPDATE`, `DELETE`, and `MERGE` statements! Always wrap mutating `EXPLAIN ANALYZE` runs inside `BEGIN; EXPLAIN (ANALYZE, BUFFERS) ...; ROLLBACK;`.',
          'In `FORMAT JSON`, `Shared Hit Blocks` and `Shared Read Blocks` on a parent node include the cumulative buffer counts of all its child sub-plans, whereas in text format notice whether counters belong to the parent vs child.',
          'Each PostgreSQL buffer block (`BLCKSZ`) is **8 KiB** (`8192` bytes): `128` blocks = `1 MiB`, so `temp_blks_written = 96400` equals `753.13 MiB` spilled to `pgsql_tmp` on disk.',
          'On virtualized cloud instances, `TIMING OFF` (`EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)`) eliminates `gettimeofday()`/`clock_gettime()` overhead when profiling million-loop Nested Loops while preserving exact row and buffer counts.'
        ],
        whenToUse: 'Run `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` whenever diagnosing slow queries, verifying index adoption, hunting `work_mem` disk spills, or auditing planner cardinality accuracy.'
      },
      scenario: {
        role: 'Production Query Triage Lead',
        incidentOrGoal: 'During a latency spike, engineers misread per-loop `0.15 ms` inner probes as harmless and overlooked `temp_blks_written` disk spills in `cluster_stat_statements`.',
        stakeholderNeed: 'Capture a live `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` plan, compute loop-multiplied execution times and cardinality ratios across captured plan nodes, and quantify 8 KiB buffer hit ratios and temp disk spills in `cluster_stat_statements`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Capture a Live EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) Plan',
          mission: 'Prepend `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` to the warehouse shipment join query (`incident_shipments s` joined to `incident_warehouses w` on `warehouse_id` where `s.carrier_code = \'DHL\'` ordered by `s.shipped_at DESC`) so PostgreSQL 18 emits the full instrumented JSON execution tree with buffer counters.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Instrument this join query with EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)',
            'SELECT s.shipment_id, w.warehouse_code, w.region, s.weight_kg, s.shipped_at',
            'FROM incident_shipments s',
            'JOIN incident_warehouses w ON w.warehouse_id = s.warehouse_id',
            'WHERE s.carrier_code = \'DHL\'',
            'ORDER BY s.shipped_at DESC;'
          ].join('\n'),
          solutionCode: [
            'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)',
            'SELECT s.shipment_id, w.warehouse_code, w.region, s.weight_kg, s.shipped_at',
            'FROM incident_shipments s',
            'JOIN incident_warehouses w ON w.warehouse_id = s.warehouse_id',
            'WHERE s.carrier_code = \'DHL\'',
            'ORDER BY s.shipped_at DESC;'
          ].join('\n'),
          hints: [
            'Add `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` directly above the `SELECT` keyword (no semicolon between `EXPLAIN (...)` and `SELECT`).',
            'Make sure all three options—`ANALYZE`, `BUFFERS`, and `FORMAT JSON`—are enabled inside the parentheses.',
            'Keep the join between `incident_shipments s` and `incident_warehouses w` intact.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            ignoreColumns: ['QUERY PLAN'],
            columnChecks: [
              { col: 'QUERY PLAN', notNull: true, regex: 'Shared Hit Blocks|Shared Read Blocks', message: 'Include `BUFFERS` in `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` so buffer block counters appear.' },
              { col: 'QUERY PLAN', regex: 'Actual Loops', message: 'Include `ANALYZE` and `FORMAT JSON` so structured runtime metrics (`Actual Loops`) are emitted.' },
              { col: 'QUERY PLAN', regex: 'incident_warehouses', message: 'Explain the join against `incident_warehouses`.' }
            ],
            requiredPatterns: [
              { pattern: '\\bEXPLAIN\\s*\\([^)]*\\bANALYZE\\b', flags: 'i', message: 'Include `ANALYZE` inside `EXPLAIN (...)`.' },
              { pattern: '\\bEXPLAIN\\s*\\([^)]*\\bBUFFERS\\b', flags: 'i', message: 'Include `BUFFERS` inside `EXPLAIN (...)`.' },
              { pattern: '\\bEXPLAIN\\s*\\([^)]*\\bFORMAT\\s+JSON\\b', flags: 'i', message: 'Include `FORMAT JSON` inside `EXPLAIN (...)`.' }
            ]
          },
          solutionExplanation: '`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` returns a machine-parseable JSON document exposing `Plan Rows`, `Actual Rows`, `Actual Loops`, and `Shared Hit/Read Blocks` for every node in the plan tree.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Multiply Per-Loop Timings & Spot Cardinality Q-Error Skew',
          mission: 'Query `captured_plan_nodes` (extracted from an incident `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` trace) and project 6 columns in exact order: `node_id`, `node_type`, `relation_name`, `true_total_ms` (`ROUND(per_loop_ms * actual_loops, 2)`), `row_est_ratio` (`ROUND(actual_rows::numeric / GREATEST(plan_rows, 1), 2)`), and `total_shared_blks` (`shared_hit_blks + shared_read_blks`). Filter to problem nodes where `per_loop_ms * actual_loops >= 10` OR `actual_rows::numeric / GREATEST(plan_rows, 1) >= 10`, sorted by `true_total_ms DESC, node_id ASC`.',
          setupSql: [
            'CREATE TEMP TABLE captured_plan_nodes (',
            '  node_id INTEGER PRIMARY KEY,',
            '  node_type TEXT NOT NULL,',
            '  relation_name TEXT NOT NULL,',
            '  plan_rows BIGINT NOT NULL,',
            '  actual_rows BIGINT NOT NULL,',
            '  actual_loops INTEGER NOT NULL,',
            '  per_loop_ms NUMERIC(10,3) NOT NULL,',
            '  shared_hit_blks BIGINT NOT NULL,',
            '  shared_read_blks BIGINT NOT NULL',
            ');',
            'INSERT INTO captured_plan_nodes VALUES',
            '  (1, \'Limit\', \'result_root\', 20, 20, 1, 1.420, 18, 0),',
            '  (2, \'Nested Loop\', \'join_orders_items\', 15, 12600, 1, 412.500, 38100, 4200),',
            '  (3, \'Index Scan\', \'orders\', 12, 8400, 1, 6.800, 2100, 350),',
            '  (4, \'Index Scan\', \'order_items\', 2, 3, 8400, 0.048, 36000, 3850),',
            '  (5, \'Index Only Scan\', \'customers\', 1, 1, 20, 0.015, 60, 0);'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- Compute loop-multiplied true_total_ms, row_est_ratio, and total_shared_blks for bottleneck/skewed nodes',
            'SELECT node_id,',
            '       node_type,',
            '       relation_name',
            '       -- TODO: true_total_ms, row_est_ratio, total_shared_blks',
            'FROM captured_plan_nodes',
            '-- TODO: filter where true_total_ms >= 10 OR row_est_ratio >= 10',
            'ORDER BY node_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT node_id,',
            '       node_type,',
            '       relation_name,',
            '       ROUND(per_loop_ms * actual_loops, 2) AS true_total_ms,',
            '       ROUND(actual_rows::numeric / GREATEST(plan_rows, 1), 2) AS row_est_ratio,',
            '       (shared_hit_blks + shared_read_blks) AS total_shared_blks',
            'FROM captured_plan_nodes',
            'WHERE (per_loop_ms * actual_loops) >= 10',
            '   OR (actual_rows::numeric / GREATEST(plan_rows, 1)) >= 10',
            'ORDER BY true_total_ms DESC, node_id ASC;'
          ].join('\n'),
          hints: [
            'Multiply `per_loop_ms * actual_loops` inside `ROUND(..., 2) AS true_total_ms`—notice node `4` (`0.048 ms × 8400 loops = 403.20 ms`!) accounts for 98% of query latency.',
            'Compute `ROUND(actual_rows::numeric / GREATEST(plan_rows, 1), 2) AS row_est_ratio` and `(shared_hit_blks + shared_read_blks) AS total_shared_blks`.',
            'Filter `WHERE (per_loop_ms * actual_loops) >= 10 OR (actual_rows::numeric / GREATEST(plan_rows, 1)) >= 10` and sort by `true_total_ms DESC, node_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bper_loop_ms\\s*\\*\\s*actual_loops\\b|\\bactual_loops\\s*\\*\\s*per_loop_ms\\b', flags: 'i', message: 'Multiply `per_loop_ms * actual_loops` to uncover total cumulative time.' },
              { pattern: '\\bAS\\s+row_est_ratio\\b', flags: 'i', message: 'Alias the cardinality ratio column as `AS row_est_ratio`.' }
            ]
          },
          solutionExplanation: 'Node 3 (`orders`) underestimated rows by `700x` (`8400` actual vs `12` planned), tricking the optimizer into a `Nested Loop` whose inner `Index Scan` on `order_items` looked cheap per loop (`0.048 ms`) but ran `8,400` times (`403.20 ms`, `39,850` buffer blocks)!'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Audit 8 KiB Shared Buffer Hit % & Temp Disk Spills in cluster_stat_statements',
          mission: 'Query `cluster_stat_statements` for I/O-heavy or spilling queries where `(shared_blks_hit + shared_blks_read) > 0` AND `(shared_blks_read >= 10000 OR temp_blks_written > 0)`. Project 5 columns in exact order: `queryid`, `rolname`, `calls`, `shared_hit_pct` (`ROUND(100.0 * shared_blks_hit / (shared_blks_hit + shared_blks_read), 2)`), and `temp_spill_mb` (`temp_blks_written` converted from 8 KiB PostgreSQL blocks to exact MiB via `ROUND((temp_blks_written * 8.0) / 1024, 2)`). Sort by `shared_blks_read DESC, queryid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Audit buffer cache hit ratio (%) and 8 KiB temp spill volume (MiB) across cluster_stat_statements',
            'SELECT queryid,',
            '       rolname,',
            '       calls',
            '       -- TODO: shared_hit_pct and temp_spill_mb',
            'FROM cluster_stat_statements',
            '-- TODO: filter heavy read / temp spill queries and sort by shared_blks_read DESC, queryid ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       ROUND(100.0 * shared_blks_hit / (shared_blks_hit + shared_blks_read), 2) AS shared_hit_pct,',
            '       ROUND((temp_blks_written * 8.0) / 1024, 2) AS temp_spill_mb',
            'FROM cluster_stat_statements',
            'WHERE (shared_blks_hit + shared_blks_read) > 0',
            '  AND (shared_blks_read >= 10000 OR temp_blks_written > 0)',
            'ORDER BY shared_blks_read DESC, queryid ASC;'
          ].join('\n'),
          hints: [
            'Compute buffer cache hit percentage using `ROUND(100.0 * shared_blks_hit / (shared_blks_hit + shared_blks_read), 2) AS shared_hit_pct`.',
            'Convert 8 KiB blocks to MiB (`1 MiB = 1024 KiB = 128 × 8 KiB blocks`) via `ROUND((temp_blks_written * 8.0) / 1024, 2) AS temp_spill_mb`.',
            'Filter `WHERE (shared_blks_hit + shared_blks_read) > 0 AND (shared_blks_read >= 10000 OR temp_blks_written > 0)` and sort `ORDER BY shared_blks_read DESC, queryid ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bshared_blks_hit\\b', flags: 'i', message: 'Use `shared_blks_hit` and `shared_blks_read` to calculate `shared_hit_pct`.' },
              { pattern: '\\btemp_blks_written\\b', flags: 'i', message: 'Convert `temp_blks_written` 8 KiB blocks into `temp_spill_mb`.' }
            ]
          },
          solutionExplanation: 'Multiplying `temp_blks_written * 8.0 / 1024` immediately pinpoints `queryid = 900103` (`753.13 MiB` temp spill, `27.61%` hit ratio) and `900102` (`4.68M` cold block reads from a non-SARGable `LOWER(customer_email)` scan).'
        }
      ]
    },

    /* ========================================================================
       LAB 07: pg-m06-t07 — Physical Join Operators: Nested Loop (Memoize), Hash Join & Merge Join
       ======================================================================== */
    {
      id: 'pg-m06-t07',
      slug: 'physical-joins-nested-hash-merge',
      moduleId: 'pg-m06',
      title: 'Physical Join Operators: Nested Loop (Memoize), Hash Join & Merge Join',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'ecommerce',
      clauses: ['SET LOCAL enable_hashjoin', 'Nested Loop', 'Hash Join', 'Merge Join'],
      tags: ['nested-loop', 'hash-join', 'merge-join', 'memoize', 'optimizer'],
      guide: {
        mentalModel: 'Logical `JOIN` syntax specifies *what* tuples match; PostgreSQL\'s dynamic-programming / GEQO optimizer chooses *how* to execute each join from three physical operators:\n\n1. **`Nested Loop` (+ `Memoize`)**: For each outer row ($N$), probes the inner relation ($M$). Ideal (`O(N log M)`) when $N$ is tiny and the inner join key is indexed—and the **only** operator supporting arbitrary non-equi predicates (`<`, `BETWEEN`, `LATERAL`). In PG 14–18, **`Memoize`** sits between `Nested Loop` and the inner `Index Scan`, caching inner lookups in an LRU hash table when outer join keys repeat!\n2. **`Hash Join`**: Scans the smaller inner input once to build an in-memory hash table inside `work_mem * hash_mem_multiplier`, then streams the larger outer input probing hash buckets in `O(N + M)`. Workhorse for large, unfiltered equi-joins (`=`), but spills multi-batch temp files to disk if `work_mem` is exceeded.\n3. **`Merge Join`**: Walks both inputs in sorted join-key order like a zipper (`O(N + M)` with zero `work_mem` hash buildup once inputs are pre-sorted by B-Tree indexes).',
        syntaxAnatomy: [
          '-- Diagnose alternative join plans safely inside a transaction with SET LOCAL:',
          'BEGIN;',
          'SET LOCAL enable_hashjoin = off;   -- Adds 10^10 disable_cost penalty (does not make impossible)',
          'SET LOCAL enable_nestloop = off;',
          'EXPLAIN (ANALYZE, BUFFERS)',
          'SELECT o.order_id, p.payment_id, p.method',
          'FROM orders o',
          'JOIN payments p ON p.order_id = o.order_id',
          'ORDER BY o.order_id ASC;',
          'ROLLBACK;'
        ].join('\n'),
        internalsAndGotchas: [
          '`SET LOCAL enable_hashjoin = off` does not strictly forbid a `Hash Join`—it adds `disable_cost` (`1.0e10`) so PostgreSQL still falls back to it if no other physical path exists (unlike `Nested Loop`, neither `Hash Join` nor `Merge Join` can execute `<` or `&&` range joins).',
          'Never leave `enable_* = off` in production `postgresql.conf`; use `SET LOCAL` exclusively in diagnostic transactions to test whether stale statistics or `random_page_cost` caused a suboptimal join choice.',
          'When `Hash Join` shows `Batches: 16` in `EXPLAIN (ANALYZE, BUFFERS)`, the inner hash table overflowed `work_mem * hash_mem_multiplier` and spilled temporary batch files to disk.',
          '`Memoize` dramatically accelerates `Nested Loop` joins when a high-row-count fact stream joins a low-cardinality dimension PK (`8` distinct `product_id`s across thousands of events).'
        ],
        whenToUse: 'Expect indexed `Nested Loop` (+ `Memoize`) for selective OLTP lookups, `Hash Join` for ad-hoc analytical equi-joins, and `Merge Join` when joining large streams already ordered by B-Tree indexes or `ORDER BY`.'
      },
      scenario: {
        role: 'Query Optimizer & Execution Engineer',
        incidentOrGoal: 'Engineers want concrete proof of when PostgreSQL 18 wins with `Nested Loop` + `Memoize`, `Hash Join`, and pre-sorted `Merge Join` across the commerce schema.',
        stakeholderNeed: 'Execute a `Nested Loop` (`Memoize`) aggregation over a repeating product stream, run a bulk `Hash Join` revenue rollup across `customers` and `orders`, and steer an `orders ⋈ payments` query into a `Merge Join` using `SET LOCAL` planner GUCs.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Parameterized Nested Loop (+ Memoize) on Repeating Foreign Keys',
          mission: 'Join the 400-row `order_line_stream s` table (containing repeated references to just 8 `product_id`s) with `products p` on `product_id`. Project `p.category_id`, `COUNT(*)::int AS line_count`, and `SUM(s.qty * p.price_cents)::bigint AS gross_cents`, grouped by `p.category_id` and sorted by `p.category_id ASC`.',
          setupSql: [
            'CREATE TEMP TABLE order_line_stream AS',
            'SELECT g AS stream_id,',
            '       ((g % 8) + 101) AS product_id,',
            '       ((g % 3) + 1) AS qty',
            'FROM generate_series(1, 400) AS g;',
            'ANALYZE order_line_stream;',
            'ANALYZE products;',
            'SET LOCAL enable_hashjoin = off;',
            'SET LOCAL enable_mergejoin = off;',
            'SET LOCAL enable_seqscan = off;'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- TODO: Join order_line_stream s to products p, project SUM(s.qty * p.price_cents)::bigint AS gross_cents, GROUP BY p.category_id',
            'SELECT s.product_id,',
            '       COUNT(*)::int AS line_count',
            'FROM order_line_stream s',
            'GROUP BY s.product_id',
            'ORDER BY s.product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT p.category_id,',
            '       COUNT(*)::int AS line_count,',
            '       SUM(s.qty * p.price_cents)::bigint AS gross_cents',
            'FROM order_line_stream s',
            'JOIN products p ON p.product_id = s.product_id',
            'GROUP BY p.category_id',
            'ORDER BY p.category_id ASC;'
          ].join('\n'),
          hints: [
            'Join `products p ON p.product_id = s.product_id`.',
            'Compute `SUM(s.qty * p.price_cents)::bigint AS gross_cents` alongside `COUNT(*)::int AS line_count`.',
            'Group by `p.category_id` and sort by `p.category_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'Nested Loop',
            requiredPatterns: [
              { pattern: '\\bJOIN\\s+products\\s+p\\s+ON\\b', flags: 'i', message: 'Join `products p` on `product_id`.' },
              { pattern: '\\bAS\\s+gross_cents\\b', flags: 'i', message: 'Alias total revenue as `AS gross_cents`.' }
            ]
          },
          solutionExplanation: 'With only 8 distinct `product_id` keys across 400 stream rows, PostgreSQL wraps the inner `products_pkey` `Index Scan` inside a `Memoize` cache under `Nested Loop`, probing the B-Tree just 8 times and serving the remaining 392 lookups from memory.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Bulk Equi-Join Aggregation Powered by Hash Join',
          mission: 'Join `customers c` with `orders o` on `customer_id` filtered to `WHERE o.status = \'completed\'`. Project 3 columns in exact order: `c.tier`, `COUNT(*)::int AS completed_orders`, and `SUM(o.total_cents)::bigint AS tier_revenue_cents`, grouped by `c.tier` and sorted by `tier_revenue_cents DESC, c.tier ASC` via an in-memory `Hash Join`.',
          setupSql: 'ANALYZE customers; ANALYZE orders; SET LOCAL enable_nestloop = off; SET LOCAL enable_mergejoin = off;',
          probeSql: '',
          starterCode: [
            '-- TODO: Join customers c to orders o (status = \'completed\'), project SUM(o.total_cents)::bigint AS tier_revenue_cents, GROUP BY c.tier',
            'SELECT c.tier,',
            '       COUNT(*)::int AS customer_count',
            'FROM customers c',
            'GROUP BY c.tier',
            'ORDER BY c.tier ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.tier,',
            '       COUNT(*)::int AS completed_orders,',
            '       SUM(o.total_cents)::bigint AS tier_revenue_cents',
            'FROM customers c',
            'JOIN orders o ON o.customer_id = c.customer_id',
            'WHERE o.status = \'completed\'',
            'GROUP BY c.tier',
            'ORDER BY tier_revenue_cents DESC, c.tier ASC;'
          ].join('\n'),
          hints: [
            'Join `orders o ON o.customer_id = c.customer_id` and filter `WHERE o.status = \'completed\'`.',
            'Aggregate `COUNT(*)::int AS completed_orders` and `SUM(o.total_cents)::bigint AS tier_revenue_cents`.',
            'Group by `c.tier` and sort by `tier_revenue_cents DESC, c.tier ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'Hash Join',
            requiredPatterns: [
              { pattern: '\\bJOIN\\s+orders\\s+o\\s+ON\\b', flags: 'i', message: 'Join `orders o` on `customer_id`.' },
              { pattern: '\\bWHERE\\s+o\\.status\\s*=\\s*\'completed\'', flags: 'i', message: 'Filter `WHERE o.status = \'completed\'`.' }
            ]
          },
          solutionExplanation: 'PostgreSQL hashes `customers` on `customer_id` into a single in-memory `Hash` batch (`Buckets: 1024 Batches: 1`) and streams `orders` through `Hash Cond: (o.customer_id = c.customer_id)` in `O(N + M)` time.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Steer an Ordered Join into Merge Join with SET LOCAL GUCs',
          mission: 'Use transaction-scoped planner GUCs (`SET LOCAL enable_hashjoin = off;` and `SET LOCAL enable_nestloop = off;`) followed by an equi-join between `orders o` and `payments p` on `order_id` projecting `o.order_id`, `o.customer_id`, `o.total_cents`, `p.payment_id`, and `p.method`, sorted by `o.order_id ASC, p.payment_id ASC` so `Merge Join` streams aligned keys.',
          setupSql: 'ANALYZE orders; ANALYZE payments;',
          probeSql: '',
          starterCode: [
            '-- Disable hashjoin and nestloop with SET LOCAL, then join orders o and payments p ordered by order_id',
            '-- TODO: SET LOCAL enable_hashjoin = off;',
            '-- TODO: SET LOCAL enable_nestloop = off;',
            'SELECT o.order_id, o.customer_id, o.total_cents, p.payment_id',
            'FROM orders o',
            'JOIN payments p ON p.order_id = o.order_id;'
          ].join('\n'),
          solutionCode: [
            'SET LOCAL enable_hashjoin = off;',
            'SET LOCAL enable_nestloop = off;',
            'SELECT o.order_id, o.customer_id, o.total_cents, p.payment_id, p.method',
            'FROM orders o',
            'JOIN payments p ON p.order_id = o.order_id',
            'ORDER BY o.order_id ASC, p.payment_id ASC;'
          ].join('\n'),
          hints: [
            'Start your script with `SET LOCAL enable_hashjoin = off;` and `SET LOCAL enable_nestloop = off;` so the planner evaluates the `Merge Join` path without leaking session-wide GUC state.',
            'Add `p.method` as the 5th projected column in `SELECT`.',
            'Add `ORDER BY o.order_id ASC, p.payment_id ASC;`—notice `Merge Join` naturally preserves `order_id ASC` order!'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bSET\\s+LOCAL\\s+enable_hashjoin\\s*=\\s*(off|\'off\'|false)\\b', flags: 'i', message: 'Set `SET LOCAL enable_hashjoin = off;`.' },
              { pattern: '\\bSET\\s+LOCAL\\s+enable_nestloop\\s*=\\s*(off|\'off\'|false)\\b', flags: 'i', message: 'Set `SET LOCAL enable_nestloop = off;`.' },
              { pattern: '\\bORDER\\s+BY\\s+o\\.order_id\\s+ASC\\s*,\\s*p\\.payment_id\\s+ASC\\b', flags: 'i', message: 'Order by `o.order_id ASC, p.payment_id ASC`.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\benable_(hashjoin|nestloop)\\s*=\\s*(on|\'on\'|true)\\b', flags: 'i', message: 'Keep both `enable_hashjoin` and `enable_nestloop` set to `off`.' }
            ]
          },
          solutionExplanation: '`SET LOCAL` confines planner cost-penalty experiments strictly to the current transaction, proving how `Merge Join` zippers `orders` and `payments` along `order_id` while emitting pre-sorted output.'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m06-t08 — pg_stats Histograms, Multivariate CREATE STATISTICS & Keyset Pagination
       ======================================================================== */
    {
      id: 'pg-m06-t08',
      slug: 'pg-stats-extended-statistics-keyset',
      moduleId: 'pg-m06',
      title: 'pg_stats Histograms, Multivariate CREATE STATISTICS & Keyset Pagination',
      difficulty: 'Staff',
      estimatedMinutes: 20,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_stats', 'CREATE STATISTICS', 'ANALYZE', '(a, b) < (x, y)'],
      tags: ['pg-stats', 'extended-statistics', 'keyset-pagination', 'cursor', 'performance'],
      guide: {
        mentalModel: 'At Staff level, fixing chronic optimizer pathology and deep-page latency degrades down to two architectural primitives:\n\n1. **Single-Column `pg_stats` vs Multivariate `CREATE STATISTICS`**: By default, `ANALYZE` collects **independent** per-column summaries in `pg_statistic` (exposed via `pg_stats`: `null_frac`, `n_distinct`, `most_common_vals`/`most_common_freqs`, `histogram_bounds`, and physical heap-order `correlation` in `[-1, +1]`). When two columns are functionally correlated—e.g., `tenant_id = \'acme\'` ALWAYS lives in `region = \'us-east-1\'`—multiplying independent selectivities (`0.25 × 0.25 = 0.0625` instead of `0.25`) underestimates rows by 4×–1000×! **`CREATE STATISTICS ... (dependencies, ndistinct, mcv)` + `ANALYZE`** teaches the planner cross-column functional dependencies, `GROUP BY` distinct counts, and joint MCV lists.\n2. **Row-Value Keyset (Seek) Pagination**: `OFFSET 100000 LIMIT 20` forces PostgreSQL to scan and discard `100,000` tuples (`O(N)`). Using SQL row-constructor comparison `(created_at, event_id) < ($last_ts, $last_id)` backed by a composite B-Tree `(created_at DESC, event_id DESC)` jumps directly to the cursor boundary in **`O(log N)`** with zero skipped or duplicated tie-timestamp rows!',
        syntaxAnatomy: [
          '-- 1. Inspect column selectivity & physical heap correlation:',
          'SELECT attname, null_frac, n_distinct, correlation',
          'FROM pg_stats WHERE schemaname = \'pg_ops\' AND tablename = \'skewed_audit_log\';',
          '',
          '-- 2. Cure correlated-column cardinality underestimates:',
          'CREATE STATISTICS stat_skewed_tenant_region (dependencies, ndistinct)',
          '  ON tenant_id, region FROM skewed_audit_log;',
          'ANALYZE skewed_audit_log;',
          '',
          '-- 3. O(log N) Row-Value Keyset Pagination (tie-safe cursor seek):',
          'SELECT event_id, tenant_id, endpoint, created_at',
          'FROM api_audit_events',
          'WHERE (created_at, event_id) < (TIMESTAMPTZ \'2025-03-15 14:15:05+00\', 1011)',
          'ORDER BY created_at DESC, event_id DESC',
          'LIMIT 3;'
        ].join('\n'),
        internalsAndGotchas: [
          '`CREATE STATISTICS` ONLY writes a catalog definition in `pg_statistic_ext`—it collects **zero** data until the next `ANALYZE` (or autoanalyze) runs on the table!',
          'In `pg_stats`, a negative `n_distinct` (for example `-1.0`) is NOT an error: PostgreSQL encodes `n_distinct < 0` as a ratio of total rows (`-1.0` means 100% unique, like a primary key), whereas positive values are fixed distinct counts.',
          'Never write keyset pagination as `WHERE created_at < $last_ts` alone when multiple events can share the same microsecond/second timestamp—any tie rows at `$last_ts` after the page cut are permanently lost! Always include a unique tie-breaker key `(created_at, event_id) < ($last_ts, $last_id)`.',
          'PostgreSQL pushes native row-constructor `ROW(a, b) < ROW(x, y)` directly into a single B-Tree `Index Cond` only when both columns share the **same sort direction** (`(a DESC, b DESC)` for `<`, or `(a ASC, b ASC)` for `>`).'
        ],
        whenToUse: 'Inspect `pg_stats` + `CREATE STATISTICS` whenever `EXPLAIN ANALYZE` shows multi-column `WHERE` or `GROUP BY` row underestimates, and replace `OFFSET` with `(ts, id) < (...)` keyset cursors on all infinite-scroll or API feed endpoints.'
      },
      scenario: {
        role: 'Staff Database Architect',
        incidentOrGoal: 'Tenant audit queries suffer 4× row underestimates due to `(tenant_id, region)` functional correlation, while the `/v2/audit` API degrades at deep `OFFSET` pages and drops events sharing identical timestamps.',
        stakeholderNeed: 'Audit `pg_stats` correlation and null fractions, build and `ANALYZE` multivariate extended statistics (`dependencies, ndistinct`), and replace `OFFSET` with tie-safe `O(log N)` row-value keyset pagination.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Inspect Selectivity & Physical Correlation in pg_stats',
          mission: 'Query `pg_stats` for `schemaname = \'pg_ops\'` and `tablename = \'skewed_audit_log\'`. Project 4 columns in exact order: `attname`, `ROUND(null_frac::numeric, 2) AS null_frac`, `n_distinct`, and `ROUND(correlation::numeric, 2) AS physical_correlation`, sorted by `attname ASC`.',
          setupSql: [
            'DROP TABLE IF EXISTS pg_ops.skewed_audit_log CASCADE;',
            'CREATE TABLE pg_ops.skewed_audit_log AS',
            'SELECT g::bigint AS event_id,',
            '       (ARRAY[\'acme\', \'globex\', \'initech\', \'umbraco\'])[(g % 4) + 1] AS tenant_id,',
            '       (ARRAY[\'us-east-1\', \'eu-west-1\', \'us-west-2\', \'ap-south-1\'])[(g % 4) + 1] AS region,',
            '       CASE WHEN g % 4 = 0 THEN \'ERR_TIMEOUT\' ELSE NULL END AS error_code',
            'FROM generate_series(1, 400) AS g;',
            'ANALYZE pg_ops.skewed_audit_log;'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- Inspect planner column statistics in pg_stats for pg_ops.skewed_audit_log',
            'SELECT attname',
            '       -- TODO: ROUND(null_frac::numeric, 2) AS null_frac, n_distinct, ROUND(correlation::numeric, 2) AS physical_correlation',
            'FROM pg_stats',
            '-- TODO: filter schemaname = \'pg_ops\' AND tablename = \'skewed_audit_log\', sort by attname ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT attname,',
            '       ROUND(null_frac::numeric, 2) AS null_frac,',
            '       n_distinct,',
            '       ROUND(correlation::numeric, 2) AS physical_correlation',
            'FROM pg_stats',
            'WHERE schemaname = \'pg_ops\'',
            '  AND tablename = \'skewed_audit_log\'',
            'ORDER BY attname ASC;'
          ].join('\n'),
          hints: [
            '`null_frac` and `correlation` are `REAL` (`float4`) columns in `pg_stats`; cast them with `::numeric` inside `ROUND(..., 2)`.',
            'Filter `WHERE schemaname = \'pg_ops\' AND tablename = \'skewed_audit_log\'`.',
            'Sort by `attname ASC`—notice `event_id` has `n_distinct = -1` (100% unique) and `physical_correlation = 1.00` (perfect BRIN/range-scan locality).'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bFROM\\s+pg_stats\\b', flags: 'i', message: 'Query the `pg_stats` system view.' },
              { pattern: '\\bcorrelation\\b', flags: 'i', message: 'Project `ROUND(correlation::numeric, 2) AS physical_correlation`.' }
            ]
          },
          solutionExplanation: '`pg_stats` reveals `error_code` has `null_frac = 0.75`, `event_id` has `n_distinct = -1` (100% distinct) with `physical_correlation = 1.00`, and both `tenant_id` and `region` have `n_distinct = 4`—yet single-column stats hide their 1-to-1 coupling!'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Cure Correlated Skew with CREATE STATISTICS & ANALYZE',
          mission: 'On `pg_ops.skewed_audit_log` (where each `tenant_id` maps deterministically to a single `region`), create an extended statistics object named `stat_skewed_tenant_region` tracking `(dependencies, ndistinct)` on `tenant_id, region`, and immediately run `ANALYZE skewed_audit_log;` so `pg_stats_ext` is populated.',
          setupSql: [
            'DROP TABLE IF EXISTS pg_ops.skewed_audit_log CASCADE;',
            'CREATE TABLE pg_ops.skewed_audit_log AS',
            'SELECT g::bigint AS event_id,',
            '       (ARRAY[\'acme\', \'globex\', \'initech\', \'umbraco\'])[(g % 4) + 1] AS tenant_id,',
            '       (ARRAY[\'us-east-1\', \'eu-west-1\', \'us-west-2\', \'ap-south-1\'])[(g % 4) + 1] AS region',
            'FROM generate_series(1, 400) AS g;'
          ].join('\n'),
          probeSql: [
            'SELECT statistics_name,',
            '       attnames::text AS tracked_columns,',
            '       kinds::text AS stat_kinds,',
            '       (dependencies IS NOT NULL) AS has_dependencies,',
            '       (n_distinct IS NOT NULL) AS has_ndistinct',
            'FROM pg_stats_ext',
            'WHERE schemaname = \'pg_ops\'',
            '  AND tablename = \'skewed_audit_log\'',
            '  AND statistics_name = \'stat_skewed_tenant_region\';'
          ].join('\n'),
          starterCode: [
            '-- 1. Create extended statistics stat_skewed_tenant_region (dependencies, ndistinct) on tenant_id, region',
            '',
            '-- 2. Run ANALYZE skewed_audit_log so PostgreSQL computes the multivariate stats!'
          ].join('\n'),
          solutionCode: [
            'CREATE STATISTICS stat_skewed_tenant_region (dependencies, ndistinct)',
            '  ON tenant_id, region FROM skewed_audit_log;',
            'ANALYZE skewed_audit_log;'
          ].join('\n'),
          hints: [
            'Syntax: `CREATE STATISTICS stat_skewed_tenant_region (dependencies, ndistinct) ON tenant_id, region FROM skewed_audit_log;`.',
            'Follow immediately with `ANALYZE skewed_audit_log;`—without `ANALYZE`, `dependencies` and `n_distinct` in `pg_stats_ext` remain `NULL`!',
            'Keep the kinds ordered as `(dependencies, ndistinct)` on columns `tenant_id, region`.'
          ],
          assertions: {
            orderMatters: false,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bCREATE\\s+STATISTICS\\s+(IF\\s+NOT\\s+EXISTS\\s+)?(pg_ops\\.)?stat_skewed_tenant_region\\b', flags: 'i', message: 'Create `stat_skewed_tenant_region`.' },
              { pattern: '\\bdependencies\\b', flags: 'i', message: 'Include `dependencies` in the extended statistics kinds.' },
              { pattern: '\\bndistinct\\b', flags: 'i', message: 'Include `ndistinct` in the extended statistics kinds.' },
              { pattern: '\\bANALYZE\\s+(pg_ops\\.)?skewed_audit_log\\b', flags: 'i', message: 'Run `ANALYZE skewed_audit_log;` to populate `pg_stats_ext`.' }
            ]
          },
          solutionExplanation: 'After `ANALYZE`, `pg_stats_ext` records a `1.000000` functional dependency between `tenant_id => region` and `n_distinct = 4` (not `4 × 4 = 16`), eliminating the 4× selectivity underestimate on `WHERE tenant_id = \'acme\' AND region = \'us-east-1\'` and `GROUP BY tenant_id, region`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Tie-Safe O(log N) Row-Value Keyset Pagination',
          mission: 'An additional audit row (`event_id = 1011`) shares the exact timestamp `\'2025-03-15 14:15:05+00\'` with `event_id = 1007`. Replace the `OFFSET` query on `api_audit_events` with row-value keyset pagination seeking the `3` rows strictly older than cursor `(TIMESTAMPTZ \'2025-03-15 14:15:05+00\', 1011)` using `(created_at, event_id) < (...)`, projecting `event_id`, `tenant_id`, `endpoint`, and `created_at` ordered by `created_at DESC, event_id DESC LIMIT 3`.',
          setupSql: [
            'INSERT INTO pg_ops.api_audit_events VALUES',
            '  (1011, \'umbraco\', \'prod\', \'/v2/keys/verify\', \'POST\', 200, 64, \'{"user":{"id":"u_91","role":"security","mfa":true}}\'::jsonb, ARRAY[\'audit:read\'], \'2025-03-15 14:15:05+00\');',
            'CREATE INDEX idx_audit_seek_cursor ON pg_ops.api_audit_events (created_at DESC, event_id DESC);',
            'SET LOCAL enable_seqscan = off;',
            'SET LOCAL enable_bitmapscan = off;'
          ].join('\n'),
          probeSql: '',
          starterCode: [
            '-- Replace O(N) OFFSET 4 with O(log N) row-value keyset seek strictly before (2025-03-15 14:15:05+00, 1011)',
            'SELECT event_id, tenant_id, endpoint, created_at',
            'FROM api_audit_events',
            'ORDER BY created_at DESC, event_id DESC',
            'OFFSET 4 LIMIT 3;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id, tenant_id, endpoint, created_at',
            'FROM api_audit_events',
            'WHERE (created_at, event_id) < (TIMESTAMPTZ \'2025-03-15 14:15:05+00\', 1011)',
            'ORDER BY created_at DESC, event_id DESC',
            'LIMIT 3;'
          ].join('\n'),
          hints: [
            'Remove `OFFSET 4` completely (`OFFSET` scans and discards leading rows on every page request).',
            'Add `WHERE (created_at, event_id) < (TIMESTAMPTZ \'2025-03-15 14:15:05+00\', 1011)` so tie-timestamp event `1007` at `14:15:05+00` is cleanly returned first on the next page.',
            'Keep `ORDER BY created_at DESC, event_id DESC` and `LIMIT 3` so PostgreSQL walks `idx_audit_seek_cursor` via a single `Index Scan`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPlanNode: 'using idx_audit_seek_cursor',
            requiredPatterns: [
              { pattern: '\\(\\s*created_at\\s*,\\s*event_id\\s*\\)\\s*<\\s*\\(', flags: 'i', message: 'Use PostgreSQL row-value comparison `(created_at, event_id) < (...)`.' },
              { pattern: '\\bLIMIT\\s+3\\b', flags: 'i', message: 'Keep `LIMIT 3`.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\bOFFSET\\b', flags: 'i', message: 'Eliminate `OFFSET` completely in favor of cursor seek pagination.' }
            ]
          },
          solutionExplanation: 'PostgreSQL compiles `(created_at, event_id) < (TIMESTAMPTZ \'2025-03-15 14:15:05+00\', 1011)` into a single `Index Cond` seek on `idx_audit_seek_cursor`, landing directly on `(14:15:05+00, 1007)` in `O(log N)` without dropping tie-timestamp events.'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
