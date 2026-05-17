import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface ExtractedLine {
  item_number: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export interface ExtractedInvoice {
  vendor_name: string;
  invoice_date: string;
  line_items: ExtractedLine[];
}

export type RowMode = 'match' | 'create';

export interface ReviewRow {
  id: string; // local row id
  item_number: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vendor_id: string | null;
  new_vendor_name: string; // used when vendor_id is null and user wants to create
  matched_inventory_id: string | null;
  mode: RowMode; // match existing OR create new
  matchStatus: 'matched' | 'unmatched';
}

interface InventoryLookup {
  id: string;
  inventory_name: string;
  item_number: string | null;
  vendor_id: string | null;
}

const normalize = (s: string) => s.trim().toLowerCase();

export const useScanInvoice = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Resize image file -> base64 data URL (max 1600px long edge, JPEG quality 0.85)
  const fileToDataUrl = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.onload = () => {
          const MAX = 1600;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width >= height) {
              height = Math.round((height / width) * MAX);
              width = MAX;
            } else {
              width = Math.round((width / height) * MAX);
              height = MAX;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const extractFromImages = useCallback(async (files: File[]): Promise<ReviewRow[]> => {
    setIsExtracting(true);
    try {
      const dataUrls = await Promise.all(files.map(fileToDataUrl));
      const { data, error } = await supabase.functions.invoke('scan-invoice', {
        body: { images: dataUrls },
      });

      if (error) {
        throw new Error(error.message || 'AI extraction failed');
      }

      const result = data as ExtractedInvoice;
      if (!result?.line_items?.length) {
        toast({
          title: 'No line items found',
          description: 'The AI could not find any line items. Try a clearer photo.',
          variant: 'destructive',
        });
        return [];
      }

      // Load inventory + vendors for matching
      const [{ data: inv }, { data: vendors }] = await Promise.all([
        supabase.from('inventory_info').select('id, inventory_name, item_number, vendor_id'),
        supabase.from('vendor_info').select('id, vendor_name'),
      ]);

      const inventory: InventoryLookup[] = (inv || []) as any;
      const byItemNumber = new Map<string, InventoryLookup>();
      const byName = new Map<string, InventoryLookup>();
      for (const item of inventory) {
        if (item.item_number) byItemNumber.set(normalize(item.item_number), item);
        byName.set(normalize(item.inventory_name), item);
      }

      const vendorByName = new Map<string, string>();
      for (const v of vendors || []) {
        vendorByName.set(normalize(v.vendor_name), v.id);
      }

      // Header-level vendor match (used as default for each row)
      const headerVendorId = result.vendor_name
        ? vendorByName.get(normalize(result.vendor_name)) ?? null
        : null;

      const rows: ReviewRow[] = result.line_items.map((li, idx) => {
        let matched: InventoryLookup | undefined;
        if (li.item_number) matched = byItemNumber.get(normalize(li.item_number));
        if (!matched && li.item_name) matched = byName.get(normalize(li.item_name));

        const vendorId = matched?.vendor_id ?? headerVendorId;

        return {
          id: `row-${idx}-${Date.now()}`,
          item_number: li.item_number,
          item_name: li.item_name,
          quantity: li.quantity,
          unit: li.unit,
          unit_price: li.unit_price,
          vendor_id: vendorId,
          new_vendor_name: vendorId ? '' : result.vendor_name || '',
          matched_inventory_id: matched?.id ?? null,
          mode: matched ? 'match' : 'create',
          matchStatus: matched ? 'matched' : 'unmatched',
        };
      });

      return rows;
    } catch (err: any) {
      toast({
        title: 'Extraction failed',
        description: err?.message || 'Could not extract data from the image',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsExtracting(false);
    }
  }, [fileToDataUrl, toast]);

  const importRows = useCallback(async (
    rows: ReviewRow[],
    invoiceDate: string,
  ): Promise<{ success: number; failed: number }> => {
    setIsImporting(true);
    let success = 0;
    let failed = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const row of rows) {
        try {
          // Resolve vendor
          let vendorId = row.vendor_id;
          if (!vendorId && row.new_vendor_name.trim()) {
            const { data: existing } = await supabase
              .from('vendor_info')
              .select('id')
              .eq('user_id', user.id)
              .ilike('vendor_name', row.new_vendor_name.trim())
              .maybeSingle();
            if (existing) {
              vendorId = existing.id;
            } else {
              const { data: newVendor, error: vErr } = await supabase
                .from('vendor_info')
                .insert({ user_id: user.id, vendor_name: row.new_vendor_name.trim() })
                .select('id')
                .single();
              if (vErr) throw vErr;
              vendorId = newVendor.id;
            }
          }

          const qty = Number(row.quantity) || 0;
          const cost = Number(row.unit_price) || 0;
          const shipDate = invoiceDate || null;

          if (row.mode === 'match' && row.matched_inventory_id) {
            // Update inventory_info: vendor, last shipment, cost
            const infoUpdate: Record<string, unknown> = {
              last_shipment_date: shipDate,
              last_shipment_quantity: qty,
            };
            if (vendorId) infoUpdate.vendor_id = vendorId;
            if (cost > 0) infoUpdate.cost_per_unit = cost;
            if (row.item_number?.trim()) infoUpdate.item_number = row.item_number.trim();
            if (row.unit?.trim()) infoUpdate.unit = row.unit.trim();

            const { error: infoErr } = await supabase
              .from('inventory_info')
              .update(infoUpdate)
              .eq('id', row.matched_inventory_id);
            if (infoErr) throw infoErr;

            // Add to current quantity
            const { data: qRow, error: qFetchErr } = await supabase
              .from('inventory_quantity')
              .select('id, current_quantity')
              .eq('inventory_id', row.matched_inventory_id)
              .maybeSingle();
            if (qFetchErr) throw qFetchErr;

            if (qRow) {
              const newQty = (Number(qRow.current_quantity) || 0) + qty;
              const { error: upErr } = await supabase
                .from('inventory_quantity')
                .update({ current_quantity: newQty, vendor_id: vendorId })
                .eq('id', qRow.id);
              if (upErr) throw upErr;
            } else {
              const { error: insErr } = await supabase
                .from('inventory_quantity')
                .insert({
                  inventory_id: row.matched_inventory_id,
                  user_id: user.id,
                  current_quantity: qty,
                  vendor_id: vendorId,
                });
              if (insErr) throw insErr;
            }
          } else {
            // Create new inventory item
            const { data: newItem, error: invErr } = await supabase
              .from('inventory_info')
              .insert({
                user_id: user.id,
                inventory_name: row.item_name.trim(),
                item_number: row.item_number?.trim() || null,
                unit: row.unit?.trim() || null,
                cost_per_unit: cost > 0 ? cost : null,
                vendor_id: vendorId,
                last_shipment_date: shipDate,
                last_shipment_quantity: qty,
              })
              .select('id')
              .single();
            if (invErr) throw invErr;

            const { error: qErr } = await supabase
              .from('inventory_quantity')
              .insert({
                inventory_id: newItem.id,
                user_id: user.id,
                current_quantity: qty,
                vendor_id: vendorId,
              });
            if (qErr) throw qErr;
          }

          success++;
        } catch (err) {
          console.error('Import row failed', err);
          failed++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });

      if (success > 0) {
        toast({
          title: 'Invoice imported',
          description: `${success} item${success === 1 ? '' : 's'} imported${failed > 0 ? `, ${failed} failed` : ''}.`,
        });
      }
      if (failed > 0 && success === 0) {
        toast({
          title: 'Import failed',
          description: `${failed} item${failed === 1 ? '' : 's'} could not be imported.`,
          variant: 'destructive',
        });
      }

      return { success, failed };
    } finally {
      setIsImporting(false);
    }
  }, [queryClient, toast]);

  return { extractFromImages, importRows, isExtracting, isImporting };
};
