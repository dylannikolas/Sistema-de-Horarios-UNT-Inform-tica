
import { Semester, Teacher, Course, Classroom } from './types';

export const INITIAL_SEMESTERS: Semester[] = [
  { id: '1', name: '2024-I', startDate: '2024-04-01', endDate: '2024-07-31', isActive: true },
  { id: '2', name: '2023-II', startDate: '2023-10-01', endDate: '2024-02-15', isActive: false },
];

export const INITIAL_TEACHERS: Teacher[] = [
  // Added role: 'DOCENTE' to fix missing property errors
  { id: 't1', name: 'Dr. Juan Pérez', email: 'juan.perez@unitru.edu.pe', category: 'Principal', code: '123456', avatar: 'https://picsum.photos/seed/juan/200', maxHours: 20, role: 'DOCENTE' },
  { id: 't2', name: 'Mg. María Rodríguez', email: 'm.rodriguez@unitru.edu.pe', category: 'Asociado', code: '654321', avatar: 'https://picsum.photos/seed/maria/200', maxHours: 18, role: 'DOCENTE' },
  { id: 't3', name: 'Dr. Carlos Sánchez', email: 'c.sanchez@unitru.edu.pe', category: 'Principal', code: '789012', avatar: 'https://picsum.photos/seed/carlos/200', maxHours: 20, role: 'DOCENTE' },
];

export const INITIAL_COURSES: Course[] = [
  { id: 'c1', code: 'INF-101', name: 'Introducción a la Programación', cycle: 'I', credits: 4, hoursPerWeek: 6 },
  { id: 'c2', code: 'INF-203', name: 'Arquitectura de Computadoras', cycle: 'II', credits: 4, hoursPerWeek: 5 },
  { id: 'c3', code: 'INF-301', name: 'Estructuras de Datos', cycle: 'III', credits: 4, hoursPerWeek: 6 },
  { id: 'c4', code: 'INF-502', name: 'Ingeniería de Software I', cycle: 'V', credits: 4, hoursPerWeek: 5 },
];

export const INITIAL_CLASSROOMS: Classroom[] = [
  { id: 'r1', name: 'Aula Teórica 101', type: 'Teoría', capacity: 40 },
  { id: 'r2', name: 'Lab. Cómputo 04', type: 'Laboratorio', capacity: 25 },
  { id: 'r3', name: 'Lab. Cómputo 02', type: 'Laboratorio', capacity: 30 },
];
