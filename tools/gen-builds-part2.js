'use strict';

module.exports = [
  {
    id: 'build-btree-index-advisor',
    title: 'B+Tree Page Simulator & Automated Workload Index Advisor',
    category: 'B+Trees & Indexing Architecture',
    difficulty: 'Advanced',
    estimatedMinutes: 45,
    pinned: true,
    summary: 'An in-memory B+Tree index simulator with doubly linked leaf sibling pointers for range scans and an automated workload index advisor applying the Equality -> Sort -> Range + INCLUDE covering rule.',
    highlights: [
      'B+Tree leaf node splits with upward separator key promotion and sibling leaf pointer linking',
      'O(log_B N + K) range scan traversal walking leaf next pointers without re-descending internal nodes',
      'Automated composite index synthesis ordering Equality -> ORDER BY -> Range columns with INCLUDE payload'
    ],
    tags: ['B+Tree', 'Composite Index', 'ESR Rule', 'Covering Index', 'Range Scan'],
    relatedSlugs: ['why-indexes-work-io-cost-model', 'btree-bplustree-internal-anatomy', 'clustered-vs-secondary-indexes', 'composite-indexes-leftmost-prefix', 'covering-indexes-index-only-scans'],
    className: 'BPlusTreeIndexAdvisor',
    steps: [
      {
        title: 'Step 1: B+Tree Sorted Leaf Insertion & Midpoint Split',
        concept: 'Splitting Overflowing Leaf Pages and Linking Sibling Pointers',
        targetSymbol: 'BPlusTreeIndexAdvisor.insertKey',
        hint: 'Insert { key, rowId } in sorted order; when leaf exceeds maxKeys, split at mid and link left.next = right.',
        explanation: 'Implement `insertKey(key, rowId)` to insert into the appropriate sorted leaf page and split any leaf exceeding `this.maxKeys`, linking `leftLeaf.next = rightLeaf`.'
      },
      {
        title: 'Step 2: Leaf-Chain Range Scan Traversal',
        concept: 'Point-Seek to Lower Bound Followed by Sequential Leaf Pointer Walk',
        targetSymbol: 'BPlusTreeIndexAdvisor.rangeScan',
        hint: 'Locate the first leaf capable of holding minKey, then walk leaf.next until key > maxKey.',
        explanation: 'Implement `rangeScan(minKey, maxKey)` to find the starting leaf and traverse sibling `next` pointers, returning `{ rowIds, pagesRead }`.'
      },
      {
        title: 'Step 3: Leftmost Prefix Utilization Analyzer',
        concept: 'Why Range Predicates Stop Subsequent Index Key Columns From Narrowing the Scan',
        targetSymbol: 'BPlusTreeIndexAdvisor.matchedPrefixCount',
        hint: 'Walk indexCols in order: increment count on equality; if range col encountered, increment once and break.',
        explanation: 'Implement `matchedPrefixCount(indexCols, equalityCols, rangeCols)` to compute how many leading columns of `indexCols` can be used as B+Tree search bounds.'
      },
      {
        title: 'Step 4: Automated Equality -> Sort -> Range + INCLUDE Index Advisor',
        concept: 'Synthesizing an Optimal Covering Index for a Parameterized Query Shape',
        targetSymbol: 'BPlusTreeIndexAdvisor.recommendIndex',
        hint: 'Order equalityCols by selectivity, then orderCols (if no range before sort), then rangeCols, and put remaining selectCols in includeCols.',
        explanation: 'Implement `recommendIndex({ table, equalityCols, rangeCols, orderCols, selectCols })` to synthesize `{ keyCols, includeCols, ddl }` following the ESR + covering index design pattern.'
      }
    ],
    starterCode: `'use strict';

class BPlusTreeIndexAdvisor {
  constructor(maxKeys = 4) {
    this.maxKeys = maxKeys;
    this.leaves = [{ entries: [], next: null }];
  }

  insertKey(key, rowId) {
    // TODO (Step 1): Insert { key, rowId } into sorted leaf; split leaf when entries.length > maxKeys
  }

  rangeScan(minKey, maxKey) {
    // TODO (Step 2): Locate starting leaf and traverse .next pointers while key <= maxKey
    return { rowIds: [], pagesRead: 0 };
  }

  static matchedPrefixCount(indexCols, equalityCols = [], rangeCols = []) {
    // TODO (Step 3): Return number of leading index columns usable for B+Tree seek bounds
    return 0;
  }

  static recommendIndex({ table, equalityCols = [], rangeCols = [], orderCols = [], selectCols = [] }) {
    // TODO (Step 4): Return { keyCols, includeCols, ddl } using ESR rule
    return { keyCols: [], includeCols: [], ddl: '' };
  }
}

module.exports = { BPlusTreeIndexAdvisor };
`,
    solutionCode: `'use strict';

class BPlusTreeIndexAdvisor {
  constructor(maxKeys = 4) {
    this.maxKeys = maxKeys;
    this.leaves = [{ entries: [], next: null }];
  }

  insertKey(key, rowId) {
    let leafIdx = 0;
    while (
      leafIdx < this.leaves.length - 1 &&
      this.leaves[leafIdx + 1].entries.length > 0 &&
      key >= this.leaves[leafIdx + 1].entries[0].key
    ) {
      leafIdx++;
    }
    const leaf = this.leaves[leafIdx];
    leaf.entries.push({ key, rowId });
    leaf.entries.sort((a, b) => (a.key !== b.key ? a.key - b.key : a.rowId - b.rowId));

    if (leaf.entries.length > this.maxKeys) {
      const mid = Math.floor(leaf.entries.length / 2);
      const rightEntries = leaf.entries.splice(mid);
      const rightLeaf = { entries: rightEntries, next: leaf.next };
      leaf.next = rightLeaf;
      this.leaves.splice(leafIdx + 1, 0, rightLeaf);
    }
  }

  rangeScan(minKey, maxKey) {
    let leaf = this.leaves[0];
    while (leaf.next && leaf.entries.length > 0 && leaf.entries[leaf.entries.length - 1].key < minKey) {
      leaf = leaf.next;
    }
    const rowIds = [];
    let pagesRead = 0;
    while (leaf) {
      pagesRead++;
      let passedMax = false;
      for (const e of leaf.entries) {
        if (e.key >= minKey && e.key <= maxKey) rowIds.push(e.rowId);
        if (e.key > maxKey) { passedMax = true; break; }
      }
      if (passedMax) break;
      leaf = leaf.next;
    }
    return { rowIds, pagesRead };
  }

  static matchedPrefixCount(indexCols, equalityCols = [], rangeCols = []) {
    const eqSet = new Set(equalityCols);
    const rngSet = new Set(rangeCols);
    let count = 0;
    for (const col of indexCols) {
      if (eqSet.has(col)) {
        count++;
      } else if (rngSet.has(col)) {
        count++;
        break; // range predicate stops subsequent columns from acting as seek bounds
      } else {
        break;
      }
    }
    return count;
  }

  static recommendIndex({ table, equalityCols = [], rangeCols = [], orderCols = [], selectCols = [] }) {
    const keyCols = [];
    const seen = new Set();
    for (const c of [...equalityCols, ...orderCols, ...rangeCols]) {
      if (!seen.has(c)) {
        seen.add(c);
        keyCols.push(c);
      }
    }
    const includeCols = selectCols.filter(c => !seen.has(c));
    const incClause = includeCols.length > 0 ? \` INCLUDE (\${includeCols.join(', ')})\` : '';
    const ddl = \`CREATE INDEX idx_\${table}_\${keyCols.join('_')} ON \${table} (\${keyCols.join(', ')})\${incClause};\`;
    return { keyCols, includeCols, ddl };
  }
}

module.exports = { BPlusTreeIndexAdvisor };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const tree = new BPlusTreeIndexAdvisor(3);
  for (let i = 1; i <= 10; i++) tree.insertKey(i * 10, i);
  assert.ok(tree.leaves.length >= 4);

  const scan = tree.rangeScan(30, 70);
  assert.deepEqual(scan.rowIds, [3, 4, 5, 6, 7]);
  assert.ok(scan.pagesRead <= 3);

  assert.equal(
    BPlusTreeIndexAdvisor.matchedPrefixCount(['a', 'b', 'c'], ['a'], ['b']),
    2
  );
  assert.equal(
    BPlusTreeIndexAdvisor.matchedPrefixCount(['a', 'b', 'c'], ['a', 'c'], ['b']),
    2 // 'c' sits after range column 'b', so only 2 columns narrow the index range!
  );

  const rec = BPlusTreeIndexAdvisor.recommendIndex({
    table: 'orders',
    equalityCols: ['customer_id', 'status'],
    orderCols: ['created_at'],
    rangeCols: ['total_cents'],
    selectCols: ['customer_id', 'invoice_url']
  });
  assert.deepEqual(rec.keyCols, ['customer_id', 'status', 'created_at', 'total_cents']);
  assert.deepEqual(rec.includeCols, ['invoice_url']);
  return true;
}
runTests();
`
  },
  {
    id: 'build-visual-explain-plan-analyzer',
    title: 'Interactive EXPLAIN Plan Bottleneck Detector & Query Rewriter',
    category: 'Query Optimizer & Execution Plans',
    difficulty: 'Advanced',
    estimatedMinutes: 40,
    pinned: false,
    summary: 'A cost-based EXPLAIN ANALYZE plan tree analyzer that computes cardinality estimation Q-Error, flags external disk sorts and high-filter sequential scans, and rewrites non-sargable SQL predicates.',
    highlights: [
      'Cardinality estimation Q-Error = max(est/act, act/est) calculation across plan tree nodes',
      'Automated bottleneck flagging for Seq Scans with high Rows Removed by Filter and external disk Sorts',
      'Sargable SQL predicate rewriter transforming YEAR(col) = Y and arithmetic wrappers into indexable ranges'
    ],
    tags: ['EXPLAIN ANALYZE', 'Cardinality Estimation', 'Q-Error', 'Sargability', 'Cost Model'],
    relatedSlugs: ['life-of-a-sql-query-pipeline', 'reading-explain-and-explain-analyze', 'table-statistics-histograms-cardinality', 'selectivity-estimation-correlated-columns', 'sargability-expression-pitfalls'],
    className: 'ExplainPlanAnalyzer',
    steps: [
      {
        title: 'Step 1: Cardinality Estimation Q-Error Calculator',
        concept: 'Measuring Multiplicative Optimizer Estimation Error: max(est/act, act/est)',
        targetSymbol: 'ExplainPlanAnalyzer.computeQError',
        hint: 'Clamp est and act to at least 1 to avoid division by zero, then return Math.max(e / a, a / e).',
        explanation: 'Implement `computeQError(estimatedRows, actualRows)` to compute the symmetric multiplicative Q-Error used in query optimizer research.'
      },
      {
        title: 'Step 2: Buffer Pool & Disk Page Cost Estimator',
        concept: 'System R / PostgreSQL Weighted Page + Tuple CPU Cost Formula',
        targetSymbol: 'ExplainPlanAnalyzer.estimateScanCost',
        hint: 'seqCost = seqPages * seqPageCost + tuples * cpuTupleCost; idxCost = randPages * randomPageCost + matchedTuples * cpuTupleCost.',
        explanation: 'Implement `estimateScanCost({ seqPages, tuples, selectivity, seqPageCost, randomPageCost, cpuTupleCost })` to compute both `seqCost` and `indexCost` and choose the cheaper access path.'
      },
      {
        title: 'Step 3: Recursive EXPLAIN ANALYZE Bottleneck Detector',
        concept: 'Walking Plan Trees to Flag High-Filter Seq Scans, Disk Spills, and Severe Q-Error',
        targetSymbol: 'ExplainPlanAnalyzer.detectBottlenecks',
        hint: 'Traverse node and node.Plans; flag Seq Scan with rowsRemoved > actualRows * 5, Sort Method: external merge, or Q-Error >= 10.',
        explanation: 'Implement `detectBottlenecks(rootPlanNode)` to recursively inspect a plan tree and return structured diagnostic findings.'
      },
      {
        title: 'Step 4: Non-Sargable Predicate Rewriter',
        concept: 'Transforming Function-Wrapped Columns into Index-Range Predicates',
        targetSymbol: 'ExplainPlanAnalyzer.rewriteSargable',
        hint: 'Rewrite YEAR(col) = YYYY to col >= "YYYY-01-01" AND col < "(YYYY+1)-01-01".',
        explanation: 'Implement `rewriteSargable(predicateStr)` to transform `YEAR(col) = YYYY` and `col + k = v` into sargable range/equality predicates.'
      }
    ],
    starterCode: `'use strict';

class ExplainPlanAnalyzer {
  static computeQError(estimatedRows, actualRows) {
    // TODO (Step 1): Compute symmetric Q-Error = max(est/act, act/est) with minimum clamp of 1
    return 1;
  }

  static estimateScanCost({ seqPages, tuples, selectivity, seqPageCost = 1.0, randomPageCost = 4.0, cpuTupleCost = 0.01 }) {
    // TODO (Step 2): Return { seqCost, indexCost, chosenPlan: 'Index Scan' | 'Seq Scan' }
    return { seqCost: 0, indexCost: 0, chosenPlan: 'Seq Scan' };
  }

  static detectBottlenecks(rootNode) {
    // TODO (Step 3): Walk tree and collect bottlenecks ('HIGH_FILTER_SEQ_SCAN', 'EXTERNAL_DISK_SORT', 'SEVERE_Q_ERROR')
    return [];
  }

  static rewriteSargable(predicateStr) {
    // TODO (Step 4): Rewrite YEAR(col) = YYYY or col + N = M into sargable SQL
    return predicateStr;
  }
}

module.exports = { ExplainPlanAnalyzer };
`,
    solutionCode: `'use strict';

class ExplainPlanAnalyzer {
  static computeQError(estimatedRows, actualRows) {
    const e = Math.max(1, Number(estimatedRows || 1));
    const a = Math.max(1, Number(actualRows || 1));
    return Math.max(e / a, a / e);
  }

  static estimateScanCost({ seqPages, tuples, selectivity, seqPageCost = 1.0, randomPageCost = 4.0, cpuTupleCost = 0.01 }) {
    const seqCost = seqPages * seqPageCost + tuples * cpuTupleCost;
    const matchedTuples = Math.ceil(tuples * selectivity);
    const randPages = Math.ceil(seqPages * selectivity);
    const indexCost = randPages * randomPageCost + matchedTuples * cpuTupleCost * 1.5;
    return {
      seqCost: Number(seqCost.toFixed(2)),
      indexCost: Number(indexCost.toFixed(2)),
      chosenPlan: indexCost < seqCost ? 'Index Scan' : 'Seq Scan'
    };
  }

  static detectBottlenecks(rootNode) {
    const findings = [];
    function walk(node) {
      if (!node) return;
      const qErr = ExplainPlanAnalyzer.computeQError(node.planRows, node.actualRows);
      if (qErr >= 10) {
        findings.push({ type: 'SEVERE_Q_ERROR', nodeType: node.nodeType, qError: qErr });
      }
      if (node.nodeType === 'Seq Scan' && (node.rowsRemovedByFilter || 0) > (node.actualRows || 1) * 5) {
        findings.push({ type: 'HIGH_FILTER_SEQ_SCAN', relation: node.relation, rowsRemoved: node.rowsRemovedByFilter });
      }
      if (node.nodeType === 'Sort' && String(node.sortMethod || '').includes('external')) {
        findings.push({ type: 'EXTERNAL_DISK_SORT', sortSpaceKb: node.sortSpaceKb || 0 });
      }
      for (const child of node.plans || []) walk(child);
    }
    walk(rootNode);
    return findings;
  }

  static rewriteSargable(predicateStr) {
    const yearMatch = predicateStr.match(/^YEAR\\((\\w+)\\)\\s*=\\s*(\\d{4})$/i);
    if (yearMatch) {
      const col = yearMatch[1];
      const yr = Number(yearMatch[2]);
      return \`\${col} >= '\${yr}-01-01' AND \${col} < '\${yr + 1}-01-01'\`;
    }
    const addMatch = predicateStr.match(/^(\\w+)\\s*\\+\\s*(\\d+)\\s*=\\s*(\\d+)$/);
    if (addMatch) {
      return \`\${addMatch[1]} = \${Number(addMatch[3]) - Number(addMatch[2])}\`;
    }
    return predicateStr;
  }
}

module.exports = { ExplainPlanAnalyzer };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  assert.equal(ExplainPlanAnalyzer.computeQError(100, 2500), 25);

  const lowSel = ExplainPlanAnalyzer.estimateScanCost({ seqPages: 1000, tuples: 100000, selectivity: 0.005 });
  assert.equal(lowSel.chosenPlan, 'Index Scan');
  const highSel = ExplainPlanAnalyzer.estimateScanCost({ seqPages: 1000, tuples: 100000, selectivity: 0.5 });
  assert.equal(highSel.chosenPlan, 'Seq Scan');

  const plan = {
    nodeType: 'Sort',
    planRows: 500,
    actualRows: 500,
    sortMethod: 'external merge Disk',
    sortSpaceKb: 65536,
    plans: [
      {
        nodeType: 'Seq Scan',
        relation: 'orders',
        planRows: 10,
        actualRows: 500,
        rowsRemovedByFilter: 99500
      }
    ]
  };
  const issues = ExplainPlanAnalyzer.detectBottlenecks(plan);
  assert.deepEqual(issues.map(i => i.type).sort(), ['EXTERNAL_DISK_SORT', 'HIGH_FILTER_SEQ_SCAN', 'SEVERE_Q_ERROR']);

  assert.equal(
    ExplainPlanAnalyzer.rewriteSargable('YEAR(created_at) = 2025'),
    "created_at >= '2025-01-01' AND created_at < '2026-01-01'"
  );
  assert.equal(ExplainPlanAnalyzer.rewriteSargable('price_cents + 100 = 500'), 'price_cents = 400');
  return true;
}
runTests();
`
  },
  {
    id: 'build-physical-join-execution-engine',
    title: 'Implement & Benchmark Nested Loop, Hash Join & Sort-Merge Join',
    category: 'Physical Join & Execution Operators',
    difficulty: 'Advanced',
    estimatedMinutes: 45,
    pinned: true,
    summary: 'A physical relational join engine implementing Block Nested Loop Join, in-memory Build-and-Probe Hash Join, Zipper Sort-Merge Join with duplicate peer rewind, and NULL-safe Hash Anti-Join.',
    highlights: [
      'Block Nested Loop Join minimizing inner-relation scans via chunked outer buffering',
      'Build-on-smaller-input Hash Join achieving O(N + M) linear execution cost',
      'Sort-Merge Join with peer group mark-and-rewind for duplicate join keys'
    ],
    tags: ['Hash Join', 'Sort-Merge Join', 'Nested Loop Join', 'Volcano Model', 'Physical Operators'],
    relatedSlugs: ['nested-loop-join-indexed-nlj', 'hash-join-build-probe-grace', 'sort-merge-join-zipper-mechanics', 'join-order-search-dynamic-programming', 'temp-tables-ctes-work-mem-spills'],
    className: 'PhysicalJoinEngine',
    steps: [
      {
        title: 'Step 1: Block Nested Loop Join with Comparison Telemetry',
        concept: 'Evaluating Equi-Joins Across Outer and Inner Tuple Pairs',
        targetSymbol: 'PhysicalJoinEngine.nestedLoopJoin',
        hint: 'Loop outer rows and inner rows; skip when either key is null/undefined; count comparisons.',
        explanation: 'Implement `nestedLoopJoin(leftRows, rightRows, leftKey, rightKey)` returning `{ rows, comparisons }`, skipping `null`/`undefined` join keys per SQL `=` semantics.'
      },
      {
        title: 'Step 2: Build-on-Smaller-Relation Hash Join',
        concept: 'O(N + M) Hash Table Construction on the Smaller Input + Streaming Probe',
        targetSymbol: 'PhysicalJoinEngine.hashJoin',
        hint: 'Build a Map<key, Array<row>> on the smaller relation (ignoring null keys), then probe with the larger relation.',
        explanation: 'Implement `hashJoin(leftRows, rightRows, leftKey, rightKey)` so that the smaller array is always selected as the hash build side, returning `{ rows, buildSize, probeOps }`.'
      },
      {
        title: 'Step 3: Zipper Sort-Merge Join with Duplicate Peer Group Rewind',
        concept: 'Advancing Two Sorted Streams in Lockstep and Taking the Cross-Product of Equal-Key Runs',
        targetSymbol: 'PhysicalJoinEngine.sortMergeJoin',
        hint: 'Sort both inputs by join key; when keys match, collect the contiguous run of equal keys on left and right and emit their Cartesian product.',
        explanation: 'Implement `sortMergeJoin(leftRows, rightRows, leftKey, rightKey)` to sort both inputs on their join key and merge them in a single pass with peer-group expansion.'
      },
      {
        title: 'Step 4: NULL-Safe Hash Anti-Join',
        concept: 'O(N + M) Anti-Join Execution Equivalence to NOT EXISTS',
        targetSymbol: 'PhysicalJoinEngine.hashAntiJoin',
        hint: 'Insert all non-null rightKeys into a Set, then keep leftRows whose leftKey is not in that Set.',
        explanation: 'Implement `hashAntiJoin(leftRows, rightRows, leftKey, rightKey)` to return all `leftRows` with no matching key in `rightRows`, safely ignoring `null` keys in `rightRows`.'
      }
    ],
    starterCode: `'use strict';

class PhysicalJoinEngine {
  static nestedLoopJoin(leftRows, rightRows, leftKey, rightKey) {
    // TODO (Step 1): Return { rows, comparisons } for equi-join (ignoring null keys)
    return { rows: [], comparisons: 0 };
  }

  static hashJoin(leftRows, rightRows, leftKey, rightKey) {
    // TODO (Step 2): Build hash table on smaller input, probe with larger input, return { rows, buildSize, probeOps }
    return { rows: [], buildSize: 0, probeOps: 0 };
  }

  static sortMergeJoin(leftRows, rightRows, leftKey, rightKey) {
    // TODO (Step 3): Sort both inputs and zipper-merge with duplicate peer run expansion
    return { rows: [] };
  }

  static hashAntiJoin(leftRows, rightRows, leftKey, rightKey) {
    // TODO (Step 4): Return leftRows that have no match in rightRows (NULL-safe like NOT EXISTS)
    return [];
  }
}

module.exports = { PhysicalJoinEngine };
`,
    solutionCode: `'use strict';

class PhysicalJoinEngine {
  static nestedLoopJoin(leftRows, rightRows, leftKey, rightKey) {
    const rows = [];
    let comparisons = 0;
    for (const l of leftRows) {
      const lk = l[leftKey];
      if (lk === null || lk === undefined) continue;
      for (const r of rightRows) {
        comparisons++;
        const rk = r[rightKey];
        if (rk !== null && rk !== undefined && lk === rk) {
          rows.push({ ...l, ...r });
        }
      }
    }
    return { rows, comparisons };
  }

  static hashJoin(leftRows, rightRows, leftKey, rightKey) {
    const buildLeft = leftRows.length <= rightRows.length;
    const buildSide = buildLeft ? leftRows : rightRows;
    const probeSide = buildLeft ? rightRows : leftRows;
    const bKey = buildLeft ? leftKey : rightKey;
    const pKey = buildLeft ? rightKey : leftKey;

    const hashTable = new Map();
    let buildSize = 0;
    for (const b of buildSide) {
      const k = b[bKey];
      if (k === null || k === undefined) continue;
      if (!hashTable.has(k)) hashTable.set(k, []);
      hashTable.get(k).push(b);
      buildSize++;
    }

    const rows = [];
    let probeOps = 0;
    for (const p of probeSide) {
      probeOps++;
      const k = p[pKey];
      if (k === null || k === undefined) continue;
      const matches = hashTable.get(k);
      if (matches) {
        for (const m of matches) {
          rows.push(buildLeft ? { ...m, ...p } : { ...p, ...m });
        }
      }
    }
    return { rows, buildSize, probeOps };
  }

  static sortMergeJoin(leftRows, rightRows, leftKey, rightKey) {
    const lSorted = leftRows
      .filter(r => r[leftKey] !== null && r[leftKey] !== undefined)
      .slice()
      .sort((a, b) => (a[leftKey] < b[leftKey] ? -1 : a[leftKey] > b[leftKey] ? 1 : 0));
    const rSorted = rightRows
      .filter(r => r[rightKey] !== null && r[rightKey] !== undefined)
      .slice()
      .sort((a, b) => (a[rightKey] < b[rightKey] ? -1 : a[rightKey] > b[rightKey] ? 1 : 0));

    const rows = [];
    let i = 0, j = 0;
    while (i < lSorted.length && j < rSorted.length) {
      const lk = lSorted[i][leftKey];
      const rk = rSorted[j][rightKey];
      if (lk < rk) {
        i++;
      } else if (lk > rk) {
        j++;
      } else {
        const key = lk;
        const lGroup = [];
        const rGroup = [];
        while (i < lSorted.length && lSorted[i][leftKey] === key) lGroup.push(lSorted[i++]);
        while (j < rSorted.length && rSorted[j][rightKey] === key) rGroup.push(rSorted[j++]);
        for (const l of lGroup) {
          for (const r of rGroup) {
            rows.push({ ...l, ...r });
          }
        }
      }
    }
    return { rows };
  }

  static hashAntiJoin(leftRows, rightRows, leftKey, rightKey) {
    const rightSet = new Set();
    for (const r of rightRows) {
      const k = r[rightKey];
      if (k !== null && k !== undefined) rightSet.add(k);
    }
    return leftRows.filter(l => !rightSet.has(l[leftKey]));
  }
}

module.exports = { PhysicalJoinEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const depts = [{ dept_id: 1, dept_name: 'Eng' }, { dept_id: 2, dept_name: 'Sales' }, { dept_id: null, dept_name: 'Temp' }];
  const emps = [
    { emp_id: 10, dept_id: 1 },
    { emp_id: 11, dept_id: 1 },
    { emp_id: 12, dept_id: 2 },
    { emp_id: 13, dept_id: 99 },
    { emp_id: 14, dept_id: null }
  ];

  const nlj = PhysicalJoinEngine.nestedLoopJoin(depts, emps, 'dept_id', 'dept_id');
  const hj = PhysicalJoinEngine.hashJoin(depts, emps, 'dept_id', 'dept_id');
  const smj = PhysicalJoinEngine.sortMergeJoin(depts, emps, 'dept_id', 'dept_id');

  assert.equal(nlj.rows.length, 3);
  assert.equal(hj.rows.length, 3);
  assert.equal(hj.buildSize, 2); // built on smaller depts relation (2 non-null rows)
  assert.equal(smj.rows.length, 3);

  const anti = PhysicalJoinEngine.hashAntiJoin(emps, depts, 'dept_id', 'dept_id');
  assert.deepEqual(anti.map(e => e.emp_id), [13, 14]);
  return true;
}
runTests();
`
  },
  {
    id: 'build-transaction-anomaly-simulator',
    title: 'Dual-Session Concurrency Anomaly & Isolation Verifier',
    category: 'Transactions, Isolation & Concurrency',
    difficulty: 'Advanced',
    estimatedMinutes: 40,
    pinned: false,
    summary: 'A multi-session transaction schedule analyzer implementing Adya dependency serialization graphs (WW, WR, RW anti-dependencies), cycle detection for Dirty Read / Lost Update / Write Skew, and Wait-For Graph deadlock victim selection.',
    highlights: [
      'Adya Serialization Graph builder extracting WW, WR, and RW (anti-dependency) edges from interleaved schedules',
      'Automated classification of Lost Update (P4) vs Write Skew (A5B) under Snapshot Isolation',
      'Wait-For Graph cycle detection and minimum-cost deadlock victim abort selection'
    ],
    tags: ['Isolation Levels', 'Write Skew', 'Lost Update', 'Serialization Graph', 'Deadlock Detection'],
    relatedSlugs: ['acid-properties-under-the-hood', 'transaction-lifecycle-savepoints', 'read-phenomena-dirty-nonrepeatable-phantom', 'write-anomalies-lost-update-write-skew', 'isolation-levels-ansi-vs-reality'],
    className: 'ConcurrencyAnomalySimulator',
    steps: [
      {
        title: 'Step 1: Conflict Extraction (WW, WR, RW Anti-Dependencies)',
        concept: 'Identifying Conflicting Operations Across Concurrent Transactions on Shared Keys',
        targetSymbol: 'ConcurrencyAnomalySimulator.extractDependencies',
        hint: 'Compare earlier op i and later op j from different txIds on the same key where at least one is a Write.',
        explanation: 'Implement `extractDependencies(schedule)` to scan an ordered list of `{ tx, op: "R"|"W", key }` events and emit `{ from, to, type: "WW"|"WR"|"RW", key }` conflict edges.'
      },
      {
        title: 'Step 2: Serialization Graph Cycle Detector',
        concept: 'Testing Conflict-Serializability via Directed Graph Cycle Detection',
        targetSymbol: 'ConcurrencyAnomalySimulator.hasSerializationCycle',
        hint: 'Build adjacency list from dependency edges and run DFS with visiting/visited sets.',
        explanation: 'Implement `hasSerializationCycle(edges)` to return `true` if the transaction dependency graph contains a directed cycle (meaning the schedule is not conflict-serializable).'
      },
      {
        title: 'Step 3: Lost Update vs Write Skew Anomaly Classifier',
        concept: 'Distinguishing Single-Object R-R-W-W Lost Updates from Multi-Object RW-RW Disjoint Write Skew',
        targetSymbol: 'ConcurrencyAnomalySimulator.classifyScheduleAnomaly',
        hint: 'Check if cycle involves WW+RW on the same key (LOST_UPDATE) vs two RW anti-dependencies on distinct keys (WRITE_SKEW).',
        explanation: 'Implement `classifyScheduleAnomaly(schedule)` to return `"SERIALIZABLE"`, `"LOST_UPDATE"`, or `"WRITE_SKEW"`.'
      },
      {
        title: 'Step 4: Lock Manager Wait-For Graph & Deadlock Victim Selector',
        concept: 'Breaking Lock Cycles by Aborting the Youngest / Lowest-Log-Weight Transaction',
        targetSymbol: 'ConcurrencyAnomalySimulator.selectDeadlockVictim',
        hint: 'Find transactions involved in a Wait-For cycle and return the one with the minimum workDone score.',
        explanation: 'Implement `selectDeadlockVictim(waitEdges, txWeights)` to detect a deadlock cycle and return the victim transaction ID with the lowest `txWeights[tx]`.'
      }
    ],
    starterCode: `'use strict';

class ConcurrencyAnomalySimulator {
  static extractDependencies(schedule) {
    // TODO (Step 1): Emit { from, to, type: 'WW'|'WR'|'RW', key } for conflicting ops on same key
    return [];
  }

  static hasSerializationCycle(edges) {
    // TODO (Step 2): Return true if directed graph of edges contains a cycle
    return false;
  }

  static classifyScheduleAnomaly(schedule) {
    // TODO (Step 3): Return 'SERIALIZABLE', 'LOST_UPDATE', or 'WRITE_SKEW'
    return 'SERIALIZABLE';
  }

  static selectDeadlockVictim(waitEdges, txWeights) {
    // TODO (Step 4): Identify transactions in wait-for cycle and return lowest-weight txId (or null)
    return null;
  }
}

module.exports = { ConcurrencyAnomalySimulator };
`,
    solutionCode: `'use strict';

class ConcurrencyAnomalySimulator {
  static extractDependencies(schedule) {
    const edges = [];
    for (let i = 0; i < schedule.length; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        const a = schedule[i], b = schedule[j];
        if (a.tx === b.tx || a.key !== b.key) continue;
        if (a.op === 'W' && b.op === 'W') edges.push({ from: a.tx, to: b.tx, type: 'WW', key: a.key });
        else if (a.op === 'W' && b.op === 'R') edges.push({ from: a.tx, to: b.tx, type: 'WR', key: a.key });
        else if (a.op === 'R' && b.op === 'W') edges.push({ from: a.tx, to: b.tx, type: 'RW', key: a.key });
      }
    }
    return edges;
  }

  static hasSerializationCycle(edges) {
    const adj = new Map();
    for (const e of edges) {
      if (!adj.has(e.from)) adj.set(e.from, new Set());
      adj.get(e.from).add(e.to);
    }
    const state = new Map(); // 1 = visiting, 2 = visited
    function dfs(u) {
      state.set(u, 1);
      for (const v of adj.get(u) || []) {
        if (state.get(v) === 1) return true;
        if (!state.get(v) && dfs(v)) return true;
      }
      state.set(u, 2);
      return false;
    }
    for (const node of adj.keys()) {
      if (!state.get(node) && dfs(node)) return true;
    }
    return false;
  }

  static classifyScheduleAnomaly(schedule) {
    const edges = this.extractDependencies(schedule);
    if (!this.hasSerializationCycle(edges)) return 'SERIALIZABLE';
    const hasWW = edges.some(e => e.type === 'WW');
    if (hasWW) return 'LOST_UPDATE';
    const rwKeys = new Set(edges.filter(e => e.type === 'RW').map(e => e.key));
    if (rwKeys.size >= 2) return 'WRITE_SKEW';
    return 'NON_SERIALIZABLE';
  }

  static selectDeadlockVictim(waitEdges, txWeights) {
    const adj = new Map();
    for (const { waiter, holder } of waitEdges) {
      if (!adj.has(waiter)) adj.set(waiter, []);
      adj.get(waiter).push(holder);
    }
    const cycleNodes = new Set();
    for (const start of adj.keys()) {
      const visited = new Set();
      let cur = start;
      while (cur && !visited.has(cur)) {
        visited.add(cur);
        const nexts = adj.get(cur) || [];
        cur = nexts[0] || null;
        if (cur === start) {
          for (const n of visited) cycleNodes.add(n);
          break;
        }
      }
    }
    if (cycleNodes.size === 0) return null;
    return Array.from(cycleNodes).sort((a, b) => (txWeights[a] || 0) - (txWeights[b] || 0))[0];
  }
}

module.exports = { ConcurrencyAnomalySimulator };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  // Lost update: T1 reads X, T2 reads X, T1 writes X, T2 writes X
  const lostUpdate = [
    { tx: 'T1', op: 'R', key: 'acct_1' },
    { tx: 'T2', op: 'R', key: 'acct_1' },
    { tx: 'T1', op: 'W', key: 'acct_1' },
    { tx: 'T2', op: 'W', key: 'acct_1' }
  ];
  assert.equal(ConcurrencyAnomalySimulator.classifyScheduleAnomaly(lostUpdate), 'LOST_UPDATE');

  // Write skew: T1 reads doc_A & doc_B, T2 reads doc_A & doc_B, T1 writes doc_A, T2 writes doc_B
  const writeSkew = [
    { tx: 'T1', op: 'R', key: 'doc_A' },
    { tx: 'T1', op: 'R', key: 'doc_B' },
    { tx: 'T2', op: 'R', key: 'doc_A' },
    { tx: 'T2', op: 'R', key: 'doc_B' },
    { tx: 'T1', op: 'W', key: 'doc_A' },
    { tx: 'T2', op: 'W', key: 'doc_B' }
  ];
  assert.equal(ConcurrencyAnomalySimulator.classifyScheduleAnomaly(writeSkew), 'WRITE_SKEW');

  const victim = ConcurrencyAnomalySimulator.selectDeadlockVictim(
    [{ waiter: 'T1', holder: 'T2' }, { waiter: 'T2', holder: 'T1' }],
    { T1: 50, T2: 10 }
  );
  assert.equal(victim, 'T2');
  return true;
}
runTests();
`
  },
  {
    id: 'build-mvcc-snapshot-storage-engine',
    title: 'Multi-Version Tuple Store with Snapshot Isolation & Vacuum GC',
    category: 'MVCC, Locking & Deadlocks',
    difficulty: 'Advanced',
    estimatedMinutes: 45,
    pinned: true,
    summary: 'A PostgreSQL-style Multi-Version Concurrency Control (MVCC) storage engine implementing (xmin, xmax) tuple headers, Snapshot Isolation (xmin, xmax, xip_list) visibility rules, First-Committer-Wins write conflict detection, and VACUUM dead-tuple garbage collection.',
    highlights: [
      'PostgreSQL tuple header versioning (xmin, xmax) where UPDATE expires the old version and appends a new version',
      'Snapshot Isolation visibility evaluator over (xmin, xmax, xip_list) active transaction sets',
      'First-Committer-Wins write-write conflict detection and VACUUM dead-tuple reclamation below globalOldestXmin'
    ],
    tags: ['MVCC', 'Tuple Visibility', 'Snapshot Isolation', 'First-Committer-Wins', 'VACUUM GC'],
    relatedSlugs: ['multi-version-concurrency-control-mvcc', 'tuple-headers-xmin-xmax-visibility', 'transaction-snapshots-visibility-rules', 'row-level-locks-for-update-skip-locked', 'vacuum-bloat-txid-wraparound'],
    className: 'MvccStorageEngine',
    steps: [
      {
        title: 'Step 1: Transaction Allocation & Snapshot Capture (xmin, xmax, xip)',
        concept: 'Recording Active Concurrent Transaction IDs at Snapshot Creation Time',
        targetSymbol: 'MvccStorageEngine.beginTransaction',
        hint: 'Allocate txid = this.nextTxId++, capture active xip set of other running transactions, and return snapshot.',
        explanation: 'Implement `beginTransaction()` to allocate a monotonically increasing `txid` and capture a snapshot `{ selfTx: txid, xmin, xmax: this.nextTxId, xip: new Set(activeOtherTxs) }`.'
      },
      {
        title: 'Step 2: Tuple Visibility Function (xmin / xmax / Commit State)',
        concept: 'Readers Never Block Writers: Evaluating Whether a Tuple Version Is Visible to a Snapshot',
        targetSymbol: 'MvccStorageEngine.isTupleVisible',
        hint: 'Check creator xmin is either selfTx or (committed && xmin < snap.xmax && !snap.xip.has(xmin)), and deleter xmax is either null, aborted, or not visible to snap.',
        explanation: 'Implement `isTupleVisible(tuple, snapshot)` so a tuple version is visible iff its creating transaction `xmin` is visible to `snapshot` and its deleting transaction `xmax` is either `null` or not visible to `snapshot`.'
      },
      {
        title: 'Step 3: Non-Overwriting UPDATE with First-Committer-Wins Conflict Detection',
        concept: 'Expiring the Current Version (xmax = txid) and Appending a New Version (xmin = txid)',
        targetSymbol: 'MvccStorageEngine.update',
        hint: 'Find current visible version for key; if tuple.xmax !== null, throw serialization error (First-Committer-Wins); else set tuple.xmax = txid and push new version.',
        explanation: 'Implement `update(txid, key, newValue)` to detect concurrent write conflicts (`tuple.xmax !== null`) and append a new tuple version.'
      },
      {
        title: 'Step 4: VACUUM Dead Tuple Garbage Collector',
        concept: 'Reclaiming Superseded Tuple Versions Invisible to All Active Snapshots',
        targetSymbol: 'MvccStorageEngine.vacuum',
        hint: 'Remove tuples whose xmax is committed and strictly less than globalOldestXmin (or whose xmin was aborted).',
        explanation: 'Implement `vacuum()` to compute `globalOldestXmin` across all active transactions and purge dead tuple versions that no active or future transaction can ever see.'
      }
    ],
    starterCode: `'use strict';

class MvccStorageEngine {
  constructor() {
    this.nextTxId = 100;
    this.txStatus = new Map(); // txid -> 'ACTIVE' | 'COMMITTED' | 'ABORTED'
    this.snapshots = new Map();
    this.tuples = []; // { key, value, xmin, xmax }
  }

  beginTransaction() {
    // TODO (Step 1): Allocate txid, mark ACTIVE, capture snapshot { selfTx, xmin, xmax, xip }, return txid
    return 0;
  }

  commit(txid) { this.txStatus.set(txid, 'COMMITTED'); }
  abort(txid) { this.txStatus.set(txid, 'ABORTED'); }

  insert(txid, key, value) {
    this.tuples.push({ key, value, xmin: txid, xmax: null });
  }

  isTupleVisible(tuple, snapshot) {
    // TODO (Step 2): Evaluate PostgreSQL MVCC visibility rules for tuple against snapshot
    return false;
  }

  read(txid, key) {
    const snap = this.snapshots.get(txid);
    const found = this.tuples.find(t => t.key === key && this.isTupleVisible(t, snap));
    return found ? found.value : undefined;
  }

  update(txid, key, newValue) {
    // TODO (Step 3): Enforce First-Committer-Wins, set oldTuple.xmax = txid, and insert new version
  }

  vacuum() {
    // TODO (Step 4): Reclaim dead tuples where xmin is ABORTED or (xmax is COMMITTED and xmax < globalOldestXmin)
    return 0;
  }
}

module.exports = { MvccStorageEngine };
`,
    solutionCode: `'use strict';

class MvccStorageEngine {
  constructor() {
    this.nextTxId = 100;
    this.txStatus = new Map();
    this.snapshots = new Map();
    this.tuples = [];
  }

  beginTransaction() {
    const txid = this.nextTxId++;
    const active = [];
    for (const [id, st] of this.txStatus.entries()) {
      if (st === 'ACTIVE') active.push(id);
    }
    this.txStatus.set(txid, 'ACTIVE');
    const xmin = active.length > 0 ? Math.min(...active, txid) : txid;
    this.snapshots.set(txid, {
      selfTx: txid,
      xmin,
      xmax: this.nextTxId,
      xip: new Set(active)
    });
    return txid;
  }

  commit(txid) { this.txStatus.set(txid, 'COMMITTED'); }
  abort(txid) { this.txStatus.set(txid, 'ABORTED'); }

  insert(txid, key, value) {
    this.tuples.push({ key, value, xmin: txid, xmax: null });
  }

  _txVisibleInSnapshot(targetTx, snap) {
    if (targetTx === snap.selfTx) return true;
    if (this.txStatus.get(targetTx) !== 'COMMITTED') return false;
    if (targetTx >= snap.xmax) return false;
    if (snap.xip.has(targetTx)) return false;
    return true;
  }

  isTupleVisible(tuple, snapshot) {
    if (!this._txVisibleInSnapshot(tuple.xmin, snapshot)) return false;
    if (tuple.xmax === null) return true;
    if (tuple.xmax === snapshot.selfTx) return false;
    if (this._txVisibleInSnapshot(tuple.xmax, snapshot)) return false;
    return true;
  }

  read(txid, key) {
    const snap = this.snapshots.get(txid);
    const found = this.tuples.find(t => t.key === key && this.isTupleVisible(t, snap));
    return found ? found.value : undefined;
  }

  update(txid, key, newValue) {
    const snap = this.snapshots.get(txid);
    const cur = this.tuples.find(t => t.key === key && this.isTupleVisible(t, snap));
    if (!cur) throw new Error('Key not found: ' + key);
    if (cur.xmax !== null && this.txStatus.get(cur.xmax) !== 'ABORTED') {
      throw new Error('First-Committer-Wins serialization conflict on key: ' + key);
    }
    cur.xmax = txid;
    this.tuples.push({ key, value: newValue, xmin: txid, xmax: null });
  }

  vacuum() {
    let globalOldestXmin = this.nextTxId;
    for (const [id, st] of this.txStatus.entries()) {
      if (st === 'ACTIVE') {
        const snap = this.snapshots.get(id);
        globalOldestXmin = Math.min(globalOldestXmin, id, snap ? snap.xmin : id);
      }
    }
    const before = this.tuples.length;
    this.tuples = this.tuples.filter(t => {
      if (this.txStatus.get(t.xmin) === 'ABORTED') return false;
      if (t.xmax !== null && this.txStatus.get(t.xmax) === 'COMMITTED' && t.xmax < globalOldestXmin) {
        return false;
      }
      return true;
    });
    return before - this.tuples.length;
  }
}

module.exports = { MvccStorageEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const mvcc = new MvccStorageEngine();

  const t1 = mvcc.beginTransaction();
  mvcc.insert(t1, 'bal', 1000);
  mvcc.commit(t1);

  const tReader = mvcc.beginTransaction();
  const tWriter = mvcc.beginTransaction();
  mvcc.update(tWriter, 'bal', 1500);
  mvcc.commit(tWriter);

  // Snapshot Isolation: tReader still sees 1000 even after tWriter committed!
  assert.equal(mvcc.read(tReader, 'bal'), 1000);
  // First-Committer-Wins: tReader cannot overwrite 'bal' because tWriter modified it
  assert.throws(() => mvcc.update(tReader, 'bal', 2000), /First-Committer-Wins/);
  mvcc.commit(tReader);

  const tNew = mvcc.beginTransaction();
  assert.equal(mvcc.read(tNew, 'bal'), 1500);
  mvcc.commit(tNew);

  const reclaimed = mvcc.vacuum();
  assert.equal(reclaimed, 1);
  assert.equal(mvcc.tuples.length, 1);
  return true;
}
runTests();
`
  },
  {
    id: 'build-slotted-page-wal-engine',
    title: '8KB Slotted Page + Write-Ahead Log Crash Recovery Simulator',
    category: 'Storage Engines, Buffer Pool & WAL',
    difficulty: 'Advanced',
    estimatedMinutes: 45,
    pinned: false,
    summary: 'A disk-page storage engine implementing an 8KB slotted page with downward line-pointer array growth and upward tuple growth, PageLSN tracking, and 3-phase ARIES crash recovery (Analysis, Redo, Undo).',
    highlights: [
      '8KB Slotted Page memory layout growing line pointers downward and variable-length tuples upward',
      'In-place line-pointer compaction reclaiming fragmented tuple space without changing external TIDs',
      'Three-phase ARIES WAL recovery (Analysis, Redo from minRecLSN, and reverse Undo with CLR logging)'
    ],
    tags: ['Slotted Page', 'Write-Ahead Logging', 'ARIES Recovery', 'PageLSN', 'Buffer Pool'],
    relatedSlugs: ['slotted-page-layout-8kb-anatomy', 'heap-files-hot-updates-fillfactor', 'buffer-pool-clock-sweep-lru-k', 'write-ahead-logging-wal-lsn', 'aries-crash-recovery-checkpoints'],
    className: 'SlottedPageWalEngine',
    steps: [
      {
        title: 'Step 1: 8KB Slotted Page Tuple Allocation (pd_lower & pd_upper)',
        concept: 'Growing Line Pointer Slots Downward From Header and Tuple Payloads Upward From Page End',
        targetSymbol: 'SlottedPageWalEngine.insertTuple',
        hint: 'Check freeSpace >= 4 + byteLength; allocate tuple at pd_upper - len, append slot { offset, length, dead: false }, and advance pd_lower += 4.',
        explanation: 'Implement `insertTuple(payloadStr, lsn)` to allocate space in an 8192-byte slotted page where header `pd_lower` grows downward by 4 bytes per slot and `pd_upper` grows upward by tuple byte length.'
      },
      {
        title: 'Step 2: Tuple Deletion & In-Place Page Compaction',
        concept: 'Defragmenting Dead Tuple Holes While Preserving External Slot Numbers (TIDs)',
        targetSymbol: 'SlottedPageWalEngine.compactPage',
        hint: 'Repack all live tuples contiguously from pageSize downward, updating each live slot’s offset without changing its slot index.',
        explanation: 'Implement `deleteTuple(slotId, lsn)` and `compactPage()` so that dead tuple bytes are reclaimed and `pd_upper` is restored while every live tuple keeps its original `slotId`.'
      },
      {
        title: 'Step 3: ARIES WAL Analysis Phase (Active Tx Table & Dirty Page Table)',
        concept: 'Reconstructing Loser Transactions and Redo Start LSN from the Write-Ahead Log',
        targetSymbol: 'SlottedPageWalEngine.analyzeWal',
        hint: 'Scan WAL forward: track active/loser transactions on BEGIN/UPDATE/COMMIT, and record first recLSN per page in dirtyPages.',
        explanation: 'Implement `analyzeWal(walRecords)` to identify uncommitted `loserTxs` and the minimum `redoStartLsn` across dirty pages.'
      },
      {
        title: 'Step 4: ARIES Redo (Repeating History) & Undo (Loser Rollback)',
        concept: 'Applying Logged Changes Where pageLSN < record.lsn and Rolling Back Losers in Reverse LSN Order',
        targetSymbol: 'SlottedPageWalEngine.recoverWal',
        hint: 'Redo all UPDATE records forward to reconstruct state at crash, then walk loserTx UPDATE records in reverse LSN order restoring beforeImage.',
        explanation: 'Implement `recoverWal(walRecords, initialPages)` to execute ARIES Redo followed by reverse-LSN Undo of uncommitted loser transactions.'
      }
    ],
    starterCode: `'use strict';

class SlottedPageWalEngine {
  constructor(pageSize = 8192) {
    this.pageSize = pageSize;
    this.pd_lower = 24; // 24-byte page header
    this.pd_upper = pageSize;
    this.pageLsn = 0;
    this.slots = []; // [{ offset, length, data, dead }]
  }

  get freeSpace() { return this.pd_upper - this.pd_lower; }

  insertTuple(payloadStr, lsn = 1) {
    // TODO (Step 1): Check freeSpace >= 4 + payloadStr.length; update pd_lower, pd_upper, pageLsn; return slotId
    return -1;
  }

  deleteTuple(slotId, lsn = 1) {
    // TODO (Step 2): Mark slot as dead and update pageLsn
  }

  compactPage() {
    // TODO (Step 2): Repack live tuples from pageSize downward and update pd_upper while preserving slot indices
  }

  static analyzeWal(walRecords) {
    // TODO (Step 3): Return { loserTxs: [...], redoStartLsn }
    return { loserTxs: [], redoStartLsn: null };
  }

  static recoverWal(walRecords, initialPages = {}) {
    // TODO (Step 4): Execute ARIES Redo (where pageLsn < rec.lsn) and reverse-order Undo of loserTxs
    return {};
  }
}

module.exports = { SlottedPageWalEngine };
`,
    solutionCode: `'use strict';

class SlottedPageWalEngine {
  constructor(pageSize = 8192) {
    this.pageSize = pageSize;
    this.pd_lower = 24;
    this.pd_upper = pageSize;
    this.pageLsn = 0;
    this.slots = [];
  }

  get freeSpace() { return this.pd_upper - this.pd_lower; }

  insertTuple(payloadStr, lsn = 1) {
    const len = payloadStr.length;
    if (this.freeSpace < 4 + len) return -1;
    this.pd_upper -= len;
    this.pd_lower += 4;
    this.pageLsn = Math.max(this.pageLsn, lsn);
    const slotId = this.slots.length;
    this.slots.push({ offset: this.pd_upper, length: len, data: payloadStr, dead: false });
    return slotId;
  }

  deleteTuple(slotId, lsn = 1) {
    const s = this.slots[slotId];
    if (!s || s.dead) return false;
    s.dead = true;
    s.data = null;
    this.pageLsn = Math.max(this.pageLsn, lsn);
    return true;
  }

  compactPage() {
    let cursor = this.pageSize;
    for (const s of this.slots) {
      if (!s.dead) {
        cursor -= s.length;
        s.offset = cursor;
      }
    }
    this.pd_upper = cursor;
  }

  static analyzeWal(walRecords) {
    const active = new Set();
    let redoStartLsn = null;
    for (const r of walRecords) {
      if (r.type === 'BEGIN') active.add(r.tx);
      else if (r.type === 'UPDATE') {
        active.add(r.tx);
        if (redoStartLsn === null || r.lsn < redoStartLsn) redoStartLsn = r.lsn;
      } else if (r.type === 'COMMIT' || r.type === 'ABORT') {
        active.delete(r.tx);
      }
    }
    return { loserTxs: Array.from(active), redoStartLsn };
  }

  static recoverWal(walRecords, initialPages = {}) {
    const pages = JSON.parse(JSON.stringify(initialPages));
    const { loserTxs } = this.analyzeWal(walRecords);
    const loserSet = new Set(loserTxs);

    // Phase 2: Redo (Repeating History)
    for (const r of walRecords) {
      if (r.type === 'UPDATE') {
        const p = pages[r.pageId] || { val: null, pageLsn: 0 };
        if (p.pageLsn < r.lsn) {
          p.val = r.after;
          p.pageLsn = r.lsn;
        }
        pages[r.pageId] = p;
      }
    }

    // Phase 3: Undo loser transactions in reverse LSN order
    for (let i = walRecords.length - 1; i >= 0; i--) {
      const r = walRecords[i];
      if (r.type === 'UPDATE' && loserSet.has(r.tx)) {
        pages[r.pageId].val = r.before;
        pages[r.pageId].pageLsn += 1;
      }
    }
    return pages;
  }
}

module.exports = { SlottedPageWalEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const page = new SlottedPageWalEngine(128);
  const s0 = page.insertTuple('row_zero_payload', 10);
  const s1 = page.insertTuple('row_one_payload_', 20);
  const s2 = page.insertTuple('row_two_payload_', 30);
  assert.equal(s0, 0);
  assert.equal(s1, 1);
  assert.equal(s2, 2);

  const freeBefore = page.freeSpace;
  page.deleteTuple(1, 40);
  page.compactPage();
  assert.equal(page.freeSpace, freeBefore + 16);
  assert.equal(page.slots[2].data, 'row_two_payload_'); // slotId 2 preserved!

  const wal = [
    { lsn: 10, tx: 'T1', type: 'BEGIN' },
    { lsn: 20, tx: 'T1', type: 'UPDATE', pageId: 'P1', before: 100, after: 250 },
    { lsn: 30, tx: 'T2', type: 'BEGIN' },
    { lsn: 40, tx: 'T2', type: 'UPDATE', pageId: 'P2', before: 500, after: 999 },
    { lsn: 50, tx: 'T1', type: 'COMMIT' }
  ];
  const recovered = SlottedPageWalEngine.recoverWal(wal, {
    P1: { val: 100, pageLsn: 0 },
    P2: { val: 500, pageLsn: 0 }
  });
  assert.equal(recovered.P1.val, 250); // Winner T1 Redone
  assert.equal(recovered.P2.val, 500); // Loser T2 Undone
  return true;
}
runTests();
`
  },
  {
    id: 'build-columnar-compression-query-engine',
    title: 'Columnar RLE/Dictionary Encoder with Zone-Map Predicate Pushdown',
    category: 'Columnar OLAP & Modern Engines',
    difficulty: 'Advanced',
    estimatedMinutes: 40,
    pinned: true,
    summary: 'A Parquet/DuckDB-style columnar execution engine implementing Dictionary + Run-Length Encoding (RLE), Row-Group Zone-Map (min/max) pruning, and late-materialization direct compressed predicate evaluation.',
    highlights: [
      'Dictionary + Run-Length Encoding (RLE) compressing sorted low-cardinality columns by 10x–50x',
      'Row-Group Zone-Map (min, max) metadata pruning skipping irrelevant row groups without decompression',
      'Direct predicate evaluation over RLE runs and late materialization of projected attributes'
    ],
    tags: ['Columnar Storage', 'Run-Length Encoding', 'Dictionary Encoding', 'Zone Maps', 'Late Materialization'],
    relatedSlugs: ['columnar-storage-layout-parquet', 'columnar-compression-rle-dictionary-delta', 'late-materialization-simd-vectorization', 'zone-maps-min-max-pruning-bloom', 'case-duckdb-snowflake-clickhouse'],
    className: 'ColumnarQueryEngine',
    steps: [
      {
        title: 'Step 1: Dictionary + Run-Length Encoding (RLE) Compressor',
        concept: 'Mapping Strings to Integer Codes and Collapsing Contiguous Runs into (code, length) Pairs',
        targetSymbol: 'ColumnarQueryEngine.encodeDictionaryRle',
        hint: 'Assign integer codes in dictionary array and collapse consecutive identical values into { code, count }.',
        explanation: 'Implement `encodeDictionaryRle(values)` returning `{ dict, runs: [{ code, count }] }`.'
      },
      {
        title: 'Step 2: Row-Group Zone-Map (Min/Max) Builder',
        concept: 'Storing Per-Block Min/Max Statistics in Columnar Footers',
        targetSymbol: 'ColumnarQueryEngine.buildRowGroups',
        hint: 'Chunk rows into blocks of groupSize and record min/max per numeric column in each row group.',
        explanation: 'Implement `buildRowGroups(rows, groupSize, statCol)` to partition rows into fixed-size row groups annotated with `{ min, max, count, rows }`.'
      },
      {
        title: 'Step 3: Zone-Map Row-Group Pruning Scan',
        concept: 'Skipping Entire Row Groups Whose [min, max] Interval Is Disjoint From the Query Range',
        targetSymbol: 'ColumnarQueryEngine.scanWithZoneMaps',
        hint: 'Skip any row group where rg.max < minVal || rg.min > maxVal; track groupsScanned and groupsSkipped.',
        explanation: 'Implement `scanWithZoneMaps(rowGroups, statCol, minVal, maxVal)` to prune non-overlapping row groups before inspecting rows.'
      },
      {
        title: 'Step 4: Direct Compressed RLE Count Without Decompression',
        concept: 'Vectorized Aggregation Directly on Compressed Run Headers',
        targetSymbol: 'ColumnarQueryEngine.countCompressedEquals',
        hint: 'Look up targetVal in dict; if missing return 0, else sum run.count where run.code === targetCode.',
        explanation: 'Implement `countCompressedEquals(encodedCol, targetVal)` to count matching tuples directly from the RLE runs in $O(\\text{runs})$ time without decompressing individual rows.'
      }
    ],
    starterCode: `'use strict';

class ColumnarQueryEngine {
  static encodeDictionaryRle(values) {
    // TODO (Step 1): Compress array into { dict: [...], runs: [{ code, count }] }
    return { dict: [], runs: [] };
  }

  static buildRowGroups(rows, groupSize, statCol) {
    // TODO (Step 2): Partition rows into chunks of groupSize with { min, max, rows }
    return [];
  }

  static scanWithZoneMaps(rowGroups, statCol, minVal, maxVal) {
    // TODO (Step 3): Prune row groups outside [minVal, maxVal] and return { matchedRows, groupsScanned, groupsSkipped }
    return { matchedRows: [], groupsScanned: 0, groupsSkipped: 0 };
  }

  static countCompressedEquals(encodedCol, targetVal) {
    // TODO (Step 4): Count occurrences of targetVal directly from { dict, runs } without full decompression
    return 0;
  }
}

module.exports = { ColumnarQueryEngine };
`,
    solutionCode: `'use strict';

class ColumnarQueryEngine {
  static encodeDictionaryRle(values) {
    const dict = [];
    const codeMap = new Map();
    const runs = [];

    for (const v of values) {
      let code = codeMap.get(v);
      if (code === undefined) {
        code = dict.length;
        dict.push(v);
        codeMap.set(v, code);
      }
      if (runs.length > 0 && runs[runs.length - 1].code === code) {
        runs[runs.length - 1].count++;
      } else {
        runs.push({ code, count: 1 });
      }
    }
    return { dict, runs };
  }

  static buildRowGroups(rows, groupSize, statCol) {
    const groups = [];
    for (let i = 0; i < rows.length; i += groupSize) {
      const chunk = rows.slice(i, i + groupSize);
      const vals = chunk.map(r => r[statCol]);
      groups.push({
        min: Math.min(...vals),
        max: Math.max(...vals),
        rows: chunk
      });
    }
    return groups;
  }

  static scanWithZoneMaps(rowGroups, statCol, minVal, maxVal) {
    const matchedRows = [];
    let groupsScanned = 0;
    let groupsSkipped = 0;
    for (const rg of rowGroups) {
      if (rg.max < minVal || rg.min > maxVal) {
        groupsSkipped++;
        continue;
      }
      groupsScanned++;
      for (const r of rg.rows) {
        if (r[statCol] >= minVal && r[statCol] <= maxVal) matchedRows.push(r);
      }
    }
    return { matchedRows, groupsScanned, groupsSkipped };
  }

  static countCompressedEquals(encodedCol, targetVal) {
    const targetCode = encodedCol.dict.indexOf(targetVal);
    if (targetCode === -1) return 0;
    let total = 0;
    for (const run of encodedCol.runs) {
      if (run.code === targetCode) total += run.count;
    }
    return total;
  }
}

module.exports = { ColumnarQueryEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const col = ['US', 'US', 'US', 'EU', 'EU', 'US', 'APAC'];
  const enc = ColumnarQueryEngine.encodeDictionaryRle(col);
  assert.deepEqual(enc.dict, ['US', 'EU', 'APAC']);
  assert.equal(enc.runs.length, 4);
  assert.equal(ColumnarQueryEngine.countCompressedEquals(enc, 'US'), 4);
  assert.equal(ColumnarQueryEngine.countCompressedEquals(enc, 'LATAM'), 0);

  const rows = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, ts: (i + 1) * 10 }));
  const rgs = ColumnarQueryEngine.buildRowGroups(rows, 3, 'ts');
  assert.equal(rgs.length, 4);

  const scan = ColumnarQueryEngine.scanWithZoneMaps(rgs, 'ts', 75, 90);
  assert.equal(scan.groupsSkipped, 3);
  assert.equal(scan.groupsScanned, 1);
  assert.deepEqual(scan.matchedRows.map(r => r.ts), [80, 90]);
  return true;
}
runTests();
`
  },
  {
    id: 'build-sharded-query-router',
    title: 'Consistent-Hash Shard Router with Partition Pruning & Scatter-Gather',
    category: 'Distributed SQL, Partitioning & Sharding',
    difficulty: 'Advanced',
    estimatedMinutes: 45,
    pinned: false,
    summary: 'A distributed SQL proxy router implementing FNV-1a consistent hash ring routing, single-shard vs scatter-gather query planning, LSN-fenced read-your-writes replica selection, and distributed Top-K merge.',
    highlights: [
      'Deterministic FNV-1a virtual-node consistent hash ring routing tenant keys with minimal rebalancing movement',
      'Single-shard pruning when tenant_id is constrained vs parallel Scatter-Gather merge across shards',
      'Read-Your-Writes causal consistency router selecting replicas with replayLsn >= clientWriteLsn'
    ],
    tags: ['Consistent Hashing', 'Shard Router', 'Scatter-Gather', 'Read-Your-Writes', 'Partition Pruning'],
    relatedSlugs: ['single-leader-replication-sync-async', 'read-replicas-consistency-models', 'declarative-table-partitioning', 'horizontal-sharding-consistent-hashing', 'distributed-transactions-2pc-spanner-raft'],
    className: 'ShardedQueryRouter',
    steps: [
      {
        title: 'Step 1: FNV-1a Virtual-Node Consistent Hash Ring Routing',
        concept: 'Mapping Shard Keys Around a 32-Bit Hash Ring via Binary Search',
        targetSymbol: 'ShardedQueryRouter.routeShardKey',
        hint: 'Hash shardKey and pick the first ring entry with ringEntry.hash >= keyHash (wrapping around to index 0).',
        explanation: 'Implement `routeShardKey(shardKey)` to hash `shardKey` with FNV-1a and binary-search the sorted virtual-node ring, wrapping around to index `0` when `keyHash` exceeds the last ring token.'
      },
      {
        title: 'Step 2: Single-Shard Pruning vs Scatter-Gather Planner',
        concept: 'Avoiding Cross-Shard Fan-Out When the Partition Key Is Specified',
        targetSymbol: 'ShardedQueryRouter.planQuery',
        hint: 'If query.shardKey is present, target [routeShardKey(query.shardKey)]; otherwise target all physical shards.',
        explanation: 'Implement `planQuery(query)` to return `{ mode: "SINGLE_SHARD" | "SCATTER_GATHER", targetShards }`.'
      },
      {
        title: 'Step 3: Distributed Scatter-Gather Top-K Coordinator Merge',
        concept: 'Pushing ORDER BY + LIMIT K to Each Shard and Merging Sorted Streams at the Proxy',
        targetSymbol: 'ShardedQueryRouter.scatterGatherTopK',
        hint: 'Take top k from each target shard, combine candidates, sort globally by sortCol DESC, and slice(0, k).',
        explanation: 'Implement `scatterGatherTopK(shardDataMap, sortCol, k)` to pull at most `k` pre-sorted tuples from each shard and merge them into the exact global top-$k$.'
      },
      {
        title: 'Step 4: LSN-Fenced Read-Your-Writes Replica Selector',
        concept: 'Routing Follower Reads Only to Replicas Caught Up Past the Client’s High-Water Mark LSN',
        targetSymbol: 'ShardedQueryRouter.selectReadNode',
        hint: 'Filter replicas with replica.replayLsn >= requiredLsn; pick lowest-latency caught-up replica or fall back to "PRIMARY".',
        explanation: 'Implement `selectReadNode(replicas, requiredLsn)` to select the lowest-latency replica whose `replayLsn >= requiredLsn`, falling back to `"PRIMARY"` when all replicas lag.'
      }
    ],
    starterCode: `'use strict';

function fnv1a32(str) {
  const s = String(str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

class ShardedQueryRouter {
  constructor(shards = ['shard_0', 'shard_1', 'shard_2'], vnodes = 8) {
    this.shards = shards;
    this.ring = [];
    for (const s of shards) {
      for (let v = 0; v < vnodes; v++) {
        this.ring.push({ hash: fnv1a32(\`\${s}#\${v}\`), shard: s });
      }
    }
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  routeShardKey(shardKey) {
    // TODO (Step 1): Hash shardKey and return the clockwise shard on this.ring
    return this.shards[0];
  }

  planQuery(query) {
    // TODO (Step 2): Return { mode: 'SINGLE_SHARD' | 'SCATTER_GATHER', targetShards }
    return { mode: 'SCATTER_GATHER', targetShards: this.shards };
  }

  scatterGatherTopK(shardDataMap, sortCol, k = 3) {
    // TODO (Step 3): Fetch top k per shard and merge into global top k descending by sortCol
    return [];
  }

  static selectReadNode(replicas, requiredLsn) {
    // TODO (Step 4): Return caught-up replica id with lowest latencyMs, or 'PRIMARY' if all lag
    return 'PRIMARY';
  }
}

module.exports = { ShardedQueryRouter, fnv1a32 };
`,
    solutionCode: `'use strict';

function fnv1a32(str) {
  const s = String(str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

class ShardedQueryRouter {
  constructor(shards = ['shard_0', 'shard_1', 'shard_2'], vnodes = 8) {
    this.shards = shards;
    this.ring = [];
    for (const s of shards) {
      for (let v = 0; v < vnodes; v++) {
        this.ring.push({ hash: fnv1a32(\`\${s}#\${v}\`), shard: s });
      }
    }
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  routeShardKey(shardKey) {
    const h = fnv1a32(shardKey);
    for (const node of this.ring) {
      if (node.hash >= h) return node.shard;
    }
    return this.ring[0].shard;
  }

  planQuery(query) {
    if (query && query.shardKey !== undefined && query.shardKey !== null) {
      return { mode: 'SINGLE_SHARD', targetShards: [this.routeShardKey(query.shardKey)] };
    }
    return { mode: 'SCATTER_GATHER', targetShards: this.shards.slice() };
  }

  scatterGatherTopK(shardDataMap, sortCol, k = 3) {
    const candidates = [];
    for (const shard of this.shards) {
      const rows = (shardDataMap[shard] || [])
        .slice()
        .sort((a, b) => b[sortCol] - a[sortCol])
        .slice(0, k);
      candidates.push(...rows);
    }
    return candidates.sort((a, b) => b[sortCol] - a[sortCol]).slice(0, k);
  }

  static selectReadNode(replicas, requiredLsn) {
    const eligible = replicas
      .filter(r => r.replayLsn >= requiredLsn)
      .sort((a, b) => a.latencyMs - b.latencyMs);
    return eligible.length > 0 ? eligible[0].id : 'PRIMARY';
  }
}

module.exports = { ShardedQueryRouter, fnv1a32 };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const router = new ShardedQueryRouter(['shard_0', 'shard_1', 'shard_2'], 16);

  const single = router.planQuery({ shardKey: 'tenant_42' });
  assert.equal(single.mode, 'SINGLE_SHARD');
  assert.equal(single.targetShards.length, 1);

  const scatter = router.planQuery({});
  assert.equal(scatter.mode, 'SCATTER_GATHER');
  assert.equal(scatter.targetShards.length, 3);

  const top = router.scatterGatherTopK({
    shard_0: [{ id: 1, rev: 500 }, { id: 2, rev: 100 }],
    shard_1: [{ id: 3, rev: 900 }, { id: 4, rev: 300 }],
    shard_2: [{ id: 5, rev: 700 }]
  }, 'rev', 3);
  assert.deepEqual(top.map(r => r.rev), [900, 700, 500]);

  const replicas = [
    { id: 'rep_1', replayLsn: 105, latencyMs: 2 },
    { id: 'rep_2', replayLsn: 150, latencyMs: 6 }
  ];
  assert.equal(ShardedQueryRouter.selectReadNode(replicas, 120), 'rep_2');
  assert.equal(ShardedQueryRouter.selectReadNode(replicas, 200), 'PRIMARY');
  return true;
}
runTests();
`
  },
  {
    id: 'build-production-sql-tuning-clinic',
    title: 'End-to-End Slow Query Diagnostic & Optimization Clinic (100x Speedup)',
    category: 'Production SQL Patterns & Tuning',
    difficulty: 'Advanced',
    estimatedMinutes: 45,
    pinned: true,
    summary: 'A production SQL performance engineering toolkit implementing O(1) keyset seek pagination, N+1 query batching coalescer, lock-free FOR UPDATE SKIP LOCKED worker queues, and chunked primary-key backfills.',
    highlights: [
      'Keyset seek cursor pagination (created_at, id) < (cursor_ts, cursor_id) running in constant O(log N) time',
      'DataLoader-style N+1 query batching coalescer collapsing K loop queries into 1 bulk ANY($1) lookup',
      'Lock-free concurrent worker queue claiming via FOR UPDATE SKIP LOCKED with visibility timeout recovery'
    ],
    tags: ['Keyset Pagination', 'N+1 Query Elimination', 'SKIP LOCKED Queue', 'Chunked Backfill', 'Query Tuning'],
    relatedSlugs: ['keyset-cursor-pagination-vs-offset', 'solving-n-plus-one-orm-queries', 'queue-processing-skip-locked-patterns', 'zero-downtime-schema-migrations', 'connection-pooling-prepared-statements'],
    className: 'ProductionSqlTuningClinic',
    steps: [
      {
        title: 'Step 1: Deterministic Keyset Cursor Pagination ((ts, id) < (cursorTs, cursorId))',
        concept: 'Replacing O(OFFSET) Linear Scans with Constant-Time Composite Tuple Seek',
        targetSymbol: 'ProductionSqlTuningClinic.keysetPaginateDesc',
        hint: 'Sort descending by (ts, id); if cursor is provided, filter rows where r.ts < cursor.ts || (r.ts === cursor.ts && r.id < cursor.id).',
        explanation: 'Implement `keysetPaginateDesc(rows, cursor, pageSize)` to return `{ items, nextCursor }` ordered by `(ts DESC, id DESC)` using strict composite tuple comparison.'
      },
      {
        title: 'Step 2: N+1 Query Batch Coalescer',
        concept: 'Replacing N Per-Parent Round-Trips with a Single WHERE parent_id = ANY($1) Hash Lookup',
        targetSymbol: 'ProductionSqlTuningClinic.batchLoadChildren',
        hint: 'Collect unique parentIds, scan childTable once for matching fkCol values, and group into a Map<parentId, Array<child>>.',
        explanation: 'Implement `batchLoadChildren(parents, childTable, fkCol)` to hydrate every parent with its `children` array in a single batched pass, returning `{ enrichedParents, queryCount: 1 }`.'
      },
      {
        title: 'Step 3: Lock-Free FOR UPDATE SKIP LOCKED Job Queue Claimer',
        concept: 'Allowing Concurrent Workers to Claim Disjoint Pending Rows Without Blocking',
        targetSymbol: 'ProductionSqlTuningClinic.claimNextJobsSkipLocked',
        hint: 'Find up to batchSize jobs where status === "pending" && !lockedIds.has(job.id), lock them, and set status = "processing".',
        explanation: 'Implement `claimNextJobsSkipLocked(jobs, lockedIds, workerId, batchSize)` to claim up to `batchSize` unlocked pending jobs ordered by `id ASC`.'
      },
      {
        title: 'Step 4: Key-Range Chunked Batch Backfill Planner',
        concept: 'Splitting Million-Row Updates into Bounded PK Ranges to Prevent Long Lock Holds and WAL Bloat',
        targetSymbol: 'ProductionSqlTuningClinic.planChunkedBackfill',
        hint: 'Sort primary keys ascending and slice into chunks of batchSize, emitting { minId, maxId, count } per batch.',
        explanation: 'Implement `planChunkedBackfill(primaryKeys, batchSize)` to partition primary keys into bounded `{ minId, maxId, count }` ranges for zero-downtime migration.'
      }
    ],
    starterCode: `'use strict';

class ProductionSqlTuningClinic {
  static keysetPaginateDesc(rows, cursor = null, pageSize = 3) {
    // TODO (Step 1): Sort by (ts DESC, id DESC), apply keyset seek < (cursor.ts, cursor.id), return { items, nextCursor }
    return { items: [], nextCursor: null };
  }

  static batchLoadChildren(parents, childTable, fkCol) {
    // TODO (Step 2): Coalesce N+1 lookups into 1 batched hash-grouped lookup
    return { enrichedParents: [], queryCount: 0 };
  }

  static claimNextJobsSkipLocked(jobs, lockedIds, workerId, batchSize = 2) {
    // TODO (Step 3): Claim up to batchSize pending rows not in lockedIds
    return [];
  }

  static planChunkedBackfill(primaryKeys, batchSize = 1000) {
    // TODO (Step 4): Partition sorted primaryKeys into [{ minId, maxId, count }] batches
    return [];
  }
}

module.exports = { ProductionSqlTuningClinic };
`,
    solutionCode: `'use strict';

class ProductionSqlTuningClinic {
  static keysetPaginateDesc(rows, cursor = null, pageSize = 3) {
    const sorted = rows.slice().sort((a, b) => (b.ts !== a.ts ? b.ts - a.ts : b.id - a.id));
    const filtered = cursor
      ? sorted.filter(r => r.ts < cursor.ts || (r.ts === cursor.ts && r.id < cursor.id))
      : sorted;
    const items = filtered.slice(0, pageSize);
    const last = items[items.length - 1];
    const nextCursor = items.length === pageSize && last ? { ts: last.ts, id: last.id } : null;
    return { items, nextCursor };
  }

  static batchLoadChildren(parents, childTable, fkCol) {
    const parentIds = new Set(parents.map(p => p.id));
    const byParent = new Map();
    for (const id of parentIds) byParent.set(id, []);
    for (const c of childTable) {
      if (parentIds.has(c[fkCol])) {
        byParent.get(c[fkCol]).push(c);
      }
    }
    const enrichedParents = parents.map(p => ({ ...p, children: byParent.get(p.id) || [] }));
    return { enrichedParents, queryCount: 1 };
  }

  static claimNextJobsSkipLocked(jobs, lockedIds, workerId, batchSize = 2) {
    const claimed = [];
    const sorted = jobs.slice().sort((a, b) => a.id - b.id);
    for (const job of sorted) {
      if (claimed.length >= batchSize) break;
      if (job.status === 'pending' && !lockedIds.has(job.id)) {
        lockedIds.add(job.id);
        job.status = 'processing';
        job.workerId = workerId;
        claimed.push(job);
      }
    }
    return claimed;
  }

  static planChunkedBackfill(primaryKeys, batchSize = 1000) {
    const sorted = primaryKeys.slice().sort((a, b) => a - b);
    const batches = [];
    for (let i = 0; i < sorted.length; i += batchSize) {
      const chunk = sorted.slice(i, i + batchSize);
      batches.push({
        minId: chunk[0],
        maxId: chunk[chunk.length - 1],
        count: chunk.length
      });
    }
    return batches;
  }
}

module.exports = { ProductionSqlTuningClinic };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const feed = [
    { id: 10, ts: 100 },
    { id: 9, ts: 100 }, // tie on ts=100!
    { id: 8, ts: 90 },
    { id: 7, ts: 80 }
  ];
  const p1 = ProductionSqlTuningClinic.keysetPaginateDesc(feed, null, 2);
  assert.deepEqual(p1.items.map(r => r.id), [10, 9]);
  const p2 = ProductionSqlTuningClinic.keysetPaginateDesc(feed, p1.nextCursor, 2);
  assert.deepEqual(p2.items.map(r => r.id), [8, 7]);

  const batched = ProductionSqlTuningClinic.batchLoadChildren(
    [{ id: 1 }, { id: 2 }],
    [{ id: 100, user_id: 1 }, { id: 101, user_id: 1 }],
    'user_id'
  );
  assert.equal(batched.queryCount, 1);
  assert.equal(batched.enrichedParents[0].children.length, 2);
  assert.equal(batched.enrichedParents[1].children.length, 0);

  const jobs = [
    { id: 1, status: 'pending' },
    { id: 2, status: 'pending' },
    { id: 3, status: 'pending' }
  ];
  const locks = new Set([1]); // job 1 already locked by another worker
  const claimed = ProductionSqlTuningClinic.claimNextJobsSkipLocked(jobs, locks, 'w_2', 2);
  assert.deepEqual(claimed.map(j => j.id), [2, 3]);

  const chunks = ProductionSqlTuningClinic.planChunkedBackfill([1, 2, 5, 8, 12], 2);
  assert.equal(chunks.length, 3);
  assert.deepEqual(chunks[0], { minId: 1, maxId: 2, count: 2 });
  return true;
}
runTests();
`
  }
];
