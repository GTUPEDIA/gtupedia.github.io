const fs = require('fs');
const path = require('path');
const { parseBeSubjects } = require('./parse-be-subjects');
const { parseBbSubjects } = require('./parse-bb-subjects');
const { parseBcSubjects } = require('./parse-bc-subjects');

const base = path.join(__dirname, '..');
const courses = JSON.parse(fs.readFileSync(path.join(base, 'details-raw/courses.json'), 'utf8'));
const beHtml = fs.readFileSync(path.join(base, 'details-raw/BE.txt'), 'utf8');

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function formatBranchName(name) {
  const normalized = name.replace(/\s*-\s*/g, ' - ').trim();
  return normalized
    .split(/(\s+|\/)/)
    .map((part) => {
      if (!part || /^[\s/]+$/.test(part)) return part;
      if (part.length <= 3 && part === part.toUpperCase()) return part;
      if (part === part.toUpperCase()) return part.charAt(0) + part.slice(1).toLowerCase();
      return part;
    })
    .join('');
}

function branchSlug(name = '') {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function assignBranchSlugs(branchList) {
  const used = new Map();
  return branchList.map((branch) => {
    let slug = branchSlug(branch.name);
    if (used.has(slug)) slug = `${slug}-${branch.id}`;
    used.set(slug, branch.id);
    return { ...branch, slug };
  });
}

const branchRegex = /<option value="([^"]+)">([^<]+)<\/option>/g;
const branches = [];
let match;
while ((match = branchRegex.exec(beHtml)) !== null) {
  const id = match[1];
  if (id === 'Select Branch') continue;
  const label = decodeHtml(match[2].trim());
  const dash = label.indexOf(' - ');
  const name = dash >= 0 ? label.slice(dash + 3).trim() : label;
  branches.push({ id, name: formatBranchName(name) });
}

const branchesWithSlugs = assignBranchSlugs(branches);

const bbBranches = assignBranchSlugs([{ id: '01', name: 'BBA' }]);
const bcBranches = assignBranchSlugs([{ id: '01', name: 'BCA' }]);

const catalogCourses = courses.map((course) => {
  const entry = { code: course.code, name: course.name };
  if (course.code === 'BE') entry.branches = branchesWithSlugs;
  if (course.code === 'BB') entry.branches = bbBranches;
  if (course.code === 'BC') entry.branches = bcBranches;
  return entry;
});

const beSubjects = parseBeSubjects(path.join(base, 'details-raw/BE.csv'));
const bbSubjects = parseBbSubjects(path.join(base, 'details-raw/BBA.csv'));
const bcSubjects = parseBcSubjects(path.join(base, 'details-raw/BCA.csv'));
const subjects = [...beSubjects, ...bbSubjects, ...bcSubjects];
fs.writeFileSync(
  path.join(base, 'details-raw/BE-subjects.json'),
  `${JSON.stringify(beSubjects, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(base, 'details-raw/BB-subjects.json'),
  `${JSON.stringify(bbSubjects, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(base, 'details-raw/BC-subjects.json'),
  `${JSON.stringify(bcSubjects, null, 2)}\n`,
);

function loadExamPapers(fileName, exam, baseUrl, courseCode = 'BE') {
  const text = fs.readFileSync(path.join(base, `details-raw/${fileName}`), 'utf8');
  const codes = [...new Set(
    text
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/\s+\.pdf$/i, '.pdf').replace(/\.pdf$/i, ''))
      .filter(Boolean),
  )].sort();
  return { exam, baseUrl, courseCode, codes };
}

const winter2025Papers = loadExamPapers('winter-2025-papers.txt', 'Winter 2025', 'https://gtu.ac.in/uploads/W2025/BE');
const winter2025BbPapers = loadExamPapers('winter-2025-bb-papers.txt', 'Winter 2025', 'https://gtu.ac.in/uploads/W2025/BB', 'BB');
const summer2025Papers = loadExamPapers('summer-2025-papers.txt', 'Summer 2025', 'https://gtu.ac.in/uploads/S2025/BE');
const winter2024Papers = loadExamPapers('winter-2024-papers.txt', 'Winter 2024', 'https://gtu.ac.in/uploads/W2024/BE');
const summer2024Papers = loadExamPapers('summer-2024-papers.txt', 'Summer 2024', 'https://gtu.ac.in/uploads/S2024/BE');
const winter2023Papers = loadExamPapers('winter-2023-papers.txt', 'Winter 2023', 'https://gtu.ac.in/uploads/W2023/BE');
const summer2023Papers = loadExamPapers('summer-2023-papers.txt', 'Summer 2023', 'https://gtu.ac.in/uploads/S2023/BE');
const examPapers = [
  winter2025Papers,
  winter2025BbPapers,
  summer2025Papers,
  winter2024Papers,
  summer2024Papers,
  winter2023Papers,
  summer2023Papers,
];

fs.writeFileSync(
  path.join(base, 'details-raw/winter-2025-papers.json'),
  `${JSON.stringify(winter2025Papers, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(base, 'details-raw/winter-2025-bb-papers.json'),
  `${JSON.stringify(winter2025BbPapers, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(base, 'details-raw/summer-2025-papers.json'),
  `${JSON.stringify(summer2025Papers, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(base, 'details-raw/winter-2024-papers.json'),
  `${JSON.stringify(winter2024Papers, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(base, 'details-raw/summer-2024-papers.json'),
  `${JSON.stringify(summer2024Papers, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(base, 'details-raw/winter-2023-papers.json'),
  `${JSON.stringify(winter2023Papers, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(base, 'details-raw/summer-2023-papers.json'),
  `${JSON.stringify(summer2023Papers, null, 2)}\n`,
);

const catalog = {
  courses: catalogCourses,
  branches: branchesWithSlugs,
  subjects,
  resources: [],
  examPapers,
  winter2025Papers,
  winter2025BbPapers,
  summer2025Papers,
  winter2024Papers,
  summer2024Papers,
  winter2023Papers,
  summer2023Papers,
};

fs.writeFileSync(path.join(base, 'data/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
const { writeSitemap, generateSitemap } = require('./generate-sitemap');
writeSitemap(catalog, path.join(base, 'sitemap.xml'));
const sitemapUrlCount = (generateSitemap(catalog).match(/<loc>/g) || []).length;
console.log(`courses: ${catalogCourses.length}`);
console.log(`BE branches: ${branchesWithSlugs.length}`);
console.log(`BB branches: ${bbBranches.length}`);
console.log(`BC branches: ${bcBranches.length}`);
console.log(`BE subjects: ${beSubjects.length}`);
console.log(`BB subjects: ${bbSubjects.length}`);
console.log(`BC subjects: ${bcSubjects.length}`);
console.log(`total subjects: ${subjects.length}`);
console.log(`Winter 2025 BE papers: ${winter2025Papers.codes.length}`);
console.log(`Winter 2025 BB papers: ${winter2025BbPapers.codes.length}`);
console.log(`Summer 2025 papers: ${summer2025Papers.codes.length}`);
console.log(`Winter 2024 papers: ${winter2024Papers.codes.length}`);
console.log(`Summer 2024 papers: ${summer2024Papers.codes.length}`);
console.log(`Winter 2023 papers: ${winter2023Papers.codes.length}`);
console.log(`Summer 2023 papers: ${summer2023Papers.codes.length}`);
console.log(`sitemap urls: ${sitemapUrlCount}`);
