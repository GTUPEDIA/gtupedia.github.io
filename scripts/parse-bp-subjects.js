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

function bpSubjectPriority(subject) {
  const code = subject.code || '';
  if (/^BP/.test(code)) return 0;
  if (/^22/.test(code)) return 10;
  if (/^22[5-8]/.test(code)) return 11;
  return 20;
}

function canonicalizeBpSubjects(subjects) {
  const byKey = new Map();
  for (const subject of subjects) {
    const key = `${subject.branchId}|${subject.semester}|${normalizeSubjectName(subject.name)}`;
    absorbInto(byKey, key, subject, bpSubjectPriority);
  }
  return sortSubjects([...byKey.values()]);
}

function parseBpSubjects(csvPath) {
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
      courseCode: 'BP',
      semesterLabel,
    });
  }

  return assignSubjectSlugs(canonicalizeBpSubjects([...subjects.values()]));
}

if (require.main === module) {
  const base = require('path').join(__dirname, '..');
  const csvPath = require('path').join(base, 'details-raw/Pharmacy.csv');
  const outPath = require('path').join(base, 'details-raw/BP-subjects.json');
  const subjects = parseBpSubjects(csvPath);
  fs.writeFileSync(outPath, `${JSON.stringify(subjects, null, 2)}\n`);
  console.log(`subjects: ${subjects.length}`);
  console.log(`written: ${outPath}`);
}

module.exports = { parseBpSubjects, canonicalizeBpSubjects, bpSubjectPriority };
