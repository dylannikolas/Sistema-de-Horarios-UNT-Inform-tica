import React, { useState, useRef, useEffect } from 'react';
import { TeacherLayout } from '../../components/TeacherLayout';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

type SlotType = 'MANDATORY' | 'OPTIONAL';

/** Devuelve la hora par correspondiente dentro del mismo bloque de 2h (07-09, 09-11, ..., 19-21). */
function getBlockPairHours(hour: string): [string, string] {
  const h = parseInt(hour.split(':')[0], 10);
  const startH = h % 2 === 1 ? h : h - 1;
  const h1 = `${startH < 10 ? '0' : ''}${startH}:00`;
  const h2 = `${startH + 1 < 10 ? '0' : ''}${startH + 1}:00`;
  return [h1, h2];
}

const TeacherAvailability: React.FC = () => {
  const [slots, setSlots] = useState<Record<string, SlotType>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [requiredHours, setRequiredHours] = useState<number>(12);
  const [selectByBlock, setSelectByBlock] = useState<boolean>(true);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      if (!user.teacher_id) return;

      setTeacherId(String(user.teacher_id));
      const { api } = await import('../../services/api');
      const [teacher, availability] = await Promise.all([
        api.getTeacher(String(user.teacher_id)),
        api.getTeacherAvailability(String(user.teacher_id)),
      ]);

      if (teacher?.requiredHours || teacher?.maxHours) {
        setRequiredHours(Number(teacher.requiredHours || teacher.maxHours || 12));
      }

      const loadedSlots: Record<string, SlotType> = {};
      availability.forEach((slot: any) => {
        if (DAYS.includes(slot.day)) {
          const key = `${slot.day}-${slot.hour.slice(0, 5)}`;
          loadedSlots[key] = slot.is_optional ? 'OPTIONAL' : 'MANDATORY';
        }
      });

      setSlots(loadedSlots);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (day: string, hour: string) => {
    const key = `${day}-${hour}`;
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      handleSlotDoubleClick(day, hour);
      return;
    }

    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      setSlots(prev => {
        const newSlots = { ...prev };
        const keysToToggle = selectByBlock
          ? getBlockPairHours(hour).map(h => `${day}-${h}`)
          : [key];

        const isSelected = Boolean(newSlots[key]);
        if (isSelected) {
          keysToToggle.forEach(k => delete newSlots[k]);
        } else {
          const currentMand = Object.values(newSlots).filter(v => v === 'MANDATORY').length;
          const assignType: SlotType = currentMand < requiredHours ? 'MANDATORY' : 'OPTIONAL';
          keysToToggle.forEach(k => {
            newSlots[k] = assignType;
          });
        }
        return newSlots;
      });
    }, 180);
  };

  const handleSlotDoubleClick = (day: string, hour: string) => {
    const key = `${day}-${hour}`;
    setSlots(prev => {
      if (!prev[key]) return prev;
      const newType: SlotType = prev[key] === 'MANDATORY' ? 'OPTIONAL' : 'MANDATORY';
      const keysToUpdate = selectByBlock
        ? getBlockPairHours(hour).map(h => `${day}-${h}`)
        : [key];
      const next = { ...prev };
      keysToUpdate.forEach(k => {
        if (next[k]) next[k] = newType;
      });
      return next;
    });
  };

  const handleSelectAllWeek = () => {
    const all: Record<string, SlotType> = {};
    let count = 0;
    for (const day of DAYS) {
      for (const hour of HOURS) {
        all[`${day}-${hour}`] = count < requiredHours ? 'MANDATORY' : 'OPTIONAL';
        count++;
      }
    }
    setSlots(all);
  };

  const handleClearAll = () => setSlots({});

  const mandatoryCount = Object.values(slots).filter(v => v === 'MANDATORY').length;
  const optionalCount = Object.values(slots).filter(v => v === 'OPTIONAL').length;
  const totalSelected = mandatoryCount + optionalCount;
  const isComplete = totalSelected >= requiredHours;

  const handleSave = async () => {
    if (totalSelected < requiredHours) {
      alert(`Su categoría requiere declarar al menos ${requiredHours} horas disponibles (actualmente ${totalSelected}h).`);
      return;
    }
    if (!teacherId) return;

    setIsSubmitting(true);
    try {
      const { api } = await import('../../services/api');
      const availability = Object.entries(slots).map(([key, type]) => {
        const [day, hour] = key.split('-');
        return { day, hour, is_optional: type === 'OPTIONAL' };
      });
      await api.saveTeacherAvailability(teacherId, availability);
      alert('✅ Su disponibilidad horaria (Lunes a Viernes) ha sido guardada exitosamente.');
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('❌ Error al guardar la disponibilidad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHourRange = (hour: string) => {
    const [h] = hour.split(':').map(Number);
    const nextH = h + 1;
    const nextHStr = nextH < 10 ? `0${nextH}` : `${nextH}`;
    return `${hour} - ${nextHStr}:00`;
  };

  return (
    <TeacherLayout title="Declarar Disponibilidad (Lunes a Viernes)">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-stretch bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl gap-6">
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">edit_calendar</span>
              </div>
              <h2 className="text-xl font-black text-gray-800 dark:text-white">
                Disponibilidad Horaria (Mínimo {requiredHours}h reglamentarias)
              </h2>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed max-w-xl">
              Las sesiones se programan en bloques de 2 horas (07-09, 09-11, 11-13, 13-15, 15-17, 17-19, 19-21) de <strong>Lunes a Viernes</strong>. Se recomienda declarar más horas que su mínimo reglamentario ({requiredHours}h) para facilitar la optimización sin cruces.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectByBlock}
                  onChange={(e) => setSelectByBlock(e.target.checked)}
                  className="rounded text-primary"
                />
                Seleccionar por bloques completos de 2h
              </label>
              <button
                type="button"
                onClick={handleSelectAllWeek}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
              >
                Marcar toda la semana
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
              >
                Limpiar todo
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:border-l lg:pl-8 border-gray-100 dark:border-gray-700">
            <div className="flex flex-col gap-1 min-w-[130px]">
              <div className="flex justify-between text-[10px] font-black uppercase text-blue-600">
                <span>Total Declarado</span>
                <span>{totalSelected}h (Mín. {requiredHours}h)</span>
              </div>
              <div className="h-3 w-full bg-blue-50 dark:bg-blue-900/20 rounded-full overflow-hidden border border-blue-100">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min((totalSelected / requiredHours) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSubmitting || loading}
              className={`px-8 h-14 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 flex items-center gap-2 ${
                isComplete ? 'bg-primary hover:bg-blue-700 shadow-blue-500/30' : 'bg-gray-300 cursor-not-allowed text-gray-500'
              }`}
            >
              <span className={`material-symbols-outlined ${isSubmitting ? 'animate-spin' : ''}`}>
                {isSubmitting ? 'sync' : 'save'}
              </span>
              {isSubmitting ? 'Guardando...' : 'Guardar Disponibilidad'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="w-36 p-4 border-r border-b border-gray-100 dark:border-gray-700 text-center">
                    <span className="text-[10px] font-black uppercase text-gray-400">Hora (07:00 - 21:00)</span>
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="p-4 border-r border-b border-gray-100 dark:border-gray-700 text-center">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">{day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour, hIdx) => {
                  const isBlockEnd = hIdx % 2 === 1;
                  return (
                    <tr key={hour} className={`group ${isBlockEnd ? 'border-b-2 border-gray-200 dark:border-gray-700' : ''}`}>
                      <td className="p-3 border-r border-b border-gray-100 dark:border-gray-700 text-center bg-gray-50/20">
                        <span className="text-[11px] font-black text-gray-500 whitespace-nowrap">{getHourRange(hour)}</span>
                      </td>
                      {DAYS.map(day => {
                        const key = `${day}-${hour}`;
                        const type = slots[key];
                        return (
                          <td
                            key={key}
                            onClick={() => handleSlotClick(day, hour)}
                            className="p-1 border-r border-b border-gray-50 dark:border-gray-800 h-14 cursor-pointer transition-colors relative select-none"
                          >
                            <div
                              className={`w-full h-full rounded-xl transition-all flex items-center justify-center ${
                                type === 'MANDATORY'
                                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                                  : type === 'OPTIONAL'
                                  ? 'bg-amber-400 text-white shadow-md shadow-amber-400/20'
                                  : 'border border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/40'
                              }`}
                            >
                              {type && (
                                <span className="text-[10px] font-black uppercase">
                                  {type === 'MANDATORY' ? 'Disponible' : 'Opcional'}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherAvailability;
