
import { MenuItem, Table, Staff, Role, TableStatus } from './types';

export const INITIAL_MENU: MenuItem[] = [
  { 
    id: 'm1', name: 'Ertb (Special)', nameAm: 'እርጥብ (ስፔሻል)', price: 350, category: 'Main', stock: 50, 
    ingredients: ['Injera', 'Wot', 'Spices', 'Water'],
    description: 'Our house special. A delightful mix of spicy stews and fresh injera.',
    descriptionAm: 'የቤቱ ልዩ ትዕዛዝ። በቅመም የተሰሩ ወጦች እና ትኩስ እንጀራ ቅልቅል።'
  },
  { 
    id: 'm2', name: 'Doro Wat', nameAm: 'ዶሮ ወጥ', price: 450, category: 'Main', stock: 20,
    description: 'Traditional chicken stew slowly simmered in a rich, spicy berbere sauce.',
    descriptionAm: 'ባህላዊ የዶሮ ወጥ፣ በበርበሬ እና ቅመማ ቅመም የተብላላ።'
  },
  { 
    id: 'm3', name: 'Special Kitfo', nameAm: 'ስፔሻል ክትፎ', price: 400, category: 'Main', stock: 30,
    description: 'Freshly minced beef, marinated in mitmita and niter kibbeh.',
    descriptionAm: 'ትኩስ የተፈጨ ስጋ፣ በሚጥሚጣ እና በንጥር ቅቤ የተቀመመ።'
  },
  { 
    id: 'm4', name: 'Shekla Tibs', nameAm: 'ሸክላ ጥብስ', price: 380, category: 'Main', stock: 40,
    description: 'Sizzling beef cubes served in a traditional clay pot.',
    descriptionAm: 'በሸክላ ተለብለቦ የሚቀርብ፣ በሮዝመሪ የተቀመመ ስጋ።'
  },
  { 
    id: 'm5', name: 'Derek Tibs', nameAm: 'ደረቅ ጥብስ', price: 360, category: 'Main', stock: 40,
    description: 'Crispy fried beef chunks seasoned with garlic and black pepper.',
    descriptionAm: 'ደረቅ ያለ የተጠበሰ ስጋ፣ ነጭ ሽንኩርት እና ቁንዶ በርበሬ የገባበት።'
  },
  { 
    id: 'm6', name: 'Shiro Tegamino', nameAm: 'ሽሮ ተጋቢኖ', price: 180, category: 'Vegan', stock: 100,
    description: 'Smooth chickpea stew served bubbling hot in a clay pot.',
    descriptionAm: 'ተለብለቦ የሚቀርብ ወፍራም የሽሮ ወጥ።'
  },
  { 
    id: 'm7', name: 'Beyaynetu', nameAm: 'በያይነቱ', price: 200, category: 'Vegan', stock: 80,
    description: 'A colorful platter of various vegan stews, lentils, and vegetables.',
    descriptionAm: 'የጾም ወጦች ስብስብ - ምስር፣ ክክ፣ ጎመን እና ሌሎችም።'
  },
  { 
    id: 'm8', name: 'Quanta Firfir', nameAm: 'ቋንጣ ፍርፍር', price: 220, category: 'Breakfast', stock: 45,
    description: 'Dried beef jerky cooked with injera in a spicy sauce.',
    descriptionAm: 'በቋንጣ ስጋ እና እንጀራ የሚሰራ ባህላዊ ቁርስ።'
  },
  { 
    id: 'm9', name: 'Chechebsa', nameAm: 'ጨጨብሳ', price: 180, category: 'Breakfast', stock: 60,
    description: 'Fried flatbread pieces tossed with spiced butter and berbere.',
    descriptionAm: 'በንጥር ቅቤ እና በርበሬ የተለወሰ ቂጣ።'
  },
  { 
    id: 'm10', name: 'Genfo', nameAm: 'ገንፎ', price: 160, category: 'Breakfast', stock: 30,
    description: 'Thick barley porridge served with a well of spiced butter and berbere.',
    descriptionAm: 'የገብስ ገንፎ፣ ከቅቤ እና በርበሬ ጋር።'
  },
  { 
    id: 'm11', name: 'Bula', nameAm: 'ቡላ', price: 150, category: 'Breakfast', stock: 25,
    description: 'Traditional porridge made from false banana plant.',
    descriptionAm: 'ከእንሰት የሚሰራ ባህላዊ ቡላ።'
  },
  { 
    id: 'm12', name: 'Dulet', nameAm: 'ዱለት', price: 250, category: 'Breakfast', stock: 20,
    description: 'Finely chopped tripe, liver, and beef, sautéed with butter.',
    descriptionAm: 'የተከተፈ ጉበት፣ ማላ እና ስጋ በቅቤ የተጠበሰ።'
  },
  { 
    id: 'm13', name: 'Kik Alicha', nameAm: 'ክክ አልጫ', price: 140, category: 'Vegan', stock: 90,
    description: 'Mild yellow split pea stew cooked with turmeric.',
    descriptionAm: 'በሽንኩርት እና እርድ የሚሰራ የክክ ወጥ።'
  },
  { 
    id: 'm14', name: 'Misir Wat', nameAm: 'ምስር ወጥ', price: 150, category: 'Vegan', stock: 90,
    description: 'Spicy red lentil stew.',
    descriptionAm: 'ቀይ የምስር ወጥ።'
  },
  { 
    id: 'm15', name: 'Gomen', nameAm: 'ጎመን', price: 120, category: 'Vegan', stock: 50,
    description: 'Collard greens sautéed with onions and garlic.',
    descriptionAm: 'የተከተፈ ጎመን በሽንኩርት እና ዘይት።'
  },
  { 
    id: 'm16', name: 'Ayib', nameAm: 'አይብ', price: 100, category: 'Side', stock: 40,
    description: 'Fresh homemade cottage cheese.',
    descriptionAm: 'ትኩስ የሀገር ቤት አይብ።'
  },
  { 
    id: 'm17', name: 'Timatim Kurt', nameAm: 'ቲማቲም ቁርጥ', price: 90, category: 'Side', stock: 100,
    description: 'Fresh tomato salad with onions and jalapeños.',
    descriptionAm: 'የቲማቲም እና ሽንኩርት ሰላጣ።'
  },
  { 
    id: 'm18', name: 'Ambo Water', nameAm: 'አምቦ ውሃ', price: 40, category: 'Drink', stock: 200,
    description: 'Sparkling mineral water.',
    descriptionAm: 'ጋዝ ያለው የአምቦ ውሃ።'
  },
  { 
    id: 'm19', name: 'Coffee (Jebena)', nameAm: 'ጀበና ቡና', price: 25, category: 'Drink', stock: 500,
    description: 'Traditional Ethiopian coffee.',
    descriptionAm: 'በጀበና የፈላ ባህላዊ ቡና።'
  },
  { 
    id: 'm20', name: 'Tea with Spice', nameAm: 'ቅመም ሻይ', price: 20, category: 'Drink', stock: 500,
    description: 'Black tea infused with spices.',
    descriptionAm: 'በቅመም የፈላ ሻይ።'
  },
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 20 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `Table ${i + 1}`,
  status: TableStatus.AVAILABLE,
}));

