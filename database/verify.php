<?php

require_once __DIR__ . '/db.php';
require_once dirname(__DIR__) . '/api/lib/GtuRepository.php';

if (PHP_SAPI === 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    exit(gtu_verify(gtu_pdo()));
}

function gtu_verify(PDO $pdo): int
{
    $repo = new GtuRepository($pdo);
    $failures = [];

    $subjectFiles = [
        'BE' => 'data/be-subjects.json',
        'BB' => 'data/bb-subjects.json',
        'BC' => 'data/bc-subjects.json',
        'MB' => 'data/mb-subjects.json',
        'MC' => 'data/mc-subjects.json',
        'BP' => 'data/bp-subjects.json',
        'DI' => 'data/di-subjects.json',
    ];
    foreach ($subjectFiles as $course => $file) {
        $expected = gtu_read_json($file);
        $actual = $repo->subjectsForCourse($course);
        if ($expected !== $actual) {
            $failures[] = gtu_diff_message("subjects {$course}", $expected, $actual);
        } else {
            echo "OK  {$course} subjects (" . count($actual) . ")\n";
        }
    }

    $expectedCatalog = gtu_read_json('data/catalog.json');
    $actualCatalog = $repo->catalogDocument();
    if (($expectedCatalog['catalogBuiltAt'] ?? null) !== ($actualCatalog['catalogBuiltAt'] ?? null)) {
        $failures[] = 'catalogBuiltAt does not match';
    }
    if (($expectedCatalog['courseStats'] ?? null) !== ($actualCatalog['courseStats'] ?? null)) {
        $failures[] = 'courseStats does not match ' . json_encode($actualCatalog['courseStats']);
    } else {
        echo "OK  courseStats\n";
    }
    $expectedCodes = array_map(static fn ($set) => [$set['exam'], $set['courseCode'] ?? 'BE', $set['codes']], $expectedCatalog['examPapers']);
    $actualCodes = array_map(static fn ($set) => [$set['exam'], $set['courseCode'], $set['codes']], $actualCatalog['examPapers']);
    if ($expectedCodes !== $actualCodes) {
        $failures[] = 'exam paper code lists do not match';
    } else {
        $totalCodes = array_sum(array_map(static fn ($set) => count($set['codes']), $actualCatalog['examPapers']));
        echo "OK  exam paper codes ({$totalCodes} across " . count($actualCatalog['examPapers']) . " sets)\n";
    }
    $expectedCourses = array_map(static function ($course) {
        return [$course['code'], $course['name'], $course['branches'] ?? []];
    }, $expectedCatalog['courses']);
    $actualCourses = array_map(static function ($course) {
        return [$course['code'], $course['name'], $course['branches'] ?? []];
    }, $actualCatalog['courses']);
    if ($expectedCourses !== $actualCourses) {
        $failures[] = 'courses and branches do not match';
    } else {
        echo "OK  courses and branches (" . count($actualCourses) . " courses)\n";
    }

    $expectedSearch = gtu_read_json('data/search-index.json');
    $actualSearch = $repo->searchIndex();
    if (count($expectedSearch['entries']) !== count($actualSearch['entries'])) {
        $failures[] = 'search index count ' . count($actualSearch['entries']) . ' != ' . count($expectedSearch['entries']);
    } elseif ($expectedSearch['entries'] !== $actualSearch['entries']) {
        $failures[] = gtu_diff_message('search index', $expectedSearch['entries'], $actualSearch['entries']);
    } else {
        echo "OK  search index (" . count($actualSearch['entries']) . ")\n";
    }

    $documents = [
        'team' => [$repo->teamDocument(), gtu_read_json('data/team.json')],
        'events' => [$repo->eventsDocument(), gtu_read_json('data/events.json')],
        'internships' => [$repo->internshipsDocument(), gtu_read_json('data/internships.json')],
        'partners' => [$repo->partnersDocument(), gtu_read_json('data/partners.json')],
        'library' => [$repo->libraryDocument(), gtu_read_json('resources/data/library.json')],
    ];
    foreach ($documents as $name => [$actual, $expected]) {
        if ($actual !== $expected) {
            $failures[] = gtu_diff_message($name, $expected, $actual);
        } else {
            echo "OK  {$name}\n";
        }
    }

    $bePapers = $repo->papersDocument('BE');
    echo "OK  BE papers API subjects with PDFs: {$bePapers['count']}\n";

    if ($failures) {
        fwrite(STDERR, "\nVerification failed:\n- " . implode("\n- ", $failures) . "\n");
        return 1;
    }

    echo "\nLocal database matches the JSON catalogue.\n";
    return 0;
}

function gtu_diff_message(string $label, mixed $expected, mixed $actual): string
{
    if (is_array($expected) && is_array($actual) && array_is_list($expected) && array_is_list($actual)) {
        $limit = min(count($expected), count($actual));
        for ($i = 0; $i < $limit; $i++) {
            if ($expected[$i] !== $actual[$i]) {
                return $label . " differs at index {$i}\n  json: " . gtu_preview($expected[$i]) . "\n  db:   " . gtu_preview($actual[$i]);
            }
        }
        return $label . ' length ' . count($actual) . ' != ' . count($expected);
    }
    return $label . " does not match\n  json: " . gtu_preview($expected) . "\n  db:   " . gtu_preview($actual);
}

function gtu_preview(mixed $value): string
{
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return get_debug_type($value);
    }
    return strlen($json) > 500 ? substr($json, 0, 500) . '…' : $json;
}
