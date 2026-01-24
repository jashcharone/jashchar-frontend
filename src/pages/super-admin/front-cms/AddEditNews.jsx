import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Upload, X, Plus } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import RichTextEditor from '@/components/front-cms/RichTextEditor';
import MediaSelector from '@/components/front-cms/MediaSelector';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';
import DashboardLayout from '@/components/DashboardLayout';

const AddEditNews = () => {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMasterAdmin = location.pathname.startsWith('/master-admin');
  const isSuperAdmin = location.pathname.startsWith('/super-admin');
  const basePath = isMasterAdmin ? '/master-admin/front-cms' : '/super-admin/front-cms';  
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content_html: '',
    published_at: '',
    image_url: '',
    meta_title: '',
    meta_keyword: '',
    meta_description: ''
  });

  useEffect(() => {
    if (newsId) {
      loadNews();
    }
  }, [newsId]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getNewsItem(newsId);
      if (response.success) {
        const data = response.data;
        if (data.published_at) data.published_at = data.published_at.split('T')[0];
        setFormData(data);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading news' });
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    if (!newsId || !formData.slug) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, title, slug }));
    } else {
      setFormData(prev => ({ ...prev, title }));
    }
  };

  const handleImageSelect = (file) => {
    setFormData(prev => ({ ...prev, image_url: file.url }));
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
      if (newsId) {
        response = await frontCmsService.updateNews(newsId, formData);
      } else {
        response = await frontCmsService.createNews(formData);
      }

      if (response.success) {
        toast({ title: `News ${newsId ? 'updated' : 'created'} successfully` });
        navigate(`${basePath}/news`);
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
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/news`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{newsId ? 'Edit News' : 'Add News'}</h1>
        </div>

        <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>News Content</CardTitle>
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
                      value={formData.content_html}
                      onChange={(value) => setFormData(prev => ({ ...prev, content_html: value }))}
                      placeholder="News content..."
                    />
                  </div>
                </div>
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
                  <Label htmlFor="published_at">Publish Date</Label>
                  <Input
                    id="published_at"
                    type="date"
                    value={formData.published_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Feature Image</Label>
                  {formData.image_url ? (
                    <div className="relative border rounded-lg overflow-hidden aspect-video bg-gray-100">
                      <img 
                        src={formData.image_url} 
                        alt="Feature" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <MediaSelector 
                      onSelect={handleImageSelect}
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
                    moduleSlug="front_cms.news" 
                    action={newsId ? 'edit' : 'add'}
                    type="submit" 
                    className="w-full" 
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {newsId ? 'Update News' : 'Publish News'}
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

export default AddEditNews;
