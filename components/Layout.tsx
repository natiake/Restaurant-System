
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Role, Staff } from '../types';
import { DataService, socket } from '../services/dataService';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  user: Staff | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOnBreak, setIsOnBreak] = useState(user?.isOnBreak || false);
  const branch = DataService.getCurrentBranch();

  useEffect(() => {
      const handleStatus = (status: boolean) => setIsOnline(status);
      socket.on('connection_change', handleStatus);
      return () => { socket.off('connection_change', handleStatus); };
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'am' : 'en';
    setLanguage(newLang);
  };

  const handleLogout = () => {
      if (user) {
          DataService.clockOut(user.id);
      }
      onLogout();
  };

  const toggleBreak = () => {
      if (user) {
          DataService.toggleBreak(user.id);
          setIsOnBreak(!isOnBreak);
      }
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">{children}</div>;
  }

  // Role-Based Navigation Configuration
  const navItems = [
    // POS: Cashier, Waiter, Admin, Manager
    { path: '/pos', label: t.pos, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER, Role.CASHIER] },
    
    // KDS: Kitchen, Admin, Manager
    { path: '/kds', label: t.kitchen, roles: [Role.ADMIN, Role.KITCHEN, Role.MANAGER] },
    
    // Queue: Front staff
    { path: '/queue', label: t.queue, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER, Role.CASHIER] },
    
    // Manager Panel (Staff, Tables, Inventory, Payroll)
    // In this system, Manager Panel is handled by the /admin route but with restricted view
    { 
        path: '/admin', 
        label: user.role === Role.MANAGER ? t.manager : t.admin, 
        roles: [Role.ADMIN, Role.MANAGER] 
    },
    
    // Separate Table Management (Also available in Admin, but quick link for Floor Managers)
    { path: '/tables', label: t.tables, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER] },
    
    // Reviews
    { path: '/reviews', label: t.reviews, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER] },
    
    // Digital Board
    { path: '/menu-board', label: t.tvMode, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER] },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Connection Banner */}
      {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-gray-500 text-white text-center text-xs font-bold py-1 z-50">
              OFFLINE MODE - Changes saved locally and will sync when connection returns.
          </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-800 text-white z-30 flex justify-between items-center p-4 shadow-md pt-6">
         <h1 className="text-lg font-bold text-yellow-500">AddisManage</h1>
         <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 focus:outline-none"
         >
           {mobileMenuOpen ? '✖' : '☰'}
         </button>
      </div>

      {/* Overlay for Mobile */}
      {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static z-30 bg-slate-800 text-white flex flex-col h-full w-64 transition-transform duration-300 ease-in-out shadow-xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        pt-6 md:pt-0
      `}>
        <div className="p-6 border-b border-slate-700 hidden md:block">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-yellow-500">AddisManage</h1>
            <button 
              onClick={toggleLanguage}
              className="text-xs bg-slate-700 px-2 py-1 rounded hover:bg-slate-600 border border-slate-600"
            >
              {language === 'en' ? '🇺🇸' : '🇪🇹'}
            </button>
          </div>
          <div className="mt-4">
             <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-white">{user.name}</p>
                <span className="text-xs bg-slate-900 px-1 rounded text-slate-400 font-mono">{user.id}</span>
             </div>
             <p className="text-xs text-yellow-400 uppercase tracking-wider font-bold mt-1">{user.role}</p>
             <p className="text-xs text-slate-500 mt-1 truncate">{branch?.name}</p>
             
             <div className="mt-2 flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                 <span className="text-xs text-slate-500">{isOnline ? 'Online' : 'Offline Mode'}</span>
             </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.filter(item => item.roles.includes(user.role)).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-6 py-3 hover:bg-slate-700 transition-colors ${
                location.pathname === item.path ? 'bg-slate-700 border-l-4 border-yellow-500' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <button
            onClick={toggleBreak}
            className={`w-full py-2 px-4 rounded text-white transition-colors font-bold text-sm border ${isOnBreak ? 'bg-yellow-600 border-yellow-600' : 'bg-transparent border-slate-500 hover:bg-slate-700'}`}
          >
             {isOnBreak ? '▶ Resume Work' : '⏸ Take Break'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded text-white transition-colors font-bold shadow-lg"
          >
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative pt-16 md:pt-0 w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
