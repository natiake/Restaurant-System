
import { MenuItem, Table, Staff, Role, TableStatus } from './types';

export const INITIAL_MENU: MenuItem[] = [
  { 
    id: 'm1', name: 'Ertb (Special)', price: 350, category: 'Main', stock: 50, 
    ingredients: ['Injera', 'Wot', 'Spices', 'Water'],
    description: 'Our house special. A delightful mix of spicy stews and fresh injera, perfect for sharing.'
  },
  { 
    id: 'm2', name: 'Doro Wat', price: 450, category: 'Main', stock: 20,
    description: 'Traditional chicken stew slowly simmered in a rich, spicy berbere sauce with hard-boiled eggs.'
  },
  { 
    id: 'm3', name: 'Special Kitfo', price: 400, category: 'Main', stock: 30,
    description: 'Freshly minced beef, marinated in mitmita and niter kibbeh. Served with gomen and ayib.'
  },
  { 
    id: 'm4', name: 'Shekla Tibs', price: 380, category: 'Main', stock: 40,
    description: 'Sizzling beef cubes served in a traditional clay pot with rosemary and peppers.'
  },
  { 
    id: 'm5', name: 'Derek Tibs', price: 360, category: 'Main', stock: 40,
    description: 'Crispy fried beef chunks seasoned with garlic and black pepper.'
  },
  { 
    id: 'm6', name: 'Shiro Tegamino', price: 180, category: 'Vegan', stock: 100,
    description: 'Smooth chickpea stew served bubbling hot in a clay pot.'
  },
  { 
    id: 'm7', name: 'Beyaynetu', price: 200, category: 'Vegan', stock: 80,
    description: 'A colorful platter of various vegan stews, lentils, and vegetables.'
  },
  { 
    id: 'm8', name: 'Quanta Firfir', price: 220, category: 'Breakfast', stock: 45,
    description: 'Dried beef jerky cooked with injera in a spicy sauce.'
  },
  { 
    id: 'm9', name: 'Chechebsa', price: 180, category: 'Breakfast', stock: 60,
    description: 'Fried flatbread pieces tossed with spiced butter and berbere, served with yogurt.'
  },
  { 
    id: 'm10', name: 'Genfo', price: 160, category: 'Breakfast', stock: 30,
    description: 'Thick barley porridge served with a well of spiced butter and berbere.'
  },
  { 
    id: 'm11', name: 'Bula', price: 150, category: 'Breakfast', stock: 25,
    description: 'Traditional porridge made from false banana plant, rich and comforting.'
  },
  { 
    id: 'm12', name: 'Dulet', price: 250, category: 'Breakfast', stock: 20,
    description: 'Finely chopped tripe, liver, and beef, sautéed with butter and spices.'
  },
  { 
    id: 'm13', name: 'Kik Alicha', price: 140, category: 'Vegan', stock: 90,
    description: 'Mild yellow split pea stew cooked with turmeric and garlic.'
  },
  { 
    id: 'm14', name: 'Misir Wat', price: 150, category: 'Vegan', stock: 90,
    description: 'Spicy red lentil stew.'
  },
  { 
    id: 'm15', name: 'Gomen', price: 120, category: 'Vegan', stock: 50,
    description: 'Collard greens sautéed with onions and garlic.'
  },
  { 
    id: 'm16', name: 'Ayib', price: 100, category: 'Side', stock: 40,
    description: 'Fresh homemade cottage cheese, mild and cooling.'
  },
  { 
    id: 'm17', name: 'Timatim Kurt', price: 90, category: 'Side', stock: 100,
    description: 'Fresh tomato salad with onions and jalapeños in a vinaigrette.'
  },
  { 
    id: 'm18', name: 'Ambo Water', price: 40, category: 'Drink', stock: 200,
    description: 'Sparkling mineral water.'
  },
  { 
    id: 'm19', name: 'Coffee (Jebena)', price: 25, category: 'Drink', stock: 500,
    description: 'Traditional Ethiopian coffee brewed in a clay pot.'
  },
  { 
    id: 'm20', name: 'Tea with Spice', price: 20, category: 'Drink', stock: 500,
    description: 'Black tea infused with cinnamon, cloves, and cardamom.'
  },
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 20 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `Table ${i + 1}`,
  status: TableStatus.AVAILABLE,
}));

