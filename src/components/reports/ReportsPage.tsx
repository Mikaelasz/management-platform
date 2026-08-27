import { useState, useMemo } from 'react';
import { FileText, Download, Calendar, DollarSign, Users, Building2, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isSameMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { exportToExcel, exportPaymentsToPDF } from '../../services/exportService';
import Loading from '../common/Loading';

type ReportPeriod = 'month' | 'year';

export default function ReportsPage() {
  const { students, academies, payments, events, loading } = useApp();
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const reportData = useMemo(() => {
    const monthDate = parseISO(`${selectedMonth}-01`);
    const yearDate = new Date(parseInt(selectedYear), 0, 1);

    const getMonthData = () => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthStr = format(monthDate, 'MMMM yyyy', { locale: ptBR });

      const monthPayments = payments.filter(p => {
        const paidDate = p.paidDate ? parseISO(p.paidDate) : null;
        const dueDate = parseISO(p.dueDate);
        return paidDate ? isSameMonth(paidDate, monthDate) : isSameMonth(dueDate, monthDate);
      });

      const activeStudents = students.filter(s => s.status === 'active');
      const activeAcademies = academies.filter(a => a.status === 'active');

      const studentsRevenue = monthPayments
        .filter(p => p.type === 'student' && p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const academiesRevenue = monthPayments
        .filter(p => p.type === 'academy' && p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const monthEvents = events.filter(e => {
        const eventDate = parseISO(e.date);
        return isSameMonth(eventDate, monthDate);
      });

      return {
        totalRevenue: studentsRevenue + academiesRevenue,
        studentsRevenue,
        academiesRevenue,
        activeStudents: activeStudents.length,
        activeAcademies: activeAcademies.length,
        totalPayments: monthPayments.length,
        paidPayments: monthPayments.filter(p => p.status === 'paid').length,
        pendingPayments: monthPayments.filter(p => p.status === 'pending').length,
        overduePayments: monthPayments.filter(p => p.status === 'overdue').length,
        eventsCount: monthEvents.length,
        periodLabel: monthStr,
      };
    };

    const getYearData = () => {
      const yearStart = new Date(parseInt(selectedYear), 0, 1);
      const yearEnd = new Date(parseInt(selectedYear), 11, 31);

      const yearPayments = payments.filter(p => {
        const paidDate = p.paidDate ? parseISO(p.paidDate) : null;
        const dueDate = parseISO(p.dueDate);
        const dateToCheck = paidDate || dueDate;
        return dateToCheck.getFullYear() === parseInt(selectedYear);
      });

      const activeStudents = students.filter(s => s.status === 'active');
      const activeAcademies = academies.filter(a => a.status === 'active');

      const totalRevenue = yearPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const yearEvents = events.filter(e => {
        const eventDate = parseISO(e.date);
        return eventDate.getFullYear() === parseInt(selectedYear);
      });

      return {
        totalRevenue,
        studentsRevenue: yearPayments.filter(p => p.type === 'student' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
        academiesRevenue: yearPayments.filter(p => p.type === 'academy' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
        activeStudents: activeStudents.length,
        activeAcademies: activeAcademies.length,
        totalPayments: yearPayments.length,
        paidPayments: yearPayments.filter(p => p.status === 'paid').length,
        pendingPayments: yearPayments.filter(p => p.status === 'pending').length,
        overduePayments: yearPayments.filter(p => p.status === 'overdue').length,
        eventsCount: yearEvents.length,
        periodLabel: selectedYear,
      };
    };

    return period === 'month' ? getMonthData() : getYearData();
  }, [period, selectedMonth, selectedYear, students, academies, payments, events]);

  const monthlyChartData = useMemo(() => {
    const data = [];
    const currentMonth = new Date();

    for (let i = 11; i >= 0; i--) {
      const month = subMonths(currentMonth, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthPayments = payments.filter(p => {
        const paidDate = p.paidDate ? parseISO(p.paidDate) : null;
        return paidDate && isSameMonth(paidDate, month);
      });

      const studentsRevenue = monthPayments
        .filter(p => p.type === 'student')
        .reduce((sum, p) => sum + p.amount, 0);

      const academiesRevenue = monthPayments
        .filter(p => p.type === 'academy')
        .reduce((sum, p) => sum + p.amount, 0);

      data.push({
        month: format(month, 'MMM', { locale: ptBR }),
        Alunos: studentsRevenue,
        Academias: academiesRevenue,
        Total: studentsRevenue + academiesRevenue,
      });
    }

    return data;
  }, [payments]);

  const pieChartData = useMemo(() => [
    { name: 'Alunos', value: reportData.studentsRevenue, color: '#00C853' },
    { name: 'Academias', value: reportData.academiesRevenue, color: '#3B82F6' },
  ], [reportData]);

  const handleExportExcel = () => {
    const data = [
      { Indicador: 'Período', Valor: reportData.periodLabel },
      { Indicador: 'Receita Total', Valor: `${reportData.totalRevenue.toLocaleString('pt-BR')} €` },
      { Indicador: 'Receita Alunos', Valor: `${reportData.studentsRevenue.toLocaleString('pt-BR')} €` },
      { Indicador: 'Receita Academias', Valor: `${reportData.academiesRevenue.toLocaleString('pt-BR')} €` },
      { Indicador: 'Alunos Ativos', Valor: reportData.activeStudents },
      { Indicador: 'Academias Ativas', Valor: reportData.activeAcademies },
      { Indicador: 'Total Pagamentos', Valor: reportData.totalPayments },
      { Indicador: 'Pagamentos Realizados', Valor: reportData.paidPayments },
      { Indicador: 'Pagamentos Pendentes', Valor: reportData.pendingPayments },
      { Indicador: 'Pagamentos Atrasados', Valor: reportData.overduePayments },
      { Indicador: 'Quantidade de Aulas', Valor: reportData.eventsCount },
    ];

    exportToExcel(`relatorio_${period}_${reportData.periodLabel.replace(' ', '_')}.xlsx`, data);
  };

  const handleExportPDF = () => {
    exportPaymentsToPDF({
      period: reportData.periodLabel,
      totalRevenue: reportData.totalRevenue,
      studentsRevenue: reportData.studentsRevenue,
      academiesRevenue: reportData.academiesRevenue,
      activeStudents: reportData.activeStudents,
      activeAcademies: reportData.activeAcademies,
      payments: payments,
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios</h1>
          <p className="text-dark-400 mt-1">Análise de desempenho e receitas</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportExcel} className="btn-secondary">
            <Download className="w-5 h-5" />
            Excel
          </button>
          <button onClick={handleExportExcel} className="btn-primary">
            <FileText className="w-5 h-5" />
            PDF
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === 'month'
                  ? 'bg-primary-500 text-dark-950'
                  : 'bg-dark-800 text-dark-300 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === 'year'
                  ? 'bg-primary-500 text-dark-950'
                  : 'bg-dark-800 text-dark-300 hover:text-white'
              }`}
            >
              Anual
            </button>
          </div>

          {period === 'month' ? (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input max-w-[200px]"
            />
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input max-w-[150px]"
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-dark-400">Receita Total</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {reportData.totalRevenue.toLocaleString('pt-BR')} €
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-dark-400">Alunos Ativos</span>
          </div>
          <p className="text-2xl font-bold text-white">{reportData.activeStudents}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-dark-400">Academias</span>
          </div>
          <p className="text-2xl font-bold text-white">{reportData.activeAcademies}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm text-dark-400">Aulas Realizadas</span>
          </div>
          <p className="text-2xl font-bold text-white">{reportData.eventsCount}</p>
        </div>
      </div>

      {/* Payment Status Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Status dos Pagamentos</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-400">{reportData.paidPayments}</p>
            <p className="text-sm text-dark-400 mt-1">Pagos</p>
          </div>
          <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
            <p className="text-3xl font-bold text-yellow-400">{reportData.pendingPayments}</p>
            <p className="text-sm text-dark-400 mt-1">Pendentes</p>
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg text-center">
            <p className="text-3xl font-bold text-red-400">{reportData.overduePayments}</p>
            <p className="text-sm text-dark-400 mt-1">Atrasados</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Receitas por Mês</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#313131" />
                <XAxis dataKey="month" stroke="#818181" fontSize={12} />
                <YAxis stroke="#818181" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #313131',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('pt-BR')} €`]}
                />
                <Bar dataKey="Alunos" fill="#00C853" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Academias" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Receitas</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #313131',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('pt-BR')} €`]}
                />
                <Legend
                  wrapperStyle={{ color: '#818181' }}
                  formatter={(value) => <span style={{ color: '#818181' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Receitas por Alunos</h3>
          <p className="text-sm text-dark-400 mb-2">
            {reportData.activeStudents} alunos ativos
          </p>
          <p className="text-3xl font-bold text-primary-400">
            {reportData.studentsRevenue.toLocaleString('pt-BR')} €
          </p>
          <p className="text-xs text-dark-500 mt-2">
            Média por aluno: {reportData.activeStudents > 0 ? (reportData.studentsRevenue / reportData.activeStudents).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : 0} €
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Receitas por Academias</h3>
          <p className="text-sm text-dark-400 mb-2">
            {reportData.activeAcademies} academias ativas
          </p>
          <p className="text-3xl font-bold text-blue-400">
            {reportData.academiesRevenue.toLocaleString('pt-BR')} €
          </p>
          <p className="text-xs text-dark-500 mt-2">
            Média por academia: {reportData.activeAcademies > 0 ? (reportData.academiesRevenue / reportData.activeAcademies).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : 0} €
          </p>
        </div>
      </div>
    </div>
  );
}
