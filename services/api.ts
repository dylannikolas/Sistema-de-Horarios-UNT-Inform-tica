const API_URL = '/api'; // Vite proxy handles the host

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
            maxHours: t.max_hours, // Map snake_case to camelCase
        }));
    },

    getTeacher: async (id: string) => {
        const response = await fetch(`${API_URL}/teachers/${id}`);
        if (!response.ok) throw new Error('Failed to fetch teacher');
        const t = await response.json();
        return {
            ...t,
            maxHours: t.max_hours,
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ availability }),
        });
        if (!response.ok) throw new Error('Failed to save availability');
        return response.json();
    },


    createTeacher: async (teacher: any) => {
        const payload = {
            ...teacher,
            max_hours: teacher.maxHours,
        };
        const response = await fetch(`${API_URL}/teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to create teacher');
        return response.json();
    },

    updateTeacher: async (id: string, teacher: any) => {
        const payload = {
            ...teacher,
            max_hours: teacher.maxHours,
        };
        const response = await fetch(`${API_URL}/teachers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update teacher');
        return response.json();
    },

    deleteTeacher: async (id: string) => {
        const response = await fetch(`${API_URL}/teachers/${id}`, {
            method: 'DELETE',
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update semester');
        return response.json();
    },


    activateSemester: async (id: string) => {
        const response = await fetch(`${API_URL}/semesters/${id}/activate`, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Failed to activate semester');
        return response.json();
    },

    deleteSemester: async (id: string) => {
        const response = await fetch(`${API_URL}/semesters/${id}`, {
            method: 'DELETE',
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
        }));
    },

    createCourse: async (course: any) => {
        const payload = {
            ...course,
            hours_per_week: course.hoursPerWeek,
        };
        const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update course');
        return response.json();
    },

    deleteCourse: async (id: string) => {
        const response = await fetch(`${API_URL}/courses/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete course');
        return response.json();
    },

    // Classrooms
    getClassrooms: async () => {
        const response = await fetch(`${API_URL}/classrooms`);
        if (!response.ok) throw new Error('Failed to fetch classrooms');
        return response.json();
    }
};
