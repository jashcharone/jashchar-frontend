import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const AddEditLessonModal = ({ isOpen, onClose, sectionId, courseId, branchId, onSave, editData }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    lesson_type: 'Video',
    video_provider: 'Youtube',
    video_url: '',
    duration: '',
    preview_image: '',
    summary: '',
    attachment_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title,
          lesson_type: editData.lesson_type,
          video_provider: editData.video_provider || 'Youtube',
          video_url: editData.video_url || '',
          duration: editData.duration || '',
          preview_image: editData.preview_image || '',
          summary: editData.summary || '',
          attachment_url: editData.attachment_url || ''
        });
      } else {
        setFormData({
          title: '', lesson_type: 'Video', video_provider: 'Youtube', video_url: '', duration: '',
          preview_image: '', summary: '', attachment_url: ''
        });
      }
    }
  }, [isOpen, editData]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${branchId}/lesson_${type}_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('cms-media').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('cms-media').getPublicUrl(fileName);
      
      if (type === 'preview') setFormData(prev => ({ ...prev, preview_image: data.publicUrl }));
      else setFormData(prev => ({ ...prev, attachment_url: data.publicUrl }));
      
      toast({ title: 'File uploaded' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast({ variant: 'destructive', title: 'Validation Error', description: 'Title is required' });

    setSaving(true);
    try {
      const payload = { ...formData, branch_id: branchId, section_id: sectionId, course_id: courseId };
      
      if (editData) {
        const { error } = await supabase.from('course_lessons').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('course_lessons').insert(payload);
        if (error) throw error;
      }
      toast({ title: 'Lesson saved' });
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
          <DialogTitle>{editData ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lesson Type</Label>
              <Select value={formData.lesson_type} onValueChange={v => setFormData({...formData, lesson_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Document">Document</SelectItem>
                  <SelectItem value="Text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.lesson_type === 'Video' && (
              <div className="space-y-2">
                <Label>Video Provider</Label>
                <Select value={formData.video_provider} onValueChange={v => setFormData({...formData, video_provider: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Youtube">Youtube</SelectItem>
                    <SelectItem value="Vimeo">Vimeo</SelectItem>
                    <SelectItem value="HTML5">HTML5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {formData.lesson_type === 'Video' && (
            <>
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="hh:mm:ss" />
              </div>
            </>
          )}

          {(formData.lesson_type === 'PDF' || formData.lesson_type === 'Document') && (
             <div className="space-y-2">
                <Label>Attachment</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" onChange={(e) => handleFileUpload(e, 'doc')} disabled={uploading} />
                  {uploading && <Loader2 className="animate-spin h-4 w-4" />}
                </div>
                {formData.attachment_url && <p className="text-xs text-green-600 truncate">File attached</p>}
             </div>
          )}

          <div className="space-y-2">
             <Label>Inline Preview Image</Label>
             <div className="flex items-center gap-2">
               <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'preview')} disabled={uploading} />
               {uploading && <Loader2 className="animate-spin h-4 w-4" />}
             </div>
             {formData.preview_image && <p className="text-xs text-green-600 truncate">Image uploaded</p>}
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <Textarea value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
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

export default AddEditLessonModal;
