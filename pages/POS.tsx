
import React, { useState, useEffect } from 'react';
import { DataService, socket } from '../services/dataService';
import { MenuItem, CartItem, PaymentMethod, OrderStatus, Table, TableStatus, Role, Order, Customer, ModifierOption, ModifierGroup } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface POSProps {
  staffId: string;
  staffName: string;
  role: Role;
}

const POS: React.FC<POSProps> = ({ staffId, staffName, role }) => {
  // Core Data
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [branch, setBranch] = useState(DataService.getCurrentBranch());
  
  // UI State
  const [category, setCategory] = useState<string>('All');
  const [selectedTable, setSelectedTable] = useState<string>('Takeaway');
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'order' | 'held'>('order');
  
  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<{group: string, option: ModifierOption}[]>([]);
  
  // Advanced Features State
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Split Bill State
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitCart, setSplitCart] = useState<CartItem[]>([]);

  const [managerAuthOpen, setManagerAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{type: 'void' | 'discount', data: any} | null>(null);

  // Payment State
  const [tipAmount, setTipAmount] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState<{token?: string, table?: string} | null>(null);

  const { t, language } = useLanguage();

  useEffect(() => {
    loadData();
    const unsubInv = socket.on('inventory_update', (m: MenuItem[]) => setMenu(m));
    const unsubTable = socket.on('tables_update', (t: Table[]) => setTables(t));
    const unsubOrder = socket.on('new_order', loadData);
    return () => { unsubInv(); unsubTable(); unsubOrder(); };
  }, []);

  const loadData = () => {
      setMenu(DataService.getMenu());
      setTables(DataService.getTables());
      setOrders(DataService.getOrders());
      setBranch(DataService.getCurrentBranch());
  };

  // --- Split Bill Logic ---
  const openSplitModal = () => {
      setSplitCart([]); 
      setSplitModalOpen(true);
  };

  const moveItemToSplit = (item: CartItem) => {
      // Logic to move one instance of item or the whole line
      // Simplification: Move the whole line item
      setCart(prev => prev.filter(i => i.cartItemId !== item.cartItemId));
      setSplitCart(prev => [...prev, item]);
  };

  const moveItemToOriginal = (item: CartItem) => {
      setSplitCart(prev => prev.filter(i => i.cartItemId !== item.cartItemId));
      setCart(prev => [...prev, item]);
  };

  const confirmSplit = () => {
      if (splitCart.length === 0) return;
      
      const subtotalSplit = splitCart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const scSplit = subtotalSplit * (branch?.serviceChargeRate || 0);
      const totalSplit = subtotalSplit + scSplit;

      const newOrder: Order = {
          id: `ord-split-${Date.now()}`,
          branchId: branch?.id || 'unk',
          tableId: selectedTable, // Same table, different check
          items: splitCart,
          subtotal: subtotalSplit,
          serviceCharge: scSplit,
          total: totalSplit,
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.CASH, 
          timestamp: Date.now(),
          staffId: staffId
      };

      DataService.createOrder(newOrder, staffName);
      setSplitModalOpen(false);
      setSplitCart([]);
      alert(t.confirmSplit + " - #" + newOrder.id.slice(-4));
  };

  // --- Modifiers Logic ---
  const openProductModal = (item: MenuItem) => {
      if (item.stock <= 0) return;
      setSelectedProduct(item);
      setProductQuantity(1);
      setSelectedModifiers([]);
  };

  const toggleModifier = (group: ModifierGroup, option: ModifierOption) => {
      setSelectedModifiers(prev => {
          const exists = prev.find(m => m.group === group.name && m.option.label === option.label);
          if (exists) return prev.filter(m => m.option.label !== option.label);
          
          if (!group.multiSelect) {
              const othersRemoved = prev.filter(m => m.group !== group.name);
              return [...othersRemoved, { group: group.name, option }];
          }
          return [...prev, { group: group.name, option }];
      });
  };

  const addItemFromModal = () => {
      if (!selectedProduct) return;
      const newItem: CartItem = {
          ...selectedProduct,
          quantity: productQuantity,
          selectedModifiers: selectedModifiers,
          cartItemId: `ci-${Date.now()}-${Math.random()}`
      };
      setCart(prev => [...prev, newItem]);
      setSelectedProduct(null);
  };

  // --- Cart & Payment ---
  const removeFromCart = (cartItemId: string) => {
      const item = cart.find(c => c.cartItemId === cartItemId);
      if (!item) return;
      // Simplified void logic for prototype
      setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const subtotal = cart.reduce((sum, item) => {
      const modPrice = item.selectedModifiers?.reduce((mSum, m) => mSum + m.option.price, 0) || 0;
      return sum + ((item.price + modPrice) * item.quantity);
  }, 0);
  
  const serviceCharge = subtotal * (branch?.serviceChargeRate || 0);
  const total = subtotal + serviceCharge + tipAmount;

  const handlePayment = (method: PaymentMethod) => {
    createOrder(OrderStatus.PENDING, method);
    setPaymentModalOpen(false);
  };

  const createOrder = (status: OrderStatus, method: PaymentMethod) => {
    const isTakeaway = selectedTable === 'Takeaway';
    let token = isTakeaway && status !== OrderStatus.HELD ? DataService.issueToken().toString() : undefined;

    const order: Order = {
      id: `ord-${Date.now()}`,
      branchId: branch?.id || 'unknown',
      tableId: selectedTable,
      items: cart,
      subtotal,
      serviceCharge,
      total,
      status,
      paymentMethod: method,
      timestamp: Date.now(),
      staffId: staffId,
      tokenNumber: token,
      tip: tipAmount,
      customerId: selectedCustomer?.id
    };

    DataService.createOrder(order, staffName);
    setCart([]);
    setTipAmount(0);
    setSelectedTable('Takeaway');
    setSelectedCustomer(null);
    
    if (status !== OrderStatus.HELD) {
        setOrderSuccess({ token, table: !isTakeaway ? selectedTable : undefined });
        setTimeout(() => setOrderSuccess(null), 3000);
    }
  };

  const getName = (item: MenuItem) => (language === 'am' && item.nameAm) ? item.nameAm : item.name;
  const getDescription = (item: MenuItem) => (language === 'am' && item.descriptionAm) ? item.descriptionAm : item.description;

  // Filter Logic
  const visibleMenu = menu.filter(item => !item.archived);
  const categories = ['All', ...Array.from(new Set(visibleMenu.map(i => i.category)))];
  const filteredMenu = visibleMenu.filter(item => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch = getName(item).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col md:flex-row h-full relative bg-slate-50">
      {/* Success Overlay */}
      {orderSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 animate-fade-in">
              <div className="bg-white p-10 rounded-3xl shadow-2xl text-center transform animate-bounce-in border-4 border-green-500">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Order Placed!</h2>
                  {orderSuccess.token && <div className="text-5xl font-mono font-bold text-slate-800 mt-4">#{orderSuccess.token}</div>}
              </div>
          </div>
      )}

      {/* Left: Menu Section */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
        {/* Top Bar (Tabs & Search) */}
        <div className="p-4 bg-white shadow-sm z-10 space-y-4">
            <div className="flex gap-4">
                <button 
                    onClick={() => setTab('order')} 
                    className={`flex-1 h-14 rounded-xl font-bold text-lg transition-colors shadow-sm ${tab === 'order' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                    {t.newOrder}
                </button>
                <button 
                    onClick={() => setTab('held')} 
                    className={`flex-1 h-14 rounded-xl font-bold text-lg transition-colors shadow-sm ${tab === 'held' ? 'bg-orange-100 text-orange-700 border-2 border-orange-200' : 'bg-gray-100 text-gray-500'}`}
                >
                    {t.heldOrders}
                </button>
            </div>
            
            {tab === 'order' && (
                <>
                  <div className="relative">
                      <input 
                          type="text" 
                          placeholder={t.searchPlaceholder}
                          className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-lg font-medium outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <span className="absolute left-4 top-4 text-gray-400 text-xl">🔍</span>
                  </div>
                  
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {categories.map(cat => (
                      <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`px-8 h-12 rounded-full font-bold text-lg whitespace-nowrap transition-all shadow-sm ${
                          category === cat 
                              ? 'bg-yellow-500 text-black ring-4 ring-yellow-100 scale-105' 
                              : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                          {cat === 'All' ? t.allCategories : cat}
                      </button>
                      ))}
                  </div>
                </>
            )}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
            {tab === 'order' ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
                    {filteredMenu.map(item => (
                        <button
                            key={item.id}
                            onClick={() => openProductModal(item)}
                            disabled={item.stock === 0}
                            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden active:scale-95 transition-transform h-64 ${item.stock === 0 ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}
                        >
                             {/* Badges */}
                             <div className="absolute top-0 right-0 flex flex-col items-end">
                                {item.stock < 10 && item.stock > 0 && (
                                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">{t.lowStock}</span>
                                )}
                                {item.stock === 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">{t.outOfStock}</span>
                                )}
                             </div>

                            <div className="text-left mt-2">
                                <h3 className="font-bold text-xl leading-tight text-slate-800 mb-2 line-clamp-2">{getName(item)}</h3>
                                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{getDescription(item)}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded">{item.stock} left</span>
                                <span className="text-2xl font-bold text-slate-800 font-mono">{item.price}</span>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.filter(o => o.status === OrderStatus.HELD).map(o => (
                        <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center border-l-8 border-orange-400">
                            <div>
                                <div className="font-bold text-xl mb-1">Table: {o.tableId}</div>
                                <div className="text-sm text-gray-500 font-medium">{new Date(o.timestamp).toLocaleTimeString()} • {o.items.length} Items</div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="font-bold text-2xl font-mono">{o.total} ETB</span>
                                <button 
                                    onClick={() => { setCart(o.items); setSelectedTable(o.tableId); DataService.updateOrderStatus(o.id, OrderStatus.PENDING, staffName); setTab('order'); }} 
                                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700"
                                >
                                    Resume
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Right: Cart Section */}
      <div className="w-full md:w-[450px] bg-white flex flex-col shadow-2xl z-20 h-[60vh] md:h-auto border-t md:border-t-0 md:border-l border-gray-300">
          {/* Top Info Bar */}
          <div className="bg-slate-50 p-4 border-b border-gray-200 flex justify-between items-center gap-2">
             <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Customer</label>
                <button onClick={() => setCustomerModalOpen(true)} className="w-full flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
                    <span className="font-bold text-blue-900 truncate">{selectedCustomer?.name || t.guest}</span>
                    <span className="text-blue-500 text-xs font-bold uppercase">{t.findCustomer}</span>
                </button>
             </div>
             <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Table / Order Type</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-slate-700 outline-none shadow-sm h-[42px]"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                >
                  <option value="Takeaway">🛍️ {t.takeaway}</option>
                  {tables.map(table => (
                      <option key={table.id} value={table.id} disabled={table.status !== TableStatus.AVAILABLE}>
                          🪑 {table.name}
                      </option>
                  ))}
                </select>
             </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {cart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-60">
                      <span className="text-8xl mb-4">🛒</span>
                      <p className="text-xl font-bold">Cart is empty</p>
                      <p className="text-sm">Select items from menu</p>
                  </div>
              )}
              {cart.map((item) => (
                  <div key={item.cartItemId} className="flex justify-between items-start py-3 border-b border-dashed border-gray-100 animate-fade-in">
                      <div className="flex-1 pr-2">
                          <div className="flex justify-between items-baseline mb-1">
                              <span className="font-bold text-lg text-slate-800">{getName(item)}</span>
                              <span className="font-mono font-bold text-slate-800">
                                  {((item.price + (item.selectedModifiers?.reduce((s,m)=>s+m.option.price,0)||0)) * item.quantity).toFixed(0)}
                              </span>
                          </div>
                          <div className="text-sm text-gray-500 flex flex-wrap gap-2 items-center">
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">Qty: {item.quantity}</span>
                              <span className="text-xs">@ {item.price}</span>
                          </div>
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="mt-1 pl-2 border-l-2 border-blue-200 space-y-0.5">
                                {item.selectedModifiers.map((m, i) => (
                                    <div key={i} className="text-xs text-blue-600 font-medium">+ {m.option.label} ({m.option.price})</div>
                                ))}
                              </div>
                          )}
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.cartItemId)} 
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                      >
                          <span className="text-xl font-bold">×</span>
                      </button>
                  </div>
              ))}
          </div>

          {/* Bottom Actions */}
          <div className="p-5 bg-slate-50 border-t border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-slate-500 text-sm font-medium">
                      <span>{t.subtotal}</span> 
                      <span>{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-sm font-medium">
                      <span>{t.serviceCharge} ({(branch?.serviceChargeRate||0)*100}%)</span> 
                      <span>{serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-extrabold text-slate-800 pt-3 border-t border-dashed border-gray-300">
                      <span>{t.total}</span>
                      <span>{total.toFixed(2)} ETB</span>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                  <button onClick={() => {createOrder(OrderStatus.HELD, PaymentMethod.CASH)}} className="h-12 rounded-xl font-bold text-orange-700 bg-orange-100 border border-orange-200 hover:bg-orange-200 transition-colors">
                      {t.holdOrder}
                  </button>
                  <button onClick={openSplitModal} disabled={cart.length === 0} className="h-12 rounded-xl font-bold text-blue-700 bg-blue-100 border border-blue-200 hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {t.splitBill}
                  </button>
              </div>
              <button 
                onClick={() => setPaymentModalOpen(true)} 
                disabled={cart.length === 0}
                className="w-full h-16 bg-green-600 text-white rounded-xl font-bold text-xl shadow-lg shadow-green-600/20 hover:bg-green-700 hover:shadow-green-600/40 transform active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
              >
                  {t.payPrint}
              </button>
          </div>
      </div>

      {/* --- Modals --- */}

      {/* Product Modal */}
      {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="bg-slate-900 p-6 text-white flex justify-between items-start shrink-0">
                      <div>
                         <h2 className="text-2xl font-bold leading-tight pr-4">{getName(selectedProduct)}</h2>
                         <p className="text-slate-400 text-sm mt-1 line-clamp-2">{getDescription(selectedProduct)}</p>
                      </div>
                      <button onClick={() => setSelectedProduct(null)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-lg">✕</button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1">
                      {/* Quantity Stepper */}
                      <div className="flex items-center justify-center mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <button onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))} className="w-14 h-14 rounded-xl bg-white border border-gray-200 text-slate-700 text-2xl font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-transform">-</button>
                          <span className="mx-8 text-5xl font-bold text-slate-800 tabular-nums">{productQuantity}</span>
                          <button onClick={() => setProductQuantity(productQuantity + 1)} className="w-14 h-14 rounded-xl bg-slate-800 text-white text-2xl font-bold shadow-lg shadow-slate-800/30 hover:bg-slate-700 active:scale-95 transition-transform">+</button>
                      </div>

                      {/* Modifiers */}
                      {selectedProduct.modifiers?.map(group => (
                          <div key={group.name} className="mb-6">
                              <h3 className="font-bold text-slate-800 mb-3 uppercase text-xs tracking-wider bg-gray-100 p-2 rounded flex justify-between">
                                  <span>{language === 'am' && group.nameAm ? group.nameAm : group.name}</span>
                                  <span className="text-gray-400 font-normal">{group.multiSelect ? 'Multiple' : 'Select One'}</span>
                              </h3>
                              <div className="grid grid-cols-1 gap-2">
                                  {group.options.map(opt => {
                                      const isSelected = selectedModifiers.some(m => m.group === group.name && m.option.label === opt.label);
                                      return (
                                          <button
                                            key={opt.label}
                                            onClick={() => toggleModifier(group, opt)}
                                            className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all active:scale-[0.99] ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                          >
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                                                      {isSelected && <span className="text-white text-xs">✓</span>}
                                                  </div>
                                                  <span className={`font-bold text-lg ${isSelected ? 'text-green-800' : 'text-gray-600'}`}>
                                                      {language === 'am' && opt.labelAm ? opt.labelAm : opt.label}
                                                  </span>
                                              </div>
                                              {opt.price > 0 && <span className="text-sm font-mono font-bold text-slate-500">+{opt.price}</span>}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-white shrink-0">
                      <button 
                          onClick={addItemFromModal} 
                          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-black active:scale-[0.99] transition-transform flex justify-between px-8"
                      >
                          <span>{t.addToCart}</span>
                          <span className="text-yellow-400 font-mono">
                              {((selectedProduct.price + selectedModifiers.reduce((s,m)=>s+m.option.price,0)) * productQuantity)} ETB
                          </span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Split Bill Modal */}
      {splitModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
                  <div className="bg-slate-800 p-5 flex justify-between items-center text-white shrink-0">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                          <span className="text-2xl">✂️</span> {t.splitBill}
                      </h2>
                      <button onClick={() => setSplitModalOpen(false)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold">{t.close}</button>
                  </div>
                  
                  <div className="flex-1 flex overflow-hidden">
                      {/* Left Panel: Original Bill */}
                      <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50 p-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mb-4 text-center">
                              <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">{t.originalCheck}</h3>
                              <div className="text-2xl font-bold font-mono mt-1">{cart.reduce((s,i)=>s+i.price*i.quantity, 0)} ETB</div>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                              {cart.map(item => (
                                  <button 
                                    key={item.cartItemId} 
                                    onClick={() => moveItemToSplit(item)}
                                    className="w-full bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border border-gray-200 hover:border-blue-400 hover:bg-blue-50 group transition-all"
                                  >
                                      <div className="text-left">
                                          <div className="font-bold text-slate-800">{getName(item)}</div>
                                          <div className="text-xs text-gray-500 font-mono">{item.price} ETB</div>
                                      </div>
                                      <div className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                                          ➔
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Right Panel: New Bill */}
                      <div className="flex-1 flex flex-col bg-white p-4 border-l-4 border-blue-500/10">
                          <div className="bg-blue-50 p-3 rounded-lg shadow-sm border border-blue-100 mb-4 text-center">
                              <h3 className="font-bold text-blue-800 uppercase tracking-wide text-sm">{t.newCheck}</h3>
                              <div className="text-2xl font-bold font-mono mt-1 text-blue-900">{splitCart.reduce((s,i)=>s+i.price*i.quantity, 0)} ETB</div>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                              {splitCart.length === 0 && (
                                  <div className="h-full flex items-center justify-center text-gray-400 italic border-2 border-dashed border-gray-100 rounded-xl">
                                      Tap items on left to move here
                                  </div>
                              )}
                              {splitCart.map(item => (
                                  <button 
                                    key={item.cartItemId} 
                                    onClick={() => moveItemToOriginal(item)}
                                    className="w-full bg-blue-50 p-4 rounded-xl shadow-sm flex justify-between items-center border border-blue-100 hover:border-slate-400 hover:bg-gray-50 group transition-all"
                                  >
                                      <div className="bg-gray-200 text-gray-600 w-8 h-8 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                                          ⬅
                                      </div>
                                      <div className="text-right">
                                          <div className="font-bold text-blue-900">{getName(item)}</div>
                                          <div className="text-xs text-blue-600 font-mono">{item.price} ETB</div>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="p-5 border-t border-gray-200 bg-white flex justify-end gap-4 shrink-0">
                      <button onClick={() => setSplitModalOpen(false)} className="px-6 py-4 text-slate-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                      <button 
                        onClick={confirmSplit}
                        disabled={splitCart.length === 0} 
                        className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                          <span>{t.confirmSplit}</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded text-sm">Create Order</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl transform scale-100 transition-all">
                  <h2 className="text-3xl font-bold mb-8 text-center text-slate-800">{t.payPrint}</h2>
                  
                  <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                      <div className="flex justify-between text-xl font-bold text-slate-700">
                          <span>{t.total}</span> 
                          <span>{total.toFixed(2)} ETB</span>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.tip} (ETB)</label>
                          <input 
                              type="number" 
                              className="w-full border-2 border-gray-200 rounded-lg p-3 text-xl font-bold text-center focus:border-green-500 focus:outline-none" 
                              value={tipAmount} 
                              onChange={e => setTipAmount(Number(e.target.value))} 
                              placeholder="0"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                      {Object.values(PaymentMethod).map(m => (
                          <button 
                              key={m} 
                              onClick={() => handlePayment(m)} 
                              className="bg-white border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 hover:text-green-700 py-4 rounded-xl font-bold text-slate-600 transition-all"
                          >
                              {m}
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setPaymentModalOpen(false)} className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors">{t.cancel}</button>
              </div>
          </div>
      )}

      {/* Customer Modal */}
      {customerModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-slate-800">{t.customerName}</h3>
                  <input 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl mb-4 text-lg outline-none focus:border-blue-500" 
                    placeholder="Enter Phone Number..." 
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                        const c = DataService.findCustomerByPhone(customerSearch);
                        if(c) { setSelectedCustomer(c); setCustomerModalOpen(false); }
                        else { alert("Customer not found. Feature to add new coming soon."); }
                    }}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg mb-2"
                  >
                      {t.findCustomer}
                  </button>
                  <button onClick={() => setCustomerModalOpen(false)} className="w-full py-3 text-gray-500 font-bold">Close</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default POS;
