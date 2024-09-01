const express = require('express');
const pool = require('../models/db');
const router = express.Router();


/**
 * @swagger
 * /api/tables:
 *   get:
 *     summary: Get list of all tables in the database
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of tables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Internal server error
 */
router.get('/tables', async (req, res) => {
    console.log('Received request to get list of all tables');
    
    try {
        const [result] = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);
        console.log('Successfully retrieved table names');

        const tables = result.map(row => row.table_name);
        res.json(tables);
    } catch (error) {
        console.error('Error retrieving table names:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/tables:
 *   post:
 *     summary: Create a new table
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tableName:
 *                 type: string
 *                 example: "products"
 *               columns:
 *                 type: object
 *                 description: Columns with their SQL types
 *                 example: { "id": "INT PRIMARY KEY AUTO_INCREMENT", "name": "VARCHAR(255)" }
 *     responses:
 *       201:
 *         description: Table created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/tables', async (req, res) => {
    const { tableName, columns } = req.body;

    if (!tableName || !columns || typeof columns !== 'object') {
        return res.status(400).json({ error: 'Invalid table name or columns' });
    }

    const columnsSql = Object.entries(columns).map(([column, type]) => `\`${column}\` ${type}`).join(', ');

    try {
        const query = `CREATE TABLE \`${tableName}\` (${columnsSql})`;
        await pool.query(query);
        res.status(201).json({ message: `Table ${tableName} created successfully` });
    } catch (error) {
        console.error(`Error creating table ${tableName}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/table/{name}:
 *   delete:
 *     summary: Delete a table
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the table to delete
 *     responses:
 *       200:
 *         description: Table deleted successfully
 *       500:
 *         description: Internal server error
 */
router.delete('/table/:name', async (req, res) => {
    const tableName = req.params.name;

    try {
        const query = `DROP TABLE \`${tableName}\``;
        await pool.query(query);
        res.status(200).json({ message: `Table ${tableName} deleted successfully` });
    } catch (error) {
        console.error(`Error deleting table ${tableName}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
