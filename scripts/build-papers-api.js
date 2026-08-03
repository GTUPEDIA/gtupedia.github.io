/**
 * Build JSON API files for dashboard.gtupedia.com and other clients.
 * Run via build-catalog.js after catalog is assembled.
 */
const fs = require('fs');
const path = require('path');
const { SEO, siteUrl } = require('./seo-config');
const {
  branchesForCourse,
  branchPath,
  subjectPath,
} = require('./generate-sitemap');

const API_VERSION = '1';
const PAPER_COURSES = SEO.paperEnabledCourses || ['BE', 'DI', 'BB', 'BC', 'MB', 'MC', 'BP'];

function normalizePaperCode(value = '') {
  return String(value).trim().replace(/_updated$/i, '').replace(/_R$/i, '');
}

function subjectCodes(subject) {
  return [subject.code, ...(subject.alternateCodes || [])].filter(Boolean);
}

function paperSetCourseCode(paperSet) {
  return paperSet?.courseCode || 'BE';
}

function hasExamPaper(subjectCode, paperSet) {
  const code = String(subjectCode).trim();
  return (paperSet?.codes || []).some(item => item === code || normalizePaperCode(item) === code);
}

function resolvePaperFileName(subjectCode, paperSet) {
  const code = String(subjectCode).trim();
  const codes = paperSet?.codes || [];
  if (codes.includes(code)) return code;
  const updated = `${code}_updated`;
  if (codes.includes(updated)) return updated;
  const revised = `${code}_R`;
  if (codes.includes(revised)) return revised;
  const alias = codes.find(item => normalizePaperCode(item) === code);
  return alias || code;
}

