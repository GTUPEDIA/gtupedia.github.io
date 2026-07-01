const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node import-cev-resources.js <path-to-old-index.html>');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

const topicBySection = {
  android: 'android',
  webdev: 'web-dev',
  machinelearning: 'machine-learning',
  competitive: 'competitive',
  stocks: 'finance',
  astrophysics: 'programming',
  blockchain: 'programming',
  embeddedsystems: 'programming',
  ethicalhacking: 'programming',
  nuclearfusion: 'programming',
  robotics: 'programming',
  rocketscience: 'programming',
};

const tabCategory = {
  doc: 'documentation',
  home: 'courses',
  menu1: 'articles',
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 55) || 'resource';
}

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferTopics(text, url, sectionTopic) {
  const topics = new Set();
  if (sectionTopic) topics.add(sectionTopic);
  const hay = `${text} ${url}`.toLowerCase();
  if (/android|kotlin/.test(hay)) topics.add('android');
  if (/web|html|css|javascript|react|node|bootstrap|flask|django|php/.test(hay)) topics.add('web-dev');
  if (/machine learning|deep learning|tensorflow|pytorch|ml |neural/.test(hay)) topics.add('machine-learning');
  if (/competitive|codeforces|leetcode|spoj|hackerrank|atcoder|icpc|topcoder/.test(hay)) topics.add('competitive');
  if (/finance|stock|invest|trading|economics|zerodha/.test(hay)) topics.add('finance');
  if (/gtu|gujarat technological/.test(hay)) topics.add('gtu');
  if (/python|c\+\+|algorithm|programming|cs50|mit|course|java/.test(hay)) topics.add('programming');
  return [...topics];
}

function inferType(category, url) {
  if (category === 'courses') return 'course';
  if (category === 'documentation') return 'doc';
  if (/youtube|youtu\.be|watch\?v=/.test(url)) return 'video';
  if (/classroom\.udacity|edx\.org|coursera|ocw\.mit|freecodecamp/.test(url)) return 'course';
  if (category === 'articles') return 'article';
  return 'article';
}

function inferSource(url, text) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const map = {
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'edx.org': 'edX',
      'courses.edx.org': 'edX',
      'ocw.mit.edu': 'MIT OCW',
      'developer.android.com': 'Android Developers',
      'docs.python.org': 'Python',
      'getbootstrap.com': 'Bootstrap',
      'flask.pocoo.org': 'Flask',
      'cplusplus.com': 'cplusplus.com',
      'freecodecamp.org': 'freeCodeCamp',
      'coursera.org': 'Coursera',
      'classroom.udacity.com': 'Udacity',
      'khanacademy.org': 'Khan Academy',
      'gtu.ac.in': 'GTU',
      'geeksforgeeks.org': 'GeeksforGeeks',
      'leetcode.com': 'LeetCode',
      'codeforces.com': 'Codeforces',
      'atlassian.com': 'Atlassian',
      'w3schools.com': 'W3Schools',
      'developer.mozilla.org': 'MDN',
    };
    if (map[host]) return map[host];
    if (/harvard/i.test(text)) return 'Harvard';
    if (/microsoft/i.test(text)) return 'Microsoft';
    if (/stanford/i.test(text)) return 'Stanford';
    if (/udacity/i.test(text)) return 'Udacity';
    return host;
  } catch {
    return '';
  }
}

function makeId(title, url) {
  return `${slugify(title)}-${crypto.createHash('md5').update(url).digest('hex').slice(0, 6)}`;
}

function addItem(items, seen, raw) {
  const url = raw.url.trim();
  if (!url.startsWith('http') || url === '#') return;
  const key = url.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);

  const title = raw.title.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  if (!title || title.length < 3) return;

  items.push({
    id: makeId(title, url),
    title: title.length > 140 ? `${title.slice(0, 137)}...` : title,
    url,
    type: inferType(raw.category, url),
    category: raw.category,
    topics: inferTopics(title, url, raw.sectionTopic),
    description: raw.description || '',
    source: inferSource(url, title),
    recommended: Boolean(raw.recommended),
    tags: raw.recommended ? ['recommended'] : [],
  });
}

