<?php
/**
 * Load the current JSON catalogue into MySQL.
 *
 * Local XAMPP:
 *   C:\xampp\php\php.exe database\seed.php
 *
 * Hostinger, after database/config.local.php has the hPanel user and password:
 *   php database/seed.php
 *
 * Re-running replaces the catalogue tables with the JSON files in this repo.
 * The public site still reads those JSON files until we point it at /api/v1/.
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Seed can only be run from the command line.');
}

require __DIR__ . '/db.php';
require dirname(__DIR__) . '/api/lib/GtuRepository.php';
require __DIR__ . '/verify.php';

set_time_limit(0);

$config = gtu_config();
echo "Connecting to {$config['username']}@{$config['host']}:{$config['port']}\n";

try {
    $server = gtu_server_pdo();
    $server->exec(
        "CREATE DATABASE IF NOT EXISTS `{$config['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
    echo "Database `{$config['database']}` is ready.\n";
} catch (PDOException $e) {
    fwrite(STDERR, "Could not create the database ({$e->getMessage()}). Trying the existing database.\n");
}

$pdo = gtu_pdo();
$schema = (string) file_get_contents(__DIR__ . '/schema.sql');
foreach (gtu_sql_statements($schema) as $statement) {
    $pdo->exec($statement);
}
echo "Schema applied.\n";

$catalog = gtu_read_json('data/catalog.json');
$subjectFiles = [
    'BE' => 'data/be-subjects.json',
    'BB' => 'data/bb-subjects.json',
    'BC' => 'data/bc-subjects.json',
    'MB' => 'data/mb-subjects.json',
    'MC' => 'data/mc-subjects.json',
    'BP' => 'data/bp-subjects.json',
    'DI' => 'data/di-subjects.json',
];

$pdo->beginTransaction();
try {
    $meta = [
        'catalog_built_at' => (string) ($catalog['catalogBuiltAt'] ?? ''),
    ];

    $courseRows = [];
    $branchRows = [];
    foreach ($catalog['courses'] as $index => $course) {
        $courseRows[] = [
            'code' => $course['code'],
            'name' => $course['name'],
            'sort_order' => $index,
        ];
        foreach ($course['branches'] ?? [] as $branchIndex => $branch) {
            $branchRows[] = [
                'course_code' => $course['code'],
                'branch_code' => (string) $branch['id'],
                'name' => $branch['name'],
                'slug' => (string) ($branch['slug'] ?? ''),
                'sort_order' => ($index * 1000) + $branchIndex,
            ];
        }
    }
    insert_batch($pdo, 'courses', ['code', 'name', 'sort_order'], $courseRows);
    insert_batch($pdo, 'branches', ['course_code', 'branch_code', 'name', 'slug', 'sort_order'], $branchRows);

    $subjectRows = [];
    $altCodeRows = [];
    $altIdRows = [];
    $sort = 0;
    foreach ($subjectFiles as $file) {
        foreach (gtu_read_json($file) as $subject) {
            $subjectRows[] = [
                'id' => $subject['id'],
                'code' => $subject['code'],
                'name' => $subject['name'],
                'slug' => (string) ($subject['slug'] ?? ''),
                'course_code' => $subject['courseCode'],
                'branch_code' => (string) $subject['branchId'],
                'semester' => $subject['semester'] === null ? null : (int) $subject['semester'],
                'semester_label' => $subject['semesterLabel'] ?? null,
                'sort_order' => $sort,
            ];
            foreach (array_values($subject['alternateCodes'] ?? []) as $altIndex => $code) {
                if ($code === '' || $code === null) {
                    continue;
                }
                $altCodeRows[] = [
                    'subject_id' => $subject['id'],
                    'code' => (string) $code,
                    'sort_order' => $altIndex,
                ];
            }
            foreach (array_values($subject['alternateIds'] ?? []) as $altIndex => $altId) {
                if ($altId === '' || $altId === null) {
                    continue;
                }
                $altIdRows[] = [
                    'subject_id' => $subject['id'],
                    'alternate_id' => (string) $altId,
                    'sort_order' => $altIndex,
                ];
            }
            $sort++;
        }
    }
    insert_batch($pdo, 'subjects', [
        'id', 'code', 'name', 'slug', 'course_code', 'branch_code', 'semester', 'semester_label', 'sort_order',
    ], $subjectRows);
    insert_batch($pdo, 'subject_alternate_codes', ['subject_id', 'code', 'sort_order'], $altCodeRows);
    insert_batch($pdo, 'subject_alternate_ids', ['subject_id', 'alternate_id', 'sort_order'], $altIdRows);

    $setStmt = $pdo->prepare(
        'INSERT INTO exam_paper_sets (exam, course_code, base_url, sort_order) VALUES (?, ?, ?, ?)'
    );
    $codeRows = [];
    foreach ($catalog['examPapers'] as $setIndex => $set) {
        $setStmt->execute([$set['exam'], $set['courseCode'] ?? 'BE', $set['baseUrl'], $setIndex]);
        $setId = (int) $pdo->lastInsertId();
        foreach (array_values($set['codes'] ?? []) as $codeIndex => $fileCode) {
            $codeRows[] = [
                'paper_set_id' => $setId,
                'file_code' => (string) $fileCode,
                'sort_order' => $codeIndex,
            ];
        }
    }
    insert_batch($pdo, 'exam_paper_codes', ['paper_set_id', 'file_code', 'sort_order'], $codeRows);

    $team = gtu_read_json('data/team.json');
    $meta['team_updated_at'] = (string) ($team['updatedAt'] ?? '');
    $meta['team_intro'] = (string) ($team['intro'] ?? '');
    $meta['team_join_note'] = (string) ($team['joinNote'] ?? '');
    $teamRows = [];
    foreach ($team['members'] as $index => $member) {
        $teamRows[] = [
            'id' => $member['id'],
            'name' => $member['name'],
            'role' => (string) ($member['role'] ?? ''),
            'course' => (string) ($member['course'] ?? ''),
            'branch' => (string) ($member['branch'] ?? ''),
            'college' => (string) ($member['college'] ?? ''),
            'sort_order' => $index,
        ];
    }
    insert_batch($pdo, 'team_members', ['id', 'name', 'role', 'course', 'branch', 'college', 'sort_order'], $teamRows);

    $events = gtu_read_json('data/events.json');
    $meta['events_intro'] = (string) ($events['intro'] ?? '');
    $categoryStmt = $pdo->prepare('INSERT INTO event_categories (type, sort_order) VALUES (?, ?)');
    $eventStmt = $pdo->prepare(
        'INSERT INTO events (category_id, name, url, date_label, venue, organizer, theme, summary, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $eventSort = 0;
    foreach ($events['categories'] as $index => $category) {
        $categoryStmt->execute([$category['type'], $index]);
        $categoryId = (int) $pdo->lastInsertId();
        foreach ($category['events'] as $event) {
            $eventStmt->execute([
                $categoryId,
                $event['name'],
                (string) ($event['url'] ?? ''),
                (string) ($event['date'] ?? ''),
                (string) ($event['venue'] ?? ''),
                (string) ($event['organizer'] ?? ''),
                (string) ($event['theme'] ?? ''),
                (string) ($event['summary'] ?? ''),
                $eventSort++,
            ]);
        }
    }

    $internships = gtu_read_json('data/internships.json');
    $meta['internships_intro'] = (string) ($internships['intro'] ?? '');
    $meta['internships_listing_note'] = (string) ($internships['listingNote'] ?? '');
    $internshipRows = [];
    foreach ($internships['internships'] as $index => $item) {
        $internshipRows[] = [
            'id' => $item['id'],
            'company' => $item['company'],
            'company_url' => (string) ($item['companyUrl'] ?? ''),
            'role' => $item['role'],
            'domain' => (string) ($item['domain'] ?? ''),
            'type' => (string) ($item['type'] ?? ''),
            'stipend' => (string) ($item['stipend'] ?? ''),
            'location' => (string) ($item['location'] ?? ''),
            'mode' => (string) ($item['mode'] ?? ''),
            'duration' => (string) ($item['duration'] ?? ''),
            'courses_json' => json_encode($item['courses'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'skills_json' => json_encode($item['skills'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'eligibility' => (string) ($item['eligibility'] ?? ''),
            'deadline' => (string) ($item['deadline'] ?? ''),
            'posted' => (string) ($item['posted'] ?? ''),
            'summary' => (string) ($item['summary'] ?? ''),
            'apply_url' => (string) ($item['applyUrl'] ?? ''),
            'sort_order' => $index,
        ];
    }
    insert_batch($pdo, 'internships', [
        'id', 'company', 'company_url', 'role', 'domain', 'type', 'stipend', 'location', 'mode', 'duration',
        'courses_json', 'skills_json', 'eligibility', 'deadline', 'posted', 'summary', 'apply_url', 'sort_order',
    ], $internshipRows);

    $partners = gtu_read_json('data/partners.json');
    $meta['partners_intro'] = (string) ($partners['intro'] ?? '');
    $roleStmt = $pdo->prepare('INSERT INTO partner_roles (role, sort_order) VALUES (?, ?)');
    $partnerStmt = $pdo->prepare('INSERT INTO partners (role_id, name, url, sort_order) VALUES (?, ?, ?, ?)');
    $partnerSort = 0;
    foreach ($partners['categories'] as $index => $category) {
        $roleStmt->execute([$category['role'], $index]);
        $roleId = (int) $pdo->lastInsertId();
        foreach ($category['partners'] as $partner) {
            $partnerStmt->execute([$roleId, $partner['name'], (string) ($partner['url'] ?? ''), $partnerSort++]);
        }
    }

    $library = gtu_read_json('resources/data/library.json');
    $meta['library_updated_at'] = (string) ($library['updatedAt'] ?? '');
    $categoryRows = [];
    foreach ($library['categories'] as $index => $category) {
        $categoryRows[] = [
            'id' => $category['id'],
            'name' => $category['name'],
            'description' => (string) ($category['description'] ?? ''),
            'icon' => (string) ($category['icon'] ?? ''),
            'sort_order' => $index,
        ];
    }
    insert_batch($pdo, 'resource_categories', ['id', 'name', 'description', 'icon', 'sort_order'], $categoryRows);
    $topicRows = [];
    foreach ($library['topics'] as $index => $topic) {
        $topicRows[] = [
            'id' => $topic['id'],
            'name' => $topic['name'],
            'slug' => $topic['slug'],
            'sort_order' => $index,
        ];
    }
    insert_batch($pdo, 'resource_topics', ['id', 'name', 'slug', 'sort_order'], $topicRows);
    $itemRows = [];
    foreach ($library['items'] as $index => $item) {
        $itemRows[] = [
            'id' => $item['id'],
            'title' => $item['title'],
            'url' => $item['url'],
            'type' => (string) ($item['type'] ?? ''),
            'category_id' => $item['category'],
            'topics_json' => json_encode($item['topics'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'description' => (string) ($item['description'] ?? ''),
            'source' => (string) ($item['source'] ?? ''),
            'recommended' => !empty($item['recommended']) ? 1 : 0,
            'tags_json' => json_encode($item['tags'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'sort_order' => $index,
        ];
    }
    insert_batch($pdo, 'resource_items', [
        'id', 'title', 'url', 'type', 'category_id', 'topics_json', 'description', 'source',
        'recommended', 'tags_json', 'sort_order',
    ], $itemRows);

    $metaStmt = $pdo->prepare('INSERT INTO site_meta (meta_key, meta_value) VALUES (?, ?)');
    foreach ($meta as $key => $value) {
        $metaStmt->execute([$key, $value]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    fwrite(STDERR, "Seed failed: {$e->getMessage()}\n");
    exit(1);
}

echo "Seed finished.\n";
$exit = gtu_verify($pdo);
exit($exit);

function insert_batch(PDO $pdo, string $table, array $columns, array $rows, int $size = 250): void
{
    if (!$rows) {
        return;
    }
    $placeholder = '(' . implode(',', array_fill(0, count($columns), '?')) . ')';
    $columnSql = '`' . implode('`,`', $columns) . '`';
    foreach (array_chunk($rows, $size) as $chunk) {
        $sql = "INSERT INTO `{$table}` ({$columnSql}) VALUES " . implode(',', array_fill(0, count($chunk), $placeholder));
        $params = [];
        foreach ($chunk as $row) {
            foreach ($columns as $column) {
                $params[] = $row[$column];
            }
        }
        $pdo->prepare($sql)->execute($params);
    }
}
