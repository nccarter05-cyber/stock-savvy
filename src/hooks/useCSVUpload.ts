import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CSVRow {
  inventory_name: string;
  vendor_name: string;
  current_quantity: string;
  inventory_maximum?: string;
  inventory_minimum?: string;
  email?: string;
}

export interface ValidatedRow extends CSVRow {
  rowIndex: number;
  isValid: boolean;
  errors: string[];
  vendor_id?: string;
  user_id?: string;
  inventory_id?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export const useCSVUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const parseCSV = (content: string): CSVRow[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim().replace(/^["']|["']$/g, '') || '';
      });

      rows.push({
        inventory_name: row['inventory_name'] || '',
        vendor_name: row['vendor_name'] || '',
        current_quantity: row['current_quantity'] || '',
        inventory_maximum: row['inventory_maximum'] || undefined,
        inventory_minimum: row['inventory_minimum'] || undefined,
        email: row['email'] || undefined,
      });
    }

    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const validateRows = async (rows: CSVRow[]): Promise<ValidatedRow[]> => {
    setIsValidating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all vendors the user can access
      const { data: vendors } = await supabase
        .from('vendor_info')
        .select('id, vendor_name');

      const vendorMap = new Map<string, string>();
      vendors?.forEach(v => vendorMap.set(v.vendor_name.toLowerCase(), v.id));

      // Fetch existing inventory items
      const { data: inventoryItems } = await supabase
        .from('inventory_info')
        .select('id, inventory_name, vendor_id');

      const inventoryMap = new Map<string, { id: string; vendor_id: string | null }>();
      inventoryItems?.forEach(item => {
        inventoryMap.set(item.inventory_name.toLowerCase(), { id: item.id, vendor_id: item.vendor_id });
      });

      const validatedRows: ValidatedRow[] = rows.map((row, index) => {
        const errors: string[] = [];
        let vendor_id: string | undefined;
        let inventory_id: string | undefined;

        // Validate required fields
        if (!row.inventory_name.trim()) {
          errors.push('Inventory name is required');
        }
        if (!row.vendor_name.trim()) {
          errors.push('Vendor name is required');
        }
        if (!row.current_quantity.trim()) {
          errors.push('Current quantity is required');
        }

        // Validate quantity is a number
        const qty = parseFloat(row.current_quantity);
        if (row.current_quantity && isNaN(qty)) {
          errors.push('Current quantity must be a number');
        }

        // Validate optional quantities
        if (row.inventory_maximum) {
          const max = parseFloat(row.inventory_maximum);
          if (isNaN(max)) errors.push('Inventory maximum must be a number');
        }
        if (row.inventory_minimum) {
          const min = parseFloat(row.inventory_minimum);
          if (isNaN(min)) errors.push('Inventory minimum must be a number');
        }

        // Match vendor
        if (row.vendor_name) {
          vendor_id = vendorMap.get(row.vendor_name.toLowerCase());
          if (!vendor_id) {
            errors.push(`Vendor "${row.vendor_name}" not found`);
          }
        }

        // Check if inventory item exists
        if (row.inventory_name) {
          const existing = inventoryMap.get(row.inventory_name.toLowerCase());
          if (existing) {
            inventory_id = existing.id;
          }
        }

        return {
          ...row,
          rowIndex: index + 1,
          isValid: errors.length === 0,
          errors,
          vendor_id,
          user_id: user.id,
          inventory_id,
        };
      });

      return validatedRows;
    } finally {
      setIsValidating(false);
    }
  };

  const importRows = async (validatedRows: ValidatedRow[]): Promise<ImportResult> => {
    setIsLoading(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const validRows = validatedRows.filter(r => r.isValid);

      for (const row of validRows) {
        try {
          let inventoryId = row.inventory_id;

          // Create inventory_info if it doesn't exist
          if (!inventoryId) {
            const { data: newItem, error: insertError } = await supabase
              .from('inventory_info')
              .insert({
                inventory_name: row.inventory_name,
                vendor_id: row.vendor_id,
                user_id: user.id,
              })
              .select('id')
              .single();

            if (insertError) throw insertError;
            inventoryId = newItem.id;
          }

          // Check if inventory_quantity record exists
          const { data: existingQty } = await supabase
            .from('inventory_quantity')
            .select('id')
            .eq('inventory_id', inventoryId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (existingQty) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('inventory_quantity')
              .update({
                current_quantity: parseFloat(row.current_quantity),
                inventory_maximum: row.inventory_maximum ? parseFloat(row.inventory_maximum) : null,
                inventory_minimum: row.inventory_minimum ? parseFloat(row.inventory_minimum) : null,
                vendor_id: row.vendor_id,
              })
              .eq('id', existingQty.id);

            if (updateError) throw updateError;
          } else {
            // Insert new record
            const { error: insertError } = await supabase
              .from('inventory_quantity')
              .insert({
                inventory_id: inventoryId,
                user_id: user.id,
                current_quantity: parseFloat(row.current_quantity),
                inventory_maximum: row.inventory_maximum ? parseFloat(row.inventory_maximum) : null,
                inventory_minimum: row.inventory_minimum ? parseFloat(row.inventory_minimum) : null,
                vendor_id: row.vendor_id,
              });

            if (insertError) throw insertError;
          }

          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Row ${row.rowIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (result.success > 0) {
        toast({
          title: 'Import Complete',
          description: `Successfully imported ${result.success} items${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        });
      }

      if (result.failed > 0) {
        toast({
          title: 'Some imports failed',
          description: `${result.failed} items failed to import. Check the error details.`,
          variant: 'destructive',
        });
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    parseCSV,
    validateRows,
    importRows,
    isLoading,
    isValidating,
  };
};
