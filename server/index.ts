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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
