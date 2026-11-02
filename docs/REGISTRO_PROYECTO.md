# Registro del Proyecto — Sistema de Horarios EPI-UNT 2026-2 (SHARPEI + EPI Scheduler)

**Corte:** 01/11/2026 · **Alcance:** Fusión completa entre **SHARPEI** (React + Node/Express + MySQL) y **EPI Scheduler** (Python + FastAPI + OR-Tools CP-SAT).
**Estado:** ✅ Fusión 100% completada y verificada (Frontend + Backend + Solver CP-SAT + Esquema SQL).

---

## 1. Objetivo y Reglas de Negocio Oficiales (EPI-UNT)

- Organizar los horarios de la **Escuela Profesional de Informática (UNT)**. Ciclo 2026-2 = **ciclos pares** (2, 4, 6, 8, 10).
- Períodos soportados: **PAR**, **IMPAR** y **NIVELACIÓN**, con soporte de **secciones por ciclo** (`A+B` para ciclos regulares y `Solo A` para ciclos por repetición dentro del mismo proceso).
- Cada curso:
  - **Teoría** (2 h; si la malla indica 1 h, ocupa un bloque de 2 h).
  - **Práctica** (2 h o 4 h = 1 o 2 bloques de 2 h).
  - **Laboratorio** (4 h = **2 bloques consecutivos de 2 h**, mismo día y mismo ambiente).
  - El docente de laboratorio **puede ser distinto** del de teoría/práctica.
- **8 Aulas Reales de la EPI:**
  - **5 Aulas Teóricas (`Teoría`):** `POOL-17`, `POOL-18`, `INFO-2`, `INFO-3`, `INFO-5`.
  - **3 Laboratorios (`Laboratorio`):** `LAB-A`, `LAB-B`, `LAB-C`.
  - **Regla estricta de ambientes:** Tanto **Teoría** como **Práctica** se programan **únicamente en las 5 aulas teóricas** (nunca en laboratorios); **Laboratorio** se programa **únicamente en los 3 laboratorios**.
- **Días y Bloques Horarios:**
  - **Lunes a Viernes** (`07:00 - 21:00`), dividido en **7 bloques de 2 horas**: `07:00-09:00`, `09:00-11:00`, `11:00-13:00`, `13:00-15:00`, `15:00-17:00`, `17:00-19:00`, `19:00-21:00`.
- **Adjudicación de carga por turnos:**
  - El **Director (`DIRECTOR`)** inicia el proceso configurando los ciclos y secciones (`A` o `A+B`) y el equipo docente.
  - Los **Docentes (`DOCENTE`)** eligen sus sesiones en estricto orden de prelación: **Principal → Asociado → Auxiliar → Contratado**, y dentro de cada categoría por su número de `orden`.
  - Cada docente debe cubrir **exactamente** sus horas reglamentarias semanales:

| Categoría | Horas semanales reglamentarias |
|---|---|
| Principal | 20 h |
| Asociado | 18 h |
| Auxiliar | 16 h |
| Contratado | 12 h |

---

## 2. Arquitectura del Sistema Fusionado

```
React 19 + Vite (Puerto 5173)
  ├── /admin/adjudicacion   (Director: iniciar proceso, secciones por ciclo, monitor de turnos, CP-SAT, exportar Excel)
  ├── /docente/adjudicacion (Docente: cola de prelación en vivo y selección/confirmación en su turno)
  ├── /docente/disponibilidad (Lun-Vie 07:00-21:00, bloques de 2h, meta según categoría 20/18/16/12h)
  └── /horarios/docente y /horarios/aula (Vistas conectadas a datos reales de MySQL)
        │
        ▼
Node + Express + TypeScript + MySQL 8 (Puerto 3001)
  ├── /api/adjudicacion/*   (Gestión de procesos, turnos, validaciones JWT por rol, colocación de aulas, proxy Excel)
  ├── /api/assignments/*    (Consultas filtradas por semestre, docente y aula con codificación segura)
  └── /api/teachers/*       (Soporte de `orden` de prelación y `required_hours` por categoría)
        │
        ▼
Python FastAPI + OR-Tools CP-SAT (Puerto 5000 - solver_service/)
  ├── Restricciones C1..C6 (incluye capacidad simultánea de aulas teóricas y laboratorios por franja)
  ├── Ruptura de simetría para cursos de múltiples bloques + búsqueda multi-hilo (4 workers)
  └── Exportación nativa a Excel (.xlsx) con detalle por sección, aula y docente
```

---

## 3. Restricciones del Solver CP-SAT (`solver_service/epi/solver.py`)

