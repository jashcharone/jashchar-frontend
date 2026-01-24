import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const FooterSocialTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branchId) loadLinks();
  }, [branchId]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getFooterLinks(branchId);
      setLinks(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error loading links' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = () => {
    setLinks([...links, { id: `temp-${Date.now()}`, title: '', url: '#', sort_order: links.length }]);
  };

  const handleDelete = async (id) => {
    if (id.toString().startsWith('temp')) {
      setLinks(links.filter(l => l.id !== id));
      return;
    }
    try {
      await cmsEditorService.deleteFooterLink(id);
      loadLinks();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting' });
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const link of links) {
        const payload = { 
          branch_id: branchId,
          title: link.title,
          url: link.url,
          sort_order: link.sort_order
        };
        if (!link.id.toString().startsWith('temp')) payload.id = link.id;
        await cmsEditorService.upsertFooterLink(payload);
      }
      toast({ title: 'Success', description: 'Footer links updated' });
      loadLinks();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error saving' });
    } finally {
      setSaving(false);
    }
  };

  const updateLink = (id, field, value) => {
    setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Footer Quick Links</h3>
        <Button size="sm" onClick={handleAddLink}><Plus className="h-4 w-4 mr-2" /> Add Link</Button>
      </div>

      <div className="space-y-4">
        {links.map((link, idx) => (
          <div key={link.id} className="p-4 border rounded-lg bg-white space-y-3 relative shadow-sm">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-400 hover:text-red-600" onClick={() => handleDelete(link.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
              <div>
                <Label>Link Label #{idx + 1}</Label>
                <Input 
                  value={link.title || ''} 
                  onChange={e => updateLink(link.id, 'title', e.target.value)} 
                  placeholder="Link Title"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} className="mt-2" placeholder="https://..." />
              </div>
            </div>
          </div>
        ))}
        {links.length === 0 && <div className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">No footer links defined.</div>}
      </div>

      {links.length > 0 && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save All Links
          </Button>
        </div>
      )}
    </div>
  );
};

export default FooterSocialTab;
