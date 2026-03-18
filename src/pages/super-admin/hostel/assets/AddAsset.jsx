import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const categories = ['furniture','electronics','bedding','plumbing','kitchen','sports','cleaning','electrical','safety','storage','bathroom','lighting','cooling','other'];
const conditions = ['new','good','fair','damaged','condemned'];

export default function AddAsset() {
    const { currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isEdit = !!id;
    const basePath = location.pathname.includes('/super-admin/') ? '/super-admin/hostel/assets' : `/${location.pathname.split('/')[1]}/hostel/assets`;

    const [hostels, setHostels] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        hostel_id: '', room_id: '', asset_name: '', asset_category: 'furniture',
        brand: '', model_number: '', serial_number: '', condition: 'new',
        purchase_date: '', purchase_cost: '', vendor_name: '', warranty_expiry: '',
        quantity: 1, description: ''
    });

    useEffect(() => { if (selectedBranch?.id) fetchHostels(); }, [selectedBranch?.id]);
    useEffect(() => { if (form.hostel_id) fetchRooms(form.hostel_id); }, [form.hostel_id]);
    useEffect(() => { if (isEdit && selectedBranch?.id) fetchAsset(); }, [id, selectedBranch?.id]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel/hostels', { params: { branchId: selectedBranch.id } });
            setHostels(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchRooms = async (hostelId) => {
        try {
            const res = await api.get(`/hostel/rooms`, { params: { branchId: selectedBranch.id, hostelId } });
            setRooms(res.data?.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchAsset = async () => {
        try {
            const res = await api.get(`/hostel-assets/${id}`, { params: { branchId: selectedBranch.id, sessionId: currentSessionId } });
            const a = res.data?.data;
            if (a) {
                setForm({
                    hostel_id: a.hostel_id || '', room_id: a.room_id || '',
                    asset_name: a.asset_name || '', asset_category: a.asset_category || 'furniture',
                    brand: a.brand || '', model_number: a.model_number || '', serial_number: a.serial_number || '',
                    condition: a.condition || 'new',
                    purchase_date: a.purchase_date?.split('T')[0] || '', purchase_cost: a.purchase_cost || '',
                    vendor_name: a.vendor_name || '', warranty_expiry: a.warranty_expiry?.split('T')[0] || '',
                    quantity: a.quantity || 1, description: a.description || ''
                });
            }
        } catch (err) { console.error(err); toast.error('Failed to load asset'); }
    };

    const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.hostel_id || !form.asset_name || !form.asset_category) {
            toast.error('Please fill required fields');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                organization_id: organizationId,
                purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
                quantity: Number(form.quantity) || 1
            };
            if (isEdit) {
                await api.put(`/hostel-assets/${id}`, payload);
                toast.success('Asset updated');
            } else {
                await api.post('/hostel-assets', payload);
                toast.success('Asset created');
            }
            navigate(basePath);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save asset');
        }
        setSaving(false);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" onClick={() => navigate(basePath)}>← Back</Button>
                <h1 className="text-2xl font-bold">{isEdit ? 'Edit Asset' : '➕ Add New Asset'}</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader><CardTitle>Asset Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Hostel *</Label>
                            <Select value={form.hostel_id} onValueChange={v => handleChange('hostel_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                                <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Room (Optional)</Label>
                            <Select value={form.room_id} onValueChange={v => handleChange('room_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Common Area" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Common Area</SelectItem>
                                    {rooms.map(r => <SelectItem key={r.id} value={r.id}>Room {r.room_number}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Asset Name *</Label>
                            <Input value={form.asset_name} onChange={e => handleChange('asset_name', e.target.value)} placeholder="e.g., Wooden Cot" />
                        </div>
                        <div>
                            <Label>Category *</Label>
                            <Select value={form.asset_category} onValueChange={v => handleChange('asset_category', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Condition</Label>
                            <Select value={form.condition} onValueChange={v => handleChange('condition', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{conditions.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Quantity</Label>
                            <Input type="number" min="1" value={form.quantity} onChange={e => handleChange('quantity', e.target.value)} />
                        </div>
                        <div>
                            <Label>Brand</Label>
                            <Input value={form.brand} onChange={e => handleChange('brand', e.target.value)} />
                        </div>
                        <div>
                            <Label>Model Number</Label>
                            <Input value={form.model_number} onChange={e => handleChange('model_number', e.target.value)} />
                        </div>
                        <div>
                            <Label>Serial Number</Label>
                            <Input value={form.serial_number} onChange={e => handleChange('serial_number', e.target.value)} />
                        </div>
                        <div>
                            <Label>Vendor Name</Label>
                            <Input value={form.vendor_name} onChange={e => handleChange('vendor_name', e.target.value)} />
                        </div>
                        <div>
                            <Label>Purchase Date</Label>
                            <Input type="date" value={form.purchase_date} onChange={e => handleChange('purchase_date', e.target.value)} />
                        </div>
                        <div>
                            <Label>Purchase Cost (₹)</Label>
                            <Input type="number" min="0" step="0.01" value={form.purchase_cost} onChange={e => handleChange('purchase_cost', e.target.value)} />
                        </div>
                        <div>
                            <Label>Warranty Expiry</Label>
                            <Input type="date" value={form.warranty_expiry} onChange={e => handleChange('warranty_expiry', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Additional details..." rows={3} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => navigate(basePath)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update Asset' : 'Create Asset'}</Button>
                </div>
            </form>
        </div>
    );
}
