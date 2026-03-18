import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  CalendarDays, Plus, Edit, Trash2, Loader2, RefreshCw, UtensilsCrossed
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'];
const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snacks: '🍪 Snacks', dinner: '🌙 Dinner' };
const MEAL_COLORS = { breakfast: 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700', lunch: 'bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700', snacks: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700', dinner: 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700' };

const WeeklyMenu = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    day_of_week: 1, meal_type: 'breakfast', menu_items_text: '',
    special_item: '', meal_start_time: '08:00', meal_end_time: '09:00'
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

  const fetchMenu = useCallback(async () => {
    if (!branchId || !selectedHostel) return;
    setLoading(true);
    try {
      const res = await api.get('/hostel-mess/menu', { params: { hostelId: selectedHostel } });
      if (res.data?.success) setMenuItems(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, selectedHostel, toast]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);
  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const parseMenuItems = (text) => {
    return text.split('\n').filter(l => l.trim()).map(line => {
      const parts = line.split('-').map(p => p.trim());
      return { name: parts[0] || line.trim(), qty: parts[1] || '' };
    });
  };

  const formatMenuItems = (items) => {
    return (items || []).map(i => i.qty ? `${i.name} - ${i.qty}` : i.name).join('\n');
  };

  const openAddDialog = (dayOfWeek, mealType) => {
    setEditItem(null);
    setForm({
      day_of_week: dayOfWeek, meal_type: mealType, menu_items_text: '',
      special_item: '',
      meal_start_time: mealType === 'breakfast' ? '07:30' : mealType === 'lunch' ? '12:30' : mealType === 'snacks' ? '16:00' : '19:30',
      meal_end_time: mealType === 'breakfast' ? '08:30' : mealType === 'lunch' ? '13:30' : mealType === 'snacks' ? '16:30' : '20:30'
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditItem(item);
    setForm({
      day_of_week: item.day_of_week, meal_type: item.meal_type,
      menu_items_text: formatMenuItems(item.menu_items),
      special_item: item.special_item || '',
      meal_start_time: item.meal_start_time, meal_end_time: item.meal_end_time
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        hostel_id: selectedHostel,
        day_of_week: parseInt(form.day_of_week),
        meal_type: form.meal_type,
        menu_items: parseMenuItems(form.menu_items_text),
        special_item: form.special_item || null,
        meal_start_time: form.meal_start_time,
        meal_end_time: form.meal_end_time
      };

      if (editItem) {
        await api.put(`/hostel-mess/menu/${editItem.id}`, payload);
        toast({ title: 'Menu updated' });
      } else {
        await api.post('/hostel-mess/menu', payload);
        toast({ title: 'Menu item added' });
      }
      setDialogOpen(false);
      fetchMenu();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || err.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/hostel-mess/menu/${id}`);
      toast({ title: 'Menu item deleted' });
      fetchMenu();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const getMenuForCell = (dayIdx, mealType) => menuItems.find(m => m.day_of_week === dayIdx && m.meal_type === mealType);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-orange-600" /> Weekly Menu
            </h1>
            <p className="text-muted-foreground mt-1">Configure weekly mess menu</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Hostel" /></SelectTrigger>
              <SelectContent>
                {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchMenu} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {!selectedHostel ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Select a hostel to view/edit menu</CardContent></Card>
        ) : loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-100 dark:bg-gray-800 text-left w-24">Day</th>
                  {MEAL_TYPES.map(mt => (
                    <th key={mt} className="border p-2 bg-gray-100 dark:bg-gray-800 text-center">{MEAL_LABELS[mt]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, dayIdx) => (
                  <tr key={dayIdx}>
                    <td className="border p-2 font-medium bg-gray-50 dark:bg-gray-800">{day}</td>
                    {MEAL_TYPES.map(mt => {
                      const item = getMenuForCell(dayIdx, mt);
                      return (
                        <td key={mt} className={`border p-2 min-w-[180px] ${item ? MEAL_COLORS[mt] : 'bg-white dark:bg-gray-900'}`}>
                          {item ? (
                            <div className="space-y-1">
                              <div className="space-y-0.5">
                                {(item.menu_items || []).map((mi, i) => (
                                  <p key={i} className="text-sm">{mi.name}{mi.qty ? ` - ${mi.qty}` : ''}</p>
                                ))}
                              </div>
                              {item.special_item && <Badge variant="outline" className="text-xs bg-amber-50">⭐ {item.special_item}</Badge>}
                              <p className="text-xs text-muted-foreground">{item.meal_start_time} - {item.meal_end_time}</p>
                              <div className="flex gap-1 mt-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(item)}><Edit className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => openAddDialog(dayIdx, mt)}>
                              <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Day</Label>
                  <Select value={String(form.day_of_week)} onValueChange={v => setForm(p => ({ ...p, day_of_week: parseInt(v) }))} disabled={!!editItem}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meal Type</Label>
                  <Select value={form.meal_type} onValueChange={v => setForm(p => ({ ...p, meal_type: v }))} disabled={!!editItem}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map(mt => <SelectItem key={mt} value={mt}>{MEAL_LABELS[mt]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Menu Items (one per line, format: Item Name - Quantity)</Label>
                <Textarea
                  rows={5}
                  placeholder={"Idli - 2 pcs\nSambar - 1 bowl\nChutney - 1 bowl"}
                  value={form.menu_items_text}
                  onChange={e => setForm(p => ({ ...p, menu_items_text: e.target.value }))}
                />
              </div>
              <div>
                <Label>Special Item (optional)</Label>
                <Input value={form.special_item} onChange={e => setForm(p => ({ ...p, special_item: e.target.value }))} placeholder="e.g. Payasam" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" value={form.meal_start_time} onChange={e => setForm(p => ({ ...p, meal_start_time: e.target.value }))} />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" value={form.meal_end_time} onChange={e => setForm(p => ({ ...p, meal_end_time: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.menu_items_text.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} {editItem ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default WeeklyMenu;
