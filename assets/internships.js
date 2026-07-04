(function renderInternships() {
  const introEl = document.querySelector('#internships-intro');
  const noteEl = document.querySelector('#internships-note');
  const filtersEl = document.querySelector('#internship-filters');
  const listEl = document.querySelector('#internships-list');
  const countEl = document.querySelector('#internships-count');
  if (!listEl) return;

  const base = window.__GTUPEDIA_BASE || '/';
  const root = base.endsWith('/') ? base : `${base}/`;

  const state = { domain: 'all', course: 'all', items: [] };

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function domainsFromItems(items) {
    const set = new Set(items.map(item => item.domain).filter(Boolean));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }

  function coursesFromItems(items) {
    const set = new Set();
    items.forEach(item => (item.courses || []).forEach(course => set.add(course)));
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }

  function matchesFilters(item) {
    if (state.domain !== 'all' && item.domain !== state.domain) return false;
    if (state.course !== 'all') {
      const courses = item.courses || [];
      if (!courses.includes(state.course)) return false;
    }
    return true;
  }

  function renderChipGroup(label, key, options, active) {
    if (options.length <= 1) return '';
    return `
      <div class="internship-filter-group">
        <p class="internship-filter-label">${escapeHtml(label)}</p>
        <div class="internship-filter-chips" role="group" aria-label="${escapeHtml(label)}">
          ${options.map(option => {
            const value = option === 'all' ? 'all' : option;
            const text = option === 'all' ? 'All' : option;
            const isActive = active === value;
            return `<button type="button" class="chip${isActive ? ' is-active' : ''}" data-filter-key="${escapeHtml(key)}" data-filter-value="${escapeHtml(value)}">${escapeHtml(text)}</button>`;
          }).join('')}
        </div>
      </div>`;
  }

  function renderFilters() {
    if (!filtersEl) return;
    const domains = domainsFromItems(state.items);
    const courses = coursesFromItems(state.items);
    filtersEl.innerHTML = `
      ${renderChipGroup('Domain', 'domain', domains, state.domain)}
      ${renderChipGroup('Suitable for', 'course', courses, state.course)}`;
    filtersEl.querySelectorAll('[data-filter-key]').forEach(button => {
      button.addEventListener('click', () => {
        state[button.dataset.filterKey] = button.dataset.filterValue;
        renderList();
        renderFilters();
      });
    });
  }

  function renderSkillTags(skills = []) {
    if (!skills.length) return '';
    return `<div class="internship-skills">${skills.map(skill => `<span class="tag">${escapeHtml(skill)}</span>`).join('')}</div>`;
  }

  function renderCourseTags(courses = []) {
    if (!courses.length) return '';
    return `<p class="internship-courses">${courses.map(course => `<span class="tag">${escapeHtml(course)}</span>`).join('')}</p>`;
  }

  function renderInternshipCard(item) {
    const applyUrl = item.applyUrl || item.companyUrl || '';
    const companyUrl = item.companyUrl || '';
    const meta = [item.location, item.mode, item.duration].filter(Boolean).join(' · ');
    const payLine = [item.type, item.stipend].filter(Boolean).join(' · ');
    return `
      <article class="internship-card" id="${escapeHtml(item.id || '')}">
        <div class="internship-card__head">
          <span class="internship-domain">${escapeHtml(item.domain || 'Internship')}</span>
          ${item.deadline ? `<span class="internship-deadline">${escapeHtml(item.deadline)}</span>` : ''}
        </div>
        <h3 class="internship-role">${escapeHtml(item.role)}</h3>
        <p class="internship-company">${companyUrl
    ? `<a href="${escapeHtml(companyUrl)}" target="_blank" rel="noopener">${escapeHtml(item.company)}</a>`
    : escapeHtml(item.company)}</p>
        ${payLine ? `<p class="internship-pay">${escapeHtml(payLine)}</p>` : ''}
        ${meta ? `<p class="internship-meta">${escapeHtml(meta)}</p>` : ''}
        ${item.summary ? `<p class="internship-summary">${escapeHtml(item.summary)}</p>` : ''}
        ${item.eligibility ? `<p class="internship-eligibility"><strong>Eligibility:</strong> ${escapeHtml(item.eligibility)}</p>` : ''}
        ${renderCourseTags(item.courses)}
        ${renderSkillTags(item.skills)}
        <div class="internship-card__foot">
          ${item.posted ? `<span class="internship-posted">Posted ${escapeHtml(item.posted)}</span>` : ''}
          ${applyUrl ? `<a class="internship-cta" href="${escapeHtml(applyUrl)}" target="_blank" rel="noopener">Apply on company site ↗</a>` : ''}
        </div>
      </article>`;
  }

  function renderList() {
    const visible = state.items.filter(matchesFilters);
    if (countEl) {
      countEl.textContent = visible.length
        ? `${visible.length} listing${visible.length === 1 ? '' : 's'}`
        : 'No listings match these filters';
    }
    if (!visible.length) {
      listEl.innerHTML = '<p class="empty">No internships match your filters yet. Try another domain or programme, or check back soon.</p>';
      return;
    }

    const groups = new Map();
    visible.forEach(item => {
      const domain = item.domain || 'Other';
      if (!groups.has(domain)) groups.set(domain, []);
      groups.get(domain).push(item);
    });

    listEl.innerHTML = Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([domain, items]) => `
        <section class="internship-group">
          <h2 class="internship-group__title">${escapeHtml(domain)}</h2>
          <div class="internship-group__grid">${items.map(renderInternshipCard).join('')}</div>
        </section>`)
      .join('');
  }

  fetch(`${root}data/internships.json`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load internships');
      return response.json();
    })
    .then(data => {
      if (introEl && data.intro) introEl.textContent = data.intro;
      if (noteEl && data.listingNote) noteEl.textContent = data.listingNote;
      state.items = data.internships || [];
      renderFilters();
      renderList();
    })
    .catch(() => {
      if (introEl) introEl.textContent = 'Internship openings for GTU students will appear here.';
      if (noteEl) noteEl.textContent = 'Could not load listings. Please try again later.';
      listEl.innerHTML = '<p class="empty">Could not load internships. Please refresh the page.</p>';
    });
})();
