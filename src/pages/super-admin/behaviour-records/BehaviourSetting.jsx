import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';

const BehaviourSetting = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    student_comment: false,
    parent_comment: false
  });

  useEffect(() => {
    if (user?.user_metadata?.branch_id) {
      fetchSettings();
    }
  }, [user, selectedBranch]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('behaviour_settings')
        .select('*')
        .eq('branch_id', user.user_metadata.branch_id);

      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setSettings({
          student_comment: data.student_comment || false,
          parent_comment: data.parent_comment || false
        });
      } else {
        // Reset settings if no data found for this branch
        setSettings({
          student_comment: false,
          parent_comment: false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        branch_id: user.user_metadata.branch_id,
        branch_id: selectedBranch?.id,
        student_comment: settings.student_comment,
        parent_comment: settings.parent_comment,
        updated_at: new Date()
      };

      // Check if settings exist first to decide update vs insert
      let query = supabase
        .from('behaviour_settings')
        .select('id')
        .eq('branch_id', user.user_metadata.branch_id);

      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch.id);
      }

      const { data: existing } = await query.maybeSingle();
        
      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('behaviour_settings')
          .update(payload)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('behaviour_settings')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({ title: "Success", description: "Settings saved successfully" });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Behaviour Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Incident Comment Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Student Comment</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow students to comment on assigned incidents
                    </p>
                  </div>
                  <Switch
                    checked={settings.student_comment}
                    onCheckedChange={(checked) => handleToggle('student_comment', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Parent Comment</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow parents to comment on their child's incidents
                    </p>
                  </div>
                  <Switch
                    checked={settings.parent_comment}
                    onCheckedChange={(checked) => handleToggle('parent_comment', checked)}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Settings
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BehaviourSetting;
