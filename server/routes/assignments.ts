import express from 'express';
import db from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// GET all assignments (optionally filter by semester_id, teacher_id, classroom_id)
router.get('/', async (req, res) => {
    const { semester_id, teacher_id, classroom_id } = req.query;
    try {
        let query = `
      SELECT a.*, a.day_of_week + 0 AS dow_idx,
             c.name as course_name, c.code as course_code, c.cycle, c.cycle_number,
             t.name as teacher_name,
             r.name as classroom_name, r.type as classroom_type
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN teachers t ON a.teacher_id = t.id
      JOIN classrooms r ON a.classroom_id = r.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (semester_id) {
            query += ' AND a.semester_id = ?';
            params.push(semester_id);
        } else {
            query += ' AND a.semester_id = (SELECT id FROM semesters WHERE is_active = 1 LIMIT 1)';
        }
        if (teacher_id) {
            query += ' AND a.teacher_id = ?';
            params.push(teacher_id);
        }
        if (classroom_id) {
            query += ' AND a.classroom_id = ?';
            params.push(classroom_id);
        }

        query += ' ORDER BY a.day_of_week, a.start_time';

        const [rows] = await db.query<RowDataPacket[]>(query, params);
        const formatted = rows.map(r => ({
            ...r,
            day_of_week: DAY_NAMES[(Number(r.dow_idx) || 1) - 1] || r.day_of_week,
        }));
        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching assignments' });
    }
});

// POST create assignment with CONFLICT DETECTION
router.post('/', async (req, res) => {
    const { semester_id, course_id, teacher_id, classroom_id, day_of_week, start_time, end_time } = req.body;

    if (!semester_id || !course_id || !teacher_id || !classroom_id || !day_of_week || !start_time || !end_time) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // 1. Check for CLASSROOM conflict
        const [roomConflicts] = await db.query<RowDataPacket[]>(
            `SELECT * FROM assignments 
       WHERE semester_id = ? AND classroom_id = ? AND day_of_week = ? 
       AND (
         (start_time <= ? AND end_time > ?) OR -- Overlaps start
         (start_time < ? AND end_time >= ?) OR -- Overlaps end
         (start_time >= ? AND end_time <= ?)   -- Inside
       )`,
            [semester_id, classroom_id, day_of_week, start_time, start_time, end_time, end_time, start_time, end_time]
        );

        if (roomConflicts.length > 0) {
            return res.status(409).json({
                message: 'Conflicto de Aula: El ambiente ya está ocupado en ese horario.',
                conflictType: 'CLASSROOM'
            });
        }

        // 2. Check for TEACHER conflict
        const [teacherConflicts] = await db.query<RowDataPacket[]>(
            `SELECT * FROM assignments 
       WHERE semester_id = ? AND teacher_id = ? AND day_of_week = ? 
       AND (
         (start_time <= ? AND end_time > ?) OR 
         (start_time < ? AND end_time >= ?) OR 
         (start_time >= ? AND end_time <= ?)
       )`,
            [semester_id, teacher_id, day_of_week, start_time, start_time, end_time, end_time, start_time, end_time]
        );

        if (teacherConflicts.length > 0) {
            return res.status(409).json({
                message: 'Conflicto Docente: El docente ya tiene clase asignada en ese horario.',
                conflictType: 'TEACHER'
            });
        }

        // 3. Create Assignment
        const [result] = await db.query<ResultSetHeader>(
            `INSERT INTO assignments (semester_id, course_id, teacher_id, classroom_id, day_of_week, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [semester_id, course_id, teacher_id, classroom_id, day_of_week, start_time, end_time]
        );

        res.status(201).json({ id: result.insertId, message: 'Asignación creada exitosamente' });

    } catch (error) {
        console.error("Error creating assignment:", error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// DELETE assignment
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM assignments WHERE id = ?', [id]);
        res.json({ message: 'Asignación eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting assignment' });
    }
});

export default router;
