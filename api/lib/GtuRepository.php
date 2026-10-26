<?php

/**
 * Reads the GTUPEDIA catalogue out of MySQL and rebuilds the JSON
 * shapes the static site and papers API already use.
 */
class GtuRepository
{
    private PDO $pdo;
    private ?array $courses = null;
    private ?array $subjects = null;
    private ?array $paperSets = null;
    private ?array $meta = null;
    private ?string $siteUrl = null;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function counts(): array
    {
        $tables = [
            'courses',
            'branches',
            'subjects',
            'subject_alternate_codes',
            'subject_alternate_ids',
            'exam_paper_sets',
            'exam_paper_codes',
            'team_members',
            'event_categories',
            'events',
            'internships',
            'partner_roles',
            'partners',
            'resource_categories',
            'resource_topics',
            'resource_items',
        ];
        $counts = [];
        foreach ($tables as $table) {
            $counts[$table] = (int) $this->pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
        }

        $byCourse = [];
        $stmt = $this->pdo->query('SELECT course_code, COUNT(*) AS n FROM subjects GROUP BY course_code ORDER BY course_code');
        foreach ($stmt as $row) {
            $byCourse[$row['course_code']] = (int) $row['n'];
        }

        return [
            'database' => gtu_config()['database'],
            'host' => gtu_config()['host'],
            'catalogBuiltAt' => $this->meta()['catalog_built_at'] ?? null,
            'tables' => $counts,
            'subjectsByCourse' => $byCourse,
        ];
    }

    public function catalogDocument(): array
    {
        $courses = [];
        foreach ($this->courses() as $course) {
            $entry = [
                'code' => $course['code'],
                'name' => $course['name'],
            ];
            if ($course['branches']) {
                $entry['branches'] = $course['branches'];
            }
            $courses[] = $entry;
        }

        $beBranches = [];
        foreach ($this->courses() as $course) {
            if ($course['code'] === 'BE') {
                $beBranches = $course['branches'];
                break;
            }
        }

        $stats = [];
        foreach ($this->courses() as $course) {
            $withPapers = 0;
            foreach ($this->subjects() as $subject) {
                if ($subject['courseCode'] === $course['code'] && $this->subjectHasPapers($subject)) {
                    $withPapers++;
                }
            }
            $stats[$course['code']] = ['subjectsWithPapers' => $withPapers];
        }

        return [
            'catalogBuiltAt' => $this->meta()['catalog_built_at'] ?? null,
            'courses' => $courses,
            'branches' => $beBranches,
            'courseStats' => $stats,
            'resources' => [],
            'examPapers' => array_map(static function (array $set): array {
                return [
                    'exam' => $set['exam'],
                    'baseUrl' => $set['baseUrl'],
                    'courseCode' => $set['courseCode'],
                    'codes' => $set['codes'],
                ];
            }, $this->paperSets()),
        ];
    }

    public function subjectsForCourse(string $courseCode): array
    {
        $courseCode = strtoupper($courseCode);
        $rows = [];
        foreach ($this->subjects() as $subject) {
            if ($subject['courseCode'] === $courseCode) {
                $rows[] = $subject;
            }
        }
        return $rows;
    }

    public function branchesForCourse(string $courseCode): array
    {
        $courseCode = strtoupper($courseCode);
        foreach ($this->courses() as $course) {
            if ($course['code'] === $courseCode) {
                return $course['branches'];
            }
        }
        return [];
    }

