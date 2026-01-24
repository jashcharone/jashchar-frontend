import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Edit, FileText, Plus, Trash2, X } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const MasterPagesTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [editingPage, setEditingPage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branchId) loadPages();
  }, [branchId]);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getPages(branchId);
      setPages(data || []);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load pages' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        branch_id: branchId,
        ...editingPage
      };
      // Auto-generate slug if missing
      if (!payload.slug && payload.title) {
        payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      
      await cmsEditorService.upsertPage(payload);
      toast({ title: 'Success', description: 'Page saved successfully' });
      setEditingPage(null);
      loadPages();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save page' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await cmsEditorService.deletePage(id);
      toast({ title: 'Page deleted' });
      loadPages();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting page' });
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Master Admin Page Manager</h3>
        <div className="inline-block">
          <Button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Opening Create Page Dialog');
              setEditingPage({ title: '', slug: '', content_html: '', is_published: true });
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Create New Page
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {pages.map(page => (
          <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">{page.title || page.slug}</h4>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="uppercase tracking-wider">/{page.slug}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-xs px-2 py-1 rounded-full ${page.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {page.is_published ? 'Published' : 'Draft'}
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditingPage(page)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(page.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {pages.length === 0 && <div className="text-center p-4 text-muted-foreground border-dashed border rounded-lg">No pages found. Create one to get started.</div>}
      </div>

      {/* --- CUSTOM MANUAL MODAL IMPLEMENTATION --- */}
      {!!editingPage && (
        <div className="fixed inset-0 z-[50000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingPage(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold tracking-tight">
                {editingPage?.id ? 'Edit Page' : 'Create New Page'}
              </h2>
              <button 
                onClick={() => setEditingPage(null)}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Page Title <span className="text-red-500">*</span></Label>
                    <Input 
                      value={editingPage.title || ''} 
                      onChange={e => setEditingPage({...editingPage, title: e.target.value})} 
                      placeholder="e.g. About Us"
                      required
                    />
                  </div>
                  <div>
                    <Label>Slug (URL Path)</Label>
                    <Input 
                      value={editingPage.slug || ''} 
                      onChange={e => setEditingPage({...editingPage, slug: e.target.value})} 
                      placeholder="e.g. about-us"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate from title.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Content (HTML)</Label>
                  <Textarea 
                    className="min-h-[200px] font-mono text-sm"
                    value={editingPage.content_html || ''}
                    onChange={e => setEditingPage({...editingPage, content_html: e.target.value})}
                    placeholder="<p>Enter your page content here...</p>"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="published" 
                    checked={editingPage.is_published}
                    onCheckedChange={c => setEditingPage({...editingPage, is_published: c})}
                  />
                  <Label htmlFor="published">Published</Label>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-6">
                  <Button type="button" variant="outline" onClick={() => setEditingPage(null)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Page
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterPagesTab;
