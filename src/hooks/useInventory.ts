import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { normalizePackUnits, type PackUnitList } from '@/lib/units';

export interface InventoryItemWithQuantity {
  id: string;
  item_number: string | null;
  inventory_name: string;
  category: string | null;
  unit: string | null;
  base_unit: string | null;
  default_display_unit: string | null;
  pack_units: PackUnitList;
  cost_per_unit: number | null;
  last_shipment_date: string | null;
  last_shipment_quantity: number | null;
  vendor_id: string | null;
  vendor_name: string | null;
  current_quantity: number;
  inventory_maximum: number | null;
  inventory_minimum: number | null;
}

export const useInventory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Fetch inventory with quantities and vendor info
      // RLS policies now handle team-based access, so we don't filter by user_id
      const { data: inventoryData, error: inventoryError } = await (supabase
        .from('inventory_info')
        .select(`
          id,
          item_number,
          inventory_name,
          category,
          unit,
          base_unit,
          default_display_unit,
          pack_units,
          cost_per_unit,
          last_shipment_date,
          last_shipment_quantity,
          vendor_id,
          vendor_info:vendor_id (
            id,
            vendor_name
          ),
          inventory_quantity (
            current_quantity,
            inventory_maximum,
            inventory_minimum
          )
        ` as any) as any);

      if (inventoryError) throw inventoryError;

      // Transform data to flat structure
      const transformedData: InventoryItemWithQuantity[] = (inventoryData || []).map((item: any) => ({
        id: item.id,
        item_number: item.item_number,
        inventory_name: item.inventory_name,
        category: item.category,
        unit: item.unit,
        base_unit: item.base_unit ?? item.unit ?? null,
        default_display_unit: item.default_display_unit ?? item.unit ?? null,
        pack_units: normalizePackUnits(item.pack_units),
        cost_per_unit: item.cost_per_unit,
        last_shipment_date: item.last_shipment_date,
        last_shipment_quantity: item.last_shipment_quantity,
        vendor_id: item.vendor_id,
        vendor_name: item.vendor_info?.vendor_name || null,
        current_quantity: item.inventory_quantity?.[0]?.current_quantity || 0,
        inventory_maximum: item.inventory_quantity?.[0]?.inventory_maximum || null,
        inventory_minimum: item.inventory_quantity?.[0]?.inventory_minimum || null,
      }));

      return transformedData;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (newItem: {
      inventory_name: string;
      category?: string | null;
      unit?: string | null;
      cost_per_unit?: number | null;
      last_shipment_date?: string | null;
      last_shipment_quantity?: number | null;
      vendor_id?: string | null;
      vendor_name?: string | null;
      current_quantity?: number;
      inventory_maximum?: number | null;
      inventory_minimum?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      let vendorId: string | null = newItem.vendor_id ?? null;

      if (!vendorId && newItem.vendor_name && newItem.vendor_name.trim()) {
        // Check if vendor exists
        const { data: existingVendor } = await supabase
          .from('vendor_info')
          .select('id')
          .eq('user_id', user.id)
          .eq('vendor_name', newItem.vendor_name)
          .maybeSingle();

        if (existingVendor) {
          vendorId = existingVendor.id;
        } else {
          // Create new vendor
          const { data: newVendor, error: vendorError } = await supabase
            .from('vendor_info')
            .insert({
              user_id: user.id,
              vendor_name: newItem.vendor_name,
            })
            .select('id')
            .single();

          if (vendorError) throw vendorError;
          vendorId = newVendor.id;
        }
      }

      // Create inventory item
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory_info')
        .insert({
          user_id: user.id,
          inventory_name: newItem.inventory_name,
          category: newItem.category || null,
          unit: newItem.unit || null,
          cost_per_unit: newItem.cost_per_unit ?? null,
          last_shipment_date: newItem.last_shipment_date || null,
          last_shipment_quantity: newItem.last_shipment_quantity ?? null,
          vendor_id: vendorId,
        })
        .select('id')
        .single();

      if (inventoryError) throw inventoryError;

      // Create quantity record
      const { error: quantityError } = await supabase
        .from('inventory_quantity')
        .insert({
          inventory_id: inventoryItem.id,
          user_id: user.id,
          current_quantity: newItem.current_quantity ?? 0,
          inventory_maximum: newItem.inventory_maximum ?? null,
          inventory_minimum: newItem.inventory_minimum ?? null,
          vendor_id: vendorId,
        });

      if (quantityError) throw quantityError;

      return inventoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: 'Success',
        description: 'Item added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item',
        variant: 'destructive',
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, delta }: { itemId: string; delta: number }) => {
      // Get current quantity
      const { data: currentData, error: fetchError } = await supabase
        .from('inventory_quantity')
        .select('current_quantity')
        .eq('inventory_id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const newQuantity = Math.max(0, (currentData.current_quantity || 0) + delta);

      // Update quantity
      const { error: updateError } = await supabase
        .from('inventory_quantity')
        .update({ current_quantity: newQuantity })
        .eq('inventory_id', itemId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Updated',
        description: 'Quantity updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update quantity',
        variant: 'destructive',
      });
    },
  });

  const setQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const newQuantity = Math.max(0, quantity);

      const { error: updateError } = await supabase
        .from('inventory_quantity')
        .update({ current_quantity: newQuantity })
        .eq('inventory_id', itemId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Updated',
        description: 'Quantity updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update quantity',
        variant: 'destructive',
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Delete inventory item (cascade will handle quantity)
      const { error } = await supabase
        .from('inventory_info')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    },
  });

  const clearAllItemsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('inventory_info')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Inventory cleared',
        description: 'All inventory items have been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear inventory',
        variant: 'destructive',
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (updatedItem: {
      id: string;
      inventory_name: string;
      category?: string | null;
      unit?: string | null;
      cost_per_unit?: number | null;
      last_shipment_date?: string | null;
      last_shipment_quantity?: number | null;
      vendor_name?: string | null;
      current_quantity?: number;
      inventory_maximum?: number | null;
      inventory_minimum?: number | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Handle vendor lookup/creation
      let vendorId: string | null = null;
      
      if (updatedItem.vendor_name && updatedItem.vendor_name.trim()) {
        // Check if vendor exists
        const { data: existingVendor } = await supabase
          .from('vendor_info')
          .select('id')
          .eq('user_id', user.id)
          .eq('vendor_name', updatedItem.vendor_name)
          .maybeSingle();

        if (existingVendor) {
          vendorId = existingVendor.id;
        } else {
          // Create new vendor
          const { data: newVendor, error: vendorError } = await supabase
            .from('vendor_info')
            .insert({
              user_id: user.id,
              vendor_name: updatedItem.vendor_name,
            })
            .select('id')
            .single();

          if (vendorError) throw vendorError;
          vendorId = newVendor.id;
        }
      }

      // Update inventory_info table
      const { error: inventoryError } = await supabase
        .from('inventory_info')
        .update({
          inventory_name: updatedItem.inventory_name,
          category: updatedItem.category || null,
          unit: updatedItem.unit || null,
          cost_per_unit: updatedItem.cost_per_unit ?? null,
          last_shipment_date: updatedItem.last_shipment_date || null,
          last_shipment_quantity: updatedItem.last_shipment_quantity ?? null,
          vendor_id: vendorId,
        })
        .eq('id', updatedItem.id);

      if (inventoryError) throw inventoryError;

      // Update inventory_quantity table
      const { error: quantityError } = await supabase
        .from('inventory_quantity')
        .update({
          current_quantity: updatedItem.current_quantity ?? 0,
          inventory_maximum: updatedItem.inventory_maximum ?? null,
          inventory_minimum: updatedItem.inventory_minimum ?? null,
          vendor_id: vendorId,
        })
        .eq('inventory_id', updatedItem.id);

      if (quantityError) throw quantityError;

      return updatedItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive',
      });
    },
  });

  const bulkUpdateItemsMutation = useMutation({
    mutationFn: async ({
      ids,
      changes,
    }: {
      ids: string[];
      changes: Partial<{
        item_number: string | null;
        category: string | null;
        unit: string | null;
        cost_per_unit: number | null;
        last_shipment_date: string | null;
        last_shipment_quantity: number | null;
        vendor_name: string | null;
        current_quantity: number;
        inventory_minimum: number | null;
        inventory_maximum: number | null;
      }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (ids.length === 0) return;

      const infoUpdate: Record<string, unknown> = {};
      const qtyUpdate: Record<string, unknown> = {};

      if ('item_number' in changes) infoUpdate.item_number = changes.item_number || null;
      if ('category' in changes) infoUpdate.category = changes.category || null;
      if ('unit' in changes) infoUpdate.unit = changes.unit || null;
      if ('cost_per_unit' in changes) infoUpdate.cost_per_unit = changes.cost_per_unit ?? null;
      if ('last_shipment_date' in changes) infoUpdate.last_shipment_date = changes.last_shipment_date || null;
      if ('last_shipment_quantity' in changes) infoUpdate.last_shipment_quantity = changes.last_shipment_quantity ?? null;

      if ('current_quantity' in changes) qtyUpdate.current_quantity = Math.max(0, changes.current_quantity ?? 0);
      if ('inventory_minimum' in changes) qtyUpdate.inventory_minimum = changes.inventory_minimum ?? null;
      if ('inventory_maximum' in changes) qtyUpdate.inventory_maximum = changes.inventory_maximum ?? null;

      if ('vendor_name' in changes) {
        let vendorId: string | null = null;
        const name = changes.vendor_name?.trim();
        if (name) {
          const { data: existingVendor } = await supabase
            .from('vendor_info')
            .select('id')
            .eq('user_id', user.id)
            .eq('vendor_name', name)
            .maybeSingle();
          if (existingVendor) {
            vendorId = existingVendor.id;
          } else {
            const { data: newVendor, error: vErr } = await supabase
              .from('vendor_info')
              .insert({ user_id: user.id, vendor_name: name })
              .select('id')
              .single();
            if (vErr) throw vErr;
            vendorId = newVendor.id;
          }
        }
        infoUpdate.vendor_id = vendorId;
        qtyUpdate.vendor_id = vendorId;
      }

      if (Object.keys(infoUpdate).length > 0) {
        const { error } = await supabase
          .from('inventory_info')
          .update(infoUpdate)
          .in('id', ids);
        if (error) throw error;
      }

      if (Object.keys(qtyUpdate).length > 0) {
        const { error } = await supabase
          .from('inventory_quantity')
          .update(qtyUpdate)
          .in('inventory_id', ids);
        if (error) throw error;
      }

      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: 'Bulk update complete',
        description: `Updated ${count ?? 0} item${count === 1 ? '' : 's'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update items',
        variant: 'destructive',
      });
    },
  });

  const calculateTotalValue = () => {
    return items.reduce((total, item) => {
      const quantity = item.current_quantity || 0;
      const cost = item.cost_per_unit || 0;
      return total + (quantity * cost);
    }, 0);
  };

  const getLowStockItems = () => {
    return items
      .filter(item => {
        const min = item.inventory_minimum || 0;
        return item.current_quantity <= min;
      })
      .sort((a, b) => a.inventory_name.localeCompare(b.inventory_name));
  };

  return {
    items,
    isLoading,
    error,
    addItem: addItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    deleteItem: deleteItemMutation.mutate,
    clearAllItems: clearAllItemsMutation.mutate,
    isClearingAll: clearAllItemsMutation.isPending,
    updateQuantity: updateQuantityMutation.mutate,
    setQuantity: setQuantityMutation.mutate,
    bulkUpdateItems: bulkUpdateItemsMutation.mutate,
    isBulkUpdating: bulkUpdateItemsMutation.isPending,
    calculateTotalValue,
    getLowStockItems,
  };
};
