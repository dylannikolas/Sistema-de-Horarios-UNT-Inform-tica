-- ============================================================================
-- SCHEMA UTF-8 LIMPIO: SISTEMA DE HORARIOS EPI-UNT (SHARPEI + EPI SCHEDULER)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS sistema_horarios
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sistema_horarios;

CREATE TABLE IF NOT EXISTS semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    category ENUM('Principal', 'Asociado', 'Auxiliar', 'Contratado') NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    max_hours INT DEFAULT 20,
    role ENUM('DIRECTOR', 'DOCENTE') DEFAULT 'DOCENTE',
    orden INT NOT NULL DEFAULT 999,
    required_hours INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    cycle VARCHAR(10) NOT NULL,
    credits INT NOT NULL,
    hours_per_week INT NOT NULL,
    hours_theory INT NOT NULL DEFAULT 0,
    hours_practice INT NOT NULL DEFAULT 0,
    hours_lab INT NOT NULL DEFAULT 0,
    has_lab TINYINT(1) NOT NULL DEFAULT 0,
    cycle_number INT NULL,
    course_tipo VARCHAR(2) NOT NULL DEFAULT 'ES',
    schedulable TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type ENUM('Teoría', 'Laboratorio') NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teacher_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day VARCHAR(15) NOT NULL,
    hour VARCHAR(10) NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
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
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
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
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
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
