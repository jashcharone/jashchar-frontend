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

export default function RequestRoomChange() {
    const { currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/room-change' : `/${location.pathname.split('/')[1]}/hostel/room-change`;

    const [hostels, setHostels] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [targetRooms, setTargetRooms] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        current_hostel_id: '', student_id: '', current_room_id: '', current_bed_number: '',
        requested_hostel_id: '', requested_room_id: '', requested_bed_number: '',
        reason: '', priority: 'medium'
    });

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (form.current_hostel_id) fetchAllocations(form.current_hostel_id); }, [form.current_hostel_id]);
    useEffect(() => { if (form.requested_hostel_id) fetchTargetRooms(form.requested_hostel_id); }, [form.requested_hostel_id]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchAllocations = async (hostelId) => {
        try {
            const res = await api.get('/hostel/allocations', { params: { branchId: selectedBranch.id, sessionId: currentSessionId, hostelId } });
            setAllocations(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchTargetRooms = async (hostelId) => {
        try {
            const res = await api.get('/hostel/rooms', { params: { branchId: selectedBranch.id, hostelId } });
            setTargetRooms(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleStudentSelect = (studentId) => {
        const alloc = allocations.find(a => a.student_id === studentId);
        if (alloc) {
            setForm(f => ({
                ...f,
                student_id: studentId,
                current_room_id: alloc.room_id || '',
                current_bed_number: alloc.bed_number || ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.student_id || !form.requested_hostel_id || !form.requested_room_id) {
            toast.error('Please fill all required fields');
            return;
        }
        setSaving(true);
        try {
            await api.post('/hostel-leave/room-change', {
                ...form,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                organization_id: organizationId
            });
            toast.success('Room change request submitted');
            navigate(basePath);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to submit request');
        }
        setSaving(false);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" onClick={() => navigate(basePath)}>← Back</Button>
                <h1 className="text-2xl font-bold">🔄 Request Room Change</h1>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Current Location */}
                <Card>
                    <CardHeader><CardTitle>📍 Current Location</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Current Hostel *</Label>
                            <Select value={form.current_hostel_id} onValueChange={v => { handleChange('current_hostel_id', v); handleChange('student_id', ''); }}>
                                <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                                <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Student *</Label>
                            <Select value={form.student_id} onValueChange={handleStudentSelect}>
                                <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                                <SelectContent>
                                    {allocations.map(a => (
                                        <SelectItem key={a.student_id} value={a.student_id}>
                                            {a.students?.first_name} {a.students?.last_name} (Room {a.hostel_rooms?.room_number})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {form.current_room_id && (
                            <div className="md:col-span-2 bg-gray-50 p-3 rounded text-sm">
                                <p>Current Room: <strong>{allocations.find(a => a.student_id === form.student_id)?.hostel_rooms?.room_number || '-'}</strong></p>
                                <p>Bed Number: <strong>{form.current_bed_number || 'N/A'}</strong></p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Requested Location */}
                <Card className="mt-4">
                    <CardHeader><CardTitle>📍 Requested Location</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Target Hostel *</Label>
                            <Select value={form.requested_hostel_id} onValueChange={v => handleChange('requested_hostel_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                                <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Target Room *</Label>
                            <Select value={form.requested_room_id} onValueChange={v => handleChange('requested_room_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                                <SelectContent>
                                    {targetRooms.map(r => (
                                        <SelectItem key={r.id} value={r.id}>Room {r.room_number} ({r.current_occupancy || 0}/{r.capacity})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Preferred Bed</Label>
                            <Input value={form.requested_bed_number} onChange={e => handleChange('requested_bed_number', e.target.value)} placeholder="e.g., B1, B2" />
                        </div>
                    </CardContent>
                </Card>

                {/* Reason & Priority */}
                <Card className="mt-4">
                    <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Priority</Label>
                            <Select value={form.priority} onValueChange={v => handleChange('priority', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Reason *</Label>
                            <Textarea value={form.reason} onChange={e => handleChange('reason', e.target.value)} placeholder="Reason for room change..." rows={4} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => navigate(basePath)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Submit Request'}</Button>
                </div>
            </form>
        </div>
    );
}
