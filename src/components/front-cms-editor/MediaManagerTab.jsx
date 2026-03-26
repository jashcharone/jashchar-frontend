import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Trash2, Copy, ExternalLink, Upload, Image as ImageIcon, File, Video, FileText, FileArchive, Music, Search, X, Play } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent } from '@/components/ui/card';

const MediaManagerTab = ({ branchId }) => {
  const { toast } = useToast();
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [previewItem, setPreviewItem] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (branchId) loadMedia();
  }, [branchId]);

  useEffect(() => {
    filterMedia();
  }, [media, searchQuery, filterType]);

  const loadMedia = async () => {
    if (!branchId) {
      console.warn('[MediaManagerTab] No branchId provided');
      return;
    }
    setLoading(true);
    try {
      // Use backend API instead of direct Supabase - Master Admin needs proper RLS
      const response = await frontCmsService.getMedia(branchId);
      if (response.success) {
        setMedia(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load media');
      }
    } catch (error) {
      console.error('[MediaManagerTab] Error loading media:', error);
      toast({ variant: 'destructive', title: 'Error loading media' });
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let filtered = [...media];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.filename?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by file type
    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(item => {
        const mimeType = item.mime_type?.toLowerCase() || '';
        const filename = item.filename?.toLowerCase() || '';
        
        switch(filterType) {
          case 'image':
            return mimeType.startsWith('image/');
          case 'video':
            return mimeType.startsWith('video/') || mimeType === 'video/youtube';
          case 'audio':
            return mimeType.startsWith('audio/');
          case 'text':
            return mimeType.startsWith('text/') || mimeType.includes('plain');
          case 'zip':
            return mimeType.includes('zip') || filename.endsWith('.zip');
          case 'rar':
            return mimeType.includes('rar') || filename.endsWith('.rar');
          case 'pdf':
            return mimeType.includes('pdf') || filename.endsWith('.pdf');
          case 'word':
            return mimeType.includes('word') || mimeType.includes('msword') || 
                   mimeType.includes('wordprocessingml') || 
                   filename.endsWith('.doc') || filename.endsWith('.docx');
          case 'excel':
            return mimeType.includes('excel') || mimeType.includes('spreadsheet') || 
                   mimeType.includes('ms-excel') || 
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

      // Use backend API instead of direct Supabase insert
      const payload = {
        file_name: file.name,
        file_type: file.type,
        size_bytes: file.size,
        url: publicUrl,
        storage_path: fileName
      };
      
      const response = await frontCmsService.createMedia(payload, branchId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to save media record');
      }

      toast({ title: 'Success', description: 'File uploaded successfully' });
      loadMedia();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    await uploadFile(file);
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
      // Extract video ID from YouTube URL
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

      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;

      // Use backend API instead of direct Supabase insert
      const payload = {
        file_name: `YouTube Video - ${videoId}`,
        file_type: 'video/youtube',
        size_bytes: 0,
        url: embedUrl,
        storage_path: null
      };
      
      const response = await frontCmsService.createMedia(payload, branchId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add YouTube video');
      }

      toast({ title: 'Success', description: 'YouTube video added successfully' });
      setYoutubeUrl('');
      loadMedia();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to add YouTube video', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      // Use backend API instead of direct Supabase delete
      const response = await frontCmsService.deleteMedia(id, branchId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete file');
      }
      toast({ title: 'Success', description: 'File deleted successfully' });
      loadMedia();
    } catch (error) {
      console.error('[MediaManagerTab] Delete error:', error);
      toast({ variant: 'destructive', title: 'Error deleting file' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <File className="h-10 w-10 text-slate-400" />;
    
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-10 w-10 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-10 w-10 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-10 w-10 text-green-500" />;
    if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) 
      return <FileText className="h-10 w-10 text-orange-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed'))
      return <FileArchive className="h-10 w-10 text-yellow-500" />;
    
    return <File className="h-10 w-10 text-slate-400" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold dark:text-white">Media Manager</h2>

      {/* Upload Section */}
      <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload" className="text-base font-semibold mb-3 block dark:text-white">
                Upload Your File
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">Choose a file or drag it here</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Select File'}
                </Button>
              </div>
            </div>

            {/* YouTube URL */}
            <div>
              <Label htmlFor="youtube-url" className="text-base font-semibold mb-3 block dark:text-white">
                Upload Youtube Video <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                <Input
                  id="youtube-url"
                  placeholder="URL"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={uploading}
                  className="bg-white dark:bg-slate-800"
                />
                <Button
                  onClick={handleYoutubeSubmit}
                  disabled={uploading || !youtubeUrl.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="search" className="mb-2 block dark:text-white">Search By File Name</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Enter Keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="filter-type" className="mb-2 block dark:text-white">Filter By File Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
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

      {/* Media Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map(item => (
            <div key={item.id} className="group relative border rounded-lg overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700 shadow hover:shadow-lg transition-all">
              <div className="aspect-square bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden relative group">
                {item.mime_type?.startsWith('image/') ? (
                  <img 
                    src={item.url} 
                    alt={item.filename} 
                    className="w-full h-full object-cover" 
                  />
                ) : item.mime_type === 'video/youtube' ? (
                  <div className="relative w-full h-full bg-black">
                    <iframe 
                      src={item.url}
                      title={item.filename}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="no-referrer-when-downgrade"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : item.mime_type?.startsWith('video/') ? (
                  <div className="relative w-full h-full bg-black">
                    <video 
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  </div>
                ) : (
                  <div className="p-4">
                    {getFileIcon(item.mime_type)}
                  </div>
                )}
                
                {/* Hover Overlay with Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  {(item.mime_type?.startsWith('image/') || item.mime_type?.startsWith('video/')) && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="bg-white/90 hover:bg-white"
                      onClick={() => setPreviewItem(item)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {item.mime_type?.startsWith('video/') ? 'Play' : 'View'}
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="bg-white/90 hover:bg-white"
                      onClick={() => copyToClipboard(item.url)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </a>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs font-medium truncate" title={item.filename}>{item.filename}</p>
                <p className="text-xs text-gray-500">{formatFileSize(item.size_bytes)}</p>
              </div>
            </div>
          ))}
          {filteredMedia.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
              {searchQuery || filterType !== 'all' 
                ? 'No matching files found.' 
                : 'No media files uploaded yet. Upload your first file above!'}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div className="relative max-w-6xl w-full bg-white rounded-lg overflow-hidden flex" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            {/* Left Side - Preview */}
            <div className="flex-1 bg-gray-900 flex items-center justify-center p-8 relative" style={{ minWidth: '60%' }}>
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
                onClick={() => setPreviewItem(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              
              {previewItem.mime_type?.startsWith('image/') ? (
                <img 
                  src={previewItem.url} 
                  alt={previewItem.filename} 
                  className="max-w-full max-h-full object-contain"
                />
              ) : previewItem.mime_type === 'video/youtube' ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe 
                    src={previewItem.url}
                    title={previewItem.filename}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : previewItem.mime_type?.startsWith('video/') ? (
                <video 
                  src={previewItem.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center text-white">
                  <div className="scale-150 mb-4">
                    {getFileIcon(previewItem.mime_type)}
                  </div>
                  <p className="text-gray-300">Preview not available</p>
                </div>
              )}
            </div>

            {/* Right Side - Details */}
            <div className="w-96 bg-white p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">Media Details</h3>
              
              <div className="space-y-5 flex-1">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Media Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border break-all">{previewItem.filename}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Media Type</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border">
                    {previewItem.mime_type === 'video/youtube' ? 'YouTube Video' : previewItem.mime_type}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Media Path</label>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <a 
                      href={previewItem.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 break-all underline"
                    >
                      {previewItem.url}
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Media Size</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border">
                    {previewItem.mime_type === 'video/youtube' ? 'N/A' : formatFileSize(previewItem.size_bytes)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => copyToClipboard(previewItem.url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <a href={previewItem.url} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="default" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManagerTab;
