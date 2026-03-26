import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2, Calendar, Save, X, Image as ImageIcon } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/DashboardLayout';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import MediaSelector from '@/components/front-cms/MediaSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';
import { useNavigate, useLocation } from 'react-router-dom';

const News = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMasterAdmin = location.pathname.startsWith('/master-admin');
  const basePath = isMasterAdmin ? '/master-admin/front-cms' : '/super-admin/front-cms';
  
  // Data States
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content_html: '',
    featured_image: '',
    published_at: '',
    is_published: true,
    sidebar_setting: false,
    meta_title: '',
    meta_keyword: '',
    meta_description: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getNews();
      if (response.success) {
        setNews(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading news' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let response;
      if (editingId) {
        response = await frontCmsService.updateNews(editingId, formData);
      } else {
        response = await frontCmsService.createNews(formData);
      }

      if (response.success) {
        toast({ title: `News ${editingId ? 'updated' : 'created'} successfully` });
        resetForm();
        loadNews();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content_html: '',
      featured_image: '',
      published_at: '',
      is_published: true,
      sidebar_setting: false,
      meta_title: '',
      meta_keyword: '',
      meta_description: ''
    });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      summary: item.summary || '',
      content_html: item.content_html || '',
      featured_image: item.featured_image || item.image_url || '',
      published_at: item.published_at ? item.published_at.split('T')[0] : '',
      is_published: item.is_published,
      sidebar_setting: item.sidebar_setting || false,
      meta_title: item.meta_title || '',
      meta_keyword: item.meta_keyword || '',
      meta_description: item.meta_description || ''
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this news?')) return;
    try {
      const response = await frontCmsService.deleteNews(id);
      if (response.success) {
        toast({ title: 'News deleted successfully' });
        loadNews();
        if (editingId === id) {
            resetForm();
        }
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const renderForm = () => (
    <Card className="hidden md:block">
       <div className="p-6 text-center text-gray-500">
          <Button onClick={() => navigate(`${basePath}/news/add`)}>
            <Plus className="h-4 w-4 mr-2" /> Add New News
          </Button>
       </div>
    </Card>
  );

  const renderList = () => (
    <Card>
      <CardHeader>
        <CardTitle>News List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  No news found
                </TableCell>
              </TableRow>
            ) : (
              news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.featured_image && (
                        <img src={item.featured_image} alt="" className="h-8 w-8 rounded object-cover" />
                      )}
                      {item.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {item.published_at ? format(new Date(item.published_at), 'MMM d, yyyy') : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <PermissionButton 
                        moduleSlug="front_cms.news" 
                        action="edit"
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(`${basePath}/news/edit/${item.id}`)} 
                        title="Edit News"
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </PermissionButton>
                      <PermissionButton 
                        moduleSlug="front_cms.news" 
                        action="delete"
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(item.id)} 
                        title="Delete News"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </PermissionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <MasterAdminSchoolHeader />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Form */}
          <div className="md:col-span-1">
            {renderForm()}
          </div>

          {/* Right Column: List */}
          <div className="md:col-span-2">
            {renderList()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default News;
