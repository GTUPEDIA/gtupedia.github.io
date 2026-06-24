const state = { catalog: null, searchIndex: null };
const content = document.querySelector('#content');
const courseList = document.querySelector('#course-list');
const coursesSection = document.querySelector('#courses');
const searchInput = document.querySelector('#search-input');
const SEARCH_LIMIT = { courses: 8, branches: 12, subjects: 48 };
function hasWinter2025Paper(subjectCode) {
  const codes = state.catalog?.winter2025Papers?.codes;
  if (!codes?.length) return false;
  return codes.includes(String(subjectCode).trim());
}

function gtuWinter2025PaperUrl(subjectCode) {
  const base = state.catalog?.winter2025Papers?.baseUrl || 'https://gtu.ac.in/uploads/W2025/BE';
  return `${base}/${encodeURIComponent(String(subjectCode).trim())}.pdf`;
}

function winter2025ExamLabel() {
  return state.catalog?.winter2025Papers?.exam || 'Winter 2025';
}

function urlFor(params = {}) {
  const query = new URLSearchParams(params);
  return `./${query.size ? `?${query}` : ''}`;
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
  const seenCommonCodes = new Set();

  for (const subject of subjects) {
    const isCommon = String(subject.branchId) === '0';
    if (isCommon && (subject.semester === 1 || subject.semester === 2)) {
      if (seenCommonCodes.has(subject.code)) continue;
      seenCommonCodes.add(subject.code);
    }

    const label = isCommon && (subject.semester === 1 || subject.semester === 2)
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
  const seenCommonCodes = new Set();
  let count = 0;
  for (const subject of subjectsForBranch(branchId, courseCode)) {
    if (String(subject.branchId) === '0') {
      if (seenCommonCodes.has(subject.code)) continue;
      seenCommonCodes.add(subject.code);
    }
    count += 1;
  }
  return count;
}

function setCoursesVisible(visible) {
  if (coursesSection) coursesSection.hidden = !visible;
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
      name: subject.name.toLowerCase(),
      haystack: [
        subject.code,
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
  for (const token of tokens) {
    if (!entry.haystack.includes(token)) return -1;
    if (entry.code === token) score += 120;
    else if (entry.code.startsWith(token)) score += 80;
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
}

function renderSubjectCard(subject, meta = '') {
  const code = subject.code || subject.id;
  return `
    <a class="subject-card" href="${urlFor({ subject: subject.id })}">
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
        <div class="subject-list">${items.map(subject => renderSubjectCard(subject, 'Open papers and material')).join('')}</div>
      </section>`).join('')}</div>` : '<p class="empty">No subjects have been imported for this branch yet.</p>'}`;
}

function renderGtuPaperCard(subjectCode) {
  const url = gtuWinter2025PaperUrl(subjectCode);
  const label = winter2025ExamLabel();
  return `
    <a class="resource-card paper-card" href="${escapeHtml(url)}" target="_blank" rel="noopener">
      <span class="tag">paper</span>
      <h3>${escapeHtml(label)}</h3>
      <p>GTU official question paper</p>
    </a>`;
}

function renderSubject(subjectId) {
  const subject = (state.catalog.subjects || []).find(item => String(item.id) === subjectId);
  if (!subject) return renderNotFound('That subject is not in the catalogue yet.');
  setCoursesVisible(false);
  const courseCode = subject.courseCode || findCourseForBranch(String(subject.branchId)) || 'BE';
  const backHref = urlFor({ course: courseCode, branch: subject.branchId });
  const resources = (state.catalog.resources || []).filter(item => String(item.subjectId) === subjectId);
  const code = subject.code || subject.id.split('@')[0];
  const resourceCards = [
    courseCode === 'BE' && hasWinter2025Paper(code) ? renderGtuPaperCard(code) : '',
    ...resources.map(resource => `
      <a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener">
        <span class="tag">${escapeHtml(resource.type)}</span>
        <h3>${escapeHtml(resource.title)}</h3>
        <p>${[resource.exam, resource.author].filter(Boolean).map(escapeHtml).join(' · ') || 'Open resource'}</p>
      </a>`),
  ].filter(Boolean).join('');
  content.innerHTML = `
    <a class="back-link" href="${backHref}">← Back to subjects</a>
    <p class="eyebrow">${escapeHtml(branchLabel(subject.branchId, courseCode))} · ${escapeHtml(subject.semesterLabel || `Semester ${subject.semester || '—'}`)}</p>
    <h2>${escapeHtml(subject.name)}</h2>
    <p class="subject-code-line"><span class="tag">${escapeHtml(code)}</span></p>
    ${resourceCards ? `<div class="resource-list">${resourceCards}</div>` : '<p class="empty">No papers or material are attached to this subject yet.</p>'}`;
}

function renderSearch(term) {
  const tokens = searchTokens(term);
  if (!tokens.length) {
    content.innerHTML = '';
    setCoursesVisible(true);
    return;
  }
  setCoursesVisible(false);

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
        <div class="subject-list">${visibleSubjects.map(({ entry }) => renderSubjectCard(
          entry.subject,
          `${entry.courseCode} · ${entry.branchName} · Semester ${entry.subject.semester}`,
        )).join('')}</div>
      </section>` : ''}
    ${total ? '' : '<p class="empty">Try a subject code like <strong>BE03000081</strong>, a subject name like <strong>Data Structures</strong>, or a branch like <strong>Computer Engineering</strong>.</p>'}`;
}

function renderNotFound(message) {
  setCoursesVisible(false);
  content.innerHTML = `<p class="empty">${escapeHtml(message)} <a href="./">Return home</a>.</p>`;
}

function renderRoute() {
  const params = new URLSearchParams(location.search);
  searchInput.value = '';
  setCoursesVisible(true);
  if (params.has('subject')) return renderSubject(params.get('subject'));
  if (params.has('branch')) return renderBranch(params.get('course'), params.get('branch'));
  if (params.has('course')) return renderCourse(params.get('course'));
  content.innerHTML = '';
}

searchInput.addEventListener('input', event => renderSearch(event.target.value));
fetch('data/catalog.json')
  .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load catalogue')))
  .then(catalog => {
    state.catalog = catalog;
    buildSearchIndex();
    renderCourses();
    renderRoute();
  })
  .catch(() => { content.innerHTML = '<p class="empty">The catalogue could not be loaded. Please try again shortly.</p>'; });
