/**
 * Topic Guided CodeLab Controller — SQL In Depth
 * Connects topic guided lab cards to the SQL Studio & guided lab workbench.
 */
(function () {
  'use strict';

  function openTopicCodeLab(slug, mode, stepIndex) {
    if (window.App && typeof window.App.openTopicCodeLab === 'function') {
      return window.App.openTopicCodeLab(slug, mode, stepIndex);
    }
  }

  window.TopicCodeLab = {
    openTopicCodeLab: openTopicCodeLab
  };
})();
