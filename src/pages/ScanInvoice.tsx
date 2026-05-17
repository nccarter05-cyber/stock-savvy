import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ScanLine, Trash2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { InvoiceCameraCapture } from '@/components/InvoiceCameraCapture';
import { useScanInvoice, type ReviewRow } from '@/hooks/useScanInvoice';
import { useVendors } from '@/hooks/useVendors';
import { useInventory } from '@/hooks/useInventory';

const NEW_VENDOR = '__new__';

type Stage = 'capture' | 'review';

const ScanInvoice = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('capture');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [invoiceDate, setInvoiceDate] = useState('');

  const { extractFromImages, importRows, isExtracting, isImporting } = useScanInvoice();
  const { vendors } = useVendors();
  const { items: inventory } = useInventory();

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddImages = (files: File[]) => {
    const next = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...next]);
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleExtract = async () => {
    if (images.length === 0) return;
    const extracted = await extractFromImages(images.map((i) => i.file));
    if (extracted.length > 0) {
      setRows(extracted);
      setStage('review');
    }
  };

  const updateRow = (id: string, patch: Partial<ReviewRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleImport = async () => {
    const result = await importRows(rows, invoiceDate);
    if (result.success > 0) {
      navigate('/inventory');
    }
  };

  const unmatchedCount = rows.filter((r) => r.matchStatus === 'unmatched').length;

  const renderCapture = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="h-5 w-5" />
          Scan Invoice
        </CardTitle>
        <CardDescription>
          Take a photo of an invoice, packing slip, or receipt. AI will extract the line items so you can review and import them into inventory.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <InvoiceCameraCapture
          images={images}
          onAdd={handleAddImages}
          onRemove={handleRemoveImage}
          disabled={isExtracting}
        />

        <Button
          className="w-full"
          size="lg"
          disabled={images.length === 0 || isExtracting}
          onClick={handleExtract}
        >
          {isExtracting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Reading invoice...
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4 mr-2" />
              Extract Line Items
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderReview = () => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Review Extracted Items</CardTitle>
            <CardDescription>
              {rows.length} item{rows.length === 1 ? '' : 's'} found
              {unmatchedCount > 0 && (
                <> &middot; <span className="text-amber-600 dark:text-amber-400 font-medium">{unmatchedCount} need matching</span></>
              )}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStage('capture')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:max-w-xs gap-1">
          <Label htmlFor="invoice-date">Invoice Date</Label>
          <Input
            id="invoice-date"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`border rounded-lg p-3 space-y-2 ${
                row.matchStatus === 'unmatched' ? 'border-amber-500/50 bg-amber-500/5' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <Badge variant={row.matchStatus === 'matched' ? 'secondary' : 'destructive'} className="text-xs">
                  {row.matchStatus === 'matched' ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Matched</>
                  ) : (
                    <><AlertTriangle className="h-3 w-3 mr-1" /> Needs match</>
                  )}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Item Name</Label>
                  <Input
                    value={row.item_name}
                    onChange={(e) => updateRow(row.id, { item_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Item Number</Label>
                  <Input
                    value={row.item_number}
                    onChange={(e) => updateRow(row.id, { item_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Input
                    value={row.unit}
                    onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={row.unit_price}
                    onChange={(e) => updateRow(row.id, { unit_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Vendor</Label>
                  <Select
                    value={row.vendor_id ?? NEW_VENDOR}
                    onValueChange={(v) => {
                      if (v === NEW_VENDOR) updateRow(row.id, { vendor_id: null });
                      else updateRow(row.id, { vendor_id: v, new_vendor_name: '' });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.vendor_name}</SelectItem>
                      ))}
                      <SelectItem value={NEW_VENDOR}>+ Add new vendor</SelectItem>
                    </SelectContent>
                  </Select>
                  {row.vendor_id === null && (
                    <Input
                      className="mt-1"
                      placeholder="New vendor name"
                      value={row.new_vendor_name}
                      onChange={(e) => updateRow(row.id, { new_vendor_name: e.target.value })}
                    />
                  )}
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-xs">Action</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={row.mode === 'match' ? 'default' : 'outline'}
                    onClick={() => updateRow(row.id, { mode: 'match' })}
                    className="flex-1"
                  >
                    Match existing
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={row.mode === 'create' ? 'default' : 'outline'}
                    onClick={() => updateRow(row.id, { mode: 'create', matched_inventory_id: null })}
                    className="flex-1"
                  >
                    Create new
                  </Button>
                </div>
                {row.mode === 'match' && (
                  <Select
                    value={row.matched_inventory_id ?? ''}
                    onValueChange={(v) => updateRow(row.id, {
                      matched_inventory_id: v,
                      matchStatus: 'matched',
                    })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select inventory item to add to" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.inventory_name}
                          {item.vendor_name ? ` — ${item.vendor_name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 sticky bottom-20 md:bottom-4 bg-background pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setStage('capture')}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleImport}
            disabled={isImporting || rows.length === 0}
          >
            {isImporting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
            ) : (
              `Import ${rows.length} ${rows.length === 1 ? 'item' : 'items'}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {stage === 'capture' ? renderCapture() : renderReview()}
      </div>
    </Layout>
  );
};

export default ScanInvoice;
