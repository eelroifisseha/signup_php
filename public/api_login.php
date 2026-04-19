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

$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');

if ($email === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Email and password are required.']);
    exit;
}

$auth = new AuthService();
try {
    $result = $auth->attemptLogin($email, $password);

    if (!$result['ok']) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'message' => $result['message']]);
        exit;
    }

    $user = $auth->findUserByEmail($email);

    echo json_encode([
        'ok' => true,
        'message' => 'Login successful.',
        'user' => [
            'full_name' => $user['full_name'] ?? '',
            'email' => $user['email'] ?? $email,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Database connection failed. Check .env DB settings.']);
}
