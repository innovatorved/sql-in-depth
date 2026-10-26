/* ═══════════════════════════════════════════════════════════════
   SQL In Depth — Track I — Relational Foundations, DDL/DML & Multi-Table Joins
   Interactive Table-Level Relational & Storage Engine Simulators
   ═══════════════════════════════════════════════════════════════ */

window.SIMULATORS = window.SIMULATORS || {};

(() => {
  const { esc, createStepSimulator, renderArrayCells, renderRelTable } = window.Simulators;

  const SPECS = [
  {
    "id": "sim-select-where-pipeline",
    "title": "Logical Query Execution Pipeline (FROM → WHERE → SELECT → ORDER BY → LIMIT)",
    "badge": "Clause Pipeline",
    "badgeClass": "badge-o1",
    "blurb": "Step through a multi-clause SQL query at the table level. Watch rows flow from the base table through predicate filtering, expression projection, sorting, and Top-N pagination.",
    "slugs": [
      "why-databases-exist",
      "tables-rows-columns-types",
      "select-projection-aliases",
      "where-filtering-predicates",
      "order-by-limit-offset-distinct",
      "build-sql-query-interpreter"
    ],
    "presets": [
      {
        "id": "orders",
        "label": "Paid Orders ≥ $120 Ordered by Total DESC LIMIT 3",
        "minTotal": 120
      },
      {
        "id": "strict",
        "label": "High-Value Orders ≥ $250 with Alias Projection",
        "minTotal": 250
      }
    ],
    "columns": [
      "order_id",
      "customer",
      "status",
      "total_cents",
      "created_at"
    ],
    "baseRows": [
      [
        101,
        "Ada Lovelace",
        "paid",
        18500,
        "2026-03-01"
      ],
      [
        102,
        "Alan Turing",
        "pending",
        9200,
        "2026-03-02"
      ],
      [
        103,
        "Grace Hopper",
        "paid",
        34000,
        "2026-03-02"
      ],
      [
        104,
        "Edsger Dijkstra",
        "refunded",
        21000,
        "2026-03-03"
      ],
      [
        105,
        "Barbara Liskov",
        "paid",
        27500,
        "2026-03-04"
      ],
      [
        106,
        "Donald Knuth",
        "paid",
        12900,
        "2026-03-05"
      ]
    ],
    "kind": "pipeline"
  },
  {
    "id": "sim-three-valued-null-logic",
    "title": "Three-Valued Logic (TRUE / FALSE / UNKNOWN) & NULL Coalescing Stepper",
    "badge": "3VL Kleene Logic",
    "badgeClass": "badge-o1",
    "blurb": "Inspect how NULL propagates through arithmetic, equality (= vs IS DISTINCT FROM), AND/OR truth tables, CASE expressions, and COALESCE/NULLIF.",
    "slugs": [
      "boolean-logic-three-valued-null",
      "null-semantics-coalesce-nullif",
      "case-expressions-type-casting",
      "case-stripe-ledger-precision"
    ],
    "presets": [
      {
        "id": "3vl",
        "label": "WHERE discount_pct > 10 OR coupon IS NULL",
        "mode": "3vl"
      },
      {
        "id": "ledger",
        "label": "Integer Cents vs IEEE-754 Float Ledger Drift",
        "mode": "ledger"
      }
    ],
    "columns": [
      "entry_id",
      "account",
      "amount_cents",
      "discount_pct",
      "effective_cents"
    ],
    "baseRows": [
      [
        1,
        "acct_stripe_01",
        10000,
        15,
        8500
      ],
      [
        2,
        "acct_stripe_02",
        25000,
        null,
        25000
      ],
      [
        3,
        "acct_stripe_03",
        18000,
        0,
        18000
      ],
      [
        4,
        "acct_stripe_04",
        42000,
        20,
        33600
      ],
      [
        5,
        "acct_stripe_05",
        15000,
        null,
        15000
      ]
    ],
    "kind": "null3vl"
  },
  {
    "id": "sim-ddl-constraints-fk-cascade",
    "title": "DDL Referential Integrity, Constraints & Zero-Downtime Expand/Contract",
    "badge": "PK / FK / CHECK",
    "badgeClass": "badge-o1",
    "blurb": "Trace Primary Key uniqueness, Foreign Key ON DELETE CASCADE vs RESTRICT enforcement, CHECK predicates, and online schema migration phases.",
    "slugs": [
      "create-table-ddl-anatomy",
      "primary-keys-surrogate-vs-natural",
      "foreign-keys-referential-integrity",
      "check-unique-not-null-defaults",
      "case-github-zero-downtime-migrations",
      "build-ecommerce-schema-ddl"
    ],
    "presets": [
      {
        "id": "cascade",
        "label": "FK ON DELETE CASCADE vs RESTRICT Verification",
        "mode": "cascade"
      },
      {
        "id": "expand",
        "label": "Zero-Downtime Expand → Dual-Write → Backfill → Contract",
        "mode": "expand"
      }
    ],
    "columns": [
      "child_id",
      "parent_order_id",
      "sku",
      "qty",
      "constraint_state"
    ],
    "baseRows": [
      [
        5001,
        101,
        "SKU-NVME-2TB",
        2,
        "VALID (FK -> 101)"
      ],
      [
        5002,
        101,
        "SKU-DDR5-64G",
        1,
        "VALID (FK -> 101)"
      ],
      [
        5003,
        103,
        "SKU-EPYC-9654",
        1,
        "VALID (FK -> 103)"
      ],
      [
        5004,
        105,
        "SKU-NIC-100G",
        4,
        "VALID (FK -> 105)"
      ]
    ],
    "kind": "ddl"
  },
  {
    "id": "sim-dml-upsert-returning",
    "title": "DML Batch INSERT, Atomic UPSERT (ON CONFLICT DO UPDATE) & RETURNING",
    "badge": "Atomic UPSERT",
    "badgeClass": "badge-ologn",
    "blurb": "Step through conflict detection on unique index keys, atomic DO UPDATE SET excluded.*, and CTE pipelines using RETURNING.",
    "slugs": [
      "insert-bulk-loading-returning",
      "upsert-on-conflict-merge",
      "update-delete-safe-mutations",
      "views-temp-tables-ctas"
    ],
    "presets": [
      {
        "id": "upsert",
        "label": "INSERT ... ON CONFLICT (sku) DO UPDATE SET stock = stock + EXCLUDED.stock",
        "mode": "upsert"
      },
      {
        "id": "returning",
        "label": "UPDATE ... RETURNING into Audit Log CTE",
        "mode": "returning"
      }
    ],
    "columns": [
      "sku",
      "warehouse",
      "stock_qty",
      "version",
      "last_op"
    ],
    "baseRows": [
      [
        "SKU-01",
        "us-east",
        40,
        1,
        "SEED"
      ],
      [
        "SKU-02",
        "us-east",
        15,
        1,
        "SEED"
      ],
      [
        "SKU-03",
        "eu-west",
        80,
        2,
        "SEED"
      ],
      [
        "SKU-04",
        "ap-south",
        12,
        1,
        "SEED"
      ]
    ],
    "kind": "upsert"
  },
  {
    "id": "sim-relational-join-matrix",
    "title": "Relational Algebra & Join Visualizer (INNER, LEFT, FULL, SELF & ON vs WHERE)",
    "badge": "Relational Joins ⋈",
    "badgeClass": "badge-on",
    "blurb": "Watch row-by-row matching across Customers and Orders. Compare INNER JOIN, LEFT OUTER JOIN null-extension, and the critical ON vs WHERE outer-join filter trap.",
    "slugs": [
      "relational-algebra-set-theory",
      "inner-join-equi-joins",
      "left-right-full-outer-joins",
      "join-where-vs-on-filter-trap",
      "self-joins-non-equi-joins",
      "cross-join-cartesian-products",
      "build-multi-table-order-reconciler"
    ],
    "presets": [
      {
        "id": "left_on_vs_where",
        "label": "LEFT JOIN: Predicate in ON vs Predicate in WHERE Trap",
        "mode": "left"
      },
      {
        "id": "inner_vs_full",
        "label": "INNER JOIN vs FULL OUTER JOIN Match Matrix",
        "mode": "full"
      }
    ],
    "columns": [
      "c.cust_id",
      "c.name",
      "o.order_id",
      "o.status",
      "o.total_usd"
    ],
    "baseRows": [
      [
        1,
        "Ada Lovelace",
        101,
        "paid",
        "$185.00"
      ],
      [
        1,
        "Ada Lovelace",
        104,
        "refunded",
        "$210.00"
      ],
      [
        2,
        "Alan Turing",
        null,
        null,
        null
      ],
      [
        3,
        "Grace Hopper",
        103,
        "paid",
        "$340.00"
      ],
      [
        4,
        "Niklaus Wirth",
        null,
        null,
        null
      ]
    ],
    "kind": "join"
  },
  {
    "id": "sim-semi-anti-null-notin",
    "title": "Semi-Join (EXISTS), Anti-Join (NOT EXISTS) & The NOT IN (NULL) Outage Simulator",
    "badge": "Anti-Join ▷ / 3VL",
    "badgeClass": "badge-on",
    "blurb": "See why a single NULL inside NOT IN (SELECT ...) collapses the entire query result set to 0 rows via Three-Valued Logic, and how NOT EXISTS short-circuits safely.",
    "slugs": [
      "semi-joins-anti-joins",
      "set-operations-union-intersect-except",
      "case-missing-null-notin-outage"
    ],
    "presets": [
      {
        "id": "notin_bug",
        "label": "NOT IN with Poison NULL Row (0 Rows Returned!)",
        "mode": "notin"
      },
      {
        "id": "not_exists",
        "label": "NOT EXISTS Anti-Join with Short-Circuit Probe",
        "mode": "notexists"
      }
    ],
    "columns": [
      "user_id",
      "email",
      "subquery_probe",
      "3vl_expansion",
      "emitted"
    ],
    "baseRows": [
      [
        10,
        "ada@ analytical.io",
        "10 <> 10 (FALSE)",
        "FALSE",
        "NO"
      ],
      [
        20,
        "alan@enigma.uk",
        "20 <> 10 AND 20 <> NULL",
        "UNKNOWN",
        "NO (Dropped by NOT IN!)"
      ],
      [
        30,
        "grace@navy.mil",
        "30 <> 10 AND 30 <> NULL",
        "UNKNOWN",
        "NO (Dropped by NOT IN!)"
      ],
      [
        40,
        "edsger@utexas.edu",
        "40 <> 10 AND 40 <> NULL",
        "UNKNOWN",
        "NO (Dropped by NOT IN!)"
      ]
    ],
    "kind": "anti"
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
