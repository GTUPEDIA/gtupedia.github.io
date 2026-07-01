const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const curriculumPath = path.join(__dirname, '../resources/data/blockchain-curriculum.txt');
const libraryPath = path.join(__dirname, '../resources/data/library.json');
const removedPath = path.join(__dirname, '../resources/data/url-check-removed.json');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 55) || 'resource';
}

function normalizeUrl(url) {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  return normalized.replace(/\/+$/, '').toLowerCase();
}

function inferCategory(section, url, title) {
  const hay = `${section} ${url} ${title}`.toLowerCase();
  if (/^## courses|^## white papers/.test(section)) return section.includes('Courses') ? 'courses' : 'articles';
  if (section.includes('Courses')) return 'courses';
  if (section.includes('White papers')) return 'articles';
  if (section.includes('Videos')) return 'courses';
  if (section.includes('Books')) return 'articles';
  if (/youtube|youtu\.be/.test(url)) return 'courses';
  if (/github\.com\/.*\/(bitcoinbook|ethereumbook)/.test(url)) return 'articles';
  if (/coursera|nptel|piazza|academy\.b9lab|courses\.blockgeeks|toc\.cryptotextbook/.test(url)) return 'courses';
  if (/\.pdf$|eprint\.iacr|whitepaper|position_paper|sidechains\.pdf/.test(url)) return 'articles';
  if (/gist\.github|github\.com.*learning|zksnarks_example|blockshell|dvf\/blockchain/.test(url)) return 'code';
  if (/documentation|docs\.|readthedocs|wiki\/wiki|solidity\.readthedocs|truffleframework\.com\/docs|hyperledger\.org|remix\.ethereum|tool\.smartdec|ethgas\.io|cryptopals|praetorian\.com\/challenges/.test(url)) return 'documentation';
  if (/blockchaindemo|coindemo|anders\.com\/blockchain|smartdec|dappinsight|decentradexchange/.test(url)) return 'tools';
  if (/wikipedia\.org|coindesk\.com\/information/.test(url)) return 'documentation';
  if (/tutorial|pet-shop|cryptozombies|toptal\.com\/ethereum|libbitcoin|codesuppository/.test(hay)) return 'courses';
  if (section.includes('Tutorials') || section.includes('Developer guides') || section.includes('Dapps')) return 'courses';
  if (section.includes('GitHub collections')) return 'tools';
  return 'articles';
}

function inferType(category, url) {
  if (/youtube|youtu\.be/.test(url)) return 'video';
  if (/\.pdf$/.test(url)) return 'doc';
  if (category === 'courses') return 'course';
  if (category === 'documentation') return 'doc';
  if (category === 'code') return 'code';
  if (category === 'tools') return 'tool';
  return 'article';
}

function inferSource(url) {
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
    const map = {
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'coursera.org': 'Coursera',
      'github.com': 'GitHub',
      'medium.com': 'Medium',
      'blockchainhub.net': 'BlockchainHub',
      'ethereum.org': 'Ethereum',
      'bitcoin.org': 'Bitcoin',
      'coindesk.com': 'CoinDesk',
      'hbr.org': 'Harvard Business Review',
      'hackernoon.com': 'Hacker Noon',
      'vitalik.ca': 'Vitalik Buterin',
      'a16z.com': 'a16z',
      'consensys.github.io': 'Consensys',
      'cryptozombies.io': 'CryptoZombies',
      'hyperledger.org': 'Hyperledger',
      'onlinecourses.nptel.ac.in': 'NPTEL',
      'piazza.com': 'Princeton',
      'gist.github.com': 'GitHub Gist',
    };
    return map[host] || host;
  } catch {
    return '';
  }
}

function parseCurriculum(text) {
  const lines = text.split(/\r?\n/);
  let section = 'Blockchain';
  const items = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('# ')) continue;
    if (trimmed.startsWith('## ')) {
      section = trimmed.slice(3).trim();
      continue;
    }
    if (!trimmed.includes('|')) continue;

    const parts = trimmed.split('|').map(part => part.trim());
    const title = parts[0];
    const url = parts[1];
    const recommended = parts.some(part => /^recommended$/i.test(part));

    if (!title || !url || !url.includes('.')) continue;

    items.push({
      title,
      url: url.startsWith('http') ? url : `https://${url}`,
      section,
      recommended,
      category: inferCategory(section, url, title),
    });
  }

  return items;
}

function makeId(title, url) {
  return `${slugify(title)}-${crypto.createHash('md5').update(url).digest('hex').slice(0, 6)}`;
}

const curriculum = parseCurriculum(fs.readFileSync(curriculumPath, 'utf8'));
const library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));

const blocklist = new Set();
if (fs.existsSync(removedPath)) {
  try {
    JSON.parse(fs.readFileSync(removedPath, 'utf8')).forEach(entry => {
      blocklist.add(normalizeUrl(entry.url));
    });
  } catch {
    // ignore invalid blocklist file
  }
}

if (!library.topics.some(topic => topic.id === 'blockchain')) {
  library.topics.push({
    id: 'blockchain',
    name: 'Blockchain',
    slug: 'blockchain',
  });
}

const seen = new Set(library.items.map(item => normalizeUrl(item.url)));
let added = 0;
let updated = 0;
let skipped = 0;

for (const raw of curriculum) {
  const urlKey = normalizeUrl(raw.url);
  if (blocklist.has(urlKey)) {
    skipped += 1;
    continue;
  }
  const existing = library.items.find(item => normalizeUrl(item.url) === urlKey);

  if (existing) {
    const topics = new Set([...(existing.topics || []), 'blockchain']);
    if (JSON.stringify([...topics].sort()) !== JSON.stringify([...(existing.topics || [])].sort())) {
      existing.topics = [...topics];
      updated += 1;
    }
    if (raw.recommended && !existing.recommended) {
      existing.recommended = true;
      existing.tags = [...new Set([...(existing.tags || []), 'recommended', 'blockchain-curriculum'])];
    }
    continue;
  }

  library.items.push({
    id: makeId(raw.title, raw.url),
    title: raw.title,
    url: raw.url,
    type: inferType(raw.category, raw.url),
    category: raw.category,
    topics: ['blockchain'],
    description: raw.section ? `${raw.section} — curated blockchain deep-dive.` : '',
    source: inferSource(raw.url),
    recommended: raw.recommended,
    tags: ['blockchain-curriculum', ...(raw.recommended ? ['recommended'] : [])],
  });
  seen.add(urlKey);
  added += 1;
}

library.updatedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(libraryPath, `${JSON.stringify(library, null, 2)}\n`);

const blockchainCount = library.items.filter(item => (item.topics || []).includes('blockchain')).length;
console.log(`Parsed ${curriculum.length} curriculum entries`);
console.log(`Added ${added} new, tagged ${updated} existing, skipped ${skipped} blocklisted`);
console.log(`Total blockchain-tagged resources: ${blockchainCount}`);
console.log(`Total library size: ${library.items.length}`);
