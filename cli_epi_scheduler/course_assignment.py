"""
course_assignment.py — Proceso de adjudicación de carga horaria por orden de categoría.

Reglas de negocio implementadas:
  1. Orden de prelación: Principal → Asociado → Auxiliar → Contratado
  2. Dentro de cada categoría los docentes eligen según su número de orden (1, 2, 3…)
  3. Cada docente debe cubrir EXACTAMENTE sus horas reglamentarias (ni más ni menos)
  4. Una sesión (T/P/Lab) adjudicada a un docente queda bloqueada para los demás
  5. El proceso es secuencial: el docente N no puede empezar hasta que N-1 confirme
"""
from typing import List, Dict, Optional, Tuple
from rich.console import Console
from rich.table   import Table
from rich.panel   import Panel
from rich.prompt  import Prompt, Confirm
from rich         import box

from models import (
    Teacher, Course, SectionData, CourseSession,
    CATEGORY_REQUIRED_HOURS, CATEGORY_SELECTION_ORDER,
    MALLA_REAL,
)

console = Console()


# ── Pool de sesiones disponibles ──────────────────────────────────────────────

class CoursePool:
    """
    Registro de todas las sesiones disponibles en el período.
    Una sesión = (ciclo, sección, curso, tipo_sesión).
    Se marca como ocupada cuando un docente la adjudica.
    """

    def __init__(self, sections: List[SectionData]):
        self.sessions: List[CourseSession] = []
        self._build(sections)

    def _build(self, sections: List[SectionData]):
        for sec in sections:
            for course in sec.schedulable_courses:
                ciclo  = course.cycle
                sect   = sec.section
                cid    = course.course_id
                nom    = course.name

                # Sesión de Teoría
                if course.n_theory_blocks > 0:
                    for b in range(course.n_theory_blocks):
                        suffix = f" (bloque {b+1})" if course.n_theory_blocks > 1 else ""
                        self.sessions.append(CourseSession(
                            course_id=cid, course_name=nom,
                            cycle=ciclo, section=sect,
                            session_type=f"Teoría{suffix}",
                            hours=2,
                        ))

                # Sesión de Práctica
                if course.n_practice_blocks > 0:
                    for b in range(course.n_practice_blocks):
                        suffix = f" (bloque {b+1})" if course.n_practice_blocks > 1 else ""
                        self.sessions.append(CourseSession(
                            course_id=cid, course_name=nom,
                            cycle=ciclo, section=sect,
                            session_type=f"Práctica{suffix}",
                            hours=2,
                        ))

                # Sesión de Laboratorio (4h)
                if course.has_lab:
                    self.sessions.append(CourseSession(
                        course_id=cid, course_name=nom,
                        cycle=ciclo, section=sect,
                        session_type="Laboratorio",
                        hours=4,
                    ))

    def available(self, role: str = "ambos") -> List[CourseSession]:
        """Devuelve sesiones sin docente, filtradas por rol."""
        result = []
        for s in self.sessions:
            if s.teacher_id is not None:
                continue
            is_lab = s.session_type == "Laboratorio"
            if role == "laboratorio" and not is_lab:
                continue
            if role == "teoria_practica" and is_lab:
                continue
            result.append(s)
        return result

    def assign(self, session: CourseSession, teacher_id: str):
        session.teacher_id = teacher_id

    def release(self, session: CourseSession):
        session.teacher_id = None

    def total_hours_available(self, role: str = "ambos") -> int:
        return sum(s.hours for s in self.available(role))

    def summary_table(self, role: str = "ambos") -> Table:
        avail = self.available(role)
        tbl = Table(box=box.SIMPLE, show_header=True, header_style="bold cyan",
                    title=f"Sesiones disponibles ({len(avail)} | "
                          f"{sum(s.hours for s in avail)}h totales)")
        tbl.add_column("#",   width=4,  style="yellow")
        tbl.add_column("Ciclo/Sec", width=10)
        tbl.add_column("Curso", width=38)
        tbl.add_column("Tipo", width=14)
        tbl.add_column("Horas", width=7, justify="right")
        for i, s in enumerate(avail, 1):
            tbl.add_row(str(i), f"{s.cycle}°{s.section}", s.course_name,
                        s.session_type, f"{s.hours}h")
        return tbl


