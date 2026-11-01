"""version_manager.py — Guardado y carga de versiones de horarios en JSON."""
import json, os
from models import Teacher, Course, SectionData, ScheduleResult, ScheduledSession

VERSIONS_DIR = os.path.join(os.path.dirname(__file__), "versions")

def _ensure(): os.makedirs(VERSIONS_DIR, exist_ok=True)
def _path(vid): return os.path.join(VERSIONS_DIR, f"{vid}.json")

def _s2d(s):
    return {k: getattr(s, k) for k in
            ["course_name","section_id","session_type","teacher_name",
             "day_idx","slot_idx","duration_slots","course_type"]}

def _d2s(d): return ScheduledSession(**d)

def _r2d(r):
    return {"version_id":r.version_id, "description":r.description,
            "created_at":r.created_at, "status":r.status,
            "academic_period":r.academic_period,
            "sessions":[_s2d(s) for s in r.sessions]}

def _d2r(d):
    return ScheduleResult(
        version_id=d["version_id"], description=d["description"],
        created_at=d["created_at"], status=d["status"],
        academic_period=d.get("academic_period","par"),
        sessions=[_d2s(s) for s in d.get("sessions",[])])

def save_version(result, teachers, sections):
    _ensure()
    payload = {
        "meta": {"version_id":result.version_id, "description":result.description,
                 "created_at":result.created_at, "status":result.status,
                 "academic_period":result.academic_period},
        "teachers": {tid: t.to_dict() for tid, t in teachers.items()},
        "sections": [s.to_dict() for s in sections],
        "result":   _r2d(result),
    }
    with open(_path(result.version_id), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return result.version_id

def load_version(vid):
    p = _path(vid)
    if not os.path.exists(p):
        raise FileNotFoundError(f"No existe la versión '{vid}'")
    with open(p, "r", encoding="utf-8") as f:
        payload = json.load(f)
    teachers = {tid: Teacher.from_dict(d) for tid, d in payload["teachers"].items()}
    sections  = [SectionData.from_dict(s) for s in payload["sections"]]
    return _d2r(payload["result"]), teachers, sections

def list_versions():
    _ensure()
    vers = []
    for fname in sorted(os.listdir(VERSIONS_DIR)):
        if not fname.endswith(".json"): continue
        try:
            with open(os.path.join(VERSIONS_DIR, fname), "r", encoding="utf-8") as f:
                vers.append(json.load(f)["meta"])
        except: pass
    return vers

def delete_version(vid):
    p = _path(vid)
    if os.path.exists(p): os.remove(p); return True
    return False

def update_description(vid, desc):
    p = _path(vid)
    if not os.path.exists(p): return False
    with open(p, "r", encoding="utf-8") as f: payload = json.load(f)
    payload["meta"]["description"] = desc
    payload["result"]["description"] = desc
    with open(p, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return True
