import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Save, Clock, ArrowLeft, Settings, Shield
} from 'lucide-react';

const CurfewSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    night_curfew_time: '21:00',
    morning_wakeup_time: '06:00',
    weekend_curfew_time: '22:00',
    grace_period_minutes: 15,
    auto_notify_parent: true,
    auto_notify_warden: true,
    is_active: true
  });

  // Fetch hostels
  useEffect(() => {
    const load = async () => {
      if (!branchId) return;
      try {
        const res = await api.get('/hostel/list');
        if (res.data?.success) {
          const list = res.data.data || [];
          setHostels(list);
          if (list.length > 0) setSelectedHostel(list[0].id);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };
    load();
  }, [branchId]);

  // Fetch curfew settings for selected hostel
  const fetchSettings = useCallback(async () => {
    if (!branchId || !selectedHostel) return;
    setLoading(true);
    try {
      const res = await api.get('/hostel-attendance/curfew', {
        params: { hostelId: selectedHostel }
      });
      if (res.data?.success && res.data.data?.length > 0) {
        const s = res.data.data[0];
        setSettings(s);
        setFormData({
          night_curfew_time: s.night_curfew_time || '21:00',
          morning_wakeup_time: s.morning_wakeup_time || '06:00',
          weekend_curfew_time: s.weekend_curfew_time || '22:00',
          grace_period_minutes: s.grace_period_minutes || 15,
          auto_notify_parent: s.auto_notify_parent !== false,
          auto_notify_warden: s.auto_notify_warden !== false,
          is_active: s.is_active !== false
        });
      } else {
        setSettings(null);
        setFormData({
          night_curfew_time: '21:00',
          morning_wakeup_time: '06:00',
          weekend_curfew_time: '22:00',
          grace_period_minutes: 15,
          auto_notify_parent: true,
          auto_notify_warden: true,
          is_active: true
        });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedHostel]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Save
  const handleSave = async () => {
    if (!selectedHostel) {
      toast({ variant: 'destructive', title: 'Select a hostel' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/hostel-attendance/curfew', {
        hostel_id: selectedHostel,
        ...formData,
        grace_period_minutes: parseInt(formData.grace_period_minutes) || 15
      });
      if (res.data?.success) {
        toast({ title: '✅ Curfew Settings Saved' });
        setSettings(res.data.data);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const hostelObj = hostels.find(h => h.id === selectedHostel);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">⏰ Curfew Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure curfew times and notifications per hostel</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Hostel Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-full md:w-64">
                <label className="text-sm font-medium mb-1 block">Select Hostel</label>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                  <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                  <SelectContent>
                    {hostels.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {settings && (
                <Badge className={settings.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'}>
                  {settings.is_active ? '✅ Active' : '❌ Inactive'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Timing Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Night Curfew Time</Label>
                  <p className="text-xs text-muted-foreground mb-1">Students must return by this time on weekdays</p>
                  <Input
                    type="time"
                    value={formData.night_curfew_time}
                    onChange={e => setFormData(prev => ({ ...prev, night_curfew_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Morning Wakeup Time</Label>
                  <p className="text-xs text-muted-foreground mb-1">Morning attendance starts at this time</p>
                  <Input
                    type="time"
                    value={formData.morning_wakeup_time}
                    onChange={e => setFormData(prev => ({ ...prev, morning_wakeup_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Weekend Curfew Time</Label>
                  <p className="text-xs text-muted-foreground mb-1">Extended curfew for weekends</p>
                  <Input
                    type="time"
                    value={formData.weekend_curfew_time}
                    onChange={e => setFormData(prev => ({ ...prev, weekend_curfew_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Grace Period (minutes)</Label>
                  <p className="text-xs text-muted-foreground mb-1">Extra minutes allowed after curfew</p>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.grace_period_minutes}
                    onChange={e => setFormData(prev => ({ ...prev, grace_period_minutes: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Notifications & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Auto Notify Parent</Label>
                    <p className="text-xs text-muted-foreground">Send notification to parent on curfew violation</p>
                  </div>
                  <Switch
                    checked={formData.auto_notify_parent}
                    onCheckedChange={v => setFormData(prev => ({ ...prev, auto_notify_parent: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Auto Notify Warden</Label>
                    <p className="text-xs text-muted-foreground">Alert warden when student violates curfew</p>
                  </div>
                  <Switch
                    checked={formData.auto_notify_warden}
                    onCheckedChange={v => setFormData(prev => ({ ...prev, auto_notify_warden: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Active</Label>
                    <p className="text-xs text-muted-foreground">Enable/disable curfew enforcement</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={v => setFormData(prev => ({ ...prev, is_active: v }))}
                  />
                </div>

                {/* Visual Summary */}
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">📋 Settings Summary</h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>🏨 Hostel: <strong>{hostelObj?.name || 'Not selected'}</strong></p>
                    <p>🌙 Night: <strong>{formData.night_curfew_time}</strong> (Grace: {formData.grace_period_minutes} min)</p>
                    <p>🌅 Morning: <strong>{formData.morning_wakeup_time}</strong></p>
                    <p>🎉 Weekend: <strong>{formData.weekend_curfew_time}</strong></p>
                    <p>📱 Parent Alert: <strong>{formData.auto_notify_parent ? 'Yes' : 'No'}</strong></p>
                    <p>👮 Warden Alert: <strong>{formData.auto_notify_warden ? 'Yes' : 'No'}</strong></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CurfewSettings;
