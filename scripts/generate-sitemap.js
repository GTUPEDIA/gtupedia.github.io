const fs = require('fs');
const path = require('path');
const {
  SEO,
  siteUrl,
  organizationJsonLd,
  webPageJsonLd,
  learningResourceJsonLd,
  seoTitleCourse,
  seoDescriptionCourse,
  seoIntroCourse,
  seoTitleBranch,
  seoDescriptionBranch,
  seoTitleSubject,
  seoDescriptionSubject,
  adsenseHeadScript,
  PAPER_ENABLED_COURSES,
  socialMetaTags,
  itemListJsonLd,
  subjectFaqJsonLd,
  chromeHeaderInner,
  chromeFooterInner,
  homeJsonLdScript,
} = require('./seo-config');

const SITE = SEO.siteUrl;
const SITE_NAME = SEO.siteName;

function branchesForCourse(course, catalog) {
  if (course.branches?.length) return course.branches;
  if (course.code === 'BE') return catalog.branches || [];
  return [];
}

function branchSlugFor(branchId, branches) {
  if (String(branchId) === '0') return 'common';
  return branches.find(item => item.id === branchId)?.slug || branchId;
}

function isNccBranch(branchId) {
  return ['NA', 'NB', 'NC'].includes(String(branchId || '').toUpperCase());
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
    const loc = siteUrl(pathValue);
    if (seen.has(loc)) return;
    seen.add(loc);
    entries.push({ path: pathValue, loc, priority, kind, ...data });
  }

  add('', '1.0', 'home');
  add('resources/', '0.8', 'static');
  add('about/', '0.7', 'static');
  add('privacy/', '0.7', 'static');
  add('guides/download-gtu-papers/', '0.8', 'static');
  add('github-initiative/', '0.8', 'static');
  add('github-initiative/level-0/', '0.75', 'static');
  add('github-initiative/level-0/before-you-start/', '0.7', 'static');
  add('github-initiative/level-0/github-account/', '0.7', 'static');
  add('github-initiative/level-0/first-repository/', '0.7', 'static');
  add('github-initiative/level-0/github-pages/', '0.7', 'static');
  add('github-initiative/level-0/add-edit-code/', '0.7', 'static');
  add('github-initiative/level-0/git-commands/', '0.7', 'static');
  add('github-initiative/level-0/branches-merging/', '0.7', 'static');
  add('github-initiative/level-0/collaboration/', '0.7', 'static');
  add('github-initiative/level-0/whats-next/', '0.7', 'static');
  add('team/', '0.7', 'static');
  add('partners/', '0.7', 'static');
  add('events/', '0.7', 'static');
  add('internships/', '0.7', 'static');
  add('campus-ambassador/', '0.7', 'static');

  for (const course of courses) {
    if (!PAPER_ENABLED_COURSES.has(course.code)) continue;
    const branches = branchesForCourse(course, catalog);
    const examPapers = catalog.examPapers || [];
    const courseSubjectCount = (catalog.subjects || []).filter(
      item => item.courseCode === course.code && subjectHasPapers(item, examPapers),
    ).length;
    if (!courseSubjectCount) continue;

    add(course.code, '0.9', 'course', { course, branches });
    for (const branch of branches) {
      if (isNccBranch(branch.id)) continue;
      const branchSubjectCount = listedSubjectsForBranch(branch.id, course.code, catalog.subjects, examPapers).length;
      if (!branchSubjectCount) continue;
      add(branchPath(course.code, branch.id, branches), '0.8', 'branch', {
        course,
        branch,
        branches,
      });
    }
    for (const subject of subjects) {
      if (subject.courseCode !== course.code) continue;
      if (isNccBranch(subject.branchId)) continue;
      if (!subjectHasPapers(subject, catalog.examPapers || [])) continue;
      add(subjectPath(course.code, subject.branchId, subject, branches), '0.7', 'subject', {
        course,
        subject,
        branches,
      });
    }
  }

  return entries;
}

