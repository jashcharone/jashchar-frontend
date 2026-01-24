import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Edit, ArrowUp, ArrowDown } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const MenusFooterTab = ({ branchId }) => {
  const [menus, setMenus] = useState([]);
  const [footerLinks, setFooterLinks] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [editingMenu, setEditingMenu] = useState(null);
  const [editingFooter, setEditingFooter] = useState(null);

  useEffect(() => { if (branchId) load(); }, [branchId]);

  const load = async () => {
    setLoading(true);
    const [m, f, p] = await Promise.all([
      cmsEditorService.getMenuItems(branchId),
      cmsEditorService.getFooterLinks(branchId),
      cmsEditorService.getPages(branchId)
    ]);
    setMenus(m || []);
    setFooterLinks(f || []);
    setPages(p || []);
    setLoading(false);
  };

  // Menu Handlers
  const saveMenu = async () => {
    await cmsEditorService.upsertMenuItem({ ...editingMenu, branch_id: branchId });
    setEditingMenu(null);
    load();
  };
  const deleteMenu = async (id) => {
    if (!window.confirm('Delete?')) return;
    await cmsEditorService.deleteMenuItem(id);
    load();
  };

  // Footer Handlers
  const saveFooter = async () => {
    await cmsEditorService.upsertFooterLink({ ...editingFooter, branch_id: branchId });
    setEditingFooter(null);
    load();
  };
  const deleteFooter = async (id) => {
    if (!window.confirm('Delete?')) return;
    await cmsEditorService.deleteFooterLink(id);
    load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto my-8" />;

  return (
    <Tabs defaultValue="header" className="w-full p-4">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="header">Header Menu</TabsTrigger>
        <TabsTrigger value="footer">Footer Links</TabsTrigger>
      </TabsList>

      <TabsContent value="header" className="space-y-4 pt-4">
        <div className="flex justify-between">
          <h3 className="font-bold">Top Navigation Items</h3>
          <Button onClick={() => setEditingMenu({ is_active: true, position: menus.length + 1, menu_type: 'page' })}><Plus className="mr-2 h-4 w-4" /> Add Menu Item</Button>
        </div>
        <div className="space-y-2">
          {menus.map(m => (
            <div key={m.id} className="flex justify-between p-3 border rounded bg-white items-center">
              <div>
                <span className="font-bold">{m.title}</span> <span className="text-xs text-slate-500">({m.menu_type})</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditingMenu(m)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMenu(m.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="footer" className="space-y-4 pt-4">
        <div className="flex justify-between">
          <h3 className="font-bold">Footer Quick Links</h3>
          <Button onClick={() => setEditingFooter({ is_active: true, sort_order: footerLinks.length + 1 })}><Plus className="mr-2 h-4 w-4" /> Add Link</Button>
        </div>
        <div className="space-y-2">
          {footerLinks.map(f => (
            <div key={f.id} className="flex justify-between p-3 border rounded bg-white items-center">
              <div className="font-bold">{f.title_en}</div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditingFooter(f)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteFooter(f.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* Edit Menu Dialog */}
      <Dialog open={!!editingMenu} onOpenChange={() => setEditingMenu(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Title</Label><Input value={editingMenu?.title || ''} onChange={e => setEditingMenu(p => ({...p, title: e.target.value}))} /></div>
            <div>
              <Label>Type</Label>
              <Select value={editingMenu?.menu_type} onValueChange={v => setEditingMenu(p => ({...p, menu_type: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="page">Page</SelectItem><SelectItem value="external">External URL</SelectItem></SelectContent>
              </Select>
            </div>
            {editingMenu?.menu_type === 'page' && (
              <div><Label>Page</Label><Select value={editingMenu?.page_slug} onValueChange={v => setEditingMenu(p => ({...p, page_slug: v}))}><SelectTrigger><SelectValue placeholder="Select page" /></SelectTrigger><SelectContent>{pages.map(pg => <SelectItem key={pg.id} value={pg.slug}>{pg.title_en}</SelectItem>)}</SelectContent></Select></div>
            )}
            {editingMenu?.menu_type === 'external' && (
              <div><Label>URL</Label><Input value={editingMenu?.external_url || ''} onChange={e => setEditingMenu(p => ({...p, external_url: e.target.value}))} /></div>
            )}
          </div>
          <DialogFooter><Button onClick={saveMenu}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Footer Dialog */}
      <Dialog open={!!editingFooter} onOpenChange={() => setEditingFooter(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Footer Link</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Title (EN)</Label><Input value={editingFooter?.title_en || ''} onChange={e => setEditingFooter(p => ({...p, title_en: e.target.value}))} /></div>
            <div><Label>URL</Label><Input value={editingFooter?.url || ''} onChange={e => setEditingFooter(p => ({...p, url: e.target.value}))} /></div>
          </div>
          <DialogFooter><Button onClick={saveFooter}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default MenusFooterTab;
