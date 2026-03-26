import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, Edit, Image as ImageIcon, GripVertical } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';
import MediaSelectorModal from '@/components/front-cms/MediaSelectorModal';

const BannersTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => {
    if (branchId) {
      loadData();
    }
  }, [branchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bannersData, pagesData] = await Promise.all([
        cmsEditorService.getBanners(branchId),
        cmsEditorService.getPages(branchId)
      ]);
      setBanners(bannersData || []);
      setPages(pagesData || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error loading data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await cmsEditorService.upsertBanner({ ...editing, branch_id: branchId });
      toast({ title: 'Saved', description: 'Banner updated successfully.' });
      setEditing(null);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving banner' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await cmsEditorService.deleteBanner(id);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting banner' });
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Homepage Banners</h3>
        <Button onClick={() => setEditing({ is_active: true, position: banners.length + 1, link_type: 'none' })}>
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div key={banner.id} className="flex items-center gap-4 p-3 border rounded-lg bg-white">
              <GripVertical className="text-slate-400 cursor-move" />
              <div className="w-24 h-16 bg-slate-100 rounded overflow-hidden">
                {banner.image_url ? <img src={banner.image_url} className="w-full h-full object-cover" /> : <ImageIcon className="m-auto mt-4 text-slate-300" />}
              </div>
              <div className="flex-1">
                <div className="font-bold">{banner.title || 'Untitled Banner'}</div>
                <div className="text-xs text-slate-500">{banner.link_type === 'page' ? `Page: ${banner.page_slug}` : banner.link_type === 'external' ? `URL: ${banner.external_url}` : 'No Link'}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{banner.is_active ? 'Active' : 'Hidden'}</span>
                <Button variant="ghost" size="icon" onClick={() => setEditing(banner)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(banner.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {banners.length === 0 && <div className="text-center py-8 text-slate-500">No banners added yet.</div>}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit Banner' : 'Add Banner'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Banner Title</Label>
              <Input value={editing?.title || ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Image URL</Label>
              <div className="flex gap-2">
                <Input value={editing?.image_url || ''} onChange={e => setEditing(p => ({ ...p, image_url: e.target.value }))} />
                <Button variant="outline" onClick={() => setMediaOpen(true)}><ImageIcon className="h-4 w-4" /></Button>
              </div>
            </div>
            <div>
              <Label>Link Type</Label>
              <Select value={editing?.link_type} onValueChange={v => setEditing(p => ({ ...p, link_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Link</SelectItem>
                  <SelectItem value="page">Internal Page</SelectItem>
                  <SelectItem value="external">External URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editing?.link_type === 'page' && (
              <div>
                <Label>Select Page</Label>
                <Select value={editing?.page_slug} onValueChange={v => setEditing(p => ({ ...p, page_slug: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select a page" /></SelectTrigger>
                  <SelectContent>
                    {pages.map(pg => <SelectItem key={pg.id} value={pg.slug}>{pg.title_en || pg.slug}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editing?.link_type === 'external' && (
              <div>
                <Label>External URL</Label>
                <Input value={editing?.external_url || ''} onChange={e => setEditing(p => ({ ...p, external_url: e.target.value }))} placeholder="https://..." />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={editing?.is_active} onCheckedChange={c => setEditing(p => ({ ...p, is_active: c }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaSelectorModal isOpen={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={f => setEditing(p => ({ ...p, image_url: f.file_url }))} />
    </div>
  );
};

export default BannersTab;
