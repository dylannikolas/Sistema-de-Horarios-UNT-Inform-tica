"""
main.py — Menú principal del sistema de horarios EPI-UNT v2.0.

Flujo completo:
  1. Seleccionar período (PAR / IMPAR / NIVELACIÓN)
  2. Registrar docentes con categoría y orden de adjudicación
  3. Definir ciclos y secciones
  4. Proceso de adjudicación de carga horaria (por turno, horas exactas)
  5. Ejecutar solver OR-Tools CP-SAT
  6. Exportar Excel (grilla + carga docentes)
  7. Guardar versión
"""
import os, sys
from rich.console import Console
from rich.panel   import Panel
from rich.table   import Table
from rich.prompt  import Prompt, Confirm
from rich         import box

from models          import DAYS, TIME_SLOTS
from input_handler   import collect_teachers, collect_cycles_and_courses, select_academic_period
from course_assignment import run_adjudicacion
from solver          import build_and_solve
from excel_export    import export_to_excel
from version_manager import (save_version, load_version, list_versions,
                              delete_version, update_description)

console    = Console()
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")

def print_banner():
    console.print(Panel(
        "[bold white]SISTEMA DE ORGANIZACIÓN DE HORARIOS[/bold white]\n"
        "[cyan]Escuela Profesional de Informática — UNT[/cyan]\n"
        "[dim]Malla Curricular 2017  ·  Adjudicación por categoría  ·  OR-Tools CP-SAT[/dim]",
        title="[bold blue]EPI Scheduler v2.0[/bold blue]",
        border_style="blue", padding=(1,4)))

def show_versions(versions):
    if not versions:
        console.print("[yellow]No hay versiones guardadas.[/yellow]"); return
    tbl=Table(title="Versiones guardadas",box=box.ROUNDED,show_lines=True)
    tbl.add_column("ID",style="yellow",width=10)
    tbl.add_column("Descripción",width=35)
    tbl.add_column("Período",width=12)
    tbl.add_column("Creado",width=20)
    tbl.add_column("Estado",width=12)
    for v in versions:
        color={"OK":"green","INFEASIBLE":"red","TIMEOUT":"yellow"}.get(v["status"],"dim")
        tbl.add_row(v["version_id"],v["description"],
                    v.get("academic_period","—"),v["created_at"],
                    f"[{color}]{v['status']}[/{color}]")
    console.print(tbl)

def pick_version(versions):
    if not versions: console.print("[red]Sin versiones.[/red]"); return None
    show_versions(versions)
    ids=[v["version_id"] for v in versions]
    vid=Prompt.ask("[cyan]ID de versión (Enter para cancelar)[/cyan]").strip().upper()
    return vid if vid in ids else None

def do_export(result, teachers, vid):
    if result.status not in ("OK","TIMEOUT") or not result.sessions:
        console.print("[yellow]Sin sesiones que exportar.[/yellow]"); return
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path=os.path.join(OUTPUT_DIR, f"Horario_{result.academic_period}_{vid}.xlsx")
    console.print("\n[bold blue]📊 Generando Excel...[/bold blue]")
    export_to_excel(result, path, teachers)
    console.print(f"[green]✔ Excel:[/green] [bold]{path}[/bold]")

def flow_new():
    console.print(Panel("[bold]NUEVO HORARIO — PROCESO COMPLETO[/bold]", style="green"))

    # 1. Período
    period = select_academic_period()

    # 2. Docentes
    teachers = collect_teachers()
    if not teachers:
        console.print("[red]Sin docentes registrados.[/red]"); return

    # 3. Ciclos y secciones (sin docentes asignados aún)
    sections = collect_cycles_and_courses(teachers, period)
    if not sections:
        console.print("[red]Sin secciones registradas.[/red]"); return

    # 4. Adjudicación de carga horaria por turno y categoría
    console.print(Panel(
        "[bold]PASO 4 — ADJUDICACIÓN DE CARGA HORARIA[/bold]\n"
        "[dim]Cada docente selecciona sus cursos en orden de categoría.\n"
        "El sistema valida que las horas sean exactas.[/dim]",
        style="yellow"))
    teachers = run_adjudicacion(teachers, sections)

    # 5. Solver
    desc  = Prompt.ask("[cyan]Descripción de esta versión[/cyan]",
                       default=f"Horario {period.value} 2026")
    tlim  = float(Prompt.ask("[cyan]Tiempo límite solver (s)[/cyan]", default="120"))
    console.print("\n[bold blue]⚙  Ejecutando OR-Tools CP-SAT...[/bold blue]")
    result = build_and_solve(sections, teachers, tlim, desc)
    result.academic_period = period.value

    sc={"OK":"green","INFEASIBLE":"red","TIMEOUT":"yellow"}.get(result.status,"white")
    console.print(f"[bold]Estado:[/bold] [{sc}]{result.status}[/{sc}]  "
                  f"[dim]{len(result.sessions)} sesiones generadas[/dim]")

    if result.status == "INFEASIBLE":
        console.print("[red]Sin solución. Revisa disponibilidades o ajusta la carga adjudicada.[/red]")
        if not Confirm.ask("¿Guardar igualmente?", default=False): return

    # 6. Guardar y exportar
    vid = save_version(result, teachers, sections)
    console.print(f"[green]✔ Versión guardada: [bold]{vid}[/bold][/green]")
    do_export(result, teachers, vid)

def flow_load():
    vid = pick_version(list_versions())
    if not vid: return
    try:
        result, teachers, sections = load_version(vid)
        console.print(f"[green]✔ Versión {vid} cargada ({len(result.sessions)} sesiones)[/green]")
        do_export(result, teachers, vid)
    except Exception as e:
        console.print(f"[red]{e}[/red]")

def flow_list():  show_versions(list_versions())

def flow_edit():
    vid = pick_version(list_versions())
    if not vid: return
    nd = Prompt.ask("[cyan]Nueva descripción[/cyan]")
    if update_description(vid, nd):
        console.print("[green]✔ Actualizado.[/green]")

def flow_delete():
    vid = pick_version(list_versions())
    if not vid: return
    if Confirm.ask(f"[red]¿Eliminar {vid}?[/red]"):
        if delete_version(vid): console.print(f"[green]✔ Eliminado.[/green]")

def main():
    print_banner()
    MENU = [
        ("1","Crear nuevo horario (adjudicación + solver + Excel)", flow_new),
        ("2","Cargar versión y re-exportar Excel",                  flow_load),
        ("3","Ver versiones guardadas",                             flow_list),
        ("4","Editar descripción de versión",                       flow_edit),
        ("5","Eliminar versión",                                    flow_delete),
        ("6","Salir",                                               None),
    ]
    while True:
        console.print("\n[bold]Menú principal:[/bold]")
        for key, lbl, _ in MENU:
            console.print(f"  [yellow]{key}[/yellow]  {lbl}")
        choice = Prompt.ask("[cyan]Opción[/cyan]", choices=[m[0] for m in MENU])
        if choice == "6":
            console.print("\n[bold blue]¡Hasta luego! 🎓[/bold blue]\n"); break
        fn = dict((m[0], m[2]) for m in MENU)[choice]
        try:
            if fn: fn()
        except KeyboardInterrupt:
            console.print("\n[dim]Cancelado. Volviendo al menú...[/dim]")
        except Exception as e:
            import traceback
            console.print(f"[red]{e}[/red]\n[dim]{traceback.format_exc()}[/dim]")

if __name__ == "__main__":
    main()
