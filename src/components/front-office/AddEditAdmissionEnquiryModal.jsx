import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const AddEditAdmissionEnquiryModal = ({ isOpen, onClose, enquiry, branchId, onSave }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [references, setReferences] = useState([]);
  const [sources, setSources] = useState([]);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', description: '', note: '',
    date: new Date().toISOString().split('T')[0], next_follow_up_date: '',
    assigned_to: null, reference_id: null, source_id: null, class_id: null, no_of_child: 1
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (enquiry) {
        setFormData({
          ...enquiry,
          assigned_to: enquiry.assigned_to, // Assuming direct ID or handled properly
          reference_id: enquiry.reference_id,
          source_id: enquiry.source_id,
          class_id: enquiry.class_id
        });
      } else {
        setFormData({
          name: '', phone: '', email: '', address: '', description: '', note: '',
          date: new Date().toISOString().split('T')[0], next_follow_up_date: '',
          assigned_to: null, reference_id: null, source_id: null, class_id: null, no_of_child: 1
        });
      }
    }
  }, [isOpen, enquiry, branchId]);

  const fetchDropdowns = async () => {
    const [refRes, srcRes, classRes, staffRes] = await Promise.all([
      supabase.from('front_office_references').select('*').eq('branch_id', branchId),
      supabase.from('front_office_sources').select('*').eq('branch_id', branchId),
      supabase.from('classes').select('*').eq('branch_id', branchId),
      supabase.from('employee_profiles').select('id, full_name').eq('branch_id', branchId)
    ]);
    setReferences(refRes.data || []);
    setSources(srcRes.data || []);
    setClasses(classRes.data || []);
    setStaff(staffRes.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date || !formData.class_id) {
      return toast({ variant: 'destructive', title: 'Validation Error', description: 'Name, Phone, Date and Class are required' });
    }

    setLoading(true);
    try {
      const payload = { ...formData, branch_id: branchId };
      let error;
      if (enquiry?.id) {
        ({ error } = await supabase.from('admission_enquiries').update(payload).eq('id', enquiry.id));
      } else {
        ({ error } = await supabase.from('admission_enquiries').insert(payload));
      }

      if (error) throw error;
      toast({ title: 'Saved Successfully' });
      onSave();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{enquiry ? 'Edit Admission Enquiry' : 'Add Admission Enquiry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Phone *</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="md:col-span-3 space-y-2"><Label>Address</Label><Textarea value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
            <div className="md:col-span-1.5 space-y-2"><Label>Description</Label><Textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className="md:col-span-1.5 space-y-2"><Label>Note</Label><Textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
            
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Next Follow Up Date</Label><Input type="date" value={formData.next_follow_up_date || ''} onChange={e => setFormData({...formData, next_follow_up_date: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Assigned</Label>
              <Select value={formData.assigned_to || ''} onValueChange={v => setFormData({...formData, assigned_to: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Reference</Label>
              <Select value={formData.reference_id || ''} onValueChange={v => setFormData({...formData, reference_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{references.map(r => <SelectItem key={r.id} value={r.id}>{r.reference}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={formData.source_id || ''} onValueChange={v => setFormData({...formData, source_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{sources.map(s => <SelectItem key={s.id} value={s.id}>{s.source}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={formData.class_id || ''} onValueChange={v => setFormData({...formData, class_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Number Of Child</Label><Input type="number" value={formData.no_of_child} onChange={e => setFormData({...formData, no_of_child: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditAdmissionEnquiryModal;
