/**
 * SQL In Depth — Browser WASM SQLite Engine & Polyglot Dialect Shim (`window.SqlEngine`)
 * Powered by vendored sql.js (SQLite 3 compiled to WebAssembly).
 * Works both in the browser and in Node.js (for static build & verification).
 */
(function (root) {
  'use strict';

  var _sqlJsPromise = null;
  var _SQL = null;
  var _databases = {};
  var _activeDatasetId = 'ecommerce';

  function resolveWasmUrl(file) {
    if (typeof window !== 'undefined' && window.location) {
      return '/js/vendor/' + file;
    }
    return 'js/vendor/' + file;
  }

  function init() {
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
   * Normalizes common PostgreSQL / DuckDB / MySQL syntax idioms so they run cleanly
   * in SQLite 3 WASM while preserving semantics and returning dialect notes.
   */
  function normalizeDialect(sql) {
    if (!sql || typeof sql !== 'string') return { sql: '', notes: [] };
    var normalized = sql;
    var notes = [];

    // 1. PostgreSQL ::type casts -> CAST(... AS type) when simple identifier/literal
    if (/::[a-zA-Z_][a-zA-Z0-9_]*/.test(normalized)) {
      notes.push('PostgreSQL ::type cast normalized to standard SQL CAST(expr AS type) for WASM execution.');
      normalized = normalized.replace(/(\b[a-zA-Z0-9_.'"]+)\s*::\s*(numeric|decimal|float|real|double|int|integer|bigint|text|varchar|date|timestamp|timestamptz)/gi, function (_, expr, type) {
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
   * Builds or resets an in-memory WASM database for the specified dataset ID.
   */
  function createDatabaseForDataset(datasetId, forceReset) {
    var dsId = datasetId || _activeDatasetId || 'ecommerce';
    if (!forceReset && _databases[dsId]) {
      return Promise.resolve(_databases[dsId]);
    }

    return init().then(function (SQL) {
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
      } else {
        // Seed all datasets into default DB if requested
        Object.keys(datasets).forEach(function (k) {
          try { db.run(datasets[k].ddl); } catch (e) {}
        });
      }
      _databases[dsId] = db;
      return db;
    });
  }

  /**
   * Creates an isolated database seeded with all 5 datasets (so any lesson query can run
   * regardless of which dataset table it references).
   */
  function getUnifiedDatabase(forceReset) {
    if (!forceReset && _databases.__unified__) {
      return Promise.resolve(_databases.__unified__);
    }
    return init().then(function (SQL) {
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
   * Executes a SQL string and returns structured result sets, timing, and EXPLAIN QUERY PLAN.
   */
  function execute(sql, options) {
    options = options || {};
    var datasetId = options.datasetId || '__unified__';
    var includeExplain = options.explain !== false;

    var dbGetter = datasetId === '__unified__'
      ? getUnifiedDatabase(Boolean(options.reset))
      : createDatabaseForDataset(datasetId, Boolean(options.reset));

    return dbGetter.then(function (db) {
      var norm = normalizeDialect(sql);
      var t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      var resultSets = [];
      var explainNodes = [];
      var error = null;

      try {
        var rawResults = db.exec(norm.sql);
        resultSets = (rawResults || []).map(function (r) {
          return {
            columns: r.columns || [],
            values: r.values || [],
            rowCount: (r.values || []).length
          };
        });
      } catch (err) {
        error = err && err.message ? err.message : String(err);
      }

      var t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      var elapsedMs = Math.max(0.05, Number((t1 - t0).toFixed(2)));

      if (!error && includeExplain) {
        explainNodes = explainQueryPlanSync(db, norm.sql);
      }

      return {
        ok: !error,
        error: error,
        sql: sql,
        normalizedSql: norm.sql,
        dialectNotes: norm.notes,
        elapsedMs: elapsedMs,
        resultSets: resultSets,
        columns: resultSets[0] ? resultSets[0].columns : [],
        rows: resultSets[0] ? resultSets[0].values : [],
        rowCount: resultSets[0] ? resultSets[0].rowCount : 0,
        explain: explainNodes
      };
    });
  }

  function explainQueryPlanSync(db, sql) {
    if (!db || !sql) return [];
    var trimmed = sql.trim().replace(/;+\s*$/, '');
    // Only run EXPLAIN QUERY PLAN on single SELECT / WITH / UPDATE / DELETE statements
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
    if (!datasetId || datasetId === '__unified__') {
      return getUnifiedDatabase(true);
    }
    return createDatabaseForDataset(datasetId, true);
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
    normalizeDialect: normalizeDialect,
    createDatabaseForDataset: createDatabaseForDataset,
    getUnifiedDatabase: getUnifiedDatabase,
    execute: execute,
    introspectSchema: introspectSchema,
    resetDataset: resetDataset,
    setActiveDataset: setActiveDataset,
    getActiveDataset: getActiveDataset
  };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
