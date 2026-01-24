import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const PhoneCallLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const branchId = user?.user_metadata?.branch_id;
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', phone: '', date: new Date().toISOString().split('T')[0],
    description: '', next_follow_up_date: '', call_duration: '', note: '', call_type: 'Incoming', id: null
  });

  useEffect(() => {
    if (branchId) fetchLogs();
  }, [branchId]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('phone_call_logs').select('*').eq('branch_id', branchId).order('created_at', { ascending: false });
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else setLogs(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, branch_id: branchId };
      delete payload.id; // handle id separately for update

      let error;
      if (formData.id) {
        ({ error } = await supabase.from('phone_call_logs').update(payload).eq('id', formData.id));
      } else {
        ({ error } = await supabase.from('phone_call_logs').insert(payload));
      }

      if (error) throw error;
      toast({ title: 'Saved successfully' });
      setFormData({ name: '', phone: '', date: new Date().toISOString().split('T')[0], description: '', next_follow_up_date: '', call_duration: '', note: '', call_type: 'Incoming', id: null });
      fetchLogs();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete log?')) return;
    const { error } = await supabase.from('phone_call_logs').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else {
      toast({ title: 'Deleted successfully' });
      fetchLogs();
    }
  };

  const filteredLogs = logs.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search));

  return (
    <DashboardLayout>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle>Add Phone Call Log</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Phone *</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Date *</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="space-y-2"><Label>Next Follow Up Date</Label><Input type="date" value={formData.next_follow_up_date || ''} onChange={e => setFormData({...formData, next_follow_up_date: e.target.value})} /></div>
              <div className="space-y-2"><Label>Call Duration</Label><Input value={formData.call_duration || ''} onChange={e => setFormData({...formData, call_duration: e.target.value})} /></div>
              <div className="space-y-2"><Label>Note</Label><Textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Call Type</Label>
                <RadioGroup value={formData.call_type} onValueChange={v => setFormData({...formData, call_type: v})} className="flex space-x-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Incoming" id="incoming" /><Label htmlFor="incoming">Incoming</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Outgoing" id="outgoing" /><Label htmlFor="outgoing">Outgoing</Label></div>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Phone Call Log List</CardTitle>
            <Input placeholder="Search..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Date</TableHead><TableHead>Next Follow Up</TableHead><TableHead>Call Type</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                : filteredLogs.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8">No logs found</TableCell></TableRow>
                : filteredLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.name}</TableCell>
                    <TableCell>{log.phone}</TableCell>
                    <TableCell>{format(new Date(log.date), 'dd-MMM-yyyy')}</TableCell>
                    <TableCell>{log.next_follow_up_date ? format(new Date(log.next_follow_up_date), 'dd-MMM-yyyy') : '-'}</TableCell>
                    <TableCell>{log.call_type}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(log)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(log.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PhoneCallLog;
