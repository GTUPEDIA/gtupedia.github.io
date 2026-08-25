/**
 * Build + zip SEO HTML folders for Hostinger upload.
 * Usage: node scripts/package-hostinger-deploy.js
 *
 * Upload the zip to public_html and extract (or upload folders via FTP).
 * Without these folders, sitemap URLs return 404 on Google.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SEO_COURSES = ['BE', 'DI', 'BB', 'BC', 'MB', 'MC', 'BP'];
const EXTRA_PATHS = [
  'sitemap.xml',
  'sitemaps',
  'robots.txt',
  '.htaccess',
  'index.html',
  'assets/site-chrome.js',
  'assets/styles.css',
  'assets/app.js',
];

console.log('Running build-catalog.js…');
execSync('node scripts/build-catalog.js', { cwd: ROOT, stdio: 'inherit' });

const staging = path.join(ROOT, 'hostinger-deploy-staging');
if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

let pageCount = 0;
for (const course of SEO_COURSES) {
  const src = path.join(ROOT, course);
  if (!fs.existsSync(src)) {
    console.warn(`skip missing folder: ${course}/`);
    continue;
  }
  copyDir(src, path.join(staging, course));
  const count = countFiles(path.join(staging, course), 'index.html');
  pageCount += count;
  console.log(`  ${course}/ — ${count} pages`);
}

for (const item of EXTRA_PATHS) {
  const src = path.join(ROOT, item);
  if (!fs.existsSync(src)) continue;
  const dest = path.join(staging, item);
  if (fs.statSync(src).isDirectory()) copyDir(src, dest);
  else fs.copyFileSync(src, dest);
  console.log(`  ${item}`);
}

const zipPath = path.join(ROOT, 'hostinger-seo-pages.zip');
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

let zipOk = false;
const isWindows = process.platform === 'win32';
if (isWindows) {
  try {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -LiteralPath '${staging}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' },
    );
    zipOk = fs.existsSync(zipPath);
  } catch (_) {
    console.warn('Zip failed (common on Windows with 5000+ files). Upload the staging folder via FTP instead.');
  }
} else {
  execSync(`cd "${staging}" && zip -rq "${zipPath}" .`, { stdio: 'inherit' });
  zipOk = fs.existsSync(zipPath);
}

console.log('');
console.log(`Done — ${pageCount} SEO pages staged.`);
if (zipOk) {
  const zipMb = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(1);
  console.log(`Zip: ${zipPath} (${zipMb} MB)`);
} else {
  console.log(`Staging folder: ${staging}`);
  console.log('Upload these folders to public_html via FTP/File Manager:');
  for (const course of SEO_COURSES) {
    if (fs.existsSync(path.join(staging, course))) console.log(`  - ${course}/`);
  }
  console.log('  - sitemap.xml');
  console.log('  - sitemaps/');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function countFiles(dir, name) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) n += countFiles(full, name);
    else if (entry.name === name) n += 1;
  }
  return n;
}
