import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDate } from '@/utils/dateUtils';

const statusColors = { pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400', approved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400', rejected: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400', cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', checked_out: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400', checked_in: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' };
const leaveTypes = { home_visit: '🏠 Home Visit', medical: '🏥 Medical', emergency: '🚨 Emergency', festival: '🎉 Festival', personal: '👤 Personal', other: '📋 Other' };

export default function LeaveManagement() {
    const { currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/leave' : `/${location.pathname.split('/')[1]}/hostel/leave`;

    const [leaves, setLeaves] = useState([]);
    const [stats, setStats] = useState(null);
    const [hostels, setHostels] = useState([]);
    const [filters, setFilters] = useState({ hostel: 'all', status: 'all', leaveType: 'all' });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const limit = 15;

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (selectedBranch?.id) { fetchLeaves(); fetchStats(); } }, [selectedBranch?.id, currentSessionId, page, filters]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId, page, limit };
            if (filters.hostel !== 'all') params.hostelId = filters.hostel;
            if (filters.status !== 'all') params.status = filters.status;
            if (filters.leaveType !== 'all') params.leaveType = filters.leaveType;
            const res = await api.get('/hostel-leave/leave', { params });
            setLeaves(res.data?.data || []);
            setTotal(res.data?.total || 0);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchStats = async () => {
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId };
            if (filters.hostel !== 'all') params.hostelId = filters.hostel;
            const res = await api.get('/hostel-leave/leave/stats', { params });
            setStats(res.data?.data);
        } catch (err) { console.error(err); }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">🏠 Leave Management</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`${basePath}/on-leave-today`)}>📋 On Leave Today</Button>
                    <Button variant="outline" onClick={() => navigate(`${basePath}/approvals`)}>✅ Approvals</Button>
                    <Button onClick={() => navigate(`${basePath}/apply`)}>+ Apply Leave</Button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
                    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{stats.byStatus?.pending || 0}</p><p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p></CardContent></Card>
                    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.byStatus?.approved || 0}</p><p className="text-sm text-green-600 dark:text-green-400">Approved</p></CardContent></Card>
                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.byStatus?.checked_out || 0}</p><p className="text-sm text-blue-600 dark:text-blue-400">Checked Out</p></CardContent></Card>
                    <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{stats.onLeaveToday}</p><p className="text-sm text-purple-600 dark:text-purple-400">On Leave Today</p></CardContent></Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <Select value={filters.hostel} onValueChange={v => { setFilters(f => ({ ...f, hostel: v })); setPage(1); }}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Hostels" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Hostels</SelectItem>
                        {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={v => { setFilters(f => ({ ...f, status: v })); setPage(1); }}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.keys(statusColors).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.leaveType} onValueChange={v => { setFilters(f => ({ ...f, leaveType: v })); setPage(1); }}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(leaveTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                        <tr>
                            <th className="text-left p-3">Student</th>
                            <th className="text-left p-3">Hostel</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-left p-3">From</th>
                            <th className="text-left p-3">To</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Applied</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                        ) : leaves.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No leave requests found</td></tr>
                        ) : leaves.map(l => (
                            <tr key={l.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`${basePath}/${l.id}`)}>
                                <td className="p-3 font-medium">{l.students?.first_name} {l.students?.last_name}</td>
                                <td className="p-3">{l.hostels?.name || '-'}</td>
                                <td className="p-3">{leaveTypes[l.leave_type] || l.leave_type}</td>
                                <td className="p-3">{formatDate(l.from_date)}</td>
                                <td className="p-3">{formatDate(l.to_date)}</td>
                                <td className="p-3"><Badge className={statusColors[l.status]}>{l.status.replace(/_/g, ' ')}</Badge></td>
                                <td className="p-3 text-muted-foreground">{formatDate(l.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Showing {((page-1)*limit)+1}-{Math.min(page*limit, total)} of {total}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
