export interface InventoryItem {
  id: string;
  name: string;
  category: 'Produce' | 'Meat' | 'Dairy' | 'Dry Goods' | 'Beverages';
  quantity: number;
  unit: 'lb' | 'oz' | 'case' | 'each' | 'gallon';
  parLevel: number;
  costPerUnit: number;
}

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Romaine Lettuce',
    category: 'Produce',
    quantity: 15,
    unit: 'each',
    parLevel: 20,
    costPerUnit: 2.50
  },
  {
    id: '2',
    name: 'Chicken Breast',
    category: 'Meat',
    quantity: 30,
    unit: 'lb',
    parLevel: 50,
    costPerUnit: 4.99
  },
  {
    id: '3',
    name: 'Whole Milk',
    category: 'Dairy',
    quantity: 8,
    unit: 'gallon',
    parLevel: 10,
    costPerUnit: 3.99
  },
  {
    id: '4',
    name: 'All-Purpose Flour',
    category: 'Dry Goods',
    quantity: 45,
    unit: 'lb',
    parLevel: 40,
    costPerUnit: 0.89
  },
  {
    id: '5',
    name: 'Tomatoes',
    category: 'Produce',
    quantity: 12,
    unit: 'lb',
    parLevel: 25,
    costPerUnit: 1.99
  },
  {
    id: '6',
    name: 'Ground Beef',
    category: 'Meat',
    quantity: 18,
    unit: 'lb',
    parLevel: 30,
    costPerUnit: 5.49
  },
  {
    id: '7',
    name: 'Cheddar Cheese',
    category: 'Dairy',
    quantity: 8,
    unit: 'lb',
    parLevel: 15,
    costPerUnit: 6.99
  },
  {
    id: '8',
    name: 'Olive Oil',
    category: 'Dry Goods',
    quantity: 22,
    unit: 'gallon',
    parLevel: 20,
    costPerUnit: 24.99
  },
  {
    id: '9',
    name: 'Orange Juice',
    category: 'Beverages',
    quantity: 5,
    unit: 'gallon',
    parLevel: 12,
    costPerUnit: 7.99
  },
  {
    id: '10',
    name: 'Coffee Beans',
    category: 'Beverages',
    quantity: 10,
    unit: 'lb',
    parLevel: 15,
    costPerUnit: 12.99
  }
];

export const calculateTotalValue = (items: InventoryItem[]) => {
  return items.reduce((total, item) => total + (item.quantity * item.costPerUnit), 0);
};

export const getLowStockItems = (items: InventoryItem[]) => {
  return items.filter(item => item.quantity <= item.parLevel);
};
