import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const NoticesTab = ({ branchId }) => {
  const [notices, setNotices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (branchId) load(); }, [branchId]);

  const load = async () => {
    setLoading(true);
    const data = await cmsEditorService.getNotices(branchId);
    setNotices(data || []);
    setLoading(false);
  };

  const save = async () => {
    await cmsEditorService.upsertNotice({ ...editing, branch_id: branchId });
    setEditing(null);
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Delete?')) return;
    await cmsEditorService.deleteNotice(id);
    load();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notices</h3>
        <Button onClick={() => setEditing({ is_published: true, notice_date: new Date().toISOString().split('T')[0] })}><Plus className="mr-2 h-4 w-4" /> Add Notice</Button>
      </div>
      
      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="space-y-2">
          {notices.map(n => (
            <div key={n.id} className="flex justify-between items-center p-3 border rounded bg-white">
              <div className="flex-1">
                <div className="font-bold">{n.title_en}</div>
                <div className="text-xs text-slate-500">{n.notice_date}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditing(n)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => del(n.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Notice</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Date</Label><Input type="date" value={editing?.notice_date || ''} onChange={e => setEditing(p => ({...p, notice_date: e.target.value}))} /></div>
            <div><Label>Title</Label><Input value={editing?.title_en || ''} onChange={e => setEditing(p => ({...p, title_en: e.target.value}))} /></div>
            <div><Label>Content</Label><Textarea value={editing?.content_en || ''} onChange={e => setEditing(p => ({...p, content_en: e.target.value}))} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing?.is_published} onCheckedChange={c => setEditing(p => ({...p, is_published: c}))} /><Label>Published</Label></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoticesTab;
