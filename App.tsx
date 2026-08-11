import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminSemesters from './pages/AdminSemesters';
import AdminTeachers from './pages/AdminTeachers';
import AdminCourses from './pages/AdminCourses';
import TeacherWorkload from './pages/TeacherWorkload';
import ScheduleTeacher from './pages/ScheduleTeacher';
import ScheduleRoom from './pages/ScheduleRoom';

// Nuevas páginas del docente
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAvailabilityPage from './pages/teacher/TeacherAvailability';

// Layouts & Security
import { AdminLayout } from './components/AdminLayout';
import { TeacherLayout } from './components/TeacherLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Wrapper components for Layouts to work as Route elements
const AdminLayoutWrapper = () => (
  <AdminLayout title="System Scheduler">
    <Outlet />
  </AdminLayout>
);

const TeacherLayoutWrapper = () => (
  <TeacherLayout title="Portal Docente">
    <Outlet />
  </TeacherLayout>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* DIRECTOR Routes (Protected) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR']} />}>
          {/* Standalone Pages (contain their own <AdminLayout>) */}
          <Route path="/admin/semestres" element={<AdminSemesters />} />
          <Route path="/admin/docentes" element={<AdminTeachers />} />
          <Route path="/admin/cursos" element={<AdminCourses />} />
          <Route path="/docente/carga/:teacherId" element={<TeacherWorkload />} />

          {/* Shared Pages (Require Wrapper) */}
          <Route element={<AdminLayoutWrapper />}>
            <Route path="/horario/docente" element={<ScheduleTeacher />} />
            <Route path="/horario/aula" element={<ScheduleRoom />} />
          </Route>
        </Route>

        {/* DOCENTE Routes (Protected) */}
        <Route element={<ProtectedRoute allowedRoles={['DOCENTE']} />}>
          {/* Standalone Pages (contain their own <TeacherLayout>) */}
          <Route path="/docente/inicio" element={<TeacherDashboard />} />
          <Route path="/docente/disponibilidad" element={<TeacherAvailabilityPage />} />

          {/* Shared Pages (Require Wrapper) */}
          <Route element={<TeacherLayoutWrapper />}>
            <Route path="/docente/mi-horario" element={<ScheduleTeacher />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
