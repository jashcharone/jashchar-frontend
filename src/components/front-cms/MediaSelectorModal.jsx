import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Search, Upload, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MediaSelectorModal = ({ isOpen, onClose, onSelect, allowMultiple = false, branchId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const targetSchoolId = branchId || user?.profile?.branch_id;

  // If we are master admin, we might want to see SaaS Assets from 'front-cms' bucket (File Manager)
  // instead of schools-specific 'cms-media' bucket.
  const isMasterAdmin = user?.user_metadata?.role === 'master_admin';

  console.log('[MediaSelectorModal] Debug:', { isOpen, branchId, targetSchoolId, isMasterAdmin, userRole: user?.user_metadata?.role });

  useEffect(() => {
    if (isOpen) {
      fetchAllMedia();
    }
  }, [isOpen, targetSchoolId, isMasterAdmin]);

  const fetchAllMedia = async () => {
    setLoading(true);
    let allMedia = [];

    try {
      // 1. Try fetching from cms_media table (database records)
      if (targetSchoolId) {
        const { data: dbMedia, error: dbError } = await supabase
          .from('cms_media')
          .select('*')
          .eq('branch_id', targetSchoolId)
          .order('created_at', { ascending: false });
        
        if (!dbError && dbMedia?.length > 0) {
          console.log('[MediaSelectorModal] Found media in cms_media table:', dbMedia.length);
          allMedia = [...allMedia, ...dbMedia];
        }
      }

      // 2. Also try fetching from storage bucket directly
      if (targetSchoolId) {
        try {
          const { data: storageFiles, error: storageError } = await supabase.storage
            .from('cms-media')
            .list(targetSchoolId, {
              limit: 100,
              sortBy: { column: 'created_at', order: 'desc' },
            });

          if (!storageError && storageFiles?.length > 0) {
            const mappedFiles = storageFiles
              .filter(f => f.name !== '.emptyFolderPlaceholder' && !f.name.endsWith('/'))
              .map(f => ({
                id: f.id || `storage-${f.name}`,
                file_name: f.name,
                file_type: f.metadata?.mimetype || (f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file'),
                file_url: supabase.storage.from('cms-media').getPublicUrl(`${targetSchoolId}/${f.name}`).data.publicUrl
              }));
            
            // Add only files not already in allMedia (by URL)
            const existingUrls = new Set(allMedia.map(m => m.file_url));
            const newFiles = mappedFiles.filter(f => !existingUrls.has(f.file_url));
            
            if (newFiles.length > 0) {
              console.log('[MediaSelectorModal] Found additional files in storage:', newFiles.length);
              allMedia = [...allMedia, ...newFiles];
            }
          }
        } catch (storageErr) {
          console.log('[MediaSelectorModal] Storage fetch error (non-critical):', storageErr);
        }
      }

      // 3. For Master Admin, also fetch SaaS assets
      if (isMasterAdmin) {
        try {
          const { data: saasFiles, error: saasError } = await supabase.storage
            .from('front-cms')
            .list('saas-assets/', {
              limit: 100,
              sortBy: { column: 'created_at', order: 'desc' },
            });

          if (!saasError && saasFiles?.length > 0) {
            const mappedSaas = saasFiles
              .filter(f => f.name !== '.emptyFolderPlaceholder')
              .map(f => ({
                id: f.id || `saas-${f.name}`,
                file_name: f.name,
                file_type: f.metadata?.mimetype || 'image',
                file_url: supabase.storage.from('front-cms').getPublicUrl(`saas-assets/${f.name}`).data.publicUrl,
                source: 'saas'
              }));
            
            console.log('[MediaSelectorModal] Found SaaS assets:', mappedSaas.length);
            allMedia = [...allMedia, ...mappedSaas];
          }
        } catch (saasErr) {
          console.log('[MediaSelectorModal] SaaS assets fetch error:', saasErr);
        }
      }

      console.log('[MediaSelectorModal] Total media found:', allMedia.length);
      setMedia(allMedia);
    } catch (error) {
      console.error('[MediaSelectorModal] Error fetching media:', error);
      toast({ variant: 'destructive', title: 'Error fetching media' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!targetSchoolId && !isMasterAdmin) {
      toast({ variant: 'destructive', title: 'Error', description: 'No school selected for upload' });
      return;
    }

    setUploading(true);
    try {
      // Normal School Upload logic
      const fileExt = file.name.split('.').pop();
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${targetSchoolId}/${uniqueName}`;
      
      const { error: uploadError } = await supabase.storage
          .from('cms-media')
          .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
          .from('cms-media')
          .getPublicUrl(filePath);

      // Also save to cms_media table
      await supabase.from('cms_media').insert({
          branch_id: targetSchoolId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type.split('/')[0]
      });

      toast({ title: 'Success', description: 'File uploaded successfully!' });
      fetchAllMedia();
    } catch (error) {
      console.error('[MediaSelectorModal] Upload error:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (item) => {
    onSelect(item);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Select Media</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-between items-center py-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search files..." className="pl-8 dark:bg-slate-700 dark:border-slate-600" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="relative">
            <input type="file" accept="image/*" className="hidden" id="modal-upload" onChange={handleFileUpload} disabled={uploading} />
            <label htmlFor="modal-upload">
              <Button variant="outline" className="cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600" asChild disabled={uploading}>
                <span>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload New
                </span>
              </Button>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-md p-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
          {loading ? (
            <div className="flex flex-col justify-center items-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading media...</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {media.filter(m => {
                const name = m.file_name || m.name || '';
                return name.toLowerCase().includes((search || '').toLowerCase());
              }).map(item => {
                const name = item.file_name || item.name || 'Untitled';
                const url = item.file_url || item.url || '';
                const type = item.file_type || item.type || '';
                
                return (
                  <div 
                    key={item.id} 
                    className="group relative border rounded-lg overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-600 shadow-sm hover:ring-2 hover:ring-primary cursor-pointer transition-all"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="aspect-square bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                      {type.startsWith('image') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                        <img src={url} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-500" />
                      )}
                    </div>
                    <div className="p-2 text-xs truncate font-medium dark:text-slate-200">{name}</div>
                    {item.source === 'saas' && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-[9px] px-1 rounded">SaaS</div>
                    )}
                  </div>
                );
              })}
              {media.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">No media found</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Upload your first image to get started</p>
                  <label htmlFor="modal-upload">
                    <Button variant="default" className="cursor-pointer" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelectorModal;
