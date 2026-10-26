<?php

function gtu_root(): string
{
    return dirname(__DIR__);
}

function gtu_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $config = require __DIR__ . '/config.example.php';
    $local = __DIR__ . '/config.local.php';
    if (is_file($local)) {
        $config = array_merge($config, require $local);
    }

    $envMap = [
        'GTU_DB_HOST' => 'host',
        'GTU_DB_PORT' => 'port',
        'GTU_DB_NAME' => 'database',
        'GTU_DB_USER' => 'username',
        'GTU_DB_PASSWORD' => 'password',
    ];
    foreach ($envMap as $env => $key) {
        $value = getenv($env);
        if ($value !== false && $value !== '') {
            $config[$key] = $key === 'port' ? (int) $value : $value;
        }
    }

    if (!preg_match('/^[A-Za-z0-9_]+$/', (string) $config['database'])) {
        throw new RuntimeException('Database name may only contain letters, numbers, and underscores.');
    }

    return $config;
}

function gtu_pdo_options(): array
{
    return [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
    ];
}

function gtu_server_pdo(): PDO
{
    $c = gtu_config();
    $dsn = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $c['host'], (int) $c['port']);
    return new PDO($dsn, $c['username'], $c['password'], gtu_pdo_options());
}

function gtu_pdo(): PDO
{
    $c = gtu_config();
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $c['host'],
        (int) $c['port'],
        $c['database']
    );
    return new PDO($dsn, $c['username'], $c['password'], gtu_pdo_options());
}

function gtu_read_json(string $relativePath): mixed
{
    $path = gtu_root() . '/' . ltrim($relativePath, '/');
    if (!is_file($path)) {
        throw new RuntimeException("Missing JSON file: {$relativePath}");
    }
    $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    return $data;
}

function gtu_sql_statements(string $sql): array
{
    $sql = preg_replace('/^\s*--.*$/m', '', $sql) ?? $sql;
    $parts = preg_split('/;\s*(?:\r?\n|$)/', $sql) ?: [];
    $statements = [];
    foreach ($parts as $part) {
        $part = trim($part);
        if ($part !== '') {
            $statements[] = $part;
        }
    }
    return $statements;
}
