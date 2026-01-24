import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Upload, X, Plus } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import RichTextEditor from '@/components/front-cms/RichTextEditor';
import MediaSelector from '@/components/front-cms/MediaSelector';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';

const AddEditEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMasterAdmin = location.pathname.startsWith('/master-admin');
  const basePath = isMasterAdmin ? '/master-admin/front-cms' : '/super-admin/front-cms';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    image_url: '',
    meta_title: '',
    meta_keyword: '',
    meta_description: '',
    sidebar_setting: false
  });

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getEvent(eventId);
      if (response.success) {
        // Format dates for input type="date"
        const data = response.data;
        if (data.start_date) data.start_date = data.start_date.split('T')[0];
        if (data.end_date) data.end_date = data.end_date.split('T')[0];
        setFormData(data);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading event' });
    } finally {
      setLoading(false);
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
      if (eventId) {
        response = await frontCmsService.updateEvent(eventId, formData);
      } else {
        response = await frontCmsService.createEvent(formData);
      }

      if (response.success) {
        toast({ title: `Event ${eventId ? 'updated' : 'created'} successfully` });
        navigate(`${basePath}/events`);
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
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/events`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{eventId ? 'Edit Event' : 'Add New Event'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Venue</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Event Start</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Event End</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
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
                      value={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      placeholder="Event description..."
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
                <CardTitle>Sidebar Setting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sidebar-setting">Sidebar</Label>
                  <Switch
                    id="sidebar-setting"
                    checked={formData.sidebar_setting}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sidebar_setting: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
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
                    moduleSlug="front_cms.events" 
                    action={eventId ? 'edit' : 'add'}
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700" 
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

export default AddEditEvent;
