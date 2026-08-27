import { supabase } from '../lib/supabase';
import { Student, Academy, Event, Payment, ScheduleEntry } from '../types';
import { format } from 'date-fns';

// Helper to parse dates from Supabase
function parseStudent(data: Record<string, unknown>): Student {
  return {
    id: data.id as string,
    name: data.name as string,
    birthDate: data.birth_date || '',
    phone: data.phone || '',
    location: data.location || '',
    schedule: (data.schedule as ScheduleEntry[]) || [],
    monthlyValue: Number(data.monthly_value) || 0,
    dueDate: Number(data.due_date) || 1,
    hasGraduation: Boolean(data.has_graduation),
    graduationLevel: data.graduation_level as string || 'none',
    notes: data.notes as string || '',
    status: data.status as 'active' | 'inactive' || 'active',
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function parseAcademy(data: Record<string, unknown>): Academy {
  return {
    id: data.id as string,
    name: data.name as string,
    schedule: (data.schedule as ScheduleEntry[]) || [],
    location: data.location || '',
    monthlyValue: Number(data.monthly_value) || 0,
    notes: data.notes as string || '',
    status: data.status as 'active' | 'inactive' || 'active',
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function parseEvent(data: Record<string, unknown>): Event {
  return {
    id: data.id as string,
    title: data.title as string || '',
    type: data.type as 'private' | 'group' | 'cancelled' || 'private',
    studentId: data.student_id as string | undefined,
    academyId: data.academy_id as string | undefined,
    date: data.date as string,
    startTime: data.start_time as string || '',
    endTime: data.end_time as string || '',
    location: data.location as string || '',
    notes: data.notes as string || '',
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function parsePayment(data: Record<string, unknown>): Payment {
  return {
    id: data.id as string,
    type: data.type as 'student' | 'academy' || 'student',
    referenceId: data.reference_id as string,
    referenceName: data.reference_name as string || '',
    amount: Number(data.amount) || 0,
    dueDate: data.due_date as string || '',
    paidDate: data.paid_date as string | undefined,
    month: data.month as string || '',
    year: Number(data.year) || new Date().getFullYear(),
    status: data.status as 'paid' | 'pending' | 'overdue' || 'pending',
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// Students
export async function loadStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error loading students:', error);
    return [];
  }

  return (data || []).map(parseStudent);
}

export async function saveStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .insert({
      name: student.name,
      birth_date: student.birthDate || null,
      phone: student.phone,
      location: student.location,
      schedule: student.schedule,
      monthly_value: student.monthlyValue,
      due_date: student.dueDate,
      has_graduation: student.hasGraduation,
      graduation_level: student.graduationLevel,
      notes: student.notes,
      status: student.status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving student:', error);
    return null;
  }

  return parseStudent(data);
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<boolean> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.birthDate !== undefined) updateData.birth_date = updates.birthDate || null;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.schedule !== undefined) updateData.schedule = updates.schedule;
  if (updates.monthlyValue !== undefined) updateData.monthly_value = updates.monthlyValue;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
  if (updates.hasGraduation !== undefined) updateData.has_graduation = updates.hasGraduation;
  if (updates.graduationLevel !== undefined) updateData.graduation_level = updates.graduationLevel;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { error } = await supabase
    .from('students')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating student:', error);
    return false;
  }

  return true;
}

export async function deleteStudent(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting student:', error);
    return false;
  }

  return true;
}

// Academies
export async function loadAcademies(): Promise<Academy[]> {
  const { data, error } = await supabase
    .from('academies')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error loading academies:', error);
    return [];
  }

  return (data || []).map(parseAcademy);
}

export async function saveAcademy(academy: Omit<Academy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Academy | null> {
  const { data, error } = await supabase
    .from('academies')
    .insert({
      name: academy.name,
      schedule: academy.schedule,
      location: academy.location,
      monthly_value: academy.monthlyValue,
      notes: academy.notes,
      status: academy.status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving academy:', error);
    return null;
  }

  return parseAcademy(data);
}

export async function updateAcademy(id: string, updates: Partial<Academy>): Promise<boolean> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.schedule !== undefined) updateData.schedule = updates.schedule;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.monthlyValue !== undefined) updateData.monthly_value = updates.monthlyValue;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { error } = await supabase
    .from('academies')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating academy:', error);
    return false;
  }

  return true;
}

export async function deleteAcademy(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('academies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting academy:', error);
    return false;
  }

  return true;
}

// Events
export async function loadEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error loading events:', error);
    return [];
  }

  return (data || []).map(parseEvent);
}

export async function saveEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: event.title,
      type: event.type,
      student_id: event.studentId || null,
      academy_id: event.academyId || null,
      date: event.date,
      start_time: event.startTime,
      end_time: event.endTime,
      location: event.location,
      notes: event.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving event:', error);
    return null;
  }

  return parseEvent(data);
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<boolean> {
  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.studentId !== undefined) updateData.student_id = updates.studentId || null;
  if (updates.academyId !== undefined) updateData.academy_id = updates.academyId || null;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
  if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating event:', error);
    return false;
  }

  return true;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting event:', error);
    return false;
  }

  return true;
}

// Payments
export async function loadPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('due_date', { ascending: false });

  if (error) {
    console.error('Error loading payments:', error);
    return [];
  }

  return (data || []).map(parsePayment);
}

export async function savePayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      type: payment.type,
      reference_id: payment.referenceId,
      reference_name: payment.referenceName,
      amount: payment.amount,
      due_date: payment.dueDate || null,
      paid_date: payment.paidDate || null,
      month: payment.month,
      year: payment.year,
      status: payment.status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving payment:', error);
    return null;
  }

  return parsePayment(data);
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<boolean> {
  const updateData: Record<string, unknown> = {};

  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.referenceId !== undefined) updateData.reference_id = updates.referenceId;
  if (updates.referenceName !== undefined) updateData.reference_name = updates.referenceName;
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate || null;
  if (updates.paidDate !== undefined) updateData.paid_date = updates.paidDate || null;
  if (updates.month !== undefined) updateData.month = updates.month;
  if (updates.year !== undefined) updateData.year = updates.year;
  if (updates.status !== undefined) updateData.status = updates.status;

  const { error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating payment:', error);
    return false;
  }

  return true;
}

export async function deletePayment(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting payment:', error);
    return false;
  }

  return true;
}

// Initialize data - no longer needed with Supabase
export async function initializeData(): Promise<void> {
  // Data is already initialized via migrations
}
