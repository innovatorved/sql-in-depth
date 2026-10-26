/* ═══════════════════════════════════════════════════════════════
   SQL In Depth — Track V — ACID Transactions, MVCC, Locks, Buffer Pool & WAL Recovery
   Interactive Table-Level Relational & Storage Engine Simulators
   ═══════════════════════════════════════════════════════════════ */

window.SIMULATORS = window.SIMULATORS || {};

(() => {
  const { esc, createStepSimulator, renderArrayCells, renderRelTable } = window.Simulators;

  const SPECS = [
  {
    "id": "sim-isolation-concurrency-anomalies",
    "title": "ACID Isolation Timeline: Dirty Read, Lost Update, Phantom & Write Skew (SSI)",
    "badge": "RC / RR / SSI",
    "badgeClass": "badge-o1",
    "blurb": "Interleave concurrent Transactions T1 and T2 step by step. Trigger Lost Updates and Write Skew under Snapshot Isolation, then resolve them with FOR UPDATE or Serializable SSI.",
    "slugs": [
      "acid-properties-under-the-hood",
      "transaction-lifecycle-savepoints",
      "read-phenomena-dirty-nonrepeatable-phantom",
      "write-anomalies-lost-update-write-skew",
      "read-uncommitted-read-committed",
      "repeatable-read-snapshot-isolation",
      "serializable-2pl-vs-ssi",
      "optimistic-vs-pessimistic-concurrency",
      "case-fintech-double-spend-race-condition",
      "build-transaction-anomaly-simulator"
    ],
    "presets": [
      {
        "id": "writeskew",
        "label": "Write Skew Anomaly (Disjoint Writes Violating Global Invariant)",
        "mode": "writeskew"
      },
      {
        "id": "lostupdate",
        "label": "Double-Spend Lost Update vs SELECT ... FOR UPDATE Lock",
        "mode": "lostupdate"
      }
    ],
    "columns": [
      "clock_tick",
      "tx_t1_action",
      "tx_t2_action",
      "db_state",
      "isolation_verdict"
    ],
    "baseRows": [
      [
        "t = 1",
        "BEGIN ISOLATION LEVEL REPEATABLE READ",
        "BEGIN ISOLATION LEVEL REPEATABLE READ",
        "on_call: Alice=true, Bob=true",
        "Snapshots taken @ LSN 100"
      ],
      [
        "t = 2",
        "SELECT COUNT(*) WHERE on_call → 2",
        "SELECT COUNT(*) WHERE on_call → 2",
        "Both see 2 doctors on call",
        "rw-antidependency formed"
      ],
      [
        "t = 3",
        "UPDATE doctors SET on_call=false WHERE name=Alice",
        "UPDATE doctors SET on_call=false WHERE name=Bob",
        "Disjoint rows: no row lock conflict!",
        "Dangerous structure T1 --rw--> T2 --rw--> T1"
      ],
      [
        "t = 4",
        "COMMIT ✓",
        "COMMIT (Under SI: ✓ / Under SSI: ERROR 40001!)",
        "SI: 0 doctors on call! SSI: Aborted T2",
        "SSI prevents Write Skew ✓"
      ]
    ],
    "kind": "isolation"
  },
  {
    "id": "sim-mvcc-tuple-visibility",
    "title": "MVCC Tuple Header (xmin, xmax, ctid) & Transaction Snapshot Visibility Stepper",
    "badge": "MVCC xmin / xmax",
    "badgeClass": "badge-o1",
    "blurb": "Inspect physical heap tuple versions created by UPDATE/DELETE and evaluate Snapshot Visibility rules against [xmin_snap, xmax_snap, xip_list] without read locks.",
    "slugs": [
      "multi-version-concurrency-control-mvcc",
      "tuple-headers-xmin-xmax-visibility",
      "transaction-snapshots-visibility-rules",
      "dead-tuples-bloat-autovacuum-txid-wraparound",
      "case-sentry-transaction-id-wraparound",
      "build-mvcc-snapshot-storage-engine"
    ],
    "presets": [
      {
        "id": "snapshot",
        "label": "Snapshot (500:505:[502]) Evaluating Tuple Version Chain",
        "mode": "snapshot"
      },
      {
        "id": "vacuum",
        "label": "Dead Tuple Reclaim & Transaction ID Wraparound Freeze",
        "mode": "vacuum"
      }
    ],
    "columns": [
      "ctid",
      "xmin",
      "xmax",
      "balance_val",
      "visibility_for_snap_500_505_502"
    ],
    "baseRows": [
      [
        "(0, 1)",
        480,
        501,
        "$1,000",
        "INVISIBLE (Deleted by committed tx 501 < 505)"
      ],
      [
        "(0, 2)",
        501,
        502,
        "$1,250",
        "VISIBLE ✓ (501 committed; remover 502 is in xip_list!)"
      ],
      [
        "(0, 3)",
        502,
        0,
        "$1,600",
        "INVISIBLE (Creator 502 is still in-progress in xip_list)"
      ],
      [
        "(0, 4)",
        506,
        0,
        "$2,000",
        "INVISIBLE (Creator 506 >= xmax_snap 505, started in future)"
      ]
    ],
    "kind": "mvcc"
  },
  {
    "id": "sim-locks-deadlock-wait-graph",
    "title": "Row/Table Lock Compatibility, Gap/Next-Key Locks & Wait-For Graph Deadlock Detector",
    "badge": "Wait-For Cycle Detection",
    "badgeClass": "badge-o1",
    "blurb": "Trace FOR UPDATE vs SKIP LOCKED, InnoDB Next-Key interval locks preventing phantoms, and directed Wait-For Graph cycle detection aborting a deadlock victim.",
    "slugs": [
      "row-level-locks-for-update-skip-locked",
      "table-locks-intention-locks-ddl-hazards",
      "gap-locks-next-key-locks-innodb",
      "deadlocks-wait-for-graphs-detection"
    ],
    "presets": [
      {
        "id": "deadlock",
        "label": "Wait-For Graph Cycle T1 → T2 → T3 → T1 & Victim Abort",
        "mode": "deadlock"
      },
      {
        "id": "nextkey",
        "label": "InnoDB Next-Key Lock (-∞, 10], (10, 25], (25, +∞) Phantom Shield",
        "mode": "nextkey"
      }
    ],
    "columns": [
      "step_event",
      "holder_tx",
      "waiter_tx",
      "resource_locked",
      "wait_for_graph_state"
    ],
    "baseRows": [
      [
        "1. Acquire",
        "T1 (xid 801)",
        "—",
        "Row acct_1 (X-Lock)",
        "Edges: ∅"
      ],
      [
        "2. Acquire",
        "T2 (xid 802)",
        "—",
        "Row acct_2 (X-Lock)",
        "Edges: ∅"
      ],
      [
        "3. Contend",
        "T2 holds acct_2",
        "T1 waits on acct_2",
        "Row acct_2",
        "Edges: { T1 → T2 }"
      ],
      [
        "4. Cycle!",
        "T1 holds acct_1",
        "T2 waits on acct_1",
        "Row acct_1",
        "CYCLE: T1 ⇄ T2 (Abort T2, release locks!)"
      ]
    ],
    "kind": "locks"
  },
  {
    "id": "sim-slotted-page-buffer-pool",
    "title": "8KB Slotted Page Layout (Line Pointers ↔ Tuples), HOT Updates & Clock-Sweep Buffer Pool",
    "badge": "8KB Page / Clock-Sweep",
    "badgeClass": "badge-o1",
    "blurb": "Visualize the 24-byte page header, forward-growing Line Pointer array (pd_lower), backward-growing Tuple space (pd_upper), HOT intra-page chains, and Clock-Sweep eviction.",
    "slugs": [
      "slotted-page-layout-8kb-anatomy",
      "heap-files-hot-updates-fillfactor",
      "buffer-pool-clock-sweep-lru-k"
    ],
    "presets": [
      {
        "id": "slotted",
        "label": "8KB Slotted Page Insert, HOT Update & Compaction Defrag",
        "mode": "slotted"
      },
      {
        "id": "clock",
        "label": "Buffer Pool Clock-Sweep (pin_count & usage_count Decrement)",
        "mode": "clock"
      }
    ],
    "columns": [
      "slot_offset",
      "region_type",
      "byte_range",
      "pointer_target",
      "page_status"
    ],
    "baseRows": [
      [
        "Header",
        "PageHeaderData (LSN, pd_lower, pd_upper)",
        "Bytes [0..24)",
        "pd_lower=40, pd_upper=7920",
        "Free Space = 7,880 B"
      ],
      [
        "ItemId #1",
        "Line Pointer 1 (4B)",
        "Bytes [24..28)",
        "→ Offset 8096 (Len 96B)",
        "Live Tuple (xmin=101)"
      ],
      [
        "ItemId #2",
        "Line Pointer 2 (4B)",
        "Bytes [28..32)",
        "→ Offset 8000 (Len 96B)",
        "HOT Redirect → ItemId #3"
      ],
      [
        "ItemId #3",
        "Line Pointer 3 (4B)",
        "Bytes [32..36)",
        "→ Offset 7920 (Len 80B)",
        "Heap-Only Tuple (No Index Write!)"
      ]
    ],
    "kind": "slotted"
  },
  {
    "id": "sim-wal-aries-crash-recovery",
    "title": "Write-Ahead Log (WAL) LSN Rule & ARIES 3-Phase Crash Recovery (Analysis → Redo → Undo)",
    "badge": "ARIES Analysis/Redo/Undo",
    "badgeClass": "badge-on",
    "blurb": "Step through a crash mid-transaction. Watch ARIES reconstruct the Dirty Page Table and Active Transaction Table, Redo history from MinRecLSN, and Undo losers with CLRs.",
    "slugs": [
      "write-ahead-logging-wal-lsn",
      "checkpoints-dirty-page-flushing",
      "aries-crash-recovery-analysis-redo-undo",
      "build-slotted-page-wal-engine"
    ],
    "presets": [
      {
        "id": "aries",
        "label": "ARIES 3-Phase Recovery: Winner T1 Committed, Loser T2 Rolled Back",
        "mode": "aries"
      },
      {
        "id": "wal_rule",
        "label": "WAL-Before-Data Rule (pageLSN <= flushedLSN) & Checkpoints",
        "mode": "wal"
      }
    ],
    "columns": [
      "lsn",
      "wal_record_type",
      "tx_id",
      "page_id",
      "recovery_phase_action"
    ],
    "baseRows": [
      [
        "LSN 100",
        "BEGIN_CHECKPOINT / END_CHECKPOINT",
        "—",
        "DPT: {P1: recLSN 90}",
        "Analysis: Seed ATT & DPT from Checkpoint"
      ],
      [
        "LSN 110",
        "UPDATE (P1, old=10, new=20)",
        "T1 (Winner)",
        "P1 (pageLSN=90)",
        "Redo: pageLSN(90) < 110 → Re-apply new=20"
      ],
      [
        "LSN 120",
        "UPDATE (P2, old=50, new=99)",
        "T2 (Loser)",
        "P2 (pageLSN=80)",
        "Redo: Repeat History (set P2=99 first!)"
      ],
      [
        "LSN 130",
        "COMMIT T1",
        "T1 (Winner)",
        "—",
        "Analysis: Move T1 from ATT to Committed"
      ],
      [
        "LSN 140",
        "CLR (Undo LSN 120: P2 ← 50, undoNext=0)",
        "T2 (Loser)",
        "P2 (pageLSN=140)",
        "Undo: Reverse loser T2 & write TX_END"
      ]
    ],
    "kind": "aries"
  },
  {
    "id": "sim-lsm-compaction-amplification",
    "title": "LSM-Tree MemTable, SSTable Leveled Compaction & B+Tree vs LSM Amplification",
    "badge": "LSM vs B+Tree",
    "badgeClass": "badge-ologn",
    "blurb": "Trace writes into WAL + SkipList MemTable, immutable L0 flush, Bloom filter point lookups, and L0 → L1 → L2 sorted run merge compaction.",
    "slugs": [
      "lsm-trees-memtable-sstable-compaction",
      "btree-vs-lsm-read-write-space-amplification",
      "case-uber-postgres-to-mysql-storage"
    ],
    "presets": [
      {
        "id": "lsm",
        "label": "MemTable Flush → L0 SSTables → Leveled Compaction Merge",
        "mode": "lsm"
      },
      {
        "id": "amp",
        "label": "Read / Write / Space Amplification Tradeoff: B+Tree vs LSM",
        "mode": "amp"
      }
    ],
    "columns": [
      "tier_level",
      "structure_type",
      "size_cap",
      "bloom_filter",
      "compaction_status"
    ],
    "baseRows": [
      [
        "Memory",
        "Active MemTable (SkipList)",
        "64 MB",
        "In-RAM Direct",
        "Accepting sequential WAL + puts"
      ],
      [
        "Level 0",
        "4 × Immutable SSTables (Overlapping)",
        "256 MB",
        "10 bits/key (0.9% FP)",
        "Trigger L0 → L1 K-way Merge!"
      ],
      [
        "Level 1",
        "10 × Non-Overlapping SSTables",
        "1 GB",
        "10 bits/key (0.9% FP)",
        "Key ranges partitioned cleanly"
      ],
      [
        "Level 2",
        "100 × Non-Overlapping SSTables",
        "10 GB",
        "10 bits/key (0.9% FP)",
        "90% of tombstones purged"
      ]
    ],
    "kind": "lsm"
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
