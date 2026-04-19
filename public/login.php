<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../src/AuthService.php';

$auth = new AuthService();

if (isset($_SESSION['user_id'])) {
    redirect('dashboard.php');
}

if (is_post()) {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        set_flash('error', 'Invalid request token. Refresh and try again.');
        redirect('login.php');
    }

    $email = strtolower(trim($_POST['email'] ?? ''));
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        set_flash('error', 'Email and password are required.');
        redirect('login.php');
    }

    $result = $auth->attemptLogin($email, $password);

    if (!$result['ok']) {
        set_flash('error', $result['message']);
        redirect('login.php');
    }

    set_flash('success', $result['message']);
    redirect('dashboard.php');
}

$error = get_flash('error');
$success = get_flash('success');
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="page">
    <section class="panel glass">
      <p class="eyebrow">Welcome Back</p>
      <h1>Log in</h1>
      <p class="subtext">Use your verified account credentials.</p>

      <?php if ($error): ?>
        <div class="alert alert-error"><?= e($error) ?></div>
      <?php endif; ?>

      <?php if ($success): ?>
        <div class="alert alert-success"><?= e($success) ?></div>
      <?php endif; ?>

      <form method="post" class="form">
        <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">

        <label>Email</label>
        <input type="email" name="email" placeholder="you@gmail.com" required>

        <label>Password</label>
        <div class="password-wrap">
          <input type="password" id="login_password" name="password" autocomplete="current-password" required>
          <button class="password-toggle" type="button" data-toggle-password="login_password" aria-label="Show password" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path class="icon-eye" d="M12 5c6.5 0 10.5 7 10.5 7s-4 7-10.5 7S1.5 12 1.5 12 5.5 5 12 5Zm0 2C8.1 7 5.1 10.2 3.9 12 5.1 13.8 8.1 17 12 17s6.9-3.2 8.1-5C18.9 10.2 15.9 7 12 7Zm0 2.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Z"/>
              <path class="icon-eye-off" d="M3.3 2.2 22 20.9l-1.4 1.4-3-3C16 20 14.1 20.5 12 20.5c-6.5 0-10.5-7-10.5-7a22.2 22.2 0 0 1 6.3-6.3L1.9 3.6l1.4-1.4Zm7.8 7.8a2.8 2.8 0 0 0 3.9 3.9l-3.9-3.9Zm.9-5c6.5 0 10.5 7 10.5 7a22 22 0 0 1-3.4 4l-1.4-1.4A18.2 18.2 0 0 0 20.1 12C18.9 10.2 15.9 7 12 7c-.9 0-1.7.1-2.5.3L7.8 5.6c1.3-.4 2.7-.6 4.2-.6Z"/>
            </svg>
          </button>
        </div>

        <button type="submit">Log In</button>
      </form>

      <p class="switch">No account yet? <a href="index.php">Sign up</a></p>
    </section>
  </main>
  <script src="assets/auth.js"></script>
</body>
</html>
