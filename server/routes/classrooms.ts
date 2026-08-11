import { Router } from 'express';
import pool from '../db';
import { ResultSetHeader } from 'mysql2';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM classrooms');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching classrooms' });
    }
});

router.post('/', async (req, res) => {
    const { name, type, capacity } = req.body;
    try {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO classrooms (name, type, capacity) VALUES (?, ?, ?)',
            [name, type, capacity]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Error creating classroom' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM classrooms WHERE id = ?', [req.params.id]);
        res.json({ message: 'Classroom deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting classroom' });
    }
});

export default router;
