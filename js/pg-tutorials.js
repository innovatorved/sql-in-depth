/**
 * SQL In Depth — PostgreSQL 18 Learn-by-Doing Hub & 5-Gate Verifier (`window.PgTutorials`)
 * Powers:
 *  1. `/postgres/` Interactive Curriculum Hub (10 Tracks · 80 Topics · 240 SQL Missions)
 *  2. On-demand lazy loading of per-track lab definitions (`data/pg-labs/pg-m01.js` .. `pg-m10.js`)
 *  3. Persistent per-step completion & draft code storage (`localStorage`)
 *  4. 5-Gate PostgreSQL 18 WASM Verification (`verifyLabStep`) shared across Browser & Node CI
 */
(function (root) {
  'use strict';

  var PROGRESS_STORAGE_KEY = 'sql_in_depth_pg_mastery_v1';
  var DRAFTS_STORAGE_KEY = 'sql_in_depth_pg_lab_drafts_v1';

  root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};
  var _loadingModules = {};

  function escapeHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Renders lightweight inline markdown (`code`, **bold**, line breaks) safely.
   */
  function formatInlineProse(text) {
    if (!text) return '';
    var escaped = escapeHtml(text);
    return escaped
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function formatProseParagraphs(text) {
    if (!text) return '';
    return String(text)
      .split(/\n\s*\n/)
      .map(function (para) { return para.trim(); })
      .filter(Boolean)
      .map(function (para) {
        return '<p>' + formatInlineProse(para) + '</p>';
      })
      .join('');
  }

  function getCurriculum() {
    return root.PG_MASTERY_CURRICULUM || { modules: [], topics: [], byId: {}, bySlug: {}, moduleById: {} };
  }

  /* ==========================================================================
     Progress & Draft Persistence
     ========================================================================== */

  function loadProgress() {
    var empty = { completedSteps: {}, completedTopics: {}, lastLabSlug: null, lastStepIndex: 0 };
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return empty;
      var raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) return empty;
      var parsed = JSON.parse(raw);
      return {
        completedSteps: (parsed && parsed.completedSteps) || {},
        completedTopics: (parsed && parsed.completedTopics) || {},
        lastLabSlug: (parsed && parsed.lastLabSlug) || null,
        lastStepIndex: typeof (parsed && parsed.lastStepIndex) === 'number' ? parsed.lastStepIndex : 0
      };
    } catch (e) {
      return empty;
    }
  }

  function saveProgress(state) {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {}
  }

  function markStepCompleted(topicId, topicSlug, stepIndex, totalSteps) {
    var count = totalSteps || 3;
    var state = loadProgress();
    var key = topicId + ':s' + (stepIndex + 1);
    state.completedSteps[key] = Date.now();
    var allDone = true;
    for (var i = 0; i < count; i++) {
      if (!state.completedSteps[topicId + ':s' + (i + 1)]) {
        allDone = false;
        break;
      }
    }
    if (allDone) {
      state.completedTopics[topicId] = Date.now();
    }
    if (topicSlug) {
      state.lastLabSlug = topicSlug;
      state.lastStepIndex = stepIndex;
    }
    saveProgress(state);
    return state;
  }

  function recordLastVisited(topicSlug, stepIndex) {
    if (!topicSlug) return;
    var state = loadProgress();
    state.lastLabSlug = topicSlug;
    if (typeof stepIndex === 'number') state.lastStepIndex = stepIndex;
    saveProgress(state);
  }

  function isStepCompleted(topicId, stepIndex, stateOpt) {
    var st = stateOpt || loadProgress();
    return Boolean(st.completedSteps[topicId + ':s' + (stepIndex + 1)]);
  }

  function getTopicCompletedStepCount(topicId, totalSteps, stateOpt) {
    var st = stateOpt || loadProgress();
    var count = totalSteps || 3;
    var done = 0;
    for (var i = 0; i < count; i++) {
      if (st.completedSteps[topicId + ':s' + (i + 1)]) done++;
    }
    return done;
  }

  function getProgressSummary() {
    var cur = getCurriculum();
    var st = loadProgress();
    var completedTopicsCount = 0;
    var completedStepsCount = 0;
    var nextTopic = null;

    cur.topics.forEach(function (t) {
      var stepDone = getTopicCompletedStepCount(t.id, 3, st);
      completedStepsCount += stepDone;
      if (stepDone >= 3) {
        completedTopicsCount++;
      } else if (!nextTopic) {
        nextTopic = t;
      }
    });

    var resumeTopic = (st.lastLabSlug && cur.bySlug[st.lastLabSlug]) || nextTopic || cur.topics[0] || null;
    return {
      completedTopicsCount: completedTopicsCount,
      totalTopics: cur.topics.length,
      completedStepsCount: completedStepsCount,
      totalSteps: cur.topics.length * 3,
      pctTopics: cur.topics.length ? Math.round((completedTopicsCount / cur.topics.length) * 100) : 0,
      pctSteps: cur.topics.length ? Math.round((completedStepsCount / (cur.topics.length * 3)) * 100) : 0,
      resumeTopic: resumeTopic,
      nextUnfinishedTopic: nextTopic || cur.topics[0] || null,
      raw: st
    };
  }

  function saveStepDraft(topicId, stepIndex, sql) {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      var map = {};
      var raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (raw) map = JSON.parse(raw) || {};
      map[topicId + ':s' + (stepIndex + 1)] = String(sql || '');
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function getStepDraft(topicId, stepIndex) {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return null;
      var raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (!raw) return null;
      var map = JSON.parse(raw) || {};
      var key = topicId + ':s' + (stepIndex + 1);
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
    } catch (e) {
      return null;
    }
  }

  function clearStepDraft(topicId, stepIndex) {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      var raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (!raw) return;
      var map = JSON.parse(raw) || {};
      delete map[topicId + ':s' + (stepIndex + 1)];
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  /* ==========================================================================
     Lazy Module Loader (Browser & Node.js)
     ========================================================================== */

  function ensureModuleLoaded(moduleId) {
    if (!moduleId) return Promise.reject(new Error('Missing Postgres module ID'));
    if (root.PG_LAB_MODULES && Array.isArray(root.PG_LAB_MODULES[moduleId])) {
      return Promise.resolve(root.PG_LAB_MODULES[moduleId]);
    }
    if (_loadingModules[moduleId]) return _loadingModules[moduleId];

    var cur = getCurriculum();
    var modMeta = cur.moduleById[moduleId];
    var relPath = (modMeta && modMeta.dataFile) ? modMeta.dataFile : ('data/pg-labs/' + moduleId + '.js');

    if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof process === 'undefined') {
      var url = '/' + relPath.replace(/^\/+/, '');
      var loader = (root.Lazy && typeof root.Lazy.load === 'function')
        ? root.Lazy.load(relPath)
        : (root.LazyLoader && typeof root.LazyLoader.loadScript === 'function')
          ? root.LazyLoader.loadScript(url)
          : new Promise(function (resolve, reject) {
              var s = document.createElement('script');
              s.src = url;
              s.async = true;
              s.onload = resolve;
              s.onerror = function () { reject(new Error('Failed to load ' + url)); };
              document.head.appendChild(s);
            });

      _loadingModules[moduleId] = loader.then(function () {
        delete _loadingModules[moduleId];
        return (root.PG_LAB_MODULES && root.PG_LAB_MODULES[moduleId]) || [];
      }).catch(function (err) {
        delete _loadingModules[moduleId];
        throw err;
      });
      return _loadingModules[moduleId];
    }

    // Node.js environment (verification / static checks / E2E)
    if (typeof require === 'function') {
      try {
        var pathMod = require('path');
        var baseDir = (typeof __dirname !== 'undefined') ? pathMod.resolve(__dirname, '..') : process.cwd();
        var fullPath = pathMod.resolve(baseDir, relPath);
        require(fullPath);
        var loadedMod = (root.PG_LAB_MODULES && root.PG_LAB_MODULES[moduleId]) ||
          (typeof global !== 'undefined' && global.PG_LAB_MODULES && global.PG_LAB_MODULES[moduleId]) || [];
        root.PG_LAB_MODULES = root.PG_LAB_MODULES || {};
        root.PG_LAB_MODULES[moduleId] = loadedMod;
        return Promise.resolve(loadedMod);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(new Error('Unable to load module ' + moduleId));
  }

  function loadLabBySlugOrId(idOrSlug) {
    var cur = getCurriculum();
    var meta = cur.getTopic(idOrSlug) || cur.topics[0];
    if (!meta) return Promise.resolve(null);
    return ensureModuleLoaded(meta.moduleId).then(function (labs) {
      var found = (labs || []).find(function (l) {
        return l && (l.id === meta.id || l.slug === meta.slug);
      });
      if (!found) return null;
      return Object.assign({}, meta, found);
    });
  }

  /* ==========================================================================
     5-Gate PostgreSQL 18 Verification Engine (`verifyLabStep`)
     ========================================================================== */

  function stripSqlComments(sql) {
    if (!sql) return '';
    return String(sql)
      .replace(/--[^\n]*/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, ' ');
  }

  function canonicalizeJson(val) {
    if (Array.isArray(val)) {
      return val.map(canonicalizeJson);
    }
    if (val && typeof val === 'object') {
      var sorted = {};
      Object.keys(val).sort().forEach(function (k) {
        sorted[k] = canonicalizeJson(val[k]);
      });
      return sorted;
    }
    return val;
  }

  function normalizeCellForCompare(val, epsilon) {
    if (val === null || typeof val === 'undefined') return { kind: 'null', val: null };
    if (typeof val === 'boolean') return { kind: 'bool', val: val };
    if (typeof val === 'number' && !Number.isNaN(val)) {
      return { kind: 'num', val: val, eps: epsilon };
    }
    var s = String(val).trim();
    if (/^(true|false)$/i.test(s)) {
      return { kind: 'bool', val: s.toLowerCase() === 'true' };
    }
    // Numeric string (e.g. PostgreSQL NUMERIC / BIGINT returned as text)
    if (/^-?\d+(?:\.\d+)?$/.test(s)) {
      var num = Number(s);
      if (Number.isFinite(num) && Math.abs(num) <= Number.MAX_SAFE_INTEGER) {
        return { kind: 'num', val: num, eps: epsilon };
      }
    }
    // Normalize ISO / Postgres UTC timestamps so '2025-03-15T14:00:00.000Z' == '2025-03-15 14:00:00+00'
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(s)) {
      var parsedMs = Date.parse(s.replace(' ', 'T').replace(/\+00$/, 'Z'));
      if (!Number.isNaN(parsedMs)) {
        return { kind: 'ts', val: parsedMs };
      }
    }
    // Canonicalize JSON / JSONB strings or arrays
    if ((s.charAt(0) === '{' && s.charAt(s.length - 1) === '}') || (s.charAt(0) === '[' && s.charAt(s.length - 1) === ']')) {
      try {
        var j = JSON.parse(s);
        return { kind: 'json', val: JSON.stringify(canonicalizeJson(j)) };
      } catch (e) {}
    }
    return { kind: 'str', val: s };
  }

  function cellsMatch(a, b, epsilon) {
    var eps = typeof epsilon === 'number' ? epsilon : 0.01;
    var na = normalizeCellForCompare(a, eps);
    var nb = normalizeCellForCompare(b, eps);
    if (na.kind === 'null' && nb.kind === 'null') return true;
    if (na.kind === 'null' || nb.kind === 'null') return false;
    if (na.kind === 'num' && nb.kind === 'num') {
      return Math.abs(na.val - nb.val) <= eps;
    }
    if (na.kind === 'ts' && nb.kind === 'ts') {
      return na.val === nb.val;
    }
    if (na.kind === nb.kind) {
      return na.val === nb.val;
    }
    return String(a).trim() === String(b).trim();
  }

  function rowSignature(row, ignoredIdxSet, epsilon) {
    return (row || []).map(function (cell, idx) {
      if (ignoredIdxSet && ignoredIdxSet[idx]) return '__IGNORED__';
      var norm = normalizeCellForCompare(cell, epsilon);
      if (norm.kind === 'num') {
        return 'n:' + (Math.round(norm.val * 1000) / 1000).toFixed(3);
      }
      if (norm.kind === 'null') return 'null';
      return norm.kind + ':' + String(norm.val);
    }).join('|');
  }

  /**
   * Executes & verifies a user's SQL solution for `lab.steps[stepIndex]` across 5 gates:
   *  Gate 1: PostgreSQL 18 Execution (no syntax/runtime error)
   *  Gate 2: AST / Construct Pattern Rules (required & forbidden SQL idioms, comment-stripped)
   *  Gate 3: Schema & Cardinality Match (columns & row count vs reference solution)
   *  Gate 4: Tuple Equivalence & Ordering (cell-by-cell with numeric epsilon, JSON canonicalization, & column checks)
   *  Gate 5: Optional Execution Plan Check (`requiredPlanNode` on EXPLAIN)
   */
  function verifyLabStep(lab, stepIndex, userSql) {
    var step = lab && Array.isArray(lab.steps) ? lab.steps[stepIndex] : null;
    if (!step) {
      return Promise.resolve({
        passed: false,
        failedGate: 'config',
        message: 'Practice step definition not found.',
        gates: []
      });
    }

    var trimmedUser = String(userSql || '').trim();
    var strippedUser = stripSqlComments(trimmedUser).trim();
    if (!strippedUser) {
      return Promise.resolve({
        passed: false,
        failedGate: 'execution',
        message: 'Write a SQL query in the editor before clicking Verify Step.',
        gates: [{ id: 'execution', label: 'PostgreSQL 18 Execution', passed: false, detail: 'Editor contains no executable SQL statements.' }]
      });
    }

    var engine = root.SqlEngine || root.SQLEngine;
    if (!engine || typeof engine.execute !== 'function') {
      return Promise.resolve({
        passed: false,
        failedGate: 'execution',
        message: 'PostgreSQL 18 WASM engine is not initialized yet.',
        gates: []
      });
    }

    var datasetId = (step && step.datasetId) || (lab && lab.datasetId) || '__unified__';
    var assertions = step.assertions || {};
    var gates = [];

    var execOpts = {
      datasetId: datasetId,
      engine: 'postgres',
      isolatedTx: true,
      explain: true,
      skipDmlDiff: false,
      setupSql: step.setupSql || '',
      probeSql: step.probeSql || ''
    };

    return engine.execute(trimmedUser, execOpts).then(function (userRes) {
      if (!userRes || !userRes.ok) {
        var errDetail = (userRes && userRes.error) ? userRes.error : 'Query execution failed.';
        gates.push({
          id: 'execution',
          label: 'PostgreSQL 18 Execution',
          passed: false,
          detail: errDetail
        });
        return {
          passed: false,
          failedGate: 'execution',
          message: errDetail,
          hint: userRes && userRes.errorHint ? userRes.errorHint : null,
          userExecution: userRes,
          gates: gates
        };
      }

      if (step.probeSql && userRes.probeResult && userRes.probeResult.error) {
        gates.push({
          id: 'execution',
          label: 'Post-Statement Verification Probe',
          passed: false,
          detail: userRes.probeResult.error
        });
        return {
          passed: false,
          failedGate: 'execution',
          message: 'Your SQL ran, but verifying the resulting database object failed: ' + userRes.probeResult.error,
          userExecution: userRes,
          gates: gates
        };
      }

      gates.push({
        id: 'execution',
        label: 'PostgreSQL 18 Execution',
        passed: true,
        detail: 'Executed cleanly in ' + (userRes.elapsedMs || 0.1) + ' ms.'
      });

      // Gate 2: Required & Forbidden SQL Construct Checks (on comment-stripped SQL)
      var reqPatterns = Array.isArray(assertions.requiredPatterns) ? assertions.requiredPatterns : [];
      for (var r = 0; r < reqPatterns.length; r++) {
        var rule = reqPatterns[r];
        if (!rule || !rule.pattern) continue;
        var re = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern, rule.flags || 'i');
        if (!re.test(strippedUser)) {
          var reqMsg = rule.message || ('Your query must use the target PostgreSQL construct matching `' + rule.pattern + '`.');
          gates.push({
            id: 'patterns',
            label: 'Target SQL Idiom Check',
            passed: false,
            detail: reqMsg
          });
          return {
            passed: false,
            failedGate: 'patterns',
            message: reqMsg,
            userExecution: userRes,
            gates: gates
          };
        }
      }

      var forbPatterns = Array.isArray(assertions.forbiddenPatterns) ? assertions.forbiddenPatterns : [];
      for (var f = 0; f < forbPatterns.length; f++) {
        var fRule = forbPatterns[f];
        if (!fRule || !fRule.pattern) continue;
        var fRe = fRule.pattern instanceof RegExp ? fRule.pattern : new RegExp(fRule.pattern, fRule.flags || 'i');
        if (fRe.test(strippedUser)) {
          var forbMsg = fRule.message || 'Query contains a disallowed shortcut or anti-pattern for this step.';
          gates.push({
            id: 'patterns',
            label: 'Target SQL Idiom Check',
            passed: false,
            detail: forbMsg
          });
          return {
            passed: false,
            failedGate: 'patterns',
            message: forbMsg,
            userExecution: userRes,
            gates: gates
          };
        }
      }

      gates.push({
        id: 'patterns',
        label: 'Target SQL Idiom Check',
        passed: true,
        detail: reqPatterns.length ? 'Uses the expected PostgreSQL construct.' : 'No anti-patterns detected.'
      });

      // Execute reference solution inside its own clean savepoint
      return engine.execute(step.solutionCode, Object.assign({}, execOpts, { skipDmlDiff: true })).then(function (refRes) {
        if (!refRes || !refRes.ok) {
          gates.push({
            id: 'schema',
            label: 'Reference Comparison',
            passed: false,
            detail: 'Internal reference query error: ' + ((refRes && refRes.error) || 'unknown')
          });
          return {
            passed: false,
            failedGate: 'schema',
            message: 'Reference verification failed: ' + ((refRes && refRes.error) || 'unknown'),
            userExecution: userRes,
            gates: gates
          };
        }

        var uTarget = step.probeSql ? (userRes.probeResult || { columns: [], rows: [], rowCount: 0 }) : userRes;
        var rTarget = step.probeSql ? (refRes.probeResult || { columns: [], rows: [], rowCount: 0 }) : refRes;

        var uCols = uTarget.columns || [];
        var rCols = rTarget.columns || [];
        var uRows = uTarget.rows || [];
        var rRows = rTarget.rows || [];

        // Gate 3: Column Count, Optional Column Names & Row Count
        if (uCols.length !== rCols.length) {
          var colCntMsg = 'Expected ' + rCols.length + ' output column' + (rCols.length === 1 ? '' : 's') +
            ' (' + rCols.join(', ') + '), but your query returned ' + uCols.length +
            (uCols.length ? (' (' + uCols.join(', ') + ')') : '') + '.';
          gates.push({ id: 'schema', label: 'Schema & Row Count', passed: false, detail: colCntMsg });
          return {
            passed: false,
            failedGate: 'schema',
            message: colCntMsg,
            userExecution: userRes,
            gates: gates
          };
        }

        if (assertions.checkColumnNames) {
          for (var c = 0; c < rCols.length; c++) {
            if (String(uCols[c]).toLowerCase() !== String(rCols[c]).toLowerCase()) {
              var colNameMsg = 'Column #' + (c + 1) + ' should be named `' + rCols[c] + '`, but got `' + uCols[c] + '`.';
              gates.push({ id: 'schema', label: 'Schema & Row Count', passed: false, detail: colNameMsg });
              return {
                passed: false,
                failedGate: 'schema',
                message: colNameMsg,
                userExecution: userRes,
                gates: gates
              };
            }
          }
        }

        if (uRows.length !== rRows.length) {
          var rowCntMsg = 'Expected ' + rRows.length + ' row' + (rRows.length === 1 ? '' : 's') +
            ', but your query returned ' + uRows.length + ' row' + (uRows.length === 1 ? '' : 's') + '.';
          gates.push({ id: 'schema', label: 'Schema & Row Count', passed: false, detail: rowCntMsg });
          return {
            passed: false,
            failedGate: 'schema',
            message: rowCntMsg,
            userExecution: userRes,
            gates: gates
          };
        }

        gates.push({
          id: 'schema',
          label: 'Schema & Row Count',
          passed: true,
          detail: rCols.length + ' column' + (rCols.length === 1 ? '' : 's') + ' × ' + rRows.length + ' row' + (rRows.length === 1 ? '' : 's') + ' matched.'
        });

        // Build ignored column index map (for dynamic UUIDs / XIDs / LSNs / timestamps)
        var ignoredIdx = {};
        if (Array.isArray(assertions.ignoreColumns)) {
          assertions.ignoreColumns.forEach(function (ic) {
            if (typeof ic === 'number') {
              ignoredIdx[ic] = true;
            } else {
              var foundIdx = rCols.findIndex(function (rc) { return String(rc).toLowerCase() === String(ic).toLowerCase(); });
              if (foundIdx >= 0) ignoredIdx[foundIdx] = true;
            }
          });
        }

        // Optional dynamic column assertions (`assertions.columnChecks`)
        if (Array.isArray(assertions.columnChecks)) {
          for (var ccIdx = 0; ccIdx < assertions.columnChecks.length; ccIdx++) {
            var chk = assertions.columnChecks[ccIdx];
            var targetColIdx = typeof chk.col === 'number'
              ? chk.col
              : rCols.findIndex(function (rc) { return String(rc).toLowerCase() === String(chk.col).toLowerCase(); });
            if (targetColIdx < 0) continue;
            var chkRe = chk.regex ? new RegExp(chk.regex, chk.flags || 'i') : null;
            for (var rIdx = 0; rIdx < uRows.length; rIdx++) {
              var cellVal = uRows[rIdx][targetColIdx];
              if (chk.notNull && (cellVal === null || typeof cellVal === 'undefined')) {
                var nnMsg = chk.message || ('Column `' + (uCols[targetColIdx] || targetColIdx) + '` at row ' + (rIdx + 1) + ' must not be NULL.');
                gates.push({ id: 'tuples', label: 'Result Tuple Verification', passed: false, detail: nnMsg });
                return { passed: false, failedGate: 'tuples', message: nnMsg, userExecution: userRes, gates: gates };
              }
              if (chkRe && !chkRe.test(String(cellVal === null ? '' : cellVal))) {
                var rxMsg = chk.message || ('Column `' + (uCols[targetColIdx] || targetColIdx) + '` value `' + cellVal + '` did not match expected format.');
                gates.push({ id: 'tuples', label: 'Result Tuple Verification', passed: false, detail: rxMsg });
                return { passed: false, failedGate: 'tuples', message: rxMsg, userExecution: userRes, gates: gates };
              }
              if (typeof chk.minNumeric === 'number' && !(Number(cellVal) >= chk.minNumeric)) {
                var minMsg = chk.message || ('Column `' + (uCols[targetColIdx] || targetColIdx) + '` must be >= ' + chk.minNumeric + '.');
                gates.push({ id: 'tuples', label: 'Result Tuple Verification', passed: false, detail: minMsg });
                return { passed: false, failedGate: 'tuples', message: minMsg, userExecution: userRes, gates: gates };
              }
            }
          }
        }

        // Gate 4: Tuple Value & Ordering Equivalence
        var eps = typeof assertions.floatEpsilon === 'number' ? assertions.floatEpsilon : 0.01;
        var orderMatters = typeof assertions.orderMatters === 'boolean'
          ? assertions.orderMatters
          : /\bORDER\s+BY\b/i.test(stripSqlComments(step.solutionCode));

        var compareURows = uRows;
        var compareRRows = rRows;
        if (!orderMatters) {
          compareURows = uRows.slice().sort(function (a, b) {
            return rowSignature(a, ignoredIdx, eps).localeCompare(rowSignature(b, ignoredIdx, eps));
          });
          compareRRows = rRows.slice().sort(function (a, b) {
            return rowSignature(a, ignoredIdx, eps).localeCompare(rowSignature(b, ignoredIdx, eps));
          });
        }

        for (var rowI = 0; rowI < compareRRows.length; rowI++) {
          for (var colI = 0; colI < rCols.length; colI++) {
            if (ignoredIdx[colI]) continue;
            var uVal = compareURows[rowI][colI];
            var rVal = compareRRows[rowI][colI];
            if (!cellsMatch(uVal, rVal, eps)) {
              var diffMsg = (orderMatters ? ('Row ' + (rowI + 1)) : 'Result set mismatch') +
                ', column `' + (rCols[colI] || ('#' + (colI + 1))) + '`: expected `' +
                (rVal === null ? 'NULL' : rVal) + '`, but got `' + (uVal === null ? 'NULL' : uVal) + '`.';
              if (orderMatters && !/\bORDER\s+BY\b/i.test(strippedUser) && /\bORDER\s+BY\b/i.test(step.solutionCode)) {
                diffMsg += ' Did you include the required `ORDER BY` clause?';
              }
              gates.push({ id: 'tuples', label: 'Result Tuple Verification', passed: false, detail: diffMsg });
              return {
                passed: false,
                failedGate: 'tuples',
                message: diffMsg,
                userExecution: userRes,
                gates: gates
              };
            }
          }
        }

        gates.push({
          id: 'tuples',
          label: 'Result Tuple Verification',
          passed: true,
          detail: orderMatters ? 'All rows, values, and sort order match.' : 'All result tuples and values match.'
        });

        // Gate 5: Optional Execution Plan Verification
        if (assertions.requiredPlanNode) {
          var planRe = assertions.requiredPlanNode instanceof RegExp
            ? assertions.requiredPlanNode
            : new RegExp(assertions.requiredPlanNode, 'i');
          var planDump = (userRes.explain || []).map(function (n) {
            return (n.nodeType || '') + ' ' + (n.kind || '') + ' ' + (n.detail || '');
          }).join(' | ');
          if (!planDump || !planRe.test(planDump)) {
            var planMsg = assertions.planMessage || ('Expected PostgreSQL planner to use `' + assertions.requiredPlanNode + '`, but got: ' + (planDump || 'no plan'));
            gates.push({ id: 'plan', label: 'Execution Plan Check', passed: false, detail: planMsg });
            return {
              passed: false,
              failedGate: 'plan',
              message: planMsg,
              userExecution: userRes,
              gates: gates
            };
          }
          gates.push({
            id: 'plan',
            label: 'Execution Plan Check',
            passed: true,
            detail: 'Verified physical plan strategy (' + assertions.requiredPlanNode + ').'
          });
        }

        return {
          passed: true,
          failedGate: null,
          message: 'Step ' + (stepIndex + 1) + ' verified on PostgreSQL 18.6 WASM.',
          userExecution: userRes,
          gates: gates
        };
      });
    });
  }

  /* ==========================================================================
     `/postgres/` Interactive Curriculum Hub Renderer
     ========================================================================== */

  var _hubState = {
    tab: 'tracks',
    search: '',
    difficulty: 'all',
    status: 'all',
    openTracks: null // Map of open module IDs
  };

  var DIFF_TO_CHAL_LEVEL = {
    Beginner: 'easy',
    Intermediate: 'medium',
    Advanced: 'hard',
    Staff: 'insane'
  };

  function getStudioLabSearch(slug) {
    return '?mode=postgres-labs&lab=' + encodeURIComponent(slug || 'select-projection-arithmetic');
  }

  function renderPostgresHub(container) {
    var rootEl = container || (typeof document !== 'undefined' ? document.getElementById('pg-mastery-root') : null);
    if (!rootEl) return;

    var cur = getCurriculum();
    var summary = getProgressSummary();
    if (!_hubState.openTracks) {
      _hubState.openTracks = {};
      if (summary.resumeTopic && summary.resumeTopic.moduleId) {
        _hubState.openTracks[summary.resumeTopic.moduleId] = true;
      } else if (cur.modules[0]) {
        _hubState.openTracks[cur.modules[0].id] = true;
      }
    }

    var resumeTopic = summary.resumeTopic || cur.topics[0] || null;
    var resumeSlug = resumeTopic ? resumeTopic.slug : 'select-projection-arithmetic';
    var resumeSearch = getStudioLabSearch(resumeSlug);
    var resumeNum = resumeTopic ? String(resumeTopic.globalOrder || 1).padStart(2, '0') : '01';
    var resumeLabel = summary.completedStepsCount > 0
      ? ('Continue Lab ' + resumeNum + ' →')
      : 'Start Lab 01 →';

    var activeTab = _hubState.tab || 'tracks';
    var baseTopics = activeTab === 'clinics'
      ? cur.topics.filter(function (t) { return t.moduleId === 'pg-m09' || t.moduleId === 'pg-m10'; })
      : cur.topics;

    var levels = ['all', 'Beginner', 'Intermediate', 'Advanced', 'Staff'];
    var filterButtonsHtml = levels.map(function (lvl) {
      var count = lvl === 'all'
        ? baseTopics.length
        : baseTopics.filter(function (t) { return t.difficulty === lvl; }).length;
      if (lvl !== 'all' && count === 0) return '';
      var active = _hubState.difficulty === lvl;
      var label = lvl === 'all' ? 'All' : lvl;
      return '<button type="button" class="chal-filter' + (active ? ' is-active' : '') + '" data-pg-diff="' + escapeHtml(lvl) + '" aria-pressed="' + (active ? 'true' : 'false') + '">' +
        escapeHtml(label) + ' <span class="chal-filter__count">' + count + '</span>' +
      '</button>';
    }).join('');

    rootEl.innerHTML = [
      '<div class="view-canvas postgres-view chal-page">',
      '  <header class="view-header pg-view-header">',
      '    <div class="view-header__top">',
      '      <div class="view-header__content">',
      '        <h1 class="view-title">PostgreSQL 18 Mastery</h1>',
      '        <p class="view-subtitle">80 hands-on labs and 240 live SQL missions across 10 tracks — from <code>SELECT</code>, <code>JOIN</code>, and window frames to <code>JSONB</code>, MVCC storage, <code>pg_catalog</code>, and DBRE clinics.</p>',
      '      </div>',
      '      <div class="view-tabs" role="tablist" aria-label="PostgreSQL mastery views">',
      '        <button type="button" class="view-tab' + (activeTab === 'tracks' ? ' active' : '') + '" data-pg-tab="tracks" role="tab" aria-selected="' + (activeTab === 'tracks' ? 'true' : 'false') + '">Curriculum Tracks</button>',
      '        <button type="button" class="view-tab' + (activeTab === 'labs' ? ' active' : '') + '" data-pg-tab="labs" role="tab" aria-selected="' + (activeTab === 'labs' ? 'true' : 'false') + '">All 80 Labs</button>',
      '        <button type="button" class="view-tab' + (activeTab === 'clinics' ? ' active' : '') + '" data-pg-tab="clinics" role="tab" aria-selected="' + (activeTab === 'clinics' ? 'true' : 'false') + '">DBRE Clinics</button>',
      '      </div>',
      '    </div>',
      '    <div class="pg-header-bar">',
      '      <ol class="chal-steps" aria-label="How PostgreSQL labs work">',
      '        <li><span>1</span>Read the scenario &amp; internals guide</li>',
      '        <li><span>2</span>Write PostgreSQL 18 SQL in Studio</li>',
      '        <li><span>3</span>Verify all 3 steps</li>',
      '      </ol>',
      '      <div class="pg-header-actions">',
      '        <div class="chal-progress" role="group" aria-label="Your PostgreSQL progress">',
      '          <div class="chal-progress__text"><strong>' + summary.completedTopicsCount + ' of ' + summary.totalTopics + '</strong> labs · <strong>' + summary.completedStepsCount + ' of ' + summary.totalSteps + '</strong> steps</div>',
      '          <div class="chal-progress__track"><span style="width:' + summary.pctSteps + '%"></span></div>',
      '        </div>',
      '        <a href="/sandbox/' + escapeHtml(resumeSearch) + '" class="eco-btn eco-btn--sm eco-btn--primary" data-nav="sandbox" data-search="' + escapeHtml(resumeSearch) + '">' + escapeHtml(resumeLabel) + '</a>',
      '      </div>',
      '    </div>',
      '  </header>',
      '',
      '  <div class="chal-controls">',
      '    <input type="search" id="pg-hub-search" class="chal-search" placeholder="Search by clause, view, or topic, e.g. LATERAL, JSONB, pg_locks" aria-label="Search PostgreSQL labs" value="' + escapeHtml(_hubState.search) + '" autocomplete="off" />',
      '    <div class="chal-filters" id="pg-hub-filters" role="group" aria-label="Filter by level">' + filterButtonsHtml + '</div>',
      '  </div>',
      '',
      '  <div id="pg-hub-tracks-list" class="view-body pg-hub-body"></div>',
      '</div>'
    ].join('\n');

    renderHubBody(rootEl);
    bindHubEvents(rootEl);
  }

  function topicMatchesFilter(topic, queryLower, diffFilter) {
    if (diffFilter && diffFilter !== 'all' && topic.difficulty !== diffFilter) {
      return false;
    }
    if (!queryLower) return true;
    var hay = [
      topic.title,
      topic.slug,
      topic.summary,
      topic.moduleTitle,
      (topic.clauses || []).join(' '),
      (topic.tags || []).join(' ')
    ].join(' ').toLowerCase();
    return hay.indexOf(queryLower) !== -1;
  }

  function renderLabRow(topic, st, showTrackBadge) {
    var stepDone = getTopicCompletedStepCount(topic.id, 3, st);
    var isDone = stepDone >= 3;
    var chalTier = DIFF_TO_CHAL_LEVEL[topic.difficulty] || 'medium';
    var studioSearch = getStudioLabSearch(topic.slug);
    var ctaLabel = isDone ? 'Review' : (stepDone > 0 ? 'Continue' : 'Practice');
    var clauseChips = (topic.clauses || []).slice(0, 4).map(function (cl) {
      return '<code class="pg-row-clause">' + escapeHtml(cl) + '</code>';
    }).join('');

    return [
      '<li class="chal-row pg-lab-row' + (isDone ? ' is-solved' : '') + '">',
      '  <span class="chal-row__num" aria-hidden="true">' + (isDone ? '✓' : String(topic.globalOrder).padStart(2, '0')) + '</span>',
      '  <div class="chal-row__main">',
      '    <div class="chal-row__title">',
      '      <a href="/sandbox/' + escapeHtml(studioSearch) + '" data-nav="sandbox" data-search="' + escapeHtml(studioSearch) + '">' + escapeHtml(topic.title) + '</a>',
      '    </div>',
      '    <p class="chal-row__desc">' + escapeHtml(topic.summary) + '</p>',
      '    <div class="chal-row__meta">',
      '      <span class="chal-level chal-level--' + escapeHtml(chalTier) + '">' + escapeHtml(topic.difficulty) + '</span>',
      (showTrackBadge ? '      <span>Track ' + escapeHtml(topic.moduleNum || '') + ' · ' + escapeHtml(topic.moduleShortTitle || topic.moduleTitle || '') + '</span>' : ''),
      '      <span class="pg-row-steps">' + stepDone + '/3 steps</span>',
      (clauseChips ? '      <span class="pg-row-clauses">' + clauseChips + '</span>' : ''),
      '    </div>',
      '  </div>',
      '  <a class="chal-row__cta" href="/sandbox/' + escapeHtml(studioSearch) + '" data-nav="sandbox" data-search="' + escapeHtml(studioSearch) + '">' + ctaLabel + '</a>',
      '</li>'
    ].filter(Boolean).join('\n');
  }

  function syncToggleAllButton(rootEl) {
    var toggleBtn = rootEl.querySelector('#pg-hub-toggle-all');
    if (!toggleBtn) return;
    var items = rootEl.querySelectorAll('details.pg-track-accordion');
    var allOpen = items.length > 0 && Array.prototype.every.call(items, function (d) { return d.open; });
    toggleBtn.setAttribute('aria-expanded', allOpen ? 'true' : 'false');
    var expandLbl = toggleBtn.querySelector('.pg-toggle-all__expand');
    var collapseLbl = toggleBtn.querySelector('.pg-toggle-all__collapse');
    if (expandLbl) expandLbl.hidden = allOpen;
    if (collapseLbl) collapseLbl.hidden = !allOpen;
  }

  function renderHubBody(rootEl) {
    var listEl = rootEl.querySelector('#pg-hub-tracks-list');
    if (!listEl) return;

    var cur = getCurriculum();
    var st = loadProgress();
    var q = String(_hubState.search || '').trim().toLowerCase();
    var diff = _hubState.difficulty || 'all';
    var activeTab = _hubState.tab || 'tracks';
    var hasActiveFilter = Boolean(q || diff !== 'all');

    // Flat "All 80 Labs" view (identical scannable list to /challenges/)
    if (activeTab === 'labs') {
      var modLookup = cur.moduleById || {};
      var flatMatches = cur.topics.filter(function (t) {
        return topicMatchesFilter(t, q, diff);
      });
      if (flatMatches.length === 0) {
        listEl.innerHTML = renderEmptyFilterState();
        bindEmptyReset(rootEl, listEl);
        return;
      }
      var flatRows = flatMatches.map(function (t) {
        var mod = modLookup[t.moduleId] || {};
        var enriched = Object.assign({}, t, {
          moduleNum: mod.num || '',
          moduleShortTitle: mod.shortTitle || mod.title || ''
        });
        return renderLabRow(enriched, st, true);
      }).join('\n');
      listEl.innerHTML = '<ol class="chal-list">' + flatRows + '</ol>';
      return;
    }

    // Track-grouped view ("Curriculum Tracks" or "DBRE Clinics")
    var modulesToRender = activeTab === 'clinics'
      ? cur.modules.filter(function (m) { return m.id === 'pg-m09' || m.id === 'pg-m10'; })
      : cur.modules;

    var totalMatched = 0;
    var accordionsHtml = modulesToRender.map(function (mod) {
      var matchedTopics = mod.topics.filter(function (t) {
        return topicMatchesFilter(t, q, diff);
      });
      if (matchedTopics.length === 0) return '';
      totalMatched += matchedTopics.length;

      var modCompletedTopics = 0;
      var modCompletedSteps = 0;
      mod.topics.forEach(function (t) {
        var sc = getTopicCompletedStepCount(t.id, 3, st);
        modCompletedSteps += sc;
        if (sc >= 3) modCompletedTopics++;
      });
      var modTotalSteps = mod.topics.length * 3;
      var modPct = modTotalSteps > 0 ? Math.round((modCompletedSteps / modTotalSteps) * 100) : 0;

      var isOpen = activeTab === 'clinics' || hasActiveFilter || Boolean(_hubState.openTracks && _hubState.openTracks[mod.id]);
      var rowsHtml = matchedTopics.map(function (topic) {
        return renderLabRow(topic, st, false);
      }).join('\n');

      // Modern Web Guidance: chevron directly before label, NO <h1>-<h6> inside <summary>
      return [
        '<details id="track-' + escapeHtml(mod.id) + '" class="pg-track-accordion" data-module-id="' + escapeHtml(mod.id) + '"' + (isOpen ? ' open' : '') + '>',
        '  <summary class="pg-track-summary">',
        '    <svg class="pg-track-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>',
        '    <span class="eco-pill eco-pill--accent pg-track-pill">Track ' + escapeHtml(mod.num) + '</span>',
        '    <span class="pg-track-heading-group">',
        '      <span class="pg-track-title">' + escapeHtml(mod.title) + '</span>',
        '      <span class="pg-track-desc">' + escapeHtml(mod.summary) + '</span>',
        '    </span>',
        '    <span class="pg-track-right">',
        '      <span class="progress-stat">' + modCompletedTopics + '/' + mod.topics.length + ' labs · ' + modCompletedSteps + '/' + modTotalSteps + ' steps</span>',
        '      <span class="eco-progress-bar pg-track-bar" aria-hidden="true"><span class="eco-progress-fill" style="width:' + modPct + '%"></span></span>',
        '    </span>',
        '  </summary>',
        '  <div class="pg-track-body">',
        '    <ol class="chal-list pg-track-list">',
        rowsHtml,
        '    </ol>',
        '  </div>',
        '</details>'
      ].join('\n');
    }).filter(Boolean).join('\n');

    if (totalMatched === 0) {
      listEl.innerHTML = renderEmptyFilterState();
      bindEmptyReset(rootEl, listEl);
      return;
    }

    var topMetaHtml = '';
    if (activeTab === 'tracks') {
      topMetaHtml = [
        '<div class="pg-tracks-bar">',
        '  <span class="pg-tracks-meta">10 tracks · PostgreSQL 18.6 WASM · <code>pg_trgm</code>, <code>btree_gist</code>, <code>ltree</code>, <code>pageinspect</code>, <code>pg_buffercache</code>, <code>pg_visibility</code>, <code>pg_freespacemap</code></span>',
        '  <button type="button" class="pg-toggle-all-btn" id="pg-hub-toggle-all" aria-expanded="false">',
        '    <span class="pg-toggle-all__expand">Expand all tracks</span>',
        '    <span class="pg-toggle-all__collapse" hidden>Collapse all tracks</span>',
        '  </button>',
        '</div>'
      ].join('\n');
    }

    var clinicsCalloutHtml = '';
    if (activeTab === 'clinics') {
      clinicsCalloutHtml = [
        '<article class="eco-card pg-clinics-callout">',
        '  <div class="pg-clinics-callout__row">',
        '    <div>',
        '      <h2 class="eco-card__title">Ready for unguided incident debugging?</h2>',
        '      <p class="eco-card__desc">Put your <code>pg_locks</code>, XID wraparound, cardinality skew, and GIN pending-list skills to the test in 8 PostgreSQL 18 production incident challenges.</p>',
        '    </div>',
        '    <a href="/challenges/" class="eco-btn eco-btn--primary" data-nav="challenges">Open Challenges →</a>',
        '  </div>',
        '</article>'
      ].join('\n');
    }

    listEl.innerHTML = topMetaHtml + '<div class="pg-tracks-stack">' + accordionsHtml + '</div>' + clinicsCalloutHtml;
    syncToggleAllButton(rootEl);

    var toggleBtn = listEl.querySelector('#pg-hub-toggle-all');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var shouldOpen = toggleBtn.getAttribute('aria-expanded') !== 'true';
        modulesToRender.forEach(function (m) {
          if (_hubState.openTracks) _hubState.openTracks[m.id] = shouldOpen;
        });
        Array.prototype.forEach.call(listEl.querySelectorAll('details.pg-track-accordion'), function (d) {
          d.open = shouldOpen;
        });
        syncToggleAllButton(rootEl);
      });
    }

    Array.prototype.forEach.call(listEl.querySelectorAll('details.pg-track-accordion'), function (det) {
      det.addEventListener('toggle', function () {
        var mId = det.getAttribute('data-module-id');
        if (mId && _hubState.openTracks && !hasActiveFilter && activeTab === 'tracks') {
          _hubState.openTracks[mId] = det.open;
        }
        syncToggleAllButton(rootEl);
      });
    });
  }

  function renderEmptyFilterState() {
    return '<div class="chal-empty pg-empty-state">' +
      '<p>No PostgreSQL labs match' + (_hubState.search ? (' <strong>' + escapeHtml(_hubState.search) + '</strong>') : '') + '. Try another keyword or difficulty level.</p>' +
      '<button type="button" class="eco-btn eco-btn--sm" id="pg-hub-reset-filters">Reset filters</button>' +
    '</div>';
  }

  function bindEmptyReset(rootEl, listEl) {
    var resetBtn = listEl.querySelector('#pg-hub-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        _hubState.search = '';
        _hubState.difficulty = 'all';
        renderPostgresHub(rootEl);
      });
    }
  }

  function bindHubEvents(rootEl) {
    var searchInput = rootEl.querySelector('#pg-hub-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        _hubState.search = searchInput.value || '';
        renderHubBody(rootEl);
      });
    }

    Array.prototype.forEach.call(rootEl.querySelectorAll('[data-pg-diff]'), function (btn) {
      btn.addEventListener('click', function () {
        _hubState.difficulty = btn.getAttribute('data-pg-diff') || 'all';
        Array.prototype.forEach.call(rootEl.querySelectorAll('[data-pg-diff]'), function (b) {
          var isAct = b.getAttribute('data-pg-diff') === _hubState.difficulty;
          b.classList.toggle('is-active', isAct);
          b.setAttribute('aria-pressed', isAct ? 'true' : 'false');
        });
        renderHubBody(rootEl);
      });
    });

    Array.prototype.forEach.call(rootEl.querySelectorAll('[data-pg-tab]'), function (tabBtn) {
      tabBtn.addEventListener('click', function () {
        var nextTab = tabBtn.getAttribute('data-pg-tab') || 'tracks';
        if (_hubState.tab === nextTab) return;
        _hubState.tab = nextTab;
        renderPostgresHub(rootEl);
      });
    });
  }

  root.PgTutorials = {
    getCurriculum: getCurriculum,
    loadProgress: loadProgress,
    markStepCompleted: markStepCompleted,
    recordLastVisited: recordLastVisited,
    isStepCompleted: isStepCompleted,
    getTopicCompletedStepCount: getTopicCompletedStepCount,
    getProgressSummary: getProgressSummary,
    saveStepDraft: saveStepDraft,
    getStepDraft: getStepDraft,
    clearStepDraft: clearStepDraft,
    ensureModuleLoaded: ensureModuleLoaded,
    loadLabBySlugOrId: loadLabBySlugOrId,
    verifyLabStep: verifyLabStep,
    stripSqlComments: stripSqlComments,
    formatInlineProse: formatInlineProse,
    formatProseParagraphs: formatProseParagraphs,
    renderPostgresHub: renderPostgresHub,
    mount: renderPostgresHub
  };
  if (typeof globalThis !== 'undefined' && globalThis !== root) {
    globalThis.PgTutorials = root.PgTutorials;
    globalThis.PG_LAB_MODULES = root.PG_LAB_MODULES;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