# ── Validación de carga horaria ───────────────────────────────────────────────

def validate_selection(teacher: Teacher,
                       selected: List[CourseSession]) -> Tuple[bool, str]:
    """
    Valida que las sesiones seleccionadas cubran EXACTAMENTE
    las horas reglamentarias del docente.
    Retorna (ok, mensaje).
    """
    total = sum(s.hours for s in selected)
    req   = teacher.required_hours

    if total == req:
        return True, f"✔ Carga exacta: {total}h = {req}h reglamentarias."

    if total < req:
        diff = req - total
        return False, (f"✗ Faltan {diff}h para completar las {req}h reglamentarias. "
                       f"Llevas {total}h seleccionadas.")

    diff = total - req
    return False, (f"✗ Excedes por {diff}h las {req}h reglamentarias. "
                   f"Llevas {total}h seleccionadas.")


# ── Proceso de selección interactiva ─────────────────────────────────────────

def run_adjudicacion(teachers: Dict[str, Teacher],
                     sections: List[SectionData]) -> Dict[str, Teacher]:
    """
    Ejecuta el proceso completo de adjudicación por orden de categoría.

    Retorna el diccionario de docentes con teacher_id actualizado en las
    sesiones del CoursePool (accesible a través de las secciones modificadas).
    """
    pool = CoursePool(sections)

    # Ordenar docentes: primero por categoría (según CATEGORY_SELECTION_ORDER)
    # luego por orden dentro de la categoría
    category_rank = {cat: i for i, cat in enumerate(CATEGORY_SELECTION_ORDER)}
    ordered = sorted(
        teachers.values(),
        key=lambda t: (category_rank.get(t.category, 99), t.orden)
    )

    console.print(Panel(
        "[bold]PROCESO DE ADJUDICACIÓN DE CARGA HORARIA[/bold]\n"
        "[dim]Orden: Principal → Asociado → Auxiliar → Contratado\n"
        "Cada docente debe cubrir exactamente sus horas reglamentarias.[/dim]",
        style="blue"))

    # Mostrar lista de turno
    turn_tbl = Table(box=box.SIMPLE, title="Lista de adjudicación", header_style="bold")
    turn_tbl.add_column("Turno", width=7, style="yellow")
    turn_tbl.add_column("Docente", width=32)
    turn_tbl.add_column("Categoría", width=14)
    turn_tbl.add_column("Orden", width=7)
    turn_tbl.add_column("Horas regl.", width=12)
    turn_tbl.add_column("Estado", width=12)
    for i, t in enumerate(ordered, 1):
        turn_tbl.add_row(str(i), t.name, t.category, str(t.orden),
                         f"{t.required_hours}h", "⬜ Pendiente")
    console.print(turn_tbl)

    # Adjudicación secuencial
    teacher_selections: Dict[str, List[CourseSession]] = {}

    for turn_num, teacher in enumerate(ordered, 1):
        _adjudicate_teacher(turn_num, len(ordered), teacher, pool, teacher_selections)
        # Actualizar horas asignadas
        teacher.assigned_hours = sum(s.hours for s in teacher_selections.get(teacher.teacher_id, []))

    # Aplicar asignaciones al pool y retornar
    _apply_assignments_to_sections(teacher_selections, sections)

    # Resumen final
    _print_summary(ordered, teacher_selections)

    return teachers