    public function searchIndex(): array
    {
        $branchNames = [];
        foreach ($this->courses() as $course) {
            if ($course['code'] === 'BE') {
                foreach ($course['branches'] as $branch) {
                    $branchNames['BE:' . $branch['id']] = $branch['name'];
                }
            }
        }
        foreach ($this->courses() as $course) {
            foreach ($course['branches'] as $branch) {
                $branchNames[$course['code'] . ':' . $branch['id']] = $branch['name'];
            }
        }

        $courseNames = [];
        foreach ($this->courses() as $course) {
            $courseNames[$course['code']] = $course['name'];
        }

        $entries = [];
        foreach ($this->subjects() as $subject) {
            if (!$this->subjectHasPapers($subject)) {
                continue;
            }
            $courseCode = $subject['courseCode'] ?: 'BE';
            $courseNameRaw = $courseNames[$courseCode] ?? 'Bachelor of Engineering';
            $branchName = $subject['branchId'] === '0'
                ? 'All branches'
                : ($branchNames[$courseCode . ':' . $subject['branchId']] ?? $subject['branchId']);
            $parts = [
                $subject['code'],
                $subject['slug'],
            ];
            foreach ($subject['alternateCodes'] as $alternate) {
                $parts[] = $alternate;
            }
            $parts[] = $subject['name'];
            $parts[] = $subject['branchId'];
            $parts[] = $branchName;
            $parts[] = $subject['courseCode'];
            $parts[] = $courseNames[$courseCode] ?? null;
            $parts[] = $subject['semester'];
            $parts[] = $subject['semesterLabel'];
            $parts = array_values(array_filter($parts, static function ($value): bool {
                return $value !== null && $value !== '' && $value !== false && $value !== 0;
            }));

            $entries[] = [
                'subject' => $subject,
                'courseCode' => $courseCode,
                'courseName' => $this->formatCourseLabel((string) $courseNameRaw),
                'branchName' => $branchName,
                'code' => mb_strtolower((string) ($subject['code'] ?: $subject['id']), 'UTF-8'),
                'alternateCodes' => array_map(
                    static fn ($item) => mb_strtolower((string) $item, 'UTF-8'),
                    $subject['alternateCodes']
                ),
                'name' => mb_strtolower((string) $subject['name'], 'UTF-8'),
                'haystack' => mb_strtolower(implode(' ', array_map('strval', $parts)), 'UTF-8'),
            ];
        }

        return ['entries' => $entries];
    }

    public function papersDocument(string $courseCode): array
    {
        $courseCode = strtoupper($courseCode);
        $course = null;
        foreach ($this->courses() as $item) {
            if ($item['code'] === $courseCode) {
                $course = $item;
                break;
            }
        }
        if ($course === null) {
            return [
                'courseCode' => $courseCode,
                'courseName' => null,
                'count' => 0,
                'subjects' => [],
            ];
        }

        $subjects = [];
        foreach ($this->subjects() as $subject) {
            if (($subject['courseCode'] ?: 'BE') !== $courseCode) {
                continue;
            }
            $papers = $this->examPaperLinks($subject);
            if (!$papers) {
                continue;
            }
            $subjects[] = $this->paperSubjectRecord($subject, $course, $papers);
        }
        usort($subjects, static fn ($a, $b) => strcasecmp($a['name'], $b['name']));

        return [
            'courseCode' => $course['code'],
            'courseName' => $course['name'],
            'count' => count($subjects),
            'subjects' => $subjects,
        ];
    }

    public function papersCatalog(): array
    {
        $seo = $this->seo();
        $enabled = $seo['paperEnabledCourses'] ?? ['BE', 'DI', 'BB', 'BC', 'MB', 'MC', 'BP'];
        $courses = [];
        $seasons = [];
        foreach ($this->paperSets() as $set) {
            if (!in_array($set['exam'], $seasons, true)) {
                $seasons[] = $set['exam'];
            }
        }

        foreach ($this->courses() as $course) {
            if (!in_array($course['code'], $enabled, true)) {
                continue;
            }
            $doc = $this->papersDocument($course['code']);
            $paperCount = 0;
            foreach ($doc['subjects'] as $subject) {
                $paperCount += count($subject['papers']);
            }
            $branches = [];
            foreach ($course['branches'] as $branch) {
                $padded = $this->padBranchId((string) $branch['id']);
                $subjectCount = 0;
                foreach ($doc['subjects'] as $subject) {
                    if ($subject['branchId'] === $padded || $subject['branchId'] === $branch['id']) {
                        $subjectCount++;
                    }
                }
                $branches[] = [
                    'id' => $branch['id'],
                    'name' => $branch['name'],
                    'slug' => $branch['slug'],
                    'subjectCount' => $subjectCount,
                ];
            }
            $courses[] = [
                'code' => $course['code'],
                'name' => $course['name'],
                'subjectCount' => $doc['count'],
                'paperCount' => $paperCount,
                'branches' => $branches,
                'subjectsEndpoint' => $this->requestBaseUrl() . '/api/v1/papers.php?course=' . rawurlencode($course['code']),
            ];
        }

        return [
            'version' => '1',
            'generatedAt' => $this->meta()['catalog_built_at'] ?? null,
            'siteUrl' => $this->siteUrl(),
            'courses' => $courses,
            'examSeasons' => $seasons,
        ];
    }

