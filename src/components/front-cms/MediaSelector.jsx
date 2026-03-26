import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Upload, Image as ImageIcon, File, Video, Search, Check, PlayCircle } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';

const MediaSelector = ({ onSelect, trigger, type = 'all', branchId }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getMedia(branchId);
      if (response.success) {
        setMedia(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading media' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `cms/${fileName}`;

      console.log('[MediaSelector] Uploading file:', file.name, 'to path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(filePath, file);

      if (uploadError) {
        console.error('[MediaSelector] Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('school-assets')
        .getPublicUrl(filePath);

      console.log('[MediaSelector] File uploaded, public URL:', publicUrl);

      // Save to DB
      const mediaData = {
        url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        size_bytes: file.size,
        storage_path: filePath
      };

      const response = await frontCmsService.createMedia(mediaData, branchId);
      if (response.success) {
        toast({ title: 'File uploaded successfully' });
        loadMedia();
        // Reset file input
        e.target.value = '';
      } else {
        throw new Error(response.message || 'Failed to save media record');
      }
    } catch (error) {
      console.error('[MediaSelector] Upload error:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message || 'Unknown error' });
    } finally {
      setUploading(false);
    }
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.filename?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = type === 'all' || (type === 'image' && item.mime_type?.startsWith('image/')) || (type === 'video' && item.mime_type?.startsWith('video/'));
    return matchesSearch && matchesType;
  });

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      setOpen(false);
    }
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderPreview = (item) => {
    if (item.mime_type?.startsWith('image/')) {
      return <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />;
    }
    
    if (item.mime_type?.startsWith('video/')) {
      const youtubeId = getYouTubeId(item.url);
      if (youtubeId) {
        return (
          <div className="relative w-full h-full">
            <img 
              src={`https://img.youtube.com/vi/${youtubeId}/0.jpg`} 
              alt={item.filename} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <PlayCircle className="w-8 h-8 text-white opacity-80" />
            </div>
          </div>
        );
      }
      
      // For MP4/WebM
      return (
        <div className="relative w-full h-full bg-black">
          <video 
            src={`${item.url}#t=0.1`} 
            className="w-full h-full object-cover" 
            muted 
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="w-8 h-8 text-white/50" />
          </div>
        </div>
      );
    }

    return <File className="h-10 w-10 text-gray-400" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Select Media</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Manager</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center py-4 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
              accept="image/*,video/*,.pdf,.doc,.docx"
            />
            <Button 
              variant="outline" 
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload New
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className={`relative group border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all ${selectedFile?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedFile(item)}
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {renderPreview(item)}
                  </div>
                  <div className="p-2 text-xs truncate bg-white">
                    {item.filename}
                  </div>
                  {selectedFile?.id === item.id && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 z-10">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSelect} disabled={!selectedFile}>Add Selected</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelector;
