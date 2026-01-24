import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const isValidUUID = (uuid) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

const EditSchool = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    school_code_number: '',
    contact_email: '',
    contact_number: '',
    address: '',
    cms_url_alias: '',
    status: '',
    subscription_plan: ''
  });

  useEffect(() => {
    if (!id || !isValidUUID(id)) {
        // Prevent fetch if ID is invalid
        return;
    }

    const load = async () => {
      const { data: school } = await supabase.from('schools').select('*').eq('id', id).single();
      const { data: planList } = await supabase.from('subscription_plans').select('id, name').eq('status', true);
      
      if (school) {
        setFormData({
          name: school.name || '',
          school_code_number: school.school_code_number || '',
          contact_email: school.contact_email || '',
          contact_number: school.contact_number || '',
          address: school.address || '',
          cms_url_alias: school.cms_url_alias || '',
          status: school.status || 'Active',
          subscription_plan: school.subscription_plan || ''
        });
      }
      if (planList) setPlans(planList);
    };
    load();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!id || !isValidUUID(id)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid School ID' });
        return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('schools').update(formData).eq('id', id);
      if (error) throw error;
      toast({ title: 'Updated', description: 'School updated successfully.' });
      navigate(`/master-admin/schools/${id}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/master-admin/schools/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Edit School</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow border space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label>School Name</Label><Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required /></div>
            <div className="space-y-2"><Label>School Code</Label><Input value={formData.school_code_number} onChange={e => setFormData(p => ({...p, school_code_number: e.target.value}))} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={formData.contact_email} onChange={e => setFormData(p => ({...p, contact_email: e.target.value}))} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.contact_number} onChange={e => setFormData(p => ({...p, contact_number: e.target.value}))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Address</Label><Input value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} /></div>
            <div className="space-y-2"><Label>Website Slug</Label><Input value={formData.cms_url_alias} onChange={e => setFormData(p => ({...p, cms_url_alias: e.target.value}))} /></div>
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select value={formData.subscription_plan} onValueChange={v => setFormData(p => ({...p, subscription_plan: v}))}>
                <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                <SelectContent>{plans.map(pl => <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData(p => ({...p, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditSchool;
