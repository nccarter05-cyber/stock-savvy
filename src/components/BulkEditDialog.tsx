import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type BulkChanges = Partial<{
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

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  categories: string[];
  vendors: string[];
  isSaving: boolean;
  onApply: (changes: BulkChanges) => void;
}

type FieldKey =
  | 'item_number'
  | 'category'
  | 'current_quantity'
  | 'unit'
  | 'inventory_minimum'
  | 'inventory_maximum'
  | 'cost_per_unit'
  | 'last_shipment_date'
  | 'last_shipment_quantity'
  | 'vendor_name';

const FIELD_LABELS: Record<FieldKey, string> = {
  item_number: 'Item #',
  category: 'Category',
  current_quantity: 'Quantity',
  unit: 'Unit',
  inventory_minimum: 'Min Level',
  inventory_maximum: 'Max Level',
  cost_per_unit: 'Cost/Unit',
  last_shipment_date: 'Last Shipment',
  last_shipment_quantity: 'Quantity Received',
  vendor_name: 'Supplier',
};

const NUMERIC: FieldKey[] = ['current_quantity', 'inventory_minimum', 'inventory_maximum', 'cost_per_unit', 'last_shipment_quantity'];
const DATE: FieldKey[] = ['last_shipment_date'];

export default function BulkEditDialog({ open, onOpenChange, count, categories, vendors, isSaving, onApply }: BulkEditDialogProps) {
  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({} as Record<FieldKey, boolean>);
  const [values, setValues] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);

  const reset = () => {
    setEnabled({} as Record<FieldKey, boolean>);
    setValues({} as Record<FieldKey, string>);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleApply = () => {
    const changes: BulkChanges = {};
    (Object.keys(FIELD_LABELS) as FieldKey[]).forEach((key) => {
      if (!enabled[key]) return;
      const raw = values[key] ?? '';
      if (NUMERIC.includes(key)) {
        const num = raw === '' ? null : Number(raw);
        if (raw !== '' && Number.isNaN(num)) return;
        if (key === 'current_quantity') {
          (changes as any)[key] = num ?? 0;
        } else {
          (changes as any)[key] = num;
        }
      } else if (DATE.includes(key)) {
        (changes as any)[key] = raw || null;
      } else {
        (changes as any)[key] = raw.trim() === '' ? null : raw.trim();
      }
    });
    onApply(changes);
  };

  const anyEnabled = Object.values(enabled).some(Boolean);

  const renderField = (key: FieldKey) => {
    const isNumeric = NUMERIC.includes(key);
    const isDate = DATE.includes(key);
    const listId =
      key === 'category' ? 'bulk-categories' : key === 'vendor_name' ? 'bulk-vendors' : undefined;
    return (
      <div key={key} className="flex items-start gap-3">
        <Checkbox
          id={`bulk-en-${key}`}
          checked={!!enabled[key]}
          onCheckedChange={(c) => setEnabled((p) => ({ ...p, [key]: !!c }))}
          className="mt-2.5"
        />
        <div className="flex-1 space-y-1">
          <Label htmlFor={`bulk-${key}`} className="text-sm">
            {FIELD_LABELS[key]}
          </Label>
          <Input
            id={`bulk-${key}`}
            type={isNumeric ? 'number' : isDate ? 'date' : 'text'}
            step={key === 'cost_per_unit' ? '0.01' : undefined}
            list={listId}
            disabled={!enabled[key]}
            value={values[key] ?? ''}
            onChange={(e) => setValues((p) => ({ ...p, [key]: e.target.value }))}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk edit {count} item{count === 1 ? '' : 's'}</DialogTitle>
          <DialogDescription>
            Check the fields you want to change. The same value will be applied to every selected item.
          </DialogDescription>
        </DialogHeader>

        <datalist id="bulk-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="bulk-vendors">
          {vendors.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>

        <div className="space-y-3">
          {(Object.keys(FIELD_LABELS) as FieldKey[]).map(renderField)}
          {enabled.item_number && (
            <p className="text-xs text-muted-foreground pl-7">
              Item # is usually unique — this will set the same value on all selected items.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!anyEnabled || isSaving}>
            {isSaving ? 'Applying…' : `Apply to ${count} item${count === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
