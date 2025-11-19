import React, { useEffect, useState } from 'react';
import { DataService, socket } from '../services/dataService';
import { Order, OrderStatus } from '../types';

const KDS: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const load = () => {
      const all = DataService.getOrders();
      // Show Pending and Cooking
      setOrders(all.filter(o => o.status !== OrderStatus.SERVED && o.status !== OrderStatus.READY));
    };
    load();

    const unsub = socket.on('new_order', load);
    const unsubUpdate = socket.on('order_update', load);

    return () => {
      unsub();
      unsubUpdate();
    };
  }, []);

  const advanceStatus = (order: Order) => {
    const nextStatus = order.status === OrderStatus.PENDING ? OrderStatus.COOKING : OrderStatus.READY;
    DataService.updateOrderStatus(order.id, nextStatus);
  };

  return (
    <div className="p-6 bg-gray-800 min-h-full text-white">
      <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">Kitchen Display System</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {orders.length === 0 && <p className="text-gray-500">No active orders.</p>}
        
        {orders.map(order => (
          <div key={order.id} className={`rounded-lg overflow-hidden shadow-lg border-l-8 ${
            order.status === OrderStatus.PENDING ? 'bg-white text-slate-800 border-red-500' : 'bg-orange-100 text-slate-800 border-orange-500'
          }`}>
            <div className="p-3 bg-gray-200 flex justify-between items-center font-bold border-b border-gray-300">
              <span>#{order.id.slice(-4)}</span>
              <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded">{new Date(order.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="p-4">
               <div className="mb-3 font-bold text-lg">
                 {order.tokenNumber ? `Token: ${order.tokenNumber}` : `Table: ${order.tableId}`}
               </div>
               <ul className="space-y-2 mb-4">
                 {order.items.map((item, idx) => (
                   <li key={idx} className="flex justify-between border-b border-gray-300 border-dotted pb-1">
                     <span>{item.name}</span>
                     <span className="font-bold bg-gray-300 px-2 rounded">x{item.quantity}</span>
                   </li>
                 ))}
               </ul>
               <button
                 onClick={() => advanceStatus(order)}
                 className={`w-full py-3 rounded font-bold text-white transition-colors ${
                   order.status === OrderStatus.PENDING ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                 }`}
               >
                 {order.status === OrderStatus.PENDING ? 'START COOKING' : 'MARK READY'}
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KDS;