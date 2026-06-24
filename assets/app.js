const state = { catalog: null, searchIndex: null, pageBreadcrumbs: [] };
const content = document.querySelector('#content');
const courseList = document.querySelector('#course-list');
const coursesSection = document.querySelector('#courses');
const aboutSection = document.querySelector('#about');
const heroSection = document.querySelector('#hero');
const breadcrumbsNav = document.querySelector('#breadcrumbs');
const searchInput = document.querySelector('#search-input');
const SEARCH_LIMIT = { courses: 8, branches: 12, subjects: 48 };
const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 300;
let searchDebounceTimer = null;
const SITE = {
  name: 'GTUPEDIA',
  defaultTitle: 'GTUPEDIA — GTU Papers & Study Resources',
  defaultDescription: 'Find GTU question papers, syllabus, and study material by course, branch, and subject.',
};
const BE_AD = {
  src: 'ads/startup-wala-ad.ong.PNG',
  alt: 'Startup wala MBA — GTU School of Management Studies. MBA in Innovation, Entrepreneurship and Venture Development. Admissions open.',
  url: 'https://www.gtu.ac.in/',
};
function isHomeRoute() {
  const route = parseRoutePath();
  return !route.course && !route.branch && !route.branchSlug && !route.subjectCode && !route.subjectSlug;
}

function setSearchActive(active) {
  document.body.classList.toggle('search-active', active);
}

function clearSearchResults() {
  setSearchActive(false);
  if (content) content.innerHTML = '';
  if (isHomeRoute()) {
    setHomeSectionsVisible(true);
    setHeroVisible(true);
    resetHomeSeo();
  } else {
    renderRoute();
  }
  hideBeAdPopup();
}

