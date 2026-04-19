<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/../config/database.php';

class AuthService
{
    public function findUserByEmail(string $email): ?array
    {
        $stmt = db()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => strtolower(trim($email))]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    public function createUser(string $fullName, string $email, string $password): int
    {
        $stmt = db()->prepare(
            'INSERT INTO users (full_name, email, password_hash, is_verified, email_verified_at) VALUES (:full_name, :email, :password_hash, 1, NOW())'
        );

        $stmt->execute([
            'full_name' => trim($fullName),
            'email' => strtolower(trim($email)),
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ]);

        return (int) db()->lastInsertId();
    }

    public function updateUnverifiedUser(int $userId, string $fullName, string $password): void
    {
        $stmt = db()->prepare(
            'UPDATE users
             SET full_name = :full_name,
                 password_hash = :password_hash,
                 is_verified = 1,
                 email_verified_at = NOW(),
                 updated_at = NOW()
             WHERE id = :id AND is_verified = 0'
        );

        $stmt->execute([
            'id' => $userId,
            'full_name' => trim($fullName),
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ]);
    }

    public function createOtp(int $userId): string
    {
        $this->invalidateActiveOtps($userId);

        $otp = (string) random_int(100000, 999999);
        $otpHash = password_hash($otp, PASSWORD_DEFAULT);

        $stmt = db()->prepare(
            'INSERT INTO email_otps (user_id, otp_hash, expires_at) VALUES (:user_id, :otp_hash, DATE_ADD(NOW(), INTERVAL 5 MINUTE))'
        );

        $stmt->execute([
            'user_id' => $userId,
            'otp_hash' => $otpHash,
        ]);

        return $otp;
    }

    public function verifyOtp(string $email, string $otp): array
    {
        $user = $this->findUserByEmail($email);

        if (!$user) {
            return ['ok' => false, 'message' => 'No account found for this email.'];
        }

        $stmt = db()->prepare(
            'SELECT * FROM email_otps
             WHERE user_id = :user_id
               AND used_at IS NULL
             ORDER BY id DESC
             LIMIT 1'
        );
        $stmt->execute(['user_id' => $user['id']]);
        $otpRow = $stmt->fetch();

        if (!$otpRow) {
            return ['ok' => false, 'message' => 'No active OTP found. Please sign up again.'];
        }

        if (strtotime($otpRow['expires_at']) < time()) {
            return ['ok' => false, 'message' => 'OTP expired. Please sign up again.'];
        }

        if (!password_verify(trim($otp), $otpRow['otp_hash'])) {
            return ['ok' => false, 'message' => 'Invalid OTP code.'];
        }

        db()->beginTransaction();

        try {
            $markOtp = db()->prepare('UPDATE email_otps SET used_at = NOW() WHERE id = :id');
            $markOtp->execute(['id' => $otpRow['id']]);

            $verifyUser = db()->prepare(
                'UPDATE users SET is_verified = 1, email_verified_at = NOW(), updated_at = NOW() WHERE id = :id'
            );
            $verifyUser->execute(['id' => $user['id']]);

            db()->commit();

            return ['ok' => true, 'message' => 'Email verified successfully. You can now log in.'];
        } catch (Throwable $e) {
            db()->rollBack();
            return ['ok' => false, 'message' => 'Could not verify OTP right now. Try again.'];
        }
    }

    public function attemptLogin(string $email, string $password): array
    {
        $user = $this->findUserByEmail($email);

        if (!$user) {
            return ['ok' => false, 'message' => 'Invalid email or password.'];
        }

        if (!(bool) $user['is_verified']) {
            return ['ok' => false, 'message' => 'Account is not active yet. Please sign up again.'];
        }

        if (!password_verify($password, $user['password_hash'])) {
            return ['ok' => false, 'message' => 'Invalid email or password.'];
        }

        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['user_name'] = $user['full_name'];
        $_SESSION['user_email'] = $user['email'];

        return ['ok' => true, 'message' => 'Logged in successfully.'];
    }

    public function sendOtpEmail(string $toEmail, string $toName, string $otp): bool
    {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = env('MAIL_HOST', 'smtp.gmail.com');
            $mail->Port = (int) env('MAIL_PORT', '587');
            $mail->SMTPAuth = true;
            $mail->Username = env('MAIL_USERNAME');
            $mail->Password = env('MAIL_PASSWORD');
            $mail->SMTPSecure = env('MAIL_ENCRYPTION', 'tls');

            $mail->setFrom(env('MAIL_FROM_ADDRESS', env('MAIL_USERNAME', '')), env('MAIL_FROM_NAME', 'Signup OTP'));
            $mail->addAddress($toEmail, $toName);

            $mail->isHTML(true);
            $mail->Subject = 'Your OTP Code';
            $mail->Body = '<p>Your OTP is <strong style="font-size:22px;letter-spacing:2px;">' . e($otp) . '</strong>.</p>'
                . '<p>It expires in 5 minutes and can only be used once.</p>';
            $mail->AltBody = 'Your OTP is ' . $otp . '. It expires in 5 minutes and can only be used once.';

            return $mail->send();
        } catch (Exception $e) {
            $this->logError('MAIL_ERROR: ' . $e->getMessage());
            return false;
        }
    }

    private function invalidateActiveOtps(int $userId): void
    {
        $stmt = db()->prepare('UPDATE email_otps SET used_at = NOW() WHERE user_id = :user_id AND used_at IS NULL');
        $stmt->execute(['user_id' => $userId]);
    }

    private function logError(string $message): void
    {
        $logFile = dirname(__DIR__) . '/storage/logs/app.log';
        $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
        file_put_contents($logFile, $line, FILE_APPEND);
    }
}
