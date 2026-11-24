# Documentación Técnica y Manual de Funcionamiento y Carga del Software
## Sistema de Gestión y Optimización de Horarios Académicos EPI-UNT (SHARPEI + EPI Scheduler CP-SAT)

**Universidad Nacional de Trujillo (UNT)**  
**Facultad de Ciencias Físicas y Matemáticas — Escuela Profesional de Informática (EPI)**  
**Curso:** Ingeniería de Software II · **Semestre:** 2026-2

---

## Índice

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Arquitectura de Software (3 Capas + Base de Datos)](#2-arquitectura-de-software-3-capas--base-de-datos)
3. [Procedimiento de Carga, Instalación y Puesta en Marcha del Software](#3-procedimiento-de-carga-instalación-y-puesta-en-marcha-del-software)
   - [3.1 Requisitos Previos](#31-requisitos-previos)
   - [3.2 Configuración de Variables de Entorno (`server/.env`)](#32-configuración-de-variables-de-entorno-serverenv)
   - [3.3 Carga e Inicialización de la Base de Datos (Esquema y Semillas)](#33-carga-e-inicialización-de-la-base-de-datos-esquema-y-semillas)
   - [3.4 Procedimiento de Arranque del Software (Automático y Manual)](#34-procedimiento-de-arranque-del-software-automático-y-manual)
4. [Procedimiento de Carga de Datos Académicos en el Sistema](#4-procedimiento-de-carga-de-datos-académicos-en-el-sistema)
   - [4.1 Carga de Maestros (Semestres, Docentes, Cursos Malla 2017 y Aulas EPI)](#41-carga-de-maestros-semestres-docentes-cursos-malla-2017-y-aulas-epi)
   - [4.2 Modalidad A: Carga por Adjudicación Interactiva por Turnos y Prelación](#42-modalidad-a-carga-por-adjudicación-interactiva-por-turnos-y-prelación)
   - [4.3 Modalidad B: Carga Directa de la Carga Horaria Oficial 2026-2 (CSV/MD/Excel)](#43-modalidad-b-carga-directa-de-la-carga-horaria-oficial-2026-2-csvmdexcel)
5. [Funcionamiento Interno del Motor de Horarios (CP-SAT + Asignación de Aulas)](#5-funcionamiento-interno-del-motor-de-horarios-cp-sat--asignación-de-aulas)
   - [5.1 Bloques Horarios y Ambientes Físicos Reales de la EPI](#51-bloques-horarios-y-ambientes-físicos-reales-de-la-epi)
   - [5.2 Modelo Matemático CP-SAT (Restricciones C1 a C6)](#52-modelo-matemático-cp-sat-restricciones-c1-a-c6)
   - [5.3 Algoritmo de Asignación de Aulas (`placeRooms`)](#53-algoritmo-de-asignación-de-aulas-placerooms)
6. [Visualización de Horarios y Exportación a Excel](#6-visualización-de-horarios-y-exportación-a-excel)
7. [Seguridad, Control de Roles (JWT) y Referencia de Endpoints API](#7-seguridad-control-de-roles-jwt-y-referencia-de-endpoints-api)
8. [Estructura de Archivos del Proyecto](#8-estructura-de-archivos-del-proyecto)

---

## 1. Visión General del Sistema

El **Sistema de Horarios EPI-UNT** es una plataforma web integral que fusiona:
- **SHARPEI (Gestión Académica Web):** Interfaz gráfica en React, autenticación por roles (`DIRECTOR`, `ADMIN`, `DOCENTE`), administración de semestres, plana docente, malla curricular, ambientes físicos, disponibilidad horaria por docente y visualización de horarios por docente y por aula.
- **EPI Scheduler (Adjudicación Reglamentaria + Motor CP-SAT):** Flujo de adjudicación de carga académica por orden estricto de categoría docente y prelación, conectado a un microservicio en Python con **Google OR-Tools CP-SAT** que resuelve matemáticamente la programación semanal sin cruces de docente, sección estudiantil ni aula, y exporta el reporte oficial en formato Excel (`.xlsx`).

---

## 2. Arquitectura de Software (3 Capas + Base de Datos)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CAPA 1: FRONTEND WEB (Puerto 3000)                        │
│                   React 19 + TypeScript + Vite + Tailwind                   │
│  • Panel Director: /admin/semestres, /admin/docentes, /admin/cursos,        │
│    /admin/aulas, /admin/adjudicacion                                        │
│  • Panel Docente: /docente/inicio, /docente/disponibilidad,                 │
│    /docente/adjudicacion                                                    │
│  • Vistas de Horarios: /horarios/docente, /horarios/aula                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Peticiones HTTP REST (/api/*)
                                       │ Header: Authorization: Bearer <JWT>
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CAPA 2: BACKEND API (Puerto 3001)                         │
│                   Node.js + Express 5 + TypeScript                          │
│  • /api/auth          → Login JWT, registro y validación de sesión          │
│  • /api/teachers      → CRUD docentes + orden de prelación (/ordered)       │
│  • /api/courses       → CRUD cursos (Malla Curricular EPI 2017 - 60 cursos) │
│  • /api/classrooms    → CRUD aulas (8 ambientes reales EPI)                 │
│  • /api/semesters     → Gestión y activación de semestres                   │
│  • /api/assignments   → Consulta de bloques horarios programados            │
│  • /api/adjudicacion  → Turnos, carga 2026-2, puente con Solver y Aulas     │
└──────────────────┬───────────────────────────────────────┬──────────────────┘
                   │ Pool MySQL2 (TCP 3306)                │ HTTP JSON (Puerto 5000)
                   ▼                                       ▼
┌─────────────────────────────────────┐ ┌─────────────────────────────────────┐
│   BASE DE DATOS: MySQL 8 / MariaDB  │ │  CAPA 3: MICROSERVICIO SOLVER       │
│   Esquema: `sistema_horarios`       │ │  Python 3 + FastAPI + OR-Tools      │
│  • semesters, teachers, users       │ │  • POST /solve (Modelo CP-SAT       │
│  • courses, classrooms              │ │    con restricciones C1..C6)        │
│  • teacher_availability             │ │  • POST /export-excel (Generador    │
│  • adjudicacion_process / _turns    │ │    openpyxl multi-hoja por ciclo)   │
│  • adjudicacion_sessions            │ │  • GET  /health                     │
│  • solver_results, assignments      │ │                                     │
└─────────────────────────────────────┘ └─────────────────────────────────────┘
```

---

## 3. Procedimiento de Carga, Instalación y Puesta en Marcha del Software

Esta sección describe paso a paso cómo instalar, configurar y levantar el software desde cero en cualquier computadora con Windows (o Linux/macOS en modo manual).

### 3.1 Requisitos Previos

1. **Node.js (v18 o superior):** Incluye `npm` y soporte nativo para `fetch`.
2. **Python (v3.10 o superior):** Con `pip` habilitado en el `PATH`.
3. **MySQL Server 8.0 (o MariaDB / XAMPP):** Corriendo en el puerto `3306`.

---

### 3.2 Configuración de Variables de Entorno (`server/.env`)

El backend Node.js lee su configuración de conexión desde el archivo `server/.env`.  
Si es la primera vez que se descarga el proyecto, se puede crear manualmente (o dejar que `start_project.bat` lo solicite por consola):

**Archivo:** `server/.env`
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA_DE_MYSQL
DB_NAME=sistema_horarios
PORT=3001
JWT_SECRET=secret-key-change-me
SOLVER_URL=http://localhost:5000
```

---

### 3.3 Carga e Inicialización de la Base de Datos (Esquema y Semillas)

El software cuenta con un mecanismo de **auto-inicialización y migración idempotente** (`server/migrate_fusion.ts`), lo que significa que puede ejecutarse múltiples veces sin duplicar registros ni borrar datos personalizados del usuario.

#### Método 1: Inicialización Automática (Recomendado)
Al iniciar el backend (`npm run dev` en `server/`) o al ejecutar manualmente:
```powershell
cd server
npx ts-node migrate_fusion.ts
```
El script ejecuta automáticamente la siguiente secuencia de carga:
1. **Creación de la Base de Datos:** Conecta al servidor MySQL y ejecuta `CREATE DATABASE IF NOT EXISTS sistema_horarios CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`.
2. **Creación de Tablas Base y de Adjudicación:** Crea las 11 tablas del sistema si no existen (`semesters`, `teachers`, `courses`, `classrooms`, `teacher_availability`, `users`, `assignments`, `adjudicacion_process`, `adjudicacion_turns`, `adjudicacion_sessions`, `solver_results`).
3. **Semilla de Semestres:** Si `semesters` está vacía, inserta `2025-II`, `2026-I` y `2026-II` (activo).
4. **Semilla de Plana Docente EPI:** Si `teachers` está vacía, inserta los 24 docentes base de la EPI más el Director, asignando sus horas reglamentarias por categoría (`Principal: 20h`, `Asociado: 18h`, `Auxiliar: 16h`, `Contratado: 12h`) y su número de `orden` de prelación. *(Si ya existen docentes con horas personalizadas `required_hours > 0`, la migración las respeta sin sobrescribirlas).*
5. **Carga de la Malla Curricular EPI 2017 (`server/malla_epi.json`):** Inserta o actualiza los **60 cursos oficiales** del plan de estudios 2017 (Ciclos I al X) con sus horas de Teoría (`ht`), Práctica (`hp`), Laboratorio (`hl`), indicador `has_lab`, ciclo romano (`I`..`X`), ciclo numérico (`1`..`10`) y si requiere programación en aula (`schedulable = 1`, excluyendo *Prácticas pre-profesionales* `14083` que no ocupa aula).
6. **Carga de las 8 Aulas Reales de la EPI:** Asegura la existencia de los 8 ambientes físicos oficiales de la escuela sin borrar aulas adicionales que el usuario haya creado:
   - **5 Aulas Teóricas (`Teoría`):** `POOL-17`, `POOL-18`, `INFO-2`, `INFO-3`, `INFO-5`.
   - **3 Laboratorios (`Laboratorio`):** `LAB-A`, `LAB-B`, `LAB-C`.
7. **Creación de Cuentas de Usuario (`users`):** Crea automáticamente las credenciales de acceso para:
   - **Director:** `director` / `director123` (rol `DIRECTOR`)
   - **Administrador:** `admin` / `admin123` (rol `ADMIN`)
   - **Cada Docente:** usuario = prefijo de su correo institucional (p. ej. `jgutierrez`), contraseña = su código docente (p. ej. `DOC-01`), vinculado a su `teacher_id`.

#### Método 2: Carga mediante Script SQL Completo (Alternativo para MySQL Workbench / phpMyAdmin)
Si se desea cargar toda la base de datos desde una herramienta gráfica SQL:
- Importar el archivo de la raíz `database_complete_schema.sql` (o `server/database_schema.sql` seguido de `server/insert_classrooms.sql`, `server/insert_courses.sql` y `server/insert_teachers.sql`).

---

### 3.4 Procedimiento de Arranque del Software (Automático y Manual)

#### Opción A: Arranque Automático en Windows (1 clic)
Desde la raíz del proyecto, ejecutar:
```powershell
.\start_project.bat
```
**¿Qué hace internamente `start_project.bat`?**
1. Verifica que `node` esté instalado.
2. Si no existe `server\.env`, solicita en consola la contraseña del usuario `root` de MySQL y genera `server\.env`.
3. Instala automáticamente `node_modules` en la raíz y en `server/` si no existen.
4. Levanta el **Microservicio CP-SAT Solver** en una ventana dedicada (`Puerto 5000`).
5. Libera cualquier proceso antiguo en el puerto `3001` y levanta el **Servidor Backend Node/Express** (`Puerto 3001`), el cual inicializa y verifica la base de datos automáticamente.
6. Levanta el **Servidor Frontend React/Vite** (`Puerto 3000`).
7. Abre el navegador predeterminado en `http://localhost:3000`.

#### Opción B: Arranque Manual en 3 Terminales

1. **Terminal 1 — Microservicio Solver CP-SAT (Puerto 5000):**
   ```powershell
   cd solver_service
   pip install -r requirements.txt
   python -m uvicorn main:app --host 127.0.0.1 --port 5000
   ```
2. **Terminal 2 — Backend Node/Express (Puerto 3001):**
   ```powershell
   cd server
   npm install
   npm run dev
   ```
3. **Terminal 3 — Frontend React/Vite (Puerto 3000):**
   ```powershell
   npm install
   npm run dev
   ```

---

## 4. Procedimiento de Carga de Datos Académicos en el Sistema

Una vez que el software está en ejecución en `http://localhost:3000`, existen **dos procedimientos de trabajo** para cargar la información académica del semestre y generar los horarios:

### 4.1 Carga de Maestros (Semestres, Docentes, Cursos Malla 2017 y Aulas EPI)

Iniciando sesión como **Director** (`director` / `director123`):
1. **Gestión de Semestres (`/admin/semestres`):** Permite crear un nuevo semestre académico (ej. `2026-II`), definir sus fechas de inicio y fin, y marcarlo como **Activo** (`is_active = 1`).
2. **Gestión de Docentes (`/admin/docentes`):** Permite registrar o editar docentes indicando:
   - Nombre completo, Código UNT y Correo institucional.
   - **Categoría:** `Principal` (20 h), `Asociado` (18 h), `Auxiliar` (16 h) o `Contratado` (12 h o contrato personalizado).
   - **Orden de Prelación (`orden`):** Posición del docente dentro de su categoría para el turno de adjudicación (`#1`, `#2`, etc.).
3. **Gestión de Cursos (`/admin/cursos`):** Muestra los 60 cursos de la malla 2017 con sus horas semanales desglosadas en Teoría, Práctica y Laboratorio.
4. **Gestión de Aulas (`/admin/aulas`):** Muestra las 8 aulas reales de la EPI (`POOL-17`, `POOL-18`, `INFO-2`, `INFO-3`, `INFO-5`, `LAB-A`, `LAB-B`, `LAB-C`) y su capacidad.

---

### 4.2 Modalidad A: Carga por Adjudicación Interactiva por Turnos y Prelación

Este flujo digitaliza el proceso reglamentario en el que cada docente elige sus cursos respetando el orden de categoría y prelación:

1. **Paso 1 — Carga de Disponibilidad Horaria por cada Docente (`/docente/disponibilidad`):**
   - Cada docente inicia sesión con su cuenta (p. ej. `jgutierrez` / `DOC-01`) y entra a **"Mi Disponibilidad"**.
   - Selecciona en la grilla de **Lunes a Viernes (`07:00` a `20:00`)** sus bloques disponibles de 2 horas (`07:00-09:00`, `09:00-11:00`, `11:00-13:00`, `13:00-15:00`, `15:00-17:00`, `17:00-19:00`, `19:00-21:00`) y pulsa **"Guardar Disponibilidad"**.
2. **Paso 2 — Apertura del Proceso de Adjudicación por el Director (`/admin/adjudicacion`):**
   - El Director selecciona el período (`Semestre PAR`, `Semestre IMPAR` o `Nivelación`).
   - Configura por cada ciclo si se abren secciones **`A + B`** (ciclo regular), **`Solo A`** (curso por repetición o ciclo de sección única) o **`Cerrado`**.
   - Selecciona los docentes participantes (o usa el botón **"Auto-ajustar docentes a horas del pool"** para cuadrar exactamente las horas disponibles con la suma de horas reglamentarias).
   - Pulsa **"Iniciar Proceso de Adjudicación"** (`POST /api/adjudicacion/iniciar`), lo cual genera la cola ordenada en `adjudicacion_turns` (`Principal → Asociado → Auxiliar → Contratado`, ordenados por `orden`).
3. **Paso 3 — Selección y Confirmación Turno por Turno (`/docente/adjudicacion` o Modo Asistencia):**
   - El docente que tiene el turno activo entra a **"Adjudicación de Carga"** (`/docente/adjudicacion`), marca las sesiones de Teoría (2 h), Práctica (2 h o 4 h) o Laboratorio (4 h) que desea dictar hasta completar **exactamente** sus horas reglamentarias (`difference = 0`) y pulsa **"Confirmar Carga Definitiva"**.
   - El sistema bloquea en tiempo real esas sesiones para los siguientes turnos (`UNIQUE KEY uq_session`) y avanza automáticamente al siguiente docente en la cola.
   - *(El Director también dispone de un interruptor **"Modo asistencia: adjudicar en nombre del docente"** y del botón **"Saltar Turno"** en caso de ausencia).*
4. **Paso 4 — Ejecución del Solver CP-SAT (`/admin/adjudicacion`):**
   - Una vez que `pending_turns = 0`, el Director pulsa **"Ejecutar Solver CP-SAT"**, que envía la carga confirmada y las disponibilidades al microservicio Python y guarda el horario resultante con aulas en `assignments`.

---

### 4.3 Modalidad B: Carga Directa de la Carga Horaria Oficial 2026-2 (CSV/MD/Excel)

Cuando la Dirección de Escuela ya cuenta con la distribución de qué docente dictará cada curso, sección y tipo de sesión en el semestre **2026-2** (como en los archivos `Carga horaria por ciclo y docente 2026-2.md` / `.csv` / `.xlsx`), el sistema permite cargarla de forma directa sin pasar turno por turno:

#### ¿Dónde está definida la Carga Oficial 2026-2?
En el módulo **[server/carga_2026_2.ts](file:///c:/Users/dylan_dnxqp1x/OneDrive/Informatica/ciclo%202026-2/cursos/Ingenieria%20de%20Software%202/Sistema-de-Horarios-UNT-Inform-tica/Sistema-de-Horarios-UNT-Inform-tica/server/carga_2026_2.ts)**, que contiene:
- **`TEACHERS_2026_2` (32 docentes):** Los 18 docentes de la EPI más los 14 docentes contratados y de servicio (Matemáticas, Estadística y Estudios Generales) con sus horas exactas del semestre 2026-2.
- **`SESSIONS_2026_2` (135 sesiones adjudicadas = 346 horas programables en aulas):**
  - **Ciclo II (Secciones A y B):** 72 h
  - **Ciclo I / III — Repetición (Sección A/R):** 20 h en bloques (*Introducción al Análisis Matemático*, *Geometría Analítica*, *Matemática Discreta*, *Análisis Numérico*)
  - **Ciclo IV (Secciones A y B):** 90 h (incluyendo laboratorios divididos `L1` y `L2` entre distintos docentes en *Lenguajes Formales IV-A*, *Electrónica IV-A* y *Algoritmos IV-B*)
  - **Ciclo VI (Secciones A y B):** 92 h (incluyendo `L1` y `L2` en *Inteligencia Artificial II*)
  - **Ciclo VIII (Sección A):** 20 h en aulas (*Robótica*, *Redes de Computadoras II*, *Sistemas Operativos II*) + 19 h de *Prácticas Preprofesionales*
  - **Ciclo X (Sección A + 5 grupos de Tesis):** 52 h (*Tópicos en Tecnologías Inmersivas*, *Sistemas de Información*, *Ética Profesional*, *Proyecto de Competencia*, *Proyecto Integrador / Trabajo de Investigación* y los 5 grupos de *Tesis*)

#### ¿Cómo se ejecuta esta carga en el software?
1. En el panel del Director (`/admin/adjudicacion`), hacer clic en el botón superior **"Cargar Carga Oficial 2026-2 (CSV/MD)"** (`POST /api/adjudicacion/cargar-2026-2`).
2. El sistema ejecuta [`loadCarga2026_2()`](file:///c:/Users/dylan_dnxqp1x/OneDrive/Informatica/ciclo%202026-2/cursos/Ingenieria%20de%20Software%202/Sistema-de-Horarios-UNT-Inform-tica/Sistema-de-Horarios-UNT-Inform-tica/server/carga_2026_2.ts#L244-L374) dentro de una transacción MySQL:
   - Registra/actualiza los 32 docentes en `teachers`, crea sus usuarios en `users` y asegura su disponibilidad en `teacher_availability`.
   - Crea el proceso de adjudicación del semestre `2026-II` en estado `COMPLETADO` (`custom_pool: true`).
   - Inserta los 31 turnos programables como `CONFIRMADO` en `adjudicacion_turns` y las **135 sesiones confirmadas (346 h)** en `adjudicacion_sessions`.
3. A continuación, hacer clic en **"Ejecutar Solver CP-SAT"** (`POST /api/adjudicacion/:id/generar`). El solver programa los **150 bloques de 2 horas** en ~2 segundos y les asigna las 8 aulas reales EPI sin ningún cruce.

---

## 5. Funcionamiento Interno del Motor de Horarios (CP-SAT + Asignación de Aulas)

### 5.1 Bloques Horarios y Ambientes Físicos Reales de la EPI

- **Días hábiles:** Lunes a Viernes (`NUM_DAYS = 5`).
- **Franjas diarias (`NUM_SLOTS = 7` bloques de 2 horas):**
  - Bloque 0: `07:00 - 09:00` (requiere horas `07:00` y `08:00` en SHARPEI)
  - Bloque 1: `09:00 - 11:00` (requiere horas `09:00` y `10:00`)
  - Bloque 2: `11:00 - 13:00` (requiere horas `11:00` y `12:00`)
  - Bloque 3: `13:00 - 15:00` (requiere horas `13:00` y `14:00`)
  - Bloque 4: `15:00 - 17:00` (requiere horas `15:00` y `16:00`)
  - Bloque 5: `17:00 - 19:00` (requiere horas `17:00` y `18:00`)
  - Bloque 6: `19:00 - 21:00` (requiere horas `19:00` y `20:00`)
- **Regla oficial de ambientes EPI:**
  - **Aulas Teóricas (`max_theory_rooms = 5`):** `POOL-17`, `POOL-18`, `INFO-2`, `INFO-3`, `INFO-5`. Alojan exclusivamente sesiones de **Teoría** y **Práctica**.
  - **Laboratorios (`max_lab_rooms = 3`):** `LAB-A`, `LAB-B`, `LAB-C`. Alojan exclusivamente sesiones de **Laboratorio**.

---

### 5.2 Modelo Matemático CP-SAT (Restricciones C1 a C6)

El archivo [solver_service/epi/solver.py](file:///c:/Users/dylan_dnxqp1x/OneDrive/Informatica/ciclo%202026-2/cursos/Ingenieria%20de%20Software%202/Sistema-de-Horarios-UNT-Inform-tica/Sistema-de-Horarios-UNT-Inform-tica/solver_service/epi/solver.py) construye un modelo de programación por restricciones enteras (`cp_model.CpModel`) con 4 hilos paralelos (`num_search_workers = 4`):

1. **Variables de Decisión Booleanas:**
   - $T_{\text{sec}, c, b, d, s} \in \{0, 1\}$: vale $1$ si el bloque $b$ de Teoría del curso $c$ de la sección $\text{sec}$ se dicta el día $d$ en la franja $s$.
   - $P_{\text{sec}, c, b, d, s} \in \{0, 1\}$: vale $1$ si el bloque $b$ de Práctica del curso $c$ de la sección $\text{sec}$ se dicta el día $d$ en la franja $s$.
   - $L_{\text{sec}, c, d, s} \in \{0, 1\}$: vale $1$ si el Laboratorio del curso $c$ de la sección $\text{sec}$ inicia el día $d$ en la franja $s$ (ocupando 2 bloques consecutivos $s$ y $s+1$ cuando el laboratorio es de 4 h, o 1 bloque $s$ cuando es un subgrupo `L1`/`L2` de 2 h).
2. **Restricciones Duras:**
   - **C1 (Asignación única):** Todo bloque de Teoría, Práctica y Laboratorio debe asignarse exactamente una vez en la semana (`AddExactlyOne`).
   - **C2 (Disponibilidad docente):** Si el docente asignado no tiene disponibles ambas horas de la franja $(d, s)$, la variable correspondiente se fija en $0$. En laboratorios de 4 h se exige que tanto $(d, s)$ como $(d, s+1)$ estén disponibles.
   - **C3 (Anti-solapamiento global de docentes):** Para todo docente $t$, día $d$ y franja $s$, la suma de todas las sesiones que dicta en $(d, s)$ en cualquier ciclo o sección es $\le 1$ (`AddAtMostOne`).
   - **C4 (Anti-solapamiento estudiantil por sección):** Para toda sección $\text{sec}$, día $d$ y franja $s$, la suma de sesiones de esa sección activas en $(d, s)$ es $\le 1$ (`AddAtMostOne`).
   - **C5 (Cumplimiento exacto de carga horaria):** Pre-chequeo explícito que verifica que los bloques adjudicados a cada docente coincidan con sus `required_hours` y que disponga de suficientes bloques de 2 h habilitados.
   - **C6 (Capacidad simultánea de aulas EPI por franja):** Para todo día $d$ y franja $s$:
     $$\sum_{\text{sec}, c, b} \left(T_{\text{sec}, c, b, d, s} + P_{\text{sec}, c, b, d, s}\right) \le 5 \quad (\text{Aulas Teóricas})$$
     $$\sum_{\text{sec}, c} L^{\text{activo}}_{\text{sec}, c, d, s} \le 3 \quad (\text{Laboratorios})$$
   - **Ruptura de simetría:** Para cursos con 2 o más bloques del mismo tipo (p. ej. Práctica de 4 h = 2 bloques de 2 h), se impone que el índice temporal del bloque $b$ sea estrictamente menor que el del bloque $b+1$ ($7d_0 + s_0 < 7d_1 + s_1$), eliminando permutaciones simétricas y reduciendo el tiempo de resolución de 240 s a **~2–4 segundos**.
3. **Función Objetivo (Compactación):**
   - Minimiza $\sum s \cdot x_{d, s}$, priorizando los bloques matutinos y tempranos para evitar huecos innecesarios en el horario estudiantil.

---

### 5.3 Algoritmo de Asignación de Aulas (`placeRooms`)

Una vez que CP-SAT devuelve las sesiones con su día y hora, la función [`placeRooms`](file:///c:/Users/dylan_dnxqp1x/OneDrive/Informatica/ciclo%202026-2/cursos/Ingenieria%20de%20Software%202/Sistema-de-Horarios-UNT-Inform-tica/Sistema-de-Horarios-UNT-Inform-tica/server/routes/adjudicacion.ts#L500-L525) en `server/routes/adjudicacion.ts`:
1. Separa las aulas de la base de datos en **Teóricas** (`POOL-17`, `POOL-18`, `INFO-2`, `INFO-3`, `INFO-5`) y **Laboratorios** (`LAB-A`, `LAB-B`, `LAB-C`).
2. Ordena cronológicamente todas las sesiones por `(día, hora_inicio)` ascendente (priorizando los laboratorios de 4 h dentro del mismo instante de inicio).
3. Asigna a cada sesión la primera aula libre de su tipo exacto (`Teoría`/`Práctica` → aula teórica; `Laboratorio` → laboratorio).
4. Por la propiedad matemática de **coloración de grafos de intervalos**, al cumplirse C6 en CP-SAT y ordenar por tiempo de inicio, se garantiza que **el 100 % de las sesiones recibe un aula física sin colisiones (`unplaced = 0`)**.

---

## 6. Visualización de Horarios y Exportación a Excel

1. **Panel de Adjudicación y Resultados (`/admin/adjudicacion`):**
   - Muestra el resumen de turnos, las sesiones adjudicadas, la tabla completa del horario generado con el aula asignada a cada sesión y el botón **"Exportar a Excel (.xlsx)"** (`GET /api/adjudicacion/:id/exportar-excel`).
   - El archivo Excel generado por `solver_service/epi/excel_export.py` contiene una hoja de **Resumen General** y una hoja con **Grilla Semanal + Tabla Detallada** por cada ciclo programado.
2. **Horario por Docente (`/horarios/docente`):**
   - Permite seleccionar el semestre y cualquier docente para visualizar su grilla semanal de Lunes a Viernes (`07:00` a `20:00`) con el curso, ciclo, sección, tipo de sesión y aula asignada.
3. **Horario por Aula (`/horarios/aula`):**
   - Permite seleccionar cualquiera de los 8 ambientes (`POOL-17` a `LAB-C`) y visualizar qué curso, docente y sección ocupa el ambiente en cada bloque de la semana, además de las métricas de tasa de ocupación.

---

## 7. Seguridad, Control de Roles (JWT) y Referencia de Endpoints API

Todas las rutas que modifican el estado de la adjudicación o disparan el solver verifican obligatoriamente el token JWT (`Authorization: Bearer <token>`):
- **Sin token o con token falso/expirado:** responde **`401 Unauthorized`**.
- **Con rol insuficiente o docente intentando modificar el turno de otro docente:** responde **`403 Forbidden`**.

| Método y Ruta | Rol Requerido | Descripción |
|---|---|---|
| `POST /api/auth/login` | Público | Autentica usuario y devuelve `{ token, user: { id, username, role, teacher_id } }` |
| `GET /api/adjudicacion/activo` | Autenticado / Lectura | Devuelve el proceso activo o último completado del semestre con turnos, pool y resultado |
| `POST /api/adjudicacion/cargar-2026-2` | `DIRECTOR` / `ADMIN` | Carga los 32 docentes y las 135 sesiones oficiales del semestre 2026-2 |
| `POST /api/adjudicacion/iniciar` | `DIRECTOR` / `ADMIN` | Inicia un proceso interactivo por turnos configurando ciclos y secciones (`A` / `A+B`) |
| `GET /api/adjudicacion/:id/turno-actual` | Autenticado / Lectura | Consulta el docente que tiene el turno activo y las sesiones libres del pool |
| `POST /api/adjudicacion/:id/seleccionar` | `DOCENTE` (titular) o `DIRECTOR` | Reserva temporalmente sesiones para el docente en turno y valida horas exactas |
| `POST /api/adjudicacion/:id/confirmar` | `DOCENTE` (titular) o `DIRECTOR` | Confirma definitivamente la carga del docente si coincide con sus `required_hours` |
| `POST /api/adjudicacion/:id/saltar` | `DIRECTOR` / `ADMIN` | Omite el turno del docente actual y avanza al siguiente en la cola |
| `POST /api/adjudicacion/:id/generar` | `DIRECTOR` / `ADMIN` | Invoca al microservicio CP-SAT (`/solve`), asigna aulas (`placeRooms`) y guarda en `assignments` |
| `GET /api/adjudicacion/:id/resultado` | Autenticado / Lectura | Obtiene la última corrida del solver guardada en `solver_results` |
| `GET /api/adjudicacion/:id/exportar-excel` | Autenticado / Lectura | Descarga el archivo `.xlsx` generado por el microservicio Python |
| `DELETE /api/adjudicacion/:id` | `DIRECTOR` / `ADMIN` | Elimina un proceso de adjudicación para reiniciar la configuración |
| `GET /api/assignments` | Autenticado / Lectura | Lista los horarios reales filtrados por `semester_id`, `teacher_id` o `classroom_id` |

---

## 8. Estructura de Archivos del Proyecto

```
Sistema-de-Horarios-UNT-Inform-tica/
├── start_project.bat                # Script de inicio automático en Windows (3 servicios + config .env)
├── database_complete_schema.sql     # Esquema SQL completo + semillas (60 cursos, 8 aulas, docentes, usuarios)
├── package.json                     # Dependencias y scripts del Frontend (React 19 + Vite)
├── vite.config.ts                   # Configuración Vite (Puerto 3000 + proxy /api -> localhost:3001)
├── App.tsx                          # Enrutador principal de la aplicación React
├── types.ts                         # Tipos e interfaces TypeScript globales
├── services/
│   └── api.ts                       # Cliente HTTP REST con inyección automática de JWT
├── components/
│   ├── AdminLayout.tsx              # Barra lateral y layout del Director
│   └── TeacherLayout.tsx            # Barra lateral y layout del Docente
├── pages/
│   ├── LoginPage.tsx                # Inicio de sesión JWT por rol
│   ├── AdminAdjudicacion.tsx        # Panel del Director: Adjudicación, Carga 2026-2, Solver CP-SAT y Excel
│   ├── AdminTeachers.tsx            # CRUD de docentes con categoría y orden de prelación
│   ├── AdminCourses.tsx             # CRUD de los 60 cursos de la malla 2017
│   ├── AdminClassrooms.tsx          # CRUD de las 8 aulas reales EPI
│   ├── AdminSemesters.tsx           # Gestión y activación de semestres
│   ├── ScheduleTeacher.tsx          # Grilla de horarios reales por Docente
│   ├── ScheduleRoom.tsx             # Grilla de horarios reales por Aula
│   └── teacher/
│       ├── TeacherDashboard.tsx     # Panel de inicio del Docente
│       ├── TeacherAvailability.tsx  # Selección de disponibilidad Lun-Vie por bloques de 2h
│       └── TeacherAdjudicacion.tsx  # Pantalla del Docente para elegir carga en su turno
├── server/
│   ├── .env.example                 # Plantilla de variables de entorno del backend
│   ├── db.ts                        # Pool de conexión MySQL2 (utf8mb4)
│   ├── index.ts                     # Servidor Express (Puerto 3001) con auto-inicialización de BD
│   ├── migrate_fusion.ts            # Migración e inicialización idempotente (tablas, malla, aulas, usuarios)
│   ├── carga_2026_2.ts              # Importador de la carga horaria oficial 2026-2 (32 docentes, 135 sesiones)
│   ├── malla_epi.json               # Los 60 cursos oficiales de la Malla Curricular EPI 2017
│   └── routes/
│       ├── adjudicacion.ts          # Controlador de adjudicación, roles JWT, solver y placeRooms
│       ├── assignments.ts           # Consultas de horarios guardados en MySQL
│       ├── auth.ts                  # Login y registro JWT
│       ├── classrooms.ts            # Rutas de aulas
│       ├── courses.ts               # Rutas de cursos
│       ├── semesters.ts             # Rutas de semestres
│       └── teachers.ts              # Rutas de docentes y disponibilidad
├── solver_service/
│   ├── requirements.txt             # Dependencias Python (ortools, fastapi, uvicorn, openpyxl)
│   ├── main.py                      # API FastAPI (Puerto 5000): /solve, /export-excel, /health
│   └── epi/
│       ├── models.py                # Modelos de datos (DAYS Lun-Vie, TIME_SLOTS, Teacher, Course)
│       ├── solver.py                # Modelo CP-SAT con restricciones C1..C6 y ruptura de simetría
│       └── excel_export.py          # Exportador a Excel (.xlsx) con diseño institucional
└── docs/
    ├── REGISTRO_PROYECTO.md         # Bitácora técnica, verificaciones y límites honestos
    └── DOCUMENTACION_FUNCIONAMIENTO_Y_CARGA.md # Este manual detallado
```

---

## 9. Credenciales de Usuarios de Prueba (Director, Administrador y Docentes)

El login acepta tanto el **usuario corto** (ej. `jgutierrez`) como el **correo institucional** (`jgutierrez@unitru.edu.pe`).

### 9.1 Cuentas de Dirección y Administración (`DIRECTOR` / `ADMIN`)

| Usuario | Contraseña | Rol | Permisos |
|---|---|---|---|
| `director` | `director123` | `DIRECTOR` | Director de Escuela (gestión completa, iniciar/cargar adjudicación, saltar turnos, ejecutar solver CP-SAT, exportar a Excel) |
| `admin` | `admin123` | `ADMIN` | Administrador del Sistema (mismos privilegios administrativos que el Director) |

### 9.2 Cuentas de Docentes (`DOCENTE` — Plana EPI y Carga 2026-2)

| Usuario | Contraseña | Docente | Categoría | Prelación | Horas Regl. / 2026-2 | Correo Institucional |
|---|---|---|---|---|---|---|
| `jgutierrez` | `DOC-01` | Jorge Luis Gutiérrez Gutiérrez | Principal | #1 | 20 h (12 h en 2026-2) | `jgutierrez@unitru.edu.pe` |
| `jrodriguez` | `DOC-02` | José Antonio Rodríguez Melquiades | Principal | #2 | 20 h (12 h en 2026-2) | `jrodriguez@unitru.edu.pe` |
| `csanchez` | `DOC-23` | Carlos Alberto Sánchez Ruiz | Principal | #3 | 20 h | `csanchez@unitru.edu.pe` |
| `fvargas` | `DOC-24` | Fernando Enrique Vargas Silva | Principal | #4 | 20 h | `fvargas@unitru.edu.pe` |
| `ccastillod` | `DOC-03` | Carlos Enrique Castillo Diestra | Asociado | #1 | 18 h (16 h en 2026-2) | `ccastillod@unitru.edu.pe` |
| `ysifuentes` | `DOC-04` | Yenny Milagros Sifuentes Díaz | Asociado | #2 | 18 h (12 h en 2026-2) | `ysifuentes@unitru.edu.pe` |
| `jcruz` | `DOC-05` | José Gabriel Cruz Silva | Asociado | #3 | 18 h (22 h en 2026-2) | `jcruz@unitru.edu.pe` |
| `emendoza` | `DOC-06` | Edwin Raúl Mendoza Torres | Asociado | #4 | 18 h (12 h en 2026-2) | `emendoza@unitru.edu.pe` |
| `jsalazarc` | `DOC-07` | Juan Orlando Salazar Campos | Asociado | #5 | 18 h | `jsalazarc@unitru.edu.pe` |
| `agomez` | `DOC-10` | Anthony José Gómez Morales | Asociado | #6 | 18 h (9 h Práct. Preprof.) | `agomez@unitru.edu.pe` |
| `mrojasg` | `DOC-29` | María Teresita Rojas García | Asociado | #7 | 12 h (Estadística II-A/B) | `mrojasg@unitru.edu.pe` |
| `ecastillop` | `DOC-30` | Esteban Castillo Pereda | Asociado | #8 | 12 h (Análisis Mat. II-A/B) | `ecastillop@unitru.edu.pe` |
| `icruz` | `DOC-08` | Iris Áurea Cruz Florián | Auxiliar | #1 | 16 h (18 h en 2026-2) | `icruz@unitru.edu.pe` |
| `jperalta` | `DOC-09` | José Luis Peralta Luján | Auxiliar | #2 | 16 h (18 h en 2026-2) | `jperalta@unitru.edu.pe` |
| `rguevara` | `DOC-11` | Ricardo Manuel Guevara Ruiz | Auxiliar | #3 | 16 h (16 h en 2026-2) | `rguevara@unitru.edu.pe` |
| `lpedro` | `DOC-12` | Liz Sofía Raymunda Pedro Huamán | Auxiliar | #4 | 16 h (18 h en 2026-2) | `lpedro@unitru.edu.pe` |
| `vpolo` | `DOC-13` | Víctor Jaime Polo Romero | Auxiliar | #5 | 16 h (6 h en 2026-2) | `vpolo@unitru.edu.pe` |
| `cmquispe` | `DOC-14` | Celestino Medardo Quispe Varón | Auxiliar | #6 | 16 h (18 h en 2026-2) | `cmquispe@unitru.edu.pe` |
| `ppereyra` | `DOC-15` | Patricia Gissella Pereyra Salvador | Auxiliar | #7 | 16 h | `ppereyra@unitru.edu.pe` |
| `fpacheco` | `DOC-16` | Juan Francisco Pacheco Torres | Auxiliar | #8 | 16 h (8 h en 2026-2) | `fpacheco@unitru.edu.pe` |
| `jbravo` | `DOC-17` | Jorge David Bravo Escalante | Contratado | #1 | 12 h (18 h en 2026-2) | `jbravo@unitru.edu.pe` |
| `lramirezc` | `DOC-18` | Lourdes Ramírez Cerna / Cajachuan | Contratado | #2 | 12 h (12 h en 2026-2) | `lramirezc@unitru.edu.pe` |
| `jalvarador` | `DOC-19` | Jorge Luis Alvarado Ramos | Contratado | #3 | 12 h (20 h en 2026-2) | `jalvarador@unitru.edu.pe` |
| `yurquizo` | `DOC-20` | Yosip Vladimir Urquizo Gómez | Contratado | #4 | 12 h (8 h en 2026-2) | `yurquizo@unitru.edu.pe` |
| `mabantoco` | `DOC-21` | Manuel Regilder Abanto Corcuera | Contratado | #5 | 12 h (6 h en 2026-2) | `mabantoco@unitru.edu.pe` |
| `msalcedo` | `DOC-22` | Martín Gustavo Salcedo Quiñones | Contratado | #6 | 12 h | `msalcedo@unitru.edu.pe` |
| `mcastro` | `DOC-26` | Max Castro Rodríguez | Contratado | #7 | 16 h (Org. Archivos IV-A/B) | `mcastro@unitru.edu.pe` |
| `wapaza` | `DOC-27` | Wilmer Apaza Chávez | Contratado | #8 | 12 h (Arq. VI-B + Tópicos X) | `wapaza@unitru.edu.pe` |
| `epelaez` | `DOC-28` | Edgard José Peláez Vinces | Contratado | #9 | 8 h (Sociedad II-A/B) | `epelaez@unitru.edu.pe` |
| `salfaro` | `DOC-31` | Silvia Alfaro Luján | Contratado | #10 | 8 h (Cultura Inv. II-A/B) | `salfaro@unitru.edu.pe` |
| `mmori` | `DOC-32` | Miguel Mori | Contratado | #11 | 4 h (Ética II-A) | `mmori@unitru.edu.pe` |
| `cchavez` | `DOC-33` | Cesario Carlos Chávez | Contratado | #12 | 4 h (Ética II-B) | `cchavez@unitru.edu.pe` |
| `egenerales` | `DOC-34` | Estudios Generales (Talleres) | Contratado | #13 | 8 h (Talleres II-A/B) | `egenerales@unitru.edu.pe` |
| `wzubiaga` | `DOC-35` | Willy Zubiaga Vera | Contratado | #14 | 6 h (Geometría Analítica III-R) | `wzubiaga@unitru.edu.pe` |
| `jbecerra` | `DOC-36` | Julio Becerra | Contratado | #15 | 6 h (Matemática Discreta III-R) | `jbecerra@unitru.edu.pe` |
| `lponte` | `DOC-37` | Luis Ponte | Contratado | #16 | 6 h (Intro. Análisis Mat. III-R) | `lponte@unitru.edu.pe` |
| `rleon` | `DOC-38` | Ronal León | Contratado | #17 | 2 h (Análisis Numérico III-R) | `rleon@unitru.edu.pe` |
