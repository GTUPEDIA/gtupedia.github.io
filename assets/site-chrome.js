(function renderSiteChrome() {
  const base = window.__GTUPEDIA_BASE || '/';
  const root = base.endsWith('/') ? base : `${base}/`;

  const links = {
    home: root,
    resources: `${root}resources/`,
    courses: `${root}#courses`,
    events: `${root}events/`,
    internships: `${root}internships/`,
    partners: `${root}partners/`,
    team: `${root}team/`,
    ambassador: `${root}campus-ambassador/`,
    about: `${root}about/`,
    privacy: `${root}privacy/`,
    guide: `${root}guides/download-gtu-papers/`,
    githubInitiative: `${root}github-initiative/`,
  };

  const primaryNav = [
    { key: 'courses', label: 'Courses', href: links.courses },
  ];

  const footerNav = [
    ...primaryNav,
    { key: 'about', label: 'About', href: links.about },
    { key: 'privacy', label: 'Privacy', href: links.privacy },
    { key: 'guide', label: 'Download papers', href: links.guide },
    { key: 'home', label: 'Home', href: links.home },
  ];

  function activeKey() {
    const path = location.pathname.toLowerCase();
    if (path.includes('/resources')) return 'resources';
    if (path.includes('/events')) return 'events';
    if (path.includes('/internships')) return 'internships';
    if (path.includes('/partners')) return 'partners';
    if (path.includes('/team')) return 'team';
    if (path.includes('/campus-ambassador')) return 'ambassador';
    if (path.includes('/about')) return 'about';
    if (path.includes('/github-initiative')) return 'githubInitiative';
    if (path.includes('/privacy')) return 'privacy';
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

  if (!document.querySelector('#search-bar')) {
    const bar = document.createElement('div');
    bar.id = 'search-bar';
    bar.className = 'search-bar';
    bar.innerHTML = `<label class="search" for="search-input">
        <span class="visually-hidden">Search courses, branches, and subjects</span>
        <input id="search-input" type="search" placeholder="Search course, branch, or subject (2+ letters)" autocomplete="off">
      </label>`;
    if (header && header.parentNode) header.insertAdjacentElement('afterend', bar);
    else {
      const main = document.querySelector('main');
      if (main) main.insertAdjacentElement('afterbegin', bar);
    }
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
      <nav class="site-footer__papers" aria-label="GTU question papers">
        <a href="${root}BE/">BE papers</a>
        <a href="${root}DI/">Diploma papers</a>
        <a href="${root}BB/">BBA papers</a>
        <a href="${root}BC/">BCA papers</a>
        <a href="${root}MB/">MBA papers</a>
        <a href="${root}MC/">MCA papers</a>
        <a href="${root}BP/">B.Pharm papers</a>
      </nav>
      <div data-ad-footer></div>
      <p class="site-footer__disclaimer">
        <strong>Disclaimer:</strong> GTUPEDIA is <em>not</em> the official website of Gujarat Technological University (GTU) and is not affiliated with, endorsed by, or operated by the university. It is an independent initiative run by students and contributors to support practical learning, exam preparation, and exploration. Materials link to official GTU sources where available. See our <a href="${links.privacy}">Privacy Policy</a>.
      </p>
      <p class="site-footer__copy"> Made for supporting students to learn better for 21st Century.</p>`;
  }
})();
