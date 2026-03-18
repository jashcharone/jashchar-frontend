import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatDateTime, formatDate } from '@/utils/dateUtils';

const statusColors = { open: 'bg-blue-100 text-blue-800', assigned: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-orange-100 text-orange-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800', reopened: 'bg-red-100 text-red-800' };
const priorityColors = { low: 'bg-gray-100 text-gray-700', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };
const actionIcons = { created: '📝', assigned: '👤', status_change: '🔄', comment: '💬', escalated: '⚠️', resolved: '✅' };

export default function ComplaintDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [complaint, setComplaint] = useState(null);
    const [comment, setComment] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [statusComment, setStatusComment] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

    useEffect(() => {
        if (selectedBranch?.id && id) fetchComplaint();
    }, [selectedBranch?.id, id]);

    const fetchComplaint = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/hostel-complaints/${id}`, { params: { branchId: selectedBranch.id } });
            setComplaint(res.data?.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        try {
            await api.post(`/hostel-complaints/${id}/comment`, { comment }, { params: { branchId: selectedBranch.id } });
            setComment('');
            fetchComplaint();
        } catch (err) { console.error(err); }
    };

    const handleStatusChange = async () => {
        if (!newStatus) return;
        try {
            await api.put(`/hostel-complaints/${id}/status`, { status: newStatus, comment: statusComment }, { params: { branchId: selectedBranch.id } });
            setNewStatus('');
            setStatusComment('');
            setDialogOpen(false);
            fetchComplaint();
        } catch (err) { console.error(err); }
    };

    const handleResolve = async () => {
        try {
            await api.put(`/hostel-complaints/${id}/resolve`, { resolution_notes: resolutionNotes }, { params: { branchId: selectedBranch.id } });
            setResolutionNotes('');
            setResolveDialogOpen(false);
            fetchComplaint();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!complaint) return <div className="p-6 text-center text-gray-500">Complaint not found</div>;

    const slaBreached = complaint.sla_deadline && new Date(complaint.sla_deadline) < new Date() && !['resolved', 'closed'].includes(complaint.status);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">🎫 {complaint.ticket_number}</h1>
                    <p className="text-gray-500">{complaint.title}</p>
                </div>
                <div className="flex gap-2">
                    {!['resolved', 'closed'].includes(complaint.status) && (
                        <>
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild><Button variant="outline">Change Status</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Change Status</DialogTitle></DialogHeader>
                                    <div className="space-y-4">
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                {['open', 'assigned', 'in_progress', 'resolved', 'closed'].map(s => (
                                                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Textarea placeholder="Comment (optional)" value={statusComment} onChange={e => setStatusComment(e.target.value)} />
                                        <Button onClick={handleStatusChange} disabled={!newStatus}>Update Status</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                                <DialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700">✅ Resolve</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Resolve Complaint</DialogTitle></DialogHeader>
                                    <div className="space-y-4">
                                        <Textarea placeholder="Resolution notes..." value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={4} />
                                        <Button onClick={handleResolve} className="bg-green-600">Mark Resolved</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Complaint Details</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-gray-700">{complaint.description}</p>
                            {complaint.photo_urls?.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {complaint.photo_urls.map((url, i) => (
                                        <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-24 h-24 object-cover rounded border" />
                                    ))}
                                </div>
                            )}
                            {complaint.resolution_notes && (
                                <div className="bg-green-50 p-3 rounded border border-green-200">
                                    <p className="text-sm font-medium text-green-700">Resolution:</p>
                                    <p className="text-sm">{complaint.resolution_notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Activity Timeline</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(complaint.history || []).map((h, i) => (
                                    <div key={h.id || i} className="flex gap-3 items-start border-l-2 border-gray-200 pl-4 pb-3">
                                        <span className="text-lg">{actionIcons[h.action] || '📌'}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium capitalize">{h.action.replace(/_/g, ' ')}</p>
                                            {h.comment && <p className="text-sm text-gray-600">{h.comment}</p>}
                                            {h.old_value && h.new_value && (
                                                <p className="text-xs text-gray-500">{h.old_value} → {h.new_value}</p>
                                            )}
                                            <p className="text-xs text-gray-400">{formatDateTime(h.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Comment */}
                            <div className="mt-4 flex gap-2">
                                <Textarea placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} rows={2} className="flex-1" />
                                <Button onClick={handleAddComment} disabled={!comment.trim()} size="sm">Post</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Status</span><Badge className={statusColors[complaint.status]}>{complaint.status?.replace(/_/g, ' ')}</Badge></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Priority</span><Badge className={priorityColors[complaint.priority]}>{complaint.priority}</Badge></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Category</span><span className="text-sm capitalize">{complaint.category?.replace(/_/g, ' ')}</span></div>
                            {complaint.sub_category && <div className="flex justify-between"><span className="text-sm text-gray-500">Sub-category</span><span className="text-sm capitalize">{complaint.sub_category?.replace(/_/g, ' ')}</span></div>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <p className="text-sm font-medium">Student</p>
                            <p className="text-sm">{complaint.student?.first_name} {complaint.student?.last_name}</p>
                            <p className="text-xs text-gray-500">Adm: {complaint.student?.admission_number}</p>
                            <p className="text-sm font-medium mt-2">Location</p>
                            <p className="text-sm">{complaint.hostel?.name} - Room {complaint.room?.room_number}</p>
                        </CardContent>
                    </Card>

                    <Card className={slaBreached ? 'border-red-300 bg-red-50' : ''}>
                        <CardContent className="p-4 space-y-2">
                            <p className="text-sm font-medium">SLA Deadline</p>
                            {complaint.sla_deadline ? (
                                <>
                                    <p className={`text-sm font-semibold ${slaBreached ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatDateTime(complaint.sla_deadline)}
                                    </p>
                                    {slaBreached && <Badge className="bg-red-500 text-white">⚠️ SLA BREACHED</Badge>}
                                </>
                            ) : <p className="text-sm text-gray-500">Not set</p>}
                            <p className="text-sm font-medium mt-2">Created</p>
                            <p className="text-sm">{formatDateTime(complaint.created_at)}</p>
                            {complaint.resolved_at && (
                                <>
                                    <p className="text-sm font-medium mt-2">Resolved</p>
                                    <p className="text-sm">{formatDateTime(complaint.resolved_at)}</p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {complaint.student_satisfaction && (
                        <Card className="border-yellow-200 bg-yellow-50">
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl">{'⭐'.repeat(complaint.student_satisfaction)}</p>
                                <p className="text-sm text-gray-600">Student Satisfaction</p>
                                {complaint.student_feedback && <p className="text-xs mt-1 italic">"{complaint.student_feedback}"</p>}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
