import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useInventory } from "@/hooks/useInventory";
import { useState } from "react";

const AddItem = () => {
  const navigate = useNavigate();
  const { addItem } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const newItem = {
      inventory_name: formData.get("name") as string,
      category: category,
      unit: unit,
      cost_per_unit: parseFloat(formData.get("cost") as string),
      last_shipment_date: formData.get("lastShipmentDate") as string,
      last_shipment_quantity: parseFloat(formData.get("lastShipmentQuantity") as string),
      vendor_name: formData.get("supplier") as string,
      current_quantity: parseFloat(formData.get("quantity") as string),
      inventory_maximum: parseFloat(formData.get("parLevel") as string),
      inventory_minimum: parseFloat(formData.get("lowStockThreshold") as string),
    };

    addItem(newItem, {
      onSuccess: () => {
        navigate("/inventory");
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-foreground">Add New Item</h2>

        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" name="name" placeholder="Enter item name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.01" placeholder="0" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={unit} onValueChange={setUnit} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="case">case</SelectItem>
                      <SelectItem value="each">each</SelectItem>
                      <SelectItem value="gallon">gallon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parLevel">Par Level</Label>
                  <Input id="parLevel" name="parLevel" type="number" step="0.01" placeholder="0" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Alert Level</Label>
                  <Input id="lowStockThreshold" name="lowStockThreshold" type="number" step="0.01" placeholder="0" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost Per Unit</Label>
                <Input id="cost" name="cost" type="number" step="0.01" placeholder="0.00" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input id="supplier" name="supplier" placeholder="Enter supplier name" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastShipmentDate">Last Shipment Date</Label>
                  <Input id="lastShipmentDate" name="lastShipmentDate" type="date" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastShipmentQuantity">Quantity Received</Label>
                  <Input id="lastShipmentQuantity" name="lastShipmentQuantity" type="number" step="0.01" placeholder="0" required />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Item"}
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

export default AddItem;
