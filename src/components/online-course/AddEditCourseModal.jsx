import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload } from 'lucide-react';

const AddEditCourseModal = ({ isOpen, onClose, branchId, onSave, editData }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    outcomes: '',
    description: '',
    preview_image: '',
    class_id: '',
    section_ids: [],
    teacher_id: '',
    preview_source: 'youtube',
    preview_url: '',
    price: '',
    discount: '',
    is_free: false,
    category_id: '',
    front_site_visibility: true
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (editData) {
        setFormData({
          title: editData.title,
          outcomes: editData.outcomes || '',
          description: editData.description || '',
          preview_image: editData.preview_image || '',
          class_id: editData.class_id,
          section_ids: editData.section_ids || [],
          teacher_id: editData.teacher_id,
          preview_source: editData.preview_source || 'youtube',
          preview_url: editData.preview_url || '',
          price: editData.price || '',
          discount: editData.discount || '',
          is_free: editData.is_free || false,
          category_id: editData.category_id,
          front_site_visibility: editData.front_site_visibility
        });
        if(editData.class_id) fetchSections(editData.class_id);
      } else {
        setFormData({
          title: '', outcomes: '', description: '', preview_image: '', class_id: '', section_ids: [],
          teacher_id: '', preview_source: 'youtube', preview_url: '', price: '', discount: '', is_free: false,
          category_id: '', front_site_visibility: true
        });
      }
    }
  }, [isOpen, editData, branchId]);

  const fetchDropdowns = async () => {
    const [classRes, teacherRes, catRes] = await Promise.all([
      supabase.from('classes').select('id, name').eq('branch_id', branchId),
      supabase.from('employee_profiles').select('id, full_name, role:roles(name)').eq('branch_id', branchId), // Ideally filter by 'teacher' role
      supabase.from('online_course_categories').select('id, name').eq('branch_id', branchId)
    ]);
    setClasses(classRes.data || []);
    setTeachers(teacherRes.data || []);
    setCategories(catRes.data || []);
  };

  const fetchSections = async (classId) => {
    const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', classId);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${branchId}/course_preview_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('public').upload(fileName, file); // Assuming 'public' bucket exists, otherwise adjust
      if (error) throw error;
      const { data } = supabase.storage.from('public').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, preview_image: data.publicUrl }));
      toast({ title: 'Image uploaded' });
    } catch (error) {
      // If public bucket fails, try creating one or use an existing one like 'cms-media'
       try {
          const fileName = `${branchId}/course_preview_${Date.now()}_${file.name}`;
          const { error: err2 } = await supabase.storage.from('cms-media').upload(fileName, file);
          if (err2) throw err2;
          const { data } = supabase.storage.from('cms-media').getPublicUrl(fileName);
          setFormData(prev => ({ ...prev, preview_image: data.publicUrl }));
          toast({ title: 'Image uploaded' });
       } catch(err3) {
          toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
       }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.class_id || formData.section_ids.length === 0 || !formData.teacher_id || !formData.category_id) {
      return toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields.' });
    }

    setSaving(true);
    try {
      const payload = { ...formData, branch_id: branchId };
      if (editData) {
        const { error } = await supabase.from('online_courses').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('online_courses').insert(payload);
        if (error) throw error;
      }
      toast({ title: 'Success', description: 'Course saved successfully.' });
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit Course' : 'Add Course'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Course Category *</Label>
              <Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={formData.class_id} onValueChange={handleClassChange}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Section *</Label>
              <div className="flex flex-wrap gap-2 border p-2 rounded min-h-[40px]">
                {sections.length > 0 ? sections.map(s => (
                  <div key={s.id} className="flex items-center space-x-1">
                    <Checkbox id={`sec-${s.id}`} checked={formData.section_ids.includes(s.id)} onCheckedChange={() => handleSectionToggle(s.id)} />
                    <Label htmlFor={`sec-${s.id}`} className="font-normal cursor-pointer">{s.name}</Label>
                  </div>
                )) : <span className="text-xs text-muted-foreground">Select a class first</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label>Assign Teacher *</Label>
              <Select value={formData.teacher_id} onValueChange={v => setFormData({...formData, teacher_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Front Site Visibility</Label>
              <Select value={formData.front_site_visibility ? 'yes' : 'no'} onValueChange={v => setFormData({...formData, front_site_visibility: v === 'yes'})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Outcomes</Label>
            <Textarea value={formData.outcomes} onChange={e => setFormData({...formData, outcomes: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <ReactQuill theme="snow" value={formData.description} onChange={v => setFormData({...formData, description: v})} className="h-40 mb-12" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
             <div className="space-y-2">
                <Label>Inline Preview Image (700px x 400px)</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  {uploading && <Loader2 className="animate-spin h-4 w-4" />}
                </div>
                {formData.preview_image && <p className="text-xs text-green-600 truncate">Image uploaded</p>}
             </div>
             <div className="space-y-2">
                <Label>Course Preview URL</Label>
                <div className="flex gap-2">
                  <Select value={formData.preview_source} onValueChange={v => setFormData({...formData, preview_source: v})}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="youtube">Youtube</SelectItem><SelectItem value="vimeo">Vimeo</SelectItem></SelectContent>
                  </Select>
                  <Input placeholder="URL" value={formData.preview_url} onChange={e => setFormData({...formData, preview_url: e.target.value})} />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} disabled={formData.is_free} />
            </div>
            <div className="space-y-2">
              <Label>Discount (%)</Label>
              <Input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} disabled={formData.is_free} />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox id="is_free" checked={formData.is_free} onCheckedChange={c => setFormData({...formData, is_free: c, price: c ? 0 : formData.price, discount: c ? 0 : formData.discount})} />
              <Label htmlFor="is_free" className="cursor-pointer">Free Course</Label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" disabled={saving || uploading}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditCourseModal;
