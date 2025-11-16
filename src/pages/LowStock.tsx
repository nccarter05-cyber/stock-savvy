import Layout from '@/components/Layout';
import { mockInventory, getLowStockItems } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LowStock = () => {
  const lowStockItems = getLowStockItems(mockInventory);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <h2 className="text-3xl font-bold text-foreground">Low Stock Alerts</h2>
        </div>

        {lowStockItems.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">No items below par level</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lowStockItems.map((item) => (
              <Card key={item.id} className="border-l-4 border-l-destructive">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Stock:</span>
                    <span className="font-semibold text-destructive">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Par Level:</span>
                    <span className="font-semibold">
                      {item.parLevel} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Need to Order:</span>
                    <span className="font-semibold text-primary">
                      {item.parLevel - item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Est. Cost:</span>
                    <span className="font-semibold">
                      ${((item.parLevel - item.quantity) * item.costPerUnit).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LowStock;
