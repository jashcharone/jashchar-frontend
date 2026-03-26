import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const GeneralTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagline, setTagline] = useState('');
  const [visibility, setVisibility] = useState({
    hero: true,
    features: true,
    stats: true,
    testimonials: true,
    news: true,
    events: true,
    gallery: true,
    notices: true,
    contact: true
  });

  useEffect(() => {
    if (branchId) loadSettings();
  }, [branchId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getSettings(branchId);
      if (data) {
        setTagline(data.tagline || '');
        if (data.home_sections_visibility) {
          setVisibility(prev => ({ ...prev, ...data.home_sections_visibility }));
        }
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await cmsEditorService.updateSettings(branchId, {
        tagline,
        home_sections_visibility: visibility
      });
      toast({ title: 'Settings Saved', description: 'Homepage visibility updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key) => setVisibility(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 p-4 max-w-4xl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">General Homepage Settings</h3>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
        </Button>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-lg border">
        <div>
          <Label>School Tagline / Slogan</Label>
          <Input 
            value={tagline} 
            onChange={(e) => setTagline(e.target.value)} 
            placeholder="e.g. Excellence in Education" 
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">Displayed prominently on the homepage hero section.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(visibility).map(key => (
          <div key={key} className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <Label className="capitalize cursor-pointer" htmlFor={`toggle-${key}`}>Show {key} Section</Label>
            <Switch 
              id={`toggle-${key}`}
              checked={visibility[key]} 
              onCheckedChange={() => toggle(key)} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneralTab;
