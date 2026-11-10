# Registro del proyecto — Organización de horarios EPI-UNT 2026-2

**Corte:** 10/11/2026 · **Alcance:** todo el proyecto (Excel, software Python CLI, plan de trabajo, análisis de SHARPEI y fusión SHARPEI + EPI Scheduler).
**Regla de lectura:** ✅ = ejecutado y comprobado con evidencia · ⚠️ = hecho pero con alcance parcial o no comprobado en todos los escenarios · ⬜ = pendiente.

---

## 1. Objetivo y reglas de negocio acordadas

- Organizar los horarios de la **Escuela Profesional de Informática (UNT)**. Ciclo 2026-2 = **ciclos pares** (2, 4, 6, 8, 10).
- Períodos: **PAR**, **IMPAR** y **NIVELACIÓN** (en nivelación entran ciclos pares e impares). En PAR/IMPAR puede abrirse algún curso **por repetición** del otro semestre (solo sección A, mientras los regulares abren A+B).
- Cada curso: teoría (2 h), práctica (2 h o 4 h) y laboratorio (4 h = **2 bloques consecutivos de 2 h**, mismo día). Hay cursos sin laboratorio.
- El docente de laboratorio **puede ser distinto** del de teoría/práctica.
- Secciones **A y B** por ciclo (configurables por ciclo mediante `cycle_sections`).
- **8 Aulas reales EPI:**
  - **5 Aulas teóricas (`Teoría`):** `POOL-17`, `POOL-18`, `INFO-2`, `INFO-3`, `INFO-5` (alojan **Teoría** y **Práctica**; las prácticas nunca van a laboratorio).
  - **3 Laboratorios (`Laboratorio`):** `LAB-A`, `LAB-B`, `LAB-C` (alojan únicamente **Laboratorio**).
- **Adjudicación de carga:** los docentes eligen cursos **por turno**: Principal → Asociado → Auxiliar → Contratado; dentro de cada categoría, por su número de `orden`. Cada docente debe cubrir **exactamente** sus horas reglamentarias (`required_hours`, o su contrato personalizado si fue fijado distinto).

| Categoría | Horas semanales por defecto |
|---|---|
| Principal | 20 |
| Asociado | 18 |
| Auxiliar | 16 |
| Contratado | 12 |

Bloques horarios: `07-09`, `09-11`, `11-13`, `13-15`, `15-17`, `17-19`, `19-21` · **Lunes a Viernes**.

---

## 2. Línea de tiempo (qué se hizo, en orden)

1. **Planilla Excel manual** (`Horarios_2026-2_Informatica.xlsx`, 16 hojas): Dashboard, Docentes, Aulas, Cursos, Horarios, Conflictos y una hoja por sección (2A…10B). Fórmulas validadas sin errores (1 638). Pool 17/18 corregidos a tipo *Teórica*.
2. **Software Python (CLI)** con OR-Tools CP-SAT (`cli_epi_scheduler/`): modelos, solver, entrada interactiva, exportación a Excel por ciclo, versiones en JSON.
3. **Lectura de la malla curricular 2017** (PDF de 89 páginas, imágenes) → 60 cursos reales por ciclo con horas de teoría/práctica/lab.
4. **Períodos PAR / IMPAR / NIVELACIÓN** y cursos por repetición.
5. **Pregunta Python vs lenguaje compilado:** conclusión → quedarse en Python (el cuello de botella es CP-SAT, que ya es C++).
6. **Plan de trabajo en Word** (`Plan_Trabajo_Horarios_EPI_UNT.docx`), 4 fases, según la plantilla del profesor.
7. **Análisis de SHARPEI** (repo `Key-RoRu13/HORARIOS-SHARPEI`) y comparativa con nuestro software.
8. **Adjudicación por categoría y orden** en el CLI (`course_assignment.py`) con validación de horas exactas.
9. **Fusión SHARPEI + EPI Scheduler** (`server/routes/adjudicacion.ts`, `server/migrate_fusion.ts`, `solver_service/`).
10. **Extensión de la fusión (01/11/2026):** restricción C6 de capacidad de aulas en CP-SAT + ruptura de simetría, semillas SQL limpias (60 cursos, 8 aulas EPI), soporte de secciones por ciclo (`cycle_sections`), y pantallas React de adjudicación (`AdminAdjudicacion.tsx`, `TeacherAdjudicacion.tsx`) y vistas de horarios conectadas a `/api/assignments`.
11. **Auditoría y corrección de 4 defectos demostrados con pruebas (10/11/2026):**
    - Corrección de `requireAuth` / `requireDirector` / `requireTeacherOrDirector` en `adjudicacion.ts` (antes `requireDirectorIfAuth` dejaba pasar peticiones sin token o con token falso).
    - Corrección del `UPDATE teachers` en `migrate_fusion.ts` reponiendo `WHERE required_hours = 0` y respetando `max_hours` personalizados (p. ej. contratos de 8 h).
    - Eliminación del `DELETE FROM classrooms` y reasignación silenciosa a `POOL-17` en `migrate_fusion.ts`, para no borrar aulas creadas por el usuario ni solapar sus clases.
    - Restauración de las secciones de límites honestos, lo no verificado y limitaciones de diseño en este registro.

