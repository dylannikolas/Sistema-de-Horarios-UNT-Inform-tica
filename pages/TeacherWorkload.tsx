
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { Teacher, Course } from '../types';
import { suggestWorkload } from '../services/geminiService';

const TeacherWorkload: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [teacher, setTeacher] = useState<Teacher | undefined>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'CARGA' | 'DISPONIBILIDAD'>('CARGA');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const loadData = async () => {
    try {
      const { api } = await import('../services/api');

      // Cargar docentes y cursos desde la API
      const [teachersData, coursesData] = await Promise.all([
        api.getTeachers(),
        api.getCourses()
      ]);

      console.log('Teachers data:', teachersData);
      console.log('Looking for teacher ID:', teacherId);

      // Buscar el docente por ID (comparar tanto string como número)
      const found = teachersData.find(t =>
        String(t.id) === String(teacherId)
      );

      console.log('Found teacher:', found);

      setTeacher(found);
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };


  const toggleCourse = (id: string) => {
    setSelectedCourses(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleAISuggestion = async () => {
    if (!teacher) return;
    setLoadingAI(true);
    const suggestion = await suggestWorkload([teacher], courses);
    setAiSuggestion(suggestion);
    setLoadingAI(false);
  };

  const totalHours = selectedCourses.reduce((acc, cid) => {
    const course = courses.find(c => c.id === cid);
    return acc + (course?.hoursPerWeek || 0);
  }, 0);

  // Mostrar estado de carga
  if (loading) {
    return (
      <AdminLayout title="Carga Lectiva">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-primary text-[48px] animate-spin">sync</span>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando información del docente...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Mostrar error si no se encuentra el docente
  if (!teacher) {
    return (
      <AdminLayout title="Carga Lectiva">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <span className="material-symbols-outlined text-red-500 text-[64px]">person_off</span>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white">Docente no encontrado</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No se pudo encontrar el docente con ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{teacherId}</code>
            </p>
            <Link
              to="/admin/docentes"
              className="mt-4 flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Volver a Docentes
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout title={`Carga Lectiva - ${teacher.name}`}>
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <img src={teacher.avatar} className="size-16 rounded-2xl border-2 border-primary object-cover shadow-xl" alt="" />
            <div>
              <h2 className="text-2xl font-black">{teacher.name}</h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{teacher.category} • Máx: {teacher.maxHours}h</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mr-4">
              <button
                onClick={() => setViewMode('CARGA')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${viewMode === 'CARGA' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}
              >
                ASIGNAR CARGA
              </button>
              <button
                onClick={() => setViewMode('DISPONIBILIDAD')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${viewMode === 'DISPONIBILIDAD' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}
              >
                VER DISPONIBILIDAD
              </button>
            </div>
            {/* Botón de IA deshabilitado temporalmente - Requiere configurar API Key de Gemini */}
            {/* 
            <button
              onClick={handleAISuggestion}
              disabled={loadingAI}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl transition-all disabled:opacity-50 shadow-xl shadow-purple-500/20"
            >
              <span className="material-symbols-outlined text-[20px]">{loadingAI ? 'sync' : 'psychology'}</span>
              {loadingAI ? 'IA Analizando...' : 'Sugerencia IA'}
            </button>
            */}
            <button className="px-6 py-2.5 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all shadow-xl shadow-blue-500/20">
              Guardar
            </button>
          </div>
        </div>

        {viewMode === 'CARGA' ? (
          <>
            {aiSuggestion && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-6 rounded-3xl animate-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-purple-800 dark:text-purple-300 flex items-center gap-2">
                    <span className="material-symbols-outlined">auto_awesome</span> Recomendación de Carga
                  </h3>
                  <button onClick={() => setAiSuggestion(null)} className="text-purple-400 hover:text-purple-600">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-purple-900 dark:text-purple-100 font-medium">
                  {aiSuggestion}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-black text-lg">Cursos Disponibles</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selección Manual</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="px-8 py-4 w-[60px] text-center"></th>
                          <th className="px-8 py-4 text-[10px] font-bold uppercase text-gray-400">Código</th>
                          <th className="px-8 py-4 text-[10px] font-bold uppercase text-gray-400">Nombre</th>
                          <th className="px-8 py-4 text-[10px] font-bold uppercase text-gray-400 text-center">H/Semana</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {courses.map(course => (
                          <tr key={course.id} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors ${selectedCourses.includes(course.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`} onClick={() => toggleCourse(course.id)}>
                            <td className="px-8 py-5 text-center">
                              <div className={`size-5 rounded border-2 flex items-center justify-center transition-all ${selectedCourses.includes(course.id) ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                                {selectedCourses.includes(course.id) && <span className="material-symbols-outlined text-[14px]">check</span>}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-sm font-black text-gray-500">{course.code}</td>
                            <td className="px-8 py-5 text-sm font-bold">{course.name}</td>
                            <td className="px-8 py-5 text-sm text-center font-black text-primary">{course.hoursPerWeek}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-2xl p-8 sticky top-24">
                  <h3 className="font-black mb-8 text-xl">Estado de Carga</h3>
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase">Horas Totales</span>
                        <span className={`text-3xl font-black ${totalHours > teacher.maxHours ? 'text-red-500' : 'text-primary'}`}>{totalHours}h</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ease-out ${totalHours > teacher.maxHours ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min((totalHours / teacher.maxHours) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] mt-2 font-bold text-gray-400 uppercase tracking-widest">
                        <span>Min: 0h</span>
                        <span>Máx: {teacher.maxHours}h</span>
                      </div>
                    </div>

                    {totalHours > teacher.maxHours && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-2xl flex items-start gap-3 border border-red-100 dark:border-red-900/50 font-medium">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                        <p>Se ha superado el límite de carga académica permitido.</p>
                      </div>
                    )}

                    <div className="pt-6 border-t border-gray-50 dark:border-gray-700">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Cursos Seleccionados</p>
                      <ul className="space-y-3">
                        {selectedCourses.map(cid => {
                          const c = courses.find(course => course.id === cid);
                          return (
                            <li key={cid} className="text-xs flex justify-between items-center group bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
                              <span className="truncate flex-1 font-bold text-gray-700 dark:text-gray-300">{c?.name}</span>
                              <span className="font-black ml-2 text-primary">{c?.hoursPerWeek}h</span>
                            </li>
                          );
                        })}
                        {selectedCourses.length === 0 && <li className="text-xs text-gray-400 italic">No hay cursos asignados</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 border border-gray-100 dark:border-gray-700 shadow-sm animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary text-3xl">calendar_today</span>
              <h3 className="text-2xl font-black">Disponibilidad Horaria Declarada</h3>
            </div>

            <div className="grid grid-cols-6 gap-4 border-t border-gray-100 dark:border-gray-700 pt-8">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="flex flex-col gap-3">
                  <p className="text-xs font-black text-center text-gray-400 uppercase mb-2">{day}</p>
                  {/* Mock data for visualization */}
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`p-3 rounded-xl text-center text-[10px] font-black border-2 ${Math.random() > 0.4 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-gray-50 border-transparent text-gray-300'}`}>
                      {0 + (i * 2) + 7}:00
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex gap-10">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Horas Declaradas</span>
                  <span className="text-2xl font-black text-primary">15 horas</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preferencia</span>
                  <span className="text-2xl font-black text-emerald-500">Mañana</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 italic max-w-md text-right">
                "Prefiero clases de 8:00 AM a 1:00 PM por motivos de investigación por la tarde."
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TeacherWorkload;