    public function manifest(): array
    {
        $base = $this->requestBaseUrl();
        return [
            'version' => '1',
            'generatedAt' => $this->meta()['catalog_built_at'] ?? null,
            'description' => 'GTUPEDIA papers API served from MySQL',
            'baseUrl' => $base . '/api/v1/',
            'endpoints' => [
                'health' => $base . '/api/health.php',
                'catalog' => $base . '/api/v1/catalog.php',
                'papersCatalog' => $base . '/api/v1/papers-catalog.php',
                'search' => $base . '/api/v1/search.php',
                'subjects' => $base . '/api/v1/subjects.php?course=BE',
                'papers' => $base . '/api/v1/papers.php?course=BE',
                'team' => $base . '/api/v1/team.php',
                'events' => $base . '/api/v1/events.php',
                'internships' => $base . '/api/v1/internships.php',
                'partners' => $base . '/api/v1/partners.php',
                'library' => $base . '/api/v1/library.php',
            ],
        ];
    }

    public function teamDocument(): array
    {
        $meta = $this->meta();
        $members = [];
        $stmt = $this->pdo->query('SELECT id, name, role, course, branch, college FROM team_members ORDER BY sort_order');
        foreach ($stmt as $row) {
            $members[] = $row;
        }
        return [
            'updatedAt' => $meta['team_updated_at'] ?? null,
            'intro' => $meta['team_intro'] ?? '',
            'joinNote' => $meta['team_join_note'] ?? '',
            'members' => $members,
        ];
    }

    public function eventsDocument(): array
    {
        $categories = [];
        $stmt = $this->pdo->query('SELECT id, type FROM event_categories ORDER BY sort_order');
        $events = $this->pdo->query(
            'SELECT category_id, name, url, date_label, venue, organizer, theme, summary
             FROM events ORDER BY sort_order'
        )->fetchAll();
        foreach ($stmt as $category) {
            $items = [];
            foreach ($events as $event) {
                if ((int) $event['category_id'] !== (int) $category['id']) {
                    continue;
                }
                $items[] = [
                    'name' => $event['name'],
                    'url' => $event['url'],
                    'date' => $event['date_label'],
                    'venue' => $event['venue'],
                    'organizer' => $event['organizer'],
                    'theme' => $event['theme'],
                    'summary' => $event['summary'] ?? '',
                ];
            }
            $categories[] = [
                'type' => $category['type'],
                'events' => $items,
            ];
        }
        return [
            'intro' => $this->meta()['events_intro'] ?? '',
            'categories' => $categories,
        ];
    }

    public function internshipsDocument(): array
    {
        $meta = $this->meta();
        $rows = [];
        $stmt = $this->pdo->query(
            'SELECT id, company, company_url, role, domain, type, stipend, location, mode, duration,
                    courses_json, skills_json, eligibility, deadline, posted, summary, apply_url
             FROM internships ORDER BY sort_order'
        );
        foreach ($stmt as $row) {
            $rows[] = [
                'id' => $row['id'],
                'company' => $row['company'],
                'companyUrl' => $row['company_url'],
                'role' => $row['role'],
                'domain' => $row['domain'],
                'type' => $row['type'],
                'stipend' => $row['stipend'],
                'location' => $row['location'],
                'mode' => $row['mode'],
                'duration' => $row['duration'],
                'courses' => json_decode($row['courses_json'], true) ?: [],
                'skills' => json_decode($row['skills_json'], true) ?: [],
                'eligibility' => $row['eligibility'] ?? '',
                'deadline' => $row['deadline'],
                'posted' => $row['posted'],
                'summary' => $row['summary'] ?? '',
                'applyUrl' => $row['apply_url'],
            ];
        }
        return [
            'intro' => $meta['internships_intro'] ?? '',
            'listingNote' => $meta['internships_listing_note'] ?? '',
            'internships' => $rows,
        ];
    }

