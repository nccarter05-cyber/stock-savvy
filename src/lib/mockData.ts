export interface InventoryItem {
  id: string;
  name: string;
  category: 'Produce' | 'Meat' | 'Dairy' | 'Dry Goods' | 'Beverages';
  quantity: number;
  unit: 'lb' | 'oz' | 'case' | 'each' | 'gallon';
  parLevel: number;
  costPerUnit: number;
  lastShipmentDate: string;
  lastShipmentQuantity: number;
  supplier: string;
}

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Romaine Lettuce',
    category: 'Produce',
    quantity: 15,
    unit: 'each',
    parLevel: 20,
    costPerUnit: 2.50,
    lastShipmentDate: '2025-11-10',
    lastShipmentQuantity: 30,
    supplier: 'Fresh Farm Produce Co.'
  },
  {
    id: '2',
    name: 'Chicken Breast',
    category: 'Meat',
    quantity: 30,
    unit: 'lb',
    parLevel: 50,
    costPerUnit: 4.99,
    lastShipmentDate: '2025-11-12',
    lastShipmentQuantity: 50,
    supplier: 'Premium Meats Ltd.'
  },
  {
    id: '3',
    name: 'Whole Milk',
    category: 'Dairy',
    quantity: 8,
    unit: 'gallon',
    parLevel: 10,
    costPerUnit: 3.99,
    lastShipmentDate: '2025-11-14',
    lastShipmentQuantity: 15,
    supplier: 'Valley Dairy Farms'
  },
  {
    id: '4',
    name: 'All-Purpose Flour',
    category: 'Dry Goods',
    quantity: 45,
    unit: 'lb',
    parLevel: 40,
    costPerUnit: 0.89,
    lastShipmentDate: '2025-11-08',
    lastShipmentQuantity: 100,
    supplier: 'Wholesale Dry Goods Inc.'
  },
  {
    id: '5',
    name: 'Tomatoes',
    category: 'Produce',
    quantity: 12,
    unit: 'lb',
    parLevel: 25,
    costPerUnit: 1.99,
    lastShipmentDate: '2025-11-13',
    lastShipmentQuantity: 40,
    supplier: 'Fresh Farm Produce Co.'
  },
  {
    id: '6',
    name: 'Ground Beef',
    category: 'Meat',
    quantity: 18,
    unit: 'lb',
    parLevel: 30,
    costPerUnit: 5.49,
    lastShipmentDate: '2025-11-11',
    lastShipmentQuantity: 35,
    supplier: 'Premium Meats Ltd.'
  },
  {
    id: '7',
    name: 'Cheddar Cheese',
    category: 'Dairy',
    quantity: 8,
    unit: 'lb',
    parLevel: 15,
    costPerUnit: 6.99,
    lastShipmentDate: '2025-11-09',
    lastShipmentQuantity: 20,
    supplier: 'Valley Dairy Farms'
  },
  {
    id: '8',
    name: 'Olive Oil',
    category: 'Dry Goods',
    quantity: 22,
    unit: 'gallon',
    parLevel: 20,
    costPerUnit: 24.99,
    lastShipmentDate: '2025-11-07',
    lastShipmentQuantity: 30,
    supplier: 'Mediterranean Imports'
  },
  {
    id: '9',
    name: 'Orange Juice',
    category: 'Beverages',
    quantity: 5,
    unit: 'gallon',
    parLevel: 12,
    costPerUnit: 7.99,
    lastShipmentDate: '2025-11-15',
    lastShipmentQuantity: 18,
    supplier: 'Citrus Beverages Co.'
  },
  {
    id: '10',
    name: 'Coffee Beans',
    category: 'Beverages',
    quantity: 10,
    unit: 'lb',
    parLevel: 15,
    costPerUnit: 12.99,
    lastShipmentDate: '2025-11-06',
    lastShipmentQuantity: 25,
    supplier: 'Roasters Supply Inc.'
  }
];

export const calculateTotalValue = (items: InventoryItem[]) => {
  return items.reduce((total, item) => total + (item.quantity * item.costPerUnit), 0);
};

export const getLowStockItems = (items: InventoryItem[]) => {
  return items.filter(item => item.quantity <= item.parLevel);
};
