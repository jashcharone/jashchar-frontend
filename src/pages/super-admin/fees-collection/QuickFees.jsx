import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { addMonths, setDate, format, parseISO } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Plus, Trash2, Printer, Calculator, Users, FileText, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { formatDate, formatDateForInput } from '@/utils/dateUtils';

const QuickFees = () => {
    const { user, currentSessionId, organizationId } = useAuth();
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
        fineType: 'none',
        fineValue: '0'
    });
    const [installments, setInstallments] = useState([]);
    const [isAssigned, setIsAssigned] = useState(false);
    const [assignedGroupId, setAssignedGroupId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    
    // ?? NEW: Enhanced State for Auto-Installment Generator
    const [activeTab, setActiveTab] = useState('single');           // 'single' | 'bulk' | 'template'
    const [feeTemplates, setFeeTemplates] = useState([]);           // Available fee templates
    const [installmentPlans, setInstallmentPlans] = useState([]);   // Pre-defined installment plans
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);   // For bulk assignment
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, status: 'idle' });
    const [templateHeads, setTemplateHeads] = useState([]);         // Fee heads from selected template
    const [autoDetectedPlan, setAutoDetectedPlan] = useState(null); // AI auto-detected plan suggestion
    
    // ? FIX: Use selectedBranch.id OR fallback to user profile branch_id
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    useEffect(() => {
        if (!branchId) return;
        const fetchClassesAndSections = async () => {
            const { data: classesData } = await supabase.from('classes').select('id, name').eq('branch_id', branchId);
            setClasses(classesData || []);
        };
        fetchClassesAndSections();
        
        // ?? NEW: Fetch Fee Templates and Installment Plans
        const fetchTemplatesAndPlans = async () => {
            // Fetch fee templates
            const { data: templates } = await supabase
                .from('fee_templates')
                .select('id, template_name, template_code, total_amount')
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .eq('is_active', true);
            setFeeTemplates(templates || []);
            
            // Fetch installment plans
            const { data: plans } = await supabase
                .from('fee_installment_plans')
                .select('*')
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .eq('is_active', true);
            setInstallmentPlans(plans || []);
        };
        fetchTemplatesAndPlans();
    }, [branchId, currentSessionId]);

    useEffect(() => {
        if (selectedClass && branchId) {
             const fetchSections = async () => {
                // Filter sections by branch_id using inner join
                const { data } = await supabase.from('class_sections')
                    .select('sections!inner(id, name)')
                    .eq('class_id', selectedClass)
                    .eq('sections.branch_id', branchId);
                setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
            };
            fetchSections();
        } else {
            setSections([]);
        }
        setSelectedSection('all');
    }, [selectedClass, branchId]);

    useEffect(() => {
        if (selectedClass && currentSessionId && branchId) {
            const fetchStudents = async () => {
                // Filter by current session and branch - using student_profiles table
                let query = supabase.from('student_profiles')
                    .select('id, full_name, enrollment_id, session_id')
                    .eq('branch_id', branchId)
                    .eq('class_id', selectedClass)
                    .eq('status', 'active')
                    .eq('session_id', currentSessionId);

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
    }, [selectedClass, selectedSection, branchId, currentSessionId, toast]);
    
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
        setFeeData({ totalFees: '1000', firstInstallment: '100', numInstallments: '9', monthlyDueDate: '10', fineType: 'none', fineValue: '0' });
        setInstallments([]);
        setIsAssigned(false);
        setAssignedGroupId(null);
    }
    
    const checkForAssignedFees = async (studentId, student) => {
        if (!student) return;
        setFetching(true);
        const groupName = `Quick Fees - ${student.enrollment_id}`;
        const { data: feeGroups, error } = await supabase.from('fee_groups').select('id').eq('name', groupName).eq('branch_id', branchId).eq('session_id', currentSessionId);

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
                fine_type: m.fine_type || 'none',
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
                fee_group: `Quick Fees - ${selectedStudent.enrollment_id}`,
                fee_type: 'Installment-1',
                fee_code: `QF-${selectedStudent.enrollment_id}-1`,
                due_date: new Date().toISOString().split('T')[0], // Due today or configurable? Assuming today for 1st.
                fine_type: feeData.fineType || 'none',
                fine_value: feeData.fineValue || 0,
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
                fee_group: `Quick Fees - ${selectedStudent.enrollment_id}`,
                fee_type: `Installment-${i + (Number(feeData.firstInstallment) > 0 ? 2 : 1)}`,
                fee_code: `QF-${selectedStudent.enrollment_id}-${i + (Number(feeData.firstInstallment) > 0 ? 2 : 1)}`,
                due_date: dueDate.toISOString().split('T')[0],
                fine_type: feeData.fineType || 'none',
                fine_value: feeData.fineValue || 0,
                amount: installmentAmount.toFixed(2),
            });
        }

        setInstallments(generated);
    };

    // ?? NEW: Handle Template Selection
    const handleSelectTemplate = async (templateId) => {
        const actualId = templateId === '__manual__' ? '' : templateId;
        setSelectedTemplate(actualId);
        if (!actualId) {
            setTemplateHeads([]);
            setFeeData(prev => ({ ...prev, totalFees: '0' }));
            return;
        }
        
        // Fetch template heads/splits
        const { data: splits } = await supabase
            .from('fee_head_splits')
            .select('*, fee_heads(name, code)')
            .eq('template_id', templateId);
            
        setTemplateHeads(splits || []);
        
        // Calculate total from template splits
        const total = (splits || []).reduce((sum, s) => sum + Number(s.amount || 0), 0);
        setFeeData(prev => ({ ...prev, totalFees: String(total) }));
        
        // Auto-suggest installment plan based on template
        autoDetectInstallmentPlan(total);
    };
    
    // ?? NEW: Handle Installment Plan Selection
    const handleSelectPlan = (planId) => {
        const actualId = planId === '__custom__' ? '' : planId;
        setSelectedPlan(actualId);
        if (!actualId) return;
        
        const plan = installmentPlans.find(p => p.id === planId);
        if (plan) {
            setFeeData(prev => ({
                ...prev,
                numInstallments: String(plan.installments || 0),
                monthlyDueDate: String(plan.due_day || 10),
                fineType: plan.late_fee_type || 'none',
                fineValue: plan.late_fee_amount || ''
            }));
        }
    };
    
    // ?? NEW: Auto-detect best installment plan based on total fees
    const autoDetectInstallmentPlan = useCallback((totalAmount) => {
        if (installmentPlans.length === 0) return;
        
        // Find plan that matches the pattern (e.g., quarterly for >50k, monthly for <20k)
        let suggestedPlan = null;
        
        if (totalAmount >= 100000) {
            suggestedPlan = installmentPlans.find(p => p.frequency === 'quarterly' || p.frequency === 'half_yearly');
        } else if (totalAmount >= 50000) {
            suggestedPlan = installmentPlans.find(p => p.frequency === 'quarterly');
        } else {
            suggestedPlan = installmentPlans.find(p => p.frequency === 'monthly');
        }
        
        if (!suggestedPlan) suggestedPlan = installmentPlans[0];
        
        setAutoDetectedPlan({
            plan: suggestedPlan,
            reason: totalAmount >= 100000 
                ? 'Higher total - Quarterly/Half-Yearly recommended'
                : totalAmount >= 50000 
                ? 'Medium total - Quarterly recommended'
                : 'Lower total - Monthly suggested'
        });
    }, [installmentPlans]);
    
    // ?? NEW: Toggle student selection for bulk assignment
    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };
    
    // ?? NEW: Select/Deselect all students
    const toggleAllStudents = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };
    
    // ?? NEW: Bulk Assign Installments to Multiple Students
    const handleBulkAssign = async () => {
        if (selectedStudents.length === 0) {
            toast({ variant: 'destructive', title: 'No Students Selected', description: 'Please select students for bulk assignment.' });
            return;
        }
        
        if (!feeData.totalFees || !feeData.numInstallments) {
            toast({ variant: 'destructive', title: 'Missing Configuration', description: 'Please configure fee amount and installments first.' });
            return;
        }
        
        setLoading(true);
        setBulkProgress({ current: 0, total: selectedStudents.length, status: 'running' });
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < selectedStudents.length; i++) {
            const studentId = selectedStudents[i];
            const student = students.find(s => s.id === studentId);
            
            try {
                await assignFeesToStudent(student);
                successCount++;
            } catch (error) {
                console.error(`Failed for ${student?.full_name}:`, error);
                errorCount++;
            }
            
            setBulkProgress({ current: i + 1, total: selectedStudents.length, status: 'running' });
        }
        
        setBulkProgress(prev => ({ ...prev, status: 'completed' }));
        setLoading(false);
        
        toast({
            title: 'Bulk Assignment Complete',
            description: `${successCount} successful, ${errorCount} failed`,
            variant: errorCount > 0 ? 'warning' : 'default'
        });
        
        // Refresh student list
        setSelectedStudents([]);
    };
    
    // ?? NEW: Assign fees to a single student (reusable for bulk)
    const assignFeesToStudent = async (student) => {
        if (!student || !branchId) throw new Error('Invalid student or branch');
        
        const installmentAmount = Number(feeData.numInstallments) > 0 
            ? (Number(feeData.totalFees) - Number(feeData.firstInstallment || 0)) / Number(feeData.numInstallments) 
            : 0;
            
        const groupName = `Quick Fees - ${student.enrollment_id}`;
        
        // Check if already assigned
        const { data: existingGroup } = await supabase
            .from('fee_groups')
            .select('id')
            .eq('name', groupName)
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId)
            .maybeSingle();
            
        if (existingGroup) {
            throw new Error('Fees already assigned to this student');
        }
        
        // Create Fee Group
        const { data: feeGroup, error: groupError } = await supabase
            .from('fee_groups')
            .insert({ 
                branch_id: branchId, 
                session_id: currentSessionId, 
                organization_id: organizationId, 
                name: groupName, 
                description: 'Auto-generated quick fees' 
            })
            .select()
            .single();
        if (groupError) throw groupError;
        
        // Generate installments
        const installmentsToCreate = [];
        let currentDate = new Date();
        
        if (Number(feeData.firstInstallment) > 0) {
            installmentsToCreate.push({
                fee_type: 'Installment-1',
                fee_code: `QF-${student.enrollment_id}-1`,
                due_date: new Date().toISOString().split('T')[0],
                amount: Number(feeData.firstInstallment)
            });
        }
        
        for (let i = 0; i < Number(feeData.numInstallments); i++) {
            const nextMonth = addMonths(currentDate, i + (Number(feeData.firstInstallment) > 0 ? 1 : 0));
            const dueDate = setDate(nextMonth, Number(feeData.monthlyDueDate));
            
            installmentsToCreate.push({
                fee_type: `Installment-${i + (Number(feeData.firstInstallment) > 0 ? 2 : 1)}`,
                fee_code: `QF-${student.enrollment_id}-${i + (Number(feeData.firstInstallment) > 0 ? 2 : 1)}`,
                due_date: dueDate.toISOString().split('T')[0],
                amount: installmentAmount
            });
        }
        
        // Create fee types and masters
        const feeMastersToInsert = [];
        
        for (const inst of installmentsToCreate) {
            let { data: feeType } = await supabase
                .from('fee_types')
                .select('id')
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .eq('code', inst.fee_code)
                .maybeSingle();
                
            if (!feeType) {
                const { data: newFeeType, error: newTypeError } = await supabase
                    .from('fee_types')
                    .insert({ 
                        branch_id: branchId, 
                        session_id: currentSessionId, 
                        organization_id: organizationId, 
                        name: inst.fee_type, 
                        code: inst.fee_code, 
                        description: 'Quick Fees Installment' 
                    })
                    .select()
                    .single();
                if (newTypeError) throw newTypeError;
                feeType = newFeeType;
            }
            
            feeMastersToInsert.push({
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
                fee_group_id: feeGroup.id,
                fee_type_id: feeType.id,
                due_date: inst.due_date,
                amount: inst.amount,
                fine_type: feeData.fineType || 'none',
                fine_value: feeData.fineValue || 0
            });
        }
        
        const { data: feeMasters, error: masterError } = await supabase
            .from('fee_masters')
            .insert(feeMastersToInsert)
            .select();
        if (masterError) throw masterError;
        
        // Create allocations
        const allocations = feeMasters.map(master => ({ 
            branch_id: branchId, 
            session_id: currentSessionId, 
            organization_id: organizationId, 
            student_id: student.id, 
            fee_master_id: master.id, 
            fee_group_id: feeGroup.id, 
            id: uuidv4() 
        }));
        
        const { error: allocError } = await supabase
            .from('student_fee_allocations')
            .insert(allocations);
        if (allocError) throw allocError;
        
        return true;
    };
    
    const handleSave = async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            // 1. Create Fee Group
            const groupName = `Quick Fees - ${selectedStudent.enrollment_id}`;
            const { data: feeGroup, error: groupError } = await supabase.from('fee_groups').insert({ branch_id: branchId, session_id: currentSessionId, organization_id: organizationId, name: groupName, description: 'Auto-generated quick fees' }).select().single();
            if (groupError) throw groupError;

            const feeMastersToInsert = [];
            
            // Pre-fetch existing types to minimize queries? Or just upsert.
            // Let's create unique codes for types to avoid collision: "QF-[SchoolCode]-[InstNumber]"
            
            for (const inst of installments) {
                // 2. Check if Fee Type exists or create it
                 let { data: feeType, error: typeError } = await supabase.from('fee_types').select('id').eq('branch_id', branchId).eq('session_id', currentSessionId).eq('code', inst.fee_code).maybeSingle();
                if (typeError) throw typeError;

                if (!feeType) {
                    const { data: newFeeType, error: newTypeError } = await supabase.from('fee_types').insert({ branch_id: branchId, session_id: currentSessionId, organization_id: organizationId, name: inst.fee_type, code: inst.fee_code, description: 'Quick Fees Installment' }).select().single();
                    if (newTypeError) throw newTypeError;
                    feeType = newFeeType;
                }
                
                // 3. Prepare Fee Master
                feeMastersToInsert.push({
                    branch_id: branchId,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                    fee_group_id: feeGroup.id,
                    fee_type_id: feeType.id,
                    due_date: inst.due_date,
                    amount: inst.amount,
                    fine_type: inst.fine_type || 'none',
                    fine_value: inst.fine_value || 0,
                });
            }
            
            // 4. Batch insert Fee Masters
            const { data: feeMasters, error: masterError } = await supabase.from('fee_masters').insert(feeMastersToInsert).select();
            if (masterError) throw masterError;

            // 5. Batch insert Allocations
            const allocations = feeMasters.map(master => ({ branch_id: branchId, session_id: currentSessionId, organization_id: organizationId, student_id: selectedStudentId, fee_master_id: master.id, fee_group_id: feeGroup.id, id: uuidv4() }));
            const { error: allocError } = await supabase.from('student_fee_allocations').insert(allocations);
            
            if (allocError) throw allocError;

            toast({ title: 'Success', description: 'Fee assigned successfully' });
            setIsAssigned(true);
            setAssignedGroupId(feeGroup.id);
            // Keep installments visible

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Operation Failed', description: error.message });
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
            const {data: masters, error: masterError} = await supabase.from('fee_masters').select('id').eq('fee_group_id', assignedGroupId);
            if (masterError) throw masterError;

            if (masters && masters.length > 0) {
                const masterIds = masters.map(m => m.id);
                // Check for payments before deleting
                const {data: payments, error: paymentError} = await supabase.from('fee_payments').select('id').in('fee_master_id', masterIds).limit(1);
                if (paymentError) throw paymentError;

                if (payments && payments.length > 0) {
                    toast({ variant: 'destructive', title: 'Cannot Unassign', description: 'Payments have been made against these fees. Please revert payments first.' });
                    setLoading(false);
                    return;
                }

                // Delete allocations first
                const { error: delAllocError } = await supabase.from('student_fee_allocations').delete().in('fee_master_id', masterIds);
                if (delAllocError) throw delAllocError;

                // Delete masters
                const { error: delMasterError } = await supabase.from('fee_masters').delete().in('id', masterIds);
                if (delMasterError) throw delMasterError;
            }
            
            // Delete group
            const { error: delGroupError } = await supabase.from('fee_groups').delete().eq('id', assignedGroupId);
            if (delGroupError) throw delGroupError;
            
            toast({title: "Fees Unassigned Successfully"});
            setIsAssigned(false);
            setAssignedGroupId(null);
            setInstallments([]);
            // resetForm(); 
         } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Unassign Failed', description: error.message });
         } finally {
             setLoading(false);
         }
    }

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-yellow-500" />
                        Quick Fees - Auto Installment Generator
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Generate and assign installment plans in seconds</p>
                </div>
                <div className="flex gap-2">
                    {feeTemplates.length > 0 && (
                        <Badge variant="outline" className="px-3 py-1">
                            <FileText className="h-3 w-3 mr-1" />
                            {feeTemplates.length} Templates
                        </Badge>
                    )}
                    {installmentPlans.length > 0 && (
                        <Badge variant="outline" className="px-3 py-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {installmentPlans.length} Plans
                        </Badge>
                    )}
                </div>
            </div>

            <div className="bg-card p-6 rounded-lg shadow space-y-6">
                {/* Class & Section Selection */}
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
                    {/* Template Selection - Enhanced */}
                    <div className="space-y-2">
                        <Label>Fee Template (Optional)</Label>
                        <Select value={selectedTemplate || '__manual__'} onValueChange={handleSelectTemplate}>
                            <SelectTrigger><SelectValue placeholder="Auto-fill from template" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__manual__">Manual Entry</SelectItem>
                                {feeTemplates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.template_name} - ?{Number(t.total_amount || 0).toLocaleString()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {/* Mode Tabs - Single/Bulk/Template */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="single" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Single Student
                        </TabsTrigger>
                        <TabsTrigger value="bulk" className="flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Bulk Assign
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Preview & Summary
                        </TabsTrigger>
                    </TabsList>
                    
                    {/* SINGLE STUDENT MODE */}
                    <TabsContent value="single" className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Student</Label>
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!selectedClass}>
                                    <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                                    <SelectContent>
                                        {students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.enrollment_id})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Installment Plan (Optional)</Label>
                                <Select value={selectedPlan || '__custom__'} onValueChange={handleSelectPlan}>
                                    <SelectTrigger><SelectValue placeholder="Use pre-defined plan" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__custom__">Custom Configuration</SelectItem>
                                        {installmentPlans.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.plan_name} - {p.frequency}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {/* Auto-detected Plan Suggestion */}
                        {autoDetectedPlan && !selectedPlan && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-yellow-600" />
                                            AI Suggestion: {autoDetectedPlan.plan?.plan_name || 'Standard Plan'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{autoDetectedPlan.reason}</p>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleSelectPlan(autoDetectedPlan.plan?.id)}
                                    >
                                        Apply Suggestion
                                    </Button>
                                </div>
                            </div>
                        )}

                {fetching ? (
                    <div className="flex justify-center items-center h-20 border-t pt-4">
                        <Loader2 className="animate-spin h-8 w-8 text-primary"/>
                    </div>
                ) : selectedStudent && (
                    <div className="pt-6 border-t space-y-6">
                        {/* Info Message if Assigned */}
                        {isAssigned && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 flex justify-between items-center rounded-r-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <p className="font-bold">Fee assigned successfully to {selectedStudent.full_name}</p>
                                </div>
                            </div>
                        )}

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
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="fixed">Fix Amount</SelectItem>
                                                <SelectItem value="percentage">Percentage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fine Type Value <span className="text-red-500">*</span></Label>
                                        <Input 
                                            type="number" 
                                            value={feeData.fineValue} 
                                            onChange={e => setFeeData({...feeData, fineValue: e.target.value})} 
                                            disabled={feeData.fineType === 'none'}
                                        />
                                    </div>
                                    <div>
                                        <Button onClick={handleViewInstallments} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                                            <Calculator className="mr-2 h-4 w-4" />
                                            Generate Installments
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {installments.length > 0 && (
                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        Generated Installment Schedule
                                    </h3>
                                    <div className="space-x-2">
                                        {isAssigned && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
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
                                                <th className="p-3 font-medium text-muted-foreground">Fine Amount (?)</th>
                                                <th className="p-3 font-medium text-muted-foreground text-right">Amount (?)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {installments.map((inst, idx) => (
                                                <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                                                    <td className="p-3">{inst.fee_group}</td>
                                                    <td className="p-3">{inst.fee_type}</td>
                                                    <td className="p-3">{formatDate(inst.due_date)}</td>
                                                    <td className="p-3 text-right pr-12">
                                                        {inst.fine_type === 'none' ? '0.00' : inst.fine_value}
                                                    </td>
                                                    <td className="p-3 text-right font-medium">?{Number(inst.amount).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gradient-to-r from-green-50 to-emerald-50 font-bold">
                                            <tr>
                                                <td colSpan="4" className="p-3 text-right">Total Fees</td>
                                                <td className="p-3 text-right text-green-600">
                                                    ?{installments.reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {!isAssigned && (
                                    <div className="flex justify-end mt-6">
                                        <Button onClick={handleSave} disabled={loading} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                                            <Save className="mr-2 h-4 w-4"/>
                                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save & Assign Fees'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                    </TabsContent>
                    
                    {/* BULK ASSIGN MODE */}
                    <TabsContent value="bulk" className="space-y-6 pt-4">
                        {/* Fee Configuration for Bulk */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Total Fees <span className="text-red-500">*</span></Label>
                                <Input type="number" value={feeData.totalFees} onChange={e => setFeeData({...feeData, totalFees: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>No. of Installments <span className="text-red-500">*</span></Label>
                                <Input type="number" min="1" value={feeData.numInstallments} onChange={e => setFeeData({...feeData, numInstallments: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Day (Monthly)</Label>
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
                                <Label>Installment Plan</Label>
                                <Select value={selectedPlan || '__custom__'} onValueChange={handleSelectPlan}>
                                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__custom__">Custom</SelectItem>
                                        {installmentPlans.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.plan_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {/* Student Selection Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 p-3 flex justify-between items-center border-b">
                                <div className="flex items-center gap-4">
                                    <Checkbox 
                                        checked={selectedStudents.length === students.length && students.length > 0}
                                        onCheckedChange={toggleAllStudents}
                                    />
                                    <span className="font-medium">Select All Students</span>
                                </div>
                                <Badge variant="secondary">
                                    {selectedStudents.length} of {students.length} selected
                                </Badge>
                            </div>
                            
                            <div className="max-h-[400px] overflow-y-auto">
                                {students.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Select a class to load students</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30 sticky top-0">
                                            <tr className="text-left border-b">
                                                <th className="p-3 w-12"></th>
                                                <th className="p-3">Code</th>
                                                <th className="p-3">Student Name</th>
                                                <th className="p-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map(student => (
                                                <tr 
                                                    key={student.id} 
                                                    className={`border-b hover:bg-muted/20 cursor-pointer ${selectedStudents.includes(student.id) ? 'bg-blue-50' : ''}`}
                                                    onClick={() => toggleStudentSelection(student.id)}
                                                >
                                                    <td className="p-3">
                                                        <Checkbox 
                                                            checked={selectedStudents.includes(student.id)}
                                                            onCheckedChange={() => toggleStudentSelection(student.id)}
                                                        />
                                                    </td>
                                                    <td className="p-3 font-mono text-xs">{student.enrollment_id}</td>
                                                    <td className="p-3 font-medium">{student.full_name}</td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className="text-xs">Active</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                        
                        {/* Bulk Progress */}
                        {bulkProgress.status !== 'idle' && (
                            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                        {bulkProgress.status === 'running' ? 'Processing...' : 'Completed'}
                                    </span>
                                    <span className="text-sm">
                                        {bulkProgress.current} / {bulkProgress.total}
                                    </span>
                                </div>
                                <Progress value={(bulkProgress.current / bulkProgress.total) * 100} />
                            </div>
                        )}
                        
                        {/* Bulk Assign Button */}
                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setSelectedStudents([])}
                                disabled={selectedStudents.length === 0}
                            >
                                Clear Selection
                            </Button>
                            <Button 
                                onClick={handleBulkAssign}
                                disabled={loading || selectedStudents.length === 0}
                                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                ) : (
                                    <><Users className="mr-2 h-4 w-4" /> Bulk Assign to {selectedStudents.length} Students</>
                                )}
                            </Button>
                        </div>
                    </TabsContent>
                    
                    {/* PREVIEW & SUMMARY MODE */}
                    <TabsContent value="preview" className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Summary Card 1: Configuration */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Calculator className="h-5 w-5 text-blue-600" />
                                    Fee Configuration
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Fees:</span>
                                        <span className="font-medium">?{Number(feeData.totalFees || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">1st Installment:</span>
                                        <span className="font-medium">?{Number(feeData.firstInstallment || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Balance:</span>
                                        <span className="font-medium">?{balanceFees.toLocaleString()}</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">No. of EMIs:</span>
                                        <span className="font-medium">{feeData.numInstallments}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Per EMI:</span>
                                        <span className="font-medium text-green-600">
                                            ?{(Number(feeData.numInstallments) > 0 ? balanceFees / Number(feeData.numInstallments) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Summary Card 2: Template Info */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                    Template Info
                                </h3>
                                {selectedTemplate ? (
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium">
                                            {feeTemplates.find(t => t.id === selectedTemplate)?.template_name || 'N/A'}
                                        </p>
                                        <p className="text-muted-foreground">
                                            Code: {feeTemplates.find(t => t.id === selectedTemplate)?.template_code || 'N/A'}
                                        </p>
                                        {templateHeads.length > 0 && (
                                            <>
                                                <hr className="my-2" />
                                                <p className="font-medium text-xs uppercase text-muted-foreground">Fee Heads:</p>
                                                {templateHeads.slice(0, 4).map((h, i) => (
                                                    <div key={i} className="flex justify-between text-xs">
                                                        <span>{h.fee_heads?.name || 'Head'}</span>
                                                        <span>?{Number(h.amount || 0).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                {templateHeads.length > 4 && (
                                                    <p className="text-xs text-muted-foreground">+{templateHeads.length - 4} more...</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No template selected (manual entry)</p>
                                )}
                            </div>
                            
                            {/* Summary Card 3: Plan Info */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-green-600" />
                                    Installment Plan
                                </h3>
                                {selectedPlan ? (
                                    <div className="space-y-2 text-sm">
                                        {(() => {
                                            const plan = installmentPlans.find(p => p.id === selectedPlan);
                                            return plan ? (
                                                <>
                                                    <p className="font-medium">{plan.plan_name}</p>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Frequency:</span>
                                                        <Badge variant="outline">{plan.frequency}</Badge>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Due Day:</span>
                                                        <span>{plan.due_day || feeData.monthlyDueDate}</span>
                                                    </div>
                                                    {plan.late_fee_type && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Late Fee:</span>
                                                            <span>{plan.late_fee_type === 'fixed' ? `?${plan.late_fee_amount}` : `${plan.late_fee_amount}%`}</span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : null;
                                        })()}
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium">Custom Configuration</p>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Due Day:</span>
                                            <span>{feeData.monthlyDueDate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fine Type:</span>
                                            <span>{feeData.fineType}</span>
                                        </div>
                                        {feeData.fineType !== 'none' && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Fine Value:</span>
                                                <span>{feeData.fineType === 'fixed' ? `₹${feeData.fineValue}` : `${feeData.fineValue}%`}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex justify-center gap-4 pt-4">
                            <Button variant="outline" onClick={() => setActiveTab('single')}>
                                <Users className="mr-2 h-4 w-4" />
                                Assign to Single Student
                            </Button>
                            <Button variant="outline" onClick={() => setActiveTab('bulk')}>
                                <Calculator className="mr-2 h-4 w-4" />
                                Bulk Assign
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default QuickFees;
