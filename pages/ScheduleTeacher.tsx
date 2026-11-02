import React, { useState, useEffect } from 'react';
import { Teacher } from '../types';
import { api } from '../services/api';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

function expandAssignmentHours(a: any) {
  const startH = parseInt(String(a.start_time || '07:00').slice(0, 2), 10);
  const endH = parseInt(String(a.end_time || '09:00').slice(0, 2), 10);
  const out: any[] = [];
  for (let h = startH; h < endH; h++) {
    out.push({
      ...a,
      day: a.day_of_week,
      hour: `${h < 10 ? '0' : ''}${h}:00`,
      isStart: h === startH,
      totalHours: endH - startH,
    });
  }
  return out;
}

const ScheduleTeacher: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('DIRECTOR');

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') || 'DIRECTOR';
    setUserRole(savedRole);
    if (savedRole === 'DIRECTOR' || savedRole === 'ADMIN') {
      loadTeachers();
    } else {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.teacher_id) {
          setSelectedTeacherId(String(u.teacher_id));
          fetchSchedule(String(u.teacher_id));
        }
      }
    }
  }, []);

  const loadTeachers = async () => {
    try {
      const data = await api.getTeachers();
      const docentes = data.filter((t: any) => t.role === 'DOCENTE' || !t.role);
      setTeachers(docentes.length ? docentes : data);
      if (docentes.length > 0) {
        const firstId = String(docentes[0].id);
        setSelectedTeacherId(firstId);
        await fetchSchedule(firstId);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const fetchSchedule = async (tid?: string) => {
    const targetId = tid ?? selectedTeacherId;
    if (!targetId) return;
    setIsLoading(true);
    try {
      const raw = await api.getAssignments({ teacher_id: targetId });
      const expanded = raw.flatMap(expandAssignmentHours);
      setScheduleData(expanded);
    } catch (e) {
      console.error('Error loading schedule:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getHourRange = (hour: string) => {
    const [h] = hour.split(':').map(Number);
    const nextH = h + 1;
    const nextHStr = nextH < 10 ? `0${nextH}` : `${nextH}`;
    return `${hour} - ${nextHStr}:00`;
  };

  const totalAssignedHours = scheduleData.length;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight">
            {userRole === 'DOCENTE' ? 'Mi Horario Lectivo Oficial' : 'Horario por Docente'}
          </h1>
          <p className="text-[#616f89] dark:text-gray-400 text-sm">
            Distribución semanal Lunes a Viernes (07:00 - 21:00) · Total programado: <strong className="text-primary">{totalAssignedHours}h</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors text-sm font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">print</span> Imprimir
          </button>
        </div>
      </div>

      {(userRole === 'DIRECTOR' || userRole === 'ADMIN') && (
        <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-[#dbdfe6] dark:border-[#2a3140] shadow-sm p-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-[#111318] dark:text-gray-300 mb-2">Seleccionar Docente</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#616f89]">
                  <span className="material-symbols-outlined">person</span>
                </span>
                <select
                  className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#dbdfe6] dark:border-[#2a3140] bg-white dark:bg-[#101622] text-[#111318] dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none font-semibold"
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    fetchSchedule(e.target.value);
                  }}
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category} - {t.requiredHours || t.maxHours}h)
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-gray-400">
                  expand_more
                </span>
              </div>
            </div>
            <button
              onClick={() => fetchSchedule()}
              disabled={isLoading}
              className="w-full md:w-auto h-12 px-8 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>
                {isLoading ? 'sync' : 'search'}
              </span>
              Consultar
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white dark:bg-[#1a202c] border border-[#dbdfe6] dark:border-[#2a3140] rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px] z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-primary">Cargando horario desde la base de datos...</p>
            </div>
          </div>
        )}
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="w-32 p-4 border-b border-r border-gray-200 dark:border-gray-700 text-center text-[10px] font-black uppercase text-gray-400">
                  Hora
                </th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 border-b border-r border-gray-200 dark:border-gray-700 text-center min-w-[160px]">
                    <span className="text-[11px] font-black uppercase tracking-widest">{day}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="p-2 border-b border-r border-gray-200 dark:border-gray-700 text-center align-middle bg-gray-50/20">
                    <span className="text-[11px] font-black text-gray-500 whitespace-nowrap">{getHourRange(hour)}</span>
                  </td>
                  {DAYS.map(day => {
                    const entry = scheduleData.find(e => e.day === day && e.hour === hour);
                    const isLab = entry?.session_type === 'Laboratorio';
                    const isPract = entry?.session_type === 'Práctica' || entry?.session_type === 'Practica';
                    return (
                      <td key={`${day}-${hour}`} className="p-1 border-b border-r border-gray-100 dark:border-gray-800 h-20 relative">
                        {entry && (
                          <div
                            className={`h-full w-full rounded-xl p-2.5 shadow-sm flex flex-col justify-between overflow-hidden border-l-4 ${
                              isLab
                                ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500 text-amber-900 dark:text-amber-100'
                                : isPract
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-900 dark:text-emerald-100'
                                : 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-100'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-black uppercase tracking-tighter opacity-80">
                                  {entry.cycle_number || entry.cycle}°{entry.section || ''} · {entry.session_type || 'Clase'}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/70 dark:bg-black/30">
                                  {entry.classroom_name}
                                </span>
                              </div>
                              <p className="text-[11px] font-black leading-tight mt-0.5 line-clamp-2">
                                {entry.course_name}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTeacher;
