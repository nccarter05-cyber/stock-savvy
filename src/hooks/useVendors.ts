import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Vendor {
  id: string;
  vendor_name: string;
}

export const useVendors = () => {
  const { data: vendors = [], isLoading, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_info')
        .select('id, vendor_name')
        .order('vendor_name', { ascending: true });

      if (error) throw error;
      return (data || []) as Vendor[];
    },
  });

  return { vendors, isLoading, error };
};
