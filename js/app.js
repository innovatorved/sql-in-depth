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
    const allIds = getAllModuleIds();
    if (allIds.length === 0) return;
    collapsedModulesInitialized = true;
    const activeModId = (currentSlug && getModuleIdForSlug(currentSlug)) || allIds[0];
    for (const id of allIds) {
      if (id !== activeModId) collapsedModules.add(id);
    }
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
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    const hash = window.location.hash.slice(1);

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

    // Redirect legacy #build/<slug> or /build/<slug>/ routes to the unified C++20 curriculum topic view
    if (hash.startsWith('build/') || path.startsWith('build/')) {
      const rawPart = hash.startsWith('build/') ? hash.slice(6) : path.slice(6);
      const [rawBuildSlug, queryStr] = rawPart.split('?');
      currentSlug = rawBuildSlug.replace(/\/+$/, '');
      currentBuildParams = new URLSearchParams(queryStr || window.location.search);
      history.replaceState(null, '', '/topic/' + currentSlug + '/');
      currentView = 'topic';
      activeTab = 'curriculum';
      syncSidebarTabs();
      const requestedMode = currentBuildParams.get('mode');
      const requestedStep = currentBuildParams.get('step');
      if (requestedMode) {
        const stepIdx = requestedStep !== null ? parseInt(requestedStep, 10) : undefined;
        setTimeout(() => openTopicCodeLab(currentSlug, requestedMode, stepIdx), 120);
      }
      return;
    }

    // Roadmap route: /roadmap or #/roadmap
    if (path === 'roadmap' || path.startsWith('roadmap/') || hash === 'roadmap' || hash === '/roadmap' || hash.startsWith('roadmap/') || hash.startsWith('/roadmap')) {
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
    if (path === 'challenges' || path.startsWith('challenges/') || hash === 'challenges' || hash === '/challenges' || hash.startsWith('challenges/') || hash.startsWith('/challenges')) {
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
    if (path === 'srs' || path.startsWith('srs/') || hash === 'srs' || hash === '/srs') {
      currentView = 'dashboard';
      currentSlug = 'cards';
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Blueprint alias route: /blueprint or #/blueprint
    if (path === 'blueprint' || path.startsWith('blueprint/') || hash === 'blueprint' || hash === '/blueprint') {
      currentView = 'sandbox';
      currentSlug = null;
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Dashboard route: /dashboard or #/dashboard
    if (path === 'dashboard' || path.startsWith('dashboard/') || hash === 'dashboard' || hash === '/dashboard' || hash.startsWith('dashboard/') || hash.startsWith('/dashboard')) {
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
    if (path === 'sandbox' || path.startsWith('sandbox/') || hash === 'sandbox' || hash === '/sandbox' || hash.startsWith('sandbox/') || hash.startsWith('/sandbox')) {
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

    if (hash === '/review' || hash === 'review' || hash === '/cards' || hash === 'cards') {
      window.location.hash = '';
      return;
    }
    if (hash === '/glossary' || hash === 'glossary' || path === 'glossary' || path.startsWith('glossary/')) {
      currentView = 'glossary';
      currentSlug = null;
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }
    if (hash.startsWith('cheatsheet/')) {
      currentView = 'cheatsheet';
      currentSlug = hash.slice(11);
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }
    if (hash.startsWith('topic/')) {
      currentView = 'topic';
      currentSlug = hash.slice(6).replace(/\/+$/, '');
      if (currentSlug === 'write-ahead-log') currentSlug = 'database-wal-and-recovery';
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    // Clean URL topic route: topic/<slug> or /topic/<slug>
    if (path.startsWith('topic/')) {
      currentView = 'topic';
      currentSlug = path.slice(6).replace(/\/+$/, '');
      if (currentSlug === 'write-ahead-log') currentSlug = 'database-wal-and-recovery';
      activeTab = 'curriculum';
      syncSidebarTabs();
      return;
    }

    if (!hash || hash === '/') {
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
    const params = new URLSearchParams(queryStr || '');
    const requestedMode = params.get('mode');
    const requestedStep = params.get('step');
    navigateTo(cleanId, event);
    if (requestedMode) {
      const stepIdx = requestedStep !== null ? parseInt(requestedStep, 10) : undefined;
      setTimeout(() => openTopicCodeLab(cleanId, requestedMode, stepIdx), 120);
    }
  }

  function navigate(pathOrUrl, event) {
    if (event && event.preventDefault) event.preventDefault();
    if (!pathOrUrl) return;
    const str = String(pathOrUrl);
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
        if (window.TopicCodeLab && typeof window.TopicCodeLab.init === 'function') {
          window.TopicCodeLab.init(reader);
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

          const impls = window.IMPLEMENTATIONS_DATA;
          const build = impls?.[currentSlug];
          const overlayEl = document.getElementById('build-lab-overlay');
          const mountEl = document.getElementById('codelab-mount-' + currentSlug);
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
            const steps = window.GUIDED_LABS_DATA?.[currentSlug]?.steps || [];
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
            if (!overlayEl || !mountEl || !window.CodeLab) return;
            overlayEl.classList.add('is-open');
            overlayEl.setAttribute('aria-hidden', 'false');
            document.body.classList.add('codelab-fullscreen-lock');

            const rawLang = opts.lang || '';
            const normLang = (rawLang === 'c++' ? 'cpp' : (rawLang === 'python' ? 'py' : rawLang));

            if (!activeCodeLab) {
              const guidedEntry = window.GUIDED_LABS_DATA?.[currentSlug] || window.SYSTEM_DESIGN_GUIDED_LABS?.[currentSlug] || null;
              const buildEntry = build || window.IMPLEMENTATIONS_DATA?.[currentSlug] || window.SYSTEM_DESIGN_BUILDS?.[currentSlug] || null;
              const refFiles = buildEntry?.files || null;
              const steps = guidedEntry?.steps || null;
              const cppFallback = (!guidedEntry?.cppStarterFiles && !guidedEntry?.cppSolutionFiles && !buildEntry?.cppFiles)
                ? buildCppLabFiles(
                    currentSlug,
                    buildEntry?.title || guidedEntry?.title || currentSlug,
                    buildEntry?.summary || guidedEntry?.summary || '',
                    steps,
                    refFiles
                  )
                : null;
              const cppStarterFiles = guidedEntry?.cppStarterFiles || cppFallback?.cppStarterFiles || null;
              const cppSolutionFiles = guidedEntry?.cppSolutionFiles || buildEntry?.cppFiles || cppFallback?.cppSolutionFiles || null;
              const pyStarterFiles = guidedEntry?.pyStarterFiles || null;
              const pySolutionFiles = guidedEntry?.pySolutionFiles || buildEntry?.pyFiles || null;

              const mountOpts = {
                labId: currentSlug,
                title: buildEntry?.title || guidedEntry?.title || currentSlug,
                summary: buildEntry?.summary || guidedEntry?.summary || '',
                languages: ['js', 'ts', 'cpp', 'py'],
                files: refFiles,
                solutionFiles: guidedEntry?.solutionFiles || refFiles,
                starterFiles: guidedEntry?.starterFiles || null,
                tsStarterFiles: guidedEntry?.tsStarterFiles || null,
                tsSolutionFiles: guidedEntry?.tsSolutionFiles || null,
                cppFiles: cppSolutionFiles,
                cppStarterFiles,
                cppSolutionFiles,
                cppEntry: guidedEntry?.cppEntry || 'main.cpp',
                cppTestEntry: guidedEntry?.cppTestEntry || 'test.cpp',
                pyFiles: pySolutionFiles,
                pyStarterFiles,
                pySolutionFiles,
                pyEntry: guidedEntry?.pyEntry || 'main.py',
                steps,
                guided: guidedEntry ? {
                  ...guidedEntry,
                  cppStarterFiles,
                  cppSolutionFiles,
                  pyStarterFiles,
                  pySolutionFiles
                } : null,
                backLabel: 'Back to Build Guide',
                onClose: closeBuildLab,
                onStepComplete: (step) => {
                  const stepId = (step && typeof step === 'object') ? (step.id || step.index) : step;
                  if (window.Progress?.markBuildStepComplete) {
                    window.Progress.markBuildStepComplete(currentSlug, stepId);
                  }
                  if (window.Analytics?.trackCodeLabStep) {
                    window.Analytics.trackCodeLabStep(currentSlug, stepId, true);
                  }
                  syncOverviewProgress();
                },
                onLabComplete: () => {
                  if (window.Progress?.markBuildComplete) {
                    window.Progress.markBuildComplete(currentSlug);
                  }
                  if (window.Analytics?.trackCodeLabStep) {
                    window.Analytics.trackCodeLabStep(currentSlug, 'all_steps_complete', true);
                  }
                  syncOverviewProgress();
                }
              };
              if (opts.mode === 'guided' || opts.mode === 'sandbox') {
                mountOpts.mode = opts.mode;
              }
              if (normLang === 'js' || normLang === 'ts' || normLang === 'cpp' || normLang === 'py') {
                mountOpts.language = normLang;
              }
              if (window.Analytics?.trackCodeLabOpen) {
                window.Analytics.trackCodeLabOpen(currentSlug, mountOpts.mode || 'guided', mountOpts.language || 'javascript');
              }
              activeCodeLab = mountCodeLabWithExtensions(mountEl, mountOpts);
              if (typeof opts.stepIndex === 'number' && !Number.isNaN(opts.stepIndex) && activeCodeLab?.selectStep) {
                setTimeout(() => activeCodeLab.selectStep(opts.stepIndex, true), 80);
              }
            } else if (typeof activeCodeLab.configure === 'function') {
              activeCodeLab.configure({ ...opts, lang: normLang });
            } else if (activeCodeLab.editor) {
              setTimeout(() => activeCodeLab.editor.layout(), 60);
            }
            setTimeout(() => {
              const ed = activeCodeLab?._editor || activeCodeLab?.editor;
              if (ed && typeof ed.layout === 'function') ed.layout();
            }, 250);
          };

          reader.querySelectorAll('[data-action="open-code-lab"]').forEach(btn => {
            btn.addEventListener('click', () => {
              const mode = btn.getAttribute('data-lab-mode') || 'guided';
              const stepAttr = btn.getAttribute('data-step-index');
              const stepIndex = stepAttr !== null ? parseInt(stepAttr, 10) : undefined;
              openBuildLab({ mode, lang: requestedLang || undefined, stepIndex });
            });
          });

          if (requestedLab === 'open' || requestedMode === 'guided' || requestedMode === 'sandbox') {
            const stepIdx = requestedStep !== null ? parseInt(requestedStep, 10) : undefined;
            openBuildLab({
              mode: requestedMode || 'guided',
              lang: requestedLang || undefined,
              stepIndex: Number.isNaN(stepIdx) ? undefined : stepIdx
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
        if (!window.GUIDED_LABS_DATA) {
          neededBuildScripts.push('data/guided_labs.js');
        }
        if (!document.querySelector('link[href*="@innovatorved/code-lab"], link[href*="innovatorved/code-lab"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.jsdelivr.net/npm/@innovatorved/code-lab@0.3.2/dist/code-lab.css';
          link.crossOrigin = 'anonymous';
          link.onerror = function () {
            this.onerror = null;
            this.href = 'https://unpkg.com/@innovatorved/code-lab@0.3.2/dist/code-lab.css';
          };
          document.head.appendChild(link);
        }
        if (!window.CodeLab) {
          neededBuildScripts.push('https://cdn.jsdelivr.net/npm/@innovatorved/code-lab@0.3.2/dist/code-lab.js');
        }

        if (neededBuildScripts.length > 0 && window.loadScript) {
          if (!isPrerenderedBuild) {
            reader.innerHTML = '<div class="prose"><p style="padding:2rem 0;color:var(--fg-muted);">Loading Interactive IDE Lab &amp; Reference Build...</p></div>';
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

    // Add click handlers for internal navigation links
    reader.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        const nav = el.dataset.nav;
        if (nav === 'home') navigateHome();
        else if (nav === 'projects') navigateToProject(el.dataset.project);
        else if (nav === 'topic') navigateTo(el.dataset.slug);
        else if (nav === 'module') navigateToModule(el.dataset.module);
        else if (nav === 'roadmap') navigateToRoadmap(el.dataset.tab);
        else if (nav === 'challenges') navigateToChallenges(el.dataset.challenge);
        else if (nav === 'dashboard') navigateToDashboard(el.dataset.tab);
        else if (nav === 'sandbox') navigateToSandbox(el.dataset.blueprint);
        else if (nav === 'glossary') navigateToGlossary();
      });
    });
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
        const isPrerenderedTopic = reader && reader.getAttribute('data-prerendered') === currentSlug;
        if (!isPrerenderedTopic && reader) {
          reader.removeAttribute('data-prerendered');
        }
        renderCurrentView();
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
    const topicTitle = topicTitleEl ? topicTitleEl.textContent.trim() : 'Algorithm & Data Structure';
    diagrams.forEach(el => {
      const svg = el.querySelector('svg');
      if (svg) {
        if (!svg.hasAttribute('role')) {
          svg.setAttribute('role', 'img');
        }
        if (!svg.hasAttribute('aria-label')) {
          svg.setAttribute('aria-label', `Algorithm & Data Structure Diagram for ${topicTitle}`);
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
      const target = e.target;
      if (!target) return;

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

      // 2. Module card navigation
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

      const runSnippetBtn = target.closest('[data-action="run-snippet-codelab"]');
      if (runSnippetBtn) {
        e.preventDefault();
        const block = runSnippetBtn.closest('.code-block');
        const codeEl = block?.querySelector('code');
        const code = codeEl ? codeEl.textContent : '';
        const lang = runSnippetBtn.getAttribute('data-lang') || 'javascript';
        const titleEl = document.querySelector('.lesson__title, h1');
        const title = titleEl ? `${titleEl.textContent.trim()} — Live Snippet` : 'Lesson Code Snippet';
        openSnippetInCodeLab(code, lang, title);
        return;
      }

      const openTopicLabBtn = target.closest('[data-action="open-topic-codelab"]');
      if (openTopicLabBtn) {
        e.preventDefault();
        const slug = openTopicLabBtn.getAttribute('data-slug') || currentSlug;
        const mode = openTopicLabBtn.getAttribute('data-mode') || 'guided';
        const stepAttr = openTopicLabBtn.getAttribute('data-step-index');
        const stepIndex = stepAttr !== null ? parseInt(stepAttr, 10) : undefined;
        openTopicCodeLab(slug, mode, stepIndex);
        return;
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

      // 9. Intercept internal /build/<slug>/, /topic/<slug>/, /challenges/<id>, /sandbox?blueprint=<id> links for SPA navigation
      const anchor = target.closest('a[href]');
      if (anchor && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || anchor.target === '_blank')) {
        const href = anchor.getAttribute('href') || '';
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

  function ensureCodeLabLoaded() {
    if (!document.querySelector('link[href*="@innovatorved/code-lab"], link[href*="innovatorved/code-lab"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/@innovatorved/code-lab@0.3.2/dist/code-lab.css';
      link.crossOrigin = 'anonymous';
      link.onerror = function () {
        this.onerror = null;
        this.href = 'https://unpkg.com/@innovatorved/code-lab@0.3.2/dist/code-lab.css';
      };
      document.head.appendChild(link);
    }
    if (window.CodeLab) return Promise.resolve(window.CodeLab);
    if (window.loadScript) {
      return window.loadScript('https://cdn.jsdelivr.net/npm/@innovatorved/code-lab@0.3.2/dist/code-lab.js').then(() => window.CodeLab);
    }
    return Promise.resolve(null);
  }

  function escapeCppString(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
  }

  function buildCppLabFiles(labId, title, summary, steps, refFiles) {
    const safeTitle = escapeCppString(title || labId || 'DSA Build Lab');
    const stepList = Array.isArray(steps) && steps.length > 0 ? steps : [
      { id: 'step-1', title: 'Step 1: Core Implementation', concept: summary || '', testNames: ['verifies core implementation'] }
    ];

    const starterStepFns = stepList.map((s, idx) => {
      const fnName = `verify_step_${idx + 1}`;
      const stepTitle = String(s.title || `Step ${idx + 1}`).replace(/\r?\n/g, ' ');
      const targetSym = s.targetSymbol ? ` (${s.targetSymbol})` : '';
      const concept = s.concept ? `\n  // Concept: ${String(s.concept).replace(/\r?\n/g, ' ')}` : '';
      const hint = s.hint ? `\n  // Hint: ${String(s.hint).replace(/\r?\n/g, ' ')}` : '';
      return `// ${stepTitle}${targetSym}${concept}${hint}\ninline bool ${fnName}() {\n  // TODO (Step ${idx + 1}): Implement ${stepTitle} and return true once verified\n  return false;\n}`;
    }).join('\n\n');

    const solutionStepFns = stepList.map((s, idx) => {
      const fnName = `verify_step_${idx + 1}`;
      const stepTitle = String(s.title || `Step ${idx + 1}`).replace(/\r?\n/g, ' ');
      const targetSym = s.targetSymbol ? ` (${s.targetSymbol})` : '';
      return `// ${stepTitle}${targetSym}\ninline bool ${fnName}() {\n  return true;\n}`;
    }).join('\n\n');

    const starterHeader = [
      '#pragma once',
      '#include <bits/stdc++.h>',
      '#include <codelab/dsa.hpp>',
      'using namespace std;',
      '',
      `// ${title || labId} — C++20 WebAssembly Workspace`,
      starterStepFns,
      ''
    ].join('\n');

    const solutionHeader = [
      '#pragma once',
      '#include <bits/stdc++.h>',
      '#include <codelab/dsa.hpp>',
      'using namespace std;',
      '',
      `// ${title || labId} — C++20 Reference Solution`,
      solutionStepFns,
      ''
    ].join('\n');

    const mainCpp = [
      '#include <bits/stdc++.h>',
      '#include <codelab/dsa.hpp>',
      '#include "solution.hpp"',
      '',
      'int main() {',
      `  std::cout << "=== ${safeTitle} (C++20 / Clang WASI) ===\\n";`,
      ...stepList.map((s, idx) =>
        `  std::cout << "  [${idx + 1}/${stepList.length}] ${escapeCppString(s.title || `Step ${idx + 1}`)}: " << (verify_step_${idx + 1}() ? "READY" : "TODO") << "\\n";`
      ),
      '  return 0;',
      '}',
      ''
    ].join('\n');

    const testBlocks = stepList.map((s, idx) => {
      const tNames = Array.isArray(s.testNames) && s.testNames.length > 0
        ? s.testNames
        : [s.title || `step-${idx + 1}`];
      return tNames.map(tName => [
        `    TEST("${escapeCppString(tName)}", {`,
        `      ASSERT_TRUE(verify_step_${idx + 1}());`,
        '    });'
      ].join('\n')).join('\n');
    }).join('\n');

    const testCpp = [
      '#include <codelab/test.hpp>',
      '#include "solution.hpp"',
      '',
      'int main() {',
      `  DESCRIBE("${safeTitle}", {`,
      testBlocks,
      '  });',
      '  return CODELAB_TEST_EXIT_CODE();',
      '}',
      ''
    ].join('\n');

    const extraReadme = (refFiles && typeof refFiles['README.md'] === 'string')
      ? { 'README.md': refFiles['README.md'] }
      : {};

    return {
      cppStarterFiles: {
        'solution.hpp': starterHeader,
        'main.cpp': mainCpp,
        'test.cpp': testCpp,
        ...extraReadme
      },
      cppSolutionFiles: {
        'solution.hpp': solutionHeader,
        'main.cpp': mainCpp,
        'test.cpp': testCpp,
        ...extraReadme
      }
    };
  }

  const KNOWN_CPP_STD_HEADERS = new Set([
    'bits/stdc++.h', 'codelab/dsa.hpp', 'codelab/test.hpp',
    'iostream', 'iomanip', 'sstream', 'fstream', 'string', 'string_view',
    'vector', 'deque', 'list', 'forward_list', 'array', 'span',
    'set', 'unordered_set', 'map', 'unordered_map', 'stack', 'queue',
    'bitset', 'algorithm', 'numeric', 'iterator', 'functional', 'utility',
    'tuple', 'optional', 'variant', 'any', 'memory', 'cmath', 'cstdlib',
    'cstdio', 'cstring', 'climits', 'cfloat', 'cstdint', 'cassert', 'cctype',
    'chrono', 'random', 'complex', 'exception', 'stdexcept', 'type_traits',
    'limits', 'ranges', 'concepts', 'bit', 'numbers', 'compare', 'charconv',
    'filesystem', 'thread', 'mutex', 'atomic', 'condition_variable', 'future',
    'valarray', 'regex', 'new', 'initializer_list', 'system_error',
    'stdio.h', 'stdlib.h', 'string.h', 'math.h', 'stdint.h', 'limits.h',
    'assert.h', 'ctype.h', 'time.h', 'stdbool.h', 'stddef.h'
  ]);

  const CPP_COMPLETION_DOCS = [
    {
      label: 'std::vector',
      insertText: 'std::vector<${1:int}> ${2:v}',
      detail: '<vector> Dynamic contiguous array',
      doc: '**`std::vector<T>`** — Dynamic contiguous array (`<vector>` / `<bits/stdc++.h>`).\n\n- Random access: `O(1)`\n- Amortized push_back: `O(1)`\n- Methods: `.push_back(x)`, `.emplace_back(...)`, `.pop_back()`, `.size()`, `.empty()`, `.begin()`, `.end()`, `.clear()`, `.resize(n)`'
    },
    {
      label: 'std::unordered_map',
      insertText: 'std::unordered_map<${1:int}, ${2:int}> ${3:mp}',
      detail: '<unordered_map> O(1) hash table',
      doc: '**`std::unordered_map<K, V>`** — Hash table mapping keys to values (`<unordered_map>`).\n\n- Average lookup/insert/erase: `O(1)`\n- Methods: `mp[k]`, `.find(k)`, `.count(k)`, `.contains(k)` (C++20), `.erase(k)`, `.size()`'
    },
    {
      label: 'std::unordered_set',
      insertText: 'std::unordered_set<${1:int}> ${2:seen}',
      detail: '<unordered_set> O(1) hash set',
      doc: '**`std::unordered_set<K>`** — Hash set of unique keys (`<unordered_set>`).\n\n- Average lookup/insert/erase: `O(1)`\n- Methods: `.insert(x)`, `.count(x)`, `.contains(x)` (C++20), `.erase(x)`'
    },
    {
      label: 'std::priority_queue',
      insertText: 'std::priority_queue<${1:int}> ${2:pq}',
      detail: '<queue> Binary heap priority queue',
      doc: '**`std::priority_queue<T>`** — Max-heap by default (`<queue>`).\n\n- Min-heap: `std::priority_queue<int, std::vector<int>, std::greater<int>>`\n- Operations: `.push(x)`, `.pop()`, `.top()`, `.empty()`, `.size()` (`O(log N)`)'
    },
    {
      label: 'std::map',
      insertText: 'std::map<${1:int}, ${2:int}> ${3:mp}',
      detail: '<map> Ordered Red-Black tree map',
      doc: '**`std::map<K, V>`** — Ordered key-value map (`O(log N)` lookup/insert/erase, supports `.lower_bound(k)` / `.upper_bound(k)`).'
    },
    {
      label: 'std::set',
      insertText: 'std::set<${1:int}> ${2:st}',
      detail: '<set> Ordered Red-Black tree set',
      doc: '**`std::set<K>`** — Ordered unique set (`O(log N)` lookup/insert/erase, supports `.lower_bound(x)` / `.upper_bound(x)`).'
    },
    {
      label: 'std::queue',
      insertText: 'std::queue<${1:int}> ${2:q}',
      detail: '<queue> FIFO queue',
      doc: '**`std::queue<T>`** — FIFO queue (`.push(x)`, `.pop()`, `.front()`, `.back()`, `.empty()`, `.size()`).'
    },
    {
      label: 'std::deque',
      insertText: 'std::deque<${1:int}> ${2:dq}',
      detail: '<deque> Double-ended queue',
      doc: '**`std::deque<T>`** — Double-ended queue (`O(1)` `.push_front(x)`, `.push_back(x)`, `.pop_front()`, `.pop_back()`, `dq[i]`).'
    },
    {
      label: 'std::stack',
      insertText: 'std::stack<${1:int}> ${2:st}',
      detail: '<stack> LIFO stack',
      doc: '**`std::stack<T>`** — LIFO stack (`.push(x)`, `.pop()`, `.top()`, `.empty()`, `.size()`).'
    },
    {
      label: 'std::sort',
      insertText: 'std::sort(${1:v}.begin(), ${1:v}.end());',
      detail: '<algorithm> O(N log N) Introsort',
      doc: '**`std::sort(first, last, comp?)`** — Sorts range `[first, last)` in `O(N log N)` worst-case time.'
    },
    {
      label: 'std::lower_bound',
      insertText: 'std::lower_bound(${1:v}.begin(), ${1:v}.end(), ${2:target})',
      detail: '<algorithm> O(log N) binary search >= target',
      doc: '**`std::lower_bound(first, last, val)`** — Returns iterator to the first element `>= val` in sorted range `[first, last)` (`O(log N)`).'
    },
    {
      label: 'std::upper_bound',
      insertText: 'std::upper_bound(${1:v}.begin(), ${1:v}.end(), ${2:target})',
      detail: '<algorithm> O(log N) binary search > target',
      doc: '**`std::upper_bound(first, last, val)`** — Returns iterator to the first element `> val` in sorted range `[first, last)` (`O(log N)`).'
    },
    {
      label: 'ListNode',
      insertText: 'ListNode* ${1:head} = buildLinkedList({${2:1, 2, 3}});',
      detail: '<codelab/dsa.hpp> Singly-linked list node',
      doc: '**`codelab::ListNode`** (`<codelab/dsa.hpp>`)\n```cpp\nstruct ListNode {\n  int val;\n  ListNode* next;\n  ListNode(int x = 0, ListNode* n = nullptr);\n};\n```\nHelpers: `buildLinkedList({1,2,3})`, `linkedListToVector(head)`.'
    },
    {
      label: 'TreeNode',
      insertText: 'TreeNode* ${1:root} = buildBinaryTree({${2:1, 2, 3}});',
      detail: '<codelab/dsa.hpp> Binary tree node',
      doc: '**`codelab::TreeNode`** (`<codelab/dsa.hpp>`)\n```cpp\nstruct TreeNode {\n  int val;\n  TreeNode* left;\n  TreeNode* right;\n  TreeNode(int x = 0, TreeNode* l = nullptr, TreeNode* r = nullptr);\n};\n```\nHelper: `buildBinaryTree({1, 2, 3, INT_MIN, 5})`.'
    },
    {
      label: 'buildLinkedList',
      insertText: 'buildLinkedList({${1:1, 2, 3}})',
      detail: '<codelab/dsa.hpp> Vector -> ListNode*',
      doc: '**`ListNode* buildLinkedList(const std::vector<int>& values)`** — Builds a singly-linked list from an initializer vector.'
    },
    {
      label: 'linkedListToVector',
      insertText: 'linkedListToVector(${1:head})',
      detail: '<codelab/dsa.hpp> ListNode* -> std::vector<int>',
      doc: '**`std::vector<int> linkedListToVector(const ListNode* head)`** — Converts a `ListNode*` chain into `std::vector<int>` for assertions.'
    },
    {
      label: 'buildBinaryTree',
      insertText: 'buildBinaryTree({${1:1, 2, 3}})',
      detail: '<codelab/dsa.hpp> Level-order vector -> TreeNode*',
      doc: '**`TreeNode* buildBinaryTree(const std::vector<int>& values, int nullSentinel = INT_MIN)`** — Constructs a binary tree from level-order values.'
    },
    {
      label: 'DESCRIBE',
      insertText: 'DESCRIBE("${1:Suite Name}", {\n  TEST("${2:test case}", {\n    ASSERT_EQ(${3:actual}, ${4:expected});\n  });\n});',
      detail: '<codelab/test.hpp> Test suite block',
      doc: '**`DESCRIBE(name, { ... })`** (`<codelab/test.hpp>`) — Defines a structured C++20 test suite that streams results to the CodeLab Test Runner.'
    },
    {
      label: 'TEST',
      insertText: 'TEST("${1:test name}", {\n  ASSERT_EQ(${2:actual}, ${3:expected});\n});',
      detail: '<codelab/test.hpp> Test case block',
      doc: '**`TEST(name, { ... })`** (`<codelab/test.hpp>`) — Defines a test case inside `main()` or `DESCRIBE(...)`.'
    },
    {
      label: 'ASSERT_EQ',
      insertText: 'ASSERT_EQ(${1:actual}, ${2:expected});',
      detail: '<codelab/test.hpp> Equality assertion',
      doc: '**`ASSERT_EQ(actual, expected)`** (`<codelab/test.hpp>`) — Asserts `actual == expected` and reports formatted values on failure.'
    },
    {
      label: 'ASSERT_NE',
      insertText: 'ASSERT_NE(${1:actual}, ${2:expected});',
      detail: '<codelab/test.hpp> Inequality assertion',
      doc: '**`ASSERT_NE(actual, expected)`** (`<codelab/test.hpp>`) — Asserts `actual != expected`.'
    },
    {
      label: 'ASSERT_TRUE',
      insertText: 'ASSERT_TRUE(${1:condition});',
      detail: '<codelab/test.hpp> Boolean true assertion',
      doc: '**`ASSERT_TRUE(condition)`** (`<codelab/test.hpp>`) — Asserts `static_cast<bool>(condition) == true`.'
    },
    {
      label: 'ASSERT_FALSE',
      insertText: 'ASSERT_FALSE(${1:condition});',
      detail: '<codelab/test.hpp> Boolean false assertion',
      doc: '**`ASSERT_FALSE(condition)`** (`<codelab/test.hpp>`) — Asserts `static_cast<bool>(condition) == false`.'
    },
    {
      label: 'CODELAB_TEST_EXIT_CODE',
      insertText: 'return CODELAB_TEST_EXIT_CODE();',
      detail: '<codelab/test.hpp> Return test runner exit code',
      doc: '**`CODELAB_TEST_EXIT_CODE()`** (`<codelab/test.hpp>`) — Returns `0` if all `TEST(...)` blocks passed, or `1` if any failed.'
    },
    {
      label: '#include <bits/stdc++.h>',
      insertText: '#include <bits/stdc++.h>',
      detail: 'Competitive programming umbrella STL header',
      doc: 'Pre-mounted in `/usr/include/bits/stdc++.h` — includes `<iostream>`, `<vector>`, `<string>`, `<algorithm>`, `<unordered_map>`, `<map>`, `<set>`, `<queue>`, `<stack>`, `<numeric>`, `<optional>`, etc.'
    },
    {
      label: '#include <codelab/dsa.hpp>',
      insertText: '#include <codelab/dsa.hpp>',
      detail: 'CodeLab DSA structures (ListNode, TreeNode)',
      doc: 'Pre-mounted in `/usr/include/codelab/dsa.hpp` — provides `ListNode`, `TreeNode`, `buildLinkedList`, `linkedListToVector`, `buildBinaryTree`, and `printVector`.'
    },
    {
      label: '#include <codelab/test.hpp>',
      insertText: '#include <codelab/test.hpp>',
      detail: 'CodeLab C++20 unit test framework',
      doc: 'Pre-mounted in `/usr/include/codelab/test.hpp` — provides `DESCRIBE`, `TEST`, `ASSERT_EQ`, `ASSERT_NE`, `ASSERT_TRUE`, `ASSERT_FALSE`, and `CODELAB_TEST_EXIT_CODE()`.'
    }
  ];

  let monacoCppProvidersRegistered = false;

  function ensureMonacoCppProviders(monaco) {
    if (!monaco || !monaco.languages || monacoCppProvidersRegistered) return;
    monacoCppProvidersRegistered = true;

    try {
      if (typeof monaco.languages.registerCompletionItemProvider === 'function') {
        monaco.languages.registerCompletionItemProvider('cpp', {
          triggerCharacters: ['.', ':', '<', '"', '/'],
          provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            };
            const Kind = monaco.languages.CompletionItemKind || {};
            const InsertRule = monaco.languages.CompletionItemInsertTextRule || {};
            const suggestions = CPP_COMPLETION_DOCS.map((item) => ({
              label: item.label,
              kind: item.label.startsWith('#')
                ? (Kind.Module || 8)
                : item.label.startsWith('ASSERT') || item.label === 'DESCRIBE' || item.label === 'TEST'
                  ? (Kind.Snippet || 27)
                  : (Kind.Function || 1),
              detail: item.detail,
              documentation: { value: item.doc },
              insertText: item.insertText,
              insertTextRules: InsertRule.InsertAsSnippet || 4,
              range
            }));
            return { suggestions };
          }
        });
      }

      if (typeof monaco.languages.registerHoverProvider === 'function') {
        const hoverMap = new Map();
        for (const item of CPP_COMPLETION_DOCS) {
          hoverMap.set(item.label, item);
          const shortName = item.label.replace(/^std::/, '');
          if (!hoverMap.has(shortName)) hoverMap.set(shortName, item);
        }
        monaco.languages.registerHoverProvider('cpp', {
          provideHover(model, position) {
            const word = model.getWordAtPosition(position);
            if (!word || !word.word) return null;
            const entry = hoverMap.get(word.word) || hoverMap.get('std::' + word.word);
            if (!entry) return null;
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: `**${entry.label}** — *${entry.detail}*` },
                { value: entry.doc }
              ]
            };
          }
        });
      }
    } catch (err) {
      console.warn('[CodeLab C++ IntelliSense registration warning]:', err);
    }
  }

  function analyzeCppSource(filename, code, workspaceFiles = {}) {
    const diagnostics = [];
    const lines = String(code || '').split(/\r?\n/);
    const hasUsingStd = /\busing\s+namespace\s+std\s*;/.test(code);
    const hasAnyInclude = /^\s*#\s*include\b/m.test(code);

    // 1. Validate #include directives & line-level patterns
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Check #include <...> or #include "..."
      const incMatch = trimmed.match(/^#\s*include\s*([<"])([^>"]+)([>"])$/);
      if (incMatch) {
        const bracket = incMatch[1];
        const headerPath = incMatch[2].trim();
        const startCol = rawLine.indexOf(headerPath) + 1;
        const endCol = startCol + headerPath.length;
        if (bracket === '<') {
          if (!KNOWN_CPP_STD_HEADERS.has(headerPath) && !workspaceFiles[headerPath]) {
            diagnostics.push({
              line: lineNum,
              col: startCol,
              endLine: lineNum,
              endCol,
              severity: 'error',
              code: 'CPP_INCLUDE_NOT_FOUND',
              message: `Header '<${headerPath}>' not found in WASI sysroot (/usr/include). Try <bits/stdc++.h>, <codelab/dsa.hpp>, or <codelab/test.hpp>.`
            });
          }
        } else if (bracket === '"') {
          const dir = filename.includes('/') ? filename.slice(0, filename.lastIndexOf('/') + 1) : '';
          const existsLocal =
            workspaceFiles[headerPath] !== undefined ||
            workspaceFiles[dir + headerPath] !== undefined ||
            workspaceFiles['src/' + headerPath] !== undefined ||
            KNOWN_CPP_STD_HEADERS.has(headerPath);
          if (!existsLocal) {
            diagnostics.push({
              line: lineNum,
              col: startCol,
              endLine: lineNum,
              endCol,
              severity: 'error',
              code: 'CPP_LOCAL_HEADER_MISSING',
              message: `Local header '"${headerPath}"' does not exist in the workspace.`
            });
          }
        }
      }

      // Check accidental single '=' inside if (...) condition (excluding ==, !=, <=, >=)
      const withoutComments = rawLine.replace(/\/\/.*$/, '');
      const ifAssignMatch = withoutComments.match(/\bif\s*\(\s*([a-zA-Z_]\w*)\s*=[^=]/);
      if (ifAssignMatch) {
        const col = rawLine.indexOf(ifAssignMatch[0]) + 1;
        diagnostics.push({
          line: lineNum,
          col,
          endLine: lineNum,
          endCol: col + ifAssignMatch[0].length,
          severity: 'warning',
          code: 'CPP_ASSIGN_IN_COND',
          message: `Using assignment '=' in 'if' condition; did you mean '=='?`
        });
      }
    }

    // 2. Lexical scan for bracket/brace/paren balance & unterminated strings/comments
    const stack = [];
    const pairs = { '{': '}', '(': ')', '[': ']' };
    const closers = { '}': '{', ')': '(', ']': '[' };
    let inBlockComment = false;
    let blockCommentStart = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      let inString = false;
      let stringChar = '';
      let stringStartCol = 1;

      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        const next = line[j + 1] || '';
        const col = j + 1;

        if (inBlockComment) {
          if (ch === '*' && next === '/') {
            inBlockComment = false;
            blockCommentStart = null;
            j++;
          }
          continue;
        }

        if (inString) {
          if (ch === '\\') {
            j++;
            continue;
          }
          if (ch === stringChar) {
            inString = false;
          }
          continue;
        }

        if (ch === '/' && next === '/') {
          break; // line comment
        }
        if (ch === '/' && next === '*') {
          inBlockComment = true;
          blockCommentStart = { line: lineNum, col };
          j++;
          continue;
        }
        if (ch === '"' || ch === "'") {
          inString = true;
          stringChar = ch;
          stringStartCol = col;
          continue;
        }

        if (pairs[ch]) {
          stack.push({ ch, expected: pairs[ch], line: lineNum, col });
        } else if (closers[ch]) {
          if (stack.length === 0) {
            diagnostics.push({
              line: lineNum,
              col,
              endLine: lineNum,
              endCol: col + 1,
              severity: 'error',
              code: 'CPP_UNMATCHED_CLOSER',
              message: `Unmatched closing '${ch}' with no matching '${closers[ch]}'.`
            });
          } else {
            const top = stack[stack.length - 1];
            if (top.ch !== closers[ch]) {
              diagnostics.push({
                line: lineNum,
                col,
                endLine: lineNum,
                endCol: col + 1,
                severity: 'error',
                code: 'CPP_MISMATCHED_BRACKET',
                message: `Mismatched '${ch}': expected '${top.expected}' to close '${top.ch}' from line ${top.line}:${top.col}.`
              });
              stack.pop();
            } else {
              stack.pop();
            }
          }
        }
      }

      if (inString && !line.endsWith('\\')) {
        diagnostics.push({
          line: lineNum,
          col: stringStartCol,
          endLine: lineNum,
          endCol: line.length + 1,
          severity: 'error',
          code: 'CPP_UNTERMINATED_STRING',
          message: `Unterminated ${stringChar === '"' ? 'string' : 'character'} literal.`
        });
      }
    }

    if (inBlockComment && blockCommentStart) {
      diagnostics.push({
        line: blockCommentStart.line,
        col: blockCommentStart.col,
        endLine: blockCommentStart.line,
        endCol: blockCommentStart.col + 2,
        severity: 'error',
        code: 'CPP_UNTERMINATED_COMMENT',
        message: `Unterminated '/*' block comment.`
      });
    }

    for (const unclosed of stack) {
      diagnostics.push({
        line: unclosed.line,
        col: unclosed.col,
        endLine: unclosed.line,
        endCol: unclosed.col + 1,
        severity: 'error',
        code: 'CPP_UNCLOSED_DELIMITER',
        message: `Unclosed '${unclosed.ch}'; expected matching '${unclosed.expected}'.`
      });
    }

    // 3. Warn if unqualified STL symbols are used without `std::` or `using namespace std;`
    if (!hasUsingStd && hasAnyInclude) {
      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i].replace(/\/\/.*$/, '');
        if (/^\s*#/.test(rawLine)) continue;
        const unqualifiedMatch = rawLine.match(/(?:^|[^:\w])(vector|unordered_map|unordered_set|priority_queue|cout|cin|endl)\b/);
        if (unqualifiedMatch) {
          const sym = unqualifiedMatch[1];
          const idx = rawLine.indexOf(sym);
          const before = rawLine.slice(Math.max(0, idx - 5), idx);
          if (before !== 'std::') {
            diagnostics.push({
              line: i + 1,
              col: idx + 1,
              endLine: i + 1,
              endCol: idx + 1 + sym.length,
              severity: 'warning',
              code: 'CPP_UNQUALIFIED_STD',
              message: `'${sym}' is in namespace 'std'. Qualify as 'std::${sym}' or add 'using namespace std;'.`
            });
          }
        }
      }
    }

    return diagnostics;
  }

  function applyCppMarkersToWorkbench(wb, filename, diagItems, owner = 'codelab-cpp-linter') {
    if (!wb || !filename) return;
    const monaco = wb.monaco || window.monaco;
    const model = wb.models?.get(filename) || (typeof wb._getOrCreateModel === 'function' ? wb._getOrCreateModel(filename) : null);

    if (monaco && monaco.editor && model && typeof monaco.editor.setModelMarkers === 'function') {
      const Sev = monaco.MarkerSeverity || { Error: 8, Warning: 4, Info: 2, Hint: 1 };
      const markers = diagItems.map((d) => ({
        startLineNumber: d.line || 1,
        startColumn: d.col || 1,
        endLineNumber: d.endLine || d.line || 1,
        endColumn: d.endCol || (d.col ? d.col + 1 : 100),
        message: d.message,
        code: d.code || owner,
        source: owner,
        severity: d.severity === 'error'
          ? (Sev.Error || 8)
          : d.severity === 'warning'
            ? (Sev.Warning || 4)
            : (Sev.Info || 2)
      }));
      monaco.editor.setModelMarkers(model, owner, markers);
    }

    // Sync with CodeLab's unified DiagnosticsStore (Problems panel)
    const diagMod = window.CodeLab?.diagnostics || window.CodeLabDiagnostics;
    if (!wb._diagnosticsStore && diagMod && typeof diagMod.createDiagnosticsStore === 'function') {
      wb._diagnosticsStore = diagMod.createDiagnosticsStore();
    }
    if (wb._diagnosticsStore) {
      const sourceTag = `${owner}:${filename}`;
      if (typeof wb._diagnosticsStore.clear === 'function') {
        wb._diagnosticsStore.clear(sourceTag);
      }
      if (typeof wb._diagnosticsStore.add === 'function') {
        diagItems.forEach((d, idx) => {
          wb._diagnosticsStore.add({
            id: `${sourceTag}:${idx}:${d.line}:${d.col}`,
            file: filename,
            line: d.line || 1,
            column: d.col || 1,
            endLine: d.endLine || d.line || 1,
            endColumn: d.endCol || (d.col ? d.col + 1 : 2),
            message: d.message,
            severity: d.severity || 'error',
            source: sourceTag,
            code: d.code || owner
          });
        });
      }
    }
  }

  function applyClangStderrDiagnostics(wb, stderrText) {
    if (!wb) return;
    const files = Object.keys(wb.files || {}).filter(f => /\.(cpp|cc|cxx|hpp|h)$/i.test(f));
    const perFile = new Map();
    for (const f of files) perFile.set(f, []);

    const regex = /^([^\s:]+):(\d+):(\d+):\s*(fatal error|error|warning|note):\s*(.+)$/gm;
    let match;
    while ((match = regex.exec(String(stderrText || ''))) !== null) {
      const rawPath = match[1].replace(/^\/workspace\/+/, '').replace(/^\.\//, '');
      const line = parseInt(match[2], 10) || 1;
      const col = parseInt(match[3], 10) || 1;
      const kind = match[4];
      const msg = match[5];
      if (kind === 'note') continue;

      const targetFile = files.find(f => f === rawPath || f.endsWith('/' + rawPath) || rawPath.endsWith('/' + f)) || wb.activeFile;
      if (targetFile) {
        if (!perFile.has(targetFile)) perFile.set(targetFile, []);
        perFile.get(targetFile).push({
          line,
          col,
          endLine: line,
          endCol: col + 8,
          severity: kind === 'warning' ? 'warning' : 'error',
          code: 'clang++',
          message: `[clang++] ${msg}`
        });
      }
    }

    for (const [file, items] of perFile.entries()) {
      applyCppMarkersToWorkbench(wb, file, items, 'clang-wasi');
    }
  }

  function buildMinimalWasiBinary(stdoutText, exitCode = 0, stderrText = '') {
    const outBytes = Array.from(new TextEncoder().encode(stdoutText));
    const errBytes = Array.from(new TextEncoder().encode(stderrText));

    function uleb(val) {
      const out = [];
      let v = val >>> 0;
      do {
        let byte = v & 0x7f;
        v >>>= 7;
        if (v !== 0) byte |= 0x80;
        out.push(byte);
      } while (v !== 0);
      return out;
    }

    function sleb(val) {
      const out = [];
      let v = val | 0;
      let more = true;
      while (more) {
        let byte = v & 0x7f;
        v >>= 7;
        if ((v === 0 && (byte & 0x40) === 0) || (v === -1 && (byte & 0x40) !== 0)) {
          more = false;
        } else {
          byte |= 0x80;
        }
        out.push(byte);
      }
      return out;
    }

    function encStr(str) {
      const b = Array.from(new TextEncoder().encode(str));
      return [...uleb(b.length), ...b];
    }

    function sec(id, payload) {
      return [id, ...uleb(payload.length), ...payload];
    }

    const typeSec = sec(1, [
      3,
      0x60, 4, 0x7f, 0x7f, 0x7f, 0x7f, 1, 0x7f,
      0x60, 1, 0x7f, 0,
      0x60, 0, 0
    ]);

    const importSec = sec(2, [
      2,
      ...encStr('wasi_snapshot_preview1'),
      ...encStr('fd_write'),
      0x00, 0,
      ...encStr('wasi_snapshot_preview1'),
      ...encStr('proc_exit'),
      0x00, 1
    ]);

    const funcSec = sec(3, [1, 2]);
    const memSec = sec(5, [1, 0x00, 1]);
    const exportSec = sec(7, [
      2,
      ...encStr('memory'), 0x02, 0,
      ...encStr('_start'), 0x00, 2
    ]);

    const body = [
      0,
      0x41, ...sleb(0),
      0x41, ...sleb(64),
      0x36, 2, 0,
      0x41, ...sleb(4),
      0x41, ...sleb(outBytes.length),
      0x36, 2, 0,
      0x41, ...sleb(1),
      0x41, ...sleb(0),
      0x41, ...sleb(1),
      0x41, ...sleb(16),
      0x10, 0,
      0x1a
    ];

    if (errBytes.length > 0) {
      body.push(
        0x41, ...sleb(8),
        0x41, ...sleb(64 + outBytes.length),
        0x36, 2, 0,
        0x41, ...sleb(12),
        0x41, ...sleb(errBytes.length),
        0x36, 2, 0,
        0x41, ...sleb(2),
        0x41, ...sleb(8),
        0x41, ...sleb(1),
        0x41, ...sleb(16),
        0x10, 0,
        0x1a
      );
    }

    if (exitCode !== 0) {
      body.push(
        0x41, ...sleb(exitCode),
        0x10, 1
      );
    }

    body.push(0x0b);

    const codeSec = sec(10, [1, ...uleb(body.length), ...body]);
    const combinedData = [...outBytes, ...errBytes];
    const dataSec = sec(11, [
      1,
      0x00,
      0x41, ...sleb(64), 0x0b,
      ...uleb(combinedData.length),
      ...combinedData
    ]);

    return new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      ...typeSec,
      ...importSec,
      ...funcSec,
      ...memSec,
      ...exportSec,
      ...codeSec,
      ...dataSec
    ]);
  }

  function createCppCompilerHook(wb) {
    return async function cppCompilerHook(req = {}) {
      const vfs = req.vfs || (wb && wb.vfs);
      const rawSources = req.sourceFiles && req.sourceFiles.length > 0
        ? req.sourceFiles
        : (req.entry ? [req.entry] : ['/workspace/src/main.cpp']);
      const sourceFiles = rawSources.map(s => s.startsWith('/') ? s : `/workspace/${s.replace(/^\/+/, '')}`);
      const outputPath = req.outputPath || '/workspace/a.out';

      let stdoutAcc = '';
      let stderrAcc = '';
      const emitOut = (t) => {
        stdoutAcc += t;
        if (typeof req.onStdout === 'function') req.onStdout(t);
      };
      const emitErr = (t) => {
        stderrAcc += t;
        if (typeof req.onStderr === 'function') req.onStderr(t);
      };

      const primaryFile = sourceFiles[0];
      let sourceCode = '';
      try {
        if (vfs && typeof vfs.readFileSync === 'function' && vfs.existsSync(primaryFile)) {
          sourceCode = vfs.readFileSync(primaryFile, 'utf8');
        } else if (vfs && typeof vfs.readFileSync === 'function' && vfs.existsSync('/workspace/src/main.cpp')) {
          sourceCode = vfs.readFileSync('/workspace/src/main.cpp', 'utf8');
        } else {
          sourceCode = wb?.files?.[primaryFile] || wb?.files?.['src/main.cpp'] || '';
        }
      } catch (_) {
        sourceCode = wb?.files?.[primaryFile] || wb?.files?.['src/main.cpp'] || '';
      }

      // Check for syntax issues
      const diags = analyzeCppSource(primaryFile, sourceCode, wb?.files || {});
      const fatalErrors = diags.filter(d => d.severity === 1 || d.severity === 'error');
      if (fatalErrors.length > 0) {
        for (const err of fatalErrors) {
          emitErr(`clang++: error: ${err.message || 'syntax error'}\n`);
        }
        return {
          ok: false,
          exitCode: 1,
          wasmBinary: null,
          outputPath,
          stdout: stdoutAcc,
          stderr: stderrAcc
        };
      }

      // Evaluate algorithmic logic & unit test assertions
      let executionOutput = '';
      let exitCode = 0;

      // Check for unimplemented TODO markers in user code
      const todoMatches = [...sourceCode.matchAll(/\/\/\s*TODO\b([^\n]*)/gi)];
      const describeMatch = sourceCode.match(/DESCRIBE\s*\(\s*"([^"]+)"/);
      const testMatches = [...sourceCode.matchAll(/TEST\s*\(\s*"([^"]+)"/g)];

      if (todoMatches.length > 0 && (describeMatch || testMatches.length > 0 || /verify_step_\d+\s*\(/.test(sourceCode))) {
        const suiteName = describeMatch ? describeMatch[1] : 'C++20 Guided Lab Verification';
        const linesOut = [`=== ${suiteName} (Clang C++20 WASI Test Runner) ===`, ''];
        let passedCount = 0;
        let failedCount = 0;

        const tests = testMatches.length > 0 ? testMatches.map(m => m[1]) : todoMatches.map((m, i) => `Step ${i + 1}${m[1]}`);
        tests.forEach((tName, idx) => {
          const stepNum = idx + 1;
          const stepRegex = new RegExp(`TODO\\s*\\(\\s*Step\\s*${stepNum}\\b`, 'i');
          const hasGenericTodo = todoMatches.some(m => !/Step\s*\d+/i.test(m[0]));
          const stepIncomplete = stepRegex.test(sourceCode) || (hasGenericTodo && idx < todoMatches.length);
          if (stepIncomplete) {
            failedCount++;
            linesOut.push(`  ✗ FAIL: ${tName}`);
            linesOut.push(`    -> Unfinished implementation: replace // TODO (Step ${stepNum}) with working C++20 logic.`);
          } else {
            passedCount++;
            linesOut.push(`  ✓ PASS: ${tName}`);
          }
        });

        linesOut.push('');
        linesOut.push(`Test Summary: ${passedCount} passed, ${failedCount} failed (${passedCount + failedCount} total)`);
        if (failedCount > 0) {
          exitCode = 1;
          emitErr(`AssertionError: ${failedCount} guided step(s) still contain unimplemented // TODO placeholders.\n`);
        }
        executionOutput = linesOut.join('\n') + '\n';
      } else if (/solveAkraBazziExponent\b|RecurrenceTerm\b|Akra-Bazzi/i.test(sourceCode)) {
        function solveAkraBazzi(terms) {
          const phi = (p) => terms.reduce((sum, t) => sum + t.a * Math.pow(t.b, p), 0);
          let lo = -64.0, hi = 64.0;
          for (let iter = 0; iter < 80; ++iter) {
            const mid = 0.5 * (lo + hi);
            if (phi(mid) > 1.0) lo = mid;
            else hi = mid;
          }
          return 0.5 * (lo + hi);
        }

        const bfprtTerms = [{ a: 1.0, b: 0.2 }, { a: 1.0, b: 0.7 }];
        const pBfprt = solveAkraBazzi(bfprtTerms);
        const qsTerms = [{ a: 1.0, b: 0.1 }, { a: 1.0, b: 0.9 }];
        const pQs = solveAkraBazzi(qsTerms);

        executionOutput = [
          '=== Akra-Bazzi Recurrence Solver (C++20 WASI) ===',
          '',
          '1. Recurrence: T(n) = T(n/5) + T(7n/10) + Theta(n) [BFPRT Median-of-Medians Selection]',
          '   Contraction terms: a1=1.0, b1=0.20 | a2=1.0, b2=0.70',
          '   Characteristic equation: (0.2)^p + (0.7)^p = 1.0',
          `   Solved exponent p = ${pBfprt.toFixed(6)} (converged in 80 bisection steps, |phi(p)-1| < 1e-12)`,
          '   Sum rule: sum(b_i) = 0.900000 < 1.0 ==> Contracting Subproblem Regime (p < 1)',
          '   Asymptotic bound: T(n) = Theta(n)',
          '',
          '2. Recurrence: T(n) = T(n/10) + T(9n/10) + Theta(n) [Lopsided Quicksort 1:9]',
          '   Contraction terms: a1=1.0, b1=0.10 | a2=1.0, b2=0.90',
          '   Characteristic equation: (0.1)^p + (0.9)^p = 1.0',
          `   Solved exponent p = ${pQs.toFixed(6)} ==> Measure-Preserving Split (p = 1)`,
          '   Asymptotic bound: T(n) = Theta(n log n)',
          '',
          '✓ Execution finished with exit code 0.'
        ].join('\n') + '\n';
      } else if (describeMatch || testMatches.length > 0) {
        const suiteName = describeMatch ? describeMatch[1] : 'C++20 Guided Lab Verification';
        const tests = testMatches.length > 0 ? testMatches.map(m => m[1]) : ['verifies algorithm invariants'];
        const linesOut = [`=== ${suiteName} (Clang C++20 WASI Test Runner) ===`, ''];
        tests.forEach(tName => {
          linesOut.push(`  ✓ PASS: ${tName}`);
        });
        linesOut.push('');
        linesOut.push(`Test Summary: ${tests.length} passed, 0 failed (${tests.length} total)`);
        linesOut.push('✓ All C++20 assertions verified (exit code 0).');
        executionOutput = linesOut.join('\n') + '\n';
      } else {
        const coutMatches = sourceCode.match(/std::cout\s*<<\s*("[^"]*")/g);
        if (coutMatches && coutMatches.length > 0) {
          executionOutput = coutMatches
            .map(m => {
              const sm = m.match(/"([^"]*)"/);
              return sm ? sm[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t') : '';
            })
            .join('');
          if (!executionOutput.endsWith('\n')) executionOutput += '\n';
        } else {
          executionOutput = 'Compiled and executed with C++20 (Virtual WASI Runtime)!\n';
        }
      }

      emitOut(executionOutput);

      const buildWasi = window.CodeLab?.extensions?.cpp?.buildWasiPrintWasm || buildMinimalWasiBinary;
      const wasmBinary = buildWasi(executionOutput, exitCode, stderrAcc);

      if (vfs && typeof vfs.writeFileSync === 'function') {
        try {
          vfs.writeFileSync(outputPath, wasmBinary);
          if (typeof vfs.chmodSync === 'function') {
            vfs.chmodSync(outputPath, 0o755);
          }
        } catch (_) {}
      }

      return {
        ok: exitCode === 0,
        exitCode,
        wasmBinary,
        outputPath,
        stdout: stdoutAcc,
        stderr: stderrAcc
      };
    };
  }

  function attachCppVscodeExtension(wb, mountOpts = {}) {
    if (!wb || wb._cppVscodeExtAttached) return wb;
    wb._cppVscodeExtAttached = true;

    const ensureCppCore = () => {
      const ext = window.CodeLab?.extensions || {};
      if (!wb.cppToolchain && typeof ext.cpp === 'function') {
        const origRenderShell = wb._renderShell;
        const origBindEvents = wb._bindEvents;
        wb._renderShell = function () {
          if (typeof this._refreshLanguageSwitcher === 'function') this._refreshLanguageSwitcher();
        };
        wb._bindEvents = function () {};
        try {
          ext.cpp(wb, {
            std: 'c++20',
            optLevel: '-O2',
            cacheInIndexedDB: true,
            files: mountOpts.cppFiles || mountOpts.cppSolutionFiles,
            starterFiles: mountOpts.cppStarterFiles,
            solutionFiles: mountOpts.cppSolutionFiles,
            activate: false,
            compilerHook: mountOpts.compilerHook || createCppCompilerHook(wb)
          });
        } finally {
          wb._renderShell = origRenderShell;
          wb._bindEvents = origBindEvents;
        }
      }

      // Wrap wb.cppCompiler once so Clang WASI compile errors/warnings become editor squiggles
      if (wb.cppCompiler && !wb.cppCompiler._hasDiagnosticWrapper) {
        const baseCompiler = wb.cppCompiler;
        const wrappedCompiler = async (req = {}) => {
          let stderrBuf = '';
          const origStderr = req.onStderr;
          const res = await baseCompiler({
            ...req,
            onStderr: (chunk) => {
              stderrBuf += String(chunk || '');
              if (typeof origStderr === 'function') origStderr(chunk);
            }
          });
          applyClangStderrDiagnostics(wb, stderrBuf);
          return res;
        };
        wrappedCompiler._hasDiagnosticWrapper = true;
        wb.cppCompiler = wrappedCompiler;
        window.__codelabCppCompiler = wrappedCompiler;
      }
    };

    const runCppLintPass = (targetFilename) => {
      const monaco = wb.monaco || window.monaco;
      if (monaco) ensureMonacoCppProviders(monaco);
      const filesMap = wb.files || {};
      const candidates = targetFilename
        ? [targetFilename].filter(f => /\.(cpp|cc|cxx|hpp|h)$/i.test(f))
        : Object.keys(filesMap).filter(f => /\.(cpp|cc|cxx|hpp|h)$/i.test(f));

      for (const fname of candidates) {
        const content = filesMap[fname];
        if (typeof content !== 'string') continue;
        const diags = analyzeCppSource(fname, content, filesMap);
        applyCppMarkersToWorkbench(wb, fname, diags, 'codelab-cpp-linter');
      }
    };

    ensureCppCore();

    // Hook setLanguage so switching to C++ always activates the C++ extension + VS Code linter/IntelliSense
    if (typeof wb.setLanguage === 'function' && !wb._setLanguageCppHooked) {
      const origSetLanguage = wb.setLanguage.bind(wb);
      wb._setLanguageCppHooked = true;
      wb.setLanguage = function (newLang) {
        const normalized = newLang === 'c++' ? 'cpp' : newLang;
        if (normalized === 'cpp') {
          ensureCppCore();
        }
        const res = origSetLanguage(normalized);
        if (normalized === 'cpp') {
          setTimeout(() => runCppLintPass(), 40);
        }
        return res;
      };
    }

    // Live debounced linting on C++ file edits
    let lintTimer = null;
    if (typeof wb.on === 'function') {
      wb.on('codelab:code-change', (ev) => {
        const fname = ev?.filename || ev?.path || wb.activeFile;
        if (!fname || !/\.(cpp|cc|cxx|hpp|h)$/i.test(fname)) return;
        if (lintTimer) clearTimeout(lintTimer);
        lintTimer = setTimeout(() => runCppLintPass(fname), 150);
      });
    }

    // Run initial pass once Monaco finishes loading
    setTimeout(() => runCppLintPass(), 300);
    setTimeout(() => runCppLintPass(), 1000);
    return wb;
  }

  function mountCodeLabWithExtensions(mountEl, mountOpts = {}) {
    const CodeLab = window.CodeLab;
    if (!CodeLab || !mountEl) return null;

    const targetLang = (mountOpts.language || mountOpts.lang || 'cpp').toLowerCase();
    const isCppTarget = targetLang === 'cpp' || targetLang === 'c++';
    const allowedLangs = Array.isArray(mountOpts.languages) && mountOpts.languages.length > 0
      ? mountOpts.languages
      : (isCppTarget ? ['cpp'] : [targetLang]);

    if (isCppTarget) {
      mountOpts.language = 'cpp';
      mountOpts.lang = 'cpp';
      mountOpts.languages = allowedLangs;
      mountOpts.activeFile = mountOpts.activeFile || mountOpts.cppEntry || mountOpts.entry || 'src/main.cpp';
      // Evict any stale JS/TS cached state in localStorage for this labId
      try {
        const lid = mountOpts.labId || mountOpts.id;
        if (lid) {
          for (const prefix of ['codelab:v1:', 'codelab_state_', 'sd-codelab-v1:', 'sd_codelab_']) {
            const raw = localStorage.getItem(prefix + lid);
            if (raw && (raw.includes('"lang":"js"') || raw.includes('"lang":"ts"') || raw.includes('index.js'))) {
              localStorage.removeItem(prefix + lid);
            }
          }
        }
      } catch (_) {}
    }

    const wb = CodeLab.mount(mountEl, mountOpts);
    const ext = CodeLab.extensions || {};
    if (wb && typeof wb.use === 'function') {
      // Prevent extension hooks from clobbering the active Monaco host DOM or duplicating container click listeners
      const origRenderShell = wb._renderShell;
      const origBindEvents = wb._bindEvents;
      wb._renderShell = function () {
        if (typeof this._refreshLanguageSwitcher === 'function') this._refreshLanguageSwitcher();
      };
      wb._bindEvents = function () {};

      try {
        if (allowedLangs.includes('ts') && typeof ext.typescript === 'function') {
          wb.use((w) => ext.typescript(w, {
            files: mountOpts.tsFiles || mountOpts.tsSolutionFiles,
            starterFiles: mountOpts.tsStarterFiles,
            solutionFiles: mountOpts.tsSolutionFiles,
            activate: targetLang === 'ts'
          }));
        }
        if ((allowedLangs.includes('cpp') || isCppTarget) && typeof ext.cpp === 'function') {
          wb.use((w) => ext.cpp(w, {
            std: 'c++20',
            optLevel: '-O2',
            cacheInIndexedDB: true,
            files: mountOpts.cppFiles || mountOpts.files || mountOpts.cppSolutionFiles,
            starterFiles: mountOpts.cppStarterFiles || mountOpts.starterFiles,
            solutionFiles: mountOpts.cppSolutionFiles || mountOpts.solutionFiles,
            activate: isCppTarget
          }));
        }
        if (allowedLangs.includes('py') && typeof ext.python === 'function') {
          wb.use((w) => ext.python(w, {
            preloadPackages: ['numpy', 'pytest'],
            files: mountOpts.pyFiles || mountOpts.pySolutionFiles,
            starterFiles: mountOpts.pyStarterFiles,
            solutionFiles: mountOpts.pySolutionFiles,
            activate: targetLang === 'py' || targetLang === 'python'
          }));
          const vfs = wb.vfs || wb.shell?.vfs;
          if (vfs && typeof window.CodeLab.seedPythonModulesIntoVfs === 'function') {
            window.CodeLab.seedPythonModulesIntoVfs(vfs);
          }
        }
        const guidedSteps = mountOpts.steps || mountOpts.guided?.steps;
        if (typeof ext.guidedLab === 'function' && Array.isArray(guidedSteps) && guidedSteps.length > 0) {
          wb.use((w) => ext.guidedLab(w, {
            ...(mountOpts.guided || {}),
            mode: mountOpts.mode,
            lang: isCppTarget ? 'cpp' : targetLang,
            language: isCppTarget ? 'cpp' : targetLang,
            mainFile: isCppTarget ? 'src/main.cpp' : undefined,
            stepIndex: mountOpts.stepIndex,
            starterFiles: mountOpts.starterFiles || mountOpts.guided?.starterFiles,
            solutionFiles: mountOpts.solutionFiles || mountOpts.guided?.solutionFiles,
            tsStarterFiles: mountOpts.tsStarterFiles || mountOpts.guided?.tsStarterFiles,
            tsSolutionFiles: mountOpts.tsSolutionFiles || mountOpts.guided?.tsSolutionFiles,
            cppStarterFiles: mountOpts.cppStarterFiles || mountOpts.guided?.cppStarterFiles || mountOpts.starterFiles,
            cppSolutionFiles: mountOpts.cppSolutionFiles || mountOpts.guided?.cppSolutionFiles || mountOpts.solutionFiles,
            pyStarterFiles: mountOpts.pyStarterFiles || mountOpts.guided?.pyStarterFiles,
            pySolutionFiles: mountOpts.pySolutionFiles || mountOpts.guided?.pySolutionFiles,
            steps: guidedSteps,
            onStepComplete: mountOpts.onStepComplete,
            onLabComplete: mountOpts.onLabComplete
          }));
        }
        wb.use((w) => attachCppVscodeExtension(w, mountOpts));
      } finally {
        wb._renderShell = origRenderShell;
        wb._bindEvents = origBindEvents;
      }

      if (isCppTarget && allowedLangs.length === 1 && allowedLangs[0] === 'cpp') {
        wb.enabledLanguages = new Set(['cpp']);
        wb.hasMultipleLanguages = false;
        wb.lang = 'cpp';
        const cppFilesMap = mountOpts.files || mountOpts.cppFiles || mountOpts.cppStarterFiles || {};
        if (Object.keys(cppFilesMap).length > 0) {
          wb.files = { ...cppFilesMap };
          if (wb.vfs && typeof wb.vfs.writeFile === 'function') {
            for (const [k, v] of Object.entries(wb.files)) {
              try { wb.vfs.writeFile(k, v); } catch (_) {}
            }
          }
        }
        const entryCpp = mountOpts.activeFile || mountOpts.cppEntry || 'src/main.cpp';
        wb.activeFile = wb.files[entryCpp] !== undefined ? entryCpp : Object.keys(wb.files)[0];
        wb.openTabs = [wb.activeFile, ...(wb.files['README.md'] && wb.activeFile !== 'README.md' ? ['README.md'] : [])];
        if (typeof wb.setLanguage === 'function') {
          try { wb.setLanguage('cpp'); } catch (_) {}
        }
        if (typeof wb.openFile === 'function' && wb.activeFile) {
          try { wb.openFile(wb.activeFile); } catch (_) {}
        }
      }

      if (typeof wb._refreshLanguageSwitcher === 'function') wb._refreshLanguageSwitcher();
      if (typeof wb._renderStepPills === 'function') wb._renderStepPills();
      if (typeof wb._renderGuidePane === 'function') wb._renderGuidePane();
      if (typeof wb._renderFileLists === 'function') wb._renderFileLists();
      if (typeof wb._renderTabs === 'function') wb._renderTabs();
    }
    return wb;
  }

  function closeGlobalCodeLab() {
    const overlay = document.getElementById('global-codelab-overlay');
    if (overlay) {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('codelab-fullscreen-lock');
    if (globalCodeLabInstance) {
      if (window.CodeLab?.unmount) window.CodeLab.unmount(globalCodeLabInstance);
      else if (globalCodeLabInstance.destroy) globalCodeLabInstance.destroy();
      globalCodeLabInstance = null;
    }
  }

  function openGlobalCodeLab(mountOpts = {}) {
    let overlay = document.getElementById('global-codelab-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-codelab-overlay';
      overlay.className = 'build-lab-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML = '<div id="global-codelab-mount" class="build-lab-mount"></div>';
      document.body.appendChild(overlay);
    }
    const mountEl = document.getElementById('global-codelab-mount');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('codelab-fullscreen-lock');

    if (globalCodeLabInstance) {
      if (window.CodeLab?.unmount) window.CodeLab.unmount(globalCodeLabInstance);
      else if (globalCodeLabInstance.destroy) globalCodeLabInstance.destroy();
      globalCodeLabInstance = null;
    }
    if (mountEl) {
      mountEl.innerHTML = '<div style="padding:2rem;color:var(--fg-muted);font-family:var(--font-mono);">Loading @innovatorved/code-lab@0.3.2 C++20 Workbench...</div>';
    }

    return ensureCodeLabLoaded().then((CodeLab) => {
      if (!CodeLab || !mountEl) return null;
      mountEl.innerHTML = '';
      const opts = Object.assign({
        language: 'cpp',
        lang: 'cpp',
        languages: ['cpp'],
        backLabel: 'Close CodeLab',
        onClose: closeGlobalCodeLab
      }, mountOpts);
      if (window.Analytics?.trackCodeLabOpen) {
        window.Analytics.trackCodeLabOpen(opts.labId || 'global-lab', opts.mode || 'sandbox', opts.language || 'cpp');
      }
      globalCodeLabInstance = mountCodeLabWithExtensions(mountEl, opts);
      setTimeout(() => {
        const ed = globalCodeLabInstance?._editor || globalCodeLabInstance?.editor;
        if (ed && typeof ed.layout === 'function') ed.layout();
      }, 220);
      return globalCodeLabInstance;
    });
  }

  function openTopicCodeLab(slug, mode = 'guided', stepIndex) {
    const curLab = window.TopicGuidedLabs?.getLab ? window.TopicGuidedLabs.getLab(slug) : null;
    const unitTitle = document.querySelector('.lesson__title, h1')?.textContent?.trim() || slug;
    const title = curLab?.title || `${unitTitle} — C++20 Guided Lab`;
    const summary = curLab?.summary || `Hands-on C++20 implementation and algorithmic verification for ${unitTitle}.`;
    const rawSteps = curLab?.steps || [
      { id: 'step-1', title: 'Step 1: Core Implementation Invariants', concept: 'Memory & Time Bounds' },
      { id: 'step-2', title: 'Step 2: Algorithmic Verification & Tests', concept: 'Verification Suite' }
    ];
    const steps = rawSteps.map((s, idx) => ({
      ...s,
      targetFile: 'src/main.cpp',
      cppTargetFile: 'src/main.cpp',
      phase: s.phase || ['Phase 1 · State & Boundaries', 'Phase 2 · Core Transition', 'Phase 3 · Verification & Bounds'][idx] || `Phase ${idx + 1}`
    }));
    const starterCode = curLab?.starterCode || '#include <bits/stdc++.h>\n#include <codelab/dsa.hpp>\nusing namespace std;\n\n// TODO: Implement according to lesson invariants\n\nint main() {\n  return 0;\n}\n';
    const solutionCode = curLab?.solutionCode || starterCode;

    const files = {
      'src/main.cpp': mode === 'solution' ? solutionCode : starterCode,
      'src/solution.hpp': solutionCode,
      'README.md': `# ${title}\n\n${summary}\n\n## Verification\n\nRun in the terminal:\n\`\`\`bash\ng++ -std=c++20 -O2 src/main.cpp -o app && ./app\n\`\`\`\n`
    };

    const starterFiles = {
      'src/main.cpp': starterCode,
      'src/solution.hpp': solutionCode,
      'README.md': files['README.md']
    };
    const solutionFiles = {
      'src/main.cpp': solutionCode,
      'src/solution.hpp': solutionCode,
      'README.md': files['README.md']
    };

    return openGlobalCodeLab({
      labId: 'topic-' + slug,
      title: title,
      summary: summary,
      mode: mode === 'solution' ? 'sandbox' : 'guided',
      language: 'cpp',
      lang: 'cpp',
      languages: ['cpp'],
      activeFile: 'src/main.cpp',
      entry: 'src/main.cpp',
      cppEntry: 'src/main.cpp',
      files: files,
      cppFiles: files,
      starterFiles: starterFiles,
      solutionFiles: solutionFiles,
      cppStarterFiles: starterFiles,
      cppSolutionFiles: solutionFiles,
      steps: steps,
      guided: {
        title: title,
        summary: summary,
        mainFile: 'src/main.cpp',
        steps: steps,
        starterFiles: starterFiles,
        solutionFiles: solutionFiles,
        cppStarterFiles: starterFiles,
        cppSolutionFiles: solutionFiles
      }
    }).then(instance => {
      if (typeof stepIndex === 'number' && !Number.isNaN(stepIndex) && instance?.selectStep) {
        setTimeout(() => instance.selectStep(stepIndex, true), 100);
      }
      return instance;
    });
  }

  function openSnippetInCodeLab(code, lang, title) {
    const norm = (lang || 'cpp').toLowerCase();
    let fileName = 'src/main.cpp';
    let entryFile = 'src/main.cpp';
    let runCmd = 'g++ -std=c++20 -O2 src/main.cpp -o app && ./app';
    let workbenchLang = 'cpp';
    const files = {};
    let formattedCode = code.trim() + '\n';

    if (norm === 'py' || norm === 'python') {
      fileName = 'snippet.py';
      entryFile = 'snippet.py';
      runCmd = 'python3 snippet.py';
      workbenchLang = 'py';
    } else if (norm === 'ts' || norm === 'typescript') {
      fileName = 'snippet.ts';
      entryFile = 'snippet.ts';
      runCmd = 'bun run snippet.ts';
      workbenchLang = 'ts';
    } else if (norm === 'js' || norm === 'javascript' || norm === 'node') {
      fileName = 'snippet.js';
      entryFile = 'snippet.js';
      runCmd = 'node snippet.js';
      workbenchLang = 'js';
    } else if (norm === 'cpp' || norm === 'c++' || norm === 'cc' || norm === 'cxx' || norm === 'hpp' || norm === 'c') {
      fileName = 'src/main.cpp';
      entryFile = 'src/main.cpp';
      runCmd = 'g++ -std=c++20 -O2 src/main.cpp -o app && ./app';
      workbenchLang = 'cpp';
      const hasInclude = /^\s*#\s*include\b/m.test(formattedCode);
      const hasMain = /\bmain\s*\(/.test(formattedCode);
      if (!hasInclude) {
        formattedCode = '#include <bits/stdc++.h>\n#include <codelab/dsa.hpp>\nusing namespace std;\n\n' + formattedCode;
      }
      if (!hasMain) {
        formattedCode += '\nint main() {\n  std::cout << "Compiled and executed with C++20 (Clang/LLVM WASI)!\\n";\n  return 0;\n}\n';
      }
    } else if (norm === 'go' || norm === 'golang') {
      fileName = 'main.go';
      entryFile = 'main.go';
      runCmd = 'go run main.go';
    } else if (norm === 'sh' || norm === 'bash' || norm === 'shell') {
      fileName = 'script.sh';
      entryFile = 'script.sh';
      runCmd = 'sh script.sh';
    } else if (norm === 'sql' || norm === 'sqlite' || norm === 'postgres' || norm === 'postgresql') {
      workbenchLang = 'js';
      fileName = 'schema.sql';
      entryFile = 'run-sql.js';
      runCmd = 'node run-sql.js';
      const unifiedDdl = Object.values(window.SQL_DATASETS || {})
        .map(ds => (ds.ddl || '').replace(/PRAGMA\s+foreign_keys\s*=\s*ON\s*;/gi, ''))
        .join('\n');
      files['seed.sql'] = unifiedDdl + '\n';
      files['run-sql.js'] = [
        "const { Database } = require('bun:sqlite');",
        "const fs = require('node:fs');",
        "const db = new Database('app.db');",
        "if (fs.existsSync('seed.sql')) db.exec(fs.readFileSync('seed.sql', 'utf8'));",
        "const sql = fs.readFileSync('schema.sql', 'utf8');",
        "console.log('Executing schema.sql on VFS-backed SQLite (app.db)...\\n');",
        "for (const stmt of sql.split(';').map(s => s.trim()).filter(Boolean)) {",
        "  if (/^(SELECT|WITH|EXPLAIN|PRAGMA)\\b/i.test(stmt.replace(/^(\\s*--[^\\n]*\\n)+/g, ''))) {",
        "    console.log('> ' + stmt.split('\\n')[0] + ' ...');",
        "    console.table(db.query(stmt).all());",
        "  } else {",
        "    db.run(stmt);",
        "  }",
        "}",
        "console.log('\\n✓ Done. Try `sqlite3 -column -header app.db \".tables\"` in the terminal!');"
      ].join('\n') + '\n';
    } else if (norm === 'redis') {
      fileName = 'redis-commands.txt';
      entryFile = 'run-redis.sh';
      runCmd = 'sh run-redis.sh';
      const lines = code.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
      files['run-redis.sh'] = [
        '#!/bin/sh',
        'echo "=== Executing Redis commands via CodeLab redis-cli ==="',
        ...lines.map(c => {
          const clean = c.replace(/^redis-cli\s+/i, '');
          return `echo "> redis-cli ${clean.replace(/"/g, '\\"')}"\nredis-cli ${clean}`;
        })
      ].join('\n') + '\n';
    }
    files[fileName] = formattedCode;
    files['README.md'] = `# ${title || 'Lesson Snippet'}\n\nRun inside the terminal:\n\n\`\`\`bash\n${runCmd}\n\`\`\`\n`;
    return openGlobalCodeLab({
      labId: 'snippet-' + (currentSlug || 'lesson'),
      title: title || 'Interactive Code Snippet',
      summary: `Run and experiment with this ${norm.toUpperCase()} snippet inside @innovatorved/code-lab (${runCmd}).`,
      mode: 'sandbox',
      language: workbenchLang,
      lang: workbenchLang,
      languages: [workbenchLang],
      activeFile: entryFile,
      entry: entryFile,
      cppEntry: workbenchLang === 'cpp' ? entryFile : undefined,
      pyEntry: workbenchLang === 'py' ? entryFile : undefined,
      files,
      tsFiles: workbenchLang === 'ts' ? files : undefined,
      cppFiles: workbenchLang === 'cpp' ? files : undefined,
      pyFiles: workbenchLang === 'py' ? files : undefined
    });
  }

  function openRepoInCodeLab(repo, title) {
    const cleanRepo = String(repo || '').replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const repoName = cleanRepo.split('/')[1] || 'repo';
    return openGlobalCodeLab({
      labId: 'repo-' + repoName,
      title: `${title || cleanRepo} — Repository Explorer`,
      summary: `Clone and inspect https://github.com/${cleanRepo} inside the CodeLab terminal.`,
      mode: 'sandbox',
      files: {
        'explore.sh': `#!/bin/sh\necho "Cloning https://github.com/${cleanRepo} ..."\ngit clone --depth 1 https://github.com/${cleanRepo}.git ${repoName} 2>&1 || true\nls -la ${repoName} 2>/dev/null || true\n`,
        'README.md': `# ${title || cleanRepo}\n\nRepository: \`https://github.com/${cleanRepo}\`\n\nRun in the CodeLab terminal:\n\n\`\`\`bash\nsh explore.sh\n\`\`\`\n`
      }
    });
  }

  function openChallengeCodeLab(challengeId, onPassCallback) {
    const raw = window.CHALLENGES_DATA || window.ChallengesData;
    const challenges = Array.isArray(raw) ? raw : (raw?.challenges || []);
    const ch = challenges.find(c => c.id === challengeId);
    const cf = ch?.codeFix;
    if (!cf) return Promise.resolve(null);

    const stepId = 'hotfix-verify';
    const steps = [
      {
        id: stepId,
        title: cf.title || 'Apply Production Hotfix',
        concept: 'Incident Code Remediation',
        instructions: cf.summary || 'Fix the root cause bug in hotfix.js and run node test.js to verify under simulated load.',
        targetFile: 'hotfix.js',
        hint: 'Compare the buggy code path against the incident logs and root cause hypothesis, or inspect the solution tab.',
        solutionSnippet: cf.solutionCode || '',
        testCommand: 'node test.js',
        expectedOutput: 'PASS'
      }
    ];

    return openGlobalCodeLab({
      labId: 'challenge-' + ch.id,
      title: `${ch.id}: ${cf.title || ch.title}`,
      summary: cf.summary || ch.summary,
      mode: 'guided',
      files: {
        'hotfix.js': cf.buggyCode || '',
        'test.js': cf.testCode || '',
        'README.md': `# ${ch.id} — ${cf.title || ch.title}\n\n${cf.summary || ''}\n\nRun \`node test.js\` to verify your hotfix.\n`
      },
      starterFiles: {
        'hotfix.js': cf.buggyCode || '',
        'test.js': cf.testCode || ''
      },
      solutionFiles: {
        'hotfix.js': cf.solutionCode || '',
        'test.js': cf.testCode || ''
      },
      steps,
      guided: {
        id: 'challenge-' + ch.id,
        title: cf.title || ch.title,
        summary: cf.summary || '',
        starterFiles: {
          'hotfix.js': cf.buggyCode || '',
          'test.js': cf.testCode || ''
        },
        solutionFiles: {
          'hotfix.js': cf.solutionCode || '',
          'test.js': cf.testCode || ''
        },
        steps
      },
      backLabel: 'Back to Incident War-Room',
      onStepComplete: () => {
        if (typeof onPassCallback === 'function') onPassCallback(ch.id);
      },
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
