/* ═══════════════════════════════════════════════════════════════
   Renderer — Content rendering for lessons, builds, and overview
   ═══════════════════════════════════════════════════════════════ */

window.loadScript = window.loadScript || function loadScript(src) {
  const baseSrc = src.split('?')[0];
  window._loadedScripts = window._loadedScripts || {};
  if (window._loadedScripts[baseSrc]) {
    return Promise.resolve();
  }

  const activeScripts = Array.from(document.querySelectorAll('script[src]')).filter(s => s.getAttribute('type') !== 'text/plain');
  const existingActive = activeScripts.find(s => {
    const sSrc = s.getAttribute('src') || '';
    return sSrc === src || sSrc.split('?')[0] === baseSrc;
  });

  if (existingActive) {
    if (existingActive.dataset.loaded === 'true') {
      window._loadedScripts[baseSrc] = true;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      existingActive.addEventListener('load', () => {
        existingActive.dataset.loaded = 'true';
        window._loadedScripts[baseSrc] = true;
        resolve();
      }, { once: true });
      existingActive.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    const versionedSrc = (src.includes('?') || !window.ASSET_VERSION) ? src : `${src}?v=${window.ASSET_VERSION}`;
    s.src = versionedSrc;
    s.onload = () => {
      s.dataset.loaded = 'true';
      window._loadedScripts[baseSrc] = true;
      resolve();
    };
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });
};

window.SIMULATOR_SCRIPT_MAP = {
  "why-databases-exist": "js/simulators-relational.js",
  "tables-rows-columns-types": "js/simulators-relational.js",
  "select-projection-aliases": "js/simulators-relational.js",
  "where-filtering-predicates": "js/simulators-relational.js",
  "boolean-logic-three-valued-null": "js/simulators-relational.js",
  "null-semantics-coalesce-nullif": "js/simulators-relational.js",
  "order-by-limit-offset-distinct": "js/simulators-relational.js",
  "case-expressions-type-casting": "js/simulators-relational.js",
  "case-stripe-ledger-precision": "js/simulators-relational.js",
  "build-sql-query-interpreter": "js/simulators-relational.js",
  "create-table-ddl-anatomy": "js/simulators-relational.js",
  "primary-keys-surrogate-vs-natural": "js/simulators-relational.js",
  "foreign-keys-referential-integrity": "js/simulators-relational.js",
  "check-unique-not-null-defaults": "js/simulators-relational.js",
  "insert-bulk-loading-returning": "js/simulators-relational.js",
  "upsert-on-conflict-merge": "js/simulators-relational.js",
  "update-delete-safe-mutations": "js/simulators-relational.js",
  "views-temp-tables-ctas": "js/simulators-relational.js",
  "case-github-zero-downtime-migrations": "js/simulators-relational.js",
  "build-ecommerce-schema-ddl": "js/simulators-relational.js",
  "relational-algebra-set-theory": "js/simulators-relational.js",
  "inner-join-equi-joins": "js/simulators-relational.js",
  "left-right-full-outer-joins": "js/simulators-relational.js",
  "join-where-vs-on-filter-trap": "js/simulators-relational.js",
  "self-joins-non-equi-joins": "js/simulators-relational.js",
  "cross-join-cartesian-products": "js/simulators-relational.js",
  "semi-joins-anti-joins": "js/simulators-relational.js",
  "set-operations-union-intersect-except": "js/simulators-relational.js",
  "case-missing-null-notin-outage": "js/simulators-relational.js",
  "build-multi-table-order-reconciler": "js/simulators-relational.js",
  "aggregate-functions-internals": "js/simulators-analytical.js",
  "group-by-execution-mechanics": "js/simulators-analytical.js",
  "having-vs-where-pipeline": "js/simulators-analytical.js",
  "conditional-aggregation-filter": "js/simulators-analytical.js",
  "string-json-array-aggregation": "js/simulators-analytical.js",
  "grouping-sets-rollup-cube": "js/simulators-analytical.js",
  "join-fanout-chasm-traps": "js/simulators-analytical.js",
  "histograms-percentiles-medians": "js/simulators-analytical.js",
  "case-analytics-double-counting-bug": "js/simulators-analytical.js",
  "build-executive-kpi-aggregation-suite": "js/simulators-analytical.js",
  "scalar-row-table-subqueries": "js/simulators-analytical.js",
  "correlated-subqueries-mechanics": "js/simulators-analytical.js",
  "exists-not-exists-null-safety": "js/simulators-analytical.js",
  "lateral-joins-cross-apply": "js/simulators-analytical.js",
  "common-table-expressions-with": "js/simulators-analytical.js",
  "cte-materialization-optimization-fence": "js/simulators-analytical.js",
  "recursive-ctes-hierarchies": "js/simulators-analytical.js",
  "graph-traversal-cycle-detection-sql": "js/simulators-analytical.js",
  "case-recursive-org-permission-engine": "js/simulators-analytical.js",
  "build-hierarchical-graph-query-engine": "js/simulators-analytical.js",
  "window-functions-mental-model": "js/simulators-analytical.js",
  "partition-by-order-by-mechanics": "js/simulators-analytical.js",
  "ranking-functions-row-number-rank": "js/simulators-analytical.js",
  "top-n-per-group-deduplication": "js/simulators-analytical.js",
  "offset-functions-lag-lead-first-last": "js/simulators-analytical.js",
  "window-frames-rows-range-groups": "js/simulators-analytical.js",
  "running-totals-cumulative-shares": "js/simulators-analytical.js",
  "gaps-and-islands-sessionization": "js/simulators-analytical.js",
  "case-fintech-velocity-fraud-window": "js/simulators-analytical.js",
  "build-sessionization-retention-engine": "js/simulators-analytical.js",
  "entity-relationship-modeling": "js/simulators-modeling.js",
  "functional-dependencies-keys": "js/simulators-modeling.js",
  "first-normal-form-atomicity": "js/simulators-modeling.js",
  "second-third-normal-form": "js/simulators-modeling.js",
  "boyce-codd-fourth-fifth-normal-form": "js/simulators-modeling.js",
  "update-insertion-deletion-anomalies": "js/simulators-modeling.js",
  "strategic-denormalization-tradeoffs": "js/simulators-modeling.js",
  "schema-anti-patterns-eav-god-tables": "js/simulators-modeling.js",
  "case-shopify-multi-tenant-schema": "js/simulators-modeling.js",
  "build-normalized-booking-schema": "js/simulators-modeling.js",
  "oltp-vs-olap-workload-physics": "js/simulators-modeling.js",
  "star-schema-facts-dimensions": "js/simulators-modeling.js",
  "snowflake-vs-star-vs-obt": "js/simulators-modeling.js",
  "slowly-changing-dimensions-scd": "js/simulators-modeling.js",
  "bridge-tables-junk-role-dimensions": "js/simulators-modeling.js",
  "temporal-tables-bitemporal-sql": "js/simulators-modeling.js",
  "json-semi-structured-hybrid-schemas": "js/simulators-modeling.js",
  "idempotency-audit-logs-event-tables": "js/simulators-modeling.js",
  "case-airbnb-minerva-metric-layer": "js/simulators-modeling.js",
  "build-scd-type2-warehouse-pipeline": "js/simulators-modeling.js",
  "calendar-tables-date-spines": "js/simulators-modeling.js",
  "cohort-retention-matrix-sql": "js/simulators-modeling.js",
  "funnel-conversion-attribution-sql": "js/simulators-modeling.js",
  "interval-overlap-allen-algebra": "js/simulators-modeling.js",
  "pivoting-unpivoting-cross-tabs": "js/simulators-modeling.js",
  "triggers-stored-procedures-udfs": "js/simulators-modeling.js",
  "materialized-views-incremental-refresh": "js/simulators-modeling.js",
  "sql-injection-parameterized-security": "js/simulators-modeling.js",
  "case-double-booking-hotel-inventory": "js/simulators-modeling.js",
  "build-saas-cohort-funnel-workbench": "js/simulators-modeling.js",
  "why-indexes-work-io-cost-model": "js/simulators-indexing.js",
  "btree-bplustree-internal-anatomy": "js/simulators-indexing.js",
  "clustered-vs-secondary-indexes": "js/simulators-indexing.js",
  "composite-indexes-leftmost-prefix": "js/simulators-indexing.js",
  "covering-indexes-index-only-scans": "js/simulators-indexing.js",
  "partial-filtered-expression-indexes": "js/simulators-indexing.js",
  "hash-gin-gist-brin-bloom-indexes": "js/simulators-indexing.js",
  "index-bloat-write-amplification-traps": "js/simulators-indexing.js",
  "case-slack-composite-index-incident": "js/simulators-indexing.js",
  "build-btree-index-advisor": "js/simulators-indexing.js",
  "life-of-a-sql-query-pipeline": "js/simulators-indexing.js",
  "reading-explain-and-explain-analyze": "js/simulators-indexing.js",
  "table-statistics-histograms-cardinality": "js/simulators-indexing.js",
  "selectivity-estimation-correlated-columns": "js/simulators-indexing.js",
  "scan-operators-seq-index-bitmap": "js/simulators-indexing.js",
  "sargability-functions-on-columns": "js/simulators-indexing.js",
  "or-conditions-in-lists-union-rewrites": "js/simulators-indexing.js",
  "sorting-spill-to-disk-top-n-heapsort": "js/simulators-indexing.js",
  "case-stale-statistics-plan-flip": "js/simulators-indexing.js",
  "build-visual-explain-plan-analyzer": "js/simulators-indexing.js",
  "nested-loop-join-indexed-nlj": "js/simulators-indexing.js",
  "hash-join-build-probe-grace": "js/simulators-indexing.js",
  "sort-merge-join-zipper-mechanics": "js/simulators-indexing.js",
  "join-order-search-dynamic-programming": "js/simulators-indexing.js",
  "predicate-pushdown-projection-pruning": "js/simulators-indexing.js",
  "subquery-unnesting-semi-anti-physical": "js/simulators-indexing.js",
  "execution-models-volcano-vectorized": "js/simulators-indexing.js",
  "parallel-query-execution-workers": "js/simulators-indexing.js",
  "case-hash-join-oom-work-mem-spill": "js/simulators-indexing.js",
  "build-physical-join-execution-engine": "js/simulators-indexing.js",
  "acid-properties-under-the-hood": "js/simulators-transactions.js",
  "transaction-lifecycle-savepoints": "js/simulators-transactions.js",
  "read-phenomena-dirty-nonrepeatable-phantom": "js/simulators-transactions.js",
  "write-anomalies-lost-update-write-skew": "js/simulators-transactions.js",
  "read-uncommitted-read-committed": "js/simulators-transactions.js",
  "repeatable-read-snapshot-isolation": "js/simulators-transactions.js",
  "serializable-2pl-vs-ssi": "js/simulators-transactions.js",
  "optimistic-vs-pessimistic-concurrency": "js/simulators-transactions.js",
  "case-fintech-double-spend-race-condition": "js/simulators-transactions.js",
  "build-transaction-anomaly-simulator": "js/simulators-transactions.js",
  "multi-version-concurrency-control-mvcc": "js/simulators-transactions.js",
  "tuple-headers-xmin-xmax-visibility": "js/simulators-transactions.js",
  "transaction-snapshots-visibility-rules": "js/simulators-transactions.js",
  "row-level-locks-for-update-skip-locked": "js/simulators-transactions.js",
  "table-locks-intention-locks-ddl-hazards": "js/simulators-transactions.js",
  "gap-locks-next-key-locks-innodb": "js/simulators-transactions.js",
  "deadlocks-wait-for-graphs-detection": "js/simulators-transactions.js",
  "dead-tuples-bloat-autovacuum-txid-wraparound": "js/simulators-transactions.js",
  "case-sentry-transaction-id-wraparound": "js/simulators-transactions.js",
  "build-mvcc-snapshot-storage-engine": "js/simulators-transactions.js",
  "slotted-page-layout-8kb-anatomy": "js/simulators-transactions.js",
  "heap-files-hot-updates-fillfactor": "js/simulators-transactions.js",
  "buffer-pool-clock-sweep-lru-k": "js/simulators-transactions.js",
  "write-ahead-logging-wal-lsn": "js/simulators-transactions.js",
  "checkpoints-dirty-page-flushing": "js/simulators-transactions.js",
  "aries-crash-recovery-analysis-redo-undo": "js/simulators-transactions.js",
  "lsm-trees-memtable-sstable-compaction": "js/simulators-transactions.js",
  "btree-vs-lsm-read-write-space-amplification": "js/simulators-transactions.js",
  "case-uber-postgres-to-mysql-storage": "js/simulators-transactions.js",
  "build-slotted-page-wal-engine": "js/simulators-transactions.js",
  "columnar-storage-layout-parquet": "js/simulators-olap-ops.js",
  "columnar-compression-rle-dictionary-delta": "js/simulators-olap-ops.js",
  "late-materialization-simd-vectorization": "js/simulators-olap-ops.js",
  "zone-maps-min-max-pruning-bloom": "js/simulators-olap-ops.js",
  "embedded-olap-duckdb-architecture": "js/simulators-olap-ops.js",
  "realtime-olap-clickhouse-mergetree": "js/simulators-olap-ops.js",
  "cloud-warehouses-snowflake-bigquery": "js/simulators-olap-ops.js",
  "open-table-formats-iceberg-delta": "js/simulators-olap-ops.js",
  "case-cloudflare-clickhouse-log-analytics": "js/simulators-olap-ops.js",
  "build-columnar-compression-query-engine": "js/simulators-olap-ops.js",
  "single-leader-replication-sync-async": "js/simulators-olap-ops.js",
  "read-replicas-consistency-models": "js/simulators-olap-ops.js",
  "failover-split-brain-fencing-tokens": "js/simulators-olap-ops.js",
  "declarative-table-partitioning": "js/simulators-olap-ops.js",
  "horizontal-sharding-routing-keys": "js/simulators-olap-ops.js",
  "distributed-transactions-2pc-saga": "js/simulators-olap-ops.js",
  "distributed-sql-spanner-cockroachdb": "js/simulators-olap-ops.js",
  "connection-pooling-pgbouncer-proxies": "js/simulators-olap-ops.js",
  "case-figma-postgres-horizontal-sharding": "js/simulators-olap-ops.js",
  "build-sharded-query-router": "js/simulators-olap-ops.js",
  "keyset-cursor-pagination-vs-offset": "js/simulators-olap-ops.js",
  "solving-n-plus-one-orm-queries": "js/simulators-olap-ops.js",
  "full-text-search-trigrams-inverted-index": "js/simulators-olap-ops.js",
  "queue-processing-skip-locked-patterns": "js/simulators-olap-ops.js",
  "bulk-ingestion-batching-unlogged-tables": "js/simulators-olap-ops.js",
  "pg-stat-statements-slow-query-triage": "js/simulators-olap-ops.js",
  "lock-contention-zero-downtime-ddl": "js/simulators-olap-ops.js",
  "backup-pitr-wal-archiving-drills": "js/simulators-olap-ops.js",
  "case-gitlab-database-incident-postmortem": "js/simulators-olap-ops.js",
  "build-production-sql-tuning-clinic": "js/simulators-olap-ops.js"
};

