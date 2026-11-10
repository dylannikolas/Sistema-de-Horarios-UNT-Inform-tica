/**
 * migrate_fusion.ts — Migración e inicialización idempotente para SHARPEI + EPI Scheduler.
 * Uso:  npx ts-node migrate_fusion.ts      (se puede ejecutar varias veces sin destruir datos)
 *
 * - Crea la BD `sistema_horarios` y las tablas base si aún no existen
 * - teachers : + orden, + required_hours (respetando valores personalizados > 0)
 * - courses  : + horas de teoría/práctica/lab, + ciclo numérico; completa los 60 cursos de la malla EPI 2017
 * - assignments: + section, + session_type
 * - classrooms: asegura las 8 aulas EPI (Pool 17/18, Info 2/3/5, Lab A/B/C) sin borrar aulas del usuario
 * - users    : asegura cuentas para `admin`, `director` y cada docente registrado
 * - tablas nuevas: adjudicacion_process / _turns / _sessions, solver_results
 */
import fs from 'fs';
import path from 'path';
import mysql, { RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';
import pool from './db';

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const INITIAL_TEACHERS: [string, string, string, string, number, number, string, number][] = [
    ['DIR-01', 'Dr. Juan Pérez García (Director)', 'director@unitru.edu.pe', 'Principal', 20, 20, 'DIRECTOR', 0],
    ['DOC-01', 'GUTIERREZ GUTIERREZ JORGE LUIS', 'jgutierrez@unitru.edu.pe', 'Principal', 20, 20, 'DOCENTE', 1],
    ['DOC-02', 'RODRIGUEZ MELQUIADES JOSE ANTONIO', 'jrodriguez@unitru.edu.pe', 'Principal', 20, 20, 'DOCENTE', 2],
    ['DOC-23', 'SANCHEZ RUIZ CARLOS ALBERTO', 'csanchez@unitru.edu.pe', 'Principal', 20, 20, 'DOCENTE', 3],
    ['DOC-24', 'VARGAS SILVA FERNANDO ENRIQUE', 'fvargas@unitru.edu.pe', 'Principal', 20, 20, 'DOCENTE', 4],
    ['DOC-03', 'CASTILLO DIESTRA CARLOS ENRIQUE', 'ccastillod@unitru.edu.pe', 'Asociado', 18, 18, 'DOCENTE', 1],
    ['DOC-04', 'SIFUENTES DIAZ YENNY MILAGROS', 'ysifuentes@unitru.edu.pe', 'Asociado', 18, 18, 'DOCENTE', 2],
    ['DOC-05', 'CRUZ SILVA JOSE GABRIEL', 'jcruz@unitru.edu.pe', 'Asociado', 18, 18, 'DOCENTE', 3],
    ['DOC-06', 'MENDOZA TORRES EDWIN RAUL', 'emendoza@unitru.edu.pe', 'Asociado', 18, 18, 'DOCENTE', 4],
    ['DOC-07', 'SALAZAR CAMPOS JUAN ORLANDO', 'jsalazarc@unitru.edu.pe', 'Asociado', 18, 18, 'DOCENTE', 5],
    ['DOC-10', 'GOMEZ MORALES ANTHONY JOSE', 'agomez@unitru.edu.pe', 'Asociado', 18, 18, 'DOCENTE', 6],
    ['DOC-08', 'CRUZ FLORIAN IRIS AUREA', 'icruz@unitru.edu.pe', 'Auxiliar', 16, 16, 'DOCENTE', 1],
    ['DOC-09', 'PERALTA LUJAN JOSE LUIS', 'jperalta@unitru.edu.pe', 'Auxiliar', 16, 16, 'DOCENTE', 2],
    ['DOC-11', 'GUEVARA RUIZ RICARDO MANUEL', 'rguevara@unitru.edu.pe', 'Auxiliar', 16, 16, 'DOCENTE', 3],
    ['DOC-12', 'PEDRO HUAMAN LIZ SOFIA RAYMUNDA', 'lpedro@unitru.edu.pe', 'Auxiliar', 16, 16, 'DOCENTE', 4],
    ['DOC-13', 'POLO ROMERO VICTOR JAIME', 'vpolo@unitru.edu.pe', 'Auxiliar', 16, 16, 'DOCENTE', 5],
    ['DOC-14', 'QUISPE VARON CELESTINO MEDARDO', 'cmquispe@unitru.edu.pe', 'Auxiliar', 16, 16, 'DOCENTE', 6],
    ['DOC-15', 'PEREYRA SALVADOR PATRICIA GISSELLA', 'ppereyra@unitru.edu.pe', 'Auxiliar', 16, 16, 'DOCENTE', 7],
    ['DOC-16', 'PACHECO TORRES JUAN FRANCISCO', 'fpacheco@unitru.edu.pe', 'Auxiliar', 16, 16, 'DOCENTE', 8],
    ['DOC-17', 'BRAVO ESCALANTE JORGE DAVID', 'jbravo@unitru.edu.pe', 'Contratado', 12, 12, 'DOCENTE', 1],
    ['DOC-18', 'RAMIREZ CERNA LOURDES', 'lramirezc@unitru.edu.pe', 'Contratado', 12, 12, 'DOCENTE', 2],
    ['DOC-19', 'ALVARADO RAMOS JORGE LUIS', 'jalvarador@unitru.edu.pe', 'Contratado', 12, 12, 'DOCENTE', 3],
    ['DOC-20', 'UROUZO GOMEZ YOSIP VLADIMIR', 'yurquizo@unitru.edu.pe', 'Contratado', 12, 12, 'DOCENTE', 4],
    ['DOC-21', 'ABANTO CONCUEAR MANUEL REGILDER', 'mabantoco@unitru.edu.pe', 'Contratado', 12, 12, 'DOCENTE', 5],
    ['DOC-22', 'SALCEDO QUIÑONES MARTIN GUSTAVO', 'msalcedo@unitru.edu.pe', 'Contratado', 12, 12, 'DOCENTE', 6],
];

async function ensureDatabaseExists() {
    const dbName = process.env.DB_NAME || 'sistema_horarios';
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        charset: 'utf8mb4',
    });
    try {
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    } finally {
        await conn.end();
    }
}

