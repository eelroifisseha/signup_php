<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

if (!isset($_SESSION['user_id'])) {
    set_flash('error', 'Log in first to access dashboard.');
    redirect('login.php');
}

$success = get_flash('success');
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="page">
    <section class="panel glass">
      <p class="eyebrow">Dashboard</p>
      <h1>Hello, <?= e($_SESSION['user_name'] ?? 'User') ?></h1>
      <p class="subtext">Your account is verified and authenticated.</p>

      <?php if ($success): ?>
        <div class="alert alert-success"><?= e($success) ?></div>
      <?php endif; ?>

      <div class="profile-box">
        <p><strong>Name:</strong> <?= e($_SESSION['user_name'] ?? '') ?></p>
        <p><strong>Email:</strong> <?= e($_SESSION['user_email'] ?? '') ?></p>
      </div>

      <a class="button-link" href="logout.php">Log out</a>
    </section>
  </main>
</body>
</html>
