import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';

const leaveTypes = { home_visit: '🏠 Home Visit', medical: '🏥 Medical', emergency: '🚨 Emergency', festival: '🎉 Festival', personal: '👤 Personal', other: '📋 Other' };

export default function OnLeaveToday() {
    const { currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/leave' : `/${location.pathname.split('/')[1]}/hostel/leave`;

    const [leaves, setLeaves] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (selectedBranch?.id) fetchOnLeave(); }, [selectedBranch?.id, currentSessionId, selectedHostel]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchOnLeave = async () => {
        setLoading(true);
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId };
            if (selectedHostel !== 'all') params.hostelId = selectedHostel;
            const res = await api.get('/hostel-leave/leave/on-today', { params });
            setLeaves(res.data?.data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleCheckin = async (id) => {
        try {
            await api.put(`/hostel-leave/leave/${id}/checkin`, { branchId: selectedBranch.id });
            toast.success('Student checked in');
            fetchOnLeave();
        } catch (err) { toast.error('Failed to check in'); }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(basePath)}>← Back</Button>
                    <h1 className="text-2xl font-bold">📋 On Leave Today</h1>
                    <Badge variant="outline" className="text-lg">{leaves.length} Students</Badge>
                </div>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Hostels" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Hostels</SelectItem>
                        {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : leaves.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-gray-500">All students present today 🎉</CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leaves.map(l => (
                        <Card key={l.id} className="border-blue-200">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold">{l.students?.first_name} {l.students?.last_name}</p>
                                        <p className="text-xs text-gray-500">{l.hostels?.name}</p>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700">{leaveTypes[l.leave_type] || l.leave_type}</Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1 mb-3">
                                    <p>📅 {formatDate(l.from_date)} → {formatDate(l.to_date)}</p>
                                    {l.destination && <p>📍 {l.destination}</p>}
                                    {l.pickup_person_name && <p>👤 {l.pickup_person_name} ({l.pickup_person_phone || '-'})</p>}
                                </div>
                                {l.status === 'checked_out' && (
                                    <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleCheckin(l.id)}>
                                        🏠 Mark Check-in
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
