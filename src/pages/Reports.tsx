import { useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventory, type InventoryItemWithQuantity } from '@/hooks/useInventory';
import { FileText, Printer, Download } from 'lucide-react';
import { ceilToUnit, formatQty } from '@/lib/units';

interface OrderRow extends InventoryItemWithQuantity {
  needed_base: number;
  order_qty: number;
  order_unit: string;
}

const Reports = () => {
  const { items, isLoading } = useInventory();
  const [generated, setGenerated] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const grouped = useMemo(() => {
    const rows: OrderRow[] = items
      .filter(i => i.inventory_minimum != null && i.current_quantity < (i.inventory_minimum || 0))
      .map(i => {
        const needed_base = (i.inventory_minimum || 0) - i.current_quantity;
        const { qty, unit } = ceilToUnit(needed_base, i.base_unit, i.default_display_unit, i.pack_units);
        return { ...i, needed_base, order_qty: qty, order_unit: unit };
      });

    const map = new Map<string, OrderRow[]>();
    for (const r of rows) {
      const key = r.vendor_name || 'No Vendor';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    const sorted = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([vendor, list]) => ({
        vendor,
        items: list.sort((a, b) => a.inventory_name.localeCompare(b.inventory_name)),
        subtotal: list.reduce((s, r) => s + r.order_qty, 0),
      }));
    const grandTotal = rows.reduce((s, r) => s + r.order_qty, 0);
    return { sections: sorted, grandTotal, totalItems: rows.length };
  }, [items]);

  const handleGenerate = () => {
    setGenerated(true);
    setGeneratedAt(new Date());
  };

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const header = ['Vendor', 'Item #', 'Item Name', 'Current', 'Minimum', 'Order Qty', 'Order Unit'];
    const escape = (v: any) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(',')];
    for (const section of grouped.sections) {
      for (const r of section.items) {
        lines.push([
          section.vendor,
          r.item_number || '',
          r.inventory_name,
          formatQty(r.current_quantity, r.base_unit, r.default_display_unit, r.pack_units),
          r.inventory_minimum != null ? formatQty(r.inventory_minimum, r.base_unit, r.default_display_unit, r.pack_units) : '',
          r.order_qty,
          r.order_unit,
        ].map(escape).join(','));
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d = (generatedAt || new Date()).toISOString().slice(0, 10);
    a.download = `order-sheet-${d}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="no-print flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" />
              Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate an order report based on current stock levels.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={isLoading}>
              <FileText className="h-4 w-4" />
              Generate Order Report
            </Button>
            {generated && (
              <>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </>
            )}
          </div>
        </div>

        {!generated && (
          <Card className="no-print">
            <CardContent className="py-12 text-center text-muted-foreground">
              Click <span className="font-medium text-foreground">Generate Order Report</span> to build your Order Sheet.
            </CardContent>
          </Card>
        )}

        {generated && (
          <div className="print-area space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-3xl font-bold">Order Sheet</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Generated:{' '}
                {(generatedAt || new Date()).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {grouped.totalItems} item{grouped.totalItems === 1 ? '' : 's'} to order ·{' '}
                {grouped.grandTotal} total units
              </p>
            </div>

            {grouped.sections.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  All stock levels are at or above their minimums. Nothing to order.
                </CardContent>
              </Card>
            ) : (
              grouped.sections.map(section => (
                <Card key={section.vendor} className="avoid-break">
                  <CardHeader>
                    <CardTitle className="flex items-baseline justify-between">
                      <span>{section.vendor}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        Subtotal: {section.subtotal} units
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item #</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead className="text-right">Current</TableHead>
                          <TableHead className="text-right">Min</TableHead>
                          <TableHead className="text-right">Need to Order</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.items.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{r.item_number || '-'}</TableCell>
                            <TableCell className="font-medium">{r.inventory_name}</TableCell>
                            <TableCell className="text-right">{r.current_quantity}</TableCell>
                            <TableCell className="text-right">{r.inventory_minimum}</TableCell>
                            <TableCell className="text-right font-bold">{r.needed}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}

            {grouped.sections.length > 0 && (
              <div className="flex justify-end border-t pt-4">
                <div className="text-lg font-bold">
                  Grand Total: {grouped.grandTotal} units
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