async function ensureBaseTables() {
    await pool.query(`CREATE TABLE IF NOT EXISTS semesters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query(`CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        category ENUM('Principal', 'Asociado', 'Auxiliar', 'Contratado') NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        max_hours INT DEFAULT 20,
        role ENUM('DIRECTOR', 'DOCENTE') DEFAULT 'DOCENTE',
        orden INT NOT NULL DEFAULT 999,
        required_hours INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query(`CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        cycle VARCHAR(10) NOT NULL,
        credits INT NOT NULL,
        hours_per_week INT NOT NULL,
        hours_theory INT NOT NULL DEFAULT 0,
        hours_practice INT NOT NULL DEFAULT 0,
        hours_lab INT NOT NULL DEFAULT 0,
        has_lab TINYINT(1) NOT NULL DEFAULT 0,
        cycle_number INT NULL,
        course_tipo VARCHAR(2) NOT NULL DEFAULT 'ES',
        schedulable TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query(`CREATE TABLE IF NOT EXISTS classrooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        type ENUM('Teoría', 'Laboratorio') NOT NULL,
        capacity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query(`CREATE TABLE IF NOT EXISTS teacher_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        day VARCHAR(15) NOT NULL,
        hour VARCHAR(10) NOT NULL,
        is_optional BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_availability (teacher_id, day, hour)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'DIRECTOR', 'DOCENTE') NOT NULL DEFAULT 'DOCENTE',
        teacher_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query(`CREATE TABLE IF NOT EXISTS assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        semester_id INT NOT NULL,
        course_id INT NOT NULL,
        teacher_id INT NOT NULL,
        classroom_id INT NOT NULL,
        day_of_week ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        section VARCHAR(2) NULL,
        session_type VARCHAR(15) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

async function hasColumn(table: string, col: string): Promise<boolean> {
    const [r] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, col]);
    return r.length > 0;
}

async function addColumn(table: string, col: string, ddl: string) {
    if (await hasColumn(table, col)) { console.log(`  = ${table}.${col} ya existe`); return; }
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
    console.log(`  + ${table}.${col}`);
}

export async function runMigration(closePoolOnEnd: boolean = true) {
    await ensureDatabaseExists();
    await ensureBaseTables();

    console.log('▶ Columnas nuevas');
    await addColumn('teachers', 'orden', 'INT NOT NULL DEFAULT 999');
    await addColumn('teachers', 'required_hours', 'INT NOT NULL DEFAULT 0');
    await addColumn('courses', 'hours_theory', 'INT NOT NULL DEFAULT 0');
    await addColumn('courses', 'hours_practice', 'INT NOT NULL DEFAULT 0');
    await addColumn('courses', 'hours_lab', 'INT NOT NULL DEFAULT 0');
    await addColumn('courses', 'has_lab', 'TINYINT(1) NOT NULL DEFAULT 0');
    await addColumn('courses', 'cycle_number', 'INT NULL');
    await addColumn('courses', 'course_tipo', "VARCHAR(2) NOT NULL DEFAULT 'ES'");
    await addColumn('courses', 'schedulable', 'TINYINT(1) NOT NULL DEFAULT 1');
    await addColumn('assignments', 'section', 'VARCHAR(2) NULL');
    await addColumn('assignments', 'session_type', 'VARCHAR(15) NULL');

    // Si la tabla de semestres está vacía, insertar los semestres iniciales
    const [semCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM semesters');
    if (semCount[0].n === 0) {
        await pool.query(`INSERT INTO semesters (name, start_date, end_date, is_active) VALUES
            ('2025-II', '2025-08-18', '2025-12-19', FALSE),
            ('2026-I',  '2026-04-06', '2026-07-31', FALSE),
            ('2026-II', '2026-08-17', '2026-12-18', TRUE)`);
        console.log('  + semestres iniciales insertados (2026-II activo)');
    }

    // Si la tabla de docentes está vacía, insertar la plana docente EPI
    const [teachCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM teachers');
    if (teachCount[0].n === 0) {
        for (const [code, name, email, category, maxH, reqH, role, orden] of INITIAL_TEACHERS) {
            const seed = name.split(' ')[0].toLowerCase();
            await pool.query(
                `INSERT INTO teachers (code, name, email, category, avatar, max_hours, required_hours, role, orden)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [code, name, email, category, `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`, maxH, reqH, role, orden]
            );
        }
        console.log(`  + ${INITIAL_TEACHERS.length} docentes iniciales insertados`);
    }

    console.log('▶ Horas reglamentarias y orden de prelación por categoría');
    await pool.query(`UPDATE teachers SET required_hours = CASE
        WHEN max_hours > 0 AND (category = 'Principal' OR max_hours <> 20) THEN max_hours
        WHEN category = 'Principal' THEN 20
        WHEN category = 'Asociado' THEN 18
        WHEN category = 'Auxiliar' THEN 16
        ELSE 12 END
        WHERE required_hours = 0`);

    for (const cat of ['Principal', 'Asociado', 'Auxiliar', 'Contratado']) {
        const [trows] = await pool.query<RowDataPacket[]>(
            'SELECT id, orden FROM teachers WHERE category = ? ORDER BY orden ASC, id ASC', [cat]);
        for (let i = 0; i < trows.length; i++) {
            if (trows[i].orden === 999) {
                await pool.query('UPDATE teachers SET orden = ? WHERE id = ?', [i + 1, trows[i].id]);
            }
        }
    }

    console.log('▶ Ciclo romano → numérico');
    for (let i = 0; i < ROMAN.length; i++) {
        await pool.query('UPDATE courses SET cycle_number = ? WHERE cycle = ? AND cycle_number IS NULL', [i + 1, ROMAN[i]]);
    }

    console.log('▶ Malla curricular EPI 2017 (upsert por código)');
    const malla = JSON.parse(fs.readFileSync(path.join(__dirname, 'malla_epi.json'), 'utf-8'));
    let inserted = 0, updated = 0;
    for (const c of malla) {
        const [ex] = await pool.query<RowDataPacket[]>('SELECT id FROM courses WHERE code = ?', [c.code]);
        if (ex.length) {
            await pool.query(
                `UPDATE courses SET hours_theory=?, hours_practice=?, hours_lab=?, has_lab=?,
                        cycle_number=?, course_tipo=?, schedulable=? WHERE id=?`,
                [c.ht, c.hp, c.hl, c.has_lab ? 1 : 0, c.cycle, c.tipo, c.schedulable ? 1 : 0, ex[0].id]);
            updated++;
        } else {
            await pool.query(
                `INSERT INTO courses (code, name, cycle, credits, hours_per_week,
                        hours_theory, hours_practice, hours_lab, has_lab, cycle_number, course_tipo, schedulable)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                [c.code, c.name, ROMAN[c.cycle - 1], c.credits, c.ht + c.hp + c.hl,
                 c.ht, c.hp, c.hl, c.has_lab ? 1 : 0, c.cycle, c.tipo, c.schedulable ? 1 : 0]);
            inserted++;
        }
    }
    console.log(`  cursos insertados: ${inserted} · actualizados: ${updated}`);

    console.log('▶ Aulas reales EPI (5 Teóricas: POOL-17/18, INFO-2/3/5 · 3 Laboratorios: LAB-A/B/C)');
    const rooms: [string, number, number][] = [
        ['POOL-17', 1, 35], ['POOL-18', 1, 35],
        ['INFO-2', 1, 25], ['INFO-3', 1, 25], ['INFO-5', 1, 25],
        ['LAB-A', 2, 40], ['LAB-B', 2, 40], ['LAB-C', 2, 40],
    ];
    for (const [name, typeIdx, cap] of rooms) {
        const [ex] = await pool.query<RowDataPacket[]>('SELECT id FROM classrooms WHERE name = ?', [name]);
        if (!ex.length) {
            await pool.query('INSERT INTO classrooms (name, type, capacity) VALUES (?, ?, ?)', [name, typeIdx, cap]);
            console.log(`  + aula ${name}`);
        } else {
            await pool.query('UPDATE classrooms SET type = ? WHERE id = ?', [typeIdx, ex[0].id]);
        }
    }

    console.log('▶ Usuarios de acceso (admin, director y docentes)');
    await pool.query(
        `INSERT IGNORE INTO users (username, password, role, teacher_id, is_active) VALUES
         ('admin', 'admin123', 'ADMIN', NULL, TRUE),
         ('director', 'director123', 'DIRECTOR', NULL, TRUE)`
    );
    const [allTeachers] = await pool.query<RowDataPacket[]>('SELECT id, code, email, role FROM teachers');
    for (const t of allTeachers) {
        const uname = String(t.email || '').split('@')[0] || String(t.code);
        const urole = t.role === 'DIRECTOR' ? 'DIRECTOR' : 'DOCENTE';
        await pool.query(
            'INSERT IGNORE INTO users (username, password, role, teacher_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
            [uname, t.code, urole, t.id]
        );
    }

    console.log('▶ Tablas de adjudicación');
    await pool.query(`CREATE TABLE IF NOT EXISTS adjudicacion_process (
        id INT AUTO_INCREMENT PRIMARY KEY,
        semester_id INT NOT NULL,
        status ENUM('EN_PROCESO','COMPLETADO') NOT NULL DEFAULT 'EN_PROCESO',
        config_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS adjudicacion_turns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        process_id INT NOT NULL,
        teacher_id INT NOT NULL,
        turno INT NOT NULL,
        status ENUM('PENDIENTE','CONFIRMADO','OMITIDO') NOT NULL DEFAULT 'PENDIENTE',
        UNIQUE KEY uq_turn (process_id, teacher_id),
        FOREIGN KEY (process_id) REFERENCES adjudicacion_process(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS adjudicacion_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        process_id INT NOT NULL,
        teacher_id INT NOT NULL,
        course_id INT NOT NULL,
        section VARCHAR(2) NOT NULL,
        session_type VARCHAR(15) NOT NULL,
        hours INT NOT NULL,
        confirmed TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_session (process_id, course_id, section, session_type),
        FOREIGN KEY (process_id) REFERENCES adjudicacion_process(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS solver_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        process_id INT NOT NULL,
        version_id VARCHAR(20) NOT NULL,
        status VARCHAR(15) NOT NULL,
        sessions_json LONGTEXT,
        unplaced_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (process_id) REFERENCES adjudicacion_process(id) ON DELETE CASCADE
    )`);

    console.log('✔ Migración completada');
    if (closePoolOnEnd) {
        await pool.end();
    }
}

if (require.main === module) {
    runMigration(true).catch(async (e) => {
        console.error('✗ Error en migración:', e);
        await pool.end().catch(() => {});
        process.exit(1);
    });
}
