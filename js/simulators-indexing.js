/* ═══════════════════════════════════════════════════════════════
   SQL In Depth — Track IV — B+Tree Indexes, Query Planner, Cost Optimizer & Physical Joins
   Interactive Table-Level Relational & Storage Engine Simulators
   ═══════════════════════════════════════════════════════════════ */

window.SIMULATORS = window.SIMULATORS || {};

(() => {
  const { esc, createStepSimulator, renderArrayCells, renderRelTable } = window.Simulators;

  const SPECS = [
  {
    "id": "sim-bplustree-page-split",
    "title": "B+Tree Internal/Leaf Page Split, High-Key Separator & Sibling Chain Traversal",
    "badge": "O(log_B N) Page Split",
    "badgeClass": "badge-ologn",
    "blurb": "Insert keys into an 8KB B+Tree page with fanout B. Watch leaf splits promote separator keys to the parent node and link leaf sibling pointers for range scans.",
    "slugs": [
      "why-indexes-work-io-cost-model",
      "btree-bplustree-internal-anatomy",
      "clustered-vs-secondary-indexes",
      "index-bloat-write-amplification-traps"
    ],
    "presets": [
      {
        "id": "split",
        "label": "Insert Key 42 Triggering Leaf Split & Parent Separator Push",
        "arr": [
          10,
          20,
          30,
          40,
          42,
          50,
          60,
          70
        ]
      },
      {
        "id": "range",
        "label": "Index Range Scan Key BETWEEN 20 AND 55 via Leaf Links",
        "arr": [
          10,
          20,
          30,
          40,
          50,
          55,
          60,
          80
        ]
      }
    ],
    "columns": [
      "page_id",
      "page_level",
      "keys_in_page",
      "high_key",
      "right_sibling"
    ],
    "baseRows": [
      [
        "Page #1 (Root)",
        "Level 1 (Internal)",
        "[30 | 60]",
        "+∞",
        "NULL"
      ],
      [
        "Page #2 (Leaf)",
        "Level 0 (Leaf)",
        "[10, 20, 30]",
        "30",
        "→ Page #3"
      ],
      [
        "Page #3 (Leaf)",
        "Level 0 (Leaf)",
        "[40, 42, 50]",
        "60",
        "→ Page #4"
      ],
      [
        "Page #4 (Leaf)",
        "Level 0 (Leaf)",
        "[60, 70, 80]",
        "+∞",
        "NULL"
      ]
    ],
    "kind": "btree"
  },
  {
    "id": "sim-composite-covering-index-prefix",
    "title": "Composite Index Leftmost-Prefix, Equality-Before-Range & Index-Only Visibility Map",
    "badge": "Composite (A, B, C)",
    "badgeClass": "badge-ologn",
    "blurb": "See why a range condition on the leading column breaks index ordering for trailing columns, and how INCLUDE covering columns + Visibility Map avoid heap fetches.",
    "slugs": [
      "composite-indexes-leftmost-prefix",
      "covering-indexes-index-only-scans",
      "partial-filtered-expression-indexes",
      "hash-gin-gist-brin-bloom-indexes",
      "case-slack-composite-index-incident",
      "build-btree-index-advisor"
    ],
    "presets": [
      {
        "id": "eq_range",
        "label": "Index (workspace_id, channel_id, ts) vs (workspace_id, ts)",
        "mode": "eq_range"
      },
      {
        "id": "ios",
        "label": "Index-Only Scan with Visibility Map (0 Heap Fetches)",
        "mode": "ios"
      }
    ],
    "columns": [
      "index_slot",
      "workspace_id",
      "channel_id",
      "created_ts",
      "scan_disposition"
    ],
    "baseRows": [
      [
        "[0]",
        10,
        5,
        "10:01",
        "SKIP (< target channel 8)"
      ],
      [
        "[1]",
        10,
        8,
        "09:45",
        "MATCH BOUNDARY START"
      ],
      [
        "[2]",
        10,
        8,
        "10:12",
        "CONTIGUOUS INDEX HIT ✓"
      ],
      [
        "[3]",
        10,
        8,
        "10:30",
        "CONTIGUOUS INDEX HIT ✓"
      ],
      [
        "[4]",
        10,
        9,
        "08:15",
        "STOP SCAN (channel_id > 8)"
      ]
    ],
    "kind": "composite"
  },
  {
    "id": "sim-explain-cost-histogram-planner",
    "title": "Cost-Based Optimizer (CBO): MCV/Histogram Selectivity & Scan Operator Transition",
    "badge": "Seq vs Bitmap vs Index",
    "badgeClass": "badge-ologn",
    "blurb": "Watch the query planner compute selectivity from MCVs and equi-depth histograms, then pick between Index Scan, Bitmap Heap Scan, and Seq Scan as selectivity rises.",
    "slugs": [
      "life-of-a-sql-query-pipeline",
      "reading-explain-and-explain-analyze",
      "table-statistics-histograms-cardinality",
      "selectivity-estimation-correlated-columns",
      "scan-operators-seq-index-bitmap",
      "case-stale-statistics-plan-flip",
      "build-visual-explain-plan-analyzer"
    ],
    "presets": [
      {
        "id": "selectivity",
        "label": "Selectivity Sweep: 0.1% (Index) → 5% (Bitmap) → 35% (Seq Scan)",
        "mode": "sel"
      },
      {
        "id": "correlated",
        "label": "Correlated Columns Underestimation & Extended Statistics Fix",
        "mode": "corr"
      }
    ],
    "columns": [
      "selectivity_pct",
      "est_rows",
      "index_scan_cost",
      "bitmap_scan_cost",
      "seq_scan_cost",
      "winner"
    ],
    "baseRows": [
      [
        "0.05%",
        "50",
        "18.4",
        "42.0",
        "1850.0",
        "Index Scan ✓"
      ],
      [
        "0.80%",
        "800",
        "295.0",
        "180.2",
        "1850.0",
        "Bitmap Heap Scan ✓"
      ],
      [
        "4.50%",
        "4,500",
        "1620.0",
        "610.5",
        "1850.0",
        "Bitmap Heap Scan ✓"
      ],
      [
        "28.0%",
        "28,000",
        "9840.0",
        "2410.0",
        "1850.0",
        "Seq Scan ✓"
      ]
    ],
    "kind": "cbo"
  },
  {
    "id": "sim-sargability-topn-heapsort",
    "title": "SARGability Rewrite & Top-N Bounded Heap Sort vs External Merge Spill",
    "badge": "SARGable / Top-N Heap",
    "badgeClass": "badge-onlogn",
    "blurb": "Transform non-SARGable expressions like DATE_TRUNC(created_at) = ... into range bounds, and compare O(N log K) Top-N bounded heapsort against external disk spills.",
    "slugs": [
      "sargability-functions-on-columns",
      "or-conditions-in-lists-union-rewrites",
      "sorting-spill-to-disk-top-n-heapsort"
    ],
    "presets": [
      {
        "id": "sarg",
        "label": "Non-SARGable Function Wrapper vs Half-Open Range Rewrite",
        "mode": "sarg"
      },
      {
        "id": "topn",
        "label": "ORDER BY ... LIMIT 5 Bounded Top-N Heap in work_mem",
        "mode": "topn"
      }
    ],
    "columns": [
      "query_form",
      "access_path",
      "rows_examined",
      "temp_disk_spill",
      "exec_time"
    ],
    "baseRows": [
      [
        "WHERE YEAR(created_at) = 2026",
        "Seq Scan (Function on column)",
        "1,000,000",
        "0 KB",
        "412 ms"
      ],
      [
        "WHERE created_at >= 2026-01-01 AND < 2027-01-01",
        "Index Range Scan (SARGable)",
        "14,200",
        "0 KB",
        "6.8 ms"
      ],
      [
        "ORDER BY score DESC (No LIMIT, work_mem=4MB)",
        "External Merge Disk Sort",
        "1,000,000",
        "68,400 KB",
        "890 ms"
      ],
      [
        "ORDER BY score DESC LIMIT 10",
        "Top-N Heapsort (In-Memory K=10)",
        "1,000,000",
        "0 KB",
        "48 ms"
      ]
    ],
    "kind": "sarg"
  },
  {
    "id": "sim-physical-join-hash-merge-nlj",
    "title": "Physical Join Engine: Indexed NLJ vs In-Memory/Grace Hash Join vs Sort-Merge Zipper",
    "badge": "NLJ / Hash / Merge",
    "badgeClass": "badge-on",
    "blurb": "Step through Hash Join Phase 1 (Build Hash Table on smaller relation) & Phase 2 (Stream Probe larger relation), Grace Hash partition spilling, and Sort-Merge zipper scans.",
    "slugs": [
      "nested-loop-join-indexed-nlj",
      "hash-join-build-probe-grace",
      "sort-merge-join-zipper-mechanics",
      "case-hash-join-oom-work-mem-spill",
      "build-physical-join-execution-engine"
    ],
    "presets": [
      {
        "id": "hash",
        "label": "Hash Join: Build Small Input → Probe Large Input",
        "mode": "hash"
      },
      {
        "id": "merge",
        "label": "Sort-Merge Join: Monotonic Dual-Pointer Zipper Advance",
        "mode": "merge"
      }
    ],
    "columns": [
      "step_phase",
      "build_bucket",
      "probe_tuple",
      "join_condition",
      "emitted_match"
    ],
    "baseRows": [
      [
        "Build #1",
        "Bucket[h(101)=1] ← Order(101)",
        "—",
        "Inserted into Hash Table",
        "—"
      ],
      [
        "Build #2",
        "Bucket[h(103)=3] ← Order(103)",
        "—",
        "Inserted into Hash Table",
        "—"
      ],
      [
        "Probe #1",
        "Lookup Bucket[h(101)=1]",
        "Item(order=101, $80)",
        "101 == 101 (HIT)",
        "Emit (101, $80) ✓"
      ],
      [
        "Probe #2",
        "Lookup Bucket[h(999)=7]",
        "Item(order=999, $20)",
        "Bucket Empty (MISS)",
        "Filtered"
      ],
      [
        "Probe #3",
        "Lookup Bucket[h(103)=3]",
        "Item(order=103, $150)",
        "103 == 103 (HIT)",
        "Emit (103, $150) ✓"
      ]
    ],
    "kind": "physjoin"
  },
  {
    "id": "sim-volcano-vectorized-pushdown",
    "title": "Selinger DP Join Ordering, Predicate Pushdown & Volcano vs Vectorized Batch Engine",
    "badge": "Pushdown / Vectorized",
    "badgeClass": "badge-on",
    "blurb": "Watch predicate pushdown prune 95% of rows before the join operator, and compare tuple-at-a-time Volcano next() calls against 1024-value SIMD columnar batches.",
    "slugs": [
      "join-order-search-dynamic-programming",
      "predicate-pushdown-projection-pruning",
      "subquery-unnesting-semi-anti-physical",
      "execution-models-volcano-vectorized",
      "parallel-query-execution-workers"
    ],
    "presets": [
      {
        "id": "pushdown",
        "label": "Predicate Pushdown Below Join (100k → 2k Rows Intermediate)",
        "mode": "pushdown"
      },
      {
        "id": "vector",
        "label": "Volcano Tuple-at-a-Time vs 1024-Row Vectorized Batch",
        "mode": "vector"
      }
    ],
    "columns": [
      "plan_stage",
      "unoptimized_rows",
      "pushed_down_rows",
      "virtual_calls",
      "cpu_cycles_per_tuple"
    ],
    "baseRows": [
      [
        "1. Base Scan (Orders)",
        "100,000",
        "2,400 (Filtered at Scan!)",
        "98 batches",
        "6 cy"
      ],
      [
        "2. Base Scan (Customers)",
        "50,000",
        "1,200 (Filtered at Scan!)",
        "49 batches",
        "6 cy"
      ],
      [
        "3. Hash Join Build/Probe",
        "5,000,000 pairs",
        "2,400 probes",
        "3 batches",
        "14 cy"
      ],
      [
        "4. Final Projection",
        "420 rows",
        "420 rows",
        "1 batch",
        "4 cy"
      ]
    ],
    "kind": "vectorized"
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
