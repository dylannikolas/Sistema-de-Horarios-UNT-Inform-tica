
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';

import { Teacher } from '../types';

const AdminTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch teachers on mount
  React.useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const { api } = await import('../services/api');
      const data = await api.getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Error loading teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (t?: Teacher) => {
    setEditingTeacher(t || null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { api } = await import('../services/api');

    const teacherData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      category: formData.get('category') as any,
      code: formData.get('code') as string,
      avatar: editingTeacher?.avatar || `https://picsum.photos/seed/${Math.random()}/200`,
      maxHours: parseInt(formData.get('maxHours') as string),
      role: editingTeacher?.role || 'DOCENTE',
    };

    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, teacherData);
      } else {
        await api.createTeacher(teacherData);
      }
      await loadTeachers(); // Reload list
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving teacher:", error);
      alert("Error al guardar docente. Revise los datos.");
    }
  };

  return (
    <AdminLayout title="Gestión de Docentes">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-[#111318] dark:text-white tracking-tight">Docentes</h2>
            <p className="text-[#616f89] dark:text-gray-400 mt-1 max-w-2xl">Administre el registro y asignación académica.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex shrink-0 items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-lg transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Nuevo Docente</span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          <div className="xl:col-span-3 bg-white dark:bg-[#1a202c] rounded-xl border border-[#f0f2f4] dark:border-[#2d3748] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800 text-[#616f89] dark:text-gray-400 font-medium uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Docente</th>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4 text-center">Horas Máx.</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f4] dark:divide-[#2d3748]">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={teacher.avatar} className="size-10 rounded-full shrink-0 object-cover border-2 border-white dark:border-gray-700 shadow-sm" alt={teacher.name} />
                          <div>
                            <p className="font-bold text-[#111318] dark:text-white">{teacher.name}</p>
                            <p className="text-xs text-[#616f89]">{teacher.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[#616f89] dark:text-gray-400">{teacher.code}</td>
                      <td className="px-6 py-4 text-center font-bold text-primary">{teacher.maxHours}h</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {teacher.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/docente/carga/${teacher.id}`}
                            className="text-primary hover:text-blue-700 text-xs font-bold hover:underline"
                          >
                            CARGA
                          </Link>
                          <button
                            onClick={() => handleOpenModal(teacher)}
                            className="text-[#616f89] hover:text-primary p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('¿Está seguro de eliminar este docente?')) return;
                              try {
                                const { api } = await import('../services/api');
                                await api.deleteTeacher(teacher.id);
                                loadTeachers();
                              } catch (e) {
                                console.error(e);
                                alert('Error al eliminar docente');
                              }
                            }}
                            className="text-[#616f89] hover:text-red-500 p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-1 flex flex-col gap-4">
            <div className="bg-white dark:bg-[#1a202c] rounded-xl border border-[#f0f2f4] dark:border-[#2d3748] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <h3 className="font-bold text-lg">Resumen</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Docentes</span>
                  <span className="font-bold">{teachers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Horas Cubiertas</span>
                  <span className="font-bold text-green-600">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a202c] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{editingTeacher ? 'edit_square' : 'person_add'}</span>
                </div>
                <h3 className="text-lg font-bold">{editingTeacher ? 'Editar Docente' : 'Nuevo Docente'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                  <input required name="name" defaultValue={editingTeacher?.name} className="h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="Ej. Dr. Juan Pérez" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Código UNT</label>
                  <input required name="code" defaultValue={editingTeacher?.code} className="h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="123456" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Máx. Horas</label>
                  <input required name="maxHours" type="number" defaultValue={editingTeacher?.maxHours || 20} className="h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none text-sm" />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Correo Institucional</label>
                  <input required name="email" type="email" defaultValue={editingTeacher?.email} className="h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="usuario@unitru.edu.pe" />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                  <select name="category" defaultValue={editingTeacher?.category} className="h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none text-sm appearance-none">
                    <option value="Principal">Principal</option>
                    <option value="Asociado">Asociado</option>
                    <option value="Auxiliar">Auxiliar</option>
                    <option value="Contratado">Contratado</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 h-12 rounded-xl font-bold text-sm bg-primary text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30">Guardar Docente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTeachers;
