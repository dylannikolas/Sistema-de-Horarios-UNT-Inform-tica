"""
input_handler.py — Registro de docentes con categoría y orden de adjudicación.
Integra el proceso de selección de carga horaria por turno.
"""
from rich.console import Console
from rich.prompt  import Prompt, Confirm
from rich.panel   import Panel
from rich.table   import Table
from rich         import box
from models import (
    Teacher, Course, SectionData, DAYS, TIME_SLOTS,
    MALLA_REAL, AcademicPeriod, PRIMARY_CYCLES, REPEAT_CYCLES,
    CYCLE_PARITY, CATEGORY_REQUIRED_HOURS, CATEGORY_SELECTION_ORDER,
)
from typing import Dict, List, Tuple
import uuid

console = Console()

# ── Helpers ───────────────────────────────────────────────────────────────────

def ask_int(prompt, min_val=1, max_val=999, default=None):
    while True:
        try:
            suffix = f" [{default}]" if default is not None else ""
            raw = Prompt.ask(f"[cyan]{prompt}{suffix}[/cyan]")
            if raw == "" and default is not None: return default
            val = int(raw)
            if min_val <= val <= max_val: return val
            console.print(f"[red]✗ Entre {min_val} y {max_val}[/red]")
        except ValueError:
            console.print("[red]✗ Número inválido[/red]")

def choose_from(prompt, options, allow_none=False):
    for i, o in enumerate(options, 1):
        console.print(f"  [yellow]{i}.[/yellow] {o}")
    if allow_none:
        console.print(f"  [yellow]{len(options)+1}.[/yellow] (ninguno)")
    while True:
        try:
            top = len(options) + (1 if allow_none else 0)
            v = int(Prompt.ask(f"[cyan]{prompt} (1-{top})[/cyan]"))
            if 1 <= v <= len(options): return v - 1
            if allow_none and v == len(options)+1: return -1
            console.print(f"[red]✗ Elige 1-{top}[/red]")
        except ValueError:
            console.print("[red]✗ Inválido[/red]")

def choose_multiple(prompt, options):
    for i, o in enumerate(options, 1):
        console.print(f"  [yellow]{i:2}.[/yellow] {o}")
    console.print("  [dim]Números separados por comas, ej: 1,3,5[/dim]")
    while True:
        raw = Prompt.ask(f"[cyan]{prompt}[/cyan]")
        try:
            chosen = [int(x.strip())-1 for x in raw.split(",") if x.strip()]
            if chosen and all(0 <= c < len(options) for c in chosen):
                return chosen
            console.print("[red]✗ Valores fuera de rango[/red]")
        except ValueError:
            console.print("[red]✗ Formato incorrecto[/red]")

def collect_availability(name: str) -> List[Tuple[int,int]]:
    console.print(f"\n[bold]Disponibilidad de [cyan]{name}[/cyan][/bold]")
    day_idxs = choose_multiple("Días disponibles", DAYS)
    avail = []
    for di in day_idxs:
        console.print(f"  [yellow]{DAYS[di]}[/yellow] — bloques de 2h:")
        slot_idxs = choose_multiple(
            f"Bloques en {DAYS[di]}",
            [f"{s+1}. {ts}" for s, ts in enumerate(TIME_SLOTS)])
        for si in slot_idxs:
            avail.append((di, si))
    return avail

# ── Registro de docentes con categoría y orden ───────────────────────────────

def collect_teachers() -> Dict[str, Teacher]:
    """
    Registra docentes agrupados por categoría y asignando orden de adjudicación.
    Los docentes nombrados (Principal/Asociado/Auxiliar) se ingresan con su
    número de orden en la lista; los contratados van al final.
    """
    console.print(Panel(
        "[bold]REGISTRO DE DOCENTES POR CATEGORÍA[/bold]\n"
        "[dim]Se registran por categoría y orden de adjudicación.\n"
        "Principal → Asociado → Auxiliar → Contratado[/dim]",
        style="blue"))

    teachers: Dict[str, Teacher] = {}

    # Mostrar tabla de horas reglamentarias
    tbl = Table(box=box.SIMPLE, title="Horas reglamentarias por categoría")
    tbl.add_column("Categoría", style="bold"); tbl.add_column("Horas req./semana")
    for cat, h in CATEGORY_REQUIRED_HOURS.items():
        tbl.add_row(cat, f"{h}h")
    console.print(tbl)

    for category in CATEGORY_SELECTION_ORDER:
        req_h = CATEGORY_REQUIRED_HOURS[category]
        console.print(f"\n[bold cyan]── {category.upper()} ({req_h}h/semana) ──[/bold cyan]")
        n = ask_int(f"¿Cuántos docentes {category}?", 0, 30, default=0)
        if n == 0:
            continue

        for i in range(n):
            console.print(f"\n  [bold]{category} — docente {i+1}/{n}[/bold]")
            name = Prompt.ask("  [cyan]Nombre completo[/cyan]").strip()
            orden = ask_int("  Número de orden en la lista de adjudicación", 1, 99, default=i+1)
            tid = f"T{str(uuid.uuid4())[:6].upper()}"

            # Horas: para Contratado puede variar (horas por contrato)
            if category == "Contratado":
                req_override = ask_int(
                    f"  Horas contratadas/semana", 2, 20, default=req_h)
            else:
                req_override = req_h

            role_idx = choose_from("  Rol en aula",
                ["Solo Teoría/Práctica", "Solo Laboratorio", "Ambos (T/P y Lab)"])
            role = ["teoria_practica", "laboratorio", "ambos"][role_idx]
            avail = collect_availability(name)

            teachers[tid] = Teacher(
                teacher_id=tid, name=name,
                category=category, orden=orden,
                availability=avail,
                required_hours=req_override,
                role=role,
            )
            console.print(f"  [green]✔ {name} — {category} Orden {orden} — {req_override}h[/green]")

    # Resumen de docentes registrados
    if teachers:
        sum_tbl = Table(box=box.SIMPLE, title="Docentes registrados", header_style="bold")
        sum_tbl.add_column("Orden global"); sum_tbl.add_column("Nombre")
        sum_tbl.add_column("Categoría"); sum_tbl.add_column("Orden cat.")
        sum_tbl.add_column("Horas req.")
        from models import category_rank_key
        sorted_t = sorted(teachers.values(), key=lambda t: category_rank_key(t))
        for i, t in enumerate(sorted_t, 1):
            sum_tbl.add_row(str(i), t.name, t.category, str(t.orden), f"{t.required_hours}h")
        console.print(sum_tbl)

    return teachers