function setHeroVisible(visible) {
  if (heroSection) heroSection.hidden = !visible;
  if (!document.body.classList.contains('search-active')) {
    document.body.classList.toggle('subpage', !visible);
  }
}

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data) {
  let el = document.querySelector('#page-jsonld');
  if (!data) {
    if (el) el.remove();
    return;
  }
    const payload = Array.isArray(data)
    ? {
      '@context': 'https://schema.org',
      '@graph': data.map(({ '@context': _ignored, ...item }) => item),
    }
    : data;
  if (!el) {
    el = document.createElement('script');
    el.id = 'page-jsonld';
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(payload);
}

function canonicalAbsoluteUrl(path = '') {
  const origin = window.location.origin;
  const base = (window.__GTUPEDIA_BASE || '/').replace(/\/$/, '');
  if (!path || path === './') return `${origin}${base || ''}` || origin;
  return `${origin}${base}/${String(path).replace(/^\//, '')}`;
}

function renderBreadcrumbs(items = []) {
  state.pageBreadcrumbs = items;
  if (breadcrumbsNav) {
    breadcrumbsNav.hidden = true;
    breadcrumbsNav.innerHTML = '';
  }
}

function breadcrumbsMarkup(items = state.pageBreadcrumbs) {
  if (!items?.length) return '';
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((item, index) => {
    if (index === items.length - 1) {
      return `<li aria-current="page">${escapeHtml(item.label)}</li>`;
    }
    return `<li><a href="${item.href}">${escapeHtml(item.label)}</a></li>`;
  }).join('')}</ol></nav>`;
}

function pageShell(html) {
  return `<div class="page-shell">${breadcrumbsMarkup()}${html}</div>`;
}

function breadcrumbJsonLd(items = []) {
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.absoluteUrl || canonicalAbsoluteUrl(item.path),
    })),
  };
}

function homeCrumb() {
  return { label: 'Home', href: './', path: '' };
}

function breadcrumbCourseLabel(course) {
  const labels = {
    BB: 'BBA',
    BE: 'B.E.',
    BA: 'B.Arch',
    BC: 'BCA',
    BH: 'BHMCT',
    BN: 'B.Design',
    EP: 'B.E. (Part Time)',
  };
  return labels[course?.code] || formatLabel(course?.name || course?.code || '');
}

function courseCrumb(course) {
  return {
    label: breadcrumbCourseLabel(course),
    href: urlFor({ course: course.code }),
    path: course.code,
  };
}

function branchCrumb(courseCode, branch) {
  const course = getCourse(courseCode);
  if (branch.name === breadcrumbCourseLabel(course || { code: courseCode })) return null;
  return {
    label: branch.name,
    href: urlFor({ course: courseCode, branch: branch.id }),
    path: branchPath(courseCode, branch.id),
  };
}

function subjectCrumb(courseCode, branchId, subject) {
  return {
    label: subject.name,
    href: urlFor({ course: courseCode, branch: branchId, subject }),
    path: subjectPath(courseCode, branchId, subject),
  };
}

function updatePageSeo({ title, description, path = '', breadcrumbs = [], jsonLd = null }) {
  document.title = title || SITE.defaultTitle;
  setMeta('description', description || SITE.defaultDescription);
  setMeta('og:title', title || SITE.defaultTitle, 'property');
  setMeta('og:description', description || SITE.defaultDescription, 'property');
  setMeta('og:url', canonicalAbsoluteUrl(path), 'property');
  setMeta('twitter:title', title || SITE.defaultTitle);
  setMeta('twitter:description', description || SITE.defaultDescription);
  setCanonical(canonicalAbsoluteUrl(path));
  renderBreadcrumbs(breadcrumbs);
  const structured = jsonLd || (breadcrumbs.length ? breadcrumbJsonLd(breadcrumbs) : null);
  setJsonLd(structured);
}

function resetHomeSeo() {
  setHeroVisible(true);
  updatePageSeo({
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
    path: '',
    breadcrumbs: [],
  });
}

function relatedSubjects(subject, branchId, courseCode, limit = 8) {
  return subjectsForBranch(branchId, courseCode)
    .filter(item => item.id !== subject.id && item.semester === subject.semester)
    .slice(0, limit);
}

function renderRelatedSubjects(subject, branchId, courseCode) {
  const related = relatedSubjects(subject, branchId, courseCode);
  if (!related.length) return '';
  return `
    <section class="related-subjects" aria-labelledby="related-subjects-title">
      <h2 id="related-subjects-title">More from ${escapeHtml(subject.semesterLabel || `Semester ${subject.semester}`)}</h2>
      <div class="subject-list">${related.map(item => renderSubjectCard(item, item.code, branchId)).join('')}</div>
    </section>`;
}

function renderPopularBranches(courseCode, limit = 8) {
  const branches = getCourseBranches(courseCode).slice(0, limit);
  if (!branches.length) return '';
  return `
    <section class="internal-links" aria-labelledby="popular-branches-title">
      <h2 id="popular-branches-title">Popular GTU branches</h2>
      <div class="internal-link-list">${branches.map(branch => `
        <a href="${urlFor({ course: courseCode, branch: branch.id })}">${escapeHtml(branch.name)}</a>`).join('')}</div>
    </section>`;
}

function examSeasonCount(subject) {
  return getExamPaperSets().filter(paperSet => subjectCodes(subject).some(code => hasExamPaper(code, paperSet))).length;
}

function getExamPaperSets() {
  if (state.catalog?.examPapers?.length) return state.catalog.examPapers;
  const sets = [];
  if (state.catalog?.winter2025Papers) sets.push(state.catalog.winter2025Papers);
  if (state.catalog?.winter2025BcPapers) sets.push(state.catalog.winter2025BcPapers);
  if (state.catalog?.summer2025BcPapers) sets.push(state.catalog.summer2025BcPapers);
  if (state.catalog?.summer2025Papers) sets.push(state.catalog.summer2025Papers);
  if (state.catalog?.winter2024BcPapers) sets.push(state.catalog.winter2024BcPapers);
  if (state.catalog?.winter2024Papers) sets.push(state.catalog.winter2024Papers);
  if (state.catalog?.summer2024Papers) sets.push(state.catalog.summer2024Papers);
  if (state.catalog?.winter2023Papers) sets.push(state.catalog.winter2023Papers);
  if (state.catalog?.summer2023Papers) sets.push(state.catalog.summer2023Papers);
  return sets;
}

function paperSetCourseCode(paperSet) {
  return paperSet?.courseCode || 'BE';
}

function resolvePaperFileName(subjectCode, paperSet) {
  const code = String(subjectCode).trim();
  const codes = paperSet?.codes || [];
  if (codes.includes(code)) return code;
  const updated = `${code}_updated`;
  if (codes.includes(updated)) return updated;
  const alias = codes.find(item => item.replace(/_updated$/i, '') === code);
  return alias || code;
}

function hasExamPaper(subjectCode, paperSet) {
  const code = String(subjectCode).trim();
  return (paperSet?.codes || []).some(item => item === code || item.replace(/_updated$/i, '') === code);
}

function gtuExamPaperUrl(subjectCode, paperSet) {
  const base = paperSet?.baseUrl || 'https://gtu.ac.in/uploads/W2025/BE';
  const fileName = resolvePaperFileName(subjectCode, paperSet);
  return `${base}/${encodeURIComponent(fileName)}.pdf`;
}

function examPaperCardsForSubject(subject, courseCode) {
  if (courseCode !== 'BE' && courseCode !== 'BB' && courseCode !== 'BC') return [];
  const cards = [];
  const seen = new Set();

  for (const code of subjectCodes(subject)) {
    for (const paperSet of getExamPaperSets()) {
      if (paperSetCourseCode(paperSet) !== courseCode) continue;
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

function looksLikeSubjectCode(value = '') {
  const ref = decodeURIComponent(String(value));
  if (ref.includes('@')) return true;
  return /^(BE)?[0-9A-Z_]+$/i.test(ref) && /\d/.test(ref);
}

function branchSlugFor(branchId, courseCode = 'BE') {
  const id = normalizeBranchId(branchId);
  if (id === '0') return 'common';
  const branch = findBranch(id, courseCode);
  return branch?.slug || id;
}

function branchPath(courseCode, branchId) {
  const id = normalizeBranchId(branchId);
  return `${courseCode}/${id}/${branchSlugFor(id, courseCode)}`;
}

function subjectPath(courseCode, branchId, subject) {
  return `${branchPath(courseCode, branchId)}/${encodeURIComponent(subject.code)}/${subject.slug}`;
}

function parseRoutePath(pathname = appPathname()) {
  if (pathname === '/' || pathname === '/index.html') return {};
  const parts = pathname.split('/').filter(Boolean).map(part => decodeURIComponent(part));
  if (!parts.length) return {};

  const [course, second, third, fourth, fifth, ...rest] = parts;
  if (parts.length === 1) return { course };

  if (parts.length === 2) {
    if (/^\d+[A-Z]?$/i.test(second)) return { course, branch: normalizeBranchId(second) };
    return { course, branchSlug: second };
  }

  if (!/^\d+[A-Z]?$/i.test(second)) return { course, branchSlug: second };

  const branch = normalizeBranchId(second);

  if (parts.length === 3) {
    if (looksLikeSubjectCode(third)) return { course, branch, subjectCode: third };
    return { course, branch, branchSlug: third };
  }

  const branchSlug = third;
  if (parts.length === 4) {
    if (looksLikeSubjectCode(fourth)) return { course, branch, branchSlug, subjectCode: fourth };
    return { course, branch, branchSlug, subjectSlug: fourth };
  }

  if (parts.length >= 5) {
    return {
      course,
      branch,
      branchSlug,
      subjectCode: fourth,
      subjectSlug: [fifth, ...rest].join('/'),
    };
  }

  return { course };
}

function findBranchBySlug(slug, courseCode = 'BE') {
  return getCourseBranches(courseCode).find(item => item.slug === slug);
}

function resolveBranchFromRoute(route, courseCode = 'BE') {
  if (route.branch) {
    return findBranch(route.branch, courseCode);
  }
  if (route.branchSlug) {
    return findBranchBySlug(route.branchSlug, courseCode);
  }
  return null;
}

function resolveSubjectFromRoute(route, branch, courseCode = 'BE') {
  if (route.subjectCode) {
    return findSubjectForBranch(branch.id, route.subjectCode, courseCode);
  }
  if (route.subjectSlug) {
    return findSubjectForBranch(branch.id, route.subjectSlug, courseCode);
  }
  return null;
}

function canonicalRoutePath(route, branch, subject) {
  if (subject) return subjectPath(route.course, branch.id, subject);
  return branchPath(route.course, branch.id);
}

function ensureCanonicalUrl(route, branch, subject) {
  const expected = canonicalRoutePath(route, branch, subject);
  const current = appPathname().replace(/^\//, '');
  if (current !== expected) {
    window.history.replaceState(null, '', absoluteAppUrl(expected));
  }
}

function urlFor(params = {}) {
  if (params.subject && params.subject.code) {
    return subjectPath(
      params.course || params.subject.courseCode || 'BE',
      params.branch || params.subject.branchId,
      params.subject,
    );
  }

  if (params.subject) {
    const subject = findSubject(params.subject);
    if (subject) {
      return urlFor({
        course: params.course || subject.courseCode || 'BE',
        branch: params.branch || subject.branchId,
        subject,
      });
    }
  }

  if (params.course && params.branch && params.subjectCode) {
    const subject = findSubjectForBranch(params.branch, params.subjectCode, params.course);
    if (subject) return subjectPath(params.course, params.branch, subject);
    return `${branchPath(params.course, params.branch)}/${encodeURIComponent(params.subjectCode)}`;
  }
  if (params.course && params.branch) {
    return branchPath(params.course, params.branch);
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
      subject,
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

function findSubjectForBranch(branchId, subjectRef, courseCode = 'BE') {
  const ref = String(subjectRef);
  if (ref.includes('@')) return findSubject(ref);

  const candidates = subjectsForBranch(branchId, courseCode);
  if (looksLikeSubjectCode(ref)) {
    return candidates.find(subject => subject.code === ref
      || (subject.alternateCodes || []).includes(ref));
  }
  return candidates.find(subject => subject.slug === ref);
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

function getAllCourseBranches() {
  const out = [];
  for (const course of state.catalog.courses || []) {
    for (const branch of getCourseBranches(course.code)) {
      out.push({ courseCode: course.code, branch });
    }
  }
  return out;
}

function findBranch(branchId, courseCode) {
  const branches = courseCode ? getCourseBranches(courseCode) : [];
  const match = branches.find(item => branchIdsMatch(item.id, branchId));
  if (match || !courseCode || courseCode === 'BE') {
    return match || (courseCode === 'BE'
      ? (state.catalog.branches || []).find(item => branchIdsMatch(item.id, branchId))
      : null);
  }
  return null;
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

function setHomeSectionsVisible(visible) {
  if (coursesSection) coursesSection.hidden = !visible;
  if (aboutSection) aboutSection.hidden = !visible;
}

function setCoursesVisible(visible) {
  setHomeSectionsVisible(visible);
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
  const branchNames = new Map(
    getAllCourseBranches().map(({ courseCode, branch }) => [`${courseCode}:${branch.id}`, branch.name]),
  );

  state.searchIndex = (state.catalog.subjects || []).map(subject => {
    const courseCode = subject.courseCode || 'BE';
    const course = getCourse(courseCode);
    const branchName = subject.branchId === '0'
      ? 'All branches'
      : (branchNames.get(`${courseCode}:${subject.branchId}`) || subject.branchId);
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
        subject.slug,
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
  setHeroVisible(false);
  setCoursesVisible(false);
  const branches = getCourseBranches(courseCode);
  const courseName = formatLabel(course.name);
  const crumbs = [homeCrumb(), courseCrumb(course)];
  updatePageSeo({
    title: `${courseName} (${courseCode}) — GTU Branches | ${SITE.name}`,
    description: `Browse all ${courseCode} branches at GTU. Find subjects, semesters, and official exam papers for ${courseName}.`,
    path: courseCode,
    breadcrumbs: crumbs,
  });
  content.innerHTML = pageShell(`
    <header class="page-header">
      <h1 class="page-title">${escapeHtml(courseName)}</h1>
      <p class="seo-intro">Select your ${escapeHtml(courseCode)} branch to browse semester-wise subjects and GTU question papers.</p>
    </header>
    ${branches.length ? `<div class="card-grid card-grid--branches">${branches.map(branch => {
      const count = subjectCountForBranch(branch.id, courseCode);
      return `
      <a class="branch-card" href="${urlFor({ course: courseCode, branch: branch.id })}">
        <span class="branch-code">${escapeHtml(branch.id)}</span>
        <h3>${escapeHtml(branch.name)}</h3>
        <p>${count ? `${count} subjects` : 'Browse subjects and resources'}</p>
      </a>`;
    }).join('')}</div>` : '<p class="empty">No branches have been imported for this course yet.</p>'}
    ${renderPopularBranches(courseCode)}`);
  maybeShowBeAdPopup(courseCode);
}

function renderSubjectCard(subject, meta = '', branchId = subject.branchId) {
  const code = subject.code || subject.id;
  const courseCode = subject.courseCode || 'BE';
  return `
    <a class="subject-card" href="${urlFor({ course: courseCode, branch: branchId, subject })}">
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
  ensureCanonicalUrl({ course: resolvedCourse || courseCode || 'BE' }, branch);
  setHeroVisible(false);
  setCoursesVisible(false);
  const course = getCourse(resolvedCourse || courseCode || 'BE');
  const courseName = formatLabel(course?.name || 'Bachelor of Engineering');
  const crumbs = [homeCrumb(), courseCrumb(course), branchCrumb(resolvedCourse || courseCode || 'BE', branch)].filter(Boolean);
  updatePageSeo({
    title: `${branch.name} (${resolvedCourse || courseCode} ${branch.id}) — GTU Subjects | ${SITE.name}`,
    description: `Browse ${subjects.length} ${branch.name} subjects by semester. Access GTU exam papers and study resources for ${courseName}.`,
    path: branchPath(resolvedCourse || courseCode || 'BE', branch.id),
    breadcrumbs: crumbs,
  });
  const semesterGroups = groupSubjectsBySemester(subjects);
  content.innerHTML = pageShell(`
    <header class="page-header">
      <h1 class="page-title">${escapeHtml(branch.name)}</h1>
      <p class="seo-intro">${escapeHtml(courseName)} · Branch ${escapeHtml(branch.id)} · ${subjects.length} subjects across ${semesterGroups.length} semester groups.</p>
    </header>
    ${semesterGroups.length ? `<div class="subject-groups">${semesterGroups.map(([label, items]) => `
      <section class="subject-group">
        <h2>${escapeHtml(label)}</h2>
        <div class="subject-list">${items.map(subject => renderSubjectCard(subject, 'Open papers and material', branchId)).join('')}</div>
      </section>`).join('')}</div>` : '<p class="empty">No subjects have been imported for this branch yet.</p>'}`);
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

function renderSubject(subjectOrRef, routeBranchId) {
  const branchId = routeBranchId || null;
  const subject = typeof subjectOrRef === 'object' && subjectOrRef?.code
    ? subjectOrRef
    : (branchId
      ? findSubjectForBranch(branchId, subjectOrRef)
      : findSubject(subjectOrRef));
  if (!subject) return renderNotFound('That subject is not in the catalogue yet.');
  setHeroVisible(false);
  setCoursesVisible(false);
  const courseCode = subject.courseCode || findCourseForBranch(String(subject.branchId)) || 'BE';
  const backBranch = branchId || subject.branchId;
  const branch = findBranch(backBranch, courseCode);
  if (branch) ensureCanonicalUrl({ course: courseCode }, branch, subject);
  const course = getCourse(courseCode);
  const code = subject.code || subject.id.split('@')[0];
  const alternateCodes = (subject.alternateCodes || []).filter(item => item !== code);
  const paperCount = examSeasonCount(subject);
  const crumbs = [
    homeCrumb(),
    courseCrumb(course || { code: courseCode, name: 'Bachelor of Engineering' }),
    ...(branch ? [branchCrumb(courseCode, branch)] : []),
    subjectCrumb(courseCode, backBranch, subject),
  ].filter(Boolean);
  updatePageSeo({
    title: `${subject.name} (${code}) — GTU Papers | ${SITE.name}`,
    description: `Download GTU ${subject.name} (${code}) question papers for ${branch?.name || 'BE'}. ${paperCount ? `${paperCount} exam seasons available.` : 'Syllabus and study resources.'} Semester ${subject.semester}.`,
    path: subjectPath(courseCode, backBranch, subject),
    breadcrumbs: crumbs,
    jsonLd: [
      breadcrumbJsonLd(crumbs),
      {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: subject.name,
        courseCode: code,
        description: `${subject.name} (${code}) — GTU ${branch?.name || 'BE'}, ${subject.semesterLabel || `Semester ${subject.semester}`}.`,
        provider: { '@type': 'Organization', name: 'Gujarat Technological University' },
      },
    ].filter(Boolean),
  });
  const resources = (state.catalog.resources || []).filter(item => String(item.subjectId) === subject.id
    || (subject.alternateIds || []).includes(String(item.subjectId)));
  const resourceCards = [
    ...examPaperCardsForSubject(subject, courseCode),
    ...resources.map(resource => `
      <a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener">
        <span class="tag">${escapeHtml(resource.type)}</span>
        <h3>${escapeHtml(resource.title)}</h3>
        <p>${[resource.exam, resource.author].filter(Boolean).map(escapeHtml).join(' · ') || 'Open resource'}</p>
      </a>`),
  ].filter(Boolean).join('');
  content.innerHTML = pageShell(`
    <header class="page-header">
      <h1 class="page-title">${escapeHtml(subject.name)}</h1>
      <p class="seo-intro">${escapeHtml(branchLabel(backBranch, courseCode))} · ${escapeHtml(subject.semesterLabel || `Semester ${subject.semester || '—'}`)}${paperCount ? ` · ${paperCount} exam paper season${paperCount === 1 ? '' : 's'}` : ''}</p>
    </header>
    <p class="subject-code-line">
      <span class="tag">${escapeHtml(code)}</span>
      ${alternateCodes.length ? `<span class="subject-alt-codes">Also listed as ${alternateCodes.map(item => escapeHtml(item)).join(', ')}</span>` : ''}
    </p>
    ${resourceCards ? `<div class="resource-list">${resourceCards}</div>` : '<p class="empty">No papers or material are attached to this subject yet.</p>'}
    ${branch ? renderRelatedSubjects(subject, backBranch, courseCode) : ''}`);
  maybeShowBeAdPopup(courseCode);
}

function renderSearch(term) {
  const trimmed = term.trim();
  const tokens = searchTokens(term);

  if (!tokens.length || trimmed.length < SEARCH_MIN_CHARS) {
    clearSearchResults();
    return;
  }

  const onHome = isHomeRoute();
  if (onHome) {
    setHeroVisible(true);
    setHomeSectionsVisible(false);
    setSearchActive(true);
    document.body.classList.remove('subpage');
  } else {
    setSearchActive(false);
    setHeroVisible(false);
    setHomeSectionsVisible(false);
  }
  hideBeAdPopup();
  updatePageSeo({
    title: `Search: ${term.trim()} | ${SITE.name}`,
    description: `Search GTU courses, branches, and subjects for “${term.trim()}”.`,
    path: '',
    breadcrumbs: [homeCrumb(), { label: 'Search', href: './', path: '' }],
  });

  const courseMatches = (state.catalog.courses || [])
    .map(course => ({ course, score: scoreSimple(`${course.code} ${course.name}`, tokens) }))
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  const branchMatches = getAllCourseBranches()
    .map(({ courseCode, branch }) => ({
      courseCode,
      branch,
      score: scoreSimple(`${courseCode} ${branch.id} ${branch.name}`, tokens),
    }))
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

  content.innerHTML = pageShell(`
    <h1 class="page-title">${total ? `${total.toLocaleString()} matching result${total === 1 ? '' : 's'}` : 'No matching results'}</h1>
    <p class="search-hint">Showing matches for “${escapeHtml(trimmed)}”. Keep typing to narrow results.</p>
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
        <div class="card-grid">${visibleBranches.map(({ courseCode, branch }) => `
          <a class="branch-card" href="${urlFor({ course: courseCode, branch: branch.id })}">
            <span class="branch-code">${escapeHtml(courseCode)} · ${escapeHtml(branch.id)}</span>
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
    ${total ? '' : '<p class="empty">Try a subject code like <strong>BE03000081</strong>, a subject name like <strong>Data Structures</strong>, or a branch like <strong>Computer Engineering</strong>.</p>'}`);
}

function renderNotFound(message) {
  setHeroVisible(false);
  setCoursesVisible(false);
  hideBeAdPopup();
  updatePageSeo({
    title: `Page not found | ${SITE.name}`,
    description: message || 'The page you requested is not in the GTUPEDIA catalogue.',
    path: appPathname().replace(/^\//, ''),
    breadcrumbs: [homeCrumb(), { label: 'Not found', href: './', path: '' }],
  });
  content.innerHTML = pageShell(`<h1 class="page-title">Not found</h1><p class="empty">${escapeHtml(message)} <a href="./">Return home</a>.</p>`);
}

function renderRoute() {
  window.clearTimeout(searchDebounceTimer);
  if (searchInput) searchInput.value = '';
  setSearchActive(false);
  setCoursesVisible(true);

  if (window.location.search) {
    const legacyPath = legacyQueryToPath();
    if (legacyPath) {
      window.history.replaceState(null, '', absoluteAppUrl(legacyPath));
    }
  }

  const route = parseRoutePath();
  if (route.subjectCode || route.subjectSlug) {
    const branch = resolveBranchFromRoute(route, route.course);
    if (!branch) return renderNotFound('That branch is not in the catalogue yet.');
    const subject = resolveSubjectFromRoute(route, branch, route.course);
    if (!subject) return renderNotFound('That subject is not in the catalogue yet.');
    return renderSubject(subject, branch.id);
  }
  if (route.branch || route.branchSlug) {
    const branch = resolveBranchFromRoute(route, route.course);
    if (!branch) return renderNotFound('That branch is not in the catalogue yet.');
    return renderBranch(route.course, branch.id);
  }
  if (route.course) return renderCourse(route.course);
  resetHomeSeo();
  hideBeAdPopup();
  content.innerHTML = '';
}

function scheduleSearch(term) {
  window.clearTimeout(searchDebounceTimer);
  const trimmed = term.trim();
  if (!trimmed || trimmed.length < SEARCH_MIN_CHARS) {
    renderSearch(term);
    return;
  }
  searchDebounceTimer = window.setTimeout(() => renderSearch(term), SEARCH_DEBOUNCE_MS);
}

if (searchInput) {
  searchInput.addEventListener('input', event => scheduleSearch(event.target.value));
  searchInput.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      searchInput.value = '';
      clearSearchResults();
    }
  });
}

function primeSubpageShell() {
  const route = parseRoutePath();
  if (!route.course && !route.branch && !route.branchSlug && !route.subjectCode && !route.subjectSlug) return;
  setHeroVisible(false);
  setHomeSectionsVisible(false);
  if (content) content.innerHTML = pageShell('<p class="page-loading">Loading catalogue…</p>');
}

primeSubpageShell();
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
