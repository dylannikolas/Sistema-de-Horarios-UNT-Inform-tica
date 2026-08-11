
import React, { useState, useRef, useEffect } from 'react';
import { TeacherLayout } from '../../components/TeacherLayout';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

type SlotType = 'MANDATORY' | 'OPTIONAL';

const TeacherAvailability: React.FC = () => {
  // Estado estructurado: clave es "dia-hora", valor es el tipo
  const [slots, setSlots] = useState<Record<string, SlotType>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  // Changed NodeJS.Timeout to ReturnType<typeof setTimeout> to fix "Cannot find namespace 'NodeJS'" error
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar disponibilidad al montar el componente
  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      // Obtener el usuario actual del localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        alert('No se encontró sesión activa');
        return;
      }

      const user = JSON.parse(userStr);
      if (!user.teacher_id) {
        alert('Este usuario no está vinculado a un docente');
        return;
      }

      setTeacherId(user.teacher_id);

      // Cargar disponibilidad desde la API
      const { api } = await import('../../services/api');
      const availability = await api.getTeacherAvailability(user.teacher_id);

      // Convertir la disponibilidad a nuestro formato de slots
      const loadedSlots: Record<string, SlotType> = {};
      availability.forEach((slot: any) => {
        const key = `${slot.day}-${slot.hour}`;
        loadedSlots[key] = slot.is_optional ? 'OPTIONAL' : 'MANDATORY';
      });

      setSlots(loadedSlots);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (key: string) => {
    // Si hay un temporizador activo, lo cancelamos (es un doble clic)
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      handleSlotDoubleClick(key);
      return;
    }

    // Iniciamos un temporizador para esperar el segundo clic
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;

      setSlots(prev => {
        const newSlots = { ...prev };
        if (newSlots[key]) {
          delete newSlots[key];
        } else {
          if (Object.keys(prev).length >= 18) {
            alert("Ha alcanzado el límite máximo de 18 horas permitidas.");
            return prev;
          }
          // Por defecto, si faltan obligatorias, asignar como mandatoria
          const mandatoryCount = Object.values(prev).filter(v => v === 'MANDATORY').length;
          newSlots[key] = mandatoryCount < 12 ? 'MANDATORY' : 'OPTIONAL';
        }
        return newSlots;
      });
    }, 200); // 200ms es suficiente para detectar la diferencia
  };

  const handleSlotDoubleClick = (key: string) => {
    setSlots(prev => {
      if (!prev[key]) return prev; // No hacer nada si no está seleccionado

      const newType: SlotType = prev[key] === 'MANDATORY' ? 'OPTIONAL' : 'MANDATORY';

      // Validaciones extras opcionales
      if (newType === 'MANDATORY') {
        const mandatoryCount = Object.values(prev).filter(v => v === 'MANDATORY').length;
        if (mandatoryCount >= 12 && prev[key] === 'OPTIONAL') {
          alert("Ya ha completado el máximo de 12 horas mandatorias. Esta se mantendrá como opcional.");
          return prev;
        }
      }

      return { ...prev, [key]: newType };
    });
  };

  const mandatoryCount = Object.values(slots).filter(v => v === 'MANDATORY').length;
  const optionalCount = Object.values(slots).filter(v => v === 'OPTIONAL').length;
  const isMandatoryComplete = mandatoryCount >= 12;

  const handleSave = async () => {
    if (mandatoryCount < 12) {
      alert(`Faltan ${12 - mandatoryCount} horas obligatorias por declarar.`);
      return;
    }

    if (!teacherId) {
      alert('No se pudo identificar el docente');
      return;
    }

    setIsSubmitting(true);
    try {
      const { api } = await import('../../services/api');

      // Convertir slots a formato de API
      const availability = Object.entries(slots).map(([key, type]) => {
        const [day, hour] = key.split('-');
        return {
          day,
          hour,
          is_optional: type === 'OPTIONAL'
        };
      });

      await api.saveTeacherAvailability(teacherId, availability);
      alert("✅ Su disponibilidad ha sido guardada exitosamente.");
    } catch (error) {
      console.error('Error saving availability:', error);
      alert("❌ Error al guardar la disponibilidad. Intente nuevamente.");
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
    <TeacherLayout title="Declarar Disponibilidad">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Panel de Resumen y Control */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl gap-8">
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">edit_calendar</span>
              </div>
              <h2 className="text-2xl font-black text-gray-800 dark:text-white">Configuración Horaria</h2>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
              Establezca sus preferencias de enseñanza. Recuerde que debe cumplir con el mínimo de <span className="text-primary font-bold">12 horas obligatorias</span>. Use el doble clic para alternar el tipo de hora.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:border-l lg:pl-8 border-gray-100 dark:border-gray-700">
            <div className="flex flex-col gap-1 min-w-[120px]">
              <div className="flex justify-between text-[10px] font-black uppercase text-blue-500 tracking-tighter">
                <span>Mandatorias</span>
                <span>{mandatoryCount}/12</span>
              </div>
              <div className="h-3 w-full bg-blue-50 dark:bg-blue-900/20 rounded-full overflow-hidden border border-blue-100 dark:border-blue-800/50">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(mandatoryCount / 12) * 100}%` }}></div>
              </div>
            </div>

            <div className="flex flex-col gap-1 min-w-[120px]">
              <div className="flex justify-between text-[10px] font-black uppercase text-amber-500 tracking-tighter">
                <span>Opcionales</span>
                <span>{optionalCount}/6</span>
              </div>
              <div className="h-3 w-full bg-amber-50 dark:bg-amber-900/20 rounded-full overflow-hidden border border-amber-100 dark:border-amber-800/50">
                <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(optionalCount / 6) * 100}%` }}></div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`px-10 h-16 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 flex items-center gap-3 ${isMandatoryComplete ? 'bg-primary hover:bg-primary-dark shadow-blue-500/30' : 'bg-gray-300 cursor-not-allowed text-gray-500'}`}
            >
              {isSubmitting ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">save</span>}
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

        {/* Matriz con Guía de Uso */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between border-b border-gray-100 dark:border-gray-700 gap-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-md bg-primary shadow-sm"></div>
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Mandatoria</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-md bg-amber-400 shadow-sm"></div>
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Opcional</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                <span className="material-symbols-outlined text-sm">mouse</span>
                Clic: Seleccionar
              </div>
              <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase">
                <span className="material-symbols-outlined text-sm text-primary">ads_click</span>
                Doble Clic: Cambiar Tipo
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="w-36 p-5 border-r border-b border-gray-100 dark:border-gray-700 text-center">
                    <span className="text-[10px] font-black uppercase text-gray-400">Hora</span>
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="p-5 border-r border-b border-gray-100 dark:border-gray-700 text-center">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">{day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(hour => (
                  <tr key={hour} className="group">
                    <td className="p-4 border-r border-b border-gray-100 dark:border-gray-700 text-center bg-gray-50/20">
                      <span className="text-[10px] font-black text-gray-400 whitespace-nowrap">{getHourRange(hour)}</span>
                    </td>
                    {DAYS.map(day => {
                      const key = `${day}-${hour}`;
                      const type = slots[key];

                      return (
                        <td
                          key={key}
                          onClick={() => handleSlotClick(key)}
                          className={`p-1 border-r border-b border-gray-50 dark:border-gray-800 h-16 cursor-pointer transition-colors duration-200 relative select-none ${type ? 'bg-gray-50/10' : 'hover:bg-blue-50/30 dark:hover:bg-gray-700/50'}`}
                        >
                          <div className={`w-full h-full rounded-xl transition-all duration-300 flex items-center justify-center overflow-hidden ${type === 'MANDATORY' ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-95' :
                              type === 'OPTIONAL' ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/30 scale-95' :
                                'border-2 border-dashed border-gray-200 dark:border-gray-700 group-hover:border-primary/40'
                            }`}>
                            {type && (
                              <div className="flex flex-col items-center animate-in zoom-in-50 duration-200">
                                <span className="material-symbols-outlined text-lg">
                                  {type === 'MANDATORY' ? 'grade' : 'add_circle'}
                                </span>
                                <span className="text-[8px] font-black uppercase leading-none mt-0.5">
                                  {type === 'MANDATORY' ? 'Mand' : 'Opc'}
                                </span>
                              </div>
                            )}
                          </div>
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
    </TeacherLayout>
  );
};

export default TeacherAvailability;
