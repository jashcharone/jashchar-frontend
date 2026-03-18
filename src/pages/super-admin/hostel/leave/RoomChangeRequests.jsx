import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';

const statusColors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-gray-100 text-gray-700' };
const priorityColors = { low: 'bg-gray-100 text-gray-700', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };

export default function RoomChangeRequests() {
    const { currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/room-change' : `/${location.pathname.split('/')[1]}/hostel/room-change`;

    const [requests, setRequests] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showReject, setShowReject] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [executing, setExecuting] = useState(null);

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (selectedBranch?.id) fetchRequests(); }, [selectedBranch?.id, currentSessionId, selectedHostel, statusFilter]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId };
            if (selectedHostel !== 'all') params.hostelId = selectedHostel;
            if (statusFilter !== 'all') params.status = statusFilter;
            const res = await api.get('/hostel-leave/room-change', { params });
            setRequests(res.data?.data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleApprove = async (id) => {
        try {
            await api.put(`/hostel-leave/room-change/${id}/approve`, { branchId: selectedBranch.id });
            toast.success('Room change approved');
            fetchRequests();
        } catch (err) { toast.error('Failed to approve'); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) { toast.error('Reason required'); return; }
        try {
            await api.put(`/hostel-leave/room-change/${showReject}/reject`, { branchId: selectedBranch.id, rejection_reason: rejectReason });
            toast.success('Room change rejected');
            setShowReject(null);
            setRejectReason('');
            fetchRequests();
        } catch (err) { toast.error('Failed to reject'); }
    };

    const handleExecute = async (id) => {
        setExecuting(id);
        try {
            await api.put(`/hostel-leave/room-change/${id}/execute`, { branchId: selectedBranch.id, sessionId: currentSessionId });
            toast.success('Room change executed! Student moved successfully.');
            fetchRequests();
        } catch (err) { toast.error(err.response?.data?.error || 'Failed to execute room change'); }
        setExecuting(null);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">🔄 Room Change Requests</h1>
                <Button onClick={() => navigate(`${basePath}/new`)}>+ New Request</Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Hostels" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Hostels</SelectItem>
                        {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.keys(statusColors).map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Requests */}
            {loading ? (
                <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : requests.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-gray-500">No room change requests</CardContent></Card>
            ) : (
                <div className="space-y-4">
                    {requests.map(r => (
                        <Card key={r.id} className={r.status === 'pending' ? 'border-yellow-200' : r.status === 'approved' ? 'border-green-200' : ''}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="font-bold text-lg">{r.students?.first_name} {r.students?.last_name}</p>
                                            <Badge className={statusColors[r.status]}>{r.status}</Badge>
                                            <Badge className={priorityColors[r.priority]}>{r.priority}</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="bg-red-50 p-3 rounded border border-red-200">
                                                <p className="text-red-700 font-medium mb-1">📍 Current</p>
                                                <p>{r.current_hostel?.name || 'Unknown'}</p>
                                                <p>Room: {r.current_room?.room_number || '-'} | Bed: {r.current_bed_number || '-'}</p>
                                            </div>
                                            <div className="bg-green-50 p-3 rounded border border-green-200">
                                                <p className="text-green-700 font-medium mb-1">📍 Requested</p>
                                                <p>{r.requested_hostel?.name || 'Unknown'}</p>
                                                <p>Room: {r.requested_room?.room_number || '-'} | Bed: {r.requested_bed_number || '-'}</p>
                                            </div>
                                        </div>

                                        {r.reason && <p className="text-sm mt-2 bg-gray-50 p-2 rounded">{r.reason}</p>}
                                        <p className="text-xs text-gray-400 mt-2">Applied: {formatDate(r.created_at)}</p>
                                    </div>

                                    <div className="flex flex-col gap-2 ml-4">
                                        {r.status === 'pending' && (
                                            <>
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(r.id)}>✅ Approve</Button>
                                                <Button size="sm" variant="destructive" onClick={() => setShowReject(r.id)}>❌ Reject</Button>
                                            </>
                                        )}
                                        {r.status === 'approved' && (
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleExecute(r.id)} disabled={executing === r.id}>
                                                {executing === r.id ? '⏳ Moving...' : '🔄 Execute Move'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Reject Dialog */}
            <Dialog open={!!showReject} onOpenChange={() => { setShowReject(null); setRejectReason(''); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reject Room Change</DialogTitle></DialogHeader>
                    <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowReject(null); setRejectReason(''); }}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Reject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
