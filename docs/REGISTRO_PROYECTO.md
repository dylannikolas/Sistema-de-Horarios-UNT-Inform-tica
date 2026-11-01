# Registro del proyecto — Organización de horarios EPI-UNT 2026-2

**Corte:** 31/10/2026 · **Alcance:** todo el chat (Excel, software Python, plan de trabajo, análisis de SHARPEI y fusión).
**Regla de lectura:** ✅ = ejecutado y comprobado en este chat · ⚠️ = hecho pero no comprobado · ⬜ = pendiente.

---

## 1. Objetivo y reglas de negocio acordadas

- Organizar los horarios de la **Escuela Profesional de Informática (UNT)**. Ciclo 2026-2 = **ciclos pares** (2, 4, 6, 8, 10).
- Períodos: **PAR**, **IMPAR** y **NIVELACIÓN** (en nivelación entran ciclos pares e impares). En PAR/IMPAR puede abrirse algún curso **por repetición** del otro semestre.
- Cada curso: teoría (2 h), práctica (2 h o 4 h) y laboratorio (4 h = **2 bloques consecutivos de 2 h**, mismo día). Hay cursos sin laboratorio.
- El docente de laboratorio **puede ser distinto** del de teoría/práctica.
- Secciones **A y B** por ciclo "si hace falta".
- Aulas: **Pool 17 y Pool 18** (aulas teóricas, *no* laboratorios), **Info 2, Info 3, Info 5**, **Lab A, Lab B, Lab C**.
- **Adjudicación de carga:** los docentes eligen cursos **por turno**: Principal → Asociado → Auxiliar → Contratado; dentro de cada categoría, por su número de orden. Cada docente debe cubrir **exactamente** sus horas reglamentarias (ni más, ni menos).

| Categoría | Horas semanales |
|---|---|
| Principal | 20 |
| Asociado | 18 |
| Auxiliar | 16 |
| Contratado | 12 |

Bloques horarios: 07-09, 09-11, 11-13, 13-15, 15-17, 17-19, 19-21 · Lunes a Sábado.

---

## 2. Línea de tiempo (qué se hizo, en orden)

1. **Planilla Excel manual** (`Horarios_2026-2_Informatica.xlsx`, 16 hojas): Dashboard, Docentes, Aulas, Cursos, Horarios, Conflictos y una hoja por sección (2A…10B). Fórmulas validadas sin errores (1 638). Pool 17/18 corregidos a tipo *Teórica*.
2. **Software Python (CLI)** con OR-Tools CP-SAT: modelos, solver, entrada interactiva, exportación a Excel por ciclo, versiones en JSON.
3. **Lectura de la malla curricular 2017** (PDF de 89 páginas, imágenes) → cursos reales por ciclo con horas de teoría/práctica/lab.
4. **Períodos PAR / IMPAR / NIVELACIÓN** y cursos por repetición (en el CLI).
5. **Pregunta Python vs lenguaje compilado:** conclusión → quedarse en Python (el cuello de botella es CP-SAT, que ya es C++).
6. **Plan de trabajo en Word** (`Plan_Trabajo_Horarios_EPI_UNT.docx`), 4 fases, según la plantilla del profesor.
7. **Análisis de SHARPEI** (repo `Key-RoRu13/HORARIOS-SHARPEI`) y comparativa con nuestro software.
8. **Adjudicación por categoría y orden** en el CLI (`course_assignment.py`) con validación de horas exactas.
9. **Fusión SHARPEI + EPI Scheduler.** Un primer intento se perdió por reinicios del entorno y resultó tener errores (sección 4). Se **rehízo contra el repositorio real**, con base de datos real y pruebas de extremo a extremo (sección 5).

---

## 3. Arquitectura de la fusión (estado actual)

```
React (SHARPEI, sin cambios)  ──►  Node + Express + MariaDB/MySQL (SHARPEI parcheado)
                                      │  /api/adjudicacion/*   ← NUEVO
                                      │  HTTP (SOLVER_URL)
                                      ▼
                              FastAPI + OR-Tools CP-SAT  (solver_service/, NUEVO)
```

**Se toma de SHARPEI:** base de datos, login/registro, CRUD de docentes y cursos, disponibilidad por hora de cada docente, tablas `assignments` y vistas de horario por aula/docente.
**Se toma del EPI Scheduler:** solver CP-SAT, malla 2017 (60 cursos), adjudicación por turnos, exportación a Excel.
**Nuevo:** `migrate_fusion.ts`, `routes/adjudicacion.ts`, microservicio `solver_service/`, columnas `orden` y `required_hours`, tablas `adjudicacion_process/_turns/_sessions` y `solver_results`.

