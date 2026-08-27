import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Event, EventType, DAYS_OF_WEEK } from '../../types';
import { useApp } from '../../context/AppContext';

interface EventFormProps {
  event: Event | null;
  initialDate?: string | null;
  onSubmit: (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function EventForm({ event, initialDate, onSubmit, onCancel, onDelete }: EventFormProps) {
  const { students, academies } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    type: 'private' as EventType,
    studentId: '',
    academyId: '',
    date: initialDate || '',
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        type: event.type,
        studentId: event.studentId || '',
        academyId: event.academyId || '',
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        notes: event.notes,
      });
    } else if (initialDate) {
      setFormData(prev => ({
        ...prev,
        date: initialDate,
        startTime: '09:00',
        endTime: '10:00',
      }));
    }
  }, [event, initialDate]);

  const handleStudentChange = (studentId: string) => {
    if (studentId) {
      const student = students.find(s => s.id === studentId);
      setFormData(prev => ({
        ...prev,
        studentId,
        academyId: '',
        title: student?.name || '',
        location: student?.location || '',
        time: student?.time || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        studentId: '',
        title: '',
      }));
    }
  };

  const handleAcademyChange = (academyId: string) => {
    if (academyId) {
      const academy = academies.find(a => a.id === academyId);
      setFormData(prev => ({
        ...prev,
        academyId,
        studentId: '',
        title: academy?.name || '',
        location: academy?.location || '',
        time: academy?.time || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        academyId: '',
        title: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      type: formData.type,
      studentId: formData.studentId || undefined,
      academyId: formData.academyId || undefined,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      notes: formData.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Event Type */}
      <div>
        <label className="label">Tipo de Evento</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'private' }))}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              formData.type === 'private'
                ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                : 'border-dark-600 text-dark-400 hover:border-dark-500'
            }`}
          >
            Aula Particular
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'group' }))}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              formData.type === 'group'
                ? 'border-dark-500 bg-dark-800 text-white'
                : 'border-dark-600 text-dark-400 hover:border-dark-500'
            }`}
          >
            Aula em Grupo
          </button>
          {event && (
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'cancelled' }))}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                formData.type === 'cancelled'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-dark-600 text-dark-400 hover:border-dark-500'
              }`}
            >
              Cancelado
            </button>
          )}
        </div>
      </div>

      {/* Reference Selection */}
      {formData.type === 'private' && (
        <div>
          <label className="label">Aluno</label>
          <select
            value={formData.studentId}
            onChange={(e) => handleStudentChange(e.target.value)}
            className="input"
          >
            <option value="">Selecione um aluno</option>
            {students.filter(s => s.status === 'active').map(student => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.type === 'group' && (
        <div>
          <label className="label">Academia</label>
          <select
            value={formData.academyId}
            onChange={(e) => handleAcademyChange(e.target.value)}
            className="input"
          >
            <option value="">Selecione uma academia</option>
            {academies.filter(a => a.status === 'active').map(academy => (
              <option key={academy.id} value={academy.id}>
                {academy.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="label">Título</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="input"
          placeholder="Título do evento"
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Data</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Início</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            className="input"
          />
        </div>
        <div>
          <label className="label">Fim</label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            className="input"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="label">Local</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          className="input"
          placeholder="Local do evento"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="label">Observações</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="input min-h-[80px] resize-none"
          placeholder="Observações..."
        />
      </div>

      {/* Actions */}
      <div className={`flex ${onDelete ? 'justify-between' : 'justify-end'} gap-3 pt-4 border-t border-dark-700`}>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="btn-danger"
          >
            <Trash2 className="w-5 h-5" />
            Excluir
          </button>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            {event ? 'Salvar Alterações' : 'Criar Evento'}
          </button>
        </div>
      </div>
    </form>
  );
}
