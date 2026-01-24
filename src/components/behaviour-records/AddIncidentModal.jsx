import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const AddIncidentModal = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    point: '',
    is_negative: false,
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked) => {
    setFormData(prev => ({ ...prev, is_negative: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.point || !formData.description) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all required fields" });
      return;
    }

    if (isNaN(formData.point)) {
      toast({ variant: "destructive", title: "Error", description: "Point must be a number" });
      return;
    }

    setLoading(true);
    try {
      // Calculate the actual point value based on checkbox
      let pointValue = Math.abs(parseInt(formData.point));
      if (formData.is_negative) {
        pointValue = -pointValue;
      }

      const { data, error } = await supabase
        .from('behaviour_incidents')
        .insert([
          {
            branch_id: user.user_metadata.branch_id,
            title: formData.title,
            point: pointValue,
            is_negative: formData.is_negative,
            description: formData.description,
          }
        ])
        .select();

      if (error) throw error;

      toast({ title: "Success", description: "Incident created successfully" });
      onSave(data[0]);
      onClose();
      setFormData({ title: '', point: '', is_negative: false, description: '' });
    } catch (error) {
      console.error("Error creating incident:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" required>Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter incident title"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="point" required>Point</Label>
              <Input
                id="point"
                name="point"
                type="number"
                value={formData.point}
                onChange={handleChange}
                placeholder="Enter points"
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="is_negative"
                checked={formData.is_negative}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="is_negative">Is This Negative Incident</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" required>Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddIncidentModal;
