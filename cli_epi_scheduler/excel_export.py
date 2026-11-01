"""excel_export.py — Genera Excel con hoja por ciclo (secciones A y B)."""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from models import ScheduleResult, DAYS, TIME_SLOTS, NUM_DAYS, NUM_SLOTS
import os

C_NAVY="1F3864"; C_BLUE="2E75B6"; C_LBLUE="BDD7EE"
C_GREEN="375623"; C_LGRE="E2EFDA"; C_PURP="F3E5FF"
C_YELL="FFF2CC"; C_GRAY="F2F2F2"; C_WHITE="FFFFFF"
CYCO = {1:"243F60",2:"1F4E79",3:"375623",4:"538135",
        5:"7030A0",6:"9933CC",7:"833C00",8:"C55A11",9:"404040",10:"595959"}
SECO = {"A":"1F4E79","B":"2F5496"}
STYP = {"Teoría":("DDEEFF","1F4E79"),"Práctica":("E2EFDA","375623"),
        "Laboratorio":("FFF2CC","7F4000")}

def _th():
    s = Side(style="thin", color="BFBFBF")
    return Border(left=s,right=s,top=s,bottom=s)

def _brd(ws,r1,r2,c1,c2):
    for row in ws.iter_rows(min_row=r1,max_row=r2,min_col=c1,max_col=c2):
        for c in row: c.border = _th()

def _hdr(ws,ref,txt,bg=C_NAVY,fg=C_WHITE,sz=11,bold=True,wrap=False,center=True):
    c=ws[ref]; c.value=txt
    c.font=Font(name="Arial",bold=bold,color=fg,size=sz)
    c.fill=PatternFill("solid",fgColor=bg)
    c.alignment=Alignment(horizontal="center" if center else "left",
                           vertical="center",wrap_text=wrap)
    return c

def _build_smap(result, sid):
    smap={}
    for sess in result.get_section_sessions(sid):
        for off in range(sess.duration_slots):
            key=(sess.day_idx, sess.slot_idx+off)
            smap.setdefault(key,[])
            if off==0:
                if sess.duration_slots==2:
                    lbl=f"LAB(4h)\n{sess.course_name}\n({sess.teacher_name})"
                else:
                    lbl=f"{sess.session_type}\n{sess.course_name}\n({sess.teacher_name})"
            else:
                lbl=f"↑ LAB\n{sess.course_name}"
            smap[key].append(lbl)
    return smap

def _write_grid(ws, result, sid, start_row, hdr_color):
    _hdr(ws,f"A{start_row}","Turno \\ Día",hdr_color,sz=9)
    for j,day in enumerate(DAYS):
        col=get_column_letter(j+2)
        _hdr(ws,f"{col}{start_row}",day,hdr_color,sz=9)
        ws.column_dimensions[col].width=22
    ws.column_dimensions["A"].width=14
    ws.row_dimensions[start_row].height=22
    smap=_build_smap(result,sid)
    for si,slot in enumerate(TIME_SLOTS):
        r=start_row+1+si; ws.row_dimensions[r].height=48
        cx=ws[f"A{r}"]; cx.value=slot
        cx.font=Font(name="Arial",bold=True,size=9,color=C_WHITE)
        cx.fill=PatternFill("solid",fgColor=hdr_color)
        cx.alignment=Alignment(horizontal="center",vertical="center")
        for j in range(len(DAYS)):
            col=get_column_letter(j+2); cg=ws[f"{col}{r}"]
            texts=smap.get((j,si),[])
            if texts:
                txt=texts[0]
                if "LAB" in txt: bg_c,fg_c=STYP["Laboratorio"]
                elif "Práctica" in txt: bg_c,fg_c=STYP["Práctica"]
                else: bg_c,fg_c=STYP["Teoría"]
                cg.value=txt
                cg.font=Font(name="Arial",size=8,bold=True,color=fg_c)
                cg.fill=PatternFill("solid",fgColor=bg_c)
            else:
                cg.fill=PatternFill("solid",fgColor=C_LBLUE if (si+j)%2==0 else C_GRAY)
            cg.alignment=Alignment(horizontal="center",vertical="center",wrap_text=True)
    _brd(ws,start_row,start_row+NUM_SLOTS,1,NUM_DAYS+1)
    return start_row+NUM_SLOTS+2

