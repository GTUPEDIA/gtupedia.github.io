(function initSiteBase() {
  var legacyPrefix = '/gtupedia.github.io';
  var path = location.pathname;
  window.__GTUPEDIA_BASE = path.indexOf(legacyPrefix) === 0 ? legacyPrefix + '/' : '/';
  var baseEl = document.querySelector('base');
  if (baseEl) baseEl.href = window.__GTUPEDIA_BASE;
})();

window.gtuFetchJson = function gtuFetchJson(apiPath, jsonPath) {
  var root = window.__GTUPEDIA_BASE || '/';
  if (root.slice(-1) !== '/') root += '/';

  function url(path) {
    return root + String(path || '').replace(/^\//, '');
  }

  function read(path) {
    return fetch(url(path)).then(function (response) {
      if (!response.ok) throw new Error('Could not load data');
      return response.json();
    });
  }

  return read(apiPath).catch(function () {
    return read(jsonPath);
  });
};
