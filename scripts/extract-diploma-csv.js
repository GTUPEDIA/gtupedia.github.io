const fs = require('fs');
const path = require('path');

const transcript = path.join(
  'C:/Users/KYC/.cursor/projects/c-xampp-htdocs-gtupedia-github-io/agent-transcripts/6365ed1c-32a9-42f5-a9eb-1e41385f3386/6365ed1c-32a9-42f5-a9eb-1e41385f3386.jsonl',
);
const out = path.join(__dirname, '..', 'details-raw', 'Diploma.csv');

const lines = fs.readFileSync(transcript, 'utf8').split(/\r?\n/);
let data = null;

for (const line of lines) {
  if (!line.includes('DI01000021') && !line.includes('1031NA01')) continue;
  try {
    const obj = JSON.parse(line);
    const text = obj.message?.content?.find((c) => c.type === 'text')?.text || '';
    const marker = 'Semester\tBranch\tSubject';
    const idx = text.indexOf(marker);
    if (idx < 0) continue;
    data = text.slice(idx);
    break;
  } catch {
    // skip malformed lines
  }
}

if (!data) {
  console.error('Schedule data not found in transcript');
  process.exit(1);
}

data = data.replace(/^<timestamp>[\s\S]*?<user_query>\s*/i, '');

const rows = data.split(/\r?\n/).filter(Boolean);
const csvRows = rows.map((line) => {
  const parts = line.split('\t');
  if (parts.length < 4) return null;
  const esc = (s) => {
    const v = s.trim();
    if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  return [esc(parts[0]), esc(parts[1]), esc(parts[2]), esc(parts[3])].join(',');
}).filter(Boolean);

fs.writeFileSync(out, `${csvRows.join('\n')}\n`);
console.log(`rows: ${csvRows.length}`);
console.log(`written: ${out}`);
