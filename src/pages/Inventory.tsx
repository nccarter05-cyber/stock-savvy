import { useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Plus, Minus, Pencil, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '@/hooks/useInventory';
import BulkEditDialog from '@/components/BulkEditDialog';
import { formatQty } from '@/lib/units';

const Inventory = () => {
  const navigate = useNavigate();
  const { items, isLoading, deleteItem, clearAllItems, isClearingAll, updateQuantity, bulkUpdateItems, isBulkUpdating } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);


  const filteredItems = appliedQuery.trim()
    ? items.filter((item) => {
        const q = appliedQuery.toLowerCase();
        return (
          (item.item_number?.toLowerCase().includes(q) ?? false) ||
          item.inventory_name.toLowerCase().includes(q) ||
          (item.category?.toLowerCase().includes(q) ?? false)
        );
      })
    : items;

  const triggerSearch = () => {
    setAppliedQuery(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAppliedQuery('');
  };

  const getAdjustAmount = (itemId: string) => adjustAmounts[itemId] ?? 1;
  
  const setAdjustAmount = (itemId: string, value: number) => {
    setAdjustAmounts(prev => ({ ...prev, [itemId]: Math.max(1, value) }));
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
  const someFilteredSelected = filteredItems.some((i) => selectedIds.has(i.id));

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredItems.forEach((i) => next.delete(i.id));
      } else {
        filteredItems.forEach((i) => next.add(i.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c))).sort(),
    [items],
  );
  const vendors = useMemo(
    () => Array.from(new Set(items.map((i) => i.vendor_name).filter((v): v is string => !!v))).sort(),
    [items],
  );


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

    const isSelected = selectedIds.has(item.id);
    return (
      <Card 
        className={`cursor-pointer transition-colors hover:bg-accent/50 ${isLowStock ? 'border-destructive' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onClick={() => navigate(`/edit-item/${item.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div onClick={(e) => e.stopPropagation()} className="pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelected(item.id)}
                  aria-label={`Select ${item.inventory_name}`}
                />
              </div>
              <div className="flex-1">
                {item.item_number && (
                  <p className="text-xs text-muted-foreground">Item #: {item.item_number}</p>
                )}
                <h3 className="font-semibold text-foreground">{item.inventory_name}</h3>
                {item.category && (
                  <Badge variant="secondary" className={`mt-1 ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate(`/edit-item/${item.id}`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <span className={`ml-1 font-medium ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                {formatQty(quantity, item.base_unit, item.default_display_unit, item.pack_units)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Cost:</span>
              <span className="ml-1 text-foreground">${costPerUnit.toFixed(2)}{item.base_unit ? `/${item.base_unit}` : ''}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Value:</span>
              <span className="ml-1 text-foreground">${totalValue.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Min:</span>
              <span className="ml-1 text-foreground">
                {item.inventory_minimum != null ? formatQty(item.inventory_minimum, item.base_unit, item.default_display_unit, item.pack_units) : '-'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Max:</span>
              <span className="ml-1 text-foreground">
                {item.inventory_maximum != null ? formatQty(item.inventory_maximum, item.base_unit, item.default_display_unit, item.pack_units) : '-'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t" onClick={(e) => e.stopPropagation()}>
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
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isClearingAll}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="hidden md:inline">Clear All</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all inventory?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {items.length} items from your inventory. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => clearAllItems()}
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={() => navigate('/add-item')} size="sm" className="md:hidden">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
            <Button onClick={() => navigate('/add-item')} className="hidden md:flex">
              Add New Item
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by Item #, Name or Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  triggerSearch();
                }
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={triggerSearch} size="sm">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
          {appliedQuery.trim() && (
            <Button variant="outline" size="sm" onClick={clearSearch}>
              Clear
            </Button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="border rounded-lg bg-card p-8 md:p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {appliedQuery.trim() ? 'No matching items found' : 'No inventory items yet'}
            </p>
            <Button onClick={() => navigate('/add-item')}>
              {searchQuery.trim() ? 'Add New Item' : 'Add Your First Item'}
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleSelectAllFiltered}
                  aria-label="Select all"
                />
                <span className="text-sm text-muted-foreground">
                  Select all ({filteredItems.length})
                </span>
              </div>
              {filteredItems.map((item) => (
                <MobileItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Desktop table layout */}
            <div className="border rounded-lg bg-card hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={toggleSelectAllFiltered}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Item #</TableHead>
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
                  {filteredItems.map((item) => {
                    const quantity = item.current_quantity || 0;
                    const costPerUnit = item.cost_per_unit || 0;
                    const totalValue = quantity * costPerUnit;
                    const minLevel = item.inventory_minimum || 0;
                    
                    return (
                      <TableRow 
                        key={item.id} 
                        className={`cursor-pointer hover:bg-accent/50 transition-colors ${selectedIds.has(item.id) ? 'bg-accent/40' : ''}`}
                        onClick={() => navigate(`/edit-item/${item.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleSelected(item.id)}
                            aria-label={`Select ${item.inventory_name}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.item_number || '-'}</TableCell>

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
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => navigate(`/edit-item/${item.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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

      {selectedIds.size > 0 && (
        <div className="fixed left-0 right-0 bottom-16 md:bottom-4 z-40 px-4 pointer-events-none">
          <div className="mx-auto max-w-3xl bg-card border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 pointer-events-auto">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button size="sm" onClick={() => setBulkOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Bulk edit
              </Button>
            </div>
          </div>
        </div>
      )}

      <BulkEditDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        count={selectedIds.size}
        categories={categories}
        vendors={vendors}
        isSaving={isBulkUpdating}
        onApply={(changes) => {
          bulkUpdateItems(
            { ids: Array.from(selectedIds), changes },
            {
              onSuccess: () => {
                setBulkOpen(false);
                clearSelection();
              },
            },
          );
        }}
      />
    </Layout>
  );
};

export default Inventory;