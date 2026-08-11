-- Script para insertar todas las aulas y laboratorios
-- Basado en la lista de laboratorios especializados proporcionada

USE sistema_horarios;

-- Limpiar aulas existentes de ejemplo (opcional, comentar si no deseas eliminar)
-- DELETE FROM classrooms;

-- LABORATORIOS ESPECIALIZADOS
INSERT INTO classrooms (name, type, capacity) VALUES
('LABORATORIO ESPECIALIZADO A', 'Laboratorio', 30),
('LABORATORIO ESPECIALIZADO B', 'Laboratorio', 30),
('LABORATORIO ESPECIALIZADO C', 'Laboratorio', 30);

-- AULAS TEÓRICAS
INSERT INTO classrooms (name, type, capacity) VALUES
('AULA TEÓRICA 101', 'Teoría', 40),
('AULA TEÓRICA 102', 'Teoría', 40),
('AULA TEÓRICA 201', 'Teoría', 45),
('AULA TEÓRICA 202', 'Teoría', 45);

-- LABORATORIOS DE CÓMPUTO GENERAL
INSERT INTO classrooms (name, type, capacity) VALUES
('LABORATORIO DE CÓMPUTO 01', 'Laboratorio', 25),
('LABORATORIO DE CÓMPUTO 02', 'Laboratorio', 25);

-- Verificar la inserción
SELECT COUNT(*) as total_aulas FROM classrooms;

-- Ver aulas por tipo
SELECT 
  type, 
  COUNT(*) as cantidad, 
  SUM(capacity) as capacidad_total 
FROM classrooms 
GROUP BY type 
ORDER BY type;

-- Ver todas las aulas insertadas
SELECT 
  id,
  name,
  type,
  capacity
FROM classrooms 
ORDER BY type, name;

-- Estadísticas de capacidad
SELECT 
  MIN(capacity) as capacidad_minima,
  MAX(capacity) as capacidad_maxima,
  AVG(capacity) as capacidad_promedio,
  SUM(capacity) as capacidad_total
FROM classrooms;
