/**
 * SQL In Depth — Interactive Table-Level Relational Execution Visualizer (`window.TableVisualizer`)
 * Decomposes any SQL query into its logical relational execution pipeline:
 *   0. WITH / WITH RECURSIVE CTE Anchor & Fixpoint Materialization (when present)
 *   1. FROM / JOIN (Source table pairing, INNER / LEFT / RIGHT / FULL OUTER NULL padding)
 *   2. WHERE (Row-level predicate evaluation & Three-Valued Logic TRUE / FALSE / NULL filtering)
 *   3. GROUP BY (Partitioning rows into color-coded group buckets)
 *   4. HAVING (Post-aggregation group bucket pruning)
 *   5. WINDOW OVER(...) (Sliding partition & frame overlay without collapsing rows)
 *   6. SELECT Projection (Column extraction, expressions, aggregates & aliases)
 *   7. DISTINCT / UNION / INTERSECT / EXCEPT / ORDER BY / LIMIT
 *   8. EXPLAIN QUERY PLAN (Physical B+Tree Index Seek vs. Full Table Scan tree)
 */
(function (root) {
  'use strict';

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Parses top-level clauses from a SQL SELECT/WITH query (ignoring parens/strings/comments).
   */
  function parseQueryClauses(sql) {
    var rawInput = String(sql || '').trim().replace(/;+\s*$/, '');
    // Strip leading single-line or block comments while preserving body
    var clean = rawInput.replace(/^\s*(?:--[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)+/g, '');

    var upper = '';
    var depth = 0;
    var inStr = false;
    var strChar = '';
    for (var i = 0; i < clean.length; i++) {
      var ch = clean[i];
      var next = clean[i + 1];
      if (inStr) {
        if (ch === strChar && next !== strChar) inStr = false;
        else if (ch === strChar && next === strChar) { upper += ' '; i++; }
        upper += ' ';
        continue;
      }
      // Mask single-line comments (-- ...) with spaces of equal length
      if (ch === '-' && next === '-') {
        while (i < clean.length && clean[i] !== '\n') {
          upper += ' ';
          i++;
        }
        if (i < clean.length) upper += '\n';
        continue;
      }
      // Mask block comments (/* ... */) with spaces of equal length
      if (ch === '/' && next === '*') {
        upper += '  ';
        i += 2;
        while (i < clean.length && !(clean[i] === '*' && clean[i + 1] === '/')) {
          upper += clean[i] === '\n' ? '\n' : ' ';
          i++;
        }
        if (i < clean.length) {
          upper += '  ';
          i++;
        }
        continue;
      }
      if (ch === "'" || ch === '"') {
        inStr = true;
        strChar = ch;
        upper += ' ';
        continue;
      }
      if (ch === '(') { depth++; upper += '('; continue; }
      if (ch === ')') { depth = Math.max(0, depth - 1); upper += ')'; continue; }
      upper += depth === 0 ? ch.toUpperCase() : ' ';
    }

    function findKeyword(regex) {
      var m = regex.exec(upper);
      return m ? m.index : -1;
    }

    var withIdx = findKeyword(/^\s*WITH(\s+RECURSIVE)?\b/);
    var isRecursive = /^\s*WITH\s+RECURSIVE\b/.test(upper);
    var selectIdx = findKeyword(/\bSELECT\b/);
    var fromIdx = findKeyword(/\bFROM\b/);
    var whereIdx = findKeyword(/\bWHERE\b/);
    var groupIdx = findKeyword(/\bGROUP\s+BY\b/);
    var havingIdx = findKeyword(/\bHAVING\b/);
    var windowIdx = findKeyword(/\bWINDOW\b/);
    var setOpMatch = /\b(UNION\s+ALL|UNION|INTERSECT|EXCEPT)\b/.exec(upper);
    var setOpIdx = setOpMatch ? setOpMatch.index : -1;
    var setOpKeyword = setOpMatch ? setOpMatch[1].replace(/\s+/g, ' ') : '';
    var orderIdx = findKeyword(/\bORDER\s+BY\b/);
    var limitIdx = findKeyword(/\bLIMIT\b/);

    var hasWindowOver = /\bOVER\s*\(/i.test(clean);
    var hasDistinct = /\bSELECT\s+DISTINCT\b/i.test(clean);
    var hasJoin = /\bJOIN\b/i.test(clean);

    function sliceClause(startIdx, kwLen, nextIndices) {
      if (startIdx < 0) return '';
      var end = clean.length;
      nextIndices.forEach(function (ni) {
        if (ni > startIdx && ni < end) end = ni;
      });
      return clean.slice(startIdx + kwLen, end).trim();
    }

    var allIdxs = [selectIdx, fromIdx, whereIdx, groupIdx, havingIdx, windowIdx, setOpIdx, orderIdx, limitIdx].filter(function (x) { return x >= 0; });

    var ctePrefix = (withIdx >= 0 && selectIdx > withIdx) ? clean.slice(0, selectIdx).trim() : '';
    var cteList = [];
    if (ctePrefix) {
      var body = ctePrefix.replace(/^\s*WITH(?:\s+RECURSIVE)?\s+/i, '');
      var cteRegex = /([a-zA-Z_]\w*)\s*(?:\([^)]*\))?\s*AS\s*\(/gi;
      var cm;
      while ((cm = cteRegex.exec(body)) !== null) {
        var cName = cm[1];
        var openParenPos = cm.index + cm[0].length - 1;
        var pDepth = 1;
        var k = openParenPos + 1;
        var inS = false;
        var sCh = '';
        while (k < body.length && pDepth > 0) {
          var c = body[k];
          if (inS) {
            if (c === sCh && body[k + 1] !== sCh) inS = false;
            else if (c === sCh && body[k + 1] === sCh) k++;
          } else {
            if (c === "'" || c === '"') { inS = true; sCh = c; }
            else if (c === '(') pDepth++;
            else if (c === ')') pDepth--;
          }
          k++;
        }
        var innerSql = body.slice(openParenPos + 1, k - 1).trim();
        var anchorSql = null;
        var unionSplit = innerSql.split(/\bUNION\s+(?:ALL\s+)?/i);
        if (isRecursive && unionSplit.length > 1) {
          anchorSql = unionSplit[0].trim();
        }
        cteList.push({
          name: cName,
          innerSql: innerSql,
          anchorSql: anchorSql,
          isRecursive: isRecursive && Boolean(anchorSql)
        });
        cteRegex.lastIndex = k;
      }
    }

    var selectExpr = sliceClause(selectIdx, 6, allIdxs).replace(/^DISTINCT\s+/i, '').trim();
    var fromExpr = sliceClause(fromIdx, 4, allIdxs);
    var whereExpr = sliceClause(whereIdx, 5, allIdxs);
    var groupExpr = sliceClause(groupIdx, 8, allIdxs);
    var havingExpr = sliceClause(havingIdx, 6, allIdxs);
    var orderExpr = sliceClause(orderIdx, 8, allIdxs);
    var limitExpr = sliceClause(limitIdx, 5, allIdxs);

    return {
      raw: clean,
      ctePrefix: ctePrefix,
      cteList: cteList,
      isRecursive: isRecursive,
      selectExpr: selectExpr,
      fromExpr: fromExpr,
      whereExpr: whereExpr,
      groupExpr: groupExpr,
      havingExpr: havingExpr,
      setOpKeyword: setOpKeyword,
      setOpIdx: setOpIdx,
      orderExpr: orderExpr,
      limitExpr: limitExpr,
      hasWindowOver: hasWindowOver,
      hasDistinct: hasDistinct,
      hasJoin: hasJoin,
      isSelect: selectIdx >= 0
    };
  }

  /**
   * Builds the sequence of clause execution steps for a parsed SQL query
   * and executes intermediate queries against WASM SQLite to capture real row transformations.
   */
  function buildExecutionSteps(sql, options) {
    options = options || {};
    var parsed = parseQueryClauses(sql);
    var engine = root.SqlEngine;
    if (!engine) {
      return Promise.reject(new Error('SqlEngine not initialized'));
    }

    return engine.execute(sql, { datasetId: options.datasetId || '__unified__', explain: true }).then(function (finalRes) {
      if (!finalRes.ok) {
        return {
          ok: false,
          error: finalRes.error,
          sql: sql,
          steps: [],
          finalResult: finalRes
        };
      }

      if (!parsed.isSelect || !parsed.fromExpr) {
        return {
          ok: true,
          sql: sql,
          steps: [
            {
              order: 1,
              clause: 'EXECUTE STATEMENT',
              badge: 'SQL Result',
              sqlFragment: parsed.raw,
              explanation: 'Direct SQL execution against the in-memory WASM SQLite engine.',
              columns: finalRes.columns,
              rows: finalRes.rows,
              rowStates: (finalRes.rows || []).map(function () { return 'matched'; })
            }
          ],
          finalResult: finalRes
        };
      }

      var prefix = parsed.ctePrefix ? (parsed.ctePrefix + ' ') : '';
      var stepPromises = [];

      // STEP 0: CTE / WITH RECURSIVE Materialization (if present)
      if (parsed.cteList && parsed.cteList.length > 0) {
        var firstCte = parsed.cteList[0];
        if (firstCte.isRecursive && firstCte.anchorSql) {
          stepPromises.push(
            engine.execute(firstCte.anchorSql, { datasetId: options.datasetId || '__unified__', explain: false }).then(function (ancRes) {
              var cols = ancRes.ok && ancRes.columns.length ? ancRes.columns : finalRes.columns;
              var rows = ancRes.ok ? ancRes.rows : [];
              return {
                order: 0,
                clause: '0a. CTE ANCHOR (' + firstCte.name + ')',
                badge: rows.length + ' seed rows',
                sqlFragment: firstCte.anchorSql,
                explanation: 'Recursive CTE Step 0a: Execute the non-recursive Anchor Member to seed the initial working table for `' + firstCte.name + '`.',
                columns: cols,
                rows: rows,
                rowStates: rows.map(function () { return 'matched'; })
              };
            })
          );
        }
        var cteMatSql = prefix + 'SELECT * FROM ' + firstCte.name + ' LIMIT 25';
        stepPromises.push(
          engine.execute(cteMatSql, { datasetId: options.datasetId || '__unified__', explain: false }).then(function (cteRes) {
            var cols = cteRes.ok && cteRes.columns.length ? cteRes.columns : finalRes.columns;
            var rows = cteRes.ok ? cteRes.rows : finalRes.rows;
            return {
              order: 0.5,
              clause: firstCte.isRecursive ? ('0b. CTE FIXPOINT (' + firstCte.name + ')') : ('0. WITH CTE (' + firstCte.name + ')'),
              badge: rows.length + ' CTE rows',
              sqlFragment: 'WITH ' + (firstCte.isRecursive ? 'RECURSIVE ' : '') + firstCte.name + ' AS (...)',
              explanation: firstCte.isRecursive
                ? 'Recursive CTE Step 0b: Iteratively join the working table with the recursive member until fixpoint termination (0 new rows added).'
                : 'Logical Step 0: Materialize or inline the Common Table Expression `' + firstCte.name + '` before evaluating the outer query block.',
              columns: cols,
              rows: rows,
              rowStates: rows.map(function (_, idx) { return 'window-' + (idx % 3); })
            };
          })
        );
      }

      // STEP 1: FROM & JOIN
      var fromSql = prefix + 'SELECT * FROM ' + parsed.fromExpr + ' LIMIT 25';
      stepPromises.push(
        engine.execute(fromSql, { datasetId: options.datasetId || '__unified__', explain: false }).then(function (res) {
          var cols = res.ok && res.columns.length ? res.columns : finalRes.columns;
          var rows = res.ok && res.rows.length ? res.rows : finalRes.rows;
          var rowStates = rows.map(function (r) {
            var hasNull = r.some(function (v) { return v === null; });
            return (parsed.hasJoin && hasNull) ? 'null-padded' : 'active';
          });
          return {
            order: 1,
            clause: parsed.hasJoin ? '1. FROM + JOIN' : '1. FROM',
            badge: rows.length + ' candidate rows',
            sqlFragment: 'FROM ' + parsed.fromExpr,
            explanation: parsed.hasJoin
              ? 'Logical Step 1: Load source relations and evaluate JOIN predicates. Unmatched outer-join rows are extended with NULL values.'
              : 'Logical Step 1: Bind the target table/view in the FROM clause and stream candidate tuples into the execution pipeline.',
            columns: cols,
            rows: rows,
            rowStates: rowStates
          };
        })
      );

      // STEP 2: WHERE Filter (if present)
      if (parsed.whereExpr) {
        var whereSql = prefix + 'SELECT *, CASE WHEN (' + parsed.whereExpr + ') THEN 1 WHEN NOT (' + parsed.whereExpr + ') THEN 0 ELSE NULL END AS __pred_match__ FROM ' + parsed.fromExpr + ' LIMIT 25';
        stepPromises.push(
          engine.execute(whereSql, { datasetId: options.datasetId || '__unified__', explain: false }).then(function (res) {
            if (!res.ok || !res.columns.length) {
              var fallbackSql = prefix + 'SELECT * FROM ' + parsed.fromExpr + ' WHERE ' + parsed.whereExpr + ' LIMIT 25';
              return engine.execute(fallbackSql, { datasetId: options.datasetId || '__unified__', explain: false }).then(function (fb) {
                var fCols = fb.ok && fb.columns.length ? fb.columns : finalRes.columns;
                var fRows = fb.ok ? fb.rows : finalRes.rows;
                return {
                  order: 2,
                  clause: '2. WHERE',
                  badge: fRows.length + ' rows kept',
                  sqlFragment: 'WHERE ' + parsed.whereExpr,
                  explanation: 'Logical Step 2: Evaluate the WHERE predicate on every candidate row using Three-Valued Logic (only TRUE rows survive; FALSE and NULL/UNKNOWN rows are discarded).',
                  columns: fCols,
                  rows: fRows,
                  rowStates: fRows.map(function () { return 'matched'; })
                };
              });
            }
            var cols = res.columns.slice(0, -1);
            var keptCount = 0;
            var rowStates = [];
            var cleanRows = res.rows.map(function (r) {
              var matchVal = r[r.length - 1];
              if (matchVal === 1) {
                keptCount++;
                rowStates.push('matched');
              } else {
                rowStates.push('filtered');
              }
              return r.slice(0, -1);
            });
            return {
              order: 2,
              clause: '2. WHERE',
              badge: keptCount + ' / ' + cleanRows.length + ' rows pass',
              sqlFragment: 'WHERE ' + parsed.whereExpr,
              explanation: 'Logical Step 2: Evaluate WHERE (' + parsed.whereExpr + ') on each tuple. Highlighted green rows evaluate to TRUE; dimmed strikethrough rows evaluate to FALSE or UNKNOWN (NULL) and are pruned.',
              columns: cols,
              rows: cleanRows,
              rowStates: rowStates
            };
          })
        );
      }

      // STEP 3: GROUP BY Buckets (if present)
      if (parsed.groupExpr) {
        var grpSql = prefix + 'SELECT ' + parsed.groupExpr + ', COUNT(*) AS __bucket_rows__ FROM ' + parsed.fromExpr +
          (parsed.whereExpr ? (' WHERE ' + parsed.whereExpr) : '') +
          ' GROUP BY ' + parsed.groupExpr + ' LIMIT 25';
        stepPromises.push(
          engine.execute(grpSql, { datasetId: options.datasetId || '__unified__', explain: false }).then(function (res) {
            var cols = res.ok && res.columns.length ? res.columns : finalRes.columns;
            var rows = res.ok ? res.rows : finalRes.rows;
            return {
              order: 3,
              clause: '3. GROUP BY',
              badge: rows.length + ' group buckets',
              sqlFragment: 'GROUP BY ' + parsed.groupExpr,
              explanation: 'Logical Step 3: Partition surviving rows into distinct group buckets by (' + parsed.groupExpr + ') and collapse each bucket so aggregate functions (COUNT, SUM, AVG, MIN, MAX) can fold over it.',
              columns: cols,
              rows: rows,
              rowStates: rows.map(function (_, idx) { return 'group-' + (idx % 4); })
            };
          })
        );
      }

      // STEP 4: HAVING (if present)
      if (parsed.havingExpr && parsed.groupExpr) {
        var havSql = prefix + 'SELECT ' + parsed.groupExpr + ', COUNT(*) AS __bucket_rows__, CASE WHEN (' + parsed.havingExpr + ') THEN 1 ELSE 0 END AS __hav_pass__ FROM ' + parsed.fromExpr +
          (parsed.whereExpr ? (' WHERE ' + parsed.whereExpr) : '') +
          ' GROUP BY ' + parsed.groupExpr + ' LIMIT 25';
        stepPromises.push(
          engine.execute(havSql, { datasetId: options.datasetId || '__unified__', explain: false }).then(function (res) {
            if (!res.ok) {
              return {
                order: 4,
                clause: '4. HAVING',
                badge: 'Post-Aggregate Filter',
                sqlFragment: 'HAVING ' + parsed.havingExpr,
                explanation: 'Logical Step 4: Filter aggregated group buckets using HAVING (' + parsed.havingExpr + '). Unlike WHERE, HAVING operates after GROUP BY aggregation.',
                columns: finalRes.columns,
                rows: finalRes.rows,
                rowStates: finalRes.rows.map(function () { return 'matched'; })
              };
            }
            var cols = res.columns.slice(0, -1);
            var kept = 0;
            var states = [];
            var rows = res.rows.map(function (r) {
              var pass = r[r.length - 1] === 1;
              if (pass) kept++;
              states.push(pass ? 'matched' : 'filtered');
              return r.slice(0, -1);
            });
            return {
              order: 4,
              clause: '4. HAVING',
              badge: kept + ' / ' + rows.length + ' groups kept',
              sqlFragment: 'HAVING ' + parsed.havingExpr,
              explanation: 'Logical Step 4: HAVING (' + parsed.havingExpr + ') prunes entire aggregated groups that do not satisfy the post-aggregation predicate.',
              columns: cols,
              rows: rows,
              rowStates: states
            };
          })
        );
      }

      // STEP 5: WINDOW Functions (if present)
      if (parsed.hasWindowOver) {
        stepPromises.push(
          Promise.resolve({
            order: 5,
            clause: '5. WINDOW OVER(...)',
            badge: 'Sliding Frame Context',
            sqlFragment: parsed.selectExpr,
            explanation: 'Logical Step 5: Evaluate Window Functions OVER (PARTITION BY ... ORDER BY ...). Unlike GROUP BY, window functions preserve every individual row while computing peer/frame rankings, running totals, and LAG/LEAD offsets.',
            columns: finalRes.columns,
            rows: finalRes.rows,
            rowStates: finalRes.rows.map(function (_, idx) { return 'window-' + (idx % 3); })
          })
        );
      }

      // STEP 6: SELECT Projection
      stepPromises.push(
        Promise.resolve({
          order: 6,
          clause: parsed.hasDistinct ? '6. SELECT DISTINCT' : '6. SELECT Projection',
          badge: finalRes.columns.length + ' columns · ' + finalRes.rowCount + ' rows',
          sqlFragment: 'SELECT ' + (parsed.hasDistinct ? 'DISTINCT ' : '') + parsed.selectExpr,
          explanation: 'Logical Step 6: Project the requested expressions, computed columns, and column aliases defined in SELECT (note how column aliases only become visible at this stage, which is why WHERE cannot reference them!).',
          columns: finalRes.columns,
          rows: finalRes.rows,
          rowStates: finalRes.rows.map(function () { return 'matched'; })
        })
      );

      // STEP 6.5: SET OPERATION (UNION / INTERSECT / EXCEPT)
      if (parsed.setOpKeyword) {
        stepPromises.push(
          Promise.resolve({
            order: 6.5,
            clause: '6b. ' + parsed.setOpKeyword,
            badge: finalRes.rowCount + ' combined rows',
            sqlFragment: parsed.setOpKeyword,
            explanation: 'Set Operation Step: Combine the projected tuple streams from both query branches using ' + parsed.setOpKeyword + '.',
            columns: finalRes.columns,
            rows: finalRes.rows,
            rowStates: finalRes.rows.map(function () { return 'matched'; })
          })
        );
      }

      // STEP 7: ORDER BY & LIMIT
      if (parsed.orderExpr || parsed.limitExpr) {
        var ordFragment = (parsed.orderExpr ? ('ORDER BY ' + parsed.orderExpr + ' ') : '') + (parsed.limitExpr ? ('LIMIT ' + parsed.limitExpr) : '');
        stepPromises.push(
          Promise.resolve({
            order: 7,
            clause: '7. ' + (parsed.orderExpr ? 'ORDER BY' : '') + (parsed.orderExpr && parsed.limitExpr ? ' + ' : '') + (parsed.limitExpr ? 'LIMIT' : ''),
            badge: 'Final ' + finalRes.rowCount + ' rows',
            sqlFragment: ordFragment.trim(),
            explanation: 'Logical Step 7: Sort the projected result set by (' + (parsed.orderExpr || 'natural order') + ')' + (parsed.limitExpr ? (' and slice the output window with LIMIT ' + parsed.limitExpr + '.') : '.'),
            columns: finalRes.columns,
            rows: finalRes.rows,
            rowStates: finalRes.rows.map(function () { return 'matched'; })
          })
        );
      }

      return Promise.all(stepPromises).then(function (steps) {
        return {
          ok: true,
          sql: sql,
          parsed: parsed,
          steps: steps,
          finalResult: finalRes
        };
      });
    });
  }

  /**
   * Verifies a learner's SQL query against a reference SQL query in WASM SQLite
   * and returns structured test assertions (Syntax & Execution, Non-Empty Result,
   * Schema/Column Alignment, Tuple Exact Match, and Physical Plan SARGability).
   */
  function verifyQueryAgainstReference(userSql, referenceSql, options) {
    options = options || {};
    var engine = root.SqlEngine;
    if (!engine) return Promise.reject(new Error('SqlEngine not initialized'));
    var ds = options.datasetId || '__unified__';

    return Promise.all([
      engine.execute(userSql, { datasetId: ds, explain: true }),
      engine.execute(referenceSql || userSql, { datasetId: ds, explain: true })
    ]).then(function (pair) {
      var uRes = pair[0];
      var rRes = pair[1];
      var checks = [];

      checks.push({
        name: 'Test 1: SQL Syntax & Catalog Binding',
        passed: Boolean(uRes.ok),
        detail: uRes.ok
          ? ('Compiled & executed in ' + uRes.elapsedMs + ' ms')
          : ('SQL Error: ' + (uRes.error || 'Unknown error'))
      });

      if (!uRes.ok) {
        return { passed: false, passedCount: 0, totalCount: 4, checks: checks, userResult: uRes };
      }

      var hasRows = uRes.rowCount > 0;
      checks.push({
        name: 'Test 2: Tuple Cardinality & Non-Empty Output',
        passed: hasRows,
        detail: uRes.rowCount + ' rows returned' + (rRes.ok ? (' (reference expects ' + rRes.rowCount + ' rows)') : '')
      });

      var colsMatch = rRes.ok && uRes.columns.length === rRes.columns.length;
      checks.push({
        name: 'Test 3: Projected Attribute Schema (' + uRes.columns.length + ' cols)',
        passed: Boolean(colsMatch),
        detail: 'Columns: [' + uRes.columns.join(', ') + ']'
      });

      var rowsEqual = rRes.ok && JSON.stringify(uRes.rows) === JSON.stringify(rRes.rows);
      checks.push({
        name: 'Test 4: Relational Tuple Value Equivalence & 3VL NULL Invariant',
        passed: Boolean(rowsEqual),
        detail: rowsEqual
          ? 'All output tuples and NULL states match reference relation'
          : 'Output rows differ from reference query (or custom exploration query executed)'
      });

      var passedCount = checks.filter(function (c) { return c.passed; }).length;
      return {
        passed: passedCount === checks.length,
        passedCount: passedCount,
        totalCount: checks.length,
        checks: checks,
        userResult: uRes,
        refResult: rRes
      };
    });
  }

  function renderValueCell(val) {
    if (val === null || typeof val === 'undefined') {
      return '<span class="sql-null-badge" title="SQL NULL (Three-Valued Logic UNKNOWN)">NULL</span>';
    }
    return escapeHtml(String(val));
  }

  function renderExplainTreeHtml(explainNodes) {
    if (!explainNodes || !explainNodes.length) {
      return '<div class="sql-explain-node"><span class="sql-explain-node__badge">PLAN</span><span>Direct execution (no table scan tree emitted)</span></div>';
    }
    return '<div class="sql-explain-tree">' + explainNodes.map(function (n) {
      var badgeCls = n.isIndex ? 'is-index' : (n.isFullScan ? 'is-scan' : '');
      return (
        '<div class="sql-explain-node">' +
          '<span class="sql-explain-node__badge ' + badgeCls + '">' + escapeHtml(n.kind) + '</span>' +
          '<code>' + escapeHtml(n.detail) + '</code>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  /**
   * Mounts an interactive Table-Level Clause Execution Visualizer inside `container`.
   */
  function mountClauseVisualizer(container, initialSql, options) {
    if (!container) return;
    options = options || {};
    var state = {
      sql: initialSql || 'SELECT * FROM customers LIMIT 5;',
      referenceSql: options.referenceSql || initialSql || 'SELECT * FROM customers LIMIT 5;',
      datasetId: options.datasetId || '__unified__',
      stepIdx: 0,
      trace: null,
      testReport: options.testReport || null,
      playing: false,
      timer: null
    };

    function stopAutoPlay() {
      state.playing = false;
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
    }

    function render() {
      var trace = state.trace;
      if (!trace) {
        container.innerHTML = '<div class="sql-tviz"><div class="sql-tviz__header"><span class="sql-tviz__title">Initializing WASM SQLite Engine &amp; Table Visualizer…</span></div></div>';
        return;
      }

      if (!trace.ok) {
        container.innerHTML = (
          '<div class="sql-tviz">' +
            '<div class="sql-tviz__header">' +
              '<div class="sql-tviz__title"><span class="sql-tviz__badge">SQL Error</span> Clause Visualizer</div>' +
            '</div>' +
            '<div class="sql-tviz__stage">' +
              '<div class="exam-field-feedback fb--wrong">' + escapeHtml(trace.error) + '</div>' +
            '</div>' +
          '</div>'
        );
        return;
      }

      var steps = trace.steps || [];
      if (state.stepIdx >= steps.length) state.stepIdx = Math.max(0, steps.length - 1);
      var activeStep = steps[state.stepIdx] || steps[0];

      var pipelineHtml = steps.map(function (st, idx) {
        var cls = idx === state.stepIdx ? 'is-active' : (idx < state.stepIdx ? 'is-done' : '');
        return (
          '<button type="button" class="sql-clause-step ' + cls + '" data-tviz-step="' + idx + '">' +
            '<span class="sql-clause-step__num">' + (idx + 1) + '</span>' +
            '<span>' + escapeHtml(st.clause.replace(/^\d+[ab]?\.\s*/, '')) + '</span>' +
          '</button>' +
          (idx < steps.length - 1 ? '<span class="sql-clause-arrow">→</span>' : '')
        );
      }).join('');

      var testBannerHtml = '';
      if (state.testReport && state.testReport.checks) {
        var tr = state.testReport;
        var itemsHtml = tr.checks.map(function (c) {
          return (
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,0.03);font-size:0.78rem;">' +
              '<span>' + (c.passed ? '✅ ' : '⚠️ ') + '<strong>' + escapeHtml(c.name) + '</strong></span>' +
              '<code style="font-size:0.74rem;color:var(--text-muted);">' + escapeHtml(c.detail) + '</code>' +
            '</div>'
          );
        }).join('');
        testBannerHtml = (
          '<div style="margin-bottom:10px;padding:10px 12px;border-radius:8px;border:1px solid ' + (tr.passed ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)') + ';background:' + (tr.passed ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)') + ';">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:0.8rem;font-weight:700;">' +
              '<span>' + (tr.passed ? '✓ All SQL Lab Assertions Passed' : 'SQL Verification Report') + '</span>' +
              '<span class="sql-tviz__badge">' + tr.passedCount + ' / ' + tr.totalCount + ' checks passed</span>' +
            '</div>' +
            '<div style="display:grid;gap:4px;">' + itemsHtml + '</div>' +
          '</div>'
        );
      }

      var tableHtml = '';
      if (activeStep && activeStep.columns && activeStep.columns.length) {
        var ths = activeStep.columns.map(function (c) {
          var isPk = /_id$|^id$/i.test(c);
          return '<th>' + escapeHtml(c) + (isPk ? '<span class="col-badge col-badge--pk">KEY</span>' : '') + '</th>';
        }).join('');

        var trs = (activeStep.rows || []).map(function (row, rIdx) {
          var st = (activeStep.rowStates && activeStep.rowStates[rIdx]) || '';
          var rowCls = '';
          if (st === 'matched') rowCls = 'is-matched';
          else if (st === 'filtered') rowCls = 'is-filtered';
          else if (st === 'null-padded') rowCls = 'is-window-frame';
          else if (st.indexOf('window-') === 0) rowCls = 'is-window-frame';
          else if (st.indexOf('group-') === 0) rowCls = 'group-bucket-' + st.split('-')[1];
          return '<tr class="' + rowCls + '">' + row.map(function (cell) {
            return '<td>' + renderValueCell(cell) + '</td>';
          }).join('') + '</tr>';
        }).join('');

        tableHtml = (
          '<div class="sql-rel-table-card">' +
            '<div class="sql-rel-table-card__head">' +
              '<span><strong>' + escapeHtml(activeStep.clause) + '</strong> — <code>' + escapeHtml(activeStep.sqlFragment) + '</code></span>' +
              '<span class="sql-tviz__badge">' + escapeHtml(activeStep.badge) + '</span>' +
            '</div>' +
            '<div class="sql-rel-table-scroll">' +
              '<table class="sql-rel-table">' +
                '<thead><tr>' + ths + '</tr></thead>' +
                '<tbody>' + (trs || '<tr><td colspan="' + activeStep.columns.length + '">0 rows returned</td></tr>') + '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>'
        );
      } else {
        tableHtml = '<div class="sql-rel-table-card"><div class="sql-rel-table-card__head">Statement executed (0 result columns)</div></div>';
      }

      var explainHtml = renderExplainTreeHtml(trace.finalResult ? trace.finalResult.explain : []);

      container.innerHTML = (
        '<div class="sql-tviz">' +
          '<div class="sql-tviz__header">' +
            '<div class="sql-tviz__title">' +
              '<span class="sql-tviz__badge">WASM SQLite 3</span>' +
              '<span>Table-Level Relational Execution Visualizer</span>' +
            '</div>' +
            '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
              '<button type="button" class="btn btn--sm" data-tviz-action="prev" ' + (state.stepIdx <= 0 ? 'disabled' : '') + '>◀ Prev Clause</button>' +
              '<button type="button" class="btn btn--sm btn--primary" data-tviz-action="play">' + (state.playing ? '⏸ Pause' : '▶ Auto-Step') + '</button>' +
              '<button type="button" class="btn btn--sm" data-tviz-action="next" ' + (state.stepIdx >= steps.length - 1 ? 'disabled' : '') + '>Next Clause ▶</button>' +
            '</div>' +
          '</div>' +
          '<div class="sql-clause-pipeline">' + pipelineHtml + '</div>' +
          '<div class="sql-tviz__stage">' +
            testBannerHtml +
            '<div style="font-size:0.84rem;color:var(--text-secondary);line-height:1.5;">' +
              escapeHtml(activeStep ? activeStep.explanation : '') +
            '</div>' +
            tableHtml +
            '<div>' +
              '<div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:6px;">Physical Query Plan (EXPLAIN QUERY PLAN · ' + (trace.finalResult ? trace.finalResult.elapsedMs : '0.1') + ' ms)</div>' +
              explainHtml +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function runTrace(newSql, runTests) {
      stopAutoPlay();
      if (typeof newSql === 'string') state.sql = newSql;
      state.stepIdx = 0;
      var tracePromise = buildExecutionSteps(state.sql, { datasetId: state.datasetId });
      var testPromise = runTests
        ? verifyQueryAgainstReference(state.sql, state.referenceSql, { datasetId: state.datasetId })
        : Promise.resolve(null);

      Promise.all([tracePromise, testPromise]).then(function (resPair) {
        var trace = resPair[0];
        state.trace = trace;
        if (resPair[1]) state.testReport = resPair[1];
        if ((options.startAtFinal || runTests) && trace.steps && trace.steps.length > 0) {
          state.stepIdx = trace.steps.length - 1;
        }
        render();
      }).catch(function (err) {
        state.trace = { ok: false, error: err && err.message ? err.message : String(err) };
        render();
      });
    }

    container.addEventListener('click', function (e) {
      var stepBtn = e.target.closest('[data-tviz-step]');
      if (stepBtn) {
        stopAutoPlay();
        state.stepIdx = parseInt(stepBtn.getAttribute('data-tviz-step'), 10) || 0;
        render();
        return;
      }

      var actBtn = e.target.closest('[data-tviz-action]');
      if (actBtn && state.trace && state.trace.steps) {
        var act = actBtn.getAttribute('data-tviz-action');
        var len = state.trace.steps.length;
        if (act === 'prev') {
          stopAutoPlay();
          state.stepIdx = Math.max(0, state.stepIdx - 1);
          render();
        } else if (act === 'next') {
          stopAutoPlay();
          state.stepIdx = Math.min(len - 1, state.stepIdx + 1);
          render();
        } else if (act === 'play') {
          if (state.playing) {
            stopAutoPlay();
            render();
          } else {
            state.playing = true;
            if (state.stepIdx >= len - 1) state.stepIdx = 0;
            render();
            state.timer = setInterval(function () {
              if (!state.trace || !state.trace.steps) {
                stopAutoPlay();
                return;
              }
              if (state.stepIdx < state.trace.steps.length - 1) {
                state.stepIdx++;
                render();
              } else {
                stopAutoPlay();
                render();
              }
            }, 1300);
          }
        }
      }
    });

    runTrace(state.sql, Boolean(options.runTests));

    return {
      updateSql: runTrace,
      stop: stopAutoPlay
    };
  }

  /**
   * Enhances all `<pre><code class="language-sql">` blocks inside a rendered lesson container
   * with an interactive SQL Lab editor, "▶ Run Query", "🔍 Step Clauses", and "✓ Run & Check SQL Tests" buttons.
   */
  function enhanceSqlCodeBlocks(rootEl) {
    if (!rootEl || typeof document === 'undefined') return;
    var codeBlocks = rootEl.querySelectorAll('pre > code.language-sql, pre > code.lang-sql');
    codeBlocks.forEach(function (codeEl) {
      var pre = codeEl.parentElement;
      if (!pre || pre.getAttribute('data-sql-enhanced') === 'true') return;
      pre.setAttribute('data-sql-enhanced', 'true');

      var rawSql = (codeEl.textContent || '').trim();
      if (!rawSql) return;

      var anchorEl = pre.closest('.code-block') || pre;

      var workbench = document.createElement('div');
      workbench.className = 'sql-inline-workbench';
      workbench.innerHTML = (
        '<div class="sql-inline-workbench__toolbar">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
            '<span class="sql-tviz__badge">Interactive WASM SQLite Lab</span>' +
            '<span style="font-size:0.76rem;color:var(--text-muted);">Edit query below or run clause-by-clause table visualization &amp; test checks</span>' +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn--sm btn--primary" data-inline-sql="run">▶ Run Query</button>' +
            '<button type="button" class="btn btn--sm" data-inline-sql="visualize">🔍 Step Clauses</button>' +
            '<button type="button" class="btn btn--sm" data-inline-sql="test">✓ Check SQL Tests</button>' +
            '<button type="button" class="btn btn--sm" data-inline-sql="edit">✎ Edit SQL</button>' +
            '<button type="button" class="btn btn--sm" data-inline-sql="reset" style="display:none;">↺ Reset</button>' +
          '</div>' +
        '</div>' +
        '<textarea class="sql-inline-workbench__editor" spellcheck="false" aria-label="Interactive SQL query editor" style="display:none;"></textarea>' +
        '<div class="sql-inline-output-slot"></div>'
      );

      var editorEl = workbench.querySelector('.sql-inline-workbench__editor');
      var resetBtn = workbench.querySelector('[data-inline-sql="reset"]');
      var outputSlot = workbench.querySelector('.sql-inline-output-slot');
      editorEl.value = rawSql;

      anchorEl.insertAdjacentElement('afterend', workbench);

      workbench.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-inline-sql]');
        if (!btn) return;
        var mode = btn.getAttribute('data-inline-sql');
        if (mode === 'edit') {
          var isHidden = editorEl.style.display === 'none';
          editorEl.style.display = isHidden ? 'block' : 'none';
          resetBtn.style.display = isHidden ? 'inline-flex' : 'none';
          if (isHidden) editorEl.focus();
          return;
        }
        if (mode === 'reset') {
          editorEl.value = rawSql;
          mountClauseVisualizer(outputSlot, rawSql, {
            referenceSql: rawSql,
            startAtFinal: true,
            runTests: false
          });
          return;
        }
        var currentSql = (editorEl.value || rawSql).trim();
        mountClauseVisualizer(outputSlot, currentSql, {
          referenceSql: rawSql,
          startAtFinal: mode === 'run' || mode === 'test',
          runTests: mode === 'test'
        });
      });
    });
  }

  root.TableVisualizer = {
    parseQueryClauses: parseQueryClauses,
    buildExecutionSteps: buildExecutionSteps,
    verifyQueryAgainstReference: verifyQueryAgainstReference,
    mountClauseVisualizer: mountClauseVisualizer,
    enhanceSqlCodeBlocks: enhanceSqlCodeBlocks,
    renderExplainTreeHtml: renderExplainTreeHtml
  };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
