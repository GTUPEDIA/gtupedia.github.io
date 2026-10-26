<?php

require __DIR__ . '/bootstrap.php';

try {
    $counts = gtu_repo()->counts();
    $error = null;
} catch (Throwable $e) {
    $counts = null;
    $error = 'Database is not ready. From the project folder run: C:\\xampp\\php\\php.exe database\\seed.php';
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$links = [
    'Catalog' => 'v1/catalog.php',
    'BE subjects' => 'v1/subjects.php?course=BE',
    'BE branches' => 'v1/branches.php?course=BE',
    'Search index' => 'v1/search.php',
    'BE papers' => 'v1/papers.php?course=BE',
    'Papers catalog' => 'v1/papers-catalog.php',
    'Team' => 'v1/team.php',
    'Events' => 'v1/events.php',
    'Internships' => 'v1/internships.php',
    'Partners' => 'v1/partners.php',
    'Library' => 'v1/library.php',
    'Health JSON' => 'health.php',
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GTUPEDIA database status</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem auto; max-width: 46rem; color: #1f2328; line-height: 1.45; }
    h1 { font-size: 1.6rem; margin-bottom: 0.3rem; }
    p { margin-top: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0 1.5rem; }
    th, td { text-align: left; padding: 0.35rem 0.5rem; border-bottom: 1px solid #d0d7de; }
    th { font-size: 0.85rem; letter-spacing: 0.02em; }
    a { color: #0969da; }
    .error { background: #fff1f0; border: 1px solid #ffccc7; padding: 0.8rem 1rem; }
    code { font-family: ui-monospace, Consolas, monospace; font-size: 0.92em; }
  </style>
</head>
<body>
  <h1>GTUPEDIA local database</h1>
  <?php if ($error): ?>
    <p class="error"><?= h($error) ?></p>
  <?php else: ?>
    <p>Connected to <code><?= h($counts['database']) ?></code> on <code><?= h($counts['host']) ?></code>. Catalogue built <?= h((string) $counts['catalogBuiltAt']) ?>.</p>
    <table>
      <thead><tr><th>Table</th><th>Rows</th></tr></thead>
      <tbody>
        <?php foreach ($counts['tables'] as $table => $rows): ?>
          <tr><td><?= h($table) ?></td><td><?= (int) $rows ?></td></tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <h2>Subjects by course</h2>
    <table>
      <thead><tr><th>Course</th><th>Subjects</th></tr></thead>
      <tbody>
        <?php foreach ($counts['subjectsByCourse'] as $course => $rows): ?>
          <tr><td><?= h($course) ?></td><td><?= (int) $rows ?></td></tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>
  <h2>API</h2>
  <ul>
    <?php foreach ($links as $label => $href): ?>
      <li><a href="<?= h($href) ?>"><?= h($label) ?></a></li>
    <?php endforeach; ?>
  </ul>
</body>
</html>
