import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Search, Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/hooks/useInventory';
import { useState, useMemo } from 'react';

const LowStock = () => {
  const { getLowStockItems, isLoading, updateQuantity } = useInventory();
  const lowStockItems = getLowStockItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, number>>({});

  const getAdjustAmount = (itemId: string) => adjustAmounts[itemId] ?? 1;
  const setAdjustAmount = (itemId: string, value: number) =>
    setAdjustAmounts((prev) => ({ ...prev, [itemId]: value }));

  const categories = useMemo(() => {
    const set = new Set<string>();
    lowStockItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [lowStockItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return lowStockItems.filter((item) => {
      const matchesSearch =
        !query ||
        (item.item_number?.toLowerCase().includes(query) ?? false) ||
        item.inventory_name.toLowerCase().includes(query) ||
        (item.category?.toLowerCase().includes(query) ?? false);
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [lowStockItems, searchQuery, selectedCategory]);

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
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-destructive" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Low Stock Alerts</h2>
        </div>

        {lowStockItems.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search by Item #, Name or Category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {lowStockItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 md:py-10 text-center">
              <p className="text-muted-foreground">No items below minimum stock level</p>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 md:py-10 text-center">
              <p className="text-muted-foreground">No matching items found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
            {filteredItems.map((item) => {
              const needToOrder = (item.inventory_maximum || 0) - item.current_quantity;
              const estimatedCost = needToOrder * (item.cost_per_unit || 0);

              return (
                <Card key={item.id} className="border-l-4 border-l-destructive">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg md:text-xl">{item.inventory_name}</CardTitle>
                      {item.category && (
                        <Badge variant="secondary" className="shrink-0">{item.category}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Stock:</span>
                      <span className="font-semibold text-destructive">
                        {item.current_quantity} {item.unit || ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor:</span>
                      <span className="font-semibold">
                        {item.vendor_name || 'No vendor'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Ordered:</span>
                      <span className="font-semibold">
                        {item.last_shipment_date
                          ? new Date(item.last_shipment_date).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Need to Order:</span>
                      <span className="font-semibold text-primary">
                        {needToOrder} {item.unit || ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LowStock;