export const INITIAL_STAFF: Staff[] = [
  // Admins and Managers now have username/password for the Admin Portal
  // REMOVED PIN '1234' for Admin to enforce strict credential login
  { id: 'EMP-100', name: 'Admin User', pin: '', username: 'admin', password: 'password', role: Role.ADMIN, active: true, salary: 15000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-200', name: 'Abebe (Manager)', pin: '9999', username: 'abebe', password: 'password', role: Role.MANAGER, active: true, salary: 12000, bonus: 1000, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-201', name: 'Store Keeper', pin: '5050', username: 'store', password: 'password', role: Role.STOREKEEPER, active: true, salary: 9000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  
  // Kitchen & Staff only have PINs for POS/KDS access
  { id: 'EMP-300', name: 'Kebede (Head Chef)', pin: '1111', role: Role.KITCHEN, active: true, salary: 8000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-301', name: 'Mulu (Cook)', pin: '1212', role: Role.KITCHEN, active: true, salary: 8500, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-302', name: 'Girma (Cook)', pin: '1313', role: Role.KITCHEN, active: true, salary: 8000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-303', name: 'Aster (Prep)', pin: '1414', role: Role.KITCHEN, active: true, salary: 7000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-304', name: 'Solomon (Dish)', pin: '1515', role: Role.KITCHEN, active: true, salary: 6000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-400', name: 'Sara', pin: '0000', role: Role.STAFF, active: true, salary: 4000, bonus: 500, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-401', name: 'Chaltu', pin: '2222', role: Role.STAFF, active: true, salary: 4000, bonus: 200, deductions: 100, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-402', name: 'Hanna', pin: '3333', role: Role.STAFF, active: true, salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-403', name: 'Dawit', pin: '4444', role: Role.STAFF, active: true, salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-404', name: 'Tigist', pin: '5555', role: Role.STAFF, active: true, salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-405', name: 'Yared', pin: '6666', role: Role.STAFF, active: true, salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-406', name: 'Bethlehem', pin: '7777', role: Role.STAFF, active: true, salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] },
  { id: 'EMP-407', name: 'Samuel', pin: '8888', role: Role.STAFF, active: true, salary: 4000, bonus: 0, deductions: 0, totalTips: 0, monthlyTips: 0, attendance: [], reviews: [] }
];

export const TRANSLATIONS = {
  en: {
    welcome: 'Welcome',
    pos: 'POS Terminal',
    kitchen: 'Kitchen Display',
    tables: 'Table Management',
    queue: 'Queue Status',
    stock: 'Inventory & Stock',
    reviews: 'Feedback',
    admin: 'Admin Dashboard',
    manager: 'Manager Panel',
    staff: 'Staff & Payroll',
    tvMode: 'Menu Board',
    logout: 'Clock Out',
    searchPlaceholder: 'Search items...',
    orderType: 'Order Type',
    takeaway: 'Takeaway',
    payPrint: 'Pay & Print',
    total: 'Total',
    tip: 'Tip',
    discount: 'Discount',
    paymentMethod: 'Payment Method',
    cancel: 'Cancel',
    loginTitle: 'POS Access (Staff)',
    loginAdminTitle: 'Admin / Back Office',
    invalidPin: 'Invalid PIN or Inactive Account',
    invalidCreds: 'Invalid Username or Password',
    lockedOut: 'System Locked. Wait 1 min.',
    enterPin: 'Enter PIN',
    username: 'Username',
    password: 'Password',
    loginAsAdmin: 'Admin Login',
    loginAsPos: 'Back to POS Login',
    resumeWork: 'Resume Work',
    takeBreak: 'Take Break',
    splitBill: 'Split Bill',
    holdOrder: 'Hold Order',
    newOrder: 'New Order',
    heldOrders: 'Held Orders',
    lowStock: 'LOW STOCK',
    outOfStock: 'OUT OF STOCK',
    customerName: 'Customer',
    findCustomer: 'Find',
    guest: 'Guest',
    managerApproval: 'Manager Approval Required',
    authorize: 'Authorize',
    subtotal: 'Subtotal',
    serviceCharge: 'Service Charge',
    items: 'Items',
    quantity: 'Qty',
    price: 'Price',
    addToCart: 'Add to Cart',
    modifiers: 'Modifiers',
    notes: 'Kitchen Notes',
    confirmSplit: 'Confirm Split',
    moveLeft: 'Move Left',
    moveRight: 'Move Right',
    originalCheck: 'Original Check',
    newCheck: 'New Check',
    close: 'Close',
    paymentTrends: 'Payment Trends',
    topItems: 'Top Items',
    salesBreakdown: 'Sales Breakdown',
    exportJson: 'Export JSON',
    restoreData: 'Restore Data',
    selectBranch: 'Select Branch',
    allCategories: 'All'
  },
  am: {
    welcome: 'እንኳን ደህና መጡ',
    pos: 'ሽያጭ መመዝገቢያ',
    kitchen: 'የወጥ ቤት ትዕዛዝ',
    tables: 'የጠረጴዛ አስተዳደር',
    queue: 'የተራ ሁኔታ',
    stock: 'ክምችት እና ዕቃ',
    reviews: 'አስተያየት',
    admin: 'ዋና አስተዳደር',
    manager: 'አስተዳደር',
    staff: 'ሰራተኞች እና ደሞዝ',
    tvMode: 'ዲጂታል ሜኑ',
    logout: 'ውጣ / ጨርስ',
    searchPlaceholder: 'ምግብ ይፈልጉ...',
    orderType: 'የትዕዛዝ ዓይነት',
    takeaway: 'ፓኬጅ',
    payPrint: 'ክፍያ ፈጽም',
    total: 'ጠቅላላ',
    tip: 'ቲፕ',
    discount: 'ቅናሽ',
    paymentMethod: 'የክፍያ መንገድ',
    cancel: 'ሰርዝ',
    loginTitle: 'የሰራተኛ መግቢያ (POS)',
    loginAdminTitle: 'አስተዳደር መግቢያ',
    invalidPin: 'የተሳሳተ ቁጥር ወይም ያልነቃ መለያ',
    invalidCreds: 'የተሳሳተ ስም ወይም የይለፍ ቃል',
    lockedOut: 'ሲስተሙ ተቆልፏል። 1 ደቂቃ ይጠብቁ።',
    enterPin: 'ሚስጥራዊ ቁጥር ያስገቡ',
    username: 'መለያ ስም',
    password: 'የይለፍ ቃል',
    loginAsAdmin: 'እንደ አስተዳዳሪ ይግቡ',
    loginAsPos: 'ወደ ሽያጭ መመለሻ',
    resumeWork: 'ስራ ቀጥል',
    takeBreak: 'እረፍት ውጣ',
    splitBill: 'ሂሳብ ክፈል',
    holdOrder: 'ትዕዛዝ ያዝ',
    newOrder: 'አዲስ ትዕዛዝ',
    heldOrders: 'የተያዙ ትዕዛዞች',
    lowStock: 'እያለቀ ነው',
    outOfStock: 'ከምግብ ዝርዝር ጠፍቷል',
    customerName: 'ደንበኛ',
    findCustomer: 'ፈልግ',
    guest: 'እንግዳ',
    managerApproval: 'የአስተዳዳሪ ፈቃድ ያስፈልጋል',
    authorize: 'ፈቀደ',
    subtotal: 'ድምር',
    serviceCharge: 'ሰርቪስ ቻርጅ',
    items: 'ምግቦች',
    quantity: 'ብዛት',
    price: 'ዋጋ',
    addToCart: 'ዘርዝር ውስጥ አስገባ',
    modifiers: 'ተጨማሪ አማራጮች',
    notes: 'ለወጥ ቤት ማስታወሻ',
    confirmSplit: 'ክፍፍሉን አረጋግጥ',
    moveLeft: 'ወደ ግራ መልስ',
    moveRight: 'ወደ ቀኝ ውሰድ',
    originalCheck: 'ዋናው ሂሳብ',
    newCheck: 'አዲሱ ሂሳብ',
    close: 'ዝጋ',
    paymentTrends: 'የክፍያ ሁኔታዎች',
    topItems: 'በጣም የተሸጡ',
    salesBreakdown: 'የሽያጭ ዝርዝር',
    exportJson: 'መረጃ አስቀምጥ (Export)',
    restoreData: 'መረጃ መልስ (Restore)',
    selectBranch: 'ቅርንጫፍ ይምረጡ',
    allCategories: 'ሁሉም'
  }
};
