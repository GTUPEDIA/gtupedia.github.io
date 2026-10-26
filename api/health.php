<?php

require __DIR__ . '/bootstrap.php';

try {
    gtu_json(gtu_repo()->counts());
} catch (Throwable $e) {
    gtu_json(['ok' => false, 'error' => 'Database is not ready. Run database/seed.php locally first.'], 500);
}
