import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import type { PackUnit } from '@/lib/units';

interface Props {
  baseUnit: string;
  value: PackUnit[];
  onChange: (next: PackUnit[]) => void;
}

// Editor for alternate units of measure (e.g. "1 case = 24 each").
// Base unit is set separately; here users define how other units relate to it.
export default function PackUnitsEditor({ baseUnit, value, onChange }: Props) {
  const [newUnit, setNewUnit] = useState('');
  const [newPer, setNewPer] = useState('');

  const add = () => {
    const unit = newUnit.trim();
    const per = parseFloat(newPer);
    if (!unit || !Number.isFinite(per) || per <= 0) return;
    if (value.some(v => v.unit === unit)) return;
    onChange([...value, { unit, per_base: per }]);
    setNewUnit('');
    setNewPer('');
  };

  const remove = (unit: string) => onChange(value.filter(v => v.unit !== unit));

  const updatePer = (unit: string, per: number) => {
    onChange(value.map(v => (v.unit === unit ? { ...v, per_base: per } : v)));
  };

  return (
    <div className="space-y-2 border rounded-md p-3 bg-muted/30">
      <div>
        <Label className="text-sm">Pack sizes</Label>
        <p className="text-xs text-muted-foreground">
          Define how other units relate to <span className="font-medium">{baseUnit || '(base unit)'}</span>.
          Example: 1 case = 24 {baseUnit || 'each'}.
        </p>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map(p => (
            <div key={p.unit} className="flex items-center gap-2 text-sm">
              <span className="w-8 text-muted-foreground">1</span>
              <span className="min-w-16 font-medium">{p.unit}</span>
              <span className="text-muted-foreground">=</span>
              <Input
                type="number"
                step="0.0001"
                value={p.per_base}
                onChange={(e) => updatePer(p.unit, parseFloat(e.target.value) || 0)}
                className="w-24 h-8"
              />
              <span className="text-muted-foreground">{baseUnit || 'base'}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => remove(p.unit)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 pt-1">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Unit name</Label>
          <Input placeholder="case" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="h-8" />
        </div>
        <div className="w-28 space-y-1">
          <Label className="text-xs">Per {baseUnit || 'base'}</Label>
          <Input
            type="number"
            step="0.0001"
            placeholder="24"
            value={newPer}
            onChange={(e) => setNewPer(e.target.value)}
            className="h-8"
          />
        </div>
        <Button type="button" size="sm" onClick={add} disabled={!baseUnit || !newUnit.trim() || !newPer}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