    public function partnersDocument(): array
    {
        $roles = $this->pdo->query('SELECT id, role FROM partner_roles ORDER BY sort_order')->fetchAll();
        $partners = $this->pdo->query('SELECT role_id, name, url FROM partners ORDER BY sort_order')->fetchAll();
        $categories = [];
        foreach ($roles as $role) {
            $items = [];
            foreach ($partners as $partner) {
                if ((int) $partner['role_id'] !== (int) $role['id']) {
                    continue;
                }
                $items[] = [
                    'name' => $partner['name'],
                    'url' => $partner['url'],
                ];
            }
            $categories[] = [
                'role' => $role['role'],
                'partners' => $items,
            ];
        }
        return [
            'intro' => $this->meta()['partners_intro'] ?? '',
            'categories' => $categories,
        ];
    }

    public function libraryDocument(): array
    {
        $categories = [];
        foreach ($this->pdo->query('SELECT id, name, description, icon FROM resource_categories ORDER BY sort_order') as $row) {
            $categories[] = $row;
        }
        $topics = [];
        foreach ($this->pdo->query('SELECT id, name, slug FROM resource_topics ORDER BY sort_order') as $row) {
            $topics[] = $row;
        }
        $items = [];
        $stmt = $this->pdo->query(
            'SELECT id, title, url, type, category_id, topics_json, description, source, recommended, tags_json
             FROM resource_items ORDER BY sort_order'
        );
        foreach ($stmt as $row) {
            $items[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'url' => $row['url'],
                'type' => $row['type'],
                'category' => $row['category_id'],
                'topics' => json_decode($row['topics_json'], true) ?: [],
                'description' => $row['description'] ?? '',
                'source' => $row['source'],
                'recommended' => (bool) $row['recommended'],
                'tags' => json_decode($row['tags_json'], true) ?: [],
            ];
        }
        return [
            'updatedAt' => $this->meta()['library_updated_at'] ?? null,
            'categories' => $categories,
            'topics' => $topics,
            'items' => $items,
        ];
    }

    private function paperSubjectRecord(array $subject, array $course, array $papers): array
    {
        $branchId = $subject['branchId'] === '0' ? '0' : $this->padBranchId((string) $subject['branchId']);
        $code = $subject['code'] ?: explode('@', $subject['id'])[0];
        $branches = $this->branchesForLookup($course);
        $route = $this->subjectPath($course['code'], $branchId, $code, $subject['slug'], $branches);
        $syllabus = [];
        foreach ($this->subjectCodes($subject) as $subjectCode) {
            $url = 'https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/'
                . rawurlencode(trim((string) $subjectCode)) . '.pdf';
            if (!in_array($url, $syllabus, true)) {
                $syllabus[] = $url;
            }
        }
        $branchName = $subject['branchId'] === '0'
            ? 'All branches'
            : $this->branchName($subject, $course);

        return [
            'id' => $subject['id'],
            'code' => $code,
            'name' => $subject['name'],
            'slug' => $subject['slug'],
            'courseCode' => $subject['courseCode'] ?: $course['code'],
            'courseName' => $course['name'],
            'branchId' => $branchId,
            'branchName' => $branchName,
            'semester' => $subject['semester'],
            'semesterLabel' => $subject['semesterLabel'] ?: ($subject['semester'] ? 'Semester ' . $subject['semester'] : null),
            'alternateCodes' => $subject['alternateCodes'],
            'gtupediaUrl' => $this->publicSiteUrl($route),
            'syllabusUrls' => $syllabus,
            'papers' => $papers,
        ];
    }

    private function branchName(array $subject, array $course): string
    {
        $branches = $this->branchesForLookup($course);
        $branchId = $this->padBranchId((string) $subject['branchId']);
        foreach ($branches as $branch) {
            if ($branch['id'] === $branchId || $branch['id'] === (string) $subject['branchId']) {
                return $branch['name'];
            }
        }
        return (string) $subject['branchId'];
    }

    private function branchesForLookup(array $course): array
    {
        if ($course['branches']) {
            return $course['branches'];
        }
        if ($course['code'] === 'BE') {
            foreach ($this->courses() as $item) {
                if ($item['code'] === 'BE') {
                    return $item['branches'];
                }
            }
        }
        return [];
    }

