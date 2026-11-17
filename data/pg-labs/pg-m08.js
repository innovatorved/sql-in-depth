/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 08 (`pg-m08`): Transactions, Locks, MVCC & Storage Internals
 * 8 Hands-On Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m08'] = [
    /* ========================================================================
       LAB 01: pg-m08-t01 — ACID Transactions, SAVEPOINT & pg_current_xact_id()
       ======================================================================== */
    {
      id: 'pg-m08-t01',
      slug: 'transactions-savepoints-atomicity',
      moduleId: 'pg-m08',
      title: 'ACID Transactions, SAVEPOINT Partial Rollbacks & pg_current_xact_id()',
      difficulty: 'Intermediate',
      estimatedMinutes: 14,
      datasetId: 'fintech_ledger',
      clauses: ['BEGIN', 'SAVEPOINT', 'ROLLBACK TO SAVEPOINT', 'COMMIT', 'pg_current_xact_id'],
      tags: ['transactions', 'savepoint', 'acid', 'xid'],
      guide: {
        mentalModel: 'Every PostgreSQL 18 statement executes inside a transaction, whether wrapped explicitly in `BEGIN ... COMMIT` or implicitly autocommitted. When a backend enters `BEGIN`, PostgreSQL assigns only a **virtual transaction ID (`vxid`, `backendId/localXid`)** in backend-local memory so read-only workloads never touch shared XID counters or dirty `pg_xact` commit-log pages. A permanent 64-bit `xid8` (`FullTransactionId`) is allocated lazily at the exact moment the transaction first mutates a heap/WAL page or explicitly invokes `pg_current_xact_id()`. Calling `pg_current_xact_id_if_assigned()` lets you inspect whether your transaction is still virtual (`NULL`) without burning a real XID.\n\nUnlike some engines that silently continue after a statement failure, any runtime error inside a PostgreSQL transaction moves the block into an **aborted state** (`current transaction is aborted, commands ignored until end of transaction block`). `SAVEPOINT name` creates a lightweight subtransaction (`subxid`) marker inside the parent transaction so you can recover from speculative writes or constraint checks via `ROLLBACK TO SAVEPOINT name` while preserving all earlier work before final `COMMIT`.',
        syntaxAnatomy: [
          'BEGIN;',
          '  SELECT pg_current_xact_id_if_assigned();        -- NULL until first write!',
          '  UPDATE accounts SET posted_balance_cents = posted_balance_cents - 10000 WHERE account_id = 101;',
          '  SAVEPOINT sp_optional_fee;',
          '    UPDATE accounts SET posted_balance_cents = posted_balance_cents - 999999 WHERE account_id = 103;',
          '  ROLLBACK TO SAVEPOINT sp_optional_fee;          -- Discards subxid changes only',
          'COMMIT;'
        ].join('\n'),
        internalsAndGotchas: [
          'Calling `pg_current_xact_id()` inside a read-only transaction **forces allocation** of a real XID; always use `pg_current_xact_id_if_assigned()` in observability probes so read-only queries stay virtual.',
          '`ROLLBACK TO SAVEPOINT sp` undoes heap changes made after `sp` and keeps `sp` active for reuse, whereas a bare `ROLLBACK` aborts the entire top-level transaction.',
          'Creating more than `64` nested or sequential subtransactions (`PGPROC_MAX_CACHED_SUBXIDS = 64`) in one open transaction spills `pg_subtrans` SLRU lookups and can cause severe multixact/subtrans contention under high concurrency.',
          'Sequence increments (`nextval()`) are intentionally non-transactional—rolling back to a savepoint will never rewind sequence numbers.'
        ],
        whenToUse: 'Wrap multi-table ledger mutations in explicit `BEGIN ... COMMIT` blocks, inspect `pg_current_xact_id_if_assigned()` when verifying read-only transaction hygiene, and use bounded `SAVEPOINT` blocks to isolate optional side-effects without aborting an entire settlement batch.'
      },
      scenario: {
        role: 'Core Ledger Payments Engineer',
        incidentOrGoal: 'Settlement batches need verified virtual-vs-real XID hygiene for read-only reconciliation checks, atomic double-entry balance updates, and partial rollback isolation when an optional overdraft fee breaches minimum balance policy.',
        stakeholderNeed: 'Prove read-only transactions allocate zero real XIDs, execute an atomic two-account transfer that triggers lazy XID allocation, and recover mid-transaction using `SAVEPOINT` and `ROLLBACK TO SAVEPOINT`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Read-Only Virtual XID Hygiene with pg_current_xact_id_if_assigned()',
          mission: 'Open an explicit `BEGIN; ... COMMIT;` transaction block on `accounts` that performs **no writes** and never calls `pg_current_xact_id()`. Inside the transaction (before `COMMIT;`), `SELECT` 3 columns in exact order: `virtual_xid_only` (`pg_current_xact_id_if_assigned() IS NULL`), `account_count` (`COUNT(*)`), and `total_ledger_cents` (`SUM(posted_balance_cents)`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Verify that a read-only transaction block stays on a virtual XID (NULL real XID)',
            'BEGIN;',
            'SELECT -- TODO: (pg_current_xact_id_if_assigned() IS NULL) AS virtual_xid_only',
            '       COUNT(*) AS account_count',
            '       -- TODO: SUM(posted_balance_cents) AS total_ledger_cents',
            'FROM accounts;',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'SELECT (pg_current_xact_id_if_assigned() IS NULL) AS virtual_xid_only,',
            '       COUNT(*) AS account_count,',
            '       SUM(posted_balance_cents) AS total_ledger_cents',
            'FROM accounts;',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Keep the `SELECT` between `BEGIN;` and `COMMIT;` without calling `pg_current_xact_id()` (which would force XID assignment).',
            'Test `(pg_current_xact_id_if_assigned() IS NULL) AS virtual_xid_only` as the first projected column.',
            'Include `COUNT(*) AS account_count` and `SUM(posted_balance_cents) AS total_ledger_cents` from `accounts`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bBEGIN\\b', flags: 'i', message: 'Start an explicit transaction with `BEGIN;`.' },
              { pattern: '\\bpg_current_xact_id_if_assigned\\s*\\(', flags: 'i', message: 'Use `pg_current_xact_id_if_assigned()` to inspect XID allocation lazily.' },
              { pattern: '\\bCOMMIT\\b', flags: 'i', message: 'Close the transaction cleanly with `COMMIT;`.' }
            ],
            forbiddenPatterns: [
              { pattern: '\\bpg_current_xact_id\\s*\\(', flags: 'i', message: 'Do not call `pg_current_xact_id()` here—it forces real XID allocation!' }
            ]
          },
          solutionExplanation: 'Because no WAL-logged tuple mutation occurred, PostgreSQL kept the backend on a zero-cost virtual transaction ID (`vxid`), so `pg_current_xact_id_if_assigned()` returned `NULL` (`virtual_xid_only = true`) across the entire `1750000`-cent ledger audit.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Atomic Double-Entry Transfer & Lazy XID Allocation',
          mission: 'Inside an explicit `BEGIN; ... COMMIT;` block, transfer `40000` cents from `account_id = 101` (`posted_balance_cents - 40000`, `version + 1`) to `account_id = 102` (`posted_balance_cents + 40000`, `version + 1`). Before `COMMIT;`, `SELECT` 4 columns from `accounts` for `account_id IN (101, 102)` ordered by `account_id ASC`: `account_id`, `posted_balance_cents`, `version`, and `real_xid_assigned` (`pg_current_xact_id_if_assigned() IS NOT NULL`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- TODO: Debit 40000 cents from account_id = 101 and increment version by 1',
            '-- TODO: Credit 40000 cents to account_id = 102 and increment version by 1',
            'SELECT account_id,',
            '       posted_balance_cents,',
            '       version',
            '       -- TODO: (pg_current_xact_id_if_assigned() IS NOT NULL) AS real_xid_assigned',
            'FROM accounts',
            'WHERE account_id IN (101, 102)',
            'ORDER BY account_id ASC;',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'UPDATE accounts',
            'SET posted_balance_cents = posted_balance_cents - 40000,',
            '    version = version + 1',
            'WHERE account_id = 101;',
            'UPDATE accounts',
            'SET posted_balance_cents = posted_balance_cents + 40000,',
            '    version = version + 1',
            'WHERE account_id = 102;',
            'SELECT account_id,',
            '       posted_balance_cents,',
            '       version,',
            '       (pg_current_xact_id_if_assigned() IS NOT NULL) AS real_xid_assigned',
            'FROM accounts',
            'WHERE account_id IN (101, 102)',
            'ORDER BY account_id ASC;',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Run two `UPDATE accounts` statements (or a single `CASE` update) inside `BEGIN;` so `101` drops from `415000` to `375000` (`version = 4`) and `102` rises from `260000` to `300000` (`version = 3`).',
            'Run the `SELECT` **before** `COMMIT;` while the mutating transaction is still open so `pg_current_xact_id_if_assigned()` sees the newly allocated `xid8`.',
            'Project `(pg_current_xact_id_if_assigned() IS NOT NULL) AS real_xid_assigned` as the 4th column and end with `COMMIT;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bBEGIN\\b', flags: 'i', message: 'Wrap the transfer in an explicit `BEGIN; ... COMMIT;` block.' },
              { pattern: '\\bpg_current_xact_id_if_assigned\\s*\\(', flags: 'i', message: 'Check `pg_current_xact_id_if_assigned() IS NOT NULL` before `COMMIT;`.' },
              { pattern: '\\bCOMMIT\\b', flags: 'i', message: 'Commit the atomic transfer with `COMMIT;`.' }
            ]
          },
          solutionExplanation: 'The first `UPDATE` forced PostgreSQL to allocate a real 64-bit `FullTransactionId` to stamp `xmin`/`xmax` on the modified heap tuples, flipping `pg_current_xact_id_if_assigned() IS NOT NULL` to `true` while committing both balance mutations atomically.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Partial Subtransaction Recovery with SAVEPOINT & ROLLBACK TO SAVEPOINT',
          mission: 'Execute a multi-step settlement in `BEGIN; ... COMMIT;`: (1) debit `50000` cents from `account_id = 101` and credit `50000` cents to `account_id = 102` (incrementing `version` by `1` on both); (2) establish `SAVEPOINT sp_overdraft_attempt`; (3) speculatively debit `200000` cents from `account_id = 103` (`version + 1`); (4) discard that overdraft via `ROLLBACK TO SAVEPOINT sp_overdraft_attempt`; (5) `COMMIT;` and then `SELECT` `account_id`, `owner_name`, `posted_balance_cents`, `version` from `accounts` for `account_id IN (101, 102, 103)` ordered by `account_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- 1. Transfer 50000 cents from 101 to 102 (incrementing version on both)',
            '-- 2. SAVEPOINT sp_overdraft_attempt;',
            '-- 3. Debit 200000 cents from 103 (incrementing version)',
            '-- 4. ROLLBACK TO SAVEPOINT sp_overdraft_attempt;',
            'COMMIT;',
            'SELECT account_id, owner_name, posted_balance_cents, version',
            'FROM accounts',
            'WHERE account_id IN (101, 102, 103)',
            'ORDER BY account_id ASC;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'UPDATE accounts SET posted_balance_cents = posted_balance_cents - 50000, version = version + 1 WHERE account_id = 101;',
            'UPDATE accounts SET posted_balance_cents = posted_balance_cents + 50000, version = version + 1 WHERE account_id = 102;',
            'SAVEPOINT sp_overdraft_attempt;',
            'UPDATE accounts SET posted_balance_cents = posted_balance_cents - 200000, version = version + 1 WHERE account_id = 103;',
            'ROLLBACK TO SAVEPOINT sp_overdraft_attempt;',
            'COMMIT;',
            'SELECT account_id, owner_name, posted_balance_cents, version',
            'FROM accounts',
            'WHERE account_id IN (101, 102, 103)',
            'ORDER BY account_id ASC;'
          ].join('\n'),
          hints: [
            'Update `account_id = 101` (`- 50000`, `version + 1`) and `account_id = 102` (`+ 50000`, `version + 1`) before creating `SAVEPOINT sp_overdraft_attempt;`.',
            'Perform the speculative `UPDATE` on `account_id = 103` after the savepoint, then immediately run `ROLLBACK TO SAVEPOINT sp_overdraft_attempt;`.',
            'Issue `COMMIT;` and run the final `SELECT` so `101` (`365000`, `v4`), `102` (`310000`, `v3`), and untouched `103` (`150000`, `v2`) are returned.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bSAVEPOINT\\s+sp_overdraft_attempt\\b', flags: 'i', message: 'Create `SAVEPOINT sp_overdraft_attempt;` before the speculative debit.' },
              { pattern: '\\bROLLBACK\\s+TO\\s+(?:SAVEPOINT\\s+)?sp_overdraft_attempt\\b', flags: 'i', message: 'Use `ROLLBACK TO SAVEPOINT sp_overdraft_attempt;` to undo only the subtransaction.' },
              { pattern: '\\bCOMMIT\\b', flags: 'i', message: 'Commit the surviving parent transaction with `COMMIT;`.' }
            ]
          },
          solutionExplanation: '`ROLLBACK TO SAVEPOINT sp_overdraft_attempt` aborted only the child subtransaction (`subxid`) that mutated `account_id = 103`, leaving `103` untouched at `150000` (`version = 2`) while committing the parent `50000`-cent settlement between `101` and `102`.'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m08-t02 — Isolation Levels & Snapshot Anomalies
       ======================================================================== */
    {
      id: 'pg-m08-t02',
      slug: 'isolation-levels-snapshot-anomalies',
      moduleId: 'pg-m08',
      title: 'Isolation Levels: READ COMMITTED vs REPEATABLE READ vs SERIALIZABLE',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'fintech_ledger',
      clauses: ['SET TRANSACTION ISOLATION LEVEL', 'REPEATABLE READ', 'SERIALIZABLE'],
      tags: ['isolation-levels', 'mvcc', 'write-skew', 'serializable', 'ssi'],
      guide: {
        mentalModel: 'PostgreSQL implements MVCC snapshots without readers blocking writers or writers blocking readers, governed by three distinct snapshot regimes (PostgreSQL maps SQL `READ UNCOMMITTED` directly to `READ COMMITTED`—dirty reads are impossible):\n\n1. **`READ COMMITTED` (default)**: Takes a **fresh MVCC snapshot at the start of every statement**. Two `SELECT` queries inside the same transaction can observe different committed rows (non-repeatable reads and phantom reads), and concurrent `UPDATE`s re-evaluate `WHERE` against the latest committed tuple chain (`EvalPlanQual`).\n2. **`REPEATABLE READ` (Snapshot Isolation)**: Freezes a **single MVCC snapshot at the first non-transaction-control statement**. Every query sees the database frozen as of that instant, and if a concurrent transaction already committed an update to a row you try to modify, PostgreSQL immediately aborts with `SQLSTATE 40001: could not serialize access due to concurrent update`—eliminating lost updates automatically.\n3. **`SERIALIZABLE` (Serializable Snapshot Isolation / SSI)**: Adds lightweight `SIReadLock` predicate locks in shared memory on top of `REPEATABLE READ` to detect **rw-antidependency cycles** (such as two concurrent withdrawals passing a joint minimum-balance check—classic **write skew**) and aborts one transaction with `40001` so application retry loops preserve true serializability.',
        syntaxAnatomy: [
          'BEGIN;',
          'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;  -- Must precede first query/DML!',
          'SELECT current_setting(\'transaction_isolation\') AS iso_mode,',
          '       SUM(posted_balance_cents) AS frozen_ledger_cents',
          'FROM accounts;',
          'COMMIT;'
        ].join('\n'),
        internalsAndGotchas: [
          '`SET TRANSACTION ISOLATION LEVEL ...` (or `BEGIN ISOLATION LEVEL ...`) **must execute before the first query or DML statement** in the transaction; running it after a `SELECT` fails with `SET TRANSACTION ISOLATION LEVEL must be called before any query`.',
          'PostgreSQL `REPEATABLE READ` already prevents **phantom reads** (unlike the minimum ANSI SQL standard), **dirty reads**, and **lost updates**, but it does **not** prevent cross-row **write skew**—only `SERIALIZABLE` catches write skew.',
          'Any codebase using `REPEATABLE READ` or `SERIALIZABLE` **must implement automatic transaction retry on `SQLSTATE 40001`** (`serialization_failure`).',
          '`transaction_timestamp()` (`NOW()`) freezes at `BEGIN`, whereas `statement_timestamp()` and `clock_timestamp()` advance across statements.'
        ],
        whenToUse: 'Keep `READ COMMITTED` with explicit row guards for single-row OLTP updates, switch multi-query financial reconciliation reports to `REPEATABLE READ` (`READ ONLY`), and use `SERIALIZABLE` whenever a business invariant spans multiple rows without a single parent lock.'
      },
      scenario: {
        role: 'Staff Financial Integrity Architect',
        incidentOrGoal: 'End-of-day reconciliation drifted when concurrent transfers landed mid-report under `READ COMMITTED`, and treasury withdrawals lacked versioned CAS and `SERIALIZABLE` cross-account liquidity guards.',
        stakeholderNeed: 'Configure frozen `REPEATABLE READ` reconciliation snapshots, write an optimistic version-checked update under `REPEATABLE READ`, and enforce a cross-account checking reserve invariant under `SERIALIZABLE`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Frozen Multi-Table Audit Snapshot with REPEATABLE READ',
          mission: 'Open a transaction and set its isolation level to `REPEATABLE READ` (`READ ONLY`) using `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;` (or `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;`). Before `COMMIT;`, `SELECT` 4 columns in exact order: `isolation_level` (`current_setting(\'transaction_isolation\')`), `read_only_mode` (`current_setting(\'transaction_read_only\')`), `total_accounts` (`COUNT(*)` from `accounts`), and `snapshot_balance_cents` (`SUM(posted_balance_cents)` from `accounts`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- TODO: Set isolation level to REPEATABLE READ READ ONLY before running any query',
            'SELECT current_setting(\'transaction_isolation\') AS isolation_level,',
            '       current_setting(\'transaction_read_only\') AS read_only_mode,',
            '       COUNT(*) AS total_accounts',
            '       -- TODO: SUM(posted_balance_cents) AS snapshot_balance_cents',
            'FROM accounts;',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;',
            'SELECT current_setting(\'transaction_isolation\') AS isolation_level,',
            '       current_setting(\'transaction_read_only\') AS read_only_mode,',
            '       COUNT(*) AS total_accounts,',
            '       SUM(posted_balance_cents) AS snapshot_balance_cents',
            'FROM accounts;',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Place `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;` immediately after `BEGIN;` (or use `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;`).',
            'Read `current_setting(\'transaction_isolation\')` (`\'repeatable read\'`) and `current_setting(\'transaction_read_only\')` (`\'on\'`).',
            'Aggregate `COUNT(*) AS total_accounts` and `SUM(posted_balance_cents) AS snapshot_balance_cents` from `accounts`, then `COMMIT;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bREPEATABLE\\s+READ\\b', flags: 'i', message: 'Configure `REPEATABLE READ` isolation for the frozen audit snapshot.' },
              { pattern: '\\bREAD\\s+ONLY\\b', flags: 'i', message: 'Mark the reporting transaction `READ ONLY`.' },
              { pattern: 'transaction_isolation', flags: 'i', message: 'Inspect `current_setting(\'transaction_isolation\')`.' }
            ]
          },
          solutionExplanation: 'Setting `REPEATABLE READ READ ONLY` before the first query pins one immutable MVCC `SnapshotData` (`xmin`/`xmax`/`xip`) for the entire transaction while prohibiting accidental writes (`transaction_read_only = \'on\'`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Optimistic Compare-And-Swap (CAS) Debit Under REPEATABLE READ',
          mission: 'Inside a `BEGIN; SET TRANSACTION ISOLATION LEVEL REPEATABLE READ; ... COMMIT;` block, perform a guarded optimistic debit of `75000` cents on `account_id = 101` (`posted_balance_cents = posted_balance_cents - 75000, version = version + 1`) that only matches when `version = 3` and `posted_balance_cents >= 75000`. Use `RETURNING` to return 4 columns in exact order: `account_id`, `posted_balance_cents`, `version`, and `isolation_level` (`current_setting(\'transaction_isolation\')`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- TODO: Set transaction isolation level to REPEATABLE READ',
            'UPDATE accounts',
            'SET posted_balance_cents = posted_balance_cents - 75000,',
            '    version = version + 1',
            'WHERE account_id = 101',
            '  -- TODO: guard on version = 3 AND posted_balance_cents >= 75000',
            'RETURNING account_id, posted_balance_cents, version;',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;',
            'UPDATE accounts',
            'SET posted_balance_cents = posted_balance_cents - 75000,',
            '    version = version + 1',
            'WHERE account_id = 101',
            '  AND version = 3',
            '  AND posted_balance_cents >= 75000',
            'RETURNING account_id,',
            '          posted_balance_cents,',
            '          version,',
            '          current_setting(\'transaction_isolation\') AS isolation_level;',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Execute `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;` right after `BEGIN;`.',
            'Include both `AND version = 3` and `AND posted_balance_cents >= 75000` in the `WHERE` clause.',
            'Return `account_id, posted_balance_cents, version, current_setting(\'transaction_isolation\') AS isolation_level` in `RETURNING`, then `COMMIT;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bREPEATABLE\\s+READ\\b', flags: 'i', message: 'Run the CAS update inside `REPEATABLE READ` isolation.' },
              { pattern: '\\bversion\\s*=\\s*3\\b', flags: 'i', message: 'Enforce optimistic concurrency with `version = 3` in `WHERE`.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Use `RETURNING` to emit the post-debit state and isolation level.' }
            ]
          },
          solutionExplanation: 'Combining `REPEATABLE READ` (which aborts in-flight concurrent writers with `40001`) and an explicit `version = 3 AND posted_balance_cents >= 75000` CAS predicate protects against stale reads even when `version` was fetched in an earlier HTTP round-trip.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Defeating Cross-Row Write Skew with SERIALIZABLE Isolation',
          mission: 'Treasury policy requires the combined `posted_balance_cents` across all `account_type = \'checking\'` accounts (`101`, `102`, `103` — initial sum `825000`) to remain `>= 750000` after any withdrawal. Inside a `BEGIN; SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; ... COMMIT;` block, withdraw `50000` cents from `account_id = 101` (`version + 1`) guarded by a subquery verifying `(SELECT SUM(posted_balance_cents) FROM accounts WHERE account_type = \'checking\') - 50000 >= 750000`, then before `COMMIT;` `SELECT` 3 columns from `accounts WHERE account_type = \'checking\'`: `isolation_level` (`current_setting(\'transaction_isolation\')`), `checking_accounts` (`COUNT(*)`), and `remaining_pool_cents` (`SUM(posted_balance_cents)`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- TODO: Switch transaction to SERIALIZABLE isolation',
            '-- TODO: Debit 50000 from account_id = 101 (version + 1) only if aggregate checking sum - 50000 >= 750000',
            'SELECT current_setting(\'transaction_isolation\') AS isolation_level,',
            '       COUNT(*) AS checking_accounts',
            '       -- TODO: SUM(posted_balance_cents) AS remaining_pool_cents',
            'FROM accounts',
            'WHERE account_type = \'checking\';',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;',
            'UPDATE accounts',
            'SET posted_balance_cents = posted_balance_cents - 50000,',
            '    version = version + 1',
            'WHERE account_id = 101',
            '  AND (SELECT SUM(posted_balance_cents) FROM accounts WHERE account_type = \'checking\') - 50000 >= 750000;',
            'SELECT current_setting(\'transaction_isolation\') AS isolation_level,',
            '       COUNT(*) AS checking_accounts,',
            '       SUM(posted_balance_cents) AS remaining_pool_cents',
            'FROM accounts',
            'WHERE account_type = \'checking\';',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Start with `BEGIN; SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;` so PostgreSQL tracks `SIReadLock` predicate reads across all `checking` rows.',
            'Guard the `UPDATE` on `account_id = 101` with `AND (SELECT SUM(posted_balance_cents) FROM accounts WHERE account_type = \'checking\') - 50000 >= 750000`.',
            'Project `current_setting(\'transaction_isolation\') AS isolation_level, COUNT(*) AS checking_accounts, SUM(posted_balance_cents) AS remaining_pool_cents` from `accounts WHERE account_type = \'checking\'` before `COMMIT;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bSERIALIZABLE\\b', flags: 'i', message: 'Use `SERIALIZABLE` isolation so SSI tracks cross-row `SIReadLock` dependencies.' },
              { pattern: '750000', flags: 'i', message: 'Enforce the `750000`-cent aggregate reserve floor.' }
            ]
          },
          solutionExplanation: 'Under `REPEATABLE READ`, two concurrent `50000`-cent withdrawals on `101` and `102` would each see `825000 - 50000 = 775000 >= 750000` and touch disjoint rows, dropping the pool to `725000` (classic write skew). Under `SERIALIZABLE`, SSI records `SIReadLock`s on the `account_type = \'checking\'` scan and aborts the second committer with `40001`.'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m08-t03 — Row-Level Locks & Queue Workers with SKIP LOCKED
       ======================================================================== */
    {
      id: 'pg-m08-t03',
      slug: 'row-locking-for-update-skip-locked',
      moduleId: 'pg-m08',
      title: 'Row-Level Locks (FOR NO KEY UPDATE) & Queue Workers with SKIP LOCKED',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['FOR UPDATE', 'FOR NO KEY UPDATE', 'SKIP LOCKED', 'NOWAIT'],
      tags: ['row-locks', 'skip-locked', 'for-update', 'job-queue', 'concurrency'],
      guide: {
        mentalModel: 'Unlike engines that allocate a shared-memory lock struct per locked row and suffer lock-escalation cliffs, PostgreSQL stores row-level locks **directly on the 8 KB heap tuple header** via `t_xmax` and `t_infomask` lock bits (`MultiXactId` when shared), placing only a lightweight `RowShareLock` on the parent relation in `pg_locks`. PostgreSQL provides four granular row-lock strengths:\n\n- **`FOR KEY SHARE`**: Weakest lock; blocks `DELETE` or PK updates, acquired automatically on parent rows by child FK `INSERT`s.\n- **`FOR NO KEY UPDATE`**: Blocks concurrent `UPDATE`/`DELETE` on the row, **without blocking `FOR KEY SHARE` child FK inserts**—always prefer this over `FOR UPDATE` when locking a parent row whose primary key will not change!\n- **`FOR UPDATE`**: Blocks even `FOR KEY SHARE`, stalling concurrent `INSERT`s into child tables referencing that parent row.\n\nAppending `NOWAIT` fails immediately with `55P03` (`lock_not_available`) instead of queueing, while `SKIP LOCKED` instructs the index/heap scan to silently skip any tuple currently locked by an uncommitted transaction—turning `job_queue` + a partial index `WHERE status = \'pending\'` into a multi-thousand-TPS transactional work queue.',
        syntaxAnatomy: [
          '-- Non-blocking transactional worker claim pattern:',
          'UPDATE job_queue',
          'SET status = \'running\', attempts = attempts + 1, locked_by = \'worker-01\'',
          'WHERE job_id = (',
          '  SELECT job_id FROM job_queue',
          '  WHERE queue_name = \'webhooks\' AND status = \'pending\'',
          '  ORDER BY priority ASC, scheduled_at ASC, job_id ASC',
          '  FOR UPDATE SKIP LOCKED',
          '  LIMIT 1',
          ')',
          'RETURNING job_id, queue_name, status, priority, attempts, locked_by;'
        ].join('\n'),
        internalsAndGotchas: [
          'Using `SELECT ... FOR UPDATE` on a `customers` or `ledger_accounts` parent row blocks every concurrent child `INSERT` whose foreign key checks that parent via `FOR KEY SHARE`; use `FOR NO KEY UPDATE` whenever key columns stay unchanged.',
          'Row-level locks do **not** appear as `locktype = \'tuple\'` in `pg_locks` unless a second backend is actively waiting or holding a transient heavyweight tuple lock; an uncontended `SELECT ... FOR NO KEY UPDATE` records `RowShareLock` on the relation in `pg_locks` and stamps `xmax` on disk.',
          'Always pair `FOR UPDATE SKIP LOCKED` with a partial B-Tree index (`WHERE status = \'pending\'`) so workers jump straight to pending entries instead of scanning historical `done` tuples.',
          'Include a deterministic tie-breaker (`job_id ASC`) in the subquery `ORDER BY` so equal-timestamp jobs dequeue predictably.'
        ],
        whenToUse: 'Use `FOR NO KEY UPDATE NOWAIT` for fail-fast pessimistic locking on parent entities with FK children, and use `UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED LIMIT N)` for horizontal background worker fleets.'
      },
      scenario: {
        role: 'Distributed Systems & Queue Reliability Engineer',
        incidentOrGoal: 'Webhook workers in `pg_ops_telemetry` suffered head-of-line lock stalls because `SELECT ... FOR UPDATE` lacked `SKIP LOCKED`, while account updates used overly aggressive `FOR UPDATE` locks that blocked child ledger inserts.',
        stakeholderNeed: 'Acquire a fail-fast `FOR NO KEY UPDATE NOWAIT` lock and verify its `pg_locks` footprint, build a single-job `SKIP LOCKED` atomic claim query, and scale to deterministic batch claiming.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Fail-Fast Parent Row Lock with FOR NO KEY UPDATE NOWAIT & pg_locks',
          mission: 'Inside an explicit `BEGIN; ... COMMIT;` block, acquire a fail-fast `FOR NO KEY UPDATE NOWAIT` lock on `ledger_accounts` for `account_id = 501` (`SELECT account_id FROM ledger_accounts WHERE account_id = 501 FOR NO KEY UPDATE NOWAIT;`), then before `COMMIT;` inspect `pg_locks l JOIN pg_class c ON c.oid = l.relation` where `l.pid = pg_backend_pid()`, `c.relname = \'ledger_accounts\'`, and `l.locktype = \'relation\'`. Project 4 columns ordered by `l.mode ASC`: `relname` (`c.relname`), `locktype` (`l.locktype`), `mode` (`l.mode`), and `granted` (`l.granted`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- TODO: Lock account_id = 501 in ledger_accounts using FOR NO KEY UPDATE NOWAIT',
            'SELECT c.relname,',
            '       l.locktype,',
            '       l.mode,',
            '       l.granted',
            'FROM pg_locks l',
            'JOIN pg_class c ON c.oid = l.relation',
            'WHERE l.pid = pg_backend_pid()',
            '  AND c.relname = \'ledger_accounts\'',
            '  AND l.locktype = \'relation\'',
            'ORDER BY l.mode ASC;',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'SELECT account_id',
            'FROM ledger_accounts',
            'WHERE account_id = 501',
            'FOR NO KEY UPDATE NOWAIT;',
            'SELECT c.relname,',
            '       l.locktype,',
            '       l.mode,',
            '       l.granted',
            'FROM pg_locks l',
            'JOIN pg_class c ON c.oid = l.relation',
            'WHERE l.pid = pg_backend_pid()',
            '  AND c.relname = \'ledger_accounts\'',
            '  AND l.locktype = \'relation\'',
            'ORDER BY l.mode ASC;',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Run `SELECT account_id FROM ledger_accounts WHERE account_id = 501 FOR NO KEY UPDATE NOWAIT;` right after `BEGIN;`.',
            'Keep the `pg_locks` inspection query **before** `COMMIT;` so the transaction-held `RowShareLock` is still active in your backend.',
            'Filter `l.pid = pg_backend_pid()`, `c.relname = \'ledger_accounts\'`, and `l.locktype = \'relation\'` with `ORDER BY l.mode ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bFOR\\s+NO\\s+KEY\\s+UPDATE\\b', flags: 'i', message: 'Use `FOR NO KEY UPDATE` so child FK `FOR KEY SHARE` locks are not blocked.' },
              { pattern: '\\bNOWAIT\\b', flags: 'i', message: 'Include `NOWAIT` for fail-fast lock acquisition.' },
              { pattern: '\\bpg_locks\\b', flags: 'i', message: 'Query `pg_locks` to verify the granted `RowShareLock` on `ledger_accounts`.' }
            ]
          },
          solutionExplanation: '`SELECT ... FOR NO KEY UPDATE NOWAIT` stamped the tuple header on `account_id = 501` without risking lock-queue pileups (`NOWAIT`) or blocking child FK inserts, while registering a `granted = true` `RowShareLock` on `ledger_accounts` in `pg_locks`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Atomic Single-Worker Dequeue with FOR UPDATE SKIP LOCKED',
          mission: 'Write a single atomic `UPDATE job_queue` statement that claims the highest-priority pending job in `queue_name = \'webhooks\'` (`status = \'pending\'`, ordered by `priority ASC, scheduled_at ASC, job_id ASC` using `FOR UPDATE SKIP LOCKED LIMIT 1`). Set `status = \'running\'`, increment `attempts = attempts + 1`, set `locked_by = \'worker-09\'`, and use `RETURNING` to output 6 columns in exact order: `job_id`, `queue_name`, `status`, `priority`, `attempts`, and `locked_by`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'UPDATE job_queue',
            'SET status = \'running\',',
            '    attempts = attempts + 1,',
            '    locked_by = \'worker-09\'',
            'WHERE job_id = (',
            '  SELECT job_id',
            '  FROM job_queue',
            '  WHERE queue_name = \'webhooks\'',
            '    AND status = \'pending\'',
            '  -- TODO: ORDER BY priority ASC, scheduled_at ASC, job_id ASC',
            '  -- TODO: FOR UPDATE SKIP LOCKED LIMIT 1',
            ')',
            'RETURNING job_id, queue_name, status, priority, attempts, locked_by;'
          ].join('\n'),
          solutionCode: [
            'UPDATE job_queue',
            'SET status = \'running\',',
            '    attempts = attempts + 1,',
            '    locked_by = \'worker-09\'',
            'WHERE job_id = (',
            '  SELECT job_id',
            '  FROM job_queue',
            '  WHERE queue_name = \'webhooks\'',
            '    AND status = \'pending\'',
            '  ORDER BY priority ASC, scheduled_at ASC, job_id ASC',
            '  FOR UPDATE SKIP LOCKED',
            '  LIMIT 1',
            ')',
            'RETURNING job_id, queue_name, status, priority, attempts, locked_by;'
          ].join('\n'),
          hints: [
            'Inside the `WHERE job_id = (...)` subquery, filter `queue_name = \'webhooks\' AND status = \'pending\'`.',
            'Order candidates by `priority ASC, scheduled_at ASC, job_id ASC` so `job_id = 5` (`priority = 1`, `14:21:00+00`, previously `2` attempts) wins.',
            'Add `FOR UPDATE SKIP LOCKED LIMIT 1` at the end of the subquery and keep the 6-column `RETURNING` clause.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bFOR\\s+UPDATE\\s+SKIP\\s+LOCKED\\b', flags: 'i', message: 'Use `FOR UPDATE SKIP LOCKED` inside the candidate selection subquery.' },
              { pattern: '\\bRETURNING\\b', flags: 'i', message: 'Use `RETURNING` to return the claimed job metadata in one round-trip.' }
            ]
          },
          solutionExplanation: 'Walking `idx_job_queue_pending` (`WHERE status = \'pending\'`) with `FOR UPDATE SKIP LOCKED LIMIT 1` claims `job_id = 5` (`attempts` bumped from `2` to `3`) in a single network round-trip, allowing dozens of concurrent workers to bypass in-flight rows with zero lock wait.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Batch Claiming Multiple Pending Jobs via Writable CTE + SKIP LOCKED',
          mission: 'Scale worker throughput by claiming up to `2` pending jobs from `queue_name = \'webhooks\'` in one statement: define a CTE `claimed` that selects `job_id` from `job_queue WHERE queue_name = \'webhooks\' AND status = \'pending\' ORDER BY priority ASC, scheduled_at ASC, job_id ASC FOR UPDATE SKIP LOCKED LIMIT 2`, update those rows in `job_queue` (`status = \'running\'`, `attempts = attempts + 1`, `locked_by = \'worker-batch-01\'`) inside a second CTE `updated` using `RETURNING`, and in the outer `SELECT` return `job_id`, `priority`, `attempts`, `locked_by`, and `tenant` (`payload->>\'tenant\'`) ordered by `scheduled_at ASC, job_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'WITH claimed AS (',
            '  SELECT job_id',
            '  FROM job_queue',
            '  WHERE queue_name = \'webhooks\' AND status = \'pending\'',
            '  -- TODO: ORDER BY priority ASC, scheduled_at ASC, job_id ASC FOR UPDATE SKIP LOCKED LIMIT 2',
            '),',
            'updated AS (',
            '  UPDATE job_queue jq',
            '  SET status = \'running\',',
            '      attempts = jq.attempts + 1,',
            '      locked_by = \'worker-batch-01\'',
            '  FROM claimed c',
            '  WHERE jq.job_id = c.job_id',
            '  RETURNING jq.job_id, jq.priority, jq.attempts, jq.locked_by, jq.payload, jq.scheduled_at',
            ')',
            'SELECT job_id, priority, attempts, locked_by, payload->>\'tenant\' AS tenant',
            'FROM updated',
            'ORDER BY scheduled_at ASC, job_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH claimed AS (',
            '  SELECT job_id',
            '  FROM job_queue',
            '  WHERE queue_name = \'webhooks\' AND status = \'pending\'',
            '  ORDER BY priority ASC, scheduled_at ASC, job_id ASC',
            '  FOR UPDATE SKIP LOCKED',
            '  LIMIT 2',
            '),',
            'updated AS (',
            '  UPDATE job_queue jq',
            '  SET status = \'running\',',
            '      attempts = jq.attempts + 1,',
            '      locked_by = \'worker-batch-01\'',
            '  FROM claimed c',
            '  WHERE jq.job_id = c.job_id',
            '  RETURNING jq.job_id, jq.priority, jq.attempts, jq.locked_by, jq.payload, jq.scheduled_at',
            ')',
            'SELECT job_id, priority, attempts, locked_by, payload->>\'tenant\' AS tenant',
            'FROM updated',
            'ORDER BY scheduled_at ASC, job_id ASC;'
          ].join('\n'),
          hints: [
            'Complete `claimed` with `ORDER BY priority ASC, scheduled_at ASC, job_id ASC FOR UPDATE SKIP LOCKED LIMIT 2`.',
            'Join `job_queue jq` against `claimed c ON jq.job_id = c.job_id` in the `updated` data-modifying CTE.',
            'Extract `payload->>\'tenant\' AS tenant` in the outer `SELECT` and sort by `scheduled_at ASC, job_id ASC` (`job_id = 5` for `umbraco`, then `job_id = 3` for `initech`).'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bFOR\\s+UPDATE\\s+SKIP\\s+LOCKED\\b', flags: 'i', message: 'Use `FOR UPDATE SKIP LOCKED` inside the `claimed` CTE.' },
              { pattern: '\\bLIMIT\\s+2\\b', flags: 'i', message: 'Claim a batch of `LIMIT 2` pending webhook jobs.' }
            ]
          },
          solutionExplanation: 'Because `UPDATE ... RETURNING` does not guarantee output row order on its own, wrapping the `UPDATE` in a writable CTE (`updated`) and sorting in the outer `SELECT` cleanly batches `2` priority-1 webhook claims (`umbraco` and `initech`) in a single atomic statement.'
        }
      ]
    },
    /* ========================================================================
       LAB 04: pg-m08-t04 — Application Fencing & Leader Election (Advisory Locks)
       ======================================================================== */
    {
      id: 'pg-m08-t04',
      slug: 'advisory-locks-distributed-coordination',
      moduleId: 'pg-m08',
      title: 'Application Fencing & Leader Election with PostgreSQL Advisory Locks',
      difficulty: 'Advanced',
      estimatedMinutes: 15,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_try_advisory_xact_lock', 'pg_advisory_xact_lock', 'hashtext', 'pg_locks'],
      tags: ['advisory-locks', 'distributed-locks', 'pg-locks', 'concurrency'],
      guide: {
        mentalModel: 'Advisory locks let application code acquire fast, shared-memory mutexes inside PostgreSQL’s heavyweight lock manager (`LOCKTAG_ADVISORY`) **without touching any heap page, generating zero WAL, and creating zero MVCC dead tuples**. Every advisory lock comes in two lifetimes and two key formats:\n\n- **Transaction-scoped (`pg_advisory_xact_lock` / `pg_try_advisory_xact_lock`)**: Released automatically at `COMMIT` or `ROLLBACK`. **Always prefer `_xact_` variants** when running behind PgBouncer in `transaction` pool mode so locks can never leak across pooled clients.\n- **Session-scoped (`pg_advisory_lock` / `pg_try_advisory_lock`)**: Held until `pg_advisory_unlock()` or backend disconnect (`COMMIT` does *not* release them!).\n\nYou can address locks either by a single 64-bit `BIGINT` (`objsubid = 1` in `pg_locks`, commonly hashed from strings via `hashtext(...)` or `hashtextextended(..., 0)`) or by a clean two-integer `(classid INT4, objid INT4)` namespace pair (`objsubid = 2` in `pg_locks`) that prevents hash collisions across subsystems.',
        syntaxAnatomy: [
          'BEGIN;',
          '  -- Single-key non-blocking cron leader check:',
          '  SELECT pg_try_advisory_xact_lock(hashtext(\'cron:settlement\')) AS elected;',
          '  -- Two-key (namespace_id, resource_id) fencing lock:',
          '  SELECT pg_advisory_xact_lock(7001, 501);',
          '  SELECT locktype, classid, objid, objsubid, mode, granted',
          '  FROM pg_locks WHERE pid = pg_backend_pid() AND locktype = \'advisory\';',
          'COMMIT;'
        ].join('\n'),
        internalsAndGotchas: [
          'Never use session-level `pg_advisory_lock()` through transaction-pooled PgBouncer—the lock stays pinned to the server backend after your HTTP request finishes, deadlocking unrelated tenants.',
          '`hashtext(text)` produces a signed 32-bit `INT4` (~4.3B space); for millions of distinct string keys, use 64-bit `hashtextextended(key, 0)` to eliminate birthday-paradox collisions.',
          'In `pg_locks`, single-bigint advisory locks populate `(classid, objid)` with the upper/lower 32 bits and set `objsubid = 1`, whereas two-arg `(int4, int4)` locks set `objsubid = 2`.',
          'Advisory locks are re-entrant within the same session/transaction, and unlike row locks they reside in `max_locks_per_transaction` shared memory.'
        ],
        whenToUse: 'Use `pg_try_advisory_xact_lock` for single-leader cron scheduling, webhook idempotency fencing, and per-tenant stripe serialization without creating dummy lock tables or MVCC bloat.'
      },
      scenario: {
        role: 'Platform Infrastructure Staff Engineer',
        incidentOrGoal: 'Duplicate cron settlement pods fired concurrently during Kubernetes rollouts, and tenant ledger syncs needed zero-bloat shared-memory fencing verified via `pg_locks`.',
        stakeholderNeed: 'Elect a single settlement leader with `pg_try_advisory_xact_lock(hashtext(...))`, inspect two-key `(classid, objid)` locks in `pg_locks`, and fence all active tenant accounts in one transaction.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Non-Blocking Cron Leader Election with pg_try_advisory_xact_lock(hashtext(...))',
          mission: 'Inside an explicit `BEGIN; ... COMMIT;` block, attempt to elect the current backend as leader for `' + 'cron:settlement:us-east-1' + '` using `pg_try_advisory_xact_lock(hashtext(\'cron:settlement:us-east-1\'))` while counting pending jobs in `job_queue` where `queue_name = \'settlement\' AND status = \'pending\'`. Project 3 columns in exact order before `COMMIT;`: `is_leader` (`pg_try_advisory_xact_lock(hashtext(\'cron:settlement:us-east-1\'))`), `lock_hash` (`hashtext(\'cron:settlement:us-east-1\')`), and `pending_settlement_jobs` (`COUNT(*)`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            'SELECT -- TODO: pg_try_advisory_xact_lock(hashtext(\'cron:settlement:us-east-1\')) AS is_leader',
            '       hashtext(\'cron:settlement:us-east-1\') AS lock_hash,',
            '       COUNT(*) AS pending_settlement_jobs',
            'FROM job_queue',
            'WHERE queue_name = \'settlement\'',
            '  AND status = \'pending\';',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'SELECT pg_try_advisory_xact_lock(hashtext(\'cron:settlement:us-east-1\')) AS is_leader,',
            '       hashtext(\'cron:settlement:us-east-1\') AS lock_hash,',
            '       COUNT(*) AS pending_settlement_jobs',
            'FROM job_queue',
            'WHERE queue_name = \'settlement\'',
            '  AND status = \'pending\';',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Call `pg_try_advisory_xact_lock(hashtext(\'cron:settlement:us-east-1\')) AS is_leader` as the first projected column.',
            'Filter `job_queue` to `queue_name = \'settlement\' AND status = \'pending\'` so `COUNT(*)` evaluates on the single matching settlement batch.',
            'Close the transaction cleanly with `COMMIT;` so the transaction-scoped advisory lock releases automatically.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_try_advisory_xact_lock\\s*\\(', flags: 'i', message: 'Use transaction-scoped `pg_try_advisory_xact_lock(...)`.' },
              { pattern: '\\bhashtext\\s*\\(', flags: 'i', message: 'Hash the named lock key with `hashtext(\'cron:settlement:us-east-1\')`.' }
            ]
          },
          solutionExplanation: '`pg_try_advisory_xact_lock` acquires the `LOCKTAG_ADVISORY` slot in shared memory without waiting—returning `true` to the winning pod and `false` immediately to standby replicas—and releases automatically on `COMMIT`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Two-Key Namespace Locking (classid, objid) & Live pg_locks Inspection',
          mission: 'Inside `BEGIN; ... COMMIT;`, acquire a blocking two-integer transaction advisory lock in subsystem namespace `7001` for `account_id = 501` (`SELECT pg_advisory_xact_lock(7001, 501);`). Then, before `COMMIT;`, query `pg_locks` for `pid = pg_backend_pid() AND locktype = \'advisory\'` and return 6 columns in exact order: `locktype`, `classid`, `objid`, `objsubid`, `mode`, and `granted`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- TODO: Acquire two-key transaction advisory lock (7001, 501)',
            'SELECT locktype, classid, objid, objsubid, mode, granted',
            'FROM pg_locks',
            'WHERE pid = pg_backend_pid()',
            '  AND locktype = \'advisory\';',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'SELECT pg_advisory_xact_lock(7001, 501);',
            'SELECT locktype, classid, objid, objsubid, mode, granted',
            'FROM pg_locks',
            'WHERE pid = pg_backend_pid()',
            '  AND locktype = \'advisory\';',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Execute `SELECT pg_advisory_xact_lock(7001, 501);` immediately after `BEGIN;`.',
            'Query `pg_locks` **before** `COMMIT;` filtering `pid = pg_backend_pid() AND locktype = \'advisory\'`.',
            'Notice how two-argument `(int4, int4)` advisory locks record `classid = 7001`, `objid = 501`, and `objsubid = 2`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_advisory_xact_lock\\s*\\(\\s*7001\\s*,\\s*501\\s*\\)', flags: 'i', message: 'Acquire the two-key lock `pg_advisory_xact_lock(7001, 501)`.' },
              { pattern: '\\bpg_locks\\b', flags: 'i', message: 'Inspect the active lock entry in `pg_locks`.' }
            ]
          },
          solutionExplanation: 'Passing `(7001, 501)` to `pg_advisory_xact_lock(int4, int4)` partitions advisory locks cleanly by subsystem (`classid = 7001`) and entity ID (`objid = 501`) with `objsubid = 2` and `mode = \'ExclusiveLock\'` in `pg_locks`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Multi-Tenant Sync Fencing Verified Against pg_locks',
          mission: 'Inside `BEGIN; ... COMMIT;`, use a CTE `fenced` over `ledger_accounts WHERE status = \'active\' ORDER BY account_id ASC` that acquires `pg_try_advisory_xact_lock(9100, account_id) AS fenced_ok` alongside `account_id`, `account_code`, and `owner_tenant`. Join `fenced f` to `pg_locks l` (`l.pid = pg_backend_pid() AND l.locktype = \'advisory\' AND l.classid = 9100 AND l.objid = f.account_id`) and return 5 columns ordered by `f.account_id ASC`: `account_id`, `account_code`, `owner_tenant`, `fenced_ok`, and `granted` (`l.granted`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            'WITH fenced AS (',
            '  SELECT account_id,',
            '         account_code,',
            '         owner_tenant',
            '         -- TODO: pg_try_advisory_xact_lock(9100, account_id) AS fenced_ok',
            '  FROM ledger_accounts',
            '  WHERE status = \'active\'',
            '  ORDER BY account_id ASC',
            ')',
            'SELECT f.account_id, f.account_code, f.owner_tenant, f.fenced_ok, l.granted',
            'FROM fenced f',
            'JOIN pg_locks l',
            '  ON l.pid = pg_backend_pid()',
            ' AND l.locktype = \'advisory\'',
            ' AND l.classid = 9100',
            ' AND l.objid = f.account_id',
            'ORDER BY f.account_id ASC;',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'WITH fenced AS MATERIALIZED (',
            '  SELECT account_id,',
            '         account_code,',
            '         owner_tenant,',
            '         pg_try_advisory_xact_lock(9100, account_id) AS fenced_ok',
            '  FROM ledger_accounts',
            '  WHERE status = \'active\'',
            '  ORDER BY account_id ASC',
            ')',
            'SELECT f.account_id, f.account_code, f.owner_tenant, f.fenced_ok, l.granted',
            'FROM fenced f',
            'JOIN pg_locks l',
            '  ON l.pid = pg_backend_pid()',
            ' AND l.locktype = \'advisory\'',
            ' AND l.classid = 9100',
            ' AND l.objid = f.account_id',
            'ORDER BY f.account_id ASC;',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Mark `WITH fenced AS MATERIALIZED (...)` so PostgreSQL evaluates `pg_try_advisory_xact_lock(9100, account_id)` for every active account before probing the `pg_locks` snapshot.',
            'Acquire `pg_try_advisory_xact_lock(9100, account_id) AS fenced_ok` in deterministic `ORDER BY account_id ASC` order to prevent multi-lock deadlocks.',
            'Join `pg_locks l` on `l.pid = pg_backend_pid() AND l.locktype = \'advisory\' AND l.classid = 9100 AND l.objid = f.account_id` and sort by `f.account_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_try_advisory_xact_lock\\s*\\(\\s*9100\\s*,', flags: 'i', message: 'Fence each active account in namespace `9100` using `pg_try_advisory_xact_lock(9100, account_id)`.' },
              { pattern: '\\bpg_locks\\b', flags: 'i', message: 'Join against `pg_locks` to verify each granted advisory lock.' }
            ]
          },
          solutionExplanation: 'Materializing `fenced` in `account_id ASC` lock-acquisition order guarantees deadlock-free batch fencing before `pg_locks` is snapshotted, confirming all 4 active accounts (`501`, `502`, `503`, `505`) hold granted `LOCKTAG_ADVISORY` slots.'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m08-t05 — Live MVCC Tuple Inspection: ctid, xmin & xmax
       ======================================================================== */
    {
      id: 'pg-m08-t05',
      slug: 'mvcc-tuple-headers-ctid-xmin-xmax',
      moduleId: 'pg-m08',
      title: 'Live MVCC Tuple Inspection: ctid Physical Pointers, xmin & xmax',
      difficulty: 'Staff',
      estimatedMinutes: 18,
      datasetId: 'ecommerce',
      clauses: ['ctid', 'xmin', 'xmax', 'cmin', 'tableoid'],
      tags: ['mvcc', 'ctid', 'xmin', 'xmax', 'storage-internals'],
      guide: {
        mentalModel: 'Unlike MySQL/InnoDB or Oracle—which overwrite rows in place and reconstruct historical versions from an undo log—PostgreSQL uses **append-only multi-version storage directly inside heap pages**. Every heap row carries a 23-byte `HeapTupleHeaderData` prefix exposed through hidden system columns:\n\n- **`ctid` (`tid`)**: The physical `(block_number, line_pointer_offset)` address of this tuple version (for example, `(0,1)` is block `0`, slot `1`). An `UPDATE` in PostgreSQL is physically a **`DELETE` + `INSERT`**: the old tuple stays at `(0,1)` with its `xmax` stamped, and a brand-new tuple is appended at `(0,4)`!\n- **`xmin` (`xid`)**: The 32-bit transaction ID that inserted this tuple version.\n- **`xmax` (`xid`)**: `0` if untouched; otherwise the XID that deleted/superseded this tuple **or** currently holds a row-level lock (`FOR UPDATE` sets `xmax` + `HEAP_XMAX_LOCK_ONLY` in `t_infomask`!).\n- **`cmin` / `cmax` (`cid`)**: Intra-transaction command counter (`0, 1, 2...`) allowing statements within the *same* transaction to distinguish rows written by earlier commands.\n- **`tableoid`**: OID of the physical heap relation (crucial for identifying which child partition produced a row).',
        syntaxAnatomy: [
          'SELECT tableoid::regclass::text AS rel_name,',
          '       ctid::text AS tuple_tid,                             -- Physical (block, slot)',
          '       (xmin::text = pg_current_xact_id()::text) AS is_new, -- Created in this tx?',
          '       (xmax::text <> \'0\') AS has_xmax,                     -- Deleted or row-locked?',
          '       cmin::text AS cmd_seq',
          'FROM mvcc_product_lab;'
        ].join('\n'),
        internalsAndGotchas: [
          'Never cache `ctid` across transactions as an application row identifier—any `UPDATE` or `VACUUM FULL` moves the row to a new `(block, offset)`!',
          'Seeing `xmax <> 0` on a live row does **not** necessarily mean the row was deleted: either a `DELETE`/`UPDATE` rolled back, or a transaction locked the row with `SELECT ... FOR SHARE / FOR UPDATE` (`HEAP_XMAX_LOCK_ONLY`).',
          'To save 4 bytes per tuple header, PostgreSQL unions `t_cid` (`cmin` and `cmax` share one 32-bit field) and switches to a `ComboCid` lookup table in backend memory if the same transaction both inserts and deletes a tuple.'
        ],
        whenToUse: 'Inspect `ctid`, `xmin`, `xmax`, `cmin`, and `tableoid::regclass` when debugging MVCC visibility anomalies, diagnosing partition routing, or deduplicating corrupt heap tables lacking a primary key.'
      },
      scenario: {
        role: 'Database Storage Engine Engineer',
        incidentOrGoal: 'An engineering guild migrating from MySQL assumed `UPDATE` modifies rows in place without growing heap pages or advancing tuple offsets.',
        stakeholderNeed: 'Inspect fresh `(0,1)..(0,3)` tuple headers on `mvcc_product_lab`, prove an `UPDATE` allocates a new `ctid` at `(0,4)`, and trace intra-transaction `cmin` and `FOR UPDATE` `xmax` lock stamps.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Baseline System Columns: tableoid, ctid & Untouched xmax',
          mission: 'A fresh 3-row heap table `mvcc_product_lab` (`product_id` `101`, `102`, `103`) has been created on block `0`. Query `mvcc_product_lab` and project 5 columns ordered by `product_id ASC`: `rel_name` (`tableoid::regclass::text`), `tuple_tid` (`ctid::text`), `product_id`, `sku`, and `xmax_untouched` (`xmax::text = \'0\'`).',
          setupSql: 'DROP TABLE IF EXISTS mvcc_product_lab; BEGIN; CREATE TABLE mvcc_product_lab AS SELECT product_id, sku, price_cents, stock_qty FROM products WHERE product_id IN (101, 102, 103) ORDER BY product_id ASC; COMMIT;',
          probeSql: '',
          starterCode: [
            '-- Inspect physical relation OID, (block, offset) ctid, and xmax = 0 on fresh tuples',
            'SELECT tableoid::regclass::text AS rel_name,',
            '       -- TODO: ctid::text AS tuple_tid',
            '       product_id,',
            '       sku',
            '       -- TODO: (xmax::text = \'0\') AS xmax_untouched',
            'FROM mvcc_product_lab',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT tableoid::regclass::text AS rel_name,',
            '       ctid::text AS tuple_tid,',
            '       product_id,',
            '       sku,',
            '       (xmax::text = \'0\') AS xmax_untouched',
            'FROM mvcc_product_lab',
            'ORDER BY product_id ASC;'
          ].join('\n'),
          hints: [
            'Cast `ctid::text AS tuple_tid` so PostgreSQL outputs `\'(0,1)\'`, `\'(0,2)\'`, and `\'(0,3)\'` as clean text.',
            'Cast `tableoid::regclass::text AS rel_name` to resolve the numeric OID to `\'mvcc_product_lab\'`.',
            'Check `(xmax::text = \'0\') AS xmax_untouched` and sort by `product_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\btableoid\\b', flags: 'i', message: 'Project `tableoid::regclass::text` to identify the physical heap table.' },
              { pattern: '\\bctid\\b', flags: 'i', message: 'Project `ctid::text` to inspect physical `(block, offset)` tuple slots.' },
              { pattern: '\\bxmax\\b', flags: 'i', message: 'Check `xmax` to confirm no deletion or lock XID is stamped.' }
            ]
          },
          solutionExplanation: 'The three freshly inserted rows occupy contiguous line pointers `(0,1)`, `(0,2)`, and `(0,3)` on heap block `0` of `mvcc_product_lab`, each carrying `xmax = 0` (`InvalidTransactionId`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Watching an Append-Only UPDATE Jump ctid from (0,1) to (0,4)',
          mission: 'Inside `BEGIN; ... COMMIT;`, update `mvcc_product_lab` setting `price_cents = price_cents + 1000` where `product_id = 101`. Before `COMMIT;`, `SELECT` 5 columns ordered by `product_id ASC`: `product_id`, `price_cents`, `tuple_tid` (`ctid::text`), `written_by_current_tx` (`xmin::text = pg_current_xact_id()::text`), and `tx_cmin` (`CASE WHEN xmin::text = pg_current_xact_id()::text THEN cmin::text ELSE NULL END`).',
          setupSql: 'DROP TABLE IF EXISTS mvcc_product_lab; BEGIN; CREATE TABLE mvcc_product_lab AS SELECT product_id, sku, price_cents, stock_qty FROM products WHERE product_id IN (101, 102, 103) ORDER BY product_id ASC; COMMIT;',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- TODO: UPDATE mvcc_product_lab SET price_cents = price_cents + 1000 WHERE product_id = 101;',
            'SELECT product_id,',
            '       price_cents,',
            '       ctid::text AS tuple_tid,',
            '       (xmin::text = pg_current_xact_id()::text) AS written_by_current_tx,',
            '       CASE WHEN xmin::text = pg_current_xact_id()::text THEN cmin::text ELSE NULL END AS tx_cmin',
            'FROM mvcc_product_lab',
            'ORDER BY product_id ASC;',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'UPDATE mvcc_product_lab',
            'SET price_cents = price_cents + 1000',
            'WHERE product_id = 101;',
            'SELECT product_id,',
            '       price_cents,',
            '       ctid::text AS tuple_tid,',
            '       (xmin::text = pg_current_xact_id()::text) AS written_by_current_tx,',
            '       CASE WHEN xmin::text = pg_current_xact_id()::text THEN cmin::text ELSE NULL END AS tx_cmin',
            'FROM mvcc_product_lab',
            'ORDER BY product_id ASC;',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Run `UPDATE mvcc_product_lab SET price_cents = price_cents + 1000 WHERE product_id = 101;` right after `BEGIN;`.',
            'Keep the `SELECT` inside the open transaction so `xmin::text = pg_current_xact_id()::text` matches the current transaction’s XID on `product_id = 101`.',
            'Cast `cmin::text` (PostgreSQL `cid` casts via `::text`) so `product_id = 101` jumps from `(0,1)` to `(0,4)` with `tx_cmin = \'0\'`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bUPDATE\\s+mvcc_product_lab\\b', flags: 'i', message: 'Update `product_id = 101` in `mvcc_product_lab`.' },
              { pattern: '\\bxmin\\b', flags: 'i', message: 'Compare `xmin` against `pg_current_xact_id()`.' },
              { pattern: '\\bcmin\\b', flags: 'i', message: 'Inspect `cmin` on the newly created tuple version.' }
            ]
          },
          solutionExplanation: 'Instead of overwriting `(0,1)` in place, PostgreSQL marked `(0,1)` superseded with your `xmax` and appended a fresh tuple at `(0,4)` stamped with your current `xmin` and command sequence `cmin = 0`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Command Counter Progression (cmin 0 → 1) & Row-Lock xmax Stamping',
          mission: 'Inside `BEGIN; ... COMMIT;`, execute three sequential operations on `mvcc_product_lab`: (1) `INSERT INTO mvcc_product_lab VALUES (104, \'NVME-GEN5-8TB\', 129000, 10);`, (2) `UPDATE mvcc_product_lab SET stock_qty = stock_qty - 2 WHERE product_id = 102;`, and (3) `SELECT product_id FROM mvcc_product_lab WHERE product_id = 103 FOR UPDATE;`. Then before `COMMIT;`, `SELECT` 5 columns ordered by `product_id ASC`: `product_id`, `tuple_tid` (`ctid::text`), `written_this_tx` (`xmin::text = pg_current_xact_id()::text`), `has_xmax_stamp` (`xmax::text <> \'0\'`), and `tx_cmin` (`CASE WHEN xmin::text = pg_current_xact_id()::text THEN cmin::text ELSE NULL END`).',
          setupSql: 'DROP TABLE IF EXISTS mvcc_product_lab; BEGIN; CREATE TABLE mvcc_product_lab AS SELECT product_id, sku, price_cents, stock_qty FROM products WHERE product_id IN (101, 102, 103) ORDER BY product_id ASC; COMMIT;',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- 1. INSERT (104, \'NVME-GEN5-8TB\', 129000, 10) into mvcc_product_lab',
            '-- 2. UPDATE stock_qty = stock_qty - 2 WHERE product_id = 102',
            '-- 3. Lock product_id = 103 with SELECT product_id FROM mvcc_product_lab WHERE product_id = 103 FOR UPDATE',
            'SELECT product_id,',
            '       ctid::text AS tuple_tid,',
            '       (xmin::text = pg_current_xact_id()::text) AS written_this_tx,',
            '       (xmax::text <> \'0\') AS has_xmax_stamp,',
            '       CASE WHEN xmin::text = pg_current_xact_id()::text THEN cmin::text ELSE NULL END AS tx_cmin',
            'FROM mvcc_product_lab',
            'ORDER BY product_id ASC;',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'INSERT INTO mvcc_product_lab VALUES (104, \'NVME-GEN5-8TB\', 129000, 10);',
            'UPDATE mvcc_product_lab SET stock_qty = stock_qty - 2 WHERE product_id = 102;',
            'SELECT product_id FROM mvcc_product_lab WHERE product_id = 103 FOR UPDATE;',
            'SELECT product_id,',
            '       ctid::text AS tuple_tid,',
            '       (xmin::text = pg_current_xact_id()::text) AS written_this_tx,',
            '       (xmax::text <> \'0\') AS has_xmax_stamp,',
            '       CASE WHEN xmin::text = pg_current_xact_id()::text THEN cmin::text ELSE NULL END AS tx_cmin',
            'FROM mvcc_product_lab',
            'ORDER BY product_id ASC;',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Execute the `INSERT` first (`cmin = 0`, landing at `(0,4)`), then the `UPDATE` on `102` (`cmin = 1`, jumping from `(0,2)` to `(0,5)`).',
            'Run `SELECT product_id FROM mvcc_product_lab WHERE product_id = 103 FOR UPDATE;` third—it keeps `103` at `(0,3)` (`written_this_tx = false`) while stamping `xmax` (`has_xmax_stamp = true`)!',
            'Run the 5-column inspection `SELECT` sorted by `product_id ASC` before `COMMIT;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bINSERT\\s+INTO\\s+mvcc_product_lab\\b', flags: 'i', message: 'Insert row `104` as the first command in the transaction.' },
              { pattern: '\\bFOR\\s+UPDATE\\b', flags: 'i', message: 'Lock `product_id = 103` with `FOR UPDATE` to witness `xmax` lock stamping on a live row.' }
            ]
          },
          solutionExplanation: 'This single snapshot captures all three MVCC mechanics simultaneously: `104` at `(0,4)` has `tx_cmin = 0`, `102` jumped to `(0,5)` with `tx_cmin = 1`, and live `103` stayed at `(0,3)` (`written_this_tx = false`) yet exhibits `has_xmax_stamp = true` because `FOR UPDATE` stores row locks directly in `t_xmax`!'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m08-t06 — Inside 8 KB Slotted Pages & B-Trees (pageinspect)
       ======================================================================== */
    {
      id: 'pg-m08-t06',
      slug: 'slotted-pages-pageinspect-internals',
      moduleId: 'pg-m08',
      title: 'Inside 8 KB Slotted Pages & B-Tree Leaves with pageinspect',
      difficulty: 'Staff',
      estimatedMinutes: 20,
      datasetId: 'ecommerce',
      clauses: ['page_header', 'heap_page_items', 'get_raw_page', 'bt_metap', 'bt_page_items'],
      tags: ['pageinspect', 'slotted-page', 'infomask', 'btree-internals', 'storage'],
      guide: {
        mentalModel: 'PostgreSQL partitions every heap table and index into fixed **8192-byte (`8 KB`) slotted pages** (`BLCKSZ = 8192`) so indexes reference `ItemIdData` line pointers `(block, lp)` rather than raw byte offsets—allowing `VACUUM` to compact tuples inside a page without rewriting every B-Tree index!\n\nInside each 8192-byte heap page (`pageinspect`’s `get_raw_page(relname, blkno)`):\n- **Bytes `0..23` (`PageHeaderData`)**: `pd_lsn`, `pd_checksum`, `pd_flags`, `pd_lower` (end of the growing line-pointer array), `pd_upper` (start of the backward-growing tuple stack), and `pd_special` (`8192` on heap pages; stores sibling pointers on B-Tree pages). **`pd_upper - pd_lower` is exact contiguous free bytes!**\n- **Line Pointer Array (`ItemIdData`, 4 bytes each)**: Grows forward from byte `24`; `lp_flags` tracks `1` (`LP_NORMAL`), `2` (`LP_REDIRECT` for HOT chains), `3` (`LP_DEAD`), or `0` (`LP_UNUSED`).\n- **Tuple Payload (`heap_page_items`)**: Grows backward from `8192` toward `pd_upper`—exposing **even dead/superseded tuples** invisible to normal `SELECT` queries, including `t_ctid` update-chain links and `t_infomask` bitflags!\n- **B-Tree Pages (`bt_metap`, `bt_page_items`)**: Block `0` of every B-Tree is a metapage (`root` block number, tree `level` height = `0` for a single-leaf root), and leaf entries map indexed key bytes to heap `ctid`s.',
        syntaxAnatomy: [
          '-- 1. 24-byte PageHeaderData:',
          'SELECT pagesize, version, lower, upper, (upper - lower) AS free_bytes',
          'FROM page_header(get_raw_page(\'page_lab_items\', 0));',
          '-- 2. Raw Heap Tuples (including dead MVCC versions!):',
          'SELECT lp, lp_flags, lp_len, t_ctid::text FROM heap_page_items(get_raw_page(\'page_lab_items\', 0));',
          '-- 3. B-Tree Metapage & Root Leaf Entries:',
          'SELECT version, root, level FROM bt_metap(\'page_lab_items_pkey\');'
        ].join('\n'),
        internalsAndGotchas: [
          'Normal SQL `SELECT` hides superseded MVCC tuples, whereas `heap_page_items(get_raw_page(...))` reads raw bytes directly from the 8 KB buffer—revealing superseded tuples whose `t_ctid` points forward to their newer version!',
          'In B-Tree indexes, block `0` is **always** the metapage (`bt_metap`); the actual root/leaf items start at block `1` (`bt_page_items(index_name, 1)`).',
          'When `UPDATE` modifies an indexed column (or cannot fit on the same page), B-Tree leaf pages accumulate extra index tuples pointing to the new heap `ctid` until `VACUUM` or bottom-up index deletion (`LP_DEAD` hinting) reclaims them.'
        ],
        whenToUse: 'Use `pageinspect` when investigating slotted-page fragmentation, verifying HOT update `LP_REDIRECT` chains, inspecting `t_infomask` visibility flags, or auditing B-Tree tree height (`level`) and leaf density.'
      },
      scenario: {
        role: 'Principal PostgreSQL Internals Engineer',
        incidentOrGoal: 'Storage engineers want direct byte-level proof of how a 3-row table + 1 `UPDATE` lays out `pd_lower`/`pd_upper` free space, forward `t_ctid` update chains on heap block `0`, and B-Tree leaf pointers in `page_lab_items_pkey`.',
        stakeholderNeed: 'Decode `page_header`, inspect all 4 raw slots via `heap_page_items`, and correlate `bt_metap` with `bt_page_items` on block `1`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Decoding the 8 KB Slotted Page Header with page_header(get_raw_page(...))',
          mission: '`page_lab_items` (`PRIMARY KEY (item_id)`) contains 3 rows plus 1 committed `UPDATE` on `item_id = 1` (so 4 physical heap tuples sit on block `0`). Query `page_header(get_raw_page(\'page_lab_items\', 0))` and project 5 columns in exact order: `pagesize`, `version`, `lower`, `upper`, and `free_contiguous_bytes` (`upper - lower`).',
          setupSql: 'DROP TABLE IF EXISTS page_lab_items; BEGIN; CREATE TABLE page_lab_items (item_id INTEGER PRIMARY KEY, sku TEXT NOT NULL, price_cents INTEGER NOT NULL); INSERT INTO page_lab_items VALUES (1, \'SSD-4TB\', 42000), (2, \'NIC-100G\', 68000), (3, \'SW-48P\', 54000); UPDATE page_lab_items SET price_cents = 45000 WHERE item_id = 1; COMMIT;',
          probeSql: '',
          starterCode: [
            '-- Decode PageHeaderData on block 0 of page_lab_items',
            'SELECT pagesize,',
            '       version,',
            '       lower,',
            '       upper',
            '       -- TODO: (upper - lower) AS free_contiguous_bytes',
            'FROM page_header(get_raw_page(\'page_lab_items\', 0));'
          ].join('\n'),
          solutionCode: [
            'SELECT pagesize,',
            '       version,',
            '       lower,',
            '       upper,',
            '       (upper - lower) AS free_contiguous_bytes',
            'FROM page_header(get_raw_page(\'page_lab_items\', 0));'
          ].join('\n'),
          hints: [
            'Pass `get_raw_page(\'page_lab_items\', 0)` into `page_header(...)` in the `FROM` clause.',
            'Notice `lower = 40`: `24` bytes of `PageHeaderData` + `4` line pointers × `4` bytes each!',
            'Compute `(upper - lower) AS free_contiguous_bytes` as the 5th column.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpage_header\\s*\\(', flags: 'i', message: 'Use `page_header(...)` from `pageinspect`.' },
              { pattern: '\\bget_raw_page\\s*\\(', flags: 'i', message: 'Read raw block `0` via `get_raw_page(\'page_lab_items\', 0)`.' }
            ]
          },
          solutionExplanation: 'Block `0` reports `pagesize = 8192`, layout `version = 4`, and `lower = 40` (`24`-byte header + `16` bytes for 4 `ItemIdData` slots), while `upper` marks the start of the 4 backward-stacked tuples, leaving `upper - lower` bytes of unallocated space in the middle.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Exposing Dead MVCC Versions & Forward t_ctid Chains with heap_page_items()',
          mission: 'Crack open the raw tuple array of block `0` using `heap_page_items(get_raw_page(\'page_lab_items\', 0))`. Project 5 columns ordered by `lp ASC`: `lp`, `lp_flags`, `lp_len`, `chain_ctid` (`t_ctid::text`), and `is_superseded` (`t_xmax::text <> \'0\'`).',
          setupSql: 'DROP TABLE IF EXISTS page_lab_items; BEGIN; CREATE TABLE page_lab_items (item_id INTEGER PRIMARY KEY, sku TEXT NOT NULL, price_cents INTEGER NOT NULL); INSERT INTO page_lab_items VALUES (1, \'SSD-4TB\', 42000), (2, \'NIC-100G\', 68000), (3, \'SW-48P\', 54000); UPDATE page_lab_items SET price_cents = 45000 WHERE item_id = 1; COMMIT;',
          probeSql: '',
          starterCode: [
            '-- Read all 4 physical slots on block 0, including the superseded version at lp = 1',
            'SELECT lp,',
            '       lp_flags,',
            '       lp_len',
            '       -- TODO: t_ctid::text AS chain_ctid',
            '       -- TODO: (t_xmax::text <> \'0\') AS is_superseded',
            'FROM heap_page_items(get_raw_page(\'page_lab_items\', 0))',
            'ORDER BY lp ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT lp,',
            '       lp_flags,',
            '       lp_len,',
            '       t_ctid::text AS chain_ctid,',
            '       (t_xmax::text <> \'0\') AS is_superseded',
            'FROM heap_page_items(get_raw_page(\'page_lab_items\', 0))',
            'ORDER BY lp ASC;'
          ].join('\n'),
          hints: [
            'Query `FROM heap_page_items(get_raw_page(\'page_lab_items\', 0))`.',
            'Cast `t_ctid::text AS chain_ctid` to see `lp = 1` pointing forward to `\'(0,4)\'`.',
            'Compute `(t_xmax::text <> \'0\') AS is_superseded` and sort by `lp ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bheap_page_items\\s*\\(', flags: 'i', message: 'Use `heap_page_items(get_raw_page(...))` to inspect raw heap slots.' },
              { pattern: '\\bt_ctid\\b', flags: 'i', message: 'Project `t_ctid::text` to reveal the MVCC update chain.' }
            ]
          },
          solutionExplanation: 'Even though `SELECT COUNT(*) FROM page_lab_items` returns `3`, `heap_page_items` reveals all `4` `LP_NORMAL` (`lp_flags = 1`) slots: `lp = 1` has `is_superseded = true` and `chain_ctid = \'(0,4)\'`, linking directly to its updated successor at `lp = 4`!'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Inspecting B-Tree Metapage & Root Leaf Entries (bt_metap + bt_page_items)',
          mission: 'Inspect the primary-key B-Tree index `page_lab_items_pkey` by cross-joining `bt_metap(\'page_lab_items_pkey\') m` with `bt_page_items(\'page_lab_items_pkey\', m.root) i`. Project 6 columns ordered by `i.itemoffset ASC`: `btree_version` (`m.version`), `root_blkno` (`m.root`), `tree_level` (`m.level`), `itemoffset` (`i.itemoffset`), `heap_tid` (`i.ctid::text`), and `dead` (`i.dead`).',
          setupSql: 'DROP TABLE IF EXISTS page_lab_items; BEGIN; CREATE TABLE page_lab_items (item_id INTEGER PRIMARY KEY, sku TEXT NOT NULL, price_cents INTEGER NOT NULL); INSERT INTO page_lab_items VALUES (1, \'SSD-4TB\', 42000), (2, \'NIC-100G\', 68000), (3, \'SW-48P\', 54000); UPDATE page_lab_items SET price_cents = 45000 WHERE item_id = 1; COMMIT;',
          probeSql: '',
          starterCode: [
            '-- Inspect B-Tree metapage (block 0) and root leaf entries (block m.root)',
            'SELECT m.version AS btree_version,',
            '       m.root AS root_blkno,',
            '       m.level AS tree_level,',
            '       i.itemoffset',
            '       -- TODO: i.ctid::text AS heap_tid',
            '       -- TODO: i.dead',
            'FROM bt_metap(\'page_lab_items_pkey\') m',
            'CROSS JOIN LATERAL bt_page_items(\'page_lab_items_pkey\', m.root) i',
            'ORDER BY i.itemoffset ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT m.version AS btree_version,',
            '       m.root AS root_blkno,',
            '       m.level AS tree_level,',
            '       i.itemoffset,',
            '       i.ctid::text AS heap_tid,',
            '       i.dead',
            'FROM bt_metap(\'page_lab_items_pkey\') m',
            'CROSS JOIN LATERAL bt_page_items(\'page_lab_items_pkey\', m.root) i',
            'ORDER BY i.itemoffset ASC;'
          ].join('\n'),
          hints: [
            'Read `bt_metap(\'page_lab_items_pkey\') m` (`root = 1`, `level = 0` for a single-page root leaf, Lehman-Yao B-Tree `version = 4`).',
            'Join `bt_page_items(\'page_lab_items_pkey\', m.root) i` (or `bt_page_items(\'page_lab_items_pkey\', 1) i`) to enumerate leaf index entries.',
            'Project `i.ctid::text AS heap_tid` and `i.dead` ordered by `i.itemoffset ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bbt_metap\\s*\\(', flags: 'i', message: 'Inspect the B-Tree metapage with `bt_metap(\'page_lab_items_pkey\')`.' },
              { pattern: '\\bbt_page_items\\s*\\(', flags: 'i', message: 'Inspect leaf index entries with `bt_page_items(...)`.' }
            ]
          },
          solutionExplanation: 'Because `UPDATE` on `price_cents` did not change `item_id` and fit on the same heap page, PostgreSQL executed a **Heap-Only Tuple (HOT) update**! Notice `bt_page_items` has only **3** index entries (`(0,1)`, `(0,2)`, `(0,3)`)—no second index entry was needed for `(0,4)` because index scans follow `(0,1)`’s HOT chain on page `0`!'
        }
      ]
    },
    /* ========================================================================
       LAB 07: pg-m08-t07 — VACUUM, HOT Updates, pg_visibility & pg_freespacemap
       ======================================================================== */
    {
      id: 'pg-m08-t07',
      slug: 'vacuum-hot-updates-visibility-fsm',
      moduleId: 'pg-m08',
      title: 'VACUUM, Heap-Only Tuples (HOT), pg_visibility & pg_freespacemap',
      difficulty: 'Staff',
      estimatedMinutes: 20,
      datasetId: 'ecommerce',
      clauses: ['VACUUM', 'fillfactor', 'pg_visibility_map_summary', 'pg_freespace'],
      tags: ['vacuum', 'hot-updates', 'pg-visibility', 'pg-freespacemap', 'bloat'],
      guide: {
        mentalModel: 'Because PostgreSQL `UPDATE`s append a new physical tuple version, high-churn tables survive at scale thanks to three cooperating storage subsystems:\n\n1. **Heap-Only Tuples (`HOT`) & `fillfactor`**: When an `UPDATE` modifies **zero indexed columns** and the new tuple fits on the **same 8 KB heap page**, PostgreSQL skips inserting new B-Tree entries completely! Existing indexes keep pointing to the root line pointer `(block, root_lp)`, and heap scans hop across the intra-page `t_ctid` HOT chain. Lowering table `fillfactor` (default `100` → `70`–`85`) reserves `15%`–`30%` headroom per page for `INSERT`s so `UPDATE`s consistently land on the same block.\n2. **`VACUUM` & HOT Pruning**: Reclaims dead tuple bytes inside slotted pages, collapses superseded HOT roots into lightweight 4-byte `LP_REDIRECT` (`lp_flags = 2`, `lp_len = 0`) pointers, and freezes old `xmin`s (`VACUUM (FREEZE)`) ahead of XID wraparound.\n3. **Visibility Map (`_vm`, `pg_visibility`) & Free Space Map (`_fsm`, `pg_freespacemap`)**: `VACUUM` sets 2 bits per heap page in `_vm`—`all_visible` (unlocking heap-less **Index-Only Scans**) and `all_frozen` (letting future aggressive `VACUUM`s skip cold pages completely)—while recording reusable per-block byte counts (quantized in 32-byte increments) in `_fsm`.',
        syntaxAnatomy: [
          'ALTER TABLE hot_inventory_lab SET (fillfactor = 70);',
          'VACUUM (FREEZE) vm_fsm_lab;',
          'SELECT all_visible, all_frozen FROM pg_visibility_map_summary(\'vm_fsm_lab\');',
          'SELECT blkno, avail FROM pg_freespace(\'products\');'
        ].join('\n'),
        internalsAndGotchas: [
          '`ALTER TABLE ... SET (fillfactor = 70)` applies immediately to newly allocated pages and future `INSERT` limits without rewriting existing full pages (until `VACUUM FULL` or `pg_repack`).',
          'Adding an unnecessary index on a frequently updated status or counter column **silently disables HOT updates** for mutations touching that column, multiplying write amplification across *every* index on the table!',
          '`VACUUM` (without `FULL`) takes only `ShareUpdateExclusiveLock`—never blocking concurrent `SELECT`, `INSERT`, `UPDATE`, or `DELETE`—and returns space to `_fsm` for internal reuse rather than shrinking the OS file (`VACUUM FULL` takes `AccessExclusiveLock`!).',
          '`pg_freespace(rel)` reads `_fsm`, which starts at `0` on freshly inserted pages until `VACUUM` populates it.'
        ],
        whenToUse: 'Lower `fillfactor` (`70`–`85`) on hot OLTP tables whose non-indexed columns update frequently, monitor `pg_visibility_map_summary` when Index-Only Scans show high `Heap Fetches`, and audit `pg_freespace` to verify reusable page capacity.'
      },
      scenario: {
        role: 'Staff Database Reliability Engineer (DBRE)',
        incidentOrGoal: 'Frequent `stock_qty` updates caused severe index write amplification on `products`, and Index-Only Scans suffered 100% `Heap Fetches` because newly loaded tables had unpopulated visibility and free-space maps.',
        stakeholderNeed: 'Configure `fillfactor = 70` and verify zero B-Tree churn on a HOT update, execute `VACUUM (FREEZE)` to populate `all_visible`/`all_frozen` and `LP_REDIRECT`, and compare `pg_freespace` against raw slotted-page free bytes.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Tuning fillfactor = 70 & Verifying Zero-Index-Churn HOT Updates',
          mission: 'On `hot_inventory_lab` (`PRIMARY KEY (product_id)` with rows `101`, `102`, `103`), run `ALTER TABLE hot_inventory_lab SET (fillfactor = 70);`, then `UPDATE hot_inventory_lab SET stock_qty = stock_qty - 5 WHERE product_id = 101;`. Finally, query `pg_class c CROSS JOIN bt_page_items(\'hot_inventory_lab_pkey\', 1) i` for `c.relname = \'hot_inventory_lab\'` ordered by `i.itemoffset ASC`, returning 4 columns: `relname` (`c.relname`), `reloptions` (`c.reloptions::text`), `itemoffset` (`i.itemoffset`), and `index_root_tid` (`i.ctid::text`).',
          setupSql: 'DROP TABLE IF EXISTS hot_inventory_lab; BEGIN; CREATE TABLE hot_inventory_lab (product_id INTEGER PRIMARY KEY, sku TEXT NOT NULL, stock_qty INTEGER NOT NULL); INSERT INTO hot_inventory_lab SELECT product_id, sku, stock_qty FROM products WHERE product_id IN (101, 102, 103) ORDER BY product_id ASC; COMMIT;',
          probeSql: '',
          starterCode: [
            '-- 1. Configure fillfactor = 70 on hot_inventory_lab',
            '-- 2. Update non-indexed stock_qty = stock_qty - 5 where product_id = 101',
            'SELECT c.relname,',
            '       c.reloptions::text AS reloptions,',
            '       i.itemoffset,',
            '       i.ctid::text AS index_root_tid',
            'FROM pg_class c',
            'CROSS JOIN bt_page_items(\'hot_inventory_lab_pkey\', 1) i',
            'WHERE c.relname = \'hot_inventory_lab\'',
            'ORDER BY i.itemoffset ASC;'
          ].join('\n'),
          solutionCode: [
            'ALTER TABLE hot_inventory_lab SET (fillfactor = 70);',
            'UPDATE hot_inventory_lab SET stock_qty = stock_qty - 5 WHERE product_id = 101;',
            'SELECT c.relname,',
            '       c.reloptions::text AS reloptions,',
            '       i.itemoffset,',
            '       i.ctid::text AS index_root_tid',
            'FROM pg_class c',
            'CROSS JOIN bt_page_items(\'hot_inventory_lab_pkey\', 1) i',
            'WHERE c.relname = \'hot_inventory_lab\'',
            'ORDER BY i.itemoffset ASC;'
          ].join('\n'),
          hints: [
            'Run `ALTER TABLE hot_inventory_lab SET (fillfactor = 70);` first so `pg_class.reloptions` records `{fillfactor=70}`.',
            'Run `UPDATE hot_inventory_lab SET stock_qty = stock_qty - 5 WHERE product_id = 101;`—because `stock_qty` is not indexed and page `0` has room, PostgreSQL performs a HOT update.',
            'Select the 4 columns from `pg_class` joined with `bt_page_items(\'hot_inventory_lab_pkey\', 1)` ordered by `i.itemoffset ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bfillfactor\\s*=\\s*70\\b', flags: 'i', message: 'Set storage parameter `(fillfactor = 70)` on `hot_inventory_lab`.' },
              { pattern: '\\bUPDATE\\s+hot_inventory_lab\\b', flags: 'i', message: 'Update `stock_qty` on `product_id = 101` to trigger a HOT update.' }
            ]
          },
          solutionExplanation: 'Even though `product_id = 101` moved on heap page `0` from `(0,1)` to `(0,4)`, `hot_inventory_lab_pkey` still holds **only 3 leaf entries** with `itemoffset = 1` pointing to `(0,1)`—proving zero B-Tree write amplification while reserving `30%` headroom via `{fillfactor=70}`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Running VACUUM (FREEZE) to Populate Visibility Map & LP_REDIRECT',
          mission: '`vm_fsm_lab` has 5 rows plus 1 committed HOT update on `id = 101`, leaving `all_visible = 0`, `all_frozen = 0`, and `lp = 1` unpruned. Execute a **single standalone** `VACUUM (FREEZE) vm_fsm_lab;` statement (remember `VACUUM` cannot run inside a multi-statement transaction block!) so our post-execution verification probe confirms `all_visible = 1`, `all_frozen = 1`, `lp = 1` pruned to `LP_REDIRECT` (`lp_flags = 2`), and non-zero `_fsm` availability!',
          setupSql: 'DROP TABLE IF EXISTS vm_fsm_lab; BEGIN; CREATE TABLE vm_fsm_lab (id INTEGER PRIMARY KEY, sku TEXT NOT NULL, stock_qty INTEGER NOT NULL) WITH (fillfactor = 70); INSERT INTO vm_fsm_lab SELECT product_id, sku, stock_qty FROM products WHERE product_id <= 105 ORDER BY product_id ASC; UPDATE vm_fsm_lab SET stock_qty = stock_qty + 10 WHERE id = 101; COMMIT;',
          probeSql: 'SELECT v.all_visible, v.all_frozen, (SELECT lp_flags FROM heap_page_items(get_raw_page(\'vm_fsm_lab\', 0)) WHERE lp = 1) AS lp1_redirect_flag, (f.avail > 0) AS fsm_populated FROM pg_visibility_map_summary(\'vm_fsm_lab\') v CROSS JOIN pg_freespace(\'vm_fsm_lab\') f WHERE f.blkno = 0;',
          starterCode: [
            '-- Replace this read-only query with a single standalone VACUUM (FREEZE) command on vm_fsm_lab:',
            'SELECT all_visible, all_frozen FROM pg_visibility_map_summary(\'vm_fsm_lab\');'
          ].join('\n'),
          solutionCode: 'VACUUM (FREEZE) vm_fsm_lab;',
          hints: [
            '`VACUUM` cannot execute inside a transaction block, so make `VACUUM (FREEZE) vm_fsm_lab;` the **only** statement in the editor.',
            'Include the `(FREEZE)` option so PostgreSQL sets **both** `all_visible` and `all_frozen` bits on block `0` in `_vm`.',
            'The automated `probeSql` will inspect `pg_visibility_map_summary`, `heap_page_items` (`lp = 1` → `lp_flags = 2`), and `pg_freespace` right after your `VACUUM` completes.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bVACUUM\\b', flags: 'i', message: 'Run `VACUUM (FREEZE) vm_fsm_lab;`.' },
              { pattern: '\\bFREEZE\\b', flags: 'i', message: 'Include `FREEZE` (`VACUUM (FREEZE) vm_fsm_lab;`) to mark block `0` `all_frozen`.' }
            ]
          },
          solutionExplanation: 'In one pass without blocking readers, `VACUUM (FREEZE) vm_fsm_lab` reclaimed the superseded tuple at `lp = 1` into a 4-byte `LP_REDIRECT` (`lp_flags = 2`), stamped `FrozenTransactionId` on all surviving rows, flipped both `all_visible = 1` and `all_frozen = 1` in `_vm`, and registered reusable free space in `_fsm`!'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Auditing Unvacuumed FSM & Visibility Maps Against Raw Slotted-Page Free Space',
          mission: 'On freshly seeded `products` (which has not yet been vacuumed), join `pg_freespace(\'products\') f`, `page_header(get_raw_page(\'products\', f.blkno)) p`, and `pg_visibility_map_summary(\'products\') v` to contrast lazy `_fsm`/`_vm` forks against actual slotted-page bytes. Project 5 columns ordered by `f.blkno ASC`: `blkno` (`f.blkno`), `fsm_recorded_bytes` (`f.avail`), `actual_page_free_bytes` (`p.upper - p.lower`), `all_visible` (`v.all_visible`), and `all_frozen` (`v.all_frozen`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Compare _fsm (pg_freespace) and _vm (pg_visibility_map_summary) against raw page_header free space',
            'SELECT f.blkno,',
            '       f.avail AS fsm_recorded_bytes,',
            '       -- TODO: (p.upper - p.lower) AS actual_page_free_bytes',
            '       v.all_visible,',
            '       v.all_frozen',
            'FROM pg_freespace(\'products\') f',
            'CROSS JOIN LATERAL page_header(get_raw_page(\'products\', f.blkno::int)) p',
            'CROSS JOIN pg_visibility_map_summary(\'products\') v',
            'ORDER BY f.blkno ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT f.blkno,',
            '       f.avail AS fsm_recorded_bytes,',
            '       (p.upper - p.lower) AS actual_page_free_bytes,',
            '       v.all_visible,',
            '       v.all_frozen',
            'FROM pg_freespace(\'products\') f',
            'CROSS JOIN LATERAL page_header(get_raw_page(\'products\', f.blkno::int)) p',
            'CROSS JOIN pg_visibility_map_summary(\'products\') v',
            'ORDER BY f.blkno ASC;'
          ].join('\n'),
          hints: [
            'Read `pg_freespace(\'products\') f` and pass `f.blkno::int` into `get_raw_page(\'products\', f.blkno::int)`.',
            'Compute `(p.upper - p.lower) AS actual_page_free_bytes` from `page_header(...)`.',
            'Cross-join `pg_visibility_map_summary(\'products\') v` and sort by `f.blkno ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_freespace\\s*\\(', flags: 'i', message: 'Query `pg_freespace(\'products\')` to inspect the `_fsm` fork.' },
              { pattern: '\\bpg_visibility_map_summary\\s*\\(', flags: 'i', message: 'Query `pg_visibility_map_summary(\'products\')` to inspect the `_vm` fork.' }
            ]
          },
          solutionExplanation: 'Before `VACUUM` runs on `products`, `fsm_recorded_bytes = 0` and `all_visible = 0` even though `p.upper - p.lower` exceeds `7500` free bytes—explaining why bulk-loaded OLTP tables should always receive `VACUUM ANALYZE` immediately after load to unlock Index-Only Scans!'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m08-t08 — Shared Buffer Pool (pg_buffercache) & WAL LSN Diffs
       ======================================================================== */
    {
      id: 'pg-m08-t08',
      slug: 'shared-buffers-pg-buffercache-wal-lsn',
      moduleId: 'pg-m08',
      title: 'Shared Buffer Pool Inspection (pg_buffercache) & WAL LSN Diffs',
      difficulty: 'Staff',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['pg_buffercache', 'usagecount', 'isdirty', 'pg_current_wal_lsn', 'pg_wal_lsn_diff'],
      tags: ['pg-buffercache', 'shared-buffers', 'wal', 'lsn', 'clock-sweep'],
      guide: {
        mentalModel: 'Every 8 KB heap or index page read or mutated by PostgreSQL flows through **`shared_buffers`**—an in-RAM array of buffer descriptors managed by a **clock-sweep eviction algorithm**—and every durability mutation appends redo records to the **Write-Ahead Log (`pg_wal`)** before dirty buffers ever reach disk:\n\n- **`pg_buffercache`**: Exposes one row per 8 KB slot in `shared_buffers`: `relfilenode` (join via `b.relfilenode = pg_relation_filenode(c.oid)` because `TRUNCATE`/`VACUUM FULL` changes `relfilenode` while keeping `c.oid`!), `relforknumber` (`0` = main heap/index, `1` = `_fsm`, `2` = `_vm`), `isdirty` (modified in RAM, awaiting checkpointer/bgwriter flush), and `usagecount` (`0..5`, incremented on buffer pin up to `BM_MAX_USAGE_COUNT = 5` and decremented as the clock hand sweeps).\n- **64-bit `pg_lsn` & `pg_wal_lsn_diff(lsn_new, lsn_old)`**: Every WAL byte has a monotonic Log Sequence Number formatted as `segment_high/byte_offset` (e.g., `0/1A4F098`). Subtracting two `pg_lsn` positions via `pg_wal_lsn_diff` (or `-` in modern PG) yields exact **bytes of WAL** generated by a DML batch or retained by a lagging replication slot.',
        syntaxAnatomy: [
          '-- 1. Buffer cache residency & dirty blocks for a table:',
          'SELECT c.relname, COUNT(*) AS cached_blocks,',
          '       COUNT(*) FILTER (WHERE b.isdirty) AS dirty_blocks,',
          '       MAX(b.usagecount) AS peak_clock_usage',
          'FROM pg_buffercache b',
          'JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)',
          'WHERE c.relname = \'api_audit_events\' AND b.relforknumber = 0',
          'GROUP BY c.relname;',
          '',
          '-- 2. Exact WAL byte delta:',
          'SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), \'0/1000000\'::pg_lsn) AS wal_bytes;'
        ].join('\n'),
        internalsAndGotchas: [
          'Join `pg_buffercache.relfilenode` to `pg_relation_filenode(c.oid)` (and filter `b.reldatabase IN (0, (SELECT oid FROM pg_database WHERE datname = current_database()))`), **not** `c.oid` directly—`c.oid` and `c.relfilenode` diverge after `TRUNCATE`, `REINDEX`, or `CLUSTER`!',
          'The first modification to an 8 KB page after a `CHECKPOINT` writes a **Full-Page Image (`FPI`)** (~8 KB compressed) into WAL to guard against torn 4 KB OS writes, making initial DML emit far more WAL bytes than subsequent updates to the same page.',
          '`pg_wal_lsn_diff(a, b)` computes `a - b` in bytes; passing `(older_lsn, newer_lsn)` returns a negative number!'
        ],
        whenToUse: 'Query `pg_buffercache` to verify working-set cache residency, hot `usagecount = 5` tables, and dirty-buffer pressure before checkpoints, and use `pg_wal_lsn_diff` to measure per-statement WAL amplification and replication-slot lag.'
      },
      scenario: {
        role: 'Principal Storage & Replication Architect',
        incidentOrGoal: 'Checkpoints spiked disk I/O during tenant sync bursts, and CDC engineers needed exact byte-level WAL measurements on DML workloads plus replication-slot retention audits.',
        stakeholderNeed: 'Inspect main-fork residency and clock-sweep `usagecount` in `pg_buffercache`, observe `isdirty` buffer transitions on live `UPDATE`s, and quantify live WAL bytes with `pg_current_wal_lsn()` and `pg_wal_lsn_diff()`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Auditing Shared Buffer Residency & Clock-Sweep usagecount',
          mission: 'After warming `api_audit_events` into RAM, query `pg_buffercache b JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)` filtered to the current database (`b.reldatabase = (SELECT oid FROM pg_database WHERE datname = current_database())`), `c.relname = \'api_audit_events\'`, and main fork `b.relforknumber = 0`. Group by `c.relname` and project 4 columns: `relname` (`c.relname`), `main_fork_buffers` (`COUNT(*)`), `is_resident` (`COUNT(*) > 0`), and `max_usagecount` (`MAX(b.usagecount)`).',
          setupSql: 'SELECT COUNT(*) FROM pg_ops.api_audit_events;',
          probeSql: '',
          starterCode: [
            'SELECT c.relname,',
            '       COUNT(*) AS main_fork_buffers,',
            '       (COUNT(*) > 0) AS is_resident',
            '       -- TODO: MAX(b.usagecount) AS max_usagecount',
            'FROM pg_buffercache b',
            'JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)',
            'WHERE b.reldatabase = (SELECT oid FROM pg_database WHERE datname = current_database())',
            '  AND c.relname = \'api_audit_events\'',
            '  AND b.relforknumber = 0',
            'GROUP BY c.relname;'
          ].join('\n'),
          solutionCode: [
            'SELECT c.relname,',
            '       COUNT(*) AS main_fork_buffers,',
            '       (COUNT(*) > 0) AS is_resident,',
            '       MAX(b.usagecount) AS max_usagecount',
            'FROM pg_buffercache b',
            'JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)',
            'WHERE b.reldatabase = (SELECT oid FROM pg_database WHERE datname = current_database())',
            '  AND c.relname = \'api_audit_events\'',
            '  AND b.relforknumber = 0',
            'GROUP BY c.relname;'
          ].join('\n'),
          hints: [
            'Join `pg_buffercache b` to `pg_class c` using `pg_relation_filenode(c.oid)` rather than `c.oid`.',
            'Filter `b.relforknumber = 0` so `_fsm` (`1`) and `_vm` (`2`) forks are excluded from main heap buffer counts.',
            'Add `MAX(b.usagecount) AS max_usagecount` as the 4th column.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            ignoreColumns: ['max_usagecount'],
            columnChecks: [
              { col: 'max_usagecount', notNull: true, minNumeric: 1, message: '`max_usagecount` must be >= 1 for a pinned/warmed buffer.' }
            ],
            requiredPatterns: [
              { pattern: '\\bpg_buffercache\\b', flags: 'i', message: 'Query `pg_buffercache` to inspect live RAM buffers.' },
              { pattern: '\\bpg_relation_filenode\\s*\\(', flags: 'i', message: 'Join via `pg_relation_filenode(c.oid)`.' },
              { pattern: '\\busagecount\\b', flags: 'i', message: 'Aggregate `MAX(b.usagecount)` to inspect clock-sweep heat.' }
            ]
          },
          solutionExplanation: 'Joining `pg_buffercache` via `pg_relation_filenode(c.oid)` on `relforknumber = 0` confirms `api_audit_events` occupies `1` main-fork 8 KB buffer in `shared_buffers` with a positive clock-sweep `usagecount`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Observing Dirty Buffers (isdirty = true) in RAM Before Flush',
          mission: 'Inside `BEGIN; ... COMMIT;`, update `ledger_accounts` (`SET balance_cents = balance_cents + 100 WHERE account_id = 501;`), then before `COMMIT;` query `pg_buffercache b JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)` for the current database, `c.relname = \'ledger_accounts\'`, and `b.relforknumber = 0`. Group by `c.relname` and return 4 columns: `relname`, `main_fork_buffers` (`COUNT(*)`), `dirty_buffers` (`COUNT(*) FILTER (WHERE b.isdirty)`), and `has_dirty_page` (`BOOL_OR(b.isdirty)`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'BEGIN;',
            '-- TODO: UPDATE ledger_accounts SET balance_cents = balance_cents + 100 WHERE account_id = 501;',
            'SELECT c.relname,',
            '       COUNT(*) AS main_fork_buffers,',
            '       COUNT(*) FILTER (WHERE b.isdirty) AS dirty_buffers,',
            '       BOOL_OR(b.isdirty) AS has_dirty_page',
            'FROM pg_buffercache b',
            'JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)',
            'WHERE b.reldatabase = (SELECT oid FROM pg_database WHERE datname = current_database())',
            '  AND c.relname = \'ledger_accounts\'',
            '  AND b.relforknumber = 0',
            'GROUP BY c.relname;',
            'COMMIT;'
          ].join('\n'),
          solutionCode: [
            'BEGIN;',
            'UPDATE ledger_accounts SET balance_cents = balance_cents + 100 WHERE account_id = 501;',
            'SELECT c.relname,',
            '       COUNT(*) AS main_fork_buffers,',
            '       COUNT(*) FILTER (WHERE b.isdirty) AS dirty_buffers,',
            '       BOOL_OR(b.isdirty) AS has_dirty_page',
            'FROM pg_buffercache b',
            'JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)',
            'WHERE b.reldatabase = (SELECT oid FROM pg_database WHERE datname = current_database())',
            '  AND c.relname = \'ledger_accounts\'',
            '  AND b.relforknumber = 0',
            'GROUP BY c.relname;',
            'COMMIT;'
          ].join('\n'),
          hints: [
            'Mutate `ledger_accounts` for `account_id = 501` right after `BEGIN;` so its 8 KB heap page in `shared_buffers` is marked `BM_DIRTY` (`isdirty = true`).',
            'Count dirty buffers using `COUNT(*) FILTER (WHERE b.isdirty) AS dirty_buffers` and `BOOL_OR(b.isdirty) AS has_dirty_page`.',
            'Finish with `COMMIT;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bUPDATE\\s+ledger_accounts\\b', flags: 'i', message: 'Mutate `ledger_accounts` to dirty its buffer in `shared_buffers`.' },
              { pattern: '\\bisdirty\\b', flags: 'i', message: 'Inspect `b.isdirty` in `pg_buffercache`.' }
            ]
          },
          solutionExplanation: 'Even before `COMMIT` (and long before the background checkpointer flushes data files to OS storage), mutating a tuple in `shared_buffers` immediately sets `BM_DIRTY` (`isdirty = true`) on block `0` of `ledger_accounts`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Measuring Exact DML WAL Bytes via pg_current_wal_lsn() & pg_wal_lsn_diff()',
          mission: 'Because PostgreSQL flushes WAL buffers (`pg_current_wal_lsn()`) at transaction commit, measure exact committed WAL bytes emitted by updating active `ledger_accounts`: (1) store the pre-tx LSN in session config via `SELECT set_config(\'app.lsn0\', pg_current_wal_lsn()::text, false);`, (2) execute `BEGIN; UPDATE ledger_accounts SET balance_cents = balance_cents + 500 WHERE status = \'active\'; COMMIT;`, and (3) `SELECT` 4 columns after `COMMIT;`: `lsn_before` (`current_setting(\'app.lsn0\')`), `lsn_after` (`pg_current_wal_lsn()::text`), `wal_bytes_emitted` (`pg_wal_lsn_diff(pg_current_wal_lsn(), current_setting(\'app.lsn0\')::pg_lsn)::bigint`), and `wal_advanced` (`pg_wal_lsn_diff(pg_current_wal_lsn(), current_setting(\'app.lsn0\')::pg_lsn) > 0`).',
          setupSql: '',
          probeSql: '',
          starterCode: [
            'SELECT set_config(\'app.lsn0\', pg_current_wal_lsn()::text, false);',
            'BEGIN;',
            '-- TODO: UPDATE ledger_accounts SET balance_cents = balance_cents + 500 WHERE status = \'active\';',
            'COMMIT;',
            'SELECT current_setting(\'app.lsn0\') AS lsn_before,',
            '       pg_current_wal_lsn()::text AS lsn_after,',
            '       -- TODO: pg_wal_lsn_diff(pg_current_wal_lsn(), current_setting(\'app.lsn0\')::pg_lsn)::bigint AS wal_bytes_emitted',
            '       (pg_wal_lsn_diff(pg_current_wal_lsn(), current_setting(\'app.lsn0\')::pg_lsn) > 0) AS wal_advanced;'
          ].join('\n'),
          solutionCode: [
            'SELECT set_config(\'app.lsn0\', pg_current_wal_lsn()::text, false);',
            'BEGIN;',
            'UPDATE ledger_accounts SET balance_cents = balance_cents + 500 WHERE status = \'active\';',
            'COMMIT;',
            'SELECT current_setting(\'app.lsn0\') AS lsn_before,',
            '       pg_current_wal_lsn()::text AS lsn_after,',
            '       pg_wal_lsn_diff(pg_current_wal_lsn(), current_setting(\'app.lsn0\')::pg_lsn)::bigint AS wal_bytes_emitted,',
            '       (pg_wal_lsn_diff(pg_current_wal_lsn(), current_setting(\'app.lsn0\')::pg_lsn) > 0) AS wal_advanced;'
          ].join('\n'),
          hints: [
            'Pass `false` as the 3rd argument to `set_config(\'app.lsn0\', pg_current_wal_lsn()::text, false)` so `app.lsn0` persists past `COMMIT;` while writing zero WAL.',
            'Run `BEGIN; UPDATE ledger_accounts SET balance_cents = balance_cents + 500 WHERE status = \'active\'; COMMIT;` so WAL buffers flush and advance `pg_current_wal_lsn()`.',
            'Compute `pg_wal_lsn_diff(pg_current_wal_lsn(), current_setting(\'app.lsn0\')::pg_lsn)::bigint AS wal_bytes_emitted` and `( ... > 0) AS wal_advanced` after `COMMIT;`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            ignoreColumns: ['lsn_before', 'lsn_after', 'wal_bytes_emitted'],
            columnChecks: [
              { col: 'lsn_before', notNull: true, regex: '^[0-9A-F]+/[0-9A-F]+$', message: '`lsn_before` must be a valid `pg_lsn` string.' },
              { col: 'lsn_after', notNull: true, regex: '^[0-9A-F]+/[0-9A-F]+$', message: '`lsn_after` must be a valid `pg_lsn` string.' },
              { col: 'wal_bytes_emitted', notNull: true, minNumeric: 64, message: '`wal_bytes_emitted` must reflect positive WAL redo generation (>= 64 bytes).' }
            ],
            requiredPatterns: [
              { pattern: '\\bpg_current_wal_lsn\\s*\\(', flags: 'i', message: 'Capture live WAL positions with `pg_current_wal_lsn()`.' },
              { pattern: '\\bpg_wal_lsn_diff\\s*\\(', flags: 'i', message: 'Compute exact WAL byte deltas with `pg_wal_lsn_diff(new_lsn, old_lsn)`.' }
            ]
          },
          solutionExplanation: 'Because uncommitted WAL records sit in `wal_buffers` (`pg_current_wal_insert_lsn()`) until `XLogFlush` runs on `COMMIT`, reading `pg_current_wal_lsn()` immediately after `COMMIT` captures both the heap `UPDATE` redo records and the transaction commit record in exact bytes via `pg_wal_lsn_diff`.'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
