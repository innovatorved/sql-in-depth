/**
 * SQL In Depth — Production SQL, Query Optimizer, MVCC & Storage Incident Challenges
 * 12 interactive debugging, execution-plan regression, and concurrency-anomaly labs.
 * Exposes window.CHALLENGES_DATA as an Array (with .challenges alias for backwards compatibility).
 */
(function(root) {
  'use strict';

  var CHALLENGES_DATA = [
    {
      id: "chal-01-not-in-null-outage",
      title: "Three-Valued Logic Blackout: NOT IN (Subquery) Returning 0 Rows on NULL",
      subtitle: "A single un-assigned row with parent_id = NULL inside a NOT IN anti-join subquery silently wipes out the entire orphan-reconciliation batch.",
      summary: "Replace NULL-fragile NOT IN (SELECT ...) with NULL-safe NOT EXISTS or explicit IS NOT NULL filtering under Three-Valued Logic.",
      severity: "SEV-1",
      difficulty: "easy",
      category: "Three-Valued Logic & Anti-Joins",
      trackId: "track-1",
      xp: 150,
      estimatedMinutes: 15,
      relatedSlugs: ["boolean-logic-three-valued-null","exists-not-exists-null-safety","case-missing-null-notin-outage"],
      symptoms: [
        "Nightly payout reconciliation query suddenly returns 0 un-invoiced orders after a single draft credit memo was inserted with order_id = NULL.",
        "No SQL syntax or runtime error is raised; the query completes in 12ms with an empty result set.",
        "Replacing NOT IN with LEFT JOIN ... WHERE r.order_id IS NULL immediately surfaces 14,820 pending orders."
],
      metricsAndLogs: {
        "errorRate": "100.0%",
        "latencyP99": "14ms",
        "downstreamCpu": "12.0%",
        "effectiveRps": 0,
        "baselineRps": 14820,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 14820
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 8892
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 3705
                },
                {
                        "time": "10:03:00",
                        "cpu": 12,
                        "latencyP99": 14,
                        "errorRate": 100,
                        "rps": 0
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "Nightly payout reconciliation query suddenly returns 0 un-invoiced orders after a single draft credit memo was inserted with order_id = NULL."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "No SQL syntax or runtime error is raised; the query completes in 12ms with an empty result set."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "Replacing NOT IN with LEFT JOIN ... WHERE r.order_id IS NULL immediately surfaces 14,820 pending orders."
                }
        ]
},
      slaImpact: "Zero merchant payouts settled during the 02:00 UTC clearing window ($4.2M delayed).",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "Transaction isolation level READ COMMITTED hid the newly inserted order rows.",
                "correct": false,
                "feedback": "Incorrect. All 14,820 orders were committed hours earlier; the empty set is caused by Three-Valued Logic evaluation of x <> NULL."
        },
        {
                "id": "rc-wrong-2",
                "description": "B+Tree index corruption on invoices(order_id) skipped matching leaf entries.",
                "correct": false,
                "feedback": "Incorrect. Even a sequential scan returns 0 rows when NOT IN encounters a single NULL element."
        },
        {
                "id": "rc-wrong-3",
                "description": "Query optimizer rewrote NOT IN into an INNER JOIN due to stale table statistics.",
                "correct": false,
                "feedback": "Incorrect. Optimizer transformations preserve relational semantics; NOT IN is defined as x <> ALL(...)."
        },
        {
                "id": "rc-correct",
                "description": "In SQL Three-Valued Logic, x NOT IN (1, 2, NULL) expands to (x <> 1) AND (x <> 2) AND (x <> NULL), which simplifies to TRUE AND UNKNOWN = UNKNOWN, filtering out every row in WHERE.",
                "correct": true,
                "feedback": "Spot on! A single NULL in a NOT IN list turns every non-matching row comparison into UNKNOWN, which WHERE rejects."
        }
],
      invariants: [
        "In SQL 3VL, x = NULL and x <> NULL both evaluate to UNKNOWN; TRUE AND UNKNOWN evaluates to UNKNOWN.",
        "WHERE only admits tuples whose predicate evaluates to TRUE (rejecting both FALSE and UNKNOWN).",
        "NOT EXISTS (SELECT 1 FROM R WHERE R.k = L.k) returns TRUE when zero matching rows exist, making it completely immune to NULLs in R.k."
],
      interactiveTuning: [
        {
                "id": "antiJoinPattern",
                "label": "Anti-Join SQL Pattern",
                "type": "select",
                "options": [
                        "not-in-unfiltered",
                        "not-exists-correlated",
                        "left-join-is-null"
                ],
                "defaultValue": "not-in-unfiltered",
                "description": "Select the relational anti-join formulation."
        },
        {
                "id": "nullGuardConstraint",
                "label": "Subquery / Schema NULL Guard",
                "type": "select",
                "options": [
                        "allow-nulls",
                        "where-is-not-null",
                        "not-null-column-constraint"
                ],
                "defaultValue": "allow-nulls",
                "description": "Defense-in-depth handling for nullable foreign keys."
        }
],
      optimalPreset: {
        "antiJoinPattern": "not-exists-correlated",
        "nullGuardConstraint": "not-null-column-constraint"
},
      verify: function(knobs) {
        var ok = Boolean((knobs.antiJoinPattern === 'not-exists-correlated' || knobs.antiJoinPattern === 'left-join-is-null') && knobs.nullGuardConstraint !== 'allow-nulls');
        return {
          success: ok,
          message: ok ? "Anti-join hardened! NOT EXISTS + schema NOT NULL guard restored all 14,820 reconcilable rows with O(N+M) Hash Anti-Join execution." : "Query is still vulnerable to Three-Valued Logic NULL poisoning. Switch to not-exists-correlated and add a NULL guard.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "14ms",
            errorRate: ok ? '0.00%' : "100.0%",
            downstreamCpu: ok ? '14.0%' : "12.0%",
            effectiveRps: ok ? 14820 : 0
          }
        };
      },
      codeFix: {
        "title": "Fix NULL-Poisoned NOT IN Anti-Join Evaluator",
        "summary": "Implement findUninvoicedOrders(orders, invoices) using NULL-safe anti-join semantics so invoices with order_id = null never zero out results.",
        "buggyCode": "function findUninvoicedOrders(orders, invoices) {\n  // Simulates buggy SQL: WHERE o.id NOT IN (SELECT i.order_id FROM invoices i)\n  return orders.filter(o => {\n    for (const inv of invoices) {\n      if (inv.order_id === null || inv.order_id === undefined) return false; // 3VL UNKNOWN trap!\n      if (inv.order_id === o.id) return false;\n    }\n    return true;\n  });\n}",
        "solutionCode": "function findUninvoicedOrders(orders, invoices) {\n  // Simulates NULL-safe SQL: WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.order_id = o.id)\n  const invoicedIds = new Set();\n  for (const inv of invoices) {\n    if (inv && inv.order_id !== null && inv.order_id !== undefined) {\n      invoicedIds.add(inv.order_id);\n    }\n  }\n  return orders.filter(o => !invoicedIds.has(o.id));\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst orders = [{ id: 101 }, { id: 102 }, { id: 103 }];\nconst invoices = [{ id: 1, order_id: 101 }, { id: 2, order_id: null }];\nconst res = findUninvoicedOrders(orders, invoices);\nassert(res.length === 2 && res[0].id === 102 && res[1].id === 103, 'Expected orders 102 and 103 to survive despite null invoice');"
}
    },
    {
      id: "chal-02-left-join-where-trap",
      title: "Silent Outer-Join Collapse: Filtering Right-Table Columns in WHERE",
      subtitle: "Adding WHERE p.status = 'COMPLETED' to a Customer LEFT JOIN Payments report silently drops all customers with zero payments.",
      summary: "Move right-table predicates into the LEFT JOIN ... ON clause (or make them NULL-tolerant) to preserve outer-join row semantics.",
      severity: "SEV-2",
      difficulty: "easy",
      category: "Outer Joins & Clause Execution Order",
      trackId: "track-1",
      xp: 150,
      estimatedMinutes: 15,
      relatedSlugs: ["left-right-full-outer-joins","join-where-vs-on-filter-trap","where-filtering-predicates"],
      symptoms: [
        "Executive churn report claiming to show \"All Active Customers and Their Completed Payments\" excludes 42% of free-tier customers.",
        "EXPLAIN plan shows the planner simplified the LEFT JOIN into an ordinary INNER JOIN.",
        "Customers with zero payments disappear whenever the status filter is applied."
],
      metricsAndLogs: {
        "errorRate": "42.0%",
        "latencyP99": "22ms",
        "downstreamCpu": "18.5%",
        "effectiveRps": 5800,
        "baselineRps": 10000,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 10000
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 6000
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 2500
                },
                {
                        "time": "10:03:00",
                        "cpu": 18.5,
                        "latencyP99": 22,
                        "errorRate": 42,
                        "rps": 5800
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "Executive churn report claiming to show \"All Active Customers and Their Completed Payments\" excludes 42% of free-tier customers."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "EXPLAIN plan shows the planner simplified the LEFT JOIN into an ordinary INNER JOIN."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "Customers with zero payments disappear whenever the status filter is applied."
                }
        ]
},
      slaImpact: "42% of active accounts omitted from monthly retention cohort denominator.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "GROUP BY c.id collapsed multiple customers with NULL payment amounts into a single bucket.",
                "correct": false,
                "feedback": "Incorrect. c.id is unique per customer; the rows were filtered out before GROUP BY executed."
        },
        {
                "id": "rc-wrong-2",
                "description": "COUNT(p.id) returns NULL instead of 0 when no matching payment exists.",
                "correct": false,
                "feedback": "Incorrect. COUNT(col) always returns 0 on an all-NULL group; the customer rows themselves were eliminated in WHERE."
        },
        {
                "id": "rc-wrong-3",
                "description": "Hash Join spilled to disk and dropped unmatched outer probe tuples.",
                "correct": false,
                "feedback": "Incorrect. Disk spill preserves exact join semantics."
        },
        {
                "id": "rc-correct",
                "description": "Logical execution runs FROM/JOIN before WHERE: unmatched customers receive p.status = NULL from the LEFT JOIN, and WHERE p.status = 'COMPLETED' evaluates NULL = 'COMPLETED' → UNKNOWN, eliminating them.",
                "correct": true,
                "feedback": "Exact match! Strict predicates on the preserved side's partner in WHERE convert a LEFT JOIN into an INNER JOIN."
        }
],
      invariants: [
        "In A LEFT JOIN B ON P_on WHERE P_where, P_on determines which B rows attach to A (extending unmatched A rows with NULLs), whereas P_where filters the post-join rows.",
        "Any null-rejecting predicate on B in WHERE (such as B.col = v) rejects NULL-extended outer rows, collapsing A LEFT JOIN B into A INNER JOIN B.",
        "COUNT(B.id) counts only non-NULL matched rows while COUNT(*) counts the NULL-extended outer row as 1."
],
      interactiveTuning: [
        {
                "id": "predicatePlacement",
                "label": "Right-Table Filter Placement",
                "type": "select",
                "options": [
                        "where-clause",
                        "join-on-clause"
                ],
                "defaultValue": "where-clause",
                "description": "Where p.status = COMPLETED is evaluated in the query pipeline."
        },
        {
                "id": "countExpression",
                "label": "Aggregation Expression",
                "type": "select",
                "options": [
                        "count-star",
                        "count-right-pk"
                ],
                "defaultValue": "count-star",
                "description": "Aggregate used to count matched payments per customer."
        }
],
      optimalPreset: {
        "predicatePlacement": "join-on-clause",
        "countExpression": "count-right-pk"
},
      verify: function(knobs) {
        var ok = Boolean(knobs.predicatePlacement === 'join-on-clause' && knobs.countExpression === 'count-right-pk');
        return {
          success: ok,
          message: ok ? "Outer join preserved! Filtering inside ON and aggregating with COUNT(p.id) retains 100% of customers and reports 0 for unpaid accounts." : "Unpaid customers are still dropped or miscounted. Place the right-table filter in join-on-clause and use count-right-pk.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "22ms",
            errorRate: ok ? '0.00%' : "42.0%",
            downstreamCpu: ok ? '14.0%' : "18.5%",
            effectiveRps: ok ? 10000 : 5800
          }
        };
      },
      codeFix: {
        "title": "Preserve Unmatched Left Rows in Filtered Outer Join + Aggregation",
        "summary": "Evaluate the right-table status filter during the ON match condition and count right-table primary keys so customers with 0 completed payments return count = 0.",
        "buggyCode": "function customerCompletedPaymentCounts(customers, payments) {\n  // Buggy: filters p.status === 'COMPLETED' after join and uses row length\n  const rows = [];\n  for (const c of customers) {\n    const matched = payments.filter(p => p.customer_id === c.id);\n    if (matched.length === 0) rows.push({ c, p: null });\n    else for (const p of matched) rows.push({ c, p });\n  }\n  const filtered = rows.filter(r => r.p && r.p.status === 'COMPLETED');\n  return filtered.map(r => ({ customer_id: r.c.id, completed_count: 1 }));\n}",
        "solutionCode": "function customerCompletedPaymentCounts(customers, payments) {\n  return customers.map(c => {\n    let count = 0;\n    for (const p of payments) {\n      if (p.customer_id === c.id && p.status === 'COMPLETED') count++;\n    }\n    return { customer_id: c.id, completed_count: count };\n  });\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst customers = [{ id: 1 }, { id: 2 }];\nconst payments = [{ id: 10, customer_id: 1, status: 'COMPLETED' }, { id: 11, customer_id: 2, status: 'FAILED' }];\nconst out = customerCompletedPaymentCounts(customers, payments);\nassert(out.length === 2 && out[0].completed_count === 1 && out[1].completed_count === 0, 'Customer 2 must remain with completed_count = 0');"
}
    },
    {
      id: "chal-03-chasm-trap-fanout",
      title: "The $12M Chasm Trap: Multi-Child 1:N:M Join Fanout Double-Counting",
      subtitle: "Joining orders to both order_items (1:N) and order_shipments (1:M) in a single SELECT inflates gross merchandise value by 3.4×.",
      summary: "Pre-aggregate independent 1:N child tables to the parent grain in separate CTEs before joining so SUM() never multiplies across sibling fanout.",
      severity: "SEV-1",
      difficulty: "medium",
      category: "Aggregations & Join Fanout Traps",
      trackId: "track-2",
      xp: 200,
      estimatedMinutes: 20,
      relatedSlugs: ["join-fanout-chasm-traps","common-table-expressions-with","case-analytics-double-counting-bug"],
      symptoms: [
        "CFO dashboard reports $18.4M daily GMV while Stripe settlement ledger shows $5.4M.",
        "Orders shipped in 3 split packages have their line-item revenue multiplied by 3×.",
        "Orders with 5 line items have their shipping cost multiplied by 5×."
],
      metricsAndLogs: {
        "errorRate": "240.7%",
        "latencyP99": "680ms",
        "downstreamCpu": "74.0%",
        "effectiveRps": 120,
        "baselineRps": 950,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 950
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 570
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 238
                },
                {
                        "time": "10:03:00",
                        "cpu": 74,
                        "latencyP99": 680,
                        "errorRate": 240.7,
                        "rps": 120
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "CFO dashboard reports $18.4M daily GMV while Stripe settlement ledger shows $5.4M."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "Orders shipped in 3 split packages have their line-item revenue multiplied by 3×."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "Orders with 5 line items have their shipping cost multiplied by 5×."
                }
        ]
},
      slaImpact: "Financial revenue reporting overstated by 240% across all multi-package orders.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "Floating-point IEEE-754 rounding error accumulated across SUM(item_price).",
                "correct": false,
                "feedback": "Incorrect. Rounding errors are sub-cent; a 3× multiplication on 3-shipment orders is a relational Cartesian fanout within each order_id."
        },
        {
                "id": "rc-wrong-2",
                "description": "Missing DISTINCT keyword inside SELECT order_id, SUM(price).",
                "correct": false,
                "feedback": "Incorrect. SELECT DISTINCT deduplicates final output rows after aggregation, not the intermediate join rows fed into SUM()."
        },
        {
                "id": "rc-wrong-3",
                "description": "Parallel HashAggregate workers merged partial states twice.",
                "correct": false,
                "feedback": "Incorrect. FinalizeAggregate combines disjoint worker partitions accurately; the input join stream itself had N×M duplicated rows."
        },
        {
                "id": "rc-correct",
                "description": "Joining parent row P to N child rows in Table A and M child rows in Table B produces N × M cross-product rows per parent P, multiplying SUM(A.val) by M and SUM(B.val) by N.",
                "correct": true,
                "feedback": "Spot on! Independent 1:N relationships form a Chasm Trap when joined directly at the detail grain."
        }
],
      invariants: [
        "If |Items(o)| = N and |Shipments(o)| = M, then Orders ⋈ Items ⋈ Shipments produces N × M tuples for order o.",
        "Pre-aggregating Items by order_id (1 row per order) and Shipments by order_id (1 row per order) before joining guarantees a 1:1:1 join grain.",
        "COUNT(DISTINCT id) can deduplicate entity counts, but SUM(amount) cannot use DISTINCT when legitimate line items share identical prices."
],
      interactiveTuning: [
        {
                "id": "joinArchitecture",
                "label": "Multi-Table Aggregation Architecture",
                "type": "select",
                "options": [
                        "raw-detail-multi-join",
                        "sum-distinct-hack",
                        "pre-aggregated-ctes"
                ],
                "defaultValue": "raw-detail-multi-join",
                "description": "How independent 1:N child tables are combined with the parent grain."
        },
        {
                "id": "unmatchedChildHandling",
                "label": "Missing Child Row Handling",
                "type": "select",
                "options": [
                        "inner-join-drop",
                        "left-join-coalesce-zero"
                ],
                "defaultValue": "inner-join-drop",
                "description": "Preserve orders that have items but zero shipments yet."
        }
],
      optimalPreset: {
        "joinArchitecture": "pre-aggregated-ctes",
        "unmatchedChildHandling": "left-join-coalesce-zero"
},
      verify: function(knobs) {
        var ok = Boolean(knobs.joinArchitecture === 'pre-aggregated-ctes' && knobs.unmatchedChildHandling === 'left-join-coalesce-zero');
        return {
          success: ok,
          message: ok ? "Chasm trap eliminated! Grain-aligned CTE pre-aggregation with LEFT JOIN + COALESCE matches the exact ledger total down to the cent." : "Revenue or shipping totals are still distorted. Select pre-aggregated-ctes and left-join-coalesce-zero.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "680ms",
            errorRate: ok ? '0.00%' : "240.7%",
            downstreamCpu: ok ? '14.0%' : "74.0%",
            effectiveRps: ok ? 950 : 120
          }
        };
      },
      codeFix: {
        "title": "Pre-Aggregate Child CTEs to Eliminate 1:N:M Join Fanout",
        "summary": "Aggregate order_items and order_shipments independently by order_id before joining to orders.",
        "buggyCode": "function computeOrderTotals(orders, items, shipments) {\n  // Buggy: joins items and shipments directly, causing N * M fanout!\n  return orders.map(o => {\n    let itemTotal = 0, shipTotal = 0;\n    const oItems = items.filter(i => i.order_id === o.id);\n    const oShips = shipments.filter(s => s.order_id === o.id);\n    for (const i of oItems) {\n      for (const s of oShips) {\n        itemTotal += i.amount;\n        shipTotal += s.fee;\n      }\n    }\n    return { order_id: o.id, itemTotal, shipTotal };\n  });\n}",
        "solutionCode": "function computeOrderTotals(orders, items, shipments) {\n  const itemByOrder = new Map();\n  for (const i of items) {\n    itemByOrder.set(i.order_id, (itemByOrder.get(i.order_id) || 0) + i.amount);\n  }\n  const shipByOrder = new Map();\n  for (const s of shipments) {\n    shipByOrder.set(s.order_id, (shipByOrder.get(s.order_id) || 0) + s.fee);\n  }\n  return orders.map(o => ({\n    order_id: o.id,\n    itemTotal: itemByOrder.get(o.id) || 0,\n    shipTotal: shipByOrder.get(o.id) || 0\n  }));\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst orders = [{ id: 1 }, { id: 2 }];\nconst items = [{ order_id: 1, amount: 100 }, { order_id: 1, amount: 50 }, { order_id: 2, amount: 80 }];\nconst shipments = [{ order_id: 1, fee: 10 }, { order_id: 1, fee: 15 }];\nconst res = computeOrderTotals(orders, items, shipments);\nassert(res[0].itemTotal === 150 && res[0].shipTotal === 25, 'Order 1 must not fan out (got ' + JSON.stringify(res[0]) + ')');\nassert(res[1].itemTotal === 80 && res[1].shipTotal === 0, 'Order 2 with 0 shipments must preserve itemTotal=80');"
}
    },
    {
      id: "chal-04-window-range-vs-rows-bug",
      title: "Window Frame Anomaly: Default RANGE UNBOUNDED PRECEDING Merging Duplicate Timestamps",
      subtitle: "Running balance column jumps in lumpy steps and LAST_VALUE() returns the current row instead of the partition final value.",
      summary: "Specify explicit ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW for deterministic row-by-row running totals and UNBOUNDED FOLLOWING for LAST_VALUE.",
      severity: "SEV-2",
      difficulty: "medium",
      category: "Window Functions & Framing",
      trackId: "track-2",
      xp: 200,
      estimatedMinutes: 20,
      relatedSlugs: ["window-frames-rows-range-groups","offset-functions-lag-lead-first-last","running-totals-cumulative-shares"],
      symptoms: [
        "Two ledger transactions recorded in the same millisecond show identical cumulative running balances instead of sequential increments.",
        "LAST_VALUE(balance) OVER (PARTITION BY account_id ORDER BY created_at) always equals the current row's balance.",
        "Adding a unique tie-breaker or switching from RANGE to ROWS immediately fixes the running balance progression."
],
      metricsAndLogs: {
        "errorRate": "18.6%",
        "latencyP99": "45ms",
        "downstreamCpu": "32.0%",
        "effectiveRps": 4200,
        "baselineRps": 5000,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 5000
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 3000
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 1250
                },
                {
                        "time": "10:03:00",
                        "cpu": 32,
                        "latencyP99": 45,
                        "errorRate": 18.6,
                        "rps": 4200
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "Two ledger transactions recorded in the same millisecond show identical cumulative running balances instead of sequential increments."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "LAST_VALUE(balance) OVER (PARTITION BY account_id ORDER BY created_at) always equals the current row's balance."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "Adding a unique tie-breaker or switching from RANGE to ROWS immediately fixes the running balance progression."
                }
        ]
},
      slaImpact: "Account statement exports fail audit reconciliation whenever batch postings share a timestamp.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "SUM() OVER (...) ignores duplicate values unless ALL is specified.",
                "correct": false,
                "feedback": "Incorrect. SUM() includes all duplicates by default; the issue is that RANGE groups all ORDER BY peers into the current frame simultaneously."
        },
        {
                "id": "rc-wrong-2",
                "description": "PARTITION BY account_id hashed two different accounts into the same bucket.",
                "correct": false,
                "feedback": "Incorrect. Window partitioning is exact, not probabilistic."
        },
        {
                "id": "rc-wrong-3",
                "description": "Window functions execute before WHERE, including cancelled transactions.",
                "correct": false,
                "feedback": "Incorrect. Window functions execute after FROM, WHERE, GROUP BY, and HAVING."
        },
        {
                "id": "rc-correct",
                "description": "When ORDER BY is present without an explicit frame clause, SQL defaults to RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, which includes all peer rows tied on ORDER BY and stops at CURRENT ROW (breaking LAST_VALUE).",
                "correct": true,
                "feedback": "Exact hit! RANGE treats all ORDER BY ties as a single peer group, and stopping at CURRENT ROW means LAST_VALUE only sees up to the current peer group."
        }
],
      invariants: [
        "Default window frame with ORDER BY is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW.",
        "ROWS counts physical row offsets before/after the current row regardless of ORDER BY value ties.",
        "LAST_VALUE(x) requires ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING (or FIRST_VALUE with DESC) to inspect the true end of the partition."
],
      interactiveTuning: [
        {
                "id": "runningTotalFrame",
                "label": "Running Total Window Frame",
                "type": "select",
                "options": [
                        "default-range-current-row",
                        "rows-unbounded-preceding-current-row"
                ],
                "defaultValue": "default-range-current-row",
                "description": "Frame specification for cumulative SUM()."
        },
        {
                "id": "lastValueFrame",
                "label": "LAST_VALUE Frame Upper Bound",
                "type": "select",
                "options": [
                        "current-row-default",
                        "unbounded-following"
                ],
                "defaultValue": "current-row-default",
                "description": "Frame upper bound for partition-wide closing balance."
        }
],
      optimalPreset: {
        "runningTotalFrame": "rows-unbounded-preceding-current-row",
        "lastValueFrame": "unbounded-following"
},
      verify: function(knobs) {
        var ok = Boolean(knobs.runningTotalFrame === 'rows-unbounded-preceding-current-row' && knobs.lastValueFrame === 'unbounded-following');
        return {
          success: ok,
          message: ok ? "Window frames locked! ROWS framing gives strict row-by-row running totals across timestamp ties and UNBOUNDED FOLLOWING captures the true closing balance." : "Tied timestamps are still merged or LAST_VALUE stops at the current row. Choose rows-unbounded-preceding-current-row and unbounded-following.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "45ms",
            errorRate: ok ? '0.00%' : "18.6%",
            downstreamCpu: ok ? '14.0%' : "32.0%",
            effectiveRps: ok ? 5000 : 4200
          }
        };
      },
      codeFix: {
        "title": "Implement Physical ROWS Window Framing & Partition-Wide Closing Value",
        "summary": "Compute row-by-row runningTotal and partition closingBalance even when multiple events share the same timestamp.",
        "buggyCode": "function annotateLedgerWindow(entries) {\n  // Buggy: simulates default RANGE frame merging ties and LAST_VALUE stopping at current row\n  const sorted = [...entries].sort((a, b) => a.ts - b.ts || a.id - b.id);\n  return sorted.map((row, idx) => {\n    const rangePeers = sorted.filter(r => r.ts <= row.ts);\n    const runningTotal = rangePeers.reduce((s, r) => s + r.delta, 0);\n    return { ...row, runningTotal, closingBalance: runningTotal };\n  });\n}",
        "solutionCode": "function annotateLedgerWindow(entries) {\n  const sorted = [...entries].sort((a, b) => a.ts - b.ts || a.id - b.id);\n  const finalBalance = sorted.reduce((s, r) => s + r.delta, 0);\n  let running = 0;\n  return sorted.map(row => {\n    running += row.delta;\n    return { ...row, runningTotal: running, closingBalance: finalBalance };\n  });\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst entries = [{ id: 1, ts: 1000, delta: 50 }, { id: 2, ts: 1000, delta: 30 }, { id: 3, ts: 2000, delta: -20 }];\nconst res = annotateLedgerWindow(entries);\nassert(res[0].runningTotal === 50 && res[1].runningTotal === 80 && res[2].runningTotal === 60, 'Expected physical row running totals 50, 80, 60');\nassert(res[0].closingBalance === 60 && res[1].closingBalance === 60, 'Expected partition closingBalance = 60 on all rows');"
}
    },
    {
      id: "chal-05-recursive-cte-cycle-loop",
      title: "Infinite Graph Traversal: Recursive CTE Cycle Exhausting Temp Disk",
      subtitle: "A circular folder symlink (Folder A → Folder B → Folder A) causes WITH RECURSIVE permission lookup to loop until temp_file_limit kills the backend.",
      summary: "Add cycle detection (CYCLE clause or visited-path array check) and a max-depth guard to every recursive CTE over mutable graphs.",
      severity: "SEV-1",
      difficulty: "medium",
      category: "Recursive CTEs & Hierarchical Graphs",
      trackId: "track-2",
      xp: 200,
      estimatedMinutes: 20,
      relatedSlugs: ["recursive-ctes-hierarchies","graph-traversal-cycle-detection-sql","case-recursive-org-permission-engine"],
      symptoms: [
        "Workspace permission queries hang for 30s and fail with ERROR: temporary file size exceeds temp_file_limit (10GB).",
        "PostgreSQL worktable grows exponentially for a single tenant who imported a cyclic group hierarchy.",
        "CPU and NVMe write IOPS spike to 100% whenever that tenant loads their dashboard."
],
      metricsAndLogs: {
        "errorRate": "14.2%",
        "latencyP99": "30,000ms",
        "downstreamCpu": "98.4%",
        "effectiveRps": 310,
        "baselineRps": 8500,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 8500
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 5100
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 2125
                },
                {
                        "time": "10:03:00",
                        "cpu": 98.4,
                        "latencyP99": 30000,
                        "errorRate": 14.2,
                        "rps": 310
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "Workspace permission queries hang for 30s and fail with ERROR: temporary file size exceeds temp_file_limit (10GB)."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "PostgreSQL worktable grows exponentially for a single tenant who imported a cyclic group hierarchy."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "CPU and NVMe write IOPS spike to 100% whenever that tenant loads their dashboard."
                }
        ]
},
      slaImpact: "Shared database cluster temp disk exhausted, failing analytical sorts across all co-located tenants.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "Using UNION instead of UNION ALL in the recursive CTE caused an infinite loop.",
                "correct": false,
                "feedback": "Incorrect. UNION deduplicates rows and actually terminates on finite node sets (though slowly), whereas UNION ALL without a visited guard loops forever on cycles."
        },
        {
                "id": "rc-wrong-2",
                "description": "Missing B+Tree index on edges(parent_id) caused the recursive step to never terminate.",
                "correct": false,
                "feedback": "Incorrect. Missing indexes slow down each iteration but do not cause infinite iterations on a DAG."
        },
        {
                "id": "rc-wrong-3",
                "description": "CTE materialization fence cached stale rows across transactions.",
                "correct": false,
                "feedback": "Incorrect. CTE worktables exist only for the duration of a single query execution."
        },
        {
                "id": "rc-correct",
                "description": "WITH RECURSIVE ... UNION ALL repeatedly joins the working table against the edge table; when the graph contains a directed cycle, the working table never becomes empty.",
                "correct": true,
                "feedback": "Spot on! Recursive CTEs terminate only when the recursive member returns 0 rows."
        }
],
      invariants: [
        "A recursive CTE evaluates the anchor member once, then repeatedly evaluates the recursive member against the latest working table until the working table is empty.",
        "Tracking visited node IDs per path (or global visited set for reachability) and filtering next_id NOT IN visited guarantees termination in at most |V| steps.",
        "SQL:2023 / PostgreSQL 14+ provides native CYCLE node_id SET is_cycle USING path syntax for declarative cycle detection."
],
      interactiveTuning: [
        {
                "id": "cycleProtection",
                "label": "Cycle Detection Strategy",
                "type": "select",
                "options": [
                        "none-union-all",
                        "visited-path-guard",
                        "closure-table-materialized"
                ],
                "defaultValue": "none-union-all",
                "description": "Mechanism to prevent infinite traversal on cyclic edges."
        },
        {
                "id": "maxDepthLimit",
                "label": "Hard Recursion Depth Guard",
                "type": "range",
                "min": 8,
                "max": 128,
                "step": 8,
                "defaultValue": 128,
                "unit": "hops",
                "description": "Safety cap on hierarchy depth (WHERE depth < max_depth)."
        }
],
      optimalPreset: {
        "cycleProtection": "visited-path-guard",
        "maxDepthLimit": 32
},
      verify: function(knobs) {
        var ok = Boolean(knobs.cycleProtection !== 'none-union-all' && Number(knobs.maxDepthLimit) <= 64);
        return {
          success: ok,
          message: ok ? "Cycle guard verified! Visited-set tracking + depth <= 32 cap terminates cyclic traversals in 0.8ms with zero temp disk spill." : "Recursive CTE can still loop or traverse unbounded depth. Enable visited-path-guard and set maxDepthLimit <= 64.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "30,000ms",
            errorRate: ok ? '0.00%' : "14.2%",
            downstreamCpu: ok ? '14.0%' : "98.4%",
            effectiveRps: ok ? 8500 : 310
          }
        };
      },
      codeFix: {
        "title": "Add Visited-Node & Depth Guards to Recursive Graph Reachability",
        "summary": "Implement findReachableNodes(edges, startId, maxDepth) that safely traverses cyclic graphs without infinite loops.",
        "buggyCode": "function findReachableNodes(edges, startId) {\n  // Buggy: UNION ALL worktable without visited tracking loops forever on cycles!\n  let working = [startId];\n  const result = [];\n  while (working.length > 0) {\n    result.push(...working);\n    const next = [];\n    for (const u of working) {\n      for (const e of edges) {\n        if (e.from === u) next.push(e.to);\n      }\n    }\n    working = next;\n  }\n  return result;\n}",
        "solutionCode": "function findReachableNodes(edges, startId, maxDepth = 32) {\n  const visited = new Set([startId]);\n  let working = [startId];\n  let depth = 0;\n  while (working.length > 0 && depth < maxDepth) {\n    const next = [];\n    for (const u of working) {\n      for (const e of edges) {\n        if (e.from === u && !visited.has(e.to)) {\n          visited.add(e.to);\n          next.push(e.to);\n        }\n      }\n    }\n    working = next;\n    depth++;\n  }\n  return Array.from(visited);\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst cyclicEdges = [{ from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 1 }, { from: 3, to: 4 }];\nconst reached = findReachableNodes(cyclicEdges, 1, 10);\nassert(reached.length === 4 && reached.includes(4), 'Should terminate on cycle 1->2->3->1 and return [1,2,3,4]');"
}
    },
    {
      id: "chal-06-non-sargable-composite-index",
      title: "Index Bypass Outage: Non-SARGable DATE(created_at) & Wrong Composite Prefix",
      subtitle: "A 120M-row orders table pegs 64 vCPUs at 100% because WHERE DATE(created_at) = CURRENT_DATE and an inverted (created_at, tenant_id) index force sequential scans.",
      summary: "Rewrite function-wrapped predicates into half-open range intervals and order composite B+Tree keys by Equality first, Range second, and INCLUDE payload columns.",
      severity: "SEV-1",
      difficulty: "medium",
      category: "B+Tree Indexing & SARGability",
      trackId: "track-4",
      xp: 250,
      estimatedMinutes: 20,
      relatedSlugs: ["composite-indexes-leftmost-prefix","covering-indexes-index-only-scans","sargability-functions-on-columns","case-slack-composite-index-incident"],
      symptoms: [
        "Merchant order list endpoint latency jumps from 3ms to 4,800ms as the orders table crosses 120M rows.",
        "EXPLAIN ANALYZE shows Parallel Seq Scan reading 1,420,000 8KB heap pages despite an existing index on created_at.",
        "Buffer pool hit ratio drops from 99.2% to 41% due to continuous sequential scan cache thrashing."
],
      metricsAndLogs: {
        "errorRate": "29.5%",
        "latencyP99": "4,820ms",
        "downstreamCpu": "99.5%",
        "effectiveRps": 680,
        "baselineRps": 18000,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 18000
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 10800
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 4500
                },
                {
                        "time": "10:03:00",
                        "cpu": 99.5,
                        "latencyP99": 4820,
                        "errorRate": 29.5,
                        "rps": 680
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "Merchant order list endpoint latency jumps from 3ms to 4,800ms as the orders table crosses 120M rows."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "EXPLAIN ANALYZE shows Parallel Seq Scan reading 1,420,000 8KB heap pages despite an existing index on created_at."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "Buffer pool hit ratio drops from 99.2% to 41% due to continuous sequential scan cache thrashing."
                }
        ]
},
      slaImpact: "Merchant dashboard API times out during peak flash-sale traffic.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "B+Tree indexes cannot index TIMESTAMP or TIMESTAMPTZ columns.",
                "correct": false,
                "feedback": "Incorrect. Timestamps are 8-byte integers under the hood and are ideal B+Tree keys when queried with SARGable range operators."
        },
        {
                "id": "rc-wrong-2",
                "description": "PostgreSQL ignores indexes whenever a query returns more than 10 rows.",
                "correct": false,
                "feedback": "Incorrect. The planner uses index scans whenever the estimated page cost is lower than a sequential scan; here the function call DATE(col) made the index unusable."
        },
        {
                "id": "rc-wrong-3",
                "description": "Increasing shared_buffers from 16GB to 32GB is required before B+Tree lookups work.",
                "correct": false,
                "feedback": "Incorrect. A B+Tree lookup touches only 3–4 pages (~32KB) regardless of total table size."
        },
        {
                "id": "rc-correct",
                "description": "Wrapping an indexed column in DATE(created_at) destroys SARGability, and putting range column created_at before equality column tenant_id violates the B+Tree Equality → Range leftmost-prefix rule.",
                "correct": true,
                "feedback": "Spot on! SARGable range bounds plus a composite index on (tenant_id, status, created_at) INCLUDE (total_cents) reduces 1.4M page reads to 4 page reads."
        }
],
      invariants: [
        "A predicate f(col) = const is non-SARGable on a standard B+Tree index on (col) because f is not order-preserving Lookup keys.",
        "In a composite B+Tree on (A, B, C), equality predicates on A and B narrow the search to a single contiguous leaf range sorted by C.",
        "Adding INCLUDE (payload_cols) enables an Index-Only Scan with zero random heap fetches when Visibility Map bits are set."
],
      interactiveTuning: [
        {
                "id": "predicateForm",
                "label": "Timestamp Predicate Formulation",
                "type": "select",
                "options": [
                        "func-date-wrapped",
                        "sargable-half-open-range"
                ],
                "defaultValue": "func-date-wrapped",
                "description": "How the date filter is written in SQL WHERE."
        },
        {
                "id": "compositeKeyOrder",
                "label": "Composite B+Tree Key Order",
                "type": "select",
                "options": [
                        "created_at-tenant_id",
                        "tenant_id-status-created_at-include"
                ],
                "defaultValue": "created_at-tenant_id",
                "description": "Column ordering and covering payload of the B+Tree index."
        }
],
      optimalPreset: {
        "predicateForm": "sargable-half-open-range",
        "compositeKeyOrder": "tenant_id-status-created_at-include"
},
      verify: function(knobs) {
        var ok = Boolean(knobs.predicateForm === 'sargable-half-open-range' && knobs.compositeKeyOrder === 'tenant_id-status-created_at-include');
        return {
          success: ok,
          message: ok ? "Index-Only Scan unlocked! SARGable range + (tenant_id, status, created_at) INCLUDE (total_cents) cut p99 latency from 4,820ms to 1.8ms (0 heap fetches)." : "Query still scans unnecessary index or heap pages. Select sargable-half-open-range and tenant_id-status-created_at-include.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "4,820ms",
            errorRate: ok ? '0.00%' : "29.5%",
            downstreamCpu: ok ? '14.0%' : "99.5%",
            effectiveRps: ok ? 18000 : 680
          }
        };
      },
      codeFix: {
        "title": "Recommend Optimal Composite B+Tree Index & SARGable Range Rewrite",
        "summary": "Order equality columns first (sorted by selectivity), range/sort column next, and remaining SELECT columns in INCLUDE.",
        "buggyCode": "function designCompositeIndex(querySpec) {\n  // Buggy: puts range columns before equality columns and omits INCLUDE\n  return {\n    keyColumns: [...querySpec.rangeCols, ...querySpec.equalityCols],\n    includeColumns: [],\n    sargableRewrite: false\n  };\n}",
        "solutionCode": "function designCompositeIndex(querySpec) {\n  const eqCols = [...(querySpec.equalityCols || [])];\n  const rangeCols = [...(querySpec.rangeCols || [])];\n  const keySet = new Set([...eqCols, ...rangeCols]);\n  const includeColumns = (querySpec.selectCols || []).filter(c => !keySet.has(c));\n  return {\n    keyColumns: [...eqCols, ...rangeCols],\n    includeColumns,\n    sargableRewrite: true\n  };\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst plan = designCompositeIndex({\n  equalityCols: ['tenant_id', 'status'],\n  rangeCols: ['created_at'],\n  selectCols: ['tenant_id', 'created_at', 'total_cents']\n});\nassert(plan.keyColumns.join(',') === 'tenant_id,status,created_at', 'Equality cols must precede range col');\nassert(plan.includeColumns.join(',') === 'total_cents' && plan.sargableRewrite === true, 'total_cents should be in INCLUDE');"
}
    },
    {
      id: "chal-07-stale-stats-nested-loop",
      title: "Planner Catastrophe: Stale Statistics & Correlated Columns Triggering O(N·M) Nested Loop",
      subtitle: "After bulk-loading 5M promotion events, the optimizer estimates rows=1 and picks an unindexed Nested Loop Join taking 42 seconds per query.",
      summary: "Run ANALYZE immediately after bulk loads and create extended multivariate statistics (CREATE STATISTICS) on correlated columns.",
      severity: "SEV-1",
      difficulty: "hard",
      category: "Cost-Based Optimizer & Join Planning",
      trackId: "track-4",
      xp: 250,
      estimatedMinutes: 25,
      relatedSlugs: ["table-statistics-histograms-cardinality","selectivity-estimation-correlated-columns","reading-explain-and-explain-analyze","case-stale-statistics-plan-flip"],
      symptoms: [
        "EXPLAIN (ANALYZE, BUFFERS) shows Nested Loop (cost=0.43..18.20 rows=1) (actual time=0.12..42180.50 rows=485000 loops=1).",
        "The planner multiplied P(country = 'US') × P(currency = 'USD') as independent probabilities, underestimating cardinality by 80×.",
        "Running SET enable_nestloop = off locally drops query time from 42,180ms to 95ms via Hash Join."
],
      metricsAndLogs: {
        "errorRate": "45.0%",
        "latencyP99": "42,180ms",
        "downstreamCpu": "99.9%",
        "effectiveRps": 45,
        "baselineRps": 3200,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 3200
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 1920
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 800
                },
                {
                        "time": "10:03:00",
                        "cpu": 99.9,
                        "latencyP99": 42180,
                        "errorRate": 45,
                        "rps": 45
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "EXPLAIN (ANALYZE, BUFFERS) shows Nested Loop (cost=0.43..18.20 rows=1) (actual time=0.12..42180.50 rows=485000 loops=1)."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "The planner multiplied P(country = 'US') × P(currency = 'USD') as independent probabilities, underestimating cardinality by 80×."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "Running SET enable_nestloop = off locally drops query time from 42,180ms to 95ms via Hash Join."
                }
        ]
},
      slaImpact: "Checkout promotion eligibility service brownout across all North American traffic.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "Hash Join is disabled by default in PostgreSQL unless enable_hashjoin = on is set per session.",
                "correct": false,
                "feedback": "Incorrect. enable_hashjoin is ON by default; the planner chose Nested Loop because stale/uncorrelated stats made est_rows=1 look cheaper than building a hash table."
        },
        {
                "id": "rc-wrong-2",
                "description": "B+Tree index corruption caused the planner to misread pg_class.relpages.",
                "correct": false,
                "feedback": "Incorrect. Bulk loads without ANALYZE leave pg_statistic empty or outdated until autovacuum or manual ANALYZE runs."
        },
        {
                "id": "rc-wrong-3",
                "description": "work_mem was too large, forcing the optimizer to avoid Hash Join.",
                "correct": false,
                "feedback": "Incorrect. Larger work_mem actually makes in-memory Hash Join cheaper and more attractive to the planner."
        },
        {
                "id": "rc-correct",
                "description": "Without post-load ANALYZE and multivariate dependency statistics on correlated columns, the optimizer severely underestimated outer cardinality (est=1 vs actual=485,000) and chose Nested Loop over Hash Join.",
                "correct": true,
                "feedback": "Spot on! Nested Loop cost scales linearly with outer row count; a 485,000× row underestimate turns a 1ms plan into a 42-second outage."
        }
],
      invariants: [
        "Under the Attribute Value Independence (AVI) assumption, the planner estimates P(A ∧ B) = P(A)·P(B), which severely underestimates positively correlated predicates.",
        "Nested Loop Join costs O(|Outer| · log_B |Inner|), whereas Hash Join costs O(|Outer| + |Inner|) once the hash table build overhead is paid.",
        "CREATE STATISTICS (dependencies, ndistinct, mcv) + ANALYZE teaches the planner the true joint selectivity of correlated columns."
],
      interactiveTuning: [
        {
                "id": "statsMaintenance",
                "label": "Catalog Statistics State",
                "type": "select",
                "options": [
                        "stale-pre-load",
                        "analyze-plus-multivariate-stats"
                ],
                "defaultValue": "stale-pre-load",
                "description": "Whether ANALYZE and CREATE STATISTICS have been executed on correlated columns."
        },
        {
                "id": "workMemMb",
                "label": "Session work_mem Allocation",
                "type": "range",
                "min": 4,
                "max": 128,
                "step": 4,
                "defaultValue": 4,
                "unit": "MB",
                "description": "Memory budget for in-memory Hash Join build table without multi-batch disk spill."
        }
],
      optimalPreset: {
        "statsMaintenance": "analyze-plus-multivariate-stats",
        "workMemMb": 64
},
      verify: function(knobs) {
        var ok = Boolean(knobs.statsMaintenance === 'analyze-plus-multivariate-stats' && Number(knobs.workMemMb) >= 32);
        return {
          success: ok,
          message: ok ? "Plan flip resolved! Multivariate stats corrected est_rows to 480,000 and switched the plan to an single-batch in-memory Hash Join (88ms p99)." : "Planner still underestimates cardinality or spills Hash Join batches to disk. Enable analyze-plus-multivariate-stats and workMemMb >= 32.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "42,180ms",
            errorRate: ok ? '0.00%' : "45.0%",
            downstreamCpu: ok ? '14.0%' : "99.9%",
            effectiveRps: ok ? 3200 : 45
          }
        };
      },
      codeFix: {
        "title": "Cost-Based Join Selector with Correlated Selectivity Correction",
        "summary": "Compute true outer cardinality using joint selectivity when columns are correlated and pick HashJoin when outer rows exceed the NLJ threshold.",
        "buggyCode": "function selectPhysicalJoin(outerTotalRows, selA, selB, innerRows) {\n  // Buggy: assumes independence selA * selB even for correlated columns and picks NLJ\n  const estOuter = Math.max(1, Math.round(outerTotalRows * selA * selB));\n  const nljCost = estOuter * Math.log2(Math.max(2, innerRows));\n  const hashCost = estOuter + innerRows;\n  return { estOuter, algorithm: nljCost < hashCost ? 'NestedLoopJoin' : 'HashJoin' };\n}",
        "solutionCode": "function selectPhysicalJoin(outerTotalRows, selA, selB, innerRows, correlationFactor = 1.0) {\n  const jointSel = Math.min(Math.min(selA, selB), selA * selB * correlationFactor);\n  const estOuter = Math.max(1, Math.round(outerTotalRows * jointSel));\n  const nljCost = estOuter * Math.log2(Math.max(2, innerRows)) * 4;\n  const hashCost = estOuter + innerRows * 1.2;\n  return { estOuter, algorithm: nljCost < hashCost ? 'NestedLoopJoin' : 'HashJoin' };\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst res = selectPhysicalJoin(5000000, 0.1, 0.1, 200000, 10.0);\nassert(res.estOuter === 500000 && res.algorithm === 'HashJoin', 'Correlated selectivity should estimate 500,000 rows and choose HashJoin');"
}
    },
    {
      id: "chal-08-deep-offset-pagination-cliff",
      title: "The Deep Pagination Cliff: OFFSET 500000 Scanning & Discarding Half a Million Tuples",
      subtitle: "Scraper bots paging through ?page=25000&limit=20 saturate disk IOPS by forcing PostgreSQL to read and discard 500,000 rows per request.",
      summary: "Replace O(OFFSET) linear pagination with O(log N) keyset cursor pagination on (created_at DESC, id DESC).",
      severity: "SEV-2",
      difficulty: "medium",
      category: "Query Optimization & Keyset Pagination",
      trackId: "track-6",
      xp: 200,
      estimatedMinutes: 15,
      relatedSlugs: ["keyset-cursor-pagination-vs-offset","order-by-limit-offset-distinct","sorting-spill-to-disk-top-n-heapsort"],
      symptoms: [
        "Page 1 loads in 1.2ms, Page 100 loads in 18ms, and Page 25,000 takes 3,400ms.",
        "Rows disappeared or appeared twice across page boundaries whenever new items were inserted concurrently.",
        "EXPLAIN ANALYZE shows Limit (actual rows=20) atop Index Scan reading 500,020 tuples."
],
      metricsAndLogs: {
        "errorRate": "19.4%",
        "latencyP99": "3,410ms",
        "downstreamCpu": "88.0%",
        "effectiveRps": 920,
        "baselineRps": 15000,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 15000
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 9000
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 3750
                },
                {
                        "time": "10:03:00",
                        "cpu": 88,
                        "latencyP99": 3410,
                        "errorRate": 19.4,
                        "rps": 920
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "Page 1 loads in 1.2ms, Page 100 loads in 18ms, and Page 25,000 takes 3,400ms."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "Rows disappeared or appeared twice across page boundaries whenever new items were inserted concurrently."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "EXPLAIN ANALYZE shows Limit (actual rows=20) atop Index Scan reading 500,020 tuples."
                }
        ]
},
      slaImpact: "Public catalog API p99 latency breaches 500ms SLA whenever deep pages are crawled.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "B+Tree leaf nodes store exact subtree row counts, so OFFSET should jump in O(log N).",
                "correct": false,
                "feedback": "Incorrect. Standard DBMS B+Trees do NOT store subtree row counts in internal nodes because maintaining counts under concurrent MVCC visibility would serialize every insert!"
        },
        {
                "id": "rc-wrong-2",
                "description": "LIMIT 20 failed to push down into the Sort operator.",
                "correct": false,
                "feedback": "Incorrect. Even with an index avoiding a sort, OFFSET N must still walk N visible tuples to count them."
        },
        {
                "id": "rc-wrong-3",
                "description": "The primary key id column was INT4 instead of INT8.",
                "correct": false,
                "feedback": "Incorrect. Key width does not change the O(OFFSET) linear scan complexity."
        },
        {
                "id": "rc-correct",
                "description": "Because MVCC tuple visibility depends on each transaction's snapshot, the database cannot jump to numeric row offset N; it must walk and visibility-check all N preceding tuples before emitting the LIMIT slice.",
                "correct": true,
                "feedback": "Spot on! Keyset pagination replaces numeric row counting with a B+Tree search key (created_at, id) < (:last_ts, :last_id)."
        }
],
      invariants: [
        "OFFSET K LIMIT M requires O(K + M) tuple evaluations, degrading linearly with page depth K.",
        "Keyset pagination WHERE (created_at, id) < (:cursor_ts, :cursor_id) ORDER BY created_at DESC, id DESC LIMIT M executes in O(log_B N + M) constant time at any depth.",
        "Including the unique primary key id as the tie-breaker guarantees zero skipped or duplicated rows across identical timestamps."
],
      interactiveTuning: [
        {
                "id": "paginationMode",
                "label": "Pagination Access Pattern",
                "type": "select",
                "options": [
                        "offset-limit",
                        "keyset-seek-cursor"
                ],
                "defaultValue": "offset-limit",
                "description": "Method used to fetch subsequent pages of ordered results."
        },
        {
                "id": "tieBreakerKey",
                "label": "Deterministic Tie-Breaker Column",
                "type": "select",
                "options": [
                        "timestamp-only",
                        "timestamp-plus-unique-id"
                ],
                "defaultValue": "timestamp-only",
                "description": "Columns included in ORDER BY and the cursor seek tuple."
        }
],
      optimalPreset: {
        "paginationMode": "keyset-seek-cursor",
        "tieBreakerKey": "timestamp-plus-unique-id"
},
      verify: function(knobs) {
        var ok = Boolean(knobs.paginationMode === 'keyset-seek-cursor' && knobs.tieBreakerKey === 'timestamp-plus-unique-id');
        return {
          success: ok,
          message: ok ? "Constant-time pagination achieved! Keyset seek on (created_at DESC, id DESC) serves page 25,000 in 1.3ms with zero drift." : "Deep pages still scan linearly or skip tied timestamps. Select keyset-seek-cursor and timestamp-plus-unique-id.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "3,410ms",
            errorRate: ok ? '0.00%' : "19.4%",
            downstreamCpu: ok ? '14.0%' : "88.0%",
            effectiveRps: ok ? 15000 : 920
          }
        };
      },
      codeFix: {
        "title": "Implement Composite Keyset (created_at DESC, id DESC) Cursor Paginator",
        "summary": "Filter and slice ordered rows using the composite (created_at, id) seek invariant so ties on created_at are never lost.",
        "buggyCode": "function paginateKeysetDesc(rows, cursor, limit) {\n  // Buggy: compares only created_at < cursor.created_at, dropping rows with identical timestamps!\n  const sorted = [...rows].sort((a, b) => b.created_at - a.created_at || b.id - a.id);\n  const filtered = cursor ? sorted.filter(r => r.created_at < cursor.created_at) : sorted;\n  return filtered.slice(0, limit);\n}",
        "solutionCode": "function paginateKeysetDesc(rows, cursor, limit) {\n  const sorted = [...rows].sort((a, b) => b.created_at - a.created_at || b.id - a.id);\n  const filtered = cursor\n    ? sorted.filter(r => r.created_at < cursor.created_at || (r.created_at === cursor.created_at && r.id < cursor.id))\n    : sorted;\n  return filtered.slice(0, limit);\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst data = [\n  { id: 10, created_at: 500 },\n  { id: 9, created_at: 500 },\n  { id: 8, created_at: 500 },\n  { id: 7, created_at: 400 }\n];\nconst p1 = paginateKeysetDesc(data, null, 2);\nconst p2 = paginateKeysetDesc(data, p1[p1.length - 1], 2);\nassert(p1.map(r => r.id).join(',') === '10,9', 'Page 1 should be 10,9');\nassert(p2.map(r => r.id).join(',') === '8,7', 'Page 2 should preserve tied timestamp id=8 and return 8,7');"
}
    },
    {
      id: "chal-09-write-skew-double-spend",
      title: "Write Skew & Double-Spend: Concurrent Check-Then-Act Under REPEATABLE READ",
      subtitle: "Two parallel withdrawal requests read the same $100 wallet balance under Snapshot Isolation and both succeed, leaving the wallet at -$60.",
      summary: "Prevent Lost Updates and Write Skew using atomic conditional UPDATE ... RETURNING, SELECT ... FOR UPDATE, or SERIALIZABLE (SSI).",
      severity: "SEV-1",
      difficulty: "hard",
      category: "MVCC Isolation & Concurrency Anomalies",
      trackId: "track-5",
      xp: 300,
      estimatedMinutes: 25,
      relatedSlugs: ["write-anomalies-lost-update-write-skew","repeatable-read-snapshot-isolation","serializable-2pl-vs-ssi","case-fintech-double-spend-race-condition"],
      symptoms: [
        "Fraud team detects 340 wallets with negative balances after a concurrent withdrawal burst.",
        "Application logs show both transactions read balance = $100.00 before inserting $80.00 debit entries into ledger_entries.",
        "PostgreSQL REPEATABLE READ did NOT raise a serialization error because both transactions inserted into ledger_entries without updating the same row."
],
      metricsAndLogs: {
        "errorRate": "6.8%",
        "latencyP99": "11ms",
        "downstreamCpu": "42.0%",
        "effectiveRps": 8400,
        "baselineRps": 9000,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 9000
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 5400
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 2250
                },
                {
                        "time": "10:03:00",
                        "cpu": 42,
                        "latencyP99": 11,
                        "errorRate": 6.8,
                        "rps": 8400
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "Fraud team detects 340 wallets with negative balances after a concurrent withdrawal burst."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "Application logs show both transactions read balance = $100.00 before inserting $80.00 debit entries into ledger_entries."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "PostgreSQL REPEATABLE READ did NOT raise a serialization error because both transactions inserted into ledger_entries without updating the same row."
                }
        ]
},
      slaImpact: "Direct financial loss from concurrent double-spend exploit on wallet withdrawals.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "PostgreSQL REPEATABLE READ permits Dirty Reads from uncommitted transactions.",
                "correct": false,
                "feedback": "Incorrect. Dirty reads are impossible at all isolation levels in PostgreSQL; the bug is that both transactions read the same committed snapshot without locking or conflicting."
        },
        {
                "id": "rc-wrong-2",
                "description": "WAL fsync was disabled via synchronous_commit = off.",
                "correct": false,
                "feedback": "Incorrect. synchronous_commit affects durability on power loss, not concurrent transaction isolation."
        },
        {
                "id": "rc-wrong-3",
                "description": "B+Tree index on ledger_entries(wallet_id) was missing UNIQUE.",
                "correct": false,
                "feedback": "Incorrect. A wallet legitimately has many ledger entries over time; uniqueness applies only to idempotency_key."
        },
        {
                "id": "rc-correct",
                "description": "Under Snapshot Isolation (REPEATABLE READ), first-committer-wins only catches concurrent writes to the SAME row; reading SUM(entries) and inserting two new rows is a classic Write Skew anomaly.",
                "correct": true,
                "feedback": "Spot on! Without locking the parent wallet row (SELECT ... FOR UPDATE) or using SERIALIZABLE (SSI rw-antidependency detection), disjoint inserts bypass write-conflict checks."
        }
],
      invariants: [
        "Snapshot Isolation preventsLost Updates on the same row via first-committer-wins, but allows Write Skew across disjoint rows.",
        "Materializing the invariant onto the parent row via SELECT ... FROM wallets WHERE id = :id FOR UPDATE (or atomic UPDATE wallets SET balance = balance - :amt WHERE id = :id AND balance >= :amt) serializes concurrent withdrawals.",
        "Serializable Snapshot Isolation (SSI) tracks SIREAD predicate locks and aborts dangerous structures of two consecutive rw-antidependency edges."
],
      interactiveTuning: [
        {
                "id": "concurrencyControl",
                "label": "Withdrawal Concurrency Guard",
                "type": "select",
                "options": [
                        "app-select-then-insert",
                        "pessimistic-for-update-parent",
                        "serializable-ssi-with-retry"
                ],
                "defaultValue": "app-select-then-insert",
                "description": "Isolation and locking protocol protecting the balance invariant."
        },
        {
                "id": "idempotencyEnforcement",
                "label": "Idempotency Key Constraint",
                "type": "select",
                "options": [
                        "none",
                        "unique-idempotency-key"
                ],
                "defaultValue": "none",
                "description": "Prevent duplicate network retries from double-debiting."
        }
],
      optimalPreset: {
        "concurrencyControl": "pessimistic-for-update-parent",
        "idempotencyEnforcement": "unique-idempotency-key"
},
      verify: function(knobs) {
        var ok = Boolean(knobs.concurrencyControl !== 'app-select-then-insert' && knobs.idempotencyEnforcement === 'unique-idempotency-key');
        return {
          success: ok,
          message: ok ? "Double-spend vulnerability closed! Parent wallet row locking (FOR UPDATE) + unique idempotency keys guarantee zero negative balances under 128-thread contention." : "Concurrent withdrawals can still race or retry twice. Choose pessimistic-for-update-parent (or serializable-ssi-with-retry) and unique-idempotency-key.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "11ms",
            errorRate: ok ? '0.00%' : "6.8%",
            downstreamCpu: ok ? '14.0%' : "42.0%",
            effectiveRps: ok ? 9000 : 8400
          }
        };
      },
      codeFix: {
        "title": "Atomic Pessimistic Row-Locked + Idempotent Wallet Withdrawal",
        "summary": "Serialize withdrawals per wallet and enforce idempotency keys so concurrent or retried requests never overdraw.",
        "buggyCode": "function processWithdrawal(state, req) {\n  // Buggy: does not check idempotency key and allows overdraft when snapshot balance is stale\n  const wallet = state.wallets.get(req.walletId);\n  if (req.snapshotBalance >= req.amount) {\n    wallet.balance -= req.amount;\n    return { status: 'COMMITTED', balance: wallet.balance };\n  }\n  return { status: 'INSUFFICIENT_FUNDS', balance: wallet.balance };\n}",
        "solutionCode": "function processWithdrawal(state, req) {\n  if (!state.idempotency) state.idempotency = new Map();\n  if (state.idempotency.has(req.idempotencyKey)) {\n    return state.idempotency.get(req.idempotencyKey);\n  }\n  const wallet = state.wallets.get(req.walletId);\n  // Atomic current-read check (UPDATE wallets SET balance = balance - :amt WHERE id = :id AND balance >= :amt)\n  let result;\n  if (wallet.balance >= req.amount) {\n    wallet.balance -= req.amount;\n    result = { status: 'COMMITTED', balance: wallet.balance };\n  } else {\n    result = { status: 'INSUFFICIENT_FUNDS', balance: wallet.balance };\n  }\n  state.idempotency.set(req.idempotencyKey, result);\n  return result;\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst state = { wallets: new Map([[1, { id: 1, balance: 100 }]]) };\nconst r1 = processWithdrawal(state, { walletId: 1, amount: 80, snapshotBalance: 100, idempotencyKey: 'k1' });\nconst r1Retry = processWithdrawal(state, { walletId: 1, amount: 80, snapshotBalance: 100, idempotencyKey: 'k1' });\nconst r2 = processWithdrawal(state, { walletId: 1, amount: 80, snapshotBalance: 100, idempotencyKey: 'k2' });\nassert(r1.status === 'COMMITTED' && r1.balance === 20, 'First withdrawal succeeds');\nassert(r1Retry.balance === 20 && state.wallets.get(1).balance === 20, 'Retry must be idempotent');\nassert(r2.status === 'INSUFFICIENT_FUNDS' && state.wallets.get(1).balance === 20, 'Second concurrent withdrawal must be rejected');"
}
    },
    {
      id: "chal-10-ab-ba-deadlock-storm",
      title: "Wait-For Graph Gridlock: Unordered Multi-Row Updates Triggering AB-BA Deadlocks",
      subtitle: "Batch inventory reservation locking cart items in user-click order triggers 420 deadlocks/minute during flash sales.",
      summary: "Acquire row-level locks in deterministic ascending primary-key order (ORDER BY id ASC FOR UPDATE) to make Wait-For Graph cycles impossible.",
      severity: "SEV-1",
      difficulty: "medium",
      category: "Locking, Deadlocks & Wait-For Graphs",
      trackId: "track-5",
      xp: 200,
      estimatedMinutes: 15,
      relatedSlugs: ["deadlocks-wait-for-graphs-detection","row-level-locks-for-update-skip-locked","lock-contention-zero-downtime-ddl"],
      symptoms: [
        "PostgreSQL logs flood with ERROR: deadlock detected — Process 18421 waits for ShareLock on transaction 994120; blocked by process 18455.",
        "Checkout API p99 latency spikes to 1,000ms (the exact deadlock_timeout value) before failing with SQLSTATE 40P01.",
        "Two users checking out the same two SKUs in opposite order (SKU 10 then 20 vs SKU 20 then 10) deadlock every time."
],
      metricsAndLogs: {
        "errorRate": "16.5%",
        "latencyP99": "1,040ms",
        "downstreamCpu": "61.0%",
        "effectiveRps": 2100,
        "baselineRps": 12000,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 12000
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 7200
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 3000
                },
                {
                        "time": "10:03:00",
                        "cpu": 61,
                        "latencyP99": 1040,
                        "errorRate": 16.5,
                        "rps": 2100
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "PostgreSQL logs flood with ERROR: deadlock detected — Process 18421 waits for ShareLock on transaction 994120; blocked by process 18455."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "Checkout API p99 latency spikes to 1,000ms (the exact deadlock_timeout value) before failing with SQLSTATE 40P01."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "Two users checking out the same two SKUs in opposite order (SKU 10 then 20 vs SKU 20 then 10) deadlock every time."
                }
        ]
},
      slaImpact: "16.5% of multi-item flash-sale checkouts abort with unhandled 40P01 deadlock errors.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "PostgreSQL escalated row locks into a full Table Lock once more than 5 rows were updated.",
                "correct": false,
                "feedback": "Incorrect. PostgreSQL never performs row-to-table lock escalation (unlike SQL Server); row locks are stored directly in tuple headers (xmax/infomask)."
        },
        {
                "id": "rc-wrong-2",
                "description": "deadlock_timeout = 1s is too high; setting it to 1ms prevents deadlocks from happening.",
                "correct": false,
                "feedback": "Incorrect. deadlock_timeout only controls how long PostgreSQL waits before running the Wait-For Graph cycle detector; it does not prevent the cycle."
        },
        {
                "id": "rc-wrong-3",
                "description": "READ COMMITTED isolation level automatically orders row locks.",
                "correct": false,
                "feedback": "Incorrect. Statements lock rows in the order they are visited or looped over by the application."
        },
        {
                "id": "rc-correct",
                "description": "When Transaction T1 locks row A then requests row B while Transaction T2 locks row B then requests row A, they form a cycle T1 → T2 → T1 in the Wait-For Graph.",
                "correct": true,
                "feedback": "Spot on! Imposing a strict total order on lock acquisition (always lock min(id) before max(id)) makes Wait-For Graph cycles mathematically impossible."
        }
],
      invariants: [
        "Coffman's Circular Wait condition states that a deadlock cycle can exist only if transactions acquire resources out of global topological order.",
        "Sorting target primary keys ascending (`SELECT ... WHERE id = ANY(:sorted_ids) ORDER BY id ASC FOR no KEY UPDATE`) eliminates AB-BA deadlocks.",
        "Using FOR NO KEY UPDATE instead of FOR UPDATE when primary/unique keys are unchanged avoids blocking concurrent foreign-key checks."
],
      interactiveTuning: [
        {
                "id": "lockAcquisitionOrder",
                "label": "Row Lock Acquisition Order",
                "type": "select",
                "options": [
                        "arrival-cart-order",
                        "canonical-pk-ascending"
                ],
                "defaultValue": "arrival-cart-order",
                "description": "Order in which SKU inventory rows are locked within a transaction."
        },
        {
                "id": "rowLockStrength",
                "label": "Row Lock Mode",
                "type": "select",
                "options": [
                        "for-update-heavy",
                        "for-no-key-update"
                ],
                "defaultValue": "for-update-heavy",
                "description": "PostgreSQL row lock strength when updating non-key quantity columns."
        }
],
      optimalPreset: {
        "lockAcquisitionOrder": "canonical-pk-ascending",
        "rowLockStrength": "for-no-key-update"
},
      verify: function(knobs) {
        var ok = Boolean(knobs.lockAcquisitionOrder === 'canonical-pk-ascending' && knobs.rowLockStrength === 'for-no-key-update');
        return {
          success: ok,
          message: ok ? "Deadlocks eliminated! Canonical ascending PK lock ordering + FOR NO KEY UPDATE reduced 40P01 deadlock rate to 0.00%." : "Transactions can still form Wait-For Graph cycles or block child FK inserts. Choose canonical-pk-ascending and for-no-key-update.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "1,040ms",
            errorRate: ok ? '0.00%' : "16.5%",
            downstreamCpu: ok ? '14.0%' : "61.0%",
            effectiveRps: ok ? 12000 : 2100
          }
        };
      },
      codeFix: {
        "title": "Canonical Lock Ordering & Wait-For Graph Cycle Detector",
        "summary": "Sort lock requests in ascending resource ID order to prevent deadlocks, and detect directed cycles in a Wait-For Graph.",
        "buggyCode": "function canonicalizeLockPlan(skuIds) {\n  // Buggy: preserves arbitrary user cart order, allowing [20, 10] vs [10, 20] deadlocks\n  return skuIds.slice();\n}",
        "solutionCode": "function canonicalizeLockPlan(skuIds) {\n  return Array.from(new Set(skuIds)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst cartA = canonicalizeLockPlan([205, 101, 309, 101]);\nconst cartB = canonicalizeLockPlan([309, 205, 101]);\nassert(cartA.join(',') === '101,205,309' && cartB.join(',') === '101,205,309', 'Both transactions must lock SKUs in identical ascending order 101,205,309');"
}
    },
    {
      id: "chal-11-mvcc-bloat-xid-wraparound",
      title: "MVCC Table Bloat & Transaction ID Wraparound Emergency Shutdown",
      subtitle: "An abandoned idle-in-transaction analytics session pins OldestXmin for 19 hours, bloating a 4GB queue table to 180GB and triggering XID wraparound warnings.",
      summary: "Enforce idle_in_transaction_session_timeout, tune per-table autovacuum scale factors on high-churn tables, and use FOR UPDATE SKIP LOCKED.",
      severity: "SEV-1",
      difficulty: "hard",
      category: "MVCC Garbage Collection, Bloat & Vacuum",
      trackId: "track-5",
      xp: 300,
      estimatedMinutes: 25,
      relatedSlugs: ["dead-tuples-bloat-autovacuum-txid-wraparound","tuple-headers-xmin-xmax-visibility","case-sentry-transaction-id-wraparound"],
      symptoms: [
        "A table holding only 12,000 live rows consumes 180GB on disk and takes 9 seconds for a sequential scan.",
        "PostgreSQL logs emit WARNING: database \"prod\" must be vacuumed within 8,400,000 transactions to avoid transaction ID wraparound.",
        "Autovacuum runs continuously on the table but logs \"0 dead row versions removed, 142,000,000 dead row versions cannot be removed yet, oldest xmin: 81049201\"."
],
      metricsAndLogs: {
        "errorRate": "34.0%",
        "latencyP99": "9,100ms",
        "downstreamCpu": "97.0%",
        "effectiveRps": 540,
        "baselineRps": 22000,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 22000
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 13200
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 5500
                },
                {
                        "time": "10:03:00",
                        "cpu": 97,
                        "latencyP99": 9100,
                        "errorRate": 34,
                        "rps": 540
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "A table holding only 12,000 live rows consumes 180GB on disk and takes 9 seconds for a sequential scan."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "PostgreSQL logs emit WARNING: database \"prod\" must be vacuumed within 8,400,000 transactions to avoid transaction ID wraparound."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "Autovacuum runs continuously on the table but logs \"0 dead row versions removed, 142,000,000 dead row versions cannot be removed yet, oldest xmin: 81049201\"."
                }
        ]
},
      slaImpact: "Imminent cluster-wide single-user-mode read-only shutdown when un-frozen XID age reaches 2 billion.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "VACUUM FULL must be scheduled every 5 minutes via cron in production.",
                "correct": false,
                "feedback": "Incorrect. VACUUM FULL acquires an AccessExclusiveLock that blocks all reads and writes on the table; standard Autovacuum reclaims space online once OldestXmin advances."
        },
        {
                "id": "rc-wrong-2",
                "description": "PostgreSQL 64-bit servers use 64-bit transaction IDs in tuple headers, so wraparound cannot happen.",
                "correct": false,
                "feedback": "Incorrect. Tuple headers store 32-bit xmin and xmax (4 bytes each) to save 8 bytes per row, using modular arithmetic with a 2^31 horizon."
        },
        {
                "id": "rc-wrong-3",
                "description": "Deleting rows frees OS filesystem space immediately without VACUUM.",
                "correct": false,
                "feedback": "Incorrect. DELETE only stamps xmax on the tuple header; space is reclaimed into the Free Space Map only after VACUUM sweeps dead tuples older than OldestXmin."
        },
        {
                "id": "rc-correct",
                "description": "An open transaction in state idle in transaction (or a stale replication slot) held OldestXmin back, preventing VACUUM from reclaiming any dead tuple versions created after that XID or advancing relfrozenxid.",
                "correct": true,
                "feedback": "Spot on! VACUUM cannot remove any tuple version whose xmax >= global OldestXmin because that open snapshot might still inspect it."
        }
],
      invariants: [
        "A dead tuple version (xmax committed) is removable by VACUUM iff xmax < GlobalOldestXmin across all backends, prepared transactions, and replication slots.",
        "32-bit Transaction IDs compare via modular arithmetic (2^31 past, 2^31 future); tuples must be frozen (HEAP_XMIN_FROZEN) before their age reaches 2^31 (~2 billion XIDs).",
        "Setting idle_in_transaction_session_timeout and aggressive per-table autovacuum_vacuum_scale_factor (e.g., 0.01) keeps high-churn tables compact."
],
      interactiveTuning: [
        {
                "id": "idleTxTimeoutSec",
                "label": "idle_in_transaction_session_timeout",
                "type": "range",
                "min": 0,
                "max": 300,
                "step": 15,
                "defaultValue": 0,
                "unit": "sec",
                "description": "Automatically terminate sessions stuck idle inside an open transaction (0 = disabled)."
        },
        {
                "id": "autovacuumScaleFactor",
                "label": "Table autovacuum_vacuum_scale_factor",
                "type": "select",
                "options": [
                        "default-0.20",
                        "tuned-0.01"
                ],
                "defaultValue": "default-0.20",
                "description": "Fraction of table size modified before autovacuum triggers."
        }
],
      optimalPreset: {
        "idleTxTimeoutSec": 60,
        "autovacuumScaleFactor": "tuned-0.01"
},
      verify: function(knobs) {
        var ok = Boolean(Number(knobs.idleTxTimeoutSec) > 0 && Number(knobs.idleTxTimeoutSec) <= 120 && knobs.autovacuumScaleFactor === 'tuned-0.01');
        return {
          success: ok,
          message: ok ? "OldestXmin unpinned and Vacuum unblocked! Reclaimed 142M dead tuples into the Free Space Map and advanced relfrozenxid safely." : "Zombie transactions or high scale factors still allow bloat buildup. Set idleTxTimeoutSec between 15–120s and autovacuumScaleFactor to tuned-0.01.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "9,100ms",
            errorRate: ok ? '0.00%' : "34.0%",
            downstreamCpu: ok ? '14.0%' : "97.0%",
            effectiveRps: ok ? 22000 : 540
          }
        };
      },
      codeFix: {
        "title": "MVCC Vacuum Horizon & Dead Tuple Reclaimability Calculator",
        "summary": "Determine which dead tuple versions can be reclaimed by VACUUM given active backend snapshots and replication slot horizons.",
        "buggyCode": "function filterReclaimableTuples(tuples, currentXid) {\n  // Buggy: reclaims any tuple with committed xmax without checking active snapshot OldestXmin!\n  return tuples.filter(t => t.xmax !== null && t.xmaxCommitted && t.xmax < currentXid);\n}",
        "solutionCode": "function filterReclaimableTuples(tuples, currentXid, activeBackendXmins = [], slotXmins = []) {\n  const horizons = [currentXid, ...activeBackendXmins, ...slotXmins].filter(x => typeof x === 'number');\n  const oldestXmin = Math.min(...horizons);\n  return tuples.filter(t => t.xmax !== null && t.xmaxCommitted && t.xmax < oldestXmin);\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst tuples = [\n  { id: 1, xmin: 100, xmax: 150, xmaxCommitted: true },\n  { id: 2, xmin: 150, xmax: 250, xmaxCommitted: true },\n  { id: 3, xmin: 250, xmax: null, xmaxCommitted: false }\n];\nconst reclaimed = filterReclaimableTuples(tuples, 500, [200], []);\nassert(reclaimed.length === 1 && reclaimed[0].id === 1, 'Only tuple 1 (xmax=150 < oldestXmin=200) is safe to vacuum');"
}
    },
    {
      id: "chal-12-zero-downtime-ddl-lock-queue",
      title: "The 2-Second Migration That Took Down Production: AccessExclusive DDL Lock Queue",
      subtitle: "Running ALTER TABLE users ADD COLUMN ... and CREATE INDEX without CONCURRENTLY queues behind a 40-second reporting query and freezes all 15,000 QPS.",
      summary: "Use CREATE INDEX CONCURRENTLY, set lock_timeout with retry loops on DDL, and split constraint validation into NOT VALID + VALIDATE CONSTRAINT.",
      severity: "SEV-1",
      difficulty: "hard",
      category: "Production DBRE, Zero-Downtime Migrations & Pooling",
      trackId: "track-6",
      xp: 300,
      estimatedMinutes: 20,
      relatedSlugs: ["table-locks-intention-locks-ddl-hazards","lock-contention-zero-downtime-ddl","case-github-zero-downtime-migrations","case-gitlab-database-incident-postmortem"],
      symptoms: [
        "A metadata-only ALTER TABLE statement hangs for 38 seconds instead of completing in 2ms.",
        "Within 3 seconds of the migration starting, all 5,000 application SELECT and INSERT connections on users block and exhaust the connection pool.",
        "pg_locks shows ALTER TABLE waiting for AccessExclusiveLock blocked by a single AccessShareLock from an analytics SELECT."
],
      metricsAndLogs: {
        "errorRate": "98.2%",
        "latencyP99": "38,400ms",
        "downstreamCpu": "15.0%",
        "effectiveRps": 180,
        "baselineRps": 15000,
        "timeseries": [
                {
                        "time": "10:00:00",
                        "cpu": 18,
                        "latencyP99": 6,
                        "errorRate": 0,
                        "rps": 15000
                },
                {
                        "time": "10:01:00",
                        "cpu": 55,
                        "latencyP99": 280,
                        "errorRate": 4.5,
                        "rps": 9000
                },
                {
                        "time": "10:02:00",
                        "cpu": 89,
                        "latencyP99": 1450,
                        "errorRate": 18.2,
                        "rps": 3750
                },
                {
                        "time": "10:03:00",
                        "cpu": 15,
                        "latencyP99": 38400,
                        "errorRate": 98.2,
                        "rps": 180
                }
        ],
        "logs": [
                {
                        "timestamp": "10:01:12.104",
                        "level": "WARN",
                        "service": "postgres-primary",
                        "message": "A metadata-only ALTER TABLE statement hangs for 38 seconds instead of completing in 2ms."
                },
                {
                        "timestamp": "10:02:12.104",
                        "level": "ERROR",
                        "service": "postgres-primary",
                        "message": "Within 3 seconds of the migration starting, all 5,000 application SELECT and INSERT connections on users block and exhaust the connection pool."
                },
                {
                        "timestamp": "10:03:12.104",
                        "level": "FATAL",
                        "service": "postgres-primary",
                        "message": "pg_locks shows ALTER TABLE waiting for AccessExclusiveLock blocked by a single AccessShareLock from an analytics SELECT."
                }
        ]
},
      slaImpact: "Complete site-wide authentication and API outage for the duration of the blocked migration.",
      rootCauses: [
        {
                "id": "rc-wrong-1",
                "description": "Adding a nullable column with no default rewrites every 8KB heap page in PostgreSQL 11+.",
                "correct": false,
                "feedback": "Incorrect. Adding a nullable column (or a non-volatile default in PG 11+) is an O(1) catalog update; the outage happened because waiting for AccessExclusiveLock queued all subsequent queries behind it."
        },
        {
                "id": "rc-wrong-2",
                "description": "AccessShareLock (SELECT) only conflicts with other SELECT statements.",
                "correct": false,
                "feedback": "Incorrect. AccessShareLock conflicts ONLY with AccessExclusiveLock (DDL), which is why a long SELECT blocks DDL, and the waiting DDL then blocks all new SELECTs!"
        },
        {
                "id": "rc-wrong-3",
                "description": "Increasing max_connections to 10,000 allows SELECT queries to bypass the DDL lock queue.",
                "correct": false,
                "feedback": "Incorrect. More connections just pile onto the same FIFO lock wait queue and exhaust RAM."
        },
        {
                "id": "rc-correct",
                "description": "PostgreSQL's fair FIFO lock queue means a waiting AccessExclusiveLock (which blocks behind an active long-running SELECT's AccessShareLock) forces all newly arriving SELECT and DML queries to queue behind the waiting DDL.",
                "correct": true,
                "feedback": "Spot on! Always guard DDL with a strict lock_timeout (e.g. SET lock_timeout = '2s'), build indexes via CREATE INDEX CONCURRENTLY, and validate constraints with NOT VALID + VALIDATE CONSTRAINT."
        }
],
      invariants: [
        "AccessExclusiveLock conflicts with every lock mode, including AccessShareLock acquired by plain SELECT queries.",
        "A waiting AccessExclusiveLock in the lock queue blocks all subsequent AccessShareLock and RowExclusiveLock requests to prevent lock starvation.",
        "CREATE INDEX CONCURRENTLY and ALTER TABLE ... VALIDATE CONSTRAINT acquire only ShareUpdateExclusiveLock, allowing concurrent reads and writes."
],
      interactiveTuning: [
        {
                "id": "ddlLockTimeoutMs",
                "label": "Migration Session lock_timeout",
                "type": "select",
                "options": [
                        "unlimited-0ms",
                        "bounded-1500ms-with-retry"
                ],
                "defaultValue": "unlimited-0ms",
                "description": "Maximum time DDL waits in the lock queue before aborting and retrying."
        },
        {
                "id": "indexAndConstraintMode",
                "label": "Index & Constraint Rollout Pattern",
                "type": "select",
                "options": [
                        "blocking-create-index",
                        "concurrently-plus-not-valid"
                ],
                "defaultValue": "blocking-create-index",
                "description": "How new indexes and foreign/check constraints are added online."
        }
],
      optimalPreset: {
        "ddlLockTimeoutMs": "bounded-1500ms-with-retry",
        "indexAndConstraintMode": "concurrently-plus-not-valid"
},
      verify: function(knobs) {
        var ok = Boolean(knobs.ddlLockTimeoutMs === 'bounded-1500ms-with-retry' && knobs.indexAndConstraintMode === 'concurrently-plus-not-valid');
        return {
          success: ok,
          message: ok ? "Zero-downtime migration verified! Bounded lock_timeout + CREATE INDEX CONCURRENTLY + NOT VALID/VALIDATE deployed with 0 blocked queries." : "Migration can still form a catastrophic AccessExclusive lock convoy. Enable bounded-1500ms-with-retry and concurrently-plus-not-valid.",
          metrics: {
            latencyP99: ok ? '2.4ms' : "38,400ms",
            errorRate: ok ? '0.00%' : "98.2%",
            downstreamCpu: ok ? '14.0%' : "15.0%",
            effectiveRps: ok ? 15000 : 180
          }
        };
      },
      codeFix: {
        "title": "Zero-Downtime DDL Lock-Queue & Safe Migration Planner",
        "summary": "Generate non-blocking SQL migration steps using lock_timeout, CREATE INDEX CONCURRENTLY, and ADD CONSTRAINT ... NOT VALID + VALIDATE.",
        "buggyCode": "function buildSafeMigrationPlan(spec) {\n  // Buggy: emits blocking CREATE INDEX and unguarded ALTER TABLE\n  return [\n    `CREATE INDEX ${spec.indexName} ON ${spec.table} (${spec.column});`,\n    `ALTER TABLE ${spec.table} ADD CONSTRAINT ${spec.constraintName} CHECK (${spec.checkExpr});`\n  ];\n}",
        "solutionCode": "function buildSafeMigrationPlan(spec) {\n  return [\n    `SET lock_timeout = '1500ms';`,\n    `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${spec.indexName} ON ${spec.table} (${spec.column});`,\n    `ALTER TABLE ${spec.table} ADD CONSTRAINT ${spec.constraintName} CHECK (${spec.checkExpr}) NOT VALID;`,\n    `ALTER TABLE ${spec.table} VALIDATE CONSTRAINT ${spec.constraintName};`\n  ];\n}",
        "testCode": "const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };\nconst steps = buildSafeMigrationPlan({ table: 'orders', column: 'tenant_id', indexName: 'idx_orders_tenant', constraintName: 'chk_pos', checkExpr: 'total >= 0' });\nassert(steps[0].includes('lock_timeout'), 'Must set lock_timeout');\nassert(steps[1].includes('CREATE INDEX CONCURRENTLY'), 'Must use CREATE INDEX CONCURRENTLY');\nassert(steps[2].includes('NOT VALID') && steps[3].includes('VALIDATE CONSTRAINT'), 'Must split ADD CONSTRAINT NOT VALID and VALIDATE CONSTRAINT');"
}
    }
  ];

  CHALLENGES_DATA.challenges = CHALLENGES_DATA;
  root.CHALLENGES_DATA = CHALLENGES_DATA;
  root.ChallengesData = CHALLENGES_DATA;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CHALLENGES_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
