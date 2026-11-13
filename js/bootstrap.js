/**
 * SQL In Depth — Client Bootstrap & Route-Aware Deferred Asset Loader
 * Schedules core shell scripts during idle time after first paint (or immediately on
 * user interaction), keeping TBT near zero and avoiding unsolicited analytics modals.
 */
(() => {
  let started = false;

  const isLocalHost = () => {
    const h = window.location && window.location.hostname;
    return !h || h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
  };

  const loadGA4 = () => {
    if (!window.GA_MEASUREMENT_ID || window._ga4Loaded || isLocalHost()) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    window._ga4Loaded = true;
    const ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(window.GA_MEASUREMENT_ID);
    document.head.appendChild(ga);
  };
  window.loadGA4 = loadGA4;

  const startDeferredScripts = () => {
    if (started) return;
    started = true;

    // Load core shell scripts (`data-defer`) in strict DOM order.
    // Heavy route-scoped bundles (`data-lazy`) stay dormant until requested by `window.Lazy`.
    document.querySelectorAll('script[data-defer]').forEach(old => {
      const s = document.createElement('script');
      s.src = old.getAttribute('src');
      s.async = false;
      document.body.appendChild(s);
    });

    // Respect privacy by default: only load GA4 when explicitly granted in storage
    try {
      if (localStorage.getItem('sd-consent') === 'granted') {
        loadGA4();
      }
    } catch {}
  };

  // Trigger immediately on first user interaction
  ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, startDeferredScripts, { once: true, passive: true });
  });

  // Schedule cleanly in idle time after paint so LCP and TBT stay fast
  const scheduleIdleBoot = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(startDeferredScripts, { timeout: 900 });
    } else {
      setTimeout(startDeferredScripts, 120);
    }
  };

  if (document.readyState === 'complete') {
    scheduleIdleBoot();
  } else {
    window.addEventListener('load', () => {
      requestAnimationFrame(scheduleIdleBoot);
    }, { once: true });
  }

  // Safety fallback for background tabs
  setTimeout(startDeferredScripts, 2500);

  // Shared Mermaid palette (also used by the theme toggle in app.js).
  window.getMermaidThemeVariables = function (isDark) {
    return {
      darkMode: isDark,
      background: isDark ? '#0a0a0a' : '#ffffff',
      primaryColor: isDark ? '#18181b' : '#fafaf9',
      primaryTextColor: isDark ? '#f4f4f5' : '#1a1917',
      primaryBorderColor: isDark ? '#3f3f46' : '#d6d3d1',
      lineColor: isDark ? '#71717a' : '#a8a29e',
      secondaryColor: isDark ? '#111113' : '#f5f5f4',
      tertiaryColor: isDark ? '#27272a' : '#e7e5e4',
      mainBkg: isDark ? '#18181b' : '#fafaf9',
      nodeBorder: isDark ? '#3f3f46' : '#d6d3d1',
      clusterBkg: isDark ? '#111113' : '#ffffff',
      clusterBorder: isDark ? '#27272a' : '#e7e5e4',
      textColor: isDark ? '#e4e4e7' : '#292524',
      edgeLabelBackground: isDark ? '#0a0a0a' : '#ffffff',
      actorBkg: isDark ? '#18181b' : '#fafaf9',
      actorBorder: isDark ? '#3f3f46' : '#d6d3d1',
      actorTextColor: isDark ? '#f4f4f5' : '#1a1917',
      signalColor: isDark ? '#a1a1aa' : '#57534e',
      signalTextColor: isDark ? '#e4e4e7' : '#292524',
      noteBkgColor: isDark ? '#27272a' : '#f5f5f4',
      noteBorderColor: isDark ? '#3f3f46' : '#d6d3d1',
      noteTextColor: isDark ? '#e4e4e7' : '#292524',
      attributeBackgroundColorOdd: isDark ? '#18181b' : '#ffffff',
      attributeBackgroundColorEven: isDark ? '#111113' : '#fafaf9',
      fontFamily: '"Geist", -apple-system, sans-serif',
      fontSize: '13px'
    };
  };

  // On-demand Mermaid Diagram Loader (Pinned version 10.9.8 with SRI integrity hash)
  window.loadMermaid = function () {
    if (window.mermaid) return Promise.resolve();
    if (window._mermaidPromise) return window._mermaidPromise;

    window._mermaidPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.8/dist/mermaid.min.js';
      s.integrity = 'sha384-N3QqR/7q+xm3BGX+CBbNI8AUmRRqcsDzToy+0z1NLDI0QmTKW8zvwLvqulJgk3dP';
      s.crossOrigin = 'anonymous';
      s.onload = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'base',
          themeVariables: window.getMermaidThemeVariables(isDark)
        });
        resolve();
      };
      s.onerror = (e) => {
        window._mermaidPromise = null;
        reject(e);
      };
      document.head.appendChild(s);
    });

    return window._mermaidPromise;
  };
})();
