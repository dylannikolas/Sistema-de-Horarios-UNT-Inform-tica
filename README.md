# Sistema de Horarios UNT — Escuela Profesional de Informática

Organización automática de horarios (ciclo 2026-2) para la EPI-UNT: **SHARPEI** (React + Node + MySQL) fusionado con el **EPI Scheduler** (OR-Tools CP-SAT).

## Qué incluye
| Carpeta | Contenido |
|---|---|
| `/` , `server/`, `pages/` … | SHARPEI con la fusión aplicada (login, docentes, disponibilidad, vistas de horario) |
| `server/routes/adjudicacion.ts` | Adjudicación de carga por turnos y categoría (horas exactas) |
| `server/migrate_fusion.ts` | Migración idempotente de la base de datos (malla 2017, aulas EPI, tablas nuevas) |
| `solver_service/` | Microservicio FastAPI + OR-Tools CP-SAT |
| `cli_epi_scheduler/` | Versión por consola (Python) del adjudicador + solver + Excel |
| `tests_fusion/` | Pruebas end-to-end y verificación independiente en la BD |
| `docs/` | `REGISTRO_PROYECTO.md` (estado, verificado, pendiente), plan de trabajo |
| `excel/` | Planilla Excel manual de horarios |

## Puesta en marcha
```bash
cd server && npm install
npx ts-node migrate_fusion.ts            # migración (idempotente)
cd ../solver_service && pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 5000
# en server/.env agregar:  SOLVER_URL=http://127.0.0.1:5000   (Node >= 18)
cd ../server && npm run dev
```
El estado real del proyecto (qué está verificado y qué falta) está en [`docs/REGISTRO_PROYECTO.md`](docs/REGISTRO_PROYECTO.md).

## Subir cambios a GitHub
`scripts/subir_cambios.bat` (Windows) o `./scripts/subir_cambios.sh "mensaje"` hacen *add + commit + pull --rebase + push*.

## Créditos
Base: [HORARIOS-SHARPEI](https://github.com/Key-RoRu13/HORARIOS-SHARPEI) de **Key-RoRu13** (el historial original se conserva). El repositorio original no declara licencia: mantener este repositorio **privado** salvo autorización de su autor. Las semillas SQL contienen correos reales de docentes.
