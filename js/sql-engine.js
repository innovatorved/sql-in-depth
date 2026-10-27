/**
 * SQL In Depth — Dual-Engine Browser WASM SQL Runner (`window.SqlEngine`)
 * Primary Engine: PostgreSQL 18.6 (PGlite WebAssembly)
 * Secondary / Instant Fallback Engine: SQLite 3 (sql.js WebAssembly)
 * Works seamlessly in both the browser and Node.js (for build & verification).
 */
(function (root) {
  'use strict';

  var isBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof process === 'undefined';
  var _engineMode = isBrowserEnv ? 'postgres' : 'sqlite';
  var _engineListeners = [];

  // SQLite (sql.js) state
  var _sqlJsPromise = null;
  var _SQL = null;
  var _databases = {};

  // PostgreSQL (PGlite) state
  var _pglitePromise = null;
  var _PGliteClass = null;
  var _pgDb = null;
  var _pgSeededDatasets = {};

  var _activeDatasetId = 'ecommerce';

  var PG_OID_MAP = {
    16: 'BOOL',
    20: 'BIGINT',
    21: 'SMALLINT',
    23: 'INTEGER',
    25: 'TEXT',
    114: 'JSON',
    700: 'REAL',
    701: 'DOUBLE',
    1042: 'CHAR',
    1043: 'VARCHAR',
    1082: 'DATE',
    1083: 'TIME',
    1114: 'TIMESTAMP',
    1184: 'TIMESTAMPTZ',
    1700: 'NUMERIC',
    2950: 'UUID',
    3802: 'JSONB'
  };

  function resolveWasmUrl(file) {
    if (typeof window !== 'undefined' && window.location) {
      return '/js/vendor/' + file;
    }
    return 'js/vendor/' + file;
  }

  function notifyEngineListeners() {
    var mode = getEngineMode();
    var ready = isPgliteReady();
    _engineListeners.slice().forEach(function (fn) {
      try {
        fn(mode, ready);
      } catch (e) {}
    });
  }

  function getEngineMode() {
    return _engineMode;
  }

  function isPgliteReady() {
    return Boolean(_pgDb);
  }

  function getEngineLabel() {
    if (_engineMode === 'postgres') {
      return _pgDb ? 'PostgreSQL 18.6 (PGlite WASM)' : 'PostgreSQL 18.6 (Initializing WASM…)';
    }
    return 'SQLite 3 (sql.js WASM)';
  }

  function onEngineChange(fn) {
    if (typeof fn !== 'function') return function () {};
    _engineListeners.push(fn);
    return function () {
      var idx = _engineListeners.indexOf(fn);
      if (idx >= 0) _engineListeners.splice(idx, 1);
    };
  }

  function setEngineMode(mode) {
    var normalized = (mode === 'sqlite' || mode === 'postgres') ? mode : 'postgres';
    var changed = _engineMode !== normalized;
    _engineMode = normalized;
    if (normalized === 'postgres' && !_pgDb) {
      initPglite().catch(function () {});
    }
    if (changed) {
      notifyEngineListeners();
    }
    return _engineMode;
  }

  /**
   * Initializes SQLite 3 (sql.js WASM).
   */
  function initSqlite() {
    if (_SQL) return Promise.resolve(_SQL);
    if (_sqlJsPromise) return _sqlJsPromise;

    var initFn = root.initSqlJs || (typeof initSqlJs !== 'undefined' ? initSqlJs : null);
    if (!initFn && typeof require === 'function') {
      try {
        initFn = require('sql.js');
      } catch (e) {}
    }

    if (!initFn) {
      return Promise.reject(new Error('sql.js WASM initializer (initSqlJs) is not loaded yet.'));
    }

    var config = {};
    if (typeof window !== 'undefined' && typeof process === 'undefined') {
      config.locateFile = resolveWasmUrl;
    }

    _sqlJsPromise = initFn(config).then(function (SQL) {
      _SQL = SQL;
      return SQL;
    }).catch(function (err) {
      _sqlJsPromise = null;
      throw err;
    });

    return _sqlJsPromise;
  }

  /**
   * Strips SQLite-only PRAGMAs from dataset DDL before executing in PostgreSQL 18.
   */
  function cleanDdlForPostgres(ddl) {
    if (!ddl) return '';
    return String(ddl).replace(/^\s*PRAGMA\b[^;]*;\s*/gim, '');
  }

  /**
   * Seeds or resets a dataset inside the PGlite PostgreSQL 18 instance.
   */
  function seedPostgresDataset(pgDb, datasetId, forceReset) {
    var dsId = datasetId || _activeDatasetId || '__unified__';
    var datasets = root.SQL_DATASETS || {};
    var targetKeys = (dsId === '__unified__' || !datasets[dsId])
      ? Object.keys(datasets)
      : [dsId];

    var toSeed = targetKeys.filter(function (k) {
      return forceReset || !_pgSeededDatasets[k];
    });

    if (toSeed.length === 0) {
      return Promise.resolve(pgDb);
    }

    var sqlParts = [];
    toSeed.forEach(function (k) {
      var ds = datasets[k];
      if (!ds) return;
      if (_pgSeededDatasets[k] && forceReset && Array.isArray(ds.tables)) {
        ds.tables.slice().reverse().forEach(function (t) {
          if (t && t.name) {
            sqlParts.push('DROP TABLE IF EXISTS "' + t.name + '" CASCADE;');
          }
        });
      }
      if (ds.ddl) {
        sqlParts.push(cleanDdlForPostgres(ds.ddl));
      }
    });

    var combinedSql = sqlParts.join('\n');
    if (!combinedSql.trim()) {
      return Promise.resolve(pgDb);
    }

    return pgDb.exec(combinedSql).then(function () {
      toSeed.forEach(function (k) {
        _pgSeededDatasets[k] = true;
      });
      return pgDb;
    }).catch(function (err) {
      // If a table already existed from a partial run, drop and retry cleanly
      var retryParts = [];
      toSeed.forEach(function (k) {
        var ds = datasets[k];
        if (!ds) return;
        if (Array.isArray(ds.tables)) {
          ds.tables.slice().reverse().forEach(function (t) {
            if (t && t.name) retryParts.push('DROP TABLE IF EXISTS "' + t.name + '" CASCADE;');
          });
        }
        if (ds.ddl) retryParts.push(cleanDdlForPostgres(ds.ddl));
      });
      return pgDb.exec(retryParts.join('\n')).then(function () {
        toSeed.forEach(function (k) {
          _pgSeededDatasets[k] = true;
        });
        return pgDb;
      }).catch(function () {
        throw err;
      });
    });
  }

  /**
   * Initializes PostgreSQL 18.6 (PGlite WASM) and seeds all 5 datasets.
   */
  function initPglite() {
    if (_pgDb) return Promise.resolve(_pgDb);
    if (_pglitePromise) return _pglitePromise;

    var loaderPromise;
    if (isBrowserEnv) {
      loaderPromise = import('/js/vendor/pglite/index.js');
    } else if (typeof require === 'function') {
      try {
        loaderPromise = Promise.resolve(require('@electric-sql/pglite'));
      } catch (e) {
        loaderPromise = import('@electric-sql/pglite');
      }
    } else {
      loaderPromise = import('/js/vendor/pglite/index.js');
    }

    _pglitePromise = loaderPromise.then(function (mod) {
      _PGliteClass = mod.PGlite || (mod.default && mod.default.PGlite) || mod.default;
      if (!_PGliteClass) {
        throw new Error('PGlite constructor not found in module exports.');
      }
      var instance = new _PGliteClass();
      return (instance.waitReady || Promise.resolve()).then(function () {
        // Install compatibility helper overloads so both PostgreSQL and SQLite idioms work seamlessly
        var compatSql = [
          'CREATE OR REPLACE FUNCTION pg_catalog.round(double precision, integer) RETURNS numeric AS $$ SELECT pg_catalog.round($1::numeric, $2); $$ LANGUAGE SQL IMMUTABLE;',
          'CREATE OR REPLACE FUNCTION datetime(text) RETURNS timestamp AS $$ SELECT CURRENT_TIMESTAMP::timestamp; $$ LANGUAGE SQL STABLE;'
        ].join('\n');
        return instance.exec(compatSql).catch(function () {}).then(function () {
          return seedPostgresDataset(instance, '__unified__', false);
        }).then(function () {
          _pgDb = instance;
          notifyEngineListeners();
          return _pgDb;
        });
      });
    }).catch(function (err) {
      _pglitePromise = null;
      throw err;
    });

    return _pglitePromise;
  }

  function init() {
    if (_engineMode === 'postgres') {
      initPglite().catch(function () {});
    }
    return initSqlite();
  }

  // Kick off background PGlite initialization in Browser immediately
  if (isBrowserEnv) {
    setTimeout(function () {
      initPglite().catch(function () {});
    }, 10);
  }

  /**
   * Normalizes SQL across PostgreSQL 18 and SQLite 3 engines.
   * When executing on PostgreSQL 18 (`forPostgres === true`), preserves all native
   * PostgreSQL features (`ILIKE`, `::type`, `NULLS LAST`, `FILTER (WHERE ...)`,
   * `ROLLUP`, `CUBE`, `GROUPING SETS`, `LATERAL`, `GENERATE_SERIES`, `DISTINCT ON`, `RETURNING`)
   * and only adapts SQLite-specific `printf('%.*c', expr, ' ')` to `REPEAT(' ', (expr)::int)`.
   */
  function normalizeDialect(sql, forPostgres) {
    if (!sql || typeof sql !== 'string') return { sql: '', notes: [] };
    var usePg = typeof forPostgres === 'boolean' ? forPostgres : (_engineMode === 'postgres' && Boolean(_pgDb));
    var normalized = sql;
    var notes = [];

    if (usePg) {
      // Translate SQLite printf('%.*c', expr, ' ') indentation idiom to PostgreSQL REPEAT(' ', (expr)::int)
      if (/\bprintf\s*\(\s*'%.\*c'\s*,/i.test(normalized)) {
        notes.push("SQLite printf('%.*c', n, ' ') translated to PostgreSQL REPEAT(' ', (n)::int).");
        normalized = normalized.replace(/\bprintf\s*\(\s*'%.\*c'\s*,\s*([^,]+?)\s*,\s*'([^']*)'\s*\)/gi, function (_, expr, ch) {
          var padChar = (ch || ' ').replace(/'/g, "''");
          return "REPEAT('" + padChar + "', (" + expr.trim() + ")::int)";
        });
      }
      // Translate SQLite GROUP_CONCAT(col, sep) to PostgreSQL STRING_AGG(col::text, sep)
      if (/\bGROUP_CONCAT\s*\(/i.test(normalized)) {
        notes.push('SQLite GROUP_CONCAT() translated to PostgreSQL STRING_AGG().');
        normalized = normalized.replace(/\bGROUP_CONCAT\s*\(\s*([^,)]+?)\s*(?:,\s*([^)]+?))?\s*\)/gi, function (_, expr, sep) {
          var s = sep ? sep.trim() : "','";
          return 'STRING_AGG((' + expr.trim() + ')::text, ' + s + ')';
        });
      }
      return { sql: normalized, notes: notes };
    }

    // SQLite 3 (sql.js) normalization path
    // 1. PostgreSQL ::type casts -> CAST(... AS type) when simple identifier/literal
    if (/::[a-zA-Z_][a-zA-Z0-9_]*/.test(normalized)) {
      notes.push('PostgreSQL ::type cast normalized to standard SQL CAST(expr AS type) for SQLite WASM execution.');
      normalized = normalized.replace(/(\b[a-zA-Z0-9_.'"]+)\s*::\s*(numeric|decimal|float|real|double|int|integer|bigint|smallint|text|varchar|date|timestamp|timestamptz)/gi, function (_, expr, type) {
        var target = /numeric|decimal|float|real|double/i.test(type) ? 'REAL' : (/int/i.test(type) ? 'INTEGER' : 'TEXT');
        return 'CAST(' + expr + ' AS ' + target + ')';
      });
    }

    // 2. ILIKE -> LIKE (SQLite LIKE is case-insensitive for ASCII by default)
    if (/\bILIKE\b/i.test(normalized)) {
      notes.push('PostgreSQL ILIKE mapped to case-insensitive LIKE.');
      normalized = normalized.replace(/\bILIKE\b/gi, 'LIKE');
    }

    // 3. STRING_AGG(col, sep) -> GROUP_CONCAT(col, sep)
    if (/\bSTRING_AGG\s*\(/i.test(normalized)) {
      notes.push('PostgreSQL/DuckDB STRING_AGG() mapped to GROUP_CONCAT().');
      normalized = normalized.replace(/\bSTRING_AGG\s*\(/gi, 'GROUP_CONCAT(');
    }

    // 4. NOW() / CURRENT_TIMESTAMP
    if (/\bNOW\s*\(\s*\)/i.test(normalized)) {
      normalized = normalized.replace(/\bNOW\s*\(\s*\)/gi, "datetime('now')");
    }

    // 5. TRUNCATE TABLE tbl -> DELETE FROM tbl
    if (/^\s*TRUNCATE\s+TABLE\s+([a-zA-Z0-9_]+)/im.test(normalized)) {
      notes.push('TRUNCATE TABLE normalized to DELETE FROM for SQLite transaction compatibility.');
      normalized = normalized.replace(/^\s*TRUNCATE\s+TABLE\s+([a-zA-Z0-9_]+)/gim, 'DELETE FROM $1');
    }

    return { sql: normalized, notes: notes };
  }

  /**
   * Builds or resets an in-memory WASM SQLite database for the specified dataset ID.
   */
  function createDatabaseForDataset(datasetId, forceReset) {
    var dsId = datasetId || _activeDatasetId || 'ecommerce';
    if (!forceReset && _databases[dsId]) {
      return Promise.resolve(_databases[dsId]);
    }

    return initSqlite().then(function (SQL) {
      if (!forceReset && _databases[dsId]) {
        return _databases[dsId];
      }
      if (_databases[dsId]) {
        try { _databases[dsId].close(); } catch (e) {}
      }
      var db = new SQL.Database();
      var datasets = root.SQL_DATASETS || {};
      var ds = datasets[dsId] || datasets.ecommerce;
      if (ds && ds.ddl) {
        db.run(ds.ddl);
      }
      // Also seed the remaining datasets (all 26 table names across the 5 datasets are disjoint)
      // so cross-dataset or inferred queries always find their tables.
      Object.keys(datasets).forEach(function (k) {
        if (ds && datasets[k] === ds) return;
        try { db.run(datasets[k].ddl); } catch (e) {}
      });
      _databases[dsId] = db;
      return db;
    });
  }

  /**
   * Creates an isolated SQLite database seeded with all 5 datasets.
   */
  function getUnifiedDatabase(forceReset) {
    if (!forceReset && _databases.__unified__) {
      return Promise.resolve(_databases.__unified__);
    }
    return initSqlite().then(function (SQL) {
      if (!forceReset && _databases.__unified__) {
        return _databases.__unified__;
      }
      if (_databases.__unified__) {
        try { _databases.__unified__.close(); } catch (e) {}
      }
      var db = new SQL.Database();
      var datasets = root.SQL_DATASETS || {};
      Object.keys(datasets).forEach(function (k) {
        try { db.run(datasets[k].ddl); } catch (e) {}
      });
      _databases.__unified__ = db;
      return db;
    });
  }

  /**
   * Detects whether a SQL statement is a DML mutation (INSERT / UPDATE / DELETE / TRUNCATE)
   * and returns `{ operation, tableName }` or `null`.
   */
  function detectDmlTarget(sql) {
    if (!sql || typeof sql !== 'string') return null;
    var clean = sql.trim().replace(/^\s*(?:--[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)+/g, '');
    var mInsert = /^\s*INSERT\s+(?:OR\s+\w+\s+)?INTO\s+["`]?([a-zA-Z_][a-zA-Z0-9_]*)["`]?/i.exec(clean);
    if (mInsert) return { operation: 'INSERT', tableName: mInsert[1] };
    var mUpdate = /^\s*UPDATE\s+(?:OR\s+\w+\s+)?["`]?([a-zA-Z_][a-zA-Z0-9_]*)["`]?/i.exec(clean);
    if (mUpdate) return { operation: 'UPDATE', tableName: mUpdate[1] };
    var mDelete = /^\s*DELETE\s+FROM\s+["`]?([a-zA-Z_][a-zA-Z0-9_]*)["`]?/i.exec(clean);
    if (mDelete) return { operation: 'DELETE', tableName: mDelete[1] };
    var mTrunc = /^\s*TRUNCATE\s+(?:TABLE\s+)?["`]?([a-zA-Z_][a-zA-Z0-9_]*)["`]?/i.exec(clean);
    if (mTrunc) return { operation: 'DELETE', tableName: mTrunc[1] };
    return null;
  }

  /**
   * Finds primary key column names for a given table from `root.SQL_DATASETS` or heuristics.
   */
  function findPrimaryKeyColumns(tableName, columns) {
    var datasets = root.SQL_DATASETS || {};
    var pkCols = [];
    Object.keys(datasets).forEach(function (dsKey) {
      var ds = datasets[dsKey];
      if (!ds || !Array.isArray(ds.tables)) return;
      ds.tables.forEach(function (t) {
        if (t && t.name && t.name.toLowerCase() === String(tableName).toLowerCase() && t.pk) {
          pkCols = String(t.pk).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        }
      });
    });

    var indices = [];
    if (pkCols.length > 0 && Array.isArray(columns)) {
      pkCols.forEach(function (pk) {
        var idx = columns.findIndex(function (c) { return String(c).toLowerCase() === pk.toLowerCase(); });
        if (idx >= 0) indices.push(idx);
      });
    }
    if (indices.length === 0 && Array.isArray(columns) && columns.length > 0) {
      var idIdx = columns.findIndex(function (c) { return /^id$|_id$/i.test(String(c)); });
      indices.push(idIdx >= 0 ? idIdx : 0);
    }
    return indices;
  }

  /**
   * Computes a structured row-by-row and cell-by-cell diff between `beforeRows` and `afterRows`.
   */
  function computeDmlDiff(dmlInfo, columns, beforeRows, afterRows, returningCols, returningRows) {
    var pkIndices = findPrimaryKeyColumns(dmlInfo.tableName, columns);
    function makeKey(row, fallbackIdx) {
      if (!row || !pkIndices.length) return '__idx_' + fallbackIdx;
      return pkIndices.map(function (idx) { return JSON.stringify(row[idx]); }).join('|');
    }

    var beforeMap = new Map();
    (beforeRows || []).forEach(function (r, idx) {
      beforeMap.set(makeKey(r, idx), r);
    });

    var afterMap = new Map();
    (afterRows || []).forEach(function (r, idx) {
      afterMap.set(makeKey(r, idx), r);
    });

    var diffRows = [];
    var inserted = 0;
    var updated = 0;
    var deleted = 0;
    var unchanged = 0;

    (afterRows || []).forEach(function (afterRow, idx) {
      var key = makeKey(afterRow, idx);
      if (!beforeMap.has(key)) {
        inserted++;
        diffRows.push({
          row: afterRow,
          beforeRow: null,
          state: 'inserted',
          changedCols: {}
        });
      } else {
        var beforeRow = beforeMap.get(key);
        var changedCols = {};
        var hasChange = false;
        for (var c = 0; c < columns.length; c++) {
          var bVal = beforeRow[c];
          var aVal = afterRow[c];
          if (String(bVal) !== String(aVal) || (bVal === null) !== (aVal === null)) {
            hasChange = true;
            var diffEntry = { before: bVal, after: aVal, oldVal: bVal, newVal: aVal };
            changedCols[c] = diffEntry;
            if (columns[c]) {
              changedCols[columns[c]] = diffEntry;
            }
          }
        }
        if (hasChange) {
          updated++;
          diffRows.push({
            row: afterRow,
            beforeRow: beforeRow,
            state: 'updated',
            changedCols: changedCols
          });
        } else {
          unchanged++;
          diffRows.push({
            row: afterRow,
            beforeRow: beforeRow,
            state: 'unchanged',
            changedCols: {}
          });
        }
      }
    });

    (beforeRows || []).forEach(function (beforeRow, idx) {
      var key = makeKey(beforeRow, idx);
      if (!afterMap.has(key)) {
        deleted++;
        diffRows.push({
          row: beforeRow,
          beforeRow: beforeRow,
          state: 'deleted',
          changedCols: {}
        });
      }
    });

    return {
      tableName: dmlInfo.tableName,
      operation: dmlInfo.operation,
      columns: columns || [],
      pkIndices: pkIndices,
      beforeRows: beforeRows || [],
      afterRows: afterRows || [],
      returningColumns: returningCols || [],
      returningRows: returningRows || [],
      diffRows: diffRows,
      summary: {
        inserted: inserted,
        updated: updated,
        deleted: deleted,
        unchanged: unchanged
      }
    };
  }

  function inferSqliteColumnTypes(columns, rows) {
    if (!Array.isArray(columns)) return [];
    return columns.map(function (colName, colIdx) {
      for (var i = 0; i < (rows || []).length; i++) {
        var val = rows[i][colIdx];
        if (val !== null && typeof val !== 'undefined') {
          if (typeof val === 'number') {
            return Number.isInteger(val) ? 'INTEGER' : 'REAL';
          }
          if (typeof val === 'boolean') return 'BOOL';
          return 'TEXT';
        }
      }
      if (/_id$|^id$|_qty$|_cents$|_count$|version|level|depth/i.test(colName)) return 'INTEGER';
      if (/_usd$|_pct$|avg|rate/i.test(colName)) return 'NUMERIC';
      return 'TEXT';
    });
  }

  /**
   * Runs `EXPLAIN (ANALYZE, BUFFERS, COSTS, FORMAT JSON)` in PostgreSQL 18 inside a rolled-back
   * savepoint (or `EXPLAIN (COSTS, FORMAT JSON)` fallback) and flattens the plan tree.
   */
  function explainQueryPlanPg(pgDb, sql) {
    if (!pgDb || !sql) return Promise.resolve([]);
    var trimmed = sql.trim().replace(/;+\s*$/, '');
    if (!/^(SELECT|WITH)\b/i.test(trimmed)) return Promise.resolve([]);
    if (/^\s*EXPLAIN\b/i.test(trimmed)) return Promise.resolve([]);

    function flattenPlanTree(rootPlan) {
      var nodes = [];
      var nextId = 0;

      function visit(node, parentId, depth) {
        if (!node) return;
        var myId = nextId++;
        var nodeType = String(node['Node Type'] || 'Operation');
        var relName = node['Relation Name'] || node['CTE Name'] || '';
        var alias = node['Alias'] && node['Alias'] !== relName ? (' ' + node['Alias']) : '';
        var idxName = node['Index Name'] || '';

        var kind = nodeType.toUpperCase();
        if (/Index Only Scan/i.test(nodeType)) kind = 'COVERING INDEX-ONLY SCAN';
        else if (/Bitmap Index Scan/i.test(nodeType)) kind = 'BITMAP INDEX SCAN';
        else if (/Bitmap Heap Scan/i.test(nodeType)) kind = 'BITMAP HEAP SCAN';
        else if (/Index Scan/i.test(nodeType)) kind = 'B-TREE INDEX SCAN';
        else if (/Seq Scan/i.test(nodeType)) kind = 'SEQ SCAN (FULL TABLE)';
        else if (/Hash Join/i.test(nodeType)) kind = 'HASH JOIN (' + String(node['Join Type'] || 'INNER').toUpperCase() + ')';
        else if (/Nested Loop/i.test(nodeType)) kind = 'NESTED LOOP (' + String(node['Join Type'] || 'INNER').toUpperCase() + ')';
        else if (/Merge Join/i.test(nodeType)) kind = 'MERGE JOIN (' + String(node['Join Type'] || 'INNER').toUpperCase() + ')';
        else if (/Aggregate/i.test(nodeType)) kind = (node['Strategy'] === 'Hashed' ? 'HASH AGGREGATE' : 'GROUP AGGREGATE');
        else if (/WindowAgg/i.test(nodeType)) kind = 'WINDOW AGGREGATE';
        else if (/Sort/i.test(nodeType)) kind = 'SORT (' + (node['Sort Method'] ? node['Sort Method'].toUpperCase() : 'QUICKSORT') + ')';
        else if (/Limit/i.test(nodeType)) kind = 'LIMIT SLICE';
        else if (/CTE Scan|WorkTable Scan/i.test(nodeType)) kind = 'CTE SCAN';

        var detailParts = [nodeType];
        if (relName) detailParts.push('on ' + relName + alias);
        if (idxName) detailParts.push('using ' + idxName);
        if (node['Index Cond']) detailParts.push('Index Cond: ' + node['Index Cond']);
        if (node['Hash Cond']) detailParts.push('Hash Cond: ' + node['Hash Cond']);
        if (node['Filter']) detailParts.push('Filter: ' + node['Filter']);
        if (node['Group Key']) detailParts.push('Group Key: ' + (Array.isArray(node['Group Key']) ? node['Group Key'].join(', ') : node['Group Key']));
        if (node['Sort Key']) detailParts.push('Sort Key: ' + (Array.isArray(node['Sort Key']) ? node['Sort Key'].join(', ') : node['Sort Key']));

        var costStr = typeof node['Total Cost'] === 'number'
          ? ('cost=' + Number(node['Startup Cost'] || 0).toFixed(2) + '..' + Number(node['Total Cost']).toFixed(2))
          : '';
        var rowsStr = typeof node['Plan Rows'] === 'number' ? ('rows=' + node['Plan Rows']) : '';
        var actualStr = typeof node['Actual Total Time'] === 'number'
          ? ('actual=' + Number(node['Actual Total Time']).toFixed(3) + 'ms, rows=' + (node['Actual Rows'] ?? 0))
          : '';
        var bufHit = node['Shared Hit Blocks'] || 0;
        var bufStr = bufHit > 0 ? ('buffers: shared hit=' + bufHit) : '';

        var metrics = [costStr, rowsStr, actualStr, bufStr].filter(Boolean).join(' · ');
        if (metrics) detailParts.push('(' + metrics + ')');

        nodes.push({
          id: myId,
          parent: parentId,
          depth: depth,
          detail: detailParts.join(' '),
          kind: kind,
          nodeType: nodeType,
          isIndex: /Index|Bitmap/i.test(nodeType),
          isFullScan: /Seq Scan/i.test(nodeType),
          isTempBTree: /Sort|Materialize/i.test(nodeType),
          actualTimeMs: node['Actual Total Time'] ?? null,
          actualRows: node['Actual Rows'] ?? null,
          planRows: node['Plan Rows'] ?? null,
          totalCost: node['Total Cost'] ?? null,
          sharedHitBlocks: bufHit
        });

        if (Array.isArray(node.Plans)) {
          node.Plans.forEach(function (child) {
            visit(child, myId, depth + 1);
          });
        }
      }

      visit(rootPlan, null, 0);
      return nodes;
    }

    var analyzeSql = 'EXPLAIN (ANALYZE, BUFFERS, COSTS, FORMAT JSON) ' + trimmed;
    return pgDb.query(analyzeSql).then(function (res) {
      var jsonRow = res && res.rows && res.rows[0] && (res.rows[0]['QUERY PLAN'] || res.rows[0].query_plan);
      var parsed = typeof jsonRow === 'string' ? JSON.parse(jsonRow) : jsonRow;
      var rootPlan = Array.isArray(parsed) && parsed[0] ? parsed[0].Plan : (parsed && parsed.Plan);
      return rootPlan ? flattenPlanTree(rootPlan) : [];
    }).catch(function () {
      var basicSql = 'EXPLAIN (COSTS, FORMAT JSON) ' + trimmed;
      return pgDb.query(basicSql).then(function (res) {
        var jsonRow = res && res.rows && res.rows[0] && (res.rows[0]['QUERY PLAN'] || res.rows[0].query_plan);
        var parsed = typeof jsonRow === 'string' ? JSON.parse(jsonRow) : jsonRow;
        var rootPlan = Array.isArray(parsed) && parsed[0] ? parsed[0].Plan : (parsed && parsed.Plan);
        return rootPlan ? flattenPlanTree(rootPlan) : [];
      }).catch(function () {
        return [];
      });
    });
  }

  /**
   * Executes a SQL string on PostgreSQL 18 (PGlite WASM).
   */
  function executePostgres(pgDb, sql, options) {
    var datasetId = options.datasetId || '__unified__';
    var includeExplain = options.explain !== false;
    var dmlInfo = !options.skipDmlDiff ? detectDmlTarget(sql) : null;

    return seedPostgresDataset(pgDb, datasetId, Boolean(options.reset)).then(function () {
      var norm = normalizeDialect(sql, true);
      var beforePromise = dmlInfo
        ? pgDb.exec('SELECT * FROM "' + dmlInfo.tableName + '" LIMIT 50;', { rowMode: 'array' }).catch(function () { return []; })
        : Promise.resolve(null);

      return beforePromise.then(function (beforeRaw) {
        var beforeCols = (beforeRaw && beforeRaw[0] && beforeRaw[0].fields)
          ? beforeRaw[0].fields.map(function (f) { return f.name; })
          : [];
        var beforeRows = (beforeRaw && beforeRaw[0] && beforeRaw[0].rows)
          ? beforeRaw[0].rows.map(function (r) { return r.slice(); })
          : [];

        var t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

        return pgDb.exec(norm.sql, { rowMode: 'array' }).then(function (rawResults) {
          var t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
          var elapsedMs = Math.max(0.05, Number((t1 - t0).toFixed(2)));

          var resultSets = (rawResults || []).filter(function (r) {
            return (r.fields && r.fields.length > 0) || (r.rows && r.rows.length > 0);
          }).map(function (r) {
            var cols = (r.fields || []).map(function (f) { return f.name; });
            var colTypes = (r.fields || []).map(function (f) { return PG_OID_MAP[f.dataTypeID] || 'ANY'; });
            var rows = (r.rows || []).map(function (row) {
              return row.map(function (cell) {
                if (cell instanceof Date) return cell.toISOString();
                if (typeof cell === 'bigint') return Number(cell);
                if (cell && typeof cell === 'object') return JSON.stringify(cell);
                return cell;
              });
            });
            return {
              columns: cols,
              columnTypes: colTypes,
              values: rows,
              rowCount: rows.length,
              affectedRows: r.affectedRows || 0
            };
          });

          var afterPromise = dmlInfo
            ? pgDb.exec('SELECT * FROM "' + dmlInfo.tableName + '" LIMIT 50;', { rowMode: 'array' }).catch(function () { return []; })
            : Promise.resolve(null);

          var explainPromise = includeExplain ? explainQueryPlanPg(pgDb, norm.sql) : Promise.resolve([]);

          return Promise.all([afterPromise, explainPromise]).then(function (postPair) {
            var afterRaw = postPair[0];
            var explainNodes = postPair[1] || [];
            var dmlDiff = null;

            if (dmlInfo && afterRaw && afterRaw[0]) {
              var afterCols = (afterRaw[0].fields || []).map(function (f) { return f.name; });
              var afterColTypes = (afterRaw[0].fields || []).map(function (f) { return PG_OID_MAP[f.dataTypeID] || 'ANY'; });
              var afterRows = (afterRaw[0].rows || []).map(function (row) {
                return row.map(function (cell) {
                  if (cell instanceof Date) return cell.toISOString();
                  if (typeof cell === 'bigint') return Number(cell);
                  if (cell && typeof cell === 'object') return JSON.stringify(cell);
                  return cell;
                });
              });
              var retCols = resultSets[0] ? resultSets[0].columns : [];
              var retRows = resultSets[0] ? resultSets[0].values : [];
              dmlDiff = computeDmlDiff(
                dmlInfo,
                afterCols.length ? afterCols : beforeCols,
                beforeRows,
                afterRows,
                retCols,
                retRows
              );
              if (resultSets.length === 0) {
                resultSets.push({
                  columns: dmlDiff.columns,
                  columnTypes: afterColTypes,
                  values: dmlDiff.afterRows,
                  rowCount: dmlDiff.afterRows.length
                });
              }
            }

            var primarySet = resultSets[resultSets.length - 1] || resultSets[0] || null;
            return {
              ok: true,
              error: null,
              engine: 'postgres',
              engineLabel: 'PostgreSQL 18.6 (PGlite WASM)',
              sql: sql,
              normalizedSql: norm.sql,
              dialectNotes: norm.notes,
              elapsedMs: elapsedMs,
              durationMs: elapsedMs,
              resultSets: resultSets,
              columns: primarySet ? primarySet.columns : [],
              columnTypes: primarySet ? primarySet.columnTypes : [],
              rows: primarySet ? primarySet.values : [],
              rowCount: primarySet ? primarySet.rowCount : 0,
              dmlDiff: dmlDiff,
              explain: explainNodes,
              plan: explainNodes
            };
          });
        }).catch(function (err) {
          var t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
          var elapsedMs = Math.max(0.05, Number((t1 - t0).toFixed(2)));
          return {
            ok: false,
            error: err && err.message ? err.message : String(err),
            engine: 'postgres',
            engineLabel: 'PostgreSQL 18.6 (PGlite WASM)',
            sql: sql,
            normalizedSql: norm.sql,
            dialectNotes: norm.notes,
            elapsedMs: elapsedMs,
            durationMs: elapsedMs,
            resultSets: [],
            columns: [],
            columnTypes: [],
            rows: [],
            rowCount: 0,
            dmlDiff: null,
            explain: [],
            plan: []
          };
        });
      });
    });
  }

  /**
   * Executes a SQL string and returns structured result sets, columnTypes, dmlDiff, timing, and EXPLAIN plan.
   */
  function execute(sql, options) {
    if (typeof options === 'string') {
      options = { datasetId: options };
    }
    options = options || {};
    var datasetId = options.datasetId || '__unified__';
    var includeExplain = options.explain !== false;
    var forceEngine = options.engine || _engineMode;

    // Use PostgreSQL 18 if active or if explicitly requested in Node
    if (forceEngine === 'postgres' && (_pgDb || !isBrowserEnv)) {
      return initPglite().then(function (pgDb) {
        return executePostgres(pgDb, sql, options);
      });
    }

    // Fallback or explicit SQLite 3 execution
    var dbGetter = datasetId === '__unified__'
      ? getUnifiedDatabase(Boolean(options.reset))
      : createDatabaseForDataset(datasetId, Boolean(options.reset));

    return dbGetter.then(function (db) {
      var dmlInfo = !options.skipDmlDiff ? detectDmlTarget(sql) : null;
      var beforeCols = [];
      var beforeRows = [];
      if (dmlInfo) {
        try {
          var bRes = db.exec('SELECT * FROM "' + dmlInfo.tableName + '" LIMIT 50;');
          if (bRes && bRes[0]) {
            beforeCols = bRes[0].columns || [];
            beforeRows = (bRes[0].values || []).map(function (r) { return r.slice(); });
          }
        } catch (e) {}
      }

      var norm = normalizeDialect(sql, false);
      var t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      var resultSets = [];
      var explainNodes = [];
      var error = null;

      try {
        var rawResults = db.exec(norm.sql);
        resultSets = (rawResults || []).map(function (r) {
          var cols = r.columns || [];
          var vals = r.values || [];
          return {
            columns: cols,
            columnTypes: inferSqliteColumnTypes(cols, vals),
            values: vals,
            rowCount: vals.length
          };
        });
      } catch (err) {
        error = err && err.message ? err.message : String(err);
      }

      var t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      var elapsedMs = Math.max(0.05, Number((t1 - t0).toFixed(2)));

      var dmlDiff = null;
      if (!error && dmlInfo) {
        try {
          var aRes = db.exec('SELECT * FROM "' + dmlInfo.tableName + '" LIMIT 50;');
          var afterCols = (aRes && aRes[0] && aRes[0].columns) ? aRes[0].columns : beforeCols;
          var afterRows = (aRes && aRes[0] && aRes[0].values) ? aRes[0].values : [];
          var retCols = resultSets[0] ? resultSets[0].columns : [];
          var retRows = resultSets[0] ? resultSets[0].values : [];
          dmlDiff = computeDmlDiff(dmlInfo, afterCols, beforeRows, afterRows, retCols, retRows);
          if (resultSets.length === 0) {
            resultSets.push({
              columns: dmlDiff.columns,
              columnTypes: inferSqliteColumnTypes(dmlDiff.columns, dmlDiff.afterRows),
              values: dmlDiff.afterRows,
              rowCount: dmlDiff.afterRows.length
            });
          }
        } catch (e) {}
      }

      if (!error && includeExplain) {
        explainNodes = explainQueryPlanSync(db, norm.sql);
      }

      var primarySet = resultSets[resultSets.length - 1] || resultSets[0] || null;

      return {
        ok: !error,
        error: error,
        engine: 'sqlite',
        engineLabel: 'SQLite 3 (sql.js WASM)',
        sql: sql,
        normalizedSql: norm.sql,
        dialectNotes: norm.notes,
        elapsedMs: elapsedMs,
        durationMs: elapsedMs,
        resultSets: resultSets,
        columns: primarySet ? primarySet.columns : [],
        columnTypes: primarySet ? primarySet.columnTypes : [],
        rows: primarySet ? primarySet.values : [],
        rowCount: primarySet ? primarySet.rowCount : 0,
        dmlDiff: dmlDiff,
        explain: explainNodes,
        plan: explainNodes
      };
    });
  }

  function explainQueryPlanSync(db, sql) {
    if (!db || !sql) return [];
    var trimmed = sql.trim().replace(/;+\s*$/, '');
    if (!/^(SELECT|WITH|UPDATE|DELETE)\b/i.test(trimmed)) return [];
    if (/^\s*EXPLAIN\b/i.test(trimmed)) return [];
    try {
      var res = db.exec('EXPLAIN QUERY PLAN ' + trimmed);
      if (!res || !res[0] || !res[0].values) return [];
      return res[0].values.map(function (row) {
        var id = row[0];
        var parent = row[1];
        var notused = row[2];
        var detail = String(row[3] || '');
        var kind = 'OPERATION';
        if (/SCAN\b/i.test(detail)) kind = 'FULL SCAN';
        if (/SEARCH\b.*USING.*COVERING INDEX/i.test(detail)) kind = 'COVERING INDEX SEEK';
        else if (/SEARCH\b.*USING.*INDEX|SEARCH\b.*USING.*PRIMARY KEY/i.test(detail)) kind = 'INDEX SEEK';
        else if (/TEMP B-TREE/i.test(detail)) kind = 'TEMP SORT / GROUP B-TREE';
        else if (/CO-ROUTINE|SUBQUERY/i.test(detail)) kind = 'SUBQUERY / CTE';
        return {
          id: id,
          parent: parent,
          notused: notused,
          detail: detail,
          kind: kind,
          isIndex: /INDEX|PRIMARY KEY/i.test(detail),
          isFullScan: /\bSCAN\b/i.test(detail) && !/COVERING INDEX/i.test(detail),
          isTempBTree: /TEMP B-TREE/i.test(detail)
        };
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Introspects all tables, columns, primary keys, foreign keys, and indexes in a dataset.
   */
  function introspectSchema(datasetId) {
    var dsId = datasetId || _activeDatasetId || 'ecommerce';
    return createDatabaseForDataset(dsId, false).then(function (db) {
      var tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
      var tableNames = (tablesRes[0] && tablesRes[0].values) ? tablesRes[0].values.map(function (r) { return r[0]; }) : [];

      return tableNames.map(function (tableName) {
        var colRes = db.exec('PRAGMA table_info("' + tableName + '");');
        var fkRes = db.exec('PRAGMA foreign_key_list("' + tableName + '");');
        var idxRes = db.exec('PRAGMA index_list("' + tableName + '");');
        var countRes = db.exec('SELECT COUNT(*) FROM "' + tableName + '";');
        var sampleRes = db.exec('SELECT * FROM "' + tableName + '" LIMIT 5;');

        var fksByCol = {};
        if (fkRes[0] && fkRes[0].values) {
          fkRes[0].values.forEach(function (fk) {
            fksByCol[fk[3]] = { targetTable: fk[2], targetColumn: fk[4] };
          });
        }

        var columns = (colRes[0] && colRes[0].values ? colRes[0].values : []).map(function (c) {
          var colName = c[1];
          return {
            cid: c[0],
            name: colName,
            type: c[2] || 'ANY',
            notNull: Boolean(c[3]),
            defaultValue: c[4],
            isPk: Boolean(c[5]),
            fk: fksByCol[colName] || null
          };
        });

        var indexes = (idxRes[0] && idxRes[0].values ? idxRes[0].values : []).map(function (idx) {
          return {
            name: idx[1],
            unique: Boolean(idx[2]),
            origin: idx[3]
          };
        });

        return {
          name: tableName,
          rowCount: (countRes[0] && countRes[0].values && countRes[0].values[0]) ? countRes[0].values[0][0] : 0,
          columns: columns,
          indexes: indexes,
          sampleColumns: sampleRes[0] ? sampleRes[0].columns : [],
          sampleRows: sampleRes[0] ? sampleRes[0].values : []
        };
      });
    });
  }

  function resetDataset(datasetId) {
    var dsId = datasetId || '__unified__';
    var sqlitePromise = (!dsId || dsId === '__unified__')
      ? getUnifiedDatabase(true)
      : createDatabaseForDataset(dsId, true);

    if (_pgDb) {
      return Promise.all([
        seedPostgresDataset(_pgDb, dsId, true),
        sqlitePromise
      ]).then(function () {
        return _pgDb;
      });
    }
    return sqlitePromise;
  }

  function setActiveDataset(datasetId) {
    if (root.SQL_DATASETS && root.SQL_DATASETS[datasetId]) {
      _activeDatasetId = datasetId;
    }
    return _activeDatasetId;
  }

  function getActiveDataset() {
    return _activeDatasetId;
  }

  root.SqlEngine = {
    init: init,
    initPglite: initPglite,
    initSqlite: initSqlite,
    getEngineMode: getEngineMode,
    setEngineMode: setEngineMode,
    isPgliteReady: isPgliteReady,
    getEngineLabel: getEngineLabel,
    onEngineChange: onEngineChange,
    normalizeDialect: normalizeDialect,
    createDatabaseForDataset: createDatabaseForDataset,
    getUnifiedDatabase: getUnifiedDatabase,
    execute: execute,
    explainQueryPlanPg: explainQueryPlanPg,
    introspectSchema: introspectSchema,
    resetDataset: resetDataset,
    resetDatabase: resetDataset,
    setActiveDataset: setActiveDataset,
    getActiveDataset: getActiveDataset
  };
  root.SQLEngine = root.SqlEngine;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
