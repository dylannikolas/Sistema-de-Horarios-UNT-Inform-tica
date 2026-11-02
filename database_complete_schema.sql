-- ============================================================================
-- SCHEMA COMPLETO: SISTEMA DE HORARIOS EPI-UNT (SHARPEI + EPI SCHEDULER)
-- ============================================================================
-- Base de datos: sistema_horarios
-- Versión: 2.1 (Fusión completa Malla 2017 + Aulas Reales EPI + Adjudicación)
-- ============================================================================

DROP DATABASE IF EXISTS sistema_horarios;

CREATE DATABASE IF NOT EXISTS sistema_horarios
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sistema_horarios;

-- ============================================================================
-- PASO 1: CREACIÓN DE TABLAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT 'Nombre del semestre (ej: 2026-II)',
    start_date DATE NOT NULL COMMENT 'Fecha de inicio del semestre',
    end_date DATE NOT NULL COMMENT 'Fecha de fin del semestre',
    is_active BOOLEAN DEFAULT FALSE COMMENT 'Indica si es el semestre activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'Nombre completo del docente',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT 'Correo electrónico institucional',
    category ENUM('Principal', 'Asociado', 'Auxiliar', 'Contratado') NOT NULL COMMENT 'Categoría docente',
    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único del docente',
    avatar VARCHAR(255) DEFAULT NULL COMMENT 'URL de la foto del docente',
    max_hours INT DEFAULT 20 COMMENT 'Máximo de horas semanales permitidas',
    role ENUM('DIRECTOR', 'DOCENTE') DEFAULT 'DOCENTE' COMMENT 'Rol en el sistema',
    orden INT NOT NULL DEFAULT 999 COMMENT 'Orden de prelación dentro de su categoría',
    required_hours INT NOT NULL DEFAULT 12 COMMENT 'Horas reglamentarias exactas por categoría',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_code (code),
    INDEX idx_category (category),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código del curso (Malla 2017)',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre del curso',
    cycle VARCHAR(10) NOT NULL COMMENT 'Ciclo académico en romano (I..X)',
    credits INT NOT NULL COMMENT 'Número de créditos',
    hours_per_week INT NOT NULL COMMENT 'Horas semanales totales',
    hours_theory INT NOT NULL DEFAULT 0,
    hours_practice INT NOT NULL DEFAULT 0,
    hours_lab INT NOT NULL DEFAULT 0,
    has_lab TINYINT(1) NOT NULL DEFAULT 0,
    cycle_number INT NULL,
    course_tipo VARCHAR(2) NOT NULL DEFAULT 'ES',
    schedulable TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_cycle (cycle),
    INDEX idx_cycle_num (cycle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT 'Nombre del aula (POOL-17/18, INFO-2/3/5, LAB-A/B/C)',
    type ENUM('Teoría', 'Laboratorio') NOT NULL COMMENT 'Tipo de ambiente',
    capacity INT NOT NULL COMMENT 'Capacidad de estudiantes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teacher_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day VARCHAR(15) NOT NULL COMMENT 'Día de la semana (Lunes a Viernes)',
    hour VARCHAR(10) NOT NULL COMMENT 'Hora de inicio (07:00 a 20:00)',
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id),
    UNIQUE KEY unique_availability (teacher_id, day, hour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'DIRECTOR', 'DOCENTE') NOT NULL DEFAULT 'DOCENTE',
    teacher_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignments (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    INDEX idx_semester (semester_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_classroom (classroom_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS adjudicacion_process (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL,
    status ENUM('EN_PROCESO','COMPLETADO') NOT NULL DEFAULT 'EN_PROCESO',
    config_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS adjudicacion_turns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_id INT NOT NULL,
    teacher_id INT NOT NULL,
    turno INT NOT NULL,
    status ENUM('PENDIENTE','CONFIRMADO','OMITIDO') NOT NULL DEFAULT 'PENDIENTE',
    UNIQUE KEY uq_turn (process_id, teacher_id),
    FOREIGN KEY (process_id) REFERENCES adjudicacion_process(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS adjudicacion_sessions (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solver_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_id INT NOT NULL,
    version_id VARCHAR(20) NOT NULL,
    status VARCHAR(15) NOT NULL,
    sessions_json LONGTEXT,
    unplaced_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES adjudicacion_process(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PASO 2: INSERCIÓN DE SEMESTRES
-- ============================================================================

INSERT INTO semesters (name, start_date, end_date, is_active) VALUES
('2025-II', '2025-08-18', '2025-12-19', FALSE),
('2026-I',  '2026-04-06', '2026-07-31', FALSE),
('2026-II', '2026-08-17', '2026-12-18', TRUE);

-- ============================================================================
-- PASO 3: INSERCIÓN DE AULAS REALES EPI-UNT (8 AMBIENTES)
-- ============================================================================
-- Aulas teóricas (5): Teoría y Práctica
-- Laboratorios (3): Laboratorio (4h)

INSERT INTO classrooms (name, type, capacity) VALUES
('POOL-17', 'Teoría', 35),
('POOL-18', 'Teoría', 35),
('INFO-2',  'Teoría', 25),
('INFO-3',  'Teoría', 25),
('INFO-5',  'Teoría', 25),
('LAB-A',   'Laboratorio', 40),
('LAB-B',   'Laboratorio', 40),
('LAB-C',   'Laboratorio', 40);

-- ============================================================================
-- PASO 4: INSERCIÓN DE DOCENTES REALES EPI-UNT + DIRECTOR
-- ============================================================================

INSERT INTO teachers (code, name, email, category, avatar, max_hours, required_hours, role, orden) VALUES
-- Director de Escuela
('DIR-01', 'Dr. Juan Pérez García (Director)', 'director@unitru.edu.pe', 'Principal', 'https://api.dicebear.com/7.x/avataaars/svg?seed=director', 20, 20, 'DIRECTOR', 0),

-- Principales (4 docentes x 20h = 80h)
('DOC-01', 'GUTIERREZ GUTIERREZ JORGE LUIS', 'jgutierrez@unitru.edu.pe', 'Principal', 'https://api.dicebear.com/7.x/avataaars/svg?seed=gutierrez', 20, 20, 'DOCENTE', 1),
('DOC-02', 'RODRIGUEZ MELQUIADES JOSE ANTONIO', 'jrodriguez@unitru.edu.pe', 'Principal', 'https://api.dicebear.com/7.x/avataaars/svg?seed=rodriguez', 20, 20, 'DOCENTE', 2),
('DOC-23', 'SANCHEZ RUIZ CARLOS ALBERTO', 'csanchez@unitru.edu.pe', 'Principal', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sanchez', 20, 20, 'DOCENTE', 3),
('DOC-24', 'VARGAS SILVA FERNANDO ENRIQUE', 'fvargas@unitru.edu.pe', 'Principal', 'https://api.dicebear.com/7.x/avataaars/svg?seed=vargas', 20, 20, 'DOCENTE', 4),

-- Asociados (6 docentes x 18h = 108h)
('DOC-03', 'CASTILLO DIESTRA CARLOS ENRIQUE', 'ccastillod@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=castillo', 18, 18, 'DOCENTE', 1),
('DOC-04', 'SIFUENTES DIAZ YENNY MILAGROS', 'ysifuentes@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sifuentes', 18, 18, 'DOCENTE', 2),
('DOC-05', 'CRUZ SILVA JOSE GABRIEL', 'jcruz@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=cruz', 18, 18, 'DOCENTE', 3),
('DOC-06', 'MENDOZA TORRES EDWIN RAUL', 'emendoza@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mendoza', 18, 18, 'DOCENTE', 4),
('DOC-07', 'SALAZAR CAMPOS JUAN ORLANDO', 'jsalazarc@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=salazar', 18, 18, 'DOCENTE', 5),
('DOC-10', 'GOMEZ MORALES ANTHONY JOSE', 'agomez@unitru.edu.pe', 'Asociado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=gomez', 18, 18, 'DOCENTE', 6),

-- Auxiliares (8 docentes x 16h = 128h)
('DOC-08', 'CRUZ FLORIAN IRIS AUREA', 'icruz@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=iris', 16, 16, 'DOCENTE', 1),
('DOC-09', 'PERALTA LUJAN JOSE LUIS', 'jperalta@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=peralta', 16, 16, 'DOCENTE', 2),
('DOC-11', 'GUEVARA RUIZ RICARDO MANUEL', 'rguevara@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=guevara', 16, 16, 'DOCENTE', 3),
('DOC-12', 'PEDRO HUAMAN LIZ SOFIA RAYMUNDA', 'lpedro@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro', 16, 16, 'DOCENTE', 4),
('DOC-13', 'POLO ROMERO VICTOR JAIME', 'vpolo@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=polo', 16, 16, 'DOCENTE', 5),
('DOC-14', 'QUISPE VARON CELESTINO MEDARDO', 'cmquispe@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=quispe', 16, 16, 'DOCENTE', 6),
('DOC-15', 'PEREYRA SALVADOR PATRICIA GISSELLA', 'ppereyra@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=pereyra', 16, 16, 'DOCENTE', 7),
('DOC-16', 'PACHECO TORRES JUAN FRANCISCO', 'fpacheco@unitru.edu.pe', 'Auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=pacheco', 16, 16, 'DOCENTE', 8),

-- Contratados (6 docentes x 12h = 72h)
('DOC-17', 'BRAVO ESCALANTE JORGE DAVID', 'jbravo@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bravo', 12, 12, 'DOCENTE', 1),
('DOC-18', 'RAMIREZ CERNA LOURDES', 'lramirezc@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ramirez', 12, 12, 'DOCENTE', 2),
('DOC-19', 'ALVARADO RAMOS JORGE LUIS', 'jalvarador@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alvarado', 12, 12, 'DOCENTE', 3),
('DOC-20', 'UROUZO GOMEZ YOSIP VLADIMIR', 'yurquizo@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=urouzo', 12, 12, 'DOCENTE', 4),
('DOC-21', 'ABANTO CONCUEAR MANUEL REGILDER', 'mabantoco@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=abanto', 12, 12, 'DOCENTE', 5),
('DOC-22', 'SALCEDO QUIÑONES MARTIN GUSTAVO', 'msalcedo@unitru.edu.pe', 'Contratado', 'https://api.dicebear.com/7.x/avataaars/svg?seed=salcedo', 12, 12, 'DOCENTE', 6);

-- ============================================================================
-- PASO 5: INSERCIÓN DE CURSOS (MALLA CURRICULAR EPI 2017 - 60 CURSOS)
-- ============================================================================

INSERT INTO courses (code, name, cycle, cycle_number, course_tipo, credits, hours_per_week, hours_theory, hours_practice, hours_lab, has_lab, schedulable) VALUES
-- Ciclo I (7)
('13024', 'Desarrollo personal', 'I', 1, 'EG', 3, 4, 2, 2, 0, 0, 1),
('13029', 'Lectura crítica y redacción de textos acad.', 'I', 1, 'EG', 3, 4, 2, 2, 0, 0, 1),
('13027', 'Física general', 'I', 1, 'EG', 4, 6, 2, 4, 0, 0, 1),
('13021', 'Algoritmos y programación', 'I', 1, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13023', 'Desarrollo del pensamiento lógico matemático', 'I', 1, 'EG', 3, 5, 1, 4, 0, 0, 1),
('13028', 'Introducción al análisis matemático', 'I', 1, 'EG', 4, 6, 2, 4, 0, 0, 1),
('13031', 'Taller de liderazgo y trabajo en equipo', 'I', 1, 'EG', 1, 2, 0, 2, 0, 0, 1),

-- Ciclo II (7)
('13040', 'Ética, convivencia humana y ciudadanía', 'II', 2, 'EG', 3, 4, 2, 2, 0, 0, 1),
('13043', 'Sociedad, cultura y ecología', 'II', 2, 'EG', 3, 5, 1, 4, 0, 0, 1),
('13036', 'Cultura investigativa y pensamiento crítico', 'II', 2, 'EG', 3, 4, 2, 2, 0, 0, 1),
('13039', 'Estructura de datos', 'II', 2, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13038', 'Estadística general', 'II', 2, 'EG', 4, 6, 2, 4, 0, 0, 1),
('13034', 'Análisis matemático', 'II', 2, 'EG', 4, 6, 2, 4, 0, 0, 1),
('13046', 'Taller de manejo de TIC', 'II', 2, 'EG', 1, 2, 0, 2, 0, 0, 1),

-- Ciclo III (6)
('13629', 'Geometría analítica', 'III', 3, 'EE', 4, 6, 2, 4, 0, 0, 1),
('13630', 'Paradigmas de lenguajes de programación', 'III', 3, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13631', 'Estrategias algorítmicas', 'III', 3, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13632', 'Matemática discreta', 'III', 3, 'EE', 4, 6, 2, 4, 0, 0, 1),
('13633', 'Física para ciencia de la computación', 'III', 3, 'EE', 3, 4, 2, 0, 2, 1, 1),
('13634', 'Análisis numérico', 'III', 3, 'EE', 3, 4, 2, 0, 2, 1, 1),

-- Ciclo IV (6)
('13635', 'Computación gráfica', 'IV', 4, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13636', 'Organización de archivos', 'IV', 4, 'ES', 3, 4, 2, 0, 2, 1, 1),
('13637', 'Algoritmos y complejidad', 'IV', 4, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13638', 'Lenguajes formales y autómatas', 'IV', 4, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13639', 'Electrónica para computación', 'IV', 4, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13640', 'Innovación y emprendimiento', 'IV', 4, 'ES', 3, 4, 2, 2, 0, 0, 1),

-- Ciclo V (6)
('13641', 'Base de datos I', 'V', 5, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13642', 'Ingeniería de software I', 'V', 5, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13643', 'Inteligencia artificial I', 'V', 5, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13644', 'Compiladores', 'V', 5, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13645', 'Técnicas digitales para computación', 'V', 5, 'ES', 4, 6, 2, 2, 2, 1, 1),
('13646', 'Metodología de la investigación científica', 'V', 5, 'ES', 2, 2, 2, 0, 0, 0, 1),

-- Ciclo VI (6)
('14068', 'Computación gráfica avanzada', 'VI', 6, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14069', 'Base de datos II', 'VI', 6, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14070', 'Ingeniería de software II', 'VI', 6, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14071', 'Inteligencia artificial II', 'VI', 6, 'ES', 2, 4, 0, 2, 2, 1, 1),
('14072', 'Comunicación de datos', 'VI', 6, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14073', 'Arquitectura y org. de computadoras', 'VI', 6, 'ES', 4, 6, 2, 2, 2, 1, 1),

-- Ciclo VII (6)
('14074', 'Base de datos avanzada', 'VII', 7, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14075', 'Desarrollo de software', 'VII', 7, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14076', 'Percepción y visión por computadora', 'VII', 7, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14077', 'Redes de computadoras I', 'VII', 7, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14078', 'Sistemas operativos I', 'VII', 7, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14079', 'Gestión de proyectos informáticos', 'VII', 7, 'ES', 2, 4, 0, 2, 2, 1, 1),

-- Ciclo VIII (4)
('14080', 'Robótica', 'VIII', 8, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14081', 'Redes de computadoras II', 'VIII', 8, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14082', 'Sistemas operativos II', 'VIII', 8, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14083', 'Prácticas pre-profesionales', 'VIII', 8, 'ES', 10, 19, 1, 9, 9, 0, 0),

-- Ciclo IX (6)
('14084', 'Interacción humano-computador', 'IX', 9, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14085', 'Tópicos en base de datos', 'IX', 9, 'ES', 4, 6, 2, 2, 2, 1, 1),
('INF34', 'Tópicos en ingeniería de software', 'IX', 9, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14087', 'Ingeniería de software avanzada', 'IX', 9, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14088', 'Seguridad informática', 'IX', 9, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14089', 'Proyecto de tesis', 'IX', 9, 'ES', 2, 3, 1, 2, 0, 0, 1),

-- Ciclo X (6)
('14090', 'Tópicos en tecnologías inmersivas', 'X', 10, 'ES', 4, 6, 2, 2, 2, 1, 1),
('14091', 'Sistemas de información', 'X', 10, 'ES', 3, 4, 2, 0, 2, 1, 1),
('14092', 'Ética para profesionales en informática', 'X', 10, 'ES', 3, 4, 2, 2, 0, 0, 1),
('14093', 'Proyecto de competencia', 'X', 10, 'ES', 2, 4, 0, 2, 2, 1, 1),
('14094', 'Proyecto integrador', 'X', 10, 'ES', 4, 6, 2, 4, 0, 0, 1),
('INF43', 'Tesis', 'X', 10, 'ES', 1, 2, 0, 2, 0, 0, 1);

-- ============================================================================
-- PASO 6: INSERCIÓN DE USUARIOS (ADMIN, DIRECTOR Y DOCENTES)
-- ============================================================================

INSERT INTO users (username, password, role, teacher_id, is_active) VALUES
('admin',       'admin123',    'ADMIN',    NULL, TRUE),
('director',    'director123', 'DIRECTOR', 1,    TRUE),
('jgutierrez',  'DOC-01',      'DOCENTE',  2,    TRUE),
('jrodriguez',  'DOC-02',      'DOCENTE',  3,    TRUE),
('csanchez',    'DOC-23',      'DOCENTE',  4,    TRUE),
('fvargas',     'DOC-24',      'DOCENTE',  5,    TRUE),
('ccastillod',  'DOC-03',      'DOCENTE',  6,    TRUE),
('ysifuentes',  'DOC-04',      'DOCENTE',  7,    TRUE),
('jcruz',       'DOC-05',      'DOCENTE',  8,    TRUE),
('emendoza',    'DOC-06',      'DOCENTE',  9,    TRUE),
('jsalazarc',   'DOC-07',      'DOCENTE',  10,   TRUE),
('agomez',      'DOC-10',      'DOCENTE',  11,   TRUE),
('icruz',       'DOC-08',      'DOCENTE',  12,   TRUE),
('jperalta',    'DOC-09',      'DOCENTE',  13,   TRUE),
('rguevara',    'DOC-11',      'DOCENTE',  14,   TRUE),
('lpedro',      'DOC-12',      'DOCENTE',  15,   TRUE),
('vpolo',       'DOC-13',      'DOCENTE',  16,   TRUE),
('cmquispe',    'DOC-14',      'DOCENTE',  17,   TRUE),
('ppereyra',    'DOC-15',      'DOCENTE',  18,   TRUE),
('fpacheco',    'DOC-16',      'DOCENTE',  19,   TRUE),
('jbravo',      'DOC-17',      'DOCENTE',  20,   TRUE),
('lramirezc',   'DOC-18',      'DOCENTE',  21,   TRUE),
('jalvarador',  'DOC-19',      'DOCENTE',  22,   TRUE),
('yurquizo',    'DOC-20',      'DOCENTE',  23,   TRUE),
('mabantoco',   'DOC-21',      'DOCENTE',  24,   TRUE),
('msalcedo',    'DOC-22',      'DOCENTE',  25,   TRUE);

SELECT 'SCHEMA EPI-UNT 2026-2 INSTALADO CORRECTAMENTE' AS status;
