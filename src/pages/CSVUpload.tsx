import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCSVUpload, type CSVRow, type ValidatedRow } from '@/hooks/useCSVUpload';

const CSVUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CSVRow[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  const { parseCSV, validateRows, importRows, isLoading, isValidating } = useCSVUpload();

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      return;
    }

    setFile(selectedFile);
    setImportComplete(false);
    setValidatedRows([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const rows = parseCSV(content);
      setParsedRows(rows);
      
      if (rows.length > 0) {
        const validated = await validateRows(rows);
        setValidatedRows(validated);
      }
    };
    reader.readAsText(selectedFile);
  }, [parseCSV, validateRows]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    const validRows = validatedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    await importRows(validatedRows);
    setImportComplete(true);
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setValidatedRows([]);
    setImportComplete(false);
  };

  const validCount = validatedRows.filter(r => r.isValid).length;
  const invalidCount = validatedRows.filter(r => !r.isValid).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">CSV Upload</h1>
          <p className="text-muted-foreground mt-1">Import inventory data from a spreadsheet</p>
        </div>

        {/* Upload Area */}
        {!file && (
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file with columns: inventory_name, vendor_name, current_quantity, 
                inventory_maximum (optional), inventory_minimum (optional), email (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                <p className="text-muted-foreground mb-4">or click to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleInputChange}
                  className="hidden"
                  id="csv-upload"
                />
                <Button asChild>
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Select CSV File
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Info & Actions */}
        {file && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{file.name}</CardTitle>
                    <CardDescription>{parsedRows.length} rows found</CardDescription>
                  </div>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Upload Different File
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Validation Summary */}
        {validatedRows.length > 0 && !importComplete && (
          <div className="flex flex-wrap gap-3">
            <Badge variant="default" className="text-sm py-1 px-3">
              <CheckCircle className="h-4 w-4 mr-1" />
              {validCount} valid
            </Badge>
            {invalidCount > 0 && (
              <Badge variant="destructive" className="text-sm py-1 px-3">
                <XCircle className="h-4 w-4 mr-1" />
                {invalidCount} with errors
              </Badge>
            )}
          </div>
        )}

        {/* Import Complete */}
        {importComplete && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Import Complete</AlertTitle>
            <AlertDescription>
              Your inventory data has been imported successfully.
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Table */}
        {validatedRows.length > 0 && !importComplete && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Review your data before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Inventory Name</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedRows.map((row, index) => (
                      <TableRow key={index} className={!row.isValid ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.inventory_name}</TableCell>
                        <TableCell>
                          {row.vendor_id ? (
                            <span className="text-foreground">{row.vendor_name}</span>
                          ) : (
                            <span className="text-destructive">{row.vendor_name || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{row.current_quantity}</TableCell>
                        <TableCell className="text-right">{row.inventory_maximum || '—'}</TableCell>
                        <TableCell className="text-right">{row.inventory_minimum || '—'}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 && (
                            <span className="text-sm text-destructive">
                              {row.errors.join('; ')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end mt-6 gap-3">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={validCount === 0 || isLoading}
                >
                  {isLoading ? 'Importing...' : `Import ${validCount} Items`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isValidating && (
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <span>Validating data...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CSV Format Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Required columns:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1 rounded">inventory_name</code> - Name of the inventory item</li>
                <li><code className="bg-muted px-1 rounded">vendor_name</code> - Must match an existing vendor</li>
                <li><code className="bg-muted px-1 rounded">current_quantity</code> - Current stock level</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Optional columns:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1 rounded">inventory_maximum</code> - Par level / maximum stock</li>
                <li><code className="bg-muted px-1 rounded">inventory_minimum</code> - Low stock alert threshold</li>
                <li><code className="bg-muted px-1 rounded">email</code> - For reference only (imports use your account)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CSVUpload;
