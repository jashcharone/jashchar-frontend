import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const AddEditLiveMeetingModal = ({ isOpen, onClose, branchId, onSave }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    duration: '',
    gmeet_url: '',
    description: '',
    invited_staff_ids: []
  });

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      // Reset form
      setFormData({
        title: '',
        date: '',
        duration: '',
        gmeet_url: '',
        description: '',
        invited_staff_ids: []
      });
    }
  }, [isOpen, branchId]);

  const fetchStaff = async () => {
    const { data } = await supabase.from('employee_profiles').select('id, full_name, role:roles(name)').eq('branch_id', branchId);
    setStaffList(data || []);
  };

  const handleStaffToggle = (id) => {
    setFormData(prev => {
      const ids = prev.invited_staff_ids.includes(id)
        ? prev.invited_staff_ids.filter(sid => sid !== id)
        : [...prev.invited_staff_ids, id];
      return { ...prev, invited_staff_ids: ids };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.duration || !formData.gmeet_url || formData.invited_staff_ids.length === 0) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        branch_id: branchId,
        ...formData,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('gmeet_live_meetings').insert(payload);
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Live meeting created.' });
      onSave();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Live Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <Label>Meeting Title *</Label>
              <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meeting Date *</Label>
                <Input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Duration (Min) *</Label>
                <Input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gmeet URL *</Label>
              <Input value={formData.gmeet_url} onChange={e => setFormData({...formData, gmeet_url: e.target.value})} placeholder="https://meet.google.com/..." />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          <div className="md:col-span-1 border-l pl-4">
            <Label className="mb-2 block">Staff List *</Label>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {staffList.map(s => (
                <div key={s.id} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`staff-${s.id}`} 
                    checked={formData.invited_staff_ids.includes(s.id)}
                    onCheckedChange={() => handleStaffToggle(s.id)}
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor={`staff-${s.id}`} className="font-medium cursor-pointer">{s.full_name}</Label>
                    <span className="text-xs text-muted-foreground">{s.role?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end gap-2 pt-4 border-t">
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditLiveMeetingModal;
