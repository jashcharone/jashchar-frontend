import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDate } from '@/utils/dateUtils';

const conditionColors = { damaged: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', condemned: 'bg-gray-800 text-white dark:bg-gray-700' };

export default function DamagedAssets() {
    const { currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/assets' : `/${location.pathname.split('/')[1]}/hostel/assets`;

    const [assets, setAssets] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (selectedBranch?.id) fetchDamaged(); }, [selectedBranch?.id, currentSessionId, selectedHostel]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchDamaged = async () => {
        setLoading(true);
        try {
            const params = { branchId: selectedBranch.id, sessionId: currentSessionId };
            if (selectedHostel !== 'all') params.hostelId = selectedHostel;
            const res = await api.get('/hostel-assets/damaged', { params });
            setAssets(res.data?.data || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(basePath)}>← Back</Button>
                    <h1 className="text-2xl font-bold">⚠️ Damaged & Condemned Assets</h1>
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
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading...</p>
            ) : assets.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">No damaged or condemned assets found. 🎉</CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map(a => (
                        <Card key={a.id} className="cursor-pointer hover:shadow-md border-red-200" onClick={() => navigate(`${basePath}/${a.id}`)}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-medium">{a.asset_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{a.asset_code}</p>
                                    </div>
                                    <Badge className={conditionColors[a.condition]}>{a.condition}</Badge>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p>📍 {a.hostels?.name} {a.hostel_rooms?.room_number ? `- Room ${a.hostel_rooms.room_number}` : ''}</p>
                                    <p>📂 {a.asset_category}</p>
                                    {a.purchase_cost && <p>💰 ₹{Number(a.purchase_cost).toLocaleString('en-IN')}</p>}
                                    {a.last_maintenance_date && <p>🔧 Last maintenance: {formatDate(a.last_maintenance_date)}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
