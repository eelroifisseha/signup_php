<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../src/AuthService.php';

$auth = new AuthService();
$email = strtolower(trim($_GET['email'] ?? $_POST['email'] ?? ''));

if (is_post()) {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        set_flash('error', 'Invalid request token. Refresh and try again.');
        redirect('verify.php?email=' . urlencode($email));
    }

    $otp = trim($_POST['otp'] ?? '');

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        set_flash('error', 'Enter a valid email.');
        redirect('verify.php');
    }

    if (!preg_match('/^\d{6}$/', $otp)) {
        set_flash('error', 'OTP must be a 6-digit number.');
        redirect('verify.php?email=' . urlencode($email));
    }

    $result = $auth->verifyOtp($email, $otp);

    if (!$result['ok']) {
        set_flash('error', $result['message']);
        redirect('verify.php?email=' . urlencode($email));
    }

    set_flash('success', $result['message']);
    redirect('login.php');
}

$error = get_flash('error');
$success = get_flash('success');
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify OTP</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="page">
    <section class="panel glass">
      <p class="eyebrow">Email Verification</p>
      <h1>Enter your OTP</h1>
      <p class="subtext">We sent a 6-digit code to your inbox. It expires in 5 minutes.</p>

      <?php if ($error): ?>
        <div class="alert alert-error"><?= e($error) ?></div>
      <?php endif; ?>

      <?php if ($success): ?>
        <div class="alert alert-success"><?= e($success) ?></div>
      <?php endif; ?>

      <form method="post" class="form">
        <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">

        <label>Email</label>
        <input type="email" name="email" value="<?= e($email) ?>" required>

        <label>OTP Code</label>
        <input type="text" name="otp" maxlength="6" pattern="\d{6}" placeholder="123456" required>

        <button type="submit">Verify & Activate Account</button>
      </form>

      <p class="switch"><a href="index.php">Back to signup</a></p>
    </section>
  </main>
</body>
</html>
