import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/apiClient';

const Menus = ({ branchId: propSchoolId }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(propSchoolId || '');
  const [menus, setMenus] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (propSchoolId) {
      // If branchId is passed as prop (from FrontCmsMasterAdmin), use it directly
      setSelectedSchoolId(propSchoolId);
    } else {
      // Otherwise, load schools for standalone page
      loadSchools();
    }
  }, [propSchoolId]);

  useEffect(() => {
    if (selectedSchoolId) {
      loadMenus();
      createDefaultMenusIfNeeded();
    } else {
      setMenus([]);
    }
  }, [selectedSchoolId]);

  const loadSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, status')
        .eq('status', 'Active')
        .order('name');
      
      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error loading schools:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load schools'
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultMenusIfNeeded = async () => {
    if (!selectedSchoolId) return;

    try {
      const { data: existingMenus } = await supabase
        .from('front_cms_menus')
        .select('title')
        .eq('branch_id', selectedSchoolId);

      const existingTitles = (existingMenus || []).map(m => m.title?.toLowerCase());
      
      const defaultMenus = [
        { title: 'Main menu', description: 'Main navigation menu for the website header' },
        { title: 'Bottom Menu', description: 'Footer navigation menu' }
      ];

      const menusToCreate = defaultMenus.filter(
        menu => !existingTitles.includes(menu.title.toLowerCase())
      );

      if (menusToCreate.length > 0) {
        const inserts = menusToCreate.map(menu => ({
          branch_id: selectedSchoolId,
          title: menu.title,
          description: menu.description,
          position: menu.title === 'Main menu' ? 0 : 1,
          is_active: true
        }));

        const { error } = await supabase
          .from('front_cms_menus')
          .insert(inserts);

        if (error) {
          console.error('Error creating default menus:', error);
        } else {
          loadMenus();
        }
      }
    } catch (error) {
      console.error('Error checking default menus:', error);
    }
  };

  const loadMenus = async () => {
    if (!selectedSchoolId) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/front-cms/menus?branch_id=${selectedSchoolId}`);

      if (response.success) {
        setMenus(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load menus');
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load menus'
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
        description: 'Please select a school first'
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Menu title is required'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.post('/front-cms/menus', {
        branch_id: selectedSchoolId,
        title: formData.title.trim(),
        description: formData.description.trim() || null
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Menu created successfully'
        });

        setFormData({ title: '', description: '' });
        loadMenus();
      } else {
        throw new Error(response.message || 'Failed to create menu');
      }
    } catch (error) {
      console.error('Error creating menu:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create menu'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (menuId) => {
    if (!confirm('Are you sure you want to delete this menu? This will also delete all menu items in this menu.')) {
      return;
    }

    if (!selectedSchoolId) return;

    try {
      const response = await apiClient.delete(`/front-cms/menus/${menuId}?branch_id=${selectedSchoolId}`);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Menu deleted successfully'
        });
        loadMenus();
      } else {
        throw new Error(response.message || 'Failed to delete menu');
      }
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete menu'
      });
    }
  };

  if (loading && !selectedSchoolId) {
    const loadingContent = (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
    
    if (propSchoolId) return loadingContent;
    
    return (
      <DashboardLayout>
        {loadingContent}
      </DashboardLayout>
    );
  }

  const content = (
    <div className={propSchoolId ? "" : "p-6"}>
      {!propSchoolId && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Menus</h1>
          <p className="text-muted-foreground">Manage navigation menus for school websites</p>
        </div>
      )}

      {/* School Selector - Only show if not passed as prop */}
      {!propSchoolId && (
        <div className="mb-6">
          <Label htmlFor="school-select" className="mb-2 block">Select School</Label>
          <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
            <SelectTrigger id="school-select" className="w-64">
              <SelectValue placeholder="Select a school" />
            </SelectTrigger>
            <SelectContent>
              {schools.map(school => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!selectedSchoolId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Please select a school to manage menus</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Add Menu */}
          <Card>
            <CardHeader>
              <CardTitle>Add Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Menu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Main Menu"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter menu description (optional)"
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Panel: Menu List */}
          <Card>
            <CardHeader>
              <CardTitle>Menu List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : menus.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No menus found. Create your first menu!
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 pb-2 border-b font-semibold text-sm text-muted-foreground">
                    <div>Title</div>
                    <div>Action</div>
                  </div>
                  {menus.map((menu) => (
                    <div
                      key={menu.id}
                      className="grid grid-cols-2 gap-4 items-center py-2 border-b hover:bg-muted/50 rounded px-2"
                    >
                      <div>
                        <div className="font-medium">{menu.title}</div>
                        {menu.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {menu.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => navigate(propSchoolId 
                            ? `/super-admin/front-cms/menus/${menu.id}/items?branch_id=${propSchoolId}` 
                            : `/master-admin/front-cms/menus/${menu.id}/items?branch_id=${selectedSchoolId}`
                          )}
                          title="Add Menu Items"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(menu.id)}
                          title="Delete Menu"
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
      )}
    </div>
  );

  if (propSchoolId) {
    return content;
  }

  return (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
};

export default Menus;

