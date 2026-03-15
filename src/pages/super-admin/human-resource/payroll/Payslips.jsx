import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, formatDateWithMonthName } from '@/utils/dateUtils';
import { 
    Loader2, Search, Eye, Download, Printer, FileText,
    IndianRupee, Users, Calendar, CheckCircle
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

const Payslips = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const printRef = useRef(null);
    
    // State
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [viewingPayslip, setViewingPayslip] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    // Fetch data
    const fetchPayslips = useCallback(async () => {
        if (!selectedBranch?.id || !currentSessionId) return;
        setLoading(true);
        try {
            let query = supabase
                .from('payslips')
                .select(`
                    *,
                    employees(id, first_name, last_name, employee_code, designations(name), departments(name)),
                    payroll_runs(status, processed_at)
                `)
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId)
                .order('created_at', { ascending: false });
            
            if (selectedMonth !== 'all') {
                query = query.eq('month', parseInt(selectedMonth));
            }
            query = query.eq('year', parseInt(selectedYear));
            
            const { data, error } = await query;
            
            if (error) throw error;
            setPayslips(data || []);
        } catch (error) {
            console.error('Error fetching payslips:', error);
            toast({ variant: 'destructive', title: 'Error loading payslips' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, currentSessionId, selectedMonth, selectedYear, toast]);

    useEffect(() => {
        fetchPayslips();
    }, [fetchPayslips]);

    // Stats
    const stats = useMemo(() => {
        const totalPayslips = payslips.length;
        const finalized = payslips.filter(p => p.status === 'finalized').length;
        const totalAmount = payslips.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
        return { totalPayslips, finalized, totalAmount };
    }, [payslips]);

    // Filtered payslips
    const filteredPayslips = useMemo(() => {
        if (!searchTerm) return payslips;
        const term = searchTerm.toLowerCase();
        return payslips.filter(p => 
            p.employees?.first_name?.toLowerCase().includes(term) ||
            p.employees?.last_name?.toLowerCase().includes(term) ||
            p.employees?.employee_code?.toLowerCase().includes(term)
        );
    }, [payslips, searchTerm]);

    // Generate years
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
    }, []);

    const handleViewPayslip = (payslip) => {
        setViewingPayslip(payslip);
        setShowViewDialog(true);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;
        
        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write('<html><head><title>Payslip</title>');
        printWindow.document.write(`
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 20px; }
                .header p { margin: 5px 0; color: #666; }
                .employee-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .info-block p { margin: 3px 0; }
                .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .salary-table th { background: #f5f5f5; }
                .totals { background: #f9f9f9; padding: 10px; border-radius: 5px; }
                .net-salary { font-size: 18px; font-weight: bold; color: green; }
                @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const getEmployeeName = (emp) => {
        if (!emp) return 'Unknown';
        return `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            Payslips
                        </h1>
                        <p className="text-muted-foreground">View and download employee payslips</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.totalPayslips}</p>
                                <p className="text-xs text-muted-foreground">Total Payslips</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.finalized}</p>
                                <p className="text-xs text-muted-foreground">Finalized</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">₹{stats.totalAmount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Total Amount</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by employee name or code..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Months</SelectItem>
                                        {MONTHS.map(m => (
                                            <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payslips Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead className="text-right">Gross Salary</TableHead>
                                    <TableHead className="text-right">Deductions</TableHead>
                                    <TableHead className="text-right">Net Salary</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPayslips.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No payslips found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayslips.map((payslip) => (
                                        <TableRow key={payslip.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {payslip.employees?.first_name?.[0]}{payslip.employees?.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{getEmployeeName(payslip.employees)}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {payslip.employees?.employee_code}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {MONTHS.find(m => m.value === payslip.month)?.label} {payslip.year}
                                                </div>
                                            </TableCell>
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
                                                    {payslip.status === 'finalized' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                    {payslip.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleViewPayslip(payslip)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* View Payslip Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Payslip Details</DialogTitle>
                    </DialogHeader>
                    
                    {viewingPayslip && (
                        <div ref={printRef}>
                            {/* Header */}
                            <div className="text-center border-b pb-4 mb-4">
                                <h2 className="text-xl font-bold">{selectedBranch?.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    Payslip for {MONTHS.find(m => m.value === viewingPayslip.month)?.label} {viewingPayslip.year}
                                </p>
                            </div>
                            
                            {/* Employee Info */}
                            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Employee Name</p>
                                    <p className="font-medium">{getEmployeeName(viewingPayslip.employees)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Employee Code</p>
                                    <p className="font-medium">{viewingPayslip.employees?.employee_code}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Designation</p>
                                    <p className="font-medium">{viewingPayslip.employees?.designations?.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Department</p>
                                    <p className="font-medium">{viewingPayslip.employees?.departments?.name || '-'}</p>
                                </div>
                            </div>
                            
                            {/* Salary Breakdown */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {/* Earnings */}
                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium text-green-700 mb-3">Earnings</h4>
                                    {viewingPayslip.earnings?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0">
                                            <span>{item.component_name}</span>
                                            <span className="font-medium">₹{Number(item.amount || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between mt-2 pt-2 border-t font-medium">
                                        <span>Total Earnings</span>
                                        <span className="text-green-600">₹{Number(viewingPayslip.gross_salary || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                {/* Deductions */}
                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium text-red-700 mb-3">Deductions</h4>
                                    {viewingPayslip.deductions?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0">
                                            <span>{item.component_name}</span>
                                            <span className="font-medium">₹{Number(item.amount || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {(!viewingPayslip.deductions || viewingPayslip.deductions.length === 0) && (
                                        <p className="text-sm text-muted-foreground">No deductions</p>
                                    )}
                                    <div className="flex justify-between mt-2 pt-2 border-t font-medium">
                                        <span>Total Deductions</span>
                                        <span className="text-red-600">₹{Number(viewingPayslip.total_deductions || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Net Salary */}
                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground mb-1">Net Salary</p>
                                <p className="text-3xl font-bold text-green-600">
                                    ₹{Number(viewingPayslip.net_salary || 0).toLocaleString()}
                                </p>
                            </div>
                            
                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
                                <p>This is a computer generated payslip and does not require signature.</p>
                                <p>Generated on: {formatDate(new Date())}</p>
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default Payslips;
