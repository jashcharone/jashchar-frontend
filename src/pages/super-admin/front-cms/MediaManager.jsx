import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  Loader2, Trash2, Copy, ExternalLink, Upload, Image as ImageIcon, 
  File, Video, FileText, FileArchive, Music, Search, Play, 
  Grid3X3, List, FolderOpen, UploadCloud, Link2, RefreshCw, AlertTriangle, Phone
} from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import DashboardLayout from '@/components/DashboardLayout';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validateAnyFile, getAcceptString } from '@/utils/fileValidation';

// Storage limit: 200 MB
const STORAGE_LIMIT_BYTES = 200 * 1024 * 1024; // 200 MB in bytes
const STORAGE_LIMIT_MB = 200;

const MediaManager = () => {
  const { toast } = useToast();
  const { school, user } = useAuth();
  const [searchParams] = useSearchParams();
  const branchId =
    searchParams.get('branch_id') ||
    sessionStorage.getItem('ma_target_branch_id') ||
    school?.id ||
    user?.profile?.branch_id;
    
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [imageLoadErrors, setImageLoadErrors] = useState(0); // Track image loading failures
  const [viewMode, setViewMode] = useState('grid');
  const [acceptString, setAcceptString] = useState('image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx');
  const fileInputRef = useRef(null);

  // Stats
  const stats = {
    total: media.length,
    images: media.filter(m => (m.mime_type || m.file_type)?.startsWith('image/')).length,
    videos: media.filter(m => (m.mime_type || m.file_type)?.startsWith('video/')).length,
    documents: media.filter(m => (m.mime_type || m.file_type)?.startsWith('application/')).length,
    totalSize: media.reduce((acc, m) => acc + (m.size_bytes || 0), 0)
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (branchId && branchId !== 'null' && branchId !== 'undefined') {
      loadMedia();
    }
    // Load accept string from settings
    getAcceptString('all').then(str => setAcceptString(str));
  }, [branchId]);

  useEffect(() => {
    filterMedia();
  }, [media, searchQuery, filterType]);

  const loadMedia = async () => {
    if (!branchId || branchId === 'null' || branchId === 'undefined') {
      toast({ variant: 'destructive', title: 'Please select a school first' });
      return;
    }
    setLoading(true);
    setImageLoadErrors(0); // Reset error count on fresh load
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

  const filterMedia = () => {
    let result = [...media];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => (item.filename || item.file_name || '').toLowerCase().includes(query));
    }
    if (filterType !== 'all') {
      result = result.filter(item => {
        const mimeType = item.mime_type || item.file_type;
        return mimeType && mimeType.startsWith(filterType);
      });
    }
    setFilteredMedia(result);
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!branchId || branchId === 'null' || branchId === 'undefined') {
      toast({ variant: 'destructive', title: 'Please select a school first' });
      return;
    }

    // Validate file type and size using system settings
    const validation = await validateAnyFile(file);
    if (!validation.valid) {
      toast({ 
        variant: 'destructive', 
        title: 'Invalid File',
        description: validation.error,
        duration: 8000
      });
      return;
    }

    // Check storage limit before upload
    const newTotalSize = stats.totalSize + file.size;
    if (newTotalSize > STORAGE_LIMIT_BYTES) {
      toast({ 
        variant: 'destructive', 
        title: 'Storage Limit Exceeded!',
        description: `You have reached the ${STORAGE_LIMIT_MB} MB storage limit. Please contact Jashchar ERP Team: +91 9901220102`,
        duration: 10000
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `cms/${branchId}/${fileName}`;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      console.log(`[MediaManager] Uploading to: school-assets/${filePath}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(filePath, file);

      clearInterval(progressInterval);
      
      if (uploadError) {
        console.error('[MediaManager] Upload failed:', uploadError);
        throw uploadError;
      }
      
      // Verify file was actually uploaded
      const { data: verifyData, error: verifyError } = await supabase.storage
        .from('school-assets')
        .list(`cms/${branchId}`, { search: fileName });
      
      if (verifyError || !verifyData || verifyData.length === 0) {
        console.error('[MediaManager] File verification failed - file not found in storage');
        throw new Error('File upload verification failed. Please try again.');
      }
      
      console.log('[MediaManager] Upload verified successfully');
      setUploadProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from('school-assets')
        .getPublicUrl(filePath);

      const payload = {
        file_name: file.name,
        file_type: file.type,
        size_bytes: file.size,
        url: publicUrl,
        storage_path: filePath
      };

      const response = await frontCmsService.createMedia(payload, branchId);
      if (response.success) {
        toast({ title: 'Upload successful!', description: `${file.name} has been uploaded.` });
        loadMedia();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleYoutubeAdd = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    if (!branchId || branchId === 'null' || branchId === 'undefined') {
      toast({ variant: 'destructive', title: 'Please select a school first' });
      return;
    }

    try {
      const payload = {
        file_name: 'YouTube Video',
        file_type: 'video/youtube',
        size_bytes: 0,
        url: youtubeUrl,
        storage_path: null
      };

      const response = await frontCmsService.createMedia(payload, branchId);
      if (response.success) {
        toast({ title: 'Video added successfully' });
        setYoutubeUrl('');
        loadMedia();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to add video' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await frontCmsService.deleteMedia(id, branchId);
      if (response.success) {
        toast({ title: 'Item deleted successfully' });
        loadMedia();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'URL copied to clipboard!' });
  };

  const getFileIcon = (type, size = 'md') => {
    const sizeClass = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
    if (!type) return <File className={`${sizeClass} text-muted-foreground`} />;
    if (type.startsWith('image/')) return <ImageIcon className={`${sizeClass} text-blue-500`} />;
    if (type.startsWith('video/')) return <Video className={`${sizeClass} text-red-500`} />;
    if (type.startsWith('audio/')) return <Music className={`${sizeClass} text-purple-500`} />;
    if (type.includes('pdf')) return <FileText className={`${sizeClass} text-orange-500`} />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className={`${sizeClass} text-yellow-500`} />;
    return <File className={`${sizeClass} text-muted-foreground`} />;
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2]) ? match[2] : null;
  };

  const getFileTypeBadge = (type) => {
    if (!type) return <Badge variant="secondary">Unknown</Badge>;
    if (type.startsWith('image/')) return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Image</Badge>;
    if (type === 'video/youtube') return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">YouTube</Badge>;
    if (type.startsWith('video/')) return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Video</Badge>;
    if (type.startsWith('audio/')) return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">Audio</Badge>;
    if (type.includes('pdf')) return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">PDF</Badge>;
    return <Badge variant="secondary">Document</Badge>;
  };

  // Show message if no school is selected
  if (!branchId || branchId === 'null' || branchId === 'undefined') {
    return (
      <DashboardLayout>
        <div className="p-6">
          <MasterAdminSchoolHeader />
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
              <FolderOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No School Selected</h3>
            <p className="text-muted-foreground max-w-md text-center">
              Please select a school from the Front CMS main page to manage media files.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <MasterAdminSchoolHeader />
        
        {/* Image Load Error Alert */}
        {imageLoadErrors > 0 && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Images Not Loading ({imageLoadErrors} failed)</AlertTitle>
            <AlertDescription>
              Storage bucket may not be configured as public. Go to <strong>Supabase Dashboard → Storage → school-assets → Edit bucket → Enable "Public bucket"</strong>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Media Library</h1>
            <p className="text-muted-foreground mt-1">Manage your images, videos, and documents</p>
          </div>
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files[0])}
            accept={acceptString}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-blue-500/5 border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.images}</p>
                  <p className="text-xs text-muted-foreground">Images</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-red-500/5 border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Video className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.videos}</p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-orange-500/5 border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <FileText className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.documents}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(
            "bg-gradient-to-br from-card border-border/50 hover:shadow-md transition-shadow",
            stats.totalSize >= STORAGE_LIMIT_BYTES ? "to-red-500/10 border-red-500/50" : "to-green-500/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  stats.totalSize >= STORAGE_LIMIT_BYTES ? "bg-red-500/10" : "bg-green-500/10"
                )}>
                  <UploadCloud className={cn(
                    "h-5 w-5",
                    stats.totalSize >= STORAGE_LIMIT_BYTES ? "text-red-500" : "text-green-500"
                  )} />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-foreground">{formatFileSize(stats.totalSize)}</p>
                  <p className="text-xs text-muted-foreground">of {STORAGE_LIMIT_MB} MB Used</p>
                  <Progress 
                    value={Math.min((stats.totalSize / STORAGE_LIMIT_BYTES) * 100, 100)} 
                    className={cn(
                      "h-1.5 mt-2",
                      stats.totalSize >= STORAGE_LIMIT_BYTES * 0.9 ? "[&>div]:bg-red-500" : 
                      stats.totalSize >= STORAGE_LIMIT_BYTES * 0.7 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Storage Limit Warning */}
        {stats.totalSize >= STORAGE_LIMIT_BYTES && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-red-600 dark:text-red-400 font-semibold">Storage Limit Reached!</AlertTitle>
            <AlertDescription className="text-red-600/80 dark:text-red-400/80">
              <p>You have reached the {STORAGE_LIMIT_MB} MB storage limit. To increase your storage, please contact:</p>
              <div className="mt-2 flex items-center gap-2 font-semibold">
                <Phone className="h-4 w-4" />
                <span>Jashchar ERP Team: +91 9901220102</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Area */}
        <Card className="border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/20 to-muted/5 hover:border-primary/50 transition-all duration-300">
          <CardContent className="p-0">
            <div
              className={cn(
                "p-8 text-center transition-all duration-300 rounded-lg",
                dragActive && "bg-primary/10 border-primary"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <div className="max-w-xs mx-auto space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <UploadCloud className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">Drop files here or click to upload</p>
                    <p className="text-sm text-muted-foreground mt-1">Supports images, videos, PDFs, and documents</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-primary/30 hover:bg-primary/5"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Browse Files
                    </Button>
                    <span className="text-muted-foreground text-sm">or</span>
                    <form onSubmit={handleYoutubeAdd} className="flex items-center gap-2">
                      <Input
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="Paste YouTube URL"
                        className="w-48 h-9 bg-background/50"
                      />
                      <Button type="submit" variant="outline" size="sm" className="h-9">
                        <Link2 className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-muted/30 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Tabs value={filterType} onValueChange={setFilterType}>
              <TabsList className="bg-background/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
                <TabsTrigger value="image" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Images</TabsTrigger>
                <TabsTrigger value="video" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">Videos</TabsTrigger>
                <TabsTrigger value="application" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">Docs</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex items-center border rounded-lg bg-background/50">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-9 w-9 rounded-r-none", viewMode === 'grid' && "bg-primary/10 text-primary")}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-9 w-9 rounded-l-none", viewMode === 'list' && "bg-primary/10 text-primary")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={loadMedia} className="h-9 w-9">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Media Grid/List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground mt-4">Loading media...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border/50">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No media found</h3>
            <p className="text-muted-foreground mt-1">Upload your first file to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMedia.map((item) => (
              <div 
                key={item.id} 
                className="group relative rounded-xl overflow-hidden border border-border/50 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedMedia(item)}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-muted/50 flex items-center justify-center relative overflow-hidden">
                  {(item.mime_type || item.file_type)?.startsWith('image/') ? (
                    <img 
                      src={item.url} 
                      alt={item.filename || item.file_name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      loading="lazy"
                      onError={(e) => {
                        // Track error count for showing alert
                        setImageLoadErrors(prev => prev + 1);
                        // Show broken image icon when image fails to load
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="flex flex-col items-center justify-center w-full h-full bg-red-50 dark:bg-red-950/30 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><line x1="4" y1="4" x2="20" y2="20"/></svg><span class="text-xs mt-2">Image Load Failed</span><span class="text-[10px] mt-1 opacity-70">Check Storage Settings</span></div>';
                      }}
                    />
                  ) : (item.mime_type || item.file_type) === 'video/youtube' ? (
                    <div className="w-full h-full relative">
                      {getYoutubeId(item.url) ? (
                        <img 
                          src={`https://img.youtube.com/vi/${getYoutubeId(item.url)}/maxresdefault.jpg`}
                          alt={item.filename || item.file_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = `https://img.youtube.com/vi/${getYoutubeId(item.url)}/0.jpg`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Video className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-red-600 rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 text-white fill-current" />
                        </div>
                      </div>
                    </div>
                  ) : (item.mime_type || item.file_type)?.startsWith('video/') ? (
                    <div className="w-full h-full relative bg-gradient-to-br from-red-500/20 to-red-500/5">
                      <video 
                        src={item.url}
                        className="w-full h-full object-cover opacity-80"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-background/90 rounded-full p-3">
                          <Video className="h-5 w-5 text-red-500" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/50">
                      {getFileIcon(item.mime_type || item.file_type, 'lg')}
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-7 w-7 bg-background/90 hover:bg-background shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(item.url);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <PermissionButton 
                      moduleSlug="front_cms.media_manager" 
                      action="delete"
                      variant="secondary" 
                      size="icon" 
                      className="h-7 w-7 bg-background/90 hover:bg-red-500 hover:text-white shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </PermissionButton>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {getFileTypeBadge(item.mime_type || item.file_type)}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 bg-card">
                  <p className="text-sm font-medium text-foreground truncate">{item.filename || item.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(item.size_bytes || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredMedia.map((item) => (
              <div 
                key={item.id} 
                className="group flex items-center gap-4 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedMedia(item)}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                  {(item.mime_type || item.file_type)?.startsWith('image/') ? (
                    <img 
                      src={item.url} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full bg-red-50 dark:bg-red-950/30 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><line x1="4" y1="4" x2="20" y2="20"/></svg></div>';
                      }}
                    />
                  ) : (item.mime_type || item.file_type) === 'video/youtube' && getYoutubeId(item.url) ? (
                    <img src={`https://img.youtube.com/vi/${getYoutubeId(item.url)}/0.jpg`} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    getFileIcon(item.mime_type || item.file_type, 'md')
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.filename || item.file_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {getFileTypeBadge(item.mime_type || item.file_type)}
                    <span className="text-xs text-muted-foreground">{formatFileSize(item.size_bytes || 0)}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); copyToClipboard(item.url); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <PermissionButton 
                    moduleSlug="front_cms.media_manager" 
                    action="delete"
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </PermissionButton>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
          <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-background border-border">
            {selectedMedia && (
              <div className="flex flex-col md:flex-row h-[85vh] md:h-[600px]">
                {/* Preview */}
                <div className="flex-1 bg-muted/30 flex items-center justify-center p-6 relative">
                  {(selectedMedia.mime_type || selectedMedia.file_type)?.startsWith('image/') ? (
                    <img 
                      src={selectedMedia.url} 
                      alt={selectedMedia.filename || selectedMedia.file_name} 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                    />
                  ) : (selectedMedia.mime_type || selectedMedia.file_type) === 'video/youtube' && getYoutubeId(selectedMedia.url) ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYoutubeId(selectedMedia.url)}`}
                      title={selectedMedia.filename || selectedMedia.file_name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg shadow-2xl aspect-video max-h-full"
                    />
                  ) : (selectedMedia.mime_type || selectedMedia.file_type)?.startsWith('video/') ? (
                    <video controls className="max-w-full max-h-full rounded-lg shadow-2xl">
                      <source src={selectedMedia.url} type={selectedMedia.mime_type || selectedMedia.file_type} />
                    </video>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10">
                      {getFileIcon(selectedMedia.mime_type || selectedMedia.file_type, 'lg')}
                      <p className="mt-4 text-muted-foreground">Preview not available</p>
                    </div>
                  )}
                </div>

                {/* Details Sidebar */}
                <div className="w-full md:w-80 bg-card border-l border-border p-6 flex flex-col">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-bold break-words pr-8">{selectedMedia.filename || selectedMedia.file_name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-2">
                      {getFileTypeBadge(selectedMedia.mime_type || selectedMedia.file_type)}
                      <span>{formatFileSize(selectedMedia.size_bytes || 0)}</span>
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 flex-1">
                    <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium text-foreground">{selectedMedia.mime_type || selectedMedia.file_type || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Size</span>
                        <span className="font-medium text-foreground">{formatFileSize(selectedMedia.size_bytes || 0)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Public URL</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={selectedMedia.url} className="text-xs font-mono bg-muted/30" />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedMedia.url)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => window.open(selectedMedia.url, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" /> Open
                    </Button>
                    <PermissionButton 
                      moduleSlug="front_cms.media_manager" 
                      action="delete"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleDelete(selectedMedia.id);
                        setSelectedMedia(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </PermissionButton>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MediaManager;
