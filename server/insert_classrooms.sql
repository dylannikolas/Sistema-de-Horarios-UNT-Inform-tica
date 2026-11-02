-- Script para insertar las aulas reales de la Escuela Profesional de Informática (EPI - UNT)
-- Aulas teóricas (5): POOL-17, POOL-18, INFO-2, INFO-3, INFO-5
-- Laboratorios (3): LAB-A, LAB-B, LAB-C

USE sistema_horarios;

-- Limpiar aulas ficticias previas que no sean las 8 aulas reales EPI
DELETE FROM classrooms WHERE name NOT IN ('POOL-17', 'POOL-18', 'INFO-2', 'INFO-3', 'INFO-5', 'LAB-A', 'LAB-B', 'LAB-C');

-- AULAS TEÓRICAS (5 ambientes: para Teoría y Práctica)
INSERT INTO classrooms (name, type, capacity) VALUES
('POOL-17', 'Teoría', 35),
('POOL-18', 'Teoría', 35),
('INFO-2', 'Teoría', 25),
('INFO-3', 'Teoría', 25),
('INFO-5', 'Teoría', 25);

-- LABORATORIOS ESPECIALIZADOS (3 ambientes: para Laboratorio de 4h)
INSERT INTO classrooms (name, type, capacity) VALUES
('LAB-A', 'Laboratorio', 40),
('LAB-B', 'Laboratorio', 40),
('LAB-C', 'Laboratorio', 40);

-- Verificar la inserción
SELECT id, name, type, capacity FROM classrooms ORDER BY type, name;
