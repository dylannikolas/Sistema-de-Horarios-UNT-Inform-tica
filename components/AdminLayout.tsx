
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const active = location.pathname;

  const navItems = [
    { path: '/admin/semestres', icon: 'calendar_month', label: 'Semestres' },
    { path: '/admin/docentes', icon: 'group', label: 'Docentes' },
    { path: '/admin/cursos', icon: 'menu_book', label: 'Cursos' },
    { path: '/horario/docente', icon: 'schedule', label: 'Horarios Docente' },
    { path: '/horario/aula', icon: 'meeting_room', label: 'Horarios Aula' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#1a202c] border-r border-[#f0f2f4] dark:border-gray-800 flex flex-col justify-between overflow-y-auto hidden md:flex h-full">
      <div className="p-4 flex flex-col gap-6">
        <div className="flex flex-col px-3">
          <h1 className="text-[#111318] dark:text-white text-lg font-bold">UNT Informática</h1>
          <p className="text-[#616f89] dark:text-gray-400 text-xs font-normal">Panel de Administración</p>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active === item.path ? 'bg-primary/10 text-primary' : 'hover:bg-background-light dark:hover:bg-gray-800 group'}`}
            >
              <span className={`material-symbols-outlined ${active === item.path ? 'fill' : 'text-[#616f89] dark:text-gray-400 group-hover:text-primary'}`}>{item.icon}</span>
              <p className={`${active === item.path ? 'text-primary' : 'text-[#616f89] dark:text-gray-400 group-hover:text-[#111318] dark:group-hover:text-white'} text-sm font-medium`}>{item.label}</p>
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-[#f0f2f4] dark:border-gray-800">
        <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-light dark:hover:bg-gray-800 group transition-colors">
          <span className="material-symbols-outlined text-[#616f89] dark:text-gray-400">logout</span>
          <p className="text-[#616f89] dark:text-gray-400 text-sm font-medium">Cerrar Sesión</p>
        </Link>
      </div>
    </aside>
  );
};

export const AdminLayout: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => {
  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-background-light dark:bg-background-dark text-[#111318] dark:text-white">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="hidden md:flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] dark:border-gray-800 px-8 py-4 bg-white dark:bg-[#1a202c]">
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">{title}</h2>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-[#616f89] hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white dark:border-[#1a202c]"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-[#f0f2f4] dark:border-gray-700">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold">Dr. Juan Perez</p>
                <p className="text-xs text-[#616f89]">Director de Escuela</p>
              </div>
              <img src="https://picsum.photos/seed/director/100" className="rounded-full size-10 border-2 border-white shadow-sm" alt="User" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
