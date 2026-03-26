import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, Save, X, Link as LinkIcon, FileText, ExternalLink, PlusCircle } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PermissionButton, ActionButtons } from '@/components/PermissionComponents';
import DashboardLayout from '@/components/DashboardLayout';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Menus = ({ branchId: propSchoolId }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { school } = useAuth();
  const [searchParams] = useSearchParams();
  const branchId = propSchoolId || searchParams.get('branch_id') || school?.id;
  
  // View Mode: 'menus' or 'items'
  const [viewMode, setViewMode] = useState('menus');
  const [selectedMenu, setSelectedMenu] = useState(null);

  // Data States
  const [menus, setMenus] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form States
  const [menuForm, setMenuForm] = useState({ title: '', description: '' });
  const [menuItemForm, setMenuItemForm] = useState({
    title: '',
    is_external: false,
    open_in_new_tab: false,
    external_url: '',
    page_id: 'select', 
    parent_id: '0'
  });
  
  const [editingId, setEditingId] = useState(null); // ID of menu or item being edited

  useEffect(() => {
    loadMenus();
    loadPages();
  }, []);

  useEffect(() => {
    if (viewMode === 'items' && selectedMenu) {
      loadMenuItems(selectedMenu.id);
      // Reset item form when switching to items view
      resetMenuItemForm();
    }
  }, [viewMode, selectedMenu]);

  // --- Data Loading ---

  const loadMenus = async () => {
    setLoading(true);
    try {
      const response = await frontCmsService.getMenus(branchId);
      if (response.success) {
        setMenus(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading menus' });
    } finally {
      setLoading(false);
    }
  };

  const loadPages = async () => {
    try {
      const response = await frontCmsService.getPages(branchId);
      if (response.success) {
        setPages(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading pages' });
    }
  };

  const loadMenuItems = async (menuId) => {
    setLoading(true);
    try {
      const response = await frontCmsService.getMenuItems(menuId, branchId);
      if (response.success) {
        setMenuItems(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading menu items' });
    } finally {
      setLoading(false);
    }
  };

  // --- Form Handling ---

  const resetMenuForm = () => {
    setMenuForm({ title: '', description: '' });
    setEditingId(null);
  };

  const resetMenuItemForm = () => {
    setMenuItemForm({
      title: '',
      is_external: false,
      open_in_new_tab: false,
      external_url: '',
      page_id: 'select',
      parent_id: '0'
    });
    setEditingId(null);
  };

  // --- Menu Actions ---

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!menuForm.title) {
        toast({ variant: 'destructive', title: 'Title is required' });
        return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await frontCmsService.updateMenu(editingId, menuForm, branchId);
        if (res.success) {
            toast({ title: 'Menu updated successfully' });
            loadMenus();
            resetMenuForm();
        }
      } else {
        const res = await frontCmsService.createMenu(menuForm, branchId);
        if (res.success) {
            toast({ title: 'Menu created successfully' });
            loadMenus();
            resetMenuForm();
        }
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error saving menu' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditMenu = (menu) => {
    setMenuForm({
        title: menu.title,
        description: menu.description || ''
    });
    setEditingId(menu.id);
  };

  const handleDeleteMenu = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu?')) return;
    try {
        const res = await frontCmsService.deleteMenu(id, branchId);
        if (res.success) {
            toast({ title: 'Menu deleted successfully' });
            loadMenus();
            if (editingId === id) resetMenuForm();
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error deleting menu' });
    }
  };

  const handleManageItems = (menu) => {
    setSelectedMenu(menu);
    setViewMode('items');
  };

  // --- Menu Item Actions ---

  const handleAddSubmenu = (parentItem) => {
    setMenuItemForm({
      title: '',
      is_external: false,
      open_in_new_tab: false,
      external_url: '',
      page_id: 'select',
      parent_id: parentItem.id.toString()
    });
    setEditingId(null);
    toast({ title: `Adding submenu for: ${parentItem.title}` });
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!menuItemForm.title) {
        toast({ variant: 'destructive', title: 'Menu Item is required' });
        return;
    }

    // Validation logic
    if (menuItemForm.is_external) {
        if (!menuItemForm.external_url) {
            toast({ variant: 'destructive', title: 'External URL is required' });
            return;
        }
    } else {
        if (!menuItemForm.page_id || menuItemForm.page_id === 'select') {
            toast({ variant: 'destructive', title: 'Please select a page' });
            return;
        }
    }

    setSaving(true);
    try {
      const payload = {
        title: menuItemForm.title,
        is_external: menuItemForm.is_external,
        open_in_new_tab: menuItemForm.open_in_new_tab,
        menu_id: selectedMenu.id,
        page_id: menuItemForm.is_external ? null : menuItemForm.page_id,
        url: menuItemForm.is_external ? menuItemForm.external_url : null,
        parent_id: menuItemForm.parent_id === '0' ? null : menuItemForm.parent_id
      };

      if (editingId) {
        const res = await frontCmsService.updateMenuItem(editingId, payload, branchId);
        if (res.success) {
            toast({ title: 'Menu Item updated successfully' });
            loadMenuItems(selectedMenu.id);
            resetMenuItemForm();
        }
      } else {
        const res = await frontCmsService.createMenuItem(payload, branchId);
        if (res.success) {
            toast({ title: 'Menu Item added successfully' });
            loadMenuItems(selectedMenu.id);
            resetMenuItemForm();
        }
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error saving menu item' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditMenuItem = (item) => {
    setMenuItemForm({
        title: item.title,
        is_external: item.is_external || false,
        open_in_new_tab: item.open_in_new_tab || false,
        external_url: item.url || '',
        page_id: item.page_id || 'select',
        parent_id: item.parent_id || '0'
    });
    setEditingId(item.id);
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
        const res = await frontCmsService.deleteMenuItem(id, branchId);
        if (res.success) {
            toast({ title: 'Menu Item deleted successfully' });
            loadMenuItems(selectedMenu.id);
            if (editingId === id) resetMenuItemForm();
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error deleting menu item' });
    }
  };

  // --- Render ---

  if (viewMode === 'items') {
    return (
        <DashboardLayout>
        <div className="space-y-6 p-6">
            <MasterAdminSchoolHeader />
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setViewMode('menus')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Menu Item: {selectedMenu?.title}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Add/Edit Form */}
                <Card className="lg:col-span-1 h-fit sticky top-6">
                    <CardHeader>
                        <CardTitle>
                            {editingId ? 'Edit Menu Item' : 'Add Menu Item'}
                            {menuItemForm.parent_id !== '0' && (
                                <span className="block text-sm font-normal text-gray-500 mt-1">
                                    Parent: {menuItems.find(i => i.id.toString() === menuItemForm.parent_id)?.title}
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveMenuItem} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Menu Item <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={menuItemForm.title} 
                                    onChange={(e) => setMenuItemForm({...menuItemForm, title: e.target.value})}
                                    placeholder="Enter menu item title"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Parent Menu Item</Label>
                                <Select 
                                    value={menuItemForm.parent_id?.toString()} 
                                    onValueChange={(val) => setMenuItemForm({...menuItemForm, parent_id: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">None (Top Level)</SelectItem>
                                        {menuItems
                                            .filter(item => item.id !== editingId) // Prevent selecting self as parent
                                            .map(item => (
                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                {item.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label className="cursor-pointer" htmlFor="is_external">External URL</Label>
                                <Switch 
                                    id="is_external"
                                    checked={menuItemForm.is_external}
                                    onCheckedChange={(checked) => setMenuItemForm({...menuItemForm, is_external: checked})}
                                />
                            </div>

                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label className="cursor-pointer" htmlFor="open_in_new_tab">Open In New Tab</Label>
                                <Switch 
                                    id="open_in_new_tab"
                                    checked={menuItemForm.open_in_new_tab}
                                    onCheckedChange={(checked) => setMenuItemForm({...menuItemForm, open_in_new_tab: checked})}
                                />
                            </div>

                            {menuItemForm.is_external ? (
                                <div className="space-y-2">
                                    <Label>External URL Address <span className="text-red-500">*</span></Label>
                                    <Input 
                                        value={menuItemForm.external_url} 
                                        onChange={(e) => setMenuItemForm({...menuItemForm, external_url: e.target.value})}
                                        placeholder="https://example.com"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Pages <span className="text-red-500">*</span></Label>
                                    <Select 
                                        value={menuItemForm.page_id?.toString()} 
                                        onValueChange={(val) => setMenuItemForm({...menuItemForm, page_id: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Page" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="select">Select</SelectItem>
                                            {pages.map(page => (
                                                <SelectItem key={page.id} value={page.id.toString()}>
                                                    {page.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={saving} className="flex-1">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    {editingId ? 'Update' : 'Save'}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={resetMenuItemForm}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Right Column: List */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Menu Item List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Link Type</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {menuItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                No items found in this menu.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        menuItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    <div style={{ paddingLeft: item.parent_id ? '20px' : '0' }}>
                                                        {item.parent_id && <span className="text-gray-400 mr-2">?</span>}
                                                        {item.title}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.is_external ? (
                                                        <span className="flex items-center text-blue-600 gap-1">
                                                            <ExternalLink className="h-3 w-3" /> External
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-green-600 gap-1">
                                                            <FileText className="h-3 w-3" /> Page
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.open_in_new_tab ? 'New Tab' : 'Same Tab'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleAddSubmenu(item)} title="Add Submenu">
                                                            <PlusCircle className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <PermissionButton moduleSlug="front_cms.menus" action="edit">
                                                            <Button variant="ghost" size="icon" onClick={() => handleEditMenuItem(item)}>
                                                                <Pencil className="h-4 w-4 text-blue-500" />
                                                            </Button>
                                                        </PermissionButton>
                                                        <PermissionButton moduleSlug="front_cms.menus" action="delete">
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteMenuItem(item.id)}>
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </PermissionButton>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        </DashboardLayout>
    );
  }

  // Default View: Menu List
  return (
    <DashboardLayout>
    <div className="space-y-6 p-6">
        <MasterAdminSchoolHeader />
        <h1 className="text-2xl font-bold text-gray-800">Menus</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Add/Edit Form */}
            <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>{editingId ? 'Edit Menu' : 'Add Menu'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSaveMenu} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Menu <span className="text-red-500">*</span></Label>
                            <Input 
                                value={menuForm.title} 
                                onChange={(e) => setMenuForm({...menuForm, title: e.target.value})}
                                placeholder="Enter menu title"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea 
                                value={menuForm.description} 
                                onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                                placeholder="Enter description"
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={saving} className="flex-1">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {editingId ? 'Update' : 'Save'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={resetMenuForm}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Right Column: List */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Menu List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {menus.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                                            No menus found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    menus.map((menu) => (
                                        <TableRow key={menu.id}>
                                            <TableCell className="font-medium">
                                                <div>{menu.title}</div>
                                                {menu.description && <div className="text-xs text-gray-500">{menu.description}</div>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        variant="default" 
                                                        size="sm" 
                                                        onClick={() => navigate(branchId ? `/super-admin/front-cms/menus/${menu.id}/items?branch_id=${branchId}` : `/super-admin/front-cms/menus/${menu.id}/items`)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                        title="Manage & Reorder Items"
                                                    >
                                                        Manage Items
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleManageItems(menu)} title="Quick Add Items">
                                                        <Plus className="h-4 w-4 mr-1" /> Add
                                                    </Button>
                                                    <PermissionButton moduleSlug="front_cms.menus" action="edit">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditMenu(menu)}>
                                                            <Pencil className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                    </PermissionButton>
                                                    <PermissionButton moduleSlug="front_cms.menus" action="delete">
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMenu(menu.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </PermissionButton>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
    </DashboardLayout>
  );
};

export default Menus;
