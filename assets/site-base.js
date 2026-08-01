(function initSiteBase() {
  var legacyPrefix = '/gtupedia.github.io';
  var path = location.pathname;
  window.__GTUPEDIA_BASE = path.indexOf(legacyPrefix) === 0 ? legacyPrefix + '/' : '/';
  var baseEl = document.querySelector('base');
  if (baseEl) baseEl.href = window.__GTUPEDIA_BASE;
})();
