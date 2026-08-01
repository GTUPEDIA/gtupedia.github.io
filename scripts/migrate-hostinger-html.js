const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['old', 'node_modules', '.git']);
const COURSE_DIRS = new Set([
  'BA', 'BB', 'BC', 'BN', 'BE', 'EP', 'BH', 'BI', 'BP', 'PP', 'BL', 'BS', 'BV',
  'DA', 'DI', 'DP', 'DV', 'PH', 'IM', 'MR', 'MH', 'MB', 'MA', 'MV', 'MC', 'IC',
  'ME', 'MP', 'ML', 'MN', 'IB', 'CS', 'FD', 'PB', 'PD', 'PI', 'DB', 'DS', 'DM', 'DH', 'PR',
]);

function shouldProcess(relPath) {
  const top = relPath.split(/[/\\]/)[0];
  if (SKIP_DIRS.has(top)) return false;
  if (COURSE_DIRS.has(top)) return false;
  return relPath.endsWith('.html');
}

function migrateHtml(content) {
  let next = content.replace(/https:\/\/gtupedia\.github\.io/g, 'https://gtupedia.com');
  next = next.replace(
    /\s*<script>\s*window\.__GTUPEDIA_BASE = location\.pathname\.startsWith\('\/gtupedia\.github\.io'\) \? '\/gtupedia\.github\.io\/' : '\/';\s*(?:window\.__GTUPEDIA_CATALOG_V = '[^']*';\s*)?<\/script>\s*<base href="([^"]*)">\s*<script>document\.querySelector\('base'\)\.href = window\.__GTUPEDIA_BASE;<\/script>/g,
    '\n    <script>window.__GTUPEDIA_CATALOG_V = \'$CATALOG_V\';</script>\n    <base href="$1">\n    <script src="assets/site-base.js"></script>',
  );
  // Fix catalog placeholder if no catalog v was in block
  next = next.replace(
    /\s*<script>\s*window\.__GTUPEDIA_BASE = location\.pathname\.startsWith\('\/gtupedia\.github\.io'\) \? '\/gtupedia\.github\.io\/' : '\/';\s*<\/script>\s*<base href="([^"]*)">\s*<script>document\.querySelector\('base'\)\.href = window\.__GTUPEDIA_BASE;<\/script>/g,
    '\n    <base href="$1">\n    <script src="assets/site-base.js"></script>',
  );
  next = next.replace(
    /<script>window\.__GTUPEDIA_BASE = location\.pathname\.startsWith\('\/gtupedia\.github\.io'\) \? '\/gtupedia\.github\.io\/' : '\/';\s*window\.__GTUPEDIA_CATALOG_V = '([^']*)';<\/script>\s*<base href="([^"]*)">\s*<script>document\.querySelector\('base'\)\.href = window\.__GTUPEDIA_BASE;<\/script>/g,
    '<script>window.__GTUPEDIA_CATALOG_V = \'$1\';</script>\n    <base href="$2">\n    <script src="assets/site-base.js"></script>',
  );
  next = next.replace(
    /<script>window\.__GTUPEDIA_BASE = location\.pathname\.startsWith\('\/gtupedia\.github\.io'\) \? '\/gtupedia\.github\.io\/' : '\/';\s*<\/script>\s*<base href="([^"]*)">\s*<script>document\.querySelector\('base'\)\.href = window\.__GTUPEDIA_BASE;<\/script>/g,
    '<base href="$1">\n    <script src="assets/site-base.js"></script>',
  );
  next = next.replace("<script>window.__GTUPEDIA_CATALOG_V = '$CATALOG_V';</script>\n    ", '');
  return next;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || COURSE_DIRS.has(entry.name)) continue;
      walk(full, files);
    } else if (shouldProcess(rel)) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = migrateHtml(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    changed += 1;
    console.log('updated', path.relative(ROOT, file));
  }
}
console.log(`done — ${changed} file(s)`);
