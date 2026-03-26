import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';
import MediaSelectorModal from '@/components/front-cms/MediaSelectorModal';

const NewsTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [editing, setEditing] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => { if (branchId) loadNews(); }, [branchId]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getNews(branchId);
      setNews(data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!editing.title_en) return toast({ variant: 'destructive', title: 'Title required' });
    try {
      await cmsEditorService.upsertNews({ ...editing, branch_id: branchId });
      toast({ title: 'News Saved' });
      setEditing(null);
      loadNews();
    } catch (error) { toast({ variant: 'destructive', title: 'Save failed' }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await cmsEditorService.deleteNews(id);
    loadNews();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">News & Updates</h3>
        <Button onClick={() => setEditing({ is_published: true, date: new Date().toISOString().split('T')[0] })}><Plus className="mr-2 h-4 w-4" /> Add News</Button>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid gap-3">
          {news.map(item => (
            <div key={item.id} className="flex justify-between p-4 border rounded-lg bg-white">
              <div>
                <div className="font-bold">{item.title_en}</div>
                <div className="text-sm text-slate-500">{item.date} • {item.is_published ? 'Published' : 'Draft'}</div>
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
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Edit News</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title (EN)</Label><Input value={editing?.title_en || ''} onChange={e => setEditing(p => ({...p, title_en: e.target.value}))} /></div>
              <div><Label>Date</Label><Input type="date" value={editing?.date || ''} onChange={e => setEditing(p => ({...p, date: e.target.value}))} /></div>
            </div>
            <div><Label>Title (KN)</Label><Input value={editing?.title_kn || ''} onChange={e => setEditing(p => ({...p, title_kn: e.target.value}))} /></div>
            <div>
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input value={editing?.image_url || ''} onChange={e => setEditing(p => ({...p, image_url: e.target.value}))} />
                <Button variant="outline" onClick={() => setMediaOpen(true)}><ImageIcon className="h-4 w-4" /></Button>
              </div>
            </div>
            <div><Label>Excerpt (Short)</Label><Textarea value={editing?.excerpt_en || ''} onChange={e => setEditing(p => ({...p, excerpt_en: e.target.value}))} /></div>
            <div><Label>Content (Full)</Label><Textarea className="h-32" value={editing?.content_en || ''} onChange={e => setEditing(p => ({...p, content_en: e.target.value}))} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing?.is_published} onCheckedChange={c => setEditing(p => ({...p, is_published: c}))} /><Label>Published</Label></div>
          </div>
          <DialogFooter><Button onClick={handleSave}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <MediaSelectorModal isOpen={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={f => setEditing(p => ({...p, image_url: f.file_url}))} />
    </div>
  );
};

export default NewsTab;
