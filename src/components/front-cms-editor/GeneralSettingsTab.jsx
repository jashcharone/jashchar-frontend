import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const GeneralSettingsTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (branchId) loadSettings();
  }, [branchId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getSettings(branchId);
      setSettings(data || { branch_id: branchId });
    } catch (error) {
      console.error('Failed to load settings', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await cmsEditorService.updateSettings(branchId, settings);
      toast({ title: 'Success', description: 'Settings saved successfully' });
    } catch (error) {
      console.error('Failed to save settings', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateSocial = (network, value) => {
    const links = { ...(settings.social_links || {}) };
    links[network] = value;
    updateField('social_links', links);
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!settings) return <div className="p-8 text-center text-muted-foreground">Initializing settings...</div>;

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">General Configuration</h3>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branding */}
        <div className="space-y-4 border p-4 rounded-lg bg-white/50">
          <h4 className="font-medium border-b pb-2 text-primary">Branding</h4>
          <div>
            <Label>Primary Color</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                type="color" 
                value={settings.primary_color || '#000000'} 
                onChange={e => updateField('primary_color', e.target.value)} 
                className="w-12 p-1 h-9"
              />
              <Input 
                value={settings.primary_color || ''} 
                onChange={e => updateField('primary_color', e.target.value)} 
                placeholder="#000000"
              />
            </div>
          </div>
          <div>
            <Label>Accent Color</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                type="color" 
                value={settings.accent_color || '#ffffff'} 
                onChange={e => updateField('accent_color', e.target.value)} 
                className="w-12 p-1 h-9"
              />
              <Input 
                value={settings.accent_color || ''} 
                onChange={e => updateField('accent_color', e.target.value)} 
                placeholder="#ffffff"
              />
            </div>
          </div>
          <div>
            <Label>Logo URL</Label>
            <Input value={settings.logo_url || ''} onChange={e => updateField('logo_url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Favicon URL</Label>
            <Input value={settings.favicon_url || ''} onChange={e => updateField('favicon_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 border p-4 rounded-lg bg-white/50">
          <h4 className="font-medium border-b pb-2 text-primary">Contact Information</h4>
          <div>
            <Label>Address</Label>
            <Textarea 
              value={settings.contact_address || ''} 
              onChange={e => updateField('contact_address', e.target.value)} 
              className="min-h-[80px]"
            />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input value={settings.contact_email || ''} onChange={e => updateField('contact_email', e.target.value)} />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input value={settings.contact_mobile || ''} onChange={e => updateField('contact_mobile', e.target.value)} />
          </div>
          <div>
            <Label>Map Embed URL (iframe src)</Label>
            <Input value={settings.map_embed_url || ''} onChange={e => updateField('map_embed_url', e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4 border p-4 rounded-lg bg-white/50 md:col-span-2">
          <h4 className="font-medium border-b pb-2 text-primary">Social Media Links</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Facebook</Label>
              <Input value={settings.social_links?.facebook || ''} onChange={e => updateSocial('facebook', e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={settings.social_links?.instagram || ''} onChange={e => updateSocial('instagram', e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <Label>YouTube</Label>
              <Input value={settings.social_links?.youtube || ''} onChange={e => updateSocial('youtube', e.target.value)} placeholder="https://youtube.com/..." />
            </div>
            <div>
              <Label>Twitter/X</Label>
              <Input value={settings.social_links?.twitter || ''} onChange={e => updateSocial('twitter', e.target.value)} placeholder="https://twitter.com/..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsTab;
