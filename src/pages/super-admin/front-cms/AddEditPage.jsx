import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Upload, X, Save, Plus, Code } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import RichTextEditor from '@/components/front-cms/RichTextEditor';
import MediaSelector from '@/components/front-cms/MediaSelector';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from '@/components/DashboardLayout';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';

const AddEditPage = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMasterAdmin = location.pathname.startsWith('/master-admin');
  const basePath = isMasterAdmin ? '/master-admin/front-cms' : '/super-admin/front-cms';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content_html: '',
    meta_title: '',
    meta_keyword: '',
    meta_description: '',
    feature_image: '',
    page_type: 'standard',
    sidebar_enabled: false,
    is_published: true
  });

  useEffect(() => {
    if (pageId) {
      loadPage();
    }
  }, [pageId]);

  const loadPage = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getPage(pageId);
      if (response.success) {
        // Map backend response to state if needed
        const data = response.data;
        setFormData({
            ...data,
            sidebar_enabled: data.sidebar_enabled || data.sidebar_setting || false, // Handle potential naming mismatch
            feature_image: data.feature_image || data.featured_image || '',
            is_published: data.is_published !== undefined ? data.is_published : true
        });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading page' });
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    // Auto-generate slug if creating new page or slug is empty
    if (!pageId && !formData.slug) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, title, slug }));
    } else {
      setFormData(prev => ({ ...prev, title }));
    }
  };

  const handleSlugChange = (e) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleImageSelect = (file) => {
    setFormData(prev => ({ ...prev, feature_image: file.url }));
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
      if (pageId) {
        response = await frontCmsService.updatePage(pageId, formData);
      } else {
        response = await frontCmsService.createPage(formData);
      }

      if (response.success) {
        toast({ title: `Page ${pageId ? 'updated' : 'created'} successfully` });
        navigate(`${basePath}/pages`);
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
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6">
      <MasterAdminSchoolHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pageId ? 'Edit Page' : 'Add Page'}</h1>
        <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/pages`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL Path)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    placeholder="auto-generated-slug"
                  />
                </div>

                <div className="space-y-2">
                    <Label>Page Type</Label>
                    <RadioGroup 
                        value={formData.page_type} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, page_type: val }))}
                        className="flex flex-wrap gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="standard" id="r1" />
                            <Label htmlFor="r1">Standard</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="events" id="r2" />
                            <Label htmlFor="r2">Events</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="news" id="r3" />
                            <Label htmlFor="r3">News</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="gallery" id="r4" />
                            <Label htmlFor="r4">Gallery</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="online_admission" id="r5" />
                            <Label htmlFor="r5">Online Admission</Label>
                        </div>
                    </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-red-500 font-medium">Description *</Label>
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
                        value={formData.content_html}
                        onChange={(value) => setFormData(prev => ({ ...prev, content_html: value }))}
                        placeholder="Write your page content here..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 border-b mb-4">
                <CardTitle className="text-lg font-medium text-orange-500">SEO Detail</CardTitle>
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
                  <Label htmlFor="meta_keyword">Meta Keyword</Label>
                  <Input
                    id="meta_keyword"
                    value={formData.meta_keyword}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_keyword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
                <CardHeader className="pb-2 border-b mb-4">
                    <CardTitle className="text-lg font-medium text-orange-500">Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="is_published">Published</Label>
                        <Switch 
                            id="is_published"
                            checked={formData.is_published}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="sidebar-mode">Sidebar</Label>
                        <Switch 
                            id="sidebar-mode"
                            checked={formData.sidebar_enabled}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sidebar_enabled: checked }))}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 border-b mb-4">
                <CardTitle className="text-lg font-medium text-orange-500">Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input 
                            value={formData.feature_image || ''} 
                            readOnly 
                            placeholder="Select Image" 
                            className="bg-white dark:bg-slate-950" 
                        />
                        <MediaSelector 
                        onSelect={handleImageSelect}
                        type="image"
                        trigger={
                            <Button type="button" size="icon" className="bg-green-600 hover:bg-green-700 shrink-0">
                                <Upload className="h-4 w-4" />
                            </Button>
                        }
                        />
                    </div>
                    {formData.feature_image && (
                        <div className="relative border rounded-lg overflow-hidden aspect-video bg-gray-100 mt-2">
                            <img 
                                src={formData.feature_image} 
                                alt="Feature" 
                                className="w-full h-full object-cover"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => setFormData(prev => ({ ...prev, feature_image: '' }))}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="pt-4">
                  <PermissionButton 
                    moduleSlug="front_cms.pages" 
                    action={pageId ? 'edit' : 'add'}
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <Save className="h-4 w-4 mr-2" />
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

export default AddEditPage;
