import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const AddEditLiveClassModal = ({ isOpen, onClose, branchId, onSave, editData }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    duration: '',
    role_id: '',
    staff_id: '',
    class_id: '',
    section_ids: [],
    gmeet_url: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (editData) {
        // Format date for input datetime-local
        const d = new Date(editData.date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const formattedDate = d.toISOString().slice(0, 16);

        setFormData({
          title: editData.title,
          date: formattedDate,
          duration: editData.duration,
          role_id: editData.role_id,
          staff_id: editData.staff_id,
          class_id: editData.class_id,
          section_ids: editData.section_ids || [],
          gmeet_url: editData.gmeet_url,
          description: editData.description || ''
        });
        if (editData.class_id) {
          fetchSections(editData.class_id);
        }
      } else {
        setFormData({
          title: '',
          date: '',
          duration: '',
          role_id: '',
          staff_id: '',
          class_id: '',
          section_ids: [],
          gmeet_url: '',
          description: ''
        });
      }
    }
  }, [isOpen, editData, branchId]);

  const fetchDropdowns = async () => {
    const [rolesRes, staffRes, classRes] = await Promise.all([
      supabase.from('roles').select('id, name').eq('branch_id', branchId),
      supabase.from('employee_profiles').select('id, full_name, role_id').eq('branch_id', branchId),
      supabase.from('classes').select('id, name').eq('branch_id', branchId)
    ]);
    setRoles(rolesRes.data || []);
    setStaff(staffRes.data || []);
    setClasses(classRes.data || []);
  };

  const fetchSections = async (classId) => {
    const { data } = await supabase
      .from('class_sections')
      .select('sections(id, name)')
      .eq('class_id', classId);
    setSections(data?.map(i => i.sections) || []);
  };

  const handleClassChange = (classId) => {
    setFormData(prev => ({ ...prev, class_id: classId, section_ids: [] }));
    fetchSections(classId);
  };

  const handleSectionToggle = (sectionId) => {
    setFormData(prev => {
      const ids = prev.section_ids.includes(sectionId)
        ? prev.section_ids.filter(id => id !== sectionId)
        : [...prev.section_ids, sectionId];
      return { ...prev, section_ids: ids };
    });
  };

  const filteredStaff = formData.role_id 
    ? staff.filter(s => s.role_id === formData.role_id)
    : staff;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.duration || !formData.class_id || formData.section_ids.length === 0 || !formData.gmeet_url || !formData.staff_id) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        branch_id: branchId,
        ...formData,
        created_at: editData ? editData.created_at : new Date().toISOString()
      };

      if (editData) {
        const { error } = await supabase.from('gmeet_live_classes').update(payload).eq('id', editData.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Live class updated.' });
      } else {
        const { error } = await supabase.from('gmeet_live_classes').insert(payload);
        if (error) throw error;
        toast({ title: 'Success', description: 'Live class created.' });
      }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit Live Class' : 'Add Live Class'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Class Title *</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class Date *</Label>
              <Input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Duration (Minutes) *</Label>
              <Input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={formData.role_id} onValueChange={v => setFormData({...formData, role_id: v, staff_id: ''})}>
                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Staff *</Label>
              <Select value={formData.staff_id} onValueChange={v => setFormData({...formData, staff_id: v})} disabled={!formData.role_id}>
                <SelectTrigger><SelectValue placeholder="Select Staff" /></SelectTrigger>
                <SelectContent>{filteredStaff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={formData.class_id} onValueChange={handleClassChange}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sections *</Label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto bg-slate-50">
                {sections.length > 0 ? sections.map(s => (
                  <div key={s.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id={`sec-${s.id}`} 
                      checked={formData.section_ids.includes(s.id)}
                      onCheckedChange={() => handleSectionToggle(s.id)}
                    />
                    <Label htmlFor={`sec-${s.id}`} className="font-normal cursor-pointer">{s.name}</Label>
                  </div>
                )) : <p className="text-xs text-muted-foreground">Select a class to see sections</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Gmeet URL * <span className="text-xs text-blue-500 font-normal ml-2">(How to get Gmeet URL?)</span></Label>
            <Input value={formData.gmeet_url} onChange={e => setFormData({...formData, gmeet_url: e.target.value})} placeholder="https://meet.google.com/..." />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <DialogFooter>
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditLiveClassModal;
