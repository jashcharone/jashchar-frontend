import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const leaveTypes = ['home_visit', 'medical', 'family_emergency', 'festival', 'competition', 'other'];

export default function ApplyLeave() {
    const { currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/leave' : `/${location.pathname.split('/')[1]}/hostel/leave`;

    const [hostels, setHostels] = useState([]);
    const [students, setStudents] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        hostel_id: '', student_id: '', leave_type: 'home_visit',
        from_date: '', to_date: '', reason: '',
        pickup_person_name: '', pickup_person_phone: '', pickup_person_relation: '',
        destination: '', emergency_contact: ''
    });

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (form.hostel_id) fetchStudents(form.hostel_id); }, [form.hostel_id]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchStudents = async (hostelId) => {
        try {
            const res = await api.get('/hostel/allocations', { params: { branchId: selectedBranch.id, sessionId: currentSessionId, hostelId } });
            const allocs = res.data?.data || res.data || [];
            setStudents(allocs.map(a => ({ id: a.student_id, name: `${a.students?.first_name || ''} ${a.students?.last_name || ''}`.trim(), room: a.hostel_rooms?.room_number })));
        } catch (err) { console.error(err); }
    };

    const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.hostel_id || !form.student_id || !form.from_date || !form.to_date) {
            toast.error('Please fill all required fields');
            return;
        }
        if (new Date(form.from_date) > new Date(form.to_date)) {
            toast.error('From date must be before To date');
            return;
        }
        setSaving(true);
        try {
            await api.post('/hostel-leave/leave', {
                ...form,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                organization_id: organizationId
            });
            toast.success('Leave application submitted');
            navigate(basePath);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to apply leave');
        }
        setSaving(false);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" onClick={() => navigate(basePath)}>← Back</Button>
                <h1 className="text-2xl font-bold">📝 Apply for Leave</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader><CardTitle>Leave Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Hostel *</Label>
                            <Select value={form.hostel_id} onValueChange={v => handleChange('hostel_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                                <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Student *</Label>
                            <Select value={form.student_id} onValueChange={v => handleChange('student_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (Room {s.room})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Leave Type *</Label>
                            <Select value={form.leave_type} onValueChange={v => handleChange('leave_type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {leaveTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Destination</Label>
                            <Input value={form.destination} onChange={e => handleChange('destination', e.target.value)} placeholder="Where will student go?" />
                        </div>
                        <div>
                            <Label>From Date *</Label>
                            <Input type="date" value={form.from_date} onChange={e => handleChange('from_date', e.target.value)} />
                        </div>
                        <div>
                            <Label>To Date *</Label>
                            <Input type="date" value={form.to_date} onChange={e => handleChange('to_date', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Reason</Label>
                            <Textarea value={form.reason} onChange={e => handleChange('reason', e.target.value)} placeholder="Reason for leave..." rows={3} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-4">
                    <CardHeader><CardTitle>Pickup Person Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Name</Label>
                            <Input value={form.pickup_person_name} onChange={e => handleChange('pickup_person_name', e.target.value)} placeholder="Guardian/Parent name" />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input value={form.pickup_person_phone} onChange={e => handleChange('pickup_person_phone', e.target.value)} placeholder="Phone number" />
                        </div>
                        <div>
                            <Label>Relation</Label>
                            <Input value={form.pickup_person_relation} onChange={e => handleChange('pickup_person_relation', e.target.value)} placeholder="Father/Mother/Uncle etc" />
                        </div>
                        <div>
                            <Label>Emergency Contact</Label>
                            <Input value={form.emergency_contact} onChange={e => handleChange('emergency_contact', e.target.value)} placeholder="Emergency phone number" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => navigate(basePath)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Submit Leave Application'}</Button>
                </div>
            </form>
        </div>
    );
}
