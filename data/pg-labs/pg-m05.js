/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Mastery
 * Track 05 (`pg-m05`): PostgreSQL Rich Native Data Types & Search
 * 8 Hands-On Labs × 3 Progressive SQL Missions = 24 Verified PostgreSQL 18.6 Steps
 */
(function (root) {
  'use strict';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};

  root.PG_LAB_MODULES['pg-m05'] = [
    /* ========================================================================
       LAB 01: pg-m05-t01 — JSONB Extraction & GIN Containment
       ======================================================================== */
    {
      id: 'pg-m05-t01',
      slug: 'jsonb-operators-containment-gin',
      moduleId: 'pg-m05',
      title: 'JSONB Extraction (->, ->>, #>>) & GIN Containment (@>, ?, ?|, ?&)',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'pg_ops_telemetry',
      clauses: ['JSONB', '->', '->>', '@>', '?', '?|', '?&'],
      tags: ['jsonb', 'gin', 'containment', 'semi-structured'],
      guide: {
        mentalModel: 'Unlike legacy `JSON` (which stores raw whitespace-preserving text and reparses on every access), PostgreSQL `JSONB` decomposes documents into a **sorted binary tree of typed keys and scalar values** on write. That binary layout unlocks `O(log k)` key lookups inside TOASTed values and direct **Generalized Inverted Index (`GIN`)** acceleration (`jsonb_ops` and `jsonb_path_ops`).\n\nThe golden rule of `JSONB` query tuning is separating **projection operators** (`->`, `->>`, `#>>`) from **GIN-indexable predicate operators** (`@>`, `?`, `?|`, `?&`). Filtering with `WHERE payload->\'user\'->>\'mfa\' = \'false\'` extracts text and forces a sequential heap scan unless you build a bespoke expression index, whereas `WHERE payload @> \'{"user": {"mfa": false}}\'::jsonb` probes `idx_api_audit_payload_gin` directly via bitmap index scan.',
        syntaxAnatomy: [
          'SELECT event_id,',
          '       payload->\'user\'->>\'role\' AS actor_role,     -- -> returns JSONB, ->> returns TEXT',
          '       payload #>> \'{user,id}\' AS actor_id          -- #>> traverses path array as TEXT',
          'FROM api_audit_events',
          'WHERE payload @> \'{"user": {"mfa": false}}\'::jsonb -- GIN-indexable containment',
          '  AND payload ?| ARRAY[\'error\', \'items\'];          -- Any top-level key exists'
        ].join('\n'),
        internalsAndGotchas: [
          '`->` returns `JSONB` (preserving quotes on strings like `"admin"`), while `->>` and `#>>` unwrap scalars as SQL `TEXT` (`admin`) and map JSON `null` to SQL `NULL`.',
          'Writing `WHERE payload->>\'region\' = \'us-east-1\'` bypasses a default `USING gin (payload)` index; rewrite equality filters as containment (`WHERE payload @> \'{"region": "us-east-1"}\'::jsonb`) so the planner uses the GIN index.',
          '`?`, `?|`, and `?&` test **top-level object keys** (or string elements of a JSONB array), not arbitrarily nested keys unless applied to a sub-object (`(payload->\'error\') ? \'code\'`).',
          '`jsonb_path_ops` GIN indexes are smaller and faster for `@>` containment, but do not support key-existence operators (`?`, `?|`, `?&`), which require the default `jsonb_ops` operator class.'
        ],
        whenToUse: 'Use `JSONB` with default `GIN` indexing for semi-structured webhook payloads, audit metadata, and polymorphic event attributes alongside typed relational columns.'
      },
      scenario: {
        role: 'Security Detection & Audit Data Engineer',
        incidentOrGoal: 'Security analysts are running slow full-table `->>` string filters across `api_audit_events.payload` to hunt unauthenticated MFA bypasses, gateway errors, and itemized payout calls.',
        stakeholderNeed: 'Rewrite three audit queries using GIN-indexable `@>`, `?|`, and `?&` predicates paired with clean `#>>` and `->>` scalar projections.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — GIN Containment (@>) & Nested Scalar Path Extraction',
          mission: 'Query `api_audit_events` for events where `payload` contains `{"user": {"mfa": false}}` using the GIN-indexable `@>` operator. Project 6 columns in exact order: `event_id`, `tenant_id`, `endpoint`, `actor_id` (nested `user.id` as `TEXT`), `actor_role` (nested `user.role` as `TEXT`), and `region` (top-level `region` as `TEXT`). Sort by `event_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Filter MFA=false events via GIN @> containment and extract scalar TEXT fields',
            'SELECT event_id,',
            '       tenant_id,',
            '       endpoint',
            '       -- TODO: extract user.id AS actor_id, user.role AS actor_role, region AS region',
            'FROM api_audit_events',
            '-- TODO: WHERE payload @> ...',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id,',
            '       tenant_id,',
            '       endpoint,',
            '       payload #>> \'{user,id}\' AS actor_id,',
            '       payload->\'user\'->>\'role\' AS actor_role,',
            '       payload->>\'region\' AS region',
            'FROM api_audit_events',
            'WHERE payload @> \'{"user": {"mfa": false}}\'::jsonb',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          hints: [
            'Use `WHERE payload @> \'{"user": {"mfa": false}}\'::jsonb` so PostgreSQL can probe `idx_api_audit_payload_gin`.',
            'Extract nested scalars as SQL `TEXT` using either `payload #>> \'{user,id}\'` or `payload->\'user\'->>\'id\'`.',
            'Alias the three extracted columns as `actor_id`, `actor_role`, and `region`, ordered by `event_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '@>', flags: '', message: 'Use the GIN-indexable `@>` JSONB containment operator in `WHERE`.' },
              { pattern: '(->>|#>>)', flags: '', message: 'Use `->>` or `#>>` to unwrap JSONB scalars as SQL `TEXT`.' }
            ]
          },
          solutionExplanation: 'Using `payload @> \'{"user": {"mfa": false}}\'::jsonb` lets PostgreSQL match hashed path/value entries in `idx_api_audit_payload_gin` directly, while `#>>` and `->>` unwrap scalar strings without JSON double quotes.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Top-Level Key Existence (?, ?|) for Error & Key-Rotation Triage',
          mission: 'Query `api_audit_events` for rows where `payload` contains **either** top-level key `\'error\'` **or** `\'rotated_keys\'` using `?|`. Project 5 columns in exact order: `event_id`, `tenant_id`, `status_code`, `has_error` (boolean testing whether top-level key `\'error\'` exists via `?`), and `error_code` (`payload #>> \'{error,code}\'` falling back to `\'NONE\'` via `COALESCE`). Sort by `event_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Match payloads having top-level key error OR rotated_keys via ?|',
            'SELECT event_id,',
            '       tenant_id,',
            '       status_code',
            '       -- TODO: (payload ? \'error\') AS has_error',
            '       -- TODO: COALESCE(payload #>> \'{error,code}\', \'NONE\') AS error_code',
            'FROM api_audit_events',
            '-- TODO: WHERE payload ?| ARRAY[\'error\', \'rotated_keys\']',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id,',
            '       tenant_id,',
            '       status_code,',
            '       (payload ? \'error\') AS has_error,',
            '       COALESCE(payload #>> \'{error,code}\', \'NONE\') AS error_code',
            'FROM api_audit_events',
            'WHERE payload ?| ARRAY[\'error\', \'rotated_keys\']',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          hints: [
            'The `?|` operator takes a `JSONB` document on the left and a `TEXT[]` array (`ARRAY[\'error\', \'rotated_keys\']`) on the right.',
            'Project `(payload ? \'error\') AS has_error` to produce a native PostgreSQL `BOOLEAN`.',
            'Wrap `payload #>> \'{error,code}\'` in `COALESCE(..., \'NONE\') AS error_code` and sort by `event_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\?\\|', flags: '', message: 'Use the `?|` any-key existence operator in `WHERE`.' },
              { pattern: '\\?', flags: '', message: 'Use `?` to test key existence on `payload`.' }
            ]
          },
          solutionExplanation: '`?|` probes the default `jsonb_ops` GIN index for any listed top-level key via a bitmap OR scan, while `(payload ? \'error\')` returns a clean boolean distinguishing failure events from key-rotation events.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Multi-Key Existence (?&) & JSONB Array Element Indexing',
          mission: 'Query `api_audit_events` where `payload` possesses **all** top-level keys `ARRAY[\'user\', \'items\']` (via `?&`) and `jsonb_array_length(payload->\'items\') > 0`. Project 5 columns in exact order: `event_id`, `tenant_id`, `actor_role` (`user.role` as `TEXT`), `item_count` (`jsonb_array_length(payload->\'items\')`), and `first_sku` (the `sku` of index `0` inside `items` as `TEXT`). Sort by `event_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Filter non-empty itemized events with ?& and inspect element 0',
            'SELECT event_id,',
            '       tenant_id',
            '       -- TODO: actor_role, item_count, and first_sku (items[0].sku)',
            'FROM api_audit_events',
            '-- TODO: WHERE payload ?& ARRAY[\'user\', \'items\'] AND jsonb_array_length(payload->\'items\') > 0',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id,',
            '       tenant_id,',
            '       payload #>> \'{user,role}\' AS actor_role,',
            '       jsonb_array_length(payload->\'items\') AS item_count,',
            '       payload #>> \'{items,0,sku}\' AS first_sku',
            'FROM api_audit_events',
            'WHERE payload ?& ARRAY[\'user\', \'items\']',
            '  AND jsonb_array_length(payload->\'items\') > 0',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          hints: [
            'Guard `jsonb_array_length(payload->\'items\')` with `payload ?& ARRAY[\'user\', \'items\']` so `items` is guaranteed to exist.',
            'JSONB arrays are **0-indexed** (unlike 1-indexed PostgreSQL native `ARRAY`s): access the first SKU via `payload #>> \'{items,0,sku}\'` or `payload->\'items\'->0->>\'sku\'`.',
            'Project `event_id`, `tenant_id`, `actor_role`, `item_count`, and `first_sku`, sorted by `event_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\?&', flags: '', message: 'Use the `?&` all-keys existence operator.' },
              { pattern: '\\bjsonb_array_length\\s*\\(', flags: 'i', message: 'Use `jsonb_array_length(payload->\'items\')` to count JSON array items.' }
            ]
          },
          solutionExplanation: '`?&` ensures every required key exists via GIN bitmap intersection before calling `jsonb_array_length` (which would raise an error if called on a JSON scalar), and 0-based path `{items,0,sku}` extracts the primary SKU.'
        }
      ]
    },

    /* ========================================================================
       LAB 02: pg-m05-t02 — In-Place JSONB Surgery & Builders
       ======================================================================== */
    {
      id: 'pg-m05-t02',
      slug: 'jsonb-mutations-aggregation-builders',
      moduleId: 'pg-m05',
      title: 'In-Place JSONB Surgery: jsonb_set, Key Removal (-, #-) & jsonb_strip_nulls',
      difficulty: 'Intermediate',
      estimatedMinutes: 15,
      datasetId: 'pg_ops_telemetry',
      clauses: ['jsonb_set', 'jsonb_strip_nulls', '#-', '||'],
      tags: ['jsonb', 'jsonb-set', 'mutations', 'jsonb-build-object'],
      guide: {
        mentalModel: 'Mutating semi-structured documents inside PostgreSQL avoids round-tripping megabytes of JSON to application workers and eliminates read-modify-write lost updates. Binary `JSONB` operators construct a transformed value atomically inside the executor: `||` shallow-merges top-level keys, `-` removes a top-level key (or array element), `#-` deletes an arbitrary nested path (`\'{user,id}\'`), and `jsonb_set(target, path, new_val, create_if_missing)` patches a deep sub-tree.\n\nWhen synthesizing API responses from relational aggregations, `jsonb_build_object(...)` pairs cleanly with `jsonb_strip_nulls(...)` so optional attributes whose SQL values evaluate to `NULL` are omitted rather than serialized as `"last_error": null`.',
        syntaxAnatomy: [
          '-- Deep redaction + top-level merge:',
          'SELECT (payload #- \'{user,id}\') || \'{"reviewed": true}\'::jsonb AS clean_doc',
          'FROM api_audit_events;',
          '',
          '-- Atomic deep mutation with jsonb_set:',
          'UPDATE api_audit_events',
          'SET payload = jsonb_set(payload, \'{error,escalated}\', \'true\'::jsonb, true)',
          'WHERE payload @> \'{"error": {"retryable": true}}\'::jsonb;'
        ].join('\n'),
        internalsAndGotchas: [
          'If the `new_value` argument passed to `jsonb_set(target, path, new_value)` is SQL `NULL`, `jsonb_set` returns `NULL` for the **entire document** (`STRICT` function behavior)! Pass `\'null\'::jsonb` or use `jsonb_set_lax` when a replacement could be SQL `NULL`.',
          'In `jsonb_set(target, \'{a,b}\', val, true)`, `create_if_missing` only creates the **leaf** key `b` if parent object `a` already exists; it will not auto-vivify missing intermediate objects.',
          'The `||` operator performs a **shallow** top-level merge on two `JSONB` objects—nested sub-objects with matching keys are overwritten wholesale, not recursively merged.',
          'Under MVCC, even a 1-byte `jsonb_set` update writes a new heap tuple version (and new TOAST chunks if the column exceeds ~2 KB), so keep high-frequency counters in native scalar columns.'
        ],
        whenToUse: 'Use `#-`, `||`, and `jsonb_set` for PII redaction, atomic flag updates inside JSONB metadata, and `jsonb_build_object` + `jsonb_strip_nulls` to emit compact JSON summaries directly from SQL.'
      },
      scenario: {
        role: 'Compliance & Platform Telemetry Engineer',
        incidentOrGoal: 'Compliance requires stripping actor user IDs before exporting failed audit payloads, SRE automation needs retryable errors marked `escalated: true` atomically, and partner dashboards need compact per-tenant JSONB rollups without null keys.',
        stakeholderNeed: 'Author three JSONB transformation queries using `#-` + `||`, `UPDATE ... jsonb_set`, and `jsonb_strip_nulls(jsonb_build_object(...))`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Nested PII Redaction (#-) & Shallow Merge (||)',
          mission: 'Query `api_audit_events` for failed requests (`status_code >= 400`). Project 3 columns in exact order: `event_id`, `status_code`, and `sanitized_payload` — computed by deleting nested path `{user,id}` from `payload` via `#-` and merging `{"reviewed": true}` at the top level via `||`. Sort by `event_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Redact user.id via #- and append {"reviewed": true} via ||',
            'SELECT event_id,',
            '       status_code',
            '       -- TODO: ((payload #- \'{user,id}\') || \'{"reviewed": true}\'::jsonb) AS sanitized_payload',
            'FROM api_audit_events',
            'WHERE status_code >= 400',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id,',
            '       status_code,',
            '       (payload #- \'{user,id}\') || \'{"reviewed": true}\'::jsonb AS sanitized_payload',
            'FROM api_audit_events',
            'WHERE status_code >= 400',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          hints: [
            'Use `payload #- \'{user,id}\'` (taking a `TEXT[]` path literal) to remove `id` inside `user` while preserving `role` and `mfa`.',
            'Concatenate `|| \'{"reviewed": true}\'::jsonb` to add the top-level boolean attribute.',
            'Alias the transformed JSONB column as `sanitized_payload` and sort by `event_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '#-', flags: '', message: 'Use the `#-` path-deletion operator to strip `{user,id}`.' },
              { pattern: '\\|\\|', flags: '', message: 'Use the `||` JSONB concatenation operator to merge `{"reviewed": true}`.' }
            ]
          },
          solutionExplanation: '`#- \'{user,id}\'` surgically removes only the nested identifier leaf while keeping sibling `user` keys intact, and `||` merges the top-level `reviewed` flag in a single expression.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Atomic Deep Patch with UPDATE & jsonb_set()',
          mission: 'Write an `UPDATE` on `api_audit_events` targeting only events where `payload` contains `{"error": {"retryable": true}}`. Use `jsonb_set` to set nested path `{error,escalated}` to JSON boolean `true` (`\'true\'::jsonb`), creating the leaf key if missing. (Verification inspects the updated rows automatically.)',
          setupSql: '',
          probeSql: 'SELECT event_id, tenant_id, payload #>> \'{error,code}\' AS error_code, (payload #>> \'{error,escalated}\')::boolean AS escalated FROM api_audit_events WHERE payload ? \'error\' ORDER BY event_id ASC;',
          starterCode: [
            '-- Patch error.escalated = true on retryable error events using jsonb_set',
            'UPDATE api_audit_events',
            'SET payload = payload -- TODO: replace with jsonb_set(payload, \'{error,escalated}\', \'true\'::jsonb, true)',
            'WHERE event_id = -1;  -- TODO: match retryable error payloads via @>'
          ].join('\n'),
          solutionCode: [
            'UPDATE api_audit_events',
            'SET payload = jsonb_set(payload, \'{error,escalated}\', \'true\'::jsonb, true)',
            'WHERE payload @> \'{"error": {"retryable": true}}\'::jsonb;'
          ].join('\n'),
          hints: [
            'Call `jsonb_set(payload, \'{error,escalated}\', \'true\'::jsonb, true)` — the 4th argument `true` creates `escalated` inside `error`.',
            'Filter target rows with `WHERE payload @> \'{"error": {"retryable": true}}\'::jsonb` so non-retryable errors (`MFA_REQUIRED` on event `1002`) remain untouched.',
            'No `RETURNING` clause is required; the verification probe checks `api_audit_events` after your `UPDATE`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUPDATE\\s+api_audit_events\\b', flags: 'i', message: 'Perform an `UPDATE` on `api_audit_events`.' },
              { pattern: '\\bjsonb_set\\s*\\(', flags: 'i', message: 'Use `jsonb_set(...)` to patch `{error,escalated}`.' }
            ]
          },
          solutionExplanation: '`jsonb_set(payload, \'{error,escalated}\', \'true\'::jsonb, true)` inserts `"escalated": true` inside the existing `error` object atomically inside PostgreSQL without race-prone client read-modify-write cycles.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Compact Per-Tenant Rollups with jsonb_build_object & jsonb_strip_nulls',
          mission: 'Aggregate `api_audit_events` grouped by `tenant_id` and project 2 columns: `tenant_id` and `tenant_summary` — a `JSONB` object built with `jsonb_build_object` containing exact keys `\'events\'` (`COUNT(*)`), `\'max_latency_ms\'` (`MAX(latency_ms)`), and `\'last_error\'` (`MAX(payload #>> \'{error,code}\')`), wrapped in `jsonb_strip_nulls(...)` so tenants with zero errors omit `\'last_error\'`. Sort by `tenant_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Build per-tenant JSONB summaries and strip null keys cleanly',
            'SELECT tenant_id,',
            '       jsonb_build_object(',
            '         \'events\', COUNT(*)',
            '         -- TODO: add max_latency_ms and last_error, wrapped in jsonb_strip_nulls(...)',
            '       ) AS tenant_summary',
            'FROM api_audit_events',
            'GROUP BY tenant_id',
            'ORDER BY tenant_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT tenant_id,',
            '       jsonb_strip_nulls(',
            '         jsonb_build_object(',
            '           \'events\', COUNT(*),',
            '           \'max_latency_ms\', MAX(latency_ms),',
            '           \'last_error\', MAX(payload #>> \'{error,code}\')',
            '         )',
            '       ) AS tenant_summary',
            'FROM api_audit_events',
            'GROUP BY tenant_id',
            'ORDER BY tenant_id ASC;'
          ].join('\n'),
          hints: [
            'Inside `jsonb_build_object(...)`, pass alternating key/value pairs: `\'events\', COUNT(*), \'max_latency_ms\', MAX(latency_ms), \'last_error\', MAX(payload #>> \'{error,code}\')`.',
            'Wrap the `jsonb_build_object(...)` call in `jsonb_strip_nulls(...)` so `globex` and `umbraco` omit `"last_error": null`.',
            'Group by `tenant_id` and sort by `tenant_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bjsonb_strip_nulls\\s*\\(', flags: 'i', message: 'Wrap the constructed object in `jsonb_strip_nulls(...)`.' },
              { pattern: '\\bjsonb_build_object\\s*\\(', flags: 'i', message: 'Use `jsonb_build_object(...)` to assemble the JSONB summary.' }
            ]
          },
          solutionExplanation: '`jsonb_build_object` serializes SQL aggregates into typed JSON numbers/strings, and `jsonb_strip_nulls` removes `"last_error": null` entries while preserving empty arrays or `false` booleans.'
        }
      ]
    },

    /* ========================================================================
       LAB 03: pg-m05-t03 — SQL/JSON Path Queries & PG 17/18 JSON_TABLE()
       ======================================================================== */
    {
      id: 'pg-m05-t03',
      slug: 'sql-json-path-json-table',
      moduleId: 'pg-m05',
      title: 'SQL/JSON Path Queries (@?, jsonb_path_query) & PG 17/18 JSON_TABLE()',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['JSON_TABLE', 'jsonb_path_query', '@?', 'COLUMNS'],
      tags: ['json-table', 'jsonpath', 'pg17', 'pg18', 'jsonb'],
      guide: {
        mentalModel: 'Containment (`@>`) excels at exact equality inside nested arrays, but cannot express **range predicates** like *"any array item with `fee_cents >= 2000`"*. PostgreSQL\'s SQL/JSON `jsonpath` engine (`@?`, `jsonb_path_exists`, `jsonb_path_query`) evaluates filter expressions such as `\'$.items[*] ? (@.fee_cents >= 2000)\'` directly inside the binary `JSONB` tree—and `@?` can even leverage `GIN` indexes!\n\nStarting in PostgreSQL 17 and refined in PostgreSQL 18, standard SQL/JSON **`JSON_TABLE()`** bridges semi-structured documents and relational algebra in a single declarative `FROM` clause: it unnests nested JSON arrays, assigns `FOR ORDINALITY` positions, casts scalar paths directly to `INTEGER`/`NUMERIC`/`TEXT`, and supports `NESTED PATH` hierarchies without brittle multi-layer `jsonb_array_elements` lateral chains.',
        syntaxAnatomy: [
          '-- 1. GIN-capable SQL/JSON path filter (@?):',
          'SELECT event_id FROM api_audit_events',
          'WHERE payload @? \'$.items[*] ? (@.fee_cents >= 2000)\';',
          '',
          '-- 2. PostgreSQL 17/18 declarative JSON_TABLE():',
          'SELECT e.event_id, jt.item_ord, jt.sku, jt.qty, jt.fee_cents',
          'FROM api_audit_events e,',
          '     JSON_TABLE(e.payload, \'$.items[*]\' COLUMNS (',
          '       item_ord FOR ORDINALITY,',
          '       sku TEXT PATH \'$.sku\',',
          '       qty INTEGER PATH \'$.qty\',',
          '       fee_cents INTEGER PATH \'$.fee_cents\'',
          '     )) AS jt;'
        ].join('\n'),
        internalsAndGotchas: [
          'Do not confuse `@?` (returns `TRUE` if the `jsonpath` returns at least one item, e.g. `\'$.items[*] ? (@.qty > 1)\'`) with `@@` (evaluates a boolean `jsonpath` predicate directly, e.g. `\'$.items[*].qty > 1\'`).',
          'By default, `jsonpath` runs in **lax** mode: `$.items[*]` automatically unwraps scalars or silently returns empty when `.items` is absent—no `CASE WHEN jsonb_typeof(...) = \'array\'` boilerplate needed!',
          'In `JSON_TABLE(doc, \'$.items[*]\' COLUMNS (...))`, rows whose `$.items[*]` produces zero matches are omitted (like an implicit `CROSS JOIN LATERAL`); use `LEFT JOIN LATERAL JSON_TABLE(...) ON TRUE` when parent rows without items must be preserved.',
          'Inside `jsonpath` filter expressions (`? (@.fee_cents >= $min_fee)`), pass dynamic SQL parameters via `jsonb_path_query(payload, path, vars_jsonb)` rather than string-concatenating untrusted input.'
        ],
        whenToUse: 'Use `@?` / `jsonb_path_query` for range or regex predicates inside nested JSON arrays, and PostgreSQL 17/18 `JSON_TABLE()` whenever projecting semi-structured JSON arrays into strongly typed relational rows for joins or aggregations.'
      },
      scenario: {
        role: 'FinTech Billing & Revenue Analytics Engineer',
        incidentOrGoal: 'Finance needs to audit high-fee line items embedded inside `api_audit_events.payload->\'items\'` without maintaining fragile multi-CTE `jsonb_array_elements` casting pipelines.',
        stakeholderNeed: 'Filter high-fee events via `@?`, extract filtered array elements via `jsonb_path_query`, and flatten itemized billing arrays into typed relational columns with PostgreSQL 18 `JSON_TABLE()`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Nested Array Range Filtering with SQL/JSON @?',
          mission: 'Query `api_audit_events` for events whose `payload` has at least one `$.items[*]` element with `fee_cents >= 2000` using the `@?` operator. Project 4 columns in exact order: `event_id`, `tenant_id`, `endpoint`, and `region` (`payload->>\'region\'`). Sort by `event_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Find events containing any item with fee_cents >= 2000 using @?',
            'SELECT event_id,',
            '       tenant_id,',
            '       endpoint,',
            '       payload->>\'region\' AS region',
            'FROM api_audit_events',
            '-- TODO: WHERE payload @? \'$.items[*] ? (@.fee_cents >= 2000)\'',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id,',
            '       tenant_id,',
            '       endpoint,',
            '       payload->>\'region\' AS region',
            'FROM api_audit_events',
            'WHERE payload @? \'$.items[*] ? (@.fee_cents >= 2000)\'',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          hints: [
            'Use the `@?` operator between `payload` (`JSONB`) and a `jsonpath` literal.',
            'Write the path filter `\'$.items[*] ? (@.fee_cents >= 2000)\'`, where `@` refers to each array element inspected.',
            'Keep `ORDER BY event_id ASC` so matching events (`1001`, `1003`, `1010`) appear in deterministic order.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '@\\?', flags: '', message: 'Use the `@?` SQL/JSON `jsonpath` existence operator.' },
              { pattern: '\\$\\.items\\[\\*\\]', flags: '', message: 'Traverse `$.items[*]` in your `jsonpath` expression.' }
            ]
          },
          solutionExplanation: '`payload @? \'$.items[*] ? (@.fee_cents >= 2000)\'` evaluates the numeric inequality directly inside the binary JSONB array in lax mode, cleanly skipping events that have no `items` key.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Extracting Filtered Array Elements via jsonb_path_query()',
          mission: 'Use `CROSS JOIN LATERAL jsonb_path_query(...)` on `api_audit_events` to emit one row per nested item matching `\'$.items[*] ? (@.fee_cents >= 1000)\'`. Project 4 columns in exact order: `event_id`, `tenant_id`, `sku` (`TEXT`), and `fee_cents` (`INTEGER`). Sort by `fee_cents DESC, event_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Unnest only items where fee_cents >= 1000 via jsonb_path_query',
            'SELECT e.event_id,',
            '       e.tenant_id',
            '       -- TODO: item->>\'sku\' AS sku, (item->>\'fee_cents\')::integer AS fee_cents',
            'FROM api_audit_events e',
            '-- TODO: CROSS JOIN LATERAL jsonb_path_query(e.payload, \'$.items[*] ? (@.fee_cents >= 1000)\') AS item',
            'ORDER BY e.event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT e.event_id,',
            '       e.tenant_id,',
            '       item->>\'sku\' AS sku,',
            '       (item->>\'fee_cents\')::integer AS fee_cents',
            'FROM api_audit_events e',
            'CROSS JOIN LATERAL jsonb_path_query(e.payload, \'$.items[*] ? (@.fee_cents >= 1000)\') AS item',
            'ORDER BY fee_cents DESC, e.event_id ASC;'
          ].join('\n'),
          hints: [
            '`jsonb_path_query(e.payload, \'$.items[*] ? (@.fee_cents >= 1000)\')` is a set-returning function that emits each matching JSONB item object; events with zero matches emit zero rows.',
            'Extract `item->>\'sku\' AS sku` and `(item->>\'fee_cents\')::integer AS fee_cents`.',
            'Sort by `fee_cents DESC, e.event_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bjsonb_path_query\\s*\\(', flags: 'i', message: 'Use `jsonb_path_query(...)` to extract matching nested array elements.' }
            ]
          },
          solutionExplanation: 'Unlike `jsonb_array_elements` (which fails on events missing `items` unless guarded), `jsonb_path_query` runs in lax mode—silently skipping non-item events while filtering `fee_cents >= 1000` inside C.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Declarative Relational Projection with PG 17/18 JSON_TABLE()',
          mission: 'Flatten all `$.items[*]` entries from `api_audit_events` using `JSON_TABLE` into typed columns (`item_ord FOR ORDINALITY`, `sku TEXT`, `qty INTEGER`, `fee_cents INTEGER`). Project 7 columns in exact order: `event_id`, `tenant_id`, `item_ord`, `sku`, `qty`, `fee_cents`, and `line_total_usd` (`ROUND((qty * fee_cents)::numeric / 100, 2)`). Sort by `event_id ASC, item_ord ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Project nested $.items[*] into typed relational columns with JSON_TABLE()',
            'SELECT e.event_id,',
            '       e.tenant_id',
            '       -- TODO: jt.item_ord, jt.sku, jt.qty, jt.fee_cents, and line_total_usd',
            'FROM api_audit_events e',
            '-- TODO: CROSS JOIN LATERAL JSON_TABLE(e.payload, \'$.items[*]\' COLUMNS (...)) AS jt',
            'ORDER BY e.event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT e.event_id,',
            '       e.tenant_id,',
            '       jt.item_ord,',
            '       jt.sku,',
            '       jt.qty,',
            '       jt.fee_cents,',
            '       ROUND((jt.qty * jt.fee_cents)::numeric / 100, 2) AS line_total_usd',
            'FROM api_audit_events e',
            'CROSS JOIN LATERAL JSON_TABLE(',
            '  e.payload,',
            '  \'$.items[*]\'',
            '  COLUMNS (',
            '    item_ord FOR ORDINALITY,',
            '    sku TEXT PATH \'$.sku\',',
            '    qty INTEGER PATH \'$.qty\',',
            '    fee_cents INTEGER PATH \'$.fee_cents\'',
            '  )',
            ') AS jt',
            'ORDER BY e.event_id ASC, jt.item_ord ASC;'
          ].join('\n'),
          hints: [
            'Join `JSON_TABLE(e.payload, \'$.items[*]\' COLUMNS (...)) AS jt` via `CROSS JOIN LATERAL` (or comma join).',
            'Declare `item_ord FOR ORDINALITY, sku TEXT PATH \'$.sku\', qty INTEGER PATH \'$.qty\', fee_cents INTEGER PATH \'$.fee_cents\'` inside `COLUMNS (...)`.',
            'Compute `ROUND((jt.qty * jt.fee_cents)::numeric / 100, 2) AS line_total_usd` and sort by `e.event_id ASC, jt.item_ord ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bJSON_TABLE\\s*\\(', flags: 'i', message: 'Use PostgreSQL 17/18 `JSON_TABLE(...)` to project nested array items.' },
              { pattern: '\\bFOR\\s+ORDINALITY\\b', flags: 'i', message: 'Include `item_ord FOR ORDINALITY` inside `COLUMNS (...)`.' }
            ]
          },
          solutionExplanation: '`JSON_TABLE()` parses `$.items[*]`, assigns 1-based `FOR ORDINALITY` positions per parent event, and casts `sku`, `qty`, and `fee_cents` into native SQL types in one declarative operator.'
        }
      ]
    },

    /* ========================================================================
       LAB 04: pg-m05-t04 — Native PostgreSQL ARRAYs & UNNEST WITH ORDINALITY
       ======================================================================== */
    {
      id: 'pg-m05-t04',
      slug: 'native-arrays-unnest-ordinality',
      moduleId: 'pg-m05',
      title: 'Native PostgreSQL ARRAYs (@>, &&, ANY) & UNNEST WITH ORDINALITY',
      difficulty: 'Intermediate',
      estimatedMinutes: 14,
      datasetId: 'pg_ops_telemetry',
      clauses: ['TEXT[]', '@>', '&&', '= ANY', 'UNNEST', 'WITH ORDINALITY'],
      tags: ['arrays', 'unnest', 'ordinality', 'gin'],
      guide: {
        mentalModel: 'When a column holds a homogeneous list of scalar tags, roles, or OAuth scopes (`TEXT[]`, `INT[]`, `UUID[]`), a native PostgreSQL **`ARRAY`** has lower storage overhead and stricter type safety than `JSONB`. Paired with a `GIN` index (`CREATE INDEX ... USING gin (scopes)`), set-algebra operators `@>` (*contains all*), `<@` (*is contained by*), and `&&` (*overlaps any*) execute via fast inverted-list bitmap scans without join tables.\n\nWhen you need relational row-per-element processing, `CROSS JOIN LATERAL UNNEST(scopes) WITH ORDINALITY AS s(scope, pos)` expands the array while guaranteeing the **1-based element index** (`pos`)—crucial because SQL sets are otherwise unordered.',
        syntaxAnatomy: [
          '-- GIN-indexed array overlap (&&) and containment (@>):',
          'SELECT event_id, scopes[1] AS primary_scope, cardinality(scopes) AS n_scopes',
          'FROM api_audit_events',
          'WHERE scopes && ARRAY[\'payments:write\', \'ledger:admin\'];',
          '',
          '-- Order-preserving expansion with WITH ORDINALITY:',
          'SELECT e.event_id, s.scope_pos, s.scope',
          'FROM api_audit_events e',
          'CROSS JOIN LATERAL UNNEST(e.scopes) WITH ORDINALITY AS s(scope, scope_pos);'
        ].join('\n'),
        internalsAndGotchas: [
          'PostgreSQL native `ARRAY` subscripts are **1-based** (`scopes[1]` is the first element, unlike 0-based `JSONB` arrays), and out-of-bounds subscripts silently return `NULL` rather than throwing an error.',
          '`\'audit:read\' = ANY(scopes)` is readable for single-value checks, **but `= ANY(...)` cannot use a `GIN` index**! Rewrite index-critical filters as `scopes @> ARRAY[\'audit:read\']` or `scopes && ARRAY[\'audit:read\']`.',
          'Prefer `cardinality(arr)` over `array_length(arr, 1)`: `array_length(\'{}\'::text[], 1)` returns `NULL` on an empty array, whereas `cardinality(\'{}\'::text[])` cleanly returns `0`!',
          'Arrays do not enforce foreign keys or per-element uniqueness automatically; keep high-churn entities with independent attributes in a normalized child table.'
        ],
        whenToUse: 'Use native typed `ARRAY` columns (`TEXT[]`, `UUID[]`) with `GIN` indexes for OAuth scopes, feature flags, and denormalized tag sets, and `UNNEST(...) WITH ORDINALITY` whenever element order matters.'
      },
      scenario: {
        role: 'IAM & API Security Platform Engineer',
        incidentOrGoal: 'IAM auditors need to identify privileged payout/ledger tokens, inspect primary OAuth scopes without empty-array `NULL` bugs, and flatten `acme` token scopes with exact grant ordering.',
        stakeholderNeed: 'Write three native `TEXT[]` queries combining GIN `&&` / `@>`, `= ANY(...)` + 1-based subscripting, and `UNNEST(...) WITH ORDINALITY`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — GIN-Indexed Scope Overlap (&&), Containment (@>) & cardinality()',
          mission: 'Query `api_audit_events` where `scopes` overlaps (`&&`) `ARRAY[\'payments:write\', \'ledger:admin\']`. Project 5 columns in exact order: `event_id`, `tenant_id`, `endpoint`, `scope_count` (`cardinality(scopes)`), and `has_read_and_write` (boolean testing whether `scopes` contains **both** `\'payments:read\'` and `\'payments:write\'` via `@>`). Sort by `event_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Filter privileged scopes via && and test full read+write containment via @>',
            'SELECT event_id,',
            '       tenant_id,',
            '       endpoint',
            '       -- TODO: cardinality(scopes) AS scope_count',
            '       -- TODO: (scopes @> ARRAY[\'payments:read\', \'payments:write\']) AS has_read_and_write',
            'FROM api_audit_events',
            '-- TODO: WHERE scopes && ARRAY[\'payments:write\', \'ledger:admin\']',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id,',
            '       tenant_id,',
            '       endpoint,',
            '       cardinality(scopes) AS scope_count,',
            '       (scopes @> ARRAY[\'payments:read\', \'payments:write\']) AS has_read_and_write',
            'FROM api_audit_events',
            'WHERE scopes && ARRAY[\'payments:write\', \'ledger:admin\']',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          hints: [
            '`&&` returns `TRUE` when two `TEXT[]` arrays share at least one scope in common.',
            'Use `cardinality(scopes) AS scope_count` so empty arrays return `0` instead of `NULL`.',
            'Compute `(scopes @> ARRAY[\'payments:read\', \'payments:write\']) AS has_read_and_write` and sort by `event_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '&&', flags: '', message: 'Use the GIN-indexable `&&` array overlap operator.' },
              { pattern: '\\bcardinality\\s*\\(', flags: 'i', message: 'Use `cardinality(scopes)` to count array elements safely.' }
            ]
          },
          solutionExplanation: '`scopes && ARRAY[...]` probes `idx_api_audit_scopes_gin` via bitmap OR, `@>` checks subset inclusion, and `cardinality()` avoids the classic `array_length(\'{}\', 1) IS NULL` trap.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Scalar Membership (= ANY) & 1-Based Array Subscripting',
          mission: 'Query `api_audit_events` where `\'audit:read\' = ANY(scopes)` or `\'billing:read\' = ANY(scopes)`. Project 4 columns in exact order: `event_id`, `tenant_id`, `primary_scope` (the first element of `scopes` using PostgreSQL 1-based subscripting), and `scope_count` (`cardinality(scopes)`). Sort by `event_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Match audit:read or billing:read via = ANY(scopes) and grab 1-based scopes[1]',
            'SELECT event_id,',
            '       tenant_id',
            '       -- TODO: scopes[1] AS primary_scope, cardinality(scopes) AS scope_count',
            'FROM api_audit_events',
            '-- TODO: WHERE \'audit:read\' = ANY(scopes) OR \'billing:read\' = ANY(scopes)',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT event_id,',
            '       tenant_id,',
            '       scopes[1] AS primary_scope,',
            '       cardinality(scopes) AS scope_count',
            'FROM api_audit_events',
            'WHERE \'audit:read\' = ANY(scopes)',
            '   OR \'billing:read\' = ANY(scopes)',
            'ORDER BY event_id ASC;'
          ].join('\n'),
          hints: [
            'Write `\'audit:read\' = ANY(scopes)` (the scalar literal goes on the **left** of `= ANY(...)`).',
            'Remember PostgreSQL arrays start at index `1`: `scopes[1] AS primary_scope` (`scopes[0]` returns `NULL`!).',
            'Sort results by `event_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '=\\s*ANY\\s*\\(', flags: 'i', message: 'Use `= ANY(scopes)` to test scalar membership.' },
              { pattern: 'scopes\\s*\\[\\s*1\\s*\\]', flags: 'i', message: 'Access the first element via 1-based `scopes[1]`.' }
            ]
          },
          solutionExplanation: '`= ANY(scopes)` evaluates scalar membership cleanly on small filtered sets, and `scopes[1]` retrieves the first element because PostgreSQL native array bounds default to `1..N`.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Order-Preserving Array Expansion with UNNEST WITH ORDINALITY',
          mission: 'Expand `scopes` for all `api_audit_events` belonging to `tenant_id = \'acme\'` using `CROSS JOIN LATERAL UNNEST(scopes) WITH ORDINALITY`. Project 4 columns in exact order: `event_id`, `endpoint`, `scope_pos` (the 1-based ordinality `BIGINT`), and `scope` (the unnested scope `TEXT`). Sort by `event_id ASC, scope_pos ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Unnest acme scopes while preserving 1-based element order via WITH ORDINALITY',
            'SELECT e.event_id,',
            '       e.endpoint',
            '       -- TODO: s.scope_pos, s.scope',
            'FROM api_audit_events e',
            '-- TODO: CROSS JOIN LATERAL UNNEST(e.scopes) WITH ORDINALITY AS s(scope, scope_pos)',
            'WHERE e.tenant_id = \'acme\'',
            'ORDER BY e.event_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT e.event_id,',
            '       e.endpoint,',
            '       s.scope_pos,',
            '       s.scope',
            'FROM api_audit_events e',
            'CROSS JOIN LATERAL UNNEST(e.scopes) WITH ORDINALITY AS s(scope, scope_pos)',
            'WHERE e.tenant_id = \'acme\'',
            'ORDER BY e.event_id ASC, s.scope_pos ASC;'
          ].join('\n'),
          hints: [
            '`WITH ORDINALITY` appends a `BIGINT` position column **after** the unnested value column: `AS s(scope, scope_pos)`.',
            'Project `s.scope_pos` as the 3rd column and `s.scope` as the 4th column to match the mission schema.',
            'Filter `WHERE e.tenant_id = \'acme\'` and sort by `e.event_id ASC, s.scope_pos ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bUNNEST\\s*\\(', flags: 'i', message: 'Use `UNNEST(...)` to expand the `scopes` array.' },
              { pattern: '\\bWITH\\s+ORDINALITY\\b', flags: 'i', message: 'Include `WITH ORDINALITY` to preserve 1-based element positions.' }
            ]
          },
          solutionExplanation: 'In `FROM` lateral joins, `UNNEST(e.scopes) WITH ORDINALITY AS s(scope, scope_pos)` emits `(element, 1..N)` tuples per parent row so downstream sorts or reconstructions never rely on accidental scan order.'
        }
      ]
    },

    /* ========================================================================
       LAB 05: pg-m05-t05 — Temporal Algebra with tstzrange & Multiranges
       ======================================================================== */
    {
      id: 'pg-m05-t05',
      slug: 'range-multirange-temporal-algebra',
      moduleId: 'pg-m05',
      title: 'Temporal Algebra with tstzrange, Overlap (&&) & Multirange range_agg()',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['TSTZRANGE', '&&', '@>', '*', '-', 'range_agg'],
      tags: ['ranges', 'tstzrange', 'multirange', 'range-agg', 'temporal'],
      guide: {
        mentalModel: 'Storing separate `start_at` and `end_at` columns breeds off-by-one `<=` vs `<` bugs (`start_a < end_b AND start_b < end_a`) and breaks traditional B-Tree indexes on range overlap joins. PostgreSQL\'s first-class **`TSTZRANGE`** models intervals using canonical **half-open `[start, end)`** semantics: adjacent bookings `[09:00, 10:30)` and `[10:30, 12:00)` meet seamlessly at `10:30` with **zero overlap** (`&&` evaluates to `FALSE`), and `GiST` / `SP-GiST` indexes accelerate `@>` and `&&` predicates directly.\n\nPostgreSQL 14+ **Multiranges** (`TSTZMULTIRANGE` and `range_agg()`) close the algebra under union and subtraction: subtracting `range_agg(during)` (all booked intervals) from a full business-day multirange yields the exact set of disjoint free availability slots in one expression!',
        syntaxAnatomy: [
          '-- Overlap (&&) + exact intersection (*):',
          'SELECT r.request_id, b.booking_id, (r.requested_during * b.during) AS overlap_win',
          'FROM booking_requests r',
          'JOIN room_bookings b ON r.room_name = b.room_name AND r.requested_during && b.during;',
          '',
          '-- Multirange free-slot gap algebra:',
          'SELECT room_name,',
          '       unnest(tstzmultirange(tstzrange(\'2025-03-15 09:00+00\', \'2025-03-15 17:00+00\')) - range_agg(during)) AS free_slot',
          'FROM room_bookings GROUP BY room_name;'
        ].join('\n'),
        internalsAndGotchas: [
          'Always use half-open `\'[)\'` bounds (the default for `tstzrange(start, end)`) for continuous timestamps so back-to-back windows `[10:00, 11:00)` and `[11:00, 12:00)` neither overlap nor leave a 1-microsecond gap.',
          'Subtracting a single `TSTZRANGE` from another (`r1 - r2`) raises `result of range difference would not be contiguous` if `r2` splits `r1` in the middle! Cast to `TSTZMULTIRANGE` first (`tstzmultirange(r1) - tstzmultirange(r2)`), which cleanly holds disjoint pieces.',
          '`isempty(r1 * r2)` is `TRUE` when two ranges do not overlap, and `lower()` / `upper()` return `NULL` on an empty range.',
          'Discrete range types (`int4range`, `daterange`) canonicalize closed bounds `[2025-03-01, 2025-03-05]` into `[2025-03-01, 2025-03-06)` automatically; continuous `tstzrange` preserves exact bounds.'
        ],
        whenToUse: 'Use `TSTZRANGE` and `TSTZMULTIRANGE` (`range_agg`) for room/resource scheduling, price-effective-date windows, on-call rotations, and free/busy calendar gap calculation.'
      },
      scenario: {
        role: 'Incident Command & Scheduling Systems Engineer',
        incidentOrGoal: 'War-room coordinators need instant boundary-accurate active room checks, exact conflict durations for pending `booking_requests`, and automated free-slot discovery across `2025-03-15 09:00–17:00 UTC`.',
        stakeholderNeed: 'Deliver three temporal range queries using `@>`, `&&` + `*` range intersection, and `range_agg()` multirange subtraction.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Half-Open [) Boundary Containment (@>) & Range Bounds',
          mission: 'Query `room_bookings` for reservations active at the exact handoff instant `TIMESTAMPTZ \'2025-03-15 10:30:00+00\'` using `@>`. Project 5 columns in exact order: `booking_id`, `room_name`, `booked_by`, `starts_at` (`lower(during)`), and `ends_at` (`upper(during)`). Sort by `booking_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Find rooms occupied at exactly 2025-03-15 10:30:00+00 via half-open @>',
            'SELECT booking_id,',
            '       room_name,',
            '       booked_by',
            '       -- TODO: lower(during) AS starts_at, upper(during) AS ends_at',
            'FROM room_bookings',
            '-- TODO: WHERE during @> TIMESTAMPTZ \'2025-03-15 10:30:00+00\'',
            'ORDER BY booking_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT booking_id,',
            '       room_name,',
            '       booked_by,',
            '       lower(during) AS starts_at,',
            '       upper(during) AS ends_at',
            'FROM room_bookings',
            'WHERE during @> TIMESTAMPTZ \'2025-03-15 10:30:00+00\'',
            'ORDER BY booking_id ASC;'
          ].join('\n'),
          hints: [
            'Use `during @> TIMESTAMPTZ \'2025-03-15 10:30:00+00\'` (range-contains-element operator).',
            'Extract range endpoints using `lower(during) AS starts_at` and `upper(during) AS ends_at`.',
            'Notice booking `1` (`[09:00, 10:30)`) is excluded at `10:30` while booking `2` (`[10:30, 12:00)`) is included!'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '@>', flags: '', message: 'Use `@>` to test timestamp containment within `during`.' },
              { pattern: '\\blower\\s*\\(', flags: 'i', message: 'Use `lower(during)` and `upper(during)` to extract range bounds.' }
            ]
          },
          solutionExplanation: 'Because `during` uses half-open `[start, end)` bounds, `10:30:00+00` is excluded from `[09:00, 10:30)` (booking 1) and included in `[10:30, 12:00)` (booking 2), preventing double-counted handoff instants.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Overlap Detection (&&) & Exact Intersection Duration (*)',
          mission: 'Join `booking_requests r` to `room_bookings b` on matching `room_name` where `r.requested_during` overlaps (`&&`) `b.during`. Project 5 columns in exact order: `request_id`, `room_name`, `requested_by`, `conflicting_booking_id` (`b.booking_id`), and `overlap_minutes` (exact minutes of the intersection range `r.requested_during * b.during` as `INTEGER`). Sort by `request_id ASC, conflicting_booking_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Detect colliding booking requests via && and measure (r.requested_during * b.during)',
            'SELECT r.request_id,',
            '       r.room_name,',
            '       r.requested_by,',
            '       b.booking_id AS conflicting_booking_id',
            '       -- TODO: compute overlap_minutes from (r.requested_during * b.during)',
            'FROM booking_requests r',
            'JOIN room_bookings b',
            '  ON r.room_name = b.room_name',
            ' -- TODO: AND r.requested_during && b.during',
            'ORDER BY r.request_id ASC, b.booking_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT r.request_id,',
            '       r.room_name,',
            '       r.requested_by,',
            '       b.booking_id AS conflicting_booking_id,',
            '       (EXTRACT(EPOCH FROM (upper(r.requested_during * b.during) - lower(r.requested_during * b.during))) / 60)::integer AS overlap_minutes',
            'FROM booking_requests r',
            'JOIN room_bookings b',
            '  ON r.room_name = b.room_name',
            ' AND r.requested_during && b.during',
            'ORDER BY r.request_id ASC, conflicting_booking_id ASC;'
          ].join('\n'),
          hints: [
            'Add `AND r.requested_during && b.during` to the `JOIN` condition so only overlapping same-room pairs match.',
            'The `*` operator on two `TSTZRANGE` values returns their exact intersection `TSTZRANGE` (`r.requested_during * b.during`).',
            'Compute `(EXTRACT(EPOCH FROM (upper(inter) - lower(inter))) / 60)::integer AS overlap_minutes` where `inter` is `r.requested_during * b.during`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '&&', flags: '', message: 'Use the `&&` range overlap operator.' },
              { pattern: 'requested_during\\s*\\*\\s*b\\.during|b\\.during\\s*\\*\\s*r\\.requested_during', flags: 'i', message: 'Use the `*` range intersection operator to compute the exact overlap window.' }
            ]
          },
          solutionExplanation: 'Request `201` (`[10:00, 11:00)`) collides with **both** booking `1` (`30` min) and booking `2` (`30` min); `*` computes each clipped intersection range without ugly nested `LEAST`/`GREATEST` formulas.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Free Availability Discovery with range_agg() & Multirange Subtraction',
          mission: 'For each `room_name` in `room_bookings`, subtract `range_agg(during)` from the full business window `tstzmultirange(tstzrange(\'2025-03-15 09:00:00+00\', \'2025-03-15 17:00:00+00\', \'[)\'))` and `unnest` the resulting free intervals. Project 4 columns in exact order: `room_name`, `free_start` (`lower(free_slot)`), `free_end` (`upper(free_slot)`), and `free_minutes` (slot duration in integer minutes). Sort by `room_name ASC, free_start ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Subtract booked multirange from [09:00, 17:00) per room and unnest free gaps',
            'WITH room_free AS (',
            '  SELECT room_name,',
            '         range_agg(during) AS busy_mr',
            '  FROM room_bookings',
            '  GROUP BY room_name',
            ')',
            'SELECT room_name',
            '       -- TODO: unnest (business_window_multirange - busy_mr) AS free_slot',
            '       -- TODO: project free_start, free_end, and free_minutes',
            'FROM room_free',
            'ORDER BY room_name ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH room_free AS (',
            '  SELECT room_name,',
            '         tstzmultirange(tstzrange(\'2025-03-15 09:00:00+00\', \'2025-03-15 17:00:00+00\', \'[)\')) - range_agg(during) AS free_mr',
            '  FROM room_bookings',
            '  GROUP BY room_name',
            ')',
            'SELECT rf.room_name,',
            '       lower(g.free_slot) AS free_start,',
            '       upper(g.free_slot) AS free_end,',
            '       (EXTRACT(EPOCH FROM (upper(g.free_slot) - lower(g.free_slot))) / 60)::integer AS free_minutes',
            'FROM room_free rf',
            'CROSS JOIN LATERAL unnest(rf.free_mr) AS g(free_slot)',
            'ORDER BY rf.room_name ASC, free_start ASC;'
          ].join('\n'),
          hints: [
            '`range_agg(during)` merges overlapping/adjacent `TSTZRANGE` rows per `room_name` into a canonical `TSTZMULTIRANGE` (collapsing `war-room-alpha` `[09:00,10:30)` + `[10:30,12:00)` into `[09:00,12:00)`).',
            'Subtract `range_agg(during)` from `tstzmultirange(tstzrange(\'2025-03-15 09:00:00+00\', \'2025-03-15 17:00:00+00\', \'[)\'))` using `-`.',
            'Expand `free_mr` via `CROSS JOIN LATERAL unnest(rf.free_mr) AS g(free_slot)` and project `room_name`, `free_start`, `free_end`, and `free_minutes`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\brange_agg\\s*\\(', flags: 'i', message: 'Use `range_agg(during)` to aggregate room bookings into a multirange.' },
              { pattern: '\\btstzmultirange\\s*\\(', flags: 'i', message: 'Construct a `tstzmultirange(...)` for the `[09:00, 17:00)` day window.' }
            ]
          },
          solutionExplanation: '`range_agg(during)` coalesces contiguous bookings (`[09:00,10:30)` + `[10:30,12:00)` -> `[09:00,12:00)`), and multirange subtraction `-` slices `[09:00,17:00)` into exact disjoint open slots without complex window-function LEAD/LAG gymnastics.'
        }
      ]
    },

    /* ========================================================================
       LAB 06: pg-m05-t06 — Zero-Race Scheduling with btree_gist & EXCLUDE
       ======================================================================== */
    {
      id: 'pg-m05-t06',
      slug: 'btree-gist-exclusion-constraints',
      moduleId: 'pg-m05',
      title: 'Zero-Race Scheduling with btree_gist & EXCLUDE USING gist',
      difficulty: 'Advanced',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['EXCLUDE USING gist', 'btree_gist', 'WITH =', 'WITH &&'],
      tags: ['exclude-constraint', 'gist', 'btree-gist', 'concurrency', 'ranges'],
      guide: {
        mentalModel: 'Application-level *"SELECT count(*) ... IF 0 THEN INSERT"* checks fail under `READ COMMITTED` concurrency: two transactions both observe zero conflicts and commit overlapping reservations. A `UNIQUE` constraint only forbids **equality** (`=`), whereas PostgreSQL\'s **`EXCLUDE USING gist`** generalizes uniqueness to **arbitrary symmetric operators**—forbidding any two rows where `room_name = room_name` **AND** `during && during` simultaneously.\n\nBecause native `GiST` only ships operator classes for geometric/range types out of the box, enabling the **`btree_gist`** extension teaches `GiST` how to index scalar equality (`TEXT`, `INT`, `UUID` `WITH =`) alongside `TSTZRANGE WITH &&` inside a single composite GiST index—blocking concurrent race conditions at the index-page lock level!',
        syntaxAnatomy: [
          'CREATE EXTENSION IF NOT EXISTS btree_gist;',
          '',
          'CREATE TABLE oncall_shifts (',
          '  shift_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
          '  service_name TEXT NOT NULL,',
          '  engineer TEXT NOT NULL,',
          '  shift_window TSTZRANGE NOT NULL,',
          '  status TEXT NOT NULL DEFAULT \'active\',',
          '  CONSTRAINT no_overlapping_active_shifts',
          '    EXCLUDE USING gist (service_name WITH =, shift_window WITH &&)',
          '    WHERE (status = \'active\')',
          ');'
        ].join('\n'),
        internalsAndGotchas: [
          'Without `CREATE EXTENSION btree_gist`, declaring `EXCLUDE USING gist (service_name WITH =, ...)` fails with `data type text has no default operator class for access method "gist"`.',
          'Always attach a partial `WHERE (status = \'active\')` (or `status <> \'cancelled\'`) clause when rows can be soft-cancelled—otherwise historical cancelled bookings block future re-bookings of the same slot!',
          'In `pg_constraint`, exclusion constraints carry `contype = \'x\'` (alongside `\'p\'` PK, `\'u\'` UNIQUE, `\'f\'` FK, `\'c\'` CHECK) and automatically create a backing GiST index (`conindid`).',
          '`INSERT ... ON CONFLICT DO NOTHING` supports `ON CONFLICT ON CONSTRAINT <exclude_constraint_name> DO NOTHING`, though `DO UPDATE` is restricted to unique/PK arbiters because multiple existing rows could overlap a single incoming range.'
        ],
        whenToUse: 'Use `btree_gist` + `EXCLUDE USING gist (... WITH =, ... WITH &&)` whenever invariants forbid overlapping time/numeric ranges per resource, room, tenant, or contract.'
      },
      scenario: {
        role: 'Principal Database Reliability Engineer',
        incidentOrGoal: 'Platform teams need to pre-screen conflict-free war-room requests, deploy a new `oncall_shifts` table whose cancelled shifts do not block active replacements, and audit catalog `contype = \'x\'` invariants.',
        stakeholderNeed: 'Filter conflict-free `booking_requests`, author a partial `EXCLUDE USING gist` table definition, and introspect `pg_constraint` exclusion metadata.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Pre-Screening Conflict-Free Requests with NOT EXISTS & &&',
          mission: 'Query `booking_requests r` for requests that have **no** overlapping (`&&`) reservation for the same `room_name` in `room_bookings`. Project 5 columns in exact order: `request_id`, `room_name`, `requested_by`, `priority`, and `slot_start` (`lower(r.requested_during)`). Sort by `priority ASC, request_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Find booking_requests that will NOT violate room_bookings exclusion constraint',
            'SELECT r.request_id,',
            '       r.room_name,',
            '       r.requested_by,',
            '       r.priority,',
            '       lower(r.requested_during) AS slot_start',
            'FROM booking_requests r',
            '-- TODO: WHERE NOT EXISTS (overlapping row in room_bookings b)',
            'ORDER BY r.priority ASC, r.request_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT r.request_id,',
            '       r.room_name,',
            '       r.requested_by,',
            '       r.priority,',
            '       lower(r.requested_during) AS slot_start',
            'FROM booking_requests r',
            'WHERE NOT EXISTS (',
            '  SELECT 1',
            '  FROM room_bookings b',
            '  WHERE b.room_name = r.room_name',
            '    AND b.during && r.requested_during',
            ')',
            'ORDER BY r.priority ASC, r.request_id ASC;'
          ].join('\n'),
          hints: [
            'Use a correlated `WHERE NOT EXISTS (...)` anti-join against `room_bookings b`.',
            'Inside the subquery, match both `b.room_name = r.room_name` and `b.during && r.requested_during`.',
            'Sort by `r.priority ASC, r.request_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bNOT\\s+EXISTS\\b', flags: 'i', message: 'Use `NOT EXISTS` to filter out colliding requests.' },
              { pattern: '&&', flags: '', message: 'Use `&&` to check `TSTZRANGE` overlap against `room_bookings`.' }
            ]
          },
          solutionExplanation: 'The `NOT EXISTS` anti-join probes `no_overlapping_room_bookings`\'s GiST index `(room_name, during)` directly, surfacing the 4 conflict-free requests (`208`, `202`, `204`, `206`).'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Partial EXCLUDE USING gist Constraint for Soft-Cancelled Shifts',
          mission: 'Create table `oncall_shifts` (`shift_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY`, `service_name TEXT NOT NULL`, `engineer TEXT NOT NULL`, `shift_window TSTZRANGE NOT NULL`, `status TEXT NOT NULL DEFAULT \'active\'`) with named partial exclusion constraint `no_overlapping_active_shifts` enforcing `EXCLUDE USING gist (service_name WITH =, shift_window WITH &&) WHERE (status = \'active\')`. Then insert two overlapping shifts for `\'ledger-api\'`: `(\'ledger-api\', \'alice\', \'[2025-03-16 08:00:00+00, 2025-03-16 16:00:00+00)\', \'cancelled\')` and `(\'ledger-api\', \'bob\', \'[2025-03-16 12:00:00+00, 2025-03-16 20:00:00+00)\', \'active\')`.',
          setupSql: 'DROP TABLE IF EXISTS oncall_shifts;',
          probeSql: 'SELECT s.service_name, s.engineer, s.status, lower(s.shift_window) AS starts_at, EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conname = \'no_overlapping_active_shifts\' AND c.contype = \'x\') AS has_exclude_constraint FROM oncall_shifts s ORDER BY s.shift_id ASC;',
          starterCode: [
            '-- Create oncall_shifts with partial EXCLUDE USING gist (...) WHERE (status = \'active\')',
            'CREATE TABLE oncall_shifts (',
            '  shift_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
            '  service_name TEXT NOT NULL,',
            '  engineer TEXT NOT NULL,',
            '  shift_window TSTZRANGE NOT NULL,',
            '  status TEXT NOT NULL DEFAULT \'active\'',
            '  -- TODO: CONSTRAINT no_overlapping_active_shifts EXCLUDE USING gist ... WHERE (status = \'active\')',
            ');',
            '',
            '-- TODO: INSERT alice (cancelled) and bob (active) overlapping shifts for ledger-api'
          ].join('\n'),
          solutionCode: [
            'CREATE TABLE oncall_shifts (',
            '  shift_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,',
            '  service_name TEXT NOT NULL,',
            '  engineer TEXT NOT NULL,',
            '  shift_window TSTZRANGE NOT NULL,',
            '  status TEXT NOT NULL DEFAULT \'active\',',
            '  CONSTRAINT no_overlapping_active_shifts',
            '    EXCLUDE USING gist (service_name WITH =, shift_window WITH &&)',
            '    WHERE (status = \'active\')',
            ');',
            '',
            'INSERT INTO oncall_shifts (service_name, engineer, shift_window, status) VALUES',
            '  (\'ledger-api\', \'alice\', \'[2025-03-16 08:00:00+00, 2025-03-16 16:00:00+00)\', \'cancelled\'),',
            '  (\'ledger-api\', \'bob\', \'[2025-03-16 12:00:00+00, 2025-03-16 20:00:00+00)\', \'active\');'
          ].join('\n'),
          hints: [
            'Inside `CREATE TABLE`, add `CONSTRAINT no_overlapping_active_shifts EXCLUDE USING gist (service_name WITH =, shift_window WITH &&) WHERE (status = \'active\')`. (`btree_gist` is already preloaded!)',
            'Insert `alice` with `status = \'cancelled\'` (`[2025-03-16 08:00:00+00, 2025-03-16 16:00:00+00)`) and `bob` with `status = \'active\'` (`[2025-03-16 12:00:00+00, 2025-03-16 20:00:00)`).',
            'Because `alice`\'s shift is `\'cancelled\'`, the partial GiST index excludes her row, allowing `bob`\'s overlapping active shift to commit cleanly.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bEXCLUDE\\s+USING\\s+gist\\b', flags: 'i', message: 'Define an `EXCLUDE USING gist` constraint.' },
              { pattern: '\\bWHERE\\s*\\(\\s*status\\s*=\\s*\'active\'\\s*\\)', flags: 'i', message: 'Include partial predicate `WHERE (status = \'active\')` on the exclusion constraint.' }
            ]
          },
          solutionExplanation: 'Combining `btree_gist` (`service_name WITH =`) with `shift_window WITH &&` and `WHERE (status = \'active\')` enforces zero-race active scheduling while keeping cancelled history in the same table.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Auditing Exclusion Constraints in pg_constraint (contype = \'x\')',
          mission: 'Query `pg_constraint c` joined to `pg_class rel` (`c.conrelid = rel.oid`), `pg_namespace nsp` (`rel.relnamespace = nsp.oid`), `pg_class idx` (`c.conindid = idx.oid`), and `pg_am am` (`idx.relam = am.oid`) for exclusion constraints (`c.contype = \'x\'`) in schema `nsp.nspname = \'pg_ops\'`. Project 4 columns in exact order: `table_name` (`rel.relname`), `constraint_name` (`c.conname`), `index_am` (`am.amname`), and `constraint_def` (`pg_get_constraintdef(c.oid)`). Sort by `table_name ASC, constraint_name ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Introspect pg_ops exclusion constraints (contype = \'x\') and their backing index AM',
            'SELECT rel.relname AS table_name,',
            '       c.conname AS constraint_name',
            '       -- TODO: am.amname AS index_am, pg_get_constraintdef(c.oid) AS constraint_def',
            'FROM pg_constraint c',
            'JOIN pg_class rel ON rel.oid = c.conrelid',
            'JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace',
            '-- TODO: join c.conindid -> pg_class idx -> pg_am am, filter contype = \'x\' AND nspname = \'pg_ops\'',
            'ORDER BY table_name ASC, constraint_name ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT rel.relname AS table_name,',
            '       c.conname AS constraint_name,',
            '       am.amname AS index_am,',
            '       pg_get_constraintdef(c.oid) AS constraint_def',
            'FROM pg_constraint c',
            'JOIN pg_class rel ON rel.oid = c.conrelid',
            'JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace',
            'JOIN pg_class idx ON idx.oid = c.conindid',
            'JOIN pg_am am ON am.oid = idx.relam',
            'WHERE c.contype = \'x\'',
            '  AND nsp.nspname = \'pg_ops\'',
            'ORDER BY table_name ASC, constraint_name ASC;'
          ].join('\n'),
          hints: [
            'Join `pg_class idx ON idx.oid = c.conindid` to locate the backing constraint index, then `JOIN pg_am am ON am.oid = idx.relam`.',
            'Filter `WHERE c.contype = \'x\' AND nsp.nspname = \'pg_ops\'`.',
            'Project `pg_get_constraintdef(c.oid) AS constraint_def` and sort by `table_name ASC, constraint_name ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: 'contype\\s*=\\s*\'x\'', flags: 'i', message: 'Filter `pg_constraint` on `contype = \'x\'` (exclusion constraints).' },
              { pattern: '\\bpg_get_constraintdef\\s*\\(', flags: 'i', message: 'Use `pg_get_constraintdef(c.oid)` to reconstruct the constraint definition.' }
            ]
          },
          solutionExplanation: '`pg_constraint.conindid` links every `contype = \'x\'` exclusion constraint to its physical `gist` (or `spgist`) index OID, while `pg_get_constraintdef()` reconstructs exact operator-per-column clauses.'
        }
      ]
    },

    /* ========================================================================
       LAB 07: pg-m05-t07 — Native Full-Text Search (tsvector, tsquery, Ranking)
       ======================================================================== */
    {
      id: 'pg-m05-t07',
      slug: 'full-text-search-tsvector-ranking',
      moduleId: 'pg-m05',
      title: 'Native Full-Text Search: Weighted tsvector, websearch_to_tsquery & ts_rank_cd',
      difficulty: 'Intermediate',
      estimatedMinutes: 16,
      datasetId: 'pg_ops_telemetry',
      clauses: ['TSVECTOR', '@@', 'websearch_to_tsquery', 'ts_rank_cd', 'ts_headline'],
      tags: ['full-text-search', 'tsvector', 'tsquery', 'gin', 'search'],
      guide: {
        mentalModel: '`ILIKE \'%wraparound%\'` forces a sequential heap scan and misses morphological inflections (`freezing` vs `freeze`, `connections` vs `connection`). PostgreSQL\'s built-in **Full-Text Search (FTS)** pipeline tokenizes documents, strips stop-words, stems lexemes using language dictionaries (`\'english\'`), records word positions with `A`/`B`/`C`/`D` importance weights inside a **`TSVECTOR`**, and indexes lexemes in a **`GIN`** inverted index (`idx_search_docs_tsv`).\n\nAt query time, **`websearch_to_tsquery(\'english\', user_input)`** safely parses human search syntax (`"quoted phrases"`, `OR`, `-negation`) without ever throwing syntax errors on stray punctuation, **`@@`** executes a sub-millisecond GIN bitmap lookup, **`ts_rank_cd()`** scores cover-density proximity across weighted fields, and **`ts_headline()`** renders highlighted excerpt snippets on the top-K hits.',
        syntaxAnatomy: [
          'WITH q AS (',
          '  SELECT websearch_to_tsquery(\'english\', \'"idle in transaction" OR replication -debezium\') AS tsq',
          ')',
          'SELECT d.doc_id, d.title,',
          '       ROUND(ts_rank_cd(d.search_tsv, q.tsq)::numeric, 4) AS rank_score,',
          '       ts_headline(\'english\', d.body, q.tsq, \'StartSel=<mark>, StopSel=</mark>\') AS snippet',
          'FROM search_documents d CROSS JOIN q',
          'WHERE d.search_tsv @@ q.tsq',
          'ORDER BY rank_score DESC;'
        ].join('\n'),
        internalsAndGotchas: [
          'Never pass raw user search strings to `to_tsquery()`—unbalanced quotes or `&`/`!` operators throw a SQL syntax error! Always use `websearch_to_tsquery()` (or `plainto_tsquery()`).',
          'Store weighted vectors in a **`GENERATED ALWAYS AS (...) STORED`** `TSVECTOR` column (`search_tsv`) indexed with `GIN`, or match the **exact** `to_tsvector(\'english\', ...)` language config of an expression index—using single-arg `to_tsvector(col)` (`STABLE`, depends on `default_text_search_config`) prevents `GENERATED STORED` and breaks expression index matching!',
          '`ts_headline()` re-tokenizes raw document text in CPU; apply it **only** to the filtered/paginated `LIMIT` rows (e.g., via an outer query or post-`WHERE` target list), never across millions of unindexed rows.',
          '`setweight(tsv, \'A\')` assigns weight labels whose default `ts_rank_cd` multipliers are `{D=0.1, C=0.2, B=0.4, A=1.0}`, making title hits outrank body mentions naturally.'
        ],
        whenToUse: 'Use PostgreSQL FTS (`GENERATED ALWAYS AS ... TSVECTOR` + `GIN` + `websearch_to_tsquery`) for product documentation, incident runbooks, ticket search, and hybrid BM25/semantic RAG retrieval without operating an external Elasticsearch cluster.'
      },
      scenario: {
        role: 'Internal Developer Portal Search Engineer',
        incidentOrGoal: 'On-call engineers searching `search_documents` during outages need phrase/negation queries (`"idle in transaction" OR replication -debezium`), service-boosted ranking, and `<mark>`-highlighted runbook snippets.',
        stakeholderNeed: 'Build three FTS queries using `websearch_to_tsquery` + `ts_rank_cd`, custom 3-tier `setweight` vectors, and `ts_headline` snippet generation.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Phrase & Negation Search with websearch_to_tsquery & ts_rank_cd',
          mission: 'Search `search_documents` against stored column `search_tsv` using `websearch_to_tsquery(\'english\', \'"idle in transaction" OR replication -debezium\')` and `@@`. Project 4 columns in exact order: `doc_id`, `category`, `title`, and `rank_score` (`ROUND(ts_rank_cd(search_tsv, tsq)::numeric, 4)`). Sort by `rank_score DESC, doc_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Match phrase "idle in transaction" OR replication excluding debezium',
            'WITH q AS (',
            '  SELECT websearch_to_tsquery(\'english\', \'"idle in transaction" OR replication -debezium\') AS tsq',
            ')',
            'SELECT d.doc_id,',
            '       d.category,',
            '       d.title',
            '       -- TODO: ROUND(ts_rank_cd(d.search_tsv, q.tsq)::numeric, 4) AS rank_score',
            'FROM search_documents d',
            'CROSS JOIN q',
            '-- TODO: WHERE d.search_tsv @@ q.tsq',
            'ORDER BY d.doc_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH q AS (',
            '  SELECT websearch_to_tsquery(\'english\', \'"idle in transaction" OR replication -debezium\') AS tsq',
            ')',
            'SELECT d.doc_id,',
            '       d.category,',
            '       d.title,',
            '       ROUND(ts_rank_cd(d.search_tsv, q.tsq)::numeric, 4) AS rank_score',
            'FROM search_documents d',
            'CROSS JOIN q',
            'WHERE d.search_tsv @@ q.tsq',
            'ORDER BY rank_score DESC, d.doc_id ASC;'
          ].join('\n'),
          hints: [
            'Filter `WHERE d.search_tsv @@ q.tsq` so PostgreSQL uses `idx_search_docs_tsv` (`GIN`).',
            'Compute cover-density rank via `ROUND(ts_rank_cd(d.search_tsv, q.tsq)::numeric, 4) AS rank_score`.',
            'Sort by `rank_score DESC, d.doc_id ASC` — notice doc `5` (which mentions Debezium) is excluded by `-debezium`!'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '@@', flags: '', message: 'Use the `@@` full-text match operator.' },
              { pattern: '\\bwebsearch_to_tsquery\\s*\\(', flags: 'i', message: 'Use `websearch_to_tsquery(\'english\', ...)` to parse phrase/OR/negation syntax.' },
              { pattern: '\\bts_rank_cd\\s*\\(', flags: 'i', message: 'Use `ts_rank_cd(...)` to score matching documents.' }
            ]
          },
          solutionExplanation: '`websearch_to_tsquery` compiles `"idle in transaction" OR replication -debezium` into positional `<->` phrase, `|` OR, and `!` NOT operators, ranking title-weighted doc `2` above body-matched doc `1` while filtering out doc `5`.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Custom Multi-Column Boosting with setweight()',
          mission: 'Construct a custom weighted `tsvector` per row of `search_documents` combining `setweight(to_tsvector(\'english\', service_name), \'A\') || setweight(to_tsvector(\'english\', title), \'B\') || setweight(to_tsvector(\'english\', body), \'C\')`. Filter rows matching `websearch_to_tsquery(\'english\', \'postgres OR index\')` via `@@`, and project 4 columns in exact order: `doc_id`, `service_name`, `title`, and `weighted_rank` (`ROUND(ts_rank_cd(custom_tsv, tsq)::numeric, 4)`). Sort by `weighted_rank DESC, doc_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Build custom A/B/C weighted tsvector across service_name, title, and body',
            'WITH docs AS (',
            '  SELECT doc_id,',
            '         service_name,',
            '         title,',
            '         -- TODO: combine service_name (A), title (B), and body (C) with setweight + ||',
            '         to_tsvector(\'english\', title) AS custom_tsv,',
            '         websearch_to_tsquery(\'english\', \'postgres OR index\') AS tsq',
            '  FROM search_documents',
            ')',
            'SELECT doc_id, service_name, title',
            '       -- TODO: ROUND(ts_rank_cd(custom_tsv, tsq)::numeric, 4) AS weighted_rank',
            'FROM docs',
            '-- TODO: WHERE custom_tsv @@ tsq',
            'ORDER BY doc_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH docs AS (',
            '  SELECT doc_id,',
            '         service_name,',
            '         title,',
            '         setweight(to_tsvector(\'english\', service_name), \'A\') ||',
            '         setweight(to_tsvector(\'english\', title), \'B\') ||',
            '         setweight(to_tsvector(\'english\', body), \'C\') AS custom_tsv,',
            '         websearch_to_tsquery(\'english\', \'postgres OR index\') AS tsq',
            '  FROM search_documents',
            ')',
            'SELECT doc_id,',
            '       service_name,',
            '       title,',
            '       ROUND(ts_rank_cd(custom_tsv, tsq)::numeric, 4) AS weighted_rank',
            'FROM docs',
            'WHERE custom_tsv @@ tsq',
            'ORDER BY weighted_rank DESC, doc_id ASC;'
          ].join('\n'),
          hints: [
            'Concatenate the three weighted vectors with `||`: `setweight(to_tsvector(\'english\', service_name), \'A\') || setweight(to_tsvector(\'english\', title), \'B\') || setweight(to_tsvector(\'english\', body), \'C\')`.',
            'Filter `WHERE custom_tsv @@ tsq` and compute `ROUND(ts_rank_cd(custom_tsv, tsq)::numeric, 4) AS weighted_rank`.',
            'Sort by `weighted_rank DESC, doc_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bsetweight\\s*\\(', flags: 'i', message: 'Use `setweight(...)` to assign `A`, `B`, and `C` field weights.' },
              { pattern: '\\bts_rank_cd\\s*\\(', flags: 'i', message: 'Score `custom_tsv` with `ts_rank_cd(...)`.' }
            ]
          },
          solutionExplanation: 'Concatenating `tsvector`s via `||` offsets lexeme positions cleanly so phrase searches never bleed across column boundaries, while `A`/`B`/`C` weights boost `postgres-core` index documents to the top.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Highlighted Search Excerpts with ts_headline()',
          mission: 'Filter `search_documents` where `search_tsv @@ websearch_to_tsquery(\'english\', \'lock OR skip\')`. Project 4 columns in exact order: `doc_id`, `category`, `title`, and `snippet` generated by `ts_headline(\'english\', body, websearch_to_tsquery(\'english\', \'lock OR skip\'), \'StartSel=<mark>, StopSel=</mark>, MaxWords=15, MinWords=6\')`. Sort by `doc_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Render <mark>...</mark> highlighted snippets for matching runbooks/postmortems',
            'WITH q AS (',
            '  SELECT websearch_to_tsquery(\'english\', \'lock OR skip\') AS tsq',
            ')',
            'SELECT d.doc_id,',
            '       d.category,',
            '       d.title',
            '       -- TODO: ts_headline(\'english\', d.body, q.tsq, \'StartSel=<mark>, StopSel=</mark>, MaxWords=15, MinWords=6\') AS snippet',
            'FROM search_documents d',
            'CROSS JOIN q',
            'WHERE d.search_tsv @@ q.tsq',
            'ORDER BY d.doc_id ASC;'
          ].join('\n'),
          solutionCode: [
            'WITH q AS (',
            '  SELECT websearch_to_tsquery(\'english\', \'lock OR skip\') AS tsq',
            ')',
            'SELECT d.doc_id,',
            '       d.category,',
            '       d.title,',
            '       ts_headline(\'english\', d.body, q.tsq, \'StartSel=<mark>, StopSel=</mark>, MaxWords=15, MinWords=6\') AS snippet',
            'FROM search_documents d',
            'CROSS JOIN q',
            'WHERE d.search_tsv @@ q.tsq',
            'ORDER BY d.doc_id ASC;'
          ].join('\n'),
          hints: [
            'Pass `\'english\'`, `d.body`, `q.tsq`, and the exact options string `\'StartSel=<mark>, StopSel=</mark>, MaxWords=15, MinWords=6\'` to `ts_headline(...)`.',
            'Notice stemming highlights both `SKIP` and `LOCKED` / `locks` automatically!',
            'Alias the 4th column as `snippet` and sort by `d.doc_id ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '\\bts_headline\\s*\\(', flags: 'i', message: 'Use `ts_headline(...)` to generate highlighted body excerpts.' },
              { pattern: 'StartSel=<mark>', flags: '', message: 'Configure `StartSel=<mark>, StopSel=</mark>` inside `ts_headline` options.' }
            ]
          },
          solutionExplanation: '`ts_headline` locates dense clusters of stemmed query lexemes (`lock` matching `LOCKED` and `locks`) inside the raw `body` text of the 2 GIN-matched rows and wraps them in `<mark>` tags.'
        }
      ]
    },

    /* ========================================================================
       LAB 08: pg-m05-t08 — Typo-Tolerant pg_trgm & Hierarchical ltree
       ======================================================================== */
    {
      id: 'pg-m05-t08',
      slug: 'pg-trgm-fuzzy-search-ltree',
      moduleId: 'pg-m05',
      title: 'Typo-Tolerant Search with pg_trgm (%, <->) & Hierarchical ltree (<@)',
      difficulty: 'Advanced',
      estimatedMinutes: 18,
      datasetId: 'pg_ops_telemetry',
      clauses: ['similarity', '%', '<->', 'LTREE', '<@', 'nlevel'],
      tags: ['pg-trgm', 'fuzzy-search', 'trigrams', 'ltree', 'hierarchies'],
      guide: {
        mentalModel: 'Dictionary-based Full-Text Search fails when an engineer under stress types `Autovaccum Transacton Wraparond`—misspelled tokens do not stem to dictionary words. **`pg_trgm`** decomposes strings into overlapping 3-character **trigrams** (`"  a"`, `" au"`, `"aut"`, `"uto"`, ...), allowing `GIN` and `GiST` indexes (`gin_trgm_ops` / `gist_trgm_ops`) to accelerate fuzzy `%` threshold matches, KNN trigram-distance sorting (`<->` = `1 - similarity`), and even **unanchored `ILIKE \'%foo%\'` or regex substrings**!\n\nFor tree-structured taxonomies and org charts, **`ltree`** materializes dot-delimited lineage paths (`corp.eng.infra.storage`) directly in a compact binary type. A single `GiST` index on `org_path` answers ancestor (`@>`), descendant (`<@`), depth (`nlevel()`), and subtree budget rollups in one index scan—eliminating recursive CTE roundtrips on read-heavy hierarchies.',
        syntaxAnatomy: [
          '-- 1. pg_trgm fuzzy similarity (%) & KNN distance (<->):',
          'SELECT doc_id, title, ROUND(similarity(title, \'Autovaccum Wraparound\')::numeric, 3) AS sim',
          'FROM search_documents',
          'WHERE title % \'Autovaccum Transaction Wraparound\'',
          'ORDER BY title <-> \'Autovaccum Transaction Wraparound\' ASC;',
          '',
          '-- 2. ltree GiST subtree rollup (<@):',
          'SELECT p.unit_code, COUNT(c.unit_id) AS nodes, SUM(c.annual_budget_usd) AS subtree_budget',
          'FROM org_units p JOIN org_units c ON c.org_path <@ p.org_path',
          'WHERE nlevel(p.org_path) <= 2 GROUP BY p.unit_id, p.unit_code;'
        ].join('\n'),
        internalsAndGotchas: [
          'A `pg_trgm` `GIN` index accelerates `title % query` and `ILIKE \'%substr%\'`, whereas **KNN `ORDER BY title <-> query LIMIT k`** index-order scans specifically require a **`GiST`** index (`gist_trgm_ops`).',
          'Very short search strings (`< 3` characters) generate too few trigrams for `pg_trgm` to narrow candidates effectively; guard autocomplete endpoints with a minimum length or prefix B-Tree `text_pattern_ops`.',
          'In `ltree`, `<@` (*is descendant of — or equal to!*) is **reflexive**: `\'corp.eng\'::ltree <@ \'corp.eng\'::ltree` evaluates to `TRUE`, so subtree joins automatically include the root node itself unless you filter `c.org_path <> p.org_path`.',
          '`ltree` labels only permit `[A-Za-z0-9_-]` (in PG 16+, hyphens are allowed alongside underscores) separated by dots—sanitize arbitrary user slugs before casting to `::ltree`.'
        ],
        whenToUse: 'Use `pg_trgm` for typo-tolerant search, fuzzy deduplication, and `ILIKE \'%...%\'` acceleration; use `ltree` for read-heavy org charts, cost-center rollups, category trees, and threaded comment paths.'
      },
      scenario: {
        role: 'Staff Platform & FinOps Data Architect',
        incidentOrGoal: 'Runbook search returns zero hits on fat-fingered queries like `Autovaccum Transaction Wraparound`, while FinOps needs instantaneous `org_units` engineering subtree listings and multi-level budget rollups without `WITH RECURSIVE`.',
        stakeholderNeed: 'Implement a `pg_trgm` fuzzy recovery query on `search_documents` and two `ltree` hierarchy queries (`<@`, `nlevel`, `subpath`, subtree `SUM`) on `org_units`.'
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Step 1 — Typo-Tolerant Runbook Recovery with pg_trgm (%, similarity, <->)',
          mission: 'Recover matching runbooks from `search_documents` for the misspelled query string `\'Autovaccum Transaction Wraparound\'` using the `%` trigram similarity operator (`WHERE title % \'Autovaccum Transaction Wraparound\'`). Project 4 columns in exact order: `doc_id`, `title`, `sim_score` (`ROUND(similarity(title, \'Autovaccum Transaction Wraparound\')::numeric, 3)`), and `trgm_dist` (`ROUND((title <-> \'Autovaccum Transaction Wraparound\')::numeric, 3)`). Sort by `trgm_dist ASC, doc_id ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Match misspelled query \'Autovaccum Transaction Wraparound\' via pg_trgm % and <->',
            'SELECT doc_id,',
            '       title',
            '       -- TODO: ROUND(similarity(title, \'Autovaccum Transaction Wraparound\')::numeric, 3) AS sim_score',
            '       -- TODO: ROUND((title <-> \'Autovaccum Transaction Wraparound\')::numeric, 3) AS trgm_dist',
            'FROM search_documents',
            '-- TODO: WHERE title % \'Autovaccum Transaction Wraparound\'',
            'ORDER BY doc_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT doc_id,',
            '       title,',
            '       ROUND(similarity(title, \'Autovaccum Transaction Wraparound\')::numeric, 3) AS sim_score,',
            '       ROUND((title <-> \'Autovaccum Transaction Wraparound\')::numeric, 3) AS trgm_dist',
            'FROM search_documents',
            'WHERE title % \'Autovaccum Transaction Wraparound\'',
            'ORDER BY trgm_dist ASC, doc_id ASC;'
          ].join('\n'),
          hints: [
            'Filter `WHERE title % \'Autovaccum Transaction Wraparound\'` so `idx_search_docs_title_trgm` filters candidates exceeding `pg_trgm.similarity_threshold` (`0.3`).',
            'Compute `ROUND(similarity(title, \'Autovaccum Transaction Wraparound\')::numeric, 3) AS sim_score` and `ROUND((title <-> \'Autovaccum Transaction Wraparound\')::numeric, 3) AS trgm_dist`.',
            'Sort by `trgm_dist ASC, doc_id ASC` (`trgm_dist = 1 - sim_score`, so smaller distance means closer match).'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '%', flags: '', message: 'Use the `%` trigram similarity threshold operator in `WHERE`.' },
              { pattern: '<->', flags: '', message: 'Use the `<->` trigram distance operator.' },
              { pattern: '\\bsimilarity\\s*\\(', flags: 'i', message: 'Use `similarity(title, ...)` to compute the trigram match score.' }
            ]
          },
          solutionExplanation: 'Even though `Autovaccum` is misspelled, 3-character trigram overlap against `PostgreSQL Autovacuum Transaction Wraparound Emergency` exceeds `0.3`, letting `idx_search_docs_title_trgm` recover doc `1` cleanly.'
        },
        {
          stepNumber: 2,
          title: 'Step 2 — Hierarchical Subtree Slicing with ltree (<@, nlevel, subpath)',
          mission: 'Query `org_units` for every unit in the `\'corp.eng\'::ltree` subtree using `<@`. Project 5 columns in exact order: `unit_id`, `unit_code`, `org_path` (`org_path::text`), `depth` (`nlevel(org_path)`), and `rel_eng_path` (`subpath(org_path, 1)::text`, slicing off the leading `corp` root label). Sort by `depth ASC, unit_code ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Slice the corp.eng subtree using ltree <@, nlevel(), and subpath()',
            'SELECT unit_id,',
            '       unit_code,',
            '       org_path::text AS org_path',
            '       -- TODO: nlevel(org_path) AS depth, subpath(org_path, 1)::text AS rel_eng_path',
            'FROM org_units',
            '-- TODO: WHERE org_path <@ \'corp.eng\'::ltree',
            'ORDER BY unit_id ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT unit_id,',
            '       unit_code,',
            '       org_path::text AS org_path,',
            '       nlevel(org_path) AS depth,',
            '       subpath(org_path, 1)::text AS rel_eng_path',
            'FROM org_units',
            'WHERE org_path <@ \'corp.eng\'::ltree',
            'ORDER BY depth ASC, unit_code ASC;'
          ].join('\n'),
          hints: [
            '`org_path <@ \'corp.eng\'::ltree` returns `TRUE` for `corp.eng` itself plus every descendant beneath `corp.eng.*`.',
            '`nlevel(org_path)` counts dot-separated labels (`corp.eng` = `2`, `corp.eng.infra.storage` = `4`).',
            '`subpath(org_path, 1)` uses 0-based label offsets to drop label `0` (`corp`) and keep `eng...`; cast `::text` and sort by `depth ASC, unit_code ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '<@', flags: '', message: 'Use the `<@` `ltree` is-descendant-of operator.' },
              { pattern: '\\bnlevel\\s*\\(', flags: 'i', message: 'Use `nlevel(org_path)` to compute hierarchy depth.' },
              { pattern: '\\bsubpath\\s*\\(', flags: 'i', message: 'Use `subpath(org_path, 1)` to extract the relative path.' }
            ]
          },
          solutionExplanation: 'Backed by `idx_org_units_path_gist`, `org_path <@ \'corp.eng\'::ltree` fetches all 6 engineering units in a single GiST scan without recursive self-joins.'
        },
        {
          stepNumber: 3,
          title: 'Step 3 — Multi-Level Cost-Center Budget Rollups via ltree Subtree Join',
          mission: 'For every executive and division node at depth `<= 2` (`nlevel(p.org_path) <= 2` in `org_units p`), roll up its entire subtree (including `p` itself) by joining `org_units c ON c.org_path <@ p.org_path`. Project 5 columns in exact order: `unit_code` (`p.unit_code`), `org_path` (`p.org_path::text`), `subtree_units` (`COUNT(c.unit_id)`), `subtree_headcount` (`SUM(c.headcount)`), and `subtree_budget_usd` (`SUM(c.annual_budget_usd)`). Sort by `subtree_budget_usd DESC, unit_code ASC`.',
          setupSql: '',
          probeSql: '',
          starterCode: [
            '-- Roll up full subtree headcount & budget for top-2 levels (corp, corp.eng, corp.security)',
            'SELECT p.unit_code,',
            '       p.org_path::text AS org_path',
            '       -- TODO: COUNT(c.unit_id) AS subtree_units, SUM(c.headcount) AS subtree_headcount, SUM(c.annual_budget_usd) AS subtree_budget_usd',
            'FROM org_units p',
            '-- TODO: JOIN org_units c ON c.org_path <@ p.org_path',
            'WHERE nlevel(p.org_path) <= 2',
            'GROUP BY p.unit_id, p.unit_code, p.org_path',
            'ORDER BY p.unit_code ASC;'
          ].join('\n'),
          solutionCode: [
            'SELECT p.unit_code,',
            '       p.org_path::text AS org_path,',
            '       COUNT(c.unit_id) AS subtree_units,',
            '       SUM(c.headcount) AS subtree_headcount,',
            '       SUM(c.annual_budget_usd) AS subtree_budget_usd',
            'FROM org_units p',
            'JOIN org_units c ON c.org_path <@ p.org_path',
            'WHERE nlevel(p.org_path) <= 2',
            'GROUP BY p.unit_id, p.unit_code, p.org_path',
            'ORDER BY subtree_budget_usd DESC, p.unit_code ASC;'
          ].join('\n'),
          hints: [
            'Because `<@` is reflexive (`x <@ x` is `TRUE`), joining `ON c.org_path <@ p.org_path` naturally includes each parent unit\'s own headcount and budget alongside all descendants.',
            'Filter `WHERE nlevel(p.org_path) <= 2` so rollups are computed for `CORP` (`corp`), `ENG` (`corp.eng`), and `SEC` (`corp.security`).',
            'Group by `p.unit_id, p.unit_code, p.org_path` and sort by `subtree_budget_usd DESC, p.unit_code ASC`.'
          ],
          assertions: {
            orderMatters: true,
            checkColumnNames: true,
            floatEpsilon: 0.01,
            requiredPatterns: [
              { pattern: '<@|@>', flags: '', message: 'Join `org_units` using `<@` or `@>` `ltree` containment.' },
              { pattern: '\\bnlevel\\s*\\(', flags: 'i', message: 'Filter parent nodes using `nlevel(p.org_path) <= 2`.' }
            ]
          },
          solutionExplanation: 'Materialized `ltree` paths turn arbitrary-depth hierarchical rollups into a single relational `<@` join (`CORP` totals `$54.5M` across all 9 units, `ENG` totals `$42.0M` across 6 units, and `SEC` totals `$8.3M` across 2 units).'
        }
      ]
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
