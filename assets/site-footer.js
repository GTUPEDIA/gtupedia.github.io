(function renderSiteFooter() {
  const footer = document.querySelector('[data-site-footer]');
  if (!footer) return;

  const base = window.__GTUPEDIA_BASE || '/';
  const root = base.endsWith('/') ? base : `${base}/`;

  const links = {
    home: root,
    team: `${root}team/`,
    resources: `${root}resources/`,
    about: `${root}#about`,
  };

  footer.innerHTML = `
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <p class="site-footer__name">
          GTUPEDIA <span class="beta-badge beta-badge--footer">Beta</span>
        </p>
        <p class="site-footer__tagline">For students, by students — GTU exam papers and study resources.</p>
      </div>
      <nav class="site-footer__links" aria-label="Footer">
        <a href="${links.team}">Team GTUPEDIA</a>
        <a href="${links.resources}">Resources</a>
        <a href="${links.about}">About</a>
        <a href="${links.home}">Home</a>
      </nav>
    </div>
    <p class="site-footer__copy">Made for practical exam season survival.</p>`;
})();
