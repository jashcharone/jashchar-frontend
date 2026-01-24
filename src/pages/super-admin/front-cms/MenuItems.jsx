import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import frontCmsService from '@/services/frontCmsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionButton, ActionButtons } from '@/components/PermissionComponents';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import MasterAdminSchoolHeader from '@/components/front-cms/MasterAdminSchoolHeader';

const MenuItems = () => {
  const { menuId } = useParams();
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branch_id');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    parent_id: null,
    is_external: false,
    page_id: '0'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (menuId) {
      loadMenuItems();
      loadPages();
    }
  }, [menuId]);

  const loadMenuItems = async () => {
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

  const loadPages = async () => {
    try {
      const response = await frontCmsService.getPages(branchId);
      if (response.success) {
        setPages(response.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        title: item.title,
        url: item.url || '',
        parent_id: item.parent_id || '0',
        is_external: item.is_external || false,
        page_id: item.page_id ? item.page_id.toString() : '0'
      });
    } else {
      setCurrentItem(null);
      setFormData({
        title: '',
        url: '',
        parent_id: '0',
        is_external: false,
        page_id: '0'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        menu_id: menuId,
        parent_id: formData.parent_id === '0' ? null : formData.parent_id,
        page_id: formData.page_id === '0' ? null : formData.page_id
      };

      let response;
      if (currentItem) {
        response = await frontCmsService.updateMenuItem(currentItem.id, payload, branchId);
      } else {
        response = await frontCmsService.createMenuItem(payload, branchId);
      }

      if (response.success) {
        toast({ title: `Item ${currentItem ? 'updated' : 'created'} successfully` });
        setIsDialogOpen(false);
        loadMenuItems();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await frontCmsService.deleteMenuItem(id, branchId);
      if (response.success) {
        toast({ title: 'Item deleted successfully' });
        loadMenuItems();
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Delete failed' });
    }
  };

  // Helper to get parent name
  const getParentName = (parentId) => {
    if (!parentId) return '-';
    const parent = menuItems.find(i => i.id === parentId);
    return parent ? parent.title : 'Unknown';
  };

  return (
    <div className="p-6 space-y-6">
      <MasterAdminSchoolHeader />
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(branchId ? `/super-admin/front-cms/menus?branch_id=${branchId}` : '/super-admin/front-cms/menus')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Manage Menu Items</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Menu Items List</CardTitle>
          <PermissionButton 
            moduleSlug="front_cms.menus" 
            action="add"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </PermissionButton>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Link / Page</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>External</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        {item.page_id 
                          ? `Page: ${pages.find(p => p.id === item.page_id)?.title || 'Unknown'}` 
                          : item.url}
                      </TableCell>
                      <TableCell>{getParentName(item.parent_id)}</TableCell>
                      <TableCell>{item.is_external ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <ActionButtons
                          moduleSlug="front_cms.menus"
                          onEdit={() => handleOpenDialog(item)}
                          onDelete={() => handleDelete(item.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Link Type</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is_external" 
                  checked={formData.is_external}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_external: checked })}
                />
                <Label htmlFor="is_external">External Link (Open in new tab)</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page_id">Link to Page (Internal)</Label>
              <Select 
                value={formData.page_id} 
                onValueChange={(val) => setFormData({ ...formData, page_id: val, url: '' })}
                disabled={formData.is_external}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">-- Custom Link --</SelectItem>
                  {pages.map(page => (
                    <SelectItem key={page.id} value={page.id.toString()}>
                      {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.page_id === '0' && (
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com or /contact"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent Item</Label>
              <Select 
                value={formData.parent_id ? formData.parent_id.toString() : '0'} 
                onValueChange={(val) => setFormData({ ...formData, parent_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">-- No Parent --</SelectItem>
                  {menuItems
                    .filter(i => i.id !== currentItem?.id) // Prevent self-parenting
                    .map(item => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuItems;
