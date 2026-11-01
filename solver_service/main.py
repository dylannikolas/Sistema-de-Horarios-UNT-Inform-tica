"""
Microservicio del solver EPI (FastAPI + OR-Tools CP-SAT) para SHARPEI.
Ejecutar:  uvicorn main:app --host 0.0.0.0 --port 5000
"""
import os, sys
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "epi"))
from models import (CATEGORY_REQUIRED_HOURS, DAYS, MALLA_REAL, NUM_SLOTS, TIME_SLOTS, Course,  # noqa: E402
                    ScheduledSession, ScheduleResult, SectionData, Teacher)
from solver import build_and_solve  # noqa: E402
from excel_export import export_to_excel  # noqa: E402

app = FastAPI(title="EPI Scheduler Solver", version="2.1.0")
DAY_IDX = {d: i for i, d in enumerate(DAYS)}
# Bloque s = horas 07+2s y 08+2s (07-09, 09-11, ..., 19-21). SHARPEI guarda disponibilidad por hora.
BLOCK_HOURS = {s: {f"{7 + 2 * s:02d}:00", f"{8 + 2 * s:02d}:00"} for s in range(NUM_SLOTS)}


class AvailSlot(BaseModel):
    day: str
    hour: str
    is_optional: bool = False


class TeacherIn(BaseModel):
    id: int
    name: str
    category: str = "Contratado"
    orden: int = 999
    required_hours: int = 0
    availability: List[AvailSlot] = []


class CourseIn(BaseModel):
    id: int
    name: str
    cycle_number: int
    section: str
    hours_theory: int = 0
    hours_practice: int = 0
    hours_lab: int = 0
    has_lab: bool = False
    course_tipo: str = "ES"
    theory_teacher_id: Optional[int] = None
    practice_teacher_id: Optional[int] = None
    lab_teacher_id: Optional[int] = None


class SolveRequest(BaseModel):
    semester_id: int = 0
    description: str = "Horario EPI"
    time_limit_seconds: float = 120.0
    teachers: List[TeacherIn]
    courses: List[CourseIn]


def _blocks(avail: List[AvailSlot]) -> set:
    """Un bloque de 2h está disponible solo si el docente marcó AMBAS horas (obligatorias u opcionales)."""
    marked: Dict[tuple, set] = {}
    for a in avail:
        if a.day in DAY_IDX:
            marked.setdefault(DAY_IDX[a.day], set()).add(a.hour[:5])
    return {(d, s) for d, hours in marked.items() for s, need in BLOCK_HOURS.items() if need <= hours}


@app.get("/health")
def health():
    return {"status": "ok", "solver": "OR-Tools CP-SAT", "version": app.version}


@app.get("/malla/{cycle}")
def malla(cycle: int):
    if cycle not in MALLA_REAL:
        raise HTTPException(404, f"Ciclo {cycle} no encontrado")
    return [{"codigo": c, "nombre": n, "tipo": t, "ht": ht, "hp": hp, "hl": hl, "creditos": cr, "lab": lab}
            for c, n, t, ht, hp, hl, cr, lab in MALLA_REAL[cycle]]


@app.get("/category-hours")
def category_hours():
    return CATEGORY_REQUIRED_HOURS


