const state = { catalog: null };
const content = document.querySelector('#content');
const courseList = document.querySelector('#course-list');
const coursesSection = document.querySelector('#courses');
const searchInput = document.querySelector('#search-input');

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
  return branches.find(item => String(item.id) === branchId)
    || (state.catalog.branches || []).find(item => String(item.id) === branchId);
}

function findCourseForBranch(branchId) {
  for (const course of state.catalog.courses || []) {
    if ((course.branches || []).some(branch => String(branch.id) === branchId)) return course.code;
  }
  if ((state.catalog.branches || []).some(branch => String(branch.id) === branchId)) return 'BE';
  return null;
}

function setCoursesVisible(visible) {
  if (coursesSection) coursesSection.hidden = !visible;
}

function renderCourses() {
  const courses = state.catalog.courses || [];
  if (!courseList) return;
  courseList.innerHTML = courses.length ? courses.map(course => {
    const branchCount = getCourseBranches(course.code).length;
    const detail = branchCount
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
    ${branches.length ? `<div class="card-grid">${branches.map(branch => `
      <a class="branch-card" href="${urlFor({ course: courseCode, branch: branch.id })}">
        <span class="branch-code">${escapeHtml(branch.id)}</span>
        <h3>${escapeHtml(branch.name)}</h3>
        <p>Browse subjects and resources</p>
      </a>`).join('')}</div>` : '<p class="empty">No branches have been imported for this course yet.</p>'}`;
}

function renderBranch(courseCode, branchId) {
  const branch = findBranch(branchId, courseCode);
  const resolvedCourse = courseCode || findCourseForBranch(branchId);
  const subjects = (state.catalog.subjects || []).filter(subject => String(subject.branchId) === branchId || String(subject.branchId) === '0');
  if (!branch) return renderNotFound('That branch is not in the catalogue yet.');
  setCoursesVisible(false);
  const backHref = resolvedCourse ? urlFor({ course: resolvedCourse }) : './#courses';
  const bySemester = subjects.reduce((groups, subject) => {
    const semester = subject.semester || 'Unsorted';
    (groups[semester] ||= []).push(subject);
    return groups;
  }, {});
  content.innerHTML = `
    <a class="back-link" href="${backHref}">← Back to branches</a>
    <p class="eyebrow">${escapeHtml(branch.name)}</p>
    <h2>Choose a subject</h2>
    ${Object.keys(bySemester).length ? `<div class="subject-groups">${Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([semester, items]) => `
      <section class="subject-group">
        <h2>Semester ${escapeHtml(semester)}</h2>
        <div class="subject-list">${items.map(subject => `
          <a class="subject-card" href="${urlFor({ subject: subject.id })}">
            <span class="tag">${escapeHtml(subject.id)}</span>
            <h3>${escapeHtml(subject.name)}</h3>
            <p>Open papers and material</p>
          </a>`).join('')}</div>
      </section>`).join('')}</div>` : '<p class="empty">No subjects have been imported for this branch yet.</p>'}`;
}

function renderSubject(subjectId) {
  const subject = (state.catalog.subjects || []).find(item => String(item.id) === subjectId);
  if (!subject) return renderNotFound('That subject is not in the catalogue yet.');
  setCoursesVisible(false);
  const courseCode = findCourseForBranch(String(subject.branchId));
  const backHref = courseCode
    ? urlFor({ course: courseCode, branch: subject.branchId })
    : urlFor({ branch: subject.branchId });
  const resources = (state.catalog.resources || []).filter(item => String(item.subjectId) === subjectId);
  content.innerHTML = `
    <a class="back-link" href="${backHref}">← Back to subjects</a>
    <p class="eyebrow">Semester ${escapeHtml(subject.semester || '—')} · ${escapeHtml(subject.id)}</p>
    <h2>${escapeHtml(subject.name)}</h2>
    ${resources.length ? `<div class="resource-list">${resources.map(resource => `
      <a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener">
        <span class="tag">${escapeHtml(resource.type)}</span>
        <h3>${escapeHtml(resource.title)}</h3>
        <p>${[resource.exam, resource.author].filter(Boolean).map(escapeHtml).join(' · ') || 'Open resource'}</p>
      </a>`).join('')}</div>` : '<p class="empty">No papers or material are attached to this subject yet.</p>'}`;
}

function renderSearch(term) {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    content.innerHTML = '';
    setCoursesVisible(true);
    return;
  }
  setCoursesVisible(false);
  const courseMatches = (state.catalog.courses || []).filter(course => `${course.code} ${course.name}`.toLowerCase().includes(normalized));
  const subjectMatches = (state.catalog.subjects || []).filter(subject => `${subject.id} ${subject.name}`.toLowerCase().includes(normalized));
  const branchMatches = (state.catalog.branches || []).filter(branch => `${branch.id} ${branch.name}`.toLowerCase().includes(normalized));
  const total = courseMatches.length + subjectMatches.length + branchMatches.length;
  content.innerHTML = `
    <p class="eyebrow">Search results</p>
    <h2>${total ? `${total} matching result${total === 1 ? '' : 's'}` : 'No matching results'}</h2>
    ${courseMatches.length ? `
      <section class="search-group">
        <h3>Courses</h3>
        <div class="card-grid">${courseMatches.map(course => `
          <a class="branch-card course-card" href="${urlFor({ course: course.code })}">
            <span class="branch-code">${escapeHtml(course.code)}</span>
            <h3>${escapeHtml(formatLabel(course.name))}</h3>
            <p>Open course branches</p>
          </a>`).join('')}</div>
      </section>` : ''}
    ${branchMatches.length ? `
      <section class="search-group">
        <h3>Branches</h3>
        <div class="card-grid">${branchMatches.map(branch => `
          <a class="branch-card" href="${urlFor({ course: 'BE', branch: branch.id })}">
            <span class="branch-code">${escapeHtml(branch.id)}</span>
            <h3>${escapeHtml(branch.name)}</h3>
            <p>Browse subjects and resources</p>
          </a>`).join('')}</div>
      </section>` : ''}
    ${subjectMatches.length ? `
      <section class="search-group">
        <h3>Subjects</h3>
        <div class="subject-list">${subjectMatches.map(subject => `
          <a class="subject-card" href="${urlFor({ subject: subject.id })}">
            <span class="tag">${escapeHtml(subject.id)}</span>
            <h3>${escapeHtml(subject.name)}</h3>
            <p>Semester ${escapeHtml(subject.semester || '—')}</p>
          </a>`).join('')}</div>
      </section>` : ''}
    ${total ? '' : '<p class="empty">Try a course code, branch name, or subject code.</p>'}`;
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
  .then(catalog => { state.catalog = catalog; renderCourses(); renderRoute(); })
  .catch(() => { content.innerHTML = '<p class="empty">The catalogue could not be loaded. Please try again shortly.</p>'; });
