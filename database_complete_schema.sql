-- ============================================================================
-- SCHEMA COMPLETO: SISTEMA DE GESTIÓN DE HORARIOS ACADÉMICOS
-- ============================================================================
-- Base de datos: sistema_horarios
-- Versión: 2.0
-- Fecha: 2026-01-13
-- Descripción: Sistema completo para gestión de horarios, docentes, cursos y aulas
-- ============================================================================

-- ============================================================================
-- PASO 1: CREACIÓN DE LA BASE DE DATOS
-- ============================================================================

-- Eliminar la base de datos si existe (CUIDADO: Esto borrará todos los datos)
-- Comentar la siguiente línea si deseas preservar datos existentes
DROP DATABASE IF EXISTS sistema_horarios;

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS sistema_horarios
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE sistema_horarios;

-- ============================================================================
-- PASO 2: CREACIÓN DE TABLAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: semesters (Semestres Académicos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT 'Nombre del semestre (ej: 2024-I)',
    start_date DATE NOT NULL COMMENT 'Fecha de inicio del semestre',
    end_date DATE NOT NULL COMMENT 'Fecha de fin del semestre',
    is_active BOOLEAN DEFAULT FALSE COMMENT 'Indica si es el semestre activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Semestres académicos del sistema';

-- ----------------------------------------------------------------------------
-- Tabla: teachers (Docentes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'Nombre completo del docente',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT 'Correo electrónico institucional',
    category ENUM('Principal', 'Asociado', 'Auxiliar', 'Contratado') NOT NULL COMMENT 'Categoría docente',
    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único del docente',
    avatar VARCHAR(255) DEFAULT NULL COMMENT 'URL de la foto del docente',
    max_hours INT DEFAULT 20 COMMENT 'Máximo de horas semanales permitidas',
    role ENUM('DIRECTOR', 'DOCENTE') DEFAULT 'DOCENTE' COMMENT 'Rol en el sistema',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_code (code),
    INDEX idx_category (category),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Información de docentes';

-- ----------------------------------------------------------------------------
-- Tabla: courses (Cursos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código del curso (ej: INF-101)',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre del curso',
    cycle VARCHAR(10) NOT NULL COMMENT 'Ciclo académico (I, II, III, etc.)',
    credits INT NOT NULL COMMENT 'Número de créditos',
    hours_per_week INT NOT NULL COMMENT 'Horas semanales del curso',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_cycle (cycle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cursos académicos';

-- ----------------------------------------------------------------------------
-- Tabla: classrooms (Aulas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT 'Nombre del aula',
    type ENUM('Teoría', 'Laboratorio') NOT NULL COMMENT 'Tipo de aula',
    capacity INT NOT NULL COMMENT 'Capacidad de estudiantes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_capacity (capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Aulas y laboratorios';

-- ----------------------------------------------------------------------------
-- Tabla: teacher_availability (Disponibilidad de Docentes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teacher_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL COMMENT 'ID del docente',
    day VARCHAR(15) NOT NULL COMMENT 'Día de la semana (Lunes, Martes, etc.)',
    hour VARCHAR(10) NOT NULL COMMENT 'Hora (formato 24h: 08:00, 09:00, etc.)',
    is_optional BOOLEAN DEFAULT FALSE COMMENT 'Indica si es disponibilidad opcional',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id),
    INDEX idx_day (day),
    INDEX idx_hour (hour),
    UNIQUE KEY unique_availability (teacher_id, day, hour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Disponibilidad horaria de docentes';

-- ----------------------------------------------------------------------------
-- Tabla: users (Usuarios del Sistema)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nombre de usuario para login',
    password VARCHAR(255) NOT NULL COMMENT 'Contraseña (debe estar encriptada en producción)',
    role ENUM('ADMIN', 'DIRECTOR', 'DOCENTE') NOT NULL DEFAULT 'DOCENTE' COMMENT 'Rol del usuario',
    teacher_id INT NULL COMMENT 'ID del docente asociado (si aplica)',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Indica si el usuario está activo',
    last_login TIMESTAMP NULL COMMENT 'Última fecha de inicio de sesión',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_teacher (teacher_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuarios del sistema con credenciales de acceso';

-- ----------------------------------------------------------------------------
-- Tabla: assignments (Asignaciones de Horarios)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL COMMENT 'ID del semestre',
    course_id INT NOT NULL COMMENT 'ID del curso',
    teacher_id INT NOT NULL COMMENT 'ID del docente',
    classroom_id INT NOT NULL COMMENT 'ID del aula',
    day_of_week ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado') NOT NULL COMMENT 'Día de la semana',
    start_time TIME NOT NULL COMMENT 'Hora de inicio',
    end_time TIME NOT NULL COMMENT 'Hora de fin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    INDEX idx_semester (semester_id),
    INDEX idx_course (course_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_classroom (classroom_id),
    INDEX idx_day (day_of_week),
    INDEX idx_time (start_time, end_time),
    UNIQUE KEY unique_assignment (semester_id, course_id, teacher_id, classroom_id, day_of_week, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Asignaciones de horarios (relación entre semestre, curso, docente, aula y horario)';

-- ============================================================================
-- PASO 3: INSERCIÓN DE DATOS INICIALES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Datos: Semestres
-- ----------------------------------------------------------------------------
INSERT INTO semesters (name, start_date, end_date, is_active) VALUES
('2024-I', '2024-04-01', '2024-07-31', FALSE),
('2024-II', '2024-08-01', '2024-12-15', FALSE),
('2025-I', '2025-04-01', '2025-07-31', FALSE),
('2026-I', '2026-04-01', '2026-07-31', TRUE);

-- ----------------------------------------------------------------------------
-- Datos: Docentes
-- ----------------------------------------------------------------------------
INSERT INTO teachers (name, email, category, code, avatar, max_hours, role) VALUES
('Dr. Juan Pérez García', 'juan.perez@unitru.edu.pe', 'Principal', 'DOC001', 'https://i.pravatar.cc/200?img=12', 20, 'DIRECTOR'),
('Mg. María Rodríguez López', 'm.rodriguez@unitru.edu.pe', 'Asociado', 'DOC002', 'https://i.pravatar.cc/200?img=5', 18, 'DOCENTE'),
('Dr. Carlos Sánchez Ruiz', 'c.sanchez@unitru.edu.pe', 'Principal', 'DOC003', 'https://i.pravatar.cc/200?img=33', 20, 'DOCENTE'),
('Mg. Ana Torres Vega', 'a.torres@unitru.edu.pe', 'Asociado', 'DOC004', 'https://i.pravatar.cc/200?img=9', 18, 'DOCENTE'),
('Ing. Luis Mendoza Castro', 'l.mendoza@unitru.edu.pe', 'Auxiliar', 'DOC005', 'https://i.pravatar.cc/200?img=15', 16, 'DOCENTE'),
('Dra. Patricia Flores Díaz', 'p.flores@unitru.edu.pe', 'Principal', 'DOC006', 'https://i.pravatar.cc/200?img=20', 20, 'DOCENTE'),
('Mg. Roberto Gutiérrez Ramos', 'r.gutierrez@unitru.edu.pe', 'Contratado', 'DOC007', 'https://i.pravatar.cc/200?img=51', 12, 'DOCENTE'),
('Dr. Fernando Vargas Silva', 'f.vargas@unitru.edu.pe', 'Principal', 'DOC008', 'https://i.pravatar.cc/200?img=68', 20, 'DOCENTE'),
('Mg. Carmen Reyes Morales', 'c.reyes@unitru.edu.pe', 'Asociado', 'DOC009', 'https://i.pravatar.cc/200?img=47', 18, 'DOCENTE'),
('Ing. Diego Paredes Luna', 'd.paredes@unitru.edu.pe', 'Auxiliar', 'DOC010', 'https://i.pravatar.cc/200?img=59', 16, 'DOCENTE');

-- ----------------------------------------------------------------------------
-- Datos: Cursos
-- ----------------------------------------------------------------------------
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
-- Ciclo I
('INF-101', 'Introducción a la Programación', 'I', 4, 6),
('MAT-101', 'Matemática Básica', 'I', 4, 5),
('FIS-101', 'Física I', 'I', 4, 5),
('COM-101', 'Comunicación y Redacción', 'I', 3, 3),

-- Ciclo II
('INF-201', 'Programación Orientada a Objetos', 'II', 4, 6),
('INF-202', 'Estructura de Datos', 'II', 4, 6),
('MAT-201', 'Matemática Discreta', 'II', 4, 5),
('FIS-201', 'Física II', 'II', 4, 5),

-- Ciclo III
('INF-301', 'Algoritmos y Complejidad', 'III', 4, 6),
('INF-302', 'Base de Datos I', 'III', 4, 6),
('INF-303', 'Arquitectura de Computadoras', 'III', 4, 5),
('MAT-301', 'Estadística y Probabilidades', 'III', 4, 5),

-- Ciclo IV
('INF-401', 'Base de Datos II', 'IV', 4, 6),
('INF-402', 'Sistemas Operativos', 'IV', 4, 6),
('INF-403', 'Redes de Computadoras I', 'IV', 4, 5),
('INF-404', 'Análisis y Diseño de Sistemas', 'IV', 4, 5),

-- Ciclo V
('INF-501', 'Ingeniería de Software I', 'V', 4, 6),
('INF-502', 'Desarrollo Web', 'V', 4, 6),
('INF-503', 'Redes de Computadoras II', 'V', 4, 5),
('INF-504', 'Inteligencia Artificial', 'V', 4, 5);

-- ----------------------------------------------------------------------------
-- Datos: Aulas
-- ----------------------------------------------------------------------------
INSERT INTO classrooms (name, type, capacity) VALUES
-- Aulas Teóricas
('Aula Teórica 101', 'Teoría', 40),
('Aula Teórica 102', 'Teoría', 40),
('Aula Teórica 103', 'Teoría', 35),
('Aula Teórica 201', 'Teoría', 45),
('Aula Teórica 202', 'Teoría', 45),
('Aula Teórica 203', 'Teoría', 40),

-- Laboratorios
('Lab. Cómputo 01', 'Laboratorio', 30),
('Lab. Cómputo 02', 'Laboratorio', 30),
('Lab. Cómputo 03', 'Laboratorio', 25),
('Lab. Cómputo 04', 'Laboratorio', 25),
('Lab. Redes', 'Laboratorio', 20),
('Lab. Sistemas', 'Laboratorio', 20);

-- ----------------------------------------------------------------------------
-- Datos: Usuarios del Sistema
-- ----------------------------------------------------------------------------
-- IMPORTANTE: En producción, las contraseñas DEBEN estar encriptadas (bcrypt, etc.)
-- Estas son contraseñas de ejemplo en texto plano SOLO para desarrollo
INSERT INTO users (username, password, role, teacher_id, is_active) VALUES
-- Usuario Administrador
('admin', 'admin123', 'ADMIN', NULL, TRUE),

-- Usuario Director (vinculado al primer docente)
('director', 'director123', 'DIRECTOR', 1, TRUE),

-- Usuarios Docentes (vinculados a sus respectivos perfiles)
('juan.perez', 'docente123', 'DOCENTE', 1, TRUE),
('maria.rodriguez', 'docente123', 'DOCENTE', 2, TRUE),
('carlos.sanchez', 'docente123', 'DOCENTE', 3, TRUE),
('ana.torres', 'docente123', 'DOCENTE', 4, TRUE),
('luis.mendoza', 'docente123', 'DOCENTE', 5, TRUE),
('patricia.flores', 'docente123', 'DOCENTE', 6, TRUE),
('roberto.gutierrez', 'docente123', 'DOCENTE', 7, TRUE),
('fernando.vargas', 'docente123', 'DOCENTE', 8, TRUE),
('carmen.reyes', 'docente123', 'DOCENTE', 9, TRUE),
('diego.paredes', 'docente123', 'DOCENTE', 10, TRUE);

-- ----------------------------------------------------------------------------
-- Datos: Disponibilidad de Docentes (Ejemplo para algunos docentes)
-- ----------------------------------------------------------------------------
-- Disponibilidad del Dr. Juan Pérez (ID: 1)
INSERT INTO teacher_availability (teacher_id, day, hour, is_optional) VALUES
(1, 'Lunes', '08:00', FALSE),
(1, 'Lunes', '10:00', FALSE),
(1, 'Miércoles', '08:00', FALSE),
(1, 'Miércoles', '10:00', FALSE),
(1, 'Viernes', '08:00', TRUE);

-- Disponibilidad de Mg. María Rodríguez (ID: 2)
INSERT INTO teacher_availability (teacher_id, day, hour, is_optional) VALUES
(2, 'Martes', '09:00', FALSE),
(2, 'Martes', '11:00', FALSE),
(2, 'Jueves', '09:00', FALSE),
(2, 'Jueves', '11:00', FALSE),
(2, 'Viernes', '14:00', TRUE);

-- Disponibilidad del Dr. Carlos Sánchez (ID: 3)
INSERT INTO teacher_availability (teacher_id, day, hour, is_optional) VALUES
(3, 'Lunes', '14:00', FALSE),
(3, 'Lunes', '16:00', FALSE),
(3, 'Miércoles', '14:00', FALSE),
(3, 'Miércoles', '16:00', FALSE);

-- ----------------------------------------------------------------------------
-- Datos: Asignaciones de Ejemplo (Horarios)
-- ----------------------------------------------------------------------------
-- Asignaciones para el semestre 2026-I
INSERT INTO assignments (semester_id, course_id, teacher_id, classroom_id, day_of_week, start_time, end_time) VALUES
-- Lunes
(4, 1, 1, 7, 'Lunes', '08:00:00', '10:00:00'),  -- Introducción a la Programación
(4, 2, 2, 1, 'Lunes', '10:00:00', '12:00:00'),  -- Matemática Básica
(4, 5, 3, 8, 'Lunes', '14:00:00', '16:00:00'),  -- POO

-- Martes
(4, 3, 4, 2, 'Martes', '09:00:00', '11:00:00'),  -- Física I
(4, 6, 5, 9, 'Martes', '11:00:00', '13:00:00'),  -- Estructura de Datos

-- Miércoles
(4, 1, 1, 7, 'Miércoles', '08:00:00', '10:00:00'),  -- Introducción a la Programación
(4, 9, 6, 10, 'Miércoles', '14:00:00', '16:00:00'), -- Algoritmos y Complejidad

-- Jueves
(4, 10, 7, 3, 'Jueves', '09:00:00', '11:00:00'),  -- Base de Datos I
(4, 13, 8, 11, 'Jueves', '14:00:00', '16:00:00'), -- Base de Datos II

-- Viernes
(4, 17, 9, 4, 'Viernes', '08:00:00', '10:00:00'),  -- Ingeniería de Software I
(4, 18, 10, 12, 'Viernes', '10:00:00', '12:00:00'); -- Desarrollo Web

-- ============================================================================
-- PASO 4: CREACIÓN DE VISTAS ÚTILES
-- ============================================================================

-- Vista: Horarios completos con información detallada
CREATE OR REPLACE VIEW view_schedule_details AS
SELECT 
    a.id AS assignment_id,
    s.name AS semester,
    c.code AS course_code,
    c.name AS course_name,
    t.name AS teacher_name,
    t.category AS teacher_category,
    cl.name AS classroom_name,
    cl.type AS classroom_type,
    a.day_of_week,
    a.start_time,
    a.end_time,
    CONCAT(a.start_time, ' - ', a.end_time) AS time_slot
FROM assignments a
INNER JOIN semesters s ON a.semester_id = s.id
INNER JOIN courses c ON a.course_id = c.id
INNER JOIN teachers t ON a.teacher_id = t.id
INNER JOIN classrooms cl ON a.classroom_id = cl.id
ORDER BY a.day_of_week, a.start_time;

-- Vista: Carga horaria por docente
CREATE OR REPLACE VIEW view_teacher_workload AS
SELECT 
    t.id AS teacher_id,
    t.name AS teacher_name,
    t.category,
    t.max_hours,
    COUNT(a.id) AS total_assignments,
    SUM(TIMESTAMPDIFF(HOUR, a.start_time, a.end_time)) AS total_hours,
    t.max_hours - SUM(TIMESTAMPDIFF(HOUR, a.start_time, a.end_time)) AS remaining_hours
FROM teachers t
LEFT JOIN assignments a ON t.id = a.teacher_id
LEFT JOIN semesters s ON a.semester_id = s.id AND s.is_active = TRUE
GROUP BY t.id, t.name, t.category, t.max_hours
ORDER BY total_hours DESC;

-- Vista: Ocupación de aulas
CREATE OR REPLACE VIEW view_classroom_usage AS
SELECT 
    cl.id AS classroom_id,
    cl.name AS classroom_name,
    cl.type,
    cl.capacity,
    COUNT(a.id) AS total_assignments,
    ROUND((COUNT(a.id) / (5 * 8)) * 100, 2) AS usage_percentage
FROM classrooms cl
LEFT JOIN assignments a ON cl.id = a.classroom_id
LEFT JOIN semesters s ON a.semester_id = s.id AND s.is_active = TRUE
GROUP BY cl.id, cl.name, cl.type, cl.capacity
ORDER BY usage_percentage DESC;

-- ============================================================================
-- PASO 5: PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ============================================================================

-- Procedimiento: Obtener horario de un docente
DELIMITER //
CREATE PROCEDURE sp_get_teacher_schedule(IN p_teacher_id INT, IN p_semester_id INT)
BEGIN
    SELECT 
        c.code AS course_code,
        c.name AS course_name,
        cl.name AS classroom,
        a.day_of_week,
        a.start_time,
        a.end_time
    FROM assignments a
    INNER JOIN courses c ON a.course_id = c.id
    INNER JOIN classrooms cl ON a.classroom_id = cl.id
    WHERE a.teacher_id = p_teacher_id 
      AND a.semester_id = p_semester_id
    ORDER BY 
        FIELD(a.day_of_week, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'),
        a.start_time;
END //
DELIMITER ;

-- Procedimiento: Verificar disponibilidad de aula
DELIMITER //
CREATE PROCEDURE sp_check_classroom_availability(
    IN p_classroom_id INT,
    IN p_semester_id INT,
    IN p_day VARCHAR(15),
    IN p_start_time TIME,
    IN p_end_time TIME
)
BEGIN
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 'OCUPADA'
            ELSE 'DISPONIBLE'
        END AS status,
        COUNT(*) AS conflicts
    FROM assignments
    WHERE classroom_id = p_classroom_id
      AND semester_id = p_semester_id
      AND day_of_week = p_day
      AND (
          (start_time < p_end_time AND end_time > p_start_time)
      );
END //
DELIMITER ;

-- ============================================================================
-- PASO 6: TRIGGERS PARA AUDITORÍA Y VALIDACIÓN
-- ============================================================================

-- Trigger: Actualizar last_login al iniciar sesión (debe ser llamado desde la app)
-- Este es un ejemplo, la actualización real se hace desde el backend

-- Trigger: Validar que no se exceda la carga horaria del docente
DELIMITER //
CREATE TRIGGER trg_validate_teacher_hours
BEFORE INSERT ON assignments
FOR EACH ROW
BEGIN
    DECLARE current_hours INT;
    DECLARE max_hours INT;
    
    SELECT 
        COALESCE(SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)), 0),
        t.max_hours
    INTO current_hours, max_hours
    FROM assignments a
    INNER JOIN teachers t ON a.teacher_id = t.id
    WHERE a.teacher_id = NEW.teacher_id
      AND a.semester_id = NEW.semester_id
    GROUP BY t.max_hours;
    
    IF current_hours + TIMESTAMPDIFF(HOUR, NEW.start_time, NEW.end_time) > max_hours THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El docente excedería su carga horaria máxima';
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- PASO 7: ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================================================

-- Los índices ya están creados en las definiciones de tablas
-- Aquí se pueden agregar índices compuestos adicionales si es necesario

-- ============================================================================
-- PASO 8: INFORMACIÓN DEL SCHEMA
-- ============================================================================

SELECT 
    'SCHEMA INSTALADO CORRECTAMENTE' AS status,
    DATABASE() AS database_name,
    NOW() AS installation_time;

-- Mostrar resumen de tablas creadas
SELECT 
    TABLE_NAME AS tabla,
    TABLE_ROWS AS filas_aproximadas,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS tamano_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'sistema_horarios'
ORDER BY TABLE_NAME;

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
-- Para ejecutar este archivo:
-- mysql -u root -p < database_complete_schema.sql
-- 
-- O desde MySQL:
-- SOURCE /ruta/completa/database_complete_schema.sql;
-- ============================================================================
