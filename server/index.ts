import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';

import teacherRoutes from './routes/teachers';
import semesterRoutes from './routes/semesters';
import courseRoutes from './routes/courses';
import authRoutes from './routes/auth';
import classroomRoutes from './routes/classrooms';
import assignmentsRouter from './routes/assignments'; // Added this import
import adjudicacionRoutes from './routes/adjudicacion'; // Fusión EPI Scheduler
import { runMigration } from './migrate_fusion';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/courses', courseRoutes); // Kept original variable name as per "unrelated edits" rule
app.use('/api/classrooms', classroomRoutes); // Kept original variable name as per "unrelated edits" rule
app.use('/api/assignments', assignmentsRouter); // Added assignments route
app.use('/api/adjudicacion', adjudicacionRoutes); // Fusión EPI Scheduler

// Basic test endpoint

// Basic test endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/test-db', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query('SELECT 1 as val');
        res.json({ message: 'Connected to database successfully!', data: rows });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Failed to connect to database', details: error });
    }
});

// Estado del microservicio solver (Python / OR-Tools)
app.get('/api/solver/health', async (req: Request, res: Response) => {
    const url = process.env.SOLVER_URL || 'http://localhost:5000';
    try {
        const r = await (globalThis as any).fetch(`${url}/health`);
        res.json({ solver_status: 'ok', info: await r.json() });
    } catch (e) {
        res.status(503).json({ solver_status: 'unavailable', hint: 'cd solver_service && uvicorn main:app --port 5000' });
    }
});

app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    try {
        await runMigration(false);
        console.log('✅ Base de datos EPI-UNT verificada y lista (usuarios admin / director activos).');
    } catch (err: any) {
        console.error('⚠️  No se pudo inicializar automáticamente la BD MySQL:', err?.message || err);
        console.error('   Verifique DB_USER y DB_PASSWORD en server/.env');
    }
});
