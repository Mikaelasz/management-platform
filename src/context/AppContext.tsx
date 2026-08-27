import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Academy, Event, Payment, DashboardMetrics } from '../types';
import {
  loadStudents,
  saveStudent,
  updateStudent as updateStudentDb,
  deleteStudent as deleteStudentDb,
  loadAcademies,
  saveAcademy,
  updateAcademy as updateAcademyDb,
  deleteAcademy as deleteAcademyDb,
  loadEvents,
  saveEvent,
  updateEvent as updateEventDb,
  deleteEvent as deleteEventDb,
  loadPayments,
  savePayment,
  updatePayment as updatePaymentDb,
  deletePayment as deletePaymentDb,
} from '../services/databaseService';
import { supabase } from '../lib/supabase';
import { format, isToday, startOfMonth, isSameMonth, isAfter, isBefore, addDays, parseISO } from 'date-fns';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

type AuthStatus = 'checking' | 'unauthorized' | 'authenticated' | 'loading';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  students: Student[];
  academies: Academy[];
  events: Event[];
  payments: Payment[];
  metrics: DashboardMetrics;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addAcademy: (academy: Omit<Academy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAcademy: (id: string, academy: Partial<Academy>) => Promise<void>;
  deleteAcademy: (id: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  markPaymentPaid: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

async function checkEmailAuthorized(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('authorized_emails')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error checking authorization:', error);
    return false;
  }

  return !!data;
}

function calculateMetrics(
  students: Student[],
  academies: Academy[],
  events: Event[],
  payments: Payment[]
): DashboardMetrics {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  const activeStudents = students.filter(s => s.status === 'active');
  const activeAcademies = academies.filter(a => a.status === 'active');

  let weeklyClasses = 0;
  activeStudents.forEach(s => {
    weeklyClasses += s.schedule?.length || 0;
  });
  activeAcademies.forEach(a => {
    weeklyClasses += a.schedule?.length || 0;
  });

  const todayDayOfWeek = format(now, 'EEEE').toLowerCase();
  const todayClasses = students.filter(s =>
    s.status === 'active' && s.schedule?.some(entry => entry.day === todayDayOfWeek)
  ).length + academies.filter(a =>
    a.status === 'active' && a.schedule?.some(entry => entry.day === todayDayOfWeek)
  ).length;

  const todayEvents = events.filter(e =>
    e.date === todayStr && e.type !== 'cancelled'
  );

  const currentMonthPayments = payments.filter(p =>
    p.dueDate && isSameMonth(parseISO(p.dueDate), now)
  );

  const monthlyProjectedRevenue = activeStudents.reduce((sum, s) => sum + s.monthlyValue, 0) +
    activeAcademies.reduce((sum, a) => sum + a.monthlyValue, 0);

  const monthlyReceivedRevenue = currentMonthPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyPendingRevenue = currentMonthPayments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const upcomingEvents = events
    .filter(e => {
      const eventDate = parseISO(e.date);
      return e.type !== 'cancelled' &&
        (isToday(eventDate) || (isAfter(eventDate, now) && isBefore(eventDate, addDays(now, 7))));
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const pendingPayments = payments.filter(p =>
    p.status !== 'paid' && p.dueDate && isSameMonth(parseISO(p.dueDate), now)
  );

  return {
    totalActiveStudents: activeStudents.length,
    totalAcademies: activeAcademies.length,
    weeklyClasses,
    todayClasses,
    monthlyProjectedRevenue,
    monthlyReceivedRevenue,
    monthlyPendingRevenue,
    todayEvents,
    upcomingEvents,
    pendingPayments,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [students, setStudents] = useState<Student[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = authStatus === 'authenticated';

  // Check initial session and set up auth listener
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // getUser() validates the session with the server, unlike getSession()
        // which only reads from local storage. This prevents treating an
        // expired session as valid.
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error || !authUser) {
          // No valid session — clear any stale storage and show login
          await supabase.auth.signOut();
          setAuthStatus('loading');
          return;
        }

        const email = authUser.email || '';
        const isAuthorized = await checkEmailAuthorized(email);

        if (!mounted) return;

        if (isAuthorized) {
          setUser({
            id: authUser.id,
            email: email,
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0],
            avatar: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          });
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthorized');
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) {
          await supabase.auth.signOut().catch(() => {});
          setAuthStatus('loading');
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth init timed out, showing login page');
        setAuthStatus('loading');
      }
    }, 5000);

    initAuth().finally(() => clearTimeout(timeoutId));

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const result = supabase.auth.onAuthStateChange((event) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthStatus('loading');
        }
      });
      subscription = result.data.subscription;
    } catch (error) {
      console.error('onAuthStateChange setup error:', error);
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedStudents, loadedAcademies, loadedEvents, loadedPayments] = await Promise.all([
        loadStudents(),
        loadAcademies(),
        loadEvents(),
        loadPayments(),
      ]);
      setStudents(loadedStudents);
      setAcademies(loadedAcademies);
      setEvents(loadedEvents);
      setPayments(loadedPayments);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const metrics = useMemo(() =>
    calculateMetrics(students, academies, events, payments),
    [students, academies, events, payments]
  );

  const login = useCallback(async (email: string, password: string) => {
    setAuthStatus('loading');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthStatus('loading');
      throw error;
    }

    if (data?.user) {
      const isAuthorized = await checkEmailAuthorized(email);
      if (!isAuthorized) {
        await supabase.auth.signOut();
        setAuthStatus('unauthorized');
        throw new Error('UNAUTHORIZED');
      }

      setUser({
        id: data.user.id,
        email: email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0],
        avatar: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
      });
      setAuthStatus('authenticated');
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthStatus('loading');
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setAuthStatus('loading');
      throw error;
    }

    if (data?.user) {
      const isAuthorized = await checkEmailAuthorized(email);
      if (!isAuthorized) {
        await supabase.auth.signOut();
        setAuthStatus('unauthorized');
        throw new Error('UNAUTHORIZED');
      }

      // For signUp, the user may need to confirm email before session is active
      if (data.session) {
        setUser({
          id: data.user.id,
          email: email,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0],
          avatar: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
        });
        setAuthStatus('authenticated');
      } else {
        // Email confirmation required — show login page so they can sign in
        setAuthStatus('loading');
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthStatus('loading');
    setStudents([]);
    setAcademies([]);
    setEvents([]);
    setPayments([]);
  }, []);

  // Student operations
  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStudent = await saveStudent(studentData);
    if (newStudent) {
      setStudents(prev => [...prev, newStudent]);
    }
  }, []);

  const updateStudent = useCallback(async (id: string, data: Partial<Student>) => {
    const success = await updateStudentDb(id, data);
    if (success) {
      setStudents(prev => prev.map(s =>
        s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
      ));
    }
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    const success = await deleteStudentDb(id);
    if (success) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  }, []);

  // Academy operations
  const addAcademy = useCallback(async (academyData: Omit<Academy, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAcademy = await saveAcademy(academyData);
    if (newAcademy) {
      setAcademies(prev => [...prev, newAcademy]);
    }
  }, []);

  const updateAcademy = useCallback(async (id: string, data: Partial<Academy>) => {
    const success = await updateAcademyDb(id, data);
    if (success) {
      setAcademies(prev => prev.map(a =>
        a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
      ));
    }
  }, []);

  const deleteAcademy = useCallback(async (id: string) => {
    const success = await deleteAcademyDb(id);
    if (success) {
      setAcademies(prev => prev.filter(a => a.id !== id));
    }
  }, []);

  // Event operations
  const addEvent = useCallback(async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent = await saveEvent(eventData);
    if (newEvent) {
      setEvents(prev => [...prev, newEvent]);
    }
  }, []);

  const updateEvent = useCallback(async (id: string, data: Partial<Event>) => {
    const success = await updateEventDb(id, data);
    if (success) {
      setEvents(prev => prev.map(e =>
        e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
      ));
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const success = await deleteEventDb(id);
    if (success) {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  }, []);

  // Payment operations
  const addPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPayment = await savePayment(paymentData);
    if (newPayment) {
      setPayments(prev => [...prev, newPayment]);
    }
  }, []);

  const updatePayment = useCallback(async (id: string, data: Partial<Payment>) => {
    const success = await updatePaymentDb(id, data);
    if (success) {
      setPayments(prev => prev.map(p =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      ));
    }
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    const success = await deletePaymentDb(id);
    if (success) {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  const markPaymentPaid = useCallback(async (id: string) => {
    const success = await updatePaymentDb(id, {
      status: 'paid',
      paidDate: new Date().toISOString(),
    });
    if (success) {
      setPayments(prev => prev.map(p =>
        p.id === id ? {
          ...p,
          status: 'paid',
          paidDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } : p
      ));
    }
  }, []);

  const value: AppContextType = {
    user,
    isAuthenticated,
    authStatus,
    students,
    academies,
    events,
    payments,
    metrics,
    loading,
    login,
    signUp,
    logout,
    addStudent,
    updateStudent,
    deleteStudent,
    addAcademy,
    updateAcademy,
    deleteAcademy,
    addEvent,
    updateEvent,
    deleteEvent,
    addPayment,
    updatePayment,
    deletePayment,
    markPaymentPaid,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
