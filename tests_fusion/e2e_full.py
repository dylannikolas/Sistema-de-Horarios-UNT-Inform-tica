"""Prueba a escala: ciclos 2,4,6,8,10 x A/B con 22 docentes (4 Principal, 6 Asociado, 7 Auxiliar, 5 Contratado = 360 h)."""
import json, subprocess, time, urllib.request, urllib.error, os, sys
B = "http://127.0.0.1:3001/api"
SEM_NAME = os.environ.get("SEM_NAME", "E2E-FULL")
TL = int(os.environ.get("TIME_LIMIT", "200"))
AVAIL = os.environ.get("AVAIL", "full")      # full | cap18
def call(method, path, body=None):
    req = urllib.request.Request(B + path, method=method, data=json.dumps(body).encode() if body is not None else None, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r: return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b"null")
def sql(q):
    o = subprocess.run(["mysql","-uroot","--default-character-set=utf8mb4","-N","-B","sistema_horarios","-e",q],capture_output=True).stdout.decode("utf-8","replace").strip()
    return [l.split("\t") for l in o.splitlines()] if o else []
def log(*a): print(time.strftime("%H:%M:%S"), *a, flush=True)

sql(f"DELETE FROM semesters WHERE name='{SEM_NAME}'")
sql(f"INSERT INTO semesters (name,start_date,end_date,is_active) VALUES ('{SEM_NAME}','2026-08-03','2026-12-04',1)")
sem = int(sql(f"SELECT id FROM semesters WHERE name='{SEM_NAME}'")[0][0])
_, ordered = call("GET", "/teachers/ordered")
team = []
for cat, n in (("Principal",4),("Asociado",6),("Auxiliar",7),("Contratado",5)):
    team += [t for t in ordered if t["category"] == cat][:n]
log("docentes:", len(team), "| horas reglamentarias:", sum(t["required_hours"] for t in team))
days = ["Lunes","Martes","Miércoles","Jueves","Viernes"]
for t in team:
    if AVAIL == "full":
        slots = [{"day": d, "hour": f"{h:02d}:00", "is_optional": False} for d in days for h in range(7, 21)]
    else:   # cap18: lo máximo que permite la pantalla actual de SHARPEI (18 horas marcadas = 9 bloques de 2h)
        blocks = [(d, h) for d in days for h in (7, 9, 11, 13, 15, 17, 19)]
        blocks = blocks[:9]
        slots = [{"day": d, "hour": f"{h+k:02d}:00", "is_optional": False} for d, h in blocks for k in (0, 1)]
    call("POST", f"/teachers/{t['id']}/availability", {"availability": slots})
c, ini = call("POST", "/adjudicacion/iniciar", {"semester_id": sem, "cycles": [2,4,6,8,10], "teacher_ids": [t["id"] for t in team]})
assert c == 200, ini
pid = ini["process_id"]
log(f"pool: {ini['pool_sessions']} sesiones, {ini['pool_hours']}h | balance {ini['balance_hours']}h | warning={ini['warning']}")

def subset(items, target):
    best = {0: []}
    for it in sorted(items, key=lambda x: -x["hours"]):      # primero las de 4h: deja las de 2h para ajustar
        for tot, sel in list(best.items()):
            n = tot + it["hours"]
            if n <= target and n not in best: best[n] = sel + [it]
    return best.get(target)

t0 = time.time()
for i, t in enumerate(team):
    c, turno = call("GET", f"/adjudicacion/{pid}/turno-actual")
    assert c == 200 and turno["teacher"]["id"] == t["id"], (c, turno)
    free = turno["available_sessions"]; req = turno["teacher"]["required_hours"]
    pick = free if i == len(team) - 1 else subset(free, req)
    if not pick: log("✗ sin combinación exacta para", t["name"], req, "h; libres:", sum(s["hours"] for s in free)); sys.exit(2)
    pay = [{k: s[k] for k in ("course_id","section","session_type")} for s in pick]
    c, sel = call("POST", f"/adjudicacion/{pid}/seleccionar", {"teacher_id": t["id"], "sessions": pay})
    assert c == 200 and sel["exact"], (c, sel)
    c, conf = call("POST", f"/adjudicacion/{pid}/confirmar", {"teacher_id": t["id"]})
    assert c == 200, (c, conf)
log(f"adjudicación de {len(team)} docentes completa en {time.time()-t0:.1f}s")
c, res = call("GET", f"/adjudicacion/{pid}/resumen")
log("resumen: pendientes", res["pending_turns"], "| sin docente", res["unassigned_sessions"], "| todos exactos:", all(x["difference"] == 0 for x in res["teachers"]))
t1 = time.time()
c, gen = call("POST", f"/adjudicacion/{pid}/generar", {"time_limit_seconds": TL})
log(f"generar -> HTTP {c} en {time.time()-t1:.1f}s:", json.dumps(gen, ensure_ascii=False)[:600])
