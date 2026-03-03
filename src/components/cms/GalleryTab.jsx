import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';
import MediaSelectorModal from '@/components/front-cms/MediaSelectorModal';

const GalleryTab = ({ branchId }) => {
  const { toast } = useToast();
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [images, setImages] = useState([]);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  useEffect(() => { if (branchId) loadAlbums(); }, [branchId]);
  useEffect(() => { if (selectedAlbum) loadImages(); }, [selectedAlbum]);

  const loadAlbums = async () => {
    setLoading(true);
    const data = await cmsEditorService.getAlbums(branchId);
    setAlbums(data || []);
    setLoading(false);
  };

  const loadImages = async () => {
    if (!selectedAlbum) return;
    const data = await cmsEditorService.getImages(selectedAlbum.id);
    setImages(data || []);
  };

  const handleSaveAlbum = async () => {
    await cmsEditorService.upsertAlbum({ ...editingAlbum, branch_id: branchId });
    setEditingAlbum(null);
    loadAlbums();
  };

  const handleAddImages = async (files) => {
    const fileArray = Array.isArray(files) ? files : [files];
    for (const f of fileArray) {
      await cmsEditorService.upsertImage({
        branch_id: branchId,
        album_id: selectedAlbum.id,
        image_url: f.file_url
      });
    }
    loadImages();
  };

  const handleDeleteImage = async (id) => {
    await cmsEditorService.deleteImage(id);
    loadImages();
  };

  return (
    <div className="flex h-[600px] border rounded-lg bg-white overflow-hidden">
      <div className="w-1/3 border-r p-4 overflow-y-auto bg-slate-50">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold">Albums</h4>
          <Button size="sm" onClick={() => setEditingAlbum({ is_published: true })}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          {albums.map(alb => (
            <div key={alb.id} 
              className={`p-3 rounded cursor-pointer flex justify-between items-center ${selectedAlbum?.id === alb.id ? 'bg-white shadow border' : 'hover:bg-slate-100'}`}
              onClick={() => setSelectedAlbum(alb)}
            >
              <div className="truncate font-medium">{alb.title_en}</div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {selectedAlbum ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold">{selectedAlbum.title_en} - Images</h4>
              <Button size="sm" onClick={() => setMediaOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Images</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map(img => (
                <div key={img.id} className="relative group aspect-square bg-slate-100 rounded overflow-hidden">
                  <img src={img.image_url} className="w-full h-full object-cover" />
                  <button onClick={() => handleDeleteImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">Select an album to manage images</div>
        )}
      </div>

      <Dialog open={!!editingAlbum} onOpenChange={() => setEditingAlbum(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Album</DialogTitle></DialogHeader>
          <div className="py-4"><Label>Album Title</Label><Input value={editingAlbum?.title_en || ''} onChange={e => setEditingAlbum(p => ({...p, title_en: e.target.value}))} /></div>
          <DialogFooter><Button onClick={handleSaveAlbum}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaSelectorModal isOpen={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={handleAddImages} allowMultiple />
    </div>
  );
};

export default GalleryTab;
