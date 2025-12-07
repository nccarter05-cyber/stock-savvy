import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/hooks/useInventory';

const LowStock = () => {
  const { getLowStockItems, isLoading } = useInventory();
  const lowStockItems = getLowStockItems();

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

        {lowStockItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 md:py-10 text-center">
              <p className="text-muted-foreground">No items below minimum stock level</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
            {lowStockItems.map((item) => {
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