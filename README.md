# Signup PHP (No OTP)

Plain PHP authentication app with:
- Signup with email + password
- Immediate account activation (no OTP)
- Login using email + password
- Basic dashboard after authentication

## 1) Install dependencies (Ubuntu)

Run these commands in your terminal:

```bash
sudo apt-get update
sudo apt-get install -y php php-cli php-mysql php-mbstring php-xml php-curl unzip curl composer
```

Check versions:

```bash
php -v
composer -V
mysql --version
```

## 2) Install PHP packages

```bash
cd ../signup_php
composer install
```

## 3) Configure environment

Create `.env` from template:

```bash
cp .env.example .env
```

Edit `.env` DB values:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=signup_php
DB_USER=root
DB_PASS=
```

## 4) Create database tables

```bash
mysql -u signup_user -p signup_php < ../signup_php/sql/schema.sql
```

## 5) Start app

```bash
cd ../signup_php/public
php -S localhost:8000
```

Open:
- Signup: http://localhost:8000/index.php
- Login: http://localhost:8000/login.php

## Project structure

- `public/` web pages
- `src/AuthService.php` auth logic
- `config/database.php` PDO DB connection
- `sql/schema.sql` schema