### Restricciones del solver (CP-SAT)
C1 cada bloque se asigna una vez · C2 solo en disponibilidad del docente · C3 un docente no puede estar en dos sitios a la vez (global) · C4 una sección no puede tener dos clases a la vez · C5 horas por docente = reglamentarias (ver nota) · objetivo: compactar el horario.
*Nota C5:* como cada bloque se asigna exactamente una vez, las horas de un docente quedan fijadas por la adjudicación. Se dejó como **pre-chequeo explícito** (cuenta los bloques adjudicados) que avisa qué docente no cuadra, en lugar de devolver un INFEASIBLE sin explicación. *La primera versión de ese pre-chequeo contaba variables en vez de bloques (42 por bloque) y avisaba en falso «504 h vs 12 h»; se corrigió el 31/10 y se probó: silencioso con carga exacta, avisa con 14 h vs 12 h.*

### Cambios en SHARPEI (parche mínimo, no reemplazos completos)
| Archivo | Cambio |
|---|---|
| `server/routes/teachers.ts` | `orden` y `required_hours` (auto desde la categoría) al crear/editar; `GET /teachers/ordered` |
| `server/routes/auth.ts` | `/register` calcula `required_hours` y acepta `orden` |
| `server/index.ts` | monta `/api/adjudicacion` y `/api/solver/health` |
| `server/routes/adjudicacion.ts` | **nuevo**, 8 endpoints |
| `server/migrate_fusion.ts` + `malla_epi.json` | **nuevo**, migración idempotente |
| `solver_service/` | **nuevo**, microservicio Python |

### Endpoints nuevos
`POST /api/adjudicacion/iniciar` · `GET …/:id/turno-actual` · `POST …/:id/seleccionar` · `POST …/:id/confirmar` · `POST …/:id/saltar` · `GET …/:id/resumen` · `POST …/:id/generar` · `GET …/:id/resultado`

---

## 4. Correcciones a lo que dije antes (errores míos)

| Antes dije / hice | Realidad |
|---|---|
| "58 cursos" en la malla | Son **60** (7+7+6+6+6+6+6+4+6+6) |
| 22 docentes en SHARPEI (2/6/8/6) | Son **25**: 4 Principal, 7 Asociado, 8 Auxiliar, 6 Contratado |
| Usé `teachers.role` como "teoría/laboratorio" | En SHARPEI `role` es `DIRECTOR/DOCENTE`. SHARPEI no tiene ese dato; la separación T/P vs Lab se resuelve adjudicando cada sesión por separado |
| Convertí el ciclo con regex numérico | `courses.cycle` usa **números romanos** (`I`…`X`); el regex habría dejado todo en 0 |
| Asigné "la primera aula del tipo" a todo | Habría provocado **dobles reservas** de aula: el solver no modela aulas. Ahora se asignan aulas con control de cruces tras resolver |
| Un bloque de 2 h valía si el docente marcaba *una* de las dos horas | SHARPEI guarda disponibilidad **por hora**; ahora el bloque exige **ambas** horas |
| Reemplazar `teachers.ts`, `auth.ts`, `index.ts` completos | Riesgo de perder código de SHARPEI; ahora son parches mínimos sobre los originales |
| Enviaba `hours` desde el cliente | Ahora las horas se calculan en el servidor desde la malla |
| `tsc`/pruebas "pasan" en la primera versión | La primera versión nunca se compiló contra el repo real; el `tsc` real encontró un error de tipos (corregido) |
| Pre-chequeo C5 "corregido" y dado por bueno | Estaba mal (contaba variables, no bloques) y no lo vi en las primeras pruebas porque no revisé el log del solver; lo detecté al revisar la prueba a escala |
| `ADD COLUMN IF NOT EXISTS` en SQL | No existe en MySQL 8; la migración se reescribió en TypeScript con `information_schema` |

Hallazgos en **SHARPEI** (no corregidos, fuera de nuestro código):
- `insert_courses.sql` **falla**: repite el código `13029` para "Geometría analítica" (según la malla debe ser `13629`) y deja solo 18 cursos.
- `database_schema.sql` tiene un byte en latin1 en el ENUM `day_of_week` ("Mi?rcoles", "S?bado"). Por eso `adjudicacion.ts` lee y escribe ese campo **por índice numérico**.
- Las rutas de la API **no tienen middleware de autenticación**; las nuevas tampoco.

---

## 5. Qué está verificado (con evidencia)

Entorno de prueba: **MariaDB 10.11**, Node (ts-node), Python 3 + FastAPI + OR-Tools.

