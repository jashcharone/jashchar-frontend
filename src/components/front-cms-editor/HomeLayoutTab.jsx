import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, LayoutTemplate } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const HomeLayoutTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState({});

  useEffect(() => {
    if (branchId) loadSettings();
  }, [branchId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getSettings(branchId);
      setSections(data?.home_sections || {
        show_about: true,
        show_academics: true,
        show_facilities: true,
        show_news: true,
        show_events: true,
        show_gallery: true,
        show_notices: true,
        show_contact: true
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load layout settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await cmsEditorService.updateSettings(branchId, { home_sections: sections });
      toast({ title: 'Success', description: 'Layout settings saved' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save layout' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sectionList = [
    { key: 'show_about', label: 'About Section' },
    { key: 'show_academics', label: 'Academics Highlights' },
    { key: 'show_facilities', label: 'Facilities Grid' },
    { key: 'show_news', label: 'Latest News' },
    { key: 'show_events', label: 'Upcoming Events' },
    { key: 'show_gallery', label: 'Photo Gallery Preview' },
    { key: 'show_notices', label: 'Notice Board' },
    { key: 'show_contact', label: 'Contact Section' },
  ];

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Homepage Layout</h3>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectionList.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
            <Label htmlFor={key} className="cursor-pointer font-medium">{label}</Label>
            <Switch 
              id={key}
              checked={sections[key] !== false} 
              onCheckedChange={() => toggleSection(key)} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeLayoutTab;
