const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'data', 'seo.json');
const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const SEO = {
  ...fileConfig,
  siteUrl: (process.env.GTU_SITE_URL || fileConfig.siteUrl || 'https://gtupedia.github.io').replace(/\/$/, ''),
};

function siteUrl(pathValue = '') {
  const clean = String(pathValue || '').replace(/^\//, '');
  return clean ? `${SEO.siteUrl}/${clean}` : `${SEO.siteUrl}/`;
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
  seoTitleBranch,
  seoDescriptionBranch,
  seoTitleSubject,
  seoDescriptionSubject,
  truncateMetaDescription,
  adsenseHeadScript,
};
