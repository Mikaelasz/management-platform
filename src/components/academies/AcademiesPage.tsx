import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Building2, MapPin, Euro, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Academy, AcademyStatus, Student, DAYS_OF_WEEK } from '../../types';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import SearchBar from '../common/SearchBar';
import EmptyState from '../common/EmptyState';
import Loading from '../common/Loading';
import AcademyForm from './AcademyForm';

export default function AcademiesPage() {
  const { students, academies, loading, addAcademy, updateAcademy, deleteAcademy } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AcademyStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredAcademies = useMemo(() => {
    return academies.filter((academy) => {
      const matchesSearch =
        academy.name.toLowerCase().includes(search.toLowerCase()) ||
        academy.location.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || academy.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [academies, search, statusFilter]);

  const handleAdd = () => {
    setEditingAcademy(null);
    setShowModal(true);
  };

  const handleEdit = (academy: Academy) => {
    setEditingAcademy(academy);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteAcademy(id);
    setDeleteConfirm(null);
  };

  const handleSubmit = (data: Omit<Academy, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingAcademy) {
      updateAcademy(editingAcademy.id, data);
    } else {
      addAcademy(data);
    }
    setShowModal(false);
    setEditingAcademy(null);
  };

  const getDayLabel = (day: string): string => {
    const d = DAYS_OF_WEEK.find(d => d.value === day);
    return d ? d.label : day;
  };

  const groupSchedulesByDay = (schedules: Academy['schedule']) => {
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
          <h1 className="text-2xl font-bold text-white">Academias</h1>
          <p className="text-dark-400 mt-1">
            {academies.filter(a => a.status === 'active').length} academias ativas
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
          <Plus className="w-5 h-5" />
          Nova Academia
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar academia..."
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
            Todas
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-primary-500 text-dark-950'
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Ativas
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'inactive'
                ? 'bg-primary-500 text-dark-950'
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Inativas
          </button>
        </div>
      </div>

      {/* Academies List */}
      {filteredAcademies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma academia encontrada"
          description={
            search || statusFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece adicionando sua primeira academia'
          }
          action={!search && statusFilter === 'all' ? { label: 'Adicionar Academia', onClick: handleAdd } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAcademies.map((academy) => {
            const groupedSchedules = groupSchedulesByDay(academy.schedule);

            return (
              <div
                key={academy.id}
                className="card group hover:border-dark-600 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      academy.status === 'active' ? 'bg-blue-500/20' : 'bg-dark-700'
                    }`}>
                      <Building2 className={`w-6 h-6 ${
                        academy.status === 'active' ? 'text-blue-400' : 'text-dark-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{academy.name}</h3>
                      <span className={`status-badge ${
                        academy.status === 'active' ? 'status-active' : 'status-inactive'
                      }`}>
                        {academy.status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(academy)}
                      className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(academy.id)}
                      className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-dark-400">
                    <MapPin className="w-4 h-4" />
                    <span>{academy.location || 'Local não informado'}</span>
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
                  <div className="flex items-center gap-2 text-blue-400 font-medium">
                    <Euro className="w-4 h-4" />
                    <span>{academy.monthlyValue.toLocaleString('pt-BR')} €/mês</span>
                  </div>
                </div>

                {academy.notes && (
                  <p className="mt-4 text-xs text-dark-500 border-t border-dark-700 pt-3">
                    {academy.notes}
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
          setEditingAcademy(null);
        }}
        title={editingAcademy ? 'Editar Academia' : 'Nova Academia'}
        size="xl"
      >
        <AcademyForm
          academy={editingAcademy}
          existingStudents={students}
          existingAcademies={academies}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingAcademy(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Excluir Academia"
        message="Tem certeza que deseja excluir esta academia? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
