import React, { useState, useRef } from 'react';
import { formatDateTime } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Loader2, CheckCircle, AlertCircle, Database, FileJson, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Tables that can be exported/imported
const EXPORTABLE_TABLES = [
  { key: 'module_registry', label: 'Module Registry', critical: true },
  { key: 'subscription_plans', label: 'Subscription Plans', critical: true },
  { key: 'plan_modules', label: 'Plan Modules', critical: true },
  { key: 'organizations', label: 'Organizations', critical: false },
  { key: 'schools', label: 'Schools/Branches', critical: false },
  { key: 'roles', label: 'Roles', critical: false },
  { key: 'role_permissions', label: 'Role Permissions', critical: false },
  { key: 'sessions', label: 'Academic Sessions', critical: false },
  { key: 'system_settings', label: 'System Settings', critical: true },
];

const ExportImport = () => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  // Export State
  const [selectedTables, setSelectedTables] = useState(
    EXPORTABLE_TABLES.filter(t => t.critical).map(t => t.key)
  );
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Import State
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importPreview, setImportPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // Toggle table selection
  const toggleTable = (tableKey) => {
    setSelectedTables(prev => 
      prev.includes(tableKey) 
        ? prev.filter(t => t !== tableKey)
        : [...prev, tableKey]
    );
  };

  // Select all / Deselect all
  const toggleAll = (selectAll) => {
    setSelectedTables(selectAll ? EXPORTABLE_TABLES.map(t => t.key) : []);
  };

  // Export Data
  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Select at least one table to export' });
      return;
    }

    setExporting(true);
    setExportProgress(0);

    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: 'Master Admin',
        tables: {}
      };

      for (let i = 0; i < selectedTables.length; i++) {
        const tableName = selectedTables[i];
        setExportProgress(Math.round(((i + 1) / selectedTables.length) * 100));

        const { data, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) {
          console.error(`Error exporting ${tableName}:`, error);
          exportData.tables[tableName] = { error: error.message, count: 0 };
        } else {
          exportData.tables[tableName] = { data, count: data?.length || 0 };
        }
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jashchar_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ 
        title: 'Export Complete', 
        description: `Exported ${selectedTables.length} tables successfully` 
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: error.message });
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a JSON backup file' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.version || !data.tables) {
          throw new Error('Invalid backup file format');
        }

        setImportFile(file);
        setImportPreview({
          version: data.version,
          exportedAt: data.exportedAt,
          tables: Object.keys(data.tables).map(key => ({
            name: key,
            count: data.tables[key].count || 0,
            hasError: !!data.tables[key].error
          }))
        });
        setImportResult(null);

      } catch (err) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Could not parse backup file' });
        setImportFile(null);
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Import Data
  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const data = JSON.parse(e.target.result);
        const results = { success: [], failed: [] };
        const tableNames = Object.keys(data.tables);

        for (let i = 0; i < tableNames.length; i++) {
          const tableName = tableNames[i];
          const tableData = data.tables[tableName];
          setImportProgress(Math.round(((i + 1) / tableNames.length) * 100));

          if (tableData.error || !tableData.data || tableData.data.length === 0) {
            results.failed.push({ table: tableName, reason: 'No data or export error' });
            continue;
          }

          try {
            // Use upsert for safe import (won't fail on duplicates)
            const { error } = await supabase
              .from(tableName)
              .upsert(tableData.data, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });

            if (error) {
              results.failed.push({ table: tableName, reason: error.message });
            } else {
              results.success.push({ table: tableName, count: tableData.data.length });
            }
          } catch (err) {
            results.failed.push({ table: tableName, reason: err.message });
          }
        }

        setImportResult(results);
        setImporting(false);
        setImportProgress(0);

        if (results.failed.length === 0) {
          toast({ title: 'Import Complete', description: `Successfully imported ${results.success.length} tables` });
        } else {
          toast({ 
            variant: 'warning', 
            title: 'Import Partially Complete', 
            description: `${results.success.length} succeeded, ${results.failed.length} failed` 
          });
        }
      };

      reader.readAsText(importFile);

    } catch (error) {
      console.error('Import failed:', error);
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
      setImporting(false);
      setImportProgress(0);
    }
  };

  // Reset import state
  const resetImport = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">System Export / Import</h1>
            <p className="text-muted-foreground">Backup and restore system configuration data</p>
          </div>
        </div>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" /> Export Data
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" /> Import Data
            </TabsTrigger>
          </TabsList>

          {/* EXPORT TAB */}
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Export Database Tables
                </CardTitle>
                <CardDescription>
                  Select tables to export as a JSON backup file. Critical tables are pre-selected.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Select All / Deselect All */}
                  <div className="flex gap-4 pb-2 border-b">
                    <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                      Deselect All
                    </Button>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {selectedTables.length} of {EXPORTABLE_TABLES.length} selected
                    </span>
                  </div>

                  {/* Table Checkboxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {EXPORTABLE_TABLES.map(table => (
                      <div key={table.key} className="flex items-center space-x-2 p-2 rounded border hover:bg-muted/50">
                        <Checkbox 
                          id={table.key}
                          checked={selectedTables.includes(table.key)}
                          onCheckedChange={() => toggleTable(table.key)}
                        />
                        <Label htmlFor={table.key} className="flex-1 cursor-pointer">
                          {table.label}
                          {table.critical && (
                            <span className="ml-2 text-xs text-orange-500">(Critical)</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  {exporting && (
                    <div className="space-y-2">
                      <Progress value={exportProgress} />
                      <p className="text-sm text-muted-foreground text-center">
                        Exporting... {exportProgress}%
                      </p>
                    </div>
                  )}

                  {/* Export Button */}
                  <Button 
                    onClick={handleExport} 
                    disabled={exporting || selectedTables.length === 0}
                    className="w-full"
                  >
                    {exporting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" /> Download Backup ({selectedTables.length} tables)</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IMPORT TAB */}
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Database Backup
                </CardTitle>
                <CardDescription>
                  Restore system configuration from a previously exported JSON backup file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Warning Alert */}
                  <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Warning</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      Importing will overwrite existing data. Make sure to export a backup first.
                    </AlertDescription>
                  </Alert>

                  {/* File Upload Area */}
                  {!importPreview && (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Drag and drop your backup file here, or click to select.
                      </p>
                      <p className="mt-1 text-xs text-gray-400">Only .json files are supported</p>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".json"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                  )}

                  {/* Import Preview */}
                  {importPreview && !importResult && (
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{importFile?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Version: {importPreview.version} | 
                              Exported: {formatDateTime(importPreview.exportedAt)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={resetImport}>
                            <RefreshCw className="h-4 w-4 mr-1" /> Change File
                          </Button>
                        </div>
                      </div>

                      <div className="border rounded-lg divide-y">
                        <div className="p-3 bg-muted font-medium">
                          Tables to Import ({importPreview.tables.length})
                        </div>
                        {importPreview.tables.map(table => (
                          <div key={table.name} className="p-3 flex justify-between items-center">
                            <span>{table.name}</span>
                            <span className={`text-sm ${table.hasError ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {table.hasError ? 'Error in export' : `${table.count} records`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Progress */}
                      {importing && (
                        <div className="space-y-2">
                          <Progress value={importProgress} />
                          <p className="text-sm text-muted-foreground text-center">
                            Importing... {importProgress}%
                          </p>
                        </div>
                      )}

                      <Button 
                        onClick={handleImport} 
                        disabled={importing}
                        className="w-full"
                      >
                        {importing ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                        ) : (
                          <><Upload className="mr-2 h-4 w-4" /> Start Import</>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Import Results */}
                  {importResult && (
                    <div className="space-y-4">
                      <Alert variant={importResult.failed.length === 0 ? 'default' : 'warning'} 
                             className={importResult.failed.length === 0 ? 'bg-green-50 border-green-200' : ''}>
                        <CheckCircle className={`h-4 w-4 ${importResult.failed.length === 0 ? 'text-green-600' : ''}`} />
                        <AlertTitle>Import Complete</AlertTitle>
                        <AlertDescription>
                          {importResult.success.length} tables imported successfully
                          {importResult.failed.length > 0 && `, ${importResult.failed.length} failed`}
                        </AlertDescription>
                      </Alert>

                      {importResult.success.length > 0 && (
                        <div className="border rounded-lg">
                          <div className="p-3 bg-green-50 font-medium text-green-800">
                            ✓ Successful ({importResult.success.length})
                          </div>
                          {importResult.success.map(item => (
                            <div key={item.table} className="p-2 px-3 border-t flex justify-between">
                              <span>{item.table}</span>
                              <span className="text-muted-foreground">{item.count} records</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {importResult.failed.length > 0 && (
                        <div className="border rounded-lg border-red-200">
                          <div className="p-3 bg-red-50 font-medium text-red-800">
                            ✗ Failed ({importResult.failed.length})
                          </div>
                          {importResult.failed.map(item => (
                            <div key={item.table} className="p-2 px-3 border-t text-sm">
                              <span className="font-medium">{item.table}</span>
                              <span className="text-red-500 ml-2">- {item.reason}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button variant="outline" onClick={resetImport} className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" /> Import Another File
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ExportImport;
