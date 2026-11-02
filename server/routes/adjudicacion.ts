/**
 * adjudicacion.ts — Adjudicación de carga horaria por turnos y categoría.
 *
 * Reglas EPI-UNT:
 *  - Orden de turnos: Principal → Asociado → Auxiliar → Contratado; dentro de cada categoría por `orden`.
 *  - Cada docente debe confirmar EXACTAMENTE sus horas reglamentarias (teachers.required_hours).
 *  - Una sesión (curso+sección+tipo) solo puede tener un docente (clave única en la BD).
 *  - Las horas de cada sesión se calculan en el servidor desde la malla; el cliente no las envía.
 *  - Secciones por ciclo: permite configurar p. ej. A+B en ciclos regulares y solo A en cursos por repetición.
 *  - Aulas: Teoría y Práctica solo en aulas teóricas (Pool 17/18, Info 2/3/5); Laboratorio solo en Lab A/B/C.
 *
 * Endpoints:
 *  GET    /api/adjudicacion/activo           ?semester_id=
 *  POST   /api/adjudicacion/iniciar          { semester_id, cycles, sections?, cycle_sections?, repeat_cycles?, teacher_ids?, period? }
 *  GET    /api/adjudicacion/:id/turno-actual
 *  POST   /api/adjudicacion/:id/seleccionar  { teacher_id, sessions:[{course_id,section,session_type}] }
 *  POST   /api/adjudicacion/:id/confirmar    { teacher_id }
 *  POST   /api/adjudicacion/:id/saltar       { teacher_id }
 *  GET    /api/adjudicacion/:id/resumen
 *  POST   /api/adjudicacion/:id/generar      { time_limit_seconds?, replace_existing?, allow_unassigned? }
 *  GET    /api/adjudicacion/:id/resultado
 *  GET    /api/adjudicacion/:id/exportar-excel
 *  DELETE /api/adjudicacion/:id
 */
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
const SOLVER_URL = process.env.SOLVER_URL || 'http://localhost:5000';
const SECRET_KEY = process.env.JWT_SECRET || 'secret-key-change-me';
const CAT_HOURS: Record<string, number> = { Principal: 20, Asociado: 18, Auxiliar: 16, Contratado: 12 };
const TYPES = ['Teoria', 'Practica', 'Laboratorio'] as const;
type SType = typeof TYPES[number];

const evenUp = (h: number) => (h > 0 ? Math.ceil(h / 2) * 2 : 0);
const requiredOf = (t: any): number => (t.required_hours > 0 ? t.required_hours : (CAT_HOURS[t.category] ?? 12));

/** Extrae usuario opcional del JWT si el cliente envía Authorization: Bearer <token> */
function getAuthUser(req: Request): { id?: number; role?: string; teacher_id?: number } | null {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(auth.slice(7), SECRET_KEY) as any;
    } catch {
        return null;
    }
}

function requireDirectorIfAuth(req: Request, res: Response): boolean {
    const u = getAuthUser(req);
    if (u && u.role && u.role !== 'DIRECTOR' && u.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acción reservada para el Director de Escuela' });
        return false;
    }
    return true;
}

/** Horas que ocupa cada tipo de sesión de un curso (bloques de 2h; laboratorio = 4h consecutivas). */
function sessionHours(course: any, type: SType): number {
    if (type === 'Teoria') return evenUp(course.hours_theory);
    if (type === 'Practica') return evenUp(course.hours_practice);
    return course.has_lab ? 4 : 0;
}

/** Secciones habilitadas para un ciclo dado dentro de la configuración del proceso. */
function sectionsForCycle(cfg: any, cycleNumber: number): string[] {
    if (cfg.cycle_sections && Array.isArray(cfg.cycle_sections[String(cycleNumber)])) {
        return cfg.cycle_sections[String(cycleNumber)];
    }
    return Array.isArray(cfg.sections) && cfg.sections.length ? cfg.sections : ['A', 'B'];
}

async function getProcess(pid: number): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM adjudicacion_process WHERE id = ?', [pid]);
    if (!rows.length) return null;
    return { ...rows[0], config: JSON.parse(rows[0].config_json) };
}

