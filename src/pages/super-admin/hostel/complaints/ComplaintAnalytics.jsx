import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const priorityColors = { low: 'bg-gray-100 text-gray-700', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };

export default function ComplaintAnalytics() {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const [stats, setStats] = useState(null);
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (selectedBranch?.id) fetchStats(); }, [selectedBranch?.id, currentSessionId, selectedHostel]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId };
            if (selectedHostel !== 'all') params.hostelId = selectedHostel;
            const res = await api.get('/hostel-complaints/stats', { params });
            setStats(res.data?.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">📊 Complaint Analytics</h1>
                <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Hostels" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Hostels</SelectItem>
                        {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {stats && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-gray-500">Total</p></CardContent></Card>
                        <Card className="border-blue-200 bg-blue-50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-blue-700">{stats.byStatus?.open || 0}</p><p className="text-sm text-blue-600">Open</p></CardContent></Card>
                        <Card className="border-orange-200 bg-orange-50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-orange-700">{stats.byStatus?.in_progress || 0}</p><p className="text-sm text-orange-600">In Progress</p></CardContent></Card>
                        <Card className="border-green-200 bg-green-50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-700">{stats.byStatus?.resolved || 0}</p><p className="text-sm text-green-600">Resolved</p></CardContent></Card>
                        <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-red-700">{stats.slaBreached}</p><p className="text-sm text-red-600">SLA Breached</p></CardContent></Card>
                    </div>

                    {/* Status Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader><CardTitle className="text-sm">By Status</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(stats.byStatus || {}).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.total ? (val / stats.total * 100) : 0}%` }} />
                                            </div>
                                            <span className="text-sm font-semibold w-8 text-right">{val}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-sm">By Priority</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(stats.byPriority || {}).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <Badge className={priorityColors[key]}>{key.toUpperCase()}</Badge>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${stats.total ? (val / stats.total * 100) : 0}%` }} />
                                            </div>
                                            <span className="text-sm font-semibold w-8 text-right">{val}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(stats.byCategory || {}).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.total ? (val / stats.total * 100) : 0}%` }} />
                                            </div>
                                            <span className="text-sm font-semibold w-8 text-right">{val}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* SLA Compliance & Satisfaction */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle className="text-sm">SLA Compliance</CardTitle></CardHeader>
                            <CardContent className="text-center py-6">
                                {stats.total > 0 ? (
                                    <>
                                        <p className="text-5xl font-bold text-green-600">
                                            {((1 - stats.slaBreached / stats.total) * 100).toFixed(1)}%
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">SLA Compliance Rate</p>
                                        <p className="text-xs text-gray-400">{stats.slaBreached} breached out of {stats.total}</p>
                                    </>
                                ) : (
                                    <p className="text-gray-500">No data yet</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Student Satisfaction</CardTitle></CardHeader>
                            <CardContent className="text-center py-6">
                                {stats.avgSatisfaction > 0 ? (
                                    <>
                                        <p className="text-4xl">{'⭐'.repeat(Math.round(parseFloat(stats.avgSatisfaction)))}</p>
                                        <p className="text-3xl font-bold mt-2">{stats.avgSatisfaction} / 5</p>
                                        <p className="text-sm text-gray-500">Average Rating</p>
                                    </>
                                ) : (
                                    <p className="text-gray-500">No ratings yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
