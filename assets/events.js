(function renderEvents() {
  const introEl = document.querySelector('#events-intro');
  const listEl = document.querySelector('#events-list');
  if (!introEl || !listEl) return;

  function dataUrl(path) {
    const base = window.__GTUPEDIA_BASE || '/';
    const root = base.endsWith('/') ? base : `${base}/`;
    return `${root}${path.replace(/^\//, '')}`;
  }

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderEventCard(event, type) {
    const url = event.url || '';
    const meta = [event.date, event.venue].filter(Boolean).join(' · ');
    return `
      <article class="event-card">
        <span class="event-type">${escapeHtml(type)}</span>
        <h3 class="event-name">${url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(event.name)}</a>`
    : escapeHtml(event.name)}</h3>
        ${meta ? `<p class="event-meta">${escapeHtml(meta)}</p>` : ''}
        ${event.theme ? `<p class="event-theme">${escapeHtml(event.theme)}</p>` : ''}
        ${event.summary ? `<p class="event-summary">${escapeHtml(event.summary)}</p>` : ''}
        ${event.organizer ? `<p class="event-organizer">Organized by ${escapeHtml(event.organizer)}</p>` : ''}
        ${url ? `<a class="event-cta" href="${escapeHtml(url)}" target="_blank" rel="noopener">Event website ↗</a>` : ''}
      </article>`;
  }

  function renderCategory(category) {
    const events = category.events || [];
    if (!events.length) return '';
    const cards = events.map(event => renderEventCard(event, category.type)).join('');
    return `
      <section class="event-group">
        <h2 class="event-group__title">${escapeHtml(category.type)}</h2>
        <div class="event-group__grid">${cards}</div>
      </section>`;
  }

  fetch(dataUrl('api/v1/events.php'))
    .then(response => response.ok ? response : fetch(dataUrl('data/events.json')))
    .then(response => {
      if (!response.ok) throw new Error('Failed to load events');
      return response.json();
    })
    .then(data => {
      introEl.textContent = data.intro || introEl.textContent;
      const html = (data.categories || []).map(renderCategory).filter(Boolean).join('');
      if (html) listEl.innerHTML = html;
    })
    .catch(() => {
      /* Keep static HTML fallback (Prawaas) when JSON is unavailable. */
    });
})();
