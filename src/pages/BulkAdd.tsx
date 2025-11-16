import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem } from '@/lib/mockData';
import { toast } from 'sonner';

const BulkAdd = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    parLevel: '',
    lowStockThreshold: '',
    costPerUnit: '',
    lastShipmentDate: '',
    lastShipmentQuantity: '',
    supplier: ''
  });

  const handleAddItem = () => {
    if (!currentItem.name || !currentItem.category || !currentItem.quantity || !currentItem.unit || 
        !currentItem.parLevel || !currentItem.lowStockThreshold || !currentItem.costPerUnit || 
        !currentItem.lastShipmentDate || !currentItem.lastShipmentQuantity || !currentItem.supplier) {
      toast.error('Please fill in all fields');
      return;
    }

    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: currentItem.name,
      category: currentItem.category as InventoryItem['category'],
      quantity: parseFloat(currentItem.quantity),
      unit: currentItem.unit as InventoryItem['unit'],
      parLevel: parseFloat(currentItem.parLevel),
      lowStockThreshold: parseFloat(currentItem.lowStockThreshold),
      costPerUnit: parseFloat(currentItem.costPerUnit),
      lastShipmentDate: currentItem.lastShipmentDate,
      lastShipmentQuantity: parseFloat(currentItem.lastShipmentQuantity),
      supplier: currentItem.supplier
    };

    setItems([...items, newItem]);
    setCurrentItem({
      name: '',
      category: '',
      quantity: '',
      unit: '',
      parLevel: '',
      lowStockThreshold: '',
      costPerUnit: '',
      lastShipmentDate: '',
      lastShipmentQuantity: '',
      supplier: ''
    });
    toast.success('Item added to list');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success('Item removed from list');
  };

  const handleSaveAll = () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    // Mock save - in real app would save to database
    toast.success(`${items.length} items saved successfully`);
    navigate('/inventory');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Initial Inventory Setup</h2>
            <p className="text-muted-foreground mt-2">Add multiple items to get your inventory started</p>
          </div>
          <Button onClick={handleSaveAll} disabled={items.length === 0}>
            Save All Items ({items.length})
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter item name" 
                  value={currentItem.name}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={currentItem.category} onValueChange={(value) => setCurrentItem({ ...currentItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Produce">Produce</SelectItem>
                    <SelectItem value="Meat">Meat</SelectItem>
                    <SelectItem value="Dairy">Dairy</SelectItem>
                    <SelectItem value="Dry Goods">Dry Goods</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Current Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  step="0.01" 
                  placeholder="0" 
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={currentItem.unit} onValueChange={(value) => setCurrentItem({ ...currentItem, unit: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lb">lb</SelectItem>
                    <SelectItem value="oz">oz</SelectItem>
                    <SelectItem value="case">case</SelectItem>
                    <SelectItem value="each">each</SelectItem>
                    <SelectItem value="gallon">gallon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parLevel">Par Level</Label>
                <Input 
                  id="parLevel" 
                  type="number" 
                  step="0.01" 
                  placeholder="0" 
                  value={currentItem.parLevel}
                  onChange={(e) => setCurrentItem({ ...currentItem, parLevel: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert Level</Label>
                <Input 
                  id="lowStockThreshold" 
                  type="number" 
                  step="0.01" 
                  placeholder="0" 
                  value={currentItem.lowStockThreshold}
                  onChange={(e) => setCurrentItem({ ...currentItem, lowStockThreshold: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost Per Unit</Label>
              <Input 
                id="cost" 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                value={currentItem.costPerUnit}
                onChange={(e) => setCurrentItem({ ...currentItem, costPerUnit: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input 
                id="supplier" 
                placeholder="Enter supplier name" 
                value={currentItem.supplier}
                onChange={(e) => setCurrentItem({ ...currentItem, supplier: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastShipmentDate">Last Shipment Date</Label>
                <Input 
                  id="lastShipmentDate" 
                  type="date" 
                  value={currentItem.lastShipmentDate}
                  onChange={(e) => setCurrentItem({ ...currentItem, lastShipmentDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastShipmentQuantity">Quantity Received</Label>
                <Input 
                  id="lastShipmentQuantity" 
                  type="number" 
                  step="0.01" 
                  placeholder="0" 
                  value={currentItem.lastShipmentQuantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, lastShipmentQuantity: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={handleAddItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Item to List
            </Button>
          </CardContent>
        </Card>

        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Items to be Added ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Par Level</TableHead>
                      <TableHead>Cost/Unit</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>{item.parLevel} {item.unit}</TableCell>
                        <TableCell>${item.costPerUnit.toFixed(2)}</TableCell>
                        <TableCell>{item.supplier}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default BulkAdd;
