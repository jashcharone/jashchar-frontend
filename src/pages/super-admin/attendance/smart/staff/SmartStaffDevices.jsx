/**
 * SMART STAFF DEVICES MANAGEMENT
 */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Cpu, Monitor, Fingerprint, Radio, CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, Plus, Settings, Trash2, Briefcase } from 'lucide-react';

const deviceTypes = [
    { value: 'biometric', label: 'Biometric Scanner', icon: Fingerprint, color: 'bg-blue-100 text-blue-700' },
    { value: 'rfid', label: 'RFID Reader', icon: Radio, color: 'bg-green-100 text-green-700' },
    { value: 'face_terminal', label: 'Face Terminal', icon: Monitor, color: 'bg-purple-100 text-purple-700' },
    { value: 'kiosk', label: 'Attendance Kiosk', icon: Cpu, color: 'bg-orange-100 text-orange-700' }
];

const SmartStaffDevices = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [loading, setLoading] = useState(false);
    const [devices, setDevices] = useState([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newDevice, setNewDevice] = useState({ name: '', type: '', location: '', serial_number: '' });

    const fetchDevices = async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const { data } = await supabase.from('attendance_devices').select('*').eq('branch_id', branchId).eq('target_type', 'staff').order('created_at', { ascending: false });
            setDevices(data || getDefaultDevices());
        } catch (err) { setDevices(getDefaultDevices()); }
        finally { setLoading(false); }
    };

    const getDefaultDevices = () => [
        { id: 'demo-1', name: 'Main Gate Biometric', type: 'biometric', location: 'Staff Entrance', serial_number: 'BIO-001', status: 'online', last_sync: new Date().toISOString() },
        { id: 'demo-2', name: 'Admin Office RFID', type: 'rfid', location: 'Administrative Block', serial_number: 'RFID-001', status: 'online', last_sync: new Date().toISOString() },
        { id: 'demo-3', name: 'Face Recognition Terminal', type: 'face_terminal', location: 'Main Building', serial_number: 'FACE-001', status: 'offline', last_sync: null }
    ];

    useEffect(() => { fetchDevices(); }, [branchId]);

    const addDevice = async () => {
        if (!newDevice.name || !newDevice.type) { toast({ variant: 'destructive', title: 'Error', description: 'Name and type are required' }); return; }
        try {
            await supabase.from('attendance_devices').insert({ ...newDevice, branch_id: branchId, organization_id: organizationId, target_type: 'staff', status: 'offline' });
            toast({ title: 'Device Added', description: `${newDevice.name} added successfully` });
            setAddDialogOpen(false); setNewDevice({ name: '', type: '', location: '', serial_number: '' }); fetchDevices();
        } catch (err) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to add device' }); }
    };

    const deleteDevice = async (device) => {
        if (device.id.startsWith('demo-')) { toast({ title: 'Demo Device', description: 'Cannot delete demo devices' }); return; }
        try {
            await supabase.from('attendance_devices').delete().eq('id', device.id);
            toast({ title: 'Device Deleted', description: `${device.name} deleted` }); fetchDevices();
        } catch (err) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete device' }); }
    };

    const getDeviceType = (type) => deviceTypes.find(t => t.value === type) || deviceTypes[0];
    const statusColors = { online: 'bg-green-500', offline: 'bg-red-500', unknown: 'bg-gray-500' };
    const stats = { total: devices.length, online: devices.filter(d => d.status === 'online').length, offline: devices.filter(d => d.status !== 'online').length };

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2"><Cpu className="h-7 w-7 text-orange-600" />Staff Attendance Devices</h1>
                        <p className="text-muted-foreground">Manage biometric and RFID devices for staff attendance</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1">{stats.total} Devices</Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700">{stats.online} Online</Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-red-50 text-red-700">{stats.offline} Offline</Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {deviceTypes.map(dt => {
                        const count = devices.filter(d => d.type === dt.value).length;
                        const Icon = dt.icon;
                        return (
                            <Card key={dt.value}>
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${dt.color}`}><Icon className="h-6 w-6" /></div>
                                    <div><p className="text-sm text-muted-foreground">{dt.label}</p><p className="text-2xl font-bold">{count}</p></div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div><CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5" />Device List</CardTitle><CardDescription>All devices configured for staff attendance</CardDescription></div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={fetchDevices}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
                            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Device</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Add New Device</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div><Label>Device Name *</Label><Input placeholder="Enter device name" value={newDevice.name} onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })} /></div>
                                        <div>
                                            <Label>Device Type *</Label>
                                            <Select value={newDevice.type} onValueChange={(v) => setNewDevice({ ...newDevice, type: v })}>
                                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                                <SelectContent>{deviceTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div><Label>Location</Label><Input placeholder="Enter location" value={newDevice.location} onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })} /></div>
                                        <div><Label>Serial Number</Label><Input placeholder="Enter serial number" value={newDevice.serial_number} onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })} /></div>
                                        <Button onClick={addDevice} className="w-full">Add Device</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Device</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Serial Number</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Sync</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {devices.map(device => {
                                        const dt = getDeviceType(device.type);
                                        const Icon = dt.icon;
                                        return (
                                            <TableRow key={device.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${dt.color}`}><Icon className="h-5 w-5" /></div>
                                                        <p className="font-medium">{device.name}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge variant="outline">{dt.label}</Badge></TableCell>
                                                <TableCell>{device.location || '-'}</TableCell>
                                                <TableCell><code className="text-xs bg-gray-100 px-2 py-1 rounded">{device.serial_number || '-'}</code></TableCell>
                                                <TableCell>
                                                    <Badge className={`${statusColors[device.status] || statusColors.unknown} gap-1`}>
                                                        {device.status === 'online' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                        {device.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{device.last_sync ? new Date(device.last_sync).toLocaleString('en-IN') : 'Never'}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm"><Settings className="h-4 w-4" /></Button>
                                                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteDevice(device)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {devices.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No devices found</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default SmartStaffDevices;
