/**
 * carga_2026_2.ts — Carga horaria oficial del semestre 2026-2 (extraída de
 * "Carga horaria por docente 2026-2.csv" y "Carga horaria por docente 2026-2.md").
 *
 * Incluye:
 *  - Los docentes del semestre 2026-2 (plana EPI + docentes de servicio de Matemáticas,
 *    Estadística y Estudios Generales).
 *  - Las sesiones adjudicadas por curso, sección y tipo (Teoría, Práctica, Laboratorio)
 *    para los ciclos II (A/B), I y III por repetición (A), IV (A/B), VI (A/B), VIII (A) y X (A).
 */
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import pool from './db';

export interface Teacher2026_2 {
    key: string;          // Nombre en el CSV/MD
    code: string;         // Código docente en BD
    dbName: string;       // Nombre completo normalizado
    email: string;
    category: 'Principal' | 'Asociado' | 'Auxiliar' | 'Contratado';
    orden: number;
    programmableHours: number; // Horas en aulas programables por CP-SAT (bloques de 2h)
    internshipHours?: number;  // Horas de Prácticas Preprofesionales (sin aula física)
}

export const TEACHERS_2026_2: Teacher2026_2[] = [
    // Principales
    { key: 'Jorge Gutiérrez Gutiérrez',       code: 'DOC-01', dbName: 'GUTIERREZ GUTIERREZ JORGE LUIS',       email: 'jgutierrez@unitru.edu.pe',  category: 'Principal',  orden: 1,  programmableHours: 12 },
    { key: 'José Rodríguez Melquiades',       code: 'DOC-02', dbName: 'RODRIGUEZ MELQUIADES JOSE ANTONIO',    email: 'jrodriguez@unitru.edu.pe',  category: 'Principal',  orden: 2,  programmableHours: 12 },

    // Asociados
    { key: 'Carlos Enrique Castillo Diestra', code: 'DOC-03', dbName: 'CASTILLO DIESTRA CARLOS ENRIQUE',      email: 'ccastillod@unitru.edu.pe',  category: 'Asociado',   orden: 1,  programmableHours: 16 },
    { key: 'Yenny Milagritos Sifuentes Diaz', code: 'DOC-04', dbName: 'SIFUENTES DIAZ YENNY MILAGROS',        email: 'ysifuentes@unitru.edu.pe',  category: 'Asociado',   orden: 2,  programmableHours: 2, internshipHours: 10 },
    { key: 'José Cruz Silva',                 code: 'DOC-05', dbName: 'CRUZ SILVA JOSE GABRIEL',              email: 'jcruz@unitru.edu.pe',       category: 'Asociado',   orden: 3,  programmableHours: 22 },
    { key: 'Edwin Raúl Mendoza Torres',       code: 'DOC-06', dbName: 'MENDOZA TORRES EDWIN RAUL',            email: 'emendoza@unitru.edu.pe',    category: 'Asociado',   orden: 4,  programmableHours: 12 },
    { key: 'Anthony Jose Gomez Morales',      code: 'DOC-10', dbName: 'GOMEZ MORALES ANTHONY JOSE',           email: 'agomez@unitru.edu.pe',      category: 'Asociado',   orden: 6,  programmableHours: 0, internshipHours: 9 },
    { key: 'María Teresita Rojas García',     code: 'DOC-29', dbName: 'ROJAS GARCIA MARIA TERESITA',          email: 'mrojasg@unitru.edu.pe',     category: 'Asociado',   orden: 7,  programmableHours: 12 },
    { key: 'Esteban Castillo Pereda',         code: 'DOC-30', dbName: 'CASTILLO PEREDA ESTEBAN',              email: 'ecastillop@unitru.edu.pe',  category: 'Asociado',   orden: 8,  programmableHours: 12 },

    // Auxiliares
    { key: 'Iris Cruz Florian',               code: 'DOC-08', dbName: 'CRUZ FLORIAN IRIS AUREA',              email: 'icruz@unitru.edu.pe',       category: 'Auxiliar',   orden: 1,  programmableHours: 18 },
    { key: 'José Peralta Luján',              code: 'DOC-09', dbName: 'PERALTA LUJAN JOSE LUIS',              email: 'jperalta@unitru.edu.pe',    category: 'Auxiliar',   orden: 2,  programmableHours: 18 },
    { key: 'Ricardo Manuel Guevara Ruiz',     code: 'DOC-11', dbName: 'GUEVARA RUIZ RICARDO MANUEL',          email: 'rguevara@unitru.edu.pe',    category: 'Auxiliar',   orden: 3,  programmableHours: 16 },
    { key: 'Sofía Pedro Huaman',              code: 'DOC-12', dbName: 'PEDRO HUAMAN LIZ SOFIA RAYMUNDA',      email: 'lpedro@unitru.edu.pe',      category: 'Auxiliar',   orden: 4,  programmableHours: 18 },
    { key: 'Víctor Jaime Polo Romero',        code: 'DOC-13', dbName: 'POLO ROMERO VICTOR JAIME',             email: 'vpolo@unitru.edu.pe',       category: 'Auxiliar',   orden: 5,  programmableHours: 6 },
    { key: 'Medardo Quispe Varón',            code: 'DOC-14', dbName: 'QUISPE VARON CELESTINO MEDARDO',       email: 'cmquispe@unitru.edu.pe',    category: 'Auxiliar',   orden: 6,  programmableHours: 18 },
    { key: 'Juan Francisco Pacheco Torres',   code: 'DOC-16', dbName: 'PACHECO TORRES JUAN FRANCISCO',        email: 'fpacheco@unitru.edu.pe',    category: 'Auxiliar',   orden: 8,  programmableHours: 8 },

    // Contratados y docentes de servicio 2026-2
    { key: 'Jorge David Bravo Escalante',     code: 'DOC-17', dbName: 'BRAVO ESCALANTE JORGE DAVID',          email: 'jbravo@unitru.edu.pe',      category: 'Contratado', orden: 1,  programmableHours: 18 },
    { key: 'Lourdes Cajachuan',               code: 'DOC-18', dbName: 'RAMIREZ CERNA LOURDES (CAJACHUAN)',    email: 'lramirezc@unitru.edu.pe',   category: 'Contratado', orden: 2,  programmableHours: 12 },
    { key: 'Jorge Alvarado Ramos',            code: 'DOC-19', dbName: 'ALVARADO RAMOS JORGE LUIS',            email: 'jalvarador@unitru.edu.pe',  category: 'Contratado', orden: 3,  programmableHours: 20 },
    { key: 'Yosip Urquizo Gómez',             code: 'DOC-20', dbName: 'UROUZO GOMEZ YOSIP VLADIMIR',          email: 'yurquizo@unitru.edu.pe',    category: 'Contratado', orden: 4,  programmableHours: 8 },
    { key: 'Manuel Abanto Corcuera',          code: 'DOC-21', dbName: 'ABANTO CONCUEAR MANUEL REGILDER',      email: 'mabantoco@unitru.edu.pe',   category: 'Contratado', orden: 5,  programmableHours: 6 },
    { key: 'Max Castro Rodríguez',            code: 'DOC-26', dbName: 'CASTRO RODRIGUEZ MAX',                 email: 'mcastro@unitru.edu.pe',     category: 'Contratado', orden: 7,  programmableHours: 16 },
    { key: 'Wilmer Apaza Chávez',             code: 'DOC-27', dbName: 'APAZA CHAVEZ WILMER',                  email: 'wapaza@unitru.edu.pe',      category: 'Contratado', orden: 8,  programmableHours: 12 },
    { key: 'Edgard José Peláez Vinces',       code: 'DOC-28', dbName: 'PELAEZ VINCES EDGARD JOSE',            email: 'epelaez@unitru.edu.pe',     category: 'Contratado', orden: 9,  programmableHours: 8 },
    { key: 'Silvia Alfaro Luján',             code: 'DOC-31', dbName: 'ALFARO LUJAN SILVIA',                  email: 'salfaro@unitru.edu.pe',     category: 'Contratado', orden: 10, programmableHours: 8 },
    { key: 'Miguel Mori',                     code: 'DOC-32', dbName: 'MORI MIGUEL',                          email: 'mmori@unitru.edu.pe',       category: 'Contratado', orden: 11, programmableHours: 4 },
    { key: 'Cesario Carlos Chávez',           code: 'DOC-33', dbName: 'CHAVEZ CESARIO CARLOS',                email: 'cchavez@unitru.edu.pe',     category: 'Contratado', orden: 12, programmableHours: 4 },
    { key: 'Estudios Generales',              code: 'DOC-34', dbName: 'ESTUDIOS GENERALES (TALLERES)',        email: 'egenerales@unitru.edu.pe',  category: 'Contratado', orden: 13, programmableHours: 8 },
    { key: 'Willy Zubiaga Vera',              code: 'DOC-35', dbName: 'ZUBIAGA VERA WILLY',                   email: 'wzubiaga@unitru.edu.pe',    category: 'Contratado', orden: 14, programmableHours: 6 },
    { key: 'Julio Becerra',                   code: 'DOC-36', dbName: 'BECERRA JULIO',                        email: 'jbecerra@unitru.edu.pe',    category: 'Contratado', orden: 15, programmableHours: 6 },
    { key: 'Luis Ponte',                      code: 'DOC-37', dbName: 'PONTE LUIS',                           email: 'lponte@unitru.edu.pe',      category: 'Contratado', orden: 16, programmableHours: 6 },
    { key: 'Ronal León',                      code: 'DOC-38', dbName: 'LEON RONAL',                           email: 'rleon@unitru.edu.pe',       category: 'Contratado', orden: 17, programmableHours: 2 },
];

