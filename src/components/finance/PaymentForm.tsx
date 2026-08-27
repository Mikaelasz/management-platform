import { useState, useEffect } from 'react';
import { Payment, Student, Academy, PaymentStatus } from '../../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentFormProps {
  payment: Payment | null;
  students: Student[];
  academies: Academy[];
  selectedMonth: string;
  onSubmit: (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function PaymentForm({ payment, students, academies, selectedMonth, onSubmit, onCancel }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    type: 'student' as 'student' | 'academy',
    referenceId: '',
    referenceName: '',
    amount: 0,
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    paidDate: '',
    month: format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR }),
    year: new Date().getFullYear(),
    status: 'pending' as PaymentStatus,
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        type: payment.type,
        referenceId: payment.referenceId,
        referenceName: payment.referenceName,
        amount: payment.amount,
        dueDate: payment.dueDate,
        paidDate: payment.paidDate || '',
        month: payment.month,
        year: payment.year,
        status: payment.status,
      });
    }
  }, [payment]);

  const handleReferenceChange = (referenceId: string) => {
    if (formData.type === 'student') {
      const student = students.find(s => s.id === referenceId);
      if (student) {
        const dueDate = format(
          new Date(parseISO(`${selectedMonth}-01`).getFullYear(), parseISO(`${selectedMonth}-01`).getMonth(), student.dueDate),
          'yyyy-MM-dd'
        );
        setFormData(prev => ({
          ...prev,
          referenceId,
          referenceName: student.name,
          amount: student.monthlyValue,
          dueDate,
        }));
      }
    } else {
      const academy = academies.find(a => a.id === referenceId);
      if (academy) {
        const dueDate = format(
          new Date(parseISO(`${selectedMonth}-01`).getFullYear(), parseISO(`${selectedMonth}-01`).getMonth(), 15),
          'yyyy-MM-dd'
        );
        setFormData(prev => ({
          ...prev,
          referenceId,
          referenceName: academy.name,
          amount: academy.monthlyValue,
          dueDate,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      paidDate: formData.paidDate || undefined,
      month: format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR }),
      year: parseISO(`${selectedMonth}-01`).getFullYear(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Type Selection */}
      <div>
        <label className="label">Tipo</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'student' }))}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              formData.type === 'student'
                ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                : 'border-dark-600 text-dark-400 hover:border-dark-500'
            }`}
          >
            Aluno
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'academy' }))}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              formData.type === 'academy'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-dark-600 text-dark-400 hover:border-dark-500'
            }`}
          >
            Academia
          </button>
        </div>
      </div>

      {/* Reference Selection */}
      <div>
        <label className="label">{formData.type === 'student' ? 'Aluno' : 'Academia'}</label>
        <select
          value={formData.referenceId}
          onChange={(e) => handleReferenceChange(e.target.value)}
          className="input"
          required
        >
          <option value="">Selecione...</option>
          {formData.type === 'student'
            ? students.filter(s => s.status === 'active').map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))
            : academies.filter(a => a.status === 'active').map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))
          }
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="label">Valor (€)</label>
        <input
          type="number"
          value={formData.amount || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
          className="input"
          min="0"
          step="0.01"
          required
        />
      </div>

      {/* Due Date */}
      <div>
        <label className="label">Data de Vencimento</label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
          className="input"
          required
        />
      </div>

      {/* Status */}
      <div>
        <label className="label">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as PaymentStatus }))}
          className="input"
        >
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
        </select>
      </div>

      {/* Paid Date */}
      {formData.status === 'paid' && (
        <div>
          <label className="label">Data do Pagamento</label>
          <input
            type="date"
            value={formData.paidDate}
            onChange={(e) => setFormData(prev => ({ ...prev, paidDate: e.target.value }))}
            className="input"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          {payment ? 'Salvar Alterações' : 'Registrar Pagamento'}
        </button>
      </div>
    </form>
  );
}