function parseListGroups(htmlText) {
  const results = [];
  const tabRe = /<div id="(doc|home|menu1)" class="tab-pane[^"]*">([\s\S]*?)<\/div>\s*(?=<div id=|<\/div>\s*<hr)/g;
  let tabMatch;
  while ((tabMatch = tabRe.exec(htmlText)) !== null) {
    const category = tabCategory[tabMatch[1]];
    const block = tabMatch[2];
    const itemRe = /<li class="list-group-item">([\s\S]*?)<\/li>/g;
    let itemMatch;
    while ((itemMatch = itemRe.exec(block)) !== null) {
      const row = itemMatch[1];
      const text = stripHtml(row);
      const recommended = /\*\*/.test(row) || /recommended/i.test(row);
      const links = [...row.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
      if (!links.length) continue;

      if (links.length === 1) {
        results.push({
          url: links[0][1],
          title: stripHtml(links[0][2]) || text,
          category,
          recommended,
        });
        continue;
      }

      const baseTitle = text.split('[')[0].trim() || text;
      links.forEach(link => {
        const part = stripHtml(link[2]);
        let title = baseTitle;
        if (part && !/^\[(Introductory|Intermediate|Advanced)/i.test(part)) {
          title = `${baseTitle} — ${part.replace(/^\[|\]$/g, '')}`;
        } else if (/youtube/i.test(part)) {
          title = `${baseTitle} (YouTube)`;
        } else if (/website/i.test(part)) {
          title = `${baseTitle} (Course site)`;
        } else if (/introductory/i.test(part)) {
          title = `${baseTitle} — Introductory`;
        } else if (/intermediate/i.test(part)) {
          title = `${baseTitle} — Intermediate`;
        } else if (/advanced/i.test(part)) {
          title = `${baseTitle} — Advanced`;
        }
        results.push({ url: link[1], title, category, recommended });
      });
    }
  }
  return results;
}

function parseTableSections(htmlText) {
  const results = [];
  const sectionRe = /<h2 id="([^"]+)">[\s\S]*?<\/h2>([\s\S]*?)(?=<h2 id=|<footer|$)/gi;
  let sectionMatch;
  while ((sectionMatch = sectionRe.exec(htmlText)) !== null) {
    const sectionId = sectionMatch[1];
    const sectionTopic = topicBySection[sectionId] || null;
    const block = sectionMatch[2];
    const rowRe = /<tr>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRe.exec(block)) !== null) {
      const row = rowMatch[1];
      if (!/href="https?:\/\//i.test(row)) continue;
      const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => m[1]);
      if (!cells.length) continue;

      const topic = stripHtml(cells[0] || '');
      const resourceCell = cells[1] || cells[0] || '';
      const remarks = stripHtml(cells[2] || '');
      const author = stripHtml(cells[3] || '');
      const recommended = /\*\*/.test(row) || /highly recommended|recommended/i.test(`${remarks} ${row}`);

      const links = [...resourceCell.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
      if (!links.length) continue;

      links.forEach(link => {
        const linkLabel = stripHtml(link[2]);
        let title = linkLabel && linkLabel !== 'Course Link' && linkLabel !== 'Link'
          ? linkLabel
          : topic;
        if (topic && title !== topic && !title.toLowerCase().includes(topic.toLowerCase().slice(0, 12))) {
          title = `${topic} — ${title}`;
        }
        if (author && !title.includes(author)) {
          title = `${title} (${author})`;
        }

        let category = 'courses';
        if (/documentation|reference|docs\./i.test(link[1] + title)) category = 'documentation';
        else if (/article|blog|medium\.com|towardsdatascience/i.test(link[1])) category = 'articles';
        else if (/tool|playground|compiler|leetcode|codeforces|hackerrank/i.test(link[1] + title)) category = 'tools';

        results.push({
          url: link[1],
          title,
          category,
          description: remarks || '',
          sectionTopic,
          recommended,
        });
      });
    }
  }
  return results;
}

const seen = new Set();
const items = [];

for (const raw of [...parseListGroups(html), ...parseTableSections(html)]) {
  addItem(items, seen, raw);
}

