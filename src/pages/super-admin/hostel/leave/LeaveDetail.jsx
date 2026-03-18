import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

const statusColors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-700', checked_out: 'bg-blue-100 text-blue-700', checked_in: 'bg-purple-100 text-purple-700' };
const leaveTypes = { home_visit: '🏠 Home Visit', medical: '🏥 Medical', emergency: '🚨 Emergency', festival: '🎉 Festival', personal: '👤 Personal', other: '📋 Other' };

export default function LeaveDetail() {
    const { currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/leave' : `/${location.pathname.split('/')[1]}/hostel/leave`;

    const [leave, setLeave] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (selectedBranch?.id && id) fetchLeave(); }, [selectedBranch?.id, id]);

    const fetchLeave = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/hostel-leave/leave/${id}`, { params: { branchId: selectedBranch.id, sessionId: currentSessionId } });
            setLeave(res.data?.data);
        } catch (err) { console.error(err); toast.error('Failed to load leave details'); }
        setLoading(false);
    };

    const handleAction = async (action) => {
        try {
            await api.put(`/hostel-leave/leave/${id}/${action}`, { branchId: selectedBranch.id });
            toast.success(`Leave ${action} successfully`);
            fetchLeave();
        } catch (err) { toast.error(`Failed to ${action}`); }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!leave) return <div className="p-6 text-center text-red-500">Leave request not found</div>;

    const fromDate = new Date(leave.from_date);
    const toDate = new Date(leave.to_date);
    const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(basePath)}>← Back</Button>
                    <h1 className="text-2xl font-bold">Leave Request Details</h1>
                </div>
                <Badge className={`${statusColors[leave.status]} text-base px-3 py-1`}>{leave.status.replace(/_/g, ' ').toUpperCase()}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Student & Leave Info</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-500">Student:</span><p className="font-bold text-lg">{leave.students?.first_name} {leave.students?.last_name}</p></div>
                            <div><span className="text-gray-500">Hostel:</span><p className="font-medium">{leave.hostels?.name || '-'}</p></div>
                            <div><span className="text-gray-500">Leave Type:</span><p>{leaveTypes[leave.leave_type] || leave.leave_type}</p></div>
                            <div><span className="text-gray-500">Duration:</span><p className="font-bold">{days} day{days !== 1 ? 's' : ''}</p></div>
                            <div><span className="text-gray-500">From:</span><p className="font-medium">{formatDate(leave.from_date)}</p></div>
                            <div><span className="text-gray-500">To:</span><p className="font-medium">{formatDate(leave.to_date)}</p></div>
                            {leave.destination && <div className="col-span-2"><span className="text-gray-500">Destination:</span><p>{leave.destination}</p></div>}
                            {leave.reason && <div className="col-span-2"><span className="text-gray-500">Reason:</span><p className="bg-gray-50 p-2 rounded">{leave.reason}</p></div>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Pickup Person</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4 text-sm">
                            <div><span className="text-gray-500">Name:</span><p className="font-medium">{leave.pickup_person_name || 'Not specified'}</p></div>
                            <div><span className="text-gray-500">Phone:</span><p>{leave.pickup_person_phone || '-'}</p></div>
                            <div><span className="text-gray-500">Relation:</span><p>{leave.pickup_person_relation || '-'}</p></div>
                            {leave.emergency_contact && <div><span className="text-gray-500">Emergency Contact:</span><p>{leave.emergency_contact}</p></div>}
                        </CardContent>
                    </Card>

                    {/* Tracking */}
                    <Card>
                        <CardHeader><CardTitle>📋 Tracking</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-gray-400" />
                                <p>Applied: {formatDateTime(leave.created_at)}</p>
                            </div>
                            {leave.approved_at && (
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-green-500" />
                                    <p>Approved: {formatDateTime(leave.approved_at)}</p>
                                </div>
                            )}
                            {leave.rejected_at && (
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-red-500" />
                                    <p>Rejected: {formatDateTime(leave.rejected_at)} — {leave.rejection_reason}</p>
                                </div>
                            )}
                            {leave.actual_checkout_at && (
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                                    <p>Checked Out: {formatDateTime(leave.actual_checkout_at)}</p>
                                </div>
                            )}
                            {leave.actual_checkin_at && (
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                                    <p>Checked In: {formatDateTime(leave.actual_checkin_at)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {leave.status === 'pending' && (
                                <>
                                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleAction('approve')}>✅ Approve</Button>
                                    <Button className="w-full" variant="destructive" onClick={() => handleAction('reject')}>❌ Reject</Button>
                                </>
                            )}
                            {leave.status === 'approved' && (
                                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleAction('checkout')}>🚪 Mark Checkout</Button>
                            )}
                            {leave.status === 'checked_out' && (
                                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleAction('checkin')}>🏠 Mark Check-in</Button>
                            )}
                            {['pending', 'approved'].includes(leave.status) && (
                                <Button className="w-full" variant="outline" onClick={() => handleAction('cancel')}>🚫 Cancel</Button>
                            )}
                        </CardContent>
                    </Card>

                    {leave.parent_notified && (
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-4 text-center">
                                <p className="text-green-700 font-medium">✅ Parent Notified</p>
                                {leave.parent_notified_at && <p className="text-xs text-green-600">{formatDateTime(leave.parent_notified_at)}</p>}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