function renderUrlset(entries, lastmod) {
  const body = entries.map(({ loc, priority, changefreq = 'monthly' }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function generateSitemap(catalog) {
  const lastmod = (catalog.catalogBuiltAt || new Date().toISOString()).slice(0, 10);
  return renderUrlset(collectSitemapEntries(catalog), lastmod);
}

function writeSitemap(catalog, outPath) {
  fs.writeFileSync(outPath, generateSitemap(catalog));
}

function writeSitemapIndex(sitemapFiles, outPath, lastmod) {
  const body = sitemapFiles.map(file => `  <sitemap>
    <loc>${siteUrl(file)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`).join('\n');

  fs.writeFileSync(outPath, `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`);
}

function writeAllSitemaps(catalog, outDir) {
  const lastmod = (catalog.catalogBuiltAt || new Date().toISOString()).slice(0, 10);
  const entries = collectSitemapEntries(catalog);
  const sitemapDir = path.join(outDir, 'sitemaps');
  fs.mkdirSync(sitemapDir, { recursive: true });

  const hubEntries = entries.filter(entry => entry.kind !== 'subject');
  const subjectEntries = entries.filter(entry => entry.kind === 'subject');

  fs.writeFileSync(path.join(sitemapDir, 'pages.xml'), renderUrlset(hubEntries, lastmod));

  const subjectsByCourse = new Map();
  for (const entry of subjectEntries) {
    const courseCode = entry.path.split('/')[0];
    if (!subjectsByCourse.has(courseCode)) subjectsByCourse.set(courseCode, []);
    subjectsByCourse.get(courseCode).push(entry);
  }

  const subjectSitemapFiles = [];
  for (const [courseCode, courseEntries] of subjectsByCourse) {
    const fileName = `sitemaps/subjects-${courseCode.toLowerCase()}.xml`;
    fs.writeFileSync(path.join(outDir, fileName), renderUrlset(courseEntries, lastmod));
    subjectSitemapFiles.push(fileName);
  }

  writeSitemapIndex(subjectSitemapFiles, path.join(sitemapDir, 'subjects-index.xml'), lastmod);
  // sitemap.xml is the file already submitted in Search Console. It must list the
  // subject urlsets, not only hub pages, or Google never receives the paper URLs.
  const indexFiles = ['sitemaps/pages.xml', ...subjectSitemapFiles];
  writeSitemapIndex(indexFiles, path.join(outDir, 'sitemap.xml'), lastmod);

  return {
    totalUrls: entries.length,
    submittedUrls: entries.length,
    sitemapFiles: indexFiles,
    subjectUrls: subjectEntries.length,
  };
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
    BP: 'B.Pharm',
    DI: 'Diploma Engg.',
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

const GTU_SYLLABUS_BASE = 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus';

function gtuSyllabusUrl(subjectCode) {
  const code = String(subjectCode).trim();
  return `${GTU_SYLLABUS_BASE}/${encodeURIComponent(code)}.pdf`;
}

function syllabusLinks(subject) {
  return [...new Set(subjectCodes(subject).map(code => String(code).trim()).filter(Boolean))]
    .map(code => ({ label: `Syllabus (${code})`, url: gtuSyllabusUrl(code) }));
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

function subjectHasPapers(subject, examPapers = []) {
  return examSeasonCount(subject, examPapers) > 0;
}

function listedSubjectsForBranch(branchId, courseCode, subjects = [], examPapers = []) {
  return subjectsForBranch(branchId, courseCode, subjects).filter(subject => subjectHasPapers(subject, examPapers));
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
  robots = 'index, follow',
}) {
  const canonical = siteUrl(path);
  const structured = [organizationJsonLd(), webPageJsonLd({ title, description, url: canonical }), ...jsonLd].filter(Boolean);
  const ldScript = structured.length
    ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': structured.map(({ '@context': _c, ...item }) => item) })}</script>`
    : '';
  const social = socialMetaTags({ title, description, url: canonical });

  return `<!doctype html>
<html lang="${SEO.language}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="${escapeHtml(robots)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:locale" content="${SEO.locale}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    ${social}
    <title>${escapeHtml(title)}</title>
    ${adsenseHeadScript()}
    ${ldScript}
    <script>
      window.__GTUPEDIA_CATALOG_V = '${escapeHtml(String(catalogVersion || '1'))}';
    </script>
    <base href="/">
    <script src="assets/site-base.js"></script>
    <link rel="stylesheet" href="assets/styles.css">
    <script src="assets/site-seo.js" defer></script>
    <script src="assets/site-analytics.js" defer></script>
    <script src="assets/site-ads.js" defer></script>
    <script src="assets/site-chrome.js?v=${escapeHtml(String(catalogVersion || '1'))}" defer></script>
  </head>
  <body class="subpage">
    <header class="site-header" data-site-header>${chromeHeaderInner('/')}</header>
    <div id="search-bar" class="search-bar">
      <label class="search" for="search-input">
        <span class="visually-hidden">Search courses, branches, and subjects</span>
        <input id="search-input" type="search" placeholder="Search course, branch, or subject (2+ letters)" autocomplete="off">
      </label>
    </div>
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
    <footer class="site-footer" data-site-footer>${chromeFooterInner('/')}</footer>
    <script src="assets/app.js?v=${escapeHtml(String(catalogVersion || '1'))}" defer></script>
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
  const examPapers = catalog.examPapers || [];
  const subjectCount = (catalog.subjects || []).filter(
    item => item.courseCode === courseCode && subjectHasPapers(item, examPapers),
  ).length;
  const title = seoTitleCourse(courseName, courseCode);
  const description = seoDescriptionCourse(courseName, courseCode, branches.length, subjectCount);
  const listedBranches = branches
    .map(branch => {
      const route = branchPath(courseCode, branch.id, branches);
      const count = listedSubjectsForBranch(branch.id, courseCode, catalog.subjects, examPapers).length;
      return { branch, route, count };
    })
    .filter(item => item.count > 0 && !isNccBranch(item.branch.id));
  const branchLinks = listedBranches.map(({ branch, route, count }) => (
    `<li><a href="${escapeHtml(`${route}/`)}">${escapeHtml(branch.name)}</a> — ${count} subjects with papers</li>`
  )).join('\n');
  const itemList = itemListJsonLd(`${courseName} GTU branches`, listedBranches.slice(0, 50).map(({ branch, route }) => ({
    name: branch.name,
    url: siteUrl(route),
  })));

  return renderSeoShell({
    title,
    description,
    path: courseCode,
    h1: escapeHtml(`${courseName} GTU Question Papers`),
    intro: escapeHtml(seoIntroCourse(courseCode, courseName, listedBranches.length)),
    bodyHtml: `
      <p>${subjectCount ? `${subjectCount} subjects with exam papers across ${listedBranches.length} branch${listedBranches.length === 1 ? '' : 'es'}.` : 'Course catalogue on GTUPEDIA.'}</p>
      ${branchLinks ? `<h2>Branches</h2><ul>${branchLinks}</ul>` : '<p>Branches coming soon.</p>'}`,
    jsonLd: [
      breadcrumbListJsonLd([
        { name: 'Home', url: siteUrl() },
        { name: breadcrumbCourseLabel(course), url: siteUrl(courseCode) },
      ]),
      itemList,
    ].filter(Boolean),
    catalogVersion: catalog.catalogBuiltAt,
  });
}

function buildBranchPage(course, branch, branches, catalog) {
  const courseCode = course.code;
  const courseName = formatLabel(course.name);
  const route = branchPath(courseCode, branch.id, branches);
  const examPapers = catalog.examPapers || [];
  const subjects = listedSubjectsForBranch(branch.id, courseCode, catalog.subjects, examPapers);
  const title = seoTitleBranch(branch.name, courseCode, branch.id);
  const description = seoDescriptionBranch(branch.name, courseCode, subjects.length);
  const subjectLinks = subjects.slice(0, 120).map(subject => {
    const subjectRoute = subjectPath(courseCode, branch.id, subject, branches);
    return `<li><a href="${escapeHtml(`${subjectRoute}/`)}">${escapeHtml(subject.name)}</a> <span>(${escapeHtml(subject.code)}) · ${escapeHtml(subject.semesterLabel || `Semester ${subject.semester}`)}</span></li>`;
  }).join('\n');
  const itemList = itemListJsonLd(`${branch.name} GTU subjects`, subjects.slice(0, 50).map(subject => ({
    name: `${subject.name} (${subject.code})`,
    url: siteUrl(subjectPath(courseCode, branch.id, subject, branches)),
  })));

  return renderSeoShell({
    title,
    description,
    path: route,
    h1: escapeHtml(branch.name),
    intro: escapeHtml(`${courseName} · Branch ${branch.id} · ${subjects.length} subjects with exam papers.`),
    bodyHtml: `
      <p>${escapeHtml(`${branch.name} (GTU ${courseCode} branch ${branch.id}) — ${subjects.length} subject${subjects.length === 1 ? '' : 's'} with exam papers or syllabus links in ${courseName}.`)}</p>
      <h2>Subjects with papers</h2>
      <ul>${subjectLinks}</ul>
      ${subjects.length > 120 ? `<p>Showing 120 of ${subjects.length} subjects. Open the page in your browser for the full list.</p>` : ''}
      ${subjects.length ? '' : '<p>No exam papers are available for this branch yet.</p>'}`,
    jsonLd: [
      breadcrumbListJsonLd([
        { name: 'Home', url: siteUrl() },
        { name: breadcrumbCourseLabel(course), url: siteUrl(courseCode) },
        { name: branch.name, url: siteUrl(route) },
      ]),
      itemList,
    ].filter(Boolean),
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
  const syllabi = syllabusLinks(subject);
  const title = seoTitleSubject(subject.name, code);
  const description = seoDescriptionSubject(subject.name, code, branchName, subject.semester, paperCount);
  const syllabusHtml = syllabi.length
    ? `<h2>GTU syllabus</h2><ul>${syllabi.map(link => `<li><a href="${escapeHtml(link.url)}" rel="noopener">${escapeHtml(link.label)}</a></li>`).join('')}</ul>`
    : '';
  const paperHtml = papers.length
    ? `<h2>GTU exam papers</h2><ul>${papers.map(paper => `<li><a href="${escapeHtml(paper.url)}" rel="noopener">${escapeHtml(paper.label)}</a></li>`).join('')}</ul>`
    : '<p>No exam papers are linked for this subject yet.</p>';
  const branchRoute = branch ? branchPath(courseCode, branch.id, branches) : courseCode;
  const semesterLabel = subject.semesterLabel || `Semester ${subject.semester}`;
  const relatedSubjects = listedSubjectsForBranch(branchId, courseCode, catalog.subjects, catalog.examPapers || [])
    .filter(item => item.id !== subject.id && item.semester === subject.semester)
    .slice(0, 8);
  const relatedHtml = relatedSubjects.length
    ? `<h2>More ${escapeHtml(semesterLabel)} papers in ${escapeHtml(branchName)}</h2><ul>${relatedSubjects.map(related => {
      const relatedRoute = subjectPath(courseCode, branchId, related, branches);
      return `<li><a href="${escapeHtml(`${relatedRoute}/`)}">${escapeHtml(related.name)}</a> <span>(${escapeHtml(related.code)})</span></li>`;
    }).join('')}</ul>`
    : '';
  const courseLabel = breadcrumbCourseLabel(course);
  const subjectBlurb = paperCount
    ? `${subject.name} (${code}) is listed under ${branchName}, ${semesterLabel}, in GTU ${courseLabel}. Official question papers are linked below for ${paperCount} exam season${paperCount === 1 ? '' : 's'}.`
    : `${subject.name} (${code}) is listed under ${branchName}, ${semesterLabel}, in GTU ${courseLabel}. Syllabus links appear below; exam papers are added when GTU releases them.`;
  const paperSeasonList = papers.map(paper => paper.label).join(', ');
  const faqHtml = `
      <h2>Frequently asked questions</h2>
      <dl class="seo-faq">
        <dt>Where can I download ${escapeHtml(subject.name)} GTU question papers?</dt>
        <dd>Official PDFs for ${escapeHtml(code)} are linked below${paperCount ? ` (${escapeHtml(paperSeasonList)})` : ''}. Each file is hosted on gtu.ac.in.</dd>
        <dt>Which branch and semester is ${escapeHtml(code)}?</dt>
        <dd>${escapeHtml(branchName)}, ${escapeHtml(semesterLabel)}, ${escapeHtml(courseLabel)}.</dd>
      </dl>`;

  return renderSeoShell({
    title,
    description,
    path: route,
    h1: escapeHtml(subject.name),
    intro: escapeHtml(`${branchName} · ${semesterLabel}${paperCount ? ` · ${paperCount} exam paper season${paperCount === 1 ? '' : 's'}` : ''}`),
    bodyHtml: `
      <p>${escapeHtml(subjectBlurb)}</p>
      <p><strong>Subject code:</strong> ${escapeHtml(code)}${alternateCodes.length ? `<br><strong>Also listed as:</strong> ${alternateCodes.map(escapeHtml).join(', ')}` : ''}</p>
      ${syllabusHtml}
      ${paperHtml}
      ${faqHtml}
      ${relatedHtml}
      <p><a href="${escapeHtml(`${branchRoute}/`)}">← Back to ${escapeHtml(branchName)} subjects</a></p>`,
    jsonLd: [
      breadcrumbListJsonLd([
        { name: 'Home', url: siteUrl() },
        { name: courseLabel, url: siteUrl(courseCode) },
        { name: branchName, url: siteUrl(branchRoute) },
        { name: subject.name, url: siteUrl(route) },
      ]),
      learningResourceJsonLd(subject, branchName, siteUrl(route), paperCount),
      subjectFaqJsonLd(subject, branchName, code, paperCount, courseLabel),
    ],
    catalogVersion: catalog.catalogBuiltAt,
  });
}

function replaceSeoBlock(html, name, inner) {
  const start = `<!--seo:${name}-->`;
  const end = `<!--/seo:${name}-->`;
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from === -1 || to === -1 || to < from) return html;
  return `${html.slice(0, from + start.length)}\n${inner}\n    ${html.slice(to)}`;
}

function homeCourseCardsHtml(catalog) {
  const examPapers = catalog.examPapers || [];
  const order = ['BE', 'DI', 'BB', 'BC', 'MB', 'MC', 'BP'];
  return order.map((code) => {
    const course = (catalog.courses || []).find(item => item.code === code);
    if (!course) return '';
    const branches = branchesForCourse(course, catalog);
    const subjectCount = (catalog.subjects || []).filter(
      item => item.courseCode === code && subjectHasPapers(item, examPapers),
    ).length;
    if (!subjectCount) return '';
    const name = formatLabel(course.name);
    const branchCount = branches.filter(branch => (
      listedSubjectsForBranch(branch.id, code, catalog.subjects, examPapers).length > 0
    )).length;
    return `<a class="branch-card course-card course-card--available" href="${escapeHtml(code)}/">
      <span class="branch-code">${escapeHtml(code)}</span>
      <h3>${escapeHtml(name)}</h3>
      <p>${branchCount} branch${branchCount === 1 ? '' : 'es'} · ${subjectCount} subjects</p>
    </a>`;
  }).filter(Boolean).join('\n          ');
}

const POPULAR_BRANCHES = [
  ['BE', '07'],
  ['BE', '19'],
  ['BE', '06'],
  ['BE', '09'],
  ['BE', '16'],
  ['DI', '07'],
  ['BB', '01'],
  ['MB', '92'],
  ['BC', '01'],
  ['BP', '90'],
];

function homePopularLinksHtml(catalog) {
  const examPapers = catalog.examPapers || [];
  const links = [];
  for (const [courseCode, branchId] of POPULAR_BRANCHES) {
    const course = (catalog.courses || []).find(item => item.code === courseCode);
    if (!course) continue;
    const branches = branchesForCourse(course, catalog);
    const branch = branches.find(item => item.id === branchId);
    if (!branch) continue;
    const count = listedSubjectsForBranch(branch.id, courseCode, catalog.subjects, examPapers).length;
    if (!count) continue;
    const route = branchPath(courseCode, branch.id, branches);
    const label = courseCode === 'DI' ? `Diploma ${branch.name}` : branch.name;
    links.push(`<a href="${escapeHtml(route)}/">${escapeHtml(label)} papers</a>`);
  }
  return links.join('\n          ');
}

function writeHomePage(catalog, filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  html = replaceSeoBlock(html, 'home-jsonld', homeJsonLdScript());
  html = replaceSeoBlock(html, 'home-header', chromeHeaderInner('/'));
  html = replaceSeoBlock(html, 'home-courses', homeCourseCardsHtml(catalog));
  html = replaceSeoBlock(html, 'home-popular', homePopularLinksHtml(catalog));
  html = replaceSeoBlock(html, 'home-footer', chromeFooterInner('/'));
  fs.writeFileSync(filePath, html);
}

function writeSeoPages(catalog, outDir, kinds = ['course', 'branch', 'subject']) {
  const wanted = new Set(kinds);
  const entries = collectSitemapEntries(catalog).filter(entry => wanted.has(entry.kind));
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
  writeAllSitemaps,
  writeSeoPages,
  writeHomePage,
  branchesForCourse,
  branchPath,
  subjectPath,
};
