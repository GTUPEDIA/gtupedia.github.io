const state = { catalog: null };
const content = document.querySelector('#content');
const branchList = document.querySelector('#branch-list');
const searchInput = document.querySelector('#search-input');

function urlFor(params = {}) {
  const query = new URLSearchParams(params);
  return `./${query.size ? `?${query}` : ''}`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function renderBranches() {
  const branches = state.catalog.branches || [];
  branchList.innerHTML = branches.length ? branches.map(branch => `
    <a class="branch-card" href="${urlFor({ branch: branch.id })}">
      <span class="branch-code">${escapeHtml(branch.id)}</span>
      <h3>${escapeHtml(branch.name)}</h3>
      <p>Browse subjects and resources</p>
    </a>`).join('') : '<p class="empty">Branch data will appear here once it is imported.</p>';
}

function renderBranch(branchId) {
  const branch = state.catalog.branches.find(item => String(item.id) === branchId);
  const subjects = (state.catalog.subjects || []).filter(subject => String(subject.branchId) === branchId || String(subject.branchId) === '0');
  if (!branch) return renderNotFound('That branch is not in the catalogue yet.');
  const bySemester = subjects.reduce((groups, subject) => {
    const semester = subject.semester || 'Unsorted';
    (groups[semester] ||= []).push(subject);
    return groups;
  }, {});
  content.innerHTML = `<a class="back-link" href="./#branches">← All branches</a><p class="eyebrow">${escapeHtml(branch.name)}</p><h2>Choose a subject</h2>${Object.keys(bySemester).length ? `<div class="subject-groups">${Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([semester, items]) => `<section class="subject-group"><h2>Semester ${escapeHtml(semester)}</h2><div class="subject-list">${items.map(subject => `<a class="subject-card" href="${urlFor({ subject: subject.id })}"><span class="tag">${escapeHtml(subject.id)}</span><h3>${escapeHtml(subject.name)}</h3><p>Open papers and material</p></a>`).join('')}</div></section>`).join('')}</div>` : '<p class="empty">No subjects have been imported for this branch yet.</p>'}`;
}

function renderSubject(subjectId) {
  const subject = (state.catalog.subjects || []).find(item => String(item.id) === subjectId);
  if (!subject) return renderNotFound('That subject is not in the catalogue yet.');
  const resources = (state.catalog.resources || []).filter(item => String(item.subjectId) === subjectId);
  content.innerHTML = `<a class="back-link" href="${urlFor({ branch: subject.branchId })}">← Back to subjects</a><p class="eyebrow">Semester ${escapeHtml(subject.semester || '—')} · ${escapeHtml(subject.id)}</p><h2>${escapeHtml(subject.name)}</h2>${resources.length ? `<div class="resource-list">${resources.map(resource => `<a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener"><span class="tag">${escapeHtml(resource.type)}</span><h3>${escapeHtml(resource.title)}</h3><p>${[resource.exam, resource.author].filter(Boolean).map(escapeHtml).join(' · ') || 'Open resource'}</p></a>`).join('')}</div>` : '<p class="empty">No papers or material are attached to this subject yet.</p>'}`;
}

function renderSearch(term) {
  const normalized = term.trim().toLowerCase();
  if (!normalized) { content.innerHTML = ''; return; }
  const matches = (state.catalog.subjects || []).filter(subject => `${subject.id} ${subject.name}`.toLowerCase().includes(normalized));
  content.innerHTML = `<p class="eyebrow">Search results</p><h2>${matches.length ? `${matches.length} matching subject${matches.length === 1 ? '' : 's'}` : 'No matching subjects'}</h2>${matches.length ? `<div class="subject-list">${matches.map(subject => `<a class="subject-card" href="${urlFor({ subject: subject.id })}"><span class="tag">${escapeHtml(subject.id)}</span><h3>${escapeHtml(subject.name)}</h3><p>Semester ${escapeHtml(subject.semester || '—')}</p></a>`).join('')}</div>` : '<p class="empty">Try a different subject code or name.</p>'}`;
}

function renderNotFound(message) { content.innerHTML = `<p class="empty">${escapeHtml(message)} <a href="./">Return home</a>.</p>`; }

function renderRoute() {
  const params = new URLSearchParams(location.search);
  searchInput.value = '';
  if (params.has('subject')) return renderSubject(params.get('subject'));
  if (params.has('branch')) return renderBranch(params.get('branch'));
  content.innerHTML = '';
}

searchInput.addEventListener('input', event => renderSearch(event.target.value));
fetch('data/catalog.json')
  .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load catalogue')))
  .then(catalog => { state.catalog = catalog; renderBranches(); renderRoute(); })
  .catch(() => { content.innerHTML = '<p class="empty">The catalogue could not be loaded. Please try again shortly.</p>'; });
