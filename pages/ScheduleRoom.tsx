import React, { useState, useEffect } from 'react';
import { Classroom } from '../types';
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
    });
  }
  return out;
}

const ScheduleRoom: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<any[]>([]);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      const data = await api.getClassrooms();
      setClassrooms(data);
      if (data.length > 0) {
        const firstId = String(data[0].id);
        setSelectedRoomId(firstId);
        await fetchRoomSchedule(firstId);
      }
    } catch (error) {
      console.error('Error loading classrooms:', error);
    }
  };

  const fetchRoomSchedule = async (rid?: string) => {
    const targetId = rid ?? selectedRoomId;
    if (!targetId) return;
    setIsLoading(true);
    try {
      const raw = await api.getAssignments({ classroom_id: targetId });
      setScheduleData(raw.flatMap(expandAssignmentHours));
    } catch (error) {
      console.error('Error loading room schedule:', error);
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

  const currentRoom = classrooms.find(r => String(r.id) === String(selectedRoomId));

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Ocupación de Aulas Reales EPI</h1>
        <p className="text-[#616f89] dark:text-gray-400 text-sm">
          Aulas Teóricas (POOL-17, POOL-18, INFO-2, INFO-3, INFO-5: Teoría y Práctica) y Laboratorios (LAB-A, LAB-B, LAB-C: Laboratorio 4h).
        </p>
      </div>

      <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-[#dbdfe6] dark:border-[#2a3140] shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="material-symbols-outlined text-primary text-[18px]">meeting_room</span>
              Seleccionar Ambiente EPI
            </label>
            <div className="relative">
              <select
                className="w-full h-12 pl-4 pr-10 rounded-lg border border-[#dbdfe6] dark:border-[#2a3140] bg-white dark:bg-[#101622] text-[#111318] dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-primary outline-none font-bold"
                value={selectedRoomId}
                onChange={(e) => {
                  setSelectedRoomId(e.target.value);
                  fetchRoomSchedule(e.target.value);
                }}
              >
                {classrooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.type} (Capacidad: {r.capacity})
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-gray-400">
                expand_more
              </span>
            </div>
          </div>
          <button
            onClick={() => fetchRoomSchedule()}
            disabled={isLoading}
            className="w-full md:w-auto h-12 px-8 rounded-lg bg-primary hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>
              {isLoading ? 'sync' : 'search'}
            </span>
            {isLoading ? 'Consultando...' : 'Actualizar Ocupación'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-[#dbdfe6] dark:border-[#2a3140] overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 flex flex-wrap justify-between items-center border-b border-gray-200 dark:border-gray-700 gap-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-blue-500"></span>
              <span className="text-xs text-gray-500 font-bold">Teoría</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-emerald-500"></span>
              <span className="text-xs text-gray-500 font-bold">Práctica</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-amber-500"></span>
              <span className="text-xs text-gray-500 font-bold">Laboratorio (4h)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ambiente:</span>
            <p className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
              {currentRoom?.name} ({currentRoom?.type}) · {scheduleData.length}h ocupadas
            </p>
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px] z-30 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-primary">Cargando horario del aula...</p>
              </div>
            </div>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800 shadow-sm text-gray-600 dark:text-gray-300">
                <th className="w-32 p-4 border-b border-r border-gray-200 dark:border-gray-700 text-center text-[10px] font-black uppercase text-gray-400">
                  Hora
                </th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 border-b border-r border-gray-200 dark:border-gray-700 text-center min-w-[150px]">
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
                    const occupation = scheduleData.find(d => d.day === day && d.hour === hour);
                    const isLab = occupation?.session_type === 'Laboratorio';
                    const isPract = occupation?.session_type === 'Práctica' || occupation?.session_type === 'Practica';
                    return (
                      <td key={`${day}-${hour}`} className="p-1 border-b border-r border-gray-100 dark:border-gray-800 h-20 relative">
                        {occupation && (
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
                              <span className="text-[9px] font-black uppercase opacity-80">
                                {occupation.cycle_number || occupation.cycle}°{occupation.section || ''} · {occupation.session_type || 'Clase'}
                              </span>
                              <p className="text-[11px] font-black leading-tight truncate mt-0.5">
                                {occupation.course_name}
                              </p>
                            </div>
                            <p className="text-[9px] font-bold opacity-80 truncate">
                              {occupation.teacher_name}
                            </p>
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

export default ScheduleRoom;
