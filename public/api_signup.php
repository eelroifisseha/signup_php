<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../src/AuthService.php';

header('Content-Type: application/json; charset=utf-8');

if (!is_post()) {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed.']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);

if (!is_array($data)) {
    $data = $_POST;
}

$fullName = trim((string) ($data['full_name'] ?? ''));
$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');
$confirmPassword = (string) ($data['confirm_password'] ?? '');

if ($fullName === '' || $email === '' || $password === '' || $confirmPassword === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Full name, email, password, and confirm password are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Enter a valid email address.']);
    exit;
}

if (!is_strong_password($password)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Use 8+ chars with uppercase, lowercase, number, and special character.']);
    exit;
}

if ($password !== $confirmPassword) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Passwords do not match.']);
    exit;
}

$auth = new AuthService();
try {
    $existing = $auth->findUserByEmail($email);

    if ($existing && (bool) $existing['is_verified']) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'message' => 'An account already exists for this email.']);
        exit;
    }

    if ($existing) {
        $auth->updateUnverifiedUser((int) $existing['id'], $fullName, $password);
    } else {
        $auth->createUser($fullName, $email, $password);
    }

    $login = $auth->attemptLogin($email, $password);

    if (!$login['ok']) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Account created but automatic login failed.']);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'message' => 'Account created successfully.',
        'user' => [
            'full_name' => $fullName,
            'email' => $email,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Database connection failed. Check .env DB settings.']);
}
