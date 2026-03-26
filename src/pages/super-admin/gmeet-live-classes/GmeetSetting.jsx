import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';

const GmeetSetting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const branchId = user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    api_key: '',
    api_secret: '',
    use_calendar_api: false,
    parent_live_class: false
  });

  useEffect(() => {
    if (branchId) {
      fetchSettings();
    }
  }, [branchId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gmeet_settings')
        .select('*')
        .eq('branch_id', branchId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          api_key: data.api_key || '',
          api_secret: data.api_secret || '',
          use_calendar_api: data.use_calendar_api || false,
          parent_live_class: data.parent_live_class || false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.api_key || !formData.api_secret) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'API Key and Secret are required.' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('gmeet_settings')
        .upsert({
          branch_id: branchId,
          ...formData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'branch_id' });

      if (error) throw error;

      toast({ title: 'Success', description: 'Settings saved successfully.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Gmeet Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key *</Label>
                  <Input 
                    id="api_key" 
                    value={formData.api_key} 
                    onChange={(e) => handleChange('api_key', e.target.value)} 
                    placeholder="Enter Google API Key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_secret">API Secret *</Label>
                  <Input 
                    id="api_secret" 
                    type="password"
                    value={formData.api_secret} 
                    onChange={(e) => handleChange('api_secret', e.target.value)} 
                    placeholder="Enter Google API Secret"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Use Google Calendar API</Label>
                    <p className="text-sm text-muted-foreground">Enable integration with Google Calendar</p>
                  </div>
                  <Switch 
                    checked={formData.use_calendar_api} 
                    onCheckedChange={(checked) => handleChange('use_calendar_api', checked)} 
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Parent Live Class</Label>
                    <p className="text-sm text-muted-foreground">Allow parents to access live classes</p>
                  </div>
                  <Switch 
                    checked={formData.parent_live_class} 
                    onCheckedChange={(checked) => handleChange('parent_live_class', checked)} 
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Settings
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GmeetSetting;
