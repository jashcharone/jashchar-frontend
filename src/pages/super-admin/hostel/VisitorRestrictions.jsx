import React, { useState, useEffect, useCallback } from 'react';
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
import { Settings, Loader2, Save, Clock, Users, Shield } from 'lucide-react';

const VisitorRestrictions = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [form, setForm] = useState({
    male_visitors_allowed: true,
    visiting_hours_start: '09:00',
    visiting_hours_end: '17:00',
    max_visit_duration_minutes: 60,
    max_visitors_per_day: 3,
    require_approval_for_male: false,
    require_approval_for_all: false,
    weekend_visiting_hours_start: '10:00',
    weekend_visiting_hours_end: '16:00',
    is_active: true
  });

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel/list');
      if (res.data?.success) setHostels(res.data.data || []);
    } catch (err) { console.error('Error:', err); }
  }, [branchId]);

  const fetchRestrictions = useCallback(async (hostelId) => {
    if (!hostelId) return;
    setLoading(true);
    try {
      const res = await api.get(`/hostel-visitors/restrictions/${hostelId}`);
      if (res.data?.success && res.data.data) {
        setForm(res.data.data);
      } else {
        // Reset to defaults
        setForm({
          male_visitors_allowed: true,
          visiting_hours_start: '09:00',
          visiting_hours_end: '17:00',
          max_visit_duration_minutes: 60,
          max_visitors_per_day: 3,
          require_approval_for_male: false,
          require_approval_for_all: false,
          weekend_visiting_hours_start: '10:00',
          weekend_visiting_hours_end: '16:00',
          is_active: true
        });
      }
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);

  useEffect(() => {
    if (selectedHostel) fetchRestrictions(selectedHostel);
  }, [selectedHostel, fetchRestrictions]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedHostel) {
      toast({ variant: 'destructive', title: 'Select a hostel first' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/hostel-visitors/restrictions/${selectedHostel}`, form);
      if (res.data?.success) {
        toast({ title: 'Restrictions saved successfully' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">🔒 Visitor Restrictions</h1>

        {/* Hostel Selector */}
        <Card>
          <CardContent className="pt-4">
            <Label>Select Hostel</Label>
            <Select value={selectedHostel} onValueChange={setSelectedHostel}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose hostel to configure" /></SelectTrigger>
              <SelectContent>
                {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name} {h.hostel_type === 'girls' ? '(Girls)' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedHostel && !loading && (
          <>
            {/* Access Control */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Access Control</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Male Visitors</p>
                    <p className="text-xs text-muted-foreground">Disable for girls hostel restrictions</p>
                  </div>
                  <Switch checked={form.male_visitors_allowed} onCheckedChange={v => handleChange('male_visitors_allowed', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require Approval for Male Visitors</p>
                    <p className="text-xs text-muted-foreground">Male visitors need warden approval</p>
                  </div>
                  <Switch checked={form.require_approval_for_male} onCheckedChange={v => handleChange('require_approval_for_male', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require Approval for ALL Visitors</p>
                    <p className="text-xs text-muted-foreground">Every visitor needs warden approval</p>
                  </div>
                  <Switch checked={form.require_approval_for_all} onCheckedChange={v => handleChange('require_approval_for_all', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Restrictions Active</p>
                    <p className="text-xs text-muted-foreground">Enable/disable all restrictions</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={v => handleChange('is_active', v)} />
                </div>
              </CardContent>
            </Card>

            {/* Visiting Hours */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Visiting Hours</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Weekday Start</Label>
                    <Input type="time" value={form.visiting_hours_start} onChange={e => handleChange('visiting_hours_start', e.target.value)} />
                  </div>
                  <div>
                    <Label>Weekday End</Label>
                    <Input type="time" value={form.visiting_hours_end} onChange={e => handleChange('visiting_hours_end', e.target.value)} />
                  </div>
                  <div>
                    <Label>Weekend Start</Label>
                    <Input type="time" value={form.weekend_visiting_hours_start} onChange={e => handleChange('weekend_visiting_hours_start', e.target.value)} />
                  </div>
                  <div>
                    <Label>Weekend End</Label>
                    <Input type="time" value={form.weekend_visiting_hours_end} onChange={e => handleChange('weekend_visiting_hours_end', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limits */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Visit Limits</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Max Visit Duration (minutes)</Label>
                    <Input type="number" value={form.max_visit_duration_minutes} onChange={e => handleChange('max_visit_duration_minutes', parseInt(e.target.value) || 60)} min={15} max={480} />
                  </div>
                  <div>
                    <Label>Max Visitors per Student/Day</Label>
                    <Input type="number" value={form.max_visitors_per_day} onChange={e => handleChange('max_visitors_per_day', parseInt(e.target.value) || 3)} min={1} max={10} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-blue-50 dark:bg-blue-950/50">
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-2">📋 Current Settings Summary</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={form.male_visitors_allowed ? 'default' : 'destructive'}>
                    Male Visitors: {form.male_visitors_allowed ? 'Allowed' : 'Blocked'}
                  </Badge>
                  <Badge variant="outline">Hours: {form.visiting_hours_start} - {form.visiting_hours_end}</Badge>
                  <Badge variant="outline">Weekend: {form.weekend_visiting_hours_start} - {form.weekend_visiting_hours_end}</Badge>
                  <Badge variant="outline">Max Duration: {form.max_visit_duration_minutes}m</Badge>
                  <Badge variant="outline">Max/Day: {form.max_visitors_per_day}</Badge>
                  {form.require_approval_for_all && <Badge className="bg-yellow-500 dark:bg-yellow-600">All Need Approval</Badge>}
                  {!form.require_approval_for_all && form.require_approval_for_male && <Badge className="bg-yellow-500 dark:bg-yellow-600">Males Need Approval</Badge>}
                  <Badge variant={form.is_active ? 'default' : 'secondary'}>{form.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Restrictions
              </Button>
            </div>
          </>
        )}

        {loading && (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VisitorRestrictions;