@app.post("/solve")
def solve(req: SolveRequest):
    if not req.courses:
        raise HTTPException(400, "Se requieren cursos")

    # Nombres únicos (el solver identifica al docente por nombre en su salida)
    counts: Dict[str, int] = {}
    for t in req.teachers:
        counts[t.name] = counts.get(t.name, 0) + 1
    epi_teachers: Dict[str, Teacher] = {}
    tid_by_name: Dict[str, int] = {}
    key_by_id: Dict[int, str] = {}
    for t in req.teachers:
        display = t.name if counts[t.name] == 1 else f"{t.name} ({t.id})"
        key = f"T{t.id}"
        key_by_id[t.id] = key
        tid_by_name[display] = t.id
        epi_teachers[key] = Teacher(
            teacher_id=key, name=display, category=t.category, orden=t.orden,
            availability=sorted(_blocks(t.availability)),
            required_hours=t.required_hours or CATEGORY_REQUIRED_HOURS.get(t.category, 12))

    # Secciones
    groups: Dict[tuple, List[CourseIn]] = {}
    for c in req.courses:
        groups.setdefault((c.cycle_number, c.section), []).append(c)
    course_db_id: Dict[tuple, int] = {}
    sections: List[SectionData] = []
    need_blocks: Dict[int, int] = {}
    for (cycle, sec), clist in sorted(groups.items()):
        epi_courses = []
        for c in clist:
            ntb, npb = (c.hours_theory + 1) // 2, (c.hours_practice + 1) // 2
            for tid, n in ((c.theory_teacher_id, ntb), (c.practice_teacher_id, npb), (c.lab_teacher_id, 2 if c.has_lab else 0)):
                if tid is not None and tid not in key_by_id:
                    raise HTTPException(422, f"El docente {tid} del curso '{c.name}' no viene en la lista de docentes")
                if tid is not None:
                    need_blocks[tid] = need_blocks.get(tid, 0) + n
            course_db_id[(f"{cycle}{sec}", c.name)] = c.id
            epi_courses.append(Course(
                course_id=f"{c.id}_{sec}", name=c.name, cycle=cycle, tipo=c.course_tipo,
                hours_theory=c.hours_theory, hours_practice=c.hours_practice, hours_lab=c.hours_lab,
                n_theory_blocks=ntb, n_practice_blocks=npb, has_lab=c.has_lab, requires_scheduling=True,
                theory_teacher_id=key_by_id.get(c.theory_teacher_id) if c.theory_teacher_id is not None else None,
                practice_teacher_id=key_by_id.get(c.practice_teacher_id) if c.practice_teacher_id is not None else None,
                lab_teacher_id=key_by_id.get(c.lab_teacher_id) if c.lab_teacher_id is not None else None))
        sections.append(SectionData(cycle=cycle, section=sec, academic_period="par" if cycle % 2 == 0 else "impar",
                                    courses=epi_courses))

    # Pre-chequeos con mensajes claros (en vez de un INFEASIBLE opaco)
    problems = []
    for t in req.teachers:
        n = need_blocks.get(t.id, 0)
        have = len(epi_teachers[key_by_id[t.id]].availability)
        if n and have == 0 and not t.availability:
            problems.append(f"{t.name}: no tiene disponibilidad registrada (necesita {n * 2}h)")
        elif n and have == 0:
            problems.append(f"{t.name}: tiene horas sueltas pero ningún bloque completo de 2h "
                            f"(07-09, 09-11, 11-13, ...); necesita {n} bloques")
        elif n and have < n:
            problems.append(f"{t.name}: tiene {have} bloques de 2h disponibles y necesita {n}")
    if problems:
        raise HTTPException(422, {"status": "SIN_DISPONIBILIDAD", "message": "; ".join(problems)})

    result = build_and_solve(sections=sections, teachers=epi_teachers,
                             time_limit_seconds=req.time_limit_seconds, description=req.description)
    if result.status == "INFEASIBLE":
        raise HTTPException(422, {"status": "INFEASIBLE",
                                  "message": "No existe horario que cumpla disponibilidad, sin cruces de docente ni de sección"})
    if not result.sessions:
        raise HTTPException(504, {"status": result.status, "message": "El solver no encontró solución en el tiempo límite"})

    out = []
    for s in result.sessions:
        last = s.slot_idx + s.duration_slots - 1
        out.append({
            "section_id": s.section_id, "section": s.section_id[-1],
            "course_name": s.course_name, "course_db_id": course_db_id.get((s.section_id, s.course_name)),
            "session_type": s.session_type, "teacher_name": s.teacher_name,
            "teacher_db_id": tid_by_name.get(s.teacher_name), "day": DAYS[s.day_idx],
            "start_time": TIME_SLOTS[s.slot_idx].split("-")[0] + ":00",
            "end_time": TIME_SLOTS[last].split("-")[1] + ":00",
            "duration_hours": s.duration_slots * 2})
    return {"status": result.status, "version_id": result.version_id, "created_at": result.created_at,
            "total_sessions": len(out), "sessions": out}


@app.post("/export-excel")
def export_excel(data: Dict[str, Any]):
    """Recibe `sessions` en el formato de /solve y devuelve el Excel por ciclo/sección."""
    try:
        sessions = []
        for s in data.get("sessions", []):
            start = next(i for i, t in enumerate(TIME_SLOTS) if t.startswith(s["start_time"][:5]))
            dur = max(1, int(s.get("duration_hours", 2)) // 2)
            sessions.append(ScheduledSession(course_name=s["course_name"], section_id=s["section_id"],
                                             session_type=s["session_type"], teacher_name=s.get("teacher_name", "—"),
                                             day_idx=DAY_IDX[s["day"]], slot_idx=start, duration_slots=dur))
        res = ScheduleResult(version_id=data.get("version_id", "EXPORT"), description="SHARPEI",
                             created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), sessions=sessions, status="OK")
        path = f"/tmp/Horario_{res.version_id}.xlsx"
        export_to_excel(res, path)
        return FileResponse(path, filename=os.path.basename(path),
                            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    except (KeyError, StopIteration, ValueError) as e:
        raise HTTPException(400, f"Formato de sesión inválido: {e}")
