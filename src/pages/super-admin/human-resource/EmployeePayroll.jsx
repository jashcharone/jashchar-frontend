import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Plus, Trash2, Printer, Save, IndianRupee, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const EmployeePayroll = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    
    // Search State
    const [searchParams, setSearchParams] = useState({
        role: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const [hasSearched, setHasSearched] = useState(false);
    const [staffList, setStaffList] = useState([]);

    // Modals State
    const [modals, setModals] = useState({
        generate: false,
        pay: false,
        view: false
    });
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Payroll Form State
    const [payrollForm, setPayrollForm] = useState({
        basic_salary: 0,
        earnings: [], // { type: '', amount: 0 }
        deductions: [], // { type: '', amount: 0 }
        tax: 0,
        net_salary: 0
    });

    // Payment Form State
    const [paymentForm, setPaymentForm] = useState({
        amount: 0,
        mode: 'Cash',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: ''
    });

    let branchId = user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    const months = [
        { val: 1, label: 'January' }, { val: 2, label: 'February' }, { val: 3, label: 'March' },
        { val: 4, label: 'April' }, { val: 5, label: 'May' }, { val: 6, label: 'June' },
        { val: 7, label: 'July' }, { val: 8, label: 'August' }, { val: 9, label: 'September' },
        { val: 10, label: 'October' }, { val: 11, label: 'November' }, { val: 12, label: 'December' }
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    useEffect(() => {
        if (branchId) {
            fetchRoles();
        }
    }, [branchId]);

    const fetchRoles = async () => {
        const { data } = await supabase
            .from('roles')
            .select('id, name')
            .eq('branch_id', branchId)
            .not('name', 'in', '("student","parent")');
        if (data) setRoles(data);
    };

    const handleSearch = async () => {
        if (!searchParams.role) {
            toast({ variant: "destructive", title: "Please select a role" });
            return;
        }
        if (!selectedBranch) {
            toast({ variant: "destructive", title: "Please select a branch" });
            return;
        }
        setLoading(true);
        setHasSearched(true);
        try {
            // 1. Fetch Staff by Role
            const { data: staffData, error: staffError } = await supabase
                .from('employee_profiles')
                .select('id, full_name, school_code, role:roles(name), basic_salary, department:departments(name), designation:designations(name), phone')
                .eq('branch_id', branchId)
                .eq('branch_id', selectedBranch.id)
                .eq('role_id', searchParams.role);
            
            if (staffError) throw staffError;

            // 2. Fetch Existing Payrolls for Month/Year
            const { data: payrollData, error: payrollError } = await supabase
                .from('staff_payroll')
                .select('*')
                .eq('branch_id', branchId)
                .eq('branch_id', selectedBranch.id)
                .eq('month', searchParams.month)
                .eq('year', searchParams.year);

            if (payrollError) throw payrollError;

            // 3. Merge Data
            const mergedList = staffData.map(staff => {
                const payroll = payrollData.find(p => p.staff_id === staff.id);
                return {
                    ...staff,
                    payroll_id: payroll?.id,
                    status: payroll?.status || 'Not Generated',
                    payroll_data: payroll
                };
            });

            setStaffList(mergedList);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error fetching data" });
        } finally {
            setLoading(false);
        }
    };

    // --- Generate / Edit Payroll Logic ---

    const openGenerateModal = async (staff) => {
        setSelectedStaff(staff);
        setProcessing(true);
        
        // Initialize Form
        let form = {
            basic_salary: staff.basic_salary || 0,
            earnings: [],
            deductions: [],
            tax: 0,
            net_salary: staff.basic_salary || 0
        };

        if (staff.payroll_id) {
            // Fetch details if editing
            const { data: earnings } = await supabase.from('staff_payroll_earnings').select('*').eq('payroll_id', staff.payroll_id);
            const { data: deductions } = await supabase.from('staff_payroll_deductions').select('*').eq('payroll_id', staff.payroll_id);
            
            form = {
                basic_salary: staff.payroll_data.basic_salary,
                earnings: earnings || [],
                deductions: deductions || [],
                tax: staff.payroll_data.tax || 0,
                net_salary: staff.payroll_data.net_salary
            };
        }

        setPayrollForm(form);
        setModals({ ...modals, generate: true });
        setProcessing(false);
    };

    const calculateTotal = () => {
        const totalEarnings = payrollForm.earnings.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalDeductions = payrollForm.deductions.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const gross = parseFloat(payrollForm.basic_salary || 0) + totalEarnings;
        const net = gross - totalDeductions - (parseFloat(payrollForm.tax) || 0);
        return { totalEarnings, totalDeductions, gross, net };
    };

    const handleSavePayroll = async () => {
        setProcessing(true);
        try {
            const { totalEarnings, totalDeductions, net } = calculateTotal();
            
            const payrollPayload = {
                branch_id: branchId,
                branch_id: selectedBranch.id,
                staff_id: selectedStaff.id,
                month: searchParams.month,
                year: searchParams.year,
                basic_salary: payrollForm.basic_salary,
                total_earnings: totalEarnings,
                total_deductions: totalDeductions,
                tax: payrollForm.tax,
                net_salary: net,
                status: 'Generated',
                generated_at: new Date().toISOString()
            };

            let payrollId = selectedStaff.payroll_id;

            if (payrollId) {
                // Update
                const { error } = await supabase.from('staff_payroll').update(payrollPayload).eq('id', payrollId);
                if (error) throw error;
                
                // Clear old details to rewrite
                await supabase.from('staff_payroll_earnings').delete().eq('payroll_id', payrollId);
                await supabase.from('staff_payroll_deductions').delete().eq('payroll_id', payrollId);
            } else {
                // Insert
                const { data, error } = await supabase.from('staff_payroll').insert(payrollPayload).select().single();
                if (error) throw error;
                payrollId = data.id;
            }

            // Insert Details
            if (payrollForm.earnings.length > 0) {
                await supabase.from('staff_payroll_earnings').insert(
                    payrollForm.earnings.map(e => ({ payroll_id: payrollId, type: e.type, amount: e.amount }))
                );
            }
            if (payrollForm.deductions.length > 0) {
                await supabase.from('staff_payroll_deductions').insert(
                    payrollForm.deductions.map(d => ({ payroll_id: payrollId, type: d.type, amount: d.amount }))
                );
            }

            toast({ title: "Payroll Saved Successfully" });
            setModals({ ...modals, generate: false });
            handleSearch(); // Refresh list
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Failed to save payroll", description: error.message });
        } finally {
            setProcessing(false);
        }
    };

    // --- Proceed to Pay Logic ---

    const openPayModal = (staff) => {
        setSelectedStaff(staff);
        setPaymentForm({
            amount: staff.payroll_data.net_salary,
            mode: 'Cash',
            date: format(new Date(), 'yyyy-MM-dd'),
            note: ''
        });
        setModals({ ...modals, pay: true });
    };

    const handleConfirmPayment = async () => {
        setProcessing(true);
        try {
            const { error } = await supabase.from('staff_payroll').update({
                status: 'Paid',
                payment_mode: paymentForm.mode,
                payment_date: paymentForm.date,
                note: paymentForm.note
            }).eq('id', selectedStaff.payroll_id);

            if (error) throw error;

            toast({ title: "Payment Recorded Successfully" });
            setModals({ ...modals, pay: false });
            handleSearch();
        } catch (error) {
            toast({ variant: "destructive", title: "Payment failed", description: error.message });
        } finally {
            setProcessing(false);
        }
    };

    // --- View / Revert Logic ---

    const openViewModal = async (staff) => {
        setSelectedStaff(staff);
        setProcessing(true);
        // Fetch details
        const { data: earnings } = await supabase.from('staff_payroll_earnings').select('*').eq('payroll_id', staff.payroll_id);
        const { data: deductions } = await supabase.from('staff_payroll_deductions').select('*').eq('payroll_id', staff.payroll_id);
        
        setPayrollForm({
            ...staff.payroll_data,
            earnings: earnings || [],
            deductions: deductions || []
        });
        setModals({ ...modals, view: true });
        setProcessing(false);
    };

    const handleRevert = async (staff) => {
        if (!window.confirm("Are you sure you want to revert this payroll? It will be deleted.")) return;
        try {
            const { error } = await supabase.from('staff_payroll').delete().eq('id', staff.payroll_id);
            if (error) throw error;
            toast({ title: "Reverted Successfully" });
            handleSearch();
        } catch (error) {
            toast({ variant: "destructive", title: "Revert failed" });
        }
    };

    // --- Helper Components ---

    const DynamicList = ({ items, setItems, title, type }) => (
        <div className="border rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sm">{title}</h4>
                <Button size="sm" variant="outline" onClick={() => setItems([...items, { type: '', amount: 0 }])}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
            </div>
            {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                    <Input 
                        placeholder="Type" 
                        value={item.type} 
                        onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].type = e.target.value;
                            setItems(newItems);
                        }}
                        className="h-8"
                    />
                    <Input 
                        type="number" 
                        placeholder="Amount" 
                        value={item.amount} 
                        onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].amount = e.target.value;
                            setItems(newItems);
                        }}
                        className="h-8 w-24"
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => {
                        const newItems = items.filter((_, i) => i !== idx);
                        setItems(newItems);
                    }}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    );

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Staff Payroll</h1>
                </div>

                {/* Search Section */}
                <Card>
                    <CardHeader><CardTitle className="text-lg">Select Criteria</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Role</Label>
                            <Select value={searchParams.role} onValueChange={(v) => setSearchParams({...searchParams, role: v})}>
                                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Month</Label>
                            <Select value={searchParams.month.toString()} onValueChange={(v) => setSearchParams({...searchParams, month: parseInt(v)})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {months.map(m => <SelectItem key={m.val} value={m.val.toString()}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Year</Label>
                            <Select value={searchParams.year.toString()} onValueChange={(v) => setSearchParams({...searchParams, year: parseInt(v)})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full" onClick={handleSearch} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Staff List */}
                {hasSearched && (
                    <Card>
                        <CardHeader><CardTitle>Staff List</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Designation</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffList.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-8">No staff found</TableCell></TableRow>
                                    ) : (
                                        staffList.map(staff => (
                                            <TableRow key={staff.id}>
                                                <TableCell>{staff.school_code}</TableCell>
                                                <TableCell className="font-medium">{staff.full_name}</TableCell>
                                                <TableCell>{staff.role?.name}</TableCell>
                                                <TableCell>{staff.department?.name || '-'}</TableCell>
                                                <TableCell>{staff.designation?.name || '-'}</TableCell>
                                                <TableCell>{staff.phone || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        staff.status === 'Paid' ? 'success' : 
                                                        staff.status === 'Generated' ? 'warning' : 'secondary'
                                                    }>
                                                        {staff.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {staff.status === 'Not Generated' && (
                                                        <Button size="sm" onClick={() => openGenerateModal(staff)}>Generate Payroll</Button>
                                                    )}
                                                    {staff.status === 'Generated' && (
                                                        <>
                                                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => openPayModal(staff)}>
                                                                Proceed to Pay
                                                            </Button>
                                                            <Button size="sm" variant="outline" onClick={() => openGenerateModal(staff)}>Edit</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleRevert(staff)}>Revert</Button>
                                                        </>
                                                    )}
                                                    {staff.status === 'Paid' && (
                                                        <>
                                                            <Button size="sm" variant="outline" onClick={() => openViewModal(staff)}>View Payslip</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleRevert(staff)}>Revert</Button>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Generate / Edit Modal */}
                <Dialog open={modals.generate} onOpenChange={(v) => setModals({...modals, generate: v})}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Generate Payroll - {selectedStaff?.full_name}</DialogTitle>
                            <DialogDescription>Month: {months.find(m => m.val === searchParams.month)?.label}, Year: {searchParams.year}</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <DynamicList 
                                    title="Earnings" 
                                    items={payrollForm.earnings} 
                                    setItems={(items) => setPayrollForm({...payrollForm, earnings: items})} 
                                />
                                <DynamicList 
                                    title="Deductions" 
                                    items={payrollForm.deductions} 
                                    setItems={(items) => setPayrollForm({...payrollForm, deductions: items})} 
                                />
                            </div>
                            <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                                <h4 className="font-bold border-b pb-2">Payroll Summary</h4>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <Label>Basic Salary</Label>
                                    <Input 
                                        type="number" 
                                        value={payrollForm.basic_salary} 
                                        onChange={(e) => setPayrollForm({...payrollForm, basic_salary: e.target.value})} 
                                    />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Total Earnings</span>
                                    <span className="font-medium text-green-600">+ {calculateTotal().totalEarnings}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Total Deductions</span>
                                    <span className="font-medium text-red-600">- {calculateTotal().totalDeductions}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <Label>Tax</Label>
                                    <Input 
                                        type="number" 
                                        value={payrollForm.tax} 
                                        onChange={(e) => setPayrollForm({...payrollForm, tax: e.target.value})} 
                                    />
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                                    <span className="font-bold text-lg">Net Salary</span>
                                    <span className="font-bold text-lg">₹ {calculateTotal().net}</span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModals({...modals, generate: false})}>Cancel</Button>
                            <Button onClick={handleSavePayroll} disabled={processing}>
                                {processing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Proceed to Pay Modal */}
                <Dialog open={modals.pay} onOpenChange={(v) => setModals({...modals, pay: v})}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Proceed to Pay</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Staff Name</Label>
                                    <Input value={selectedStaff?.full_name} disabled />
                                </div>
                                <div>
                                    <Label>Amount</Label>
                                    <Input value={paymentForm.amount} disabled />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Month</Label>
                                    <Input value={months.find(m => m.val === searchParams.month)?.label} disabled />
                                </div>
                                <div>
                                    <Label>Year</Label>
                                    <Input value={searchParams.year} disabled />
                                </div>
                            </div>
                            <div>
                                <Label>Payment Mode</Label>
                                <Select value={paymentForm.mode} onValueChange={(v) => setPaymentForm({...paymentForm, mode: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                        <SelectItem value="Online">Online Transfer</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Payment Date</Label>
                                <Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} />
                            </div>
                            <div>
                                <Label>Note</Label>
                                <Input value={paymentForm.note} onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModals({...modals, pay: false})}>Cancel</Button>
                            <Button onClick={handleConfirmPayment} disabled={processing}>
                                {processing ? <Loader2 className="animate-spin mr-2" /> : <IndianRupee className="mr-2 h-4 w-4" />}
                                Confirm Payment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* View Payslip Modal */}
                <Dialog open={modals.view} onOpenChange={(v) => setModals({...modals, view: v})}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex justify-between items-center">
                                <span>Payslip Details</span>
                                <Button size="sm" variant="outline" onClick={() => window.print()}>
                                    <Printer className="h-4 w-4 mr-2" /> Print
                                </Button>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-6" id="printable-payslip">
                            <div className="text-center border-b pb-4">
                                <h2 className="text-xl font-bold uppercase">Payslip for {months.find(m => m.val === searchParams.month)?.label} {searchParams.year}</h2>
                                <p className="text-muted-foreground">Staff ID: {selectedStaff?.school_code}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-semibold mb-2">Staff Details</h3>
                                    <div className="text-sm space-y-1">
                                        <p><span className="font-medium">Name:</span> {selectedStaff?.full_name}</p>
                                        <p><span className="font-medium">Role:</span> {selectedStaff?.role?.name}</p>
                                        <p><span className="font-medium">Department:</span> {selectedStaff?.department?.name}</p>
                                        <p><span className="font-medium">Designation:</span> {selectedStaff?.designation?.name}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Payment Details</h3>
                                    <div className="text-sm space-y-1">
                                        <p><span className="font-medium">Status:</span> {selectedStaff?.status}</p>
                                        <p><span className="font-medium">Mode:</span> {selectedStaff?.payroll_data?.payment_mode}</p>
                                        <p><span className="font-medium">Date:</span> {selectedStaff?.payroll_data?.payment_date ? format(new Date(selectedStaff.payroll_data.payment_date), 'dd MMM yyyy') : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border-t pt-4">
                                <div>
                                    <h4 className="font-semibold mb-2 text-green-700">Earnings</h4>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Basic Salary</TableCell>
                                                <TableCell className="text-right">₹{payrollForm.basic_salary}</TableCell>
                                            </TableRow>
                                            {payrollForm.earnings.map((e, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{e.type}</TableCell>
                                                    <TableCell className="text-right">₹{e.amount}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 text-red-700">Deductions</h4>
                                    <Table>
                                        <TableBody>
                                            {payrollForm.deductions.map((d, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{d.type}</TableCell>
                                                    <TableCell className="text-right">₹{d.amount}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell>Tax</TableCell>
                                                <TableCell className="text-right">₹{payrollForm.tax}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="bg-slate-100 p-4 rounded-md flex justify-between items-center">
                                <span className="font-bold text-lg">Net Salary</span>
                                <span className="font-bold text-xl">₹{payrollForm.net_salary}</span>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default EmployeePayroll;
