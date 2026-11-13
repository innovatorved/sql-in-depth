/**
 * SQL & Database Architecture in Depth — Incident Troubleshooting Challenges Controller
 * Handles /challenges view: Break/Fix SQL & database engine incident rooms across 4 difficulty tiers.
 */
(function(root) {
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

  var ChallengesController = {
    _container: null,
    _activeChallengeId: null,
    _difficultyFilter: 'all',
    _searchQuery: '',
    _selectedRootCauseId: null,
    _knobValues: {},
    _lastVerifyResult: null,
    _codeHotfixPassed: false,
    _hotfixSolvedMap: {},
    _abortController: null,

    mount: function(container, options) {
      if (this._abortController) {
        this._abortController.abort();
        this._abortController = null;
      }
      this._container = container;
      if (!container) return;
      options = options || {};
      this._activeChallengeId = options.challengeId || null;
      this._selectedRootCauseId = null;
      this._knobValues = {};
      this._lastVerifyResult = null;
      this._codeHotfixPassed = false;

      if (this._activeChallengeId) {
        this._initChallengeState(this._activeChallengeId);
      }

      this.render();
      this._bindEvents();
    },

    unmount: function(container) {
      if (this._abortController) {
        this._abortController.abort();
        this._abortController = null;
      }
      if (this._container) {
        this._container.innerHTML = '';
        this._container = null;
      }
      this._activeChallengeId = null;
      this._lastVerifyResult = null;
    },

    _getChallenges: function() {
      return Array.isArray(root.CHALLENGES_DATA) ? root.CHALLENGES_DATA : [];
    },

    _findChallenge: function(id) {
      var list = this._getChallenges();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return list[i];
      }
      return null;
    },

    _initChallengeState: function(id) {
      var ch = this._findChallenge(id);
      this._knobValues = {};
      this._selectedRootCauseId = null;
      this._lastVerifyResult = null;
      this._codeHotfixPassed = Boolean(ch && this._hotfixSolvedMap && this._hotfixSolvedMap[ch.id]);
      if (!ch) return;
      var knobs = ch.interactiveTuning || [];
      for (var i = 0; i < knobs.length; i++) {
        this._knobValues[knobs[i].id] = knobs[i].defaultValue;
      }
    },

    isChallengeSolved: function(id) {
      if (root.Progress && typeof root.Progress.isCompleted === 'function') {
        if (root.Progress.isCompleted('challenge:' + id) || root.Progress.isCompleted(id)) return true;
      }
      try {
        var studioMap = JSON.parse((root.localStorage && root.localStorage.getItem('sql_in_depth_solved_challenges_v1')) || '{}');
        return Boolean(studioMap && studioMap[id]);
      } catch (e) {
        return false;
      }
    },

    _studioSearch: function(id) {
      return '?mode=challenges&challenge=' + encodeURIComponent(id);
    },

    _openInStudio: function(id) {
      if (root.App && typeof root.App.navigateToSandbox === 'function') {
        root.App.navigateToSandbox(null, undefined, this._studioSearch(id));
      } else if (root.location) {
        root.location.href = '/sandbox/' + this._studioSearch(id);
      }
    },

    render: function() {
      if (!this._container) return;
      var activeCh = this._activeChallengeId ? this._findChallenge(this._activeChallengeId) : null;

      if (activeCh) {
        var self = this;
        var redirectId = activeCh.id;
        this._activeChallengeId = null;
        this._container.innerHTML = this._renderDirectory();
        if (root.history && typeof root.history.replaceState === 'function') {
          root.history.replaceState(null, '', '/challenges');
        }
        root.setTimeout(function() { self._openInStudio(redirectId); }, 0);
        return;
      }
      this._container.innerHTML = this._renderDirectory();
    },

    _renderDirectory: function() {
      var challenges = this._getChallenges();
      var solvedCount = 0;
      var self = this;

      challenges.forEach(function(c) {
        if (self.isChallengeSolved(c.id)) solvedCount++;
      });

      var q = (this._searchQuery || '').toLowerCase().trim();
      var diff = this._difficultyFilter || 'all';

      var filtered = challenges.filter(function(c) {
        if (diff !== 'all' && c.difficulty !== diff) return false;
        if (!q) return true;
        var hay = (c.title + ' ' + c.category + ' ' + c.difficulty + ' ' + (c.subtitle || '') + ' ' + ((c.codeFix && c.codeFix.title) || '')).toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      var levelLabel = { easy: 'Beginner', medium: 'Intermediate', hard: 'Advanced', insane: 'Expert' };
      var tiers = [
        { key: 'all', label: 'All' },
        { key: 'easy', label: levelLabel.easy },
        { key: 'medium', label: levelLabel.medium },
        { key: 'hard', label: levelLabel.hard },
        { key: 'insane', label: levelLabel.insane }
      ];

      var filterHtml = tiers.map(function(t) {
        var count = t.key === 'all' ? challenges.length : challenges.filter(function(c) { return c.difficulty === t.key; }).length;
        if (t.key !== 'all' && count === 0) return '';
        return '<button type="button" class="chal-filter' + (diff === t.key ? ' is-active' : '') + '" data-challenge-tier="' + t.key + '" aria-pressed="' + (diff === t.key) + '">' +
          escapeHtml(t.label) + ' <span class="chal-filter__count">' + count + '</span>' +
        '</button>';
      }).join('');

      var lessonTitle = function(slug) {
        var data = root.CURRICULUM_DATA;
        if (!data || !Array.isArray(data.parts)) return '';
        for (var p = 0; p < data.parts.length; p++) {
          var mods = data.parts[p].modules || [];
          for (var m = 0; m < mods.length; m++) {
            var units = mods[m].units || [];
            for (var u = 0; u < units.length; u++) {
              if (units[u].slug === slug) return units[u].title || '';
            }
          }
        }
        return '';
      };

      var rowsHtml = filtered.map(function(c) {
        var solved = self.isChallengeSolved(c.id);
        var number = challenges.indexOf(c) + 1;
        var title = (c.codeFix && c.codeFix.title) || c.title;
        var lessonSlug = Array.isArray(c.relatedSlugs) && c.relatedSlugs.length > 0 ? c.relatedSlugs[0] : '';
        var lessonName = lessonSlug ? lessonTitle(lessonSlug) : '';
        return (
          '<li class="chal-row' + (solved ? ' is-solved' : '') + '">' +
            '<span class="chal-row__num" aria-hidden="true">' + (solved ? '✓' : String(number).padStart(2, '0')) + '</span>' +
            '<div class="chal-row__main">' +
              '<h2 class="chal-row__title">' +
                '<a href="/sandbox/' + escapeHtml(self._studioSearch(c.id)) + '" data-nav="sandbox" data-search="' + escapeHtml(self._studioSearch(c.id)) + '">' + escapeHtml(title) + '</a>' +
              '</h2>' +
              '<p class="chal-row__desc">' + escapeHtml(c.subtitle || c.summary || '') + '</p>' +
              '<div class="chal-row__meta">' +
                '<span class="chal-level chal-level--' + escapeHtml(c.difficulty) + '">' + escapeHtml(levelLabel[c.difficulty] || c.difficulty) + '</span>' +
                '<span>' + escapeHtml(c.category || '') + '</span>' +
                '<span>~' + (c.estimatedMinutes || 15) + ' min</span>' +
                (lessonName
                  ? '<a class="chal-row__lesson" href="/topic/' + escapeHtml(lessonSlug) + '/" data-nav="topic" data-slug="' + escapeHtml(lessonSlug) + '">Learn first: ' + escapeHtml(lessonName) + '</a>'
                  : '') +
              '</div>' +
            '</div>' +
            '<a class="chal-row__cta" href="/sandbox/' + escapeHtml(self._studioSearch(c.id)) + '" data-nav="sandbox" data-search="' + escapeHtml(self._studioSearch(c.id)) + '">' +
              (solved ? 'Review' : 'Solve') +
            '</a>' +
          '</li>'
        );
      }).join('');

      var pct = challenges.length ? Math.round((solvedCount / challenges.length) * 100) : 0;

      return (
        '<div class="view-canvas challenges-view chal-page">' +
          '<header class="chal-hero">' +
            '<h1 class="view-title">SQL Challenges</h1>' +
            '<p class="view-subtitle">Each challenge is a small, real-world bug in a SQL query. Fix the starter query in SQL Studio and the checker tells you the moment your result is correct.</p>' +
            '<ol class="chal-steps" aria-label="How challenges work">' +
              '<li><span>1</span>Read the problem</li>' +
              '<li><span>2</span>Fix the query in SQL Studio</li>' +
              '<li><span>3</span>Check your answer</li>' +
            '</ol>' +
            '<div class="chal-progress" role="group" aria-label="Your progress">' +
              '<div class="chal-progress__text"><strong>' + solvedCount + ' of ' + challenges.length + '</strong> solved</div>' +
              '<div class="chal-progress__track"><span style="width:' + pct + '%"></span></div>' +
            '</div>' +
          '</header>' +
          '<div class="chal-controls">' +
            '<input type="search" class="chal-search" id="challenges-search-input" placeholder="Search by topic, e.g. NULL, JOIN, window" aria-label="Search challenges" value="' + escapeHtml(this._searchQuery) + '" />' +
            '<div class="chal-filters" role="group" aria-label="Filter by level">' + filterHtml + '</div>' +
          '</div>' +
          '<div class="view-body" id="challenges-mount-target">' +
            (rowsHtml
              ? '<ol class="chal-list">' + rowsHtml + '</ol>'
              : '<p class="chal-empty">No challenges match. Try a different word or level.</p>') +
          '</div>' +
        '</div>'
      );
    },

    _renderRootCauses: function(ch) {
      var self = this;
      var rootCausesHtml = (ch.rootCauses || []).map(function(rc) {
        var isChecked = self._selectedRootCauseId === rc.id;
        return (
          '<label class="root-cause-option ' + (isChecked ? 'selected' : '') + '">' +
            '<input type="radio" name="incident-root-cause" value="' + escapeHtml(rc.id) + '" ' + (isChecked ? 'checked' : '') + ' />' +
            '<span>' + escapeHtml(rc.description) + '</span>' +
          '</label>'
        );
      }).join('');

      var statusMsg = '';
      if (this._selectedRootCauseId === null) {
        statusMsg = '<p class="root-cause-hint" id="root-cause-diagnosis-hint">Select a root cause hypothesis above to verify diagnosis</p>';
      }

      return (
        '<div class="root-cause-box">' +
          '<h4>Select Primary Root Cause</h4>' +
          '<div class="root-causes-list">' + rootCausesHtml + '</div>' +
          statusMsg +
        '</div>'
      );
    },

    _evaluateState: function(ch) {
      if (!ch || typeof ch.verify !== 'function') return null;
      var res = ch.verify(this._knobValues);
      if (this._selectedRootCauseId === null) {
        return {
          success: false,
          rootCauseSelected: false,
          message: 'Select a root cause hypothesis above to verify diagnosis',
          metrics: res ? res.metrics : null
        };
      }
      var rcs = ch.rootCauses || [];
      var selectedRc = null;
      for (var i = 0; i < rcs.length; i++) {
        if (rcs[i].id === this._selectedRootCauseId) {
          selectedRc = rcs[i];
          break;
        }
      }
      if (!selectedRc || !selectedRc.correct) {
        return {
          success: false,
          rootCauseSelected: true,
          message: (selectedRc && selectedRc.feedback)
            ? selectedRc.feedback
            : 'Your infrastructure tuning stabilized the metrics, but the selected Root Cause diagnosis is incorrect. Please identify the accurate root cause.',
          metrics: res ? res.metrics : null
        };
      }
      return res;
    },

    _renderCodeHotfixCard: function(ch) {
      if (!ch || !ch.codeFix) return '';
      var cf = ch.codeFix;
      var verified = Boolean(this._codeHotfixPassed || (this._hotfixSolvedMap && this._hotfixSolvedMap[ch.id]));
      return (
        '<div class="code-hotfix-card eco-card" id="challenge-code-hotfix-card">' +
          '<div class="view-badge-row">' +
            '<span class="eco-pill">SQL &amp; Storage Engine Hotfix (PostgreSQL 18 / SQLite WASM)</span>' +
            (verified
              ? '<span class="eco-pill eco-pill--success" data-hotfix-status="verified">✓ SQL Hotfix Verified</span>'
              : '<span class="eco-pill eco-pill--warning" data-hotfix-status="pending">● Patch Unverified</span>') +
            '</div>' +
          '<h4 class="code-hotfix-card__title">' + escapeHtml(cf.title || 'Production SQL & Engine Hotfix') + '</h4>' +
          '<p class="code-hotfix-card__summary">' + escapeHtml(cf.summary || '') + '</p>' +
          '<div class="code-hotfix-card__actions">' +
            '<button type="button" class="eco-btn eco-btn--primary" data-action="open-challenge-codelab" data-challenge-id="' + escapeHtml(ch.id) + '">' +
              'Open Hotfix in SQL Studio' +
            '</button>' +
          '</div>' +
          '<div id="challenge-inline-codelab-mount" class="challenge-inline-codelab-mount"></div>' +
        '</div>'
      );
    },

    _renderWorkspace: function(ch) {
      return this._renderIncidentRoom(ch);
    },

    _renderIncidentRoom: function(ch) {
      var self = this;
      var solved = this.isChallengeSolved(ch.id);
      var m = ch.metricsAndLogs || {};
      var liveMetrics = (this._lastVerifyResult && this._lastVerifyResult.metrics) ? this._lastVerifyResult.metrics : m;

      var symptomsHtml = (ch.symptoms || []).map(function(s) {
        return '<li>' + escapeHtml(s) + '</li>';
      }).join('');

      var invariantsHtml = (ch.invariants || []).map(function(inv) {
        return '<li>' + escapeHtml(inv).replace(/`([^`]+)`/g, '<code>$1</code>') + '</li>';
      }).join('');

      var timeseriesHtml = (m.timeseries || []).map(function(pt) {
        var rawErr = pt.errorRate != null ? Number(pt.errorRate) : null;
        var normErrPct = rawErr == null || Number.isNaN(rawErr) ? 0 : (rawErr > 0 && rawErr <= 1 ? rawErr * 100 : rawErr);
        var errPct = rawErr != null ? Math.round(normErrPct * 10) / 10 + '%' : '-';
        var p99Val = pt.latencyP99 != null ? (/ms|s$/i.test(String(pt.latencyP99)) ? String(pt.latencyP99) : pt.latencyP99 + 'ms') : '-';
        var barH = Math.min(100, Math.max(12, Math.round(normErrPct || 12)));
        return (
          '<div class="ts-bar-col">' +
            '<div class="ts-bar-track"><div class="ts-bar-fill" style="height:' + barH + '%"></div></div>' +
            '<span class="ts-time">' + escapeHtml(pt.time) + '</span>' +
            '<span class="ts-val">' + escapeHtml(p99Val) + ' / ' + escapeHtml(errPct) + '</span>' +
          '</div>'
        );
      }).join('');

      var logsHtml = (m.logs || []).map(function(l) {
        var lvlClass = 'log-level--' + (l.level || 'INFO').toLowerCase();
        return (
          '<div class="incident-log-line">' +
            '<span class="log-ts">' + escapeHtml(l.timestamp) + '</span> ' +
            '<span class="log-level ' + lvlClass + '">[' + escapeHtml(l.level) + ']</span> ' +
            '<span class="log-svc">[' + escapeHtml(l.service) + ']</span> ' +
            '<span class="log-msg">' + escapeHtml(l.message) + '</span>' +
          '</div>'
        );
      }).join('');

      var rootCauseSectionHtml = this._renderRootCauses(ch);

      var knobsHtml = (ch.interactiveTuning || []).map(function(k) {
        var currentVal = self._knobValues[k.id] != null ? self._knobValues[k.id] : k.defaultValue;
        var controlHtml = '';
        if (k.type === 'select') {
          var opts = (k.options || []).map(function(o) {
            return '<option value="' + escapeHtml(o) + '" ' + (String(currentVal) === String(o) ? 'selected' : '') + '>' + escapeHtml(o) + '</option>';
          }).join('');
          controlHtml = '<select class="knob-select" data-knob-id="' + escapeHtml(k.id) + '">' + opts + '</select>';
        } else {
          controlHtml =
            '<div class="knob-range-row">' +
              '<input type="range" class="knob-range" data-knob-id="' + escapeHtml(k.id) + '" min="' + k.min + '" max="' + k.max + '" step="' + k.step + '" value="' + escapeHtml(currentVal) + '" />' +
              '<span class="knob-value-badge" data-knob-display="' + escapeHtml(k.id) + '">' + escapeHtml(currentVal) + (k.unit ? ' ' + escapeHtml(k.unit) : '') + '</span>' +
            '</div>';
        }

        return (
          '<div class="tuning-knob-card">' +
            '<div class="tuning-knob-header">' +
              '<label class="tuning-knob-label">' + escapeHtml(k.label) + '</label>' +
            '</div>' +
            '<p class="tuning-knob-desc">' + escapeHtml(k.description || '') + '</p>' +
            controlHtml +
          '</div>'
        );
      }).join('');

      var hotfixCardHtml = this._renderCodeHotfixCard(ch);

      var verifyBanner = '';
      if (this._lastVerifyResult) {
        var ok = this._lastVerifyResult.success;
        verifyBanner =
          '<div class="incident-verify-banner ' + (ok ? 'verify--success' : 'verify--error') + '" id="incident-verify-result">' +
            '<div class="verify-banner__title">' +
              (ok ? '✓ INCIDENT RESOLVED — SYSTEM RECOVERED (+' + (ch.xp || 100) + ' XP)' : '⚠ SLO BREACH PERSISTS — RE-TUNE PARAMETERS') +
            '</div>' +
            '<p class="verify-banner__msg">' + escapeHtml(this._lastVerifyResult.message) + '</p>' +
          '</div>';
      }

      // Dynamic metric display
      var rawP99 = liveMetrics.latencyP99 != null ? liveMetrics.latencyP99 : m.latencyP99;
      var metricP99 = rawP99 != null ? (/ms|s$/i.test(String(rawP99).trim()) ? String(rawP99) : rawP99 + ' ms') : 'N/A';
      var rawErrVal = liveMetrics.errorRate != null ? liveMetrics.errorRate : m.errorRate;
      var metricErr = 'N/A';
      if (rawErrVal != null) {
        if (typeof rawErrVal === 'string' && rawErrVal.indexOf('%') !== -1) {
          metricErr = rawErrVal;
        } else {
          var numErr = Number(rawErrVal);
          metricErr = !Number.isNaN(numErr)
            ? (numErr > 0 && numErr <= 1 ? (numErr * 100).toFixed(1) + '%' : numErr + '%')
            : String(rawErrVal);
        }
      }

      return (
        '<div class="view-canvas challenges-view incident-room" data-active-challenge="' + escapeHtml(ch.id) + '">' +
          '<header class="view-header">' +
            '<div class="view-header__top">' +
              '<div>' +
                '<button class="eco-btn eco-btn--sm" data-challenges-back="true">← All Incident Challenges</button>' +
                '<div class="view-badge-row" style="margin-top:12px;">' +
                  '<span class="eco-pill tier--' + escapeHtml(ch.difficulty) + '">' + escapeHtml(ch.difficulty.toUpperCase()) + '</span>' +
                  '<span class="eco-pill">' + escapeHtml(ch.category) + '</span>' +
                  '<span class="eco-pill">+' + (ch.xp || 100) + ' XP</span>' +
                  (solved ? '<span class="eco-pill eco-pill--success" id="challenge-solved-badge">✓ Incident Resolved</span>' : '<span class="eco-pill eco-pill--danger">● PagerDuty SEV-1 Active</span>') +
                '</div>' +
                '<h1 class="view-title">' + escapeHtml(ch.title) + '</h1>' +
                '<p class="view-subtitle"><strong>SLA Impact:</strong> ' + escapeHtml(ch.slaImpact || '') + '</p>' +
              '</div>' +
            '</div>' +
          '</header>' +
          '<div class="view-body" id="challenges-mount-target">' +
            verifyBanner +
            '<div class="incident-room-grid">' +
              '<section class="incident-panel">' +
                '<h2 class="panel-title">1. Outage Symptoms &amp; Live Telemetry</h2>' +
                '<ul class="incident-list">' + symptomsHtml + '</ul>' +
                '<div class="telemetry-kpi-row">' +
                  '<div class="telemetry-kpi"><span>P99 Latency</span><strong id="kpi-p99">' + escapeHtml(metricP99) + '</strong></div>' +
                  '<div class="telemetry-kpi"><span>Error Rate</span><strong id="kpi-err">' + escapeHtml(metricErr) + '</strong></div>' +
                '</div>' +
                (timeseriesHtml ? (
                  '<div class="telemetry-timeseries">' +
                    '<h4>Recent 5-Minute Telemetry Trend</h4>' +
                    '<div class="ts-bars">' + timeseriesHtml + '</div>' +
                  '</div>'
                ) : '') +
                '<div class="incident-log-console">' +
                  '<div class="console-header">Production Log Stream (tail -f /var/log/syslog)</div>' +
                  '<div class="console-body">' + logsHtml + '</div>' +
                '</div>' +
              '</section>' +
              '<section class="incident-panel">' +
                '<h2 class="panel-title">2. Root Cause &amp; Live Mitigation Controls</h2>' +
                '<div class="invariants-box">' +
                  '<h4>Required Recovery Invariants</h4>' +
                  '<ul class="incident-list">' + invariantsHtml + '</ul>' +
                '</div>' +
                rootCauseSectionHtml +
                '<div class="tuning-knobs-box">' +
                  '<h4>Interactive Infrastructure Tuning Knobs</h4>' +
                  '<div class="tuning-knobs-grid">' + knobsHtml + '</div>' +
                '</div>' +
                hotfixCardHtml +
                '<div class="incident-actions-bar">' +
                  '<button class="eco-btn eco-btn--primary eco-btn--lg" id="verify-incident-btn" data-action-verify="' + escapeHtml(ch.id) + '">Deploy Mitigation &amp; Verify Recovery</button>' +
                  '<button class="eco-btn" id="auto-tune-optimal-btn" data-action-autotune="' + escapeHtml(ch.id) + '">Apply Recommended Runbook Preset</button>' +
                '</div>' +
              '</section>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    },

    _applyOptimalPreset: function(ch) {
      if (!ch) return;
      // Select correct root cause
      var rcs = ch.rootCauses || [];
      for (var i = 0; i < rcs.length; i++) {
        if (rcs[i].correct) {
          this._selectedRootCauseId = rcs[i].id;
          break;
        }
      }
      // Known optimal presets matching data/challenges.js interactiveTuning knob IDs
      var presets = {
        'retry-storm-meltdown': { maxRetries: 2, backoffBaseMs: 300, jitter: 'decorrelated', circuitBreakerThreshold: 30 },
        'cache-stampede-meltdown': { singleflightMutex: 'enabled', earlyRecompute: 'x-fetch-optimal', cacheTtlJitterPercent: 20, dbConnectionPoolMax: 80 },
        'rate-limiter-leak': { keyTtlSeconds: 180, evictionPolicy: 'volatile-ttl', failureMode: 'fail-open', algorithm: 'token-bucket-hash' },
        'hot-partition-herd': { partitionKeyStrategy: 'order_id_murmur3', partitionCount: 16, consumerWorkers: 16, fetchMaxBytesMb: 5 },
        'circuit-breaker-flapping': { rollingWindowSeconds: 20, minRequestThreshold: 50, failureRateThreshold: 55, sleepWindowSeconds: 20, halfOpenProbes: 5 },
        'wal-torn-write-corruption': { walSyncMode: 'group_commit_fsync', groupCommitIntervalMs: 5, checksumAlgorithm: 'crc32c', tornWritePolicy: 'truncate_tail_if_uncommitted' },
        'slow-consumer-queue-spiral': { consumerConcurrency: 64, prefetchCount: 10, httpTimeoutSeconds: 2, deadLetterQueue: 'dlq_after_3_retries' },
        'split-brain-quorum-loss': { quorumPolicy: 'strict_cluster_majority', electionTimeoutMinMs: 300, electionTimeoutMaxMs: 600, heartbeatIntervalMs: 60 },
        'replication-lag-read-drift': { readRouting: 'read_your_writes_session_token', idempotencyEnforcement: 'redis_setnx_idempotency_key', syncStandbyCount: 1, maxLagToleranceMs: 500 },
        'cascading-deadlock-depletion': { lockOrdering: 'deterministic_sorted_id', deadlockTimeoutMs: 100, statementTimeoutMs: 500, transactionIsolation: 'read_committed_with_pessimistic_lock' },
        'two-phase-commit-coordinator-hang': { architecturePattern: 'saga_orchestrator_with_compensation', participantLockTimeoutMs: 1000, coordinatorHaStandbys: 2, recoveryDaemonIntervalSec: 3 },
        'gossip-partition-flapping-cascade': { phiConvictThreshold: 10, gossipIntervalMs: 500, suspectGracePeriodSeconds: 20, repairThrottlingMbSec: 50 }
      };

      var preset = (ch && ch.optimalPreset) || presets[ch.id];
      if (preset) {
        var keys = Object.keys(preset);
        for (var k = 0; k < keys.length; k++) {
          this._knobValues[keys[k]] = preset[keys[k]];
        }
      }
    },

    verifyActiveChallenge: function() {
      var ch = this._findChallenge(this._activeChallengeId);
      if (!ch || typeof ch.verify !== 'function') return null;

      var res = this._evaluateState(ch);
      this._lastVerifyResult = res;
      if (res && res.success && root.Progress) {
        root.Progress.markComplete('challenge:' + ch.id);
      }
      if (root.Analytics && root.Analytics.trackChallengeVerify) {
        root.Analytics.trackChallengeVerify({
          challengeId: ch.id,
          passed: Boolean(res && res.success),
          score: res ? (res.score || (res.success ? 100 : 0)) : 0,
          attempts: 1,
          rootCauseCorrect: Boolean(res && res.rootCauseOk),
          hotfixPassed: Boolean(this._codeHotfixPassed)
        });
      }
      this.render();
      return res;
    },

    markCodeHotfixPassed: function(chId) {
      var targetId = chId || this._activeChallengeId;
      this._codeHotfixPassed = true;
      if (!this._hotfixSolvedMap) this._hotfixSolvedMap = {};
      if (targetId) this._hotfixSolvedMap[targetId] = true;
      if (root.Analytics && root.Analytics.trackChallengeHotfix) {
        root.Analytics.trackChallengeHotfix({ challengeId: targetId, action: 'verified_codelab' });
      }
      var statusPill = this._container && this._container.querySelector('[data-hotfix-status]');
      if (statusPill) {
        statusPill.setAttribute('data-hotfix-status', 'verified');
        statusPill.className = 'eco-pill eco-pill--success';
        statusPill.textContent = '✓ SQL Hotfix Verified';
      } else {
        this.render();
      }
    },

    _openChallengeCodeLab: function(ch) {
      if (!ch || !ch.codeFix) return;
      var self = this;
      if (root.Analytics && root.Analytics.trackChallengeHotfix) {
        root.Analytics.trackChallengeHotfix({ challengeId: ch.id, action: 'open_codelab' });
      }
      var markHotfixVerified = function() {
        self.markCodeHotfixPassed(ch.id);
      };

      if (root.App && typeof root.App.openChallengeCodeLab === 'function') {
        root.App.openChallengeCodeLab(ch.id, markHotfixVerified);
        return;
      }

      var mountEl = this._container && this._container.querySelector('#challenge-inline-codelab-mount');
      if (mountEl && root.TableVisualizer && typeof root.TableVisualizer.mountClauseVisualizer === 'function') {
        var sampleSql = (ch.codeFix && (ch.codeFix.buggyCode || ch.codeFix.solutionCode || ch.codeFix.sqlQuery)) || 'SELECT a.account_id, a.owner_name, a.posted_balance_cents, COUNT(j.entry_id) AS postings FROM accounts a LEFT JOIN journal_entries j ON j.account_id = a.account_id GROUP BY a.account_id, a.owner_name, a.posted_balance_cents ORDER BY a.account_id ASC;';
        root.TableVisualizer.mountClauseVisualizer(mountEl, {
          datasetId: (ch.codeFix && ch.codeFix.datasetId) || 'ecommerce',
          sql: sampleSql,
          referenceSql: (ch.codeFix && ch.codeFix.solutionCode) || sampleSql,
          buggyCode: (ch.codeFix && ch.codeFix.buggyCode) || '',
          showEditor: true,
          startAtFinal: true,
          onVerify: function(vRes) {
            if (vRes && vRes.passed) {
              markHotfixVerified();
            }
          }
        });
      }
    },

    _bindEvents: function() {
      var self = this;
      var container = this._container;
      if (!container) return;
      if (this._abortController) this._abortController.abort();
      this._abortController = new AbortController();
      var sig = { signal: this._abortController.signal };

      container.addEventListener('click', function(e) {
        var tierBtn = e.target.closest('[data-challenge-tier]');
        if (tierBtn) {
          self._difficultyFilter = tierBtn.getAttribute('data-challenge-tier');
          self.render();
          return;
        }

        var enterBtn = e.target.closest('[data-enter-challenge]');
        if (enterBtn) {
          var chId = enterBtn.getAttribute('data-enter-challenge');
          self._activeChallengeId = chId;
          self._initChallengeState(chId);
          var enteredCh = self._findChallenge(chId);
          if (root.Analytics && root.Analytics.trackChallengeSelect) {
            root.Analytics.trackChallengeSelect({
              challengeId: chId,
              title: enteredCh ? enteredCh.title : chId,
              severity: enteredCh ? enteredCh.severity : 'SEV-1'
            });
          }
          if (root.history && root.history.pushState) {
            root.history.pushState(null, '', '/challenges/' + chId);
          }
          self.render();
          return;
        }

        var backBtn = e.target.closest('[data-challenges-back]');
        if (backBtn) {
          self._activeChallengeId = null;
          self._lastVerifyResult = null;
          if (root.history && root.history.pushState) {
            root.history.pushState(null, '', '/challenges');
          }
          self.render();
          return;
        }

        var codeLabBtn = e.target.closest('[data-action="open-challenge-codelab"]');
        if (codeLabBtn) {
          e.preventDefault();
          e.stopPropagation();
          var activeCh = self._findChallenge(self._activeChallengeId);
          self._openChallengeCodeLab(activeCh);
          return;
        }

        var verifyBtn = e.target.closest('[data-action-verify]');
        if (verifyBtn) {
          self.verifyActiveChallenge();
          return;
        }

        var autoTuneBtn = e.target.closest('[data-action-autotune]');
        if (autoTuneBtn) {
          var ch = self._findChallenge(self._activeChallengeId);
          self._applyOptimalPreset(ch);
          self.verifyActiveChallenge();
          return;
        }
      }, sig);

      container.addEventListener('change', function(e) {
        if (e.target && e.target.name === 'incident-root-cause') {
          self._selectedRootCauseId = e.target.value;
          if (root.Analytics && root.Analytics.trackChallengeRootCause) {
            root.Analytics.trackChallengeRootCause({
              challengeId: self._activeChallengeId,
              rootCauseId: e.target.value
            });
          }
          container.querySelectorAll('.root-cause-option').forEach(function(el) {
            var inp = el.querySelector('input');
            el.classList.toggle('selected', Boolean(inp && inp.checked));
          });
          var hintEl = container.querySelector('#root-cause-diagnosis-hint');
          if (hintEl) hintEl.remove();
          return;
        }

        var knobEl = e.target.closest('[data-knob-id]');
        if (knobEl) {
          var kId = knobEl.getAttribute('data-knob-id');
          var val = knobEl.type === 'range' ? Number(knobEl.value) : knobEl.value;
          self._knobValues[kId] = val;
          if (root.Analytics && root.Analytics.trackChallengeMitigation) {
            root.Analytics.trackChallengeMitigation({
              challengeId: self._activeChallengeId,
              mitigationId: kId,
              enabled: true
            });
          }
        }
      }, sig);

      container.addEventListener('input', function(e) {
        if (e.target && e.target.id === 'challenges-search-input') {
          self._searchQuery = e.target.value;
          self.render();
          var inputEl = container.querySelector('#challenges-search-input');
          if (inputEl) {
            inputEl.focus();
            inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
          }
          return;
        }

        var knobRange = e.target.closest('input.knob-range[data-knob-id]');
        if (knobRange) {
          var kId = knobRange.getAttribute('data-knob-id');
          self._knobValues[kId] = Number(knobRange.value);
          var badge = container.querySelector('[data-knob-display="' + kId + '"]');
          if (badge) {
            var ch = self._findChallenge(self._activeChallengeId);
            var knobMeta = ch && (ch.interactiveTuning || []).find(function(k) { return k.id === kId; });
            var unit = knobMeta && knobMeta.unit ? ' ' + knobMeta.unit : '';
            badge.textContent = knobRange.value + unit;
          }
        }
      }, sig);
    }
  };

  if (root && typeof root === 'object') {
    root.ChallengesController = ChallengesController;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
