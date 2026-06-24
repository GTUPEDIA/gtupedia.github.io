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

function normalizeSubjectName(name = '') {
  return name.trim().replace(/\u2013/g, '-').replace(/\s+/g, ' ').toLowerCase();
}

function isSem12Subject(subject) {
  return subject.semester === 1 || subject.semester === 2;
}

function isCommonSem12Subject(subject) {
  return String(subject.branchId) === '0' && isSem12Subject(subject);
}

function commonSubjectCodePriority(code = '') {
  if (/^BE02(?!R)/.test(code)) return 1;
  if (/^BE01(?!R)/.test(code)) return 2;
  if (/^BE02R/.test(code)) return 3;
  if (/^BE01R/.test(code)) return 4;
  if (/^311/.test(code)) return 5;
  if (/^211/.test(code)) return 6;
  return 7;
}

function branchSubjectPriority(subject) {
  const label = subject.semesterLabel || '';
  let priority = 0;
  if (/special/i.test(label)) priority += 20;

  const code = subject.code || '';
  if (/^BE03/.test(code)) priority += 0;
  else if (/^BE02(?!R)/.test(code)) priority += 1;
  else if (/^BE01(?!R)/.test(code)) priority += 2;
  else if (/^BE/.test(code)) priority += 3;
  else if (/^31[3-7]/.test(code)) priority += 10;
  else if (/^21[3-8]/.test(code)) priority += 15;
  else if (/^311/.test(code)) priority += 21;
  else if (/^211/.test(code)) priority += 22;
  else priority += 30;

  return priority;
}

function sem12SubjectPriority(subject) {
  if (isCommonSem12Subject(subject)) return commonSubjectCodePriority(subject.code);
  return 50 + branchSubjectPriority(subject);
}

function mergeAlternates(target, source) {
  if (!target.alternateCodes) target.alternateCodes = [];
  if (!target.alternateIds) target.alternateIds = [];

  const codes = new Set([target.code, ...target.alternateCodes]);
  const ids = new Set([target.id, ...target.alternateIds]);

  for (const value of [source.code, ...(source.alternateCodes || [])]) {
    if (value && value !== target.code && !codes.has(value)) {
      target.alternateCodes.push(value);
      codes.add(value);
    }
  }

  for (const value of [source.id, ...(source.alternateIds || [])]) {
    if (value && value !== target.id && !ids.has(value)) {
      target.alternateIds.push(value);
      ids.add(value);
    }
  }
}

function pickCanonical(existing, subject, priorityFn) {
  if (!existing) return { ...subject, alternateCodes: [], alternateIds: [] };

  const keep = priorityFn(subject) < priorityFn(existing) ? subject : existing;
  const drop = keep === subject ? existing : subject;
  const canonical = {
    ...keep,
    alternateCodes: [...(keep.alternateCodes || [])],
    alternateIds: [...(keep.alternateIds || [])],
  };
  mergeAlternates(canonical, drop);
  return canonical;
}

function absorbInto(map, key, subject, priorityFn) {
  map.set(key, pickCanonical(map.get(key), subject, priorityFn));
}

function sortSubjects(subjects) {
  return subjects.sort((a, b) => {
    if (a.branchId !== b.branchId) return a.branchId.localeCompare(b.branchId, undefined, { numeric: true });
    if (a.semester !== b.semester) return a.semester - b.semester;
    return a.name.localeCompare(b.name);
  });
}

function canonicalizeSubjects(subjects) {
  const sem12 = [];
  const later = [];

  for (const subject of subjects) {
    if (isSem12Subject(subject)) sem12.push(subject);
    else later.push(subject);
  }

  const sem12ByName = new Map();
  for (const subject of sem12) {
    absorbInto(sem12ByName, normalizeSubjectName(subject.name), subject, sem12SubjectPriority);
  }

  const sem12Canonical = [...sem12ByName.values()].map((subject) => {
    const canonical = { ...subject };
    canonical.branchId = '0';
    if (!/^1\s*\/?\s*2/i.test(canonical.semesterLabel || '')) {
      canonical.semesterLabel = '1 /2';
    }
    return canonical;
  });

  const laterByKey = new Map();
  for (const subject of later) {
    const key = `${subject.branchId}|${subject.semester}|${normalizeSubjectName(subject.name)}`;
    absorbInto(laterByKey, key, subject, branchSubjectPriority);
  }

  return sortSubjects([...sem12Canonical, ...laterByKey.values()]);
}

function slugify(text = '') {
  return text
    .toLowerCase()
    .replace(/\u2013/g, '-')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function assignSubjectSlugs(subjects) {
  const used = new Map();

  return subjects.map((subject) => {
    let slug = slugify(subject.name);
    let key = `${subject.branchId}|${slug}`;

    if (used.has(key)) {
      slug = `${slug}-sem-${subject.semester}`;
      key = `${subject.branchId}|${slug}`;
    }
    if (used.has(key)) {
      slug = `${slug}-${subject.code.toLowerCase()}`;
      key = `${subject.branchId}|${slug}`;
    }

    used.set(key, subject.id);
    return { ...subject, slug };
  });
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

  return assignSubjectSlugs(canonicalizeSubjects([...subjects.values()]));
}

if (require.main === module) {
  const base = path.join(__dirname, '..');
  const csvPath = path.join(base, 'details-raw/BE.csv');
  const outPath = path.join(base, 'details-raw/BE-subjects.json');
  const rawCount = parseCsv(fs.readFileSync(csvPath, 'utf8')).length - 1;
  const subjects = parseBeSubjects(csvPath);
  fs.writeFileSync(outPath, `${JSON.stringify(subjects, null, 2)}\n`);
  console.log(`csv rows: ${rawCount}`);
  console.log(`subjects: ${subjects.length}`);
  console.log(`written: ${outPath}`);
}

module.exports = {
  parseBeSubjects,
  parseCsv,
  normalizeBranchId,
  parseSemesters,
  subjectKey,
  semesterLabelSlug,
  canonicalizeSubjects,
  normalizeSubjectName,
  slugify,
  assignSubjectSlugs,
};
