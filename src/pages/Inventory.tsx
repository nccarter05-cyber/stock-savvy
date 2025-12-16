import { useState } from 'react';
import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '@/hooks/useInventory';

const Inventory = () => {
  const navigate = useNavigate();
  const { items, isLoading, deleteItem, updateQuantity } = useInventory();
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, number>>({});

  const getAdjustAmount = (itemId: string) => adjustAmounts[itemId] ?? 1;
  
  const setAdjustAmount = (itemId: string, value: number) => {
    setAdjustAmounts(prev => ({ ...prev, [itemId]: Math.max(1, value) }));
  };

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

  // Mobile card component for each item
  const MobileItemCard = ({ item }: { item: typeof items[0] }) => {
    const quantity = item.current_quantity || 0;
    const costPerUnit = item.cost_per_unit || 0;
    const totalValue = quantity * costPerUnit;
    const minLevel = item.inventory_minimum || 0;
    const isLowStock = quantity <= minLevel;

    return (
      <Card className={isLowStock ? 'border-destructive' : ''}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{item.inventory_name}</h3>
              {item.category && (
                <Badge variant="secondary" className={`mt-1 ${getCategoryColor(item.category)}`}>
                  {item.category}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => deleteItem(item.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <span className={`ml-1 font-medium ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                {quantity} {item.unit || ''}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Cost:</span>
              <span className="ml-1 text-foreground">${costPerUnit.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Value:</span>
              <span className="ml-1 text-foreground">${totalValue.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Min:</span>
              <span className="ml-1 text-foreground">{item.inventory_minimum || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max:</span>
              <span className="ml-1 text-foreground">{item.inventory_maximum || '-'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm text-muted-foreground">
              {item.vendor_name || 'No supplier'}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => updateQuantity({ itemId: item.id, delta: -getAdjustAmount(item.id) })}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={getAdjustAmount(item.id)}
                onChange={(e) => setAdjustAmount(item.id, parseInt(e.target.value) || 1)}
                className="w-14 h-9 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => updateQuantity({ itemId: item.id, delta: getAdjustAmount(item.id) })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Inventory</h2>
          <Button onClick={() => navigate('/add-item')} size="sm" className="md:hidden">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
          <Button onClick={() => navigate('/add-item')} className="hidden md:flex">
            Add New Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="border rounded-lg bg-card p-8 md:p-12 text-center">
            <p className="text-muted-foreground mb-4">No inventory items yet</p>
            <Button onClick={() => navigate('/add-item')}>Add Your First Item</Button>
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="space-y-3 md:hidden">
              {items.map((item) => (
                <MobileItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Desktop table layout */}
            <div className="border rounded-lg bg-card hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Adjust Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Min Level</TableHead>
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
                              onClick={() => updateQuantity({ itemId: item.id, delta: -getAdjustAmount(item.id) })}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={getAdjustAmount(item.id)}
                              onChange={(e) => setAdjustAmount(item.id, parseInt(e.target.value) || 1)}
                              className="w-14 h-7 text-center text-sm"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity({ itemId: item.id, delta: getAdjustAmount(item.id) })}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{item.unit || '-'}</TableCell>
                        <TableCell>{item.inventory_minimum || '-'}</TableCell>
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;