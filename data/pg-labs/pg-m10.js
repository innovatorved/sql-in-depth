/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 10 (`pg-m10`): Real-Life Production PostgreSQL Troubleshooting Clinics
 * 8 SEV-1 Incident Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m10'] = [
    /* ========================================================================
       LAB 01: pg-m10-t01 — Clinic 01: Checkout Outage — Root-Blocker Lock Convoy Triage
       ======================================================================== */
    {
      id: 'pg-m10-t01',
      slug: 'clinic-lock-convoy-blocker-tree',
      moduleId: 'pg-m10',
      title: 'Clinic 01 — Checkout Outage: Root-Blocker Lock Convoy Triage',
      difficulty: 'Staff',
      estimatedMinutes: 20,
      datasetId: 'pg_ops_telemetry',
      clauses: ['WITH RECURSIVE', 'cluster_locks', 'cluster_stat_activity', 'AccessExclusiveLock'],
      tags: ['troubleshooting', 'locks', 'lock-convoy', 'ddl', 'incident-response'],
      guide: {
        mentalModel: 'PostgreSQL\'s heavy-weight lock manager enforces **strict FIFO fairness** inside each relation\'s wait queue (`PROCLOCK`). Normally, `SELECT` (`AccessShareLock`) and `INSERT`/`UPDATE` (`RowExclusiveLock`) never block one another. A **lock convoy** erupts the instant a migration backend (`ALTER TABLE`) requests `AccessExclusiveLock` behind a long-running reader or an `idle in transaction` writer: because `AccessExclusiveLock` conflicts with *every* lock mode, PostgreSQL queues all subsequent `AccessShareLock` and `RowExclusiveLock` OLTP requests *behind* the waiting `ALTER TABLE`.\n\nDuring a SEV-1 outage, killing victim `SELECT` backends achieves nothing, and naively assuming the `ALTER TABLE` is the root cause misses why it stalled. Staff DBREs walk the directed lock dependency graph (`WITH RECURSIVE`) from true root blockers—sessions holding `granted = true` locks with zero ungranted waits—through middle DDL waiters down to leaf OLTP victims.',
        syntaxAnatomy: [
          'WITH RECURSIVE lock_tree AS (',
          '  SELECT DISTINCT l.blocking_pid AS root_pid, l.pid AS victim_pid, 1 AS chain_depth',
          '  FROM cluster_locks l',
          '  WHERE NOT l.granted',
          '    AND NOT EXISTS (SELECT 1 FROM cluster_locks w WHERE w.pid = l.blocking_pid AND NOT w.granted)',
          '  UNION ALL',
          '  SELECT t.root_pid, c.pid AS victim_pid, t.chain_depth + 1',
          '  FROM lock_tree t',
          '  JOIN cluster_locks c ON c.blocking_pid = t.victim_pid AND NOT c.granted',
          '  WHERE t.chain_depth < 10',
          ')',
          'SELECT root_pid, COUNT(DISTINCT victim_pid) AS victim_count, MAX(chain_depth) AS max_depth',
          'FROM lock_tree GROUP BY root_pid;'
        ].join('\n'),
        internalsAndGotchas: [
          'An ungranted `AccessExclusiveLock` (`granted = false`) blocks incoming `AccessShareLock` readers even though the DDL statement has not started executing.',
          'A single queued DDL backend can depend on *multiple* upstream holders simultaneously (e.g., an `idle in transaction` writer AND a slow BI `SELECT`), creating multiple root-to-victim paths in `cluster_locks`—always use `COUNT(DISTINCT victim_pid)`.',
          'Every migration tool (`Flyway`, `Liquibase`, `Alembic`) must set `SET LOCAL lock_timeout = \'2s\'` so `ALTER TABLE` aborts fast instead of forming a multi-minute checkout convoy.',
          'Killing the queued `ALTER TABLE` (`pg_cancel_backend`) drains the reader convoy immediately without aborting upstream transactions, whereas `pg_terminate_backend` is required for abandoned `idle in transaction` blockers.'
        ],
        whenToUse: 'Run lock-convoy blocker-tree queries immediately whenever OLTP latency spikes vertically alongside `wait_event_type = \'Lock\'` and `wait_event = \'relation\'` during a schema deployment.'
      },
      scenario: {
        role: 'On-Call Staff DBRE — Payments & Checkout',
        incidentOrGoal: 'PagerDuty SEV-1 at 14:27 UTC: checkout API pods timed out seconds after `flyway-migrator` began `ALTER TABLE orders ADD COLUMN risk_score`.',
        stakeholderNeed: 'Inspect lock modes on `orders`, map immediate waiter-to-blocker edges, and run a `WITH RECURSIVE` blocker tree to separate true root blockers from the middle DDL waiter.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Inspect Granted vs Waiting Locks on orders',
          mission: 'Join `cluster_locks l` to `cluster_stat_activity a` on `pid` for `l.relation_name = \'orders\'`. Project 7 columns in exact order: `lock_id`, `pid` (`l.pid`), `application_name`, `locktype`, `mode`, `granted`, and `blocking_pid`. Sort by `granted ASC, lock_id ASC` so waiting locks surface first.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Surface waiting (granted = false) vs held locks on relation \'orders\'',
            'SELECT l.lock_id,',
            '       l.pid,',
            '       a.application_name',
            '       -- TODO: project locktype, mode, granted, blocking_pid',
            'FROM cluster_locks l',
            'JOIN cluster_stat_activity a ON a.pid = l.pid',
            '-- TODO: filter relation_name = \'orders\' and sort by granted ASC, lock_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT l.lock_id,',
            '       l.pid,',
            '       a.application_name,',
            '       l.locktype,',
            '       l.mode,',
            '       l.granted,',
            '       l.blocking_pid',
            'FROM cluster_locks l',
            'JOIN cluster_stat_activity a ON a.pid = l.pid',
            'WHERE l.relation_name = \'orders\'',
            'ORDER BY l.granted ASC, l.lock_id ASC;'
          ].join('\n'),
          hints: [
            'Filter `WHERE l.relation_name = \'orders\'` after joining `cluster_stat_activity a ON a.pid = l.pid`.',
            'In PostgreSQL, `BOOLEAN` sorts `false` before `true` under `ASC`, so `ORDER BY l.granted ASC, l.lock_id ASC` puts ungranted waiters at the top.',
            'Project `l.lock_id, l.pid, a.application_name, l.locktype, l.mode, l.granted, l.blocking_pid`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bcluster_locks\\b', flags: 'i', message: 'Query `cluster_locks` joined with `cluster_stat_activity`.' },
              { pattern: '\\bORDER\\s+BY\\s+.*granted\\s+ASC', flags: 'i', message: 'Sort waiting locks first with `ORDER BY l.granted ASC, l.lock_id ASC`.' }
            ]
          },
          solutionExplanation: 'Ordering by `granted ASC` immediately reveals the two-stage convoy on `orders`: PID `4104` (`flyway-migrator`) is waiting for `AccessExclusiveLock` behind PIDs `4101` and `4102`, while checkout pods `4105`–`4107` are queued behind `4104`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Pair Blocked Waiters with Immediate Blockers',
          mission: 'Across all relations in `cluster_locks l` where `NOT l.granted`, join `cluster_stat_activity w` (`w.pid = l.pid`) and `cluster_stat_activity b` (`b.pid = l.blocking_pid`). Project 8 columns in exact order: `lock_id`, `relation_name`, `blocked_pid` (`w.pid`), `blocked_app` (`w.application_name`), `requested_mode` (`l.mode`), `blocker_pid` (`b.pid`), `blocker_app` (`b.application_name`), and `blocker_state` (`b.state`). Sort by `l.wait_start ASC, l.lock_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Map every ungranted lock request to both the waiting session and immediate blocker',
            'SELECT l.lock_id,',
            '       l.relation_name,',
            '       w.pid AS blocked_pid',
            '       -- TODO: add blocked_app, requested_mode, blocker_pid, blocker_app, blocker_state',
            'FROM cluster_locks l',
            'JOIN cluster_stat_activity w ON w.pid = l.pid',
            '-- TODO: join cluster_stat_activity b for blocking_pid, filter NOT l.granted, sort by wait_start ASC, lock_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT l.lock_id,',
            '       l.relation_name,',
            '       w.pid AS blocked_pid,',
            '       w.application_name AS blocked_app,',
            '       l.mode AS requested_mode,',
            '       b.pid AS blocker_pid,',
            '       b.application_name AS blocker_app,',
            '       b.state AS blocker_state',
            'FROM cluster_locks l',
            'JOIN cluster_stat_activity w ON w.pid = l.pid',
            'JOIN cluster_stat_activity b ON b.pid = l.blocking_pid',
            'WHERE NOT l.granted',
            'ORDER BY l.wait_start ASC, l.lock_id ASC;'
          ].join('\n'),
          hints: [
            'Join `cluster_stat_activity` twice: once as `w ON w.pid = l.pid` (the waiter) and once as `b ON b.pid = l.blocking_pid` (the immediate holder/waiter ahead of it).',
            'Filter `WHERE NOT l.granted` so only blocked lock requests appear.',
            'Alias every column to match `blocked_pid`, `blocked_app`, `requested_mode`, `blocker_pid`, `blocker_app`, and `blocker_state`, sorted by `l.wait_start ASC, l.lock_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bNOT\\s+l\\.granted\\b|l\\.granted\\s*=\\s*false', flags: 'i', message: 'Filter ungranted lock rows using `NOT l.granted`.' },
              { pattern: '\\bAS\\s+blocker_state\\b', flags: 'i', message: 'Project the blocker session state as `AS blocker_state`.' }
            ]
          },
          solutionExplanation: 'Joining `cluster_stat_activity` on both ends of `cluster_locks` exposes two distinct incidents simultaneously: the `orders` DDL lock convoy (`4101`/`4102` -> `4104` -> `4105..4107`) and a direct tuple lock wait on `ledger_accounts` (`4108` -> `4109`).'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — WITH RECURSIVE Root-Blocker Victim Tree',
          mission: 'Write a `WITH RECURSIVE` query over `cluster_locks` starting from true root blockers—`l.blocking_pid` values on ungranted locks (`NOT l.granted`) that have NO ungranted lock of their own (`NOT EXISTS (SELECT 1 FROM cluster_locks w WHERE w.pid = l.blocking_pid AND NOT w.granted)`), starting at `chain_depth = 1`—and recursively walking downstream ungranted locks (`c.blocking_pid = t.victim_pid AND NOT c.granted`, capped at `chain_depth < 10`). Join `cluster_stat_activity r` on `r.pid = root_pid` and project 5 columns in exact order: `root_pid`, `root_app` (`r.application_name`), `root_state` (`r.state`), `victim_count` (`COUNT(DISTINCT victim_pid)`), and `max_depth` (`MAX(chain_depth)`). Sort by `victim_count DESC, root_pid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Walk from true root blockers down every multi-hop lock chain with WITH RECURSIVE lock_tree',
            'SELECT DISTINCT l.blocking_pid AS root_pid,',
            '       l.pid AS victim_pid',
            'FROM cluster_locks l',
            'WHERE NOT l.granted',
            'ORDER BY l.blocking_pid ASC, l.pid ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH RECURSIVE lock_tree AS (',
            '  SELECT DISTINCT l.blocking_pid AS root_pid,',
            '         l.pid AS victim_pid,',
            '         1 AS chain_depth',
            '  FROM cluster_locks l',
            '  WHERE NOT l.granted',
            '    AND NOT EXISTS (',
            '      SELECT 1 FROM cluster_locks w',
            '      WHERE w.pid = l.blocking_pid AND NOT w.granted',
            '    )',
            '  UNION ALL',
            '  SELECT t.root_pid,',
            '         c.pid AS victim_pid,',
            '         t.chain_depth + 1 AS chain_depth',
            '  FROM lock_tree t',
            '  JOIN cluster_locks c ON c.blocking_pid = t.victim_pid AND NOT c.granted',
            '  WHERE t.chain_depth < 10',
            ')',
            'SELECT r.pid AS root_pid,',
            '       r.application_name AS root_app,',
            '       r.state AS root_state,',
            '       COUNT(DISTINCT t.victim_pid) AS victim_count,',
            '       MAX(t.chain_depth) AS max_depth',
            'FROM lock_tree t',
            'JOIN cluster_stat_activity r ON r.pid = t.root_pid',
            'GROUP BY r.pid, r.application_name, r.state',
            'ORDER BY victim_count DESC, root_pid ASC;'
          ].join('\n'),
          hints: [
            'In the anchor term, filter `NOT l.granted` AND `NOT EXISTS (SELECT 1 FROM cluster_locks w WHERE w.pid = l.blocking_pid AND NOT w.granted)` so `4104` (a middle waiter) is not misclassified as a root.',
            'In the recursive term, join `cluster_locks c ON c.blocking_pid = t.victim_pid AND NOT c.granted` with `WHERE t.chain_depth < 10`.',
            'Aggregate by `r.pid, r.application_name, r.state` using `COUNT(DISTINCT t.victim_pid) AS victim_count` and `MAX(t.chain_depth) AS max_depth`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bWITH\\s+RECURSIVE\\b', flags: 'i', message: 'Use `WITH RECURSIVE` to traverse multi-hop lock dependency chains.' },
              { pattern: '\\bCOUNT\\s*\\(\\s*DISTINCT\\b', flags: 'i', message: 'Use `COUNT(DISTINCT ...)` to avoid double-counting victims across diamond lock paths.' }
            ]
          },
          solutionExplanation: 'The recursive traversal proves `4104` (`flyway-migrator`) is a depth-1 middle waiter, while PIDs `4101` (`checkout-worker-07`, `idle in transaction`) and `4102` (`metabase-bi`, `active`) are the true roots stalling 4 downstream sessions (`max_depth = 2`), alongside PID `4108` stalling 1 payout worker.'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m10-t02 — Clinic 02: Connection Pool Exhausted — Zombie idle in transaction Hunt
       ======================================================================== */
    {
      id: 'pg-m10-t02',
      slug: 'clinic-idle-in-transaction-pool-exhaustion',
      moduleId: 'pg-m10',
      title: 'Clinic 02 — Connection Pool Exhausted: Zombie idle in transaction Hunt',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['cluster_stat_activity', 'idle in transaction', 'backend_xmin', 'EXTRACT(EPOCH ...)'],
      tags: ['troubleshooting', 'idle-in-transaction', 'pgbouncer', 'xmin', 'incident-response'],
      guide: {
        mentalModel: 'A session in `state = \'idle in transaction\'` (`wait_event = \'ClientRead\'`) means an application worker sent `BEGIN`, ran at least one SQL statement, and then paused on the client side (an unawaited HTTP call, leaked ORM unit-of-work, or uncaught exception) without issuing `COMMIT` or `ROLLBACK`. Unlike harmless `idle` connections, an `idle in transaction` backend:\n1. **Pins a server connection** inside `PgBouncer` even under `pool_mode = transaction`, starving healthy pods until `max_connections` saturates.\n2. **Retains every row and relation lock** acquired since `xact_start`.\n3. **Freezes the cluster `backend_xmin` visibility horizon** if a snapshot remains open, preventing `VACUUM` from reclaiming dead tuples across *every* table in the database.',
        syntaxAnatomy: [
          'SELECT pid, usename, application_name, backend_xmin,',
          '       EXTRACT(EPOCH FROM (TIMESTAMPTZ \'2025-03-15 14:30:00+00\' - xact_start))::bigint AS xact_open_sec,',
          '       EXTRACT(EPOCH FROM (TIMESTAMPTZ \'2025-03-15 14:30:00+00\' - state_change))::bigint AS idle_in_xact_sec',
          'FROM cluster_stat_activity',
          'WHERE state = \'idle in transaction\'',
          'ORDER BY xact_open_sec DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          '`query_start` and `query` on an `idle in transaction` row show the *last* statement the client finished before stalling on `ClientRead`, NOT a currently executing query.',
          '`pg_cancel_backend(pid)` (`SIGINT`) does **nothing** to an `idle in transaction` backend because no query is running; you must call `pg_terminate_backend(pid)` (`SIGTERM`) so PostgreSQL rolls back the abandoned transaction.',
          'Always enforce `idle_in_transaction_session_timeout = \'30s\'` (or role-scoped `ALTER ROLE checkout_app SET idle_in_transaction_session_timeout = \'15s\'`) so PostgreSQL self-heals leaked transactions before pools exhaust.'
        ],
        whenToUse: 'Use this triage sequence when `PgBouncer` `cl_waiting` climbs, application pods log `FATAL: remaining connection slots are reserved`, or tuple lock waits point to sleeping `ClientRead` backends.'
      },
      scenario: {
        role: 'Production Database Reliability Engineer',
        incidentOrGoal: 'At snapshot time `2025-03-15 14:30:00+00`, `PgBouncer` transaction pools reported pinned server connections and blocked `FOR UPDATE` / `UPDATE` workers.',
        stakeholderNeed: 'Audit connection state distribution, measure open transaction vs client-idle durations for `idle in transaction` zombies, and prioritize `pg_terminate_backend` targets by held locks and `backend_xmin` age.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Connection Breakdown by Role, Application & State',
          mission: 'Aggregate `cluster_stat_activity` by `usename`, `application_name`, and `state`. Project 5 columns in exact order: `usename`, `application_name`, `state`, `session_count` (`COUNT(*)`), and `waiting_on_lock` (`COUNT(*) FILTER (WHERE wait_event_type = \'Lock\')`). Sort by `state ASC, application_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Summarize active, idle, and idle-in-transaction sessions across applications',
            'SELECT usename,',
            '       application_name,',
            '       state',
            '       -- TODO: add COUNT(*) AS session_count and FILTER count AS waiting_on_lock',
            'FROM cluster_stat_activity',
            '-- TODO: GROUP BY and ORDER BY state ASC, application_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT usename,',
            '       application_name,',
            '       state,',
            '       COUNT(*) AS session_count,',
            '       COUNT(*) FILTER (WHERE wait_event_type = \'Lock\') AS waiting_on_lock',
            'FROM cluster_stat_activity',
            'GROUP BY usename, application_name, state',
            'ORDER BY state ASC, application_name ASC;'
          ].join('\n'),
          hints: [
            'Group by `usename, application_name, state`.',
            'Use `COUNT(*) FILTER (WHERE wait_event_type = \'Lock\') AS waiting_on_lock` to separate lock-stalled active backends from CPU/IO active backends.',
            'Sort deterministically with `ORDER BY state ASC, application_name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bFILTER\\s*\\(\\s*WHERE\\b', flags: 'i', message: 'Use `COUNT(*) FILTER (WHERE wait_event_type = \'Lock\')`.' },
              { pattern: '\\bGROUP\\s+BY\\b', flags: 'i', message: 'Aggregate `cluster_stat_activity` with `GROUP BY`.' }
            ]
          },
          solutionExplanation: 'Breaking down `state` alongside `wait_event_type = \'Lock\'` distinguishes benign `idle` pool connections from the 5 `Lock`-stalled active workers and the 2 leaked `idle in transaction` sessions (`checkout-worker-07` and `invoice-cron`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Measure Open Transaction & Idle-Client Duration',
          mission: 'Filter `cluster_stat_activity` to `state = \'idle in transaction\'` using snapshot reference timestamp `TIMESTAMPTZ \'2025-03-15 14:30:00+00\'`. Project 7 columns in exact order: `pid`, `usename`, `application_name`, `wait_event`, `xact_open_sec` (whole seconds since `xact_start` via `EXTRACT(EPOCH FROM ...)::bigint`), `idle_in_xact_sec` (whole seconds since `state_change` via `EXTRACT(EPOCH FROM ...)::bigint`), and `last_sql` (`query`). Sort by `xact_open_sec DESC, pid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Compute xact_open_sec, idle_in_xact_sec relative to 2025-03-15 14:30:00+00, and query AS last_sql',
            'SELECT pid,',
            '       usename,',
            '       application_name,',
            '       wait_event',
            'FROM cluster_stat_activity',
            'WHERE state = \'idle in transaction\'',
            'ORDER BY pid ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT pid,',
            '       usename,',
            '       application_name,',
            '       wait_event,',
            '       EXTRACT(EPOCH FROM (TIMESTAMPTZ \'2025-03-15 14:30:00+00\' - xact_start))::bigint AS xact_open_sec,',
            '       EXTRACT(EPOCH FROM (TIMESTAMPTZ \'2025-03-15 14:30:00+00\' - state_change))::bigint AS idle_in_xact_sec,',
            '       query AS last_sql',
            'FROM cluster_stat_activity',
            'WHERE state = \'idle in transaction\'',
            'ORDER BY xact_open_sec DESC, pid ASC;'
          ].join('\n'),
          hints: [
            'Subtract `xact_start` (and `state_change`) from `TIMESTAMPTZ \'2025-03-15 14:30:00+00\'` inside `EXTRACT(EPOCH FROM (...))::bigint`.',
            'Project `query AS last_sql` as the 7th column.',
            'Filter `WHERE state = \'idle in transaction\'` and order by `xact_open_sec DESC, pid ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bEXTRACT\\s*\\(\\s*EPOCH\\s+FROM\\b', flags: 'i', message: 'Use `EXTRACT(EPOCH FROM ...)` to compute exact elapsed seconds.' },
              { pattern: 'idle in transaction', flags: 'i', message: 'Filter `state = \'idle in transaction\'`.' }
            ]
          },
          solutionExplanation: 'PID `4101` (`checkout-worker-07`) has held an `UPDATE orders` transaction open for `1110` seconds (`18.5` minutes) sitting on `ClientRead`, while PID `4108` (`invoice-cron`) has held a `SELECT ... FOR UPDATE` lock on `ledger_accounts` for `660` seconds.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Rank Zombie Sessions by Held Locks, xmin Horizon & Kill Action',
          mission: 'For every `state = \'idle in transaction\'` session in `cluster_stat_activity a`, count its granted locks in `cluster_locks` (`granted_lock_count`) and direct blocked waiters (`direct_waiters`, rows in `cluster_locks w` where `w.blocking_pid = a.pid AND NOT w.granted`). Project 7 columns in exact order: `pid`, `application_name`, `backend_xmin`, `granted_lock_count`, `direct_waiters`, `xact_open_sec` (against `TIMESTAMPTZ \'2025-03-15 14:30:00+00\'` cast to `bigint`), and `remediation` (`\'TERMINATE_IMMEDIATELY\'` when `backend_xmin <= 842100` or `xact_open_sec >= 900`, otherwise `\'TERMINATE_AFTER_ALERT\'`). Sort by `backend_xmin ASC, pid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Correlate zombie sessions with held locks, direct waiters, and xmin horizon pinning',
            'SELECT a.pid,',
            '       a.application_name,',
            '       a.backend_xmin',
            '       -- TODO: add granted_lock_count, direct_waiters, xact_open_sec, and CASE remediation',
            'FROM cluster_stat_activity a',
            'WHERE a.state = \'idle in transaction\'',
            'ORDER BY a.backend_xmin ASC, a.pid ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT a.pid,',
            '       a.application_name,',
            '       a.backend_xmin,',
            '       (SELECT COUNT(*) FROM cluster_locks g WHERE g.pid = a.pid AND g.granted) AS granted_lock_count,',
            '       (SELECT COUNT(*) FROM cluster_locks w WHERE w.blocking_pid = a.pid AND NOT w.granted) AS direct_waiters,',
            '       EXTRACT(EPOCH FROM (TIMESTAMPTZ \'2025-03-15 14:30:00+00\' - a.xact_start))::bigint AS xact_open_sec,',
            '       CASE',
            '         WHEN a.backend_xmin <= 842100',
            '           OR EXTRACT(EPOCH FROM (TIMESTAMPTZ \'2025-03-15 14:30:00+00\' - a.xact_start)) >= 900',
            '         THEN \'TERMINATE_IMMEDIATELY\'',
            '         ELSE \'TERMINATE_AFTER_ALERT\'',
            '       END AS remediation',
            'FROM cluster_stat_activity a',
            'WHERE a.state = \'idle in transaction\'',
            'ORDER BY a.backend_xmin ASC, a.pid ASC;'
          ].join('\n'),
          hints: [
            'Use scalar subqueries (rather than joining both `g` and `w` simultaneously, which would cross-multiply counts!) to compute `granted_lock_count` and `direct_waiters`.',
            'Compute `EXTRACT(EPOCH FROM (TIMESTAMPTZ \'2025-03-15 14:30:00+00\' - a.xact_start))::bigint AS xact_open_sec`.',
            'Use a `CASE` expression returning `\'TERMINATE_IMMEDIATELY\'` vs `\'TERMINATE_AFTER_ALERT\'` and sort by `a.backend_xmin ASC, a.pid ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bbackend_xmin\\b', flags: 'i', message: 'Inspect `backend_xmin` to identify which zombie pins the oldest MVCC horizon.' },
              { pattern: 'TERMINATE_IMMEDIATELY', flags: 'i', message: 'Classify critical zombies with `\'TERMINATE_IMMEDIATELY\'`.' }
            ]
          },
          solutionExplanation: 'PID `4101` holds 2 granted locks, blocks `flyway-migrator` directly, and pins the cluster\'s oldest `backend_xmin` (`842095`—matching the wraparound autovacuum worker\'s horizon!), making `SELECT pg_terminate_backend(4101)` the top surgical action.'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m10-t03 — Clinic 03: 99% Primary CPU — Query Workload Triage
       ======================================================================== */
    {
      id: 'pg-m10-t03',
      slug: 'clinic-cpu-saturation-stat-statements',
      moduleId: 'pg-m10',
      title: 'Clinic 03 — 99% Primary CPU: Query Workload Triage in stat_statements',
      difficulty: 'Staff',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['cluster_stat_statements', 'total_exec_time_ms', 'shared_blks_read', 'SUM() OVER ()'],
      tags: ['troubleshooting', 'pg-stat-statements', 'cpu-saturation', 'slow-queries', 'incident-response'],
      guide: {
        mentalModel: '`pg_stat_statements` normalizes SQL literals into `$1, $2` bind placeholders and hashes each parse tree into a 64-bit `queryid`, accumulating execution time, row counts, buffer hits/reads, temp spills, and WAL bytes across millions of executions.\n\nWhen primary CPU hits 99%, sorting blindly by `mean_exec_time_ms` is a classic junior mistake: a `6000 ms` nightly `MERGE` run 85 times burns `510 s` total, whereas an `8.5 ms` queue poll run `640,000` times burns `5,440 s`, and a non-sargable `LOWER(customer_email)` lookup (`185 ms` × `48,000` calls) burns `8,880 s` (`29%` of the entire cluster!). Always rank by **percentage of total cluster execution time** (`SUM(total_exec_time_ms) OVER ()`) first, then separate CPU/buffer-churn loops from physical-read sequential scans.',
        syntaxAnatomy: [
          'SELECT queryid, rolname, calls, total_exec_time_ms, mean_exec_time_ms,',
          '       ROUND(100.0 * total_exec_time_ms / SUM(total_exec_time_ms) OVER (), 2) AS pct_cluster_time,',
          '       ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_pct',
          'FROM cluster_stat_statements',
          'ORDER BY total_exec_time_ms DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          'A query with `99.9%` `cache_hit_pct` can still melt 64 vCPUs via buffer pin/spinlock churn if it scans thousands of in-memory heap pages per call (`shared_blks_hit / calls`).',
          'Always wrap denominators in `NULLIF(..., 0)` when computing `cache_hit_pct` or per-call ratios because DDL/utility statements in `pg_stat_statements` can record `0` shared block accesses.',
          'Non-sargable predicates like `WHERE LOWER(customer_email) = LOWER($1)` defeat plain `(customer_email)` B-Tree indexes, triggering millions of `shared_blks_read` pages until an expression index on `(LOWER(customer_email))` is built `CONCURRENTLY`.'
        ],
        whenToUse: 'Query `pg_stat_statements` (`cluster_stat_statements`) first during any primary CPU saturation, read-IOPS storm, or sudden throughput regression to isolate the top 3 `queryid` fingerprints responsible for >70% of DB time.'
      },
      scenario: {
        role: 'Staff Performance & Reliability Engineer',
        incidentOrGoal: 'Primary host `pg-prim-01` sustained `97.5%` CPU at 14:20 UTC, degrading p99 checkout latency across all tenants.',
        stakeholderNeed: 'Attribute cluster execution time share across normalized `queryid`s, audit buffer cache efficiency vs physical read amplification, and classify each offender into an actionable mitigation bucket.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Attribute % of Total Cluster Execution Time',
          mission: 'Query `cluster_stat_statements` and project 6 columns in exact order: `queryid`, `rolname`, `calls`, `total_exec_time_ms`, `mean_exec_time_ms`, and `pct_cluster_time` — each query\'s percentage share (`0`–`100`) of total `total_exec_time_ms` across all rows using `SUM(total_exec_time_ms) OVER ()`, rounded to 2 decimal places. Sort by `total_exec_time_ms DESC, queryid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Rank normalized query fingerprints by share of total cluster execution time',
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       total_exec_time_ms,',
            '       mean_exec_time_ms',
            '       -- TODO: compute ROUND(100.0 * total_exec_time_ms / SUM(total_exec_time_ms) OVER (), 2) AS pct_cluster_time',
            'FROM cluster_stat_statements',
            'ORDER BY total_exec_time_ms DESC, queryid ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       total_exec_time_ms,',
            '       mean_exec_time_ms,',
            '       ROUND(100.0 * total_exec_time_ms / SUM(total_exec_time_ms) OVER (), 2) AS pct_cluster_time',
            'FROM cluster_stat_statements',
            'ORDER BY total_exec_time_ms DESC, queryid ASC;'
          ].join('\n'),
          hints: [
            'Use an empty window `SUM(total_exec_time_ms) OVER ()` as the grand-total denominator without collapsing rows.',
            'Multiply by `100.0` and wrap in `ROUND(..., 2) AS pct_cluster_time`.',
            'Sort by `total_exec_time_ms DESC, queryid ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bSUM\\s*\\(\\s*total_exec_time_ms\\s*\\)\\s*OVER\\s*\\(\\s*\\)', flags: 'i', message: 'Compute grand-total DB time using `SUM(total_exec_time_ms) OVER ()`.' },
              { pattern: '\\bAS\\s+pct_cluster_time\\b', flags: 'i', message: 'Alias the 6th column `AS pct_cluster_time`.' }
            ]
          },
          solutionExplanation: 'Just three queries account for over `61%` of total cluster execution time: `900102` (`29.12%`, `LOWER(customer_email)` scan), `900107` (`17.84%`, `FOR UPDATE` queue poll without `SKIP LOCKED`), and `900103` (`14.64%`, analytics `PERCENTILE_CONT` scan).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Buffer Cache Hit Ratio & Physical Read Amplification per Call',
          mission: 'Query `cluster_stat_statements` and project 6 columns in exact order: `queryid`, `rolname`, `calls`, `shared_blks_read`, `cache_hit_pct` (`100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0)` rounded to 2 decimal places), and `blks_read_per_call` (`shared_blks_read::numeric / NULLIF(calls, 0)` rounded to 2 decimal places). Sort by `shared_blks_read DESC, queryid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Separate in-memory CPU churn from physical 8 KB block read storms',
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       shared_blks_read',
            '       -- TODO: add cache_hit_pct and blks_read_per_call rounded to 2 decimals',
            'FROM cluster_stat_statements',
            'ORDER BY shared_blks_read DESC, queryid ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       shared_blks_read,',
            '       ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS cache_hit_pct,',
            '       ROUND(shared_blks_read::numeric / NULLIF(calls, 0), 2) AS blks_read_per_call',
            'FROM cluster_stat_statements',
            'ORDER BY shared_blks_read DESC, queryid ASC;'
          ].join('\n'),
          hints: [
            'Guard both denominators with `NULLIF(..., 0)` so zero-block or zero-call rows never raise division-by-zero.',
            'Cast `shared_blks_read::numeric` before dividing by `NULLIF(calls, 0)` so integer division does not truncate fractional per-call reads.',
            'Round both ratios with `ROUND(..., 2)` and sort by `shared_blks_read DESC, queryid ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bNULLIF\\s*\\(', flags: 'i', message: 'Protect denominators with `NULLIF(..., 0)`.' },
              { pattern: '\\bAS\\s+blks_read_per_call\\b', flags: 'i', message: 'Alias per-call physical reads `AS blks_read_per_call`.' }
            ]
          },
          solutionExplanation: 'Query `900102` has a dismal `29.09%` cache hit ratio and reads `97.50` uncached 8 KB blocks (`780 KB`) per call because `LOWER(customer_email)` forces a scan on `orders`—explaining why the previous on-call engineer attempted (and failed) `idx_orders_email_lower_ccnew`!'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Classify Workload Offenders for Surgical Mitigation',
          mission: 'Query `cluster_stat_statements` and project 6 columns in exact order: `queryid`, `rolname`, `calls`, `mean_exec_time_ms`, `workload_profile`, and `short_sql` (`LEFT(query_text, 64)`). Evaluate `workload_profile` in exact `CASE` priority: `\'SINGLE_SLOW_CALL\'` when `mean_exec_time_ms >= 1000`, `\'IO_BOUND_SCAN\'` when `(shared_blks_read::numeric / NULLIF(calls, 0)) >= 50`, `\'HIGH_FREQ_CPU\'` when `calls >= 500000`, else `\'HEALTHY\'`. Sort by `total_exec_time_ms DESC, queryid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Tag every top query with its bottleneck archetype for immediate triage',
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       mean_exec_time_ms',
            '       -- TODO: add CASE workload_profile and LEFT(query_text, 64) AS short_sql',
            'FROM cluster_stat_statements',
            'ORDER BY total_exec_time_ms DESC, queryid ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       mean_exec_time_ms,',
            '       CASE',
            '         WHEN mean_exec_time_ms >= 1000 THEN \'SINGLE_SLOW_CALL\'',
            '         WHEN (shared_blks_read::numeric / NULLIF(calls, 0)) >= 50 THEN \'IO_BOUND_SCAN\'',
            '         WHEN calls >= 500000 THEN \'HIGH_FREQ_CPU\'',
            '         ELSE \'HEALTHY\'',
            '       END AS workload_profile,',
            '       LEFT(query_text, 64) AS short_sql',
            'FROM cluster_stat_statements',
            'ORDER BY total_exec_time_ms DESC, queryid ASC;'
          ].join('\n'),
          hints: [
            'Order your `WHEN` branches strictly: `mean_exec_time_ms >= 1000` first, `(shared_blks_read::numeric / NULLIF(calls, 0)) >= 50` second, `calls >= 500000` third, `ELSE \'HEALTHY\'`.',
            'Use `LEFT(query_text, 64) AS short_sql` for readable war-room output.',
            'Keep `ORDER BY total_exec_time_ms DESC, queryid ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: 'IO_BOUND_SCAN', flags: 'i', message: 'Include the `\'IO_BOUND_SCAN\'` classification branch.' },
              { pattern: 'HIGH_FREQ_CPU', flags: 'i', message: 'Include the `\'HIGH_FREQ_CPU\'` classification branch.' }
            ]
          },
          solutionExplanation: 'Each archetype demands a different fix: rebuild `CREATE INDEX CONCURRENTLY` on `(LOWER(customer_email))` for `IO_BOUND_SCAN` (`900102`), add `SKIP LOCKED` + partial index / Redis cache for `HIGH_FREQ_CPU` (`900107`/`900101`), and route `analytics_ro` `SINGLE_SLOW_CALL` queries (`900103`/`900105`) to a read replica.'
        }
      ]
    },

    /* ========================================================================
       LAB 04: pg-m10-t04 — Clinic 04: NVMe Temp I/O Spike — Diagnosing work_mem Disk Spills
       ======================================================================== */
    {
      id: 'pg-m10-t04',
      slug: 'clinic-temp-disk-sort-hash-spills',
      moduleId: 'pg-m10',
      title: 'Clinic 04 — NVMe Temp I/O Spike: Diagnosing work_mem Disk Spills',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['temp_blks_written', 'pg_size_pretty', 'SET LOCAL work_mem'],
      tags: ['troubleshooting', 'work-mem', 'temp-files', 'external-sort', 'incident-response'],
      guide: {
        mentalModel: 'Every `Sort`, `HashJoin`, `HashAggregate`, `Materialize`, or `Memoize` plan node in PostgreSQL 18 gets its own memory budget equal to `work_mem` (default `4MB`). Unlike `shared_buffers`, `work_mem` is allocated **per plan node, per parallel worker, per active query**—meaning a single complex query with 4 hash/sort nodes across 200 concurrent connections could theoretically allocate `4 × 200 × work_mem`.\n\nWhen an operator\'s tuple state exceeds `work_mem`, PostgreSQL switches from in-memory quicksort/hashing to **external merge disk tapes** (`Sort Method: external merge Disk` / multi-batch hash join) under `base/pgsql_tmp`, incrementing `temp_blks_written` and `temp_blks_read` in **8,192-byte (`8 KB`) block units**. Rather than raising global `work_mem` in `postgresql.conf` and risking Linux OOM-killer crashes, Staff DBREs calculate per-call spill size and apply transaction-scoped `SET LOCAL work_mem` (or `ALTER ROLE analytics_ro SET work_mem`) strictly where needed.',
        syntaxAnatomy: [
          'SELECT queryid, rolname, calls, temp_blks_written,',
          '       pg_size_pretty(temp_blks_written * 8192) AS pretty_spill,',
          '       ROUND((temp_blks_written * 8192.0) / NULLIF(calls, 0) / (1024 * 1024), 2) AS spill_mb_per_call',
          'FROM cluster_stat_statements',
          'WHERE temp_blks_written > 0',
          'ORDER BY temp_blks_written DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          '`temp_blks_written` counts **8 KB blocks**, NOT bytes and NOT megabytes—multiply by `8192` for bytes (`pg_size_pretty(temp_blks_written * 8192)`) or divide by `128.0` for exact MiB (`1024 * 1024 / 8192 = 128`).',
          'Never set global `work_mem = \'256MB\'` on an OLTP cluster with `max_connections = 500`; use `BEGIN; SET LOCAL work_mem = \'64MB\'; ... COMMIT;` so memory resets automatically at transaction end.',
          'Enable `log_temp_files = 0` during incidents to capture exact temporary file byte sizes and offending SQL statements in the PostgreSQL server log.'
        ],
        whenToUse: 'Run temp-spill diagnostics whenever scratch NVMe write IOPS spike, `base/pgsql_tmp` disk usage climbs, or `EXPLAIN (ANALYZE, BUFFERS)` reports `temp read=... written=...`.'
      },
      scenario: {
        role: 'Database Performance & Storage Engineer',
        incidentOrGoal: 'CloudWatch/Prometheus alerted that scratch NVMe write throughput tripled at 14:00 UTC due to external sort and hash spills in `pgsql_tmp`.',
        stakeholderNeed: 'Convert 8 KB `temp_blks_written` counters into human-readable byte/MB totals, measure average spill per execution, and prescribe safe `SET LOCAL work_mem` tiers with 25% safety headroom.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Convert 8 KB temp_blks_written into Spilled Bytes & MB',
          mission: 'Filter `cluster_stat_statements` to queries with `temp_blks_written > 0`. Project 6 columns in exact order: `queryid`, `rolname`, `calls`, `temp_blks_written`, `total_spill_mb` (`(temp_blks_written * 8192.0) / (1024 * 1024)` rounded to 2 decimal places), and `pretty_spill` (`pg_size_pretty(temp_blks_written * 8192)`). Sort by `temp_blks_written DESC, queryid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Convert 8 KB temp block counters into cumulative spilled MiB and pretty strings',
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       temp_blks_written',
            '       -- TODO: add total_spill_mb and pg_size_pretty(temp_blks_written * 8192) AS pretty_spill',
            'FROM cluster_stat_statements',
            '-- TODO: filter temp_blks_written > 0 and sort by temp_blks_written DESC, queryid ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       temp_blks_written,',
            '       ROUND((temp_blks_written * 8192.0) / (1024 * 1024), 2) AS total_spill_mb,',
            '       pg_size_pretty(temp_blks_written * 8192) AS pretty_spill',
            'FROM cluster_stat_statements',
            'WHERE temp_blks_written > 0',
            'ORDER BY temp_blks_written DESC, queryid ASC;'
          ].join('\n'),
          hints: [
            'Each PostgreSQL temp block is `8192` bytes (`8 KB`).',
            'Compute `ROUND((temp_blks_written * 8192.0) / (1024 * 1024), 2) AS total_spill_mb` and `pg_size_pretty(temp_blks_written * 8192) AS pretty_spill`.',
            'Filter `WHERE temp_blks_written > 0` and sort by `temp_blks_written DESC, queryid ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bpg_size_pretty\\s*\\(', flags: 'i', message: 'Format byte totals with `pg_size_pretty(temp_blks_written * 8192)`.' },
              { pattern: '\\btemp_blks_written\\s*>\\s*0\\b', flags: 'i', message: 'Filter spilling queries with `WHERE temp_blks_written > 0`.' }
            ]
          },
          solutionExplanation: 'Only 3 of the 9 workload queries write temp files, led by `900103` (`753.13 MB` / `753 MB` cumulative from `PERCENTILE_CONT` ordered-set sorting), `900105` (`321.88 MB` from unindexed multi-key `ORDER BY`), and `900109` (`144.53 MB` from `MERGE` hash join).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Compute Per-Execution Temp Spill Footprint',
          mission: 'For queries in `cluster_stat_statements` where `temp_blks_written > 0`, project 6 columns in exact order: `queryid`, `rolname`, `calls`, `spill_kb_per_call` (`(temp_blks_written * 8.0) / NULLIF(calls, 0)` rounded to 2 decimal places), `spill_mb_per_call` (`(temp_blks_written * 8192.0) / NULLIF(calls, 0) / (1024 * 1024)` rounded to 2 decimal places), and `short_sql` (`LEFT(query_text, 60)`). Sort by `spill_mb_per_call DESC, queryid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Add spill_kb_per_call, spill_mb_per_call, and LEFT(query_text, 60) AS short_sql; sort by spill_mb_per_call DESC',
            'SELECT queryid,',
            '       rolname,',
            '       calls',
            'FROM cluster_stat_statements',
            'WHERE temp_blks_written > 0',
            'ORDER BY queryid ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       ROUND((temp_blks_written * 8.0) / NULLIF(calls, 0), 2) AS spill_kb_per_call,',
            '       ROUND((temp_blks_written * 8192.0) / NULLIF(calls, 0) / (1024 * 1024), 2) AS spill_mb_per_call,',
            '       LEFT(query_text, 60) AS short_sql',
            'FROM cluster_stat_statements',
            'WHERE temp_blks_written > 0',
            'ORDER BY spill_mb_per_call DESC, queryid ASC;'
          ].join('\n'),
          hints: [
            'Multiply `temp_blks_written * 8.0 / NULLIF(calls, 0)` for KiB per call, and `(temp_blks_written * 8192.0) / NULLIF(calls, 0) / (1024 * 1024)` for MiB per call.',
            'Wrap both expressions in `ROUND(..., 2)`.',
            'Project `LEFT(query_text, 60) AS short_sql` and sort by `spill_mb_per_call DESC, queryid ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bAS\\s+spill_mb_per_call\\b', flags: 'i', message: 'Alias per-execution MiB spill `AS spill_mb_per_call`.' },
              { pattern: '\\bNULLIF\\s*\\(\\s*calls\\s*,\\s*0\\s*\\)', flags: 'i', message: 'Use `NULLIF(calls, 0)` when dividing by `calls`.' }
            ]
          },
          solutionExplanation: 'Normalizing by `calls` flips the ranking: `etl_loader` (`900109`) spills the largest volume per call (`1.70 MB` / `1741.18 KB` across 85 runs), whereas `900105` spills just `0.23 MB` (`235.43 KB`) per call across 1,400 runs.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Size Safe Transaction-Scoped SET LOCAL work_mem Tiers',
          mission: 'For queries in `cluster_stat_statements` where `temp_blks_written > 0`, add 25% tuple-header overhead (`* 1.25`) to per-call spilled KB and project 5 columns in exact order: `queryid`, `rolname`, `calls`, `headroom_kb` (`CEIL((temp_blks_written * 8.0 / NULLIF(calls, 0)) * 1.25)::bigint`), and `work_mem_directive` — `\'SET LOCAL work_mem = \'\'4MB\'\'\'` when `headroom_kb <= 512`, `\'SET LOCAL work_mem = \'\'16MB\'\'\'` when `headroom_kb <= 2048`, else `\'SET LOCAL work_mem = \'\'64MB\'\'\'`. Sort by `headroom_kb DESC, queryid ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Recommend transaction-scoped SET LOCAL work_mem tiers without risking global OOM',
            'WITH spill_sizing AS (',
            '  SELECT queryid,',
            '         rolname,',
            '         calls,',
            '         CEIL((temp_blks_written * 8.0 / NULLIF(calls, 0)) * 1.25)::bigint AS headroom_kb',
            '  FROM cluster_stat_statements',
            '  WHERE temp_blks_written > 0',
            ')',
            'SELECT queryid, rolname, calls, headroom_kb',
            '       -- TODO: add CASE work_mem_directive for <= 512, <= 2048, else 64MB',
            'FROM spill_sizing',
            'ORDER BY headroom_kb DESC, queryid ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH spill_sizing AS (',
            '  SELECT queryid,',
            '         rolname,',
            '         calls,',
            '         CEIL((temp_blks_written * 8.0 / NULLIF(calls, 0)) * 1.25)::bigint AS headroom_kb',
            '  FROM cluster_stat_statements',
            '  WHERE temp_blks_written > 0',
            ')',
            'SELECT queryid,',
            '       rolname,',
            '       calls,',
            '       headroom_kb,',
            '       CASE',
            '         WHEN headroom_kb <= 512 THEN \'SET LOCAL work_mem = \'\'4MB\'\'\'',
            '         WHEN headroom_kb <= 2048 THEN \'SET LOCAL work_mem = \'\'16MB\'\'\'',
            '         ELSE \'SET LOCAL work_mem = \'\'64MB\'\'\'',
            '       END AS work_mem_directive',
            'FROM spill_sizing',
            'ORDER BY headroom_kb DESC, queryid ASC;'
          ].join('\n'),
          hints: [
            'In the `spill_sizing` CTE, `CEIL((temp_blks_written * 8.0 / NULLIF(calls, 0)) * 1.25)::bigint AS headroom_kb` gives clean integer KiB targets.',
            'Escape literal single quotes inside SQL strings by doubling them (`\'\'16MB\'\'`).',
            'Map `<= 512` -> `4MB`, `<= 2048` -> `16MB`, `ELSE` -> `64MB`, and sort by `headroom_kb DESC, queryid ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: 'SET LOCAL work_mem', flags: 'i', message: 'Emit transaction-scoped `SET LOCAL work_mem` directives.' },
              { pattern: '\\bCEIL\\s*\\(', flags: 'i', message: 'Use `CEIL(...)` to compute integer `headroom_kb`.' }
            ]
          },
          solutionExplanation: 'In-memory `quicksort` and `Hash` tables require ~25%+ more RAM than compact on-disk tape blocks due to `MinimalTuple` pointer arrays; scoping `SET LOCAL work_mem` to `etl_loader` and `analytics_ro` eliminates temp NVMe I/O without endangering the `checkout_app` connection pool.'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m10-t05 — Clinic 05: Autovacuum Starvation & Dead-Tuple Bloat Remediation
       ======================================================================== */
    {
      id: 'pg-m10-t05',
      slug: 'clinic-autovacuum-starvation-table-bloat',
      moduleId: 'pg-m10',
      title: 'Clinic 05 — Autovacuum Starvation & Dead-Tuple Bloat Remediation',
      difficulty: 'Staff',
      estimatedMinutes: 20,
      datasetId: 'pg_ops_telemetry',
      clauses: ['cluster_table_health', 'dead_tup', 'vacuum_scale_factor', 'n_mod_since_analyze'],
      tags: ['troubleshooting', 'autovacuum', 'bloat', 'dead-tuples', 'incident-response'],
      guide: {
        mentalModel: 'Under PostgreSQL MVCC, `UPDATE` and `DELETE` never overwrite tuples in place—they stamp `xmax` on the old version, leaving a **dead tuple** in the 8 KB heap page and every non-HOT B-Tree index. Autovacuum launches a worker on a table only when:\n`dead_tup >= autovacuum_vacuum_threshold (50) + vacuum_scale_factor * live_tup`\n\nOn small tables, the default `0.200` (`20%`) scale factor works fine. On an 84-million-row table (`audit_events_raw`), `20%` means **16.8 million dead tuples** (`~8–12 GB` of heap/index bloat) accumulate before autovacuum even *wakes up*! Worse, autoanalyze uses `50 + 0.10 * live_tup` against `n_mod_since_analyze`, leaving `pg_statistic` histograms days out of date on high-write tables.',
        syntaxAnatomy: [
          'SELECT table_name, live_tup, dead_tup,',
          '       ROUND(100.0 * dead_tup / NULLIF(live_tup + dead_tup, 0), 2) AS dead_tup_pct,',
          '       ROUND(50 + vacuum_scale_factor * live_tup, 0)::bigint AS vacuum_trigger_tup',
          'FROM cluster_table_health',
          'ORDER BY dead_tup DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          'Notice how well-tuned `ledger_entries` (`112M` rows, `vacuum_scale_factor = 0.020`) stays healthy (`1.06%` dead tuples), whereas `0.200` tables (`audit_events_raw`, `session_events`, `orders`) drown in millions of dead tuples.',
          'Queue tables (`job_queue_live`: `42k` live rows vs `14.8M` dead rows, `99.72%` dead!) bloat catastrophically between vacuum passes unless configured with fixed tuple thresholds (`autovacuum_vacuum_scale_factor = 0.0, autovacuum_vacuum_threshold = 5000`) and aggressive `autovacuum_vacuum_cost_limit`.',
          'Disabling `autovacuum_enabled = false` (`legacy_webhook_archive`) does NOT stop emergency anti-wraparound vacuum—it guarantees emergency vacuum will strike at peak traffic when `age_relfrozenxid` crosses `autovacuum_freeze_max_age`!'
        ],
        whenToUse: 'Audit `pg_stat_user_tables` (`cluster_table_health`) whenever sequential scan latency degrades, table disk footprint grows faster than row count, or query plans regress from stale `n_mod_since_analyze` statistics.'
      },
      scenario: {
        role: 'Staff Storage & MVCC Reliability Engineer',
        incidentOrGoal: 'Primary disk consumption grew 48 GB this week and sequential/index scans over `job_queue_live`, `orders`, and `session_events` slowed 4x.',
        stakeholderNeed: 'Quantify dead-tuple ratios, evaluate PostgreSQL\'s exact `50 + scale_factor * live_tup` trigger threshold per table, and generate per-table `ALTER TABLE ... SET (...)` remediation actions.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Quantify Dead-Tuple Bloat Ratio & Footprint Across Tables',
          mission: 'Query `cluster_table_health` and project 6 columns in exact order: `table_name`, `live_tup`, `dead_tup`, `dead_tup_pct` (`100.0 * dead_tup / NULLIF(live_tup + dead_tup, 0)` rounded to 2 decimal places), `pretty_heap` (`pg_size_pretty(table_bytes)`), and `autovacuum_enabled`. Sort by `dead_tup_pct DESC, table_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Add dead_tup_pct, pg_size_pretty(table_bytes) AS pretty_heap, autovacuum_enabled; sort by dead_tup_pct DESC',
            'SELECT table_name,',
            '       live_tup,',
            '       dead_tup',
            'FROM cluster_table_health',
            'ORDER BY table_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT table_name,',
            '       live_tup,',
            '       dead_tup,',
            '       ROUND(100.0 * dead_tup / NULLIF(live_tup + dead_tup, 0), 2) AS dead_tup_pct,',
            '       pg_size_pretty(table_bytes) AS pretty_heap,',
            '       autovacuum_enabled',
            'FROM cluster_table_health',
            'ORDER BY dead_tup_pct DESC, table_name ASC;'
          ].join('\n'),
          hints: [
            'Compute total tuples as `NULLIF(live_tup + dead_tup, 0)` in the denominator of `dead_tup_pct`.',
            'Format `table_bytes` using `pg_size_pretty(table_bytes) AS pretty_heap`.',
            'Sort by `dead_tup_pct DESC, table_name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bAS\\s+dead_tup_pct\\b', flags: 'i', message: 'Alias dead-tuple percentage `AS dead_tup_pct`.' },
              { pattern: '\\bpg_size_pretty\\s*\\(\\s*table_bytes\\s*\\)', flags: 'i', message: 'Format heap bytes with `pg_size_pretty(table_bytes)`.' }
            ]
          },
          solutionExplanation: '`job_queue_live` is `99.72%` dead tuples (`6144 MB` heap for just `42,000` live rows—explaining the `640,000` slow scans in Clinic 03!), while `orders` (`28.57%`), `audit_events_raw` (`27.27%`), and `session_events` (`21.88%`) carry tens of gigabytes of unreclaimed dead tuples.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Evaluate PostgreSQL\'s Exact Autovacuum Trigger Formula',
          mission: 'Using PostgreSQL\'s base `autovacuum_vacuum_threshold = 50`, query `cluster_table_health` and project 6 columns in exact order: `table_name`, `live_tup`, `dead_tup`, `vacuum_scale_factor`, `vacuum_trigger_tup` (`ROUND(50 + vacuum_scale_factor * live_tup, 0)::bigint`), and `eligible_for_vacuum` (`autovacuum_enabled AND dead_tup >= ROUND(50 + vacuum_scale_factor * live_tup, 0)::bigint`). Sort by `dead_tup DESC, table_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Compute exact autovacuum wake-up thresholds (50 + scale_factor * live_tup)',
            'SELECT table_name,',
            '       live_tup,',
            '       dead_tup,',
            '       vacuum_scale_factor',
            '       -- TODO: add vacuum_trigger_tup and boolean eligible_for_vacuum',
            'FROM cluster_table_health',
            'ORDER BY dead_tup DESC, table_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT table_name,',
            '       live_tup,',
            '       dead_tup,',
            '       vacuum_scale_factor,',
            '       ROUND(50 + vacuum_scale_factor * live_tup, 0)::bigint AS vacuum_trigger_tup,',
            '       (autovacuum_enabled AND dead_tup >= ROUND(50 + vacuum_scale_factor * live_tup, 0)::bigint) AS eligible_for_vacuum',
            'FROM cluster_table_health',
            'ORDER BY dead_tup DESC, table_name ASC;'
          ].join('\n'),
          hints: [
            'Compute `ROUND(50 + vacuum_scale_factor * live_tup, 0)::bigint AS vacuum_trigger_tup`.',
            'Remember a table with `autovacuum_enabled = false` will NOT receive normal dead-tuple autovacuum even if `dead_tup >= vacuum_trigger_tup`.',
            'Sort by `dead_tup DESC, table_name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: 'vacuum_scale_factor\\s*\\*\\s*live_tup|live_tup\\s*\\*\\s*vacuum_scale_factor', flags: 'i', message: 'Compute `50 + vacuum_scale_factor * live_tup`.' },
              { pattern: '\\bautovacuum_enabled\\b', flags: 'i', message: 'Factor `autovacuum_enabled` into `eligible_for_vacuum`.' }
            ]
          },
          solutionExplanation: 'Four tables (`audit_events_raw`, `session_events`, `job_queue_live`, `orders`) are already `eligible_for_vacuum = true`—backed up behind `autovacuum_max_workers` saturation and PID `4101`\'s `backend_xmin` horizon—while `legacy_webhook_archive` has `4.1M` dead tuples ignored because `autovacuum_enabled = false`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Detect Stale Analyzer Stats & Prescribe Per-Table Tuning',
          mission: 'Filter `cluster_table_health` to bloated tables with `dead_tup >= 1000000`. Using PostgreSQL\'s default autoanalyze formula (`ROUND(50 + 0.10 * live_tup, 0)::bigint`), project 5 columns in exact order: `table_name`, `n_mod_since_analyze`, `analyze_trigger_tup`, `stats_stale` (`n_mod_since_analyze >= ROUND(50 + 0.10 * live_tup, 0)::bigint`), and `tuning_plan` (`\'RE_ENABLE_AUTOVACUUM\'` when `NOT autovacuum_enabled`, `\'QUEUE_FIXED_5000_THRESHOLD\'` when `dead_tup > live_tup`, `\'LOWER_SCALE_FACTOR_TO_0.01\'` when `vacuum_scale_factor >= 0.100`, else `\'SCALE_FACTOR_ALREADY_TUNED\'`). Sort by `n_mod_since_analyze DESC, table_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Audit stale planner statistics and prescribe per-table storage parameters',
            'SELECT table_name,',
            '       n_mod_since_analyze,',
            '       ROUND(50 + 0.10 * live_tup, 0)::bigint AS analyze_trigger_tup',
            '       -- TODO: add stats_stale boolean and CASE tuning_plan',
            'FROM cluster_table_health',
            'WHERE dead_tup >= 1000000',
            'ORDER BY n_mod_since_analyze DESC, table_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT table_name,',
            '       n_mod_since_analyze,',
            '       ROUND(50 + 0.10 * live_tup, 0)::bigint AS analyze_trigger_tup,',
            '       (n_mod_since_analyze >= ROUND(50 + 0.10 * live_tup, 0)::bigint) AS stats_stale,',
            '       CASE',
            '         WHEN NOT autovacuum_enabled THEN \'RE_ENABLE_AUTOVACUUM\'',
            '         WHEN dead_tup > live_tup THEN \'QUEUE_FIXED_5000_THRESHOLD\'',
            '         WHEN vacuum_scale_factor >= 0.100 THEN \'LOWER_SCALE_FACTOR_TO_0.01\'',
            '         ELSE \'SCALE_FACTOR_ALREADY_TUNED\'',
            '       END AS tuning_plan',
            'FROM cluster_table_health',
            'WHERE dead_tup >= 1000000',
            'ORDER BY n_mod_since_analyze DESC, table_name ASC;'
          ].join('\n'),
          hints: [
            'Default `autovacuum_analyze_scale_factor` in PostgreSQL is `0.10` (`10%`) plus `autovacuum_analyze_threshold` (`50`).',
            'Evaluate `CASE` branches in exact order: `NOT autovacuum_enabled`, `dead_tup > live_tup`, `vacuum_scale_factor >= 0.100`, `ELSE \'SCALE_FACTOR_ALREADY_TUNED\'`.',
            'Filter `WHERE dead_tup >= 1000000` and sort by `n_mod_since_analyze DESC, table_name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bn_mod_since_analyze\\b', flags: 'i', message: 'Compare `n_mod_since_analyze` against the 10% autoanalyze threshold.' },
              { pattern: 'LOWER_SCALE_FACTOR_TO_0\\.01', flags: 'i', message: 'Recommend `\'LOWER_SCALE_FACTOR_TO_0.01\'` for untuned large tables.' }
            ]
          },
          solutionExplanation: 'Five of the seven high-churn tables have `stats_stale = true` (forcing bad cardinality plans), while `ledger_entries` (`0.020`) and `order_items` (`0.050`) prove how proactive per-table `autovacuum_vacuum_scale_factor` tuning prevents both bloat and stale histograms.'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m10-t06 — Clinic 06: Transaction ID Wraparound Countdown
       ======================================================================== */
    {
      id: 'pg-m10-t06',
      slug: 'clinic-xid-wraparound-emergency',
      moduleId: 'pg-m10',
      title: 'Clinic 06 — Transaction ID Wraparound Countdown (age_relfrozenxid > 1.8B)',
      difficulty: 'Staff',
      estimatedMinutes: 20,
      datasetId: 'pg_ops_telemetry',
      clauses: ['age_relfrozenxid', 'cluster_table_health', 'cluster_replication_slots', 'cluster_stat_activity'],
      tags: ['troubleshooting', 'xid-wraparound', 'relfrozenxid', 'vacuum-freeze', 'incident-response'],
      guide: {
        mentalModel: 'PostgreSQL\'s 32-bit transaction ID (`TransactionId` / `xid`) space is circular modulo $2^{32}$: roughly `2.147 billion` XIDs sit in the visible past and `2.147 billion` sit in the future. Unless `VACUUM` marks old committed tuples as **frozen** (advancing `pg_class.relfrozenxid`), an unfrozen row older than ~2 billion transactions would wrap around into the "future" and **silently vanish from MVCC snapshots**.\n\nTo prevent silent data loss, PostgreSQL enforces hard guardrails around `2,000,000,000` (`2B`) XIDs (`xidStopLimit` ≈ `2.144B`, refusing ALL writes cluster-wide with `ERROR: database is not accepting commands to avoid wraparound data loss`!). Critically, `VACUUM FREEZE` **cannot advance `relfrozenxid` past the oldest cluster-wide `xmin` horizon** held by: (1) open/idle-in-transaction backends (`cluster_stat_activity.backend_xmin`), (2) prepared transactions (`pg_prepared_xacts`), or (3) replication slots (`xmin` / `catalog_xmin`).',
        syntaxAnatomy: [
          'SELECT table_name, age_relfrozenxid,',
          '       ROUND(100.0 * age_relfrozenxid / 2000000000, 2) AS pct_to_shutdown,',
          '       2000000000 - age_relfrozenxid AS xids_until_cliff',
          'FROM cluster_table_health',
          'ORDER BY age_relfrozenxid DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          'Running `VACUUM FREEZE` while an orphaned replication slot or `idle in transaction` session pins an old `xmin` wastes hours of disk I/O without advancing `relfrozenxid` past that pinned `xmin`—always clear `xmin` blockers *first*!',
          'In PostgreSQL 14–18, emergency wraparound recovery should use `VACUUM (FREEZE, INDEX_CLEANUP OFF, TRUNCATE OFF)` (or PostgreSQL\'s automatic `vacuum_failsafe_age = 1.6B` failsafe mode), skipping expensive B-Tree index sweeps so `relfrozenxid` advances 5–10x faster.',
          'Never run `VACUUM FULL` during a wraparound emergency: `VACUUM FULL` takes an `AccessExclusiveLock`, copies the entire table to new disk space, and consumes *new* XIDs!'
        ],
        whenToUse: 'Execute this emergency playbook the moment `MAX(age(relfrozenxid))` crosses `1.5B` XIDs or `autovacuum: VACUUM ... (to prevent wraparound)` appears in `pg_stat_activity`.'
      },
      scenario: {
        role: 'Incident Commander — Core Database Reliability',
        incidentOrGoal: 'PagerDuty SEV-1: `MAX(age_relfrozenxid)` reached `1,942,000,000` (`97.10%` of the `2B` emergency write-shutdown cliff), and anti-wraparound worker PID `4112` is failing to advance `relfrozenxid`.',
        stakeholderNeed: 'Rank tables against the `2,000,000,000` XID shutdown cliff, unify all session and replication-slot `xmin` blockers in one view, and generate fast failsafe `VACUUM (FREEZE, INDEX_CLEANUP OFF)` commands.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Rank Tables Against the 2-Billion XID Shutdown Cliff',
          mission: 'Query `cluster_table_health` against the `2000000000` (`2B`) operational shutdown cliff and project 6 columns in exact order: `table_name`, `age_relfrozenxid`, `pct_to_cliff` (`100.0 * age_relfrozenxid / 2000000000` rounded to 2 decimal places), `xids_remaining` (`2000000000 - age_relfrozenxid`), `autovacuum_enabled`, and `heap_plus_toast` (`pg_size_pretty(table_bytes + toast_bytes)`). Sort by `age_relfrozenxid DESC, table_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Measure every table\'s distance to the 2,000,000,000 XID emergency cliff',
            'SELECT table_name,',
            '       age_relfrozenxid',
            '       -- TODO: add pct_to_cliff, xids_remaining, autovacuum_enabled, heap_plus_toast',
            'FROM cluster_table_health',
            'ORDER BY age_relfrozenxid DESC, table_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT table_name,',
            '       age_relfrozenxid,',
            '       ROUND(100.0 * age_relfrozenxid / 2000000000, 2) AS pct_to_cliff,',
            '       (2000000000 - age_relfrozenxid) AS xids_remaining,',
            '       autovacuum_enabled,',
            '       pg_size_pretty(table_bytes + toast_bytes) AS heap_plus_toast',
            'FROM cluster_table_health',
            'ORDER BY age_relfrozenxid DESC, table_name ASC;'
          ].join('\n'),
          hints: [
            'Use `ROUND(100.0 * age_relfrozenxid / 2000000000, 2) AS pct_to_cliff`.',
            'Subtract `2000000000 - age_relfrozenxid AS xids_remaining`.',
            'Include `toast_bytes` (`pg_size_pretty(table_bytes + toast_bytes) AS heap_plus_toast`) because PostgreSQL TOAST tables maintain their own `relfrozenxid` that `VACUUM FREEZE` must also scan!'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '2000000000', flags: 'i', message: 'Measure XID headroom against the `2000000000` cliff.' },
              { pattern: '\\btoast_bytes\\b', flags: 'i', message: 'Sum `table_bytes + toast_bytes` inside `pg_size_pretty(...)`.' }
            ]
          },
          solutionExplanation: 'Two tables sit in the red zone: `legacy_webhook_archive` (`1.942B` XIDs, `97.10%` to cliff, `58M` XIDs left, `26 GB` heap+TOAST, `autovacuum_enabled = false`) and `audit_events_raw` (`1.895B` XIDs, `94.75%` to cliff, `48 GB` heap+TOAST).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Correlate All Cluster-Wide xmin Horizon Blockers (Sessions + Slots)',
          mission: 'Combine `xmin` horizon holders across `cluster_stat_activity` (`WHERE backend_xmin IS NOT NULL AND pid <> 4112`, excluding the autovacuum worker itself) and `cluster_replication_slots` (`WHERE catalog_xmin IS NOT NULL`) using `UNION ALL`. Project 4 columns in exact order: `holder_type` (`\'backend_session\'` vs `\'replication_slot\'`), `holder_id` (`application_name` for sessions, `slot_name` for slots), `holder_state` (`state` for sessions, `CASE WHEN active THEN \'active\' ELSE \'inactive\' END` for slots), and `xmin_horizon` (`backend_xmin` vs `catalog_xmin`). Sort by `xmin_horizon ASC, holder_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Unify session backend_xmin and logical slot catalog_xmin horizons in one sorted view',
            'SELECT \'backend_session\' AS holder_type,',
            '       application_name AS holder_id,',
            '       state AS holder_state,',
            '       backend_xmin AS xmin_horizon',
            'FROM cluster_stat_activity',
            'WHERE backend_xmin IS NOT NULL AND pid <> 4112',
            '-- TODO: UNION ALL cluster_replication_slots (catalog_xmin IS NOT NULL) and sort by xmin_horizon ASC, holder_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT \'backend_session\' AS holder_type,',
            '       application_name AS holder_id,',
            '       state AS holder_state,',
            '       backend_xmin AS xmin_horizon',
            'FROM cluster_stat_activity',
            'WHERE backend_xmin IS NOT NULL',
            '  AND pid <> 4112',
            'UNION ALL',
            'SELECT \'replication_slot\' AS holder_type,',
            '       slot_name AS holder_id,',
            '       CASE WHEN active THEN \'active\' ELSE \'inactive\' END AS holder_state,',
            '       catalog_xmin AS xmin_horizon',
            'FROM cluster_replication_slots',
            'WHERE catalog_xmin IS NOT NULL',
            'ORDER BY xmin_horizon ASC, holder_id ASC;'
          ].join('\n'),
          hints: [
            'Keep the 4 output column names and types aligned across both `UNION ALL` branches.',
            'In the second branch, map boolean `active` to text via `CASE WHEN active THEN \'active\' ELSE \'inactive\' END` and filter `WHERE catalog_xmin IS NOT NULL`.',
            'Place `ORDER BY xmin_horizon ASC, holder_id ASC` at the end of the `UNION ALL`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bUNION\\s+ALL\\b', flags: 'i', message: 'Combine `cluster_stat_activity` and `cluster_replication_slots` with `UNION ALL`.' },
              { pattern: '\\bcatalog_xmin\\b', flags: 'i', message: 'Include `catalog_xmin` from `cluster_replication_slots`.' }
            ]
          },
          solutionExplanation: 'Correlating both views uncovers why PID `4112`\'s wraparound vacuum is pinned at `backend_xmin = 842095`: leaked `idle in transaction` worker `checkout-worker-07` holds `xmin = 842095`, while two inactive logical slots (`debezium_legacy_analytics`, `snowflake_sync_staging`) pin catalog horizons!'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Generate Ordered Failsafe VACUUM FREEZE Runbook',
          mission: 'Filter `cluster_table_health` to tables exceeding `autovacuum_freeze_max_age` (`age_relfrozenxid >= 200000000`). Project 5 columns in exact order: `table_name`, `age_relfrozenxid`, `severity` (`\'CRITICAL_FAILSAFE\'` when `age_relfrozenxid >= 1600000000`, else `\'PREVENTIVE_FREEZE\'`), `total_size_gb` (`ROUND((table_bytes + index_bytes + toast_bytes) / (1024.0 * 1024 * 1024), 2)`), and `freeze_sql` (`\'VACUUM (FREEZE, INDEX_CLEANUP OFF, TRUNCATE OFF) \' || schema_name || \'.\' || table_name || \';\'` when `age_relfrozenxid >= 1600000000`, else `\'VACUUM (FREEZE) \' || schema_name || \'.\' || table_name || \';\'`). Sort by `age_relfrozenxid DESC, table_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Produce copy-pasteable failsafe VACUUM FREEZE statements prioritized by XID age',
            'SELECT table_name,',
            '       age_relfrozenxid',
            '       -- TODO: add severity, total_size_gb, and freeze_sql',
            'FROM cluster_table_health',
            'WHERE age_relfrozenxid >= 200000000',
            'ORDER BY age_relfrozenxid DESC, table_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT table_name,',
            '       age_relfrozenxid,',
            '       CASE',
            '         WHEN age_relfrozenxid >= 1600000000 THEN \'CRITICAL_FAILSAFE\'',
            '         ELSE \'PREVENTIVE_FREEZE\'',
            '       END AS severity,',
            '       ROUND((table_bytes + index_bytes + toast_bytes) / (1024.0 * 1024 * 1024), 2) AS total_size_gb,',
            '       CASE',
            '         WHEN age_relfrozenxid >= 1600000000',
            '           THEN \'VACUUM (FREEZE, INDEX_CLEANUP OFF, TRUNCATE OFF) \' || schema_name || \'.\' || table_name || \';\'',
            '         ELSE \'VACUUM (FREEZE) \' || schema_name || \'.\' || table_name || \';\'',
            '       END AS freeze_sql',
            'FROM cluster_table_health',
            'WHERE age_relfrozenxid >= 200000000',
            'ORDER BY age_relfrozenxid DESC, table_name ASC;'
          ].join('\n'),
          hints: [
            '`1600000000` (`1.6B`) matches PostgreSQL\'s `vacuum_failsafe_age` threshold.',
            'Divide `(table_bytes + index_bytes + toast_bytes)` by `(1024.0 * 1024 * 1024)` inside `ROUND(..., 2)` for `total_size_gb`.',
            'Concatenate `schema_name || \'.\' || table_name || \';\'` to generate exact `VACUUM` SQL statements.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: 'INDEX_CLEANUP OFF', flags: 'i', message: 'Include `INDEX_CLEANUP OFF` in emergency failsafe `VACUUM` commands.' },
              { pattern: '\\bAS\\s+freeze_sql\\b', flags: 'i', message: 'Alias generated remediation SQL `AS freeze_sql`.' }
            ]
          },
          solutionExplanation: 'Skipping `INDEX_CLEANUP` (`19 GB` of indexes on `audit_events_raw` + `3.2 GB` on `legacy_webhook_archive`) lets `VACUUM FREEZE` sweep only unfrozen heap/TOAST pages via the visibility map, pulling the cluster back from the `2B` cliff in minutes once PID `4101` is terminated.'
        }
      ]
    },

    /* ========================================================================
       LAB 07: pg-m10-t07 — Clinic 07: Write Amplification — Unused, INVALID & Prefix-Redundant Indexes
       ======================================================================== */
    {
      id: 'pg-m10-t07',
      slug: 'clinic-unused-duplicate-invalid-indexes',
      moduleId: 'pg-m10',
      title: 'Clinic 07 — Write Amplification: Unused, INVALID & Prefix-Redundant Indexes',
      difficulty: 'Staff',
      estimatedMinutes: 20,
      datasetId: 'pg_ops_telemetry',
      clauses: ['cluster_index_health', 'is_valid', 'idx_scan', 'key_columns'],
      tags: ['troubleshooting', 'redundant-indexes', 'unused-indexes', 'write-amplification', 'incident-response'],
      guide: {
        mentalModel: 'Every secondary B-Tree index on a table imposes a permanent **write-amplification tax**: every `INSERT` must insert an index entry into all indexes, and any `UPDATE` that modifies *even one* indexed column disables PostgreSQL\'s **HOT (Heap-Only Tuple)** fast path—forcing fresh index entries across **every** index on the table plus extra WAL generation and shared-buffer eviction.\n\nProduction index audits hunt three distinct pathologies in `pg_index` + `pg_stat_user_indexes` (`cluster_index_health`):\n1. **`INVALID` leftover indexes (`NOT is_valid`)**: left behind when `CREATE INDEX CONCURRENTLY` hits a deadlock, unique violation, or cancellation—ignored by the planner for `SELECT`s, yet **still updated by every `INSERT`/`UPDATE`**!\n2. **Unused non-constraint indexes (`idx_scan = 0 AND NOT is_unique AND NOT is_primary`)**: burning gigabytes of RAM/WAL for zero reads.\n3. **Leftmost-prefix redundant indexes**: a narrower non-unique B-Tree on `(customer_id)` is 100% shadowed for equality/range scans by a valid B-Tree on `(customer_id, created_at)`.',
        syntaxAnatomy: [
          'SELECT n.table_name,',
          '       n.index_name AS redundant_index,',
          '       n.key_columns AS narrow_keys,',
          '       w.index_name AS covering_index,',
          '       w.key_columns AS wide_keys',
          'FROM cluster_index_health n',
          'JOIN cluster_index_health w',
          '  ON w.schema_name = n.schema_name AND w.table_name = n.table_name',
          ' AND w.index_name <> n.index_name',
          'WHERE n.is_valid AND w.is_valid AND NOT n.is_unique AND NOT n.is_primary',
          '  AND array_length(n.key_columns, 1) < array_length(w.key_columns, 1)',
          '  AND w.key_columns[1:array_length(n.key_columns, 1)] = n.key_columns;'
        ].join('\n'),
        internalsAndGotchas: [
          'Never drop a `0`-scan index where `is_unique = true` (`idx_orders_merchant_ref_uniq`): PostgreSQL uses unique indexes to enforce idempotency/uniqueness on `INSERT` without necessarily incrementing `idx_scan` on `SELECT` queries!',
          'An `INVALID` index (`is_valid = false`) cannot be fixed with `ALTER INDEX`; drop it non-blockingly via `DROP INDEX CONCURRENTLY` (or `REINDEX INDEX CONCURRENTLY` in PG 12+ if rebuilding an existing valid index).',
          'Before dropping a `0`-scan index in multi-node clusters, verify `idx_scan` across **all read replicas** as well—reporting workloads running exclusively on standbys increment `pg_stat_user_indexes` on the standby, not the primary!'
        ],
        whenToUse: 'Run this 3-stage index hygiene audit whenever WAL generation (`wal_bytes`), buffer cache churn, or `UPDATE` latency climbs on write-heavy OLTP tables.'
      },
      scenario: {
        role: 'Staff Storage & Query Optimizer Engineer',
        incidentOrGoal: '`orders` and `ledger_entries` suffer severe non-HOT `UPDATE` amplification and `43 GB` of B-Tree indexes are competing with heap pages in `shared_buffers`.',
        stakeholderNeed: 'Isolate failed `INVALID` `CONCURRENTLY` artifacts, find safe-to-drop 0-scan non-unique indexes, and detect exact leftmost-prefix redundant B-Tree indexes using array slicing.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Isolate Broken INVALID Leftover Indexes',
          mission: 'Filter `cluster_index_health` to invalid indexes (`NOT is_valid`). Project 5 columns in exact order: `table_name`, `index_name`, `key_columns`, `wasted_size` (`pg_size_pretty(index_bytes)`), and `cleanup_sql` (`\'DROP INDEX CONCURRENTLY \' || schema_name || \'.\' || index_name || \';\'`). Sort by `index_bytes DESC, index_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Catch failed CREATE INDEX CONCURRENTLY artifacts still taxing INSERT/UPDATE',
            'SELECT table_name,',
            '       index_name,',
            '       key_columns',
            '       -- TODO: add pg_size_pretty(index_bytes) AS wasted_size and cleanup_sql',
            'FROM cluster_index_health',
            '-- TODO: filter NOT is_valid and sort by index_bytes DESC, index_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT table_name,',
            '       index_name,',
            '       key_columns,',
            '       pg_size_pretty(index_bytes) AS wasted_size,',
            '       \'DROP INDEX CONCURRENTLY \' || schema_name || \'.\' || index_name || \';\' AS cleanup_sql',
            'FROM cluster_index_health',
            'WHERE NOT is_valid',
            'ORDER BY index_bytes DESC, index_name ASC;'
          ].join('\n'),
          hints: [
            'Filter `WHERE NOT is_valid` (equivalent to `is_valid = false`).',
            'Format `index_bytes` via `pg_size_pretty(index_bytes) AS wasted_size`.',
            'Build `\'DROP INDEX CONCURRENTLY \' || schema_name || \'.\' || index_name || \';\' AS cleanup_sql`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bNOT\\s+is_valid\\b|is_valid\\s*=\\s*false', flags: 'i', message: 'Filter invalid indexes using `NOT is_valid`.' },
              { pattern: 'DROP INDEX CONCURRENTLY', flags: 'i', message: 'Generate non-blocking `DROP INDEX CONCURRENTLY` DDL.' }
            ]
          },
          solutionExplanation: '`idx_orders_email_lower_ccnew` (`1536 MB`) is a failed `REINDEX`/`CREATE INDEX CONCURRENTLY` artifact—PostgreSQL\'s planner refuses to use it (causing Clinic 03\'s `LOWER(customer_email)` sequential scan!), yet every `orders` write still pays to maintain it.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Find Safe-to-Drop Unused (0-Scan) Non-Unique Indexes',
          mission: 'Filter `cluster_index_health` to valid (`is_valid`), non-primary (`NOT is_primary`), non-unique (`NOT is_unique`) indexes with `idx_scan = 0`. Project 5 columns in exact order: `table_name`, `index_name`, `key_columns`, `idx_scan`, and `reclaimable_size` (`pg_size_pretty(index_bytes)`). Sort by `index_bytes DESC, index_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Identify 0-scan secondary indexes while protecting UNIQUE and PRIMARY KEY constraints',
            'SELECT table_name,',
            '       index_name,',
            '       key_columns,',
            '       idx_scan',
            '       -- TODO: add pg_size_pretty(index_bytes) AS reclaimable_size',
            'FROM cluster_index_health',
            '-- TODO: filter valid, non-primary, non-unique, idx_scan = 0 and sort by index_bytes DESC;'
          ].join('\n'),
          solutionCode: [
            'SELECT table_name,',
            '       index_name,',
            '       key_columns,',
            '       idx_scan,',
            '       pg_size_pretty(index_bytes) AS reclaimable_size',
            'FROM cluster_index_health',
            'WHERE is_valid',
            '  AND NOT is_primary',
            '  AND NOT is_unique',
            '  AND idx_scan = 0',
            'ORDER BY index_bytes DESC, index_name ASC;'
          ].join('\n'),
          hints: [
            'All four predicates are mandatory: `is_valid AND NOT is_primary AND NOT is_unique AND idx_scan = 0`.',
            'Notice how `NOT is_unique` protects `idx_orders_merchant_ref_uniq`, which enforces merchant idempotency despite having `0` `SELECT` scans.',
            'Sort by `index_bytes DESC, index_name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bNOT\\s+is_unique\\b|is_unique\\s*=\\s*false', flags: 'i', message: 'Exclude unique constraint indexes with `NOT is_unique`.' },
              { pattern: '\\bidx_scan\\s*=\\s*0\\b', flags: 'i', message: 'Filter unused indexes with `idx_scan = 0`.' }
            ]
          },
          solutionExplanation: 'Dropping `idx_audit_raw_marketing_tag` (`6144 MB`) and `idx_orders_legacy_coupon` (`1792 MB`) reclaims nearly `8 GB` of storage and eliminates pointless B-Tree splits on `audit_events_raw` and `orders`, while preserving `idx_orders_merchant_ref_uniq`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Detect Exact Leftmost-Prefix Redundant B-Tree Indexes',
          mission: 'Self-join `cluster_index_health n` (narrower index) with `cluster_index_health w` (wider covering index) on `schema_name` and `table_name` (`w.index_name <> n.index_name`) where both `n.is_valid` and `w.is_valid`, `NOT n.is_unique`, `NOT n.is_primary`, `array_length(n.key_columns, 1) < array_length(w.key_columns, 1)`, and `w.key_columns[1:array_length(n.key_columns, 1)] = n.key_columns`. Project 6 columns in exact order: `table_name` (`n.table_name`), `redundant_index` (`n.index_name`), `narrow_keys` (`n.key_columns`), `covering_index` (`w.index_name`), `wide_keys` (`w.key_columns`), and `reclaimable_size` (`pg_size_pretty(n.index_bytes)`). Sort by `n.index_bytes DESC, n.index_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Self-join cluster_index_health using PostgreSQL array slice [1:N] prefix matching',
            'SELECT n.table_name,',
            '       n.index_name AS redundant_index,',
            '       n.key_columns AS narrow_keys',
            '       -- TODO: add covering_index, wide_keys, and pg_size_pretty(n.index_bytes) AS reclaimable_size',
            'FROM cluster_index_health n',
            'JOIN cluster_index_health w',
            '  ON w.schema_name = n.schema_name',
            ' AND w.table_name = n.table_name',
            ' AND w.index_name <> n.index_name',
            '-- TODO: filter valid, non-unique/non-PK narrow index whose key_columns is a leftmost prefix of w.key_columns;'
          ].join('\n'),
          solutionCode: [
            'SELECT n.table_name,',
            '       n.index_name AS redundant_index,',
            '       n.key_columns AS narrow_keys,',
            '       w.index_name AS covering_index,',
            '       w.key_columns AS wide_keys,',
            '       pg_size_pretty(n.index_bytes) AS reclaimable_size',
            'FROM cluster_index_health n',
            'JOIN cluster_index_health w',
            '  ON w.schema_name = n.schema_name',
            ' AND w.table_name = n.table_name',
            ' AND w.index_name <> n.index_name',
            'WHERE n.is_valid',
            '  AND w.is_valid',
            '  AND NOT n.is_unique',
            '  AND NOT n.is_primary',
            '  AND array_length(n.key_columns, 1) < array_length(w.key_columns, 1)',
            '  AND w.key_columns[1:array_length(n.key_columns, 1)] = n.key_columns',
            'ORDER BY n.index_bytes DESC, n.index_name ASC;'
          ].join('\n'),
          hints: [
            'PostgreSQL 1-based array slicing `w.key_columns[1:array_length(n.key_columns, 1)]` extracts the exact leading `K` columns of the wider index.',
            'Ensure `NOT n.is_unique AND NOT n.is_primary` because a narrower `UNIQUE (a)` constraint cannot be enforced by a non-unique `(a, b)` index!',
            'Sort by `n.index_bytes DESC, n.index_name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\barray_length\\s*\\(', flags: 'i', message: 'Use `array_length(..., 1)` with PostgreSQL array slicing to verify prefix coverage.' },
              { pattern: '\\bAS\\s+covering_index\\b', flags: 'i', message: 'Alias the wider index `AS covering_index`.' }
            ]
          },
          solutionExplanation: 'Array-slice prefix matching catches another `7.25 GB` of pure bloat: `idx_ledger_account` (`5120 MB`, `120` scans) is shadowed by `idx_ledger_account_posted` (`48.9M` scans), and `idx_orders_customer_id` (`2304 MB`, `410` scans) is shadowed by `idx_orders_customer_created` (`31.8M` scans).'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m10-t08 — Clinic 08: pg_wal Disk 96% Full — Orphaned Replication Slot Triage
       ======================================================================== */
    {
      id: 'pg-m10-t08',
      slug: 'clinic-orphaned-slots-wal-disk-full',
      moduleId: 'pg-m10',
      title: 'Clinic 08 — pg_wal Disk 96% Full: Orphaned Replication Slot Triage',
      difficulty: 'Staff',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['cluster_replication_slots', 'pg_wal_lsn_diff', 'restart_lsn', 'confirmed_flush_lsn'],
      tags: ['troubleshooting', 'replication-slots', 'wal', 'cdc', 'disk-full', 'incident-response'],
      guide: {
        mentalModel: 'A PostgreSQL replication slot (`pg_replication_slots`) is a **durable server-side retention contract**: PostgreSQL promises **never to recycle or delete any `16 MB` WAL segment** in `pg_wal/` at or after `restart_lsn` (and never to vacuum system catalog tuples at or after `catalog_xmin`) until the downstream standby or logical CDC consumer (`Debezium`, `Snowflake`, `Flink`) reconnects and advances its LSN.\n\nIf a staging CDC pipeline is decommissioned without calling `pg_drop_replication_slot()`, `active` flips to `false`, `restart_lsn` freezes forever, and `pg_wal/` fills until the filesystem hits `100%` (`ENOSPC`)—at which point PostgreSQL immediately **PANICs and crashes** because it cannot flush commit WAL! Using PostgreSQL\'s native `PG_LSN` type and `pg_wal_lsn_diff(lsn1, lsn2)`, DBREs compute exact byte retention in SQL and enforce `max_slot_wal_keep_size` guardrails.',
        syntaxAnatomy: [
          'SELECT slot_name, slot_type, active,',
          '       pg_wal_lsn_diff(current_wal_lsn, restart_lsn)::bigint AS retained_wal_bytes,',
          '       pg_size_pretty(pg_wal_lsn_diff(current_wal_lsn, restart_lsn)) AS retained_wal_pretty,',
          '       pg_wal_lsn_diff(current_wal_lsn, confirmed_flush_lsn)::bigint AS flush_lag_bytes',
          'FROM cluster_replication_slots',
          'ORDER BY retained_wal_bytes DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          'Never delete files inside `pg_wal/` with `rm -rf` on Linux! Deleting uncheckpointed or slot-retained WAL files corrupts crash recovery and bricks the cluster; always drop the offending slot via `SELECT pg_drop_replication_slot(\'slot_name\')`, which triggers an immediate checkpoint cleanup of unneeded WAL segments.',
          '`restart_lsn` tracks the oldest WAL record the decoding plugin still needs on disk to rebuild open transactions, whereas `confirmed_flush_lsn` (logical slots only) tracks the latest commit LSN acknowledged by the downstream consumer.',
          'Configure `max_slot_wal_keep_size` (PostgreSQL 13–18) on production primaries so PostgreSQL invalidates a runaway slot (`wal_status = \'lost\'`) rather than letting `pg_wal/` crash the primary with `PANIC: could not write to file "pg_wal/..."`.'
        ],
        whenToUse: 'Run replication-slot LSN diff queries first whenever `pg_wal` disk utilization climbs linearly without a matching spike in write throughput or archive failures.'
      },
      scenario: {
        role: 'Primary On-Call DBRE — Storage & CDC',
        incidentOrGoal: 'Alert `PGWalDiskCritical`: `pg_wal` volume hit `96%` (`73.4 GB` retained) and will crash the primary with `PANIC: No space left on device` in 28 minutes.',
        stakeholderNeed: 'Measure retained WAL bytes per slot via `pg_wal_lsn_diff`, separate restart retention from consumer `confirmed_flush_lsn` lag on logical slots, and generate safe `pg_drop_replication_slot` actions.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Quantify Retained WAL Bytes & Pretty Size per Slot',
          mission: 'Query `cluster_replication_slots` and project 6 columns in exact order: `slot_name`, `slot_type`, `active`, `restart_lsn`, `retained_wal_bytes` (`pg_wal_lsn_diff(current_wal_lsn, restart_lsn)::bigint`), and `retained_wal_pretty` (`pg_size_pretty(pg_wal_lsn_diff(current_wal_lsn, restart_lsn))`). Sort by `retained_wal_bytes DESC, slot_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Add retained_wal_bytes (::bigint) and retained_wal_pretty; sort by retained_wal_bytes DESC',
            'SELECT slot_name,',
            '       slot_type,',
            '       active,',
            '       restart_lsn',
            'FROM cluster_replication_slots',
            'ORDER BY slot_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT slot_name,',
            '       slot_type,',
            '       active,',
            '       restart_lsn,',
            '       pg_wal_lsn_diff(current_wal_lsn, restart_lsn)::bigint AS retained_wal_bytes,',
            '       pg_size_pretty(pg_wal_lsn_diff(current_wal_lsn, restart_lsn)) AS retained_wal_pretty',
            'FROM cluster_replication_slots',
            'ORDER BY retained_wal_bytes DESC, slot_name ASC;'
          ].join('\n'),
          hints: [
            '`pg_wal_lsn_diff(lsn_new, lsn_old)` returns `NUMERIC` byte distance between two `PG_LSN` positions.',
            'Cast `pg_wal_lsn_diff(current_wal_lsn, restart_lsn)::bigint AS retained_wal_bytes` and pass `pg_wal_lsn_diff(...)` to `pg_size_pretty(...)`.',
            'Sort by `retained_wal_bytes DESC, slot_name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: '\\bpg_wal_lsn_diff\\s*\\(', flags: 'i', message: 'Use `pg_wal_lsn_diff(current_wal_lsn, restart_lsn)` to measure retained WAL bytes.' },
              { pattern: '\\bpg_size_pretty\\s*\\(', flags: 'i', message: 'Format retained WAL bytes with `pg_size_pretty(...)`.' }
            ]
          },
          solutionExplanation: 'Two abandoned (`active = false`) logical slots account for `99.9%` of disk pressure: `debezium_legacy_analytics` pins `68 GB` (`73,014,444,032` bytes from LSN `03/80000000`) and `snowflake_sync_staging` pins `5120 MB` (`5 GB`), while healthy standbys hold only `7 MB`–`28 MB`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Compare Restart WAL Retention vs Consumer Flush Lag on Logical Slots',
          mission: 'Filter `cluster_replication_slots` to `slot_type = \'logical\'`. Project 6 columns in exact order: `slot_name`, `plugin`, `active`, `retained_wal_mb` (`ROUND(pg_wal_lsn_diff(current_wal_lsn, restart_lsn) / (1024.0 * 1024), 2)`), `flush_lag_mb` (`ROUND(pg_wal_lsn_diff(current_wal_lsn, confirmed_flush_lsn) / (1024.0 * 1024), 2)`), and `catalog_xmin`. Sort by `flush_lag_mb DESC, slot_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- TODO: Add retained_wal_mb, flush_lag_mb, and catalog_xmin; sort by flush_lag_mb DESC',
            'SELECT slot_name,',
            '       plugin,',
            '       active',
            'FROM cluster_replication_slots',
            'WHERE slot_type = \'logical\'',
            'ORDER BY slot_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT slot_name,',
            '       plugin,',
            '       active,',
            '       ROUND(pg_wal_lsn_diff(current_wal_lsn, restart_lsn) / (1024.0 * 1024), 2) AS retained_wal_mb,',
            '       ROUND(pg_wal_lsn_diff(current_wal_lsn, confirmed_flush_lsn) / (1024.0 * 1024), 2) AS flush_lag_mb,',
            '       catalog_xmin',
            'FROM cluster_replication_slots',
            'WHERE slot_type = \'logical\'',
            'ORDER BY flush_lag_mb DESC, slot_name ASC;'
          ].join('\n'),
          hints: [
            'Physical replication slots have `confirmed_flush_lsn IS NULL`, which is why filtering `WHERE slot_type = \'logical\'` gives non-null flush lag across all returned rows.',
            'Divide `pg_wal_lsn_diff(...)` by `(1024.0 * 1024)` inside `ROUND(..., 2)` for MiB.',
            'Sort by `flush_lag_mb DESC, slot_name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bconfirmed_flush_lsn\\b', flags: 'i', message: 'Measure downstream CDC lag using `confirmed_flush_lsn`.' },
              { pattern: 'slot_type\\s*=\\s*\'logical\'', flags: 'i', message: 'Filter to `slot_type = \'logical\'`.' }
            ]
          },
          solutionExplanation: 'Active `debezium_orders_cdc` shows `33.00 MB` of consumer flush lag (`40.00 MB` retained WAL because an open transaction pins `restart_lsn` `7 MB` earlier than `confirmed_flush_lsn`), whereas both inactive slots have multi-gigabyte unacknowledged lag and stale `catalog_xmin` horizons.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Triage Slots & Generate Safe pg_drop_replication_slot Runbook',
          mission: 'Across all rows in `cluster_replication_slots`, project 5 columns in exact order: `slot_name`, `active`, `retained_wal_bytes` (`pg_wal_lsn_diff(current_wal_lsn, restart_lsn)::bigint`), `triage_action` (`\'DROP_ORPHANED_SLOT\'` when `NOT active AND pg_wal_lsn_diff(current_wal_lsn, restart_lsn) >= 1073741824`, `\'INVESTIGATE_LAG\'` when `active AND pg_wal_lsn_diff(current_wal_lsn, restart_lsn) >= 33554432`, else `\'HEALTHY\'`), and `remediation_sql` (`\'SELECT pg_drop_replication_slot(\'\'\' || slot_name || \'\'\');\'` when `NOT active AND pg_wal_lsn_diff(current_wal_lsn, restart_lsn) >= 1073741824`, else `\'-- retain slot\'`). Sort by `retained_wal_bytes DESC, slot_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Classify every slot and emit surgical pg_drop_replication_slot commands for orphans',
            'WITH slot_metrics AS (',
            '  SELECT slot_name,',
            '         active,',
            '         pg_wal_lsn_diff(current_wal_lsn, restart_lsn)::bigint AS retained_wal_bytes',
            '  FROM cluster_replication_slots',
            ')',
            'SELECT slot_name, active, retained_wal_bytes',
            '       -- TODO: add CASE triage_action and CASE remediation_sql',
            'FROM slot_metrics',
            'ORDER BY retained_wal_bytes DESC, slot_name ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH slot_metrics AS (',
            '  SELECT slot_name,',
            '         active,',
            '         pg_wal_lsn_diff(current_wal_lsn, restart_lsn)::bigint AS retained_wal_bytes',
            '  FROM cluster_replication_slots',
            ')',
            'SELECT slot_name,',
            '       active,',
            '       retained_wal_bytes,',
            '       CASE',
            '         WHEN NOT active AND retained_wal_bytes >= 1073741824 THEN \'DROP_ORPHANED_SLOT\'',
            '         WHEN active AND retained_wal_bytes >= 33554432 THEN \'INVESTIGATE_LAG\'',
            '         ELSE \'HEALTHY\'',
            '       END AS triage_action,',
            '       CASE',
            '         WHEN NOT active AND retained_wal_bytes >= 1073741824',
            '           THEN \'SELECT pg_drop_replication_slot(\'\'\' || slot_name || \'\'\');\'',
            '         ELSE \'-- retain slot\'',
            '       END AS remediation_sql',
            'FROM slot_metrics',
            'ORDER BY retained_wal_bytes DESC, slot_name ASC;'
          ].join('\n'),
          hints: [
            '`1073741824` bytes is `1 GiB`, and `33554432` bytes is `32 MiB`.',
            'Precomputing `retained_wal_bytes` in `slot_metrics` keeps both `CASE` expressions clean and DRY.',
            'Format `\'SELECT pg_drop_replication_slot(\'\'\' || slot_name || \'\'\');\'` with doubled single quotes for literal SQL quotes.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            requiredPatterns: [
              { pattern: 'DROP_ORPHANED_SLOT', flags: 'i', message: 'Classify abandoned slots retaining >= 1 GiB as `\'DROP_ORPHANED_SLOT\'`.' },
              { pattern: 'pg_drop_replication_slot', flags: 'i', message: 'Generate `SELECT pg_drop_replication_slot(...)` for orphaned slots.' }
            ]
          },
          solutionExplanation: 'Executing `SELECT pg_drop_replication_slot(...)` on `debezium_legacy_analytics` and `snowflake_sync_staging` releases `73 GB` of `pg_wal` segments and unpins `catalog_xmin`, averting an `ENOSPC` cluster PANIC while leaving `debezium_orders_cdc` (`INVESTIGATE_LAG`) and physical DR standbys (`HEALTHY`) intact.'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
