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

    var SQL_KEYWORDS_LIST = [
        'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'NATURAL', 'LATERAL',
        'ON', 'USING', 'GROUP', 'BY', 'HAVING', 'WINDOW', 'PARTITION', 'ORDER', 'ASC', 'DESC', 'NULLS', 'FIRST', 'LAST',
        'LIMIT', 'OFFSET', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'WITH', 'RECURSIVE', 'AS', 'DISTINCT', 'ALL', 'UNION',
        'INTERSECT', 'EXCEPT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN',
        'LIKE', 'ILIKE', 'SIMILAR', 'TO', 'IS', 'NULL', 'TRUE', 'FALSE', 'UNKNOWN', 'INSERT', 'INTO', 'VALUES',
        'UPDATE', 'SET', 'DELETE', 'RETURNING', 'CONFLICT', 'DO', 'NOTHING', 'EXCLUDED', 'MERGE', 'MATCHED',
        'CREATE', 'ALTER', 'DROP', 'TABLE', 'VIEW', 'INDEX', 'MATERIALIZED', 'UNIQUE', 'PRIMARY', 'KEY', 'FOREIGN',
        'REFERENCES', 'CHECK', 'DEFAULT', 'CONSTRAINT', 'CASCADE', 'RESTRICT', 'BEGIN', 'COMMIT', 'ROLLBACK',
        'SAVEPOINT', 'TRANSACTION', 'ISOLATION', 'LEVEL', 'SERIALIZABLE', 'REPEATABLE', 'READ', 'COMMITTED',
        'UNCOMMITTED', 'FOR', 'SHARE', 'SKIP', 'LOCKED', 'NOWAIT', 'EXPLAIN', 'ANALYZE', 'BUFFERS', 'COSTS',
        'VERBOSE', 'FORMAT', 'FILTER', 'OVER', 'RANGE', 'UNBOUNDED', 'PRECEDING', 'FOLLOWING', 'CURRENT', 'ROW',
        'GROUPS', 'EXCLUDE', 'TIES', 'NO', 'OTHERS', 'ROLLUP', 'CUBE', 'GROUPING', 'SETS', 'CAST',
        'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'CURRENT_TIME', 'PRAGMA'
    ];

    var SQL_FUNCTIONS_LIST = [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'GREATEST', 'LEAST', 'ROUND', 'FLOOR', 'CEIL',
        'CEILING', 'ABS', 'MOD', 'POWER', 'SQRT', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'PERCENT_RANK',
        'CUME_DIST', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE', 'STRING_AGG', 'GROUP_CONCAT',
        'ARRAY_AGG', 'JSON_OBJECT', 'JSON_BUILD_OBJECT', 'JSONB_BUILD_OBJECT', 'JSON_AGG', 'JSONB_AGG',
        'JSON_EXTRACT', 'LOWER', 'UPPER', 'TRIM', 'LTRIM', 'RTRIM', 'SUBSTR', 'SUBSTRING', 'LENGTH', 'CHAR_LENGTH',
        'REPLACE', 'CONCAT', 'SPLIT_PART', 'REGEXP_REPLACE', 'REGEXP_MATCHES', 'INSTR', 'STRPOS', 'PRINTF',
        'REPEAT', 'DATE_TRUNC', 'EXTRACT', 'AGE', 'NOW', 'TO_CHAR', 'TO_DATE', 'TO_TIMESTAMP', 'GENERATE_SERIES',
        'RANDOM', 'JULIANDAY', 'STRFTIME', 'DATETIME', 'IIF', 'IFNULL'
    ];

    var SQL_TYPES_LIST = [
        'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'SERIAL', 'BIGSERIAL', 'NUMERIC', 'DECIMAL', 'REAL', 'FLOAT',
        'DOUBLE', 'PRECISION', 'MONEY', 'TEXT', 'VARCHAR', 'CHAR', 'CHARACTER', 'VARYING', 'BOOLEAN', 'BOOL',
        'DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ', 'INTERVAL', 'UUID', 'JSON', 'JSONB', 'BYTEA', 'INET',
        'CIDR', 'ARRAY', 'VECTOR'
    ];

    var SQL_KEYWORDS_SET = {};
    SQL_KEYWORDS_LIST.forEach(function (k) { SQL_KEYWORDS_SET[k] = true; });
    var SQL_FUNCTIONS_SET = {};
    SQL_FUNCTIONS_LIST.forEach(function (f) { SQL_FUNCTIONS_SET[f] = true; });
    var SQL_TYPES_SET = {};
    SQL_TYPES_LIST.forEach(function (t) { SQL_TYPES_SET[t] = true; });

    /**
     * Tokenizes a SQL string into syntax-highlighted HTML spans (.sql-tok-*).
     */
    function highlightSql(sql) {
        if (sql === null || sql === undefined) return '';
        var raw = String(sql);
        if (!raw) return '';
        var tokenRe = /(\/\*[\s\S]*?\*\/|--[^\n]*)|('(?:''|[^'])*')|(\b\d+(?:\.\d+)?\b)|(::|->>|->|#>>|#>|@>|<@|<>|!=|<=|>=|\|\||[=<>+\-*/%])|(\b[A-Za-z_][A-Za-z0-9_]*\b)/g;
        var out = '';
        var lastIndex = 0;
        var match;
        while ((match = tokenRe.exec(raw)) !== null) {
            if (match.index > lastIndex) {
                out += escapeHtml(raw.slice(lastIndex, match.index));
            }
            var full = match[0];
            if (match[1] !== undefined) {
                out += '<span class="sql-tok-cmt sql-tok-comment">' + escapeHtml(full) + '</span>';
            } else if (match[2] !== undefined) {
                out += '<span class="sql-tok-str">' + escapeHtml(full) + '</span>';
            } else if (match[3] !== undefined) {
                out += '<span class="sql-tok-num">' + escapeHtml(full) + '</span>';
            } else if (match[4] !== undefined) {
                out += '<span class="sql-tok-op">' + escapeHtml(full) + '</span>';
            } else if (match[5] !== undefined) {
                var upper = full.toUpperCase();
                var afterSlice = raw.slice(tokenRe.lastIndex, tokenRe.lastIndex + 12);
                var isFuncCall = /^\s*\(/.test(afterSlice);
                if (SQL_FUNCTIONS_SET[upper] && isFuncCall) {
                    out += '<span class="sql-tok-fn">' + escapeHtml(full) + '</span>';
                } else if (SQL_KEYWORDS_SET[upper]) {
                    out += '<span class="sql-tok-kw sql-tok-keyword">' + escapeHtml(full) + '</span>';
                } else if (SQL_FUNCTIONS_SET[upper]) {
                    out += '<span class="sql-tok-fn">' + escapeHtml(full) + '</span>';
                } else if (SQL_TYPES_SET[upper]) {
                    out += '<span class="sql-tok-type">' + escapeHtml(full) + '</span>';
                } else {
                    out += escapeHtml(full);
                }
            } else {
                out += escapeHtml(full);
            }
            lastIndex = tokenRe.lastIndex;
        }
        if (lastIndex < raw.length) {
            out += escapeHtml(raw.slice(lastIndex));
        }
        return out;
    }

    /**
     * One-click SQL formatter & keyword uppercaser.
     * Preserves string literals and comments while uppercasing SQL keywords/functions
     * and placing major clauses on cleanly indented lines.
     */
    function formatSql(sql) {
        if (sql === null || sql === undefined) return '';
        var raw = String(sql).trim();
        if (!raw) return '';

        var placeholders = [];
        var protectedSql = raw.replace(/(\/\*[\s\S]*?\*\/|--[^\n]*|'(?:''|[^'])*')/g, function (m) {
            var idx = placeholders.length;
            placeholders.push(m);
            return '__SQL_PH_' + idx + '__';
        });

        // Collapse horizontal whitespace runs while keeping existing newlines reasonable
        protectedSql = protectedSql.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n');

        // Uppercase SQL keywords and built-in functions outside placeholders
        protectedSql = protectedSql.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, function (word, _w, offset, fullStr) {
            if (/^__SQL_PH_\d+__$/.test(word)) return word;
            var up = word.toUpperCase();
            var rest = fullStr.slice(offset + word.length, offset + word.length + 10);
            if (SQL_KEYWORDS_SET[up]) return up;
            if (SQL_FUNCTIONS_SET[up] && /^\s*\(/.test(rest)) return up;
            if (SQL_TYPES_SET[up] && offset >= 2 && fullStr.slice(offset - 2, offset) === '::') return up;
            return word;
        });

        // Normalize compound clause spacing
        protectedSql = protectedSql
            .replace(/\bGROUP\s+BY\b/g, 'GROUP BY')
            .replace(/\bORDER\s+BY\b/g, 'ORDER BY')
            .replace(/\bPARTITION\s+BY\b/g, 'PARTITION BY')
            .replace(/\bINNER\s+JOIN\b/g, 'INNER JOIN')
            .replace(/\bLEFT\s+OUTER\s+JOIN\b/g, 'LEFT OUTER JOIN')
            .replace(/\bLEFT\s+JOIN\b/g, 'LEFT JOIN')
            .replace(/\bRIGHT\s+OUTER\s+JOIN\b/g, 'RIGHT OUTER JOIN')
            .replace(/\bRIGHT\s+JOIN\b/g, 'RIGHT JOIN')
            .replace(/\bFULL\s+OUTER\s+JOIN\b/g, 'FULL OUTER JOIN')
            .replace(/\bFULL\s+JOIN\b/g, 'FULL JOIN')
            .replace(/\bCROSS\s+JOIN\b/g, 'CROSS JOIN')
            .replace(/\bLATERAL\s+JOIN\b/g, 'LATERAL JOIN')
            .replace(/\bUNION\s+ALL\b/g, 'UNION ALL')
            .replace(/\bINSERT\s+INTO\b/g, 'INSERT INTO')
            .replace(/\bDELETE\s+FROM\b/g, 'DELETE FROM')
            .replace(/\bON\s+CONFLICT\b/g, 'ON CONFLICT');

        // Break major top-level clauses onto new lines (tracking parenthesis depth)
        var majorClauses = [
            'WITH RECURSIVE', 'WITH', 'SELECT', 'FROM',
            'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
            'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'LATERAL JOIN', 'JOIN',
            'WHERE', 'GROUP BY', 'HAVING', 'WINDOW', 'ORDER BY', 'LIMIT', 'OFFSET',
            'UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT',
            'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'ON CONFLICT', 'RETURNING'
        ];

        // Flatten single-line queries or re-flow top-level clauses cleanly
        var singleSpaced = protectedSql.replace(/\s+/g, ' ').trim();
        var depth = 0;
        var inBetween = false;
        var formatted = '';
        var i = 0;
        while (i < singleSpaced.length) {
            var ch = singleSpaced[i];
            if (ch === '(') {
                depth++;
                formatted += ch;
                i++;
                continue;
            }
            if (ch === ')') {
                depth = Math.max(0, depth - 1);
                formatted += ch;
                i++;
                continue;
            }
            if (depth === 0 && (i === 0 || /\s/.test(singleSpaced[i - 1]))) {
                var rem = singleSpaced.slice(i);
                if (/^BETWEEN\b/.test(rem)) {
                    inBetween = true;
                }
                var matchedClause = null;
                for (var cIdx = 0; cIdx < majorClauses.length; cIdx++) {
                    var cl = majorClauses[cIdx];
                    var re = new RegExp('^' + cl.replace(/ /g, '\\s+') + '\\b');
                    var m = rem.match(re);
                    if (m) {
                        matchedClause = { text: cl, rawLen: m[0].length };
                        break;
                    }
                }
                if (matchedClause) {
                    if (formatted.trim().length > 0 && !formatted.endsWith('\n')) {
                        formatted = formatted.replace(/[ \t]+$/, '') + '\n';
                    }
                    formatted += matchedClause.text;
                    i += matchedClause.rawLen;
                    inBetween = false;
                    continue;
                }
                var subMatch = rem.match(/^(AND|OR)\b/);
                if (subMatch) {
                    if (subMatch[1] === 'AND' && inBetween) {
                        inBetween = false;
                        formatted += 'AND';
                        i += 3;
                        continue;
                    }
                    if (formatted.trim().length > 0 && !formatted.endsWith('\n')) {
                        formatted = formatted.replace(/[ \t]+$/, '') + '\n  ';
                    }
                    formatted += subMatch[1];
                    i += subMatch[0].length;
                    continue;
                }
            }
            formatted += ch;
            i++;
        }

        // Restore comments and string literals
        var restored = formatted.replace(/__SQL_PH_(\d+)__/g, function (_, idxStr) {
            var p = placeholders[Number(idxStr)];
            return p !== undefined ? p : '';
        });

        return restored
            .split('\n')
            .map(function (line) { return line.replace(/[ \t]+$/, ''); })
            .join('\n')
            .trim();
    }

    function buildSchemaTablesForEditor(datasetId) {
        var datasets = getDatasets();
        var keys = (datasetId && datasetId !== '__unified__' && datasets[datasetId])
            ? [datasetId]
            : Object.keys(datasets);
        var seen = {};
        var out = [];
        keys.forEach(function (dsKey) {
            var ds = datasets[dsKey];
            if (!ds || !Array.isArray(ds.tables)) return;
            ds.tables.forEach(function (t) {
                if (!t || !t.name || seen[t.name]) return;
                seen[t.name] = true;
                var meta = SCHEMA_META[String(t.name).toLowerCase()] || { pk: [], fk: {} };
                var cols = (t.columns || []).map(function (colItem) {
                    if (typeof colItem === 'string') {
                        var parts = colItem.trim().split(/\s+/);
                        var cName = parts[0] || '';
                        var cType = parts[1] || 'TEXT';
                        var lc = cName.toLowerCase();
                        return {
                            name: cName,
                            type: cType,
                            pk: /PRIMARY\s+KEY/i.test(colItem) || (meta.pk || []).indexOf(lc) !== -1,
                            fk: /REFERENCES/i.test(colItem) || Boolean(meta.fk && meta.fk[lc])
                        };
                    }
                    var objName = (colItem && colItem.name) || '';
                    var objLc = objName.toLowerCase();
                    return {
                        name: objName,
                        type: (colItem && colItem.type) || 'TEXT',
                        pk: Boolean((colItem && colItem.pk) || (meta.pk || []).indexOf(objLc) !== -1),
                        fk: Boolean((colItem && colItem.fk) || (meta.fk && meta.fk[objLc]))
                    };
                });
                out.push({ name: t.name, columns: cols });
            });
        });
        return out;
    }

    /**
     * Enhances a <textarea> into a live syntax-highlighted SQL IDE (CodeMirror 6 when loaded in browser,
     * with lightweight accessible DOM fallback for headless/Node validation).
     */
    function enhanceTextareaToIde(textarea, options) {
        if (!textarea || typeof document === 'undefined') return null;
        options = options || {};
        if (textarea._sqlIdeInstance) {
            if (options.onRun) textarea._sqlIdeInstance.onRun = options.onRun;
            if (typeof textarea._sqlIdeInstance.sync === 'function') textarea._sqlIdeInstance.sync();
            return textarea._sqlIdeInstance;
        }

        if (root.SqlCodeMirror && typeof root.SqlCodeMirror.enhanceTextarea === 'function') {
            var schemaTables = buildSchemaTablesForEditor(options.datasetId || '__unified__');
            var dialect = (getEngine() && typeof getEngine().getEngineMode === 'function')
                ? getEngine().getEngineMode()
                : 'sqlite';
            var cmCtrl = root.SqlCodeMirror.enhanceTextarea(textarea, {
                dialect: dialect,
                schema: schemaTables,
                onRun: options.onRun || null,
                ariaLabel: options.ariaLabel || textarea.getAttribute('aria-label') || 'SQL query editor'
            });
            if (cmCtrl) return cmCtrl;
        }

        var shell = document.createElement('div');
        shell.className = 'sql-ide-shell';

        var gutter = document.createElement('div');
        gutter.className = 'sql-ide-gutter';
        gutter.setAttribute('aria-hidden', 'true');

        var stage = document.createElement('div');
        stage.className = 'sql-ide-stage';

        var backdrop = document.createElement('pre');
        backdrop.className = 'sql-ide-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');

        var highlightCode = document.createElement('code');
        highlightCode.className = 'sql-ide-highlight';
        backdrop.appendChild(highlightCode);

        var parent = textarea.parentNode;
        if (parent) {
            parent.insertBefore(shell, textarea);
        }
        textarea.classList.add('sql-ide-textarea');
        stage.appendChild(backdrop);
        stage.appendChild(textarea);
        shell.appendChild(gutter);
        shell.appendChild(stage);

        var lastLineCount = -1;
        function sync() {
            var val = textarea.value || '';
            var lines = val.split('\n');
            var count = Math.max(1, lines.length);
            if (count !== lastLineCount) {
                var numsHtml = '';
                for (var ln = 1; ln <= count; ln++) {
                    numsHtml += '<span class="sql-ide-line-num">' + ln + '</span>';
                }
                gutter.innerHTML = numsHtml;
                lastLineCount = count;
            }
            highlightCode.innerHTML = highlightSql(val) + (val.endsWith('\n') ? '\n ' : '');
            backdrop.scrollTop = textarea.scrollTop;
            backdrop.scrollLeft = textarea.scrollLeft;
            gutter.scrollTop = textarea.scrollTop;
        }

        // Hook .value setter on the textarea instance so programmatic textarea.value = ... auto-syncs
        try {
            var proto = typeof HTMLTextAreaElement !== 'undefined' ? HTMLTextAreaElement.prototype : Object.getPrototypeOf(textarea);
            var desc = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
            if (desc && desc.get && desc.set) {
                Object.defineProperty(textarea, 'value', {
                    configurable: true,
                    enumerable: true,
                    get: function () {
                        return desc.get.call(this);
                    },
                    set: function (v) {
                        desc.set.call(this, v);
                        sync();
                    }
                });
            }
        } catch (e) {}

        var instance = {
            shell: shell,
            gutter: gutter,
            backdrop: backdrop,
            highlightCode: highlightCode,
            textarea: textarea,
            onRun: options.onRun || null,
            sync: sync,
            setError: function () {},
            clearError: function () {},
            setSchema: function () {},
            focus: function () { try { textarea.focus(); } catch (e) {} }
        };

        textarea.addEventListener('input', sync);
        textarea.addEventListener('change', sync);
        textarea.addEventListener('scroll', function () {
            backdrop.scrollTop = textarea.scrollTop;
            backdrop.scrollLeft = textarea.scrollLeft;
            gutter.scrollTop = textarea.scrollTop;
        });

        textarea.addEventListener('keydown', function (ev) {
            if (ev.key === 'Tab') {
                ev.preventDefault();
                var start = textarea.selectionStart || 0;
                var end = textarea.selectionEnd || 0;
                var current = textarea.value || '';
                if (!ev.shiftKey) {
                    textarea.value = current.slice(0, start) + '  ' + current.slice(end);
                    textarea.selectionStart = textarea.selectionEnd = start + 2;
                } else {
                    var lineStart = current.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
                    var prefix = current.slice(lineStart, lineStart + 2);
                    var removeCount = prefix === '  ' ? 2 : (prefix.charAt(0) === ' ' || prefix.charAt(0) === '\t' ? 1 : 0);
                    if (removeCount > 0) {
                        textarea.value = current.slice(0, lineStart) + current.slice(lineStart + removeCount);
                        textarea.selectionStart = Math.max(lineStart, start - removeCount);
                        textarea.selectionEnd = Math.max(lineStart, end - removeCount);
                    }
                }
                sync();
                try {
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                } catch (e) {}
                return;
            }
            if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
                if (typeof instance.onRun === 'function') {
                    ev.preventDefault();
                    instance.onRun(textarea.value);
                }
            }
        });

        textarea._sqlIdeInstance = instance;
        textarea._syncSqlIde = sync;
        sync();
        return instance;
    }

    // --- Saved Queries & Query History Persistence ---
    var SAVED_QUERIES_KEY = 'sql_in_depth_saved_queries_v1';
    var QUERY_HISTORY_KEY = 'sql_in_depth_query_history_v1';
    var _memStore = {};

    function readStorageJson(key, fallback) {
        try {
            if (root.localStorage && typeof root.localStorage.getItem === 'function') {
                var raw = root.localStorage.getItem(key);
                if (raw) {
                    var parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) return parsed;
                }
            }
        } catch (e) {}
        return Array.isArray(_memStore[key]) ? _memStore[key].slice() : (fallback || []);
    }

    function writeStorageJson(key, arr) {
        var safeArr = Array.isArray(arr) ? arr : [];
        _memStore[key] = safeArr.slice();
        try {
            if (root.localStorage && typeof root.localStorage.setItem === 'function') {
                root.localStorage.setItem(key, JSON.stringify(safeArr));
            }
        } catch (e) {}
        return safeArr;
    }

    function getSavedQueries() {
        return readStorageJson(SAVED_QUERIES_KEY, []);
    }

    function saveQuery(titleOrObj, sql, datasetId) {
        var rawTitle = titleOrObj;
        var rawSql = sql;
        var rawDs = datasetId;
        if (titleOrObj && typeof titleOrObj === 'object' && !Array.isArray(titleOrObj)) {
            rawTitle = titleOrObj.title || titleOrObj.name || '';
            rawSql = titleOrObj.sql || titleOrObj.query || '';
            rawDs = titleOrObj.datasetId || titleOrObj.dataset || '';
        }
        var cleanSql = String(rawSql || '').trim();
        var cleanTitle = String(rawTitle || '').trim() || ('Query (' + (rawDs || 'ecommerce') + ')');
        var cleanDs = String(rawDs || inferDatasetFromSql(cleanSql) || 'ecommerce');
        var list = getSavedQueries();
        var entry = {
            id: 'sq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            title: cleanTitle,
            sql: cleanSql,
            datasetId: cleanDs,
            createdAt: new Date().toISOString()
        };
        list.unshift(entry);
        writeStorageJson(SAVED_QUERIES_KEY, list);
        return entry;
    }

    function deleteSavedQuery(id) {
        var list = getSavedQueries().filter(function (item) {
            return item && item.id !== id;
        });
        return writeStorageJson(SAVED_QUERIES_KEY, list);
    }

    function getQueryHistory() {
        return readStorageJson(QUERY_HISTORY_KEY, []);
    }

    function recordQueryHistory(sqlOrObj, datasetId) {
        var rawSql = sqlOrObj;
        var rawDs = datasetId;
        if (sqlOrObj && typeof sqlOrObj === 'object' && !Array.isArray(sqlOrObj)) {
            rawSql = sqlOrObj.sql || sqlOrObj.query || '';
            rawDs = sqlOrObj.datasetId || sqlOrObj.dataset || '';
        }
        var cleanSql = String(rawSql || '').trim();
        if (!cleanSql) return getQueryHistory();
        var cleanDs = String(rawDs || inferDatasetFromSql(cleanSql) || 'ecommerce');
        var list = getQueryHistory().filter(function (item) {
            return item && item.sql !== cleanSql;
        });
        var entry = {
            id: 'qh_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            sql: cleanSql,
            datasetId: cleanDs,
            executedAt: new Date().toISOString()
        };
        list.unshift(entry);
        if (list.length > 30) {
            list = list.slice(0, 30);
        }
        writeStorageJson(QUERY_HISTORY_KEY, list);
        return entry;
    }

    function clearQueryHistory() {
        return writeStorageJson(QUERY_HISTORY_KEY, []);
    }

    // --- Multi-Format Export (.sql, .csv, .json) ---
    function serializeCsvCell(val) {
        if (val === null || val === undefined) return '';
        var str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (/[",\r\n]/.test(str)) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    function serializeCsv(columns, rows) {
        var cols = Array.isArray(columns) ? columns : [];
        var dataRows = Array.isArray(rows) ? rows : [];
        var lines = [];
        if (cols.length > 0) {
            lines.push(cols.map(serializeCsvCell).join(','));
        }
        dataRows.forEach(function (row) {
            if (Array.isArray(row)) {
                lines.push(row.map(serializeCsvCell).join(','));
            } else if (row && typeof row === 'object') {
                lines.push(cols.map(function (c) { return serializeCsvCell(row[c]); }).join(','));
            }
        });
        return lines.join('\n');
    }

    function serializeJson(columns, rows) {
        var cols = Array.isArray(columns) ? columns : [];
        var dataRows = Array.isArray(rows) ? rows : [];
        var objects = dataRows.map(function (row) {
            if (row && !Array.isArray(row) && typeof row === 'object') {
                return row;
            }
            var obj = {};
            cols.forEach(function (colName, idx) {
                var v = Array.isArray(row) ? row[idx] : undefined;
                obj[colName] = v === undefined ? null : v;
            });
            return obj;
        });
        return JSON.stringify(objects, null, 2);
    }

    function triggerDownload(content, filename, mimeType) {
        try {
            if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
                var blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = filename || 'export.txt';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(function () {
                    try { URL.revokeObjectURL(url); } catch (e) {}
                }, 250);
            }
        } catch (e) {}
        return content;
    }

    function exportSql(sql, filename) {
        var content = String(sql || '');
        return triggerDownload(content, filename || 'query.sql', 'application/sql;charset=utf-8');
    }

    function exportCsv(columns, rows, filename) {
        var content = serializeCsv(columns, rows);
        return triggerDownload(content, filename || 'results.csv', 'text/csv;charset=utf-8');
    }

    function exportJson(columns, rows, filename) {
        var content = serializeJson(columns, rows);
        return triggerDownload(content, filename || 'results.json', 'application/json;charset=utf-8');
    }

    function copySqlToClipboard(sql, buttonEl) {
        var text = String(sql || '');
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(text).catch(function () {});
            }
        } catch (e) {}
        if (buttonEl) {
            var orig = buttonEl.textContent;
            buttonEl.textContent = '✓ Copied!';
            setTimeout(function () {
                buttonEl.textContent = orig;
            }, 1200);
        }
        return text;
    }

    // --- Interactive SQL Clause Practice Chips ---
    var SQL_PRACTICE_CHIPS = [
        { id: 'select', label: 'SELECT', clause: 'SELECT', snippet: 'SELECT customer_id, name, tier\nFROM customers\nLIMIT 10;' },
        { id: 'where', label: 'WHERE', clause: 'WHERE', snippet: "SELECT order_id, customer_id, status, total_cents\nFROM orders\nWHERE status = 'completed'\n  AND total_cents >= 50000;" },
        { id: 'inner_join', label: 'INNER JOIN', clause: 'INNER JOIN', snippet: 'SELECT c.customer_id, c.name, o.order_id, o.total_cents\nFROM customers c\nINNER JOIN orders o ON o.customer_id = c.customer_id;' },
        { id: 'left_join', label: 'LEFT JOIN', clause: 'LEFT JOIN', snippet: 'SELECT c.customer_id, c.name, o.order_id, o.status\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.customer_id;' },
        { id: 'group_by', label: 'GROUP BY', clause: 'GROUP BY', snippet: 'SELECT tier, COUNT(*) AS customer_count\nFROM customers\nGROUP BY 1\nORDER BY 2 DESC;' },
        { id: 'having', label: 'HAVING', clause: 'HAVING', snippet: 'SELECT customer_id, COUNT(*) AS order_count\nFROM orders\nGROUP BY customer_id\nHAVING COUNT(*) > 1;' },
        { id: 'window_over', label: 'WINDOW OVER', clause: 'WINDOW OVER', snippet: 'SELECT emp_id, name, dept_id, salary_usd,\n       ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary_usd DESC) AS dept_rank\nFROM employees;' },
        { id: 'with_cte', label: 'WITH CTE', clause: 'WITH CTE', snippet: 'WITH summary_cte AS (\n  SELECT customer_id, SUM(total_cents) AS total_spent\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT * FROM summary_cte;' },
        { id: 'exists', label: 'EXISTS', clause: 'EXISTS', snippet: 'SELECT c.customer_id, c.name, c.tier\nFROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id\n);' },
        { id: 'case_when', label: 'CASE WHEN', clause: 'CASE WHEN', snippet: "SELECT order_id, total_cents,\n       CASE\n         WHEN total_cents >= 80000 THEN 'high'\n         WHEN total_cents >= 30000 THEN 'medium'\n         ELSE 'low'\n       END AS spend_tier\nFROM orders;" },
        { id: 'upsert', label: 'UPSERT', clause: 'UPSERT', snippet: "INSERT INTO categories (category_id, name)\nVALUES (10, 'Hardware')\nON CONFLICT (category_id) DO UPDATE SET name = EXCLUDED.name;" },
        { id: 'explain', label: 'EXPLAIN', clause: 'EXPLAIN', snippet: 'EXPLAIN SELECT * FROM orders WHERE customer_id = 1;' }
    ];

    function toBase64UrlUtf8(str) {
        var raw = String(str || '');
        try {
            if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
                return Buffer.from(raw, 'utf8').toString('base64')
                    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }
            if (typeof TextEncoder !== 'undefined' && typeof btoa === 'function') {
                var bytes = new TextEncoder().encode(raw);
                var bin = '';
                for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
                return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            }
        } catch (e) {}
        return encodeURIComponent(raw);
    }

    function fromBase64UrlUtf8(encoded) {
        var norm = String(encoded || '').trim();
        if (!norm) return '';
        try {
            var b64 = norm.replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4 !== 0) b64 += '=';
            if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
                return Buffer.from(b64, 'base64').toString('utf8');
            }
            if (typeof TextDecoder !== 'undefined' && typeof atob === 'function') {
                var bin = atob(b64);
                var bytes = new Uint8Array(bin.length);
                for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return new TextDecoder().decode(bytes);
            }
        } catch (e) {}
        try { return decodeURIComponent(norm); } catch (e2) { return ''; }
    }

    function encodeShareableQuery(payload) {
        var obj = typeof payload === 'string'
            ? { s: payload }
            : {
                s: String((payload && payload.sql) || ''),
                d: (payload && payload.datasetId) || '',
                e: (payload && payload.engine) || ''
            };
        return toBase64UrlUtf8(JSON.stringify(obj));
    }

    function decodeShareableQuery(searchOrToken) {
        var raw = String(searchOrToken || '').trim();
        if (!raw) return null;
        if (raw.charAt(0) === '?' || raw.indexOf('=') !== -1) {
            try {
                var params = new URLSearchParams(raw.charAt(0) === '?' ? raw : ('?' + raw));
                var qToken = params.get('q');
                var rawSqlParam = params.get('sql');
                var dsParam = params.get('ds') || params.get('dataset') || '';
                var engParam = params.get('eng') || params.get('engine') || '';
                if (qToken) {
                    var decoded = fromBase64UrlUtf8(qToken);
                    if (decoded) {
                        try {
                            var parsed = JSON.parse(decoded);
                            if (parsed && typeof parsed.s === 'string') {
                                return {
                                    sql: parsed.s,
                                    datasetId: parsed.d || dsParam || '__unified__',
                                    engine: parsed.e || engParam || ''
                                };
                            }
                        } catch (jsonErr) {
                            return { sql: decoded, datasetId: dsParam || '__unified__', engine: engParam || '' };
                        }
                    }
                }
                if (rawSqlParam) {
                    return { sql: rawSqlParam, datasetId: dsParam || '__unified__', engine: engParam || '' };
                }
            } catch (e) {}
            return null;
        }
        var direct = fromBase64UrlUtf8(raw);
        if (!direct) return null;
        try {
            var obj = JSON.parse(direct);
            if (obj && typeof obj.s === 'string') {
                return { sql: obj.s, datasetId: obj.d || '__unified__', engine: obj.e || '' };
            }
        } catch (e2) {}
        return { sql: direct, datasetId: '__unified__', engine: '' };
    }

    function buildShareableQueryUrl(opts) {
        opts = opts || {};
        var token = encodeShareableQuery({
            sql: opts.sql || '',
            datasetId: opts.datasetId || '__unified__',
            engine: opts.engine || ((getEngine() && getEngine().getEngineMode) ? getEngine().getEngineMode() : 'sqlite')
        });
        var origin = (root.location && root.location.origin && root.location.origin !== 'null')
            ? root.location.origin
            : 'https://sql-in-depth.vedgupta.in';
        return origin + '/sandbox/?q=' + token;
    }

    function shareSqlQueryLink(opts, buttonEl) {
        var shareUrl = buildShareableQueryUrl(opts);
        if (root.App && typeof root.App.sharePageUrl === 'function') {
            root.App.sharePageUrl({
                title: (opts && opts.title) || 'Runnable SQL Query — SQL in Depth',
                text: 'Run and step through this SQL query in your browser:',
                url: shareUrl
            });
        } else {
            copySqlToClipboard(shareUrl, null);
        }
        if (buttonEl) {
            var orig = buttonEl.textContent;
            buttonEl.textContent = '✓ Link Copied';
            setTimeout(function () { buttonEl.textContent = orig; }, 1400);
        }
        return shareUrl;
    }

    function insertSqlSnippet(textarea, snippet) {
        if (!textarea || snippet === null || snippet === undefined) return '';
        if (textarea._sqlIdeInstance && typeof textarea._sqlIdeInstance.insertSnippet === 'function') {
            textarea._sqlIdeInstance.insertSnippet(snippet);
            try {
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (e) {}
            return textarea.value || '';
        }
        var text = String(snippet);
        var current = textarea.value || '';
        var start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : current.length;
        var end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : current.length;
        var before = current.slice(0, start);
        var after = current.slice(end);
        var needLeadingSpace = before.length > 0 && !/[\s(,\n]$/.test(before) && !/^[,);\s]/.test(text);
        var prefix = needLeadingSpace ? (text.indexOf('\n') !== -1 ? '\n' : ' ') : '';
        var nextVal = before + prefix + text + after;
        textarea.value = nextVal;
        var nextCursor = before.length + prefix.length + text.length;
        try {
            textarea.selectionStart = textarea.selectionEnd = nextCursor;
            textarea.focus();
        } catch (e) {}
        if (typeof textarea._syncSqlIde === 'function') {
            textarea._syncSqlIde();
        }
        try {
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (e) {}
        return nextVal;
    }

    function buildSavedAndHistorySelectOptionsHtml() {
        var saved = getSavedQueries();
        var history = getQueryHistory();
        var html = '<option value="">Saved (' + saved.length + ') &amp; History (' + history.length + ')</option>';
        if (saved.length > 0) {
            html += '<optgroup label="Saved Queries">';
            saved.forEach(function (item) {
                html += '<option value="saved:' + escapeHtml(item.id) + '">' + escapeHtml(item.title) + ' [' + escapeHtml(item.datasetId) + ']</option>';
            });
            html += '</optgroup>';
        }
        if (history.length > 0) {
            html += '<optgroup label="Recent Query History">';
            history.slice(0, 15).forEach(function (item, idx) {
                var oneLine = String(item.sql || '').replace(/\s+/g, ' ').slice(0, 56);
                html += '<option value="history:' + escapeHtml(item.id) + '">' + (idx + 1) + '. ' + escapeHtml(oneLine) + ' [' + escapeHtml(item.datasetId) + ']</option>';
            });
            html += '</optgroup>';
        }
        return html;
    }

    /**
     * Return table names for a given datasetId, or all 26 table names across all datasets
     * when datasetId === '__unified__' or not a specific single dataset.
     */
    function getDatasetTableNames(datasetId) {
        var datasets = getDatasets();
        if (!datasetId || datasetId === '__unified__' || !datasets[datasetId]) {
            var allNames = [];
            var seen = {};
            Object.keys(datasets).forEach(function (dsKey) {
                var ds = datasets[dsKey];
                if (ds && Array.isArray(ds.tables)) {
                    ds.tables.forEach(function (t) {
                        if (t && t.name && !seen[t.name]) {
                            seen[t.name] = true;
                            allNames.push(t.name);
                        }
                    });
                }
            });
            if (allNames.length > 0) return allNames;
            return Object.keys(SCHEMA_META);
        }
        var targetDs = datasets[datasetId];
        if (!targetDs || !Array.isArray(targetDs.tables)) return [];
        return targetDs.tables.map(function (t) { return t.name; });
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
     * Strip trailing AS <alias> (or bare identifier alias) from a single SELECT projection item
     */
    function stripSelectAlias(selectItem) {
        var s = String(selectItem || '').trim();
        if (!s) return s;
        // Strip explicit AS alias at the end (top-level)
        var depth = 0;
        var inSingle = false;
        var inDouble = false;
        var lastAsPos = -1;
        var upper = s.toUpperCase();
        for (var i = 0; i < s.length; i++) {
            var ch = s[i];
            if (ch === "'" && !inDouble && s[i - 1] !== '\\') {
                inSingle = !inSingle;
                continue;
            }
            if (ch === '"' && !inSingle && s[i - 1] !== '\\') {
                inDouble = !inDouble;
                continue;
            }
            if (inSingle || inDouble) continue;
            if (ch === '(') depth++;
            else if (ch === ')') depth = Math.max(0, depth - 1);
            else if (depth === 0) {
                if (upper.slice(i, i + 2) === 'AS' && (i === 0 || /[\s)]/.test(s[i - 1])) && /[\s"']/.test(s[i + 2] || '')) {
                    lastAsPos = i;
                }
            }
        }
        if (lastAsPos > 0) {
            return s.slice(0, lastAsPos).trim();
        }
        return s;
    }

    /**
     * Strip ROLLUP(...), CUBE(...), GROUPING SETS(...) wrappers from a GROUP BY expression
     * and resolve any positional integer ordinals (e.g. GROUP BY 1, 2) against SELECT projections
     * so we can safely project the underlying columns in Step 4 (`SELECT <cols>, COUNT(*) ...`).
     */
    function stripGroupingWrappers(groupExpr, selectClause) {
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
        var selectItems = selectClause ? splitTopLevelCommas(selectClause) : [];
        var parts = s.split(',').map(function (p) { return p.trim(); }).filter(Boolean).map(function (p) {
            if (/^\d+$/.test(p)) {
                var ord = parseInt(p, 10);
                if (ord >= 1 && ord <= selectItems.length) {
                    var resolved = stripSelectAlias(selectItems[ord - 1]);
                    if (resolved && resolved !== '*') return resolved;
                }
            }
            return p;
        });
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
        var trimmed = String(sql || '').trim().replace(/;+\s*$/, '');
        var cleanedTrim = trimmed
            .replace(/--[^\n]*/g, function (m) { return ' '.repeat(m.length); })
            .replace(/\/\*[\s\S]*?\*\//g, function (m) { return ' '.repeat(m.length); });

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
            var whereRemovedSql = withPrefix + 'SELECT *, CASE WHEN NOT (' + parsed.where + ') THEN \'✗ FALSE (Pruned)\' ELSE \'∅ UNKNOWN / NULL (Pruned)\' END AS "__verdict__" FROM ' + parsed.from + ' WHERE NOT (' + parsed.where + ') OR (' + parsed.where + ') IS NULL LIMIT 6';
            var matchedRes = await getEngine().execute(whereMatchedSql, dsId);
            var removedRes = await getEngine().execute(whereRemovedSql, dsId);
            if (removedRes.error) {
                var fallbackRemovedSql = withPrefix + 'SELECT * FROM ' + parsed.from + ' WHERE NOT (' + parsed.where + ') OR (' + parsed.where + ') IS NULL LIMIT 6';
                removedRes = await getEngine().execute(fallbackRemovedSql, dsId);
            }

            if (!matchedRes.error && matchedRes.columns.length > 0) {
                var combinedRows = [];
                var rowStates = [];
                var colCount = matchedRes.columns.length;
                var keptRows = matchedRes.rows.slice(0, 10);
                keptRows.forEach(function (r) {
                    combinedRows.push(r.concat(['✓ TRUE (Kept)']));
                    rowStates.push('matched');
                });
                if (!removedRes.error && removedRes.rows.length > 0) {
                    var hasSqlVerdict = removedRes.columns && removedRes.columns[removedRes.columns.length - 1] === '__verdict__';
                    removedRes.rows.slice(0, 5).forEach(function (r) {
                        var dataCells = hasSqlVerdict ? r.slice(0, colCount) : r;
                        var verdict = hasSqlVerdict
                            ? r[r.length - 1]
                            : (dataCells.some(function (c) { return c === null; }) ? '∅ UNKNOWN / NULL (Pruned)' : '✗ FALSE (Pruned)');
                        combinedRows.push(dataCells.concat([verdict]));
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
            var safeProjectionCols = stripGroupingWrappers(parsed.groupBy, parsed.select);
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

        // ─── STEP 7: ORDER BY + LIMIT ───
        if ((parsed.orderBy || parsed.limit) && !finalRes.error) {
            var orderLimitRows = finalRes.rows.slice(0, 20);
            var orderLimitStates = orderLimitRows.map(function () { return 'matched'; });

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
                    (parsed.limit ? 'slices the top `' + parsed.limit + '` rows.' : '.'),
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

        steps.forEach(function (st) {
            if (!st.sourceTables) {
                st.sourceTables = st.tableName ? [st.tableName] : sourceTables;
            }
        });

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
    function renderStepTable(step, datasetId, sortState) {
        // Step 0 multi-table view
        if (step.subTables && step.subTables.length > 0) {
            return '<div class="sql-subtables-grid">' +
                step.subTables.map(renderSubTableCard).join('') +
            '</div>';
        }

        if (!step || !step.columns || step.columns.length === 0) {
            var isReadQuery = /^\s*(?:--[^\n]*\n|\s|\/\*[\s\S]*?\*\/)*(SELECT|WITH|VALUES)\b/i.test(String((step && step.code) || ''));
            return '<div class="sql-viz-empty">' + (isReadQuery ? '0 rows returned — query matched no rows.' : 'Statement executed successfully (0 columns returned).') + '</div>';
        }

        var activeTables = [];
        if (Array.isArray(step.sourceTables) && step.sourceTables.length > 0) {
            activeTables = step.sourceTables;
        } else if (step.tableName) {
            activeTables = [step.tableName];
        } else if (step.code) {
            activeTables = extractSourceTables(step.code);
        }
        if (!activeTables || activeTables.length === 0) {
            activeTables = getDatasetTableNames(datasetId);
        }

        var pkSet = {};
        var pkOwner = {};
        var fkMap = {};
        activeTables.forEach(function (tblName) {
            var tbl = String(tblName || '').toLowerCase();
            var meta = SCHEMA_META[tbl];
            if (!meta) return;
            (meta.pk || []).forEach(function (col) {
                var lc = col.toLowerCase();
                pkSet[lc] = true;
                if (!pkOwner[lc]) pkOwner[lc] = tbl;
            });
        });
        activeTables.forEach(function (tblName) {
            var tbl = String(tblName || '').toLowerCase();
            var meta = SCHEMA_META[tbl];
            if (!meta || !meta.fk) return;
            Object.keys(meta.fk).forEach(function (col) {
                var lc = col.toLowerCase();
                var target = meta.fk[col];
                // Do not let a child table's FK (e.g. orders.customer_id -> customers.customer_id)
                // badge the parent PK column (customers.customer_id) as an FK to itself.
                if (pkSet[lc] && pkOwner[lc] && String(target).toLowerCase() === pkOwner[lc] + '.' + lc) {
                    return;
                }
                fkMap[lc] = target;
            });
        });

        var highlightSet = {};
        (step.highlightCols || []).forEach(function (c) { highlightSet[String(c).toLowerCase()] = true; });

        var hasRowStateBadges = (step.rowStates || []).some(function (s) {
            return s === 'matched' || s === 'filtered' || s === 'null-padded' ||
                   s === 'cte-anchor' || s === 'cte-recursive' ||
                   s === 'inserted' || s === 'updated' || s === 'deleted';
        });

        var activeSortCol = (sortState && typeof sortState.colIdx === 'number') ? sortState.colIdx : -1;
        var activeSortDir = (sortState && sortState.dir) ? sortState.dir : 'none';

        var sortCollator = (typeof Intl !== 'undefined' && Intl.Collator)
            ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
            : null;
        var html = '<div class="sql-step-table-scroll" role="region" aria-label="SQL step result table" tabindex="0">' +
            '<div class="sr-only-status" role="status"></div>' +
            '<table class="sql-step-table">';
        html += '<thead><tr>';
        if (hasRowStateBadges) {
            html += '<th scope="col" class="sql-row-state-th">Row State</th>';
        }
        step.columns.forEach(function (col, colIdx) {
            var lowerCol = String(col).toLowerCase();
            var isPk = pkSet[lowerCol];
            var fkTarget = fkMap[lowerCol];
            var isHighlighted = highlightSet[lowerCol];
            var ariaSort = (activeSortCol === colIdx && activeSortDir !== 'none')
                ? (activeSortDir === 'asc' ? 'ascending' : 'descending')
                : '';
            var sortIndicator = ariaSort === 'ascending' ? '↑' : (ariaSort === 'descending' ? '↓' : '↕');
            var ariaSortAttr = ariaSort ? (' aria-sort="' + ariaSort + '"') : '';
            html += '<th scope="col"' + ariaSortAttr + ' class="' + (isHighlighted ? 'is-highlighted-col' : '') + '">';
            html += '<button type="button" class="sql-sort-btn" data-sort-col="' + colIdx + '">';
            html += '<span class="sql-th-inner">';
            html += '<span>' + escapeHtml(col) + '</span>';
            if (isPk) {
                html += '<span class="sql-col-key-badge is-pk" title="Primary Key">PK</span>';
            }
            if (fkTarget) {
                html += '<span class="sql-col-key-badge is-fk" title="Foreign Key → ' + escapeHtml(fkTarget) + '">FK</span>';
            }
            html += '<span class="sql-sort-glyph" aria-hidden="true">' + sortIndicator + '</span>';
            html += '</span></button></th>';
        });
        html += '</tr></thead><tbody>';

        if (!step.rows || step.rows.length === 0) {
            html += '<tr><td colspan="' + (step.columns.length + (hasRowStateBadges ? 1 : 0)) + '" class="sql-empty-row-cell">0 rows matched this step</td></tr>';
        } else {
            var indexedRows = step.rows.map(function (row, rIdx) {
                return { row: row, origIdx: rIdx };
            });
            if (activeSortCol >= 0 && activeSortDir !== 'none') {
                indexedRows.sort(function (a, b) {
                    var va = a.row[activeSortCol];
                    var vb = b.row[activeSortCol];
                    var aNull = (va === null || va === undefined);
                    var bNull = (vb === null || vb === undefined);
                    if (aNull && bNull) return a.origIdx - b.origIdx;
                    if (aNull) return 1; // NULLS LAST
                    if (bNull) return -1;
                    var na = typeof va === 'number' ? va : (typeof va === 'string' && va.trim() !== '' && !isNaN(Number(va)) ? Number(va) : NaN);
                    var nb = typeof vb === 'number' ? vb : (typeof vb === 'string' && vb.trim() !== '' && !isNaN(Number(vb)) ? Number(vb) : NaN);
                    var cmp = (!isNaN(na) && !isNaN(nb))
                        ? (na - nb)
                        : (sortCollator ? sortCollator.compare(String(va), String(vb)) : String(va).localeCompare(String(vb)));
                    if (cmp === 0) return a.origIdx - b.origIdx;
                    return activeSortDir === 'desc' ? -cmp : cmp;
                });
            }
            indexedRows.forEach(function (entry) {
                var row = entry.row;
                var rIdx = entry.origIdx;
                var state = (step.rowStates && step.rowStates[rIdx]) || 'normal';
                var rowDiffs = (step.cellDiffs && step.cellDiffs[rIdx]) || null;
                html += '<tr class="sql-step-tr is-' + escapeHtml(state) + '" data-orig-idx="' + rIdx + '">';
                if (hasRowStateBadges) {
                    var badgeHtml = '';
                    if (state === 'matched') {
                        badgeHtml = '<span class="sql-row-badge is-kept">✓ Kept</span>';
                    } else if (state === 'filtered') {
                        badgeHtml = '<span class="sql-row-badge is-pruned">' + (step.isLimitStep ? '✗ Sliced by LIMIT' : '✗ Pruned') + '</span>';
                    } else if (state === 'null-padded') {
                        badgeHtml = '<span class="sql-row-badge is-null-padded">Ø NULL-padded</span>';
                    } else if (state === 'cte-anchor') {
                        badgeHtml = '<span class="sql-row-badge is-cte-anchor">Anchor (Iter 0)</span>';
                    } else if (state === 'cte-recursive') {
                        badgeHtml = '<span class="sql-row-badge is-cte-recursive">Recursive Step</span>';
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
     * Render EXPLAIN QUERY PLAN hierarchical visual operator tree
     */
    function renderExplainPlan(plan) {
        if (!plan || plan.length === 0) return '';
        var engineLabel = (getEngine() && getEngine().getEngineLabel) ? getEngine().getEngineLabel() : 'SQL Engine';
        var nodeById = {};
        plan.forEach(function (n) { nodeById[String(n.id)] = n; });
        function computeDepth(n) {
            var d = 0;
            var cur = n;
            var guard = 0;
            while (cur && cur.parent && nodeById[String(cur.parent)] && guard < 16) {
                d++;
                cur = nodeById[String(cur.parent)];
                guard++;
            }
            return d;
        }
        var hasFullScan = false;
        var fullScanTable = '';
        var html = '<div class="sql-explain-box">';
        html += '<div class="sql-explain-header">' +
            '<div class="sql-explain-title">Physical Execution Plan (' + escapeHtml(engineLabel) + ')</div>' +
            '<div class="sql-explain-legend">' +
                '<span class="sql-explain-pill is-index">B-Tree Index Seek</span>' +
                '<span class="sql-explain-pill is-scan">Sequential / Full Scan</span>' +
                '<span class="sql-explain-pill is-temp">Sort / Hash / Aggregate</span>' +
            '</div>' +
        '</div>';
        html += '<div class="sql-explain-tree" role="list">';
        plan.forEach(function (node) {
            var detail = String(node.detail || '');
            var isCovering = /COVERING\s+INDEX|INDEX\s+ONLY\s+SCAN/i.test(detail);
            var isIndex = isCovering || /USING.*INDEX|INDEX\s+SCAN|BITMAP\s+INDEX|PRIMARY\s+KEY/i.test(detail);
            var isScan = /\b(?:SCAN|SEQ\s+SCAN)\b/i.test(detail) && !isIndex && !/SUBQUERY|CONSTANT/i.test(detail);
            var isTemp = /TEMP\s+B-TREE|SORT|AGGREGATE|HASH|GROUP/i.test(detail);
            var cls = isIndex ? 'is-index' : (isScan ? 'is-scan' : (isTemp ? 'is-temp' : ''));
            var badgeText = isCovering
                ? 'COVERING INDEX'
                : (isIndex ? 'INDEX SEEK' : (isScan ? 'FULL SCAN' : (isTemp ? 'MATERIALIZE / SORT' : 'OPERATOR')));
            if (isScan && !hasFullScan) {
                hasFullScan = true;
                var tblM = detail.match(/\bSCAN\s+(?:TABLE\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/i) || detail.match(/Seq\s+Scan\s+on\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
                if (tblM && tblM[1]) fullScanTable = tblM[1];
            }
            var depth = computeDepth(node);
            var indentPx = Math.min(depth * 18, 90);
            html += '<div class="sql-explain-node ' + cls + '" role="listitem" style="margin-left:' + indentPx + 'px;">' +
                (depth > 0 ? '<span class="sql-explain-branch" aria-hidden="true">↳</span>' : '') +
                '<span class="sql-explain-node-id">#' + escapeHtml(node.id) + '</span>' +
                '<span class="sql-explain-op-badge ' + cls + '">' + badgeText + '</span>' +
                '<span class="sql-explain-node-detail">' + escapeHtml(detail) + '</span>' +
            '</div>';
        });
        html += '</div>';
        if (hasFullScan) {
            html += '<div class="sql-explain-advisor">' +
                '<strong>Optimizer Note:</strong> Full sequential scan detected' + (fullScanTable ? ' on <code>' + escapeHtml(fullScanTable) + '</code>' : '') + '. ' +
                'On small tables this avoids random I/O, but at production scale ensure filter/join predicates match a SARGable B-Tree index prefix.' +
            '</div>';
        }
        html += '</div>';
        return html;
    }

    function buildEngineSwitchHtml() {
        var mode = (getEngine() && getEngine().getEngineMode) ? getEngine().getEngineMode() : 'postgres';
        var pgReady = (getEngine() && getEngine().isPgliteReady) ? getEngine().isPgliteReady() : false;
        return '<div class="sql-engine-switch" role="group" aria-label="SQL Engine Selector">' +
            '<button type="button" class="sql-engine-btn ' + (mode === 'postgres' ? 'is-active' : '') + '" data-engine-mode="postgres" title="PostgreSQL 18.6 (PGlite WASM)">' +
                '<span class="sql-engine-dot ' + (pgReady ? 'is-ready' : 'is-loading') + '"></span>PG 18' +
            '</button>' +
            '<button type="button" class="sql-engine-btn ' + (mode === 'sqlite' ? 'is-active' : '') + '" data-engine-mode="sqlite" title="SQLite 3.46 (sql.js WASM)">' +
                'SQLite' +
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
            var isInsideModal = Boolean(container && typeof container.closest === 'function' && container.closest('#global-codelab-overlay'));
            var editorOpts = Object.assign({}, options, { showEditor: false, compactHeader: isInsideModal ? true : Boolean(options.compactHeader) });
            var refSql = options.referenceSql || options.solutionSql || sql;
            var dotsSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
            var dbIconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>';
            container.innerHTML =
                '<div class="sql-studio-inline-workbench sql-vscode-workbench">' +
                    '<div class="sql-lab-editor-box sql-vscode-editor-pane">' +
                        '<div class="sql-vscode-bar">' +
                            '<div class="sql-vscode-bar__left">' +
                                '<span class="sql-vscode-tab">' + dbIconSvg + 'query.sql</span>' +
                            '</div>' +
                            '<div class="sql-vscode-bar__right">' +
                                (!options.hideVerify
                                    ? '<button type="button" class="sql-vscode-btn sql-vscode-btn--verify" data-inline-viz-action="verify" title="Verify output against reference SQL">Verify</button>'
                                    : '') +
                                '<button type="button" class="sql-vscode-btn" data-inline-viz-action="step" title="Step through query clauses">Step</button>' +
                                '<button type="button" class="sql-vscode-btn sql-vscode-btn--primary" data-inline-viz-action="run" title="Execute SQL query (⌘↵)">Run <kbd>⌘↵</kbd></button>' +
                                (!isInsideModal && !options.hideStudioBtn
                                    ? '<button type="button" class="sql-vscode-btn" data-inline-viz-action="studio" data-action="open-sql-studio" data-lang="sql" title="Open in full-screen SQL Studio">Studio ↗</button>'
                                    : '') +
                                '<details class="sql-ide-menu studio-menu">' +
                                    '<summary class="sql-vscode-icon-btn" aria-label="Editor actions" title="Format, Copy, Save &amp; Export">' + dotsSvg + '</summary>' +
                                    '<div class="studio-menu__panel sql-studio-saved-panel">' +
                                        '<button type="button" class="studio-menu__item" data-sql-ide-action="format">Format SQL</button>' +
                                        '<button type="button" class="studio-menu__item" data-sql-ide-action="copy">Copy SQL</button>' +
                                        '<button type="button" class="studio-menu__item" data-sql-ide-action="share-query">Copy shareable link</button>' +
                                        '<button type="button" class="studio-menu__item" data-inline-viz-action="explain">Explain query plan</button>' +
                                        '<div class="studio-menu__sep" role="separator"></div>' +
                                        '<span class="studio-label">Saved &amp; History</span>' +
                                        '<select class="studio-select sql-studio-saved-select" data-sql-ide-role="saved-history-select" aria-label="Saved Queries and History">' +
                                            buildSavedAndHistorySelectOptionsHtml() +
                                        '</select>' +
                                        '<div class="studio-menu__row">' +
                                            '<input type="text" class="studio-input" data-sql-ide-role="save-title-input" placeholder="Save query as…" aria-label="Saved query title" />' +
                                            '<button type="button" class="studio-btn studio-btn--sm" data-sql-ide-action="save-query">Save</button>' +
                                        '</div>' +
                                        '<button type="button" class="studio-menu__item" data-sql-ide-action="delete-saved">Delete selected saved query</button>' +
                                        '<div class="studio-menu__sep" role="separator"></div>' +
                                        '<span class="studio-label">Export</span>' +
                                        '<div class="studio-menu__row">' +
                                            '<button type="button" class="studio-btn studio-btn--sm" data-sql-ide-action="export-sql">.sql</button>' +
                                            '<button type="button" class="studio-btn studio-btn--sm" data-sql-ide-action="export-csv">.csv</button>' +
                                            '<button type="button" class="studio-btn studio-btn--sm" data-sql-ide-action="export-json">.json</button>' +
                                        '</div>' +
                                    '</div>' +
                                '</details>' +
                            '</div>' +
                        '</div>' +
                        '<textarea class="sql-live-editor sql-inline-textarea" aria-label="SQL query editor" rows="7" spellcheck="false">' + escapeHtml(sql) + '</textarea>' +
                    '</div>' +
                    '<div class="sql-inline-verify-banner" style="display:none;"></div>' +
                    '<div class="sql-inline-viz-stage"></div>' +
                '</div>';
            var ed = container.querySelector('.sql-live-editor');
            var stage = container.querySelector('.sql-inline-viz-stage');
            var verifyBanner = container.querySelector('.sql-inline-verify-banner');
            var ideMenu = container.querySelector('details.sql-ide-menu');
            var runBtn = container.querySelector('[data-inline-viz-action="run"]');
            var stepBtn = container.querySelector('[data-inline-viz-action="step"]');
            var verifyBtn = container.querySelector('[data-inline-viz-action="verify"]');
            var explainBtn = container.querySelector('[data-inline-viz-action="explain"]');
            var studioBtn = container.querySelector('[data-inline-viz-action="studio"]');
            var formatBtn = container.querySelector('[data-sql-ide-action="format"]');
            var copyBtn = container.querySelector('[data-sql-ide-action="copy"]');
            var shareBtn = container.querySelector('[data-sql-ide-action="share-query"]');
            var saveBtn = container.querySelector('[data-sql-ide-action="save-query"]');
            var deleteSavedBtn = container.querySelector('[data-sql-ide-action="delete-saved"]');
            var saveTitleInput = container.querySelector('[data-sql-ide-role="save-title-input"]');
            var savedHistorySelect = container.querySelector('[data-sql-ide-role="saved-history-select"]');
            var exportSqlBtn = container.querySelector('[data-sql-ide-action="export-sql"]');
            var exportCsvBtn = container.querySelector('[data-sql-ide-action="export-csv"]');
            var exportJsonBtn = container.querySelector('[data-sql-ide-action="export-json"]');
            var editorIdeCtrl = null;

            function closeIdeMenu() {
                if (ideMenu) ideMenu.removeAttribute('open');
            }

            container.addEventListener('click', function (ev) {
                if (ideMenu && ideMenu.hasAttribute('open') && !ideMenu.contains(ev.target)) {
                    ideMenu.removeAttribute('open');
                }
            });

            function refreshSavedDropdown() {
                if (savedHistorySelect) {
                    savedHistorySelect.innerHTML = buildSavedAndHistorySelectOptionsHtml();
                }
            }

            function executeCurrentEditorSql(runOpts) {
                if (verifyBanner) verifyBanner.style.display = 'none';
                var currentSql = ed ? ed.value : sql;
                return mountClauseVisualizer(
                    stage,
                    currentSql,
                    datasetId,
                    Object.assign({}, editorOpts, { ideCtrl: editorIdeCtrl }, runOpts || { startAtFinal: true })
                ).then(function (res) {
                    refreshSavedDropdown();
                    return res;
                });
            }

            if (ed) {
                editorIdeCtrl = enhanceTextareaToIde(ed, {
                    datasetId: datasetId,
                    onRun: function () {
                        executeCurrentEditorSql({ startAtFinal: true });
                    }
                });
            }

            if (formatBtn && ed) {
                formatBtn.addEventListener('click', function () {
                    ed.value = formatSql(ed.value);
                    ed.dispatchEvent(new Event('input', { bubbles: true }));
                    if (typeof ed._syncSqlIde === 'function') ed._syncSqlIde();
                    closeIdeMenu();
                });
            }
            if (copyBtn && ed) {
                copyBtn.addEventListener('click', function () {
                    copySqlToClipboard(ed.value, copyBtn);
                });
            }
            if (shareBtn && ed) {
                shareBtn.addEventListener('click', function () {
                    shareSqlQueryLink({
                        sql: ed.value,
                        datasetId: inferDatasetFromSql(ed.value) || datasetId || '__unified__',
                        title: options.title || 'Runnable SQL Query'
                    }, shareBtn);
                });
            }
            if (saveBtn && ed) {
                saveBtn.addEventListener('click', function () {
                    var titleVal = (saveTitleInput && saveTitleInput.value.trim()) || (options.title ? String(options.title).slice(0, 40) : 'Saved Query');
                    var savedEntry = saveQuery(titleVal, ed.value, datasetId);
                    if (saveTitleInput) saveTitleInput.value = '';
                    refreshSavedDropdown();
                    if (savedHistorySelect && savedEntry) {
                        savedHistorySelect.value = 'saved:' + savedEntry.id;
                    }
                });
            }
            if (deleteSavedBtn && savedHistorySelect) {
                deleteSavedBtn.addEventListener('click', function () {
                    var val = savedHistorySelect.value || '';
                    if (val.indexOf('saved:') === 0) {
                        deleteSavedQuery(val.slice(6));
                        refreshSavedDropdown();
                    }
                });
            }
            if (savedHistorySelect && ed) {
                savedHistorySelect.addEventListener('change', function () {
                    var val = savedHistorySelect.value || '';
                    if (!val) return;
                    var targetItem = null;
                    if (val.indexOf('saved:') === 0) {
                        var sid = val.slice(6);
                        targetItem = getSavedQueries().find(function (q) { return q.id === sid; });
                    } else if (val.indexOf('history:') === 0) {
                        var hid = val.slice(8);
                        targetItem = getQueryHistory().find(function (q) { return q.id === hid; });
                    }
                    if (targetItem && targetItem.sql) {
                        ed.value = targetItem.sql;
                        ed.dispatchEvent(new Event('input', { bubbles: true }));
                        if (typeof ed._syncSqlIde === 'function') ed._syncSqlIde();
                        executeCurrentEditorSql({ startAtFinal: true });
                        closeIdeMenu();
                    }
                });
            }
            if (exportSqlBtn) {
                exportSqlBtn.addEventListener('click', function () {
                    exportSql(ed ? ed.value : sql, (datasetId || 'query') + '.sql');
                    closeIdeMenu();
                });
            }
            if (exportCsvBtn) {
                exportCsvBtn.addEventListener('click', function () {
                    var last = (stage && stage._lastExecutionResult) || { columns: [], rows: [] };
                    exportCsv(last.columns, last.rows, (datasetId || 'results') + '.csv');
                    closeIdeMenu();
                });
            }
            if (exportJsonBtn) {
                exportJsonBtn.addEventListener('click', function () {
                    var last = (stage && stage._lastExecutionResult) || { columns: [], rows: [] };
                    exportJson(last.columns, last.rows, (datasetId || 'results') + '.json');
                    closeIdeMenu();
                });
            }

            async function runVerification() {
                if (!verifyBanner) return;
                var currentSql = ed ? ed.value : sql;
                verifyBanner.style.display = 'block';
                verifyBanner.className = 'sql-inline-verify-banner is-checking';
                verifyBanner.textContent = 'Checking relational assertions against reference result…';
                await mountClauseVisualizer(stage, currentSql, datasetId, Object.assign({}, editorOpts, { startAtFinal: true }));
                var vRes = await verifyQueryAgainstReference(currentSql, refSql, {
                    datasetId: datasetId,
                    buggyCode: options.buggyCode
                });
                var checksHtml = (vRes.checks || []).map(function (c) {
                    return '<div class="sql-verify-check">' +
                        '<span class="sql-verify-check__mark ' + (c.passed ? 'is-pass' : 'is-fail') + '">' + (c.passed ? '✓' : '✗') + '</span>' +
                        '<strong>' + escapeHtml(c.name) + '</strong>' +
                        '<span>' + escapeHtml(c.detail || '') + '</span>' +
                    '</div>';
                }).join('');
                verifyBanner.className = 'sql-inline-verify-banner ' + (vRes.passed ? 'is-pass' : 'is-fail');
                verifyBanner.innerHTML =
                    '<div class="sql-verify-head">' +
                        '<strong>' +
                            (vRes.passed ? '✓ All checks passed (' + vRes.passedCount + '/' + vRes.totalCount + ')' : '✗ Verification (' + (vRes.passedCount || 0) + '/' + (vRes.totalCount || 4) + ' passed)') +
                        '</strong>' +
                        '<span>' + escapeHtml(datasetId || 'ecommerce') + '</span>' +
                    '</div>' +
                    '<div class="sql-verify-grid">' + checksHtml + '</div>';
                if (typeof options.onVerify === 'function') {
                    options.onVerify(vRes);
                }
                if (vRes.passed && typeof options.onTestsPass === 'function') {
                    options.onTestsPass(vRes);
                }
            }

            if (runBtn) {
                runBtn.addEventListener('click', function () {
                    executeCurrentEditorSql({ startAtFinal: true });
                });
            }
            if (stepBtn) {
                stepBtn.addEventListener('click', function () {
                    executeCurrentEditorSql({ startAtFinal: false, initialStepIndex: 0 });
                });
            }
            if (verifyBtn) {
                verifyBtn.addEventListener('click', function () {
                    runVerification();
                });
            }
            if (explainBtn) {
                explainBtn.addEventListener('click', function () {
                    closeIdeMenu();
                    executeCurrentEditorSql({ startAtFinal: true, focusExplain: true });
                });
            }
            if (studioBtn) {
                studioBtn.addEventListener('click', function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    var currentSql = ed && ed.value.trim() ? ed.value : sql;
                    var currentDs = inferDatasetFromSql(currentSql) || datasetId || 'ecommerce';
                    openFullScreenSqlStudio({
                        sql: currentSql,
                        referenceSql: refSql || currentSql,
                        datasetId: currentDs,
                        title: options.title || 'SQL Studio'
                    });
                });
            }
            var initProm = executeCurrentEditorSql(editorOpts);
            if (options.autoVerify) {
                initProm.then(function () { runVerification(); });
            }
            return initProm;
        }

        var promise = (async function () {
            container.innerHTML = '<div class="sql-viz-loading">Running query…</div>';

            var pipeline;
            try {
                pipeline = await buildStepPipeline(sql, datasetId);
            } catch (err) {
                var errText = err && err.message ? err.message : String(err);
                container.innerHTML =
                    '<div class="sql-viz-panel sql-tviz is-error">' +
                        '<div class="sql-viz-header">' +
                            '<span class="sql-viz-badge is-error">SQL Error</span>' +
                            '<div class="sql-viz-meta-right">' +
                                (options.compactHeader ? '' : buildEngineSwitchHtml()) +
                            '</div>' +
                        '</div>' +
                        '<pre class="sql-viz-error-msg">' + escapeHtml(errText) + '</pre>' +
                    '</div>';
                bindEngineButtons(container, sql, datasetId, options);
                return;
            }
            var finalRes = pipeline.finalRes;
            var steps = pipeline.steps;
            var datasets = getDatasets();
            var dsInfo = datasets[pipeline.datasetId] || { title: pipeline.datasetId };

            if (finalRes.error) {
                if (options.ideCtrl && typeof options.ideCtrl.setError === 'function') {
                    options.ideCtrl.setError(finalRes.error);
                }
                var pedHint = finalRes.errorHint || (engine && typeof engine.getErrorHint === 'function' ? engine.getErrorHint(finalRes.error, sql) : null);
                container.innerHTML =
                    '<div class="sql-viz-panel sql-tviz is-error">' +
                        '<div class="sql-viz-header">' +
                            '<span class="sql-viz-badge is-error">SQL Error</span>' +
                            '<div class="sql-viz-meta-right">' +
                                (options.compactHeader ? '' : buildEngineSwitchHtml()) +
                                '<span class="sql-viz-dataset">' + escapeHtml(dsInfo.title) + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<pre class="sql-viz-error-msg">' + escapeHtml(finalRes.error) + '</pre>' +
                        (pedHint ? '<div class="sql-viz-hint-box"><strong>Hint:</strong> ' + escapeHtml(pedHint) + '</div>' : '') +
                    '</div>';
                bindEngineButtons(container, sql, pipeline.datasetId, options);
                return;
            }

            if (options.ideCtrl && typeof options.ideCtrl.clearError === 'function') {
                options.ideCtrl.clearError();
            }

            recordQueryHistory(sql, pipeline.datasetId);

            var clauseSteps = steps.filter(function (st) { return !st.isExplainStep; });
            if (clauseSteps.length === 0 && steps.length > 0) {
                clauseSteps = steps.slice();
            }
            var finalDataStepIdx = Math.max(0, clauseSteps.length - 1);
            var hasExplainPlan = Boolean(finalRes.plan && finalRes.plan.length > 0);

            var activePanelTab = 'results';
            if (options.focusExplain && hasExplainPlan) {
                activePanelTab = 'explain';
            } else if (options.startAtFinal === false || typeof options.initialStepIndex === 'number') {
                activePanelTab = clauseSteps.length > 1 ? 'clauses' : 'results';
            }

            var activeIdx = finalDataStepIdx;
            if (options.startAtFinal === false) {
                activeIdx = 0;
            }
            if (typeof options.initialStepIndex === 'number' && options.initialStepIndex >= 0 && options.initialStepIndex < clauseSteps.length) {
                activeIdx = options.initialStepIndex;
            }
            var sortByStep = {};

            function render() {
                var finalStepObj = clauseSteps[finalDataStepIdx] || {
                    clause: 'RESULT',
                    badge: (finalRes.rows ? finalRes.rows.length : 0) + ' rows',
                    description: 'Query output',
                    code: sql,
                    columns: finalRes.columns || [],
                    rows: finalRes.rows || [],
                    rowStates: []
                };
                var currentStep = (activePanelTab === 'clauses' ? clauseSteps[activeIdx] : finalStepObj) || finalStepObj;
                var tableStepIdx = activePanelTab === 'clauses' ? activeIdx : finalDataStepIdx;

                var exportCols = (currentStep.columns && currentStep.columns.length > 0) ? currentStep.columns : (finalRes.columns || []);
                var exportRows = (currentStep.rows && currentStep.rows.length > 0) ? currentStep.rows : (finalRes.rows || []);
                var finalRowCount = (finalRes.rows && Array.isArray(finalRes.rows)) ? finalRes.rows.length : exportRows.length;
                container._lastExecutionResult = {
                    sql: sql,
                    datasetId: pipeline.datasetId,
                    columns: exportCols,
                    rows: exportRows
                };

                var html = '<div class="sql-viz-panel sql-tviz">';
                // Single VS Code Bottom Panel Tab Bar
                html += '<div class="sql-viz-header">' +
                    '<div class="sql-panel-tabs" role="tablist" aria-label="Query output">' +
                        '<button type="button" role="tab" aria-selected="' + (activePanelTab === 'results') + '" class="sql-panel-tab ' + (activePanelTab === 'results' ? 'is-active' : '') + '" data-viz-panel-tab="results">' +
                            'Results <span class="sql-panel-tab__count">' + finalRowCount + '</span>' +
                        '</button>' +
                        (clauseSteps.length > 1
                            ? '<button type="button" role="tab" aria-selected="' + (activePanelTab === 'clauses') + '" class="sql-panel-tab ' + (activePanelTab === 'clauses' ? 'is-active' : '') + '" data-viz-panel-tab="clauses">' +
                                'Clause Stepper <span class="sql-panel-tab__count">' + clauseSteps.length + '</span>' +
                              '</button>'
                            : '') +
                        (hasExplainPlan
                            ? '<button type="button" role="tab" aria-selected="' + (activePanelTab === 'explain') + '" class="sql-panel-tab ' + (activePanelTab === 'explain' ? 'is-active' : '') + '" data-viz-panel-tab="explain">' +
                                'Execution Plan' +
                              '</button>'
                            : '') +
                    '</div>' +
                    '<div class="sql-viz-meta-right">' +
                        '<span class="sql-viz-timing">' + finalRowCount + (finalRowCount === 1 ? ' row' : ' rows') + ' · ' + escapeHtml(finalRes.durationMs) + ' ms</span>' +
                        (options.compactHeader
                            ? ''
                            : (
                                buildEngineSwitchHtml() +
                                '<button type="button" class="sql-viz-reset-btn" data-sql-ide-action="export-csv" title="Download CSV (.csv)">.csv</button>' +
                                '<button type="button" class="sql-viz-reset-btn" data-action="reset-dataset" title="Reset dataset tables">Reset</button>'
                            )
                        ) +
                    '</div>' +
                '</div>';

                if (activePanelTab === 'explain' && hasExplainPlan) {
                    html += renderExplainPlan(finalRes.plan);
                } else {
                    if (activePanelTab === 'clauses' && clauseSteps.length > 1) {
                        html += '<div class="sql-pipeline-bar" role="tablist" aria-label="SQL Clause Execution Pipeline">';
                        clauseSteps.forEach(function (st, idx) {
                            var isActive = idx === activeIdx;
                            html += '<button type="button" role="tab" aria-selected="' + isActive + '" class="sql-pipeline-step ' + (isActive ? 'is-active' : '') + '" data-step-idx="' + idx + '">' +
                                '<span class="sql-pipeline-clause">' + escapeHtml(st.clause) + '</span>' +
                                '<span class="sql-pipeline-count">' + escapeHtml(st.badge) + '</span>' +
                            '</button>';
                            if (idx < clauseSteps.length - 1) {
                                html += '<span class="sql-pipeline-arrow" aria-hidden="true">→</span>';
                            }
                        });
                        html += '</div>';

                        html += '<div class="sql-step-explainer">' +
                            '<div class="sql-step-explainer-text">' +
                                '<strong>' + escapeHtml(currentStep.clause) + ':</strong> ' +
                                '<span>' + escapeHtml(currentStep.description) + '</span>' +
                            '</div>' +
                            '<code class="sql-step-code-pill">' + highlightSql(currentStep.code) + '</code>' +
                        '</div>';
                    }

                    var stepSortState = sortByStep[tableStepIdx] || { colIdx: -1, dir: 'none' };
                    html += '<div class="sql-step-table-container">' + renderStepTable(currentStep, pipeline.datasetId, stepSortState) + '</div>';
                }

                html += '</div>';
                container.innerHTML = html;

                container.querySelectorAll('[data-viz-panel-tab]').forEach(function (tabBtn) {
                    tabBtn.addEventListener('click', function () {
                        var nextTab = tabBtn.getAttribute('data-viz-panel-tab') || 'results';
                        if (nextTab === activePanelTab) return;
                        activePanelTab = nextTab;
                        if (activePanelTab === 'clauses' && activeIdx === finalDataStepIdx && clauseSteps.length > 1) {
                            activeIdx = 0;
                        }
                        render();
                    });
                });

                container.querySelectorAll('.sql-sort-btn').forEach(function (sBtn) {
                    sBtn.addEventListener('click', function () {
                        var cIdx = Number(sBtn.getAttribute('data-sort-col'));
                        if (isNaN(cIdx)) return;
                        var cur = sortByStep[tableStepIdx] || { colIdx: -1, dir: 'none' };
                        var nextDir = (cur.colIdx === cIdx)
                            ? (cur.dir === 'asc' ? 'desc' : 'asc')
                            : 'asc';
                        sortByStep[tableStepIdx] = { colIdx: cIdx, dir: nextDir };

                        var table = sBtn.closest('table');
                        var tbody = table && table.tBodies && table.tBodies[0];
                        var stepData = clauseSteps[tableStepIdx];
                        if (!table || !tbody || !stepData || !Array.isArray(stepData.rows) || !stepData.rows.length) return;

                        var ariaDir = nextDir === 'asc' ? 'ascending' : 'descending';
                        Array.from(table.tHead.rows[0].cells).forEach(function (th) {
                            th.removeAttribute('aria-sort');
                            var g = th.querySelector('.sql-sort-glyph');
                            if (g) g.textContent = '↕';
                        });
                        var activeTh = sBtn.closest('th');
                        if (activeTh) {
                            activeTh.setAttribute('aria-sort', ariaDir);
                            var activeGlyph = activeTh.querySelector('.sql-sort-glyph');
                            if (activeGlyph) activeGlyph.textContent = nextDir === 'asc' ? '↑' : '↓';
                        }

                        var collator = (typeof Intl !== 'undefined' && Intl.Collator)
                            ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
                            : null;
                        var trList = Array.from(tbody.querySelectorAll('tr[data-orig-idx]'));
                        trList.sort(function (trA, trB) {
                            var idxA = Number(trA.getAttribute('data-orig-idx')) || 0;
                            var idxB = Number(trB.getAttribute('data-orig-idx')) || 0;
                            var va = stepData.rows[idxA] ? stepData.rows[idxA][cIdx] : null;
                            var vb = stepData.rows[idxB] ? stepData.rows[idxB][cIdx] : null;
                            var aNull = (va === null || va === undefined);
                            var bNull = (vb === null || vb === undefined);
                            if (aNull && bNull) return idxA - idxB;
                            if (aNull) return 1;
                            if (bNull) return -1;
                            var na = typeof va === 'number' ? va : (typeof va === 'string' && va.trim() !== '' && !isNaN(Number(va)) ? Number(va) : NaN);
                            var nb = typeof vb === 'number' ? vb : (typeof vb === 'string' && vb.trim() !== '' && !isNaN(Number(vb)) ? Number(vb) : NaN);
                            var cmp = (!isNaN(na) && !isNaN(nb))
                                ? (na - nb)
                                : (collator ? collator.compare(String(va), String(vb)) : String(va).localeCompare(String(vb)));
                            if (cmp === 0) return idxA - idxB;
                            return nextDir === 'desc' ? -cmp : cmp;
                        });
                        trList.forEach(function (tr) {
                            if (typeof tbody.moveBefore === 'function') tbody.moveBefore(tr, null);
                            else tbody.appendChild(tr);
                        });
                        var statusEl = sBtn.closest('.sql-step-table-scroll')?.querySelector('[role="status"]');
                        if (statusEl) {
                            statusEl.textContent = 'Sorted by ' + String(stepData.columns[cIdx] || 'column') + ', ' + ariaDir + ', ' + trList.length + ' rows';
                        }
                    });
                });

                container.querySelectorAll('.sql-pipeline-step').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        activeIdx = Number(btn.getAttribute('data-step-idx')) || 0;
                        render();
                    });
                });

                var stageExportSql = container.querySelector('[data-sql-ide-action="export-sql"]');
                if (stageExportSql) {
                    stageExportSql.addEventListener('click', function () {
                        exportSql(sql, (pipeline.datasetId || 'query') + '.sql');
                    });
                }
                var stageExportCsv = container.querySelector('[data-sql-ide-action="export-csv"]');
                if (stageExportCsv) {
                    stageExportCsv.addEventListener('click', function () {
                        exportCsv(exportCols, exportRows, (pipeline.datasetId || 'results') + '.csv');
                    });
                }
                var stageExportJson = container.querySelector('[data-sql-ide-action="export-json"]');
                if (stageExportJson) {
                    stageExportJson.addEventListener('click', function () {
                        exportJson(exportCols, exportRows, (pipeline.datasetId || 'results') + '.json');
                    });
                }

                var resetBtn = container.querySelector('[data-action="reset-dataset"]');
                if (resetBtn) {
                    resetBtn.addEventListener('click', async function () {
                        resetBtn.disabled = true;
                        resetBtn.textContent = 'Resetting…';
                        await engine.resetDataset(pipeline.datasetId);
                        await mountClauseVisualizer(container, sql, pipeline.datasetId, options);
                    });
                }

                bindEngineButtons(container, sql, pipeline.datasetId, options);
            }

            render();
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

    function openFullScreenSqlStudio(opts) {
        opts = opts || {};
        var sqlText = (opts.sql || '').trim() || 'SELECT * FROM customers LIMIT 10;';
        var dsId = opts.datasetId || inferDatasetFromSql(sqlText) || 'ecommerce';
        var titleEl = typeof document !== 'undefined' ? document.querySelector('.lesson-header__title, .lesson__title, h1') : null;
        var titleText = opts.title || (titleEl ? (titleEl.textContent.trim() + ' — SQL Studio') : 'Interactive SQL & Table Studio (PostgreSQL 18 / SQLite WASM)');
        var modalPayload = {
            slug: opts.slug || (root.App && typeof root.App.getCurrentSlug === 'function' ? root.App.getCurrentSlug() : ''),
            title: titleText,
            summary: opts.summary || 'Execute, edit, and step through this SQL query clause-by-clause in the full-screen SQL Studio.',
            datasetId: dsId,
            sql: sqlText,
            referenceSql: opts.referenceSql || sqlText,
            steps: Array.isArray(opts.steps) ? opts.steps : []
        };

        if (root.App && typeof root.App.openSqlStudioModal === 'function') {
            var res = root.App.openSqlStudioModal(modalPayload);
            var existingOverlay = typeof document !== 'undefined' ? document.getElementById('global-codelab-overlay') : null;
            if (existingOverlay) {
                existingOverlay.classList.add('open', 'is-open');
                existingOverlay.setAttribute('aria-hidden', 'false');
                existingOverlay.style.cssText = 'position:fixed;inset:0;z-index:9999;width:100vw;height:100vh;background:rgba(0,0,0,0.82);backdrop-filter:blur(4px);display:flex;flex-direction:column;opacity:1;visibility:visible;pointer-events:auto;transform:none;';
            }
            return res;
        }

        if (typeof document === 'undefined') return Promise.resolve(null);
        var overlay = document.getElementById('global-codelab-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-codelab-overlay';
            overlay.className = 'global-codelab-overlay build-lab-overlay';
            document.body.appendChild(overlay);
        }
        var datasets = getDatasets();
        var dsInfo = datasets[dsId] || { title: dsId };
        overlay.innerHTML =
            '<div class="global-codelab-shell sql-studio-modal-shell" style="display:flex;flex-direction:column;width:96vw;max-width:1560px;height:92vh;margin:4vh auto;background:var(--bg);border:1px solid var(--border-strong);border-radius:14px;overflow:hidden;box-shadow:var(--shadow-xl);">' +
                '<div class="global-codelab-topbar" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;background:var(--surface);border-bottom:1px solid var(--border);">' +
                    '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
                        '<button type="button" class="btn btn--secondary btn--sm" id="global-codelab-close-btn">← Back to Lesson</button>' +
                        '<div>' +
                            '<div style="display:flex;align-items:center;gap:8px;">' +
                                '<span style="background:var(--info-muted);color:var(--info);padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;">SQL STUDIO</span>' +
                                '<strong style="font-size:15px;color:var(--fg);">' + escapeHtml(titleText) + '</strong>' +
                            '</div>' +
                            '<div style="font-size:12px;color:var(--fg-muted);margin-top:2px;">Dataset: ' + escapeHtml(dsInfo.title || dsId) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="sql-studio-modal-visualizer-host" style="flex:1;min-height:0;overflow-y:auto;padding:16px;"></div>' +
            '</div>';
        overlay.classList.add('open', 'is-open');
        overlay.setAttribute('aria-hidden', 'false');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;width:100vw;height:100vh;background:rgba(0,0,0,0.82);backdrop-filter:blur(4px);display:flex;flex-direction:column;opacity:1;visibility:visible;pointer-events:auto;transform:none;';
        document.body.style.overflow = 'hidden';

        var closeModal = function () {
            overlay.classList.remove('open', 'is-open');
            overlay.setAttribute('aria-hidden', 'true');
            overlay.style.cssText = 'display:none;opacity:0;visibility:hidden;pointer-events:none;';
            overlay.innerHTML = '';
            document.body.style.overflow = '';
        };
        var closeBtn = overlay.querySelector('#global-codelab-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', function (ev) {
            if (ev.target === overlay) closeModal();
        });
        var visHost = overlay.querySelector('#sql-studio-modal-visualizer-host');
        if (visHost) {
            mountClauseVisualizer(visHost, {
                datasetId: dsId,
                sql: sqlText,
                referenceSql: opts.referenceSql || sqlText,
                showEditor: true,
                title: titleText
            });
        }
        return Promise.resolve(overlay);
    }

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
            codeEl.innerHTML = highlightSql(rawSql);
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
                    '<span class="sql-exec-ds-tag" title="Target dataset">' + escapeHtml(dsInfo.title) + '</span>' +
                '</div>' +
                '<div class="sql-exec-toolbar-actions">' +
                    '<button type="button" class="sql-vscode-btn" data-action="toggle-edit">Edit SQL</button>' +
                    '<button type="button" class="sql-vscode-btn" data-action="step-inline-sql">Step</button>' +
                    '<button type="button" class="sql-vscode-btn sql-vscode-btn--primary" data-action="run-visualize">Run</button>' +
                    '<button type="button" class="sql-vscode-btn" data-action="open-sql-studio" data-lang="sql">Studio ↗</button>' +
                '</div>';

            var editorWrap = document.createElement('div');
            editorWrap.className = 'sql-inline-editor-wrap sql-vscode-editor-pane';
            editorWrap.hidden = true;
            editorWrap.innerHTML =
                '<div class="sql-vscode-bar">' +
                    '<div class="sql-vscode-bar__left">' +
                        '<span class="sql-vscode-tab">query.sql</span>' +
                    '</div>' +
                    '<div class="sql-vscode-bar__right">' +
                        '<button type="button" class="sql-vscode-btn" data-sql-ide-action="format">Format</button>' +
                        '<button type="button" class="sql-vscode-btn" data-sql-ide-action="copy">Copy</button>' +
                        '<button type="button" class="sql-vscode-btn" data-sql-ide-action="share-query">Share</button>' +
                        '<button type="button" class="sql-vscode-btn" data-action="reset-edited-sql">Reset</button>' +
                        '<button type="button" class="sql-vscode-btn" data-action="step-edited-sql">Step</button>' +
                        '<button type="button" class="sql-vscode-btn sql-vscode-btn--primary" data-action="exec-edited-sql">Run <kbd>⌘↵</kbd></button>' +
                    '</div>' +
                '</div>' +
                '<textarea class="sql-inline-textarea" aria-label="SQL query editor" rows="' + Math.min(14, Math.max(5, rawSql.split('\n').length + 1)) + '" spellcheck="false">' + escapeHtml(rawSql) + '</textarea>';

            var outputWrap = document.createElement('div');
            outputWrap.className = 'sql-inline-output-wrap';
            outputWrap.hidden = false;
            outputWrap.innerHTML = '<div class="sql-inline-output-stage"></div>';

            wrapper.appendChild(toolbar);
            wrapper.appendChild(editorWrap);
            wrapper.appendChild(outputWrap);

            var editBtn = toolbar.querySelector('[data-action="toggle-edit"]');
            var stepToolbarBtn = toolbar.querySelector('[data-action="step-inline-sql"]');
            var runBtn = toolbar.querySelector('[data-action="run-visualize"]');
            var textarea = editorWrap.querySelector('.sql-inline-textarea');
            var execEditedBtn = editorWrap.querySelector('[data-action="exec-edited-sql"]');
            var stepEditedBtn = editorWrap.querySelector('[data-action="step-edited-sql"]');
            var resetEditedBtn = editorWrap.querySelector('[data-action="reset-edited-sql"]');
            var formatInlineBtn = editorWrap.querySelector('[data-sql-ide-action="format"]');
            var copyInlineBtn = editorWrap.querySelector('[data-sql-ide-action="copy"]');
            var shareInlineBtn = editorWrap.querySelector('[data-sql-ide-action="share-query"]');
            var outputStage = outputWrap.querySelector('.sql-inline-output-stage');

            var inlineIdeCtrl = textarea ? enhanceTextareaToIde(textarea, {
                datasetId: dsId,
                onRun: function () {
                    runCurrentBlock({ startAtFinal: true });
                }
            }) : null;

            function setEditorVisible(visible, focusEditor) {
                editorWrap.hidden = !visible;
                pre.hidden = Boolean(visible);
                editBtn.textContent = visible ? 'Done Editing' : 'Edit SQL';
                if (visible && inlineIdeCtrl) inlineIdeCtrl.sync();
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
                return mountClauseVisualizer(outputStage, currentSql, currentDs, Object.assign({ ideCtrl: inlineIdeCtrl }, opts));
            }

            if (stepToolbarBtn) {
                stepToolbarBtn.addEventListener('click', function () {
                    runCurrentBlock({ startAtFinal: false, initialStepIndex: 0 });
                });
            }

            runBtn.addEventListener('click', function () {
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

            if (formatInlineBtn && textarea) {
                formatInlineBtn.addEventListener('click', function () {
                    textarea.value = formatSql(textarea.value);
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    if (inlineIdeCtrl) inlineIdeCtrl.sync();
                });
            }

            if (copyInlineBtn && textarea) {
                copyInlineBtn.addEventListener('click', function () {
                    copySqlToClipboard(textarea.value, copyInlineBtn);
                });
            }

            if (shareInlineBtn && textarea) {
                shareInlineBtn.addEventListener('click', function () {
                    shareSqlQueryLink({
                        sql: textarea.value,
                        datasetId: inferDatasetFromSql(textarea.value) || dsId
                    }, shareInlineBtn);
                });
            }

            if (resetEditedBtn) {
                resetEditedBtn.addEventListener('click', function () {
                    if (textarea) {
                        textarea.value = rawSql;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (inlineIdeCtrl) inlineIdeCtrl.sync();
                    runCurrentBlock({ startAtFinal: true });
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
                openStudio: function () {
                    var currentSql = (textarea && textarea.value.trim()) ? textarea.value : rawSql;
                    var currentDs = inferDatasetFromSql(currentSql) || dsId;
                    return openFullScreenSqlStudio({
                        sql: currentSql,
                        referenceSql: rawSql,
                        datasetId: currentDs
                    });
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

            var studioBtns = wrapper.querySelectorAll('[data-action="open-sql-studio"]');
            studioBtns.forEach(function (stBtn) {
                stBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    blockController.openStudio();
                });
            });

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
                var extStudioBtns = parentCodeBlock.querySelectorAll('[data-action="open-sql-studio"]');
                extStudioBtns.forEach(function (extBtn) {
                    if (wrapper.contains(extBtn)) return;
                    extBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        blockController.openStudio();
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
     *   - Step tabs (`Step 1`, `Step 2`, `Step 3`) + `Reference Solution` tab
     *   - Step instructions & collapsible hint banner
     *   - Live SQL editor (`textarea.sql-live-editor`)
     *   - Action buttons:
     *       `Run & Visualize SQL`
     *       `Step-by-Step Clauses`
     *       `Verify SQL Output`
     *       `Load Step Solution`
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
                title: 'Reference Solution',
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
                '<span class="sql-lab-step-num">Ref</span>' +
                '<span class="sql-lab-step-title">Reference Solution</span>' +
            '</button>';

            container.innerHTML =
                '<div class="sql-guided-lab">' +
                    '<div class="sql-guided-lab-header">' +
                        '<div class="sql-guided-lab-title-row">' +
                            '<span class="sql-guided-lab-badge">Guided SQL Lab</span>' +
                            '<h4 class="sql-guided-lab-title">' + escapeHtml(labConfig.title || 'Interactive SQL Challenge') + '</h4>' +
                            '<span class="sql-viz-dataset">Dataset: ' + escapeHtml(dsInfo.title) + '</span>' +
                        '</div>' +
                        '<div class="sql-lab-step-tabs" role="tablist">' + tabsHtml + '</div>' +
                    '</div>' +
                    '<div class="sql-guided-lab-body">' +
                        '<div class="sql-lab-instruction-box">' +
                            '<div class="sql-lab-instruction-text">' + escapeHtml(currentStep.instruction || '') + '</div>' +
                            (currentStep.hint ? (
                                '<details class="sql-lab-hint-details">' +
                                    '<summary>Need a hint?</summary>' +
                                    '<div class="sql-lab-hint-content">' + escapeHtml(currentStep.hint) + '</div>' +
                                '</details>'
                            ) : '') +
                        '</div>' +
                        '<div class="sql-lab-editor-box sql-vscode-editor-pane">' +
                            '<div class="sql-vscode-bar">' +
                                '<div class="sql-vscode-bar__left">' +
                                    '<span class="sql-vscode-tab">solution.sql</span>' +
                                '</div>' +
                                '<div class="sql-vscode-bar__right">' +
                                    '<button type="button" class="sql-vscode-btn" data-sql-ide-action="format">Format</button>' +
                                    '<button type="button" class="sql-vscode-btn" data-sql-ide-action="copy">Copy</button>' +
                                    '<button type="button" class="sql-vscode-btn" data-lab-action="solution">Solution</button>' +
                                    '<button type="button" class="sql-vscode-btn sql-vscode-btn--verify" data-lab-action="verify">Verify</button>' +
                                    '<button type="button" class="sql-vscode-btn" data-lab-action="step">Step</button>' +
                                    '<button type="button" class="sql-vscode-btn sql-vscode-btn--primary" data-lab-action="run">Run <kbd>⌘↵</kbd></button>' +
                                    '<button type="button" class="sql-vscode-btn" data-lab-action="studio" data-action="open-sql-studio" data-lang="sql">Studio ↗</button>' +
                                '</div>' +
                            '</div>' +
                            '<textarea class="sql-live-editor sql-inline-textarea" aria-label="Guided lab SQL editor" rows="6" spellcheck="false">' + escapeHtml(currentSql) + '</textarea>' +
                        '</div>' +
                        '<div class="sql-lab-verify-banner" hidden></div>' +
                        '<div class="sql-lab-visualizer-mount"></div>' +
                    '</div>' +
                '</div>';

            var editor = container.querySelector('.sql-live-editor');
            var verifyBanner = container.querySelector('.sql-lab-verify-banner');
            var vizMount = container.querySelector('.sql-lab-visualizer-mount');

            var labIdeCtrl = editor ? enhanceTextareaToIde(editor, {
                datasetId: datasetId,
                onRun: function () {
                    verifyBanner.hidden = true;
                    mountClauseVisualizer(vizMount, editor.value, datasetId, { ideCtrl: labIdeCtrl });
                }
            }) : null;

            editor.addEventListener('input', function () {
                if (!isRefTab) {
                    draftSqlByStep[activeStepIdx] = editor.value;
                }
            });

            var labFormatBtn = container.querySelector('.sql-lab-editor-box [data-sql-ide-action="format"]');
            if (labFormatBtn && editor) {
                labFormatBtn.addEventListener('click', function () {
                    editor.value = formatSql(editor.value);
                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                    if (!isRefTab) draftSqlByStep[activeStepIdx] = editor.value;
                    if (labIdeCtrl) labIdeCtrl.sync();
                });
            }

            var labCopyBtn = container.querySelector('.sql-lab-editor-box [data-sql-ide-action="copy"]');
            if (labCopyBtn && editor) {
                labCopyBtn.addEventListener('click', function () {
                    copySqlToClipboard(editor.value, labCopyBtn);
                });
            }

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
                    if (labIdeCtrl) labIdeCtrl.sync();
                    mountClauseVisualizer(vizMount, sol, datasetId);
                }
            });

            var labStudioBtn = container.querySelector('[data-lab-action="studio"]');
            if (labStudioBtn) {
                labStudioBtn.addEventListener('click', function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    openFullScreenSqlStudio({
                        sql: editor.value || currentSql,
                        referenceSql: currentStep.solutionSql || labConfig.solutionSql || editor.value,
                        datasetId: datasetId,
                        title: labConfig.title || currentStep.title || 'Guided SQL Lab Studio'
                    });
                });
            }

            container.querySelector('[data-lab-action="verify"]').addEventListener('click', async function () {
                var userSql = editor.value;
                var targetSol = currentStep.solutionSql || labConfig.solutionSql || '';
                verifyBanner.hidden = false;
                verifyBanner.className = 'sql-lab-verify-banner is-checking';
                verifyBanner.textContent = 'Verifying query output against reference solution...';

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
                    var vCheck = await verifyQueryAgainstReference(userSql, targetSol, {
                        datasetId: datasetId,
                        buggyCode: currentStep.starterSql
                    });
                    passed = Boolean(vCheck && vCheck.passed);
                    if (passed) {
                        reason = 'Output matches reference solution (' + userRes.rows.length + ' rows × ' + userRes.columns.length + ' columns)!';
                    } else {
                        var failedItem = (vCheck && vCheck.checks || []).find(function (c) { return !c.passed; });
                        reason = failedItem ? (failedItem.name + ' — ' + failedItem.detail) : 'Output did not match reference assertions.';
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

    function normalizeSqlForVerification(s) {
        return String(s || '')
            .replace(/--[^\n]*/g, ' ')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/;+$/, '')
            .trim()
            .toLowerCase();
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

        var normUser = normalizeSqlForVerification(userSql);
        var normRef = normalizeSqlForVerification(referenceSql);
        var matchedChallenge = null;
        var rawChallenges = (root && (root.CHALLENGES_DATA || root.ChallengesData)) || [];
        var challengeList = Array.isArray(rawChallenges) ? rawChallenges : (rawChallenges.challenges || []);
        for (var ci = 0; ci < challengeList.length; ci++) {
            var chItem = challengeList[ci];
            if (chItem && chItem.codeFix && chItem.codeFix.solutionCode) {
                if (normalizeSqlForVerification(chItem.codeFix.solutionCode) === normRef) {
                    matchedChallenge = chItem;
                    break;
                }
            }
        }
        var buggyCandidate = options.buggyCode || (matchedChallenge && matchedChallenge.codeFix && matchedChallenge.codeFix.buggyCode) || '';
        var normBuggy = buggyCandidate ? normalizeSqlForVerification(buggyCandidate) : '';
        var isUnmodifiedBuggy = Boolean(normRef && normUser !== normRef && normBuggy && normUser === normBuggy);
        var hasUnresolvedAntiPattern = false;
        var antiPatternDetail = '';
        if (isUnmodifiedBuggy) {
            hasUnresolvedAntiPattern = true;
            antiPatternDetail = 'Unmodified buggy SQL query submitted — apply the required hotfix transformation';
        } else if (normRef && normUser !== normRef) {
            if (normRef.indexOf('rows between unbounded preceding') !== -1 && normUser.indexOf('rows between') === -1) {
                hasUnresolvedAntiPattern = true;
                antiPatternDetail = 'Missing explicit ROWS BETWEEN window frame & deterministic tie-breaker';
            } else if (normRef.indexOf('created_at >=') !== -1 && /substr\s*\(\s*created_at/i.test(normUser)) {
                hasUnresolvedAntiPattern = true;
                antiPatternDetail = 'Non-SARGable SUBSTR(created_at, ...) function wrapper still present';
            } else if (normRef.indexOf('group by customer_id') !== -1 && normUser.indexOf('group by') === -1) {
                hasUnresolvedAntiPattern = true;
                antiPatternDetail = 'Correlated per-row subquery still present instead of pre-aggregated GROUP BY join';
            }
        }

        var tuplesMatch = !rRes.error && JSON.stringify(uRes.rows) === JSON.stringify(rRes.rows);
        var rowsEqual = Boolean(tuplesMatch && !hasUnresolvedAntiPattern);
        checks.push({
            name: 'Test 4: Relational Tuple Equivalence',
            passed: Boolean(rowsEqual),
            detail: hasUnresolvedAntiPattern
                ? antiPatternDetail
                : (rowsEqual ? 'Exact tuple match with reference solution' : 'Tuple values differ from reference')
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
        getDatasetTableNames: getDatasetTableNames,
        stripGroupingWrappers: stripGroupingWrappers,
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
        openFullScreenSqlStudio: openFullScreenSqlStudio,
        highlightSql: highlightSql,
        formatSql: formatSql,
        enhanceTextareaToIde: enhanceTextareaToIde,
        saveQuery: saveQuery,
        getSavedQueries: getSavedQueries,
        deleteSavedQuery: deleteSavedQuery,
        recordQueryHistory: recordQueryHistory,
        getQueryHistory: getQueryHistory,
        clearQueryHistory: clearQueryHistory,
        serializeCsv: serializeCsv,
        serializeJson: serializeJson,
        exportSql: exportSql,
        exportCsv: exportCsv,
        exportJson: exportJson,
        SQL_PRACTICE_CHIPS: SQL_PRACTICE_CHIPS,
        insertSqlSnippet: insertSqlSnippet,
        buildSchemaTablesForEditor: buildSchemaTablesForEditor,
        encodeShareableQuery: encodeShareableQuery,
        decodeShareableQuery: decodeShareableQuery,
        buildShareableQueryUrl: buildShareableQueryUrl,
        shareSqlQueryLink: shareSqlQueryLink,
        SCHEMA_META: SCHEMA_META
    };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
