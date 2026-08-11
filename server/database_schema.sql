-- Creación de la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS sistema_horarios;
USE sistema_horarios;

-- 1. Tabla de Semestres
CREATE TABLE IF NOT EXISTS semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE
);

-- 2. Tabla de Docentes (Teachers)
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    category ENUM('Principal', 'Asociado', 'Auxiliar', 'Contratado') NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    avatar VARCHAR(255),
    max_hours INT DEFAULT 20,
    role ENUM('DIRECTOR', 'DOCENTE') DEFAULT 'DOCENTE'
);

-- 3. Tabla de Cursos (Courses)
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    cycle VARCHAR(10) NOT NULL,
    credits INT NOT NULL,
    hours_per_week INT NOT NULL
);

-- 4. Tabla de Aulas (Classrooms)
CREATE TABLE IF NOT EXISTS classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type ENUM('Teoría', 'Laboratorio') NOT NULL,
    capacity INT NOT NULL
);

-- 5. Tabla de Disponibilidad Docente (Teacher Availability)
CREATE TABLE IF NOT EXISTS teacher_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day VARCHAR(15) NOT NULL, -- Lunes, Martes, etc.
    hour VARCHAR(10) NOT NULL, -- "08:00", "09:00"
    is_optional BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- 6. Tabla de Usuarios (Para Login y Contraseñas)
-- Esta tabla manejará el acceso al sistema.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Aquí se guardará la contraseña (idealmente encriptada)
    role ENUM('ADMIN', 'DIRECTOR', 'DOCENTE') NOT NULL DEFAULT 'DOCENTE',
    teacher_id INT NULL, -- Opcional: Para vincular un usuario con un perfil de docente
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- INSERCIÓN DE DATOS INICIALES

-- Semestres
INSERT INTO semesters (name, start_date, end_date, is_active) VALUES
('2024-I', '2024-04-01', '2024-07-31', TRUE),
('2023-II', '2023-10-01', '2024-02-15', FALSE);

-- Docentes
INSERT INTO teachers (name, email, category, code, avatar, max_hours, role) VALUES
('Dr. Juan Pérez', 'juan.perez@unitru.edu.pe', 'Principal', '123456', 'https://picsum.photos/seed/juan/200', 20, 'DOCENTE'),
('Mg. María Rodríguez', 'm.rodriguez@unitru.edu.pe', 'Asociado', '654321', 'https://picsum.photos/seed/maria/200', 18, 'DOCENTE'),
('Dr. Carlos Sánchez', 'c.sanchez@unitru.edu.pe', 'Principal', '789012', 'https://picsum.photos/seed/carlos/200', 20, 'DOCENTE');

-- Cursos
INSERT INTO courses (code, name, cycle, credits, hours_per_week) VALUES
('INF-101', 'Introducción a la Programación', 'I', 4, 6),
('INF-203', 'Arquitectura de Computadoras', 'II', 4, 5),
('INF-301', 'Estructuras de Datos', 'III', 4, 6),
('INF-502', 'Ingeniería de Software I', 'V', 4, 5);

-- Aulas
INSERT INTO classrooms (name, type, capacity) VALUES
('Aula Teórica 101', 'Teoría', 40),
('Lab. Cómputo 04', 'Laboratorio', 25),
('Lab. Cómputo 02', 'Laboratorio', 30);

-- Usuarios de Prueba (Contraseña texto plano para prueba inicial, luego encriptaremos)
-- Nota: En producción, NUNCA guardar contraseñas en texto plano.
INSERT INTO users (username, password, role, teacher_id) VALUES
('admin', 'admin123', 'ADMIN', NULL),
('juan.perez', '123456', 'DOCENTE', 1);

-- 7. Tabla de Asignaciones (Assignments) - VINCULACI�N CENTRAL
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    classroom_id INT NOT NULL,
    day_of_week ENUM('Lunes', 'Martes', 'Mi�rcoles', 'Jueves', 'Viernes', 'S�bado') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (semester_id, course_id, teacher_id, classroom_id, day_of_week, start_time)
);
