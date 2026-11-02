import React, { useState, useEffect, useMemo } from 'react';
import { TeacherLayout } from '../../components/TeacherLayout';
import { api } from '../../services/api';

const TeacherAdjudicacion: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [activeProc, setActiveProc] = useState<any>(null);
  const [turnData, setTurnData] = useState<any>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [filterCycle, setFilterCycle] = useState<number | 'ALL'>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.teacher_id) setTeacherId(Number(u.teacher_id));
    }
    loadStatus(true);
  }, []);

  // Refresco periódico cada 5s cuando el proceso está activo y aún no es mi turno
  useEffect(() => {
    if (!activeProc?.active || activeProc?.status !== 'EN_PROCESO') return;
    if (activeProc.current_turn?.teacher_id === teacherId) return; // No pisar selección mientras está eligiendo
    const timer = setInterval(() => loadStatus(false), 5000);
    return () => clearInterval(timer);
  }, [activeProc?.active, activeProc?.status, activeProc?.current_turn?.teacher_id, teacherId]);

  const loadStatus = async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const proc = await api.getActiveAdjudicacion();
      setActiveProc(proc);
      if (proc && proc.active && proc.process_id) {
        const td = await api.getTurnoActual(proc.process_id);
        setTurnData(td);
        const userStr = localStorage.getItem('user');
        const myTid = userStr ? Number(JSON.parse(userStr).teacher_id) : null;
        if (initial && td.teacher?.id === myTid && Array.isArray(td.mine_reserved)) {
          setSelectedKeys(td.mine_reserved.map((s: any) => `${s.course_id}|${s.section}|${s.session_type}`));
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      if (initial) setLoading(false);
    }
  };

  const myTurnRecord = useMemo(() => {
    if (!activeProc?.teachers || !teacherId) return null;
    return activeProc.teachers.find((t: any) => Number(t.teacher_id) === Number(teacherId)) || null;
  }, [activeProc, teacherId]);

  const isMyTurn = Boolean(
    activeProc?.status === 'EN_PROCESO' &&
    turnData?.teacher?.id &&
    Number(turnData.teacher.id) === Number(teacherId)
  );

  const myConfirmedSessions = useMemo(() => {
    if (!activeProc?.sessions || !teacherId) return [];
    return activeProc.sessions.filter((s: any) => Number(s.teacher_id) === Number(teacherId) && s.confirmed);
  }, [activeProc, teacherId]);

  const selectableSessions = useMemo(() => {
    if (!turnData) return [];
    return [...(turnData.mine_reserved || []), ...(turnData.available_sessions || [])];
  }, [turnData]);

  const selectedHours = useMemo(() => {
    return selectableSessions
      .filter(s => selectedKeys.includes(`${s.course_id}|${s.section}|${s.session_type}`))
      .reduce((acc, s) => acc + Number(s.hours || 0), 0);
  }, [selectableSessions, selectedKeys]);

  const requiredHours = Number(myTurnRecord?.required_hours || turnData?.teacher?.required_hours || 12);

  const toggleSession = (key: string) => {
    setSelectedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  const handleSaveSelection = async () => {
    if (!activeProc?.process_id || !teacherId) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload = selectedKeys.map(k => {
        const [course_id, section, session_type] = k.split('|');
        return { course_id: Number(course_id), section, session_type };
      });
      const res = await api.seleccionarSesiones(activeProc.process_id, teacherId, payload);
      setSuccessMsg(res.message);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTurn = async () => {
    if (!activeProc?.process_id || !teacherId) return;
    if (selectedHours !== requiredHours) {
      setErrorMsg(`Debe cubrir exactamente ${requiredHours}h reglamentarias (actualmente tiene ${selectedHours}h).`);
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload = selectedKeys.map(k => {
        const [course_id, section, session_type] = k.split('|');
        return { course_id: Number(course_id), section, session_type };
      });
      await api.seleccionarSesiones(activeProc.process_id, teacherId, payload);
      await api.confirmarTurno(activeProc.process_id, teacherId);
      setSuccessMsg(`✔ ¡Su carga lectiva de ${requiredHours}h ha sido confirmada exitosamente!`);
      await loadStatus(false);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout title="Adjudicación de Carga Lectiva">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <p className="text-gray-500 font-bold">Consultando turno de adjudicación...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Adjudicación de Carga por Turnos">
      <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-200 text-sm font-bold flex justify-between items-center">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="material-symbols-outlined">close</button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 text-emerald-700 dark:text-emerald-200 text-sm font-bold flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="material-symbols-outlined">close</button>
          </div>
        )}

        {!activeProc || !activeProc.active ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 border border-gray-100 dark:border-gray-700 text-center shadow-sm">
            <span className="material-symbols-outlined text-primary text-6xl mb-3">hourglass_empty</span>
            <h2 className="text-xl font-black mb-2">Proceso de Adjudicación No Iniciado</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              El Director de Escuela aún no ha iniciado el proceso de adjudicación de carga lectiva para el semestre activo.
            </p>
          </div>
        ) : (
          <>
            {/* Resumen de mi turno */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-primary tracking-wider">
                    Proceso #{activeProc.process_id} · {activeProc.config?.period || '2026-2'}
                  </span>
                  {myTurnRecord && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                      myTurnRecord.status === 'CONFIRMADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : isMyTurn
                        ? 'bg-primary text-white animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isMyTurn ? 'ES SU TURNO AHORA' : `Estado: ${myTurnRecord.status}`}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black mt-1">
                  {myTurnRecord
                    ? `Su Turno de Prelación: #${myTurnRecord.turno} (${myTurnRecord.category} · Orden ${myTurnRecord.orden})`
                    : 'Vista de Adjudicación'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {activeProc.current_turn
                    ? `Turno actual en curso: #${activeProc.current_turn.turno} — ${activeProc.current_turn.name} (${activeProc.current_turn.category})`
                    : 'Todos los turnos de adjudicación han finalizado.'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-2xl text-right">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Carga Reglamentaria Exacta</p>
                  <p className="text-2xl font-black text-primary">{requiredHours}h</p>
                </div>
                <button
                  onClick={() => loadStatus(false)}
                  className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Actualizar estado"
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
              </div>
            </div>

            {/* SI YA CONFIRMÓ SU CARGA */}
            {myTurnRecord?.status === 'CONFIRMADO' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                  <h3 className="text-lg font-black">Su Carga Adjudicada Confirmada ({myTurnRecord.confirmed_hours}h / {requiredHours}h)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myConfirmedSessions.map((s: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/60 flex items-center justify-between">
                      <div>
                        <p className="font-black text-sm">{s.cycle}°{s.section} · {s.course_name}</p>
                        <p className="text-xs text-gray-500">Sesión de {s.session_type}</p>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-white dark:bg-gray-900 font-black text-emerald-700 text-sm">
                        {s.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SI ES SU TURNO AHORA: PANEL DE SELECCIÓN INTERACTIVO */}
            {isMyTurn && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border-2 border-primary shadow-xl flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-primary">Seleccione sus Cursos y Sesiones</h3>
                    <p className="text-xs text-gray-500">
                      Elija sesiones de Teoría (2h), Práctica (2h/4h) o Laboratorio (4h) hasta cubrir exactamente <strong>{requiredHours}h</strong>.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl font-black text-sm ${
                      selectedHours === requiredHours
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedHours > requiredHours
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      Seleccionadas: {selectedHours}h / {requiredHours}h
                      {selectedHours === requiredHours
                        ? ' (✔ Exacto)'
                        : selectedHours < requiredHours
                        ? ` (Faltan ${requiredHours - selectedHours}h)`
                        : ` (Excede +${selectedHours - requiredHours}h)`}
                    </div>

                    <button
                      onClick={handleSaveSelection}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl border border-primary text-primary font-bold text-xs hover:bg-primary/5"
                    >
                      Guardar Reserva
                    </button>

                    <button
                      onClick={handleConfirmTurn}
                      disabled={isSubmitting || selectedHours !== requiredHours}
                      className="px-6 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/30 disabled:opacity-40"
                    >
                      Confirmar Carga Definitiva ({requiredHours}h)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">
                    Sesiones disponibles: {selectableSessions.length}
                  </span>
                  <select
                    value={filterCycle}
                    onChange={(e) => setFilterCycle(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="h-9 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold"
                  >
                    <option value="ALL">Todos los ciclos habilitados</option>
                    {(activeProc.config?.cycles || []).map((c: number) => (
                      <option key={c} value={c}>Ciclo {c}°</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                  {selectableSessions
                    .filter(s => filterCycle === 'ALL' || s.cycle === filterCycle)
                    .map((s: any) => {
                      const key = `${s.course_id}|${s.section}|${s.session_type}`;
                      const checked = selectedKeys.includes(key);
                      return (
                        <div
                          key={key}
                          onClick={() => toggleSession(key)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            checked
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="rounded text-primary pointer-events-none"
                            />
                            <div className="min-w-0">
                              <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 mb-1">
                                Ciclo {s.cycle}° · Sección {s.section}
                              </span>
                              <p className="text-xs font-black truncate">{s.course_name}</p>
                              <p className="text-[11px] text-gray-500 font-semibold">{s.session_type}</p>
                            </div>
                          </div>
                          <span className="text-sm font-black text-primary bg-white dark:bg-gray-900 px-2.5 py-1 rounded-xl border border-gray-100 dark:border-gray-700 shrink-0">
                            {s.hours}h
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* SI AÚN NO ES SU TURNO: VISTA DE ESPERA Y COLA */}
            {!isMyTurn && myTurnRecord?.status === 'PENDIENTE' && (
              <div className="bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-3xl flex items-center gap-4">
                <span className="material-symbols-outlined text-amber-500 text-4xl">schedule</span>
                <div>
                  <h3 className="font-black text-amber-900 dark:text-amber-200">
                    En espera de su turno (#{myTurnRecord.turno})
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                    Actualmente está eligiendo el turno #{activeProc.current_turn?.turno} ({activeProc.current_turn?.name}). Cuando llegue su turno, esta pantalla habilitará automáticamente la selección de cursos.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherAdjudicacion;
