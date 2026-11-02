/**
 * migrate_fusion.ts — Migración idempotente para la fusión SHARPEI + EPI Scheduler.
 * Uso:  npx ts-node migrate_fusion.ts      (se puede ejecutar varias veces)
 *
 * - teachers : + orden, + required_hours (calculadas desde la categoría)
 * - courses  : + horas de teoría/práctica/lab, + ciclo numérico; completa la malla EPI 2017
 * - assignments: + section, + session_type (para distinguir secciones A/B)
 * - classrooms: agrega aulas EPI (Pool 17/18, Info 2/3/5, Lab A/B/C) si no existen
 * - tablas nuevas: adjudicacion_process / _turns / _sessions, solver_results
 */
import fs from 'fs';
import path from 'path';
import pool from './db';
import { RowDataPacket } from 'mysql2';

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

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

async function main() {
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

    console.log('▶ Horas reglamentarias y orden de prelación por categoría');
    await pool.query(`UPDATE teachers SET required_hours = CASE category
        WHEN 'Principal' THEN 20 WHEN 'Asociado' THEN 18
        WHEN 'Auxiliar' THEN 16 ELSE 12 END,
        max_hours = CASE category
        WHEN 'Principal' THEN 20 WHEN 'Asociado' THEN 18
        WHEN 'Auxiliar' THEN 16 ELSE 12 END`);

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
    // type se inserta por índice del ENUM (1 = Teoría, 2 = Laboratorio) para no depender de la codificación del texto
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
            await pool.query('UPDATE classrooms SET type = ?, capacity = ? WHERE id = ?', [typeIdx, cap, ex[0].id]);
        }
    }
    const validRoomNames = rooms.map(r => r[0]);
    const [firstEpiRoom] = await pool.query<RowDataPacket[]>('SELECT id FROM classrooms WHERE name = ?', ['POOL-17']);
    if (firstEpiRoom.length) {
        await pool.query(
            'UPDATE assignments SET classroom_id = ? WHERE classroom_id IN (SELECT id FROM (SELECT id FROM classrooms WHERE name NOT IN (?)) AS tmp)',
            [firstEpiRoom[0].id, validRoomNames]
        );
    }
    await pool.query('DELETE FROM classrooms WHERE name NOT IN (?)', [validRoomNames]);

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
    await pool.end();
}

main().catch(async (e) => { console.error('✗ Error en migración:', e); await pool.end(); process.exit(1); });