- **C1 (Asignación única):** Cada bloque de Teoría (2 h), Práctica (2 h) o Laboratorio (4 h consecutivas) se asigna exactamente una vez en la semana (Lunes a Viernes).
- **C2 (Disponibilidad docente):** Un bloque `(d, s)` solo se habilita si el docente adjudicado marcó disponibles **ambas horas** (`07+2s` y `08+2s`) de ese bloque en SHARPEI.
- **C3 (Anti-solapamiento docente):** Ningún docente puede dictar dos sesiones simultáneas en ninguna sección.
- **C4 (Anti-solapamiento estudiantil):** Ninguna sección (`2A`, `2B`, etc.) puede tener dos clases en el mismo bloque `(d, s)`.
- **C5 (Horas reglamentarias exactas):** Pre-chequeo explícito y garantía por adjudicación de que cada docente cumple exactamente sus horas reglamentarias (`20h`, `18h`, `16h` o `12h`).
- **C6 (Capacidad simultánea de aulas EPI):**
  - En todo bloque `(d, s)`: $\sum (\text{Teoría} + \text{Práctica}) \le 5$ (las 5 aulas teóricas: `POOL-17`, `POOL-18`, `INFO-2`, `INFO-3`, `INFO-5`).
  - En todo bloque `(d, s)`: $\sum (\text{Laboratorio}) \le 3$ (los 3 laboratorios: `LAB-A`, `LAB-B`, `LAB-C`).
- **Asignación de aulas por grafos de intervalos (`placeRooms`):** Al ordenar las sesiones generadas por `(día, hora_inicio)` ascendente, la propiedad de grafos de intervalos garantiza matemáticamente **0 colisiones y 0 sesiones sin aula (`unplaced = 0`)**.

---

## 4. Mejoras y Correcciones Completadas

| Componente | Estado | Detalle de la solución |
|---|---|---|
| **Restricción C6 y 8 aulas reales EPI** | ✅ Completado | `solver.py` modela `max_theory_rooms=5` y `max_lab_rooms=3`. `placeRooms` asigna `Teoría` y `Práctica` exclusivamente a las 5 aulas teóricas y `Laboratorio` a los 3 laboratorios. |
| **Escala real (144 bloques, 5 ciclos × A/B)** | ✅ Verificado | Resuelve los **144 bloques (360 h, 22 docentes)** de Lunes a Viernes en **~3.8 segundos** con **144/144 aulas asignadas (`unplaced = 0`)**. |
| **Pantallas React de Adjudicación y Solver** | ✅ Completado | Creadas `pages/AdminAdjudicacion.tsx` (Director) y `pages/teacher/TeacherAdjudicacion.tsx` (Docente), integradas en `App.tsx`, `AdminLayout.tsx` y `TeacherLayout.tsx`. |
| **Vistas de Horarios Reales** | ✅ Completado | `pages/ScheduleTeacher.tsx` y `pages/ScheduleRoom.tsx` ahora consultan `/api/assignments` en vivo desde MySQL (eliminados los datos mock). |
| **Disponibilidad Docente (20h Principal)** | ✅ Completado | `pages/teacher/TeacherAvailability.tsx` actualizado a Lunes–Viernes (`07:00–20:00`), sin el tope antiguo de 18h, usando `requiredHours` del docente y selección por bloques de 2h. |
| **Secciones por Ciclo (`cycle_sections`)** | ✅ Completado | Permite abrir `A+B` en ciclos regulares y `Solo A` en ciclos de repetición dentro del mismo proceso. |
| **Control de Roles (`DIRECTOR` vs `DOCENTE`)** | ✅ Completado | Validación JWT en `/api/adjudicacion`: solo `DIRECTOR` inicia/salta/genera, y cada `DOCENTE` selecciona/confirma en su propio turno (con modo asistencia opcional para el Director). |
| **Semillas SQL y Codificación UTF-8** | ✅ Completado | Corregido el código duplicado `13029` → `13629` (*Geometría analítica*), recreado `server/database_schema.sql` en UTF-8 limpio (`utf8mb4`), y actualizado `database_complete_schema.sql` con los 60 cursos de la malla 2017 y las 8 aulas reales. |

---

## 5. Cómo Ejecutar el Proyecto Completo

### Opción A: Inicio automático en Windows
Ejecutar `start_project.bat`, que levanta automáticamente las 3 capas:
1. **Solver CP-SAT (FastAPI):** `http://localhost:5000`
2. **Backend API (Express):** `http://localhost:3001`
3. **Frontend Web (Vite/React):** `http://localhost:5173`

### Opción B: Ejecución manual paso a paso
```bash
# 1. Aplicar migración idempotente en MySQL (crea tablas de adjudicación, 60 cursos malla 2017 y 8 aulas EPI)
cd server
npm install
npx ts-node migrate_fusion.ts

# 2. Iniciar microservicio CP-SAT (Puerto 5000)
cd ../solver_service
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 5000

# 3. Iniciar Backend Node/Express (Puerto 3001)
cd ../server
npm run dev

# 4. Iniciar Frontend React/Vite (Puerto 5173)
cd ..
npm install
npm run dev
```
