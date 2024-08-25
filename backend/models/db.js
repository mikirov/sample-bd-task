const mysql = require('mysql2/promise');
require('dotenv').config();
const url = require('url');

// Get the connection URL from environment variables
const connectionUrl = process.env.MYSQL_PUBLIC_URL;

if (!connectionUrl) {
    throw new Error('MYSQL_PUBLIC_URL environment variable is not defined');
}

// Parse the connection URL
const parsedUrl = url.parse(connectionUrl);

const [username, password] = parsedUrl.auth.split(':');
const host = parsedUrl.hostname;
const port = parsedUrl.port || 3306; // Default to 3306 if the port is not specified
const database = parsedUrl.pathname.replace('/', '');

// Create a MySQL connection pool
const pool = mysql.createPool({
    host,
    user: username,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = pool;
