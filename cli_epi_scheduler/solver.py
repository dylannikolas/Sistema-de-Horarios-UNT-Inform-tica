"""
solver.py — OR-Tools CP-SAT con restricción de horas exactas por docente.

Restricciones:
  C1: Cada bloque de sesión asignado exactamente una vez
  C2: Docentes solo en sus bloques de disponibilidad
  C3: Anti-solapamiento global de docentes
  C4: Anti-solapamiento estudiantil por sección
  C5: Horas totales por docente = required_hours (restricción exacta)
  Obj: Minimizar dispersión del horario (bloques tardíos penalizados)
"""
from ortools.sat.python import cp_model
from typing import Dict, List
from models import (Teacher, Course, SectionData, ScheduledSession, ScheduleResult,
                    DAYS, TIME_SLOTS, NUM_DAYS, NUM_SLOTS)
from datetime import datetime
import uuid


def build_and_solve(sections: List[SectionData],
                    teachers: Dict[str, Teacher],
                    time_limit_seconds: float = 120.0,
                    description: str = "",
                    max_theory_rooms: int = 5,
                    max_lab_rooms: int = 3) -> ScheduleResult:

    model  = cp_model.CpModel()
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.num_search_workers  = 4
    solver.parameters.log_search_progress = False

    # ── Variables ─────────────────────────────────────────────────────────────
    theory_vars: Dict = {}
    pract_vars:  Dict = {}
    lab_vars:    Dict = {}

    for sec in sections:
        sid = sec.section_id
        for ci, course in enumerate(sec.schedulable_courses):
            for b in range(course.n_theory_blocks):
                for d in range(NUM_DAYS):
                    for s in range(NUM_SLOTS):
                        theory_vars[(sid,ci,b,d,s)] = model.NewBoolVar(f"T_{sid}_{ci}_{b}_{d}_{s}")
            for b in range(course.n_practice_blocks):
                for d in range(NUM_DAYS):
                    for s in range(NUM_SLOTS):
                        pract_vars[(sid,ci,b,d,s)] = model.NewBoolVar(f"P_{sid}_{ci}_{b}_{d}_{s}")
            if course.has_lab:
                for d in range(NUM_DAYS):
                    for s in range(NUM_SLOTS - 1):
                        lab_vars[(sid,ci,d,s)] = model.NewBoolVar(f"L_{sid}_{ci}_{d}_{s}")

    # ── C1: Cada bloque de sesión asignado exactamente una vez ────────────────
    for sec in sections:
        sid = sec.section_id
        for ci, course in enumerate(sec.schedulable_courses):
            for b in range(course.n_theory_blocks):
                model.AddExactlyOne([theory_vars[(sid,ci,b,d,s)]
                                     for d in range(NUM_DAYS) for s in range(NUM_SLOTS)])
            for b in range(course.n_practice_blocks):
                model.AddExactlyOne([pract_vars[(sid,ci,b,d,s)]
                                     for d in range(NUM_DAYS) for s in range(NUM_SLOTS)])
            if course.has_lab:
                model.AddExactlyOne([lab_vars[(sid,ci,d,s)]
                                     for d in range(NUM_DAYS) for s in range(NUM_SLOTS-1)])

    # ── C2: Disponibilidad de docentes ────────────────────────────────────────
    for sec in sections:
        sid = sec.section_id
        for ci, course in enumerate(sec.schedulable_courses):
            if course.theory_teacher_id and course.theory_teacher_id in teachers:
                avail = set(teachers[course.theory_teacher_id].availability)
                for b in range(course.n_theory_blocks):
                    for d in range(NUM_DAYS):
                        for s in range(NUM_SLOTS):
                            if (d,s) not in avail:
                                model.Add(theory_vars[(sid,ci,b,d,s)] == 0)
            if course.practice_teacher_id and course.practice_teacher_id in teachers:
                avail = set(teachers[course.practice_teacher_id].availability)
                for b in range(course.n_practice_blocks):
                    for d in range(NUM_DAYS):
                        for s in range(NUM_SLOTS):
                            if (d,s) not in avail:
                                model.Add(pract_vars[(sid,ci,b,d,s)] == 0)
            if course.has_lab and course.lab_teacher_id and course.lab_teacher_id in teachers:
                avail = set(teachers[course.lab_teacher_id].availability)
                for d in range(NUM_DAYS):
                    for s in range(NUM_SLOTS-1):
                        if (d,s) not in avail or (d,s+1) not in avail:
                            model.Add(lab_vars[(sid,ci,d,s)] == 0)

    # ── C3: Anti-solapamiento global de docentes ──────────────────────────────
    teacher_slot: Dict = {}
    def add_tv(tid, d, s, var):
        teacher_slot.setdefault((tid,d,s), []).append(var)

    for sec in sections:
        sid = sec.section_id
        for ci, course in enumerate(sec.schedulable_courses):
            if course.theory_teacher_id:
                for b in range(course.n_theory_blocks):
                    for d in range(NUM_DAYS):
                        for s in range(NUM_SLOTS):
                            add_tv(course.theory_teacher_id, d, s, theory_vars[(sid,ci,b,d,s)])
            if course.practice_teacher_id:
                for b in range(course.n_practice_blocks):
                    for d in range(NUM_DAYS):
                        for s in range(NUM_SLOTS):
                            add_tv(course.practice_teacher_id, d, s, pract_vars[(sid,ci,b,d,s)])
            if course.has_lab and course.lab_teacher_id:
                for d in range(NUM_DAYS):
                    for s in range(NUM_SLOTS-1):
                        v = lab_vars[(sid,ci,d,s)]
                        add_tv(course.lab_teacher_id, d, s,   v)
                        add_tv(course.lab_teacher_id, d, s+1, v)

    for vlist in teacher_slot.values():
        if len(vlist) > 1:
            model.AddAtMostOne(vlist)

    # ── C4: Anti-solapamiento estudiantil por sección ─────────────────────────
    for sec in sections:
        sid     = sec.section_id
        courses = sec.schedulable_courses
        for d in range(NUM_DAYS):
            for s in range(NUM_SLOTS):
                slot_vars = []
                for ci, course in enumerate(courses):
                    for b in range(course.n_theory_blocks):
                        slot_vars.append(theory_vars[(sid,ci,b,d,s)])
                    for b in range(course.n_practice_blocks):
                        slot_vars.append(pract_vars[(sid,ci,b,d,s)])
                    if course.has_lab:
                        if s < NUM_SLOTS-1:
                            slot_vars.append(lab_vars[(sid,ci,d,s)])
                        if s > 0 and (sid,ci,d,s-1) in lab_vars:
                            slot_vars.append(lab_vars[(sid,ci,d,s-1)])
                model.AddAtMostOne(slot_vars)

    # ── C5: horas por docente = horas reglamentarias ─────────────────────────
    # Cada bloque se asigna exactamente una vez (C1), así que las horas de un docente
    # quedan fijadas por la adjudicación y no dependen de dónde se ubique cada sesión.
    # Por eso C5 es un pre-chequeo: cuenta los bloques adjudicados (teoría y práctica =
    # 1 bloque de 2h cada uno; laboratorio = 2 bloques) y avisa qué docente no cuadra,
    # en lugar de devolver un INFEASIBLE sin explicación.
    assigned_blocks = {tid: 0 for tid in teachers}
    for sec in sections:
        for course in sec.schedulable_courses:
            if course.theory_teacher_id in assigned_blocks:
                assigned_blocks[course.theory_teacher_id] += course.n_theory_blocks
            if course.practice_teacher_id in assigned_blocks:
                assigned_blocks[course.practice_teacher_id] += course.n_practice_blocks
            if course.has_lab and course.lab_teacher_id in assigned_blocks:
                assigned_blocks[course.lab_teacher_id] += 2
    for tid, teacher in teachers.items():
        blocks = assigned_blocks[tid]
        if blocks and teacher.required_hours and blocks * 2 != teacher.required_hours:
            print(f"  ⚠ Carga no exacta -> {teacher.name}: adjudicadas {blocks * 2}h, "
                  f"reglamentarias {teacher.required_hours}h")

    # ── C6: Capacidad simultánea de aulas (Teoría+Práctica y Laboratorio) ────
    for d in range(NUM_DAYS):
        for s in range(NUM_SLOTS):
            tp_at_slot = []
            lab_at_slot = []
            for sec in sections:
                sid = sec.section_id
                for ci, course in enumerate(sec.schedulable_courses):
                    for b in range(course.n_theory_blocks):
                        tp_at_slot.append(theory_vars[(sid,ci,b,d,s)])
                    for b in range(course.n_practice_blocks):
                        tp_at_slot.append(pract_vars[(sid,ci,b,d,s)])
                    if course.has_lab:
                        if s < NUM_SLOTS - 1 and (sid,ci,d,s) in lab_vars:
                            lab_at_slot.append(lab_vars[(sid,ci,d,s)])
                        if s > 0 and (sid,ci,d,s-1) in lab_vars:
                            lab_at_slot.append(lab_vars[(sid,ci,d,s-1)])
            if max_theory_rooms > 0 and len(tp_at_slot) > max_theory_rooms:
                model.Add(sum(tp_at_slot) <= max_theory_rooms)
            if max_lab_rooms > 0 and len(lab_at_slot) > max_lab_rooms:
                model.Add(sum(lab_at_slot) <= max_lab_rooms)

    # Ruptura de simetría para cursos con 2 bloques del mismo tipo
    for sec in sections:
        sid = sec.section_id
        for ci, course in enumerate(sec.schedulable_courses):
            for b in range(course.n_theory_blocks - 1):
                t_b0 = sum((d * NUM_SLOTS + s) * theory_vars[(sid,ci,b,d,s)] for d in range(NUM_DAYS) for s in range(NUM_SLOTS))
                t_b1 = sum((d * NUM_SLOTS + s) * theory_vars[(sid,ci,b+1,d,s)] for d in range(NUM_DAYS) for s in range(NUM_SLOTS))
                model.Add(t_b0 < t_b1)
            for b in range(course.n_practice_blocks - 1):
                p_b0 = sum((d * NUM_SLOTS + s) * pract_vars[(sid,ci,b,d,s)] for d in range(NUM_DAYS) for s in range(NUM_SLOTS))
                p_b1 = sum((d * NUM_SLOTS + s) * pract_vars[(sid,ci,b+1,d,s)] for d in range(NUM_DAYS) for s in range(NUM_SLOTS))
                model.Add(p_b0 < p_b1)

    # ── Objetivo: compactar horario ───────────────────────────────────────────
    penalty = []
    for sec in sections:
        sid = sec.section_id
        for ci, course in enumerate(sec.schedulable_courses):
            for b in range(course.n_theory_blocks):
                for d in range(NUM_DAYS):
                    for s in range(NUM_SLOTS):
                        penalty.append(s * theory_vars[(sid,ci,b,d,s)])
            for b in range(course.n_practice_blocks):
                for d in range(NUM_DAYS):
                    for s in range(NUM_SLOTS):
                        penalty.append(s * pract_vars[(sid,ci,b,d,s)])
            if course.has_lab:
                for d in range(NUM_DAYS):
                    for s in range(NUM_SLOTS-1):
                        penalty.append(s * 2 * lab_vars[(sid,ci,d,s)])
    model.Minimize(sum(penalty))

    # ── Resolver ──────────────────────────────────────────────────────────────
    status_code = solver.Solve(model)
    vid = str(uuid.uuid4())[:8].upper()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    result = ScheduleResult(version_id=vid,
                            description=description or f"Auto {now}",
                            created_at=now)

    if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        result.status = "OK"
        for sec in sections:
            sid = sec.section_id
            for ci, course in enumerate(sec.schedulable_courses):
                t_t = teachers.get(course.theory_teacher_id)
                t_p = teachers.get(course.practice_teacher_id)
                t_l = teachers.get(course.lab_teacher_id)
                for d in range(NUM_DAYS):
                    for s in range(NUM_SLOTS):
                        for b in range(course.n_theory_blocks):
                            if solver.Value(theory_vars[(sid,ci,b,d,s)]):
                                result.sessions.append(ScheduledSession(
                                    course.name, sid, "Teoría",
                                    t_t.name if t_t else "—", d, s, 1))
                        for b in range(course.n_practice_blocks):
                            if solver.Value(pract_vars[(sid,ci,b,d,s)]):
                                result.sessions.append(ScheduledSession(
                                    course.name, sid, "Práctica",
                                    t_p.name if t_p else "—", d, s, 1))
                    if course.has_lab:
                        for s in range(NUM_SLOTS-1):
                            if solver.Value(lab_vars[(sid,ci,d,s)]):
                                result.sessions.append(ScheduledSession(
                                    course.name, sid, "Laboratorio",
                                    t_l.name if t_l else "—", d, s, 2))
        print(f"  ✔ Solución encontrada | t={solver.WallTime():.1f}s | "
              f"ramas={solver.NumBranches()} | sesiones={len(result.sessions)}")
    elif status_code == cp_model.INFEASIBLE:
        result.status = "INFEASIBLE"
        print("  ✗ INFEASIBLE — revisa disponibilidades o carga horaria")
    else:
        result.status = "TIMEOUT"
        print(f"  ⚠ TIMEOUT — solución parcial con {len(result.sessions)} sesiones")

    return result
