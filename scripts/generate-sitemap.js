const fs = require('fs');
const path = require('path');

const SITE = 'https://gtupedia.github.io';

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

function generateSitemap(catalog) {
  const { courses = [], branches = [], subjects = [] } = catalog;
  const seen = new Set();
  const urls = [];

  function add(path, priority) {
    const loc = `${SITE}/${path.replace(/^\//, '')}`;
    if (seen.has(loc)) return;
    seen.add(loc);
    urls.push({ loc, priority });
  }

  add('', '1.0');

  for (const course of courses) {
    add(course.code, '0.9');
  }

  for (const branch of branches) {
    add(branchPath('BE', branch.id, branches), '0.8');
  }

  for (const subject of subjects) {
    if (subject.courseCode !== 'BE') continue;
    add(subjectPath('BE', subject.branchId, subject, branches), '0.7');
  }

  const body = urls.map(({ loc, priority }) => `  <url>
    <loc>${loc}</loc>
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

if (require.main === module) {
  const base = path.join(__dirname, '..');
  const catalog = JSON.parse(fs.readFileSync(path.join(base, 'data/catalog.json'), 'utf8'));
  writeSitemap(catalog, path.join(base, 'sitemap.xml'));
  console.log(`sitemap: ${catalog.subjects.length + catalog.branches.length + catalog.courses.length + 1} urls`);
}

module.exports = { generateSitemap, writeSitemap };
