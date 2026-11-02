
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const TeacherSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname;
  const [activeSemester, setActiveSemester] = useState<string>('Cargando...');
  const [teacherData, setTeacherData] = useState<any>(null);

  useEffect(() => {
    loadSidebarData();
  }, []);

  const loadSidebarData = async () => {
    try {
      const { api } = await import('../services/api');

      // Cargar semestre activo
      const semesters = await api.getSemesters();
      const active = semesters.find((s: any) => s.isActive);
      setActiveSemester(active ? active.name : 'Sin semestre activo');

      // Cargar datos del docente logueado
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.teacher_id) {
          const teacher = await api.getTeacher(user.teacher_id);
          setTeacherData(teacher);
        }
      }
    } catch (error) {
      console.error('Error loading sidebar data:', error);
      setActiveSemester('Error al cargar');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const navItems = [
    { path: '/docente/inicio', icon: 'dashboard', label: 'Inicio' },
    { path: '/docente/disponibilidad', icon: 'edit_calendar', label: 'Mi Disponibilidad' },
    { path: '/docente/adjudicacion', icon: 'how_to_reg', label: 'Adjudicación de Carga' },
    { path: '/docente/mi-horario', icon: 'event_note', label: 'Mi Horario Final' },
  ];

  return (
    <aside className="w-72 flex-shrink-0 bg-white dark:bg-[#1a202c] border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between hidden md:flex h-full shadow-xl">
      <div className="p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div>
            <h1 className="text-primary text-base font-black leading-tight">Panel Docente</h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">UNT Informática</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active === item.path ? 'bg-primary text-white shadow-lg shadow-blue-500/30 font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <span className={`material-symbols-outlined ${active === item.path ? 'fill' : ''}`}>{item.icon}</span>
              <p className="text-sm">{item.label}</p>
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-gray-100 dark:border-gray-800">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Semestre Actual</p>
          <p className="text-sm font-black text-primary">{activeSemester}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all font-bold"
        >
          <span className="material-symbols-outlined">logout</span>
          <p className="text-sm">Cerrar Sesión</p>
        </button>
      </div>
    </aside>
  );
};

export const TeacherLayout: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => {
  const [teacherData, setTeacherData] = useState<any>(null);

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.teacher_id) {
          const { api } = await import('../services/api');
          const teacher = await api.getTeacher(user.teacher_id);
          setTeacherData(teacher);
        }
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-[#f8fafc] dark:bg-background-dark text-[#111318] dark:text-white">
      <TeacherSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="hidden md:flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-10 py-6 bg-white/80 dark:bg-[#1a202c]/80 backdrop-blur-xl">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-gray-800 dark:text-white leading-tight">{title}</h2>
            <p className="text-xs text-gray-400 font-medium">
              Bienvenido de nuevo, {teacherData ? teacherData.name.split(' ')[0] : 'Docente'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {teacherData && (
              <div className="flex flex-col text-right mr-2">
                <span className="text-sm font-black">{teacherData.name}</span>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest">{teacherData.category}</span>
              </div>
            )}
            <img
              src={teacherData?.avatar || "https://picsum.photos/seed/docente1/100"}
              className="size-12 rounded-2xl border-2 border-white dark:border-gray-700 shadow-xl object-cover"
              alt="User"
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
};
