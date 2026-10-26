<?php
/**
 * Copy this file to database/config.local.php and fill in the real values.
 * config.local.php is gitignored so Hostinger passwords stay off GitHub.
 *
 * Local XAMPP (this PC):
 *   host 127.0.0.1, database gtupedia, username root, password empty
 *
 * Hostinger (later):
 *   Use the MySQL database name, user, and password from hPanel.
 *   host is localhost when PHP runs on Hostinger.
 *   For seeding from this PC, use the remote MySQL hostname from hPanel
 *   and enable Remote MySQL for your IP.
 */
return [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'gtupedia',
    'username' => 'root',
    'password' => '',
];
