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

  // Strict Navigation Filtering
  const navItems = [
    // POS: Cashier, Waiter, Admin, Manager
    { path: '/pos', label: t.pos, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER, Role.CASHIER] },
    
    // KDS: Kitchen, Admin, Manager
    { path: '/kds', label: t.kitchen, roles: [Role.ADMIN, Role.KITCHEN, Role.MANAGER] },
    
    // Queue: Front staff
    { path: '/queue', label: t.queue, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER, Role.CASHIER] },
    
    // Manager/Admin/Storekeeper Panel
    { 
        path: '/admin', 
        label: user.role === Role.STOREKEEPER ? t.stock : (user.role === Role.MANAGER ? t.manager : t.admin), 
        roles: [Role.ADMIN, Role.MANAGER, Role.STOREKEEPER] 
    },
    
    // Separate Table Management (Also available in Admin, but quick link for Floor Managers)
    { path: '/tables', label: t.tables, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER] },
    
    // Reviews
    { path: '/reviews', label: t.reviews, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER] },
    
    // Digital Board
    { path: '/menu-board', label: t.tvMode, roles: [Role.ADMIN, Role.STAFF, Role.MANAGER, Role.KITCHEN] },
  ];

  // Filter items strictly
  const allowedNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Connection Banner */}
      {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-gray-500 text-white text-center text-xs font-bold py-1 z-50">
              OFFLINE MODE - Changes saved locally and will sync when connection returns.
          </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-800 text-white z-30 flex justify-between items-center p-4">
          <span className="font-bold">Addis POS</span>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-2xl">☰</button>
      </div>

      {/* Sidebar */}
      <div className={`fixed md:relative z-40 w-64 bg-slate-900 text-white h-full flex flex-col transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                  <h1 className="text-xl font-bold text-yellow-500">Addis POS</h1>
                  {branch && <p className="text-xs text-gray-400 mt-1">📍 {branch.name}</p>}
              </div>
              <button onClick={toggleLanguage} className="bg-slate-800 px-2 py-1 rounded text-xs font-bold border border-slate-700">
                  {language === 'en' ? 'AM' : 'EN'}
              </button>
          </div>

          <div className="p-4 border-b border-slate-800 bg-slate-800/50">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-lg border border-slate-600">
                     {user.name.charAt(0)}
                 </div>
                 <div>
                     <p className="font-bold text-sm">{user.name}</p>
                     <p className="text-xs text-gray-400 uppercase">{user.role}</p>
                 </div>
             </div>
             <div className="mt-4 flex gap-2">
                 <button 
                    onClick={toggleBreak} 
                    className={`flex-1 py-1 rounded text-xs font-bold ${isOnBreak ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-gray-300'}`}
                 >
                     {isOnBreak ? t.resumeWork : t.takeBreak}
                 </button>
                 <button onClick={handleLogout} className="flex-1 py-1 rounded text-xs font-bold bg-red-600 hover:bg-red-700 text-white">{t.logout}</button>
             </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {allowedNavItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl transition-colors ${location.pathname.startsWith(item.path) ? 'bg-blue-600 text-white font-bold shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  >
                      {item.label}
                  </Link>
              ))}
          </nav>
          
          <div className="p-4 text-center text-xs text-gray-600 border-t border-slate-800">
              v1.2.0 • {isOnline ? '🟢 Online' : '🔴 Offline'}
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Overlay for mobile sidebar */}
          {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>}
          
          <main className="flex-1 overflow-auto pt-16 md:pt-0">
              {children}
          </main>
      </div>
    </div>
  );
};

export default Layout;