window.Renderer = (() => {
  // SVG Icons
  const icons = {
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
    circle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>',
    dot: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/></svg>',
    play: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    book: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    code: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    chevronRight: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
    chevronDown: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
    star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.77V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.77a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z"/></svg>',
    github: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>',
    globe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    external: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    calendar: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    terminal: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    target: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    arrowLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>'
  };

  /**
   * Format content review date (e.g. "2026-09-17" -> "Sep 17, 2026")
   */
  function formatReviewDate(dateStr) {
    if (!dateStr) return '2026';
    try {
      const parts = String(dateStr).split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const y = parts[0];
        if (m >= 0 && m < 12 && !isNaN(d)) {
          return `${months[m]} ${d}, ${y}`;
        }
      }
      return String(dateStr);
    } catch (_) {
      return String(dateStr);
    }
  }

  /**
   * Render the Course Overview (home page)
   */
  function renderOverview() {
    const data = window.CURRICULUM_DATA;
    if (!data) return '<p>Loading curriculum data...</p>';

    const stats = data.stats;
    const pct = window.Progress.getPercentage();
    const streak = window.Progress.getStreak ? window.Progress.getStreak().current : 0;
    const projects = window.PROJECTS_DATA || [];
    const pinnedProjects = projects.filter(p => p.pinned);

    let html = `
      <div class="hero">
        <div class="hero__eyebrow">SQL & Database Internals Curriculum</div>
        <h1 class="hero__title">SQL In Depth</h1>
        <p class="hero__subtitle">Deep notes, case studies, YouTube tutorials, and from-scratch implementations for senior engineering practice.</p>
        <div class="hero__stats">
          <div><div class="hero__stat-value">${stats.tracks || 6}</div><div class="hero__stat-label">Tracks</div></div>
          <div><div class="hero__stat-value">${stats.units}</div><div class="hero__stat-label">Topics</div></div>
          <div><div class="hero__stat-value">${pct}%</div><div class="hero__stat-label">Complete</div></div>
          <div><div class="hero__stat-value" style="color: ${streak > 0 ? '#f97316' : 'inherit'};">${streak} 🔥</div><div class="hero__stat-label">Day Streak</div></div>
        </div>
        <div style="margin-top: 1.25rem; display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
          <a href="/glossary/" class="btn btn--sm btn--primary">📖 Glossary</a>
        </div>
      </div>`;

    // Render each part
    for (const part of data.parts) {
      html += `
        <div class="part-header">
          <h2 class="part-header__title">${part.title}</h2>
          <p class="part-header__summary">${part.summary}</p>
        </div>
        <div class="module-grid">`;

      for (const mod of part.modules) {
        const prog = window.Progress.getModuleProgress(mod.id);
        const progPct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
        html += `
          <div class="module-card" data-module="${mod.id}" data-action="navigate-module" data-module-id="${mod.id}">
            <div class="module-card__header">
              <span class="module-card__number">${mod.number}</span>
              <div class="module-card__info">
                <div class="module-card__title">${mod.title}</div>
                <div class="module-card__meta">
                  <span>${mod.units.length} units</span>
                  <span>·</span>
                  <span>${prog.completed}/${prog.total} done</span>
                </div>
              </div>
            </div>
            <p class="module-card__summary">${mod.summary || ''}</p>
            <div class="module-card__progress">
              <div class="module-card__progress-fill" style="width:${progPct}%"></div>
            </div>
          </div>`;
      }

      html += '</div>';

      // Add section divider between parts
      if (part.number < data.parts.length) {
        html += '<div class="section-divider"><span class="section-divider__line"></span><span class="section-divider__text">Next Part</span><span class="section-divider__line"></span></div>';
      }
    }

    return html;
  }

  function unescapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  function highlightSyntax(code, lang) {
    if (!code) return '';
    const cleanLang = (lang || 'sql').toLowerCase();

    const CPP_KEYWORDS = new Set([
      'auto', 'bool', 'break', 'case', 'catch', 'class', 'const', 'constexpr', 'continue',
      'default', 'delete', 'do', 'double', 'else', 'enum', 'explicit', 'export', 'extern',
      'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable',
      'namespace', 'new', 'noexcept', 'nullptr', 'operator', 'private', 'protected', 'public',
      'return', 'short', 'signed', 'sizeof', 'static', 'static_assert', 'struct', 'switch',
      'template', 'this', 'throw', 'true', 'try', 'typedef', 'typename', 'union', 'unsigned',
      'using', 'virtual', 'void', 'volatile', 'while'
    ]);

    const JS_KEYWORDS = new Set([
      'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
      'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for',
      'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'return',
      'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var',
      'void', 'while', 'with', 'yield', 'type', 'interface', 'implements', 'declare'
    ]);

    const PY_KEYWORDS = new Set([
      'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
      'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
      'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try',
      'while', 'with', 'yield', 'self'
    ]);

    const SH_KEYWORDS = new Set([
      'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'in', 'case',
      'esac', 'echo', 'exit', 'return', 'set', 'export', 'alias', 'local', 'function'
    ]);

    const CPP_TYPES = new Set([
      'vector', 'string', 'span', 'pair', 'tuple', 'unordered_map', 'unordered_set', 'map', 'set',
      'queue', 'stack', 'priority_queue', 'unique_ptr', 'shared_ptr', 'optional', 'size_t',
      'uint32_t', 'uint64_t', 'int64_t', 'int32_t', 'ptrdiff_t', 'RecurrenceTerm', 'ListNode', 'TreeNode'
    ]);

    const isCpp = ['cpp', 'c++', 'cc', 'cxx', 'c', 'hpp', 'h'].includes(cleanLang);
    const isPy = ['py', 'python'].includes(cleanLang);
    const isSh = ['sh', 'bash', 'shell', 'zsh'].includes(cleanLang);
    const SQL_KEYWORDS = new Set([
      "SELECT","FROM","WHERE","JOIN","INNER","LEFT","RIGHT","FULL","OUTER","CROSS","ON","USING","GROUP","BY","HAVING","ORDER","ASC","DESC","NULLS","FIRST","LAST","LIMIT","OFFSET","FETCH","NEXT","ROWS","ONLY","WITH","RECURSIVE","AS","UNION","ALL","INTERSECT","EXCEPT","DISTINCT","CASE","WHEN","THEN","ELSE","END","COALESCE","NULLIF","CAST","OVER","PARTITION","RANGE","GROUPS","UNBOUNDED","PRECEDING","FOLLOWING","CURRENT","ROW","FILTER","WITHIN","EXISTS","IN","NOT","AND","OR","IS","NULL","TRUE","FALSE","BETWEEN","LIKE","ILIKE","SIMILAR","TO","CREATE","TABLE","TEMP","TEMPORARY","VIEW","MATERIALIZED","INDEX","UNIQUE","CONCURRENTLY","DROP","ALTER","ADD","COLUMN","CONSTRAINT","PRIMARY","KEY","FOREIGN","REFERENCES","CHECK","DEFAULT","GENERATED","ALWAYS","IDENTITY","INSERT","INTO","VALUES","UPDATE","SET","DELETE","RETURNING","CONFLICT","DO","NOTHING","MERGE","MATCHED","BEGIN","COMMIT","ROLLBACK","SAVEPOINT","TRANSACTION","ISOLATION","LEVEL","READ","COMMITTED","REPEATABLE","SERIALIZABLE","FOR","SHARE","SKIP","LOCKED","NOWAIT","EXPLAIN","ANALYZE","VACUUM","CLUSTER","REINDEX","PRAGMA","LATERAL","JSONB","JSON","INT","INTEGER","BIGINT","NUMERIC","DECIMAL","TEXT","VARCHAR","BOOLEAN","TIMESTAMPTZ","TIMESTAMP","DATE","INTERVAL","UUID","COUNT","SUM","AVG","MIN","MAX","ROW_NUMBER","RANK","DENSE_RANK","NTILE","LAG","LEAD","FIRST_VALUE","LAST_VALUE","NTH_VALUE","WINDOW","ROUND","STRING_AGG","ARRAY_AGG","JSONB_BUILD_OBJECT","GENERATE_SERIES","BUFFERS","COSTS","ROLLUP","CUBE","GROUPING","SETS","PERCENT_RANK","CUME_DIST","GROUP_CONCAT","TOTAL","PRINTF","STRFTIME","DATETIME","JULIANDAY","SUBSTR","INSTR","LENGTH","LOWER","UPPER","REPLACE","TRIM","ABS","RANDOM"
    ]);
    const isSql = ["sql", "postgres", "postgresql", "sqlite", "mysql", "duckdb"].includes(cleanLang);
    const isJs = ['js', 'javascript', 'ts', 'typescript', 'node'].includes(cleanLang);

    const tokenRegex = /(--[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[\s\S]*?`)|(\b\d+\.?\d*(?:[eE][+-]?\d+)?\b)|(\b[a-zA-Z_]\w*\b)|([+\-*/%=&|<>!^~?:;,.]+)/g;

    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(code)) !== null) {
      if (match.index > lastIndex) {
        result += escapeHtml(code.slice(lastIndex, match.index));
      }
      const [full, commentOrHash, str, num, word, op] = match;
      if (commentOrHash) {
        if (commentOrHash.startsWith('#') && isCpp && /^\s*#\s*(include|define|pragma|ifdef|ifndef|endif|else)/.test(commentOrHash)) {
          result += '<span class="tok-preproc">' + escapeHtml(commentOrHash) + '</span>';
        } else if (commentOrHash.startsWith('#') && (isPy || isSh)) {
          result += '<span class="tok-comment">' + escapeHtml(commentOrHash) + '</span>';
        } else if (commentOrHash.startsWith('--') || commentOrHash.startsWith('//') || commentOrHash.startsWith('/*')) {
          result += '<span class="tok-comment">' + escapeHtml(commentOrHash) + '</span>';
        } else {
          result += escapeHtml(commentOrHash);
        }
      } else if (str) {
        result += '<span class="tok-str">' + escapeHtml(str) + '</span>';
      } else if (num) {
        result += '<span class="tok-num">' + escapeHtml(num) + '</span>';
      } else if (word) {
        if (isSql && SQL_KEYWORDS.has(word.toUpperCase())) {
          result += '<span class="tok-kw">' + escapeHtml(word) + '</span>';
        } else if (isCpp && CPP_KEYWORDS.has(word)) {
          result += '<span class="tok-kw">' + escapeHtml(word) + '</span>';
        } else if (isCpp && CPP_TYPES.has(word)) {
          result += '<span class="tok-type">' + escapeHtml(word) + '</span>';
        } else if (isJs && JS_KEYWORDS.has(word)) {
          result += '<span class="tok-kw">' + escapeHtml(word) + '</span>';
        } else if (isPy && PY_KEYWORDS.has(word)) {
          result += '<span class="tok-kw">' + escapeHtml(word) + '</span>';
        } else if (isSh && SH_KEYWORDS.has(word)) {
          result += '<span class="tok-kw">' + escapeHtml(word) + '</span>';
        } else if (code[tokenRegex.lastIndex] === '(') {
          result += '<span class="tok-fn">' + escapeHtml(word) + '</span>';
        } else {
          result += escapeHtml(word);
        }
      } else if (op) {
        result += '<span class="tok-op">' + escapeHtml(op) + '</span>';
      } else {
        result += escapeHtml(full);
      }
      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < code.length) {
      result += escapeHtml(code.slice(lastIndex));
    }
    return result;
  }

  function renderMathInHtml(html) {
    if (!html || typeof html !== 'string') return html;

    const k = (typeof window !== 'undefined' && window.katex) || (typeof globalThis !== 'undefined' && globalThis.katex);

    // Stash pre, code, svg, script, textarea, select blocks to protect them from math delimiters
    const stash = [];
    let safe = html.replace(/<(pre|code|svg|script|textarea|select)\b[\s\S]*?<\/\1>/gi, (m) => {
      stash.push(m);
      return '\x00PROTECTED_' + (stash.length - 1) + '\x00';
    });

    // 1. Block math $$...$$
    safe = safe.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
      const clean = math.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
      if (k && typeof k.renderToString === 'function') {
        try {
          return k.renderToString(clean, { displayMode: true, throwOnError: false });
        } catch (_) {}
      }
      return '<div class="katex-display-math" data-math="' + escapeHtml(clean) + '">$$' + escapeHtml(clean) + '$$</div>';
    });

    // 2. Inline math $...$ (exclude HTML tags and currency amounts like $120 ... $300)
    safe = safe.replace(/\$([^\$\n\r<>]+?)\$/g, (full, math) => {
      if (/^\d+(?:[.,]\d+)?(?:\s|$)/.test(math.trim())) return full;
      const clean = math.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
      if (k && typeof k.renderToString === 'function') {
        try {
          return k.renderToString(clean, { displayMode: false, throwOnError: false });
        } catch (_) {}
      }
      return '<span class="katex-inline-math" data-math="' + escapeHtml(clean) + '">$' + escapeHtml(clean) + '$</span>';
    });

    // Restore protected blocks
    return safe.replace(/\x00PROTECTED_(\d+)\x00/g, (_, i) => stash[Number(i)]);
  }

  function renderTopicCodeBlock(rawCode, lang) {
    const cleanLang = (lang || 'sql').toLowerCase();
    const isRunnable = ['sql', 'postgres', 'postgresql', 'sqlite', 'js', 'javascript', 'ts', 'typescript', 'py', 'python', 'node', 'sh', 'bash'].includes(cleanLang);
    const displayLang = (cleanLang === 'sql' || cleanLang === 'sqlite' || cleanLang === 'postgres' || cleanLang === 'postgresql') ? 'SQL · WASM' : cleanLang.toUpperCase();
    const unescaped = unescapeHtml(rawCode).trim();
    const lineCount = unescaped ? unescaped.split('\n').length : 0;
    const isSqlLang = ['sql', 'sqlite', 'postgres', 'postgresql', 'mysql', 'duckdb'].includes(cleanLang);
    const isLong = false;
    const collapsedClass = isLong ? ' code-block--collapsed' : '';
    const initialExpanded = !isLong;

    // TableVisualizer.enhanceSqlCodeBlocks attaches the unified SQL execution toolbar below <pre> for SQL blocks
    const runBtn = (isRunnable && !isSqlLang)
      ? `<button type="button" class="code-block__copy code-block__run-btn" data-action="run-sql-inline" data-lang="${escapeHtml(cleanLang)}" title="Execute this query and view the interactive output table &amp; editor"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg><span>Run Query</span></button>` +
        `<button type="button" class="code-block__copy" data-action="edit-sql-inline" data-lang="${escapeHtml(cleanLang)}" title="Edit and test variations inline"><span>✎ Edit &amp; Try</span></button>` +
        `<button type="button" class="code-block__copy" data-action="open-sql-studio" data-lang="${escapeHtml(cleanLang)}" title="Open in Full-Screen SQL Studio"><span>⤢ SQL Studio</span></button>`
      : '';

    const copyBtn = `<button type="button" class="code-block__copy" data-action="copy-code" title="Copy code to clipboard">Copy</button>`;

    const toggleBtn = `<button type="button" class="code-block__copy code-block__toggle-btn" data-action="toggle-code" aria-expanded="${initialExpanded}" title="Expand or collapse code block">
      <span class="code-block__toggle-text">${initialExpanded ? 'Collapse' : 'Expand'}</span>
      <span class="code-block__chevron">${initialExpanded ? '▲' : '▼'}</span>
    </button>`;

    const highlighted = highlightSyntax(unescaped, cleanLang);

    return (
      '<div class="code-block code-block--collapsible' + collapsedClass + '">' +
        '<div class="code-block__header" data-action="toggle-code-header">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span class="code-block__lang">' + escapeHtml(displayLang) + '</span>' +
            '<span class="code-block__lines-chip">' + lineCount + ' lines</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            runBtn +
            copyBtn +
            toggleBtn +
          '</div>' +
        '</div>' +
        '<pre><code class="language-' + escapeHtml(cleanLang) + '">' + highlighted + '</code></pre>' +
      '</div>'
    );
  }

  function formatInlineCode(str) {
    if (!str) return '';
    return escapeHtml(String(str))
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function decorateProseHeadings(proseHtml) {
    const headings = [];
    let idx = 0;
    const htmlWithIds = String(proseHtml || '').replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (full, attrs = '', inner) => {
      idx += 1;
      const plain = inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      const existingIdMatch = attrs.match(/\bid=["']([^"']+)["']/i);
      const secId = existingIdMatch ? existingIdMatch[1] : `topic-sec-${idx}`;
      if (plain) {
        headings.push({ id: secId, title: plain, num: idx });
      }
      if (existingIdMatch) return full;
      return `<h2${attrs} id="${secId}">${inner}</h2>`;
    });
    return { htmlWithIds, headings };
  }

  function renderTopicQuickJump(slug, headings, opts = {}) {
    const safeSlug = escapeHtml(slug);
    const hasSections = Array.isArray(headings) && headings.length > 0;
    return `
      <nav class="topic-quick-jump" aria-label="On this page">
        <div class="topic-quick-jump__bar">
          <div class="topic-quick-jump__pills">
            <span class="topic-quick-jump__label">Jump to:</span>
            <a class="topic-quick-jump__pill topic-quick-jump__pill--primary" href="#guided-coding-practice-${safeSlug}" data-action="quick-jump" data-target="guided-coding-practice-${safeSlug}">
              <span>💻 SQL & Engine Lab</span>
            </a>
            ${opts.hasSim ? `
              <a class="topic-quick-jump__pill" href="#topic-simulator-${safeSlug}" data-action="quick-jump" data-target="topic-simulator-${safeSlug}">
                <span>⚡ Simulator</span>
              </a>
            ` : ''}
            ${opts.hasQuiz ? `
              <a class="topic-quick-jump__pill" href="#check-slider-${safeSlug}" data-action="quick-jump" data-target="check-slider-${safeSlug}">
                <span>🧠 Concept Check</span>
              </a>
            ` : ''}
            ${opts.hasTakeaways ? `
              <a class="topic-quick-jump__pill" href="#topic-takeaways-${safeSlug}" data-action="quick-jump" data-target="topic-takeaways-${safeSlug}">
                <span>📌 Key Takeaways</span>
              </a>
            ` : ''}
          </div>
          ${hasSections ? `
            <button type="button" class="topic-quick-jump__toggle" data-action="toggle-quick-jump" aria-expanded="true" title="Show or hide article sections">
              <span class="topic-quick-jump__toggle-text">Sections (${headings.length})</span>
              <span class="topic-quick-jump__toggle-chevron">▲</span>
            </button>
          ` : ''}
        </div>
        ${hasSections ? `
          <div class="topic-quick-jump__sections">
            ${headings.map(h => `
              <a class="topic-quick-jump__sec-link" href="#${escapeHtml(h.id)}" data-action="quick-jump" data-target="${escapeHtml(h.id)}">
                <span class="topic-quick-jump__sec-num">0${h.num}</span>
                <span>${escapeHtml(h.title.replace(/^\d+\.\s*/, ''))}</span>
              </a>
            `).join('')}
          </div>
        ` : ''}
      </nav>
    `;
  }

  function renderTopicCodeLabCard(slug, unit, mod, moduleContent) {
    let fallbackSql = '';
    if (moduleContent?.content) {
      const m = moduleContent.content.match(/<pre><code\s+class=["']language-sql["']>([\s\S]*?)<\/code><\/pre>/);
      if (m) fallbackSql = m[1];
    }
    const lab = (window.TopicGuidedLabs && typeof window.TopicGuidedLabs.getLab === 'function')
      ? window.TopicGuidedLabs.getLab(slug, fallbackSql, unit?.title)
      : null;
    if (!lab) return '';

    const steps = Array.isArray(lab.steps) ? lab.steps : [];
    const labTitle = lab.title || `${unit?.title || 'Interactive'} — Guided SQL & Relational Execution Lab`;
    const labSummary = lab.summary || 'Interactive 3-Step Guided SQL Lab & Step-by-Step Table Visualizer (PostgreSQL 18 WASM & SQLite 3 WASM).';
    const totalSteps = steps.length || 3;
    const comp = lab.complexity || { time: 'O(N log N)', space: 'O(N)', pattern: mod?.title || 'Relational Algebra & Query Planning' };

    return `
      <section class="build-lab-card topic-codelab-hero" id="guided-coding-practice-${escapeHtml(slug)}" aria-label="Guided SQL & Relational Execution Lab">
        <div class="build-lab-card__top">
          <div class="build-lab-card__intro">
            <div class="build-lab-card__eyebrow">
              <span>Interactive 3-Step Guided SQL Lab &amp; Step-by-Step Table Visualizer (PostgreSQL 18 WASM &amp; SQLite 3 WASM)</span>
              <span class="build-lab-card__progress">${totalSteps} Guided Steps + Progressive Hints</span>
              ${steps.length ? `
                <button type="button" class="build-lab-card__collapse-btn" data-action="toggle-lab-steps" aria-expanded="true" title="Collapse or expand guided coding steps">
                  <span class="build-lab-card__collapse-text">Collapse Steps</span>
                  <span class="build-lab-card__collapse-chevron">▲</span>
                </button>
              ` : ''}
            </div>
            <h2 class="build-lab-card__title">${escapeHtml(labTitle)}</h2>
            <p class="build-lab-card__desc">${formatInlineCode(labSummary)}</p>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">
              <span class="badge">⏱ Target Time: <code>${escapeHtml(comp.time || 'O(N log N)')}</code></span>
              <span class="badge">💾 Auxiliary Space: <code>${escapeHtml(comp.space || 'O(N)')}</code></span>
              <span class="badge">🧭 Pattern: ${escapeHtml(comp.pattern || mod?.title || 'Relational Invariants')}</span>
              ${lab.datasetId ? `<span class="badge">🗄️ Dataset: <code>${escapeHtml(lab.datasetId)}</code></span>` : ''}
            </div>
          </div>
          <div class="build-lab-card__cta-col">
            <button type="button" class="btn btn--primary build-lab-card__launch-btn" data-action="open-topic-codelab" data-slug="${escapeHtml(slug)}" data-mode="verify">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              <span>Run SQL Lab &amp; Verify</span>
            </button>
            <button type="button" class="btn btn--outline build-lab-card__launch-btn" data-action="open-topic-codelab" data-slug="${escapeHtml(slug)}" data-mode="solution">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>View Reference Solution</span>
            </button>
            <button type="button" class="btn btn--outline build-lab-card__launch-btn" data-action="open-topic-codelab" data-slug="${escapeHtml(slug)}" data-mode="modal">
              <span>⤢ Full-Screen Studio</span>
            </button>
          </div>
        </div>

        ${steps.length ? `
          <div class="build-lab-steps-grid">
            ${steps.map((s, idx) => {
              const defaultPhases = ['Step 1 · Schema & Base Projection', 'Step 2 · Relational Transformation', 'Step 3 · Verification & Query Plan'];
              const phaseLabel = s.phase || defaultPhases[idx] || `Step ${idx + 1} · SQL Implementation`;
              const stepTitle = (s.title || `Step ${idx + 1}`).replace(/^Step\s*\d+:\s*/i, '');
              return `
              <div class="build-lab-step-card ${idx === 0 ? 'is-active' : ''}" data-step="${idx}" data-step-index="${idx}">
                <div class="build-lab-step-card__body">
                  <div class="build-lab-step-card__header">
                    <span class="build-lab-step-card__num">0${idx + 1}</span>
                    <span class="build-lab-step-card__target">${escapeHtml(phaseLabel)}</span>
                  </div>
                  <div class="build-lab-step-card__title">${escapeHtml(stepTitle)}</div>
                  ${s.concept ? `<div class="build-lab-step-card__invariant">${formatInlineCode(s.concept)}</div>` : ''}
                  <div class="build-lab-step-card__concept">${formatInlineCode(s.instructions || 'Write and verify the SQL query in `query.sql`.')}</div>
                  ${s.hint ? `
                    <details class="quiz-hint-details">
                      <summary>💡 Progressive SQL Hint (Step ${idx + 1})</summary>
                      <pre><code>${escapeHtml(s.hint)}</code></pre>
                    </details>
                  ` : ''}
                </div>
                <div class="build-lab-step-card__footer">
                  <span>Step ${idx + 1} of ${steps.length} · <code>query.sql</code></span>
                  <button type="button" class="btn btn--sm btn--outline" data-action="open-topic-codelab" data-slug="${escapeHtml(slug)}" data-mode="guided" data-step="${idx}" data-step-index="${idx}">
                    Load Step ${idx + 1} SQL →
                  </button>
                </div>
              </div>
            `;
            }).join('')}
          </div>
        ` : ''}

        <div class="sql-guided-lab-host" id="sql-guided-lab-${escapeHtml(slug)}" data-sql-lab-slug="${escapeHtml(slug)}"></div>
      </section>
    `;
  }

  /**
   * Render a Lesson View
   */
  function renderLesson(slug) {
    const data = window.CURRICULUM_DATA;
    if (!data) return '<p>Loading...</p>';

    // Find unit and module
    let unit = null;
    let mod = null;
    let part = null;
    for (const p of data.parts) {
      for (const m of p.modules) {
        for (const u of m.units) {
          if (u.slug === slug) {
            unit = u;
            mod = m;
            part = p;
            break;
          }
        }
        if (unit) break;
      }
      if (unit) break;
    }

    if (!unit) return '<p>Topic not found.</p>';

    const isCompleted = window.Progress.isCompleted(slug);
    const kindClass = unit.kind === 'system' ? 'system' : 'lesson';

    // Get module content if loaded
    const moduleContent = window.MODULE_CONTENT?.[mod.id]?.[slug];
    const archiveContent = window.ARCHIVE_CONTENT?.[slug] || null;
    // Trigger lazy-load of archive file if not yet loaded (only slugs that ship a data/archive file)
    if (!archiveContent && unit.archive && ARCHIVE_SLUGS.has(slug) && !window.ARCHIVE_CONTENT?.[slug]) {
      const archiveScript = document.createElement('script');
      archiveScript.src = 'data/archive/' + slug + '.js' + (window.ASSET_VERSION ? '?v=' + window.ASSET_VERSION : '');
      archiveScript.onload = () => {
        // Re-render once archive content is available (only if the learner is still on this lesson),
        // then restore what the first render wired up: simulator, diagrams, audio.
        const reader = document.getElementById('reader');
        if (!reader || decodeURIComponent(location.hash) !== '#topic/' + slug) return;
        const sim = window.Simulators?.getSimulatorForUnit?.(slug)?.sim;
        sim?.unmount?.(reader);
        reader.innerHTML = renderLesson(slug);
        sim?.mount?.(reader);
        window.TableVisualizer?.enhanceSqlCodeBlocks?.(reader);
        window.App?.initMermaid?.();
        window.App?.renderMathOnPage?.(reader);
        window.setupAudioListeners?.(slug);
      };
      document.head.appendChild(archiveScript);
    }

    const reviewDate = formatReviewDate(unit.archive?.updated);

    // Build header
    let html = `
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/" data-nav="home">Home</a>
        <span class="breadcrumbs__sep">${icons.chevronRight}</span>
        <a href="#" data-nav="module" data-module="${mod.id}">${mod.title}</a>
        <span class="breadcrumbs__sep">${icons.chevronRight}</span>
        <span class="breadcrumbs__current">${unit.title}</span>
      </nav>

      <div class="lesson-header">
        <div class="lesson-header__badge">
          <span class="lesson-header__kind lesson-header__kind--${kindClass}">${unit.kind}</span>
          ${unit.archive?.tags?.map(t => ' <span class="tag">' + t + '</span>').join('') || ''}
        </div>
        <h1 class="lesson-header__title">${unit.title}</h1>
        <div class="lesson-header__meta">
          ${(() => {
            const words = unit.archive?.wordCount || (moduleContent?.content ? moduleContent.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length : 0);
            return words ? '<span class="lesson-header__meta-item">' + icons.clock + ' ' + Math.ceil(words / 200) + ' min read</span>' : '';
          })()}
          <span class="lesson-header__meta-item">${icons.book} Module ${mod.number}: ${mod.title}</span>
          <span class="lesson-header__meta-item" title="Content curriculum review date">${icons.calendar} Updated ${reviewDate}</span>
        </div>
        <div class="lesson-header__actions" style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
          <button class="completion-toggle${isCompleted ? ' completed' : ''}" data-action="toggle-complete" data-slug="${slug}">
            ${isCompleted ? icons.check + ' Completed' : icons.circle + ' Mark Complete'}
          </button>
          <button type="button" class="btn btn--secondary btn--sm" data-action="open-topic-codelab" data-slug="${slug}" data-mode="modal" title="Launch Interactive SQL Studio">
            ▶ Run SQL Studio
          </button>
          <a href="#cheatsheet/${mod.id}" class="btn btn--secondary btn--sm" data-action="navigate-cheatsheet" data-module="${mod.id}" title="View printable cheat sheet for this module">
            📄 Cheat Sheet
          </a>
        </div>
      </div>`;

    // Video embed (from module content)
    if (moduleContent?.video?.youtubeId) {
      html += renderVideoEmbed(moduleContent.video);
      html += renderMoreVideos(moduleContent.videos);
    }

    // Intuition-first primer (plain-language mental model before the deep dive)
    if (moduleContent?.intuition) {
      html += `
        <aside class="intuition">
          <h3 class="intuition__title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>Intuition first</h3>
          <div class="intuition__body">${convertMarkdownToHTML(moduleContent.intuition)}</div>
        </aside>`;
    }

    // Audio player
    const initialDuration = unit.archive?.audioDuration || unit.audioDuration || '--:--';
    html += `
      <div class="audio-player" id="audio-player-${slug}">
        <button class="audio-player__play-btn" id="audio-btn-${slug}" data-action="toggle-audio" data-slug="${slug}" aria-label="Play audio" title="Play audio">
          <svg id="audio-play-icon-${slug}" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg id="audio-pause-icon-${slug}" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="display:none;">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>
        <span class="audio-player__time" id="audio-time-${slug}">0:00 / ${initialDuration}</span>
        <div class="audio-player__track" data-action="seek-audio" data-slug="${slug}" id="audio-track-${slug}">
          <div class="audio-player__progress" id="audio-bar-${slug}" style="width: 0%;"></div>
        </div>
        <button class="audio-player__speed-btn" data-action="cycle-audio-speed" data-slug="${slug}" id="audio-speed-${slug}" title="Playback speed">1x</button>
        <audio id="audio-${slug}" data-src="audio/${slug}.mp3" preload="none"></audio>
      </div>`;

    // Content
    let rawArticleHtml = '';

    if (archiveContent && archiveContent.trim().length > 100) {
      // Use authentic markdown from curriculum
      rawArticleHtml += convertMarkdownToHTML(archiveContent);
      // If module content has complementary details (e.g. diagrams or breakdown), augment smoothly
      const isPlaceholder = moduleContent?.content?.includes('This topic is covered in depth in the curriculum archive');
      if (moduleContent?.content && !isPlaceholder && !archiveContent.includes('Real-World Usage')) {
        rawArticleHtml += '<hr style="margin: 2rem 0; border: none; border-top: 1px solid var(--divider);">';
        let deepDiveHtml = moduleContent.content.replace(
          /<pre><code\s+class=["']language-([a-zA-Z0-9_\-+]+)["']>([\s\S]*?)<\/code><\/pre>/g,
          (match, lang, code) => renderTopicCodeBlock(code, lang)
        );
        rawArticleHtml += '<div class="lesson-deep-dive">' + deepDiveHtml + '</div>';
      }
    } else if (moduleContent?.content) {
      let bodyHtml = moduleContent.content.replace(
        /<div\s+class=["']simulator-mount["']\s+data-sim=["']([^"']+)["']\s*><\/div>/g,
        (match, simId) => {
          const simObj = window.SIMULATORS?.[simId];
          return simObj && typeof simObj.render === 'function'
            ? `<div class="simulator-mount" id="topic-simulator-${slug}" data-sim="${simId}">${simObj.render()}</div>`
            : match;
        }
      );
      bodyHtml = bodyHtml.replace(
        /<pre><code\s+class=["']language-([a-zA-Z0-9_\-+]+)["']>([\s\S]*?)<\/code><\/pre>/g,
        (match, lang, code) => renderTopicCodeBlock(code, lang)
      );
      rawArticleHtml += bodyHtml;
    } else {
      // Fallback
      rawArticleHtml += renderFallbackContent(unit, mod);
    }

    const { htmlWithIds, headings } = decorateProseHeadings(rawArticleHtml);
    const quizHtml = window.Quiz?.renderCheckSlider ? window.Quiz.renderCheckSlider(slug) : '';
    const hasInlineSim = moduleContent?.content?.includes('class="simulator-mount"');
    let simHtml = '';
    if (!hasInlineSim) {
      if (window.Simulators && window.Simulators.getSimulatorForUnit) {
        const simData = window.Simulators.getSimulatorForUnit(slug);
        if (simData) {
          simHtml = `<div class="simulator-mount" id="topic-simulator-${slug}" data-sim="${simData.sim.id}">${simData.html}</div>`;
        } else if (window.SIMULATOR_SCRIPT_MAP?.[slug]) {
          simHtml = `<div class="sim-card-placeholder" id="topic-simulator-${slug}" data-sim-slug="${slug}"></div>`;
        }
      } else if (window.SIMULATOR_SCRIPT_MAP?.[slug]) {
        simHtml = `<div class="sim-card-placeholder" id="topic-simulator-${slug}" data-sim-slug="${slug}"></div>`;
      }
    }

    const hasSim = Boolean(hasInlineSim || simHtml);
    const hasQuiz = Boolean(quizHtml && quizHtml.trim());
    const hasTakeaways = Boolean(moduleContent?.keyTakeaways?.length);

    html += renderTopicQuickJump(slug, headings, { hasSim, hasQuiz, hasTakeaways });
    html += '<article class="prose">' + htmlWithIds + '</article>';

    // Check yourself: unified slider with Concept Checks, Napkin Math (numeric), and Staff Trade-Off Matrix (tradeoff)
    if (hasQuiz) html += `<div id="check-slider-${slug}">${quizHtml}</div>`;

    // Interactive Visual Simulator (only if not already mounted inline via .simulator-mount)
    if (simHtml) html += simHtml;

    // Interactive Guided SQL & Relational Execution Lab Card
    html += renderTopicCodeLabCard(slug, unit, mod, moduleContent);

    // Key takeaways
    if (hasTakeaways) {
      html += `
        <div class="takeaways" id="topic-takeaways-${slug}">
          <h3 class="takeaways__title">Key Takeaways</h3>
          <div class="takeaways__list">
            ${moduleContent.keyTakeaways.map(t => '<div class="takeaways__item">' + t + '</div>').join('')}
          </div>
        </div>`;
    }

    // Capstone builds, incident challenges, and architecture blueprints for this lesson
    html += renderLessonBuilds(slug);
    html += renderLessonChallenges(slug);
    html += renderLessonBlueprints(slug);

    // Further reading
    if (moduleContent?.furtherReading?.length) {
      html += `
        <div class="further-reading">
          <h3 class="further-reading__title">Further Reading</h3>
          <div class="further-reading__list">
            ${moduleContent.furtherReading.map(r => '<a class="further-reading__link" href="' + r.url + '" target="_blank" rel="noopener">' + icons.link + ' ' + r.title + '</a>').join('')}
          </div>
        </div>`;
    } else if (unit.archive?.sources?.length) {
      html += `
        <div class="further-reading">
          <h3 class="further-reading__title">Sources</h3>
          <div class="further-reading__list">
            ${unit.archive.sources.filter(s => s.startsWith('http')).map(s => '<a class="further-reading__link" href="' + s + '" target="_blank" rel="noopener">' + icons.link + ' ' + s.replace(/https?:\/\//, '').split('/').slice(0, 2).join('/') + '</a>').join('')}
          </div>
        </div>`;
    }

    // Was this helpful / Report issue feedback bar
    html += renderLessonFeedback(slug, unit);

    // Prev/Next navigation
    html += renderLessonNav(slug, mod, part);

    return renderMathInHtml(html);
  }

  // Order build files: README first, then implementation, demo, tests
  const buildFileRank = f => (/readme/i.test(f) ? 0 : /^demo\b|\/demo\b/i.test(f) ? 2 : /test/i.test(f) ? 3 : 1);
  const orderedBuildFiles = files => Object.entries(files || {}).sort((a, b) => buildFileRank(a[0]) - buildFileRank(b[0]));

  // Lesson title lookup for cross-links
  function findUnitTitle(slug) {
    for (const p of window.CURRICULUM_DATA?.parts || []) for (const m of p.modules) for (const u of m.units) if (u.slug === slug) return u.title;
    return null;
  }

  /**
   * Builds that teach this lesson (primarySlug or relatedSlugs)
   */
  function buildsForLesson(slug) {
    return Object.entries(window.IMPLEMENTATIONS_DATA || {})
      .filter(([, b]) => b.primarySlug === slug || (b.relatedSlugs || []).includes(slug))
      .sort((a, b) => (a[1].primarySlug === slug ? 0 : 1) - (b[1].primarySlug === slug ? 0 : 1));
  }

  function renderLessonBuilds(slug) {
    const builds = buildsForLesson(slug);
    if (!builds.length) return '';
    return `
      <div class="lesson-builds">
        <h3 class="lesson-builds__title">${icons.code} Multi-File Capstone SQL & Storage Engine Lab — Guided Implementation</h3>
        ${builds.map(([id, b]) => {
          const prog = window.Progress?.getBuildProgress ? window.Progress.getBuildProgress(id) : null;
          const stepCount = prog?.completedSteps?.length || 0;
          const badgeHtml = prog?.completed
            ? `<span class="badge" style="margin-left:auto;color:var(--success);border-color:var(--success);">✓ Lab Complete (4/4)</span>`
            : stepCount > 0
              ? `<span class="badge" style="margin-left:auto;">${stepCount}/4 Steps</span>`
              : '';
          return `
          <a class="lesson-builds__item" href="/build/${id}/" data-action="navigate-build" data-build-id="${id}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span class="lesson-builds__name">${escapeHtml(b.title || id)}</span>
              ${badgeHtml}
            </div>
            ${b.summary ? `<span class="lesson-builds__summary">${escapeHtml(b.summary)}</span>` : ''}
            <span class="lesson-builds__cta">${icons.terminal} Open Guided SQL &amp; Engine Lab (PostgreSQL 18 WASM, SQLite 3 &amp; Step-by-Step Relational Table Visualizer) →</span>
          </a>`;
        }).join('')}
      </div>`;
  }

  function challengesForLesson(slug) {
    const raw = window.CHALLENGES_DATA || window.ChallengesData;
    const list = Array.isArray(raw) ? raw : (raw?.challenges || []);
    return list.filter(c => (c.relatedSlugs || []).includes(slug));
  }

  function renderLessonChallenges(slug) {
    const challenges = challengesForLesson(slug);
    if (!challenges.length) return '';
    return `
      <div class="lesson-builds lesson-challenges">
        <h3 class="lesson-builds__title">${icons.target} Debug This in Production — Incident Simulator &amp; SQL Hotfix</h3>
        ${challenges.map(c => `
          <a class="lesson-builds__item" href="/challenges/${c.id}/" data-nav="challenges" data-challenge="${c.id}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span class="lesson-builds__name">${escapeHtml(c.title)}</span>
              <span class="badge">${escapeHtml(c.severity || 'SEV-1')} · ${escapeHtml(c.difficulty || 'Senior')}</span>
            </div>
            ${c.subtitle ? `<span class="lesson-builds__summary">${escapeHtml(c.subtitle)}</span>` : ''}
            <span class="lesson-builds__cta">${icons.terminal} Launch Production Incident &amp; SQL Studio Hotfix →</span>
          </a>`).join('')}
      </div>`;
  }

  function blueprintsForLesson(slug) {
    return (window.WHITEBOARD_DATA?.blueprints || []).filter(bp => bp.id === slug.replace(/^case-/, '') || (bp.relatedSlugs || []).includes(slug));
  }

  function renderLessonBlueprints(slug) {
    const bps = blueprintsForLesson(slug);
    if (!bps.length) return '';
    return `
      <div class="lesson-builds lesson-blueprints">
        <h3 class="lesson-builds__title">${icons.globe} Interactive Architecture Blueprint — Capacity Sandbox</h3>
        ${bps.map(bp => `
          <a class="lesson-builds__item" href="/sandbox/?blueprint=${bp.id}" data-nav="sandbox" data-blueprint="${bp.id}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span class="lesson-builds__name">${escapeHtml(bp.title)}</span>
              ${bp.targetQps ? `<span class="badge">${escapeHtml(String(bp.targetQps))} QPS</span>` : ''}
            </div>
            ${bp.description ? `<span class="lesson-builds__summary">${escapeHtml(bp.description)}</span>` : ''}
            <span class="lesson-builds__cta">${icons.target} Open Topology &amp; Stress-Test in Architecture Sandbox →</span>
          </a>`).join('')}
      </div>`;
  }

  /**
   * Render a Build (Implementation) View
   * Initially presents the Build Guide, Interactive Lab Overview Card & Steps, and Reference Code,
   * with a one-click full-page Interactive Lab transition.
   */
  function renderBuild(buildId) {
    const impls = window.IMPLEMENTATIONS_DATA;
    if (!impls || !impls[buildId]) return '<p>Build not found.</p>';

    const build = impls[buildId];
    const primarySlug = build.primarySlug || (Array.isArray(build.relatedSlugs) && build.relatedSlugs[0]) || buildId;
    const guided = (window.TOPIC_GUIDED_LABS && (window.TOPIC_GUIDED_LABS[buildId] || window.TOPIC_GUIDED_LABS[primarySlug]))
      || (window.TopicGuidedLabs && typeof window.TopicGuidedLabs.getLab === 'function' ? window.TopicGuidedLabs.getLab(primarySlug, build.title) : null)
      || (window.GUIDED_LABS_DATA && window.GUIDED_LABS_DATA[buildId])
      || null;
    const steps = Array.isArray(guided?.steps) ? guided.steps : [];
    const files = orderedBuildFiles(build.files);
    const lessons = [build.primarySlug, ...(build.relatedSlugs || [])].filter(Boolean)
      .map(s => ({ slug: s, title: findUnitTitle(s) })).filter(l => l.title);
    const demoFile = files.find(([f]) => /(^|\/)demo\.js$/i.test(f))?.[0];
    const testFile = files.find(([f]) => /(^|\/)test\.js$/i.test(f))?.[0];

    let completedIds = [];
    try {
      const raw =
        localStorage.getItem('sd-codelab-v1:' + buildId) ||
        localStorage.getItem('codelab_progress_' + buildId) ||
        localStorage.getItem('sd_codelab_' + buildId);
      const saved = JSON.parse(raw || 'null');
      if (Array.isArray(saved?.completedSteps)) completedIds = saved.completedSteps;
    } catch (_) {}

    const totalSteps = steps.length || 4;
    const progressPct = Math.min(100, Math.round((completedIds.length / Math.max(1, totalSteps)) * 100));
    const difficulty = guided?.difficulty || 'Intermediate';
    const estMinutes = guided?.estimatedMinutes || 25;

    let html = `
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="#" data-nav="home">Home</a>
        <span class="breadcrumbs__sep">${icons.chevronRight}</span>
        <span class="breadcrumbs__current">${escapeHtml(build.title || buildId)}</span>
      </nav>

      <div class="lesson-header">
        <div class="lesson-header__badge">
          <span class="lesson-header__kind lesson-header__kind--build">${icons.code} Guided SQL & Engine Coding Lab</span>
        </div>
        <h1 class="lesson-header__title">${escapeHtml(build.title || buildId.replace(/-/g, ' '))}</h1>
        ${build.summary ? `<p class="build-summary">${escapeHtml(build.summary)}</p>` : ''}
        <div class="lesson-header__meta">
          <span class="lesson-header__meta-item">${icons.clock} ~${estMinutes} min</span>
          <span class="lesson-header__meta-item">${icons.code} ${escapeHtml(difficulty)}</span>
          ${lessons.length ? `<span class="lesson-header__meta-item">${icons.book} Lesson${lessons.length > 1 ? 's' : ''}: ${lessons.map(l =>
            `<a href="#" data-nav="topic" data-slug="${l.slug}">${escapeHtml(l.title)}</a>`).join(', ')}</span>` : ''}
        </div>
      </div>

      <section class="build-lab-card" aria-label="Guided SQL & Storage Engine Lab Overview">
        <div class="build-lab-card__top">
          <div class="build-lab-card__intro">
            <div class="build-lab-card__eyebrow">
              <span>Guided SQL &amp; Storage Engine Lab</span>
              <span class="build-lab-card__progress" id="build-lab-progress-badge">${completedIds.length}/${totalSteps} Steps Completed</span>
            </div>
            <h2 class="build-lab-card__title">Execute &amp; Verify SQL &amp; Storage Engine Invariants in the Browser SQL Studio</h2>
            <p class="build-lab-card__desc">
              Complete ${totalSteps} progressive relational steps with guided hints in <strong>PostgreSQL 18 WASM, SQLite 3 &amp; Step-by-Step Relational Table Visualizer</strong> against automated result-set and query-plan assertions — zero local setup required.
            </p>
            <div class="build-lab-progress-track" aria-hidden="true">
              <div class="build-lab-progress-track__fill" style="width:${progressPct}%"></div>
            </div>
          </div>
          <div class="build-lab-card__cta-col">
            <button type="button" class="btn btn--primary build-lab-card__launch-btn" data-action="open-topic-codelab" data-slug="${escapeHtml(buildId)}" data-mode="modal">
              ${icons.terminal}
              <span>Launch SQL Studio Lab</span>
            </button>
            <button type="button" class="btn btn--outline build-lab-card__launch-btn" data-action="open-topic-codelab" data-slug="${escapeHtml(buildId)}" data-mode="solution">
              ${icons.code}
              <span>Open Reference SQL</span>
            </button>
            <button type="button" class="btn btn--outline build-lab-card__launch-btn" data-action="open-code-lab" data-build="${escapeHtml(buildId)}" data-lab-mode="guided">
              ${icons.code}
              <span>⚙ Open Engine Code Lab</span>
            </button>
          </div>
        </div>

        ${steps.length ? `
          <div class="build-lab-steps-grid" id="build-lab-steps-grid">
            ${steps.map((s, idx) => {
              const isDone = completedIds.includes(s.id);
              const cleanTitle = (s.title || '').replace(/^Step\s*\d+:\s*/i, '');
              const targetLabel = s.phase || (s.targetFile ? `${s.targetFile}${s.targetSymbol ? ' · ' + s.targetSymbol.split('/')[0].trim() : ''}` : 'query.sql');
              const assertionCount = Array.isArray(s.testNames) && s.testNames.length ? s.testNames.length : 4;
              return `
                <div class="build-lab-step-card ${isDone ? 'is-done' : ''}" data-action="open-topic-codelab" data-slug="${escapeHtml(buildId)}" data-mode="guided" data-step="${idx}" data-step-index="${idx}">
                  <div class="build-lab-step-card__header">
                    <span class="build-lab-step-card__num">${isDone ? icons.check : `0${idx + 1}`}</span>
                    <span class="build-lab-step-card__target">${escapeHtml(targetLabel)}</span>
                  </div>
                  <div class="build-lab-step-card__title">${escapeHtml(cleanTitle)}</div>
                  <div class="build-lab-step-card__concept">${formatInlineCode(s.concept || s.instructions || '')}</div>
                  <div class="build-lab-step-card__footer">
                    <span>${assertionCount} SQL assertion${assertionCount === 1 ? '' : 's'}</span>
                    <button type="button" class="btn btn--xs btn--ghost build-lab-step-card__open" data-action="open-topic-codelab" data-slug="${escapeHtml(buildId)}" data-mode="modal" data-step="${idx}" data-step-index="${idx}">Step ${idx + 1} →</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <div class="sql-guided-lab-host" id="sql-guided-lab-${escapeHtml(buildId)}" data-sql-lab-slug="${escapeHtml(buildId)}"></div>
      </section>

      <div id="build-walkthrough-pane">`;

    for (const [filename, content] of files) {
      if (filename.endsWith('.md')) {
        const cleanMd = content
          .replace(/^#\s+[^\n]+\n+/, '')
          .replace(/\n##\s+(?:How to run|9\.\s*Verification & Running the Lab)\b[\s\S]*?(?=\n##\s+|\s*$)/g, '\n');
        const anchor = `build-file-${buildId}-${filename.replace(/[^\w-]/g, '_')}`;
        html += `<article class="prose" id="${anchor}">` + convertMarkdownToHTML(cleanMd) + '</article>';
      }
    }

    html += `
      </div>

      <div class="build-lab-overlay" id="build-lab-overlay" aria-hidden="true">
        <div id="codelab-mount" class="build-lab-overlay__mount codelab-container" data-build-id="${escapeHtml(buildId)}"></div>
      </div>`;
    return html;
  }


  /**
   * Render YouTube video embed (lazy-loaded)
   */
  function renderVideoEmbed(video) {
    if (!video?.youtubeId) return '';
    return `<div class="video-main" data-video="${escapeHtml(JSON.stringify(video))}">${renderMainVideoInner(video, false)}</div>`;
  }

  // Player + caption for the main video; autoplay loads the iframe straight away (used when swapping in)
  function renderMainVideoInner(video, autoplay) {
    const id = video.youtubeId;
    const player = autoplay
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      : `<div class="video-embed__placeholder" data-action="load-youtube" data-video-id="${id}">
          <img class="video-embed__thumb" src="https://img.youtube.com/vi/${id}/hqdefault.jpg"
               alt="${escapeHtml(video.title || '')}"
               loading="lazy">
          <div class="video-embed__play-btn">${icons.play}</div>
        </div>`;
    return `
      <div class="video-embed" id="video-${id}">${player}</div>
      ${video.title ? `<div class="video-embed__info">
        <span class="video-embed__channel">${escapeHtml(video.channel || 'YouTube')}</span>
        <span class="video-embed__title">${escapeHtml(video.title)}</span>
        <a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer" style="margin-left:auto; font-size:11px; color:var(--accent,#6366f1); text-decoration:none; display:flex; align-items:center; gap:2px;">
          Watch on YouTube ↗
        </a>
      </div>` : ''}
      ${video.why ? `<p class="video-embed__why">${escapeHtml(video.why)}</p>` : ''}`;
  }

  // Units with a data/archive/<slug>.js file; requesting any other slug 404s. Keep in sync with data/archive/.
  const ARCHIVE_SLUGS = new Set([]);

  const VIDEO_ROLE_LABELS = {
    primary: 'Main pick',
    intro: 'Quick intro',
    'deep-dive': 'Deep dive',
    interview: 'Interview walkthrough',
    'case-study': 'Case study'
  };

  // A card still links to YouTube (ctrl/cmd/middle-click open a tab); a plain click plays it in the main player
  function renderMoreVideoCard(v) {
    return `
      <a class="video-more__card" href="https://www.youtube.com/watch?v=${v.youtubeId}" target="_blank" rel="noopener noreferrer"
         data-action="play-in-main-video" data-video="${escapeHtml(JSON.stringify(v))}"
         title="Play here (Ctrl/⌘-click to open on YouTube)">
        <span class="video-more__thumb">
          <img src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg" alt="" loading="lazy">
          <span class="video-more__play">${icons.play}</span>
          ${v.length ? `<span class="video-more__len">${escapeHtml(v.length)}</span>` : ''}
        </span>
        <span class="video-more__meta">
          <span class="video-more__role">${escapeHtml(VIDEO_ROLE_LABELS[v.role] || 'Also watch')}</span>
          <span class="video-more__title">${escapeHtml(v.title || '')}</span>
          <span class="video-more__channel">${escapeHtml(v.channel || 'YouTube')}</span>
          ${v.why ? `<span class="video-more__why">${escapeHtml(v.why)}</span>` : ''}
        </span>
      </a>`;
  }

  /**
   * Render supplementary videos (intro / deep-dive / interview / case-study)
   */
  function renderMoreVideos(videos) {
    if (!Array.isArray(videos) || !videos.length) return '';
    const cards = videos.filter(v => v?.youtubeId).map(renderMoreVideoCard).join('');
    return cards ? `
      <div class="video-more">
        <h2 class="video-more__heading">More videos on this topic</h2>
        <div class="video-more__list">${cards}</div>
      </div>` : '';
  }

  // Swap a card's video into the main player (and the current main video into that card's slot)
  window.playInMainVideo = function(event, card) {
    const next = JSON.parse(card.dataset.video || 'null');
    if (!next) return true;
    if (window.Analytics?.trackVideoPlay) window.Analytics.trackVideoPlay(next.youtubeId, next.title || '');
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) return true; // let the link open YouTube
    const main = document.querySelector('.video-main');
    if (!main) return true;
    event.preventDefault();
    const prev = JSON.parse(main.dataset.video || 'null');
    main.dataset.video = JSON.stringify(next);
    main.innerHTML = renderMainVideoInner(next, true);
    if (prev) card.outerHTML = renderMoreVideoCard({ ...prev, role: prev.role || 'primary' });
    const top = main.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return false;
  };

  /**
   * Convert basic markdown to HTML
   */
  function convertMarkdownToHTML(md) {
    if (!md) return '';

    // Phase 1: Extract code blocks, mermaid diagrams, inline code spans, and math to protect them from markdown regexes
    const codeBlocks = [];
    const inlineCodes = [];
    const mathSpans = [];
    let html = md
      // Mermaid blocks MUST be replaced before generic code blocks
      .replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, diagram) => {
        const idx = codeBlocks.length;
        codeBlocks.push('<div class="mermaid">' + diagram.trim() + '</div>');
        return '\x00CODEBLOCK_' + idx + '\x00';
      })
      // Code blocks (``` blocks) - handle info strings like title="terminal"
      .replace(/```(\S+)?[^\n]*\n([\s\S]*?)```/g, (_, lang, code) => {
        const idx = codeBlocks.length;
        const cleanLang = (lang || 'text').toLowerCase();
        codeBlocks.push(renderTopicCodeBlock(code.trim(), cleanLang));
        return '\x00CODEBLOCK_' + idx + '\x00';
      })
      // Inline code (`...`) - escape HTML entities inside backticks & protect from markdown regexes
      .replace(/`([^`\n]+)`/g, (_, code) => {
        const idx = inlineCodes.length;
        inlineCodes.push('<code>' + escapeHtml(code) + '</code>');
        return '\x00INLINECODE_' + idx + '\x00';
      })
      // Block math ($$...$$) - protect from markdown asterisks / underscores
      .replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        const idx = mathSpans.length;
        mathSpans.push({ isBlock: true, math });
        return '\x00MATHSPAN_' + idx + '\x00';
      })
      // Inline math ($...$) - protect from markdown asterisks / underscores (skip HTML tags and currency)
      .replace(/\$([^\$\n\r<>]+?)\$/g, (full, math) => {
        if (/^\d+(?:[.,]\d+)?(?:\s|$)/.test(math.trim())) return full;
        const idx = mathSpans.length;
        mathSpans.push({ isBlock: false, math });
        return '\x00MATHSPAN_' + idx + '\x00';
      });

    // Phase 2: Process block-level markdown syntax (code blocks & inline code are safely extracted)
    html = html
      // GitHub alerts / blockquote callouts
      .replace(/^>\s*\[!NOTE\]\s*(.*)$/gm, '<div class="callout callout--note"><div class="callout__title">ℹ️ Note</div><p>$1</p></div>')
      .replace(/^>\s*\[!TIP\]\s*(.*)$/gm, '<div class="callout callout--tip"><div class="callout__title">💡 Tip</div><p>$1</p></div>')
      .replace(/^>\s*\[!WARNING\]\s*(.*)$/gm, '<div class="callout callout--warn"><div class="callout__title">⚠️ Warning</div><p>$1</p></div>')
      .replace(/^>\s*\[!IMPORTANT\]\s*(.*)$/gm, '<div class="callout callout--danger"><div class="callout__title">❗ Important</div><p>$1</p></div>')
      .replace(/^>\s*(.*)$/gm, '<blockquote><p>$1</p></blockquote>')
      // Headers
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Tables
      .replace(/^\|(.+)\|[ \t]*\n\|[-| :]+\|[ \t]*\n((?:\|.+\|[ \t]*(?:\n|$))*)/gm, (_, header, body) => {
        const ths = header.split('|').map(h => '<th>' + h.trim() + '</th>').join('');
        const rows = body.trim().split('\n').map(row => {
          const tds = row.trim().replace(/^\||\|$/g, '').split('|').map(c => '<td>' + c.trim() + '</td>').join('');
          return '<tr>' + tds + '</tr>';
        }).join('');
        return '<table><thead><tr>' + ths + '</tr></thead><tbody>' + rows + '</tbody></table>\n';
      });

    // Phase 3: Process paragraphs and lists (joining hard-wrapped continuation lines cleanly)
    const lines = html.split('\n');
    const processed = [];
    let inList = false;
    let listType = '';
    let openLi = false;
    let paraLines = [];

    function flushPara() {
      if (paraLines.length > 0) {
        processed.push('<p>' + paraLines.join(' ') + '</p>');
        paraLines = [];
      }
    }

    function closeList() {
      if (openLi) {
        processed[processed.length - 1] += '</li>';
        openLi = false;
      }
      if (inList) {
        processed.push('</' + listType + '>');
        inList = false;
        listType = '';
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extracted code / mermaid block placeholder
      if (line.trim().match(/^\x00CODEBLOCK_\d+\x00$/)) {
        flushPara();
        closeList();
        processed.push(line.trim());
        continue;
      }

      // Skip already-processed block-level HTML tags
      if (line.match(/^<(h[1-6]|table|thead|tbody|tr|th|td|div|pre|hr|ul|ol|li|blockquote)\b/)) {
        flushPara();
        closeList();
        processed.push(line);
        continue;
      }

      // Unordered list item
      if (line.match(/^[-*] /)) {
        flushPara();
        if (!inList || listType !== 'ul') {
          closeList();
          processed.push('<ul>');
          inList = true; listType = 'ul';
        } else if (openLi) {
          processed[processed.length - 1] += '</li>';
          openLi = false;
        }
        processed.push('<li>' + line.replace(/^[-*] /, ''));
        openLi = true;
        continue;
      }

      // Ordered list item
      if (line.match(/^\d+\. /)) {
        flushPara();
        if (!inList || listType !== 'ol') {
          closeList();
          processed.push('<ol>');
          inList = true; listType = 'ol';
        } else if (openLi) {
          processed[processed.length - 1] += '</li>';
          openLi = false;
        }
        processed.push('<li>' + line.replace(/^\d+\. /, ''));
        openLi = true;
        continue;
      }

      // Blank line ends current paragraph or list
      if (line.trim() === '') {
        flushPara();
        closeList();
        continue;
      }

      // Continuation line inside an active list item
      if (inList && openLi) {
        if (line.match(/^\s+[-*] /)) {
          processed[processed.length - 1] += '<br>• ' + line.replace(/^\s+[-*] /, '').trim();
        } else {
          processed[processed.length - 1] += ' ' + line.trim();
        }
        continue;
      }

      // Paragraph line
      paraLines.push(line.trim());
    }

    flushPara();
    closeList();

    // Phase 4: Inline formatting (after multi-line paragraphs and list items are joined) & code restoration
    let out = processed.join('\n')
      // Bold
      .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      // Links (standard and wiki-style)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\[\[wiki\/([^\]|]+)\|([^\]]+)\]\]/g, '<a href="#" data-nav="topic" data-slug="$1">$2</a>')
      .replace(/\[\[wiki\/([^\]]+)\]\]/g, (_, slug) => '<a href="#" data-nav="topic" data-slug="' + slug + '">' + slug.replace(/-/g, ' ') + '</a>');

    out = out
      .replace(/\x00CODEBLOCK_(\d+)\x00/g, (_, idx) => codeBlocks[parseInt(idx)])
      .replace(/\x00INLINECODE_(\d+)\x00/g, (_, idx) => inlineCodes[parseInt(idx)])
      .replace(/\x00MATHSPAN_(\d+)\x00/g, (_, idx) => {
        const item = mathSpans[parseInt(idx)];
        if (!item) return '';
        return item.isBlock ? `$$${item.math}$$` : `$${item.math}$`;
      });

    return renderMathInHtml(out);
  }

  /**
   * Render fallback content when no detailed content is available
   */
  function renderFallbackContent(unit, mod) {
    const excerpt = unit.archive?.excerpt || '';
    let html = '';

    if (excerpt) {
      html += '<p>' + excerpt + '</p>';
    }

    html += `
      <div class="callout callout--note">
        <div class="callout__title">📚 Content Loading</div>
        <p>Detailed content for this topic is being prepared. In the meantime, explore the module overview and related topics in Module ${mod.number}: ${mod.title}.</p>
      </div>`;

    return html;
  }

  /**
   * Render feedback and report issue bar
   */
  function renderLessonFeedback(slug, unit) {
    const issueTitle = encodeURIComponent(`[Feedback] ${unit.title}`);
    const issueBody = encodeURIComponent(`### Topic: ${unit.title}\n**URL:** https://sql-in-depth.vedgupta.in/topic/${slug}/\n\n### Feedback / Correction:\n`);
    const issueUrl = `https://github.com/innovatorved/sql-in-depth/issues/new?title=${issueTitle}&labels=feedback,curriculum&body=${issueBody}`;

    return `
      <div class="lesson-feedback" id="lesson-feedback-${slug}">
        <div class="lesson-feedback__content">
          <div class="lesson-feedback__meta">
            <span class="lesson-feedback__title">Was this lesson helpful?</span>
            <span class="lesson-feedback__sub">Spot an issue or have a suggestion? Let us know on GitHub.</span>
          </div>
          <div class="lesson-feedback__actions">
            <button type="button" class="btn btn--sm btn--outline lesson-feedback__btn" data-action="feedback-vote" data-slug="${slug}" data-vote="yes">
              👍 Helpful
            </button>
            <button type="button" class="btn btn--sm btn--outline lesson-feedback__btn" data-action="feedback-vote" data-slug="${slug}" data-vote="no">
              👎 Needs work
            </button>
            <a href="${issueUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--sm btn--outline lesson-feedback__btn" title="Open an issue on GitHub">
              ${icons.github} Report an issue
            </a>
          </div>
        </div>
      </div>`;
  }

  /**
   * Render prev/next lesson navigation
   */
  function renderLessonNav(currentSlug, currentMod, currentPart) {
    const data = window.CURRICULUM_DATA;
    if (!data) return '';

    // Build flat list of all slugs
    const allUnits = [];
    for (const p of data.parts) {
      for (const m of p.modules) {
        for (const u of m.units) {
          allUnits.push({ slug: u.slug, title: u.title, modTitle: m.title });
        }
      }
    }

    const idx = allUnits.findIndex(u => u.slug === currentSlug);
    if (idx < 0) return '';

    const prev = idx > 0 ? allUnits[idx - 1] : null;
    const next = idx < allUnits.length - 1 ? allUnits[idx + 1] : null;

    let html = '<div class="lesson-nav">';

    if (prev) {
      html += `<a class="lesson-nav__link" href="/topic/${prev.slug}/" data-nav="topic" data-slug="${prev.slug}">
        <span class="lesson-nav__label">← Previous</span>
        <span class="lesson-nav__title">${prev.title}</span>
      </a>`;
    } else {
      html += '<div></div>';
    }

    if (next) {
      html += `<a class="lesson-nav__link lesson-nav__link--next" href="/topic/${next.slug}/" data-nav="topic" data-slug="${next.slug}">
        <span class="lesson-nav__label">Next →</span>
        <span class="lesson-nav__title">${next.title}</span>
      </a>`;
    } else {
      html += '<div></div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Escape HTML
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Global helper for video loading
  window.loadYouTubeVideo = function(videoId, container) {
    container.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    if (window.Analytics?.trackVideoPlay) {
      const title = container.parentElement?.querySelector('.video-embed__title')?.textContent || '';
      window.Analytics.trackVideoPlay(videoId, title);
    }
  };

  // Global helper for lesson feedback
  window.handleFeedbackVote = function(btn, slug, vote) {
    const parent = btn.closest('.lesson-feedback__actions');
    if (parent) {
      parent.querySelectorAll('.lesson-feedback__btn').forEach(b => {
        if (b.tagName === 'BUTTON') {
          b.classList.remove('is-voted');
          b.disabled = true;
        }
      });
      btn.classList.add('is-voted');
      btn.textContent = vote === 'yes' ? '✓ Thanks for your feedback!' : '✓ We\'ll improve this!';
    }
    try {
      localStorage.setItem('feedback_' + slug, vote);
    } catch (_) {}
    if (window.Analytics?.trackLessonFeedback) {
      window.Analytics.trackLessonFeedback({ slug, vote });
    } else if (window.Analytics?.trackEvent) {
      window.Analytics.trackEvent('lesson_feedback', {
        topic_slug: slug,
        feedback_vote: vote,
        event_category: 'engagement'
      });
    }
  };

  // Global helpers for audio player (with Web Speech API narration fallback when static MP3 is absent)
  const _audioSynthState = {};

  function _formatAudioTime(secs) {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _parseDurationSecs(slug) {
    const timeEl = document.getElementById('audio-time-' + slug);
    const txt = timeEl ? timeEl.textContent : '';
    const m = txt.match(/\/\s*(\d+):(\d+)/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return 180;
  }

  function _extractLessonSpeechText(slug) {
    const article = document.querySelector('.lesson-content, article.prose, #main-content');
    if (article && article.textContent && article.textContent.trim().length > 40) {
      return article.textContent.replace(/\s+/g, ' ').trim().slice(0, 6000);
    }
    return 'SQL In Depth lesson narration for ' + String(slug || '').replace(/-/g, ' ');
  }

  function _syncAudioPlayerUI(slug, isPlaying) {
    const player = document.getElementById('audio-player-' + slug);
    const btn = document.getElementById('audio-btn-' + slug);
    const playIcon = document.getElementById('audio-play-icon-' + slug);
    const pauseIcon = document.getElementById('audio-pause-icon-' + slug);
    if (player) player.classList.toggle('is-playing', Boolean(isPlaying));
    if (btn) {
      btn.setAttribute('aria-label', isPlaying ? 'Pause audio' : 'Play audio');
      btn.setAttribute('title', isPlaying ? 'Pause audio' : 'Play audio');
    }
    if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
    if (pauseIcon) pauseIcon.style.display = isPlaying ? 'block' : 'none';
  }

  function _stopSynthAudio(slug, resetProgress) {
    const st = _audioSynthState[slug];
    if (!st) return;
    if (st.timer) {
      clearInterval(st.timer);
      st.timer = null;
    }
    st.playing = false;
    try {
      if (typeof window.speechSynthesis !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
    if (resetProgress) {
      st.currentTime = 0;
      const bar = document.getElementById('audio-bar-' + slug);
      const timeDisplay = document.getElementById('audio-time-' + slug);
      if (bar) bar.style.width = '0%';
      if (timeDisplay) timeDisplay.textContent = '0:00 / ' + _formatAudioTime(st.duration);
    }
    _syncAudioPlayerUI(slug, false);
  }

  function _startSynthFallback(slug) {
    Object.keys(_audioSynthState).forEach(other => {
      if (other !== slug && _audioSynthState[other]?.playing) {
        _stopSynthAudio(other, false);
      }
    });
    let st = _audioSynthState[slug];
    if (!st) {
      st = _audioSynthState[slug] = {
        mode: 'synth',
        playing: false,
        currentTime: 0,
        duration: _parseDurationSecs(slug),
        playbackRate: 1,
        timer: null,
        text: _extractLessonSpeechText(slug)
      };
    }
    st.mode = 'synth';
    st.playing = true;
    _syncAudioPlayerUI(slug, true);

    const bar = document.getElementById('audio-bar-' + slug);
    const timeDisplay = document.getElementById('audio-time-' + slug);
    if (timeDisplay) {
      timeDisplay.textContent = _formatAudioTime(st.currentTime) + ' / ' + _formatAudioTime(st.duration);
    }

    try {
      if (typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance === 'function') {
        window.speechSynthesis.cancel();
        const utter = new window.SpeechSynthesisUtterance(st.text);
        utter.rate = st.playbackRate || 1;
        utter.onend = () => {
          if (_audioSynthState[slug]?.playing) {
            _stopSynthAudio(slug, true);
          }
        };
        window.speechSynthesis.speak(utter);
      }
    } catch (_) {}

    if (st.timer) clearInterval(st.timer);
    st.timer = setInterval(() => {
      if (!st.playing) return;
      st.currentTime = Math.min(st.duration, st.currentTime + 0.25 * (st.playbackRate || 1));
      const pct = st.duration > 0 ? Math.min(100, (st.currentTime / st.duration) * 100) : 0;
      if (bar) bar.style.width = pct + '%';
      if (timeDisplay) {
        timeDisplay.textContent = _formatAudioTime(st.currentTime) + ' / ' + _formatAudioTime(st.duration);
      }
      if (st.currentTime >= st.duration) {
        _stopSynthAudio(slug, true);
      }
    }, 250);
  }

  window.toggleAudio = function(slug) {
    const audio = document.getElementById('audio-' + slug);
    if (!audio) return;

    const st = _audioSynthState[slug];
    if (st && st.mode === 'synth') {
      if (st.playing) {
        if (st.timer) { clearInterval(st.timer); st.timer = null; }
        st.playing = false;
        try {
          if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.pause();
        } catch (_) {}
        _syncAudioPlayerUI(slug, false);
        if (window.Analytics?.trackAudioPause) {
          window.Analytics.trackAudioPause(slug, st.currentTime, st.duration);
        }
      } else {
        _startSynthFallback(slug);
        if (window.Analytics?.trackAudioPlay) {
          window.Analytics.trackAudioPlay(slug, st.currentTime);
        }
      }
      return;
    }

    if (audio.paused) {
      // Pause all other audio players & synth states
      Object.keys(_audioSynthState).forEach(other => {
        if (other !== slug && _audioSynthState[other]?.playing) {
          _stopSynthAudio(other, false);
        }
      });
      document.querySelectorAll('audio').forEach(a => {
        if (a !== audio && !a.paused) {
          a.pause();
          const otherSlug = a.id.replace('audio-', '');
          _syncAudioPlayerUI(otherSlug, false);
        }
      });
      window.setupAudioListeners(slug);
      if (!audio.getAttribute('src') && audio.dataset && audio.dataset.src) {
        audio.src = audio.dataset.src;
      }
      let playPromise;
      try {
        playPromise = audio.play();
      } catch (err) {
        _startSynthFallback(slug);
        return;
      }
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          _syncAudioPlayerUI(slug, true);
          if (window.Analytics?.trackAudioPlay) {
            window.Analytics.trackAudioPlay(slug, audio.currentTime);
          }
        }).catch(() => {
          _startSynthFallback(slug);
        });
      } else {
        _startSynthFallback(slug);
      }
    } else {
      audio.pause();
      _syncAudioPlayerUI(slug, false);
      if (window.Analytics?.trackAudioPause) {
        window.Analytics.trackAudioPause(slug, audio.currentTime, audio.duration);
      }
    }
  };

  window.seekAudio = function(slug, event) {
    const audio = document.getElementById('audio-' + slug);
    const track = document.getElementById('audio-track-' + slug);
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const width = rect.width || 100;
    const clickX = Math.max(0, Math.min((event?.clientX ?? 0) - rect.left, width));
    const percent = clickX / width;

    const st = _audioSynthState[slug];
    if (st && st.mode === 'synth') {
      st.currentTime = percent * st.duration;
      const bar = document.getElementById('audio-bar-' + slug);
      const timeDisplay = document.getElementById('audio-time-' + slug);
      if (bar) bar.style.width = (percent * 100) + '%';
      if (timeDisplay) timeDisplay.textContent = _formatAudioTime(st.currentTime) + ' / ' + _formatAudioTime(st.duration);
      return;
    }

    if (!audio || !audio.duration) return;
    audio.currentTime = percent * audio.duration;
    if (window.Analytics?.trackAudioSeek) {
      window.Analytics.trackAudioSeek(slug, audio.currentTime);
    }
  };

  window.cycleAudioSpeed = function(slug) {
    const audio = document.getElementById('audio-' + slug);
    const btn = document.getElementById('audio-speed-' + slug);
    if (!audio || !btn) return;

    const speeds = [1, 1.25, 1.5, 1.75, 2, 0.75];
    const st = _audioSynthState[slug];
    const currentSpeed = (st && st.mode === 'synth') ? (st.playbackRate || 1) : (audio.playbackRate || 1);
    const nextIndex = (speeds.indexOf(currentSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];

    audio.playbackRate = newSpeed;
    if (st) st.playbackRate = newSpeed;
    btn.textContent = newSpeed + 'x';
    if (window.Analytics?.trackAudioSpeedChange) {
      window.Analytics.trackAudioSpeedChange(slug, newSpeed);
    }
  };

  window.setupAudioListeners = function(slug) {
    const audio = document.getElementById('audio-' + slug);
    if (!audio || audio._listenersAttached) return;
    audio._listenersAttached = true;

    const bar = document.getElementById('audio-bar-' + slug);
    const timeDisplay = document.getElementById('audio-time-' + slug);

    if (audio.duration && isFinite(audio.duration) && timeDisplay) {
      timeDisplay.textContent = _formatAudioTime(audio.currentTime) + ' / ' + _formatAudioTime(audio.duration);
    }

    audio.addEventListener('loadedmetadata', () => {
      if (timeDisplay && audio.duration && isFinite(audio.duration)) {
        timeDisplay.textContent = _formatAudioTime(audio.currentTime) + ' / ' + _formatAudioTime(audio.duration);
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      if (bar) bar.style.width = pct + '%';
      if (timeDisplay) {
        timeDisplay.textContent = _formatAudioTime(audio.currentTime) + ' / ' + _formatAudioTime(audio.duration);
      }
    });

    audio.addEventListener('error', () => {
      if (!_audioSynthState[slug]?.playing) {
        _startSynthFallback(slug);
      }
    });

    audio.addEventListener('ended', () => {
      _syncAudioPlayerUI(slug, false);
      if (bar) bar.style.width = '0%';
      if (timeDisplay) {
        timeDisplay.textContent = '0:00 / ' + _formatAudioTime(audio.duration);
      }
      if (window.Analytics?.trackAudioComplete) {
        window.Analytics.trackAudioComplete(slug, audio.duration);
      }
    });
  };

  // Global helper for code copy
  window.copyCode = function(btn) {
    const block = btn.closest('.code-block');
    const code = block?.querySelector('code');
    const filename = block?.querySelector('.code-block__lang')?.textContent || '';
    if (code) {
      navigator.clipboard.writeText(code.textContent).then(() => {
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
        if (window.Analytics?.trackCodeCopy) {
          window.Analytics.trackCodeCopy(filename, '', code.textContent.length);
        }
      });
    }
  };

  /**
   * Render a single Project Card
   */
  function renderProjectCard(project) {
    const isPinned = project.pinned;
    const hasLive = Boolean(project.liveUrl);
    const tagsHtml = (project.tags || []).slice(0, 5).map(t => `<span class="project-card__tag">${escapeHtml(t)}</span>`).join('');
    const safeName = escapeHtml(project.name);

    return `
      <div class="project-card" id="project-${project.id}" data-project-id="${project.id}">
        <div class="project-card__top">
          <div class="project-card__title-group">
            <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-card__title-link" aria-label="${safeName} repository" data-repo-placement="card_title">
              <h3 class="project-card__title">${escapeHtml(project.name)}</h3>
            </a>
            ${project.title ? `<span class="project-card__subtitle">· ${escapeHtml(project.title)}</span>` : ''}
            <span class="project-card__lang">
              <span class="project-card__lang-dot" style="background-color: ${project.languageColor || 'var(--accent)'}"></span>
              <span class="project-card__lang-name">${escapeHtml(project.language || 'Code')}</span>
            </span>
          </div>

          <div class="project-card__badges">
            ${project.featuredBadge ? `<span class="project-card__badge project-card__badge--hn">${project.featuredBadge}</span>` : ''}
            ${isPinned ? `<span class="project-card__badge project-card__badge--pinned">${icons.pin} Pinned</span>` : ''}
            ${project.stars ? `<span class="project-card__stars-pill">${icons.star} ${project.stars}</span>` : ''}
          </div>
        </div>

        <p class="project-card__desc">${escapeHtml(project.description)}</p>

        <div class="project-card__footer">
          <div class="project-card__tags">
            ${tagsHtml}
          </div>

          <div class="project-card__actions">
            <button type="button" class="btn btn--sm btn--secondary project-card__btn" data-action="open-repo-codelab" data-repo="${escapeHtml(project.githubRepo || ('innovatorved/' + project.name))}" data-title="${safeName}" title="Inspect ${safeName} schema &amp; queries in the in-browser SQL Studio">
              ${icons.terminal}
              <span>Explore in SQL Studio</span>
            </button>
            <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--sm btn--secondary project-card__btn" aria-label="${safeName} GitHub repository" data-repo-placement="card_footer_github">
              ${icons.github}
              <span>GitHub</span>
              ${icons.external}
            </a>
            ${hasLive ? `
              <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--sm btn--primary project-card__btn" aria-label="${safeName} live demo" data-repo-placement="card_footer_demo">
                ${icons.globe}
                <span>Live Demo</span>
                ${icons.external}
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the Dedicated Projects Showcase View
   */
  function renderProjects(selectedId) {
    const projects = window.PROJECTS_DATA || [];
    if (!projects.length) {
      return '<div style="padding: 40px; text-align: center; color: var(--fg-muted);">Loading projects...</div>';
    }

    let html = `
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/" data-nav="home">Home</a>
        <span class="breadcrumbs__sep">${icons.chevronRight}</span>
        <span class="breadcrumbs__current">Projects</span>
      </nav>

      <div class="lesson-header">
        <div class="lesson-header__badge">
          <span class="lesson-header__kind lesson-header__kind--build">${icons.code} Open Source</span>
          <span class="tag">${projects.length} Repos</span>
        </div>
        <h1 class="lesson-header__title">SQL &amp; Database Internals Projects &amp; Case Studies</h1>
        <div class="lesson-header__actions" style="margin-top: var(--space-3); display: flex; gap: var(--space-3); flex-wrap: wrap;">
          <a href="/" data-nav="home" class="btn btn--sm btn--secondary">← Back to Curriculum</a>
          <a href="/sandbox/" data-nav="sandbox" class="btn btn--sm btn--primary">${icons.code} Launch Interactive SQL Workbench</a>
        </div>
      </div>

      <div class="projects-grid">
        ${projects.map(p => renderProjectCard(p)).join('')}
      </div>
    `;

    return html;
  }





  /**
   * Render System Design Glossary
   */
  function renderGlossary() {
    const glossary = window.GLOSSARY_DATA || window.GLOSSARY || [];
    let html = `
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/" data-nav="home">Home</a>
        <span class="breadcrumbs__sep">${icons.chevronRight}</span>
        <span class="breadcrumbs__current">Glossary</span>
      </nav>

      <div class="lesson-header">
        <div class="lesson-header__badge">
          <span class="lesson-header__kind lesson-header__kind--lesson">Reference</span>
          <span class="tag">${glossary.length} Terms</span>
        </div>
        <h1 class="lesson-header__title">SQL &amp; Database Internals Glossary</h1>
        <p class="hero__subtitle" style="margin-top:0.5rem;">Rigorous mathematical, asymptotic, and mechanical definitions across all 18 modules.</p>
        <div style="margin-top:1rem;">
          <input type="text" id="glossary-filter" data-action="filter-glossary" placeholder="Filter terms (e.g. SARGable, MVCC, B+Tree, window frame, WAL)..." style="width:100%; max-width:400px; padding:0.5rem 0.75rem; background:var(--surface); border:1px solid var(--border); border-radius:6px; color:var(--fg); font-size:13px;">
        </div>
      </div>

      <div style="margin-top:1.5rem; display:flex; flex-direction:column; gap:0.75rem;">
    `;

    for (const item of glossary) {
      const defText = item.definition || item.def || '';
      const catText = item.category || item.cat || 'Algorithms';
      const compText = item.complexity ? ` · <code>${escapeHtml(item.complexity)}</code>` : '';
      html += `
        <div class="glossary-item" style="padding:1rem; border:1px solid var(--border); border-radius:6px; background:var(--surface);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem; gap:8px; flex-wrap:wrap;">
            <strong style="font-size:15px; color:var(--fg);">${escapeHtml(item.term)}${compText}</strong>
            <span class="badge badge--secondary" style="font-size:11px;">${escapeHtml(catText)}</span>
          </div>
          <p style="margin:0.25rem 0 0; font-size:13px; color:var(--fg-muted); line-height:1.5;">${renderMathInHtml(formatInlineCode(defText))}</p>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Render Printable Module Cheat Sheet & SQL Patterns Reference
   */
  function renderCheatSheet(moduleId) {
    const data = window.CURRICULUM_DATA;
    const effectiveId = moduleId || 'm01';
    let targetMod = null;
    const allModules = [];
    if (data && Array.isArray(data.parts)) {
      for (const p of data.parts) {
        for (const m of (p.modules || [])) {
          allModules.push(m);
          if (m.id === effectiveId || m.number === effectiveId || `m${m.number}` === effectiveId) {
            targetMod = m;
          }
        }
      }
    }
    if (!targetMod && allModules.length > 0) {
      targetMod = allModules[0];
    }

    if (!targetMod) {
      return '<div style="padding:40px; text-align:center;">Module not found for cheat sheet.</div>';
    }

    const modContent = window.MODULE_CONTENT?.[targetMod.id] || {};
    const switcherHtml = allModules.length > 0 ? `
      <div class="cheatsheet-module-switcher" role="navigation" aria-label="Module Cheat Sheet Switcher">
        <span style="font-size:11px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.05em;color:var(--fg-muted);margin-right:4px;">Modules &amp; Patterns:</span>
        ${allModules.map(m => {
          const isAct = m.id === targetMod.id;
          return `<a href="#cheatsheet/${escapeHtml(m.id)}" class="cheatsheet-module-pill ${isAct ? 'is-active' : ''}" data-action="navigate-cheatsheet" data-module="${escapeHtml(m.id)}" title="Module ${escapeHtml(m.number)}: ${escapeHtml(m.title)}">M${escapeHtml(m.number)} · ${escapeHtml(m.title.split(',')[0].split('&')[0].trim())}</a>`;
        }).join('')}
      </div>
    ` : '';

    let html = `
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/" data-nav="home">Home</a>
        <span class="breadcrumbs__sep">${icons.chevronRight}</span>
        <a href="/topic/${targetMod.units[0]?.slug}/">Module ${targetMod.number}</a>
        <span class="breadcrumbs__sep">${icons.chevronRight}</span>
        <span class="breadcrumbs__current">SQL Patterns &amp; Cheat Sheet</span>
      </nav>

      ${switcherHtml}

      <div class="lesson-header">
        <div class="lesson-header__badge">
          <span class="lesson-header__kind lesson-header__kind--lesson">Module ${targetMod.number}</span>
          <span class="tag">SQL Patterns &amp; Printable Reference</span>
        </div>
        <h1 class="lesson-header__title">${escapeHtml(targetMod.title)} — Cheat Sheet</h1>
        <p class="hero__subtitle" style="margin-top:0.5rem;">${escapeHtml(targetMod.summary)}</p>
        <div class="lesson-header__actions" style="margin-top:1rem;">
          <button class="btn btn--sm btn--primary" data-action="window-print">
            🖨️ Print / Save as PDF
          </button>
          <a href="/topic/${targetMod.units[0]?.slug}/" class="btn btn--sm btn--secondary">
            📖 Open Module ${targetMod.number} Lessons
          </a>
        </div>
      </div>

      <div style="margin-top:1.5rem; display:flex; flex-direction:column; gap:1.25rem;">
    `;

    for (const unit of targetMod.units) {
      const c = modContent[unit.slug];
      const takeaways = c?.keyTakeaways || [];
      html += `
        <div style="padding:1.25rem; border:1px solid var(--border); border-radius:8px; background:var(--surface);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:0.65rem;">
            <div>
              <h3 style="font-size:16px; margin:0; color:var(--fg);">${escapeHtml(unit.title)}</h3>
              ${unit.complexity ? `<div style="margin-top:4px;font-size:11.5px;font-family:var(--font-mono);color:var(--info);">⏱ Complexity: ${escapeHtml(unit.complexity)}</div>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <button type="button" class="btn btn--secondary btn--sm" data-open-topic-lab="${escapeHtml(unit.slug)}" data-lab-mode="guided">▶ Launch SQL Lab</button>
              <a href="/topic/${escapeHtml(unit.slug)}/" class="btn btn--primary btn--sm" style="text-decoration:none;">View Lesson →</a>
            </div>
          </div>
          ${takeaways.length ? `
            <div style="font-size:11px; font-weight:700; letter-spacing:0.05em; color:var(--fg-muted); margin-bottom:0.35rem;">KEY SQL INVARIANTS &amp; TAKEAWAYS:</div>
            <ul style="margin:0; padding-left:1.25rem; font-size:13.5px; color:var(--fg-prose); line-height:1.6;">
              ${takeaways.map(t => `<li style="margin-bottom:0.25rem;">${escapeHtml(t)}</li>`).join('')}
            </ul>
          ` : '<p style="font-size:12px; color:var(--fg-muted); margin:0;">Interactive SQL Lab and clause walkthrough available in lesson.</p>'}
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  return {
    renderOverview,
    renderLesson,
    renderBuild,
    renderProjects,
    renderProjectCard,
    renderVideoEmbed,
    renderGlossary,
    renderCheatSheet,
    convertMarkdownToHTML,
    renderTopicCodeBlock,
    renderTopicCodeLabCard,
    escapeHtml,
    icons
  };
})();
