import subprocess
def sql(q):
    o = subprocess.run(["mysql","-uroot","--default-character-set=utf8mb4","-N","-B","sistema_horarios","-e",q],capture_output=True).stdout.decode("utf-8","replace").strip()
    return [l.split("\t") for l in o.splitlines()] if o else []
import os
SEM_NAME = os.environ.get('SEM_NAME','E2E-2026-2')
SEM = f"(SELECT id FROM semesters WHERE name='{SEM_NAME}')"
A = f"FROM assignments a WHERE a.semester_id={SEM}"
checks = []
def check(name, rows, expect_empty=True, show=None):
    good = (len(rows) == 0) if expect_empty else True
    checks.append(good); print(("  ✔ " if good else "  ✗ ") + name + ("" if good else f"  -> {rows[:5]}"))

print("Totales:", sql(f"SELECT COUNT(*), SUM(TIME_TO_SEC(TIMEDIFF(end_time,start_time)))/3600 {A}")[0], "(sesiones, horas)")
# 1. Cruce de docente
check("ningún docente en dos sesiones a la vez", sql(f"""SELECT a.teacher_id,a.day_of_week+0,a.start_time FROM assignments a JOIN assignments b
  ON a.semester_id=b.semester_id AND a.id<b.id AND a.teacher_id=b.teacher_id AND a.day_of_week=b.day_of_week
  AND a.start_time<b.end_time AND b.start_time<a.end_time WHERE a.semester_id={SEM}"""))
# 2. Cruce de aula
check("ningún aula usada por dos sesiones a la vez", sql(f"""SELECT a.classroom_id,a.day_of_week+0,a.start_time FROM assignments a JOIN assignments b
  ON a.semester_id=b.semester_id AND a.id<b.id AND a.classroom_id=b.classroom_id AND a.day_of_week=b.day_of_week
  AND a.start_time<b.end_time AND b.start_time<a.end_time WHERE a.semester_id={SEM}"""))
# 3. Cruce de sección (alumnos): misma sección y ciclo
check("ninguna sección con dos clases a la vez", sql(f"""SELECT a.section,ca.cycle_number,a.day_of_week+0,a.start_time FROM assignments a JOIN courses ca ON ca.id=a.course_id
  JOIN assignments b ON a.semester_id=b.semester_id AND a.id<b.id AND a.section=b.section AND a.day_of_week=b.day_of_week
  AND a.start_time<b.end_time AND b.start_time<a.end_time JOIN courses cb ON cb.id=b.course_id AND cb.cycle_number=ca.cycle_number WHERE a.semester_id={SEM}"""))
# 4. Horas exactas por docente
check("horas programadas por docente = horas reglamentarias", sql(f"""SELECT t.name,t.required_hours,SUM(TIME_TO_SEC(TIMEDIFF(a.end_time,a.start_time)))/3600 h
  FROM assignments a JOIN teachers t ON t.id=a.teacher_id WHERE a.semester_id={SEM} GROUP BY t.id HAVING h<>t.required_hours"""))
# 5. Laboratorios: 4h seguidas y en aula de laboratorio
check("cada laboratorio dura 4h en una sola franja", sql(f"SELECT id FROM assignments a WHERE a.semester_id={SEM} AND session_type='Laboratorio' AND TIME_TO_SEC(TIMEDIFF(end_time,start_time))<>14400"))
check("laboratorios solo en aulas de laboratorio", sql(f"SELECT a.id FROM assignments a JOIN classrooms c ON c.id=a.classroom_id WHERE a.semester_id={SEM} AND a.session_type='Laboratorio' AND c.type+0<>2"))
check("teoría solo en aulas teóricas", sql(f"SELECT a.id FROM assignments a JOIN classrooms c ON c.id=a.classroom_id WHERE a.semester_id={SEM} AND a.session_type LIKE 'Teor%' AND c.type+0<>1"))
# 6. Dentro de disponibilidad declarada (Lun-Vie 07-21)
check("todas las sesiones dentro de la disponibilidad (Lun–Vie, 07:00–21:00)", sql(f"SELECT id FROM assignments a WHERE a.semester_id={SEM} AND (a.day_of_week+0>5 OR a.start_time<'07:00:00' OR a.end_time>'21:00:00')"))
# 7. Cobertura de la malla: bloques por curso/sección
print("Bloques por tipo y sección:", sql(f"SELECT section,session_type,COUNT(*) {A} GROUP BY section,session_type ORDER BY section,session_type"))
# 8. La clave única impide adjudicar dos veces una sesión
r = subprocess.run(["mysql","-uroot","sistema_horarios","-e","INSERT INTO adjudicacion_sessions (process_id,teacher_id,course_id,section,session_type,hours) SELECT process_id,teacher_id,course_id,section,session_type,hours FROM adjudicacion_sessions LIMIT 1"],capture_output=True)
dup = b"Duplicate" in r.stderr
checks.append(dup); print(("  ✔ " if dup else "  ✗ ") + "la BD rechaza adjudicar dos veces la misma sesión (clave única)")
print("\nRESULTADO:", "TODAS LAS VERIFICACIONES PASAN" if all(checks) else "HAY FALLOS")