    private function subjectPath(string $courseCode, string $branchId, string $code, string $slug, array $branches): string
    {
        $id = $branchId === '0' ? '0' : $this->padBranchId($branchId);
        $branchSlug = $id === '0' ? 'common' : $id;
        foreach ($branches as $branch) {
            if ($branch['id'] === $id) {
                $branchSlug = $branch['slug'] ?: $id;
                break;
            }
        }
        return $courseCode . '/' . $id . '/' . $branchSlug . '/' . rawurlencode($code) . '/' . $slug;
    }

    private function examPaperLinks(array $subject): array
    {
        $courseCode = $subject['courseCode'] ?: 'BE';
        $links = [];
        $seen = [];
        foreach ($this->subjectCodes($subject) as $code) {
            foreach ($this->paperSets() as $set) {
                if ($set['courseCode'] !== $courseCode) {
                    continue;
                }
                if (!isset($set['exact'][$code]) && !isset($set['normalized'][$code])) {
                    continue;
                }
                $key = $set['exam'] . ':' . $code;
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $fileName = $this->resolvePaperFileName($code, $set);
                $links[] = [
                    'exam' => $set['exam'],
                    'pdfUrl' => $set['baseUrl'] . '/' . rawurlencode($fileName) . '.pdf',
                    'fileCode' => $fileName,
                ];
            }
        }
        return $links;
    }

    private function resolvePaperFileName(string $code, array $set): string
    {
        if (isset($set['exact'][$code])) {
            return $code;
        }
        if (isset($set['exact'][$code . '_updated'])) {
            return $code . '_updated';
        }
        if (isset($set['exact'][$code . '_R'])) {
            return $code . '_R';
        }
        return $set['normalized'][$code] ?? $code;
    }

    private function subjectHasPapers(array $subject): bool
    {
        $courseCode = $subject['courseCode'] ?: 'BE';
        foreach ($this->paperSets() as $set) {
            if ($set['courseCode'] !== $courseCode) {
                continue;
            }
            foreach ($this->subjectCodes($subject) as $code) {
                if (isset($set['exact'][$code])) {
                    return true;
                }
            }
        }
        return false;
    }

    private function subjectCodes(array $subject): array
    {
        $codes = [$subject['code']];
        foreach ($subject['alternateCodes'] as $code) {
            if ($code) {
                $codes[] = $code;
            }
        }
        return $codes;
    }

    private function formatCourseLabel(string $name): string
    {
        if ($name === '' || $name !== mb_strtoupper($name, 'UTF-8')) {
            return $name;
        }
        $lower = mb_strtolower($name, 'UTF-8');
        $formatted = preg_replace_callback('/\b([a-z])/u', static fn ($m) => strtoupper($m[1]), $lower);
        return $formatted ?? $lower;
    }

    private function padBranchId(string $id): string
    {
        if ($id === '0') {
            return '0';
        }
        return strlen($id) >= 2 ? $id : str_pad($id, 2, '0', STR_PAD_LEFT);
    }

    private function courses(): array
    {
        if ($this->courses !== null) {
            return $this->courses;
        }
        $branchesByCourse = [];
        $branchRows = $this->pdo->query(
            'SELECT course_code, branch_code, name, slug FROM branches ORDER BY sort_order'
        );
        foreach ($branchRows as $row) {
            $branchesByCourse[$row['course_code']][] = [
                'id' => $row['branch_code'],
                'name' => $row['name'],
                'slug' => $row['slug'],
            ];
        }
        $courses = [];
        foreach ($this->pdo->query('SELECT code, name FROM courses ORDER BY sort_order') as $row) {
            $courses[] = [
                'code' => $row['code'],
                'name' => $row['name'],
                'branches' => $branchesByCourse[$row['code']] ?? [],
            ];
        }
        $this->courses = $courses;
        return $courses;
    }

