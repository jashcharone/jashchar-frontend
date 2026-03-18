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

const leaveTypes = { home_visit: '🏠 Home Visit', medical: '🏥 Medical', emergency: '🚨 Emergency', festival: '🎉 Festival', personal: '👤 Personal', other: '📋 Other' };

export default function LeaveApprovals() {
    const { currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/leave' : `/${location.pathname.split('/')[1]}/hostel/leave`;

    const [leaves, setLeaves] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showReject, setShowReject] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (selectedBranch?.id) fetchPending(); }, [selectedBranch?.id, currentSessionId, selectedHostel]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchPending = async () => {
        setLoading(true);
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId, status: 'pending' };
            if (selectedHostel !== 'all') params.hostelId = selectedHostel;
            const res = await api.get('/hostel-leave/leave', { params });
            setLeaves(res.data?.data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleApprove = async (id) => {
        try {
            await api.put(`/hostel-leave/leave/${id}/approve`, { branchId: selectedBranch.id });
            toast.success('Leave approved');
            fetchPending();
        } catch (err) { toast.error('Failed to approve'); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) { toast.error('Rejection reason required'); return; }
        try {
            await api.put(`/hostel-leave/leave/${showReject}/reject`, { branchId: selectedBranch.id, rejection_reason: rejectReason });
            toast.success('Leave rejected');
            setShowReject(null);
            setRejectReason('');
            fetchPending();
        } catch (err) { toast.error('Failed to reject'); }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(basePath)}>← Back</Button>
                    <h1 className="text-2xl font-bold">✅ Leave Approvals</h1>
                    <Badge variant="outline" className="text-lg">{leaves.length} Pending</Badge>
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
                <Card><CardContent className="py-12 text-center text-gray-500">No pending approvals 🎉</CardContent></Card>
            ) : (
                <div className="space-y-4">
                    {leaves.map(l => (
                        <Card key={l.id} className="border-yellow-200">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="font-bold text-lg">{l.students?.first_name} {l.students?.last_name}</p>
                                            <Badge className="bg-yellow-100 text-yellow-700">{leaveTypes[l.leave_type] || l.leave_type}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                                            <p>📍 {l.hostels?.name || '-'}</p>
                                            <p>📅 {formatDate(l.from_date)} → {formatDate(l.to_date)}</p>
                                            <p>👤 Pickup: {l.pickup_person_name || 'N/A'}</p>
                                            <p>📱 {l.pickup_person_phone || 'N/A'}</p>
                                        </div>
                                        {l.reason && <p className="text-sm mt-2 bg-gray-50 p-2 rounded">{l.reason}</p>}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(l.id)}>✅ Approve</Button>
                                        <Button size="sm" variant="destructive" onClick={() => setShowReject(l.id)}>❌ Reject</Button>
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
                    <DialogHeader><DialogTitle>Reject Leave Request</DialogTitle></DialogHeader>
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
