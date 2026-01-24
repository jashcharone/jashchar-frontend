import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2, Upload, Image as ImageIcon, Plus, Edit, Video, PlayCircle } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import MediaSelector from '@/components/front-cms/MediaSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';

import { useNavigate, useSearchParams } from 'react-router-dom';

const BannerImages = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branch_id');
  
  // Data States
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit State
  const [editingBanner, setEditingBanner] = useState(null); // null = closed, 'new' = creating, object = editing
  const [editForm, setEditForm] = useState({ 
    title: '', 
    subtitle: '', 
    link_url: '',
    banner_type: 'image',
    video_url: '',
    button_text: '',
    device_visibility: 'all',
    image_url: ''
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getBanners(branchId);
      if (response.success) {
        setBanners(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading banners' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const response = await frontCmsService.deleteBanner(id, branchId);
      if (response.success) {
        toast({ title: 'Banner deleted successfully' });
        loadBanners();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to delete banner' });
    }
  };

  const openCreate = () => {
    setEditingBanner('new');
    setEditForm({
      title: '', 
      subtitle: '', 
      link_url: '',
      banner_type: 'image',
      video_url: '',
      button_text: '',
      device_visibility: 'all',
      image_url: ''
    });
  };

  const openEdit = (banner) => {
    setEditingBanner(banner);
    setEditForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      link_url: banner.link_url || '',
      banner_type: banner.banner_type || 'image',
      video_url: banner.video_url || '',
      button_text: banner.button_text || '',
      device_visibility: banner.device_visibility || 'all',
      image_url: banner.image_url || ''
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validation
      if (editForm.banner_type === 'video' && !editForm.video_url) {
        toast({ variant: 'destructive', title: 'Video URL is required for video banners' });
        setSaving(false);
        return;
      }
      if (editForm.banner_type !== 'video' && !editForm.image_url) {
        toast({ variant: 'destructive', title: 'Image is required' });
        setSaving(false);
        return;
      }

      let response;
      if (editingBanner === 'new') {
        response = await frontCmsService.createBanner(editForm, branchId);
      } else {
        response = await frontCmsService.updateBanner(editingBanner.id, editForm, branchId);
      }

      if (response.success) {
        toast({ title: `Banner ${editingBanner === 'new' ? 'created' : 'updated'} successfully` });
        setEditingBanner(null);
        loadBanners();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to save banner' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <MasterAdminSchoolHeader />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Banner Images</h1>
          <PermissionButton 
            moduleSlug="front_cms.banner_images" 
            action="add"
            className="bg-green-600 hover:bg-green-700"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Banner
          </PermissionButton>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <Card key={banner.id} className="overflow-hidden group">
                <div className="relative aspect-video bg-gray-100">
                  {banner.banner_type === 'video' ? (
                    <video src={banner.video_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img 
                      src={banner.image_url} 
                      alt={banner.title || 'Banner'} 
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {banner.banner_type === 'popup' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayCircle className="w-12 h-12 text-white opacity-80" />
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PermissionButton 
                      moduleSlug="front_cms.banner_images" 
                      action="edit"
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8 shadow-md" 
                      onClick={() => openEdit(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </PermissionButton>
                    <PermissionButton 
                      moduleSlug="front_cms.banner_images" 
                      action="delete"
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 shadow-md" 
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </PermissionButton>
                  </div>
                  
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-black/50 text-white text-xs rounded capitalize">
                      {banner.banner_type || 'image'}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold truncate">{banner.title || 'No Title'}</h3>
                  <p className="text-sm text-gray-500 truncate">{banner.subtitle}</p>
                </CardContent>
              </Card>
            ))}
            
            {banners.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                No banners found. Click "Add Banner" to get started.
              </div>
            )}
          </div>
        )}

        <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner === 'new' ? 'Create Banner' : 'Edit Banner'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Banner Type</Label>
                  <Select 
                    value={editForm.banner_type} 
                    onValueChange={(val) => setEditForm({...editForm, banner_type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image Banner</SelectItem>
                      <SelectItem value="video">Video Banner</SelectItem>
                      <SelectItem value="popup">Image + Video Popup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Device Visibility</Label>
                  <Select 
                    value={editForm.device_visibility} 
                    onValueChange={(val) => setEditForm({...editForm, device_visibility: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Devices</SelectItem>
                      <SelectItem value="desktop">Desktop Only</SelectItem>
                      <SelectItem value="mobile">Mobile Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={editForm.title} 
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                  placeholder="Enter banner title"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input 
                  value={editForm.subtitle} 
                  onChange={(e) => setEditForm({...editForm, subtitle: e.target.value})} 
                  placeholder="Enter banner subtitle"
                />
              </div>

              {/* Image Selection (Required for Image & Popup types) */}
              {editForm.banner_type !== 'video' && (
                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <div className="flex gap-2 items-center">
                    {editForm.image_url && (
                      <img src={editForm.image_url} alt="Preview" className="h-12 w-20 object-cover rounded border" />
                    )}
                    <MediaSelector 
                      branchId={branchId}
                      onSelect={(file) => setEditForm({...editForm, image_url: file.url})} 
                      type="image"
                      trigger={
                        <Button variant="outline" type="button">
                          <ImageIcon className="mr-2 h-4 w-4" /> Select Image
                        </Button>
                      }
                    />
                  </div>
                </div>
              )}

              {/* Video Selection (Required for Video & Popup types) */}
              {(editForm.banner_type === 'video' || editForm.banner_type === 'popup') && (
                <div className="space-y-2">
                  <Label>Video Source (MP4)</Label>
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={editForm.video_url} 
                      onChange={(e) => setEditForm({...editForm, video_url: e.target.value})} 
                      placeholder="https://... (MP4 URL)"
                    />
                    <MediaSelector 
                      branchId={branchId}
                      onSelect={(file) => setEditForm({...editForm, video_url: file.url})} 
                      type="video"
                      trigger={
                        <Button variant="outline" type="button">
                          <Video className="mr-2 h-4 w-4" /> Select Video
                        </Button>
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-500">Max size: 8MB. Format: MP4 (H.264).</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input 
                    value={editForm.button_text} 
                    onChange={(e) => setEditForm({...editForm, button_text: e.target.value})} 
                    placeholder="e.g. Learn More"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button URL</Label>
                  <Input 
                    value={editForm.link_url} 
                    onChange={(e) => setEditForm({...editForm, link_url: e.target.value})} 
                    placeholder="https://..."
                  />
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBanner(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Banner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default BannerImages;
