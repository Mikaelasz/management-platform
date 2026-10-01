import { useState, useEffect } from 'react';
import { Student, Academy, DAYS_OF_WEEK, GRADUATION_LEVELS, ScheduleEntry } from '../../types';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface StudentFormProps {
  student: Student | null;
  existingStudents: Student[];
  existingAcademies: Academy[];
  onSubmit: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const initialFormData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  birthDate: '',
  phone: '',
  location: '',
  schedule: [] as ScheduleEntry[],
  monthlyValue: 0,
  dueDate: 1,
  hasGraduation: false,
  graduationLevel: 'none',
  notes: '',
  status: 'active',
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Verifica se dois horários se sobrepõem
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  if (!start1 || !start2) return false;

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = end1 ? toMinutes(end1) : s1 + 60; // Assume 1h if no end
  const s2 = toMinutes(start2);
  const e2 = end2 ? toMinutes(end2) : s2 + 60;

  return s1 < e2 && s2 < e1;
}

// Verifica conflitos de horário
function findConflicts(
  schedule: ScheduleEntry[],
  existingStudents: Student[],
  existingAcademies: Academy[],
  currentStudentId?: string
): { conflict: boolean; message: string } {
  const conflicts: string[] = [];

  for (const entry of schedule) {
    if (!entry.startTime) continue;

    // Check conflicts with other students
    for (const student of existingStudents) {
      if (student.id === currentStudentId) continue;
      if (student.status !== 'active') continue;

      for (const existingEntry of student.schedule || []) {
        if (existingEntry.day !== entry.day) continue;
        if (!existingEntry.startTime) continue;

        if (timesOverlap(entry.startTime, entry.endTime || '', existingEntry.startTime, existingEntry.endTime || '')) {
          conflicts.push(`${entry.day}: ${entry.startTime}-${entry.endTime || '?'} conflita com aluno "${student.name}" (${existingEntry.startTime}-${existingEntry.endTime || '?'})`);
        }
      }
    }

    // Check conflicts with academies
    for (const academy of existingAcademies) {
      if (academy.status !== 'active') continue;

      for (const existingEntry of academy.schedule || []) {
        if (existingEntry.day !== entry.day) continue;
        if (!existingEntry.startTime) continue;

        if (timesOverlap(entry.startTime, entry.endTime || '', existingEntry.startTime, existingEntry.endTime || '')) {
          conflicts.push(`${entry.day}: ${entry.startTime}-${entry.endTime || '?'} conflita com academia "${academy.name}" (${existingEntry.startTime}-${existingEntry.endTime || '?'})`);
        }
      }
    }
  }

  if (conflicts.length > 0) {
    return {
      conflict: true,
      message: 'Horários com conflito:\n' + conflicts.join('\n')
    };
  }

  return { conflict: false, message: '' };
}

// Check for duplicate schedules within the same form
function findDuplicateSchedules(schedule: ScheduleEntry[]): { duplicate: boolean; message: string } {
  const duplicates: string[] = [];

  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const s1 = schedule[i];
      const s2 = schedule[j];

      if (s1.day === s2.day && s1.startTime && s2.startTime) {
        if (timesOverlap(s1.startTime, s1.endTime || '', s2.startTime, s2.endTime || '')) {
          const dayLabel = DAYS_OF_WEEK.find(d => d.value === s1.day)?.label || s1.day;
          duplicates.push(`${dayLabel}: ${s1.startTime}-${s1.endTime || '?'} e ${s2.startTime}-${s2.endTime || '?'}`);
        }
      }
    }
  }

  if (duplicates.length > 0) {
    return {
      duplicate: true,
      message: 'Horários duplicados no mesmo dia:\n' + duplicates.join('\n')
    };
  }

  return { duplicate: false, message: '' };
}

