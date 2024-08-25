const express = require('express');
const pool = require('../models/db');
const authenticateToken = require('../middleware/authenticateToken');
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
router.post('/tables', authenticateToken, async (req, res) => {
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
 *   get:
 *     summary: Get data from a specific table with pagination and filtering
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the table
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *       - in: query
 *         name: [field_name]
 *         schema:
 *           type: string
 *         description: Filter records by the specified field
 *     responses:
 *       200:
 *         description: A list of records from the table
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Internal server error
 */
router.get('/table/:name', async (req, res) => {
    const tableName = req.params.name;
    const { page = 1, limit = 10, ...filters } = req.query;

    try {
        const filterKeys = Object.keys(filters);
        const filterConditions = filterKeys.map(key => `\`${key}\` LIKE ? COLLATE utf8mb4_general_ci`);
        const filterValues = filterKeys.map(key => `%${filters[key]}%`);

        const offset = (page - 1) * limit;

        let query = `SELECT * FROM \`${tableName}\``;
        if (filterKeys.length > 0) {
            query += ` WHERE ${filterConditions.join(' AND ')}`;
        }
        query += ` ORDER BY id LIMIT ? OFFSET ?`;

        const values = [...filterValues, parseInt(limit, 10), parseInt(offset, 10)];

        const [result] = await pool.query(query, values);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching table data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/table/{name}/update/{id}:
 *   put:
 *     summary: Update a specific field in the table
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the table
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the record to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Update successful
 *       404:
 *         description: Record not found
 *       500:
 *         description: Internal server error
 */
router.put('/table/:name/update/:id', authenticateToken, async (req, res) => {
    const tableName = req.params.name;
    const { id } = req.params;
    const { field, value } = req.body;

    try {
        const query = `UPDATE \`${tableName}\` SET \`${field}\` = ? WHERE id = ?`;
        const [result] = await pool.query(query, [value, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.status(200).json({ message: 'Update successful' });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/table/{name}/add:
 *   post:
 *     summary: Add a new record to the table
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the table
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               type: string
 *     responses:
 *       201:
 *         description: Record added successfully
 *       500:
 *         description: Internal server error
 */
router.post('/table/:name/add', authenticateToken, async (req, res) => {
    const tableName = req.params.name;
    const rowData = req.body;

    try {
        const fields = Object.keys(rowData).map(field => `\`${field}\``).join(', ');
        const values = Object.values(rowData);
        const placeholders = values.map(() => '?').join(', ');

        const query = `INSERT INTO \`${tableName}\` (${fields}) VALUES (${placeholders})`;
        const [result] = await pool.query(query, values);

        res.status(201).json({ message: 'Record added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/table/{name}/delete/{id}:
 *   delete:
 *     summary: Delete a record from the table by ID
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the table
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the record to delete
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 *       500:
 *         description: Internal server error
 */
router.delete('/table/:name/delete/:id', authenticateToken, async (req, res) => {
    const tableName = req.params.name;
    const { id } = req.params;

    try {
        const query = `DELETE FROM \`${tableName}\` WHERE id = ?`;
        const [result] = await pool.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
