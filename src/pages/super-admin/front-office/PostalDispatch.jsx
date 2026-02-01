import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Pencil, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';

const PostalDispatch = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { toast } = useToast();
  const branchId = user?.user_metadata?.branch_id;
  
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    to_title: '', reference_no: '', address: '', note: '', from_title: '', 
    date: new Date().toISOString().split('T')[0], document_url: '', id: null
  });

  useEffect(() => {
    if (branchId) fetchDispatches();
  }, [branchId]);

  const fetchDispatches = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('postal_dispatch').select('*').eq('branch_id', branchId).order('created_at', { ascending: false });
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else setDispatches(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${branchId}/dispatch_${Date.now()}_${file.name}`;
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
    setSaving(true);
    try {
      const payload = { ...formData, branch_id: branchId, session_id: currentSessionId, organization_id: organizationId };
      delete payload.id;

      let error;
      if (formData.id) {
        ({ error } = await supabase.from('postal_dispatch').update(payload).eq('id', formData.id));
      } else {
        ({ error } = await supabase.from('postal_dispatch').insert(payload));
      }

      if (error) throw error;
      toast({ title: 'Saved successfully' });
      setFormData({ to_title: '', reference_no: '', address: '', note: '', from_title: '', date: new Date().toISOString().split('T')[0], document_url: '', id: null });
      fetchDispatches();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete record?')) return;
    const { error } = await supabase.from('postal_dispatch').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error' });
    else {
      toast({ title: 'Deleted' });
      fetchDispatches();
    }
  };

  const filtered = dispatches.filter(d => d.to_title.toLowerCase().includes(search.toLowerCase()) || d.reference_no?.includes(search));

  return (
    <DashboardLayout>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle>Add Postal Dispatch</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>To Title *</Label><Input value={formData.to_title} onChange={e => setFormData({...formData, to_title: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Reference No</Label><Input value={formData.reference_no || ''} onChange={e => setFormData({...formData, reference_no: e.target.value})} /></div>
              <div className="space-y-2"><Label>Address</Label><Textarea value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
              <div className="space-y-2"><Label>Note</Label><Textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
              <div className="space-y-2"><Label>From Title *</Label><Input value={formData.from_title} onChange={e => setFormData({...formData, from_title: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Date *</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
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
            <CardTitle>Postal Dispatch List</CardTitle>
            <Input placeholder="Search..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>To Title</TableHead><TableHead>Reference No</TableHead><TableHead>From Title</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8">No records found</TableCell></TableRow>
                : filtered.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.to_title}</TableCell>
                    <TableCell>{item.reference_no}</TableCell>
                    <TableCell>{item.from_title}</TableCell>
                    <TableCell>{format(new Date(item.date), 'dd-MMM-yyyy')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {item.document_url && <Button variant="ghost" size="icon" asChild><a href={item.document_url} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /></a></Button>}
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

export default PostalDispatch;
