<?php

require_once dirname(__DIR__) . '/database/db.php';
require_once __DIR__ . '/lib/GtuRepository.php';

set_exception_handler(static function (Throwable $e): void {
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['ok' => false, 'error' => 'Database is not ready.']);
    exit;
});

if (PHP_SAPI !== 'cli' && (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS')) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}

function gtu_json(mixed $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Cache-Control: public, max-age=120');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function gtu_repo(): GtuRepository
{
    static $repo = null;
    if ($repo === null) {
        $repo = new GtuRepository(gtu_pdo());
    }
    return $repo;
}

function gtu_course_param(): string
{
    $course = strtoupper(trim((string) ($_GET['course'] ?? '')));
    if (!preg_match('/^[A-Z0-9]{2}$/', $course)) {
        gtu_json(['error' => 'Pass course, for example ?course=BE'], 400);
    }
    return $course;
}
