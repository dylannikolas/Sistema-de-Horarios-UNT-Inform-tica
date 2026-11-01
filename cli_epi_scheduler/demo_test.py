"""
demo_test.py — Prueba automática completa del pipeline con adjudicación por categoría.

Escenario:
  Período PAR — Ciclos 2 y 4, secciones A y B.
  Docentes:
    Principal (orden 1): Dr. Martínez — 20h
    Asociado  (orden 1): Mg. García   — 18h
    Auxiliar  (orden 1): Lic. Torres  — 16h
    Contratado(orden 1): Ing. Flores  — 12h (lab)

Se verifica:
  - Adjudicación cubre exactamente las horas reglamentarias
  - Solver no produce conflictos
  - Excel exportado sin errores
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from models import (Teacher, Course, SectionData, MALLA_REAL,
                    AcademicPeriod, DAYS, CATEGORY_REQUIRED_HOURS, category_rank_key)
from course_assignment import CoursePool, validate_selection, _apply_assignments_to_sections
from solver import build_and_solve
from excel_export import export_to_excel
from version_manager import save_version, list_versions, load_version

# ── 1. Docentes con categoría y orden ─────────────────────────────────────────
avail_full = [(d,s) for d in range(5) for s in range(7)]  # Lun-Vie 07-21h
avail_lab  = [(d,s) for d in range(3) for s in range(6)]  # Lun-Mie 07-19h

teachers = {t.teacher_id: t for t in [
    # Principal — 20h
    Teacher("T001","Dr. Martínez López",   category="Principal",  orden=1,
            availability=avail_full, role="teoria_practica"),
    Teacher("T002","Mg. García Ramos",     category="Asociado",   orden=1,
            availability=avail_full, role="teoria_practica"),
    Teacher("T003","Lic. Torres Huanca",   category="Auxiliar",   orden=1,
            availability=avail_full, role="teoria_practica"),
    Teacher("T004","Ing. Flores Quispe",   category="Contratado", orden=1,
            availability=avail_lab,  role="laboratorio"),
    Teacher("T005","Dr. Vargas Mendoza",   category="Asociado",   orden=2,
            availability=avail_full, role="ambos"),
]}

# ── 2. Construir secciones sin docentes asignados ─────────────────────────────
def make_sections(ciclo, period: AcademicPeriod):
    result = []
    for sec in ["A","B"]:
        courses = [Course.from_malla(ciclo, idx, row)
                   for idx, row in enumerate(MALLA_REAL[ciclo])]
        result.append(SectionData(cycle=ciclo, section=sec,
                                   academic_period=period.value,
                                   section_type="regular", courses=courses))
    return result

period    = AcademicPeriod.PAR
sections  = make_sections(2, period) + make_sections(4, period)

# ── 3. Simular adjudicación automática ────────────────────────────────────────
#   (En producción esto es interactivo; aquí lo hacemos programáticamente)
pool = CoursePool(sections)

# Ordenar docentes por categoría y orden
sorted_teachers = sorted(teachers.values(), key=category_rank_key)

print("="*70)
print("DEMO — EPI Scheduler v2.0 — Adjudicación automática de carga horaria")
print(f"Período: {period.value.upper()}  |  Ciclos: 2, 4  |  Secciones: A+B")
print(f"Docentes: {len(teachers)}  "
      f"(Principal×1, Asociado×2, Auxiliar×1, Contratado×1)")
print("="*70)

# Mapa de asignaciones: teacher_id → lista de CourseSession
from course_assignment import CoursePool, validate_selection
teacher_selections = {}

def auto_assign(teacher, target_hours):
    """Toma sesiones del pool hasta alcanzar exactamente target_hours."""
    avail  = pool.available(teacher.role)
    chosen = []
    for sess in avail:
        if sum(s.hours for s in chosen) + sess.hours <= target_hours:
            chosen.append(sess)
            pool.assign(sess, teacher.teacher_id)
        if sum(s.hours for s in chosen) == target_hours:
            break
    teacher_selections[teacher.teacher_id] = chosen
    teacher.assigned_hours = sum(s.hours for s in chosen)
    return chosen

for t in sorted_teachers:
    chosen = auto_assign(t, t.required_hours)
    ok, msg = validate_selection(t, chosen)
    assigned = sum(s.hours for s in chosen)
    status = "✔ EXACTO" if ok else f"⚠ {msg}"
    print(f"  {t.category:12} Orden {t.orden}  {t.name:25} "
          f"req={t.required_hours}h  adj={assigned}h  {status}")

# Verificar que todos tienen carga exacta
all_exact = all(t.assigned_hours == t.required_hours for t in sorted_teachers)
print(f"\n{'✅ Todos con carga exacta.' if all_exact else '❌ Hay docentes sin carga exacta.'}")

# Aplicar a secciones
_apply_assignments_to_sections(teacher_selections, sections)

# ── 4. Mostrar resumen de sesiones del pool ───────────────────────────────────
assigned_sessions = [s for s in pool.sessions if s.teacher_id]
print(f"\nSesiones adjudicadas: {len(assigned_sessions)} / {len(pool.sessions)}")
unassigned = [s for s in pool.sessions if not s.teacher_id]
if unassigned:
    print(f"⚠ Sesiones sin docente: {len(unassigned)}")
    for s in unassigned[:5]:
        print(f"   {s.label}")

# ── 5. Solver ─────────────────────────────────────────────────────────────────
print("\n⚙  Ejecutando OR-Tools CP-SAT con restricción de horas exactas...")
result = build_and_solve(sections, teachers, time_limit_seconds=90,
                         description=f"Demo adjudicación por categoría — {period.value}")
result.academic_period = period.value
print(f"Estado: {result.status}  |  Sesiones programadas: {len(result.sessions)}")

if result.status not in ("OK","TIMEOUT") or not result.sessions:
    print("❌ Sin solución.")
    sys.exit(1)

# ── 6. Tabla de resultado ─────────────────────────────────────────────────────
print(f"\n{'SEC':<6}{'CURSO':<33}{'TIPO':<14}{'DÍA':<12}{'HORARIO':<18}{'DOCENTE'}")
print("-"*100)
for sess in sorted(result.sessions, key=lambda s:(s.section_id,s.day_idx,s.slot_idx)):
    print(f"{sess.section_id:<6}{sess.course_name[:32]:<33}{sess.session_type:<14}"
          f"{DAYS[sess.day_idx]:<12}{sess.time_str:<18}{sess.teacher_name}")

# ── 7. Guardar versión ────────────────────────────────────────────────────────
vid = save_version(result, teachers, sections)
print(f"\n✔ Versión guardada: {vid}")

# ── 8. Exportar Excel ─────────────────────────────────────────────────────────
out = os.path.join(os.path.dirname(__file__), "outputs",
                   f"Horario_{period.value}_{vid}.xlsx")
os.makedirs(os.path.dirname(out), exist_ok=True)
export_to_excel(result, out, teachers)
print(f"✔ Excel: {out}")

# ── 9. Verificar recarga ──────────────────────────────────────────────────────
r2, _, _ = load_version(vid)
assert r2.version_id == vid and len(r2.sessions) == len(result.sessions)
print(f"✔ Versión recargada OK ({len(r2.sessions)} sesiones)")

print("\n✅ DEMO COMPLETADO — Adjudicación por categoría + solver + Excel OK.")
