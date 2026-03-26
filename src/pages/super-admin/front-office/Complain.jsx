import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Pencil, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

const Complain = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { toast } = useToast();
  const branchId = user?.user_metadata?.branch_id;
  
  const [complains, setComplains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [complainTypes, setComplainTypes] = useState([]);
  const [sources, setSources] = useState([]);
  const [staff, setStaff] = useState([]);

  const [formData, setFormData] = useState({
    complain_type_id: '', source_id: '', complain_by: '', phone: '', date: new Date().toISOString().split('T')[0],
    description: '', action_taken: '', assigned_to: '', note: '', document_url: '', id: null
  });

  useEffect(() => {
    if (branchId) {
      fetchDropdowns();
      fetchComplains();
    }
  }, [branchId]);

  const fetchDropdowns = async () => {
    const [typesRes, sourcesRes, staffRes] = await Promise.all([
      supabase.from('front_office_complain_types').select('*').eq('branch_id', branchId),
      supabase.from('front_office_sources').select('*').eq('branch_id', branchId),
      supabase.from('employee_profiles').select('id, full_name').eq('branch_id', branchId)
    ]);
    setComplainTypes(typesRes.data || []);
    setSources(sourcesRes.data || []);
    setStaff(staffRes.data || []);
  };

  const fetchComplains = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('complains')
      .select('*, complain_type:front_office_complain_types(complain_type)')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else setComplains(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${branchId}/complain_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('front-office').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('front-office').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, document_url: data.publicUrl }));
      toast({ title: 'File uploaded' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.complain_type_id || !formData.complain_by) return toast({ variant: 'destructive', title: 'Missing required fields' });

    setSaving(true);
    try {
      const payload = { 
        ...formData, 
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: organizationId,
        assigned_to: formData.assigned_to || null,
        source_id: formData.source_id || null
      };
      delete payload.id;

      let error;
      if (formData.id) {
        ({ error } = await supabase.from('complains').update(payload).eq('id', formData.id));
      } else {
        ({ error } = await supabase.from('complains').insert(payload));
      }

      if (error) throw error;
      toast({ title: 'Saved successfully' });
      setFormData({ complain_type_id: '', source_id: '', complain_by: '', phone: '', date: new Date().toISOString().split('T')[0], description: '', action_taken: '', assigned_to: '', note: '', document_url: '', id: null });
      fetchComplains();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete complain?')) return;
    const { error } = await supabase.from('complains').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error' });
    else {
      toast({ title: 'Deleted' });
      fetchComplains();
    }
  };

  const filtered = complains.filter(c => c.complain_by.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  return (
    <DashboardLayout>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle>Add Complain</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Complain Type *</Label>
                <Select value={formData.complain_type_id || ''} onValueChange={v => setFormData({...formData, complain_type_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{complainTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.complain_type}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source *</Label>
                <Select value={formData.source_id || ''} onValueChange={v => setFormData({...formData, source_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{sources.map(s => <SelectItem key={s.id} value={s.id}>{s.source}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Complain By *</Label><Input value={formData.complain_by} onChange={e => setFormData({...formData, complain_by: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="space-y-2"><Label>Date *</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="space-y-2"><Label>Action Taken</Label><Textarea value={formData.action_taken || ''} onChange={e => setFormData({...formData, action_taken: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Assigned</Label>
                <Select value={formData.assigned_to || ''} onValueChange={v => setFormData({...formData, assigned_to: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Note</Label><Textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Attach Document</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" onChange={handleFileUpload} disabled={uploading} />
                  {uploading && <Loader2 className="animate-spin h-4 w-4" />}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving || uploading}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Complain List</CardTitle>
            <Input placeholder="Search..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Complain Type</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8">No complains found</TableCell></TableRow>
                : filtered.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.complain_type?.complain_type}</TableCell>
                    <TableCell className="font-medium">{item.complain_by}</TableCell>
                    <TableCell>{item.phone}</TableCell>
                    <TableCell>{format(new Date(item.date), 'dd-MMM-yyyy')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {item.document_url && <Button variant="ghost" size="icon" asChild><a href={item.document_url} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a></Button>}
                      <Button variant="ghost" size="icon" onClick={() => setFormData(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
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

export default Complain;
