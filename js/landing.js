/* ═══════════════════════════════════════════════════════════════
   Landing page (home route): split hero with live WASM SQL + EXPLAIN
   playground above the fold, flagship video explainers, interactive
   table/storage simulators, 6-track curriculum map, and 18 engine builds.
   render() returns static-safe HTML; mount(root) hydrates live interactivity.
   ═══════════════════════════════════════════════════════════════ */

window.Landing = (() => {
  const SQL_PRESETS = [
    {
      label: 'Join & Rollup',
      sql: [
        'SELECT c.name AS customer,',
        '       c.tier,',
        '       COUNT(o.order_id) AS orders,',
        '       ROUND(SUM(o.total_cents) / 100.0, 2) AS spend_usd',
        'FROM customers c',
        'JOIN orders o ON o.customer_id = c.customer_id',
        "WHERE o.status = 'completed'",
        'GROUP BY c.customer_id, c.name, c.tier',
        'ORDER BY spend_usd DESC',
        'LIMIT 5;'
      ].join('\n'),
      columns: ['customer', 'tier', 'orders', 'spend_usd'],
      rows: [
        ['Aravind Rao', 'enterprise', 2, 2000],
        ['Marcus Vance', 'enterprise', 1, 1360],
        ['Diego Morales', 'pro', 1, 840],
        ["Liam O'Connor", 'pro', 1, 585],
        ['Elena Rostova', 'pro', 1, 420]
      ],
      plan: [
        'SCAN o',
        'SEARCH c USING INTEGER PRIMARY KEY (rowid=?)',
        'USE TEMP B-TREE FOR GROUP BY'
      ]
    },
    {
      label: 'Window RANK()',
      sql: [
        'SELECT cat.name AS category,',
        '       p.name AS product,',
        '       ROUND(p.price_cents / 100.0, 2) AS price_usd,',
        '       RANK() OVER (',
        '         PARTITION BY p.category_id',
        '         ORDER BY p.price_cents DESC',
        '       ) AS rnk',
        'FROM products p',
        'JOIN categories cat ON cat.category_id = p.category_id',
        'LIMIT 5;'
      ].join('\n'),
      columns: ['category', 'product', 'price_usd', 'rnk'],
      rows: [
        ['Storage & NVMe', 'Enterprise Gen5 NVMe 4TB', 420, 1],
        ['Storage & NVMe', 'Datacenter NVMe 2TB', 210, 2],
        ['Storage & NVMe', 'LTO-9 Cold Archive Cartridge', 89, 3],
        ['Networking', 'Dual-Port 100GbE SmartNIC', 680, 1],
        ['Networking', '24-Port 10GbE L3 Switch', 540, 2]
      ],
      plan: [
        'SCAN p USING INDEX idx_products_category_price',
        'SEARCH cat USING INTEGER PRIMARY KEY (rowid=?)'
      ]
    },
    {
      label: 'Index Seek Plan',
      sql: [
        'SELECT o.order_id,',
        '       o.created_at,',
        '       ROUND(o.total_cents / 100.0, 2) AS order_usd',
        'FROM orders o',
        'WHERE o.customer_id = 1',
        'ORDER BY o.created_at DESC;'
      ].join('\n'),
      columns: ['order_id', 'created_at', 'order_usd'],
      rows: [
        [1003, '2025-02-18 11:05:00', 950],
        [1001, '2025-02-01 09:15:00', 1050]
      ],
      plan: [
        'SEARCH o USING INDEX idx_orders_customer_status (customer_id=?)',
        'USE TEMP B-TREE FOR ORDER BY'
      ]
    }
  ];

  const FLAGSHIP_LESSONS = [
    {
      slug: 'why-databases-exist',
      title: 'Why Databases Exist',
      duration: '0:54',
      module: 'Module 01',
      summary: 'Why flat files corrupt under concurrent writes, partial fsync crashes, and O(N) scans.'
    },
    {
      slug: 'select-projection-aliases',
      title: 'SELECT Projection & Logical Order',
      duration: '0:49',
      module: 'Module 03',
      summary: 'Why WHERE cannot reference a SELECT alias: tracing actual vs lexical clause execution.'
    },
    {
      slug: 'inner-join-equi-joins',
      title: 'INNER JOIN Physical Algorithms',
      duration: '0:48',
      module: 'Module 04',
      summary: 'Nested loop, hash join, and sort-merge join mechanics across page buffers.'
    },
    {
      slug: 'btree-bplustree-internal-anatomy',
      title: 'B+Tree Internal Anatomy',
      duration: '0:53',
      module: 'Module 10',
      summary: 'How 8KB internal pages fan out to millions of leaf tuples in 3 page reads.'
    },
    {
      slug: 'multi-version-concurrency-control-mvcc',
      title: 'Multi-Version Concurrency Control',
      duration: '0:51',
      module: 'Module 12',
      summary: 'How xmin/xmax snapshots isolate readers and writers without read locks.'
    }
  ];

  const DEMOS = [
    { sim: 'sim-select-where-pipeline', file: 'js/simulators-relational.js', label: 'Clause Pipeline', lesson: 'where-filtering-predicates' },
    { sim: 'sim-relational-join-matrix', file: 'js/simulators-relational.js', label: 'Relational Joins ⋈', lesson: 'left-right-full-outer-joins' },
    { sim: 'sim-window-frame-sliding', file: 'js/simulators-analytical.js', label: 'Window Frames', lesson: 'window-frames-rows-range-groups' },
    { sim: 'sim-bplustree-page-split', file: 'js/simulators-indexing.js', label: 'B+Tree Pages', lesson: 'btree-bplustree-internal-anatomy' },
    { sim: 'sim-mvcc-tuple-visibility', file: 'js/simulators-transactions.js', label: 'MVCC Snapshots', lesson: 'tuple-headers-xmin-xmax-visibility' }
  ];

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const shortTitle = t => String(t || '').replace(/\s*\(.*\)\s*$/, '');

  function encodeQueryToken(sql) {
    try {
      const json = JSON.stringify({ s: String(sql || ''), d: 'ecommerce', e: 'sqlite' });
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(json, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      const bytes = new TextEncoder().encode(json);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (_) {
      return '';
    }
  }

  function buildStudioHref(sql) {
    const token = encodeQueryToken(sql);
    return token ? `/sandbox/?q=${token}` : '/sandbox/';
  }

  function allUnits() {
    const out = [];
    for (const part of window.CURRICULUM_DATA?.parts || []) {
      for (const mod of part.modules) {
        for (const u of mod.units) out.push(u);
      }
    }
    return out;
  }

  function findUnit(slug) {
    for (const u of allUnits()) if (u.slug === slug) return u;
    return null;
  }

  function counts() {
    const c = window.SITE_COUNTS || {};
    return {
      topics: allUnits().length || 180,
      simulators: c.simulators || Object.keys(window.SIMULATORS || {}).length || 180,
      builds: Object.keys(window.IMPLEMENTATIONS_DATA || {}).length || 18,
      videos: c.videos || 18,
      questions: c.questions || 720
    };
  }

  function renderResultPreviewHtml(columns, rows, planSteps, errorMsg) {
    if (errorMsg) {
      return `<div class="landing-pg__error" role="alert"><strong>SQL Error:</strong> ${esc(errorMsg)}</div>`;
    }
    const head = (columns || []).map(col => `<th scope="col">${esc(col)}</th>`).join('');
    const body = (rows || []).slice(0, 6).map(r => (
      `<tr>${r.map(v => v === null || v === undefined ? '<td class="is-null">NULL</td>' : `<td>${esc(v)}</td>`).join('')}</tr>`
    )).join('');
    const planHtml = (planSteps && planSteps.length)
      ? `<div class="landing-pg__plan" aria-label="Query execution plan">
           <span class="landing-pg__plan-tag">EXPLAIN PLAN</span>
           <span class="landing-pg__plan-steps">${planSteps.map(p => `<code>${esc(p)}</code>`).join('<span aria-hidden="true">→</span>')}</span>
         </div>`
      : '';
    return `
      <div class="landing-pg__table-wrap">
        <table class="landing-pg__table">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      ${planHtml}`;
  }

  function renderHero(c) {
    const first = allUnits()[0];
    const preset0 = SQL_PRESETS[0];
    const studioHref = buildStudioHref(preset0.sql);

    return `
      <section class="landing-hero">
        <div class="landing-hero__grid">
          <div class="landing-hero__copy">
            <h1 class="landing-hero__title">SQL &amp; database internals, from 8KB pages to query plans.</h1>
            <p class="landing-hero__subtitle">Built for backend, data, and full-stack engineers moving past surface syntax. Step through slotted pages, B+Tree splits, MVCC snapshots, and relational joins—and run real SQLite &amp; PostgreSQL 18 in WebAssembly.</p>

            <div class="landing-resume" id="landing-resume" hidden>
              <a class="landing-resume__link" id="landing-resume-link" href="/topic/${esc(first?.slug || 'why-databases-exist')}/">
                <span class="landing-resume__label">Continue where you left off</span>
                <strong class="landing-resume__unit" id="landing-resume-title">${esc(first?.title || 'Why Databases Exist')}</strong>
                <span class="landing-resume__meta" id="landing-resume-meta">Resume →</span>
              </a>
            </div>

            <div class="landing-hero__actions">
              <a class="btn btn--primary landing-btn" id="landing-primary-cta" href="/topic/${esc(first?.slug || 'why-databases-exist')}/">Start learning →</a>
              <a class="btn btn--outline landing-btn" href="/sandbox/" data-nav="sandbox">Open SQL Studio</a>
              <button class="landing-search" type="button" data-landing-search>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Search ${c.topics} topics <kbd>⌘K</kbd>
              </button>
            </div>

            <p class="landing-hero__scope">6 engineering tracks · ${c.topics} interactive lessons · 5 flagship video explainers · ${c.builds} from-scratch engine builds · Free &amp; open source</p>
          </div>

          <div class="landing-pg" id="landing-playground" aria-label="Live in-browser SQL playground">
            <div class="landing-pg__header">
              <span class="landing-pg__engine"><span class="landing-pg__dot" aria-hidden="true"></span>SQLite WASM · ecommerce</span>
              <div class="landing-pg__presets" role="tablist" aria-label="Sample SQL queries">
                ${SQL_PRESETS.map((p, i) => `<button type="button" class="landing-pg__preset${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" data-sql-preset="${i}">${esc(p.label)}</button>`).join('')}
              </div>
            </div>

            <div class="landing-pg__editor-wrap">
              <label class="sr-only" for="landing-sql-input">Editable SQL query</label>
              <textarea id="landing-sql-input" class="landing-pg__editor" rows="8" spellcheck="false">${esc(preset0.sql)}</textarea>
            </div>

            <div class="landing-pg__toolbar">
              <button type="button" class="btn btn--primary btn--sm landing-pg__run" id="landing-sql-run">▶ Run SQL <kbd>⌘↵</kbd></button>
              <span class="landing-pg__status" id="landing-sql-meta" role="status" aria-live="polite">${preset0.rows.length} rows · Instant preview</span>
              <div class="landing-pg__links">
                <button type="button" class="landing-pg__link-btn" id="landing-sql-copy" title="Copy shareable runnable query link">Share query</button>
                <a class="landing-pg__open" id="landing-sql-open" href="${esc(studioHref)}">Full Studio ↗</a>
              </div>
            </div>

            <div class="landing-pg__output" id="landing-sql-output">
              ${renderResultPreviewHtml(preset0.columns, preset0.rows, preset0.plan, null)}
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderFlagshipVideos() {
    return `
      <section class="landing-section ds-below-fold" id="landing-videos">
        <div class="landing-section__head">
          <h2 class="landing-section__title">Visual-first flagship explainers</h2>
          <p class="landing-section__desc">Short, captioned architectural walkthroughs paired with interactive page-level simulators and runnable SQL labs.</p>
        </div>
        <div class="landing-videos">
          ${FLAGSHIP_LESSONS.map(v => `
            <a class="landing-video-card" href="/topic/${esc(v.slug)}/">
              <div class="landing-video-card__top">
                <span class="landing-video-card__mod">${esc(v.module)}</span>
                <span class="landing-video-card__dur">▶ ${esc(v.duration)} · CC</span>
              </div>
              <h3 class="landing-video-card__title">${esc(v.title)}</h3>
              <p class="landing-video-card__desc">${esc(v.summary)}</p>
            </a>`).join('')}
        </div>
      </section>`;
  }

  function renderDemos() {
    const initialHtml = typeof window.SIMULATORS?.[DEMOS[0].sim]?.render === 'function'
      ? window.SIMULATORS[DEMOS[0].sim].render()
      : '';
    return `
      <section class="landing-section ds-below-fold" id="landing-demos">
        <div class="landing-section__head">
          <h2 class="landing-section__title">Step through engine state live</h2>
          <p class="landing-section__desc">Every module replaces static prose walls with interactive relational algebra, B+Tree page split, and MVCC visibility simulators.</p>
        </div>
        <div class="landing-tabs" role="tablist" aria-label="Interactive database simulators">
          ${DEMOS.map((d, i) => `<button type="button" class="landing-tab${i ? '' : ' is-active'}" role="tab" aria-selected="${i ? 'false' : 'true'}" data-demo="${i}">${esc(d.label)}</button>`).join('')}
        </div>
        <div class="landing-demo" id="landing-demo-stage">${initialHtml}</div>
        <a class="landing-link" id="landing-demo-lesson" href="/topic/${esc(DEMOS[0].lesson)}/">Open full lesson &amp; runnable lab →</a>
      </section>`;
  }

  function renderCurriculum() {
    const data = window.CURRICULUM_DATA;
    if (!data) return '';
    let html = `
      <section class="landing-section ds-below-fold" id="landing-curriculum">
        <div class="landing-section__head">
          <h2 class="landing-section__title">6-track, 18-module curriculum</h2>
          <p class="landing-section__desc">Progress systematically from relational algebra and joins to slotted pages, B+Tree indexing, MVCC isolation, and columnar OLAP execution.</p>
        </div>`;
    for (const part of data.parts) {
      html += `<h3 class="landing-part">${esc(part.title)}</h3><div class="landing-modules">`;
      for (const mod of part.modules) {
        const prog = window.Progress?.getModuleProgress?.(mod.id) || { completed: 0, total: mod.units.length };
        const pct = prog.total ? Math.round((prog.completed / prog.total) * 100) : 0;
        const firstUnitSlug = mod.units[0]?.slug || '';
        html += `
          <a class="landing-module" href="/topic/${esc(firstUnitSlug)}/" data-module="${esc(mod.id)}" data-units="${mod.units.map(u => esc(u.slug)).join(' ')}">
            <span class="landing-module__num">${esc(mod.number)}</span>
            <span class="landing-module__title">${esc(mod.title)}</span>
            <span class="landing-module__meta" data-module-meta="${esc(mod.id)}">${mod.units.length} topics</span>
            <span class="landing-module__bar"><span data-module-bar="${esc(mod.id)}" style="width:${pct}%"></span></span>
          </a>`;
      }
      html += '</div>';
    }
    return html + '</section>';
  }

  function renderBuilds(c) {
    const builds = Object.entries(window.IMPLEMENTATIONS_DATA || {});
    if (!builds.length) return '';
    return `
      <section class="landing-section ds-below-fold" id="landing-builds">
        <div class="landing-section__head">
          <h2 class="landing-section__title">${c.builds} from-scratch engine builds</h2>
          <p class="landing-section__desc">Implement relation scanners, hash joins, B+Tree page layouts, WAL recovery, and columnar encoders step by step.</p>
        </div>
        <div class="landing-builds">
          ${builds.map(([id, b]) => `<a class="landing-build" href="/build/${esc(id)}/" data-action="navigate-build" data-build-id="${esc(id)}">${esc(shortTitle(b.title) || id)}<span aria-hidden="true">→</span></a>`).join('')}
        </div>
      </section>`;
  }

  function renderClosing() {
    const first = allUnits()[0];
    return `
      <section class="landing-closing ds-below-fold">
        <h2 class="landing-closing__title">Ready to trace how databases actually work?</h2>
        <p class="landing-closing__desc">Start at Module 01 with zero setup, or jump straight to the interactive topic roadmap.</p>
        <div class="landing-closing__actions">
          <a class="btn btn--primary landing-btn" href="/topic/${esc(first?.slug || 'why-databases-exist')}/">Start Module 01 →</a>
          <a class="btn btn--outline landing-btn" href="/roadmap/" data-nav="roadmap">View Topic Roadmap</a>
        </div>
      </section>`;
  }

  function render() {
    if (!window.CURRICULUM_DATA) return '<p>Loading curriculum data...</p>';
    const c = counts();
    return `<div class="landing">${renderHero(c)}${renderFlagshipVideos()}${renderDemos()}${renderCurriculum()}${renderBuilds(c)}${renderClosing()}</div>`;
  }

  /**
   * Wire above-the-fold SQL playground, resume state, lazy simulator tabs, and curriculum cards.
   */
  function mount(root) {
    const offs = [];
    const on = (el, ev, fn) => {
      if (!el) return;
      el.addEventListener(ev, fn);
      offs.push(() => el.removeEventListener(ev, fn));
    };

    // 1. Hydrate "Continue where you left off" & module progress bars from localStorage
    const lastSlug = window.Progress?.getLastVisited?.();
    const lastUnit = lastSlug ? findUnit(lastSlug) : null;
    const completedCount = window.Progress?.getCompletedCount?.() || 0;
    const totalCount = allUnits().length || 180;
    const resumeWrap = root.querySelector('#landing-resume');
    const resumeLink = root.querySelector('#landing-resume-link');
    const resumeTitle = root.querySelector('#landing-resume-title');
    const resumeMeta = root.querySelector('#landing-resume-meta');
    if (lastUnit && resumeWrap && resumeLink && resumeTitle && resumeMeta) {
      resumeLink.setAttribute('href', `/topic/${lastUnit.slug}/`);
      resumeTitle.textContent = lastUnit.title;
      resumeMeta.textContent = completedCount > 0
        ? `${completedCount}/${totalCount} completed · Resume →`
        : 'Resume →';
      resumeWrap.hidden = false;
    }

    if (window.CURRICULUM_DATA && window.Progress?.getModuleProgress) {
      for (const part of window.CURRICULUM_DATA.parts || []) {
        for (const mod of part.modules || []) {
          const prog = window.Progress.getModuleProgress(mod.id);
          const pct = prog.total ? Math.round((prog.completed / prog.total) * 100) : 0;
          const bar = root.querySelector(`[data-module-bar="${mod.id}"]`);
          const meta = root.querySelector(`[data-module-meta="${mod.id}"]`);
          if (bar) bar.style.width = `${pct}%`;
          if (meta && prog.completed > 0) {
            meta.textContent = `${prog.completed}/${prog.total} done`;
          }
        }
      }
    }

    // 2. Wire Above-the-Fold Live SQL Playground
    const sqlInput = root.querySelector('#landing-sql-input');
    const sqlRunBtn = root.querySelector('#landing-sql-run');
    const sqlMeta = root.querySelector('#landing-sql-meta');
    const sqlOutput = root.querySelector('#landing-sql-output');
    const sqlOpen = root.querySelector('#landing-sql-open');
    const sqlCopy = root.querySelector('#landing-sql-copy');

    const syncShareLinks = () => {
      if (!sqlInput || !sqlOpen) return;
      sqlOpen.setAttribute('href', buildStudioHref(sqlInput.value));
    };

    const runLiveSql = async () => {
      if (!sqlInput || !sqlOutput || !sqlMeta) return;
      const query = sqlInput.value.trim();
      if (!query) return;
      syncShareLinks();
      sqlMeta.textContent = 'Running in SQLite WASM…';
      if (sqlRunBtn) sqlRunBtn.disabled = true;
      try {
        if (window.Lazy?.ensureSqlStack) {
          await window.Lazy.ensureSqlStack();
        }
        const engine = window.SQLEngine || window.SqlEngine;
        if (!engine) throw new Error('SQL engine unavailable');
        const t0 = performance.now();
        const res = await engine.execute(query, { dataset: 'ecommerce', engine: 'sqlite' });
        const elapsed = (performance.now() - t0).toFixed(1);
        if (res.error) {
          const hint = engine.getErrorHint ? engine.getErrorHint(res.error) : '';
          sqlOutput.innerHTML = renderResultPreviewHtml([], [], [], hint ? `${res.error} — ${hint}` : res.error);
          sqlMeta.textContent = 'Query error';
          return;
        }
        let planSteps = [];
        if (/^\s*(SELECT|WITH)\b/i.test(query)) {
          const planRes = await engine.execute('EXPLAIN QUERY PLAN ' + query, { dataset: 'ecommerce', engine: 'sqlite' });
          if (planRes && !planRes.error && Array.isArray(planRes.rows)) {
            planSteps = planRes.rows.map(r => String(r[3] || r[r.length - 1] || '')).filter(Boolean).slice(0, 3);
          }
        }
        sqlOutput.innerHTML = renderResultPreviewHtml(res.columns || [], res.rows || [], planSteps, null);
        sqlMeta.textContent = `${(res.rows || []).length} rows · ${elapsed} ms · SQLite WASM`;
      } catch (err) {
        sqlOutput.innerHTML = renderResultPreviewHtml([], [], [], err?.message || String(err));
        sqlMeta.textContent = 'Execution failed';
      } finally {
        if (sqlRunBtn) sqlRunBtn.disabled = false;
      }
    };

    on(sqlRunBtn, 'click', runLiveSql);
    on(sqlInput, 'input', syncShareLinks);
    on(sqlInput, 'keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runLiveSql();
      }
    });

    on(root.querySelector('.landing-pg__presets'), 'click', e => {
      const btn = e.target.closest('[data-sql-preset]');
      if (!btn || !sqlInput || !sqlOutput || !sqlMeta) return;
      const idx = Number(btn.dataset.sqlPreset) || 0;
      const preset = SQL_PRESETS[idx];
      if (!preset) return;
      root.querySelectorAll('[data-sql-preset]').forEach((b, j) => {
        b.classList.toggle('is-active', j === idx);
        b.setAttribute('aria-selected', String(j === idx));
      });
      sqlInput.value = preset.sql;
      syncShareLinks();
      // Instant zero-latency preview, plus live Worker execution if already loaded
      sqlOutput.innerHTML = renderResultPreviewHtml(preset.columns, preset.rows, preset.plan, null);
      sqlMeta.textContent = `${preset.rows.length} rows · Instant preview`;
      if (window.SQLEngine || window.SqlEngine) {
        runLiveSql();
      }
    });

    on(sqlCopy, 'click', async () => {
      if (!sqlInput || !sqlCopy) return;
      const shareUrl = window.location.origin + buildStudioHref(sqlInput.value);
      try {
        await navigator.clipboard.writeText(shareUrl);
        const prev = sqlCopy.textContent;
        sqlCopy.textContent = 'Copied link ✓';
        setTimeout(() => { sqlCopy.textContent = prev; }, 1800);
      } catch (_) {
        window.location.href = buildStudioHref(sqlInput.value);
      }
    });

    // 3. Lazy-loaded Interactive Simulator Showcase
    const stage = root.querySelector('#landing-demo-stage');
    const demoSection = root.querySelector('#landing-demos');
    let activeSim = null;
    let activeDemoIdx = 0;

    const showDemo = async i => {
      const demo = DEMOS[i];
      if (!stage || !demo) return;
      activeDemoIdx = i;
      root.querySelectorAll('.landing-tab').forEach((t, j) => {
        t.classList.toggle('is-active', j === i);
        t.setAttribute('aria-selected', String(j === i));
      });
      root.querySelector('#landing-demo-lesson')?.setAttribute('href', `/topic/${demo.lesson}/`);

      if (!window.SIMULATORS?.[demo.sim] && window.Lazy?.loadAll) {
        try {
          await window.Lazy.loadAll(['js/simulators.js', demo.file]);
        } catch (_) {}
      }
      if (activeDemoIdx !== i) return;
      const sim = window.SIMULATORS?.[demo.sim];
      if (!sim) return;
      if (activeSim) {
        try { activeSim.unmount?.(stage); } catch (_) {}
        activeSim = null;
      }
      stage.innerHTML = sim.render();
      sim.mount?.(stage);
      activeSim = sim;
    };

    on(root.querySelector('.landing-tabs'), 'click', e => {
      const tab = e.target.closest('.landing-tab');
      if (tab) showDemo(Number(tab.dataset.demo) || 0);
    });

    if (demoSection && typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver(entries => {
        if (entries.some(en => en.isIntersecting)) {
          io.disconnect();
          showDemo(activeDemoIdx);
        }
      }, { rootMargin: '240px 0px' });
      io.observe(demoSection);
      offs.push(() => io.disconnect());
    } else {
      showDemo(0);
    }

    // 4. Curriculum & Search Shortcuts
    on(root.querySelector('#landing-curriculum'), 'click', e => {
      const card = e.target.closest('[data-module]');
      if (!card || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (window.App?.navigateToModule) {
        e.preventDefault();
        window.App.navigateToModule(card.dataset.module);
      }
    });
    root.querySelectorAll('[data-landing-scroll]').forEach(b => on(b, 'click', () => {
      document.getElementById(b.dataset.landingScroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    root.querySelectorAll('[data-landing-search]').forEach(b => on(b, 'click', () => window.Search?.open?.()));

    return () => {
      if (activeSim && stage) {
        try { activeSim.unmount?.(stage); } catch (_) {}
        activeSim = null;
      }
      offs.splice(0).forEach(f => f());
    };
  }

  return { render, mount };
})();
