
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'DIRECTOR' | 'DOCENTE'>('DOCENTE');
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      role: role,
      name: formData.get('name'),
      code: formData.get('code'),
      email: formData.get('email'),
      password: formData.get('password'),
      category: formData.get('category')
    };

    try {
      const { api } = await import('../services/api');
      await api.register(data);
      alert("Registro exitoso. Ahora puede iniciar sesión.");
      navigate('/');
    } catch (err: any) {
      console.error(err);
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.error || 'Error al registrarse');
      } catch {
        setError('Error desconocido al registrarse');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display">
      <div className="layout-container flex h-full grow flex-col justify-center items-center p-4 md:p-10">
        <div className="w-full max-w-[1200px] bg-white dark:bg-[#1a2230] rounded-3xl shadow-2xl overflow-hidden border border-[#e5e7eb] dark:border-[#2a3441] flex flex-col md:flex-row min-h-[750px] animate-in fade-in duration-700">

          {/* Lado Izquierdo: Imagen e Info */}
          <div className="hidden md:flex w-5/12 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523050335102-c6744729ea24?q=80&w=2070&auto=format&fit=crop')" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent flex flex-col justify-end p-12 text-white">
              <div className="mb-8">
                <div className="size-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/30 shadow-2xl">
                  <span className="material-symbols-outlined text-white text-4xl">person_add</span>
                </div>
                <h2 className="text-4xl font-black leading-tight mb-3">Únase al SGA</h2>
                <p className="text-blue-100 text-xl font-medium">Sistema de Gestión Académica UNT</p>
              </div>
              <p className="text-base text-blue-100/80 leading-relaxed max-w-sm font-light">
                Cree su cuenta para gestionar sus horarios, cargas lectivas y disponibilidad de manera eficiente.
              </p>
            </div>
          </div>

          {/* Lado Derecho: Formulario */}
          <div className="w-full md:w-7/12 p-10 md:p-16 flex flex-col justify-center overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-4xl font-black tracking-tight text-primary">Registrarse</h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Cree una nueva cuenta institucional</p>
            </div>

            <form className="flex flex-col gap-6" onSubmit={handleRegister}>
              {/* Selector de Rol */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tipo de Usuario</label>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setRole('DOCENTE')}
                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${role === 'DOCENTE' ? 'bg-white dark:bg-gray-700 shadow-md text-primary' : 'text-gray-500'}`}
                  >
                    <span className="material-symbols-outlined text-lg">school</span>
                    DOCENTE
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('DIRECTOR')}
                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${role === 'DIRECTOR' ? 'bg-white dark:bg-gray-700 shadow-md text-primary' : 'text-gray-500'}`}
                  >
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    DIRECTOR
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <div className="flex w-full items-stretch rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary overflow-hidden h-14 bg-gray-50 dark:bg-gray-900 transition-all">
                    <div className="flex items-center px-4 text-gray-400">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <input name="name" className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium" placeholder="Ej. Manuel Torres" type="text" required />
                  </div>
                </div>

                {/* Código */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Código UNT</label>
                  <div className="flex w-full items-stretch rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary overflow-hidden h-14 bg-gray-50 dark:bg-gray-900 transition-all">
                    <div className="flex items-center px-4 text-gray-400">
                      <span className="material-symbols-outlined">id_card</span>
                    </div>
                    <input name="code" className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium" placeholder="123456" type="text" required />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Correo Institucional</label>
                  <div className="flex w-full items-stretch rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary overflow-hidden h-14 bg-gray-50 dark:bg-gray-900 transition-all">
                    <div className="flex items-center px-4 text-gray-400">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <input name="email" className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium" placeholder="usuario@unitru.edu.pe" type="email" required />
                  </div>
                </div>

                {role === 'DOCENTE' && (
                  <div className="flex flex-col gap-1.5 md:col-span-2 animate-in slide-in-from-top-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Categoría Docente</label>
                    <div className="flex w-full items-stretch rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary overflow-hidden h-14 bg-gray-50 dark:bg-gray-900 transition-all">
                      <div className="flex items-center px-4 text-gray-400">
                        <span className="material-symbols-outlined">workspace_premium</span>
                      </div>
                      <select name="category" className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium appearance-none pr-10">
                        <option value="Principal">Docente Principal</option>
                        <option value="Asociado">Docente Asociado</option>
                        <option value="Auxiliar">Docente Auxiliar</option>
                        <option value="Contratado">Docente Contratado</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                  <div className="flex w-full items-stretch rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary overflow-hidden h-14 bg-gray-50 dark:bg-gray-900 transition-all">
                    <div className="flex items-center px-4 text-gray-400">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                    <input name="password" className="flex-1 bg-transparent border-none focus:ring-0 text-sm" placeholder="••••••••" type="password" required />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 mt-4 rounded-2xl bg-primary hover:bg-primary-dark text-white text-lg font-black shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Procesando...
                  </>
                ) : (
                  <>
                    Crear Cuenta
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              ¿Ya tiene una cuenta? <Link to="/" className="text-primary font-bold hover:underline">Inicie sesión aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
