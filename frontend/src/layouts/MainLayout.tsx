import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  List, 
  Repeat, 
  Bell, 
  Menu,
  X,
  RefreshCw
} from 'lucide-react';
import { NotificationDrawer } from '../components/NotificationDrawer';
import { api } from '../services/api';
import type { Notification } from '../types/notification';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const location = useLocation();

  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(false); // Only unreviewed
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      await api.refreshData();
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString());
      await fetchNotifications();
      // Dispatch a custom event so child pages (Dashboard, Records, etc.) know to re-fetch their data
      window.dispatchEvent(new CustomEvent('dataRefreshed'));
    } catch (error) {
      console.error('Failed to refresh data', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    setLastUpdated(new Date().toLocaleTimeString());
    fetchNotifications();

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      handleRefreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Record Explorer', path: '/records', icon: List },
    { name: 'Recurring Issues', path: '/recurring-issues', icon: Repeat },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <span className="text-xl font-bold tracking-tight">Quality Risk DB</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button 
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1" /> {/* Spacer */}
          
          <div className="flex items-center space-x-4">
            
            {/* Auto refresh status & Manual Refresh button */}
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden md:inline-block">
                Last updated: <span className="font-medium text-gray-700">{lastUpdated}</span>
              </span>
            )}

            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none transition-colors border border-slate-200 disabled:opacity-50"
              title="Refresh Data from Source"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>

            {/* Notification Bell */}
            <button 
              className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
              onClick={() => setDrawerOpen(true)}
            >
              <span className="sr-only">View notifications</span>
              <Bell className="w-6 h-6 text-slate-600 hover:text-slate-800" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white text-center leading-4 ring-2 ring-white">
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              )}
            </button>
            
            {/* Profile Dropdown Placeholder */}
            <div className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-gray-100">
               <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                 Q
               </div>
            </div>
            
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        notifications={notifications}
        onRefresh={fetchNotifications}
      />
    </div>
  );
};
