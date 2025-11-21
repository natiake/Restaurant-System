
import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { MenuItem, OrderStatus, AuditLog, PaymentMethod, Staff, Role } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import StaffManagement from './StaffManagement';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface AdminProps {
  user: Staff;
}

const Admin: React.FC<AdminProps> = ({ user }) => {
  const [stats, setStats] = useState<{ name: string, sales: number }[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [inventory, setInventory] = useState<MenuItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'logs' | 'data' | 'staff'>('dashboard');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  
  // Payment Analytics
  const [paymentStats, setPaymentStats] = useState<{ name: string, value: number }[]>([]);
  const [itemPaymentStats, setItemPaymentStats] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Menu Edit
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState<Partial<MenuItem>>({});

  const isManager = user.role === Role.MANAGER;

  useEffect(() => {
    refreshData();
  }, [timeRange]);

  const refreshData = () => {
    const orders = DataService.getOrders();
    const items = DataService.getMenu();
    const logsData = DataService.getLogs();
    
    setInventory(items);
    setLogs(logsData);

    // Filter orders by Time Range
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    let filterTime = now - oneDay; // Default today
    if (timeRange === 'week') filterTime = now - (oneDay * 7);
    if (timeRange === 'month') filterTime = now - (oneDay * 30);

    const filteredOrders = orders.filter(o => o.timestamp > filterTime && o.status !== OrderStatus.PENDING);

    // Calculate Sales & Revenue
    const salesMap: Record<string, number> = {};
    const methodMap: Record<string, number> = {};
    const itemPayMap: Record<string, any> = {};
    let totalRev = 0;

    filteredOrders.forEach(o => {
        totalRev += o.total;
        
        // Item Sales & Payment Breakdown
        o.items.forEach(i => {
          salesMap[i.name] = (salesMap[i.name] || 0) + i.quantity;
          
          if (!itemPayMap[i.name]) {
              itemPayMap[i.name] = { name: i.name, total: 0 };
              // Initialize all methods to 0
              Object.values(PaymentMethod).forEach(pm => itemPayMap[i.name][pm] = 0);
          }
          itemPayMap[i.name][o.paymentMethod] = (itemPayMap[i.name][o.paymentMethod] || 0) + i.quantity;
          itemPayMap[i.name].total += i.quantity;
        });

        // Payment Method Stats
        methodMap[o.paymentMethod] = (methodMap[o.paymentMethod] || 0) + o.total;
    });

    setRevenue(totalRev);
    
    const chartData = Object.keys(salesMap).map(key => ({ name: key, sales: salesMap[key] }));
    setStats(chartData.sort((a, b) => b.sales - a.sales).slice(0, 5));

    const methodData = Object.keys(methodMap).map(key => ({ name: key, value: methodMap[key] }));
    setPaymentStats(methodData);

    // Sort item payment stats by total quantity
    setItemPaymentStats(Object.values(itemPayMap).sort((a: any, b: any) => b.total - a.total));
  };

  const handleMenuSubmit = () => {
      if (!menuForm.name || !menuForm.price || !menuForm.category) {
          alert("Name, Price and Category are required");
          return;
      }

      const item: MenuItem = {
          id: menuForm.id || `m${Date.now()}`,
          name: menuForm.name,
          price: Number(menuForm.price),
          category: menuForm.category as any,
          stock: Number(menuForm.stock) || 0,
          ingredients: typeof menuForm.ingredients === 'string' ? (menuForm.ingredients as string).split(',').map(s => s.trim()) : menuForm.ingredients || [],
          description: menuForm.description || '',
          archived: menuForm.archived || false
      };

      if (menuForm.id) {
          DataService.updateMenuItem(item, user.name);
      } else {
          DataService.addMenuItem(item, user.name);
      }
      setIsMenuModalOpen(false);
      setMenuForm({});
      refreshData();
  };

  const toggleArchive = (id: string) => {
      if (confirm("Are you sure you want to change the archive status?")) {
          DataService.archiveMenuItem(id, user.name);
          refreshData();
      }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          const success = DataService.importData(ev.target?.result as string);
          if (success) {
              alert("Data restored successfully!");
              window.location.reload();
          } else {
              alert("Failed to restore data. Invalid JSON.");
          }
      };
      reader.readAsText(file);
  };

  const downloadBackup = () => {
      const data = DataService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `addis_backup_${Date.now()}.json`;
      a.click();
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    setAiInsight('');
    try {
        const staff = DataService.getStaffList();
        const topStaff = staff.sort((a,b) => b.totalTips - a.totalTips)[0];
        const lowStock = inventory.filter(i => i.stock < 10 && !i.archived).map(i => i.name).join(', ');
        
        if (process.env.API_KEY) {
             const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
             const response = await ai.models.generateContent({
                 model: 'gemini-2.5-flash',
                 contents: `
                    Act as a Restaurant General Manager. Analyze this data:
                    - Revenue (${timeRange}): ${revenue} ETB
                    - Top Seller: ${stats[0]?.name}
                    - Low Stock: ${lowStock}
                    - Top Waiter (Tips): ${topStaff?.name} (${topStaff?.totalTips} ETB)
                    Provide 3 bullet points of actionable business advice.
                 `
             });
             setAiInsight(response.text);
        } else {
            await new Promise(r => setTimeout(r, 1500));
            setAiInsight(`
                **Gemini Analysis (Simulated):**
                1. **Payment Trends:** Significant revenue via ${paymentStats[0]?.name}. Ensure your payment gateway is stable.
                2. **Inventory Critical:** Immediate restock needed for: ${lowStock || 'None'}.
                3. **Menu Engineering:** ${stats[0]?.name} is driving revenue. Consider creating a combo meal around it.
            `);
        }

    } catch (e) {
      setAiInsight("Failed to generate analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const tabs = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'staff', label: 'Staff & HR' },
      { id: 'inventory', label: 'Inventory' },
      { id: 'logs', label: 'System Logs' },
  ];

  // Only Admin gets Data & AI
  if (!isManager) {
      tabs.push({ id: 'data', label: 'Data / AI' });
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{isManager ? 'Manager Panel' : 'Admin Dashboard'}</h1>
            <p className="text-sm text-slate-500">Welcome back, {user.name} ({user.id})</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
              {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded uppercase font-bold text-xs transition-colors ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-gray-100'}`}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
            <div className="flex justify-end mb-4">
                <div className="bg-white rounded-lg shadow p-1 flex">
                    {['today', 'week', 'month'].map(r => (
                        <button 
                           key={r}
                           onClick={() => setTimeRange(r as any)}
                           className={`px-4 py-1 rounded text-sm capitalize font-bold ${timeRange === r ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 uppercase text-xs font-bold">Total Revenue</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">{revenue.toLocaleString()} ETB</p>
                </div>
                
                {/* Mini breakdown cards */}
                {Object.values(PaymentMethod).map(method => {
                    const val = paymentStats.find(s => s.name === method)?.value || 0;
                    return (
                        <div key={method} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 opacity-90">
                            <h3 className="text-slate-500 uppercase text-xs font-bold">{method}</h3>
                            <p className="text-xl font-bold text-slate-700 mt-2">{val.toLocaleString()} ETB</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                 {/* Sales Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                    <h3 className="font-bold text-lg mb-6">Top Items Sold</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="sales" fill="#eab308" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Payment Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
                    <h3 className="font-bold text-lg mb-6">Payment Methods</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={paymentStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {paymentStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} ETB`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Payment Breakdown Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 overflow-x-auto">
                <h3 className="font-bold text-lg mb-4">Sales Breakdown by Payment Method</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Item Name</th>
                                {Object.values(PaymentMethod).map(pm => (
                                    <th key={pm} className="px-4 py-3">{pm} (Qty)</th>
                                ))}
                                <th className="px-4 py-3 text-right">Total Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {itemPaymentStats.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-bold text-slate-700">{row.name}</td>
                                    {Object.values(PaymentMethod).map(pm => (
                                        <td key={pm} className="px-4 py-3 text-slate-500">
                                            {row[pm] > 0 ? <span className="bg-slate-100 px-2 py-1 rounded font-mono">{row[pm]}</span> : '-'}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right font-bold">{row.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {!isManager && (
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-xl shadow-sm text-white relative overflow-hidden">
                    <h3 className="uppercase text-xs font-bold opacity-80">AI Manager Insight</h3>
                    <button 
                        onClick={analyzeWithAI}
                        disabled={analyzing}
                        className="mt-4 bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-50"
                    >
                        {analyzing ? 'Analyzing Data...' : 'Ask Gemini'}
                    </button>
                    {aiInsight && (
                        <div className="mt-4 text-sm bg-white/10 p-3 rounded whitespace-pre-line">
                        {aiInsight}
                        </div>
                    )}
                </div>
            )}
        </>
      )}
      
      {activeTab === 'staff' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px]">
             <StaffManagement />
          </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <div className="flex justify-between items-center mb-6 min-w-[600px]">
              <h3 className="font-bold text-lg">Menu & Stock</h3>
              <button 
                 onClick={() => { setMenuForm({}); setIsMenuModalOpen(true); }}
                 className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700"
              >
                  + Add Item
              </button>
          </div>
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map(item => (
                <tr key={item.id} className={item.archived ? 'bg-gray-50 opacity-60' : ''}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                  <td className="px-4 py-3 font-mono">{item.price}</td>
                  <td className={`px-4 py-3 font-bold ${item.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                     {item.stock}
                  </td>
                  <td className="px-4 py-3">
                      {item.archived ? <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Archived</span> : <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => { setMenuForm(item); setIsMenuModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-bold">Edit</button>
                    <button onClick={() => toggleArchive(item.id)} className="text-red-600 hover:text-red-800 font-bold">
                        {item.archived ? 'Restore' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg mb-4">System Logs</h3>
              <div className="overflow-y-auto max-h-[600px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
                    <tr>
                        <th className="px-4 py-2">Time</th>
                        <th className="px-4 py-2">Staff</th>
                        <th className="px-4 py-2">Action</th>
                        <th className="px-4 py-2">Details</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                        <tr key={log.id}>
                        <td className="px-4 py-3 text-gray-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="px-4 py-3 font-bold">{log.staffName}</td>
                        <td className="px-4 py-3 text-blue-600">{log.action}</td>
                        <td className="px-4 py-3 text-gray-600">{log.details}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* Data Management - Admin Only */}
      {!isManager && activeTab === 'data' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg mb-4">Data Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-blue-800 mb-2">Backup Data</h4>
                      <p className="text-sm text-blue-600 mb-4">Download a complete copy of your menu, sales, and logs.</p>
                      <button 
                        onClick={downloadBackup}
                        className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
                      >
                          Export JSON
                      </button>
                  </div>
                  <div className="p-6 bg-red-50 rounded-xl border border-red-100">
                      <h4 className="font-bold text-red-800 mb-2">Restore Data</h4>
                      <p className="text-sm text-red-600 mb-4">Overwrite current system with a backup file. This cannot be undone.</p>
                      <input 
                        type="file" 
                        accept=".json"
                        onChange={handleImport}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
                      />
                  </div>
              </div>
          </div>
      )}

      {/* Menu Edit Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-[500px] shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">{menuForm.id ? 'Edit Item' : 'Add New Item'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Name</label>
                        <input 
                            className="w-full border p-2 rounded"
                            value={menuForm.name || ''}
                            onChange={e => setMenuForm({...menuForm, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea 
                            className="w-full border p-2 rounded text-sm h-20"
                            value={menuForm.description || ''}
                            onChange={e => setMenuForm({...menuForm, description: e.target.value})}
                            placeholder="A delicious traditional dish..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Price (ETB)</label>
                            <input 
                                type="number"
                                className="w-full border p-2 rounded"
                                value={menuForm.price || ''}
                                onChange={e => setMenuForm({...menuForm, price: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Stock</label>
                            <input 
                                type="number"
                                className="w-full border p-2 rounded"
                                value={menuForm.stock || ''}
                                onChange={e => setMenuForm({...menuForm, stock: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Category</label>
                        <select 
                            className="w-full border p-2 rounded"
                            value={menuForm.category || ''}
                            onChange={e => setMenuForm({...menuForm, category: e.target.value as any})}
                        >
                            <option value="">Select...</option>
                            <option value="Main">Main</option>
                            <option value="Breakfast">Breakfast</option>
                            <option value="Vegan">Vegan</option>
                            <option value="Side">Side</option>
                            <option value="Drink">Drink</option>
                        </select>
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase">Ingredients (comma separated)</label>
                         <textarea 
                             className="w-full border p-2 rounded text-sm"
                             value={Array.isArray(menuForm.ingredients) ? menuForm.ingredients.join(', ') : menuForm.ingredients || ''}
                             onChange={e => setMenuForm({...menuForm, ingredients: e.target.value})}
                         />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                    <button onClick={handleMenuSubmit} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Save Item</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Admin;
