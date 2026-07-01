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

function mcSubjectPriority(subject) {
  const code = subject.code || '';
  if (/^MC03/.test(code)) return 0;
  if (/^MC02/.test(code)) return 1;
  if (/^MC01/.test(code)) return 2;
  if (/^MC0/.test(code)) return 3;
  if (/^6[2349]/.test(code)) return 10;
  if (/^4/.test(code)) return 14;
  if (/^3/.test(code)) return 15;
  if (/^2/.test(code)) return 16;
  return 20;
}

function canonicalizeMcSubjects(subjects) {
  const byKey = new Map();
  for (const subject of subjects) {
    const key = `${subject.branchId}|${subject.semester}|${normalizeSubjectName(subject.name)}`;
    absorbInto(byKey, key, subject, mcSubjectPriority);
  }
  return sortSubjects([...byKey.values()]);
}

function parseMcSubjects(csvPath) {
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
      courseCode: 'MC',
      semesterLabel,
    });
  }

  return assignSubjectSlugs(canonicalizeMcSubjects([...subjects.values()]));
}

if (require.main === module) {
  const base = require('path').join(__dirname, '..');
  const csvPath = require('path').join(base, 'details-raw/MCA.csv');
  const outPath = require('path').join(base, 'details-raw/MC-subjects.json');
  const subjects = parseMcSubjects(csvPath);
  fs.writeFileSync(outPath, `${JSON.stringify(subjects, null, 2)}\n`);
  console.log(`subjects: ${subjects.length}`);
  console.log(`written: ${outPath}`);
}

module.exports = { parseMcSubjects, canonicalizeMcSubjects, mcSubjectPriority };
