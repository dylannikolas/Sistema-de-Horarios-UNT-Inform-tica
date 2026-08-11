
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  // Role selection UI remains for UX, but backend determines actual role
  const [role, setRole] = useState<'DIRECTOR' | 'DOCENTE'>('DIRECTOR');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Import api dynamically or use top-level import if I fix imports
      const { api } = await import('../services/api');

      const data = await api.login({ username, password });

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userRole', data.user.role); // Backend role prevails

      // Redirect based on backend role
      if (data.user.role === 'ADMIN' || data.user.role === 'DIRECTOR') {
        navigate('/admin/semestres');
      } else {
        navigate('/docente/inicio');
      }

    } catch (err: any) {
      console.error(err);
      // Try to parse error message if it's JSON string
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.error || 'Credenciales inválidas');
      } catch (e) {
        // Si no es JSON (ej. error de red 'Failed to fetch'), mostrar mensaje original
        setError(`Error de conexión: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display">
      <div className="layout-container flex h-full grow flex-col justify-center items-center p-4 md:p-10">
        <div className="w-full max-w-[1100px] bg-white dark:bg-[#1a2230] rounded-2xl shadow-2xl overflow-hidden border border-[#e5e7eb] dark:border-[#2a3441] flex flex-col md:flex-row min-h-[650px]">
          <div className="hidden md:flex w-1/2 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1986&auto=format&fit=crop')" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent flex flex-col justify-end p-12 text-white">
              <div className="mb-8">
                <div className="size-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/30 shadow-2xl">
                  <span className="material-symbols-outlined text-white text-4xl">school</span>
                </div>
                <h2 className="text-4xl font-black leading-tight mb-3">SGA UNT</h2>
                <p className="text-blue-100 text-xl font-medium">Escuela de Informática</p>
              </div>
              <p className="text-base text-blue-100/80 leading-relaxed max-w-md font-light">
                Gestión inteligente de carga horaria y ambientes académicos. Optimizado para docentes y directivos.
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
            <div className="flex flex-col gap-2 mb-10">
              <h1 className="text-4xl font-black tracking-tight text-primary">Acceso</h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Inicie sesión para continuar</p>
            </div>

            <form className="flex flex-col gap-8" onSubmit={handleLogin}>
              {/* Role selector kept for UI consistency but not strictly needed for auth logic */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole('DIRECTOR')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'DIRECTOR' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500'}`}
                >
                  DIRECTOR
                </button>
                <button
                  type="button"
                  onClick={() => setRole('DOCENTE')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'DOCENTE' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500'}`}
                >
                  DOCENTE
                </button>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Usuario</label>
                  <div className="flex w-full items-stretch rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary overflow-hidden h-14 bg-gray-50 dark:bg-gray-900 transition-all">
                    <div className="flex items-center px-4 text-gray-400">
                      <span className="material-symbols-outlined">alternate_email</span>
                    </div>
                    <input
                      className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium"
                      placeholder="usuario.usuario"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                  <div className="flex w-full items-stretch rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary overflow-hidden h-14 bg-gray-50 dark:bg-gray-900 transition-all">
                    <div className="flex items-center px-4 text-gray-400">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                    <input
                      className="flex-1 bg-transparent border-none focus:ring-0 text-base"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="px-4 text-gray-400 hover:text-primary transition-colors" type="button">
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl bg-primary hover:bg-primary-dark text-white text-lg font-black shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar al Sistema'}
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-gray-500">
              ¿No tiene una cuenta? <Link to="/register" className="text-primary font-bold hover:underline">Registrarse aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
