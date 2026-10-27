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
        "title": "Fix NULL-Poisoned NOT IN Anti-Join Query",
        "summary": "Replace the NULL-fragile NOT IN subquery with a NULL-safe NOT EXISTS anti-join so a single NULL key never zeroes out the result set.",
        "datasetId": "ecommerce",
        "buggyCode": "-- BUGGY SQL: If the subquery ever contains a NULL referred_by key, NOT IN returns 0 rows!\nSELECT c.customer_id,\n       c.name,\n       c.tier,\n       c.country\nFROM customers c\nWHERE c.customer_id NOT IN (\n  SELECT referred_by\n  FROM customers\n)\nORDER BY c.customer_id ASC;",
        "solutionCode": "-- FIXED SQL: NOT EXISTS is 100% immune to NULL values in the subquery relation\nSELECT c.customer_id,\n       c.name,\n       c.tier,\n       c.country\nFROM customers c\nWHERE NOT EXISTS (\n  SELECT 1\n  FROM customers r\n  WHERE r.referred_by = c.customer_id\n)\nORDER BY c.customer_id ASC;"
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
        "summary": "Move the right-table status filter from WHERE into the LEFT JOIN ... ON clause and use COUNT(o.order_id) so customers with 0 completed orders return 0.",
        "datasetId": "ecommerce",
        "buggyCode": "-- BUGGY SQL: WHERE o.status = 'completed' eliminates customers with zero completed orders!\nSELECT c.customer_id,\n       c.name,\n       c.tier,\n       COUNT(*) AS completed_orders,\n       COALESCE(SUM(o.total_cents), 0) AS completed_cents\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.customer_id\nWHERE o.status = 'completed'\nGROUP BY c.customer_id, c.name, c.tier\nORDER BY c.customer_id ASC;",
        "solutionCode": "-- FIXED SQL: Filter o.status = 'completed' inside ON and count right-table PK o.order_id\nSELECT c.customer_id,\n       c.name,\n       c.tier,\n       COUNT(o.order_id) AS completed_orders,\n       COALESCE(SUM(o.total_cents), 0) AS completed_cents\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'completed'\nGROUP BY c.customer_id, c.name, c.tier\nORDER BY c.customer_id ASC;"
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
        "summary": "Aggregate order_items and payments independently by order_id in separate CTEs before joining to orders.",
        "datasetId": "ecommerce",
        "buggyCode": "-- BUGGY SQL: Joining order_items (1:N) and payments (1:M) directly causes N*M Cartesian fanout per order!\nSELECT o.order_id,\n       o.customer_id,\n       COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0) AS items_cents,\n       COALESCE(SUM(p.amount_cents), 0) AS paid_cents\nFROM orders o\nLEFT JOIN order_items oi ON oi.order_id = o.order_id\nLEFT JOIN payments p ON p.order_id = o.order_id\nGROUP BY o.order_id, o.customer_id\nORDER BY o.order_id ASC;",
        "solutionCode": "-- FIXED SQL: Pre-aggregate each 1:N child table to the order_id grain before joining\nWITH item_totals AS (\n  SELECT order_id,\n         SUM(quantity * unit_price_cents) AS items_cents\n  FROM order_items\n  GROUP BY order_id\n),\npayment_totals AS (\n  SELECT order_id,\n         SUM(amount_cents) AS paid_cents\n  FROM payments\n  GROUP BY order_id\n)\nSELECT o.order_id,\n       o.customer_id,\n       COALESCE(i.items_cents, 0) AS items_cents,\n       COALESCE(p.paid_cents, 0) AS paid_cents\nFROM orders o\nLEFT JOIN item_totals i ON i.order_id = o.order_id\nLEFT JOIN payment_totals p ON p.order_id = o.order_id\nORDER BY o.order_id ASC;"
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
        "title": "Specify Explicit ROWS Window Frame & Deterministic Tie-Breaker",
        "summary": "Use ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW with a deterministic (created_at, entry_id) tie-breaker for strict row-by-row running ledger balances.",
        "datasetId": "fintech_ledger",
        "buggyCode": "-- BUGGY SQL: Default RANGE frame merges duplicate created_at timestamps into the same peer group!\nSELECT entry_id,\n       account_id,\n       direction,\n       amount_cents,\n       created_at,\n       SUM(CASE WHEN direction = 'credit' THEN amount_cents ELSE -amount_cents END) OVER (\n         PARTITION BY account_id\n         ORDER BY created_at\n       ) AS running_net_cents\nFROM journal_entries\nORDER BY account_id ASC, created_at ASC, entry_id ASC;",
        "solutionCode": "-- FIXED SQL: Deterministic tie-breaker + ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\nSELECT entry_id,\n       account_id,\n       direction,\n       amount_cents,\n       created_at,\n       SUM(CASE WHEN direction = 'credit' THEN amount_cents ELSE -amount_cents END) OVER (\n         PARTITION BY account_id\n         ORDER BY created_at ASC, entry_id ASC\n         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n       ) AS running_net_cents\nFROM journal_entries\nORDER BY account_id ASC, created_at ASC, entry_id ASC;"
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
        "title": "Add Visited-Path & Depth Guards to Recursive CTE Graph Traversal",
        "summary": "Include a visited-path string check (INSTR(path, ...) = 0) and a hard depth < 10 cap in WITH RECURSIVE so cyclic graphs always terminate.",
        "datasetId": "org_hr",
        "buggyCode": "-- BUGGY SQL: Recursive CTE without depth or visited-path guard can loop infinitely on cyclic manager_id chains!\nWITH RECURSIVE org_tree AS (\n  SELECT emp_id,\n         name,\n         manager_id,\n         0 AS depth,\n         ',' || CAST(emp_id AS TEXT) || ',' AS visited_path\n  FROM employees\n  WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.emp_id,\n         e.name,\n         e.manager_id,\n         t.depth + 1,\n         t.visited_path || CAST(e.emp_id AS TEXT) || ','\n  FROM employees e\n  JOIN org_tree t ON e.manager_id = t.emp_id\n)\nSELECT emp_id, name, manager_id, depth, visited_path\nFROM org_tree\nORDER BY depth ASC, emp_id ASC;",
        "solutionCode": "-- FIXED SQL: Visited-path cycle detection (INSTR = 0) + hard recursion depth guard (depth < 10)\nWITH RECURSIVE org_tree AS (\n  SELECT emp_id,\n         name,\n         manager_id,\n         0 AS depth,\n         ',' || CAST(emp_id AS TEXT) || ',' AS visited_path\n  FROM employees\n  WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.emp_id,\n         e.name,\n         e.manager_id,\n         t.depth + 1,\n         t.visited_path || CAST(e.emp_id AS TEXT) || ','\n  FROM employees e\n  JOIN org_tree t ON e.manager_id = t.emp_id\n  WHERE t.depth < 10\n    AND INSTR(t.visited_path, ',' || CAST(e.emp_id AS TEXT) || ',') = 0\n)\nSELECT emp_id, name, manager_id, depth, visited_path\nFROM org_tree\nORDER BY depth ASC, emp_id ASC;"
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
        "title": "Rewrite Non-SARGable Function Filter into SARGable B+Tree Range Scan",
        "summary": "Replace SUBSTR(created_at, 1, 7) function wrapping with a SARGable half-open range interval so idx_orders_customer_date is used.",
        "datasetId": "ecommerce",
        "buggyCode": "-- BUGGY SQL: Wrapping created_at in SUBSTR() destroys SARGability and forces a full table scan!\nSELECT order_id,\n       customer_id,\n       status,\n       total_cents,\n       created_at\nFROM orders\nWHERE customer_id = 1\n  AND SUBSTR(created_at, 1, 7) = '2025-01'\nORDER BY created_at DESC;",
        "solutionCode": "-- FIXED SQL: SARGable half-open range predicate [start, end) seeks directly on idx_orders_customer_date\nSELECT order_id,\n       customer_id,\n       status,\n       total_cents,\n       created_at\nFROM orders\nWHERE customer_id = 1\n  AND created_at >= '2025-01-01'\n  AND created_at < '2025-02-01'\nORDER BY created_at DESC;"
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
        "title": "Eliminate Correlated Subquery Nested Loop via Pre-Aggregated Hash Join",
        "summary": "Rewrite a correlated per-row subquery into a single-pass CTE aggregation joined by customer_id.",
        "datasetId": "ecommerce",
        "buggyCode": "-- BUGGY SQL: Correlated subquery executes a repeated scan for every customer row!\nSELECT c.customer_id,\n       c.name,\n       c.country,\n       c.tier,\n       (SELECT COALESCE(SUM(o.total_cents), 0)\n        FROM orders o\n        WHERE o.customer_id = c.customer_id\n          AND o.status = 'completed') AS completed_spend_cents\nFROM customers c\nWHERE c.country = 'US'\nORDER BY completed_spend_cents DESC, c.customer_id ASC;",
        "solutionCode": "-- FIXED SQL: Single-pass HashAggregate CTE joined once on customer_id\nWITH customer_spend AS (\n  SELECT customer_id,\n         SUM(total_cents) AS completed_spend_cents\n  FROM orders\n  WHERE status = 'completed'\n  GROUP BY customer_id\n)\nSELECT c.customer_id,\n       c.name,\n       c.country,\n       c.tier,\n       COALESCE(cs.completed_spend_cents, 0) AS completed_spend_cents\nFROM customers c\nLEFT JOIN customer_spend cs ON cs.customer_id = c.customer_id\nWHERE c.country = 'US'\nORDER BY completed_spend_cents DESC, c.customer_id ASC;"
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
        "title": "Replace Linear OFFSET Pagination with Composite Keyset Cursor Seek",
        "summary": "Use a composite (created_at, order_id) keyset seek predicate so deep pages execute in O(log N) B+Tree time without skipping tied timestamps.",
        "datasetId": "ecommerce",
        "buggyCode": "-- BUGGY SQL: Linear OFFSET scans and discards preceding tuples and skips tied timestamps if filtered only on created_at\nSELECT order_id,\n       customer_id,\n       status,\n       total_cents,\n       created_at\nFROM orders\nORDER BY created_at DESC, order_id DESC\nLIMIT 5 OFFSET 3;",
        "solutionCode": "-- FIXED SQL: Keyset cursor seek after cursor (created_at = '2025-02-05', order_id = 109)\nSELECT order_id,\n       customer_id,\n       status,\n       total_cents,\n       created_at\nFROM orders\nWHERE created_at < '2025-02-05'\n   OR (created_at = '2025-02-05' AND order_id < 109)\nORDER BY created_at DESC, order_id DESC\nLIMIT 5;"
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
        "title": "Reconcile Double-Entry Ledger Balances & Guard Against Overdraft Write Skew",
        "summary": "Audit accounts against signed journal_entries postings and filter accounts with sufficient posted balance for a 50,000-cent withdrawal.",
        "datasetId": "fintech_ledger",
        "buggyCode": "-- BUGGY SQL: Ignores debit vs credit direction and fails to verify non-negative post-withdrawal balance\nSELECT a.account_id,\n       a.owner_name,\n       a.account_type,\n       a.posted_balance_cents,\n       COUNT(j.entry_id) AS journal_postings\nFROM accounts a\nLEFT JOIN journal_entries j ON j.account_id = a.account_id\nGROUP BY a.account_id, a.owner_name, a.account_type, a.posted_balance_cents\nORDER BY a.account_id ASC;",
        "solutionCode": "-- FIXED SQL: Reconcile signed journal delta and verify sufficient balance invariant (posted_balance_cents >= 50000)\nSELECT a.account_id,\n       a.owner_name,\n       a.account_type,\n       a.posted_balance_cents,\n       COALESCE(SUM(CASE WHEN j.direction = 'credit' THEN j.amount_cents ELSE -j.amount_cents END), 0) AS net_journal_cents,\n       CASE WHEN a.posted_balance_cents >= 50000 THEN 'APPROVED' ELSE 'INSUFFICIENT_FUNDS' END AS withdrawal_guard\nFROM accounts a\nLEFT JOIN journal_entries j ON j.account_id = a.account_id\nWHERE a.currency = 'USD'\nGROUP BY a.account_id, a.owner_name, a.account_type, a.posted_balance_cents\nORDER BY a.account_id ASC;"
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
        "title": "Canonical Ascending Primary-Key Lock Ordering Plan",
        "summary": "Deduplicate and order target product_id rows in strict ascending primary-key order so concurrent multi-item checkouts cannot form AB-BA Wait-For Graph cycles.",
        "datasetId": "ecommerce",
        "buggyCode": "-- BUGGY SQL: Fetches target SKU inventory rows in arbitrary non-deterministic order\nSELECT p.product_id,\n       p.sku,\n       p.name,\n       p.stock_qty,\n       p.price_cents\nFROM products p\nWHERE p.product_id IN (5, 2, 8, 1);",
        "solutionCode": "-- FIXED SQL: Canonical ascending primary-key ordering (ORDER BY product_id ASC) prevents AB-BA deadlocks\nSELECT p.product_id,\n       p.sku,\n       p.name,\n       p.stock_qty,\n       p.price_cents,\n       ROW_NUMBER() OVER (ORDER BY p.product_id ASC) AS lock_acquisition_step\nFROM products p\nWHERE p.product_id IN (5, 2, 8, 1)\n  AND p.stock_qty > 0\nORDER BY p.product_id ASC;"
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
        "title": "Identify High-Churn MVCC Bloat & Unreclaimed Dead Tuple Candidates",
        "summary": "Audit high-churn transfer states (failed, reversed, pending) vs settled transfers per account to prioritize autovacuum and dead-tuple cleanup.",
        "datasetId": "fintech_ledger",
        "buggyCode": "-- BUGGY SQL: Counts all transfers without separating dead/aborted churn from live settled rows\nSELECT from_account_id AS account_id,\n       COUNT(*) AS total_transfers,\n       SUM(amount_cents) AS total_amount_cents\nFROM transfers\nGROUP BY from_account_id\nORDER BY total_transfers DESC;",
        "solutionCode": "-- FIXED SQL: Separate settled live tuples from aborted/reversed churn tuples per account\nSELECT a.account_id,\n       a.owner_name,\n       COUNT(t.transfer_id) AS total_tuple_versions,\n       SUM(CASE WHEN t.status = 'settled' THEN 1 ELSE 0 END) AS live_settled_tuples,\n       SUM(CASE WHEN t.status IN ('failed', 'reversed') THEN 1 ELSE 0 END) AS reclaimable_dead_tuples\nFROM accounts a\nLEFT JOIN transfers t ON t.from_account_id = a.account_id\nGROUP BY a.account_id, a.owner_name\nORDER BY reclaimable_dead_tuples DESC, a.account_id ASC;"
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
        "title": "Pre-Migration Constraint & Index Readiness Audit Query",
        "summary": "Verify zero constraint violations exist on subscriptions and invoices before running online constraint validation.",
        "datasetId": "saas_telemetry",
        "buggyCode": "-- BUGGY SQL: Blindly scans subscriptions without checking invoice integrity or negative MRR violations\nSELECT sub_id,\n       user_id,\n       mrr_usd,\n       status,\n       started_at\nFROM subscriptions\nORDER BY sub_id ASC;",
        "solutionCode": "-- FIXED SQL: Pre-check NOT VALID constraint readiness across subscriptions and invoices\nSELECT s.sub_id,\n       u.org_name,\n       u.plan_tier,\n       s.mrr_usd,\n       s.status,\n       COUNT(i.invoice_id) AS invoice_count,\n       COALESCE(SUM(i.amount_usd), 0) AS billed_usd,\n       CASE WHEN s.mrr_usd >= 0 AND u.user_id IS NOT NULL THEN 'VALID' ELSE 'VIOLATION' END AS constraint_check\nFROM subscriptions s\nLEFT JOIN saas_users u ON u.user_id = s.user_id\nLEFT JOIN invoices i ON i.sub_id = s.sub_id\nGROUP BY s.sub_id, u.org_name, u.plan_tier, s.mrr_usd, s.status, u.user_id\nORDER BY s.sub_id ASC;"
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
