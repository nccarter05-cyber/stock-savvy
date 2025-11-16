import { useState } from 'react';
import Layout from '@/components/Layout';
import { mockInventory, InventoryItem } from '@/lib/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Inventory = () => {
  const [items] = useState<InventoryItem[]>(mockInventory);
  const navigate = useNavigate();

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Produce': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Meat': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Dairy': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Dry Goods': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Beverages': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[category] || '';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-foreground">Inventory</h2>
          <Button onClick={() => navigate('/add-item')}>Add New Item</Button>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Par Level</TableHead>
                <TableHead>Cost/Unit</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Last Shipment</TableHead>
                <TableHead>Qty Received</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={item.quantity <= item.parLevel ? 'text-destructive font-semibold' : ''}>
                      {item.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.parLevel}</TableCell>
                  <TableCell>${item.costPerUnit.toFixed(2)}</TableCell>
                  <TableCell>${(item.quantity * item.costPerUnit).toFixed(2)}</TableCell>
                  <TableCell>{new Date(item.lastShipmentDate).toLocaleDateString()}</TableCell>
                  <TableCell>{item.lastShipmentQuantity} {item.unit}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default Inventory;
