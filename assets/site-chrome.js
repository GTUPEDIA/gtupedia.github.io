(function renderSiteChrome() {
  const base = window.__GTUPEDIA_BASE || '/';
  const root = base.endsWith('/') ? base : `${base}/`;

  const links = {
    home: root,
    resources: `${root}resources/`,
    courses: `${root}#courses`,
    events: `${root}events/`,
    partners: `${root}partners/`,
    team: `${root}team/`,
    ambassador: `${root}campus-ambassador/`,
    about: `${root}about/`,
  };

  const primaryNav = [
    { key: 'resources', label: 'Resources', href: links.resources },
    { key: 'courses', label: 'Courses', href: links.courses },
    { key: 'events', label: 'Events', href: links.events },
    { key: 'partners', label: 'Partners', href: links.partners },
    { key: 'team', label: 'Team', href: links.team },
  ];

  const footerNav = [
    ...primaryNav,
    { key: 'ambassador', label: 'Campus Ambassador', href: links.ambassador },
    { key: 'about', label: 'About', href: links.about },
    { key: 'home', label: 'Home', href: links.home },
  ];

  function activeKey() {
    const path = location.pathname.toLowerCase();
    if (path.includes('/resources')) return 'resources';
    if (path.includes('/events')) return 'events';
    if (path.includes('/partners')) return 'partners';
    if (path.includes('/team')) return 'team';
    if (path.includes('/campus-ambassador')) return 'ambassador';
    if (path.includes('/about')) return 'about';
    return null;
  }

  const current = activeKey();

  function navLink(item) {
    const active = current === item.key;
    return `<a href="${item.href}"${active ? ' aria-current="page"' : ''}>${item.label}</a>`;
  }

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `
      <div class="brand-group">
        <a class="brand" href="${links.home}" aria-label="GTUPEDIA home">GTU<span>PEDIA</span></a>
        <span class="beta-badge">Beta</span>
      </div>
      <nav aria-label="Primary navigation">
        ${primaryNav.map(navLink).join('')}
      </nav>`;
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) {
    footer.innerHTML = `
      <div class="site-footer__inner">
        <div class="site-footer__brand">
          <p class="site-footer__name">
            GTUPEDIA <span class="beta-badge beta-badge--footer">Beta</span>
          </p>
          <p class="site-footer__tagline">For students, by students — GTU exam papers and study resources.</p>
        </div>
        <nav class="site-footer__links" aria-label="Footer">
          ${footerNav.map(navLink).join('')}
        </nav>
      </div>
      <p class="site-footer__disclaimer">
        <strong>Disclaimer:</strong> GTUPEDIA is <em>not</em> the official website of Gujarat Technological University (GTU) and is not affiliated with, endorsed by, or operated by the university. It is an independent initiative run by students and contributors to support practical learning, exam preparation, and exploration. Materials link to official GTU sources where available.
      </p>
      <p class="site-footer__copy">Made for practical exam season survival.</p>`;
  }
})();
