import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Edit, Image as ImageIcon } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';
import MediaSelectorModal from '@/components/front-cms/MediaSelectorModal';

const EventsTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    if (branchId) loadEvents();
  }, [branchId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getEvents(branchId);
      setEvents(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load events' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { branch_id: branchId, ...editingEvent };
      await cmsEditorService.upsertEvent(payload);
      toast({ title: 'Success', description: 'Event saved' });
      setEditingEvent(null);
      loadEvents();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save event' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await cmsEditorService.deleteEvent(id);
      toast({ title: 'Deleted', description: 'Event removed' });
      loadEvents();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete event' });
    }
  };

  const handleImageSelect = (url) => {
    setEditingEvent(prev => ({ ...prev, image_url: url }));
    setIsMediaModalOpen(false);
  };

  const initNewEvent = () => ({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    image_url: '',
    is_published: true
  });

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Events Calendar</h3>
        <Button size="sm" onClick={() => setEditingEvent(initNewEvent())}>
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-sm transition">
              <div className="flex items-center gap-4">
                {event.image_url && (
                  <img src={event.image_url} alt="" className="w-16 h-16 object-cover rounded-md bg-slate-100" />
                )}
                <div>
                  <h4 className="font-medium">{event.title || 'Untitled'}</h4>
                  <div className="text-sm text-muted-foreground">
                    {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'No Date'}
                    {event.location && ` • ${event.location}`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingEvent(event)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(event.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {events.length === 0 && <div className="text-center py-8 text-muted-foreground">No events found.</div>}
        </div>
      )}

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingEvent?.id ? 'Edit Event' : 'Add Event'}</DialogTitle></DialogHeader>
          {editingEvent && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={editingEvent.start_date ? new Date(editingEvent.start_date).toISOString().slice(0, 16) : ''} 
                    onChange={e => setEditingEvent(p => ({...p, start_date: e.target.value}))} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date & Time (Optional)</Label>
                  <Input 
                    type="datetime-local" 
                    value={editingEvent.end_date ? new Date(editingEvent.end_date).toISOString().slice(0, 16) : ''} 
                    onChange={e => setEditingEvent(p => ({...p, end_date: e.target.value}))} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Event Title <span className="text-red-500">*</span></Label>
                <Input 
                  value={editingEvent.title || ''} 
                  onChange={e => setEditingEvent(p => ({...p, title: e.target.value}))} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Location / Venue</Label>
                <Input 
                  value={editingEvent.location || ''} 
                  onChange={e => setEditingEvent(p => ({...p, location: e.target.value}))} 
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={editingEvent.description || ''} 
                  onChange={e => setEditingEvent(p => ({...p, description: e.target.value}))} 
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Event Image</Label>
                <div className="flex items-center gap-4">
                  {editingEvent.image_url ? (
                    <div className="relative w-32 h-20 border rounded overflow-hidden group">
                      <img src={editingEvent.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setIsMediaModalOpen(true)}>
                        <span className="text-white text-xs">Change</span>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setIsMediaModalOpen(true)}>
                      <ImageIcon className="h-4 w-4 mr-2" /> Select Image
                    </Button>
                  )}
                  {editingEvent.image_url && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => setEditingEvent(p => ({...p, image_url: ''}))}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="pub" 
                  checked={editingEvent.is_published} 
                  onCheckedChange={c => setEditingEvent(p => ({...p, is_published: c}))} 
                />
                <Label htmlFor="pub">Published</Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <MediaSelectorModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleImageSelect}
        branchId={branchId}
      />
    </div>
  );
};

export default EventsTab;
