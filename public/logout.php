<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

session_unset();
session_destroy();

session_start();
set_flash('success', 'You are now logged out.');
redirect('login.php');
