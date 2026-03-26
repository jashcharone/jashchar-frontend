import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Edit, Image as ImageIcon } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';
import MediaSelectorModal from '@/components/front-cms/MediaSelectorModal';

const BannersTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    if (branchId) loadBanners();
  }, [branchId]);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getBanners(branchId);
      setBanners(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load banners' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        branch_id: branchId,
        ...editingBanner
      };
      await cmsEditorService.upsertBanner(payload);
      toast({ title: 'Success', description: 'Banner saved' });
      setEditingBanner(null);
      loadBanners();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save banner' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await cmsEditorService.deleteBanner(id);
      loadBanners();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting banner' });
    }
  };

  const handleMediaSelect = (url) => {
    setEditingBanner(prev => ({ ...prev, image_url: url }));
    setIsMediaModalOpen(false);
  };

  const initNewBanner = () => ({
    title: '',
    image_url: '',
    link_url: '',
    button_text: '',
    description: '',
    position: banners.length + 1,
    is_active: true
  });

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-white">Homepage Banners</h3>
        <Button size="sm" onClick={() => setEditingBanner(initNewBanner())}>
          <Plus className="h-4 w-4 mr-2" /> Add Banner
        </Button>
      </div>

      {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : (
        <div className="grid gap-4">
          {banners.map(banner => (
            <div key={banner.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
              <div className="h-20 w-32 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden flex-shrink-0 border dark:border-slate-600">
                {banner.image_url ? (
                  <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><ImageIcon className="text-slate-300 dark:text-slate-500" /></div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium dark:text-white">{banner.title}</h4>
                <div className="text-sm text-muted-foreground truncate">{banner.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-xs px-2 py-1 rounded-full ${banner.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditingBanner(banner)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300" onClick={() => handleDelete(banner.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {banners.length === 0 && <div className="text-center p-8 text-muted-foreground border-dashed border rounded-lg dark:border-slate-700">No banners found. Add one to display on the homepage.</div>}
        </div>
      )}

      <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner?.id ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
          </DialogHeader>
          {editingBanner && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Banner Title</Label>
                <Input value={editingBanner.title || ''} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} required />
              </div>
              
              <div>
                <Label>Banner Image</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={editingBanner.image_url || ''} readOnly placeholder="Select an image..." />
                  <Button type="button" variant="secondary" onClick={() => setIsMediaModalOpen(true)}>Select</Button>
                </div>
                {editingBanner.image_url && (
                  <div className="mt-2 h-32 w-full bg-slate-50 rounded border overflow-hidden">
                    <img src={editingBanner.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <Label>Link URL (Optional)</Label>
                <Input value={editingBanner.link_url || ''} onChange={e => setEditingBanner({...editingBanner, link_url: e.target.value})} placeholder="https://..." />
              </div>

              <div>
                <Label>Button Text</Label>
                <Input value={editingBanner.button_text || ''} onChange={e => setEditingBanner({...editingBanner, button_text: e.target.value})} />
              </div>

              <div>
                <Label>Description / Caption</Label>
                <Input value={editingBanner.description || ''} onChange={e => setEditingBanner({...editingBanner, description: e.target.value})} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="active" 
                  checked={editingBanner.is_active}
                  onCheckedChange={c => setEditingBanner({...editingBanner, is_active: c})}
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Banner
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <MediaSelectorModal 
        isOpen={isMediaModalOpen} 
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
        branchId={branchId}
      />
    </div>
  );
};

export default BannersTab;
