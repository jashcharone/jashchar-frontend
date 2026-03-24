/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * JASHCHAR ERP - STAFF TRANSFER MODULE
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * Transfer staff from one branch to another (inter-branch transfer)
 * 
 * Features:
 * - Select source branch → view staff list
 * - Select destination branch → assign department/designation/role
 * - Execute transfer with audit trail
 * - View transfer history
 * 
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import {
    ArrowRight, ArrowLeftRight, Search, Building2, User, Briefcase, Shield, FileText,
    CheckCircle2, Loader2, History, AlertTriangle, ChevronDown, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import DatePicker from '@/components/ui/DatePicker';
import api from '@/lib/api';

const TransferStaff = () => {
    const { toast } = useToast();
    const { user, organizationId } = useAuth();
    const { branches, selectedBranch } = useBranch();

    // State
    const [activeTab, setActiveTab] = useState('transfer');
    const [fromBranchId, setFromBranchId] = useState('');
    const [toBranchId, setToBranchId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [staffList, setStaffList] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [transferring, setTransferring] = useState(false);
    
    // Target branch options
    const [targetOptions, setTargetOptions] = useState({ departments: [], designations: [], roles: [] });
    const [targetLoading, setTargetLoading] = useState(false);

    // Transfer form
    const [transferForm, setTransferForm] = useState({
        to_department_id: '',
        to_designation_id: '',
        to_role_id: '',
        transfer_type: 'permanent',
        transfer_date: new Date().toISOString().split('T')[0],
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
        order_number: '',
        remarks: ''
    });

    // Confirm dialog
    const [showConfirm, setShowConfirm] = useState(false);

    // History
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [detailRecord, setDetailRecord] = useState(null);

    // Set default from_branch to selected branch
    useEffect(() => {
        if (selectedBranch?.id && !fromBranchId) {
            setFromBranchId(selectedBranch.id);
        }
    }, [selectedBranch]);

    // Fetch staff when source branch changes
    useEffect(() => {
        if (fromBranchId) fetchStaff();
    }, [fromBranchId]);

    // Fetch target options when dest branch changes
    useEffect(() => {
        if (toBranchId) fetchTargetOptions();
    }, [toBranchId]);

    // Fetch transfer history
    useEffect(() => {
        if (activeTab === 'history') fetchHistory();
    }, [activeTab]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ from_branch_id: fromBranchId });
            if (searchQuery) params.append('search', searchQuery);
            const response = await api.get(`/user-management/transfer/staff?${params}`);
            if (response.data.success) {
                setStaffList(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load staff list' });
        } finally {
            setLoading(false);
        }
    };

    const fetchTargetOptions = async () => {
        setTargetLoading(true);
        try {
            const response = await api.get(`/user-management/transfer/target-options?branch_id=${toBranchId}`);
            if (response.data.success) {
                setTargetOptions(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch target options:', error);
        } finally {
            setTargetLoading(false);
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await api.get('/user-management/transfer/history');
            if (response.data.success) {
                setHistory(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        // Reset form
        setTransferForm(prev => ({
            ...prev,
            to_department_id: '',
            to_designation_id: '',
            to_role_id: '',
            reason: '',
            order_number: '',
            remarks: ''
        }));
        setToBranchId('');
    };

    const handleFormChange = (key, value) => {
        setTransferForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (fromBranchId) fetchStaff();
    };

    const canTransfer = selectedEmployee && toBranchId && fromBranchId !== toBranchId;

    const handleTransferConfirm = () => {
        if (!canTransfer) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please select employee and destination branch' });
            return;
        }
        setShowConfirm(true);
    };

    const executeTransfer = async () => {
        setTransferring(true);
        try {
            const payload = {
                employee_id: selectedEmployee.id,
                from_branch_id: fromBranchId,
                to_branch_id: toBranchId,
                to_department_id: transferForm.to_department_id || undefined,
                to_designation_id: transferForm.to_designation_id || undefined,
                to_role_id: transferForm.to_role_id || undefined,
                transfer_type: transferForm.transfer_type,
                transfer_date: transferForm.transfer_date,
                effective_date: transferForm.effective_date,
                reason: transferForm.reason || undefined,
                order_number: transferForm.order_number || undefined,
                remarks: transferForm.remarks || undefined
            };

            const response = await api.post('/user-management/transfer/execute', payload);
            if (response.data.success) {
                toast({ title: 'Transfer Successful', description: response.data.message });
                setShowConfirm(false);
                setSelectedEmployee(null);
                setToBranchId('');
                fetchStaff(); // Refresh list
            } else {
                toast({ variant: 'destructive', title: 'Transfer Failed', description: response.data.error });
            }
        } catch (error) {
            console.error('Transfer failed:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Transfer Failed', 
                description: error.response?.data?.error || 'An error occurred during transfer' 
            });
        } finally {
            setTransferring(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getBranchName = (id) => branches.find(b => b.id === id)?.branch_name || 'Unknown';

    const filteredDestBranches = branches.filter(b => b.id !== fromBranchId);

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ArrowLeftRight className="w-7 h-7 text-blue-600" />
                            Staff Transfer
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Transfer staff between branches / campuses within the organization
                        </p>
                    </div>
                    {branches.length < 2 && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 px-3 py-1.5">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Need at least 2 branches for transfers
                        </Badge>
                    )}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 w-full max-w-sm">
                        <TabsTrigger value="transfer" className="flex items-center gap-2">
                            <ArrowLeftRight className="w-4 h-4" /> Transfer
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="w-4 h-4" /> History
                        </TabsTrigger>
                    </TabsList>

                    {/* ═══════════ TRANSFER TAB ═══════════ */}
                    <TabsContent value="transfer" className="space-y-6">
                        {/* Branch Selection Row */}
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                            {/* Source Branch */}
                            <Card className="border-t-4 border-t-red-500">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> From Branch (Source)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Select value={fromBranchId} onValueChange={(val) => { setFromBranchId(val); setSelectedEmployee(null); }}>
                                        <SelectTrigger><SelectValue placeholder="Select Source Branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.branch_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            {/* Arrow */}
                            <div className="hidden md:flex items-center justify-center pb-4">
                                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                                    <ArrowRight className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>

                            {/* Destination Branch */}
                            <Card className={`border-t-4 ${toBranchId ? 'border-t-green-500' : 'border-t-gray-300'}`}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> To Branch (Destination)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Select value={toBranchId} onValueChange={setToBranchId} disabled={!selectedEmployee}>
                                        <SelectTrigger><SelectValue placeholder={selectedEmployee ? "Select Destination Branch" : "First select a staff member"} /></SelectTrigger>
                                        <SelectContent>
                                            {filteredDestBranches.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.branch_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Staff Selection */}
                        {fromBranchId && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <User className="w-5 h-5" /> Select Staff to Transfer
                                            </CardTitle>
                                            <CardDescription>
                                                {staffList.length} staff in {getBranchName(fromBranchId)}
                                            </CardDescription>
                                        </div>
                                        <form onSubmit={handleSearch} className="flex gap-2">
                                            <Input 
                                                placeholder="Search by name, email, phone..." 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-64"
                                            />
                                            <Button type="submit" variant="outline" size="icon">
                                                <Search className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading staff...
                                        </div>
                                    ) : staffList.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            No staff found in this branch
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                                            {staffList.map(emp => (
                                                <div 
                                                    key={emp.id}
                                                    onClick={() => handleSelectEmployee(emp)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                                        selectedEmployee?.id === emp.id 
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                                                            : 'border-transparent bg-muted/30 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage src={emp.photo_url} />
                                                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">
                                                            {getInitials(emp.full_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{emp.full_name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {emp.designations?.name || emp.staff_type || 'Staff'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {emp.departments?.name || ''}
                                                            {emp.staff_id ? ` • ${emp.staff_id}` : ''}
                                                        </p>
                                                    </div>
                                                    {selectedEmployee?.id === emp.id && (
                                                        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Transfer Details Form */}
                        {selectedEmployee && toBranchId && (
                            <Card className="border-t-4 border-t-blue-600">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5" /> Transfer Details
                                    </CardTitle>
                                    <CardDescription>
                                        Transferring <strong>{selectedEmployee.full_name}</strong> from{' '}
                                        <strong>{getBranchName(fromBranchId)}</strong> → <strong>{getBranchName(toBranchId)}</strong>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Row 1: Assignment in new branch */}
                                    <div>
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" /> New Branch Assignment
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Department</Label>
                                                <Select 
                                                    value={transferForm.to_department_id} 
                                                    onValueChange={(v) => handleFormChange('to_department_id', v)}
                                                    disabled={targetLoading}
                                                >
                                                    <SelectTrigger><SelectValue placeholder={targetLoading ? "Loading..." : "Select Department"} /></SelectTrigger>
                                                    <SelectContent>
                                                        {targetOptions.departments.map(d => (
                                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Designation</Label>
                                                <Select 
                                                    value={transferForm.to_designation_id} 
                                                    onValueChange={(v) => handleFormChange('to_designation_id', v)}
                                                    disabled={targetLoading}
                                                >
                                                    <SelectTrigger><SelectValue placeholder={targetLoading ? "Loading..." : "Select Designation"} /></SelectTrigger>
                                                    <SelectContent>
                                                        {targetOptions.designations.map(d => (
                                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Role (System Access)</Label>
                                                <Select 
                                                    value={transferForm.to_role_id} 
                                                    onValueChange={(v) => handleFormChange('to_role_id', v)}
                                                    disabled={targetLoading}
                                                >
                                                    <SelectTrigger><SelectValue placeholder={targetLoading ? "Loading..." : "Select Role"} /></SelectTrigger>
                                                    <SelectContent>
                                                        {targetOptions.roles.map(r => (
                                                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Transfer Info */}
                                    <div>
                                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Transfer Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Transfer Type</Label>
                                                <Select value={transferForm.transfer_type} onValueChange={(v) => handleFormChange('transfer_type', v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="permanent">Permanent Transfer</SelectItem>
                                                        <SelectItem value="temporary">Temporary Transfer</SelectItem>
                                                        <SelectItem value="deputation">Deputation</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Transfer Date</Label>
                                                <DatePicker
                                                    value={transferForm.transfer_date}
                                                    onChange={(d) => handleFormChange('transfer_date', d)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Effective Date</Label>
                                                <DatePicker
                                                    value={transferForm.effective_date}
                                                    onChange={(d) => handleFormChange('effective_date', d)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: Additional Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Transfer Order Number</Label>
                                            <Input 
                                                placeholder="e.g., TO/2026/001"
                                                value={transferForm.order_number}
                                                onChange={(e) => handleFormChange('order_number', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Reason for Transfer</Label>
                                            <Input 
                                                placeholder="e.g., Administrative requirement"
                                                value={transferForm.reason}
                                                onChange={(e) => handleFormChange('reason', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Remarks</Label>
                                        <Textarea 
                                            placeholder="Any additional notes about this transfer..."
                                            value={transferForm.remarks}
                                            onChange={(e) => handleFormChange('remarks', e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    {/* Transfer Button */}
                                    <div className="flex justify-end pt-4 border-t">
                                        <Button 
                                            onClick={handleTransferConfirm}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                            disabled={!canTransfer}
                                        >
                                            <ArrowLeftRight className="w-4 h-4 mr-2" />
                                            Transfer Staff
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* ═══════════ HISTORY TAB ═══════════ */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5" /> Transfer History
                                </CardTitle>
                                <CardDescription>Record of all staff transfers in the organization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No transfer records found
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Staff</TableHead>
                                                    <TableHead>From Branch</TableHead>
                                                    <TableHead>To Branch</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {history.map(record => (
                                                    <TableRow key={record.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarImage src={record.employee?.photo_url} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {getInitials(record.employee?.full_name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium text-sm">{record.employee?.full_name || 'Unknown'}</p>
                                                                    <p className="text-xs text-muted-foreground">{record.employee?.staff_id || ''}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm">{record.from_branch?.branch_name || '-'}</TableCell>
                                                        <TableCell className="text-sm">{record.to_branch?.branch_name || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize text-xs">{record.transfer_type}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {formatDate(record.transfer_date)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={`text-xs ${
                                                                record.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
                                                                record.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}>
                                                                {record.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => { setDetailRecord(record); setShowDetailDialog(true); }}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* ═══════════ CONFIRMATION DIALOG ═══════════ */}
                <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-blue-700">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Confirm Staff Transfer
                            </DialogTitle>
                            <DialogDescription>
                                This action will permanently move the staff member to another branch.
                            </DialogDescription>
                        </DialogHeader>
                        
                        {selectedEmployee && (
                            <div className="space-y-4 py-4">
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={selectedEmployee.photo_url} />
                                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                            {getInitials(selectedEmployee.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{selectedEmployee.full_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedEmployee.designations?.name} • {selectedEmployee.departments?.name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3 py-2">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">FROM</p>
                                        <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                                            {getBranchName(fromBranchId)}
                                        </Badge>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-blue-600" />
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">TO</p>
                                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                                            {getBranchName(toBranchId)}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
                                    <p className="font-medium text-amber-800 dark:text-amber-400 mb-1">What will happen:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>Employee record moves to the new branch</li>
                                        <li>Login access updated to new branch</li>
                                        <li>Old branch access will be removed</li>
                                        <li>Transfer record saved for audit</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={transferring}>
                                Cancel
                            </Button>
                            <Button 
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={executeTransfer}
                                disabled={transferring}
                            >
                                {transferring ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transferring...</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Transfer</>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ═══════════ DETAIL DIALOG ═══════════ */}
                <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Transfer Details</DialogTitle>
                        </DialogHeader>
                        {detailRecord && (
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-3">
                                    <div><span className="text-muted-foreground">Staff:</span> <strong>{detailRecord.employee?.full_name}</strong></div>
                                    <div><span className="text-muted-foreground">ID:</span> {detailRecord.employee?.staff_id || '-'}</div>
                                    <div><span className="text-muted-foreground">From:</span> {detailRecord.from_branch?.branch_name}</div>
                                    <div><span className="text-muted-foreground">To:</span> {detailRecord.to_branch?.branch_name}</div>
                                    <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{detailRecord.transfer_type}</span></div>
                                    <div><span className="text-muted-foreground">Status:</span> <span className="capitalize">{detailRecord.status}</span></div>
                                    <div><span className="text-muted-foreground">Transfer Date:</span> {formatDate(detailRecord.transfer_date)}</div>
                                    <div><span className="text-muted-foreground">Effective Date:</span> {formatDate(detailRecord.effective_date)}</div>
                                    {detailRecord.order_number && <div><span className="text-muted-foreground">Order No:</span> {detailRecord.order_number}</div>}
                                </div>
                                {detailRecord.reason && <div><span className="text-muted-foreground">Reason:</span> {detailRecord.reason}</div>}
                                {detailRecord.remarks && <div><span className="text-muted-foreground">Remarks:</span> {detailRecord.remarks}</div>}
                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                    Created: {formatDateTime(detailRecord.created_at)}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default TransferStaff;