    private function subjects(): array
    {
        if ($this->subjects !== null) {
            return $this->subjects;
        }
        $codes = [];
        foreach ($this->pdo->query('SELECT subject_id, code FROM subject_alternate_codes ORDER BY subject_id, sort_order') as $row) {
            $codes[$row['subject_id']][] = $row['code'];
        }
        $ids = [];
        foreach ($this->pdo->query('SELECT subject_id, alternate_id FROM subject_alternate_ids ORDER BY subject_id, sort_order') as $row) {
            $ids[$row['subject_id']][] = $row['alternate_id'];
        }
        $subjects = [];
        $stmt = $this->pdo->query(
            'SELECT id, code, name, slug, course_code, branch_code, semester, semester_label
             FROM subjects ORDER BY sort_order'
        );
        foreach ($stmt as $row) {
            $subjects[] = [
                'id' => $row['id'],
                'code' => $row['code'],
                'name' => $row['name'],
                'branchId' => $row['branch_code'],
                'semester' => $row['semester'] === null ? null : (int) $row['semester'],
                'courseCode' => $row['course_code'],
                'semesterLabel' => $row['semester_label'],
                'alternateCodes' => $codes[$row['id']] ?? [],
                'alternateIds' => $ids[$row['id']] ?? [],
                'slug' => $row['slug'],
            ];
        }
        $this->subjects = $subjects;
        return $subjects;
    }

    private function paperBaseUrl(string $baseUrl): string
    {
        $archive = 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/';
        $rewritten = preg_replace('#^https?://(?:www\.)?gtu\.ac\.in/uploads/#i', $archive, $baseUrl);
        return is_string($rewritten) && $rewritten !== '' ? $rewritten : $baseUrl;
    }

    private function paperSets(): array
    {
        if ($this->paperSets !== null) {
            return $this->paperSets;
        }
        $codes = [];
        foreach ($this->pdo->query('SELECT paper_set_id, file_code FROM exam_paper_codes ORDER BY paper_set_id, sort_order') as $row) {
            $codes[(int) $row['paper_set_id']][] = $row['file_code'];
        }
        $sets = [];
        $stmt = $this->pdo->query('SELECT id, exam, course_code, base_url FROM exam_paper_sets ORDER BY sort_order');
        foreach ($stmt as $row) {
            $list = $codes[(int) $row['id']] ?? [];
            $exact = [];
            $normalized = [];
            foreach ($list as $fileCode) {
                $exact[$fileCode] = true;
                $key = $this->normalizePaperCode($fileCode);
                if (!isset($normalized[$key])) {
                    $normalized[$key] = $fileCode;
                }
            }
            $sets[] = [
                'exam' => $row['exam'],
                'baseUrl' => $this->paperBaseUrl($row['base_url']),
                'courseCode' => $row['course_code'],
                'codes' => $list,
                'exact' => $exact,
                'normalized' => $normalized,
            ];
        }
        $this->paperSets = $sets;
        return $sets;
    }

    private function normalizePaperCode(string $value): string
    {
        $value = trim($value);
        $value = preg_replace('/_updated$/i', '', $value) ?? $value;
        $value = preg_replace('/_R$/i', '', $value) ?? $value;
        return $value;
    }

    private function meta(): array
    {
        if ($this->meta !== null) {
            return $this->meta;
        }
        $meta = [];
        foreach ($this->pdo->query('SELECT meta_key, meta_value FROM site_meta') as $row) {
            $meta[$row['meta_key']] = $row['meta_value'];
        }
        $this->meta = $meta;
        return $meta;
    }

    private function seo(): array
    {
        $path = gtu_root() . '/data/seo.json';
        if (!is_file($path)) {
            return ['siteUrl' => 'https://gtupedia.com'];
        }
        return json_decode((string) file_get_contents($path), true) ?: [];
    }

    private function siteUrl(): string
    {
        if ($this->siteUrl === null) {
            $this->siteUrl = rtrim((string) ($this->seo()['siteUrl'] ?? 'https://gtupedia.com'), '/');
        }
        return $this->siteUrl;
    }

    private function publicSiteUrl(string $path): string
    {
        $clean = trim($path, '/');
        if ($clean === '') {
            return $this->siteUrl() . '/';
        }
        return $this->siteUrl() . '/' . $clean . '/';
    }

    private function requestBaseUrl(): string
    {
        if (PHP_SAPI === 'cli') {
            return $this->siteUrl();
        }
        $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        $root = preg_replace('#/api(?:/.*)?$#', '', $script) ?? '';
        return ($https ? 'https' : 'http') . '://' . $host . $root;
    }
}
