/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VEHICLE DAILY CHECKLIST — Day 21
 * Pre-trip & post-trip vehicle inspection management
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ClipboardCheck, CheckCircle, XCircle, Clock, Search,
    Loader2, ChevronDown, ChevronUp, Eye, ThumbsUp, ThumbsDown,
    Plus, Bus, AlertTriangle, Shield, Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';

const DEFAULT_CHECKLIST_ITEMS = [
    { item: 'Brakes working', category: 'Safety' },
    { item: 'Headlights & Tail lights', category: 'Safety' },
    { item: 'Tyres condition (all)', category: 'Safety' },
    { item: 'First aid kit', category: 'Emergency' },
    { item: 'Fire extinguisher', category: 'Emergency' },
    { item: 'Mirrors (all) OK', category: 'Safety' },
    { item: 'AC/Fans working', category: 'Comfort' },
    { item: 'GPS device working', category: 'Tracking' },
    { item: 'Emergency exit functional', category: 'Emergency' },
    { item: 'Seat belts', category: 'Safety' },
    { item: 'Horn working', category: 'Safety' },
    { item: 'Windshield wipers', category: 'Safety' },
    { item: 'Fuel level adequate', category: 'Operations' },
    { item: 'Cleanliness (interior)', category: 'Comfort' },
    { item: 'Door locks working', category: 'Safety' },
];

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const VehicleChecklist = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [checklists, setChecklists] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list'); // list, create
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [approving, setApproving] = useState(null);

    // Create form state
    const [form, setForm] = useState({
        vehicle_id: '',
        driver_id: '',
        checklist_type: 'pre_trip',
        items: DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i, status: null, note: '' })),
        remarks: ''
    });

    // ═══════════════════════════════════════════════════════════════
    // FETCH DATA
    // ═══════════════════════════════════════════════════════════════
    const fetchData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const [checklistRes, vehicleRes, driverRes] = await Promise.all([
                api.get('/transport/checklists', { params: { branchId, organizationId } }),
                api.get('/transport/vehicles', { params: { branchId, organizationId } }),
                api.get('/transport/drivers', { params: { branchId, organizationId } })
            ]);
            setChecklists(checklistRes.data?.data || []);
            setVehicles(vehicleRes.data?.data || []);
            setDrivers(driverRes.data?.data || []);
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error('Failed to load checklist data');
        } finally { setLoading(false); }
    }, [branchId, organizationId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ═══════════════════════════════════════════════════════════════
    // CREATE CHECKLIST
    // ═══════════════════════════════════════════════════════════════
    const handleSubmit = async () => {
        if (!form.vehicle_id) return toast.error('Select a vehicle');
        const unchecked = form.items.filter(i => i.status === null);
        if (unchecked.length > 0) return toast.error(`${unchecked.length} items not checked yet`);

        setSaving(true);
        try {
            await api.post('/transport/checklists', {
                ...form,
                checklist_date: new Date().toISOString().split('T')[0],
                branch_id: branchId,
                organization_id: organizationId
            });
            toast.success('Checklist submitted!');
            setActiveTab('list');
            setForm({
                vehicle_id: '',
                driver_id: '',
                checklist_type: 'pre_trip',
                items: DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i, status: null, note: '' })),
                remarks: ''
            });
            fetchData();
        } catch { toast.error('Failed to submit'); }
        finally { setSaving(false); }
    };

    // ═══════════════════════════════════════════════════════════════
    // APPROVE / REJECT
    // ═══════════════════════════════════════════════════════════════
    const handleApproval = async (id, status, remarks = '') => {
        setApproving(id);
        try {
            await api.put(`/transport/checklists/${id}/approve`, {
                overall_status: status,
                remarks,
                branchId, organizationId
            });
            toast.success(`Checklist ${status}!`);
            fetchData();
        } catch { toast.error('Failed to update'); }
        finally { setApproving(null); }
    };

    // Toggle item status in create form
    const toggleItem = (idx, status) => {
        const updated = [...form.items];
        updated[idx] = { ...updated[idx], status };
        setForm(prev => ({ ...prev, items: updated }));
    };

    const setItemNote = (idx, note) => {
        const updated = [...form.items];
        updated[idx] = { ...updated[idx], note };
        setForm(prev => ({ ...prev, items: updated }));
    };

    // Filter & search
    const filtered = checklists.filter(c => {
        if (filter !== 'all' && c.overall_status !== filter) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const veh = c.transport_vehicles?.vehicle_number?.toLowerCase() || '';
            const drv = c.transport_drivers?.name?.toLowerCase() || '';
            return veh.includes(term) || drv.includes(term);
        }
        return true;
    });

    // Stats
    const pending = checklists.filter(c => c.overall_status === 'pending').length;
    const approved = checklists.filter(c => c.overall_status === 'approved').length;
    const rejected = checklists.filter(c => c.overall_status === 'rejected').length;
    const passRate = checklists.length > 0
        ? Math.round((approved / checklists.length) * 100) : 0;

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ClipboardCheck className="h-6 w-6 text-blue-600" />
                            Vehicle Daily Checklist
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pre-trip & post-trip vehicle inspection</p>
                    </div>
                    <Button onClick={() => setActiveTab(activeTab === 'create' ? 'list' : 'create')}>
                        {activeTab === 'create' ? <Eye className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                        {activeTab === 'create' ? 'View List' : 'New Inspection'}
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending Review', value: pending, icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30' },
                        { label: 'Approved', value: approved, icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
                        { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
                        { label: 'Pass Rate', value: `${passRate}%`, icon: Shield, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
                    ].map((s, i) => (
                        <Card key={i}>
                            <CardContent className="pt-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-2xl font-bold">{s.value}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ═══════ CREATE CHECKLIST ═══════ */}
                {activeTab === 'create' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardCheck className="h-5 w-5" /> New Vehicle Inspection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Vehicle + Driver + Type selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Vehicle *</Label>
                                    <select className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 p-2 text-sm"
                                        value={form.vehicle_id}
                                        onChange={e => setForm(p => ({ ...p, vehicle_id: e.target.value }))}
                                    >
                                        <option value="">Select Vehicle</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.vehicle_number} - {v.vehicle_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Driver</Label>
                                    <select className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 p-2 text-sm"
                                        value={form.driver_id}
                                        onChange={e => setForm(p => ({ ...p, driver_id: e.target.value }))}
                                    >
                                        <option value="">Select Driver</option>
                                        {drivers.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} - {d.license_number}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Inspection Type *</Label>
                                    <select className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 p-2 text-sm"
                                        value={form.checklist_type}
                                        onChange={e => setForm(p => ({ ...p, checklist_type: e.target.value }))}
                                    >
                                        <option value="pre_trip">Pre-Trip</option>
                                        <option value="post_trip">Post-Trip</option>
                                    </select>
                                </div>
                            </div>

                            {/* Checklist Items */}
                            <div>
                                <Label className="mb-2 block">Inspection Items</Label>
                                <div className="space-y-2">
                                    {form.items.map((item, idx) => (
                                        <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${
                                            item.status === true ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30' :
                                            item.status === false ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30' :
                                            'border-gray-200 dark:border-gray-700'
                                        }`}>
                                            <span className="flex-1 text-sm font-medium">
                                                <Badge variant="outline" className="mr-2 text-xs">{item.category}</Badge>
                                                {item.item}
                                            </span>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant={item.status === true ? 'default' : 'outline'}
                                                    className={item.status === true ? 'bg-green-600 hover:bg-green-700' : ''}
                                                    onClick={() => toggleItem(idx, true)}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant={item.status === false ? 'default' : 'outline'}
                                                    className={item.status === false ? 'bg-red-600 hover:bg-red-700' : ''}
                                                    onClick={() => toggleItem(idx, false)}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {item.status === false && (
                                                <Input
                                                    placeholder="Issue note..."
                                                    className="w-40 text-xs"
                                                    value={item.note}
                                                    onChange={e => setItemNote(idx, e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Remarks + Submit */}
                            <div>
                                <Label>Remarks</Label>
                                <Textarea className="mt-1" rows={2}
                                    placeholder="Any additional remarks..."
                                    value={form.remarks}
                                    onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => setActiveTab('list')}>Cancel</Button>
                                <Button onClick={handleSubmit} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ClipboardCheck className="h-4 w-4 mr-1" />}
                                    Submit Inspection
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ═══════ CHECKLIST LIST ═══════ */}
                {activeTab === 'list' && (
                    <>
                        {/* Filters */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input className="pl-9" placeholder="Search vehicle or driver..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-1">
                                {['all', 'pending', 'approved', 'rejected'].map(f => (
                                    <Button key={f} size="sm"
                                        variant={filter === f ? 'default' : 'outline'}
                                        onClick={() => setFilter(f)}
                                    >
                                        {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label}
                                        {f === 'pending' && pending > 0 && (
                                            <Badge className="ml-1 bg-yellow-500 text-white text-xs px-1">{pending}</Badge>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <Card className="p-12 text-center">
                                <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No checklists found</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map(cl => {
                                    const items = cl.items || [];
                                    const passCount = items.filter(i => i.status === true).length;
                                    const failCount = items.filter(i => i.status === false).length;
                                    const cfg = STATUS_CONFIG[cl.overall_status] || STATUS_CONFIG.pending;
                                    const isExpanded = expandedId === cl.id;

                                    return (
                                        <Card key={cl.id} className="shadow-sm">
                                            <CardContent className="py-4">
                                                {/* Summary row */}
                                                <div className="flex items-center justify-between cursor-pointer"
                                                    onClick={() => setExpandedId(isExpanded ? null : cl.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-blue-50">
                                                            <Bus className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm">
                                                                {cl.transport_vehicles?.vehicle_number || 'Vehicle'}
                                                                <Badge className="ml-2 text-xs" variant="outline">
                                                                    {cl.checklist_type === 'pre_trip' ? 'Pre-Trip' : 'Post-Trip'}
                                                                </Badge>
                                                            </h4>
                                                            <p className="text-xs text-gray-500">
                                                                {cl.transport_drivers?.name || 'No driver'}
                                                                {' • '}{formatDate(cl.checklist_date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-green-600 font-medium">✅ {passCount}</span>
                                                        <span className="text-xs text-red-600 font-medium">❌ {failCount}</span>
                                                        <Badge className={`${cfg.color} text-xs`}>{cfg.label}</Badge>
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </div>
                                                </div>

                                                {/* Expanded detail */}
                                                {isExpanded && (
                                                    <div className="mt-4 pt-4 border-t space-y-3">
                                                        {/* Item grid */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {items.map((item, idx) => (
                                                                <div key={idx} className={`flex items-center gap-2 p-2 rounded text-sm ${
                                                                    item.status === true ? 'bg-green-50' :
                                                                    item.status === false ? 'bg-red-50' : 'bg-gray-50'
                                                                }`}>
                                                                    {item.status === true ? (
                                                                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                                                    ) : (
                                                                        <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                                                    )}
                                                                    <span className="flex-1">{item.item}</span>
                                                                    {item.note && (
                                                                        <span className="text-xs text-red-500 italic">{item.note}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {cl.remarks && (
                                                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                                💬 {cl.remarks}
                                                            </p>
                                                        )}

                                                        {/* Admin approval/rejection */}
                                                        {cl.overall_status === 'pending' && (
                                                            <div className="flex gap-2 justify-end pt-2">
                                                                <Button size="sm" variant="outline"
                                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                                    disabled={approving === cl.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleApproval(cl.id, 'rejected', 'Inspection failed - fix issues');
                                                                    }}
                                                                >
                                                                    <ThumbsDown className="h-4 w-4 mr-1" /> Reject
                                                                </Button>
                                                                <Button size="sm"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    disabled={approving === cl.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleApproval(cl.id, 'approved', 'Vehicle cleared');
                                                                    }}
                                                                >
                                                                    {approving === cl.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                                    ) : (
                                                                        <ThumbsUp className="h-4 w-4 mr-1" />
                                                                    )}
                                                                    Approve
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {cl.approved_by && (
                                                            <p className="text-xs text-gray-400">
                                                                {cl.overall_status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                                                                {' • '}{formatDate(cl.approved_at)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default VehicleChecklist;
