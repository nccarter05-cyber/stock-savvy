import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '@/hooks/useInventory';

const Inventory = () => {
  const navigate = useNavigate();
  const { items, isLoading, deleteItem, updateQuantity } = useInventory();

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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-foreground">Inventory</h2>
          <Button onClick={() => navigate('/add-item')}>Add New Item</Button>
        </div>

        {items.length === 0 ? (
          <div className="border rounded-lg bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">No inventory items yet</p>
            <Button onClick={() => navigate('/add-item')}>Add Your First Item</Button>
          </div>
        ) : (
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Adjust Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Max Level</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Last Shipment</TableHead>
                  <TableHead>Qty Received</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const quantity = item.current_quantity || 0;
                  const costPerUnit = item.cost_per_unit || 0;
                  const totalValue = quantity * costPerUnit;
                  const minLevel = item.inventory_minimum || 0;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.inventory_name}</TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="secondary" className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={quantity <= minLevel ? 'text-destructive font-semibold' : ''}>
                          {quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity({ itemId: item.id, delta: -1 })}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity({ itemId: item.id, delta: 1 })}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{item.unit || '-'}</TableCell>
                      <TableCell>{item.inventory_maximum || '-'}</TableCell>
                      <TableCell>${costPerUnit.toFixed(2)}</TableCell>
                      <TableCell>${totalValue.toFixed(2)}</TableCell>
                      <TableCell>
                        {item.last_shipment_date 
                          ? new Date(item.last_shipment_date).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {item.last_shipment_quantity 
                          ? `${item.last_shipment_quantity} ${item.unit || ''}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{item.vendor_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;
