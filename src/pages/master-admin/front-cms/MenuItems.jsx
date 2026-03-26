import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Trash2, Edit, ArrowUp, ArrowDown, ArrowLeft, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const MenuItems = ({ branchId: propSchoolId }) => {
  const { menuId } = useParams();
  const [searchParams] = useSearchParams();
  const { branchId: authSchoolId } = useAuth();
  const selectedSchoolId = propSchoolId || searchParams.get('branch_id') || authSchoolId || '';
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [pages, setPages] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    is_external: false,
    open_in_new_tab: false,
    url: '',
    page_id: null
  });

  useEffect(() => {
    if (selectedSchoolId && menuId) {
      loadData();
    }
  }, [selectedSchoolId, menuId]);

  const loadData = async () => {
    if (!selectedSchoolId || !menuId) return;

    setLoading(true);
    try {
      // Load menu
      const { data: menuData, error: menuError } = await supabase
        .from('front_cms_menus')
        .select('*')
        .eq('id', menuId)
        .eq('branch_id', selectedSchoolId)
        .single();

      if (menuError) throw menuError;
      setMenu(menuData);

      // Load menu items via API
      const itemsResponse = await apiClient.get(`/front-cms/menus/${menuId}/items?branch_id=${selectedSchoolId}`);

      if (itemsResponse.success) {
        setMenuItems(itemsResponse.data || []);
      }

      // Load pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('front_cms_pages')
        .select('id, title')
        .eq('branch_id', selectedSchoolId)
        .order('title');

      if (pagesError) throw pagesError;
      setPages(pagesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load menu items'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSchoolId) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'School ID is missing'
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Menu Item title is required'
      });
      return;
    }

    if (formData.is_external && !formData.url.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'External URL is required when External URL is enabled'
      });
      return;
    }

    if (!formData.is_external && !formData.page_id) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select a page or enable External URL'
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        branch_id: selectedSchoolId,
        title: formData.title.trim(),
        is_external: formData.is_external,
        open_in_new_tab: formData.open_in_new_tab,
        url: formData.is_external ? formData.url.trim() : null,
        page_id: formData.is_external ? null : formData.page_id
      };

      let response;
      if (editingItem) {
        response = await apiClient.put(`/front-cms/menus/${menuId}/items/${editingItem.id}?branch_id=${selectedSchoolId}`, payload);
      } else {
        response = await apiClient.post(`/front-cms/menus/${menuId}/items?branch_id=${selectedSchoolId}`, payload);
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: editingItem ? 'Menu item updated successfully' : 'Menu item created successfully'
        });

        resetForm();
        loadData();
      } else {
        throw new Error(response.message || 'Failed to save menu item');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save menu item'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      is_external: false,
      open_in_new_tab: false,
      url: '',
      page_id: null
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      is_external: item.is_external || false,
      open_in_new_tab: item.open_in_new_tab || false,
      url: item.url || '',
      page_id: item.page_id || null
    });
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    if (!selectedSchoolId) return;

    try {
      const response = await apiClient.delete(`/front-cms/menus/${menuId}/items/${itemId}?branch_id=${selectedSchoolId}`);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Menu item deleted successfully'
        });
        loadData();
      } else {
        throw new Error(response.message || 'Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete menu item'
      });
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0 || !selectedSchoolId) return;

    try {
      const response = await apiClient.post(
        `/front-cms/menus/${menuId}/items/${menuItems[index].id}/reorder?branch_id=${selectedSchoolId}`,
        { direction: 'up' }
      );

      if (response.success) {
        loadData();
      } else {
        throw new Error(response.message || 'Failed to reorder menu item');
      }
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reorder menu item'
      });
    }
  };

  const handleMoveDown = async (index) => {
    if (index === menuItems.length - 1 || !selectedSchoolId) return;

    try {
      const response = await apiClient.post(
        `/front-cms/menus/${menuId}/items/${menuItems[index].id}/reorder?branch_id=${selectedSchoolId}`,
        { direction: 'down' }
      );

      if (response.success) {
        loadData();
      } else {
        throw new Error(response.message || 'Failed to reorder menu item');
      }
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reorder menu item'
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!menu) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Menu not found</p>
            <Button onClick={() => navigate('/master-admin/front-cms/menus')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menus
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/master-admin/front-cms/menus')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menus
          </Button>
          <h1 className="text-2xl font-bold">Add Menu Item</h1>
          <p className="text-muted-foreground">Menu: {menu.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Add Menu Item Form */}
          <Card>
            <CardHeader>
              <CardTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Menu Item <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Home, About Us"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_external">External URL</Label>
                    <Switch
                      id="is_external"
                      checked={formData.is_external}
                      onCheckedChange={(checked) => 
                        setFormData({ 
                          ...formData, 
                          is_external: checked,
                          page_id: checked ? null : formData.page_id,
                          url: checked ? formData.url : ''
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="open_in_new_tab">Open In New Tab</Label>
                    <Switch
                      id="open_in_new_tab"
                      checked={formData.open_in_new_tab}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, open_in_new_tab: checked })
                      }
                    />
                  </div>
                </div>

                {formData.is_external ? (
                  <div className="space-y-2">
                    <Label htmlFor="url">
                      External URL Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com or /contact"
                      required={formData.is_external}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="page_id">
                      Pages <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.page_id || ''}
                      onValueChange={(value) => 
                        setFormData({ ...formData, page_id: value || null })
                      }
                      required={!formData.is_external}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No pages available. Create pages first.
                          </div>
                        ) : (
                          pages.map((page) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? 'Update' : 'Save'}
                  </Button>
                  {editingItem && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right Panel: Menu Item List */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Item List</CardTitle>
            </CardHeader>
            <CardContent>
              {menuItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No menu items found. Add your first menu item!
                </div>
              ) : (
                <div className="space-y-2">
                  {menuItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.is_external ? (
                              <span>{item.url}</span>
                            ) : (
                              <span>Page: {item.front_cms_pages?.title || 'Unknown'}</span>
                            )}
                            {item.open_in_new_tab && (
                              <span className="ml-2">(Opens in new tab)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === menuItems.length - 1}
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MenuItems;

