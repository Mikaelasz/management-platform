import {
  Users,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Euro,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Loading from '../common/Loading';

export default function DashboardPage() {
  const { metrics, students, academies, payments, loading } = useApp();

  if (loading) {
    return <Loading />;
  }

  // Generate monthly revenue data for the past 6 months
  const monthlyData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = format(month, 'MMM', { locale: ptBR });
    const monthPayments = payments.filter((p) => {
      const paidDate = p.paidDate ? parseISO(p.paidDate) : null;
      return paidDate && format(paidDate, 'yyyy-MM') === format(month, 'yyyy-MM');
    });
    const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    monthlyData.push({
      month: monthStr,
      receita: total,
    });
  }

  const cards = [
    {
      title: 'Alunos Ativos',
      value: metrics.totalActiveStudents,
      icon: Users,
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10',
    },
    {
      title: 'Academias',
      value: metrics.totalAcademies,
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Aulas na Semana',
      value: metrics.weeklyClasses,
      icon: Calendar,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Aulas Hoje',
      value: metrics.todayClasses,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400">{card.title}</p>
                  <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3 mb-3">
            <Euro className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-dark-400">Receita Prevista</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {metrics.monthlyProjectedRevenue.toLocaleString('pt-BR')} €
          </p>
          <p className="text-xs text-dark-500 mt-1">Valor mensal esperado</p>
        </div>

        <div className="card border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-dark-400">Receita Recebida</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {metrics.monthlyReceivedRevenue.toLocaleString('pt-BR')} €
          </p>
          <p className="text-xs text-dark-500 mt-1">Pagamentos confirmados</p>
        </div>

        <div className="card border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-dark-400">Receita Pendente</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">
            {metrics.monthlyPendingRevenue.toLocaleString('pt-BR')} €
          </p>
          <p className="text-xs text-dark-500 mt-1">Aguardando pagamento</p>
        </div>
      </div>

      {/* Charts and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Receita Mensal</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C853" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  formatter={(value: number) => [`${value.toLocaleString('pt-BR')} €`, 'Receita']}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="#00C853"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Proximas Aulas</h2>
            <Calendar className="w-5 h-5 text-dark-400" />
          </div>
          <div className="space-y-3">
            {metrics.upcomingEvents.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-4">Nenhuma aula agendada</p>
            ) : (
              metrics.upcomingEvents.map((event) => {
                const student = event.studentId
                  ? students.find((s) => s.id === event.studentId)
                  : null;
                const academy = event.academyId
                  ? academies.find((a) => a.id === event.academyId)
                  : null;
                const eventDate = parseISO(event.date);
                const isToday =
                  format(eventDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      event.type === 'private'
                        ? 'bg-primary-500/10 border-l-2 border-primary-500'
                        : event.type === 'group'
                        ? 'bg-dark-800 border-l-2 border-dark-600'
                        : 'bg-red-500/10 border-l-2 border-red-500'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {event.title || student?.name || academy?.name || 'Sem título'}
                      </p>
                      <p className="text-sm text-dark-400 truncate">
                        {event.location} - {event.startTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isToday ? 'text-primary-500' : 'text-dark-300'}`}>
                        {isToday ? 'Hoje' : format(eventDate, 'dd/MM', { locale: ptBR })}
                      </p>
                      <p
                        className={`text-xs px-2 py-0.5 rounded ${
                          event.type === 'private'
                            ? 'bg-primary-500/20 text-primary-400'
                            : event.type === 'group'
                            ? 'bg-dark-700 text-dark-300'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {event.type === 'private'
                          ? 'Particular'
                          : event.type === 'group'
                          ? 'Grupo'
                          : 'Cancelado'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pending Payments Alert */}
      {metrics.pendingPayments.length > 0 && (
        <div className="card bg-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-white">Pagamentos Pendentes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.pendingPayments.slice(0, 6).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-dark-900/80 rounded-lg"
              >
                <div>
                  <p className="font-medium text-white">{payment.referenceName}</p>
                  <p className="text-sm text-dark-400">
                    Vencimento: {format(parseISO(payment.dueDate), 'dd/MM/yyyy')}
                  </p>
                </div>
                <p className="text-lg font-bold text-yellow-400">
                  {payment.amount.toLocaleString('pt-BR')} €
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
