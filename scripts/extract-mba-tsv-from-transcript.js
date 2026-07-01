const fs = require('fs');
const path = require('path');

const transcriptPath =
  process.argv[2] ||
  'C:/Users/KYC/.cursor/projects/c-xampp-htdocs-gtupedia-github-io/agent-transcripts/6365ed1c-32a9-42f5-a9eb-1e41385f3386/6365ed1c-32a9-42f5-a9eb-1e41385f3386.jsonl';
const outputPath =
  process.argv[3] || path.join(__dirname, '../details-raw/MBA-subjects-raw.tsv');

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
let text = '';

for (const line of lines) {
  if (line.includes('810001') && line.includes('Accounting for Managers')) {
    const obj = JSON.parse(line);
    text = obj.message.content[0].text;
    break;
  }
}

if (!text) {
  console.error('Could not find MBA timetable data in transcript');
  process.exit(1);
}

const start = text.indexOf('1\t92\t810001');
if (start < 0) {
  console.error('Could not find start marker');
  process.exit(1);
}

const chunk = text.slice(start);
const lastPart = 'Designing Operations and Supply Chain';
const lastIdx = chunk.lastIndexOf(lastPart);
const after = chunk.slice(lastIdx);
const endPos = lastIdx + after.indexOf('\t70') + 3;
const slice = chunk.slice(0, endPos);

const dataLines = slice
  .split('\n')
  .filter((line) => line.trim() && !/^Semester\t/i.test(line));

fs.writeFileSync(outputPath, `${dataLines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${dataLines.length} lines to ${outputPath}`);