async function poolCourses(cfg: any): Promise<RowDataPacket[]> {
    const cycles: number[] = cfg.cycles || [];
    if (!cycles.length) return [];
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, code, name, cycle_number, hours_theory, hours_practice, hours_lab, has_lab
         FROM courses
         WHERE schedulable = 1 AND cycle_number IN (?)
           AND (hours_theory + hours_practice + hours_lab > 0 OR has_lab = 1)
         ORDER BY cycle_number, code`, [cycles]);
    return rows;
}

/** Todas las sesiones del pool con su estado (libre / reservada / confirmada). */
async function poolSessions(pid: number, cfg: any) {
    const courses = await poolCourses(cfg);
    const [taken] = await pool.query<RowDataPacket[]>(
        `SELECT s.course_id, s.section, s.session_type, s.teacher_id, s.confirmed, t.name AS teacher_name
         FROM adjudicacion_sessions s
         LEFT JOIN teachers t ON t.id = s.teacher_id
         WHERE s.process_id = ?`, [pid]);
    const takenMap = new Map<string, RowDataPacket>();
    taken.forEach(t => takenMap.set(`${t.course_id}|${t.section}|${t.session_type}`, t));
    const out: any[] = [];
    for (const c of courses) {
        const secs = sectionsForCycle(cfg, Number(c.cycle_number));
        for (const section of secs) {
            for (const type of TYPES) {
                const hours = sessionHours(c, type);
                if (!hours) continue;
                const t = takenMap.get(`${c.id}|${section}|${type}`);
                out.push({
                    course_id: c.id, code: c.code, course_name: c.name, cycle: c.cycle_number, section,
                    session_type: type, hours,
                    teacher_id: t ? t.teacher_id : null,
                    teacher_name: t ? t.teacher_name : null,
                    confirmed: t ? !!t.confirmed : false,
                    label: `${c.cycle_number}°${section} | ${c.name} | ${type} (${hours}h)`,
                });
            }
        }
    }
    return out;
}

async function currentTurn(pid: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT tu.turno, tu.teacher_id, t.name, t.category, t.orden, t.required_hours
         FROM adjudicacion_turns tu JOIN teachers t ON t.id = tu.teacher_id
         WHERE tu.process_id = ? AND tu.status = 'PENDIENTE' ORDER BY tu.turno LIMIT 1`, [pid]);
    return rows[0] || null;
}

async function hoursOf(pid: number, teacherId: number, confirmed: boolean): Promise<number> {
    const [r] = await pool.query<RowDataPacket[]>(
        'SELECT COALESCE(SUM(hours),0) h FROM adjudicacion_sessions WHERE process_id=? AND teacher_id=? AND confirmed=?',
        [pid, teacherId, confirmed ? 1 : 0]);
    return Number(r[0].h);
}

