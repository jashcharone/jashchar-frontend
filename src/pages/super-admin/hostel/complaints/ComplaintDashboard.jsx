import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/dateUtils';

const statusColors = { open: 'bg-blue-100 text-blue-800', assigned: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-orange-100 text-orange-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800', reopened: 'bg-red-100 text-red-800' };
const priorityColors = { low: 'bg-gray-100 text-gray-700', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };

export default function ComplaintDashboard() {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const [stats, setStats] = useState(null);
    const [slaBreached, setSlaBreached] = useState([]);
    const [recentComplaints, setRecentComplaints] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedBranch?.id) {
            fetchHostels();
            fetchDashboardData();
        }
    }, [selectedBranch?.id, currentSessionId, selectedHostel]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId };
            if (selectedHostel !== 'all') params.hostelId = selectedHostel;

            const [statsRes, slaRes, recentRes] = await Promise.all([
                api.get('/hostel-complaints/stats', { params }),
                api.get('/hostel-complaints/sla-breached', { params }),
                api.get('/hostel-complaints', { params: { ...params, limit: 5 } })
            ]);
            setStats(statsRes.data?.data);
            setSlaBreached(slaRes.data?.data || []);
            setRecentComplaints(recentRes.data?.data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">🎫 Complaint Dashboard</h1>
                    <p className="text-gray-500">SLA-based complaint management system</p>
                </div>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Hostels" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Hostels</SelectItem>
                        {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Complaints</p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-blue-700">{(stats.byStatus?.open || 0) + (stats.byStatus?.assigned || 0) + (stats.byStatus?.in_progress || 0)}</p>
                            <p className="text-sm text-blue-600">Active</p>
                        </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-green-700">{stats.byStatus?.resolved || 0}</p>
                            <p className="text-sm text-green-600">Resolved</p>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-red-700">{stats.slaBreached}</p>
                            <p className="text-sm text-red-600">SLA Breached</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Priority Distribution */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">By Priority</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {Object.entries(stats.byPriority || {}).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <Badge className={priorityColors[key]}>{key.toUpperCase()}</Badge>
                                    <span className="font-semibold">{val}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-sm">By Category (Top 5)</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {Object.entries(stats.byCategory || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-semibold">{val}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* SLA Breached Alerts */}
            {slaBreached.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700">⚠️ SLA Breached Complaints ({slaBreached.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {slaBreached.slice(0, 5).map(c => (
                                <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded border border-red-200">
                                    <div>
                                        <span className="font-mono text-sm mr-2">{c.ticket_number}</span>
                                        <span className="font-medium">{c.title}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge className={priorityColors[c.priority]}>{c.priority}</Badge>
                                        <span className="text-xs text-gray-500">Due: {formatDate(c.sla_deadline)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Complaints */}
            <Card>
                <CardHeader><CardTitle>Recent Complaints</CardTitle></CardHeader>
                <CardContent>
                    {recentComplaints.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No complaints yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Ticket</th>
                                        <th className="text-left p-2">Title</th>
                                        <th className="text-left p-2">Student</th>
                                        <th className="text-left p-2">Category</th>
                                        <th className="text-left p-2">Priority</th>
                                        <th className="text-left p-2">Status</th>
                                        <th className="text-left p-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentComplaints.map(c => (
                                        <tr key={c.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-mono text-xs">{c.ticket_number}</td>
                                            <td className="p-2 font-medium">{c.title}</td>
                                            <td className="p-2">{c.student?.first_name} {c.student?.last_name}</td>
                                            <td className="p-2 capitalize">{c.category?.replace(/_/g, ' ')}</td>
                                            <td className="p-2"><Badge className={priorityColors[c.priority]}>{c.priority}</Badge></td>
                                            <td className="p-2"><Badge className={statusColors[c.status]}>{c.status?.replace(/_/g, ' ')}</Badge></td>
                                            <td className="p-2">{formatDate(c.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Satisfaction Score */}
            {stats && stats.avgSatisfaction > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-4xl font-bold text-yellow-700">{'⭐'.repeat(Math.round(stats.avgSatisfaction))}</p>
                        <p className="text-lg font-semibold">{stats.avgSatisfaction} / 5</p>
                        <p className="text-sm text-gray-500">Average Student Satisfaction</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
