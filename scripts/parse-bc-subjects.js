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

function bcSubjectPriority(subject) {
  const code = subject.code || '';
  if (/^BC04/.test(code)) return 0;
  if (/^BC03/.test(code)) return 1;
  if (/^BC02/.test(code)) return 2;
  if (/^BC01/.test(code)) return 3;
  return 20;
}

function canonicalizeBcSubjects(subjects) {
  const byKey = new Map();
  for (const subject of subjects) {
    const key = `${subject.branchId}|${subject.semester}|${normalizeSubjectName(subject.name)}`;
    absorbInto(byKey, key, subject, bcSubjectPriority);
  }
  return sortSubjects([...byKey.values()]);
}

function parseBcSubjects(csvPath) {
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
      courseCode: 'BC',
      semesterLabel,
    });
  }

  return assignSubjectSlugs(canonicalizeBcSubjects([...subjects.values()]));
}

if (require.main === module) {
  const base = require('path').join(__dirname, '..');
  const csvPath = require('path').join(base, 'details-raw/BCA.csv');
  const outPath = require('path').join(base, 'details-raw/BC-subjects.json');
  const subjects = parseBcSubjects(csvPath);
  fs.writeFileSync(outPath, `${JSON.stringify(subjects, null, 2)}\n`);
  console.log(`subjects: ${subjects.length}`);
  console.log(`written: ${outPath}`);
}

module.exports = { parseBcSubjects, canonicalizeBcSubjects, bcSubjectPriority };
