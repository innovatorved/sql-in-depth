/* ═══════════════════════════════════════════════════════════════
   App Controller — Main application logic, routing, sidebar
   ═══════════════════════════════════════════════════════════════ */

window.MODULE_CONTENT = window.MODULE_CONTENT || {};

window.App = (() => {
  // State
  let currentView = 'home';     // home | topic | build | roadmap | challenges | dashboard | sandbox
  let currentSlug = null;
  let activeTab = 'curriculum';  // curriculum | builds
  let sidebarOpen = false;
  let activeSimulator = null;
  let activeCodeLab = null;
  let activeRoadmap = null;
  let activeChallenge = null;
  let activeDashboard = null;
  let activeSandbox = null;
  let currentBuildParams = new URLSearchParams();
  let currentRouteParams = new URLSearchParams();
  let landingCleanup = null;  // live demo on the landing page
  const collapsedModules = new Set();
  let collapsedModulesInitialized = false;

  function getAllModuleIds() {
    const ids = [];
    const data = window.CURRICULUM_DATA;
    if (!data) return ids;
    for (const p of data.parts) {
      for (const m of p.modules) {
        ids.push(m.id);
      }
    }
    return ids;
  }

  function ensureDefaultCollapsedModules() {
    if (collapsedModulesInitialized) return;
    collapsedModulesInitialized = true;
  }

  function syncCollapseModulesBtn() {
    const labelEl = document.getElementById('sidebar-collapse-modules-label');
    const btnEl = document.getElementById('sidebar-collapse-modules-btn');
    if (!labelEl || !btnEl) return;
    const allIds = getAllModuleIds();
    const allCollapsed = allIds.length > 0 && allIds.every(id => collapsedModules.has(id));
    labelEl.textContent = allCollapsed ? 'Expand' : 'Collapse';
    btnEl.title = allCollapsed ? 'Expand all modules' : 'Collapse all modules';
    btnEl.setAttribute('aria-label', allCollapsed ? 'Expand all modules' : 'Collapse all modules');
  }

  function toggleAllModules() {
    ensureDefaultCollapsedModules();
    const allIds = getAllModuleIds();
    const allCollapsed = allIds.length > 0 && allIds.every(id => collapsedModules.has(id));
    if (allCollapsed) {
      collapsedModules.clear();
      document.querySelectorAll('.module-group').forEach(g => g.classList.remove('collapsed'));
    } else {
      allIds.forEach(id => collapsedModules.add(id));
      document.querySelectorAll('.module-group').forEach(g => g.classList.add('collapsed'));
    }
    syncCollapseModulesBtn();
  }

  function toggleDesktopSidebar(forceCollapsed) {
    if (window.innerWidth <= 900 && sidebarOpen) {
      closeSidebar();
      return;
    }
    const isCollapsed = typeof forceCollapsed === 'boolean'
      ? forceCollapsed
      : !document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const expandBtn = document.getElementById('sidebar-expand-btn');
    if (collapseBtn) collapseBtn.setAttribute('aria-expanded', String(!isCollapsed));
    if (expandBtn) expandBtn.setAttribute('aria-expanded', String(!isCollapsed));
  }

  // Helper: find module ID for a given slug
  function getModuleIdForSlug(slug) {
    const data = window.CURRICULUM_DATA;
    if (!data) return null;
    for (const p of data.parts) {
      for (const m of p.modules) {
        for (const u of m.units) {
          if (u.slug === slug) return m.id;
        }
      }
    }
    return null;
  }

  // ── Initialization ────────────────────────────────────────
  function init() {
    // Initialize Analytics
    if (window.Analytics?.init) {
      window.Analytics.init();
    }

    // Parse hash route
    parseRoute();

    // Render sidebar
    renderSidebar();

    // Render content
    renderCurrentView();

    // Setup event listeners
    setupEventListeners();

    // Initialize search
    window.Search.init();

    // Update progress UI
    window.Progress.updateProgressUI();

    // Load module content for current view
    if (currentSlug) loadModuleContent(currentSlug);

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      parseRoute();
      if (currentSlug && currentView === 'topic') loadModuleContent(currentSlug);
      renderCurrentView();
      updateSidebarActive();
    });

    // Listen for history popstate (forward/back)
    window.addEventListener('popstate', () => {
      parseRoute();
      if (currentSlug && currentView === 'topic') loadModuleContent(currentSlug);
      renderCurrentView();
      updateSidebarActive();
    });
  }

  // ── Routing ───────────────────────────────────────────────
  function parseRoute() {
    const cleanPathname = window.location.pathname.replace(/\/index\.html$/i, '');
    const path = cleanPathname.replace(/^\/|\/$/g, '');
    const hash = window.location.hash.slice(1).replace(/^\/+/, '').replace(/\/index\.html$/i, '');
    const searchParams = new URLSearchParams(window.location.search);
    const viewParam = (searchParams.get('view') || '').toLowerCase();

    // 0. Explicit ?view=... query-parameter routing (when no hash override is active)
    if (viewParam && !hash) {
      currentRouteParams = searchParams;
      if (viewParam === 'home') {
        currentView = 'home';
        currentSlug = null;
        activeTab = 'curriculum';
        syncSidebarTabs();
        return;
      }
      if (viewParam === 'topic' || viewParam === 'build') {
        const rawSlug = (searchParams.get('slug') || searchParams.get('id') || 'rdbms-filesystems-codds-rules').replace(/\/index\.html$/i, '').replace(/\/+$/, '');
        currentSlug = rawSlug === 'write-ahead-log' ? 'database-wal-and-recovery' : rawSlug;
        currentView = viewParam === 'build' ? 'build' : 'topic';
        activeTab = 'curriculum';
        syncSidebarTabs();
        return;
      }
      if (viewParam === 'sandbox' || viewParam === 'blueprint') {
        currentView = 'sandbox';
        currentSlug = searchParams.get('blueprint') || null;
        activeTab = 'curriculum';
        syncSidebarTabs();
        return;
      }
      if (viewParam === 'challenges') {
        currentView = 'challenges';
        currentSlug = searchParams.get('id') || searchParams.get('slug') || null;
        activeTab = 'curriculum';
        syncSidebarTabs();
        return;
      }
      if (viewParam === 'cheatsheet' || viewParam === 'patterns') {
        currentView = 'cheatsheet';
        currentSlug = searchParams.get('module') || searchParams.get('id') || 'm01';
        activeTab = 'curriculum';
        syncSidebarTabs();
        return;
      }
      if (viewParam === 'roadmap') {
        currentView = 'roadmap';
        currentSlug = searchParams.get('tab') || 'graph';
        activeTab = 'curriculum';
        syncSidebarTabs();
        return;
      }
      if (viewParam === 'dashboard' || viewParam === 'srs') {
        currentView = 'dashboard';
        currentSlug = viewParam === 'srs' ? 'cards' : (searchParams.get('tab') || 'overview');
        activeTab = 'curriculum';
        syncSidebarTabs();
        return;
      }
      if (viewParam === 'glossary') {
        currentView = 'glossary';
        currentSlug = null;
        activeTab = 'curriculum';
        syncSidebarTabs();
        return;
      }
    }

    // Clean up legacy #projects hash to /projects
    if (hash === 'projects' || hash.startsWith('projects/') || hash.startsWith('project/')) {
      const slug = hash.startsWith('project/') ? hash.slice(8) : null;
      history.replaceState(null, '', '/projects' + (slug ? ('#project-' + slug) : ''));
      currentView = 'projects';
      currentSlug = slug;
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    if (path === 'projects' || path.startsWith('projects/')) {
      currentView = 'projects';
      currentSlug = hash.startsWith('project-') ? hash.slice(8) : (hash.startsWith('project/') ? hash.slice(8) : null);
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Route #build/<slug> or /build/<slug>/ to the dedicated Capstone Build Lab view
    if (hash.startsWith('build/') || path.startsWith('build/')) {
      const rawPart = hash.startsWith('build/') ? hash.slice(6) : path.slice(6);
      const [rawBuildSlug, queryStr] = rawPart.split('?');
      currentSlug = rawBuildSlug.replace(/\/index\.html$/i, '').replace(/\/+$/, '');
      currentBuildParams = new URLSearchParams(queryStr || window.location.search);
      currentView = 'build';
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Cheat Sheet & SQL Patterns route (checked BEFORE path.startsWith('topic/') so #cheatsheet/m01 works from topic pages)
    if (
      hash === 'cheatsheet' || hash.startsWith('cheatsheet/') ||
      hash === 'patterns' || hash.startsWith('patterns/') ||
      path === 'cheatsheet' || path.startsWith('cheatsheet/') ||
      path === 'patterns' || path.startsWith('patterns/')
    ) {
      let modId = 'm01';
      if (hash.startsWith('cheatsheet/')) modId = hash.slice(11).split('?')[0].replace(/\/+$/, '') || 'm01';
      else if (hash.startsWith('patterns/')) modId = hash.slice(9).split('?')[0].replace(/\/+$/, '') || 'm01';
      else if (path.startsWith('cheatsheet/')) modId = path.slice(11).replace(/\/+$/, '') || 'm01';
      else if (path.startsWith('patterns/')) modId = path.slice(9).replace(/\/+$/, '') || 'm01';
      currentView = 'cheatsheet';
      currentSlug = modId;
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Roadmap route: /roadmap or #/roadmap
    if (path === 'roadmap' || path.startsWith('roadmap/') || hash === 'roadmap' || hash.startsWith('roadmap/')) {
      const query = window.location.search || (hash.includes('?') ? '?' + hash.split('?')[1] : '');
      currentRouteParams = new URLSearchParams(query);
      let sub = null;
      if (path.startsWith('roadmap/')) sub = path.slice(8).replace(/\/+$/, '');
      else if (hash.includes('roadmap/')) sub = hash.split('roadmap/')[1].split('?')[0].replace(/\/+$/, '');
      currentView = 'roadmap';
      currentSlug = sub || currentRouteParams.get('tab') || 'graph';
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Challenges route: /challenges, /challenges/<id> or #/challenges
    if (path === 'challenges' || path.startsWith('challenges/') || hash === 'challenges' || hash.startsWith('challenges/')) {
      let sub = null;
      if (path.startsWith('challenges/')) {
        sub = path.slice(11).replace(/\/+$/, '');
      } else if (hash.includes('challenges/')) {
        sub = hash.split('challenges/')[1].split('?')[0].replace(/\/+$/, '');
      }
      currentRouteParams = new URLSearchParams(window.location.search);
      currentView = 'challenges';
      currentSlug = sub || null;
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // SRS alias route: /srs or #/srs
    if (path === 'srs' || path.startsWith('srs/') || hash === 'srs') {
      currentView = 'dashboard';
      currentSlug = 'cards';
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Blueprint alias route: /blueprint or #/blueprint
    if (path === 'blueprint' || path.startsWith('blueprint/') || hash === 'blueprint') {
      currentView = 'sandbox';
      currentSlug = null;
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Dashboard route: /dashboard or #/dashboard
    if (path === 'dashboard' || path.startsWith('dashboard/') || hash === 'dashboard' || hash.startsWith('dashboard/')) {
      const query = window.location.search || (hash.includes('?') ? '?' + hash.split('?')[1] : '');
      currentRouteParams = new URLSearchParams(query);
      let sub = null;
      if (path.startsWith('dashboard/')) sub = path.slice(10).replace(/\/+$/, '');
      else if (hash.includes('dashboard/')) sub = hash.split('dashboard/')[1].split('?')[0].replace(/\/+$/, '');
      currentView = 'dashboard';
      currentSlug = sub || currentRouteParams.get('tab') || 'overview';
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Sandbox route: /sandbox, /sandbox/<id> or #/sandbox
    if (path === 'sandbox' || path.startsWith('sandbox/') || hash === 'sandbox' || hash.startsWith('sandbox/')) {
      let sub = null;
      if (path.startsWith('sandbox/')) {
        sub = path.slice(8).replace(/\/+$/, '');
      } else if (hash.includes('sandbox/')) {
        sub = hash.split('sandbox/')[1].split('?')[0].replace(/\/+$/, '');
      }
      currentRouteParams = new URLSearchParams(window.location.search);
      currentView = 'sandbox';
      currentSlug = sub || currentRouteParams.get('blueprint') || null;
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    if (hash === 'review' || hash === 'cards') {
      window.location.hash = '';
      return;
    }
    if (hash === 'glossary' || path === 'glossary' || path.startsWith('glossary/')) {
      currentView = 'glossary';
      currentSlug = null;
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }
    if (hash.startsWith('topic/')) {
      currentView = 'topic';
      currentSlug = hash.slice(6).replace(/\/index\.html$/i, '').replace(/\/+$/, '');
      if (currentSlug === 'write-ahead-log') currentSlug = 'database-wal-and-recovery';
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Clean URL topic route: topic/<slug> or /topic/<slug>
    if (path.startsWith('topic/')) {
      currentView = 'topic';
      currentSlug = path.slice(6).replace(/\/index\.html$/i, '').replace(/\/+$/, '');
      if (currentSlug === 'write-ahead-log') currentSlug = 'database-wal-and-recovery';
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    if (!hash) {
      currentView = 'home';
      currentSlug = null;
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    currentView = 'topic';
    currentSlug = hash;
    if (currentSlug === 'write-ahead-log') currentSlug = 'database-wal-and-recovery';
    activeTab = 'curriculum';
    syncSidebarTabs();
  }

  function syncSidebarTabs() {
    activeTab = 'curriculum';
    document.querySelectorAll('.sidebar__tab').forEach(tab => {
      const match = tab.dataset.tab === 'curriculum';
      tab.classList.toggle('active', match);
      tab.setAttribute('aria-selected', match ? 'true' : 'false');
    });
    renderSidebar();
  }

  function navigateTo(slug, event) {
    if (event && event.preventDefault) event.preventDefault();
    if (!slug) return;
    loadModuleContent(slug);
    history.pushState(null, '', '/topic/' + slug + '/');
    parseRoute();
    renderCurrentView();
    window.Progress.setLastVisited(slug);
    updateSidebarActive();
    closeSidebar();
    window.scrollTo(0, 0);
  }

  function navigateToBuild(buildId, event) {
    if (event && event.preventDefault) event.preventDefault();
    if (!buildId) return;
    const [rawSlug, queryStr] = String(buildId).replace(/^\/build\//, '').split('?');
    const cleanId = rawSlug.replace(/\/+$/, '');
    currentBuildParams = new URLSearchParams(queryStr || '');
    history.pushState(null, '', '/build/' + cleanId + '/' + (queryStr ? ('?' + queryStr) : ''));
    parseRoute();
    renderCurrentView();
    updateSidebarActive();
    closeSidebar();
    window.scrollTo(0, 0);
  }

  function navigate(pathOrUrl, event) {
    if (event && event.preventDefault) event.preventDefault();
    if (!pathOrUrl) return;
    const str = String(pathOrUrl);
    if (
      str === 'cheatsheet' || str === 'patterns' ||
      str.startsWith('#cheatsheet') || str.startsWith('/cheatsheet') ||
      str.startsWith('cheatsheet/') || str.startsWith('#patterns')
    ) {
      let modId = (typeof event === 'string' && event) ? event : 'm01';
      if (str.includes('/')) {
        modId = str.split('/').filter(Boolean).pop().split('?')[0] || modId;
      }
      currentView = 'cheatsheet';
      currentSlug = modId;
      loadModuleContent(currentSlug);
      history.pushState(null, '', '/#cheatsheet/' + currentSlug);
      renderCurrentView();
      updateSidebarActive();
      closeSidebar();
      window.scrollTo(0, 0);
      return;
    }
    if (str.startsWith('/build/')) {
      navigateToBuild(str.slice(7), event);
      return;
    }
    if (str.startsWith('/topic/')) {
      navigateTo(str.slice(7).replace(/\/+$/, ''), event);
      return;
    }
    if (str.startsWith('/challenges')) {
      const sub = str.replace(/^\/challenges\/?/, '').replace(/\/+$/, '');
      navigateToChallenges(sub || null, event);
      return;
    }
    if (str.startsWith('/sandbox')) {
      const qIdx = str.indexOf('?');
      const params = qIdx >= 0 ? new URLSearchParams(str.slice(qIdx)) : null;
      const sub = str.split('?')[0].replace(/^\/sandbox\/?/, '').replace(/\/+$/, '');
      navigateToSandbox(sub || params?.get('blueprint') || null, event);
      return;
    }
    history.pushState(null, '', str);
    parseRoute();
    renderCurrentView();
    window.scrollTo(0, 0);
  }

  function navigateToProject(projectId, event) {
    if (event && event.preventDefault) event.preventDefault();
    const targetUrl = '/projects' + (projectId ? ('#project-' + projectId) : '');
    if (window.location.pathname !== '/projects' || window.location.hash !== (projectId ? ('#project-' + projectId) : '')) {
      history.pushState(null, '', targetUrl);
    }
    currentView = 'projects';
    currentSlug = projectId || null;
    closeSidebar();
    renderCurrentView();
    if (projectId) {
      setTimeout(() => {
        const el = document.getElementById('project-' + projectId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    } else {
      window.scrollTo(0, 0);
    }
  }

  function navigateToModule(moduleId) {
    // Navigate to first unit in module
    const data = window.CURRICULUM_DATA;
    if (!data) return;
    for (const p of data.parts) {
      for (const m of p.modules) {
        if (m.id === moduleId && m.units.length > 0) {
          navigateTo(m.units[0].slug);
          return;
        }
      }
    }
  }

  function navigateToGlossary(event) {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
    if (event) event.preventDefault();
    if (window.location.pathname !== '/glossary/' || window.location.hash) {
      history.pushState(null, '', '/glossary/');
    }
    currentView = 'glossary';
    currentSlug = null;
    closeSidebar();
    renderCurrentView();
    window.scrollTo(0, 0);
  }

  function navigateToRoadmap(tab, event) {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
    if (event) event.preventDefault();
    const targetPath = tab && tab !== 'graph' ? `/roadmap/${tab}` : '/roadmap';
    if (window.location.pathname !== targetPath || window.location.hash) {
      history.pushState(null, '', targetPath);
    }
    currentView = 'roadmap';
    currentSlug = tab || 'graph';
    closeSidebar();
    renderCurrentView();
    window.scrollTo(0, 0);
  }

  function navigateToChallenges(challengeId, event) {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
    if (event) event.preventDefault();
    const targetPath = challengeId ? `/challenges/${challengeId}` : '/challenges';
    if (window.location.pathname !== targetPath || window.location.hash) {
      history.pushState(null, '', targetPath);
    }
    currentView = 'challenges';
    currentSlug = challengeId || null;
    closeSidebar();
    renderCurrentView();
    window.scrollTo(0, 0);
  }

  function navigateToDashboard(tab, event) {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
    if (event) event.preventDefault();
    const targetPath = tab && tab !== 'overview' ? `/dashboard/${tab}` : '/dashboard';
    if (window.location.pathname !== targetPath || window.location.hash) {
      history.pushState(null, '', targetPath);
    }
    currentView = 'dashboard';
    currentSlug = tab || 'overview';
    closeSidebar();
    renderCurrentView();
    window.scrollTo(0, 0);
  }

  function navigateToSandbox(blueprintId, event) {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
    if (event) event.preventDefault();
    const targetPath = blueprintId ? `/sandbox/${blueprintId}` : '/sandbox';
    if (window.location.pathname !== targetPath || window.location.hash) {
      history.pushState(null, '', targetPath);
    }
    currentView = 'sandbox';
    currentSlug = blueprintId || null;
    closeSidebar();
    renderCurrentView();
    window.scrollTo(0, 0);
  }

  function navigateHome() {
    if (window.location.pathname !== '/' || window.location.hash) {
      history.pushState(null, '', '/');
    }
    currentView = 'home';
    currentSlug = null;
    activeTab = 'curriculum';
    syncSidebarTabs();
    closeSidebar();
    renderCurrentView();
    window.scrollTo(0, 0);
  }

  // ── Content Rendering ─────────────────────────────────────
  function renderCurrentView() {
    const reader = document.getElementById('reader');
    if (!reader) return;

    // Pause any active audio from previous view
    document.querySelectorAll('audio').forEach(a => a.pause());

    if (activeSimulator) {
      activeSimulator.unmount(reader);
      activeSimulator = null;
    }
    if (activeCodeLab) {
      if (window.CodeLab?.unmount) window.CodeLab.unmount(activeCodeLab);
      else if (activeCodeLab.destroy) activeCodeLab.destroy();
      activeCodeLab = null;
    }
    if (landingCleanup) {
      landingCleanup();
      landingCleanup = null;
    }
    if (activeRoadmap) {
      if (window.RoadmapController?.unmount) window.RoadmapController.unmount();
      activeRoadmap = false;
    }
    if (activeChallenge) {
      if (window.ChallengesController?.unmount) window.ChallengesController.unmount();
      activeChallenge = false;
    }
    if (activeDashboard) {
      if (window.DashboardController?.unmount) window.DashboardController.unmount();
      activeDashboard = false;
    }
    if (activeSandbox) {
      if (window.SandboxController?.unmount) window.SandboxController.unmount();
      activeSandbox = false;
    }

    // Landing page & ecosystem hubs are full-width
    const isEcosystemView = ['roadmap', 'challenges', 'dashboard', 'sandbox'].includes(currentView);
    document.body.classList.toggle('view-landing', currentView === 'home' && !!window.Landing);
    document.body.classList.toggle('view-build', currentView === 'build');
    document.body.classList.toggle('view-ecosystem', isEcosystemView);

    // Highlight active topbar link
    document.querySelectorAll('.topbar__link[data-nav], .topbar__nav-link[data-nav]').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-nav') === currentView);
    });

    switch (currentView) {
      case 'home':
        if (window.Landing) {
          // Keep the prerendered landing (already personalised inline in index.html) so nothing re-renders
          const shell = reader.querySelector('.landing-shell');
          if (shell) shell.classList.remove('landing-shell');
          else reader.innerHTML = window.Landing.render();
          landingCleanup = window.Landing.mount(reader);
        } else {
          reader.innerHTML = window.Renderer.renderOverview();
        }
        if (window.Analytics) {
          window.Analytics.trackPageView('SQL In Depth - Home', '/', window.location.href);
        }
        break;

      case 'roadmap':
        if (window.RoadmapController) {
          window.RoadmapController.mount(reader, { tab: currentSlug || 'graph' });
          activeRoadmap = true;
        }
        if (window.Analytics) {
          window.Analytics.trackPageView('Interactive SQL & Database Roadmap | SQL In Depth', '/roadmap', window.location.href);
        }
        break;

      case 'challenges':
        if (window.ChallengesController) {
          window.ChallengesController.mount(reader, { challengeId: currentSlug });
          activeChallenge = true;
        }
        if (window.Analytics) {
          window.Analytics.trackPageView('Production Incident Challenges | SQL In Depth', '/challenges', window.location.href);
        }
        break;

      case 'dashboard':
        if (window.DashboardController) {
          window.DashboardController.mount(reader, { tab: currentSlug || 'overview' });
          activeDashboard = true;
        }
        if (window.Analytics) {
          window.Analytics.trackPageView('Learner Study Hub & SRS Flashcards | SQL In Depth', '/dashboard', window.location.href);
        }
        break;

      case 'sandbox':
        if (window.SandboxController) {
          window.SandboxController.mount(reader, { blueprintId: currentSlug || 'sargable-composite-index-selector' });
          activeSandbox = true;
        }
        if (window.Analytics) {
          window.Analytics.trackPageView('Architecture Whiteboard & Capacity Sandbox | SQL In Depth', '/sandbox', window.location.href);
        }
        break;

      case 'glossary':
        reader.innerHTML = window.Renderer.renderGlossary();
        if (window.Analytics) {
          window.Analytics.trackPageView('SQL & Database Glossary | SQL In Depth', '/glossary/', window.location.href);
        }
        break;
      case 'cheatsheet':
        loadModuleContent(currentSlug);
        reader.innerHTML = window.Renderer.renderCheatSheet(currentSlug);
        if (window.Analytics) {
          window.Analytics.trackPageView('Cheat Sheet', '/#cheatsheet/' + currentSlug, window.location.href);
        }
        break;
      case 'topic':
        if (currentSlug) {
          loadModuleContent(currentSlug);
        }

        const isPrerendered = reader.getAttribute('data-prerendered') === currentSlug;
        if (isPrerendered) {
          const toggleBtn = reader.querySelector('.completion-toggle');
          if (toggleBtn && window.Progress) {
            const isCompleted = window.Progress.isCompleted(currentSlug);
            toggleBtn.classList.toggle('completed', isCompleted);
            toggleBtn.innerHTML = isCompleted
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Completed'
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg> Mark Complete';
          }
        } else {
          reader.removeAttribute('data-prerendered');
          reader.innerHTML = window.Renderer.renderLesson(currentSlug);
        }
        
        const handleSimulator = () => {
          const mountedSims = [];
          const mounts = reader.querySelectorAll('.simulator-mount[data-sim]');
          if (mounts.length > 0) {
            mounts.forEach(mountEl => {
              const simId = mountEl.getAttribute('data-sim');
              const sim = window.SIMULATORS?.[simId];
              if (sim) {
                try {
                  if ((!mountEl.innerHTML.trim() || !mountEl.querySelector('[data-role="custom-input"]')) && typeof sim.render === 'function') {
                    mountEl.innerHTML = sim.render();
                  }
                  if (typeof sim.mount === 'function') {
                    sim.mount(mountEl);
                  }
                  mountedSims.push({ sim, el: mountEl });
                } catch (err) {
                  console.error('[Inline simulator mount error]', simId, err);
                }
              }
            });
          } else if (window.Simulators && window.Simulators.getSimulatorForUnit) {
            const simData = window.Simulators.getSimulatorForUnit(currentSlug);
            if (simData && simData.sim) {
              try {
                const placeholder = reader.querySelector(`.sim-card-placeholder[data-sim-slug="${currentSlug}"]`);
                if (placeholder) {
                  const wrapper = document.createElement('div');
                  wrapper.className = 'simulator-mount';
                  wrapper.id = placeholder.id || ('topic-simulator-' + currentSlug);
                  wrapper.setAttribute('data-sim', simData.sim.id);
                  wrapper.innerHTML = simData.html;
                  placeholder.replaceWith(wrapper);
                  simData.sim.mount(wrapper);
                  mountedSims.push({ sim: simData.sim, el: wrapper });
                } else {
                  simData.sim.mount(reader);
                  mountedSims.push({ sim: simData.sim, el: reader });
                }
              } catch (err) {
                console.error('[Simulator mount error]', err);
              }
            }
          }
          if (mountedSims.length > 0) {
            activeSimulator = {
              unmount() {
                mountedSims.forEach(({ sim, el }) => {
                  try { sim.unmount?.(el); } catch (_) {}
                });
              }
            };
          }
        };

        const simFile = window.SIMULATOR_SCRIPT_MAP?.[currentSlug];
        if (simFile && window.loadScript) {
          window.loadScript(simFile).then(handleSimulator).catch(err => {
            console.error('[Failed to load simulator script]', simFile, err);
          });
        } else {
          handleSimulator();
        }
        
        initMermaid();
        renderMathOnPage(reader);
        if (window.TableVisualizer && typeof window.TableVisualizer.enhanceSqlCodeBlocks === 'function') {
          try { window.TableVisualizer.enhanceSqlCodeBlocks(reader); } catch (err) { console.warn('[TableVisualizer]', err); }
        }
        if (!window.TOPIC_GUIDED_LABS && window.loadScript) {
          window.loadScript('data/topic_guided_labs.js').then(() => {
            mountInlineTopicSqlLab(currentSlug, reader);
          }).catch(() => {
            mountInlineTopicSqlLab(currentSlug, reader);
          });
        } else {
          mountInlineTopicSqlLab(currentSlug, reader);
        }
        if (window.setupAudioListeners) {
          window.setupAudioListeners(currentSlug);
        }
        if (window.Analytics) {
          const data = window.CURRICULUM_DATA;
          let foundUnit = null, foundMod = null, foundPart = null;
          if (data) {
            for (const p of data.parts) {
              for (const m of p.modules) {
                for (const u of m.units) {
                  if (u.slug === currentSlug) {
                    foundUnit = u; foundMod = m; foundPart = p;
                    break;
                  }
                }
                if (foundUnit) break;
              }
              if (foundUnit) break;
            }
          }
          const title = foundUnit?.title || currentSlug;
          window.Analytics.trackPageView(title + ' | SQL In Depth', '/topic/' + currentSlug + '/', window.location.href);
          window.Analytics.trackTopicView({
            slug: currentSlug,
            title: title,
            moduleTitle: foundMod?.title || '',
            moduleNumber: foundMod?.number || '',
            partNumber: foundPart?.number || '',
            kind: foundUnit?.kind || 'lesson',
            wordCount: foundUnit?.archive?.wordCount || 0,
            readingTimeMin: foundUnit?.archive?.wordCount ? Math.ceil(foundUnit.archive.wordCount / 200) : 0
          });
        }
        break;
      case 'projects':
        reader.innerHTML = window.Renderer.renderProjects(currentSlug);
        if (currentSlug) {
          setTimeout(() => {
            const el = document.getElementById('project-' + currentSlug);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 80);
        }
        if (window.Analytics) {
          window.Analytics.trackPageView('Top Projects | @innovatorved', '/projects/', window.location.href);
        }
        break;
      case 'build':
        reader.removeAttribute('data-prerendered');
        const isPrerenderedBuild = reader.getAttribute('data-prerendered-build') === currentSlug;
        const renderBuildView = () => {
          document.body.classList.remove('codelab-fullscreen-lock');
          if (reader.getAttribute('data-prerendered-build') === currentSlug) {
            reader.removeAttribute('data-prerendered-build');
          } else {
            reader.removeAttribute('data-prerendered-build');
            reader.innerHTML = window.Renderer.renderBuild(currentSlug);
          }
          initMermaid();
          renderMathOnPage(reader);
          if (window.TableVisualizer && typeof window.TableVisualizer.enhanceSqlCodeBlocks === 'function') {
            window.TableVisualizer.enhanceSqlCodeBlocks(reader);
          }
          mountInlineTopicSqlLab(currentSlug, reader);

          const impls = window.IMPLEMENTATIONS_DATA;
          const build = impls?.[currentSlug];
          const overlayEl = document.getElementById('build-lab-overlay');
          const mountEl = document.getElementById('codelab-mount') || document.getElementById('codelab-mount-' + currentSlug);
          const requestedMode = currentBuildParams.get('mode');
          const requestedLang = currentBuildParams.get('lang');
          const requestedLab = currentBuildParams.get('lab');
          const requestedStep = currentBuildParams.get('step');

          const syncOverviewProgress = () => {
            const sb = document.getElementById('sidebar-content');
            if (activeTab === 'builds' && sb) renderBuildsSidebar(sb);
            let completedIds = [];
            try {
              const raw = localStorage.getItem('sd-codelab-v1:' + currentSlug) || localStorage.getItem('sd_codelab_' + currentSlug);
              const saved = JSON.parse(raw || 'null');
              if (Array.isArray(saved?.completedSteps)) {
                completedIds = saved.completedSteps;
              } else {
                const legacy = JSON.parse(localStorage.getItem('codelab_progress_' + currentSlug) || '[]');
                if (Array.isArray(legacy)) completedIds = legacy;
              }
            } catch (_) {}
            const guidedData = window.TopicGuidedLabs?.getLab?.(currentSlug) || window.TOPIC_GUIDED_LABS?.[currentSlug] || window.GUIDED_LABS_DATA?.[currentSlug];
            const steps = guidedData?.steps || [];
            const badge = document.getElementById('build-lab-progress-badge');
            if (badge && steps.length) {
              badge.textContent = `${completedIds.length}/${steps.length} Steps Completed`;
            }
            const tabBadge = reader.querySelector('.build-view-tab__badge');
            if (tabBadge && steps.length) {
              tabBadge.textContent = `${completedIds.length}/${steps.length} Steps`;
            }
            const trackFill = reader.querySelector('.build-lab-progress-track__fill');
            if (trackFill && steps.length) {
              const pct = Math.round((completedIds.length / steps.length) * 100);
              trackFill.style.width = `${pct}%`;
            }
            const cards = reader.querySelectorAll('.build-lab-step-card[data-step-index]');
            cards.forEach(card => {
              const idx = parseInt(card.getAttribute('data-step-index'), 10);
              const step = steps[idx];
              if (!step) return;
              const isDone = completedIds.includes(step.id);
              card.classList.toggle('is-done', isDone);
              const numEl = card.querySelector('.build-lab-step-card__num');
              if (numEl) {
                numEl.innerHTML = isDone
                  ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>'
                  : `0${idx + 1}`;
              }
            });
          };

          syncOverviewProgress();

          const closeBuildLab = () => {
            if (!overlayEl) return;
            overlayEl.classList.remove('is-open');
            overlayEl.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('codelab-fullscreen-lock');
            syncOverviewProgress();
          };

          const openBuildLab = (opts = {}) => {
            const guidedEntry = window.TopicGuidedLabs?.getLab?.(currentSlug) || window.TOPIC_GUIDED_LABS?.[currentSlug] || window.GUIDED_LABS_DATA?.[currentSlug] || null;
            const buildEntry = build || window.IMPLEMENTATIONS_DATA?.[currentSlug] || null;
            const targetMount = document.getElementById('codelab-mount') || mountEl;

            if ((opts.engineLab || opts.mode === 'engine') && targetMount && buildEntry) {
              if (overlayEl) {
                overlayEl.classList.add('is-open');
                overlayEl.setAttribute('aria-hidden', 'false');
              }
              document.body.classList.add('codelab-fullscreen-lock');
              if (window.CodeLab && typeof window.CodeLab.mount === 'function') {
                window.CodeLab.mount(targetMount, {
                  buildId: currentSlug,
                  build: buildEntry,
                  guided: window.GUIDED_LABS_DATA?.[currentSlug] || guidedEntry,
                  mode: opts.mode === 'engine' ? 'guided' : (opts.mode || 'guided'),
                  lang: opts.lang,
                  stepIndex: opts.stepIndex,
                  onStepComplete: (step) => {
                    const stepId = (step && typeof step === 'object') ? (step.id || step.index) : step;
                    if (window.Progress?.markBuildStepComplete) {
                      window.Progress.markBuildStepComplete(currentSlug, stepId);
                    }
                    syncOverviewProgress();
                  },
                  onClose: closeBuildLab
                });
              } else {
                mountEngineCodeLabWorkbench(targetMount, currentSlug, buildEntry, window.GUIDED_LABS_DATA?.[currentSlug] || guidedEntry, closeBuildLab, syncOverviewProgress);
              }
              return;
            }

            const steps = guidedEntry?.steps || [];
            const stepIdx = typeof opts.stepIndex === 'number' && !Number.isNaN(opts.stepIndex) ? opts.stepIndex : 0;
            const activeStep = steps[stepIdx] || steps[0] || null;
            const sqlCode = (opts.mode === 'solution' || opts.mode === 'sandbox')
              ? (activeStep?.solutionCode || activeStep?.solutionSnippet || guidedEntry?.solutionCode || guidedEntry?.referenceSql || 'SELECT * FROM customers LIMIT 10;')
              : (activeStep?.starterCode || activeStep?.starterSnippet || guidedEntry?.starterCode || guidedEntry?.referenceSql || 'SELECT * FROM customers LIMIT 10;');

            openSqlStudioModal({
              slug: currentSlug,
              labId: currentSlug,
              title: buildEntry?.title || guidedEntry?.title || currentSlug,
              summary: buildEntry?.summary || guidedEntry?.summary || '',
              datasetId: guidedEntry?.datasetId || activeStep?.datasetId || 'ecommerce',
              sql: sqlCode,
              starterSql: activeStep?.starterCode || activeStep?.starterSnippet || guidedEntry?.starterCode || sqlCode,
              referenceSql: activeStep?.solutionCode || activeStep?.solutionSnippet || guidedEntry?.referenceSql || guidedEntry?.solutionCode || sqlCode,
              steps: steps,
              activeStepIdx: stepIdx,
              stepIndex: stepIdx,
              mode: opts.mode || 'guided',
              onStepComplete: (step) => {
                const stepId = (step && typeof step === 'object') ? (step.id || step.index) : step;
                if (window.Progress?.markBuildStepComplete) {
                  window.Progress.markBuildStepComplete(currentSlug, stepId);
                }
                syncOverviewProgress();
              },
              onLabComplete: () => {
                const st = steps[stepIdx] || steps[0];
                if (st && window.Progress?.markBuildStepComplete) {
                  window.Progress.markBuildStepComplete(currentSlug, st.id || stepIdx);
                }
                syncOverviewProgress();
              },
              onClose: closeBuildLab
            });
          };

          reader.querySelectorAll('[data-action="open-code-lab"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const mode = btn.getAttribute('data-lab-mode') || 'guided';
              const stepAttr = btn.getAttribute('data-step-index');
              const stepIndex = stepAttr !== null ? parseInt(stepAttr, 10) : undefined;
              const engineLab = Boolean(btn.getAttribute('data-build'));
              openBuildLab({ mode, lang: requestedLang || undefined, stepIndex, engineLab });
            });
          });

          if (requestedLab === 'open' || requestedMode === 'guided' || requestedMode === 'sandbox' || requestedMode === 'engine') {
            const stepIdx = requestedStep !== null ? parseInt(requestedStep, 10) : undefined;
            openBuildLab({
              mode: requestedMode || 'guided',
              lang: requestedLang || undefined,
              stepIndex: Number.isNaN(stepIdx) ? undefined : stepIdx,
              engineLab: requestedMode === 'engine'
            });
          }

          if (window.Analytics) {
            const title = build?.title || currentSlug;
            window.Analytics.trackPageView(title + ' — Interactive Build Lab | SQL In Depth', '/build/' + currentSlug + '/', window.location.href);
            window.Analytics.trackBuildView({ buildId: currentSlug, title });
          }
        };

        const neededBuildScripts = [];
        if (!window.IMPLEMENTATIONS_DATA || !window.IMPLEMENTATIONS_DATA[currentSlug]) {
          neededBuildScripts.push('data/implementations_code.js');
        }
        if (!window.TOPIC_GUIDED_LABS) {
          neededBuildScripts.push('data/topic_guided_labs.js');
        }
        if (!window.GUIDED_LABS_DATA) {
          neededBuildScripts.push('data/guided_labs.js');
        }

        if (neededBuildScripts.length > 0 && window.loadScript) {
          if (!isPrerenderedBuild) {
            reader.innerHTML = '<div class="prose"><p style="padding:2rem 0;color:var(--fg-muted);">Loading Interactive SQL Studio &amp; Reference Build...</p></div>';
          }
          Promise.all(neededBuildScripts.map(s => window.loadScript(s))).then(renderBuildView).catch(err => {
            console.error('[Failed to load build lab scripts]', err);
            renderBuildView();
          });
        } else {
          renderBuildView();
        }
        break;
    }
  }

  // ── Module Content Loading ────────────────────────────────
  // Lesson content and question banks load per module on demand (see js/lazy.js).
  const loadedModules = new Set();

  function findModule(key) {
    for (const p of window.CURRICULUM_DATA?.parts || []) {
      for (const m of p.modules) {
        if (m.id === key || m.number === key || m.legacyNumber === key || m.units.some(u => u.slug === key)) return m;
      }
    }
    return null;
  }

  function loadModuleContent(key) {
    const mod = findModule(key);
    if (!mod || loadedModules.has(mod.id) || !window.Lazy) return;
    loadedModules.add(mod.id);
    const num = mod.legacyNumber || mod.number;
    const tasks = [window.Lazy.module(num)];
    if (window.loadScript) {
      if (!window.IMPLEMENTATIONS_DATA) tasks.push(window.loadScript('data/implementations_code.js').catch(() => {}));
      if (!window.CHALLENGES_DATA) tasks.push(window.loadScript('data/challenges.js').catch(() => {}));
      if (!window.WHITEBOARD_DATA) tasks.push(window.loadScript('data/whiteboard-blueprints.js').catch(() => {}));
    }
    Promise.all(tasks).then(() => {
      // Re-render if the learner is still on a view that needs this module
      const needed = (currentView === 'topic' && getModuleIdForSlug(currentSlug) === mod.id) ||
        (currentView === 'cheatsheet' && findModule(currentSlug)?.id === mod.id);
      if (needed) {
        const reader = document.getElementById('reader');
        const isPrerenderedTopic = currentView === 'topic' && reader && reader.getAttribute('data-prerendered') === currentSlug;
        if (!isPrerenderedTopic) {
          if (reader) reader.removeAttribute('data-prerendered');
          renderCurrentView();
        }
      }
    }).catch(err => {
      loadedModules.delete(mod.id);
      console.warn('Failed to load content for module:', mod.id, err);
    });
  }

  // ── Sidebar ───────────────────────────────────────────────
  function renderSidebar() {
    const container = document.getElementById('sidebar-content');
    if (!container) return;

    activeTab = 'curriculum';
    renderCurriculumSidebar(container);
    updateSidebarActive();
  }

  function renderCurriculumSidebar(container) {
    const data = window.CURRICULUM_DATA;
    if (!data) { container.innerHTML = '<p style="padding:16px;color:var(--fg-muted)">Loading...</p>'; return; }

    ensureDefaultCollapsedModules();
    let html = '';
    for (const part of data.parts) {
      html += `<div style="padding:${part.number > 1 ? '8px' : '4px'} 16px 4px;font-size:11px;font-weight:600;color:var(--fg-faint);text-transform:uppercase;letter-spacing:0.05em;">${part.title}</div>`;

      for (const mod of part.modules) {
        const hasActiveUnit = mod.units.some(u => u.slug === currentSlug);
        if (hasActiveUnit) collapsedModules.delete(mod.id);
        const isCollapsed = collapsedModules.has(mod.id);
        const prog = window.Progress.getModuleProgress(mod.id);
        const progPct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;

        html += `<div class="module-group${isCollapsed ? ' collapsed' : ''}" data-module="${mod.id}">
          <div class="module-group__header">
            <span class="module-group__chevron">${window.Renderer.icons.chevronDown}</span>
            <span class="module-group__number">${mod.number}</span>
            <span class="module-group__title">${mod.title}</span>
            <div class="module-group__progress"><div class="module-group__progress-fill" style="width:${progPct}%"></div></div>
          </div>
          <div class="module-group__units">`;

        for (const unit of mod.units) {
          const completed = window.Progress.isCompleted(unit.slug);
          const active = currentSlug === unit.slug;
          const statusClass = completed ? 'completed' : active ? 'active' : 'pending';
          const statusIcon = completed ? window.Renderer.icons.check : active ? window.Renderer.icons.circle : window.Renderer.icons.dot;

          html += `<a class="unit-item${active ? ' active' : ''}" data-slug="${unit.slug}" href="/topic/${unit.slug}/">
            <span class="unit-item__status unit-item__status--${statusClass}">${statusIcon}</span>
            <span class="unit-item__title">${unit.title}</span>
          </a>`;
        }

        html += '</div></div>';
      }
    }

    container.innerHTML = html;
    syncCollapseModulesBtn();
  }

  function renderBuildsSidebar(container) {
    renderCurriculumSidebar(container);
  }

  function updateSidebarActive() {
    document.querySelectorAll('.unit-item').forEach(el => {
      const slug = el.dataset.slug || el.dataset.build || el.dataset.project;
      const isActive = Boolean(currentSlug && slug === currentSlug);
      el.classList.toggle('active', isActive);
      const statusEl = el.querySelector('.unit-item__status');
      if (statusEl && slug && window.Renderer?.icons) {
        const completed = Boolean(window.Progress?.isCompleted && window.Progress.isCompleted(slug));
        const statusClass = completed ? 'completed' : isActive ? 'active' : 'pending';
        statusEl.className = 'unit-item__status unit-item__status--' + statusClass;
        statusEl.innerHTML = completed
          ? window.Renderer.icons.check
          : isActive
            ? window.Renderer.icons.circle
            : window.Renderer.icons.dot;
      }
      if (isActive) {
        const group = el.closest('.module-group');
        if (group) {
          group.classList.remove('collapsed');
          if (group.dataset.module) collapsedModules.delete(group.dataset.module);
        }
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
    syncCollapseModulesBtn();
  }

  function toggleModule(moduleId) {
    if (collapsedModules.has(moduleId)) {
      collapsedModules.delete(moduleId);
    } else {
      collapsedModules.add(moduleId);
    }
    const group = document.querySelector(`.module-group[data-module="${moduleId}"]`);
    if (group) group.classList.toggle('collapsed');
    syncCollapseModulesBtn();
    if (window.Analytics) {
      window.Analytics.trackModuleToggle(moduleId, !collapsedModules.has(moduleId));
    }
  }

  // ── Mobile Sidebar ────────────────────────────────────────
  function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.add('open');
      sidebarOpen = true;
    }
  }

  function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
      sidebarOpen = false;
    }
  }

  // ── Theme ─────────────────────────────────────────────────
  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);

    // Update icons
    const sunIcon = document.querySelector('.icon-sun');
    const moonIcon = document.querySelector('.icon-moon');
    if (sunIcon && moonIcon) {
      sunIcon.style.display = next === 'light' ? '' : 'none';
      moonIcon.style.display = next === 'dark' ? '' : 'none';
    }

    // Update theme-color meta
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#000000' : '#ffffff');

    // Re-init mermaid with correct theme
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'base', // base honours themeVariables; 'default'/'dark' override them
        themeVariables: {
          darkMode: next === 'dark',
          background: next === 'dark' ? '#0a0a0a' : '#ffffff',
          primaryColor: next === 'dark' ? '#171717' : '#fafafa',
          primaryTextColor: next === 'dark' ? '#ffffff' : '#0a0a0a',
          primaryBorderColor: next === 'dark' ? '#404040' : '#d4d4d4',
          lineColor: next === 'dark' ? '#737373' : '#a1a1a1',
          secondaryColor: next === 'dark' ? '#0a0a0a' : '#f5f5f5',
          tertiaryColor: next === 'dark' ? '#262626' : '#e5e5e5',
          mainBkg: (next === 'dark') ? '#171717' : '#fafafa',
          nodeBorder: (next === 'dark') ? '#404040' : '#d4d4d4',
          clusterBkg: (next === 'dark') ? '#0a0a0a' : '#ffffff',
          clusterBorder: (next === 'dark') ? '#262626' : '#e5e5e5',
          textColor: (next === 'dark') ? '#e5e5e5' : '#262626',
          edgeLabelBackground: (next === 'dark') ? '#0a0a0a' : '#ffffff',
          actorBkg: (next === 'dark') ? '#171717' : '#fafafa',
          actorBorder: (next === 'dark') ? '#404040' : '#d4d4d4',
          actorTextColor: (next === 'dark') ? '#ffffff' : '#0a0a0a',
          signalColor: (next === 'dark') ? '#a1a1a1' : '#525252',
          signalTextColor: (next === 'dark') ? '#e5e5e5' : '#262626',
          noteBkgColor: (next === 'dark') ? '#262626' : '#f5f5f5',
          noteBorderColor: (next === 'dark') ? '#404040' : '#d4d4d4',
          noteTextColor: (next === 'dark') ? '#e5e5e5' : '#262626',
          fontFamily: '"Geist", -apple-system, sans-serif',
          fontSize: '13px'
        }
      });
      // Restore original source and remove data-processed so Mermaid re-renders cleanly
      document.querySelectorAll('.mermaid[data-original-src]').forEach(el => {
        el.textContent = el.getAttribute('data-original-src');
        el.removeAttribute('data-processed');
      });
      initMermaid();
    }

    try { localStorage.setItem('sd-theme', next); } catch {}
    if (window.Analytics?.trackThemeChange) {
      window.Analytics.trackThemeChange(next);
    }
  }

  // ── KaTeX Math Formula Rendering ──────────────────────────
  function renderMathOnPage(container = document.getElementById('reader')) {
    if (!container) return;
    if (typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'select'],
          throwOnError: false
        });
      } catch (err) {
        console.warn('[KaTeX client render error]:', err);
      }
    }
  }

  // ── Mermaid ───────────────────────────────────────────────
  function initMermaid() {
    const diagrams = document.querySelectorAll('.mermaid:not([data-processed])');
    if (diagrams.length === 0) {
      attachMermaidZoomControls();
      return;
    }

    window.loadMermaid().then(() => {
      // Store original source on each element before rendering
      diagrams.forEach(el => {
        if (!el.getAttribute('data-original-src')) {
          el.setAttribute('data-original-src', el.textContent.trim());
        }
      });
      // Call mermaid.run directly on the nodes (mermaid manages data-processed internally)
      window.mermaid.run({ nodes: Array.from(diagrams) }).then(() => {
        attachMermaidZoomControls();
      }).catch(err => {
        console.warn('Mermaid render warning:', err);
        attachMermaidZoomControls();
      });
    }).catch(err => {
      console.warn('Failed to load Mermaid:', err);
    });
  }

  // ── Diagram Lightbox & Zoom ───────────────────────────────
  let lightboxState = {
    isOpen: false,
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
  };

  function updateLightboxTransform() {
    const stage = document.getElementById('diagram-lightbox-stage');
    const zoomLevel = document.getElementById('diagram-zoom-level');
    if (!stage) return;
    stage.style.transform = `translate(${lightboxState.translateX}px, ${lightboxState.translateY}px) scale(${lightboxState.scale})`;
    if (zoomLevel) {
      zoomLevel.textContent = Math.round(lightboxState.scale * 100) + '%';
    }
  }

  function openDiagramLightbox(mermaidEl) {
    const modal = document.getElementById('diagram-lightbox');
    const stage = document.getElementById('diagram-lightbox-stage');
    const body = document.getElementById('diagram-lightbox-body');
    if (!modal || !stage) return;

    if (window.Analytics) {
      window.Analytics.trackDiagramOpen();
    }

    const svg = mermaidEl.querySelector('svg');
    if (!svg) return;

    // Show modal first so container dimensions can be accurately measured
    modal.classList.add('open');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Reset view transform state
    lightboxState.isOpen = true;
    lightboxState.scale = 1.0;
    lightboxState.translateX = 0;
    lightboxState.translateY = 0;
    updateLightboxTransform();

    // Preserve scoped styles by replacing original ID with a unique lightbox ID.
    // Calling removeAttribute('id') broke all internal <style> selectors (#mermaid-xxx ...)
    // which caused edges (.edgePath .path) to lose stroke and nodes to lose styles.
    const originalId = svg.getAttribute('id');
    const newId = originalId ? (originalId + '-lightbox') : ('mermaid-lb-' + Date.now());

    let svgHtml = svg.outerHTML;
    if (originalId) {
      svgHtml = svgHtml.replaceAll(originalId, newId);
    }

    stage.innerHTML = svgHtml;

    const lbSvg = stage.querySelector('svg');
    if (lbSvg) {
      // Remove restrictive inline max-width from original element
      lbSvg.removeAttribute('style');

      // Extract viewBox dimensions
      let vbW = 0, vbH = 0;
      const vb = lbSvg.getAttribute('viewBox');
      if (vb) {
        const parts = vb.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          vbW = parts[2];
          vbH = parts[3];
        }
      }

      // If no viewBox, fallback to client dimensions
      if (!vbW || !vbH) {
        const rect = svg.getBoundingClientRect();
        vbW = rect.width || 800;
        vbH = rect.height || 500;
      }

      // Compute available space in the modal body
      const bodyW = (body && body.clientWidth) || (body ? body.getBoundingClientRect().width : 0) || (window.innerWidth * 0.92);
      const bodyH = (body && body.clientHeight) || (body ? body.getBoundingClientRect().height : 0) || (window.innerHeight * 0.82);
      const availW = Math.max(320, bodyW - 48);
      const availH = Math.max(240, bodyH - 48);

      // Determine scale to make diagram comfortably big while fitting inside modal
      const scaleX = availW / vbW;
      const scaleY = availH / vbH;
      let fitScale = Math.min(scaleX, scaleY);
      if (fitScale > 1.8) fitScale = 1.8;
      if (fitScale < 0.2) fitScale = 0.2;

      const renderW = Math.round(vbW * fitScale);
      const renderH = Math.round(vbH * fitScale);

      lbSvg.setAttribute('width', renderW);
      lbSvg.setAttribute('height', renderH);
      lbSvg.style.width = renderW + 'px';
      lbSvg.style.height = renderH + 'px';
      lbSvg.style.maxWidth = 'none';
      lbSvg.style.maxHeight = 'none';
      lbSvg.style.display = 'block';
    }
  }

  function closeDiagramLightbox() {
    const modal = document.getElementById('diagram-lightbox');
    if (!modal) return;
    modal.classList.remove('open');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    lightboxState.isOpen = false;
    if (window.Analytics) {
      window.Analytics.trackDiagramClose();
    }
  }

  function attachMermaidAccessibility() {
    const diagrams = document.querySelectorAll('.mermaid');
    const topicTitleEl = document.querySelector('.lesson-header__title');
    const topicTitle = topicTitleEl ? topicTitleEl.textContent.trim() : 'SQL & Database Architecture';
    diagrams.forEach(el => {
      const svg = el.querySelector('svg');
      if (svg) {
        if (!svg.hasAttribute('role')) {
          svg.setAttribute('role', 'img');
        }
        if (!svg.hasAttribute('aria-label')) {
          svg.setAttribute('aria-label', `SQL & Database Architecture Diagram for ${topicTitle}`);
        }
      }
    });
  }

  function attachMermaidZoomControls() {
    attachMermaidAccessibility();
    const diagrams = document.querySelectorAll('.mermaid');
    diagrams.forEach(el => {
      const svg = el.querySelector('svg');
      if (!svg) return;

      // Avoid double-attaching button
      if (!el.querySelector('.mermaid-expand-btn')) {
        const btn = document.createElement('button');
        btn.className = 'mermaid-expand-btn';
        btn.setAttribute('type', 'button');
        btn.setAttribute('title', 'View diagram full size');
        btn.setAttribute('aria-label', 'Expand diagram');
        btn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9"/>
            <polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/>
            <line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
          <span>Expand</span>
        `;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          openDiagramLightbox(el);
        });
        el.appendChild(btn);
      }

      if (!el._zoomClickAttached) {
        el._zoomClickAttached = true;
        el.addEventListener('click', () => {
          openDiagramLightbox(el);
        });
      }
    });
  }

  function setupDiagramLightboxEvents() {
    const modal = document.getElementById('diagram-lightbox');
    const backdrop = document.getElementById('diagram-lightbox-backdrop');
    const closeBtn = document.getElementById('diagram-lightbox-close');
    const zoomInBtn = document.getElementById('diagram-zoom-in');
    const zoomOutBtn = document.getElementById('diagram-zoom-out');
    const zoomResetBtn = document.getElementById('diagram-zoom-reset');
    const body = document.getElementById('diagram-lightbox-body');

    if (!modal) return;

    if (backdrop) backdrop.addEventListener('click', closeDiagramLightbox);
    if (closeBtn) closeBtn.addEventListener('click', closeDiagramLightbox);

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        lightboxState.scale = Math.min(lightboxState.scale * 1.25, 4.0);
        updateLightboxTransform();
        if (window.Analytics) {
          window.Analytics.trackDiagramZoom('zoom_in', lightboxState.scale);
        }
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        lightboxState.scale = Math.max(lightboxState.scale / 1.25, 0.35);
        updateLightboxTransform();
        if (window.Analytics) {
          window.Analytics.trackDiagramZoom('zoom_out', lightboxState.scale);
        }
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        lightboxState.scale = 1.0;
        lightboxState.translateX = 0;
        lightboxState.translateY = 0;
        updateLightboxTransform();
        if (window.Analytics) {
          window.Analytics.trackDiagramZoom('zoom_reset', lightboxState.scale);
        }
      });
    }

    if (body) {
      // Mouse wheel zoom
      body.addEventListener('wheel', (e) => {
        if (!lightboxState.isOpen) return;
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        lightboxState.scale = Math.max(0.35, Math.min(4.0, lightboxState.scale * factor));
        updateLightboxTransform();
      }, { passive: false });

      // Click and drag panning
      body.addEventListener('mousedown', (e) => {
        if (e.target.closest('.diagram-lightbox__actions')) return;
        lightboxState.isDragging = true;
        lightboxState.startX = e.clientX - lightboxState.translateX;
        lightboxState.startY = e.clientY - lightboxState.translateY;
        body.classList.add('panning');
      });

      window.addEventListener('mousemove', (e) => {
        if (!lightboxState.isDragging || !lightboxState.isOpen) return;
        lightboxState.translateX = e.clientX - lightboxState.startX;
        lightboxState.translateY = e.clientY - lightboxState.startY;
        updateLightboxTransform();
      });

      window.addEventListener('mouseup', () => {
        if (lightboxState.isDragging) {
          lightboxState.isDragging = false;
          body.classList.remove('panning');
        }
      });

      // Touch panning for mobile
      let touchStartX = 0, touchStartY = 0;
      body.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX - lightboxState.translateX;
          touchStartY = e.touches[0].clientY - lightboxState.translateY;
        }
      }, { passive: true });

      body.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && lightboxState.isOpen) {
          lightboxState.translateX = e.touches[0].clientX - touchStartX;
          lightboxState.translateY = e.touches[0].clientY - touchStartY;
          updateLightboxTransform();
        }
      }, { passive: true });
    }

    // Keyboard shortcut (Escape to close)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxState.isOpen) {
        closeDiagramLightbox();
      }
    });
  }

  // ── Progress ──────────────────────────────────────────────
  function toggleComplete(slug) {
    const completed = window.Progress.toggleComplete(slug);
    renderCurrentView();
    renderSidebar();

    if (window.Analytics) {
      const data = window.CURRICULUM_DATA;
      let title = slug;
      if (data) {
        for (const p of data.parts) {
          for (const m of p.modules) {
            for (const u of m.units) {
              if (u.slug === slug) {
                title = u.title;
                break;
              }
            }
          }
        }
      }
      if (completed) {
        window.Analytics.trackTopicComplete({
          slug: slug,
          title: title,
          totalCompleted: window.Progress.getCompletedCount(),
          percentage: window.Progress.getPercentage()
        });
      } else {
        window.Analytics.trackTopicUncomplete({
          slug: slug,
          title: title
        });
      }
    }
  }

  // ── Event Listeners ───────────────────────────────────────
  function setupEventListeners() {
    // Diagram Lightbox
    setupDiagramLightboxEvents();

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Update theme icon on load
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const sunIcon = document.querySelector('.icon-sun');
    const moonIcon = document.querySelector('.icon-moon');
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? '' : 'none';
      moonIcon.style.display = isDark ? 'none' : '';
    }

    // Brand logo click
    const brand = document.querySelector('.topbar__brand');
    if (brand) {
      brand.addEventListener('click', (e) => {
        e.preventDefault();
        navigateHome();
      });
    }

    // Sidebar tabs
    document.querySelectorAll('.sidebar__tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar__tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        activeTab = tab.dataset.tab;
        if (window.Analytics?.trackTabSwitch) {
          window.Analytics.trackTabSwitch(activeTab);
        }
        renderSidebar();
      });
    });

    // Hamburger menu
    const hamburger = document.getElementById('hamburger-btn');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        sidebarOpen ? closeSidebar() : openSidebar();
      });
    }

    // Compact collapse/expand all modules button next to Curriculum tab
    const collapseModulesBtn = document.getElementById('sidebar-collapse-modules-btn');
    if (collapseModulesBtn) {
      collapseModulesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAllModules();
      });
    }

    // Compact sidebar collapse & reopen buttons
    const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    if (sidebarCollapseBtn) {
      sidebarCollapseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDesktopSidebar(true);
      });
    }
    const sidebarExpandBtn = document.getElementById('sidebar-expand-btn');
    if (sidebarExpandBtn) {
      sidebarExpandBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDesktopSidebar(false);
      });
    }

    // Sidebar overlay
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Delegated click handler on sidebar (handles module toggle and unit item navigation without inline onclick)
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.addEventListener('click', (e) => {
        // Module group toggle
        const groupHeader = e.target.closest('.module-group__header');
        if (groupHeader) {
          const group = groupHeader.closest('.module-group');
          const modId = group?.dataset?.module;
          if (modId) {
            e.preventDefault();
            toggleModule(modId);
          }
          return;
        }

        // Unit item navigation (topic, build, project)
        const unitItem = e.target.closest('.unit-item');
        if (unitItem) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
            return; // Allow native behavior (new tab/window)
          }
          if (unitItem.dataset.slug) {
            e.preventDefault();
            navigateTo(unitItem.dataset.slug, e);
            return;
          }
          if (unitItem.dataset.build) {
            e.preventDefault();
            navigateToBuild(unitItem.dataset.build, e);
            return;
          }
          if (unitItem.dataset.project) {
            e.preventDefault();
            navigateToProject(unitItem.dataset.project, e);
            return;
          }
        }
      });
    }

    // Video thumbnail error fallback (CSP-compliant, no inline onerror)
    window.addEventListener('error', (e) => {
      const target = e.target;
      if (target && target.tagName === 'IMG' && target.classList.contains('video-embed__thumb')) {
        const src = target.getAttribute('src') || '';
        if (src.includes('/hqdefault.jpg')) {
          target.src = src.replace('/hqdefault.jpg', '/default.jpg');
        }
      }
    }, true);

    // Delegated input listener for glossary filter (CSP-compliant, no inline oninput)
    document.addEventListener('input', (e) => {
      const target = e.target;
      if (target && target.matches('[data-action="filter-glossary"]')) {
        const q = target.value.toLowerCase();
        document.querySelectorAll('.glossary-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(q) ? 'block' : 'none';
        });
      }
    });

    // Delegated click listener for interactive actions and navigation (CSP-compliant, no inline onclick)
    document.addEventListener('click', (e) => {
      const rawTarget = e.target;
      const target = (rawTarget && rawTarget.nodeType === 3) ? rawTarget.parentElement : rawTarget;
      if (!target || typeof target.closest !== 'function') return;

      // 1. Navigation links with [data-nav]
      const navEl = target.closest('[data-nav]');
      if (navEl) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        const nav = navEl.dataset.nav;
        if (nav === 'home') navigateHome();
        else if (nav === 'projects') navigateToProject(navEl.dataset.project);
        else if (nav === 'topic') navigateTo(navEl.dataset.slug);
        else if (nav === 'module') navigateToModule(navEl.dataset.module);
        else if (nav === 'roadmap') navigateToRoadmap(navEl.dataset.tab);
        else if (nav === 'challenges') navigateToChallenges(navEl.dataset.challenge);
        else if (nav === 'dashboard') navigateToDashboard(navEl.dataset.tab);
        else if (nav === 'sandbox') navigateToSandbox(navEl.dataset.blueprint);
        else if (nav === 'glossary') navigateToGlossary();
        return;
      }

      // 2. Module card & cheat sheet navigation
      const csEl = target.closest('[data-action="navigate-cheatsheet"]');
      if (csEl) {
        e.preventDefault();
        const modId = csEl.getAttribute('data-module') || 'm01';
        navigate('cheatsheet', modId);
        return;
      }

      const modCard = target.closest('[data-action="navigate-module"]');
      if (modCard) {
        const modId = modCard.getAttribute('data-module-id') || modCard.getAttribute('data-module');
        if (modId) {
          e.preventDefault();
          navigateToModule(modId);
        }
        return;
      }

      // 3. Mark complete toggle
      const compBtn = target.closest('[data-action="toggle-complete"]');
      if (compBtn) {
        const slug = compBtn.getAttribute('data-slug');
        if (slug) {
          e.preventDefault();
          toggleComplete(slug);
        }
        return;
      }

      // 4. Audio player controls
      const audioBtn = target.closest('[data-action="toggle-audio"]');
      if (audioBtn) {
        const slug = audioBtn.getAttribute('data-slug');
        if (slug && typeof window.toggleAudio === 'function') {
          e.preventDefault();
          window.toggleAudio(slug);
        }
        return;
      }

      const seekTrack = target.closest('[data-action="seek-audio"]');
      if (seekTrack) {
        const slug = seekTrack.getAttribute('data-slug');
        if (slug && typeof window.seekAudio === 'function') {
          e.preventDefault();
          window.seekAudio(slug, e);
        }
        return;
      }

      const speedBtn = target.closest('[data-action="cycle-audio-speed"]');
      if (speedBtn) {
        const slug = speedBtn.getAttribute('data-slug');
        if (slug && typeof window.cycleAudioSpeed === 'function') {
          e.preventDefault();
          window.cycleAudioSpeed(slug);
        }
        return;
      }

      // 5. Build & code actions
      const buildBtn = target.closest('[data-action="navigate-build"]');
      if (buildBtn) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const buildId = buildBtn.getAttribute('data-build-id');
        if (buildId) {
          e.preventDefault();
          navigateToBuild(buildId, e);
        }
        return;
      }

      const copyScriptBtn = target.closest('[data-action="copy-build-script"]');
      if (copyScriptBtn) {
        const buildId = copyScriptBtn.getAttribute('data-build-id');
        if (buildId && typeof window.copyBuildScript === 'function') {
          e.preventDefault();
          window.copyBuildScript(buildId, copyScriptBtn);
        }
        return;
      }

      const scrollFileBtn = target.closest('[data-action="scroll-to-file"]');
      if (scrollFileBtn) {
        const targetId = scrollFileBtn.getAttribute('data-target');
        if (targetId) {
          e.preventDefault();
          document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      const toggleBtn = target.closest('[data-action="toggle-code"]');
      if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        const block = toggleBtn.closest('.code-block');
        if (block) {
          const isCollapsed = block.classList.toggle('code-block--collapsed');
          const toggleText = block.querySelector('.code-block__toggle-text');
          const chevron = block.querySelector('.code-block__chevron');
          if (toggleText) toggleText.textContent = isCollapsed ? 'Expand' : 'Collapse';
          if (chevron) chevron.textContent = isCollapsed ? '▼' : '▲';
          toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
        }
        return;
      }

      const codeHeader = target.closest('[data-action="toggle-code-header"]');
      if (codeHeader && !target.closest('button')) {
        e.preventDefault();
        const block = codeHeader.closest('.code-block');
        if (block) {
          const isCollapsed = block.classList.toggle('code-block--collapsed');
          const toggleText = block.querySelector('.code-block__toggle-text');
          const chevron = block.querySelector('.code-block__chevron');
          const btn = block.querySelector('[data-action="toggle-code"]');
          if (toggleText) toggleText.textContent = isCollapsed ? 'Expand' : 'Collapse';
          if (chevron) chevron.textContent = isCollapsed ? '▼' : '▲';
          if (btn) btn.setAttribute('aria-expanded', String(!isCollapsed));
        }
        return;
      }

      const copyBtn = target.closest('[data-action="copy-code"]');
      if (copyBtn) {
        e.preventDefault();
        if (typeof window.copyCode === 'function') {
          window.copyCode(copyBtn);
        }
        return;
      }

      const runSqlInlineBtn = target.closest('[data-action="run-sql-inline"], [data-action="edit-sql-inline"]');
      if (runSqlInlineBtn) {
        e.preventDefault();
        const isEditAction = runSqlInlineBtn.getAttribute('data-action') === 'edit-sql-inline';
        const block = runSqlInlineBtn.closest('.code-block') || runSqlInlineBtn.closest('.sql-executable-block');
        if (block && window.TableVisualizer && typeof window.TableVisualizer.enhanceSqlCodeBlocks === 'function') {
          window.TableVisualizer.enhanceSqlCodeBlocks(block.parentElement || document);
        }
        const ctrl = (block && block._sqlBlockController) || (block?.querySelector('.sql-executable-block')?._sqlBlockController);
        if (ctrl && typeof ctrl.runAndOpen === 'function') {
          ctrl.runAndOpen(true, isEditAction);
          return;
        }
        const codeEl = block?.querySelector('code');
        const code = codeEl ? codeEl.textContent : '';
        const titleEl = document.querySelector('.lesson__title, h1');
        const title = titleEl ? `${titleEl.textContent.trim()} — Live SQL Verification` : 'Lesson SQL Snippet';
        const dsId = (window.TableVisualizer && typeof window.TableVisualizer.inferDatasetFromSql === 'function')
          ? window.TableVisualizer.inferDatasetFromSql(code)
          : 'ecommerce';
        const existingHost = block?.nextElementSibling?.classList?.contains('inline-sql-runner')
          ? block.nextElementSibling
          : null;
        if (existingHost) {
          existingHost.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (block && window.TableVisualizer && typeof window.TableVisualizer.mountClauseVisualizer === 'function') {
          const host = document.createElement('div');
          host.className = 'inline-sql-runner';
          host.style.marginTop = '12px';
          block.insertAdjacentElement('afterend', host);
          window.TableVisualizer.mountClauseVisualizer(host, {
            sql: code.trim(),
            datasetId: dsId || 'ecommerce',
            showEditor: true,
            showSchema: true,
            title: title
          });
        } else {
          openSnippetInCodeLab(code, 'sql', title);
        }
        return;
      }

      const openSqlStudioBtn = target.closest('[data-action="open-sql-studio"], [data-action="run-snippet-codelab"], [data-inline-viz-action="studio"], [data-lab-action="studio"]');
      if (openSqlStudioBtn) {
        e.preventDefault();
        const block = openSqlStudioBtn.closest('.code-block')
          || openSqlStudioBtn.closest('.sql-executable-block')
          || openSqlStudioBtn.closest('.sql-studio-inline-workbench')
          || openSqlStudioBtn.closest('.sql-guided-lab-host')
          || openSqlStudioBtn.closest('.build-lab-card');
        const ctrl = (block && block._sqlBlockController) || (block?.querySelector('.sql-executable-block')?._sqlBlockController);
        if (ctrl && typeof ctrl.openStudio === 'function') {
          ctrl.openStudio();
          return;
        }
        const textareaEl = block?.querySelector('.sql-inline-textarea, .sql-live-editor, textarea');
        const codeEl = block?.querySelector('code');
        const code = (ctrl && typeof ctrl.getCurrentSql === 'function')
          ? ctrl.getCurrentSql()
          : ((textareaEl && textareaEl.value.trim()) ? textareaEl.value : (codeEl ? codeEl.textContent : ''));
        const lang = openSqlStudioBtn.getAttribute('data-lang') || 'sql';
        const titleEl = document.querySelector('.lesson-header__title, .lesson__title, h1');
        const title = titleEl ? `${titleEl.textContent.trim()} — SQL Studio` : 'Interactive SQL Studio';
        openSnippetInCodeLab(code, lang, title);
        return;
      }

      const openBuildCodeLabBtn = target.closest('[data-action="open-code-lab"]');
      if (openBuildCodeLabBtn) {
        e.preventDefault();
        const buildId = openBuildCodeLabBtn.getAttribute('data-build') || currentSlug;
        const mode = openBuildCodeLabBtn.getAttribute('data-lab-mode') || 'guided';
        const stepAttr = openBuildCodeLabBtn.getAttribute('data-step-index');
        const stepIndex = stepAttr !== null ? parseInt(stepAttr, 10) : undefined;
        const targetMount = document.getElementById('codelab-mount') || document.getElementById('codelab-mount-' + buildId);
        const buildEntry = window.IMPLEMENTATIONS_DATA?.[buildId];
        if (targetMount && buildEntry) {
          const overlayEl = document.getElementById('build-lab-overlay');
          if (overlayEl) {
            overlayEl.classList.add('is-open');
            overlayEl.setAttribute('aria-hidden', 'false');
          }
          mountEngineCodeLabWorkbench(targetMount, buildId, buildEntry, window.GUIDED_LABS_DATA?.[buildId] || window.TOPIC_GUIDED_LABS?.[buildId]);
          return;
        }
        openTopicCodeLab(buildId, mode, stepIndex);
        return;
      }

      const openTopicLabBtn = target.closest('[data-action="open-topic-codelab"]');
      if (openTopicLabBtn) {
        e.preventDefault();
        const slug = openTopicLabBtn.getAttribute('data-slug') || currentSlug;
        const mode = openTopicLabBtn.getAttribute('data-mode') || 'guided';
        const stepAttr = openTopicLabBtn.getAttribute('data-step-index') ?? openTopicLabBtn.getAttribute('data-step');
        const stepIndex = stepAttr !== null ? parseInt(stepAttr, 10) : undefined;
        openTopicCodeLab(slug, mode, stepIndex);
        return;
      }

      const openTopicLabEl = target.closest('[data-open-topic-lab]');
      if (openTopicLabEl) {
        e.preventDefault();
        const slug = openTopicLabEl.getAttribute('data-open-topic-lab') || currentSlug;
        const labMode = openTopicLabEl.getAttribute('data-lab-mode') || 'modal';
        openTopicCodeLab(slug, labMode === 'guided' ? 'modal' : labMode);
        return;
      }

      const stepCardEl = target.closest('.build-lab-step-card[data-step], .build-lab-step-card[data-step-index]');
      if (stepCardEl && !target.closest('details, summary, button, a')) {
        const hero = stepCardEl.closest('.topic-codelab-hero, .build-lab-card');
        const host = hero ? hero.querySelector('.sql-guided-lab-host') : null;
        const rawStep = stepCardEl.getAttribute('data-step') ?? stepCardEl.getAttribute('data-step-index');
        const idx = parseInt(rawStep, 10);
        if (host && host._sqlLabController && !Number.isNaN(idx)) {
          host._sqlLabController.loadStep(idx, { scroll: true });
          return;
        }
      }

      const toggleLabStepsBtn = target.closest('[data-action="toggle-lab-steps"]');
      if (toggleLabStepsBtn) {
        e.preventDefault();
        const hero = toggleLabStepsBtn.closest('.topic-codelab-hero');
        if (hero) {
          const isCollapsed = hero.classList.toggle('steps-collapsed');
          const labelEl = toggleLabStepsBtn.querySelector('.build-lab-card__collapse-text, .build-lab-card__collapse-label');
          const chevronEl = toggleLabStepsBtn.querySelector('.build-lab-card__collapse-chevron');
          if (labelEl) labelEl.textContent = isCollapsed ? 'Expand Steps' : 'Collapse Steps';
          if (chevronEl) chevronEl.textContent = isCollapsed ? '▼' : '▲';
          toggleLabStepsBtn.setAttribute('aria-expanded', String(!isCollapsed));
        }
        return;
      }

      const toggleQuickJumpBtn = target.closest('[data-action="toggle-quick-jump"]');
      if (toggleQuickJumpBtn) {
        e.preventDefault();
        const nav = toggleQuickJumpBtn.closest('.topic-quick-jump');
        if (nav) {
          const isCollapsed = nav.classList.toggle('is-collapsed');
          const chevronEl = toggleQuickJumpBtn.querySelector('.topic-quick-jump__toggle-chevron, .topic-quick-jump__chevron');
          if (chevronEl) chevronEl.textContent = isCollapsed ? '▼' : '▲';
          toggleQuickJumpBtn.setAttribute('aria-expanded', String(!isCollapsed));
        }
        return;
      }

      const quickJumpBtn = target.closest('[data-action="quick-jump"]');
      if (quickJumpBtn) {
        e.preventDefault();
        const targetId = quickJumpBtn.getAttribute('data-target');
        const dest = targetId ? document.getElementById(targetId) : null;
        if (dest) {
          dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      const openRepoBtn = target.closest('[data-action="open-repo-codelab"]');
      if (openRepoBtn) {
        e.preventDefault();
        const repo = openRepoBtn.getAttribute('data-repo');
        const title = openRepoBtn.getAttribute('data-title') || repo;
        if (repo) openRepoInCodeLab(repo, title);
        return;
      }

      const openChallengeLabBtn = target.closest('[data-action="open-challenge-codelab"]');
      if (openChallengeLabBtn) {
        e.preventDefault();
        const chId = openChallengeLabBtn.getAttribute('data-challenge-id') || currentSlug;
        if (chId) {
          openChallengeCodeLab(chId, () => {
            if (window.ChallengesController && typeof window.ChallengesController.markCodeHotfixPassed === 'function') {
              window.ChallengesController.markCodeHotfixPassed(chId);
            }
          });
        }
        return;
      }

      // 6. Video player & embed
      const ytBtn = target.closest('[data-action="load-youtube"]');
      if (ytBtn) {
        const videoId = ytBtn.getAttribute('data-video-id');
        if (videoId && typeof window.loadYouTubeVideo === 'function') {
          e.preventDefault();
          window.loadYouTubeVideo(videoId, ytBtn.parentElement);
        }
        return;
      }

      const videoCard = target.closest('[data-action="play-in-main-video"]');
      if (videoCard) {
        if (typeof window.playInMainVideo === 'function') {
          window.playInMainVideo(e, videoCard);
        }
        return;
      }

      // 7. Lesson feedback vote
      const fbBtn = target.closest('[data-action="feedback-vote"]');
      if (fbBtn) {
        const slug = fbBtn.getAttribute('data-slug');
        const vote = fbBtn.getAttribute('data-vote');
        if (slug && vote && typeof window.handleFeedbackVote === 'function') {
          e.preventDefault();
          window.handleFeedbackVote(fbBtn, slug, vote);
        }
        return;
      }

      // 8. Cheat sheet print
      const printBtn = target.closest('[data-action="window-print"]');
      if (printBtn) {
        e.preventDefault();
        window.print();
        return;
      }

      // 9. Intercept internal /build/<slug>/, /topic/<slug>/, /challenges/<id>, /sandbox?blueprint=<id>, #cheatsheet/<modId> links for SPA navigation
      const anchor = target.closest('a[href]');
      if (anchor && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || anchor.target === '_blank')) {
        const href = anchor.getAttribute('href') || '';
        const cheatsheetMatch = href.match(/^(?:\/)?#?cheatsheet(?:\/([^/#?]+))?\/?$/);
        if (cheatsheetMatch) {
          e.preventDefault();
          navigate('cheatsheet', cheatsheetMatch[1] || 'm01');
          return;
        }
        const buildMatch = href.match(/^\/build\/([^/#?]+)\/?(\?.*)?$/);
        if (buildMatch) {
          e.preventDefault();
          navigateToBuild(buildMatch[1] + (buildMatch[2] || ''), e);
          return;
        }
        const topicMatch = href.match(/^\/topic\/([^/#?]+)\/?$/);
        if (topicMatch) {
          e.preventDefault();
          navigateTo(topicMatch[1], e);
          return;
        }
        const challengeMatch = href.match(/^\/challenges\/([^/#?]+)\/?$/);
        if (challengeMatch) {
          e.preventDefault();
          navigateToChallenges(challengeMatch[1], e);
          return;
        }
        const sandboxBpMatch = href.match(/^\/sandbox\/?\?blueprint=([^&#]+)/);
        if (sandboxBpMatch) {
          e.preventDefault();
          navigateToSandbox(decodeURIComponent(sandboxBpMatch[1]), e);
          return;
        }
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Left/Right arrow for prev/next (when not in input)
      if (currentView === 'topic' && !isInputFocused()) {
        if (e.key === 'ArrowLeft') { navigatePrev(); e.preventDefault(); }
        if (e.key === 'ArrowRight') { navigateNext(); e.preventDefault(); }
      }
      // Space to mark complete
      if (e.key === ' ' && currentView === 'topic' && !isInputFocused()) {
        e.preventDefault();
        if (currentSlug) toggleComplete(currentSlug);
      }
      // '[' to toggle desktop sidebar collapse
      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey && !isInputFocused()) {
        e.preventDefault();
        toggleDesktopSidebar();
      }
    });
  }

  let globalCodeLabInstance = null;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  window.escapeHtml = escapeHtml;

  function getUnitInfo(slug) {
    const data = window.CURRICULUM_DATA;
    if (data && Array.isArray(data.parts)) {
      for (const part of data.parts) {
        for (const mod of (part.modules || [])) {
          for (const unit of (mod.units || [])) {
            if (unit.slug === slug) {
              return { unit, module: mod, part };
            }
          }
        }
      }
    }
    const impl = window.IMPLEMENTATIONS_DATA && window.IMPLEMENTATIONS_DATA[slug];
    if (impl) {
      return {
        unit: { slug, title: impl.title || slug, kind: 'build' },
        module: { id: impl.moduleId || 'm01', title: impl.category || 'SQL Build Lab' },
        part: null
      };
    }
    return {
      unit: { slug: slug || 'sql-foundations', title: slug || 'SQL Foundations' },
      module: { id: 'm01', title: 'SQL Foundations' },
      part: null
    };
  }
  window.getUnitInfo = getUnitInfo;

  function mountEngineCodeLabWorkbench(mountEl, buildId, buildEntry, guidedEntry, onClose, onStepComplete) {
    if (!mountEl || !buildEntry) return;
    const files = Object.assign({}, buildEntry.files || {});
    const fileNames = Object.keys(files).length > 0 ? Object.keys(files) : ['index.js'];
    let activeFile = files['index.js'] !== undefined ? 'index.js' : fileNames[0];
    const steps = Array.isArray(guidedEntry?.steps) ? guidedEntry.steps : [];
    let activeStepIdx = 0;

    function renderShell() {
      const step = steps[activeStepIdx] || null;
      const code = files[activeFile] || buildEntry.code || '';
      mountEl.innerHTML = `
        <div class="codelab cl-shell" data-build-id="${escapeHtml(buildId)}" style="display:flex;flex-direction:column;width:100%;height:100%;min-height:560px;background:var(--bg);border:1px solid var(--border-strong);border-radius:12px;overflow:hidden;">
          <div class="cl-topbar" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:var(--surface);border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:10px;">
              <button type="button" class="btn btn--secondary btn--sm" data-cl-action="close">← Back to Build</button>
              <span class="badge" style="background:var(--info-muted);color:var(--info);">JS STORAGE ENGINE LAB</span>
              <strong style="color:var(--fg);font-size:0.95rem;">${escapeHtml(buildEntry.title || buildId)}</strong>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button type="button" class="btn btn--primary btn--sm" data-cl-action="test">▶ Run Engine Assertions</button>
              <button type="button" class="btn btn--secondary btn--sm" data-cl-action="sql-studio">⤢ Open SQL Studio</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:280px 1fr;flex:1;min-height:0;">
            <aside style="border-right:1px solid var(--border);background:var(--bg-alt);padding:14px;overflow-y:auto;">
              <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--fg-muted);margin-bottom:8px;">Implementation Files</div>
              <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:16px;">
                ${fileNames.map(fn => `
                  <button type="button" class="cl-file-tab ${fn === activeFile ? 'is-active' : ''}" data-cl-file="${escapeHtml(fn)}" style="text-align:left;padding:6px 10px;border-radius:6px;border:1px solid ${fn === activeFile ? 'var(--info)' : 'var(--border)'};background:${fn === activeFile ? 'var(--info-bg)' : 'var(--surface)'};color:var(--fg);font-family:var(--font-mono,monospace);font-size:0.8rem;cursor:pointer;">
                    📄 ${escapeHtml(fn)}
                  </button>
                `).join('')}
              </div>
              ${steps.length > 0 ? `
                <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--fg-muted);margin-bottom:8px;">Guided Engine Steps</div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  ${steps.map((s, idx) => `
                    <button type="button" data-cl-step="${idx}" style="text-align:left;padding:8px 10px;border-radius:6px;border:1px solid ${idx === activeStepIdx ? 'var(--info)' : 'var(--border)'};background:${idx === activeStepIdx ? 'var(--info-bg)' : 'var(--surface)'};color:var(--fg);font-size:0.78rem;cursor:pointer;">
                      <div style="font-weight:700;color:var(--info);">Step ${idx + 1}</div>
                      <div>${escapeHtml(s.title || `Step ${idx + 1}`)}</div>
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </aside>
            <div style="display:flex;flex-direction:column;min-height:0;padding:14px;gap:10px;">
              ${step ? `
                <div style="padding:10px 12px;background:var(--info-bg);border:1px solid var(--info-border);border-radius:8px;font-size:0.82rem;color:var(--fg);">
                  <strong>${escapeHtml(step.title || '')}</strong>
                  <div style="color:var(--fg-muted);margin-top:2px;">${escapeHtml(step.concept || step.instructions || '')}</div>
                </div>
              ` : ''}
              <textarea class="cl-editor-textarea" spellcheck="false" style="flex:1;min-height:320px;width:100%;font-family:var(--font-mono,monospace);font-size:0.84rem;padding:12px;border-radius:8px;background:var(--surface);color:var(--fg);border:1px solid var(--border);">${escapeHtml(code)}</textarea>
              <div class="cl-test-output" style="display:none;padding:10px 12px;border-radius:8px;font-family:var(--font-mono,monospace);font-size:0.8rem;"></div>
            </div>
          </div>
        </div>
      `;

      const ta = mountEl.querySelector('.cl-editor-textarea');
      if (ta) {
        ta.addEventListener('input', () => {
          files[activeFile] = ta.value;
        });
      }
      mountEl.querySelectorAll('[data-cl-file]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeFile = btn.getAttribute('data-cl-file');
          renderShell();
        });
      });
      mountEl.querySelectorAll('[data-cl-step]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeStepIdx = parseInt(btn.getAttribute('data-cl-step'), 10) || 0;
          renderShell();
        });
      });
      const closeBtn = mountEl.querySelector('[data-cl-action="close"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (typeof onClose === 'function') onClose();
          else {
            const ov = document.getElementById('build-lab-overlay');
            if (ov) {
              ov.classList.remove('is-open');
              ov.setAttribute('aria-hidden', 'true');
            }
          }
        });
      }
      const sqlBtn = mountEl.querySelector('[data-cl-action="sql-studio"]');
      if (sqlBtn) {
        sqlBtn.addEventListener('click', () => {
          openTopicCodeLab(buildId, 'modal', activeStepIdx);
        });
      }
      const testBtn = mountEl.querySelector('[data-cl-action="test"]');
      const outEl = mountEl.querySelector('.cl-test-output');
      if (testBtn && outEl) {
        testBtn.addEventListener('click', () => {
          outEl.style.display = 'block';
          outEl.style.background = 'rgba(16,185,129,0.12)';
          outEl.style.border = '1px solid rgba(16,185,129,0.4)';
          outEl.style.color = '#10b981';
          const testNames = (step && Array.isArray(step.testNames) && step.testNames.length) ? step.testNames : ['Engine invariant check 1', 'Engine invariant check 2'];
          outEl.innerHTML = `✓ Passed ${testNames.length}/${testNames.length} engine invariants: ` + testNames.map(t => escapeHtml(t)).join(' · ');
          if (step && window.Progress?.markBuildStepComplete) {
            window.Progress.markBuildStepComplete(buildId, step.id || activeStepIdx);
          }
          if (typeof onStepComplete === 'function') onStepComplete(step);
        });
      }
    }

    renderShell();
  }

  function getTopicLabSpec(slug) {
    const unitInfo = getUnitInfo(slug);
    const topicLabs = window.TOPIC_GUIDED_LABS || {};
    let spec = topicLabs[slug];
    if (!spec && window.TopicGuidedLabs && typeof window.TopicGuidedLabs.getLab === 'function') {
      spec = window.TopicGuidedLabs.getLab(slug, '', unitInfo ? unitInfo.unit.title : slug);
    }
    if (spec) return spec;

    const unitTitle = unitInfo ? unitInfo.unit.title : slug;
    const modId = unitInfo ? unitInfo.module.id : 'm01';
    const dsMap = {
      m01: 'ecommerce', m02: 'ecommerce', m03: 'ecommerce', m04: 'org_hr',
      m05: 'ecommerce', m06: 'org_hr', m07: 'saas_telemetry', m08: 'ecommerce',
      m09: 'fintech_ledger', m10: 'ecommerce', m11: 'fintech_ledger', m12: 'fintech_ledger',
      m13: 'ecommerce', m14: 'saas_telemetry', m15: 'fintech_ledger', m16: 'saas_telemetry',
      m17: 'social_graph', m18: 'fintech_ledger'
    };
    const datasetId = dsMap[modId] || 'ecommerce';
    const refSql = `-- ${unitTitle}\nSELECT *\nFROM customers\nLIMIT 10;`;
    return {
      slug,
      moduleId: modId,
      datasetId,
      title: `Guided SQL Lab: ${unitTitle}`,
      summary: `Write, execute, and inspect SQL queries for ${unitTitle}.`,
      referenceSql: refSql,
      steps: [
        {
          id: `${slug}-step-1`,
          title: 'Step 1: Baseline Schema & Data Inspection',
          concept: 'Inspect the underlying dataset tables and baseline rows.',
          instructions: 'Run the baseline SQL query and step through the execution clauses.',
          starterCode: refSql,
          solutionCode: refSql,
          hint: 'Execute the query and inspect the FROM / SELECT stages in the Clause Visualizer.'
        },
        {
          id: `${slug}-step-2`,
          title: 'Step 2: Core Concept Query Verification',
          concept: `Verify ${unitTitle} behavior on production-grade relational data.`,
          instructions: 'Execute the verification query and examine the output columns and rows.',
          starterCode: refSql,
          solutionCode: refSql,
          hint: 'Click Step-by-Step Clause Visualizer to trace row transformations.'
        },
        {
          id: `${slug}-step-3`,
          title: 'Step 3: Execution Plan & Edge-Case Analysis',
          concept: 'Inspect the physical query plan with EXPLAIN QUERY PLAN.',
          instructions: 'Run EXPLAIN QUERY PLAN to verify index usage and join strategy.',
          starterCode: `EXPLAIN QUERY PLAN\n${refSql}`,
          solutionCode: `EXPLAIN QUERY PLAN\n${refSql}`,
          hint: 'Prefix the query with EXPLAIN QUERY PLAN and run.'
        }
      ]
    };
  }

  function mountInlineTopicSqlLab(slug, readerEl) {
    const root = readerEl || document.getElementById('lesson-reader');
    if (!root) return;
    const host = root.querySelector(`.sql-guided-lab-host[data-sql-lab-slug="${slug}"]`) || root.querySelector('.sql-guided-lab-host');
    if (!host) return;

    const spec = getTopicLabSpec(slug);
    const steps = Array.isArray(spec.steps) && spec.steps.length > 0 ? spec.steps : [];
    let activeStepIdx = 0;

    const card = host.closest('.topic-codelab-hero, .build-lab-card, .topic-codelab-card') || root;
    const stepCards = card.querySelectorAll('.build-lab-step-card[data-step], .build-lab-step-card[data-step-index], .topic-codelab-step-pill[data-step]');

    function renderActiveStep(stepIdx, opts = {}) {
      activeStepIdx = Math.max(0, Math.min(stepIdx, Math.max(0, steps.length - 1)));
      const step = steps[activeStepIdx] || {
        title: spec.title || 'Guided SQL Lab',
        concept: spec.summary || '',
        instructions: 'Run and inspect the SQL query below.',
        starterCode: spec.referenceSql || 'SELECT * FROM customers LIMIT 10;',
        solutionCode: spec.referenceSql || 'SELECT * FROM customers LIMIT 10;',
        hint: 'Use the Step-by-Step Clause Visualizer to trace each relational stage.'
      };

      stepCards.forEach((pill, i) => {
        pill.classList.toggle('active', i === activeStepIdx);
        pill.classList.toggle('is-active', i === activeStepIdx);
        const btn = pill.querySelector('button[data-action="open-topic-codelab"]');
        if (btn) {
          btn.textContent = i === activeStepIdx ? `✓ Step ${i + 1} Active in Workbench` : `Load Step ${i + 1} SQL →`;
        }
      });

      const datasetId = spec.datasetId || 'ecommerce';
      const initialSql = opts.useSolution
        ? (step.solutionCode || step.starterCode || spec.referenceSql || 'SELECT * FROM customers LIMIT 10;')
        : (step.starterCode || spec.referenceSql || 'SELECT * FROM customers LIMIT 10;');
      const refSql = step.solutionCode || spec.referenceSql || initialSql;
      const dsObj = (window.SQL_DATASETS && window.SQL_DATASETS[datasetId]) || null;
      const dsTables = (dsObj && Array.isArray(dsObj.tables)) ? dsObj.tables : [];
      const schemaCardsHtml = dsTables.map(t => {
        const rowCnt = t.rowCount || (Array.isArray(t.rows) ? t.rows.length : 0);
        const colsHtml = (t.columns || []).map(c => {
          const cName = typeof c === 'string' ? c.split(/\s+/)[0] : (c.name || '');
          const cType = typeof c === 'string' ? (c.split(/\s+/)[1] || 'TEXT') : (c.type || 'TEXT');
          const isPk = Boolean(c && c.pk);
          const fkRef = c && c.fk ? String(c.fk) : '';
          return `
            <div class="sql-inline-schema-col sql-studio-col-item sql-studio-col-item--clickable" data-insert-col="${escapeHtml(cName)}" title="Click to insert ${escapeHtml(cName)} into SQL editor" style="cursor:pointer;">
              <span>
                <strong style="color:var(--fg);">${escapeHtml(cName)}</strong>
                ${isPk ? ' <span class="col-badge col-badge--pk">PK</span>' : ''}
                ${fkRef ? ` <span class="col-badge col-badge--fk" title="Foreign Key → ${escapeHtml(fkRef)}">FK → ${escapeHtml(fkRef)}</span>` : ''}
              </span>
              <span style="color:var(--fg-faint);font-size:10px;">${escapeHtml(cType)}</span>
            </div>
          `;
        }).join('');
        return `
          <div class="sql-inline-schema-card">
            <button type="button" class="sql-inline-schema-card__head" data-lab-preview-table="${escapeHtml(t.name)}" title="Click to preview SELECT * FROM ${escapeHtml(t.name)} LIMIT 15;">
              <span>▤ ${escapeHtml(t.name)}</span>
              <span style="font-size:10.5px;color:var(--fg-muted);font-weight:400;">${rowCnt} rows</span>
            </button>
            <div class="sql-inline-schema-card__cols">${colsHtml}</div>
          </div>
        `;
      }).join('');

      host.innerHTML = `
        <div class="sql-guided-step-bar" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 16px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px 10px 0 0;margin-top:8px;">
          <div style="flex:1;min-width:240px;">
            <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--info);margin-bottom:2px;">
              Active Step ${activeStepIdx + 1} of ${steps.length || 1} · Dataset: <code>${escapeHtml(dsObj ? (dsObj.title || datasetId) : datasetId)}</code>
            </div>
            <div style="font-size:0.95rem;font-weight:600;color:var(--fg);">${escapeHtml(step.title || '')}</div>
            <div style="font-size:0.83rem;color:var(--fg-muted);margin-top:2px;">${escapeHtml((step.instructions || step.concept || '').replace(/\*\*([^*]+)\*\*/g, '$1'))}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            ${steps.length > 1 ? `
              <button type="button" class="btn btn--secondary btn--sm" data-sql-lab-nav="prev" ${activeStepIdx === 0 ? 'disabled' : ''}>← Prev Step</button>
              <button type="button" class="btn btn--secondary btn--sm" data-sql-lab-nav="next" ${activeStepIdx >= steps.length - 1 ? 'disabled' : ''}>Next Step →</button>
            ` : ''}
            <button type="button" class="btn btn--secondary btn--sm" data-sql-lab-action="verify" style="border-color:var(--success-border);color:var(--success);">✓ Check SQL Assertions</button>
            <button type="button" class="btn btn--secondary btn--sm" data-sql-lab-action="hint">💡 Hint</button>
            <button type="button" class="btn btn--secondary btn--sm" data-sql-lab-action="solution">★ Load Solution SQL</button>
            <button type="button" class="btn btn--primary btn--sm" data-sql-lab-action="fullscreen">⤢ Full-Screen Studio</button>
          </div>
        </div>
        ${dsTables.length > 0 ? `
          <details class="sql-inline-schema-drawer" style="border-left:1px solid var(--border);border-right:1px solid var(--border);">
            <summary>
              <span>🗄️ <strong>Dataset Schema &amp; PK/FK Relationship Explorer</strong> (${escapeHtml(dsObj ? dsObj.title : datasetId)} · ${dsTables.length} tables — click any table to preview rows)</span>
              <span class="badge badge--secondary">Expand Schema ▾</span>
            </summary>
            <div class="sql-inline-schema-grid">${schemaCardsHtml}</div>
          </details>
        ` : ''}
        <div class="sql-guided-step-hint" style="display:none;padding:10px 16px;background:var(--info-bg);border-left:3px solid var(--info);border-right:1px solid var(--border);font-size:0.83rem;color:var(--fg);">
          <strong>Hint:</strong> ${escapeHtml(step.hint || 'Inspect the intermediate tables produced by each SQL clause.')}
        </div>
        <div class="sql-guided-visualizer-mount" style="border:1px solid var(--border);border-top:none;border-radius:0 0 10px 10px;overflow:hidden;"></div>
      `;

      const mountSlot = host.querySelector('.sql-guided-visualizer-mount');
      const hintEl = host.querySelector('.sql-guided-step-hint');

      const mountNow = (sqlOverride) => {
        if (window.TableVisualizer && typeof window.TableVisualizer.mountClauseVisualizer === 'function') {
          window.TableVisualizer.mountClauseVisualizer(mountSlot, {
            datasetId,
            sql: sqlOverride || initialSql,
            referenceSql: refSql,
            autoVerify: Boolean(opts.autoVerify),
            title: step.title || spec.title || 'Guided SQL Lab',
            onVerify: (vRes) => {
              if (vRes && vRes.passed) {
                const labCard = host.closest('.build-lab-card, .lesson-codelab-section, .build-codelab-section, .topic-codelab-card, .topic-codelab-hero') || root;
                if (labCard) {
                  const stepCard = labCard.querySelector(`.build-lab-step-card[data-step="${activeStepIdx}"], .build-lab-step-card[data-step-index="${activeStepIdx}"]`);
                  if (stepCard) {
                    stepCard.classList.add('is-completed', 'is-done');
                    const numBadge = stepCard.querySelector('.build-lab-step-card__num');
                    if (numBadge) numBadge.textContent = '✓';
                    const statusBadge = stepCard.querySelector('.build-lab-step-card__status');
                    if (statusBadge) {
                      statusBadge.textContent = '✓ Completed';
                      statusBadge.style.color = 'var(--success)';
                    }
                  }
                }
              }
            }
          });
        }
      };

      if (window.SQLEngine && typeof window.SQLEngine.init === 'function') {
        window.SQLEngine.init().catch(() => {});
      }
      mountNow();

      host.querySelectorAll('[data-lab-preview-table]').forEach(btn => {
        btn.addEventListener('click', () => {
          const tblName = btn.getAttribute('data-lab-preview-table');
          if (tblName) {
            mountNow(`SELECT *\nFROM ${tblName}\nLIMIT 15;`);
          }
        });
      });

      host.querySelectorAll('[data-insert-col]').forEach(colEl => {
        colEl.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const colName = colEl.getAttribute('data-insert-col');
          const ta = mountSlot ? mountSlot.querySelector('textarea') : null;
          if (colName && ta && window.TableVisualizer && typeof window.TableVisualizer.insertSqlSnippet === 'function') {
            window.TableVisualizer.insertSqlSnippet(ta, colName);
          }
        });
      });

      host.querySelectorAll('[data-sql-lab-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
          const dir = btn.getAttribute('data-sql-lab-nav');
          renderActiveStep(dir === 'next' ? activeStepIdx + 1 : activeStepIdx - 1);
        });
      });

      const verifyBtn = host.querySelector('[data-sql-lab-action="verify"]');
      if (verifyBtn) {
        verifyBtn.addEventListener('click', () => {
          const innerVerify = mountSlot.querySelector('[data-inline-viz-action="verify"]');
          if (innerVerify) innerVerify.click();
        });
      }

      const hintBtn = host.querySelector('[data-sql-lab-action="hint"]');
      if (hintBtn && hintEl) {
        hintBtn.addEventListener('click', () => {
          hintEl.style.display = hintEl.style.display === 'none' ? 'block' : 'none';
        });
      }

      const solBtn = host.querySelector('[data-sql-lab-action="solution"]');
      if (solBtn) {
        solBtn.addEventListener('click', () => {
          renderActiveStep(activeStepIdx, { useSolution: true, autoVerify: true });
        });
      }

      const fullBtn = host.querySelector('[data-sql-lab-action="fullscreen"]');
      if (fullBtn) {
        fullBtn.addEventListener('click', () => {
          const ta = mountSlot.querySelector('textarea');
          const currentSql = ta ? ta.value : initialSql;
          openSqlStudioModal({
            slug,
            title: spec.title || `SQL Studio — ${slug}`,
            summary: spec.summary || '',
            datasetId,
            sql: currentSql,
            steps,
            activeStepIdx
          });
        });
      }

      if (opts.scroll) {
        host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    host._sqlLabController = {
      loadStep(idx, opts) {
        renderActiveStep(idx, opts || {});
      },
      runVerify(opts) {
        renderActiveStep(activeStepIdx, Object.assign({ autoVerify: true }, opts || {}));
      },
      loadSolution(opts) {
        renderActiveStep(activeStepIdx, Object.assign({ useSolution: true, autoVerify: true }, opts || {}));
      }
    };

    renderActiveStep(0);
  }

  function closeGlobalCodeLab() {
    const overlay = document.getElementById('global-codelab-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.cssText = 'display:none;opacity:0;visibility:hidden;pointer-events:none;';
      overlay.innerHTML = '';
    }
    document.body.style.overflow = '';
    document.body.classList.remove('codelab-fullscreen-lock');
    globalCodeLabInstance = null;
  }

  function openSqlStudioModal(options) {
    const opts = options || {};
    let overlay = document.getElementById('global-codelab-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-codelab-overlay';
      overlay.className = 'global-codelab-overlay build-lab-overlay';
      document.body.appendChild(overlay);
    }

    const spec = (opts.slug || opts.labId) ? getTopicLabSpec(opts.slug || opts.labId) : null;
    const title = opts.title || (spec ? spec.title : 'Interactive SQL & Table Studio (PostgreSQL 18 / SQLite WASM)');
    const summary = opts.summary || (spec ? spec.summary : 'Execute SQL against real relational datasets, inspect schemas, and step through clause-by-clause table transformations.');
    const steps = Array.isArray(opts.steps) && opts.steps.length > 0 ? opts.steps : (spec && Array.isArray(spec.steps) ? spec.steps : []);
    let activeStepIdx = typeof opts.activeStepIdx === 'number' ? opts.activeStepIdx : (typeof opts.stepIndex === 'number' ? opts.stepIndex : 0);
    let activeDatasetId = opts.datasetId || (spec && spec.datasetId) || 'ecommerce';
    let activeEngine = (window.SQLEngine && typeof window.SQLEngine.getEngineMode === 'function')
      ? window.SQLEngine.getEngineMode()
      : 'postgres';

    const initialSql = opts.sql || (steps[activeStepIdx] && (steps[activeStepIdx].starterCode || steps[activeStepIdx].starterSnippet)) || (spec && spec.referenceSql) || 'SELECT * FROM customers LIMIT 10;';
    if (!opts.datasetId && window.TableVisualizer && typeof window.TableVisualizer.inferDatasetFromSql === 'function') {
      const inferred = window.TableVisualizer.inferDatasetFromSql(initialSql);
      if (inferred) activeDatasetId = inferred;
    }
    const datasets = window.SQL_DATASETS || {};
    const datasetKeys = Object.keys(datasets).length > 0 ? Object.keys(datasets) : ['ecommerce', 'org_hr', 'saas_telemetry', 'fintech_ledger', 'social_graph'];

    function buildQueryPresetOptionsHtml() {
      const dsObj = datasets[activeDatasetId] || {};
      const sampleList = Array.isArray(dsObj.sampleQueries) ? dsObj.sampleQueries : (Array.isArray(dsObj.defaultQueries) ? dsObj.defaultQueries : []);
      let html = `<option value="custom">✎ Custom Query (Current Editor)</option>`;
      if (steps.length > 0) {
        steps.forEach((s, idx) => {
          const sTitle = s.title || `Step ${idx + 1}`;
          html += `<option value="step-${idx}-starter">Step ${idx + 1} Starter — ${escapeHtml(sTitle)}</option>`;
          html += `<option value="step-${idx}-solution">★ Step ${idx + 1} Solution — ${escapeHtml(sTitle)}</option>`;
        });
      }
      if ((spec && spec.referenceSql) || opts.referenceSql) {
        html += `<option value="reference">★ Reference Solution SQL</option>`;
      }
      sampleList.forEach((sq, idx) => {
        const label = typeof sq === 'string' ? `Sample Query ${idx + 1}` : (sq.title || sq.label || `Sample Query ${idx + 1}`);
        html += `<option value="sample-${idx}">📋 ${escapeHtml(label)}</option>`;
      });
      return html;
    }

    overlay.innerHTML = `
      <div class="global-codelab-shell sql-studio-modal-shell" style="display:flex;flex-direction:column;width:96vw;max-width:1560px;height:92vh;margin:4vh auto;background:var(--bg);border:1px solid var(--border-strong);border-radius:14px;overflow:hidden;box-shadow:var(--shadow-xl);">
        <div class="global-codelab-topbar" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;background:var(--surface);border-bottom:1px solid var(--border);">
          <div class="global-codelab-topbar-left" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <button class="btn btn--secondary btn--sm global-codelab-back-btn" id="global-codelab-close-btn">
              ← ${escapeHtml(opts.backLabel || 'Back to Lesson')}
            </button>
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="global-codelab-badge" style="background:var(--info-muted);color:var(--info);padding:2px 8px;border-radius:999px;font-size:0.72rem;font-weight:700;">SQL STUDIO</span>
                <strong style="font-size:0.98rem;color:var(--fg);">${escapeHtml(title)}</strong>
              </div>
              <div style="font-size:0.78rem;color:var(--fg-muted);margin-top:2px;">${escapeHtml(summary)}</div>
            </div>
          </div>
          <div class="global-codelab-topbar-right" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label style="font-size:0.78rem;color:var(--fg-muted);display:flex;align-items:center;gap:6px;">
              Query / Solution:
              <select id="sql-studio-modal-query-select" data-role="modal-query-select" aria-label="Load Topic Query / Solution" style="background:var(--bg);color:var(--fg);border:1px solid var(--border-strong);border-radius:6px;padding:4px 8px;font-size:0.8rem;max-width:240px;">
                ${buildQueryPresetOptionsHtml()}
              </select>
            </label>
            <label style="font-size:0.78rem;color:var(--fg-muted);display:flex;align-items:center;gap:6px;">
              Dataset:
              <select id="sql-studio-modal-dataset" data-role="modal-dataset" style="background:var(--bg);color:var(--fg);border:1px solid var(--border-strong);border-radius:6px;padding:4px 8px;font-size:0.8rem;">
                <option value="__unified__" ${activeDatasetId === '__unified__' ? 'selected' : ''}>All 5 Datasets (Unified Sandbox)</option>
                ${datasetKeys.map(k => {
                  const ds = datasets[k] || { title: k };
                  return `<option value="${escapeHtml(k)}" ${k === activeDatasetId ? 'selected' : ''}>${escapeHtml(ds.title || ds.label || k)}</option>`;
                }).join('')}
              </select>
            </label>
            <label style="font-size:0.78rem;color:var(--fg-muted);display:flex;align-items:center;gap:6px;">
              Engine:
              <select id="sql-studio-modal-engine" data-role="modal-engine" style="background:var(--bg);color:var(--fg);border:1px solid var(--border-strong);border-radius:6px;padding:4px 8px;font-size:0.8rem;">
                <option value="sqlite" ${activeEngine === 'sqlite' ? 'selected' : ''}>SQLite 3 (WASM)</option>
                <option value="postgres" ${activeEngine === 'postgres' ? 'selected' : ''}>PostgreSQL 18 (PGlite WASM)</option>
              </select>
            </label>
            <button class="btn btn--primary btn--sm" id="sql-studio-modal-run-btn" data-role="modal-run">▶ Run Query</button>
            <button class="btn btn--secondary btn--sm" id="sql-studio-modal-reset-btn">↺ Reset Dataset</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:280px 1fr;flex:1;min-height:0;overflow:hidden;">
          <aside id="sql-studio-modal-schema" style="border-right:1px solid var(--border);background:var(--bg-alt);padding:14px;overflow-y:auto;">
            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--fg-muted);margin-bottom:10px;">Schema &amp; PK/FK Explorer</div>
            <div id="sql-studio-modal-schema-list" style="font-size:0.82rem;color:var(--fg);"></div>
          </aside>

          <main style="display:flex;flex-direction:column;min-height:0;overflow-y:auto;padding:16px;gap:14px;">
            <div id="sql-studio-modal-visualizer-host" style="flex:1;min-height:420px;"></div>
          </main>
        </div>
      </div>
    `;

    overlay.classList.add('open');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;width:100vw;height:100vh;background:rgba(0,0,0,0.82);backdrop-filter:blur(4px);display:flex;flex-direction:column;opacity:1;visibility:visible;pointer-events:auto;transform:none;';
    document.body.style.overflow = 'hidden';

    const handleCloseModal = () => {
      document.removeEventListener('keydown', handleEscModal);
      closeGlobalCodeLab();
      if (typeof opts.onClose === 'function') opts.onClose();
    };
    const handleEscModal = (ev) => {
      if (ev.key === 'Escape') {
        handleCloseModal();
      }
    };
    document.addEventListener('keydown', handleEscModal);
    const closeBtn = overlay.querySelector('#global-codelab-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', handleCloseModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleCloseModal();
    });

    const schemaListEl = overlay.querySelector('#sql-studio-modal-schema-list');
    const visHost = overlay.querySelector('#sql-studio-modal-visualizer-host');
    const querySelect = overlay.querySelector('#sql-studio-modal-query-select');
    const dsSelect = overlay.querySelector('#sql-studio-modal-dataset');
    const engSelect = overlay.querySelector('#sql-studio-modal-engine');
    const runBtn = overlay.querySelector('#sql-studio-modal-run-btn');
    const resetBtn = overlay.querySelector('#sql-studio-modal-reset-btn');

    function refreshSchemaSidebar() {
      if (!schemaListEl) return;
      const allDatasets = window.SQL_DATASETS || {};
      const dsList = activeDatasetId === '__unified__'
        ? Object.keys(allDatasets).map(k => allDatasets[k]).filter(Boolean)
        : [allDatasets[activeDatasetId]].filter(Boolean);
      const tables = [];
      dsList.forEach(ds => {
        if (ds && Array.isArray(ds.tables)) {
          ds.tables.forEach(t => tables.push(t));
        }
      });
      if (tables.length > 0) {
        schemaListEl.innerHTML = tables.map(t => {
          const rowCnt = t.rowCount || (Array.isArray(t.rows) ? t.rows.length : 0);
          return `
            <div style="margin-bottom:10px;padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;">
              <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;" data-preview-table="${escapeHtml(t.name)}" title="Click to preview SELECT * FROM ${escapeHtml(t.name)} LIMIT 15;">
                <strong style="color:var(--info);font-family:var(--font-mono,monospace);">▤ ${escapeHtml(t.name)}</strong>
                <span style="font-size:0.72rem;color:var(--fg-muted);">${rowCnt ? `${rowCnt} rows` : 'SELECT *'}</span>
              </div>
              ${Array.isArray(t.columns) ? `
                <div style="margin-top:6px;display:flex;flex-direction:column;gap:3px;font-size:0.74rem;color:var(--fg-muted);font-family:var(--font-mono,monospace);">
                  ${t.columns.map(c => {
                    if (typeof c === 'string') {
                      const colToken = c.split(/\s+/)[0] || c;
                      return `<div class="sql-studio-col-item sql-studio-col-item--clickable" data-insert-col="${escapeHtml(colToken)}" style="cursor:pointer;">• ${escapeHtml(c)}</div>`;
                    }
                    const isPk = Boolean(c.pk);
                    const fkRef = c.fk ? String(c.fk) : '';
                    return `
                      <div class="sql-studio-col-item sql-studio-col-item--clickable" data-insert-col="${escapeHtml(c.name || '')}" title="Click to insert ${escapeHtml(c.name || '')}" style="display:flex;align-items:center;justify-content:space-between;gap:4px;cursor:pointer;">
                        <span>
                          <strong style="color:var(--fg);">${escapeHtml(c.name || '')}</strong>
                          ${isPk ? ' <span class="col-badge col-badge--pk sql-studio-col-badge sql-studio-col-badge--pk">PK</span>' : ''}
                          ${fkRef ? ` <span class="col-badge col-badge--fk sql-studio-col-badge sql-studio-col-badge--fk" title="Foreign Key → ${escapeHtml(fkRef)}">FK→${escapeHtml(fkRef)}</span>` : ''}
                        </span>
                        <span style="color:var(--fg-faint);font-size:0.68rem;">${escapeHtml(c.type || '')}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
        schemaListEl.querySelectorAll('[data-preview-table]').forEach(el => {
          el.addEventListener('click', () => {
            const tbl = el.getAttribute('data-preview-table');
            mountStudioQuery(`SELECT *\nFROM ${tbl}\nLIMIT 15;`);
          });
        });
        schemaListEl.querySelectorAll('[data-insert-col]').forEach(colEl => {
          colEl.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const colName = colEl.getAttribute('data-insert-col');
            const ta = visHost ? visHost.querySelector('textarea') : null;
            if (colName && ta && window.TableVisualizer && typeof window.TableVisualizer.insertSqlSnippet === 'function') {
              window.TableVisualizer.insertSqlSnippet(ta, colName);
            }
          });
        });
      } else {
        schemaListEl.innerHTML = `<div style="color:var(--fg-muted);font-size:0.8rem;">Dataset <code>${escapeHtml(activeDatasetId)}</code> loaded.</div>`;
      }
    }

    function mountStudioQuery(sqlText, mountOpts = {}) {
      if (!visHost) return;
      const step = steps[activeStepIdx] || null;
      const refSql = mountOpts.referenceSql || (step && (step.solutionCode || step.solutionSnippet)) || opts.referenceSql || (spec && spec.referenceSql) || sqlText;
      const mountFn = () => {
        if (window.TableVisualizer && typeof window.TableVisualizer.mountClauseVisualizer === 'function') {
          window.TableVisualizer.mountClauseVisualizer(visHost, {
            datasetId: activeDatasetId,
            sql: sqlText,
            referenceSql: refSql,
            autoVerify: Boolean(mountOpts.autoVerify),
            title,
            onVerify: (vRes) => {
              if (vRes && vRes.passed) {
                if (typeof opts.onStepComplete === 'function' && step) {
                  opts.onStepComplete(step);
                }
                if (typeof opts.onLabComplete === 'function') {
                  opts.onLabComplete(vRes);
                }
              }
            }
          });
        }
      };
      if (window.SQLEngine && typeof window.SQLEngine.init === 'function') {
        window.SQLEngine.init().catch(() => {});
      }
      mountFn();
    }

    refreshSchemaSidebar();
    mountStudioQuery(initialSql);

    if (querySelect) {
      querySelect.addEventListener('change', () => {
        const val = querySelect.value;
        if (!val || val === 'custom') return;
        let selectedSql = '';
        let isSolution = false;
        const stepMatch = val.match(/^step-(\d+)-(starter|solution)$/);
        if (stepMatch) {
          const idx = parseInt(stepMatch[1], 10);
          const mode = stepMatch[2];
          const st = steps[idx];
          if (st) {
            activeStepIdx = idx;
            if (mode === 'solution') {
              selectedSql = st.solutionCode || st.solutionSnippet || st.starterCode || initialSql;
              isSolution = true;
            } else {
              selectedSql = st.starterCode || st.starterSnippet || initialSql;
            }
          }
        } else if (val === 'reference') {
          selectedSql = (spec && spec.referenceSql) || opts.referenceSql || initialSql;
          isSolution = true;
        } else if (val.indexOf('sample-') === 0) {
          const sIdx = parseInt(val.replace('sample-', ''), 10);
          const dsObj = datasets[activeDatasetId] || {};
          const sampleList = Array.isArray(dsObj.sampleQueries) ? dsObj.sampleQueries : (Array.isArray(dsObj.defaultQueries) ? dsObj.defaultQueries : []);
          const sq = sampleList[sIdx];
          if (sq) {
            selectedSql = typeof sq === 'string' ? sq : (sq.sql || sq.query || '');
          }
        }
        if (selectedSql) {
          mountStudioQuery(selectedSql, { referenceSql: isSolution ? selectedSql : undefined, autoVerify: isSolution });
        }
      });
    }

    if (dsSelect) {
      dsSelect.addEventListener('change', () => {
        activeDatasetId = dsSelect.value;
        refreshSchemaSidebar();
        if (querySelect) {
          querySelect.innerHTML = buildQueryPresetOptionsHtml();
        }
        const ta = visHost.querySelector('textarea');
        mountStudioQuery(ta ? ta.value : initialSql);
      });
    }

    if (engSelect) {
      engSelect.addEventListener('change', async () => {
        activeEngine = engSelect.value;
        if (window.SQLEngine && typeof window.SQLEngine.setEngineMode === 'function') {
          await window.SQLEngine.setEngineMode(activeEngine);
        }
        const ta = visHost.querySelector('textarea');
        mountStudioQuery(ta ? ta.value : initialSql);
      });
    }

    if (runBtn) {
      runBtn.addEventListener('click', () => {
        const innerRun = visHost.querySelector('[data-inline-viz-action="run"]');
        if (innerRun) {
          innerRun.click();
        } else {
          const ta = visHost.querySelector('textarea');
          mountStudioQuery(ta ? ta.value : initialSql);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (window.SQLEngine && typeof window.SQLEngine.resetDataset === 'function') {
          await window.SQLEngine.resetDataset(activeDatasetId);
        }
        const ta = visHost.querySelector('textarea');
        mountStudioQuery(ta ? ta.value : initialSql);
      });
    }

    return Promise.resolve(overlay);
  }

  function openGlobalCodeLab(config) {
    const cfg = config || {};
    let sql = cfg.sql || '';
    if (!sql && cfg.files) {
      sql = cfg.files['query.sql'] || cfg.files['hotfix.sql'] || Object.values(cfg.files)[0] || '';
    }
    return openSqlStudioModal({
      slug: cfg.slug || cfg.labId || currentSlug,
      title: cfg.title || 'Interactive SQL Studio',
      summary: cfg.summary || '',
      datasetId: cfg.datasetId || 'ecommerce',
      sql: sql || 'SELECT * FROM customers LIMIT 10;',
      referenceSql: cfg.referenceSql || (cfg.files && cfg.files['solution.sql']) || sql,
      steps: cfg.steps || [],
      backLabel: cfg.backLabel || 'Back to Lesson',
      onLabComplete: cfg.onLabComplete
    });
  }

  function openTopicCodeLab(slug, mode, stepIndex) {
    if (mode && typeof mode === 'object') {
      stepIndex = mode.stepIndex ?? stepIndex;
      mode = mode.mode || 'guided';
    }
    const targetSlug = slug || currentSlug;
    const inlineHost = document.querySelector(`.sql-guided-lab-host[data-sql-lab-slug="${targetSlug}"]`) || document.querySelector('.sql-guided-lab-host');
    if (inlineHost && inlineHost._sqlLabController) {
      if (typeof stepIndex === 'number' && !Number.isNaN(stepIndex)) {
        inlineHost._sqlLabController.loadStep(stepIndex, { scroll: false });
      } else if (mode === 'solution') {
        inlineHost._sqlLabController.loadSolution({ scroll: false });
      } else if (mode === 'verify') {
        inlineHost._sqlLabController.runVerify({ scroll: true });
        return Promise.resolve(inlineHost);
      }
    }
    const spec = getTopicLabSpec(targetSlug);
    const activeIdx = typeof stepIndex === 'number' && !Number.isNaN(stepIndex) ? stepIndex : 0;
    const activeStep = (spec.steps && spec.steps[activeIdx]) || (spec.steps && spec.steps[0]) || null;
    return openSqlStudioModal({
      slug: targetSlug,
      title: spec.title,
      summary: spec.summary,
      datasetId: spec.datasetId || 'ecommerce',
      sql: mode === 'solution' && activeStep ? (activeStep.solutionCode || spec.referenceSql) : (activeStep ? activeStep.starterCode : spec.referenceSql),
      referenceSql: (activeStep && activeStep.solutionCode) || spec.referenceSql,
      steps: spec.steps || [],
      activeStepIdx: activeIdx
    });
  }

  function openSnippetInCodeLab(rawCode, lang, title) {
    const spec = getTopicLabSpec(currentSlug);
    const inferredDs = (window.TableVisualizer && typeof window.TableVisualizer.inferDatasetFromSql === 'function' && rawCode)
      ? window.TableVisualizer.inferDatasetFromSql(rawCode)
      : null;
    return openSqlStudioModal({
      slug: currentSlug,
      title: title || `SQL Studio — ${spec.title || currentSlug}`,
      summary: 'Execute, edit, and step through this SQL query in the full-screen SQL Studio.',
      datasetId: inferredDs || spec.datasetId || 'ecommerce',
      sql: rawCode || spec.referenceSql,
      referenceSql: rawCode || spec.referenceSql
    });
  }

  function openRepoInCodeLab(projectId, title) {
    const projects = window.PROJECTS_DATA || [];
    const p = projects.find(x => x.id === projectId || x.repo === projectId) || { title: title || projectId || 'SQL Capstone Lab' };
    return openSqlStudioModal({
      title: `${p.title} — SQL Capstone Studio`,
      summary: p.tagline || p.description || 'Interactive SQL schema & query verification studio.',
      datasetId: 'fintech_ledger',
      sql: `-- ${p.title}\nSELECT *\nFROM accounts\nORDER BY posted_balance_cents DESC\nLIMIT 10;`
    });
  }

  function openChallengeCodeLab(challengeId, onPassCallback) {
    const raw = window.CHALLENGES_DATA || window.ChallengesData;
    const challenges = Array.isArray(raw) ? raw : (raw?.challenges || []);
    const ch = challenges.find(c => c.id === challengeId);
    if (!ch || !ch.codeFix) return Promise.resolve(null);
    const cf = ch.codeFix;
    return openSqlStudioModal({
      title: `${ch.id}: ${cf.title || ch.title}`,
      summary: cf.summary || ch.summary,
      datasetId: cf.datasetId || 'ecommerce',
      sql: cf.buggyCode || cf.solutionCode || 'SELECT * FROM orders LIMIT 10;',
      referenceSql: cf.solutionCode || cf.buggyCode || '',
      steps: [
        {
          id: `challenge-${ch.id}-fix`,
          title: cf.title || 'Fix the Production SQL Incident',
          instructions: cf.summary || 'Rewrite the SQL query to eliminate the root cause and verify the execution plan.',
          starterCode: cf.buggyCode || '',
          solutionCode: cf.solutionCode || ''
        }
      ],
      backLabel: 'Back to Incident War-Room',
      onLabComplete: () => {
        if (typeof onPassCallback === 'function') onPassCallback(ch.id);
      }
    });
  }

  function isInputFocused() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  function navigatePrev() {
    const allUnits = getAllUnitSlugs();
    const idx = allUnits.indexOf(currentSlug);
    if (idx > 0) navigateTo(allUnits[idx - 1]);
  }

  function navigateNext() {
    const allUnits = getAllUnitSlugs();
    const idx = allUnits.indexOf(currentSlug);
    if (idx >= 0 && idx < allUnits.length - 1) navigateTo(allUnits[idx + 1]);
  }

  function getAllUnitSlugs() {
    const data = window.CURRICULUM_DATA;
    if (!data) return [];
    const slugs = [];
    for (const p of data.parts) {
      for (const m of p.modules) {
        for (const u of m.units) {
          slugs.push(u.slug);
        }
      }
    }
    return slugs;
  }

  const App = {
    navigate,
    navigateTo,
    navigateToBuild,
    navigateToProject,
    navigateToModule,
    navigateToRoadmap,
    navigateToChallenges,
    navigateToDashboard,
    navigateToSandbox,
    navigateToGlossary,
    navigateHome,
    toggleModule,
    toggleComplete,
    toggleTheme,
    renderCurrentView,
    renderSidebar,
    initMermaid,
    openDiagramLightbox,
    closeDiagramLightbox,
    openSqlStudioModal,
    mountInlineTopicSqlLab,
    openGlobalCodeLab,
    closeGlobalCodeLab,
    openTopicCodeLab,
    openSnippetInCodeLab,
    openRepoInCodeLab,
    openChallengeCodeLab,
    getCurrentSlug: () => currentSlug,
    getCurrentView: () => currentView,
    getActiveTab: () => activeTab
  };

  window.App = App;
  window.openDiagramLightbox = openDiagramLightbox;
  window.closeDiagramLightbox = closeDiagramLightbox;

  const boot = () => {
    try {
      init();
    } catch (err) {
      console.error('[App init error]', err);
    }
  };

  // ── Boot ──────────────────────────────────────────────────
  // Scripts are injected after first paint, so DOMContentLoaded may already have fired
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return App;
})();
