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

function seoDescriptionCourse(courseName, courseCode, branchCount, subjectCount) {
  return `Download ${courseCode} GTU question papers for ${courseName}. Browse ${branchCount} branches and ${subjectCount} subjects with official previous year exam PDFs.`;
}

function seoTitleBranch(branchName, courseCode, branchId) {
  return `${branchName} GTU Papers — ${courseCode} Branch ${branchId} Subjects | ${SEO.siteName}`;
}

function seoDescriptionBranch(branchName, courseCode, subjectCount) {
  return `${branchName} (${courseCode}) GTU previous year question papers — ${subjectCount} subjects with free exam PDFs by semester.`;
}

function seoTitleSubject(subjectName, code) {
  return `${subjectName} GTU Question Paper PDF (${code}) | ${SEO.siteName}`;
}

function seoDescriptionSubject(subjectName, code, branchName, semester, paperCount) {
  const seasons = paperCount ? `${paperCount} exam season${paperCount === 1 ? '' : 's'} of ` : '';
  return `Download ${seasons}GTU ${subjectName} (${code}) question papers for ${branchName}, semester ${semester}. Free links to official GTU exam PDFs.`;
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
};