def _adjudicate_teacher(turn: int, total: int,
                         teacher: Teacher,
                         pool: CoursePool,
                         selections: Dict[str, List[CourseSession]]):
    """Proceso de selección interactiva para un docente."""

    console.rule(
        f"[bold yellow]TURNO {turn}/{total}  —  {teacher.name}[/bold yellow]  "
        f"[dim]{teacher.category} · Orden {teacher.orden} · {teacher.required_hours}h reglamentarias[/dim]"
    )

    avail = pool.available(teacher.role)
    if not avail:
        console.print("[red]⚠ No quedan sesiones disponibles para este docente.[/red]")
        selections[teacher.teacher_id] = []
        return

    total_avail_h = sum(s.hours for s in avail)
    if total_avail_h < teacher.required_hours:
        console.print(
            f"[red]⚠ Solo quedan {total_avail_h}h disponibles y el docente necesita "
            f"{teacher.required_hours}h. No puede cubrir su carga completa.[/red]")
        if not Confirm.ask("¿Asignar lo que queda de todos modos?", default=False):
            selections[teacher.teacher_id] = []
            return

    selected: List[CourseSession] = []

    while True:
        # Mostrar estado actual
        assigned_h = sum(s.hours for s in selected)
        remaining  = teacher.required_hours - assigned_h
        console.print(
            f"\n[bold]Horas reglamentarias:[/bold] {teacher.required_hours}h  "
            f"[green]Seleccionadas:[/green] {assigned_h}h  "
            f"[yellow]Faltan:[/yellow] {remaining}h"
        )
        console.print(pool.summary_table(teacher.role))

        if selected:
            sel_tbl = Table(box=box.SIMPLE, title="Sesiones ya seleccionadas", header_style="bold green")
            sel_tbl.add_column("#", width=4)
            sel_tbl.add_column("Ciclo/Sec", width=10)
            sel_tbl.add_column("Curso", width=38)
            sel_tbl.add_column("Tipo", width=14)
            sel_tbl.add_column("Horas", width=7, justify="right")
            for i, s in enumerate(selected, 1):
                sel_tbl.add_row(str(i), f"{s.cycle}°{s.section}",
                                s.course_name, s.session_type, f"{s.hours}h")
            console.print(sel_tbl)

        console.print("\n[dim]Opciones: número(s) para agregar (ej: 1,3,5) | "
                      "[bold]D[/bold] para quitar una | "
                      "[bold]C[/bold] para confirmar | "
                      "[bold]S[/bold] para saltar turno[/dim]")

        raw = Prompt.ask("[cyan]Acción[/cyan]").strip().upper()

        # Saltar turno
        if raw == "S":
            if Confirm.ask("[red]¿Seguro que deseas saltar este turno? "
                           "El docente quedará sin carga asignada.[/red]"):
                # liberar lo que tenía seleccionado
                for s in selected:
                    pool.release(s)
                selections[teacher.teacher_id] = []
                return

        # Confirmar selección
        elif raw == "C":
            ok, msg = validate_selection(teacher, selected)
            console.print(f"[{'green' if ok else 'red'}]{msg}[/{'green' if ok else 'red'}]")
            if ok:
                selections[teacher.teacher_id] = selected
                console.print(f"[green]✔ Carga de {teacher.name} confirmada.[/green]\n")
                return
            # Si no es exacto, preguntar si fuerza
            if Confirm.ask("[yellow]¿Confirmar igual (carga incompleta/excedida)?[/yellow]",
                           default=False):
                selections[teacher.teacher_id] = selected
                return

        # Quitar una sesión
        elif raw == "D":
            if not selected:
                console.print("[dim]No hay nada que quitar.[/dim]")
                continue
            idx_raw = Prompt.ask("[cyan]Número a quitar[/cyan]")
            try:
                idx = int(idx_raw) - 1
                if 0 <= idx < len(selected):
                    pool.release(selected[idx])
                    removed = selected.pop(idx)
                    console.print(f"[yellow]  — {removed.label} devuelta al pool.[/yellow]")
                else:
                    console.print("[red]✗ Número inválido.[/red]")
            except ValueError:
                console.print("[red]✗ Ingresa un número.[/red]")

        # Agregar sesión(es)
        else:
            try:
                idxs = [int(x.strip()) - 1 for x in raw.split(",") if x.strip()]
                avail_now = pool.available(teacher.role)
                valid = [i for i in idxs if 0 <= i < len(avail_now)]
                if not valid:
                    console.print("[red]✗ Números fuera de rango.[/red]")
                    continue
                for i in valid:
                    sess = avail_now[i]
                    pool.assign(sess, teacher.teacher_id)
                    selected.append(sess)
                    console.print(f"[green]  + {sess.label}[/green]")
            except ValueError:
                console.print("[red]✗ Ingresa números separados por comas o una de las opciones.[/red]")


