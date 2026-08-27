import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import LoginPage from './components/layout/LoginPage';
import DashboardPage from './components/dashboard/DashboardPage';
import StudentsPage from './components/students/StudentsPage';
import AcademiesPage from './components/academies/AcademiesPage';
import CalendarPage from './components/calendar/CalendarPage';
import FinancePage from './components/finance/FinancePage';
import ReportsPage from './components/reports/ReportsPage';
import Loading from './components/common/Loading';

function AppContent() {
  const { isAuthenticated, authStatus } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Show loading while checking initial session
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Show login page if not authenticated (including 'loading' and 'unauthorized' states)
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'students':
        return <StudentsPage />;
      case 'academies':
        return <AcademiesPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'finance':
        return <FinancePage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