// ── GET /activo ──────────────────────────────────────────────────────────────
router.get('/activo', async (req: Request, res: Response) => {
    try {
        let semesterId = req.query.semester_id ? Number(req.query.semester_id) : null;
        if (!semesterId) {
            const [actSem] = await pool.query<RowDataPacket[]>('SELECT id, name FROM semesters WHERE is_active = 1 LIMIT 1');
            if (!actSem.length) {
                res.json({ active: false, message: 'No hay un semestre activo configurado' });
                return;
            }
            semesterId = actSem[0].id;
        }
        const [procs] = await pool.query<RowDataPacket[]>(
            `SELECT * FROM adjudicacion_process WHERE semester_id = ?
             ORDER BY FIELD(status, 'EN_PROCESO', 'COMPLETADO'), id DESC LIMIT 1`,
            [semesterId]
        );
        if (!procs.length) {
            res.json({ active: false, semester_id: semesterId, process: null });
            return;
        }
        const proc: any = { ...procs[0], config: JSON.parse(procs[0].config_json) };
        const pid = proc.id;
        const turn = await currentTurn(pid);
        const sessions = await poolSessions(pid, proc.config);
        const [trows] = await pool.query<RowDataPacket[]>(
            `SELECT tu.turno, tu.status, t.id teacher_id, t.name, t.category, t.orden, t.required_hours,
                    COALESCE((SELECT SUM(hours) FROM adjudicacion_sessions s WHERE s.process_id=tu.process_id AND s.teacher_id=t.id AND s.confirmed=1),0) confirmed_hours,
                    COALESCE((SELECT SUM(hours) FROM adjudicacion_sessions s WHERE s.process_id=tu.process_id AND s.teacher_id=t.id AND s.confirmed=0),0) reserved_hours
             FROM adjudicacion_turns tu JOIN teachers t ON t.id=tu.teacher_id WHERE tu.process_id=? ORDER BY tu.turno`, [pid]);
        const teachers = trows.map(r => {
            const required = requiredOf(r);
            const ch = Number(r.confirmed_hours);
            const rh = Number(r.reserved_hours);
            return { ...r, required_hours: required, confirmed_hours: ch, reserved_hours: rh, difference: ch - required };
        });
        const [resRows] = await pool.query<RowDataPacket[]>(
            'SELECT version_id, status, created_at FROM solver_results WHERE process_id = ? ORDER BY id DESC LIMIT 1', [pid]);

        res.json({
            active: true,
            semester_id: semesterId,
            process_id: pid,
            status: proc.status,
            config: proc.config,
            created_at: proc.created_at,
            current_turn: turn ? {
                turno: turn.turno,
                teacher_id: turn.teacher_id,
                name: turn.name,
                category: turn.category,
                orden: turn.orden,
                required_hours: requiredOf(turn),
            } : null,
            teachers,
            sessions,
            pool_hours: sessions.reduce((s, x) => s + x.hours, 0),
            required_hours_total: teachers.reduce((s, t) => s + t.required_hours, 0),
            unassigned_sessions: sessions.filter(s => s.teacher_id === null).length,
            unassigned_hours: sessions.filter(s => s.teacher_id === null).reduce((s, x) => s + x.hours, 0),
            latest_result: resRows[0] || null,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al consultar proceso activo' });
    }
});

// ── POST /iniciar ────────────────────────────────────────────────────────────
router.post('/iniciar', async (req: Request, res: Response) => {
    if (!requireDirectorIfAuth(req, res)) return;
    const { semester_id, cycles, sections, cycle_sections, repeat_cycles, teacher_ids, period } = req.body;

    // Construir mapa cycle_sections si se envió o combinar cycles + repeat_cycles
    const cycleSecMap: Record<string, string[]> = {};
    const defaultSecs: string[] = Array.isArray(sections) && sections.length ? sections : ['A', 'B'];

    if (cycle_sections && typeof cycle_sections === 'object') {
        for (const [k, v] of Object.entries(cycle_sections)) {
            const cNum = Number(k);
            if (Number.isInteger(cNum) && cNum >= 1 && cNum <= 10 && Array.isArray(v) && v.length > 0) {
                cycleSecMap[String(cNum)] = v.map(String);
            }
        }
    }

    if (Array.isArray(cycles)) {
        for (const c of cycles) {
            if (Number.isInteger(c) && c >= 1 && c <= 10 && !cycleSecMap[String(c)]) {
                cycleSecMap[String(c)] = defaultSecs;
            }
        }
    }

    if (Array.isArray(repeat_cycles)) {
        for (const c of repeat_cycles) {
            if (Number.isInteger(c) && c >= 1 && c <= 10 && !cycleSecMap[String(c)]) {
                cycleSecMap[String(c)] = ['A']; // Por repetición: solo sección A
            }
        }
    }

    const allCycles = Object.keys(cycleSecMap).map(Number).sort((a, b) => a - b);
    if (!semester_id || !allCycles.length) {
        res.status(400).json({ error: 'semester_id y cycles (enteros 1-10) son obligatorios' }); return;
    }

    const conn = await pool.getConnection();
    try {
        const [sem] = await conn.query<RowDataPacket[]>('SELECT id FROM semesters WHERE id = ?', [semester_id]);
        if (!sem.length) { res.status(404).json({ error: 'Semestre no encontrado' }); return; }
        const [act] = await conn.query<RowDataPacket[]>(
            "SELECT id FROM adjudicacion_process WHERE semester_id = ? AND status = 'EN_PROCESO'", [semester_id]);
        if (act.length) { res.status(409).json({ error: 'Ya existe un proceso en curso para este semestre', process_id: act[0].id }); return; }

        let tq = `SELECT id, name, category, orden, required_hours FROM teachers WHERE role = 'DOCENTE'`;
        const params: any[] = [];
        if (Array.isArray(teacher_ids) && teacher_ids.length) { tq += ' AND id IN (?)'; params.push(teacher_ids); }
        tq += ` ORDER BY FIELD(category,'Principal','Asociado','Auxiliar','Contratado'), orden, id`;
        const [teachers] = await conn.query<RowDataPacket[]>(tq, params);
        if (!teachers.length) { res.status(400).json({ error: 'No hay docentes para el proceso' }); return; }

        await conn.beginTransaction();
        const cfg = {
            period: period || 'PAR',
            cycles: allCycles,
            sections: defaultSecs,
            cycle_sections: cycleSecMap,
        };
        const [r] = await conn.query<ResultSetHeader>(
            'INSERT INTO adjudicacion_process (semester_id, config_json) VALUES (?, ?)', [semester_id, JSON.stringify(cfg)]);
        const pid = r.insertId;
        for (let i = 0; i < teachers.length; i++) {
            await conn.query('INSERT INTO adjudicacion_turns (process_id, teacher_id, turno) VALUES (?,?,?)', [pid, teachers[i].id, i + 1]);
        }
        await conn.commit();

        const sessions = await poolSessions(pid, cfg);
        const poolHours = sessions.reduce((s, x) => s + x.hours, 0);
        const requiredTotal = teachers.reduce((s, t) => s + requiredOf(t), 0);
        res.json({
            process_id: pid, config: cfg,
            orden_adjudicacion: teachers.map((t, i) => ({ turno: i + 1, teacher_id: t.id, name: t.name, category: t.category, orden: t.orden, required_hours: requiredOf(t) })),
            pool_sessions: sessions.length, pool_hours: poolHours, required_hours_total: requiredTotal,
            balance_hours: poolHours - requiredTotal,
            warning: poolHours === requiredTotal ? null :
                `Las horas del pool (${poolHours}h) no coinciden con la suma de horas reglamentarias (${requiredTotal}h): ` +
                (poolHours > requiredTotal ? `sobrarán ${poolHours - requiredTotal}h sin docente.` : `faltan ${requiredTotal - poolHours}h, algún docente no podrá completar su carga.`),
        });
    } catch (e) {
        await conn.rollback().catch(() => {});
        console.error(e); res.status(500).json({ error: 'Error al iniciar adjudicación' });
    } finally { conn.release(); }
});

// ── GET /:id/turno-actual ────────────────────────────────────────────────────
router.get('/:id/turno-actual', async (req: Request, res: Response) => {
    try {
        const pid = Number(req.params.id);
        const proc = await getProcess(pid);
        if (!proc) { res.status(404).json({ error: 'Proceso no encontrado' }); return; }
        const turn = await currentTurn(pid);
        const all = await poolSessions(pid, proc.config);
        if (!turn) {
            await pool.query("UPDATE adjudicacion_process SET status='COMPLETADO' WHERE id=?", [pid]);
            res.json({
                process_id: pid,
                status: 'COMPLETADO',
                message: 'Todos los turnos fueron resueltos',
                available_sessions: all.filter(s => s.teacher_id === null),
                all_sessions: all,
            });
            return;
        }
        const required = requiredOf(turn);
        const reserved = await hoursOf(pid, turn.teacher_id, false);
        res.json({
            process_id: pid, status: 'EN_PROCESO', turno: turn.turno,
            teacher: { id: turn.teacher_id, name: turn.name, category: turn.category, orden: turn.orden, required_hours: required,
                       reserved_hours: reserved, remaining_hours: required - reserved },
            available_sessions: all.filter(s => s.teacher_id === null),
            mine_reserved: all.filter(s => s.teacher_id === turn.teacher_id && !s.confirmed),
        });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Error al obtener turno' }); }
});

// ── POST /:id/seleccionar ────────────────────────────────────────────────────
router.post('/:id/seleccionar', async (req: Request, res: Response) => {
    const pid = Number(req.params.id);
    const { teacher_id, sessions } = req.body;
    if (!teacher_id || !Array.isArray(sessions)) { res.status(400).json({ error: 'teacher_id y sessions son obligatorios' }); return; }

    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'DOCENTE' && authUser.teacher_id && Number(authUser.teacher_id) !== Number(teacher_id)) {
        res.status(403).json({ error: 'No puede modificar la selección de otro docente' }); return;
    }

    const conn = await pool.getConnection();
    try {
        const proc = await getProcess(pid);
        if (!proc) { res.status(404).json({ error: 'Proceso no encontrado' }); return; }
        const turn = await currentTurn(pid);
        if (!turn || turn.teacher_id !== Number(teacher_id)) {
            res.status(409).json({ error: 'No es el turno de este docente', turno_actual: turn ? turn.name : null }); return;
        }
        const courses = await poolCourses(proc.config);
        const byId = new Map<number, any>(courses.map(c => [c.id, c]));
        const prepared: { course_id: number; section: string; type: SType; hours: number }[] = [];
        for (const s of sessions) {
            const c = byId.get(Number(s.course_id));
            const allowedSecs = c ? sectionsForCycle(proc.config, Number(c.cycle_number)) : [];
            const hours = c && TYPES.includes(s.session_type) ? sessionHours(c, s.session_type) : 0;
            if (!c || !allowedSecs.includes(s.section) || !hours) {
                res.status(400).json({ error: 'Sesión inválida para este proceso', session: s }); return;
            }
            prepared.push({ course_id: c.id, section: s.section, type: s.session_type, hours });
        }
        await conn.beginTransaction();
        await conn.query('DELETE FROM adjudicacion_sessions WHERE process_id=? AND teacher_id=? AND confirmed=0', [pid, turn.teacher_id]);
        for (const p of prepared) {
            try {
                await conn.query(
                    'INSERT INTO adjudicacion_sessions (process_id, teacher_id, course_id, section, session_type, hours) VALUES (?,?,?,?,?,?)',
                    [pid, turn.teacher_id, p.course_id, p.section, p.type, p.hours]);
            } catch (e: any) {
                await conn.rollback();
                if (e.code === 'ER_DUP_ENTRY') { res.status(409).json({ error: 'Esa sesión ya fue adjudicada a otro docente', session: p }); return; }
                throw e;
            }
        }
        await conn.commit();
        const total = prepared.reduce((s, p) => s + p.hours, 0);
        const required = requiredOf(turn);
        res.json({ teacher: turn.name, selected_hours: total, required_hours: required, difference: total - required, exact: total === required,
                   message: total === required ? '✔ Carga exacta, puede confirmar' : total < required ? `Faltan ${required - total}h` : `Excede por ${total - required}h` });
    } catch (e) { await conn.rollback().catch(() => {}); console.error(e); res.status(500).json({ error: 'Error al seleccionar' }); }
    finally { conn.release(); }
});

// ── POST /:id/confirmar ──────────────────────────────────────────────────────
router.post('/:id/confirmar', async (req: Request, res: Response) => {
    const pid = Number(req.params.id);
    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'DOCENTE' && authUser.teacher_id && Number(authUser.teacher_id) !== Number(req.body.teacher_id)) {
        res.status(403).json({ error: 'No puede confirmar el turno de otro docente' }); return;
    }
    try {
        const turn = await currentTurn(pid);
        if (!turn || turn.teacher_id !== Number(req.body.teacher_id)) { res.status(409).json({ error: 'No es el turno de este docente' }); return; }
        const total = await hoursOf(pid, turn.teacher_id, false);
        const required = requiredOf(turn);
        if (total !== required) {
            res.status(400).json({ error: `Carga incorrecta: ${total}h seleccionadas, se requieren exactamente ${required}h`, selected_hours: total, required_hours: required, difference: total - required }); return;
        }
        await pool.query('UPDATE adjudicacion_sessions SET confirmed=1 WHERE process_id=? AND teacher_id=? AND confirmed=0', [pid, turn.teacher_id]);
        await pool.query("UPDATE adjudicacion_turns SET status='CONFIRMADO' WHERE process_id=? AND teacher_id=?", [pid, turn.teacher_id]);
        const nextTurn = await currentTurn(pid);
        if (!nextTurn) {
            await pool.query("UPDATE adjudicacion_process SET status='COMPLETADO' WHERE id=?", [pid]);
        }
        res.json({ confirmed: true, teacher: turn.name, hours_confirmed: total });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Error al confirmar' }); }
});

// ── POST /:id/saltar ─────────────────────────────────────────────────────────
router.post('/:id/saltar', async (req: Request, res: Response) => {
    if (!requireDirectorIfAuth(req, res)) return;
    const pid = Number(req.params.id);
    try {
        const turn = await currentTurn(pid);
        if (!turn || turn.teacher_id !== Number(req.body.teacher_id)) { res.status(409).json({ error: 'No es el turno de este docente' }); return; }
        await pool.query('DELETE FROM adjudicacion_sessions WHERE process_id=? AND teacher_id=? AND confirmed=0', [pid, turn.teacher_id]);
        await pool.query("UPDATE adjudicacion_turns SET status='OMITIDO' WHERE process_id=? AND teacher_id=?", [pid, turn.teacher_id]);
        const nextTurn = await currentTurn(pid);
        if (!nextTurn) {
            await pool.query("UPDATE adjudicacion_process SET status='COMPLETADO' WHERE id=?", [pid]);
        }
        res.json({ skipped: true, teacher: turn.name });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Error al saltar turno' }); }
});

// ── GET /:id/resumen ─────────────────────────────────────────────────────────
router.get('/:id/resumen', async (req: Request, res: Response) => {
    try {
        const pid = Number(req.params.id);
        const proc = await getProcess(pid);
        if (!proc) { res.status(404).json({ error: 'Proceso no encontrado' }); return; }
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT tu.turno, tu.status, t.id teacher_id, t.name, t.category, t.orden, t.required_hours,
                    COALESCE((SELECT SUM(hours) FROM adjudicacion_sessions s WHERE s.process_id=tu.process_id AND s.teacher_id=t.id AND s.confirmed=1),0) confirmed_hours
             FROM adjudicacion_turns tu JOIN teachers t ON t.id=tu.teacher_id WHERE tu.process_id=? ORDER BY tu.turno`, [pid]);
        const teachers: any[] = rows.map(r => {
            const required = requiredOf(r); const ch = Number(r.confirmed_hours);
            return { ...r, required_hours: required, confirmed_hours: ch, difference: ch - required };
        });
        const sessions = await poolSessions(pid, proc.config);
        const free = sessions.filter(s => s.teacher_id === null);
        res.json({ process_id: pid, status: proc.status, config: proc.config, teachers,
                   sessions,
                   pending_turns: teachers.filter(t => t.status === 'PENDIENTE').length,
                   unassigned_sessions: free.length, unassigned_hours: free.reduce((s, x) => s + x.hours, 0),
                   unassigned: free.map(s => s.label) });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Error al obtener resumen' }); }
});

// ── Asignación de aulas sincronizada con la restricción C6 del solver ────────
// Regla EPI acordada:
//  - Teoría y Práctica → SOLO aulas teóricas (POOL-17, POOL-18, INFO-2, INFO-3, INFO-5).
//  - Laboratorio → SOLO laboratorios (LAB-A, LAB-B, LAB-C).
// Ordenando por (día, hora_inicio) ascendente, la coloración de grafos de intervalos
// garantiza que toda sesión reciba aula sin cruces siempre que C6 se cumpla en CP-SAT.
const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
type Busy = { day: number; start: string; end: string };
const overlaps = (a: Busy, day: number, s: string, e: string) => a.day === day && a.start < e && a.end > s;

async function placeRooms(semesterId: number, sessions: any[], replaceExisting: boolean = false) {
    const [rooms] = await pool.query<RowDataPacket[]>('SELECT id, name, type, type + 0 AS type_idx FROM classrooms ORDER BY id');
    const isLab = (r: any) => Number(r.type_idx) === 2 || String(r.type) === 'Laboratorio';
    const labRooms = rooms.filter(isLab), theoryRooms = rooms.filter(r => !isLab(r));
    const busy = new Map<number, Busy[]>(rooms.map(r => [r.id, [] as Busy[]]));
    if (!replaceExisting) {
        const [existing] = await pool.query<RowDataPacket[]>('SELECT classroom_id, day_of_week + 0 AS dow, start_time, end_time FROM assignments WHERE semester_id=?', [semesterId]);
        existing.forEach(a => busy.get(a.classroom_id)?.push({ day: Number(a.dow), start: String(a.start_time), end: String(a.end_time) }));
    }
    const placed: any[] = [], unplaced: any[] = [];
    const ordered = [...sessions].sort((a, b) => {
        const dA = DAY_NAMES.indexOf(a.day), dB = DAY_NAMES.indexOf(b.day);
        if (dA !== dB) return dA - dB;
        if (a.start_time !== b.start_time) return String(a.start_time).localeCompare(String(b.start_time));
        return (b.session_type === 'Laboratorio' ? 1 : 0) - (a.session_type === 'Laboratorio' ? 1 : 0);
    });
    for (const s of ordered) {
        const candidates = s.session_type === 'Laboratorio' ? labRooms : theoryRooms;
        const dayIdx = DAY_NAMES.indexOf(s.day) + 1;
        const room = candidates.find(r => !busy.get(r.id)!.some(b => overlaps(b, dayIdx, s.start_time, s.end_time)));
        if (!room) { unplaced.push(s); continue; }
        busy.get(room.id)!.push({ day: dayIdx, start: s.start_time, end: s.end_time });
        placed.push({ ...s, classroom_id: room.id, classroom_name: room.name });
    }
    return { placed, unplaced, theoryRoomsCount: theoryRooms.length, labRoomsCount: labRooms.length };
}

// ── POST /:id/generar ────────────────────────────────────────────────────────
router.post('/:id/generar', async (req: Request, res: Response) => {
    if (!requireDirectorIfAuth(req, res)) return;
    const pid = Number(req.params.id);
    const { time_limit_seconds = 120, replace_existing = false, allow_unassigned = false, description = 'Horario SHARPEI + EPI Solver' } = req.body || {};
    try {
        const proc = await getProcess(pid);
        if (!proc) { res.status(404).json({ error: 'Proceso no encontrado' }); return; }
        const semesterId = proc.semester_id;
        const [pend] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) n FROM adjudicacion_turns WHERE process_id=? AND status='PENDIENTE'", [pid]);
        if (pend[0].n > 0) { res.status(409).json({ error: `Hay ${pend[0].n} turno(s) pendientes; complete o salte cada turno antes de generar` }); return; }

        const all = await poolSessions(pid, proc.config);
        const free = all.filter(s => s.teacher_id === null);
        if (free.length && !allow_unassigned) {
            res.status(409).json({ error: `${free.length} sesión(es) sin docente. Use allow_unassigned=true para generar solo lo adjudicado`, unassigned: free.map(s => s.label) }); return;
        }
        const confirmed = all.filter(s => s.teacher_id !== null && s.confirmed);
        if (!confirmed.length) { res.status(400).json({ error: 'No hay sesiones adjudicadas' }); return; }

        const [exist] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) n FROM assignments WHERE semester_id=?', [semesterId]);
        if (exist[0].n > 0 && !replace_existing) {
            res.status(409).json({ error: `El semestre ya tiene ${exist[0].n} asignaciones. Use replace_existing=true para reemplazarlas` }); return;
        }

        // Contar aulas teóricas y de laboratorio disponibles en la BD para pasarlas a CP-SAT (C6)
        const [rooms] = await pool.query<RowDataPacket[]>('SELECT id, type, type + 0 AS type_idx FROM classrooms');
        const isLab = (r: any) => Number(r.type_idx) === 2 || String(r.type) === 'Laboratorio';
        const maxLabRooms = rooms.filter(isLab).length || 3;
        const maxTheoryRooms = rooms.filter(r => !isLab(r)).length || 5;

        // Payload: solo se programan los tipos de sesión realmente adjudicados
        const courseMap = new Map<string, any>();
        const courseRows = await poolCourses(proc.config);
        const cById = new Map<number, any>(courseRows.map(c => [c.id, c]));
        for (const s of confirmed) {
            const key = `${s.course_id}|${s.section}`;
            const c = cById.get(s.course_id);
            if (!courseMap.has(key)) courseMap.set(key, { id: c.id, name: c.name, cycle_number: c.cycle_number, section: s.section,
                hours_theory: 0, hours_practice: 0, hours_lab: 0, has_lab: false, course_tipo: 'ES',
                theory_teacher_id: null, practice_teacher_id: null, lab_teacher_id: null });
            const e = courseMap.get(key);
            if (s.session_type === 'Teoria') { e.hours_theory = c.hours_theory; e.theory_teacher_id = s.teacher_id; }
            if (s.session_type === 'Practica') { e.hours_practice = c.hours_practice; e.practice_teacher_id = s.teacher_id; }
            if (s.session_type === 'Laboratorio') { e.hours_lab = c.hours_lab; e.has_lab = true; e.lab_teacher_id = s.teacher_id; }
        }
        const tids = [...new Set(confirmed.map(s => s.teacher_id))];
        const [trows] = await pool.query<RowDataPacket[]>('SELECT id, name, category, orden, required_hours FROM teachers WHERE id IN (?)', [tids]);
        const [avail] = await pool.query<RowDataPacket[]>('SELECT teacher_id, day, hour, is_optional FROM teacher_availability WHERE teacher_id IN (?)', [tids]);
        const teachers = trows.map(t => ({
            id: t.id, name: t.name, category: t.category, orden: t.orden, required_hours: requiredOf(t),
            availability: avail.filter(a => a.teacher_id === t.id).map(a => ({ day: a.day, hour: a.hour, is_optional: !!a.is_optional })),
        }));

        const fetchFn: any = (globalThis as any).fetch;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), (Number(time_limit_seconds) + 60) * 1000);
        let solved: any;
        try {
            const sr = await fetchFn(`${SOLVER_URL}/solve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
                body: JSON.stringify({
                    semester_id: semesterId,
                    description,
                    time_limit_seconds,
                    max_theory_rooms: maxTheoryRooms,
                    max_lab_rooms: maxLabRooms,
                    teachers,
                    courses: [...courseMap.values()],
                }),
            });
            solved = await sr.json();
            if (!sr.ok) { res.status(sr.status === 422 ? 422 : 502).json({ error: 'El solver no encontró un horario', detail: solved.detail ?? solved }); return; }
        } catch (e: any) {
            res.status(503).json({ error: 'No se pudo contactar al microservicio del solver', hint: `Verifique ${SOLVER_URL}/health`, detail: String(e) }); return;
        } finally { clearTimeout(timer); }

        const { placed, unplaced } = await placeRooms(semesterId, solved.sessions, replace_existing);
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            if (replace_existing) await conn.query('DELETE FROM assignments WHERE semester_id=?', [semesterId]);
            for (const p of placed) {
                await conn.query(
                    `INSERT INTO assignments (semester_id, course_id, teacher_id, classroom_id, day_of_week, start_time, end_time, section, session_type)
                     VALUES (?,?,?,?,?,?,?,?,?)`,
                    [semesterId, p.course_db_id, p.teacher_db_id, p.classroom_id, DAY_NAMES.indexOf(p.day) + 1, p.start_time, p.end_time, p.section, p.session_type]);
            }
            await conn.query('INSERT INTO solver_results (process_id, version_id, status, sessions_json, unplaced_json) VALUES (?,?,?,?,?)',
                [pid, solved.version_id, solved.status, JSON.stringify(placed), JSON.stringify(unplaced)]);
            await conn.query("UPDATE adjudicacion_process SET status='COMPLETADO' WHERE id=?", [pid]);
            await conn.commit();
        } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

        res.json({ success: true, solver_status: solved.status, version_id: solved.version_id,
                   sessions_scheduled: solved.sessions.length, assignments_saved: placed.length,
                   sessions_without_room: unplaced.length, unplaced: unplaced.map((u: any) => `${u.section_id} ${u.course_name} ${u.session_type} ${u.day} ${u.start_time}`) });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Error al generar horario', detail: String(e) }); }
});

