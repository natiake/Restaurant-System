
import { Order, MenuItem, Table, Staff, OrderStatus, QueueState, Review, AuditLog, TableStatus, AttendanceRecord, ManagerReview, Customer, Branch } from '../types';
import { INITIAL_MENU, INITIAL_TABLES, INITIAL_STAFF } from '../constants';

// Keys
const KEYS = {
  ORDERS: 'addis_orders',
  MENU: 'addis_menu',
  TABLES: 'addis_tables',
  QUEUE: 'addis_queue',
  REVIEWS: 'addis_reviews',
  LOGS: 'addis_logs',
  LANG: 'addis_lang',
  STAFF: 'addis_staff',
  CUSTOMERS: 'addis_customers',
  BRANCHES: 'addis_branches',
  SYNC_QUEUE: 'addis_sync_queue',
  CURRENT_BRANCH: 'addis_curr_branch'
};

class EventEmitter {
  private listeners: { [key: string]: Function[] } = {};
  on(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
    return () => this.off(event, fn);
  }
  off(event: string, fn: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== fn);
  }
  emit(event: string, data?: any) {
    if (this.listeners[event]) this.listeners[event].forEach(fn => fn(data));
  }
}

export const socket = new EventEmitter();

export const DataService = {
  isOnline: true, // Runtime flag

  initialize: () => {
    if (!localStorage.getItem(KEYS.MENU)) localStorage.setItem(KEYS.MENU, JSON.stringify(INITIAL_MENU));
    if (!localStorage.getItem(KEYS.TABLES)) localStorage.setItem(KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    if (!localStorage.getItem(KEYS.QUEUE)) localStorage.setItem(KEYS.QUEUE, JSON.stringify({ currentServing: 0, lastIssued: 0 }));
    if (!localStorage.getItem(KEYS.ORDERS)) localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.LOGS)) localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.LANG)) localStorage.setItem(KEYS.LANG, 'en');
    if (!localStorage.getItem(KEYS.STAFF)) localStorage.setItem(KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
    
    // Init Branches
    if (!localStorage.getItem(KEYS.BRANCHES)) {
        const branches: Branch[] = [
            { id: 'b1', name: 'Main Branch (Bole)', location: 'Bole', serviceChargeRate: 0.10 },
            { id: 'b2', name: 'Piassa Branch', location: 'Piassa', serviceChargeRate: 0.05 }
        ];
        localStorage.setItem(KEYS.BRANCHES, JSON.stringify(branches));
    }
    
    // Init Customers
    if (!localStorage.getItem(KEYS.CUSTOMERS)) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));

    // Connection Listener
    window.addEventListener('online', () => DataService.handleConnectionChange(true));
    window.addEventListener('offline', () => DataService.handleConnectionChange(false));
    DataService.isOnline = navigator.onLine;
  },

  handleConnectionChange: (status: boolean) => {
      DataService.isOnline = status;
      socket.emit('connection_change', status);
      if (status) {
          DataService.processSyncQueue();
      }
  },

  // --- Offline Sync Engine ---
  addToSyncQueue: (action: string, payload: any) => {
      if (DataService.isOnline) return; // In a real app, we might always queue then sync
      const queue = JSON.parse(localStorage.getItem(KEYS.SYNC_QUEUE) || '[]');
      queue.push({ id: Date.now(), action, payload });
      localStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
  },

  processSyncQueue: () => {
      const queue = JSON.parse(localStorage.getItem(KEYS.SYNC_QUEUE) || '[]');
      if (queue.length === 0) return;
      console.log(`[Sync] Processing ${queue.length} offline items...`);
      // Simulate API calls
      setTimeout(() => {
          localStorage.setItem(KEYS.SYNC_QUEUE, '[]');
          console.log("[Sync] Complete");
      }, 2000);
  },

  // --- Branch Context ---
  getBranches: (): Branch[] => JSON.parse(localStorage.getItem(KEYS.BRANCHES) || '[]'),
  getCurrentBranch: (): Branch | null => {
      const id = localStorage.getItem(KEYS.CURRENT_BRANCH);
      const branches = DataService.getBranches();
      return branches.find(b => b.id === id) || branches[0];
  },
  setBranch: (id: string) => localStorage.setItem(KEYS.CURRENT_BRANCH, id),

  // --- System & Language ---
  getLanguage: (): 'en' | 'am' => (localStorage.getItem(KEYS.LANG) as 'en' | 'am') || 'en',
  setLanguage: (lang: 'en' | 'am') => {
    localStorage.setItem(KEYS.LANG, lang);
  },

  // --- Logging ---
  logAction: (staffName: string, action: string, details: string) => {
    const logs: AuditLog[] = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
    const newLog: AuditLog = {
      id: Date.now().toString(),
      staffName,
      action,
      details,
      timestamp: Date.now()
    };
    if (logs.length > 1000) logs.shift();
    logs.push(newLog);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },

  getLogs: (): AuditLog[] => JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]').reverse(),

  // --- CRM (Customers) ---
  getCustomers: (): Customer[] => JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]'),
  
  saveCustomer: (customer: Customer) => {
      const customers = DataService.getCustomers();
      const idx = customers.findIndex(c => c.id === customer.id);
      if (idx !== -1) customers[idx] = customer;
      else customers.push(customer);
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
      DataService.addToSyncQueue('UPDATE_CUSTOMER', customer);
  },

  findCustomerByPhone: (phone: string): Customer | undefined => {
      return DataService.getCustomers().find(c => c.phone.includes(phone));
  },

  // --- Staff Management ---
  getStaffList: (): Staff[] => JSON.parse(localStorage.getItem(KEYS.STAFF) || '[]'),
  
  saveStaffList: (staff: Staff[]) => {
    localStorage.setItem(KEYS.STAFF, JSON.stringify(staff));
    socket.emit('staff_update', staff);
  },

  verifyPin: (pin: string): Staff | undefined => {
    const staff = DataService.getStaffList();
    return staff.find(s => s.pin === pin && s.active);
  },

  verifyManagerPin: (pin: string): boolean => {
      const staff = DataService.getStaffList();
      const manager = staff.find(s => s.pin === pin && (s.role === 'Admin' || s.role === 'Manager') && s.active);
      return !!manager;
  },

  clockIn: (staffId: string) => {
    const staffList = DataService.getStaffList();
    const member = staffList.find(s => s.id === staffId);
    if (member) {
      member.currentSessionId = `sess_${Date.now()}`; // Concurrent session tracking
      
      const today = new Date().setHours(0,0,0,0);
      const lastRecord = member.attendance[member.attendance.length - 1];
      
      // Only clock in if not already in today or was clocked out
      if (!lastRecord || lastRecord.type === 'OUT' || lastRecord.timestamp < today) {
         const record: AttendanceRecord = { id: Date.now().toString(), type: 'IN', timestamp: Date.now() };
         member.attendance.push(record);
         DataService.saveStaffList(staffList);
      }
    }
  },

  toggleBreak: (staffId: string) => {
      const staffList = DataService.getStaffList();
      const member = staffList.find(s => s.id === staffId);
      if (member) {
          const type = member.isOnBreak ? 'BREAK_END' : 'BREAK_START';
          member.isOnBreak = !member.isOnBreak;
          member.attendance.push({ id: Date.now().toString(), type, timestamp: Date.now() });
          DataService.saveStaffList(staffList);
          DataService.logAction(member.name, 'Break', member.isOnBreak ? 'Started Break' : 'Ended Break');
      }
  },

  clockOut: (staffId: string) => {
    const staffList = DataService.getStaffList();
    const member = staffList.find(s => s.id === staffId);
    if (member) {
      const record: AttendanceRecord = { id: Date.now().toString(), type: 'OUT', timestamp: Date.now() };
      member.attendance.push(record);
      member.currentSessionId = undefined;
      member.isOnBreak = false;
      DataService.saveStaffList(staffList);
      DataService.logAction(member.name, 'Clock Out', 'Ended shift');
    }
  },

  updateStaffMember: (updatedMember: Staff) => {
    const staffList = DataService.getStaffList();
    const index = staffList.findIndex(s => s.id === updatedMember.id);
    if (index !== -1) {
      staffList[index] = updatedMember;
      DataService.saveStaffList(staffList);
    }
  },

  addStaffMember: (newMember: Staff) => {
    const staffList = DataService.getStaffList();
    staffList.push(newMember);
    DataService.saveStaffList(staffList);
    DataService.logAction('Admin', 'HR', `Added new staff: ${newMember.name}`);
  },

  addManagerReview: (staffId: string, review: ManagerReview) => {
      const staffList = DataService.getStaffList();
      const member = staffList.find(s => s.id === staffId);
      if (member) {
          member.reviews.push(review);
          DataService.saveStaffList(staffList);
      }
  },

  reassignOrdersAndDeactivate: (oldStaffId: string, newStaffId: string | null, adminName: string) => {
      const staffList = DataService.getStaffList();
      const oldStaff = staffList.find(s => s.id === oldStaffId);
      
      if (!oldStaff) return;

      // 1. Reassign Active Orders
      if (newStaffId) {
          const orders = DataService.getOrders();
          let reassignCount = 0;
          orders.forEach(o => {
              if (o.staffId === oldStaffId && o.status !== OrderStatus.SERVED) {
                  o.staffId = newStaffId;
                  reassignCount++;
              }
          });
          localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
          DataService.logAction(adminName, 'Staff Reassignment', `Moved ${reassignCount} orders from ${oldStaff.name} to new staff`);
      }

      // Reassign or Unassign Tables
      const tables = DataService.getTables();
      tables.forEach(t => {
          if (t.assignedStaffId === oldStaffId) {
              t.assignedStaffId = newStaffId || undefined;
          }
      });
      localStorage.setItem(KEYS.TABLES, JSON.stringify(tables));
      socket.emit('tables_update', tables);

      // 2. Deactivate
      oldStaff.active = false;
      DataService.saveStaffList(staffList);
      DataService.logAction(adminName, 'Staff Deactivation', `Deactivated account for ${oldStaff.name}`);
  },

  // --- Backup/Restore ---
  exportData: () => {
    const data = {
      menu: DataService.getMenu(),
      orders: DataService.getOrders(),
      tables: DataService.getTables(),
      logs: DataService.getLogs(),
      queue: DataService.getQueue(),
      staff: DataService.getStaffList(),
      reviews: DataService.getReviews(),
      customers: DataService.getCustomers(),
      timestamp: Date.now()
    };
    return JSON.stringify(data);
  },

  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.menu) localStorage.setItem(KEYS.MENU, JSON.stringify(data.menu));
      if (data.orders) localStorage.setItem(KEYS.ORDERS, JSON.stringify(data.orders));
      if (data.tables) localStorage.setItem(KEYS.TABLES, JSON.stringify(data.tables));
      if (data.logs) localStorage.setItem(KEYS.LOGS, JSON.stringify(data.logs));
      if (data.queue) localStorage.setItem(KEYS.QUEUE, JSON.stringify(data.queue));
      if (data.staff) localStorage.setItem(KEYS.STAFF, JSON.stringify(data.staff));
      if (data.reviews) localStorage.setItem(KEYS.REVIEWS, JSON.stringify(data.reviews));
      if (data.customers) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(data.customers));
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  },

  // --- Audio ---
  playBeep: () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(1760, ctx.currentTime);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 1);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  },

  // --- Menu / Inventory ---
  getMenu: (): MenuItem[] => JSON.parse(localStorage.getItem(KEYS.MENU) || '[]'),
  
  saveMenu: (menu: MenuItem[]) => {
    localStorage.setItem(KEYS.MENU, JSON.stringify(menu));
    socket.emit('inventory_update', menu);
    DataService.addToSyncQueue('UPDATE_MENU', menu);
  },

  addMenuItem: (item: MenuItem, staffName: string) => {
      const menu = DataService.getMenu();
      menu.push(item);
      DataService.saveMenu(menu);
      DataService.logAction(staffName, 'Menu Add', `Added item: ${item.name}`);
  },

  updateMenuItem: (item: MenuItem, staffName: string) => {
      const menu = DataService.getMenu();
      const idx = menu.findIndex(m => m.id === item.id);
      if (idx !== -1) {
          menu[idx] = item;
          DataService.saveMenu(menu);
          DataService.logAction(staffName, 'Menu Edit', `Updated item: ${item.name}`);
      }
  },

  archiveMenuItem: (id: string, staffName: string) => {
      const menu = DataService.getMenu();
      const item = menu.find(m => m.id === id);
      if (item) {
          item.archived = !item.archived;
          DataService.saveMenu(menu);
          DataService.logAction(staffName, 'Menu Archive', `${item.archived ? 'Archived' : 'Restored'} item: ${item.name}`);
      }
  },

  updateStock: (itemId: string, quantityChange: number) => {
    const menu = DataService.getMenu();
    const item = menu.find(i => i.id === itemId);
    if (item) {
      item.stock = Math.max(0, item.stock + quantityChange);
      DataService.saveMenu(menu);
    }
  },

  // --- Orders ---
  getOrders: (): Order[] => JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]'),

  createOrder: (order: Order, staffName: string) => {
    const orders = DataService.getOrders();
    orders.push(order);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    DataService.addToSyncQueue('CREATE_ORDER', order);
    
    // Reduce stock
    order.items.forEach(item => {
      DataService.updateStock(item.id, -item.quantity);
    });

    // Add Tip to Staff
    if (order.tip && order.tip > 0 && order.staffId) {
        const staffList = DataService.getStaffList();
        const staffMember = staffList.find(s => s.id === order.staffId);
        if (staffMember) {
            staffMember.totalTips += order.tip;
            staffMember.monthlyTips += order.tip;
            DataService.saveStaffList(staffList);
        }
    }
    
    // Loyalty Points
    if (order.customerId) {
        const customers = DataService.getCustomers();
        const cust = customers.find(c => c.id === order.customerId);
        if (cust) {
            cust.lastOrderDate = Date.now();
            cust.loyaltyPoints += Math.floor(order.total / 100); // 1 point per 100 ETB
            DataService.saveCustomer(cust);
        }
    }

    // Update table if dine-in
    if (order.tableId !== 'Takeaway') {
      DataService.updateTableStatus(order.tableId, TableStatus.OCCUPIED, order.id);
    }

    DataService.logAction(staffName, 'Create Order', `Order #${order.id} created. Total: ${order.total}`);
    socket.emit('new_order', order);
    socket.emit('queue_update', DataService.getQueue());
  },

  updateOrderStatus: (orderId: string, status: OrderStatus, staffName: string) => {
    const orders = DataService.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const oldStatus = order.status;
      order.status = status;
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
      DataService.addToSyncQueue('UPDATE_ORDER_STATUS', { orderId, status });
      
      DataService.logAction(staffName, 'Update Status', `Order #${order.id} ${oldStatus} -> ${status}`);
      socket.emit('order_update', order);
    }
  },

  // --- Queue ---
  getQueue: (): QueueState => JSON.parse(localStorage.getItem(KEYS.QUEUE) || '{"currentServing":0,"lastIssued":0}'),

  issueToken: (): number => {
    const q = DataService.getQueue();
    q.lastIssued += 1;
    localStorage.setItem(KEYS.QUEUE, JSON.stringify(q));
    socket.emit('queue_update', q);
    return q.lastIssued;
  },

  nextQueue: () => {
    const q = DataService.getQueue();
    if (q.currentServing < q.lastIssued) {
      q.currentServing += 1;
      localStorage.setItem(KEYS.QUEUE, JSON.stringify(q));
      socket.emit('queue_update', q);
      DataService.playBeep();
    }
  },

  // --- Tables ---
  getTables: (): Table[] => JSON.parse(localStorage.getItem(KEYS.TABLES) || '[]'),

  updateTableStatus: (tableId: string, status: TableStatus, orderId?: string) => {
    const tables = DataService.getTables();
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.status = status;
      if (status === TableStatus.OCCUPIED && orderId) {
        table.occupiedSince = Date.now();
        table.currentOrderId = orderId;
      } else if (status === TableStatus.AVAILABLE) {
        table.occupiedSince = undefined;
        table.currentOrderId = undefined;
      }
      localStorage.setItem(KEYS.TABLES, JSON.stringify(tables));
      socket.emit('tables_update', tables);
    }
  },

  assignTable: (tableId: string, staffId: string | undefined) => {
    const tables = DataService.getTables();
    const table = tables.find(t => t.id === tableId);
    if (table) {
        table.assignedStaffId = staffId;
        localStorage.setItem(KEYS.TABLES, JSON.stringify(tables));
        socket.emit('tables_update', tables);
    }
  },
  
  // --- Reviews ---
  addReview: (review: Review) => {
    const reviews: Review[] = JSON.parse(localStorage.getItem(KEYS.REVIEWS) || '[]');
    reviews.push(review);
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
  },

  getReviews: (): Review[] => JSON.parse(localStorage.getItem(KEYS.REVIEWS) || '[]'),
};
