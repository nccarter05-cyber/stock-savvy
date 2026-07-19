import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { useInventory } from "@/hooks/useInventory";
import { useState, useEffect, useMemo } from "react";
import PackUnitsEditor from "@/components/PackUnitsEditor";
import { toBase, unitOptions, convertQty, type PackUnit } from "@/lib/units";

const EditItem = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { items, updateItem, isLoading } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [displayUnit, setDisplayUnit] = useState("");
  const [packUnits, setPackUnits] = useState<PackUnit[]>([]);
  const [entryUnit, setEntryUnit] = useState("");
  const [formValues, setFormValues] = useState({
    name: "",
    quantity: "",
    parLevel: "",
    lowStockThreshold: "",
    cost: "",
    supplier: "",
    lastShipmentDate: "",
    lastShipmentQuantity: "",
  });

  const item = items.find((i) => i.id === id);

  useEffect(() => {
    if (item) {
      const base = item.base_unit || item.unit || "";
      const disp = item.default_display_unit || base;
      const pkgs = item.pack_units || [];
      setCategory(item.category || "");
      setUnit(base);
      setDisplayUnit(disp);
      setPackUnits(pkgs);
      setEntryUnit(disp);

      // Present stored base-unit values in the display unit for editing.
      const fmt = (v: number | null) => {
        if (v == null) return "";
        const c = disp && base ? convertQty(v, base, disp, base, pkgs) : v;
        return (c ?? v).toString();
      };

      setFormValues({
        name: item.inventory_name || "",
        quantity: fmt(item.current_quantity),
        parLevel: fmt(item.inventory_maximum),
        lowStockThreshold: fmt(item.inventory_minimum),
        cost: item.cost_per_unit?.toString() || "",
        supplier: item.vendor_name || "",
        lastShipmentDate: item.last_shipment_date || "",
        lastShipmentQuantity: fmt(item.last_shipment_quantity),
      });
    }
  }, [item]);

  const availableUnits = useMemo(() => unitOptions(unit || null, packUnits), [unit, packUnits]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const costVal = parseFloat(formData.get("cost") as string);
    const qtyVal = parseFloat(formData.get("quantity") as string);
    const parVal = parseFloat(formData.get("parLevel") as string);
    const lowVal = parseFloat(formData.get("lowStockThreshold") as string);
    const shipQtyVal = parseFloat(formData.get("lastShipmentQuantity") as string);
    const shipDate = formData.get("lastShipmentDate") as string;

    const base = unit || null;
    const disp = displayUnit || base;
    const enteredIn = entryUnit || disp || base;

    const inBase = (v: number) => toBase(v, enteredIn, base, packUnits);

    const updatedItem = {
      id,
      inventory_name: formData.get("name") as string,
      category: category || null,
      unit: base,
      base_unit: base,
      default_display_unit: disp,
      pack_units: packUnits,
      cost_per_unit: isNaN(costVal) ? null : costVal,
      last_shipment_date: shipDate || null,
      last_shipment_quantity: isNaN(shipQtyVal) ? null : inBase(shipQtyVal),
      vendor_name: (formData.get("supplier") as string) || null,
      current_quantity: isNaN(qtyVal) ? 0 : inBase(qtyVal),
      inventory_maximum: isNaN(parVal) ? null : inBase(parVal),
      inventory_minimum: isNaN(lowVal) ? null : inBase(lowVal),
    };

    updateItem(updatedItem, {
      onSuccess: () => navigate("/inventory"),
      onSettled: () => setIsSubmitting(false),
    });
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

  if (!item) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Item Not Found</h2>
          <p className="text-muted-foreground mb-6">The item you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/inventory")}>Back to Inventory</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Edit Item</h2>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter item name"
                  value={formValues.name}
                  onChange={(e) => setFormValues(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Produce">Produce</SelectItem>
                    <SelectItem value="Meat">Meat</SelectItem>
                    <SelectItem value="Dairy">Dairy</SelectItem>
                    <SelectItem value="Dry Goods">Dry Goods</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Base Unit</Label>
                  <Select value={unit} onValueChange={(v) => { setUnit(v); if (!displayUnit) setDisplayUnit(v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="case">case</SelectItem>
                      <SelectItem value="each">each</SelectItem>
                      <SelectItem value="gallon">gallon</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="l">l</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Stock is stored in this unit.</p>
                </div>

                <div className="space-y-2">
                  <Label>Display Unit</Label>
                  <Select value={displayUnit} onValueChange={setDisplayUnit} disabled={!unit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Same as base" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {unit && (
                <PackUnitsEditor baseUnit={unit} value={packUnits} onChange={setPackUnits} />
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity" name="quantity" type="number" step="0.01" placeholder="0"
                    value={formValues.quantity}
                    onChange={(e) => setFormValues(p => ({ ...p, quantity: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entered in</Label>
                  <Select value={entryUnit || (displayUnit || unit)} onValueChange={setEntryUnit} disabled={!unit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parLevel">Par Level</Label>
                  <Input
                    id="parLevel" name="parLevel" type="number" step="0.01" placeholder="0"
                    value={formValues.parLevel}
                    onChange={(e) => setFormValues(p => ({ ...p, parLevel: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold" className="text-sm">Low Stock Alert</Label>
                <Input
                  id="lowStockThreshold" name="lowStockThreshold" type="number" step="0.01" placeholder="0"
                  value={formValues.lowStockThreshold}
                  onChange={(e) => setFormValues(p => ({ ...p, lowStockThreshold: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Numbers are entered in the unit selected above and stored in the base unit.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost Per Base Unit</Label>
                <Input
                  id="cost" name="cost" type="number" step="0.01" placeholder="0.00"
                  value={formValues.cost}
                  onChange={(e) => setFormValues(p => ({ ...p, cost: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier" name="supplier" placeholder="Enter supplier name"
                  value={formValues.supplier}
                  onChange={(e) => setFormValues(p => ({ ...p, supplier: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lastShipmentDate" className="text-sm">Last Shipment</Label>
                  <Input
                    id="lastShipmentDate" name="lastShipmentDate" type="date"
                    value={formValues.lastShipmentDate}
                    onChange={(e) => setFormValues(p => ({ ...p, lastShipmentDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastShipmentQuantity" className="text-sm">Qty Received</Label>
                  <Input
                    id="lastShipmentQuantity" name="lastShipmentQuantity" type="number" step="0.01" placeholder="0"
                    value={formValues.lastShipmentQuantity}
                    onChange={(e) => setFormValues(p => ({ ...p, lastShipmentQuantity: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/inventory")} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditItem;
