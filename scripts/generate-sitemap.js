const fs = require('fs');
const path = require('path');

const SITE = 'https://gtupedia.github.io';
const SITE_NAME = 'GTUPEDIA';

function branchesForCourse(course, catalog) {
  if (course.branches?.length) return course.branches;
  if (course.code === 'BE') return catalog.branches || [];
  return [];
}

function branchSlugFor(branchId, branches) {
  if (String(branchId) === '0') return 'common';
  return branches.find(item => item.id === branchId)?.slug || branchId;
}

function branchPath(courseCode, branchId, branches) {
  const id = String(branchId) === '0' ? '0' : String(branchId).padStart(2, '0');
  return `${courseCode}/${id}/${branchSlugFor(id, branches)}`;
}

function subjectPath(courseCode, branchId, subject, branches) {
  return `${branchPath(courseCode, branchId, branches)}/${encodeURIComponent(subject.code)}/${subject.slug}`;
}

function collectSitemapEntries(catalog) {
  const { courses = [], subjects = [] } = catalog;
  const seen = new Set();
  const entries = [];

  function add(routePath, priority, kind, data = {}) {
    const pathValue = routePath.replace(/^\//, '');
    const loc = pathValue ? `${SITE}/${pathValue}` : `${SITE}/`;
    if (seen.has(loc)) return;
    seen.add(loc);
    entries.push({ path: pathValue, loc, priority, kind, ...data });
  }

  add('', '1.0', 'home');
  add('resources/', '0.8', 'static');
  add('team/', '0.7', 'static');
  add('partners/', '0.7', 'static');
  add('campus-ambassador/', '0.7', 'static');

  for (const course of courses) {
    const branches = branchesForCourse(course, catalog);
    add(course.code, '0.9', 'course', { course, branches });
    for (const branch of branches) {
      add(branchPath(course.code, branch.id, branches), '0.8', 'branch', {
        course,
        branch,
        branches,
      });
    }
    for (const subject of subjects) {
      if (subject.courseCode !== course.code) continue;
      add(subjectPath(course.code, subject.branchId, subject, branches), '0.7', 'subject', {
        course,
        subject,
        branches,
      });
    }
  }

  return entries;
}

function generateSitemap(catalog) {
  const lastmod = (catalog.catalogBuiltAt || new Date().toISOString()).slice(0, 10);
  const body = collectSitemapEntries(catalog).map(({ loc, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function writeSitemap(catalog, outPath) {
  fs.writeFileSync(outPath, generateSitemap(catalog));
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatLabel(name = '') {
  if (name !== name.toUpperCase()) return name;
  return name
    .toLowerCase()
    .replace(/\b([a-z])/g, (_, letter) => letter.toUpperCase());
}

function breadcrumbCourseLabel(course) {
  const labels = {
    BB: 'BBA',
    BE: 'B.E.',
    BA: 'B.Arch',
    BC: 'BCA',
    MB: 'MBA',
    MC: 'MCA',
    BH: 'BHMCT',
    BN: 'B.Design',
    EP: 'B.E. (Part Time)',
  };
  return labels[course?.code] || formatLabel(course?.name || course?.code || '');
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

function paperSetCourseCode(paperSet) {
  return paperSet?.courseCode || 'BE';
}

function subjectCodes(subject) {
  return [subject.code, ...(subject.alternateCodes || [])].filter(Boolean);
}

function examPaperLinks(subject, examPapers = []) {
  const courseCode = subject.courseCode || 'BE';
  const links = [];
  const seen = new Set();

  for (const code of subjectCodes(subject)) {
    for (const paperSet of examPapers) {
      if (paperSetCourseCode(paperSet) !== courseCode) continue;
      if (!hasExamPaper(code, paperSet)) continue;
      const key = `${paperSet.exam}:${code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const fileName = resolvePaperFileName(code, paperSet);
      links.push({
        label: paperSet.exam || 'Exam paper',
        url: `${paperSet.baseUrl}/${encodeURIComponent(fileName)}.pdf`,
      });
    }
  }

  return links;
}

function examSeasonCount(subject, examPapers = []) {
  const courseCode = subject.courseCode || 'BE';
  let count = 0;
  for (const paperSet of examPapers) {
    if (paperSetCourseCode(paperSet) !== courseCode) continue;
    if (subjectCodes(subject).some(code => hasExamPaper(code, paperSet))) count += 1;
  }
  return count;
}

function subjectsForBranch(branchId, courseCode, subjects = []) {
  const id = String(branchId) === '0' ? '0' : String(branchId).padStart(2, '0');
  return subjects.filter(subject => {
    if ((subject.courseCode || 'BE') !== courseCode) return false;
    const subjectBranch = String(subject.branchId) === '0' ? '0' : String(subject.branchId).padStart(2, '0');
    return subjectBranch === id;
  });
}

function renderSeoShell({
  title,
  description,
  path = '',
  h1,
  intro,
  bodyHtml,
  jsonLd = [],
  catalogVersion,
}) {
  const canonical = path ? `${SITE}/${path.replace(/^\//, '')}` : `${SITE}/`;
  const structured = jsonLd.filter(Boolean);
  const ldScript = structured.length
    ? `<script type="application/ld+json">${JSON.stringify(structured.length === 1 ? structured[0] : structured)}</script>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <title>${escapeHtml(title)}</title>
    ${ldScript}
    <script>
      window.__GTUPEDIA_BASE = location.pathname.startsWith('/gtupedia.github.io') ? '/gtupedia.github.io/' : '/';
      window.__GTUPEDIA_CATALOG_V = '${escapeHtml(String(catalogVersion || '1'))}';
    </script>
    <base href="/">
    <script>document.querySelector('base').href = window.__GTUPEDIA_BASE;</script>
    <link rel="stylesheet" href="assets/styles.css">
  </head>
  <body class="subpage">
    <header class="site-header">
      <div class="brand-group">
        <a class="brand" href="./" aria-label="${SITE_NAME} home">GTU<span>PEDIA</span></a>
        <span class="beta-badge">Beta</span>
      </div>
      <nav aria-label="Primary navigation">
        <a href="resources/">Resources</a>
        <a href="./#courses">Courses</a>
        <a href="./#about">About</a>
      </nav>
    </header>
    <main>
      <section id="content" class="content">
        <article class="seo-prerender">
          <header class="page-header">
            <h1 class="page-title">${h1}</h1>
            ${intro ? `<p class="seo-intro">${intro}</p>` : ''}
          </header>
          ${bodyHtml || ''}
        </article>
      </section>
    </main>
    <footer class="site-footer" data-site-footer></footer>
    <script src="assets/site-footer.js"></script>
    <script src="assets/app.js"></script>
  </body>
</html>
`;
}

function breadcrumbListJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildCoursePage(course, catalog) {
  const courseCode = course.code;
  const courseName = formatLabel(course.name);
  const branches = branchesForCourse(course, catalog);
  const subjectCount = (catalog.subjects || []).filter(item => item.courseCode === courseCode).length;
  const title = `${courseName} (${courseCode}) — GTU Branches | ${SITE_NAME}`;
  const description = `Browse all ${courseCode} branches at GTU. Find subjects, semesters, and official exam papers for ${courseName}.`;
  const branchLinks = branches.map(branch => {
    const route = branchPath(courseCode, branch.id, branches);
    const count = subjectsForBranch(branch.id, courseCode, catalog.subjects).length;
    return `<li><a href="${escapeHtml(route)}">${escapeHtml(branch.name)}</a>${count ? ` — ${count} subjects` : ''}</li>`;
  }).join('\n');

  return renderSeoShell({
    title,
    description,
    path: courseCode,
    h1: escapeHtml(courseName),
    intro: escapeHtml(`Select your ${courseCode} branch to browse semester-wise subjects and GTU question papers.`),
    bodyHtml: `
      <p>${subjectCount ? `${subjectCount} subjects across ${branches.length} branch${branches.length === 1 ? '' : 'es'}.` : 'Course catalogue on GTUPEDIA.'}</p>
      ${branchLinks ? `<h2>Branches</h2><ul>${branchLinks}</ul>` : '<p>Branches coming soon.</p>'}`,
    jsonLd: [breadcrumbListJsonLd([
      { name: 'Home', url: `${SITE}/` },
      { name: breadcrumbCourseLabel(course), url: `${SITE}/${courseCode}` },
    ])],
    catalogVersion: catalog.catalogBuiltAt,
  });
}

function buildBranchPage(course, branch, branches, catalog) {
  const courseCode = course.code;
  const courseName = formatLabel(course.name);
  const route = branchPath(courseCode, branch.id, branches);
  const subjects = subjectsForBranch(branch.id, courseCode, catalog.subjects);
  const title = `${branch.name} (${courseCode} ${branch.id}) — GTU Subjects | ${SITE_NAME}`;
  const description = `Browse ${subjects.length} ${branch.name} subjects by semester. Access GTU exam papers and study resources for ${courseName}.`;
  const subjectLinks = subjects.slice(0, 120).map(subject => {
    const subjectRoute = subjectPath(courseCode, branch.id, subject, branches);
    return `<li><a href="${escapeHtml(subjectRoute)}">${escapeHtml(subject.name)}</a> <span>(${escapeHtml(subject.code)}) · ${escapeHtml(subject.semesterLabel || `Semester ${subject.semester}`)}</span></li>`;
  }).join('\n');

  return renderSeoShell({
    title,
    description,
    path: route,
    h1: escapeHtml(branch.name),
    intro: escapeHtml(`${courseName} · Branch ${branch.id} · ${subjects.length} subjects.`),
    bodyHtml: `
      <h2>Subjects</h2>
      <ul>${subjectLinks}</ul>
      ${subjects.length > 120 ? `<p>Showing 120 of ${subjects.length} subjects. Open the page in your browser for the full list.</p>` : ''}`,
    jsonLd: [breadcrumbListJsonLd([
      { name: 'Home', url: `${SITE}/` },
      { name: breadcrumbCourseLabel(course), url: `${SITE}/${courseCode}` },
      { name: branch.name, url: `${SITE}/${route}` },
    ])],
    catalogVersion: catalog.catalogBuiltAt,
  });
}

function normalizeBranchId(raw = '') {
  const value = String(raw).trim();
  if (!value) return value;
  if (value === '0') return '0';
  if (/^\d+$/.test(value)) return value.padStart(2, '0');
  return value.toUpperCase();
}

function buildSubjectPage(course, subject, branches, catalog) {
  const courseCode = subject.courseCode || course.code;
  const branchId = normalizeBranchId(subject.branchId);
  const branch = branches.find(item => item.id === branchId);
  const branchName = branch?.name || `Branch ${subject.branchId}`;
  const route = subjectPath(courseCode, branchId, subject, branches);
  const code = subject.code || subject.id.split('@')[0];
  const alternateCodes = (subject.alternateCodes || []).filter(item => item !== code);
  const paperCount = examSeasonCount(subject, catalog.examPapers || []);
  const papers = examPaperLinks(subject, catalog.examPapers || []);
  const title = `${subject.name} (${code}) — GTU Papers | ${SITE_NAME}`;
  const description = `Download GTU ${subject.name} (${code}) question papers for ${branchName}. ${paperCount ? `${paperCount} exam seasons available.` : 'Syllabus and study resources.'} Semester ${subject.semester}.`;
  const paperHtml = papers.length
    ? `<h2>GTU exam papers</h2><ul>${papers.map(paper => `<li><a href="${escapeHtml(paper.url)}" rel="noopener">${escapeHtml(paper.label)}</a></li>`).join('')}</ul>`
    : '<p>No exam papers are linked for this subject yet.</p>';
  const branchRoute = branch ? branchPath(courseCode, branch.id, branches) : courseCode;

  return renderSeoShell({
    title,
    description,
    path: route,
    h1: escapeHtml(subject.name),
    intro: escapeHtml(`${branchName} · ${subject.semesterLabel || `Semester ${subject.semester}`}${paperCount ? ` · ${paperCount} exam paper season${paperCount === 1 ? '' : 's'}` : ''}`),
    bodyHtml: `
      <p><strong>Subject code:</strong> ${escapeHtml(code)}${alternateCodes.length ? `<br><strong>Also listed as:</strong> ${alternateCodes.map(escapeHtml).join(', ')}` : ''}</p>
      ${paperHtml}
      <p><a href="${escapeHtml(branchRoute)}">← Back to ${escapeHtml(branchName)} subjects</a></p>`,
    jsonLd: [
      breadcrumbListJsonLd([
        { name: 'Home', url: `${SITE}/` },
        { name: breadcrumbCourseLabel(course), url: `${SITE}/${courseCode}` },
        { name: branchName, url: `${SITE}/${branchRoute}` },
        { name: subject.name, url: `${SITE}/${route}` },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: subject.name,
        courseCode: code,
        description: `${subject.name} (${code}) — GTU ${branchName}, ${subject.semesterLabel || `Semester ${subject.semester}`}.`,
        provider: { '@type': 'Organization', name: 'Gujarat Technological University' },
      },
    ],
    catalogVersion: catalog.catalogBuiltAt,
  });
}

function writeSeoPages(catalog, outDir) {
  const entries = collectSitemapEntries(catalog).filter(entry => ['course', 'branch', 'subject'].includes(entry.kind));
  let count = 0;

  for (const entry of entries) {
    let html;
    if (entry.kind === 'course') html = buildCoursePage(entry.course, catalog);
    else if (entry.kind === 'branch') html = buildBranchPage(entry.course, entry.branch, entry.branches, catalog);
    else if (entry.kind === 'subject') html = buildSubjectPage(entry.course, entry.subject, entry.branches, catalog);
    else continue;

    const dir = path.join(outDir, entry.path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    count += 1;
  }

  return count;
}

if (require.main === module) {
  const base = path.join(__dirname, '..');
  const catalog = JSON.parse(fs.readFileSync(path.join(base, 'data/catalog.json'), 'utf8'));
  const count = writeSeoPages(catalog, base);
  console.log(`seo pages: ${count}`);
}

module.exports = {
  SITE,
  collectSitemapEntries,
  generateSitemap,
  writeSitemap,
  writeSeoPages,
  branchesForCourse,
  branchPath,
  subjectPath,
};
