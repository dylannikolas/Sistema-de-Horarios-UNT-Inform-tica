import json, urllib.request, urllib.error
def post(url, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type":"application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()
course = lambda tid: {"id":1,"name":"Estructura de datos","cycle_number":2,"section":"A","hours_theory":2,"hours_practice":0,"hours_lab":0,"has_lab":False,"theory_teacher_id":tid}
S = "http://127.0.0.1:5000/solve"
# 1. Docente sin disponibilidad registrada
c,b = post(S, {"teachers":[{"id":7,"name":"Sin Disp","category":"Auxiliar","required_hours":2,"availability":[]}],"courses":[course(7)]})
print("sin disponibilidad ->", c, json.loads(b)["detail"]["message"])
# 2. Solo UNA de las dos horas de cada bloque (08:00 sin 07:00): no debe contar como bloque de 2h
half = [{"day":"Lunes","hour":"08:00"},{"day":"Martes","hour":"10:00"}]
c,b = post(S, {"teachers":[{"id":7,"name":"Media Hora","category":"Auxiliar","required_hours":2,"availability":half}],"courses":[course(7)]})
print("media hora        ->", c, json.loads(b)["detail"]["message"])
# 3. Las dos horas del bloque sí cuentan
full = [{"day":"Lunes","hour":"07:00"},{"day":"Lunes","hour":"08:00"}]
c,b = post(S, {"teachers":[{"id":7,"name":"Bloque Ok","category":"Auxiliar","required_hours":2,"availability":full}],"courses":[course(7)]})
d = json.loads(b); s = d["sessions"][0]
print("bloque completo   ->", c, d["status"], s["day"], s["start_time"], "-", s["end_time"], "| course_db_id =", s["course_db_id"], "teacher_db_id =", s["teacher_db_id"])
# 4. Excel con los datos reales guardados
rows = json.loads(__import__("subprocess").run(["mysql","-uroot","-N","-B","sistema_horarios","-e","SELECT sessions_json FROM solver_results ORDER BY id DESC LIMIT 1"],capture_output=True).stdout.decode("utf-8","replace").strip().encode().decode("unicode_escape").encode("latin1").decode("utf-8") or "[]")
c,b = post("http://127.0.0.1:5000/export-excel", {"version_id":"E2E","sessions":rows})
open("/tmp/e2e_export.xlsx","wb").write(b); print("export-excel      ->", c, len(b), "bytes,", len(rows), "sesiones")
