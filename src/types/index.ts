export type StudentStatus = 'active' | 'inactive';
export type AcademyStatus = 'active' | 'inactive';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type EventType = 'private' | 'group' | 'cancelled';

export interface ScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Student {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  location: string;
  schedule: ScheduleEntry[];
  monthlyValue: number;
  dueDate: number;
  hasGraduation: boolean;
  graduationLevel: string;
  notes: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Academy {
  id: string;
  name: string;
  schedule: ScheduleEntry[];
  location: string;
  monthlyValue: number;
  notes: string;
  status: AcademyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  studentId?: string;
  academyId?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  type: 'student' | 'academy';
  referenceId: string;
  referenceName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  month: string;
  year: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalActiveStudents: number;
  totalAcademies: number;
  weeklyClasses: number;
  todayClasses: number;
  monthlyProjectedRevenue: number;
  monthlyReceivedRevenue: number;
  monthlyPendingRevenue: number;
  todayEvents: Event[];
  upcomingEvents: Event[];
  pendingPayments: Payment[];
}

export interface AppSettings {
  theme: 'dark' | 'light';
  currency: string;
  language: string;
}

export const DAYS_OF_WEEK = [
  { value: 'sunday', label: 'Domingo' },
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
];

export const DEFAULT_VALUES = {
  currency: '€',
  dateFormat: 'dd/MM/yyyy',
};

export const GRADUATION_LEVELS = [
  { value: 'none', label: 'Sem Graduação' },
  { value: 'white', label: 'Pra Jiad (Branco)' },
  { value: 'yellow', label: 'Amarelo' },
  { value: 'orange', label: 'Laranja' },
  { value: 'green', label: 'Verde' },
  { value: 'blue', label: 'Azul' },
  { value: 'brown', label: 'Marrom' },
  { value: 'red', label: 'Vermelho' },
  { value: 'black', label: 'Preto' },
  { value: 'yellow-white', label: 'Amarelo/Branco (Arjarn)' },
];
