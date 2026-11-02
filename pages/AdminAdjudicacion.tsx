import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { api } from '../services/api';

const ALL_CYCLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const CAT_COLORS: Record<string, string> = {
  Principal: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  Asociado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  Auxiliar: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  Contratado: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
};

const evenUp = (h: number) => (h > 0 ? Math.ceil(h / 2) * 2 : 0);

const AdminAdjudicacion: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number>(0);
  const [courses, setCourses] = useState<any[]>([]);
  const [orderedTeachers, setOrderedTeachers] = useState<any[]>([]);
  const [solverHealth, setSolverHealth] = useState<any>({ solver_status: 'checking' });

  // Configuración para nuevo proceso
  const [periodPreset, setPeriodPreset] = useState<'PAR' | 'IMPAR' | 'NIVELACION'>('PAR');
  const [cycleMode, setCycleMode] = useState<Record<number, 'NONE' | 'A' | 'AB'>>({
    1: 'NONE', 2: 'AB', 3: 'NONE', 4: 'AB', 5: 'NONE',
    6: 'AB', 7: 'NONE', 8: 'AB', 9: 'NONE', 10: 'AB',
  });
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);

  // Estado del proceso activo
  const [activeProc, setActiveProc] = useState<any>(null);
  const [turnData, setTurnData] = useState<any>(null);
  const [solverResult, setSolverResult] = useState<any>(null);

  // Asistencia opcional del director en el turno actual
  const [directorAssistMode, setDirectorAssistMode] = useState(false);
  const [assistSelectedKeys, setAssistSelectedKeys] = useState<string[]>([]);
  const [filterCycle, setFilterCycle] = useState<number | 'ALL'>('ALL');

  // Parámetros del solver
  const [timeLimit, setTimeLimit] = useState<number>(120);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [allowUnassigned, setAllowUnassigned] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    initPage();
  }, []);

  // Auto-refresco cada 5 segundos cuando hay proceso activo para ver avances de docentes en tiempo real
  useEffect(() => {
    if (!activeProc?.process_id || activeProc?.status !== 'EN_PROCESO') return;
    const timer = setInterval(() => {
      refreshActiveProcess(selectedSemesterId, true);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeProc?.process_id, activeProc?.status, selectedSemesterId]);

  const initPage = async () => {
    setLoading(true);
    try {
      const [sems, crs, tch, health] = await Promise.all([
        api.getSemesters(),
        api.getCourses(),
        api.getOrderedTeachers(),
        api.getSolverHealth(),
      ]);
      setSemesters(sems);
      setCourses(crs);
      setOrderedTeachers(tch);
      setSelectedTeacherIds(tch.map((t: any) => t.id));
      setSolverHealth(health);

      const act = sems.find((s: any) => s.isActive) || sems[0];
      if (act) {
        const sid = Number(act.id);
        setSelectedSemesterId(sid);
        await refreshActiveProcess(sid);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveProcess = async (semId: number, silent = false) => {
    if (!semId) return;
    try {
      const proc = await api.getActiveAdjudicacion(semId);
      if (proc && proc.active) {
        setActiveProc(proc);
        if (proc.process_id) {
          const td = await api.getTurnoActual(proc.process_id);
          setTurnData(td);
          if (!silent && td.mine_reserved) {
            setAssistSelectedKeys(td.mine_reserved.map((s: any) => `${s.course_id}|${s.section}|${s.session_type}`));
          }
          const res = await api.getResultadoHorario(proc.process_id);
          setSolverResult(res);
        }
      } else {
        setActiveProc(null);
        setTurnData(null);
        setSolverResult(null);
      }
    } catch (e: any) {
      if (!silent) console.error(e);
    }
  };

  const handlePresetChange = (preset: 'PAR' | 'IMPAR' | 'NIVELACION') => {
    setPeriodPreset(preset);
    const next: Record<number, 'NONE' | 'A' | 'AB'> = {};
    for (const c of ALL_CYCLES) {
      if (preset === 'PAR') next[c] = c % 2 === 0 ? 'AB' : 'NONE';
      else if (preset === 'IMPAR') next[c] = c % 2 === 1 ? 'AB' : 'NONE';
      else next[c] = 'A';
    }
    setCycleMode(next);
  };

  // Cálculo de horas del pool por ciclo según la malla
  const hoursPerSingleSectionByCycle = useMemo(() => {
    const map: Record<number, number> = {};
    for (const c of ALL_CYCLES) map[c] = 0;
    for (const course of courses) {
      const cyc = Number(course.cycleNumber || course.cycle_number || 0);
      if (!cyc || course.code === '14083') continue;
      const ht = evenUp(Number(course.hoursTheory ?? course.hours_theory ?? 0));
      const hp = evenUp(Number(course.hoursPractice ?? course.hours_practice ?? 0));
      const hl = (course.hasLab ?? course.has_lab) ? 4 : 0;
      map[cyc] = (map[cyc] || 0) + ht + hp + hl;
    }
    return map;
  }, [courses]);

  const estimatedPoolHours = useMemo(() => {
    let total = 0;
    for (const c of ALL_CYCLES) {
      const m = cycleMode[c];
      const mult = m === 'AB' ? 2 : m === 'A' ? 1 : 0;
      total += (hoursPerSingleSectionByCycle[c] || 0) * mult;
    }
    return total;
  }, [cycleMode, hoursPerSingleSectionByCycle]);

  const selectedRequiredHours = useMemo(() => {
    return orderedTeachers
      .filter(t => selectedTeacherIds.includes(t.id))
      .reduce((acc, t) => acc + Number(t.required_hours || 12), 0);
  }, [orderedTeachers, selectedTeacherIds]);

  // Auto-seleccionar subconjunto de docentes en orden de prelación que sume exactamente las horas del pool
  const handleAutoMatchTeachers = () => {
    const target = estimatedPoolHours;
    if (target <= 0) return;
    // DP subset sum respetando prioridad a los primeros en el orden de prelación
    const dp = new Map<number, number[]>();
    dp.set(0, []);
    for (const t of orderedTeachers) {
      const h = Number(t.required_hours || 12);
      const entries = Array.from(dp.entries());
      for (const [sum, list] of entries) {
        const nextSum = sum + h;
        if (nextSum <= target && !dp.has(nextSum)) {
          dp.set(nextSum, [...list, t.id]);
        }
      }
    }
    const exactMatch = dp.get(target);
    if (exactMatch) {
      setSelectedTeacherIds(exactMatch);
      setSuccessMsg(`Se seleccionaron ${exactMatch.length} docentes cuya carga reglamentaria suma exactamente ${target}h.`);
      setErrorMsg(null);
    } else {
      setErrorMsg(`No se encontró una combinación exacta de docentes para ${target}h con la plantilla actual.`);
    }
  };

  const handleStartProcess = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const cycleSections: Record<string, string[]> = {};
    for (const c of ALL_CYCLES) {
      if (cycleMode[c] === 'AB') cycleSections[String(c)] = ['A', 'B'];
      else if (cycleMode[c] === 'A') cycleSections[String(c)] = ['A'];
    }
    if (Object.keys(cycleSections).length === 0) {
      setErrorMsg('Seleccione al menos un ciclo académico para abrir.');
      return;
    }
    if (selectedTeacherIds.length === 0) {
      setErrorMsg('Seleccione al menos un docente participante.');
      return;
    }

    setIsBusy(true);
    try {
      const res = await api.iniciarAdjudicacion({
        semester_id: selectedSemesterId,
        period: periodPreset,
        cycle_sections: cycleSections,
        teacher_ids: selectedTeacherIds,
      });
      setSuccessMsg(`Proceso #${res.process_id} iniciado (${res.pool_sessions} sesiones, ${res.pool_hours}h).`);
      await refreshActiveProcess(selectedSemesterId);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al iniciar proceso');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSkipTurn = async () => {
    if (!activeProc?.process_id || !turnData?.teacher?.id) return;
    if (!window.confirm(`¿Omitir el turno de ${turnData.teacher.name}?`)) return;
    setIsBusy(true);
    setErrorMsg(null);
    try {
      await api.saltarTurno(activeProc.process_id, turnData.teacher.id);
      setSuccessMsg(`Turno de ${turnData.teacher.name} omitido.`);
      await refreshActiveProcess(selectedSemesterId);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleAssistSaveAndConfirm = async () => {
    if (!activeProc?.process_id || !turnData?.teacher?.id) return;
    setIsBusy(true);
    setErrorMsg(null);
    try {
      const sessionsPayload = assistSelectedKeys.map(k => {
        const [course_id, section, session_type] = k.split('|');
        return { course_id: Number(course_id), section, session_type };
      });
      const selRes = await api.seleccionarSesiones(activeProc.process_id, turnData.teacher.id, sessionsPayload);
      if (!selRes.exact) {
        setErrorMsg(selRes.message || 'La carga seleccionada no coincide con las horas reglamentarias.');
        return;
      }
      await api.confirmarTurno(activeProc.process_id, turnData.teacher.id);
      setSuccessMsg(`Carga de ${turnData.teacher.name} (${selRes.selected_hours}h) confirmada.`);
      setAssistSelectedKeys([]);
      setDirectorAssistMode(false);
      await refreshActiveProcess(selectedSemesterId);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!activeProc?.process_id) return;
    setIsBusy(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.generarHorario(activeProc.process_id, {
        time_limit_seconds: timeLimit,
        replace_existing: replaceExisting,
        allow_unassigned: allowUnassigned,
      });
      setSuccessMsg(
        `✔ Horario generado (v${res.version_id}): ${res.assignments_saved} bloques asignados con aula (${res.sessions_without_room} sin aula).`
      );
      await refreshActiveProcess(selectedSemesterId);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetProcess = async () => {
    if (!activeProc?.process_id) return;
    if (!window.confirm('¿Está seguro de reiniciar el proceso de adjudicación actual? Se borrarán las selecciones de este proceso.')) return;
    setIsBusy(true);
    setErrorMsg(null);
    try {
      await api.eliminarProcesoAdjudicacion(activeProc.process_id);
      setSuccessMsg('Proceso reiniciado. Puede configurar uno nuevo.');
      setActiveProc(null);
      setTurnData(null);
      setSolverResult(null);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsBusy(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Adjudicación y Solver CP-SAT">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <p className="text-gray-500 font-bold">Cargando sistema de adjudicación...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const assistSelectableSessions = [
    ...(turnData?.mine_reserved || []),
    ...(turnData?.available_sessions || []),
  ];
  const assistSelectedHours = assistSelectableSessions
    .filter(s => assistSelectedKeys.includes(`${s.course_id}|${s.section}|${s.session_type}`))
    .reduce((acc, s) => acc + Number(s.hours || 0), 0);

  return (
    <AdminLayout title="Adjudicación de Carga y Solver CP-SAT">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
        {/* Cabecera + Estado del Solver */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight">Adjudicación por Turnos y Generador CP-SAT</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                solverHealth?.solver_status === 'ok'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
                <span className={`size-2 rounded-full ${solverHealth?.solver_status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {solverHealth?.solver_status === 'ok' ? 'Motor OR-Tools CP-SAT Activo' : 'Solver Python en espera (Puerto 5000)'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Orden oficial UNT: Principal (20h) → Asociado (18h) → Auxiliar (16h) → Contratado (12h) · Lunes a Viernes (07:00 - 21:00) · Aulas Reales EPI.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-gray-500 uppercase">Semestre:</label>
            <select
              value={selectedSemesterId}
              onChange={async (e) => {
                const sid = Number(e.target.value);
                setSelectedSemesterId(sid);
                await refreshActiveProcess(sid);
              }}
              className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold"
            >
              {semesters.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.isActive ? '(Activo)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alertas */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm font-semibold flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="material-symbols-outlined text-lg">close</button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-sm font-semibold flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="material-symbols-outlined text-lg">close</button>
          </div>
        )}

        {/* VISTA 1: NO HAY PROCESO EN CURSO -> CONFIGURAR E INICIAR */}
        {!activeProc ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: Ciclos y Secciones por Ciclo */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h2 className="text-lg font-black">1. Ciclos y Secciones (Regulares y por Repetición)</h2>
                  <p className="text-xs text-gray-500">Configure qué ciclos abren secciones A+B (regulares) o solo sección A (repetición).</p>
                </div>
                <div className="flex gap-2">
                  {(['PAR', 'IMPAR', 'NIVELACION'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => handlePresetChange(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        periodPreset === p
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_CYCLES.map(c => {
                  const mode = cycleMode[c];
                  const baseH = hoursPerSingleSectionByCycle[c] || 0;
                  const totalH = mode === 'AB' ? baseH * 2 : mode === 'A' ? baseH : 0;
                  return (
                    <div
                      key={c}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        mode !== 'NONE'
                          ? 'border-primary/40 bg-blue-50/30 dark:bg-blue-900/10'
                          : 'border-gray-200 dark:border-gray-800 opacity-60'
                      }`}
                    >
                      <div>
                        <p className="font-black text-sm">Ciclo {c}° {c % 2 === 0 ? '(Par)' : '(Impar)'}</p>
                        <p className="text-xs text-gray-500">{baseH}h por sección → <strong className="text-primary">{totalH}h</strong></p>
                      </div>
                      <select
                        value={mode}
                        onChange={(e) => setCycleMode(prev => ({ ...prev, [c]: e.target.value as any }))}
                        className="h-9 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold"
                      >
                        <option value="NONE">Cerrado</option>
                        <option value="A">Solo A (Repetición)</option>
                        <option value="AB">A y B (Regular)</option>
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Resumen de Balance */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-gray-400">Horas del Pool (Cursos)</p>
                    <p className="text-2xl font-black text-primary">{estimatedPoolHours}h</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-gray-400">Horas Docentes Seleccionados</p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{selectedRequiredHours}h</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-gray-400">Balance</p>
                    <p className={`text-2xl font-black ${
                      estimatedPoolHours === selectedRequiredHours ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {estimatedPoolHours - selectedRequiredHours === 0
                        ? '✔ Exacto (0h)'
                        : `${estimatedPoolHours - selectedRequiredHours > 0 ? '+' : ''}${estimatedPoolHours - selectedRequiredHours}h`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoMatchTeachers}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">auto_fix_high</span>
                  Ajustar Equipo Exacto ({estimatedPoolHours}h)
                </button>
              </div>

              <button
                onClick={handleStartProcess}
                disabled={isBusy}
                className="h-12 w-full rounded-xl bg-primary hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">play_circle</span>
                {isBusy ? 'Iniciando proceso...' : 'Iniciar Proceso de Adjudicación por Turnos'}
              </button>
            </div>

            {/* Columna Derecha: Orden de Prelación Docente */}
            <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4 max-h-[700px]">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div>
                  <h2 className="text-lg font-black">2. Docentes Participantes ({selectedTeacherIds.length})</h2>
                  <p className="text-xs text-gray-500">Ordenados por Categoría y Orden de Prelación</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTeacherIds(
                      selectedTeacherIds.length === orderedTeachers.length ? [] : orderedTeachers.map(t => t.id)
                    )
                  }
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {selectedTeacherIds.length === orderedTeachers.length ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800 pr-1">
                {orderedTeachers.map((t, idx) => {
                  const checked = selectedTeacherIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedTeacherIds(prev =>
                              prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                            )
                          }
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-mono text-gray-400 w-5">#{idx + 1}</span>
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">{t.name}</p>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[t.category] || ''}`}>
                            {t.category} (Ord. {t.orden})
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-primary shrink-0">{t.required_hours}h</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* VISTA 2: PROCESO EN CURSO O COMPLETADO */
          <div className="flex flex-col gap-6">
            {/* Barra de Estado del Proceso */}
            <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Proceso</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black">#{activeProc.process_id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      activeProc.status === 'COMPLETADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {activeProc.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Ciclos y Secciones</span>
                  <p className="text-sm font-bold">
                    {activeProc.config?.cycle_sections
                      ? Object.entries(activeProc.config.cycle_sections)
                          .map(([c, s]: any) => `${c}°(${s.join('')})`)
                          .join(' · ')
                      : (activeProc.config?.cycles || []).map((c: number) => `${c}°`).join(', ')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Sesiones Libres</span>
                  <p className="text-sm font-black text-primary">
                    {activeProc.unassigned_sessions} sesiones ({activeProc.unassigned_hours}h / {activeProc.pool_hours}h)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => refreshActiveProcess(selectedSemesterId)}
                  className="px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Actualizar
                </button>
                {solverResult && (
                  <a
                    href={api.getExportExcelUrl(activeProc.process_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Descargar Excel (.xlsx)
                  </a>
                )}
                <button
                  onClick={handleResetProcess}
                  disabled={isBusy}
                  className="px-3.5 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">restart_alt</span>
                  Reiniciar Proceso
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Panel Izquierdo: Turno Actual o Generador CP-SAT */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {turnData?.status === 'EN_PROCESO' && turnData?.teacher ? (
                  <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border-2 border-primary/30 shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div>
                        <span className="text-[11px] font-black uppercase text-primary tracking-wider">
                          Turno Actual #{turnData.turno} — Esperando Selección del Docente
                        </span>
                        <h3 className="text-xl font-black mt-0.5">{turnData.teacher.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${CAT_COLORS[turnData.teacher.category] || ''}`}>
                            {turnData.teacher.category} · Orden {turnData.teacher.orden}
                          </span>
                          <span className="text-xs text-gray-500">
                            Debe cubrir exactamente <strong>{turnData.teacher.required_hours}h</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setDirectorAssistMode(!directorAssistMode);
                            setAssistSelectedKeys(
                              (turnData.mine_reserved || []).map((s: any) => `${s.course_id}|${s.section}|${s.session_type}`)
                            );
                          }}
                          className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-primary text-xs font-bold hover:bg-blue-100"
                        >
                          {directorAssistMode ? 'Ocultar Asistencia' : 'Adjudicar desde Dirección'}
                        </button>
                        <button
                          onClick={handleSkipTurn}
                          disabled={isBusy}
                          className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold"
                        >
                          Saltar Turno
                        </button>
                      </div>
                    </div>

                    {!directorAssistMode ? (
                      <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-2xl">how_to_reg</span>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">
                            El docente puede ingresar desde su cuenta a &ldquo;Adjudicación de Carga&rdquo; para elegir y confirmar sus {turnData.teacher.required_hours}h.
                          </p>
                          <p className="mt-0.5">
                            Esta pantalla se actualiza automáticamente cada 5 segundos cuando el docente confirma su turno.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl">
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold">
                              Seleccionadas: <strong className="text-primary text-base">{assistSelectedHours}h</strong> / {turnData.teacher.required_hours}h
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              assistSelectedHours === turnData.teacher.required_hours
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {assistSelectedHours === turnData.teacher.required_hours
                                ? '✔ Carga exacta'
                                : assistSelectedHours < turnData.teacher.required_hours
                                ? `Faltan ${turnData.teacher.required_hours - assistSelectedHours}h`
                                : `Excede por ${assistSelectedHours - turnData.teacher.required_hours}h`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={filterCycle}
                              onChange={(e) => setFilterCycle(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                              className="h-8 px-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold"
                            >
                              <option value="ALL">Todos los ciclos</option>
                              {(activeProc.config?.cycles || []).map((c: number) => (
                                <option key={c} value={c}>Ciclo {c}°</option>
                              ))}
                            </select>
                            <button
                              onClick={handleAssistSaveAndConfirm}
                              disabled={isBusy || assistSelectedHours !== turnData.teacher.required_hours}
                              className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-40"
                            >
                              Confirmar {turnData.teacher.required_hours}h
                            </button>
                          </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
                          {assistSelectableSessions
                            .filter(s => filterCycle === 'ALL' || s.cycle === filterCycle)
                            .map((s: any) => {
                              const key = `${s.course_id}|${s.section}|${s.session_type}`;
                              const selected = assistSelectedKeys.includes(key);
                              return (
                                <label
                                  key={key}
                                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-2 transition-all ${
                                    selected
                                      ? 'border-primary bg-primary/10 font-bold'
                                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() =>
                                        setAssistSelectedKeys(prev =>
                                          prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
                                        )
                                      }
                                      className="rounded text-primary"
                                    />
                                    <div className="truncate">
                                      <p className="truncate font-bold">{s.cycle}°{s.section} · {s.course_name}</p>
                                      <p className="text-[10px] text-gray-500">{s.session_type}</p>
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 rounded bg-white dark:bg-gray-900 font-black text-primary shrink-0">
                                    {s.hours}h
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Panel de Generación de Horario con OR-Tools CP-SAT */}
                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">memory</span>
                        Generador de Horario Automático (OR-Tools CP-SAT)
                      </h3>
                      <p className="text-xs text-gray-500">
                        Respeta disponibilidad docente, evita cruces de sección/docente y asigna las 8 aulas reales EPI (C6: 5 teóricas + 3 laboratorios).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Tiempo límite CP-SAT (s)</label>
                      <input
                        type="number"
                        min={15}
                        max={600}
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={replaceExisting}
                        onChange={(e) => setReplaceExisting(e.target.checked)}
                        className="rounded text-primary"
                      />
                      <span>Reemplazar horario previo del semestre</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowUnassigned}
                        onChange={(e) => setAllowUnassigned(e.target.checked)}
                        className="rounded text-primary"
                      />
                      <span>Permitir sesiones sin adjudicar</span>
                    </label>
                  </div>

                  <button
                    onClick={handleGenerateSchedule}
                    disabled={isBusy || activeProc.teachers?.some((t: any) => t.status === 'PENDIENTE')}
                    className="h-12 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <span className={`material-symbols-outlined ${isBusy ? 'animate-spin' : ''}`}>
                      {isBusy ? 'sync' : 'bolt'}
                    </span>
                    {isBusy
                      ? 'Ejecutando OR-Tools CP-SAT...'
                      : activeProc.teachers?.some((t: any) => t.status === 'PENDIENTE')
                      ? 'Complete o salte los turnos pendientes para generar el horario'
                      : 'Generar Horario Oficial con CP-SAT'}
                  </button>

                  {/* Resultado del Solver */}
                  {solverResult && (
                    <div className="mt-2 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">
                            ✔ Último Horario Generado — Versión {solverResult.version_id}
                          </span>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {solverResult.sessions?.length || 0} bloques programados · {solverResult.unplaced?.length || 0} sin aula · Fecha: {solverResult.created_at}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to="/horario/docente"
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-primary hover:bg-gray-50"
                          >
                            Ver por Docente
                          </Link>
                          <Link
                            to="/horario/aula"
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-primary hover:bg-gray-50"
                          >
                            Ver por Aula EPI
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabla de Sesiones del Pool */}
                <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black">Pool de Sesiones ({activeProc.sessions?.length || 0})</h3>
                    <select
                      value={filterCycle}
                      onChange={(e) => setFilterCycle(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="h-8 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold"
                    >
                      <option value="ALL">Todos los ciclos</option>
                      {(activeProc.config?.cycles || []).map((c: number) => (
                        <option key={c} value={c}>Ciclo {c}°</option>
                      ))}
                    </select>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase sticky top-0">
                        <tr>
                          <th className="p-2.5">Ciclo/Sec</th>
                          <th className="p-2.5">Curso</th>
                          <th className="p-2.5">Tipo</th>
                          <th className="p-2.5 text-center">Horas</th>
                          <th className="p-2.5">Docente Adjudicado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {(activeProc.sessions || [])
                          .filter((s: any) => filterCycle === 'ALL' || s.cycle === filterCycle)
                          .map((s: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                              <td className="p-2.5 font-black text-primary">{s.cycle}°{s.section}</td>
                              <td className="p-2.5 font-semibold">{s.course_name}</td>
                              <td className="p-2.5">{s.session_type}</td>
                              <td className="p-2.5 text-center font-bold">{s.hours}h</td>
                              <td className="p-2.5">
                                {s.teacher_name ? (
                                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    {s.teacher_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Disponible</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Panel Derecho: Cola de Turnos Docente */}
              <div className="bg-white dark:bg-[#1a202c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4 max-h-[820px]">
                <div>
                  <h3 className="text-base font-black">Cola de Turnos por Categoría</h3>
                  <p className="text-xs text-gray-500">
                    Confirmados: {(activeProc.teachers || []).filter((t: any) => t.status === 'CONFIRMADO').length} / {(activeProc.teachers || []).length}
                  </p>
                </div>
                <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800 pr-1">
                  {(activeProc.teachers || []).map((t: any) => {
                    const isCurrent = activeProc.current_turn?.teacher_id === t.teacher_id;
                    return (
                      <div
                        key={t.teacher_id}
                        className={`p-3 rounded-xl flex items-center justify-between gap-2 ${
                          isCurrent ? 'bg-primary/10 border border-primary/30' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-400">#{t.turno}</span>
                            <p className="text-xs font-bold truncate">{t.name}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[t.category] || ''}`}>
                              {t.category}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {t.confirmed_hours}h / {t.required_hours}h
                            </span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                          t.status === 'CONFIRMADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'OMITIDO'
                            ? 'bg-gray-200 text-gray-600'
                            : isCurrent
                            ? 'bg-primary text-white animate-pulse'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isCurrent ? 'EN TURNO' : t.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAdjudicacion;
