# Usage
Firstly, In order to install dependencies run:
```
cd backend
npm run install
```
In order to setup the local mysql database log in using:
```
mysql -u root -p
```
Then create a sample database, user and table:
```
CREATE DATABASE mydatabase;
CREATE USER 'myuser'@'localhost' IDENTIFIED BY 'mypassword';
GRANT ALL PRIVILEGES ON mydatabase.* TO 'myuser'@'localhost';
FLUSH PRIVILEGES;
USE mydatabase;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(64) NOT NULL,  -- Assuming SHA-256 hash, which produces a 64-character string
    name VARCHAR(100),
    email VARCHAR(100),
    regdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    comment TEXT
);
INSERT INTO users (username, password, name, email)
VALUES ('johndoe', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'John Doe', 'johndoe@example.com');
exit;
```
NOTE: `'5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'` is the SHA-256 hash for the string "password".
Then create a .env file with the neccessary variables:
```
cp .env.example .env
```
Set up the MYSQL_PUBLIC_URL as:
```
mysql://myuser:mypassword@localhost:3306/mydatabase
```
Finally, you can run the project locally using:
```
npm run start
```
You can log in using the credentials `johndoe`, `password` and `users`

# Deploy server to heroku:
- There is an automatic build pipeline on push to heroku main. You can do that using:
```
git push heroku main
```

