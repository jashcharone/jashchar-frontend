import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';

const conditionColors = { new: 'bg-green-100 text-green-700', good: 'bg-blue-100 text-blue-700', fair: 'bg-yellow-100 text-yellow-700', damaged: 'bg-red-100 text-red-700', condemned: 'bg-gray-100 text-gray-700' };
const maintenanceTypes = ['repair', 'replacement', 'inspection', 'cleaning', 'upgrade'];

export default function AssetDetail() {
    const { currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/assets' : `/${location.pathname.split('/')[1]}/hostel/assets`;

    const [asset, setAsset] = useState(null);
    const [maintenanceLogs, setMaintenanceLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMaintenance, setShowMaintenance] = useState(false);
    const [maintenanceForm, setMaintenanceForm] = useState({ maintenance_type: 'repair', description: '', cost: '', performed_by: '', maintenance_date: new Date().toISOString().split('T')[0] });
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (selectedBranch?.id && id) { fetchAsset(); fetchMaintenance(); } }, [selectedBranch?.id, id]);

    const fetchAsset = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/hostel-assets/${id}`, { params: { branchId: selectedBranch.id, sessionId: currentSessionId } });
            setAsset(res.data?.data);
        } catch (err) { console.error(err); toast.error('Failed to load asset'); }
        setLoading(false);
    };

    const fetchMaintenance = async () => {
        try {
            const res = await api.get(`/hostel-assets/${id}/maintenance`, { params: { branchId: selectedBranch.id, sessionId: currentSessionId } });
            setMaintenanceLogs(res.data?.data || []);
        } catch (err) { console.error(err); }
    };

    const handleAddMaintenance = async () => {
        if (!maintenanceForm.description) { toast.error('Description required'); return; }
        setSaving(true);
        try {
            await api.post(`/hostel-assets/${id}/maintenance`, {
                ...maintenanceForm,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                cost: maintenanceForm.cost ? Number(maintenanceForm.cost) : null
            });
            toast.success('Maintenance log added');
            setShowMaintenance(false);
            setMaintenanceForm({ maintenance_type: 'repair', description: '', cost: '', performed_by: '', maintenance_date: new Date().toISOString().split('T')[0] });
            fetchAsset();
            fetchMaintenance();
        } catch (err) { toast.error('Failed to add maintenance log'); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to deactivate this asset?')) return;
        try {
            await api.delete(`/hostel-assets/${id}`, { params: { branchId: selectedBranch.id } });
            toast.success('Asset deactivated');
            navigate(basePath);
        } catch (err) { toast.error('Failed to delete asset'); }
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (!asset) return <div className="p-6 text-center text-red-500">Asset not found</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(basePath)}>← Back</Button>
                    <div>
                        <h1 className="text-2xl font-bold">{asset.asset_name}</h1>
                        <p className="text-sm text-gray-500 font-mono">{asset.asset_code}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`${basePath}/edit/${id}`)}>✏️ Edit</Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>Deactivate</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Asset Information</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-500">Category:</span><p className="font-medium capitalize">{asset.asset_category}</p></div>
                            <div><span className="text-gray-500">Condition:</span><p><Badge className={conditionColors[asset.condition]}>{asset.condition}</Badge></p></div>
                            <div><span className="text-gray-500">Hostel:</span><p className="font-medium">{asset.hostels?.name || '-'}</p></div>
                            <div><span className="text-gray-500">Room:</span><p className="font-medium">{asset.hostel_rooms?.room_number || 'Common Area'}</p></div>
                            <div><span className="text-gray-500">Brand:</span><p>{asset.brand || '-'}</p></div>
                            <div><span className="text-gray-500">Model:</span><p>{asset.model_number || '-'}</p></div>
                            <div><span className="text-gray-500">Serial Number:</span><p className="font-mono">{asset.serial_number || '-'}</p></div>
                            <div><span className="text-gray-500">Quantity:</span><p>{asset.quantity}</p></div>
                            {asset.description && <div className="col-span-2"><span className="text-gray-500">Description:</span><p>{asset.description}</p></div>}
                        </CardContent>
                    </Card>

                    {/* Maintenance History */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>🔧 Maintenance History</CardTitle>
                            <Button size="sm" onClick={() => setShowMaintenance(true)}>+ Add Log</Button>
                        </CardHeader>
                        <CardContent>
                            {maintenanceLogs.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No maintenance records</p>
                            ) : (
                                <div className="space-y-3">
                                    {maintenanceLogs.map(log => (
                                        <div key={log.id} className="border rounded p-3">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline">{log.maintenance_type}</Badge>
                                                <span className="text-xs text-gray-500">{formatDate(log.maintenance_date)}</span>
                                            </div>
                                            <p className="text-sm mt-1">{log.description}</p>
                                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                {log.cost && <span>Cost: ₹{Number(log.cost).toLocaleString('en-IN')}</span>}
                                                {log.performed_by && <span>By: {log.performed_by}</span>}
                                                <Badge size="sm" variant={log.status === 'completed' ? 'default' : 'outline'}>{log.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Purchase Info</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div><span className="text-gray-500">Purchase Date:</span><p>{asset.purchase_date ? formatDate(asset.purchase_date) : '-'}</p></div>
                            <div><span className="text-gray-500">Cost:</span><p className="font-bold text-lg">₹{Number(asset.purchase_cost || 0).toLocaleString('en-IN')}</p></div>
                            <div><span className="text-gray-500">Vendor:</span><p>{asset.vendor_name || '-'}</p></div>
                            <div>
                                <span className="text-gray-500">Warranty:</span>
                                {asset.warranty_expiry ? (
                                    <p className={new Date(asset.warranty_expiry) < new Date() ? 'text-red-600' : 'text-green-600'}>
                                        {formatDate(asset.warranty_expiry)} {new Date(asset.warranty_expiry) < new Date() ? '(Expired)' : '(Active)'}
                                    </p>
                                ) : <p>-</p>}
                            </div>
                            <div><span className="text-gray-500">Last Maintenance:</span><p>{asset.last_maintenance_date ? formatDate(asset.last_maintenance_date) : 'Never'}</p></div>
                            <div><span className="text-gray-500">Next Maintenance:</span><p>{asset.next_maintenance_date ? formatDate(asset.next_maintenance_date) : 'Not set'}</p></div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Maintenance Dialog */}
            <Dialog open={showMaintenance} onOpenChange={setShowMaintenance}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Maintenance Log</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Type</Label>
                            <Select value={maintenanceForm.maintenance_type} onValueChange={v => setMaintenanceForm(f => ({ ...f, maintenance_type: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{maintenanceTypes.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Date</Label>
                            <Input type="date" value={maintenanceForm.maintenance_date} onChange={e => setMaintenanceForm(f => ({ ...f, maintenance_date: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Description *</Label>
                            <Textarea value={maintenanceForm.description} onChange={e => setMaintenanceForm(f => ({ ...f, description: e.target.value }))} placeholder="What was done..." rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Cost (₹)</Label>
                                <Input type="number" min="0" value={maintenanceForm.cost} onChange={e => setMaintenanceForm(f => ({ ...f, cost: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Performed By</Label>
                                <Input value={maintenanceForm.performed_by} onChange={e => setMaintenanceForm(f => ({ ...f, performed_by: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMaintenance(false)}>Cancel</Button>
                        <Button onClick={handleAddMaintenance} disabled={saving}>{saving ? 'Saving...' : 'Add Log'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
