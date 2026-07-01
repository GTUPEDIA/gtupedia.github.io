const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || path.join(__dirname, '../details-raw/MBA-subjects-raw.tsv');
const outputPath = process.argv[3] || path.join(__dirname, '../details-raw/MBA.csv');

function escapeCsv(value = '') {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

const lines = fs.readFileSync(inputPath, 'utf8').split(/\r?\n/).filter(line => line.trim());
const rows = [['Semester', 'Branch', 'Subject', 'Subject Name', 'Date', 'Time', 'Old Date', 'Old Time', 'Exam Mode', 'Total QP Marks']];

for (const line of lines) {
  if (/^Semester\t/i.test(line)) continue;
  const cols = line.split('\t');
  if (cols.length < 4) continue;

  const [semester, branch, subject, subjectName, date = '', time = '', ...rest] = cols;
  let examMode = '';
  let marks = '';
  if (rest.length >= 2) {
    examMode = rest.slice(0, -1).join(' ').trim() || rest[rest.length - 2];
    marks = rest[rest.length - 1].trim();
  } else if (rest.length === 1) {
    examMode = rest[0].trim();
  }

  rows.push([
    semester.trim(),
    branch.trim(),
    subject.trim(),
    subjectName.trim().replace(/\s+/g, ' '),
    date.trim(),
    time.trim(),
    '',
    '',
    examMode,
    marks,
  ]);
}

fs.writeFileSync(outputPath, `${rows.map(row => row.map(escapeCsv).join(',')).join('\n')}\n`);
console.log(`Wrote ${rows.length - 1} MBA subject rows to ${outputPath}`);
