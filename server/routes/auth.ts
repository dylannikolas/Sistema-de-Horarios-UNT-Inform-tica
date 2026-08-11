import { Router, Request, Response } from 'express';
import pool from '../db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key-change-me';

router.post('/register', async (req: Request, res: Response) => {
    const { name, code, email, category, password, role } = req.body;

    if (!email || !password || !name || !role) {
        res.status(400).json({ error: 'Faltan campos obligatorios' });
        return;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificar si el usuario ya existe
        const [existingUsers] = await connection.query<RowDataPacket[]>('SELECT id FROM users WHERE username = ?', [email]);
        if (existingUsers.length > 0) {
            await connection.rollback();
            res.status(409).json({ error: 'El usuario ya existe' });
            return;
        }

        let teacherId: number | null = null;

        // 2. Si es docente, crear o vincular registro en tabla teachers
        if (role === 'DOCENTE') {
            // Verificar si ya existe el docente por código
            const [existingTeachers] = await connection.query<RowDataPacket[]>('SELECT id FROM teachers WHERE code = ?', [code]);

            if (existingTeachers.length > 0) {
                teacherId = existingTeachers[0].id;
            } else {
                // Crear nuevo docente
                // Let DB handle ID generation (AUTO_INCREMENT)
                const [result] = await connection.query<any>(
                    'INSERT INTO teachers (name, email, code, category, max_hours, role) VALUES (?, ?, ?, ?, ?, ?)',
                    [name, email, code, category || 'Contratado', 20, 'DOCENTE']
                );
                teacherId = result.insertId;
            }
        }

        // 3. Crear Usuario
        // Let DB handle ID generation (AUTO_INCREMENT)
        const [userResult] = await connection.query<any>(
            'INSERT INTO users (username, password, role, teacher_id, created_at) VALUES (?, ?, ?, ?, NOW())',
            [email, password, role, teacherId]
        );

        await connection.commit();
        res.json({ message: 'Usuario registrado exitosamente', userId: userResult.insertId });

    } catch (error: any) {
        await connection.rollback();
        console.error('Registration error detailed:', error);
        // Send a more helpful error message if possible
        const errorMessage = error.sqlMessage || 'Error al registrar usuario';
        res.status(500).json({ error: errorMessage });
    } finally {
        connection.release();
    }
});

router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }

    try {
        // Buscar usuario
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const user = rows[0];

        // Verificar contraseña (TODO: Usar bcrypt en producción)
        // Por ahora comparamos texto plano para compatibilidad con datos de prueba
        if (user.password !== password) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generar Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Retornar info de usuario y token
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                teacher_id: user.teacher_id
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint para verificar token (Opcional, útil para recargar página)
router.get('/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY) as any;
        res.json({ user: decoded });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
