/**
 * Employee Loans Management
 * Using employee_loans table
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import hrApi from '@/services/hrApi';
import { 
    Plus, IndianRupee, CheckCircle, XCircle, Clock, 
    FileText, Users, Calculator, Loader2, Eye
} from 'lucide-react';

const LoansManagement = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [loans, setLoans] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    
    const organizationId = user?.organization_id;
    const branchId = user?.branch_id;
    
    const [formData, setFormData] = useState({
        employee_id: '',
        loan_type: 'personal',
        principal_amount: '',
        interest_rate: '0',
        tenure_months: '12',
        emi_start_date: '',
        remarks: ''
    });
    
    const [stats, setStats] = useState({
        totalLoans: 0,
        active: 0,
        totalDisbursed: 0,
        totalOutstanding: 0
    });
    
    useEffect(() => {
        if (organizationId) {
            fetchLoans();
            fetchEmployees();
        }
    }, [organizationId]);
    
    const fetchEmployees = async () => {
        try {
            const res = await hrApi.getEmployees({ organizationId, status: 'active' });
            setEmployees(res.data?.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };
    
    const fetchLoans = async () => {
        setLoading(true);
        try {
            const res = await hrApi.getLoans({ organizationId });
            const loansData = res.data?.data || [];
            setLoans(loansData);
            
            // Calculate stats
            const active = loansData.filter(l => l.status === 'active').length;
            const totalDisbursed = loansData.reduce((sum, l) => sum + (parseFloat(l.principal_amount) || 0), 0);
            const totalOutstanding = loansData
                .filter(l => l.status === 'active')
                .reduce((sum, l) => sum + (parseFloat(l.outstanding_balance) || 0), 0);
            
            setStats({
                totalLoans: loansData.length,
                active,
                totalDisbursed,
                totalOutstanding
            });
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const calculateEmi = () => {
        const P = parseFloat(formData.principal_amount) || 0;
        const r = (parseFloat(formData.interest_rate) || 0) / 100 / 12;
        const n = parseInt(formData.tenure_months) || 12;
        
        if (r === 0) return P / n;
        
        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        return emi;
    };
    
    const handleSubmit = async () => {
        if (!formData.employee_id || !formData.principal_amount) {
            toast({ title: 'Error', description: 'Employee and amount are required', variant: 'destructive' });
            return;
        }
        
        try {
            const emi = calculateEmi();
            await hrApi.createLoan({
                organization_id: organizationId,
                branch_id: branchId,
                employee_id: formData.employee_id,
                loan_type: formData.loan_type,
                principal_amount: parseFloat(formData.principal_amount),
                interest_rate: parseFloat(formData.interest_rate) || 0,
                tenure_months: parseInt(formData.tenure_months),
                emi_amount: Math.round(emi),
                outstanding_balance: parseFloat(formData.principal_amount),
                emi_start_date: formData.emi_start_date || null,
                remarks: formData.remarks || null
            });
            
            toast({ title: 'Success', description: 'Loan created successfully' });
            setAddDialogOpen(false);
            setFormData({
                employee_id: '',
                loan_type: 'personal',
                principal_amount: '',
                interest_rate: '0',
                tenure_months: '12',
                emi_start_date: '',
                remarks: ''
            });
            fetchLoans();
        } catch (error) {
            toast({ 
                title: 'Error', 
                description: error.response?.data?.message || 'Failed to create loan', 
                variant: 'destructive' 
            });
        }
    };
    
    const handleApproveLoan = async (loanId, approved) => {
        try {
            await hrApi.approveLoan({ loanId, status: approved ? 'active' : 'rejected' });
            toast({ title: 'Success', description: `Loan ${approved ? 'approved' : 'rejected'} successfully` });
            fetchLoans();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update loan status', variant: 'destructive' });
        }
    };
    
    const getStatusBadge = (status) => {
        const variants = {
            pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400', label: 'Pending' },
            active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400', label: 'Active' },
            completed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400', label: 'Completed' },
            rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400', label: 'Rejected' }
        };
        const config = variants[status] || variants.pending;
        return <Badge className={config.color}>{config.label}</Badge>;
    };
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };
    
    const loanTypes = [
        { value: 'personal', label: 'Personal Loan' },
        { value: 'emergency', label: 'Emergency Loan' },
        { value: 'advance', label: 'Salary Advance' },
        { value: 'festival', label: 'Festival Advance' },
        { value: 'other', label: 'Other' }
    ];
    
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Employee Loans</h1>
                    <p className="text-muted-foreground">Manage employee loans and advances</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Loan
                </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Loans</p>
                                <p className="text-2xl font-bold">{stats.totalLoans}</p>
                            </div>
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Loans</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Disbursed</p>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalDisbursed)}</p>
                            </div>
                            <IndianRupee className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Outstanding</p>
                                <p className="text-xl font-bold text-orange-600">{formatCurrency(stats.totalOutstanding)}</p>
                            </div>
                            <Calculator className="w-8 h-8 text-orange-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Loans List */}
            <Card>
                <CardHeader>
                    <CardTitle>Loans List</CardTitle>
                    <CardDescription>View and manage all employee loans</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Loan Type</TableHead>
                                    <TableHead>Principal</TableHead>
                                    <TableHead>EMI</TableHead>
                                    <TableHead>Outstanding</TableHead>
                                    <TableHead>Tenure</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loans.map(loan => (
                                    <TableRow key={loan.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {loan.employees?.first_name} {loan.employees?.last_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{loan.employees?.emp_code}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{loan.loan_type?.replace('_', ' ')}</TableCell>
                                        <TableCell>{formatCurrency(loan.principal_amount)}</TableCell>
                                        <TableCell>{formatCurrency(loan.emi_amount)}</TableCell>
                                        <TableCell className="text-orange-600 font-medium">
                                            {formatCurrency(loan.outstanding_balance)}
                                        </TableCell>
                                        <TableCell>{loan.tenure_months} months</TableCell>
                                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedLoan(loan);
                                                        setViewDialogOpen(true);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {loan.status === 'pending' && (
                                                    <>
                                                        <Button 
                                                            size="sm" 
                                                            variant="default"
                                                            onClick={() => handleApproveLoan(loan.id, true)}
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="destructive"
                                                            onClick={() => handleApproveLoan(loan.id, false)}
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {loans.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No loans found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            {/* Add Loan Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Loan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Employee *</Label>
                            <Select value={formData.employee_id} onValueChange={(v) => handleChange('employee_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name} ({emp.emp_code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Loan Type</Label>
                                <Select value={formData.loan_type} onValueChange={(v) => handleChange('loan_type', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loanTypes.map(type => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Principal Amount *</Label>
                                <Input
                                    type="number"
                                    value={formData.principal_amount}
                                    onChange={(e) => handleChange('principal_amount', e.target.value)}
                                    placeholder="Enter amount"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Interest Rate (% p.a.)</Label>
                                <Input
                                    type="number"
                                    value={formData.interest_rate}
                                    onChange={(e) => handleChange('interest_rate', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tenure (months)</Label>
                                <Input
                                    type="number"
                                    value={formData.tenure_months}
                                    onChange={(e) => handleChange('tenure_months', e.target.value)}
                                    placeholder="12"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>EMI Start Date</Label>
                            <Input
                                type="date"
                                value={formData.emi_start_date}
                                onChange={(e) => handleChange('emi_start_date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Remarks</Label>
                            <Textarea
                                value={formData.remarks}
                                onChange={(e) => handleChange('remarks', e.target.value)}
                                placeholder="Additional notes..."
                            />
                        </div>
                        
                        {formData.principal_amount && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Calculated EMI:</strong> {formatCurrency(calculateEmi())}/month
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Loan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* View Loan Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Loan Details</DialogTitle>
                    </DialogHeader>
                    {selectedLoan && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Employee</p>
                                    <p className="font-medium">
                                        {selectedLoan.employees?.first_name} {selectedLoan.employees?.last_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Loan Type</p>
                                    <p className="font-medium capitalize">{selectedLoan.loan_type?.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Principal Amount</p>
                                    <p className="font-medium">{formatCurrency(selectedLoan.principal_amount)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                                    <p className="font-medium">{selectedLoan.interest_rate}% p.a.</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">EMI Amount</p>
                                    <p className="font-medium">{formatCurrency(selectedLoan.emi_amount)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tenure</p>
                                    <p className="font-medium">{selectedLoan.tenure_months} months</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                    <p className="font-medium text-orange-600">{formatCurrency(selectedLoan.outstanding_balance)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    {getStatusBadge(selectedLoan.status)}
                                </div>
                            </div>
                            {selectedLoan.remarks && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Remarks</p>
                                    <p>{selectedLoan.remarks}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LoansManagement;