export const INITIAL_STAFF: Staff[] = [
  // Admin
  { 
    id: 'EMP-100', name: 'Admin User', pin: '1234', role: Role.ADMIN, active: true,
    salary: 15000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  // Management
  { 
    id: 'EMP-200', name: 'Abebe (Manager)', pin: '9999', role: Role.MANAGER, active: true,
    salary: 12000, bonus: 1000, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  // Kitchen
  { 
    id: 'EMP-300', name: 'Kebede (Head Chef)', pin: '1111', role: Role.KITCHEN, active: true,
    salary: 8000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-301', name: 'Mulu (Cook)', pin: '1212', role: Role.KITCHEN, active: true,
    salary: 8500, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-302', name: 'Girma (Cook)', pin: '1313', role: Role.KITCHEN, active: true,
    salary: 8000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-303', name: 'Aster (Prep)', pin: '1414', role: Role.KITCHEN, active: true,
    salary: 7000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-304', name: 'Solomon (Dish)', pin: '1515', role: Role.KITCHEN, active: true,
    salary: 6000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  // Waiters / Staff
  { 
    id: 'EMP-400', name: 'Sara', pin: '0000', role: Role.STAFF, active: true,
    salary: 4000, bonus: 500, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-401', name: 'Chaltu', pin: '2222', role: Role.STAFF, active: true,
    salary: 4000, bonus: 200, deductions: 100, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-402', name: 'Hanna', pin: '3333', role: Role.STAFF, active: true,
    salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-403', name: 'Dawit', pin: '4444', role: Role.STAFF, active: true,
    salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-404', name: 'Tigist', pin: '5555', role: Role.STAFF, active: true,
    salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-405', name: 'Yared', pin: '6666', role: Role.STAFF, active: true,
    salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-406', name: 'Bethlehem', pin: '7777', role: Role.STAFF, active: true,
    salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  },
  { 
    id: 'EMP-407', name: 'Samuel', pin: '8888', role: Role.STAFF, active: true,
    salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: []
  }
];

export const TRANSLATIONS = {
  en: {
    welcome: 'Welcome',
    pos: 'POS',
    kitchen: 'Kitchen',
    tables: 'Tables',
    queue: 'Queue Display',
    stock: 'Stock',
    reviews: 'Reviews',
    admin: 'Admin Dashboard',
    manager: 'Manager Panel',
    staff: 'Staff Mgmt',
    tvMode: 'TV Menu',
    logout: 'Clock Out',
    searchPlaceholder: 'Search menu items...',
    orderType: 'Order Type',
    takeaway: 'Takeaway',
    payPrint: 'Pay & Print',
    total: 'Total',
    tip: 'Tip',
    discount: 'Discount',
    paymentMethod: 'Payment Method',
    cancel: 'Cancel',
    loginTitle: 'Staff Portal',
    invalidPin: 'Invalid PIN or Inactive Account',
    lockedOut: 'Too many attempts. Wait 1 min.',
    enterPin: 'Enter 4-digit PIN'
  },
  am: {
    welcome: 'እንኳን ደህና መጡ',
    pos: 'ሽያጭ መመዝገቢያ',
    kitchen: 'ማር ቤት',
    tables: 'ጠረጴዛዎች',
    queue: 'ተራ መጠበቂያ',
    stock: 'ክምችት',
    reviews: 'አስተያየቶች',
    admin: 'አስተዳደር',
    manager: 'አስተዳደር',
    staff: 'ሰራተኞች',
    tvMode: 'ዲጂታል ሜኑ',
    logout: 'ውጣ',
    searchPlaceholder: 'ምግብ ይፈልጉ...',
    orderType: 'የትዕዛዝ ዓይነት',
    takeaway: 'ፓኬጅ',
    payPrint: 'ክፍያ እና ደረሰኝ',
    total: 'ጠቅላላ',
    tip: 'ቲፕ',
    discount: 'ቅናሽ',
    paymentMethod: 'የክፍያ መንገድ',
    cancel: 'ሰርዝ',
    loginTitle: 'የሰራተኛ መግቢያ',
    invalidPin: 'የተሳሳተ ቁጥር',
    lockedOut: 'እባክዎ 1 ደቂቃ ይጠብቁ',
    enterPin: 'ሚስጥራዊ ቁጥር ያስገቡ'
  }
};
