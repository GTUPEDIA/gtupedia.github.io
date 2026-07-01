#!/usr/bin/env node
/**
 * Check resource URLs in resources/data/library.json.
 *
 * Usage:
 *   node scripts/check-resource-urls.js              # report only (default)
 *   node scripts/check-resource-urls.js --remove     # remove dead links + update files
 *   node scripts/check-resource-urls.js --limit 50   # test on first N items
 *   node scripts/check-resource-urls.js --concurrency 6
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const LIBRARY_PATH = path.join(ROOT, 'resources/data/library.json');
const CURRICULUM_PATH = path.join(ROOT, 'resources/data/blockchain-curriculum.txt');
const REMOVED_PATH = path.join(ROOT, 'resources/data/url-check-removed.json');
const REPORT_PATH = path.join(ROOT, 'resources/data/url-check-report.json');

const USER_AGENT = 'GTUPEDIA-LinkChecker/1.0 (+https://gtupedia.github.io/resources/)';
const REQUEST_TIMEOUT_MS = 20000;
const MAX_REDIRECTS = 6;

const DEAD_STATUSES = new Set([404, 410, 451]);
const BLOCKED_STATUSES = new Set([401, 403]);
const UNSTABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504, 521, 522, 523, 524]);

function parseArgs(argv) {
  const args = {
    remove: false,
    limit: 0,
    concurrency: 8,
    verbose: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--remove') args.remove = true;
    else if (arg === '--verbose' || arg === '-v') args.verbose = true;
    else if (arg === '--limit') {
      args.limit = Number(argv[i + 1]) || 0;
      i += 1;
    } else if (arg === '--concurrency') {
      args.concurrency = Math.max(1, Number(argv[i + 1]) || 8);
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/check-resource-urls.js [--remove] [--limit N] [--concurrency N]`);
      process.exit(0);
    }
  }
  return args;
}

function normalizeUrl(url = '') {
  return String(url)
    .trim()
    .replace(/\/+$/, '')
    .toLowerCase()
    .replace(/^http:\/\//, 'https://');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: '*/*',
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function classifyStatus(status) {
  if (status >= 200 && status < 400) return 'ok';
  if (DEAD_STATUSES.has(status)) return 'dead';
  if (BLOCKED_STATUSES.has(status)) return 'blocked';
  if (UNSTABLE_STATUSES.has(status)) return 'unstable';
  if (status >= 400) return 'dead';
  return 'unknown';
}

async function followRedirects(url, method) {
  let current = url;
  let hops = 0;
  let lastStatus = 0;
  let lastError = '';

  while (hops <= MAX_REDIRECTS) {
    try {
      const response = await fetchWithTimeout(current, { method });
      lastStatus = response.status;

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          return { verdict: 'dead', status: response.status, detail: 'Redirect without Location header' };
        }
        current = new URL(location, current).href;
        hops += 1;
        continue;
      }

      const verdict = classifyStatus(response.status);
      return {
        verdict,
        status: response.status,
        detail: `${method} ${response.status}`,
        finalUrl: current,
      };
    } catch (error) {
      lastError = error.name === 'AbortError' ? 'Timeout' : error.message;
      return { verdict: 'dead', status: lastStatus, detail: lastError };
    }
  }

  return { verdict: 'unstable', status: lastStatus, detail: 'Too many redirects' };
}

