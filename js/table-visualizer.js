/**
 * Interactive SQL Table & Clause Step-by-Step Visualizer
 * Executes real SQL queries against SQLEngine (PostgreSQL 18 PGlite WASM + SQLite 3 WASM)
 * and decomposes queries into an interactive up-to-9-stage visual execution pipeline:
 *   0. SOURCE TABLES -> 1. WITH CTE (Anchor + Fixpoint) -> 2. FROM / JOIN ->
 *   3. WHERE (3VL Filter) -> 4. GROUP BY / HAVING -> 5. WINDOW OVER ->
 *   6. SELECT / Set Ops -> 7. ORDER BY + LIMIT -> 8. EXPLAIN PLAN
 * Plus full Before/After Table Diff visualization for DML (INSERT / UPDATE / DELETE).
 */
(function (root) {
    'use strict';

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Known table names across all 5 datasets for automatic dataset inference & source table discovery
    var KNOWN_TABLES = {
        customers: 'ecommerce', categories: 'ecommerce', products: 'ecommerce',
        orders: 'ecommerce', order_items: 'ecommerce', payments: 'ecommerce',
        shipments: 'ecommerce', product_reviews: 'ecommerce',
        departments: 'org_hr', employees: 'org_hr', salary_history: 'org_hr',
        projects: 'org_hr', employee_projects: 'org_hr', project_assignments: 'org_hr',
        accounts: 'fintech_ledger', transfers: 'fintech_ledger', journal_entries: 'fintech_ledger',
        cards: 'fintech_ledger', merchant_txns: 'fintech_ledger', ledger_postings: 'fintech_ledger',
        fx_rates: 'fintech_ledger', payment_holds: 'fintech_ledger',
        saas_users: 'saas_telemetry', subscriptions: 'saas_telemetry',
        user_events: 'saas_telemetry', invoices: 'saas_telemetry',
        organizations: 'saas_telemetry', users: 'saas_telemetry',
        feature_flags: 'saas_telemetry', telemetry_events: 'saas_telemetry', api_keys: 'saas_telemetry',
        profiles: 'social_graph', follows: 'social_graph', posts: 'social_graph',
        post_likes: 'social_graph', post_tags: 'social_graph', reactions: 'social_graph'
    };

    // Primary Key and Foreign Key metadata for visual badges in table headers
    var SCHEMA_META = {
        customers: { pk: ['customer_id'], fk: { referred_by: 'customers.customer_id' } },
        categories: { pk: ['category_id'], fk: { parent_category_id: 'categories.category_id' } },
        products: { pk: ['product_id'], fk: { category_id: 'categories.category_id' } },
        orders: { pk: ['order_id'], fk: { customer_id: 'customers.customer_id' } },
        order_items: { pk: ['order_item_id'], fk: { order_id: 'orders.order_id', product_id: 'products.product_id' } },
        payments: { pk: ['payment_id'], fk: { order_id: 'orders.order_id' } },
        shipments: { pk: ['shipment_id'], fk: { order_id: 'orders.order_id' } },
        product_reviews: { pk: ['review_id'], fk: { product_id: 'products.product_id', customer_id: 'customers.customer_id' } },
        departments: { pk: ['dept_id'], fk: {} },
        employees: { pk: ['emp_id'], fk: { dept_id: 'departments.dept_id', manager_id: 'employees.emp_id' } },
        salary_history: { pk: ['history_id'], fk: { emp_id: 'employees.emp_id' } },
        projects: { pk: ['project_id'], fk: { lead_emp_id: 'employees.emp_id' } },
        employee_projects: { pk: ['emp_id', 'project_id'], fk: { emp_id: 'employees.emp_id', project_id: 'projects.project_id' } },
        project_assignments: { pk: ['emp_id', 'project_id'], fk: { emp_id: 'employees.emp_id', project_id: 'projects.project_id' } },
        accounts: { pk: ['account_id'], fk: {} },
        transfers: { pk: ['transfer_id'], fk: { from_account_id: 'accounts.account_id', to_account_id: 'accounts.account_id' } },
        journal_entries: { pk: ['entry_id'], fk: { transfer_id: 'transfers.transfer_id', account_id: 'accounts.account_id' } },
        cards: { pk: ['card_id'], fk: { account_id: 'accounts.account_id' } },
        merchant_txns: { pk: ['txn_id'], fk: { card_id: 'cards.card_id' } },
        ledger_postings: { pk: ['posting_id'], fk: { entry_id: 'journal_entries.entry_id', account_id: 'accounts.account_id' } },
        fx_rates: { pk: ['from_currency', 'to_currency', 'effective_date'], fk: {} },
        payment_holds: { pk: ['hold_id'], fk: { account_id: 'accounts.account_id' } },
        saas_users: { pk: ['user_id'], fk: {} },
        subscriptions: { pk: ['sub_id'], fk: { user_id: 'saas_users.user_id' } },
        user_events: { pk: ['event_id'], fk: { user_id: 'saas_users.user_id' } },
        invoices: { pk: ['invoice_id'], fk: { sub_id: 'subscriptions.sub_id' } },
        organizations: { pk: ['org_id'], fk: {} },
        users: { pk: ['user_id'], fk: { org_id: 'organizations.org_id' } },
        feature_flags: { pk: ['flag_key'], fk: {} },
        telemetry_events: { pk: ['event_id'], fk: { org_id: 'organizations.org_id', user_id: 'users.user_id' } },
        api_keys: { pk: ['key_id'], fk: { org_id: 'organizations.org_id' } },
        profiles: { pk: ['user_id'], fk: {} },
        follows: { pk: ['follower_id', 'followee_id'], fk: { follower_id: 'profiles.user_id', followee_id: 'profiles.user_id' } },
        posts: { pk: ['post_id'], fk: { author_id: 'profiles.user_id' } },
        post_likes: { pk: ['post_id', 'user_id'], fk: { post_id: 'posts.post_id', user_id: 'profiles.user_id' } },
        post_tags: { pk: ['post_id', 'tag'], fk: { post_id: 'posts.post_id' } },
        reactions: { pk: ['reaction_id'], fk: { post_id: 'posts.post_id', user_id: 'profiles.user_id' } }
    };

    function getEngine() {
        return root.SqlEngine || root.SQLEngine;
    }

    function getDatasets() {
        return root.SQL_DATASETS || root.SQLDatasets || {};
    }

    /**
     * Detect dataset ID from SQL text or fallback to page context / ecommerce
     */
    function inferDatasetFromSql(sql, explicitDataset) {
        var datasets = getDatasets();
        if (explicitDataset && explicitDataset !== '__unified__' && datasets[explicitDataset]) {
            return explicitDataset;
        }
        var lower = String(sql || '').toLowerCase();
        var counts = {};
        Object.keys(KNOWN_TABLES).forEach(function (tbl) {
            var re = new RegExp('\\b' + tbl + '\\b', 'i');
            if (re.test(lower)) {
                var ds = KNOWN_TABLES[tbl];
                counts[ds] = (counts[ds] || 0) + 1;
            }
        });
        var bestDs = null;
        var bestCount = 0;
        Object.keys(counts).forEach(function (ds) {
            if (counts[ds] > bestCount) {
                bestCount = counts[ds];
                bestDs = ds;
            }
        });
        return bestDs || 'ecommerce';
    }

    /**
     * Extract referenced base tables from SQL (excluding CTE names)
     */
    function extractSourceTables(sql, cteNames) {
        var cteSet = {};
        if (Array.isArray(cteNames)) {
            cteNames.forEach(function (n) { cteSet[String(n).toLowerCase()] = true; });
        }
        var cleaned = String(sql || '')
            .replace(/--[^\n]*/g, ' ')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/'(?:''|[^'])*'/g, "''");

        var found = [];
        var seen = {};
        var re = /\b(?:FROM|JOIN|UPDATE|INTO|TABLE)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
        var m;
        while ((m = re.exec(cleaned)) !== null) {
            var name = m[1].toLowerCase();
            if (KNOWN_TABLES[name] && !cteSet[name] && !seen[name]) {
                seen[name] = true;
                found.push(name);
            }
        }
        if (found.length === 0) {
            Object.keys(KNOWN_TABLES).forEach(function (tbl) {
                var tblRe = new RegExp('\\b' + tbl + '\\b', 'i');
                if (tblRe.test(cleaned) && !cteSet[tbl] && !seen[tbl]) {
                    seen[tbl] = true;
                    found.push(tbl);
                }
            });
        }
        return found.slice(0, 4);
    }

    /**
     * Extract join key column names from a FROM / JOIN clause
     */
    function extractJoinColumns(fromExpr) {
        if (!fromExpr) return [];
        var cols = [];
        var seen = {};
        function addCol(c) {
            var clean = String(c || '').replace(/^["`]|["`]$/g, '').trim();
            if (clean && !seen[clean.toLowerCase()]) {
                seen[clean.toLowerCase()] = true;
                cols.push(clean);
            }
        }
        // Match ON a.col1 = b.col2
        var onRe = /\bON\b[\s\S]*?(?=\b(?:LEFT|RIGHT|INNER|OUTER|CROSS|FULL|JOIN|WHERE|GROUP|HAVING|WINDOW|ORDER|LIMIT|$))/gi;
        var m;
        while ((m = onRe.exec(fromExpr)) !== null) {
            var cond = m[0];
            var eqRe = /(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?([a-zA-Z_][a-zA-Z0-9_]*)/g;
            var em;
            while ((em = eqRe.exec(cond)) !== null) {
                addCol(em[1]);
                addCol(em[2]);
            }
        }
        // Match USING (col1, col2)
        var usingRe = /\bUSING\s*\(([^)]+)\)/gi;
        while ((m = usingRe.exec(fromExpr)) !== null) {
            m[1].split(',').forEach(function (part) { addCol(part); });
        }
        return cols;
    }

    /**
     * Strip ROLLUP(...), CUBE(...), GROUPING SETS(...) wrappers from a GROUP BY expression
     * so we can safely project the underlying columns in Step 4 (`SELECT <cols>, COUNT(*) ...`).
     */
    function stripGroupingWrappers(groupExpr) {
        if (!groupExpr) return '';
        var s = String(groupExpr).trim();
        // Repeatedly unwrap GROUPING SETS (...), ROLLUP (...), CUBE (...)
        var prev = '';
        while (s !== prev) {
            prev = s;
            s = s.replace(/\bGROUPING\s+SETS\s*\(([\s\S]*)\)/gi, '$1');
            s = s.replace(/\b(?:ROLLUP|CUBE)\s*\(([^()]*)\)/gi, '$1');
        }
        // Remove nested parens from grouping sets like ((a, b), (a), ())
        s = s.replace(/[()]/g, ' ');
        var parts = s.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
        // Deduplicate columns
        var unique = [];
        var seen = {};
        parts.forEach(function (p) {
            var key = p.toLowerCase();
            if (!seen[key]) {
                seen[key] = true;
                unique.push(p);
            }
        });
        return unique.join(', ');
    }

    /**
     * Split top-level comma-separated CTE definitions in a WITH clause
     */
    function parseCteDefinitions(withClause) {
        if (!withClause) return [];
        var body = String(withClause).replace(/^\s*WITH\s+(?:RECURSIVE\s+)?/i, '').trim();
        var isRecursive = /^\s*WITH\s+RECURSIVE\b/i.test(withClause);
        var ctes = [];
        var depth = 0;
        var inSingle = false;
        var start = 0;

        for (var i = 0; i < body.length; i++) {
            var ch = body[i];
            if (ch === "'" && body[i - 1] !== '\\') {
                inSingle = !inSingle;
                continue;
            }
            if (inSingle) continue;
            if (ch === '(') depth++;
            else if (ch === ')') depth = Math.max(0, depth - 1);
            else if (ch === ',' && depth === 0) {
                ctes.push(body.slice(start, i).trim());
                start = i + 1;
            }
        }
        if (start < body.length) {
            var tail = body.slice(start).trim();
            if (tail) ctes.push(tail);
        }

        return ctes.map(function (rawDef, idx) {
            // Match: cte_name [(col1, col2)] AS [MATERIALIZED | NOT MATERIALIZED] ( ... )
            var m = rawDef.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\(([^)]*)\))?\s+AS\s+(?:(?:NOT\s+)?MATERIALIZED\s+)?\(([\s\S]*)\)$/i);
            if (!m) return null;
            var name = m[1];
            var colList = m[2] ? m[2].trim() : '';
            var innerSql = m[3].trim();
            // Check if innerSql has a top-level UNION ALL or UNION (for recursive CTEs)
            var unionSplit = splitTopLevelUnion(innerSql);
            return {
                index: idx,
                name: name,
                colList: colList,
                innerSql: innerSql,
                rawDef: rawDef,
                isRecursive: isRecursive && !!unionSplit,
                anchorSql: unionSplit ? unionSplit.left : null,
                recursiveSql: unionSplit ? unionSplit.right : null,
                unionType: unionSplit ? unionSplit.op : null
            };
        }).filter(Boolean);
    }

    function splitTopLevelUnion(sql) {
        var depth = 0;
        var inSingle = false;
        var upper = sql.toUpperCase();
        for (var i = 0; i < sql.length; i++) {
            var ch = sql[i];
            if (ch === "'" && sql[i - 1] !== '\\') {
                inSingle = !inSingle;
                continue;
            }
            if (inSingle) continue;
            if (ch === '(') depth++;
            else if (ch === ')') depth = Math.max(0, depth - 1);
            else if (depth === 0) {
                var rem = upper.slice(i);
                var m = rem.match(/^UNION\s+ALL\b|^UNION\b/);
                if (m && (i === 0 || /[\s)]/.test(sql[i - 1]))) {
                    return {
                        left: sql.slice(0, i).trim(),
                        op: m[0].replace(/\s+/g, ' '),
                        right: sql.slice(i + m[0].length).trim()
                    };
                }
            }
        }
        return null;
    }

    /**
     * Parse a top-level SELECT query into its logical clauses so we can build intermediate step queries.
     * Respects parentheses depth so subqueries and CTEs do not confuse top-level clause boundaries.
     */
    function parseSelectClauses(sql) {
        var cleaned = String(sql || '')
            .replace(/--[^\n]*/g, function (m) { return ' '.repeat(m.length); })
            .replace(/\/\*[\s\S]*?\*\//g, function (m) { return ' '.repeat(m.length); });

        var trimmed = sql.trim().replace(/;+\s*$/, '');
        var cleanedTrim = cleaned.trim().replace(/;+\s*$/, '');

        var depth = 0;
        var inSingle = false;
        var mainSelectPos = -1;
        var upper = cleanedTrim.toUpperCase();

        // Check if query starts with WITH
        for (var i = 0; i < cleanedTrim.length; i++) {
            var ch = cleanedTrim[i];
            if (ch === "'" && cleanedTrim[i - 1] !== '\\') {
                inSingle = !inSingle;
                continue;
            }
            if (inSingle) continue;
            if (ch === '(') depth++;
            else if (ch === ')') depth = Math.max(0, depth - 1);
            else if (depth === 0) {
                if (upper.slice(i, i + 6) === 'SELECT' && (i === 0 || /[\s)]/.test(cleanedTrim[i - 1])) && /[\s(]/.test(cleanedTrim[i + 6] || ' ')) {
                    mainSelectPos = i;
                    break;
                }
            }
        }

        if (mainSelectPos === -1) return null;

        var withClause = mainSelectPos > 0 ? trimmed.slice(0, mainSelectPos).trim() : '';
        var mainQuery = trimmed.slice(mainSelectPos);
        var mainCleaned = cleanedTrim.slice(mainSelectPos);
        var mainUpper = mainCleaned.toUpperCase();

        var keywords = [
            { key: 'SELECT', re: /^SELECT(?:\s+DISTINCT)?\b/ },
            { key: 'FROM', re: /^FROM\b/ },
            { key: 'WHERE', re: /^WHERE\b/ },
            { key: 'GROUP BY', re: /^GROUP\s+BY\b/ },
            { key: 'HAVING', re: /^HAVING\b/ },
            { key: 'WINDOW', re: /^WINDOW\b/ },
            { key: 'UNION', re: /^(?:UNION(?:\s+ALL)?|INTERSECT|EXCEPT)\b/ },
            { key: 'ORDER BY', re: /^ORDER\s+BY\b/ },
            { key: 'LIMIT', re: /^LIMIT\b/ }
        ];

        var tokens = [];
        depth = 0;
        inSingle = false;
        for (var j = 0; j < mainCleaned.length; j++) {
            var c = mainCleaned[j];
            if (c === "'" && mainCleaned[j - 1] !== '\\') {
                inSingle = !inSingle;
                continue;
            }
            if (inSingle) continue;
            if (c === '(') depth++;
            else if (c === ')') depth = Math.max(0, depth - 1);
            else if (depth === 0 && (j === 0 || /[\s)]/.test(mainCleaned[j - 1]))) {
                var sub = mainUpper.slice(j);
                for (var k = 0; k < keywords.length; k++) {
                    var m = sub.match(keywords[k].re);
                    if (m) {
                        var afterChar = mainCleaned[j + m[0].length] || ' ';
                        if (/[\s(]/.test(afterChar)) {
                            tokens.push({
                                key: keywords[k].key,
                                matchLen: m[0].length,
                                rawKeyword: mainQuery.slice(j, j + m[0].length),
                                index: j
                            });
                            j += m[0].length - 1;
                            break;
                        }
                    }
                }
            }
        }

        var parts = {
            withClause: withClause,
            cteList: parseCteDefinitions(withClause),
            selectDistinct: false,
            select: '',
            from: '',
            where: '',
            groupBy: '',
            having: '',
            window: '',
            setOp: '',
            setOpType: '',
            orderBy: '',
            limit: ''
        };

        for (var t = 0; t < tokens.length; t++) {
            var tok = tokens[t];
            var startIdx = tok.index + tok.matchLen;
            var endIdx = (t + 1 < tokens.length) ? tokens[t + 1].index : mainQuery.length;
            var body = mainQuery.slice(startIdx, endIdx).trim();
            if (tok.key === 'SELECT' && !parts.select) {
                parts.select = body;
                parts.selectDistinct = /DISTINCT/i.test(tok.rawKeyword);
            } else if (tok.key === 'FROM' && !parts.from) {
                parts.from = body;
            } else if (tok.key === 'WHERE' && !parts.where) {
                parts.where = body;
            } else if (tok.key === 'GROUP BY' && !parts.groupBy) {
                parts.groupBy = body;
            } else if (tok.key === 'HAVING' && !parts.having) {
                parts.having = body;
            } else if (tok.key === 'WINDOW' && !parts.window) {
                parts.window = body;
            } else if (tok.key === 'UNION' && !parts.setOp) {
                parts.setOpType = tok.rawKeyword.toUpperCase().replace(/\s+/g, ' ');
                parts.setOp = tok.rawKeyword + ' ' + body;
            } else if (tok.key === 'ORDER BY' && !parts.orderBy) {
                parts.orderBy = body;
            } else if (tok.key === 'LIMIT' && !parts.limit) {
                parts.limit = body;
            }
        }

        return parts;
    }

    /**
     * Build the step-by-step execution stages for a SQL query and execute each intermediate step.
     * Supports:
     *   - DML Before/After Table Diffs (Step 1: BEFORE STATE, Step 2: EXECUTE DML, Step 3: AFTER STATE & DIFF)
     *   - Up-to-9-Stage SELECT Pipeline (0. SOURCE TABLES -> 1. WITH CTE -> 2. FROM/JOIN -> 3. WHERE 3VL ->
     *     4. GROUP BY / HAVING -> 5. WINDOW OVER -> 6. SELECT / UNION -> 7. ORDER BY + LIMIT -> 8. EXPLAIN PLAN)
     */
    async function buildStepPipeline(sql, datasetId) {
        var dsId = inferDatasetFromSql(sql, datasetId);
        var cleanSql = String(sql || '').trim().replace(/;+\s*$/, '');
        var steps = [];

        // Run the full query first
        var finalRes = await getEngine().execute(cleanSql, dsId);

        // ─── DML PIPELINE (INSERT / UPDATE / DELETE / TRUNCATE) ───
        if (!finalRes.error && finalRes.dmlDiff) {
            var diff = finalRes.dmlDiff;
            var meta = SCHEMA_META[diff.tableName] || { pk: [], fk: {} };

            // Step 1: BEFORE STATE
            steps.push({
                clause: '1. BEFORE STATE',
                badge: diff.beforeRows.length + ' rows before',
                description: 'Snapshot of `' + diff.tableName + '` before executing `' + diff.operation + '`. Primary keys (' + (meta.pk.join(', ') || 'row') + ') are tracked to compute exact cell-level diffs.',
                code: 'SELECT * FROM ' + diff.tableName + '; -- Before ' + diff.operation,
                columns: diff.columns,
                rows: diff.beforeRows.slice(0, 25),
                rowStates: diff.beforeRows.slice(0, 25).map(function () { return 'normal'; }),
                highlightCols: meta.pk,
                tableName: diff.tableName
            });

            // Step 2: EXECUTE DML
            var summaryParts = [];
            if (diff.summary.inserted > 0) summaryParts.push('+' + diff.summary.inserted + ' inserted');
            if (diff.summary.updated > 0) summaryParts.push('~' + diff.summary.updated + ' updated');
            if (diff.summary.deleted > 0) summaryParts.push('-' + diff.summary.deleted + ' deleted');
            var summaryBadge = summaryParts.length > 0 ? summaryParts.join(', ') : '0 rows mutated';

            var mutatedOnly = diff.diffRows.filter(function (dr) { return dr.state !== 'unchanged'; });
            steps.push({
                clause: '2. EXECUTE ' + diff.operation,
                badge: summaryBadge,
                description: 'Executes `' + diff.operation + '` against `' + diff.tableName + '` (' + summaryBadge + ').' + (finalRes.rows && finalRes.rows.length > 0 ? ' Displays affected / returned rows.' : ''),
                code: cleanSql,
                columns: diff.columns,
                rows: (mutatedOnly.length > 0 ? mutatedOnly : diff.diffRows).slice(0, 25).map(function (dr) { return dr.row; }),
                rowStates: (mutatedOnly.length > 0 ? mutatedOnly : diff.diffRows).slice(0, 25).map(function (dr) { return dr.state === 'unchanged' ? 'normal' : dr.state; }),
                highlightCols: meta.pk,
                dmlSummary: diff.summary,
                tableName: diff.tableName
            });

            // Step 3: AFTER STATE & DIFF
            var diffSlice = diff.diffRows.slice(0, 30);
            var cellDiffs = {};
            diffSlice.forEach(function (dr, rIdx) {
                if (dr.state === 'updated' && dr.changedCols) {
                    cellDiffs[rIdx] = dr.changedCols;
                }
            });

            steps.push({
                clause: '3. AFTER STATE & DIFF',
                badge: diff.afterRows.length + ' rows after (' + summaryBadge + ')',
                description: 'Full Before → After table diff on `' + diff.tableName + '`. Inserted rows are highlighted in green (`+ INSERTED`), mutated cells show `<del>old</del> → <ins>new</ins>` inline (`~ UPDATED`), and deleted rows are struck through in red (`− DELETED`).',
                code: cleanSql,
                columns: diff.columns,
                rows: diffSlice.map(function (dr) { return dr.row; }),
                rowStates: diffSlice.map(function (dr) { return dr.state === 'unchanged' ? 'normal' : dr.state; }),
                cellDiffs: cellDiffs,
                highlightCols: meta.pk,
                dmlSummary: diff.summary,
                tableName: diff.tableName
            });

            return {
                datasetId: dsId,
                finalRes: finalRes,
                steps: steps
            };
        }

        var parsed = parseSelectClauses(cleanSql);

        if (!parsed || (!parsed.from && !parsed.select) || finalRes.error) {
            if (!finalRes.error && finalRes.resultSets && finalRes.resultSets.length > 1) {
                finalRes.resultSets.forEach(function (rs, idx) {
                    steps.push({
                        clause: 'STATEMENT ' + (idx + 1),
                        badge: rs.rows.length + ' rows',
                        description: 'Result set from statement #' + (idx + 1),
                        code: rs.statement || cleanSql,
                        columns: rs.columns,
                        rows: rs.rows.slice(0, 25),
                        rowStates: rs.rows.slice(0, 25).map(function () { return 'normal'; }),
                        highlightCols: []
                    });
                });
            } else if (!finalRes.error) {
                steps.push({
                    clause: 'RESULT',
                    badge: (finalRes.rows ? finalRes.rows.length : 0) + ' rows',
                    description: 'Final query execution output.',
                    code: cleanSql,
                    columns: finalRes.columns || [],
                    rows: (finalRes.rows || []).slice(0, 25),
                    rowStates: (finalRes.rows || []).slice(0, 25).map(function () { return 'normal'; }),
                    highlightCols: []
                });
            }
            return {
                datasetId: dsId,
                finalRes: finalRes,
                steps: steps
            };
        }

        var withPrefix = parsed.withClause ? (parsed.withClause + '\n') : '';
        var cteNames = (parsed.cteList || []).map(function (c) { return c.name; });

        // ─── STEP 0: SOURCE TABLES ───
        var sourceTables = extractSourceTables(cleanSql, cteNames);
        if (sourceTables.length > 0) {
            var subTables = [];
            for (var stIdx = 0; stIdx < sourceTables.length; stIdx++) {
                var tblName = sourceTables[stIdx];
                var tblRes = await getEngine().execute('SELECT * FROM ' + tblName + ' LIMIT 6', dsId);
                if (!tblRes.error && tblRes.columns && tblRes.columns.length > 0) {
                    var tblMeta = SCHEMA_META[tblName] || { pk: [], fk: {} };
                    subTables.push({
                        tableName: tblName,
                        columns: tblRes.columns,
                        rows: tblRes.rows.slice(0, 6),
                        pkCols: tblMeta.pk || [],
                        fkMap: tblMeta.fk || {}
                    });
                }
            }
            if (subTables.length > 0) {
                var firstSub = subTables[0];
                steps.push({
                    clause: '0. SOURCE TABLES',
                    badge: subTables.length + (subTables.length === 1 ? ' base table' : ' base tables'),
                    description: 'Raw base relation' + (subTables.length > 1 ? 's' : '') + ' (' + subTables.map(function (s) { return '`' + s.tableName + '`'; }).join(', ') + ') read from storage before CTEs, joins, or predicates execute.',
                    code: subTables.map(function (s) { return 'SELECT * FROM ' + s.tableName + ' LIMIT 6;'; }).join('\n'),
                    columns: firstSub.columns,
                    rows: firstSub.rows,
                    rowStates: firstSub.rows.map(function () { return 'normal'; }),
                    highlightCols: firstSub.pkCols,
                    subTables: subTables
                });
            }
        }

        // ─── STEP 1: WITH CTE (supports multiple CTEs and Recursive Anchor + Fixpoint) ───
        if (parsed.cteList && parsed.cteList.length > 0) {
            for (var cIdx = 0; cIdx < parsed.cteList.length; cIdx++) {
                var cte = parsed.cteList[cIdx];
                var priorCtes = parsed.cteList.slice(0, cIdx).map(function (p) { return p.rawDef; });
                var priorWithPrefix = priorCtes.length > 0
                    ? ('WITH ' + (/^\s*WITH\s+RECURSIVE\b/i.test(parsed.withClause) ? 'RECURSIVE ' : '') + priorCtes.join(',\n') + '\n')
                    : '';

                if (cte.isRecursive && cte.anchorSql) {
                    // Step 1a: CTE Anchor Member
                    var anchorQuery = priorWithPrefix + cte.anchorSql + ' LIMIT 15';
                    var anchorRes = await getEngine().execute(anchorQuery, dsId);
                    var anchorCount = (!anchorRes.error && anchorRes.rows) ? anchorRes.rows.length : 0;
                    if (!anchorRes.error && anchorRes.columns && anchorRes.columns.length > 0) {
                        steps.push({
                            clause: '1a. CTE ANCHOR (' + cte.name + ')',
                            badge: anchorRes.rows.length + ' seed rows',
                            description: 'Seeds the working table for recursive CTE `' + cte.name + '` with the non-recursive base case (Iteration 0).',
                            code: cte.anchorSql,
                            columns: anchorRes.columns,
                            rows: anchorRes.rows.slice(0, 15),
                            rowStates: anchorRes.rows.slice(0, 15).map(function () { return 'cte-anchor'; }),
                            highlightCols: []
                        });
                    }

                    // Step 1b: CTE Fixpoint
                    var upToCtes = parsed.cteList.slice(0, cIdx + 1).map(function (p) { return p.rawDef; });
                    var fullRecWith = 'WITH RECURSIVE ' + upToCtes.join(',\n') + '\nSELECT * FROM ' + cte.name + ' LIMIT 25';
                    var fixRes = await getEngine().execute(fullRecWith, dsId);
                    if (!fixRes.error && fixRes.columns && fixRes.columns.length > 0) {
                        steps.push({
                            clause: '1b. CTE FIXPOINT (' + cte.name + ')',
                            badge: fixRes.rows.length + ' total rows',
                            description: 'Repeatedly joins the recursive member against the latest working table until 0 new rows are produced (fixpoint termination).',
                            code: cte.rawDef,
                            columns: fixRes.columns,
                            rows: fixRes.rows.slice(0, 20),
                            rowStates: fixRes.rows.slice(0, 20).map(function (_, rIdx) {
                                return rIdx < anchorCount ? 'cte-anchor' : 'cte-recursive';
                            }),
                            highlightCols: []
                        });
                    }
                } else {
                    var upToDefs = parsed.cteList.slice(0, cIdx + 1).map(function (p) { return p.rawDef; });
                    var ctePrefix = 'WITH ' + (/^\s*WITH\s+RECURSIVE\b/i.test(parsed.withClause) ? 'RECURSIVE ' : '') + upToDefs.join(',\n');
                    var cteTestSql = ctePrefix + '\nSELECT * FROM ' + cte.name + ' LIMIT 20';
                    var cteRes = await getEngine().execute(cteTestSql, dsId);
                    if (!cteRes.error && cteRes.columns && cteRes.columns.length > 0) {
                        var stepLabel = parsed.cteList.length > 1
                            ? ('1.' + (cIdx + 1) + ' WITH CTE (' + cte.name + ')')
                            : ('1. WITH CTE (' + cte.name + ')');
                        steps.push({
                            clause: stepLabel,
                            badge: cteRes.rows.length + ' rows',
                            description: 'Evaluates Common Table Expression `' + cte.name + '` first, creating a scoped temporary relation before the main query executes.',
                            code: cte.rawDef,
                            columns: cteRes.columns,
                            rows: cteRes.rows.slice(0, 15),
                            rowStates: cteRes.rows.slice(0, 15).map(function () { return 'normal'; }),
                            highlightCols: []
                        });
                    }
                }
            }
        }

        // ─── STEP 2: FROM & JOIN ───
        if (parsed.from) {
            var hasJoin = /\bJOIN\b/i.test(parsed.from);
            var joinCols = extractJoinColumns(parsed.from);
            var fromSql = withPrefix + 'SELECT * FROM ' + parsed.from + ' LIMIT 20';
            var fromRes = await getEngine().execute(fromSql, dsId);
            if (!fromRes.error && fromRes.columns.length > 0) {
                var fromRowStates = fromRes.rows.slice(0, 15).map(function (r) {
                    if (hasJoin && r.some(function (cell) { return cell === null; })) {
                        return 'null-padded';
                    }
                    return 'normal';
                });
                steps.push({
                    clause: hasJoin ? '2. FROM + JOIN' : '2. FROM',
                    badge: fromRes.rows.length + (fromRes.rows.length === 20 ? '+ rows' : ' rows'),
                    description: hasJoin
                        ? 'Loads source tables and evaluates `JOIN ... ON` predicates (' + (joinCols.length ? 'join keys: `' + joinCols.join('`, `') + '`' : 'combining columns') + '). Unmatched outer-join rows are NULL-padded (`Ø NULL-padded`).'
                        : 'Loads raw candidate rows from `' + parsed.from.replace(/\s+/g, ' ') + '` into the working set.',
                    code: 'FROM ' + parsed.from,
                    columns: fromRes.columns,
                    rows: fromRes.rows.slice(0, 15),
                    rowStates: fromRowStates,
                    highlightCols: joinCols
                });
            }
        }

        // ─── STEP 3: WHERE (3VL FILTER) ───
        if (parsed.from && parsed.where) {
            var whereMatchedSql = withPrefix + 'SELECT * FROM ' + parsed.from + ' WHERE ' + parsed.where + ' LIMIT 15';
            var whereRemovedSql = withPrefix + 'SELECT * FROM ' + parsed.from + ' WHERE NOT (' + parsed.where + ') OR (' + parsed.where + ') IS NULL LIMIT 6';
            var matchedRes = await getEngine().execute(whereMatchedSql, dsId);
            var removedRes = await getEngine().execute(whereRemovedSql, dsId);

            if (!matchedRes.error && matchedRes.columns.length > 0) {
                var combinedRows = [];
                var rowStates = [];
                var keptRows = matchedRes.rows.slice(0, 10);
                keptRows.forEach(function (r) {
                    combinedRows.push(r.concat(['✓ TRUE (Kept)']));
                    rowStates.push('matched');
                });
                if (!removedRes.error && removedRes.rows.length > 0) {
                    removedRes.rows.slice(0, 5).forEach(function (r) {
                        var hasNull = r.some(function (c) { return c === null; });
                        combinedRows.push(r.concat([hasNull ? '∅ UNKNOWN / NULL (Pruned)' : '✗ FALSE (Pruned)']));
                        rowStates.push('filtered');
                    });
                }
                var cols3vl = matchedRes.columns.concat(['3VL Verdict']);
                steps.push({
                    clause: '3. WHERE (3VL)',
                    badge: matchedRes.rows.length + ' kept' + (!removedRes.error && removedRes.rows.length ? ' / ' + removedRes.rows.length + '+ pruned' : ''),
                    description: 'Evaluates `' + parsed.where.replace(/\s+/g, ' ') + '` under SQL Three-Valued Logic (`TRUE`, `FALSE`, `UNKNOWN`). Only `TRUE` rows survive; both `FALSE` and `UNKNOWN` (NULL comparisons) are pruned.',
                    code: 'WHERE ' + parsed.where,
                    columns: cols3vl,
                    rows: combinedRows,
                    rowStates: rowStates,
                    highlightCols: ['3VL Verdict']
                });
            }
        }

        // ─── STEP 4: GROUP BY & 4b. HAVING ───
        if (parsed.from && parsed.groupBy) {
            var wherePart = parsed.where ? (' WHERE ' + parsed.where) : '';
            var safeProjectionCols = stripGroupingWrappers(parsed.groupBy);
            var selectColsForGroup = safeProjectionCols ? (safeProjectionCols + ', COUNT(*) AS _group_row_count') : 'COUNT(*) AS _group_row_count';
            var groupSql = withPrefix + 'SELECT ' + selectColsForGroup + ' FROM ' + parsed.from + wherePart + ' GROUP BY ' + parsed.groupBy + ' LIMIT 15';
            var groupRes = await getEngine().execute(groupSql, dsId);
            if (!groupRes.error && groupRes.columns.length > 0) {
                var isRollupOrCube = /\b(?:ROLLUP|CUBE|GROUPING\s+SETS)\b/i.test(parsed.groupBy);
                steps.push({
                    clause: '4. GROUP BY',
                    badge: groupRes.rows.length + ' groups',
                    description: (isRollupOrCube
                        ? 'Collapses matching rows into hierarchical super-aggregate buckets (`' + parsed.groupBy + '`) and computes per-group row counts.'
                        : 'Collapses rows sharing identical values of `' + parsed.groupBy + '` into one summary bucket per unique group.'),
                    code: 'GROUP BY ' + parsed.groupBy,
                    columns: groupRes.columns,
                    rows: groupRes.rows.slice(0, 15),
                    rowStates: groupRes.rows.slice(0, 15).map(function (_, idx) { return 'group-' + (idx % 4); }),
                    highlightCols: ['_group_row_count']
                });
            }

            if (parsed.having) {
                var havingSql = withPrefix + 'SELECT ' + selectColsForGroup + ' FROM ' + parsed.from + wherePart + ' GROUP BY ' + parsed.groupBy + ' HAVING ' + parsed.having + ' LIMIT 15';
                var havingRemovedSql = withPrefix + 'SELECT ' + selectColsForGroup + ' FROM ' + parsed.from + wherePart + ' GROUP BY ' + parsed.groupBy + ' HAVING NOT (' + parsed.having + ') OR (' + parsed.having + ') IS NULL LIMIT 5';
                var havingRes = await getEngine().execute(havingSql, dsId);
                var havingRemRes = await getEngine().execute(havingRemovedSql, dsId);
                if (!havingRes.error && havingRes.columns.length > 0) {
                    var hRows = [];
                    var hStates = [];
                    havingRes.rows.slice(0, 10).forEach(function (r) {
                        hRows.push(r);
                        hStates.push('matched');
                    });
                    if (!havingRemRes.error && havingRemRes.rows.length > 0) {
                        havingRemRes.rows.slice(0, 4).forEach(function (r) {
                            hRows.push(r);
                            hStates.push('filtered');
                        });
                    }
                    steps.push({
                        clause: '4b. HAVING',
                        badge: havingRes.rows.length + ' groups kept',
                        description: 'Filters aggregated groups *after* `GROUP BY` using aggregate predicate `' + parsed.having + '`.',
                        code: 'HAVING ' + parsed.having,
                        columns: havingRes.columns,
                        rows: hRows,
                        rowStates: hStates,
                        highlightCols: ['_group_row_count']
                    });
                }
            }
        }

        // ─── STEP 5: WINDOW OVER ───
        var hasWindowFunc = /\bOVER\s*\(/i.test(parsed.select) || !!parsed.window;
        if (hasWindowFunc && parsed.from) {
            var winSql = withPrefix + 'SELECT ' + (parsed.selectDistinct ? 'DISTINCT ' : '') + parsed.select +
                ' FROM ' + parsed.from +
                (parsed.where ? ' WHERE ' + parsed.where : '') +
                (parsed.groupBy ? ' GROUP BY ' + parsed.groupBy : '') +
                (parsed.having ? ' HAVING ' + parsed.having : '') +
                (parsed.window ? ' WINDOW ' + parsed.window : '') +
                ' LIMIT 15';
            var winRes = await getEngine().execute(winSql, dsId);
            if (!winRes.error && winRes.columns.length > 0) {
                // Identify window function output aliases to highlight
                var winCols = [];
                var selectItems = splitTopLevelCommas(parsed.select);
                selectItems.forEach(function (item, idx) {
                    if (/\bOVER\s*\(|\bOVER\s+[a-zA-Z_]/i.test(item) && winRes.columns[idx]) {
                        winCols.push(winRes.columns[idx]);
                    }
                });
                steps.push({
                    clause: '5. WINDOW OVER',
                    badge: winRes.rows.length + ' rows (uncollapsed)',
                    description: 'Evaluates `OVER (PARTITION BY ... ORDER BY ...)` window frames across peer rows without collapsing individual rows.',
                    code: parsed.window ? ('WINDOW ' + parsed.window) : 'OVER (...)',
                    columns: winRes.columns,
                    rows: winRes.rows.slice(0, 15),
                    rowStates: winRes.rows.slice(0, 15).map(function (_, idx) { return 'window-' + (idx % 3); }),
                    highlightCols: winCols
                });
            }
        }

        // ─── STEP 6: SELECT PROJECTION & 6b. SET OPERATIONS ───
        var hasPostSelect = !!(parsed.orderBy || parsed.limit || parsed.setOp);
        if (parsed.select) {
            var selectStepSql = withPrefix + 'SELECT ' + (parsed.selectDistinct ? 'DISTINCT ' : '') + parsed.select +
                (parsed.from ? (' FROM ' + parsed.from) : '') +
                (parsed.where ? (' WHERE ' + parsed.where) : '') +
                (parsed.groupBy ? (' GROUP BY ' + parsed.groupBy) : '') +
                (parsed.having ? (' HAVING ' + parsed.having) : '') +
                (parsed.window ? (' WINDOW ' + parsed.window) : '');

            var selectRes = hasPostSelect ? await getEngine().execute(selectStepSql + ' LIMIT 20', dsId) : finalRes;
            if (!selectRes.error && selectRes.columns.length > 0) {
                steps.push({
                    clause: parsed.selectDistinct ? '6. SELECT DISTINCT' : '6. SELECT',
                    badge: selectRes.columns.length + ' cols × ' + selectRes.rows.length + ' rows',
                    description: 'Projects the requested output columns and evaluates scalar expressions / aliases' + (parsed.selectDistinct ? ', deduplicating identical projection rows.' : '.'),
                    code: 'SELECT ' + (parsed.selectDistinct ? 'DISTINCT ' : '') + parsed.select,
                    columns: selectRes.columns,
                    rows: selectRes.rows.slice(0, 15),
                    rowStates: selectRes.rows.slice(0, 15).map(function () { return 'normal'; }),
                    highlightCols: []
                });
            }
        }

        if (parsed.setOp) {
            var setOpSql = withPrefix + 'SELECT ' + (parsed.selectDistinct ? 'DISTINCT ' : '') + parsed.select +
                (parsed.from ? (' FROM ' + parsed.from) : '') +
                (parsed.where ? (' WHERE ' + parsed.where) : '') +
                (parsed.groupBy ? (' GROUP BY ' + parsed.groupBy) : '') +
                (parsed.having ? (' HAVING ' + parsed.having) : '') +
                (parsed.window ? (' WINDOW ' + parsed.window) : '') +
                ' ' + parsed.setOp;
            var setOpRes = (parsed.orderBy || parsed.limit) ? await getEngine().execute(setOpSql + ' LIMIT 20', dsId) : finalRes;
            if (!setOpRes.error && setOpRes.columns.length > 0) {
                steps.push({
                    clause: '6b. ' + (parsed.setOpType || 'UNION'),
                    badge: setOpRes.rows.length + ' combined rows',
                    description: 'Combines result sets vertically using `' + (parsed.setOpType || 'UNION') + '`.',
                    code: parsed.setOp,
                    columns: setOpRes.columns,
                    rows: setOpRes.rows.slice(0, 15),
                    rowStates: setOpRes.rows.slice(0, 15).map(function () { return 'matched'; }),
                    highlightCols: []
                });
            }
        }

        // ─── STEP 7: ORDER BY + LIMIT (with sliced-off rows shown as filtered) ───
        if ((parsed.orderBy || parsed.limit) && !finalRes.error) {
            var orderLimitRows = finalRes.rows.slice(0, 20);
            var orderLimitStates = orderLimitRows.map(function () { return 'matched'; });

            // If LIMIT is present, fetch up to 20 rows WITHOUT LIMIT so we can show sliced-off rows at the bottom!
            if (parsed.limit) {
                var unlimitedSql = withPrefix + 'SELECT ' + (parsed.selectDistinct ? 'DISTINCT ' : '') + parsed.select +
                    (parsed.from ? (' FROM ' + parsed.from) : '') +
                    (parsed.where ? (' WHERE ' + parsed.where) : '') +
                    (parsed.groupBy ? (' GROUP BY ' + parsed.groupBy) : '') +
                    (parsed.having ? (' HAVING ' + parsed.having) : '') +
                    (parsed.window ? (' WINDOW ' + parsed.window) : '') +
                    (parsed.setOp ? (' ' + parsed.setOp) : '') +
                    (parsed.orderBy ? (' ORDER BY ' + parsed.orderBy) : '') +
                    ' LIMIT 20';
                var unlimRes = await getEngine().execute(unlimitedSql, dsId);
                if (!unlimRes.error && unlimRes.rows.length > finalRes.rows.length) {
                    var keptCount = finalRes.rows.length;
                    orderLimitRows = [];
                    orderLimitStates = [];
                    unlimRes.rows.slice(0, Math.min(keptCount + 5, 20)).forEach(function (r, idx) {
                        orderLimitRows.push(r);
                        orderLimitStates.push(idx < keptCount ? 'matched' : 'filtered');
                    });
                }
            }

            var labelParts = [];
            var codeParts = [];
            if (parsed.orderBy) {
                labelParts.push('ORDER BY');
                codeParts.push('ORDER BY ' + parsed.orderBy);
            }
            if (parsed.limit) {
                labelParts.push('LIMIT');
                codeParts.push('LIMIT ' + parsed.limit);
            }
            steps.push({
                clause: '7. ' + labelParts.join(' + '),
                badge: finalRes.rows.length + ' final rows',
                description: (parsed.orderBy ? 'Sorts output rows by `' + parsed.orderBy + '`' : '') +
                    (parsed.orderBy && parsed.limit ? ' and then ' : '') +
                    (parsed.limit ? 'slices the top `' + parsed.limit + '` rows (rows beyond `LIMIT` are pruned at the bottom).' : '.'),
                code: codeParts.join('\n'),
                columns: finalRes.columns,
                rows: orderLimitRows,
                rowStates: orderLimitStates,
                highlightCols: [],
                isLimitStep: !!parsed.limit
            });
        }

        // ─── STEP 8: EXPLAIN PLAN ───
        if (!finalRes.error && finalRes.plan && finalRes.plan.length > 0) {
            steps.push({
                clause: '8. EXPLAIN PLAN',
                badge: finalRes.plan.length + (finalRes.plan.length === 1 ? ' plan node' : ' plan nodes'),
                description: 'Physical execution plan generated by the ' + getEngine().getEngineLabel() + ' query optimizer (`EXPLAIN ' + (getEngine().getEngineMode() === 'postgres' ? '(ANALYZE, BUFFERS, COSTS)' : 'QUERY PLAN') + '`).',
                code: (getEngine().getEngineMode() === 'postgres' ? 'EXPLAIN (ANALYZE, BUFFERS, COSTS, FORMAT JSON)\n' : 'EXPLAIN QUERY PLAN\n') + cleanSql,
                columns: ['Node ID', 'Parent', 'Physical Operator & Cost Details'],
                rows: finalRes.plan.map(function (p) { return [p.id, p.parent, p.detail]; }),
                rowStates: finalRes.plan.map(function () { return 'normal'; }),
                highlightCols: ['Physical Operator & Cost Details'],
                isExplainStep: true,
                planNodes: finalRes.plan
            });
        }

        return {
            datasetId: dsId,
            finalRes: finalRes,
            steps: steps
        };
    }

    function splitTopLevelCommas(str) {
        var res = [];
        var depth = 0;
        var inSingle = false;
        var start = 0;
        for (var i = 0; i < str.length; i++) {
            var ch = str[i];
            if (ch === "'" && str[i - 1] !== '\\') {
                inSingle = !inSingle;
                continue;
            }
            if (inSingle) continue;
            if (ch === '(') depth++;
            else if (ch === ')') depth = Math.max(0, depth - 1);
            else if (ch === ',' && depth === 0) {
                res.push(str.slice(start, i).trim());
                start = i + 1;
            }
        }
        if (start < str.length) res.push(str.slice(start).trim());
        return res;
    }

    function formatCellValue(cell) {
        if (cell === null || cell === undefined) {
            return '<span class="sql-null-badge">NULL</span>';
        }
        if (typeof cell === 'number') {
            return '<span class="sql-num-val">' + escapeHtml(cell) + '</span>';
        }
        return escapeHtml(cell);
    }

    /**
     * Render a single sub-table card for Step 0 (0. SOURCE TABLES)
     */
    function renderSubTableCard(sub) {
        var pkSet = {};
        (sub.pkCols || []).forEach(function (c) { pkSet[c.toLowerCase()] = true; });
        var fkMap = sub.fkMap || {};

        var html = '<div class="sql-subtable-card">';
        html += '<div class="sql-subtable-header">' +
            '<span class="sql-subtable-name">⊞ ' + escapeHtml(sub.tableName) + '</span>' +
            '<span class="sql-subtable-meta">Sample (' + sub.rows.length + ' rows)</span>' +
        '</div>';
        html += '<div class="sql-step-table-scroll"><table class="sql-step-table sql-subtable">';
        html += '<thead><tr>';
        sub.columns.forEach(function (col) {
            var lowerCol = String(col).toLowerCase();
            var isPk = !!pkSet[lowerCol];
            var fkTarget = fkMap[lowerCol];
            html += '<th class="' + (isPk ? 'is-highlighted-col' : '') + '"><div class="sql-th-inner"><span>' + escapeHtml(col) + '</span>';
            if (isPk) html += '<span class="sql-col-key-badge is-pk" title="Primary Key">PK</span>';
            if (fkTarget) html += '<span class="sql-col-key-badge is-fk" title="Foreign Key → ' + escapeHtml(fkTarget) + '">FK</span>';
            html += '</div></th>';
        });
        html += '</tr></thead><tbody>';
        sub.rows.forEach(function (row) {
            html += '<tr>';
            row.forEach(function (cell, cIdx) {
                var colName = String(sub.columns[cIdx] || '').toLowerCase();
                var isPk = !!pkSet[colName];
                html += '<td class="' + (isPk ? 'is-highlighted-cell' : '') + '">' + formatCellValue(cell) + '</td>';
            });
            html += '</tr>';
        });
        html += '</tbody></table></div></div>';
        return html;
    }

    /**
     * Render a rich HTML data table with PK/FK badges, row states, and DML cell diffs
     */
    function renderStepTable(step, datasetId) {
        // Step 0 multi-table view
        if (step.subTables && step.subTables.length > 0) {
            return '<div class="sql-subtables-grid">' +
                step.subTables.map(renderSubTableCard).join('') +
            '</div>';
        }

        if (!step || !step.columns || step.columns.length === 0) {
            return '<div class="sql-viz-empty">Statement executed successfully (0 columns returned).</div>';
        }

        var pkSet = {};
        var fkMap = {};
        Object.keys(SCHEMA_META).forEach(function (tbl) {
            if (!datasetId || KNOWN_TABLES[tbl] === datasetId) {
                SCHEMA_META[tbl].pk.forEach(function (col) { pkSet[col] = true; });
                Object.keys(SCHEMA_META[tbl].fk).forEach(function (col) { fkMap[col] = SCHEMA_META[tbl].fk[col]; });
            }
        });

        var highlightSet = {};
        (step.highlightCols || []).forEach(function (c) { highlightSet[String(c).toLowerCase()] = true; });

        var hasRowStateBadges = (step.rowStates || []).some(function (s) {
            return s === 'matched' || s === 'filtered' || s === 'null-padded' ||
                   s === 'cte-anchor' || s === 'cte-recursive' ||
                   s === 'inserted' || s === 'updated' || s === 'deleted';
        });

        var html = '<div class="sql-step-table-scroll"><table class="sql-step-table">';
        html += '<thead><tr>';
        if (hasRowStateBadges) {
            html += '<th class="sql-row-state-th">Row State</th>';
        }
        step.columns.forEach(function (col) {
            var lowerCol = String(col).toLowerCase();
            var isPk = pkSet[lowerCol];
            var fkTarget = fkMap[lowerCol];
            var isHighlighted = highlightSet[lowerCol];
            html += '<th class="' + (isHighlighted ? 'is-highlighted-col' : '') + '">';
            html += '<div class="sql-th-inner">';
            html += '<span>' + escapeHtml(col) + '</span>';
            if (isPk) {
                html += '<span class="sql-col-key-badge is-pk" title="Primary Key">PK</span>';
            }
            if (fkTarget) {
                html += '<span class="sql-col-key-badge is-fk" title="Foreign Key → ' + escapeHtml(fkTarget) + '">FK</span>';
            }
            html += '</div></th>';
        });
        html += '</tr></thead><tbody>';

        if (!step.rows || step.rows.length === 0) {
            html += '<tr><td colspan="' + (step.columns.length + (hasRowStateBadges ? 1 : 0)) + '" class="sql-empty-row-cell">0 rows matched this step</td></tr>';
        } else {
            step.rows.forEach(function (row, rIdx) {
                var state = (step.rowStates && step.rowStates[rIdx]) || 'normal';
                var rowDiffs = (step.cellDiffs && step.cellDiffs[rIdx]) || null;
                html += '<tr class="sql-step-tr is-' + escapeHtml(state) + '">';
                if (hasRowStateBadges) {
                    var badgeHtml = '';
                    if (state === 'matched') {
                        badgeHtml = '<span class="sql-row-badge is-kept">✓ Kept</span>';
                    } else if (state === 'filtered') {
                        badgeHtml = '<span class="sql-row-badge is-pruned">' + (step.isLimitStep ? '✗ Sliced by LIMIT' : '✗ Pruned') + '</span>';
                    } else if (state === 'null-padded') {
                        badgeHtml = '<span class="sql-row-badge is-null-padded">Ø NULL-padded</span>';
                    } else if (state === 'cte-anchor') {
                        badgeHtml = '<span class="sql-row-badge is-cte-anchor">⚓ Anchor (Iter 0)</span>';
                    } else if (state === 'cte-recursive') {
                        badgeHtml = '<span class="sql-row-badge is-cte-recursive">↻ Recursive Step</span>';
                    } else if (state === 'inserted') {
                        badgeHtml = '<span class="sql-row-badge is-inserted">+ INSERTED</span>';
                    } else if (state === 'updated') {
                        badgeHtml = '<span class="sql-row-badge is-updated">~ UPDATED</span>';
                    } else if (state === 'deleted') {
                        badgeHtml = '<span class="sql-row-badge is-deleted">− DELETED</span>';
                    } else {
                        badgeHtml = '<span class="sql-row-badge">• Row</span>';
                    }
                    html += '<td class="sql-row-state-td">' + badgeHtml + '</td>';
                }
                row.forEach(function (cell, cIdx) {
                    var colName = String(step.columns[cIdx] || '');
                    var lowerCol = colName.toLowerCase();
                    var isHighlighted = highlightSet[lowerCol];
                    var cellDiff = rowDiffs && (rowDiffs[colName] || rowDiffs[cIdx]);
                    if (cellDiff) {
                        var oldV = cellDiff.oldVal !== undefined ? cellDiff.oldVal : cellDiff.before;
                        var newV = cellDiff.newVal !== undefined ? cellDiff.newVal : cellDiff.after;
                        html += '<td class="is-highlighted-cell is-diff-cell">' +
                            '<span class="sql-cell-diff">' +
                                '<del>' + formatCellValue(oldV) + '</del>' +
                                '<span class="sql-cell-diff-arrow">→</span>' +
                                '<ins>' + formatCellValue(newV) + '</ins>' +
                            '</span>' +
                        '</td>';
                    } else {
                        html += '<td class="' + (isHighlighted ? 'is-highlighted-cell' : '') + '">' + formatCellValue(cell) + '</td>';
                    }
                });
                html += '</tr>';
            });
        }
        html += '</tbody></table></div>';
        return html;
    }

    /**
     * Render EXPLAIN QUERY PLAN tree nodes
     */
    function renderExplainPlan(plan) {
        if (!plan || plan.length === 0) return '';
        var engineLabel = (getEngine() && getEngine().getEngineLabel) ? getEngine().getEngineLabel() : 'SQL Engine';
        var html = '<div class="sql-explain-box">';
        html += '<div class="sql-explain-title">⚡ Physical Execution Plan (' + escapeHtml(engineLabel) + ')</div>';
        html += '<div class="sql-explain-tree">';
        plan.forEach(function (node) {
            var detail = String(node.detail || '');
            var isIndex = /USING.*INDEX|INDEX\s+SCAN|INDEX\s+ONLY\s+SCAN|BITMAP\s+INDEX/i.test(detail);
            var isScan = /SCAN|SEQ\s+SCAN/i.test(detail) && !isIndex;
            var isTemp = /TEMP\s+B-TREE|SORT|AGGREGATE|HASH/i.test(detail);
            var cls = isIndex ? 'is-index' : (isScan ? 'is-scan' : (isTemp ? 'is-temp' : ''));
            html += '<div class="sql-explain-node ' + cls + '">' +
                '<span class="sql-explain-node-id">#' + escapeHtml(node.id) + '</span>' +
                '<span class="sql-explain-node-detail">' + escapeHtml(detail) + '</span>' +
            '</div>';
        });
        html += '</div></div>';
        return html;
    }

    function buildEngineSwitchHtml() {
        var mode = (getEngine() && getEngine().getEngineMode) ? getEngine().getEngineMode() : 'postgres';
        var pgReady = (getEngine() && getEngine().isPgliteReady) ? getEngine().isPgliteReady() : false;
        return '<div class="sql-engine-switch" role="group" aria-label="SQL Engine Selector">' +
            '<button type="button" class="sql-engine-btn ' + (mode === 'postgres' ? 'is-active' : '') + '" data-engine-mode="postgres" title="PostgreSQL 18.6 (PGlite WASM)">' +
                '<span class="sql-engine-dot ' + (pgReady ? 'is-ready' : 'is-loading') + '"></span>PostgreSQL 18 WASM' +
            '</button>' +
            '<button type="button" class="sql-engine-btn ' + (mode === 'sqlite' ? 'is-active' : '') + '" data-engine-mode="sqlite" title="SQLite 3 (sql.js WASM)">' +
                'SQLite 3 WASM' +
            '</button>' +
        '</div>';
    }

    /**
     * Mount a full interactive clause-by-clause visualizer inside a target container.
     * Supports both:
     *   mountClauseVisualizer(container, sqlString, datasetIdOrOpts, options)
     *   mountClauseVisualizer(container, { sql, initialSql, datasetId, title, showEditor })
     */
    function mountClauseVisualizer(container, sql, datasetIdOrOpts, options) {
        var engine = getEngine();
        if (!container || !engine) {
            var noop = Promise.resolve();
            noop.stop = function () {};
            return noop;
        }
        var datasetId = datasetIdOrOpts;
        if (sql && typeof sql === 'object') {
            options = Object.assign({}, sql);
            sql = options.sql || options.initialSql || 'SELECT * FROM customers LIMIT 10;';
            datasetId = options.datasetId;
            if (options.showEditor === undefined) {
                options.showEditor = true;
            }
        } else if (datasetIdOrOpts && typeof datasetIdOrOpts === 'object') {
            options = datasetIdOrOpts;
            datasetId = options.datasetId;
        }
        options = options || {};

        if (options.showEditor) {
            var editorOpts = Object.assign({}, options, { showEditor: false });
            var refSql = options.referenceSql || options.solutionSql || sql;
            container.innerHTML =
                '<div class="sql-studio-inline-workbench" style="display:flex;flex-direction:column;gap:10px;padding:12px;background:var(--bg-secondary,#0f172a);">' +
                    '<div class="sql-lab-editor-box" style="display:flex;flex-direction:column;gap:8px;">' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;font-size:0.76rem;color:var(--text-secondary,#94a3b8);padding:0 2px;">' +
                            '<span style="font-family:var(--font-mono,monospace);color:#38bdf8;font-weight:700;">query.sql · Live SQL Workbench</span>' +
                            '<span>Shortcut: Cmd/Ctrl + Enter to Run</span>' +
                        '</div>' +
                        '<textarea class="sql-live-editor sql-inline-textarea" rows="7" spellcheck="false" style="width:100%;font-family:var(--font-mono,monospace);font-size:0.85rem;padding:10px 12px;border-radius:8px;background:var(--bg-primary,#0b0f19);color:var(--text-primary,#f8fafc);border:1px solid var(--border-subtle,rgba(148,163,184,0.28));">' + escapeHtml(sql) + '</textarea>' +
                        '<div class="sql-lab-actions" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                            '<button type="button" class="sql-exec-btn is-primary" data-inline-viz-action="run">▶ Run &amp; Visualize SQL</button>' +
                            '<button type="button" class="sql-exec-btn is-secondary" data-inline-viz-action="step">🔍 Step Clauses (Step 0 → 8)</button>' +
                            '<button type="button" class="sql-exec-btn is-verify" data-inline-viz-action="verify" style="background:rgba(16,185,129,0.16);color:#34d399;border:1px solid rgba(16,185,129,0.4);">✓ Check SQL Assertions</button>' +
                            '<button type="button" class="sql-exec-btn is-secondary" data-inline-viz-action="explain">📊 EXPLAIN QUERY PLAN</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="sql-inline-verify-banner" style="display:none;padding:12px 14px;border-radius:8px;font-size:0.83rem;"></div>' +
                    '<div class="sql-inline-viz-stage"></div>' +
                '</div>';
            var ed = container.querySelector('.sql-live-editor');
            var stage = container.querySelector('.sql-inline-viz-stage');
            var verifyBanner = container.querySelector('.sql-inline-verify-banner');
            var runBtn = container.querySelector('[data-inline-viz-action="run"]');
            var stepBtn = container.querySelector('[data-inline-viz-action="step"]');
            var verifyBtn = container.querySelector('[data-inline-viz-action="verify"]');
            var explainBtn = container.querySelector('[data-inline-viz-action="explain"]');

            async function runVerification() {
                if (!verifyBanner) return;
                var currentSql = ed ? ed.value : sql;
                verifyBanner.style.display = 'block';
                verifyBanner.style.background = 'rgba(56,189,248,0.1)';
                verifyBanner.style.border = '1px solid rgba(56,189,248,0.35)';
                verifyBanner.style.color = '#e2e8f0';
                verifyBanner.innerHTML = '⏳ Running automated relational assertions against reference schema &amp; tuples...';
                await mountClauseVisualizer(stage, currentSql, datasetId, Object.assign({}, editorOpts, { startAtFinal: true }));
                var vRes = await verifyQueryAgainstReference(currentSql, refSql, { datasetId: datasetId });
                var checksHtml = (vRes.checks || []).map(function (c) {
                    return '<div style="display:flex;align-items:center;gap:8px;padding:3px 0;">' +
                        '<span style="font-weight:700;color:' + (c.passed ? '#34d399' : '#f87171') + ';">' + (c.passed ? '✓' : '✗') + '</span>' +
                        '<strong style="color:#f8fafc;">' + escapeHtml(c.name) + ':</strong>' +
                        '<span style="color:#cbd5e1;">' + escapeHtml(c.detail || '') + '</span>' +
                    '</div>';
                }).join('');
                verifyBanner.style.background = vRes.passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
                verifyBanner.style.border = vRes.passed ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(239,68,68,0.45)';
                verifyBanner.innerHTML =
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                        '<strong style="font-size:0.9rem;color:' + (vRes.passed ? '#34d399' : '#f87171') + ';">' +
                            (vRes.passed ? '✓ All Relational SQL Assertions Passed (' + vRes.passedCount + '/' + vRes.totalCount + ')' : '⚠ SQL Verification Checks (' + (vRes.passedCount || 0) + '/' + (vRes.totalCount || 4) + ' Passed)') +
                        '</strong>' +
                        '<span style="font-size:0.75rem;color:#94a3b8;">Dataset: ' + escapeHtml(datasetId || 'ecommerce') + '</span>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:4px 14px;">' + checksHtml + '</div>';
                if (typeof options.onVerify === 'function') {
                    options.onVerify(vRes);
                }
            }

            if (runBtn) {
                runBtn.addEventListener('click', function () {
                    if (verifyBanner) verifyBanner.style.display = 'none';
                    mountClauseVisualizer(stage, ed ? ed.value : sql, datasetId, Object.assign({}, editorOpts, { startAtFinal: true }));
                });
            }
            if (stepBtn) {
                stepBtn.addEventListener('click', function () {
                    if (verifyBanner) verifyBanner.style.display = 'none';
                    mountClauseVisualizer(stage, ed ? ed.value : sql, datasetId, Object.assign({}, editorOpts, { startAtFinal: false, initialStepIndex: 0 }));
                });
            }
            if (verifyBtn) {
                verifyBtn.addEventListener('click', function () {
                    runVerification();
                });
            }
            if (explainBtn) {
                explainBtn.addEventListener('click', async function () {
                    if (verifyBanner) verifyBanner.style.display = 'none';
                    await mountClauseVisualizer(stage, ed ? ed.value : sql, datasetId, Object.assign({}, editorOpts, { startAtFinal: true }));
                    var stepBtns = stage.querySelectorAll('.sql-pipeline-step');
                    if (stepBtns.length > 0) {
                        stepBtns[stepBtns.length - 1].click();
                    }
                    var expBox = stage.querySelector('.sql-explain-box');
                    if (expBox) {
                        expBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            }
            if (ed) {
                ed.addEventListener('keydown', function (ev) {
                    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
                        ev.preventDefault();
                        mountClauseVisualizer(stage, ed.value, datasetId, Object.assign({}, editorOpts, { startAtFinal: true }));
                    }
                });
            }
            var initProm = mountClauseVisualizer(stage, sql, datasetId, editorOpts);
            if (options.autoVerify) {
                initProm.then(function () { runVerification(); });
            }
            return initProm;
        }

        var promise = (async function () {
            container.innerHTML = '<div class="sql-viz-loading">⏳ Executing SQL & building 9-stage execution pipeline...</div>';

            var pipeline = await buildStepPipeline(sql, datasetId);
            var finalRes = pipeline.finalRes;
            var steps = pipeline.steps;
            var datasets = getDatasets();
            var dsInfo = datasets[pipeline.datasetId] || { title: pipeline.datasetId };

            if (finalRes.error) {
                container.innerHTML =
                    '<div class="sql-viz-panel is-error">' +
                        '<div class="sql-viz-header">' +
                            '<span class="sql-viz-badge is-error">✗ SQL Execution Error</span>' +
                            '<div class="sql-viz-meta-right">' +
                                buildEngineSwitchHtml() +
                                '<span class="sql-viz-dataset">Dataset: ' + escapeHtml(dsInfo.title) + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<pre class="sql-viz-error-msg">' + escapeHtml(finalRes.error) + '</pre>' +
                    '</div>';
                bindEngineButtons(container, sql, pipeline.datasetId, options);
                return;
            }

            var activeIdx = steps.length > 0 ? steps.length - 1 : 0;
            // Default to final data step (before Step 8 Explain Plan) so the user immediately sees the output table
            if (steps.length > 1 && steps[activeIdx].isExplainStep && !options.focusExplain) {
                activeIdx = steps.length - 2;
            }
            if (options.startAtFinal === false) {
                activeIdx = 0;
            }
            if (options.focusExplain && steps.length > 0) {
                activeIdx = steps.length - 1;
            }
            if (typeof options.initialStepIndex === 'number' && options.initialStepIndex >= 0 && options.initialStepIndex < steps.length) {
                activeIdx = options.initialStepIndex;
            }

            function render() {
                var currentStep = steps[activeIdx] || {
                    clause: 'RESULT',
                    badge: (finalRes.rows ? finalRes.rows.length : 0) + ' rows',
                    description: 'Query output',
                    code: sql,
                    columns: finalRes.columns || [],
                    rows: finalRes.rows || [],
                    rowStates: []
                };

                var html = '<div class="sql-viz-panel">';
                // Header bar with Engine Toggle + Reset DB button
                html += '<div class="sql-viz-header">' +
                    '<div class="sql-viz-title-wrap">' +
                        '<span class="sql-viz-badge is-ok">✓ Executed (' + escapeHtml(finalRes.durationMs) + ' ms)</span>' +
                        '<span class="sql-viz-dataset">🗄️ ' + escapeHtml(dsInfo.title) + '</span>' +
                    '</div>' +
                    '<div class="sql-viz-meta-right">' +
                        buildEngineSwitchHtml() +
                        '<button type="button" class="sql-viz-reset-btn" data-action="reset-dataset" title="Reset dataset tables to initial seed state">↺ Reset DB</button>' +
                    '</div>' +
                '</div>';

                // Clause Pipeline Stepper Bar
                if (steps.length > 1) {
                    html += '<div class="sql-pipeline-bar" role="tablist" aria-label="SQL Clause Execution Pipeline">';
                    html += '<span class="sql-pipeline-label">Execution Order:</span>';
                    steps.forEach(function (st, idx) {
                        var isActive = idx === activeIdx;
                        html += '<button type="button" role="tab" aria-selected="' + isActive + '" class="sql-pipeline-step ' + (isActive ? 'is-active' : '') + '" data-step-idx="' + idx + '">' +
                            '<span class="sql-pipeline-clause">' + escapeHtml(st.clause) + '</span>' +
                            '<span class="sql-pipeline-count">' + escapeHtml(st.badge) + '</span>' +
                        '</button>';
                        if (idx < steps.length - 1) {
                            html += '<span class="sql-pipeline-arrow" aria-hidden="true">→</span>';
                        }
                    });
                    html += '</div>';
                }

                // Active Step Explanation Banner
                html += '<div class="sql-step-explainer">' +
                    '<div class="sql-step-explainer-text">' +
                        '<strong>' + escapeHtml(currentStep.clause) + ':</strong> ' +
                        '<span>' + escapeHtml(currentStep.description) + '</span>' +
                    '</div>' +
                    '<code class="sql-step-code-pill">' + escapeHtml(currentStep.code) + '</code>' +
                '</div>';

                // Active Step Table Output
                html += '<div class="sql-step-table-container">' + renderStepTable(currentStep, pipeline.datasetId) + '</div>';

                // Explain Query Plan Footer
                if (finalRes.plan && finalRes.plan.length > 0) {
                    html += renderExplainPlan(finalRes.plan);
                }

                html += '</div>';
                container.innerHTML = html;

                container.querySelectorAll('.sql-pipeline-step').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        activeIdx = Number(btn.getAttribute('data-step-idx')) || 0;
                        render();
                        if (steps[activeIdx] && steps[activeIdx].isExplainStep) {
                            var expBox = container.querySelector('.sql-explain-box');
                            if (expBox) expBox.classList.add('is-focused');
                        }
                    });
                });

                var resetBtn = container.querySelector('[data-action="reset-dataset"]');
                if (resetBtn) {
                    resetBtn.addEventListener('click', async function () {
                        resetBtn.disabled = true;
                        resetBtn.textContent = '⏳ Resetting...';
                        await engine.resetDataset(pipeline.datasetId);
                        await mountClauseVisualizer(container, sql, pipeline.datasetId, options);
                    });
                }

                bindEngineButtons(container, sql, pipeline.datasetId, options);
            }

            render();
            if (options.focusExplain) {
                var expBox = container.querySelector('.sql-explain-box');
                if (expBox) {
                    expBox.classList.add('is-focused');
                    expBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        })();

        promise.stop = function () {};
        return promise;
    }

    function bindEngineButtons(container, sql, datasetId, options) {
        container.querySelectorAll('.sql-engine-btn').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                var targetMode = btn.getAttribute('data-engine-mode');
                if (!targetMode || !getEngine()) return;
                btn.disabled = true;
                await getEngine().setEngineMode(targetMode);
                await mountClauseVisualizer(container, sql, datasetId, options);
            });
        });
    }

    /**
     * Enhance all <pre><code class="language-sql"> blocks inside a container with:
     * - Interactive "Edit & Run SQL" + "Step-by-Step Clauses" toolbar
     * - Auto-executed inline output table & 9-stage clause visualizer on mount
     * - Support for external `.code-block` header buttons (`[data-action="run-sql-inline"]` / `[data-action="run-snippet-codelab"]`)
     */
    var _autoRunQueue = Promise.resolve();

    function enhanceSqlCodeBlocks(rootEl) {
        if (!rootEl) return;
        var codeNodes = rootEl.querySelectorAll('pre code.language-sql');
        codeNodes.forEach(function (codeEl) {
            var pre = codeEl.parentElement;
            if (!pre || pre.getAttribute('data-sql-enhanced') === '1') return;
            var rawSql = (codeEl.textContent || '').trim();
            if (!rawSql) return;

            var upper = rawSql.replace(/--[^\n]*/g, '').trim().toUpperCase();
            if (!/\b(SELECT|WITH|INSERT|UPDATE|DELETE|CREATE|EXPLAIN)\b/.test(upper)) return;

            pre.setAttribute('data-sql-enhanced', '1');
            var dsId = inferDatasetFromSql(rawSql);
            var dsInfo = getDatasets()[dsId] || { title: dsId };

            var wrapper = document.createElement('div');
            wrapper.className = 'sql-executable-block';
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            var toolbar = document.createElement('div');
            toolbar.className = 'sql-exec-toolbar';
            toolbar.innerHTML =
                '<div class="sql-exec-toolbar-left">' +
                    '<span class="sql-exec-ds-tag" title="Target dataset">🗄️ ' + escapeHtml(dsInfo.title) + '</span>' +
                    '<span class="sql-exec-status-hint">Live WASM SQL · Edit query or step through clauses below</span>' +
                '</div>' +
                '<div class="sql-exec-toolbar-actions">' +
                    '<button type="button" class="sql-exec-btn is-primary" data-action="run-visualize">▶ Run Query</button>' +
                    '<button type="button" class="sql-exec-btn is-secondary" data-action="toggle-edit">✎ Edit &amp; Try SQL</button>' +
                    '<button type="button" class="sql-exec-btn is-studio" data-action="open-sql-studio" data-lang="sql">⤢ SQL Studio</button>' +
                '</div>';

            var editorWrap = document.createElement('div');
            editorWrap.className = 'sql-inline-editor-wrap';
            editorWrap.hidden = true;
            editorWrap.innerHTML =
                '<div class="sql-inline-editor-header">' +
                    '<span class="sql-inline-editor-title">✎ Editable SQL Sandbox (<code>query.sql</code> · Dataset: ' + escapeHtml(dsInfo.title) + ')</span>' +
                    '<span>Press <kbd>⌘↵</kbd> / <kbd>Ctrl+Enter</kbd> to Execute</span>' +
                '</div>' +
                '<textarea class="sql-inline-textarea" rows="' + Math.min(14, Math.max(5, rawSql.split('\n').length + 1)) + '" spellcheck="false">' + escapeHtml(rawSql) + '</textarea>' +
                '<div class="sql-inline-editor-actions">' +
                    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
                        '<button type="button" class="sql-exec-btn is-primary" data-action="exec-edited-sql">▶ Execute Edited Query (⌘↵)</button>' +
                        '<button type="button" class="sql-exec-btn is-secondary" data-action="step-edited-sql">🔍 Step Clauses (Step 0 → Final)</button>' +
                        '<button type="button" class="sql-exec-btn is-secondary" data-action="reset-edited-sql">↺ Reset to Original SQL</button>' +
                    '</div>' +
                    '<button type="button" class="sql-exec-btn is-studio" data-action="open-sql-studio" data-lang="sql">⤢ Open in Full-Screen SQL Studio</button>' +
                '</div>';

            var outputWrap = document.createElement('div');
            outputWrap.className = 'sql-inline-output-wrap';
            outputWrap.hidden = false;
            outputWrap.innerHTML =
                '<div class="sql-output-section-banner">' +
                    '<span>📊 Query Output &amp; Step-by-Step Table Visualizer</span>' +
                    '<span class="sql-output-mode-label">Live Result Set</span>' +
                '</div>' +
                '<div class="sql-inline-output-stage"></div>';

            wrapper.appendChild(toolbar);
            wrapper.appendChild(editorWrap);
            wrapper.appendChild(outputWrap);

            var editBtn = toolbar.querySelector('[data-action="toggle-edit"]');
            var runBtn = toolbar.querySelector('[data-action="run-visualize"]');
            var textarea = editorWrap.querySelector('.sql-inline-textarea');
            var execEditedBtn = editorWrap.querySelector('[data-action="exec-edited-sql"]');
            var stepEditedBtn = editorWrap.querySelector('[data-action="step-edited-sql"]');
            var resetEditedBtn = editorWrap.querySelector('[data-action="reset-edited-sql"]');
            var outputStage = outputWrap.querySelector('.sql-inline-output-stage');

            function setEditorVisible(visible, focusEditor) {
                editorWrap.hidden = !visible;
                editBtn.textContent = visible ? '✕ Hide SQL Editor' : '✎ Edit & Try SQL';
                if (visible && focusEditor && textarea) {
                    textarea.focus();
                }
            }

            editBtn.addEventListener('click', function () {
                setEditorVisible(editorWrap.hidden, true);
            });

            function runCurrentBlock(opts) {
                var currentSql = (textarea && textarea.value.trim()) ? textarea.value : rawSql;
                var currentDs = inferDatasetFromSql(currentSql) || dsId;
                outputWrap.hidden = false;
                return mountClauseVisualizer(outputStage, currentSql, currentDs, opts);
            }

            runBtn.addEventListener('click', function () {
                setEditorVisible(true, false);
                runCurrentBlock({ startAtFinal: true });
                outputWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            if (execEditedBtn) {
                execEditedBtn.addEventListener('click', function () {
                    runCurrentBlock({ startAtFinal: true });
                });
            }

            if (stepEditedBtn) {
                stepEditedBtn.addEventListener('click', function () {
                    runCurrentBlock({ startAtFinal: false, initialStepIndex: 0 });
                });
            }

            if (resetEditedBtn) {
                resetEditedBtn.addEventListener('click', function () {
                    if (textarea) textarea.value = rawSql;
                    runCurrentBlock({ startAtFinal: true });
                });
            }

            if (textarea) {
                textarea.addEventListener('keydown', function (ev) {
                    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
                        ev.preventDefault();
                        runCurrentBlock({ startAtFinal: true });
                    }
                });
            }

            // Store controller on parent .code-block and wrapper so external buttons work seamlessly
            var blockController = {
                runAndOpen: function (openEditor, focusEditor) {
                    if (openEditor !== false) {
                        setEditorVisible(true, Boolean(focusEditor));
                    }
                    runCurrentBlock({ startAtFinal: true });
                    outputWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                },
                getCurrentSql: function () {
                    return (textarea && textarea.value.trim()) ? textarea.value : rawSql;
                },
                getDatasetId: function () {
                    var currentSql = (textarea && textarea.value.trim()) ? textarea.value : rawSql;
                    return inferDatasetFromSql(currentSql) || dsId;
                }
            };
            wrapper._sqlBlockController = blockController;

            var parentCodeBlock = wrapper.closest('.code-block');
            if (parentCodeBlock) {
                parentCodeBlock._sqlBlockController = blockController;
                var extRunBtns = parentCodeBlock.querySelectorAll('[data-action="run-sql-inline"]');
                extRunBtns.forEach(function (extBtn) {
                    extBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        blockController.runAndOpen(true, false);
                    });
                });
                var extEditBtns = parentCodeBlock.querySelectorAll('[data-action="edit-sql-inline"]');
                extEditBtns.forEach(function (extBtn) {
                    extBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        blockController.runAndOpen(true, true);
                    });
                });
            }

            // Staggered auto-execution on mount so every SQL snippet renders live data & 9-stage stepper immediately
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(function () {
                    _autoRunQueue = _autoRunQueue.then(function () {
                        return runCurrentBlock({ startAtFinal: true });
                    }).catch(function () {});
                });
            } else {
                _autoRunQueue = _autoRunQueue.then(function () {
                    return runCurrentBlock({ startAtFinal: true });
                }).catch(function () {});
            }
        });
    }

    /**
     * Mount a 3-Step Guided SQL Lab inside a container.
     * Supports:
     *   - Step tabs (`Step 1`, `Step 2`, `Step 3`) + `★ Reference Solution` tab
     *   - Step instructions & collapsible hint banner
     *   - Live SQL editor (`textarea.sql-live-editor`)
     *   - Action buttons:
     *       `▶ Run & Visualize SQL`
     *       `🔍 Step-by-Step Clauses`
     *       `✓ Verify SQL Output`
     *       `★ Load Step Solution`
     */
    function mountGuidedSqlLab(container, labConfig) {
        if (!container || !labConfig) return;
        var rootSol = labConfig.solutionSql || labConfig.referenceSql || labConfig.solutionCode || '';
        var datasetId = labConfig.datasetId || inferDatasetFromSql(rootSol || '');
        var dsInfo = getDatasets()[datasetId] || { title: datasetId };

        var steps = Array.isArray(labConfig.steps) && labConfig.steps.length > 0
            ? labConfig.steps.map(function (s, idx) {
                return Object.assign({}, s, {
                    title: s.title || ('Step ' + (idx + 1)),
                    instruction: s.instruction || s.instructions || s.concept || '',
                    hint: s.hint || '',
                    starterSql: s.starterSql || s.starterCode || rootSol || '',
                    solutionSql: s.solutionSql || s.solutionCode || rootSol || ''
                });
            })
            : [
                {
                    title: 'Step 1: Inspect & Filter Base Rows',
                    instruction: labConfig.step1Instruction || 'Write the foundational SELECT / FROM / WHERE query against the dataset.',
                    hint: labConfig.step1Hint || 'Check the schema badges in Step 0 (SOURCE TABLES) to pick the right columns.',
                    starterSql: labConfig.starterSql || 'SELECT * FROM ' + (Object.keys(KNOWN_TABLES)[0] || 'customers') + ' LIMIT 10;',
                    solutionSql: labConfig.step1SolutionSql || rootSol || ''
                },
                {
                    title: 'Step 2: Join / Group / Window',
                    instruction: labConfig.step2Instruction || 'Extend the query with the required JOIN, GROUP BY, or WINDOW clause.',
                    hint: labConfig.step2Hint || 'Use the Step-by-Step Clauses bar below to inspect how groups or window frames form.',
                    starterSql: labConfig.step2StarterSql || labConfig.starterSql || '',
                    solutionSql: labConfig.step2SolutionSql || rootSol || ''
                },
                {
                    title: 'Step 3: Final Projection & Ordering',
                    instruction: labConfig.step3Instruction || labConfig.instruction || 'Complete the final query and verify that your output matches the reference solution.',
                    hint: labConfig.step3Hint || labConfig.hint || 'Click "Verify SQL Output" to compare your result set against the reference query.',
                    starterSql: labConfig.step3StarterSql || labConfig.starterSql || '',
                    solutionSql: rootSol || ''
                }
            ];

        var activeStepIdx = 0;
        var completedSteps = {};
        var draftSqlByStep = steps.map(function (s) { return s.starterSql || s.solutionSql || ''; });

        function renderLabShell() {
            var isRefTab = activeStepIdx === steps.length;
            var currentStep = isRefTab ? {
                title: '★ Reference Solution',
                instruction: 'Complete verified reference SQL solution. Run it below and step through all 9 execution stages.',
                hint: '',
                solutionSql: labConfig.solutionSql || (steps[steps.length - 1] && steps[steps.length - 1].solutionSql) || ''
            } : steps[activeStepIdx];

            var currentSql = isRefTab
                ? currentStep.solutionSql
                : (draftSqlByStep[activeStepIdx] || currentStep.starterSql || '');

            var tabsHtml = '';
            steps.forEach(function (st, idx) {
                var isDone = !!completedSteps[idx];
                var isAct = idx === activeStepIdx;
                tabsHtml += '<button type="button" class="sql-lab-step-tab ' + (isAct ? 'is-active' : '') + ' ' + (isDone ? 'is-completed' : '') + '" data-lab-step="' + idx + '">' +
                    '<span class="sql-lab-step-num">' + (isDone ? '✓' : (idx + 1)) + '</span>' +
                    '<span class="sql-lab-step-title">' + escapeHtml(st.title || ('Step ' + (idx + 1))) + '</span>' +
                '</button>';
            });
            tabsHtml += '<button type="button" class="sql-lab-step-tab is-ref-tab ' + (isRefTab ? 'is-active' : '') + '" data-lab-step="' + steps.length + '">' +
                '<span class="sql-lab-step-num">★</span>' +
                '<span class="sql-lab-step-title">Reference Solution</span>' +
            '</button>';

            container.innerHTML =
                '<div class="sql-guided-lab">' +
                    '<div class="sql-guided-lab-header">' +
                        '<div class="sql-guided-lab-title-row">' +
                            '<span class="sql-guided-lab-badge">🧪 Guided SQL Lab</span>' +
                            '<h4 class="sql-guided-lab-title">' + escapeHtml(labConfig.title || 'Interactive SQL Challenge') + '</h4>' +
                            '<span class="sql-viz-dataset">🗄️ ' + escapeHtml(dsInfo.title) + '</span>' +
                        '</div>' +
                        '<div class="sql-lab-step-tabs" role="tablist">' + tabsHtml + '</div>' +
                    '</div>' +
                    '<div class="sql-guided-lab-body">' +
                        '<div class="sql-lab-instruction-box">' +
                            '<div class="sql-lab-instruction-text">' + escapeHtml(currentStep.instruction || '') + '</div>' +
                            (currentStep.hint ? (
                                '<details class="sql-lab-hint-details">' +
                                    '<summary>💡 Need a hint?</summary>' +
                                    '<div class="sql-lab-hint-content">' + escapeHtml(currentStep.hint) + '</div>' +
                                '</details>'
                            ) : '') +
                        '</div>' +
                        '<div class="sql-lab-editor-box">' +
                            '<textarea class="sql-live-editor sql-inline-textarea" rows="6" spellcheck="false">' + escapeHtml(currentSql) + '</textarea>' +
                            '<div class="sql-lab-actions">' +
                                '<button type="button" class="sql-exec-btn is-primary" data-lab-action="run">▶ Run & Visualize SQL</button>' +
                                '<button type="button" class="sql-exec-btn is-secondary" data-lab-action="step">🔍 Step-by-Step Clauses</button>' +
                                '<button type="button" class="sql-exec-btn is-verify" data-lab-action="verify">✓ Verify SQL Output</button>' +
                                '<button type="button" class="sql-exec-btn is-secondary" data-lab-action="solution">★ Load Step Solution</button>' +
                            '</div>' +
                        '</div>' +
                        '<div class="sql-lab-verify-banner" hidden></div>' +
                        '<div class="sql-lab-visualizer-mount"></div>' +
                    '</div>' +
                '</div>';

            var editor = container.querySelector('.sql-live-editor');
            var verifyBanner = container.querySelector('.sql-lab-verify-banner');
            var vizMount = container.querySelector('.sql-lab-visualizer-mount');

            editor.addEventListener('input', function () {
                if (!isRefTab) {
                    draftSqlByStep[activeStepIdx] = editor.value;
                }
            });

            container.querySelectorAll('.sql-lab-step-tab').forEach(function (tabBtn) {
                tabBtn.addEventListener('click', function () {
                    activeStepIdx = Number(tabBtn.getAttribute('data-lab-step')) || 0;
                    renderLabShell();
                });
            });

            container.querySelector('[data-lab-action="run"]').addEventListener('click', function () {
                verifyBanner.hidden = true;
                mountClauseVisualizer(vizMount, editor.value, datasetId);
            });

            container.querySelector('[data-lab-action="step"]').addEventListener('click', function () {
                verifyBanner.hidden = true;
                mountClauseVisualizer(vizMount, editor.value, datasetId, { initialStepIndex: 0 });
            });

            container.querySelector('[data-lab-action="solution"]').addEventListener('click', function () {
                var sol = currentStep.solutionSql || labConfig.solutionSql || '';
                if (sol) {
                    editor.value = sol;
                    if (!isRefTab) draftSqlByStep[activeStepIdx] = sol;
                    mountClauseVisualizer(vizMount, sol, datasetId);
                }
            });

            container.querySelector('[data-lab-action="verify"]').addEventListener('click', async function () {
                var userSql = editor.value;
                var targetSol = currentStep.solutionSql || labConfig.solutionSql || '';
                verifyBanner.hidden = false;
                verifyBanner.className = 'sql-lab-verify-banner is-checking';
                verifyBanner.textContent = '⏳ Verifying query output against reference solution...';

                var userRes = await getEngine().execute(userSql, datasetId);
                await mountClauseVisualizer(vizMount, userSql, datasetId);

                if (userRes.error) {
                    verifyBanner.className = 'sql-lab-verify-banner is-fail';
                    verifyBanner.textContent = '✗ Query returned an error: ' + userRes.error;
                    return;
                }

                var passed = false;
                var reason = '';
                if (typeof currentStep.verifyFn === 'function') {
                    passed = !!currentStep.verifyFn(userRes);
                    reason = passed ? 'All custom assertions passed!' : 'Result set did not match step assertions.';
                } else if (targetSol) {
                    var refRes = await getEngine().execute(targetSol, datasetId);
                    if (!refRes.error) {
                        var sameRowCount = userRes.rows.length === refRes.rows.length;
                        var sameColCount = userRes.columns.length === refRes.columns.length;
                        var sameData = JSON.stringify(userRes.rows) === JSON.stringify(refRes.rows);
                        passed = sameRowCount && sameColCount && sameData;
                        if (passed) {
                            reason = 'Output matches reference solution (' + userRes.rows.length + ' rows × ' + userRes.columns.length + ' columns)!';
                        } else {
                            reason = 'Expected ' + refRes.rows.length + ' rows × ' + refRes.columns.length + ' cols, got ' + userRes.rows.length + ' rows × ' + userRes.columns.length + ' cols.';
                        }
                    } else {
                        passed = userRes.rows.length > 0;
                        reason = 'Query executed cleanly (' + userRes.rows.length + ' rows).';
                    }
                } else {
                    passed = !userRes.error;
                    reason = 'Query executed cleanly (' + userRes.rows.length + ' rows).';
                }

                if (passed) {
                    if (!isRefTab) completedSteps[activeStepIdx] = true;
                    verifyBanner.className = 'sql-lab-verify-banner is-pass';
                    verifyBanner.textContent = '✓ Step Verified! ' + reason;
                } else {
                    verifyBanner.className = 'sql-lab-verify-banner is-fail';
                    verifyBanner.textContent = '✗ Not quite yet — ' + reason;
                }
            });

            // Auto-visualize current SQL on load
            mountClauseVisualizer(vizMount, currentSql, datasetId);
        }

        renderLabShell();
    }

    async function verifyQueryAgainstReference(userSql, referenceSql, options) {
        options = options || {};
        var engine = getEngine();
        if (!engine) return { passed: false, error: 'Engine not initialized', checks: [] };
        var ds = options.datasetId || inferDatasetFromSql(userSql || referenceSql);
        var uRes = await engine.execute(userSql, ds);
        var rRes = await engine.execute(referenceSql || userSql, ds);
        var checks = [];
        checks.push({
            name: 'Test 1: SQL Syntax & Execution',
            passed: !uRes.error,
            detail: !uRes.error ? ('Executed in ' + uRes.durationMs + ' ms') : ('Error: ' + uRes.error)
        });
        if (uRes.error) {
            return { passed: false, passedCount: 0, totalCount: 4, checks: checks, userResult: uRes };
        }
        var hasRows = (uRes.rows && uRes.rows.length > 0) || Boolean(uRes.dmlDiff);
        checks.push({
            name: 'Test 2: Non-Empty Output Relation',
            passed: hasRows,
            detail: (uRes.rows ? uRes.rows.length : 0) + ' rows returned'
        });
        var colsMatch = !rRes.error && uRes.columns.length === rRes.columns.length;
        checks.push({
            name: 'Test 3: Projected Column Schema',
            passed: Boolean(colsMatch),
            detail: 'Columns: [' + (uRes.columns || []).join(', ') + ']'
        });
        var rowsEqual = !rRes.error && JSON.stringify(uRes.rows) === JSON.stringify(rRes.rows);
        checks.push({
            name: 'Test 4: Relational Tuple Equivalence',
            passed: Boolean(rowsEqual),
            detail: rowsEqual ? 'Exact tuple match with reference solution' : 'Tuple values differ from reference'
        });
        var passedCount = checks.filter(function (c) { return c.passed; }).length;
        return {
            passed: !uRes.error && hasRows && colsMatch && rowsEqual,
            passedCount: passedCount,
            totalCount: checks.length,
            checks: checks,
            userResult: uRes,
            referenceResult: rRes
        };
    }

    root.TableVisualizer = {
        inferDatasetFromSql: inferDatasetFromSql,
        extractSourceTables: extractSourceTables,
        extractJoinColumns: extractJoinColumns,
        parseSelectClauses: parseSelectClauses,
        buildStepPipeline: buildStepPipeline,
        buildClauseSteps: buildStepPipeline,
        buildExecutionSteps: buildStepPipeline,
        verifyQueryAgainstReference: verifyQueryAgainstReference,
        renderStepTable: renderStepTable,
        renderExplainPlan: renderExplainPlan,
        mountClauseVisualizer: mountClauseVisualizer,
        enhanceSqlCodeBlocks: enhanceSqlCodeBlocks,
        mountGuidedSqlLab: mountGuidedSqlLab,
        SCHEMA_META: SCHEMA_META
    };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