# ── Selección de período ──────────────────────────────────────────────────────

def select_academic_period() -> AcademicPeriod:
    console.print(Panel("[bold]SELECCIÓN DE PERÍODO ACADÉMICO[/bold]", style="blue"))
    for i, (label, desc) in enumerate([
        ("Semestre PAR  (ej. 2026-2)", "Ciclos 2, 4, 6, 8, 10"),
        ("Semestre IMPAR (ej. 2026-1)", "Ciclos 1, 3, 5, 7, 9"),
        ("NIVELACIÓN (fin de año)",     "Todos los ciclos"),
    ], 1):
        console.print(f"  [yellow]{i}.[/yellow] {label}  [dim]{desc}[/dim]")
    choice = Prompt.ask("[cyan]Período[/cyan]", choices=["1","2","3"])
    return {
        "1": AcademicPeriod.PAR,
        "2": AcademicPeriod.IMPAR,
        "3": AcademicPeriod.NIVELACION,
    }[choice]

# ── Construcción de secciones ─────────────────────────────────────────────────

def _build_sections_for_cycle(ciclo, period_str, section_type,
                               sections_letters=("A","B")) -> List[SectionData]:
    """
    Construye las secciones de un ciclo con los cursos de la malla.
    Los docentes se asignarán luego durante la adjudicación.
    """
    malla_rows = MALLA_REAL[ciclo]
    parity = "PAR" if CYCLE_PARITY[ciclo]=="par" else "IMPAR"
    rep_label = " [REPETICIÓN]" if section_type == "repeticion" else ""
    console.print(f"\n[bold]Ciclo {ciclo}° ({parity}){rep_label}[/bold] — "
                  f"{len(malla_rows)} cursos de la malla")

    result = []
    for sec_letter in sections_letters:
        courses = [
            Course.from_malla(ciclo, idx, row, course_type=section_type)
            for idx, row in enumerate(malla_rows)
        ]
        result.append(SectionData(
            cycle=ciclo, section=sec_letter,
            academic_period=period_str,
            section_type=section_type,
            courses=courses,
        ))
        console.print(f"  [green]✔ Sección {ciclo}{sec_letter} creada[/green]")
    return result


def collect_cycles_and_courses(teachers: Dict[str, Teacher],
                                period: AcademicPeriod) -> List[SectionData]:
    period_str = period.value
    all_sections: List[SectionData] = []

    if period == AcademicPeriod.NIVELACION:
        console.print(Panel("[bold]NIVELACIÓN[/bold]\n"
                            "[dim]Libre elección de ciclos (par o impar).[/dim]",
                            style="magenta"))
        all_cycles = list(range(1, 11))
        chosen = choose_multiple("¿Qué ciclos participan en nivelación?",
                                 [f"{c}° ({CYCLE_PARITY[c]})" for c in all_cycles])
        for idx in chosen:
            all_sections.extend(
                _build_sections_for_cycle(all_cycles[idx], period_str, "nivelacion"))
        return all_sections

    primary = PRIMARY_CYCLES[period]
    repeats = REPEAT_CYCLES[period]

    # Ciclos primarios
    console.print(f"\n[bold cyan]CICLOS PRIMARIOS[/bold cyan]  {primary}")
    chosen_p = choose_multiple("¿Qué ciclos primarios se abren?",
                               [f"{c}° Ciclo" for c in primary])
    for idx in chosen_p:
        all_sections.extend(
            _build_sections_for_cycle(primary[idx], period_str, "regular"))

    # Cursos por repetición
    parity_name = "impares" if period == AcademicPeriod.PAR else "pares"
    if Confirm.ask(f"\n¿Hay cursos de ciclos {parity_name} por repetición?", default=False):
        chosen_r = choose_multiple(
            "¿Qué ciclos por repetición?",
            [f"{c}° ({CYCLE_PARITY[c]})" for c in repeats])
        for idx in chosen_r:
            n_secs = choose_from(
                "Secciones para este ciclo en repetición",
                ["Solo Sección A", "Secciones A y B"])
            letters = ("A",) if n_secs == 0 else ("A","B")
            all_sections.extend(
                _build_sections_for_cycle(repeats[idx], period_str,
                                          "repeticion", sections_letters=letters))

    return all_sections
