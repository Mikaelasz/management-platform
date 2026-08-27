import { useState, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Euro,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Payment, PaymentStatus } from '../../types';
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth, isBefore, isAfter, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import Loading from '../common/Loading';
import PaymentForm from './PaymentForm';

export default function FinancePage() {
  const { payments, students, academies, loading, addPayment, updatePayment, deletePayment, markPaymentPaid } = useApp();
  const [activeTab, setActiveTab] = useState<'students' | 'academies'>('students');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const monthDate = parseISO(`${selectedMonth}-01`);

  const generateMonthlyPayments = useMemo(() => {
    const generatedPayments: Payment[] = [];
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthStr = format(monthDate, 'MMMM yyyy', { locale: ptBR });

    // Generate payments for active students
    students.filter(s => s.status === 'active').forEach(student => {
      const existingPayment = payments.find(p =>
        p.type === 'student' &&
        p.referenceId === student.id &&
        p.month === monthStr &&
        p.year === monthDate.getFullYear()
      );

      if (!existingPayment) {
        const dueDateStr = format(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), student.dueDate),
          'yyyy-MM-dd'
        );

        let status: PaymentStatus = 'pending';
        const now = new Date();
        if (isBefore(parseISO(dueDateStr), now)) {
          status = 'overdue';
        }

        generatedPayments.push({
          id: `gen-student-${student.id}-${selectedMonth}`,
          type: 'student',
          referenceId: student.id,
          referenceName: student.name,
          amount: student.monthlyValue,
          dueDate: dueDateStr,
          month: monthStr,
          year: monthDate.getFullYear(),
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // Generate payments for active academies
    academies.filter(a => a.status === 'active').forEach(academy => {
      const existingPayment = payments.find(p =>
        p.type === 'academy' &&
        p.referenceId === academy.id &&
        p.month === monthStr &&
        p.year === monthDate.getFullYear()
      );

      if (!existingPayment) {
        const dueDateStr = format(
          new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
          'yyyy-MM-dd'
        );

        let status: PaymentStatus = 'pending';
        const now = new Date();
        if (isBefore(parseISO(dueDateStr), now)) {
          status = 'overdue';
        }

        generatedPayments.push({
          id: `gen-academy-${academy.id}-${selectedMonth}`,
          type: 'academy',
          referenceId: academy.id,
          referenceName: academy.name,
          amount: academy.monthlyValue,
          dueDate: dueDateStr,
          month: monthStr,
          year: monthDate.getFullYear(),
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return generatedPayments;
  }, [students, academies, payments, selectedMonth, monthDate]);

  const allPayments = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthStr = format(monthDate, 'MMMM yyyy', { locale: ptBR });

    // Combine existing payments with generated ones
    const existingPaymentsForMonth = payments.filter(p =>
      p.month === monthStr &&
      p.year === monthDate.getFullYear()
    );

    const combined = [...existingPaymentsForMonth];

    generateMonthlyPayments.forEach(genPayment => {
      if (!genPayment.id.startsWith('gen-')) return;
      const exists = existingPaymentsForMonth.some(p =>
        p.type === genPayment.type && p.referenceId === genPayment.referenceId
      );
      if (!exists) {
        combined.push(genPayment);
      }
    });

    return combined;
  }, [payments, generateMonthlyPayments, monthDate]);

  const filteredPayments = useMemo(() => {
    return allPayments.filter(payment => {
      const matchesType = activeTab === 'students'
        ? payment.type === 'student'
        : payment.type === 'academy';
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      return matchesType && matchesStatus;
    });
  }, [allPayments, activeTab, statusFilter]);

  const summary = useMemo(() => {
    const typePayments = allPayments.filter(p =>
      activeTab === 'students' ? p.type === 'student' : p.type === 'academy'
    );

    return {
      total: typePayments.reduce((sum, p) => sum + p.amount, 0),
      paid: typePayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pending: typePayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      overdue: typePayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
      paidCount: typePayments.filter(p => p.status === 'paid').length,
      totalCount: typePayments.length,
    };
  }, [allPayments, activeTab]);

  const handlePreviousMonth = () => {
    setSelectedMonth(format(subMonths(monthDate, 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    setSelectedMonth(format(addMonths(monthDate, 1), 'yyyy-MM'));
  };

  const handleMarkPaid = (payment: Payment) => {
    if (payment.id.startsWith('gen-')) {
      // Create a real payment
      addPayment({
        type: payment.type,
        referenceId: payment.referenceId,
        referenceName: payment.referenceName,
        amount: payment.amount,
        dueDate: payment.dueDate,
        month: payment.month,
        year: payment.year,
        status: 'paid',
        paidDate: new Date().toISOString(),
      });
    } else {
      markPaymentPaid(payment.id);
    }
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setShowAddModal(true);
  };

  const handleEditPayment = (payment: Payment) => {
    if (!payment.id.startsWith('gen-')) {
      setEditingPayment(payment);
      setShowAddModal(true);
    }
  };

  const handleSubmitPayment = (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPayment) {
      updatePayment(editingPayment.id, data);
    } else {
      addPayment(data);
    }
    setShowAddModal(false);
    setEditingPayment(null);
  };

  const handleDelete = (id: string) => {
    if (!id.startsWith('gen-')) {
      deletePayment(id);
    }
    setDeleteConfirm(null);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Controle Financeiro</h1>
          <p className="text-dark-400 mt-1">Gerencie pagamentos e receitas</p>
        </div>
        <button onClick={handleAddPayment} className="btn-primary">
          <DollarSign className="w-5 h-5" />
          Registrar Pagamento
        </button>
      </div>

      {/* Month Navigation */}
      <div className="card">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
          >
            <TrendingDown className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white capitalize">
              {format(monthDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Euro className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-dark-400">Total Previsto</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.total.toLocaleString('pt-BR')} €</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-dark-400">Recebido</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{summary.paid.toLocaleString('pt-BR')} €</p>
          <p className="text-xs text-dark-500">{summary.paidCount}/{summary.totalCount} pagamentos</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-dark-400">Pendente</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{summary.pending.toLocaleString('pt-BR')} €</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-dark-400">Atrasado</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{summary.overdue.toLocaleString('pt-BR')} €</p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'students'
                ? 'bg-primary-500 text-dark-950'
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Alunos
          </button>
          <button
            onClick={() => setActiveTab('academies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'academies'
                ? 'bg-primary-500 text-dark-950'
                : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            Academias
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-dark-700 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'paid'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            Pagos
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'pending'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'overdue'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            Atrasados
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-dark-400">Nenhum pagamento encontrado</p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="card flex items-center justify-between hover:border-dark-600 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  payment.status === 'paid'
                    ? 'bg-green-500/20'
                    : payment.status === 'pending'
                    ? 'bg-yellow-500/20'
                    : 'bg-red-500/20'
                }`}>
                  <Euro className={`w-6 h-6 ${
                    payment.status === 'paid'
                      ? 'text-green-400'
                      : payment.status === 'pending'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{payment.referenceName}</h3>
                  <p className="text-sm text-dark-400">
                    Vencimento: {format(parseISO(payment.dueDate), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {payment.amount.toLocaleString('pt-BR')} €
                  </p>
                  <span className={`status-badge ${
                    payment.status === 'paid' ? 'status-paid' :
                    payment.status === 'pending' ? 'status-pending' : 'status-overdue'
                  }`}>
                    {payment.status === 'paid' ? 'Pago' :
                     payment.status === 'pending' ? 'Pendente' : 'Atrasado'}
                  </span>
                </div>

                <div className="flex gap-2">
                  {payment.status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(payment)}
                      className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-all"
                      title="Marcar como pago"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  {!payment.id.startsWith('gen-') && (
                    <>
                      <button
                        onClick={() => handleEditPayment(payment)}
                        className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-all"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(payment.id)}
                        className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingPayment(null);
        }}
        title={editingPayment ? 'Editar Pagamento' : 'Registrar Pagamento'}
        size="md"
      >
        <PaymentForm
          payment={editingPayment}
          students={students}
          academies={academies}
          selectedMonth={selectedMonth}
          onSubmit={handleSubmitPayment}
          onCancel={() => {
            setShowAddModal(false);
            setEditingPayment(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Excluir Pagamento"
        message="Tem certeza que deseja excluir este registro de pagamento? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
