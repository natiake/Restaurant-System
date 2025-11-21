
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataService, socket } from './services/dataService';
import { Staff, Table, TableStatus, Role } from './types';
import Login from './pages/Login';
import POS from './pages/POS';
import Layout from './components/Layout';
import KDS from './pages/KDS';
import Queue from './pages/Queue';
import Admin from './pages/Admin';
import Reviews from './pages/Reviews';
import MenuBoard from './pages/MenuBoard';
import StaffManagement from './pages/StaffManagement';

// --- Role Guard Component ---
interface ProtectedRouteProps {
  user: Staff | null;
  allowedRoles: Role[];
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, allowedRoles, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to their specific allowed landing page
    let redirectPath = "/login";
    if (user.role === Role.KITCHEN) redirectPath = "/kds";
    else if (user.role === Role.STAFF || user.role === Role.CASHIER) redirectPath = "/pos";
    else if (user.role === Role.STOREKEEPER) redirectPath = "/admin";
    else if (user.role === Role.ADMIN || user.role === Role.MANAGER) redirectPath = "/admin";
    
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    setTables(DataService.getTables());
    setStaff(DataService.getStaffList().filter(s => s.role !== Role.KITCHEN));
    
    const unsub = socket.on('tables_update', (t: Table[]) => setTables(t));
    return () => unsub();
  }, []);

  const updateStatus = (id: string, status: TableStatus) => {
    DataService.updateTableStatus(id, status);
  };

  const handleAssign = (tableId: string, staffId: string) => {
      DataService.assignTable(tableId, staffId === "" ? undefined : staffId);
  };

  const getStatusColor = (status: TableStatus) => {
      switch (status) {
          case TableStatus.AVAILABLE: return 'bg-green-50 border-green-400 text-green-800';
          case TableStatus.OCCUPIED: return 'bg-red-50 border-red-400 text-red-800';
          case TableStatus.RESERVED: return 'bg-blue-50 border-blue-400 text-blue-800';
          case TableStatus.CLEANING: return 'bg-yellow-50 border-yellow-400 text-yellow-800';
          default: return 'bg-gray-100';
      }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Table Management</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map(t => (
          <div key={t.id} className={`rounded-xl shadow-sm flex flex-col items-center justify-between border-2 transition-all p-4 ${getStatusColor(t.status)}`}>
            <div className="text-center w-full">
                <span className="text-3xl font-bold block">{t.name}</span>
                <span className="text-xs font-bold uppercase tracking-wider mb-4 block">{t.status}</span>
                
                {/* Waiter Assignment */}
                <div className="mb-4 w-full">
                    <label className="text-xs block text-gray-500 font-bold mb-1">Assigned Waiter</label>
                    <select 
                        className="w-full text-xs p-1 rounded border border-gray-300 bg-white"
                        value={t.assignedStaffId || ""}
                        onChange={(e) => handleAssign(t.id, e.target.value)}
                    >
                        <option value="">Unassigned</option>
                        {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 w-full">
                {t.status === TableStatus.AVAILABLE && (
                    <button onClick={() => updateStatus(t.id, TableStatus.RESERVED)} className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded font-bold">Reserve</button>
                )}
                {t.status === TableStatus.OCCUPIED && (
                     <>
                        <button onClick={() => updateStatus(t.id, TableStatus.CLEANING)} className="flex-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-2 rounded font-bold">Clean</button>
                        <button onClick={() => updateStatus(t.id, TableStatus.AVAILABLE)} className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-2 rounded font-bold">Free</button>
                     </>
                )}
                {t.status === TableStatus.RESERVED && (
                     <button onClick={() => updateStatus(t.id, TableStatus.AVAILABLE)} className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-2 rounded font-bold">Cancel</button>
                )}
                {t.status === TableStatus.CLEANING && (
                     <button onClick={() => updateStatus(t.id, TableStatus.AVAILABLE)} className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-2 rounded font-bold">Done</button>
                )}
            </div>
            {t.occupiedSince && t.status === TableStatus.OCCUPIED && (
                <span className="text-xs mt-2 opacity-70 block">
                    {Math.floor((Date.now() - t.occupiedSince) / 60000)} min ago
                </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.initialize();
    setLoading(false);
  }, []);

  // Determine where to send user upon successful login
  const getRedirectPath = (role: Role) => {
      if (role === Role.KITCHEN) return "/kds";
      if (role === Role.ADMIN || role === Role.MANAGER) return "/admin";
      if (role === Role.STOREKEEPER) return "/admin";
      if (role === Role.STAFF || role === Role.CASHIER) return "/pos";
      return "/pos";
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading System...</div>;

  return (
    <HashRouter>
      <Layout user={user} onLogout={() => setUser(null)}>
        <Routes>
          <Route path="/login" element={!user ? <div className="flex justify-center pt-20"><Login onLogin={setUser} /></div> : <Navigate to={getRedirectPath(user.role)} />} />
          
          {/* POS: Staff, Cashier, Manager, Admin */}
          <Route path="/pos" element={
            <ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.STAFF, Role.CASHIER]}>
              <POS staffId={user?.id || ''} staffName={user?.name || ''} role={user?.role || Role.STAFF} />
            </ProtectedRoute>
          } />
          
          {/* KDS: Kitchen, Manager, Admin */}
          <Route path="/kds" element={
            <ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.KITCHEN]}>
              <KDS />
            </ProtectedRoute>
          } />
          
          {/* Queue: Staff, Cashier, Manager, Admin */}
          <Route path="/queue" element={
            <ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.STAFF, Role.CASHIER]}>
              <Queue user={user!} />
            </ProtectedRoute>
          } />
          
          {/* Tables: Staff, Cashier, Manager, Admin */}
          <Route path="/tables" element={
            <ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.STAFF, Role.CASHIER]}>
              <TablesPage />
            </ProtectedRoute>
          } />
          
          {/* Admin: Admin, Manager, Storekeeper (with internal restrictions) */}
          <Route path="/admin" element={
            <ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.STOREKEEPER]}>
              <Admin user={user!} />
            </ProtectedRoute>
          } />
          
          {/* Reviews: Everyone except Kitchen/Storekeeper basically */}
          <Route path="/reviews" element={
             <ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.STAFF, Role.CASHIER]}>
                <Reviews />
             </ProtectedRoute>
          } />
          
          {/* Menu Board: Everyone */}
          <Route path="/menu-board" element={
            <ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.STAFF, Role.CASHIER, Role.KITCHEN]}>
              <MenuBoard />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to={user ? getRedirectPath(user.role) : "/login"} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