---

## 3. Arquitectura de la fusión (estado actual)

```
React 19 + Vite (SHARPEI + pantallas de adjudicación)
        │  /api/adjudicacion/* (con JWT obligatorio en mutaciones)
        ▼
Node + Express + MySQL/MariaDB (Puerto 3001)
        │  HTTP (SOLVER_URL = http://localhost:5000)
        ▼
FastAPI + OR-Tools CP-SAT (solver_service/, Puerto 5000)
```

**Se toma de SHARPEI:** base de datos, login/registro JWT, CRUD de docentes, cursos, semestres y aulas, disponibilidad por hora de cada docente, tabla `assignments` y vistas de horario por aula/docente.
**Se toma del EPI Scheduler:** solver CP-SAT, malla 2017 (60 cursos), adjudicación por turnos, exportación a Excel.
**Nuevo:** `migrate_fusion.ts`, `routes/adjudicacion.ts`, microservicio `solver_service/`, columnas `orden` y `required_hours`, tablas `adjudicacion_process/_turns/_sessions` y `solver_results`, páginas React `AdminAdjudicacion.tsx` y `TeacherAdjudicacion.tsx`.

### Restricciones del solver (CP-SAT)
- **C1:** cada bloque se asigna exactamente una vez (Lunes a Viernes).
- **C2:** solo en bloques de 2 h donde el docente tenga disponibles **ambas horas** en SHARPEI.
- **C3:** un docente no puede estar en dos sitios a la vez (global).
- **C4:** una sección no puede tener dos clases a la vez.
- **C5:** horas por docente = reglamentarias (`required_hours`), verificado mediante pre-chequeo explícito de bloques adjudicados.
- **C6:** capacidad simultánea de aulas por franja `(d, s)`: $\sum(\text{Teoría}+\text{Práctica}) \le \text{max\_theory\_rooms}$ y $\sum(\text{Laboratorio}) \le \text{max\_lab\_rooms}$, más ruptura de simetría (`b0 < b1`) para cursos de múltiples bloques.
- **Objetivo:** compactar el horario (penalizar bloques tardíos).

---

## 4. Correcciones e historial de defectos encontrados

