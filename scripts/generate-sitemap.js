const fs = require('fs');
const path = require('path');

const SITE = 'https://gtupedia.github.io';

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

function generateSitemap(catalog) {
  const { courses = [], subjects = [] } = catalog;
  const seen = new Set();
  const urls = [];

  function add(path, priority) {
    const loc = `${SITE}/${path.replace(/^\//, '')}`;
    if (seen.has(loc)) return;
    seen.add(loc);
    urls.push({ loc, priority });
  }

  add('', '1.0');
  add('resources/', '0.8');
  add('team/', '0.7');
  add('campus-ambassador/', '0.7');

  for (const course of courses) {
    add(course.code, '0.9');
    const branches = branchesForCourse(course, catalog);
    for (const branch of branches) {
      add(branchPath(course.code, branch.id, branches), '0.8');
    }
    for (const subject of subjects) {
      if (subject.courseCode !== course.code) continue;
      add(subjectPath(course.code, subject.branchId, subject, branches), '0.7');
    }
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
  console.log(`sitemap: ${generateSitemap(catalog).match(/<loc>/g)?.length || 0} urls`);
}

module.exports = { generateSitemap, writeSitemap, branchesForCourse };
