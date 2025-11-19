import { Order, MenuItem, Table, Staff, OrderStatus, QueueState, Review } from '../types';
import { INITIAL_MENU, INITIAL_TABLES, MOCK_STAFF } from '../constants';

// Keys for LocalStorage
const KEYS = {
  ORDERS: 'addis_orders',
  MENU: 'addis_menu',
  TABLES: 'addis_tables',
  QUEUE: 'addis_queue',
  REVIEWS: 'addis_reviews'
};

// Simple Event Bus to simulate Socket.IO
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
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(data));
    }
  }
}

export const socket = new EventEmitter();

// Data Service (Acting as the Backend Model Layer)
export const DataService = {
  initialize: () => {
    if (!localStorage.getItem(KEYS.MENU)) localStorage.setItem(KEYS.MENU, JSON.stringify(INITIAL_MENU));
    if (!localStorage.getItem(KEYS.TABLES)) localStorage.setItem(KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    if (!localStorage.getItem(KEYS.QUEUE)) localStorage.setItem(KEYS.QUEUE, JSON.stringify({ currentServing: 0, lastIssued: 0 }));
    if (!localStorage.getItem(KEYS.ORDERS)) localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
  },

  // --- Menu / Inventory ---
  getMenu: (): MenuItem[] => JSON.parse(localStorage.getItem(KEYS.MENU) || '[]'),
  
  updateStock: (itemId: string, quantityChange: number) => {
    const menu = DataService.getMenu();
    const item = menu.find(i => i.id === itemId);
    if (item) {
      item.stock = Math.max(0, item.stock + quantityChange);
      localStorage.setItem(KEYS.MENU, JSON.stringify(menu));
      socket.emit('inventory_update', menu);
    }
  },

  // --- Orders ---
  getOrders: (): Order[] => JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]'),

  createOrder: (order: Order) => {
    const orders = DataService.getOrders();
    orders.push(order);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    
    // Reduce stock
    order.items.forEach(item => {
      DataService.updateStock(item.id, -item.quantity);
    });

    // Update table if dine-in
    if (order.tableId !== 'Takeaway') {
      DataService.occupyTable(order.tableId, order.id);
    }

    socket.emit('new_order', order);
    socket.emit('queue_update', DataService.getQueue());
  },

  updateOrderStatus: (orderId: string, status: OrderStatus) => {
    const orders = DataService.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
      
      if (status === OrderStatus.SERVED && order.tableId !== 'Takeaway') {
        DataService.freeTable(order.tableId);
      }
      
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
    }
  },

  // --- Tables ---
  getTables: (): Table[] => JSON.parse(localStorage.getItem(KEYS.TABLES) || '[]'),

  occupyTable: (tableId: string, orderId: string) => {
    const tables = DataService.getTables();
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.isOccupied = true;
      table.occupiedSince = Date.now();
      table.currentOrderId = orderId;
      localStorage.setItem(KEYS.TABLES, JSON.stringify(tables));
      socket.emit('tables_update', tables);
    }
  },

  freeTable: (tableId: string) => {
    const tables = DataService.getTables();
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.isOccupied = false;
      table.occupiedSince = undefined;
      table.currentOrderId = undefined;
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
