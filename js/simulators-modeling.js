/* ═══════════════════════════════════════════════════════════════
   SQL In Depth — Track III — Normalization, Dimensional Modeling & Temporal SQL
   Interactive Table-Level Relational & Storage Engine Simulators
   ═══════════════════════════════════════════════════════════════ */

window.SIMULATORS = window.SIMULATORS || {};

(() => {
  const { esc, createStepSimulator, renderArrayCells, renderRelTable } = window.Simulators;

  const SPECS = [
  {
    "id": "sim-bcnf-dependency-decomposition",
    "title": "Functional Dependencies, Update Anomalies & Lossless BCNF Decomposition",
    "badge": "1NF → 3NF → BCNF",
    "badgeClass": "badge-o1",
    "blurb": "Test Armstrong’s axioms, spot redundant attribute update/deletion anomalies in unnormalized tables, and verify lossless-join & dependency-preserving BCNF splits.",
    "slugs": [
      "entity-relationship-modeling",
      "functional-dependencies-keys",
      "first-normal-form-atomicity",
      "second-third-normal-form",
      "boyce-codd-fourth-fifth-normal-form",
      "update-insertion-deletion-anomalies",
      "build-normalized-booking-schema"
    ],
    "presets": [
      {
        "id": "bcnf",
        "label": "3NF → BCNF Decomposition (Course, Instructor, Room)",
        "mode": "bcnf"
      },
      {
        "id": "anomaly",
        "label": "Update & Deletion Anomaly in Denormalized Table",
        "mode": "anomaly"
      }
    ],
    "columns": [
      "student_id",
      "course_id",
      "instructor",
      "instructor_office",
      "normal_form_state"
    ],
    "baseRows": [
      [
        "S1",
        "CS-445 (DB)",
        "Dr. Codd",
        "Gates 401",
        "FD: instructor → office (Transitive!)"
      ],
      [
        "S2",
        "CS-445 (DB)",
        "Dr. Codd",
        "Gates 401",
        "Redundant duplicate! Update risk"
      ],
      [
        "S3",
        "CS-511 (OS)",
        "Dr. Lamport",
        "Gates 310",
        "Deleting S3 loses Dr. Lamport!"
      ],
      [
        "S1",
        "CS-511 (OS)",
        "Dr. Lamport",
        "Gates 310",
        "Decompose → Enrollments ⋈ Instructors"
      ]
    ],
    "kind": "bcnf"
  },
  {
    "id": "sim-denormalization-multi-tenant",
    "title": "Strategic Denormalization, EAV Anti-Pattern & Multi-Tenant Pod Routing",
    "badge": "Schema Architecture",
    "badgeClass": "badge-o1",
    "blurb": "Compare 5-way self-joined EAV tables against typed columns + JSONB + GIN indexes, and trace tenant_id composite key co-location in Shopify-scale pods.",
    "slugs": [
      "strategic-denormalization-tradeoffs",
      "schema-anti-patterns-eav-god-tables",
      "case-shopify-multi-tenant-schema"
    ],
    "presets": [
      {
        "id": "shop_pod",
        "label": "Multi-Tenant Composite Key (shop_id, order_id) Locality",
        "mode": "pod"
      },
      {
        "id": "eav_vs_jsonb",
        "label": "EAV 5-Way Self-Join vs Typed Columns + JSONB",
        "mode": "eav"
      }
    ],
    "columns": [
      "shop_id",
      "entity_id",
      "storage_pattern",
      "pages_touched",
      "p99_latency"
    ],
    "baseRows": [
      [
        42,
        9001,
        "Composite PK (shop_id, id)",
        "1 leaf page",
        "0.4 ms"
      ],
      [
        42,
        9002,
        "Composite PK (shop_id, id)",
        "1 leaf page (co-located)",
        "0.4 ms"
      ],
      [
        42,
        9003,
        "EAV 5-Attribute Entity",
        "15 random heap pages",
        "18.5 ms (Slow!)"
      ],
      [
        99,
        1004,
        "Composite PK (shop_id, id)",
        "1 leaf page (Pod #2)",
        "0.5 ms"
      ]
    ],
    "kind": "tenant"
  },
  {
    "id": "sim-star-snowflake-scd2",
    "title": "Star Schema Fact/Dimension Grain & Slowly Changing Dimension (SCD Type 2) Merger",
    "badge": "Kimball SCD Type 2",
    "badgeClass": "badge-on",
    "blurb": "Step through SCD Type 2 historical row expiration (valid_to = t_change, is_current = false), surrogate key lookup, and point-in-time AS OF fact joins.",
    "slugs": [
      "oltp-vs-olap-workload-physics",
      "star-schema-facts-dimensions",
      "snowflake-vs-star-vs-obt",
      "slowly-changing-dimensions-scd",
      "bridge-tables-junk-role-dimensions",
      "case-airbnb-minerva-metric-layer",
      "build-scd-type2-warehouse-pipeline"
    ],
    "presets": [
      {
        "id": "scd2",
        "label": "Customer Tier Upgrade (Pro → Enterprise) SCD Type 2 Split",
        "mode": "scd2"
      },
      {
        "id": "star",
        "label": "Fact Sales ⋈ Dim Customer Point-in-Time Surrogate Join",
        "mode": "star"
      }
    ],
    "columns": [
      "cust_sk",
      "cust_nk",
      "tier",
      "valid_from",
      "valid_to",
      "is_current"
    ],
    "baseRows": [
      [
        1001,
        "C-50",
        "Starter",
        "2025-01-01",
        "2025-06-15",
        "false (Closed)"
      ],
      [
        1048,
        "C-50",
        "Pro",
        "2025-06-15",
        "2026-02-01",
        "false (Closed)"
      ],
      [
        1102,
        "C-50",
        "Enterprise",
        "2026-02-01",
        "9999-12-31",
        "true (Active)"
      ],
      [
        1015,
        "C-88",
        "Pro",
        "2025-03-10",
        "9999-12-31",
        "true (Active)"
      ]
    ],
    "kind": "scd2"
  },
  {
    "id": "sim-bitemporal-json-idempotency",
    "title": "Bitemporal (System Time × Valid Time) Ledger & Idempotency Key State Machine",
    "badge": "Bitemporal / Idempotent",
    "badgeClass": "badge-o1",
    "blurb": "Track valid_time vs transaction_time intervals for retroactive audit corrections and atomic idempotency_key state transitions.",
    "slugs": [
      "temporal-tables-bitemporal-sql",
      "json-semi-structured-hybrid-schemas",
      "idempotency-audit-logs-event-tables"
    ],
    "presets": [
      {
        "id": "bitemporal",
        "label": "Retroactive Contract Correction Across Valid × System Time",
        "mode": "bitemp"
      },
      {
        "id": "idempotent",
        "label": "Concurrent Webhook Retry Idempotency Key Guard",
        "mode": "idemp"
      }
    ],
    "columns": [
      "row_ver",
      "contract_id",
      "rate_usd",
      "valid_period",
      "sys_period"
    ],
    "baseRows": [
      [
        "v1",
        "CTR-9",
        "$500",
        "[2026-01-01, ∞)",
        "[2026-01-01, 2026-03-10)"
      ],
      [
        "v2 (Split)",
        "CTR-9",
        "$500",
        "[2026-01-01, 2026-02-01)",
        "[2026-03-10, ∞)"
      ],
      [
        "v3 (Retro)",
        "CTR-9",
        "$650",
        "[2026-02-01, ∞)",
        "[2026-03-10, ∞)"
      ]
    ],
    "kind": "bitemporal"
  },
  {
    "id": "sim-cohort-funnel-allen-intervals",
    "title": "Date Spine Cohort Retention Matrix, Funnel Attribution & Allen Interval Overlap",
    "badge": "s1 < e2 AND e1 > s2",
    "badgeClass": "badge-onlogn",
    "blurb": "Visualize half-open interval overlap detection [start, end), double-booking exclusion constraints, and cohort month offset retention matrices.",
    "slugs": [
      "calendar-tables-date-spines",
      "cohort-retention-matrix-sql",
      "funnel-conversion-attribution-sql",
      "interval-overlap-allen-algebra",
      "pivoting-unpivoting-cross-tabs",
      "case-double-booking-hotel-inventory",
      "build-saas-cohort-funnel-workbench"
    ],
    "presets": [
      {
        "id": "overlap",
        "label": "Room Reservation Overlap Check (s1 < e2 AND e1 > s2)",
        "mode": "overlap"
      },
      {
        "id": "cohort",
        "label": "Monthly Signup Cohort M0 → M3 Retention Matrix",
        "mode": "cohort"
      }
    ],
    "columns": [
      "booking_id",
      "room_id",
      "check_in",
      "check_out",
      "overlap_test_vs_new"
    ],
    "baseRows": [
      [
        "B-101",
        "RM-402",
        "2026-05-10",
        "2026-05-14",
        "10 < 16 AND 14 > 12 → OVERLAP!"
      ],
      [
        "B-102",
        "RM-402",
        "2026-05-14",
        "2026-05-18",
        "14 < 16 AND 18 > 12 → OVERLAP!"
      ],
      [
        "B-103",
        "RM-402",
        "2026-05-01",
        "2026-05-10",
        "01 < 16 AND 10 > 12 (False) → SAFE (Abutting)"
      ],
      [
        "B-104",
        "RM-405",
        "2026-05-12",
        "2026-05-16",
        "Different room_id → SAFE"
      ]
    ],
    "kind": "intervals"
  },
  {
    "id": "sim-matview-triggers-sqli-defense",
    "title": "Incremental Materialized View Delta Refresh & Parameterized AST vs SQL Injection",
    "badge": "MV Refresh / AST Bind",
    "badgeClass": "badge-o1",
    "blurb": "Compare string concatenation SQL injection AST hijacking against parameterized $1 protocol binding, and trace CONCURRENTLY materialized view delta merges.",
    "slugs": [
      "triggers-stored-procedures-udfs",
      "materialized-views-incremental-refresh",
      "sql-injection-parameterized-security"
    ],
    "presets": [
      {
        "id": "sqli",
        "label": "String Concatenation AST Hijack vs Parameterized $1 Bind",
        "mode": "sqli"
      },
      {
        "id": "mv",
        "label": "REFRESH MATERIALIZED VIEW CONCURRENTLY Diff Merge",
        "mode": "mv"
      }
    ],
    "columns": [
      "step_phase",
      "input_payload",
      "parsed_ast_predicate",
      "security_outcome"
    ],
    "baseRows": [
      [
        "1. Vulnerable Concat",
        "' OR '1'='1",
        "WHERE user = '' OR '1'='1' (Always TRUE)",
        "BREACH: Full Table Leaked"
      ],
      [
        "2. Prepared Parse",
        "SELECT * WHERE user = $1",
        "AST Locked: Eq(Column(user), Param($1))",
        "Structure Immutable"
      ],
      [
        "3. BindExec Packet",
        "' OR '1'='1",
        "Literal byte string compared to user column",
        "SAFE: 0 Rows Matched"
      ]
    ],
    "kind": "security"
  }
];

  function resolvePresetRows(spec, preset) {
    const isAlt = Boolean(preset && spec.presets && spec.presets[0] && preset.id !== spec.presets[0].id);
    if (!isAlt) return spec.baseRows.map(r => r.slice());

    if (spec.id === 'sim-bcnf-dependency-decomposition') {
      return [
        ['S1', 'CS-445 (DB)', 'Dr. Codd', 'Gates 402 (Updated)', 'BREACH: Partial Update Anomaly!'],
        ['S2', 'CS-445 (DB)', 'Dr. Codd', 'Gates 401 (Stale!)', 'INFLATED: Inconsistent Office Fact'],
        ['S3', 'CS-511 (OS)', 'DELETE S3', 'NULL (Lost Fact!)', 'BREACH: Deletion Anomaly!'],
        ['S4', 'CS-601 (New)', 'Dr. Stonebraker', 'Gates 501', 'NULL student_id Insertion Blocked!']
      ];
    }
    if (spec.id === 'sim-denormalization-multi-tenant') {
      return [
        [42, 9001, 'EAV Join #1 (attr=color)', '5 random heap pages', '6.2 ms (Wasted Joins)'],
        [42, 9001, 'EAV Join #2 (attr=size)', '12 random heap pages', '14.8 ms (Wasted Joins)'],
        [42, 9002, 'Typed Cols + JSONB + GIN', '1 leaf page ✓', '0.4 ms (Single Read ✓)'],
        [99, 1004, 'Typed Cols + JSONB + GIN', '1 leaf page ✓', '0.5 ms (Single Read ✓)']
      ];
    }
    if (spec.id === 'sim-star-snowflake-scd2') {
      return [
        [1001, 'Fact Sale #801 (2025-03)', 'Starter', '2025-01-01', '2025-06-15', 'JOIN cust_sk=1001 (Starter ✓)'],
        [1048, 'Fact Sale #855 (2025-11)', 'Pro', '2025-06-15', '2026-02-01', 'JOIN cust_sk=1048 (Pro ✓)'],
        [1102, 'Fact Sale #910 (2026-03)', 'Enterprise', '2026-02-01', '9999-12-31', 'JOIN cust_sk=1102 (Enterprise ✓)'],
        [9999, 'Late Arriving Fact (2024)', 'UNKNOWN', '—', '—', 'PRUNED: Unmatched Natural Key']
      ];
    }
    if (spec.id === 'sim-bitemporal-json-idempotency') {
      return [
        ['req_1', 'ik_882a', '$120.00', 'INSERT ON CONFLICT DO NOTHING', 'CLAIMED (status=STARTED) ✓'],
        ['req_2 (Retry)', 'ik_882a', '$120.00', 'CONFLICT on idempotency_key', 'PRUNED (Duplicate Suppressed)'],
        ['req_1 (Done)', 'ik_882a', '$120.00', 'UPDATE status=COMPLETED', 'Cached Response Saved ✓']
      ];
    }
    if (spec.id === 'sim-cohort-funnel-allen-intervals') {
      return [
        ['Cohort 2026-01', 'M0: 100% (500)', 'M1: 68% (340)', 'M2: 54% (270)', 'Active Retention ✓'],
        ['Cohort 2026-02', 'M0: 100% (620)', 'M1: 72% (446)', 'M2: 61% (378)', 'Improved Onboarding ✓'],
        ['Cohort 2026-03', 'M0: 100% (710)', 'M1: 75% (532)', 'M2: NULL (Future)', 'PRUNED (Future Bucket)']
      ];
    }
    if (spec.id === 'sim-matview-triggers-sqli-defense') {
      return [
        ['1. Temp Snapshot', 'CREATE TEMP mv_new', 'Compute full fresh query result', 'SAFE (Readers use old MV) ✓'],
        ['2. Outer Join Diff', 'mv_old FULL JOIN mv_new', 'Identify 12 INSERT / 3 DELETE deltas', 'SAFE (Unique Index Match) ✓'],
        ['3. Apply Delta', 'INSERT / DELETE in-place', 'No AccessExclusiveLock acquired', 'NON-BLOCKING Refresh ✓']
      ];
    }
    return spec.baseRows.map(r => r.slice());
  }

  function buildInteractiveFrames(spec, preset) {
    const frames = [];
    const cols = spec.columns;
    const baseRows = resolvePresetRows(spec, preset);
    const customNums = Array.isArray(preset.arr) && preset.arr.length >= 2 ? preset.arr : null;

    // Frame 0: Initial Table & Schema State
    const cellSummary0 = baseRows.map((r, idx) => String(r[0]) + ':' + String(r[2] ?? r[1]));
    frames.push({
      stageHtml:
        renderRelTable(spec.title + ' — Initial Relation State', cols, baseRows, {
          activeRows: [0],
          rowTags: { 0: 'CURSOR START' }
        }) +
        renderArrayCells(cellSummary0, { active: [0], tags: { 0: 'Tuple #0' } }),
      invariant: `Relation initialized with ${baseRows.length} tuples across schema (${cols.join(', ')}) — preset: ${preset.label}.`,
      metrics: [
        { label: 'Input Tuples', value: String(baseRows.length) },
        { label: 'Columns', value: String(cols.length) },
        { label: 'Preset Mode', value: String(preset.id || 'default') },
        { label: 'Pipeline Stage', value: '1. Initial Scan' }
      ],
      log: `Initialized ${spec.title} (${preset.label}) with ${baseRows.length} base rows.`
    });

    // Intermediate row-by-row / operator steps
    for (let i = 0; i < baseRows.length; i++) {
      const row = baseRows[i];
      const rowStr = row.map(v => v === null ? 'NULL' : String(v)).join(' | ');
      const isWarn = /NULL|INFLATED|UNKNOWN|BREACH|WAITING|QUEUED|PRUNED|INVISIBLE|Wasted/i.test(rowStr);
      const isMatch = /✓|VALID|paid|VISIBLE|SAFE|Winner|Index Scan|Keyset|NON-BLOCKING/i.test(rowStr) || (!isWarn && i % 2 === 0);

      const matchRows = [];
      const warnRows = [];
      const activeRows = [i];
      const rowTags = {};

      for (let k = 0; k <= i; k++) {
        const kStr = baseRows[k].map(v => v === null ? 'NULL' : String(v)).join(' | ');
        const kWarn = /NULL|INFLATED|UNKNOWN|BREACH|WAITING|QUEUED|PRUNED|INVISIBLE|Wasted/i.test(kStr);
        if (k === i) {
          rowTags[k] = isWarn ? '⚠ FLAGGED / FILTERED' : '✓ MATCHED / APPLIED';
          if (isWarn) warnRows.push(k);
          else matchRows.push(k);
        } else if (kWarn) {
          warnRows.push(k);
          rowTags[k] = 'Filtered/Flagged';
        } else {
          matchRows.push(k);
          rowTags[k] = 'Verified ✓';
        }
      }

      const cellVals = customNums
        ? customNums.slice(0, baseRows.length).map((n, idx) => `#${idx}:${n}`)
        : baseRows.map((r, idx) => String(r[0]) + ':' + String(r[r.length - 1] ?? r[1]).slice(0, 12));

      frames.push({
        stageHtml:
          renderRelTable(`${spec.title} — Step ${i + 1} of ${baseRows.length}`, cols, baseRows, {
            activeRows,
            matchRows,
            warnRows,
            rowTags
          }) +
          renderArrayCells(cellVals, {
            active: [i],
            match: matchRows.filter(x => x !== i),
            warn: warnRows,
            tags: { [i]: isWarn ? 'WARN/FILTER' : 'EVAL ✓' }
          }),
        invariant: `Evaluating tuple [${i}] (${cols[0]}=${row[0]}) under preset "${preset.label}": ${row.slice(1).map((v, cIdx) => cols[cIdx + 1] + '=' + (v === null ? 'NULL' : v)).join(', ')}.`,
        metrics: [
          { label: 'Cursor Tuple', value: `${i + 1} / ${baseRows.length}` },
          { label: 'Key', value: String(row[0]) },
          { label: 'Matched / Valid', value: String(matchRows.length) },
          { label: 'Filtered / Warn', value: String(warnRows.length) }
        ],
        log: `Processed tuple #${i + 1} (${row[0]}): ${isWarn ? 'flagged anomaly/filter condition' : 'satisfied relational/storage invariant'}.`
      });
    }

    // Final Frame: Post-Execution Output Table & Summary
    const finalMatch = [];
    const finalWarn = [];
    const finalTags = {};
    baseRows.forEach((r, i) => {
      const s = r.map(v => v === null ? 'NULL' : String(v)).join(' | ');
      if (/INFLATED|UNKNOWN|BREACH|WAITING|QUEUED|PRUNED|INVISIBLE|Wasted/i.test(s)) {
        finalWarn.push(i);
        finalTags[i] = 'Filtered / Guarded';
      } else {
        finalMatch.push(i);
        finalTags[i] = 'Committed / Emitted ✓';
      }
    });

    const cellSummaryEnd = baseRows.map(r => String(r[0]) + ':' + String(r[r.length - 1] ?? r[1]).slice(0, 12));
    frames.push({
      stageHtml:
        renderRelTable(spec.title + ' — Final Verified Result Set', cols, baseRows, {
          matchRows: finalMatch,
          warnRows: finalWarn,
          rowTags: finalTags
        }) +
        renderArrayCells(cellSummaryEnd, {
          match: finalMatch,
          warn: finalWarn,
          tags: { [baseRows.length - 1]: 'COMPLETE ✓' }
        }),
      invariant: `Execution complete (${preset.label}): ${finalMatch.length} tuple(s) emitted/verified, ${finalWarn.length} tuple(s) filtered/guarded under ${spec.badge}.`,
      metrics: [
        { label: 'Total Scanned', value: String(baseRows.length) },
        { label: 'Emitted / Valid', value: String(finalMatch.length) },
        { label: 'Filtered / Guarded', value: String(finalWarn.length) },
        { label: 'Engine Status', value: 'Verified ✓' }
      ],
      log: `Completed full table-level execution of ${spec.title} (${finalMatch.length} emitted, ${finalWarn.length} filtered).`
    });

    return frames;
  }

  for (const spec of SPECS) {
    const slugAliases = [];
    for (const s of (spec.slugs || [])) {
      slugAliases.push('sim-' + s);
      slugAliases.push(s);
    }
    createStepSimulator({
      id: spec.id,
      aliases: slugAliases,
      title: spec.title,
      badge: spec.badge,
      badgeClass: spec.badgeClass,
      blurb: spec.blurb,
      slugs: spec.slugs,
      presets: spec.presets,
      customInput: false,
      buildFrames(preset) {
        return buildInteractiveFrames(spec, preset || spec.presets[0]);
      }
    });
  }
})();
