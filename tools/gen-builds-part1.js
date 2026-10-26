'use strict';

module.exports = [
  {
    id: 'build-sql-query-interpreter',
    title: 'Mini Relational Tuple Filter & Projection Engine',
    category: 'Relational Foundations',
    difficulty: 'Beginner',
    estimatedMinutes: 30,
    pinned: true,
    summary: 'A relational tuple-at-a-time volcano iterator engine implementing Kleene three-valued logic (TRUE/FALSE/UNKNOWN), WHERE filtering, SELECT projection with expressions, ORDER BY NULLS LAST, and LIMIT/OFFSET slicing.',
    highlights: [
      'Kleene 3-valued truth table evaluation (TRUE, FALSE, UNKNOWN) for NULL-safe predicates',
      'Logical execution order pipeline: FROM -> WHERE -> SELECT -> DISTINCT -> ORDER BY -> LIMIT/OFFSET',
      'Deterministic multi-key sorting with configurable NULLS FIRST / NULLS LAST ordering'
    ],
    tags: ['Relational Algebra', 'Three-Valued Logic', 'Tuple Iterator', 'Query Pipeline', 'Projection'],
    relatedSlugs: ['why-databases-exist', 'tables-rows-columns-types', 'select-projection-aliases', 'where-filtering-predicates', 'null-three-valued-logic'],
    className: 'RelationalQueryEngine',
    steps: [
      {
        title: 'Step 1: Kleene Three-Valued Logic (3VL) Evaluator',
        concept: 'Evaluating NULL Comparisons as UNKNOWN and Propagating Through AND / OR / NOT',
        targetSymbol: 'RelationalQueryEngine.eval3VL',
        hint: 'Map TRUE->1, UNKNOWN->0, FALSE->-1: AND is Math.min(a,b), OR is Math.max(a,b), NOT is -a.',
        explanation: 'Implement `evalComparison(left, op, right)` and `combine3VL(op, a, b)` using Kleene three-valued logic (`"TRUE"`, `"FALSE"`, `"UNKNOWN"`). Any standard comparison (`=`, `!=`, `<`, `>`, `<=`, `>=`) where either operand is `null` or `undefined` must return `"UNKNOWN"`, whereas `IS DISTINCT FROM` treats `null` as a comparable value.'
      },
      {
        title: 'Step 2: WHERE Predicate Filtering (Coercing UNKNOWN to FALSE)',
        concept: 'Filtering Relation Tuples Strictly on Logical TRUE',
        targetSymbol: 'RelationalQueryEngine.filterWhere',
        hint: 'Keep only rows where predicateFn(row) === "TRUE" or predicateFn(row) === true.',
        explanation: 'Implement `filterWhere(rows, predicateFn)` to evaluate a 3VL predicate across every input tuple and retain **only** rows that evaluate to `"TRUE"` (or boolean `true`), discarding both `"FALSE"` and `"UNKNOWN"` rows just as SQL `WHERE` clauses do.'
      },
      {
        title: 'Step 3: SELECT Projection & Derived Column Aliases',
        concept: 'Relational Projection π and Computed Tuple Attributes',
        targetSymbol: 'RelationalQueryEngine.projectSelect',
        hint: 'Map each specification { alias, expr } to outRow[alias] = typeof expr === "function" ? expr(row) : row[expr].',
        explanation: 'Implement `projectSelect(rows, projections, distinct = false)` to transform each input tuple into a projected tuple containing only the requested column names or computed expressions, optionally deduplicating tuples using structural serialization.'
      },
      {
        title: 'Step 4: Multi-Key ORDER BY (NULLS LAST) & LIMIT / OFFSET Slicing',
        concept: 'Deterministic Tuple Ordering and Cursor Window Slicing',
        targetSymbol: 'RelationalQueryEngine.orderByAndSlice',
        hint: 'Check nullness before comparing values; respect nullsLast flag, then slice(offset, offset + limit).',
        explanation: 'Implement `orderByAndSlice(rows, orderSpecs, limit, offset)` to sort projected tuples across multiple `{ col, dir, nullsLast }` keys without mutating the source relation, then apply `offset` and `limit` window bounds.'
      }
    ],
    starterCode: `'use strict';

class RelationalQueryEngine {
  static evalComparison(left, op, right) {
    // TODO (Step 1): Return 'TRUE', 'FALSE', or 'UNKNOWN' under SQL 3-valued logic.
    // Support '=', '!=', '<', '>', '<=', '>=', and 'IS DISTINCT FROM'.
    return 'UNKNOWN';
  }

  static combine3VL(op, a, b) {
    // TODO (Step 1): Combine 3VL truth values ('TRUE', 'FALSE', 'UNKNOWN') for 'AND', 'OR', 'NOT'
    return 'UNKNOWN';
  }

  static filterWhere(rows, predicateFn) {
    // TODO (Step 2): Retain only rows where predicateFn(row) is 'TRUE' or true
    return [];
  }

  static projectSelect(rows, projections, distinct = false) {
    // TODO (Step 3): Project each row using projections [{ alias, expr }] and apply DISTINCT if true
    return [];
  }

  static orderByAndSlice(rows, orderSpecs = [], limit = null, offset = 0) {
    // TODO (Step 4): Sort copy of rows by [{ col, dir: 'ASC'|'DESC', nullsLast: true }] then apply offset/limit
    return [];
  }
}

module.exports = { RelationalQueryEngine };
`,
    solutionCode: `'use strict';

const VAL_MAP = { TRUE: 1, UNKNOWN: 0, FALSE: -1 };
const REV_MAP = { '1': 'TRUE', '0': 'UNKNOWN', '-1': 'FALSE' };

class RelationalQueryEngine {
  static evalComparison(left, op, right) {
    const lNull = left === null || left === undefined;
    const rNull = right === null || right === undefined;
    if (op === 'IS DISTINCT FROM') {
      if (lNull && rNull) return 'FALSE';
      if (lNull || rNull) return 'TRUE';
      return left !== right ? 'TRUE' : 'FALSE';
    }
    if (lNull || rNull) return 'UNKNOWN';
    switch (op) {
      case '=': return left === right ? 'TRUE' : 'FALSE';
      case '!=': return left !== right ? 'TRUE' : 'FALSE';
      case '<': return left < right ? 'TRUE' : 'FALSE';
      case '>': return left > right ? 'TRUE' : 'FALSE';
      case '<=': return left <= right ? 'TRUE' : 'FALSE';
      case '>=': return left >= right ? 'TRUE' : 'FALSE';
      default: throw new Error('Unsupported operator: ' + op);
    }
  }

  static combine3VL(op, a, b) {
    const va = VAL_MAP[a] ?? 0;
    if (op === 'NOT') return REV_MAP[String(-va)];
    const vb = VAL_MAP[b] ?? 0;
    if (op === 'AND') return REV_MAP[String(Math.min(va, vb))];
    if (op === 'OR') return REV_MAP[String(Math.max(va, vb))];
    throw new Error('Unsupported logical op: ' + op);
  }

  static filterWhere(rows, predicateFn) {
    return rows.filter(row => {
      const res = predicateFn(row);
      return res === true || res === 'TRUE';
    });
  }

  static projectSelect(rows, projections, distinct = false) {
    const projected = rows.map(row => {
      const out = {};
      for (const p of projections) {
        out[p.alias] = typeof p.expr === 'function' ? p.expr(row) : row[p.expr];
      }
      return out;
    });
    if (!distinct) return projected;
    const seen = new Set();
    return projected.filter(r => {
      const key = JSON.stringify(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  static orderByAndSlice(rows, orderSpecs = [], limit = null, offset = 0) {
    const copy = rows.slice();
    if (orderSpecs.length > 0) {
      copy.sort((a, b) => {
        for (const spec of orderSpecs) {
          const va = a[spec.col];
          const vb = b[spec.col];
          const aNull = va === null || va === undefined;
          const bNull = vb === null || vb === undefined;
          if (aNull && bNull) continue;
          const nullsLast = spec.nullsLast !== false;
          if (aNull) return nullsLast ? 1 : -1;
          if (bNull) return nullsLast ? -1 : 1;
          if (va !== vb) {
            const cmp = va < vb ? -1 : 1;
            return (spec.dir || 'ASC').toUpperCase() === 'DESC' ? -cmp : cmp;
          }
        }
        return 0;
      });
    }
    const start = Math.max(0, offset || 0);
    return limit === null || limit === undefined ? copy.slice(start) : copy.slice(start, start + limit);
  }
}

module.exports = { RelationalQueryEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  assert.equal(RelationalQueryEngine.evalComparison(10, '=', 10), 'TRUE');
  assert.equal(RelationalQueryEngine.evalComparison(null, '=', null), 'UNKNOWN');
  assert.equal(RelationalQueryEngine.evalComparison(null, 'IS DISTINCT FROM', null), 'FALSE');
  assert.equal(RelationalQueryEngine.evalComparison(null, 'IS DISTINCT FROM', 5), 'TRUE');
  assert.equal(RelationalQueryEngine.combine3VL('AND', 'UNKNOWN', 'FALSE'), 'FALSE');
  assert.equal(RelationalQueryEngine.combine3VL('OR', 'UNKNOWN', 'TRUE'), 'TRUE');
  assert.equal(RelationalQueryEngine.combine3VL('NOT', 'UNKNOWN'), 'UNKNOWN');

  const data = [
    { id: 1, dept: 'Eng', salary: 120, bonus: 20 },
    { id: 2, dept: 'Eng', salary: 150, bonus: null },
    { id: 3, dept: 'Sales', salary: 110, bonus: 15 },
    { id: 4, dept: 'Eng', salary: 120, bonus: 20 }
  ];
  const filtered = RelationalQueryEngine.filterWhere(data, r =>
    RelationalQueryEngine.evalComparison(r.bonus, '>', 10)
  );
  assert.equal(filtered.length, 3);

  const proj = RelationalQueryEngine.projectSelect(filtered, [
    { alias: 'dept', expr: 'dept' },
    { alias: 'comp', expr: r => r.salary + (r.bonus || 0) }
  ], true);
  assert.equal(proj.length, 2);

  const sorted = RelationalQueryEngine.orderByAndSlice(data, [
    { col: 'bonus', dir: 'DESC', nullsLast: true },
    { col: 'id', dir: 'ASC' }
  ], 3, 1);
  assert.deepEqual(sorted.map(r => r.id), [4, 3, 2]);
  return true;
}
runTests();
`
  },
  {
    id: 'build-ecommerce-schema-ddl',
    title: 'E-Commerce Schema with Referential Integrity & Upsert Pipeline',
    category: 'DDL & Schema Constraints',
    difficulty: 'Intermediate',
    estimatedMinutes: 35,
    pinned: true,
    summary: 'An in-memory DDL constraint validator and idempotent UPSERT engine enforcing PRIMARY KEY, UNIQUE, NOT NULL, CHECK predicates, and cascading FOREIGN KEY referential integrity actions.',
    highlights: [
      'Strict NOT NULL, UNIQUE, and custom CHECK constraint validation prior to tuple commit',
      'Referential integrity enforcement supporting ON DELETE RESTRICT, CASCADE, and SET NULL',
      'Idempotent INSERT ... ON CONFLICT (key) DO UPDATE SET atomic upsert resolution'
    ],
    tags: ['DDL Constraints', 'Foreign Keys', 'Cascading Deletes', 'Upsert Pipeline', 'Referential Integrity'],
    relatedSlugs: ['create-table-ddl-anatomy', 'primary-keys-surrogate-vs-natural', 'foreign-keys-referential-integrity', 'check-unique-not-null-defaults', 'dml-insert-update-delete-returning'],
    className: 'SchemaConstraintEngine',
    steps: [
      {
        title: 'Step 1: Table Registration & NOT NULL / CHECK Validation',
        concept: 'Enforcing Domain Integrity Before Tuple Insertion',
        targetSymbol: 'SchemaConstraintEngine.validateRow',
        hint: 'Check notNullCols for null/undefined and run every checkFn(row), throwing an Error on failure.',
        explanation: 'Implement `validateRow(tableName, row)` to verify that every column in `schema.notNull` is non-null and every predicate in `schema.checks` returns `true`.'
      },
      {
        title: 'Step 2: Foreign Key Parent Lookup Validation',
        concept: 'Referential Integrity Enforcement on Child Insert',
        targetSymbol: 'SchemaConstraintEngine.validateForeignKeys',
        hint: 'If row[fk.col] is non-null, verify parentTable has a row with parentRow[fk.refCol] === row[fk.col].',
        explanation: 'Implement `validateForeignKeys(tableName, row)` so that any non-null foreign key attribute in `row` references an existing parent key in the target parent relation.'
      },
      {
        title: 'Step 3: Atomic INSERT ... ON CONFLICT DO UPDATE (UPSERT)',
        concept: 'Idempotent Conflict Resolution on Primary or Unique Keys',
        targetSymbol: 'SchemaConstraintEngine.upsert',
        hint: 'Find existing row matching conflictCol; if found, apply updateFn(existing, row) and revalidate; else insert.',
        explanation: 'Implement `upsert(tableName, row, conflictCol, updateFn)` to atomically detect conflicts on `conflictCol`, merge attributes via `updateFn(existing, incoming)`, validate constraints, and return the resulting tuple.'
      },
      {
        title: 'Step 4: Cascading Foreign Key Delete Engine (RESTRICT / CASCADE / SET NULL)',
        concept: 'Graph Propagation of Referential Actions on Parent Deletion',
        targetSymbol: 'SchemaConstraintEngine.deleteByPk',
        hint: 'Inspect all child tables referencing tableName: throw on RESTRICT, delete child on CASCADE, or null column on SET NULL.',
        explanation: 'Implement `deleteByPk(tableName, pkVal)` to enforce child foreign-key actions (`RESTRICT`, `CASCADE`, `SET NULL`) before removing the parent tuple.'
      }
    ],
    starterCode: `'use strict';

class SchemaConstraintEngine {
  constructor() {
    this.tables = new Map();
  }

  createTable(name, { pk = 'id', notNull = [], checks = [], foreignKeys = [] } = {}) {
    this.tables.set(name, { pk, notNull, checks, foreignKeys, rows: new Map() });
  }

  validateRow(tableName, row) {
    // TODO (Step 1): Enforce pk and notNull columns are non-null, and all checks pass
  }

  validateForeignKeys(tableName, row) {
    // TODO (Step 2): Ensure each foreignKey { col, refTable, refCol, onDelete } exists in refTable when row[col] != null
  }

  upsert(tableName, row, conflictCol, updateFn) {
    // TODO (Step 3): Insert row or update conflicting row on conflictCol, enforcing all constraints
  }

  deleteByPk(tableName, pkVal) {
    // TODO (Step 4): Enforce RESTRICT / CASCADE / SET NULL on child tables before deleting parent row
  }

  getRows(tableName) {
    return Array.from(this.tables.get(tableName).rows.values());
  }
}

module.exports = { SchemaConstraintEngine };
`,
    solutionCode: `'use strict';

class SchemaConstraintEngine {
  constructor() {
    this.tables = new Map();
  }

  createTable(name, { pk = 'id', notNull = [], checks = [], foreignKeys = [] } = {}) {
    this.tables.set(name, { pk, notNull, checks, foreignKeys, rows: new Map() });
  }

  validateRow(tableName, row) {
    const t = this.tables.get(tableName);
    if (!t) throw new Error('Unknown table: ' + tableName);
    const reqCols = new Set([t.pk, ...t.notNull]);
    for (const col of reqCols) {
      if (row[col] === null || row[col] === undefined) {
        throw new Error(\`NOT NULL violation on \${tableName}.\${col}\`);
      }
    }
    for (const checkFn of t.checks) {
      if (!checkFn(row)) throw new Error(\`CHECK constraint violation on \${tableName}\`);
    }
    return true;
  }

  validateForeignKeys(tableName, row) {
    const t = this.tables.get(tableName);
    for (const fk of t.foreignKeys) {
      const val = row[fk.col];
      if (val === null || val === undefined) continue;
      const parent = this.tables.get(fk.refTable);
      let found = false;
      for (const pRow of parent.rows.values()) {
        if (pRow[fk.refCol] === val) { found = true; break; }
      }
      if (!found) throw new Error(\`FOREIGN KEY violation on \${tableName}.\${fk.col} -> \${fk.refTable}.\${fk.refCol}\`);
    }
    return true;
  }

  upsert(tableName, row, conflictCol = null, updateFn = null) {
    const t = this.tables.get(tableName);
    const keyCol = conflictCol || t.pk;
    let existing = null;
    for (const r of t.rows.values()) {
      if (r[keyCol] === row[keyCol]) { existing = r; break; }
    }
    const candidate = existing && updateFn ? { ...existing, ...updateFn(existing, row) } : { ...row };
    this.validateRow(tableName, candidate);
    this.validateForeignKeys(tableName, candidate);
    t.rows.set(candidate[t.pk], candidate);
    return candidate;
  }

  deleteByPk(tableName, pkVal) {
    const t = this.tables.get(tableName);
    const target = t.rows.get(pkVal);
    if (!target) return false;

    for (const [childName, childTable] of this.tables.entries()) {
      for (const fk of childTable.foreignKeys) {
        if (fk.refTable !== tableName) continue;
        const parentVal = target[fk.refCol];
        const matchingChildren = Array.from(childTable.rows.values()).filter(c => c[fk.col] === parentVal);
        if (matchingChildren.length === 0) continue;
        const action = (fk.onDelete || 'RESTRICT').toUpperCase();
        if (action === 'RESTRICT') {
          throw new Error(\`ON DELETE RESTRICT violation from \${childName}.\${fk.col}\`);
        } else if (action === 'CASCADE') {
          for (const c of matchingChildren) this.deleteByPk(childName, c[childTable.pk]);
        } else if (action === 'SET NULL') {
          for (const c of matchingChildren) {
            const updated = { ...c, [fk.col]: null };
            this.validateRow(childName, updated);
            childTable.rows.set(updated[childTable.pk], updated);
          }
        }
      }
    }
    t.rows.delete(pkVal);
    return true;
  }

  getRows(tableName) {
    return Array.from(this.tables.get(tableName).rows.values());
  }
}

module.exports = { SchemaConstraintEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const db = new SchemaConstraintEngine();
  db.createTable('customers', { pk: 'id', notNull: ['email'] });
  db.createTable('orders', {
    pk: 'id',
    notNull: ['total_cents'],
    checks: [r => r.total_cents >= 0],
    foreignKeys: [{ col: 'customer_id', refTable: 'customers', refCol: 'id', onDelete: 'CASCADE' }]
  });
  db.createTable('shipments', {
    pk: 'id',
    foreignKeys: [{ col: 'order_id', refTable: 'orders', refCol: 'id', onDelete: 'SET NULL' }]
  });

  db.upsert('customers', { id: 1, email: 'ada@sql.dev', visits: 1 });
  db.upsert('customers', { id: 1, email: 'ada@sql.dev', visits: 1 }, 'email', (old, inc) => ({ visits: old.visits + inc.visits }));
  assert.equal(db.getRows('customers')[0].visits, 2);

  assert.throws(() => db.upsert('orders', { id: 10, customer_id: 999, total_cents: 500 }), /FOREIGN KEY/);
  assert.throws(() => db.upsert('orders', { id: 10, customer_id: 1, total_cents: -5 }), /CHECK/);

  db.upsert('orders', { id: 10, customer_id: 1, total_cents: 2500 });
  db.upsert('shipments', { id: 100, order_id: 10 });

  db.deleteByPk('customers', 1);
  assert.equal(db.getRows('orders').length, 0);
  assert.equal(db.getRows('shipments')[0].order_id, null);
  return true;
}
runTests();
`
  },
  {
    id: 'build-multi-table-order-reconciler',
    title: 'Multi-Table Order, Payment & Shipment Reconciliation Engine',
    category: 'Relational Joins & Set Algebra',
    difficulty: 'Intermediate',
    estimatedMinutes: 35,
    pinned: false,
    summary: 'A relational join and anti-join reconciliation engine that pre-aggregates 1-to-many child tables before joining to eliminate fan-out traps and detects orphan orders, unshipped captures, and settlement discrepancies.',
    highlights: [
      'Fan-out-safe pre-aggregation of payments and shipments prior to parent order join',
      'LEFT JOIN / IS NULL anti-join detection of unpaid and unshipped orders',
      'FULL OUTER JOIN discrepancy audit reconciling internal orders against gateway ledger events'
    ],
    tags: ['Multi-Table Joins', 'Chasm Trap', 'Anti-Join', 'FULL OUTER JOIN', 'Order Reconciliation'],
    relatedSlugs: ['relational-algebra-set-theory', 'inner-join-equi-joins', 'left-right-full-outer-joins', 'join-where-vs-on-filter-trap', 'set-operations-union-intersect-except'],
    className: 'OrderReconciliationEngine',
    steps: [
      {
        title: 'Step 1: Pre-Aggregate Child Relations to Prevent Join Fan-Out',
        concept: 'Grouping 1-to-Many Child Tables by Foreign Key Prior to Joining',
        targetSymbol: 'OrderReconciliationEngine.aggregateByOrder',
        hint: 'Group rows by order_id and sum the specified amountField only for matching status rows.',
        explanation: 'Implement `aggregateByOrder(rows, statusFilter, amountField)` to collapse multiple payment or shipment lines per `order_id` into a single summary map `{ count, total }` before joining to `orders`, preventing the classic multi-fact chasm trap.'
      },
      {
        title: 'Step 2: Preserved-Side Outer Join with ON-Clause Predicate Semantics',
        concept: 'Preserving Left Rows When Right-Side ON Predicates Fail',
        targetSymbol: 'OrderReconciliationEngine.leftJoinOrders',
        hint: 'Iterate orders and attach matching summary or zero-filled defaults { paid_cents: 0, shipped_qty: 0 }.',
        explanation: 'Implement `leftJoinOrders(orders, payments, shipments)` to enrich every order with its captured payment sum and shipped item quantity while preserving orders that have zero payments or zero shipments.'
      },
      {
        title: 'Step 3: Anti-Join Detection of Paid-But-Unshipped & Overcharged Orders',
        concept: 'Relational Anti-Join and Settlement Invariant Filtering',
        targetSymbol: 'OrderReconciliationEngine.findAnomalies',
        hint: 'Identify orders where paid_cents > 0 && shipped_qty === 0 or paid_cents !== order.total_cents.',
        explanation: 'Implement `findAnomalies(reconciledOrders)` to classify orders into `paidUnshipped` and `amountMismatch` buckets for financial audit.'
      },
      {
        title: 'Step 4: FULL OUTER JOIN Gateway Settlement Reconciler',
        concept: 'Symmetric Difference Across Internal Orders and External Stripe Captures',
        targetSymbol: 'OrderReconciliationEngine.fullOuterReconcile',
        hint: 'Union all order_ids from both sets and classify each as MATCHED, MISSING_INTERNAL, MISSING_GATEWAY, or AMOUNT_DRIFT.',
        explanation: 'Implement `fullOuterReconcile(internalOrders, gatewayCharges)` to perform a `FULL OUTER JOIN` on `order_id` and surface orphan gateway charges, missing gateway captures, and cent-level drift.'
      }
    ],
    starterCode: `'use strict';

class OrderReconciliationEngine {
  static aggregateByOrder(rows, statusFilter, amountField) {
    // TODO (Step 1): Return Map<order_id, { count, total }> for rows where row.status === statusFilter
    return new Map();
  }

  static leftJoinOrders(orders, payments, shipments) {
    // TODO (Step 2): Join orders with pre-aggregated captured payments and delivered shipments without row fan-out
    return [];
  }

  static findAnomalies(reconciledOrders) {
    // TODO (Step 3): Return { paidUnshipped: [...], amountMismatch: [...] }
    return { paidUnshipped: [], amountMismatch: [] };
  }

  static fullOuterReconcile(internalOrders, gatewayCharges) {
    // TODO (Step 4): Perform FULL OUTER JOIN on order_id and classify each key
    return [];
  }
}

module.exports = { OrderReconciliationEngine };
`,
    solutionCode: `'use strict';

class OrderReconciliationEngine {
  static aggregateByOrder(rows, statusFilter, amountField) {
    const map = new Map();
    for (const r of rows) {
      if (statusFilter && r.status !== statusFilter) continue;
      const cur = map.get(r.order_id) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(r[amountField] || 0);
      map.set(r.order_id, cur);
    }
    return map;
  }

  static leftJoinOrders(orders, payments, shipments) {
    const payMap = this.aggregateByOrder(payments, 'captured', 'amount_cents');
    const shipMap = this.aggregateByOrder(shipments, 'shipped', 'qty');
    return orders.map(o => {
      const p = payMap.get(o.id) || { count: 0, total: 0 };
      const s = shipMap.get(o.id) || { count: 0, total: 0 };
      return {
        order_id: o.id,
        total_cents: o.total_cents,
        paid_cents: p.total,
        payment_count: p.count,
        shipped_qty: s.total,
        shipment_count: s.count
      };
    });
  }

  static findAnomalies(reconciledOrders) {
    const paidUnshipped = [];
    const amountMismatch = [];
    for (const r of reconciledOrders) {
      if (r.paid_cents > 0 && r.shipped_qty === 0) paidUnshipped.push(r.order_id);
      if (r.paid_cents !== r.total_cents) amountMismatch.push(r.order_id);
    }
    return { paidUnshipped, amountMismatch };
  }

  static fullOuterReconcile(internalOrders, gatewayCharges) {
    const intMap = new Map(internalOrders.map(o => [o.id, o.total_cents]));
    const gwMap = new Map(gatewayCharges.map(g => [g.order_id, g.captured_cents]));
    const allKeys = Array.from(new Set([...intMap.keys(), ...gwMap.keys()])).sort((a, b) => a - b);
    return allKeys.map(order_id => {
      const hasInt = intMap.has(order_id);
      const hasGw = gwMap.has(order_id);
      const internal_cents = hasInt ? intMap.get(order_id) : null;
      const gateway_cents = hasGw ? gwMap.get(order_id) : null;
      let status = 'MATCHED';
      if (!hasInt) status = 'MISSING_INTERNAL';
      else if (!hasGw) status = 'MISSING_GATEWAY';
      else if (internal_cents !== gateway_cents) status = 'AMOUNT_DRIFT';
      return { order_id, internal_cents, gateway_cents, status };
    });
  }
}

module.exports = { OrderReconciliationEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const orders = [
    { id: 1, total_cents: 5000 },
    { id: 2, total_cents: 3000 },
    { id: 3, total_cents: 4000 }
  ];
  const payments = [
    { order_id: 1, status: 'captured', amount_cents: 2000 },
    { order_id: 1, status: 'captured', amount_cents: 3000 },
    { order_id: 2, status: 'captured', amount_cents: 3000 },
    { order_id: 3, status: 'failed', amount_cents: 4000 }
  ];
  const shipments = [
    { order_id: 1, status: 'shipped', qty: 1 },
    { order_id: 1, status: 'shipped', qty: 2 }
  ];

  const joined = OrderReconciliationEngine.leftJoinOrders(orders, payments, shipments);
  assert.equal(joined.length, 3);
  assert.equal(joined[0].paid_cents, 5000);
  assert.equal(joined[0].shipped_qty, 3);

  const anomalies = OrderReconciliationEngine.findAnomalies(joined);
  assert.deepEqual(anomalies.paidUnshipped, [2]);
  assert.deepEqual(anomalies.amountMismatch, [3]);

  const full = OrderReconciliationEngine.fullOuterReconcile(orders, [
    { order_id: 1, captured_cents: 5000 },
    { order_id: 2, captured_cents: 2500 },
    { order_id: 99, captured_cents: 1200 }
  ]);
  assert.deepEqual(full.map(r => r.status), ['MATCHED', 'AMOUNT_DRIFT', 'MISSING_GATEWAY', 'MISSING_INTERNAL']);
  return true;
}
runTests();
`
  },
  {
    id: 'build-executive-kpi-aggregation-suite',
    title: 'Multi-Dimensional Revenue, Cohort & Funnel Aggregation Suite',
    category: 'Aggregation & Grouping Sets',
    difficulty: 'Intermediate',
    estimatedMinutes: 35,
    pinned: false,
    summary: 'A single-pass multi-dimensional OLAP aggregation engine implementing conditional FILTER (WHERE ...), GROUPING SETS / ROLLUP subtotals with bitmask GROUPING() flags, and exact/interpolated percentiles.',
    highlights: [
      'Single-pass conditional aggregation equivalent to COUNT/SUM(...) FILTER (WHERE ...)',
      'Hierarchical ROLLUP and GROUPING SETS generator with bitmask GROUPING(col) metadata',
      'Exact discrete (PERCENTILE_DISC) and continuous interpolated (PERCENTILE_CONT) quantiles'
    ],
    tags: ['GROUPING SETS', 'ROLLUP', 'Conditional Aggregation', 'FILTER Clause', 'Percentiles'],
    relatedSlugs: ['aggregate-functions-internals', 'group-by-execution-mechanics', 'having-vs-where-pipeline', 'conditional-aggregation-filter', 'grouping-sets-rollup-cube'],
    className: 'OlapAggregationSuite',
    steps: [
      {
        title: 'Step 1: Single-Pass Conditional Aggregation (FILTER Clause)',
        concept: 'Pivoting Funnel & Revenue Metrics in One Table Scan',
        targetSymbol: 'OlapAggregationSuite.conditionalAggregate',
        hint: 'Accumulate totalOrders, paidOrders, paidRevenue, and refundedRevenue in a single loop per group key.',
        explanation: 'Implement `conditionalAggregate(orders, groupCol)` to compute `total_orders`, `paid_orders`, `paid_revenue_cents`, and `refunded_revenue_cents` per group in a single table scan without self-joins.'
      },
      {
        title: 'Step 2: Hierarchical ROLLUP & Bitmask GROUPING() Indicator',
        concept: 'Generating Prefix Subtotals and Distinguishing Super-Aggregate NULLs',
        targetSymbol: 'OlapAggregationSuite.rollupRevenue',
        hint: 'Emit groupings for (region, plan), (region, null) with groupingMask=1, and (null, null) with groupingMask=3.',
        explanation: 'Implement `rollupRevenue(orders, dim1, dim2)` to compute hierarchical subtotals across `(dim1, dim2)`, `(dim1, null)`, and the grand total `(null, null)`, setting `grouping_id` (`0`, `1`, or `3`) to distinguish real `NULL` keys from rollup super-aggregates.'
      },
      {
        title: 'Step 3: Continuous Linear-Interpolated Percentile (PERCENTILE_CONT)',
        concept: 'Order-Set Aggregate Interpolation Between Adjacent Ranks',
        targetSymbol: 'OlapAggregationSuite.percentileCont',
        hint: 'Sort non-null values ascending; compute pos = p * (n - 1), lo = Math.floor(pos), hi = Math.ceil(pos).',
        explanation: 'Implement `percentileCont(values, p)` to ignore `null`/`undefined` inputs, sort the remaining numeric values, and linearly interpolate at fractional index `pos = p * (n - 1)`.'
      },
      {
        title: 'Step 4: HAVING Post-Aggregation Group Filter',
        concept: 'Filtering Aggregated Buckets After Group Collapse',
        targetSymbol: 'OlapAggregationSuite.filterHaving',
        hint: 'Filter the aggregated summary array using havingPredicate(groupSummary).',
        explanation: 'Implement `filterHaving(groups, minPaidRevenueCents, minConversionRate)` to retain only groups meeting post-aggregation business thresholds.'
      }
    ],
    starterCode: `'use strict';

class OlapAggregationSuite {
  static conditionalAggregate(orders, groupCol) {
    // TODO (Step 1): Group by groupCol and compute total_orders, paid_orders, paid_revenue_cents, refunded_revenue_cents
    return [];
  }

  static rollupRevenue(orders, dim1, dim2) {
    // TODO (Step 2): Compute ROLLUP(dim1, dim2) with grouping_id bitmask (0, 1, 3) and revenue sum
    return [];
  }

  static percentileCont(values, p) {
    // TODO (Step 3): Compute SQL PERCENTILE_CONT(p) ignoring nulls
    return null;
  }

  static filterHaving(groups, minPaidRevenueCents, minConversionRate) {
    // TODO (Step 4): Filter aggregated groups by paid_revenue_cents and paid_orders / total_orders
    return [];
  }
}

module.exports = { OlapAggregationSuite };
`,
    solutionCode: `'use strict';

class OlapAggregationSuite {
  static conditionalAggregate(orders, groupCol) {
    const groups = new Map();
    for (const o of orders) {
      const k = o[groupCol];
      let g = groups.get(k);
      if (!g) {
        g = { [groupCol]: k, total_orders: 0, paid_orders: 0, paid_revenue_cents: 0, refunded_revenue_cents: 0 };
        groups.set(k, g);
      }
      g.total_orders += 1;
      if (o.status === 'paid') {
        g.paid_orders += 1;
        g.paid_revenue_cents += o.amount_cents || 0;
      } else if (o.status === 'refunded') {
        g.refunded_revenue_cents += o.amount_cents || 0;
      }
    }
    return Array.from(groups.values());
  }

  static rollupRevenue(orders, dim1, dim2) {
    const levels = [
      { mask: 0, keyFn: o => \`\${o[dim1]}|\${o[dim2]}\`, d1: o => o[dim1], d2: o => o[dim2] },
      { mask: 1, keyFn: o => \`\${o[dim1]}|*\`, d1: o => o[dim1], d2: () => null },
      { mask: 3, keyFn: () => '*|*', d1: () => null, d2: () => null }
    ];
    const out = [];
    for (const lvl of levels) {
      const map = new Map();
      for (const o of orders) {
        const k = lvl.keyFn(o);
        let row = map.get(k);
        if (!row) {
          row = { [dim1]: lvl.d1(o), [dim2]: lvl.d2(o), grouping_id: lvl.mask, revenue_cents: 0 };
          map.set(k, row);
        }
        row.revenue_cents += o.amount_cents || 0;
      }
      out.push(...map.values());
    }
    return out;
  }

  static percentileCont(values, p) {
    const clean = values.filter(v => v !== null && v !== undefined && !Number.isNaN(v)).sort((a, b) => a - b);
    if (clean.length === 0) return null;
    const pos = p * (clean.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    const frac = pos - lo;
    return clean[lo] + frac * (clean[hi] - clean[lo]);
  }

  static filterHaving(groups, minPaidRevenueCents, minConversionRate) {
    return groups.filter(g => {
      const rate = g.total_orders > 0 ? g.paid_orders / g.total_orders : 0;
      return g.paid_revenue_cents >= minPaidRevenueCents && rate >= minConversionRate;
    });
  }
}

module.exports = { OlapAggregationSuite };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const orders = [
    { region: 'US', plan: 'Pro', status: 'paid', amount_cents: 1000 },
    { region: 'US', plan: 'Pro', status: 'refunded', amount_cents: 500 },
    { region: 'US', plan: 'Enterprise', status: 'paid', amount_cents: 4000 },
    { region: 'EU', plan: 'Pro', status: 'paid', amount_cents: 800 }
  ];

  const cond = OlapAggregationSuite.conditionalAggregate(orders, 'region');
  const us = cond.find(r => r.region === 'US');
  assert.equal(us.total_orders, 3);
  assert.equal(us.paid_orders, 2);
  assert.equal(us.paid_revenue_cents, 5000);
  assert.equal(us.refunded_revenue_cents, 500);

  const rollup = OlapAggregationSuite.rollupRevenue(orders, 'region', 'plan');
  const grand = rollup.find(r => r.grouping_id === 3);
  assert.equal(grand.revenue_cents, 6300);

  assert.equal(OlapAggregationSuite.percentileCont([10, 20, null, 30, 40], 0.5), 25);
  const having = OlapAggregationSuite.filterHaving(cond, 2000, 0.5);
  assert.equal(having.length, 1);
  assert.equal(having[0].region, 'US');
  return true;
}
runTests();
`
  },
  {
    id: 'build-hierarchical-graph-query-engine',
    title: 'Bill-of-Materials & Social Graph Reachability Engine',
    category: 'Subqueries, CTEs & Recursion',
    difficulty: 'Advanced',
    estimatedMinutes: 40,
    pinned: true,
    summary: 'A fixed-point recursive CTE execution engine supporting working-table iteration, UNION vs UNION ALL deduplication, path-array cycle detection, Bill-of-Materials cost rollup, and NULL-safe NOT EXISTS anti-joins.',
    highlights: [
      'Fixed-point iterative working-table evaluation matching SQL WITH RECURSIVE semantics',
      'Path-vector cycle detection preventing infinite loops on cyclic dependency graphs',
      'Bill-of-Materials component multiplication and NULL-safe NOT EXISTS anti-join evaluation'
    ],
    tags: ['Recursive CTE', 'Graph Traversal', 'Cycle Detection', 'Bill of Materials', 'NOT EXISTS'],
    relatedSlugs: ['scalar-row-table-subqueries', 'correlated-subqueries-mechanics', 'exists-not-exists-null-safety', 'lateral-joins-cross-apply', 'recursive-ctes-hierarchies-graphs'],
    className: 'RecursiveGraphEngine',
    steps: [
      {
        title: 'Step 1: Fixed-Point WITH RECURSIVE Iterator with Cycle Detection',
        concept: 'Anchor Member + Iterative Working Table Expansion with Visited Path Array',
        targetSymbol: 'RecursiveGraphEngine.traverseHierarchy',
        hint: 'Seed working table with anchor nodes; in each step expand children where !node.path.includes(childId).',
        explanation: 'Implement `traverseHierarchy(edges, rootId, maxDepth)` using SQL `WITH RECURSIVE` working-table semantics. Track `path: [...parent.path, childId]` on every tuple and skip any edge where `parent.path.includes(childId)` to prevent infinite recursion on cyclic graphs.'
      },
      {
        title: 'Step 2: Bill-of-Materials (BOM) Multiplicative Quantity & Cost Rollup',
        concept: 'Propagating Component Quantities Down Assembly Trees',
        targetSymbol: 'RecursiveGraphEngine.computeBomCost',
        hint: 'Multiply parent.extendedQty * edge.qty down the hierarchy and sum leaf unit_cost * extendedQty.',
        explanation: 'Implement `computeBomCost(bomEdges, unitCosts, rootPartId)` to recursively expand sub-assemblies, multiplying component quantities along each root-to-leaf path and summing total unit costs.'
      },
      {
        title: 'Step 3: NULL-Safe NOT EXISTS Anti-Join vs NOT IN Trap',
        concept: 'Why NOT EXISTS Succeeds When Subquery Output Contains NULL',
        targetSymbol: 'RecursiveGraphEngine.notExistsAntiJoin',
        hint: 'Return outer rows where !innerRows.some(inRow => inRow[key] !== null && inRow[key] === outRow[key]).',
        explanation: 'Implement `notExistsAntiJoin(outerRows, innerRows, key)` so that `null` values in `innerRows` never poison the anti-join result (unlike `NOT IN`).'
      },
      {
        title: 'Step 4: Correlated LATERAL Top-K Per Parent Node',
        concept: 'Evaluating a Parameterized Subquery Per Outer Tuple (CROSS APPLY)',
        targetSymbol: 'RecursiveGraphEngine.lateralTopK',
        hint: 'For each parent row, filter childRows matching parent.id, sort descending by metricCol, and take k.',
        explanation: 'Implement `lateralTopK(parents, children, fkCol, metricCol, k)` to execute a correlated top-$k$ subquery for each parent row.'
      }
    ],
    starterCode: `'use strict';

class RecursiveGraphEngine {
  static traverseHierarchy(edges, rootId, maxDepth = 10) {
    // TODO (Step 1): Execute WITH RECURSIVE from rootId with path cycle detection
    return [];
  }

  static computeBomCost(bomEdges, unitCosts, rootPartId) {
    // TODO (Step 2): Roll up total leaf component cost across recursive sub-assemblies
    return 0;
  }

  static notExistsAntiJoin(outerRows, innerRows, key) {
    // TODO (Step 3): Return outer rows with no matching key in innerRows, safely ignoring NULLs in innerRows
    return [];
  }

  static lateralTopK(parents, children, fkCol, metricCol, k = 2) {
    // TODO (Step 4): For each parent, attach top k children ordered by metricCol DESC
    return [];
  }
}

module.exports = { RecursiveGraphEngine };
`,
    solutionCode: `'use strict';

class RecursiveGraphEngine {
  static traverseHierarchy(edges, rootId, maxDepth = 10) {
    const result = [{ id: rootId, parent_id: null, depth: 0, path: [rootId] }];
    let working = result.slice();

    while (working.length > 0) {
      const nextWorking = [];
      for (const cur of working) {
        if (cur.depth >= maxDepth) continue;
        for (const e of edges) {
          if (e.parent_id === cur.id && !cur.path.includes(e.child_id)) {
            const tuple = {
              id: e.child_id,
              parent_id: cur.id,
              depth: cur.depth + 1,
              path: [...cur.path, e.child_id]
            };
            nextWorking.push(tuple);
            result.push(tuple);
          }
        }
      }
      working = nextWorking;
    }
    return result;
  }

  static computeBomCost(bomEdges, unitCosts, rootPartId) {
    let working = [{ part_id: rootPartId, qty: 1, path: [rootPartId] }];
    let totalCost = 0;

    while (working.length > 0) {
      const next = [];
      for (const item of working) {
        const subParts = bomEdges.filter(e => e.parent_part === item.part_id);
        if (subParts.length === 0) {
          totalCost += item.qty * (unitCosts[item.part_id] || 0);
        } else {
          for (const sub of subParts) {
            if (!item.path.includes(sub.child_part)) {
              next.push({
                part_id: sub.child_part,
                qty: item.qty * sub.qty,
                path: [...item.path, sub.child_part]
              });
            }
          }
        }
      }
      working = next;
    }
    return totalCost;
  }

  static notExistsAntiJoin(outerRows, innerRows, key) {
    return outerRows.filter(out =>
      !innerRows.some(inn => inn[key] !== null && inn[key] !== undefined && inn[key] === out[key])
    );
  }

  static lateralTopK(parents, children, fkCol, metricCol, k = 2) {
    const out = [];
    for (const p of parents) {
      const top = children
        .filter(c => c[fkCol] === p.id)
        .sort((a, b) => b[metricCol] - a[metricCol])
        .slice(0, k);
      for (const c of top) {
        out.push({ parent_id: p.id, child_id: c.id, [metricCol]: c[metricCol] });
      }
    }
    return out;
  }
}

module.exports = { RecursiveGraphEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const edges = [
    { parent_id: 1, child_id: 2 },
    { parent_id: 2, child_id: 3 },
    { parent_id: 3, child_id: 1 }, // cycle back to root!
    { parent_id: 2, child_id: 4 }
  ];
  const tree = RecursiveGraphEngine.traverseHierarchy(edges, 1, 10);
  assert.deepEqual(tree.map(n => n.id), [1, 2, 3, 4]);

  const bom = [
    { parent_part: 'BIKE', child_part: 'WHEEL', qty: 2 },
    { parent_part: 'BIKE', child_part: 'FRAME', qty: 1 },
    { parent_part: 'WHEEL', child_part: 'SPOKE', qty: 30 },
    { parent_part: 'WHEEL', child_part: 'RIM', qty: 1 }
  ];
  const costs = { SPOKE: 1, RIM: 20, FRAME: 100 };
  assert.equal(RecursiveGraphEngine.computeBomCost(bom, costs, 'BIKE'), 2 * (30 * 1 + 20) + 100);

  const anti = RecursiveGraphEngine.notExistsAntiJoin(
    [{ id: 1 }, { id: 2 }, { id: 3 }],
    [{ id: 1 }, { id: null }],
    'id'
  );
  assert.deepEqual(anti.map(r => r.id), [2, 3]);

  const lat = RecursiveGraphEngine.lateralTopK(
    [{ id: 10 }, { id: 20 }],
    [
      { id: 1, dept_id: 10, salary: 100 },
      { id: 2, dept_id: 10, salary: 300 },
      { id: 3, dept_id: 10, salary: 200 },
      { id: 4, dept_id: 20, salary: 150 }
    ],
    'dept_id',
    'salary',
    2
  );
  assert.deepEqual(lat.map(r => r.child_id), [2, 3, 4]);
  return true;
}
runTests();
`
  },
  {
    id: 'build-sessionization-retention-engine',
    title: 'Clickstream Sessionizer, Streak Tracker & Rolling Window Analyzer',
    category: 'Window Functions & Analytics',
    difficulty: 'Advanced',
    estimatedMinutes: 40,
    pinned: true,
    summary: 'An analytical window function engine implementing LAG()-based clickstream sessionization, ROW_NUMBER() date-difference islands for consecutive activity streaks, and ROWS vs RANGE sliding window frames.',
    highlights: [
      'Clickstream sessionization via LAG(ts) inactivity threshold detection and cumulative SUM() session IDs',
      'Gaps-and-Islands streak length calculation using the date - ROW_NUMBER() constant-difference invariant',
      'Exact physical ROWS vs logical value-based RANGE window frame evaluation with peer grouping'
    ],
    tags: ['Window Functions', 'Sessionization', 'Gaps and Islands', 'ROWS vs RANGE', 'Sliding Windows'],
    relatedSlugs: ['window-functions-mental-model', 'partition-by-order-by-mechanics', 'value-navigation-lag-lead-first-last', 'window-frames-rows-range-groups', 'gaps-and-islands-sessionization'],
    className: 'WindowAnalyticsEngine',
    steps: [
      {
        title: 'Step 1: Clickstream Sessionization via LAG() & Cumulative Sum',
        concept: 'Two-Stage Window Pipeline: Inactivity Flagging + Running Session Counter',
        targetSymbol: 'WindowAnalyticsEngine.sessionizeEvents',
        hint: 'Sort by user_id, tsSec; mark isNewSession = (prevTs === null || tsSec - prevTs > timeoutSec ? 1 : 0), then accumulate session_num.',
        explanation: 'Implement `sessionizeEvents(events, timeoutSec)` to partition events by `user_id`, order by `tsSec`, compute `LAG(tsSec)`, flag new sessions whenever `tsSec - prevTs > timeoutSec`, and assign a running `session_id` via cumulative sum.'
      },
      {
        title: 'Step 2: Gaps-and-Islands Consecutive Day Streak Finder',
        concept: 'Constant Difference Invariant: dayIndex - ROW_NUMBER() OVER (PARTITION BY user ORDER BY dayIndex)',
        targetSymbol: 'WindowAnalyticsEngine.computeStreaks',
        hint: 'Deduplicate (user_id, dayIndex), sort ascending, group by islandKey = dayIndex - rowNumber, and return streak start, end, and length.',
        explanation: 'Implement `computeStreaks(activityDays)` using the classic Gaps-and-Islands invariant: subtracting sequential `ROW_NUMBER()` from integer `dayIndex` yields a constant `islandKey` across consecutive days.'
      },
      {
        title: 'Step 3: Physical ROWS Window Frame Moving Average',
        concept: 'Evaluating ROWS BETWEEN k PRECEDING AND CURRENT ROW',
        targetSymbol: 'WindowAnalyticsEngine.movingAvgRows',
        hint: 'For index i, slice rows from Math.max(0, i - precedingRows) to i + 1 and average the metric.',
        explanation: 'Implement `movingAvgRows(rows, metricCol, precedingRows)` to compute the physical row-count sliding window average.'
      },
      {
        title: 'Step 4: Logical RANGE Window Frame Sum with Peer Ties',
        concept: 'Evaluating RANGE BETWEEN delta PRECEDING AND CURRENT ROW Including All Peer Ties',
        targetSymbol: 'WindowAnalyticsEngine.movingSumRange',
        hint: 'Include all rows j where rows[j].orderVal >= rows[i].orderVal - delta && rows[j].orderVal <= rows[i].orderVal.',
        explanation: 'Implement `movingSumRange(rows, orderCol, metricCol, delta)` to sum all tuples whose `orderCol` falls within `[curOrder - delta, curOrder]`, including all duplicate peer timestamps.'
      }
    ],
    starterCode: `'use strict';

class WindowAnalyticsEngine {
  static sessionizeEvents(events, timeoutSec = 1800) {
    // TODO (Step 1): Partition by user_id, order by tsSec, flag gap > timeoutSec, and assign session_num (1, 2, ...)
    return [];
  }

  static computeStreaks(activityDays) {
    // TODO (Step 2): Deduplicate (user_id, dayIndex) and group consecutive days via dayIndex - rowNum
    return [];
  }

  static movingAvgRows(rows, metricCol, precedingRows = 2) {
    // TODO (Step 3): Compute ROWS BETWEEN precedingRows PRECEDING AND CURRENT ROW average
    return [];
  }

  static movingSumRange(rows, orderCol, metricCol, delta) {
    // TODO (Step 4): Compute RANGE BETWEEN delta PRECEDING AND CURRENT ROW sum (including peer ties)
    return [];
  }
}

module.exports = { WindowAnalyticsEngine };
`,
    solutionCode: `'use strict';

class WindowAnalyticsEngine {
  static sessionizeEvents(events, timeoutSec = 1800) {
    const sorted = events.slice().sort((a, b) =>
      a.user_id !== b.user_id ? a.user_id - b.user_id : a.tsSec - b.tsSec
    );
    const out = [];
    let prevUser = null;
    let prevTs = null;
    let sessionNum = 0;

    for (const ev of sorted) {
      if (ev.user_id !== prevUser) {
        prevUser = ev.user_id;
        prevTs = null;
        sessionNum = 0;
      }
      const isNew = prevTs === null || (ev.tsSec - prevTs) > timeoutSec ? 1 : 0;
      sessionNum += isNew;
      prevTs = ev.tsSec;
      out.push({ ...ev, is_new_session: isNew, session_num: sessionNum });
    }
    return out;
  }

  static computeStreaks(activityDays) {
    const byUser = new Map();
    for (const r of activityDays) {
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, new Set());
      byUser.get(r.user_id).add(r.dayIndex);
    }
    const streaks = [];
    for (const [user_id, daySet] of byUser.entries()) {
      const days = Array.from(daySet).sort((a, b) => a - b);
      const islands = new Map();
      days.forEach((dayIndex, idx) => {
        const rn = idx + 1;
        const islandKey = dayIndex - rn;
        if (!islands.has(islandKey)) {
          islands.set(islandKey, { user_id, startDay: dayIndex, endDay: dayIndex, length: 0 });
        }
        const isl = islands.get(islandKey);
        isl.endDay = dayIndex;
        isl.length += 1;
      });
      streaks.push(...islands.values());
    }
    return streaks;
  }

  static movingAvgRows(rows, metricCol, precedingRows = 2) {
    return rows.map((r, i) => {
      const start = Math.max(0, i - precedingRows);
      let sum = 0;
      let count = 0;
      for (let j = start; j <= i; j++) {
        sum += rows[j][metricCol];
        count += 1;
      }
      return { ...r, moving_avg: sum / count };
    });
  }

  static movingSumRange(rows, orderCol, metricCol, delta) {
    const sorted = rows.slice().sort((a, b) => a[orderCol] - b[orderCol]);
    return sorted.map(r => {
      const curVal = r[orderCol];
      let sum = 0;
      for (const peer of sorted) {
        if (peer[orderCol] >= curVal - delta && peer[orderCol] <= curVal) {
          sum += peer[metricCol];
        }
      }
      return { ...r, range_sum: sum };
    });
  }
}

module.exports = { WindowAnalyticsEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const events = [
    { user_id: 1, tsSec: 100 },
    { user_id: 1, tsSec: 500 },
    { user_id: 1, tsSec: 3000 },
    { user_id: 2, tsSec: 200 }
  ];
  const sess = WindowAnalyticsEngine.sessionizeEvents(events, 1800);
  assert.deepEqual(sess.map(s => s.session_num), [1, 1, 2, 1]);

  const streaks = WindowAnalyticsEngine.computeStreaks([
    { user_id: 1, dayIndex: 1 },
    { user_id: 1, dayIndex: 2 },
    { user_id: 1, dayIndex: 2 }, // duplicate same-day login
    { user_id: 1, dayIndex: 3 },
    { user_id: 1, dayIndex: 6 },
    { user_id: 1, dayIndex: 7 }
  ]);
  assert.equal(streaks.length, 2);
  assert.equal(streaks[0].length, 3);
  assert.equal(streaks[1].length, 2);

  const series = [
    { day: 1, val: 10 },
    { day: 1, val: 20 }, // peer tie on day=1
    { day: 2, val: 30 }
  ];
  const rowsAvg = WindowAnalyticsEngine.movingAvgRows(series, 'val', 1);
  assert.equal(rowsAvg[0].moving_avg, 10);
  assert.equal(rowsAvg[1].moving_avg, 15);

  const rangeSum = WindowAnalyticsEngine.movingSumRange(series, 'day', 'val', 0);
  assert.equal(rangeSum[0].range_sum, 30); // RANGE includes both day=1 peers!
  return true;
}
runTests();
`
  },
  {
    id: 'build-normalized-booking-schema',
    title: 'Normalize a Legacy Flat Spreadsheet into a 3NF/BCNF System',
    category: 'Relational Schema Design & Normalization',
    difficulty: 'Advanced',
    estimatedMinutes: 40,
    pinned: false,
    summary: 'An algorithmic functional dependency analyzer implementing Armstrong’s Axiom attribute closure X+, candidate key discovery, BCNF violation detection, and lossless-join decomposition.',
    highlights: [
      'Attribute closure X+ fixed-point computation via Armstrong’s Axioms',
      'Minimal superkey / candidate key synthesis over arbitrary functional dependency sets',
      'Automated BCNF violation detector and lossless-join relation decomposition'
    ],
    tags: ['Functional Dependencies', 'Attribute Closure', '3NF & BCNF', 'Lossless Decomposition', 'Normalization'],
    relatedSlugs: ['entity-relationship-modeling', 'functional-dependencies-keys', 'first-normal-form-atomicity', 'second-third-normal-form', 'boyce-codd-higher-normal-forms'],
    className: 'NormalizationEngine',
    steps: [
      {
        title: 'Step 1: Attribute Closure (X+) via Armstrong’s Reflexivity & Transitivity',
        concept: 'Fixed-Point Expansion of Determined Attributes',
        targetSymbol: 'NormalizationEngine.attributeClosure',
        hint: 'Repeatedly add fd.right attributes into closure whenever every attribute in fd.left is already in closure.',
        explanation: 'Implement `attributeClosure(attrs, fds)` to compute the attribute closure $X^+$ of an attribute set `attrs` under a set of functional dependencies `fds = [{ left: [...], right: [...] }]`.'
      },
      {
        title: 'Step 2: Superkey & Candidate Key Verification',
        concept: 'Testing Whether X+ Covers All Relation Attributes R',
        targetSymbol: 'NormalizationEngine.isSuperkey',
        hint: 'Compute attributeClosure(candidateAttrs, fds) and check if every attribute of allAttrs is present.',
        explanation: 'Implement `isSuperkey(allAttrs, candidateAttrs, fds)` by testing whether the attribute closure of `candidateAttrs` equals the universal attribute set `allAttrs`.'
      },
      {
        title: 'Step 3: BCNF Violation Detector',
        concept: 'Identifying Non-Trivial FDs X -> Y Where X Is Not a Superkey',
        targetSymbol: 'NormalizationEngine.findBcnfViolations',
        hint: 'For each FD, filter out right attributes already in left; if remaining right is non-empty and !isSuperkey(allAttrs, fd.left, fds), record violation.',
        explanation: 'Implement `findBcnfViolations(allAttrs, fds)` to return every non-trivial functional dependency $X \\to Y$ whose determinant $X$ is not a superkey of `allAttrs`.'
      },
      {
        title: 'Step 4: Lossless-Join BCNF Decomposition & Flat-Row Projection',
        concept: 'Splitting R Into R1 = X+ and R2 = (R - (X+ - X)) Without Spurious Tuples',
        targetSymbol: 'NormalizationEngine.decomposeBcnfStep',
        hint: 'Compute closure = attributeClosure(violatingFd.left, fds); R1 = closure, R2 = allAttrs minus (closure - violatingFd.left).',
        explanation: 'Implement `decomposeBcnfStep(allAttrs, violatingFd, fds)` to perform one lossless-join BCNF split into `{ r1, r2 }` and project a flat spreadsheet dataset into deduplicated normalized relations.'
      }
    ],
    starterCode: `'use strict';

class NormalizationEngine {
  static attributeClosure(attrs, fds) {
    // TODO (Step 1): Compute X+ closure as a sorted array of attribute names
    return [];
  }

  static isSuperkey(allAttrs, candidateAttrs, fds) {
    // TODO (Step 2): Return true iff attributeClosure(candidateAttrs, fds) contains allAttrs
    return false;
  }

  static findBcnfViolations(allAttrs, fds) {
    // TODO (Step 3): Return all non-trivial FDs where fd.left is not a superkey of allAttrs
    return [];
  }

  static decomposeBcnfStep(allAttrs, violatingFd, fds) {
    // TODO (Step 4): Split allAttrs into { r1: X+, r2: R - (X+ - X) }
    return { r1: [], r2: [] };
  }
}

module.exports = { NormalizationEngine };
`,
    solutionCode: `'use strict';

class NormalizationEngine {
  static attributeClosure(attrs, fds) {
    const closure = new Set(attrs);
    let changed = true;
    while (changed) {
      changed = false;
      for (const fd of fds) {
        if (fd.left.every(a => closure.has(a))) {
          for (const b of fd.right) {
            if (!closure.has(b)) {
              closure.add(b);
              changed = true;
            }
          }
        }
      }
    }
    return Array.from(closure).sort();
  }

  static isSuperkey(allAttrs, candidateAttrs, fds) {
    const closure = new Set(this.attributeClosure(candidateAttrs, fds));
    return allAttrs.every(a => closure.has(a));
  }

  static findBcnfViolations(allAttrs, fds) {
    return fds.filter(fd => {
      const nonTrivialRight = fd.right.filter(r => !fd.left.includes(r));
      if (nonTrivialRight.length === 0) return false;
      return !this.isSuperkey(allAttrs, fd.left, fds);
    });
  }

  static decomposeBcnfStep(allAttrs, violatingFd, fds) {
    const xPlus = this.attributeClosure(violatingFd.left, fds);
    const leftSet = new Set(violatingFd.left);
    const xPlusMinusX = new Set(xPlus.filter(a => !leftSet.has(a)));
    const r1 = xPlus;
    const r2 = allAttrs.filter(a => !xPlusMinusX.has(a)).sort();
    return { r1, r2 };
  }
}

module.exports = { NormalizationEngine };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const allAttrs = ['booking_id', 'room_id', 'building', 'guest_id', 'guest_email'];
  const fds = [
    { left: ['booking_id'], right: ['room_id', 'guest_id'] },
    { left: ['room_id'], right: ['building'] },
    { left: ['guest_id'], right: ['guest_email'] }
  ];

  const closure = NormalizationEngine.attributeClosure(['booking_id'], fds);
  assert.deepEqual(closure, ['booking_id', 'building', 'guest_email', 'guest_id', 'room_id']);
  assert.equal(NormalizationEngine.isSuperkey(allAttrs, ['booking_id'], fds), true);
  assert.equal(NormalizationEngine.isSuperkey(allAttrs, ['room_id'], fds), false);

  const violations = NormalizationEngine.findBcnfViolations(allAttrs, fds);
  assert.equal(violations.length, 2);

  const split = NormalizationEngine.decomposeBcnfStep(allAttrs, { left: ['room_id'], right: ['building'] }, fds);
  assert.deepEqual(split.r1, ['building', 'room_id']);
  assert.deepEqual(split.r2, ['booking_id', 'guest_email', 'guest_id', 'room_id']);
  return true;
}
runTests();
`
  },
  {
    id: 'build-scd-type2-warehouse-pipeline',
    title: 'Star Schema with Automated SCD Type 2 Dimension Pipeline',
    category: 'Dimensional Modeling & Kimball OLAP',
    difficulty: 'Advanced',
    estimatedMinutes: 40,
    pinned: false,
    summary: 'A Kimball dimensional warehouse pipeline implementing automated Slowly Changing Dimension (SCD Type 2) effective date range versioning, surrogate key assignment, and point-in-time historical fact-to-dimension joins.',
    highlights: [
      'Automated SCD Type 2 change detection expiring prior version rows and inserting new surrogate keys',
      'Half-open [valid_from, valid_to) temporal interval invariants with is_current boolean flags',
      'As-was point-in-time historical fact table enrichment resolving surrogate keys by event timestamp'
    ],
    tags: ['Star Schema', 'SCD Type 2', 'Surrogate Keys', 'Point-in-Time Join', 'Kimball OLAP'],
    relatedSlugs: ['oltp-vs-olap-workload-physics', 'star-schema-facts-dimensions', 'snowflake-vs-star-vs-obt', 'slowly-changing-dimensions-scd', 'fact-table-types-grain'],
    className: 'ScdType2Pipeline',
    steps: [
      {
        title: 'Step 1: Initial Dimension Seed & Surrogate Key Allocation',
        concept: 'Decoupling Warehouse Surrogate Keys from Operational Natural Keys',
        targetSymbol: 'ScdType2Pipeline.applyChange',
        hint: 'If no current row exists for naturalKey, insert a new version with valid_from = changeTs, valid_to = "9999-12-31", is_current = true.',
        explanation: 'Implement the initial insert path in `applyChange(naturalKey, attrs, changeTs)` to allocate a monotonically increasing `sk` (surrogate key) and initialize `[valid_from, "9999-12-31")` with `is_current: true`.'
      },
      {
        title: 'Step 2: SCD Type 2 Attribute Diffing & Prior Row Expiration',
        concept: 'Closing [valid_from, changeTs) on Attribute Drift and Appending a New Current Version',
        targetSymbol: 'ScdType2Pipeline.applyChange',
        hint: 'If current row attributes match attrs, do nothing (idempotent); otherwise set current.valid_to = changeTs, current.is_current = false, and insert new version.',
        explanation: 'Complete `applyChange(naturalKey, attrs, changeTs)` so that when tracked attributes change, the existing current version is expired (`valid_to = changeTs`, `is_current = false`) and a new current version is appended; if attributes are unchanged, perform a no-op.'
      },
      {
        title: 'Step 3: Point-in-Time Historical Surrogate Key Lookup',
        concept: 'Half-Open Interval Containment: valid_from <= eventTs < valid_to',
        targetSymbol: 'ScdType2Pipeline.lookupSurrogateKeyAsOf',
        hint: 'Find the dimension version for naturalKey where row.valid_from <= eventTs && eventTs < row.valid_to.',
        explanation: 'Implement `lookupSurrogateKeyAsOf(naturalKey, eventTs)` using half-open interval logic (`valid_from <= eventTs && eventTs < valid_to`) so boundary timestamps match exactly one version.'
      },
      {
        title: 'Step 4: As-Was Historical Fact Table Star Join & Aggregation',
        concept: 'Attributing Fact Revenue to the Dimension Attribute Active at Event Time',
        targetSymbol: 'ScdType2Pipeline.enrichAndAggregateFacts',
        hint: 'Resolve each fact’s historical dimension row via lookupSurrogateKeyAsOf and sum amount_cents by the historical tier.',
        explanation: 'Implement `enrichAndAggregateFacts(facts)` to join each fact event to the dimension version that was active at `fact.eventTs` and aggregate revenue by historical tier.'
      }
    ],
    starterCode: `'use strict';

class ScdType2Pipeline {
  constructor() {
    this.nextSk = 1;
    this.dimRows = [];
  }

  applyChange(naturalKey, attrs, changeTs) {
    // TODO (Step 1 & 2): Insert initial version or expire current version and append new SCD2 row on attribute drift
  }

  lookupSurrogateKeyAsOf(naturalKey, eventTs) {
    // TODO (Step 3): Return dimension row for naturalKey where valid_from <= eventTs < valid_to
    return null;
  }

  enrichAndAggregateFacts(facts) {
    // TODO (Step 4): Join each fact { naturalKey, eventTs, amount_cents } to its historical SCD2 row and sum by tier
    return {};
  }
}

module.exports = { ScdType2Pipeline };
`,
    solutionCode: `'use strict';

class ScdType2Pipeline {
  constructor() {
    this.nextSk = 1;
    this.dimRows = [];
  }

  applyChange(naturalKey, attrs, changeTs) {
    const current = this.dimRows.find(r => r.naturalKey === naturalKey && r.is_current);
    if (!current) {
      const row = {
        sk: this.nextSk++,
        naturalKey,
        ...attrs,
        valid_from: changeTs,
        valid_to: '9999-12-31',
        is_current: true
      };
      this.dimRows.push(row);
      return row;
    }

    const changed = Object.keys(attrs).some(k => current[k] !== attrs[k]);
    if (!changed) return current;

    current.valid_to = changeTs;
    current.is_current = false;

    const nextRow = {
      sk: this.nextSk++,
      naturalKey,
      ...attrs,
      valid_from: changeTs,
      valid_to: '9999-12-31',
      is_current: true
    };
    this.dimRows.push(nextRow);
    return nextRow;
  }

  lookupSurrogateKeyAsOf(naturalKey, eventTs) {
    return this.dimRows.find(
      r => r.naturalKey === naturalKey && r.valid_from <= eventTs && eventTs < r.valid_to
    ) || null;
  }

  enrichAndAggregateFacts(facts) {
    const totalsByTier = {};
    for (const f of facts) {
      const dim = this.lookupSurrogateKeyAsOf(f.naturalKey, f.eventTs);
      const tier = dim ? dim.tier : 'UNKNOWN';
      totalsByTier[tier] = (totalsByTier[tier] || 0) + f.amount_cents;
    }
    return totalsByTier;
  }
}

module.exports = { ScdType2Pipeline };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const scd = new ScdType2Pipeline();
  scd.applyChange('cust_1', { tier: 'Free' }, '2025-01-01');
  scd.applyChange('cust_1', { tier: 'Free' }, '2025-02-01'); // idempotent no-op
  assert.equal(scd.dimRows.length, 1);

  scd.applyChange('cust_1', { tier: 'Pro' }, '2025-03-01');
  scd.applyChange('cust_1', { tier: 'Enterprise' }, '2025-06-01');
  assert.equal(scd.dimRows.length, 3);

  assert.equal(scd.lookupSurrogateKeyAsOf('cust_1', '2025-02-15').tier, 'Free');
  assert.equal(scd.lookupSurrogateKeyAsOf('cust_1', '2025-03-01').tier, 'Pro'); // half-open boundary!
  assert.equal(scd.lookupSurrogateKeyAsOf('cust_1', '2025-07-10').tier, 'Enterprise');

  const agg = scd.enrichAndAggregateFacts([
    { naturalKey: 'cust_1', eventTs: '2025-01-15', amount_cents: 100 },
    { naturalKey: 'cust_1', eventTs: '2025-04-10', amount_cents: 500 },
    { naturalKey: 'cust_1', eventTs: '2025-08-01', amount_cents: 2000 }
  ]);
  assert.deepEqual(agg, { Free: 100, Pro: 500, Enterprise: 2000 });
  return true;
}
runTests();
`
  },
  {
    id: 'build-saas-cohort-funnel-workbench',
    title: 'Complete SaaS Analytics Engine (MRR, Cohorts & Funnels)',
    category: 'Temporal, Cohort & Product Analytics',
    difficulty: 'Advanced',
    estimatedMinutes: 40,
    pinned: false,
    summary: 'A SaaS product analytics engine implementing gapless date spines, triangular cohort retention matrices, strict chronological funnel conversion attribution, and Allen interval overlap detection.',
    highlights: [
      'Triangular Month-0..Month-N cohort retention matrix with percentage normalization',
      'Strict temporal ordering funnel attribution (Signup -> Activated -> Subscribed)',
      'Allen interval algebra overlap predicate (startA < endB AND endA > startB) for concurrency and booking checks'
    ],
    tags: ['Cohort Retention', 'Funnel Attribution', 'Date Spine', 'Allen Interval Algebra', 'SaaS Metrics'],
    relatedSlugs: ['calendar-tables-date-spines', 'cohort-retention-matrix-sql', 'funnel-conversion-attribution-sql', 'interval-overlap-allen-algebra', 'bitemporal-tables-valid-transaction-time'],
    className: 'SaasAnalyticsWorkbench',
    steps: [
      {
        title: 'Step 1: Gapless Date Spine Generator',
        concept: 'Synthesizing Continuous Calendar Buckets to Prevent Missing Zero-Event Days',
        targetSymbol: 'SaasAnalyticsWorkbench.generateDaySpine',
        hint: 'Step day index from startDay to endDay inclusive and left-join daily counts.',
        explanation: 'Implement `generateDaySpine(startDay, endDay, dailyEvents)` so every integer day in `[startDay, endDay]` appears in the output with `0` when no events occurred on that day.'
      },
      {
        title: 'Step 2: Triangular Cohort Retention Matrix',
        concept: 'Grouping Users by Signup Month and Offset Month (activityMonth - cohortMonth)',
        targetSymbol: 'SaasAnalyticsWorkbench.buildCohortMatrix',
        hint: 'Count distinct active users per (cohortMonth, monthOffset) and divide by month-0 cohort size.',
        explanation: 'Implement `buildCohortMatrix(signups, monthlyActivity)` to compute cohort size and retention percentages across `monthOffset = 0, 1, 2, ...`.'
      },
      {
        title: 'Step 3: Chronological Funnel Conversion Attribution',
        concept: 'Enforcing t_signup <= t_activate <= t_subscribe Across User Events',
        targetSymbol: 'SaasAnalyticsWorkbench.computeFunnel',
        hint: 'Find earliest signup ts per user, earliest activate ts >= signupTs, and earliest subscribe ts >= activateTs.',
        explanation: 'Implement `computeFunnel(events)` to count users progressing through `signup -> activate -> subscribe` where each step occurs at or after the prior step’s earliest timestamp.'
      },
      {
        title: 'Step 4: Allen’s Interval Overlap Detector',
        concept: 'Half-Open Interval Intersection: startA < endB AND endA > startB',
        targetSymbol: 'SaasAnalyticsWorkbench.findOverlappingSubscriptions',
        hint: 'Check pairs for the same user_id where a.start < b.end && a.end > b.start.',
        explanation: 'Implement `findOverlappingSubscriptions(subs)` using Allen’s interval overlap law (`a.start < b.end && a.end > b.start`) so touching boundaries (`endA === startB`) do not false-trigger.'
      }
    ],
    starterCode: `'use strict';

class SaasAnalyticsWorkbench {
  static generateDaySpine(startDay, endDay, dailyEvents) {
    // TODO (Step 1): Return [{ day, count }] for every day in [startDay, endDay]
    return [];
  }

  static buildCohortMatrix(signups, monthlyActivity) {
    // TODO (Step 2): Return cohort retention rows [{ cohortMonth, cohortSize, offsets: { 0: 100, 1: ... } }]
    return [];
  }

  static computeFunnel(events) {
    // TODO (Step 3): Enforce chronological signup <= activate <= subscribe and return { signups, activated, subscribed }
    return { signups: 0, activated: 0, subscribed: 0 };
  }

  static findOverlappingSubscriptions(subs) {
    // TODO (Step 4): Return overlapping subscription id pairs [idA, idB] for the same user_id
    return [];
  }
}

module.exports = { SaasAnalyticsWorkbench };
`,
    solutionCode: `'use strict';

class SaasAnalyticsWorkbench {
  static generateDaySpine(startDay, endDay, dailyEvents) {
    const counts = new Map();
    for (const e of dailyEvents) counts.set(e.day, (counts.get(e.day) || 0) + 1);
    const out = [];
    for (let d = startDay; d <= endDay; d++) {
      out.push({ day: d, count: counts.get(d) || 0 });
    }
    return out;
  }

  static buildCohortMatrix(signups, monthlyActivity) {
    const userCohort = new Map();
    const cohortUsers = new Map();
    for (const s of signups) {
      userCohort.set(s.user_id, s.cohortMonth);
      if (!cohortUsers.has(s.cohortMonth)) cohortUsers.set(s.cohortMonth, new Set());
      cohortUsers.get(s.cohortMonth).add(s.user_id);
    }

    const activeByCohortOffset = new Map();
    for (const act of monthlyActivity) {
      const cMonth = userCohort.get(act.user_id);
      if (cMonth === undefined || act.activityMonth < cMonth) continue;
      const offset = act.activityMonth - cMonth;
      const key = \`\${cMonth}:\${offset}\`;
      if (!activeByCohortOffset.has(key)) activeByCohortOffset.set(key, new Set());
      activeByCohortOffset.get(key).add(act.user_id);
    }

    return Array.from(cohortUsers.keys()).sort((a, b) => a - b).map(cMonth => {
      const size = cohortUsers.get(cMonth).size;
      const offsets = { 0: 100 };
      for (const [k, set] of activeByCohortOffset.entries()) {
        const [cm, off] = k.split(':').map(Number);
        if (cm === cMonth) offsets[off] = Math.round((set.size / size) * 100);
      }
      return { cohortMonth: cMonth, cohortSize: size, offsets };
    });
  }

  static computeFunnel(events) {
    const byUser = new Map();
    for (const e of events) {
      if (!byUser.has(e.user_id)) byUser.set(e.user_id, []);
      byUser.get(e.user_id).push(e);
    }
    let signups = 0, activated = 0, subscribed = 0;
    for (const evs of byUser.values()) {
      const sTimes = evs.filter(e => e.step === 'signup').map(e => e.ts);
      if (sTimes.length === 0) continue;
      const t1 = Math.min(...sTimes);
      signups++;
      const aTimes = evs.filter(e => e.step === 'activate' && e.ts >= t1).map(e => e.ts);
      if (aTimes.length === 0) continue;
      const t2 = Math.min(...aTimes);
      activated++;
      const subTimes = evs.filter(e => e.step === 'subscribe' && e.ts >= t2).map(e => e.ts);
      if (subTimes.length > 0) subscribed++;
    }
    return { signups, activated, subscribed };
  }

  static findOverlappingSubscriptions(subs) {
    const overlaps = [];
    for (let i = 0; i < subs.length; i++) {
      for (let j = i + 1; j < subs.length; j++) {
        const a = subs[i], b = subs[j];
        if (a.user_id === b.user_id && a.start < b.end && a.end > b.start) {
          overlaps.push([a.id, b.id]);
        }
      }
    }
    return overlaps;
  }
}

module.exports = { SaasAnalyticsWorkbench };
`,
    testHarness: `function runTests() {
  const assert = require('node:assert/strict');
  const spine = SaasAnalyticsWorkbench.generateDaySpine(1, 4, [{ day: 1 }, { day: 1 }, { day: 3 }]);
  assert.deepEqual(spine.map(s => s.count), [2, 0, 1, 0]);

  const matrix = SaasAnalyticsWorkbench.buildCohortMatrix(
    [{ user_id: 1, cohortMonth: 1 }, { user_id: 2, cohortMonth: 1 }],
    [{ user_id: 1, activityMonth: 1 }, { user_id: 2, activityMonth: 1 }, { user_id: 1, activityMonth: 2 }]
  );
  assert.equal(matrix[0].offsets[0], 100);
  assert.equal(matrix[0].offsets[1], 50);

  const funnel = SaasAnalyticsWorkbench.computeFunnel([
    { user_id: 1, step: 'signup', ts: 10 },
    { user_id: 1, step: 'activate', ts: 20 },
    { user_id: 1, step: 'subscribe', ts: 30 },
    { user_id: 2, step: 'activate', ts: 5 }, // out-of-order before signup!
    { user_id: 2, step: 'signup', ts: 15 }
  ]);
  assert.deepEqual(funnel, { signups: 2, activated: 1, subscribed: 1 });

  const ov = SaasAnalyticsWorkbench.findOverlappingSubscriptions([
    { id: 10, user_id: 1, start: 100, end: 200 },
    { id: 11, user_id: 1, start: 200, end: 300 }, // abutting boundary -> not overlapping
    { id: 12, user_id: 1, start: 150, end: 250 }  // overlaps both 10 and 11
  ]);
  assert.deepEqual(ov, [[10, 12], [11, 12]]);
  return true;
}
runTests();
`
  }
];
