
import React, { useEffect, useState } from 'react';
import { DataService, socket } from '../services/dataService';
import { MenuItem } from '../types';

const CATEGORY_IMAGES: Record<string, string> = {
  'Main': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1920&auto=format&fit=crop', // Spicy food
  'Breakfast': 'https://images.unsplash.com/photo-1533089862017-5614ec42050d?q=80&w=1920&auto=format&fit=crop', // Breakfast
  'Vegan': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1920&auto=format&fit=crop', // Veggies
  'Drink': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=1920&auto=format&fit=crop', // Drinks
  'Side': 'https://images.unsplash.com/photo-1606923829579-0cb9d465eabd?q=80&w=1920&auto=format&fit=crop', // Salad/Sides
};

const MenuBoard: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const load = () => {
        const m = DataService.getMenu().filter(i => !i.archived);
        setMenu(m);
        // Sort categories to ensure Main/Breakfast come first
        const cats = Array.from(new Set(m.map(i => i.category))).sort();
        setCategories(cats);
    };
    load();
    const unsub = socket.on('inventory_update', load);

    // Clock
    const clockInterval = setInterval(() => setTime(new Date()), 60000);

    // Rotate Category every 10 seconds
    const rotateInterval = setInterval(() => {
        setCategories(prev => {
            if (prev.length === 0) return prev;
            setActiveIndex(curr => (curr + 1) % prev.length);
            return prev;
        });
    }, 10000);

    return () => {
        unsub();
        clearInterval(clockInterval);
        clearInterval(rotateInterval);
    };
  }, []);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
      } else {
          if (document.exitFullscreen) document.exitFullscreen();
      }
  };

  const currentCategory = categories[activeIndex];
  const categoryItems = menu.filter(i => i.category === currentCategory);
  const bgImage = CATEGORY_IMAGES[currentCategory] || CATEGORY_IMAGES['Main'];

  if (categories.length === 0) return <div className="bg-black h-screen text-white flex items-center justify-center font-mono">SYSTEM LOADING...</div>;

  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-white relative font-sans">
      
      {/* --- Cinematic Background --- */}
      <div key={activeIndex} className="absolute inset-0 z-0">
           <div 
             className="absolute inset-0 bg-cover bg-center animate-[zoomIn_20s_infinite]"
             style={{ backgroundImage: `url(${bgImage})` }}
           ></div>
           <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
      </div>

      {/* --- Top Bar --- */}
      <div className="relative z-10 flex justify-between items-center p-8">
          <div className="flex items-center gap-4">
              <div className="bg-yellow-500 text-black font-bold px-4 py-1 rounded text-sm tracking-widest uppercase">Now Open</div>
              <h1 className="text-3xl font-bold tracking-tight text-white/90">ADDIS <span className="text-yellow-500">LOUNGE</span></h1>
          </div>
          <div className="text-right">
              <div className="text-4xl font-bold text-white font-mono">
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-sm text-white/60 uppercase tracking-widest">Welcome</div>
          </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="relative z-10 flex h-[calc(100vh-160px)] px-12 pb-12 gap-16">
          
          {/* Left: Category Hero */}
          <div className="w-1/3 flex flex-col justify-center animate-[fadeInLeft_1s_ease-out]">
              <div className="h-2 w-24 bg-yellow-500 mb-6"></div>
              <h2 className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 mb-4">
                  {currentCategory}
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed max-w-md">
                 Experience the authentic taste of Ethiopia. Fresh ingredients, traditional spices, made with love.
              </p>
          </div>

          {/* Right: Menu Grid */}
          <div className="w-2/3 flex flex-col justify-center">
             <div className="grid grid-cols-1 gap-x-12 gap-y-6 content-center">
                 {categoryItems.slice(0, 6).map((item, idx) => ( // Show max 6 items to keep it clean
                     <div 
                        key={item.id} 
                        className="flex items-end justify-between border-b border-white/10 pb-4 animate-[fadeInUp_0.5s_ease-out] group"
                        style={{ animationDelay: `${idx * 100}ms` }}
                     >
                         <div className="pr-8">
                             <h3 className="text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors mb-1">
                                 {item.name}
                             </h3>
                             <p className="text-white/50 text-lg truncate max-w-md">
                                 {item.description || item.ingredients?.join(', ')}
                             </p>
                         </div>
                         <div className="flex items-center gap-4 min-w-fit">
                             {item.stock === 0 ? (
                                 <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded text-sm font-bold uppercase tracking-wider">Sold Out</span>
                             ) : (
                                 <span className="text-4xl font-bold text-yellow-500 font-mono">
                                     {item.price}<span className="text-xl align-top ml-1 opacity-60">ETB</span>
                                 </span>
                             )}
                         </div>
                     </div>
                 ))}
             </div>
             
             {categoryItems.length > 6 && (
                 <div className="mt-6 text-white/40 italic text-lg">
                     + {categoryItems.length - 6} more items in this category...
                 </div>
             )}
          </div>
      </div>

      {/* --- Footer Ticker --- */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-yellow-500 flex items-center overflow-hidden whitespace-nowrap z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="animate-[marquee_30s_linear_infinite] text-black font-extrabold text-xl uppercase tracking-wider flex gap-16 px-4">
             <span>⚡ Fasting Menu Available Wed & Fri</span>
             <span>⚡ Free Wi-Fi: AddisGuest</span>
             <span>⚡ Happy Hour 4PM - 7PM</span>
             <span>⚡ Ask about our Special Kitfo</span>
             <span>⚡ We accept Telebirr & CBE Birr</span>
             <span>⚡ Live Music on Saturdays</span>
          </div>
      </div>

      {/* Hidden Toggle */}
      <button onClick={toggleFullscreen} className="absolute top-0 left-1/2 w-20 h-10 opacity-0 z-50"></button>

      <style>{`
        @keyframes zoomIn {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(-50px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MenuBoard;
