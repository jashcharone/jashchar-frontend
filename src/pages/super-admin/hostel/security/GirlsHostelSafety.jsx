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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, ArrowLeft, Shield, Save, RefreshCw, Lock,
  Camera, Users, Phone, Clock
} from 'lucide-react';

const GirlsHostelSafety = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [settings, setSettings] = useState({
    male_visitor_restrictions: true,
    male_visitor_allowed_hours_start: '09:00',
    male_visitor_allowed_hours_end: '17:00',
    male_visitor_requires_approval: true,
    cctv_monitoring_enabled: true,
    sos_panic_button_enabled: true,
    night_patrol_enabled: true,
    night_patrol_interval_minutes: 60,
    female_warden_mandatory: true,
    separate_entry_gate: true,
    emergency_contacts: [],
    additional_rules: {}
  });

  useEffect(() => {
    if (!branchId) return;
    api.get('/hostel/list').then(r => {
      if (r.data?.success) {
        const girlsHostels = (r.data.data || []).filter(h => h.hostel_type === 'girls' || h.hostel_type === 'female');
        setHostels(r.data.data || []);
        if (girlsHostels.length > 0) setSelectedHostel(girlsHostels[0].id);
      }
    });
  }, [branchId]);

  const fetchSettings = useCallback(async () => {
    if (!branchId || !selectedHostel) return;
    setLoading(true);
    try {
      const res = await api.get('/hostel-security/girls-safety', { params: { branchId, hostelId: selectedHostel } });
      if (res.data?.success && res.data.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      // No settings yet - use defaults
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedHostel]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!selectedHostel) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a hostel' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/hostel-security/girls-safety', {
        branchId,
        hostel_id: selectedHostel,
        ...settings
      });
      if (res.data?.success) {
        toast({ title: 'Success', description: 'Girls hostel safety settings saved!' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-pink-600" /> Girls Hostel Safety</h1>
              <p className="text-sm text-muted-foreground">Safety configurations for girls hostels</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !selectedHostel}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Settings
          </Button>
        </div>

        {/* Hostel Selection */}
        <Card>
          <CardContent className="p-4">
            <Label>Select Hostel</Label>
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="w-full md:w-80 mt-2"><SelectValue placeholder="Select hostel" /></SelectTrigger>
              <SelectContent>
                {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.hostel_name} ({h.hostel_type || 'General'})</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visitor Restrictions */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Visitor Restrictions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Male Visitor Restrictions</Label>
                  <Switch checked={settings.male_visitor_restrictions} onCheckedChange={() => toggle('male_visitor_restrictions')} />
                </div>
                {settings.male_visitor_restrictions && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-sm">Allowed From</Label>
                        <Input type="time" value={settings.male_visitor_allowed_hours_start} onChange={(e) => setSettings(p => ({ ...p, male_visitor_allowed_hours_start: e.target.value }))} />
                      </div>
                      <div><Label className="text-sm">Allowed Until</Label>
                        <Input type="time" value={settings.male_visitor_allowed_hours_end} onChange={(e) => setSettings(p => ({ ...p, male_visitor_allowed_hours_end: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Requires Approval</Label>
                      <Switch checked={settings.male_visitor_requires_approval} onCheckedChange={() => toggle('male_visitor_requires_approval')} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Security Features</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>CCTV Monitoring</Label>
                  <Switch checked={settings.cctv_monitoring_enabled} onCheckedChange={() => toggle('cctv_monitoring_enabled')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>SOS Panic Button</Label>
                  <Switch checked={settings.sos_panic_button_enabled} onCheckedChange={() => toggle('sos_panic_button_enabled')} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Separate Entry Gate</Label>
                  <Switch checked={settings.separate_entry_gate} onCheckedChange={() => toggle('separate_entry_gate')} />
                </div>
              </CardContent>
            </Card>

            {/* Night Patrol */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Night Patrol</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Night Patrol Enabled</Label>
                  <Switch checked={settings.night_patrol_enabled} onCheckedChange={() => toggle('night_patrol_enabled')} />
                </div>
                {settings.night_patrol_enabled && (
                  <div>
                    <Label className="text-sm">Patrol Interval (minutes)</Label>
                    <Input type="number" value={settings.night_patrol_interval_minutes} onChange={(e) => setSettings(p => ({ ...p, night_patrol_interval_minutes: parseInt(e.target.value) || 60 }))} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff Requirements */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Staff Requirements</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Female Warden Mandatory</Label>
                  <Switch checked={settings.female_warden_mandatory} onCheckedChange={() => toggle('female_warden_mandatory')} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GirlsHostelSafety;
