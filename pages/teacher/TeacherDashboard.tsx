import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '../../components/TeacherLayout';
import { Link } from 'react-router-dom';

const TeacherDashboard: React.FC = () => {
  const [activeSemester, setActiveSemester] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { api } = await import('../../services/api');

      // Cargar semestres y obtener el activo
      const semesters = await api.getSemesters();
      const active = semesters.find((s: any) => s.isActive);
      setActiveSemester(active);

      // Obtener datos del docente logueado
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.teacher_id) {
          const teacher = await api.getTeacher(user.teacher_id);
          setTeacherData(teacher);

          // Cargar disponibilidad para verificar estado
          const availability = await api.getTeacherAvailability(user.teacher_id);
          setTeacherData((prev: any) => ({
            ...prev,
            hasAvailability: availability.length > 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSemesterDisplay = () => {
    if (!activeSemester) return 'Sin semestre activo';
    return activeSemester.name;
  };

  const getAvailabilityStatus = () => {
    if (loading) return { text: 'Cargando...', color: 'text-gray-400' };
    if (teacherData?.hasAvailability) {
      return { text: 'Declarada', color: 'text-green-500' };
    }
    return { text: 'Pendiente', color: 'text-amber-500' };
  };

  const availabilityStatus = getAvailabilityStatus();

  if (loading) {
    return (
      <TeacherLayout title="Dashboard de Inicio">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-primary text-[48px] animate-spin">sync</span>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando información...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Dashboard de Inicio">
      <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-4">
            <div className="size-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">task</span>
            </div>
            <div>
              <h3 className="text-lg font-black mb-1">Disponibilidad</h3>
              <p className="text-sm text-gray-400">
                Estado: <span className={`${availabilityStatus.color} font-bold`}>{availabilityStatus.text}</span>
              </p>
            </div>
            <Link to="/docente/disponibilidad" className="mt-2 py-3 bg-primary text-white text-center rounded-xl font-bold hover:shadow-lg transition-all active:scale-95">
              {teacherData?.hasAvailability ? 'Actualizar' : 'Declarar Ahora'}
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-4">
            <div className="size-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-500">
              <span className="material-symbols-outlined text-3xl">schedule</span>
            </div>
            <div>
              <h3 className="text-lg font-black mb-1">Horario Lectivo</h3>
              <p className="text-sm text-gray-400 font-medium">{getSemesterDisplay()}</p>
            </div>
            <Link to="/docente/mi-horario" className="mt-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-center rounded-xl font-bold hover:bg-gray-200 transition-all">
              Ver Horario
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-4">
            <div className="size-14 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-500">
              <span className="material-symbols-outlined text-3xl">how_to_reg</span>
            </div>
            <div>
              <h3 className="text-lg font-black mb-1">Adjudicación de Carga</h3>
              <p className="text-sm text-gray-400">Selección por categoría ({teacherData?.category || 'Docente'})</p>
            </div>
            <Link to="/docente/adjudicacion" className="mt-2 py-3 bg-purple-600 text-white text-center rounded-xl font-bold hover:bg-purple-700 transition-all">
              Ir a Mi Turno
            </Link>
          </div>
        </div>

        {activeSemester && (
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-primary mb-4">Aviso de Disponibilidad</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                {teacherData?.hasAvailability
                  ? `Su disponibilidad para el semestre ${activeSemester.name} ha sido registrada. Puede actualizarla en cualquier momento.`
                  : `Recuerde declarar su disponibilidad horaria para el semestre ${activeSemester.name}. Es obligatorio declarar al menos 12 horas pedagógicas.`
                }
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm">
                  <span className={`material-symbols-outlined ${teacherData?.hasAvailability ? 'text-green-500' : 'text-amber-500'}`}>
                    {teacherData?.hasAvailability ? 'check_circle' : 'warning'}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    {teacherData?.hasAvailability ? 'Disponibilidad declarada' : 'Pendiente de declarar'}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-64 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-400 uppercase mb-4">Carga Estimada</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-black text-primary">0</span>
                <span className="text-lg font-bold text-gray-300 mb-1">/ {teacherData?.maxHours || 12}h</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <div className="w-0 h-full bg-primary rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {!activeSemester && !loading && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-10 text-center">
            <span className="material-symbols-outlined text-amber-500 text-[64px] mb-4">info</span>
            <h3 className="text-xl font-black text-amber-800 dark:text-amber-300 mb-2">
              No hay semestre activo
            </h3>
            <p className="text-amber-700 dark:text-amber-400">
              Actualmente no hay un semestre académico activo. Contacte con el administrador.
            </p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;