- ✅ **Migración** sobre el esquema original de SHARPEI: 1.ª ejecución 46 cursos insertados + 14 actualizados; 2.ª ejecución 0 insertados + 60 actualizados (**idempotente**). Horas por categoría y ciclos romanos→numéricos correctos; "Prácticas pre-profesionales" excluida de lo programable.
- ✅ **`tsc --noEmit` sin errores** sobre todo el backend.
- ✅ **El parche se aplica limpio** (`git apply --check`) sobre un clon nuevo del repositorio.
- ✅ **Flujo completo por HTTP** (ciclo 2, secciones A y B, 4 docentes = 20+18+18+16 = 72 h): pool de 28 sesiones/72 h → turnos en orden → confirmación exacta → solver `OK` → **34 sesiones** (por sección: 6 teoría + 10 práctica + 1 laboratorio) guardadas con aula.
- ✅ **Rechazos correctos:** selección fuera de turno (409) · confirmar con 2 h cuando se requieren 20 h (400) · generar con turnos pendientes (409) · segundo proceso en el mismo semestre (409).
- ✅ **Verificación independiente en la BD (9 comprobaciones):** sin cruces de docente · sin cruces de aula · sin cruces de sección · horas programadas = reglamentarias para cada docente · laboratorios de 4 h en una sola franja · laboratorios solo en aulas de laboratorio · teoría solo en aulas teóricas · todo dentro de la disponibilidad · clave única impide adjudicar dos veces la misma sesión.
- ✅ **Puente de disponibilidad:** sin disponibilidad → 422 con mensaje claro; una sola hora de un bloque **no** cuenta como bloque; bloque completo sí. Exportación a Excel con las 34 sesiones reales, sin errores.
- ✅ **CLI Python** (`demo_test.py`): adjudicación con 5 docentes de prueba = 84 h exactas; solver, versiones JSON y Excel OK.

---

## 6. Lo que NO está verificado (límites honestos)

- ⚠️ **Escala real no probada.** Lancé la prueba de un semestre completo (ciclos 2, 4, 6, 8, 10 × A/B, 22 docentes, 360 h): la adjudicación terminó (22 docentes exactos en 0,4 s, pool de 136 sesiones = 360 h), pero el solver no llegó a terminar porque el entorno se reinició y mató el proceso. **No conozco el tiempo del solver a esa escala.** El entorno de prueba tiene 1 solo núcleo.
- ⚠️ La prueba usó **disponibilidad total** Lun–Vie 07–21. Con disponibilidades reales y restringidas el solver podría ser INFEASIBLE; el pre-chequeo avisa los casos obvios, pero no se probó con datos parciales reales.
- ⚠️ Solo probado en **MariaDB 10.11**; no en MySQL 8 ni en tu XAMPP.
- ⚠️ **Concurrencia:** la clave única está comprobada por SQL, pero no con dos peticiones simultáneas reales.
- ⚠️ El mensaje de error "ningún bloque completo de 2 h" se afinó al final y **no volví a ejecutar** esa prueba.
- ⚠️ Los números de la prueba a escala (sección 9) son cálculo manual, no ejecutado.

---

## 7. Limitaciones de diseño actuales

1. **El solver no modela aulas.** Las aulas se asignan *después* de resolver, de forma voluntaria y sin cruces: teoría → aulas teóricas · práctica → teóricas y, si no hay libre, laboratorio · laboratorio → laboratorios. Si no hay aula libre, la sesión se informa en `unplaced` (no se reserva doble). **La regla "práctica puede ir a laboratorio" es una suposición mía.**
2. **No hay pantallas React** para la adjudicación. Hoy es solo API. Las vistas de horario de SHARPEI sí sirven (leen `assignments`).
3. **Sin autenticación/roles** en la API (igual que el resto de SHARPEI).
4. `sections` es **global al proceso** (no por ciclo): no se puede abrir solo la sección A de un ciclo por repetición y A+B en otros dentro del mismo proceso.
5. La disponibilidad **opcional** de SHARPEI cuenta igual que la obligatoria.
6. Solo participan docentes con `role = 'DOCENTE'` (los `DIRECTOR` no).
7. El **CLI** y la versión **web** son dos implementaciones separadas de la adjudicación (comparten el solver).
8. Control de versiones: el CLI guarda JSON por versión; la web guarda cada resultado en `solver_results`, pero **no hay** restaurar/comparar versiones ni flujo "un docente cambia su carga".

---

## 8. Pendiente (priorizado)

