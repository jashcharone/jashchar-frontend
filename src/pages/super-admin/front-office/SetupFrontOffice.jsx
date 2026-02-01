import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Trash2, Pencil } from 'lucide-react';

const SetupTab = ({ title, tableName, branchId, sessionId, organizationId }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ field: '', description: '', id: null });

  const fieldName = title.toLowerCase().replace(' ', '_'); // e.g. 'purpose', 'complain_type'
  const tableFieldName = title === 'Complain Type' ? 'complain_type' : title.toLowerCase();

  useEffect(() => {
    fetchItems();
  }, [branchId]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(tableName).select('*').eq('branch_id', branchId).order('created_at', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.field) return toast({ variant: 'destructive', title: 'Validation Error', description: `${title} is required` });
    
    setSaving(true);
    const payload = {
      branch_id: branchId,
      session_id: sessionId,
      organization_id: organizationId,
      [tableFieldName]: formData.field,
      description: formData.description
    };

    try {
      if (formData.id) {
        const { error } = await supabase.from(tableName).update(payload).eq('id', formData.id);
        if (error) throw error;
        toast({ title: 'Updated successfully' });
      } else {
        const { error } = await supabase.from(tableName).insert(payload);
        if (error) throw error;
        toast({ title: 'Added successfully' });
      }
      setFormData({ field: '', description: '', id: null });
      fetchItems();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({ field: item[tableFieldName], description: item.description, id: item.id });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted successfully' });
      fetchItems();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1 h-fit">
        <CardHeader><CardTitle>{formData.id ? `Edit ${title}` : `Add ${title}`}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{title} *</Label>
              <Input value={formData.field} onChange={(e) => setFormData({ ...formData, field: e.target.value })} placeholder={`Enter ${title}`} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter description" />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle>{title} List</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{title}</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center">No data found</TableCell></TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item[tableFieldName]}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SetupFrontOffice = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const branchId = user?.user_metadata?.branch_id;

  if (!branchId) return null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Setup Front Office</h1>
        <Tabs defaultValue="purpose" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="purpose">Purpose</TabsTrigger>
            <TabsTrigger value="complain_type">Complain Type</TabsTrigger>
            <TabsTrigger value="source">Source</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
          </TabsList>
          <TabsContent value="purpose" className="mt-6">
            <SetupTab title="Purpose" tableName="front_office_purposes" branchId={branchId} sessionId={currentSessionId} organizationId={organizationId} />
          </TabsContent>
          <TabsContent value="complain_type" className="mt-6">
            <SetupTab title="Complain Type" tableName="front_office_complain_types" branchId={branchId} sessionId={currentSessionId} organizationId={organizationId} />
          </TabsContent>
          <TabsContent value="source" className="mt-6">
            <SetupTab title="Source" tableName="front_office_sources" branchId={branchId} sessionId={currentSessionId} organizationId={organizationId} />
          </TabsContent>
          <TabsContent value="reference" className="mt-6">
            <SetupTab title="Reference" tableName="front_office_references" branchId={branchId} sessionId={currentSessionId} organizationId={organizationId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SetupFrontOffice;
