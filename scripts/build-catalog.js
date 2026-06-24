const fs = require('fs');
const path = require('path');

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

const catalog = {
  courses: catalogCourses,
  branches,
  subjects: [],
  resources: [],
};

fs.writeFileSync(path.join(base, 'data/catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`courses: ${catalogCourses.length}`);
console.log(`BE branches: ${branches.length}`);
