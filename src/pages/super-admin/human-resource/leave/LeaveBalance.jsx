import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { formatDate } from '@/utils/dateUtils';
import { 
    Loader2, Plus, Edit, Calendar, Users, Search, RefreshCw, Download,
    CalendarCheck, CalendarX, Clock, AlertTriangle
} from 'lucide-react';

const LeaveBalance = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [showAdjustDialog, setShowAdjustDialog] = useState(false);
    const [selectedBalance, setSelectedBalance] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({ type: 'credit', days: '', reason: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('all');

    // Fetch balances
    const fetchBalances = useCallback(async () => {
        if (!selectedBranch?.id || !currentSessionId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leave_balances')
                .select(`
                    *,
                    employees(id, first_name, last_name, employee_code, designations(name), departments(name)),
                    leave_types(id, name, color)
                `)
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setBalances(data || []);
        } catch (error) {
            console.error('Error fetching balances:', error);
            toast({ variant: 'destructive', title: 'Error loading leave balances' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, currentSessionId, toast]);

    const fetchEmployees = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('employees')
                .select('id, first_name, last_name, employee_code')
                .eq('branch_id', selectedBranch.id)
                .eq('status', 'active')
                .order('first_name');
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [selectedBranch?.id]);

    const fetchLeaveTypes = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('leave_types')
                .select('id, name, color, max_days')
                .eq('branch_id', selectedBranch.id)
                .eq('is_active', true)
                .order('name');
            setLeaveTypes(data || []);
        } catch (error) {
            console.error('Error fetching leave types:', error);
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        fetchBalances();
        fetchEmployees();
        fetchLeaveTypes();
    }, [fetchBalances, fetchEmployees, fetchLeaveTypes]);

    // Stats calculation
    const stats = useMemo(() => {
        const totalEmployees = new Set(balances.map(b => b.employee_id)).size;
        const totalAllocated = balances.reduce((acc, b) => acc + (b.allocated_days || 0), 0);
        const totalUsed = balances.reduce((acc, b) => acc + (b.used_days || 0), 0);
        const totalPending = balances.reduce((acc, b) => acc + (b.pending_days || 0), 0);
        return { totalEmployees, totalAllocated, totalUsed, totalPending };
    }, [balances]);

    // Group balances by employee
    const groupedBalances = useMemo(() => {
        const filtered = employeeFilter === 'all' 
            ? balances 
            : balances.filter(b => b.employee_id === employeeFilter);
        
        const searchFiltered = searchTerm 
            ? filtered.filter(b => 
                b.employees?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.employees?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.employees?.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            : filtered;
        
        const grouped = {};
        searchFiltered.forEach(balance => {
            if (!grouped[balance.employee_id]) {
                grouped[balance.employee_id] = {
                    employee: balance.employees,
                    balances: [],
                };
            }
            grouped[balance.employee_id].balances.push(balance);
        });
        return Object.values(grouped);
    }, [balances, employeeFilter, searchTerm]);

    // Initialize balances for all employees
    const initializeBalances = async () => {
        if (!confirm('Initialize leave balances for all active employees? This will create default allocations based on leave policies.')) return;
        
        setSaving(true);
        try {
            // Get all active employees without balances
            const employeeIds = employees.map(e => e.id);
            const existingEmployeeIds = [...new Set(balances.map(b => b.employee_id))];
            const newEmployeeIds = employeeIds.filter(id => !existingEmployeeIds.includes(id));
            
            if (newEmployeeIds.length === 0) {
                toast({ title: 'All employees already have leave balances' });
                return;
            }
            
            // Create balances for each leave type
            const newBalances = [];
            newEmployeeIds.forEach(empId => {
                leaveTypes.forEach(lt => {
                    newBalances.push({
                        employee_id: empId,
                        leave_type_id: lt.id,
                        session_id: currentSessionId,
                        allocated_days: lt.max_days || 0,
                        used_days: 0,
                        pending_days: 0,
                        carried_forward: 0,
                        branch_id: selectedBranch.id,
                        organization_id: organizationId,
                    });
                });
            });
            
            const { error } = await supabase.from('leave_balances').insert(newBalances);
            if (error) throw error;
            
            toast({ title: `Initialized balances for ${newEmployeeIds.length} employees` });
            fetchBalances();
        } catch (error) {
            console.error('Error initializing:', error);
            toast({ variant: 'destructive', title: 'Error initializing balances' });
        } finally {
            setSaving(false);
        }
    };

    const handleAdjustBalance = async () => {
        if (!selectedBalance || !adjustmentData.days || !adjustmentData.reason) {
            toast({ variant: 'destructive', title: 'Days and reason are required' });
            return;
        }
        
        const days = parseFloat(adjustmentData.days);
        const newAllocated = adjustmentData.type === 'credit'
            ? selectedBalance.allocated_days + days
            : selectedBalance.allocated_days - days;
        
        if (newAllocated < selectedBalance.used_days) {
            toast({ variant: 'destructive', title: 'Allocated days cannot be less than used days' });
            return;
        }
        
        try {
            const { error } = await supabase.from('leave_balances').update({
                allocated_days: newAllocated,
                adjustment_reason: adjustmentData.reason,
                last_adjusted_at: new Date().toISOString(),
            }).eq('id', selectedBalance.id);
            
            if (error) throw error;
            
            toast({ title: 'Balance adjusted successfully' });
            setShowAdjustDialog(false);
            setSelectedBalance(null);
            setAdjustmentData({ type: 'credit', days: '', reason: '' });
            fetchBalances();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error adjusting balance' });
        }
    };

    const getEmployeeName = (emp) => {
        if (!emp) return 'Unknown';
        return `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    };

    const getRemainingDays = (balance) => {
        return (balance.allocated_days || 0) + (balance.carried_forward || 0) - (balance.used_days || 0) - (balance.pending_days || 0);
    };

    const getUsagePercentage = (balance) => {
        const total = (balance.allocated_days || 0) + (balance.carried_forward || 0);
        if (total === 0) return 0;
        return Math.round(((balance.used_days || 0) / total) * 100);
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <CalendarCheck className="h-6 w-6 text-primary" />
                            Leave Balance Management
                        </h1>
                        <p className="text-muted-foreground">View and manage employee leave balances</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => fetchBalances()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={initializeBalances} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Initialize Balances
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                                <p className="text-xs text-muted-foreground">Employees</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{stats.totalAllocated}</p>
                                <p className="text-xs text-muted-foreground">Total Allocated</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.totalUsed}</p>
                                <p className="text-xs text-muted-foreground">Total Used</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">{stats.totalPending}</p>
                                <p className="text-xs text-muted-foreground">Pending Approval</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Filter by employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>
                                    {emp.first_name} {emp.last_name} ({emp.employee_code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                </div>

                {/* Employee Balance Cards */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : groupedBalances.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No leave balances found. Click "Initialize Balances" to set up leave allocations.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {groupedBalances.map((group) => (
                            <Card key={group.employee?.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {group.employee?.first_name?.[0]}{group.employee?.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base">{getEmployeeName(group.employee)}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {group.employee?.employee_code} • {group.employee?.designations?.name} • {group.employee?.departments?.name}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {group.balances.map((balance) => (
                                            <div 
                                                key={balance.id} 
                                                className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge 
                                                        style={{ backgroundColor: balance.leave_types?.color || '#6366f1' }}
                                                        className="text-white"
                                                    >
                                                        {balance.leave_types?.name || 'Unknown'}
                                                    </Badge>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6"
                                                        onClick={() => {
                                                            setSelectedBalance(balance);
                                                            setAdjustmentData({ type: 'credit', days: '', reason: '' });
                                                            setShowAdjustDialog(true);
                                                        }}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                                    <div>
                                                        <span className="text-muted-foreground">Allocated:</span>
                                                        <span className="ml-1 font-medium">{balance.allocated_days || 0}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Used:</span>
                                                        <span className="ml-1 font-medium text-green-600">{balance.used_days || 0}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Pending:</span>
                                                        <span className="ml-1 font-medium text-orange-600">{balance.pending_days || 0}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Remaining:</span>
                                                        <span className={`ml-1 font-medium ${getRemainingDays(balance) < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                                            {getRemainingDays(balance)}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <Progress value={getUsagePercentage(balance)} className="h-1.5" />
                                                <p className="text-xs text-muted-foreground mt-1 text-right">
                                                    {getUsagePercentage(balance)}% used
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Adjust Balance Dialog */}
            <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Leave Balance</DialogTitle>
                        <DialogDescription>
                            Adjust balance for {getEmployeeName(selectedBalance?.employees)} - {selectedBalance?.leave_types?.name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="p-3 bg-muted rounded-lg text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div>Current Allocated: <span className="font-medium">{selectedBalance?.allocated_days || 0}</span></div>
                                <div>Used: <span className="font-medium">{selectedBalance?.used_days || 0}</span></div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Adjustment Type</Label>
                            <Select value={adjustmentData.type} onValueChange={(v) => setAdjustmentData({...adjustmentData, type: v})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="credit">Credit (Add Days)</SelectItem>
                                    <SelectItem value="debit">Debit (Remove Days)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Number of Days <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={adjustmentData.days}
                                onChange={(e) => setAdjustmentData({...adjustmentData, days: e.target.value})}
                                placeholder="e.g., 2"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Reason <span className="text-red-500">*</span></Label>
                            <Input
                                value={adjustmentData.reason}
                                onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
                                placeholder="e.g., Annual increment, Policy change"
                            />
                        </div>
                        
                        {adjustmentData.days && (
                            <div className="p-3 bg-blue-50 rounded-lg text-sm">
                                New Allocated Days: <span className="font-medium">
                                    {adjustmentData.type === 'credit' 
                                        ? (selectedBalance?.allocated_days || 0) + parseFloat(adjustmentData.days || 0)
                                        : (selectedBalance?.allocated_days || 0) - parseFloat(adjustmentData.days || 0)
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>Cancel</Button>
                        <Button onClick={handleAdjustBalance}>
                            Apply Adjustment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default LeaveBalance;
