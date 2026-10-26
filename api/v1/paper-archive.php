<?php

const GTU_EXAM_SESSIONS = [
    ['S2026', 'Summer 2026'],
    ['W2025', 'Winter 2025'],
    ['S2025', 'Summer 2025'],
    ['W2024', 'Winter 2024'],
    ['S2024', 'Summer 2024'],
    ['W2023', 'Winter 2023'],
    ['S2023', 'Summer 2023'],
    ['W2022', 'Winter 2022'],
    ['S2022', 'Summer 2022'],
    ['W2021', 'Winter 2021'],
    ['S2021', 'Summer 2021'],
    ['W2020', 'Winter 2020'],
    ['S2020', 'Summer 2020'],
    ['W2019', 'Winter 2019'],
    ['S2019', 'Summer 2019'],
    ['W2018', 'Winter 2018'],
    ['S2018', 'Summer 2018'],
    ['W2017', 'Winter 2017'],
    ['W2016', 'Winter 2016'],
];

const GTU_ARCHIVE_COURSES = ['BE', 'DI', 'BB', 'BC', 'MB', 'MC', 'BP'];
const GTU_ARCHIVE_TTL = 604800;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=3600');

$course = strtoupper(trim((string) ($_GET['course'] ?? '')));
$rawCodes = preg_split('/[,\s]+/', (string) ($_GET['code'] ?? '')) ?: [];
$codes = [];
foreach ($rawCodes as $code) {
    $code = strtoupper(trim($code));
    if ($code === '' || !preg_match('/^[A-Z0-9_-]{3,24}$/', $code)) {
        continue;
    }
    $codes[$code] = $code;
    if (count($codes) >= 6) {
        break;
    }
}
$codes = array_values($codes);

if (!in_array($course, GTU_ARCHIVE_COURSES, true) || !$codes) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Choose a course and subject code.']);
    exit;
}

$papers = [];
$rank = [];
foreach (GTU_EXAM_SESSIONS as $index => [$session]) {
    $rank[$session] = $index;
}

foreach ($codes as $code) {
    $sessions = gtu_archive_sessions($course, $code);
    foreach ($sessions as $session) {
        $label = gtu_archive_label($session);
        if ($label === null || isset($papers[$session])) {
            continue;
        }
        $papers[$session] = [
            'label' => $label,
            'session' => $session,
            'code' => $code,
            'url' => 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/' . $session . '/' . $course . '/' . rawurlencode($code) . '.pdf',
        ];
    }
}

$list = array_values($papers);
usort($list, static function (array $a, array $b) use ($rank): int {
    return ($rank[$a['session']] ?? 99) <=> ($rank[$b['session']] ?? 99);
});

echo json_encode(['ok' => true, 'papers' => $list], JSON_UNESCAPED_SLASHES);

function gtu_archive_label(string $session): ?string
{
    foreach (GTU_EXAM_SESSIONS as [$id, $label]) {
        if ($id === $session) {
            return $label;
        }
    }
    return null;
}

function gtu_archive_cache_path(string $course, string $code): string
{
    return dirname(__DIR__, 2) . '/cache/paper-archive/' . $course . '/' . $code . '.json';
}

function gtu_archive_sessions(string $course, string $code): array
{
    $path = gtu_archive_cache_path($course, $code);
    if (is_file($path) && (time() - (int) filemtime($path)) < GTU_ARCHIVE_TTL) {
        $cached = json_decode((string) file_get_contents($path), true);
        if (is_array($cached['sessions'] ?? null)) {
            return $cached['sessions'];
        }
    }

    $found = gtu_archive_probe($course, $code);
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    if (is_dir($dir) && is_writable($dir)) {
        @file_put_contents($path, json_encode(['sessions' => $found, 'checkedAt' => gmdate('c')]));
    }
    return $found;
}

function gtu_archive_probe(string $course, string $code): array
{
    if (!function_exists('curl_multi_init')) {
        return [];
    }

    $multi = curl_multi_init();
    $handles = [];
    foreach (GTU_EXAM_SESSIONS as [$session]) {
        $url = 'https://www.gtu.ac.in/api/v1/question-papers/archive/?session=' . rawurlencode($session)
            . '&course=' . rawurlencode($course)
            . '&subject_code=' . rawurlencode($code);
        $handle = curl_init($url);
        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT => 'GTUPEDIA paper archive',
        ]);
        curl_multi_add_handle($multi, $handle);
        $handles[$session] = $handle;
    }

    $running = null;
    do {
        $status = curl_multi_exec($multi, $running);
        if ($running) {
            curl_multi_select($multi, 1.0);
        }
    } while ($running && $status === CURLM_OK);

    $found = [];
    foreach ($handles as $session => $handle) {
        $body = curl_multi_getcontent($handle);
        $data = json_decode(is_string($body) ? $body : '', true);
        if (!empty($data['success']) && !empty($data['data']['file_url'])) {
            $found[] = $session;
        }
        curl_multi_remove_handle($multi, $handle);
        curl_close($handle);
    }
    curl_multi_close($multi);
    return $found;
}
