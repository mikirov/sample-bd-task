const express = require('express');
const pool = require('../models/db');

const router = express.Router();

// Get list of all tables
router.get('/tables', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);

        const tables = result.rows.map(row => row.table_name);
        res.json(tables);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get data from a specific table
router.get('/table/:name', async (req, res) => {
    const tableName = req.params.name;

    try {
        const result = await pool.query(`SELECT * FROM ${tableName}`);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a specific field in the table
router.post('/table/:name/update', async (req, res) => {
    const { name } = req.params;
    const { id, field, value } = req.body;

    try {
        await pool.query(`UPDATE ${name} SET ${field} = $1 WHERE id = $2`, [value, id]);
        res.json({ message: 'Update successful' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
