const state = { catalog: null, searchIndex: null, pageBreadcrumbs: [], loadedSubjectCourses: new Set() };
const content = document.querySelector('#content');
const courseList = document.querySelector('#course-list');
const coursesSection = document.querySelector('#courses');
const aboutSection = document.querySelector('#about');
const heroSection = document.querySelector('#hero');
const breadcrumbsNav = document.querySelector('#breadcrumbs');
const searchInput = document.querySelector('#search-input');
const errorPage = document.body.classList.contains('error-page');
const errorStatic = document.querySelector('#error-static');
const SEARCH_LIMIT = { courses: 8, branches: 12, subjects: 48 };
const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 300;
let searchDebounceTimer = null;
const SITE = {
  name: 'GTUPEDIA',
  defaultTitle: 'GTU Question Papers PDF — BE, Diploma, BBA, BCA, MBA, MCA | GTUPEDIA',
  defaultDescription: 'Free GTU question papers for BE, Diploma Engineering, BBA, BCA, MBA, MCA & more. Browse by branch, semester & subject code. Official exam PDFs.',
};
function mountAdSlots(root = document) {
  if (typeof window.hydrateAdSlots === 'function') window.hydrateAdSlots(root);
}

function courseIntroText(courseCode, course, branchCount, subjectCount) {
  const name = formatLabel(course?.name || courseCode);
  if (courseCode === 'DI') {
    return `Browse GTU ${name} question papers by branch and semester. Coverage includes NEW, OLD, Credit-to-Degree, and NCC schemes where listed in the exam schedule. Pick your branch to open subjects with Winter and Summer paper links where available.`;
  }
  if (courseCode === 'BE') {
    return `Browse GTU ${name} previous year question papers across ${branchCount} branches. Pick your branch, open a semester, and download official exam PDFs by subject code.`;
  }
  const countLabel = subjectCount ? `${subjectCount.toLocaleString()} subjects with papers or syllabus links` : 'subjects organised by semester';
  return `Browse GTU ${name} question papers and syllabus links. ${countLabel} — all linking to official GTU PDFs where available.`;
}

function branchIntroText(courseCode, branch, subjectCount) {
  const course = getCourse(courseCode);
  const courseName = formatLabel(course?.name || courseCode);
  const countLabel = subjectCount
    ? `${subjectCount} subject${subjectCount === 1 ? '' : 's'} with exam papers or syllabus links`
    : 'subjects listed by semester';
  return `${branch.name} (GTU ${courseCode} branch ${branch.id}) — ${countLabel} in the ${courseName} programme. Open a semester below to find question papers by subject name or code.`;
}

function subjectIntroText(subject, branch, courseCode) {
  const code = subject.code || subject.id.split('@')[0];
  const branchName = branch?.name || branchLabel(subject.branchId, courseCode);
  const semester = subject.semesterLabel || `Semester ${subject.semester || '—'}`;
  const paperCount = examSeasonCount(subject, courseCode);
  const course = getCourse(courseCode);
  const courseName = formatLabel(course?.name || courseCode);
  let text = `${subject.name} (${code}) is listed under ${branchName}, ${semester}, in the GTU ${courseName} programme. `;
  if (paperCount) {
    text += `Official GTU question papers are linked below for ${paperCount} exam season${paperCount === 1 ? '' : 's'}. Use these PDFs for revision and to understand typical question patterns. `;
  } else {
    text += `Syllabus links appear below where available. Exam papers will be added when GTU releases them for this subject. `;
  }
  text += 'Cross-check syllabus updates on gtu.ac.in and with your college.';
  return text;
}

function adSlotHtml(name) {
  return typeof window.renderAdSlot === 'function' ? window.renderAdSlot(name) : '';
}

const LANDING_COURSE_ORDER = ['BE', 'DI', 'BB', 'BC', 'MB', 'MC', 'BP'];
const PAPER_ENABLED_COURSES = new Set(['BE', 'BB', 'BC', 'MB', 'MC', 'BP', 'DI']);
function isHomeRoute() {
  const route = parseRoutePath();
  return !route.course && !route.branch && !route.branchSlug && !route.subjectCode && !route.subjectSlug;
}

