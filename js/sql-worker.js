/**
 * SQL In Depth — Dedicated Web Worker SQL Runtime (`js/sql-worker.js`)
 * Runs SQLite 3 (`sql.js` WASM) and PostgreSQL 18.6 (`@electric-sql/pglite` WASM)
 * off the main UI thread so complex joins, recursive CTEs, and WASM compilation
 * never block scrolling, typing, or animations.
 */
/* global importScripts, SqlEngine */
'use strict';

self._IS_SQL_WORKER = true;
self.window = self;

let _bootstrapped = false;

function ensureWorkerLoaded(assetVersion) {
  if (_bootstrapped && typeof self.SqlEngine !== 'undefined') return;
  const qs = assetVersion ? ('?v=' + encodeURIComponent(assetVersion)) : '';
  importScripts(
    '/data/datasets.js' + qs,
    '/js/vendor/sql-wasm.js' + qs,
    '/js/sql-engine.js' + qs
  );
  if (self.SqlEngine && typeof self.SqlEngine.onEngineChange === 'function') {
    self.SqlEngine.onEngineChange(function (mode, ready) {
      self.postMessage({
        type: 'engineChange',
        engineMode: mode,
        pgliteReady: Boolean(ready)
      });
    });
  }
  _bootstrapped = true;
}

self.onmessage = async function (event) {
  const msg = event && event.data ? event.data : {};
  const { id, action, payload, assetVersion } = msg;
  if (!id || !action) return;

  try {
    ensureWorkerLoaded(assetVersion);

    let result = null;
    switch (action) {
      case 'initSqlite':
        await self.SqlEngine.initSqlite();
        result = { ready: true, engine: 'sqlite' };
        break;

      case 'initPglite':
        await self.SqlEngine.initPglite();
        result = { ready: true, pgliteReady: self.SqlEngine.isPgliteReady(), engine: 'postgres' };
        break;

      case 'setEngineMode':
        result = await self.SqlEngine.setEngineMode(payload && payload.mode);
        break;

      case 'execute':
        result = await self.SqlEngine.execute(
          payload && payload.sql,
          (payload && payload.options) || {}
        );
        break;

      case 'introspectSchema':
        result = await self.SqlEngine.introspectSchema(payload && payload.datasetId);
        break;

      case 'resetDataset':
        await self.SqlEngine.resetDataset(payload && payload.datasetId);
        result = { reset: true };
        break;

      default:
        throw new Error('Unknown SQL Worker action: ' + action);
    }

    self.postMessage({
      id,
      ok: true,
      pgliteReady: self.SqlEngine.isPgliteReady(),
      engineMode: self.SqlEngine.getEngineMode(),
      result,
    });
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
};
