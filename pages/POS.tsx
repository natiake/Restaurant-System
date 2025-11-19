import React, { useState, useEffect } from 'react';
import { DataService, socket } from '../services/dataService';
import { MenuItem, CartItem, PaymentMethod, OrderStatus, Table } from '../types';

interface POSProps {
  staffId: string;
}

const POS: React.FC<POSProps> = ({ staffId }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState<string>('All');
  const [selectedTable, setSelectedTable] = useState<string>('Takeaway');
  const [tables, setTables] = useState<Table[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    // Initial Load
    setMenu(DataService.getMenu());
    setTables(DataService.getTables());

    // Listen for inventory updates
    const unsubInv = socket.on('inventory_update', (updatedMenu: MenuItem[]) => {
      setMenu(updatedMenu);
    });
    
    // Listen for table updates
    const unsubTable = socket.on('tables_update', (updatedTables: Table[]) => {
      setTables(updatedTables);
    });

    return () => {
      unsubInv();
      unsubTable();
    };
  }, []);

  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev; // Stock limit
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.reduce((acc, item) => {
      if (item.id === itemId) {
        if (item.quantity > 1) return [...acc, { ...item, quantity: item.quantity - 1 }];
        return acc;
      }
      return [...acc, item];
    }, [] as CartItem[]));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePayment = (method: PaymentMethod) => {
    const isTakeaway = selectedTable === 'Takeaway';
    let token = undefined;
    
    if (isTakeaway) {
        token = DataService.issueToken().toString();
    }

    const order = {
      id: `ord-${Date.now()}`,
      tableId: selectedTable,
      items: cart,
      total,
      status: OrderStatus.PENDING,
      paymentMethod: method,
      timestamp: Date.now(),
      staffId,
      tokenNumber: token
    };

    DataService.createOrder(order);
    setCart([]);
    setPaymentModalOpen(false);
    setSelectedTable('Takeaway');
    alert(`Order Placed! ${token ? `Token: ${token}` : `Table: ${selectedTable}`}`);
  };

  const categories = ['All', ...Array.from(new Set(menu.map(i => i.category)))];
  const filteredMenu = category === 'All' ? menu : menu.filter(i => i.category === category);

  return (
    <div className="flex h-full">
      {/* Left: Menu Grid */}
      <div className="flex-1 p-4 flex flex-col bg-gray-100">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap shadow-sm transition-all ${
                category === cat 
                  ? 'bg-slate-800 text-white ring-2 ring-yellow-500' 
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-20">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              disabled={item.stock === 0}
              className={`p-4 rounded-xl shadow-sm flex flex-col justify-between h-32 transition-transform active:scale-95 text-left ${
                item.stock === 0 ? 'bg-gray-200 opacity-50 cursor-not-allowed' : 'bg-white hover:shadow-md'
              }`}
            >
              <div>
                <h3 className="font-bold text-slate-800 leading-tight">{item.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.stock} in stock</p>
              </div>
              <div className="mt-2 font-mono text-yellow-600 font-bold">{item.price} ETB</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart Sidebar */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl">
        <div className="p-4 bg-slate-50 border-b">
          <label className="block text-xs font-bold text-slate-500 mb-1">ORDER TYPE / TABLE</label>
          <select 
            className="w-full p-2 border rounded bg-white font-semibold"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            <option value="Takeaway">Takeaway (Token)</option>
            {tables.map(t => (
              <option key={t.id} value={t.id} disabled={t.isOccupied}>
                {t.name} {t.isOccupied ? '(Occupied)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">Order is empty</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center mb-4 border-b pb-2">
                <div>
                  <div className="font-bold text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.price} x {item.quantity}</div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="font-mono font-bold">{item.price * item.quantity}</span>
                   <button onClick={() => removeFromCart(item.id)} className="text-red-500 bg-red-50 p-1 rounded hover:bg-red-100">
                     -
                   </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t">
          <div className="flex justify-between items-center mb-4 text-xl font-bold text-slate-800">
            <span>Total</span>
            <span>{total} ETB</span>
          </div>
          <button
            onClick={() => cart.length > 0 && setPaymentModalOpen(true)}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-lg font-bold text-white text-lg shadow-lg transition-colors ${
              cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            PAY & PRINT
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(PaymentMethod).map(method => (
                <button
                  key={method}
                  onClick={() => handlePayment(method)}
                  className="p-4 bg-slate-100 rounded-lg hover:bg-slate-200 font-semibold text-slate-700"
                >
                  {method}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setPaymentModalOpen(false)}
              className="mt-4 w-full py-2 text-red-600 font-bold hover:bg-red-50 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;