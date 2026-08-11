import { Router } from 'express';
import pool from '../db';
import { ResultSetHeader } from 'mysql2';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM courses');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching courses' });
    }
});

router.post('/', async (req, res) => {
    const { code, name, cycle, credits, hours_per_week } = req.body;
    try {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES (?, ?, ?, ?, ?)',
            [code, name, cycle, credits, hours_per_week]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating course' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        res.json({ message: 'Course deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting course' });
    }
});

export default router;
