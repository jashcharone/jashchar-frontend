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
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';

const RegisterVisitor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [blacklistWarning, setBlacklistWarning] = useState(null);
  const [form, setForm] = useState({
    visitor_name: '', visitor_phone: '', visitor_relation: 'father',
    visitor_id_type: '', visitor_id_number: '',
    student_id: '', hostel_id: '',
    visit_purpose: 'meet_student', visit_notes: '',
    expected_exit_time: '', items_carried: ''
  });

  const fetchHostels = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await api.get('/hostel/list');
      if (res.data?.success) setHostels(res.data.data || []);
    } catch (err) { console.error('Error:', err); }
  }, [branchId]);

  const fetchStudents = useCallback(async (hostelId) => {
    if (!branchId || !hostelId) return;
    try {
      const res = await api.get('/hostel/allocations/list', { params: { hostelId } });
      if (res.data?.success) setStudents(res.data.data || []);
    } catch (err) { console.error('Error:', err); }
  }, [branchId]);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);

  useEffect(() => {
    if (selectedHostel) {
      fetchStudents(selectedHostel);
      setForm(prev => ({ ...prev, hostel_id: selectedHostel }));
    }
  }, [selectedHostel, fetchStudents]);

  // Check blacklist on phone change (debounced)
  useEffect(() => {
    const phone = form.visitor_phone;
    if (phone.length < 10) { setBlacklistWarning(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/hostel-visitors/blacklist');
        if (res.data?.success) {
          const found = (res.data.data || []).find(b => b.visitor_phone === phone);
          setBlacklistWarning(found ? found.reason : null);
        }
      } catch (err) { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.visitor_phone]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.visitor_name || !form.visitor_phone || !form.student_id || !form.hostel_id) {
      toast({ variant: 'destructive', title: 'Required', description: 'Fill all required fields' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/hostel-visitors/register', form);
      if (res.data?.success) {
        toast({ title: 'Visitor registered successfully' });
        navigate(-1);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || err.message });
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-2xl font-bold">👤 Register Visitor</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Visitor Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Visitor Name *</Label>
                  <Input value={form.visitor_name} onChange={e => handleChange('visitor_name', e.target.value)} placeholder="Full Name" />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input value={form.visitor_phone} onChange={e => handleChange('visitor_phone', e.target.value)} placeholder="10-digit mobile" maxLength={10} />
                  {blacklistWarning && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Blacklisted: {blacklistWarning}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Relation *</Label>
                  <Select value={form.visitor_relation} onValueChange={v => handleChange('visitor_relation', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ID Type</Label>
                  <Select value={form.visitor_id_type} onValueChange={v => handleChange('visitor_id_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aadhar">Aadhar</SelectItem>
                      <SelectItem value="pan">PAN</SelectItem>
                      <SelectItem value="driving_license">Driving License</SelectItem>
                      <SelectItem value="voter_id">Voter ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.visitor_id_type && (
                  <div>
                    <Label>ID Number</Label>
                    <Input value={form.visitor_id_number} onChange={e => handleChange('visitor_id_number', e.target.value)} placeholder="Enter ID number" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Visit Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Hostel *</Label>
                  <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                    <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                    <SelectContent>
                      {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Student *</Label>
                  <Select value={form.student_id} onValueChange={v => handleChange('student_id', v)} disabled={!selectedHostel}>
                    <SelectTrigger><SelectValue placeholder={selectedHostel ? 'Select student' : 'Select hostel first'} /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.student_id || s.id} value={s.student_id || s.id}>
                          {s.student?.first_name || s.first_name} {s.student?.last_name || s.last_name} ({s.student?.enrollment_id || s.enrollment_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Purpose *</Label>
                  <Select value={form.visit_purpose} onValueChange={v => handleChange('visit_purpose', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meet_student">Meet Student</SelectItem>
                      <SelectItem value="drop_items">Drop Items</SelectItem>
                      <SelectItem value="pickup_student">Pickup Student</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expected Exit Time</Label>
                  <Input type="datetime-local" value={form.expected_exit_time} onChange={e => handleChange('expected_exit_time', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Items Carried</Label>
                <Input value={form.items_carried} onChange={e => handleChange('items_carried', e.target.value)} placeholder="Tiffin box, Books, etc." />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.visit_notes} onChange={e => handleChange('visit_notes', e.target.value)} placeholder="Additional notes..." rows={2} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Register Visitor
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default RegisterVisitor;
