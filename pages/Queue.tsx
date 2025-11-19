import React, { useEffect, useState } from 'react';
import { DataService, socket } from '../services/dataService';
import { QueueState, Role, Staff } from '../types';

interface QueueProps {
  user: Staff;
}

const Queue: React.FC<QueueProps> = ({ user }) => {
  const [queue, setQueue] = useState<QueueState>({ currentServing: 0, lastIssued: 0 });

  useEffect(() => {
    setQueue(DataService.getQueue());
    const unsub = socket.on('queue_update', (q: QueueState) => setQueue(q));
    return () => unsub();
  }, []);

  const next = () => {
    DataService.nextQueue();
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Controls (Only for Staff) */}
      <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
        <h2 className="font-bold text-lg">Queue Monitor</h2>
        {user.role !== Role.KITCHEN && (
          <div className="flex gap-4">
             <div className="bg-slate-700 px-4 py-2 rounded">
               Last Token Issued: <span className="font-mono font-bold text-yellow-400">{queue.lastIssued}</span>
             </div>
             <button 
               onClick={next}
               className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold shadow-lg active:translate-y-1 transition-all"
             >
               CALL NEXT
             </button>
          </div>
        )}
      </div>

      {/* Public Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-light text-slate-400 mb-4 uppercase tracking-widest">Now Serving</h1>
          <div className="text-[150px] md:text-[250px] leading-none font-bold text-yellow-500 font-mono drop-shadow-2xl bg-slate-800 p-10 rounded-3xl border-4 border-slate-700">
            {queue.currentServing}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <span className="block text-slate-400 text-sm uppercase">Last Called</span>
              <span className="text-4xl font-mono font-bold text-white">{Math.max(0, queue.currentServing - 1)}</span>
           </div>
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <span className="block text-slate-400 text-sm uppercase">Wait Time (Est)</span>
              <span className="text-4xl font-mono font-bold text-green-400">
                 {Math.max(0, (queue.lastIssued - queue.currentServing) * 5)} min
              </span>
           </div>
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <span className="block text-slate-400 text-sm uppercase">Preparing</span>
              <span className="text-4xl font-mono font-bold text-white">
                {queue.currentServing < queue.lastIssued ? `${queue.currentServing + 1} - ${queue.lastIssued}` : '-'}
              </span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Queue;