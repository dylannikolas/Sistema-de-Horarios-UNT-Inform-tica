
export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  category: 'Principal' | 'Asociado' | 'Auxiliar' | 'Contratado';
  code: string;
  avatar: string;
  maxHours: number;
  role: 'DIRECTOR' | 'DOCENTE'; // Nuevo campo de rol
}

export interface Course {
  id: string;
  code: string;
  name: string;
  cycle: string;
  credits: number;
  hoursPerWeek: number;
}

export interface AvailabilitySlot {
  day: string;
  hour: string;
  isOptional: boolean;
}

export interface TeacherAvailability {
  teacherId: string;
  slots: AvailabilitySlot[];
}

export interface Classroom {
  id: string;
  name: string;
  type: 'Teoría' | 'Laboratorio';
  capacity: number;
}
