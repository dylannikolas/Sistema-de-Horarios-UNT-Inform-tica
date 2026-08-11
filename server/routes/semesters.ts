import { Router, Request, Response } from 'express';
import pool from '../db';
import { ResultSetHeader } from 'mysql2';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM semesters ORDER BY start_date DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching semesters' });
    }
});

router.post('/', async (req, res) => {
    const { name, start_date, end_date, is_active } = req.body;
    try {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO semesters (name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)',
            [name, start_date, end_date, is_active ? 1 : 0]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: 'Error creating semester' });
    }
});

// UPDATE Semester
router.put('/:id', async (req, res) => {
    const { name, start_date, end_date, is_active } = req.body;
    try {
        await pool.query(
            'UPDATE semesters SET name = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ?',
            [name, start_date, end_date, is_active ? 1 : 0, req.params.id]
        );
        res.json({ message: 'Semester updated successfully' });
    } catch (error) {
        console.error('Error updating semester:', error);
        res.status(500).json({ error: 'Error updating semester' });
    }
});

// Endpoint special to set active semester
router.put('/:id/activate', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Deactivate all
        await connection.query('UPDATE semesters SET is_active = 0');
        // Activate specific
        await connection.query('UPDATE semesters SET is_active = 1 WHERE id = ?', [req.params.id]);
        await connection.commit();
        res.json({ message: 'Semester activated' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Error activating semester' });
    } finally {
        connection.release();
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM semesters WHERE id = ?', [req.params.id]);
        res.json({ message: 'Semester deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting semester' });
    }
});

export default router;