async function checkUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    return { verdict: 'dead', status: 0, detail: 'Invalid URL scheme' };
  }

  const attempts = [url];
  if (url.startsWith('http://')) {
    attempts.push(url.replace(/^http:\/\//i, 'https://'));
  }

  for (const candidate of attempts) {
    const head = await followRedirects(candidate, 'HEAD');
    if (head.verdict === 'ok') return { ...head, checkedUrl: candidate };
    if (head.verdict === 'blocked' || head.verdict === 'unstable') {
      const get = await followRedirects(candidate, 'GET');
      if (get.verdict !== 'dead') return { ...get, checkedUrl: candidate };
    }
    if (head.status === 405 || head.status === 501) {
      const get = await followRedirects(candidate, 'GET');
      if (get.verdict === 'ok' || get.verdict === 'blocked' || get.verdict === 'unstable') {
        return { ...get, checkedUrl: candidate };
      }
    }
    if (head.verdict !== 'dead') return { ...head, checkedUrl: candidate };

    const get = await followRedirects(candidate, 'GET');
    if (get.verdict !== 'dead') return { ...get, checkedUrl: candidate };
  }

  return { verdict: 'dead', status: 0, detail: 'Unreachable over HTTP and HTTPS' };
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
  return results;
}

function loadRemovedBlocklist() {
  if (!fs.existsSync(REMOVED_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(REMOVED_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function saveRemovedBlocklist(entries) {
  fs.writeFileSync(REMOVED_PATH, `${JSON.stringify(entries, null, 2)}\n`);
}

function removeFromCurriculum(urlsToRemove) {
  if (!fs.existsSync(CURRICULUM_PATH) || !urlsToRemove.size) return 0;

  const blocked = urlsToRemove;
  const lines = fs.readFileSync(CURRICULUM_PATH, 'utf8').split(/\r?\n/);
  let removed = 0;

  const kept = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return true;
    if (!trimmed.includes('|')) return true;
    const urlPart = trimmed.split('|')[1]?.trim();
    if (!urlPart) return true;
    const key = normalizeUrl(urlPart.startsWith('http') ? urlPart : `https://${urlPart}`);
    if (blocked.has(key)) {
      removed += 1;
      return false;
    }
    return true;
  });

  if (removed > 0) {
    fs.writeFileSync(CURRICULUM_PATH, `${kept.join('\n').replace(/\n*$/, '\n')}`);
  }
  return removed;
}

async function main() {
  const args = parseArgs(process.argv);
  const library = JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf8'));
  const items = args.limit > 0 ? library.items.slice(0, args.limit) : library.items;

  console.log(`Checking ${items.length} resource URL(s)…`);
  console.log(`Mode: ${args.remove ? 'REMOVE dead links' : 'report only (pass --remove to delete)'}`);
  console.log('');

  let checked = 0;
  const results = await mapPool(items, args.concurrency, async (item) => {
    const result = await checkUrl(item.url);
    checked += 1;
    if (args.verbose || result.verdict !== 'ok') {
      const mark = result.verdict === 'ok' ? 'OK' : result.verdict.toUpperCase();
      console.log(`[${mark}] ${item.title}`);
      console.log(`       ${item.url}`);
      if (result.detail) console.log(`       → ${result.detail}`);
    } else if (checked % 25 === 0) {
      process.stdout.write(`  … ${checked}/${items.length}\r`);
    }
    return { item, ...result };
  });

  console.log(`\nDone checking ${results.length} URL(s).\n`);

  const ok = results.filter(row => row.verdict === 'ok');
  const blocked = results.filter(row => row.verdict === 'blocked');
  const unstable = results.filter(row => row.verdict === 'unstable');
  const dead = results.filter(row => row.verdict === 'dead');

  console.log('Summary');
  console.log(`  OK:       ${ok.length}`);
  console.log(`  Blocked:  ${blocked.length} (kept — may work in a browser)`);
  console.log(`  Unstable: ${unstable.length} (kept — server errors/timeouts)`);
  console.log(`  Dead:     ${dead.length}`);

  const report = {
    checkedAt: new Date().toISOString(),
    total: results.length,
    ok: ok.length,
    blocked: blocked.length,
    unstable: unstable.length,
    dead: dead.length,
    deadItems: dead.map(row => ({
      id: row.item.id,
      title: row.item.title,
      url: row.item.url,
      detail: row.detail,
      status: row.status,
    })),
    blockedItems: blocked.map(row => ({
      id: row.item.id,
      title: row.item.title,
      url: row.item.url,
      detail: row.detail,
      status: row.status,
    })),
    unstableItems: unstable.map(row => ({
      id: row.item.id,
      title: row.item.title,
      url: row.item.url,
      detail: row.detail,
      status: row.status,
    })),
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nReport saved: ${path.relative(ROOT, REPORT_PATH)}`);

  if (!args.remove) {
    if (dead.length) {
      console.log('\nRun with --remove to delete dead links from library.json.');
    }
    return;
  }

  if (!dead.length) {
    console.log('\nNothing to remove.');
    return;
  }

  const deadIds = new Set(dead.map(row => row.item.id));
  const deadUrls = new Set(dead.map(row => normalizeUrl(row.item.url)));

  library.items = library.items.filter(item => !deadIds.has(item.id));
  library.updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(LIBRARY_PATH, `${JSON.stringify(library, null, 2)}\n`);

  const blocklist = loadRemovedBlocklist();
  const seen = new Set(blocklist.map(entry => normalizeUrl(entry.url)));
  const merged = [...blocklist];
  for (const row of dead) {
    const key = normalizeUrl(row.item.url);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      removedAt: new Date().toISOString(),
      id: row.item.id,
      title: row.item.title,
      url: row.item.url,
      detail: row.detail,
      status: row.status,
    });
  }
  saveRemovedBlocklist(merged);

  const curriculumRemoved = removeFromCurriculum(deadUrls);

  console.log(`\nRemoved ${dead.length} dead resource(s) from library.json`);
  console.log(`Blocklist updated: ${path.relative(ROOT, REMOVED_PATH)} (${merged.length} total)`);
  if (curriculumRemoved) {
    console.log(`Removed ${curriculumRemoved} line(s) from blockchain-curriculum.txt`);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { checkUrl, normalizeUrl, classifyStatus };
