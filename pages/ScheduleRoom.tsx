
import React, { useState, useEffect } from 'react';
import { Classroom } from '../types';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

const ScheduleRoom: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('DIRECTOR');

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'DIRECTOR');
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      const { api } = await import('../services/api');
      const data = await api.getClassrooms();
      setClassrooms(data);
      if (data.length > 0) {
        setSelectedRoomId(data[0].id.toString()); // Ensure string
      }
    } catch (error) {
      console.error("Error loading classrooms:", error);
    }
  };

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      const room = classrooms.find(r => r.id.toString() === selectedRoomId);
      const newData = [];
      if (room?.type === 'Laboratorio') {
        newData.push({ day: 'Martes', hour: '10:00', course: 'Arquitectura de Computadoras', teacher: 'Dr. Carlos Sánchez', type: 'Lab' });
        newData.push({ day: 'Jueves', hour: '15:00', course: 'Redes I', teacher: 'Mg. María Rodríguez', type: 'Lab' });
      } else {
        newData.push({ day: 'Lunes', hour: '08:00', course: 'Ingeniería de Software', teacher: 'Dr. Juan Pérez', type: 'Teo' });
        newData.push({ day: 'Miércoles', hour: '11:00', course: 'Sistemas Operativos', teacher: 'Ing. Pedro Luis', type: 'Teo' });
      }
      setScheduleData(newData);
      setIsLoading(false);
    }, 600);
  };

  const getHourRange = (hour: string) => {
    const [h] = hour.split(':').map(Number);
    const nextH = h + 1;
    const nextHStr = nextH < 10 ? `0${nextH}` : `${nextH}`;
    return `${hour} - ${nextHStr}:00`;
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Ocupación de Ambientes</h1>
        <p className="text-[#616f89] dark:text-gray-400 text-sm">Gestione el uso de laboratorios y aulas teóricas de la facultad.</p>
      </div>

      <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-[#dbdfe6] dark:border-[#2a3140] shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="material-symbols-outlined text-primary text-[18px]">meeting_room</span>
              Aula / Ambiente
            </label>
            <div className="relative">
              <select
                className="w-full h-12 pl-4 pr-10 rounded-lg border border-[#dbdfe6] dark:border-[#2a3140] bg-white dark:bg-[#101622] text-[#111318] dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-primary outline-none"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
              >
                {classrooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-gray-400">expand_more</span>
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full md:w-auto h-12 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>
              {isLoading ? 'sync' : 'search'}
            </span>
            {isLoading ? 'Consultando...' : 'Consultar Disponibilidad'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-[#dbdfe6] dark:border-[#2a3140] overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 flex flex-wrap justify-between items-center border-b border-gray-200 dark:border-gray-700 gap-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-blue-500"></span>
              <span className="text-xs text-gray-500 font-bold">Clase Teórica</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-emerald-500"></span>
              <span className="text-xs text-gray-500 font-bold">Laboratorio</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visualizando:</span>
            <p className="text-xs font-black text-primary bg-primary/5 px-3 py-1 rounded-full ring-1 ring-primary/20">
              {classrooms.find(r => r.id.toString() === selectedRoomId)?.name}
            </p>
          </div>
        </div>

        <div className="overflow-auto flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px] z-30 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-primary">Cargando horario...</p>
              </div>
            </div>
          )}
          <table className="w-full border-collapse">
            <thead>
              <tr className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800 shadow-sm text-gray-600 dark:text-gray-300">
                <th className="w-32 p-4 border-b border-r border-gray-200 dark:border-gray-700"></th>
                {DAYS.map(day => (
                  <th key={day} className="p-4 border-b border-r border-gray-200 dark:border-gray-700 text-center min-w-[140px]">
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
                    const occupation = scheduleData.find(d => d.day === day && d.hour === hour);
                    return (
                      <td key={`${day}-${hour}`} className="p-1 border-b border-r border-gray-100 dark:border-gray-800 h-24 group relative hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        {occupation && (
                          <div className={`absolute inset-1 rounded-xl p-3 shadow-md z-10 flex flex-col justify-between overflow-hidden border-l-4 animate-in zoom-in-95 duration-300 ${occupation.type === 'Lab' ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500' : 'bg-blue-50 dark:bg-blue-900/40 border-blue-500'}`}>
                            <p className={`text-[10px] font-black leading-tight truncate ${occupation.type === 'Lab' ? 'text-emerald-800 dark:text-emerald-100' : 'text-blue-800 dark:text-blue-100'}`}>
                              {occupation.course}
                            </p>
                            <div className="mt-1">
                              <p className={`text-[9px] font-bold opacity-70 ${occupation.type === 'Lab' ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                {occupation.teacher}
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

export default ScheduleRoom;

