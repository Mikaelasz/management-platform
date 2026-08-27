import { useState } from 'react';
import { Student, Academy } from '../../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, MapPin, Clock, Calendar, User, Building2, Edit, Ban, CheckCircle } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';

interface ClassDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
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
  } | null;
  student?: Student;
  academy?: Academy;
  onCancelClass: (date: string, type: 'private' | 'group', studentId?: string, academyId?: string) => void;
  onEditStudent?: (student: Student) => void;
  onEditAcademy?: (academy: Academy) => void;
}

export default function ClassDetailModal({
  isOpen,
  onClose,
  classData,
  student,
  academy,
  onCancelClass,
  onEditStudent,
  onEditAcademy
}: ClassDetailModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!isOpen || !classData) return null;

  const dateFormatted = format(parseISO(classData.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const timeFormatted = classData.startTime
    ? `${classData.startTime}${classData.endTime ? ` - ${classData.endTime}` : ''}`
    : 'Horário não definido';

  const handleCancelClass = () => {
    onCancelClass(classData.date, classData.type, classData.studentId, classData.academyId);
    setShowCancelConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-dark-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {classData.type === 'private' ? (
                <User className="w-6 h-6 text-white" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-white">{classData.title}</h2>
                <p className="text-sm text-primary-200">
                  {classData.type === 'private' ? 'Aula Particular' : 'Aula em Academia'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3 p-4 bg-dark-800 rounded-lg">
            <Calendar className="w-5 h-5 text-primary-400 mt-0.5" />
            <div>
              <p className="text-sm text-dark-400">Data</p>
              <p className="text-white font-medium capitalize">{dateFormatted}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-dark-800 rounded-lg">
            <Clock className="w-5 h-5 text-primary-400 mt-0.5" />
            <div>
              <p className="text-sm text-dark-400">Horário</p>
              <p className="text-white font-medium">{timeFormatted}</p>
            </div>
          </div>

          {/* Location */}
          {classData.location && (
            <div className="flex items-start gap-3 p-4 bg-dark-800 rounded-lg">
              <MapPin className="w-5 h-5 text-primary-400 mt-0.5" />
              <div>
                <p className="text-sm text-dark-400">Local</p>
                <p className="text-white font-medium">{classData.location}</p>
              </div>
            </div>
          )}

          {/* Student/Academy Details */}
          {student && (
            <div className="p-4 bg-dark-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-dark-300">Dados do Aluno</h3>
                {onEditStudent && (
                  <button
                    onClick={() => onEditStudent(student)}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-dark-500">Telefone</p>
                  <p className="text-white">{student.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-dark-500">Valor Mensal</p>
                  <p className="text-white">€{student.monthlyValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-dark-500">Vencimento</p>
                  <p className="text-white">Dia {student.dueDate}</p>
                </div>
                <div>
                  <p className="text-dark-500">Status</p>
                  <p className={`inline-flex items-center gap-1 ${student.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                    {student.status === 'active' ? (
                      <><CheckCircle className="w-3 h-3" /> Ativo</>
                    ) : (
                      <><Ban className="w-3 h-3" /> Inativo</>
                    )}
                  </p>
                </div>
                {student.hasGraduation && (
                  <div className="col-span-2">
                    <p className="text-dark-500">Graduação</p>
                    <p className="text-primary-400">{student.graduationLevel}</p>
                  </div>
                )}
                {student.notes && (
                  <div className="col-span-2">
                    <p className="text-dark-500">Observações</p>
                    <p className="text-white text-xs">{student.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {academy && (
            <div className="p-4 bg-dark-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-dark-300">Dados da Academia</h3>
                {onEditAcademy && (
                  <button
                    onClick={() => onEditAcademy(academy)}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-dark-500">Local</p>
                  <p className="text-white">{academy.location || '-'}</p>
                </div>
                <div>
                  <p className="text-dark-500">Valor Mensal</p>
                  <p className="text-white">€{academy.monthlyValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-dark-500">Status</p>
                  <p className={`inline-flex items-center gap-1 ${academy.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                    {academy.status === 'active' ? (
                      <><CheckCircle className="w-3 h-3" /> Ativa</>
                    ) : (
                      <><Ban className="w-3 h-3" /> Inativa</>
                    )}
                  </p>
                </div>
                {academy.notes && (
                  <div className="col-span-2">
                    <p className="text-dark-500">Observações</p>
                    <p className="text-white text-xs">{academy.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {classData.notes && (
            <div className="p-4 bg-dark-800 rounded-lg">
              <p className="text-sm text-dark-400 mb-1">Observações</p>
              <p className="text-white">{classData.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-dark-700 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Fechar
          </button>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="btn-danger flex items-center gap-2"
          >
            <Ban className="w-4 h-4" />
            Cancelar Aula
          </button>
        </div>
      </div>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelClass}
        title="Cancelar Aula"
        message="Tem certeza que deseja cancelar esta aula? A aula será marcada como cancelada na agenda."
        confirmText="Cancelar Aula"
        variant="danger"
      />
    </div>
  );
}
