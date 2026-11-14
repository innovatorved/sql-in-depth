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

function workerAssetUrl(cleanPath, assetVersion, lazyManifest) {
  const hash = (lazyManifest && lazyManifest[cleanPath]) || assetVersion || 'pg186-v2';
  return '/' + cleanPath + (hash ? ('?v=' + encodeURIComponent(hash)) : '');
}

function ensureWorkerLoaded(assetVersion, lazyManifest) {
  if (assetVersion) self._ASSET_VERSION = assetVersion;
  if (lazyManifest) self._LAZY_MANIFEST = lazyManifest;
  if (_bootstrapped && typeof self.SqlEngine !== 'undefined') return;
  importScripts(
    workerAssetUrl('data/datasets.js', assetVersion, lazyManifest),
    workerAssetUrl('js/vendor/sql-wasm.js', assetVersion, lazyManifest),
    workerAssetUrl('js/sql-engine.js', assetVersion, lazyManifest)
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

let _taskQueue = Promise.resolve();

async function handleWorkerAction(action, payload, assetVersion, lazyManifest) {
  ensureWorkerLoaded(assetVersion, lazyManifest);

  switch (action) {
    case 'initSqlite':
      await self.SqlEngine.initSqlite();
      return { ready: true, engine: 'sqlite' };

    case 'initPglite':
      await self.SqlEngine.initPglite();
      return { ready: true, pgliteReady: self.SqlEngine.isPgliteReady(), engine: 'postgres' };

    case 'setEngineMode':
      return await self.SqlEngine.setEngineMode(payload && payload.mode);

    case 'execute':
      return await self.SqlEngine.execute(
        payload && payload.sql,
        (payload && payload.options) || {}
      );

    case 'introspectSchema':
      return await self.SqlEngine.introspectSchema(payload && payload.datasetId);

    case 'resetDataset':
      await self.SqlEngine.resetDataset(payload && payload.datasetId);
      return { reset: true };

    default:
      throw new Error('Unknown SQL Worker action: ' + action);
  }
}

self.onmessage = function (event) {
  const msg = event && event.data ? event.data : {};
  const { id, action, payload, assetVersion, lazyManifest } = msg;
  if (!id || !action) return;

  _taskQueue = _taskQueue.then(async function () {
    try {
      const result = await handleWorkerAction(action, payload, assetVersion, lazyManifest);
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
        pgliteReady: Boolean(self.SqlEngine && self.SqlEngine.isPgliteReady()),
        engineMode: (self.SqlEngine && self.SqlEngine.getEngineMode()) || 'sqlite',
        error: err && err.message ? err.message : String(err),
      });
    }
  });
};