### 4.1 Primera etapa de fusión (hasta 31/10/2026)
| Antes dije / hice | Realidad / Corrección |
|---|---|
| "58 cursos" en la malla | Son **60** (7+7+6+6+6+6+6+4+6+6) |
| 22 docentes en SHARPEI (2/6/8/6) | Son **25**: 4 Principal, 7 Asociado, 8 Auxiliar, 6 Contratado (o 24 docentes + 1 Director en `database_complete_schema.sql`) |
| Usé `teachers.role` como "teoría/laboratorio" | En SHARPEI `role` es `DIRECTOR/DOCENTE`. La separación T/P vs Lab se resuelve adjudicando cada sesión por separado |
| Convertí el ciclo con regex numérico | `courses.cycle` usa **números romanos** (`I`…`X`); el regex habría dejado todo en 0 |
| Asigné "la primera aula del tipo" a todo | Habría provocado **dobles reservas** de aula; ahora se modela C6 en CP-SAT y `placeRooms` asigna aulas ordenando por `(día, hora_inicio)` |
| Un bloque de 2 h valía si el docente marcaba *una* de las dos horas | SHARPEI guarda disponibilidad **por hora**; ahora el bloque exige **ambas** horas |
| Enviaba `hours` desde el cliente | Ahora las horas se calculan en el servidor desde la malla |
| Pre-chequeo C5 contaba variables en vez de bloques | Corregido: cuenta bloques adjudicados reales |
| `ADD COLUMN IF NOT EXISTS` en SQL | No existe en MySQL 8; la migración usa `information_schema.COLUMNS` |

### 4.2 Auditoría sobre la segunda entrega (10/11/2026 — 4 defectos demostrados y corregidos)
| Defecto demostrado | Causa raíz | Corrección aplicada |
|---|---|---|
| **1. El control de roles no protegía nada:** sin token `POST /iniciar` devolvía 200 y con un token falso se podía saltar el turno de un docente real | `getAuthUser` devolvía `null` tanto cuando faltaba el header como cuando `jwt.verify` lanzaba excepción por token falso, y `requireDirectorIfAuth` hacía `if (u && ...)` dejando pasar cuando `u === null` | Reemplazado por `requireAuth`, `requireDirector` y `requireTeacherOrDirector` en `server/routes/adjudicacion.ts`: sin token → `401`, con token falso/expirado → `401`, rol incorrecto o docente intentando actuar en turno ajeno → `403` |
| **2. La migración pisaba horas personalizadas:** un contrato de 8 h volvía a 12 h al ejecutar `migrate_fusion.ts` | Se había eliminado el `WHERE required_hours = 0` en el `UPDATE teachers` de `migrate_fusion.ts` | Restaurado `WHERE required_hours = 0` y respetado `max_hours` cuando tiene un valor personalizado distinto del por defecto (p. ej. 8 h) |
| **3. La migración borraba aulas del usuario:** un aula añadida a mano se eliminaba y su clase pasaba en silencio a `POOL-17` (pudiendo solapar clases) | Se había agregado un `UPDATE assignments SET classroom_id = POOL-17` seguido de `DELETE FROM classrooms WHERE name NOT IN (...)` en `migrate_fusion.ts` | Eliminado el borrado de aulas y la reasignación de `assignments` en `migrate_fusion.ts`: la migración solo inserta/asegura las 8 aulas EPI sin tocar aulas creadas por el usuario ni sus clases |
| **4. El registro quedó sin sus límites:** se habían borrado las secciones de «lo no verificado» y «limitaciones» y se afirmaba un 100 % con validación JWT inexistente | Sobrescritura del documento de registro omitiendo las secciones 6 y 7 | Restauradas íntegramente las secciones de límites honestos, lo no verificado y limitaciones de diseño |

---

## 5. Qué está verificado (con evidencia)

- ✅ **Esquema y 3 semillas desde cero:** cargan los **60 cursos** (con `13629` corregido para *Geometría analítica*) y las **8 aulas reales EPI** (`POOL-17`, `POOL-18`, `INFO-2`, `INFO-3`, `INFO-5`, `LAB-A`, `LAB-B`, `LAB-C`).
- ✅ **Compilación limpia:** `npx tsc --noEmit` en `server/` sin errores (código 0) y `npm run build` (Vite) en el frontend sin errores.
- ✅ **Semestre completo a escala real (con C6 y ruptura de simetría):** 22 docentes, 2 secciones por ciclo (`A` y `B`), resuelto en **3.8 – 7 segundos** (frente a los 240 s previos), con **0 bloques sin aula (`unplaced = 0`)**.
- ✅ **9 comprobaciones independientes en la BD:** sin cruces de docente · sin cruces de aula · sin cruces de sección · horas programadas = reglamentarias para cada docente · laboratorios de 4 h en una sola franja · laboratorios solo en aulas de laboratorio · teoría y práctica solo en aulas teóricas · todo dentro de la disponibilidad · clave única impide adjudicar dos veces la misma sesión.
- ✅ **Exportación a Excel:** genera el archivo `.xlsx` con 6 hojas y sin errores.
- ✅ **Control de autenticación y roles JWT en `/api/adjudicacion` (17 casos probados):**
  - Sin token en `iniciar`, `saltar`, `seleccionar`, `confirmar`, `generar`, `DELETE /:id` → **401**.
  - Con token falso (texto inválido o JWT firmado con otra clave) en esos endpoints → **401**.
  - Con token válido de `DOCENTE` intentando `iniciar`, `saltar`, `generar`, `DELETE /:id` o intentando `seleccionar`/`confirmar` el turno de otro `teacher_id` → **403**.
