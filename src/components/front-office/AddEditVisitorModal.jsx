import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload } from 'lucide-react';

const AddEditVisitorModal = ({ isOpen, onClose, visitor, branchId, sessionId, organizationId, onSave }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [purposes, setPurposes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    purpose_id: '', meeting_with: '', visitor_name: '', phone: '', id_card: '', 
    no_of_person: 1, date: new Date().toISOString().split('T')[0], in_time: '', out_time: '', note: '',
    document_url: '', class_id: '', section_id: '', student_id: '', staff_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (visitor) {
        setFormData({ ...visitor, meeting_with: visitor.meeting_with || '' });
        if (visitor.meeting_with === 'student' && visitor.class_id) {
          fetchSections(visitor.class_id);
          if (visitor.section_id) fetchStudents(visitor.class_id, visitor.section_id);
        }
      } else {
        setFormData({
          purpose_id: '', meeting_with: '', visitor_name: '', phone: '', id_card: '', 
          no_of_person: 1, date: new Date().toISOString().split('T')[0], in_time: '', out_time: '', note: '',
          document_url: '', class_id: '', section_id: '', student_id: '', staff_id: ''
        });
      }
    }
  }, [isOpen, visitor, branchId]);

  const fetchInitialData = async () => {
    const [purpRes, classRes, staffRes] = await Promise.all([
      supabase.from('front_office_purposes').select('*').eq('branch_id', branchId),
      supabase.from('classes').select('*').eq('branch_id', branchId),
      supabase.from('employee_profiles').select('id, full_name').eq('branch_id', branchId)
    ]);
    setPurposes(purpRes.data || []);
    setClasses(classRes.data || []);
    setStaff(staffRes.data || []);
  };

  const fetchSections = async (classId) => {
    const { data } = await supabase.from('sections').select('*, class_sections!inner(class_id)').eq('class_sections.class_id', classId);
    setSections(data || []);
  };

  const fetchStudents = async (classId, sectionId) => {
    const { data } = await supabase.from('student_profiles').select('id, full_name')
      .eq('class_id', classId).eq('section_id', sectionId).eq('branch_id', branchId);
    setStudents(data || []);
  };

  const handleClassChange = (val) => {
    setFormData(prev => ({ ...prev, class_id: val, section_id: '', student_id: '' }));
    fetchSections(val);
  };

  const handleSectionChange = (val) => {
    setFormData(prev => ({ ...prev, section_id: val, student_id: '' }));
    fetchStudents(formData.class_id, val);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${branchId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('front-office').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('front-office').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, document_url: data.publicUrl }));
      toast({ title: 'File uploaded' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.visitor_name || !formData.purpose_id || !formData.date || !formData.in_time || !formData.meeting_with) {
      return toast({ variant: 'destructive', title: 'Required fields missing' });
    }

    setLoading(true);
    try {
      const payload = { 
        ...formData, 
        branch_id: branchId,
        session_id: sessionId,
        organization_id: organizationId,
        // Clear fields not relevant to meeting type
        student_id: formData.meeting_with === 'student' ? formData.student_id : null,
        class_id: formData.meeting_with === 'student' ? formData.class_id : null,
        section_id: formData.meeting_with === 'student' ? formData.section_id : null,
        staff_id: formData.meeting_with === 'staff' ? formData.staff_id : null
      };

      let error;
      if (visitor?.id) {
        ({ error } = await supabase.from('visitor_book').update(payload).eq('id', visitor.id));
      } else {
        ({ error } = await supabase.from('visitor_book').insert(payload));
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
        <DialogHeader><DialogTitle>{visitor ? 'Edit Visitor' : 'Add Visitor'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Purpose *</Label>
              <Select value={formData.purpose_id || ''} onValueChange={v => setFormData({...formData, purpose_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{purposes.map(p => <SelectItem key={p.id} value={p.id}>{p.purpose}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Meeting With *</Label>
              <Select value={formData.meeting_with} onValueChange={v => setFormData({...formData, meeting_with: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Visitor Name *</Label><Input value={formData.visitor_name} onChange={e => setFormData({...formData, visitor_name: e.target.value})} required /></div>
            
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div className="space-y-2"><Label>ID Card</Label><Input value={formData.id_card || ''} onChange={e => setFormData({...formData, id_card: e.target.value})} /></div>
            <div className="space-y-2"><Label>No. Of Person</Label><Input type="number" value={formData.no_of_person} onChange={e => setFormData({...formData, no_of_person: e.target.value})} /></div>
            
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
            <div className="space-y-2"><Label>In Time *</Label><Input type="time" value={formData.in_time} onChange={e => setFormData({...formData, in_time: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Out Time</Label><Input type="time" value={formData.out_time || ''} onChange={e => setFormData({...formData, out_time: e.target.value})} /></div>

            {formData.meeting_with === 'student' && (
              <>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={formData.class_id || ''} onValueChange={handleClassChange}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={formData.section_id || ''} onValueChange={handleSectionChange}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={formData.student_id || ''} onValueChange={v => setFormData({...formData, student_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formData.meeting_with === 'staff' && (
              <div className="space-y-2">
                <Label>Staff</Label>
                <Select value={formData.staff_id || ''} onValueChange={v => setFormData({...formData, staff_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            <div className="md:col-span-3 space-y-2">
              <Label>Attach Document</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={handleFileUpload} disabled={uploading} />
                {uploading && <Loader2 className="animate-spin h-4 w-4" />}
              </div>
              {formData.document_url && <p className="text-xs text-green-600 truncate">File uploaded</p>}
            </div>

            <div className="md:col-span-3 space-y-2"><Label>Note</Label><Textarea value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading || uploading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditVisitorModal;