// ── GET /:id/resultado ───────────────────────────────────────────────────────
router.get('/:id/resultado', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM solver_results WHERE process_id=? ORDER BY id DESC LIMIT 1', [Number(req.params.id)]);
        if (!rows.length) { res.status(404).json({ error: 'Sin resultados para este proceso' }); return; }
        const r = rows[0];
        res.json({ version_id: r.version_id, status: r.status, created_at: r.created_at,
                   sessions: JSON.parse(r.sessions_json || '[]'), unplaced: JSON.parse(r.unplaced_json || '[]') });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Error al obtener resultado' }); }
});

// ── GET /:id/exportar-excel ──────────────────────────────────────────────────
router.get('/:id/exportar-excel', async (req: Request, res: Response) => {
    try {
        const pid = Number(req.params.id);
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM solver_results WHERE process_id=? ORDER BY id DESC LIMIT 1', [pid]);
        if (!rows.length) { res.status(404).json({ error: 'No hay horario generado para exportar' }); return; }
        const r = rows[0];
        const sessions = JSON.parse(r.sessions_json || '[]');
        const fetchFn: any = (globalThis as any).fetch;
        const sr = await fetchFn(`${SOLVER_URL}/export-excel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version_id: r.version_id, sessions }),
        });
        if (!sr.ok) {
            res.status(502).json({ error: 'Error al generar el archivo Excel en el solver' });
            return;
        }
        const arrayBuffer = await sr.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Horario_EPI_${r.version_id}.xlsx"`);
        res.send(buffer);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al exportar a Excel' });
    }
});

// ── DELETE /:id (Reiniciar / eliminar proceso) ───────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
    if (!requireDirectorIfAuth(req, res)) return;
    try {
        const pid = Number(req.params.id);
        await pool.query('DELETE FROM adjudicacion_process WHERE id = ?', [pid]);
        res.json({ deleted: true, process_id: pid });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al eliminar el proceso' });
    }
});

export default router;
