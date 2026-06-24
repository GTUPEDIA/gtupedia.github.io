const state = { catalog: null, searchIndex: null };
const content = document.querySelector('#content');
const courseList = document.querySelector('#course-list');
const coursesSection = document.querySelector('#courses');
const searchInput = document.querySelector('#search-input');
const SEARCH_LIMIT = { courses: 8, branches: 12, subjects: 48 };
const BE_AD = {
  src: 'ads/startup-wala-ad.ong.PNG',
  alt: 'Startup wala MBA — GTU School of Management Studies. MBA in Innovation, Entrepreneurship and Venture Development. Admissions open.',
  url: 'https://www.gtu.ac.in/',
};
function getExamPaperSets() {
  if (state.catalog?.examPapers?.length) return state.catalog.examPapers;
  const sets = [];
  if (state.catalog?.winter2025Papers) sets.push(state.catalog.winter2025Papers);
  if (state.catalog?.summer2025Papers) sets.push(state.catalog.summer2025Papers);
  if (state.catalog?.winter2024Papers) sets.push(state.catalog.winter2024Papers);
  if (state.catalog?.summer2024Papers) sets.push(state.catalog.summer2024Papers);
  if (state.catalog?.winter2023Papers) sets.push(state.catalog.winter2023Papers);
  if (state.catalog?.summer2023Papers) sets.push(state.catalog.summer2023Papers);
  return sets;
}

function hasExamPaper(subjectCode, paperSet) {
  return paperSet?.codes?.includes(String(subjectCode).trim());
}

function gtuExamPaperUrl(subjectCode, paperSet) {
  const base = paperSet?.baseUrl || 'https://gtu.ac.in/uploads/W2025/BE';
  return `${base}/${encodeURIComponent(String(subjectCode).trim())}.pdf`;
}

