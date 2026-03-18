import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package, Plus, Edit, Trash2, Loader2, RefreshCw, AlertTriangle
} from 'lucide-react';

const CATEGORIES = [
  { value: 'grain', label: '🌾 Grain' },
  { value: 'vegetable', label: '🥬 Vegetable' },
  { value: 'dairy', label: '🥛 Dairy' },
  { value: 'spice', label: '🌶️ Spice' },
  { value: 'oil', label: '🫒 Oil' },
  { value: 'other', label: '📦 Other' }
];
const UNITS = ['kg', 'litre', 'packet', 'dozen', 'piece'];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

const MessInventory = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [inventory, setInventory] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    item_name: '', item_category: 'grain', unit: 'kg',
    current_stock: '', minimum_stock: '', unit_cost: '',
    last_purchase_date: '', last_purchase_qty: ''
  });

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel/list');
      if (res.data?.success) {
        const list = res.data.data || [];
        setHostels(list);
        if (list.length > 0 && !selectedHostel) setSelectedHostel(list[0].id);
      }
    } catch (err) { console.error('Error:', err); }
  }, [branchId, selectedHostel]);

  const fetchInventory = useCallback(async () => {
    if (!branchId || !selectedHostel) return;
    setLoading(true);
    try {
      const params = { hostelId: selectedHostel };
      if (categoryFilter !== 'all') params.category = categoryFilter;
      const res = await api.get('/hostel-mess/inventory', { params });
      if (res.data?.success) setInventory(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, selectedHostel, categoryFilter, toast]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);
  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const openAddDialog = () => {
    setEditItem(null);
    setForm({ item_name: '', item_category: 'grain', unit: 'kg', current_stock: '', minimum_stock: '', unit_cost: '', last_purchase_date: '', last_purchase_qty: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditItem(item);
    setForm({
      item_name: item.item_name, item_category: item.item_category, unit: item.unit,
      current_stock: String(item.current_stock || ''), minimum_stock: String(item.minimum_stock || ''),
      unit_cost: String(item.unit_cost || ''), last_purchase_date: item.last_purchase_date || '',
      last_purchase_qty: String(item.last_purchase_qty || '')
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.item_name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Item name is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        hostel_id: selectedHostel,
        item_name: form.item_name.trim(),
        item_category: form.item_category,
        unit: form.unit,
        current_stock: parseFloat(form.current_stock) || 0,
        minimum_stock: parseFloat(form.minimum_stock) || 0,
        unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null,
        last_purchase_date: form.last_purchase_date || null,
        last_purchase_qty: form.last_purchase_qty ? parseFloat(form.last_purchase_qty) : null
      };

      if (editItem) {
        await api.put(`/hostel-mess/inventory/${editItem.id}`, payload);
        toast({ title: 'Item updated' });
      } else {
        await api.post('/hostel-mess/inventory', payload);
        toast({ title: 'Item added' });
      }
      setDialogOpen(false);
      fetchInventory();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || err.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this inventory item?')) return;
    try {
      await api.delete(`/hostel-mess/inventory/${id}`);
      toast({ title: 'Item removed' });
      fetchInventory();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const isLowStock = (item) => parseFloat(item.current_stock) <= parseFloat(item.minimum_stock);
  const lowStockCount = inventory.filter(isLowStock).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-teal-600" /> Mess Inventory
            </h1>
            <p className="text-muted-foreground mt-1">Manage kitchen stock & supplies</p>
          </div>
          <Button onClick={openAddDialog} disabled={!selectedHostel}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm font-medium">Hostel</label>
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Hostel" /></SelectTrigger>
              <SelectContent>
                {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInventory} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="py-1 px-3">
              <AlertTriangle className="h-3 w-3 mr-1" /> {lowStockCount} low stock items
            </Badge>
          )}
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
        ) : !selectedHostel ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Select a hostel first</CardContent></Card>
        ) : inventory.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No inventory items. Click "Add Item" to start.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Min Stock</TableHead>
                    <TableHead className="text-right">Unit Cost (₹)</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item, idx) => {
                    const low = isLowStock(item);
                    return (
                      <TableRow key={item.id} className={low ? 'bg-red-50' : ''}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {item.item_name}
                          {low && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
                        </TableCell>
                        <TableCell>{CAT_MAP[item.item_category] || item.item_category}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className={`text-right font-bold ${low ? 'text-red-600' : ''}`}>{item.current_stock}</TableCell>
                        <TableCell className="text-right">{item.minimum_stock}</TableCell>
                        <TableCell className="text-right">{item.unit_cost ? `₹${item.unit_cost}` : '-'}</TableCell>
                        <TableCell>{item.last_purchase_date ? formatDate(item.last_purchase_date) : '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(item)}><Edit className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Item Name *</Label>
                <Input value={form.item_name} onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g. Rice, Dal, Milk" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={form.item_category} onValueChange={v => setForm(p => ({ ...p, item_category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Stock</Label>
                  <Input type="number" step="0.01" value={form.current_stock} onChange={e => setForm(p => ({ ...p, current_stock: e.target.value }))} />
                </div>
                <div>
                  <Label>Minimum Stock</Label>
                  <Input type="number" step="0.01" value={form.minimum_stock} onChange={e => setForm(p => ({ ...p, minimum_stock: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Unit Cost (₹)</Label>
                <Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm(p => ({ ...p, unit_cost: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Last Purchase Date</Label>
                  <Input type="date" value={form.last_purchase_date} onChange={e => setForm(p => ({ ...p, last_purchase_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Last Purchase Qty</Label>
                  <Input type="number" step="0.01" value={form.last_purchase_qty} onChange={e => setForm(p => ({ ...p, last_purchase_qty: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.item_name.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} {editItem ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MessInventory;
