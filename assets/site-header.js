(function renderSiteHeader() {
  const header = document.querySelector('[data-site-header]');
  if (!header) return;

  const base = window.__GTUPEDIA_BASE || '/';
  const root = base.endsWith('/') ? base : `${base}/`;

  const links = {
    resources: `${root}resources/`,
    courses: `${root}#courses`,
    events: `${root}events/`,
    partners: `${root}partners/`,
    team: `${root}team/`,
  };

  function activeKey() {
    const path = location.pathname.toLowerCase();
    if (path.includes('/events')) return 'events';
    if (path.includes('/partners')) return 'partners';
    if (path.includes('/team')) return 'team';
    if (path.includes('/resources')) return 'resources';
    return null;
  }

  const current = activeKey();

  function navLink(key, label, href) {
    const active = current === key;
    return `<a href="${href}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
  }

  header.innerHTML = `
    <div class="brand-group">
      <a class="brand" href="${root}" aria-label="GTUPEDIA home">GTU<span>PEDIA</span></a>
      <span class="beta-badge">Beta</span>
    </div>
    <nav aria-label="Primary navigation">
      ${navLink('resources', 'Resources', links.resources)}
      <a href="${links.courses}">Courses</a>
      ${navLink('events', 'Events', links.events)}
      ${navLink('partners', 'Partners', links.partners)}
      ${navLink('team', 'Team', links.team)}
    </nav>`;
})();
