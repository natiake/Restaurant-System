
import React, { useState, useEffect } from 'react';
import { DataService, socket } from '../services/dataService';
import { MenuItem, CartItem, PaymentMethod, OrderStatus, Table, TableStatus, Staff, Role, Order, Customer, ModifierOption, ModifierGroup } from '../types';
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
  const [staffList, setStaffList] = useState<Staff[]>([]);
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
  const [newCustomerForm, setNewCustomerForm] = useState<Partial<Customer>>({});
  
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [itemsToSplit, setItemsToSplit] = useState<string[]>([]); // cartItemIds

  const [managerAuthOpen, setManagerAuthOpen] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [pendingAction, setPendingAction] = useState<{type: 'void' | 'discount', data: any} | null>(null);

  // Payment State
  const [tipAmount, setTipAmount] = useState(0);
  const [discountType, setDiscountType] = useState('none'); 
  const [selectedServerId, setSelectedServerId] = useState<string>(staffId);
  const [orderSuccess, setOrderSuccess] = useState<{token?: string, table?: string} | null>(null);

  const { t } = useLanguage();
  const isWaiterMode = role === Role.STAFF;

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
      setStaffList(DataService.getStaffList().filter(s => s.role !== Role.KITCHEN));
      setOrders(DataService.getOrders());
      setBranch(DataService.getCurrentBranch());
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
          // Remove if exists (toggle)
          const exists = prev.find(m => m.group === group.name && m.option.label === option.label);
          if (exists) return prev.filter(m => m.option.label !== option.label);
          
          // Handle Single Select
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

  // --- Cart Logic ---
  const removeFromCart = (cartItemId: string) => {
      // Require Manager PIN for voiding items if total > 500 (Simulated rule)
      // OR always if in strict waiter mode
      const item = cart.find(c => c.cartItemId === cartItemId);
      const needsApproval = (item && (item.price * item.quantity) > 500) || false;

      if (needsApproval) {
          setPendingAction({ type: 'void', data: cartItemId });
          setManagerAuthOpen(true);
      } else {
          performVoid(cartItemId);
      }
  };

  const performVoid = (cartItemId: string) => {
      setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const subtotal = cart.reduce((sum, item) => {
      const modPrice = item.selectedModifiers?.reduce((mSum, m) => mSum + m.option.price, 0) || 0;
      return sum + ((item.price + modPrice) * item.quantity);
  }, 0);
  
  let discountAmount = 0;
  if (discountType === 'holiday') discountAmount = subtotal * 0.10;
  if (discountType === 'employee') discountAmount = subtotal * 0.20;

  const serviceCharge = subtotal * (branch?.serviceChargeRate || 0);
  const total = subtotal - discountAmount + serviceCharge + tipAmount;

  // --- Manager Auth ---
  const handleManagerAuth = () => {
      if (DataService.verifyManagerPin(managerPin)) {
          if (pendingAction?.type === 'void') performVoid(pendingAction.data);
          setManagerAuthOpen(false);
          setManagerPin('');
          setPendingAction(null);
      } else {
          alert("Invalid Manager PIN");
      }
  };

  // --- Payment & Order Creation ---
  const handlePayment = (method: PaymentMethod) => {
    createOrder(OrderStatus.PENDING, method);
    setPaymentModalOpen(false);
  };

  const handleHoldOrder = () => {
      createOrder(OrderStatus.HELD, PaymentMethod.CASH); // Method doesn't matter for hold
  };

  const createOrder = (status: OrderStatus, method: PaymentMethod) => {
    const isTakeaway = selectedTable === 'Takeaway';
    let token = undefined;
    if (isTakeaway && status !== OrderStatus.HELD) {
        token = DataService.issueToken().toString();
    }

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
      staffId: selectedServerId,
      tokenNumber: token,
      tip: tipAmount,
      discountApplied: discountType !== 'none' ? discountType : undefined,
      customerId: selectedCustomer?.id
    };

    DataService.createOrder(order, staffName);
    setCart([]);
    setTipAmount(0);
    setDiscountType('none');
    setSelectedTable('Takeaway');
    setSelectedCustomer(null);
    
    if (status !== OrderStatus.HELD) {
        setOrderSuccess({ token, table: !isTakeaway ? selectedTable : undefined });
        setTimeout(() => setOrderSuccess(null), 3000);
    }
  };

  const resumeOrder = (order: Order) => {
      setCart(order.items);
      setSelectedTable(order.tableId);
      setSelectedCustomer(DataService.getCustomers().find(c => c.id === order.customerId) || null);
      // Remove the held order from active list (technically we update it, but for UI flow we pull it to cart)
      DataService.updateOrderStatus(order.id, OrderStatus.PENDING, staffName); // Mark as processed/cancelled to avoid dupes or just delete in real app
  };

  // --- Customer CRM ---
  const handleCustomerSearch = () => {
      const res = DataService.findCustomerByPhone(customerSearch);
      if (res) setSelectedCustomer(res);
      else alert("Customer not found. Create new?");
  };

  const createCustomer = () => {
      const newC: Customer = {
          id: `cust-${Date.now()}`,
          name: newCustomerForm.name || 'Guest',
          phone: newCustomerForm.phone || '',
          lastOrderDate: 0,
          loyaltyPoints: 0,
          notes: newCustomerForm.notes
      };
      DataService.saveCustomer(newC);
      setSelectedCustomer(newC);
      setCustomerModalOpen(false);
  };

  // --- Filtering ---
  const visibleMenu = menu.filter(item => !item.archived);
  // Time availability filter
  const currentHour = new Date().getHours();
  const timeFilteredMenu = visibleMenu.filter(item => {
      if (!item.availableHours) return true;
      return currentHour >= item.availableHours.start && currentHour < item.availableHours.end;
  });

  const categories = ['All', ...Array.from(new Set(timeFilteredMenu.map(i => i.category)))];
  const filteredMenu = timeFilteredMenu.filter(item => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col md:flex-row h-full relative">
      {/* Mode Banner */}
      <div className="absolute top-0 right-0 bg-yellow-500 text-xs font-bold px-2 py-1 rounded-bl z-10 shadow">
          {isWaiterMode ? 'WAITER MODE' : 'TERMINAL MODE'} - {staffId}
      </div>

      {/* Success Overlay */}
      {orderSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fade-in">
              <div className="bg-white p-8 rounded-2xl shadow-2xl text-center transform animate-bounce-in">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Placed!</h2>
                  {orderSuccess.token && <div className="text-3xl font-mono font-bold text-slate-800">#{orderSuccess.token}</div>}
              </div>
          </div>
      )}

      {/* Left: Menu & Held Orders */}
      <div className="flex-1 p-4 flex flex-col bg-gray-100 overflow-hidden">
        <div className="flex gap-4 mb-4 mt-2">
            <button onClick={() => setTab('order')} className={`px-4 py-2 rounded font-bold ${tab === 'order' ? 'bg-slate-800 text-white' : 'bg-white'}`}>New Order</button>
            <button onClick={() => setTab('held')} className={`px-4 py-2 rounded font-bold ${tab === 'held' ? 'bg-slate-800 text-white' : 'bg-white'}`}>Held Orders</button>
        </div>

        {tab === 'order' ? (
            <>
                <div className="mb-4 space-y-3">
                <input 
                    type="text" 
                    placeholder={t.searchPlaceholder}
                    className="w-full p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-20 md:pb-0">
                {filteredMenu.map(item => (
                    <button
                    key={item.id}
                    onClick={() => openProductModal(item)}
                    disabled={item.stock === 0}
                    className={`p-4 rounded-xl shadow-sm flex flex-col justify-between min-h-[140px] text-left relative overflow-hidden ${
                        item.stock === 0 ? 'bg-gray-200 opacity-50' : 'bg-white hover:shadow-md'
                    }`}
                    >
                    {/* Low Stock Indicator */}
                    {item.stock > 0 && item.stock < 10 && (
                        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-bl font-bold">LOW STOCK</div>
                    )}
                    <div className="w-full">
                        <h3 className="font-bold text-slate-800 leading-tight text-lg mb-1">{item.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2 h-8">{item.description}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${item.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {item.stock} left
                        </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center w-full">
                        <span className="font-mono text-yellow-600 font-bold text-lg">{item.price}</span>
                    </div>
                    </button>
                ))}
                </div>
            </>
        ) : (
            <div className="overflow-y-auto">
                {orders.filter(o => o.status === OrderStatus.HELD).map(o => (
                    <div key={o.id} className="bg-white p-4 rounded shadow mb-2 flex justify-between items-center">
                        <div>
                            <span className="font-bold block">Table: {o.tableId}</span>
                            <span className="text-sm text-gray-500">{new Date(o.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded">{o.total} ETB</span>
                            <button onClick={() => resumeOrder(o)} className="bg-blue-600 text-white px-4 py-1 rounded font-bold">Resume</button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Right: Cart Sidebar */}
      <div className={`
          fixed inset-x-0 bottom-0 h-[40vh] z-20 md:static md:h-auto md:w-96 
          bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shadow-xl 
      `}>
        {/* Customer Bar */}
        <div className="bg-blue-50 p-2 flex justify-between items-center border-b border-blue-100">
            {selectedCustomer ? (
                <div className="flex-1">
                    <div className="text-xs font-bold text-blue-800">{selectedCustomer.name}</div>
                    <div className="text-xs text-blue-600">Points: {selectedCustomer.loyaltyPoints}</div>
                </div>
            ) : (
                <div className="text-xs text-gray-400 italic">Guest Customer</div>
            )}
            <button onClick={() => setCustomerModalOpen(true)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                {selectedCustomer ? 'Change' : 'Find Customer'}
            </button>
        </div>

        <div className="p-4 bg-slate-50 border-b">
          <select 
            className="w-full p-2 border rounded bg-white font-semibold"
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            <option value="Takeaway">{t.takeaway} (Token)</option>
            {tables.map(t => (
              <option key={t.id} value={t.id} disabled={t.status !== TableStatus.AVAILABLE}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            {cart.map(item => (
              <div key={item.cartItemId} className="flex justify-between items-start mb-4 border-b pb-2">
                <div>
                  <div className="font-bold text-slate-800">{item.name} <span className="text-xs text-gray-500">x{item.quantity}</span></div>
                  {item.selectedModifiers && item.selectedModifiers.map((m, i) => (
                      <div key={i} className="text-xs text-gray-500">+ {m.option.label} ({m.option.price})</div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                   <span className="font-mono font-bold">
                       {(item.price + (item.selectedModifiers?.reduce((s,m)=>s+m.option.price,0)||0)) * item.quantity}
                   </span>
                   <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-500 bg-red-50 w-6 h-6 rounded flex items-center justify-center">
                     x
                   </button>
                </div>
              </div>
            ))}
        </div>

        <div className="p-4 bg-slate-50 border-t space-y-2">
            <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{subtotal}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>Service Charge ({(branch?.serviceChargeRate || 0)*100}%)</span><span>{serviceCharge.toFixed(2)}</span></div>
            <div className="flex justify-between items-center mb-2 text-xl font-bold text-slate-800 pt-2 border-t">
                <span>{t.total}</span>
                <span>{total.toFixed(2)} ETB</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
                <button onClick={handleHoldOrder} className="bg-orange-100 text-orange-700 font-bold py-2 rounded text-sm">Hold</button>
                <button 
                    onClick={() => setSplitModalOpen(true)} 
                    className="bg-blue-100 text-blue-700 font-bold py-2 rounded text-sm"
                    disabled={cart.length === 0}
                >
                    Split
                </button>
                <button
                    onClick={() => cart.length > 0 && setPaymentModalOpen(true)}
                    disabled={cart.length === 0}
                    className={`bg-green-600 text-white font-bold py-2 rounded text-sm hover:bg-green-700 ${cart.length === 0 ? 'opacity-50' : ''}`}
                >
                    Pay
                </button>
            </div>
        </div>
      </div>

      {/* Product Modifier Modal */}
      {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="bg-yellow-500 p-4 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-white">{selectedProduct.name}</h2>
                      <button onClick={() => setSelectedProduct(null)} className="text-white font-bold text-xl">✕</button>
                  </div>
                  <div className="p-6">
                      {/* Modifiers */}
                      {selectedProduct.modifiers && selectedProduct.modifiers.map(group => (
                          <div key={group.name} className="mb-6">
                              <h3 className="font-bold text-slate-700 mb-2 uppercase text-sm">{group.name} {group.multiSelect && '(Select Multiple)'}</h3>
                              <div className="grid grid-cols-2 gap-2">
                                  {group.options.map(opt => {
                                      const isSelected = selectedModifiers.some(m => m.group === group.name && m.option.label === opt.label);
                                      return (
                                          <button
                                            key={opt.label}
                                            onClick={() => toggleModifier(group, opt)}
                                            className={`text-left p-2 rounded border text-sm ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200'}`}
                                          >
                                              {opt.label} <span className="opacity-70">+{opt.price}</span>
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}

                      <div className="flex items-center justify-between mt-8 pt-4 border-t">
                          <div className="flex items-center border rounded-lg">
                              <button onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))} className="px-4 py-2 text-xl font-bold">-</button>
                              <span className="px-4 py-2 font-bold">{productQuantity}</span>
                              <button onClick={() => setProductQuantity(productQuantity + 1)} className="px-4 py-2 text-xl font-bold">+</button>
                          </div>
                          <button onClick={addItemFromModal} className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold">
                              Add - {((selectedProduct.price + selectedModifiers.reduce((s,m)=>s+m.option.price,0)) * productQuantity)}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Manager PIN Modal */}
      {managerAuthOpen && (
          <div className="fixed inset-0 z-[60] bg-black bg-opacity-80 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg w-80 text-center">
                  <h3 className="font-bold text-red-600 mb-4">Manager Approval Required</h3>
                  <input 
                    type="password" 
                    className="text-center text-2xl border p-2 w-full mb-4 rounded" 
                    placeholder="Enter PIN"
                    autoFocus
                    value={managerPin}
                    onChange={e => setManagerPin(e.target.value)}
                  />
                  <div className="flex gap-2">
                      <button onClick={() => setManagerAuthOpen(false)} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
                      <button onClick={handleManagerAuth} className="flex-1 bg-red-600 text-white py-2 rounded">Authorize</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Finalize Payment</h3>
            <div className="space-y-2 mb-4">
                <div className="flex justify-between"><span>Total</span><span className="font-bold">{total.toFixed(2)}</span></div>
                <div><label>Tip</label><input type="number" className="border w-full p-1" value={tipAmount} onChange={e=>setTipAmount(Number(e.target.value))}/></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {Object.values(PaymentMethod).map(m => (
                    <button key={m} onClick={() => handlePayment(m)} className="bg-slate-100 py-3 rounded font-bold hover:bg-slate-200">{m}</button>
                ))}
            </div>
            <button onClick={() => setPaymentModalOpen(false)} className="w-full mt-4 text-red-500">Cancel</button>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {customerModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-xl w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">Customer CRM</h3>
                  <div className="flex gap-2 mb-6">
                      <input className="border p-2 flex-1 rounded" placeholder="Search Phone..." value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)}/>
                      <button onClick={handleCustomerSearch} className="bg-blue-600 text-white px-4 rounded">Search</button>
                  </div>
                  <hr className="mb-4"/>
                  <h4 className="font-bold text-sm mb-2">New Customer</h4>
                  <input className="border p-2 w-full mb-2 rounded" placeholder="Name" onChange={e=>setNewCustomerForm({...newCustomerForm, name: e.target.value})}/>
                  <input className="border p-2 w-full mb-2 rounded" placeholder="Phone" onChange={e=>setNewCustomerForm({...newCustomerForm, phone: e.target.value})}/>
                  <button onClick={createCustomer} className="w-full bg-green-600 text-white py-2 rounded font-bold">Create & Select</button>
                  <button onClick={()=>setCustomerModalOpen(false)} className="w-full mt-2 text-gray-500">Close</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default POS;
