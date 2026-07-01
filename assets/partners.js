(function renderPartners() {
  const introEl = document.querySelector('#partners-intro');
  const gridEl = document.querySelector('#partners-grid');
  if (!introEl || !gridEl) return;

  const base = window.__GTUPEDIA_BASE || '/';
  const root = base.endsWith('/') ? base : `${base}/`;

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hostLabel(url = '') {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (_) {
      return url;
    }
  }

  function renderPartnerCard(partner) {
    const url = partner.url || '#';
    return `
      <a class="partner-card" href="${escapeHtml(url)}" target="_blank" rel="noopener sponsored">
        <h3 class="partner-name">${escapeHtml(partner.name)}</h3>
        <p class="partner-url">${escapeHtml(hostLabel(url))} ↗</p>
      </a>`;
  }

  function renderCategory(category) {
    const cards = (category.partners || []).map(renderPartnerCard).join('');
    if (!cards) return '';
    return `
      <section class="partner-group">
        <h2 class="partner-role">${escapeHtml(category.role)}</h2>
        <div class="partner-group__grid">${cards}</div>
      </section>`;
  }

  fetch(`${root}data/partners.json`, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Failed to load partners');
      return response.json();
    })
    .then(data => {
      introEl.textContent = data.intro || 'Thank you to our partners for supporting GTUPEDIA.';
      const html = (data.categories || []).map(renderCategory).filter(Boolean).join('');
      gridEl.innerHTML = html || '<p class="empty">Partner information will appear here soon.</p>';
    })
    .catch(() => {
      introEl.textContent = 'Thank you to the organisations that support GTUPEDIA.';
      gridEl.innerHTML = '<p class="empty">Could not load partner list. Please try again later.</p>';
    });
})();
