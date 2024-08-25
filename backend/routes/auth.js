const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');
const crypto = require('crypto');

const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request, e.g., user already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Check if the user already exists
        const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password using SHA-256
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        // Insert the new user into the database
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login to the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: For security reasons, must be the Sha256 hashed digest of the password input from the user
 *     responses:
 *       200:
 *         description: Successful login, returns JWT token
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        if (password !== user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: user.username, id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


/**
 * @swagger
 * /api/verify-token:
 *   get:
 *     summary: Verify if the provided JWT token is valid
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: No token provided
 *       403:
 *         description: Token is invalid or expired
 */
router.get('/verify-token', authenticateToken, (req, res) => {
    // If the middleware passed, the token is valid
    res.status(200).json({ valid: true, user: req.user });
});
module.exports = router;
