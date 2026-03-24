/**
 * Payroll Run - Monthly payroll processing
 * Using payroll_run and payroll_details tables
 */

import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import hrApi from '@/services/hrApi';
import { 
    Play, CheckCircle, Clock, AlertTriangle, IndianRupee, Users, 
    FileText, Download, Eye, Loader2, Calculator
} from 'lucide-react';

const PayrollRun = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [selectedRun, setSelectedRun] = useState(null);
    const [payrollDetails, setPayrollDetails] = useState([]);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [newRunDialogOpen, setNewRunDialogOpen] = useState(false);
    
    const organizationId = user?.organization_id;
    const branchId = user?.branch_id;
    
    const currentDate = new Date();
    const [newRunData, setNewRunData] = useState({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
    });
    
    const [stats, setStats] = useState({
        totalRuns: 0,
        completed: 0,
        draft: 0,
        totalPayout: 0
    });
    
    useEffect(() => {
        if (organizationId) {
            fetchPayrollRuns();
        }
    }, [organizationId]);
    
    const fetchPayrollRuns = async () => {
        setLoading(true);
        try {
            const res = await hrApi.getPayrollRuns({ organizationId });
            const runs = res.data?.data || [];
            setPayrollRuns(runs);
            
            // Calculate stats
            const completed = runs.filter(r => r.status === 'finalized').length;
            const draft = runs.filter(r => r.status === 'draft').length;
            const totalPayout = runs
                .filter(r => r.status === 'finalized')
                .reduce((sum, r) => sum + (parseFloat(r.total_net_pay) || 0), 0);
            
            setStats({
                totalRuns: runs.length,
                completed,
                draft,
                totalPayout
            });
        } catch (error) {
            console.error('Error fetching payroll runs:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleCreateRun = async () => {
        setProcessing(true);
        try {
            await hrApi.processPayroll({
                organizationId,
                branchId,
                month: newRunData.month,
                year: newRunData.year
            });
            
            toast({ title: 'Success', description: 'Payroll run created successfully' });
            setNewRunDialogOpen(false);
            fetchPayrollRuns();
        } catch (error) {
            toast({ 
                title: 'Error', 
                description: error.response?.data?.message || 'Failed to create payroll run', 
                variant: 'destructive' 
            });
        } finally {
            setProcessing(false);
        }
    };
    
    const handleViewDetails = async (run) => {
        setSelectedRun(run);
        try {
            const res = await hrApi.getPayrollDetails({ payrollRunId: run.id });
            setPayrollDetails(res.data?.data || []);
            setDetailsDialogOpen(true);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load payroll details', variant: 'destructive' });
        }
    };
    
    const handleFinalizeRun = async (runId) => {
        try {
            await hrApi.finalizePayroll({ payrollRunId: runId });
            toast({ title: 'Success', description: 'Payroll finalized successfully' });
            fetchPayrollRuns();
        } catch (error) {
            toast({ 
                title: 'Error', 
                description: error.response?.data?.message || 'Failed to finalize payroll', 
                variant: 'destructive' 
            });
        }
    };
    
    const getStatusBadge = (status) => {
        const variants = {
            draft: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
            processing: { color: 'bg-yellow-100 text-yellow-800', icon: Loader2, label: 'Processing' },
            finalized: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Finalized' },
            cancelled: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Cancelled' }
        };
        const config = variants[status] || variants.draft;
        const Icon = config.icon;
        
        return (
            <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        );
    };
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };
    
    const getMonthName = (month) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month - 1];
    };
    
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Payroll Processing</h1>
                    <p className="text-gray-500">Process and manage monthly payroll</p>
                </div>
                <Button onClick={() => setNewRunDialogOpen(true)}>
                    <Play className="w-4 h-4 mr-2" />
                    New Payroll Run
                </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Runs</p>
                                <p className="text-2xl font-bold">{stats.totalRuns}</p>
                            </div>
                            <Calculator className="w-8 h-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Finalized</p>
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Draft</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Payout</p>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalPayout)}</p>
                            </div>
                            <IndianRupee className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Payroll Runs List */}
            <Card>
                <CardHeader>
                    <CardTitle>Payroll Runs History</CardTitle>
                    <CardDescription>View and manage all payroll processing runs</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Run Date</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead>Total Gross</TableHead>
                                    <TableHead>Total Deductions</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payrollRuns.map(run => (
                                    <TableRow key={run.id}>
                                        <TableCell className="font-medium">
                                            {getMonthName(run.month)} {run.year}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(run.run_date)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                <Users className="w-3 h-3 mr-1" />
                                                {run.total_employees || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(run.total_gross_pay)}</TableCell>
                                        <TableCell className="text-red-600">{formatCurrency(run.total_deductions)}</TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(run.total_net_pay)}</TableCell>
                                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleViewDetails(run)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {run.status === 'draft' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="default"
                                                        onClick={() => handleFinalizeRun(run.id)}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {run.status === 'finalized' && (
                                                    <Button size="sm" variant="outline">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payrollRuns.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            No payroll runs found. Create your first payroll run.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            {/* New Payroll Run Dialog */}
            <Dialog open={newRunDialogOpen} onOpenChange={setNewRunDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Payroll Run</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Month</Label>
                                <Select 
                                    value={newRunData.month.toString()} 
                                    onValueChange={(v) => setNewRunData(prev => ({ ...prev, month: parseInt(v) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                {getMonthName(i + 1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <Select 
                                    value={newRunData.year.toString()} 
                                    onValueChange={(v) => setNewRunData(prev => ({ ...prev, year: parseInt(v) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const year = currentDate.getFullYear() - 2 + i;
                                            return (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">
                                This will calculate payroll for all active employees for 
                                <strong> {getMonthName(newRunData.month)} {newRunData.year}</strong>.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewRunDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateRun} disabled={processing}>
                            {processing ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                            ) : (
                                <><Play className="w-4 h-4 mr-2" /> Run Payroll</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Payroll Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Payroll Details - {selectedRun && `${getMonthName(selectedRun.month)} ${selectedRun.year}`}
                        </DialogTitle>
                    </DialogHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Working Days</TableHead>
                                <TableHead>Basic</TableHead>
                                <TableHead>Gross Pay</TableHead>
                                <TableHead>Deductions</TableHead>
                                <TableHead>Net Pay</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrollDetails.map(detail => (
                                <TableRow key={detail.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">
                                                {detail.employees?.first_name} {detail.employees?.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">{detail.employees?.emp_code}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {detail.days_present || 0} / {detail.days_in_month || 30}
                                    </TableCell>
                                    <TableCell>{formatCurrency(detail.basic_pay)}</TableCell>
                                    <TableCell>{formatCurrency(detail.gross_pay)}</TableCell>
                                    <TableCell className="text-red-600">{formatCurrency(detail.total_deductions)}</TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(detail.net_pay)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PayrollRun;