def _apply_assignments_to_sections(
        selections: Dict[str, List[CourseSession]],
        sections: List[SectionData]):
    """Transfiere las asignaciones del pool a los objetos Course de cada sección."""

    # Construir lookup: (course_id_base, seccion) → teacher_id por tipo
    assign_map: Dict[Tuple[str,str,str], str] = {}
    for teacher_id, sess_list in selections.items():
        for sess in sess_list:
            tipo_base = sess.session_type.split(" (")[0]  # quitar "(bloque N)"
            key = (sess.course_id, sess.section, tipo_base)
            assign_map[key] = teacher_id

    for sec in sections:
        for course in sec.courses:
            cid  = course.course_id
            sect = sec.section
            if assign_map.get((cid, sect, "Teoría")):
                course.theory_teacher_id = assign_map[(cid, sect, "Teoría")]
            if assign_map.get((cid, sect, "Práctica")):
                course.practice_teacher_id = assign_map[(cid, sect, "Práctica")]
            if assign_map.get((cid, sect, "Laboratorio")):
                course.lab_teacher_id = assign_map[(cid, sect, "Laboratorio")]


def _print_summary(ordered: List[Teacher],
                   selections: Dict[str, List[CourseSession]]):
    """Muestra el resumen final de la adjudicación."""
    console.print("\n")
    console.rule("[bold green]RESUMEN FINAL DE ADJUDICACIÓN[/bold green]")

    tbl = Table(box=box.ROUNDED, show_lines=True,
                title="Carga horaria adjudicada por docente")
    tbl.add_column("Docente",     width=30)
    tbl.add_column("Categoría",   width=12)
    tbl.add_column("Regl.",       width=7,  justify="right")
    tbl.add_column("Adjudicado",  width=12, justify="right")
    tbl.add_column("Diferencia",  width=12, justify="right")
    tbl.add_column("Estado",      width=16)

    all_ok = True
    for t in ordered:
        slist = selections.get(t.teacher_id, [])
        adj   = sum(s.hours for s in slist)
        diff  = adj - t.required_hours
        if diff == 0:
            estado = "[green]✔ EXACTO[/green]"
            diff_str = "[green]0[/green]"
        elif diff > 0:
            estado = f"[red]✗ EXCEDE +{diff}h[/red]"
            diff_str = f"[red]+{diff}h[/red]"
            all_ok = False
        elif adj == 0:
            estado = "[yellow]⚠ SIN CARGA[/yellow]"
            diff_str = f"[yellow]{diff}h[/yellow]"
            all_ok = False
        else:
            estado = f"[yellow]⚠ FALTAN {abs(diff)}h[/yellow]"
            diff_str = f"[yellow]{diff}h[/yellow]"
            all_ok = False
        tbl.add_row(t.name, t.category, f"{t.required_hours}h",
                    f"{adj}h", diff_str, estado)

    console.print(tbl)
    if all_ok:
        console.print("[bold green]✔ Todos los docentes tienen carga exacta. "
                      "Listo para ejecutar el solver.[/bold green]")
    else:
        console.print("[bold yellow]⚠ Hay docentes con carga incompleta o excedida. "
                      "Revisa antes de ejecutar el solver.[/bold yellow]")
