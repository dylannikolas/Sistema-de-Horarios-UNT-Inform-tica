
import React, { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';

import { Semester } from '../types';

const AdminSemesters: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

  React.useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      const { api } = await import('../services/api');
      const data = await api.getSemesters();
      setSemesters(data);
    } catch (error) {
      console.error("Error loading semesters:", error);
    }
  };

  // Función para formatear fechas (solo mostrar YYYY-MM-DD)
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Si la fecha viene como ISO (2024-01-01T05:00:00.000Z), extraer solo la parte de la fecha
    return dateString.split('T')[0];
  };


  const handleOpenModal = (sem?: Semester) => {
    setEditingSemester(sem || null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { api } = await import('../services/api');

    const semesterData = {
      name: formData.get('name') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      isActive: formData.get('isActive') === 'on',
    };

    try {
      if (editingSemester) {
        // Actualizar semestre existente
        await api.updateSemester(editingSemester.id, semesterData);

        // Si se marcó como activo, activarlo
        if (semesterData.isActive) {
          await api.activateSemester(editingSemester.id);
        }
      } else {
        // Crear nuevo semestre
        const res = await api.createSemester(semesterData);

        // Si se marcó como activo, activarlo
        if (semesterData.isActive) {
          await api.activateSemester(res.id);
        }
      }

      await loadSemesters();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving semester:", error);
      alert("Error al guardar el semestre. Intente nuevamente.");
    }
  };

  return (
    <AdminLayout title="Gestión de Semestres">
      <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-[#111318] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Semestres Académicos</h1>
            <p className="text-[#616f89] dark:text-gray-400 text-base font-normal">
              Gestione los periodos académicos, defina fechas de inicio y fin, y establezca el semestre vigente.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95 whitespace-nowrap h-fit"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="font-bold text-sm">Nuevo Semestre</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[#616f89] dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Semestre Vigente</p>
              <p className="text-2xl font-bold text-[#111318] dark:text-white mt-1">
                {semesters.find(s => s.isActive)?.name || 'Ninguno'}
              </p>
            </div>
            <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-white dark:bg-[#1a202c] rounded-xl border border-[#dbdfe6] dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#2d3748] border-b border-[#dbdfe6] dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-semibold text-[#616f89] dark:text-gray-400 uppercase tracking-wider">Semestre</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#616f89] dark:text-gray-400 uppercase tracking-wider">Inicio</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#616f89] dark:text-gray-400 uppercase tracking-wider">Fin</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#616f89] dark:text-gray-400 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#616f89] dark:text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbdfe6] dark:divide-gray-700">
                {semesters.map((sem) => (
                  <tr key={sem.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{sem.name.includes('-') ? sem.name.split('-')[1] : 'S'}</div>
                        <span className="text-[#111318] dark:text-white font-bold text-sm">{sem.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#616f89] dark:text-gray-300 text-sm font-medium">{formatDate(sem.startDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#616f89] dark:text-gray-300 text-sm font-medium">{formatDate(sem.endDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${sem.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/40' : 'bg-gray-100 text-gray-600'}`}>
                        {sem.isActive && <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                        {sem.isActive ? 'VIGENTE' : 'FINALIZADO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenModal(sem)}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-primary transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>

                      <button
                        onClick={async () => {
                          if (!window.confirm('¿Está seguro de eliminar este semestre?')) return;
                          try {
                            const { api } = await import('../services/api');
                            await api.deleteSemester(sem.id);
                            loadSemesters();
                          } catch (e) {
                            console.error(e);
                            alert('Error al eliminar semestre');
                          }
                        }}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-500 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {
        isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a202c] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <h3 className="text-lg font-bold">{editingSemester ? 'Editar Semestre' : 'Nuevo Semestre'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>
              </div>
              <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Semestre</label>
                  <input required name="name" defaultValue={editingSemester?.name} className="h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" placeholder="Ej. 2024-II" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Fecha Inicio</label>
                    <input required name="startDate" type="date" defaultValue={editingSemester?.startDate} className="h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Fecha Fin</label>
                    <input required name="endDate" type="date" defaultValue={editingSemester?.endDate} className="h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input name="isActive" type="checkbox" defaultChecked={editingSemester?.isActive} className="size-4 rounded border-gray-300 text-primary focus:ring-primary" id="isActive" />
                  <label htmlFor="isActive" className="text-sm font-medium">Establecer como semestre vigente</label>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 rounded-lg font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 h-11 rounded-lg font-bold text-sm bg-primary text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </AdminLayout >
  );
};

export default AdminSemesters;
