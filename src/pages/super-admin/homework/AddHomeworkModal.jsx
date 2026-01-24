import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AddHomeworkModal = ({ isOpen, onClose, onSuccess, initialData, userSchoolId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    class_id: '',
    section_id: '',
    subject_group_id: '',
    subject_id: '',
    homework_date: new Date().toISOString().split('T')[0],
    submission_date: new Date().toISOString().split('T')[0],
    max_marks: '',
    description: '',
    document_url: ''
  });

  const [file, setFile] = useState(null);

  // Dropdowns
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjectGroups, setSubjectGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchClasses();
    if (initialData) {
      setFormData({
        class_id: initialData.class_id,
        section_id: initialData.section_id,
        subject_group_id: initialData.subject_group_id,
        subject_id: initialData.subject_id,
        homework_date: initialData.homework_date,
        submission_date: initialData.submission_date,
        max_marks: initialData.max_marks || '',
        description: initialData.description || '',
        document_url: initialData.document_url || ''
      });
      // Trigger fetches for dependents
      fetchSections(initialData.class_id);
      fetchSubjectGroups(initialData.class_id);
      fetchSubjects(initialData.subject_group_id);
    }
  }, [initialData]);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').eq('branch_id', userSchoolId);
    setClasses(data || []);
  };

  const fetchSections = async (classId) => {
    if (!classId) return;
    const { data } = await supabase
      .from('sections')
      .select('*, class_sections!inner(class_id)')
      .eq('class_sections.class_id', classId)
      .eq('branch_id', userSchoolId);
    setSections(data || []);
  };

  const fetchSubjectGroups = async (classId) => {
    if (!classId) return;
    const { data } = await supabase
      .from('subject_groups')
      .select('*')
      .eq('branch_id', userSchoolId)
      .contains('class_ids', [classId]);
    setSubjectGroups(data || []);
  };

  const fetchSubjects = async (groupId) => {
    if (!groupId) return;
    const { data: groupData } = await supabase
        .from('subject_groups')
        .select('subject_ids')
        .eq('id', groupId)
        .single();
    
    if (groupData?.subject_ids) {
        const { data: subjectsData } = await supabase
            .from('subjects')
            .select('*')
            .in('id', groupData.subject_ids);
        setSubjects(subjectsData || []);
    }
  };

  const handleClassChange = (val) => {
    setFormData(prev => ({ ...prev, class_id: val, section_id: '', subject_group_id: '', subject_id: '' }));
    fetchSections(val);
    fetchSubjectGroups(val);
  };

  const handleSubjectGroupChange = (val) => {
    setFormData(prev => ({ ...prev, subject_group_id: val, subject_id: '' }));
    fetchSubjects(val);
  };

  const handleSave = async () => {
    if (!formData.class_id || !formData.section_id || !formData.subject_id || !formData.homework_date || !formData.submission_date) {
      toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let docUrl = formData.document_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `homework-docs/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('marksheet-assets') 
          .upload(filePath, file);

        if (uploadError) {
             console.error("Upload error", uploadError);
        } else {
             const { data: { publicUrl } } = supabase.storage.from('marksheet-assets').getPublicUrl(filePath);
             docUrl = publicUrl;
        }
      }

      const payload = {
        ...formData,
        branch_id: userSchoolId,
        created_by: user.profile.id,
        document_url: docUrl
      };

      if (initialData) {
        const { error } = await supabase.from('homeworks').update(payload).eq('id', initialData.id);
        if (error) throw error;
        toast({ title: "Success", description: "Homework updated successfully" });
      } else {
        const { error } = await supabase.from('homeworks').insert(payload);
        if (error) throw error;
        toast({ title: "Success", description: "Homework created successfully" });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving homework:", error);
      toast({ title: "Error", description: "Failed to save homework", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Homework' : 'Add Homework'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Class *</label>
            <Select value={formData.class_id} onValueChange={handleClassChange}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Section *</label>
            <Select value={formData.section_id} onValueChange={(val) => setFormData(prev => ({ ...prev, section_id: val }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject Group *</label>
            <Select value={formData.subject_group_id} onValueChange={handleSubjectGroupChange}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {subjectGroups.map(sg => <SelectItem key={sg.id} value={sg.id}>{sg.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject *</label>
            <Select value={formData.subject_id} onValueChange={(val) => setFormData(prev => ({ ...prev, subject_id: val }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Homework Date *</label>
            <Input 
              type="date" 
              value={formData.homework_date} 
              onChange={(e) => setFormData(prev => ({ ...prev, homework_date: e.target.value }))} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Submission Date *</label>
            <Input 
              type="date" 
              value={formData.submission_date} 
              onChange={(e) => setFormData(prev => ({ ...prev, submission_date: e.target.value }))} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max Marks</label>
            <Input 
              type="number" 
              value={formData.max_marks} 
              onChange={(e) => setFormData(prev => ({ ...prev, max_marks: e.target.value }))} 
              placeholder="Enter max marks"
            />
          </div>

          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Attach Document</label>
            <Input 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])}
              className="cursor-pointer"
            />
            {formData.document_url && (
              <p className="text-xs text-blue-600">Current file: <a href={formData.document_url} target="_blank" rel="noreferrer">View</a></p>
            )}
          </div>

          <div className="col-span-1 md:col-span-3 space-y-2">
             <label className="text-sm font-medium">Description</label>
             <ReactQuill theme="snow" value={formData.description} onChange={(val) => setFormData(prev => ({ ...prev, description: val }))} className="h-32 mb-12" />
          </div>
        </div>

        <DialogFooter className="mt-8">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddHomeworkModal;
