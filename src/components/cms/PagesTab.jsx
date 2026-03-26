import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const PagesTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (branchId) loadPages(); }, [branchId]);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getPages(branchId);
      setPages(data || []);
    } catch (error) { toast({ variant: 'destructive', title: 'Error loading pages' }); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!editing.slug || !editing.title_en) return toast({ variant: 'destructive', title: 'Title and Slug required' });
    setSaving(true);
    try {
      await cmsEditorService.upsertPage({ ...editing, branch_id: branchId });
      toast({ title: 'Page Saved' });
      setEditing(null);
      loadPages();
    } catch (error) { toast({ variant: 'destructive', title: 'Save failed' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete page?')) return;
    try { await cmsEditorService.deletePage(id); loadPages(); } 
    catch (error) { toast({ variant: 'destructive', title: 'Delete failed' }); }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Custom Pages</h3>
        <Button onClick={() => setEditing({ is_published: true, show_in_menu: true })}><Plus className="mr-2 h-4 w-4" /> Add Page</Button>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid gap-3">
          {pages.map(page => (
            <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-500" />
                <div>
                  <div className="font-bold">{page.title_en}</div>
                  <div className="text-xs text-slate-500">/{page.slug}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${page.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{page.is_published ? 'Published' : 'Draft'}</span>
                <Button variant="ghost" size="icon" onClick={() => setEditing(page)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(page.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {pages.length === 0 && <div className="text-center py-8 text-slate-500">No pages found.</div>}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit Page' : 'Create Page'}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto p-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title (English)</Label><Input value={editing?.title_en || ''} onChange={e => setEditing(p => ({...p, title_en: e.target.value}))} /></div>
              <div><Label>Title (Kannada)</Label><Input value={editing?.title_kn || ''} onChange={e => setEditing(p => ({...p, title_kn: e.target.value}))} /></div>
            </div>
            <div><Label>URL Slug</Label><Input value={editing?.slug || ''} onChange={e => setEditing(p => ({...p, slug: e.target.value}))} placeholder="about-us" /></div>
            <div>
              <Label>Content (English)</Label>
              <Textarea className="min-h-[150px]" value={editing?.content_en || ''} onChange={e => setEditing(p => ({...p, content_en: e.target.value}))} />
            </div>
            <div>
              <Label>Content (Kannada)</Label>
              <Textarea className="min-h-[150px]" value={editing?.content_kn || ''} onChange={e => setEditing(p => ({...p, content_kn: e.target.value}))} />
            </div>
            <div className="flex gap-6 pt-2">
              <div className="flex items-center gap-2"><Switch checked={editing?.is_published} onCheckedChange={c => setEditing(p => ({...p, is_published: c}))} /><Label>Published</Label></div>
              <div className="flex items-center gap-2"><Switch checked={editing?.show_in_menu} onCheckedChange={c => setEditing(p => ({...p, show_in_menu: c}))} /><Label>Show in Default Menu</Label></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Page'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagesTab;
