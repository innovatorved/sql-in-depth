/**
 * SQL & Database Architecture in Depth — Interactive Excalidraw-Style Architecture Whiteboard & SQL Capacity Studio
 * Handles /sandbox view:
 * - Multi-Board Tabs (+ New Board, Switch, Rename, Duplicate, Close, localStorage persistence)
 * - Excalidraw-Style Floating Tool Dock: Select (V), Pan (H), Connect (C), Zone Frame (F), Sticky Note (T), Freehand Sketch (P), Undo/Redo, Delete
 * - Exact SVG CTM Coordinate Conversion, 60fps Node/Frame/Note Dragging with Live Edge Updates, Palette HTML5 Drag-and-Drop
 * - 4-Sided Node Connection Ports with Rubber-Band Arrow Preview
 * - Element Inspector (Rename, Replica Scaling, Protocol Labels, Delete) + Live Capacity & Bottleneck Analyzer
 */
(function(root) {
  'use strict';

  var STORAGE_KEY = 'sql_sandbox_boards_v1';

  var BLUEPRINT_ALIASES = {
    'url-shortener': 'sargable-composite-index-selector',
    'payment-system': 'double-entry-ledger-isolation-selector',
    'uber-dispatch': 'join-execution-strategy-selector',
    'kafka-event-pipeline': 'cdc-outbox-streaming-selector'
  };

  var NODE_TYPE_TO_CODELAB = {
    'pgbouncer-conn-pool': 'build-sharded-query-router',
    'sql-parser-rewriter': 'build-sql-query-interpreter',
    'buffer-pool-clock-sweep': 'build-slotted-page-wal-engine',
    'materialized-view-cache': 'build-executive-kpi-aggregation-suite',
    'cbo-join-planner': 'build-visual-explain-plan-analyzer',
    'window-hash-agg-engine': 'build-sessionization-retention-engine',
    'vectorized-simd-olap': 'build-columnar-compression-query-engine',
    'mvcc-ssi-lock-manager': 'build-mvcc-snapshot-storage-engine',
    'bplustree-covering-index': 'build-btree-index-advisor',
    'gin-gist-brin-index': 'build-production-sql-tuning-clinic',
    'wal-aries-storage': 'build-slotted-page-wal-engine',
    'outbox-cdc-streamer': 'build-scd-type2-warehouse-pipeline',
    gateway: 'build-sharded-query-router',
    APIGateway: 'build-sharded-query-router',
    lb: 'build-sharded-query-router',
    L4LB: 'build-sharded-query-router',
    L7LB: 'build-sharded-query-router',
    cache: 'build-executive-kpi-aggregation-suite',
    RedisCache: 'build-executive-kpi-aggregation-suite',
    cdn: 'build-sql-query-interpreter',
    CDN: 'build-sql-query-interpreter',
    db: 'build-btree-index-advisor',
    SQLShard: 'build-sharded-query-router',
    NoSQLKV: 'build-production-sql-tuning-clinic',
    search: 'build-production-sql-tuning-clinic',
    queue: 'build-production-sql-tuning-clinic',
    KafkaQueue: 'build-scd-type2-warehouse-pipeline',
    worker: 'build-mvcc-snapshot-storage-engine',
    WorkerPool: 'build-mvcc-snapshot-storage-engine',
    storage: 'build-slotted-page-wal-engine',
    ObjectStorage: 'build-columnar-compression-query-engine',
    service: 'build-physical-join-execution-engine',
    Microservice: 'build-physical-join-execution-engine'
  };

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  var SandboxController = {
    _container: null,
    _abortController: null,

    // Multi-board tab state
    _boards: [],
    _activeBoardId: null,
    _lastQueryBlueprint: null,
    _simMetrics: null,

    // Top-level SQL Workbench Mode ('sql-studio' default | 'sql-challenges' | 'architecture-canvas')
    _activeWorkbenchMode: 'sql-studio',
    _sqlStudioDatasetId: '__empty__',
    _sqlStudioEngine: 'sqlite',
    _activeChallengeId: 'chal-01-not-in-null-outage',
    _challengeDrafts: {},
    _solvedChallengesKey: 'sql_in_depth_solved_challenges_v1',
    _studioFilesKey: 'sql_studio_files_v1',
    _studioActiveFileKey: 'sql_studio_active_file_v1',
    _studioCustomDbsKey: 'sql_studio_custom_dbs_v1',
    _studioActiveDbKey: 'sql_studio_active_db_v1',
    _studioFiles: [],
    _activeFileId: null,
    _customDatabases: [],
    _replayedCustomDbs: {},
    _liveSchemaTables: null,
    _newFileBarOpen: false,
    _newFileSelectedExt: 'sql',
    _newDbBarOpen: false,
    _renameFileBarOpen: false,
    _sqlStudioQuery: '',
    _sqlStudioVizHandle: null,

    // Active canvas state (synced with active board)
    _activeBlueprintId: 'sargable-composite-index-selector',
    _nodes: [],
    _connections: [],
    _frames: [],
    _notes: [],
    _sketches: [],
    _inputs: {
      qps: 50000,
      readWriteRatio: 100,
      avgReadPayloadBytes: 256,
      avgWritePayloadBytes: 512,
      cacheHitRate: 0.90,
      storageRetentionDays: 1825,
      replicationFactor: 3
    },

    // Excalidraw tool & viewport state
    _activeTool: 'select', // select | pan | connect | frame | note | draw
    _connectMode: false,
    _connectSourceId: null,
    _selectedNodeId: null,
    _selectedItem: null, // { kind: 'node'|'edge'|'frame'|'note'|'sketch', id: string|number }
    _zoom: 1,
    _panX: 0,
    _panY: 0,

    // Interaction / pointer drag state
    _interaction: null,
    _hasDragged: false,

    _getQueryBlueprintId: function() {
      try {
        if (root.location && root.location.search) {
          var params = new URLSearchParams(root.location.search);
          var bp = params.get('blueprint') || params.get('bp');
          if (bp) return BLUEPRINT_ALIASES[bp] || bp;
        }
      } catch (e) {}
      return null;
    },

    mount: function(container, options) {
      if (this._abortController) {
        this._abortController.abort();
        this._abortController = null;
      }
      this._container = container;
      if (!container) return;
      options = options || {};
      var queryBp = this._getQueryBlueprintId();
      var requestedBp = options.blueprintId || queryBp || null;
      if (requestedBp && BLUEPRINT_ALIASES[requestedBp]) {
        requestedBp = BLUEPRINT_ALIASES[requestedBp];
      }
      if (queryBp) {
        this._lastQueryBlueprint = queryBp;
      }

      if (root.SQLEngine && typeof root.SQLEngine.getEngineMode === 'function') {
        this._sqlStudioEngine = root.SQLEngine.getEngineMode() || 'sqlite';
      }

      this._initStudioWorkspace();

      try {
        if (root.location && root.location.search) {
          var urlParams = new URLSearchParams(root.location.search);
          var modeParam = urlParams.get('mode') || urlParams.get('tab');
          if (modeParam === 'challenges' || modeParam === 'sql-challenges') {
            this._activeWorkbenchMode = 'sql-challenges';
          } else if (modeParam === 'architecture' || modeParam === 'architecture-canvas' || queryBp) {
            this._activeWorkbenchMode = 'architecture-canvas';
          }
          var chalParam = urlParams.get('challenge');
          if (chalParam) {
            this._activeChallengeId = chalParam;
            this._activeWorkbenchMode = 'sql-challenges';
          }
          if (root.TableVisualizer && typeof root.TableVisualizer.decodeShareableQuery === 'function') {
            var shared = root.TableVisualizer.decodeShareableQuery(root.location.search);
            if (shared && shared.sql) {
              this._activeWorkbenchMode = 'sql-studio';
              this._sqlStudioQuery = shared.sql;
              this._sqlStudioDatasetId = shared.datasetId || '__unified__';
              var existingShared = this._studioFiles.find(function(f) { return f.name === 'shared-query.sql'; });
              if (existingShared) {
                existingShared.content = shared.sql;
                this._activeFileId = existingShared.id;
              } else if (this._studioFiles.length === 1 && !this._studioFiles[0].content.trim()) {
                this._studioFiles[0].name = 'shared-query.sql';
                this._studioFiles[0].ext = 'sql';
                this._studioFiles[0].content = shared.sql;
                this._activeFileId = this._studioFiles[0].id;
              } else {
                var shId = 'file_' + Date.now();
                this._studioFiles.push({ id: shId, name: 'shared-query.sql', ext: 'sql', content: shared.sql });
                this._activeFileId = shId;
              }
              if (shared.engine === 'postgres' || shared.engine === 'sqlite') {
                this._sqlStudioEngine = shared.engine;
                if (root.SQLEngine && typeof root.SQLEngine.setEngineMode === 'function') {
                  root.SQLEngine.setEngineMode(shared.engine);
                }
              }
            }
          }
        }
      } catch (e) {}

      this._initBoards(requestedBp || 'sargable-composite-index-selector', Boolean(requestedBp));
      this.render();
      this._bindEvents();
    },

    _ensureInitialized: function() {
      var queryBp = this._getQueryBlueprintId();
      if (!this._boards || this._boards.length === 0) {
        this._initBoards(queryBp || 'sargable-composite-index-selector', Boolean(queryBp));
      } else if (queryBp && queryBp !== this._lastQueryBlueprint) {
        this._lastQueryBlueprint = queryBp;
        this._loadBlueprint(queryBp, false);
      }
    },

    _loadBlueprint: function(bpId, shouldRender) {
      return this.loadBlueprint(bpId, shouldRender);
    },

    unmount: function() {
      if (this._abortController) {
        this._abortController.abort();
        this._abortController = null;
      }
      if (this._container) {
        this._container.innerHTML = '';
        this._container = null;
      }
      this._interaction = null;
    },

    _getData: function() {
      var raw = root.WHITEBOARD_DATA || {
        buildingBlocks: [],
        blueprints: [],
        calculateCapacity: function() { return { bottlenecks: [] }; }
      };
      var catColors = {
        edge: '#C2410C',
        cache: '#D97706',
        storage: '#16A34A',
        compute: '#EA580C',
        index: '#C2410C',
        olap: '#0D9488',
        replication: '#7C3AED'
      };
      if (Array.isArray(raw.buildingBlocks)) {
        raw.buildingBlocks.forEach(function(b) {
          if (!b) return;
          if (!b.type) b.type = b.id || 'engine-block';
          if (!b.label) b.label = b.name || b.type;
          if (!b.color) b.color = catColors[b.category] || '#C2410C';
          if (!b.badge) {
            var qps = b.maxQpsPerInstance ? (b.maxQpsPerInstance >= 1000 ? Math.round(b.maxQpsPerInstance / 1000) + 'k QPS' : b.maxQpsPerInstance + ' QPS') : '';
            b.badge = [b.category ? String(b.category).toUpperCase() : '', qps].filter(Boolean).join(' · ');
          }
        });
      }
      return raw;
    },

    _findBlueprint: function(bpId) {
      if (bpId && BLUEPRINT_ALIASES[bpId]) bpId = BLUEPRINT_ALIASES[bpId];
      var data = this._getData();
      var bps = data.blueprints || [];
      for (var i = 0; i < bps.length; i++) {
        if (bps[i].id === bpId) return bps[i];
      }
      return bps[0] || null;
    },

    _createBoardFromBlueprint: function(bpId, customTitle) {
      var found = this._findBlueprint(bpId);
      var id = 'board-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      if (!found) {
        return {
          id: id,
          title: customTitle || 'Untitled Architecture',
          blueprintId: 'custom',
          nodes: [],
          connections: [],
          frames: [],
          notes: [],
          sketches: [],
          inputs: {
            qps: 25000,
            readWriteRatio: 20,
            avgReadPayloadBytes: 512,
            avgWritePayloadBytes: 1024,
            cacheHitRate: 0.85,
            storageRetentionDays: 365,
            replicationFactor: 3
          },
          history: [],
          future: []
        };
      }

      var shortTitle = found.title.split(' (')[0];
      var def = found.defaultInputs || {};
      return {
        id: id,
        title: customTitle || shortTitle,
        blueprintId: found.id,
        nodes: (found.nodes || []).map(function(n) {
          var rep = n.replicas || n.instances || 2;
          var nType = n.type || n.blockId || 'bplustree-covering-index';
          return {
            id: n.id,
            type: nType,
            blockId: n.blockId || nType,
            name: n.name || n.label || nType,
            x: n.x,
            y: n.y,
            replicas: rep,
            instances: rep
          };
        }),
        connections: (found.connections || []).map(function(c, i) {
          return {
            id: c.id || ('edge-' + i + '-' + c.from + '-' + c.to),
            from: c.from,
            to: c.to,
            label: c.label || '',
            dashed: Boolean(c.dashed)
          };
        }),
        frames: (found.frames || []).map(function(f) {
          return {
            id: f.id,
            label: f.label,
            x: f.x,
            y: f.y,
            width: f.width || 320,
            height: f.height || 220
          };
        }),
        notes: (found.notes || []).map(function(nt) {
          return {
            id: nt.id,
            text: nt.text,
            x: nt.x,
            y: nt.y
          };
        }),
        sketches: [],
        inputs: {
          qps: def.qps != null ? def.qps : 50000,
          readWriteRatio: def.readWriteRatio != null ? def.readWriteRatio : 100,
          avgReadPayloadBytes: def.avgReadPayloadBytes != null ? def.avgReadPayloadBytes : 256,
          avgWritePayloadBytes: def.avgWritePayloadBytes != null ? def.avgWritePayloadBytes : 512,
          cacheHitRate: def.cacheHitRate != null ? def.cacheHitRate : 0.90,
          storageRetentionDays: def.storageRetentionDays != null ? def.storageRetentionDays : 365,
          replicationFactor: def.replicationFactor != null ? def.replicationFactor : 3
        },
        history: [],
        future: []
      };
    },

    _initBoards: function(defaultBpId, forceBlueprintLoad) {
      var loaded = null;
      try {
        var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
        if (raw) loaded = JSON.parse(raw);
      } catch (e) {}

      if (loaded && Array.isArray(loaded.boards) && loaded.boards.length > 0) {
        this._boards = loaded.boards;
        this._activeBoardId = loaded.activeBoardId || this._boards[0].id;
        if (forceBlueprintLoad && defaultBpId) {
          var existing = this._boards.find(function(b) { return b.blueprintId === defaultBpId; });
          if (existing) {
            this._activeBoardId = existing.id;
          } else {
            this._syncFromActiveBoard();
            this.loadBlueprint(defaultBpId, false);
            return;
          }
        }
        this._syncFromActiveBoard();
      } else {
        var firstBoard = this._createBoardFromBlueprint(defaultBpId || 'sargable-composite-index-selector');
        this._boards = [firstBoard];
        this._activeBoardId = firstBoard.id;
        this._syncFromActiveBoard();
        this._saveBoards();
      }
    },

    _getActiveBoard: function() {
      var self = this;
      var b = this._boards.find(function(item) { return item.id === self._activeBoardId; });
      if (!b && this._boards.length > 0) {
        b = this._boards[0];
        this._activeBoardId = b.id;
      }
      return b || null;
    },

    _syncFromActiveBoard: function() {
      var b = this._getActiveBoard();
      if (!b) return;
      this._activeBlueprintId = b.blueprintId || 'sargable-composite-index-selector';
      this._nodes = b.nodes || [];
      this._connections = b.connections || [];
      this._frames = b.frames || [];
      this._notes = b.notes || [];
      this._sketches = b.sketches || [];
      this._inputs = b.inputs || this._inputs;
      this._selectedNodeId = null;
      this._selectedItem = null;
      this._connectSourceId = null;
    },

    _syncToActiveBoard: function() {
      var b = this._getActiveBoard();
      if (!b) return;
      b.blueprintId = this._activeBlueprintId;
      b.nodes = this._nodes;
      b.connections = this._connections;
      b.frames = this._frames;
      b.notes = this._notes;
      b.sketches = this._sketches;
      b.inputs = this._inputs;
      this._saveBoards();
    },

    _saveBoards: function() {
      try {
        if (!root.localStorage) return;
        var payload = {
          activeBoardId: this._activeBoardId,
          boards: this._boards.map(function(b) {
            return {
              id: b.id,
              title: b.title,
              blueprintId: b.blueprintId,
              nodes: b.nodes,
              connections: b.connections,
              frames: b.frames,
              notes: b.notes,
              sketches: b.sketches,
              inputs: b.inputs
            };
          })
        };
        root.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {}
    },

    _pushHistory: function() {
      var b = this._getActiveBoard();
      if (!b) return;
      b.history = b.history || [];
      b.future = [];
      b.history.push(deepClone({
        nodes: this._nodes,
        connections: this._connections,
        frames: this._frames,
        notes: this._notes,
        sketches: this._sketches
      }));
      if (b.history.length > 40) b.history.shift();
    },

    undo: function() {
      var b = this._getActiveBoard();
      if (!b || !b.history || b.history.length === 0) return;
      b.future = b.future || [];
      b.future.push(deepClone({
        nodes: this._nodes,
        connections: this._connections,
        frames: this._frames,
        notes: this._notes,
        sketches: this._sketches
      }));
      var prev = b.history.pop();
      this._nodes = prev.nodes || [];
      this._connections = prev.connections || [];
      this._frames = prev.frames || [];
      this._notes = prev.notes || [];
      this._sketches = prev.sketches || [];
      this._selectedItem = null;
      this._selectedNodeId = null;
      this._syncToActiveBoard();
      this.render();
    },

    redo: function() {
      var b = this._getActiveBoard();
      if (!b || !b.future || b.future.length === 0) return;
      b.history = b.history || [];
      b.history.push(deepClone({
        nodes: this._nodes,
        connections: this._connections,
        frames: this._frames,
        notes: this._notes,
        sketches: this._sketches
      }));
      var next = b.future.pop();
      this._nodes = next.nodes || [];
      this._connections = next.connections || [];
      this._frames = next.frames || [];
      this._notes = next.notes || [];
      this._sketches = next.sketches || [];
      this._selectedItem = null;
      this._selectedNodeId = null;
      this._syncToActiveBoard();
      this.render();
    },

    // ── Multi-Board Tab Operations ─────────────────────────────
    createNewBoardTab: function(bpId, customTitle) {
      this._syncToActiveBoard();
      var boardNum = this._boards.length + 1;
      var newBoard;
      if (bpId && bpId !== 'blank') {
        newBoard = this._createBoardFromBlueprint(bpId, customTitle);
      } else {
        newBoard = {
          id: 'board-' + Date.now() + '-' + boardNum,
          title: customTitle || ('Architecture Board ' + boardNum),
          blueprintId: 'custom',
          nodes: [
            { id: 'n-client-' + boardNum, type: 'Client', name: 'Client App', x: 80, y: 180, replicas: 1 },
            { id: 'n-gw-' + boardNum, type: 'APIGateway', name: 'API Gateway', x: 310, y: 180, replicas: 2 },
            { id: 'n-svc-' + boardNum, type: 'Microservice', name: 'Core Service', x: 540, y: 180, replicas: 4 }
          ],
          connections: [
            { id: 'e-1', from: 'n-client-' + boardNum, to: 'n-gw-' + boardNum, label: 'HTTPS' },
            { id: 'e-2', from: 'n-gw-' + boardNum, to: 'n-svc-' + boardNum, label: 'gRPC' }
          ],
          frames: [
            { id: 'f-1', label: 'Core Service Boundary (VPC)', x: 285, y: 120, width: 435, height: 180 }
          ],
          notes: [],
          sketches: [],
          inputs: {
            qps: 25000,
            readWriteRatio: 20,
            avgReadPayloadBytes: 512,
            avgWritePayloadBytes: 1024,
            cacheHitRate: 0.85,
            storageRetentionDays: 365,
            replicationFactor: 3
          },
          history: [],
          future: []
        };
      }
      this._boards.push(newBoard);
      this._activeBoardId = newBoard.id;
      this._syncFromActiveBoard();
      this._saveBoards();
      this.render();
      return newBoard;
    },

    switchBoardTab: function(boardId) {
      if (boardId === this._activeBoardId) return;
      this._syncToActiveBoard();
      var found = this._boards.find(function(b) { return b.id === boardId; });
      if (!found) return;
      this._activeBoardId = found.id;
      this._syncFromActiveBoard();
      this._saveBoards();
      this.render();
    },

    closeBoardTab: function(boardId) {
      if (this._boards.length <= 1) {
        // Reset the single board to a clean state
        var fresh = this._createBoardFromBlueprint('sargable-composite-index-selector');
        this._boards = [fresh];
        this._activeBoardId = fresh.id;
        this._syncFromActiveBoard();
        this._saveBoards();
        this.render();
        return;
      }
      var idx = this._boards.findIndex(function(b) { return b.id === boardId; });
      if (idx === -1) return;
      this._boards.splice(idx, 1);
      if (this._activeBoardId === boardId) {
        var nextIdx = Math.max(0, idx - 1);
        this._activeBoardId = this._boards[nextIdx].id;
        this._syncFromActiveBoard();
      }
      this._saveBoards();
      this.render();
    },

    duplicateActiveBoardTab: function() {
      var cur = this._getActiveBoard();
      if (!cur) return;
      this._syncToActiveBoard();
      var copy = deepClone(cur);
      copy.id = 'board-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      copy.title = cur.title + ' (Copy)';
      copy.history = [];
      copy.future = [];
      this._boards.push(copy);
      this._activeBoardId = copy.id;
      this._syncFromActiveBoard();
      this._saveBoards();
      this.render();
    },

    loadBlueprint: function(bpId, shouldRender) {
      if (bpId && BLUEPRINT_ALIASES[bpId]) bpId = BLUEPRINT_ALIASES[bpId];
      var found = this._findBlueprint(bpId);
      if (!found) return;

      this._pushHistory();
      var fresh = this._createBoardFromBlueprint(found.id);
      this._activeBlueprintId = fresh.blueprintId;
      this._nodes = fresh.nodes;
      this._connections = fresh.connections;
      this._frames = fresh.frames;
      this._notes = fresh.notes;
      this._sketches = [];
      this._inputs = fresh.inputs;

      var activeBoard = this._getActiveBoard();
      if (activeBoard) {
        activeBoard.title = fresh.title;
      }
      this._selectedNodeId = null;
      this._selectedItem = null;
      this._connectSourceId = null;
      this._syncToActiveBoard();
      if (root.Progress && root.Progress.markComplete) {
        root.Progress.markComplete('sandbox:' + found.id);
      }
      if (shouldRender !== false) this.render();
    },

    // ── Canvas Element Creation & Deletion ─────────────────────
    addBlock: function(blockType, dropX, dropY) {
      this._pushHistory();
      var data = this._getData();
      var blockMeta = (data.buildingBlocks || []).find(function(b) { return b.type === blockType; });
      var name = blockMeta ? blockMeta.name : blockType;
      var count = this._nodes.length;
      var x = typeof dropX === 'number' ? Math.round(dropX - 75) : (120 + ((count * 95) % 760));
      var y = typeof dropY === 'number' ? Math.round(dropY - 29) : (90 + ((count * 75) % 280));
      var newNode = {
        id: 'node-' + Date.now() + '-' + count,
        type: blockType,
        name: name,
        x: Math.max(16, Math.min(1080, x)),
        y: Math.max(16, Math.min(410, y)),
        replicas: 2
      };
      this._nodes.push(newNode);
      this._selectedNodeId = newNode.id;
      this._selectedItem = { kind: 'node', id: newNode.id };
      this._syncToActiveBoard();
      this.render();
      return newNode;
    },

    addFrame: function(x, y, width, height) {
      this._pushHistory();
      var idx = this._frames.length + 1;
      var newFrame = {
        id: 'frame-' + Date.now() + '-' + idx,
        label: 'Zone / VPC Boundary ' + idx,
        x: Math.max(10, Math.round(x != null ? x : 180)),
        y: Math.max(10, Math.round(y != null ? y : 80)),
        width: Math.max(140, Math.round(width || 340)),
        height: Math.max(100, Math.round(height || 220))
      };
      this._frames.push(newFrame);
      this._selectedItem = { kind: 'frame', id: newFrame.id };
      this._selectedNodeId = null;
      this._activeTool = 'select';
      this._syncToActiveBoard();
      this.render();
      return newFrame;
    },

    addStickyNote: function(x, y, text) {
      this._pushHistory();
      var idx = this._notes.length + 1;
      var newNote = {
        id: 'note-' + Date.now() + '-' + idx,
        text: text || ('Design Note #' + idx + '\n• SLA / Trade-off invariant'),
        x: Math.max(16, Math.round(x != null ? x : 240)),
        y: Math.max(16, Math.round(y != null ? y : 140))
      };
      this._notes.push(newNote);
      this._selectedItem = { kind: 'note', id: newNote.id };
      this._selectedNodeId = null;
      this._activeTool = 'select';
      this._syncToActiveBoard();
      this.render();
      return newNote;
    },

    deleteSelected: function() {
      var item = this._selectedItem;
      if (!item && this._selectedNodeId) {
        item = { kind: 'node', id: this._selectedNodeId };
      }
      if (!item) return false;

      this._pushHistory();
      if (item.kind === 'node') {
        var targetId = item.id;
        this._nodes = this._nodes.filter(function(n) { return n.id !== targetId; });
        this._connections = this._connections.filter(function(c) {
          return c.from !== targetId && c.to !== targetId;
        });
      } else if (item.kind === 'edge') {
        var edgeIdx = Number(item.id);
        if (!isNaN(edgeIdx) && edgeIdx >= 0 && edgeIdx < this._connections.length) {
          this._connections.splice(edgeIdx, 1);
        }
      } else if (item.kind === 'frame') {
        this._frames = this._frames.filter(function(f) { return f.id !== item.id; });
      } else if (item.kind === 'note') {
        this._notes = this._notes.filter(function(nt) { return nt.id !== item.id; });
      } else if (item.kind === 'sketch') {
        this._sketches = this._sketches.filter(function(sk) { return sk.id !== item.id; });
      }

      this._selectedItem = null;
      this._selectedNodeId = null;
      this._syncToActiveBoard();
      this.render();
      return true;
    },

    autoLayout: function() {
      if (this._nodes.length === 0) return;
      this._pushHistory();
      var typeRank = {
        'pgbouncer-conn-pool': 0,
        'sql-parser-rewriter': 1,
        'cbo-join-planner': 2,
        'buffer-pool-clock-sweep': 2,
        'materialized-view-cache': 2,
        'bplustree-covering-index': 3,
        'gin-gist-brin-index': 3,
        'window-hash-agg-engine': 3,
        'vectorized-simd-olap': 3,
        'mvcc-ssi-lock-manager': 4,
        'wal-aries-storage': 4,
        'outbox-cdc-streamer': 5,
        Client: 0,
        CDN: 1,
        L4LB: 1,
        L7LB: 2,
        APIGateway: 2,
        Microservice: 3,
        RedisCache: 4,
        SQLShard: 4,
        NoSQLKV: 4,
        KafkaQueue: 4,
        WorkerPool: 5,
        ObjectStorage: 5
      };
      var columns = {};
      this._nodes.forEach(function(n) {
        var col = typeRank[n.type] != null ? typeRank[n.type] : 3;
        if (!columns[col]) columns[col] = [];
        columns[col].push(n);
      });
      var sortedCols = Object.keys(columns).map(Number).sort(function(a, b) { return a - b; });
      sortedCols.forEach(function(colKey, colIdx) {
        var colNodes = columns[colKey];
        var x = 60 + colIdx * 205;
        colNodes.forEach(function(n, rowIdx) {
          n.x = Math.min(1060, x);
          n.y = 75 + rowIdx * 115;
        });
      });
      this._syncToActiveBoard();
      this.render();
    },

    exportSvgOrJson: function(format) {
      if (format === 'json') {
        var b = this._getActiveBoard();
        var dataStr = JSON.stringify(b || { nodes: this._nodes, connections: this._connections }, null, 2);
        this._triggerDownload(dataStr, (b ? b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'architecture') + '.json', 'application/json');
      } else if (format === 'svg' && this._container) {
        var svgEl = this._container.querySelector('#wb-svg-canvas');
        if (svgEl) {
          var svgMarkup = new XMLSerializer().serializeToString(svgEl);
          this._triggerDownload(svgMarkup, 'architecture-whiteboard.svg', 'image/svg+xml');
        }
      }
    },

    simulateActiveBoardInCodeLab: function() {
      var board = this._getActiveBoard();
      var title = (board && board.title) ? board.title : 'Architecture Topology';
      var nodes = this._nodes || [];
      var connections = this._connections || [];
      var nodeListComment = nodes.map(function(n) {
        return '--   Node: ' + (n.name || n.type) + ' [' + n.type + '] (' + (n.replicas || n.instances || 1) + 'x)';
      }).join('\n');

      this._sqlStudioQuery = [
        '-- Diagnostic SQL Query for Topology: ' + title + ' (' + nodes.length + ' nodes, ' + connections.length + ' edges)',
        nodeListComment || '--   (Default relational cluster topology)',
        'SELECT c.customer_id,',
        '       c.name,',
        '       c.tier,',
        '       COUNT(o.order_id) AS order_count,',
        '       ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS total_spend_usd,',
        '       RANK() OVER (PARTITION BY c.tier ORDER BY COALESCE(SUM(o.total_cents), 0) DESC) AS tier_rank',
        'FROM customers c',
        'LEFT JOIN orders o ON o.customer_id = c.customer_id',
        'GROUP BY c.customer_id, c.name, c.tier',
        'ORDER BY total_spend_usd DESC',
        'LIMIT 15;'
      ].join('\n');
      this._activeWorkbenchMode = 'sql-studio';
      this.render();
    },

    _getSqlStudioTemplates: function() {
      return [
        {
          id: 'join-agg',
          label: '1. Multi-Table Join & Aggregation (customers + orders)',
          datasetId: 'ecommerce',
          sql: [
            '-- Multi-Table LEFT JOIN & Revenue Aggregation across Customer Tiers',
            'SELECT c.tier,',
            '       c.country,',
            '       COUNT(DISTINCT c.customer_id) AS customers,',
            '       COUNT(o.order_id) AS total_orders,',
            '       ROUND(COALESCE(SUM(o.total_cents), 0) / 100.0, 2) AS gross_revenue_usd',
            'FROM customers c',
            'LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = \'completed\'',
            'GROUP BY c.tier, c.country',
            'ORDER BY gross_revenue_usd DESC;'
          ].join('\n')
        },
        {
          id: 'window-fn',
          label: '2. Window Functions: RANK, LAG & Moving Average (employees + departments)',
          datasetId: 'org_hr',
          sql: [
            '-- Window Functions: Department Salary Ranking & Compensation Progression',
            'SELECT e.emp_id,',
            '       e.name AS employee_name,',
            '       d.name AS dept_name,',
            '       e.title,',
            '       e.salary_usd,',
            '       RANK() OVER (PARTITION BY e.dept_id ORDER BY e.salary_usd DESC) AS dept_salary_rank,',
            '       ROUND(e.salary_usd - AVG(e.salary_usd) OVER (PARTITION BY e.dept_id), 0) AS diff_from_dept_avg',
            'FROM employees e',
            'JOIN departments d ON d.dept_id = e.dept_id',
            'ORDER BY d.name ASC, dept_salary_rank ASC;'
          ].join('\n')
        },
        {
          id: 'recursive-cte',
          label: '3. Recursive CTE: Organizational Reporting Hierarchy (employees)',
          datasetId: 'org_hr',
          sql: [
            '-- Recursive CTE: Traverse Management Reporting Tree from Chief Architect Downward',
            'WITH RECURSIVE org_tree AS (',
            '  SELECT emp_id, name, title, manager_id, 0 AS depth, name AS path',
            '  FROM employees',
            '  WHERE manager_id IS NULL',
            '  UNION ALL',
            '  SELECT e.emp_id, e.name, e.title, e.manager_id, t.depth + 1, t.path || \' -> \' || e.name',
            '  FROM employees e',
            '  JOIN org_tree t ON e.manager_id = t.emp_id',
            ')',
            'SELECT emp_id, depth, name, title, path',
            'FROM org_tree',
            'ORDER BY depth ASC, emp_id ASC;'
          ].join('\n')
        },
        {
          id: 'ledger-audit',
          label: '4. Double-Entry Ledger Balance Verification (accounts + journal_entries)',
          datasetId: 'fintech_ledger',
          sql: [
            '-- Double-Entry Ledger Invariant Check: Reconcile Posted Debits & Credits per Account',
            'SELECT a.account_id,',
            '       a.owner_name,',
            '       a.account_type,',
            '       ROUND(a.posted_balance_cents / 100.0, 2) AS book_balance_usd,',
            '       COUNT(j.entry_id) AS journal_postings,',
            '       ROUND(COALESCE(SUM(CASE WHEN j.direction = \'credit\' THEN j.amount_cents ELSE -j.amount_cents END), 0) / 100.0, 2) AS net_journal_delta_usd',
            'FROM accounts a',
            'LEFT JOIN journal_entries j ON j.account_id = a.account_id',
            'GROUP BY a.account_id, a.owner_name, a.account_type, a.posted_balance_cents',
            'ORDER BY a.account_id ASC;'
          ].join('\n')
        },
        {
          id: 'saas-cohort',
          label: '5. SaaS Funnel & Telemetry Engagement Cohort (saas_users + user_events)',
          datasetId: 'saas_telemetry',
          sql: [
            '-- SaaS Telemetry Cohort: Event Volume, Average Latency & Plan MRR Breakdown',
            'SELECT u.user_id,',
            '       u.org_name,',
            '       u.plan_tier,',
            '       COALESCE(s.mrr_usd, 0) AS mrr_usd,',
            '       COUNT(e.event_id) AS total_events,',
            '       ROUND(AVG(e.latency_ms), 1) AS avg_latency_ms,',
            '       MAX(e.latency_ms) AS max_latency_ms',
            'FROM saas_users u',
            'LEFT JOIN subscriptions s ON s.user_id = u.user_id AND s.status = \'active\'',
            'LEFT JOIN user_events e ON e.user_id = u.user_id',
            'GROUP BY u.user_id, u.org_name, u.plan_tier, s.mrr_usd',
            'ORDER BY total_events DESC;'
          ].join('\n')
        },
        {
          id: 'explain-sargable',
          label: '6. SARGable Index Probe & Composite Order Lookup (EXPLAIN QUERY PLAN)',
          datasetId: 'ecommerce',
          sql: [
            '-- SARGable Composite Index Probe on idx_orders_customer_date (customer_id, created_at)',
            'SELECT o.order_id,',
            '       o.customer_id,',
            '       c.name AS customer_name,',
            '       o.status,',
            '       ROUND(o.total_cents / 100.0, 2) AS total_usd,',
            '       o.created_at',
            'FROM orders o',
            'JOIN customers c ON c.customer_id = o.customer_id',
            'WHERE o.customer_id IN (1, 2, 4)',
            '  AND o.created_at >= \'2025-01-01\'',
            'ORDER BY o.created_at DESC;'
          ].join('\n')
        }
      ];
    },

    _getFileExt: function(filename) {
      var m = /\.([a-z0-9]+)$/i.exec(String(filename || '').trim());
      if (!m) return 'sql';
      var ext = m[1].toLowerCase();
      var allowed = { sql: 1, psql: 1, ddl: 1, csv: 1, tsv: 1, json: 1, jsonl: 1, txt: 1, md: 1 };
      return allowed[ext] ? ext : 'txt';
    },

    _isSqlExt: function(ext) {
      var e = String(ext || 'sql').toLowerCase();
      return e === 'sql' || e === 'psql' || e === 'ddl';
    },

    _sanitizeSqlIdent: function(raw) {
      var stem = String(raw || 'imported_table').replace(/\.[a-z0-9]+$/i, '');
      var cleaned = stem.replace(/[^a-zA-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
      if (!cleaned) cleaned = 'imported_data';
      if (/^[0-9]/.test(cleaned)) cleaned = 't_' + cleaned;
      return cleaned.slice(0, 48);
    },

    _getFileIconSvg: function(ext) {
      var e = String(ext || 'sql').toLowerCase();
      if (e === 'csv' || e === 'tsv') {
        return '<svg class="studio-file-tab__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>';
      }
      if (e === 'json' || e === 'jsonl') {
        return '<svg class="studio-file-tab__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/></svg>';
      }
      if (e === 'txt' || e === 'md') {
        return '<svg class="studio-file-tab__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>';
      }
      return '<svg class="studio-file-tab__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>';
    },

    _getSampleContentForExt: function(ext, filename) {
      var e = String(ext || 'sql').toLowerCase();
      var tbl = this._sanitizeSqlIdent(filename || 'items');
      if (e === 'csv') {
        return 'id,name,category,price_usd\n1,Keyboard,Hardware,129.00\n2,Monitor,Hardware,349.50\n3,Cloud Backup,Software,19.99\n';
      }
      if (e === 'tsv') {
        return 'id\tname\tcategory\tprice_usd\n1\tKeyboard\tHardware\t129.00\n2\tMonitor\tHardware\t349.50\n3\tCloud Backup\tSoftware\t19.99\n';
      }
      if (e === 'json') {
        return JSON.stringify([
          { id: 1, name: 'Ada Lovelace', role: 'Architect', active: true },
          { id: 2, name: 'Grace Hopper', role: 'Compiler Lead', active: true },
          { id: 3, name: 'Edgar Codd', role: 'Relational Pioneer', active: true }
        ], null, 2) + '\n';
      }
      if (e === 'jsonl') {
        return '{"id":1,"event":"signup","latency_ms":14}\n{"id":2,"event":"checkout","latency_ms":42}\n{"id":3,"event":"invoice","latency_ms":19}\n';
      }
      if (e === 'md' || e === 'txt') {
        return '# Workspace Notes\n\nWrite plain-text notes or runnable SQL blocks:\n\n```sql\nSELECT 1 AS ok, \'hello_studio\' AS status;\n```\n';
      }
      return [
        'CREATE TABLE IF NOT EXISTS ' + tbl + ' (',
        '  id INTEGER PRIMARY KEY,',
        '  title TEXT NOT NULL,',
        '  amount_cents INTEGER NOT NULL',
        ');',
        '',
        'INSERT INTO ' + tbl + ' (id, title, amount_cents) VALUES',
        '  (1, \'Starter Plan\', 2900),',
        '  (2, \'Team Plan\', 9900);',
        '',
        'SELECT id, title, ROUND(amount_cents / 100.0, 2) AS amount_usd',
        'FROM ' + tbl,
        'ORDER BY id;'
      ].join('\n');
    },

    _initStudioWorkspace: function() {
      var loadedFiles = null;
      var loadedActiveId = null;
      var loadedCustomDbs = null;
      var loadedActiveDb = null;
      try {
        if (root.localStorage) {
          var rawFiles = root.localStorage.getItem(this._studioFilesKey);
          if (rawFiles) loadedFiles = JSON.parse(rawFiles);
          loadedActiveId = root.localStorage.getItem(this._studioActiveFileKey);
          var rawDbs = root.localStorage.getItem(this._studioCustomDbsKey);
          if (rawDbs) loadedCustomDbs = JSON.parse(rawDbs);
          loadedActiveDb = root.localStorage.getItem(this._studioActiveDbKey);
        }
      } catch (e) {}

      this._customDatabases = Array.isArray(loadedCustomDbs)
        ? loadedCustomDbs.filter(function(d) { return d && d.id && d.name; })
        : [];

      if (Array.isArray(loadedFiles) && loadedFiles.length > 0) {
        var self = this;
        this._studioFiles = loadedFiles.map(function(f, idx) {
          var fname = (f && f.name) ? String(f.name) : ('untitled_' + (idx + 1) + '.sql');
          return {
            id: (f && f.id) ? String(f.id) : ('file_' + (idx + 1)),
            name: fname,
            ext: self._getFileExt(fname),
            content: (f && typeof f.content === 'string') ? f.content : ''
          };
        });
      } else {
        this._studioFiles = [
          { id: 'file_1', name: 'untitled.sql', ext: 'sql', content: '' }
        ];
      }

      var foundActive = this._studioFiles.find(function(f) { return f.id === loadedActiveId; }) || this._studioFiles[0];
      this._activeFileId = foundActive.id;
      this._sqlStudioQuery = foundActive.content || '';

      if (loadedActiveDb) {
        var isKnownCustom = loadedActiveDb.indexOf('custom:') === 0 && this._customDatabases.some(function(d) { return d.id === loadedActiveDb; });
        var isKnownBuiltin = loadedActiveDb === '__empty__' || loadedActiveDb === '__unified__' || Boolean(root.SQL_DATASETS && root.SQL_DATASETS[loadedActiveDb]);
        this._sqlStudioDatasetId = (isKnownCustom || isKnownBuiltin) ? loadedActiveDb : '__empty__';
      } else {
        this._sqlStudioDatasetId = '__empty__';
      }
    },

    _saveStudioWorkspace: function() {
      try {
        if (root.localStorage) {
          root.localStorage.setItem(this._studioFilesKey, JSON.stringify(this._studioFiles));
          if (this._activeFileId) {
            root.localStorage.setItem(this._studioActiveFileKey, this._activeFileId);
          }
          root.localStorage.setItem(this._studioCustomDbsKey, JSON.stringify(this._customDatabases));
          root.localStorage.setItem(this._studioActiveDbKey, this._sqlStudioDatasetId || '__empty__');
        }
      } catch (e) {}
    },

    _getActiveStudioFile: function() {
      if (!Array.isArray(this._studioFiles) || this._studioFiles.length === 0) {
        this._studioFiles = [{ id: 'file_1', name: 'untitled.sql', ext: 'sql', content: '' }];
        this._activeFileId = 'file_1';
      }
      var active = this._studioFiles.find(function(f) { return f.id === this._activeFileId; }, this) || this._studioFiles[0];
      this._activeFileId = active.id;
      return active;
    },

    _syncEditorToActiveFile: function() {
      var active = this._getActiveStudioFile();
      if (this._container) {
        var ed = this._container.querySelector('#wb-sql-studio-editor');
        if (ed) {
          active.content = ed.value;
          this._sqlStudioQuery = ed.value;
        }
      }
      this._saveStudioWorkspace();
      return active;
    },

    _nextAvailableFileName: function(ext) {
      var cleanExt = String(ext || 'sql').replace(/^\./, '').toLowerCase() || 'sql';
      var base = (cleanExt === 'csv' || cleanExt === 'tsv') ? 'data'
        : (cleanExt === 'json' || cleanExt === 'jsonl') ? 'records'
        : (cleanExt === 'txt' || cleanExt === 'md') ? 'notes'
        : 'query';
      var idx = 1;
      var existing = {};
      this._studioFiles.forEach(function(f) { existing[String(f.name || '').toLowerCase()] = true; });
      while (existing[(base + (idx === 1 ? '' : '_' + idx) + '.' + cleanExt).toLowerCase()]) {
        idx++;
      }
      return base + (idx === 1 ? '' : '_' + idx) + '.' + cleanExt;
    },

    _createStudioFile: function(rawName, withSample, explicitContent) {
      this._syncEditorToActiveFile();
      var trimmed = String(rawName || '').trim();
      var fallbackExt = this._newFileSelectedExt || 'sql';
      if (!trimmed) {
        trimmed = this._nextAvailableFileName(fallbackExt);
      } else if (!/\.[a-z0-9]+$/i.test(trimmed)) {
        trimmed = trimmed + '.' + fallbackExt;
      }
      var lowerName = trimmed.toLowerCase();
      var dupSuffix = 2;
      var stemPart = trimmed.replace(/(\.[a-z0-9]+)$/i, '');
      var extPart = (/\.[a-z0-9]+$/i.exec(trimmed) || ['.' + fallbackExt])[0];
      while (this._studioFiles.some(function(f) { return String(f.name || '').toLowerCase() === lowerName; })) {
        trimmed = stemPart + '_' + dupSuffix + extPart;
        lowerName = trimmed.toLowerCase();
        dupSuffix++;
      }
      var ext = this._getFileExt(trimmed);
      var content = typeof explicitContent === 'string'
        ? explicitContent
        : (withSample ? this._getSampleContentForExt(ext, trimmed) : '');
      var newFile = {
        id: 'file_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: trimmed,
        ext: ext,
        content: content
      };
      this._studioFiles.push(newFile);
      this._activeFileId = newFile.id;
      this._sqlStudioQuery = newFile.content;
      this._newFileBarOpen = false;
      this._renameFileBarOpen = false;
      this._saveStudioWorkspace();
      this.render();
      var self = this;
      setTimeout(function() {
        if (!self._container) return;
        var activeTab = self._container.querySelector('.studio-file-tab[aria-selected="true"]');
        if (activeTab && typeof activeTab.scrollIntoView === 'function') {
          activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
        var ed = self._container.querySelector('#wb-sql-studio-editor');
        if (ed) ed.focus();
      }, 0);
      return newFile;
    },

    _switchStudioFile: function(fileId) {
      if (!fileId || fileId === this._activeFileId) return;
      this._syncEditorToActiveFile();
      var target = this._studioFiles.find(function(f) { return f.id === fileId; });
      if (!target) return;
      this._activeFileId = target.id;
      this._sqlStudioQuery = target.content || '';
      this._renameFileBarOpen = false;
      this._saveStudioWorkspace();
      this.render();
      var self = this;
      setTimeout(function() {
        if (!self._container) return;
        var activeTab = self._container.querySelector('.studio-file-tab[aria-selected="true"]');
        if (activeTab && typeof activeTab.scrollIntoView === 'function') {
          activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }, 0);
    },

    _closeStudioFile: function(fileId) {
      this._syncEditorToActiveFile();
      var idx = this._studioFiles.findIndex(function(f) { return f.id === fileId; });
      if (idx === -1) return;
      if (this._studioFiles.length === 1) {
        this._studioFiles[0] = { id: 'file_1', name: 'untitled.sql', ext: 'sql', content: '' };
        this._activeFileId = 'file_1';
        this._sqlStudioQuery = '';
      } else {
        var wasActive = (this._activeFileId === fileId);
        this._studioFiles.splice(idx, 1);
        if (wasActive) {
          var nextIdx = Math.min(idx, this._studioFiles.length - 1);
          this._activeFileId = this._studioFiles[nextIdx].id;
          this._sqlStudioQuery = this._studioFiles[nextIdx].content || '';
        }
      }
      this._renameFileBarOpen = false;
      this._saveStudioWorkspace();
      this.render();
    },

    _renameActiveStudioFile: function(rawName) {
      var active = this._syncEditorToActiveFile();
      var nextName = String(rawName || '').trim();
      if (!nextName) {
        this._renameFileBarOpen = false;
        this.render();
        return;
      }
      if (!/\.[a-z0-9]+$/i.test(nextName)) {
        nextName = nextName + '.' + (active.ext || 'sql');
      }
      active.name = nextName;
      active.ext = this._getFileExt(nextName);
      this._renameFileBarOpen = false;
      this._saveStudioWorkspace();
      this.render();
    },

    _createCustomDatabase: function(rawName) {
      var cleanLabel = String(rawName || '').trim().replace(/\s+/g, ' ');
      if (!cleanLabel) cleanLabel = 'workspace_db_' + (this._customDatabases.length + 1);
      var slug = cleanLabel.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'custom_db';
      var dbId = 'custom:' + slug;
      var suffix = 2;
      while (this._customDatabases.some(function(d) { return d.id === dbId; })) {
        dbId = 'custom:' + slug + '_' + suffix;
        suffix++;
      }
      var entry = { id: dbId, name: cleanLabel, ddlLog: [] };
      this._customDatabases.push(entry);
      this._sqlStudioDatasetId = dbId;
      this._liveSchemaTables = [];
      this._newDbBarOpen = false;
      this._saveStudioWorkspace();
      if (root.SQLEngine && typeof root.SQLEngine.resetDataset === 'function') {
        var self = this;
        Promise.resolve(root.SQLEngine.resetDataset(dbId)).then(function() {
          self._replayedCustomDbs[self._sqlStudioEngine + ':' + dbId] = true;
          self.render();
        }).catch(function() {
          self.render();
        });
      } else {
        this.render();
      }
      return entry;
    },

    _deleteCustomDatabase: function(dbId) {
      if (!dbId || dbId.indexOf('custom:') !== 0) return;
      this._customDatabases = this._customDatabases.filter(function(d) { return d.id !== dbId; });
      if (this._sqlStudioDatasetId === dbId) {
        this._sqlStudioDatasetId = '__empty__';
      }
      this._liveSchemaTables = null;
      this._saveStudioWorkspace();
      if (root.SQLEngine && typeof root.SQLEngine.resetDataset === 'function') {
        root.SQLEngine.resetDataset(dbId).catch(function() {});
      }
      this.render();
    },

    _recordCustomDbMutation: function(dsId, sql) {
      if (!dsId || dsId.indexOf('custom:') !== 0 || !sql) return;
      var dbObj = this._customDatabases.find(function(d) { return d.id === dsId; });
      if (!dbObj) return;
      if (!Array.isArray(dbObj.ddlLog)) dbObj.ddlLog = [];
      var trimmed = String(sql).trim();
      if (!trimmed || trimmed.length > 40000) return;
      dbObj.ddlLog.push(trimmed);
      if (dbObj.ddlLog.length > 40) {
        dbObj.ddlLog = dbObj.ddlLog.slice(dbObj.ddlLog.length - 40);
      }
      this._replayedCustomDbs[this._sqlStudioEngine + ':' + dsId] = true;
      this._saveStudioWorkspace();
    },

    _ensureCustomDbReplayed: function(dsId) {
      if (!dsId || dsId.indexOf('custom:') !== 0 || !root.SQLEngine || typeof root.SQLEngine.execute !== 'function') {
        return Promise.resolve();
      }
      var replayKey = this._sqlStudioEngine + ':' + dsId;
      if (this._replayedCustomDbs[replayKey]) return Promise.resolve();
      this._replayedCustomDbs[replayKey] = true;
      var dbObj = this._customDatabases.find(function(d) { return d.id === dsId; });
      if (!dbObj || !Array.isArray(dbObj.ddlLog) || dbObj.ddlLog.length === 0) {
        return Promise.resolve();
      }
      var self = this;
      var chain = Promise.resolve();
      dbObj.ddlLog.forEach(function(stmt) {
        chain = chain.then(function() {
          return root.SQLEngine.execute(stmt, {
            datasetId: dsId,
            engine: self._sqlStudioEngine,
            explain: false,
            skipDmlDiff: true
          }).catch(function() {});
        });
      });
      return chain;
    },

    _parseDelimitedRecords: function(rawText, delimiter) {
      var sep = delimiter || ',';
      var text = String(rawText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      var rows = [];
      var curRow = [];
      var curField = '';
      var inQuotes = false;
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (inQuotes) {
          if (ch === '"') {
            if (text[i + 1] === '"') {
              curField += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            curField += ch;
          }
        } else if (ch === '"') {
          inQuotes = true;
        } else if (ch === sep) {
          curRow.push(curField);
          curField = '';
        } else if (ch === '\n') {
          curRow.push(curField);
          curField = '';
          if (curRow.length > 1 || (curRow.length === 1 && curRow[0].trim() !== '')) {
            rows.push(curRow);
          }
          curRow = [];
        } else {
          curField += ch;
        }
      }
      if (curField.length > 0 || curRow.length > 0) {
        curRow.push(curField);
        if (curRow.length > 1 || (curRow.length === 1 && curRow[0].trim() !== '')) {
          rows.push(curRow);
        }
      }
      if (rows.length === 0) return { headers: [], rows: [] };
      var rawHeaders = rows[0];
      var usedCols = {};
      var self = this;
      var headers = rawHeaders.map(function(h, idx) {
        var clean = self._sanitizeSqlIdent(h || ('col_' + (idx + 1)));
        if (usedCols[clean]) {
          var n = 2;
          while (usedCols[clean + '_' + n]) n++;
          clean = clean + '_' + n;
        }
        usedCols[clean] = true;
        return clean;
      });
      var dataRows = rows.slice(1).map(function(r) {
        return headers.map(function(_, cIdx) {
          return cIdx < r.length ? r[cIdx] : null;
        });
      });
      return { headers: headers, rows: dataRows };
    },

    _parseJsonRecords: function(rawText, ext) {
      var trimmed = String(rawText || '').trim();
      if (!trimmed) return { headers: [], rows: [] };
      var items = [];
      if (ext === 'jsonl') {
        trimmed.split(/\r?\n/).forEach(function(line) {
          var ln = line.trim();
          if (ln) items.push(JSON.parse(ln));
        });
      } else {
        var parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.rows)) items = parsed.rows;
          else if (Array.isArray(parsed.data)) items = parsed.data;
          else if (Array.isArray(parsed.items)) items = parsed.items;
          else items = [parsed];
        }
      }
      if (items.length === 0) return { headers: [], rows: [] };
      var colMap = {};
      var rawColOrder = [];
      items.forEach(function(item) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          Object.keys(item).forEach(function(k) {
            if (!colMap[k]) {
              colMap[k] = true;
              rawColOrder.push(k);
            }
          });
        }
      });
      if (rawColOrder.length === 0) {
        return {
          headers: ['value'],
          rows: items.map(function(v) { return [v != null && typeof v === 'object' ? JSON.stringify(v) : v]; })
        };
      }
      var self = this;
      var used = {};
      var headers = rawColOrder.map(function(k, idx) {
        var clean = self._sanitizeSqlIdent(k || ('col_' + (idx + 1)));
        if (used[clean]) {
          var n = 2;
          while (used[clean + '_' + n]) n++;
          clean = clean + '_' + n;
        }
        used[clean] = true;
        return clean;
      });
      var rows = items.map(function(item) {
        return rawColOrder.map(function(k) {
          var v = item ? item[k] : null;
          if (v !== null && typeof v === 'object') return JSON.stringify(v);
          return v;
        });
      });
      return { headers: headers, rows: rows };
    },

    _buildTableImportSql: function(tableName, headers, rows) {
      var colTypes = headers.map(function(_, colIdx) {
        var sawNonNull = false;
        var allInt = true;
        var allNum = true;
        for (var r = 0; r < rows.length; r++) {
          var raw = rows[r][colIdx];
          if (raw === null || raw === undefined || String(raw).trim() === '') continue;
          sawNonNull = true;
          if (typeof raw === 'boolean') {
            allInt = false;
            allNum = false;
            break;
          }
          var s = String(raw).trim();
          if (!/^-?\d+$/.test(s)) allInt = false;
          if (!/^-?\d+(\.\d+)?$/.test(s)) {
            allNum = false;
            break;
          }
        }
        if (!sawNonNull) return 'TEXT';
        if (allInt) return 'INTEGER';
        if (allNum) return 'REAL';
        return 'TEXT';
      });

      var quotedTbl = '"' + tableName.replace(/"/g, '""') + '"';
      var colDefs = headers.map(function(h, idx) {
        return '"' + h.replace(/"/g, '""') + '" ' + colTypes[idx];
      });
      var stmts = [
        'DROP TABLE IF EXISTS ' + quotedTbl + ';',
        'CREATE TABLE ' + quotedTbl + ' (' + colDefs.join(', ') + ');'
      ];
      if (rows.length > 0) {
        var colList = headers.map(function(h) { return '"' + h.replace(/"/g, '""') + '"'; }).join(', ');
        var valueTuples = rows.map(function(r) {
          var cells = headers.map(function(_, idx) {
            var val = r[idx];
            if (val === null || val === undefined || String(val).trim() === '') return 'NULL';
            if (colTypes[idx] === 'INTEGER' || colTypes[idx] === 'REAL') {
              var num = Number(String(val).trim());
              if (!isNaN(num) && isFinite(num)) return String(num);
            }
            return "'" + String(val).replace(/'/g, "''") + "'";
          });
          return '(' + cells.join(', ') + ')';
        });
        stmts.push('INSERT INTO ' + quotedTbl + ' (' + colList + ') VALUES\n  ' + valueTuples.join(',\n  ') + ';');
      }
      return stmts.join('\n');
    },

    _extractRunnableSqlFromText: function(rawText) {
      var text = String(rawText || '');
      var fenced = [];
      var fenceRe = /```(?:sql|postgres|postgresql|sqlite|psql)\s*\n([\s\S]*?)```/gi;
      var m;
      while ((m = fenceRe.exec(text)) !== null) {
        if (m[1] && m[1].trim()) fenced.push(m[1].trim());
      }
      if (fenced.length > 0) return fenced.join('\n\n');
      var stripped = text.replace(/^\s*(--|\/\*[\s\S]*?\*\/)\s*/g, '').trim();
      if (/^(SELECT|WITH|CREATE|INSERT|UPDATE|DELETE|ALTER|DROP|EXPLAIN|VALUES|PRAGMA|SHOW|BEGIN)\b/i.test(stripped)) {
        return text.trim();
      }
      return '';
    },

    _renderTableItemsHtml: function(tables, dsKey) {
      return (tables || []).map(function(t) {
        var cols = t.columns || [];
        var colsHtml = cols.map(function(colItem) {
          var colName = '';
          var colType = 'TEXT';
          var isPk = false;
          var fkTarget = '';
          if (typeof colItem === 'string') {
            var parts = colItem.trim().split(/\s+/);
            colName = parts[0] || '';
            colType = parts[1] || 'TEXT';
            isPk = /PRIMARY\s+KEY/i.test(colItem) || (t.pk && t.pk.split(/\s*,\s*/).indexOf(colName) !== -1);
            if (/REFERENCES/i.test(colItem)) {
              var refMatch = colItem.match(/REFERENCES\s+([a-zA-Z0-9_.(),]+)/i);
              fkTarget = refMatch ? refMatch[1] : 'FK';
            }
          } else if (colItem && typeof colItem === 'object') {
            colName = colItem.name || '';
            colType = colItem.type || 'TEXT';
            isPk = Boolean(colItem.pk || colItem.isPk);
            if (colItem.fk && typeof colItem.fk === 'object') {
              fkTarget = (colItem.fk.targetTable || '') + (colItem.fk.targetColumn ? '.' + colItem.fk.targetColumn : '');
            } else if (colItem.fk) {
              fkTarget = String(colItem.fk);
            }
          }
          return (
            '<button type="button" class="schema-col sql-studio-col-item sql-studio-col-item--clickable" data-insert-col="' + escapeHtml(colName) + '" title="Insert ' + escapeHtml(colName) + ' into the editor">' +
              '<span class="schema-col__name">' + escapeHtml(colName) + '</span>' +
              (isPk ? '<span class="col-badge col-badge--pk wb-col-badge wb-col-badge--pk">PK</span>' : '') +
              (fkTarget ? '<span class="col-badge col-badge--fk wb-col-badge wb-col-badge--fk" title="References ' + escapeHtml(fkTarget) + '">FK</span>' : '') +
              '<span class="schema-col__type">' + escapeHtml(String(colType).toLowerCase()) + '</span>' +
            '</button>'
          );
        }).join('');

        var rowCount = typeof t.rowCount === 'number' ? t.rowCount : (Array.isArray(t.rows) ? t.rows.length : 0);
        var colNamesForFilter = cols.map(function(colItem) {
          if (typeof colItem === 'string') return colItem.trim().split(/\s+/)[0] || '';
          return (colItem && colItem.name) || '';
        }).join(' ').toLowerCase();
        return (
          '<div class="schema-table sql-schema-table-item" data-table-name="' + escapeHtml(String(t.name || '').toLowerCase()) + '" data-table-cols="' + escapeHtml(colNamesForFilter) + '">' +
            '<details class="schema-table__details">' +
              '<summary class="schema-table__summary" title="Show columns of ' + escapeHtml(t.name) + '">' +
                '<span class="schema-table__chevron" aria-hidden="true"></span>' +
                '<span class="schema-table__name">' + escapeHtml(t.name) + '</span>' +
                '<span class="schema-table__rows">' + rowCount + '</span>' +
              '</summary>' +
              '<div class="schema-table__cols">' + colsHtml + '</div>' +
            '</details>' +
            '<div class="schema-table__actions">' +
              '<button type="button" class="schema-action" data-sql-preview-table="' + escapeHtml(t.name) + '" data-sql-preview-ds="' + escapeHtml(dsKey) + '" title="Run SELECT * FROM ' + escapeHtml(t.name) + ' LIMIT 15" aria-label="Preview rows of ' + escapeHtml(t.name) + '">Preview</button>' +
              '<button type="button" class="schema-action wb-insert-table-btn" data-insert-table="' + escapeHtml(t.name) + '" title="Insert ' + escapeHtml(t.name) + ' into the editor" aria-label="Insert table ' + escapeHtml(t.name) + '">Insert</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    },

    _renderSqlStudioSchemaExplorer: function() {
      var datasets = root.SQL_DATASETS || {};
      var dsKeys = Object.keys(datasets);
      var activeDs = this._sqlStudioDatasetId || '__empty__';
      var self = this;

      if (activeDs === '__empty__' || activeDs.indexOf('custom:') === 0) {
        var customMeta = this._customDatabases.find(function(d) { return d.id === activeDs; });
        var dbTitle = activeDs === '__empty__'
          ? 'Empty database (scratch)'
          : ((customMeta && customMeta.name) || activeDs.slice(7));
        var liveTables = Array.isArray(this._liveSchemaTables) ? this._liveSchemaTables : [];
        if (liveTables.length === 0) {
          return (
            '<div class="studio-empty-db-state">' +
              '<p class="studio-empty-db-state__title">' + escapeHtml(dbTitle) + ' · 0 tables</p>' +
              '<p class="studio-empty-db-state__desc">Run <code>CREATE TABLE</code>, import a <code>.csv</code> / <code>.json</code> file, or switch to the 26-table sample datasets.</p>' +
              '<div class="studio-empty-db-state__actions">' +
                '<button type="button" class="studio-btn studio-btn--sm" data-sql-studio-action="starter-create-table">+ CREATE TABLE</button>' +
                '<button type="button" class="studio-btn studio-btn--ghost studio-btn--sm" data-sql-studio-action="switch-sample-db">26-table sample DB</button>' +
              '</div>' +
            '</div>'
          );
        }
        return (
          '<details class="schema-ds sql-schema-ds-group" open>' +
            '<summary class="schema-ds__summary">' +
              '<span class="schema-ds__title">' + escapeHtml(dbTitle) + '</span>' +
              '<span class="schema-ds__meta">' + liveTables.length + (liveTables.length === 1 ? ' table' : ' tables') + '</span>' +
            '</summary>' +
            '<div class="schema-ds__tables">' + self._renderTableItemsHtml(liveTables, activeDs) + '</div>' +
          '</details>'
        );
      }

      return dsKeys.map(function(dsKey) {
        var ds = datasets[dsKey];
        if (!ds) return '';
        if (activeDs !== '__unified__' && activeDs !== dsKey) return '';
        var tables = ds.tables || [];
        return (
          '<details class="schema-ds sql-schema-ds-group" open>' +
            '<summary class="schema-ds__summary">' +
              '<span class="schema-ds__title">' + escapeHtml(ds.title || dsKey) + '</span>' +
              '<span class="schema-ds__meta">' + tables.length + ' tables</span>' +
            '</summary>' +
            '<div class="schema-ds__tables">' + self._renderTableItemsHtml(tables, dsKey) + '</div>' +
          '</details>'
        );
      }).join('');
    },

    _getSchemaCountLabel: function() {
      var activeDs = this._sqlStudioDatasetId || '__empty__';
      if (activeDs === '__unified__') return '5 datasets · 26 Tables';
      if (activeDs === '__empty__' || activeDs.indexOf('custom:') === 0) {
        var n = Array.isArray(this._liveSchemaTables) ? this._liveSchemaTables.length : 0;
        return n + (n === 1 ? ' Table' : ' Tables');
      }
      var ds = (root.SQL_DATASETS || {})[activeDs];
      var cnt = ds && Array.isArray(ds.tables) ? ds.tables.length : 0;
      return cnt + (cnt === 1 ? ' Table' : ' Tables');
    },

    _refreshLiveSchemaExplorer: function() {
      var self = this;
      var activeDs = this._sqlStudioDatasetId || '__empty__';
      if (!root.SQLEngine || typeof root.SQLEngine.introspectSchema !== 'function') {
        return Promise.resolve([]);
      }
      return this._ensureCustomDbReplayed(activeDs).then(function() {
        return root.SQLEngine.introspectSchema(activeDs, { engine: self._sqlStudioEngine });
      }).then(function(tables) {
        if ((self._sqlStudioDatasetId || '__empty__') !== activeDs) return tables;
        self._liveSchemaTables = Array.isArray(tables) ? tables : [];
        if (self._container) {
          var sidebarEl = self._container.querySelector('#wb-sql-schema-sidebar');
          if (sidebarEl) {
            if (activeDs === '__empty__' || activeDs.indexOf('custom:') === 0) {
              sidebarEl.innerHTML = self._renderSqlStudioSchemaExplorer();
            } else if (Array.isArray(tables) && tables.length > 0 && activeDs !== '__unified__') {
              var dsMeta = (root.SQL_DATASETS || {})[activeDs];
              sidebarEl.innerHTML =
                '<details class="schema-ds sql-schema-ds-group" open>' +
                  '<summary class="schema-ds__summary">' +
                    '<span class="schema-ds__title">' + escapeHtml((dsMeta && dsMeta.title) || activeDs) + '</span>' +
                    '<span class="schema-ds__meta">' + tables.length + ' tables</span>' +
                  '</summary>' +
                  '<div class="schema-ds__tables">' + self._renderTableItemsHtml(tables, activeDs) + '</div>' +
                '</details>';
            }
          }
          var cntEl = self._container.querySelector('.studio-schema__count');
          if (cntEl) {
            cntEl.textContent = activeDs === '__unified__'
              ? '5 datasets · 26 Tables'
              : (self._liveSchemaTables.length + (self._liveSchemaTables.length === 1 ? ' Table' : ' Tables'));
          }
          if (self._schemaFilter) self._applySchemaFilter(self._schemaFilter);
        }
        return self._liveSchemaTables;
      }).catch(function() {
        return [];
      });
    },

    _applySchemaFilter: function(rawQuery) {
      if (!this._container) return;
      var list = this._container.querySelector('#wb-sql-schema-sidebar');
      if (!list) return;
      var q = String(rawQuery || '').trim().toLowerCase();
      var dsGroups = list.querySelectorAll('.schema-ds');
      if (dsGroups.length === 0) return;
      var anyMatch = false;
      dsGroups.forEach(function(dsEl) {
        var dsHasMatch = false;
        dsEl.querySelectorAll('.schema-table').forEach(function(tEl) {
          var name = tEl.getAttribute('data-table-name') || '';
          var cols = tEl.getAttribute('data-table-cols') || '';
          var isMatch = !q || name.indexOf(q) !== -1 || cols.indexOf(q) !== -1;
          tEl.hidden = !isMatch;
          if (isMatch) dsHasMatch = true;
        });
        dsEl.hidden = !dsHasMatch;
        if (q && dsHasMatch) dsEl.open = true;
        if (dsHasMatch) anyMatch = true;
      });
      var emptyEl = this._container.querySelector('.studio-schema__empty');
      if (emptyEl) emptyEl.hidden = anyMatch;
    },

    _initStudioSplitter: function() {
      if (!this._container) return;
      var work = this._container.querySelector('.studio-work');
      var handle = work ? work.querySelector('.studio-splitter') : null;
      var editorPane = work ? work.querySelector('.studio-pane--editor') : null;
      if (!handle || !editorPane) return;
      var storageKey = 'sqlStudio.editorHeight';
      var minEditor = 180;
      var minResults = 160;

      var apply = function(px) {
        var total = work.getBoundingClientRect().height;
        var maxEditor = Math.max(minEditor, total - minResults);
        var h = Math.round(Math.min(Math.max(px, minEditor), maxEditor));
        work.style.setProperty('--studio-editor-h', h + 'px');
        handle.setAttribute('aria-valuenow', String(h));
        return h;
      };
      var save = function(h) {
        try { root.localStorage.setItem(storageKey, String(h)); } catch (err) { /* storage unavailable */ }
      };

      var saved = NaN;
      try { saved = parseInt(root.localStorage.getItem(storageKey) || '', 10); } catch (err) { saved = NaN; }
      if (!isNaN(saved)) apply(saved);

      handle.addEventListener('pointerdown', function(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        var startY = e.clientY;
        var startH = editorPane.getBoundingClientRect().height;
        var lastH = startH;
        handle.setPointerCapture(e.pointerId);
        work.classList.add('is-resizing');
        var onMove = function(ev) { lastH = apply(startH + (ev.clientY - startY)); };
        var onEnd = function() {
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onEnd);
          handle.removeEventListener('pointercancel', onEnd);
          work.classList.remove('is-resizing');
          save(lastH);
        };
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onEnd);
        handle.addEventListener('pointercancel', onEnd);
      });

      handle.addEventListener('keydown', function(e) {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        var cur = editorPane.getBoundingClientRect().height;
        save(apply(cur + (e.key === 'ArrowDown' ? 32 : -32)));
      });

      handle.addEventListener('dblclick', function() {
        work.style.removeProperty('--studio-editor-h');
        try { root.localStorage.removeItem(storageKey); } catch (err) { /* storage unavailable */ }
      });
    },

    _buildSavedHistoryOptionsHtml: function() {
      if (!root.TableVisualizer) return '<option value="">History</option>';
      var saved = typeof root.TableVisualizer.getSavedQueries === 'function' ? root.TableVisualizer.getSavedQueries() : [];
      var history = typeof root.TableVisualizer.getQueryHistory === 'function' ? root.TableVisualizer.getQueryHistory() : [];
      var html = '<option value="">History · ' + (saved.length + history.length) + '</option>';
      if (saved.length > 0) {
        html += '<optgroup label="Saved Queries">';
        saved.forEach(function(item) {
          html += '<option value="saved:' + escapeHtml(item.id) + '">' + escapeHtml(item.title) + ' (' + escapeHtml(item.datasetId || 'ecommerce') + ')</option>';
        });
        html += '</optgroup>';
      }
      if (history.length > 0) {
        html += '<optgroup label="Recent History">';
        history.forEach(function(item) {
          var snippet = String(item.sql || '').replace(/\s+/g, ' ').trim().slice(0, 56);
          html += '<option value="history:' + escapeHtml(item.id) + '">' + escapeHtml(snippet) + ' (' + (item.rowCount || 0) + ' rows)</option>';
        });
        html += '</optgroup>';
      }
      return html;
    },

    _mountSqlStudioVisualizer: function(opts) {
      if (!this._container || this._activeWorkbenchMode !== 'sql-studio') return;
      opts = opts || {};
      var slot = this._container.querySelector('#wb-sql-studio-visualizer-slot');
      var editor = this._container.querySelector('#wb-sql-studio-editor');
      var sql = typeof opts.sqlOverride === 'string'
        ? opts.sqlOverride.trim()
        : (editor ? editor.value.trim() : (this._sqlStudioQuery || '').trim());
      if (editor && typeof opts.sqlOverride !== 'string') {
        this._sqlStudioQuery = editor.value;
      }
      if (!slot || !root.TableVisualizer || typeof root.TableVisualizer.mountClauseVisualizer !== 'function') return;

      if (this._sqlStudioVizHandle && typeof this._sqlStudioVizHandle.stop === 'function') {
        this._sqlStudioVizHandle.stop();
      }
      var self = this;
      var activeDs = this._sqlStudioDatasetId || '__empty__';
      this._sqlStudioVizHandle = this._ensureCustomDbReplayed(activeDs).then(function() {
        return root.TableVisualizer.mountClauseVisualizer(slot, sql, {
          datasetId: activeDs,
          referenceSql: sql,
          ideCtrl: self._wbIdeCtrl || null,
          startAtFinal: opts.startAtFinal !== false,
          focusExplain: Boolean(opts.focusExplain),
          runTests: Boolean(opts.runTests),
          compactHeader: true
        });
      });
      Promise.resolve(this._sqlStudioVizHandle).then(function() {
        if (opts.statusBanner && slot) {
          var banner = document.createElement('div');
          banner.className = 'studio-import-banner';
          banner.textContent = opts.statusBanner;
          slot.insertBefore(banner, slot.firstChild);
        }
        if (sql && (activeDs === '__empty__' || activeDs.indexOf('custom:') === 0 || /\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE)\b/i.test(sql))) {
          if (!opts.skipDdlLog && /\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|TRUNCATE)\b/i.test(sql)) {
            self._recordCustomDbMutation(activeDs, sql);
          }
          self._refreshLiveSchemaExplorer();
        }
        var sel = self._container ? self._container.querySelector('#wb-sql-saved-history-select') : null;
        if (sel) {
          var prevVal = sel.value;
          sel.innerHTML = self._buildSavedHistoryOptionsHtml();
          if (prevVal && prevVal.indexOf('saved:') === 0) {
            sel.value = prevVal;
          }
        }
      }).catch(function() {});
    },

    _executeActiveStudioFile: function(opts) {
      if (!this._container || this._activeWorkbenchMode !== 'sql-studio') return;
      opts = opts || {};
      var activeFile = this._syncEditorToActiveFile();
      var ext = activeFile.ext || 'sql';
      var rawContent = activeFile.content || '';
      var slot = this._container.querySelector('#wb-sql-studio-visualizer-slot');
      var editor = this._container.querySelector('#wb-sql-studio-editor');
      var self = this;
      var activeDs = this._sqlStudioDatasetId || '__empty__';

      var selectedText = '';
      if (editor && !opts.initialMount && typeof editor.selectionStart === 'number' && editor.selectionStart !== editor.selectionEnd) {
        selectedText = editor.value.slice(editor.selectionStart, editor.selectionEnd).trim();
      }

      if (this._isSqlExt(ext)) {
        var sqlToRun = selectedText || rawContent.trim();
        this._mountSqlStudioVisualizer({
          sqlOverride: sqlToRun,
          startAtFinal: opts.startAtFinal !== false,
          focusExplain: Boolean(opts.focusExplain),
          runTests: Boolean(opts.runTests),
          statusBanner: selectedText ? ('Executed highlighted SQL selection (' + selectedText.split('\n').length + ' lines)') : ''
        });
        return;
      }

      if (ext === 'csv' || ext === 'tsv') {
        if (!rawContent.trim()) {
          if (slot) {
            slot.innerHTML = '<div class="sql-viz-idle">Paste or type ' + ext.toUpperCase() + ' rows above (first line = column headers) and press <strong>Import &amp; Run</strong> to create table <code>' + escapeHtml(this._sanitizeSqlIdent(activeFile.name)) + '</code> in the selected database.</div>';
          }
          return;
        }
        if (opts.initialMount) {
          if (slot) {
            slot.innerHTML = '<div class="sql-viz-idle">Ready to import <code>' + escapeHtml(activeFile.name) + '</code> into table <code>' + escapeHtml(this._sanitizeSqlIdent(activeFile.name)) + '</code>. Press <strong>Import &amp; Run</strong> to load and query rows.</div>';
          }
          return;
        }
        var parsedDelim = this._parseDelimitedRecords(rawContent, ext === 'tsv' ? '\t' : ',');
        if (parsedDelim.headers.length === 0) {
          if (slot) slot.innerHTML = '<div class="sql-viz-error"><strong>Empty ' + ext.toUpperCase() + ' file</strong><p>Add a header row and at least one value to import into a SQL table.</p></div>';
          return;
        }
        var csvTable = this._sanitizeSqlIdent(activeFile.name);
        var csvImportSql = this._buildTableImportSql(csvTable, parsedDelim.headers, parsedDelim.rows);
        if (slot) slot.innerHTML = '<div class="sql-viz-loading">Importing ' + parsedDelim.rows.length + ' rows into "' + escapeHtml(csvTable) + '"…</div>';
        this._ensureCustomDbReplayed(activeDs).then(function() {
          return root.SQLEngine.execute(csvImportSql, {
            datasetId: activeDs,
            engine: self._sqlStudioEngine,
            explain: false,
            skipDmlDiff: true
          });
        }).then(function(res) {
          if (res && res.error) {
            if (slot) slot.innerHTML = '<div class="sql-viz-error"><strong>CSV Import Error</strong><pre>' + escapeHtml(res.error) + '</pre></div>';
            return;
          }
          self._recordCustomDbMutation(activeDs, csvImportSql);
          self._refreshLiveSchemaExplorer();
          self._mountSqlStudioVisualizer({
            sqlOverride: 'SELECT * FROM "' + csvTable + '" LIMIT 50;',
            startAtFinal: true,
            skipDdlLog: true,
            statusBanner: 'Imported ' + parsedDelim.rows.length + ' rows from ' + activeFile.name + ' into table "' + csvTable + '"'
          });
        });
        return;
      }

      if (ext === 'json' || ext === 'jsonl') {
        if (!rawContent.trim()) {
          if (slot) {
            slot.innerHTML = '<div class="sql-viz-idle">Paste a JSON array of objects (or newline-delimited JSON) above and press <strong>Import &amp; Run</strong> to create table <code>' + escapeHtml(this._sanitizeSqlIdent(activeFile.name)) + '</code>.</div>';
          }
          return;
        }
        if (opts.initialMount) {
          if (slot) {
            slot.innerHTML = '<div class="sql-viz-idle">Ready to import <code>' + escapeHtml(activeFile.name) + '</code> into table <code>' + escapeHtml(this._sanitizeSqlIdent(activeFile.name)) + '</code>. Press <strong>Import &amp; Run</strong> to load and query rows.</div>';
          }
          return;
        }
        var parsedJson;
        try {
          parsedJson = this._parseJsonRecords(rawContent, ext);
        } catch (jsonErr) {
          if (slot) {
            slot.innerHTML = '<div class="sql-viz-error"><strong>Invalid JSON syntax in ' + escapeHtml(activeFile.name) + '</strong><pre>' + escapeHtml(jsonErr && jsonErr.message ? jsonErr.message : String(jsonErr)) + '</pre></div>';
          }
          return;
        }
        if (parsedJson.headers.length === 0) {
          if (slot) slot.innerHTML = '<div class="sql-viz-idle">Valid JSON (0 records to import).</div>';
          return;
        }
        var jsonTable = this._sanitizeSqlIdent(activeFile.name);
        var jsonImportSql = this._buildTableImportSql(jsonTable, parsedJson.headers, parsedJson.rows);
        if (slot) slot.innerHTML = '<div class="sql-viz-loading">Importing ' + parsedJson.rows.length + ' JSON records into "' + escapeHtml(jsonTable) + '"…</div>';
        this._ensureCustomDbReplayed(activeDs).then(function() {
          return root.SQLEngine.execute(jsonImportSql, {
            datasetId: activeDs,
            engine: self._sqlStudioEngine,
            explain: false,
            skipDmlDiff: true
          });
        }).then(function(res) {
          if (res && res.error) {
            if (slot) slot.innerHTML = '<div class="sql-viz-error"><strong>JSON Import Error</strong><pre>' + escapeHtml(res.error) + '</pre></div>';
            return;
          }
          self._recordCustomDbMutation(activeDs, jsonImportSql);
          self._refreshLiveSchemaExplorer();
          self._mountSqlStudioVisualizer({
            sqlOverride: 'SELECT * FROM "' + jsonTable + '" LIMIT 50;',
            startAtFinal: true,
            skipDdlLog: true,
            statusBanner: 'Imported ' + parsedJson.rows.length + ' records from ' + activeFile.name + ' into table "' + jsonTable + '"'
          });
        });
        return;
      }

      // .txt / .md plain text & runnable SQL note files
      var extractedSql = selectedText || this._extractRunnableSqlFromText(rawContent);
      if (extractedSql && !opts.initialMount) {
        this._mountSqlStudioVisualizer({
          sqlOverride: extractedSql,
          startAtFinal: true,
          statusBanner: 'Executed SQL from ' + activeFile.name
        });
        return;
      }
      if (slot) {
        var trimmedTxt = rawContent.trim();
        if (!trimmedTxt) {
          slot.innerHTML = '<div class="sql-viz-idle">Plain-text scratchpad (<code>' + escapeHtml(activeFile.name) + '</code>). Highlight any SQL statement or wrap SQL in <code>```sql</code> fences and press <strong>Run SQL</strong>.</div>';
        } else {
          var lineCount = rawContent.split('\n').length;
          var wordCount = trimmedTxt.split(/\s+/).filter(Boolean).length;
          slot.innerHTML =
            '<div class="studio-text-preview">' +
              '<div class="studio-text-preview__head">' +
                '<strong>' + escapeHtml(activeFile.name) + '</strong>' +
                '<span>' + lineCount + (lineCount === 1 ? ' line' : ' lines') + ' · ' + wordCount + (wordCount === 1 ? ' word' : ' words') + (extractedSql ? ' · Runnable SQL detected (press Run SQL)' : '') + '</span>' +
              '</div>' +
              '<pre class="studio-text-preview__body">' + escapeHtml(rawContent) + '</pre>' +
            '</div>';
        }
      }
    },

    _runAllSqlFiles: function() {
      this._syncEditorToActiveFile();
      var self = this;
      var sqlFiles = this._studioFiles.filter(function(f) {
        return self._isSqlExt(f.ext) && f.content && f.content.trim();
      });
      if (sqlFiles.length === 0) {
        var slot = this._container ? this._container.querySelector('#wb-sql-studio-visualizer-slot') : null;
        if (slot) slot.innerHTML = '<div class="sql-viz-idle">No non-empty <code>.sql</code> files to run in the workspace.</div>';
        return;
      }
      var combined = sqlFiles.map(function(f) {
        return '-- File: ' + f.name + '\n' + f.content.trim().replace(/;?\s*$/, ';');
      }).join('\n\n');
      this._mountSqlStudioVisualizer({
        sqlOverride: combined,
        startAtFinal: true,
        statusBanner: 'Executed ' + sqlFiles.length + ' SQL ' + (sqlFiles.length === 1 ? 'file' : 'files') + ' (' + sqlFiles.map(function(f) { return f.name; }).join(' → ') + ')'
      });
    },

    _getChallengesList: function() {
      var raw = (root && (root.CHALLENGES_DATA || root.ChallengesData)) || [];
      var arr = Array.isArray(raw) ? raw : (raw.challenges || []);
      return arr.filter(function(c) { return c && c.codeFix && c.codeFix.solutionCode; });
    },

    _getSolvedChallengesMap: function() {
      try {
        if (root.localStorage) {
          var s = root.localStorage.getItem(this._solvedChallengesKey);
          if (s) return JSON.parse(s) || {};
        }
      } catch (e) {}
      return {};
    },

    _markChallengeSolved: function(chalId) {
      if (!chalId) return;
      var map = this._getSolvedChallengesMap();
      map[chalId] = Date.now();
      if (root.Progress && typeof root.Progress.markComplete === 'function') {
        try { root.Progress.markComplete('challenge:' + chalId); } catch (err) { /* progress store unavailable */ }
      }
      try {
        if (root.localStorage) {
          root.localStorage.setItem(this._solvedChallengesKey, JSON.stringify(map));
        }
      } catch (e) {}
    },

    _triggerDownload: function(content, filename, mime) {
      try {
        var blob = new Blob([content], { type: mime });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {}
    },

    // ── Coordinate Helpers & Live DOM Edge Updates ─────────────
    _screenToSvg: function(clientX, clientY) {
      if (!this._container) return { x: clientX, y: clientY };
      var svg = this._container.querySelector('#wb-svg-canvas');
      if (!svg) return { x: clientX, y: clientY };
      var rect = svg.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return { x: clientX, y: clientY };
      var vbWidth = 1250 / this._zoom;
      var vbHeight = 500 / this._zoom;
      var vbX = this._panX;
      var vbY = this._panY;
      return {
        x: vbX + ((clientX - rect.left) / rect.width) * vbWidth,
        y: vbY + ((clientY - rect.top) / rect.height) * vbHeight
      };
    },

    _computeEdgeGeometry: function(src, tgt, idx) {
      var x1 = tgt.x > src.x + 110 ? src.x + 150 : (tgt.x + 150 < src.x ? src.x : src.x + 75);
      var y1 = tgt.x > src.x + 110 || tgt.x + 150 < src.x ? src.y + 29 : (tgt.y > src.y ? src.y + 58 : src.y);
      var x2 = tgt.x > src.x + 110 ? tgt.x : (tgt.x + 150 < src.x ? tgt.x + 150 : tgt.x + 75);
      var y2 = tgt.x > src.x + 110 || tgt.x + 150 < src.x ? tgt.y + 29 : (tgt.y > src.y ? tgt.y : tgt.y + 58);
      var dx = x2 - x1;
      var cx1 = Math.round(x1 + dx * 0.45);
      var cx2 = Math.round(x1 + dx * 0.55);
      var pathD = 'M ' + x1 + ' ' + y1 + ' C ' + cx1 + ' ' + y1 + ', ' + cx2 + ' ' + y2 + ', ' + x2 + ' ' + y2;

      var isHoriz = Math.abs(y2 - y1) < 30;
      var t = isHoriz ? 0.5 : (idx % 2 === 0 ? 0.36 : 0.64);
      var mt = 1 - t;
      var mx = Math.round(mt * mt * mt * x1 + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * x2);
      var my = isHoriz
        ? Math.min(src.y, tgt.y) - 10
        : Math.round(mt * mt * mt * y1 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y2);

      return { pathD: pathD, mx: mx, my: my };
    },

    _updateLiveEdgesDOM: function() {
      if (!this._container) return;
      var nodeMap = {};
      this._nodes.forEach(function(n) { nodeMap[n.id] = n; });
      var self = this;

      this._connections.forEach(function(c, idx) {
        var src = nodeMap[c.from];
        var tgt = nodeMap[c.to];
        if (!src || !tgt) return;
        var geom = self._computeEdgeGeometry(src, tgt, idx);
        var edgeGroup = self._container.querySelector('.wb-edge[data-edge-index="' + idx + '"]');
        if (edgeGroup) {
          var paths = edgeGroup.querySelectorAll('path');
          paths.forEach(function(p) { p.setAttribute('d', geom.pathD); });
        }
        var labelGroup = self._container.querySelector('.wb-edge-label[data-edge-label-index="' + idx + '"]');
        if (labelGroup) {
          var rect = labelGroup.querySelector('rect');
          var txt = labelGroup.querySelector('text');
          if (rect) {
            var w = Number(rect.getAttribute('width')) || 56;
            rect.setAttribute('x', Math.round(geom.mx - w / 2));
            rect.setAttribute('y', geom.my - 9);
          }
          if (txt) {
            txt.setAttribute('x', geom.mx);
            txt.setAttribute('y', geom.my + 2);
          }
        }
      });
    },

    // ── Rendering ──────────────────────────────────────────────
    render: function() {
      if (!this._container) return;
      this._ensureInitialized();
      var data = this._getData();
      var blocks = data.buildingBlocks || [];
      var bps = data.blueprints || [];
      var cap = typeof data.calculateCapacity === 'function' ? data.calculateCapacity(this._inputs, this._nodes, this._connections) : { bottlenecks: [] };
      this._simMetrics = cap;
      var activeBoard = this._getActiveBoard();

      var self = this;

      // 1. Multi-Board Tab Bar
      var tabsHtml = this._boards.map(function(b) {
        var isActive = b.id === self._activeBoardId;
        var nodeCount = (b.nodes || []).length;
        return (
          '<div class="wb-tab ' + (isActive ? 'active' : '') + '" data-wb-tab="' + escapeHtml(b.id) + '" title="Switch to ' + escapeHtml(b.title) + ' (Double-click to rename)">' +
            '<span class="wb-tab__dot"></span>' +
            '<span class="wb-tab__title">' + escapeHtml(b.title) + '</span>' +
            '<span class="wb-tab__count">' + nodeCount + '</span>' +
            '<button class="wb-tab__close" data-wb-tab-close="' + escapeHtml(b.id) + '" title="Close board tab" aria-label="Close board tab">×</button>' +
          '</div>'
        );
      }).join('');

      // 2. Reference Blueprints Bar
      var bpButtonsHtml = bps.map(function(bp) {
        var shortName = bp.title.split(' (')[0];
        var isCurrent = self._activeBlueprintId === bp.id;
        return (
          '<div class="wb-bp-pill-group">' +
            '<button class="eco-filter-pill ' + (isCurrent ? 'active' : '') + '" data-load-blueprint="' + escapeHtml(bp.id) + '" title="Load ' + escapeHtml(bp.title) + ' into current tab">' +
              escapeHtml(shortName) +
            '</button>' +
            '<button class="wb-bp-newtab-btn" data-open-blueprint-tab="' + escapeHtml(bp.id) + '" title="Open ' + escapeHtml(shortName) + ' in a new board tab">+</button>' +
          '</div>'
        );
      }).join('');

      // 3. Left Palette (Draggable + Clickable)
      var paletteHtml = blocks.map(function(b) {
        return (
          '<button class="sandbox-block-btn" draggable="true" data-add-block="' + escapeHtml(b.type) + '" title="Click or drag onto canvas: ' + escapeHtml(b.description) + '">' +
            '<span class="block-color-dot" style="background:' + escapeHtml(b.color) + '"></span>' +
            '<div class="block-btn-info">' +
              '<strong>' + escapeHtml(b.label || b.name || b.type) + '</strong>' +
              '<span>' + escapeHtml(b.badge) + '</span>' +
            '</div>' +
            '<span class="block-add-plus">+</span>' +
          '</button>'
        );
      }).join('');

      // 4. Excalidraw-Style Floating Tool Dock + SVG Canvas + Right Inspector
      var floatingDockHtml = this._renderFloatingDock(activeBoard);
      var svgCanvasHtml = this._renderWhiteboardSvg(blocks);
      var inspectorHtml = this._renderInspectorPanel(blocks);
      var capacityPanelHtml = this._renderCapacityEstimator(cap);

      var solvedMap = this._getSolvedChallengesMap();
      var challengesList = this._getChallengesList();
      var solvedCount = challengesList.filter(function(c) { return Boolean(solvedMap[c.id]); }).length;

      var activeMode = this._activeWorkbenchMode;
      var modeTab = function(mode, label, extra) {
        var isActive = activeMode === mode;
        return '<button type="button" role="tab" aria-selected="' + isActive + '" class="studio-tabs__tab' + (isActive ? ' is-active' : '') + '" data-workbench-mode="' + mode + '">' +
          label + (extra ? '<span class="studio-tabs__count">' + extra + '</span>' : '') +
        '</button>';
      };
      var modeSwitcherHtml =
        '<div class="studio-tabs wb-mode-switcher" role="tablist" aria-label="Studio mode">' +
          modeTab('sql-studio', 'Playground') +
          modeTab('sql-challenges', 'Challenges', solvedCount + '/' + (challengesList.length || 12)) +
          modeTab('architecture-canvas', 'Architecture') +
        '</div>';
      var isMacPlatform = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
      var runKbdHtml = '<kbd class="studio-kbd">' + (isMacPlatform ? '⌘' : 'Ctrl') + '↵</kbd>';
      var sidebarCollapsed = Boolean(this._sidebarCollapsed);
      var sidebarToggleBtnHtml =
        '<button type="button" class="studio-icon-btn studio-sidebar-toggle' + (sidebarCollapsed ? ' is-collapsed' : '') + '" data-sql-studio-action="toggle-sidebar" aria-expanded="' + (!sidebarCollapsed) + '" aria-label="Toggle side panel" title="Toggle Explorer (' + (isMacPlatform ? '⌘B' : 'Ctrl+B') + ')">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>' +
        '</button>';
      var sqlFileIconSvg = '<svg class="studio-file-tab__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>';
      var dotsIconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="19" cy="12" r="1.75"/></svg>';
      var engineSelectHtml =
        '<label class="studio-engine">' +
          '<span class="studio-engine__dot" aria-hidden="true"></span>' +
          '<select id="wb-sql-engine-select" class="studio-select studio-select--bare" aria-label="SQL engine">' +
            '<option value="postgres" ' + (this._sqlStudioEngine === 'postgres' ? 'selected' : '') + '>PostgreSQL 18</option>' +
            '<option value="sqlite" ' + (this._sqlStudioEngine === 'sqlite' ? 'selected' : '') + '>SQLite 3.46</option>' +
          '</select>' +
        '</label>';
      var splitterHtml =
        '<div class="studio-splitter" role="separator" aria-orientation="horizontal" aria-label="Resize editor and results" tabindex="0" title="Drag to resize · double-click to reset"></div>';

      if (this._activeWorkbenchMode === 'sql-challenges') {
        if (challengesList.length === 0 && root.Lazy && typeof root.Lazy.load === 'function') {
          this._container.innerHTML = '<div class="view-canvas sandbox-view"><p style="padding:2rem;color:var(--fg-muted);">Loading SQL Challenges…</p></div>';
          root.Lazy.load('data/challenges.js').then(function() { self.render(); });
          return;
        }
        var activeChal = challengesList.find(function(c) { return c.id === self._activeChallengeId; }) || challengesList[0] || {
          id: 'fallback',
          title: 'Filter Completed High-Value Orders',
          subtitle: 'Return completed orders over $500 sorted by amount descending.',
          difficulty: 'easy',
          category: 'Filtering & Sorting',
          invariants: ['Filter status = \'completed\' and total_cents >= 50000.'],
          codeFix: {
            datasetId: 'ecommerce',
            buggyCode: 'SELECT order_id, customer_id, status, total_cents\nFROM orders;',
            solutionCode: 'SELECT order_id, customer_id, status, total_cents\nFROM orders\nWHERE status = \'completed\' AND total_cents >= 50000\nORDER BY total_cents DESC;'
          }
        };
        this._activeChallengeId = activeChal.id;
        var cf = activeChal.codeFix || {};
        var chalDs = cf.datasetId || 'ecommerce';
        var draftSql = this._challengeDrafts[activeChal.id] !== undefined
          ? this._challengeDrafts[activeChal.id]
          : (cf.buggyCode || cf.solutionCode || '');
        var isSolved = Boolean(solvedMap[activeChal.id]);
        var hintsHtml = Array.isArray(activeChal.invariants) && activeChal.invariants.length > 0
          ? '<ul class="studio-hints__list">' +
              activeChal.invariants.map(function(h) { return '<li>' + escapeHtml(h) + '</li>'; }).join('') +
            '</ul>'
          : '<p class="studio-hints__text">' + escapeHtml(cf.summary || activeChal.summary || '') + '</p>';

        var chalLevelNames = { easy: 'Beginner', medium: 'Intermediate', hard: 'Advanced', insane: 'Expert' };
        var chalOptionsHtml = challengesList.map(function(ch, idx) {
          var doneMark = solvedMap[ch.id] ? '✓ ' : '';
          var rawDiff = String(ch.difficulty || 'medium').toLowerCase();
          var friendlyDiff = chalLevelNames[rawDiff] || ch.difficulty || 'Intermediate';
          return '<option value="' + escapeHtml(ch.id) + '" ' + (ch.id === activeChal.id ? 'selected' : '') + '>' +
            doneMark + (idx + 1) + '. ' + escapeHtml(ch.title) + ' (' + escapeHtml(friendlyDiff) + ')' +
          '</option>';
        }).join('');

        var difficultyLabel = String(activeChal.difficulty || 'medium').toLowerCase();
        var difficultyDisplay = chalLevelNames[difficultyLabel] || activeChal.difficulty || 'Intermediate';
        var chalIndex = Math.max(0, challengesList.findIndex(function(c) { return c.id === activeChal.id; }));
        var chalTotal = challengesList.length || 1;
        var solvedPct = Math.round((solvedCount / chalTotal) * 100);
        this._container.innerHTML =
          '<div class="view-canvas sql-studio studio-app studio-app--challenges">' +
            '<header class="studio-toolbar">' +
              '<div class="studio-toolbar__group">' +
                sidebarToggleBtnHtml +
                '<h1 class="studio-title">SQL Studio</h1>' +
                modeSwitcherHtml +
              '</div>' +
              '<div class="studio-toolbar__group studio-toolbar__group--end">' +
                engineSelectHtml +
              '</div>' +
            '</header>' +
            '<div class="studio-body studio-body--challenge' + (sidebarCollapsed ? ' is-sidebar-collapsed' : '') + '" id="sandbox-mount-target">' +
              '<aside class="studio-panel studio-brief" aria-label="Challenge brief">' +
                '<div class="studio-panel__head studio-brief__nav">' +
                  '<button type="button" class="studio-icon-btn" data-chal-action="prev" aria-label="Previous challenge" title="Previous challenge"' + (chalIndex === 0 ? ' disabled' : '') + '>‹</button>' +
                  '<select id="wb-challenge-select" aria-label="Select SQL challenge" class="studio-select studio-select--flush">' +
                    chalOptionsHtml +
                  '</select>' +
                  '<button type="button" class="studio-icon-btn" data-chal-action="next" aria-label="Next challenge" title="Next challenge"' + (chalIndex >= chalTotal - 1 ? ' disabled' : '') + '>›</button>' +
                '</div>' +
                '<div class="studio-panel__scroll studio-brief__body">' +
                  '<div class="studio-progress" title="' + solvedCount + ' of ' + chalTotal + ' challenges solved">' +
                    '<span class="studio-progress__label">Challenge ' + (chalIndex + 1) + ' of ' + chalTotal + '</span>' +
                    '<span class="studio-progress__value">' + solvedCount + ' solved</span>' +
                    '<span class="studio-progress__track"><span class="studio-progress__fill" style="width:' + solvedPct + '%"></span></span>' +
                  '</div>' +
                  '<h2 class="studio-brief__title">' + escapeHtml(cf.title || activeChal.title) + '</h2>' +
                  '<div class="studio-brief__meta">' +
                    '<span class="studio-tag studio-tag--' + escapeHtml(difficultyLabel) + '">' + escapeHtml(difficultyDisplay) + '</span>' +
                    '<span class="studio-tag">' + escapeHtml(activeChal.category || 'SQL Challenge') + '</span>' +
                    (isSolved ? '<span class="studio-tag studio-tag--solved" id="wb-chal-solved-pill">✓ Solved</span>' : '<span class="studio-tag" id="wb-chal-solved-pill">Unsolved</span>') +
                  '</div>' +
                  '<p class="studio-brief__summary">' + escapeHtml(cf.summary || activeChal.subtitle || '') + '</p>' +
                  '<div class="studio-brief__task">' +
                    '<span class="studio-label">Your task</span>' +
                    '<p>Fix the starter query in the editor so its output matches the expected result, then press <strong>Check</strong>.</p>' +
                  '</div>' +
                  '<details class="studio-hints sql-lab-hint-details">' +
                    '<summary class="studio-hints__summary">Hints</summary>' +
                    '<div class="studio-hints__body">' + hintsHtml + '</div>' +
                  '</details>' +
                  '<dl class="studio-brief__facts">' +
                    '<div><dt>Dataset</dt><dd><code>' + escapeHtml(chalDs) + '</code></dd></div>' +
                  '</dl>' +
                '</div>' +
              '</aside>' +
              '<section class="studio-work wb-sql-main">' +
                '<div class="studio-pane studio-pane--editor studio-editor">' +
                  '<div class="studio-pane__bar">' +
                    '<span class="studio-file-tab">' + sqlFileIconSvg + 'solution.sql</span>' +
                    '<div class="studio-pane__actions">' +
                      '<button type="button" class="studio-btn studio-btn--sm" data-chal-action="run-only" title="Run without checking">Run</button>' +
                      '<button type="button" class="studio-btn studio-btn--sm studio-btn--primary" data-chal-action="check">Check ' + runKbdHtml + '</button>' +
                      '<details class="wb-tools-menu studio-menu">' +
                        '<summary class="studio-icon-btn studio-menu__trigger" aria-label="Editor actions" title="More actions">' + dotsIconSvg + '</summary>' +
                        '<div class="wb-tools-popover studio-menu__panel">' +
                          '<button type="button" class="studio-menu__item" data-chal-action="format">Format SQL</button>' +
                          '<button type="button" class="studio-menu__item" data-chal-action="explain">Explain query plan</button>' +
                          '<button type="button" class="studio-menu__item" data-chal-action="share-challenge">Copy challenge link</button>' +
                          '<div class="studio-menu__sep" role="separator"></div>' +
                          '<button type="button" class="studio-menu__item" data-chal-action="reset">Reset starter query</button>' +
                          '<button type="button" class="studio-menu__item" data-chal-action="reveal">Reveal reference solution</button>' +
                        '</div>' +
                      '</details>' +
                    '</div>' +
                  '</div>' +
                  '<div class="studio-pane__editor">' +
                    '<textarea class="sql-studio-editor sql-inline-workbench__editor" id="wb-challenge-editor" aria-label="SQL challenge editor" spellcheck="false" rows="9">' + escapeHtml(draftSql) + '</textarea>' +
                  '</div>' +
                  '<div id="wb-challenge-verdict" class="studio-verdict" hidden></div>' +
                '</div>' +
                splitterHtml +
                '<div class="studio-pane studio-pane--results">' +
                  '<div id="wb-challenge-visualizer-slot" class="studio-results"></div>' +
                '</div>' +
              '</section>' +
            '</div>' +
          '</div>';
        this._initStudioSplitter();

        var chalEditor = this._container.querySelector('#wb-challenge-editor');
        var chalSlot = this._container.querySelector('#wb-challenge-visualizer-slot');
        var chalVerdict = this._container.querySelector('#wb-challenge-verdict');

        this._runChallengeCheck = function(onlyPreview, focusExplain) {
          var curVal = chalEditor ? chalEditor.value : draftSql;
          self._challengeDrafts[activeChal.id] = curVal;
          if (!root.TableVisualizer) return;
          root.TableVisualizer.mountClauseVisualizer(chalSlot, curVal, {
            datasetId: chalDs,
            ideCtrl: self._chalIdeCtrl || null,
            startAtFinal: true,
            focusExplain: Boolean(focusExplain),
            compactHeader: true
          });
          if (onlyPreview) return;
          if (chalVerdict) {
            chalVerdict.hidden = false;
            chalVerdict.className = 'studio-verdict is-checking';
            chalVerdict.textContent = 'Checking your result against the expected output…';
          }
          root.TableVisualizer.verifyQueryAgainstReference(curVal, cf.solutionCode, {
            datasetId: chalDs,
            buggyCode: cf.buggyCode
          }).then(function(vRes) {
            if (!chalVerdict) return;
            if (vRes && vRes.passed) {
              self._markChallengeSolved(activeChal.id);
              var pill = self._container ? self._container.querySelector('#wb-chal-solved-pill') : null;
              if (pill) {
                pill.className = 'studio-tag studio-tag--solved';
                pill.textContent = '✓ Solved';
              }
              chalVerdict.className = 'studio-verdict is-pass';
              chalVerdict.innerHTML =
                '<strong>✓ Solved — ' + vRes.passedCount + ' of ' + vRes.totalCount + ' checks passed</strong>' +
                '<button type="button" class="studio-btn studio-btn--ghost studio-btn--sm" data-chal-action="share-solved">Share solution</button>';
            } else {
              var failed = (vRes && vRes.checks || []).find(function(c) { return !c.passed; });
              chalVerdict.className = 'studio-verdict is-fail';
              chalVerdict.innerHTML =
                '<strong>Not yet — ' + ((vRes && vRes.passedCount) || 0) + ' of ' + ((vRes && vRes.totalCount) || 4) + ' checks passed.</strong> ' +
                '<span>' + escapeHtml(failed ? (failed.name + ' — ' + failed.detail) : 'Your output rows differ from the expected result.') + '</span>';
            }
          });
        };

        if (chalEditor && root.TableVisualizer && typeof root.TableVisualizer.enhanceTextareaToIde === 'function') {
          this._chalIdeCtrl = root.TableVisualizer.enhanceTextareaToIde(chalEditor, {
            datasetId: chalDs,
            ariaLabel: 'SQL challenge editor',
            onRun: function() { self._runChallengeCheck(false, false); }
          });
        }
        this._runChallengeCheck(true, false);
        return;
      }

      if (this._activeWorkbenchMode === 'sql-studio') {
        var templates = this._getSqlStudioTemplates();
        var templateOptionsHtml = '<option value="">Choose an example query…</option>' +
          templates.map(function(t) {
            return '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.label) + '</option>';
          }).join('');
        var examplesListHtml = templates.map(function(t) {
          return (
            '<button type="button" class="studio-example-item" data-load-sql-example="' + escapeHtml(t.id) + '" title="Open ' + escapeHtml(t.label) + ' and run">' +
              '<span class="studio-example-item__title">' + escapeHtml(t.label) + '</span>' +
              '<span class="studio-example-item__meta">' + escapeHtml(t.datasetId || 'unified') + '</span>' +
            '</button>'
          );
        }).join('');

        var activeFile = this._getActiveStudioFile();
        this._sqlStudioQuery = activeFile.content || '';
        var activeIsSql = this._isSqlExt(activeFile.ext);
        var activeIsDelim = (activeFile.ext === 'csv' || activeFile.ext === 'tsv');
        var activeIsJson = (activeFile.ext === 'json' || activeFile.ext === 'jsonl');
        var primaryRunLabel = (activeIsDelim || activeIsJson)
          ? 'Import &amp; Run'
          : (activeIsSql ? 'Run' : 'Run SQL');

        var fileTabsHtml = this._studioFiles.map(function(f) {
          var isSelected = (f.id === activeFile.id);
          return (
            '<button type="button" role="tab" id="studio-tab-' + escapeHtml(f.id) + '" aria-selected="' + isSelected + '" tabindex="' + (isSelected ? '0' : '-1') + '" class="studio-file-tab" data-studio-tab="' + escapeHtml(f.id) + '" title="' + escapeHtml(f.name) + ' · Double-click to rename">' +
              self._getFileIconSvg(f.ext) +
              '<span class="studio-file-tab__label">' + escapeHtml(f.name) + '</span>' +
              '<span class="studio-file-tab__close" data-studio-tab-close="' + escapeHtml(f.id) + '" aria-hidden="true" title="Close ' + escapeHtml(f.name) + '">×</span>' +
            '</button>'
          );
        }).join('');

        var sidebarFilesHtml = this._studioFiles.map(function(f) {
          var isSelected = (f.id === activeFile.id);
          return (
            '<div class="studio-file-row' + (isSelected ? ' is-active' : '') + '">' +
              '<button type="button" class="studio-file-row__btn" data-studio-file-select="' + escapeHtml(f.id) + '" title="' + escapeHtml(f.name) + '">' +
                self._getFileIconSvg(f.ext) +
                '<span class="studio-file-row__name">' + escapeHtml(f.name) + '</span>' +
                '<span class="studio-file-row__ext">.' + escapeHtml(f.ext) + '</span>' +
              '</button>' +
              '<button type="button" class="studio-file-row__close" data-studio-file-close="' + escapeHtml(f.id) + '" aria-label="Close ' + escapeHtml(f.name) + '" title="Close ' + escapeHtml(f.name) + '">×</button>' +
            '</div>'
          );
        }).join('');

        var extFormats = ['sql', 'psql', 'csv', 'tsv', 'json', 'txt', 'md'];
        var selectedExt = this._newFileSelectedExt || 'sql';
        var extChipsHtml = extFormats.map(function(extName) {
          var isAct = (selectedExt === extName);
          return '<button type="button" class="studio-ext-pill' + (isAct ? ' is-active' : '') + '" data-new-file-ext="' + extName + '" aria-pressed="' + isAct + '">.' + extName + '</button>';
        }).join('');
        var suggestedNewFileName = this._nextAvailableFileName(selectedExt);

        var schemaExplorerHtml = this._renderSqlStudioSchemaExplorer();
        var schemaCountLabel = this._getSchemaCountLabel();
        var isDesktopViewport = !(root.innerWidth && root.innerWidth < 860);
        var isCustomDbSelected = String(this._sqlStudioDatasetId || '').indexOf('custom:') === 0;

        var dsOption = function(value, label) {
          return '<option value="' + escapeHtml(value) + '" ' + (self._sqlStudioDatasetId === value ? 'selected' : '') + '>' + label + '</option>';
        };
        var customDbOptionsHtml = this._customDatabases.map(function(dbItem) {
          return dsOption(dbItem.id, escapeHtml(dbItem.name) + ' (custom)');
        }).join('');

        var uploadIconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
        var trashIconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';

        this._container.innerHTML =
          '<div class="view-canvas sql-studio studio-app studio-app--playground">' +
            '<header class="studio-toolbar">' +
              '<div class="studio-toolbar__group">' +
                sidebarToggleBtnHtml +
                '<h1 class="studio-title">SQL Studio</h1>' +
                modeSwitcherHtml +
              '</div>' +
              '<div class="studio-toolbar__group studio-toolbar__group--end">' +
                engineSelectHtml +
                '<button type="button" class="studio-btn studio-btn--ghost studio-btn--sm" data-sql-studio-action="reset-db" title="Reset selected database to its clean initial state">Reset DB</button>' +
              '</div>' +
            '</header>' +
            '<div class="studio-body studio-body--playground' + (sidebarCollapsed ? ' is-sidebar-collapsed' : '') + '" id="sandbox-mount-target">' +
              '<aside class="studio-panel studio-explorer wb-schema-sidebar" aria-label="Workspace and database schema">' +
                '<div class="studio-panel__head studio-explorer__head">' +
                  '<div class="studio-db-bar">' +
                    '<select id="wb-sql-dataset-select" class="studio-select studio-select--flush" aria-label="Select active database">' +
                      '<optgroup label="Workspace Databases">' +
                        dsOption('__empty__', 'Empty database (scratch)') +
                        customDbOptionsHtml +
                      '</optgroup>' +
                      '<optgroup label="Sample Datasets">' +
                        dsOption('__unified__', 'All datasets (26 Tables)') +
                        dsOption('ecommerce', 'E-commerce &amp; orders') +
                        dsOption('org_hr', 'Org hierarchy &amp; HR') +
                        dsOption('fintech_ledger', 'Fintech ledger') +
                        dsOption('saas_telemetry', 'SaaS telemetry') +
                        dsOption('social_graph', 'Social graph') +
                      '</optgroup>' +
                    '</select>' +
                    '<button type="button" class="studio-btn studio-btn--sm studio-db-add-btn" data-sql-studio-action="toggle-new-db" aria-expanded="' + Boolean(this._newDbBarOpen) + '" title="Create a new custom database">+ DB</button>' +
                    (isCustomDbSelected
                      ? '<button type="button" class="studio-icon-btn studio-db-del-btn" data-sql-studio-action="delete-custom-db" aria-label="Delete custom database" title="Delete custom database">' + trashIconSvg + '</button>'
                      : '') +
                  '</div>' +
                  '<div id="wb-new-db-bar" class="studio-inline-bar"' + (this._newDbBarOpen ? '' : ' hidden') + '>' +
                    '<label for="wb-new-db-input" class="sr-only">New database name</label>' +
                    '<input type="text" id="wb-new-db-input" class="studio-input" placeholder="Database name (e.g. analytics_db)" autocomplete="off" spellcheck="false" />' +
                    '<button type="button" class="studio-btn studio-btn--sm studio-btn--primary" data-sql-studio-action="create-db">Create</button>' +
                    '<button type="button" class="studio-icon-btn" data-sql-studio-action="cancel-new-db" aria-label="Cancel new database" title="Cancel">×</button>' +
                  '</div>' +
                  '<input type="search" id="wb-sql-schema-filter" class="studio-input studio-input--search" placeholder="Filter tables or columns…" aria-label="Filter tables or columns" autocomplete="off" spellcheck="false" value="' + escapeHtml(this._schemaFilter || '') + '" />' +
                '</div>' +
                '<div class="studio-panel__scroll studio-explorer__scroll">' +
                  '<details class="wb-schema-drawer studio-files" ' + (isDesktopViewport ? 'open' : '') + '>' +
                    '<summary class="wb-schema-drawer__summary studio-schema__summary">' +
                      '<span class="studio-label">Files</span>' +
                      '<span class="studio-schema__count">' + this._studioFiles.length + ' open</span>' +
                    '</summary>' +
                    '<div class="studio-files__actions">' +
                      '<button type="button" class="studio-btn studio-btn--sm studio-btn--ghost" data-sql-studio-action="toggle-new-file">+ New file</button>' +
                      '<button type="button" class="studio-btn studio-btn--sm studio-btn--ghost" data-sql-studio-action="upload-file">' + uploadIconSvg + ' Import</button>' +
                      '<input type="file" id="wb-studio-file-upload" accept=".sql,.psql,.ddl,.csv,.tsv,.json,.jsonl,.txt,.md" multiple hidden />' +
                    '</div>' +
                    '<div class="studio-files__list">' + sidebarFilesHtml + '</div>' +
                  '</details>' +
                  '<details class="wb-schema-drawer studio-schema" ' + (isDesktopViewport ? 'open' : '') + '>' +
                    '<summary class="wb-schema-drawer__summary studio-schema__summary">' +
                      '<span class="studio-label">Explorer</span>' +
                      '<span class="studio-schema__count">' + escapeHtml(schemaCountLabel) + '</span>' +
                      '<span class="wb-schema-drawer__chevron" aria-hidden="true"></span>' +
                    '</summary>' +
                    '<div id="wb-sql-schema-sidebar" class="studio-schema__list">' + schemaExplorerHtml + '</div>' +
                    '<p class="studio-schema__empty" hidden>No tables or columns match.</p>' +
                  '</details>' +
                  '<details class="wb-schema-drawer studio-examples">' +
                    '<summary class="wb-schema-drawer__summary studio-schema__summary">' +
                      '<span class="studio-label">Examples</span>' +
                      '<span class="studio-schema__count">' + templates.length + ' queries</span>' +
                    '</summary>' +
                    '<div class="studio-examples__body">' +
                      '<select id="wb-sql-template-select" class="studio-select" aria-label="Load an example query">' +
                        templateOptionsHtml +
                      '</select>' +
                      '<div class="studio-examples__list">' + examplesListHtml + '</div>' +
                    '</div>' +
                  '</details>' +
                '</div>' +
              '</aside>' +
              '<section class="studio-work wb-sql-main">' +
                '<div class="studio-pane studio-pane--editor studio-editor">' +
                  '<div class="studio-pane__header">' +
                    '<div class="studio-pane__bar">' +
                      '<div class="studio-tablist" role="tablist" aria-label="Open workspace files">' +
                        fileTabsHtml +
                      '</div>' +
                      '<button type="button" class="studio-icon-btn studio-tab-add" data-sql-studio-action="toggle-new-file" aria-expanded="' + Boolean(this._newFileBarOpen) + '" aria-label="New file" title="New file (+)">+</button>' +
                      '<button type="button" class="studio-icon-btn studio-tab-upload" data-sql-studio-action="upload-file" aria-label="Import file from computer" title="Open .sql, .csv, .tsv, .json, .txt, or .md file">' + uploadIconSvg + '</button>' +
                      '<div class="studio-pane__actions">' +
                        (activeIsSql
                          ? '<button type="button" class="studio-btn studio-btn--sm" data-sql-studio-action="step-clauses" title="Walk through the query one clause at a time">Step</button>'
                          : '<span class="studio-format-pill" title="Active file format">.' + escapeHtml(activeFile.ext) + '</span>') +
                        '<button type="button" class="studio-btn studio-btn--sm studio-btn--primary" data-sql-studio-action="execute" title="Execute active file">' + primaryRunLabel + ' ' + runKbdHtml + '</button>' +
                        '<details class="wb-tools-menu studio-menu">' +
                          '<summary class="studio-icon-btn studio-menu__trigger" aria-label="More actions" title="Workspace, Format, Save, History &amp; Export">' + dotsIconSvg + '</summary>' +
                          '<div class="wb-tools-popover studio-menu__panel sql-studio-saved-panel">' +
                            '<button type="button" class="studio-menu__item" data-sql-studio-action="run-all-sql">Run all .sql files in order</button>' +
                            '<button type="button" class="studio-menu__item" data-sql-studio-action="rename-file-open">Rename active file…</button>' +
                            '<button type="button" class="studio-menu__item" data-sql-studio-action="download-active-file">Download active file</button>' +
                            '<div class="studio-menu__sep" role="separator"></div>' +
                            '<button type="button" class="studio-menu__item" data-wb-ide-action="format" data-sql-ide-action="format">Format SQL</button>' +
                            '<button type="button" class="studio-menu__item" data-wb-ide-action="copy" data-sql-ide-action="copy">Copy file contents</button>' +
                            '<button type="button" class="studio-menu__item" data-wb-ide-action="share-query" data-sql-ide-action="share-query">Copy shareable query link</button>' +
                            '<button type="button" class="studio-menu__item" data-sql-studio-action="explain">Explain query plan</button>' +
                            '<div class="studio-menu__sep" role="separator"></div>' +
                            '<span class="studio-label">Saved &amp; History</span>' +
                            '<select id="wb-sql-saved-history-select" data-sql-ide-role="saved-history-select" aria-label="Saved queries and history" class="studio-select">' +
                              this._buildSavedHistoryOptionsHtml() +
                            '</select>' +
                            '<div class="studio-menu__row">' +
                              '<input type="text" id="wb-sql-save-title-input" data-sql-ide-role="save-title-input" placeholder="Save query as…" aria-label="Query title" class="studio-input" />' +
                              '<button type="button" class="studio-btn studio-btn--sm" data-wb-ide-action="save-query" data-sql-ide-action="save-query">Save</button>' +
                            '</div>' +
                            '<button type="button" class="studio-menu__item" data-wb-ide-action="delete-saved" data-sql-ide-action="delete-saved">Delete selected saved query</button>' +
                            '<div class="studio-menu__sep" role="separator"></div>' +
                            '<span class="studio-label">Export</span>' +
                            '<div class="studio-menu__row">' +
                              '<button type="button" class="studio-btn studio-btn--sm" data-wb-ide-action="export-sql" data-sql-ide-action="export-sql">.sql</button>' +
                              '<button type="button" class="studio-btn studio-btn--sm" data-wb-ide-action="export-csv" data-sql-ide-action="export-csv">.csv</button>' +
                              '<button type="button" class="studio-btn studio-btn--sm" data-wb-ide-action="export-json" data-sql-ide-action="export-json">.json</button>' +
                            '</div>' +
                          '</div>' +
                        '</details>' +
                      '</div>' +
                    '</div>' +
                    '<div id="wb-new-file-bar" class="studio-inline-bar studio-inline-bar--editor"' + (this._newFileBarOpen ? '' : ' hidden') + '>' +
                      '<label for="wb-new-file-input" class="sr-only">New file name</label>' +
                      '<input type="text" id="wb-new-file-input" class="studio-input studio-inline-bar__input" value="' + escapeHtml(suggestedNewFileName) + '" placeholder="filename.sql / .csv / .json / .txt" autocomplete="off" spellcheck="false" />' +
                      '<div class="studio-ext-group" role="group" aria-label="File format">' + extChipsHtml + '</div>' +
                      '<button type="button" class="studio-btn studio-btn--sm studio-btn--primary" data-sql-studio-action="create-file">Create</button>' +
                      '<button type="button" class="studio-btn studio-btn--sm" data-sql-studio-action="create-file-sample" title="Create pre-filled with a runnable sample">With sample</button>' +
                      '<button type="button" class="studio-icon-btn" data-sql-studio-action="cancel-new-file" aria-label="Cancel new file" title="Cancel">×</button>' +
                    '</div>' +
                    '<div id="wb-rename-file-bar" class="studio-inline-bar studio-inline-bar--editor"' + (this._renameFileBarOpen ? '' : ' hidden') + '>' +
                      '<label for="wb-rename-file-input" class="sr-only">Rename active file</label>' +
                      '<input type="text" id="wb-rename-file-input" class="studio-input studio-inline-bar__input" value="' + escapeHtml(activeFile.name) + '" autocomplete="off" spellcheck="false" />' +
                      '<button type="button" class="studio-btn studio-btn--sm studio-btn--primary" data-sql-studio-action="rename-file-save">Rename</button>' +
                      '<button type="button" class="studio-icon-btn" data-sql-studio-action="rename-file-cancel" aria-label="Cancel rename" title="Cancel">×</button>' +
                    '</div>' +
                  '</div>' +
                  '<div class="studio-pane__editor">' +
                    '<textarea class="sql-studio-editor sql-inline-workbench__editor" id="wb-sql-studio-editor" aria-label="Workspace editor (' + escapeHtml(activeFile.name) + ')" placeholder="' + (activeIsSql ? '-- Write SQL (CREATE TABLE, INSERT, SELECT…) and press Run, or open Examples in the left panel' : 'Enter ' + escapeHtml(activeFile.ext.toUpperCase()) + ' content…') + '" spellcheck="false" rows="8">' + escapeHtml(activeFile.content || '') + '</textarea>' +
                  '</div>' +
                '</div>' +
                splitterHtml +
                '<div class="studio-pane studio-pane--results">' +
                  '<div id="wb-sql-studio-visualizer-slot" class="studio-results"></div>' +
                '</div>' +
              '</section>' +
            '</div>' +
          '</div>';
        this._initStudioSplitter();
        if (this._schemaFilter) this._applySchemaFilter(this._schemaFilter);

        var topEditor = this._container.querySelector('#wb-sql-studio-editor');
        this._wbIdeCtrl = null;
        if (topEditor && activeIsSql && root.TableVisualizer && typeof root.TableVisualizer.enhanceTextareaToIde === 'function') {
          this._wbIdeCtrl = root.TableVisualizer.enhanceTextareaToIde(topEditor, {
            datasetId: this._sqlStudioDatasetId || '__empty__',
            ariaLabel: 'SQL Playground query editor (' + activeFile.name + ')',
            onRun: function() {
              self._executeActiveStudioFile({ startAtFinal: true });
            }
          });
        }

        if (this._sqlStudioDatasetId === '__empty__' || isCustomDbSelected) {
          this._refreshLiveSchemaExplorer();
        }
        this._executeActiveStudioFile({
          startAtFinal: true,
          initialMount: !activeIsSql
        });
        return;
      }

      this._container.innerHTML =
        '<div class="view-canvas sql-studio sandbox-view">' +
          '<header class="studio-toolbar">' +
            '<div class="studio-toolbar__group">' +
              '<h1 class="studio-title">SQL Studio</h1>' +
              modeSwitcherHtml +
            '</div>' +
            '<div class="studio-toolbar__group studio-toolbar__group--end">' +
              '<button type="button" class="studio-btn studio-btn--sm studio-btn--ghost" data-sandbox-action="export-svg" title="Download SVG diagram">Export SVG</button>' +
              '<button type="button" class="studio-btn studio-btn--sm studio-btn--ghost" data-sandbox-action="export-json" title="Download board JSON">Export JSON</button>' +
            '</div>' +
          '</header>' +
          '<header class="view-header view-header--compact">' +
            '<!-- Multi-Board Browser-Style Tab Bar -->' +
            '<div class="wb-tabs-bar" role="tablist" aria-label="Whiteboard Tabs">' +
              '<div class="wb-tabs-scroll">' +
                tabsHtml +
                '<button class="wb-tab-add" data-wb-tab-add="blank" title="Create a new whiteboard tab (+ New Board)">+ New Board</button>' +
                '<button class="wb-tab-action" data-sandbox-action="duplicate-board" title="Duplicate active board into a new tab">Duplicate Tab</button>' +
              '</div>' +
            '</div>' +

            '<!-- Blueprints & Quick Actions Bar -->' +
            '<div class="sandbox-blueprint-bar">' +
              '<div class="eco-filter-group">' +
                '<span class="toolbar-label">Reference Blueprints:</span>' +
                bpButtonsHtml +
              '</div>' +
              '<div class="sandbox-canvas-actions">' +
                '<button class="eco-btn eco-btn--sm eco-btn--primary" data-sandbox-action="simulate-cluster-codelab" title="Run diagnostic SQL query for active topology in SQL Studio">Query Topology in SQL Studio</button>' +
                '<button class="eco-btn eco-btn--sm ' + (this._connectMode || this._activeTool === 'connect' ? 'eco-btn--primary' : '') + '" data-sandbox-action="toggle-connect">' +
                  (this._connectMode || this._activeTool === 'connect' ? 'Connect Mode: ON' : 'Connect Nodes (C)') +
                '</button>' +
                '<button class="eco-btn eco-btn--sm" data-sandbox-action="auto-layout" title="Tidy and align nodes by tier">Auto-Layout</button>' +
                '<button class="eco-btn eco-btn--sm" data-sandbox-action="clear-canvas" title="Clear all elements on active board">Clear Canvas</button>' +
              '</div>' +
            '</div>' +
          '</header>' +

          '<div class="view-body" id="sandbox-mount-target">' +
            '<div class="sandbox-workspace">' +
              '<aside class="sandbox-palette">' +
                '<div class="sandbox-palette__header">' +
                  '<h3 class="inspector-subtitle">12 Building Blocks</h3>' +
                  '<span class="sandbox-palette__hint">Click or Drag to Canvas</span>' +
                '</div>' +
                '<div class="sandbox-palette-list">' + paletteHtml + '</div>' +
              '</aside>' +

              '<section class="sandbox-canvas-wrapper">' +
                floatingDockHtml +
                svgCanvasHtml +
                inspectorHtml +
              '</section>' +
            '</div>' +
            capacityPanelHtml +
          '</div>' +
        '</div>';
    },

    _renderFloatingDock: function(activeBoard) {
      var tool = this._connectMode ? 'connect' : this._activeTool;
      var hasSelection = Boolean(this._selectedItem || this._selectedNodeId);
      var canUndo = Boolean(activeBoard && activeBoard.history && activeBoard.history.length > 0);
      var canRedo = Boolean(activeBoard && activeBoard.future && activeBoard.future.length > 0);
      var zoomPct = Math.round(this._zoom * 100);

      return (
        '<div class="wb-floating-dock" role="toolbar" aria-label="Whiteboard Drawing Tools">' +
          '<div class="wb-dock-group">' +
            '<button class="wb-tool-btn ' + (tool === 'select' ? 'active' : '') + '" data-wb-tool="select" title="Select, Move &amp; Resize (V)">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>' +
              '<span>Select</span><kbd>V</kbd>' +
            '</button>' +
            '<button class="wb-tool-btn ' + (tool === 'pan' ? 'active' : '') + '" data-wb-tool="pan" title="Pan Canvas (H or Space+Drag)">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>' +
              '<span>Pan</span><kbd>H</kbd>' +
            '</button>' +
            '<button class="wb-tool-btn ' + (tool === 'connect' ? 'active' : '') + '" data-wb-tool="connect" title="Connect Nodes / Draw Directed Edge (C)">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' +
              '<span>Connect</span><kbd>C</kbd>' +
            '</button>' +
            '<button class="wb-tool-btn ' + (tool === 'frame' ? 'active' : '') + '" data-wb-tool="frame" title="Add VPC / Zone Boundary Frame (F)">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"/></svg>' +
              '<span>Zone Frame</span><kbd>F</kbd>' +
            '</button>' +
            '<button class="wb-tool-btn ' + (tool === 'note' ? 'active' : '') + '" data-wb-tool="note" title="Add Sticky Callout Note (T)">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
              '<span>Note</span><kbd>T</kbd>' +
            '</button>' +
            '<button class="wb-tool-btn ' + (tool === 'draw' ? 'active' : '') + '" data-wb-tool="draw" title="Freehand Sketch Ink (P)">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>' +
              '<span>Sketch</span><kbd>P</kbd>' +
            '</button>' +
          '</div>' +

          '<div class="wb-dock-divider"></div>' +

          '<div class="wb-dock-group">' +
            '<button class="wb-tool-btn" data-sandbox-action="undo" ' + (!canUndo ? 'disabled' : '') + ' title="Undo (⌘Z)">' +
              '<span>Undo</span>' +
            '</button>' +
            '<button class="wb-tool-btn" data-sandbox-action="redo" ' + (!canRedo ? 'disabled' : '') + ' title="Redo (⌘⇧Z)">' +
              '<span>Redo</span>' +
            '</button>' +
            '<button class="wb-tool-btn wb-tool-btn--danger" data-sandbox-action="delete-selected" ' + (!hasSelection ? 'disabled' : '') + ' title="Delete Selected Element (Delete / Backspace)">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
              '<span>Delete</span><kbd>⌫</kbd>' +
            '</button>' +
          '</div>' +

          '<div class="wb-dock-divider"></div>' +

          '<div class="wb-dock-group wb-dock-zoom">' +
            '<button class="wb-tool-btn" data-sandbox-action="zoom-out" title="Zoom Out">−</button>' +
            '<button class="wb-tool-btn wb-zoom-readout" data-sandbox-action="zoom-reset" title="Reset Zoom &amp; Pan">' + zoomPct + '%</button>' +
            '<button class="wb-tool-btn" data-sandbox-action="zoom-in" title="Zoom In">+</button>' +
          '</div>' +
        '</div>'
      );
    },

    _renderWhiteboardSvg: function(blocks) {
      var blockColorMap = {};
      blocks.forEach(function(b) { blockColorMap[b.type] = b.color || '#3291ff'; });

      var nodeMap = {};
      this._nodes.forEach(function(n) { nodeMap[n.id] = n; });

      var self = this;
      var sel = this._selectedItem;

      // 1. Zone Frames Layer (rendered behind nodes)
      var framesSvg = this._frames.map(function(f) {
        var isSelected = sel && sel.kind === 'frame' && sel.id === f.id;
        return (
          '<g class="wb-frame ' + (isSelected ? 'selected' : '') + '" data-wb-frame-id="' + escapeHtml(f.id) + '" transform="translate(' + f.x + ',' + f.y + ')">' +
            '<rect width="' + f.width + '" height="' + f.height + '" rx="8" fill="rgba(255,255,255,0.015)" stroke="' + (isSelected ? 'var(--fg)' : 'var(--border-strong)') + '" stroke-width="' + (isSelected ? '2' : '1.25') + '" stroke-dasharray="6 4" />' +
            '<rect x="10" y="-10" width="' + Math.max(90, Math.min(f.width - 20, f.label.length * 6.5 + 20)) + '" height="20" rx="4" fill="var(--bg)" stroke="var(--border-strong)" stroke-width="1" />' +
            '<text x="18" y="3" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="11" font-weight="600" letter-spacing="0.04em">' + escapeHtml(f.label.toUpperCase()) + '</text>' +
            '<rect class="wb-frame-resize" data-frame-resize="' + escapeHtml(f.id) + '" x="' + (f.width - 12) + '" y="' + (f.height - 12) + '" width="12" height="12" rx="2" fill="var(--border-focus)" style="cursor:nwse-resize;" />' +
          '</g>'
        );
      }).join('');

      // 2. Edges & Clickable Labels Layer
      var edgesSvg = [];
      var labelsSvg = [];
      this._connections.forEach(function(c, idx) {
        var src = nodeMap[c.from];
        var tgt = nodeMap[c.to];
        if (!src || !tgt) return;
        var geom = self._computeEdgeGeometry(src, tgt, idx);
        var isEdgeSelected = sel && sel.kind === 'edge' && Number(sel.id) === idx;
        var strokeColor = isEdgeSelected ? 'var(--fg)' : 'var(--border-focus)';
        var strokeWidth = isEdgeSelected ? '2.5' : '1.6';
        var dashAttr = c.dashed ? ' stroke-dasharray="5 4"' : '';

        edgesSvg.push(
          '<g class="wb-edge ' + (isEdgeSelected ? 'selected' : '') + '" data-edge-index="' + idx + '" style="cursor:pointer;">' +
            '<path class="wb-edge-hit" d="' + geom.pathD + '" fill="none" stroke="transparent" stroke-width="16" />' +
            '<path class="wb-edge-line" d="' + geom.pathD + '" fill="none" stroke="' + strokeColor + '" stroke-width="' + strokeWidth + '"' + dashAttr + ' marker-end="url(#wb-arrow)" />' +
          '</g>'
        );

        var labelText = c.label || (isEdgeSelected ? 'Click to edit / ⌫' : '');
        if (labelText) {
          var lblW = Math.max(52, Math.round(labelText.length * 5.7 + 16));
          labelsSvg.push(
            '<g class="wb-edge-label ' + (isEdgeSelected ? 'selected' : '') + '" data-edge-label-index="' + idx + '" data-edge-index="' + idx + '" style="cursor:pointer;">' +
              '<rect x="' + Math.round(geom.mx - lblW / 2) + '" y="' + (geom.my - 9) + '" width="' + lblW + '" height="17" rx="4" fill="var(--bg)" stroke="' + (isEdgeSelected ? 'var(--fg)' : 'var(--border-strong)') + '" stroke-width="' + (isEdgeSelected ? '1.5' : '1') + '" />' +
              '<text x="' + geom.mx + '" y="' + (geom.my + 3) + '" text-anchor="middle" fill="' + (isEdgeSelected ? 'var(--fg)' : 'var(--fg-muted)') + '" font-family="var(--font-mono)" font-size="11" font-weight="500">' + escapeHtml(labelText) + '</text>' +
            '</g>'
          );
        }
      });

      // 3. Freehand Sketches Layer
      var sketchesSvg = this._sketches.map(function(sk) {
        var isSkSelected = sel && sel.kind === 'sketch' && sel.id === sk.id;
        return (
          '<g class="wb-sketch ' + (isSkSelected ? 'selected' : '') + '" data-wb-sketch-id="' + escapeHtml(sk.id) + '" style="cursor:pointer;">' +
            '<path d="' + escapeHtml(sk.d) + '" fill="none" stroke="transparent" stroke-width="14" />' +
            '<path d="' + escapeHtml(sk.d) + '" fill="none" stroke="' + (isSkSelected ? 'var(--fg)' : 'var(--fg-muted)') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />' +
          '</g>'
        );
      }).join('');

      // 4. Sticky Notes Layer
      var notesSvg = this._notes.map(function(nt) {
        var isNoteSelected = sel && sel.kind === 'note' && sel.id === nt.id;
        var lines = String(nt.text || '').split('\n').slice(0, 4);
        var tspans = lines.map(function(line, i) {
          var trimmed = line.length > 30 ? line.slice(0, 28) + '…' : line;
          return '<tspan x="12" dy="' + (i === 0 ? 0 : 14) + '">' + escapeHtml(trimmed) + '</tspan>';
        }).join('');
        var boxH = Math.max(54, 26 + lines.length * 14);
        return (
          '<g class="wb-note ' + (isNoteSelected ? 'selected' : '') + '" data-wb-note-id="' + escapeHtml(nt.id) + '" transform="translate(' + nt.x + ',' + nt.y + ')" style="cursor:grab;">' +
            '<rect width="195" height="' + boxH + '" rx="6" fill="var(--bg-elevated)" stroke="' + (isNoteSelected ? 'var(--fg)' : 'var(--border-focus)') + '" stroke-width="' + (isNoteSelected ? '2' : '1.25') + '" />' +
            '<line x1="0" y1="6" x2="195" y2="6" stroke="var(--border-strong)" stroke-width="1" />' +
            '<text x="12" y="23" fill="var(--fg)" font-family="var(--font-mono)" font-size="11">' + tspans + '</text>' +
          '</g>'
        );
      }).join('');

      // 5. Nodes Layer (with 4-side Connection Ports & Replica Badge)
      var nodesSvg = this._nodes.map(function(n) {
        var color = blockColorMap[n.type] || '#C2410C';
        var isSelected = (sel && sel.kind === 'node' && sel.id === n.id) || self._selectedNodeId === n.id || self._connectSourceId === n.id;
        var labelShort = (n.name || n.type).length > 20 ? (n.name || n.type).slice(0, 18) + '…' : (n.name || n.type);
        var rep = n.replicas && n.replicas > 1 ? n.replicas + 'x' : '';

        return (
          '<g class="wb-node ' + (isSelected ? 'selected' : '') + '" data-wb-node-id="' + escapeHtml(n.id) + '" data-wb-node-type="' + escapeHtml(n.type) + '" transform="translate(' + n.x + ',' + n.y + ')" style="cursor:grab;">' +
            '<rect width="150" height="58" rx="6" fill="var(--surface)" stroke="' + (isSelected ? 'var(--fg)' : 'var(--border-strong)') + '" stroke-width="' + (isSelected ? '2' : '1.25') + '" />' +
            '<rect x="0" y="0" width="4" height="58" rx="2" fill="' + color + '" />' +
            '<text x="13" y="21" fill="var(--fg-faint)" font-family="var(--font-mono)" font-size="11" font-weight="600" letter-spacing="0.03em">' + escapeHtml(n.type.slice(0, 14).toUpperCase()) + '</text>' +
            (rep ? '<text x="140" y="21" text-anchor="end" fill="var(--fg-muted)" font-family="var(--font-mono)" font-size="11" font-weight="600">' + escapeHtml(rep) + '</text>' : '') +
            '<text x="13" y="42" fill="var(--fg)" font-family="var(--font-sans)" font-size="12" font-weight="600">' + escapeHtml(labelShort) + '</text>' +
            '<!-- 4-Sided Excalidraw Connection Ports -->' +
            '<circle class="wb-port" data-port-node="' + escapeHtml(n.id) + '" data-port-side="top" cx="75" cy="0" r="4.5" />' +
            '<circle class="wb-port" data-port-node="' + escapeHtml(n.id) + '" data-port-side="right" cx="150" cy="29" r="4.5" />' +
            '<circle class="wb-port" data-port-node="' + escapeHtml(n.id) + '" data-port-side="bottom" cx="75" cy="58" r="4.5" />' +
            '<circle class="wb-port" data-port-node="' + escapeHtml(n.id) + '" data-port-side="left" cx="0" cy="29" r="4.5" />' +
          '</g>'
        );
      }).join('');

      var vbW = Math.round(1250 / this._zoom);
      var vbH = Math.round(500 / this._zoom);
      var viewBoxStr = Math.round(this._panX) + ' ' + Math.round(this._panY) + ' ' + vbW + ' ' + vbH;

      return (
        '<div class="wb-canvas-surface tool--' + escapeHtml(this._activeTool) + '" id="wb-canvas-surface">' +
          '<svg class="wb-svg" id="wb-svg-canvas" viewBox="' + viewBoxStr + '" width="100%" height="500">' +
            '<defs>' +
              '<pattern id="wb-grid" width="24" height="24" patternUnits="userSpaceOnUse">' +
                '<circle cx="2" cy="2" r="1" fill="var(--border)" />' +
              '</pattern>' +
              '<marker id="wb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
                '<path d="M 0 1 L 10 5 L 0 9 z" fill="var(--fg-muted)" />' +
              '</marker>' +
            '</defs>' +
            '<rect class="wb-canvas-bg" x="-2000" y="-2000" width="6000" height="6000" fill="url(#wb-grid)" />' +
            '<g id="wb-frames-layer">' + framesSvg + '</g>' +
            '<g id="wb-edges-layer">' + edgesSvg.join('') + '</g>' +
            '<g id="wb-sketches-layer">' + sketchesSvg + '</g>' +
            '<g id="wb-notes-layer">' + notesSvg + '</g>' +
            '<g id="wb-nodes-layer">' + nodesSvg + '</g>' +
            '<g id="wb-labels-layer">' + labelsSvg.join('') + '</g>' +
            '<line id="wb-rubberband" x1="0" y1="0" x2="0" y2="0" stroke="var(--fg)" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#wb-arrow)" style="display:none;pointer-events:none;" />' +
          '</svg>' +
          '<div class="wb-canvas-statusbar">' +
            '<span>Tool: <strong>' + escapeHtml(this._connectMode ? 'CONNECT' : this._activeTool.toUpperCase()) + '</strong></span>' +
            '<span>Drag any node port (●) to connect · Click any node or edge to inspect or press <kbd>Delete</kbd> to remove</span>' +
          '</div>' +
        '</div>'
      );
    },

    _renderInspector: function(blocks) {
      return this._renderInspectorPanel(blocks);
    },

    _renderInspectorPanel: function(blocks) {
      var sel = this._selectedItem;
      if (!sel && this._selectedNodeId) {
        sel = { kind: 'node', id: this._selectedNodeId };
      }
      if (!sel) return '';

      var self = this;
      if (sel.kind === 'node') {
        var node = this._nodes.find(function(n) { return n.id === sel.id; });
        if (!node) return '';
        var blockMeta = (blocks || []).find(function(b) { return b.type === node.type; });
        var buildSlug = NODE_TYPE_TO_CODELAB[node.type] || NODE_TYPE_TO_CODELAB[String(node.type || '').toLowerCase()] || null;
        var codelabBtnHtml = buildSlug
          ? '<a href="/build/' + escapeHtml(buildSlug) + '/?lab=open&amp;mode=guided" class="eco-btn eco-btn--sm eco-btn--primary" data-codelab-slug="' + escapeHtml(buildSlug) + '" title="Open ' + escapeHtml(buildSlug) + ' implementation in SQL Studio">Inspect Internals in SQL Studio →</a>'
          : '';
        return (
          '<div class="wb-inspector-bar" id="wb-inspector-bar">' +
            '<div class="wb-inspector-bar__left">' +
              '<span class="eco-pill eco-pill--accent">' + escapeHtml(node.type) + '</span>' +
              '<label class="wb-insp-field">' +
                '<span>Label:</span>' +
                '<input type="text" class="eco-search-input wb-insp-input" data-inspect-node-name="' + escapeHtml(node.id) + '" value="' + escapeHtml(node.name) + '" />' +
              '</label>' +
              '<label class="wb-insp-field">' +
                '<span>Replicas/Shards:</span>' +
                '<input type="number" class="eco-number-input wb-insp-num" data-inspect-node-replicas="' + escapeHtml(node.id) + '" value="' + (node.replicas || node.instances || 1) + '" min="1" max="128" />' +
              '</label>' +
              (blockMeta ? '<span class="wb-insp-desc">' + escapeHtml(blockMeta.badge) + '</span>' : '') +
            '</div>' +
            '<div class="wb-inspector-bar__actions">' +
              codelabBtnHtml +
              '<button class="eco-btn eco-btn--sm" data-sandbox-action="start-connect-from-selected">Connect From Node →</button>' +
              '<button class="eco-btn eco-btn--sm wb-btn-danger" data-sandbox-action="delete-selected">Delete Node (⌫)</button>' +
            '</div>' +
          '</div>'
        );
      }

      if (sel.kind === 'edge') {
        var idx = Number(sel.id);
        var edge = this._connections[idx];
        if (!edge) return '';
        return (
          '<div class="wb-inspector-bar" id="wb-inspector-bar">' +
            '<div class="wb-inspector-bar__left">' +
              '<span class="eco-pill eco-pill--accent">Connection Edge</span>' +
              '<label class="wb-insp-field">' +
                '<span>Protocol / Label:</span>' +
                '<input type="text" class="eco-search-input wb-insp-input" data-inspect-edge-label="' + idx + '" value="' + escapeHtml(edge.label || '') + '" placeholder="e.g. gRPC, HTTPS, Kafka CDC" />' +
              '</label>' +
              '<button class="eco-btn eco-btn--sm" data-inspect-edge-dash="' + idx + '">' + (edge.dashed ? 'Style: Dashed (Async)' : 'Style: Solid (Sync)') + '</button>' +
              '<button class="eco-btn eco-btn--sm" data-inspect-edge-reverse="' + idx + '">Reverse Direction ⇄</button>' +
            '</div>' +
            '<div class="wb-inspector-bar__actions">' +
              '<button class="eco-btn eco-btn--sm wb-btn-danger" data-sandbox-action="delete-selected">Delete Connection (⌫)</button>' +
            '</div>' +
          '</div>'
        );
      }

      if (sel.kind === 'frame') {
        var frame = this._frames.find(function(f) { return f.id === sel.id; });
        if (!frame) return '';
        return (
          '<div class="wb-inspector-bar" id="wb-inspector-bar">' +
            '<div class="wb-inspector-bar__left">' +
              '<span class="eco-pill eco-pill--accent">Zone / VPC Frame</span>' +
              '<label class="wb-insp-field">' +
                '<span>Zone Title:</span>' +
                '<input type="text" class="eco-search-input wb-insp-input" data-inspect-frame-label="' + escapeHtml(frame.id) + '" value="' + escapeHtml(frame.label) + '" />' +
              '</label>' +
            '</div>' +
            '<div class="wb-inspector-bar__actions">' +
              '<button class="eco-btn eco-btn--sm wb-btn-danger" data-sandbox-action="delete-selected">Delete Zone Frame (⌫)</button>' +
            '</div>' +
          '</div>'
        );
      }

      if (sel.kind === 'note') {
        var note = this._notes.find(function(nt) { return nt.id === sel.id; });
        if (!note) return '';
        return (
          '<div class="wb-inspector-bar" id="wb-inspector-bar">' +
            '<div class="wb-inspector-bar__left">' +
              '<span class="eco-pill eco-pill--accent">Sticky Note</span>' +
              '<label class="wb-insp-field">' +
                '<span>Annotation:</span>' +
                '<input type="text" class="eco-search-input wb-insp-input" data-inspect-note-text="' + escapeHtml(note.id) + '" value="' + escapeHtml(note.text.replace(/\n/g, ' | ')) + '" />' +
              '</label>' +
            '</div>' +
            '<div class="wb-inspector-bar__actions">' +
              '<button class="eco-btn eco-btn--sm wb-btn-danger" data-sandbox-action="delete-selected">Delete Note (⌫)</button>' +
            '</div>' +
          '</div>'
        );
      }

      return (
        '<div class="wb-inspector-bar" id="wb-inspector-bar">' +
          '<div class="wb-inspector-bar__left"><span class="eco-pill">Freehand Sketch Selected</span></div>' +
          '<div class="wb-inspector-bar__actions">' +
            '<button class="eco-btn eco-btn--sm wb-btn-danger" data-sandbox-action="delete-selected">Delete Sketch (⌫)</button>' +
          '</div>' +
        '</div>'
      );
    },

    _evaluateRubricAudit: function(cap) {
      cap = cap || this._simMetrics || {};
      var nodes = this._nodes || [];
      var bp = this._findBlueprint(this._activeBlueprintId);
      var targetLatencyMs = (bp && bp.targetLatencyMs) ? bp.targetLatencyMs : 150;

      // 1. No Single Points of Failure (SPOF)
      var spofTypes = [
        'pgbouncer-conn-pool', 'sql-parser-rewriter', 'buffer-pool-clock-sweep',
        'materialized-view-cache', 'cbo-join-planner', 'window-hash-agg-engine',
        'vectorized-simd-olap', 'mvcc-ssi-lock-manager', 'bplustree-covering-index',
        'gin-gist-brin-index', 'wal-aries-storage', 'outbox-cdc-streamer',
        'monotonic-window-engine', 'divide-conquer-sorter', 'graph-shortest-path-router',
        'dp-state-optimizer', 'balanced-order-tree', 'range-segment-fenwick',
        'string-automaton-index', 'priority-event-scheduler',
        'Microservice', 'SQLShard', 'NoSQLKV', 'RedisCache', 'L4LB', 'L7LB', 'APIGateway', 'service', 'db', 'cache', 'lb', 'gateway'
      ];
      var coreNodes = nodes.filter(function(n) { return spofTypes.indexOf(n.type) !== -1; });
      var spofNodes = coreNodes.filter(function(n) {
        var instances = Number(n.instances != null ? n.instances : n.replicas) || 1;
        return instances < 2;
      });
      var spofPassed = coreNodes.length > 0 && spofNodes.length === 0;

      // 2. Read Path Caching / Offload
      var readQps = Number(cap.readQps) || 0;
      var hasCacheOrCdn = nodes.some(function(n) {
        return n.type === 'buffer-pool-clock-sweep' || n.type === 'materialized-view-cache' || n.type === 'bplustree-covering-index' || n.type === 'gin-gist-brin-index' ||
          n.type === 'hash-index-robin-hood' || n.type === 'lru-lfu-eviction-tier' || n.type === 'bit-parallel-filter' ||
          n.type === 'RedisCache' || n.type === 'CDN' || n.type === 'cache' || n.type === 'cdn';
      });
      var cachePassed = readQps < 5000 || hasCacheOrCdn || nodes.length >= 3;

      // 3. Async Write / Burst Buffering
      var writeQps = Number(cap.writeQps) || 0;
      var writeUtilization = (writeQps / 40000) * 100;
      var hasQueueOrWorker = nodes.some(function(n) {
        return n.type === 'wal-aries-storage' || n.type === 'outbox-cdc-streamer' || n.type === 'pgbouncer-conn-pool' || n.type === 'mvcc-ssi-lock-manager' ||
          n.type === 'priority-event-scheduler' || n.type === 'monotonic-window-engine' ||
          n.type === 'KafkaQueue' || n.type === 'WorkerPool' || n.type === 'queue' || n.type === 'worker';
      });
      var asyncPassed = hasQueueOrWorker || writeUtilization < 80;

      // 4. Latency & Saturation SLO
      var bottlenecks = cap.bottlenecks || [];
      var overloadedCount = bottlenecks.filter(function(b) { return b.severity === 'critical'; }).length;
      var estLatency = Number(cap.avgLatencyMs) || 0;
      var sloPassed = overloadedCount === 0 && estLatency <= targetLatencyMs;

      return [
        {
          id: 'spof',
          title: 'No Single Points of Failure (SPOF)',
          passed: spofPassed,
          detail: spofPassed
            ? 'All ' + coreNodes.length + ' stateful/compute tiers run with >= 2 instances.'
            : (coreNodes.length === 0
              ? 'Add compute/storage nodes with >= 2 instances.'
              : 'Single-instance bottleneck on: ' + spofNodes.map(function(n) { return n.name || n.type; }).join(', '))
        },
        {
          id: 'read-cache',
          title: 'Read Path Caching / Offload',
          passed: cachePassed,
          detail: cachePassed
            ? (hasCacheOrCdn ? 'Redis/CDN tier active for ' + readQps.toLocaleString() + ' read QPS.' : 'Read QPS (' + readQps.toLocaleString() + ') below 5,000 QPS threshold.')
            : 'Read QPS is ' + readQps.toLocaleString() + ' (>= 5,000) without a Cache or CDN node.'
        },
        {
          id: 'async-buffer',
          title: 'Async Write / Burst Buffering',
          passed: asyncPassed,
          detail: asyncPassed
            ? (hasQueueOrWorker ? 'Kafka / Worker pool buffers async write bursts.' : 'Write utilization (' + writeUtilization.toFixed(1) + '%) is under 80% threshold.')
            : 'Write utilization is ' + writeUtilization.toFixed(1) + '% (>= 80%) without a Queue or Worker pool.'
        },
        {
          id: 'latency-slo',
          title: 'Latency & Saturation SLO',
          passed: sloPassed,
          detail: sloPassed
            ? '0 overloaded tiers · Est. latency ' + estLatency + 'ms <= ' + targetLatencyMs + 'ms target.'
            : overloadedCount + ' critical bottleneck(s) · Est. latency ' + estLatency + 'ms (target <= ' + targetLatencyMs + 'ms).'
        }
      ];
    },

    _renderCapacityEstimator: function(cap) {
      this._simMetrics = cap;
      var inp = this._inputs;
      var bottlenecks = cap.bottlenecks || [];
      var rubricChecks = this._evaluateRubricAudit(cap);
      var passedCount = rubricChecks.filter(function(c) { return c.passed; }).length;

      var bottlenecksHtml = bottlenecks.length > 0 ? bottlenecks.map(function(b) {
        return (
          '<div class="bottleneck-alert bottleneck--' + escapeHtml(b.severity) + '">' +
            '<div class="bottleneck-header">' +
              '<span class="eco-pill ' + (b.severity === 'critical' ? 'eco-pill--danger' : 'tier--medium') + '">' + escapeHtml(b.severity.toUpperCase()) + '</span>' +
              '<strong>' + escapeHtml(b.component) + ': ' + escapeHtml(b.title) + '</strong>' +
            '</div>' +
            '<p>' + escapeHtml(b.message) + '</p>' +
          '</div>'
        );
      }).join('') : '<div class="bottleneck-alert bottleneck--healthy">✓ No architectural bottlenecks detected at current workload parameters.</div>';

      var rubricHtml = rubricChecks.map(function(chk) {
        return (
          '<div class="bottleneck-alert ' + (chk.passed ? 'bottleneck--healthy' : 'bottleneck--warning') + '" data-rubric-check="' + escapeHtml(chk.id) + '">' +
            '<div class="bottleneck-header">' +
              '<span class="eco-pill ' + (chk.passed ? 'eco-pill--accent' : 'eco-pill--danger') + '">' + (chk.passed ? 'PASS' : 'WARN') + '</span>' +
              '<strong>' + escapeHtml(chk.title) + '</strong>' +
            '</div>' +
            '<p>' + escapeHtml(chk.detail) + '</p>' +
          '</div>'
        );
      }).join('');

      return (
        '<section class="sandbox-capacity-section eco-card" id="sandbox-capacity-panel">' +
          '<h2 class="eco-card__title">Live Back-of-the-Envelope Capacity Estimator &amp; Bottleneck Analyzer</h2>' +
          '<div class="sandbox-capacity-grid">' +
            '<div class="capacity-controls-col">' +
              '<div class="cap-field">' +
                '<label for="sb-input-qps">Total Traffic (QPS)</label>' +
                '<input type="number" class="eco-number-input" id="sb-input-qps" data-sb-input="qps" value="' + inp.qps + '" min="100" step="1000" />' +
              '</div>' +
              '<div class="cap-field">' +
                '<label for="sb-input-ratio">Read : Write Ratio (N:1)</label>' +
                '<input type="number" class="eco-number-input" id="sb-input-ratio" data-sb-input="readWriteRatio" value="' + inp.readWriteRatio + '" min="1" step="5" />' +
              '</div>' +
              '<div class="cap-field">' +
                '<label for="sb-input-read-bytes">Avg Read Payload (Bytes)</label>' +
                '<input type="number" class="eco-number-input" id="sb-input-read-bytes" data-sb-input="avgReadPayloadBytes" value="' + inp.avgReadPayloadBytes + '" min="64" step="128" />' +
              '</div>' +
              '<div class="cap-field">' +
                '<label for="sb-input-write-bytes">Avg Write Payload (Bytes)</label>' +
                '<input type="number" class="eco-number-input" id="sb-input-write-bytes" data-sb-input="avgWritePayloadBytes" value="' + inp.avgWritePayloadBytes + '" min="64" step="128" />' +
              '</div>' +
              '<div class="cap-field">' +
                '<label for="sb-input-hit-rate">Cache Hit Ratio (0.0 – 0.99)</label>' +
                '<input type="number" class="eco-number-input" id="sb-input-hit-rate" data-sb-input="cacheHitRate" value="' + inp.cacheHitRate + '" min="0" max="0.99" step="0.05" />' +
              '</div>' +
              '<div class="cap-field">' +
                '<label for="sb-input-retention">Retention (Days) / Replication (' + inp.replicationFactor + 'x)</label>' +
                '<input type="number" class="eco-number-input" id="sb-input-retention" data-sb-input="storageRetentionDays" value="' + inp.storageRetentionDays + '" min="1" step="30" />' +
              '</div>' +
            '</div>' +

            '<div class="capacity-metrics-col">' +
              '<div class="eco-grid eco-grid--3 cap-kpi-grid">' +
                '<div class="telemetry-kpi"><span>Read / Write QPS</span><strong id="sb-out-rw-qps">' + (cap.readQps || 0).toLocaleString() + ' / ' + (cap.writeQps || 0).toLocaleString() + '</strong></div>' +
                '<div class="telemetry-kpi"><span>Origin DB QPS</span><strong id="sb-out-db-qps">' + (cap.dbTotalQps || 0).toLocaleString() + ' QPS</strong></div>' +
                '<div class="telemetry-kpi"><span>Cache Offload</span><strong id="sb-out-cache-qps">' + (cap.cacheHitQps || 0).toLocaleString() + ' QPS</strong></div>' +
                '<div class="telemetry-kpi"><span>Network Egress / Ingress</span><strong id="sb-out-bandwidth">' + (cap.egressMbps || 0) + ' / ' + (cap.ingressMbps || 0) + ' Mbps</strong></div>' +
                '<div class="telemetry-kpi"><span>Daily Replicated Storage</span><strong id="sb-out-daily-storage">' + (cap.dailyStorageGb || 0) + ' GB/day</strong></div>' +
                '<div class="telemetry-kpi"><span>Total Retained Storage</span><strong id="sb-out-total-storage">' + (cap.totalStorageTb || 0) + ' TB</strong></div>' +
              '</div>' +
              '<div class="bottlenecks-box" id="sb-bottlenecks-list">' +
                '<h4>Real-Time Bottleneck &amp; Failure Mode Detection</h4>' +
                bottlenecksHtml +
              '</div>' +
              '<div class="bottlenecks-box" id="sb-rubric-audit">' +
                '<h4>Architecture Rubric Audit (' + passedCount + '/' + rubricChecks.length + ' Checks Passed)</h4>' +
                '<div class="eco-grid eco-grid--2">' +
                  rubricHtml +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>'
      );
    },

    // ── Event Binding with AbortController ─────────────────────
    _bindEvents: function() {
      var self = this;
      var container = this._container;
      if (!container) return;
      if (this._abortController) this._abortController.abort();
      this._abortController = new AbortController();
      var sig = { signal: this._abortController.signal };

      // 1. Click delegation
      container.addEventListener('click', function(e) {
        if (self._hasDragged) {
          self._hasDragged = false;
          return;
        }

        // Auto-close open overflow menus when clicking outside them
        var openMenus = container.querySelectorAll('details.studio-menu[open]');
        if (openMenus.length > 0) {
          var insideMenu = e.target.closest('details.studio-menu');
          openMenus.forEach(function(m) {
            if (m !== insideMenu) m.removeAttribute('open');
          });
        }

        // Top-level Workbench Mode Switcher (SQL Studio vs Architecture Canvas)
        var modeBtn = e.target.closest('[data-workbench-mode]');
        if (modeBtn) {
          var nextMode = modeBtn.getAttribute('data-workbench-mode');
          if (nextMode && nextMode !== self._activeWorkbenchMode) {
            var ed = container.querySelector('#wb-sql-studio-editor');
            if (ed && ed.value.trim()) self._sqlStudioQuery = ed.value;
            self._activeWorkbenchMode = nextMode;
            self.render();
          }
          return;
        }

        // Schema Explorer table insert button -> insert table name at cursor
        var insertTblEl = e.target.closest('[data-insert-table]');
        if (insertTblEl) {
          e.stopPropagation();
          var tNameInsert = insertTblEl.getAttribute('data-insert-table');
          var edTblTa = container.querySelector('#wb-sql-studio-editor');
          if (tNameInsert && edTblTa && root.TableVisualizer && typeof root.TableVisualizer.insertSqlSnippet === 'function') {
            root.TableVisualizer.insertSqlSnippet(edTblTa, tNameInsert);
            self._sqlStudioQuery = edTblTa.value;
          }
          return;
        }

        // SQL Challenges mode actions
        var chalActBtn = e.target.closest('[data-chal-action]');
        if (chalActBtn) {
          var cAct = chalActBtn.getAttribute('data-chal-action');
          var cEd = container.querySelector('#wb-challenge-editor');
          var activeCh = self._getChallengesList().find(function(c) { return c.id === self._activeChallengeId; });
          var cfObj = (activeCh && activeCh.codeFix) || {};
          if (cAct === 'prev' || cAct === 'next') {
            var chList = self._getChallengesList();
            var curIdx = chList.findIndex(function(c) { return c.id === self._activeChallengeId; });
            var nextCh = chList[curIdx + (cAct === 'next' ? 1 : -1)];
            if (nextCh) {
              if (cEd) self._challengeDrafts[self._activeChallengeId] = cEd.value;
              self._activeChallengeId = nextCh.id;
              self.render();
            }
          } else if (cAct === 'check' && typeof self._runChallengeCheck === 'function') {
            self._runChallengeCheck(false, false);
          } else if (cAct === 'run-only' && typeof self._runChallengeCheck === 'function') {
            self._runChallengeCheck(true, false);
          } else if (cAct === 'explain' && typeof self._runChallengeCheck === 'function') {
            self._runChallengeCheck(true, true);
          } else if (cAct === 'format' && cEd && root.TableVisualizer && typeof root.TableVisualizer.formatSql === 'function') {
            cEd.value = root.TableVisualizer.formatSql(cEd.value);
            cEd.dispatchEvent(new Event('input', { bubbles: true }));
            self._challengeDrafts[self._activeChallengeId] = cEd.value;
          } else if (cAct === 'reset' && cEd) {
            cEd.value = cfObj.buggyCode || '';
            cEd.dispatchEvent(new Event('input', { bubbles: true }));
            self._challengeDrafts[self._activeChallengeId] = cEd.value;
            if (typeof self._runChallengeCheck === 'function') self._runChallengeCheck(true, false);
          } else if (cAct === 'reveal' && cEd) {
            cEd.value = cfObj.solutionCode || '';
            cEd.dispatchEvent(new Event('input', { bubbles: true }));
            self._challengeDrafts[self._activeChallengeId] = cEd.value;
            if (typeof self._runChallengeCheck === 'function') self._runChallengeCheck(true, false);
          } else if (cAct === 'share-challenge') {
            var chUrl = ((root.location && root.location.origin && root.location.origin !== 'null') ? root.location.origin : 'https://sql-in-depth.vedgupta.in') +
              '/sandbox/?mode=challenges&challenge=' + encodeURIComponent(self._activeChallengeId);
            if (root.App && typeof root.App.sharePageUrl === 'function') {
              root.App.sharePageUrl({ title: (activeCh && activeCh.title) || 'SQL Challenge', url: chUrl });
            }
          } else if (cAct === 'share-solved' && cEd && root.TableVisualizer && typeof root.TableVisualizer.shareSqlQueryLink === 'function') {
            root.TableVisualizer.shareSqlQueryLink({
              sql: cEd.value,
              datasetId: cfObj.datasetId || 'ecommerce',
              engine: self._sqlStudioEngine,
              title: 'Solved: ' + ((activeCh && activeCh.title) || 'SQL Challenge')
            }, chalActBtn);
          }
          var parentChalMenu = chalActBtn.closest('details.studio-menu');
          if (parentChalMenu) parentChalMenu.removeAttribute('open');
          return;
        }

        // Schema Explorer column click -> insert column name at cursor
        var insertColEl = e.target.closest('[data-insert-col]');
        if (insertColEl) {
          var colName = insertColEl.getAttribute('data-insert-col');
          var editorTa = container.querySelector('#wb-sql-studio-editor');
          if (colName && editorTa) {
            if (root.TableVisualizer && typeof root.TableVisualizer.insertSqlSnippet === 'function') {
              root.TableVisualizer.insertSqlSnippet(editorTa, colName);
            } else {
              var s = editorTa.selectionStart || 0;
              var endPos = editorTa.selectionEnd || 0;
              editorTa.value = editorTa.value.slice(0, s) + colName + editorTa.value.slice(endPos);
              editorTa.selectionStart = editorTa.selectionEnd = s + colName.length;
              editorTa.focus();
            }
            self._sqlStudioQuery = editorTa.value;
          }
          return;
        }

        // Studio multi-file tab close & sidebar file close
        var closeStudioFileBtn = e.target.closest('[data-studio-tab-close], [data-studio-file-close]');
        if (closeStudioFileBtn) {
          e.stopPropagation();
          var closeFid = closeStudioFileBtn.getAttribute('data-studio-tab-close') || closeStudioFileBtn.getAttribute('data-studio-file-close');
          self._closeStudioFile(closeFid);
          return;
        }

        // Studio multi-file tab switch & sidebar file select
        var selectStudioFileBtn = e.target.closest('[data-studio-tab], [data-studio-file-select]');
        if (selectStudioFileBtn) {
          var selFid = selectStudioFileBtn.getAttribute('data-studio-tab') || selectStudioFileBtn.getAttribute('data-studio-file-select');
          self._switchStudioFile(selFid);
          return;
        }

        // New file format pill selection (.sql, .psql, .csv, .tsv, .json, .txt, .md)
        var extPillBtn = e.target.closest('[data-new-file-ext]');
        if (extPillBtn) {
          var nextExt = extPillBtn.getAttribute('data-new-file-ext') || 'sql';
          self._newFileSelectedExt = nextExt;
          container.querySelectorAll('[data-new-file-ext]').forEach(function(btn) {
            var isAct = btn.getAttribute('data-new-file-ext') === nextExt;
            btn.classList.toggle('is-active', isAct);
            btn.setAttribute('aria-pressed', String(isAct));
          });
          var nfInp = container.querySelector('#wb-new-file-input');
          if (nfInp) {
            var curName = nfInp.value.trim();
            if (!curName || /^(query|data|records|notes|untitled)(_\d+)?\.[a-z0-9]+$/i.test(curName)) {
              nfInp.value = self._nextAvailableFileName(nextExt);
            } else if (/\.[a-z0-9]+$/i.test(curName)) {
              nfInp.value = curName.replace(/\.[a-z0-9]+$/i, '.' + nextExt);
            } else {
              nfInp.value = curName + '.' + nextExt;
            }
            nfInp.focus();
          }
          return;
        }

        // Sidebar Example query click -> open in active empty tab or new tab and run
        var exBtn = e.target.closest('[data-load-sql-example]');
        if (exBtn) {
          var exId = exBtn.getAttribute('data-load-sql-example');
          var foundEx = self._getSqlStudioTemplates().find(function(t) { return t.id === exId; });
          if (foundEx) {
            self._syncEditorToActiveFile();
            var targetDs = foundEx.datasetId || '__unified__';
            if (self._sqlStudioDatasetId === '__empty__' || String(self._sqlStudioDatasetId).indexOf('custom:') === 0 || (self._sqlStudioDatasetId !== '__unified__' && self._sqlStudioDatasetId !== targetDs)) {
              self._sqlStudioDatasetId = targetDs;
            }
            var curActive = self._getActiveStudioFile();
            if (self._isSqlExt(curActive.ext) && !curActive.content.trim()) {
              curActive.content = foundEx.sql;
              curActive.name = foundEx.id + '.sql';
              curActive.ext = 'sql';
              self._sqlStudioQuery = foundEx.sql;
              self._saveStudioWorkspace();
              self.render();
            } else {
              var existingExTab = self._studioFiles.find(function(f) { return f.name === foundEx.id + '.sql'; });
              if (existingExTab) {
                existingExTab.content = foundEx.sql;
                self._activeFileId = existingExTab.id;
                self._sqlStudioQuery = foundEx.sql;
                self._saveStudioWorkspace();
                self.render();
              } else {
                self._createStudioFile(foundEx.id + '.sql', false, foundEx.sql);
              }
            }
          }
          return;
        }

        // Schema Explorer table click -> preview SELECT * FROM <table> LIMIT 15;
        var previewTblBtn = e.target.closest('[data-sql-preview-table]');
        if (previewTblBtn) {
          var tblName = previewTblBtn.getAttribute('data-sql-preview-table');
          var previewDs = previewTblBtn.getAttribute('data-sql-preview-ds');
          if (previewDs && self._sqlStudioDatasetId !== '__unified__' && self._sqlStudioDatasetId !== previewDs) {
            self._sqlStudioDatasetId = previewDs;
            self._saveStudioWorkspace();
            var dsSel = container.querySelector('#wb-sql-dataset-select');
            if (dsSel) dsSel.value = previewDs;
            var sidebarEl = container.querySelector('#wb-sql-schema-sidebar');
            if (sidebarEl) sidebarEl.innerHTML = self._renderSqlStudioSchemaExplorer();
            if (self._schemaFilter) self._applySchemaFilter(self._schemaFilter);
          }
          if (tblName) {
            var previewSql = 'SELECT * FROM "' + tblName.replace(/"/g, '""') + '" LIMIT 15;';
            var curF = self._syncEditorToActiveFile();
            if (self._isSqlExt(curF.ext) && (!curF.content.trim() || /^SELECT \* FROM .* LIMIT 15;$/i.test(curF.content.trim()))) {
              curF.content = previewSql;
              self._sqlStudioQuery = previewSql;
              self._saveStudioWorkspace();
              var edEl = container.querySelector('#wb-sql-studio-editor');
              if (edEl) {
                edEl.value = previewSql;
                edEl.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
            self._mountSqlStudioVisualizer({ sqlOverride: previewSql, startAtFinal: true, skipDdlLog: true });
          }
          return;
        }

        // SQL Studio IDE & Saved/Export toolbar actions
        var wbIdeBtn = e.target.closest('[data-wb-ide-action]');
        if (wbIdeBtn) {
          var ideAct = wbIdeBtn.getAttribute('data-wb-ide-action');
          var wbEd = container.querySelector('#wb-sql-studio-editor');
          var curSql = wbEd ? wbEd.value : (self._sqlStudioQuery || '');
          if ((ideAct === 'format-sql' || ideAct === 'format') && wbEd && root.TableVisualizer && typeof root.TableVisualizer.formatSql === 'function') {
            wbEd.value = root.TableVisualizer.formatSql(wbEd.value);
            self._sqlStudioQuery = wbEd.value;
            wbEd.dispatchEvent(new Event('input', { bubbles: true }));
            self._syncEditorToActiveFile();
          } else if (ideAct === 'copy-sql' || ideAct === 'copy') {
            if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(curSql).catch(function() {});
            }
            var origLabel = wbIdeBtn.textContent;
            wbIdeBtn.textContent = '✓ Copied';
            setTimeout(function() { wbIdeBtn.textContent = origLabel; }, 1200);
          } else if (ideAct === 'share-query' && root.TableVisualizer && typeof root.TableVisualizer.shareSqlQueryLink === 'function') {
            var sharedLink = root.TableVisualizer.shareSqlQueryLink({
              sql: curSql,
              datasetId: self._sqlStudioDatasetId || '__unified__',
              engine: self._sqlStudioEngine,
              title: 'Runnable SQL Query — SQL in Depth'
            }, wbIdeBtn);
            try {
              if (root.history && typeof root.history.replaceState === 'function' && sharedLink) {
                var parsedUrl = new URL(sharedLink);
                root.history.replaceState(null, '', parsedUrl.pathname + parsedUrl.search);
              }
            } catch (e) {}
          } else if (ideAct === 'save-query' && root.TableVisualizer && typeof root.TableVisualizer.saveQuery === 'function') {
            var titleInput = container.querySelector('#wb-sql-save-title-input');
            var qTitle = (titleInput && titleInput.value && titleInput.value.trim())
              ? titleInput.value.trim()
              : ((typeof window !== 'undefined' && typeof window.prompt === 'function')
                ? window.prompt('Save SQL query as:', 'My Saved Query')
                : 'Saved Query');
            if (qTitle) {
              var savedEntry = root.TableVisualizer.saveQuery({
                title: qTitle,
                sql: curSql,
                datasetId: self._sqlStudioDatasetId || '__unified__'
              });
              if (titleInput) titleInput.value = '';
              var shSel = container.querySelector('#wb-sql-saved-history-select');
              if (shSel) {
                shSel.innerHTML = self._buildSavedHistoryOptionsHtml();
                if (savedEntry && savedEntry.id) {
                  shSel.value = 'saved:' + savedEntry.id;
                  self._lastSelectedSavedId = savedEntry.id;
                }
              }
            }
          } else if (ideAct === 'delete-saved' && root.TableVisualizer && typeof root.TableVisualizer.deleteSavedQuery === 'function') {
            var shSelDel = container.querySelector('#wb-sql-saved-history-select');
            var selValDel = shSelDel ? shSelDel.value : '';
            var delId = '';
            if (selValDel && selValDel.indexOf('saved:') === 0) {
              delId = selValDel.slice(6);
            } else if (self._lastSelectedSavedId) {
              delId = self._lastSelectedSavedId;
            } else if (typeof root.TableVisualizer.getSavedQueries === 'function') {
              var curSaved = root.TableVisualizer.getSavedQueries();
              if (curSaved && curSaved.length > 0) delId = curSaved[0].id;
            }
            if (delId) {
              root.TableVisualizer.deleteSavedQuery(delId);
              if (self._lastSelectedSavedId === delId) self._lastSelectedSavedId = null;
              if (shSelDel) {
                shSelDel.innerHTML = self._buildSavedHistoryOptionsHtml();
                shSelDel.value = '';
              }
            }
          } else if (ideAct === 'clear-history' && root.TableVisualizer && typeof root.TableVisualizer.clearQueryHistory === 'function') {
            root.TableVisualizer.clearQueryHistory();
            var shSel2 = container.querySelector('#wb-sql-saved-history-select');
            if (shSel2) shSel2.innerHTML = self._buildSavedHistoryOptionsHtml();
          } else if (ideAct === 'export-sql' && root.TableVisualizer && typeof root.TableVisualizer.exportSql === 'function') {
            var activeForExport = self._getActiveStudioFile();
            root.TableVisualizer.exportSql(curSql, activeForExport ? activeForExport.name : 'studio-query.sql');
          } else if ((ideAct === 'export-csv' || ideAct === 'export-json') && root.SQLEngine && typeof root.SQLEngine.execute === 'function') {
            Promise.resolve(root.SQLEngine.execute(curSql, { datasetId: self._sqlStudioDatasetId || '__empty__', engine: self._sqlStudioEngine })).then(function(res) {
              if (res && !res.error && root.TableVisualizer) {
                if (ideAct === 'export-csv' && typeof root.TableVisualizer.exportCsv === 'function') {
                  root.TableVisualizer.exportCsv(res.columns || [], res.rows || [], 'studio-results.csv');
                } else if (ideAct === 'export-json' && typeof root.TableVisualizer.exportJson === 'function') {
                  root.TableVisualizer.exportJson(res.columns || [], res.rows || [], 'studio-results.json');
                }
              }
            });
          }
          if (ideAct !== 'save-query' && ideAct !== 'delete-saved' && ideAct !== 'copy' && ideAct !== 'copy-sql' && ideAct !== 'share-query') {
            var parentIdeMenu = wbIdeBtn.closest('details.studio-menu');
            if (parentIdeMenu) parentIdeMenu.removeAttribute('open');
          }
          return;
        }

        // SQL Studio toolbar & workspace actions
        var sqlActBtn = e.target.closest('[data-sql-studio-action]');
        if (sqlActBtn) {
          var sqlAct = sqlActBtn.getAttribute('data-sql-studio-action');
          if (sqlAct === 'toggle-sidebar') {
            self._sidebarCollapsed = !self._sidebarCollapsed;
            var bodyEl = container.querySelector('.studio-body');
            if (bodyEl) bodyEl.classList.toggle('is-sidebar-collapsed', self._sidebarCollapsed);
            sqlActBtn.classList.toggle('is-collapsed', self._sidebarCollapsed);
            sqlActBtn.setAttribute('aria-expanded', String(!self._sidebarCollapsed));
            return;
          }
          if (sqlAct === 'toggle-new-file') {
            self._newFileBarOpen = !self._newFileBarOpen;
            self._renameFileBarOpen = false;
            var nfBar = container.querySelector('#wb-new-file-bar');
            var rfBar = container.querySelector('#wb-rename-file-bar');
            if (rfBar) rfBar.hidden = true;
            if (nfBar) {
              nfBar.hidden = !self._newFileBarOpen;
              if (self._newFileBarOpen) {
                var nfInput = container.querySelector('#wb-new-file-input');
                if (nfInput) {
                  nfInput.value = self._nextAvailableFileName(self._newFileSelectedExt || 'sql');
                  nfInput.focus();
                  var dotIdx = nfInput.value.lastIndexOf('.');
                  if (dotIdx > 0 && typeof nfInput.setSelectionRange === 'function') {
                    nfInput.setSelectionRange(0, dotIdx);
                  }
                }
              }
            }
            return;
          }
          if (sqlAct === 'cancel-new-file') {
            self._newFileBarOpen = false;
            var nfBarCancel = container.querySelector('#wb-new-file-bar');
            if (nfBarCancel) nfBarCancel.hidden = true;
            return;
          }
          if (sqlAct === 'create-file' || sqlAct === 'create-file-sample') {
            var nfInpCreate = container.querySelector('#wb-new-file-input');
            var withSample = (sqlAct === 'create-file-sample');
            var createdFile = self._createStudioFile(nfInpCreate ? nfInpCreate.value : '', withSample);
            if (withSample && createdFile && !self._isSqlExt(createdFile.ext)) {
              self._executeActiveStudioFile({ startAtFinal: true });
            }
            return;
          }
          if (sqlAct === 'upload-file') {
            var fileUploadInp = container.querySelector('#wb-studio-file-upload');
            if (fileUploadInp) fileUploadInp.click();
            return;
          }
          if (sqlAct === 'rename-file-open') {
            self._renameFileBarOpen = true;
            self._newFileBarOpen = false;
            var nfBarHide = container.querySelector('#wb-new-file-bar');
            var rfBarShow = container.querySelector('#wb-rename-file-bar');
            if (nfBarHide) nfBarHide.hidden = true;
            if (rfBarShow) {
              rfBarShow.hidden = false;
              var rfInp = container.querySelector('#wb-rename-file-input');
              if (rfInp) {
                rfInp.value = self._getActiveStudioFile().name;
                rfInp.focus();
                var rDot = rfInp.value.lastIndexOf('.');
                if (rDot > 0 && typeof rfInp.setSelectionRange === 'function') {
                  rfInp.setSelectionRange(0, rDot);
                }
              }
            }
            var parentMenuR = sqlActBtn.closest('details.studio-menu');
            if (parentMenuR) parentMenuR.removeAttribute('open');
            return;
          }
          if (sqlAct === 'rename-file-save') {
            var rfInpSave = container.querySelector('#wb-rename-file-input');
            self._renameActiveStudioFile(rfInpSave ? rfInpSave.value : '');
            return;
          }
          if (sqlAct === 'rename-file-cancel') {
            self._renameFileBarOpen = false;
            var rfBarHide = container.querySelector('#wb-rename-file-bar');
            if (rfBarHide) rfBarHide.hidden = true;
            return;
          }
          if (sqlAct === 'download-active-file') {
            var activeDl = self._syncEditorToActiveFile();
            self._triggerDownload(activeDl.content || '', activeDl.name || 'workspace.txt', 'text/plain;charset=utf-8');
            var parentMenuDl = sqlActBtn.closest('details.studio-menu');
            if (parentMenuDl) parentMenuDl.removeAttribute('open');
            return;
          }
          if (sqlAct === 'toggle-new-db') {
            self._newDbBarOpen = !self._newDbBarOpen;
            var dbBar = container.querySelector('#wb-new-db-bar');
            if (dbBar) {
              dbBar.hidden = !self._newDbBarOpen;
              sqlActBtn.setAttribute('aria-expanded', String(self._newDbBarOpen));
              if (self._newDbBarOpen) {
                var dbInp = container.querySelector('#wb-new-db-input');
                if (dbInp) dbInp.focus();
              }
            }
            return;
          }
          if (sqlAct === 'cancel-new-db') {
            self._newDbBarOpen = false;
            var dbBarCancel = container.querySelector('#wb-new-db-bar');
            if (dbBarCancel) dbBarCancel.hidden = true;
            return;
          }
          if (sqlAct === 'create-db') {
            var dbInpCreate = container.querySelector('#wb-new-db-input');
            self._createCustomDatabase(dbInpCreate ? dbInpCreate.value : '');
            return;
          }
          if (sqlAct === 'delete-custom-db') {
            self._deleteCustomDatabase(self._sqlStudioDatasetId);
            return;
          }
          if (sqlAct === 'starter-create-table') {
            var curFStarter = self._syncEditorToActiveFile();
            var sampleSql = self._getSampleContentForExt('sql', 'projects.sql');
            if (self._isSqlExt(curFStarter.ext) && !curFStarter.content.trim()) {
              curFStarter.name = 'schema.sql';
              curFStarter.ext = 'sql';
              curFStarter.content = sampleSql;
              self._sqlStudioQuery = sampleSql;
              self._saveStudioWorkspace();
              self.render();
            } else {
              self._createStudioFile('schema.sql', false, sampleSql);
            }
            return;
          }
          if (sqlAct === 'switch-sample-db') {
            self._syncEditorToActiveFile();
            self._sqlStudioDatasetId = '__unified__';
            self._liveSchemaTables = null;
            self._saveStudioWorkspace();
            self.render();
            return;
          }
          if (sqlAct === 'run-all-sql') {
            self._runAllSqlFiles();
            var parentMenuAll = sqlActBtn.closest('details.studio-menu');
            if (parentMenuAll) parentMenuAll.removeAttribute('open');
            return;
          }

          if (sqlAct === 'execute') {
            self._executeActiveStudioFile({ startAtFinal: true });
          } else if (sqlAct === 'step-clauses') {
            self._executeActiveStudioFile({ startAtFinal: false });
          } else if (sqlAct === 'explain') {
            self._executeActiveStudioFile({ startAtFinal: true, focusExplain: true, runTests: false });
          } else if (sqlAct === 'reset-db') {
            var dsToReset = self._sqlStudioDatasetId || '__empty__';
            if (dsToReset.indexOf('custom:') === 0) {
              var cDb = self._customDatabases.find(function(d) { return d.id === dsToReset; });
              if (cDb) cDb.ddlLog = [];
              self._saveStudioWorkspace();
            }
            self._liveSchemaTables = [];
            if (root.SQLEngine && typeof root.SQLEngine.resetDataset === 'function') {
              root.SQLEngine.resetDataset(dsToReset).then(function() {
                self._refreshLiveSchemaExplorer();
                self._executeActiveStudioFile({ startAtFinal: true, initialMount: !self._isSqlExt(self._getActiveStudioFile().ext) });
              });
            } else {
              self._executeActiveStudioFile({ startAtFinal: true });
            }
          }
          var parentSqlMenu = sqlActBtn.closest('details.studio-menu');
          if (parentSqlMenu) parentSqlMenu.removeAttribute('open');
          return;
        }

        // Tab close button
        var closeTabBtn = e.target.closest('[data-wb-tab-close]');
        if (closeTabBtn) {
          e.stopPropagation();
          self.closeBoardTab(closeTabBtn.getAttribute('data-wb-tab-close'));
          return;
        }

        // Tab switch
        var tabEl = e.target.closest('[data-wb-tab]');
        if (tabEl) {
          self.switchBoardTab(tabEl.getAttribute('data-wb-tab'));
          return;
        }

        // Add new board tab
        var addTabBtn = e.target.closest('[data-wb-tab-add]');
        if (addTabBtn) {
          self.createNewBoardTab(addTabBtn.getAttribute('data-wb-tab-add'));
          return;
        }

        // Open blueprint in a new tab
        var bpNewTabBtn = e.target.closest('[data-open-blueprint-tab]');
        if (bpNewTabBtn) {
          self.createNewBoardTab(bpNewTabBtn.getAttribute('data-open-blueprint-tab'));
          return;
        }

        // Load blueprint into active board
        var bpBtn = e.target.closest('[data-load-blueprint]');
        if (bpBtn) {
          var bpId = bpBtn.getAttribute('data-load-blueprint');
          var bpObj = self._findBlueprint(bpId);
          if (root.Analytics && root.Analytics.trackSandboxBlueprint) {
            root.Analytics.trackSandboxBlueprint({
              blueprintId: bpId,
              title: bpObj ? bpObj.title : bpId,
              targetQps: bpObj && bpObj.defaultInputs ? bpObj.defaultInputs.qps : 0
            });
          }
          self.loadBlueprint(bpId, true);
          return;
        }

        // Add building block from left palette
        var addBlockBtn = e.target.closest('[data-add-block]');
        if (addBlockBtn) {
          var bType = addBlockBtn.getAttribute('data-add-block');
          if (root.Analytics && root.Analytics.trackSandboxAction) {
            root.Analytics.trackSandboxAction({ action: 'add_block', details: { block_type: bType } });
          }
          self.addBlock(bType);
          return;
        }

        // Excalidraw tool dock selection
        var toolBtn = e.target.closest('[data-wb-tool]');
        if (toolBtn) {
          var chosen = toolBtn.getAttribute('data-wb-tool');
          if (chosen === 'frame') {
            self.addFrame();
            return;
          }
          if (chosen === 'note') {
            self.addStickyNote();
            return;
          }
          self._activeTool = chosen;
          self._connectMode = (chosen === 'connect');
          self._connectSourceId = null;
          self.render();
          return;
        }

        // Inspector edge toggles
        var dashEdgeBtn = e.target.closest('[data-inspect-edge-dash]');
        if (dashEdgeBtn) {
          var dIdx = Number(dashEdgeBtn.getAttribute('data-inspect-edge-dash'));
          if (self._connections[dIdx]) {
            self._pushHistory();
            self._connections[dIdx].dashed = !self._connections[dIdx].dashed;
            self._syncToActiveBoard();
            self.render();
          }
          return;
        }

        var revEdgeBtn = e.target.closest('[data-inspect-edge-reverse]');
        if (revEdgeBtn) {
          var rIdx = Number(revEdgeBtn.getAttribute('data-inspect-edge-reverse'));
          if (self._connections[rIdx]) {
            self._pushHistory();
            var tmp = self._connections[rIdx].from;
            self._connections[rIdx].from = self._connections[rIdx].to;
            self._connections[rIdx].to = tmp;
            self._syncToActiveBoard();
            self.render();
          }
          return;
        }

        // Inspect Internals in CodeLab button
        var codelabBtn = e.target.closest('[data-codelab-slug]');
        if (codelabBtn) {
          var buildSlug = codelabBtn.getAttribute('data-codelab-slug');
          if (root.Analytics && root.Analytics.trackSandboxAction) {
            root.Analytics.trackSandboxAction({ action: 'inspect_codelab', details: { build_slug: buildSlug } });
          }
          if (buildSlug && root.App && typeof root.App.navigate === 'function') {
            e.preventDefault();
            root.App.navigate('/build/' + buildSlug + '?lab=open&mode=guided');
          }
          return;
        }

        // Sandbox action buttons
        var actBtn = e.target.closest('[data-sandbox-action]');
        if (actBtn) {
          var act = actBtn.getAttribute('data-sandbox-action');
          if (root.Analytics && root.Analytics.trackSandboxAction) {
            root.Analytics.trackSandboxAction({ action: act, details: { node_count: self._nodes.length } });
          }
          if (act === 'clear-canvas') {
            self._pushHistory();
            self._nodes = [];
            self._connections = [];
            self._frames = [];
            self._notes = [];
            self._sketches = [];
            self._selectedNodeId = null;
            self._selectedItem = null;
            self._syncToActiveBoard();
            self.render();
          } else if (act === 'toggle-connect') {
            self._connectMode = !self._connectMode;
            self._activeTool = self._connectMode ? 'connect' : 'select';
            self._connectSourceId = null;
            self.render();
          } else if (act === 'start-connect-from-selected') {
            if (self._selectedNodeId) {
              self._connectMode = true;
              self._activeTool = 'connect';
              self._connectSourceId = self._selectedNodeId;
              self.render();
            }
          } else if (act === 'delete-selected') {
            self.deleteSelected();
          } else if (act === 'undo') {
            self.undo();
          } else if (act === 'redo') {
            self.redo();
          } else if (act === 'auto-layout') {
            self.autoLayout();
          } else if (act === 'duplicate-board') {
            self.duplicateActiveBoardTab();
          } else if (act === 'zoom-in') {
            self._zoom = Math.min(2.0, Number((self._zoom + 0.15).toFixed(2)));
            self.render();
          } else if (act === 'zoom-out') {
            self._zoom = Math.max(0.5, Number((self._zoom - 0.15).toFixed(2)));
            self.render();
          } else if (act === 'zoom-reset') {
            self._zoom = 1;
            self._panX = 0;
            self._panY = 0;
            self.render();
          } else if (act === 'export-svg') {
            self.exportSvgOrJson('svg');
          } else if (act === 'export-json') {
            self.exportSvgOrJson('json');
          } else if (act === 'simulate-cluster-codelab') {
            self.simulateActiveBoardInCodeLab();
          }
          return;
        }

        // Clicking a Node
        var wbNode = e.target.closest('.wb-node');
        if (wbNode) {
          var nId = wbNode.getAttribute('data-wb-node-id');
          if (self._connectMode || self._activeTool === 'connect') {
            if (!self._connectSourceId) {
              self._connectSourceId = nId;
              self._selectedNodeId = nId;
              self._selectedItem = { kind: 'node', id: nId };
              self.render();
            } else if (self._connectSourceId !== nId) {
              self._pushHistory();
              self._connections.push({
                id: 'edge-' + Date.now(),
                from: self._connectSourceId,
                to: nId,
                label: 'RPC / Stream'
              });
              self._connectSourceId = null;
              self._connectMode = false;
              self._activeTool = 'select';
              self._syncToActiveBoard();
              self.render();
            }
          } else {
            self._selectedNodeId = nId;
            self._selectedItem = { kind: 'node', id: nId };
            self.render();
          }
          return;
        }

        // Clicking an Edge or Edge Label
        var wbEdge = e.target.closest('[data-edge-index]');
        if (wbEdge) {
          var edgeIndex = Number(wbEdge.getAttribute('data-edge-index'));
          self._selectedNodeId = null;
          self._selectedItem = { kind: 'edge', id: edgeIndex };
          self.render();
          return;
        }

        // Clicking a Zone Frame
        var wbFrame = e.target.closest('.wb-frame');
        if (wbFrame) {
          var fId = wbFrame.getAttribute('data-wb-frame-id');
          self._selectedNodeId = null;
          self._selectedItem = { kind: 'frame', id: fId };
          self.render();
          return;
        }

        // Clicking a Sticky Note
        var wbNote = e.target.closest('.wb-note');
        if (wbNote) {
          var noteId = wbNote.getAttribute('data-wb-note-id');
          self._selectedNodeId = null;
          self._selectedItem = { kind: 'note', id: noteId };
          self.render();
          return;
        }

        // Clicking a Freehand Sketch
        var wbSketch = e.target.closest('.wb-sketch');
        if (wbSketch) {
          var skId = wbSketch.getAttribute('data-wb-sketch-id');
          self._selectedNodeId = null;
          self._selectedItem = { kind: 'sketch', id: skId };
          self.render();
          return;
        }

        // Clicking blank SVG background deselects
        if (e.target.classList.contains('wb-canvas-bg') || e.target.id === 'wb-svg-canvas') {
          if (self._selectedItem || self._selectedNodeId) {
            self._selectedItem = null;
            self._selectedNodeId = null;
            self.render();
          }
        }
      }, sig);

      // 2. Double-click on file tab or board tab to rename inline
      container.addEventListener('dblclick', function(e) {
        var studioTabEl = e.target.closest('[data-studio-tab]');
        if (studioTabEl) {
          var fId = studioTabEl.getAttribute('data-studio-tab');
          if (fId && fId !== self._activeFileId) {
            self._switchStudioFile(fId);
          }
          self._renameFileBarOpen = true;
          self._newFileBarOpen = false;
          var nfBar = container.querySelector('#wb-new-file-bar');
          var rfBar = container.querySelector('#wb-rename-file-bar');
          if (nfBar) nfBar.hidden = true;
          if (rfBar) {
            rfBar.hidden = false;
            var rfInp = container.querySelector('#wb-rename-file-input');
            if (rfInp) {
              rfInp.value = self._getActiveStudioFile().name;
              rfInp.focus();
              var dotPos = rfInp.value.lastIndexOf('.');
              if (dotPos > 0 && typeof rfInp.setSelectionRange === 'function') {
                rfInp.setSelectionRange(0, dotPos);
              }
            }
          }
          return;
        }
        var tabEl = e.target.closest('[data-wb-tab]');
        if (tabEl) {
          var bId = tabEl.getAttribute('data-wb-tab');
          var board = self._boards.find(function(b) { return b.id === bId; });
          if (board && typeof root.prompt === 'function') {
            var nextTitle = root.prompt('Rename Architecture Board:', board.title);
            if (nextTitle && nextTitle.trim()) {
              board.title = nextTitle.trim();
              self._saveBoards();
              self.render();
            }
          }
        }
      }, sig);

      // 2b. Change & Keydown handlers for SQL Studio selects, file upload & editor
      container.addEventListener('change', function(e) {
        if (e.target.id === 'wb-studio-file-upload') {
          var files = e.target.files ? Array.prototype.slice.call(e.target.files) : [];
          if (files.length === 0) return;
          var idx = 0;
          var lastCreated = null;
          var readNext = function() {
            if (idx >= files.length) {
              e.target.value = '';
              if (lastCreated) {
                self._activeFileId = lastCreated.id;
                self._sqlStudioQuery = lastCreated.content || '';
                self._saveStudioWorkspace();
                self.render();
                if (!self._isSqlExt(lastCreated.ext)) {
                  self._executeActiveStudioFile({ startAtFinal: true });
                }
              }
              return;
            }
            var fObj = files[idx++];
            var reader = new FileReader();
            reader.onload = function() {
              var textVal = typeof reader.result === 'string' ? reader.result : '';
              var fname = fObj.name || 'imported.sql';
              var ext = self._getFileExt(fname);
              var curActive = self._getActiveStudioFile();
              if (idx === 1 && self._studioFiles.length === 1 && curActive.name === 'untitled.sql' && !curActive.content.trim()) {
                curActive.name = fname;
                curActive.ext = ext;
                curActive.content = textVal;
                lastCreated = curActive;
              } else {
                var newEntry = {
                  id: 'file_' + Date.now() + '_' + idx,
                  name: fname,
                  ext: ext,
                  content: textVal
                };
                self._studioFiles.push(newEntry);
                lastCreated = newEntry;
              }
              readNext();
            };
            reader.onerror = function() { readNext(); };
            reader.readAsText(fObj);
          };
          readNext();
          return;
        }
        if (e.target.id === 'wb-challenge-select') {
          var prevEd = container.querySelector('#wb-challenge-editor');
          if (prevEd && self._activeChallengeId) {
            self._challengeDrafts[self._activeChallengeId] = prevEd.value;
          }
          self._activeChallengeId = e.target.value;
          self.render();
          return;
        }
        if (e.target.id === 'wb-sql-engine-select') {
          self._sqlStudioEngine = e.target.value || 'postgres';
          if (self._sqlStudioEngine === 'postgres' && root.SQLEngine && typeof root.SQLEngine.isPgliteReady === 'function' && !root.SQLEngine.isPgliteReady()) {
            var activeSlot = container.querySelector('#wb-sql-studio-visualizer-slot, #wb-challenge-visualizer-slot');
            if (activeSlot) {
              activeSlot.innerHTML = '<div class="sql-viz-loading">Initializing PostgreSQL 18.6 WASM…</div>';
            }
          }
          if (root.SQLEngine && typeof root.SQLEngine.setEngineMode === 'function') {
            Promise.resolve(root.SQLEngine.setEngineMode(self._sqlStudioEngine)).then(function() {
              if (self._activeWorkbenchMode === 'sql-challenges' && typeof self._runChallengeCheck === 'function') {
                self._runChallengeCheck(true, false);
              } else {
                self._refreshLiveSchemaExplorer();
                self._executeActiveStudioFile({ startAtFinal: true, initialMount: !self._isSqlExt(self._getActiveStudioFile().ext) });
              }
            });
          } else {
            self._executeActiveStudioFile({ startAtFinal: true });
          }
          return;
        }
        if (e.target.id === 'wb-sql-dataset-select') {
          self._syncEditorToActiveFile();
          self._sqlStudioDatasetId = e.target.value || '__empty__';
          self._liveSchemaTables = null;
          self._saveStudioWorkspace();
          self.render();
          return;
        }
        if (e.target.id === 'wb-sql-template-select') {
          var tplId = e.target.value;
          if (!tplId) return;
          var tpls = self._getSqlStudioTemplates();
          var foundTpl = tpls.find(function(t) { return t.id === tplId; });
          if (foundTpl) {
            self._syncEditorToActiveFile();
            var tplDs = foundTpl.datasetId || '__unified__';
            if (self._sqlStudioDatasetId === '__empty__' || String(self._sqlStudioDatasetId).indexOf('custom:') === 0 || (self._sqlStudioDatasetId !== '__unified__' && self._sqlStudioDatasetId !== tplDs)) {
              self._sqlStudioDatasetId = tplDs;
            }
            var activeForTpl = self._getActiveStudioFile();
            if (self._isSqlExt(activeForTpl.ext) && !activeForTpl.content.trim()) {
              activeForTpl.name = foundTpl.id + '.sql';
              activeForTpl.ext = 'sql';
              activeForTpl.content = foundTpl.sql;
              self._sqlStudioQuery = foundTpl.sql;
              self._saveStudioWorkspace();
              self.render();
            } else {
              var existingTplTab = self._studioFiles.find(function(f) { return f.name === foundTpl.id + '.sql'; });
              if (existingTplTab) {
                existingTplTab.content = foundTpl.sql;
                self._activeFileId = existingTplTab.id;
                self._sqlStudioQuery = foundTpl.sql;
                self._saveStudioWorkspace();
                self.render();
              } else {
                self._createStudioFile(foundTpl.id + '.sql', false, foundTpl.sql);
              }
            }
          }
          return;
        }
        if (e.target.id === 'wb-sql-saved-history-select') {
          var selVal = e.target.value;
          if (!selVal) return;
          var pickedSql = '';
          if (selVal.indexOf('saved:') === 0 && root.TableVisualizer && typeof root.TableVisualizer.getSavedQueries === 'function') {
            var sId = selVal.slice(6);
            self._lastSelectedSavedId = sId;
            var sList = root.TableVisualizer.getSavedQueries();
            var foundS = sList.find(function(s) { return String(s.id) === String(sId); });
            if (foundS) pickedSql = foundS.sql;
          } else if ((selVal.indexOf('history:') === 0 || selVal.indexOf('hist:') === 0) && root.TableVisualizer && typeof root.TableVisualizer.getQueryHistory === 'function') {
            var hKey = selVal.indexOf('history:') === 0 ? selVal.slice(8) : selVal.slice(5);
            var hList = root.TableVisualizer.getQueryHistory();
            var foundH = hList.find(function(h) { return String(h.id) === String(hKey); });
            if (!foundH) {
              var hIdx = parseInt(hKey, 10);
              if (!isNaN(hIdx) && hList[hIdx]) foundH = hList[hIdx];
            }
            if (foundH) pickedSql = foundH.sql;
          }
          if (pickedSql) {
            var curActiveHist = self._getActiveStudioFile();
            if (!self._isSqlExt(curActiveHist.ext)) {
              self._createStudioFile('saved-query.sql', false, pickedSql);
            } else {
              curActiveHist.content = pickedSql;
              self._sqlStudioQuery = pickedSql;
              self._saveStudioWorkspace();
              var ed2 = container.querySelector('#wb-sql-studio-editor');
              if (ed2) {
                ed2.value = pickedSql;
                ed2.dispatchEvent(new Event('input', { bubbles: true }));
              }
              self._mountSqlStudioVisualizer({ startAtFinal: true });
            }
          }
          if (selVal.indexOf('saved:') !== 0) {
            e.target.value = '';
          }
          return;
        }
      }, sig);

      container.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          var openM = container.querySelectorAll('details.studio-menu[open]');
          if (openM.length > 0) {
            openM.forEach(function(m) { m.removeAttribute('open'); });
            return;
          }
          if (self._newFileBarOpen || self._renameFileBarOpen || self._newDbBarOpen) {
            self._newFileBarOpen = false;
            self._renameFileBarOpen = false;
            self._newDbBarOpen = false;
            var nfb = container.querySelector('#wb-new-file-bar');
            var rfb = container.querySelector('#wb-rename-file-bar');
            var ndb = container.querySelector('#wb-new-db-bar');
            if (nfb) nfb.hidden = true;
            if (rfb) rfb.hidden = true;
            if (ndb) ndb.hidden = true;
            return;
          }
        }
        // IME-safe Enter submit for inline New File, Rename File, and New Database inputs
        if (e.target.id === 'wb-new-file-input' && e.key === 'Enter' && !e.shiftKey) {
          if (e.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          self._createStudioFile(e.target.value, false);
          return;
        }
        if (e.target.id === 'wb-rename-file-input' && e.key === 'Enter' && !e.shiftKey) {
          if (e.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          self._renameActiveStudioFile(e.target.value);
          return;
        }
        if (e.target.id === 'wb-new-db-input' && e.key === 'Enter' && !e.shiftKey) {
          if (e.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          self._createCustomDatabase(e.target.value);
          return;
        }
        // Accessible roving tablist keyboard navigation on .studio-tablist [role="tab"]
        var focusedTab = e.target.closest && e.target.closest('.studio-tablist [role="tab"]');
        if (focusedTab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End')) {
          var tabsArr = Array.prototype.slice.call(container.querySelectorAll('.studio-tablist [role="tab"]'));
          var tIdx = tabsArr.indexOf(focusedTab);
          if (tIdx !== -1 && tabsArr.length > 1) {
            e.preventDefault();
            var nextIdx = e.key === 'Home' ? 0
              : e.key === 'End' ? tabsArr.length - 1
              : (tIdx + (e.key === 'ArrowRight' ? 1 : -1) + tabsArr.length) % tabsArr.length;
            var nextTabEl = tabsArr[nextIdx];
            if (nextTabEl) {
              var nextFid = nextTabEl.getAttribute('data-studio-tab');
              self._switchStudioFile(nextFid);
              setTimeout(function() {
                var reRenderedTab = container.querySelector('.studio-tablist [data-studio-tab="' + nextFid + '"]');
                if (reRenderedTab) reRenderedTab.focus();
              }, 0);
            }
          }
          return;
        }
        if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
          var sbBtn = container.querySelector('[data-sql-studio-action="toggle-sidebar"]');
          if (sbBtn) {
            e.preventDefault();
            sbBtn.click();
            return;
          }
        }
        if (e.target.id === 'wb-sql-studio-editor' && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          self._executeActiveStudioFile({ startAtFinal: true });
        }
      }, sig);

      // 3. Input handler for Studio editor, Inspector fields & Capacity Estimator fields
      container.addEventListener('input', function(e) {
        if (e.target.id === 'wb-sql-studio-editor') {
          var activeF = self._getActiveStudioFile();
          activeF.content = e.target.value;
          self._sqlStudioQuery = e.target.value;
          self._saveStudioWorkspace();
          return;
        }
        if (e.target.id === 'wb-sql-schema-filter') {
          self._schemaFilter = e.target.value;
          self._applySchemaFilter(e.target.value);
          return;
        }

        // Node Name edit
        var nodeNameInp = e.target.closest('[data-inspect-node-name]');
        if (nodeNameInp) {
          var nId = nodeNameInp.getAttribute('data-inspect-node-name');
          var node = self._nodes.find(function(n) { return n.id === nId; });
          if (node) {
            node.name = nodeNameInp.value;
            self._syncToActiveBoard();
            var gText = container.querySelector('.wb-node[data-wb-node-id="' + nId + '"] text:last-of-type');
            if (gText) {
              var shortStr = node.name.length > 20 ? node.name.slice(0, 18) + '…' : node.name;
              gText.textContent = shortStr;
            }
          }
          return;
        }

        // Node Replicas edit
        var nodeRepInp = e.target.closest('[data-inspect-node-replicas]');
        if (nodeRepInp) {
          var rNodeId = nodeRepInp.getAttribute('data-inspect-node-replicas');
          var rNode = self._nodes.find(function(n) { return n.id === rNodeId; });
          if (rNode) {
            var nextRep = Math.max(1, Number(nodeRepInp.value) || 1);
            rNode.replicas = nextRep;
            rNode.instances = nextRep;
            self._syncToActiveBoard();
            var data = self._getData();
            var cap = data.calculateCapacity(self._inputs, self._nodes, self._connections);
            var panel = container.querySelector('#sandbox-capacity-panel');
            if (panel) {
              var wrapper = document.createElement('div');
              wrapper.innerHTML = self._renderCapacityEstimator(cap);
              panel.replaceWith(wrapper.firstElementChild);
            }
          }
          return;
        }

        // Edge Label edit
        var edgeLblInp = e.target.closest('[data-inspect-edge-label]');
        if (edgeLblInp) {
          var eIdx = Number(edgeLblInp.getAttribute('data-inspect-edge-label'));
          if (self._connections[eIdx]) {
            self._connections[eIdx].label = edgeLblInp.value;
            self._syncToActiveBoard();
            var lblTxt = container.querySelector('.wb-edge-label[data-edge-label-index="' + eIdx + '"] text');
            if (lblTxt) lblTxt.textContent = edgeLblInp.value;
          }
          return;
        }

        // Frame Label edit
        var frameLblInp = e.target.closest('[data-inspect-frame-label]');
        if (frameLblInp) {
          var fId = frameLblInp.getAttribute('data-inspect-frame-label');
          var frame = self._frames.find(function(f) { return f.id === fId; });
          if (frame) {
            frame.label = frameLblInp.value;
            self._syncToActiveBoard();
            var fTxt = container.querySelector('.wb-frame[data-wb-frame-id="' + fId + '"] text');
            if (fTxt) fTxt.textContent = frame.label.toUpperCase();
          }
          return;
        }

        // Sticky Note edit
        var noteTxtInp = e.target.closest('[data-inspect-note-text]');
        if (noteTxtInp) {
          var ntId = noteTxtInp.getAttribute('data-inspect-note-text');
          var note = self._notes.find(function(nt) { return nt.id === ntId; });
          if (note) {
            note.text = noteTxtInp.value.split(' | ').join('\n');
            self._syncToActiveBoard();
          }
          return;
        }

        // Capacity Estimator Inputs
        var sbInp = e.target.closest('[data-sb-input]');
        if (sbInp) {
          var key = sbInp.getAttribute('data-sb-input');
          self._inputs[key] = Number(sbInp.value);
          self._syncToActiveBoard();
          var data = self._getData();
          var cap = data.calculateCapacity(self._inputs, self._nodes, self._connections);
          var panel = container.querySelector('#sandbox-capacity-panel');
          if (panel) {
            var activeId = sbInp.id;
            var wrapper = document.createElement('div');
            wrapper.innerHTML = self._renderCapacityEstimator(cap);
            panel.replaceWith(wrapper.firstElementChild);
            var restored = container.querySelector('#' + activeId);
            if (restored) restored.focus();
          }
        }
      }, sig);

      // 4. HTML5 Drag-and-Drop from Left Palette onto SVG Canvas
      container.addEventListener('dragstart', function(e) {
        var blockBtn = e.target.closest('[data-add-block]');
        if (blockBtn && e.dataTransfer) {
          e.dataTransfer.setData('text/plain', blockBtn.getAttribute('data-add-block'));
          e.dataTransfer.effectAllowed = 'copy';
        }
      }, sig);

      container.addEventListener('dragover', function(e) {
        if (e.target.closest('#wb-canvas-surface')) {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        }
      }, sig);

      container.addEventListener('drop', function(e) {
        var surface = e.target.closest('#wb-canvas-surface');
        if (!surface || !e.dataTransfer) return;
        e.preventDefault();
        var blockType = e.dataTransfer.getData('text/plain');
        if (blockType) {
          var pt = self._screenToSvg(e.clientX, e.clientY);
          self.addBlock(blockType, pt.x, pt.y);
        }
      }, sig);

      // 5. Pointer Mousedown / Dragging on SVG Canvas (Nodes, Ports, Frames, Notes, Pan, Freehand Draw)
      container.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        var svg = e.target.closest('#wb-svg-canvas');
        if (!svg) return;

        var pt = self._screenToSvg(e.clientX, e.clientY);
        self._hasDragged = false;

        // A. Port drag -> rubber-band connection
        var portEl = e.target.closest('.wb-port');
        if (portEl) {
          e.stopPropagation();
          e.preventDefault();
          var srcNodeId = portEl.getAttribute('data-port-node');
          self._interaction = {
            mode: 'port-connect',
            sourceId: srcNodeId,
            startX: pt.x,
            startY: pt.y
          };
          var rb = container.querySelector('#wb-rubberband');
          if (rb) {
            rb.setAttribute('x1', pt.x);
            rb.setAttribute('y1', pt.y);
            rb.setAttribute('x2', pt.x);
            rb.setAttribute('y2', pt.y);
            rb.style.display = 'block';
          }
          return;
        }

        // B. Freehand sketch tool
        if (self._activeTool === 'draw') {
          e.preventDefault();
          self._pushHistory();
          var skId = 'sketch-' + Date.now();
          var newSk = { id: skId, d: 'M ' + Math.round(pt.x) + ' ' + Math.round(pt.y) };
          self._sketches.push(newSk);
          self._interaction = {
            mode: 'draw',
            sketchObj: newSk
          };
          return;
        }

        // C. Pan tool
        if (self._activeTool === 'pan') {
          e.preventDefault();
          self._interaction = {
            mode: 'pan',
            startClientX: e.clientX,
            startClientY: e.clientY,
            origPanX: self._panX,
            origPanY: self._panY
          };
          return;
        }

        // D. Frame resize handle
        var resizeEl = e.target.closest('[data-frame-resize]');
        if (resizeEl) {
          e.stopPropagation();
          e.preventDefault();
          var fId = resizeEl.getAttribute('data-frame-resize');
          var frameObj = self._frames.find(function(f) { return f.id === fId; });
          if (frameObj) {
            self._pushHistory();
            self._interaction = {
              mode: 'frame-resize',
              frameObj: frameObj,
              startX: pt.x,
              startY: pt.y,
              origW: frameObj.width,
              origH: frameObj.height
            };
          }
          return;
        }

        // E. Node drag (unless in connect click mode)
        var wbNode = e.target.closest('.wb-node');
        if (wbNode && !self._connectMode && self._activeTool !== 'connect') {
          var nId = wbNode.getAttribute('data-wb-node-id');
          var nodeObj = self._nodes.find(function(n) { return n.id === nId; });
          if (nodeObj) {
            self._interaction = {
              mode: 'node-drag',
              nodeObj: nodeObj,
              startClientX: e.clientX,
              startClientY: e.clientY,
              offsetX: pt.x - nodeObj.x,
              offsetY: pt.y - nodeObj.y,
              historyPushed: false
            };
          }
          return;
        }

        // F. Sticky Note drag
        var wbNote = e.target.closest('.wb-note');
        if (wbNote) {
          var ntId = wbNote.getAttribute('data-wb-note-id');
          var noteObj = self._notes.find(function(nt) { return nt.id === ntId; });
          if (noteObj) {
            self._interaction = {
              mode: 'note-drag',
              noteObj: noteObj,
              startClientX: e.clientX,
              startClientY: e.clientY,
              offsetX: pt.x - noteObj.x,
              offsetY: pt.y - noteObj.y,
              historyPushed: false
            };
          }
          return;
        }

        // G. Zone Frame drag
        var wbFrame = e.target.closest('.wb-frame');
        if (wbFrame) {
          var frameId = wbFrame.getAttribute('data-wb-frame-id');
          var fObj = self._frames.find(function(f) { return f.id === frameId; });
          if (fObj) {
            self._interaction = {
              mode: 'frame-drag',
              frameObj: fObj,
              startClientX: e.clientX,
              startClientY: e.clientY,
              offsetX: pt.x - fObj.x,
              offsetY: pt.y - fObj.y,
              historyPushed: false
            };
          }
        }
      }, sig);

      container.addEventListener('mousemove', function(e) {
        var inter = self._interaction;
        if (!inter) return;
        var pt = self._screenToSvg(e.clientX, e.clientY);

        if (inter.mode === 'node-drag') {
          if (Math.hypot(e.clientX - inter.startClientX, e.clientY - inter.startClientY) > 3) {
            self._hasDragged = true;
            if (!inter.historyPushed) {
              self._pushHistory();
              inter.historyPushed = true;
            }
          }
          inter.nodeObj.x = Math.max(10, Math.min(1090, Math.round(pt.x - inter.offsetX)));
          inter.nodeObj.y = Math.max(10, Math.min(430, Math.round(pt.y - inter.offsetY)));
          var g = container.querySelector('.wb-node[data-wb-node-id="' + inter.nodeObj.id + '"]');
          if (g) g.setAttribute('transform', 'translate(' + inter.nodeObj.x + ',' + inter.nodeObj.y + ')');
          self._updateLiveEdgesDOM();
        } else if (inter.mode === 'port-connect') {
          self._hasDragged = true;
          var rb = container.querySelector('#wb-rubberband');
          if (rb) {
            rb.setAttribute('x2', Math.round(pt.x));
            rb.setAttribute('y2', Math.round(pt.y));
          }
        } else if (inter.mode === 'note-drag') {
          if (Math.hypot(e.clientX - inter.startClientX, e.clientY - inter.startClientY) > 3) {
            self._hasDragged = true;
            if (!inter.historyPushed) {
              self._pushHistory();
              inter.historyPushed = true;
            }
          }
          inter.noteObj.x = Math.max(10, Math.min(1040, Math.round(pt.x - inter.offsetX)));
          inter.noteObj.y = Math.max(10, Math.min(430, Math.round(pt.y - inter.offsetY)));
          var ng = container.querySelector('.wb-note[data-wb-note-id="' + inter.noteObj.id + '"]');
          if (ng) ng.setAttribute('transform', 'translate(' + inter.noteObj.x + ',' + inter.noteObj.y + ')');
        } else if (inter.mode === 'frame-drag') {
          if (Math.hypot(e.clientX - inter.startClientX, e.clientY - inter.startClientY) > 3) {
            self._hasDragged = true;
            if (!inter.historyPushed) {
              self._pushHistory();
              inter.historyPushed = true;
            }
          }
          inter.frameObj.x = Math.max(5, Math.min(1050, Math.round(pt.x - inter.offsetX)));
          inter.frameObj.y = Math.max(15, Math.min(420, Math.round(pt.y - inter.offsetY)));
          var fg = container.querySelector('.wb-frame[data-wb-frame-id="' + inter.frameObj.id + '"]');
          if (fg) fg.setAttribute('transform', 'translate(' + inter.frameObj.x + ',' + inter.frameObj.y + ')');
        } else if (inter.mode === 'frame-resize') {
          self._hasDragged = true;
          inter.frameObj.width = Math.max(120, Math.round(inter.origW + (pt.x - inter.startX)));
          inter.frameObj.height = Math.max(80, Math.round(inter.origH + (pt.y - inter.startY)));
          self.render();
        } else if (inter.mode === 'pan') {
          self._hasDragged = true;
          self._panX = inter.origPanX - (e.clientX - inter.startClientX) / self._zoom;
          self._panY = inter.origPanY - (e.clientY - inter.startClientY) / self._zoom;
          var svgEl = container.querySelector('#wb-svg-canvas');
          if (svgEl) {
            var vbW = Math.round(1250 / self._zoom);
            var vbH = Math.round(500 / self._zoom);
            svgEl.setAttribute('viewBox', Math.round(self._panX) + ' ' + Math.round(self._panY) + ' ' + vbW + ' ' + vbH);
          }
        } else if (inter.mode === 'draw') {
          self._hasDragged = true;
          inter.sketchObj.d += ' L ' + Math.round(pt.x) + ' ' + Math.round(pt.y);
          self.render();
        }
      }, sig);

      root.addEventListener('mouseup', function(e) {
        var inter = self._interaction;
        if (!inter) return;
        self._interaction = null;

        if (inter.mode === 'port-connect') {
          var rb = container.querySelector('#wb-rubberband');
          if (rb) rb.style.display = 'none';
          var targetNodeEl = e.target && e.target.closest ? e.target.closest('.wb-node') : null;
          if (targetNodeEl) {
            var targetId = targetNodeEl.getAttribute('data-wb-node-id');
            if (targetId && targetId !== inter.sourceId) {
              self._pushHistory();
              self._connections.push({
                id: 'edge-' + Date.now(),
                from: inter.sourceId,
                to: targetId,
                label: 'RPC / Stream'
              });
              self._syncToActiveBoard();
              self.render();
              return;
            }
          }
        }

        if (self._hasDragged) {
          self._syncToActiveBoard();
          self.render();
        }
      }, sig);

      // 6. Keyboard Shortcuts (Delete/Backspace, Undo/Redo, Tool Hotkeys V/H/C/F/T/P)
      root.addEventListener('keydown', function(e) {
        if (!self._container) return;
        var activeEl = document.activeElement;
        var isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
        if (isTyping) return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (self._selectedItem || self._selectedNodeId) {
            e.preventDefault();
            self.deleteSelected();
          }
          return;
        }

        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) self.redo();
          else self.undo();
          return;
        }

        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          var k = e.key.toLowerCase();
          if (k === 'v') { self._activeTool = 'select'; self._connectMode = false; self.render(); }
          else if (k === 'h') { self._activeTool = 'pan'; self._connectMode = false; self.render(); }
          else if (k === 'c') { self._activeTool = 'connect'; self._connectMode = true; self.render(); }
          else if (k === 'f') { self.addFrame(); }
          else if (k === 't') { self.addStickyNote(); }
          else if (k === 'p') { self._activeTool = 'draw'; self._connectMode = false; self.render(); }
          else if (k === 'escape') {
            self._selectedItem = null;
            self._selectedNodeId = null;
            self._connectMode = false;
            self._activeTool = 'select';
            self.render();
          }
        }
      }, sig);
    }
  };

  if (root && typeof root === 'object') {
    root.SandboxController = SandboxController;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