export default function StudentForm({
  student,
  existingStudents,
  existingAcademies,
  onSubmit,
  onCancel
}: StudentFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [scheduleWarning, setScheduleWarning] = useState<string | null>(null);
  const [withoutLesson, setWithoutLesson] = useState(false);

  useEffect(() => {
    if (student) {
      const hasSchedule = Boolean((student.schedule || []).length);
      setWithoutLesson(!hasSchedule);
      setFormData({
        name: student.name,
        birthDate: student.birthDate,
        phone: student.phone,
        location: student.location,
        schedule: student.schedule || [],
        monthlyValue: student.monthlyValue,
        dueDate: student.dueDate,
        hasGraduation: student.hasGraduation || false,
        graduationLevel: student.graduationLevel || 'none',
        notes: student.notes,
        status: student.status,
      });
      const daysWithSchedules = [...new Set(student.schedule?.map(s => s.day) || [])];
      setExpandedDays(daysWithSchedules);
    } else {
      setWithoutLesson(false);
      setFormData(initialFormData);
      setExpandedDays([]);
    }
    setErrors({});
    setScheduleWarning(null);
  }, [student]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';

    if (!withoutLesson) {
      if (formData.monthlyValue <= 0) newErrors.monthlyValue = 'Valor mensal deve ser maior que zero';
      if (formData.dueDate < 1 || formData.dueDate > 31) newErrors.dueDate = 'Dia de vencimento inválido';

      // Check for duplicate schedules within the form
      const duplicateCheck = findDuplicateSchedules(formData.schedule);
      if (duplicateCheck.duplicate) {
        newErrors.schedule = duplicateCheck.message;
      }

      // Check for conflicts with existing schedules
      const conflictCheck = findConflicts(
        formData.schedule,
        existingStudents,
        existingAcademies,
        student?.id
      );
      if (conflictCheck.conflict) {
        newErrors.schedule = conflictCheck.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = withoutLesson
      ? { ...formData, schedule: [], monthlyValue: 0, dueDate: 1 }
      : formData;

    onSubmit(payload);
  };

  const toggleDay = (day: string) => {
    if (withoutLesson) {
      setWithoutLesson(false);
    }

    setExpandedDays(prev => {
      if (prev.includes(day)) {
        setFormData(p => ({
          ...p,
          schedule: p.schedule.filter(s => s.day !== day)
        }));
        return prev.filter(d => d !== day);
      } else {
        setFormData(p => ({
          ...p,
          schedule: [...p.schedule, { day, startTime: '', endTime: '', id: generateId() }]
        }));
        return [...prev, day];
      }
    });
    setScheduleWarning(null);
  };

  const addScheduleForDay = (day: string) => {
    if (withoutLesson) {
      setWithoutLesson(false);
    }

    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { day, startTime: '', endTime: '', id: generateId() }]
    }));
    setScheduleWarning(null);
  };

  const updateScheduleTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));

    // Real-time conflict check
    const updatedSchedule = formData.schedule.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );

    const conflictCheck = findConflicts(updatedSchedule, existingStudents, existingAcademies, student?.id);
    const duplicateCheck = findDuplicateSchedules(updatedSchedule);

    if (conflictCheck.conflict || duplicateCheck.duplicate) {
      setScheduleWarning(conflictCheck.message || duplicateCheck.message);
    } else {
      setScheduleWarning(null);
    }
  };

  const removeSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
    setScheduleWarning(null);
  };

  const getSchedulesForDay = (day: string): (ScheduleEntry & { id?: string; index: number })[] => {
    return formData.schedule
      .map((s, index) => ({ ...s, index }))
      .filter(s => s.day === day);
  };

  const getDayLabel = (day: string): string => {
    const d = DAYS_OF_WEEK.find(d => d.value === day);
    return d ? d.label : day;
  };

  // Check real-time for existing schedules on this day/time
  const getExistingSchedulesForDay = (day: string): { name: string; startTime: string; endTime: string; type: 'student' | 'academy' }[] => {
    const existing: { name: string; startTime: string; endTime: string; type: 'student' | 'academy' }[] = [];

    for (const s of existingStudents) {
      if (s.id === student?.id) continue;
      if (s.status !== 'active') continue;

      for (const entry of s.schedule || []) {
        if (entry.day === day && entry.startTime) {
          existing.push({
            name: s.name,
            startTime: entry.startTime,
            endTime: entry.endTime || '',
            type: 'student'
          });
        }
      }
    }

    for (const a of existingAcademies) {
      if (a.status !== 'active') continue;

      for (const entry of a.schedule || []) {
        if (entry.day === day && entry.startTime) {
          existing.push({
            name: a.name,
            startTime: entry.startTime,
            endTime: entry.endTime || '',
            type: 'academy'
          });
        }
      }
    }

    return existing.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nome Completo *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            className={`input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Nome do aluno"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="label">Data de Nascimento</label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Telefone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
            className="input"
            placeholder="+351 912 345 678"
          />
        </div>
        <div>
          <label className="label">Local do Treino</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
            className="input"
            placeholder="Academia, endereço..."
          />
        </div>
      </div>

      {/* Schedule - Horários por Dia */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <label className="label mb-1">Horários por Dia da Semana</label>
            <p className="text-xs text-dark-500">Selecione os dias e adicione quantos horários forem necessários</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-xs text-dark-300 cursor-pointer">
            <input
              type="checkbox"
              checked={withoutLesson}
              onChange={() => {
                const nextValue = !withoutLesson;
                setWithoutLesson(nextValue);
                if (nextValue) {
                  setFormData((p) => ({ ...p, schedule: [], monthlyValue: 0, dueDate: 1 }));
                  setExpandedDays([]);
                  setScheduleWarning(null);
                }
              }}
              className="w-4 h-4 text-primary-500 accent-primary-500"
            />
            Sem aula vinculada
          </label>
        </div>

        {withoutLesson && (
          <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-200">
            Este aluno ficará cadastrado sem aula associada. Você pode vincular o horário depois, se necessário.
          </div>
        )}

        {scheduleWarning && (
          <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-200 whitespace-pre-line">{scheduleWarning}</p>
            </div>
          </div>
        )}

        <div className={`space-y-3 ${withoutLesson ? 'pointer-events-none opacity-50' : ''}`}>
          {DAYS_OF_WEEK.map((day) => {
            const isExpanded = expandedDays.includes(day.value);
            const daySchedules = getSchedulesForDay(day.value);
            const existingSchedules = getExistingSchedulesForDay(day.value);

            return (
              <div
                key={day.value}
                className={`rounded-lg border transition-all ${
                  isExpanded
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 bg-dark-800/50'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between p-4">
                  <button
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex items-center gap-3 ${
                      isExpanded ? 'text-primary-400' : 'text-dark-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isExpanded
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-dark-500'
                    }`}>
                      {isExpanded && (
                        <svg className="w-3 h-3 text-dark-950" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l7-7a.75.75 0 00-1.06-1.06z"/>
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{day.label}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    {existingSchedules.length > 0 && (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {existingSchedules.length} ocupado
                      </span>
                    )}
                    {daySchedules.length > 0 && (
                      <span className="text-xs text-dark-400">
                        {daySchedules.length} {daySchedules.length === 1 ? 'horário' : 'horários'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Schedules for this day */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-fade-in">
                    {/* Show existing schedules as reference */}
                    {existingSchedules.length > 0 && (
                      <div className="text-xs text-dark-400 bg-dark-800/50 p-2 rounded">
                        <p className="mb-1 text-dark-500">Horários já ocupados:</p>
                        {existingSchedules.map((es, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${es.type === 'academy' ? 'bg-blue-400' : 'bg-primary-400'}`} />
                            <span>{es.startTime}{es.endTime ? ` - ${es.endTime}` : ''}</span>
                            <span className="text-dark-500">({es.name})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {daySchedules.map((schedule, idx) => (
                      <div
                        key={schedule.id || idx}
                        className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-dark-400 mb-1 block">Início</label>
                            <input
                              type="time"
                              value={schedule.startTime}
                              onChange={(e) => updateScheduleTime(schedule.index, 'startTime', e.target.value)}
                              className="input text-sm py-2"
                              placeholder="--:--"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-dark-400 mb-1 block">Término</label>
                            <input
                              type="time"
                              value={schedule.endTime}
                              onChange={(e) => updateScheduleTime(schedule.index, 'endTime', e.target.value)}
                              className="input text-sm py-2"
                              placeholder="--:--"
                            />
                          </div>
                        </div>
                        {daySchedules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSchedule(schedule.index)}
                            className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                            title="Remover este horário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add more schedules button */}
                    <button
                      type="button"
                      onClick={() => addScheduleForDay(day.value)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm text-dark-400 hover:text-primary-400 border border-dashed border-dark-600 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar outro horário
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {errors.schedule && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 whitespace-pre-line">{errors.schedule}</p>
          </div>
        )}
      </div>

      {/* Graduation */}
      <div className="card bg-dark-800/50 border border-dark-700">
        <h4 className="text-sm font-medium text-white mb-4">Graduação (Khan)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Possui Graduação?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="hasGraduation"
                  checked={formData.hasGraduation === true}
                  onChange={() => setFormData((p) => ({ ...p, hasGraduation: true }))}
                  className="w-4 h-4 text-primary-500"
                />
                <span className="text-sm text-dark-300">Sim</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="hasGraduation"
                  checked={formData.hasGraduation === false}
                  onChange={() => setFormData((p) => ({ ...p, hasGraduation: false, graduationLevel: 'none' }))}
                  className="w-4 h-4 text-primary-500"
                />
                <span className="text-sm text-dark-300">Não</span>
              </label>
            </div>
          </div>
          {formData.hasGraduation && (
            <div>
              <label className="label">Nível de Graduação</label>
              <select
                value={formData.graduationLevel}
                onChange={(e) => setFormData((p) => ({ ...p, graduationLevel: e.target.value }))}
                className="input"
              >
                {GRADUATION_LEVELS.filter(g => g.value !== 'none').map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Financial */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${withoutLesson ? 'opacity-60' : ''}`}>
        <div>
          <label className="label">Valor Mensal (€) {withoutLesson ? '' : '*'}</label>
          <input
            type="number"
            value={formData.monthlyValue || ''}
            disabled={withoutLesson}
            onChange={(e) => setFormData((p) => ({ ...p, monthlyValue: Number(e.target.value) }))}
            className={`input ${errors.monthlyValue ? 'border-red-500' : ''} ${withoutLesson ? 'cursor-not-allowed opacity-60' : ''}`}
            placeholder="100"
            min="0"
            step="0.01"
          />
          {errors.monthlyValue && <p className="text-red-500 text-xs mt-1">{errors.monthlyValue}</p>}
        </div>
        <div>
          <label className="label">Dia de Vencimento {withoutLesson ? '' : '*'}</label>
          <input
            type="number"
            value={formData.dueDate || ''}
            disabled={withoutLesson}
            onChange={(e) => setFormData((p) => ({ ...p, dueDate: Number(e.target.value) }))}
            className={`input ${errors.dueDate ? 'border-red-500' : ''} ${withoutLesson ? 'cursor-not-allowed opacity-60' : ''}`}
            placeholder="5"
            min="1"
            max="31"
          />
          {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
        </div>
      </div>
      {withoutLesson && (
        <p className="text-xs text-dark-500 -mt-2">Esses campos ficam disponíveis quando o aluno tem uma aula associada.</p>
      )}

      <div>
        <label className="label">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
          className="input"
        >
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Observações</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          className="input min-h-[80px] resize-none"
          placeholder="Observações importantes..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          {student ? 'Salvar Alterações' : 'Adicionar Aluno'}
        </button>
      </div>
    </form>
  );
}
