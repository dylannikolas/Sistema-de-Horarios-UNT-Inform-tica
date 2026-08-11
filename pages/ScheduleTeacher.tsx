
import React, { useState, useEffect } from 'react';
import { Teacher } from '../types';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

const ScheduleTeacher: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('DIRECTOR');

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') || 'DIRECTOR';
    setUserRole(savedRole);
    if (savedRole === 'DIRECTOR') {
      loadTeachers();
    } else if (savedRole === 'DOCENTE') {
      handleSearch();
    }
  }, []);

  const loadTeachers = async () => {
    try {
      const { api } = await import('../services/api');
      const data = await api.getTeachers();
      setTeachers(data);
      if (data.length > 0) {
        setSelectedTeacherId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      const seed = selectedTeacherId.length;
      const newData = [
        { day: seed % 2 === 0 ? 'Lunes' : 'Martes', hour: '08:00', course: 'Ingeniería de Software I', code: 'INF-101', room: 'Aula 204' },
        { day: seed % 2 === 0 ? 'Miércoles' : 'Jueves', hour: '11:00', course: 'Arquitectura', code: 'INF-203', room: 'Lab 04' }
      ];
      setScheduleData(newData);
      setIsLoading(false);
    }, 500);
  };

  const getHourRange = (hour: string) => {
    const [h] = hour.split(':').map(Number);
    const nextH = h + 1;
    const nextHStr = nextH < 10 ? `0${nextH}` : `${nextH}`;
    return `${hour} - ${nextHStr}:00`;
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight">
            {userRole === 'DIRECTOR' ? 'Consulta de Horario' : 'Mi Cronograma Semanal'}
          </h1>
          <p className="text-[#616f89] dark:text-gray-400 text-sm">
            {userRole === 'DIRECTOR'
              ? 'Visualice la distribución semanal de clases por docente.'
              : 'Horario oficial asignado para el semestre 2024-I.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors text-sm font-bold">
            <span className="material-symbols-outlined text-[18px]">download</span> PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors text-sm font-bold">
            <span className="material-symbols-outlined text-[18px]">print</span> Imprimir
          </button>
        </div>
      </div>

      {userRole === 'DIRECTOR' && (
        <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-[#dbdfe6] dark:border-[#2a3140] shadow-sm p-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-[#111318] dark:text-gray-300 mb-2">Seleccionar Docente</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#616f89]"><span className="material-symbols-outlined">person</span></span>
                <select
                  className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#dbdfe6] dark:border-[#2a3140] bg-white dark:bg-[#101622] text-[#111318] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-gray-400">expand_more</span>
              </div>
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full md:w-auto h-12 px-8 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>{isLoading ? 'sync' : 'search'}</span>
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
              <p className="text-xs font-bold text-primary">Actualizando tabla...</p>
            </div>
          </div>
        )}
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="w-32 p-4 border-b border-r border-gray-200 dark:border-gray-700"></th>
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
                  <td className="p-2 border-b border-r border-gray-200 dark:border-gray-700 text-right align-middle bg-gray-50/20">
                    <span className="text-[10px] font-black text-gray-400 whitespace-nowrap">{getHourRange(hour)}</span>
                  </td>
                  {DAYS.map(day => {
                    const entry = scheduleData.find(e => e.day === day && e.hour === hour);
                    return (
                      <td key={`${day}-${hour}`} className="p-1 border-b border-r border-gray-100 dark:border-gray-800 h-24 group relative hover:bg-gray-50/30 dark:hover:bg-gray-700/30">
                        {entry && (
                          <div className="absolute inset-1 rounded-xl bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500 p-3 shadow-md flex flex-col justify-between overflow-hidden z-10 animate-in slide-in-from-top-2 duration-300">
                            <div>
                              <p className="text-[9px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-tighter truncate">{entry.code}</p>
                              <p className="text-[11px] font-black text-blue-900 dark:text-white leading-tight mt-0.5">{entry.course}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-80">
                              <span className="material-symbols-outlined text-[12px] text-blue-700 dark:text-blue-400">place</span>
                              <p className="text-[9px] font-bold text-blue-700 dark:text-blue-400">{entry.room}</p>
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