function examPaperLinks(subject, examPapers = []) {
  const courseCode = subject.courseCode || 'BE';
  const links = [];
  const seen = new Set();

  for (const code of subjectCodes(subject)) {
    for (const paperSet of examPapers) {
      if (paperSetCourseCode(paperSet) !== courseCode) continue;
      if (!hasExamPaper(code, paperSet)) continue;
      const key = `${paperSet.exam}:${code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const fileName = resolvePaperFileName(code, paperSet);
      links.push({
        exam: paperSet.exam,
        pdfUrl: `${paperSet.baseUrl}/${encodeURIComponent(fileName)}.pdf`,
        fileCode: fileName,
      });
    }
  }

  return links;
}

function subjectHasPapers(subject, examPapers = []) {
  return examPaperLinks(subject, examPapers).length > 0;
}

function branchNameFor(subject, course, catalog) {
  if (String(subject.branchId) === '0') return 'All branches';
  const branches = branchesForCourse(course, catalog);
  const branchId = String(subject.branchId).padStart(2, '0');
  return branches.find(item => item.id === branchId || item.id === String(subject.branchId))?.name
    || subject.branchId;
}

function buildSubjectRecord(subject, course, catalog, examPapers) {
  const courseCode = subject.courseCode || course.code;
  const branches = branchesForCourse(course, catalog);
  const branchId = String(subject.branchId) === '0' ? '0' : String(subject.branchId).padStart(2, '0');
  const code = subject.code || subject.id.split('@')[0];
  const route = subjectPath(courseCode, branchId, subject, branches);

  return {
    id: subject.id,
    code,
    name: subject.name,
    slug: subject.slug,
    courseCode,
    courseName: course.name,
    branchId,
    branchName: branchNameFor(subject, course, catalog),
    semester: subject.semester,
    semesterLabel: subject.semesterLabel || (subject.semester ? `Semester ${subject.semester}` : null),
    alternateCodes: subject.alternateCodes || [],
    gtupediaUrl: siteUrl(route),
    syllabusUrls: [...new Set(subjectCodes(subject).map(c => (
      `https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/${encodeURIComponent(String(c).trim())}.pdf`
    )))],
    papers: examPaperLinks(subject, examPapers),
  };
}

function writePapersApi(buildCatalog, outRoot) {
  const apiDir = path.join(outRoot, 'data', 'api', 'v1');
  fs.mkdirSync(apiDir, { recursive: true });

  const examPapers = buildCatalog.examPapers || [];
  const courses = (buildCatalog.courses || []).filter(c => PAPER_COURSES.includes(c.code));
  const subjects = (buildCatalog.subjects || []).filter(s => subjectHasPapers(s, examPapers));

  const endpoints = {
    manifest: siteUrl('data/api/v1/manifest.json'),
    catalog: siteUrl('data/api/v1/catalog.json'),
    searchIndex: siteUrl('data/search-index.json'),
    catalogMeta: siteUrl('data/catalog.json'),
  };

  const byCourse = {};
  for (const course of courses) {
    const courseSubjects = subjects
      .filter(s => (s.courseCode || 'BE') === course.code)
      .map(s => buildSubjectRecord(s, course, buildCatalog, examPapers))
      .sort((a, b) => a.name.localeCompare(b.name));

    byCourse[course.code] = courseSubjects;

    const fileName = `subjects-${course.code.toLowerCase()}.json`;
    fs.writeFileSync(
      path.join(apiDir, fileName),
      `${JSON.stringify({ courseCode: course.code, courseName: course.name, count: courseSubjects.length, subjects: courseSubjects })}\n`,
    );
    endpoints[`subjects_${course.code}`] = siteUrl(`data/api/v1/${fileName}`);
  }

  const catalogSummary = {
    version: API_VERSION,
    generatedAt: buildCatalog.catalogBuiltAt,
    siteUrl: SEO.siteUrl,
    courses: courses.map(course => {
      const branches = branchesForCourse(course, buildCatalog);
      return {
        code: course.code,
        name: course.name,
        subjectCount: (byCourse[course.code] || []).length,
        paperCount: (byCourse[course.code] || []).reduce((sum, s) => sum + s.papers.length, 0),
        branches: branches.map(branch => ({
          id: branch.id,
          name: branch.name,
          slug: branch.slug,
          subjectCount: (byCourse[course.code] || []).filter(s => s.branchId === String(branch.id).padStart(2, '0') || s.branchId === branch.id).length,
        })),
        subjectsEndpoint: endpoints[`subjects_${course.code}`],
      };
    }),
    examSeasons: [...new Set(examPapers.map(p => p.exam))],
  };

  fs.writeFileSync(path.join(apiDir, 'catalog.json'), `${JSON.stringify(catalogSummary, null, 2)}\n`);

  const manifest = {
    version: API_VERSION,
    generatedAt: buildCatalog.catalogBuiltAt,
    description: 'GTUPEDIA read-only papers API for dashboard.gtupedia.com',
    baseUrl: `${SEO.siteUrl}/data/api/v1/`,
    endpoints,
    usage: {
      listCourses: 'GET /data/api/v1/catalog.json',
      listSubjectsByCourse: 'GET /data/api/v1/subjects-{be|di|bb|bc|mb|mc|bp}.json',
      search: 'GET /data/search-index.json',
      liveCatalog: 'GET /data/catalog.json (exam paper sets + course stats)',
    },
    cors: {
      allowedOrigins: ['https://dashboard.gtupedia.com', 'https://gtupedia.com'],
      note: 'Configure dashboard to fetch from gtupedia.com, or proxy server-side to avoid CORS.',
    },
  };

  fs.writeFileSync(path.join(apiDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const totalPapers = subjects.reduce((sum, s) => sum + examPaperLinks(s, examPapers).length, 0);
  return {
    subjects: subjects.length,
    papers: totalPapers,
    courses: courses.length,
    apiDir,
  };
}

module.exports = { writePapersApi };

if (require.main === module) {
  const base = path.join(__dirname, '..');
  const catalog = JSON.parse(fs.readFileSync(path.join(base, 'data/catalog.json'), 'utf8'));
  const subjects = [];
  for (const code of PAPER_COURSES) {
    const file = path.join(base, `data/${code.toLowerCase()}-subjects.json`);
    if (fs.existsSync(file)) subjects.push(...JSON.parse(fs.readFileSync(file, 'utf8')));
  }
  const stats = writePapersApi({ ...catalog, subjects }, base);
  console.log(`papers API: ${stats.subjects} subjects, ${stats.papers} paper links, ${stats.courses} courses`);
}
