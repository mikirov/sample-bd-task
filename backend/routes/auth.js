const express = require('express');
const jwt = require('jsonwebtoken');

const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

/**
 * @swagger
 * /api/refresh-token:
 *   post:
 *     summary: Refresh the JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: No token provided
 *       403:
 *         description: Token is invalid or expired
 */
router.post('/refresh-token', verifyToken, (req, res) => {
    const user = req.user;

    const newToken = jwt.sign({ username: user.username, id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token: newToken });
});

module.exports = router;
