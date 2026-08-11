
import React, { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';

import { Course } from '../types';

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<string>('TODOS');

  React.useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { api } = await import('../services/api');
      const data = await api.getCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const handleOpenModal = (c?: Course) => {
    setEditingCourse(c || null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { api } = await import('../services/api');

    const courseData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      cycle: formData.get('cycle') as string,
      credits: parseInt(formData.get('credits') as string),
      hours_per_week: parseInt(formData.get('hoursPerWeek') as string),
    };

    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, courseData);
      } else {
        await api.createCourse(courseData);
      }
      await loadCourses();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving course:", error);
    }
  };

  // Obtener ciclos únicos de los cursos
  const uniqueCycles = Array.from(new Set(courses.map(c => c.cycle))).sort();

  // Filtrar cursos según el ciclo seleccionado
  const filteredCourses = selectedCycle === 'TODOS'
    ? courses
    : courses.filter(c => c.cycle === selectedCycle);


  return (
    <AdminLayout title="Gestión de Cursos">
      <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#111318] dark:text-white text-3xl font-black tracking-tight">Catálogo de Cursos</h2>
            <p className="text-[#616f89] dark:text-gray-400 text-base font-normal">Administre el catálogo de asignaturas académicas de la facultad.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold h-11 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span className="truncate">Nuevo Curso</span>
          </button>
        </div>

        {/* Filtro por Ciclo y Contador */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
          <div className="flex items-center gap-3 flex-1">
            <span className="material-symbols-outlined text-primary text-[24px]">filter_list</span>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Filtrar por Ciclo</label>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="h-11 px-4 pr-10 rounded-lg border-2 border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111318] dark:text-white font-semibold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer hover:border-primary"
              >
                <option value="TODOS">📚 Todos los Ciclos</option>
                {uniqueCycles.map(cycle => (
                  <option key={cycle} value={cycle}>
                    Ciclo {cycle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contador de Resultados */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2.5 rounded-lg border border-blue-200 dark:border-gray-600 shadow-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">library_books</span>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Mostrando</span>
              <span className="text-lg font-black text-primary">
                {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-[#dbdfe6] dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#dbdfe6] dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="p-4 text-xs uppercase tracking-wider font-bold text-[#616f89] dark:text-gray-400">Código</th>
                  <th className="p-4 text-xs uppercase tracking-wider font-bold text-[#616f89] dark:text-gray-400">Nombre del Curso</th>
                  <th className="p-4 text-xs uppercase tracking-wider font-bold text-[#616f89] dark:text-gray-400 text-center">Ciclo</th>
                  <th className="p-4 text-xs uppercase tracking-wider font-bold text-[#616f89] dark:text-gray-400 text-center">Créditos</th>
                  <th className="p-4 text-xs uppercase tracking-wider font-bold text-[#616f89] dark:text-gray-400 text-center">Horas/Sem</th>
                  <th className="p-4 text-xs uppercase tracking-wider font-bold text-[#616f89] dark:text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbdfe6] dark:divide-gray-700">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600">search_off</span>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          No se encontraron cursos {selectedCycle !== 'TODOS' && `para el ciclo ${selectedCycle}`}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr key={course.id} className="group hover:bg-background-light dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-primary dark:text-blue-400">{course.code}</td>
                      <td className="p-4 text-sm font-semibold text-[#111318] dark:text-white">{course.name}</td>
                      <td className="p-4 text-sm text-[#616f89] dark:text-gray-300 text-center">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded text-xs font-bold">{course.cycle}</span>
                      </td>
                      <td className="p-4 text-sm text-center font-bold">{course.credits}</td>
                      <td className="p-4 text-sm text-center font-medium text-gray-500">{course.hoursPerWeek}h</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenModal(course)}
                          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-[#616f89] hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>

                        <button
                          onClick={async () => {
                            if (!window.confirm('¿Está seguro de eliminar este curso?')) return;
                            try {
                              const { api } = await import('../services/api');
                              await api.deleteCourse(course.id);
                              loadCourses();
                            } catch (e) {
                              console.error(e);
                              alert('Error al eliminar curso');
                            }
                          }}
                          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-[#616f89] hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {
        isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a202c] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-primary text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">menu_book</span>
                  <h3 className="font-bold">{editingCourse ? 'Editar Curso' : 'Nuevo Curso'}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><span className="material-symbols-outlined">close</span></button>
              </div>
              <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre de la Asignatura</label>
                  <input required name="name" defaultValue={editingCourse?.name} className="h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" placeholder="Ej. Bases de Datos I" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Código</label>
                    <input required name="code" defaultValue={editingCourse?.code} className="h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" placeholder="INF-123" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Ciclo</label>
                    <input required name="cycle" defaultValue={editingCourse?.cycle} className="h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" placeholder="III" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Créditos</label>
                    <input required name="credits" type="number" defaultValue={editingCourse?.credits} className="h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Horas Semanales</label>
                    <input required name="hoursPerWeek" type="number" defaultValue={editingCourse?.hoursPerWeek} className="h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 rounded-lg font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 h-11 rounded-lg font-bold text-sm bg-primary text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">Guardar Asignatura</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </AdminLayout >
  );
};

export default AdminCourses;
