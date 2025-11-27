import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InventoryItemWithQuantity {
  id: string;
  inventory_name: string;
  category: string | null;
  unit: string | null;
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
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_info')
        .select(`
          id,
          inventory_name,
          category,
          unit,
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
        `)
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      // Transform data to flat structure
      const transformedData: InventoryItemWithQuantity[] = (inventoryData || []).map((item: any) => ({
        id: item.id,
        inventory_name: item.inventory_name,
        category: item.category,
        unit: item.unit,
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
      category: string;
      unit: string;
      cost_per_unit: number;
      last_shipment_date: string;
      last_shipment_quantity: number;
      vendor_name: string;
      current_quantity: number;
      inventory_maximum: number;
      inventory_minimum: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // First, create or get vendor
      let vendorId: string | null = null;
      
      if (newItem.vendor_name) {
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
          category: newItem.category,
          unit: newItem.unit,
          cost_per_unit: newItem.cost_per_unit,
          last_shipment_date: newItem.last_shipment_date,
          last_shipment_quantity: newItem.last_shipment_quantity,
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
          current_quantity: newItem.current_quantity,
          inventory_maximum: newItem.inventory_maximum,
          inventory_minimum: newItem.inventory_minimum,
          vendor_id: vendorId,
        });

      if (quantityError) throw quantityError;

      return inventoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
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

  const calculateTotalValue = () => {
    return items.reduce((total, item) => {
      const quantity = item.current_quantity || 0;
      const cost = item.cost_per_unit || 0;
      return total + (quantity * cost);
    }, 0);
  };

  const getLowStockItems = () => {
    return items.filter(item => {
      const min = item.inventory_minimum || 0;
      return item.current_quantity <= min;
    });
  };

  return {
    items,
    isLoading,
    error,
    addItem: addItemMutation.mutate,
    deleteItem: deleteItemMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    calculateTotalValue,
    getLowStockItems,
  };
};
