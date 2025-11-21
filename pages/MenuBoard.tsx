
import React, { useEffect, useState } from 'react';
import { DataService, socket } from '../services/dataService';
import { MenuItem } from '../types';

const MenuBoard: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  useEffect(() => {
    const load = () => {
        const m = DataService.getMenu();
        setMenu(m);
        setCategories(Array.from(new Set(m.map(i => i.category))));
    };
    load();
    const unsub = socket.on('inventory_update', load);

    const interval = setInterval(() => {
        setCategories(prev => {
            if (prev.length === 0) return prev;
            setActiveCategoryIndex(curr => (curr + 1) % prev.length);
            return prev;
        });
    }, 8000); // Rotate every 8 seconds

    return () => {
        unsub();
        clearInterval(interval);
    };
  }, []);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
      } else {
          if (document.exitFullscreen) document.exitFullscreen();
      }
  };

  const activeCategory = categories[activeCategoryIndex];
  const displayItems = menu.filter(i => i.category === activeCategory);

  if (categories.length === 0) return <div className="bg-black h-screen text-white flex items-center justify-center">Loading Menu...</div>;

  return (
    <div className="h-screen bg-slate-900 text-white overflow-hidden relative flex flex-col">
      {/* Header / Banner */}
      <div className="h-24 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-8 shadow-2xl z-10">
          <h1 className="text-4xl font-bold text-yellow-500 tracking-wider">ADDIS RESTAURANT</h1>
          <div className="text-right">
             <p className="text-slate-400 text-sm uppercase tracking-widest">Open Daily</p>
             <p className="text-xl font-bold">7:00 AM - 10:00 PM</p>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
          {/* Video/Image Background Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

          <div className="flex-1 flex p-12 gap-12 z-10">
              {/* Left: Featured Item or Category Image (Placeholder) */}
              <div className="w-1/3 bg-slate-800 rounded-3xl border border-slate-700 p-8 flex flex-col items-center justify-center shadow-2xl transform transition-all duration-1000">
                  <div className="w-48 h-48 rounded-full bg-yellow-500 mb-8 flex items-center justify-center text-slate-900 text-6xl font-bold">
                      {activeCategory?.charAt(0)}
                  </div>
                  <h2 className="text-5xl font-bold text-center mb-4">{activeCategory}</h2>
                  <p className="text-slate-400 text-center text-xl">Freshly prepared authentic Ethiopian cuisine.</p>
              </div>

              {/* Right: Items List */}
              <div className="w-2/3 grid grid-cols-1 gap-4 content-start">
                  {displayItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`flex justify-between items-end border-b border-slate-700 pb-4 mb-2 ${item.stock === 0 ? 'opacity-40 grayscale' : ''}`}
                      >
                          <div>
                              <h3 className="text-3xl font-bold">{item.name}</h3>
                              <p className="text-slate-400 mt-1 text-lg">{item.ingredients?.slice(0, 3).join(', ')}</p>
                          </div>
                          <div className="text-right">
                             {item.stock === 0 ? (
                                 <span className="text-red-500 font-bold text-xl uppercase border border-red-500 px-2 rounded">Out of Stock</span>
                             ) : (
                                <span className="text-4xl font-bold text-yellow-400 font-mono">{item.price} <span className="text-xl text-yellow-600">ETB</span></span>
                             )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Footer / Ticker */}
      <div className="h-16 bg-yellow-600 flex items-center overflow-hidden whitespace-nowrap">
          <div className="animate-[marquee_20s_linear_infinite] text-slate-900 font-bold text-2xl px-4">
             Welcome to Addis Restaurant! • Try our Special Kitfo today! • Free Wi-Fi Available • Fasting Menu Available Every Wednesday & Friday • Scan QR code to order from your table •
          </div>
      </div>

      {/* Hidden Control */}
      <button onClick={toggleFullscreen} className="absolute top-0 right-0 p-4 opacity-0 hover:opacity-100 text-white text-xs">
          Toggle Fullscreen
      </button>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default MenuBoard;
