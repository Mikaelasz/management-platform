import { ReactNode, useState } from 'react';
import {
  Home,
  Users,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Menu,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'students', label: 'Alunos', icon: Users },
  { id: 'academies', label: 'Academias', icon: Building2 },
  { id: 'calendar', label: 'Agenda', icon: Calendar },
  { id: 'finance', label: 'Financeiro', icon: DollarSign },
  { id: 'reports', label: 'Relatórios', icon: FileText },
];

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { user, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-700 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-dark-950" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v2.02c-2.84.48-5 2.94-5 5.91s2.16 5.43 5 5.91v2.02zm2-15.86v2.02c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.94-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Muay Thai</h1>
                <p className="text-xs text-dark-400">Manager</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500 text-dark-950 font-semibold'
                      : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-dark-700">
            <div className="flex items-center gap-3 mb-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center text-dark-300">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-dark-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-dark-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saindo...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Sair
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-dark-900 border-b border-dark-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-dark-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">Muay Thai Manager</h1>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
