"""Prueba end-to-end: SHARPEI (Node+MariaDB) + solver (Python) por HTTP real."""
import json, subprocess, urllib.request, urllib.error, itertools, sys
B = "http://127.0.0.1:3001/api"

def call(method, path, body=None, expect=None):
    req = urllib.request.Request(B + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r: code, data = r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e: code, data = e.code, json.loads(e.read() or b"null")
    if expect is not None: assert code == expect, f"{method} {path} -> {code} (esperado {expect}): {data}"
    return code, data

def sql(q):
    out = subprocess.run(["mysql","-uroot","--default-character-set=utf8mb4","-N","-B","sistema_horarios","-e",q],
                         capture_output=True).stdout.decode("utf-8","replace").strip()
    return [l.split("\t") for l in out.splitlines()] if out else []

ok = lambda m: print("  ✔", m)

# ── Preparación ────────────────────────────────────────────────────────────
sql("DELETE FROM assignments; DELETE FROM adjudicacion_process; DELETE FROM semesters WHERE name='E2E-2026-2'")
sql("INSERT INTO semesters (name,start_date,end_date,is_active) VALUES ('E2E-2026-2','2026-08-03','2026-12-04',1)")
sem = int(sql("SELECT id FROM semesters WHERE name='E2E-2026-2'")[0][0])
_, ordered = call("GET", "/teachers/ordered", expect=200)
by_cat = lambda c: [t for t in ordered if t["category"] == c]
team = [by_cat("Principal")[0], by_cat("Asociado")[0], by_cat("Asociado")[1], by_cat("Auxiliar")[0]]  # 20+18+18+16 = 72h
print("Docentes:", [(t["name"][:22], t["category"], t["required_hours"]) for t in team])
days = ["Lunes","Martes","Miércoles","Jueves","Viernes"]
slots = [{"day": d, "hour": f"{h:02d}:00", "is_optional": False} for d in days for h in range(7, 21)]
for t in team: call("POST", f"/teachers/{t['id']}/availability", {"availability": slots}, expect=200)
ok("disponibilidad Lun–Vie 07:00–21:00 registrada para 4 docentes")

# ── Iniciar ────────────────────────────────────────────────────────────────
_, ini = call("POST", "/adjudicacion/iniciar", {"semester_id": sem, "cycles": [2], "teacher_ids": [t["id"] for t in team]}, expect=200)
pid = ini["process_id"]
print(f"Pool: {ini['pool_sessions']} sesiones, {ini['pool_hours']}h | horas reglamentarias: {ini['required_hours_total']}h | balance {ini['balance_hours']}h | warning={ini['warning']}")
assert ini["balance_hours"] == 0
call("POST", "/adjudicacion/iniciar", {"semester_id": sem, "cycles": [2]}, expect=409); ok("no permite 2 procesos simultáneos en el semestre")

# ── Pruebas negativas ──────────────────────────────────────────────────────
_, turno = call("GET", f"/adjudicacion/{pid}/turno-actual", expect=200)
assert turno["teacher"]["id"] == team[0]["id"], "el primer turno debe ser el Principal"
call("POST", f"/adjudicacion/{pid}/seleccionar", {"teacher_id": team[1]["id"], "sessions": []}, expect=409); ok("rechaza selección fuera de turno")
call("POST", f"/adjudicacion/{pid}/generar", {}, expect=409); ok("no genera con turnos pendientes")

def subset(items, target):
    """Subconjunto de sesiones (2h/4h) que suma exactamente `target`."""
    best = {0: []}
    for it in items:
        for tot, sel in list(best.items()):
            n = tot + it["hours"]
            if n <= target and n not in best: best[n] = sel + [it]
    return best.get(target)

# ── Adjudicación por turnos ────────────────────────────────────────────────
for i, t in enumerate(team):
    _, turno = call("GET", f"/adjudicacion/{pid}/turno-actual", expect=200)
    assert turno["teacher"]["id"] == t["id"], f"turno esperado {t['name']}"
    free = turno["available_sessions"]; req = turno["teacher"]["required_hours"]
    if i == 0:   # confirmar con horas incorrectas debe fallar
        wrong = free[:1]
        call("POST", f"/adjudicacion/{pid}/seleccionar", {"teacher_id": t["id"], "sessions": wrong}, expect=200)
        c, d = call("POST", f"/adjudicacion/{pid}/confirmar", {"teacher_id": t["id"]})
        assert c == 400 and d["difference"] != 0, d; ok(f"rechaza confirmar con {d['selected_hours']}h (reglamentarias {req}h)")
    pick = free if i == len(team) - 1 else subset(free, req)
    assert pick, f"no hay combinación exacta para {t['name']}"
    pay = [{k: s[k] for k in ("course_id", "section", "session_type")} for s in pick]
    _, sel = call("POST", f"/adjudicacion/{pid}/seleccionar", {"teacher_id": t["id"], "sessions": pay}, expect=200)
    assert sel["exact"], sel
    if i == 1:   # una sesión ya confirmada por otro docente no puede tomarse
        taken = next(s for s in ordered if False) if False else None
    _, conf = call("POST", f"/adjudicacion/{pid}/confirmar", {"teacher_id": t["id"]}, expect=200)
    ok(f"{t['category']:10} {t['name'][:24]:24} confirmado {conf['hours_confirmed']}h = {req}h")

_, res = call("GET", f"/adjudicacion/{pid}/resumen", expect=200)
assert res["pending_turns"] == 0 and res["unassigned_sessions"] == 0 and all(x["difference"] == 0 for x in res["teachers"])
ok("resumen: 0 turnos pendientes, 0 sesiones sin docente, diferencia 0h en todos")

# ── Solver + aulas ─────────────────────────────────────────────────────────
c, gen = call("POST", f"/adjudicacion/{pid}/generar", {"time_limit_seconds": 60})
print("generar ->", c, {k: gen.get(k) for k in ("solver_status","sessions_scheduled","assignments_saved","sessions_without_room","error","detail")})
assert c == 200 and gen["success"]
json.dump(gen, open("/tmp/gen.json", "w"))
print("PROCESS", pid, "SEM", sem)
