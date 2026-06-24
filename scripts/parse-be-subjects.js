const fs = require('fs');
const path = require('path');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function parseSemesters(raw = '') {
  const value = raw.trim();
  if (/^1\s*\/\s*2/i.test(value)) return [1, 2];
  const match = value.match(/^(\d+)/);
  return match ? [Number(match[1])] : [];
}

function normalizeBranchId(raw = '') {
  const value = String(raw).trim();
  if (!value) return value;
  if (value === '0') return '0';
  if (/^\d+$/.test(value)) return value.padStart(2, '0');
  return value.toUpperCase();
}

function semesterLabelSlug(raw = '') {
  return raw.trim().replace(/\s+/g, '_').replace(/[^\w_]/g, '').replace(/_+/g, '_');
}

function subjectKey(code, branchId, semesterLabel) {
  return `${code.trim()}@${branchId}@${semesterLabelSlug(semesterLabel)}`;
}

function parseBeSubjects(csvPath) {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const subjects = new Map();

  for (const row of rows.slice(1)) {
    const [semesterRaw, branchRaw, code, name] = row;
    if (!code || !name) continue;

    const branchId = normalizeBranchId(branchRaw);
    const semesterLabel = semesterRaw.trim();
    const semesters = parseSemesters(semesterLabel);
    if (!semesters.length) continue;

    const id = subjectKey(code, branchId, semesterLabel);
    if (subjects.has(id)) continue;

    subjects.set(id, {
      id,
      code: code.trim(),
      name: name.trim().replace(/\s+/g, ' '),
      branchId,
      semester: Math.min(...semesters),
      courseCode: 'BE',
      semesterLabel,
    });
  }

  return [...subjects.values()].sort((a, b) => {
    if (a.branchId !== b.branchId) return a.branchId.localeCompare(b.branchId, undefined, { numeric: true });
    if (a.semester !== b.semester) return a.semester - b.semester;
    return a.name.localeCompare(b.name);
  });
}

if (require.main === module) {
  const base = path.join(__dirname, '..');
  const csvPath = path.join(base, 'details-raw/BE.csv');
  const outPath = path.join(base, 'details-raw/BE-subjects.json');
  const subjects = parseBeSubjects(csvPath);
  fs.writeFileSync(outPath, `${JSON.stringify(subjects, null, 2)}\n`);
  console.log(`subjects: ${subjects.length}`);
  console.log(`written: ${outPath}`);
}

module.exports = { parseBeSubjects, parseCsv, normalizeBranchId, parseSemesters, subjectKey, semesterLabelSlug };