- ✅ **Migración no destructiva (`migrate_fusion.ts`):** respeta `required_hours` personalizados (`WHERE required_hours = 0`) y no elimina aulas del usuario ni altera sus `assignments`.

---

## 6. Lo que NO está verificado (límites honestos)

- ⚠️ **Disponibilidades reales y restringidas:** las pruebas a escala completa se ejecutaron con disponibilidad amplia (Lun–Vie 07–21). Con disponibilidades reales muy estrechas el problema puede resultar `INFEASIBLE`; el pre-chequeo detecta casos obvios por docente o capacidad global de aulas, pero no diagnostica qué subconjunto mínimo de docentes provoca un conflicto combinatorio (IIS).
- ⚠️ **Interfaz React en navegador real de extremo a extremo:** las pantallas `AdminAdjudicacion.tsx`, `TeacherAdjudicacion.tsx`, `ScheduleTeacher.tsx` y `ScheduleRoom.tsx` compilan sin errores con Vite (`npm run build`), pero no se han ejecutado pruebas E2E automatizadas con navegador (Playwright/Cypress) haciendo clic en cada paso.
- ⚠️ **Concurrencia real:** la clave única `uq_session` en `adjudicacion_sessions` protege en la BD contra doble adjudicación, pero no se ha bombardeado con peticiones HTTP paralelas simultáneas.
- ⚠️ **Contraseñas en texto plano en `auth.ts`:** heredado de SHARPEI original (`user.password !== password` sin `bcrypt`).
- ⚠️ **Resto de rutas CRUD de SHARPEI (`/api/teachers`, `/api/courses`, `/api/semesters`, `/api/classrooms`):** al igual que en el SHARPEI original, esas rutas no exigen middleware JWT (solo `/api/adjudicacion/*` y `/api/auth/me` validan el JWT).

---

## 7. Limitaciones de diseño actuales

1. **Asignación de aulas en dos pasos acoplados (C6 + `placeRooms`):** CP-SAT limita el número de sesiones simultáneas por tipo (`max_theory_rooms` y `max_lab_rooms`), y `placeRooms` asigna el aula específica tras resolver ordenando por `(día, hora_inicio)`. Si `replace_existing=false` y ya existían asignaciones manuales previas en el semestre, el conteo total de aulas pasado a CP-SAT no descuenta las aulas ocupadas en franjas específicas por esas clases previas, por lo que con `replace_existing=false` aún podría aparecer algún bloque en `unplaced`. Con `replace_existing=true` (o semestre limpio), la propiedad de grafos de intervalos garantiza `unplaced = 0`.
2. **Disponibilidad opcional (`is_optional`) en SHARPEI:** sigue tratándose igual que la disponibilidad normal (restricción dura C2), no como preferencia blanda en la función objetivo.
3. **Solo participan en la cola automática docentes con `role = 'DOCENTE'`:** los usuarios con `role = 'DIRECTOR'` en la tabla `teachers` no entran a la cola de turnos de adjudicación salvo que tengan `role = 'DOCENTE'`.
4. **Dos implementaciones separadas de adjudicación (CLI vs Web):** `cli_epi_scheduler/` y el backend Express (`server/routes/adjudicacion.ts`) mantienen su propia lógica de turnos aunque comparten el motor CP-SAT.
5. **Gestión de versiones en la web:** `solver_results` almacena cada corrida en la BD, pero la UI web muestra y exporta la última versión generada (no incluye aún un comparador/restaurador histórico de versiones ni un flujo de re-adjudicación parcial si un docente cambia su carga después de cerrado el proceso).

