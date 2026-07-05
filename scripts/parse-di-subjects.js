const fs = require('fs');
const {
  parseCsv,
  normalizeBranchId,
  parseSemesters,
  subjectKey,
  semesterLabelSlug,
  assignSubjectSlugs,
  normalizeSubjectName,
  absorbInto,
  sortSubjects,
} = require('./parse-be-subjects');

function formatDiSemesterLabel(raw = '') {
  let value = raw.trim().replace(/\s+/g, ' ');
  value = value.replace(/^(\d+)(?=\S)/, '$1 ');
  const match = value.match(/^(\d+)\s+(.+)$/i);
  if (match) return `Semester ${match[1]} ${match[2].trim()}`;
  if (/^\d+$/.test(value)) return `Semester ${value}`;
  return value;
}

function diSubjectPriority(subject) {
  const code = subject.code || '';
  if (/^DI0[1-8]0/.test(code)) return 0;
  if (/^DI0[1-8]C/.test(code)) return 1;
  if (/^C\d/.test(code)) return 2;
  if (/^43/.test(code)) return 3;
  if (/^33/.test(code)) return 4;
  if (/^103/.test(code)) return 5;
  if (/^13\d/.test(code)) return 6;
  if (/^DA/.test(code)) return 7;
  return 20;
}

function canonicalizeDiSubjects(subjects) {
  const byKey = new Map();
  for (const subject of subjects) {
    const key = `${subject.semesterLabel}|${subject.branchId}|${normalizeSubjectName(subject.name)}`;
    absorbInto(byKey, key, subject, diSubjectPriority);
  }
  return sortSubjects([...byKey.values()]);
}

function parseDiSubjects(csvPath) {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const subjects = new Map();

  for (const row of rows.slice(1)) {
    const [semesterRaw, branchRaw, code, name] = row;
    if (!code || !name) continue;

    const branchId = normalizeBranchId(branchRaw);
    const semesterLabel = formatDiSemesterLabel(semesterRaw);
    const semesters = parseSemesters(semesterRaw);
    if (!semesters.length) continue;

    const id = subjectKey(code, branchId, semesterLabelSlug(semesterLabel));
    if (subjects.has(id)) continue;

    subjects.set(id, {
      id,
      code: code.trim(),
      name: name.trim().replace(/\s+/g, ' '),
      branchId,
      semester: Math.min(...semesters),
      courseCode: 'DI',
      semesterLabel,
    });
  }

  return assignSubjectSlugs(canonicalizeDiSubjects([...subjects.values()]));
}

if (require.main === module) {
  const base = require('path').join(__dirname, '..');
  const csvPath = require('path').join(base, 'details-raw/Diploma.csv');
  const outPath = require('path').join(base, 'details-raw/DI-subjects.json');
  const subjects = parseDiSubjects(csvPath);
  fs.writeFileSync(outPath, `${JSON.stringify(subjects, null, 2)}\n`);
  console.log(`subjects: ${subjects.length}`);
  console.log(`written: ${outPath}`);
}

module.exports = { parseDiSubjects, canonicalizeDiSubjects, diSubjectPriority, formatDiSemesterLabel };
