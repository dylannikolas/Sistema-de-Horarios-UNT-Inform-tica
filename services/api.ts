const API_URL = '/api'; // Vite proxy handles the host

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

export const api = {
    // Auth
    register: async (userData: any) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },

    login: async (credentials: any) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },

    // Teachers
    getTeachers: async () => {
        const response = await fetch(`${API_URL}/teachers`);
        if (!response.ok) throw new Error('Failed to fetch teachers');
        const data = await response.json();
        return data.map((t: any) => ({
            ...t,
            maxHours: t.required_hours || t.max_hours,
            requiredHours: t.required_hours || t.max_hours,
            orden: t.orden,
        }));
    },

    getOrderedTeachers: async () => {
        const response = await fetch(`${API_URL}/teachers/ordered`);
        if (!response.ok) throw new Error('Failed to fetch ordered teachers');
        return response.json();
    },

    getTeacher: async (id: string) => {
        const response = await fetch(`${API_URL}/teachers/${id}`);
        if (!response.ok) throw new Error('Failed to fetch teacher');
        const t = await response.json();
        return {
            ...t,
            maxHours: t.required_hours || t.max_hours,
            requiredHours: t.required_hours || t.max_hours,
            orden: t.orden,
        };
    },

    getTeacherAvailability: async (id: string) => {
        const response = await fetch(`${API_URL}/teachers/${id}/availability`);
        if (!response.ok) throw new Error('Failed to fetch availability');
        return response.json();
    },

    saveTeacherAvailability: async (teacherId: string, availability: any[]) => {
        const response = await fetch(`${API_URL}/teachers/${teacherId}/availability`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ availability }),
        });
        if (!response.ok) throw new Error('Failed to save availability');
        return response.json();
    },

    createTeacher: async (teacher: any) => {
        const payload = {
            ...teacher,
            max_hours: teacher.maxHours,
            required_hours: teacher.requiredHours || teacher.maxHours,
            orden: teacher.orden || 999,
        };
        const response = await fetch(`${API_URL}/teachers`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create teacher');
        return response.json();
    },

    updateTeacher: async (id: string, teacher: any) => {
        const payload = {
            ...teacher,
            max_hours: teacher.maxHours,
            required_hours: teacher.requiredHours || teacher.maxHours,
            orden: teacher.orden || 999,
        };
        const response = await fetch(`${API_URL}/teachers/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update teacher');
        return response.json();
    },

    deleteTeacher: async (id: string) => {
        const response = await fetch(`${API_URL}/teachers/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete teacher');
        return response.json();
    },

    // Semesters
    getSemesters: async () => {
        const response = await fetch(`${API_URL}/semesters`);
        if (!response.ok) throw new Error('Failed to fetch semesters');
        const data = await response.json();
        return data.map((s: any) => ({
            ...s,
            startDate: s.start_date,
            endDate: s.end_date,
            isActive: Boolean(s.is_active),
        }));
    },

    createSemester: async (semester: any) => {
        const payload = {
            ...semester,
            start_date: semester.startDate,
            end_date: semester.endDate,
            is_active: semester.isActive,
        };
        const response = await fetch(`${API_URL}/semesters`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create semester');
        return response.json();
    },

    updateSemester: async (id: string, semester: any) => {
        const payload = {
            ...semester,
            start_date: semester.startDate,
            end_date: semester.endDate,
            is_active: semester.isActive,
        };
        const response = await fetch(`${API_URL}/semesters/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update semester');
        return response.json();
    },

    activateSemester: async (id: string) => {
        const response = await fetch(`${API_URL}/semesters/${id}/activate`, {
            method: 'PUT',
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Failed to activate semester');
        return response.json();
    },

    deleteSemester: async (id: string) => {
        const response = await fetch(`${API_URL}/semesters/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete semester');
        return response.json();
    },

    // Courses
    getCourses: async () => {
        const response = await fetch(`${API_URL}/courses`);
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        return data.map((c: any) => ({
            ...c,
            hoursPerWeek: c.hours_per_week,
            hoursTheory: c.hours_theory,
            hoursPractice: c.hours_practice,
            hoursLab: c.hours_lab,
            hasLab: Boolean(c.has_lab),
            cycleNumber: c.cycle_number,
        }));
    },

    createCourse: async (course: any) => {
        const payload = {
            ...course,
            hours_per_week: course.hoursPerWeek,
        };
        const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create course');
        return response.json();
    },

    updateCourse: async (id: string, course: any) => {
        const payload = {
            ...course,
            hours_per_week: course.hoursPerWeek,
        };
        const response = await fetch(`${API_URL}/courses/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update course');
        return response.json();
    },

    deleteCourse: async (id: string) => {
        const response = await fetch(`${API_URL}/courses/${id}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete course');
        return response.json();
    },

    // Classrooms
    getClassrooms: async () => {
        const response = await fetch(`${API_URL}/classrooms`);
        if (!response.ok) throw new Error('Failed to fetch classrooms');
        return response.json();
    },

    // Assignments (Horarios reales)
    getAssignments: async (params?: { semester_id?: string | number; teacher_id?: string | number; classroom_id?: string | number }) => {
        const qs = new URLSearchParams();
        if (params?.semester_id) qs.set('semester_id', String(params.semester_id));
        if (params?.teacher_id) qs.set('teacher_id', String(params.teacher_id));
        if (params?.classroom_id) qs.set('classroom_id', String(params.classroom_id));
        const url = `${API_URL}/assignments${qs.toString() ? `?${qs.toString()}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch assignments');
        return response.json();
    },

    // Solver Health
    getSolverHealth: async () => {
        try {
            const response = await fetch(`${API_URL}/solver/health`);
            return response.json();
        } catch {
            return { solver_status: 'unavailable' };
        }
    },

    // Adjudicación por turnos y categorías + Generación CP-SAT
    getActiveAdjudicacion: async (semesterId?: number | string) => {
        const qs = semesterId ? `?semester_id=${semesterId}` : '';
        const response = await fetch(`${API_URL}/adjudicacion/activo${qs}`, { headers: authHeaders() });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },

    iniciarAdjudicacion: async (payload: {
        semester_id: number;
        period?: string;
        cycles?: number[];
        sections?: string[];
        cycle_sections?: Record<string, string[]>;
        repeat_cycles?: number[];
        teacher_ids?: number[];
    }) => {
        const response = await fetch(`${API_URL}/adjudicacion/iniciar`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al iniciar adjudicación');
        return data;
    },

    getTurnoActual: async (processId: number) => {
        const response = await fetch(`${API_URL}/adjudicacion/${processId}/turno-actual`, { headers: authHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al obtener turno actual');
        return data;
    },

    seleccionarSesiones: async (processId: number, teacherId: number, sessions: { course_id: number; section: string; session_type: string }[]) => {
        const response = await fetch(`${API_URL}/adjudicacion/${processId}/seleccionar`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ teacher_id: teacherId, sessions }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al seleccionar sesiones');
        return data;
    },

    confirmarTurno: async (processId: number, teacherId: number) => {
        const response = await fetch(`${API_URL}/adjudicacion/${processId}/confirmar`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ teacher_id: teacherId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al confirmar turno');
        return data;
    },

    saltarTurno: async (processId: number, teacherId: number) => {
        const response = await fetch(`${API_URL}/adjudicacion/${processId}/saltar`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ teacher_id: teacherId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al saltar turno');
        return data;
    },

    getResumenAdjudicacion: async (processId: number) => {
        const response = await fetch(`${API_URL}/adjudicacion/${processId}/resumen`, { headers: authHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al obtener resumen');
        return data;
    },

    generarHorario: async (processId: number, options?: { time_limit_seconds?: number; replace_existing?: boolean; allow_unassigned?: boolean; description?: string }) => {
        const response = await fetch(`${API_URL}/adjudicacion/${processId}/generar`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(options || {}),
        });
        const data = await response.json();
        if (!response.ok) {
            const detailMsg = typeof data.detail === 'object' ? (data.detail.message || JSON.stringify(data.detail)) : (data.detail || '');
            throw new Error([data.error, detailMsg].filter(Boolean).join(': '));
        }
        return data;
    },

    getResultadoHorario: async (processId: number) => {
        const response = await fetch(`${API_URL}/adjudicacion/${processId}/resultado`, { headers: authHeaders() });
        if (!response.ok) return null;
        return response.json();
    },

    eliminarProcesoAdjudicacion: async (processId: number) => {
        const response = await fetch(`${API_URL}/adjudicacion/${processId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al eliminar proceso');
        return data;
    },

    getExportExcelUrl: (processId: number) => `${API_URL}/adjudicacion/${processId}/exportar-excel`,
};
