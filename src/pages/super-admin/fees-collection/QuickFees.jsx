import React, { useState, useEffect, useMemo } from 'react';
import { addMonths, setDate } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Plus, Trash2, Printer } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

const QuickFees = () => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('all');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [feeData, setFeeData] = useState({
        totalFees: '1000',
        firstInstallment: '100',
        numInstallments: '9',
        monthlyDueDate: '10',
        fineType: 'None',
        fineValue: ''
    });
    const [installments, setInstallments] = useState([]);
    const [isAssigned, setIsAssigned] = useState(false);
    const [assignedGroupId, setAssignedGroupId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const branchId = user?.profile?.branch_id;

    useEffect(() => {
        if (!branchId || !selectedBranch) return;
        const fetchClassesAndSections = async () => {
            const { data: classesData } = await supabase.from('classes').select('id, name').eq('branch_id', selectedBranch.id);
            setClasses(classesData || []);
        };
        fetchClassesAndSections();
    }, [branchId, selectedBranch]);

    useEffect(() => {
        if (selectedClass && selectedBranch) {
             const fetchSections = async () => {
                // Filter sections by branch_id using inner join
                const { data } = await supabase.from('class_sections')
                    .select('sections!inner(id, name)')
                    .eq('class_id', selectedClass)
                    .eq('sections.branch_id', selectedBranch.id);
                setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
            };
            fetchSections();
        } else {
            setSections([]);
        }
        setSelectedSection('all');
    }, [selectedClass, selectedBranch]);

    useEffect(() => {
        if (selectedClass && selectedBranch) {
            const fetchStudents = async () => {
                // Get active session for selected branch
                const { data: branchSession } = await supabase
                    .from('sessions')
                    .select('id')
                    .eq('branch_id', selectedBranch.id)
                    .eq('is_active', true)
                    .maybeSingle();
                
                const activeSessionId = branchSession?.id;
                
                // Filter by branch's active session - use student_profiles table
                let query = supabase.from('student_profiles')
                    .select('id, full_name, school_code, session_id')
                    .eq('branch_id', selectedBranch.id)
                    .eq('class_id', selectedClass);
                
                if (activeSessionId) {
                    query = query.eq('session_id', activeSessionId);
                }

                if (selectedSection && selectedSection !== 'all') {
                    query = query.eq('section_id', selectedSection);
                }

                const { data, error } = await query;

                if (error) {
                    toast({ variant: 'destructive', title: 'Error fetching students' });
                } else {
                    setStudents(data || []);
                }
            };
            fetchStudents();
        } else {
            setStudents([]);
        }
        setSelectedStudentId('');
        resetForm();
    }, [selectedClass, selectedSection, branchId, currentSessionId, selectedBranch, toast]);
    
    useEffect(() => {
        if (selectedStudentId) {
            const student = students.find(s => s.id === selectedStudentId);
            setSelectedStudent(student);
            checkForAssignedFees(selectedStudentId, student);
        } else {
            setSelectedStudent(null);
            resetForm();
        }
    }, [selectedStudentId, students]);

    const resetForm = () => {
        setFeeData({ totalFees: '1000', firstInstallment: '100', numInstallments: '9', monthlyDueDate: '10', fineType: 'None', fineValue: '' });
        setInstallments([]);
        setIsAssigned(false);
        setAssignedGroupId(null);
    }
    
    const checkForAssignedFees = async (studentId, student) => {
        if (!student) return;
        setFetching(true);
        const groupName = `Quick Fees - ${student.school_code || student.id}`;
        const { data: feeGroups, error } = await supabase.from('fee_groups').select('id').eq('name', groupName).eq('branch_id', branchId);

        if (error) {
             toast({ variant: 'destructive', title: 'Error Checking Fees', description: error.message });
             setIsAssigned(false);
        } else if (feeGroups && feeGroups.length > 0) {
             setIsAssigned(true);
             setAssignedGroupId(feeGroups[0].id);
             // If already assigned, we should ideally load the installments to show them.
             // For simplicity in this view, we might just show the unassign option or reload the list.
             // Let's try to load them to display.
             loadAssignedInstallments(feeGroups[0].id, studentId);
        } else {
            setIsAssigned(false);
        }
        setFetching(false);
    }

    const loadAssignedInstallments = async (groupId, studentId) => {
        const { data: masters } = await supabase
            .from('fee_masters')
            .select(`
                *,
                fee_types (name, code),
                fee_groups (name)
            `)
            .eq('fee_group_id', groupId)
            .order('due_date', { ascending: true });

        if (masters) {
            const formatted = masters.map(m => ({
                fee_group: m.fee_groups?.name,
                fee_type: m.fee_types?.name,
                fee_code: m.fee_types?.code,
                due_date: m.due_date,
                fine_type: m.fine_type || 'None',
                fine_value: m.fine_value,
                amount: m.amount
            }));
            setInstallments(formatted);
        }
    };

    const balanceFees = useMemo(() => {
        return (Number(feeData.totalFees) || 0) - (Number(feeData.firstInstallment) || 0);
    }, [feeData.totalFees, feeData.firstInstallment]);

    const handleViewInstallments = () => {
        if (!feeData.numInstallments || balanceFees < 0 || !feeData.monthlyDueDate) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill all required fields correctly.' });
            return;
        }

        const installmentAmount = Number(feeData.numInstallments) > 0 ? balanceFees / Number(feeData.numInstallments) : 0;
        const generated = [];
        let currentDate = new Date();
        
        if (Number(feeData.firstInstallment) > 0) {
             generated.push({
                fee_group: `Quick Fees - ${selectedStudent.school_code || selectedStudent.id}`,
                fee_type: 'Installment-1',
                fee_code: `QF-${selectedStudent.school_code || selectedStudent.id}-1`,
                due_date: new Date().toISOString().split('T')[0], // Due today or configurable? Assuming today for 1st.
                fine_type: feeData.fineType,
                fine_value: feeData.fineValue || null,
                amount: Number(feeData.firstInstallment).toFixed(2),
            });
        }

        for (let i = 0; i < Number(feeData.numInstallments); i++) {
            // Start installments next month if first installment exists, or this month?
            // Usually installment 1 is immediate, subsequent are monthly.
            // Let's align with prompt: "Monthly Day for Due Date".
            const nextMonth = addMonths(currentDate, i + (Number(feeData.firstInstallment) > 0 ? 1 : 0));
            // Set the specific day
            const dueDate = setDate(nextMonth, Number(feeData.monthlyDueDate));
            
            generated.push({
                fee_group: `Quick Fees - ${selectedStudent.school_code || selectedStudent.id}`,
                fee_type: `Installment-${i + (Number(feeData.firstInstallment) > 0 ? 2 : 1)}`,
                fee_code: `QF-${selectedStudent.school_code || selectedStudent.id}-${i + (Number(feeData.firstInstallment) > 0 ? 2 : 1)}`,
                due_date: dueDate.toISOString().split('T')[0],
                fine_type: feeData.fineType,
                fine_value: feeData.fineValue || null,
                amount: installmentAmount.toFixed(2),
            });
        }

        setInstallments(generated);
    };
    
    const handleSave = async () => {
        if (!selectedBranch) return;
        setLoading(true);
        try {
            // Use backend API to bypass RLS
            const response = await api.post('/fees/quick-assign', {
                branchId: selectedBranch.id,
                studentId: selectedStudentId,
                studentSchoolCode: selectedStudent.school_code || selectedStudent.id,
                installments: installments.map(inst => ({
                    fee_type: inst.fee_type,
                    fee_code: inst.fee_code,
                    due_date: inst.due_date,
                    amount: inst.amount,
                    fine_type: inst.fine_type,
                    fine_value: inst.fine_value
                }))
            });

            if (response.data.success) {
                toast({ title: 'Success', description: 'Fee assigned successfully' });
                setIsAssigned(true);
                setAssignedGroupId(response.data.feeGroupId);
            } else {
                throw new Error(response.data.message || 'Failed to assign fees');
            }

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Operation Failed', description: error.response?.data?.message || error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async () => {
        setLoading(true);
         if (!assignedGroupId) {
             toast({ variant: 'destructive', title: 'No assigned group ID found!' });
             setLoading(false);
             return;
         };
         try {
            // Use backend API to bypass RLS
            const response = await api.post('/fees/quick-unassign', {
                feeGroupId: assignedGroupId
            });

            if (response.data.success) {
                toast({ title: "Fees Unassigned Successfully" });
                setIsAssigned(false);
                setAssignedGroupId(null);
                setInstallments([]);
            } else {
                throw new Error(response.data.message || 'Failed to unassign fees');
            }
         } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message;
            if (errorMsg.includes('Payments have been made')) {
                toast({ variant: 'destructive', title: 'Cannot Unassign', description: errorMsg });
            } else {
                toast({ variant: 'destructive', title: 'Unassign Failed', description: errorMsg });
            }
         } finally {
             setLoading(false);
         }
    }

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quick Fees Master</h1>
            </div>

            <div className="bg-card p-6 rounded-lg shadow space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Section</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                            <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Student</Label>
                        <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!selectedClass}>
                            <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                            <SelectContent>
                                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.school_code || '-'})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {fetching ? (
                    <div className="flex justify-center items-center h-20 border-t pt-4">
                        <Loader2 className="animate-spin h-8 w-8 text-primary"/>
                    </div>
                ) : selectedStudent && (
                    <div className="pt-6 border-t space-y-6">
                        {/* Info Message if Assigned */}
                        {isAssigned && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-bold">Fee assigned successfully</p>
                                </div>
                            </div>
                        )}

                        {/* Form Fields - Hide inputs if assigned (read-only view essentially, or just show list) 
                            Actually prompt implies we might want to edit? But usually quick fees is a generator.
                            Let's hide inputs if assigned to prevent confusion, or just disable.
                        */}
                        {!isAssigned && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <Label>Total Fees <span className="text-red-500">*</span></Label>
                                        <Input type="number" value={feeData.totalFees} onChange={e => setFeeData({...feeData, totalFees: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>1st Installment</Label>
                                        <Input type="number" value={feeData.firstInstallment} onChange={e => setFeeData({...feeData, firstInstallment: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Balance Fees <span className="text-red-500">*</span></Label>
                                        <Input type="number" value={balanceFees} readOnly className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>No. Of Installment <span className="text-red-500">*</span></Label>
                                        <Input type="number" min="0" value={feeData.numInstallments} onChange={e => setFeeData({...feeData, numInstallments: e.target.value})} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                    <div className="space-y-2">
                                        <Label>Monthly Day for Due date</Label>
                                        <Select value={feeData.monthlyDueDate} onValueChange={v => setFeeData({...feeData, monthlyDueDate: v})}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                                                    <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fine Type</Label>
                                        <Select value={feeData.fineType} onValueChange={v => setFeeData({...feeData, fineType: v})}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="None">None</SelectItem>
                                                <SelectItem value="Fixed">Fix Amount</SelectItem>
                                                <SelectItem value="Percentage">Percentage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fine Type Value <span className="text-red-500">*</span></Label>
                                        <Input 
                                            type="number" 
                                            value={feeData.fineValue} 
                                            onChange={e => setFeeData({...feeData, fineValue: e.target.value})} 
                                            disabled={feeData.fineType === 'None'}
                                        />
                                    </div>
                                    <div>
                                        <Button onClick={handleViewInstallments} className="w-full bg-gray-600 hover:bg-gray-700">View Installment</Button>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {installments.length > 0 && (
                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg">Fees List</h3>
                                    <div className="space-x-2">
                                        {isAssigned && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" className="bg-black hover:bg-gray-800 text-white">
                                                        Unassign Fees
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure you want to unassign fees?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action is irreversible!
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleUnassign} className="bg-blue-600">OK</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr className="text-left border-b">
                                                <th className="p-3 font-medium text-muted-foreground">Fees Group</th>
                                                <th className="p-3 font-medium text-muted-foreground">Fees Type</th>
                                                <th className="p-3 font-medium text-muted-foreground">Due Date</th>
                                                <th className="p-3 font-medium text-muted-foreground">Fine Amount ($)</th>
                                                <th className="p-3 font-medium text-muted-foreground text-right">Amount ($)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {installments.map((inst, idx) => (
                                                <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                                                    <td className="p-3">{inst.fee_group}</td>
                                                    <td className="p-3">{inst.fee_type}</td>
                                                    <td className="p-3">{inst.due_date}</td>
                                                    <td className="p-3 text-right pr-12">
                                                        {inst.fine_type === 'None' ? '0.00' : inst.fine_value}
                                                    </td>
                                                    <td className="p-3 text-right font-medium">{Number(inst.amount).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-muted/50 font-bold">
                                            <tr>
                                                <td colSpan="4" className="p-3 text-right">Total Fees</td>
                                                <td className="p-3 text-right">
                                                    {installments.reduce((acc, curr) => acc + Number(curr.amount), 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {!isAssigned && (
                                    <div className="flex justify-end mt-6">
                                        <Button onClick={handleSave} disabled={loading} className="bg-gray-600 hover:bg-gray-700">
                                            <Save className="mr-2 h-4 w-4"/>
                                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default QuickFees;