function setSearchActive(active) {
  document.body.classList.toggle('search-active', active);
}

function isCatalogRoute(route = parseRoutePath()) {
  return !!(route.course || route.branch || route.branchSlug || route.subjectCode || route.subjectSlug);
}

function hideErrorStatic() {
  if (errorStatic) errorStatic.hidden = true;
  if (content) content.hidden = false;
}

function showErrorStatic(message = '') {
  if (!errorPage || !errorStatic) return false;
  errorStatic.hidden = false;
  if (content) {
    content.hidden = true;
    content.innerHTML = '';
  }
  const pathEl = document.querySelector('#error-path');
  if (pathEl) {
    const path = appPathname();
    const label = path && path !== '/' && path !== '/index.html' ? `Requested: ${path}` : '';
    pathEl.textContent = label;
    pathEl.hidden = !label;
  }
  const detailEl = document.querySelector('#error-detail');
  if (detailEl) {
    detailEl.textContent = message;
    detailEl.hidden = !message;
  }
  if (breadcrumbsNav) breadcrumbsNav.hidden = true;
  setHeroVisible(false);
  setHomeSectionsVisible(false);
  document.title = 'Page not found — GTUPEDIA';
  return true;
}

function clearSearchResults() {
  setSearchActive(false);
  if (content) content.innerHTML = '';
  if (isHomeRoute()) {
    setHomeSectionsVisible(true);
    setHeroVisible(true);
    resetHomeSeo();
    if (errorPage) showErrorStatic();
  } else if (errorPage) {
    showErrorStatic();
  } else {
    renderRoute();
  }
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

function siteOrigin() {
  if (window.__GTUPEDIA_SEO?.siteUrl) return window.__GTUPEDIA_SEO.siteUrl.replace(/\/$/, '');
  const origin = window.location.origin;
  const base = (window.__GTUPEDIA_BASE || '/').replace(/\/$/, '');
  return `${origin}${base === '/' ? '' : base}`;
}

function canonicalAbsoluteUrl(path = '') {
  if (!path || path === './') return `${siteOrigin()}/`;
  return `${siteOrigin()}/${String(path).replace(/^\//, '')}`;
}

function seoTitleCourse(courseName, courseCode) {
  return `${courseName} GTU Question Papers (${courseCode}) — All Branches | ${SITE.name}`;
}

function truncateMetaDescription(text, max = 155) {
  const fn = window.__GTUPEDIA_SEO?.truncateMetaDescription;
  if (fn) return fn(text, max);
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const cut = slice.lastIndexOf(' ');
  const trimmed = (cut > 60 ? slice.slice(0, cut) : slice).trim();
  return `${trimmed}…`;
}

function seoDescriptionCourse(courseName, courseCode, branchCount, subjectCount) {
  return truncateMetaDescription(
    `GTU ${courseName} (${courseCode}) question papers — ${branchCount} branches, ${subjectCount} subjects. Free official Winter & Summer exam PDFs.`,
  );
}

function seoTitleBranch(branchName, courseCode, branchId) {
  return `${branchName} GTU Papers — ${courseCode} Branch ${branchId} Subjects | ${SITE.name}`;
}

function seoDescriptionBranch(branchName, courseCode, subjectCount) {
  return truncateMetaDescription(
    `${branchName} GTU ${courseCode} papers — ${subjectCount} subjects with previous year exam PDFs organised by semester.`,
  );
}

function seoTitleSubject(subjectName, code) {
  return `${subjectName} GTU Question Paper PDF (${code}) | ${SITE.name}`;
}

function seoDescriptionSubject(subjectName, code, branchName, semester, paperCount) {
  const seasons = paperCount ? `${paperCount} season${paperCount === 1 ? '' : 's'} · ` : '';
  return truncateMetaDescription(
    `GTU ${subjectName} (${code}) question papers — ${branchName}, Sem ${semester}. ${seasons}Free official exam PDF downloads.`,
  );
}

function learningResourceJsonLd(subject, branchName, url, paperCount) {
  const code = subject.code || subject.id.split('@')[0];
  return {
    '@type': 'LearningResource',
    name: `${subject.name} GTU Question Papers`,
    description: `GTU ${subject.name} (${code}) exam papers for ${branchName}, semester ${subject.semester}.`,
    url,
    learningResourceType: 'Exam paper',
    educationalLevel: 'Undergraduate',
    inLanguage: window.__GTUPEDIA_SEO?.language || 'en-IN',
    about: {
      '@type': 'Course',
      name: subject.name,
      courseCode: code,
      provider: {
        '@type': 'CollegeOrUniversity',
        name: 'Gujarat Technological University',
        sameAs: 'https://www.gtu.ac.in/',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: siteOrigin(),
    },
    ...(paperCount ? { numberOfItems: paperCount } : {}),
  };
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
    MB: 'MBA',
    MC: 'MCA',
    BP: 'B.Pharm',
    DI: 'Diploma Engg.',
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

function updatePageSeo({ title, description, path = '', breadcrumbs = [], jsonLd = null, robots = 'index, follow' }) {
  document.title = title || SITE.defaultTitle;
  const desc = description || SITE.defaultDescription;
  const ogImage = window.__GTUPEDIA_SEO?.defaultOgImage
    || `${(window.__GTUPEDIA_SEO?.siteUrl || 'https://gtupedia.com').replace(/\/$/, '')}/assets/og-image.jpg`;
  setMeta('description', desc);
  setMeta('robots', robots);
  setMeta('keywords', window.__GTUPEDIA_SEO?.keywords || '');
  setMeta('og:title', title || SITE.defaultTitle, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:url', canonicalAbsoluteUrl(path), 'property');
  setMeta('og:image', ogImage, 'property');
  setMeta('og:image:alt', title || SITE.defaultTitle, 'property');
  setMeta('og:locale', window.__GTUPEDIA_SEO?.locale || 'en_IN', 'property');
  setMeta('og:site_name', SITE.name, 'property');
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title || SITE.defaultTitle);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', ogImage);
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
  return listedSubjectsForBranch(branchId, courseCode)
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

function examSeasonCount(subject, courseCode = subject.courseCode || 'BE') {
  return getExamPaperSets().filter(
    paperSet => paperSetCourseCode(paperSet) === courseCode
      && subjectCodes(subject).some(code => hasExamPaper(code, paperSet)),
  ).length;
}

function subjectHasPapers(subject) {
  return examSeasonCount(subject) > 0;
}

function getExamPaperSets() {
  if (state.catalog?.examPapers?.length) return state.catalog.examPapers;
  const sets = [];
  if (state.catalog?.winter2025Papers) sets.push(state.catalog.winter2025Papers);
  if (state.catalog?.winter2025BbPapers) sets.push(state.catalog.winter2025BbPapers);
  if (state.catalog?.winter2025BcPapers) sets.push(state.catalog.winter2025BcPapers);
  if (state.catalog?.winter2025McPapers) sets.push(state.catalog.winter2025McPapers);
  if (state.catalog?.winter2025BpPapers) sets.push(state.catalog.winter2025BpPapers);
  if (state.catalog?.winter2025DiPapers) sets.push(state.catalog.winter2025DiPapers);
  if (state.catalog?.summer2025Papers) sets.push(state.catalog.summer2025Papers);
  if (state.catalog?.summer2025BcPapers) sets.push(state.catalog.summer2025BcPapers);
  if (state.catalog?.summer2025MbPapers) sets.push(state.catalog.summer2025MbPapers);
  if (state.catalog?.summer2025BpPapers) sets.push(state.catalog.summer2025BpPapers);
  if (state.catalog?.winter2024Papers) sets.push(state.catalog.winter2024Papers);
  if (state.catalog?.winter2024BcPapers) sets.push(state.catalog.winter2024BcPapers);
  if (state.catalog?.winter2024MbPapers) sets.push(state.catalog.winter2024MbPapers);
  if (state.catalog?.winter2024BpPapers) sets.push(state.catalog.winter2024BpPapers);
  if (state.catalog?.winter2024DiPapers) sets.push(state.catalog.winter2024DiPapers);
  if (state.catalog?.summer2024Papers) sets.push(state.catalog.summer2024Papers);
  if (state.catalog?.summer2024MbPapers) sets.push(state.catalog.summer2024MbPapers);
  if (state.catalog?.summer2024BpPapers) sets.push(state.catalog.summer2024BpPapers);
  if (state.catalog?.winter2023Papers) sets.push(state.catalog.winter2023Papers);
  if (state.catalog?.summer2023Papers) sets.push(state.catalog.summer2023Papers);
  return sets;
}

function paperSetCourseCode(paperSet) {
  return paperSet?.courseCode || 'BE';
}

function normalizePaperCode(value = '') {
  return String(value).trim().replace(/_updated$/i, '').replace(/_R$/i, '');
}

function resolvePaperFileName(subjectCode, paperSet) {
  const code = String(subjectCode).trim();
  const codes = paperSet?.codes || [];
  if (codes.includes(code)) return code;
  const updated = `${code}_updated`;
  if (codes.includes(updated)) return updated;
  const revised = `${code}_R`;
  if (codes.includes(revised)) return revised;
  const alias = codes.find(item => normalizePaperCode(item) === code);
  return alias || code;
}

function hasExamPaper(subjectCode, paperSet) {
  const code = String(subjectCode).trim();
  return (paperSet?.codes || []).some(item => item === code || normalizePaperCode(item) === code);
}

function gtuExamPaperUrl(subjectCode, paperSet) {
  const base = paperSet?.baseUrl || 'https://gtu.ac.in/uploads/W2025/BE';
  const fileName = resolvePaperFileName(subjectCode, paperSet);
  return `${base}/${encodeURIComponent(fileName)}.pdf`;
}

const GTU_SYLLABUS_BASE = 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus';

function gtuSyllabusUrl(subjectCode) {
  const code = String(subjectCode).trim();
  return `${GTU_SYLLABUS_BASE}/${encodeURIComponent(code)}.pdf`;
}

function syllabusCodesForSubject(subject) {
  return [...new Set(subjectCodes(subject).map(code => String(code).trim()).filter(Boolean))];
}

function renderSyllabusCard(subjectCode) {
  const url = gtuSyllabusUrl(subjectCode);
  return `
    <a class="resource-card syllabus-card" href="${escapeHtml(url)}" target="_blank" rel="noopener">
      <span class="tag">syllabus</span>
      <h3>${escapeHtml(subjectCode)}</h3>
      <p>GTU official syllabus PDF</p>
    </a>`;
}

function syllabusCardsForSubject(subject) {
  return syllabusCodesForSubject(subject).map(code => renderSyllabusCard(code));
}

function examPaperCardsForSubject(subject, courseCode) {
  if (!PAPER_ENABLED_COURSES.has(courseCode)) return [];
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
  const ref = decodeURIComponent(String(value)).trim();
  if (ref.includes('@')) return true;
  if (/^[A-Z]{2,3}\d/i.test(ref)) return true;
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
    if (/^[A-Z]{1,3}$/i.test(second)) return { course, branch: normalizeBranchId(second) };
    return { course, branchSlug: second };
  }

  if (!/^\d+[A-Z]?$/i.test(second)) {
    const branch = normalizeBranchId(second);
    if (parts.length >= 3 && !looksLikeSubjectCode(third)) {
      return { course, branch, branchSlug: third };
    }
    return { course, branch };
  }

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

const SINGLE_BRANCH_COURSES = {
  BB: [{ id: '01', name: 'BBA', slug: 'bba' }],
  BC: [{ id: '01', name: 'BCA', slug: 'bca' }],
};

function getCourseStats(courseCode) {
  return state.catalog?.courseStats?.[courseCode] || {};
}

function subjectsWithPapersCount(courseCode) {
  return getCourseStats(courseCode).subjectsWithPapers || 0;
}

function catalogVersionQuery() {
  return encodeURIComponent(window.__GTUPEDIA_CATALOG_V || '1');
}

const SUBJECT_SOURCES = {
  BE: () => `data/be-subjects.json?v=${catalogVersionQuery()}`,
  BB: () => `data/bb-subjects.json?v=${catalogVersionQuery()}`,
  BC: () => `data/bc-subjects.json?v=${catalogVersionQuery()}`,
  MB: () => `data/mb-subjects.json?v=${catalogVersionQuery()}`,
  MC: () => `data/mc-subjects.json?v=${catalogVersionQuery()}`,
  BP: () => `data/bp-subjects.json?v=${catalogVersionQuery()}`,
  DI: () => `data/di-subjects.json?v=${catalogVersionQuery()}`,
};

const BRANCH_SOURCES = {
  MB: () => `data/mb-branches.json?v=${catalogVersionQuery()}`,
  MC: () => `data/mc-branches.json?v=${catalogVersionQuery()}`,
  BP: () => `data/bp-branches.json?v=${catalogVersionQuery()}`,
  DI: () => `data/di-branches.json?v=${catalogVersionQuery()}`,
};

async function ensureSubjectsForCourse(courseCode) {
  if (!state.catalog || state.loadedSubjectCourses.has(courseCode)) return;

  const course = state.catalog.courses.find(item => item.code === courseCode);
  if (!course) {
    state.loadedSubjectCourses.add(courseCode);
    return;
  }

  if (!course.branches?.length && SINGLE_BRANCH_COURSES[courseCode]) {
    course.branches = SINGLE_BRANCH_COURSES[courseCode].map(branch => ({ ...branch }));
  }

  const branchUrl = BRANCH_SOURCES[courseCode]?.();
  if (!course.branches?.length && branchUrl) {
    try {
      const response = await fetch(branchUrl);
      if (response.ok) {
        const branchList = await response.json();
        if (Array.isArray(branchList) && branchList.length) {
          course.branches = branchList;
        }
      }
    } catch (_) {
      // Ignore supplemental branch load failures.
    }
  }

  const subjectUrl = SUBJECT_SOURCES[courseCode]?.();
  if (subjectUrl) {
    try {
      const response = await fetch(subjectUrl);
      if (response.ok) {
        const subjectList = await response.json();
        if (Array.isArray(subjectList) && subjectList.length) {
          state.catalog.subjects = (state.catalog.subjects || []).concat(subjectList);
        }
      }
    } catch (_) {
      // Ignore supplemental subject load failures.
    }
  }

  state.loadedSubjectCourses.add(courseCode);
}

async function ensureSubjectsForRoute(route = parseRoutePath()) {
  if (route?.course) await ensureSubjectsForCourse(route.course);
}

let searchIndexPromise = null;

async function ensureSearchIndex() {
  if (state.searchIndex) return state.searchIndex;
  if (!searchIndexPromise) {
    const searchUrl = `data/search-index.json?v=${catalogVersionQuery()}`;
    searchIndexPromise = fetch(searchUrl)
      .then(response => (response.ok ? response.json() : Promise.reject(new Error('Could not load search index'))))
      .then(data => {
        state.searchIndex = data.entries || data;
        return state.searchIndex;
      })
      .catch(() => {
        searchIndexPromise = null;
        state.searchIndex = [];
        return state.searchIndex;
      });
  }
  return searchIndexPromise;
}

function getCourse(courseCode) {
  return (state.catalog.courses || []).find(item => item.code === courseCode);
}

function getCourseBranches(courseCode) {
  const course = getCourse(courseCode);
  if (course?.branches?.length) return course.branches;
  if (SINGLE_BRANCH_COURSES[courseCode]) return SINGLE_BRANCH_COURSES[courseCode];
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

function findCourseForBranch(branchId, preferredCourseCode) {
  if (preferredCourseCode) {
    const course = getCourse(preferredCourseCode);
    if ((course?.branches || []).some(branch => branchIdsMatch(branch.id, branchId))) {
      return preferredCourseCode;
    }
  }
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

function listedSubjectsForBranch(branchId, courseCode = 'BE') {
  return subjectsForBranch(branchId, courseCode).filter(subjectHasPapers);
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
  return listedSubjectsForBranch(branchId, courseCode).length;
}

function setHomeSectionsVisible(visible) {
  if (coursesSection) coursesSection.hidden = !visible;
  if (aboutSection) aboutSection.hidden = !visible;
}

function setCoursesVisible(visible) {
  setHomeSectionsVisible(visible);
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

function courseHasPapers(courseCode) {
  return getExamPaperSets().some(
    paperSet => paperSetCourseCode(paperSet) === courseCode && (paperSet.codes?.length > 0),
  );
}

function sortCoursesForLanding(courses) {
  return [...courses].sort((a, b) => {
    const rankA = LANDING_COURSE_ORDER.indexOf(a.code);
    const rankB = LANDING_COURSE_ORDER.indexOf(b.code);
    const orderA = rankA === -1 ? 1000 : rankA;
    const orderB = rankB === -1 ? 1000 : rankB;
    if (orderA !== orderB) return orderA - orderB;
    return a.code.localeCompare(b.code);
  });
}

function renderCourseCard(course, { comingSoon = false } = {}) {
  const branchCount = getCourseBranches(course.code).length;
  const subjectCount = subjectsWithPapersCount(course.code);
  let detail;
  if (comingSoon) {
    detail = 'Exam papers coming soon';
  } else if (subjectCount) {
    detail = `${branchCount || 'No'} branch${branchCount === 1 ? '' : 'es'} · ${subjectCount} subjects`;
  } else if (branchCount) {
    detail = `${branchCount} branch${branchCount === 1 ? '' : 'es'}`;
  } else {
    detail = 'Subjects and resources coming soon';
  }
  const extraClass = comingSoon ? ' course-card--soon' : ' course-card--available';
  return `
    <a class="branch-card course-card${extraClass}" href="${urlFor({ course: course.code })}">
      <span class="branch-code">${escapeHtml(course.code)}</span>
      <h3>${escapeHtml(formatLabel(course.name))}</h3>
      <p>${escapeHtml(detail)}</p>
    </a>`;
}

function renderCourses() {
  const courses = state.catalog.courses || [];
  if (!courseList) return;
  if (!courses.length) {
    courseList.innerHTML = '<p class="empty">Course data will appear here once it is imported.</p>';
    return;
  }
  const withPapers = sortCoursesForLanding(courses.filter(course => courseHasPapers(course.code)));
  const withoutPapers = sortCoursesForLanding(courses.filter(course => !courseHasPapers(course.code)));
  const parts = [];
  if (withPapers.length) {
    parts.push(withPapers.map(course => renderCourseCard(course)).join(''));
  }
  if (withoutPapers.length) {
    if (withPapers.length) {
      parts.push(`<details class="course-list-more">
        <summary>More GTU programmes (${withoutPapers.length})</summary>
        <div class="card-grid">${withoutPapers.map(course => renderCourseCard(course, { comingSoon: true })).join('')}</div>
      </details>`);
    } else {
      parts.push(withoutPapers.map(course => renderCourseCard(course, { comingSoon: true })).join(''));
    }
  }
  courseList.innerHTML = parts.join('');
  mountHomeAdSlot();
}

function mountHomeAdSlot() {
  const slot = document.querySelector('#home-ad-slot');
  if (!slot) return;
  slot.innerHTML = adSlotHtml('home');
  mountAdSlots(slot);
}

function renderCourse(courseCode) {
  hideErrorStatic();
  const course = getCourse(courseCode);
  if (!course) return renderNotFound('That course is not in the catalogue yet.');
  setHeroVisible(false);
  setCoursesVisible(false);
  const branches = getCourseBranches(courseCode);
  const courseName = formatLabel(course.name);
  const subjectCount = subjectsWithPapersCount(courseCode);
  const crumbs = [homeCrumb(), courseCrumb(course)];
  updatePageSeo({
    title: seoTitleCourse(courseName, courseCode),
    description: seoDescriptionCourse(courseName, courseCode, branches.length, subjectCount),
    path: courseCode,
    breadcrumbs: crumbs,
  });
  content.innerHTML = pageShell(`
    <header class="page-header">
      <h1 class="page-title">${escapeHtml(courseName)}</h1>
      <p class="seo-intro">Select your ${escapeHtml(courseCode)} branch to browse semester-wise subjects and GTU question papers.</p>
    </header>
    <p class="course-intro">${escapeHtml(courseIntroText(courseCode, course, branches.length, subjectCount))}</p>
    ${adSlotHtml('course')}
    ${branches.length ? `<div class="card-grid card-grid--branches">${branches.map(branch => {
      const count = subjectCountForBranch(branch.id, courseCode);
      return `
      <a class="branch-card" href="${urlFor({ course: courseCode, branch: branch.id })}">
        <span class="branch-code">${escapeHtml(branch.id)}</span>
        <h3>${escapeHtml(branch.name)}</h3>
        <p>${count ? `${count} subjects with papers` : 'Papers coming soon'}</p>
      </a>`;
    }).join('')}</div>` : '<p class="empty">No branches have been imported for this course yet.</p>'}
    ${renderPopularBranches(courseCode)}`);
  mountAdSlots(content);
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
  hideErrorStatic();
  const branch = findBranch(branchId, courseCode);
  const resolvedCourse = courseCode || findCourseForBranch(branchId);
  const subjects = subjectsForBranch(branchId, resolvedCourse || courseCode || 'BE');
  if (!branch) return renderNotFound('That branch is not in the catalogue yet.');
  ensureCanonicalUrl({ course: resolvedCourse || courseCode || 'BE' }, branch);
  setHeroVisible(false);
  setCoursesVisible(false);
  const course = getCourse(resolvedCourse || courseCode || 'BE');
  const courseName = formatLabel(course?.name || 'Bachelor of Engineering');
  const crumbs = [homeCrumb(), courseCrumb(course), branchCrumb(resolvedCourse || courseCode || 'BE', branch)].filter(Boolean);
  updatePageSeo({
    title: seoTitleBranch(branch.name, resolvedCourse || courseCode || 'BE', branch.id),
    description: seoDescriptionBranch(branch.name, resolvedCourse || courseCode || 'BE', subjects.length),
    path: branchPath(resolvedCourse || courseCode || 'BE', branch.id),
    breadcrumbs: crumbs,
  });
  const listedCount = listedSubjectsForBranch(branchId, resolvedCourse || courseCode || 'BE').length;
  const semesterGroups = groupSubjectsBySemester(subjects);
  content.innerHTML = pageShell(`
    <header class="page-header">
      <h1 class="page-title">${escapeHtml(branch.name)}</h1>
      <p class="seo-intro">${escapeHtml(courseName)} · Branch ${escapeHtml(branch.id)} · ${subjects.length} subject${subjects.length === 1 ? '' : 's'}.</p>
    </header>
    <p class="branch-intro">${escapeHtml(branchIntroText(resolvedCourse || courseCode || 'BE', branch, listedCount))}</p>
    ${adSlotHtml('branch')}
    ${semesterGroups.length ? `<div class="subject-groups">${semesterGroups.map(([label, items]) => `
      <section class="subject-group">
        <h2>${escapeHtml(label)}</h2>
        <div class="subject-list">${items.map(subject => renderSubjectCard(subject, subjectHasPapers(subject) ? 'Open exam papers' : 'Open syllabus', branchId)).join('')}</div>
      </section>`).join('')}</div>` : '<p class="empty">No exam papers are available for this branch yet. Check back after the next paper upload.</p>'}`);
  mountAdSlots(content);
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
  hideErrorStatic();
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
  const paperCount = examSeasonCount(subject, courseCode);
  const crumbs = [
    homeCrumb(),
    courseCrumb(course || { code: courseCode, name: 'Bachelor of Engineering' }),
    ...(branch ? [branchCrumb(courseCode, branch)] : []),
    subjectCrumb(courseCode, backBranch, subject),
  ].filter(Boolean);
  updatePageSeo({
    title: seoTitleSubject(subject.name, code),
    description: seoDescriptionSubject(subject.name, code, branch?.name || 'BE', subject.semester, paperCount),
    path: subjectPath(courseCode, backBranch, subject),
    breadcrumbs: crumbs,
    jsonLd: [
      breadcrumbJsonLd(crumbs),
      learningResourceJsonLd(subject, branch?.name || 'BE', canonicalAbsoluteUrl(subjectPath(courseCode, backBranch, subject)), paperCount),
    ].filter(Boolean),
  });
  const resources = (state.catalog.resources || []).filter(item => String(item.subjectId) === subject.id
    || (subject.alternateIds || []).includes(String(item.subjectId)));
  const resourceCards = [
    ...syllabusCardsForSubject(subject),
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
    <p class="subject-intro">${escapeHtml(subjectIntroText(subject, branch, courseCode))}</p>
    ${adSlotHtml('subject')}
    <section class="subject-resources" aria-labelledby="subject-resources-title">
      <h2 id="subject-resources-title">GTU syllabus &amp; exam papers</h2>
      ${resourceCards ? `<div class="resource-list">${resourceCards}</div>` : '<p class="empty">No syllabus or exam papers are linked for this subject yet.</p>'}
    </section>
    ${branch ? renderRelatedSubjects(subject, backBranch, courseCode) : ''}`);
  mountAdSlots(content);
}

async function renderSearch(term) {
  const trimmed = term.trim();
  const tokens = searchTokens(term);

  if (!tokens.length || trimmed.length < SEARCH_MIN_CHARS) {
    clearSearchResults();
    return;
  }

  await ensureSearchIndex();

  const onHome = isHomeRoute();
  if (onHome) {
    setHeroVisible(true);
    setHomeSectionsVisible(false);
    setSearchActive(true);
    document.body.classList.remove('subpage');
    if (errorPage) hideErrorStatic();
  } else {
    setSearchActive(false);
    setHeroVisible(false);
    setHomeSectionsVisible(false);
    hideErrorStatic();
  }
  updatePageSeo({
    title: `Search: ${term.trim()} | ${SITE.name}`,
    description: `Search GTU courses, branches, and subjects for “${term.trim()}”.`,
    path: '',
    breadcrumbs: [homeCrumb(), { label: 'Search', href: './', path: '' }],
    robots: 'noindex, follow',
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
  updatePageSeo({
    title: `Page not found | ${SITE.name}`,
    description: message || 'The page you requested is not in the GTUPEDIA catalogue.',
    path: appPathname().replace(/^\//, ''),
    breadcrumbs: [homeCrumb(), { label: 'Not found', href: './', path: '' }],
    robots: 'noindex, follow',
  });
  if (showErrorStatic(message)) return;
  content.innerHTML = pageShell(`<h1 class="page-title">Not found</h1><p class="empty">${escapeHtml(message)} <a href="./">Return home</a>.</p>`);
}

async function renderRoute() {
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
  if (route.course) await ensureSubjectsForCourse(route.course);

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
  if (errorPage) {
    showErrorStatic();
    return;
  }
  resetHomeSeo();
  mountHomeAdSlot();
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
  if (!isCatalogRoute(route)) return;
  if (content?.querySelector('.seo-prerender')) return;
  hideErrorStatic();
  setHeroVisible(false);
  setHomeSectionsVisible(false);
  if (content) content.innerHTML = pageShell('<p class="page-loading">Loading catalogue…</p>');
}

primeSubpageShell();
const catalogUrl = `data/catalog.json?v=${encodeURIComponent(window.__GTUPEDIA_CATALOG_V || '1')}`;
fetch(catalogUrl)
  .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load catalogue')))
  .then(async (catalog) => {
    state.catalog = { ...catalog, subjects: [] };
    await ensureSubjectsForRoute(parseRoutePath());
    initClientNavigation();
    renderCourses();
    return renderRoute();
  })
  .catch(() => {
    if (errorPage) showErrorStatic('The catalogue could not be loaded. Please try again shortly.');
    else if (content) content.innerHTML = '<p class="empty">The catalogue could not be loaded. Please try again shortly.</p>';
  });