const gtuItems = [
  {
    id: 'gtu-official-portal',
    title: 'GTU — Official website',
    url: 'https://gtu.ac.in/',
    type: 'doc',
    category: 'exam-prep',
    topics: ['gtu'],
    description: 'Results, syllabus, exam circulars, and official downloads.',
    source: 'GTU',
    recommended: true,
    tags: ['official'],
  },
  {
    id: 'gtu-student-portal',
    title: 'GTU Student Portal (SAMARTH)',
    url: 'https://student.gtu.ac.in/',
    type: 'tool',
    category: 'tools',
    topics: ['gtu'],
    description: 'Enrollment, exam forms, and student services.',
    source: 'GTU',
    recommended: true,
    tags: ['official'],
  },
  {
    id: 'gtu-exam-papers',
    title: 'GTU question paper uploads',
    url: 'https://gtu.ac.in/Examination/Question-Papers',
    type: 'doc',
    category: 'exam-prep',
    topics: ['gtu'],
    description: 'Official archive of GTU exam papers (also linked from GTUPEDIA subject pages).',
    source: 'GTU',
    recommended: true,
    tags: ['papers', 'official'],
  },
  {
    id: 'gtupedia-home',
    title: 'GTUPEDIA — Papers & syllabus',
    url: 'https://gtupedia.github.io/',
    type: 'tool',
    category: 'exam-prep',
    topics: ['gtu'],
    description: 'Browse GTU courses, branches, subjects, and exam paper links by semester.',
    source: 'GTUPEDIA',
    recommended: true,
    tags: ['papers'],
  },
];

const extraItems = [
  {
    id: 'freecodecamp',
    title: 'freeCodeCamp — Full curriculum',
    url: 'https://www.freecodecamp.org/learn/',
    type: 'course',
    category: 'courses',
    topics: ['programming', 'web-dev'],
    description: 'Free certifications in responsive web design, JavaScript, Python, and more.',
    source: 'freeCodeCamp',
    recommended: true,
    tags: ['free', 'certification'],
  },
  {
    id: 'mdn-web-docs',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/',
    type: 'doc',
    category: 'documentation',
    topics: ['web-dev', 'programming'],
    description: 'Reference for HTML, CSS, JavaScript, and web APIs.',
    source: 'Mozilla',
    recommended: true,
    tags: ['reference'],
  },
  {
    id: 'leetcode',
    title: 'LeetCode',
    url: 'https://leetcode.com/',
    type: 'tool',
    category: 'tools',
    topics: ['competitive', 'programming'],
    description: 'Practice coding interview and DSA problems with difficulty tags.',
    source: 'LeetCode',
    recommended: true,
    tags: ['practice'],
  },
  {
    id: 'codeforces',
    title: 'Codeforces',
    url: 'https://codeforces.com/',
    type: 'tool',
    category: 'tools',
    topics: ['competitive', 'programming'],
    description: 'Competitive programming contests and problem archive.',
    source: 'Codeforces',
    recommended: false,
    tags: ['contests'],
  },
  {
    id: 'geeksforgeeks',
    title: 'GeeksforGeeks — DSA & CS topics',
    url: 'https://www.geeksforgeeks.org/',
    type: 'article',
    category: 'exam-prep',
    topics: ['programming', 'competitive'],
    description: 'Short articles on algorithms and CS subjects — handy for GTU exam revision.',
    source: 'GeeksforGeeks',
    recommended: false,
    tags: ['revision'],
  },
];

const merged = [...gtuItems, ...extraItems];
const mergedUrls = new Set(merged.map(i => i.url.toLowerCase()));
for (const item of items) {
  if (!mergedUrls.has(item.url.toLowerCase())) merged.push(item);
}

merged.sort((a, b) => {
  if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
  return a.title.localeCompare(b.title);
});

const libraryPath = path.join(__dirname, '../resources/data/library.json');
const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
library.items = merged;
library.updatedAt = new Date().toISOString().slice(0, 10);

fs.writeFileSync(libraryPath, `${JSON.stringify(library, null, 2)}\n`);
console.log(`Wrote ${library.items.length} resources to ${libraryPath}`);
