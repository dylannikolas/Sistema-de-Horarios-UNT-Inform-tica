import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles: ('ADMIN' | 'DIRECTOR' | 'DOCENTE')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const userStr = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');

    if (!userStr || !role) {
        return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(role as any)) {
        // If user is logged in but role doesn't match, redirect to their home or login
        if (role === 'DOCENTE') return <Navigate to="/docente/inicio" replace />;
        if (role === 'DIRECTOR' || role === 'ADMIN') return <Navigate to="/admin/semestres" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
