import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const EventsTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => { if (branchId) loadEvents(); }, [branchId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getEvents(branchId);
      setEvents(data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!editing.title_en) return toast({ variant: 'destructive', title: 'Title required' });
    try {
      await cmsEditorService.upsertEvent({ ...editing, branch_id: branchId });
      toast({ title: 'Event Saved' });
      setEditing(null);
      loadEvents();
    } catch (error) { toast({ variant: 'destructive', title: 'Save failed' }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await cmsEditorService.deleteEvent(id);
    loadEvents();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">School Events</h3>
        <Button onClick={() => setEditing({ is_published: true })}><Plus className="mr-2 h-4 w-4" /> Add Event</Button>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid gap-3">
          {events.map(item => (
            <div key={item.id} className="flex justify-between p-4 border rounded-lg bg-white">
              <div>
                <div className="font-bold">{item.title_en}</div>
                <div className="text-sm text-slate-500">{new Date(item.start_date).toLocaleDateString()} • {item.location}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditing(item)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date/Time</Label><Input type="datetime-local" value={editing?.start_date ? new Date(editing.start_date).toISOString().slice(0, 16) : ''} onChange={e => setEditing(p => ({...p, start_date: e.target.value}))} /></div>
              <div><Label>End Date/Time</Label><Input type="datetime-local" value={editing?.end_date ? new Date(editing.end_date).toISOString().slice(0, 16) : ''} onChange={e => setEditing(p => ({...p, end_date: e.target.value}))} /></div>
            </div>
            <div><Label>Title (EN)</Label><Input value={editing?.title_en || ''} onChange={e => setEditing(p => ({...p, title_en: e.target.value}))} /></div>
            <div><Label>Location</Label><Input value={editing?.location || ''} onChange={e => setEditing(p => ({...p, location: e.target.value}))} /></div>
            <div><Label>Description</Label><Textarea value={editing?.description_en || ''} onChange={e => setEditing(p => ({...p, description_en: e.target.value}))} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing?.is_published} onCheckedChange={c => setEditing(p => ({...p, is_published: c}))} /><Label>Published</Label></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsTab;
