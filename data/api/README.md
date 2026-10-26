# GTUPEDIA Papers API (v1)

Read-only JSON API on **https://gtupedia.com** for **dashboard.gtupedia.com** and other clients.

Regenerated on every `node scripts/build-catalog.js` run.

## Quick start (dashboard)

```javascript
const API = 'https://gtupedia.com/data/api/v1';

// 1. Course list + branch counts + endpoint URLs
const catalog = await fetch(`${API}/catalog.json`).then(r => r.json());

// 2. All subjects + papers for one course
const be = await fetch(`${API}/subjects-be.json`).then(r => r.json());

be.subjects.forEach(subject => {
  console.log(subject.name, subject.code);
  subject.papers.forEach(paper => {
    console.log(' ', paper.exam, paper.pdfUrl);
  });
});
```

## Endpoints

| URL | Description |
|-----|-------------|
| `GET /data/api/v1/manifest.json` | API index, all endpoint URLs |
| `GET /data/api/v1/catalog.json` | Courses, branches, counts, exam seasons |
| `GET /data/api/v1/subjects-be.json` | BE subjects with nested `papers[]` |
| `GET /data/api/v1/subjects-di.json` | Diploma subjects |
| `GET /data/api/v1/subjects-bb.json` | BBA |
| `GET /data/api/v1/subjects-bc.json` | BCA |
| `GET /data/api/v1/subjects-mb.json` | MBA |
| `GET /data/api/v1/subjects-mc.json` | MCA |
| `GET /data/api/v1/subjects-bp.json` | B.Pharm |
| `GET /data/catalog.json` | Raw catalog (`examPapers` code lists) |
| `GET /data/search-index.json` | Search entries (subjects with papers) |

## Subject object shape

```json
{
  "id": "3150913@09@5_BE_WP",
  "code": "3150913",
  "name": "Disaster Management",
  "slug": "disaster-management",
  "courseCode": "BE",
  "courseName": "BACHELOR OF ENGINEERING",
  "branchId": "09",
  "branchName": "Electrical Engineering",
  "semester": 5,
  "semesterLabel": "5",
  "alternateCodes": [],
  "gtupediaUrl": "https://gtupedia.com/BE/09/electrical-engineering/3150913/disaster-management/",
  "syllabusUrls": ["https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/3150913.pdf"],
  "papers": [
    {
      "exam": "Winter 2025",
      "pdfUrl": "https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2025/BE/3150913.pdf",
      "fileCode": "3150913"
    }
  ]
}
```

## Dashboard integration options

### Option A — Browser fetch (SPA dashboard)

Add CORS on gtupedia.com (already in `.htaccess` for `dashboard.gtupedia.com`).

```javascript
const res = await fetch('https://gtupedia.com/data/api/v1/subjects-be.json');
const { subjects } = await res.json();
```

### Option B — Server-side proxy (recommended for admin dashboard)

Dashboard backend fetches JSON server-side — no CORS, can cache:

```php
// PHP example on dashboard.gtupedia.com
$data = json_decode(file_get_contents('https://gtupedia.com/data/api/v1/catalog.json'), true);
```

```javascript
// Node example
const catalog = await fetch('https://gtupedia.com/data/api/v1/catalog.json').then(r => r.json());
```

### Option C — Shared data on Hostinger

If both sites are on the same server, symlink or copy `data/api/` into dashboard docroot.

## Filtering example (client-side)

```javascript
function papersForBranch(subjects, branchId) {
  const id = String(branchId).padStart(2, '0');
  return subjects.filter(s => s.branchId === id);
}

function papersForSemester(subjects, semester) {
  return subjects.filter(s => Number(s.semester) === Number(semester));
}
```

## Notes

- PDF links point to **gtu.ac.in** (official GTU uploads).
- `gtupediaUrl` links to the public GTUPEDIA subject page.
- Paper availability updates when you add new `details-raw/*-papers.txt` and rebuild.
