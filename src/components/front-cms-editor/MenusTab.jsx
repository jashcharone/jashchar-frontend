import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Edit, Menu as MenuIcon, Link as LinkIcon, FileText } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const MenusTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [pages, setPages] = useState([]);
  
  // Dialog States
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (branchId) {
      loadMenus();
      loadPages();
    }
  }, [branchId]);

  useEffect(() => {
    if (selectedMenu) {
      loadMenuItems(selectedMenu.id);
    } else {
      setMenuItems([]);
    }
  }, [selectedMenu]);

  const loadMenus = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getMenus(branchId);
      setMenus(data || []);
      if (data && data.length > 0 && !selectedMenu) {
        setSelectedMenu(data[0]);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error loading menus' });
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async (menuId) => {
    try {
      const data = await cmsEditorService.getMenuItems(menuId);
      setMenuItems(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error loading menu items' });
    }
  };

  const loadPages = async () => {
    try {
      const data = await cmsEditorService.getPages(branchId);
      setPages(data || []);
    } catch (error) {
      console.error("Failed to load pages");
    }
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        branch_id: branchId,
        title: editingMenu.title,
        position: editingMenu.position || 0
      };
      if (editingMenu.id) payload.id = editingMenu.id;
      
      await cmsEditorService.upsertMenu(payload);
      toast({ title: 'Success', description: 'Menu saved' });
      setIsMenuDialogOpen(false);
      loadMenus();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving menu' });
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        menu_id: selectedMenu.id,
        title: editingItem.title,
        url: editingItem.url,
        page_id: editingItem.page_id === 'external' ? null : editingItem.page_id,
        is_external: editingItem.page_id === 'external',
        open_in_new_tab: editingItem.open_in_new_tab,
        order_index: editingItem.order_index || 0
      };
      if (editingItem.id) payload.id = editingItem.id;

      await cmsEditorService.upsertMenuItem(payload);
      toast({ title: 'Success', description: 'Menu item saved' });
      setIsItemDialogOpen(false);
      loadMenuItems(selectedMenu.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving item' });
    }
  };

  const handleDeleteMenu = async (id) => {
    if (!confirm("Are you sure? This will delete all items in this menu.")) return;
    try {
      await cmsEditorService.deleteMenu(id);
      toast({ title: 'Menu deleted' });
      loadMenus();
      setSelectedMenu(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting menu' });
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await cmsEditorService.deleteMenuItem(id);
      toast({ title: 'Item deleted' });
      loadMenuItems(selectedMenu.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting item' });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
      {/* Sidebar: Menus List */}
      <div className="md:col-span-1 space-y-4 border-r dark:border-slate-700 pr-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold dark:text-white">Menus</h3>
          <Button size="sm" variant="outline" onClick={() => { setEditingMenu({}); setIsMenuDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {menus.map(menu => (
            <div 
              key={menu.id} 
              className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${selectedMenu?.id === menu.id ? 'bg-primary text-primary-foreground' : 'bg-muted dark:bg-slate-700 hover:bg-muted/80 dark:hover:bg-slate-600'}`}
              onClick={() => setSelectedMenu(menu)}
            >
              <span className="font-medium">{menu.title}</span>
              {selectedMenu?.id === menu.id && (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-primary-foreground hover:text-white/80" onClick={(e) => { e.stopPropagation(); setEditingMenu(menu); setIsMenuDialogOpen(true); }}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-primary-foreground hover:text-white/80" onClick={(e) => { e.stopPropagation(); handleDeleteMenu(menu.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {menus.length === 0 && !loading && <div className="text-sm text-muted-foreground text-center py-4">No menus found. Create one!</div>}
        </div>
      </div>

      {/* Main Content: Menu Items */}
      <div className="md:col-span-3 space-y-6">
        {selectedMenu ? (
          <>
            <div className="flex justify-between items-center bg-muted/30 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold dark:text-white">{selectedMenu.title}</h2>
                <p className="text-sm text-muted-foreground">Manage items for this menu</p>
              </div>
              <Button onClick={() => { setEditingItem({ page_id: 'external', open_in_new_tab: false }); setIsItemDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Menu Item
              </Button>
            </div>

            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-blue-600 dark:text-blue-400 font-bold w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 dark:text-white">
                        {item.title}
                        {item.is_external && <LinkIcon className="h-3 w-3 text-muted-foreground" />}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {item.is_external ? item.url : `Page: ${item.front_cms_pages?.title || 'Unknown'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingItem(item); setIsItemDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {menuItems.length === 0 && <div className="text-center py-10 text-muted-foreground border-dashed border-2 rounded-lg dark:border-slate-700">No items in this menu yet.</div>}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a menu to manage items
          </div>
        )}
      </div>

      {/* Create/Edit Menu Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMenu?.id ? 'Edit Menu' : 'Create Menu'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveMenu} className="space-y-4">
            <div>
              <Label>Menu Title</Label>
              <Input value={editingMenu?.title || ''} onChange={e => setEditingMenu({...editingMenu, title: e.target.value})} required placeholder="e.g. Main Menu" />
            </div>
            <DialogFooter><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem?.id ? 'Edit Item' : 'Add Menu Item'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={editingItem?.title || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value})} required />
            </div>
            <div>
              <Label>Link Type</Label>
              <Select 
                value={editingItem?.page_id ? (editingItem.page_id === 'external' || !editingItem.page_id ? 'external' : editingItem.page_id.toString()) : 'external'} 
                onValueChange={(v) => setEditingItem({...editingItem, page_id: v === 'external' ? 'external' : parseInt(v)})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External URL / Custom Link</SelectItem>
                  {pages.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>Page: {p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(editingItem?.page_id === 'external' || !editingItem?.page_id) && (
              <div>
                <Label>URL</Label>
                <Input value={editingItem?.url || ''} onChange={e => setEditingItem({...editingItem, url: e.target.value})} placeholder="https://... or /contact" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={editingItem?.open_in_new_tab} onCheckedChange={c => setEditingItem({...editingItem, open_in_new_tab: c})} />
              <Label>Open in New Tab</Label>
            </div>
            <DialogFooter><Button type="submit">Save Item</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenusTab;
