import { useState, useEffect } from 'react';
import { formatDateWithMonthName } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useLocation } from 'react-router-dom';

const conditionColors = { new: 'bg-green-100 text-green-700', good: 'bg-blue-100 text-blue-700', fair: 'bg-yellow-100 text-yellow-700', damaged: 'bg-red-100 text-red-700', condemned: 'bg-gray-100 text-gray-700' };

export default function AssetReport() {
    const { currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/assets' : `/${location.pathname.split('/')[1]}/hostel/assets`;

    const [stats, setStats] = useState(null);
    const [upcoming, setUpcoming] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (selectedBranch?.id) { fetchStats(); fetchUpcoming(); } }, [selectedBranch?.id, currentSessionId, selectedHostel]);

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
            const res = await api.get('/hostel-assets/stats', { params });
            setStats(res.data?.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchUpcoming = async () => {
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId, days: 30 };
            if (selectedHostel !== 'all') params.hostelId = selectedHostel;
            const res = await api.get('/hostel-assets/upcoming-maintenance', { params });
            setUpcoming(res.data?.data || []);
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(basePath)}>← Back</Button>
                    <h1 className="text-2xl font-bold">📊 Asset Report</h1>
                </div>
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
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card><CardContent className="p-4 text-center"><p className="text-4xl font-bold">{stats.totalAssets}</p><p className="text-sm text-gray-500">Total Assets</p></CardContent></Card>
                        <Card className="border-purple-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-700">₹{Number(stats.totalValue || 0).toLocaleString('en-IN')}</p><p className="text-sm text-gray-500">Total Value</p></CardContent></Card>
                        <Card className="border-red-200"><CardContent className="p-4 text-center"><p className="text-4xl font-bold text-red-600">{(stats.byCondition?.damaged || 0) + (stats.byCondition?.condemned || 0)}</p><p className="text-sm text-gray-500">Need Attention</p></CardContent></Card>
                        <Card className="border-blue-200"><CardContent className="p-4 text-center"><p className="text-4xl font-bold text-blue-600">{upcoming.length}</p><p className="text-sm text-gray-500">Upcoming Maintenance</p></CardContent></Card>
                    </div>

                    {/* Condition Distribution */}
                    <Card>
                        <CardHeader><CardTitle>Condition Distribution</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex gap-2 flex-wrap">
                                {Object.entries(stats.byCondition || {}).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-2 border rounded-lg p-3 min-w-[120px]">
                                        <Badge className={conditionColors[key]}>{key}</Badge>
                                        <span className="text-xl font-bold">{val}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Bar visualization */}
                            <div className="mt-4 flex rounded-full h-6 overflow-hidden">
                                {Object.entries(stats.byCondition || {}).map(([key, val]) => {
                                    const pct = stats.totalAssets ? (val / stats.totalAssets * 100) : 0;
                                    const colors = { new: 'bg-green-500', good: 'bg-blue-500', fair: 'bg-yellow-500', damaged: 'bg-red-500', condemned: 'bg-gray-500' };
                                    return pct > 0 ? <div key={key} className={`${colors[key]} h-full`} style={{ width: `${pct}%` }} title={`${key}: ${val}`} /> : null;
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Breakdown */}
                    <Card>
                        <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {Object.entries(stats.byCategory || {}).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                                    <div key={cat} className="border rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold">{count}</p>
                                        <p className="text-sm text-gray-500 capitalize">{cat.replace(/_/g, ' ')}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Maintenance */}
                    {upcoming.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>🔧 Upcoming Maintenance (Next 30 Days)</CardTitle></CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left p-3">Asset</th>
                                                <th className="text-left p-3">Location</th>
                                                <th className="text-left p-3">Condition</th>
                                                <th className="text-left p-3">Next Maintenance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {upcoming.map(a => (
                                                <tr key={a.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`${basePath}/${a.id}`)}>
                                                    <td className="p-3">
                                                        <p className="font-medium">{a.asset_name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{a.asset_code}</p>
                                                    </td>
                                                    <td className="p-3">{a.hostels?.name} {a.hostel_rooms?.room_number ? `- ${a.hostel_rooms.room_number}` : ''}</td>
                                                    <td className="p-3"><Badge className={conditionColors[a.condition]}>{a.condition}</Badge></td>
                                                    <td className="p-3">{a.next_maintenance_date ? formatDateWithMonthName(a.next_maintenance_date) : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
