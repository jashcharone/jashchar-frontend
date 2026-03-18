import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDate } from '@/utils/dateUtils';

const conditionColors = { new: 'bg-green-100 text-green-700', good: 'bg-blue-100 text-blue-700', fair: 'bg-yellow-100 text-yellow-700', damaged: 'bg-red-100 text-red-700', condemned: 'bg-gray-100 text-gray-700' };
const categoryLabels = { furniture: '🪑 Furniture', electronics: '💡 Electronics', bedding: '🛏️ Bedding', plumbing: '🔧 Plumbing', kitchen: '🍳 Kitchen', sports: '⚽ Sports', cleaning: '🧹 Cleaning', electrical: '⚡ Electrical', safety: '🔥 Safety', storage: '📦 Storage', bathroom: '🚿 Bathroom', lighting: '💡 Lighting', cooling: '❄️ Cooling', other: '📋 Other' };

export default function AssetManagement() {
    const { currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/assets' : `/${location.pathname.split('/')[1]}/hostel/assets`;

    const [assets, setAssets] = useState([]);
    const [stats, setStats] = useState(null);
    const [hostels, setHostels] = useState([]);
    const [filters, setFilters] = useState({ hostel: 'all', category: 'all', condition: 'all', search: '' });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const limit = 15;

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (selectedBranch?.id) { fetchAssets(); fetchStats(); } }, [selectedBranch?.id, currentSessionId, page, filters]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId, page, limit };
            if (filters.hostel !== 'all') params.hostelId = filters.hostel;
            if (filters.category !== 'all') params.category = filters.category;
            if (filters.condition !== 'all') params.condition = filters.condition;
            if (filters.search) params.search = filters.search;
            const res = await api.get('/hostel-assets', { params });
            setAssets(res.data?.data || []);
            setTotal(res.data?.total || 0);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchStats = async () => {
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId };
            if (filters.hostel !== 'all') params.hostelId = filters.hostel;
            const res = await api.get('/hostel-assets/stats', { params });
            setStats(res.data?.data);
        } catch (err) { console.error(err); }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">🏗️ Asset Management</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`${basePath}/damaged`)}>⚠️ Damaged</Button>
                    <Button variant="outline" onClick={() => navigate(`${basePath}/report`)}>📊 Report</Button>
                    <Button onClick={() => navigate(`${basePath}/add`)}>+ Add Asset</Button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{stats.totalAssets}</p><p className="text-sm text-gray-500">Total Assets</p></CardContent></Card>
                    <Card className="border-green-200 bg-green-50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-700">{stats.byCondition?.good || 0}</p><p className="text-sm text-green-600">Good</p></CardContent></Card>
                    <Card className="border-yellow-200 bg-yellow-50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-yellow-700">{stats.byCondition?.fair || 0}</p><p className="text-sm text-yellow-600">Fair</p></CardContent></Card>
                    <Card className="border-red-200 bg-red-50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-red-700">{stats.byCondition?.damaged || 0}</p><p className="text-sm text-red-600">Damaged</p></CardContent></Card>
                    <Card className="border-purple-200 bg-purple-50"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-purple-700">₹{Number(stats.totalValue || 0).toLocaleString('en-IN')}</p><p className="text-sm text-purple-600">Total Value</p></CardContent></Card>
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
                <Select value={filters.category} onValueChange={v => { setFilters(f => ({ ...f, category: v })); setPage(1); }}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.keys(categoryLabels).map(c => <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.condition} onValueChange={v => { setFilters(f => ({ ...f, condition: v })); setPage(1); }}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Conditions" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Conditions</SelectItem>
                        {Object.keys(conditionColors).map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Input placeholder="Search by name or code..." className="w-[200px]" value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left p-3">Asset Code</th>
                            <th className="text-left p-3">Name</th>
                            <th className="text-left p-3">Category</th>
                            <th className="text-left p-3">Hostel</th>
                            <th className="text-left p-3">Room</th>
                            <th className="text-left p-3">Condition</th>
                            <th className="text-right p-3">Value</th>
                            <th className="text-left p-3">Purchase Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : assets.length === 0 ? (
                            <tr><td colSpan={8} className="p-8 text-center text-gray-500">No assets found</td></tr>
                        ) : assets.map(a => (
                            <tr key={a.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`${basePath}/${a.id}`)}>
                                <td className="p-3 font-mono text-blue-600">{a.asset_code}</td>
                                <td className="p-3 font-medium">{a.asset_name}</td>
                                <td className="p-3">{categoryLabels[a.asset_category] || a.asset_category}</td>
                                <td className="p-3">{a.hostels?.name || '-'}</td>
                                <td className="p-3">{a.hostel_rooms?.room_number || '-'}</td>
                                <td className="p-3"><Badge className={conditionColors[a.condition]}>{a.condition}</Badge></td>
                                <td className="p-3 text-right">₹{Number(a.purchase_cost || 0).toLocaleString('en-IN')}</td>
                                <td className="p-3">{a.purchase_date ? formatDate(a.purchase_date) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Showing {((page-1)*limit)+1}-{Math.min(page*limit, total)} of {total}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