function examPaperCardsForSubject(subject, courseCode) {
  if (courseCode !== 'BE') return [];
  const cards = [];
  const seen = new Set();

  for (const code of subjectCodes(subject)) {
    for (const paperSet of getExamPaperSets()) {
      if (!hasExamPaper(code, paperSet)) continue;
      const key = `${paperSet.exam}:${code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cards.push(renderGtuPaperCard(code, paperSet));
    }
  }

  return cards;
}

function appPathname() {
  let path = window.location.pathname;
  if (path.startsWith('/gtupedia.github.io')) {
    path = path.slice('/gtupedia.github.io'.length) || '/';
  }
  return path.replace(/\/+$/, '') || '/';
}

function parseRoutePath(pathname = appPathname()) {
  if (pathname === '/' || pathname === '/index.html') return {};
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 3) {
    return {
      course: decodeURIComponent(parts[0]),
      branch: decodeURIComponent(parts[1]),
      subjectCode: decodeURIComponent(parts.slice(2).join('/')),
    };
  }
  if (parts.length === 2) {
    return {
      course: decodeURIComponent(parts[0]),
      branch: decodeURIComponent(parts[1]),
    };
  }
  if (parts.length === 1) {
    return { course: decodeURIComponent(parts[0]) };
  }
  return {};
}

function urlFor(params = {}) {
  if (params.subject) {
    const subject = findSubject(params.subject);
    if (subject) {
      return urlFor({
        course: params.course || subject.courseCode || 'BE',
        branch: params.branch || subject.branchId,
        subjectCode: subject.code,
      });
    }
  }

  if (params.course && params.branch && params.subjectCode) {
    return `${params.course}/${normalizeBranchId(params.branch)}/${encodeURIComponent(params.subjectCode)}`;
  }
  if (params.course && params.branch) {
    return `${params.course}/${normalizeBranchId(params.branch)}`;
  }
  if (params.course) return `${params.course}`;
  return './';
}

function legacyQueryToPath(search = window.location.search) {
  const params = new URLSearchParams(search);
  if (params.has('subject')) {
    const subject = findSubject(params.get('subject'));
    if (!subject) return null;
    return urlFor({
      course: params.get('course') || subject.courseCode || 'BE',
      branch: params.get('branch') || subject.branchId,
      subjectCode: subject.code,
    });
  }
  if (params.has('branch')) {
    return urlFor({
      course: params.get('course') || 'BE',
      branch: params.get('branch'),
    });
  }
  if (params.has('course')) {
    return urlFor({ course: params.get('course') });
  }
  return null;
}

function isAppLink(url) {
  if (url.origin !== window.location.origin) return false;
  let path = url.pathname;
  if (path.startsWith('/gtupedia.github.io')) {
    path = path.slice('/gtupedia.github.io'.length) || '/';
  }
  if (path === '/' || path === '/index.html') return true;
  const courseCode = path.split('/').filter(Boolean)[0];
  return Boolean(getCourse(courseCode));
}

function absoluteAppUrl(path = './') {
  const base = window.__GTUPEDIA_BASE || '/';
  if (path === './' || path === '.') return base.replace(/\/$/, '') || '/';
  return `${base}${String(path).replace(/^\//, '')}`;
}

function navigateTo(path, { replace = false } = {}) {
  const next = absoluteAppUrl(path);
  if (replace) window.history.replaceState(null, '', next);
  else window.history.pushState(null, '', next);
  renderRoute();
}

function initClientNavigation() {
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const url = new URL(link.href, window.location.href);
    if (!isAppLink(url)) return;
    event.preventDefault();
    let path = url.pathname;
    if (path.startsWith('/gtupedia.github.io')) {
      path = path.slice('/gtupedia.github.io'.length) || '/';
    }
    const routePath = path.replace(/\/+$/, '') || '/';
    navigateTo(routePath === '/' ? './' : routePath.replace(/^\//, ''), { replace: false });
  });

  window.addEventListener('popstate', () => renderRoute());
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function formatLabel(name = '') {
  if (name !== name.toUpperCase()) return name;
  return name
    .toLowerCase()
    .replace(/\b([a-z])/g, (_, letter) => letter.toUpperCase());
}

function normalizeBranchId(raw = '') {
  const value = String(raw).trim();
  if (!value) return value;
  if (value === '0') return '0';
  if (/^\d+$/.test(value)) return value.padStart(2, '0');
  return value.toUpperCase();
}

function branchIdsMatch(a, b) {
  return normalizeBranchId(a) === normalizeBranchId(b);
}

function isSem12Subject(subject) {
  return subject.semester === 1 || subject.semester === 2;
}

function subjectCodes(subject) {
  return [...new Set([subject.code, ...(subject.alternateCodes || [])].filter(Boolean))];
}

function findSubject(subjectId) {
  const id = String(subjectId);
  return (state.catalog.subjects || []).find(item => String(item.id) === id
    || (item.alternateIds || []).includes(id));
}

function subjectMatchesBranch(subject, branchId) {
  if (branchIdsMatch(subject.branchId, branchId)) return true;
  if (String(subject.branchId) === '0' && isSem12Subject(subject)) return true;
  return false;
}

function findSubjectForBranch(branchId, subjectRef) {
  const ref = String(subjectRef);
  if (ref.includes('@')) return findSubject(ref);

  const normalizedBranch = normalizeBranchId(branchId);
  return (state.catalog.subjects || []).find(subject => {
    if (!subjectMatchesBranch(subject, normalizedBranch)) return false;
    if (subject.code === ref) return true;
    return (subject.alternateCodes || []).includes(ref);
  });
}

function getCourse(courseCode) {
  return (state.catalog.courses || []).find(item => item.code === courseCode);
}

function getCourseBranches(courseCode) {
  const course = getCourse(courseCode);
  if (course?.branches?.length) return course.branches;
  if (courseCode === 'BE') return state.catalog.branches || [];
  return [];
}

function findBranch(branchId, courseCode) {
  const branches = courseCode ? getCourseBranches(courseCode) : [];
  return branches.find(item => branchIdsMatch(item.id, branchId))
    || (state.catalog.branches || []).find(item => branchIdsMatch(item.id, branchId));
}

function findCourseForBranch(branchId) {
  for (const course of state.catalog.courses || []) {
    if ((course.branches || []).some(branch => branchIdsMatch(branch.id, branchId))) return course.code;
  }
  if ((state.catalog.branches || []).some(branch => branchIdsMatch(branch.id, branchId))) return 'BE';
  return null;
}

function subjectsForBranch(branchId, courseCode = 'BE') {
  const normalizedId = normalizeBranchId(branchId);
  return (state.catalog.subjects || []).filter(subject => {
    if ((subject.courseCode || 'BE') !== courseCode) return false;
    if (branchIdsMatch(subject.branchId, normalizedId)) return true;
    if (String(subject.branchId) === '0' && (subject.semester === 1 || subject.semester === 2)) return true;
    return false;
  });
}

function groupSubjectsBySemester(subjects) {
  const groups = new Map();

  for (const subject of subjects) {
    const label = isSem12Subject(subject)
      ? '1 & 2'
      : (subject.semesterLabel || `Semester ${subject.semester || 'Unsorted'}`);

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(subject);
  }

  return [...groups.entries()].sort(([a], [b]) => {
    const semA = Number(a.match(/\d+/)?.[0] || a);
    const semB = Number(b.match(/\d+/)?.[0] || b);
    if (semA !== semB) return semA - semB;
    return a.localeCompare(b);
  });
}

function branchLabel(branchId, courseCode = 'BE') {
  if (branchId === '0') return 'All BE branches';
  const branch = findBranch(branchId, courseCode);
  return branch ? `${branch.id} · ${branch.name}` : branchId;
}

function subjectCountForBranch(branchId, courseCode = 'BE') {
  return subjectsForBranch(branchId, courseCode).length;
}

function setCoursesVisible(visible) {
  if (coursesSection) coursesSection.hidden = !visible;
}

function initBeAdModal() {
  const modal = document.querySelector('#be-ad-modal');
  if (!modal || modal.dataset.ready) return modal;

  const link = modal.querySelector('#be-ad-link');
  const image = modal.querySelector('#be-ad-image');
  if (link) {
    link.href = BE_AD.url || '#';
    if (!BE_AD.url) link.removeAttribute('href');
  }
  if (image) {
    image.src = BE_AD.src;
    image.alt = BE_AD.alt;
  }

  modal.addEventListener('click', event => {
    if (event.target.closest('[data-ad-close]')) hideBeAdPopup();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal && !modal.hidden) hideBeAdPopup();
  });

  modal.dataset.ready = 'true';
  return modal;
}

function showBeAdPopup() {
  const modal = initBeAdModal();
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('ad-modal-open');
  modal.querySelector('.ad-modal__close')?.focus();
}

function hideBeAdPopup() {
  const modal = document.querySelector('#be-ad-modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('ad-modal-open');
}

function maybeShowBeAdPopup(courseCode) {
  if (courseCode !== 'BE') {
    hideBeAdPopup();
    return;
  }
  window.setTimeout(showBeAdPopup, 250);
}

function buildSearchIndex() {
  const branchNames = new Map((state.catalog.branches || []).map(branch => [branch.id, branch.name]));

  state.searchIndex = (state.catalog.subjects || []).map(subject => {
    const course = getCourse(subject.courseCode || 'BE');
    const branchName = subject.branchId === '0'
      ? 'All branches'
      : (branchNames.get(subject.branchId) || subject.branchId);
    return {
      subject,
      courseCode: subject.courseCode || 'BE',
      courseName: formatLabel(course?.name || 'Bachelor of Engineering'),
      branchName,
      code: (subject.code || subject.id).toLowerCase(),
      alternateCodes: (subject.alternateCodes || []).map(item => String(item).toLowerCase()),
      name: subject.name.toLowerCase(),
      haystack: [
        subject.code,
        ...(subject.alternateCodes || []),
        subject.name,
        subject.branchId,
        branchName,
        subject.courseCode,
        course?.name,
        subject.semester,
        subject.semesterLabel,
      ].filter(Boolean).join(' ').toLowerCase(),
    };
  });
}

function searchTokens(term) {
  return term.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function scoreSubject(entry, tokens) {
  let score = 0;
  const codes = [entry.code, ...(entry.alternateCodes || [])];
  for (const token of tokens) {
    if (!entry.haystack.includes(token)) return -1;
    if (codes.includes(token)) score += 120;
    else if (codes.some(code => code.startsWith(token))) score += 80;
    else if (entry.name.startsWith(token)) score += 50;
    else if (entry.name.includes(token)) score += 25;
    else score += 8;
  }
  return score;
}

function scoreSimple(text, tokens) {
  const haystack = text.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (!haystack.includes(token)) return -1;
    if (haystack.startsWith(token)) score += 40;
    else score += 12;
  }
  return score;
}

function renderCourses() {
  const courses = state.catalog.courses || [];
  if (!courseList) return;
  courseList.innerHTML = courses.length ? courses.map(course => {
    const branchCount = getCourseBranches(course.code).length;
    const subjectCount = (state.catalog.subjects || []).filter(subject => subject.courseCode === course.code).length;
    const detail = subjectCount
      ? `${branchCount || 'No'} branch${branchCount === 1 ? '' : 'es'} · ${subjectCount} subjects`
      : branchCount
        ? `${branchCount} branch${branchCount === 1 ? '' : 'es'}`
        : 'Subjects and resources coming soon';
    return `
    <a class="branch-card course-card" href="${urlFor({ course: course.code })}">
      <span class="branch-code">${escapeHtml(course.code)}</span>
      <h3>${escapeHtml(formatLabel(course.name))}</h3>
      <p>${escapeHtml(detail)}</p>
    </a>`;
  }).join('') : '<p class="empty">Course data will appear here once it is imported.</p>';
}

function renderCourse(courseCode) {
  const course = getCourse(courseCode);
  if (!course) return renderNotFound('That course is not in the catalogue yet.');
  setCoursesVisible(false);
  const branches = getCourseBranches(courseCode);
  content.innerHTML = `
    <a class="back-link" href="./#courses">← All courses</a>
    <p class="eyebrow">${escapeHtml(formatLabel(course.name))}</p>
    <h2>Select your branch</h2>
    ${branches.length ? `<div class="card-grid">${branches.map(branch => {
      const count = subjectCountForBranch(branch.id, courseCode);
      return `
      <a class="branch-card" href="${urlFor({ course: courseCode, branch: branch.id })}">
        <span class="branch-code">${escapeHtml(branch.id)}</span>
        <h3>${escapeHtml(branch.name)}</h3>
        <p>${count ? `${count} subjects listed` : 'Browse subjects and resources'}</p>
      </a>`;
    }).join('')}</div>` : '<p class="empty">No branches have been imported for this course yet.</p>'}`;
  maybeShowBeAdPopup(courseCode);
}

function renderSubjectCard(subject, meta = '', branchId = subject.branchId) {
  const code = subject.code || subject.id;
  const courseCode = subject.courseCode || 'BE';
  return `
    <a class="subject-card" href="${urlFor({ course: courseCode, branch: branchId, subjectCode: code })}">
      <span class="tag">${escapeHtml(code)}</span>
      <h3>${escapeHtml(subject.name)}</h3>
      <p>${escapeHtml(meta || `Semester ${subject.semester || '—'}`)}</p>
    </a>`;
}

function renderBranch(courseCode, branchId) {
  const branch = findBranch(branchId, courseCode);
  const resolvedCourse = courseCode || findCourseForBranch(branchId);
  const subjects = subjectsForBranch(branchId, resolvedCourse || 'BE');
  if (!branch) return renderNotFound('That branch is not in the catalogue yet.');
  setCoursesVisible(false);
  const backHref = resolvedCourse ? urlFor({ course: resolvedCourse }) : './#courses';
  const semesterGroups = groupSubjectsBySemester(subjects);
  content.innerHTML = `
    <a class="back-link" href="${backHref}">← Back to branches</a>
    <p class="eyebrow">${escapeHtml(branch.name)}</p>
    <h2>Choose a subject</h2>
    ${semesterGroups.length ? `<div class="subject-groups">${semesterGroups.map(([label, items]) => `
      <section class="subject-group">
        <h2>${escapeHtml(label)}</h2>
        <div class="subject-list">${items.map(subject => renderSubjectCard(subject, 'Open papers and material', branchId)).join('')}</div>
      </section>`).join('')}</div>` : '<p class="empty">No subjects have been imported for this branch yet.</p>'}`;
  maybeShowBeAdPopup(resolvedCourse || 'BE');
}

function renderGtuPaperCard(subjectCode, paperSet) {
  const url = gtuExamPaperUrl(subjectCode, paperSet);
  const label = paperSet.exam || 'Exam paper';
  return `
    <a class="resource-card paper-card" href="${escapeHtml(url)}" target="_blank" rel="noopener">
      <span class="tag">paper</span>
      <h3>${escapeHtml(label)}</h3>
      <p>GTU official question paper</p>
    </a>`;
}

function renderSubject(subjectRef, routeBranchId) {
  const branchId = routeBranchId || null;
  const subject = branchId
    ? findSubjectForBranch(branchId, subjectRef)
    : findSubject(subjectRef);
  if (!subject) return renderNotFound('That subject is not in the catalogue yet.');
  setCoursesVisible(false);
  const courseCode = subject.courseCode || findCourseForBranch(String(subject.branchId)) || 'BE';
  const backBranch = branchId || subject.branchId;
  const backHref = urlFor({ course: courseCode, branch: backBranch });
  const resources = (state.catalog.resources || []).filter(item => String(item.subjectId) === subject.id
    || (subject.alternateIds || []).includes(String(item.subjectId)));
  const code = subject.code || subject.id.split('@')[0];
  const alternateCodes = (subject.alternateCodes || []).filter(item => item !== code);
  const resourceCards = [
    ...examPaperCardsForSubject(subject, courseCode),
    ...resources.map(resource => `
      <a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener">
        <span class="tag">${escapeHtml(resource.type)}</span>
        <h3>${escapeHtml(resource.title)}</h3>
        <p>${[resource.exam, resource.author].filter(Boolean).map(escapeHtml).join(' · ') || 'Open resource'}</p>
      </a>`),
  ].filter(Boolean).join('');
  content.innerHTML = `
    <a class="back-link" href="${backHref}">← Back to subjects</a>
    <p class="eyebrow">${escapeHtml(branchLabel(backBranch, courseCode))} · ${escapeHtml(subject.semesterLabel || `Semester ${subject.semester || '—'}`)}</p>
    <h2>${escapeHtml(subject.name)}</h2>
    <p class="subject-code-line">
      <span class="tag">${escapeHtml(code)}</span>
      ${alternateCodes.length ? `<span class="subject-alt-codes">Also listed as ${alternateCodes.map(item => escapeHtml(item)).join(', ')}</span>` : ''}
    </p>
    ${resourceCards ? `<div class="resource-list">${resourceCards}</div>` : '<p class="empty">No papers or material are attached to this subject yet.</p>'}`;
  maybeShowBeAdPopup(courseCode);
}

function renderSearch(term) {
  const tokens = searchTokens(term);
  if (!tokens.length) {
    content.innerHTML = '';
    setCoursesVisible(true);
    hideBeAdPopup();
    return;
  }
  setCoursesVisible(false);
  hideBeAdPopup();

  const courseMatches = (state.catalog.courses || [])
    .map(course => ({ course, score: scoreSimple(`${course.code} ${course.name}`, tokens) }))
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  const branchMatches = (state.catalog.branches || [])
    .map(branch => ({ branch, score: scoreSimple(`${branch.id} ${branch.name}`, tokens) }))
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  const subjectMatches = (state.searchIndex || [])
    .map(entry => ({ entry, score: scoreSubject(entry, tokens) }))
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));

  const visibleCourses = courseMatches.slice(0, SEARCH_LIMIT.courses);
  const visibleBranches = branchMatches.slice(0, SEARCH_LIMIT.branches);
  const visibleSubjects = subjectMatches.slice(0, SEARCH_LIMIT.subjects);
  const total = courseMatches.length + branchMatches.length + subjectMatches.length;

  content.innerHTML = `
    <p class="eyebrow">Search results</p>
    <h2>${total ? `${total.toLocaleString()} matching result${total === 1 ? '' : 's'}` : 'No matching results'}</h2>
    <p class="search-hint">Search by subject code, subject name, branch, or course.</p>
    ${visibleCourses.length ? `
      <section class="search-group">
        <h3>Courses ${courseMatches.length > visibleCourses.length ? `(top ${visibleCourses.length} of ${courseMatches.length})` : ''}</h3>
        <div class="card-grid">${visibleCourses.map(({ course }) => `
          <a class="branch-card course-card" href="${urlFor({ course: course.code })}">
            <span class="branch-code">${escapeHtml(course.code)}</span>
            <h3>${escapeHtml(formatLabel(course.name))}</h3>
            <p>Open course branches</p>
          </a>`).join('')}</div>
      </section>` : ''}
    ${visibleBranches.length ? `
      <section class="search-group">
        <h3>Branches ${branchMatches.length > visibleBranches.length ? `(top ${visibleBranches.length} of ${branchMatches.length})` : ''}</h3>
        <div class="card-grid">${visibleBranches.map(({ branch }) => `
          <a class="branch-card" href="${urlFor({ course: 'BE', branch: branch.id })}">
            <span class="branch-code">${escapeHtml(branch.id)}</span>
            <h3>${escapeHtml(branch.name)}</h3>
            <p>Browse subjects and resources</p>
          </a>`).join('')}</div>
      </section>` : ''}
    ${visibleSubjects.length ? `
      <section class="search-group">
        <h3>Subjects ${subjectMatches.length > visibleSubjects.length ? `(top ${visibleSubjects.length} of ${subjectMatches.length.toLocaleString()})` : ''}</h3>
        <div class="subject-list">${visibleSubjects.map(({ entry }) => {
          const branchId = entry.subject.branchId === '0' ? '0' : entry.subject.branchId;
          return renderSubjectCard(
            entry.subject,
            `${entry.courseCode} · ${entry.branchName} · Semester ${entry.subject.semester}`,
            branchId,
          );
        }).join('')}</div>
      </section>` : ''}
    ${total ? '' : '<p class="empty">Try a subject code like <strong>BE03000081</strong>, a subject name like <strong>Data Structures</strong>, or a branch like <strong>Computer Engineering</strong>.</p>'}`;
}

function renderNotFound(message) {
  setCoursesVisible(false);
  hideBeAdPopup();
  content.innerHTML = `<p class="empty">${escapeHtml(message)} <a href="./">Return home</a>.</p>`;
}

function renderRoute() {
  searchInput.value = '';
  setCoursesVisible(true);

  if (window.location.search) {
    const legacyPath = legacyQueryToPath();
    if (legacyPath) {
      window.history.replaceState(null, '', absoluteAppUrl(legacyPath));
    }
  }

  const route = parseRoutePath();
  if (route.subjectCode) return renderSubject(route.subjectCode, route.branch);
  if (route.branch) return renderBranch(route.course, route.branch);
  if (route.course) return renderCourse(route.course);
  hideBeAdPopup();
  content.innerHTML = '';
}

searchInput.addEventListener('input', event => renderSearch(event.target.value));
fetch('data/catalog.json')
  .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load catalogue')))
  .then(catalog => {
    state.catalog = catalog;
    buildSearchIndex();
    initBeAdModal();
    initClientNavigation();
    renderCourses();
    renderRoute();
  })
  .catch(() => { content.innerHTML = '<p class="empty">The catalogue could not be loaded. Please try again shortly.</p>'; });
