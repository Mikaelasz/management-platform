import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { useApp } from '../../context/AppContext';
import { Event as AppEvent, EventType, ScheduleEntry, Student, Academy } from '../../types';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EventForm from './EventForm';
import ClassDetailModal from './ClassDetailModal';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import Loading from '../common/Loading';
import { v4 as uuidv4 } from 'uuid';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  classNames?: string[];
  extendedProps: {
    type: EventType;
    studentId?: string;
    academyId?: string;
    location: string;
    notes: string;
  };
}

interface ClassInfo {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: 'private' | 'group';
  studentId?: string;
  academyId?: string;
  location?: string;
  notes?: string;
  student?: Student;
  academy?: Academy;
  isRecurring: boolean;
}

export default function CalendarPage() {
  const { events, students, academies, loading, addEvent, updateEvent, deleteEvent } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);

  useEffect(() => {
    const mapped: CalendarEvent[] = events.map((event) => {
      let classNames: string[] = [];
      if (event.type === 'private') classNames = ['fc-event-private'];
      else if (event.type === 'group') classNames = ['fc-event-group'];
      else if (event.type === 'cancelled') classNames = ['fc-event-cancelled'];

      return {
        id: event.id,
        title: event.title,
        start: event.date + (event.startTime ? 'T' + event.startTime : ''),
        end: event.date + (event.endTime ? 'T' + event.endTime : ''),
        classNames,
        extendedProps: {
          type: event.type,
          studentId: event.studentId,
          academyId: event.academyId,
          location: event.location,
          notes: event.notes,
        },
      };
    });

    // Add recurring events from students and academies
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    // Helper function to get ALL schedules for a specific day
    const getSchedulesForDay = (schedule: ScheduleEntry[], dayName: string): ScheduleEntry[] => {
      return schedule.filter(s => s.day === dayName);
    };

    // Get cancelled classes for this month
    const cancelledClasses = events.filter(e => e.type === 'cancelled');
    const isCancelled = (date: string, type: string, studentId?: string, academyId?: string): boolean => {
      return cancelledClasses.some(c =>
        c.date === date &&
        (c.studentId === studentId || c.academyId === academyId)
      );
    };

    // Add student recurring classes
    students.filter(s => s.status === 'active').forEach(student => {
      let current = new Date(startOfMonth);
      while (current <= endOfMonth) {
        const dayName = format(current, 'EEEE').toLowerCase();
        const daySchedules = getSchedulesForDay(student.schedule || [], dayName);
        const dateStr = format(current, 'yyyy-MM-dd');

        daySchedules.forEach((scheduleEntry, idx) => {
          // Skip if this class is cancelled
          if (!isCancelled(dateStr, 'private', student.id)) {
            mapped.push({
              id: `student-${student.id}-${dateStr}-${idx}`,
              title: student.name,
              start: dateStr + (scheduleEntry.startTime ? 'T' + scheduleEntry.startTime : ''),
              end: scheduleEntry.endTime ? dateStr + 'T' + scheduleEntry.endTime : undefined,
              classNames: ['fc-event-private'],
              extendedProps: {
                type: 'private',
                studentId: student.id,
                location: student.location,
                notes: '',
              },
            });
          }
        });
        current.setDate(current.getDate() + 1);
      }
    });

    // Add academy recurring classes
    academies.filter(a => a.status === 'active').forEach(academy => {
      let current = new Date(startOfMonth);
      while (current <= endOfMonth) {
        const dayName = format(current, 'EEEE').toLowerCase();
        const daySchedules = getSchedulesForDay(academy.schedule || [], dayName);
        const dateStr = format(current, 'yyyy-MM-dd');

        daySchedules.forEach((scheduleEntry, idx) => {
          // Skip if this class is cancelled
          if (!isCancelled(dateStr, 'group', undefined, academy.id)) {
            mapped.push({
              id: `academy-${academy.id}-${dateStr}-${idx}`,
              title: academy.name,
              start: dateStr + (scheduleEntry.startTime ? 'T' + scheduleEntry.startTime : ''),
              end: scheduleEntry.endTime ? dateStr + 'T' + scheduleEntry.endTime : undefined,
              classNames: ['fc-event-group'],
              extendedProps: {
                type: 'group',
                academyId: academy.id,
                location: academy.location,
                notes: '',
              },
            });
          }
        });
        current.setDate(current.getDate() + 1);
      }
    });

    setCalendarEvents(mapped);
  }, [events, students, academies]);

  const handleDateClick = useCallback((arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr);
    setEditingEvent(null);
    setShowModal(true);
  }, []);

  const handleEventClick = useCallback((arg: { event: { id: string; extendedProps: Record<string, unknown>; start: Date; end?: Date } }) => {
    const eventId = arg.event.id;

    // Check if it's a real event or a generated recurring one
    if (!eventId.startsWith('student-') && !eventId.startsWith('academy-')) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        setEditingEvent(event);
        setSelectedDate(event.date);
        setShowModal(true);
      }
      return;
    }

    // Handle recurring class clicks
    const extendedProps = arg.event.extendedProps as {
      type: EventType;
      studentId?: string;
      academyId?: string;
      location: string;
      notes: string;
    };

    const dateStr = format(arg.event.start, 'yyyy-MM-dd');
    const startTime = arg.event.start ? format(arg.event.start, 'HH:mm') : undefined;
    const endTime = arg.event.end ? format(arg.event.end, 'HH:mm') : undefined;

    const student = extendedProps.studentId ? students.find(s => s.id === extendedProps.studentId) : undefined;
    const academy = extendedProps.academyId ? academies.find(a => a.id === extendedProps.academyId) : undefined;

    const classInfo: ClassInfo = {
      id: eventId,
      title: arg.event.title || (student?.name || academy?.name || 'Aula'),
      date: dateStr,
      startTime,
      endTime,
      type: extendedProps.type as 'private' | 'group',
      studentId: extendedProps.studentId,
      academyId: extendedProps.academyId,
      location: extendedProps.location || student?.location || academy?.location,
      notes: extendedProps.notes,
      student,
      academy,
      isRecurring: true,
    };

    setSelectedClass(classInfo);
    setShowClassModal(true);
  }, [events, students, academies]);

  const handleEventDrop = useCallback((arg: { event: { id: string; start: Date; end?: Date } }) => {
    const eventId = arg.event.id;
    if (!eventId.startsWith('student-') && !eventId.startsWith('academy-')) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        const newDate = format(arg.event.start, 'yyyy-MM-dd');
        updateEvent(eventId, {
          date: newDate,
          startTime: arg.event.start ? format(arg.event.start, 'HH:mm') : event.startTime,
          endTime: arg.event.end ? format(arg.event.end, 'HH:mm') : event.endTime,
        });
      }
    }
  }, [events, updateEvent]);

  const handleAdd = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleSubmit = (data: Omit<AppEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
    } else {
      addEvent(data);
    }
    setShowModal(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
    setDeleteConfirm(null);
  };

  // Cancel a class and add it as a cancelled event
  const handleCancelClass = (date: string, type: 'private' | 'group', studentId?: string, academyId?: string) => {
    const student = studentId ? students.find(s => s.id === studentId) : undefined;
    const academy = academyId ? academies.find(a => a.id === academyId) : undefined;

    const cancelledEvent: Omit<AppEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      title: `${student?.name || academy?.name} - CANCELADA`,
      date,
      startTime: undefined,
      endTime: undefined,
      type: 'cancelled',
      studentId,
      academyId,
      location: student?.location || academy?.location || '',
      notes: 'Aula cancelada',
    };

    addEvent(cancelledEvent);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agenda</h1>
          <p className="text-dark-400 mt-1">Gerencie suas aulas e eventos</p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
          <Plus className="w-5 h-5" />
          Novo Evento
        </button>
      </div>

      {/* Legend */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary-500" />
            <span className="text-sm text-dark-300">Aulas Particulares</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm text-dark-300">Aulas em Academia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-sm text-dark-300">Cancelados</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card p-0 overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale={ptBrLocale}
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
          droppable={true}
          eventDrop={handleEventDrop}
          height="auto"
          dayMaxEvents={3}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEvent(null);
          setSelectedDate(null);
        }}
        title={editingEvent ? 'Editar Evento' : 'Novo Evento'}
        size="lg"
      >
        <EventForm
          event={editingEvent}
          initialDate={selectedDate}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingEvent(null);
            setSelectedDate(null);
          }}
          onDelete={editingEvent ? () => setDeleteConfirm(editingEvent.id) : undefined}
        />
      </Modal>

      {/* Class Detail Modal */}
      <ClassDetailModal
        isOpen={showClassModal}
        onClose={() => {
          setShowClassModal(false);
          setSelectedClass(null);
        }}
        classData={selectedClass}
        student={selectedClass?.student}
        academy={selectedClass?.academy}
        onCancelClass={handleCancelClass}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Excluir Evento"
        message="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
