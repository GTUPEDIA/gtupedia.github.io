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

function formatSemesterLabel(raw = '') {
  const value = raw.trim();
  if (/^\d+$/.test(value)) return `Semester ${value}`;
  return value;
}

function mbSubjectPriority(subject) {
  const code = subject.code || '';
  if (/^MB04/.test(code)) return 0;
  if (/^MB03/.test(code)) return 1;
  if (/^MB02/.test(code)) return 2;
  if (/^MB01/.test(code)) return 3;
  if (/^MB0/.test(code)) return 4;
  if (/^N2/.test(code)) return 12;
  if (/^2/.test(code)) return 14;
  if (/^1[45]/.test(code)) return 16;
  return 20;
}

function canonicalizeMbSubjects(subjects) {
  const byKey = new Map();
  for (const subject of subjects) {
    const key = `${subject.branchId}|${subject.semester}|${normalizeSubjectName(subject.name)}`;
    absorbInto(byKey, key, subject, mbSubjectPriority);
  }
  return sortSubjects([...byKey.values()]);
}

function parseMbSubjects(csvPath) {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const subjects = new Map();

  for (const row of rows.slice(1)) {
    const [semesterRaw, branchRaw, code, name] = row;
    if (!code || !name) continue;

    const branchId = normalizeBranchId(branchRaw);
    const semesterLabel = formatSemesterLabel(semesterRaw);
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
      courseCode: 'MB',
      semesterLabel,
    });
  }

  return assignSubjectSlugs(canonicalizeMbSubjects([...subjects.values()]));
}

if (require.main === module) {
  const base = require('path').join(__dirname, '..');
  const csvPath = require('path').join(base, 'details-raw/MBA.csv');
  const outPath = require('path').join(base, 'details-raw/MB-subjects.json');
  const subjects = parseMbSubjects(csvPath);
  fs.writeFileSync(outPath, `${JSON.stringify(subjects, null, 2)}\n`);
  console.log(`subjects: ${subjects.length}`);
  console.log(`written: ${outPath}`);
}

module.exports = { parseMbSubjects, canonicalizeMbSubjects, mbSubjectPriority };
