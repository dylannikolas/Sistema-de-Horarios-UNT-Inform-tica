-- Script para insertar todos los cursos del plan de estudios
-- Basado en la malla curricular proporcionada

USE sistema_horarios;

-- Limpiar cursos existentes (opcional, comentar si no deseas eliminar)
-- DELETE FROM courses;

-- CICLO I
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('13024', 'Desarrollo Personal', 'I', 3, 4),
('13029', 'Lectoescritura y redacción de textos académicos', 'I', 3, 4),
('13027', 'Física general I', 'I', 4, 6),
('13021', 'Algoritmos y programación', 'I', 4, 6),
('13023', 'Desarrollo del pensamiento lógico y matemático', 'I', 3, 4),
('13028', 'Introducción al análisis matemático', 'I', 4, 6),
('13031', 'Taller de liderazgo y trabajo en equipo', 'I', 1, 2);

-- CICLO II
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('13040', 'Ética, convivencia humana y ciudadanía', 'II', 3, 4),
('13043', 'Sociedad, cultura y ecología', 'II', 3, 4),
('13036', 'Cultura investigativa y pensamiento crítico', 'II', 3, 4),
('13039', 'Estructura de datos', 'II', 4, 6),
('13038', 'Estadística general', 'II', 4, 6),
('13034', 'Análisis matemático', 'II', 4, 6),
('13046', 'Taller de manejo de TIC', 'II', 1, 2);

-- CICLO III
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('13029', 'Geometría analítica', 'III', 4, 6),
('13630', 'Paradigmas de lenguaje de programación', 'III', 4, 6),
('13631', 'Estrategias algorítmicas', 'III', 4, 6),
('13632', 'Matemática discreta', 'III', 4, 6),
('13633', 'Física para ciencia de la computación', 'III', 3, 4),
('13634', 'Análisis numérico', 'III', 3, 4),
('13635', 'Computación gráfica', 'III', 4, 6);

-- CICLO IV
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('13636', 'Organización de archivos', 'IV', 3, 4),
('13637', 'Algoritmos y complejidad', 'IV', 4, 6),
('13638', 'Lenguajes formales y autómatas', 'IV', 4, 6),
('13639', 'Electrónica para computación', 'IV', 4, 6),
('13640', 'Innovación y emprendimiento', 'IV', 3, 4),
('13641', 'Base de datos I', 'IV', 4, 6);

-- CICLO V
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('13642', 'Ingeniería de software I', 'V', 4, 6),
('13643', 'Inteligencia artificial I', 'V', 4, 6),
('13644', 'Compiladores', 'V', 4, 6),
('13645', 'Técnicas digitales para computación', 'V', 4, 6),
('13646', 'Metodología de la investigación científica', 'V', 2, 3);

-- CICLO VI
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('14068', 'Computación gráfica avanzada', 'VI', 4, 6),
('14069', 'Base de datos II', 'VI', 4, 6),
('14070', 'Ingeniería de software II', 'VI', 4, 6),
('14071', 'Inteligencia artificial II', 'VI', 2, 3),
('14072', 'Comunicación de datos', 'VI', 4, 6);

-- CICLO VII
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('14073', 'Arquitectura y organización de computadores', 'VII', 4, 6),
('14074', 'Base de datos avanzada', 'VII', 4, 6),
('14075', 'Desarrollo de software', 'VII', 4, 6),
('14076', 'Percepción y visión por computadores', 'VII', 4, 6),
('14077', 'Redes de computadoras I', 'VII', 4, 6),
('14078', 'Sistemas operativos I', 'VII', 4, 6);

-- CICLO VIII
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('14079', 'Gestión de proyectos informáticos', 'VIII', 2, 3),
('14080', 'Robótica', 'VIII', 4, 6),
('14081', 'Redes de computadoras II', 'VIII', 4, 6),
('14082', 'Sistemas operativos II', 'VIII', 4, 6),
('14083', 'Prácticas pre-profesionales', 'VIII', 10, 20);

-- CICLO IX
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('14084', 'Interacción humano computador', 'IX', 4, 6),
('14085', 'Tópicos en base de datos', 'IX', 4, 6),
('INF34', 'Tópicos en Ing. software', 'IX', 4, 6),
('14087', 'Ing. software avanzada', 'IX', 4, 6),
('14088', 'Seguridad informática', 'IX', 4, 6),
('14089', 'Proyecto de tesis', 'IX', 2, 3);

-- CICLO X
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('14090', 'Tópicos en tecnologías inmersivas', 'X', 4, 6),
('14091', 'Sistemas de información', 'X', 4, 6),
('14092', 'Ética para profesionales en informática', 'X', 4, 6),
('14093', 'Proyecto de competencia', 'X', 4, 6),
('14094', 'Proyecto integrador', 'X', 4, 6),
('INF43', 'Tesis', 'X', 2, 3);

-- Verificar la inserción
SELECT COUNT(*) as total_cursos FROM courses;
SELECT cycle, COUNT(*) as cursos_por_ciclo FROM courses GROUP BY cycle ORDER BY cycle;
