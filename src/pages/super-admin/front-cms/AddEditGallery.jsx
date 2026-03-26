import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Upload, X, Trash2, Plus } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import RichTextEditor from '@/components/front-cms/RichTextEditor';
import MediaSelector from '@/components/front-cms/MediaSelector';
import DashboardLayout from '@/components/DashboardLayout';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';

const AddEditGallery = () => {
  const { galleryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMasterAdmin = location.pathname.startsWith('/master-admin');
  const basePath = isMasterAdmin ? '/master-admin/front-cms' : '/super-admin/front-cms';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    cover_image_url: '',
    meta_title: '',
    meta_keyword: '',
    meta_description: '',
    is_published: true,
    sidebar_setting: false
  });

  useEffect(() => {
    if (galleryId) {
      loadGallery();
      loadGalleryImages();
    }
  }, [galleryId]);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getGallery(galleryId);
      if (response.success) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading gallery' });
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryImages = async () => {
    try {
      const response = await frontCmsService.getGalleryImages(galleryId);
      if (response.success) {
        setGalleryImages(response.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    if (!galleryId || !formData.slug) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, title, slug }));
    } else {
      setFormData(prev => ({ ...prev, title }));
    }
  };

  const handleCoverImageSelect = (file) => {
    setFormData(prev => ({ ...prev, cover_image_url: file.url }));
  };

  const handleGalleryImageSelect = async (file) => {
    try {
      const response = await frontCmsService.addGalleryImage({
        gallery_id: galleryId,
        image_url: file.url
      });
      
      if (response.success) {
        toast({ title: 'Image added to gallery' });
        loadGalleryImages();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to add image' });
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Delete this image?')) return;
    try {
      const response = await frontCmsService.deleteGalleryImage(imageId);
      if (response.success) {
        setGalleryImages(prev => prev.filter(img => img.id !== imageId));
        toast({ title: 'Image deleted' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const editorRef = useRef(null);
  const handleEditorImageInsert = (file) => {
    if (editorRef.current) {
        editorRef.current.insertImage(file.url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let response;
      if (galleryId) {
        response = await frontCmsService.updateGallery(galleryId, formData);
      } else {
        response = await frontCmsService.createGallery(formData);
      }

      if (response.success) {
        toast({ title: `Gallery ${galleryId ? 'updated' : 'created'} successfully` });
        if (!galleryId) {
          // Redirect to edit page to add images
          navigate(`${basePath}/gallery/edit/${response.data.id}`);
        } else {
          navigate(`${basePath}/gallery`);
        }
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <MasterAdminSchoolHeader />
        <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/gallery`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{galleryId ? 'Edit Gallery' : 'Add New Gallery'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Description</Label>
                    <div className="flex gap-2">
                        <MediaSelector 
                        onSelect={handleEditorImageInsert}
                        type="image"
                        trigger={
                            <Button type="button" size="sm" className="bg-slate-700 hover:bg-slate-800 text-white">
                                <Plus className="h-4 w-4 mr-2" /> Add Media
                            </Button>
                        }
                        />
                    </div>
                  </div>
                  <div className="mb-12">
                    <RichTextEditor
                      ref={editorRef}
                      value={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      placeholder="Gallery description..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gallery Images</CardTitle>
                <div className="flex items-center gap-2">
                  {galleryId && (
                    <MediaSelector
                      onSelect={handleGalleryImageSelect}
                      type="image"
                      trigger={
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Images
                        </Button>
                      }
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!galleryId ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                    Please save the gallery first to add images.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {galleryImages.map((img) => (
                      <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img src={img.image_url} alt="Gallery Item" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteImage(img.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {galleryImages.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No images added yet
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_keyword">Meta Keywords</Label>
                  <Input
                    id="meta_keyword"
                    value={formData.meta_keyword}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_keyword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Input
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border p-3 rounded">
                  <Label htmlFor="is_published">Published</Label>
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between border p-3 rounded">
                  <Label htmlFor="sidebar_setting">Sidebar Setting</Label>
                  <Switch
                    id="sidebar_setting"
                    checked={formData.sidebar_setting}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sidebar_setting: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  {formData.cover_image_url ? (
                    <div className="relative border rounded-lg overflow-hidden aspect-video bg-gray-100">
                      <img 
                        src={formData.cover_image_url} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <MediaSelector 
                      onSelect={handleCoverImageSelect}
                      type="image"
                      trigger={
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <span className="text-primary hover:underline">Select Image</span>
                        </div>
                      }
                    />
                  )}
                </div>

                <div className="pt-4">
                  <PermissionButton 
                    moduleSlug="front_cms.gallery" 
                    action={galleryId ? 'edit' : 'add'}
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white" 
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save
                  </PermissionButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
      </div>
    </DashboardLayout>
  );
};

export default AddEditGallery;
