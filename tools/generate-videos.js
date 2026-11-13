#!/usr/bin/env node
/**
 * SQL In Depth — Repeatable Flagship Video Pipeline (tools/generate-videos.js)
 *
 * Generates 5 original 1280x720 H.264/AAC explainer videos from bespoke HTML/SVG
 * architectural scenes, macOS `say` TTS narration, `ffprobe` exact timing,
 * `ffmpeg` encoding (`-movflags +faststart`), WebVTT `.vtt` captions, and
 * `cwebp` `.webp` poster images.
 *
 * Usage:
 *   node tools/generate-videos.js
 *
 * Outputs per flagship topic in assets/videos/:
 *   - <slug>.mp4          (1280x720 H.264 + AAC, faststart, ~250-550 KB)
 *   - <slug>-poster.webp  (1280x720 WebP poster, ~18-35 KB)
 *   - <slug>.vtt          (Synchronized WebVTT captions)
 * Plus metadata & transcripts in data/flagship_videos.json and attached to the
 * corresponding units in data/content/*.js.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'videos');
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sql-videos-'));

const FFMPEG = fs.existsSync('/opt/homebrew/Caskroom/miniconda/base/bin/ffmpeg')
  ? '/opt/homebrew/Caskroom/miniconda/base/bin/ffmpeg'
  : 'ffmpeg';
const FFPROBE = fs.existsSync('/opt/homebrew/Caskroom/miniconda/base/bin/ffprobe')
  ? '/opt/homebrew/Caskroom/miniconda/base/bin/ffprobe'
  : 'ffprobe';
const CWEBP = fs.existsSync('/opt/homebrew/bin/cwebp') ? '/opt/homebrew/bin/cwebp' : 'cwebp';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

fs.mkdirSync(OUT_DIR, { recursive: true });

const VIDEOS = [
  {
    slug: 'why-databases-exist',
    moduleFile: 'm01-relational-foundations.js',
    modId: 'm01',
    title: 'Why Databases Exist: Flat Files vs. ACID 8KB Pages',
    scenes: [
      {
        step: 'Scene 1 · The Flat-File Trap',
        heading: 'Why CSV & JSON Files Break in Production',
        narration: 'Why not store application data in a CSV or JSON file? Every lookup parses the entire file in linear O of N time, and two concurrent writers overwrite each other or leave torn lines if the process crashes.',
        diagram: `
          <div class="grid-2">
            <div class="panel panel--bad">
              <div class="tag tag--bad">orders.csv (Flat Byte Stream)</div>
              <div class="code-lines">
                <div>1001,aravind,completed,105000</div>
                <div>1002,elena,completed,42000</div>
                <div class="hl-bad">1003,marcus,pend███ [TORN WRITE!]</div>
                <div class="muted">... 2,400,000 more unindexed lines ...</div>
              </div>
              <div class="metric-row"><span class="bad-txt">Lookup: O(N) full scan</span><span>Crash safety: None</span></div>
            </div>
            <div class="panel">
              <div class="tag">3 Fatal Failure Modes</div>
              <ul class="clean-list">
                <li><strong>Linear I/O:</strong> Finding 1 order reads 100% of disk bytes.</li>
                <li><strong>Race Conditions:</strong> Concurrent appends corrupt byte offsets.</li>
                <li><strong>No Referential Rules:</strong> Orphaned customer IDs slip in silently.</li>
              </ul>
            </div>
          </div>`
      },
      {
        step: 'Scene 2 · Fixed 8KB Slotted Pages',
        heading: 'The Storage Engine Divides Disk into 8KB Slotted Pages',
        narration: 'A relational storage engine organizes files into fixed eight kilobyte slotted pages. Line pointers at the front grow forward while tuple bytes pack from the back, enabling direct slot addressing without rewriting the file.',
        diagram: `
          <div class="panel panel--accent">
            <div class="tag tag--accent">8KB Slotted Heap Page #42 (PostgreSQL / SQLite)</div>
            <div class="page-box">
              <div class="page-hdr">Page Header (LSN · Checksum · Lower/Upper Pointers)</div>
              <div class="slots-row">
                <span class="slot">Slot 1 → 8120</span>
                <span class="slot">Slot 2 → 8048</span>
                <span class="slot">Slot 3 → 7960</span>
                <span class="free-space">← Free Contiguous Space →</span>
              </div>
              <div class="tuples-row">
                <span class="tuple">[Tuple 3: id=1003, $950]</span>
                <span class="tuple">[Tuple 2: id=1002, $420]</span>
                <span class="tuple">[Tuple 1: id=1001, $1050]</span>
              </div>
            </div>
            <div class="metric-row"><span>Direct tuple pointer: <code>ctid = (42, 1)</code></span><span class="ok-txt">Buffer-pool cached in RAM</span></div>
          </div>`
      },
      {
        step: 'Scene 3 · ACID via WAL & MVCC',
        heading: 'Write-Ahead Logging & Multi-Version Snapshots',
        narration: 'Before mutating any data page, the engine flushes an append-only Write-Ahead Log record to disk. Readers inspect consistent MVCC tuple snapshots while writers commit atomically, guaranteeing durability across power loss.',
        diagram: `
          <div class="flow-3">
            <div class="flow-card">
              <div class="flow-num">1. WAL Flush</div>
              <div class="flow-title">Sequential Redo Log</div>
              <p>Append LSN <code>0/16B3748</code> and <code>fsync</code> in microseconds before dirty pages flush.</p>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-card flow-card--accent">
              <div class="flow-num">2. Buffer Pool</div>
              <div class="flow-title">8KB Page Cache</div>
              <p>Mutate in-memory page frame; background checkpointer batches random disk writes.</p>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-card flow-card--ok">
              <div class="flow-num">3. MVCC Readers</div>
              <div class="flow-title">Zero Read Locks</div>
              <p>Concurrent queries see committed snapshot versions without blocking transactions.</p>
            </div>
          </div>`
      },
      {
        step: 'Scene 4 · Physical Data Independence',
        heading: 'Codd’s Core Insight: Declare What, Not How',
        narration: 'Edgar Codd separated logical relations from physical storage. You write declarative SQL describing what rows you want, and the cost-based optimizer automatically chooses B-plus-tree seeks, hash joins, or parallel scans.',
        diagram: `
          <div class="grid-2">
            <div class="panel">
              <div class="tag tag--accent">Declarative SQL (What You Write)</div>
              <pre class="sql-box">SELECT c.name, SUM(o.total_cents) / 100.0 AS usd
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status = 'completed'
GROUP BY c.customer_id, c.name;</pre>
            </div>
            <div class="panel panel--ok">
              <div class="tag tag--ok">Physical Plan (Chosen by Optimizer)</div>
              <ul class="clean-list">
                <li><strong>Add an index tomorrow?</strong> SQL stays unchanged.</li>
                <li><strong>Partition across disks?</strong> SQL stays unchanged.</li>
                <li><strong>Cost-Based Planner:</strong> Picks <code>Index Seek + Hash Aggregate</code> automatically.</li>
              </ul>
            </div>
          </div>`
      }
    ]
  },
  {
    slug: 'select-projection-aliases',
    moduleFile: 'm01-relational-foundations.js',
    modId: 'm01',
    title: 'SQL Logical Execution Order vs. Written Syntax Order',
    scenes: [
      {
        step: 'Scene 1 · The Syntax Illusion',
        heading: 'SQL Is Written Top-to-Bottom, But Never Runs Start-to-Finish',
        narration: 'Every SQL query begins with the word SELECT, tricking engineers into thinking column aliases exist right away. In reality, the database binder evaluates FROM and WHERE long before SELECT ever runs.',
        diagram: `
          <div class="grid-2">
            <div class="panel panel--bad">
              <div class="tag tag--bad">Written Lexical Order</div>
              <div class="step-pill">1. SELECT total_cents / 100.0 AS usd</div>
              <div class="step-pill">2. FROM orders</div>
              <div class="step-pill hl-bad">3. WHERE usd &gt; 500  -- ERROR: no column "usd"!</div>
              <div class="step-pill">4. ORDER BY usd DESC</div>
            </div>
            <div class="panel panel--accent">
              <div class="tag tag--accent">True Logical Binding Order</div>
              <div class="step-pill">1. FROM orders (Load source relation)</div>
              <div class="step-pill">2. WHERE total_cents &gt; 50000 (Filter rows)</div>
              <div class="step-pill hl-ok">3. SELECT ... AS usd (Aliases born here!)</div>
              <div class="step-pill">4. ORDER BY usd DESC (Aliases visible!)</div>
            </div>
          </div>`
      },
      {
        step: 'Scene 2 · Stages 1 to 4 (Row & Group Filtering)',
        heading: 'FROM → JOIN → WHERE → GROUP BY → HAVING',
        narration: 'First, FROM and JOIN assemble candidate rows. Second, WHERE discards rows where predicates are false or unknown. Third, GROUP BY buckets surviving rows, and fourth, HAVING filters whole buckets.',
        diagram: `
          <div class="pipeline-strip">
            <div class="pipe-node"><span class="num">01</span><strong>FROM / JOIN</strong><small>8 raw rows</small></div>
            <div class="pipe-arr">→</div>
            <div class="pipe-node"><span class="num">02</span><strong>WHERE</strong><small>5 completed rows</small></div>
            <div class="pipe-arr">→</div>
            <div class="pipe-node"><span class="num">03</span><strong>GROUP BY</strong><small>3 customer buckets</small></div>
            <div class="pipe-arr">→</div>
            <div class="pipe-node pipe-node--accent"><span class="num">04</span><strong>HAVING</strong><small>2 high-spend groups</small></div>
          </div>
          <div class="note-banner">Only base table columns exist in Stages 01–04. Projected SELECT aliases have not been bound yet.</div>`
      },
      {
        step: 'Scene 3 · Stages 5 to 7 (Window, Projection & Sort)',
        heading: 'WINDOW → SELECT Projection → DISTINCT → ORDER BY → LIMIT',
        narration: 'Window functions execute after HAVING, right alongside SELECT projection where output aliases are finally bound. That is why ORDER BY can sort by a SELECT alias, while WHERE and HAVING cannot.',
        diagram: `
          <div class="pipeline-strip">
            <div class="pipe-node pipe-node--accent"><span class="num">05</span><strong>WINDOW &amp; SELECT</strong><small>Bind alias <code>usd</code></small></div>
            <div class="pipe-arr">→</div>
            <div class="pipe-node"><span class="num">06</span><strong>DISTINCT</strong><small>Deduplicate output</small></div>
            <div class="pipe-arr">→</div>
            <div class="pipe-node pipe-node--ok"><span class="num">07</span><strong>ORDER BY usd</strong><small>Alias in scope!</small></div>
            <div class="pipe-arr">→</div>
            <div class="pipe-node"><span class="num">08</span><strong>LIMIT 10</strong><small>Slice top K rows</small></div>
          </div>
          <div class="note-banner">Need to filter on a computed expression or window rank cleanly? Wrap it in a CTE (<code>WITH ranked AS (...)</code>).</div>`
      },
      {
        step: 'Scene 4 · Logical Order vs. Physical Pushdown',
        heading: 'The Optimizer Reorders Execution Only When Results Stay Identical',
        narration: 'Logical order defines exact query meaning, while the physical planner takes safe shortcuts—like pushing a WHERE predicate into a B-plus-tree index seek before joining, without ever changing your answer.',
        diagram: `
          <div class="grid-2">
            <div class="panel">
              <div class="tag">Logical Contract</div>
              <p style="font-size:20px;line-height:1.5;">Guarantees deterministic scoping for aliases, aggregates, <code>NULL</code> semantics, and outer joins.</p>
            </div>
            <div class="panel panel--ok">
              <div class="tag tag--ok">Physical Shortcut (Safe Rewrite)</div>
              <p style="font-size:20px;line-height:1.5;">Pushes <code>WHERE status = 'completed'</code> down to an <code>Index Scan</code> before probing the join hash table.</p>
            </div>
          </div>`
      }
    ]
  },
  {
    slug: 'inner-join-equi-joins',
    moduleFile: 'm03-relational-algebra-joins.js',
    modId: 'm03',
    title: 'Equi-Joins Under the Hood: Hash Build, Probe & Fan-Out',
    scenes: [
      {
        step: 'Scene 1 · Relational Key Matching',
        heading: 'How INNER JOIN Pairs Parent and Child Tuples',
        narration: 'An inner equi-join pairs rows from two tables wherever their join keys test equal. Unmatched parent rows and NULL join keys evaluate to unknown under three-valued logic and are excluded from the output.',
        diagram: `
          <div class="grid-2">
            <div class="panel">
              <div class="tag tag--accent">customers (PK customer_id)</div>
              <div class="code-lines">
                <div class="hl-ok">id=1 · Aravind (Enterprise)</div>
                <div class="hl-ok">id=2 · Elena   (Pro)</div>
                <div class="muted">id=7 · Chloe   (0 orders → dropped)</div>
              </div>
            </div>
            <div class="panel">
              <div class="tag tag--ok">orders (FK customer_id)</div>
              <div class="code-lines">
                <div class="hl-ok">ord=1001 · cust_id=1 · $1,050</div>
                <div class="hl-ok">ord=1003 · cust_id=1 · $950</div>
                <div class="hl-ok">ord=1002 · cust_id=2 · $420</div>
              </div>
            </div>
          </div>`
      },
      {
        step: 'Scene 2 · Physical Hash Join Pipeline',
        heading: 'Hash Build on the Smaller Table, Stream Probe on the Larger',
        narration: 'For large unindexed joins, the engine builds an in-memory hash table on the smaller relation in O of M time, then streams the larger table through in O of N time, probing each key in constant time.',
        diagram: `
          <div class="flow-3">
            <div class="flow-card">
              <div class="flow-num">Phase 1 · Build</div>
              <div class="flow-title">Hash Smaller Input</div>
              <p><code>hash(customer_id)</code> buckets 1,000 customers inside <code>work_mem</code>.</p>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-card flow-card--accent">
              <div class="flow-num">Phase 2 · Probe</div>
              <div class="flow-title">Stream Orders</div>
              <p>Scan <code>orders</code> once; probe hash bucket in <code>O(1)</code> per row.</p>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-card flow-card--ok">
              <div class="flow-num">Total Cost</div>
              <div class="flow-title">O(M + N) Linear</div>
              <p>Avoids quadratic <code>O(M × N)</code> nested-loop scans.</p>
            </div>
          </div>`
      },
      {
        step: 'Scene 3 · The 1:N Fan-Out Trap',
        heading: 'Joining Two Child Tables Multiplies Row Cardinality',
        narration: 'Watch out for join fan-out! If an order has three line items and two payment attempts, joining both child tables directly produces six rows for one order, silently doubling or tripling your SUM totals.',
        diagram: `
          <div class="panel panel--bad">
            <div class="tag tag--bad">Chasm Fan-Out: 1 Order × 3 Items × 2 Payments = 6 Rows!</div>
            <div class="code-lines">
              <div>Order #1001 ($1,050) ──► 3 order_items rows × 2 payments rows</div>
              <div class="hl-bad">SUM(o.total_cents) inflates $1,050 into $6,300 (6× overcount!)</div>
            </div>
          </div>`
      },
      {
        step: 'Scene 4 · Pre-Aggregate Before Joining',
        heading: 'Fix Fan-Out by Aggregating Each 1:N Relation to 1:1 First',
        narration: 'Eliminate fan-out by grouping each child table to the shared parent key inside a CTE before joining. When both sides have one row per order ID, every aggregate stays one hundred percent exact.',
        diagram: `
          <div class="panel panel--ok">
            <div class="tag tag--ok">Fan-Out-Safe Pattern (1:1 Grain Alignment)</div>
            <pre class="sql-box">WITH item_totals AS (
  SELECT order_id, SUM(quantity * unit_price_cents) AS items_cents
  FROM order_items GROUP BY order_id
)
SELECT o.order_id, o.total_cents, i.items_cents
FROM orders o JOIN item_totals i ON i.order_id = o.order_id;</pre>
          </div>`
      }
    ]
  },
  {
    slug: 'btree-bplustree-internal-anatomy',
    moduleFile: 'm10-btree-indexing-mechanics.js',
    modId: 'm10',
    title: 'Inside a B+Tree: Fanout 500, Routing Keys & Leaf Scans',
    scenes: [
      {
        step: 'Scene 1 · Why Binary Trees Fail on Disk',
        heading: 'High Page Fanout Collapses Tree Height from 20 to 3',
        narration: 'A balanced binary tree over ten million rows is twenty-four levels deep, costing twenty-four slow random disk seeks. A B-plus-tree packs five hundred routing keys into each eight kilobyte internal page, shrinking height to just three!',
        diagram: `
          <div class="grid-2">
            <div class="panel panel--bad">
              <div class="tag tag--bad">Binary Search Tree (Fanout = 2)</div>
              <div class="big-stat bad-txt">24 Levels Deep</div>
              <p style="font-size:19px;">10,000,000 rows → <code>log2(10M) ≈ 24</code> pointer chases across scattered memory/disk locations.</p>
            </div>
            <div class="panel panel--ok">
              <div class="tag tag--ok">8KB B+Tree Index (Fanout ≈ 500)</div>
              <div class="big-stat ok-txt">3 Levels Deep</div>
              <p style="font-size:19px;"><code>500³ = 125,000,000</code> keys reachable in just <strong>3 page reads</strong> (Root &amp; Level 1 stay pinned in RAM!).</p>
            </div>
          </div>`
      },
      {
        step: 'Scene 2 · B-Tree vs. B+Tree Key Separation',
        heading: 'Internal Pages Hold Only Separator Keys; Leaves Hold Tuple Pointers',
        narration: 'Unlike a classic B-tree, a B-plus-tree never stores bulky row payloads in internal nodes. Internal pages hold only compact separator keys and child page IDs, maximizing fanout on every upper level.',
        diagram: `
          <div class="panel panel--accent">
            <div class="tag tag--accent">Root Page #1 (Separator Keys Only → Maximum Fanout)</div>
            <div class="slots-row" style="justify-content:center;gap:24px;">
              <span class="slot">[ k &lt; 1040 → Page #12 ]</span>
              <span class="slot">[ 1040 ≤ k &lt; 2080 → Page #13 ]</span>
              <span class="slot">[ k ≥ 2080 → Page #14 ]</span>
            </div>
            <div class="tuples-row" style="margin-top:18px;">
              <span class="tuple">Leaf #12: (1001→ctid 0,1) ↔</span>
              <span class="tuple">Leaf #13: (1042→ctid 4,8) ↔</span>
              <span class="tuple">Leaf #14: (2090→ctid 9,2)</span>
            </div>
          </div>`
      },
      {
        step: 'Scene 3 · Doubly-Linked Leaf Range Scans',
        heading: 'Seek Once from the Root, Then Walk Sibling Leaf Pointers',
        narration: 'Every leaf page stores forward and backward sibling page pointers. To evaluate a range predicate like created-at between January and March, the engine descends from the root once and glides horizontally across sorted leaves.',
        diagram: `
          <div class="flow-3">
            <div class="flow-card flow-card--accent">
              <div class="flow-num">Step 1 · Root Seek</div>
              <div class="flow-title">Binary Search Page</div>
              <p>Descend Root → Internal → First matching key <code>2025-01-01</code>.</p>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-card flow-card--ok">
              <div class="flow-num">Step 2 · Leaf Walk</div>
              <div class="flow-title">Follow next_page</div>
              <p>Scan Leaf #14 → Leaf #15 sequentially without revisiting upper nodes.</p>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-card">
              <div class="flow-num">Step 3 · Stop Early</div>
              <div class="flow-title">Boundary Hit</div>
              <p>Halt immediately at first key <code>&gt;= 2025-04-01</code>.</p>
            </div>
          </div>`
      },
      {
        step: 'Scene 4 · Page Splits & UUIDv7 Locality',
        heading: 'Sequential Keys Append Cleanly; Random UUIDv4 Splits Mid-Tree Pages',
        narration: 'When a leaf page fills up, inserting a random UUIDv4 splits the page fifty-fifty and dirties buffers across the entire tree. Time-ordered BIGINT or UUIDv7 keys append cleanly to the rightmost leaf page.',
        diagram: `
          <div class="grid-2">
            <div class="panel panel--bad">
              <div class="tag tag--bad">Random UUIDv4 Inserts</div>
              <p style="font-size:19px;">Hits cold middle leaf pages → frequent 50/50 page splits, ~65% page fill, heavy WAL write amplification.</p>
            </div>
            <div class="panel panel--ok">
              <div class="tag tag--ok">IDENTITY / UUIDv7 Inserts</div>
              <p style="font-size:19px;">Monotonic timestamp prefix always targets the hot rightmost leaf page in RAM → ~95% fill &amp; sequential I/O.</p>
            </div>
          </div>`
      }
    ]
  },
  {
    slug: 'multi-version-concurrency-control-mvcc',
    moduleFile: 'm14-locking-mvcc-vacuum.js',
    modId: 'm14',
    title: 'MVCC Snapshot Isolation: Tuple xmin/xmax Without Read Locks',
    scenes: [
      {
        step: 'Scene 1 · Readers Never Block Writers',
        heading: 'Why Modern Databases Version Rows Instead of Locking Readers',
        narration: 'If a dashboard query locked an entire orders table while computing revenue, checkout writes would grind to a halt. Multi-Version Concurrency Control solves this by keeping multiple timestamped versions of a row.',
        diagram: `
          <div class="grid-2">
            <div class="panel panel--bad">
              <div class="tag tag--bad">Naive Read/Write Locks</div>
              <p style="font-size:19px;">Long analytical <code>SELECT</code> holds shared locks → blocks incoming <code>UPDATE</code> checkout requests.</p>
            </div>
            <div class="panel panel--ok">
              <div class="tag tag--ok">MVCC Golden Rule</div>
              <p style="font-size:19px;"><strong>Readers never block writers, and writers never block readers.</strong> Each query views a consistent point-in-time snapshot.</p>
            </div>
          </div>`
      },
      {
        step: 'Scene 2 · Tuple Header xmin & xmax',
        heading: 'Every UPDATE Writes a New Tuple Version and Marks xmax on the Old',
        narration: 'In PostgreSQL, updating a balance from one hundred to eighty dollars does not overwrite bytes in place. Transaction five-oh-two stamps xmax equal to five-oh-two on the old tuple and appends a fresh tuple with xmin five-oh-two.',
        diagram: `
          <div class="panel panel--accent">
            <div class="tag tag--accent">Physical Heap Version Chain (UPDATE accounts SET bal = 80 WHERE id = 1)</div>
            <div class="grid-2" style="margin-top:12px;">
              <div class="tuple-card">
                <div class="muted">Version 1 · ctid (0, 1)</div>
                <div><code>xmin = 500</code> · <code class="bad-txt">xmax = 502</code></div>
                <div style="font-size:22px;font-weight:700;margin-top:6px;">balance = $100</div>
              </div>
              <div class="tuple-card tuple-card--new">
                <div class="ok-txt">Version 2 · ctid (0, 2)</div>
                <div><code class="ok-txt">xmin = 502</code> · <code>xmax = 0 (live)</code></div>
                <div style="font-size:22px;font-weight:700;margin-top:6px;">balance = $80</div>
              </div>
            </div>
          </div>`
      },
      {
        step: 'Scene 3 · Snapshot Visibility Check',
        heading: 'Your Transaction Snapshot Decides Which Version Is Visible',
        narration: 'When transaction five-oh-one started before five-oh-two committed, its snapshot treats five-oh-two as still in flight. Five-oh-one cleanly reads Version One at one hundred dollars, with zero lock contention.',
        diagram: `
          <div class="flow-3">
            <div class="flow-card">
              <div class="flow-num">Reader txid = 501</div>
              <div class="flow-title">Snapshot [500..502)</div>
              <p>Tx 502 was uncommitted when snapshot was taken → reads <strong>Version 1 ($100)</strong>.</p>
            </div>
            <div class="flow-arrow">∥</div>
            <div class="flow-card flow-card--ok">
              <div class="flow-num">Reader txid = 505</div>
              <div class="flow-title">Snapshot [500..505)</div>
              <p>Tx 502 is committed &lt; xmin horizon → reads <strong>Version 2 ($80)</strong>.</p>
            </div>
          </div>`
      },
      {
        step: 'Scene 4 · Dead Tuples & Autovacuum',
        heading: 'Once No Active Snapshot Needs Version 1, Autovacuum Reclaims Space',
        narration: 'Version chains are not free. Once every transaction older than five-oh-two finishes, Version One becomes a dead tuple. Background autovacuum workers reclaim those dead slots so heap pages do not bloat.',
        diagram: `
          <div class="panel panel--ok">
            <div class="tag tag--ok">MVCC Hygiene Lifecycle</div>
            <div class="pipeline-strip" style="margin-top:14px;">
              <div class="pipe-node"><strong>UPDATE / DELETE</strong><small>Leaves dead version</small></div>
              <div class="pipe-arr">→</div>
              <div class="pipe-node"><strong>Oldest Horizon Moves</strong><small>No reader sees V1</small></div>
              <div class="pipe-arr">→</div>
              <div class="pipe-node pipe-node--ok"><strong>AUTOVACUUM</strong><small>Frees slot &amp; Visibility Map</small></div>
            </div>
          </div>`
      }
    ]
  }
];

function buildSlideHtml(videoTitle, scene, idx, total) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1280px;
    height: 720px;
    overflow: hidden;
    background: #0B0F17;
    color: #F1F5F9;
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
    padding: 48px 56px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #1E293B;
    padding-bottom: 18px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 700;
    color: #94A3B8;
    letter-spacing: 0.02em;
  }
  .brand-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background: #3B82F6;
  }
  .step-badge {
    font-family: "JetBrains Mono", "SFMono-Regular", Menlo, monospace;
    font-size: 15px;
    color: #60A5FA;
    background: rgba(59, 130, 246, 0.14);
    border: 1px solid rgba(96, 165, 250, 0.35);
    padding: 6px 14px;
    border-radius: 999px;
  }
  h1 {
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #F8FAFC;
    margin-top: 20px;
    line-height: 1.2;
  }
  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 18px;
    margin: 22px 0;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .panel {
    background: #111827;
    border: 1px solid #263244;
    border-radius: 14px;
    padding: 26px 28px;
  }
  .panel--accent { border-color: #3B82F6; background: #0F1A2E; }
  .panel--ok { border-color: #10B981; background: #0D1F1B; }
  .panel--bad { border-color: #EF4444; background: #1F1218; }
  .tag {
    display: inline-block;
    font-family: "JetBrains Mono", Menlo, monospace;
    font-size: 14px;
    font-weight: 700;
    color: #CBD5E1;
    background: #1E293B;
    padding: 5px 11px;
    border-radius: 6px;
    margin-bottom: 16px;
  }
  .tag--accent { color: #93C5FD; background: rgba(59, 130, 246, 0.2); }
  .tag--ok { color: #6EE7B7; background: rgba(16, 185, 129, 0.2); }
  .tag--bad { color: #FCA5A5; background: rgba(239, 68, 68, 0.2); }
  .code-lines {
    font-family: "JetBrains Mono", Menlo, monospace;
    font-size: 17px;
    line-height: 1.85;
    color: #E2E8F0;
  }
  .hl-bad { color: #FCA5A5; background: rgba(239, 68, 68, 0.16); padding: 2px 8px; border-radius: 5px; }
  .hl-ok { color: #6EE7B7; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 5px; margin-bottom: 4px; }
  .muted { color: #94A3B8; }
  .bad-txt { color: #F87171; font-weight: 700; }
  .ok-txt { color: #34D399; font-weight: 700; }
  .clean-list { list-style: none; display: flex; flex-direction: column; gap: 14px; font-size: 19px; line-height: 1.45; color: #E2E8F0; }
  .clean-list strong { color: #F8FAFC; }
  .metric-row {
    display: flex;
    justify-content: space-between;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid rgba(148, 163, 184, 0.2);
    font-family: "JetBrains Mono", Menlo, monospace;
    font-size: 15px;
    color: #CBD5E1;
  }
  .page-box {
    border: 1.5px solid #3B82F6;
    border-radius: 10px;
    padding: 18px;
    background: #0B1120;
    font-family: "JetBrains Mono", Menlo, monospace;
  }
  .page-hdr {
    background: rgba(59, 130, 246, 0.2);
    color: #93C5FD;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 14px;
  }
  .slots-row, .tuples-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .slot {
    background: #1E293B;
    border: 1px solid #475569;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 15px;
    color: #F8FAFC;
  }
  .free-space { color: #64748B; font-size: 15px; margin-left: auto; }
  .tuples-row { margin-top: 14px; justify-content: flex-end; }
  .tuple {
    background: rgba(16, 185, 129, 0.16);
    border: 1px solid rgba(52, 211, 153, 0.45);
    color: #D1FAE5;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 15px;
  }
  .flow-3 {
    display: flex;
    align-items: stretch;
    gap: 18px;
  }
  .flow-card {
    flex: 1;
    background: #111827;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 26px;
  }
  .flow-card--accent { border-color: #3B82F6; background: #0F1A2E; }
  .flow-card--ok { border-color: #10B981; background: #0D1F1B; }
  .flow-num { font-family: "JetBrains Mono", Menlo, monospace; font-size: 14px; color: #60A5FA; font-weight: 700; margin-bottom: 8px; }
  .flow-title { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #F8FAFC; }
  .flow-card p { font-size: 18px; line-height: 1.5; color: #CBD5E1; }
  .flow-arrow { display: flex; align-items: center; font-size: 32px; color: #60A5FA; font-weight: 700; }
  .sql-box {
    font-family: "JetBrains Mono", Menlo, monospace;
    font-size: 17px;
    line-height: 1.65;
    color: #E2E8F0;
    background: #090D16;
    border: 1px solid #1E293B;
    border-radius: 10px;
    padding: 18px;
    white-space: pre-wrap;
  }
  .step-pill {
    font-family: "JetBrains Mono", Menlo, monospace;
    font-size: 16px;
    padding: 10px 14px;
    border-radius: 8px;
    background: #0B1120;
    border: 1px solid #1E293B;
    margin-bottom: 10px;
  }
  .pipeline-strip {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .pipe-node {
    flex: 1;
    background: #111827;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 22px 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .pipe-node--accent { border-color: #3B82F6; background: #0F1A2E; }
  .pipe-node--ok { border-color: #10B981; background: #0D1F1B; }
  .pipe-node .num { font-family: "JetBrains Mono", Menlo, monospace; font-size: 13px; color: #60A5FA; font-weight: 700; }
  .pipe-node strong { font-size: 20px; color: #F8FAFC; }
  .pipe-node small { font-size: 15px; color: #94A3B8; }
  .pipe-arr { font-size: 28px; color: #60A5FA; font-weight: 700; }
  .note-banner {
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.35);
    border-radius: 10px;
    padding: 16px 20px;
    font-size: 18px;
    color: #E2E8F0;
  }
  .big-stat { font-size: 42px; font-weight: 800; margin: 6px 0 12px; font-family: "JetBrains Mono", Menlo, monospace; }
  .tuple-card {
    background: #0B1120;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 18px;
    font-family: "JetBrains Mono", Menlo, monospace;
    font-size: 16px;
    line-height: 1.6;
  }
  .tuple-card--new { border-color: #10B981; background: rgba(16, 185, 129, 0.1); }
  code {
    font-family: "JetBrains Mono", Menlo, monospace;
    background: rgba(148, 163, 184, 0.16);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.92em;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #1E293B;
    padding-top: 16px;
    color: #94A3B8;
    font-size: 15px;
  }
  .dots { display: flex; gap: 8px; }
  .dot { width: 28px; height: 6px; border-radius: 999px; background: #1E293B; }
  .dot.is-active { background: #3B82F6; }
</style>
</head>
<body>
  <div>
    <div class="top">
      <div class="brand"><span class="brand-dot"></span><span>SQL IN DEPTH · VISUAL INTERNALS</span></div>
      <div class="step-badge">${scene.step} (${idx + 1}/${total})</div>
    </div>
    <h1>${scene.heading}</h1>
  </div>
  <div class="stage">${scene.diagram}</div>
  <div class="footer">
    <span>${videoTitle}</span>
    <div class="dots">${Array.from({ length: total }, (_, i) => `<span class="dot${i === idx ? ' is-active' : ''}"></span>`).join('')}</div>
    <span style="font-family:monospace;color:#60A5FA;">sql-in-depth.vedgupta.in</span>
  </div>
</body>
</html>`;
}

function formatVttTime(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const rem = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(rem).padStart(3, '0')}`;
}

function formatDurationBadge(seconds) {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function probeDuration(audioFile) {
  const out = execFileSync(FFPROBE, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    audioFile
  ], { encoding: 'utf8' }).trim();
  return Math.max(2.0, parseFloat(out) || 6.0);
}

function screenshotHtml(htmlPath, pngPath) {
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    '--window-size=1280,720',
    `--screenshot=${pngPath}`,
    `file://${htmlPath}`
  ], { stdio: 'ignore' });
}

const registry = {};

for (const vid of VIDEOS) {
  console.log(`▶ Generating flagship video: ${vid.slug}...`);
  const sceneFiles = [];
  const vttLines = ['WEBVTT', ''];
  const chapters = [];
  let cursor = 0;
  const PAUSE_SEC = 0.4;

  for (let i = 0; i < vid.scenes.length; i++) {
    const scene = vid.scenes[i];
    const htmlFile = path.join(TMP_DIR, `${vid.slug}-s${i}.html`);
    const pngFile = path.join(TMP_DIR, `${vid.slug}-s${i}.png`);
    const aiffFile = path.join(TMP_DIR, `${vid.slug}-s${i}.aiff`);
    const paddedWav = path.join(TMP_DIR, `${vid.slug}-s${i}.wav`);
    const segMp4 = path.join(TMP_DIR, `${vid.slug}-s${i}.mp4`);

    fs.writeFileSync(htmlFile, buildSlideHtml(vid.title, scene, i, vid.scenes.length), 'utf8');
    screenshotHtml(htmlFile, pngFile);

    // Synthesize crisp offline TTS narration via macOS `say`
    execFileSync('/usr/bin/say', ['-v', 'Samantha', '-r', '180', '-o', aiffFile, scene.narration]);
    const rawDur = probeDuration(aiffFile);
    const segDur = Number((rawDur + PAUSE_SEC).toFixed(3));

    // Convert audio to uniform 22050Hz mono WAV with 0.4s trailing breath pad
    execFileSync(FFMPEG, [
      '-y', '-i', aiffFile,
      '-af', `apad=pad_dur=${PAUSE_SEC}`,
      '-ar', '22050', '-ac', '1',
      paddedWav
    ], { stdio: 'ignore' });

    // Render crisp 24fps H.264 segment for this scene
    execFileSync(FFMPEG, [
      '-y',
      '-loop', '1', '-framerate', '24', '-i', pngFile,
      '-i', paddedWav,
      '-c:v', 'libx264', '-preset', 'slow', '-tune', 'stillimage',
      '-crf', '26', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '64k', '-ar', '22050',
      '-t', String(segDur),
      '-shortest',
      segMp4
    ], { stdio: 'ignore' });

    const startSec = cursor;
    const endSec = Number((cursor + segDur).toFixed(3));
    vttLines.push(`${i + 1}`);
    vttLines.push(`${formatVttTime(startSec)} --> ${formatVttTime(endSec)}`);
    vttLines.push(scene.narration);
    vttLines.push('');

    chapters.push({
      step: scene.step,
      heading: scene.heading,
      start: formatDurationBadge(startSec),
      text: scene.narration
    });

    sceneFiles.push({ pngFile, segMp4 });
    cursor = endSec;
  }

  // Concatenate all 4 scene MP4 segments with faststart MOOV atom
  const concatList = path.join(TMP_DIR, `${vid.slug}-concat.txt`);
  fs.writeFileSync(concatList, sceneFiles.map(s => `file '${s.segMp4}'`).join('\n'), 'utf8');

  const outMp4 = path.join(OUT_DIR, `${vid.slug}.mp4`);
  const outPoster = path.join(OUT_DIR, `${vid.slug}-poster.webp`);
  const outVtt = path.join(OUT_DIR, `${vid.slug}.vtt`);

  execFileSync(FFMPEG, [
    '-y', '-f', 'concat', '-safe', '0', '-i', concatList,
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'stillimage',
    '-crf', '26', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '64k',
    '-movflags', '+faststart',
    outMp4
  ], { stdio: 'ignore' });

  // Poster from Scene 1 PNG encoded to compact WebP
  execFileSync(CWEBP, ['-q', '84', sceneFiles[0].pngFile, '-o', outPoster], { stdio: 'ignore' });
  fs.writeFileSync(outVtt, vttLines.join('\n'), 'utf8');

  const mp4Bytes = fs.statSync(outMp4).size;
  const posterBytes = fs.statSync(outPoster).size;
  console.log(`  ✓ ${vid.slug}.mp4 (${(mp4Bytes / 1024).toFixed(1)} KB, ${formatDurationBadge(cursor)}) + poster (${(posterBytes / 1024).toFixed(1)} KB) + .vtt`);

  const meta = {
    slug: vid.slug,
    title: vid.title,
    src: `/assets/videos/${vid.slug}.mp4`,
    poster: `/assets/videos/${vid.slug}-poster.webp`,
    captions: `/assets/videos/${vid.slug}.vtt`,
    duration: formatDurationBadge(cursor),
    durationSeconds: Math.round(cursor),
    width: 1280,
    height: 720,
    chapters,
    transcript: vid.scenes.map(s => s.narration).join(' ')
  };
  registry[vid.slug] = meta;

  // Attach `flagshipVideo` directly to the unit inside data/content/<moduleFile>
  const modPath = path.join(ROOT, 'data', 'content', vid.moduleFile);
  const modSrc = fs.readFileSync(modPath, 'utf8');
  const firstComment = modSrc.split('\n')[0];
  const ctx = { window: { MODULE_CONTENT: {} } };
  vm.runInNewContext(modSrc, ctx);
  const units = ctx.window.MODULE_CONTENT[vid.modId];
  if (units && units[vid.slug]) {
    units[vid.slug].flagshipVideo = meta;
    const outJs = `${firstComment}\nwindow.MODULE_CONTENT = window.MODULE_CONTENT || {};\nwindow.MODULE_CONTENT[${JSON.stringify(vid.modId)}] = ${JSON.stringify(units, null, 2)};\n`;
    fs.writeFileSync(modPath, outJs, 'utf8');
  }
}

fs.writeFileSync(path.join(ROOT, 'data', 'flagship_videos.json'), JSON.stringify(registry, null, 2) + '\n', 'utf8');
fs.rmSync(TMP_DIR, { recursive: true, force: true });
console.log(`\nFlagship video generation complete (${Object.keys(registry).length} videos written to assets/videos/).`);
