export enum PaymentMethod {
  CASH = 'Cash',
  TELEBIRR = 'Telebirr',
  AMOLE = 'Amole',
  CBE_BIRR = 'CBE Birr'
}

export enum OrderStatus {
  PENDING = 'Pending',
  COOKING = 'Cooking',
  READY = 'Ready',
  SERVED = 'Served'
}

export enum Role {
  ADMIN = 'Admin',
  STAFF = 'Staff',
  KITCHEN = 'Kitchen'
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Main' | 'Breakfast' | 'Vegan' | 'Drink' | 'Side';
  stock: number;
  ingredients?: string[]; // Simple list for prototype
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  tableId: string | 'Takeaway';
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  timestamp: number;
  staffId: string;
  tokenNumber?: string;
}

export interface Table {
  id: string;
  name: string;
  isOccupied: boolean;
  occupiedSince?: number;
  currentOrderId?: string;
}

export interface Staff {
  id: string;
  name: string;
  pin: string;
  role: Role;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  staffId: string;
  timestamp: number;
}

export interface QueueState {
  currentServing: number;
  lastIssued: number;
}