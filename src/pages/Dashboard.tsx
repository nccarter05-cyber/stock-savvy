import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import { useInventory } from '@/hooks/useInventory';

const Dashboard = () => {
  const { items, isLoading, calculateTotalValue, getLowStockItems } = useInventory();
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const totalValue = calculateTotalValue();
  const lowStockItems = getLowStockItems();
  const totalItems = items.length;

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${totalValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Across all items</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalItems}</div>
              <p className="text-xs text-muted-foreground">In inventory</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Items below par level</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No low stock items</p>
            ) : (
              <div className="space-y-4">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium text-foreground">{item.inventory_name}</p>
                      <p className="text-sm text-muted-foreground">{item.category || 'No category'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-destructive">
                        {item.current_quantity} {item.unit || ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min: {item.inventory_minimum || 0} {item.unit || ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
