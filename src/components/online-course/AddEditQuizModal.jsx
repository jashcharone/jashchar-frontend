import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const AddEditQuizModal = ({ isOpen, onClose, sectionId, courseId, branchId, onSave, editData }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    instruction: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title,
          instruction: editData.instruction || ''
        });
      } else {
        setFormData({ title: '', instruction: '' });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast({ variant: 'destructive', title: 'Title is required' });

    setSaving(true);
    try {
      const payload = { ...formData, branch_id: branchId, section_id: sectionId, course_id: courseId };
      
      if (editData) {
        const { error } = await supabase.from('course_quizzes').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('course_quizzes').insert(payload);
        if (error) throw error;
      }
      toast({ title: 'Quiz saved' });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? 'Edit Quiz' : 'Add Quiz'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Quiz Title *</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Instruction</Label>
            <Textarea value={formData.instruction} onChange={e => setFormData({...formData, instruction: e.target.value})} />
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

export default AddEditQuizModal;
