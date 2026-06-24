const fs = require('fs');
const path = require('path');
const { parseBeSubjects } = require('./parse-be-subjects');

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

const catalogCourses = courses.map((course) => {
  const entry = { code: course.code, name: course.name };
  if (course.code === 'BE') entry.branches = branches;
  return entry;
});

const subjects = parseBeSubjects(path.join(base, 'details-raw/BE.csv'));
fs.writeFileSync(
  path.join(base, 'details-raw/BE-subjects.json'),
  `${JSON.stringify(subjects, null, 2)}\n`,
);

function loadWinter2025Papers() {
  const text = fs.readFileSync(path.join(base, 'details-raw/winter-2025-papers.txt'), 'utf8');
  const codes = [...new Set(
    text
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/\s+\.pdf$/i, '.pdf').replace(/\.pdf$/i, ''))
      .filter(Boolean),
  )].sort();
  return {
    exam: 'Winter 2025',
    baseUrl: 'https://gtu.ac.in/uploads/W2025/BE',
    codes,
  };
}

const winter2025Papers = loadWinter2025Papers();
fs.writeFileSync(
  path.join(base, 'details-raw/winter-2025-papers.json'),
  `${JSON.stringify(winter2025Papers, null, 2)}\n`,
);

const catalog = {
  courses: catalogCourses,
  branches,
  subjects,
  resources: [],
  winter2025Papers,
};

fs.writeFileSync(path.join(base, 'data/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`courses: ${catalogCourses.length}`);
console.log(`BE branches: ${branches.length}`);
console.log(`BE subjects: ${subjects.length}`);
console.log(`Winter 2025 papers: ${winter2025Papers.codes.length}`);
