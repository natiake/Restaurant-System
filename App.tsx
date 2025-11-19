import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataService } from './services/dataService';
import { Staff } from './types';
import Login from './pages/Login';
import POS from './pages/POS';
import Layout from './components/Layout';
import KDS from './pages/KDS';
import Queue from './pages/Queue';
import Admin from './pages/Admin';
import Reviews from './pages/Reviews';

// Simple Tables Page Component (Inline for simplicity of file count)
import { Table } from './types';
import { socket } from './services/dataService';

const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  useEffect(() => {
    setTables(DataService.getTables());
    const unsub = socket.on('tables_update', (t: Table[]) => setTables(t));
    return () => unsub();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Table Management</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map(t => (
          <div key={t.id} className={`h-40 rounded-xl shadow-sm flex flex-col items-center justify-center border-2 transition-all ${
            t.isOccupied 
              ? 'bg-red-50 border-red-400 text-red-800' 
              : 'bg-green-50 border-green-400 text-green-800'
          }`}>
            <span className="text-2xl font-bold">{t.name}</span>
            <span className="text-sm font-semibold mt-2 uppercase px-3 py-1 rounded-full bg-white bg-opacity-50">
              {t.isOccupied ? 'Occupied' : 'Free'}
            </span>
            {t.isOccupied && (
              <button 
                onClick={() => DataService.freeTable(t.id)}
                className="mt-4 text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Force Clear
              </button>
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
    // Check session storage for persisted login in a real app, 
    // here we just stop loading
    setLoading(false);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading System...</div>;

  return (
    <HashRouter>
      <Layout user={user} onLogout={() => setUser(null)}>
        <Routes>
          <Route path="/login" element={!user ? <div className="flex justify-center pt-20"><Login onLogin={setUser} /></div> : <Navigate to="/pos" />} />
          
          <Route path="/pos" element={user ? <POS staffId={user.id} /> : <Navigate to="/login" />} />
          <Route path="/kds" element={user ? <KDS /> : <Navigate to="/login" />} />
          <Route path="/queue" element={user ? <Queue user={user} /> : <Navigate to="/login" />} />
          <Route path="/tables" element={user ? <TablesPage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <Admin /> : <Navigate to="/login" />} />
          <Route path="/inventory" element={user ? <Admin /> : <Navigate to="/login" />} />
          <Route path="/reviews" element={user ? <Reviews /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to={user ? "/pos" : "/login"} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;