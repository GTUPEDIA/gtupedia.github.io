const state = {
  library: null,
  category: 'all',
  topic: 'all',
  query: '',
};

const els = {
  search: document.querySelector('#resource-search'),
  chips: document.querySelector('#topic-chips'),
  categories: document.querySelector('#category-grid'),
  results: document.querySelector('#resource-results'),
  resultTitle: document.querySelector('#results-title'),
  resultCount: document.querySelector('#results-count'),
  updated: document.querySelector('#library-updated'),
};

function basePath() {
  if (window.__RESOURCES_BASE) return window.__RESOURCES_BASE;
  const match = window.location.pathname.match(/^(.*\/resources\/)/);
  return match ? match[1] : '/resources/';
}

function homeUrl() {
  const root = window.__GTUPEDIA_BASE || '/';
  return root.endsWith('/') ? root : `${root}/`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[ch]);
}

function categoryName(id) {
  return state.library.categories.find(item => item.id === id)?.name || id;
}

function topicName(id) {
  return state.library.topics.find(item => item.id === id)?.name || id;
}

function countByCategory(categoryId) {
  return state.library.items.filter(item => item.category === categoryId).length;
}

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  state.category = params.get('category') || 'all';
  state.topic = params.get('topic') || 'all';
  state.query = params.get('q') || '';
  if (els.search) els.search.value = state.query;
}

function writeFiltersToUrl() {
  const params = new URLSearchParams();
  if (state.category !== 'all') params.set('category', state.category);
  if (state.topic !== 'all') params.set('topic', state.topic);
  if (state.query.trim()) params.set('q', state.query.trim());
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState(null, '', next);
}

function filteredItems() {
  const tokens = state.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return state.library.items.filter(item => {
    if (state.category !== 'all' && item.category !== state.category) return false;
    if (state.topic !== 'all' && !(item.topics || []).includes(state.topic)) return false;
    if (!tokens.length) return true;
    const haystack = [
      item.title,
      item.description,
      item.source,
      item.type,
      categoryName(item.category),
      ...(item.topics || []).map(topicName),
      ...(item.tags || []),
    ].filter(Boolean).join(' ').toLowerCase();
    return tokens.every(token => haystack.includes(token));
  });
}

function renderCategories() {
  if (!els.categories) return;
  els.categories.innerHTML = state.library.categories.map(category => {
    const count = countByCategory(category.id);
    const href = `?category=${encodeURIComponent(category.id)}`;
    return `
      <a class="category-card" href="${href}">
        <h3>${escapeHtml(category.name)}</h3>
        <p>${escapeHtml(category.description)}</p>
        <span class="category-count">${count} resource${count === 1 ? '' : 's'}</span>
      </a>`;
  }).join('');
}

function renderTopicChips() {
  if (!els.chips) return;
  const topics = [{ id: 'all', name: 'All topics' }, ...state.library.topics];
  els.chips.innerHTML = topics.map(topic => `
    <button type="button" class="chip${state.topic === topic.id ? ' is-active' : ''}" data-topic="${escapeHtml(topic.id)}">
      ${escapeHtml(topic.name)}
    </button>`).join('');

  els.chips.querySelectorAll('[data-topic]').forEach(button => {
    button.addEventListener('click', () => {
      state.topic = button.dataset.topic;
      writeFiltersToUrl();
      renderAll();
    });
  });
}

function renderResults() {
  const items = filteredItems();
  const activeCategory = state.category !== 'all'
    ? state.library.categories.find(item => item.id === state.category)
    : null;

  if (els.resultTitle) {
    els.resultTitle.textContent = activeCategory
      ? activeCategory.name
      : (state.query.trim() ? `Search: ${state.query.trim()}` : 'All resources');
  }
  if (els.resultCount) {
    els.resultCount.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;
  }

  if (!els.results) return;

  if (!items.length) {
    els.results.innerHTML = `
      <div class="empty-state">
        <p><strong>No resources here yet.</strong></p>
        <p>Add links in <code>resources/data/library.json</code> — see <code>HOW-TO-ADD.md</code> for the format.</p>
      </div>`;
    return;
  }

  els.results.innerHTML = items.map(item => `
    <a class="resource-card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
        <div class="resource-meta">
          ${item.recommended ? '<span class="tag tag--star">Recommended</span>' : ''}
          <span class="tag">${escapeHtml(categoryName(item.category))}</span>
          ${item.source ? `<span class="tag">${escapeHtml(item.source)}</span>` : ''}
          ${(item.topics || []).map(id => `<span class="tag">${escapeHtml(topicName(id))}</span>`).join('')}
        </div>
      </div>
      <span class="resource-open" aria-hidden="true">↗</span>
    </a>`).join('');
}

function renderAll() {
  renderCategories();
  renderTopicChips();
  renderResults();
}

function bindSearch() {
  if (!els.search) return;
  let timer = null;
  els.search.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      state.query = els.search.value;
      writeFiltersToUrl();
      renderResults();
    }, 250);
  });
}

readFiltersFromUrl();
bindSearch();

fetch(`${basePath()}data/library.json`, { cache: 'no-store' })
  .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load library')))
  .then(library => {
    state.library = library;
    if (els.updated && library.updatedAt) {
      els.updated.textContent = `Last updated ${library.updatedAt}`;
    }
    renderAll();
  })
  .catch(() => {
    if (els.results) {
      els.results.innerHTML = '<div class="empty-state"><p>Could not load the resource library. Try again shortly.</p></div>';
    }
  });
