const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'data', 'seo.json');
const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const SEO = {
  ...fileConfig,
  siteUrl: (process.env.GTU_SITE_URL || fileConfig.siteUrl || 'https://gtupedia.com').replace(/\/$/, ''),
};

function isFilePath(pathValue = '') {
  const last = String(pathValue).split('/').pop() || '';
  return /\.[a-z0-9]{2,8}$/i.test(last);
}

/** Directory-style catalogue paths use a trailing slash (matches Hostinger/Apache). */
function siteUrl(pathValue = '') {
  const clean = String(pathValue || '').replace(/^\//, '').replace(/\/+$/, '');
  if (!clean) return `${SEO.siteUrl}/`;
  const url = `${SEO.siteUrl}/${clean}`;
  return isFilePath(clean) ? url : `${url}/`;
}

function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO.siteName,
    url: SEO.siteUrl,
    description: SEO.organizationDescription,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Gujarat, India',
    },
  };
}

function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO.siteName,
    url: SEO.siteUrl,
    description: SEO.defaultDescription,
    inLanguage: SEO.language,
    publisher: {
      '@type': 'Organization',
      name: SEO.siteName,
      url: SEO.siteUrl,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SEO.siteUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

function webPageJsonLd({ title, description, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: SEO.siteName,
      url: SEO.siteUrl,
    },
    inLanguage: SEO.language,
  };
}

function learningResourceJsonLd(subject, branchName, url, paperCount) {
  const code = subject.code || subject.id.split('@')[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `${subject.name} GTU Question Papers`,
    description: `GTU ${subject.name} (${code}) exam papers for ${branchName}, semester ${subject.semester}.`,
    url,
    learningResourceType: 'Exam paper',
    educationalLevel: 'Undergraduate',
    inLanguage: SEO.language,
    about: {
      '@type': 'Course',
      name: subject.name,
      courseCode: code,
      provider: {
        '@type': 'CollegeOrUniversity',
        name: 'Gujarat Technological University',
        sameAs: 'https://www.gtu.ac.in/',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: SEO.siteName,
      url: SEO.siteUrl,
    },
    ...(paperCount ? { numberOfItems: paperCount } : {}),
  };
}

function seoTitleCourse(courseName, courseCode) {
  return `${courseName} GTU Question Papers (${courseCode}) — All Branches | ${SEO.siteName}`;
}

function truncateMetaDescription(text, max = 155) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const cut = slice.lastIndexOf(' ');
  const trimmed = (cut > 60 ? slice.slice(0, cut) : slice).trim();
  return `${trimmed}…`;
}

function seoDescriptionCourse(courseName, courseCode, branchCount, subjectCount) {
  return truncateMetaDescription(
    `GTU ${courseName} (${courseCode}) question papers — ${branchCount} branches, ${subjectCount} subjects. Free official Winter & Summer exam PDFs.`,
  );
}

function seoIntroCourse(courseCode, courseName, branchCount) {
  if (courseCode === 'DI') {
    return `Browse GTU ${courseName} question papers by branch and semester. Coverage includes NEW, OLD, and Credit-to-Degree schemes where listed. Pick your branch to open subjects with Winter and Summer paper links.`;
  }
  if (courseCode === 'BE') {
    return `Browse GTU ${courseName} previous year question papers across ${branchCount} branches. Pick your branch, open a semester, and download official exam PDFs by subject code.`;
  }
  return `Browse GTU ${courseName} (${courseCode}) question papers and syllabus links — organised by branch and semester. All paper links point to official GTU PDFs.`;
}

const PAPER_NAV = [
  { code: 'BE', label: 'BE papers' },
  { code: 'DI', label: 'Diploma papers' },
  { code: 'BB', label: 'BBA papers' },
  { code: 'BC', label: 'BCA papers' },
  { code: 'MB', label: 'MBA papers' },
  { code: 'MC', label: 'MCA papers' },
  { code: 'BP', label: 'B.Pharm papers' },
];

function withRoot(root = '/') {
  return root.endsWith('/') ? root : `${root}/`;
}

function chromeHeaderInner(root = '/') {
  const r = withRoot(root);
  return `<div class="brand-group">
        <a class="brand" href="${r}" aria-label="GTUPEDIA home">GTU<span>PEDIA</span></a>
        <span class="beta-badge">Beta</span>
      </div>
      <nav aria-label="Primary navigation">
        <a href="${r}#courses">Courses</a>
      </nav>`;
}

