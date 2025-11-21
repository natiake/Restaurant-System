
import React, { useEffect, useState } from 'react';
import { DataService, socket } from '../services/dataService';
import { Order, OrderStatus } from '../types';

const KDS: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const load = () => {
      const all = DataService.getOrders();
      setOrders(all.filter(o => o.status !== OrderStatus.SERVED && o.status !== OrderStatus.READY));
    };
    load();

    const unsub = socket.on('new_order', () => {
        DataService.playBeep();
        load();
    });
    const unsubUpdate = socket.on('order_update', load);
    
    const interval = setInterval(() => setNow(Date.now()), 30000);

    return () => {
      unsub();
      unsubUpdate();
      clearInterval(interval);
    };
  }, []);

  const advanceStatus = (order: Order) => {
    const nextStatus = order.status === OrderStatus.PENDING ? OrderStatus.COOKING : OrderStatus.READY;
    DataService.updateOrderStatus(order.id, nextStatus, "Kitchen Staff");
  };

  const getTimerColor = (timestamp: number) => {
      const minutes = (now - timestamp) / 60000;
      if (minutes > 20) return 'bg-red-600 text-white animate-pulse border-2 border-white';
      if (minutes > 10) return 'bg-orange-500 text-black';
      return 'bg-green-600 text-white';
  };

  const getDuration = (timestamp: number) => {
      return Math.floor((now - timestamp) / 60000) + "m";
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-gray-800 shrink-0">
          <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-3">
              <span>👨‍🍳</span> Kitchen Display System
          </h2>
          <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Active Orders: {orders.length}</span>
              <div className="text-xl font-mono font-bold bg-black px-3 py-1 rounded border border-gray-700">{new Date().toLocaleTimeString()}</div>
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {orders.length === 0 && (
                <div className="col-span-full h-[60vh] flex flex-col items-center justify-center text-gray-600">
                    <span className="text-6xl mb-4">✅</span>
                    <h3 className="text-2xl font-bold">All Caught Up</h3>
                </div>
            )}
            
            {orders.map(order => (
            <div key={order.id} className={`flex flex-col rounded-xl overflow-hidden border-t-8 shadow-lg h-full min-h-[300px] ${
                order.status === OrderStatus.PENDING 
                ? 'bg-white text-slate-900 border-blue-500' 
                : 'bg-orange-50 text-slate-900 border-orange-500'
            }`}>
                {/* Header */}
                <div className="p-3 bg-gray-100 flex justify-between items-start border-b border-gray-200">
                    <div>
                        <div className="text-xs text-gray-500 font-bold uppercase mb-1">{order.tableId === 'Takeaway' ? '🛍️ Takeaway' : `Table ${order.tableId}`}</div>
                        <div className="text-3xl font-extrabold leading-none">#{order.tokenNumber || order.id.slice(-4)}</div>
                    </div>
                    <div className={`text-lg px-2 py-1 rounded font-mono font-bold ${getTimerColor(order.timestamp)}`}>
                        {getDuration(order.timestamp)}
                    </div>
                </div>

                {/* Body */}
                <div className="p-3 flex-1 overflow-y-auto max-h-[400px]">
                    <ul className="space-y-3">
                        {order.items.map((item, idx) => (
                        <li key={idx} className="border-b border-dashed border-gray-200 pb-2 last:border-0">
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-lg font-bold leading-tight">{item.name}</span>
                                <span className="text-lg font-bold bg-slate-800 text-white px-2 py-0.5 rounded min-w-[32px] text-center">{item.quantity}</span>
                            </div>
                            {/* Modifiers */}
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {item.selectedModifiers.map((m, i) => (
                                        <span key={i} className="text-xs font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                                            {m.option.label}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {/* Notes Section Placeholder (if order had notes) */}
                        </li>
                        ))}
                    </ul>
                </div>

                {/* Footer Action */}
                <button
                    onClick={() => advanceStatus(order)}
                    className={`w-full py-5 text-xl font-bold text-white uppercase tracking-wider transition-colors mt-auto ${
                    order.status === OrderStatus.PENDING 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {order.status === OrderStatus.PENDING ? 'Start Prep' : 'Done'}
                </button>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default KDS;
