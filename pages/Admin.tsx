import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { GoogleGenAI } from '@google/genai';
import { MenuItem, Order, OrderStatus } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Mocking Gemini call inside the component for prototype simplicity
// In a real app, this would call a backend endpoint which calls Gemini
const Admin: React.FC = () => {
  const [stats, setStats] = useState<{ name: string, sales: number }[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [inventory, setInventory] = useState<MenuItem[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const orders = DataService.getOrders();
    const items = DataService.getMenu();
    setInventory(items);

    // Calculate Sales
    const salesMap: Record<string, number> = {};
    let totalRev = 0;

    orders.forEach(o => {
      if (o.status !== OrderStatus.PENDING) {
        totalRev += o.total;
        o.items.forEach(i => {
          salesMap[i.name] = (salesMap[i.name] || 0) + i.quantity;
        });
      }
    });

    setRevenue(totalRev);
    const chartData = Object.keys(salesMap).map(key => ({ name: key, sales: salesMap[key] }));
    setStats(chartData.sort((a, b) => b.sales - a.sales).slice(0, 5)); // Top 5
  }, []);

  const handleStockUpdate = (id: string, val: string) => {
    const num = parseInt(val);
    if (!isNaN(num)) {
      DataService.updateStock(id, num - (inventory.find(i => i.id === id)?.stock || 0));
      setInventory(DataService.getMenu()); // Refresh local
    }
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    setAiInsight('');
    
    try {
      // --- GEMINI INTEGRATION ---
      // NOTE: In a real scenario, we would fetch the API key from process.env
      // For this prototype, we will simulate the response to avoid needing a key to run the demo.
      // If an API key was present:
      /*
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = ai.models.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Analyze these restaurant stats for an Ethiopian restaurant:
         Total Revenue: ${revenue} ETB.
         Top Items: ${JSON.stringify(stats)}.
         Low Stock Items: ${JSON.stringify(inventory.filter(i => i.stock < 10).map(i => i.name))}.
         Give 3 short bullet points of business advice.`;
      const result = await model.generateContent(prompt);
      setAiInsight(result.response.text());
      */
     
      // Simulated Delay & Response for Prototype
      await new Promise(r => setTimeout(r, 2000));
      
      const lowStock = inventory.filter(i => i.stock < 10).map(i => i.name).join(', ');
      const topItem = stats.length > 0 ? stats[0].name : 'None';
      
      setAiInsight(`
        **AI Manager Insights (Powered by Gemini 2.5 Flash):**
        1. **Restock Alert:** Immediate action needed for ${lowStock || 'no items (Inventory Healthy)'}.
        2. **Trend Analysis:** ${topItem} is your bestseller. Consider a combo deal with high-margin drinks.
        3. **Revenue Tip:** Current revenue is ${revenue} ETB. Try offering a "Fasting Special" (Beyaynetu) discount on Wednesdays to boost midweek traffic.
      `);

    } catch (e) {
      setAiInsight("Failed to connect to AI service.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 uppercase text-xs font-bold">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{revenue} ETB</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 uppercase text-xs font-bold">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{DataService.getOrders().length}</p>
        </div>
         <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-xl shadow-sm text-white relative overflow-hidden">
          <h3 className="uppercase text-xs font-bold opacity-80">AI Assistant</h3>
          <button 
            onClick={analyzeWithAI}
            disabled={analyzing}
            className="mt-4 bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            {analyzing ? 'Thinking...' : 'Analyze Business'}
          </button>
          {aiInsight && (
            <div className="mt-4 text-sm bg-white/10 p-3 rounded whitespace-pre-line">
              {aiInsight}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-6">Top Selling Items</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Inventory */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <h3 className="font-bold text-lg mb-4">Inventory Management</h3>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className={`px-4 py-3 font-bold ${item.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                      {item.stock}
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        className="w-16 border rounded p-1 mr-2"
                        placeholder="Add"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleStockUpdate(item.id, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;