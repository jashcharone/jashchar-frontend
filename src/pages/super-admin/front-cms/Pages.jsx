import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2, Link as LinkIcon, Save, X } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton } from '@/components/PermissionComponents';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabaseClient';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';

const Pages = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMasterAdmin = location.pathname.startsWith('/master-admin');
  const basePath = isMasterAdmin ? '/master-admin/front-cms' : '/super-admin/front-cms';
  const { school } = useAuth();
  const [targetSchoolSlug, setTargetSchoolSlug] = useState(null);

  useEffect(() => {
    const fetchSlug = async () => {
      if (isMasterAdmin) {
        const sid = sessionStorage.getItem('ma_target_branch_id');
        if (sid) {
          const { data } = await supabase.from('schools').select('slug').eq('id', sid).maybeSingle();
          if (data) setTargetSchoolSlug(data.slug);
        }
      } else if (school?.slug) {
        setTargetSchoolSlug(school.slug);
      }
    };
    fetchSlug();
  }, [isMasterAdmin, school]);
  
  // Data States
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    page_type: 'standard',
    content_html: '',
    is_active: true,
    is_published: true
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getPages();
      if (response.success) {
        setPages(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading pages' });
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
        response = await frontCmsService.updatePage(editingId, formData);
      } else {
        response = await frontCmsService.createPage(formData);
      }

      if (response.success) {
        toast({ title: `Page ${editingId ? 'updated' : 'created'} successfully` });
        setFormData({ title: '', slug: '', page_type: 'standard', content_html: '', is_active: true });
        setEditingId(null);
        loadPages();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (page) => {
    setFormData({
      title: page.title,
      slug: page.slug,
      page_type: page.page_type || 'standard',
      content_html: page.content_html || '',
      is_active: page.is_active,
      is_published: page.is_published !== undefined ? page.is_published : true
    });
    setEditingId(page.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    try {
      const response = await frontCmsService.deletePage(id);
      if (response.success) {
        toast({ title: 'Page deleted successfully' });
        loadPages();
        if (editingId === id) {
            setFormData({ title: '', slug: '', page_type: 'standard', content_html: '', is_active: true });
            setEditingId(null);
        }
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  const renderForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>{editingId ? 'Edit Page' : 'Add Page'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Enter page title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page_type">Page Type</Label>
            <Select
              value={formData.page_type}
              onValueChange={(value) => setFormData({ ...formData, page_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="gallery">Gallery</SelectItem>
                <SelectItem value="news">News</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content (HTML)</Label>
            <Textarea
              id="content"
              value={formData.content_html}
              onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
              placeholder="<p>Page content...</p>"
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="is_published">Published</Label>
          </div>
          <div className="flex justify-end gap-2">
            {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                    setEditingId(null);
                    setFormData({ title: '', slug: '', page_type: 'standard', content_html: '', is_active: true });
                }}>
                    Cancel
                </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderList = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Page List</CardTitle>
        <PermissionButton 
          moduleSlug="front_cms.pages" 
          action="add"
          onClick={() => navigate(`${basePath}/pages/add`)}
        >
          <Plus className="h-4 w-4 mr-2" /> Add
        </PermissionButton>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
            <Input 
                placeholder="Search..." 
                className="max-w-sm"
                // Add search logic here if needed
            />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Page Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No pages found
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => navigate(`${basePath}/pages/edit/${page.id}`)}>{page.title}</div>
                  </TableCell>
                  <TableCell>
                    <a href={`${window.location.origin.replace(':3005', ':3006')}/${targetSchoolSlug || 'school'}/${page.slug}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                        {window.location.origin.replace(':3005', ':3006')}/{targetSchoolSlug || 'school'}/{page.slug}
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        page.page_type === 'gallery' ? 'bg-green-100 text-green-800' :
                        page.page_type === 'events' ? 'bg-blue-100 text-blue-800' :
                        page.page_type === 'news' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {page.page_type ? page.page_type.charAt(0).toUpperCase() + page.page_type.slice(1) : 'Standard'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        page.is_published ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {page.is_published ? 'Published' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <PermissionButton 
                        moduleSlug="front_cms.pages" 
                        action="edit"
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(`${basePath}/pages/edit/${page.id}`)} 
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4 text-gray-600" />
                      </PermissionButton>
                      <PermissionButton 
                        moduleSlug="front_cms.pages" 
                        action="delete"
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(page.id)} 
                        title="Delete"
                      >
                        <X className="h-4 w-4 text-gray-600" />
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
        {/* Full width list view */}
        <div className="w-full">
            {renderList()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Pages;
