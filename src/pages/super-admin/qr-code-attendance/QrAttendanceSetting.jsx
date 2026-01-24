import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Settings, Camera, CheckCircle2 } from 'lucide-react';

const QrAttendanceSetting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    auto_attendance: true,
    selected_camera: 'default'
  });

  const branchId = user?.profile?.branch_id;

  useEffect(() => {
    const fetchSettings = async () => {
      if (!branchId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('qr_code_settings')
          .select('*')
          .eq('branch_id', branchId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setSettings({
            auto_attendance: data.auto_attendance,
            selected_camera: data.selected_camera
          });
        }
        // If data is null (no settings found), the component will use the default state values.
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading settings',
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [branchId, toast]);

  const handleSave = async () => {
    if (!branchId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('qr_code_settings')
        .upsert({
          branch_id: branchId,
          auto_attendance: settings.auto_attendance,
          selected_camera: settings.selected_camera
        }, {
          onConflict: 'branch_id'
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'QR code attendance settings saved successfully.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving settings',
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">QR Code Attendance Settings</h1>
          <p className="text-muted-foreground mt-2">Configure QR code scanning preferences</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Configure basic QR code attendance options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-attendance">Auto Mark Attendance</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically mark attendance when QR code is scanned
                  </p>
                </div>
                <Switch
                  id="auto-attendance"
                  checked={settings.auto_attendance}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, auto_attendance: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="camera-select">Camera Selection</Label>
                <Select 
                  value={settings.selected_camera} 
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, selected_camera: value }))
                  }
                >
                  <SelectTrigger id="camera-select">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Camera</SelectItem>
                    <SelectItem value="front">Front Camera</SelectItem>
                    <SelectItem value="back">Back Camera</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose which camera to use for QR code scanning
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Camera Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Preview
              </CardTitle>
              <CardDescription>Test your camera settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed mb-4">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Camera preview will appear here</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" disabled>
                <Camera className="mr-2 h-4 w-4" />
                Test Camera
              </Button>
            </CardContent>
          </Card>

          {/* Current Configuration */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
              <CardDescription>Review your QR code attendance settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Auto Attendance</p>
                      <p className="text-sm text-muted-foreground">
                        {settings.auto_attendance ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Selected Camera</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {settings.selected_camera}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
              <li>Enable "Auto Mark Attendance" to automatically record attendance when QR codes are scanned</li>
              <li>Select your preferred camera (front or back) for scanning</li>
              <li>Test the camera preview to ensure it's working correctly</li>
              <li>Click "Save Settings" to apply your configuration</li>
              <li>Navigate to the QR Attendance page to start scanning</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QrAttendanceSetting;
