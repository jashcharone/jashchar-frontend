import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, LayoutTemplate } from 'lucide-react';
import { cmsEditorService } from '@/services/cmsEditorService';

const LayoutTab = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({
    header_style: 'classic',
    layout_variant: 'simple',
    card_style: 'bordered'
  });

  useEffect(() => {
    if (branchId) loadSettings();
  }, [branchId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await cmsEditorService.getSettings(branchId);
      if (data && data.layout_options) {
        setOptions(prev => ({ ...prev, ...data.layout_options }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await cmsEditorService.updateSettings(branchId, { layout_options: options });
      toast({ title: 'Layout Saved', description: 'Website layout updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, val) => setOptions(prev => ({ ...prev, [key]: val }));

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 p-4 max-w-4xl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center"><LayoutTemplate className="mr-2 h-5 w-5" /> Visual Layout Options</h3>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <div className="space-y-2">
            <Label>Header Style</Label>
            <Select value={options.header_style} onValueChange={(v) => handleChange('header_style', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Classic (Logo Left, Menu Right)</SelectItem>
                <SelectItem value="centered">Centered (Logo Center, Menu Below)</SelectItem>
                <SelectItem value="minimal">Minimal (Hamburger Menu)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Homepage Variant</Label>
            <Select value={options.layout_variant} onValueChange={(v) => handleChange('layout_variant', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple / Clean</SelectItem>
                <SelectItem value="rich">Rich / Modern (Glassmorphism)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Card Style</Label>
            <Select value={options.card_style} onValueChange={(v) => handleChange('card_style', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bordered">Bordered (Classic)</SelectItem>
                <SelectItem value="glass">Glass / Translucent</SelectItem>
                <SelectItem value="flat">Flat (Minimal)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg border flex items-center justify-center text-muted-foreground text-sm">
          <p>Layout preview coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default LayoutTab;