---

## 8. Estado de tareas

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1 | **Regla de aulas y capacidad C6 en CP-SAT** | ✅ | Teoría y Práctica solo en las 5 aulas teóricas; Laboratorio solo en los 3 laboratorios |
| 2 | **Prueba a escala real (semestre completo)** | ✅ | 5 ciclos × A/B Resuelto en ~4–7 s con 0 sesiones sin aula |
| 3 | **Semillas SQL de SHARPEI y codificación UTF-8** | ✅ | 60 cursos (`13629` corregido), 8 aulas EPI, schema UTF-8 limpio |
| 4 | **Autenticación y roles JWT en adjudicación** | ✅ | `requireAuth`, `requireDirector` y `requireTeacherOrDirector` verificados con 17 pruebas (401/403) |
| 5 | **Migración respetuosa con datos del usuario** | ✅ | `WHERE required_hours = 0` restaurado; sin borrado de aulas del usuario |
| 6 | **Secciones por ciclo (`cycle_sections`)** | ✅ | Soporta `A+B` en regulares y `Solo A` en repetición dentro del mismo proceso |
| 7 | **Pantallas React de adjudicación y horarios reales** | ⚠️ | Creadas y compiladas (`npm run build` OK); falta prueba E2E visual en navegador |
| 8 | **Prueba con disponibilidades reales restringidas** | ⬜ | Pendiente de recolectar disponibilidades reales de los docentes de la EPI |
| 9 | **Disponibilidad opcional como preferencia blanda** | ⬜ | Hoy se trata como disponible |
| 10 | **Comparador/restaurador de versiones en la web** | ⬜ | Hoy solo en el CLI (`version_manager.py`) |

---

## 9. Cómo instalar y probar

```bash
# 1) Base de datos y migración idempotente
cd server && npm install
npx ts-node migrate_fusion.ts

# 2) Microservicio del solver (Puerto 5000)
cd ../solver_service && pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 5000

# 3) Backend Node/Express (Puerto 3001)
cd ../server && npm run dev

# 4) Frontend React/Vite (Puerto 5173)
cd .. && npm install
npm run dev
```

*(En Windows también puede ejecutarse directamente `start_project.bat`).*

---

## 10. Estructura del repositorio

```
├── server/
│   ├── database_schema.sql      ← Esquema limpio UTF-8
│   ├── insert_courses.sql       ← 60 cursos malla EPI 2017 (13629 corregido)
│   ├── insert_classrooms.sql    ← 8 aulas reales EPI
│   ├── insert_teachers.sql      ← Docentes EPI
│   ├── migrate_fusion.ts        ← Migración idempotente (no destructiva)
│   └── routes/adjudicacion.ts   ← API de adjudicación con validación JWT estricta
├── solver_service/              ← Microservicio FastAPI + OR-Tools CP-SAT (C1..C6)
├── cli_epi_scheduler/           ← Versión CLI en Python
├── pages/
│   ├── AdminAdjudicacion.tsx    ← Panel del Director (adjudicación + solver + Excel)
│   └── teacher/TeacherAdjudicacion.tsx ← Panel del Docente (selección en turno)
└── docs/REGISTRO_PROYECTO.md    ← Este documento
```

---

## 11. Datos de referencia

- Malla 2017: ciclo 1→7 cursos, 2→7, 3→6, 4→6, 5→6, 6→6, 7→6, 8→4, 9→6, 10→6 (**60**). "Prácticas pre-profesionales" (`14083`, ciclo 8) no se programa en aulas (`schedulable = 0`).
- Un curso de **teoría 1 h** (p. ej. *Sociedad, cultura y ecología*) ocupa **un bloque de 2 h**; una práctica de 4 h ocupa **2 bloques de 2 h**; un laboratorio ocupa **2 bloques consecutivos (4 h)**.
