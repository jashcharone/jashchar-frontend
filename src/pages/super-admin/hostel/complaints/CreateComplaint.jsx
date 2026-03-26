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
import { useNavigate } from 'react-router-dom';

const categories = [
    { value: 'room_maintenance', label: 'Room Maintenance' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'cleanliness', label: 'Cleanliness' },
    { value: 'food_quality', label: 'Food Quality' },
    { value: 'water_supply', label: 'Water Supply' },
    { value: 'pest_control', label: 'Pest Control' },
    { value: 'security', label: 'Security' },
    { value: 'noise', label: 'Noise' },
    { value: 'roommate_issue', label: 'Roommate Issue' },
    { value: 'wifi', label: 'WiFi / Internet' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'other', label: 'Other' }
];

export default function CreateComplaint() {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const [hostels, setHostels] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [students, setStudents] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        student_id: '', hostel_id: '', room_id: '', category: '', sub_category: '',
        title: '', description: '', priority: 'medium'
    });

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);

    useEffect(() => {
        if (form.hostel_id) {
            fetchRooms(form.hostel_id);
            fetchStudents(form.hostel_id);
        }
    }, [form.hostel_id]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchRooms = async (hostelId) => {
        try {
            const res = await api.get('/hostel/rooms', { params: { branchId: selectedBranch.id, hostelId } });
            setRooms(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchStudents = async (hostelId) => {
        try {
            const res = await api.get('/hostel/allocations', { params: { branchId: selectedBranch.id, hostelId, sessionId: currentSessionId } });
            setStudents(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.student_id || !form.hostel_id || !form.category || !form.title || !form.description) return;

        setSubmitting(true);
        try {
            await api.post('/hostel-complaints', form, { params: { branchId: selectedBranch.id, sessionId: currentSessionId } });
            navigate(-1);
        } catch (err) {
            console.error(err);
            alert('Failed to create complaint');
        }
        setSubmitting(false);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">📝 Create Complaint</h1>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Hostel *</Label>
                                <Select value={form.hostel_id} onValueChange={v => setForm(p => ({ ...p, hostel_id: v, room_id: '', student_id: '' }))}>
                                    <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                                    <SelectContent>
                                        {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Room</Label>
                                <Select value={form.room_id} onValueChange={v => setForm(p => ({ ...p, room_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                                    <SelectContent>
                                        {rooms.map(r => <SelectItem key={r.id} value={r.id}>Room {r.room_number}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Student *</Label>
                            <Select value={form.student_id} onValueChange={v => setForm(p => ({ ...p, student_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => {
                                        const student = s.student || s;
                                        return <SelectItem key={student.id} value={student.id}>{student.first_name} {student.last_name} ({student.enrollment_id})</SelectItem>;
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Category *</Label>
                                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low (7 days SLA)</SelectItem>
                                        <SelectItem value="medium">Medium (3 days SLA)</SelectItem>
                                        <SelectItem value="high">High (1 day SLA)</SelectItem>
                                        <SelectItem value="urgent">Urgent (4 hours SLA)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Title *</Label>
                            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief title of the complaint" />
                        </div>

                        <div>
                            <Label>Description *</Label>
                            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detailed description of the issue..." rows={4} />
                        </div>

                        <div>
                            <Label>Sub-category (optional)</Label>
                            <Input value={form.sub_category} onChange={e => setForm(p => ({ ...p, sub_category: e.target.value }))} placeholder="Specific sub-category if any" />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Complaint'}</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
