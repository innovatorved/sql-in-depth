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
        "buggyCode": "-- BUGGY SQL: Wrapping created_at in SUBSTR() destroys SARGability and forces a full table scan!\nSELECT order_id,\n       customer_id,\n       status,\n       total_cents,\n       created_at\nFROM orders\nWHERE customer_id = 1\n  AND SUBSTR(created_at, 1, 7) = '2025-02'\nORDER BY created_at DESC;",
        "solutionCode": "-- FIXED SQL: SARGable half-open range predicate [start, end) seeks directly on idx_orders_customer_date\nSELECT order_id,\n       customer_id,\n       status,\n       total_cents,\n       created_at\nFROM orders\nWHERE customer_id = 1\n  AND created_at >= '2025-02-01'\n  AND created_at < '2025-03-01'\nORDER BY created_at DESC;"
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
        "Sorting target primary keys ascending (`SELECT ... WHERE id = ANY(:sorted_ids) ORDER BY id ASC FOR NO KEY UPDATE`) eliminates AB-BA deadlocks.",
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
        "buggyCode": "-- BUGGY SQL: Fetches target SKU inventory rows in arbitrary non-deterministic order\nSELECT p.product_id,\n       p.sku,\n       p.name,\n       p.stock_qty,\n       p.price_cents\nFROM products p\nWHERE p.product_id IN (105, 102, 108, 101);",
        "solutionCode": "-- FIXED SQL: Canonical ascending primary-key ordering (ORDER BY product_id ASC) prevents AB-BA deadlocks\nSELECT p.product_id,\n       p.sku,\n       p.name,\n       p.stock_qty,\n       p.price_cents,\n       ROW_NUMBER() OVER (ORDER BY p.product_id ASC) AS lock_acquisition_step\nFROM products p\nWHERE p.product_id IN (105, 102, 108, 101)\n  AND p.stock_qty > 0\nORDER BY p.product_id ASC;"
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

  var CHALLENGES_ENRICHMENT = {
    "chal-01-not-in-null-outage": {
      hints: [
        "Trace what `x NOT IN (1, 2, NULL)` expands to in SQL Three-Valued Logic: `(x <> 1) AND (x <> 2) AND (x <> NULL)`.",
        "Any comparison `x <> NULL` evaluates to `UNKNOWN`, and `TRUE AND UNKNOWN` simplifies to `UNKNOWN`, which `WHERE` rejects.",
        "Replace `WHERE c.customer_id NOT IN (SELECT referred_by FROM customers)` with `WHERE NOT EXISTS (SELECT 1 FROM customers r WHERE r.referred_by = c.customer_id)`."
      ],
      postmortemExplanation: "In SQL Three-Valued Logic, `NOT IN` expands to a conjunction of `<>` comparisons across every row returned by the subquery. A single `NULL` in `customers.referred_by` forces every unmatched `customer_id` comparison into `TRUE AND UNKNOWN = UNKNOWN`, silently zeroing out the reconciliation query. Rewriting the anti-join with `NOT EXISTS` checks row existence (`TRUE`/`FALSE` only) and unlocks a null-safe Hash Anti-Join."
    },
    "chal-02-left-join-where-trap": {
      hints: [
        "Follow logical SQL execution order: `FROM / LEFT JOIN` runs before `WHERE`, padding unmatched left rows with `NULL`s in all `orders` columns.",
        "Filtering `WHERE o.status = 'completed'` evaluates `NULL = 'completed' -> UNKNOWN`, discarding every customer with zero completed orders.",
        "Move `AND o.status = 'completed'` into `LEFT JOIN orders o ON ...`, and change `COUNT(*)` to `COUNT(o.order_id)` so NULL-extended rows count as `0`."
      ],
      postmortemExplanation: "Placing a strict equality predicate (`o.status = 'completed'`) on the nullable right side of a `LEFT JOIN` inside `WHERE` forces the query planner to simplify the outer join into an `INNER JOIN`, dropping 42% of unpaid customers. Moving the right-table predicate into the `ON` condition filters orders prior to null-extension, and `COUNT(o.order_id)` counts only non-null matched orders."
    },
    "chal-03-chasm-trap-fanout": {
      hints: [
        "Count how many intermediate rows are produced for an order that has `N` rows in `order_items` and `M` rows in `payments`.",
        "Joining two independent `1:N` child tables directly to the same parent creates an `N * M` Cartesian fanout within each `order_id`.",
        "Aggregate `order_items` by `order_id` in CTE `item_totals` and `payments` by `order_id` in CTE `payment_totals`, then `LEFT JOIN` both `1:1` CTEs onto `orders`."
      ],
      postmortemExplanation: "Joining a parent table simultaneously to two independent one-to-many child relations (`order_items` and `payments`) forms a relational Chasm Trap: an order with 3 items and 2 payment attempts generates 6 joined tuples, multiplying item revenue by 2x and paid cents by 3x. Pre-aggregating each child table to the `order_id` grain in separate CTEs aligns all inputs to `1:1` before the final join."
    },
    "chal-04-window-range-vs-rows-bug": {
      hints: [
        "When `OVER (PARTITION BY ... ORDER BY created_at)` omits an explicit frame clause, SQL defaults to `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.",
        "Under `RANGE`, `CURRENT ROW` means all peer rows tied on `created_at`, so simultaneous postings jump together instead of incrementing row by row.",
        "Order deterministically by `ORDER BY created_at ASC, entry_id ASC` and specify `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`."
      ],
      postmortemExplanation: "The SQL standard mandates `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` whenever `ORDER BY` appears inside `OVER (...)` without a frame unit. Because `RANGE` operates on logical `ORDER BY` values rather than physical tuple offsets, batch ledger entries sharing the same timestamp collapse into a single peer frame. Adding `entry_id ASC` as a unique tie-breaker and `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` guarantees strict sequential balances."
    },
    "chal-05-recursive-cte-cycle-loop": {
      hints: [
        "A `WITH RECURSIVE ... UNION ALL` query stops only when the recursive member produces zero new rows.",
        "The anchor already builds a comma-delimited `visited_path` (`',1,2,'`), so you can test whether the next `e.emp_id` was already visited.",
        "Add `WHERE t.depth < 10 AND INSTR(t.visited_path, ',' || CAST(e.emp_id AS TEXT) || ',') = 0` to the recursive member."
      ],
      postmortemExplanation: "Recursive CTEs using `UNION ALL` execute iteratively until the working table empties; a single directed cycle in mutable hierarchy data (`A -> B -> A`) loops until `temp_file_limit` aborts the backend. Guarding the recursive join with both a visited-path membership check and a defensive `depth < 10` ceiling guarantees bounded termination in O(|V|) iterations."
    },
    "chal-06-non-sargable-composite-index": {
      hints: [
        "Wrapping `created_at` inside `SUBSTR(created_at, 1, 7)` prevents the B-Tree from seeking to the February 2025 leaf range.",
        "Rewrite the month string slice into a half-open range interval `[start_of_month, start_of_next_month)` on the bare `created_at` column.",
        "Replace `SUBSTR(created_at, 1, 7) = '2025-02'` with `created_at >= '2025-02-01' AND created_at < '2025-03-01'`."
      ],
      postmortemExplanation: "Applying `SUBSTR()` or `DATE()` to an indexed timestamp column destroys SARGability because B-Tree keys are ordered by the raw column value, not arbitrary function outputs. Rewriting the filter as a half-open range `created_at >= '2025-02-01' AND created_at < '2025-03-01'` after equality column `customer_id = 1` turns a full scan into a single contiguous composite B-Tree range scan."
    },
    "chal-07-stale-stats-nested-loop": {
      hints: [
        "Notice the scalar subquery inside `SELECT`: it re-executes a filtered `orders` aggregation once per matching US customer.",
        "De-correlate the per-customer subquery into a single-pass `GROUP BY customer_id` CTE over completed orders.",
        "Create `WITH customer_spend AS (SELECT customer_id, SUM(total_cents) AS completed_spend_cents FROM orders WHERE status = 'completed' GROUP BY customer_id)` and `LEFT JOIN` it to `customers` with `COALESCE(..., 0)`."
      ],
      postmortemExplanation: "Correlated scalar subqueries and severe cardinality underestimates trick the optimizer into executing O(N*M) Nested Loop plans. Pre-aggregating completed order totals once by `customer_id` in a CTE allows the execution engine to compute a single `HashAggregate` and join it via an O(N+M) `Hash Left Join`."
    },
    "chal-08-deep-offset-pagination-cliff": {
      hints: [
        "`OFFSET K` forces the storage engine to scan, visibility-check, and discard `K` tuples before emitting the page.",
        "Page 1 ended at cursor `(created_at = '2025-02-05', order_id = 109)` sorted by `created_at DESC, order_id DESC`.",
        "Remove `OFFSET 3` and seek directly with `WHERE created_at < '2025-02-05' OR (created_at = '2025-02-05' AND order_id < 109)`."
      ],
      postmortemExplanation: "Because MVCC visibility varies per transaction snapshot, PostgreSQL B-Trees cannot store static row-offset counts in internal pages; `OFFSET 500000` must walk 500,000 tuples linearly. Keyset cursor pagination on `(created_at DESC, order_id DESC)` seeks directly to the cursor boundary in O(log N) B-Tree page reads with zero drift under concurrent inserts."
    },
    "chal-09-write-skew-double-spend": {
      hints: [
        "Audit both the signed sum of `journal_entries` (`credit` positive, `debit` negative) and whether `posted_balance_cents` covers the 50,000-cent withdrawal.",
        "Filter `WHERE a.currency = 'USD'` and compute `COALESCE(SUM(CASE WHEN j.direction = 'credit' THEN j.amount_cents ELSE -j.amount_cents END), 0) AS net_journal_cents`.",
        "Project `CASE WHEN a.posted_balance_cents >= 50000 THEN 'APPROVED' ELSE 'INSUFFICIENT_FUNDS' END AS withdrawal_guard` grouped by account."
      ],
      postmortemExplanation: "Under Snapshot Isolation (`REPEATABLE READ`), two concurrent transactions reading a wallet's ledger sum and inserting separate debit rows do not touch the same tuple, bypassing first-committer-wins conflict detection (Write Skew). Serializing withdrawals on the parent `accounts` row (`FOR UPDATE` or atomic guarded `UPDATE ... WHERE posted_balance_cents >= 50000`) restores strict invariant safety."
    },
    "chal-10-ab-ba-deadlock-storm": {
      hints: [
        "`WHERE p.product_id IN (105, 102, 108, 101)` without `ORDER BY` acquires row locks in arbitrary scan order, enabling AB-BA Wait-For cycles.",
        "Filter out out-of-stock SKUs (`AND p.stock_qty > 0`) and sort lock targets in canonical ascending primary-key order.",
        "Add `ROW_NUMBER() OVER (ORDER BY p.product_id ASC) AS lock_acquisition_step`, `AND p.stock_qty > 0`, and `ORDER BY p.product_id ASC`."
      ],
      postmortemExplanation: "Deadlocks require Coffman's Circular Wait condition: Transaction T1 holds lock 101 and waits on 105 while T2 holds 105 and waits on 101. Sorting all multi-row lock acquisitions in strict ascending primary-key order (`ORDER BY product_id ASC FOR NO KEY UPDATE`) makes Wait-For Graph cycles mathematically impossible."
    },
    "chal-11-mvcc-bloat-xid-wraparound": {
      hints: [
        "The buggy query only scans `transfers` (`from_account_id`), omitting accounts with zero outgoing transfers and lumping live `'settled'` rows together with dead churn.",
        "Start from `accounts a LEFT JOIN transfers t ON t.from_account_id = a.account_id` so every account is audited.",
        "Project `COUNT(t.transfer_id) AS total_tuple_versions`, conditional `SUM` for `'settled'` (`live_settled_tuples`), and conditional `SUM` for `('failed', 'reversed')` (`reclaimable_dead_tuples`), ordered by `reclaimable_dead_tuples DESC, a.account_id ASC`."
      ],
      postmortemExplanation: "In PostgreSQL MVCC, aborted or superseded tuple versions remain in 8KB heap pages until `VACUUM` sweeps tuples older than `GlobalOldestXmin`. Long `idle in transaction` sessions pin `OldestXmin`, starving autovacuum and pushing `age(relfrozenxid)` toward the 2-billion XID wraparound cliff. Enforcing `idle_in_transaction_session_timeout` and lowering `autovacuum_vacuum_scale_factor` on high-churn tables unblocks space reclamation."
    },
    "chal-12-zero-downtime-ddl-lock-queue": {
      hints: [
        "Before adding `NOT NULL` / `CHECK (mrr_usd >= 0)` / FK constraints online with `NOT VALID` + `VALIDATE CONSTRAINT`, audit `subscriptions` joined to `saas_users` and `invoices`.",
        "Join `subscriptions s LEFT JOIN saas_users u ON u.user_id = s.user_id LEFT JOIN invoices i ON i.sub_id = s.sub_id`.",
        "Project `s.sub_id, u.org_name, u.plan_tier, s.mrr_usd, s.status, COUNT(i.invoice_id) AS invoice_count, COALESCE(SUM(i.amount_usd), 0) AS billed_usd`, and `CASE WHEN s.mrr_usd >= 0 AND u.user_id IS NOT NULL THEN 'VALID' ELSE 'VIOLATION' END AS constraint_check`."
      ],
      postmortemExplanation: "`ALTER TABLE` requires `AccessExclusiveLock`, which conflicts even with `AccessShareLock` held by ordinary `SELECT` queries. When `ALTER TABLE` waits behind one slow reporting `SELECT`, PostgreSQL's fair FIFO lock queue parks every subsequent `SELECT`/`INSERT` behind the waiting DDL, causing an instant connection-pool outage. Always pair migrations with `SET lock_timeout`, `CREATE INDEX CONCURRENTLY`, and `ADD CONSTRAINT ... NOT VALID` followed by `VALIDATE CONSTRAINT`."
    }
  };

  CHALLENGES_DATA.forEach(function(item) {
    var extra = CHALLENGES_ENRICHMENT[item.id];
    if (extra) {
      item.hints = extra.hints;
      item.postmortemExplanation = extra.postmortemExplanation;
    }
  });

  var PG_CHALLENGES_DATA = [
    {
      id: "chal-13-lock-convoy-blocker",
      engine: "postgres",
      title: "Postgres Lock Convoy Triage: Tracing Root Blocker PIDs Behind Queued DDL",
      subtitle: "420 checkout API workers are stuck on Lock:relation, but terminating the waiting ALTER TABLE alone misses the idle-in-transaction session holding the root lock.",
      summary: "Join cluster_locks and cluster_stat_activity to distinguish intermediate queued waiters from true root blocker sessions (holding granted locks while not waiting).",
      severity: "SEV-1",
      difficulty: "medium",
      category: "PostgreSQL 18 Locking & pg_stat_activity",
      trackId: "track-6",
      xp: 250,
      estimatedMinutes: 20,
      relatedSlugs: ["table-locks-intention-locks-ddl-hazards", "lock-contention-zero-downtime-ddl"],
      symptoms: [
        "Checkout p99 jumps to 30s timeout; pg_stat_activity shows dozens of SELECTs waiting on Lock:relation for orders.",
        "PID 4104 (flyway-migrator ALTER TABLE) is blocking PIDs 4105..4107, yet PID 4104 is itself blocked by upstream sessions!",
        "Killing random waiting SELECTs achieves nothing; on-call needs the exact root blocker PIDs, their state, and how many downstream waiters they hold up."
      ],
      metricsAndLogs: {
        errorRate: "84.0%",
        latencyP99: "29,800ms",
        downstreamCpu: "19.0%",
        effectiveRps: 340,
        baselineRps: 14500,
        timeseries: [
          { time: "14:26:00", cpu: 22, latencyP99: 8, errorRate: 0, rps: 14500 },
          { time: "14:27:00", cpu: 31, latencyP99: 1900, errorRate: 14.5, rps: 6200 },
          { time: "14:28:00", cpu: 19, latencyP99: 29800, errorRate: 84.0, rps: 340 }
        ],
        logs: [
          { timestamp: "14:27:06.512", level: "WARN", service: "postgres-primary", message: "process 4104 still waiting for AccessExclusiveLock on relation orders after 1500.04 ms" },
          { timestamp: "14:27:09.884", level: "ERROR", service: "pgbouncer-edge", message: "query_wait_timeout: 412 checkout_app clients queued on pool orders_rw" }
        ]
      },
      slaImpact: "Checkout writes and reads completely stalled behind multi-hop lock queue.",
      rootCauses: [
        { id: "rc-wrong-1", description: "Autovacuum worker 4112 acquired AccessExclusiveLock on orders.", correct: false, feedback: "Incorrect. Autovacuum acquires ShareUpdateExclusiveLock and here runs on audit_events_raw, not orders." },
        { id: "rc-wrong-2", description: "Read-only SELECT queries deadlock with each other under READ COMMITTED.", correct: false, feedback: "Incorrect. AccessShareLocks are mutually compatible; they queued behind waiting AccessExclusiveLock PID 4104." },
        { id: "rc-correct", description: "Root blockers (idle-in-transaction PID 4101 and active BI scan PID 4102, plus tuple-holder PID 4108) hold granted locks while ungranted DDL PID 4104 amplifies them into a FIFO lock convoy.", correct: true, feedback: "Spot on! A true root blocker is a blocking_pid that has zero ungranted lock rows of its own." }
      ],
      invariants: [
        "An intermediate waiter (like queued DDL PID 4104) appears as `blocking_pid` for downstream queries while also having `granted = false` in `cluster_locks`.",
        "A true root blocker appears as `l.blocking_pid` on at least one `NOT l.granted` lock row AND has zero `NOT granted` rows where it is the waiter (`pid`).",
        "Always inspect `blocker.state` (`idle in transaction` vs `active`) and transaction age before calling `pg_cancel_backend()` or `pg_terminate_backend()`."
      ],
      hints: [
        "Look closely at PID 4104 in `cluster_locks`: it blocks PIDs 4105, 4106, and 4107, so the buggy query lists 4104 as a blocker—even though 4104 itself has `granted = false`!",
        "Filter to blockers `b` (`JOIN cluster_stat_activity b ON b.pid = l.blocking_pid`) that are NOT themselves waiting in `cluster_locks` (`NOT EXISTS (SELECT 1 FROM cluster_locks w WHERE w.pid = b.pid AND NOT w.granted)`).",
        "Group by `b.pid, b.usename, b.application_name, b.state` over `WHERE NOT l.granted`, project `COUNT(DISTINCT l.pid) AS direct_waiters` and `EXTRACT(EPOCH FROM (TIMESTAMPTZ '2025-03-15 14:30:00+00' - b.xact_start))::int AS xact_age_sec`, ordered by `xact_age_sec DESC`."
      ],
      postmortemExplanation: "During a DDL lock convoy, naive `pg_locks` queries return the queued `ALTER TABLE` PID as the top blocker because hundreds of `SELECT`s wait directly on it—hiding the upstream `idle in transaction` worker holding `RowExclusiveLock` for 18 minutes. Filtering to root blockers (`NOT EXISTS (SELECT 1 FROM cluster_locks w WHERE w.pid = b.pid AND NOT w.granted)`) immediately isolates the true head-of-line culprits (`4101`, `4108`, `4102`).",
      interactiveTuning: [
        { id: "blockerTarget", label: "Backend Termination Target", type: "select", options: ["kill-waiting-selects", "terminate-root-idle-in-tx-and-cancel-ddl"], defaultValue: "kill-waiting-selects", description: "Which PIDs on-call terminates to drain the convoy." },
        { id: "lockTimeoutGuard", label: "Migration lock_timeout", type: "select", options: ["0-disabled", "2s-with-backoff"], defaultValue: "0-disabled", description: "Prevent DDL from parking in the lock queue." }
      ],
      optimalPreset: { blockerTarget: "terminate-root-idle-in-tx-and-cancel-ddl", lockTimeoutGuard: "2s-with-backoff" },
      verify: function(knobs) {
        var ok = knobs.blockerTarget === "terminate-root-idle-in-tx-and-cancel-ddl" && knobs.lockTimeoutGuard === "2s-with-backoff";
        return {
          success: ok,
          message: ok ? "Convoy drained in 40ms! Terminating root idle-in-tx blockers and enforcing 2s lock_timeout restored 14,500 RPS." : "Lock convoy still reforms. Terminate root blockers and set 2s-with-backoff.",
          metrics: { latencyP99: ok ? "2.1ms" : "29,800ms", errorRate: ok ? "0.00%" : "84.0%", downstreamCpu: ok ? "16.0%" : "19.0%", effectiveRps: ok ? 14500 : 340 }
        };
      },
      codeFix: {
        title: "Isolate True Root Blocker PIDs in Lock Convoy",
        summary: "Exclude intermediate queued waiters (like PID 4104) so only root blocker sessions holding locks without waiting are returned, ordered by xact_age_sec DESC.",
        datasetId: "pg_ops_telemetry",
        engine: "postgres",
        buggyCode: "-- BUGGY SQL: Includes intermediate queued DDL waiter PID 4104 even though 4104 is itself blocked!\nSELECT b.pid AS root_blocker_pid,\n       b.usename,\n       b.application_name,\n       b.state,\n       COUNT(DISTINCT l.pid) AS direct_waiters,\n       EXTRACT(EPOCH FROM (TIMESTAMPTZ '2025-03-15 14:30:00+00' - b.xact_start))::int AS xact_age_sec\nFROM cluster_locks l\nJOIN cluster_stat_activity b ON b.pid = l.blocking_pid\nWHERE NOT l.granted\nGROUP BY b.pid, b.usename, b.application_name, b.state, b.xact_start\nORDER BY xact_age_sec DESC;",
        solutionCode: "-- FIXED SQL: Filter to true root blockers that have zero ungranted lock waits of their own\nSELECT b.pid AS root_blocker_pid,\n       b.usename,\n       b.application_name,\n       b.state,\n       COUNT(DISTINCT l.pid) AS direct_waiters,\n       EXTRACT(EPOCH FROM (TIMESTAMPTZ '2025-03-15 14:30:00+00' - b.xact_start))::int AS xact_age_sec\nFROM cluster_locks l\nJOIN cluster_stat_activity b ON b.pid = l.blocking_pid\nWHERE NOT l.granted\n  AND NOT EXISTS (\n    SELECT 1\n    FROM cluster_locks w\n    WHERE w.pid = b.pid\n      AND NOT w.granted\n  )\nGROUP BY b.pid, b.usename, b.application_name, b.state, b.xact_start\nORDER BY xact_age_sec DESC;"
      }
    },
    {
      id: "chal-14-unindexed-fk-audit",
      engine: "postgres",
      title: "Catalog Forensics: Unindexed Foreign Key Triggering Parent DELETE Sequential Scans",
      subtitle: "Deleting a decommissioned warehouse row locks child shipment writes and burns 100% CPU scanning incident_shipments because PostgreSQL does not auto-index foreign keys.",
      summary: "Query pg_constraint, pg_attribute, and pg_index in pg_catalog to detect foreign keys whose constrained columns lack a matching leading-prefix valid B-Tree index.",
      severity: "SEV-2",
      difficulty: "hard",
      category: "PostgreSQL System Catalogs & Indexing",
      trackId: "track-4",
      xp: 300,
      estimatedMinutes: 25,
      relatedSlugs: ["composite-indexes-leftmost-prefix", "foreign-keys-cascading-actions"],
      symptoms: [
        "Archiving a single warehouse (`DELETE FROM incident_warehouses WHERE warehouse_id = 40`) triggers a full sequential scan on `incident_shipments`.",
        "PostgreSQL automatically creates a unique index for PRIMARY KEY / UNIQUE constraints, but NEVER auto-creates an index on referencing FOREIGN KEY columns.",
        "Developers assumed `idx_incident_shipments_carrier` covered shipments, leaving `warehouse_id` unindexed."
      ],
      metricsAndLogs: {
        errorRate: "12.4%",
        latencyP99: "6,400ms",
        downstreamCpu: "94.0%",
        effectiveRps: 810,
        baselineRps: 7500,
        timeseries: [
          { time: "10:00:00", cpu: 20, latencyP99: 5, errorRate: 0, rps: 7500 },
          { time: "10:02:00", cpu: 94, latencyP99: 6400, errorRate: 12.4, rps: 810 }
        ],
        logs: [
          { timestamp: "10:02:11.090", level: "WARN", service: "postgres-primary", message: "RI_ConstraintTrigger_a_16520 executing Seq Scan on pg_ops.incident_shipments for ON DELETE CASCADE" }
        ]
      },
      slaImpact: "Parent table deletes and key updates trigger full child table scans and prolonged KeyShare/RowExclusive contention.",
      rootCauses: [
        { id: "rc-wrong-1", description: "ON DELETE CASCADE disables all indexes on child tables in PostgreSQL.", correct: false, feedback: "Incorrect. PostgreSQL uses a child index for ON DELETE CASCADE whenever an index with the FK columns as its leading prefix exists." },
        { id: "rc-correct", description: "PostgreSQL does not automatically index referencing FOREIGN KEY columns (`conkey`); without a valid index whose leading `indkey` matches `conkey`, every parent DELETE/key-UPDATE scans the entire child heap.", correct: true, feedback: "Spot on! Auditing `pg_constraint` (`contype = 'f'`) against `pg_index` (`indisvalid` + leading `indkey` slice) catches every unindexed FK in CI." }
      ],
      invariants: [
        "In `pg_catalog.pg_constraint`, `contype = 'f'` rows store referencing column attnums in `conkey` (`int2[]`) and child table OID in `conrelid`.",
        "In `pg_catalog.pg_index`, `indkey` (`int2vector`) stores indexed column attnums; slicing `(i.indkey::int2[])[1:cardinality(c.conkey)] = c.conkey` checks exact leading-prefix coverage.",
        "Only `i.indisvalid = true` and unpredicated (`i.indpred IS NULL`) indexes guarantee general FK trigger lookup coverage."
      ],
      hints: [
        "The buggy query checks whether *any* index exists on `c.conrelid`, so `idx_incident_shipments_carrier` falsely marks `incident_shipments.warehouse_id` as indexed!",
        "Compare the leading slice of `pg_index.indkey` against `pg_constraint.conkey`: `(i.indkey::int2[])[1:cardinality(c.conkey)] = c.conkey` with `i.indisvalid AND i.indpred IS NULL`.",
        "Keep the exact projected columns (`schema_name, child_table, constraint_name, fk_column, parent_table`) for `n.nspname = 'pg_ops'` and `c.contype = 'f'` where `NOT EXISTS` a matching valid leading-prefix index."
      ],
      postmortemExplanation: "Unlike MySQL InnoDB, PostgreSQL never creates implicit indexes on `FOREIGN KEY` columns. Checking `EXISTS (SELECT 1 FROM pg_index WHERE indrelid = c.conrelid)` is a classic catalog bug because unrelated indexes (like `(carrier_code)`) pass the check. Verifying `(i.indkey::int2[])[1:cardinality(c.conkey)] = c.conkey` in `pg_catalog` pinpoints `incident_shipments(warehouse_id)` immediately.",
      interactiveTuning: [
        { id: "fkIndexPolicy", label: "Foreign Key Index Rollout", type: "select", options: ["none", "create-index-concurrently-on-fk"], defaultValue: "none", description: "How missing child FK indexes are remediated." }
      ],
      optimalPreset: { fkIndexPolicy: "create-index-concurrently-on-fk" },
      verify: function(knobs) {
        var ok = knobs.fkIndexPolicy === "create-index-concurrently-on-fk";
        return {
          success: ok,
          message: ok ? "Child FK index created CONCURRENTLY! Parent warehouse deletes now execute a 0.2ms B-Tree Index Scan." : "Child table still lacks a leading-prefix index on warehouse_id.",
          metrics: { latencyP99: ok ? "1.4ms" : "6,400ms", errorRate: ok ? "0.00%" : "12.4%", downstreamCpu: ok ? "12.0%" : "94.0%", effectiveRps: ok ? 7500 : 810 }
        };
      },
      codeFix: {
        title: "Detect Unindexed Foreign Keys via pg_catalog (pg_constraint + pg_index)",
        summary: "Fix the catalog audit query so it checks whether a valid non-partial index on the child table has a leading column prefix matching c.conkey.",
        datasetId: "pg_ops_telemetry",
        engine: "postgres",
        buggyCode: "-- BUGGY SQL: Checks if ANY index exists on the child table, missing unindexed warehouse_id!\nSELECT n.nspname AS schema_name,\n       child.relname AS child_table,\n       c.conname AS constraint_name,\n       a.attname AS fk_column,\n       parent.relname AS parent_table\nFROM pg_catalog.pg_constraint c\nJOIN pg_catalog.pg_class child ON child.oid = c.conrelid\nJOIN pg_catalog.pg_namespace n ON n.oid = child.relnamespace\nJOIN pg_catalog.pg_class parent ON parent.oid = c.confrelid\nJOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]\nWHERE c.contype = 'f'\n  AND n.nspname = 'pg_ops'\n  AND NOT EXISTS (\n    SELECT 1\n    FROM pg_catalog.pg_index i\n    WHERE i.indrelid = c.conrelid\n      AND i.indisprimary = false\n  )\nORDER BY child.relname ASC, c.conname ASC;",
        solutionCode: "-- FIXED SQL: Require a valid non-partial index whose leading indkey slice matches c.conkey\nSELECT n.nspname AS schema_name,\n       child.relname AS child_table,\n       c.conname AS constraint_name,\n       a.attname AS fk_column,\n       parent.relname AS parent_table\nFROM pg_catalog.pg_constraint c\nJOIN pg_catalog.pg_class child ON child.oid = c.conrelid\nJOIN pg_catalog.pg_namespace n ON n.oid = child.relnamespace\nJOIN pg_catalog.pg_class parent ON parent.oid = c.confrelid\nJOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]\nWHERE c.contype = 'f'\n  AND n.nspname = 'pg_ops'\n  AND NOT EXISTS (\n    SELECT 1\n    FROM pg_catalog.pg_index i\n    WHERE i.indrelid = c.conrelid\n      AND i.indisvalid\n      AND i.indpred IS NULL\n      AND (i.indkey::int2[])[1:cardinality(c.conkey)] = c.conkey\n  )\nORDER BY child.relname ASC, c.conname ASC;"
      }
    },
    {
      id: "chal-15-xid-wraparound-triage",
      engine: "postgres",
      title: "XID Wraparound & Autovacuum Starvation Triage",
      subtitle: "Cluster alerts fire at 94% of the 2-billion XID horizon because an archive table has autovacuum disabled and a queue table has 99.7% dead-tuple bloat.",
      summary: "Rank tables in cluster_table_health by wraparound proximity and dead-tuple bloat ratio to prioritize emergency VACUUM (FREEZE, INDEX_CLEANUP AUTO) remediation.",
      severity: "SEV-1",
      difficulty: "hard",
      category: "MVCC Vacuum, Freeze & Wraparound",
      trackId: "track-5",
      xp: 300,
      estimatedMinutes: 20,
      relatedSlugs: ["dead-tuples-bloat-autovacuum-txid-wraparound", "tuple-headers-xmin-xmax-visibility"],
      symptoms: [
        "`legacy_webhook_archive` has `age_relfrozenxid = 1,942,000,000` (only 58M XIDs before forced cluster shutdown) with `autovacuum_enabled = false`.",
        "`audit_events_raw` is at `1,895,000,000` XIDs (`94.8%` of 2B limit), and `job_queue_live` has `14.8M` dead tuples vs `42k` live tuples (`99.7%` dead).",
        "Sorting only by raw `dead_tup` misses `legacy_webhook_archive` (`4.1M` dead tuples, #1 wraparound emergency)!"
      ],
      metricsAndLogs: {
        errorRate: "18.0%",
        latencyP99: "4,200ms",
        downstreamCpu: "89.0%",
        effectiveRps: 1900,
        baselineRps: 16000,
        timeseries: [
          { time: "14:00:00", cpu: 62, latencyP99: 420, errorRate: 1.2, rps: 11200 },
          { time: "14:15:00", cpu: 89, latencyP99: 4200, errorRate: 18.0, rps: 1900 }
        ],
        logs: [
          { timestamp: "14:15:02.100", level: "WARNING", service: "postgres-primary", message: "database \"prod\" must be vacuumed within 58000000 transactions to avoid transaction ID wraparound" }
        ]
      },
      slaImpact: "PostgreSQL refuses all write transactions 3M XIDs before the 2,000,000,000 wraparound limit.",
      rootCauses: [
        { id: "rc-wrong-1", description: "Setting autovacuum = off on archive tables prevents XID aging.", correct: false, feedback: "Incorrect. Even read-only tables require periodic anti-wraparound VACUUM FREEZE until every page is marked all-frozen in the Visibility Map." },
        { id: "rc-correct", description: "Un-frozen tuples on `legacy_webhook_archive` (`autovacuum_enabled = false`) and `audit_events_raw` approached the 2B XID ceiling while default `0.20` scale factor let `job_queue_live` accumulate 99.7% dead tuples.", correct: true, feedback: "Spot on! Triage must combine `age_relfrozenxid >= 1000000000` wraparound emergencies and `dead_pct >= 20` bloat hotspots." }
      ],
      invariants: [
        "Wraparound distance is measured against the 2,000,000,000 XID danger horizon (`ROUND(age_relfrozenxid * 100.0 / 2000000000, 1)`).",
        "Dead-tuple bloat ratio is `ROUND(dead_tup * 100.0 / NULLIF(live_tup + dead_tup, 0), 1)`.",
        "Tables with `age_relfrozenxid >= 1500000000` require immediate `VACUUM (FREEZE)` regardless of dead tuple count."
      ],
      hints: [
        "The starter query filters only `WHERE dead_tup > 10000000`, completely missing `legacy_webhook_archive` (`age_relfrozenxid = 1.942B`, `autovacuum_enabled = false`)!",
        "Compute `ROUND(age_relfrozenxid * 100.0 / 2000000000, 1) AS wraparound_pct` and `ROUND(dead_tup * 100.0 / NULLIF(live_tup + dead_tup, 0), 1) AS dead_pct`, plus `pg_size_pretty(table_bytes + index_bytes + toast_bytes) AS total_size`.",
        "Filter `WHERE age_relfrozenxid >= 1000000000 OR (dead_tup * 100.0 / NULLIF(live_tup + dead_tup, 0)) >= 20`, label `CASE WHEN age_relfrozenxid >= 1500000000 THEN 'WRAPAROUND_EMERGENCY' ELSE 'BLOAT_HOTSPOT' END AS triage_class`, and `ORDER BY age_relfrozenxid DESC`."
      ],
      postmortemExplanation: "Sorting vacuum dashboards purely by `n_dead_tup` is a classic DBRE blind spot: an append-mostly archive table with `autovacuum_enabled = false` may have modest dead tuples yet sit 58M XIDs away from taking the entire primary offline. Combining `age_relfrozenxid` percentage of the 2B horizon with `dead_pct` surfaces both `WRAPAROUND_EMERGENCY` tables (`legacy_webhook_archive`, `audit_events_raw`) and `BLOAT_HOTSPOT` tables (`session_events`, `orders`, `job_queue_live`).",
      interactiveTuning: [
        { id: "emergencyAction", label: "Remediation Sequence", type: "select", options: ["vacuum-full-all", "reenable-autovacuum-and-vacuum-freeze"], defaultValue: "vacuum-full-all", description: "Online freeze & space reclamation strategy." }
      ],
      optimalPreset: { emergencyAction: "reenable-autovacuum-and-vacuum-freeze" },
      verify: function(knobs) {
        var ok = knobs.emergencyAction === "reenable-autovacuum-and-vacuum-freeze";
        return {
          success: ok,
          message: ok ? "Wraparound averted online! VACUUM FREEZE advanced relfrozenxid without locking out OLTP traffic." : "VACUUM FULL takes AccessExclusiveLock and stalls writes; use online VACUUM FREEZE.",
          metrics: { latencyP99: ok ? "2.8ms" : "4,200ms", errorRate: ok ? "0.00%" : "18.0%", downstreamCpu: ok ? "18.0%" : "89.0%", effectiveRps: ok ? 16000 : 1900 }
        };
      },
      codeFix: {
        title: "Build Combined XID Wraparound & Dead-Tuple Bloat Triage Query",
        summary: "Surface all tables in cluster_table_health with age_relfrozenxid >= 1B OR dead_pct >= 20%, classified as WRAPAROUND_EMERGENCY vs BLOAT_HOTSPOT.",
        datasetId: "pg_ops_telemetry",
        engine: "postgres",
        buggyCode: "-- BUGGY SQL: Filters only raw dead_tup > 10M, completely missing legacy_webhook_archive at 1.94B XIDs!\nSELECT table_name,\n       autovacuum_enabled,\n       age_relfrozenxid,\n       dead_tup\nFROM cluster_table_health\nWHERE dead_tup > 10000000\nORDER BY dead_tup DESC;",
        solutionCode: "-- FIXED SQL: Rank both XID wraparound emergencies (>= 1B XIDs) and >= 20% dead-tuple bloat hotspots\nSELECT table_name,\n       autovacuum_enabled,\n       ROUND(age_relfrozenxid * 100.0 / 2000000000, 1) AS wraparound_pct,\n       ROUND(dead_tup * 100.0 / NULLIF(live_tup + dead_tup, 0), 1) AS dead_pct,\n       pg_size_pretty(table_bytes + index_bytes + toast_bytes) AS total_size,\n       CASE\n         WHEN age_relfrozenxid >= 1500000000 THEN 'WRAPAROUND_EMERGENCY'\n         ELSE 'BLOAT_HOTSPOT'\n       END AS triage_class\nFROM cluster_table_health\nWHERE age_relfrozenxid >= 1000000000\n   OR (dead_tup * 100.0 / NULLIF(live_tup + dead_tup, 0)) >= 20\nORDER BY age_relfrozenxid DESC;"
      }
    },
    {
      id: "chal-16-redundant-invalid-indexes",
      engine: "postgres",
      title: "Write Amplification Audit: Dropping INVALID, Redundant Prefix & Unused Non-Unique Indexes",
      subtitle: "Every INSERT on orders updates 6 indexes (disabling HOT updates and doubling WAL), including a broken CONCURRENTLY leftover, two 0-scan indexes, and two prefix-redundant indexes.",
      summary: "Audit cluster_index_health while protecting PRIMARY KEY and UNIQUE constraint indexes (`idx_orders_merchant_ref_uniq`) from accidental deletion!",
      severity: "SEV-2",
      difficulty: "medium",
      category: "B-Tree Maintenance & Write Amplification",
      trackId: "track-4",
      xp: 250,
      estimatedMinutes: 20,
      relatedSlugs: ["composite-indexes-leftmost-prefix", "covering-indexes-index-only-scans"],
      symptoms: [
        "Failed `CREATE INDEX CONCURRENTLY` left behind `idx_orders_email_lower_ccnew` (`is_valid = false`), which slows down every `INSERT`/`UPDATE` while never serving a `SELECT`!",
        "`idx_orders_customer_id` (`{customer_id}`) and `idx_ledger_account` (`{account_id}`) are strict leading prefixes of wider composite B-Tree indexes on the same tables.",
        "A naive `WHERE idx_scan = 0` cleanup script almost dropped `idx_orders_merchant_ref_uniq` (`is_unique = true`), which enforces merchant idempotency!"
      ],
      metricsAndLogs: {
        errorRate: "4.2%",
        latencyP99: "38ms",
        downstreamCpu: "76.0%",
        effectiveRps: 6400,
        baselineRps: 14000,
        timeseries: [
          { time: "12:00:00", cpu: 41, latencyP99: 9, errorRate: 0, rps: 14000 },
          { time: "12:05:00", cpu: 76, latencyP99: 38, errorRate: 4.2, rps: 6400 }
        ],
        logs: [
          { timestamp: "12:05:10.004", level: "WARN", service: "postgres-primary", message: "17.7 GB of redundant/invalid/unused non-unique B-Tree indexes amplifying WAL generation" }
        ]
      },
      slaImpact: "Excess index maintenance blocks Heap-Only Tuple (HOT) updates and inflates WAL replication bandwidth by 2.1x.",
      rootCauses: [
        { id: "rc-wrong-1", description: "Any index with idx_scan = 0 is safe to drop immediately, including UNIQUE indexes.", correct: false, feedback: "Incorrect! A UNIQUE index with idx_scan = 0 is actively consulted on every INSERT/UPDATE to enforce uniqueness; dropping it breaks data integrity." },
        { id: "rc-correct", description: "Non-unique indexes that are `NOT is_valid`, have `idx_scan = 0`, or are strict leading prefixes of another valid index on the same table incur pure write/WAL overhead with zero read benefit.", correct: true, feedback: "Spot on! Protecting `is_primary = false AND is_unique = false` while flagging INVALID, REDUNDANT_PREFIX, and UNUSED_NON_UNIQUE safely reclaims 17.7 GB." }
      ],
      invariants: [
        "An `INVALID` index (`NOT is_valid`) is ignored by the query planner for reads, yet PostgreSQL still updates it on every heap insert/update.",
        "Never auto-drop `is_primary` or `is_unique` indexes solely because `idx_scan = 0` (uniqueness checks do not increment `idx_scan` when no conflict occurs, or enforce rare invariants).",
        "A non-unique B-Tree on `key_columns` `A` is prefix-redundant when a valid B-Tree on the same table starts with `A` (`other.key_columns[1:cardinality(i.key_columns)] = i.key_columns`) and has more columns."
      ],
      hints: [
        "Look at why the starter query is dangerous: `WHERE idx_scan = 0` includes `idx_orders_merchant_ref_uniq` (`is_unique = true`) and misses prefix-redundant indexes (`idx_orders_customer_id`, `idx_ledger_account`)!",
        "Guard with `WHERE NOT i.is_primary AND NOT i.is_unique` and check three drop conditions: `(NOT i.is_valid)`, `EXISTS (valid wider index on same table with matching leading key_columns slice)`, or `i.idx_scan = 0`.",
        "Project `i.table_name, i.index_name, pg_size_pretty(i.index_bytes) AS index_size, i.idx_scan`, and `CASE WHEN NOT i.is_valid THEN 'INVALID_CONCURRENTLY' WHEN EXISTS (...) THEN 'REDUNDANT_PREFIX' ELSE 'UNUSED_NON_UNIQUE' END AS drop_reason`, ordered by `i.index_bytes DESC`."
      ],
      postmortemExplanation: "Automated index-pruning scripts cause severe production bugs when they drop `idx_scan = 0` `UNIQUE` indexes (`idx_orders_merchant_ref_uniq`) that guard idempotency keys. Filtering `NOT i.is_primary AND NOT i.is_unique` and classifying `INVALID_CONCURRENTLY`, `REDUNDANT_PREFIX` (array slice `other.key_columns[1:cardinality(i.key_columns)] = i.key_columns`), and `UNUSED_NON_UNIQUE` safely isolates the 5 waste indexes.",
      interactiveTuning: [
        { id: "dropMethod", label: "Index Removal Command", type: "select", options: ["drop-index-blocking", "drop-index-concurrently-non-unique"], defaultValue: "drop-index-blocking", description: "Online index removal without AccessExclusiveLock." }
      ],
      optimalPreset: { dropMethod: "drop-index-concurrently-non-unique" },
      verify: function(knobs) {
        var ok = knobs.dropMethod === "drop-index-concurrently-non-unique";
        return {
          success: ok,
          message: ok ? "5 waste indexes dropped CONCURRENTLY! HOT update ratio jumped to 84% while preserving merchant_ref uniqueness." : "DROP INDEX without CONCURRENTLY acquires AccessExclusiveLock.",
          metrics: { latencyP99: ok ? "2.2ms" : "38ms", errorRate: ok ? "0.00%" : "4.2%", downstreamCpu: ok ? "15.0%" : "76.0%", effectiveRps: ok ? 14000 : 6400 }
        };
      },
      codeFix: {
        title: "Audit Safe-to-Drop Invalid, Redundant-Prefix & Unused Non-Unique Indexes",
        summary: "Protect primary/unique indexes and return non-unique indexes that are INVALID, prefix-redundant, or 0-scan unused, ordered by index_bytes DESC.",
        datasetId: "pg_ops_telemetry",
        engine: "postgres",
        buggyCode: "-- BUGGY SQL: Dangerously flags UNIQUE index idx_orders_merchant_ref_uniq and misses prefix-redundant indexes!\nSELECT i.table_name,\n       i.index_name,\n       pg_size_pretty(i.index_bytes) AS index_size,\n       i.idx_scan,\n       'DROP_CANDIDATE' AS drop_reason\nFROM cluster_index_health i\nWHERE i.idx_scan = 0\nORDER BY i.index_bytes DESC;",
        solutionCode: "-- FIXED SQL: Exclude primary/unique indexes and classify INVALID, REDUNDANT_PREFIX, and UNUSED_NON_UNIQUE\nSELECT i.table_name,\n       i.index_name,\n       pg_size_pretty(i.index_bytes) AS index_size,\n       i.idx_scan,\n       CASE\n         WHEN NOT i.is_valid THEN 'INVALID_CONCURRENTLY'\n         WHEN EXISTS (\n           SELECT 1\n           FROM cluster_index_health o\n           WHERE o.table_name = i.table_name\n             AND o.index_name <> i.index_name\n             AND o.is_valid\n             AND cardinality(o.key_columns) > cardinality(i.key_columns)\n             AND o.key_columns[1:cardinality(i.key_columns)] = i.key_columns\n         ) THEN 'REDUNDANT_PREFIX'\n         ELSE 'UNUSED_NON_UNIQUE'\n       END AS drop_reason\nFROM cluster_index_health i\nWHERE NOT i.is_primary\n  AND NOT i.is_unique\n  AND (\n    NOT i.is_valid\n    OR i.idx_scan = 0\n    OR EXISTS (\n      SELECT 1\n      FROM cluster_index_health o\n      WHERE o.table_name = i.table_name\n        AND o.index_name <> i.index_name\n        AND o.is_valid\n        AND cardinality(o.key_columns) > cardinality(i.key_columns)\n        AND o.key_columns[1:cardinality(i.key_columns)] = i.key_columns\n    )\n  )\nORDER BY i.index_bytes DESC;"
      }
    },
    {
      id: "chal-17-work-mem-temp-spill",
      engine: "postgres",
      title: "pg_stat_statements I/O Forensics: External Disk Sort Spills & Cache Miss Culprits",
      subtitle: "NVMe write latency spikes 14x every hour while CPU looks moderate because three analytical/ETL queries exceed default 4MB work_mem and spill gigabytes to base/pgsql_tmp.",
      summary: "Analyze cluster_stat_statements block counters (temp_blks_written, shared_blks_hit, shared_blks_read) using 8KB PostgreSQL block math to pinpoint temp-file spillers.",
      severity: "SEV-2",
      difficulty: "medium",
      category: "pg_stat_statements & Memory Tuning",
      trackId: "track-6",
      xp: 250,
      estimatedMinutes: 15,
      relatedSlugs: ["sorting-spill-to-disk-top-n-heapsort", "reading-explain-and-explain-analyze"],
      symptoms: [
        "`pgsql_tmp` writes saturate local NVMe bandwidth even though OLTP queries take 1.4ms.",
        "Sorting `pg_stat_statements` by `calls DESC` highlights fast point lookups (`2.85M` calls, `0` temp blocks) and buries low-frequency heavy spillers.",
        "PostgreSQL block counters (`temp_blks_written`, `shared_blks_hit`, `shared_blks_read`) are measured in 8,192-byte (`8 KB`) pages, not bytes!"
      ],
      metricsAndLogs: {
        errorRate: "7.5%",
        latencyP99: "7,200ms",
        downstreamCpu: "68.0%",
        effectiveRps: 3100,
        baselineRps: 12000,
        timeseries: [
          { time: "14:00:00", cpu: 30, latencyP99: 12, errorRate: 0, rps: 12000 },
          { time: "14:10:00", cpu: 68, latencyP99: 7200, errorRate: 7.5, rps: 3100 }
        ],
        logs: [
          { timestamp: "14:10:04.221", level: "LOG", service: "postgres-primary", message: "temporary file: path \"base/pgsql_tmp/pgsql_tmp4102.0\", size 789708800" }
        ]
      },
      slaImpact: "Analytics and ETL temp-disk spills starve WAL fsync IOPS on shared NVMe volumes.",
      rootCauses: [
        { id: "rc-wrong-1", description: "Setting global work_mem = 4GB in postgresql.conf is safe with max_connections = 500.", correct: false, feedback: "Incorrect! work_mem can be allocated per sort/hash node per connection—500 connections × 4 nodes × 4GB would OOM-kill the host." },
        { id: "rc-correct", description: "Low-frequency analytical/ETL queries exceeded 4MB session work_mem, spilling `temp_blks_written * 8192` bytes to disk; scoping `SET LOCAL work_mem = '128MB'` to the reporting role eliminates spills safely.", correct: true, feedback: "Spot on! Role/transaction-scoped SET LOCAL work_mem fixes temp spills without risking global OOM." }
      ],
      invariants: [
        "Every `*_blks_*` column in `pg_stat_statements` counts `8192`-byte (`8 KB`) blocks: `temp_blks_written * 8192` converts blocks to bytes.",
        "Buffer cache hit ratio per query is `ROUND(shared_blks_hit * 100.0 / NULLIF(shared_blks_hit + shared_blks_read, 0), 2)`.",
        "Per-call temp spill (`pg_size_pretty((temp_blks_written * 8192) / NULLIF(calls, 0))`) tells you the exact `SET LOCAL work_mem` target needed."
      ],
      hints: [
        "The buggy query orders by `calls DESC` and forgets to multiply `temp_blks_written` by `8192` bytes per 8KB PostgreSQL block!",
        "Filter `WHERE temp_blks_written > 0` so only queries spilling to `pgsql_tmp` appear.",
        "Project `queryid, rolname, calls, mean_exec_time_ms, pg_size_pretty(temp_blks_written * 8192) AS total_temp_spill, pg_size_pretty((temp_blks_written * 8192) / calls) AS avg_spill_per_call, ROUND(shared_blks_hit * 100.0 / NULLIF(shared_blks_hit + shared_blks_read, 0), 1) AS cache_hit_pct`, ordered by `temp_blks_written DESC`."
      ],
      postmortemExplanation: "In `pg_stat_statements`, `temp_blks_written` counts 8,192-byte blocks written to `base/pgsql_tmp` when `Sort` or `HashAggregate` nodes exceed `work_mem`. Dividing `(temp_blks_written * 8192) / calls` reveals the per-execution spill size (~1.2 MB–1.8 MB average, higher on skewed runs), allowing targeted `ALTER ROLE analytics_ro SET work_mem = '64MB'` without risking OOM across OLTP connections.",
      interactiveTuning: [
        { id: "workMemScope", label: "work_mem Configuration Scope", type: "select", options: ["global-postgresql-conf-2gb", "role-and-set-local-64mb"], defaultValue: "global-postgresql-conf-2gb", description: "Where elevated work_mem is applied." }
      ],
      optimalPreset: { workMemScope: "role-and-set-local-64mb" },
      verify: function(knobs) {
        var ok = knobs.workMemScope === "role-and-set-local-64mb";
        return {
          success: ok,
          message: ok ? "Zero temp disk spills! Scoped 64MB work_mem switched external merge Disk sorts to in-memory quicksort." : "Global multi-GB work_mem risks Linux OOM killer under connection bursts.",
          metrics: { latencyP99: ok ? "2.4ms" : "7,200ms", errorRate: ok ? "0.00%" : "7.5%", downstreamCpu: ok ? "21.0%" : "68.0%", effectiveRps: ok ? 12000 : 3100 }
        };
      },
      codeFix: {
        title: "Pinpoint Temp-Disk Spill Queries & Per-Call Spill Size in pg_stat_statements",
        summary: "Filter to temp-spilling queries (temp_blks_written > 0) and convert 8KB block counters to human-readable total and per-call spill sizes.",
        datasetId: "pg_ops_telemetry",
        engine: "postgres",
        buggyCode: "-- BUGGY SQL: Ranks by calls DESC and passes raw block counts instead of 8192-byte sizes to pg_size_pretty!\nSELECT queryid,\n       rolname,\n       calls,\n       mean_exec_time_ms,\n       pg_size_pretty(temp_blks_written) AS total_temp_spill\nFROM cluster_stat_statements\nORDER BY calls DESC\nLIMIT 5;",
        solutionCode: "-- FIXED SQL: Filter temp_blks_written > 0 and multiply 8KB block counts by 8192 bytes\nSELECT queryid,\n       rolname,\n       calls,\n       mean_exec_time_ms,\n       pg_size_pretty(temp_blks_written * 8192) AS total_temp_spill,\n       pg_size_pretty((temp_blks_written * 8192) / calls) AS avg_spill_per_call,\n       ROUND(shared_blks_hit * 100.0 / NULLIF(shared_blks_hit + shared_blks_read, 0), 1) AS cache_hit_pct\nFROM cluster_stat_statements\nWHERE temp_blks_written > 0\nORDER BY temp_blks_written DESC;"
      }
    },
    {
      id: "chal-18-orphaned-slot-wal-bloat",
      engine: "postgres",
      title: "pg_wal Disk Full Emergency: Orphaned Logical Replication Slots Retaining 68 GB of WAL",
      subtitle: "Primary database `/var/lib/postgresql/data/pg_wal` hits 96% disk capacity because a decommissioned Debezium connector left an inactive replication slot pinning `restart_lsn`.",
      summary: "Use native `pg_wal_lsn_diff(current_wal_lsn, restart_lsn)` and `pg_size_pretty()` on `cluster_replication_slots` to quantify retained WAL bytes and catalog_xmin horizon.",
      severity: "SEV-1",
      difficulty: "medium",
      category: "WAL Retention & Replication Slots",
      trackId: "track-6",
      xp: 250,
      estimatedMinutes: 15,
      relatedSlugs: ["wal-write-ahead-logging-aries", "streaming-logical-replication-lag"],
      symptoms: [
        "Primary `pg_wal` volume grows by 12 GB/hour despite `max_wal_size = 8GB` and clean checkpoints.",
        "Deleting files manually inside `pg_wal/` corrupts the cluster irrevocably—the culprit is a replication slot holding `restart_lsn` at `03/80000000` while current WAL is `14/80000000`!",
        "Inactive logical slots also pin `catalog_xmin`, preventing system catalog dead-tuple cleanup."
      ],
      metricsAndLogs: {
        errorRate: "0.0%",
        latencyP99: "19ms",
        downstreamCpu: "34.0%",
        effectiveRps: 11800,
        baselineRps: 12000,
        timeseries: [
          { time: "14:00:00", cpu: 31, latencyP99: 14, errorRate: 0, rps: 12000 },
          { time: "14:25:00", cpu: 34, latencyP99: 19, errorRate: 0, rps: 11800 }
        ],
        logs: [
          { timestamp: "14:25:10.001", level: "CRITICAL", service: "node-exporter", message: "filesystem /pgdata/pg_wal 96.4% full (73.0 GB used); PANIC on ENOSPC imminent" }
        ]
      },
      slaImpact: "Total primary PANIC crash-loop within 18 minutes when pg_wal exhausts filesystem blocks.",
      rootCauses: [
        { id: "rc-wrong-1", description: "Running rm -f pg_wal/00000001* is the safe way to free WAL disk space.", correct: false, feedback: "NEVER delete files in pg_wal manually! Doing so destroys crash recovery and bricks the PostgreSQL cluster." },
        { id: "rc-correct", description: "Inactive logical replication slots (`debezium_legacy_analytics`, `snowflake_sync_staging`) without `max_slot_wal_keep_size` force PostgreSQL to retain every WAL segment since `restart_lsn` (`68 GB` + `5 GB`).", correct: true, feedback: "Spot on! Dropping the abandoned slot via pg_drop_replication_slot() and setting max_slot_wal_keep_size lets the next CHECKPOINT recycle pg_wal safely." }
      ],
      invariants: [
        "`pg_wal_lsn_diff(current_wal_lsn, restart_lsn)` returns the exact `NUMERIC` byte lag retained on primary `pg_wal` by each slot.",
        "An orphaned slot has `NOT active` and multi-gigabyte `pg_wal_lsn_diff` lag.",
        "`max_slot_wal_keep_size` caps maximum WAL retained by slow/dead slots in PostgreSQL 13+ so primary disk never hits `ENOSPC`."
      ],
      hints: [
        "The buggy query filters `WHERE active = true`, hiding the inactive orphaned slots that are retaining 73 GB of WAL!",
        "Compute `pg_wal_lsn_diff(current_wal_lsn, restart_lsn)::bigint AS retained_wal_bytes` and `pg_size_pretty(pg_wal_lsn_diff(current_wal_lsn, restart_lsn)) AS retained_wal_pretty` across all slots.",
        "Classify `CASE WHEN NOT active AND pg_wal_lsn_diff(current_wal_lsn, restart_lsn) >= 1073741824 THEN 'DROP_ORPHANED_SLOT' WHEN pg_wal_lsn_diff(current_wal_lsn, restart_lsn) >= 104857600 THEN 'WARN_LAG' ELSE 'HEALTHY' END AS action_status` and `ORDER BY retained_wal_bytes DESC`."
      ],
      postmortemExplanation: "PostgreSQL honors replication slots unconditionally unless `max_slot_wal_keep_size` is configured: an abandoned `active = false` Debezium slot (`debezium_legacy_analytics`) at `03/80000000` vs `14/80000000` forces retention of `68 GB` (`73,014,444,032` bytes) of WAL segments plus pins `catalog_xmin = 79100420`. Measuring `pg_wal_lsn_diff(current_wal_lsn, restart_lsn)` across all slots identifies orphaned slots before `ENOSPC` crashes the primary.",
      interactiveTuning: [
        { id: "walSlotGuard", label: "Replication Slot Safeguard", type: "select", options: ["manual-rm-pg-wal", "drop-inactive-slot-and-set-max-slot-wal-keep-size"], defaultValue: "manual-rm-pg-wal", description: "Safe WAL reclamation procedure." }
      ],
      optimalPreset: { walSlotGuard: "drop-inactive-slot-and-set-max-slot-wal-keep-size" },
      verify: function(knobs) {
        var ok = knobs.walSlotGuard === "drop-inactive-slot-and-set-max-slot-wal-keep-size";
        return {
          success: ok,
          message: ok ? "73 GB of retained WAL recycled cleanly on CHECKPOINT! max_slot_wal_keep_size = 16GB prevents future ENOSPC." : "Never touch pg_wal files manually! Drop the orphaned slot via SQL and set max_slot_wal_keep_size.",
          metrics: { latencyP99: ok ? "2.1ms" : "19ms", errorRate: "0.00%", downstreamCpu: ok ? "16.0%" : "34.0%", effectiveRps: 12000 }
        };
      },
      codeFix: {
        title: "Quantify Retained WAL Bytes & Flag Orphaned Replication Slots",
        summary: "Compute pg_wal_lsn_diff(current_wal_lsn, restart_lsn) across all slots and classify orphaned >= 1GB inactive slots as DROP_ORPHANED_SLOT.",
        datasetId: "pg_ops_telemetry",
        engine: "postgres",
        buggyCode: "-- BUGGY SQL: Filters only active = true slots, completely missing inactive slots retaining 73 GB of WAL!\nSELECT slot_name,\n       slot_type,\n       active,\n       restart_lsn,\n       current_wal_lsn\nFROM cluster_replication_slots\nWHERE active = true\nORDER BY slot_name ASC;",
        solutionCode: "-- FIXED SQL: Measure retained WAL bytes with pg_wal_lsn_diff and flag inactive >= 1GB orphaned slots\nSELECT slot_name,\n       slot_type,\n       active,\n       catalog_xmin,\n       pg_wal_lsn_diff(current_wal_lsn, restart_lsn)::bigint AS retained_wal_bytes,\n       pg_size_pretty(pg_wal_lsn_diff(current_wal_lsn, restart_lsn)) AS retained_wal_pretty,\n       CASE\n         WHEN NOT active AND pg_wal_lsn_diff(current_wal_lsn, restart_lsn) >= 1073741824 THEN 'DROP_ORPHANED_SLOT'\n         WHEN pg_wal_lsn_diff(current_wal_lsn, restart_lsn) >= 104857600 THEN 'WARN_LAG'\n         ELSE 'HEALTHY'\n       END AS action_status\nFROM cluster_replication_slots\nORDER BY retained_wal_bytes DESC;"
      }
    },
    {
      id: "chal-19-gist-booking-overlap",
      engine: "postgres",
      title: "Temporal Range Exclusion Bug: Endpoint Equality vs GiST Range Overlap (`&&`)",
      subtitle: "Incident war-room scheduler rejects valid back-to-back `[10:30, 12:00)` + `[12:00, 13:00)` handoffs while missing partial overlaps because application SQL compared endpoints with `<=` / `>=`.",
      summary: "Use PostgreSQL's native half-open `tstzrange` overlap operator (`&&`) against `room_bookings` to separate conflict-free `booking_requests` from overlapping ones.",
      severity: "SEV-2",
      difficulty: "medium",
      category: "PostgreSQL Range Types & GiST Exclusion",
      trackId: "track-3",
      xp: 225,
      estimatedMinutes: 15,
      relatedSlugs: ["temporal-tables-valid-transaction-time", "gist-gin-brin-specialized-indexes"],
      symptoms: [
        "`room_bookings` enforces `EXCLUDE USING gist (room_name WITH =, during WITH &&)` over half-open `[start, end)` `tstzrange` intervals.",
        "The pre-flight check query used `lower(r.requested_during) <= upper(b.during) AND upper(r.requested_during) >= lower(b.during)`, which treats touching half-open boundaries (`12:00 = 12:00`) as a conflict!",
        "As a result, valid back-to-back handoff slots (`request_id` 202, 204, 206, 208) were falsely rejected."
      ],
      metricsAndLogs: {
        errorRate: "50.0%",
        latencyP99: "9ms",
        downstreamCpu: "15.0%",
        effectiveRps: 400,
        baselineRps: 800,
        timeseries: [
          { time: "10:00:00", cpu: 14, latencyP99: 4, errorRate: 0, rps: 800 },
          { time: "10:05:00", cpu: 15, latencyP99: 9, errorRate: 50.0, rps: 400 }
        ],
        logs: [
          { timestamp: "10:05:12.400", level: "ERROR", service: "scheduler-api", message: "False conflict reported for [12:00, 13:00) adjacent to [10:30, 12:00) on war-room-alpha" }
        ]
      },
      slaImpact: "50% of valid adjacent incident war-room bookings rejected by faulty boundary math.",
      rootCauses: [
        { id: "rc-wrong-1", description: "PostgreSQL tstzrange defaults to closed [start, end] inclusive bounds on both ends.", correct: false, feedback: "Incorrect. PostgreSQL ranges use canonical half-open [start, end) semantics so adjacent [a, b) and [b, c) share zero points." },
        { id: "rc-correct", description: "Using `<=` and `>=` on `lower()`/`upper()` treats half-open boundary adjacency (`upper(A) = lower(B)`) as an overlap and bypasses the GiST index; native `r.requested_during && b.during` matches `EXCLUDE USING gist` semantics exactly.", correct: true, feedback: "Spot on! The GiST-accelerated `&&` operator respects inclusive/exclusive range flags automatically." }
      ],
      invariants: [
        "For half-open ranges `[s1, e1)` and `[s2, e2)`, overlap holds iff `s1 < e2 AND e1 > s2` — built directly into PostgreSQL's `&&` operator.",
        "Adjacent intervals `[10:30, 12:00)` and `[12:00, 13:00)` satisfy `NOT (A && B)` and are accepted by `EXCLUDE USING gist (room_name WITH =, during WITH &&)`.",
        "Using `&&` directly allows PostgreSQL to use the GiST index created by the exclusion constraint."
      ],
      hints: [
        "Compare `[10:30, 12:00)` and `[12:00, 13:00)`: with `<=` and `>=`, `12:00 <= 12:00` is `TRUE`, falsely rejecting valid back-to-back meetings!",
        "Replace manual `lower(...) <= upper(...)` math with PostgreSQL's native range overlap operator: `b.during && r.requested_during`.",
        "Return all 8 `booking_requests` (`r.request_id, r.room_name, r.requested_by, r.requested_during, r.priority`) with `CASE WHEN EXISTS (SELECT 1 FROM room_bookings b WHERE b.room_name = r.room_name AND b.during && r.requested_during) THEN 'CONFLICT' ELSE 'ADMIT' END AS booking_decision`, ordered by `r.request_id ASC`."
      ],
      postmortemExplanation: "Hand-rolled timestamp overlap predicates (`start1 <= end2 AND end1 >= start2`) fail on half-open `[start, end)` intervals whenever two meetings touch at an exact boundary (`12:00`), and prevent GiST index scans. Replacing endpoint comparisons with `b.during && r.requested_during` aligns application pre-checks 1:1 with `EXCLUDE USING gist (room_name WITH =, during WITH &&)`.",
      interactiveTuning: [
        { id: "rangeCheckMode", label: "Overlap Enforcement & Query Operator", type: "select", options: ["manual-le-ge-endpoints", "gist-range-overlap-operator"], defaultValue: "manual-le-ge-endpoints", description: "How temporal overlaps are queried and enforced." }
      ],
      optimalPreset: { rangeCheckMode: "gist-range-overlap-operator" },
      verify: function(knobs) {
        var ok = knobs.rangeCheckMode === "gist-range-overlap-operator";
        return {
          success: ok,
          message: ok ? "GiST && overlap verified! Adjacent handoff slots admit cleanly while true overlaps are blocked at the storage engine." : "Manual <= / >= endpoint checks reject valid back-to-back intervals.",
          metrics: { latencyP99: ok ? "1.1ms" : "9ms", errorRate: ok ? "0.00%" : "50.0%", downstreamCpu: "12.0%", effectiveRps: 800 }
        };
      },
      codeFix: {
        title: "Fix Temporal Booking Conflict Pre-Check with Native GiST `&&` Range Overlap",
        summary: "Classify each row in booking_requests as CONFLICT or ADMIT using native tstzrange overlap (b.during && r.requested_during), ordered by request_id ASC.",
        datasetId: "pg_ops_telemetry",
        engine: "postgres",
        buggyCode: "-- BUGGY SQL: <= and >= treat back-to-back half-open [10:30, 12:00) and [12:00, 13:00) slots as overlapping!\nSELECT r.request_id,\n       r.room_name,\n       r.requested_by,\n       r.requested_during,\n       r.priority,\n       CASE\n         WHEN EXISTS (\n           SELECT 1\n           FROM room_bookings b\n           WHERE b.room_name = r.room_name\n             AND lower(r.requested_during) <= upper(b.during)\n             AND upper(r.requested_during) >= lower(b.during)\n         ) THEN 'CONFLICT'\n         ELSE 'ADMIT'\n       END AS booking_decision\nFROM booking_requests r\nORDER BY r.request_id ASC;",
        solutionCode: "-- FIXED SQL: Native tstzrange && overlap operator respects half-open [start, end) boundaries and GiST indexes\nSELECT r.request_id,\n       r.room_name,\n       r.requested_by,\n       r.requested_during,\n       r.priority,\n       CASE\n         WHEN EXISTS (\n           SELECT 1\n           FROM room_bookings b\n           WHERE b.room_name = r.room_name\n             AND b.during && r.requested_during\n         ) THEN 'CONFLICT'\n         ELSE 'ADMIT'\n       END AS booking_decision\nFROM booking_requests r\nORDER BY r.request_id ASC;"
      }
    },
    {
      id: "chal-20-merge-ledger-reconcile",
      engine: "postgres",
      title: "PostgreSQL 18 Atomic Settlement Sync: `MERGE INTO ... WHEN NOT MATCHED BY SOURCE ... RETURNING`",
      subtitle: "Legacy 3-step `UPDATE` + `INSERT` + `DELETE` settlement scripts left orphaned `closed` zero-balance accounts and race windows between statements.",
      summary: "Consolidate multi-statement ledger synchronization into a single atomic PostgreSQL 18 `MERGE INTO` using `WHEN MATCHED`, `WHEN NOT MATCHED`, `WHEN NOT MATCHED BY SOURCE`, and `RETURNING merge_action()`.",
      severity: "SEV-1",
      difficulty: "hard",
      category: "PostgreSQL 18 MERGE & Returning Clauses",
      trackId: "track-3",
      xp: 300,
      estimatedMinutes: 20,
      relatedSlugs: ["merge-upsert-returning-patterns", "acid-properties-wal-atomicity"],
      symptoms: [
        "Separate `INSERT ... ON CONFLICT`, `UPDATE`, and `DELETE` statements read different `READ COMMITTED` snapshots during nightly settlement.",
        "Stale zero-balance closed accounts (`account_id = 506`, absent from `ledger_sync_staging` with `status = 'closed'` and `balance_cents = 0`) were never pruned.",
        "Audit compliance requires a single atomic statement returning every affected row alongside `merge_action()` (`'INSERT'`, `'UPDATE'`, `'DELETE'`) and post-merge balance."
      ],
      metricsAndLogs: {
        errorRate: "8.3%",
        latencyP99: "410ms",
        downstreamCpu: "45.0%",
        effectiveRps: 600,
        baselineRps: 2400,
        timeseries: [
          { time: "02:00:00", cpu: 25, latencyP99: 35, errorRate: 0, rps: 2400 },
          { time: "02:02:00", cpu: 45, latencyP99: 410, errorRate: 8.3, rps: 600 }
        ],
        logs: [
          { timestamp: "02:02:14.772", level: "ERROR", service: "settlement-sync", message: "Audit mismatch: multi-statement sync skipped stale closed account 506 and lacked per-row merge_action()" }
        ]
      },
      slaImpact: "Nightly ledger settlement audit fails reconciliation against upstream clearinghouse feed.",
      rootCauses: [
        { id: "rc-wrong-1", description: "INSERT ... ON CONFLICT can delete target rows that are absent from the source staging table.", correct: false, feedback: "Incorrect. INSERT ... ON CONFLICT only acts on rows present in the INSERT input; it cannot touch target rows missing from the source." },
        { id: "rc-correct", description: "PostgreSQL 17/18 `MERGE INTO` with `WHEN NOT MATCHED BY SOURCE AND t.status = 'closed' AND t.balance_cents = 0 THEN DELETE` and `RETURNING merge_action()` performs updates, inserts, and stale target pruning in one snapshot with full audit output.", correct: true, feedback: "Spot on! One atomic MERGE statement handles matched deltas, new accounts, and stale closed-account cleanup with RETURNING merge_action()." }
      ],
      invariants: [
        "`WHEN MATCHED` updates existing accounts: `balance_cents = t.balance_cents + s.delta_cents, status = s.new_status, updated_at = s.synced_at`.",
        "`WHEN NOT MATCHED` (by target) inserts new accounts from `ledger_sync_staging` (`account_id = 507`) with `s.delta_cents` as initial `balance_cents`.",
        "PostgreSQL 17/18 `WHEN NOT MATCHED BY SOURCE AND t.status = 'closed' AND t.balance_cents = 0 THEN DELETE` prunes closed zero-balance target accounts absent from `ledger_sync_staging` (`account_id = 506`) while leaving dormant accounts (`504`) untouched, and `RETURNING merge_action()` reports `'UPDATE'`, `'INSERT'`, or `'DELETE'`."
      ],
      hints: [
        "`INSERT ... ON CONFLICT` cannot prune `account_id = 506` (`NOT MATCHED BY SOURCE`) or report `'DELETE'` via `merge_action()`.",
        "Write `WITH merged AS (MERGE INTO ledger_accounts t USING ledger_sync_staging s ON t.account_id = s.account_id ... RETURNING merge_action() AS action, COALESCE(t.account_id, s.account_id) AS account_id, COALESCE(t.account_code, s.account_code) AS account_code, t.balance_cents, t.status)`.",
        "Include all three branches (`WHEN MATCHED THEN UPDATE ...`, `WHEN NOT MATCHED THEN INSERT ...`, `WHEN NOT MATCHED BY SOURCE AND t.status = 'closed' AND t.balance_cents = 0 THEN DELETE`) and `SELECT action, account_id, account_code, balance_cents, status FROM merged ORDER BY account_id ASC;`."
      ],
      postmortemExplanation: "PostgreSQL 17+ / 18 extended `MERGE` with `WHEN NOT MATCHED BY SOURCE` and `RETURNING merge_action()`, eliminating multi-statement snapshot drift between `INSERT ... ON CONFLICT` and cleanup `DELETE`s. Wrapping `MERGE ... RETURNING` inside a CTE lets you deterministically sort the audit trail (`ORDER BY account_id ASC`) across updated (`501, 502, 503, 505`), deleted (`506`), and inserted (`507`) accounts.",
      interactiveTuning: [
        { id: "reconcilePattern", label: "Ledger Sync SQL Pattern", type: "select", options: ["three-separate-dml-queries", "single-atomic-merge-returning"], defaultValue: "three-separate-dml-queries", description: "How staging deltas and stale-account pruning execute." }
      ],
      optimalPreset: { reconcilePattern: "single-atomic-merge-returning" },
      verify: function(knobs) {
        var ok = knobs.reconcilePattern === "single-atomic-merge-returning";
        return {
          success: ok,
          message: ok ? "Atomic MERGE verified! All 6 matched/inserted/pruned accounts reconciled in a single snapshot with RETURNING merge_action()." : "Multi-statement DML suffers READ COMMITTED inter-statement drift.",
          metrics: { latencyP99: ok ? "3.2ms" : "410ms", errorRate: ok ? "0.00%" : "8.3%", downstreamCpu: ok ? "14.0%" : "45.0%", effectiveRps: ok ? 2400 : 600 }
        };
      },
      codeFix: {
        title: "Atomic PostgreSQL 18 MERGE with WHEN NOT MATCHED BY SOURCE & RETURNING",
        summary: "Use WITH merged AS (MERGE INTO ledger_accounts t USING ledger_sync_staging s ... RETURNING ...) to apply deltas, insert new accounts, delete closed zero-balance accounts absent from staging, and return the ordered audit log.",
        datasetId: "pg_ops_telemetry",
        engine: "postgres",
        buggyCode: "-- BUGGY SQL: Only previews matched accounts; misses new account 507, stale closed account 506, and merge_action()!\nSELECT t.account_id,\n       t.account_code,\n       t.balance_cents + s.delta_cents AS balance_cents,\n       s.new_status AS status\nFROM ledger_accounts t\nJOIN ledger_sync_staging s ON t.account_id = s.account_id\nORDER BY t.account_id ASC;",
        solutionCode: "-- FIXED SQL: Single atomic PostgreSQL 18 MERGE with WHEN NOT MATCHED BY SOURCE and RETURNING merge_action()\nWITH merged AS (\n  MERGE INTO ledger_accounts t\n  USING ledger_sync_staging s ON t.account_id = s.account_id\n  WHEN MATCHED THEN\n    UPDATE SET balance_cents = t.balance_cents + s.delta_cents,\n               status = s.new_status,\n               updated_at = s.synced_at\n  WHEN NOT MATCHED THEN\n    INSERT (account_id, account_code, owner_tenant, balance_cents, status, updated_at)\n    VALUES (s.account_id, s.account_code, s.owner_tenant, s.delta_cents, s.new_status, s.synced_at)\n  WHEN NOT MATCHED BY SOURCE AND t.status = 'closed' AND t.balance_cents = 0 THEN\n    DELETE\n  RETURNING merge_action() AS action,\n            t.account_id,\n            t.account_code,\n            t.balance_cents,\n            t.status\n)\nSELECT action,\n       account_id,\n       account_code,\n       balance_cents,\n       status\nFROM merged\nORDER BY account_id ASC;"
      }
    }
  ];

  CHALLENGES_DATA.challenges = CHALLENGES_DATA;
  CHALLENGES_DATA.pgChallenges = PG_CHALLENGES_DATA;
  root.CHALLENGES_DATA = CHALLENGES_DATA;
  root.PG_CHALLENGES_DATA = PG_CHALLENGES_DATA;
  root.ChallengesData = CHALLENGES_DATA;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CHALLENGES_DATA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
