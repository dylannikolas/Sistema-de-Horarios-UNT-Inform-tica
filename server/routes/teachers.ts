import { Router, Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// GET ALL Teachers
router.get('/', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT * FROM teachers');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET Single Teacher
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Teacher not found' });
            return;
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET Teacher Availability
router.get('/:id/availability', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM teacher_availability WHERE teacher_id = ?', [req.params.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST/UPDATE Teacher Availability
router.post('/:id/availability', async (req: Request, res: Response) => {
    const { availability } = req.body;
    const teacherId = req.params.id;

    try {
        // Primero, eliminar la disponibilidad anterior
        await pool.query('DELETE FROM teacher_availability WHERE teacher_id = ?', [teacherId]);

        // Luego, insertar la nueva disponibilidad
        if (availability && availability.length > 0) {
            const values = availability.map((slot: any) => [
                teacherId,
                slot.day,
                slot.hour,
                slot.is_optional ? 1 : 0
            ]);

            await pool.query(
                'INSERT INTO teacher_availability (teacher_id, day, hour, is_optional) VALUES ?',
                [values]
            );
        }

        res.json({ message: 'Availability saved successfully', count: availability.length });
    } catch (error) {
        console.error('Error saving availability:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// CREATE Teacher
router.post('/', async (req: Request, res: Response) => {
    const { name, email, category, code, avatar, max_hours, role } = req.body;
    try {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO teachers (name, email, category, code, avatar, max_hours, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, category, code, avatar, max_hours || 20, role || 'DOCENTE']
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Email or Code already exists' });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// UPDATE Teacher
router.put('/:id', async (req: Request, res: Response) => {
    const { name, email, category, code, avatar, max_hours, role } = req.body;
    try {
        await pool.query(
            'UPDATE teachers SET name = ?, email = ?, category = ?, code = ?, avatar = ?, max_hours = ?, role = ? WHERE id = ?',
            [name, email, category, code, avatar, max_hours, role, req.params.id]
        );
        res.json({ message: 'Teacher updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE Teacher
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM teachers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