| # | Tarea | Notas |
|---|---|---|
| 1 | **Decidir regla de aulas** | ¿La práctica puede ir a laboratorio? ¿Modelar aulas dentro de CP-SAT (capacidad simultánea) para evitar sesiones "sin aula"? |
| 2 | **Prueba a escala real** | 5 ciclos × A/B con ~22 docentes; medir tiempo; ajustar parámetros del solver |
| 3 | **Prueba con disponibilidades reales** | Cargar la disponibilidad real de los docentes y ver si hay solución |
| 4 | **Pantallas React de adjudicación** | turno actual, selección, confirmar, saltar, resumen, generar, resultado |
| 5 | **Autenticación/roles** | DIRECTOR: iniciar/generar · DOCENTE: elegir en su turno |
| 6 | **Secciones por ciclo** | Permitir repetición con solo sección A y A+B en el resto |
| 7 | **Versiones y cambios de carga** | Guardar/comparar/restaurar; re-adjudicar y regenerar cuando un docente cambia su carga |
| 8 | Disponibilidad opcional como **preferencia blanda** | Hoy se trata como disponible |
| 9 | Probar en **MySQL 8 / XAMPP** | Y probar concurrencia real |
| 10 | Corregir semillas de SHARPEI | `13029`→`13629` en `insert_courses.sql`; codificación del schema |
| 11 | Actualizar **Plan de Trabajo (Word)** y READMEs | El plan menciona "7 módulos"; el CLI ya tiene 8 y existe la fusión |

**Decisiones que necesito de ti:** (a) regla de aulas para prácticas · (b) si las secciones varían por ciclo · (c) quién ejecuta cada paso (coordinador vs docente) · (d) si el sábado se usa para clases.

---

## 9. Cómo instalar y probar

```bash
# 0) Aplicar la fusión sobre tu clon de SHARPEI (o copiar la carpeta 1_SHARPEI_fusionado)
cd HORARIOS-SHARPEI && git apply ../2_parche/fusion_sharpei.patch

# 1) Base de datos (idempotente)
cd server && npm install
npx ts-node migrate_fusion.ts

# 2) Microservicio del solver
cd ../solver_service && pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 5000

# 3) Backend  (Node >= 18: usa fetch global). En server/.env agrega:
#    SOLVER_URL=http://127.0.0.1:5000
cd ../server && npm run dev
```

Flujo de uso: `iniciar` (con `semester_id`, `cycles`) → por cada turno `seleccionar` + `confirmar` (o `saltar`) → `resumen` → `generar` → `resultado`.
Ejemplo de cuerpo de `iniciar`: `{"semester_id": 1, "cycles": [2,4,6,8,10], "sections": ["A","B"]}`.
El servidor avisa si las horas del pool no coinciden con la suma de horas reglamentarias (si no coinciden, no todos los docentes podrán quedar exactos).

**Pruebas incluidas** (`4_pruebas/`): `e2e.py`, `verify.py`, `edge.py`. Requieren `mysql -uroot` por socket y un semestre de prueba; las rutas están pensadas para el entorno donde se corrieron.

**Idea para la prueba a escala** *(cálculo manual, sin ejecutar)*: los ciclos pares suman ≈ 180 h por sección → 360 h con A+B. Una combinación exacta con los docentes de SHARPEI: 4 Principal + 6 Asociado + 7 Auxiliar + 5 Contratado = 80+108+112+60 = 360 h.

---

## 10. Contenido del ZIP

```
REGISTRO_PROYECTO.md            ← este documento
1_SHARPEI_fusionado/            ← repo SHARPEI con la fusión aplicada (sin node_modules, .git ni .env)
2_parche/fusion_sharpei.patch   ← mismo cambio como parche de git (verificado)
3_epi_scheduler_cli/            ← software Python CLI (con el pre-chequeo C5 corregido)
4_pruebas/                      ← e2e.py, verify.py, edge.py
5_entregables_previos/          ← Excel (manual y de demos) y Word (plan de trabajo)
```
Nota: `horario_2026_2_software.zip` (entregado antes) queda **superado** por `3_epi_scheduler_cli/`: la versión anterior tenía la restricción C5 sin protección.

---

## 11. Datos de referencia

- Malla 2017: ciclo 1→7 cursos, 2→7, 3→6, 4→6, 5→6, 6→6, 7→6, 8→4, 9→6, 10→6 (**60**). "Prácticas pre-profesionales" (14083, ciclo 8) no se programa en aulas.
- Un curso de **teoría 1 h** (p. ej. Sociedad, cultura y ecología) ocupa **un bloque de 2 h**; una práctica de 4 h ocupa **2 bloques**.
- Resultado verificado del ciclo 2 (A+B): 72 h = 28 sesiones adjudicables → 34 bloques programados.
