import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Trash2, Copy, ExternalLink, Upload, Image as ImageIcon, File, Video, FileText, FileArchive, Music, Search, X, Play, Check } from 'lucide-react';

const MediaPickerModal = ({ isOpen, onClose, onSelect, branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && branchId) {
      loadMedia();
    }
  }, [isOpen, branchId]);

  useEffect(() => {
    filterMedia();
  }, [media, searchQuery, filterType]);

  const loadMedia = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('front_cms_media')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load media' });
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let filtered = [...media];
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.filename?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(item => {
        const mimeType = item.mime_type || '';
        const filename = item.filename || '';
        
        switch(filterType) {
          case 'image':
            return mimeType.startsWith('image/');
          case 'video':
            return mimeType.startsWith('video/') || mimeType === 'video/youtube';
          case 'audio':
            return mimeType.startsWith('audio/');
          case 'text':
            return mimeType.includes('text') || filename.endsWith('.txt');
          case 'zip':
            return mimeType.includes('zip') || filename.endsWith('.zip');
          case 'rar':
            return mimeType.includes('rar') || filename.endsWith('.rar');
          case 'pdf':
            return mimeType.includes('pdf') || filename.endsWith('.pdf');
          case 'word':
            return mimeType.includes('word') || mimeType.includes('document') || 
                   filename.endsWith('.doc') || filename.endsWith('.docx');
          case 'excel':
            return mimeType.includes('excel') || mimeType.includes('spreadsheet') || 
                   filename.endsWith('.xls') || filename.endsWith('.xlsx');
          case 'powerpoint':
            return mimeType.includes('powerpoint') || mimeType.includes('presentation') || 
                   filename.endsWith('.ppt') || filename.endsWith('.pptx');
          case 'other':
            return !mimeType.startsWith('image/') && 
                   !mimeType.startsWith('video/') && 
                   !mimeType.startsWith('audio/') && 
                   !mimeType.includes('pdf') && 
                   !mimeType.includes('word') && 
                   !mimeType.includes('excel') && 
                   !mimeType.includes('zip') && 
                   !mimeType.includes('rar');
          default:
            return true;
        }
      });
    }
    
    setFilteredMedia(filtered);
  };

  const uploadFile = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${branchId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('cms-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cms-media')
        .getPublicUrl(fileName);

      await supabase.from('front_cms_media').insert({
        branch_id: branchId,
        filename: file.name,
        url: publicUrl,
        mime_type: file.type,
        size_bytes: file.size
      });

      toast({ title: 'Success', description: 'File uploaded successfully' });
      loadMedia();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to upload file', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      toast({ variant: 'destructive', title: 'Please enter a YouTube URL' });
      return;
    }

    setUploading(true);
    try {
      let videoId = '';
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = youtubeUrl.match(pattern);
        if (match) {
          videoId = match[1];
          break;
        }
      }

      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;

      await supabase.from('front_cms_media').insert({
        branch_id: branchId,
        filename: `YouTube Video - ${videoId}`,
        url: embedUrl,
        mime_type: 'video/youtube',
        size_bytes: 0
      });

      toast({ title: 'Success', description: 'YouTube video added successfully' });
      setYoutubeUrl('');
      loadMedia();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to add YouTube video', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <File className="h-12 w-12 text-gray-400" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-12 w-12 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-12 w-12 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-12 w-12 text-green-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-12 w-12 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className="h-12 w-12 text-orange-500" />;
    return <File className="h-12 w-12 text-gray-400" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
      setSelectedItem(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-7xl w-full bg-white rounded-lg overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Media Manager</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2">Search By File Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter Keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2">Filter By File Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="zip">Zip</SelectItem>
                  <SelectItem value="rar">Rar</SelectItem>
                  <SelectItem value="pdf">Pdf</SelectItem>
                  <SelectItem value="word">Word</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="powerpoint">PowerPoint</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredMedia.map(item => (
                <div 
                  key={item.id} 
                  className={`group relative border rounded-lg overflow-hidden bg-white shadow hover:shadow-lg transition-all cursor-pointer ${
                    selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {item.mime_type?.startsWith('image/') ? (
                      <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                    ) : item.mime_type === 'video/youtube' ? (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                    ) : item.mime_type?.startsWith('video/') ? (
                      <div className="relative w-full h-full bg-black">
                        <video src={item.url} className="w-full h-full object-cover" muted />
                      </div>
                    ) : (
                      <div className="p-2 flex items-center justify-center">
                        {getFileIcon(item.mime_type)}
                      </div>
                    )}
                  </div>
                  {selectedItem?.id === item.id && (
                    <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="p-1 bg-white">
                    <p className="text-xs font-medium truncate" title={item.filename}>{item.filename}</p>
                  </div>
                </div>
              ))}
              {filteredMedia.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                  {searchQuery || filterType !== 'all' 
                    ? 'No matching files found.' 
                    : 'No media files uploaded yet.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="px-6">Cancel</Button>
          <Button onClick={handleSelect} disabled={!selectedItem} className="px-6 bg-blue-600 hover:bg-blue-700">
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MediaPickerModal;
