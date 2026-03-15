import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, formatDateWithMonthName } from '@/utils/dateUtils';
import { 
    Loader2, Plus, Eye, MoreHorizontal, Calendar, Play, CheckCircle,
    IndianRupee, Users, Calculator, FileText, Clock, AlertCircle,
    Download, Printer, XCircle, Pause
} from 'lucide-react';

// Months
const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

// Status
const RUN_STATUS = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const PayrollRun = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showRunDialog, setShowRunDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [viewingRun, setViewingRun] = useState(null);
    const [viewingPayslips, setViewingPayslips] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [employeeStructures, setEmployeeStructures] = useState([]);
    const [processProgress, setProcessProgress] = useState(0);

    // Fetch data
    const fetchPayrollRuns = useCallback(async () => {
        if (!selectedBranch?.id || !currentSessionId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payroll_runs')
                .select(`
                    *,
                    processed_by_user:employees!payroll_runs_processed_by_fkey(first_name, last_name)
                `)
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setPayrollRuns(data || []);
        } catch (error) {
            console.error('Error fetching payroll runs:', error);
            toast({ variant: 'destructive', title: 'Error loading payroll runs' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, currentSessionId, toast]);

    const fetchEmployeeStructures = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('employee_salary_structures')
                .select(`
                    *,
                    employees(id, first_name, last_name, employee_code, designations(name), departments(name))
                `)
                .eq('branch_id', selectedBranch.id)
                .eq('is_active', true);
            setEmployeeStructures(data || []);
        } catch (error) {
            console.error('Error:', error);
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        fetchPayrollRuns();
        fetchEmployeeStructures();
    }, [fetchPayrollRuns, fetchEmployeeStructures]);

    // Stats
    const stats = useMemo(() => {
        const totalRuns = payrollRuns.length;
        const completed = payrollRuns.filter(r => r.status === 'completed').length;
        const totalDisbursed = payrollRuns
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + Number(r.total_net_salary || 0), 0);
        const pending = payrollRuns.filter(r => r.status === 'draft').length;
        return { totalRuns, completed, totalDisbursed, pending };
    }, [payrollRuns]);

    // Check if payroll exists for selected month/year
    const existingRun = useMemo(() => {
        return payrollRuns.find(r => r.month === selectedMonth && r.year === selectedYear);
    }, [payrollRuns, selectedMonth, selectedYear]);

    // Generate years
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return [currentYear - 1, currentYear, currentYear + 1];
    }, []);

    // Handler functions
    const handleCreateRun = async () => {
        if (existingRun) {
            toast({ variant: 'destructive', title: `Payroll already exists for ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}` });
            return;
        }
        
        if (employeeStructures.length === 0) {
            toast({ variant: 'destructive', title: 'No employee salary structures found. Please assign salary structures first.' });
            return;
        }
        
        setProcessing(true);
        setProcessProgress(0);
        
        try {
            // Create payroll run
            const totalGross = employeeStructures.reduce((sum, s) => sum + Number(s.gross_salary || 0), 0);
            const totalDeductions = employeeStructures.reduce((sum, s) => sum + Number(s.total_deductions || 0), 0);
            const totalNet = employeeStructures.reduce((sum, s) => sum + Number(s.net_salary || 0), 0);
            
            const { data: runData, error: runError } = await supabase
                .from('payroll_runs')
                .insert({
                    month: selectedMonth,
                    year: selectedYear,
                    status: 'draft',
                    employee_count: employeeStructures.length,
                    total_gross_salary: totalGross,
                    total_deductions: totalDeductions,
                    total_net_salary: totalNet,
                    branch_id: selectedBranch.id,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                })
                .select()
                .single();
            
            if (runError) throw runError;
            
            // Generate payslips for each employee
            const payslips = employeeStructures.map((structure, idx) => ({
                payroll_run_id: runData.id,
                employee_id: structure.employee_id,
                month: selectedMonth,
                year: selectedYear,
                salary_structure_id: structure.id,
                earnings: structure.components?.filter(c => c.component_type === 'earning') || [],
                deductions: structure.components?.filter(c => c.component_type === 'deduction') || [],
                gross_salary: structure.gross_salary,
                total_deductions: structure.total_deductions,
                net_salary: structure.net_salary,
                status: 'generated',
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                organization_id: organizationId,
            }));
            
            // Insert payslips
            for (let i = 0; i < payslips.length; i++) {
                const { error } = await supabase.from('payslips').insert(payslips[i]);
                if (error) console.error('Error inserting payslip:', error);
                setProcessProgress(Math.round(((i + 1) / payslips.length) * 100));
            }
            
            toast({ title: `Payroll run created with ${payslips.length} payslips` });
            setShowRunDialog(false);
            fetchPayrollRuns();
        } catch (error) {
            console.error('Error:', error);
            toast({ variant: 'destructive', title: 'Error creating payroll run' });
        } finally {
            setProcessing(false);
            setProcessProgress(0);
        }
    };

    const handleProcessRun = async (run) => {
        if (!confirm('Process this payroll run? This will finalize all payslips.')) return;
        
        try {
            const { error } = await supabase
                .from('payroll_runs')
                .update({ 
                    status: 'completed',
                    processed_by: user?.employee_id,
                    processed_at: new Date().toISOString(),
                })
                .eq('id', run.id);
            
            if (error) throw error;
            
            // Update payslip status
            await supabase
                .from('payslips')
                .update({ status: 'finalized' })
                .eq('payroll_run_id', run.id);
            
            toast({ title: 'Payroll processed successfully' });
            fetchPayrollRuns();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error processing payroll' });
        }
    };

    const handleCancelRun = async (run) => {
        if (!confirm('Cancel this payroll run?')) return;
        
        try {
            const { error } = await supabase
                .from('payroll_runs')
                .update({ status: 'cancelled' })
                .eq('id', run.id);
            
            if (error) throw error;
            toast({ title: 'Payroll run cancelled' });
            fetchPayrollRuns();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error cancelling payroll' });
        }
    };

    const handleViewRun = async (run) => {
        setViewingRun(run);
        
        // Fetch payslips for this run
        try {
            const { data } = await supabase
                .from('payslips')
                .select(`
                    *,
                    employees(first_name, last_name, employee_code, designations(name))
                `)
                .eq('payroll_run_id', run.id)
                .order('employees(first_name)');
            setViewingPayslips(data || []);
        } catch (error) {
            console.error('Error:', error);
        }
        
        setShowViewDialog(true);
    };

    const getStatusConfig = (status) => RUN_STATUS[status] || RUN_STATUS.draft;

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calculator className="h-6 w-6 text-primary" />
                            Payroll Run
                        </h1>
                        <p className="text-muted-foreground">Process monthly payroll and generate payslips</p>
                    </div>
                    <Button onClick={() => setShowRunDialog(true)}>
                        <Play className="h-4 w-4 mr-2" />
                        New Payroll Run
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.totalRuns}</p>
                                <p className="text-xs text-muted-foreground">Total Runs</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">₹{stats.totalDisbursed.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Total Disbursed</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-yellow-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payroll Runs List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payroll History</CardTitle>
                        <CardDescription>All payroll runs for the current session</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead>Gross Salary</TableHead>
                                    <TableHead>Deductions</TableHead>
                                    <TableHead>Net Salary</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Processed</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24">
                                            <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : payrollRuns.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                            No payroll runs yet. Create your first payroll run.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payrollRuns.map((run) => {
                                        const statusConfig = getStatusConfig(run.status);
                                        const StatusIcon = statusConfig.icon;
                                        return (
                                            <TableRow key={run.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {MONTHS.find(m => m.value === run.month)?.label} {run.year}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{run.employee_count} employees</Badge>
                                                </TableCell>
                                                <TableCell>₹{Number(run.total_gross_salary || 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-red-600">₹{Number(run.total_deductions || 0).toLocaleString()}</TableCell>
                                                <TableCell className="font-bold text-green-600">
                                                    ₹{Number(run.total_net_salary || 0).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusConfig.color}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {run.processed_at ? (
                                                        <div className="text-xs">
                                                            <p>{formatDate(run.processed_at)}</p>
                                                            <p className="text-muted-foreground">
                                                                {run.processed_by_user?.first_name} {run.processed_by_user?.last_name}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleViewRun(run)}>
                                                                <Eye className="h-4 w-4 mr-2" /> View Details
                                                            </DropdownMenuItem>
                                                            {run.status === 'draft' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => handleProcessRun(run)}>
                                                                        <CheckCircle className="h-4 w-4 mr-2" /> Process Payroll
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleCancelRun(run)} className="text-red-600">
                                                                        <XCircle className="h-4 w-4 mr-2" /> Cancel Run
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Create Run Dialog */}
            <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Payroll Run</DialogTitle>
                        <DialogDescription>
                            Generate payslips for all employees with active salary structures
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Month</Label>
                                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map(m => (
                                            <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {existingRun && (
                            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Payroll already exists for this period</span>
                            </div>
                        )}
                        
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <p className="font-medium">Payroll Summary</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-muted-foreground">Employees:</span>
                                <span className="font-medium">{employeeStructures.length}</span>
                                <span className="text-muted-foreground">Total Gross:</span>
                                <span className="font-medium">
                                    ₹{employeeStructures.reduce((sum, s) => sum + Number(s.gross_salary || 0), 0).toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">Total Deductions:</span>
                                <span className="font-medium text-red-600">
                                    ₹{employeeStructures.reduce((sum, s) => sum + Number(s.total_deductions || 0), 0).toLocaleString()}
                                </span>
                                <span className="text-muted-foreground">Net Payable:</span>
                                <span className="font-bold text-green-600">
                                    ₹{employeeStructures.reduce((sum, s) => sum + Number(s.net_salary || 0), 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        
                        {processing && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Generating payslips...</p>
                                <Progress value={processProgress} />
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRunDialog(false)} disabled={processing}>Cancel</Button>
                        <Button onClick={handleCreateRun} disabled={processing || existingRun || employeeStructures.length === 0}>
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Create Payroll Run
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Run Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Payroll Run - {MONTHS.find(m => m.value === viewingRun?.month)?.label} {viewingRun?.year}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {viewingRun && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-3 bg-muted rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground">Employees</p>
                                    <p className="text-lg font-bold">{viewingRun.employee_count}</p>
                                </div>
                                <div className="p-3 bg-muted rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground">Gross</p>
                                    <p className="text-lg font-bold">₹{Number(viewingRun.total_gross_salary || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-muted rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground">Deductions</p>
                                    <p className="text-lg font-bold text-red-600">₹{Number(viewingRun.total_deductions || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground">Net Payable</p>
                                    <p className="text-lg font-bold text-green-600">₹{Number(viewingRun.total_net_salary || 0).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            {/* Payslips List */}
                            <div className="border rounded-lg">
                                <div className="p-3 bg-muted/50 border-b">
                                    <h4 className="font-medium">Employee Payslips ({viewingPayslips.length})</h4>
                                </div>
                                <ScrollArea className="h-[400px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Designation</TableHead>
                                                <TableHead className="text-right">Gross</TableHead>
                                                <TableHead className="text-right">Deductions</TableHead>
                                                <TableHead className="text-right">Net</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewingPayslips.map((payslip) => (
                                                <TableRow key={payslip.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">
                                                                {payslip.employees?.first_name} {payslip.employees?.last_name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {payslip.employees?.employee_code}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{payslip.employees?.designations?.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        ₹{Number(payslip.gross_salary || 0).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600">
                                                        ₹{Number(payslip.total_deductions || 0).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">
                                                        ₹{Number(payslip.net_salary || 0).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={payslip.status === 'finalized' ? 'default' : 'secondary'}>
                                                            {payslip.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default PayrollRun;
