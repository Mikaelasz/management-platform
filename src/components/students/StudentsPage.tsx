import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Users, Phone, MapPin, Euro, Award, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, StudentStatus, GRADUATION_LEVELS, DAYS_OF_WEEK } from '../../types';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import SearchBar from '../common/SearchBar';
import EmptyState from '../common/EmptyState';
import Loading from '../common/Loading';
import StudentForm from './StudentForm';

export default function StudentsPage() {
  const { students, academies, loading, addStudent, updateStudent, deleteStudent } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.phone.includes(search) ||
        student.location.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const handleAdd = () => {
    setEditingStudent(null);
    setShowModal(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteStudent(id);
    setDeleteConfirm(null);
  };

  const handleSubmit = (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingStudent) {
      updateStudent(editingStudent.id, data);
    } else {
      addStudent(data);
    }
    setShowModal(false);
    setEditingStudent(null);
  };

  const getGraduationLabel = (level: string): string => {
    const grad = GRADUATION_LEVELS.find(g => g.value === level);
    return grad ? grad.label : '';
  };

  const getDayLabel = (day: string): string => {
    const d = DAYS_OF_WEEK.find(d => d.value === day);
    return d ? d.label : day;
  };

  const groupSchedulesByDay = (schedules: Student['schedule']) => {
    const grouped: Record<string, { time: string }[]> = {};
    schedules?.forEach(entry => {
      if (!grouped[entry.day]) {
        grouped[entry.day] = [];
      }
      const time = entry.startTime && entry.endTime
        ? `${entry.startTime} - ${entry.endTime}`
        : entry.startTime || 'Sem horário';
      grouped[entry.day].push({ time });
    });
    return grouped;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Alunos Particulares</h1>
          <p className="text-dark-400 mt-1">
            {students.filter(s => s.status === 'active').length} alunos ativos
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
          <Plus className="w-5 h-5" />
          Novo Aluno
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar aluno..."
          className="flex-1"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-primary-500 text-dark-950'
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-primary-500 text-dark-950'
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'inactive'
                ? 'bg-primary-500 text-dark-950'
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Inativos
          </button>
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum aluno encontrado"
          description={
            search || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece adicionando seu primeiro aluno particular'
          }
          action={!search && statusFilter === 'all' ? { label: 'Adicionar Aluno', onClick: handleAdd } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const groupedSchedules = groupSchedulesByDay(student.schedule);

            return (
              <div
                key={student.id}
                className="card group hover:border-dark-600 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      student.status === 'active' ? 'bg-primary-500/20' : 'bg-dark-700'
                    }`}>
                      <span className={`text-lg font-semibold ${
                        student.status === 'active' ? 'text-primary-400' : 'text-dark-400'
                      }`}>
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{student.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`status-badge ${
                          student.status === 'active' ? 'status-active' : 'status-inactive'
                        }`}>
                          {student.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                        {student.hasGraduation && student.graduationLevel && student.graduationLevel !== 'none' && (
                          <span className="status-badge bg-yellow-500/20 text-yellow-400">
                            <Award className="w-3 h-3 inline mr-1" />
                            {getGraduationLabel(student.graduationLevel)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(student)}
                      className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(student.id)}
                      className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-dark-400">
                    <Phone className="w-4 h-4" />
                    <span>{student.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-400">
                    <MapPin className="w-4 h-4" />
                    <span>{student.location || 'Não informado'}</span>
                  </div>
                  {Object.keys(groupedSchedules).length > 0 && (
                    <div className="flex items-start gap-2 text-dark-400">
                      <Clock className="w-4 h-4 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        {Object.entries(groupedSchedules).map(([day, times]) => (
                          <div key={day} className="flex flex-wrap gap-1">
                            <span className="text-dark-500">{getDayLabel(day)}:</span>
                            {times.map((t, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-dark-800 text-xs">
                                {t.time}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-primary-400 font-medium">
                    <Euro className="w-4 h-4" />
                    <span>{student.monthlyValue.toLocaleString('pt-BR')} €/mês</span>
                  </div>
                </div>

                {student.notes && (
                  <p className="mt-4 text-xs text-dark-500 border-t border-dark-700 pt-3">
                    {student.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? 'Editar Aluno' : 'Novo Aluno'}
        size="xl"
      >
        <StudentForm
          student={editingStudent}
          existingStudents={students}
          existingAcademies={academies}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingStudent(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Excluir Aluno"
        message="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
