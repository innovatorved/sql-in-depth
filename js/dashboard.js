/**
 * SQL in Depth — Learner Dashboard & Study Hub Controller
 * Handles /dashboard view: Gamification stats, SRS flashcards queue, notes, bookmarks, and export/import.
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

  var DashboardController = {
    _container: null,
    _activeTab: 'overview', // overview | srs | notes | toolkit
    _cardIndex: 0,
    _cardFlipped: false,
    _srsCategoryFilter: 'all',
    _reviewedTodayCount: 0,
    _selectedNoteSlug: 'why-databases-exist',
    _importFeedback: null,
    _abortController: null,
    _latencyScaleMode: 'actual', // actual | humanized
    _matrixCategory: 'all', // all | indexing | joins | isolation | storage | olap
    _capState: {
      inputN: 10000000,
      queriesQ: 5000,
      timeLimitSec: 1.0,
      opsPerSec: 25000,
      elemBytes: 128,
      nodeOverheadBytes: 24,
      cacheLineBytes: 8192,
      memoryLimitMb: 4096
    },

    mount: function(container, options) {
      if (this._abortController) {
        this._abortController.abort();
        this._abortController = null;
      }
      this._container = container;
      if (!container) return;
      options = options || {};
      var urlTab = null;
      try {
        if (typeof window !== 'undefined' && window.location && window.location.search) {
          urlTab = new URLSearchParams(window.location.search).get('tab');
        }
      } catch (e) {}
      this._activeTab = options.tab || urlTab || 'overview';
      this._cardFlipped = false;
      this._importFeedback = null;

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
    },

    _getDueDeck: function() {
      var allCards = Array.isArray(root.SRS_CARDS_DATA) ? root.SRS_CARDS_DATA : [];
      var cat = this._srsCategoryFilter || 'all';
      var nowIso = new Date().toISOString();
      var prog = root.Progress;

      return allCards.filter(function(c) {
        if (cat !== 'all' && c.category !== cat) return false;
        if (!prog || typeof prog.getSrsState !== 'function') return true;
        var st = prog.getSrsState(c.id);
        if (!st || !st.dueAt) return true;
        return st.dueAt <= nowIso;
      });
    },

    rateCurrentCard: function(quality) {
      var deck = this._getDueDeck();
      if (deck.length === 0) return;
      var idx = this._cardIndex % deck.length;
      var card = deck[idx];
      if (!card || !root.Progress) return;

      var prev = root.Progress.getSrsState(card.id) || { interval: 0, repetition: 0, efactor: 2.5 };
      var interval = prev.interval || 0;
      var repetition = prev.repetition || 0;
      var efactor = prev.efactor || 2.5;

      // SuperMemo SM-2 calculation
      if (quality < 3) {
        repetition = 0;
        interval = 0;
      } else {
        if (repetition === 0) interval = 1;
        else if (repetition === 1) interval = 3;
        else if (quality === 5) interval = Math.max(7, Math.round(interval * efactor * 1.3));
        else interval = Math.round(interval * efactor);
        repetition += 1;
      }

      efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (efactor < 1.3) efactor = 1.3;

      var dueTimeMs = Date.now() + (interval > 0 ? interval * 86400000 : 60000);
      var newState = {
        interval: interval,
        repetition: repetition,
        efactor: Number(efactor.toFixed(2)),
        dueAt: new Date(dueTimeMs).toISOString(),
        lastReviewedAt: new Date().toISOString()
      };

      root.Progress.updateSrs(card.id, newState);
      if (root.Analytics && typeof root.Analytics.trackSrsReview === 'function') {
        root.Analytics.trackSrsReview(card.id, quality, interval);
      }
      if (typeof root.Progress.updateStreak === 'function') {
        root.Progress.updateStreak();
      }
      this._reviewedTodayCount += 1;
      this._cardFlipped = false;
      if (interval === 0) {
        this._cardIndex = (this._cardIndex + 1) % Math.max(1, deck.length);
      } else {
        this._cardIndex = 0;
      }
      this.render();
    },

    render: function() {
      if (!this._container) return;

      var prog = root.Progress;
      var xp = prog && prog.getXP ? prog.getXP() : 0;
      var streak = prog && prog.getStreak ? prog.getStreak() : { current: 0, longest: 0 };

      this._container.innerHTML =
        '<div class="view-canvas dashboard-view">' +
          '<header class="view-header">' +
            '<div class="view-header__top">' +
              '<div class="view-header__content">' +
                '<div class="view-badge-row">' +
                  '<span class="eco-pill eco-pill--accent">' + xp + ' Total XP</span>' +
                  '<span class="eco-pill">' + (streak.current || 0) + ' Day Streak</span>' +
                '</div>' +
                '<h1 class="view-title">Learner Dashboard &amp; Study Hub</h1>' +
                '<p class="view-subtitle">Track your mastery streak, review SuperMemo SM-2 spaced-repetition flashcards, and manage study notes.</p>' +
              '</div>' +
              '<div class="view-tabs" role="tablist">' +
                '<button class="view-tab ' + (this._activeTab === 'overview' ? 'active' : '') + '" data-dash-tab="overview" role="tab" aria-selected="' + (this._activeTab === 'overview') + '">Overview &amp; XP</button>' +
                '<button class="view-tab ' + (this._activeTab === 'srs' ? 'active' : '') + '" data-dash-tab="srs" role="tab" aria-selected="' + (this._activeTab === 'srs') + '">SRS Flashcards</button>' +
                '<button class="view-tab ' + (this._activeTab === 'toolkit' ? 'active' : '') + '" data-dash-tab="toolkit" role="tab" aria-selected="' + (this._activeTab === 'toolkit') + '">Reference &amp; Capacity Toolkit</button>' +
                '<button class="view-tab ' + (this._activeTab === 'notes' ? 'active' : '') + '" data-dash-tab="notes" role="tab" aria-selected="' + (this._activeTab === 'notes') + '">Notes &amp; Bookmarks</button>' +
              '</div>' +
            '</div>' +
          '</header>' +
          '<main class="view-body" id="dashboard-mount-target">' +
            this._renderTabBody() +
          '</main>' +
        '</div>';
    },

    _renderTabBody: function() {
      if (this._activeTab === 'srs') return this._renderSrsTab();
      if (this._activeTab === 'toolkit') return this._renderToolkitTab();
      if (this._activeTab === 'notes') return this._renderNotesTab();
      return this._renderOverviewTab();
    },

    _renderOverviewTab: function() {
      var prog = root.Progress;
      var xp = prog && prog.getXP ? prog.getXP() : 0;
      var streak = prog && prog.getStreak ? prog.getStreak() : { current: 0, longest: 0 };
      var timeSpent = prog && prog.getTimeSpent ? prog.getTimeSpent() : { formatted: '0m' };
      var completedCount = prog && prog.getCompletedCount ? prog.getCompletedCount() : 0;
      var totalUnits = prog && prog.getTotalUnits ? prog.getTotalUnits() : 200;
      var pct = prog && prog.getPercentage ? prog.getPercentage() : 0;
      var deck = this._getDueDeck();

      var challenges = (root.CHALLENGES_DATA && Array.isArray(root.CHALLENGES_DATA.challenges))
        ? root.CHALLENGES_DATA.challenges
        : (Array.isArray(root.CHALLENGES_DATA) ? root.CHALLENGES_DATA : []);
      var solvedChallenges = challenges.filter(function(c) {
        return prog && prog.isCompleted && (prog.isCompleted('challenge:' + c.id) || prog.isCompleted(c.id));
      }).length;

      var blueprints = (root.WHITEBOARD_DATA && Array.isArray(root.WHITEBOARD_DATA.blueprints))
        ? root.WHITEBOARD_DATA.blueprints
        : (Array.isArray(root.WHITEBOARD_BLUEPRINTS) ? root.WHITEBOARD_BLUEPRINTS : []);
      var blueprintCount = blueprints.length || 10;

      var buildSlugs = root.IMPLEMENTATIONS_DATA ? Object.keys(root.IMPLEMENTATIONS_DATA) : [];
      var totalBuilds = buildSlugs.length || 20;
      var completedBuilds = buildSlugs.filter(function(slug) {
        if (!prog) return false;
        if (prog.getBuildProgress) {
          var bp = prog.getBuildProgress(slug);
          if (bp && bp.completed) return true;
        }
        return prog.isCompleted && (prog.isCompleted('build:' + slug) || prog.isCompleted(slug));
      }).length;

      var paths = (root.ROADMAP_DATA && (root.ROADMAP_DATA.careerPaths || root.ROADMAP_DATA.paths)) || [];
      var pathsHtml = paths.map(function(p) {
        var steps = p.steps || [];
        var done = 0;
        steps.forEach(function(s) {
          if (prog && prog.isCompleted && (prog.isCompleted(s.slug || s.id) || prog.isCompleted('challenge:' + s.id) || prog.isCompleted('sandbox:' + s.id) || prog.isCompleted('build:' + s.slug))) {
            done++;
          }
        });
        var pPct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;
        return (
          '<div class="dash-path-row">' +
            '<div class="dash-path-info">' +
              '<strong>' + escapeHtml(p.title) + '</strong>' +
              '<span>' + done + ' / ' + steps.length + ' steps (' + pPct + '%)</span>' +
            '</div>' +
            '<div class="eco-progress-bar"><div class="eco-progress-fill" style="width:' + pPct + '%"></div></div>' +
          '</div>'
        );
      }).join('');

      return (
        '<div class="dashboard-overview-grid">' +
          '<div class="eco-grid eco-grid--4 dash-kpi-row">' +
            '<div class="eco-card dash-kpi-card">' +
              '<span class="kpi-label">Active Streak</span>' +
              '<strong class="kpi-val" id="dash-streak-val">' + (streak.current || 0) + ' Days</strong>' +
              '<span class="kpi-sub">Longest: ' + (streak.longest || 0) + ' days</span>' +
            '</div>' +
            '<div class="eco-card dash-kpi-card">' +
              '<span class="kpi-label">Experience Points</span>' +
              '<strong class="kpi-val" id="dash-xp-val">' + xp.toLocaleString() + ' XP</strong>' +
              '<span class="kpi-sub">' + completedBuilds + '/' + totalBuilds + ' Build Labs Completed</span>' +
            '</div>' +
            '<div class="eco-card dash-kpi-card">' +
              '<span class="kpi-label">Curriculum Mastery</span>' +
              '<strong class="kpi-val" id="dash-completion-val">' + pct + '%</strong>' +
              '<span class="kpi-sub">' + completedCount + ' of ' + totalUnits + ' items completed</span>' +
            '</div>' +
            '<div class="eco-card dash-kpi-card">' +
              '<span class="kpi-label">Total Study Time</span>' +
              '<strong class="kpi-val" id="dash-time-val">' + escapeHtml(timeSpent.formatted || '0m') + '</strong>' +
              '<span class="kpi-sub">' + solvedChallenges + '/12 Challenges · ' + blueprintCount + ' Blueprints</span>' +
            '</div>' +
          '</div>' +

          '<div class="eco-grid eco-grid--2" style="margin-top:24px;">' +
            '<section class="eco-card">' +
              '<h2 class="eco-card__title">Career Path Progress</h2>' +
              '<p class="eco-card__desc">Your real-time completion across the 5 role-based engineering tracks.</p>' +
              '<div class="dash-paths-stack">' + pathsHtml + '</div>' +
              '<div style="margin-top:16px;">' +
                '<button class="eco-btn eco-btn--sm" data-dash-nav="roadmap">Explore Full Visual Roadmap →</button>' +
              '</div>' +
            '</section>' +
            '<section class="eco-card">' +
              '<h2 class="eco-card__title">Recommended Next Actions</h2>' +
              '<p class="eco-card__desc">High-impact engineering exercises queued for your current mastery level.</p>' +
              '<div class="recommended-actions-list">' +
                '<div class="rec-action-item">' +
                  '<div><strong>Spaced Repetition Queue</strong><p>' + deck.length + ' flashcards ready for active recall review.</p></div>' +
                  '<button class="eco-btn eco-btn--sm eco-btn--primary" data-dash-tab="srs">Review Cards →</button>' +
                '</div>' +
                '<div class="rec-action-item">' +
                  '<div><strong>Reference &amp; Capacity Toolkit</strong><p>Interactive Napkin-Math Calculator, Hardware Latency Numbers &amp; Trade-Off Matrix.</p></div>' +
                  '<button class="eco-btn eco-btn--sm" data-dash-tab="toolkit">Open Toolkit →</button>' +
                '</div>' +
                '<div class="rec-action-item">' +
                  '<div><strong>Incident Troubleshooting Simulators</strong><p>' + (12 - solvedChallenges) + ' production outage scenarios with CodeLab hotfixes.</p></div>' +
                  '<button class="eco-btn eco-btn--sm" data-dash-nav="challenges">Open Challenges →</button>' +
                '</div>' +
                '<div class="rec-action-item">' +
                  '<div><strong>Interactive Architecture Sandbox</strong><p>Model multi-tab system topologies across ' + blueprintCount + ' blueprints &amp; run live rubric audits.</p></div>' +
                  '<button class="eco-btn eco-btn--sm" data-dash-nav="sandbox">Launch Sandbox →</button>' +
                '</div>' +
              '</div>' +
            '</section>' +
          '</div>' +
        '</div>'
      );
    },

    _renderSrsTab: function() {
      var allCards = Array.isArray(root.SRS_CARDS_DATA) ? root.SRS_CARDS_DATA : [];
      var deck = this._getDueDeck();

      var categories = ['all'];
      var seenCat = {};
      allCards.forEach(function(c) {
        if (c.category && !seenCat[c.category]) {
          seenCat[c.category] = true;
          categories.push(c.category);
        }
      });

      var self = this;
      var catOptions = categories.map(function(cat) {
        return '<option value="' + escapeHtml(cat) + '" ' + (self._srsCategoryFilter === cat ? 'selected' : '') + '>' +
          (cat === 'all' ? 'All Categories (' + allCards.length + ' cards)' : escapeHtml(cat)) +
        '</option>';
      }).join('');

      if (deck.length === 0) {
        return (
          '<div class="srs-empty-state eco-card">' +
            '<h2>All Due Flashcards Reviewed</h2>' +
            '<p>You have completed all due cards in this category for today.</p>' +
            '<button class="eco-btn eco-btn--primary" data-srs-reset-filter="true">Show All Categories</button>' +
          '</div>'
        );
      }

      var idx = this._cardIndex % deck.length;
      var card = deck[idx];

      return (
        '<div class="srs-review-container">' +
          '<div class="eco-controls-bar">' +
            '<div class="srs-stats-row">' +
              '<span class="eco-pill eco-pill--accent">Due Queue: ' + deck.length + ' cards</span>' +
              '<span class="eco-pill">Reviewed This Session: ' + this._reviewedTodayCount + '</span>' +
              '<span class="eco-pill">Card ' + (idx + 1) + ' of ' + deck.length + '</span>' +
            '</div>' +
            '<select class="knob-select" id="srs-category-select" style="max-width:320px;">' + catOptions + '</select>' +
          '</div>' +

          '<div class="srs-flashcard ' + (this._cardFlipped ? 'is-flipped' : '') + '" id="srs-active-card" data-card-id="' + escapeHtml(card.id) + '">' +
            '<div class="srs-flashcard__meta">' +
              '<span class="eco-pill">' + escapeHtml(card.category || 'SQL & Database Architecture') + '</span>' +
              '<span class="eco-pill">' + escapeHtml(card.unitTitle || card.topicSlug || '') + '</span>' +
              '<span class="eco-pill">' + escapeHtml((card.type || 'concept').toUpperCase()) + '</span>' +
            '</div>' +
            '<div class="srs-flashcard__prompt">' +
              '<div class="card-side-label">QUESTION / PROMPT</div>' +
              '<h3>' + escapeHtml(card.prompt) + '</h3>' +
            '</div>' +
            (this._cardFlipped ? (
              '<div class="srs-flashcard__answer" id="srs-card-answer">' +
                '<div class="card-side-label">ARCHITECTURAL ANSWER</div>' +
                '<p>' + escapeHtml(card.answer) + '</p>' +
              '</div>'
            ) : (
              '<div class="srs-flashcard__flip-cta">' +
                '<button class="eco-btn eco-btn--primary eco-btn--lg" id="srs-flip-btn" data-srs-flip="true">Reveal Answer (Space / Click)</button>' +
              '</div>'
            )) +
          '</div>' +

          (this._cardFlipped ? (
            '<div class="srs-rating-bar" id="srs-rating-controls">' +
              '<span class="rating-prompt">Rate recall difficulty (SuperMemo SM-2):</span>' +
              '<div class="srs-rating-buttons">' +
                '<button class="eco-btn srs-btn--again" data-srs-rate="1">Again (1m)</button>' +
                '<button class="eco-btn srs-btn--hard" data-srs-rate="3">Hard (1d)</button>' +
                '<button class="eco-btn srs-btn--good" data-srs-rate="4">Good (3d)</button>' +
                '<button class="eco-btn eco-btn--primary srs-btn--easy" data-srs-rate="5">Easy (7d+)</button>' +
              '</div>' +
            '</div>'
          ) : '') +
        '</div>'
      );
    },

    _renderNotesTab: function() {
      var prog = root.Progress;
      var bookmarks = (prog && prog.getBookmarks) ? prog.getBookmarks() : [];
      var currentNote = (prog && prog.getNote) ? prog.getNote(this._selectedNoteSlug) : '';

      var units = [];
      if (root.CURRICULUM_DATA && root.CURRICULUM_DATA.parts) {
        root.CURRICULUM_DATA.parts.forEach(function(p) {
          (p.modules || []).forEach(function(m) {
            (m.units || []).forEach(function(u) {
              units.push({ slug: u.slug, title: u.title });
            });
          });
        });
      }
      if (units.length === 0) {
        units = [
          { slug: 'why-databases-exist', title: 'Filesystems vs. Relational DBMS & Declarative SQL' },
          { slug: 'btree-bplustree-internal-anatomy', title: 'B-Tree vs. B+Tree Internal Anatomy' },
          { slug: 'multi-version-concurrency-control-mvcc', title: 'Multi-Version Concurrency Control (MVCC)' }
        ];
      }

      var self = this;
      var unitOptions = units.slice(0, 60).map(function(u) {
        return '<option value="' + escapeHtml(u.slug) + '" ' + (self._selectedNoteSlug === u.slug ? 'selected' : '') + '>' + escapeHtml(u.title) + '</option>';
      }).join('');

      var bookmarksHtml = bookmarks.length > 0 ? bookmarks.map(function(slug) {
        return (
          '<div class="bookmark-item" data-bookmark-item="' + escapeHtml(slug) + '">' +
            '<a href="/topic/' + escapeHtml(slug) + '/" class="bookmark-link" data-open-topic="' + escapeHtml(slug) + '">' + escapeHtml(slug.replace(/-/g, ' ')) + '</a>' +
            '<button class="eco-btn eco-btn--sm" data-remove-bookmark="' + escapeHtml(slug) + '">Remove</button>' +
          '</div>'
        );
      }).join('') : '<p class="eco-muted">No bookmarked topics yet. Bookmark any topic or use Quick Bookmark below.</p>';

      var exportedJson = (prog && prog.exportData) ? prog.exportData() : '{}';

      return (
        '<div class="eco-grid eco-grid--2 dashboard-notes-grid">' +
          '<section class="eco-card">' +
            '<h2 class="eco-card__title">Personal Study Notes</h2>' +
            '<p class="eco-card__desc">Write persistent Markdown study notes linked to any curriculum topic.</p>' +
            '<div class="notes-selector-row">' +
              '<label for="dash-note-topic-select">Topic:</label>' +
              '<select class="knob-select" id="dash-note-topic-select">' + unitOptions + '</select>' +
              '<button class="eco-btn eco-btn--sm" id="dash-toggle-bookmark-btn" data-bookmark-slug="' + escapeHtml(this._selectedNoteSlug) + '">' +
                (prog && prog.isBookmarked && prog.isBookmarked(this._selectedNoteSlug) ? '★ Bookmarked' : '☆ Bookmark Topic') +
              '</button>' +
            '</div>' +
            '<textarea class="eco-textarea" id="dash-note-textarea" rows="7" placeholder="Write architectural notes, invariants, or trade-offs for this topic…">' + escapeHtml(currentNote) + '</textarea>' +
            '<div class="notes-actions-row">' +
              '<button class="eco-btn eco-btn--primary" id="dash-save-note-btn" data-save-note="true">Save Note</button>' +
              '<span class="notes-save-status" id="dash-note-status">Saved to localStorage</span>' +
            '</div>' +

            '<h3 class="eco-card__title" style="margin-top:24px;">Bookmarked Topics (' + bookmarks.length + ')</h3>' +
            '<div class="bookmarks-list" id="dash-bookmarks-list">' + bookmarksHtml + '</div>' +
          '</section>' +

          '<section class="eco-card">' +
            '<h2 class="eco-card__title">Data Portability (JSON Export / Import)</h2>' +
            '<p class="eco-card__desc">Back up your entire learning state (completed units, XP, SRS schedule, streak, and notes) or restore from a JSON snapshot.</p>' +
            (this._importFeedback ? (
              '<div class="exam-field-feedback ' + (this._importFeedback.success ? 'fb--correct' : 'fb--wrong') + '" id="dash-import-feedback">' +
                escapeHtml(this._importFeedback.message) +
              '</div>'
            ) : '') +
            '<textarea class="eco-textarea" id="dash-portability-json" rows="9">' + escapeHtml(exportedJson) + '</textarea>' +
            '<div class="notes-actions-row">' +
              '<button class="eco-btn" id="dash-export-btn" data-portability-action="export">Refresh Export JSON</button>' +
              '<button class="eco-btn eco-btn--primary" id="dash-import-btn" data-portability-action="import">Import &amp; Restore JSON</button>' +
            '</div>' +
          '</section>' +
        '</div>'
      );
    },

    _renderToolkitTab: function() {
      var cap = this._capState || {
        inputN: 10000000,
        queriesQ: 5000,
        timeLimitSec: 1.0,
        opsPerSec: 25000,
        elemBytes: 128,
        nodeOverheadBytes: 24,
        cacheLineBytes: 8192,
        memoryLimitMb: 4096
      };

      var n = Math.max(1, cap.inputN || 10000000);
      var q = Math.max(1, cap.queriesQ || 5000);
      var budgetOps = Math.round((cap.timeLimitSec || 1.0) * (cap.opsPerSec || 25000));
      var btreeFanout = 250;
      var btreeHeight = Math.max(1, Math.ceil(Math.log(n) / Math.log(btreeFanout)));
      var nLogN = Math.round(n * Math.max(1, Math.ceil(Math.log2(n))));

      var maxClass = 'Composite B+Tree Index + Hash/Merge Join';
      var recommendedPatterns = 'Covering Index-Only Scan, Hash Join in work_mem, Keyset Seek Pagination';
      if (n <= 10000) {
        maxClass = 'In-Memory Buffer Pool Scan / Indexed NLJ';
        recommendedPatterns = 'Seq Scan or B+Tree Point Lookup, Nested Loop Join, Materialized CTE';
      } else if (n <= 500000) {
        maxClass = 'B+Tree Index Seek + In-Memory Hash Join';
        recommendedPatterns = 'SARGable Composite Index (equality -> sort -> range), Hash Join, Partial Index';
      } else if (n <= 10000000) {
        maxClass = 'Covering Index-Only Scan + Keyset Pagination';
        recommendedPatterns = 'CREATE INDEX ... INCLUDE (...), Keyset Seek (ts, id) < ($1, $2), Sort-Merge Join';
      } else if (n <= 100000000) {
        maxClass = 'Declarative Range Partitioning + BRIN / GIN';
        recommendedPatterns = 'Monthly Partition Pruning, BRIN Zone Maps, Parallel Hash Aggregate, SKIP LOCKED';
      } else {
        maxClass = 'Columnar OLAP / Sharded Distributed SQL';
        recommendedPatterns = 'Parquet/DuckDB Vectorized Scan, Dictionary/RLE Encoding, Consistent-Hash Sharding';
      }

      var heapTableMb = ((n * cap.elemBytes) / (1024 * 1024)).toFixed(2);
      var btreeIndexMb = ((n * (16 + cap.nodeOverheadBytes)) / (1024 * 1024)).toFixed(2);
      var bufferPoolRecommendedMb = ((n * (cap.elemBytes + 16 + cap.nodeOverheadBytes) * 0.25) / (1024 * 1024)).toFixed(2);
      var pagesScanned = Math.ceil((n * cap.elemBytes) / Math.max(4096, cap.cacheLineBytes));

      var latencyItems = [
        { op: 'Buffer Pool L1/DRAM Cache Hit', ns: 100, real: '100 ns', human: '1 min 40 sec', category: 'Buffer Pool', note: 'Shared buffers / OS page cache hit (8KB page already pinned)' },
        { op: 'Row Lock / Latch Acquisition', ns: 250, real: '250 ns', human: '4 min 10 sec', category: 'Concurrency', note: 'Uncontended LWLock / spinlock on buffer header' },
        { op: 'B+Tree In-Memory Height-3 Seek', ns: 500, real: '500 ns', human: '8 min 20 sec', category: 'Index', note: 'Root -> Internal -> Leaf binary search inside RAM' },
        { op: 'NVMe SSD Random 8KB Page Read', ns: 75000, real: '75 µs', human: '20.8 hours', category: 'Storage I/O', note: 'Single uncached random heap/index page fetch' },
        { op: 'WAL Commit fsync() (Local NVMe)', ns: 200000, real: '200 µs', human: '2.3 days', category: 'Durability', note: 'Why group commit & batching multiply write throughput' },
        { op: 'Same-AZ Synchronous Replica RTT', ns: 450000, real: '450 µs', human: '5.2 days', category: 'Replication', note: 'Network round-trip before synchronous commit ack' },
        { op: 'Sequential Scan 1 GB Table (NVMe)', ns: 300000000, real: '300 ms', human: '9.5 years', category: 'Table Scan', note: '131,072 pages of 8KB read sequentially (~3.3 GB/s)' },
        { op: 'Random Heap Fetch 100k Rows (Uncached)', ns: 7500000000, real: '7.5 sec', human: '238 years', category: 'Index Trap', note: 'Why optimizer switches from Index Scan to Bitmap/Seq Scan' },
        { op: 'Cross-Region Spanner/Cockroach Commit', ns: 65000000, real: '65 ms', human: '2.06 years', category: 'Distributed SQL', note: 'Speed-of-light Raft/Paxos quorum across continents' }
      ];

      var isHumanScale = this._latencyScaleMode === 'human';
      var latencyRowsHtml = latencyItems.map(function(item) {
        var logPct = Math.min(100, Math.max(6, Math.round((Math.log10(item.ns + 1) / Math.log10(7500000000)) * 100)));
        return (
          '<tr>' +
            '<td><strong>' + escapeHtml(item.op) + '</strong></td>' +
            '<td><span class="eco-pill">' + escapeHtml(item.category) + '</span></td>' +
            '<td class="latency-val-cell">' + escapeHtml(isHumanScale ? item.human : item.real) + '</td>' +
            '<td style="min-width:140px;">' +
              '<div class="latency-bar-track">' +
                '<div class="latency-bar-fill" style="width:' + logPct + '%;"></div>' +
              '</div>' +
            '</td>' +
            '<td class="latency-note-cell">' + escapeHtml(item.note) + '</td>' +
          '</tr>'
        );
      }).join('');

      var matrixRows = [
        { cat: 'indexing', name: 'B+Tree Composite & Covering Index', write: 'O(log_B N) page update + possible 8KB leaf split', read: 'O(log_B N) seek + sequential doubly-linked leaf scan', bestFor: 'Equality, range predicates, ORDER BY, and Index-Only covering queries', watchOut: 'Violating leftmost prefix or wrapping column in a function defeats seek', slug: 'composite-indexes-leftmost-prefix', buildId: 'build-btree-index-advisor' },
        { cat: 'indexing', name: 'GIN (Generalized Inverted Index) & Trigrams', write: 'High write amplification (splits document/JSON/trigrams into posting lists)', read: 'Sub-millisecond containment (@>), array overlap, and LIKE \'%term%\' search', bestFor: 'Full-text search, JSONB key/value lookups, and multi-valued array tags', watchOut: 'Large synchronous GIN updates can stall writes without fastupdate pending list', slug: 'hash-gin-gist-brin-bloom-indexes', buildId: 'build-production-sql-tuning-clinic' },
        { cat: 'indexing', name: 'BRIN (Block Range Index) / Zone Maps', write: 'Near-zero overhead (stores min/max summary per 128-page block range)', read: 'Skips non-matching 1MB+ physical block ranges during sequential scans', bestFor: 'Append-only time-series tables (created_at) where physical order matches logical order', watchOut: 'Useless on randomly ordered UUIDv4 or frequently updated columns with low correlation', slug: 'zone-maps-min-max-pruning-bloom', buildId: 'build-columnar-compression-query-engine' },
        { cat: 'joins', name: 'Indexed Nested Loop Join (INLJ)', write: 'Zero build phase memory (streams outer rows immediately)', read: 'O(N_outer * log_B(N_inner)) index probes into inner table', bestFor: 'Small outer row count (< 1,000 rows) joining into a large indexed inner table', watchOut: 'Catastrophic O(N * M) latency if optimizer underestimates outer cardinality by 100x', slug: 'nested-loop-join-indexed-nlj', buildId: 'build-physical-join-execution-engine' },
        { cat: 'joins', name: 'In-Memory & Grace Hash Join', write: 'O(N_build) hash table build in work_mem (spills to disk batches if exceeded)', read: 'O(N_build + N_probe) linear scan with O(1) hash bucket lookups', bestFor: 'Large unindexed or unsorted equi-joins scanning significant table fractions', watchOut: 'Hash table exceeding work_mem triggers multi-pass Grace Hash Join temp disk spills', slug: 'hash-join-build-probe-grace', buildId: 'build-physical-join-execution-engine' },
        { cat: 'joins', name: 'Sort-Merge Join', write: 'O(N log N + M log M) sort unless inputs arrive pre-sorted from B+Tree indexes', read: 'O(N + M) monotonic zipper scan over both sorted streams', bestFor: 'Pre-sorted index streams, huge datasets that do not fit in memory, and range joins', watchOut: 'Duplicate key runs require rewinding the inner stream buffer', slug: 'sort-merge-join-zipper-mechanics', buildId: 'build-physical-join-execution-engine' },
        { cat: 'isolation', name: 'MVCC Snapshot Isolation (Repeatable Read)', write: 'Appends new tuple version (xmin/xmax) or undo log without blocking readers', read: 'Consistent point-in-time snapshot; readers never block writers', bestFor: 'High-concurrency OLTP reads, consistent reporting queries, and analytical snapshots', watchOut: 'Permits Write Skew anomalies (disjoint updates violating a multi-row invariant)', slug: 'repeatable-read-snapshot-isolation', buildId: 'build-transaction-anomaly-simulator' },
        { cat: 'isolation', name: 'Serializable Snapshot Isolation (SSI)', write: 'Tracks SIREAD locks and rw-antidependency cycles without blocking', read: 'Full serializability equivalence with optimistic abort on dangerous structures', bestFor: 'Financial ledgers, inventory allocation, and double-booking prevention', watchOut: 'Requires application retry loop for SQLSTATE 40001 serialization failures', slug: 'serializable-2pl-vs-ssi', buildId: 'build-mvcc-snapshot-storage-engine' },
        { cat: 'storage', name: 'B+Tree Slotted Pages + WAL vs LSM-Tree', write: 'B+Tree: in-place 8KB random page update; LSM: sequential MemTable + SSTable flush', read: 'B+Tree: single page seek; LSM: MemTable + Bloom filter + leveled SSTable merge', bestFor: 'B+Tree for read/latency-sensitive OLTP; LSM (RocksDB) for write-intensive ingestion', watchOut: 'B+Tree suffers write amplification; LSM suffers compaction CPU/I/O stalls', slug: 'btree-vs-lsm-read-write-space-amplification', buildId: 'build-slotted-page-wal-engine' },
        { cat: 'olap', name: 'Columnar Parquet / DuckDB / ClickHouse', write: 'Batch row-group encoding (RLE, Dictionary, Delta, Bit-Packing)', read: 'Vectorized SIMD scan reading only projected columns + Zone Map skipping', bestFor: 'Billion-row aggregations, cohort funnels, and ad-hoc analytical star schemas', watchOut: 'Single-row point updates/deletes are expensive (require merge-on-read or copy-on-write)', slug: 'columnar-storage-layout-parquet', buildId: 'build-columnar-compression-query-engine' }
      ];

      var activeCat = this._matrixCategory || 'all';
      var filteredMatrix = matrixRows.filter(function(r) {
        return activeCat === 'all' || r.cat === activeCat;
      });

      var matrixHtml = filteredMatrix.map(function(r) {
        return (
          '<tr>' +
            '<td><strong>' + escapeHtml(r.name) + '</strong><br><span class="eco-pill" style="margin-top:4px;display:inline-block;">' + escapeHtml(r.cat.toUpperCase()) + '</span></td>' +
            '<td style="font-size:0.84rem;">' + escapeHtml(r.write) + '</td>' +
            '<td style="font-size:0.84rem;">' + escapeHtml(r.read) + '</td>' +
            '<td style="font-size:0.84rem;">' + escapeHtml(r.bestFor) + '</td>' +
            '<td style="font-size:0.84rem;color:var(--fg-muted);">' + escapeHtml(r.watchOut) + '</td>' +
            '<td style="white-space:nowrap;">' +
              '<button class="eco-btn eco-btn--sm" data-open-topic="' + escapeHtml(r.slug) + '">Topic →</button> ' +
              '<button class="eco-btn eco-btn--sm eco-btn--primary" data-open-build="' + escapeHtml(r.buildId) + '">CodeLab →</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');

      return (
        '<div class="dashboard-toolkit-wrap">' +
          '<section class="eco-card" style="margin-bottom:24px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">' +
              '<div>' +
                '<h2 class="eco-card__title">Interactive SQL Workload → Query Execution, Index &amp; Buffer Pool Sizing Calculator</h2>' +
                '<p class="eco-card__desc">Enter table cardinality N, target QPS, SLA latency budget, tuple width, and page size (8KB) to size B+Tree indexes, shared_buffers, and physical join/scan strategies.</p>' +
              '</div>' +
              '<button class="eco-btn eco-btn--primary" data-action="open-capacity-codelab">Simulate Cost Model in CodeLab</button>' +
            '</div>' +

            '<div class="eco-grid eco-grid--4" style="gap:12px;margin-bottom:20px;">' +
              '<label class="cap-input-group"><span class="kpi-label">Table Cardinality (N Rows)</span><input type="number" class="knob-select" data-cap-field="inputN" value="' + cap.inputN + '" min="1" step="10000"></label>' +
              '<label class="cap-input-group"><span class="kpi-label">Peak Queries / Sec (QPS)</span><input type="number" class="knob-select" data-cap-field="queriesQ" value="' + cap.queriesQ + '" min="1" step="500"></label>' +
              '<label class="cap-input-group"><span class="kpi-label">Query SLA Budget (sec)</span><input type="number" class="knob-select" data-cap-field="timeLimitSec" value="' + cap.timeLimitSec + '" min="0.05" max="10" step="0.05"></label>' +
              '<label class="cap-input-group"><span class="kpi-label">NVMe IOPS Budget / Node</span><input type="number" class="knob-select" data-cap-field="opsPerSec" value="' + cap.opsPerSec + '" min="1000" step="5000"></label>' +
              '<label class="cap-input-group"><span class="kpi-label">Avg Tuple Width (Bytes)</span><input type="number" class="knob-select" data-cap-field="elemBytes" value="' + cap.elemBytes + '" min="16" max="2048" step="16"></label>' +
              '<label class="cap-input-group"><span class="kpi-label">MVCC Tuple Header (Bytes)</span><input type="number" class="knob-select" data-cap-field="nodeOverheadBytes" value="' + cap.nodeOverheadBytes + '" min="0" max="64" step="4"></label>' +
              '<label class="cap-input-group"><span class="kpi-label">Page Size (Bytes)</span><input type="number" class="knob-select" data-cap-field="cacheLineBytes" value="' + cap.cacheLineBytes + '" min="4096" max="65536" step="4096"></label>' +
              '<label class="cap-input-group"><span class="kpi-label">shared_buffers RAM (MB)</span><input type="number" class="knob-select" data-cap-field="memoryLimitMb" value="' + cap.memoryLimitMb + '" min="128" max="65536" step="256"></label>' +
            '</div>' +

            '<div class="eco-grid eco-grid--4" id="dash-cap-results">' +
              '<div class="eco-card dash-kpi-card">' +
                '<span class="kpi-label">Recommended Access Path</span>' +
                '<strong class="kpi-val" id="cap-peak-qps">' + escapeHtml(maxClass) + '</strong>' +
                '<span class="kpi-sub">I/O Budget: ~' + budgetOps.toLocaleString() + ' page ops (' + cap.timeLimitSec + 's)</span>' +
              '</div>' +
              '<div class="eco-card dash-kpi-card">' +
                '<span class="kpi-label">B+Tree Depth &amp; Sort Cost</span>' +
                '<strong class="kpi-val" id="cap-concurrency">Height ' + btreeHeight + ' (' + (q * btreeHeight).toLocaleString() + ' page seeks/s)</strong>' +
                '<span class="kpi-sub">Fanout ~' + btreeFanout + ' · External Sort N log₂ N = ' + nLogN.toLocaleString() + '</span>' +
              '</div>' +
              '<div class="eco-card dash-kpi-card">' +
                '<span class="kpi-label">Heap Table vs B+Tree Footprint</span>' +
                '<strong class="kpi-val" id="cap-bandwidth">' + heapTableMb + ' MB Heap Table</strong>' +
                '<span class="kpi-sub">B+Tree Index: ' + btreeIndexMb + ' MB · 25% Hot Working Set: ' + bufferPoolRecommendedMb + ' MB</span>' +
              '</div>' +
              '<div class="eco-card dash-kpi-card">' +
                '<span class="kpi-label">Recommended SQL &amp; Indexing Patterns</span>' +
                '<strong class="kpi-val" id="cap-storage" style="font-size:0.92rem;">' + escapeHtml(recommendedPatterns) + '</strong>' +
                '<span class="kpi-sub">Full Seq Scan: ' + pagesScanned.toLocaleString() + ' pages (' + Math.round(cap.cacheLineBytes / 1024) + 'KB blocks)</span>' +
              '</div>' +
            '</div>' +
          '</section>' +

          '<section class="eco-card" style="margin-bottom:24px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;">' +
              '<div>' +
                '<h2 class="eco-card__title">Database Storage, Buffer Pool &amp; Replication Latency Hierarchy</h2>' +
                '<p class="eco-card__desc">Why buffer pool hit ratios, covering indexes, and sequential page scans outperform uncached random heap fetches (if 1 ns = 1 second, 100k random SSD fetches take 238 years).</p>' +
              '</div>' +
              '<div style="display:flex;gap:8px;">' +
                '<button class="eco-btn eco-btn--sm ' + (!isHumanScale ? 'eco-btn--primary' : '') + '" data-latency-scale="real">Actual Hardware (ns / ms)</button>' +
                '<button class="eco-btn eco-btn--sm ' + (isHumanScale ? 'eco-btn--primary' : '') + '" data-latency-scale="human">Humanized Scale (1 ns = 1 sec)</button>' +
              '</div>' +
            '</div>' +
            '<div class="eco-table-wrap">' +
              '<table class="eco-table">' +
                '<thead><tr>' +
                  '<th>Database Operation</th>' +
                  '<th>Engine Layer</th>' +
                  '<th>' + (isHumanScale ? 'Humanized (1ns=1s)' : 'Typical Latency') + '</th>' +
                  '<th>Log10 Scale</th>' +
                  '<th>Query Planner &amp; Storage Implication</th>' +
                '</tr></thead>' +
                '<tbody>' + latencyRowsHtml + '</tbody>' +
              '</table>' +
            '</div>' +
          '</section>' +

          '<section class="eco-card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;">' +
              '<div>' +
                '<h2 class="eco-card__title">Relational &amp; Analytical Database Engine Trade-Off Matrix</h2>' +
                '<p class="eco-card__desc">Side-by-side comparison of B+Tree/GIN/BRIN indexes, physical join operators, MVCC/SSI isolation levels, B+Tree vs LSM storage engines, and columnar OLAP formats.</p>' +
              '</div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                ['all', 'indexing', 'joins', 'isolation', 'storage', 'olap'].map(function(cat) {
                  return '<button class="eco-btn eco-btn--sm ' + (activeCat === cat ? 'eco-btn--primary' : '') + '" data-matrix-cat="' + cat + '">' +
                    (cat === 'all' ? 'All Subsystems' : cat.toUpperCase()) +
                  '</button>';
                }).join('') +
              '</div>' +
            '</div>' +
            '<div class="eco-table-wrap">' +
              '<table class="eco-table">' +
                '<thead><tr>' +
                  '<th>Database Mechanism / Operator</th>' +
                  '<th>Write / Build Cost</th>' +
                  '<th>Read / Probe Cost</th>' +
                  '<th>Production Sweet Spot</th>' +
                  '<th>Failure Mode / Watch Out</th>' +
                  '<th>Deep Dive &amp; Lab</th>' +
                '</tr></thead>' +
                '<tbody>' + matrixHtml + '</tbody>' +
              '</table>' +
            '</div>' +
          '</section>' +
        '</div>'
      );
    },

    _openCapacityCodeLab: function() {
      var cap = this._capState;
      var code = [
        '// SQL Workload -> Query Cost, B+Tree Index & Buffer Pool Sizing Simulator',
        '// Edit the workload parameters below and click Run to evaluate Seq Scan vs Index Scan costs!',
        '',
        'const config = ' + JSON.stringify(cap, null, 2) + ';',
        '',
        'const N = config.inputN;',
        'const QPS = config.queriesQ;',
        'const pageBytes = Math.max(4096, config.cacheLineBytes || 8192);',
        'const tupleBytes = config.elemBytes + config.nodeOverheadBytes;',
        'const heapPages = Math.ceil((N * tupleBytes) / pageBytes);',
        'const btreeHeight = Math.max(1, Math.ceil(Math.log(N) / Math.log(250)));',
        'const heapMb = (heapPages * pageBytes) / (1024 * 1024);',
        'const indexMb = (N * (16 + config.nodeOverheadBytes)) / (1024 * 1024);',
        'const seqScanCost = heapPages * 1.0 + N * 0.01;',
        'const indexPointSeekCost = btreeHeight * 4.0 + 1.0;',
        '',
        'console.log("=== SQL WORKLOAD, BUFFER POOL & COST ESTIMATOR REPORT ===");',
        'console.log(`Table Cardinality (N) : ${N.toLocaleString()} rows | Peak Workload: ${QPS.toLocaleString()} QPS`);',
        'console.log(`Physical Heap Pages   : ${heapPages.toLocaleString()} pages (${(pageBytes / 1024)}KB) -> ${heapMb.toFixed(2)} MB`);',
        'console.log(`B+Tree Index Footprint: ${indexMb.toFixed(2)} MB (Tree Height: ${btreeHeight} levels)`);',
        'console.log(`Seq Scan Planner Cost : ${seqScanCost.toFixed(1)} cost units`);',
        'console.log(`B+Tree Point Seek Cost: ${indexPointSeekCost.toFixed(1)} cost units (${(seqScanCost / indexPointSeekCost).toFixed(0)}x faster)`);',
        'console.log(`Buffer Pool Fit       : ${(heapMb + indexMb <= config.memoryLimitMb) ? "100% Resident in shared_buffers" : "Exceeds shared_buffers - Partitioning / Covering Index Recommended"}`);'
      ].join('\n');

      if (root.App && typeof root.App.openGlobalCodeLab === 'function') {
        root.App.openGlobalCodeLab({
          labId: 'sql-capacity-estimator',
          title: 'SQL Query Cost, B+Tree & Buffer Pool Sizing Simulator',
          summary: 'Interactive Relational Cost-Based Optimizer & Buffer Pool Sizing Model',
          mode: 'sandbox',
          entry: 'sql-cost-model.js',
          files: {
            'sql-cost-model.js': code,
            'README.md': '# SQL Query Cost, B+Tree & Buffer Pool Sizing Simulator\n\nClick **Run** to evaluate sequential scan vs B+Tree index seek planner costs, 8KB slotted page counts, and `shared_buffers` working-set residency.\n'
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
        var tabBtn = e.target.closest('[data-dash-tab]');
        if (tabBtn) {
          self._activeTab = tabBtn.getAttribute('data-dash-tab');
          if (root.Analytics && typeof root.Analytics.trackDashboardTab === 'function') {
            root.Analytics.trackDashboardTab(self._activeTab);
          }
          self.render();
          return;
        }

        var navBtn = e.target.closest('[data-dash-nav]');
        if (navBtn && root.App) {
          var dest = navBtn.getAttribute('data-dash-nav');
          if (dest === 'roadmap' && root.App.navigateToRoadmap) root.App.navigateToRoadmap();
          else if (dest === 'challenges' && root.App.navigateToChallenges) root.App.navigateToChallenges();
          else if (dest === 'sandbox' && root.App.navigateToSandbox) root.App.navigateToSandbox();
          return;
        }

        var flipBtn = e.target.closest('[data-srs-flip]') || e.target.closest('.srs-flashcard');
        if (flipBtn && !e.target.closest('[data-srs-rate]')) {
          if (!self._cardFlipped) {
            self._cardFlipped = true;
            self.render();
          }
          return;
        }

        var rateBtn = e.target.closest('[data-srs-rate]');
        if (rateBtn) {
          var q = parseInt(rateBtn.getAttribute('data-srs-rate'), 10) || 4;
          self.rateCurrentCard(q);
          return;
        }

        var resetFilterBtn = e.target.closest('[data-srs-reset-filter]');
        if (resetFilterBtn) {
          self._srsCategoryFilter = 'all';
          self._cardIndex = 0;
          self.render();
          return;
        }

        var saveNoteBtn = e.target.closest('[data-save-note]');
        if (saveNoteBtn && root.Progress) {
          var ta = container.querySelector('#dash-note-textarea');
          if (ta) {
            root.Progress.setNote(self._selectedNoteSlug, ta.value);
            var st = container.querySelector('#dash-note-status');
            if (st) st.textContent = '✓ Note saved!';
          }
          return;
        }

        var bmBtn = e.target.closest('[data-bookmark-slug]');
        if (bmBtn && root.Progress) {
          root.Progress.toggleBookmark(bmBtn.getAttribute('data-bookmark-slug'));
          self.render();
          return;
        }

        var rmBmBtn = e.target.closest('[data-remove-bookmark]');
        if (rmBmBtn && root.Progress) {
          root.Progress.toggleBookmark(rmBmBtn.getAttribute('data-remove-bookmark'));
          self.render();
          return;
        }

        var openTopicLink = e.target.closest('[data-open-topic]');
        if (openTopicLink && root.App && root.App.navigateTo) {
          e.preventDefault();
          root.App.navigateTo(openTopicLink.getAttribute('data-open-topic'));
          return;
        }

        var openBuildBtn = e.target.closest('[data-open-build]');
        if (openBuildBtn && root.App && root.App.navigateToBuild) {
          e.preventDefault();
          root.App.navigateToBuild(openBuildBtn.getAttribute('data-open-build') + '?mode=guided', e);
          return;
        }

        var capCodeLabBtn = e.target.closest('[data-action="open-capacity-codelab"]');
        if (capCodeLabBtn) {
          if (root.Analytics && typeof root.Analytics.trackToolkitUse === 'function') {
            root.Analytics.trackToolkitUse('open_capacity_codelab', JSON.stringify(self._capState));
          }
          self._openCapacityCodeLab();
          return;
        }

        var scaleBtn = e.target.closest('[data-latency-scale]');
        if (scaleBtn) {
          self._latencyScaleMode = scaleBtn.getAttribute('data-latency-scale') || 'real';
          if (root.Analytics && typeof root.Analytics.trackToolkitUse === 'function') {
            root.Analytics.trackToolkitUse('latency_scale', self._latencyScaleMode);
          }
          self.render();
          return;
        }

        var matrixCatBtn = e.target.closest('[data-matrix-cat]');
        if (matrixCatBtn) {
          self._matrixCategory = matrixCatBtn.getAttribute('data-matrix-cat') || 'all';
          if (root.Analytics && typeof root.Analytics.trackToolkitUse === 'function') {
            root.Analytics.trackToolkitUse('matrix_category', self._matrixCategory);
          }
          self.render();
          return;
        }

        var portBtn = e.target.closest('[data-portability-action]');
        if (portBtn && root.Progress) {
          var act = portBtn.getAttribute('data-portability-action');
          var jsonTa = container.querySelector('#dash-portability-json');
          if (act === 'export' && jsonTa) {
            jsonTa.value = root.Progress.exportData();
            self._importFeedback = { success: true, message: 'Exported latest progress snapshot.' };
            self.render();
          } else if (act === 'import' && jsonTa) {
            var res = root.Progress.importData(jsonTa.value);
            if (res && res.success) {
              self._importFeedback = { success: true, message: '✓ Progress data imported and restored!' };
            } else {
              self._importFeedback = { success: false, message: 'Import failed: ' + ((res && res.error) || 'Invalid JSON') };
            }
            self.render();
          }
        }
      }, sig);

      container.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'srs-category-select') {
          self._srsCategoryFilter = e.target.value;
          self._cardIndex = 0;
          self._cardFlipped = false;
          self.render();
          return;
        }

        if (e.target && e.target.id === 'dash-note-topic-select') {
          self._selectedNoteSlug = e.target.value;
          self.render();
          return;
        }

        var capField = e.target && e.target.getAttribute && e.target.getAttribute('data-cap-field');
        if (capField && self._capState) {
          var val = parseFloat(e.target.value);
          if (!isNaN(val) && val > 0) {
            self._capState[capField] = val;
            self.render();
          }
        }
      }, sig);
    }
  };

  if (root && typeof root === 'object') {
    root.DashboardController = DashboardController;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