def _write_cycle_sheet(wb, result, cycle):
    ws=wb.create_sheet(f"Ciclo {cycle}")
    ws.sheet_view.showGridLines=False
    ws.sheet_properties.tabColor=CYCO.get(cycle,C_NAVY)
    HC=CYCO.get(cycle,C_NAVY)
    ws.merge_cells("A1:H1")
    _hdr(ws,"A1",f"ESCUELA PROFESIONAL DE INFORMÁTICA — {cycle}° CICLO — HORARIO 2026-2",HC,sz=13)
    ws.row_dimensions[1].height=38
    ws.merge_cells("A2:H2")
    _hdr(ws,"A2","Teoría=2h · Práctica=2h · Lab=4h (2 bloques consecutivos)  |  Horas exactas por docente validadas",
         C_BLUE,sz=9)
    ws.row_dimensions[2].height=20
    cur=4
    for sec_letter in ["A","B"]:
        sid=f"{cycle}{sec_letter}"; hc=SECO[sec_letter]
        sessions=result.get_section_sessions(sid)
        ws.merge_cells(f"A{cur}:H{cur}")
        _hdr(ws,f"A{cur}",f"SECCIÓN {sec_letter}",hc,sz=12)
        ws.row_dimensions[cur].height=26; cur+=1
        if not sessions:
            ws.merge_cells(f"A{cur}:H{cur}")
            ws[f"A{cur}"].value="Sin horario generado — ejecute el solver."
            ws[f"A{cur}"].font=Font(name="Arial",italic=True,size=10,color="7F4000")
            ws[f"A{cur}"].fill=PatternFill("solid",fgColor=C_YELL)
            ws[f"A{cur}"].alignment=Alignment(horizontal="center",vertical="center")
            ws.row_dimensions[cur].height=22; cur+=3; continue
        ws.merge_cells(f"A{cur}:H{cur}")
        _hdr(ws,f"A{cur}","GRILLA SEMANAL",hc,sz=10)
        ws.row_dimensions[cur].height=20; cur+=1
        cur=_write_grid(ws,result,sid,cur,hc); cur+=1
        ws.merge_cells(f"A{cur}:E{cur}")
        _hdr(ws,f"A{cur}","DETALLE DE SESIONES",hc,sz=10)
        ws.row_dimensions[cur].height=20; cur+=1
        for i,h in enumerate(["Curso","Tipo","Docente","Día","Horario"]):
            _hdr(ws,f"{get_column_letter(i+1)}{cur}",h,hc,sz=9)
        ws.row_dimensions[cur].height=22; cur+=1
        sorted_s=sorted(sessions,key=lambda s:(s.course_name,s.session_type))
        for ri,sess in enumerate(sorted_s):
            bg=C_LBLUE if ri%2==0 else C_WHITE
            for ci,val in enumerate([sess.course_name,sess.session_type,
                                      sess.teacher_name,sess.day_name,sess.time_str]):
                col=get_column_letter(ci+1); cx=ws[f"{col}{cur}"]
                cx.value=val; cx.font=Font(name="Arial",size=9)
                cx.fill=PatternFill("solid",fgColor=bg)
                cx.alignment=Alignment(horizontal="left" if ci in (0,2) else "center",
                                        vertical="center")
            ws.row_dimensions[cur].height=18; cur+=1
        _brd(ws,cur-len(sorted_s)-1,cur-1,1,5); cur+=2

