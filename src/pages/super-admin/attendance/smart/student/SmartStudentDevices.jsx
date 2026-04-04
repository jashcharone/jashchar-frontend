/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SMART STUDENT DEVICES MANAGEMENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Device management for Student attendance (Biometric, RFID readers, etc.)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { formatDate, formatDateTime } from '@/utils/dateUtils';

import {
    Tablet, Wifi, WifiOff, CheckCircle2, XCircle,
    AlertTriangle, Loader2, RefreshCw, Plus, Settings, Trash2, GraduationCap
} from 'lucide-react';

const SmartStudentDevices = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [loading, setLoading] = useState(false);
    const [devices, setDevices] = useState([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newDevice, setNewDevice] = useState({
        name: '',
        type: 'biometric',
        location: '',
        serial_number: ''
    });

    // Fetch devices
    const fetchDevices = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('attendance_devices')
                .select('*')
                .eq('branch_id', branchId)
                .eq('user_type', 'student')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDevices(data || []);
        } catch (err) {
            console.error('Error fetching devices:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load devices'
            });
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    // Add new device
    const addDevice = async () => {
        if (!newDevice.name || !newDevice.type) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please fill in all required fields'
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('attendance_devices')
                .insert({
                    ...newDevice,
                    branch_id: branchId,
                    organization_id: organizationId,
                    user_type: 'student',
                    status: 'active',
                    last_ping: new Date().toISOString()
                });

            if (error) throw error;

            toast({
                title: 'Device Added',
                description: `${newDevice.name} added successfully`
            });

            setAddDialogOpen(false);
            setNewDevice({ name: '', type: 'biometric', location: '', serial_number: '' });
            fetchDevices();
        } catch (err) {
            console.error('Error adding device:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add device'
            });
        }
    };

    // Delete device
    const deleteDevice = async (device) => {
        if (!confirm(`Are you sure you want to delete ${device.name}?`)) return;

        try {
            const { error } = await supabase
                .from('attendance_devices')
                .delete()
                .eq('id', device.id);

            if (error) throw error;

            toast({
                title: 'Device Deleted',
                description: `${device.name} deleted successfully`
            });

            fetchDevices();
        } catch (err) {
            console.error('Error deleting device:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete device'
            });
        }
    };

    // Check if device is online (last ping within 5 minutes)
    const isOnline = (device) => {
        if (!device.last_ping) return false;
        const lastPing = new Date(device.last_ping);
        const now = new Date();
        return (now - lastPing) < 5 * 60 * 1000; // 5 minutes
    };

    const stats = {
        total: devices.length,
        online: devices.filter(d => isOnline(d)).length,
        offline: devices.filter(d => !isOnline(d)).length
    };

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Tablet className="h-7 w-7 text-blue-600" />
                            Student Attendance Devices
                        </h1>
                        <p className="text-muted-foreground">Manage biometric & RFID devices for students</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-3 py-1">
                            <Tablet className="h-4 w-4 mr-1" />
                            {stats.total} Total
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700">
                            <Wifi className="h-4 w-4 mr-1" />
                            {stats.online} Online
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 bg-red-50 text-red-700">
                            <WifiOff className="h-4 w-4 mr-1" />
                            {stats.offline} Offline
                        </Badge>
                        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Device
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Device</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label>Device Name *</Label>
                                        <Input
                                            placeholder="e.g., Classroom A Biometric"
                                            value={newDevice.name}
                                            onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Device Type *</Label>
                                        <Select
                                            value={newDevice.type}
                                            onValueChange={(value) => setNewDevice({ ...newDevice, type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="biometric">Biometric (Fingerprint)</SelectItem>
                                                <SelectItem value="rfid">RFID Reader</SelectItem>
                                                <SelectItem value="face">Face Recognition</SelectItem>
                                                <SelectItem value="qr">QR Scanner</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Location</Label>
                                        <Input
                                            placeholder="e.g., Main Gate, Classroom A"
                                            value={newDevice.location}
                                            onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Serial Number</Label>
                                        <Input
                                            placeholder="Device serial number"
                                            value={newDevice.serial_number}
                                            onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })}
                                        />
                                    </div>
                                    <Button onClick={addDevice} className="w-full">
                                        Add Device
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Devices Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Student Devices ({devices.length})
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={fetchDevices}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Device Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Serial Number</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Ping</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {devices.map(device => (
                                        <TableRow key={device.id}>
                                            <TableCell className="font-medium">{device.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {device.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{device.location || '-'}</TableCell>
                                            <TableCell className="font-mono text-sm">{device.serial_number || '-'}</TableCell>
                                            <TableCell>
                                                {isOnline(device) ? (
                                                    <Badge className="bg-green-500">
                                                        <Wifi className="h-3 w-3 mr-1" />
                                                        Online
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        <WifiOff className="h-3 w-3 mr-1" />
                                                        Offline
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {device.last_ping ? formatDateTime(device.last_ping) : 'Never'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm">
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteDevice(device)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {devices.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No devices found. Add a device to get started.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default SmartStudentDevices;
