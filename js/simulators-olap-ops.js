/* ═══════════════════════════════════════════════════════════════
   SQL In Depth — Track VI — Columnar OLAP, Sharding, Distributed SQL & Production Tuning
   Interactive Table-Level Relational & Storage Engine Simulators
   ═══════════════════════════════════════════════════════════════ */

window.SIMULATORS = window.SIMULATORS || {};

(() => {
  const { esc, createStepSimulator, renderArrayCells, renderRelTable } = window.Simulators;

  const SPECS = [
  {
    "id": "sim-columnar-rle-dict-zonemap",
    "title": "Columnar Storage (Parquet Row Groups), RLE/Dictionary Encoding & Zone Map Pruning",
    "badge": "Columnar / Zone Maps",
    "badgeClass": "badge-o1",
    "blurb": "Compare NSM row pages against DSM columnar chunks. Watch Zone Map (min/max) metadata skip 90% of row groups and evaluate predicates directly on Dictionary/RLE codes.",
    "slugs": [
      "columnar-storage-layout-parquet",
      "columnar-compression-rle-dictionary-delta",
      "late-materialization-simd-vectorization",
      "zone-maps-min-max-pruning-bloom",
      "build-columnar-compression-query-engine"
    ],
    "presets": [
      {
        "id": "zonemap",
        "label": "Zone Map Min/Max Row-Group Pruning on WHERE ts >= 2026-03-01",
        "mode": "zonemap"
      },
      {
        "id": "rle_dict",
        "label": "Dictionary + Run-Length Encoding & Late Materialization Selection Vector",
        "mode": "rle"
      }
    ],
    "columns": [
      "row_group_id",
      "rows_count",
      "zone_min_ts",
      "zone_max_ts",
      "encoding",
      "scan_decision"
    ],
    "baseRows": [
      [
        "RowGroup #0",
        "65,536",
        "2026-01-01",
        "2026-01-31",
        "Dict + RLE (3.1×)",
        "PRUNED BY ZONE MAP (max < target)"
      ],
      [
        "RowGroup #1",
        "65,536",
        "2026-02-01",
        "2026-02-28",
        "Dict + RLE (3.4×)",
        "PRUNED BY ZONE MAP (max < target)"
      ],
      [
        "RowGroup #2",
        "65,536",
        "2026-03-01",
        "2026-03-15",
        "Dict + RLE (3.2×)",
        "SCANNED via SIMD Selection Vector ✓"
      ],
      [
        "RowGroup #3",
        "65,536",
        "2026-03-16",
        "2026-03-31",
        "Dict + RLE (3.5×)",
        "SCANNED via SIMD Selection Vector ✓"
      ]
    ],
    "kind": "columnar"
  },
  {
    "id": "sim-duckdb-clickhouse-iceberg",
    "title": "Modern OLAP Engines: DuckDB Morsel Parallelism, ClickHouse MergeTree & Iceberg Snapshots",
    "badge": "Morsels / Iceberg",
    "badgeClass": "badge-on",
    "blurb": "Step through DuckDB morsel-driven vectorized pipelines, ClickHouse sparse primary index granules (8,192 rows), and Apache Iceberg metadata snapshot isolation.",
    "slugs": [
      "embedded-olap-duckdb-architecture",
      "realtime-olap-clickhouse-mergetree",
      "cloud-warehouses-snowflake-bigquery",
      "open-table-formats-iceberg-delta",
      "case-cloudflare-clickhouse-log-analytics"
    ],
    "presets": [
      {
        "id": "mergetree",
        "label": "ClickHouse Sparse Primary Index (1 Entry per 8,192-Row Granule)",
        "mode": "ch"
      },
      {
        "id": "iceberg",
        "label": "Apache Iceberg Catalog → Manifest List → Manifest → Parquet Pruning",
        "mode": "iceberg"
      }
    ],
    "columns": [
      "layer",
      "artifact_name",
      "granularity",
      "pruning_mechanism",
      "io_fetched"
    ],
    "baseRows": [
      [
        "1. Catalog Pointer",
        "metadata/v42.metadata.json",
        "Table Snapshot #42",
        "Atomic CAS pointer swap",
        "4 KB"
      ],
      [
        "2. Manifest List",
        "snap-42-manifest-list.avro",
        "Partition Summaries",
        "Partition range [2026-03] match",
        "12 KB"
      ],
      [
        "3. Manifest File",
        "manifest-003.avro",
        "Data File Column Stats",
        "Min/Max column bounds filter",
        "48 KB"
      ],
      [
        "4. Data File",
        "part-00091.parquet",
        "Row Group #2 Only",
        "Column projection + Page Index",
        "1.8 MB (of 40 GB)"
      ]
    ],
    "kind": "lakehouse"
  },
  {
    "id": "sim-replication-failover-fencing",
    "title": "Replication Lag, Read-Your-Writes LSN Gating & Split-Brain Fencing Tokens",
    "badge": "LSN Gating / Fencing",
    "badgeClass": "badge-o1",
    "blurb": "Trace synchronous vs asynchronous WAL shipping, causal LSN session stickiness to prevent stale replica reads, and monotonic fencing tokens blocking zombie leaders.",
    "slugs": [
      "single-leader-replication-sync-async",
      "read-replicas-consistency-models",
      "failover-split-brain-fencing-tokens",
      "connection-pooling-pgbouncer-proxies"
    ],
    "presets": [
      {
        "id": "ryow",
        "label": "Read-Your-Own-Writes via Causal commit_lsn Session Gate",
        "mode": "ryow"
      },
      {
        "id": "fencing",
        "label": "Split-Brain Old Primary Blocked by Monotonic Epoch Fencing Token",
        "mode": "fencing"
      }
    ],
    "columns": [
      "node_role",
      "epoch_token",
      "applied_lsn",
      "client_req",
      "routing_decision"
    ],
    "baseRows": [
      [
        "Primary (Leader)",
        "Epoch #8",
        "LSN 9,420",
        "Write Invoice → commit_lsn = 9,420",
        "Committed & shipped to WAL stream"
      ],
      [
        "Replica A (Lagging)",
        "Epoch #8",
        "LSN 9,380",
        "Read Invoice (requires LSN >= 9,420)",
        "SKIPPED (applied_lsn 9,380 < 9,420)"
      ],
      [
        "Replica B (Caught Up)",
        "Epoch #8",
        "LSN 9,420",
        "Read Invoice (requires LSN >= 9,420)",
        "SERVED CONSISTENT READ ✓"
      ],
      [
        "Old Zombie Primary",
        "Epoch #7 (Stale!)",
        "LSN 9,415",
        "Attempt Zombie Write with Epoch #7",
        "REJECTED BY STORAGE (7 < 8) ✓"
      ]
    ],
    "kind": "replication"
  },
  {
    "id": "sim-partitioning-sharding-2pc",
    "title": "Declarative Partition Pruning, Consistent Hash Sharding & 2PC vs Saga Coordinator",
    "badge": "Sharding / 2PC / Saga",
    "badgeClass": "badge-ologn",
    "blurb": "Route queries by shard key vs scatter-gather fanout, prune declarative range partitions, and step through Two-Phase Commit (Prepare/Commit) vs Saga compensating transactions.",
    "slugs": [
      "declarative-table-partitioning",
      "horizontal-sharding-routing-keys",
      "distributed-transactions-2pc-saga",
      "distributed-sql-spanner-cockroachdb",
      "case-figma-postgres-horizontal-sharding",
      "build-sharded-query-router"
    ],
    "presets": [
      {
        "id": "shard_route",
        "label": "Single-Shard Key Lookup vs Scatter-Gather Cross-Shard Query",
        "mode": "shard"
      },
      {
        "id": "2pc_saga",
        "label": "Two-Phase Commit (2PC) Prepare/Commit vs Saga Compensation",
        "mode": "2pc"
      }
    ],
    "columns": [
      "shard_id",
      "hash_ring_range",
      "single_key_query",
      "scatter_gather_query",
      "2pc_phase_state"
    ],
    "baseRows": [
      [
        "Shard #0 (us-1)",
        "[0x0000..0x3FFF]",
        "IDLE (Pruned)",
        "SCANNED (Part 1/4)",
        "PREPARE OK → COMMIT ✓"
      ],
      [
        "Shard #1 (us-2)",
        "[0x4000..0x7FFF]",
        "ROUTED (org_id=42) ✓",
        "SCANNED (Part 2/4)",
        "PREPARE OK → COMMIT ✓"
      ],
      [
        "Shard #2 (eu-1)",
        "[0x8000..0xBFFF]",
        "IDLE (Pruned)",
        "SCANNED (Part 3/4)",
        "PREPARE OK → COMMIT ✓"
      ],
      [
        "Shard #3 (ap-1)",
        "[0xC000..0xFFFF]",
        "IDLE (Pruned)",
        "SCANNED (Part 4/4 — Tail Latency!)",
        "PREPARE OK → COMMIT ✓"
      ]
    ],
    "kind": "sharding"
  },
  {
    "id": "sim-keyset-pagination-nplus1-fts",
    "title": "Keyset Cursor Seek vs OFFSET Scan, N+1 Batching & GIN Inverted Index / Skip-Locked Queue",
    "badge": "Keyset O(log N) / GIN",
    "badgeClass": "badge-ologn",
    "blurb": "Compare deep OFFSET 100000 linear scans against O(log N) keyset cursor seeks WHERE (created_at, id) < (?, ?), N+1 query batching, and FOR UPDATE SKIP LOCKED workers.",
    "slugs": [
      "keyset-cursor-pagination-vs-offset",
      "solving-n-plus-one-orm-queries",
      "full-text-search-trigrams-inverted-index",
      "queue-processing-skip-locked-patterns"
    ],
    "presets": [
      {
        "id": "keyset",
        "label": "Deep Pagination: OFFSET 100,000 vs Keyset Seek (ts, id) < cursor",
        "mode": "keyset"
      },
      {
        "id": "skiplocked",
        "label": "Concurrent Workers Claiming Jobs via FOR UPDATE SKIP LOCKED",
        "mode": "queue"
      }
    ],
    "columns": [
      "method",
      "page_depth",
      "index_rows_scanned",
      "rows_discarded",
      "latency_ms"
    ],
    "baseRows": [
      [
        "OFFSET 0 LIMIT 20",
        "Page 1",
        "20",
        "0",
        "0.4 ms"
      ],
      [
        "OFFSET 10,000 LIMIT 20",
        "Page 500",
        "10,020",
        "10,000",
        "19.2 ms"
      ],
      [
        "OFFSET 100,000 LIMIT 20",
        "Page 5,000",
        "100,020",
        "100,000 (Wasted!)",
        "184.0 ms"
      ],
      [
        "Keyset WHERE (ts,id) < cursor LIMIT 20",
        "Page 5,000",
        "20 (Direct B+Tree Seek!)",
        "0",
        "0.5 ms ✓"
      ]
    ],
    "kind": "keyset"
  },
  {
    "id": "sim-production-triage-zero-downtime-ddl",
    "title": "Production Triage: pg_stat_statements, Lock Queue Hazards & PITR WAL Replay",
    "badge": "SRE Triage / Zero-Lock DDL",
    "badgeClass": "badge-o1",
    "blurb": "Diagnose ACCESS EXCLUSIVE lock queue pileups during ALTER TABLE, fix them with lock_timeout + NOT VALID constraints, and trace Point-In-Time Recovery (PITR) base backup + WAL replay.",
    "slugs": [
      "bulk-ingestion-batching-unlogged-tables",
      "pg-stat-statements-slow-query-triage",
      "lock-contention-zero-downtime-ddl",
      "backup-pitr-wal-archiving-drills",
      "case-gitlab-database-incident-postmortem",
      "build-production-sql-tuning-clinic"
    ],
    "presets": [
      {
        "id": "ddl_lock",
        "label": "ACCESS EXCLUSIVE Lock Queue Pileup vs lock_timeout + CONCURRENTLY",
        "mode": "ddllock"
      },
      {
        "id": "pitr",
        "label": "PITR Disaster Recovery: Base Backup + WAL Segment Replay to Target Timestamp",
        "mode": "pitr"
      }
    ],
    "columns": [
      "session_pid",
      "query_type",
      "lock_mode_requested",
      "lock_state",
      "production_impact"
    ],
    "baseRows": [
      [
        "PID 4010",
        "Long Analytics SELECT (45s)",
        "AccessShareLock",
        "GRANTED (Holding)",
        "Reading orders table"
      ],
      [
        "PID 4088",
        "ALTER TABLE orders ADD COL ...",
        "AccessExclusiveLock",
        "WAITING on PID 4010!",
        "Blocks all new locks behind it!"
      ],
      [
        "PID 4091..4500",
        "500 × Checkout INSERT/SELECT",
        "RowExclusive / AccessShare",
        "QUEUED behind PID 4088!",
        "SEV-1 Outage! Connection pool exhausted"
      ],
      [
        "FIX: PID 5001",
        "SET lock_timeout = 2s; CREATE INDEX CONCURRENTLY",
        "ShareUpdateExclusiveLock",
        "NON-BLOCKING ✓",
        "Zero checkout downtime ✓"
      ]
    ],
    "kind": "triage"
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
