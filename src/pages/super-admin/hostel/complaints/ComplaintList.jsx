import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/dateUtils';

const statusColors = { open: 'bg-blue-100 text-blue-800', assigned: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-orange-100 text-orange-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800', reopened: 'bg-red-100 text-red-800' };
const priorityColors = { low: 'bg-gray-100 text-gray-700', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };
const categories = ['room_maintenance', 'plumbing', 'electrical', 'furniture', 'cleanliness', 'food_quality', 'water_supply', 'pest_control', 'security', 'noise', 'roommate_issue', 'wifi', 'laundry', 'other'];

export default function ComplaintList() {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const [complaints, setComplaints] = useState([]);
    const [total, setTotal] = useState(0);
    const [hostels, setHostels] = useState([]);
    const [filters, setFilters] = useState({ hostelId: 'all', status: 'all', priority: 'all', category: 'all', page: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (selectedBranch?.id) fetchComplaints(); }, [selectedBranch?.id, currentSessionId, filters]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId, page: filters.page, limit: 15 };
            if (filters.hostelId !== 'all') params.hostelId = filters.hostelId;
            if (filters.status !== 'all') params.status = filters.status;
            if (filters.priority !== 'all') params.priority = filters.priority;
            if (filters.category !== 'all') params.category = filters.category;

            const res = await api.get('/hostel-complaints', { params });
            setComplaints(res.data?.data || []);
            setTotal(res.data?.total || 0);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const totalPages = Math.ceil(total / 15);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">🎫 Complaints List</h1>
                <span className="text-sm text-gray-500">{total} total complaints</span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Select value={filters.hostelId} onValueChange={v => setFilters(p => ({ ...p, hostelId: v, page: 1 }))}>
                    <SelectTrigger><SelectValue placeholder="All Hostels" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Hostels</SelectItem>
                        {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={v => setFilters(p => ({ ...p, status: v, page: 1 }))}>
                    <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {['open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened'].map(s => (
                            <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filters.priority} onValueChange={v => setFilters(p => ({ ...p, priority: v, page: 1 }))}>
                    <SelectTrigger><SelectValue placeholder="All Priority" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        {['low', 'medium', 'high', 'urgent'].map(p => (
                            <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filters.category} onValueChange={v => setFilters(p => ({ ...p, category: v, page: 1 }))}>
                    <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : complaints.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No complaints found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left p-3">Ticket #</th>
                                        <th className="text-left p-3">Title</th>
                                        <th className="text-left p-3">Student</th>
                                        <th className="text-left p-3">Hostel</th>
                                        <th className="text-left p-3">Category</th>
                                        <th className="text-left p-3">Priority</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-left p-3">SLA</th>
                                        <th className="text-left p-3">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaints.map(c => {
                                        const slaBreached = c.sla_deadline && new Date(c.sla_deadline) < new Date() && !['resolved', 'closed'].includes(c.status);
                                        return (
                                            <tr key={c.id} className={`border-b hover:bg-gray-50 ${slaBreached ? 'bg-red-50' : ''}`}>
                                                <td className="p-3 font-mono text-xs">{c.ticket_number}</td>
                                                <td className="p-3 font-medium max-w-[200px] truncate">{c.title}</td>
                                                <td className="p-3">{c.student?.first_name} {c.student?.last_name}</td>
                                                <td className="p-3">{c.hostel?.name}</td>
                                                <td className="p-3 capitalize text-xs">{c.category?.replace(/_/g, ' ')}</td>
                                                <td className="p-3"><Badge className={priorityColors[c.priority]}>{c.priority}</Badge></td>
                                                <td className="p-3"><Badge className={statusColors[c.status]}>{c.status?.replace(/_/g, ' ')}</Badge></td>
                                                <td className="p-3">
                                                    {slaBreached ? (
                                                        <Badge className="bg-red-500 text-white">⚠️ BREACHED</Badge>
                                                    ) : c.sla_deadline ? (
                                                        <span className="text-xs text-gray-500">{formatDate(c.sla_deadline)}</span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3 text-xs">{formatDate(c.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={filters.page === 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>Previous</Button>
                    <span className="text-sm">Page {filters.page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={filters.page >= totalPages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
                </div>
            )}
        </div>
    );
}
