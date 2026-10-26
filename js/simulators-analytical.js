/* ═══════════════════════════════════════════════════════════════
   SQL In Depth — Track II — Aggregations, Subqueries, CTEs & Window Functions
   Interactive Table-Level Relational & Storage Engine Simulators
   ═══════════════════════════════════════════════════════════════ */

window.SIMULATORS = window.SIMULATORS || {};

(() => {
  const { esc, createStepSimulator, renderArrayCells, renderRelTable } = window.Simulators;

  const SPECS = [
  {
    "id": "sim-groupby-having-rollup",
    "title": "HashAggregate Bucketing, HAVING vs WHERE & Multi-Dimensional ROLLUP/CUBE",
    "badge": "HashAggregate / CUBE",
    "badgeClass": "badge-on",
    "blurb": "Step through hash-table group bucketing, FILTER (WHERE ...) partial accumulators, and hierarchical GROUPING SETS / ROLLUP subtotal generation.",
    "slugs": [
      "aggregate-functions-internals",
      "group-by-execution-mechanics",
      "having-vs-where-pipeline",
      "conditional-aggregation-filter",
      "string-json-array-aggregation",
      "grouping-sets-rollup-cube",
      "histograms-percentiles-medians",
      "build-executive-kpi-aggregation-suite"
    ],
    "presets": [
      {
        "id": "rollup",
        "label": "GROUP BY ROLLUP (region, tier) with GROUPING() Bitmask",
        "mode": "rollup"
      },
      {
        "id": "filter",
        "label": "Conditional COUNT(*) FILTER (WHERE status = paid)",
        "mode": "filter"
      }
    ],
    "columns": [
      "group_key",
      "grouping_mask",
      "row_count",
      "sum_revenue",
      "p95_latency_ms"
    ],
    "baseRows": [
      [
        "(us-east, enterprise)",
        "0b00 (Detail)",
        42,
        "$128,400",
        "18ms"
      ],
      [
        "(us-east, pro)",
        "0b00 (Detail)",
        95,
        "$47,500",
        "22ms"
      ],
      [
        "(us-east, NULL)",
        "0b01 (Region Subtotal)",
        137,
        "$175,900",
        "21ms"
      ],
      [
        "(eu-west, enterprise)",
        "0b00 (Detail)",
        31,
        "$94,200",
        "24ms"
      ],
      [
        "(NULL, NULL)",
        "0b11 (Grand Total)",
        168,
        "$270,100",
        "22ms"
      ]
    ],
    "kind": "groupby"
  },
  {
    "id": "sim-join-fanout-chasm-trap",
    "title": "1-to-N-to-M Join Fanout & Chasm Trap Double-Counting Visualizer",
    "badge": "Fanout Multiplication",
    "badgeClass": "badge-on",
    "blurb": "Observe how joining Orders (1) to OrderItems (N) and Payments (M) multiplies rows by N×M and inflates SUM(order_total), then fix it with pre-aggregated CTEs.",
    "slugs": [
      "join-fanout-chasm-traps",
      "case-analytics-double-counting-bug"
    ],
    "presets": [
      {
        "id": "bug",
        "label": "Naive Multi-Branch Join (3×2 Fanout Inflates Revenue 300%)",
        "mode": "bug"
      },
      {
        "id": "fix",
        "label": "Pre-Aggregated Subquery / CTE Before Join (Exact Revenue)",
        "mode": "fix"
      }
    ],
    "columns": [
      "order_id",
      "order_total",
      "item_row",
      "payment_row",
      "running_sum_total"
    ],
    "baseRows": [
      [
        501,
        "$100.00",
        "item #1 (kbd)",
        "pay #1 (card)",
        "$100.00"
      ],
      [
        501,
        "$100.00",
        "item #2 (mouse)",
        "pay #1 (card)",
        "$200.00 (INFLATED!)"
      ],
      [
        501,
        "$100.00",
        "item #3 (dock)",
        "pay #1 (card)",
        "$300.00 (INFLATED!)"
      ],
      [
        502,
        "$250.00",
        "item #1 (monitor)",
        "pay #1 (wire)",
        "$550.00"
      ],
      [
        502,
        "$250.00",
        "item #1 (monitor)",
        "pay #2 (credit)",
        "$800.00 (INFLATED!)"
      ]
    ],
    "kind": "fanout"
  },
  {
    "id": "sim-subquery-lateral-unnesting",
    "title": "Correlated Subquery vs LATERAL Join & Decorrelation Unnesting Stepper",
    "badge": "LATERAL / Decorrelate",
    "badgeClass": "badge-onlogn",
    "blurb": "Compare O(N × M) correlated subquery re-execution against LATERAL Top-K index probes and hash semi-join unnesting.",
    "slugs": [
      "scalar-row-table-subqueries",
      "correlated-subqueries-mechanics",
      "exists-not-exists-null-safety",
      "lateral-joins-cross-apply"
    ],
    "presets": [
      {
        "id": "lateral",
        "label": "CROSS JOIN LATERAL Top-2 Recent Orders per Customer",
        "mode": "lateral"
      },
      {
        "id": "decorrelate",
        "label": "Optimizer Unnesting: Correlated Subquery → Hash Join",
        "mode": "decorrelate"
      }
    ],
    "columns": [
      "customer_id",
      "customer_name",
      "lateral_rank",
      "order_id",
      "order_amount"
    ],
    "baseRows": [
      [
        1,
        "Ada Lovelace",
        1,
        109,
        "$420.00"
      ],
      [
        1,
        "Ada Lovelace",
        2,
        104,
        "$210.00"
      ],
      [
        2,
        "Grace Hopper",
        1,
        112,
        "$890.00"
      ],
      [
        2,
        "Grace Hopper",
        2,
        103,
        "$340.00"
      ],
      [
        3,
        "Barbara Liskov",
        1,
        105,
        "$275.00"
      ]
    ],
    "kind": "lateral"
  },
  {
    "id": "sim-recursive-cte-graph-hierarchy",
    "title": "Recursive CTE Working-Table Fixpoint & Cycle Detection Visualizer",
    "badge": "WITH RECURSIVE Fixpoint",
    "badgeClass": "badge-on",
    "blurb": "Step through Anchor Member initialization, Working Table → Intermediate Table iterations, path array accumulation, and cycle detection.",
    "slugs": [
      "common-table-expressions-with",
      "cte-materialization-optimization-fence",
      "recursive-ctes-hierarchies",
      "graph-traversal-cycle-detection-sql",
      "case-recursive-org-permission-engine",
      "build-hierarchical-graph-query-engine"
    ],
    "presets": [
      {
        "id": "org",
        "label": "Org Hierarchy BFS Traversal (Depth 0 → Depth 3)",
        "mode": "org"
      },
      {
        "id": "cycle",
        "label": "Directed Graph Cycle Guard (path_ids || next_id)",
        "mode": "cycle"
      }
    ],
    "columns": [
      "iteration",
      "emp_id",
      "name",
      "manager_id",
      "depth_path"
    ],
    "baseRows": [
      [
        "Iter 0 (Anchor)",
        1,
        "CEO (Ada)",
        null,
        "[1]"
      ],
      [
        "Iter 1",
        2,
        "VP Eng (Alan)",
        1,
        "[1, 2]"
      ],
      [
        "Iter 1",
        3,
        "VP Data (Grace)",
        1,
        "[1, 3]"
      ],
      [
        "Iter 2",
        4,
        "Staff DBA (Edgar)",
        2,
        "[1, 2, 4]"
      ],
      [
        "Iter 2",
        5,
        "Principal Architect (Barbara)",
        3,
        "[1, 3, 5]"
      ],
      [
        "Iter 3",
        6,
        "Senior Eng (Ken)",
        4,
        "[1, 2, 4, 6]"
      ]
    ],
    "kind": "recursive"
  },
  {
    "id": "sim-window-frame-sliding",
    "title": "Window Function Partitioning, Ranking & Sliding Frame (ROWS vs RANGE) Stepper",
    "badge": "OVER (PARTITION BY ...)",
    "badgeClass": "badge-onlogn",
    "blurb": "Visualize how PARTITION BY splits rows without collapsing them, how ROW_NUMBER / RANK / DENSE_RANK handle ties, and how ROWS vs RANGE frames slide across peer groups.",
    "slugs": [
      "window-functions-mental-model",
      "partition-by-order-by-mechanics",
      "ranking-functions-row-number-rank",
      "top-n-per-group-deduplication",
      "offset-functions-lag-lead-first-last",
      "window-frames-rows-range-groups",
      "running-totals-cumulative-shares"
    ],
    "presets": [
      {
        "id": "frames",
        "label": "ROWS vs RANGE Frame on Tied Order Timestamps",
        "mode": "frames"
      },
      {
        "id": "ranking",
        "label": "ROW_NUMBER vs RANK vs DENSE_RANK Tie Handling",
        "mode": "ranking"
      }
    ],
    "columns": [
      "row_id",
      "dept",
      "salary",
      "row_num",
      "rank_dense",
      "frame_running_sum"
    ],
    "baseRows": [
      [
        1,
        "Core DB",
        "$190k",
        1,
        "1 / 1",
        "$190k"
      ],
      [
        2,
        "Core DB",
        "$190k",
        2,
        "1 / 1",
        "$380k (RANGE includes peer!)"
      ],
      [
        3,
        "Core DB",
        "$165k",
        3,
        "3 / 2",
        "$545k"
      ],
      [
        4,
        "Storage",
        "$210k",
        1,
        "1 / 1",
        "$210k"
      ],
      [
        5,
        "Storage",
        "$180k",
        2,
        "2 / 2",
        "$390k"
      ]
    ],
    "kind": "window"
  },
  {
    "id": "sim-gaps-islands-sessionization",
    "title": "Gaps-and-Islands Sessionization & Rolling Velocity Fraud Window Simulator",
    "badge": "Islands & Velocity",
    "badgeClass": "badge-onlogn",
    "blurb": "Trace the classic (ROW_NUMBER() - DENSE_RANK()) island grouping invariant and LAG()-based inactivity threshold session folding.",
    "slugs": [
      "gaps-and-islands-sessionization",
      "case-fintech-velocity-fraud-window",
      "build-sessionization-retention-engine"
    ],
    "presets": [
      {
        "id": "session",
        "label": "30-Minute Inactivity Timeout Sessionization (LAG + SUM Flag)",
        "mode": "session"
      },
      {
        "id": "velocity",
        "label": "Fintech Rolling 10-Min Card Velocity Window",
        "mode": "velocity"
      }
    ],
    "columns": [
      "event_id",
      "user_id",
      "ts_min",
      "gap_min",
      "new_session_flag",
      "session_island_id"
    ],
    "baseRows": [
      [
        1,
        "u_100",
        "10:00",
        null,
        1,
        "sess_1"
      ],
      [
        2,
        "u_100",
        "10:08",
        "8m (≤30m)",
        0,
        "sess_1"
      ],
      [
        3,
        "u_100",
        "10:19",
        "11m (≤30m)",
        0,
        "sess_1"
      ],
      [
        4,
        "u_100",
        "11:05",
        "46m (>30m!)",
        1,
        "sess_2 (New Island)"
      ],
      [
        5,
        "u_100",
        "11:14",
        "9m (≤30m)",
        0,
        "sess_2 (New Island)"
      ]
    ],
    "kind": "islands"
  }
];

  function buildInteractiveFrames(spec, preset) {
    const frames = [];
    const cols = spec.columns;
    const baseRows = spec.baseRows;
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
        invariant: `Evaluating tuple [${i}] (${cols[0]}=${row[0]}): ${row.slice(1).map((v, cIdx) => cols[cIdx + 1] + '=' + (v === null ? 'NULL' : v)).join(', ')}.`,
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
      invariant: `Execution complete: ${finalMatch.length} tuple(s) emitted/verified, ${finalWarn.length} tuple(s) filtered/guarded under ${spec.badge}.`,
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
      buildFrames(preset) {
        return buildInteractiveFrames(spec, preset || spec.presets[0]);
      }
    });
  }
})();
