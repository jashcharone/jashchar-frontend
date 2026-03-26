import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Reorder } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, GripVertical } from 'lucide-react';

const OrderSectionModal = ({ isOpen, onClose, sections, onSave }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItems(sections);
    }
  }, [isOpen, sections]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update order_index for each section
      const updates = items.map((item, index) => 
        supabase.from('course_sections').update({ order_index: index }).eq('id', item.id)
      );
      await Promise.all(updates);
      toast({ title: 'Order updated' });
      onSave();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Order Sections</DialogTitle></DialogHeader>
        <div className="py-4">
          <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
            {items.map((item) => (
              <Reorder.Item key={item.id} value={item} className="bg-white border p-3 rounded flex items-center gap-3 cursor-grab active:cursor-grabbing shadow-sm">
                <GripVertical className="text-gray-400" />
                <span>{item.title}</span>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderSectionModal;
