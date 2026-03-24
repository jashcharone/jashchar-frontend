import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
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

const NewsTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newsList, setNewsList] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    if (branchId) loadNews();
  }, [branchId]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getNews(branchId);
      setNewsList(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load news' });
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
        ...editingItem
      };
      await cmsEditorService.upsertNews(payload);
      toast({ title: 'Success', description: 'News item saved' });
      setEditingItem(null);
      loadNews();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save news' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await cmsEditorService.deleteNews(id);
      toast({ title: 'Deleted', description: 'News item removed' });
      loadNews();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete item' });
    }
  };

  const handleImageSelect = (url) => {
    setEditingItem(prev => ({ ...prev, image_url: url }));
    setIsMediaModalOpen(false);
  };

  const initNewItem = () => ({
    title: '',
    summary: '',
    content_html: '',
    image_url: '',
    published_at: new Date().toISOString().split('T')[0],
    is_published: true
  });

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-white">News Management</h3>
        <Button size="sm" onClick={() => setEditingItem(initNewItem())}>
          <Plus className="h-4 w-4 mr-2" /> Add News
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {newsList.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 hover:shadow-sm transition">
              <div className="flex items-center gap-4">
                {item.image_url && (
                  <img src={item.image_url} alt="" className="w-16 h-16 object-cover rounded-md bg-slate-100 dark:bg-slate-700" />
                )}
                <div>
                  <h4 className="font-medium dark:text-white">{item.title || 'Untitled'}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">{item.summary}</p>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {item.published_at ? formatDate(item.published_at) : 'No Date'} • {item.is_published ? 'Published' : 'Draft'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-red-500 dark:text-red-400" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {newsList.length === 0 && <div className="text-center py-8 text-muted-foreground">No news items yet.</div>}
        </div>
      )}

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingItem?.id ? 'Edit News' : 'Add News'}</DialogTitle></DialogHeader>
          {editingItem && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <Label>Published Date</Label>
                <Input 
                  type="date" 
                  value={editingItem.published_at ? new Date(editingItem.published_at).toISOString().split('T')[0] : ''} 
                  onChange={e => setEditingItem(p => ({...p, published_at: e.target.value}))} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input 
                  value={editingItem.title || ''} 
                  onChange={e => setEditingItem(p => ({...p, title: e.target.value}))} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Summary (Short Description)</Label>
                <Textarea 
                  value={editingItem.summary || ''} 
                  onChange={e => setEditingItem(p => ({...p, summary: e.target.value}))} 
                />
              </div>

              <div className="space-y-2">
                <Label>Full Content (HTML)</Label>
                <Textarea 
                  className="min-h-[150px] font-mono text-sm"
                  value={editingItem.content_html || ''} 
                  onChange={e => setEditingItem(p => ({...p, content_html: e.target.value}))} 
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="flex items-center gap-4">
                  {editingItem.image_url ? (
                    <div className="relative w-32 h-20 border rounded overflow-hidden group">
                      <img src={editingItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setIsMediaModalOpen(true)}>
                        <span className="text-white text-xs">Change</span>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setIsMediaModalOpen(true)}>
                      <ImageIcon className="h-4 w-4 mr-2" /> Select Image
                    </Button>
                  )}
                  {editingItem.image_url && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => setEditingItem(p => ({...p, image_url: ''}))}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="pub" 
                  checked={editingItem.is_published} 
                  onCheckedChange={c => setEditingItem(p => ({...p, is_published: c}))} 
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

export default NewsTab;
