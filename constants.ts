import { MenuItem, Table, Staff, Role } from './types';

export const INITIAL_MENU: MenuItem[] = [
  { id: 'm1', name: 'Ertb (Special)', price: 350, category: 'Main', stock: 50, ingredients: ['Injera', 'Wot', 'Spices', 'Water'] },
  { id: 'm2', name: 'Doro Wat', price: 450, category: 'Main', stock: 20 },
  { id: 'm3', name: 'Special Kitfo', price: 400, category: 'Main', stock: 30 },
  { id: 'm4', name: 'Shekla Tibs', price: 380, category: 'Main', stock: 40 },
  { id: 'm5', name: 'Derek Tibs', price: 360, category: 'Main', stock: 40 },
  { id: 'm6', name: 'Shiro Tegamino', price: 180, category: 'Vegan', stock: 100 },
  { id: 'm7', name: 'Beyaynetu', price: 200, category: 'Vegan', stock: 80 },
  { id: 'm8', name: 'Quanta Firfir', price: 220, category: 'Breakfast', stock: 45 },
  { id: 'm9', name: 'Chechebsa', price: 180, category: 'Breakfast', stock: 60 },
  { id: 'm10', name: 'Genfo', price: 160, category: 'Breakfast', stock: 30 },
  { id: 'm11', name: 'Bula', price: 150, category: 'Breakfast', stock: 25 },
  { id: 'm12', name: 'Dulet', price: 250, category: 'Breakfast', stock: 20 },
  { id: 'm13', name: 'Kik Alicha', price: 140, category: 'Vegan', stock: 90 },
  { id: 'm14', name: 'Misir Wat', price: 150, category: 'Vegan', stock: 90 },
  { id: 'm15', name: 'Gomen', price: 120, category: 'Vegan', stock: 50 },
  { id: 'm16', name: 'Ayib', price: 100, category: 'Side', stock: 40 },
  { id: 'm17', name: 'Timatim Kurt', price: 90, category: 'Side', stock: 100 },
  { id: 'm18', name: 'Ambo Water', price: 40, category: 'Drink', stock: 200 },
  { id: 'm19', name: 'Coffee (Jebena)', price: 25, category: 'Drink', stock: 500 },
  { id: 'm20', name: 'Tea with Spice', price: 20, category: 'Drink', stock: 500 },
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `Table ${i + 1}`,
  isOccupied: false,
}));

export const MOCK_STAFF: Staff[] = [
  { id: 's1', name: 'Admin User', pin: '1234', role: Role.ADMIN },
  { id: 's2', name: 'Abebe (Waiter)', pin: '0000', role: Role.STAFF },
  { id: 's3', name: 'Kebede (Cook)', pin: '1111', role: Role.KITCHEN },
];
