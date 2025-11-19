import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Role, Staff } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: Staff | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">{children}</div>;
  }

  const navItems = [
    { path: '/pos', label: 'POS', roles: [Role.ADMIN, Role.STAFF] },
    { path: '/kds', label: 'Kitchen', roles: [Role.ADMIN, Role.KITCHEN] },
    { path: '/tables', label: 'Tables', roles: [Role.ADMIN, Role.STAFF] },
    { path: '/queue', label: 'Queue Display', roles: [Role.ADMIN, Role.STAFF] },
    { path: '/inventory', label: 'Stock', roles: [Role.ADMIN] },
    { path: '/reviews', label: 'Reviews', roles: [Role.ADMIN, Role.STAFF] },
    { path: '/admin', label: 'Admin', roles: [Role.ADMIN] },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col print-hide">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-yellow-500">AddisManage</h1>
          <p className="text-sm text-slate-400 mt-1">Logged in: {user.name}</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.filter(item => item.roles.includes(user.role)).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-6 py-3 hover:bg-slate-700 transition-colors ${
                location.pathname === item.path ? 'bg-slate-700 border-l-4 border-yellow-500' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;