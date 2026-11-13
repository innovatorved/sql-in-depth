#!/usr/bin/env node
/**
 * SQL In Depth — Deterministic Content, Diagram & Video Curation Upgrade
 *
 * 1. Curates YouTube reference lectures down to the single best authoritative
 *    English lecture per module (18 total across m01..m18), removing all
 *    non-English, off-topic, clickbait, and whitespace-corrupted entries in both
 *    data/topic_videos.json and data/content/m01..m18.js.
 * 2. Fixes all grammatical comma-capital splices in `intuition` and `content`,
 *    and adds a crisp one-line `promise` field to every unit.
 * 3. Replaces hardcoded dark-only hex colors in inline `svg.concept-diagram`
 *    elements with theme-aware CSS variables (`var(--surface)`, `var(--fg)`,
 *    `var(--accent)`, etc.) so diagrams render with >= 4.5:1 contrast in both
 *    light and dark themes.
 * 4. Replaces generic duplicated M01 SVGs with 10 bespoke topic-specific
 *    diagrams for Module 01 lessons.
 * 5. Normalizes section headings (`<h2>`) and warning callouts for clean TOC
 *    hierarchy and design-system styling.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'data', 'content');
const TOPIC_VIDEOS_FILE = path.join(ROOT, 'data', 'topic_videos.json');

// Load curriculum summaries for accurate one-line promises & prose fixes
const currCtx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data', 'curriculum.js'), 'utf8'), currCtx);
const UNIT_META = new Map();
for (const part of currCtx.window.CURRICULUM_DATA.parts) {
  for (const mod of part.modules) {
    for (const u of mod.units) {
      UNIT_META.set(u.slug, {
        ...u,
        summary: u.archive?.excerpt || u.summary || '',
        modId: mod.id,
        modNumber: mod.number,
        modTitle: mod.title
      });
    }
  }
}

// 18 strictly vetted, authoritative English-only reference lectures (1 best per module)
const CURATED_MODULE_VIDEOS = {
  'why-databases-exist': {
    youtubeId: '7NPIENPr-zk',
    title: 'Course Introduction & The Relational Model (CMU 15-445/645)',
    channel: 'CMU Database Group',
    duration: '1h 14m',
    start: 0,
    length: '74m',
    why: 'Prof. Andy Pavlo derives why flat CSV/JSON files fail concurrency, integrity, and durability requirements, motivating Codd\'s relational model.'
  },
  'primary-keys-surrogate-vs-natural': {
    youtubeId: 'DHtf_46OxY8',
    title: 'UUID vs INT: What Is Better For Your Primary Key?',
    channel: 'Database Star',
    duration: '9m 40s',
    start: 0,
    length: '9m',
    why: 'Compares 64-bit IDENTITY keys, random UUIDv4 page splits, and time-ordered UUIDv7 locality in B+Tree indexes.'
  },
  'semi-joins-anti-joins': {
    youtubeId: 'GWq-_R-pkzg',
    title: 'SQL Semi Joins and Anti Joins: EXISTS, IN, NOT EXISTS, and NOT IN',
    channel: 'Prateek Goel | GrowAsEngineers',
    duration: '10m 12s',
    start: 0,
    length: '10m',
    why: 'Walks through semi-join short-circuiting and why NOT IN silently returns zero rows whenever a subquery contains NULL.'
  },
  'case-analytics-double-counting-bug': {
    youtubeId: '71MvNBJYQ84',
    title: 'SQL Join Fan-Out: Why Joins Duplicate Rows and Inflate SUM',
    channel: 'Prateek Goel | GrowAsEngineers',
    duration: '8m 18s',
    start: 0,
    length: '8m',
    why: 'Demonstrates 1:N chasm traps inflating financial aggregates and fixes them with pre-aggregated CTEs.'
  },
  'cte-materialization-optimization-fence': {
    youtubeId: 'DzhmMwXYGME',
    title: 'SQL Subqueries vs Joins vs CTEs: How the PostgreSQL Optimizer Rewrites Them',
    channel: 'Prateek Goel | GrowAsEngineers',
    duration: '9m 05s',
    start: 0,
    length: '9m',
    why: 'Explains PostgreSQL 12+ CTE inlining versus MATERIALIZED optimization fences and predicate pushdown.'
  },
  'window-functions-mental-model': {
    youtubeId: 'rIcB4zMYMas',
    title: 'SQL Window Functions Clearly Explained: PARTITION BY, ORDER BY & Ranking',
    channel: 'Maven Analytics',
    duration: '7m 24s',
    start: 0,
    length: '7m',
    why: 'Visualizes how OVER(PARTITION BY ... ORDER BY ...) computes analytical values without collapsing detail rows.'
  },
  'strategic-denormalization-tradeoffs': {
    youtubeId: '4bTq0GdSeQs',
    title: 'Learn Database Denormalization & Normal Form Tradeoffs',
    channel: 'Decomplexify',
    duration: '19m 10s',
    start: 0,
    length: '19m',
    why: 'Contrasts normalized 3NF/BCNF write integrity against selective denormalization for read-heavy latency budgets.'
  },
  'star-schema-facts-dimensions': {
    youtubeId: 'gRE3E7VUzRU',
    title: 'Data Modeling Tutorial: Kimball Star Schema, Facts & Dimensions',
    channel: 'Kahan Data Solutions',
    duration: '16m 08s',
    start: 0,
    length: '16m',
    why: 'Covers grain declaration, conformed dimensions, surrogate keys, and fact table design for analytical warehouses.'
  },
  'calendar-tables-date-spines': {
    youtubeId: '0UCosrhH9uY',
    title: 'SQL generate_series Explained: Calendar Tables & Filling Missing Dates',
    channel: 'Prateek Goel | GrowAsEngineers',
    duration: '9m 15s',
    start: 0,
    length: '9m',
    why: 'Shows how continuous date spines prevent missing zero-event days in time-series retention and revenue charts.'
  },
  'btree-bplustree-internal-anatomy': {
    youtubeId: 'aZjYr87r1b8',
    title: 'B-Trees and B+Trees: How They Are Useful in Databases',
    channel: 'Abdul Bari',
    duration: '39m 41s',
    start: 0,
    length: '39m',
    why: 'Step-by-step derivation of high-fanout internal routing nodes, leaf-only tuple pointers, and sibling leaf range scans.'
  },
  'sargability-functions-on-columns': {
    youtubeId: 'So9ABjTqs4A',
    title: 'Statistics, Scans, Seeks, and SARGability',
    channel: 'Brent Ozar Unlimited',
    duration: '8m 22s',
    start: 0,
    length: '8m',
    why: 'Shows why wrapping indexed columns in functions defeats B+Tree seeks and forces full scans.'
  },
  'execution-models-volcano-vectorized': {
    youtubeId: 'hGwa6_VXbZc',
    title: 'Volcano Iterator Execution Model (open / next / close)',
    channel: 'Database Systems Research Group at U Tübingen',
    duration: '31m 14s',
    start: 0,
    length: '31m',
    why: 'University lecture tracing tuple-at-a-time Volcano iterators versus modern vectorized batch execution.'
  },
  'optimistic-vs-pessimistic-concurrency': {
    youtubeId: 'I8IlO0hCSgY',
    title: 'Pessimistic vs Optimistic Concurrency Control in Database Systems',
    channel: 'Hussein Nasser',
    duration: '16m 30s',
    start: 0,
    length: '16m',
    why: 'Analyses lock contention, retry storms, and throughput crossovers between SELECT FOR UPDATE and version-checked OCC.'
  },
  'tuple-headers-xmin-xmax-visibility': {
    youtubeId: 'AveRgUrC7FM',
    title: 'Postgres System Columns Explained (ctid, xmin, xmax)',
    channel: 'Hussein Nasser',
    duration: '26m 12s',
    start: 0,
    length: '26m',
    why: 'Live inspection of PostgreSQL physical tuple headers, MVCC version chains, and snapshot visibility rules.'
  },
  'aries-crash-recovery-analysis-redo-undo': {
    youtubeId: 'yVpzHdAP0TY',
    title: 'Database Crash Recovery with ARIES (CMU 15-445/645)',
    channel: 'CMU Database Group',
    duration: '1h 12m',
    start: 0,
    length: '72m',
    why: 'Covers steal/no-force buffer management, LSNs, and the Analysis, Redo, and Undo phases of ARIES recovery.'
  },
  'late-materialization-simd-vectorization': {
    youtubeId: 'yU1S8gwjGEw',
    title: 'Vectorized Query Execution Using SIMD (CMU Advanced Database Systems)',
    channel: 'CMU Database Group',
    duration: '1h 18m',
    start: 0,
    length: '78m',
    why: 'Deep dive into columnar selection vectors, late materialization, and SIMD predicate evaluation.'
  },
  'distributed-transactions-2pc-saga': {
    youtubeId: 'DOFflggE_0Q',
    title: 'Distributed Transactions Explained: Two-Phase Commit vs Saga Pattern',
    channel: 'Hello Interview',
    duration: '14m 19s',
    start: 0,
    length: '14m',
    why: 'Contrasts coordinator blocking in atomic 2PC against compensating transactions and idempotency in Sagas.'
  },
  'pg-stat-statements-slow-query-triage': {
    youtubeId: 'U8UGTyJp-K4',
    title: 'Deep Dive into pg_stat_statements for Production Slow Query Triage',
    channel: 'pganalyze',
    duration: '10m 25s',
    start: 0,
    length: '10m',
    why: 'Practical triage workflow ranking production SQL workload bottlenecks by total_exec_time, mean latency, and shared buffer misses.'
  }
};

function lowerFirst(s) {
  if (!s) return '';
  // Keep acronyms uppercase (ACID, SQL, MVCC, B+Tree, UUID, WAL, OLTP, OLAP, SIMD, 2PC, 3VL, etc.)
  if (/^(?:ACID|SQL|MVCC|B\+Tree|B-Tree|UUID|WAL|OLTP|OLAP|SIMD|2PC|3VL|1NF|2NF|3NF|BCNF|CTE|DDL|DML|JSON|CSV|NULL|NOT|SELECT|WHERE|GROUP|ORDER|CASE|IEEE|GIN|GiST|BRIN|LSM|ARIES|SCD|PITR|N\+1|OR\b|IN\b)/.test(s)) {
    return s;
  }
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const GERUND_TO_3P = {
  Mapping: 'maps',
  Choosing: 'chooses',
  Quantifying: 'quantifies',
  Writing: 'writes',
  Building: 'builds',
  Designing: 'designs',
  Solving: 'solves',
  Preventing: 'prevents',
  Eliminating: 'eliminates',
  Understanding: 'explains',
  Comparing: 'compares',
  Evaluating: 'evaluates',
  Executing: 'executes',
  Implementing: 'implements',
  Using: 'uses',
  Detecting: 'detects',
  Diagnosing: 'diagnoses',
  Optimizing: 'optimizes',
  Scaling: 'scales',
  Replacing: 'replaces',
  Converting: 'converts',
  Computing: 'computes',
  Splitting: 'splits',
  Combining: 'combines',
  Transforming: 'transforms',
  Traversing: 'traverses',
  Tracing: 'traces',
  Modeling: 'models',
  Enforcing: 'enforces',
  Protecting: 'protects',
  Taming: 'tames',
  Turning: 'turns',
  Avoiding: 'avoids',
  Handling: 'handles',
  Benchmarking: 'benchmarks',
  Indexing: 'indexes',
  Partitioning: 'partitions',
  Replicating: 'replicates',
  Recovering: 'recovers',
  Streaming: 'streams',
  Compressing: 'compresses',
  Batching: 'batches',
  Auditing: 'audits',
  Navigating: 'navigates',
  Mastering: 'masters',
  Controlling: 'controls',
  Balancing: 'balances',
  Constructing: 'constructs',
  Analyzing: 'analyzes',
  Fixing: 'fixes',
  Reading: 'reads',
  Measuring: 'measures',
  Unpacking: 'unpacks',
  Managing: 'manages',
  Surviving: 'survives',
  Securing: 'secures',
  Validating: 'validates',
  Materializing: 'materializes',
  Pushing: 'pushes',
  Unnesting: 'unnests',
  Filtering: 'filters',
  Projecting: 'projects',
  Sorting: 'sorts',
  Grouping: 'groups',
  Joining: 'joins',
  Locking: 'locks',
  Vacuuming: 'vacuums',
  Flushing: 'flushes',
  Pruning: 'prunes',
  Sharding: 'shards',
  Pooling: 'pools'
};

function buildCleanSummarySentence(titleHtml, codeSlug, rawSummary) {
  const s = (rawSummary || '').trim().replace(/\.$/, '');
  if (!s) {
    return `${titleHtml} (<code>${codeSlug}</code>) establishes a rigorous mental model linking relational algebra semantics to physical page execution.`;
  }
  if (/^(?:Why|How|When|Where|What)\b/i.test(s)) {
    return `${titleHtml} (<code>${codeSlug}</code>) explains ${ s.charAt(0).toLowerCase() + s.slice(1) }.`;
  }
  const firstWord = s.split(/\s+/)[0];
  if (GERUND_TO_3P[firstWord]) {
    const rest = s.slice(firstWord.length);
    return `${titleHtml} (<code>${codeSlug}</code>) ${GERUND_TO_3P[firstWord]}${rest}.`;
  }
  if (/^[A-Z][a-z]+ing\b/.test(firstWord)) {
    return `${titleHtml} (<code>${codeSlug}</code>) focuses on ${firstWord.toLowerCase()}${s.slice(firstWord.length)}.`;
  }
  return `${titleHtml} (<code>${codeSlug}</code>) covers ${lowerFirst(s)}.`;
}

function buildLogicalLayerSentence(rawSummary) {
  const s = (rawSummary || '').trim().replace(/\.$/, '');
  if (!s) {
    return 'At the logical layer, declarative predicates and projections form a closed relational algebra tree prior to physical optimization.';
  }
  if (/^(?:Why|How|When|Where|What)\b/i.test(s)) {
    return `At the logical and physical boundary, engineers must understand ${s.charAt(0).toLowerCase() + s.slice(1)}.`;
  }
  const firstWord = s.split(/\s+/)[0];
  if (GERUND_TO_3P[firstWord]) {
    return `At the execution boundary, this mechanism ${GERUND_TO_3P[firstWord]}${s.slice(firstWord.length)}.`;
  }
  if (/^[A-Z][a-z]+ing\b/.test(firstWord)) {
    return `At the logical layer, mastery begins with ${firstWord.toLowerCase()}${s.slice(firstWord.length)}.`;
  }
  return `At the logical layer, the engine governs ${lowerFirst(s)}.`;
}

function buildPromise(meta, title) {
  const raw = (meta?.summary || '').trim().replace(/\.$/, '');
  if (!raw) {
    return `Learn the relational semantics, physical 8KB page mechanics, and query execution tradeoffs behind ${title}.`;
  }
  if (/^(?:Why|How|When|Where|What)\b/i.test(raw)) {
    return `Understand ${raw.charAt(0).toLowerCase() + raw.slice(1)}—and verify it on live tables and execution plans.`;
  }
  const firstWord = raw.split(/\s+/)[0];
  if (/^[A-Z][a-z]+ing\b/.test(firstWord)) {
    const imperative = firstWord
      .replace(/^Choosing$/, 'Choose')
      .replace(/^Writing$/, 'Write')
      .replace(/^Solving$/, 'Solve')
      .replace(/^Using$/, 'Use')
      .replace(/^Comparing$/, 'Compare')
      .replace(/^Tracing$/, 'Trace')
      .replace(/^Taming$/, 'Tame')
      .replace(/^Replacing$/, 'Replace')
      .replace(/^Managing$/, 'Manage')
      .replace(/^Validating$/, 'Validate')
      .replace(/^Securing$/, 'Secure')
      .replace(/^Measuring$/, 'Measure')
      .replace(/^Analyzing$/, 'Analyze')
      .replace(/^Optimizing$/, 'Optimize')
      .replace(/^Diagnosing$/, 'Diagnose')
      .replace(/^Materializing$/, 'Materialize')
      .replace(/^Surviving$/, 'Survive')
      .replace(/^Handling$/, 'Handle')
      .replace(/^Scaling$/, 'Scale')
      .replace(/^Computing$/, 'Compute')
      .replace(/^Eliminating$/, 'Eliminate')
      .replace(/^Evaluating$/, 'Evaluate')
      .replace(/^Executing$/, 'Execute')
      .replace(/^Enforcing$/, 'Enforce')
      .replace(/^Exploring$/, 'Explore')
      .replace(/ing$/, '');
    // Fallback if naive stem looks odd
    if (imperative.length >= 4 && !/(?:pp|tt|nn|mm|dd|gg|bb|v|z)$/.test(imperative)) {
      return `${imperative}${raw.slice(firstWord.length)} with predictable I/O cost and zero silent NULL traps.`;
    }
    return `Master ${firstWord.toLowerCase()}${raw.slice(firstWord.length)}.`;
  }
  return `${raw.charAt(0).toUpperCase() + raw.slice(1)}—backed by runnable SQL and physical plan inspection.`;
}

// Bespoke, theme-adaptive M01 diagrams (zero hardcoded #09090b, crisp in Light & Dark)
function getM01Svg(slug, title) {
  const baseOpen = (label) =>
    `<svg class="concept-diagram" viewBox="0 0 760 240" width="100%" height="240" role="img" aria-label="${label}" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;margin:1.25rem 0;">`;

  switch (slug) {
    case 'why-databases-exist':
      return `${baseOpen('Flat CSV Files versus ACID Relational Storage Engine')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Flat CSV / JSON Files vs. ACID Relational Engine (8KB Slotted Pages + WAL)</text>
  <rect x="20" y="44" width="330" height="176" rx="8" fill="var(--bg-subtle)" stroke="var(--danger)" stroke-width="1.25"/>
  <text x="34" y="68" fill="var(--danger)" font-family="var(--font-mono)" font-size="11" font-weight="700">AD-HOC CSV / JSON FILE</text>
  <text x="34" y="92" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">1. O(N) full-file parse on every lookup</text>
  <text x="34" y="114" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">2. Concurrent writes corrupt byte offsets</text>
  <text x="34" y="136" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">3. Crash mid-write leaves torn lines</text>
  <text x="34" y="158" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">4. No schema or FK constraint enforcement</text>
  <rect x="34" y="176" width="300" height="28" rx="4" fill="var(--danger-subtle)"/>
  <text x="44" y="194" fill="var(--danger)" font-family="var(--font-mono)" font-size="10" font-weight="600">Result: Lost updates &amp; silent corruption</text>

  <path d="M 362 132 L 398 132" stroke="var(--accent)" stroke-width="2"/>
  <polygon points="398,127 408,132 398,137" fill="var(--accent)"/>

  <rect x="414" y="44" width="326" height="176" rx="8" fill="var(--bg-subtle)" stroke="var(--accent)" stroke-width="1.5"/>
  <text x="428" y="68" fill="var(--accent)" font-family="var(--font-mono)" font-size="11" font-weight="700">RELATIONAL DBMS ENGINE</text>
  <text x="428" y="92" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">1. O(log_B N) B+Tree seek on 8KB pages</text>
  <text x="428" y="114" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">2. MVCC snapshots isolate concurrent readers</text>
  <text x="428" y="136" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">3. Write-Ahead Log (WAL) crash recovery</text>
  <text x="428" y="158" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">4. Strict PK, FK, NOT NULL &amp; CHECK rules</text>
  <rect x="428" y="176" width="298" height="28" rx="4" fill="var(--success-subtle)"/>
  <text x="438" y="194" fill="var(--success)" font-family="var(--font-mono)" font-size="10" font-weight="600">Result: ACID guarantees at 100k+ TPS</text>
</svg>`;

    case 'tables-rows-columns-types':
      return `${baseOpen('Physical Tuple Byte Layout with Header, Null Bitmap, Fixed and Varlen Attributes')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Physical Tuple Byte Layout Inside an 8KB Heap Page</text>
  <text x="20" y="44" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="10">Relation = Unordered Set of Tuples · Fixed-Width vs. Variable-Length (varlena) Representation</text>
  <rect x="20" y="64" width="155" height="92" rx="6" fill="var(--bg-subtle)" stroke="var(--border-strong)" stroke-width="1.25"/>
  <text x="30" y="86" fill="var(--fg)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">Tuple Header (23B)</text>
  <text x="30" y="106" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">t_xmin / t_xmax</text>
  <text x="30" y="124" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">t_ctid (page, slot)</text>
  <text x="30" y="142" fill="var(--accent)" font-family="var(--font-mono)" font-size="9.5">t_infomask bits</text>

  <rect x="183" y="64" width="125" height="92" rx="6" fill="var(--warning-subtle)" stroke="var(--warning)" stroke-width="1.25"/>
  <text x="193" y="86" fill="var(--fg)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">NULL Bitmap</text>
  <text x="193" y="108" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">1 bit / column</text>
  <text x="193" y="128" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">Zero payload bytes</text>
  <text x="193" y="144" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">for NULL fields</text>

  <rect x="316" y="64" width="206" height="92" rx="6" fill="var(--accent-subtle)" stroke="var(--accent)" stroke-width="1.25"/>
  <text x="326" y="86" fill="var(--accent)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">Fixed-Width Columns</text>
  <text x="326" y="108" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">BIGINT id (8B aligned)</text>
  <text x="326" y="126" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">TIMESTAMPTZ (8B UTC us)</text>
  <text x="326" y="144" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">INT status_code (4B)</text>

  <rect x="530" y="64" width="210" height="92" rx="6" fill="var(--success-subtle)" stroke="var(--success)" stroke-width="1.25"/>
  <text x="540" y="86" fill="var(--success)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">Varlena / NUMERIC</text>
  <text x="540" y="108" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">TEXT email (1B/4B hdr + UTF8)</text>
  <text x="540" y="126" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">NUMERIC(12,2) exact base-10000</text>
  <text x="540" y="144" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">TOAST if &gt; 2KB threshold</text>

  <rect x="20" y="174" width="720" height="44" rx="6" fill="var(--bg-subtle)" stroke="var(--border)" stroke-width="1"/>
  <text x="32" y="200" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">Alignment Rule: Order 8-byte columns before 4-byte/varlena columns when minimizing CPU struct padding.</text>
</svg>`;

    case 'select-projection-aliases':
      return `${baseOpen('SQL Written Syntax Order versus Logical Binding Execution Order')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Written SQL Order vs. Logical Binding Order (Why WHERE Rejects SELECT Aliases)</text>
  <text x="20" y="54" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="10" font-weight="700">LOGICAL EVALUATION PIPELINE (LEFT → RIGHT):</text>
  ${[
    ['1. FROM / JOIN', 'Materialize input', 20, 'var(--border-strong)'],
    ['2. WHERE', 'Row filter (no alias)', 142, 'var(--danger)'],
    ['3. GROUP BY', 'Bucket keys', 264, 'var(--border-strong)'],
    ['4. HAVING', 'Group filter', 368, 'var(--border-strong)'],
    ['5. SELECT', 'Bind aliases here!', 472, 'var(--accent)'],
    ['6. ORDER / LIMIT', 'Aliases visible', 604, 'var(--success)']
  ].map(([h, sub, x, stroke]) => `
  <rect x="${x}" y="68" width="${x === 604 ? 136 : x === 472 ? 122 : x >= 264 ? 94 : 112}" height="74" rx="6" fill="var(--bg-subtle)" stroke="${stroke}" stroke-width="1.4"/>
  <text x="${x + 8}" y="92" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5" font-weight="700">${h}</text>
  <text x="${x + 8}" y="114" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="8.8">${sub}</text>`).join('')}
  <rect x="20" y="160" width="720" height="58" rx="6" fill="var(--accent-subtle)" stroke="var(--accent)" stroke-width="1"/>
  <text x="32" y="183" fill="var(--fg)" font-family="var(--font-mono)" font-size="10" font-weight="700">Scope Invariant: Column aliases created in Step 5 (SELECT total_cents / 100.0 AS usd)</text>
  <text x="32" y="203" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">do NOT exist during Step 2 (WHERE) or Step 4 (HAVING), but ARE in scope at Step 6 (ORDER BY usd DESC).</text>
</svg>`;

    case 'where-filtering-predicates':
      return `${baseOpen('Non-SARGable Function Predicate Full Scan versus SARGable B+Tree Range Seek')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Predicate SARGability: Wrapping Indexed Column vs. Half-Open Range Seek</text>
  <rect x="20" y="46" width="345" height="174" rx="8" fill="var(--bg-subtle)" stroke="var(--danger)" stroke-width="1.3"/>
  <text x="32" y="68" fill="var(--danger)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">NON-SARGABLE (Seq Scan: 12,500 Pages)</text>
  <text x="32" y="92" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">WHERE EXTRACT(YEAR FROM created_at) = 2025</text>
  <text x="32" y="118" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Evaluates function on every row in table</text>
  <text x="32" y="138" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Cannot binary-search sorted B+Tree keys</text>
  <text x="32" y="158" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Latency scales linearly O(N) with table size</text>

  <rect x="395" y="46" width="345" height="174" rx="8" fill="var(--bg-subtle)" stroke="var(--success)" stroke-width="1.4"/>
  <text x="407" y="68" fill="var(--success)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">SARGABLE (Index Range Seek: 4 Pages)</text>
  <text x="407" y="92" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">WHERE created_at &gt;= '2025-01-01'</text>
  <text x="407" y="108" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">  AND created_at &lt;  '2026-01-01'</text>
  <text x="407" y="134" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Bare indexed column isolated on LHS</text>
  <text x="407" y="154" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Seeks directly to first leaf key &gt;= 2025-01-01</text>
  <text x="407" y="174" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Logarithmic O(log_B N + K) I/O complexity</text>
</svg>`;

    case 'boolean-logic-three-valued-null':
      return `${baseOpen('Kleene Three-Valued Logic Truth Tables and WHERE versus CHECK Semantics')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">SQL Three-Valued Logic (TRUE · FALSE · UNKNOWN) Dominance Rules</text>
  <rect x="20" y="46" width="228" height="174" rx="6" fill="var(--bg-subtle)" stroke="var(--border-strong)" stroke-width="1.2"/>
  <text x="32" y="68" fill="var(--accent)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">AND (FALSE Dominates)</text>
  <text x="32" y="94" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">TRUE    AND UNKNOWN → UNKNOWN</text>
  <text x="32" y="118" fill="var(--success)" font-family="var(--font-mono)" font-size="10" font-weight="700">FALSE   AND UNKNOWN → FALSE</text>
  <text x="32" y="142" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">UNKNOWN AND UNKNOWN → UNKNOWN</text>
  <text x="32" y="182" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.2">WHERE drops FALSE &amp; UNKNOWN</text>

  <rect x="266" y="46" width="228" height="174" rx="6" fill="var(--bg-subtle)" stroke="var(--border-strong)" stroke-width="1.2"/>
  <text x="278" y="68" fill="var(--accent)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">OR (TRUE Dominates)</text>
  <text x="278" y="94" fill="var(--success)" font-family="var(--font-mono)" font-size="10" font-weight="700">TRUE    OR UNKNOWN → TRUE</text>
  <text x="278" y="118" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">FALSE   OR UNKNOWN → UNKNOWN</text>
  <text x="278" y="142" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">UNKNOWN OR UNKNOWN → UNKNOWN</text>
  <text x="278" y="182" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.2">NOT UNKNOWN → UNKNOWN!</text>

  <rect x="512" y="46" width="228" height="174" rx="6" fill="var(--warning-subtle)" stroke="var(--warning)" stroke-width="1.3"/>
  <text x="524" y="68" fill="var(--fg)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">WHERE vs CHECK Trap</text>
  <text x="524" y="96" fill="var(--danger)" font-family="var(--font-mono)" font-size="9.5">WHERE: keeps ONLY TRUE</text>
  <text x="524" y="116" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.2">(UNKNOWN is discarded)</text>
  <text x="524" y="146" fill="var(--warning)" font-family="var(--font-mono)" font-size="9.5">CHECK: rejects ONLY FALSE</text>
  <text x="524" y="166" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.2">(UNKNOWN passes constraint!)</text>
  <text x="524" y="198" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.2">Use IS DISTINCT FROM for NULLs</text>
</svg>`;

    case 'null-semantics-coalesce-nullif':
      return `${baseOpen('COALESCE Short-Circuit Evaluation and NULLIF Division-by-Zero Guard')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">NULL-Safe Arithmetic: COALESCE(a, b, 0) &amp; NULLIF(denominator, 0)</text>
  <rect x="20" y="50" width="345" height="168" rx="8" fill="var(--bg-subtle)" stroke="var(--accent)" stroke-width="1.3"/>
  <text x="34" y="74" fill="var(--accent)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">COALESCE(override_px, list_px, 0)</text>
  <text x="34" y="100" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8"> Evaluates left-to-right; stops at first</text>
  <text x="34" y="118" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8"> non-NULL argument (CASE short-circuit):</text>
  <text x="34" y="146" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">Row 1: (NULL,  4200, 0) ──► 4200</text>
  <text x="34" y="168" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">Row 2: (3500,  4200, 0) ──► 3500</text>
  <text x="34" y="190" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">Row 3: (NULL,  NULL, 0) ──► 0</text>

  <rect x="395" y="50" width="345" height="168" rx="8" fill="var(--bg-subtle)" stroke="var(--success)" stroke-width="1.3"/>
  <text x="409" y="74" fill="var(--success)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">revenue / NULLIF(sessions, 0)</text>
  <text x="409" y="100" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8">Turns 0 into NULL before division so</text>
  <text x="409" y="118" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8">queries never abort with 22012 error:</text>
  <text x="409" y="146" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">sessions = 25 ──► revenue / 25</text>
  <text x="409" y="168" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">sessions = 0  ──► revenue / NULL = NULL</text>
  <text x="409" y="190" fill="var(--success)" font-family="var(--font-mono)" font-size="9.5">Wrap outer COALESCE(..., 0.0) for 0.00</text>
</svg>`;

    case 'order-by-limit-offset-distinct':
      return `${baseOpen('Bounded Top-N Heapsort versus Deep OFFSET Scan Penalty')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Top-N Bounded Heapsort O(N log K) vs. Deep OFFSET Discard Cost</text>
  <rect x="20" y="48" width="345" height="170" rx="8" fill="var(--bg-subtle)" stroke="var(--success)" stroke-width="1.3"/>
  <text x="34" y="72" fill="var(--success)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">ORDER BY total DESC LIMIT 10</text>
  <text x="34" y="98" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8">• Maintains 10-row in-memory min-heap</text>
  <text x="34" y="118" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8">• Never spills 1M rows to temp disk</text>
  <text x="34" y="138" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8">• Always add tie-breaker: , order_id DESC</text>
  <text x="34" y="158" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">  for deterministic pagination!</text>

  <rect x="395" y="48" width="345" height="170" rx="8" fill="var(--bg-subtle)" stroke="var(--danger)" stroke-width="1.3"/>
  <text x="409" y="72" fill="var(--danger)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">LIMIT 10 OFFSET 500000 (Anti-Pattern)</text>
  <text x="409" y="98" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8">• Engine MUST fetch &amp; sort 500,010 rows</text>
  <text x="409" y="118" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8">• Discards 500,000 rows over the floor</text>
  <text x="409" y="138" fill="var(--success)" font-family="var(--font-mono)" font-size="9.8">Fix: Keyset Cursor WHERE (ts, id) &lt; (?, ?)</text>
  <text x="409" y="158" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">  seeks directly in O(log_B N)!</text>
</svg>`;

    case 'case-expressions-type-casting':
      return `${baseOpen('Sequential CASE WHEN Short-Circuit Evaluation and Type Precedence')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Searched CASE WHEN Evaluation Order &amp; Return-Type Unification</text>
  <rect x="20" y="52" width="220" height="156" rx="6" fill="var(--bg-subtle)" stroke="var(--accent)" stroke-width="1.3"/>
  <text x="32" y="76" fill="var(--accent)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">1. Ordered Branches</text>
  <text x="32" y="102" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">WHEN cents &gt;= 100000</text>
  <text x="32" y="120" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">WHEN cents &gt;= 25000</text>
  <text x="32" y="138" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">ELSE 'standard'</text>
  <text x="32" y="170" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9">Most specific condition FIRST!</text>

  <rect x="268" y="52" width="224" height="156" rx="6" fill="var(--bg-subtle)" stroke="var(--warning)" stroke-width="1.3"/>
  <text x="280" y="76" fill="var(--warning)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">2. Omitted ELSE = NULL</text>
  <text x="280" y="102" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">If no WHEN branch is TRUE</text>
  <text x="280" y="120" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">and ELSE is omitted, CASE</text>
  <text x="280" y="138" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">returns SQL NULL silently.</text>
  <text x="280" y="170" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9">Always declare explicit ELSE.</text>

  <rect x="520" y="52" width="220" height="156" rx="6" fill="var(--bg-subtle)" stroke="var(--success)" stroke-width="1.3"/>
  <text x="532" y="76" fill="var(--success)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">3. Explicit CAST(x AS T)</text>
  <text x="532" y="102" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">All THEN branches unify to</text>
  <text x="532" y="120" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">one catalog type; avoid</text>
  <text x="532" y="138" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.5">integer truncation (5/2=2):</text>
  <text x="532" y="170" fill="var(--success)" font-family="var(--font-mono)" font-size="9">CAST(x AS NUMERIC(12,2))</text>
</svg>`;

    case 'case-stripe-ledger-precision':
      return `${baseOpen('IEEE 754 Binary Float Drift versus Immutable BIGINT Cents Double-Entry Ledger')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Case Study: IEEE-754 FLOAT Drift vs. Integer Minor-Units Double-Entry Ledger</text>
  <rect x="20" y="48" width="340" height="170" rx="8" fill="var(--bg-subtle)" stroke="var(--danger)" stroke-width="1.3"/>
  <text x="34" y="72" fill="var(--danger)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">BROKEN: DOUBLE PRECISION / FLOAT</text>
  <text x="34" y="98" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8">0.1 + 0.2 = 0.30000000000000004</text>
  <text x="34" y="122" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Base-2 mantissa cannot represent 0.10</text>
  <text x="34" y="142" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• SUM() across 10M rows drifts by $$$$</text>
  <text x="34" y="162" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Fails audit reconciliation invariants</text>

  <rect x="392" y="48" width="348" height="170" rx="8" fill="var(--bg-subtle)" stroke="var(--success)" stroke-width="1.4"/>
  <text x="406" y="72" fill="var(--success)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">LEDGER GRADE: BIGINT CENTS / NUMERIC</text>
  <text x="406" y="98" fill="var(--fg)" font-family="var(--font-mono)" font-size="9.8">amount_cents BIGINT NOT NULL (+10500 / -10500)</text>
  <text x="406" y="122" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Exact CPU 64-bit integer addition</text>
  <text x="406" y="142" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">• Append-only entries (never UPDATE balance)</text>
  <text x="406" y="162" fill="var(--success)" font-family="var(--font-mono)" font-size="9.5">• Invariant: SUM(debit) - SUM(credit) = 0</text>
</svg>`;

    case 'build-sql-query-interpreter':
      return `${baseOpen('SQL Query Interpreter Architecture from Tokenizer to Volcano Iterator Tree')}
  <text x="20" y="26" fill="var(--fg)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Capstone Architecture: SQL Tokenizer → Parser AST → Binder → Volcano Pull Pipeline</text>
  ${[
    ['1. Lexer', 'SQL string → Tokens', 20],
    ['2. Parser', 'Recursive Descent AST', 202],
    ['3. Catalog Binder', 'Resolve cols & types', 384],
    ['4. Volcano Engine', 'open() · next() · close()', 566]
  ].map(([t, s, x], idx) => `
  <rect x="${x}" y="62" width="172" height="92" rx="6" fill="var(--bg-subtle)" stroke="${idx === 3 ? 'var(--accent)' : 'var(--border-strong)'}" stroke-width="1.4"/>
  <text x="${x + 12}" y="90" fill="${idx === 3 ? 'var(--accent)' : 'var(--fg)'}" font-family="var(--font-mono)" font-size="10.5" font-weight="700">${t}</text>
  <text x="${x + 12}" y="116" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="9.5">${s}</text>
  <text x="${x + 12}" y="138" fill="var(--fg)" font-family="var(--font-mono)" font-size="9">Zero row materialization</text>`).join('')}
  <rect x="20" y="172" width="718" height="44" rx="6" fill="var(--accent-subtle)" stroke="var(--accent)" stroke-width="1"/>
  <text x="32" y="199" fill="var(--fg)" font-family="var(--font-mono)" font-size="10">Pull Pipeline: Limit.next() → Sort.next() → Project.next() → Filter(3VL).next() → SeqScan.next()</text>
</svg>`;

    default:
      return null;
  }
}

function makeSvgThemeAware(svgHtml) {
  return svgHtml
    .replace(/style="background:var\(--bg-elevated\);border:1px solid var\(--border-subtle\);/g, 'style="background:var(--surface);border:1px solid var(--border);')
    .replace(/fill="var\(--fg-primary\)"/g, 'fill="var(--fg)"')
    .replace(/fill="#09090b"/gi, 'fill="var(--bg-subtle)"')
    .replace(/stroke="#27272a"/gi, 'stroke="var(--border)"')
    .replace(/stroke="#3f3f46"/gi, 'stroke="var(--border-strong)"')
    .replace(/stroke="#52525b"/gi, 'stroke="var(--fg-subtle)"')
    .replace(/fill="#e4e4e7"/gi, 'fill="var(--fg)"')
    .replace(/fill="#d1fae5"/gi, 'fill="var(--fg)"')
    .replace(/fill="#ecfdf5"/gi, 'fill="var(--fg)"')
    .replace(/fill="#bfdbfe"/gi, 'fill="var(--fg)"')
    .replace(/fill="#c7d2fe"/gi, 'fill="var(--accent)"')
    .replace(/fill="#93c5fd"/gi, 'fill="var(--accent)"')
    .replace(/fill="#60a5fa"/gi, 'fill="var(--accent)"')
    .replace(/fill="#6ee7b7"/gi, 'fill="var(--success)"')
    .replace(/fill="#fcd34d"/gi, 'fill="var(--warning)"')
    .replace(/fill="#fbbf24"/gi, 'fill="var(--warning)"')
    .replace(/fill="#fde68a"/gi, 'fill="var(--fg)"')
    .replace(/fill="#fca5a5"/gi, 'fill="var(--danger)"')
    .replace(/fill="#a1a1aa"/gi, 'fill="var(--fg-muted)"')
    .replace(/fill="#71717a"/gi, 'fill="var(--fg-muted)"')
    .replace(/stroke="#3b82f6"/gi, 'stroke="var(--accent)"')
    .replace(/stroke="#6366f1"/gi, 'stroke="var(--accent)"')
    .replace(/fill="#6366f1"/gi, 'fill="var(--accent)"')
    .replace(/stroke="#10b981"/gi, 'stroke="var(--success)"')
    .replace(/fill="#10b981"/gi, 'fill="var(--success)"')
    .replace(/stroke="#f59e0b"/gi, 'stroke="var(--warning)"');
}

// 1. Update data/topic_videos.json so only the 18 curated winners exist
const cleanTopicVideos = {};
for (const slug of UNIT_META.keys()) {
  if (CURATED_MODULE_VIDEOS[slug]) {
    cleanTopicVideos[slug] = {
      primary: CURATED_MODULE_VIDEOS[slug],
      companion: null
    };
  } else {
    cleanTopicVideos[slug] = {
      primary: null,
      companion: null
    };
  }
}
fs.writeFileSync(TOPIC_VIDEOS_FILE, JSON.stringify(cleanTopicVideos, null, 2) + '\n', 'utf8');

// 2. Process all 18 data/content/m01..m18.js files
const contentFiles = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.js')).sort();
let upgradedUnits = 0;
let curatedVideoCount = 0;

for (const file of contentFiles) {
  const fullPath = path.join(CONTENT_DIR, file);
  const src = fs.readFileSync(fullPath, 'utf8');
  const firstCommentLine = src.split('\n')[0] || `// SQL In Depth — ${file}`;

  const ctx = { window: { MODULE_CONTENT: {} } };
  vm.runInNewContext(src, ctx);
  const modId = Object.keys(ctx.window.MODULE_CONTENT)[0];
  const unitsObj = ctx.window.MODULE_CONTENT[modId];

  for (const [slug, u] of Object.entries(unitsObj)) {
    const meta = UNIT_META.get(slug);
    const rawSummary = meta?.summary || '';

    // a) Curate video: keep only the 18 authoritative module winners
    if (CURATED_MODULE_VIDEOS[slug]) {
      u.video = { ...CURATED_MODULE_VIDEOS[slug] };
      curatedVideoCount++;
    } else {
      delete u.video;
    }
    u.videos = [];

    // b) One-line promise
    u.promise = buildPromise(meta, u.title);

    // c) Fix comma-capital splice in `intuition`
    if (typeof u.intuition === 'string') {
      const cleanLead = buildCleanSummarySentence(`<strong>${u.title}</strong>`, slug, rawSummary);
      u.intuition = u.intuition.replace(
        /^<p>In <strong>[\s\S]*?<\/strong> \(<code>[^<]+<\/code>\),\s*[\s\S]*?\.\s*(?=When application engineers)/,
        `<p>${cleanLead} `
      );
      // Idempotency if already upgraded once
      if (!u.intuition.startsWith('<p><strong>') && u.intuition.includes('When application engineers')) {
        u.intuition = u.intuition.replace(
          /^<p>[\s\S]*?(?=When application engineers)/,
          `<p>${cleanLead} `
        );
      }
    }

    // d) Fix prose splices, headings, callouts, and SVG diagrams in `content`
    if (typeof u.content === 'string') {
      const cleanLogical = buildLogicalLayerSentence(rawSummary);
      u.content = u.content
        .replace(
          /At the logical layer,\s*[\s\S]*?\.\s*(?=Rather than mutating global variables)/,
          `${cleanLogical} `
        )
        .replace(
          /At the (?:logical and physical|execution) boundary,\s*[\s\S]*?\.\s*(?=Rather than mutating global variables)/,
          `${cleanLogical} `
        )
        .replace(/<h2>(?:1\.\s*)?First-Principles Mental Model &amp; Relational Mechanics<\/h2>/g, '<h2>Core Idea &amp; First-Principles Mechanics</h2>')
        .replace(/<h2>(?:2\.\s*)?Database Table Schema, Execution Pipeline &amp; Visual Architecture<\/h2>/g, '<h2>Visual Architecture &amp; Execution Pipeline</h2>')
        .replace(/<h2>(?:3\.\s*)?Interactive Table-Level &amp; Storage Engine Simulator<\/h2>/g, '<h2>Interactive Tuple &amp; Storage Simulator</h2>')
        .replace(/<h2>(?:4\.\s*)?Live WASM SQL Lab, Clause-by-Clause Visualizer &amp; Automated Test Checker<\/h2>/g, '<h2>Worked Runnable Example</h2>')
        .replace(/<h2>(?:5\.\s*)?Cross-Engine Dialect &amp; Cost Comparison Matrix<\/h2>/g, '<h2>Cross-Engine Tradeoffs</h2>')
        .replace(/<h2>(?:6\.\s*)?Live Verification, Catalog Introspection &amp; Execution Plan Lab \(SQL\)<\/h2>/g, '<h2>Edge-Case Verification Query</h2>')
        .replace(/<h2>(?:7\.\s*)?Production Failure Modes, Anti-Patterns &amp; Staff Tuning Checklist<\/h2>/g, '<h2>Common Mistakes &amp; Production Checklist</h2>')
        .replace(/class="callout callout-warning"/g, 'class="callout callout--warn"');

      // Replace M01 generic SVG with bespoke topic diagram, and make all other SVGs theme-aware
      const bespokeSvg = modId === 'm01' ? getM01Svg(slug, u.title) : null;
      if (bespokeSvg) {
        u.content = u.content.replace(/<svg class="concept-diagram"[\s\S]*?<\/svg>/, bespokeSvg);
      } else {
        u.content = u.content.replace(/<svg class="concept-diagram"[\s\S]*?<\/svg>/g, (m) => makeSvgThemeAware(m));
      }
    }

    // e) Clean up takeaway #1 colon splice if needed
    if (Array.isArray(u.keyTakeaways) && u.keyTakeaways.length > 0 && rawSummary) {
      u.keyTakeaways[0] = `${u.title}: ${rawSummary.charAt(0).toUpperCase() + rawSummary.slice(1).replace(/\.$/, '')}.`;
    }

    upgradedUnits++;
  }

  const serialized = `${firstCommentLine}\nwindow.MODULE_CONTENT = window.MODULE_CONTENT || {};\nwindow.MODULE_CONTENT[${JSON.stringify(modId)}] = ${JSON.stringify(unitsObj, null, 2)};\n`;
  fs.writeFileSync(fullPath, serialized, 'utf8');
}

console.log(`Upgraded ${upgradedUnits} curriculum units across ${contentFiles.length} modules; retained ${curatedVideoCount} curated reference lectures.`);