def _write_teacher_loads(wb, result, teachers):
    """Hoja adicional: carga horaria adjudicada por docente."""
    ws=wb.create_sheet("Carga Docentes")
    ws.sheet_view.showGridLines=False
    ws.sheet_properties.tabColor="2E4057"
    ws.merge_cells("A1:G1")
    _hdr(ws,"A1","CARGA HORARIA ADJUDICADA POR DOCENTE — CICLO 2026-2","2E4057",sz=13)
    ws.row_dimensions[1].height=35
    for i,h in enumerate(["Docente","Categoría","Orden","Horas Regl.","Horas Asign.","Diferencia","Estado"]):
        _hdr(ws,f"{get_column_letter(i+1)}2",h,C_BLUE,sz=10,wrap=True)
    ws.row_dimensions[2].height=28
    from models import category_rank_key, CATEGORY_SELECTION_ORDER
    sorted_t=sorted(teachers.values(), key=category_rank_key)
    for ri,t in enumerate(sorted_t):
        r=3+ri; bg=C_LBLUE if ri%2==0 else C_WHITE
        adj=t.assigned_hours
        diff=adj-t.required_hours
        if diff==0: estado="✔ EXACTO"; d_color="375623"
        elif diff>0: estado=f"✗ EXCEDE +{diff}h"; d_color="C00000"
        else: estado=f"⚠ FALTAN {abs(diff)}h"; d_color="C55A11"
        for ci,val in enumerate([t.name,t.category,t.orden,
                                   f"{t.required_hours}h",f"{adj}h",
                                   f"{diff:+}h",estado]):
            col=get_column_letter(ci+1); cx=ws[f"{col}{r}"]
            cx.value=val; cx.font=Font(name="Arial",size=10,
                                        color=d_color if ci==6 else "000000")
            cx.fill=PatternFill("solid",fgColor=bg)
            cx.alignment=Alignment(horizontal="center" if ci!=0 else "left",vertical="center")
        ws.row_dimensions[r].height=18
    _brd(ws,2,2+len(sorted_t),1,7)
    for col,w in zip("ABCDEFG",[30,14,8,12,12,12,16]):
        ws.column_dimensions[col].width=w
    ws.freeze_panes="A3"

def _write_summary(wb, result):
    ws=wb.create_sheet("Resumen"); wb.move_sheet("Resumen",offset=-(len(wb.sheetnames)-1))
    ws.sheet_view.showGridLines=False; ws.sheet_properties.tabColor=C_NAVY
    ws.merge_cells("A1:G1")
    _hdr(ws,"A1",f"HORARIOS 2026-2  |  v{result.version_id}  |  {result.created_at}  |  {result.status}",
         C_NAVY,sz=11)
    ws.row_dimensions[1].height=28
    for i,h in enumerate(["Ciclo","Sec","Curso","Tipo","Docente","Día","Horario"]):
        _hdr(ws,f"{get_column_letter(i+1)}2",h,C_BLUE,sz=10)
    ws.row_dimensions[2].height=24
    sorted_all=sorted(result.sessions, key=lambda s:(s.section_id,s.course_name,s.session_type))
    for ri,sess in enumerate(sorted_all):
        r=3+ri; bg=C_LBLUE if ri%2==0 else C_WHITE
        cycle=int("".join(c for c in sess.section_id if c.isdigit()))
        sec=sess.section_id[-1]
        for ci,val in enumerate([cycle,sec,sess.course_name,sess.session_type,
                                   sess.teacher_name,sess.day_name,sess.time_str]):
            col=get_column_letter(ci+1); cx=ws[f"{col}{r}"]
            cx.value=val; cx.font=Font(name="Arial",size=10)
            cx.fill=PatternFill("solid",fgColor=bg)
            cx.alignment=Alignment(horizontal="left" if ci in (2,4) else "center",vertical="center")
        ws.row_dimensions[r].height=18
    _brd(ws,2,2+len(result.sessions),1,7)
    for col,w in zip("ABCDEFG",[8,8,34,14,26,12,14]):
        ws.column_dimensions[col].width=w
    ws.freeze_panes="A3"

def export_to_excel(result: ScheduleResult, output_path: str,
                    teachers=None):
    wb=Workbook(); del wb[wb.sheetnames[0]]
    cycles=sorted(set(int("".join(c for c in s.section_id if c.isdigit()))
                      for s in result.sessions))
    _write_summary(wb,result)
    for cycle in cycles:
        _write_cycle_sheet(wb,result,cycle)
    if teachers:
        _write_teacher_loads(wb,result,teachers)
    os.makedirs(os.path.dirname(output_path),exist_ok=True)
    wb.save(output_path)
    return output_path