function chromeFooterInner(root = '/') {
  const r = withRoot(root);
  const paperLinks = PAPER_NAV.map(item => `<a href="${r}${item.code}/">${item.label}</a>`).join('\n          ');
  return `<div class="site-footer__inner">
        <div class="site-footer__brand">
          <p class="site-footer__name">
            GTUPEDIA <span class="beta-badge beta-badge--footer">Beta</span>
          </p>
          <p class="site-footer__tagline">For students, by students — GTU exam papers and study resources.</p>
        </div>
        <nav class="site-footer__links" aria-label="Footer">
          <a href="${r}#courses">Courses</a>
          <a href="${r}about/">About</a>
          <a href="${r}privacy/">Privacy</a>
          <a href="${r}guides/download-gtu-papers/">Download papers</a>
          <a href="${r}">Home</a>
        </nav>
      </div>
      <nav class="site-footer__papers" aria-label="GTU question papers">
          ${paperLinks}
      </nav>
      <div data-ad-footer></div>
      <p class="site-footer__disclaimer">
        <strong>Disclaimer:</strong> GTUPEDIA is <em>not</em> the official website of Gujarat Technological University (GTU) and is not affiliated with, endorsed by, or operated by the university. It is an independent initiative run by students and contributors to support practical learning, exam preparation, and exploration. Materials link to official GTU sources where available. See our <a href="${r}privacy/">Privacy Policy</a>.
      </p>
      <p class="site-footer__copy"> Made for supporting students to learn better for 21st Century.</p>`;
}

function homeJsonLdScript() {
  const graph = [organizationJsonLd(), webSiteJsonLd()].map(({ '@context': _c, ...item }) => item);
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

function seoTitleBranch(branchName, courseCode, branchId) {
  return `${branchName} GTU Papers — ${courseCode} Branch ${branchId} Subjects | ${SEO.siteName}`;
}

function seoDescriptionBranch(branchName, courseCode, subjectCount) {
  return truncateMetaDescription(
    `${branchName} GTU ${courseCode} papers — ${subjectCount} subjects with previous year exam PDFs organised by semester.`,
  );
}

function seoTitleSubject(subjectName, code) {
  return `${subjectName} GTU Question Paper PDF (${code}) | ${SEO.siteName}`;
}

function seoDescriptionSubject(subjectName, code, branchName, semester, paperCount) {
  const seasons = paperCount ? `${paperCount} season${paperCount === 1 ? '' : 's'} · ` : '';
  return truncateMetaDescription(
    `GTU ${subjectName} (${code}) question papers — ${branchName}, Sem ${semester}. ${seasons}Free official exam PDF downloads.`,
  );
}

const ADSENSE_CLIENT = 'ca-pub-0350031762895572';

const PAPER_ENABLED_COURSES = new Set(SEO.paperEnabledCourses || ['BE', 'DI', 'BB', 'BC', 'MB', 'MC', 'BP']);

function escapeSeoHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function defaultOgImageUrl() {
  return SEO.defaultOgImage || siteUrl('assets/og-image.jpg');
}

function socialMetaTags({ title, description, url, type = 'website' }) {
  const image = defaultOgImageUrl();
  const safeTitle = escapeSeoHtml(title || SEO.defaultTitle);
  const safeDescription = escapeSeoHtml(description || SEO.defaultDescription);
  const safeUrl = escapeSeoHtml(url || SEO.siteUrl);
  const safeImage = escapeSeoHtml(image);
  const safeKeywords = escapeSeoHtml(SEO.keywords || '');
  return `
    <meta name="keywords" content="${safeKeywords}">
    <meta name="theme-color" content="${escapeSeoHtml(SEO.themeColor || '#24292f')}">
    <meta property="og:type" content="${escapeSeoHtml(type)}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:image:alt" content="${safeTitle}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${safeImage}">
    <meta name="twitter:image:alt" content="${safeTitle}">`.trim();
}

function subjectFaqJsonLd(subject, branchName, code, paperCount, courseLabel) {
  const seasons = paperCount
    ? `${paperCount} GTU exam seasons (Winter & Summer) are linked on this page.`
    : 'Exam papers are added when GTU publishes them on gtu.ac.in.';
  return {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Where can I download ${subject.name} GTU question paper PDF (${code})?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `GTUPEDIA lists official ${subject.name} (${code}) question papers for ${branchName} in ${courseLabel}. ${seasons} Each link opens the PDF hosted on gtu.ac.in.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the subject code for ${subject.name} in GTU ${branchName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The GTU subject code is ${code}. It is listed under ${branchName}, semester ${subject.semester || subject.semesterLabel || '—'}, in the ${courseLabel} programme.`,
        },
      },
    ],
  };
}

function itemListJsonLd(name, items) {
  if (!items?.length) return null;
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

function adsenseHeadScript() {
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}"
     crossorigin="anonymous"></script>`;
}

module.exports = {
  SEO,
  siteUrl,
  organizationJsonLd,
  webSiteJsonLd,
  webPageJsonLd,
  learningResourceJsonLd,
  seoTitleCourse,
  seoDescriptionCourse,
  seoIntroCourse,
  seoTitleBranch,
  PAPER_NAV,
  chromeHeaderInner,
  chromeFooterInner,
  homeJsonLdScript,
  seoDescriptionBranch,
  seoTitleSubject,
  seoDescriptionSubject,
  truncateMetaDescription,
  adsenseHeadScript,
  PAPER_ENABLED_COURSES,
  defaultOgImageUrl,
  socialMetaTags,
  itemListJsonLd,
  subjectFaqJsonLd,
  isFilePath,
  escapeSeoHtml,
};
