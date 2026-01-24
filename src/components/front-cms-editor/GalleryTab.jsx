import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Image as ImageIcon, FolderOpen, ArrowLeft, Edit } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';
import MediaSelectorModal from '@/components/front-cms/MediaSelectorModal';

const GalleryTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [images, setImages] = useState([]);
  
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState(null); // 'album' or 'image'

  useEffect(() => {
    if (branchId) loadAlbums();
  }, [branchId]);

  useEffect(() => {
    if (selectedAlbum) loadImages(selectedAlbum.id);
  }, [selectedAlbum]);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getAlbums(branchId);
      setAlbums(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load albums' });
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (albumId) => {
    try {
      const data = await cmsEditorService.getImages(albumId);
      setImages(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load images' });
    }
  };

  const handleSaveAlbum = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cmsEditorService.upsertAlbum({ branch_id: branchId, ...editingAlbum });
      toast({ title: 'Success', description: 'Album saved' });
      setEditingAlbum(null);
      loadAlbums();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save album' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveImage = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await cmsEditorService.upsertImage({ branch_id: branchId, album_id: selectedAlbum.id, ...editingImage });
      toast({ title: 'Success', description: 'Image added' });
      setEditingImage(null);
      loadImages(selectedAlbum.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save image' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlbum = async (id) => {
    if (!window.confirm('Delete album and all its images?')) return;
    try {
      await cmsEditorService.deleteAlbum(id);
      loadAlbums();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const handleDeleteImage = async (id) => {
    if (!window.confirm('Delete image?')) return;
    try {
      await cmsEditorService.deleteImage(id);
      loadImages(selectedAlbum.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error' });
    }
  };

  const handleMediaSelect = (url) => {
    if (mediaMode === 'album') {
      setEditingAlbum(prev => ({ ...prev, cover_image_url: url }));
    } else if (mediaMode === 'image') {
      setEditingImage(prev => ({ ...prev, image_url: url }));
    }
    setIsMediaModalOpen(false);
  };

  const openMediaModal = (mode) => {
    setMediaMode(mode);
    setIsMediaModalOpen(true);
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  // View: Inside Album
  if (selectedAlbum) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-4 border-b dark:border-slate-700 pb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedAlbum(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h3 className="text-lg font-semibold dark:text-white">{selectedAlbum.title}</h3>
            <p className="text-sm text-muted-foreground">{images.length} Images</p>
          </div>
          <div className="ml-auto">
            <Button size="sm" onClick={() => setEditingImage({ image_url: '', caption: '' })}>
              <Plus className="h-4 w-4 mr-2" /> Add Photo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map(img => (
            <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
              <img src={img.image_url} alt={img.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteImage(img.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {img.caption && (
                <div className="absolute bottom-0 w-full bg-black/60 text-white text-xs p-1 truncate">
                  {img.caption}
                </div>
              )}
            </div>
          ))}
          {images.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No photos in this album yet.</div>}
        </div>

        <Dialog open={!!editingImage} onOpenChange={open => !open && setEditingImage(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Photo</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveImage} className="space-y-4">
              <div className="grid gap-2">
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input value={editingImage?.image_url || ''} onChange={e => setEditingImage(p => ({...p, image_url: e.target.value}))} required placeholder="https://..." />
                  <Button type="button" variant="outline" onClick={() => openMediaModal('image')}><ImageIcon className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Caption (Optional)</Label>
                <Input value={editingImage?.caption || ''} onChange={e => setEditingImage(p => ({...p, caption: e.target.value}))} />
              </div>
              <DialogFooter><Button type="submit" disabled={saving}>Save Photo</Button></DialogFooter>
            </form>
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
  }

  // View: Album List
  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold dark:text-white">Photo Albums</h3>
        <Button size="sm" onClick={() => setEditingAlbum({ title: '', description: '', cover_image_url: '' })}>
          <Plus className="h-4 w-4 mr-2" /> Create Album
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {albums.map(album => (
          <div key={album.id} className="border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setSelectedAlbum(album)}>
            <div className="aspect-video bg-slate-100 dark:bg-slate-700 relative flex items-center justify-center">
              {album.cover_image_url ? (
                <img src={album.cover_image_url} className="w-full h-full object-cover" />
              ) : (
                <FolderOpen className="h-12 w-12 text-slate-300 dark:text-slate-500" />
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800" onClick={(e) => { e.stopPropagation(); setEditingAlbum(album); }}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <div className="flex justify-between items-start">
                <div className="overflow-hidden pr-2">
                  <h4 className="font-medium truncate dark:text-white">{album.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{album.description}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 -mr-2 -mt-1 shrink-0" onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {albums.length === 0 && <div className="col-span-3 text-center py-8 text-muted-foreground border rounded-lg border-dashed dark:border-slate-700">No albums created yet.</div>}
      </div>

      <Dialog open={!!editingAlbum} onOpenChange={open => !open && setEditingAlbum(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAlbum?.id ? 'Edit Album' : 'New Album'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveAlbum} className="space-y-4">
            <div className="grid gap-2">
              <Label>Album Title</Label>
              <Input value={editingAlbum?.title || ''} onChange={e => setEditingAlbum(p => ({...p, title: e.target.value}))} required />
            </div>
            <div className="grid gap-2">
              <Label>Description (Optional)</Label>
              <Input value={editingAlbum?.description || ''} onChange={e => setEditingAlbum(p => ({...p, description: e.target.value}))} />
            </div>
            <div className="grid gap-2">
              <Label>Cover Image URL (Optional)</Label>
              <div className="flex gap-2">
                <Input value={editingAlbum?.cover_image_url || ''} onChange={e => setEditingAlbum(p => ({...p, cover_image_url: e.target.value}))} placeholder="https://..." />
                <Button type="button" variant="outline" onClick={() => openMediaModal('album')}><ImageIcon className="h-4 w-4" /></Button>
              </div>
            </div>
            <DialogFooter><Button type="submit" disabled={saving}>Save Album</Button></DialogFooter>
          </form>
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

export default GalleryTab;
