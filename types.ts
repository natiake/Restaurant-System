
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
  SERVED = 'Served',
  HELD = 'Held' // For Hold Order feature
}

export enum TableStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  RESERVED = 'Reserved',
  CLEANING = 'Cleaning'
}

export enum Role {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  STAFF = 'Staff', // Waiter
  KITCHEN = 'Kitchen',
  CASHIER = 'Cashier'
}

export interface ModifierOption {
  label: string;
  price: number;
}

export interface ModifierGroup {
  name: string; // e.g., "Spiciness", "Add-ons"
  options: ModifierOption[];
  required?: boolean;
  multiSelect?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Main' | 'Breakfast' | 'Vegan' | 'Drink' | 'Side';
  stock: number;
  ingredients?: string[];
  description?: string;
  archived?: boolean;
  modifiers?: ModifierGroup[]; // New: Customization
  availableHours?: { start: number; end: number }; // New: Time-based menu
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedModifiers?: { group: string; option: ModifierOption }[];
  cartItemId: string; // Unique ID for splitting
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  lastOrderDate: number;
  loyaltyPoints: number;
  notes?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  serviceChargeRate: number; // e.g., 0.05 for 5%
}

export interface Order {
  id: string;
  branchId: string; // Multi-branch support
  tableId: string | 'Takeaway';
  items: CartItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  timestamp: number;
  staffId: string;
  customerId?: string; // CRM Link
  tokenNumber?: string;
  tip?: number;
  discountApplied?: string;
  discountAmount?: number;
}

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  occupiedSince?: number;
  currentOrderId?: string;
  assignedStaffId?: string;
}

export interface AttendanceRecord {
  id: string;
  type: 'IN' | 'OUT' | 'BREAK_START' | 'BREAK_END';
  timestamp: number;
}

export interface ManagerReview {
  id: string;
  managerId: string;
  rating: number;
  comment: string;
  timestamp: number;
}

export interface Staff {
  id: string;
  name: string;
  pin: string;
  role: Role;
  active: boolean;
  phone?: string;
  email?: string;
  currentSessionId?: string; // Concurrent login tracking
  isOnBreak?: boolean;
  
  salary: number;
  bonus: number;
  deductions: number;
  totalTips: number;
  monthlyTips: number;
  
  attendance: AttendanceRecord[];
  reviews: ManagerReview[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  staffId: string;
  timestamp: number;
  type: 'CUSTOMER' | 'MANAGER';
}

export interface QueueState {
  currentServing: number;
  lastIssued: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  staffName: string;
  timestamp: number;
}

export type Language = 'en' | 'am';
