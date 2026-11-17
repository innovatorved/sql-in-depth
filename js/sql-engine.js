/**
 * SQL In Depth — Dual-Engine Browser WASM SQL Runner (`window.SqlEngine`)
 * Primary Engine: PostgreSQL 18.6 (PGlite WebAssembly)
 * Secondary / Instant Fallback Engine: SQLite 3 (sql.js WebAssembly)
 * Works seamlessly in both the browser and Node.js (for build & verification).
 */
(function (root) {
  'use strict';

  var isBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof process === 'undefined';
  var isWorkerEnv = Boolean(root && root._IS_SQL_WORKER);
  var canUseWorker = isBrowserEnv
    && !isWorkerEnv
    && typeof Worker === 'function'
    && typeof window.location !== 'undefined'
    && /^https?:$/i.test(window.location.protocol);

  var _savedEngineMode = null;
  try {
    if (isBrowserEnv && typeof localStorage !== 'undefined' && localStorage) {
      _savedEngineMode = localStorage.getItem('sql-in-depth-engine-mode');
    }
  } catch (e) {}
  var _engineMode = (_savedEngineMode === 'postgres' || _savedEngineMode === 'sqlite')
    ? _savedEngineMode
    : 'sqlite';
  var _engineListeners = [];

  // Dedicated Web Worker RPC state (main thread -> js/sql-worker.js)
  var _worker = null;
  var _workerSeq = 0;
  var _workerPending = {};
  var _workerFailed = false;
  var _workerPgReady = false;

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

  function getAssetHash(relPath) {
    var clean = String(relPath || '').replace(/^\/+/, '');
    if (typeof root !== 'undefined' && root) {
      if (root.LAZY_MANIFEST && root.LAZY_MANIFEST[clean]) return root.LAZY_MANIFEST[clean];
      if (root._LAZY_MANIFEST && root._LAZY_MANIFEST[clean]) return root._LAZY_MANIFEST[clean];
      if (root.ASSET_VERSION) return root.ASSET_VERSION;
      if (root._ASSET_VERSION) return root._ASSET_VERSION;
    }
    return 'pg186-v2';
  }

  function getWorker() {
    if (!canUseWorker || _workerFailed) return null;
    if (_worker) return _worker;
    try {
      var workerHash = getAssetHash('js/sql-worker.js');
      var ver = workerHash ? ('?v=' + encodeURIComponent(workerHash)) : '';
      _worker = new Worker('/js/sql-worker.js' + ver);
      _worker.onmessage = function (ev) {
        var msg = ev && ev.data ? ev.data : {};
        if (msg.type === 'engineChange') {
          var prev = _workerPgReady;
          _workerPgReady = Boolean(msg.pgliteReady);
          if (prev !== _workerPgReady) notifyEngineListeners();
          return;
        }
        if (typeof msg.pgliteReady === 'boolean') {
          var changedReady = _workerPgReady !== msg.pgliteReady;
          _workerPgReady = msg.pgliteReady;
          if (changedReady) notifyEngineListeners();
        }
        var entry = msg.id ? _workerPending[msg.id] : null;
        if (!entry) return;
        delete _workerPending[msg.id];
        if (entry.timer) clearTimeout(entry.timer);
        if (msg.ok) {
          entry.resolve(msg.result);
        } else {
          entry.reject(new Error(msg.error || 'SQL Worker execution failed'));
        }
      };
      _worker.onerror = function (err) {
        _workerFailed = true;
        var keys = Object.keys(_workerPending);
        keys.forEach(function (k) {
          var pending = _workerPending[k];
          delete _workerPending[k];
          if (pending && pending.timer) clearTimeout(pending.timer);
          if (pending) pending.reject(err || new Error('SQL Worker crashed'));
        });
        try { _worker.terminate(); } catch (e) {}
        _worker = null;
      };
      return _worker;
    } catch (e) {
      _workerFailed = true;
      _worker = null;
      return null;
    }
  }

  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error(label || ('Operation timed out after ' + ms + 'ms')));
      }, ms);
      Promise.resolve(promise).then(function (val) {
        clearTimeout(timer);
        resolve(val);
      }, function (err) {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function workerCall(action, payload) {
    var w = getWorker();
    if (!w) return Promise.reject(new Error('SQL Worker unavailable'));
    var timeoutMs = (action === 'initPglite' || action === 'setEngineMode' || action === 'execute') ? 30000 : 15000;
    return new Promise(function (resolve, reject) {
      var id = 'sqlw_' + (++_workerSeq);
      var timer = setTimeout(function () {
        if (_workerPending[id]) {
          delete _workerPending[id];
          reject(new Error('SQL Worker ' + action + ' timed out'));
        }
      }, timeoutMs);
      _workerPending[id] = { resolve: resolve, reject: reject, timer: timer };
      w.postMessage({
        id: id,
        action: action,
        payload: payload || {},
        assetVersion: (typeof window !== 'undefined' && window.ASSET_VERSION) ? window.ASSET_VERSION : getAssetHash('js/sql-engine.js'),
        lazyManifest: (typeof window !== 'undefined' && window.LAZY_MANIFEST) ? window.LAZY_MANIFEST : null
      });
    });
  }

  var PG_OID_MAP = {
    16: 'BOOL',
    17: 'BYTEA',
    20: 'BIGINT',
    21: 'SMALLINT',
    23: 'INTEGER',
    25: 'TEXT',
    26: 'OID',
    27: 'TID',
    28: 'XID',
    114: 'JSON',
    700: 'REAL',
    701: 'DOUBLE',
    1000: 'BOOL[]',
    1007: 'INT4[]',
    1009: 'TEXT[]',
    1016: 'INT8[]',
    1042: 'CHAR',
    1043: 'VARCHAR',
    1082: 'DATE',
    1083: 'TIME',
    1114: 'TIMESTAMP',
    1184: 'TIMESTAMPTZ',
    1186: 'INTERVAL',
    1700: 'NUMERIC',
    2950: 'UUID',
    3220: 'PG_LSN',
    3614: 'TSVECTOR',
    3615: 'TSQUERY',
    3802: 'JSONB',
    3904: 'INT4RANGE',
    3906: 'NUMRANGE',
    3908: 'TSRANGE',
    3910: 'TSTZRANGE',
    3912: 'DATERANGE'
  };

  var PG_CONTRIB_NAMES = [
    'pg_trgm',
    'btree_gist',
    'ltree',
    'pageinspect',
    'pg_buffercache',
    'pg_freespacemap',
    'pg_visibility'
  ];

  function serializePgCell(cell) {
    if (cell === null || typeof cell === 'undefined') return null;
    if (cell instanceof Date) return cell.toISOString();
    if (typeof cell === 'bigint') return Number(cell);
    if (typeof Uint8Array !== 'undefined' && cell instanceof Uint8Array) {
      var hex = '';
      var cap = Math.min(cell.length, 64);
      for (var i = 0; i < cap; i++) {
        hex += cell[i].toString(16).padStart(2, '0');
      }
      return '\\x' + hex + (cell.length > cap ? '…' : '');
    }
    if (Array.isArray(cell)) {
      return JSON.stringify(cell.map(serializePgCell));
    }
    if (typeof cell === 'object') return JSON.stringify(cell);
    return cell;
  }

  function buildPgliteExtensionsConfig() {
    var extMap = {};
    var originUrl = (root && root.location && root.location.origin && /^https?:/i.test(root.location.origin))
      ? root.location.origin
      : null;

    PG_CONTRIB_NAMES.forEach(function (extName) {
      if ((isBrowserEnv || isWorkerEnv) && originUrl) {
        var extHash = encodeURIComponent(getAssetHash('js/vendor/pglite/' + extName + '.tar.gz'));
        var bundleUrl = new URL('/js/vendor/pglite/' + extName + '.tar.gz?v=' + extHash, originUrl);
        extMap[extName] = {
          name: extName,
          setup: function () {
            return Promise.resolve({ bundlePath: bundleUrl });
          }
        };
      } else if (typeof require === 'function') {
        try {
          var contribMod = require('@electric-sql/pglite/contrib/' + extName);
          if (contribMod && contribMod[extName]) {
            extMap[extName] = contribMod[extName];
          }
        } catch (e) {}
      }
    });
    return extMap;
  }

  function resolveWasmUrl(file) {
    if ((typeof window !== 'undefined' && window.location) || isWorkerEnv) {
      var wasmVer = getAssetHash('js/vendor/' + file);
      return '/js/vendor/' + file + (wasmVer ? ('?v=' + encodeURIComponent(wasmVer)) : '');
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
    return Boolean(_pgDb || _workerPgReady);
  }

  function getEngineLabel() {
    if (_engineMode === 'postgres') {
      return isPgliteReady() ? 'PostgreSQL 18.6 (PGlite WASM)' : 'PostgreSQL 18.6 (Initializing WASM…)';
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
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('sql-in-depth-engine-mode', _engineMode);
      }
    } catch (e) {}
    if (changed) {
      notifyEngineListeners();
    }
    if (canUseWorker && !_workerFailed) {
      return workerCall('setEngineMode', { mode: _engineMode }).then(function () {
        return _engineMode;
      }).catch(function () {
        if (_engineMode === 'postgres') {
          return initPglite().catch(function () {
            return initSqlite();
          }).then(function () {
            return _engineMode;
          });
        }
        return initSqlite().then(function () {
          return _engineMode;
        });
      });
    }
    if (_engineMode === 'postgres') {
      return initPglite().catch(function () {
        return initSqlite();
      }).then(function () {
        return _engineMode;
      });
    }
    return initSqlite().then(function () {
      return _engineMode;
    });
  }

  /**
   * Initializes SQLite 3 (sql.js WASM).
   */
  function initSqlite() {
    if (canUseWorker && !_workerFailed) {
      return workerCall('initSqlite', {}).catch(function () {
        return initSqliteLocal();
      });
    }
    return initSqliteLocal();
  }

  function initSqliteLocal() {
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

  function isCustomOrEmptyDataset(dsId) {
    var s = String(dsId || '');
    return s === '__empty__' || s.indexOf('custom:') === 0;
  }

  function isPgOpsDataset(dsId) {
    var s = String(dsId || '');
    return Boolean(s && root.PG_DATASETS && root.PG_DATASETS[s]);
  }

  function pgSchemaForDataset(dsId) {
    var s = String(dsId || '');
    if (s === '__empty__') return 'ws_empty';
    if (s.indexOf('custom:') === 0) {
      var slug = s.slice(7).toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '').slice(0, 48);
      return 'ws_' + (slug || 'custom');
    }
    if (isPgOpsDataset(s)) {
      return root.PG_DATASETS[s].schema || 'pg_ops';
    }
    return 'public';
  }

  /**
   * Seeds or resets a dataset inside the PGlite PostgreSQL 18 instance.
   */
  function seedPostgresDataset(pgDb, datasetId, forceReset) {
    var dsId = datasetId || _activeDatasetId || '__unified__';
    if (isCustomOrEmptyDataset(dsId)) {
      var customSchema = pgSchemaForDataset(dsId);
      var schemaSql = forceReset
        ? ('DROP SCHEMA IF EXISTS "' + customSchema + '" CASCADE; CREATE SCHEMA "' + customSchema + '"; SET search_path TO "' + customSchema + '";')
        : ('CREATE SCHEMA IF NOT EXISTS "' + customSchema + '"; SET search_path TO "' + customSchema + '";');
      return pgDb.exec(schemaSql).then(function () {
        return pgDb;
      });
    }

    if (isPgOpsDataset(dsId)) {
      var pgDs = root.PG_DATASETS[dsId];
      var pgSchema = pgDs.schema || 'pg_ops';
      var ensurePublic = seedPostgresDataset(pgDb, '__unified__', false);
      return ensurePublic.then(function () {
        if (!forceReset && _pgSeededDatasets[dsId]) {
          return pgDb.exec('SET search_path TO "' + pgSchema + '", public;').catch(function () {}).then(function () {
            return pgDb;
          });
        }
        var opsParts = [];
        if (forceReset || _pgSeededDatasets[dsId]) {
          opsParts.push('DROP SCHEMA IF EXISTS "' + pgSchema + '" CASCADE;');
        }
        opsParts.push(cleanDdlForPostgres(pgDs.ddl));
        opsParts.push('SET search_path TO "' + pgSchema + '", public;');
        opsParts.push('ANALYZE;');
        return pgDb.exec(opsParts.join('\n')).then(function () {
          _pgSeededDatasets[dsId] = true;
          return pgDb;
        }).catch(function () {
          var retryOps = 'DROP SCHEMA IF EXISTS "' + pgSchema + '" CASCADE;\n' + cleanDdlForPostgres(pgDs.ddl) + '\nSET search_path TO "' + pgSchema + '", public;\nANALYZE;';
          return pgDb.exec(retryOps).then(function () {
            _pgSeededDatasets[dsId] = true;
            return pgDb;
          });
        });
      });
    }

    var datasets = root.SQL_DATASETS || {};
    var targetKeys = (dsId === '__unified__' || !datasets[dsId])
      ? Object.keys(datasets)
      : [dsId];

    var toSeed = targetKeys.filter(function (k) {
      return forceReset || !_pgSeededDatasets[k];
    });

    if (toSeed.length === 0) {
      return pgDb.exec('SET search_path TO public;').catch(function () {}).then(function () {
        return pgDb;
      });
    }

    var sqlParts = ['SET search_path TO public;'];
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
    sqlParts.push('ANALYZE;');

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
      var retryParts = ['SET search_path TO public;'];
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
      retryParts.push('ANALYZE;');
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
   * Initializes PostgreSQL 18.6 (PGlite WASM), loads contrib extensions, and seeds datasets.
   */
  function initPglite() {
    if (canUseWorker && !_workerFailed) {
      return workerCall('initPglite', {}).then(function (res) {
        _workerPgReady = true;
        notifyEngineListeners();
        return res;
      }).catch(function () {
        return initPgliteLocal();
      });
    }
    return initPgliteLocal();
  }

  function initPgliteLocal() {
    if (_pgDb) return Promise.resolve(_pgDb);
    if (_pglitePromise) return _pglitePromise;

    var loaderPromise;
    var pgEntryHash = encodeURIComponent(getAssetHash('js/vendor/pglite/index.js'));
    if (isBrowserEnv || isWorkerEnv) {
      loaderPromise = import('/js/vendor/pglite/index.js?v=' + pgEntryHash);
    } else if (typeof require === 'function') {
      try {
        loaderPromise = Promise.resolve(require('@electric-sql/pglite'));
      } catch (e) {
        loaderPromise = import('@electric-sql/pglite');
      }
    } else {
      loaderPromise = import('/js/vendor/pglite/index.js?v=' + pgEntryHash);
    }

    _pglitePromise = loaderPromise.then(function (mod) {
      _PGliteClass = mod.PGlite || (mod.default && mod.default.PGlite) || mod.default;
      if (!_PGliteClass) {
        throw new Error('PGlite constructor not found in module exports.');
      }
      var extConfig = buildPgliteExtensionsConfig();
      var hasExts = Object.keys(extConfig).length > 0;
      var instance = hasExts ? new _PGliteClass({ extensions: extConfig }) : new _PGliteClass();
      return withTimeout(instance.waitReady || Promise.resolve(), 25000, 'PostgreSQL WASM initialization timed out').then(function () {
        // Install contrib extensions one by one so any missing optional bundle never blocks startup
        var extChain = Promise.resolve();
        PG_CONTRIB_NAMES.forEach(function (extName) {
          if (extConfig[extName]) {
            extChain = extChain.then(function () {
              return instance.exec('CREATE EXTENSION IF NOT EXISTS "' + extName + '" WITH SCHEMA public;').catch(function () {});
            });
          }
        });
        return extChain.then(function () {
          // Install compatibility helper overloads so both PostgreSQL and SQLite idioms work seamlessly
          var compatSql = [
            'CREATE OR REPLACE FUNCTION pg_catalog.round(double precision, integer) RETURNS numeric AS $$ SELECT pg_catalog.round($1::numeric, $2); $$ LANGUAGE SQL IMMUTABLE;',
            'CREATE OR REPLACE FUNCTION datetime(text) RETURNS timestamp AS $$ SELECT CURRENT_TIMESTAMP::timestamp; $$ LANGUAGE SQL STABLE;',
            'CREATE OR REPLACE FUNCTION instr(text, text) RETURNS integer AS $$ SELECT pg_catalog.strpos($1, $2); $$ LANGUAGE SQL IMMUTABLE;'
          ].join('\n');
          return instance.exec(compatSql).catch(function () {});
        }).then(function () {
          return seedPostgresDataset(instance, '__unified__', false);
        }).then(function () {
          if (root.PG_DATASETS && root.PG_DATASETS.pg_ops_telemetry) {
            return seedPostgresDataset(instance, 'pg_ops_telemetry', false).then(function () {
              return instance.exec('SET search_path TO public;').catch(function () {});
            });
          }
          return null;
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
    if (_engineMode === 'postgres' && !isPgliteReady()) {
      initPglite().catch(function () {});
    }
    return initSqlite();
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

    // Normalize orders.status = 'paid' alias to 'completed' when querying ecommerce orders table
    if (/\borders\b/i.test(normalized) && !/\binvoices\b/i.test(normalized) && /\b(?:o\.|orders\.)?status\s*=\s*'paid'/i.test(normalized)) {
      normalized = normalized.replace(/\b(o\.|orders\.)?status\s*=\s*'paid'/gi, function (_, prefix) {
        return (prefix || '') + "status = 'completed'";
      });
    }

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

    return initSqliteLocal().then(function (SQL) {
      if (!forceReset && _databases[dsId]) {
        return _databases[dsId];
      }
      if (_databases[dsId]) {
        try { _databases[dsId].close(); } catch (e) {}
      }
      var db = new SQL.Database();
      if (isCustomOrEmptyDataset(dsId)) {
        _databases[dsId] = db;
        return db;
      }
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
    return initSqliteLocal().then(function (SQL) {
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
    var mInsert = /^\s*INSERT\s+(?:OR\s+\w+\s+)?INTO\s+(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?["`]?([a-zA-Z_][a-zA-Z0-9_]*)["`]?/i.exec(clean);
    if (mInsert) return { operation: 'INSERT', tableName: mInsert[1] };
    var mUpdate = /^\s*UPDATE\s+(?:OR\s+\w+\s+|ONLY\s+)?(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?["`]?([a-zA-Z_][a-zA-Z0-9_]*)["`]?/i.exec(clean);
    if (mUpdate) return { operation: 'UPDATE', tableName: mUpdate[1] };
    var mDelete = /^\s*DELETE\s+FROM\s+(?:ONLY\s+)?(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?["`]?([a-zA-Z_][a-zA-Z0-9_]*)["`]?/i.exec(clean);
    if (mDelete) return { operation: 'DELETE', tableName: mDelete[1] };
    var mMerge = /^\s*MERGE\s+INTO\s+(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?["`]?([a-zA-Z_][a-zA-Z0-9_]*)["`]?/i.exec(clean);
    if (mMerge) return { operation: 'MERGE', tableName: mMerge[1] };
    var mTrunc = /^\s*TRUNCATE\s+(?:TABLE\s+)?(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?["`]?([a-zA-Z_][a-zA-Z0-9_]*)["`]?/i.exec(clean);
    if (mTrunc) return { operation: 'DELETE', tableName: mTrunc[1] };
    return null;
  }

  /**
   * Finds primary key column names for a given table from `root.SQL_DATASETS`, `root.PG_DATASETS`, or heuristics.
   */
  function findPrimaryKeyColumns(tableName, columns) {
    var allDatasetMaps = [root.SQL_DATASETS || {}, root.PG_DATASETS || {}];
    var pkCols = [];
    allDatasetMaps.forEach(function (datasets) {
      Object.keys(datasets).forEach(function (dsKey) {
        var ds = datasets[dsKey];
        if (!ds || !Array.isArray(ds.tables)) return;
        ds.tables.forEach(function (t) {
          if (t && t.name && t.name.toLowerCase() === String(tableName).toLowerCase() && t.pk) {
            pkCols = String(t.pk).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
          }
        });
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

  function formatPgResultSet(r) {
    var cols = (r && r.fields ? r.fields : []).map(function (f) { return f.name; });
    var colTypes = (r && r.fields ? r.fields : []).map(function (f) { return PG_OID_MAP[f.dataTypeID] || 'ANY'; });
    var rows = (r && r.rows ? r.rows : []).map(function (row) {
      return row.map(serializePgCell);
    });
    return {
      columns: cols,
      columnTypes: colTypes,
      values: rows,
      rowCount: rows.length,
      affectedRows: (r && r.affectedRows) || 0
    };
  }

  /**
   * Executes a SQL string on PostgreSQL 18 (PGlite WASM).
   * Supports `options.isolatedTx` (savepoint rollback after execution & optional `options.probeSql`),
   * `options.setupSql` (pre-execution setup statements), and `pg_ops_telemetry` search_path routing.
   */
  function executePostgres(pgDb, sql, options) {
    var datasetId = options.datasetId || '__unified__';
    var includeExplain = options.explain !== false;
    var isolatedTx = Boolean(options.isolatedTx || options.rollbackAfter);
    var setupSql = options.setupSql ? String(options.setupSql) : '';
    var probeSql = options.probeSql ? String(options.probeSql) : '';
    var dmlInfo = !options.skipDmlDiff ? detectDmlTarget(sql) : null;

    return seedPostgresDataset(pgDb, datasetId, Boolean(options.reset)).then(function () {
      var norm = normalizeDialect(sql, true);
      var combinedCheck = setupSql + '\n' + norm.sql;
      var hasExplicitTxOrVacuum = /\b(VACUUM\b|BEGIN\b|START\s+TRANSACTION\b|COMMIT\b|ROLLBACK\b|CONCURRENTLY\b)/i.test(combinedCheck);
      var useTxWrap = isolatedTx && !hasExplicitTxOrVacuum;
      var needsHardResetAfter = isolatedTx && hasExplicitTxOrVacuum;

      function finishCleanup(passthroughVal, isErr) {
        var cleanPromise = Promise.resolve();
        if (useTxWrap) {
          cleanPromise = pgDb.exec('ROLLBACK;').catch(function () {});
        } else if (needsHardResetAfter) {
          cleanPromise = pgDb.exec('ROLLBACK;').catch(function () {}).then(function () {
            return seedPostgresDataset(pgDb, datasetId, true).catch(function () {});
          });
        }
        return cleanPromise.then(function () {
          if (isErr) throw passthroughVal;
          return passthroughVal;
        });
      }

      var txStartPromise = useTxWrap
        ? pgDb.exec('ROLLBACK;').catch(function () {}).then(function () {
            return pgDb.exec('BEGIN; SAVEPOINT _sid_lab_sp;');
          })
        : Promise.resolve();

      return txStartPromise.then(function () {
        if (!setupSql.trim()) return null;
        return pgDb.exec(setupSql);
      }).then(function () {
        var beforePromise = dmlInfo
          ? pgDb.exec('SELECT * FROM "' + dmlInfo.tableName + '" LIMIT 50;', { rowMode: 'array' }).catch(function () { return []; })
          : Promise.resolve(null);

        return beforePromise.then(function (beforeRaw) {
          var beforeCols = (beforeRaw && beforeRaw[0] && beforeRaw[0].fields)
            ? beforeRaw[0].fields.map(function (f) { return f.name; })
            : [];
          var beforeRows = (beforeRaw && beforeRaw[0] && beforeRaw[0].rows)
            ? beforeRaw[0].rows.map(function (r) { return r.map(serializePgCell); })
            : [];

          var t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

          return pgDb.exec(norm.sql, { rowMode: 'array' }).then(function (rawResults) {
            var t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            var elapsedMs = Math.max(0.05, Number((t1 - t0).toFixed(2)));

            var resultSets = (rawResults || []).filter(function (r) {
              return (r.fields && r.fields.length > 0) || (r.rows && r.rows.length > 0);
            }).map(formatPgResultSet);

            var afterPromise = dmlInfo
              ? pgDb.exec('SELECT * FROM "' + dmlInfo.tableName + '" LIMIT 50;', { rowMode: 'array' }).catch(function () { return []; })
              : Promise.resolve(null);

            var probePromise = probeSql.trim()
              ? pgDb.exec(probeSql, { rowMode: 'array' }).then(function (pRaw) {
                  var pSets = (pRaw || []).filter(function (r) {
                    return (r.fields && r.fields.length > 0) || (r.rows && r.rows.length > 0);
                  }).map(formatPgResultSet);
                  var lastP = pSets[pSets.length - 1] || pSets[0] || null;
                  return lastP ? {
                    columns: lastP.columns,
                    columnTypes: lastP.columnTypes,
                    rows: lastP.values,
                    rowCount: lastP.rowCount
                  } : { columns: [], columnTypes: [], rows: [], rowCount: 0 };
                }).catch(function (pErr) {
                  return { error: pErr && pErr.message ? pErr.message : String(pErr), columns: [], rows: [], rowCount: 0 };
                })
              : Promise.resolve(null);

            return afterPromise.then(function (afterRaw) {
              return probePromise.then(function (probeRes) {
                var explainTarget = probeSql && !/^(SELECT|WITH)\b/i.test(norm.sql.trim()) ? probeSql : norm.sql;
                var explainPromise = includeExplain ? explainQueryPlanPg(pgDb, explainTarget) : Promise.resolve([]);
                return explainPromise.then(function (explainRes) {
                  return [afterRaw, explainRes, probeRes];
                });
              });
            }).then(function (postTriple) {
              var afterRaw = postTriple[0];
              var explainNodes = postTriple[1] || [];
              var probeRes = postTriple[2] || null;
              var dmlDiff = null;

              if (dmlInfo && afterRaw && afterRaw[0]) {
                var formattedAfter = formatPgResultSet(afterRaw[0]);
                var retCols = resultSets[0] ? resultSets[0].columns : [];
                var retRows = resultSets[0] ? resultSets[0].values : [];
                dmlDiff = computeDmlDiff(
                  dmlInfo,
                  formattedAfter.columns.length ? formattedAfter.columns : beforeCols,
                  beforeRows,
                  formattedAfter.values,
                  retCols,
                  retRows
                );
                if (resultSets.length === 0) {
                  resultSets.push({
                    columns: dmlDiff.columns,
                    columnTypes: formattedAfter.columnTypes,
                    values: dmlDiff.afterRows,
                    rowCount: dmlDiff.afterRows.length
                  });
                }
              }

              var primarySet = resultSets[resultSets.length - 1] || resultSets[0] || null;
              var payload = {
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
                probeResult: probeRes,
                explain: explainNodes,
                plan: explainNodes
              };
              return finishCleanup(payload, false);
            });
          });
        });
      }).catch(function (err) {
        var errMsg = err && err.message ? err.message : String(err);
        var failPayload = {
          ok: false,
          error: errMsg,
          errorHint: getErrorHint(errMsg, sql),
          engine: 'postgres',
          engineLabel: 'PostgreSQL 18.6 (PGlite WASM)',
          sql: sql,
          normalizedSql: norm.sql,
          dialectNotes: norm.notes,
          elapsedMs: 0.1,
          durationMs: 0.1,
          resultSets: [],
          columns: [],
          columnTypes: [],
          rows: [],
          rowCount: 0,
          dmlDiff: null,
          probeResult: null,
          explain: [],
          plan: []
        };
        return finishCleanup(failPayload, false);
      });
    });
  }

  /**
   * Produces a concise, pedagogical fix hint for common SQL and PostgreSQL 18 errors.
   */
  function getErrorHint(errorMessage, sql) {
    if (!errorMessage) return null;
    var msg = String(errorMessage);
    var query = String(sql || '');

    if (/current transaction is aborted/i.test(msg)) {
      return 'PostgreSQL aborted the open transaction after an earlier error. Run `ROLLBACK;` (or click **Reset DB**) to clear the aborted transaction block before running new queries.';
    }

    if (/cannot execute VACUUM inside a transaction block/i.test(msg)) {
      return '`VACUUM` and `VACUUM FULL` cannot run inside an explicit `BEGIN ... COMMIT` transaction block in PostgreSQL. Run `VACUUM` as a standalone top-level command.';
    }

    if (/violates exclusion constraint/i.test(msg)) {
      return 'GiST `EXCLUDE` constraint rejected an overlapping range (e.g., double-booking the same room during overlapping `TSTZRANGE` bounds). Check `[start, end)` half-open interval bounds or filter overlaps with `NOT EXISTS (... && ...)`.';
    }

    if (/violates row-level security policy/i.test(msg)) {
      return 'Row-Level Security (`RLS`) blocked this row visibility or write. Verify `SET LOCAL app.tenant_id = \'...\'` matches the policy\'s `USING` / `WITH CHECK` predicate.';
    }

    if (/no unique or exclusion constraint matching the ON CONFLICT/i.test(msg)) {
      return '`INSERT ... ON CONFLICT (col)` requires a `PRIMARY KEY` or `UNIQUE` index on the conflict target column(s) so PostgreSQL can detect duplicates atomically.';
    }

    if (/ON CONFLICT DO UPDATE command cannot affect row a second time/i.test(msg)) {
      return 'Your single `INSERT` batch contains duplicate keys for the same conflict target. Deduplicate the source rows (for example with `DISTINCT ON`) before upserting.';
    }

    if (/operator does not exist:\s*jsonb\s*=/i.test(msg) || /operator does not exist:\s*json\s*=/i.test(msg)) {
      return 'Use `->>` (text extraction) when comparing a JSON scalar to `TEXT`, or `@>` (JSONB containment, e.g. `payload @> \'{"role":"admin"}\'::jsonb`) so GIN indexes remain SARGable.';
    }

    if (/operator does not exist|function .* does not exist/i.test(msg)) {
      return 'PostgreSQL enforces strict static typing and does not silently coerce mismatched types. Add an explicit cast (such as `::text`, `::numeric`, `::timestamptz`, or `::jsonb`).';
    }

    var colMatch = /(?:no such column:\s*|column\s+"?)([a-zA-Z0-9_.]+)"?\s*(?:does not exist|$)/i.exec(msg);
    if (colMatch) {
      var missingCol = colMatch[1].split('.').pop();
      var aliasRe = new RegExp('\\bAS\\s+["`]?(' + missingCol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')["`]?\\b', 'i');
      if (aliasRe.test(query) && /\b(WHERE|GROUP\s+BY|HAVING)\b/i.test(query)) {
        return 'Logical execution order: WHERE and GROUP BY run BEFORE SELECT, so SELECT aliases like `' + missingCol + '` do not exist yet. Repeat the expression, or wrap the query in a CTE (`WITH step AS (...)`).';
      }
      return 'Column `' + colMatch[1] + '` was not found on the referenced tables. Open the Schema Browser to inspect exact column names or qualify with a table alias.';
    }

    var tblMatch = /(?:no such table:\s*|relation\s+"?)([a-zA-Z0-9_.]+)"?\s*(?:does not exist|$)/i.exec(msg);
    if (tblMatch) {
      return 'Table `' + tblMatch[1] + '` does not exist in the current scope. Check spelling in the Schema Browser or verify the active dataset.';
    }

    if (/misuse of aggregate|aggregate functions are not allowed in WHERE/i.test(msg)) {
      return '`WHERE` filters individual rows before grouping. Move aggregate conditions (`COUNT`, `SUM`, `AVG`) into a `HAVING` clause after `GROUP BY`.';
    }

    if (/must appear in the GROUP BY clause|not in GROUP BY/i.test(msg)) {
      return 'Every non-aggregated column in `SELECT` must either appear in `GROUP BY` or be wrapped in an aggregate (`SUM`, `MAX`, `MIN`, `COUNT`).';
    }

    if (/misuse of window function|window functions are not allowed in WHERE/i.test(msg)) {
      return 'Window functions (`OVER (...)`) execute during projection after `WHERE`/`GROUP BY`. Wrap the windowed query in a `WITH ranked AS (...)` CTE and filter in the outer `SELECT`.';
    }

    if (/ambiguous column name|column reference .* is ambiguous/i.test(msg)) {
      return 'Multiple joined tables share that column name. Prefix it with the table alias (for example `o.id` or `c.id`).';
    }

    if (/near "FROM": syntax error|syntax error at or near "FROM"/i.test(msg)) {
      return 'Check for a trailing comma right before `FROM` in your `SELECT` column list.';
    }

    if (/syntax error/i.test(msg)) {
      return 'Check for unbalanced parentheses, missing commas between projected columns, or a `JOIN` missing its `ON` predicate.';
    }

    return null;
  }

  /**
   * Executes a SQL string and returns structured result sets, columnTypes, dmlDiff, timing, and EXPLAIN plan.
   */
  function execute(sql, options, thirdOptions) {
    if (typeof options === 'string') {
      options = Object.assign({ datasetId: options }, thirdOptions || {});
    }
    options = options || {};
    var datasetId = options.datasetId || '__unified__';
    var includeExplain = options.explain !== false;
    var explicitEngine = options.engine || (isPgOpsDataset(datasetId) ? 'postgres' : null);
    var forceEngine = explicitEngine || _engineMode;

    if (canUseWorker && !_workerFailed) {
      var workerOpts = Object.assign({}, options, {
        datasetId: datasetId,
        explain: includeExplain,
        engine: forceEngine
      });
      return workerCall('execute', { sql: sql, options: workerOpts }).catch(function () {
        return executeLocal(sql, options, datasetId, includeExplain, explicitEngine, forceEngine);
      });
    }

    return executeLocal(sql, options, datasetId, includeExplain, explicitEngine, forceEngine);
  }

  function executeLocal(sql, options, datasetId, includeExplain, explicitEngine, forceEngine) {
    function runSqliteFallback() {
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
          errorHint: error ? getErrorHint(error, sql) : null,
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

    // Use PostgreSQL 18 when explicitly requested, when pg_ops dataset is used, or when PGlite is warm in postgres mode
    if (explicitEngine === 'postgres' || isPgOpsDataset(datasetId) || (forceEngine === 'postgres' && Boolean(_pgDb))) {
      return initPgliteLocal().then(function (pgDb) {
        return executePostgres(pgDb, sql, options);
      }).catch(function (bootErr) {
        if (explicitEngine === 'postgres' || isPgOpsDataset(datasetId)) {
          return {
            ok: false,
            error: bootErr && bootErr.message ? bootErr.message : String(bootErr),
            errorHint: 'PostgreSQL 18 WASM engine failed to initialize.',
            engine: 'postgres',
            engineLabel: 'PostgreSQL 18.6 (PGlite WASM)',
            sql: sql,
            normalizedSql: sql,
            dialectNotes: [],
            elapsedMs: 0.1,
            durationMs: 0.1,
            resultSets: [],
            columns: [],
            columnTypes: [],
            rows: [],
            rowCount: 0,
            dmlDiff: null,
            explain: [],
            plan: []
          };
        }
        return runSqliteFallback();
      });
    }

    // If in postgres mode while PGlite is still booting, warm PGlite in background and execute immediately on SQLite
    if (forceEngine === 'postgres' && !_pgDb) {
      initPgliteLocal().catch(function () {});
    }

    // Fallback or explicit SQLite 3 execution
    return runSqliteFallback();
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
  function introspectSchema(datasetId, options) {
    var dsId = datasetId || _activeDatasetId || 'ecommerce';
    var opts = options || {};
    if (isPgOpsDataset(dsId) && !opts.engine) {
      opts = Object.assign({}, opts, { engine: 'postgres' });
    }
    if (canUseWorker && !_workerFailed) {
      return workerCall('introspectSchema', { datasetId: dsId, options: opts }).catch(function () {
        return introspectSchemaLocal(dsId, opts);
      });
    }
    return introspectSchemaLocal(dsId, opts);
  }

  function introspectPostgresLocal(pgDb, dsId) {
    var schemaName = pgSchemaForDataset(dsId);
    var tablesSql = "SELECT table_name FROM information_schema.tables WHERE table_schema = '" + schemaName.replace(/'/g, "''") + "' AND table_type = 'BASE TABLE' ORDER BY table_name;";
    return pgDb.exec(tablesSql, { rowMode: 'array' }).then(function (tRes) {
      var tableNames = (tRes && tRes[0] && tRes[0].rows) ? tRes[0].rows.map(function (r) { return r[0]; }) : [];
      var targetMeta = (!isCustomOrEmptyDataset(dsId) && dsId && dsId !== '__unified__')
        ? ((root.SQL_DATASETS && root.SQL_DATASETS[dsId]) || (root.PG_DATASETS && root.PG_DATASETS[dsId]) || null)
        : null;
      if (targetMeta && Array.isArray(targetMeta.tables)) {
        var allowedSet = {};
        targetMeta.tables.forEach(function (t) {
          if (t && t.name) allowedSet[String(t.name).toLowerCase()] = true;
        });
        tableNames = tableNames.filter(function (name) {
          return Boolean(allowedSet[String(name).toLowerCase()]);
        });
      }
      var chain = Promise.resolve([]);
      tableNames.forEach(function (tableName) {
        chain = chain.then(function (acc) {
          var safeTbl = String(tableName).replace(/'/g, "''");
          var safeSch = schemaName.replace(/'/g, "''");
          var colSql = "SELECT column_name, CASE WHEN data_type = 'USER-DEFINED' THEN udt_name WHEN data_type = 'ARRAY' THEN udt_name ELSE data_type END AS dtype, is_nullable, column_default FROM information_schema.columns WHERE table_schema = '" + safeSch + "' AND table_name = '" + safeTbl + "' ORDER BY ordinal_position;";
          var pkSql = "SELECT kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = '" + safeSch + "' AND tc.table_name = '" + safeTbl + "';";
          var countSql = 'SELECT COUNT(*)::int FROM "' + schemaName + '"."' + String(tableName).replace(/"/g, '""') + '";';
          return pgDb.exec(colSql, { rowMode: 'array' }).then(function (cRes) {
            return pgDb.exec(pkSql, { rowMode: 'array' }).catch(function () { return []; }).then(function (pRes) {
              return pgDb.exec(countSql, { rowMode: 'array' }).catch(function () { return []; }).then(function (cntRes) {
                var pkSet = {};
                if (pRes && pRes[0] && pRes[0].rows) {
                  pRes[0].rows.forEach(function (r) { pkSet[String(r[0]).toLowerCase()] = true; });
                }
                var cols = (cRes && cRes[0] && cRes[0].rows ? cRes[0].rows : []).map(function (c, idx) {
                  var rawType = String(c[1] || 'TEXT');
                  var prettyType = rawType.indexOf('_') === 0 ? (rawType.slice(1).toUpperCase() + '[]') : rawType.toUpperCase();
                  return {
                    cid: idx,
                    name: c[0],
                    type: prettyType,
                    notNull: c[2] === 'NO',
                    defaultValue: c[3],
                    isPk: Boolean(pkSet[String(c[0]).toLowerCase()]),
                    fk: null
                  };
                });
                var rowCount = (cntRes && cntRes[0] && cntRes[0].rows && cntRes[0].rows[0]) ? Number(cntRes[0].rows[0][0]) : 0;
                acc.push({
                  name: tableName,
                  rowCount: rowCount,
                  columns: cols,
                  indexes: [],
                  sampleColumns: [],
                  sampleRows: []
                });
                return acc;
              });
            });
          });
        });
      });
      return chain;
    });
  }

  function introspectSchemaLocal(dsId, options) {
    var opts = options || {};
    var requestedEngine = opts.engine || (isPgOpsDataset(dsId) ? 'postgres' : _engineMode);
    if (requestedEngine === 'postgres') {
      return initPglite().then(function (pgDb) {
        if (!pgDb) return introspectSchemaLocal(dsId, { engine: 'sqlite' });
        return seedPostgresDataset(pgDb, dsId, false).then(function () {
          return introspectPostgresLocal(pgDb, dsId);
        });
      }).catch(function () {
        return [];
      });
    }
    var dbPromise = (!dsId || dsId === '__unified__')
      ? getUnifiedDatabase(false)
      : createDatabaseForDataset(dsId, false);
    return dbPromise.then(function (db) {
      var tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
      var tableNames = (tablesRes[0] && tablesRes[0].values) ? tablesRes[0].values.map(function (r) { return r[0]; }) : [];

      if (!isCustomOrEmptyDataset(dsId) && dsId && dsId !== '__unified__' && root.SQL_DATASETS && root.SQL_DATASETS[dsId] && Array.isArray(root.SQL_DATASETS[dsId].tables)) {
        var allowedSet = {};
        root.SQL_DATASETS[dsId].tables.forEach(function (t) {
          if (t && t.name) allowedSet[String(t.name).toLowerCase()] = true;
        });
        tableNames = tableNames.filter(function (name) {
          return Boolean(allowedSet[String(name).toLowerCase()]);
        });
      }

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
    if (canUseWorker && !_workerFailed) {
      return workerCall('resetDataset', { datasetId: dsId }).catch(function () {
        return resetDatasetLocal(dsId);
      });
    }
    return resetDatasetLocal(dsId);
  }

  function resetDatasetLocal(dsId) {
    if (isPgOpsDataset(dsId)) {
      return initPgliteLocal().then(function (pgDb) {
        return seedPostgresDataset(pgDb, dsId, true);
      });
    }
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
    if ((root.SQL_DATASETS && root.SQL_DATASETS[datasetId]) || isPgOpsDataset(datasetId)) {
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
    onEngineReady: onEngineChange,
    normalizeDialect: normalizeDialect,
    getErrorHint: getErrorHint,
    isWorkerEnabled: function () { return Boolean(canUseWorker && !_workerFailed); },
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
