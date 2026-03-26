import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FileText } from 'lucide-react';

const NoticesTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState([]);
  const [editingNotice, setEditingNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branchId) loadNotices();
  }, [branchId]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getNotices(branchId);
      setNotices(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load notices' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { branch_id: branchId, ...editingNotice };
      await cmsEditorService.upsertNotice(payload);
      toast({ title: 'Success', description: 'Notice saved' });
      setEditingNotice(null);
      loadNotices();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save notice' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete notice?')) return;
    try {
      await cmsEditorService.deleteNotice(id);
      loadNotices();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const initNewNotice = () => ({
    title: '',
    content: '',
    notice_date: new Date().toISOString().split('T')[0],
    pdf_url: '',
    is_published: true
  });

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notice Board</h3>
        <Button size="sm" onClick={() => setEditingNotice(initNewNotice())}>
          <Plus className="h-4 w-4 mr-2" /> Add Notice
        </Button>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="space-y-2">
          {notices.map(notice => (
            <div key={notice.id} className="p-4 border rounded-lg bg-white flex justify-between items-start shadow-sm">
              <div>
                <div className="text-xs font-bold text-blue-600 mb-1">{notice.notice_date}</div>
                <div className="font-medium">{notice.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-1">{notice.content}</div>
                {notice.pdf_url && (
                  <a href={notice.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center mt-1">
                    <FileText className="h-3 w-3 mr-1" /> View PDF
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingNotice(notice)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(notice.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {notices.length === 0 && <div className="text-center text-muted-foreground py-8 border rounded-lg border-dashed">No notices posted.</div>}
        </div>
      )}

      <Dialog open={!!editingNotice} onOpenChange={open => !open && setEditingNotice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingNotice?.id ? 'Edit Notice' : 'New Notice'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={editingNotice?.notice_date || ''} onChange={e => setEditingNotice(p => ({...p, notice_date: e.target.value}))} required />
            </div>
            
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={editingNotice?.title || ''} onChange={e => setEditingNotice(p => ({...p, title: e.target.value}))} required />
            </div>

            <div className="grid gap-2">
              <Label>Content / Summary</Label>
              <Textarea value={editingNotice?.content || ''} onChange={e => setEditingNotice(p => ({...p, content: e.target.value}))} className="min-h-[100px]" />
            </div>

            <div className="grid gap-2">
              <Label>PDF Link (Optional)</Label>
              <Input value={editingNotice?.pdf_url || ''} onChange={e => setEditingNotice(p => ({...p, pdf_url: e.target.value}))} placeholder="https://..." />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="pub" 
                checked={editingNotice?.is_published} 
                onCheckedChange={c => setEditingNotice(p => ({...p, is_published: c}))} 
              />
              <Label htmlFor="pub">Published</Label>
            </div>

            <DialogFooter><Button type="submit" disabled={saving}>Save Notice</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoticesTab;