export interface Session2026_2 {
    courseCode: string;
    section: string;
    sessionType: 'Teoria' | 'Practica' | 'Laboratorio';
    hours: number;
    teacherKey: string;
}

export const SESSIONS_2026_2: Session2026_2[] = [
    // ── CICLO II - SECCIÓN A ──────────────────────────────────────────────────
    { courseCode: '13043', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Edgard José Peláez Vinces' },
    { courseCode: '13043', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Edgard José Peláez Vinces' },
    { courseCode: '13039', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Iris Cruz Florian' },
    { courseCode: '13039', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Iris Cruz Florian' },
    { courseCode: '13039', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Iris Cruz Florian' },
    { courseCode: '13038', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'María Teresita Rojas García' },
    { courseCode: '13038', section: 'A', sessionType: 'Practica',    hours: 4, teacherKey: 'María Teresita Rojas García' },
    { courseCode: '13034', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Esteban Castillo Pereda' },
    { courseCode: '13034', section: 'A', sessionType: 'Practica',    hours: 4, teacherKey: 'Esteban Castillo Pereda' },
    { courseCode: '13046', section: 'A', sessionType: 'Practica',    hours: 4, teacherKey: 'Estudios Generales' },
    { courseCode: '13040', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Miguel Mori' },
    { courseCode: '13040', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Miguel Mori' },
    { courseCode: '13036', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Silvia Alfaro Luján' },
    { courseCode: '13036', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Silvia Alfaro Luján' },

    // ── CICLO II - SECCIÓN B ──────────────────────────────────────────────────
    { courseCode: '13043', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Edgard José Peláez Vinces' },
    { courseCode: '13043', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Edgard José Peláez Vinces' },
    { courseCode: '13039', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Iris Cruz Florian' },
    { courseCode: '13039', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Iris Cruz Florian' },
    { courseCode: '13039', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Iris Cruz Florian' },
    { courseCode: '13038', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'María Teresita Rojas García' },
    { courseCode: '13038', section: 'B', sessionType: 'Practica',    hours: 4, teacherKey: 'María Teresita Rojas García' },
    { courseCode: '13034', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Esteban Castillo Pereda' },
    { courseCode: '13034', section: 'B', sessionType: 'Practica',    hours: 4, teacherKey: 'Esteban Castillo Pereda' },
    { courseCode: '13046', section: 'B', sessionType: 'Practica',    hours: 4, teacherKey: 'Estudios Generales' },
    { courseCode: '13040', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Cesario Carlos Chávez' },
    { courseCode: '13040', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Cesario Carlos Chávez' },
    { courseCode: '13036', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Silvia Alfaro Luján' },
    { courseCode: '13036', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Silvia Alfaro Luján' },

    // ── CICLO I y III - REPETICIÓN (SECCIÓN A) ────────────────────────────────
    { courseCode: '13028', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Luis Ponte' },
    { courseCode: '13028', section: 'A', sessionType: 'Practica',    hours: 4, teacherKey: 'Luis Ponte' },
    { courseCode: '13629', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Willy Zubiaga Vera' },
    { courseCode: '13629', section: 'A', sessionType: 'Practica',    hours: 4, teacherKey: 'Willy Zubiaga Vera' },
    { courseCode: '13632', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Julio Becerra' },
    { courseCode: '13632', section: 'A', sessionType: 'Practica',    hours: 4, teacherKey: 'Julio Becerra' },
    { courseCode: '13634', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Ronal León' },

    // ── CICLO IV - SECCIÓN A ──────────────────────────────────────────────────
    { courseCode: '13637', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'José Rodríguez Melquiades' },
    { courseCode: '13637', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'José Rodríguez Melquiades' },
    { courseCode: '13637', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'José Rodríguez Melquiades' },
    { courseCode: '13640', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Juan Francisco Pacheco Torres' },
    { courseCode: '13640', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Juan Francisco Pacheco Torres' },
    { courseCode: '13638', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Jorge David Bravo Escalante' },
    { courseCode: '13638', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'José Peralta Luján' },
    { courseCode: '13638', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Sofía Pedro Huaman' },
    { courseCode: '13636', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Max Castro Rodríguez' },
    { courseCode: '13636', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Max Castro Rodríguez' },
    { courseCode: '13636', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Max Castro Rodríguez' },
    { courseCode: '13635', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'José Peralta Luján' },
    { courseCode: '13635', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'José Peralta Luján' },
    { courseCode: '13635', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'José Peralta Luján' },
    { courseCode: '13639', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'José Cruz Silva' },
    { courseCode: '13639', section: 'A', sessionType: 'Practica',    hours: 4, teacherKey: 'José Cruz Silva' },
    { courseCode: '13639', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Lourdes Cajachuan' },

    // ── CICLO IV - SECCIÓN B ──────────────────────────────────────────────────
    { courseCode: '13637', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Jorge Gutiérrez Gutiérrez' },
    { courseCode: '13637', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Iris Cruz Florian' },
    { courseCode: '13637', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'José Rodríguez Melquiades' },
    { courseCode: '13640', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Juan Francisco Pacheco Torres' },
    { courseCode: '13640', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Juan Francisco Pacheco Torres' },
    { courseCode: '13638', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Sofía Pedro Huaman' },
    { courseCode: '13638', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Sofía Pedro Huaman' },
    { courseCode: '13638', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Sofía Pedro Huaman' },
    { courseCode: '13636', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Max Castro Rodríguez' },
    { courseCode: '13636', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Max Castro Rodríguez' },
    { courseCode: '13636', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Max Castro Rodríguez' },
    { courseCode: '13635', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'José Peralta Luján' },
    { courseCode: '13635', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'José Peralta Luján' },
    { courseCode: '13635', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'José Peralta Luján' },
    { courseCode: '13639', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'José Cruz Silva' },
    { courseCode: '13639', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'José Cruz Silva' },
    { courseCode: '13639', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Lourdes Cajachuan' },

    // ── CICLO VI - SECCIÓN A ──────────────────────────────────────────────────
    { courseCode: '14071', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Lourdes Cajachuan' },
    { courseCode: '14071', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Jorge Gutiérrez Gutiérrez' },
    { courseCode: '14070', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Ricardo Manuel Guevara Ruiz' },
    { courseCode: '14070', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Ricardo Manuel Guevara Ruiz' },
    { courseCode: '14070', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Ricardo Manuel Guevara Ruiz' },
    { courseCode: '14069', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Medardo Quispe Varón' },
    { courseCode: '14069', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Medardo Quispe Varón' },
    { courseCode: '14069', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Medardo Quispe Varón' },
    { courseCode: '14068', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Jorge David Bravo Escalante' },
    { courseCode: '14068', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Jorge David Bravo Escalante' },
    { courseCode: '14068', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Jorge David Bravo Escalante' },
    { courseCode: '14072', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Jorge Alvarado Ramos' },
    { courseCode: '14072', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Jorge Alvarado Ramos' },
    { courseCode: '14072', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Jorge Alvarado Ramos' },
    { courseCode: '14073', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'José Cruz Silva' },
    { courseCode: '14073', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'José Cruz Silva' },
    { courseCode: '14073', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'José Cruz Silva' },

    // ── CICLO VI - SECCIÓN B ──────────────────────────────────────────────────
    { courseCode: '14071', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Lourdes Cajachuan' },
    { courseCode: '14071', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Jorge Gutiérrez Gutiérrez' },
    { courseCode: '14070', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Ricardo Manuel Guevara Ruiz' },
    { courseCode: '14070', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Ricardo Manuel Guevara Ruiz' },
    { courseCode: '14070', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Ricardo Manuel Guevara Ruiz' },
    { courseCode: '14069', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Medardo Quispe Varón' },
    { courseCode: '14069', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Medardo Quispe Varón' },
    { courseCode: '14069', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Medardo Quispe Varón' },
    { courseCode: '14068', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Jorge David Bravo Escalante' },
    { courseCode: '14068', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Jorge David Bravo Escalante' },
    { courseCode: '14068', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Jorge David Bravo Escalante' },
    { courseCode: '14072', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Jorge Alvarado Ramos' },
    { courseCode: '14072', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'Jorge Alvarado Ramos' },
    { courseCode: '14072', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Jorge Alvarado Ramos' },
    { courseCode: '14073', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'José Cruz Silva' },
    { courseCode: '14073', section: 'B', sessionType: 'Practica',    hours: 2, teacherKey: 'José Cruz Silva' },
    { courseCode: '14073', section: 'B', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Wilmer Apaza Chávez' },

    // ── CICLO VIII - SECCIÓN A ────────────────────────────────────────────────
    { courseCode: '14080', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Manuel Abanto Corcuera' },
    { courseCode: '14080', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Manuel Abanto Corcuera' },
    { courseCode: '14081', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Edwin Raúl Mendoza Torres' },
    { courseCode: '14081', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Jorge Alvarado Ramos' },
    { courseCode: '14082', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Yosip Urquizo Gómez' },
    { courseCode: '14082', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Yosip Urquizo Gómez' },
    { courseCode: '14082', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Yosip Urquizo Gómez' },

    // ── CICLO X - SECCIÓN A (Y GRUPOS DE ASESORÍA DE TESIS A, B, C) ───────────
    { courseCode: '14090', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Wilmer Apaza Chávez' },
    { courseCode: '14090', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Wilmer Apaza Chávez' },
    { courseCode: '14090', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Wilmer Apaza Chávez' },
    { courseCode: '14091', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Víctor Jaime Polo Romero' },
    { courseCode: '14091', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Víctor Jaime Polo Romero' },
    { courseCode: '14092', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Medardo Quispe Varón' },
    { courseCode: '14092', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Carlos Enrique Castillo Diestra' },
    { courseCode: '14093', section: 'A', sessionType: 'Practica',    hours: 2, teacherKey: 'Edwin Raúl Mendoza Torres' },
    { courseCode: '14093', section: 'A', sessionType: 'Laboratorio', hours: 4, teacherKey: 'Edwin Raúl Mendoza Torres' },
    { courseCode: '14094', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Carlos Enrique Castillo Diestra' },
    { courseCode: '14094', section: 'A', sessionType: 'Practica',    hours: 8, teacherKey: 'Carlos Enrique Castillo Diestra' },
    { courseCode: 'INF43', section: 'A', sessionType: 'Teoria',      hours: 2, teacherKey: 'Jorge Gutiérrez Gutiérrez' },
    { courseCode: 'INF43', section: 'A', sessionType: 'Practica',    hours: 4, teacherKey: 'Carlos Enrique Castillo Diestra' },
    { courseCode: 'INF43', section: 'B', sessionType: 'Teoria',      hours: 2, teacherKey: 'Sofía Pedro Huaman' },
    { courseCode: 'INF43', section: 'B', sessionType: 'Practica',    hours: 4, teacherKey: 'Sofía Pedro Huaman' },
    { courseCode: 'INF43', section: 'C', sessionType: 'Teoria',      hours: 2, teacherKey: 'Yenny Milagritos Sifuentes Diaz' },
    { courseCode: 'INF43', section: 'C', sessionType: 'Practica',    hours: 4, teacherKey: 'Edwin Raúl Mendoza Torres' },
];

const DAYS_LIST = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HOURS_LIST = Array.from({ length: 14 }, (_, i) => `${7 + i < 10 ? '0' : ''}${7 + i}:00`);

/**
 * Inserta/actualiza los docentes del 2026-2, asegura su disponibilidad Lun-Vie,
 * y crea el proceso de adjudicación 2026-2 con todas sus sesiones confirmadas.
 */
export async function loadCarga2026_2(targetSemesterId?: number): Promise<{
    process_id: number;
    semester_id: number;
    teachers_count: number;
    sessions_count: number;
    total_hours: number;
}> {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Determinar el semestre 2026-II (o activo)
        let semesterId = targetSemesterId;
        if (!semesterId) {
            const [sems] = await conn.query<RowDataPacket[]>(
                "SELECT id FROM semesters WHERE name LIKE '%2026-II%' OR name LIKE '%2026-2%' OR is_active = 1 ORDER BY is_active DESC, id DESC LIMIT 1"
            );
            if (!sems.length) {
                const [ins] = await conn.query<ResultSetHeader>(
                    "INSERT INTO semesters (name, start_date, end_date, is_active) VALUES ('2026-II', '2026-08-17', '2026-12-18', TRUE)"
                );
                semesterId = ins.insertId;
            } else {
                semesterId = sems[0].id;
            }
        }

        // 2. Asegurar docentes de la carga 2026-2, sus usuarios y sus horas requeridas del 2026-2
        const teacherIdByKey = new Map<string, number>();
        for (const t of TEACHERS_2026_2) {
            const [existing] = await conn.query<RowDataPacket[]>(
                'SELECT id FROM teachers WHERE code = ? OR email = ? LIMIT 1',
                [t.code, t.email]
            );
            let tid: number;
            const totalReq = t.programmableHours > 0 ? t.programmableHours : (t.internshipHours || 12);
            if (existing.length > 0) {
                tid = existing[0].id;
                await conn.query(
                    'UPDATE teachers SET required_hours = ?, max_hours = ?, orden = ? WHERE id = ?',
                    [totalReq, Math.max(totalReq, 12), t.orden, tid]
                );
            } else {
                const seed = t.dbName.split(' ')[0].toLowerCase();
                const [ins] = await conn.query<ResultSetHeader>(
                    `INSERT INTO teachers (code, name, email, category, avatar, max_hours, required_hours, role, orden)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'DOCENTE', ?)`,
                    [t.code, t.dbName, t.email, t.category, `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`, Math.max(totalReq, 12), totalReq, t.orden]
                );
                tid = ins.insertId;
            }
            teacherIdByKey.set(t.key, tid);

            // Asegurar usuario de acceso para el docente
            const uname = t.email.split('@')[0];
            await conn.query(
                'INSERT IGNORE INTO users (username, password, role, teacher_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
                [uname, t.code, 'DOCENTE', tid]
            );

            // Asegurar disponibilidad Lun-Vie 07:00-20:00 si aún no tiene bloques suficientes
            const [avCount] = await conn.query<RowDataPacket[]>(
                'SELECT COUNT(*) AS n FROM teacher_availability WHERE teacher_id = ?',
                [tid]
            );
            if (Number(avCount[0].n) < totalReq) {
                await conn.query('DELETE FROM teacher_availability WHERE teacher_id = ?', [tid]);
                const avValues: any[] = [];
                for (const d of DAYS_LIST) {
                    for (const h of HOURS_LIST) {
                        avValues.push([tid, d, h, 0]);
                    }
                }
                await conn.query('INSERT INTO teacher_availability (teacher_id, day, hour, is_optional) VALUES ?', [avValues]);
            }
        }

        // 3. Mapear códigos de curso a IDs en la tabla courses
        const [courseRows] = await conn.query<RowDataPacket[]>('SELECT id, code FROM courses');
        const courseIdByCode = new Map<string, number>();
        courseRows.forEach(c => courseIdByCode.set(String(c.code), c.id));

        // 4. Reemplazar procesos previos en ese semestre y crear el proceso oficial 2026-2
        await conn.query('DELETE FROM adjudicacion_process WHERE semester_id = ?', [semesterId]);

        const cfg = {
            period: 'PAR',
            description: 'Carga Horaria Oficial 2026-2 (CSV/MD)',
            custom_pool: true,
            cycles: [1, 2, 3, 4, 6, 8, 10],
            sections: ['A', 'B'],
            cycle_sections: {
                '1': ['A'],
                '2': ['A', 'B'],
                '3': ['A'],
                '4': ['A', 'B'],
                '6': ['A', 'B'],
                '8': ['A'],
                '10': ['A'],
            },
        };

        const [procIns] = await conn.query<ResultSetHeader>(
            "INSERT INTO adjudicacion_process (semester_id, status, config_json) VALUES (?, 'COMPLETADO', ?)",
            [semesterId, JSON.stringify(cfg)]
        );
        const pid = procIns.insertId;

        // 5. Insertar turnos confirmados para los docentes programables en aulas del 2026-2
        const programmableTeachers = TEACHERS_2026_2.filter(t => t.programmableHours > 0);
        for (let i = 0; i < programmableTeachers.length; i++) {
            const tid = teacherIdByKey.get(programmableTeachers[i].key)!;
            await conn.query(
                "INSERT INTO adjudicacion_turns (process_id, teacher_id, turno, status) VALUES (?, ?, ?, 'CONFIRMADO')",
                [pid, tid, i + 1]
            );
        }

        // 6. Insertar las 104 sesiones adjudicadas y confirmadas de la carga 2026-2
        let totalHours = 0;
        for (const s of SESSIONS_2026_2) {
            const cid = courseIdByCode.get(s.courseCode);
            const tid = teacherIdByKey.get(s.teacherKey);
            if (!cid || !tid) {
                throw new Error(`Curso ${s.courseCode} o docente ${s.teacherKey} no encontrado en BD`);
            }
            await conn.query(
                `INSERT INTO adjudicacion_sessions (process_id, teacher_id, course_id, section, session_type, hours, confirmed)
                 VALUES (?, ?, ?, ?, ?, ?, 1)`,
                [pid, tid, cid, s.section, s.sessionType, s.hours]
            );
            totalHours += s.hours;
        }

        await conn.commit();
        return {
            process_id: pid,
            semester_id: Number(semesterId),
            teachers_count: programmableTeachers.length,
            sessions_count: SESSIONS_2026_2.length,
            total_hours: totalHours,
        };
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}
